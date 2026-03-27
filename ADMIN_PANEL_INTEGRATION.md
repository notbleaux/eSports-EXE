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
