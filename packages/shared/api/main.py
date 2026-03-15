"""
SATOR API — Main FastAPI Application
Aggregates all hub services: SATOR, tokens, forum, fantasy, challenges, wiki, opera
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import os
import logging

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
from src.sator.routes import router as sator_router
from src.sator.websocket import handle_websocket, ws_manager

# Import database manager
from axiom_esports_data.api.src.db_manager import db

# Import firewall middleware
from axiom_esports_data.api.src.middleware.firewall import FirewallMiddleware

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# JWT Secret validation (P0 Security Fix)
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not JWT_SECRET_KEY:
    if os.getenv("ENVIRONMENT") == "production":
        raise RuntimeError("JWT_SECRET_KEY must be set in production environment!")
    else:
        logger.warning("JWT_SECRET_KEY not set, using development fallback!")
        JWT_SECRET_KEY = "dev-jwt-secret-do-not-use-in-production"

# Rate limiter setup (P0 Security Fix)
limiter = Limiter(key_func=get_remote_address)


class SecurityHeadersMiddleware:
    """Add security headers to all responses (P0 Security Fix)."""
    
    async def __call__(self, request: Request, call_next):
        response = await call_next(request)
        # HSTS
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        # X-Frame-Options
        response.headers["X-Frame-Options"] = "DENY"
        # X-Content-Type-Options
        response.headers["X-Content-Type-Options"] = "nosniff"
        # Content Security Policy (basic)
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'"
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        # X-XSS-Protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager - handles startup and shutdown."""
    # Startup
    logger.info("Starting SATOR API...")
    try:
        await db.connect()
        logger.info("Database connected successfully")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down SATOR API...")
    await db.close()
    logger.info("Database connection closed")


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
    version="0.2.0",
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
        "version": "0.2.0",
        "timestamp": __import__('datetime').datetime.utcnow().isoformat(),
    }


@app.get("/ready", tags=["health"])
async def readiness_check():
    """Readiness check for orchestration platforms."""
    try:
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
        "timestamp": __import__('datetime').datetime.utcnow().isoformat(),
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


# WebSocket endpoint
@app.websocket("/ws/sator")
async def sator_websocket(websocket: WebSocket):
    """WebSocket endpoint for SATOR live updates."""
    await handle_websocket(websocket)


# Root endpoint
@app.get("/", tags=["root"])
async def root():
    """API root - provides basic info and links."""
    return {
        "name": "SATOR Esports API",
        "version": "0.2.0",
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
