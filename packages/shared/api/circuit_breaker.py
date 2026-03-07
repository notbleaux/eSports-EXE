"""Circuit breaker pattern for fault tolerance."""
import time
import asyncio
from enum import Enum
from typing import Callable, Optional, Any
from functools import wraps


class CircuitState(Enum):
    CLOSED = "closed"      # Normal operation
    OPEN = "open"          # Failing fast
    HALF_OPEN = "half_open"  # Testing recovery


class CircuitBreaker:
    """Prevents cascade failures by failing fast after threshold."""
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 3,
        recovery_timeout: int = 60,
        half_open_max_calls: int = 1
    ):
        self.name = name
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        
        self.state = CircuitState.CLOSED
        self.failure_count = 0
        self.last_failure_time: Optional[float] = None
        self.half_open_calls = 0
        self.success_count = 0

    def can_execute(self) -> bool:
        """Check if operation should be allowed."""
        if self.state == CircuitState.CLOSED:
            return True
        
        if self.state == CircuitState.OPEN:
            if time.time() - self.last_failure_time >= self.recovery_timeout:
                print(f"🔧 Circuit '{self.name}' entering HALF_OPEN state")
                self.state = CircuitState.HALF_OPEN
                self.half_open_calls = 0
                return True
            return False
        
        if self.state == CircuitState.HALF_OPEN:
            if self.half_open_calls < self.half_open_max_calls:
                self.half_open_calls += 1
                return True
            return False
        
        return False

    def record_success(self):
        """Record successful operation."""
        self.success_count += 1
        
        if self.state == CircuitState.HALF_OPEN:
            print(f"✅ Circuit '{self.name}' recovered - closing")
            self.state = CircuitState.CLOSED
            self.failure_count = 0
            self.half_open_calls = 0
        else:
            self.failure_count = 0

    def record_failure(self):
        """Record failed operation."""
        self.failure_count += 1
        self.last_failure_time = time.time()
        
        if self.state == CircuitState.HALF_OPEN:
            print(f"❌ Circuit '{self.name}' failed in HALF_OPEN - opening")
            self.state = CircuitState.OPEN
        elif self.failure_count >= self.failure_threshold:
            print(f"🚨 Circuit '{self.name}' opened after {self.failure_count} failures")
            self.state = CircuitState.OPEN

    def get_status(self) -> dict:
        """Return current circuit status."""
        return {
            "name": self.name,
            "state": self.state.value,
            "failure_count": self.failure_count,
            "success_count": self.success_count,
            "last_failure": self.last_failure_time
        }


class CircuitBreakerOpen(Exception):
    """Raised when circuit breaker is open."""
    pass


# Registry of circuit breakers
_circuit_breakers: dict[str, CircuitBreaker] = {}


def get_circuit_breaker(name: str, **kwargs) -> CircuitBreaker:
    """Get or create a circuit breaker."""
    if name not in _circuit_breakers:
        _circuit_breakers[name] = CircuitBreaker(name, **kwargs)
    return _circuit_breakers[name]


def circuit_breaker(
    name: Optional[str] = None,
    failure_threshold: int = 3,
    recovery_timeout: int = 60,
    fallback: Optional[Callable] = None
):
    """Decorator to apply circuit breaker pattern."""
    def decorator(func):
        cb_name = name or func.__name__
        breaker = get_circuit_breaker(
            cb_name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout
        )
        
        @wraps(func)
        async def wrapper(*args, **kwargs):
            if not breaker.can_execute():
                if fallback:
                    return await fallback(*args, **kwargs)
                raise CircuitBreakerOpen(
                    f"Circuit '{cb_name}' is OPEN - service temporarily unavailable"
                )
            
            try:
                result = await func(*args, **kwargs)
                breaker.record_success()
                return result
            except Exception as e:
                breaker.record_failure()
                raise e
        
        return wrapper
    return decorator


# Fallback handlers
async def fallback_cached_data(source: str, *args, **kwargs):
    """Return cached data when source is unavailable."""
    print(f"📦 Returning cached data for {source}")
    return {"cached": True, "source": source, "data": None}


async def fallback_empty_list(*args, **kwargs):
    """Return empty list as fallback."""
    return []


async def fallback_none(*args, **kwargs):
    """Return None as fallback."""
    return None