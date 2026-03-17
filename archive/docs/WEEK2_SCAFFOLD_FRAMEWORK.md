# Week 2 Scaffold Framework [Ver001.000]
**Mission**: SATOR Hub Enhancement + Circuit Breaker
**Date**: 2026-03-15
**Status**: READY TO EXECUTE

---

## Week 2 Overview

### Primary Goals
1. **Circuit Breaker Implementation** - Prevent cascading failures
2. **SimRating Optimization** - Performance tuning
3. **RAR Implementation** - Risk-adjusted ratings
4. **Predictive Models** - ML foundation

### Dependencies on Week 1
- TacticalView component (stable foundation)
- API with rate limiting and firewall (secure base)
- Database with lazy initialization (scalable)

---

## Circuit Breaker: Technical Design

### What is a Circuit Breaker?
```
CLOSED  →  OPEN  →  HALF-OPEN  →  CLOSED
 (OK)     (Fail)    (Testing)     (OK)
```

**Purpose**: When external service (database, API) fails repeatedly, stop calling it temporarily to:
- Prevent resource exhaustion
- Give failing service time to recover
- Fail fast instead of timeout

### Implementation Plan

#### State Machine
```python
class CircuitState(Enum):
    CLOSED = "closed"       # Normal operation
    OPEN = "open"          # Failing, reject requests
    HALF_OPEN = "half_open"  # Testing if recovered
```

#### Configuration
```python
@dataclass
class CircuitBreakerConfig:
    failure_threshold: int = 5      # Open after 5 failures
    recovery_timeout: float = 30.0   # Try again after 30s
    half_open_max_calls: int = 3     # Test with 3 calls
    success_threshold: int = 2       # Close after 2 successes
```

#### Decorator Usage
```python
@circuit_breaker("database", failure_threshold=5)
async def get_player_data(player_id: str):
    return await db.fetchrow("SELECT * FROM players WHERE id = $1", player_id)

@circuit_breaker("pandascore_api", failure_threshold=3, recovery_timeout=60.0)
async def fetch_live_match(match_id: str):
    return await pandascore_client.get_match(match_id)
```

---

## Week 2 Day-by-Day Plan

### Day 1: Circuit Breaker Foundation
**Morning (4 hrs)**
- [ ] Create `circuit_breaker.py` module
- [ ] Implement state machine
- [ ] Add Redis-backed state storage
- [ ] Write unit tests

**Afternoon (4 hrs)**
- [ ] Create decorator
- [ ] Add metrics/monitoring
- [ ] Apply to database calls
- [ ] Apply to external APIs

**Deliverable**: Circuit breaker protecting all external calls

---

### Day 2: Integration Testing
**Morning (4 hrs)**
- [ ] API contract tests (backend <-> frontend)
- [ ] WebSocket integration tests
- [ ] Database integration tests
- [ ] Circuit breaker integration tests

**Afternoon (4 hrs)**
- [ ] E2E tests for critical paths
- [ ] Load testing setup (k6/Locust)
- [ ] Performance baseline recording
- [ ] CI/CD pipeline updates

**Deliverable**: Comprehensive integration test suite

---

### Day 3: SimRating Optimization
**Morning (4 hrs)**
- [ ] Profile SimRating calculation
- [ ] Identify bottlenecks
- [ ] Add caching layer (Redis)
- [ ] Optimize SQL queries

**Afternoon (4 hrs)**
- [ ] Batch processing for bulk calculations
- [ ] Background job queue (Celery/ARQ)
- [ ] Progressive calculation updates
- [ ] A/B test new vs old

**Deliverable**: 10x faster SimRating calculations

---

### Day 4: RAR Implementation
**Morning (4 hrs)**
- [ ] Design RAR algorithm
- [ ] Implement risk adjustment factors
- [ ] Add confidence intervals
- [ ] Historical backtesting

**Afternoon (4 hrs)**
- [ ] RAR API endpoints
- [ ] Frontend visualization
- [ ] Documentation
- [ ] User feedback collection

**Deliverable**: RAR scores available in API

---

### Day 5: Predictive Models
**Morning (4 hrs)**
- [ ] Feature engineering pipeline
- [ ] Model training infrastructure
- [ ] First model: Win probability
- [ ] Model versioning

**Afternoon (4 hrs)**
- [ ] Model serving endpoint
- [ ] A/B testing framework
- [ ] Model monitoring
- [ ] Documentation

**Deliverable**: ML prediction endpoint live

---

## Circuit Breaker Template Code

```python
# [Ver001.000]
"""
Circuit Breaker Pattern Implementation
Prevents cascading failures in distributed systems.
"""

import asyncio
import time
from enum import Enum
from dataclasses import dataclass, field
from typing import Callable, Optional, Any
from functools import wraps
import redis.asyncio as redis
from contextlib import asynccontextmanager


class CircuitState(Enum):
    CLOSED = "closed"       # Normal operation
    OPEN = "open"          # Failing, reject fast
    HALF_OPEN = "half_open"  # Testing recovery


@dataclass
class CircuitBreakerConfig:
    name: str
    failure_threshold: int = 5
    recovery_timeout: float = 30.0
    half_open_max_calls: int = 3
    success_threshold: int = 2
    
    def __post_init__(self):
        if self.failure_threshold < 1:
            raise ValueError("failure_threshold must be >= 1")
        if self.recovery_timeout < 0:
            raise ValueError("recovery_timeout must be >= 0")


class CircuitBreaker:
    """
    Circuit breaker for protecting external service calls.
    
    Usage:
        cb = CircuitBreaker("database", failure_threshold=5)
        
        @cb
        async def get_data():
            return await db.query()
    """
    
    def __init__(
        self,
        name: str,
        failure_threshold: int = 5,
        recovery_timeout: float = 30.0,
        half_open_max_calls: int = 3,
        success_threshold: int = 2,
        redis_client: Optional[redis.Redis] = None
    ):
        self.config = CircuitBreakerConfig(
            name=name,
            failure_threshold=failure_threshold,
            recovery_timeout=recovery_timeout,
            half_open_max_calls=half_open_max_calls,
            success_threshold=success_threshold
        )
        self.redis = redis_client
        
        # Local state (if no Redis)
        self._state = CircuitState.CLOSED
        self._failure_count = 0
        self._success_count = 0
        self._half_open_calls = 0
        self._last_failure_time = 0.0
    
    async def _get_state(self) -> CircuitState:
        """Get current circuit state."""
        if self.redis:
            state_str = await self.redis.get(f"cb:{self.config.name}:state")
            return CircuitState(state_str.decode()) if state_str else CircuitState.CLOSED
        return self._state
    
    async def _set_state(self, state: CircuitState):
        """Set circuit state."""
        if self.redis:
            await self.redis.set(f"cb:{self.config.name}:state", state.value)
        else:
            self._state = state
    
    async def _increment_failure(self):
        """Increment failure counter."""
        if self.redis:
            await self.redis.incr(f"cb:{self.config.name}:failures")
        else:
            self._failure_count += 1
            self._last_failure_time = time.time()
    
    async def _reset_counters(self):
        """Reset all counters."""
        if self.redis:
            pipe = self.redis.pipeline()
            pipe.delete(f"cb:{self.config.name}:failures")
            pipe.delete(f"cb:{self.config.name}:successes")
            pipe.delete(f"cb:{self.config.name}:half_open_calls")
            await pipe.execute()
        else:
            self._failure_count = 0
            self._success_count = 0
            self._half_open_calls = 0
    
    async def call(self, func: Callable, *args, **kwargs) -> Any:
        """
        Execute function with circuit breaker protection.
        
        Raises:
            CircuitBreakerOpen: If circuit is open
            Exception: Original exception if call fails
        """
        state = await self._get_state()
        
        # Check if we should transition from OPEN to HALF_OPEN
        if state == CircuitState.OPEN:
            last_failure = await self._get_last_failure_time()
            if time.time() - last_failure >= self.config.recovery_timeout:
                await self._set_state(CircuitState.HALF_OPEN)
                await self._reset_counters()
                state = CircuitState.HALF_OPEN
            else:
                raise CircuitBreakerOpen(f"Circuit {self.config.name} is OPEN")
        
        # In HALF_OPEN, limit concurrent test calls
        if state == CircuitState.HALF_OPEN:
            half_open_calls = await self._get_half_open_calls()
            if half_open_calls >= self.config.half_open_max_calls:
                raise CircuitBreakerOpen(f"Circuit {self.config.name} is HALF_OPEN (max calls reached)")
            await self._increment_half_open_calls()
        
        # Execute the call
        try:
            result = await func(*args, **kwargs)
            await self._on_success()
            return result
        except Exception as e:
            await self._on_failure()
            raise
    
    async def _on_success(self):
        """Handle successful call."""
        state = await self._get_state()
        
        if state == CircuitState.HALF_OPEN:
            self._success_count += 1
            if self._success_count >= self.config.success_threshold:
                await self._set_state(CircuitState.CLOSED)
                await self._reset_counters()
        else:
            # In CLOSED state, just reset failures on success
            await self._reset_counters()
    
    async def _on_failure(self):
        """Handle failed call."""
        await self._increment_failure()
        self._failure_count += 1
        
        if self._failure_count >= self.config.failure_threshold:
            await self._set_state(CircuitState.OPEN)
            await self._set_last_failure_time(time.time())
    
    def __call__(self, func: Callable) -> Callable:
        """Decorator interface."""
        @wraps(func)
        async def wrapper(*args, **kwargs):
            return await self.call(func, *args, **kwargs)
        return wrapper


class CircuitBreakerOpen(Exception):
    """Raised when circuit breaker is open."""
    pass


# Pre-configured circuit breakers
db_circuit = CircuitBreaker("database", failure_threshold=5, recovery_timeout=30.0)
api_circuit = CircuitBreaker("external_api", failure_threshold=3, recovery_timeout=60.0)
redis_circuit = CircuitBreaker("redis", failure_threshold=10, recovery_timeout=10.0)
```

---

## Checkpoint Schedule

| Time | Checkpoint | Deliverable |
|------|------------|-------------|
| Day 1 12:00 | Circuit Breaker Core | Working state machine |
| Day 1 17:00 | Circuit Breaker Complete | All services protected |
| Day 2 12:00 | Integration Tests 50% | API contract tests |
| Day 2 17:00 | Integration Complete | E2E tests passing |
| Day 3 12:00 | SimRating Profiled | Bottleneck identified |
| Day 3 17:00 | SimRating Optimized | 10x performance gain |
| Day 4 12:00 | RAR Algorithm | Design finalized |
| Day 4 17:00 | RAR Complete | API endpoint live |
| Day 5 12:00 | ML Pipeline | Feature engineering |
| Day 5 17:00 | Week 2 Complete | Predictions available |

---

## Success Criteria

### Circuit Breaker
- [ ] 3 circuit breakers active (DB, API, Redis)
- [ ] Opens after threshold failures
- [ ] Recovers after timeout
- [ ] Metrics logged

### Integration Testing
- [ ] 20+ integration tests
- [ ] 90%+ backend coverage
- [ ] E2E tests for critical flows
- [ ] Load test baseline

### SimRating
- [ ] <100ms calculation time
- [ ] Redis caching layer
- [ ] Batch processing working

### RAR
- [ ] Risk-adjusted formula implemented
- [ ] Historical validation >70% accuracy
- [ ] API documented

### Predictive Models
- [ ] Win probability model trained
- [ ] Serving endpoint <200ms
- [ ] A/B test ready

---

## Resource Allocation (Sub-Agents)

Using 5-phase scaffold framework:

**Phase 1: SCOUT** (3 agents, 30 min)
- Scout Alpha: Circuit breaker requirements
- Scout Beta: Integration test gaps
- Scout Gamma: SimRating bottlenecks

**Phase 2: ARCH** (2 agents, 60 min)
- Architect Alpha: Circuit breaker design
- Architect Beta: Integration test architecture

**Phase 3: ENG** (4 agents, 90 min)
- Engineer Alpha: Circuit breaker core
- Engineer Beta: Circuit breaker decorator
- Engineer Gamma: Integration tests
- Engineer Delta: SimRating optimization

**Phase 4: GLUE** (2 agents, 30 min)
- Glue Alpha: Wire circuit breakers to services
- Glue Beta: Wire tests to CI/CD

**Phase 5: QA** (3 agents, 30 min)
- QA Alpha: Circuit breaker tests
- QA Beta: Integration test execution
- QA Gamma: Performance validation

**Total**: 11 agents, ~4 hours parallel vs 16 hours serial

---

## Decision Point

**Ready to execute Week 2?**

Prerequisites:
- [ ] QA decision made (Option C discussion complete)
- [ ] Circuit breaker template approved
- [ ] Day 1 scope confirmed

**Next Actions**:
1. Finalize QA decision
2. Deploy Sub-Agents for Week 2
3. Execute Day 1 (Circuit Breaker)

---

**Status**: READY TO EXECUTE 🚀
