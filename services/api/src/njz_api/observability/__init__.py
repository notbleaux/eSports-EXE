"""
Observability Module

Provides distributed tracing, metrics, and monitoring capabilities.
[Ver002.000]
"""

from .tracing import (
    TracingManager,
    TracingBackend,
    TraceAttributes,
    get_tracing_manager,
    init_tracing,
    trace_function,
    trace_db_query,
    trace_cache_operation,
)

from .database_tracing import (
    TracedPool,
    TracedConnection,
    get_traced_pool,
    close_traced_pool,
)

from .cache_tracing import (
    TracedRedis,
    get_traced_redis,
    close_traced_redis,
    cached,
)

from .websocket_tracing import (
    WebSocketTracer,
    GodotTraceBridge,
    get_websocket_tracer,
    get_godot_trace_bridge,
    traced_websocket_handler,
)

__all__ = [
    # Tracing
    "TracingManager",
    "TracingBackend",
    "TraceAttributes",
    "get_tracing_manager",
    "init_tracing",
    "trace_function",
    "trace_db_query",
    "trace_cache_operation",
    # Database
    "TracedPool",
    "TracedConnection",
    "get_traced_pool",
    "close_traced_pool",
    # Cache
    "TracedRedis",
    "get_traced_redis",
    "close_traced_redis",
    "cached",
    # WebSocket
    "WebSocketTracer",
    "GodotTraceBridge",
    "get_websocket_tracer",
    "get_godot_trace_bridge",
    "traced_websocket_handler",
]
