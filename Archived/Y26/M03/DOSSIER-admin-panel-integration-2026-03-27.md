[Ver001.000]

# DOSSIER — Admin Panel Integration

**Consolidated from:** ADMIN_PANEL_INTEGRATION.md, INTEGRATION_CHECKLIST.md, INTEGRATION_TEST_CASES.md
**Archived:** 2026-03-27
**Topic:** Admin panel integration plan, checklist, and test cases

---

## ADMIN_PANEL_INTEGRATION.md

[Ver001.000]

# Admin Panel Integration Guide — Phase 2.4

**Purpose:** Documentation for integrating TeneT Verification review queue with admin panel

**Audience:** Frontend developers integrating review queue UI

**Authority:** Phase 2.4 Documentation Requirements

---

## Overview

The TeneT Verification Service provides a review queue for manually reviewing flagged match data. This guide covers integration of the review queue into the admin panel.

### Key Concepts

- **Verification Result:** High-confidence (ACCEPTED) or low-confidence (REJECTED) match data
- **Flagged Item:** Medium-confidence data or conflicting sources routed for manual review
- **Review Queue:** Collection of flagged items awaiting human decision
- **Manual Override:** Admin decision to ACCEPT or REJECT a flagged item

---

## API Integration Points

### 1. Fetch Review Queue

**Endpoint:** `GET /v1/review-queue`

**Parameters:**
- `limit` (query, integer, default=20): Number of items per page (1-100)
- `offset` (query, integer, default=0): Pagination offset

**Response:**
```json
{
  "items": [
    {
      "id": "review_uuid_1",
      "entity_id": "match_12345",
      "entity_type": "match",
      "reason": "CONFLICT_DETECTED",
      "status": "PENDING",
      "created_at": "2026-03-27T14:30:00Z",
      "reviewed_by": null,
      "reviewed_at": null,
      "metadata": {
        "confidence_score": 0.75,
        "conflict_count": 1,
        "conflicting_sources": ["vlr", "liquidpedia"],
        "team_a_score_vlr": 13,
        "team_a_score_liquidpedia": 23
      }
    }
  ],
  "total": 42,
  "limit": 20,
  "offset": 0
}
```

**Implementation in Frontend:**

```typescript
import { useQuery } from '@tanstack/react-query'

interface ReviewQueueItem {
  id: string
  entity_id: string
  entity_type: string
  reason: 'CONFLICT_DETECTED' | 'MANUAL_FLAG' | 'CONFIDENCE_MEDIUM'
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CLOSED'
  created_at: string
  reviewed_by?: string
  reviewed_at?: string
  metadata: Record<string, any>
}

function ReviewQueuePanel() {
  const [page, setPage] = useState(1)
  const limit = 20
  const offset = (page - 1) * limit

  const { data, isLoading, error } = useQuery({
    queryKey: ['reviewQueue', page],
    queryFn: async () => {
      const res = await fetch(
        `/v1/review-queue?limit=${limit}&offset=${offset}`
      )
      if (!res.ok) throw new Error('Failed to fetch review queue')
      return res.json() as Promise<{
        items: ReviewQueueItem[]
        total: number
      }>
    },
  })

  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      <h2>Review Queue ({data?.total || 0} items)</h2>
      <ul>
        {data?.items.map(item => (
          <ReviewQueueItemComponent key={item.id} item={item} />
        ))}
      </ul>
      <Pagination
        current={page}
        total={Math.ceil((data?.total || 0) / limit)}
        onChange={setPage}
      />
    </div>
  )
}
```

### 2. Submit Review Decision

**Endpoint:** `POST /v1/review-queue/{id}/decide`

**Request Body:**
```json
{
  "decision": "ACCEPT",
  "reason": "Source conflict resolved, score verified correct"
}
```

**Response:**
```json
{
  "id": "review_uuid_1",
  "entity_id": "match_12345",
  "entity_type": "match",
  "reason": "CONFLICT_DETECTED",
  "status": "CLOSED",
  "created_at": "2026-03-27T14:30:00Z",
  "reviewed_by": "admin_user_123",
  "reviewed_at": "2026-03-27T15:45:00Z"
}
```

**Implementation in Frontend:**

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function submitReviewDecision(
  itemId: string,
  decision: 'ACCEPT' | 'REJECT',
  reason: string
) {
  return fetch(`/v1/review-queue/${itemId}/decide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ decision, reason }),
  }).then(res => {
    if (!res.ok) throw new Error('Failed to submit decision')
    return res.json()
  })
}

function ReviewDecisionButtons({
  itemId,
  onDecision,
}: {
  itemId: string
  onDecision: (result: ReviewQueueItem) => void
}) {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: (data: { decision: 'ACCEPT' | 'REJECT'; reason: string }) =>
      submitReviewDecision(itemId, data.decision, data.reason),
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['reviewQueue'] })
      onDecision(result)
    },
  })

  return (
    <div>
      <button
        onClick={() =>
          mutation.mutate({
            decision: 'ACCEPT',
            reason: 'Data verified',
          })
        }
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Submitting...' : 'Accept'}
      </button>
      <button
        onClick={() =>
          mutation.mutate({
            decision: 'REJECT',
            reason: 'Incorrect data',
          })
        }
        disabled={mutation.isPending}
      >
        {mutation.isPending ? 'Submitting...' : 'Reject'}
      </button>
    </div>
  )
}
```

---

## UI Component Design

### Review Queue List Component

```typescript
interface ReviewQueueListProps {
  onSelectItem?: (item: ReviewQueueItem) => void
}

export function ReviewQueueList({ onSelectItem }: ReviewQueueListProps) {
  const [filters, setFilters] = useState({
    reason: 'ALL',
    status: 'PENDING',
  })

  return (
    <div className="review-queue">
      <div className="filters">
        <select value={filters.reason} onChange={e => setFilters({ ...filters, reason: e.target.value })}>
          <option value="ALL">All Reasons</option>
          <option value="CONFLICT_DETECTED">Conflicts</option>
          <option value="CONFIDENCE_MEDIUM">Medium Confidence</option>
          <option value="MANUAL_FLAG">Manual Flags</option>
        </select>

        <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="PENDING">Pending</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      <table className="queue-table">
        <thead>
          <tr>
            <th>Entity ID</th>
            <th>Type</th>
            <th>Reason</th>
            <th>Status</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Render ReviewQueueItem rows */}
        </tbody>
      </table>
    </div>
  )
}
```

### Review Detail Component

```typescript
interface ReviewDetailProps {
  item: ReviewQueueItem
  onDecision: (decision: 'ACCEPT' | 'REJECT', reason: string) => Promise<void>
}

export function ReviewDetail({ item, onDecision }: ReviewDetailProps) {
  const [decisionReason, setDecisionReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleDecide = async (decision: 'ACCEPT' | 'REJECT') => {
    setIsSubmitting(true)
    try {
      await onDecision(decision, decisionReason)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="review-detail">
      <h3>{item.entity_type.toUpperCase()}: {item.entity_id}</h3>

      <div className="metadata">
        <dl>
          <dt>Reason</dt>
          <dd>{item.reason}</dd>

          <dt>Status</dt>
          <dd>
            <span className={`badge badge-${item.status.toLowerCase()}`}>
              {item.status}
            </span>
          </dd>

          <dt>Created</dt>
          <dd>{new Date(item.created_at).toLocaleString()}</dd>

          {item.metadata?.conflict_count && (
            <>
              <dt>Conflicts</dt>
              <dd>
                <ul>
                  {item.metadata.conflicting_sources?.map(source => (
                    <li key={source}>{source}</li>
                  ))}
                </ul>
              </dd>
            </>
          )}
        </dl>
      </div>

      {item.status === 'PENDING' && (
        <div className="decision-form">
          <textarea
            value={decisionReason}
            onChange={e => setDecisionReason(e.target.value)}
            placeholder="Reason for decision (optional)"
            rows={4}
          />

          <button
            onClick={() => handleDecide('ACCEPT')}
            disabled={isSubmitting}
            className="btn-accept"
          >
            ✓ Accept Data
          </button>

          <button
            onClick={() => handleDecide('REJECT')}
            disabled={isSubmitting}
            className="btn-reject"
          >
            ✗ Reject Data
          </button>
        </div>
      )}
    </div>
  )
}
```

---

## Integration with Existing Admin Panel

### Routes

Add to admin panel routing:

```typescript
const adminRoutes = [
  {
    path: '/admin',
    component: AdminDashboard,
    children: [
      {
        path: 'verification',
        component: VerificationAdminPanel,
        children: [
          {
            path: 'review-queue',
            component: ReviewQueuePage,
          },
        ],
      },
    ],
  },
]
```

### Navigation

Add link to admin sidebar:

```typescript
<nav className="admin-sidebar">
  <ul>
    <li>
      <Link to="/admin/verification/review-queue">
        Review Queue ({pendingCount})
      </Link>
    </li>
  </ul>
</nav>
```

### Service Client

```typescript
// services/tenet-client.ts
export class TeneT {
  static async getReviewQueue(limit = 20, offset = 0) {
    return fetch(`/v1/review-queue?limit=${limit}&offset=${offset}`).then(
      res => res.json()
    )
  }

  static async submitReviewDecision(
    itemId: string,
    decision: 'ACCEPT' | 'REJECT',
    reason: string
  ) {
    return fetch(`/v1/review-queue/${itemId}/decide`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ decision, reason }),
    }).then(res => res.json())
  }
}
```

---

## Real-Time Updates via WebSocket

To show live updates as items are flagged:

```typescript
import { useEffect } from 'react'

export function ReviewQueueWithLiveUpdates() {
  const [items, setItems] = useState<ReviewQueueItem[]>([])

  useEffect(() => {
    const ws = new WebSocket('ws://localhost:8002/ws/review-queue')

    ws.onmessage = event => {
      const message = JSON.parse(event.data)

      if (message.type === 'REVIEW_ITEM_CREATED') {
        setItems(prev => [message.payload, ...prev])
      } else if (message.type === 'REVIEW_ITEM_DECIDED') {
        setItems(prev =>
          prev.map(item =>
            item.id === message.payload.id ? message.payload : item
          )
        )
      }
    }

    return () => ws.close()
  }, [])

  return <ReviewQueueList items={items} />
}
```

---

## Monitoring & Analytics

### Key Metrics to Track

1. **Queue Depth:** Number of pending items
   ```typescript
   const queueDepth = data?.total || 0
   ```

2. **Resolution Time:** Average time from creation to decision
   ```typescript
   const avgResolutionTime =
     items.reduce((sum, item) => {
       if (item.reviewed_at) {
         const created = new Date(item.created_at).getTime()
         const reviewed = new Date(item.reviewed_at).getTime()
         return sum + (reviewed - created)
       }
       return sum
     }, 0) / items.filter(i => i.reviewed_at).length
   ```

3. **Decision Distribution:** Acceptance vs rejection ratio
   ```typescript
   const acceptanceRate =
     (items.filter(i => i.status === 'ACCEPTED').length /
       items.filter(i => i.status !== 'PENDING').length) *
     100
   ```

4. **Top Reasons:** Most common flagging reasons
   ```typescript
   const reasonCounts = items.reduce((acc, item) => {
     acc[item.reason] = (acc[item.reason] || 0) + 1
     return acc
   }, {})
   ```

### Dashboard Example

```typescript
export function ReviewQueueDashboard() {
  const { data } = useQuery({
    queryKey: ['reviewQueue'],
    queryFn: () => TeneT.getReviewQueue(100, 0),
  })

  return (
    <div className="dashboard">
      <div className="metrics">
        <Metric label="Pending" value={data?.total || 0} />
        <Metric label="Avg Resolution" value={`${avgResolutionTime}h`} />
        <Metric label="Acceptance Rate" value={`${acceptanceRate}%`} />
      </div>

      <div className="charts">
        <ReasonDistributionChart data={reasonCounts} />
      </div>
    </div>
  )
}
```

---

## Error Handling

```typescript
function ReviewQueuePage() {
  const query = useQuery({
    queryKey: ['reviewQueue'],
    queryFn: async () => {
      const res = await fetch('/v1/review-queue')

      if (res.status === 429) {
        throw new Error('Rate limited. Please try again later.')
      }
      if (res.status === 500) {
        throw new Error('Service error. Try refreshing page.')
      }
      if (!res.ok) {
        throw new Error(`Failed to load review queue (${res.status})`)
      }

      return res.json()
    },
    retry: 2,
    retryDelay: attemptIndex => Math.pow(2, attemptIndex) * 1000,
  })

  if (query.error) {
    return (
      <div className="error">
        <p>{query.error.message}</p>
        <button onClick={() => query.refetch()}>Retry</button>
      </div>
    )
  }

  return <ReviewQueueList items={query.data?.items || []} />
}
```

---

## Testing

### Unit Tests

```typescript
describe('ReviewQueueList', () => {
  it('should fetch and display review queue items', async () => {
    const mockItems = [
      {
        id: '1',
        entity_id: 'match_1',
        reason: 'CONFLICT_DETECTED',
        status: 'PENDING',
        created_at: new Date().toISOString(),
      },
    ]

    render(<ReviewQueueList />)

    await screen.findByText('match_1')
    expect(screen.getByText('CONFLICT_DETECTED')).toBeInTheDocument()
  })

  it('should submit decision and update list', async () => {
    render(<ReviewQueueList />)

    const acceptButton = await screen.findByRole('button', {
      name: /accept/i,
    })

    fireEvent.click(acceptButton)

    await waitFor(() => {
      expect(screen.getByText('Decision submitted')).toBeInTheDocument()
    })
  })
})
```

### E2E Tests

```typescript
describe('Review Queue E2E', () => {
  it('should accept review item and update status', async () => {
    const page = await browser.newPage()
    await page.goto('http://localhost:5173/admin/verification/review-queue')

    // Wait for queue to load
    await page.waitForSelector('.review-queue-item')

    // Click first item
    await page.click('.review-queue-item:first-child')

    // Wait for detail panel
    await page.waitForSelector('.review-detail')

    // Enter decision reason
    await page.type('textarea', 'Data verified')

    // Click accept
    await page.click('button:has-text("Accept")')

    // Verify updated
    await page.waitForSelector('.badge-accepted')
  })
})
```

---

## Performance Optimization

### Pagination

Always paginate large result sets:

```typescript
const handlePageChange = (newPage: number) => {
  setPage(newPage)
  window.scrollTo(0, 0) // Scroll to top
}
```

### Lazy Loading

Load additional details on demand:

```typescript
function ReviewQueueItem({ item }: { item: ReviewQueueItem }) {
  const [expanded, setExpanded] = useState(false)
  const { data: details } = useQuery({
    queryKey: ['reviewDetail', item.id],
    queryFn: () => TeneT.getReviewDetail(item.id),
    enabled: expanded,
  })

  return (
    <div>
      <button onClick={() => setExpanded(!expanded)}>
        {expanded ? '▼' : '▶'} {item.entity_id}
      </button>
      {expanded && details && <ReviewDetail item={details} />}
    </div>
  )
}
```

### Caching

Use React Query's built-in caching:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (was cacheTime)
    },
  },
})
```

---

## Summary

This integration guide provides:
- ✅ API endpoints and response schemas
- ✅ React component examples with TanStack Query
- ✅ Integration with admin panel routing
- ✅ Real-time updates via WebSocket
- ✅ Monitoring metrics and dashboard
- ✅ Error handling and retry logic
- ✅ Testing patterns (unit + E2E)
- ✅ Performance optimization strategies

Follow this guide to integrate TeneT verification review queue into the admin panel.

---

**End of Admin Panel Integration Guide**

---

## INTEGRATION_CHECKLIST.md

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

---

## INTEGRATION_TEST_CASES.md

[Ver001.000]

# Integration Test Cases — Phase 2.4

**Purpose:** End-to-end test scenarios for service interactions and data flow

**Scope:** Test cases for verified execution of Phase 2 services and their interactions

**Update Policy:** Add test case after executing successfully; mark as VERIFIED

---

## Integration Test Suite

### Category: TeneT Verification → Data Flow

#### Test Case IT-01: Verify Match with Single Source
**Objective:** Test verification with one high-trust source
**Setup:**
1. Start TeneT Verification service
2. Create match data: {entity_id: "match_001", game: "valorant", sources: [{sourceType: "vlr", trustLevel: "MEDIUM", weight: 1.0, data: {team_a_score: 13, team_b_score: 11}}]}
**Steps:**
1. POST /v1/verify with match data
2. Verify response contains {status: "ACCEPTED", confidence_score: >= 0.90}
3. Check database: verification record created with status ACCEPTED
**Expected Result:** ✅ Match accepted with high confidence
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-02: Verify Match with Multiple Agreeing Sources
**Objective:** Test confidence increase with source agreement
**Setup:**
1. TeneT Verification running
2. Match data with 2 sources, identical scores
**Steps:**
1. POST /v1/verify with {sources: [{vlr data}, {liquidpedia data}]} both showing 13-11
2. Verify response contains confidence_score > single source confidence
3. Check record stored with both sources logged
**Expected Result:** ✅ Higher confidence with multiple agreeing sources
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-03: Detect Conflict and Flag for Review
**Objective:** Test conflict detection triggers FLAGGED status
**Setup:**
1. TeneT Verification running
2. Match data with conflicting scores: VLR 13-11, Liquidpedia 13-15 (4 point diff, below threshold)
3. Then test VLR 13-11, Liquidpedia 13-21 (10+ point diff, triggers conflict)
**Steps:**
1. POST /v1/verify with conflicting sources
2. Verify status is FLAGGED when difference > 10 points
3. Check review queue: item created for this match
**Expected Result:** ✅ Conflicts detected, flagged for manual review
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-04: Rate Limiting Enforcement
**Objective:** Test 100 req/min rate limit on /v1/verify
**Setup:**
1. TeneT Verification running
2. Verification request ready
**Steps:**
1. Send 100 requests rapidly
2. Verify all return 200
3. Send 101st request
4. Verify returns 429 with Retry-After: 60
5. Wait 60+ seconds
6. Send 102nd request
7. Verify returns 200
**Expected Result:** ✅ Rate limit enforced at 100/min boundary
**Status:** 🟡 Ready for implementation

---

### Category: WebSocket → Real-Time Updates

#### Test Case IT-05: WebSocket Connection and Heartbeat
**Objective:** Test WebSocket connection lifecycle
**Setup:**
1. WebSocket service running
2. Client ready to connect
**Steps:**
1. Connect to ws://localhost:8002/ws/match/match_001
2. Wait 30 seconds
3. Verify HEARTBEAT message received with serverTime and activeConnections
4. Send PONG response
5. Wait 60+ seconds without PONG
6. Verify connection auto-disconnected
**Expected Result:** ✅ Heartbeat sent every 30s, client auto-disconnected after 60s inactivity
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-06: Message Deduplication
**Objective:** Test duplicate messages not sent twice
**Setup:**
1. WebSocket service running
2. Connected client to match
3. Duplicate message (same message_id) prepared
**Steps:**
1. Broadcast message_id=UUID1 with match update
2. Verify client receives message once
3. Broadcast same message_id again
4. Verify client does NOT receive duplicate
5. Wait 1.1 seconds (dedup window expired)
6. Broadcast same message_id again
7. Verify client receives message
**Expected Result:** ✅ Messages deduplicated within 1s window, allowed after window expires
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-07: Backpressure Handling
**Objective:** Test queue backpressure when client is slow
**Setup:**
1. WebSocket service running
2. Connected client that reads slowly
3. 1000+ messages queued for delivery
**Steps:**
1. Broadcast messages rapidly (> 1000/second)
2. Verify queue reaches max (1000 messages)
3. Verify older messages dropped, new messages queued
4. Verify client eventually catches up and receives recent messages
5. Check logs for backpressure warnings
**Expected Result:** ✅ Backpressure handled gracefully, oldest dropped, recent preserved
**Status:** 🟡 Ready for implementation

---

### Category: Legacy Compiler → Data Aggregation

#### Test Case IT-08: Circuit Breaker Protection
**Objective:** Test circuit breaker opens and recovers
**Setup:**
1. Legacy Compiler running
2. VLR.gg endpoint mocked to fail
3. Circuit breaker configured: 5 failures, 60s recovery
**Steps:**
1. Send compilation request (triggers VLR scrape)
2. Mock VLR returns error
3. Repeat step 1-2 five times
4. Verify circuit breaker state = OPEN
5. Next request fails fast without retrying
6. Wait 60 seconds
7. Circuit breaker transitions to HALF_OPEN
8. Mock VLR returns success
9. Verify circuit breaker state = CLOSED
**Expected Result:** ✅ Circuit breaker prevents cascading failures, recovers automatically
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-09: Exponential Backoff Retry
**Objective:** Test retry logic with exponential backoff
**Setup:**
1. Legacy Compiler running
2. VLR endpoint mocked to fail twice, then succeed
3. Backoff configured: 1s base, 2^n formula
**Steps:**
1. Send compilation request (triggers VLR scrape)
2. Mock VLR fails (attempt 1)
3. Verify delay ~1s, then retry (attempt 2)
4. Mock VLR fails (attempt 2)
5. Verify delay ~2s, then retry (attempt 3)
6. Mock VLR succeeds (attempt 3)
7. Verify response includes aggregated data
**Expected Result:** ✅ Retries with exponential backoff (1s, 2s, 4s), succeeds on 3rd attempt
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-10: Conflict Detection and Reporting
**Objective:** Test conflict detection in aggregated data
**Setup:**
1. Legacy Compiler running
2. VLR and Liquidpedia mocked with conflicting data
3. VLR: team_a_score = 13, Liquidpedia: team_a_score = 23 (10+ point diff)
**Steps:**
1. POST /v1/compile with match_id
2. Verify response includes conflicts object
3. Verify has_conflicts = true, conflict_count = 1
4. Verify conflicts[0] shows field, values, sources, difference
5. Verify confidence_impact = 0.1 (one conflict)
**Expected Result:** ✅ Conflicts detected and reported with impact assessment
**Status:** 🟡 Ready for implementation

---

### Category: End-to-End Integration

#### Test Case IT-11: Complete Pipeline - Legacy → TeneT → Review Queue
**Objective:** Test full data flow from compilation through verification to review
**Setup:**
1. All three services running
2. Match data with conflicting sources prepared
3. TeneT and Legacy Compiler connected via HTTP
**Steps:**
1. POST to Legacy Compiler /v1/compile
2. Receives aggregated data with conflict_analysis
3. POST aggregated data to TeneT Verification /v1/verify
4. TeneT detects conflict, returns status = FLAGGED
5. TeneT creates ReviewQueueItem
6. GET /v1/review-queue returns flagged item
7. Admin reviews, POST decision to /v1/review-queue/{id}/decide with ACCEPT
8. Item status updated to CLOSED
9. Original verification status updated to MANUAL_OVERRIDE
**Expected Result:** ✅ Complete flow: compile → verify → flag → review → decide → override
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-12: WebSocket Updates After TeneT Decision
**Objective:** Test WebSocket clients notified of verification decisions
**Setup:**
1. All services running
2. WebSocket client connected to match
3. Flagged verification in review queue
**Steps:**
1. Admin submits review decision ACCEPT
2. WebSocket service broadcasts VERIFICATION_DECIDED message
3. Connected client receives message with updated status
4. Verify message includes decision and reviewer info
**Expected Result:** ✅ Real-time notification of verification decisions to connected clients
**Status:** 🟡 Ready for implementation

---

### Category: Performance and Load

#### Test Case IT-13: Sustained Rate Limiting
**Objective:** Test rate limiter maintains 100 req/min under load
**Setup:**
1. TeneT Verification running
2. Load generator configured: 150 requests/min for 2 minutes
**Steps:**
1. Generate load for 60 seconds
2. Verify rate limit triggered: requests 101-150 return 429
3. Continue for next 60 seconds
4. Verify rate limit reset after 60s, new batch accepted (1-100)
5. Monitor CPU, memory during test
**Expected Result:** ✅ Rate limit consistently enforced, no performance degradation
**Status:** 🟡 Ready for implementation

---

#### Test Case IT-14: Circuit Breaker Under Concurrent Load
**Objective:** Test circuit breaker behavior with concurrent requests
**Setup:**
1. Legacy Compiler running
2. VLR endpoint configured to fail
3. Circuit breaker: 5 failures, 60s recovery
4. Load generator: 20 concurrent requests
**Steps:**
1. Trigger 20 concurrent requests
2. Verify circuit opens after 5 fail
3. Remaining 15 fail fast without retry
4. Verify logs show circuit breaker state transitions
5. Verify no cascading failures or resource exhaustion
**Expected Result:** ✅ Circuit breaker efficiently prevents cascading failures under load
**Status:** 🟡 Ready for implementation

---

### Category: Error Handling

#### Test Case IT-15: Graceful Degradation - Partial Source Failure
**Objective:** Test service continues with partial source failures
**Setup:**
1. Legacy Compiler running
2. VLR and Liquidpedia mocked, Pandascore fails
**Steps:**
1. POST /v1/compile
2. Verify response includes data from VLR and Liquidpedia
3. Verify Pandascore failure logged but not fatal
4. Verify sourceCount = 2, not 3
5. Verify confidence calculated from available sources
**Expected Result:** ✅ Service gracefully degraded with 2/3 sources available
**Status:** 🟡 Ready for implementation

---

## Test Execution Summary

**Total Test Cases:** 15
**Categories:**
- TeneT Verification: 4 tests
- WebSocket: 3 tests
- Legacy Compiler: 3 tests
- End-to-End: 2 tests
- Performance/Load: 2 tests
- Error Handling: 1 test

**Estimated Execution Time:** 30-45 minutes (with manual review time)

**Success Criteria:**
- All 15 test cases show ✅ status
- No critical failures logged
- Performance metrics within acceptable ranges
- Rate limiting and circuit breaker function as designed

---

## Notes

- All test cases assume services running on localhost with default ports
- Mock endpoints required for deterministic test execution
- Load tests benefit from running on isolated VM to avoid network interference
- Rate limiting tests should disable token bucket reset between test runs
- Circuit breaker tests require ability to control external API behavior (mocking)

---

**End of Integration Test Cases**
