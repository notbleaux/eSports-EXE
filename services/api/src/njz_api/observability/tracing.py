"""
Distributed Tracing

OpenTelemetry tracing for request tracking across services.
"""

import logging
from contextlib import contextmanager
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Try to import OpenTelemetry
try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor
    from opentelemetry.sdk.resources import Resource, SERVICE_NAME
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    OPENTELEMETRY_AVAILABLE = True
except ImportError:
    OPENTELEMETRY_AVAILABLE = False
    logger.warning("OpenTelemetry not installed. Tracing disabled.")


class TracingManager:
    """
    OpenTelemetry tracing manager.
    
    Provides distributed tracing for API requests.
    """
    
    def __init__(
        self,
        service_name: str = "njz-api",
        otlp_endpoint: Optional[str] = None,
        enabled: bool = True
    ):
        self.service_name = service_name
        self.otlp_endpoint = otlp_endpoint or "http://localhost:4317"
        self.enabled = enabled and OPENTELEMETRY_AVAILABLE
        self._tracer: Optional[Any] = None
        
        if self.enabled:
            self._init_tracer()
    
    def _init_tracer(self):
        """Initialize OpenTelemetry tracer."""
        if not OPENTELEMETRY_AVAILABLE:
            return
        
        try:
            # Create resource
            resource = Resource.create({SERVICE_NAME: self.service_name})
            
            # Create provider
            provider = TracerProvider(resource=resource)
            
            # Create exporter
            exporter = OTLPSpanExporter(endpoint=self.otlp_endpoint)
            
            # Add processor
            processor = BatchSpanProcessor(exporter)
            provider.add_span_processor(processor)
            
            # Set provider
            trace.set_tracer_provider(provider)
            
            # Get tracer
            self._tracer = trace.get_tracer(__name__)
            
            logger.info(f"Tracing initialized for {self.service_name}")
            
        except Exception as e:
            logger.error(f"Failed to initialize tracing: {e}")
            self.enabled = False
    
    @contextmanager
    def start_span(
        self,
        name: str,
        attributes: Optional[Dict[str, Any]] = None
    ):
        """
        Start a new span for tracing.
        
        Usage:
            with tracing_manager.start_span("database_query", {"table": "players"}):
                result = db.query()
        """
        if not self.enabled or self._tracer is None:
            yield None
            return
        
        with self._tracer.start_as_current_span(name) as span:
            if attributes:
                for key, value in attributes.items():
                    span.set_attribute(key, value)
            yield span
    
    def add_event(
        self,
        name: str,
        attributes: Optional[Dict[str, Any]] = None
    ):
        """Add an event to the current span."""
        if not self.enabled:
            return
        
        try:
            from opentelemetry import trace
            current_span = trace.get_current_span()
            current_span.add_event(name, attributes or {})
        except Exception as e:
            logger.debug(f"Failed to add event: {e}")
    
    def record_exception(self, exception: Exception):
        """Record an exception in the current span."""
        if not self.enabled:
            return
        
        try:
            from opentelemetry import trace
            current_span = trace.get_current_span()
            current_span.record_exception(exception)
            current_span.set_status(trace.Status(trace.StatusCode.ERROR))
        except Exception as e:
            logger.debug(f"Failed to record exception: {e}")


# Global manager
_tracing_manager: Optional[TracingManager] = None


def get_tracing_manager() -> TracingManager:
    """Get the global tracing manager."""
    global _tracing_manager
    if _tracing_manager is None:
        _tracing_manager = TracingManager()
    return _tracing_manager


def trace_function(name: Optional[str] = None):
    """
    Decorator to trace function execution.
    
    Usage:
        @trace_function("process_player")
        async def process_player(player_id: str):
            ...
    """
    def decorator(func):
        span_name = name or func.__name__
        
        async def wrapper(*args, **kwargs):
            manager = get_tracing_manager()
            
            with manager.start_span(span_name, {
                "function": func.__name__,
                "args_count": len(args),
                "kwargs_keys": list(kwargs.keys())
            }):
                try:
                    return await func(*args, **kwargs)
                except Exception as e:
                    manager.record_exception(e)
                    raise
        
        return wrapper
    return decorator
