# Integration Test Suite

Cross-service E2E integration tests for ESPORTEZ-MANAGER ↔ eSports-EXE.

## Overview

This test suite provides comprehensive integration testing across all services:

| Test File | Coverage |
|-----------|----------|
| `test_godot_tournament_flow.py` | Godot → API → WebSocket flow |
| `test_feature_store_visualization.py` | Feature Store → SATOR Square |
| `test_analytics_pipeline.py` | Analytics calculation pipeline |
| `test_circuit_breaker_integration.py` | Circuit breaker behavior |
| `test_error_recovery.py` | Error recovery & retry |
| `test_cross_service_e2e.py` | Full cross-service E2E |

## Quick Start

### Run with Docker Compose (Recommended)

```bash
cd tests/integration
docker-compose -f docker-compose.test.yml up --build
```

### Run Locally

```bash
# 1. Start test infrastructure
pnpm run docker:test:up

# 2. Run integration tests
pytest tests/integration -v

# 3. Stop infrastructure
pnpm run docker:test:down
```

### Run Specific Tests

```bash
# Run only Godot integration tests
pytest tests/integration -m godot -v

# Run only WebSocket tests
pytest tests/integration -m websocket -v

# Run only circuit breaker tests
pytest tests/integration -m circuit_breaker -v

# Run with coverage
pytest tests/integration --cov=services.api --cov-report=html
```

## Test Infrastructure

### Services

| Service | Port | Description |
|---------|------|-------------|
| test-db | 5433 | PostgreSQL test database |
| test-redis | 6380 | Redis test cache |
| test-api | 8001 | FastAPI test instance |
| test-websocket | 8766 | WebSocket test service |

### Fixtures

Key fixtures available in `conftest.py`:

```python
# API client
api_client  # httpx.AsyncClient

# WebSocket client
websocket_client  # WebSocket connection factory

# Data generators
test_tournament  # Pre-configured tournament
generate_match_result  # Factory for match results
generate_player_stats  # Factory for player stats
sample_simrating_request  # Sample SimRating inputs

# Service clients
feature_store_client  # Feature Store helper
circuit_breaker_client  # Circuit breaker helper
godot_export_client  # Godot client simulator
```

## Test Scenarios

### 1. Godot → API → WebSocket Flow

```python
@pytest.mark.asyncio
async def test_godot_match_export_to_websocket(api_client, websocket_client, test_tournament):
    # 1. Connect WebSocket
    ws = await websocket_client("/ws/matches/{tournament_id}/live")
    
    # 2. Export match from Godot
    response = await api_client.post("/tournaments/{id}/matches/results", json=match_data)
    
    # 3. Verify WebSocket notification
    msg = await ws.receive_json()
    assert msg["type"] == "match_completed"
```

### 2. Feature Store Integration

```python
@pytest.mark.asyncio
async def test_feature_store_to_sator_square(api_client, feature_store_client):
    # Store spatial features
    await feature_store_client.store_features(match_id, features)
    
    # SATOR Square fetches
    response = await feature_store_client.get_spatial_features(match_id)
    
    assert "impact_events" in response.json()
```

### 3. Analytics Pipeline

```python
@pytest.mark.asyncio
async def test_simrating_calculation_pipeline(api_client):
    # Calculate SimRating
    response = await api_client.post("/analytics/simrating/calculate", json=stats)
    
    assert response.json()["sim_rating"] > 0
```

## Coverage Requirements

- **Target**: >85% coverage
- **Current**: Measured by pytest-cov
- **Report**: `integration-htmlcov/index.html`

## CI/CD Integration

The integration tests run on:
- Push to `main` or `develop`
- PRs to `main`
- Manual dispatch via GitHub Actions

See `.github/workflows/integration-tests.yml`

## Troubleshooting

### Services Not Starting

```bash
# Check service logs
docker-compose -f tests/integration/docker-compose.test.yml logs test-api
docker-compose -f tests/integration/docker-compose.test.yml logs test-db
```

### Connection Refused

Ensure services are running on correct ports:
- API: http://localhost:8001
- WebSocket: ws://localhost:8766
- PostgreSQL: localhost:5433
- Redis: localhost:6380

### Test Timeouts

Increase timeout for slow environments:
```bash
pytest tests/integration --timeout=120
```

## Contributing

1. Add new test files to `tests/integration/`
2. Use appropriate markers: `@pytest.mark.integration`, `@pytest.mark.e2e`
3. Add fixtures to `conftest.py` if reusable
4. Update this README with new test scenarios
