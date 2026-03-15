# [Ver001.001]
"""
Circuit Breaker Pattern Implementation
Prevents cascading failures in distributed systems.
"""

import asyncio
import time
from enum import Enum
from dataclasses import dataclass, field
from typing import Callable, Optional, Any, Dict
from functools import wraps
from contextlib import asynccontextmanager
import logging

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states."""
    CLOSED = "closed"       # Normal operation
    OPEN = "open"          # Failing, reject fast
    HALF_OPEN = "half_open"  # Testing recovery


class CircuitBreakerOpen(Exception):
    """Raised when circuit breaker is open."""
    pass


@dataclass
class CircuitBreakerConfig:
    """Configuration for circuit breaker."""
    name: str
    failure_threshold: int = 5
    recovery_timeout: float = 30.0
    half_open_max_calls: int = 3
    success_threshold: int = 2
    max_concurrent: int = 10  # Bulkhead: max concurrent calls
    
    def __post_init__(self):
        if self.failure_threshold < 1:
            raise ValueError("failure_threshold must be >= 1")
        if self.recovery_timeout < 0:
            raise ValueError("recovery_timeout must be >= 0")
        if self.half_open_max_calls < 1:
            raise ValueError("half_open_max_calls must be >= 1")
        if self.success_threshold < 1:
            raise ValueError("success_threshold must be >= 1")
        if self.max_concurrent < 1:
            raise ValueError("max_concurrent must be >= 1")


@dataclass
class CircuitBreakerMetrics:
    """Metrics for circuit breaker monitoring."""
    name: str
    state: CircuitState
    failure_count: int = 0
    success_count: int = 0
    last_failure_time: Optional[float] = None
    last_success_time: Optional[float] = None
    total_calls: int = 0
    total_failures: int = 0
    total_successes: int = 0
    concurrent_calls: int = 0  # Current concurrent calls
    max_concurrent: int = 10   # Configured max concurrent


class CircuitBreaker:
    """
    Circuit breaker for protecting external service calls.
    
    Usage:
        cb = CircuitBreaker("database", failure_threshold=5)
        
        # As decorator
        @cb
        async def get_data():
            return await db.query()
        
        # As context manager
        async with cb.protect():
            result = await db.query()
        
        # Direct call
        result = await cb.call(db.query)
    """
    
    # Class-level registry of all circuit breakers
    _registry: Dict[str, 'CircuitBreaker'] = {}
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        half_open_max_calls: int = 3,
        success_threshold: int = 2,
        max_concurrent: int = 10,
        redis_client: Optional[Any] = None
    ):
        self.config = CircuitBreakerConfig(
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
            half_open_max_calls=half_open_max_calls,
            success_threshold=success_threshold,
            max_concurrent=max_concurrent
        )
        self.redis = redis_client
        
        # Local state
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._half_open_calls = 0
        self._last_failure_time: Optional[float] = None
        
        # Bulkhead: Semaphore for limiting concurrent calls
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._concurrent_calls = 0
        
        # Metrics
        self._metrics = CircuitBreakerMetrics(
            name=name, 
            state=CircuitState.CLOSED,
            max_concurrent=max_concurrent
        )
        
        # Register
        CircuitBreaker._registry[name] = self
        
        logger.info(f"[CircuitBreaker] Created: {name} (max_concurrent={max_concurrent})")
    
    @classmethod
    def get_registry(cls) -> Dict[str, 'CircuitBreaker']:
        """Get all registered circuit breakers."""
        return cls._registry
    
    @classmethod
    def get_metrics(cls, name: str) -> Optional[CircuitBreakerMetrics]:
        """Get metrics for a specific circuit breaker."""
        cb = cls._registry.get(name)
        return cb._metrics if cb else None
    
    async def _get_state(self) -> CircuitState:
        """Get current circuit state."""
        if self.redis:
            state_str = await self.redis.get(f"cb:{self.config.name}:state")
            if state_str:
                return CircuitState(state_str.decode())
        return self._state
    
    async def _set_state(self, state: CircuitState):
        """Set circuit state."""
        if self.redis:
            await self.redis.set(f"cb:{self.config.name}:state", state.value)
        self._state = state
        self._metrics.state = state
        logger.info(f"[CircuitBreaker:{self.config.name}] State changed to: {state.value}")
    
    async def _increment_failure(self):
        """Increment failure counter."""
        if self.redis:
            await self.redis.incr(f"cb:{self.config.name}:failures")
        self._failure_count += 1
        self._metrics.failure_count = self._failure_count
        self._metrics.total_failures += 1
        self._last_failure_time = time.time()
        self._metrics.last_failure_time = self._last_failure_time
    
    async def _increment_success(self):
        """Increment success counter."""
        if self.redis:
            await self.redis.incr(f"cb:{self.config.name}:successes")
        self._success_count += 1
        self._metrics.success_count = self._success_count
        self._metrics.total_successes += 1
        self._metrics.last_success_time = time.time()
    
    async def _reset_counters(self):
        """Reset all counters."""
        if self.redis:
            pipe = self.redis.pipeline()
            pipe.delete(f"cb:{self.config.name}:failures")
            pipe.delete(f"cb:{self.config.name}:successes")
            pipe.delete(f"cb:{self.config.name}:half_open_calls")
            await pipe.execute()
        self._failure_count = 0
        self._success_count = 0
        self._half_open_calls = 0
        self._metrics.failure_count = 0
        self._metrics.success_count = 0
    
    async def _get_half_open_calls(self) -> int:
        """Get number of calls in half-open state."""
        if self.redis:
            calls = await self.redis.get(f"cb:{self.config.name}:half_open_calls")
            return int(calls) if calls else 0
        return self._half_open_calls
    
    async def _increment_half_open_calls(self):
        """Increment half-open call counter."""
        if self.redis:
            await self.redis.incr(f"cb:{self.config.name}:half_open_calls")
        self._half_open_calls += 1
    
    async def _get_last_failure_time(self) -> float:
        """Get last failure timestamp."""
        if self.redis:
            last = await self.redis.get(f"cb:{self.config.name}:last_failure")
            return float(last) if last else 0.0
        return self._last_failure_time or 0.0
    
    async def _set_last_failure_time(self, timestamp: float):
        """Set last failure timestamp."""
        if self.redis:
            await self.redis.set(f"cb:{self.config.name}:last_failure", str(timestamp))
        self._last_failure_time = timestamp
    
    async def _increment_concurrent(self):
        """Increment concurrent call counter."""
        self._concurrent_calls += 1
        self._metrics.concurrent_calls = self._concurrent_calls
    
    async def _decrement_concurrent(self):
        """Decrement concurrent call counter."""
        self._concurrent_calls = max(0, self._concurrent_calls - 1)
        self._metrics.concurrent_calls = self._concurrent_calls
    
    async def health_check(self) -> Dict[str, Any]:
        """Return health status for monitoring."""
        state = await self._get_state()
        return {
            "name": self.config.name,
            "state": state.value,
            "healthy": state == CircuitState.CLOSED,
            "metrics": {
                "failure_count": self._failure_count,
                "success_count": self._success_count,
                "total_calls": self._metrics.total_calls,
                "total_failures": self._metrics.total_failures,
                "total_successes": self._metrics.total_successes,
                "concurrent_calls": self._concurrent_calls,
                "max_concurrent": self.config.max_concurrent
            },
            "config": {
                "failure_threshold": self.config.failure_threshold,
                "recovery_timeout": self.config.recovery_timeout,
                "half_open_max_calls": self.config.half_open_max_calls,
                "success_threshold": self.config.success_threshold
            },
            "timestamps": {
                "last_failure": self._last_failure_time,
                "last_success": self._metrics.last_success_time
            }
        }
    
    @asynccontextmanager
    async def protect(self):
        """
        Context manager for circuit breaker protection with bulkhead pattern.
        
        Usage:
            async with cb.protect():
                result = await some_async_operation()
        """
        state = await self._get_state()
        
        if state == CircuitState.OPEN:
            raise CircuitBreakerOpen(f"Circuit {self.config.name} is OPEN")
        
        # Check half-open limits
        if state == CircuitState.HALF_OPEN:
            half_open_calls = await self._get_half_open_calls()
            if half_open_calls >= self.config.half_open_max_calls:
                raise CircuitBreakerOpen(f"Circuit {self.config.name} is HALF_OPEN (max calls reached)")
            await self._increment_half_open_calls()
        
        # Bulkhead pattern: limit concurrent calls using semaphore
        async with self._semaphore:
            await self._increment_concurrent()
            try:
                yield
                await self._on_success()
            except Exception:
                await self._on_failure()
                raise
            finally:
                await self._decrement_concurrent()
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection and bulkhead pattern.
        
        Raises:
            CircuitBreakerOpen: If circuit is open
            Exception: Original exception if call fails
        """
        self._metrics.total_calls += 1
        
        state = await self._get_state()
        
        # Check if we should transition from OPEN to HALF_OPEN
        if state == CircuitState.OPEN:
            last_failure = await self._get_last_failure_time()
            time_since_failure = time.time() - last_failure
            
            if time_since_failure >= self.config.recovery_timeout:
                await self._set_state(CircuitState.HALF_OPEN)
                await self._reset_counters()
                state = CircuitState.HALF_OPEN
                logger.info(f"[CircuitBreaker:{self.config.name}] Transitioning to HALF_OPEN")
            else:
                remaining = self.config.recovery_timeout - time_since_failure
                logger.warning(f"[CircuitBreaker:{self.config.name}] Circuit OPEN, retry after {remaining:.1f}s")
                raise CircuitBreakerOpen(
                    f"Circuit {self.config.name} is OPEN. Retry after {remaining:.1f} seconds"
                )
        
        # In HALF_OPEN, limit concurrent test calls
        if state == CircuitState.HALF_OPEN:
            half_open_calls = await self._get_half_open_calls()
            if half_open_calls >= self.config.half_open_max_calls:
                logger.warning(f"[CircuitBreaker:{self.config.name}] HALF_OPEN max calls reached")
                raise CircuitBreakerOpen(f"Circuit {self.config.name} is HALF_OPEN (max calls reached)")
            await self._increment_half_open_calls()
        
        # Bulkhead pattern: limit concurrent calls using semaphore
        async with self._semaphore:
            await self._increment_concurrent()
            try:
                # Execute the call
                result = await func(*args, **kwargs)
                await self._on_success()
                return result
            except Exception as e:
                await self._on_failure()
                raise
            finally:
                await self._decrement_concurrent()
    
    async def _on_success(self):
        """Handle successful call."""
        state = await self._get_state()
        await self._increment_success()
        
        if state == CircuitState.HALF_OPEN:
            if self._success_count >= self.config.success_threshold:
                await self._set_state(CircuitState.CLOSED)
                await self._reset_counters()
                logger.info(f"[CircuitBreaker:{self.config.name}] Circuit CLOSED (recovered)")
        else:
            # In CLOSED state, reset failures on success
            if self._failure_count > 0:
                await self._reset_counters()
    
    async def _on_failure(self):
        """Handle failed call."""
        await self._increment_failure()
        
        if self._failure_count >= self.config.failure_threshold:
            await self._set_state(CircuitState.OPEN)
            await self._set_last_failure_time(time.time())
            logger.error(f"[CircuitBreaker:{self.config.name}] Circuit OPENED after {self._failure_count} failures")
    
    def __call__(self, func: Callable) -> Callable:
        """Decorator interface."""
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await self.call(func, *args, **kwargs)
        return wrapper
    
    async def get_metrics(self) -> CircuitBreakerMetrics:
        """Get current metrics."""
        self._metrics.state = await self._get_state()
        self._metrics.concurrent_calls = self._concurrent_calls
        return self._metrics


# Pre-configured circuit breakers
db_circuit = CircuitBreaker(
    "database",
    failure_threshold=5,
    recovery_timeout=30.0,
    max_concurrent=20
)

api_circuit = CircuitBreaker(
    "external_api",
    failure_threshold=3,
    recovery_timeout=60.0,
    max_concurrent=15
)

redis_circuit = CircuitBreaker(
    "redis",
    failure_threshold=10,
    recovery_timeout=10.0,
    max_concurrent=50
)


def get_circuit_breaker(name: str) -> Optional[CircuitBreaker]:
    """Get a circuit breaker by name."""
    return CircuitBreaker._registry.get(name)


async def get_all_metrics() -> Dict[str, CircuitBreakerMetrics]:
    """Get metrics for all circuit breakers."""
    metrics = {}
    for name, cb in CircuitBreaker._registry.items():
        metrics[name] = await cb.get_metrics()
    return metrics


async def health_check_all() -> Dict[str, Dict[str, Any]]:
    """Get health check for all circuit breakers."""
    health = {}
    for name, cb in CircuitBreaker._registry.items():
        health[name] = await cb.health_check()
    return health
