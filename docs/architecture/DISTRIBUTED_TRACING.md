[Ver001.000]

# Distributed Tracing Documentation

OpenTelemetry integration for cross-service observability in NJZiteGeisTe Platform.

## Overview

This document describes the distributed tracing implementation using OpenTelemetry, providing end-to-end visibility across the NJZiteGeisTe Platform services.

**Performance Target:** <100ms trace overhead per request

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Godot Game │────▶│  FastAPI    │────▶│  Database   │
│  (Export)   │     │    API      │     │ (PostgreSQL)│
└─────────────┘     └──────┬──────┘     └─────────────┘
       │                   │
       │ traceparent       │
       │                   │
       ▼                   ▼
┌─────────────────────────────────────────────────────┐
│                  Jaeger / Tempo                      │
│              (Trace Collection)                      │
└─────────────────────────────────────────────────────┘
                          │
                          ▼
              ┌─────────────────────┐
              │      Grafana        │
              │  (Visualization)    │
              └─────────────────────┘
```

## Components

### 1. OpenTelemetry Configuration

**Location:** `services/api/src/njz_api/observability/tracing.py`

The `TracingManager` provides:
- Auto-instrumentation for FastAPI, Redis, asyncpg, HTTPX
- Multiple backend support (Jaeger, OTLP, Console)
- Custom span creation for business logic
- Context propagation for distributed tracing

### 2. Database Tracing

**Location:** `services/api/src/njz_api/observability/database_tracing.py`

TracedPool and TracedConnection wrap asyncpg operations with:
- Query execution time tracking
- Row count metrics
- Connection pool statistics
- Error recording

### 3. Cache Tracing

**Location:** `services/api/src/njz_api/observability/cache_tracing.py`

TracedRedis wraps Redis operations with:
- Hit/miss ratio tracking
- Operation duration metrics
- Cache statistics aggregation

### 4. WebSocket Tracing

**Location:** `services/api/src/njz_api/observability/websocket_tracing.py`

WebSocketTracer provides:
- Message-level tracing
- Context extraction from Godot
- Trace propagation across connections

## Quick Start

### 1. Start Observability Stack

```bash
docker-compose -f docker-compose.observability.yml up -d
```

Access points:
- Jaeger UI: http://localhost:16686
- Grafana: http://localhost:3000 (admin/admin)
- Prometheus: http://localhost:9090

### 2. Configure API

Environment variables:
```bash
# Enable tracing
TRACING_ENABLED=true
OTEL_SERVICE_NAME=njz-api
OTEL_ENVIRONMENT=development

# Backend selection
TRACING_BACKEND=jaeger  # jaeger, otlp_grpc, otlp_http, console

# Jaeger configuration (default)
JAEGER_AGENT_HOST=jaeger
JAEGER_AGENT_PORT=6831

# OTLP configuration (alternative)
OTEL_EXPORTER_ENDPOINT=http://localhost:4317

# Sampling rate (1.0 = 100%)
OTEL_SAMPLE_RATE=1.0
```

### 3. Initialize in Application

```python
from njz_api.observability.tracing import init_tracing

# In main.py or app initialization
init_tracing(app, service_name="njz-api")
```

## Usage Examples

### Basic Span Creation

```python
from njz_api.observability.tracing import get_tracing_manager

tracer = get_tracing_manager()

# Simple span
with tracer.start_span("operation_name"):
    result = do_work()

# Span with attributes
with tracer.start_span("db_query", {
    "db.table": "players",
    "db.operation": "SELECT"
}):
    result = await db.fetch("SELECT * FROM players")
```

### Decorator-Based Tracing

```python
from njz_api.observability.tracing import trace_function, trace_db_query

@trace_function("process_player", component="analytics")
async def process_player(player_id: str):
    # Function body
    pass

@trace_db_query("SELECT", table="players")
async def get_player(player_id: str):
    return await db.fetchrow("SELECT * FROM players WHERE id = $1", player_id)
```

### Database Operations

```python
from njz_api.observability.database_tracing import get_traced_pool

pool = await get_traced_pool()

# All operations are automatically traced
result = await pool.fetch("SELECT * FROM matches", table="matches")
row = await pool.fetchrow("SELECT * FROM players WHERE id = $1", player_id, table="players")
```

### Cache Operations

```python
from njz_api.observability.cache_tracing import get_traced_redis, cached

redis = await get_traced_redis()

# All operations are automatically traced
value = await redis.get("key")
await redis.set("key", value, ex=300)

# Decorator-based caching
@cached(key_prefix="player", ttl=60)
async def get_player_cached(player_id: str):
    return await db.fetchrow("SELECT * FROM players WHERE id = $1", player_id)
```

### WebSocket Tracing

```python
from njz_api.observability.websocket_tracing import (
    get_websocket_tracer,
    traced_websocket_handler
)

ws_tracer = get_websocket_tracer()

@app.websocket("/ws/events")
async def websocket_endpoint(websocket: WebSocket):
    await ws_tracer.trace_connection(websocket, "/ws/events", handle_messages)

@traced_websocket_handler("match_update")
async def handle_match_update(websocket: WebSocket, message: dict):
    # Handler logic
    pass
```

### Trace Context Propagation

```python
from njz_api.observability.websocket_tracing import get_godot_trace_bridge

bridge = get_godot_trace_bridge()

# Extract from incoming headers
@app.post("/api/match-results")
async def submit_match(request: Request):
    context = bridge.extract_from_headers(dict(request.headers))
    # Continue trace from Godot
    
# Inject into outgoing headers
headers = bridge.inject_to_headers({})
response = requests.post(url, headers=headers, json=data)
```

## Trace Attributes Reference

### Standard Attributes

| Attribute | Description | Example |
|-----------|-------------|---------|
| `http.method` | HTTP method | GET, POST |
| `http.url` | Request URL | /api/v1/players |
| `http.status_code` | Response status | 200, 404 |
| `db.system` | Database type | postgresql |
| `db.statement` | SQL query | SELECT * FROM players |
| `db.operation` | DB operation | SELECT, INSERT |
| `cache.key` | Cache key | player:123 |
| `cache.hit` | Cache hit status | true, false |
| `app.component` | Component name | database, cache |
| `app.operation` | Operation name | fetch, get |

### Custom Attributes

```python
with tracer.start_span("custom_operation") as span:
    span.set_attribute("custom.field", value)
    span.set_attribute("app.entity_id", entity_id)
    span.set_attribute("app.entity_type", "player")
```

## Performance Benchmarks

Run benchmarks:

```bash
cd services/api
poetry run pytest tests/performance/test_tracing_overhead.py -v
```

Expected results:
- Simple span: ~0.01-0.1ms
- Span with attributes: ~0.05-0.2ms
- Nested spans (5 levels): ~0.2-0.5ms
- Context propagation: <0.001ms

## Dashboards

### Grafana Dashboards

Dashboard files are in `infra/observability/grafana/dashboards/`:

- **API Traces** (`api-traces.json`): Request duration, error rates, DB operations, cache metrics

### Key Metrics

| Metric | Query | Target |
|--------|-------|--------|
| Request Duration (p99) | `histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket[5m])) by (le))` | <500ms |
| Error Rate | `sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))` | <1% |
| DB Query Duration (p95) | `histogram_quantile(0.95, sum(rate(db_query_duration_seconds_bucket[5m])) by (le))` | <100ms |
| Cache Hit Ratio | `sum(rate(cache_hits_total[5m])) / (sum(rate(cache_hits_total[5m])) + sum(rate(cache_misses_total[5m])))` | >80% |

## Troubleshooting

### Tracing Not Working

1. Check OpenTelemetry is installed:
   ```bash
   poetry show opentelemetry-api
   ```

2. Verify environment variables:
   ```bash
   echo $TRACING_ENABLED
   echo $JAEGER_AGENT_HOST
   ```

3. Check Jaeger is running:
   ```bash
   docker ps | grep jaeger
   ```

4. View logs:
   ```bash
   docker logs njz-jaeger
   ```

### High Overhead

1. Reduce sampling rate:
   ```bash
   OTEL_SAMPLE_RATE=0.1  # 10% sampling
   ```

2. Use BatchSpanProcessor (default)

3. Exclude health checks:
   ```python
   FastAPIInstrumentor.instrument_app(app, excluded_urls="health,ready,metrics")
   ```

### Missing Spans

1. Check span processor is configured
2. Verify exporter endpoint is reachable
3. Check for unhandled exceptions
4. Ensure context propagation is working

## Integration with Godot

### Godot Export Client

```gdscript
# Send match data with trace context
func send_match_data(payload: Dictionary) -> bool:
    var trace_id = _generate_trace_id()
    var span_id = _generate_span_id()
    
    var headers = PackedStringArray([
        "Content-Type: application/json",
        "traceparent: 00-" + trace_id + "-" + span_id + "-01"
    ])
    
    return _execute_request(payload, headers)
```

### Trace Context Format

W3C Trace Context format:
```
traceparent: 00-{trace-id}-{parent-id}-{trace-flags}
```

Example:
```
traceparent: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01
```

## Security Considerations

1. **Sampling in Production**: Use lower sample rates (0.1-0.01) in high-traffic environments
2. **Sensitive Data**: Do not include PII in span attributes
3. **Header Validation**: Validate traceparent format before processing
4. **Network Security**: Use TLS for OTLP exporters in production

## References

- [OpenTelemetry Python](https://opentelemetry.io/docs/instrumentation/python/)
- [Jaeger Documentation](https://www.jaegertracing.io/docs/)
- [W3C Trace Context](https://www.w3.org/TR/trace-context/)
- [Grafana Tempo](https://grafana.com/docs/tempo/latest/)
