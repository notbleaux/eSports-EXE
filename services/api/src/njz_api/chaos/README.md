# Chaos Engineering Framework

[Ver001.000]

Failure injection framework for resilience testing the NJZiteGeisTe Platform.

## Overview

This framework provides controlled chaos engineering capabilities to validate:
- Circuit breaker activation and recovery
- Database failover and connection pooling
- Cache layer resilience
- API timeout handling
- System recovery time objectives (RTO)

## Chaos Modes

| Mode | Description | Impact |
|------|-------------|--------|
| `latency` | Add delays to responses | 100ms - 2s per intensity unit |
| `error` | Return HTTP 5xx errors | Random error codes |
| `exception` | Raise Python exceptions | Random exception types |
| `memory` | Consume system memory | 50MB per intensity unit |
| `cpu` | Spike CPU usage | Async CPU-intensive tasks |
| `db_slow` | Slow database queries | 0-20s query delays |
| `db_disconnect` | Simulate DB failures | Connection drops |
| `cache_miss` | Force cache misses | Bypass Redis cache |
| `redis_fail` | Redis failures | Connection errors |
| `network_partition` | Network failures | Complete request hangs |

## Usage

### Via API (Admin only)

```bash
# Start latency experiment
curl -X POST http://localhost:8000/chaos/experiments/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "latency_test",
    "mode": "latency",
    "probability": 0.3,
    "duration": 300,
    "intensity": 1.0,
    "targets": ["/v1/tournaments"]
  }'

# Run predefined scenario
curl -X POST http://localhost:8000/chaos/scenarios/api_degradation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "duration": 600,
    "intensity": 1.5,
    "targets": ["/v1/*"]
  }'

# Stop experiment
curl -X POST http://localhost:8000/chaos/experiments/latency_test/stop \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# View dashboard
curl http://localhost:8000/chaos/dashboard \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

### Via CLI

```bash
# Start latency experiment
python -m njz_api.chaos.cli latency -t /v1/tournaments -d 300 -p 0.3

# Run scenario
python -m njz_api.chaos.cli scenario api_degradation --duration 600

# Stop all experiments
python -m njz_api.chaos.cli stop-all

# View dashboard
python -m njz_api.chaos.cli dashboard

# Generate report
python -m njz_api.chaos.cli report
```

### Programmatic Usage

```python
from njz_api.chaos import chaos_engine, ChaosConfig, ChaosMode

# Start an experiment
config = ChaosConfig(
    mode=ChaosMode.LATENCY,
    probability=0.3,
    duration=300,
    intensity=1.0,
    targets=["/v1/tournaments"],
)
experiment = await chaos_engine.start_experiment("my_test", config)

# Stop an experiment
await chaos_engine.stop_experiment("my_test")

# Get status
summary = chaos_engine.get_experiments_summary()
```

## Predefined Scenarios

| Scenario | Description | Experiments |
|----------|-------------|-------------|
| `api_degradation` | Gradual API degradation | latency + error injection |
| `database_crisis` | Database performance crisis | slow queries + disconnects |
| `cache_failure` | Cache layer failures | cache misses + Redis failures |
| `resource_exhaustion` | CPU/Memory pressure | CPU spike + memory consumption |
| `network_chaos` | Network instability | partitions + high latency |
| `full_system_failure` | Catastrophic failure | All failure modes combined |

## Testing

Run chaos experiments:

```bash
# Enable chaos tests
export ENABLE_CHAOS_TESTS=1

# Run all chaos tests
pytest tests/chaos/ -v

# Run specific experiment
pytest tests/chaos/experiments/test_api_resilience.py -v

# Run with coverage
pytest tests/chaos/ --cov=services/api/src/njz_api/chaos
```

## Automated Pipeline

Chaos tests run automatically:
- **Schedule**: Weekly on Sunday at 2 AM UTC
- **Manual Trigger**: Via GitHub Actions workflow dispatch
- **Artifacts**: HTML/JSON reports uploaded
- **Notifications**: GitHub issue created on failure

## Safety

- All chaos endpoints require `ADMIN_SYSTEM` permission
- Experiments auto-stop after duration
- Health check endpoints are excluded from chaos
- Chaos endpoints themselves are excluded
- Memory/CPU chaos is limited and reversible

## Recovery Time Objectives

Target RTOs validated by chaos experiments:

| Component | Target RTO | Test |
|-----------|------------|------|
| API Latency | < 30s | `test_api_latency_resilience` |
| Database | < 60s | `test_database_failure_recovery` |
| Cache | < 10s | `test_cache_miss_storm` |
| Circuit Breaker | < 5s | `test_circuit_breaker_activation` |

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   API Request   │────▶│ Chaos Middleware │────▶│  Normal Handler │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                │
                                ▼
                       ┌──────────────────┐
                       │  Chaos Engine    │
                       │  - Experiments   │
                       │  - Metrics       │
                       │  - Injection     │
                       └──────────────────┘
```
