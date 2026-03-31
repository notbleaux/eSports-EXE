"""
Observability Setup

Convenience module for initializing all observability components.
[Ver001.000]

Usage:
    from njz_api.observability import setup_observability
    
    app = FastAPI()
    setup_observability(app)
"""

import os
import logging
from typing import Optional

from fastapi import FastAPI

logger = logging.getLogger(__name__)


def setup_observability(
    app: FastAPI,
    service_name: Optional[str] = None,
    enable_tracing: bool = True,
    enable_metrics: bool = True,
    enable_profiling: bool = False,
) -> dict:
    """
    Setup all observability components.
    
    This function initializes:
    - Distributed tracing (OpenTelemetry)
    - Metrics collection (Prometheus)
    - Request instrumentation
    - Database tracing
    - Cache tracing
    
    Args:
        app: FastAPI application instance
        service_name: Service name for tracing (default: njz-api)
        enable_tracing: Enable distributed tracing
        enable_metrics: Enable Prometheus metrics
        enable_profiling: Enable profiling (development only)
    
    Returns:
        Dictionary with initialized components
    
    Example:
        >>> from fastapi import FastAPI
        >>> from njz_api.observability import setup_observability
        >>> 
        >>> app = FastAPI()
        >>> observability = setup_observability(app, service_name="njz-api")
        >>> 
        >>> # Access components
        >>> tracer = observability["tracer"]
        >>> traced_db = observability["database"]
    """
    components = {
        "tracer": None,
        "database": None,
        "cache": None,
        "websocket": None,
    }
    
    service_name = service_name or os.getenv("OTEL_SERVICE_NAME", "njz-api")
    
    # Setup distributed tracing
    if enable_tracing and os.getenv("TRACING_ENABLED", "true").lower() == "true":
        try:
            from .tracing import init_tracing
            
            tracer = init_tracing(app, service_name=service_name)
            components["tracer"] = tracer
            
            logger.info(f"Observability: Tracing initialized for {service_name}")
            
        except Exception as e:
            logger.warning(f"Observability: Failed to initialize tracing: {e}")
    
    # Setup database tracing (lazy initialization)
    if enable_tracing:
        try:
            from .database_tracing import get_traced_pool
            components["database"] = get_traced_pool
            logger.info("Observability: Database tracing ready")
        except Exception as e:
            logger.warning(f"Observability: Failed to setup database tracing: {e}")
    
    # Setup cache tracing (lazy initialization)
    if enable_tracing:
        try:
            from .cache_tracing import get_traced_redis
            components["cache"] = get_traced_redis
            logger.info("Observability: Cache tracing ready")
        except Exception as e:
            logger.warning(f"Observability: Failed to setup cache tracing: {e}")
    
    # Setup WebSocket tracing
    if enable_tracing:
        try:
            from .websocket_tracing import get_websocket_tracer
            components["websocket"] = get_websocket_tracer()
            logger.info("Observability: WebSocket tracing ready")
        except Exception as e:
            logger.warning(f"Observability: Failed to setup WebSocket tracing: {e}")
    
    # Log status
    enabled_components = [k for k, v in components.items() if v is not None]
    logger.info(f"Observability: Enabled components - {', '.join(enabled_components)}")
    
    return components


def setup_tracing_middleware(app: FastAPI):
    """
    Add tracing middleware to FastAPI app.
    
    This adds middleware that creates spans for each request
    and propagates trace context.
    """
    from fastapi import Request
    from starlette.middleware.base import BaseHTTPMiddleware
    
    from .tracing import get_tracing_manager, TraceAttributes
    
    class TracingMiddleware(BaseHTTPMiddleware):
        async def dispatch(self, request: Request, call_next):
            tracer = get_tracing_manager()
            
            # Skip health checks
            if request.url.path in ["/health", "/ready", "/metrics", "/live"]:
                return await call_next(request)
            
            # Extract trace context from headers
            trace_context = tracer.extract_context(dict(request.headers))
            
            with tracer.start_span(
                f"{request.method} {request.url.path}",
                attributes={
                    TraceAttributes.HTTP_METHOD: request.method,
                    TraceAttributes.HTTP_URL: str(request.url),
                    TraceAttributes.HTTP_ROUTE: request.url.path,
                    TraceAttributes.HTTP_USER_AGENT: request.headers.get("user-agent"),
                }
            ):
                try:
                    response = await call_next(request)
                    tracer.set_attributes({
                        TraceAttributes.HTTP_STATUS_CODE: response.status_code,
                    })
                    return response
                except Exception as e:
                    tracer.record_exception(e)
                    raise
    
    app.add_middleware(TracingMiddleware)
    logger.info("Observability: Tracing middleware added")


def get_health_status() -> dict:
    """
    Get observability health status.
    
    Returns status of all observability components.
    """
    status = {
        "tracing": {"enabled": False, "healthy": False},
        "metrics": {"enabled": False, "healthy": False},
        "database_tracing": {"enabled": False, "healthy": False},
        "cache_tracing": {"enabled": False, "healthy": False},
    }
    
    # Check tracing
    try:
        from .tracing import OPENTELEMETRY_AVAILABLE, get_tracing_manager
        status["tracing"]["enabled"] = OPENTELEMETRY_AVAILABLE
        if OPENTELEMETRY_AVAILABLE:
            tracer = get_tracing_manager()
            status["tracing"]["healthy"] = tracer.enabled
            status["tracing"]["service_name"] = tracer.service_name
            status["tracing"]["backend"] = tracer.backend.value if tracer.enabled else None
    except Exception as e:
        status["tracing"]["error"] = str(e)
    
    # Check database tracing
    try:
        from .database_tracing import _traced_pool
        status["database_tracing"]["enabled"] = True
        status["database_tracing"]["healthy"] = _traced_pool is not None
    except Exception:
        pass
    
    # Check cache tracing
    try:
        from .cache_tracing import _traced_client
        status["cache_tracing"]["enabled"] = True
        status["cache_tracing"]["healthy"] = _traced_client is not None
    except Exception:
        pass
    
    return status
