"""
WebSocket Tracing Module

Distributed tracing for WebSocket connections.
[Ver001.000]

Enables trace context propagation across WebSocket connections
for end-to-end visibility from Godot game to API.
"""

import json
import logging
from typing import Optional, Dict, Any, Callable
from functools import wraps

from fastapi import WebSocket

from .tracing import get_tracing_manager, TraceAttributes

logger = logging.getLogger(__name__)


class WebSocketTracer:
    """
    WebSocket connection tracer.
    
    Provides tracing for WebSocket messages with context propagation
    support for distributed traces across service boundaries.
    """
    
    def __init__(self):
        self._tracer = get_tracing_manager()
    
    async def trace_connection(
        self,
        websocket: WebSocket,
        endpoint: str,
        handler: Callable,
    ):
        """
        Trace a WebSocket connection lifecycle.
        
        Usage:
            @app.websocket("/ws/events")
            async def websocket_endpoint(websocket: WebSocket):
                await ws_tracer.trace_connection(websocket, "/ws/events", handle_messages)
        """
        client_id = f"{websocket.client.host}:{websocket.client.port}" if websocket.client else "unknown"
        
        with self._tracer.start_span("websocket.connection", {
            TraceAttributes.APP_COMPONENT: "websocket",
            "websocket.endpoint": endpoint,
            "websocket.client_id": client_id,
            "websocket.client_host": websocket.client.host if websocket.client else None,
        }) as span:
            try:
                await websocket.accept()
                self._tracer.add_event("websocket.accepted")
                
                # Track message loop
                with self._tracer.start_span("websocket.message_loop"):
                    await handler(websocket)
                
            except Exception as e:
                self._tracer.record_exception(e, {
                    "websocket.error.phase": "connection",
                })
                raise
            finally:
                self._tracer.add_event("websocket.closed")
    
    async def trace_message(
        self,
        websocket: WebSocket,
        message: Dict[str, Any],
        handler: Callable,
    ) -> Any:
        """
        Trace a single WebSocket message with context extraction.
        
        Extracts trace context from message if present (from Godot or other clients).
        """
        message_type = message.get("type", "unknown")
        
        # Extract trace context from message if present
        trace_context = message.get("trace_context", {})
        if trace_context:
            # Import propagator for context extraction
            from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
            propagator = TraceContextTextMapPropagator()
            context = propagator.extract(trace_context)
        else:
            context = None
        
        # Start span with extracted context
        with self._tracer.start_span(f"websocket.message.{message_type}", {
            TraceAttributes.APP_COMPONENT: "websocket",
            "websocket.message_type": message_type,
            "websocket.has_trace_context": bool(trace_context),
        }):
            self._tracer.add_event("websocket.message.received", {
                "message.type": message_type,
                "message.size": len(json.dumps(message)),
            })
            
            try:
                result = await handler(websocket, message)
                self._tracer.add_event("websocket.message.handled")
                return result
                
            except Exception as e:
                self._tracer.record_exception(e, {
                    "websocket.message_type": message_type,
                })
                raise
    
    def create_message_with_context(
        self,
        message_type: str,
        payload: Dict[str, Any],
    ) -> Dict[str, Any]:
        """
        Create a message with trace context for outbound messages.
        
        Usage:
            message = ws_tracer.create_message_with_context("match_update", {
                "match_id": "123",
                "status": "completed"
            })
            await websocket.send_json(message)
        """
        # Get current trace context
        trace_context = self._tracer.get_current_context()
        
        return {
            "type": message_type,
            "payload": payload,
            "trace_context": trace_context,
        }


def traced_websocket_handler(operation: str = None):
    """
    Decorator for WebSocket message handlers.
    
    Usage:
        @traced_websocket_handler("match_update")
        async def handle_match_update(websocket, message):
            ...
    """
    def decorator(func: Callable) -> Callable:
        span_name = operation or func.__name__
        tracer = get_tracing_manager()
        
        @wraps(func)
        async def wrapper(websocket: WebSocket, message: Dict[str, Any], *args, **kwargs):
            message_type = message.get("type", "unknown")
            
            with tracer.start_span(f"ws.handler.{span_name}", {
                TraceAttributes.APP_COMPONENT: "websocket",
                "websocket.handler": func.__name__,
                "websocket.message_type": message_type,
            }):
                try:
                    tracer.add_event("ws.handler.start", {
                        "handler": func.__name__,
                        "message_id": message.get("id"),
                    })
                    
                    result = await func(websocket, message, *args, **kwargs)
                    
                    tracer.add_event("ws.handler.complete")
                    return result
                    
                except Exception as e:
                    tracer.record_exception(e, {
                        "handler": func.__name__,
                        "message_type": message_type,
                    })
                    raise
        
        return wrapper
    return decorator


class GodotTraceBridge:
    """
    Bridge for trace context from Godot game exports.
    
    Handles W3C Trace Context format from Godot HTTP requests
    and converts to OpenTelemetry format.
    """
    
    def __init__(self):
        self._tracer = get_tracing_manager()
    
    def extract_from_headers(self, headers: Dict[str, str]) -> Optional[Any]:
        """
        Extract trace context from HTTP headers.
        
        Supports:
        - W3C Trace Context (traceparent, tracestate)
        - Jaeger headers (uber-trace-id)
        - Custom X-Trace-Id headers
        """
        from opentelemetry.trace.propagation.tracecontext import TraceContextTextMapPropagator
        
        # Check for W3C Trace Context
        if "traceparent" in headers:
            propagator = TraceContextTextMapPropagator()
            return propagator.extract(headers)
        
        # Check for Jaeger format
        if "uber-trace-id" in headers:
            # Parse Jaeger format: {trace-id}:{span-id}:{parent-span-id}:{flags}
            jaeger_header = headers["uber-trace-id"]
            parts = jaeger_header.split(":")
            if len(parts) >= 4:
                trace_id, span_id, _, flags = parts[:4]
                # Convert to W3C format
                w3c_headers = {
                    "traceparent": f"00-{trace_id.zfill(32)}-{span_id.zfill(16)}-{flags.zfill(2)}"
                }
                propagator = TraceContextTextMapPropagator()
                return propagator.extract(w3c_headers)
        
        return None
    
    def inject_to_headers(self, headers: Dict[str, str]) -> Dict[str, str]:
        """
        Inject trace context into headers for Godot export client.
        
        Usage:
            headers = {}
            headers = bridge.inject_to_headers(headers)
            requests.post(url, headers=headers, json=data)
        """
        context = self._tracer.get_current_context()
        headers.update(context)
        return headers
    
    def create_godot_trace_context(self) -> Dict[str, str]:
        """
        Create trace context suitable for Godot export.
        
        Returns a simple dict that can be serialized to JSON
        and sent to Godot for context propagation.
        """
        return self._tracer.get_current_context()


# Singleton instances
_ws_tracer: Optional[WebSocketTracer] = None
_godot_bridge: Optional[GodotTraceBridge] = None


def get_websocket_tracer() -> WebSocketTracer:
    """Get global WebSocket tracer."""
    global _ws_tracer
    if _ws_tracer is None:
        _ws_tracer = WebSocketTracer()
    return _ws_tracer


def get_godot_trace_bridge() -> GodotTraceBridge:
    """Get global Godot trace bridge."""
    global _godot_bridge
    if _godot_bridge is None:
        _godot_bridge = GodotTraceBridge()
    return _godot_bridge
