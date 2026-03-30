"""
Observability Module

OpenTelemetry instrumentation for:
- Distributed tracing
- Metrics collection
- Log correlation
"""

from .tracing import TracingManager, get_tracing_manager
from .metrics import MetricsCollector, get_metrics_collector

__all__ = [
    "TracingManager",
    "get_tracing_manager",
    "MetricsCollector",
    "get_metrics_collector",
]
