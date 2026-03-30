"""
Metrics Collection

Prometheus-style metrics for API monitoring.
"""

import logging
import time
from contextlib import contextmanager
from typing import Dict, Optional, List
from dataclasses import dataclass

logger = logging.getLogger(__name__)


@dataclass
class MetricValue:
    """A single metric value."""
    name: str
    value: float
    labels: Dict[str, str]
    timestamp: float
    metric_type: str  # counter, gauge, histogram, summary


class MetricsCollector:
    """
    Metrics collector for API monitoring.
    
    Collects:
    - Request counts and latencies
    - Business metrics
    - Custom application metrics
    """
    
    def __init__(self, prefix: str = "njz"):
        self.prefix = prefix
        self._counters: Dict[str, int] = {}
        self._gauges: Dict[str, float] = {}
        self._histograms: Dict[str, List[float]] = {}
        self._labels: Dict[str, Dict[str, str]] = {}
    
    def _make_name(self, name: str) -> str:
        """Create full metric name with prefix."""
        return f"{self.prefix}_{name}"
    
    def increment_counter(
        self,
        name: str,
        value: int = 1,
        labels: Optional[Dict[str, str]] = None
    ):
        """
        Increment a counter metric.
        
        Args:
            name: Metric name
            value: Amount to increment
            labels: Metric labels
        """
        full_name = self._make_name(name)
        label_key = self._labels_to_key(labels or {})
        key = f"{full_name}:{label_key}"
        
        if key not in self._counters:
            self._counters[key] = 0
            self._labels[key] = labels or {}
        
        self._counters[key] += value
    
    def set_gauge(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None
    ):
        """Set a gauge metric value."""
        full_name = self._make_name(name)
        label_key = self._labels_to_key(labels or {})
        key = f"{full_name}:{label_key}"
        
        self._gauges[key] = value
        self._labels[key] = labels or {}
    
    def observe_histogram(
        self,
        name: str,
        value: float,
        labels: Optional[Dict[str, str]] = None
    ):
        """
        Observe a value for histogram.
        
        Args:
            name: Metric name
            value: Value to observe
            labels: Metric labels
        """
        full_name = self._make_name(name)
        label_key = self._labels_to_key(labels or {})
        key = f"{full_name}:{label_key}"
        
        if key not in self._histograms:
            self._histograms[key] = []
            self._labels[key] = labels or {}
        
        self._histograms[key].append(value)
        
        # Limit histogram size
        if len(self._histograms[key]) > 10000:
            self._histograms[key] = self._histograms[key][-5000:]
    
    @contextmanager
    def measure_latency(self, name: str, labels: Optional[Dict[str, str]] = None):
        """
        Measure execution latency.
        
        Usage:
            with metrics.measure_latency("database_query", {"table": "players"}):
                result = db.query()
        """
        start = time.time()
        try:
            yield
        finally:
            latency = time.time() - start
            self.observe_histogram(f"{name}_duration_seconds", latency, labels)
    
    def get_metrics(self) -> List[MetricValue]:
        """Get all collected metrics."""
        metrics = []
        now = time.time()
        
        # Counters
        for key, value in self._counters.items():
            name, _ = key.split(":", 1)
            metrics.append(MetricValue(
                name=name,
                value=float(value),
                labels=self._labels.get(key, {}),
                timestamp=now,
                metric_type="counter"
            ))
        
        # Gauges
        for key, value in self._gauges.items():
            name, _ = key.split(":", 1)
            metrics.append(MetricValue(
                name=name,
                value=value,
                labels=self._labels.get(key, {}),
                timestamp=now,
                metric_type="gauge"
            ))
        
        # Histograms (export as summaries)
        for key, values in self._histograms.items():
            if not values:
                continue
            
            name, _ = key.split(":", 1)
            
            # Calculate statistics
            import statistics
            metrics.append(MetricValue(
                name=f"{name}_count",
                value=len(values),
                labels=self._labels.get(key, {}),
                timestamp=now,
                metric_type="summary"
            ))
            
            metrics.append(MetricValue(
                name=f"{name}_sum",
                value=sum(values),
                labels=self._labels.get(key, {}),
                timestamp=now,
                metric_type="summary"
            ))
            
            if len(values) > 1:
                metrics.append(MetricValue(
                    name=f"{name}_avg",
                    value=statistics.mean(values),
                    labels=self._labels.get(key, {}),
                    timestamp=now,
                    metric_type="summary"
                ))
        
        return metrics
    
    def get_prometheus_format(self) -> str:
        """Export metrics in Prometheus exposition format."""
        lines = []
        
        for metric in self.get_metrics():
            label_str = ",".join([f'{k}="{v}"' for k, v in metric.labels.items()])
            if label_str:
                lines.append(f'{metric.name}{{{label_str}}} {metric.value}')
            else:
                lines.append(f'{metric.name} {metric.value}')
        
        return "\n".join(lines)
    
    def _labels_to_key(self, labels: Dict[str, str]) -> str:
        """Convert labels dict to string key."""
        if not labels:
            return ""
        return ",".join([f"{k}={v}" for k, v in sorted(labels.items())])
    
    def reset(self):
        """Reset all metrics (useful for testing)."""
        self._counters.clear()
        self._gauges.clear()
        self._histograms.clear()
        self._labels.clear()


# Global collector
_metrics_collector: Optional[MetricsCollector] = None


def get_metrics_collector() -> MetricsCollector:
    """Get the global metrics collector."""
    global _metrics_collector
    if _metrics_collector is None:
        _metrics_collector = MetricsCollector()
    return _metrics_collector


# Common metrics helpers
class APIMetrics:
    """Helper class for common API metrics."""
    
    def __init__(self, collector: Optional[MetricsCollector] = None):
        self.collector = collector or get_metrics_collector()
    
    def record_request(
        self,
        method: str,
        endpoint: str,
        status_code: int,
        duration_ms: float
    ):
        """Record API request metrics."""
        labels = {
            "method": method,
            "endpoint": endpoint,
            "status": str(status_code)
        }
        
        # Increment request counter
        self.collector.increment_counter("http_requests_total", 1, labels)
        
        # Record latency
        self.collector.observe_histogram(
            "http_request_duration_seconds",
            duration_ms / 1000,
            labels
        )
        
        # Status code counter
        status_class = f"{status_code // 100}xx"
        self.collector.increment_counter(
            "http_responses_total",
            1,
            {"status_class": status_class}
        )
    
    def record_database_query(
        self,
        operation: str,
        table: str,
        duration_ms: float,
        success: bool
    ):
        """Record database query metrics."""
        labels = {
            "operation": operation,
            "table": table,
            "success": str(success).lower()
        }
        
        self.collector.increment_counter("db_queries_total", 1, labels)
        self.collector.observe_histogram(
            "db_query_duration_seconds",
            duration_ms / 1000,
            labels
        )
    
    def record_cache_operation(
        self,
        operation: str,  # get, set, delete
        hit: Optional[bool] = None
    ):
        """Record cache operation metrics."""
        labels = {"operation": operation}
        if hit is not None:
            labels["result"] = "hit" if hit else "miss"
        
        self.collector.increment_counter("cache_operations_total", 1, labels)
    
    def set_active_connections(self, count: int):
        """Set active WebSocket connections gauge."""
        self.collector.set_gauge("websocket_connections_active", count)
