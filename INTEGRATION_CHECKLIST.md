# Integration Checklist — TeneT Verification & WebSocket Services

**Created:** 2026-03-27
**Services:** TeneT Verification (Port 8001), WebSocket (Port 8002)
**Status:** Phase 1 Implementation Complete — Ready for Integration

---

## Pre-Integration Requirements

### Database Setup
- [ ] PostgreSQL database available (at DATABASE_URL)
- [ ] asyncpg driver compatible version installed
- [ ] Sufficient connection pool (min 5, max 10 recommended for free tier)

### Redis Setup
- [ ] Redis server accessible (at REDIS_URL)
- [ ] Redis Streams support (Redis 5.0+)
- [ ] Stream `pandascore:events` configured or will be auto-created

### Environment Configuration
```bash
# TeneT Verification
export DATABASE_URL="postgresql+asyncpg://user:pass@host:5432/njz_esports"
export CONFIDENCE_THRESHOLD_AUTO_ACCEPT=0.90
export CONFIDENCE_THRESHOLD_FLAG=0.70

# WebSocket
export REDIS_URL="redis://localhost:6379"
export STREAM_NAME="pandascore:events"
export HOSTNAME="ws_consumer_1"
```

---

## Integration Points

### 1. TeneT Verification Service Integration

**Location:** `services/tenet-verification/main.py`

#### With Data Ingestion Pipeline

**Flow:**
```
Data Source (Pandascore, VLR, Video Analysis, etc.)
        ↓
packages/shared/api/ingest/  (collect data)
        ↓
POST /v1/verify (TeneT Verification Service)
        ↓
Confidence Score: 0.0–1.0
        ↓
Route to Path A (FLAGGED) or Path B (ACCEPTED)
        ↓
packages/shared/api/persistence/ (store to PostgreSQL or Redis)
```

**API Contract:**
```python
# Input
POST /v1/verify
{
  "entityId": "match_m123",
  "entityType": "match",
  "game": "valorant",
  "sources": [
    {
      "sourceType": "pandascore_api",
      "trustLevel": "HIGH",
      "weight": 1.0,
      "data": {...},
      "capturedAt": "2026-03-27T10:00:00Z"
    }
  ]
}

# Output (200 OK)
{
  "entityId": "match_m123",
  "status": "ACCEPTED",
  "confidence": {
    "value": 0.95,
    "sourceCount": 1,
    "bySource": [...],
    "hasConflicts": false,
    "conflictFields": [],
    "computedAt": "2026-03-27T10:00:05Z"
  },
  "distributionPath": "PATH_B_LEGACY",
  "verifiedAt": "2026-03-27T10:00:05Z",
  "metadata": {...}
}
```

#### With Review Queue Management

**UI Integration Points:**
- Dashboard shows `/v1/review-queue?game=valorant&limit=50`
- Admin clicks "Review" → Form submission to `/v1/review/entity_id`
- System updates verification status and routes accordingly

**Workflow:**
```
1. Auto-verify (confidence 0.70–0.89)
   ↓
2. Flags → /v1/review-queue (dashboard)
   ↓
3. Admin reviews and decides (ACCEPT/REJECT/NEEDS_MORE_DATA)
   ↓
4. POST /v1/review/{entity_id} with decision
   ↓
5. Verification status updated, distribution path recalculated
```

#### With Path B Truth Layer

**Database Integration:**
- ACCEPTED verifications stored in `verification_records` table
- Upstream services (SATOR analytics, simulation training) query this table
- Confidence scores + conflict data available for analysis

**Query Pattern:**
```sql
SELECT * FROM verification_records
WHERE status = 'ACCEPTED'
  AND distribution_path IN ('PATH_B_LEGACY', 'BOTH')
  AND game = 'valorant'
ORDER BY verified_at DESC
```

---

### 2. WebSocket Service Integration

**Location:** `services/websocket/main.py`

#### With Pandascore Webhook Handler

**Current Flow:**
```
Pandascore Webhook Event
        ↓
packages/shared/api/webhooks.py
        ↓
[ACTION REQUIRED]
        ↓
Redis Stream: pandascore:events (MUST PUSH EVENT HERE)
        ↓
WebSocket Service (RedisStreamConsumer)
        ↓
WsMessage (parsed)
        ↓
Connected WebSocket Clients
```

**Code to Add in Webhook Handler:**
```python
# packages/shared/api/webhooks.py (or routers/pandascore.py)

import redis.asyncio as aioredis
import json

redis_client = aioredis.from_url(os.getenv("REDIS_URL", "redis://localhost"))

@router.post("/pandascore/webhook")
async def handle_pandascore_webhook(event: dict):
    # Validate event signature
    # ...

    # Push to Redis Stream
    await redis_client.xadd(
        "pandascore:events",
        {"payload": json.dumps(event)}
    )

    # Return 200 OK to Pandascore
    return {"received": True}
```

#### With Frontend WebSocket Clients

**Client Connection Pattern (JavaScript):**
```javascript
// apps/web/src/shared/hooks/useWebSocket.ts

const ws = new WebSocket(
  `wss://api.example.com/ws/matches/${matchId}/live`
);

ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);
  // msg.type: "MATCH_START", "SCORE_UPDATE", "ROUND_END", "MATCH_END", "HEARTBEAT"
  // msg.matchId: "m_123"
  // msg.timestamp: 1711520400000 (Unix ms)
  // msg.payload: { teamA: {...}, teamB: {...}, ... }

  updateLiveMatch(msg);
};
```

**Event Types Received:**
```typescript
type WsMessageType =
  | 'MATCH_START'         // New match starting
  | 'ROUND_START'         // New round begins
  | 'ROUND_END'           // Round concluded
  | 'SCORE_UPDATE'        // Score changed
  | 'PLAYER_STATS_UPDATE' // Player kills/deaths updated
  | 'ECONOMY_SNAPSHOT'    // Buy phase economy
  | 'MATCH_END'           // Match completed
  | 'HEARTBEAT'           // Keep-alive ping
  | 'ERROR';              // Connection/parse error
```

#### With Companion App & Browser Extension

**Same WebSocket Contract:**
- Companion App (apps/companion) → `ws://websocket-service:8002/ws/matches/{id}/live`
- Browser Extension (apps/browser-extension) → same endpoint
- All receive same message format (`WsMessage` envelope)

**Connection Requirements:**
- WebSocket upgrade support
- Handle HEARTBEAT messages (don't render, just acknowledge)
- Auto-reconnect with exponential backoff (service does this server-side)

---

### 3. TeneT Verification ↔ WebSocket Feedback Loop

**Future Enhancement (Phase 2):**

When a verification is submitted and routed:
- If `distributionPath == "PATH_A_LIVE"` → could optionally push confidence metadata to WebSocket
- Frontend could show "This data was verified with 72% confidence"
- Adds transparency to live data quality

**Implementation:**
```python
# In /v1/verify endpoint, after routing decision:

if distribution_path == "PATH_A_LIVE":
    # Optionally emit verification metadata to WebSocket service
    await emit_verification_metadata({
        "matchId": entity_id,
        "confidence": confidence_val,
        "status": status.value,
        "conflictFields": conflict_fields
    })
```

---

## Startup & Health Checks

### TeneT Verification Service

**Startup:**
```bash
uvicorn main:app --reload --port 8001 \
  --env-file .env \
  --log-level info
```

**Health Checks (in order):**
1. `GET /health` → `{"status": "ok", "service": "tenet-verification"}`
2. `GET /ready` → `{"status": "ready", "database": "connected"}` (checks DB connectivity)
3. Liveness probe: Check `/health` every 10 seconds
4. Readiness probe: Check `/ready` every 5 seconds after startup

### WebSocket Service

**Startup:**
```bash
uvicorn main:app --reload --port 8002 \
  --env-file .env \
  --log-level info
```

**Health Checks (in order):**
1. `GET /health` → `{"status": "ok", "service": "websocket", "redis": "connected"}`
2. `GET /ready` → `{"status": "ready", "redis": "connected", "consumer_running": true}`
3. `GET /metrics` → `{"activeConnections": N, "matchSubscriptions": M, ...}`
4. Liveness probe: Check `/health` every 10 seconds
5. Readiness probe: Check `/ready` every 5 seconds after startup

---

## Deployment Checklist

### Infrastructure
- [ ] PostgreSQL database available and initialized
- [ ] Redis cluster available and operational
- [ ] Network connectivity between services
- [ ] Sufficient CPU/memory for Python FastAPI services (2 vCPU, 1GB RAM each recommended)

### Configuration
- [ ] Environment variables set (DATABASE_URL, REDIS_URL, etc.)
- [ ] TLS/SSL certificates for HTTPS WebSocket (wss://)
- [ ] CORS policies configured if clients are cross-origin
- [ ] Rate limiting configured (optional, Phase 2)

### Monitoring
- [ ] Prometheus metrics exported from both services (Phase 2)
- [ ] Logging aggregation (ELK, DataDog, etc.) configured
- [ ] Alerting rules for:
  - TeneT Verification: High review queue backlog (>100 items)
  - WebSocket: High disconnection rate (>10% per minute)
  - Both: Database connectivity failures

### Testing
- [ ] Unit tests pass locally
- [ ] Integration tests with real PostgreSQL/Redis
- [ ] Load test with target connection count (1000 WebSocket clients)
- [ ] Failover testing (Redis down, DB down)

### Documentation
- [ ] API docs available at `/docs` (Swagger UI auto-generated by FastAPI)
- [ ] Database schema documented
- [ ] Runbook for common operations (manual review approval, incident response)
- [ ] SLOs defined (uptime %, response time, etc.)

---

## Troubleshooting Guide

### TeneT Verification Service Issues

**"Database connection failed"**
- Check DATABASE_URL is correct and accessible
- Verify PostgreSQL is running: `psql -h host -U user -d database -c "SELECT 1"`
- Check pool size isn't exhausted: `SELECT count(*) FROM pg_stat_activity`

**"Tables not created"**
- Check startup logs for alembic migration errors
- Ensure user has CREATE TABLE permissions
- Manually run migration: (Specialist D task)

**"Review queue growing unbounded"**
- Check `/v1/review-queue` is accessible
- Admin dashboard not submitting reviews?
- Add monitoring alert for queue size

### WebSocket Service Issues

**"No events flowing"**
- Check Redis is running: `redis-cli ping`
- Check stream exists: `redis-cli XLEN pandascore:events`
- Check webhook is pushing events: `redis-cli XREAD COUNT 1 STREAMS pandascore:events 0`
- Check consumer group: `redis-cli XINFO GROUPS pandascore:events`

**"WebSocket clients disconnecting**
- Check heartbeat is firing: Look for `HEARTBEAT` in logs every 30s
- Check network stability between client and service
- Verify no firewall blocking WebSocket upgrade

**"Memory growing unbounded"**
- Check number of active connections: `GET /metrics`
- Verify clients are properly disconnecting
- Check match_subscriptions dict doesn't have orphaned entries

---

## API Documentation

Both services expose OpenAPI (Swagger) docs at:
- **TeneT Verification:** `http://localhost:8001/docs`
- **WebSocket:** `http://localhost:8002/docs` (limited, no WebSocket schema)

---

## Next Steps

1. **Specialist A:** Verify schema alignment between services and frontend contracts
2. **Specialist C:** Integrate TeneT Verification into main API router
3. **Specialist D:** Create Alembic migration for verification_records, data_source_contributions, review_queue
4. **DevOps:** Deploy services to staging environment and run integration tests
5. **QA:** Load test with 1000+ concurrent WebSocket clients

---

**Document Version:** 1.0
**Last Updated:** 2026-03-27
**Prepared By:** Specialist B
