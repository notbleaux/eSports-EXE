"""
Distributed Tracing

OpenTelemetry tracing for cross-service observability.
[Ver002.000] - Enhanced with auto-instrumentation and custom spans

Performance Target: <100ms trace overhead per request
"""

import os
import time
import logging
import functools
from contextlib import contextmanager
from typing import Optional, Dict, Any, Callable, TypeVar
from enum import Enum

logger = logging.getLogger(__name__)

# Try to import OpenTelemetry
try:
    from opentelemetry import trace
    from opentelemetry.sdk.trace import TracerProvider, Status, StatusCode
    from opentelemetry.sdk.trace.export import BatchSpanProcessor, SimpleSpanProcessor
    from opentelemetry.sdk.resources import Resource, SERVICE_NAME, SERVICE_VERSION, DEPLOYMENT_ENVIRONMENT
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
    from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter as HTTPOTLPSpanExporter
    from opentelemetry.exporter.jaeger.thrift import JaegerExporter
    from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
    from opentelemetry.instrumentation.redis import RedisInstrumentor
    from opentelemetry.instrumentation.asyncpg import AsyncPGInstrumentor
    from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
    from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
    from opentelemetry.baggage.propagation import W3CBaggagePropagator
    
    OPENTELEMETRY_AVAILABLE = True
except ImportError as e:
    OPENTELEMETRY_AVAILABLE = False
    logger.warning(f"OpenTelemetry not installed. Tracing disabled: {e}")


class TracingBackend(Enum):
    """Supported tracing backends."""
    JAEGER = "jaeger"
    OTLP_GRPC = "otlp_grpc"
    OTLP_HTTP = "otlp_http"
    CONSOLE = "console"


class TraceAttributes:
    """Standard trace attribute names."""
    # HTTP
    HTTP_METHOD = "http.method"
    HTTP_URL = "http.url"
    HTTP_STATUS_CODE = "http.status_code"
    HTTP_ROUTE = "http.route"
    HTTP_USER_AGENT = "http.user_agent"
    
    # Database
    DB_SYSTEM = "db.system"
    DB_STATEMENT = "db.statement"
    DB_OPERATION = "db.operation"
    DB_SQL_TABLE = "db.sql.table"
    DB_DURATION_MS = "db.duration_ms"
    DB_ROWS_AFFECTED = "db.rows_affected"
    
    # Cache
    CACHE_KEY = "cache.key"
    CACHE_HIT = "cache.hit"
    CACHE_DURATION_MS = "cache.duration_ms"
    
    # Application
    APP_COMPONENT = "app.component"
    APP_OPERATION = "app.operation"
    APP_ENTITY_ID = "app.entity.id"
    APP_ENTITY_TYPE = "app.entity.type"
    
    # Error
    ERROR_TYPE = "error.type"
    ERROR_MESSAGE = "error.message"


T = TypeVar('T')


class TracingManager:
    """
    OpenTelemetry tracing manager with auto-instrumentation.
    
    Provides distributed tracing for API requests with support for:
    - FastAPI auto-instrumentation
    - Redis auto-instrumentation
    - PostgreSQL (asyncpg) auto-instrumentation
    - HTTPX auto-instrumentation
    - Custom spans for business logic
    - Multiple backends (Jaeger, OTLP, Console)
    
    Performance Target: <100ms overhead per request
    """
    
    def __init__(
        self,
        service_name: str = "njz-api",
        service_version: str = "2.1.0",
        environment: str = "development",
        backend: TracingBackend = TracingBackend.JAEGER,
        endpoint: Optional[str] = None,
        enabled: bool = True,
        sample_rate: float = 1.0,
        max_queue_size: int = 2048,
        max_export_batch_size: int = 512,
        schedule_delay_millis: int = 5000,
    ):
        self.service_name = service_name
        self.service_version = service_version
        self.environment = environment
        self.backend = backend
        self.endpoint = endpoint
        self.enabled = enabled and OPENTELEMETRY_AVAILABLE
        self.sample_rate = sample_rate
        self._tracer: Optional[Any] = None
        self._propagator = TraceContextTextMapPropagator()
        self._baggage_propagator = W3CBaggagePropagator()
        
        # Batch processor settings for performance
        self.max_queue_size = max_queue_size
        self.max_export_batch_size = max_export_batch_size
        self.schedule_delay_millis = schedule_delay_millis
        
        if self.enabled:
            self._init_tracer()
    
    def _init_tracer(self):
        """Initialize OpenTelemetry tracer with auto-instrumentation."""
        if not OPENTELEMETRY_AVAILABLE:
            return
        
        try:
            # Create resource with service information
            resource = Resource.create({
                SERVICE_NAME: self.service_name,
                SERVICE_VERSION: self.service_version,
                DEPLOYMENT_ENVIRONMENT: self.environment,
                "service.namespace": "njz-platform",
                "service.instance.id": os.getenv("HOSTNAME", "unknown"),
            })
            
            # Create provider with sampler
            from opentelemetry.sdk.trace.sampling import TraceIdRatioBased
            sampler = TraceIdRatioBased(self.sample_rate)
            provider = TracerProvider(resource=resource, sampler=sampler)
            
            # Configure exporter based on backend
            exporter = self._create_exporter()
            
            if exporter:
                # Use BatchSpanProcessor for better performance
                processor = BatchSpanProcessor(
                    exporter,
                    max_queue_size=self.max_queue_size,
                    max_export_batch_size=self.max_export_batch_size,
                    schedule_delay_millis=self.schedule_delay_millis,
                )
                provider.add_span_processor(processor)
                
                # Also add simple processor for console output if in debug mode
                if self.environment == "development" and os.getenv("TRACE_CONSOLE", "false").lower() == "true":
                    from opentelemetry.sdk.trace.export import ConsoleSpanExporter
                    console_processor = SimpleSpanProcessor(ConsoleSpanExporter())
                    provider.add_span_processor(console_processor)
            
            # Set provider
            trace.set_tracer_provider(provider)
            
            # Get tracer
            self._tracer = trace.get_tracer(__name__)
            
            logger.info(f"Tracing initialized: {self.service_name} ({self.backend.value})")
            
        except Exception as e:
            logger.error(f"Failed to initialize tracing: {e}")
            self.enabled = False
    
    def _create_exporter(self):
        """Create span exporter based on backend configuration."""
        try:
            if self.backend == TracingBackend.JAEGER:
                # Jaeger Thrift exporter (UDP)
                host = self.endpoint or os.getenv("JAEGER_AGENT_HOST", "jaeger")
                port = int(os.getenv("JAEGER_AGENT_PORT", "6831"))
                return JaegerExporter(
                    agent_host_name=host,
                    agent_port=port,
                )
            
            elif self.backend == TracingBackend.OTLP_GRPC:
                endpoint = self.endpoint or os.getenv("OTLP_ENDPOINT", "http://localhost:4317")
                return OTLPSpanExporter(endpoint=endpoint, insecure=True)
            
            elif self.backend == TracingBackend.OTLP_HTTP:
                endpoint = self.endpoint or os.getenv("OTLP_HTTP_ENDPOINT", "http://localhost:4318/v1/traces")
                return HTTPOTLPSpanExporter(endpoint=endpoint)
            
            elif self.backend == TracingBackend.CONSOLE:
                from opentelemetry.sdk.trace.export import ConsoleSpanExporter
                return ConsoleSpanExporter()
            
            else:
                logger.warning(f"Unknown tracing backend: {self.backend}")
                return None
                
        except Exception as e:
            logger.error(f"Failed to create exporter: {e}")
            return None
    
    def instrument_fastapi(self, app):
        """Auto-instrument FastAPI application."""
        if not self.enabled:
            return
        
        try:
            FastAPIInstrumentor.instrument_app(
                app,
                excluded_urls="health,ready,metrics",  # Exclude health checks
            )
            logger.info("FastAPI instrumented")
        except Exception as e:
            logger.error(f"Failed to instrument FastAPI: {e}")
    
    def instrument_redis(self):
        """Auto-instrument Redis client."""
        if not self.enabled:
            return
        
        try:
            RedisInstrumentor().instrument()
            logger.info("Redis instrumented")
        except Exception as e:
            logger.error(f"Failed to instrument Redis: {e}")
    
    def instrument_asyncpg(self):
        """Auto-instrument asyncpg (PostgreSQL)."""
        if not self.enabled:
            return
        
        try:
            AsyncPGInstrumentor().instrument()
            logger.info("AsyncPG instrumented")
        except Exception as e:
            logger.error(f"Failed to instrument AsyncPG: {e}")
    
    def instrument_httpx(self):
        """Auto-instrument HTTPX client."""
        if not self.enabled:
            return
        
        try:
            HTTPXClientInstrumentor().instrument()
            logger.info("HTTPX instrumented")
        except Exception as e:
            logger.error(f"Failed to instrument HTTPX: {e}")
    
    def instrument_all(self, app=None):
        """Instrument all supported libraries."""
        if app:
            self.instrument_fastapi(app)
        self.instrument_redis()
        self.instrument_asyncpg()
        self.instrument_httpx()
    
    @contextmanager
    def start_span(
        self,
        name: str,
        attributes: Optional[Dict[str, Any]] = None,
        kind: Optional[Any] = None,
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
        
        span_kind = kind or trace.SpanKind.INTERNAL
        
        with self._tracer.start_as_current_span(name, kind=span_kind) as span:
            if attributes:
                for key, value in attributes.items():
                    if value is not None:
                        span.set_attribute(key, value)
            yield span
    
    def start_db_span(
        self,
        operation: str,
        table: Optional[str] = None,
        statement: Optional[str] = None,
    ):
        """Start a database operation span."""
        attributes = {
            TraceAttributes.DB_OPERATION: operation,
            TraceAttributes.APP_COMPONENT: "database",
        }
        if table:
            attributes[TraceAttributes.DB_SQL_TABLE] = table
        if statement:
            # Truncate long statements
            attributes[TraceAttributes.DB_STATEMENT] = statement[:1000] if len(statement) > 1000 else statement
        
        return self.start_span(f"db.{operation}", attributes)
    
    def start_cache_span(
        self,
        operation: str,
        key: Optional[str] = None,
    ):
        """Start a cache operation span."""
        attributes = {
            TraceAttributes.APP_OPERATION: operation,
            TraceAttributes.APP_COMPONENT: "cache",
        }
        if key:
            attributes[TraceAttributes.CACHE_KEY] = key[:100] if len(key) > 100 else key
        
        return self.start_span(f"cache.{operation}", attributes)
    
    def add_event(
        self,
        name: str,
        attributes: Optional[Dict[str, Any]] = None,
        timestamp: Optional[int] = None,
    ):
        """Add an event to the current span."""
        if not self.enabled:
            return
        
        try:
            current_span = trace.get_current_span()
            if current_span:
                current_span.add_event(name, attributes or {}, timestamp)
        except Exception as e:
            logger.debug(f"Failed to add event: {e}")
    
    def record_exception(
        self,
        exception: Exception,
        attributes: Optional[Dict[str, Any]] = None,
    ):
        """Record an exception in the current span."""
        if not self.enabled:
            return
        
        try:
            current_span = trace.get_current_span()
            if current_span:
                current_span.record_exception(exception, attributes)
                current_span.set_status(Status(StatusCode.ERROR, str(exception)))
        except Exception as e:
            logger.debug(f"Failed to record exception: {e}")
    
    def set_attributes(self, attributes: Dict[str, Any]):
        """Set attributes on the current span."""
        if not self.enabled:
            return
        
        try:
            current_span = trace.get_current_span()
            if current_span:
                for key, value in attributes.items():
                    if value is not None:
                        current_span.set_attribute(key, value)
        except Exception as e:
            logger.debug(f"Failed to set attributes: {e}")
    
    def get_current_context(self) -> Dict[str, str]:
        """Get current trace context for propagation."""
        if not self.enabled:
            return {}
        
        try:
            carrier = {}
            self._propagator.inject(carrier)
            return carrier
        except Exception as e:
            logger.debug(f"Failed to get context: {e}")
            return {}
    
    def extract_context(self, carrier: Dict[str, str]) -> Any:
        """Extract trace context from carrier (e.g., HTTP headers)."""
        if not self.enabled:
            return None
        
        try:
            return self._propagator.extract(carrier)
        except Exception as e:
            logger.debug(f"Failed to extract context: {e}")
            return None


def trace_function(
    name: Optional[str] = None,
    attributes: Optional[Dict[str, Any]] = None,
    component: Optional[str] = None,
):
    """
    Decorator to trace function execution.
    
    Usage:
        @trace_function("process_player", component="analytics")
        async def process_player(player_id: str):
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        span_name = name or func.__name__
        base_attributes = attributes or {}
        if component:
            base_attributes[TraceAttributes.APP_COMPONENT] = component
        
        @functools.wraps(func)
        async def async_wrapper(*args, **kwargs):
            manager = get_tracing_manager()
            
            # Extract function arguments as attributes
            func_attrs = {
                "function.name": func.__name__,
                "function.args_count": len(args),
                "function.kwargs_keys": list(kwargs.keys()),
                **base_attributes,
            }
            
            with manager.start_span(span_name, func_attrs):
                try:
                    start_time = time.time()
                    result = await func(*args, **kwargs)
                    duration = (time.time() - start_time) * 1000
                    manager.set_attributes({"function.duration_ms": duration})
                    return result
                except Exception as e:
                    manager.record_exception(e)
                    raise
        
        @functools.wraps(func)
        def sync_wrapper(*args, **kwargs):
            manager = get_tracing_manager()
            
            func_attrs = {
                "function.name": func.__name__,
                "function.args_count": len(args),
                "function.kwargs_keys": list(kwargs.keys()),
                **base_attributes,
            }
            
            with manager.start_span(span_name, func_attrs):
                try:
                    start_time = time.time()
                    result = func(*args, **kwargs)
                    duration = (time.time() - start_time) * 1000
                    manager.set_attributes({"function.duration_ms": duration})
                    return result
                except Exception as e:
                    manager.record_exception(e)
                    raise
        
        return async_wrapper if asyncio.iscoroutinefunction(func) else sync_wrapper
    
    return decorator


def trace_db_query(operation: str, table: Optional[str] = None):
    """
    Decorator to trace database queries.
    
    Usage:
        @trace_db_query("SELECT", table="players")
        async def get_player(player_id: str):
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            manager = get_tracing_manager()
            
            # Try to extract query from kwargs or first arg
            statement = kwargs.get('query') or kwargs.get('sql') or (args[0] if args else None)
            
            with manager.start_db_span(operation, table, statement):
                try:
                    start_time = time.time()
                    result = await func(*args, **kwargs)
                    duration = (time.time() - start_time) * 1000
                    
                    # Add result metadata
                    if isinstance(result, list):
                        manager.set_attributes({TraceAttributes.DB_ROWS_AFFECTED: len(result)})
                    manager.set_attributes({TraceAttributes.DB_DURATION_MS: duration})
                    
                    return result
                except Exception as e:
                    manager.record_exception(e, {
                        TraceAttributes.ERROR_TYPE: type(e).__name__,
                        TraceAttributes.ERROR_MESSAGE: str(e),
                    })
                    raise
        
        return wrapper
    
    return decorator


def trace_cache_operation(operation: str):
    """
    Decorator to trace cache operations.
    
    Usage:
        @trace_cache_operation("get")
        async def get_cached_player(player_id: str):
            ...
    """
    def decorator(func: Callable[..., T]) -> Callable[..., T]:
        @functools.wraps(func)
        async def wrapper(*args, **kwargs):
            manager = get_tracing_manager()
            
            # Try to extract key from kwargs or first arg
            key = kwargs.get('key') or (args[0] if args else None)
            
            with manager.start_cache_span(operation, key):
                try:
                    start_time = time.time()
                    result = await func(*args, **kwargs)
                    duration = (time.time() - start_time) * 1000
                    
                    # Determine cache hit
                    is_hit = result is not None
                    manager.set_attributes({
                        TraceAttributes.CACHE_HIT: is_hit,
                        TraceAttributes.CACHE_DURATION_MS: duration,
                    })
                    
                    return result
                except Exception as e:
                    manager.record_exception(e)
                    raise
        
        return wrapper
    
    return decorator


# Global manager singleton
_tracing_manager: Optional[TracingManager] = None


def get_tracing_manager() -> TracingManager:
    """Get the global tracing manager."""
    global _tracing_manager
    if _tracing_manager is None:
        # Initialize from environment
        backend_str = os.getenv("TRACING_BACKEND", "jaeger").lower()
        try:
            backend = TracingBackend(backend_str)
        except ValueError:
            backend = TracingBackend.JAEGER
        
        _tracing_manager = TracingManager(
            service_name=os.getenv("OTEL_SERVICE_NAME", "njz-api"),
            service_version=os.getenv("OTEL_SERVICE_VERSION", "2.1.0"),
            environment=os.getenv("OTEL_ENVIRONMENT", "development"),
            backend=backend,
            endpoint=os.getenv("OTEL_EXPORTER_ENDPOINT"),
            enabled=os.getenv("TRACING_ENABLED", "true").lower() == "true",
            sample_rate=float(os.getenv("OTEL_SAMPLE_RATE", "1.0")),
        )
    return _tracing_manager


def init_tracing(
    app=None,
    service_name: str = "njz-api",
    backend: TracingBackend = TracingBackend.JAEGER,
):
    """
    Initialize tracing with all instrumentations.
    
    Usage:
        from njz_api.observability.tracing import init_tracing
        init_tracing(app, service_name="njz-api")
    """
    global _tracing_manager
    
    _tracing_manager = TracingManager(
        service_name=service_name,
        backend=backend,
    )
    
    _tracing_manager.instrument_all(app)
    
    return _tracing_manager


# Import asyncio for decorator checks
import asyncio
