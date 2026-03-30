"""Circuit breaker pattern for FastAPI endpoints.

[Ver001.000]

Provides resilience against cascading failures by detecting when external
services are experiencing issues and failing fast rather than waiting for
timeouts. Implements the standard circuit breaker pattern with three states:
CLOSED (normal), OPEN (failing), and HALF_OPEN (testing recovery).

Reference: SimCore/Resilience/CircuitBreaker.cs (game simulation)
"""

import asyncio
import logging
from datetime import datetime, timedelta, timezone
from enum import Enum
from functools import wraps
from typing import Any, Callable, Dict, Optional, Type, Union

logger = logging.getLogger(__name__)


class CircuitState(Enum):
    """Circuit breaker states."""

    CLOSED = "closed"  # Normal operation - requests pass through
    OPEN = "open"  # Failing fast - reject requests immediately
    HALF_OPEN = "half_open"  # Testing if service recovered


class CircuitBreakerOpen(Exception):
    """Exception raised when circuit breaker is open."""

    def __init__(self, circuit_name: str, message: Optional[str] = None):
        self.circuit_name = circuit_name
        self.message = message or f"Circuit breaker '{circuit_name}' is OPEN"
        super().__init__(self.message)


class CircuitBreakerConfig:
    """Configuration for circuit breaker behavior."""

    def __init__(
        self,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        half_open_max_calls: int = 3,
        success_threshold: int = 2,
        expected_exception: Union[Type[Exception], tuple] = Exception,
        timeout: Optional[float] = None,
    ):
        """Initialize circuit breaker configuration.

        Args:
            failure_threshold: Number of failures before opening circuit
            recovery_timeout: Seconds to wait before attempting recovery
            half_open_max_calls: Max calls allowed in half-open state
            success_threshold: Consecutive successes needed to close circuit
            expected_exception: Exception type(s) that trigger failure counting
            timeout: Optional timeout for protected calls (seconds)
        """
        self.failure_threshold = failure_threshold
        self.recovery_timeout = recovery_timeout
        self.half_open_max_calls = half_open_max_calls
        self.success_threshold = success_threshold
        self.expected_exception = expected_exception
        self.timeout = timeout


class CircuitBreakerMetrics:
    """Metrics tracking for circuit breaker."""

    def __init__(self):
        self.total_calls: int = 0
        self.successful_calls: int = 0
        self.failed_calls: int = 0
        self.rejected_calls: int = 0
        self.state_transitions: list = []

    def record_success(self):
        """Record a successful call."""
        self.total_calls += 1
        self.successful_calls += 1

    def record_failure(self):
        """Record a failed call."""
        self.total_calls += 1
        self.failed_calls += 1

    def record_rejection(self):
        """Record a rejected call (circuit open)."""
        self.total_calls += 1
        self.rejected_calls += 1

    def record_state_transition(self, from_state: CircuitState, to_state: CircuitState):
        """Record a state transition."""
        self.state_transitions.append(
            {
                "from": from_state.value,
                "to": to_state.value,
                "timestamp": datetime.now(timezone.utc).isoformat(),
            }
        )

    def to_dict(self) -> Dict[str, Any]:
        """Convert metrics to dictionary."""
        return {
            "total_calls": self.total_calls,
            "successful_calls": self.successful_calls,
            "failed_calls": self.failed_calls,
            "rejected_calls": self.rejected_calls,
            "success_rate": (
                self.successful_calls / max(self.total_calls, 1) * 100
            ),
            "state_transitions": self.state_transitions[-10:],  # Last 10
        }


class CircuitBreaker:
    """Circuit breaker for API resilience.

    Protects against cascading failures by:
    1. Tracking failures in external calls
    2. Opening circuit when threshold is exceeded
    3. Failing fast while circuit is open
    4. Testing recovery in half-open state
    5. Closing circuit when healthy again
    """

    def __init__(
        self,
        name: str,
        config: Optional[CircuitBreakerConfig] = None,
    ):
        """Initialize circuit breaker.

        Args:
            name: Unique identifier for this circuit breaker
            config: Circuit breaker configuration
        """
        self.name = name
        self.config = config or CircuitBreakerConfig()

        # State management
        self._state = CircuitState.CLOSED
        self._failure_count: int = 0
        self._success_count: int = 0
        self._half_open_calls: int = 0
        self._last_failure_time: Optional[datetime] = None
        self._opened_at: Optional[datetime] = None

        # Metrics
        self.metrics = CircuitBreakerMetrics()

        # Thread safety
        self._lock = asyncio.Lock()

    @property
    def state(self) -> CircuitState:
        """Get current circuit state."""
        return self._state

    @property
    def failure_count(self) -> int:
        """Get current failure count."""
        return self._failure_count

    @property
    def last_failure_time(self) -> Optional[datetime]:
        """Get time of last failure."""
        return self._last_failure_time

    def _should_attempt_reset(self) -> bool:
        """Check if enough time has passed to try recovery."""
        if not self._last_failure_time:
            return True
        elapsed = datetime.now(timezone.utc) - self._last_failure_time
        return elapsed.total_seconds() > self.config.recovery_timeout

    def _transition_to(self, new_state: CircuitState):
        """Transition to a new state."""
        if self._state != new_state:
            old_state = self._state
            self._state = new_state
            self.metrics.record_state_transition(old_state, new_state)

            if new_state == CircuitState.OPEN:
                self._opened_at = datetime.now(timezone.utc)
                logger.warning(
                    f"Circuit breaker '{self.name}' OPENED after "
                    f"{self._failure_count} failures"
                )
            elif new_state == CircuitState.CLOSED:
                logger.info(f"Circuit breaker '{self.name}' CLOSED (healthy)")
            elif new_state == CircuitState.HALF_OPEN:
                logger.info(f"Circuit breaker '{self.name}' HALF_OPEN (testing)")

    def _on_success(self):
        """Handle successful call."""
        self._failure_count = 0
        self._last_failure_time = None
        self.metrics.record_success()

        if self._state == CircuitState.HALF_OPEN:
            self._success_count += 1
            self._half_open_calls += 1

            # Close circuit after enough consecutive successes
            if self._success_count >= self.config.success_threshold:
                self._transition_to(CircuitState.CLOSED)
                self._success_count = 0
                self._half_open_calls = 0
        else:
            self._success_count = 0

    def _on_failure(self):
        """Handle failed call."""
        self._failure_count += 1
        self._last_failure_time = datetime.now(timezone.utc)
        self.metrics.record_failure()

        if self._state == CircuitState.HALF_OPEN:
            # Back to open on any failure in half-open
            self._transition_to(CircuitState.OPEN)
            self._half_open_calls = 0
            self._success_count = 0
        elif self._failure_count >= self.config.failure_threshold:
            self._transition_to(CircuitState.OPEN)

    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """Execute function with circuit breaker protection.

        Args:
            func: Async function to execute
            *args: Positional arguments for func
            **kwargs: Keyword arguments for func

        Returns:
            Result from func execution

        Raises:
            CircuitBreakerOpen: If circuit is open
            Exception: Any exception from func (if expected type)
        """
        async with self._lock:
            # Check if we should transition from OPEN to HALF_OPEN
            if self._state == CircuitState.OPEN:
                if self._should_attempt_reset():
                    self._transition_to(CircuitState.HALF_OPEN)
                    self._half_open_calls = 0
                else:
                    self.metrics.record_rejection()
                    raise CircuitBreakerOpen(self.name)

            # Limit calls in half-open state
            if self._state == CircuitState.HALF_OPEN:
                if self._half_open_calls >= self.config.half_open_max_calls:
                    self.metrics.record_rejection()
                    raise CircuitBreakerOpen(
                        self.name, f"Circuit '{self.name}' half-open limit reached"
                    )
                self._half_open_calls += 1

        # Execute the protected function
        try:
            # Apply timeout if configured
            if self.config.timeout:
                result = await asyncio.wait_for(
                    func(*args, **kwargs), timeout=self.config.timeout
                )
            else:
                result = await func(*args, **kwargs)

            async with self._lock:
                self._on_success()

            return result

        except asyncio.TimeoutError:
            async with self._lock:
                self._on_failure()
            raise

        except Exception as e:
            # Check if this exception type should count as a failure
            if isinstance(e, self.config.expected_exception):
                async with self._lock:
                    self._on_failure()
            raise

    def to_dict(self) -> Dict[str, Any]:
        """Convert circuit breaker state to dictionary."""
        return {
            "name": self.name,
            "state": self._state.value,
            "failure_count": self._failure_count,
            "success_count": self._success_count,
            "half_open_calls": self._half_open_calls,
            "last_failure": (
                self._last_failure_time.isoformat() if self._last_failure_time else None
            ),
            "opened_at": self._opened_at.isoformat() if self._opened_at else None,
            "config": {
                "failure_threshold": self.config.failure_threshold,
                "recovery_timeout": self.config.recovery_timeout,
                "half_open_max_calls": self.config.half_open_max_calls,
                "success_threshold": self.config.success_threshold,
                "timeout": self.config.timeout,
            },
            "metrics": self.metrics.to_dict(),
        }


# Global circuit breaker registry
_circuit_breakers: Dict[str, CircuitBreaker] = {}


def get_circuit_breaker(
    name: str, config: Optional[CircuitBreakerConfig] = None
) -> CircuitBreaker:
    """Get or create a circuit breaker.

    Args:
        name: Unique identifier for the circuit breaker
        config: Optional configuration (used only when creating)

    Returns:
        CircuitBreaker instance
    """
    if name not in _circuit_breakers:
        _circuit_breakers[name] = CircuitBreaker(name, config)
    return _circuit_breakers[name]


def create_circuit_breaker(name: str, config: Optional[CircuitBreakerConfig] = None) -> CircuitBreaker:
    """Create a new circuit breaker (replaces existing if name exists).

    Args:
        name: Unique identifier for the circuit breaker
        config: Optional configuration

    Returns:
        CircuitBreaker instance
    """
    _circuit_breakers[name] = CircuitBreaker(name, config)
    return _circuit_breakers[name]


def get_all_circuit_breakers() -> Dict[str, CircuitBreaker]:
    """Get all registered circuit breakers.

    Returns:
        Dictionary of circuit breakers by name
    """
    return _circuit_breakers.copy()


def reset_circuit_breaker(name: str) -> bool:
    """Reset a circuit breaker to closed state.

    Args:
        name: Circuit breaker name

    Returns:
        True if reset, False if not found
    """
    if name in _circuit_breakers:
        cb = _circuit_breakers[name]
        cb._state = CircuitState.CLOSED
        cb._failure_count = 0
        cb._success_count = 0
        cb._half_open_calls = 0
        cb._last_failure_time = None
        cb._opened_at = None
        logger.info(f"Circuit breaker '{name}' manually reset")
        return True
    return False


def remove_circuit_breaker(name: str) -> bool:
    """Remove a circuit breaker from registry.

    Args:
        name: Circuit breaker name

    Returns:
        True if removed, False if not found
    """
    if name in _circuit_breakers:
        del _circuit_breakers[name]
        return True
    return False


def circuit_breaker(
    name: str,
    failure_threshold: int = 5,
    recovery_timeout: float = 30.0,
    expected_exception: Union[Type[Exception], tuple] = Exception,
    timeout: Optional[float] = None,
):
    """Decorator for circuit breaker protection.

    Args:
        name: Circuit breaker name (shared across decorated functions with same name)
        failure_threshold: Failures before opening circuit
        recovery_timeout: Seconds before attempting recovery
        expected_exception: Exception type(s) that count as failures
        timeout: Optional timeout for the protected function

    Usage:
        @circuit_breaker("external_api", failure_threshold=3)
        async def call_external_api():
            ...
    """
    config = CircuitBreakerConfig(
        failure_threshold=failure_threshold,
        recovery_timeout=recovery_timeout,
        expected_exception=expected_exception,
        timeout=timeout,
    )

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cb = get_circuit_breaker(name, config)
            return await cb.call(func, *args, **kwargs)

        # Attach circuit breaker reference for testing
        wrapper._circuit_breaker_name = name
        return wrapper

    return decorator


def circuit_breaker_with_config(name: str, config: CircuitBreakerConfig):
    """Decorator with explicit config object.

    Args:
        name: Circuit breaker name
        config: CircuitBreakerConfig instance

    Usage:
        config = CircuitBreakerConfig(failure_threshold=3, recovery_timeout=60)

        @circuit_breaker_with_config("my_api", config)
        async def call_api():
            ...
    """

    def decorator(func: Callable) -> Callable:
        @wraps(func)
        async def wrapper(*args, **kwargs):
            cb = get_circuit_breaker(name, config)
            return await cb.call(func, *args, **kwargs)

        wrapper._circuit_breaker_name = name
        return wrapper

    return decorator


# FastAPI dependency for circuit breaker status
async def get_circuit_breaker_status() -> Dict[str, Any]:
    """Get status of all circuit breakers for monitoring.

    Returns:
        Dictionary with status of all circuit breakers
    """
    return {
        "circuit_breakers": {
            name: cb.to_dict() for name, cb in _circuit_breakers.items()
        },
        "summary": {
            "total": len(_circuit_breakers),
            "closed": sum(
                1 for cb in _circuit_breakers.values() if cb.state == CircuitState.CLOSED
            ),
            "open": sum(
                1 for cb in _circuit_breakers.values() if cb.state == CircuitState.OPEN
            ),
            "half_open": sum(
                1 for cb in _circuit_breakers.values() if cb.state == CircuitState.HALF_OPEN
            ),
        },
    }
