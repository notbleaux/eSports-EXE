# Circuit Breaker Documentation

[Ver001.000]

## Overview

The Circuit Breaker middleware provides resilience against cascading failures in distributed systems. It monitors for failures and prevents repeated calls to failing services, allowing them time to recover.

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   CLOSED        │────▶│    OPEN         │────▶│  HALF_OPEN      │
│  (Normal)       │     │  (Failing Fast) │     │  (Testing)      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        ▲                                               │
        └───────────────────────────────────────────────┘
                      (Success Threshold Met)
```

### States

| State | Description | Behavior |
|-------|-------------|----------|
| **CLOSED** | Normal operation | Requests pass through to the protected function |
| **OPEN** | Circuit is open | Requests fail fast with `CircuitBreakerOpen` exception |
| **HALF_OPEN** | Testing recovery | Limited requests allowed to test if service recovered |

## Usage

### Basic Decorator Usage

```python
from src.njz_api.middleware.circuit_breaker import circuit_breaker

@circuit_breaker("external_api", failure_threshold=3, recovery_timeout=30.0)
async def call_external_api():
    """Call external API with circuit breaker protection."""
    async with httpx.AsyncClient() as client:
        response = await client.get("https://api.example.com/data")
        return response.json()
```

### Advanced Configuration

```python
from src.njz_api.middleware.circuit_breaker import (
    CircuitBreakerConfig,
    circuit_breaker_with_config,
)

config = CircuitBreakerConfig(
    failure_threshold=5,
    recovery_timeout=60.0,
    half_open_max_calls=3,
    success_threshold=2,
    expected_exception=(ConnectionError, TimeoutError),
    timeout=10.0,
)

@circuit_breaker_with_config("my_api", config)
async def call_my_api():
    """Call with advanced configuration."""
    ...
```

### Direct Usage

```python
from src.njz_api.middleware.circuit_breaker import (
    CircuitBreaker,
    CircuitBreakerConfig,
)

cb = CircuitBreaker("my_service", CircuitBreakerConfig(
    failure_threshold=3,
    recovery_timeout=30.0,
))

async def protected_function():
    return await cb.call(async_function_to_protect)
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| `failure_threshold` | 5 | Failures before opening circuit |
| `recovery_timeout` | 30.0 | Seconds before attempting recovery |
| `half_open_max_calls` | 3 | Max calls in half-open state |
| `success_threshold` | 2 | Consecutive successes to close circuit |
| `expected_exception` | `Exception` | Exception types that count as failures |
| `timeout` | `None` | Optional timeout for protected calls |

## API Endpoints

### List Tournaments

```http
GET /api/v1/tournaments/?game=valorant&page=1&per_page=20
```

Protected by `tournament_list` circuit breaker.

### Submit Match Result

```http
POST /api/v1/tournaments/{tournament_id}/matches/results
Content-Type: application/json
Authorization: Bearer {token}

{
    "match_id": "match-123",
    "tournament_id": "tournament-456",
    "team1_id": "team-a",
    "team2_id": "team-b",
    "team1_score": 13,
    "team2_score": 10,
    "winner_id": "team-a"
}
```

Protected by `match_result_submission` circuit breaker.

### Circuit Breaker Status

```http
GET /api/v1/tournaments/system/circuit-breakers
```

Returns status of all circuit breakers.

```json
{
    "circuit_breakers": {
        "tournament_list": {
            "name": "tournament_list",
            "state": "closed",
            "failure_count": 0,
            "config": {
                "failure_threshold": 3,
                "recovery_timeout": 30.0
            },
            "metrics": {
                "total_calls": 100,
                "successful_calls": 98,
                "failed_calls": 2,
                "success_rate": 98.0
            }
        }
    },
    "summary": {
        "total": 1,
        "closed": 1,
        "open": 0,
        "half_open": 0
    }
}
```

### Reset Circuit Breaker

```http
POST /api/v1/tournaments/system/circuit-breakers/{name}/reset
Authorization: Bearer {admin_token}
```

Manually resets a circuit breaker to closed state. Requires admin permission.

### System-Wide Status

```http
GET /system/circuit-breakers
```

Returns status of all circuit breakers across the entire API.

## Monitoring

### Metrics

Each circuit breaker tracks:
- Total calls
- Successful calls
- Failed calls
- Rejected calls (circuit open)
- Success rate percentage
- State transition history

### Health Checks

The circuit breaker status endpoint can be used for health monitoring:

```python
async def check_circuit_breaker_health():
    status = await get_circuit_breaker_status()
    open_circuits = status["summary"]["open"]
    
    if open_circuits > 0:
        # Alert on-call engineer
        pass
```

## Testing

### Unit Tests

```bash
cd services/api
poetry run pytest tests/unit/test_circuit_breaker.py -v
```

### Integration Tests

```bash
cd services/api
poetry run pytest tests/test_tournaments_circuit_breaker.py -v
```

### Manual Testing

```bash
# Check circuit breaker status
curl http://localhost:8000/api/v1/tournaments/system/circuit-breakers

# Reset a circuit breaker (admin only)
curl -X POST http://localhost:8000/api/v1/tournaments/system/circuit-breakers/tournament_list/reset \
     -H "Authorization: Bearer {admin_token}"
```

## Best Practices

1. **Separate Circuit Breakers per Service**: Use different names for different external services
2. **Tune Thresholds**: Set `failure_threshold` based on expected error rates
3. **Set Appropriate Timeouts**: Configure `recovery_timeout` based on service recovery time
4. **Monitor Metrics**: Track success rates and state transitions
5. **Log State Changes**: Important for debugging production issues

## Error Handling

When a circuit breaker is open, the decorator raises `CircuitBreakerOpen`:

```python
from src.njz_api.middleware.circuit_breaker import CircuitBreakerOpen

try:
    result = await call_external_api()
except CircuitBreakerOpen as e:
    # Circuit is open - service is experiencing issues
    logger.warning(f"Circuit {e.circuit_name} is open")
    # Return cached data or default response
    return get_cached_data()
except Exception as e:
    # Other errors from the protected function
    logger.error(f"API error: {e}")
    raise
```

## Comparison with Reference Implementation

This implementation aligns with the SimCore/Resilience/CircuitBreaker.cs reference:

| Feature | Python Implementation | C# Reference |
|---------|----------------------|--------------|
| States | CLOSED, OPEN, HALF_OPEN | Same |
| Failure Tracking | Async-safe with locks | Thread-safe |
| Recovery Timeout | Configurable | Configurable |
| Half-Open Testing | Max calls limit | Same |
| Metrics | Built-in | Built-in |
| Decorator Support | Yes | Yes |

## Files Created

| File | Description |
|------|-------------|
| `src/njz_api/middleware/circuit_breaker.py` | Core circuit breaker implementation |
| `src/njz_api/middleware/__init__.py` | Package exports |
| `src/njz_api/routers/tournaments.py` | Tournament router with CB integration |
| `tests/unit/test_circuit_breaker.py` | Comprehensive unit tests |
| `tests/test_tournaments_circuit_breaker.py` | Integration tests |
| `docs/CIRCUIT_BREAKER.md` | This documentation |

## References

- [Microsoft Circuit Breaker Pattern](https://docs.microsoft.com/en-us/azure/architecture/patterns/circuit-breaker)
- Martin Fowler's Circuit Breaker article
- SimCore/Resilience/CircuitBreaker.cs (game reference)
