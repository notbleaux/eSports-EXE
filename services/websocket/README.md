[Ver001.002]

# WebSocket Service — Path A Live Data Distribution

**Purpose:** Real-time WebSocket service broadcasting live match events from Pandascore webhook.
**Language:** Python (FastAPI + Redis Streams + asyncio)
**Port:** 8002
**Status:** Phase 2.1 Implementation Complete

## Overview

The WebSocket Service implements Path A (live data) distribution for the NJZ eSports platform. It consumes match events from Redis Streams (Pandascore webhook) and broadcasts them in real-time to connected web, companion app, and overlay clients. Designed for sub-100ms latency with automatic reconnection and heartbeat monitoring.

### Key Responsibilities

- **Event consumption:** Ingest Pandascore match events from Redis Streams
- **Type conversion:** Normalize Pandascore events to `WsMessage` envelope format
- **Broadcasting:** Distribute events to subscribed clients (global or match-specific)
- **Connection management:** Track active connections, handle reconnection logic
- **Heartbeat monitoring:** Detect stale connections via 30-second ping/pong
- **Backpressure handling:** Buffer overflow protection with configurable stream batch size
- **Metrics exposure:** Track active connections, message throughput, latency

## Architecture

**Four Core Components:**

- **Redis Streams Consumer:** Listens to `pandascore:events` stream with group consumer pattern
  - Batch processing: 10 messages per poll cycle
  - Consumer group: Enables distributed consumer deployment
  - ACK tracking: Ensures no message loss on crash
- **WebSocket Manager:** Tracks connections per match + global feed
  - In-memory connection registry with weak references
  - Auto-cleanup on disconnect
  - Supports both `/ws/matches/live` (global) and `/ws/matches/{match_id}/live` (per-match)
- **Event Parser:** Converts Pandascore webhook to `WsMessage` format
  - Validates event schema
  - Normalizes timestamps to Unix milliseconds
  - Preserves payload integrity
- **Broadcaster:** Distributes events to all subscribed clients with error isolation
  - Nonblocking send (doesn't wait for all clients)
  - Per-client error handling (disconnect one client ≠ stop broadcasting)
  - Heartbeat:** 30-second keep-alive to detect stale connections

## Event Types

Maps Pandascore webhook events to `WsMessageType`:

| Pandascore Event | WsMessageType | Payload |
|---|---|---|
| `MATCH_START` | `MATCH_START` | Team names, scores (0-0), current round |
| `SCORE_UPDATE` | `SCORE_UPDATE` | Team scores, round number, half |
| `ROUND_END` / `ROUND_UPDATE` | `ROUND_END` | Round number, winner, condition, duration |
| `MATCH_END` | `MATCH_END` | Winner, final score, total rounds |

All timestamps normalized to Unix milliseconds.

## API Endpoints

### WebSocket Connections

- `GET /ws/matches/live` — Global live feed (all matches)
- `GET /ws/matches/{match_id}/live` — Match-specific updates

### HTTP Endpoints

- `GET /health` — Health check (status, Redis connection)
- `GET /metrics` — Active connections, match subscriptions count
- `GET /ready` — Readiness probe (for Kubernetes/orchestration)

## Data Flow

```
Pandascore Webhook
    ↓
packages/shared/api/webhooks.py (receives webhook)
    ↓
Redis Stream: pandascore:events (push event)
    ↓
WebSocket Service (RedisStreamConsumer)
    ↓
WsMessage (type-safe conversion)
    ↓
MatchConnectionManager (broadcast to clients)
    ↓
WebSocket Clients (web app, companion, extension)
```

## Local Development Setup

### Prerequisites

- Python 3.11+
- Poetry package manager
- Redis 7+ (local or Docker)
- Pandascore API key (optional, for webhook testing)

### Installation & Setup

```bash
cd services/websocket

# Install dependencies via Poetry
poetry install

# Activate virtual environment
poetry shell

# Set environment variables (copy from .env.services.example)
cp ../../.env.services.example .env.local
# Ensure REDIS_URL points to your Redis instance

# Run dev server with auto-reload
poetry run uvicorn main:app --reload --port 8002 --host 0.0.0.0

# In another terminal, monitor connections
while true; do curl http://localhost:8002/metrics; sleep 5; done

# Run tests
poetry run pytest tests/ -v

# Type checking
poetry run mypy main.py --ignore-missing-imports
```

### Docker Development

```bash
# Build service image
docker build -f Dockerfile -t njz-websocket:latest .

# Run with Redis from compose
docker-compose -f ../../infra/docker/docker-compose.services.yml up websocket

# Test WebSocket connection (requires wscat)
npm install -g wscat
wscat -c ws://localhost:8002/ws/matches/live

# View logs
docker-compose -f ../../infra/docker/docker-compose.services.yml logs -f websocket

# Stop service
docker-compose -f ../../infra/docker/docker-compose.services.yml down
```

## Environment Variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `REDIS_URL` | `redis://localhost:6379` | Redis connection string (Streams backend) |
| `STREAM_NAME` | `pandascore:events` | Redis Stream name to consume |
| `CONSUMER_GROUP` | `ws-service-group` | Consumer group for distributed deployment |
| `HOSTNAME` | `ws_consumer_1` | Consumer instance ID (must be unique per deployment) |
| `BATCH_SIZE` | `10` | Messages per poll cycle (backpressure tuning) |
| `POLL_TIMEOUT` | `1000` | Redis XREAD timeout in milliseconds |
| `HEARTBEAT_INTERVAL` | `30` | WebSocket ping interval in seconds |
| `LOG_LEVEL` | `INFO` | Logging verbosity (DEBUG, INFO, WARNING, ERROR) |
| `CORS_ORIGINS` | `["http://localhost:3000"]` | Allowed CORS origins (comma-separated) |

### Required Connections

- **Redis:** Must have Stream support (Redis 5+); consumer group creation is automatic
- **Pandascore Webhook:** Must publish to `STREAM_NAME` (configured by main API service)

## Connection Limits & Scaling

- Max concurrent connections: 1000+ (depends on server resources)
- Heartbeat interval: 30 seconds (configurable via HEARTBEAT_INTERVAL)
- Max reconnect attempts: 5 (client-side)
- Reconnect delay: 5 seconds (client-side exponential backoff)
- Batch size: 10 events per poll (tunable via BATCH_SIZE for backpressure)

## Testing

### Unit Tests

```bash
# Run all tests
poetry run pytest tests/ -v

# Run specific test file
poetry run pytest tests/test_event_parser.py -v

# Run with coverage report
poetry run pytest tests/ --cov=main --cov-report=html

# Run tests matching pattern
poetry run pytest tests/ -k "websocket" -v
```

### Integration Tests

```bash
# Start Redis in Docker first
docker-compose -f ../../infra/docker/docker-compose.services.yml up -d redis-services

# Run integration suite
poetry run pytest tests/integration/ -v

# Test message flow (Redis → WebSocket)
poetry run pytest tests/integration/test_redis_to_ws.py -v
```

### Manual Testing

```bash
# Start service
poetry run uvicorn main:app --reload --port 8002

# In another terminal, connect WebSocket client
wscat -c ws://localhost:8002/ws/matches/live

# In third terminal, publish Pandascore event to Redis
redis-cli -h localhost -p 6379
> XADD pandascore:events "*" match_id "vct_123" event "SCORE_UPDATE" data '{"round": 5, "score_a": 2, "score_b": 3}'

# Client should receive message within 100ms
```

### Test Coverage

- Connection management (5 test cases)
  - New connection, reconnection, stale connection timeout
  - Per-match vs global subscription
  - Connection cleanup on disconnect
- Event parsing (4 test cases)
  - Pandascore event → WsMessage conversion
  - Timestamp normalization, payload preservation
  - Invalid event handling
- Broadcasting (3 test cases)
  - Message delivery to all subscribers
  - Nonblocking sends, per-client error isolation
  - Heartbeat/ping-pong mechanics
- Redis consumption (3 test cases)
  - Consumer group creation, message ACK
  - Batch processing with backpressure
  - Stream lag monitoring
- Error handling (2 test cases)
  - Client disconnect during send
  - Redis connection loss + recovery

**Total: 17+ test cases**

## Deployment

### Kubernetes / Orchestration

```yaml
# health check configuration
livenessProbe:
  httpGet:
    path: /health
    port: 8000
  initialDelaySeconds: 10
  periodSeconds: 30

readinessProbe:
  httpGet:
    path: /ready
    port: 8000
  initialDelaySeconds: 5
  periodSeconds: 10
```

### Distributed Deployment

For high availability, run multiple instances:

```bash
# Instance 1
HOSTNAME=ws_consumer_1 poetry run uvicorn main:app --port 8002

# Instance 2
HOSTNAME=ws_consumer_2 poetry run uvicorn main:app --port 8003

# Both read from same Redis Stream with different consumer IDs
# Load balancer (nginx) distributes client connections
```

## Monitoring & Alerts

### Metrics Endpoints

```bash
# Service health (includes Redis connection status)
curl http://localhost:8002/health

# Readiness check (can accept traffic)
curl http://localhost:8002/ready

# Performance metrics (connections, throughput, latency)
curl http://localhost:8002/metrics
```

### Key Metrics to Monitor

- `active_connections` — Current WebSocket client count
- `messages_processed` — Total events consumed from Redis
- `broadcast_latency_ms` — Event → client delivery time (target < 100ms)
- `redis_consumer_lag` — Stream lag vs latest event
- `connection_errors` — Failed sends/reconnects
- `heartbeat_misses` — Clients without recent pong response

### Typical Issues & Fixes

| Issue | Symptom | Fix |
| --- | --- | --- |
| Clients not receiving events | `/metrics` shows 0 broadcast_latency_ms | Check Redis STREAM_NAME, verify Pandascore webhook publishing |
| Memory grows unbounded | Process RSS increases over time | Check for connection leak, verify cleanup on disconnect |
| High latency (> 500ms) | broadcast_latency_ms growing | Check Redis network latency, reduce BATCH_SIZE |
| Consumer lag | redis_consumer_lag increasing | Check event volume vs batch_size, scale to multiple instances |
| Connection timeouts | heartbeat_misses increasing | Adjust HEARTBEAT_INTERVAL for network conditions |

## Integration Notes

1. **Pandascore Webhook:** This service expects a Redis Stream at `pandascore:events` with payloads containing match event data
2. **Client Subscription:** Clients connect via WebSocket and subscribe to match IDs via client-side routing
3. **Message Format:** All messages follow `WsMessage` envelope with type, matchId, timestamp, payload
4. **Error Handling:** Disconnected clients are automatically cleaned up; failed broadcasts don't halt other subscribers
5. **Scalability:** Can run multiple instances with same REDIS_URL; consumer group handles load distribution

## See Also

- `data/schemas/tenet-protocol.ts` — Internal service message types
- `data/schemas/live-data.ts` — Frontend WebSocket client contracts
- `services/tenet-verification/` — Data verification service (Path B)
- `packages/shared/api/webhooks.py` — Pandascore webhook ingestion
- `infra/docker/docker-compose.services.yml` — Multi-service orchestration
