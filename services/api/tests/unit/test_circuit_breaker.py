"""Unit tests for Circuit Breaker middleware.

[Ver001.000]

These tests import directly from the circuit_breaker module path
to avoid dependency issues with other project modules.
"""

import asyncio
import sys
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, patch

import pytest

# Add the middleware directory to path
middleware_path = Path(__file__).parent.parent.parent / "src" / "njz_api" / "middleware"
sys.path.insert(0, str(middleware_path))

# Import after path setup - we need to handle the relative imports
try:
    # Try direct import first
    import importlib.util
    spec = importlib.util.spec_from_file_location("circuit_breaker", middleware_path / "circuit_breaker.py")
    circuit_breaker_module = importlib.util.module_from_spec(spec)
    sys.modules["circuit_breaker"] = circuit_breaker_module
    spec.loader.exec_module(circuit_breaker_module)
    
    CircuitBreaker = circuit_breaker_module.CircuitBreaker
    CircuitBreakerConfig = circuit_breaker_module.CircuitBreakerConfig
    CircuitBreakerOpen = circuit_breaker_module.CircuitBreakerOpen
    CircuitState = circuit_breaker_module.CircuitState
    circuit_breaker = circuit_breaker_module.circuit_breaker
    circuit_breaker_with_config = circuit_breaker_module.circuit_breaker_with_config
    create_circuit_breaker = circuit_breaker_module.create_circuit_breaker
    get_all_circuit_breakers = circuit_breaker_module.get_all_circuit_breakers
    get_circuit_breaker = circuit_breaker_module.get_circuit_breaker
    get_circuit_breaker_status = circuit_breaker_module.get_circuit_breaker_status
    remove_circuit_breaker = circuit_breaker_module.remove_circuit_breaker
    reset_circuit_breaker = circuit_breaker_module.reset_circuit_breaker
except Exception as e:
    pytest.skip(f"Could not import circuit_breaker module: {e}", allow_module_level=True)


class TestCircuitBreakerState:
    """Tests for circuit breaker state management."""

    def test_initial_state(self):
        """Circuit breaker starts in CLOSED state."""
        cb = CircuitBreaker("test")
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0
        assert cb.last_failure_time is None

    @pytest.mark.asyncio
    async def test_successful_call(self):
        """Successful calls reset failure count."""
        cb = CircuitBreaker("test")

        async def success_func():
            return "success"

        result = await cb.call(success_func)
        assert result == "success"
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0

    @pytest.mark.asyncio
    async def test_failure_counting(self):
        """Failures increment failure count."""
        cb = CircuitBreaker("test", CircuitBreakerConfig(failure_threshold=5))

        async def fail_func():
            raise ValueError("Test error")

        # First 4 failures should keep circuit closed
        for i in range(4):
            with pytest.raises(ValueError):
                await cb.call(fail_func)
            assert cb.state == CircuitState.CLOSED
            assert cb.failure_count == i + 1


class TestCircuitBreakerTransitions:
    """Tests for circuit breaker state transitions."""

    @pytest.mark.asyncio
    async def test_opens_after_threshold(self):
        """Circuit opens after failure threshold reached."""
        cb = CircuitBreaker("test", CircuitBreakerConfig(failure_threshold=3))

        async def fail_func():
            raise ValueError("Test error")

        # Trigger 3 failures
        for _ in range(3):
            with pytest.raises(ValueError):
                await cb.call(fail_func)

        assert cb.state == CircuitState.OPEN
        assert cb.failure_count == 3

    @pytest.mark.asyncio
    async def test_rejects_when_open(self):
        """Circuit rejects calls when open."""
        cb = CircuitBreaker("test", CircuitBreakerConfig(failure_threshold=1))

        async def fail_func():
            raise ValueError("Test error")

        # Trigger failure to open circuit
        with pytest.raises(ValueError):
            await cb.call(fail_func)

        assert cb.state == CircuitState.OPEN

        # Next call should be rejected
        async def any_func():
            return "should not reach"

        with pytest.raises(CircuitBreakerOpen) as exc_info:
            await cb.call(any_func)

        assert "test" in str(exc_info.value)

    @pytest.mark.asyncio
    async def test_half_open_transition(self):
        """Circuit transitions to half-open after timeout."""
        cb = CircuitBreaker(
            "test", CircuitBreakerConfig(failure_threshold=1, recovery_timeout=0.1, success_threshold=1)
        )

        async def fail_func():
            raise ValueError("Test error")

        # Open the circuit
        with pytest.raises(ValueError):
            await cb.call(fail_func)

        assert cb.state == CircuitState.OPEN

        # Wait for recovery timeout
        await asyncio.sleep(0.15)

        # Next call should transition to half-open then close on success
        async def success_func():
            return "success"

        result = await cb.call(success_func)
        assert result == "success"
        assert cb.state == CircuitState.CLOSED  # Success closes it with success_threshold=1

    @pytest.mark.asyncio
    async def test_half_open_failure_reopens(self):
        """Failure in half-open returns to open."""
        cb = CircuitBreaker(
            "test",
            CircuitBreakerConfig(
                failure_threshold=1, recovery_timeout=0.1, half_open_max_calls=3
            ),
        )

        async def fail_func():
            raise ValueError("Test error")

        # Open the circuit
        with pytest.raises(ValueError):
            await cb.call(fail_func)

        # Wait for recovery timeout
        await asyncio.sleep(0.15)

        # Fail in half-open
        with pytest.raises(ValueError):
            await cb.call(fail_func)

        assert cb.state == CircuitState.OPEN


class TestCircuitBreakerSuccessThreshold:
    """Tests for success threshold in half-open state."""

    @pytest.mark.asyncio
    async def test_success_threshold_closes_circuit(self):
        """Multiple successes in half-open closes circuit."""
        cb = CircuitBreaker(
            "test",
            CircuitBreakerConfig(
                failure_threshold=1,
                recovery_timeout=0.1,
                half_open_max_calls=5,
                success_threshold=2,
            ),
        )

        async def fail_func():
            raise ValueError("Test error")

        async def success_func():
            return "success"

        # Open the circuit
        with pytest.raises(ValueError):
            await cb.call(fail_func)

        await asyncio.sleep(0.15)

        # First success in half-open
        await cb.call(success_func)
        assert cb.state == CircuitState.HALF_OPEN

        # Second success should close circuit
        await cb.call(success_func)
        assert cb.state == CircuitState.CLOSED


class TestCircuitBreakerTimeout:
    """Tests for timeout functionality."""

    @pytest.mark.asyncio
    async def test_timeout_triggers_failure(self):
        """Timeout counts as failure."""
        cb = CircuitBreaker(
            "test", CircuitBreakerConfig(failure_threshold=1, timeout=0.1)
        )

        async def slow_func():
            await asyncio.sleep(1)
            return "too slow"

        with pytest.raises(asyncio.TimeoutError):
            await cb.call(slow_func)

        assert cb.failure_count == 1


class TestCircuitBreakerMetrics:
    """Tests for circuit breaker metrics."""

    @pytest.mark.asyncio
    async def test_metrics_tracking(self):
        """Metrics track calls correctly."""
        cb = CircuitBreaker("test")

        async def success_func():
            return "success"

        async def fail_func():
            raise ValueError("fail")

        # Record some calls
        await cb.call(success_func)
        await cb.call(success_func)

        with pytest.raises(ValueError):
            await cb.call(fail_func)

        metrics = cb.metrics.to_dict()
        assert metrics["total_calls"] == 3
        assert metrics["successful_calls"] == 2
        assert metrics["failed_calls"] == 1
        assert abs(metrics["success_rate"] - 66.67) < 0.1

    def test_to_dict(self):
        """to_dict returns complete state."""
        cb = CircuitBreaker(
            "test",
            CircuitBreakerConfig(
                failure_threshold=5, recovery_timeout=60.0, timeout=10.0
            ),
        )

        data = cb.to_dict()
        assert data["name"] == "test"
        assert data["state"] == "closed"
        assert data["config"]["failure_threshold"] == 5
        assert data["config"]["recovery_timeout"] == 60.0
        assert data["config"]["timeout"] == 10.0


class TestCircuitBreakerRegistry:
    """Tests for circuit breaker registry."""

    def setup_method(self):
        """Clean up registry before each test."""
        # Clear all circuit breakers
        for name in list(get_all_circuit_breakers().keys()):
            remove_circuit_breaker(name)

    def teardown_method(self):
        """Clean up registry after each test."""
        for name in list(get_all_circuit_breakers().keys()):
            remove_circuit_breaker(name)

    def test_get_or_create(self):
        """get_circuit_breaker creates if not exists."""
        cb1 = get_circuit_breaker("test")
        cb2 = get_circuit_breaker("test")
        assert cb1 is cb2

    def test_get_all_circuit_breakers(self):
        """get_all_circuit_breakers returns all CBs."""
        get_circuit_breaker("cb1")
        get_circuit_breaker("cb2")

        all_cbs = get_all_circuit_breakers()
        assert "cb1" in all_cbs
        assert "cb2" in all_cbs

    def test_reset_circuit_breaker(self):
        """reset_circuit_breaker resets state."""
        cb = get_circuit_breaker("test")
        cb._state = CircuitState.OPEN
        cb._failure_count = 5

        success = reset_circuit_breaker("test")
        assert success is True
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 0

    def test_reset_not_found(self):
        """reset_circuit_breaker returns False for unknown."""
        success = reset_circuit_breaker("nonexistent")
        assert success is False

    def test_remove_circuit_breaker(self):
        """remove_circuit_breaker removes from registry."""
        get_circuit_breaker("test")
        assert "test" in get_all_circuit_breakers()

        success = remove_circuit_breaker("test")
        assert success is True
        assert "test" not in get_all_circuit_breakers()

    @pytest.mark.asyncio
    async def test_get_circuit_breaker_status(self):
        """get_circuit_breaker_status returns complete status."""
        get_circuit_breaker("cb1")
        get_circuit_breaker("cb2")

        status = await get_circuit_breaker_status()
        assert status["summary"]["total"] == 2
        assert status["summary"]["closed"] == 2
        assert "circuit_breakers" in status


class TestCircuitBreakerDecorator:
    """Tests for circuit_breaker decorator."""

    def setup_method(self):
        """Clean up registry."""
        for name in list(get_all_circuit_breakers().keys()):
            remove_circuit_breaker(name)

    def teardown_method(self):
        """Clean up registry."""
        for name in list(get_all_circuit_breakers().keys()):
            remove_circuit_breaker(name)

    @pytest.mark.asyncio
    async def test_decorator_creates_circuit_breaker(self):
        """Decorator creates and uses circuit breaker."""

        @circuit_breaker("decorated_test", failure_threshold=2)
        async def test_func():
            return "success"

        result = await test_func()
        assert result == "success"

        # Circuit breaker should exist
        cb = get_circuit_breaker("decorated_test")
        assert cb is not None

    @pytest.mark.asyncio
    async def test_decorator_shares_circuit_breaker(self):
        """Same name shares circuit breaker."""

        @circuit_breaker("shared_cb", failure_threshold=2)
        async def func1():
            raise ValueError("fail")

        @circuit_breaker("shared_cb", failure_threshold=2)
        async def func2():
            return "success"

        # First function fails twice
        with pytest.raises(ValueError):
            await func1()
        with pytest.raises(ValueError):
            await func1()

        # Circuit should be open, func2 should be blocked
        with pytest.raises(CircuitBreakerOpen):
            await func2()

    @pytest.mark.asyncio
    async def test_decorator_preserves_function_metadata(self):
        """Decorator preserves function name and docstring."""

        @circuit_breaker("metadata_test")
        async def my_function():
            """My docstring."""
            return "result"

        assert my_function.__name__ == "my_function"
        assert my_function.__doc__ == "My docstring."


class TestCircuitBreakerConfig:
    """Tests for CircuitBreakerConfig."""

    def test_default_config(self):
        """Default config has sensible values."""
        config = CircuitBreakerConfig()
        assert config.failure_threshold == 5
        assert config.recovery_timeout == 30.0
        assert config.half_open_max_calls == 3
        assert config.success_threshold == 2
        assert config.timeout is None

    def test_custom_config(self):
        """Config can be customized."""
        config = CircuitBreakerConfig(
            failure_threshold=3,
            recovery_timeout=60.0,
            half_open_max_calls=5,
            success_threshold=3,
            expected_exception=ConnectionError,
            timeout=10.0,
        )
        assert config.failure_threshold == 3
        assert config.recovery_timeout == 60.0
        assert config.half_open_max_calls == 5
        assert config.success_threshold == 3
        assert config.expected_exception == ConnectionError
        assert config.timeout == 10.0


class TestCircuitBreakerEdgeCases:
    """Tests for edge cases."""

    @pytest.mark.asyncio
    async def test_exception_not_counted_if_not_expected(self):
        """Only expected exceptions count as failures."""
        cb = CircuitBreaker(
            "test", CircuitBreakerConfig(failure_threshold=1, expected_exception=ValueError)
        )

        async def type_error_func():
            raise TypeError("wrong type")

        # TypeError should not count as failure
        with pytest.raises(TypeError):
            await cb.call(type_error_func)

        assert cb.failure_count == 0
        assert cb.state == CircuitState.CLOSED

    @pytest.mark.asyncio
    async def test_tuple_of_exceptions(self):
        """Tuple of exception types works correctly."""
        cb = CircuitBreaker(
            "test",
            CircuitBreakerConfig(failure_threshold=1, expected_exception=(ValueError, TypeError)),
        )

        async def value_error_func():
            raise ValueError("fail")

        with pytest.raises(ValueError):
            await cb.call(value_error_func)

        assert cb.failure_count == 1

    @pytest.mark.asyncio
    async def test_concurrent_calls(self):
        """Circuit breaker handles concurrent calls."""
        cb = CircuitBreaker("test", CircuitBreakerConfig(failure_threshold=10))

        call_count = 0

        async def counting_func():
            nonlocal call_count
            call_count += 1
            await asyncio.sleep(0.01)
            return call_count

        # Make concurrent calls
        tasks = [cb.call(counting_func) for _ in range(10)]
        results = await asyncio.gather(*tasks)

        assert len(results) == 10
        assert call_count == 10


class TestCircuitBreakerIntegration:
    """Integration-style tests."""

    def setup_method(self):
        """Clean up."""
        for name in list(get_all_circuit_breakers().keys()):
            remove_circuit_breaker(name)

    def teardown_method(self):
        """Clean up."""
        for name in list(get_all_circuit_breakers().keys()):
            remove_circuit_breaker(name)

    @pytest.mark.asyncio
    async def test_full_lifecycle(self):
        """Test complete circuit breaker lifecycle."""
        cb = CircuitBreaker(
            "lifecycle_test",
            CircuitBreakerConfig(
                failure_threshold=2,
                recovery_timeout=0.1,
                success_threshold=1,
            ),
        )

        # Phase 1: Normal operation (CLOSED)
        async def success():
            return "ok"

        async def fail():
            raise ConnectionError("network error")

        result = await cb.call(success)
        assert result == "ok"
        assert cb.state == CircuitState.CLOSED

        # Phase 2: Failures accumulating
        with pytest.raises(ConnectionError):
            await cb.call(fail)
        assert cb.state == CircuitState.CLOSED
        assert cb.failure_count == 1

        # Phase 3: Circuit OPENS
        with pytest.raises(ConnectionError):
            await cb.call(fail)
        assert cb.state == CircuitState.OPEN
        assert cb.failure_count == 2

        # Phase 4: Fast fail
        with pytest.raises(CircuitBreakerOpen):
            await cb.call(success)

        # Phase 5: Recovery timeout passes
        await asyncio.sleep(0.15)

        # Phase 6: HALF_OPEN and recovery
        result = await cb.call(success)
        assert result == "ok"
        assert cb.state == CircuitState.CLOSED

        # Phase 7: Back to normal
        assert cb.failure_count == 0


# pytest marker for async tests
pytestmark = pytest.mark.asyncio
