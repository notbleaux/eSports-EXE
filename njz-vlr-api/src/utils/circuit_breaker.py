"""
Circuit Breaker Pattern Implementation
Prevents cascade failures when external services fail
"""

import asyncio
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional

from core.logging import get_logger

logger = get_logger(__name__)


class CircuitState(Enum):
    """Circuit breaker states"""
    CLOSED = "closed"          # Normal operation
    OPEN = "open"              # Failing, reject requests
    HALF_OPEN = "half_open"    # Testing if recovered


@dataclass
class CircuitBreaker:
    """
    Circuit breaker pattern implementation
    
    - CLOSED: Normal operation, requests pass through
    - OPEN: Too many failures, requests rejected immediately
    - HALF_OPEN: After timeout, test if service recovered
    """
    
    failure_threshold: int = 5
    recovery_timeout: int = 60
    
    _state: CircuitState = field(default=CircuitState.CLOSED, repr=False)
    _failures: int = field(default=0, repr=False)
    _last_failure_time: Optional[datetime] = field(default=None, repr=False)
    _lock: asyncio.Lock = field(default_factory=asyncio.Lock, repr=False)
    
    @property
    def state(self) -> CircuitState:
        """Get current state with auto-recovery check"""
        if self._state == CircuitState.OPEN:
            if self._last_failure_time:
                elapsed = (datetime.utcnow() - self._last_failure_time).seconds
                if elapsed >= self.recovery_timeout:
                    self._state = CircuitState.HALF_OPEN
                    logger.info("circuit_breaker.half_open", timeout=self.recovery_timeout)
        return self._state
    
    async def record_success(self):
        """Record successful request"""
        async with self._lock:
            if self._state == CircuitState.HALF_OPEN:
                self._state = CircuitState.CLOSED
                self._failures = 0
                logger.info("circuit_breaker.closed")
            else:
                self._failures = max(0, self._failures - 1)
    
    async def record_failure(self) -> bool:
        """
        Record failed request
        Returns True if circuit just opened
        """
        async with self._lock:
            self._failures += 1
            self._last_failure_time = datetime.utcnow()
            
            if self._failures >= self.failure_threshold:
                if self._state != CircuitState.OPEN:
                    self._state = CircuitState.OPEN
                    logger.warning(
                        "circuit_breaker.opened",
                        failures=self._failures,
                        threshold=self.failure_threshold
                    )
                    return True
            return False
    
    def can_execute(self) -> bool:
        """Check if request can be executed"""
        return self.state in (CircuitState.CLOSED, CircuitState.HALF_OPEN)
    
    def get_stats(self) -> dict:
        """Get circuit breaker statistics"""
        return {
            "state": self.state.value,
            "failures": self._failures,
            "threshold": self.failure_threshold,
            "last_failure": self._last_failure_time.isoformat() if self._last_failure_time else None
        }