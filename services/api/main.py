# Phase 4 migration: copied from packages/shared/api/main.py
# Original location preserved until all references are updated
"""
SATOR API — Main FastAPI Application
Aggregates all hub services: SATOR, tokens, forum, fantasy, challenges, wiki, opera

[Ver003.000] - Added OpenTelemetry distributed tracing
[Ver002.000] - Added Prometheus metrics endpoint
"""

import os
import logging
import secrets
import time
import asyncio
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse, PlainTextResponse

# Import rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import Prometheus client (optional)
try:
    from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST
    PROMETHEUS_AVAILABLE = True
except ImportError:
    PROMETHEUS_AVAILABLE = False
    logging.warning("Prometheus client not installed. Metrics endpoint will be limited.")

# Import observability/tracing (optional)
try:
    from src.njz_api.observability import setup_observability, get_health_status
    OBSERVABILITY_AVAILABLE = True
except ImportError:
    OBSERVABILITY_AVAILABLE = False
    logging.warning("Observability module not available. Tracing disabled.")

# Import route modules
from src.tokens.token_routes import router as token_router
from src.forum.forum_routes import router as forum_router
from src.fantasy.fantasy_routes import router as fantasy_router
from src.challenges.challenge_routes import router as challenge_router
from src.wiki.wiki_routes import router as wiki_router
from src.opera.opera_routes import router as opera_router
from src.auth.auth_routes import router as auth_router
from src.auth.oauth_routes import router as oauth_router
from src.sator.routes import router as sator_router
from src.sator.websocket import handle_websocket, ws_manager
from src.sator.rar_routes import router as rar_router
from src.rotas.map_routes import router as maps_router, handle_lens_websocket, simulate_lens_updates
from src.njz_api.analytics.router import router as analytics_router
from src.njz_api.routers.tournaments import router as tournaments_router
from src.betting.routes import router as betting_router
from src.notifications.routes import router as notification_router

# Import webhook handlers (Phase 4: Live Data Pipeline)
from src.webhooks import pandascore_router

# Import verification routes (Phase 4: Legacy Data Pipeline)
from src.verification import router as verification_router

# WebSocket Gateway (placeholder for unified gateway)
class WebSocketGateway:
    """Simple WebSocket gateway manager."""

    def __init__(self):
        self.connections: dict = {}

    async def connect(self, websocket, user_id: str):
        self.connections[user_id] = websocket
        await websocket.accept()

    async def disconnect(self, user_id: str):
        if user_id in self.connections:
            del self.connections[user_id]

    async def handle_message(self, user_id: str, data: str):
        # Placeholder message handler
        pass

gateway = WebSocketGateway()

# Placeholder gateway router
gateway_router = None  # Will be replaced if actual gateway routes exist

# Import database manager
from axiom_esports_data.api.src.db_manager import db

# Import firewall middleware
from axiom_esports_data.api.src.middleware.firewall import FirewallMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Secret validation (P0 Security Fix)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    if os.getenv("ENVIRONMENT", "").lower() in ("production", "prod"):
        raise RuntimeError("JWT_SECRET_KEY must be set in production environment!")
    else:
        logger.warning("JWT_SECRET_KEY not set, using development fallback!")
        JWT_SECRET_KEY = "dev-jwt-secret-do-not-use-in-production"

# Rate limiter setup (P0 Security Fix)
limiter = Limiter(key_func=get_remote_address)


class SecurityHeadersMiddleware:
    """Add security headers to all responses (P0 Security Fix)."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        async def send_with_security_headers(message):
            if message["type"] == "http.response.start":
                headers = list(message.get("headers", []))
                # HSTS
                headers.append([b"strict-transport-security", b"max-age=31536000; includeSubDomains"])
                # X-Frame-Options
                headers.append([b"x-frame-options", b"DENY"])
                # X-Content-Type-Options
                headers.append([b"x-content-type-options", b"nosniff"])
                # Content Security Policy (basic)
                headers.append([b"content-security-policy", b"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"])
                # Referrer Policy
                headers.append([b"referrer-policy", b"strict-origin-when-cross-origin"])
                # X-XSS-Protection
                headers.append([b"x-xss-protection", b"1; mode=block"])
                message["headers"] = headers
            await send(message)

        try:
            await self.app(scope, receive, send_with_security_headers)
        except Exception:
            # Return error response with security headers
            response = JSONResponse(
                status_code=500,
                content={"detail": "Internal Server Error"}
            )
            await response(scope, receive, send_with_security_headers)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handles startup and shutdown."""
    # Startup - LAZY INITIALIZATION (non-blocking)
    logger.info("Starting SATOR API...")

    # Initialize observability (tracing, metrics)
    if OBSERVABILITY_AVAILABLE:
        try:
            from src.njz_api.observability import setup_observability
            observability = setup_observability(
                app,
                service_name="njz-api",
                enable_tracing=True,
                enable_metrics=True,
            )
            logger.info("Observability initialized")
        except Exception as e:
            logger.warning(f"Observability initialization failed: {e}")

    # Don't block on DB connection - let first request trigger it
    logger.info("API initialized (database will connect on first request)")

    # Start background task for lens updates
    lens_task = asyncio.create_task(simulate_lens_updates())
    logger.info("Lens update simulation started")

    yield

    # Shutdown
    logger.info("Shutting down SATOR API...")

    # Cancel background task
    lens_task.cancel()
    try:
        await lens_task
    except asyncio.CancelledError:
        pass

    # Close traced connections if observability is enabled
    if OBSERVABILITY_AVAILABLE:
        try:
            from src.njz_api.observability import close_traced_pool, close_traced_redis
            await close_traced_pool()
            await close_traced_redis()
            logger.info("Traced connections closed")
        except Exception as e:
            logger.debug(f"Traced connections close error: {e}")

    try:
        await db.close()
        logger.info("Database connection closed")
    except Exception as e:
        logger.warning(f"Database close error (may not have been connected): {e}")


# Create FastAPI application
app = FastAPI(
    title="ESPORTEZ-MANAGER API",
    description="""
    # ESPORTEZ-MANAGER API
    
    Tournament management system with Godot game integration for esports analytics.
    Part of the NJZiteGeisTe Platform ecosystem.
    
    ## Features
    
    - **Tournament Management**: Create, manage, and track tournaments
    - **Match Operations**: Submit results from Godot game or manually
    - **Analytics**: SimRating, RAR, and investment grading calculations
    - **Real-time Updates**: WebSocket connections for live data
    - **Webhooks**: Pandascore integration for live match data
    - **Circuit Breakers**: Resilient external API calls
    
    ## Authentication
    
    All endpoints require Bearer token authentication (JWT) unless marked as public.
    
    ```
    Authorization: Bearer YOUR_JWT_TOKEN
    ```
    
    ## Rate Limiting
    
    | Endpoint Type | Limit | Burst |
    |--------------|-------|-------|
    | Standard API | 100/min | 20 |
    | Match Results | 10/min | 5 |
    | Analytics | 60/min | 10 |
    | Webhooks | 1000/min | 100 |
    | Health Checks | No limit | - |
    
    ## Architecture
    
    The API follows the TENET data topology with two data paths:
    
    - **Path A (Live)**: Pandascore webhook → Redis Stream → WebSocket
    - **Path B (Legacy)**: TeneT Key.Links → PostgreSQL → FastAPI
    
    ## Godot Integration
    
    The Godot game exports match results automatically:
    
    ```gdscript
    # In Godot LiveSeasonModule
    export_client.configure(
        "https://api.esportez-manager.com/api/v1",
        "your_api_key"
    )
    export_client.auto_export = true
    ```
    
    ## WebSocket Endpoints
    
    - `/ws/sator` - SATOR hub live updates
    - `/ws/lens-updates` - ROTAS lens real-time updates  
    - `/ws/gateway` - Unified TENET gateway
    
    ## Links
    
    - [API Guide](/docs/API_GUIDE.md)
    - [OpenAPI Spec](/docs/openapi.yaml)
    - [GitHub Repository](https://github.com/notbleaux/eSports-EXE)
    """,
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_tags=[
        {"name": "health", "description": "Health check endpoints (no auth required)"},
        {"name": "system", "description": "System health, metrics, and circuit breaker status"},
        {"name": "monitoring", "description": "Monitoring and observability endpoints"},
        {"name": "tournaments", "description": "Tournament management operations"},
        {"name": "teams", "description": "Team management"},
        {"name": "matches", "description": "Match operations and result submission"},
        {"name": "analytics", "description": "SimRating, RAR, and investment grading calculations"},
        {"name": "verification", "description": "TeneT verification and legacy data pipeline"},
        {"name": "webhooks", "description": "External webhook handlers (Pandascore)"},
    ],
)

# Register rate limiter (P0 Security Fix)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Add security headers middleware (P0 Security Fix)
app.add_middleware(SecurityHeadersMiddleware)

# Add firewall middleware (P0 Security Fix)
app.add_middleware(FirewallMiddleware)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# CORS configuration (P0 Security Fix - explicit headers)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://notbleaux.github.io",  # GitHub Pages production
        "https://notbleaux.github.io/eSports-EXE",
        "http://localhost:3000",         # Local development
        "http://localhost:5173",         # Vite dev server
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=[
        "Content-Type",
        "Authorization",
        "X-Requested-With",
        "Accept",
        "Origin",
        "X-Total-Count",
        "X-Page",
        "X-Page-Size",
    ],  # Removed "*" (P0 Security Fix)
    expose_headers=["X-Total-Count", "X-Page", "X-Page-Size"],
)


@app.get(
    "/health",
    tags=["health"],
    summary="Basic health check",
    description="""
    Basic health check endpoint.
    
    Returns API health status and basic metadata.
    No authentication required.
    
    ## Response
    ```json
    {
      "status": "healthy",
      "service": "sator-api",
      "version": "2.1.0",
      "timestamp": "2026-03-30T22:40:00+00:00"
    }
    ```
    """,
    response_description="Health status with service metadata",
)
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "sator-api",
        "version": "2.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get(
    "/ready",
    tags=["health"],
    summary="Readiness check",
    description="""
    Readiness check for orchestration platforms.
    
    Checks database connectivity and returns readiness status.
    Used by Kubernetes and other orchestration systems.
    
    No authentication required.
    
    ## Response
    ```json
    {
      "ready": true,
      "checks": {
        "database": true
      },
      "timestamp": "2026-03-30T22:40:00+00:00"
    }
    ```
    """,
    response_description="Readiness status with health checks",
)
async def readiness_check():
    """Readiness check for orchestration platforms."""
    try:
        # Lazy database connection
        if not db._initialized:
            await db.connect()

        # Quick DB check
        pool = db.pool
        if pool:
            async with pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
            db_status = "connected"
        else:
            db_status = "disconnected"
    except Exception as e:
        db_status = f"error: {str(e)}"

    return {
        "ready": db_status == "connected",
        "checks": {
            "database": db_status == "connected",
        },
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get(
    "/live",
    tags=["health"],
    summary="Liveness check",
    description="""
    Liveness check - basic process health.
    
    Simple endpoint that returns immediately if the process is running.
    Used by Kubernetes liveness probes.
    
    No authentication required.
    """,
    response_description="Process liveness status",
)
async def liveness_check():
    """Liveness check - basic process health."""
    return {"status": "alive"}


# Prometheus Metrics (if available)
if PROMETHEUS_AVAILABLE:
    # Request counter
    REQUEST_COUNT = Counter(
        'http_requests_total',
        'Total HTTP requests',
        ['method', 'endpoint', 'status']
    )

    # Request latency histogram
    REQUEST_LATENCY = Histogram(
        'http_request_duration_seconds',
        'HTTP request latency',
        ['method', 'endpoint']
    )

    # Active connections gauge
    ACTIVE_CONNECTIONS = Gauge(
        'websocket_active_connections',
        'Number of active WebSocket connections'
    )

    # Database connections gauge
    DB_CONNECTIONS = Gauge(
        'db_connections_active',
        'Active database connections'
    )


@app.get(
    "/metrics",
    tags=["monitoring", "system"],
    summary="Prometheus metrics",
    description="""
    Prometheus metrics endpoint.
    
    Returns metrics in Prometheus exposition format.
    Requires prometheus-client package.
    
    ## Available Metrics
    - `http_requests_total`: Total HTTP requests by method, endpoint, status
    - `http_request_duration_seconds`: Request latency histogram
    - `websocket_active_connections`: Number of active WebSocket connections
    - `db_connections_active`: Active database connections
    
    No authentication required.
    """,
    response_description="Prometheus metrics in exposition format",
)
async def metrics():
    """
    Prometheus metrics endpoint.

    Returns metrics in Prometheus exposition format.
    Requires prometheus-client package.
    """
    if not PROMETHEUS_AVAILABLE:
        # Return basic stats if Prometheus not available
        return JSONResponse({
            "status": "metrics_unavailable",
            "message": "prometheus-client not installed",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        })

    return PlainTextResponse(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


# Circuit Breaker System Status
from src.njz_api.middleware.circuit_breaker import get_circuit_breaker_status

@app.get(
    "/system/circuit-breakers",
    tags=["system", "monitoring"],
    summary="Get system circuit breaker status",
    description="""
    Get status of all circuit breakers.
    
    Returns detailed information about all circuit breakers in the system
    for operational monitoring and debugging.
    
    ## Circuit Breaker States
    - **closed**: Normal operation, requests pass through
    - **open**: Failure threshold reached, requests fail fast
    - **half_open**: Testing recovery with limited requests
    """,
    response_description="Circuit breaker status for all services",
)
async def system_circuit_breaker_status():
    """
    Get status of all circuit breakers.

    Returns detailed information about all circuit breakers in the system
    for operational monitoring and debugging.
    """
    return await get_circuit_breaker_status()


@app.get(
    "/system/observability",
    tags=["system", "monitoring"],
    summary="Get observability status",
    description="""
    Get status of observability components (tracing, metrics).
    
    Returns health status of:
    - Distributed tracing (OpenTelemetry)
    - Database tracing
    - Cache tracing
    - Prometheus metrics
    
    Useful for debugging observability issues.
    """,
    response_description="Observability component status",
)
async def system_observability_status():
    """
    Get status of observability components.
    
    Returns health status of tracing, metrics, and related components.
    """
    if not OBSERVABILITY_AVAILABLE:
        return {
            "status": "unavailable",
            "message": "Observability module not installed",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    
    return {
        "status": "available",
        **get_health_status(),
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


# Request timing middleware
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Track request metrics for Prometheus."""
    if not PROMETHEUS_AVAILABLE:
        return await call_next(request)

    start_time = time.time()

    try:
        response = await call_next(request)
        status_code = response.status_code
    except Exception as e:
        status_code = 500
        raise e
    finally:
        duration = time.time() - start_time

        # Record metrics
        REQUEST_COUNT.labels(
            method=request.method,
            endpoint=request.url.path,
            status=status_code
        ).inc()

        REQUEST_LATENCY.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)

    return response


# Include all service routers
# Auth routes (no prefix for /auth paths) - with rate limiting (P0 Security Fix)
app.include_router(
    auth_router,
    tags=["authentication"],
)

# OAuth routes
app.include_router(
    oauth_router,
    prefix="/api/auth/oauth",
    tags=["oauth"],
)

app.include_router(
    token_router,
    prefix="/api/tokens",
    tags=["tokens"],
)

app.include_router(
    forum_router,
    prefix="/api/forum",
    tags=["forum"],
)

app.include_router(
    fantasy_router,
    prefix="/api/fantasy",
    tags=["fantasy"],
)

app.include_router(
    challenge_router,
    prefix="/api/challenges",
    tags=["challenges"],
)

app.include_router(
    wiki_router,
    prefix="/api/wiki",
    tags=["wiki"],
)

app.include_router(
    opera_router,
    prefix="/api/opera",
    tags=["opera"],
)

app.include_router(
    sator_router,
    prefix="/api",
    tags=["sator"],
)

app.include_router(
    rar_router,
    prefix="/api",
    tags=["rar"],
)

# Analytics router (migrated from satorXrotas)
app.include_router(
    analytics_router,
    prefix="/api/v1",
    tags=["analytics"],
)

app.include_router(
    maps_router,
    prefix="/api",
    tags=["maps"],
)

app.include_router(
    betting_router,
    prefix="/api/betting",
    tags=["betting"],
)

# Include gateway router only if defined
if gateway_router:
    app.include_router(
        gateway_router,
        prefix="/api",
        tags=["gateway"],
    )

app.include_router(
    notification_router,
    prefix="/api",
    tags=["notifications"],
)

# Webhook handlers (Phase 4: Live Data Pipeline)
app.include_router(
    pandascore_router,
    tags=["webhooks"],
)

# Verification routes (Phase 4: Legacy Data Pipeline)
app.include_router(
    verification_router,
    prefix="/api",
    tags=["verification"],
)

# Tournament routes with circuit breaker protection
app.include_router(
    tournaments_router,
    prefix="/api/v1",
    tags=["tournaments"],
)


# WebSocket endpoints
@app.websocket("/ws/sator")
async def sator_websocket(websocket: WebSocket):
    """WebSocket endpoint for SATOR live updates."""
    await handle_websocket(websocket)


@app.websocket("/ws/lens-updates")
async def lens_updates_websocket(websocket: WebSocket):
    """WebSocket endpoint for ROTAS lens real-time updates."""
    await handle_lens_websocket(websocket)


@app.websocket("/ws/gateway")
async def unified_gateway(websocket: WebSocket):
    """
    Unified WebSocket gateway for TENET platform.

    Single connection endpoint that supports multiplexed channels
    for data updates, chat, and live events.

    **Channels:**
    - `global` - All connected users
    - `match:{id}` - Specific match channel
    - `lobby:{id}` - Specific lobby channel
    - `team:{id}` - Specific team channel
    - `hub:{name}` - Specific hub channel (sator, rotas, arepo, opera, tenet)

    **Message Types:**
    - `subscribe` - Subscribe to a channel
    - `unsubscribe` - Unsubscribe from a channel
    - `chat_message` - Send a chat message
    - `ping` - Heartbeat ping
    - `pong` - Heartbeat response
    """
    import secrets
    user_id = f"user_{secrets.token_hex(8)}"

    await gateway.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            await gateway.handle_message(user_id, data)
    except Exception as e:
        logger.info(f"WebSocket connection closed for {user_id}: {e}")
    finally:
        await gateway.disconnect(user_id)


@app.get(
    "/",
    tags=["root"],
    summary="API root",
    description="""
    API root - provides basic info and links.
    
    Returns API metadata, available endpoints, and WebSocket connections.
    Useful for API discovery.
    """,
    response_description="API metadata and endpoint links",
)
async def root():
    """API root - provides basic info and links."""
    return {
        "name": "SATOR Esports API",
        "version": "2.1.0",
        "description": "NJZiteGeisTe Platform",
        "documentation": "/docs",
        "health": "/health",
        "websocket": "/ws/sator",
        "endpoints": {
            "sator": "/api/sator",
            "auth": "/auth",
            "tokens": "/api/tokens",
            "forum": "/api/forum",
            "fantasy": "/api/fantasy",
            "challenges": "/api/challenges",
            "wiki": "/api/wiki",
            "opera": "/api/opera",
            "maps": "/api/maps",
            "betting": "/api/betting",
        },
        "websockets": {
            "sator": "/ws/sator",
            "lens_updates": "/ws/lens-updates",
        },
    }


if __name__ == "__main__":
    import uvicorn

    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", "8000"))
    reload = os.getenv("API_RELOAD", "false").lower() == "true"

    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=reload,
        log_level="info",
    )
