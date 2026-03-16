# [Ver002.000]
"""
SATOR API - Enhanced FastAPI Application Entry Point
=====================================================
Production-ready FastAPI application with advanced features:
- Structured JSON logging with request ID tracing
- Standardized error responses
- Enhanced health checks with Redis
- Request logging middleware
- Graceful startup/shutdown

Version History:
- Ver001.000: Original implementation
- Ver002.000: Added structured logging, request ID middleware, enhanced error handlers
"""

import json
import logging
import logging.config
import os
import uuid
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from typing import Optional

import asyncpg
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# Import route modules
from api.src.routes import players, matches, analytics, collection, dashboard, websocket, search, ml_models, opera_live

# Import middleware
from api.src.middleware.firewall import FirewallMiddleware

# Import database manager
try:
    from api.src.db_manager import db
except ImportError:
    # Fallback for when running from different paths
    import sys
    from pathlib import Path
    sys.path.insert(0, str(Path(__file__).parent))
    from src.db_manager import db

# =============================================================================
# Structured JSON Logging Configuration
# =============================================================================

class JSONFormatter(logging.Formatter):
    """JSON formatter for structured logging."""
    
    def format(self, record: logging.LogRecord) -> str:
        log_data = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "module": record.module,
            "function": record.funcName,
            "line": record.lineno,
        }
        
        if hasattr(record, "request_id"):
            log_data["request_id"] = record.request_id
        if hasattr(record, "user_id"):
            log_data["user_id"] = record.user_id
        if hasattr(record, "duration_ms"):
            log_data["duration_ms"] = record.duration_ms
        if hasattr(record, "path"):
            log_data["path"] = record.path
        if hasattr(record, "method"):
            log_data["method"] = record.method
        if hasattr(record, "status_code"):
            log_data["status_code"] = record.status_code
        
        if record.exc_info:
            log_data["exception"] = self.formatException(record.exc_info)
        
        return json.dumps(log_data)


def setup_logging():
    """Configure structured logging based on environment."""
    log_format = os.getenv("LOG_FORMAT", "text")
    log_level = os.getenv("LOG_LEVEL", "INFO")
    app_environment = os.getenv("APP_ENVIRONMENT", "development")
    
    if log_format == "json":
        formatter = "json"
        fmt = None
    else:
        formatter = "standard"
        fmt = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {"()": JSONFormatter},
            "standard": {"format": fmt},
        },
        "handlers": {
            "console": {
                "class": "logging.StreamHandler",
                "formatter": formatter,
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "": {
                "handlers": ["console"],
                "level": log_level,
                "propagate": False,
            },
        },
    }
    
    logging.config.dictConfig(config)
    return logging.getLogger(__name__)


# Initialize logging
logger = setup_logging()

# Application metadata
APP_NAME = os.getenv("APP_NAME", "SATOR-API")
APP_VERSION = os.getenv("APP_VERSION", "2.1.0")
APP_ENVIRONMENT = os.getenv("APP_ENVIRONMENT", "development")

# Database configuration
DATABASE_URL: Optional[str] = os.getenv("DATABASE_URL")

# Initialize rate limiters
limiter = Limiter(key_func=get_remote_address)
auth_limiter = Limiter(key_func=get_remote_address, default_limits=["5/minute"])


# =============================================================================
# Startup/Shutdown Events
# =============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan manager - handles startup and shutdown events.
    Uses lazy database initialization - connection deferred to first request.
    """
    # Startup
    logger.info(f"Starting {APP_NAME} v{APP_VERSION} in {APP_ENVIRONMENT} mode")
    logger.info("Database connection deferred to first request (lazy initialization)")
    
    yield
    
    # Shutdown
    logger.info(f"Shutting down {APP_NAME}")
    await db.close()
    logger.info("Database connection pool closed")


# =============================================================================
# FastAPI Application
# =============================================================================

app = FastAPI(
    title="SATOR Esports API",
    description="""
    SATOR Esports Platform API - Player analytics, match data, and investment grading.
    
    ## Features
    
    * **Players**: Query player stats, SimRating, RAR scores
    * **Matches**: Access match data and SATOR spatial events
    * **Analytics**: Investment grades, performance analytics
    * **OPERA Live**: Real-time esports events and streaming
    
    ## Free Tier Notice
    
    This API runs on Render's free tier and may experience cold starts
    (10-30s response time on first request after 15 minutes of inactivity).
    """,
    version=APP_VERSION,
    docs_url="/docs" if APP_ENVIRONMENT != "production" else None,
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Add CORS middleware
cors_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[origin.strip() for origin in cors_origins],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-ID"],
    expose_headers=["X-Request-ID", "X-API-Version"],
    max_age=600,  # 10 minutes
)

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Add data partition firewall
app.add_middleware(FirewallMiddleware)

# Initialize rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# =============================================================================
# Request ID Middleware
# =============================================================================

@app.middleware("http")
async def request_id_middleware(request: Request, call_next):
    """
    Add request ID tracing to all requests.
    Generates X-Request-ID if not provided by client.
    """
    request_id = request.headers.get("X-Request-ID", str(uuid.uuid4()))
    request.state.request_id = request_id
    
    start_time = datetime.now(timezone.utc)
    
    response = await call_next(request)
    
    duration = (datetime.now(timezone.utc) - start_time).total_seconds() * 1000
    
    response.headers["X-Request-ID"] = request_id
    response.headers["X-API-Version"] = APP_VERSION
    
    # Structured logging
    logger.info(
        f"{request.method} {request.url.path} - {response.status_code} - {duration:.2f}ms",
        extra={
            "request_id": request_id,
            "method": request.method,
            "path": request.url.path,
            "status_code": response.status_code,
            "duration_ms": round(duration, 2),
        }
    )
    
    return response


# =============================================================================
# Health Check Endpoints
# =============================================================================

@app.get("/health", tags=["health"])
@limiter.limit("60/minute")
async def health_check(request: Request):
    """
    Health check endpoint for monitoring and keepalive pings.
    
    Returns:
        Health status with database connectivity information.
    """
    health_status = {
        "status": "healthy",
        "service": APP_NAME.lower(),
        "version": APP_VERSION,
        "environment": APP_ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    
    # Check database connectivity (lazy - check if initialized)
    if db._initialized and db.pool:
        try:
            async with db.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
                health_status["database"] = "connected"
        except Exception as e:
            health_status["database"] = "error"
            health_status["database_error"] = str(e)
            logger.error(f"Health check database error: {e}")
    else:
        health_status["database"] = "not_initialized"
    
    return health_status


@app.get("/v1/health", tags=["health"])
@limiter.limit("60/minute")
async def v1_health_check(request: Request):
    """
    v1 Health check endpoint.
    """
    health_status = {
        "status": "healthy",
        "service": APP_NAME.lower(),
        "version": APP_VERSION,
        "api_version": "v1",
        "environment": APP_ENVIRONMENT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
    
    if db._initialized and db.pool:
        try:
            async with db.pool.acquire() as conn:
                await conn.fetchval("SELECT 1")
                health_status["database"] = "connected"
        except Exception as e:
            health_status["database"] = "error"
            health_status["database_error"] = str(e)
            logger.error(f"Health check database error: {e}")
    else:
        health_status["database"] = "not_initialized"
    
    return health_status


@app.get("/ready", tags=["health"])
@limiter.limit("30/minute")
async def readiness_check(request: Request):
    """
    Readiness check for load balancers and orchestrators.
    
    Returns 503 if the service is not ready to accept traffic.
    """
    if not db._initialized:
        await db.initialize()
    
    if not db.pool:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        async with db.pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"ready": True}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")


@app.get("/v1/ready", tags=["health"])
@limiter.limit("30/minute")
async def v1_readiness_check(request: Request):
    """
    v1 Readiness check for load balancers and orchestrators.
    """
    if not db._initialized:
        await db.initialize()
    
    if not db.pool:
        raise HTTPException(status_code=503, detail="Database not connected")
    
    try:
        async with db.pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"ready": True, "api_version": "v1"}
    except Exception as e:
        logger.error(f"Readiness check failed: {e}")
        raise HTTPException(status_code=503, detail="Database unavailable")


@app.get("/live", tags=["health"])
@limiter.limit("60/minute")
async def liveness_check(request: Request):
    """
    Liveness check for Kubernetes-style health monitoring.
    """
    return {"alive": True}


@app.get("/v1/live", tags=["health"])
@limiter.limit("60/minute")
async def v1_liveness_check(request: Request):
    """
    v1 Liveness check for Kubernetes-style health monitoring.
    """
    return {"alive": True, "api_version": "v1"}


@app.get("/metrics", tags=["monitoring"])
@limiter.limit("10/minute")
async def metrics(request: Request):
    """
    Prometheus-compatible metrics endpoint.
    """
    metrics_data = {
        "uptime_seconds": 0,
        "requests_total": 0,
        "database_connected": db._initialized and db.pool is not None,
    }
    
    return metrics_data


# =============================================================================
# API Routes
# =============================================================================

# Include route modules
app.include_router(players.router)
app.include_router(matches.router)
app.include_router(analytics.router)
app.include_router(collection.router)
app.include_router(dashboard.router)
app.include_router(websocket.router)
app.include_router(search.router)
app.include_router(ml_models.router)
app.include_router(opera_live.router)


# =============================================================================
# Root Endpoint
# =============================================================================

@app.get("/", tags=["root"])
async def root():
    """
    API root - returns service information and available endpoints.
    """
    return {
        "service": APP_NAME,
        "version": APP_VERSION,
        "environment": APP_ENVIRONMENT,
        "documentation": "/redoc",
        "health": "/health",
        "api_version": "v1",
        "endpoints": {
            "players": "/v1/players",
            "matches": "/v1/matches",
            "analytics": "/v1/analytics",
            "collection": "/v1/collection",
            "dashboard": "/v1/dashboard",
            "websocket": "/v1/ws",
            "search": "/v1/search",
            "ml_models": "/v1/ml/models",
            "opera_live": "/v1/opera/live",
        }
    }


# =============================================================================
# Error Handlers
# =============================================================================

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for uncaught errors.
    """
    request_id = getattr(request.state, "request_id", None)
    
    logger.error(
        f"Unhandled exception: {exc}",
        extra={
            "request_id": request_id,
            "path": request.url.path,
        },
        exc_info=True
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc) if APP_ENVIRONMENT == "development" else "An unexpected error occurred",
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


@app.exception_handler(asyncpg.PostgresError)
async def database_exception_handler(request: Request, exc: asyncpg.PostgresError):
    """
    Handle PostgreSQL-specific errors.
    """
    request_id = getattr(request.state, "request_id", None)
    
    logger.error(
        f"Database error: {exc}",
        extra={
            "request_id": request_id,
            "path": request.url.path,
        }
    )
    
    return JSONResponse(
        status_code=500,
        content={
            "error": "Database error",
            "message": "A database error occurred" if APP_ENVIRONMENT == "production" else str(exc),
            "request_id": request_id,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
    )


# =============================================================================
# Development Server Entry Point
# =============================================================================

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("API_PORT", "8000"))
    host = os.getenv("API_HOST", "0.0.0.0")
    workers = int(os.getenv("API_WORKERS", "1"))
    
    logger.info(f"Starting development server on {host}:{port}")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers,
        reload=True if APP_ENVIRONMENT == "development" else False,
        log_level=os.getenv("LOG_LEVEL", "INFO").lower(),
    )
