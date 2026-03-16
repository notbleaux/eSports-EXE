"""
SATOR API — Main FastAPI Application
Aggregates all hub services: SATOR, tokens, forum, fantasy, challenges, wiki, opera
"""

import os
import logging
import secrets
from datetime import datetime, timezone
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

# Import rate limiting
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

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
from src.betting.routes import router as betting_router
from src.notifications.routes import router as notification_router

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
    
    try:
        await db.close()
        logger.info("Database connection closed")
    except Exception as e:
        logger.warning(f"Database close error (may not have been connected): {e}")


# Create FastAPI application
app = FastAPI(
    title="SATOR Esports API",
    description="""
    Libre-X-eSport 4NJZ4 TENET Platform API
    
    Provides endpoints for:
    - **SATOR**: Esports analytics hub (players, teams, matches, stats)
    - **Tokens**: NJZ token economy (daily claims, transfers, leaderboards)
    - **Forum**: Community discussions (threads, posts, replies)
    - **Fantasy**: Fantasy esports leagues (drafts, teams, scoring)
    - **Challenges**: Daily challenges and achievements
    - **Wiki**: Knowledge base and guides
    - **OPERA**: Tournament metadata and schedules
    
    WebSocket:
    - `/ws/sator` - Real-time SATOR updates
    """,
    version="2.1.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
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


# Health check endpoints (no auth required, no rate limiting)
@app.get("/health", tags=["health"])
async def health_check():
    """Basic health check endpoint."""
    return {
        "status": "healthy",
        "service": "sator-api",
        "version": "2.1.0",
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/ready", tags=["health"])
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


@app.get("/live", tags=["health"])
async def liveness_check():
    """Liveness check - basic process health."""
    return {"status": "alive"}


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


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """API root - provides basic info and links."""
    return {
        "name": "SATOR Esports API",
        "version": "2.1.0",
        "description": "Libre-X-eSport 4NJZ4 TENET Platform",
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
