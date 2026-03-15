# [Ver001.000]
"""
Circuit Breaker Prometheus Metrics & Monitoring
CB-004: Metrics & Monitoring Implementation

Provides Prometheus metrics collection, monitoring endpoints,
and health checks for circuit breaker instances.
"""

import time
import asyncio
from typing import Dict, Optional, Any
from contextlib import asynccontextmanager

from fastapi import APIRouter, HTTPException
from prometheus_client import Counter, Gauge, Histogram, generate_latest, CONTENT_TYPE_LATEST

# Import circuit breaker components
from circuit_breaker import (
    CircuitBreaker,
    CircuitState,
    CircuitBreakerMetrics,
    CircuitBreakerOpen
)

# =============================================================================
# Prometheus Metrics Definitions
# =============================================================================

# Gauge: Current circuit state (0=closed, 1=half_open, 2=open)
CIRCUIT_STATE = Gauge(
    'circuit_breaker_state',
    'Current circuit breaker state (0=closed, 1=half_open, 2=open)',
    ['name']
)

# Counter: Total failures
CIRCUIT_FAILURES = Counter(
    'circuit_breaker_failures_total',
    'Total number of failures',
    ['name']
)

# Counter: Total successes
CIRCUIT_SUCCESSES = Counter(
    'circuit_breaker_successes_total',
    'Total number of successes',
    ['name']
)

# Counter: Total calls (rejected when circuit is open)
CIRCUIT_CALLS_TOTAL = Counter(
    'circuit_breaker_calls_total',
    'Total number of call attempts',
    ['name', 'result']  # result: success, failure, rejected
)

# Histogram: Call duration in seconds
CIRCUIT_CALL_DURATION = Histogram(
    'circuit_breaker_call_duration_seconds',
    'Call duration in seconds',
    ['name', 'result'],  # result: success, failure
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0]
)

# Gauge: Current failure count (resets on recovery)
CIRCUIT_FAILURE_COUNT = Gauge(
    'circuit_breaker_failure_count',
    'Current consecutive failure count',
    ['name']
)

# Gauge: Time since last failure
CIRCUIT_LAST_FAILURE = Gauge(
    'circuit_breaker_last_failure_timestamp',
    'Unix timestamp of last failure',
    ['name']
)

# Gauge: Time since last success
CIRCUIT_LAST_SUCCESS = Gauge(
    'circuit_breaker_last_success_timestamp',
    'Unix timestamp of last success',
    ['name']
)


# =============================================================================
# Metrics Integration Mixin
# =============================================================================

class CircuitBreakerMetricsMixin:
    """
    Mixin to add Prometheus metrics to CircuitBreaker.
    
    Usage:
        # Extend CircuitBreaker with metrics
        class MonitoredCircuitBreaker(CircuitBreaker, CircuitBreakerMetricsMixin):
            pass
    """
    
    async def _update_prometheus_state(self) -> None:
        """Update Prometheus state gauge."""
        state = await self._get_state()
        state_value = {
            CircuitState.CLOSED: 0,
            CircuitState.HALF_OPEN: 1,
            CircuitState.OPEN: 2
        }[state]
        
        CIRCUIT_STATE.labels(name=self.config.name).set(state_value)
        CIRCUIT_FAILURE_COUNT.labels(name=self.config.name).set(self._failure_count)
    
    async def _record_success(self, duration: float) -> None:
        """Record successful call metrics."""
        CIRCUIT_SUCCESSES.labels(name=self.config.name).inc()
        CIRCUIT_CALLS_TOTAL.labels(name=self.config.name, result='success').inc()
        CIRCUIT_CALL_DURATION.labels(name=self.config.name, result='success').observe(duration)
        
        # Update timestamp
        CIRCUIT_LAST_SUCCESS.labels(name=self.config.name).set(time.time())
        
        # Update state gauge
        await self._update_prometheus_state()
    
    async def _record_failure(self, duration: float, rejected: bool = False) -> None:
        """Record failed call metrics."""
        if rejected:
            CIRCUIT_CALLS_TOTAL.labels(name=self.config.name, result='rejected').inc()
        else:
            CIRCUIT_FAILURES.labels(name=self.config.name).inc()
            CIRCUIT_CALLS_TOTAL.labels(name=self.config.name, result='failure').inc()
            CIRCUIT_CALL_DURATION.labels(name=self.config.name, result='failure').observe(duration)
            CIRCUIT_LAST_FAILURE.labels(name=self.config.name).set(time.time())
        
        # Update state gauge
        await self._update_prometheus_state()


# =============================================================================
# Metrics-Aware Circuit Breaker Wrapper
# =============================================================================

class MonitoredCircuitBreaker(CircuitBreaker):
    """
    Circuit breaker with integrated Prometheus metrics.
    
    Extends base CircuitBreaker to automatically collect
    Prometheus metrics on every call.
    """
    
    async def call(self, func, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection and metrics.
        """
        start_time = time.time()
        self._metrics.total_calls += 1
        
        state = await self._get_state()
        
        # Check if circuit is OPEN
        if state == CircuitState.OPEN:
            last_failure = await self._get_last_failure_time()
            time_since_failure = time.time() - last_failure
            
            if time_since_failure >= self.config.recovery_timeout:
                await self._set_state(CircuitState.HALF_OPEN)
                await self._reset_counters()
                state = CircuitState.HALF_OPEN
            else:
                # Record rejected call
                duration = time.time() - start_time
                await self._record_prometheus_metrics(
                    duration, success=False, rejected=True
                )
                remaining = self.config.recovery_timeout - time_since_failure
                raise CircuitBreakerOpen(
                    f"Circuit {self.config.name} is OPEN. Retry after {remaining:.1f} seconds"
                )
        
        # Check HALF_OPEN call limit
        if state == CircuitState.HALF_OPEN:
            half_open_calls = await self._get_half_open_calls()
            if half_open_calls >= self.config.half_open_max_calls:
                duration = time.time() - start_time
                await self._record_prometheus_metrics(
                    duration, success=False, rejected=True
                )
                raise CircuitBreakerOpen(
                    f"Circuit {self.config.name} is HALF_OPEN (max calls reached)"
                )
            await self._increment_half_open_calls()
        
        # Execute the call
        try:
            result = await func(*args, **kwargs)
            duration = time.time() - start_time
            await self._on_success_prometheus(duration)
            return result
        except Exception as e:
            duration = time.time() - start_time
            await self._on_failure_prometheus(duration)
            raise
    
    async def _record_prometheus_metrics(
        self, 
        duration: float, 
        success: bool = False, 
        rejected: bool = False
    ) -> None:
        """Record Prometheus metrics."""
        if rejected:
            CIRCUIT_CALLS_TOTAL.labels(name=self.config.name, result='rejected').inc()
        elif success:
            CIRCUIT_SUCCESSES.labels(name=self.config.name).inc()
            CIRCUIT_CALLS_TOTAL.labels(name=self.config.name, result='success').inc()
            CIRCUIT_CALL_DURATION.labels(name=self.config.name, result='success').observe(duration)
            CIRCUIT_LAST_SUCCESS.labels(name=self.config.name).set(time.time())
        else:
            CIRCUIT_FAILURES.labels(name=self.config.name).inc()
            CIRCUIT_CALLS_TOTAL.labels(name=self.config.name, result='failure').inc()
            CIRCUIT_CALL_DURATION.labels(name=self.config.name, result='failure').observe(duration)
            CIRCUIT_LAST_FAILURE.labels(name=self.config.name).set(time.time())
        
        # Update state metrics
        await self._update_prometheus_state()
    
    async def _update_prometheus_state(self) -> None:
        """Update Prometheus state gauges."""
        state = await self._get_state()
        state_value = {
            CircuitState.CLOSED: 0,
            CircuitState.HALF_OPEN: 1,
            CircuitState.OPEN: 2
        }[state]
        
        CIRCUIT_STATE.labels(name=self.config.name).set(state_value)
        CIRCUIT_FAILURE_COUNT.labels(name=self.config.name).set(self._failure_count)
    
    async def _on_success_prometheus(self, duration: float) -> None:
        """Handle successful call with Prometheus metrics."""
        await self._increment_success()
        
        # Record metrics
        CIRCUIT_SUCCESSES.labels(name=self.config.name).inc()
        CIRCUIT_CALLS_TOTAL.labels(name=self.config.name, result='success').inc()
        CIRCUIT_CALL_DURATION.labels(name=self.config.name, result='success').observe(duration)
        CIRCUIT_LAST_SUCCESS.labels(name=self.config.name).set(time.time())
        
        # Handle state transitions
        state = await self._get_state()
        if state == CircuitState.HALF_OPEN:
            if self._success_count >= self.config.success_threshold:
                await self._set_state(CircuitState.CLOSED)
                await self._reset_counters()
        else:
            if self._failure_count > 0:
                await self._reset_counters()
        
        # Update state gauge
        await self._update_prometheus_state()
    
    async def _on_failure_prometheus(self, duration: float) -> None:
        """Handle failed call with Prometheus metrics."""
        await self._increment_failure()
        
        # Record metrics
        CIRCUIT_FAILURES.labels(name=self.config.name).inc()
        CIRCUIT_CALLS_TOTAL.labels(name=self.config.name, result='failure').inc()
        CIRCUIT_CALL_DURATION.labels(name=self.config.name, result='failure').observe(duration)
        CIRCUIT_LAST_FAILURE.labels(name=self.config.name).set(time.time())
        
        # Check threshold
        if self._failure_count >= self.config.failure_threshold:
            await self._set_state(CircuitState.OPEN)
            await self._set_last_failure_time(time.time())
        
        # Update state gauge
        await self._update_prometheus_state()


# =============================================================================
# Monitoring Endpoints Router
# =============================================================================

router = APIRouter(prefix="/v1/circuit-breakers", tags=["circuit-breakers"])


@router.get("/metrics")
async def get_circuit_breaker_metrics() -> Dict[str, Any]:
    """
    Get comprehensive metrics for all circuit breakers.
    
    Returns:
        Dictionary mapping circuit breaker names to their metrics.
    """
    metrics = {}
    registry = CircuitBreaker.get_registry()
    
    for name, cb in registry.items():
        cb_metrics = await cb.get_metrics()
        metrics[name] = {
            "name": cb_metrics.name,
            "state": cb_metrics.state.value,
            "state_numeric": {
                CircuitState.CLOSED: 0,
                CircuitState.HALF_OPEN: 1,
                CircuitState.OPEN: 2
            }[cb_metrics.state],
            "failure_count": cb_metrics.failure_count,
            "success_count": cb_metrics.success_count,
            "total_calls": cb_metrics.total_calls,
            "total_failures": cb_metrics.total_failures,
            "total_successes": cb_metrics.total_successes,
            "last_failure_time": cb_metrics.last_failure_time,
            "last_success_time": cb_metrics.last_success_time,
        }
    
    return {
        "circuit_breakers": metrics,
        "count": len(metrics)
    }


@router.get("/prometheus")
async def get_prometheus_metrics():
    """
    Get Prometheus-formatted metrics.
    
    Returns:
        Prometheus exposition format metrics.
    """
    from starlette.responses import Response
    
    # Update all circuit breaker states first
    registry = CircuitBreaker.get_registry()
    for name, cb in registry.items():
        state_value = {
            CircuitState.CLOSED: 0,
            CircuitState.HALF_OPEN: 1,
            CircuitState.OPEN: 2
        }.get(cb._state, 0)
        
        CIRCUIT_STATE.labels(name=name).set(state_value)
        CIRCUIT_FAILURE_COUNT.labels(name=name).set(cb._failure_count)
    
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST
    )


@router.get("/{name}/health")
async def get_circuit_breaker_health(name: str) -> Dict[str, Any]:
    """
    Get health status for a specific circuit breaker.
    
    Args:
        name: Circuit breaker name
        
    Returns:
        Health status information
        
    Raises:
        HTTPException: 404 if circuit breaker not found
    """
    cb = CircuitBreaker.get_registry().get(name)
    if not cb:
        raise HTTPException(
            status_code=404, 
            detail=f"Circuit breaker '{name}' not found"
        )
    
    metrics = await cb.get_metrics()
    
    # Determine health status
    is_healthy = metrics.state == CircuitState.CLOSED
    status = "healthy" if is_healthy else "unhealthy"
    
    if metrics.state == CircuitState.HALF_OPEN:
        status = "degraded"
    
    return {
        "name": name,
        "status": status,
        "healthy": is_healthy,
        "state": metrics.state.value,
        "state_numeric": {
            CircuitState.CLOSED: 0,
            CircuitState.HALF_OPEN: 1,
            CircuitState.OPEN: 2
        }[metrics.state],
        "metrics": {
            "failure_count": metrics.failure_count,
            "success_count": metrics.success_count,
            "total_calls": metrics.total_calls,
            "total_failures": metrics.total_failures,
            "total_successes": metrics.total_successes,
            "last_failure_time": metrics.last_failure_time,
            "last_success_time": metrics.last_success_time,
        },
        "config": {
            "failure_threshold": cb.config.failure_threshold,
            "recovery_timeout": cb.config.recovery_timeout,
            "half_open_max_calls": cb.config.half_open_max_calls,
            "success_threshold": cb.config.success_threshold,
        }
    }


@router.get("/health")
async def get_all_circuit_breaker_health() -> Dict[str, Any]:
    """
    Get health status for all circuit breakers.
    
    Returns:
        Aggregated health status
    """
    registry = CircuitBreaker.get_registry()
    
    if not registry:
        return {
            "status": "unknown",
            "healthy": True,
            "circuit_breakers": {},
            "summary": {
                "total": 0,
                "healthy": 0,
                "degraded": 0,
                "unhealthy": 0
            }
        }
    
    circuit_breakers = {}
    summary = {"total": 0, "healthy": 0, "degraded": 0, "unhealthy": 0}
    
    for name, cb in registry.items():
        metrics = await cb.get_metrics()
        summary["total"] += 1
        
        if metrics.state == CircuitState.CLOSED:
            status = "healthy"
            summary["healthy"] += 1
        elif metrics.state == CircuitState.HALF_OPEN:
            status = "degraded"
            summary["degraded"] += 1
        else:
            status = "unhealthy"
            summary["unhealthy"] += 1
        
        circuit_breakers[name] = {
            "status": status,
            "state": metrics.state.value,
            "healthy": metrics.state == CircuitState.CLOSED
        }
    
    # Overall status
    overall_status = "healthy"
    if summary["unhealthy"] > 0:
        overall_status = "unhealthy"
    elif summary["degraded"] > 0:
        overall_status = "degraded"
    
    return {
        "status": overall_status,
        "healthy": overall_status == "healthy",
        "circuit_breakers": circuit_breakers,
        "summary": summary
    }


@router.post("/{name}/reset")
async def reset_circuit_breaker(name: str) -> Dict[str, Any]:
    """
    Manually reset a circuit breaker to CLOSED state.
    
    Args:
        name: Circuit breaker name
        
    Returns:
        Reset confirmation
        
    Raises:
        HTTPException: 404 if circuit breaker not found
    """
    cb = CircuitBreaker.get_registry().get(name)
    if not cb:
        raise HTTPException(
            status_code=404,
            detail=f"Circuit breaker '{name}' not found"
        )
    
    await cb._set_state(CircuitState.CLOSED)
    await cb._reset_counters()
    
    # Update Prometheus metrics
    CIRCUIT_STATE.labels(name=name).set(0)
    CIRCUIT_FAILURE_COUNT.labels(name=name).set(0)
    
    return {
        "name": name,
        "action": "reset",
        "new_state": "closed",
        "message": f"Circuit breaker '{name}' has been reset to CLOSED state"
    }


# =============================================================================
# Utility Functions
# =============================================================================

def get_prometheus_metrics_text() -> bytes:
    """Get Prometheus metrics as bytes (for scraping)."""
    return generate_latest()


async def update_all_prometheus_metrics() -> None:
    """Update Prometheus metrics for all registered circuit breakers."""
    registry = CircuitBreaker.get_registry()
    
    for name, cb in registry.items():
        state_value = {
            CircuitState.CLOSED: 0,
            CircuitState.HALF_OPEN: 1,
            CircuitState.OPEN: 2
        }.get(cb._state, 0)
        
        CIRCUIT_STATE.labels(name=name).set(state_value)
        CIRCUIT_FAILURE_COUNT.labels(name=name).set(cb._failure_count)
        
        if cb._metrics.last_failure_time:
            CIRCUIT_LAST_FAILURE.labels(name=name).set(cb._metrics.last_failure_time)
        if cb._metrics.last_success_time:
            CIRCUIT_LAST_SUCCESS.labels(name=name).set(cb._metrics.last_success_time)


# =============================================================================
# Alerting Rules Documentation
# =============================================================================

ALERTING_RULES = """
# Prometheus Alerting Rules for Circuit Breaker Monitoring
# Save this to: prometheus/rules/circuit_breaker_alerts.yml

groups:
  - name: circuit_breaker_alerts
    rules:
      # Critical: Circuit breaker is OPEN
      - alert: CircuitBreakerOpen
        expr: circuit_breaker_state == 2
        for: 1m
        labels:
          severity: critical
          component: circuit_breaker
        annotations:
          summary: "Circuit breaker {{ $labels.name }} is OPEN"
          description: "Circuit breaker {{ $labels.name }} has been OPEN for more than 1 minute. Service is rejecting calls."
          runbook_url: "https://wiki.internal/runbooks/circuit-breaker-open"
          
      # Warning: High failure rate
      - alert: CircuitBreakerHighFailureRate
        expr: |
          (
            rate(circuit_breaker_failures_total[5m]) /
            (rate(circuit_breaker_failures_total[5m]) + rate(circuit_breaker_successes_total[5m]))
          ) > 0.5
        for: 2m
        labels:
          severity: warning
          component: circuit_breaker
        annotations:
          summary: "High failure rate for circuit breaker {{ $labels.name }}"
          description: "Circuit breaker {{ $labels.name }} has a failure rate above 50% in the last 5 minutes."
          
      # Warning: Circuit breaker in HALF_OPEN state
      - alert: CircuitBreakerHalfOpen
        expr: circuit_breaker_state == 1
        for: 5m
        labels:
          severity: warning
          component: circuit_breaker
        annotations:
          summary: "Circuit breaker {{ $labels.name }} is in HALF_OPEN state"
          description: "Circuit breaker {{ $labels.name }} has been in HALF_OPEN state for more than 5 minutes. Recovery testing in progress."
          
      # Info: Repeated circuit breaker trips
      - alert: CircuitBreakerFrequentTrips
        expr: increase(circuit_breaker_failures_total[1h]) > 10
        for: 0m
        labels:
          severity: info
          component: circuit_breaker
        annotations:
          summary: "Frequent circuit breaker trips for {{ $labels.name }}"
          description: "Circuit breaker {{ $labels.name }} has tripped more than 10 times in the last hour."
          
      # Warning: Slow calls
      - alert: CircuitBreakerSlowCalls
        expr: histogram_quantile(0.95, rate(circuit_breaker_call_duration_seconds_bucket[5m])) > 1.0
        for: 5m
        labels:
          severity: warning
          component: circuit_breaker
        annotations:
          summary: "Slow calls detected for {{ $labels.name }}"
          description: "95th percentile latency for {{ $labels.name }} is above 1 second."

# Grafana Dashboard (JSON Model)
# Import this into Grafana for visualization

GRAFANA_DASHBOARD = {
    "dashboard": {
        "title": "Circuit Breaker Metrics",
        "panels": [
            {
                "title": "Circuit State",
                "type": "stat",
                "targets": [
                    {
                        "expr": "circuit_breaker_state",
                        "legendFormat": "{{ name }}"
                    }
                ],
                "fieldConfig": {
                    "defaults": {
                        "mappings": [
                            {"options": {"0": {"text": "CLOSED"}}, "type": "value"},
                            {"options": {"1": {"text": "HALF_OPEN"}}, "type": "value"},
                            {"options": {"2": {"text": "OPEN"}}, "type": "value"}
                        ]
                    }
                }
            },
            {
                "title": "Failure Rate",
                "type": "graph",
                "targets": [
                    {
                        "expr": "rate(circuit_breaker_failures_total[5m])",
                        "legendFormat": "{{ name }} - failures/sec"
                    }
                ]
            },
            {
                "title": "Call Duration (p95)",
                "type": "graph",
                "targets": [
                    {
                        "expr": "histogram_quantile(0.95, rate(circuit_breaker_call_duration_seconds_bucket[5m]))",
                        "legendFormat": "{{ name }}"
                    }
                ]
            }
        ]
    }
}
"""


def get_alerting_rules() -> str:
    """Get Prometheus alerting rules for circuit breaker monitoring."""
    return ALERTING_RULES


# =============================================================================
# Initialization
# =============================================================================

def initialize_metrics() -> None:
    """
    Initialize metrics for existing circuit breakers.
    Call this on application startup.
    """
    registry = CircuitBreaker.get_registry()
    
    for name, cb in registry.items():
        # Initialize gauges with current values
        state_value = {
            CircuitState.CLOSED: 0,
            CircuitState.HALF_OPEN: 1,
            CircuitState.OPEN: 2
        }.get(cb._state, 0)
        
        CIRCUIT_STATE.labels(name=name).set(state_value)
        CIRCUIT_FAILURE_COUNT.labels(name=name).set(cb._failure_count)


# Auto-initialize on module load
initialize_metrics()
