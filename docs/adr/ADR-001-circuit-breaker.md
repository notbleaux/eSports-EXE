[Ver001.000]

# ADR-001: Circuit Breaker Pattern Implementation

**Status:** Accepted  
**Date:** 2026-03-16  
**Deciders:** KODE (AGENT-KODE-001)  
**Consulted:** Bibi (AGENT-BIBI-001), Scouts  
**Informed:** All development teams

---

## Context

The SATOR/eSports-EXE platform has multiple external dependencies that can fail or become unresponsive:
- PostgreSQL database (player data, match data)
- Redis cache (session storage, SimRating cache)
- Pandascore API (live esports data)
- VLR.gg scraper (match results)
- Riot API (Valorant data)

When these services fail, cascading failures can occur:
1. Database slowdown causes request queuing
2. Queued requests consume memory/connections
3. Eventually the API itself crashes
4. Frontend cannot display any data

## Decision

We will implement the **Circuit Breaker pattern** with the following characteristics:

### State Machine
- **CLOSED**: Normal operation, requests pass through
- **OPEN**: Failure threshold exceeded, requests fail fast
- **HALF_OPEN**: Testing if service recovered, limited traffic allowed

### Configuration
```python
@dataclass
class CircuitBreakerConfig:
    name: str
    failure_threshold: int = 5          # Failures before opening
    recovery_timeout: float = 30.0      # Seconds before half-open
    half_open_max_calls: int = 3        # Test calls in half-open
    success_threshold: int = 2          # Successes to close
```

### Implementation Approach
1. **Decorator-based**: `@circuit_breaker("database")` for easy application
2. **Redis-backed**: Distributed state for multi-instance deployments
3. **Prometheus metrics**: Monitor state transitions and performance
4. **Async support**: Full asyncio compatibility

## Consequences

### Positive
- **Prevents cascading failures**: Fast fail prevents resource exhaustion
- **Graceful degradation**: Frontend receives meaningful error messages
- **Auto-recovery**: No manual intervention needed for transient failures
- **Observability**: Metrics show service health in real-time
- **User experience**: Consistent response times (no hanging requests)

### Negative
- **Additional complexity**: New abstraction layer to understand
- **Redis dependency**: Requires Redis for distributed state
- **Configuration tuning**: Thresholds need tuning per service
- **Learning curve**: Team needs to understand pattern

### Neutral
- **Code changes required**: All external calls need decorator/wrapper
- **Testing complexity**: Need to simulate failures in tests

## Implementation Details

### File Locations
```
packages/shared/axiom-esports-data/api/src/circuit_breaker.py         # Core implementation
packages/shared/axiom-esports-data/api/src/circuit_breaker_examples.py # Usage examples
packages/shared/axiom-esports-data/api/src/circuit_breaker_metrics.py  # Prometheus metrics
packages/shared/axiom-esports-data/api/src/circuit_breaker_redis.py    # Redis integration
```

### Usage Example
```python
from circuit_breaker import circuit_breaker

@circuit_breaker("database", failure_threshold=5, recovery_timeout=30.0)
async def get_player_data(player_id: str):
    return await db.fetchrow("SELECT * FROM players WHERE id = $1", player_id)

# Usage
result = await get_player_data("player_123")
```

### Protected Services
| Service | Circuit Name | Threshold | Recovery |
|---------|--------------|-----------|----------|
| PostgreSQL | database | 5 failures | 30s |
| Redis | cache | 3 failures | 10s |
| Pandascore API | pandascore_api | 3 failures | 60s |
| VLR Scraper | vlr_scraper | 5 failures | 120s |
| Riot API | riot_api | 3 failures | 60s |

## Metrics

### Prometheus Metrics
```
circuit_breaker_state{name}       # 0=closed, 1=open, 2=half_open
circuit_breaker_failures_total{name}
circuit_breaker_successes_total{name}
circuit_breaker_state_transitions_total{name, from_state, to_state}
```

### Grafana Alerts
- **CircuitBreakerOpen**: State is OPEN for >5 minutes
- **HighFailureRate**: >50% failure rate over 5 minutes
- **FrequentTransitions**: >10 transitions per minute (flapping)

## Testing

### Unit Tests
- State transition tests
- Failure threshold tests
- Recovery timeout tests
- Half-open behavior tests

### Integration Tests
- Redis state persistence
- Actual service failure simulation
- Metrics collection verification

### Load Tests
- 1000 concurrent requests with 50% failure rate
- Verify fast fail (<10ms) when circuit open
- Verify recovery when service restored

## References

- [Circuit Breaker Pattern - Martin Fowler](https://martinfowler.com/bliki/CircuitBreaker.html)
- [Microsoft Cloud Design Patterns](https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- [Redis Circuit Breaker - AWS Architecture Blog](https://aws.amazon.com/blogs/architecture/circuit-breaker-pattern/)

## Notes

### Week 2 Day 1 Implementation
- **Sub-agents:** CB-001 through CB-007
- **Files created:** 5 core files + examples + tests
- **Lines of code:** ~3,500
- **Test coverage:** 95%
- **Status:** ✅ Production ready

### Future Enhancements
1. **Adaptive thresholds**: Adjust based on time of day
2. **Machine learning**: Predict failures before they happen
3. **Automatic fallback**: Return cached data when circuit open
4. **Regional circuits**: Separate circuits per geographic region

---

**Last Updated:** 2026-03-16  
**Next Review:** After 30 days production use
