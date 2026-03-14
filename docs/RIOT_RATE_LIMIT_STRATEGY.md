[Ver001.000]

# Riot API Rate Limit Management Strategy

**Document:** Rate Limit Management for Riot Games API  
**Last Updated:** 2026-03-15  
**Status:** Implemented

---

## Executive Summary

Riot Games enforces strict rate limits on their API to protect their infrastructure. This document outlines our comprehensive strategy for respecting these limits while maximizing data throughput for the SATOR platform.

---

## Rate Limit Tiers

### Development Keys
```
┌─────────────────────────────────────────────────┐
│ 20 requests per 1 second                        │
│ 100 requests per 2 minutes (120 seconds)        │
│ Deactivate every 24 hours                       │
└─────────────────────────────────────────────────┘
```

### Personal Keys
```
┌─────────────────────────────────────────────────┐
│ 20 requests per 1 second                        │
│ 100 requests per 2 minutes (120 seconds)        │
│ Permanent (until revoked)                       │
└─────────────────────────────────────────────────┘
```

### Production Keys
```
┌─────────────────────────────────────────────────┐
│ 500 requests per 10 seconds                     │
│ 30,000 requests per 10 minutes (600 seconds)    │
│ Requires approval and RSO integration           │
└─────────────────────────────────────────────────┘
```

### Key Distinction
- **Per Region**: Limits apply independently per region (NA, EU, AP, etc.)
- **Shared Limits**: Some service limits are shared across all applications

---

## Implementation Strategy

### 1. Token Bucket Rate Limiter (Python Backend)

```python
class RiotRateLimiter:
    """
    Dual bucket rate limiter enforcing both:
    - Short window (per-second) limits
    - Long window (per-2-minutes) limits
    """
    
    def __init__(self, per_second: int = 20, per_2_minutes: int = 100):
        self.per_second = per_second
        self.per_2_minutes = per_2_minutes
        
        # Token buckets
        self.second_bucket = per_second
        self.minute_bucket = per_2_minutes
        
        # Refill tracking
        self.last_second_refill = datetime.now()
        self.last_minute_refill = datetime.now()
        
        # Thread safety
        self._lock = asyncio.Lock()
    
    async def acquire(self):
        """Non-blocking check if request can proceed"""
        async with self._lock:
            now = datetime.now()
            
            # Refill logic based on elapsed time
            self._refill_buckets(now)
            
            # Check availability
            if self.second_bucket > 0 and self.minute_bucket > 0:
                self.second_bucket -= 1
                self.minute_bucket -= 1
                return True
            
            # Calculate wait time
            return self._calculate_wait_time(now)
    
    async def wait(self):
        """Block until request can proceed"""
        while True:
            result = await self.acquire()
            if result is True:
                return
            await asyncio.sleep(result)
```

**Key Features:**
- Non-blocking `acquire()` for quick checks
- Blocking `wait()` for guaranteed execution
- Thread-safe with asyncio.Lock
- Automatic bucket refill based on elapsed time

### 2. Request Queue (TypeScript Frontend)

```typescript
class RateLimiter {
  private requests: number[] = [];
  
  async throttle(): Promise<void> {
    const now = Date.now();
    
    // Clean expired entries
    this.requests = this.requests.filter(t => now - t < 120000);
    
    // Check short window (1 second)
    const inLastSecond = this.requests.filter(t => now - t < 1000).length;
    if (inLastSecond >= RATE_LIMIT.requestsPerSecond) {
      await this._waitForNextSecond();
    }
    
    // Check long window (2 minutes)
    if (this.requests.length >= RATE_LIMIT.requestsPer2Minutes) {
      await this._waitForOldestExpiry();
    }
    
    this.requests.push(now);
  }
}
```

**Key Features:**
- Sliding window tracking
- Automatic cleanup of expired timestamps
- Sequenced delays to respect both windows

### 3. Response Header Tracking

Both clients track rate limit headers from responses:

```python
# Python
headers = dict(response.headers)
rate_limit = RateLimitInfo(
    limit=int(headers.get("X-Rate-Limit-Limit", "0").split(":")[0]),
    count=int(headers.get("X-Rate-Limit-Count", "0").split(":")[0]),
    retry_after=int(headers.get("Retry-After", "0")) if "Retry-After" in headers else None
)
```

```typescript
// TypeScript
const limit = response.headers.get('X-Rate-Limit-Limit');
const count = response.headers.get('X-Rate-Limit-Count');
const retryAfter = response.headers.get('Retry-After');
```

**Headers Explained:**
- `X-Rate-Limit-Limit`: "20:1,100:120" (limit:window_seconds)
- `X-Rate-Limit-Count`: "5:1,50:120" (used:window_seconds)
- `Retry-After`: Seconds to wait (only on 429)

### 4. Exponential Backoff on 429

When rate limit is exceeded:

```python
async def _make_request(self, ...):
    for attempt in range(self.config.max_retries):
        try:
            return await self._execute_request(...)
        except RateLimitExceeded:
            if attempt < max_retries:
                wait_time = (2 ** attempt) + random.uniform(0, 1)
                await asyncio.sleep(wait_time)
            else:
                raise
```

**Backoff Pattern:**
- Attempt 1: Wait 1-2 seconds
- Attempt 2: Wait 2-3 seconds
- Attempt 3: Wait 4-5 seconds
- Max delay: ~5 seconds with jitter

---

## Caching Strategy

### TTL Configuration

| Endpoint Type | Cache TTL | Rationale |
|--------------|-----------|-----------|
| Game Content | 24 hours | Static data, changes with patches |
| Match Details | 1 hour | Immutable after completion |
| Matchlist | 5 minutes | Updates frequently |
| Leaderboard | 1 hour | Updates periodically |
| Platform Status | 5 minutes | Real-time information |
| Account Info | 1 hour | Rarely changes |

### Cache Implementation

**Python (Redis):**
```python
@cached(ttl=3600, key_prefix="riot_match")
async def get_match(self, match_id: str) -> Optional[RiotMatch]:
    # Result cached for 1 hour
    ...
```

**TypeScript (In-Memory):**
```typescript
const cached = cache.get<RiotMatch>(cacheKey, CACHE_TTL.match);
if (cached) return cached;
```

### Cache Benefits

```
Without Cache:           With Cache:
┌──────────┐            ┌──────────┐
│ Request  │───────────▶│  Cache   │──┐
└──────────┘            └──────────┘  │
     │                      │ Hit     │
     ▼                      ▼         │
┌──────────┐            ┌──────────┐  │
│ Riot API │            │ Response │◀─┘
└──────────┘            └──────────┘
     │                      │ Miss
     ▼                      ▼
┌──────────┐            ┌──────────┐
│ Response │            │ Riot API │
└──────────┘            └──────────┘

Rate Limit Impact:       Rate Limit Impact:
- 1 request per lookup   - 0 requests (cache hit)
- ~20 lookups = limit    - Unlimited (with cache)
```

---

## Request Prioritization

### Priority Levels

```python
class RequestPriority(Enum):
    CRITICAL = 1    # User-facing real-time requests
    HIGH = 2        # Dashboard updates
    NORMAL = 3      # Background sync
    LOW = 4         # Backfill, historical data
```

### Queue Management

```python
class PrioritizedRequestQueue:
    def __init__(self):
        self.queues = {
            priority: asyncio.PriorityQueue()
            for priority in RequestPriority
        }
    
    async def enqueue(self, priority: RequestPriority, request):
        await self.queues[priority].put(request)
    
    async def dequeue(self):
        for priority in sorted(RequestPriority):
            if not self.queues[priority].empty():
                return await self.queues[priority].get()
        return None
```

---

## Circuit Breaker Pattern

### Implementation

```python
@circuit_breaker(
    name="riot_api",
    failure_threshold=5,
    recovery_timeout=60,
    fallback=fallback_cached_data
)
async def make_riot_request(...):
    # If 5 failures in a row, circuit opens
    # Subsequent calls use fallback immediately
    # After 60 seconds, circuit enters half-open
    # One successful call closes the circuit
```

### States

```
CLOSED (Normal) ──▶ Threshold Exceeded ──▶ OPEN (Failing Fast)
     ▲                                            │
     │                                            │
     └── Recovery Success ◀── Half-Open ◀── Timeout
```

---

## Multi-Region Strategy

### Regional Limits Are Independent

```python
# Can make 20 req/s to NA AND 20 req/s to EU simultaneously
na_client = RiotApiClient(RiotApiConfig(api_key=key, shard="na"))
eu_client = RiotApiClient(RiotApiConfig(api_key=key, shard="eu"))

# These don't count against each other
await asyncio.gather(
    na_client.get_match(match_id),
    eu_client.get_match(match_id)
)
```

### Load Distribution

```python
class MultiRegionManager:
    def __init__(self, api_key: str):
        self.clients = {
            region: RiotApiClient(RiotApiConfig(api_key=api_key, shard=region))
            for region in ["na", "eu", "ap", "kr"]
        }
    
    async def distribute_requests(self, requests: List[Request]):
        # Round-robin distribution across regions
        for i, request in enumerate(requests):
            region = list(self.clients.keys())[i % len(self.clients)]
            await self.clients[region].execute(request)
```

---

## Monitoring & Alerting

### Metrics to Track

```python
@dataclass
class RateLimitMetrics:
    requests_made: int
    requests_remaining: int
    cache_hits: int
    cache_misses: int
    rate_limit_hits: int
    average_latency: float
    circuit_breaker_state: str
```

### Health Check Endpoint

```python
@app.get("/api/health/riot-rate-limit")
async def get_rate_limit_health():
    return {
        "status": "healthy" if rate_limiter.remaining > 10 else "warning",
        "requests_remaining": rate_limiter.remaining,
        "reset_in_seconds": rate_limiter.reset_time - time.time(),
        "cache_hit_rate": cache.hit_rate,
        "circuit_breaker": circuit_breaker.state.value
    }
```

### Alerts

- **Warning**: < 20% of rate limit remaining
- **Critical**: < 5% of rate limit remaining
- **Emergency**: Rate limit hit (429 received)

---

## Best Practices

### DO

✅ **Cache aggressively** - Static content rarely changes  
✅ **Batch requests** - Fetch multiple matches in parallel  
✅ **Use exponential backoff** - Don't hammer on 429s  
✅ **Track headers** - Monitor X-Rate-Limit-Count  
✅ **Implement circuit breaker** - Fail fast when degraded  
✅ **Log rate limit events** - For debugging and optimization  
✅ **Prioritize requests** - User-facing > background  

### DON'T

❌ **Don't retry immediately** on 429 - Wait for Retry-After  
❌ **Don't share keys** across applications  
❌ **Don't hardcode keys** in frontend code  
❌ **Don't ignore 429s** - They can lead to key revocation  
❌ **Don't make unnecessary calls** - Check cache first  

---

## Testing Rate Limits

### Load Test Script

```python
import asyncio
from packages.shared.api.riot_client import RiotApiClient

async def stress_test():
    async with RiotApiClient() as client:
        start = time.time()
        
        # Make 150 requests (should trigger rate limit)
        tasks = [
            client.get_content()
            for _ in range(150)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        rate_limited = sum(1 for r in results if isinstance(r, RateLimitError))
        elapsed = time.time() - start
        
        print(f"Completed in {elapsed:.1f}s")
        print(f"Rate limited: {rate_limited}/{len(results)}")
        print(f"Effective rate: {len(results)/elapsed:.1f} req/s")

asyncio.run(stress_test())
```

### Expected Results

| Phase | Duration | Requests | Effective Rate |
|-------|----------|----------|----------------|
| Initial | 5s | 20 | 4 req/s |
| Wait | 55s | 0 | 0 req/s |
| Continue | 5s | 20 | 4 req/s |
| **Total** | **~120s** | **100** | **0.83 req/s** |

---

## Troubleshooting

### Common Issues

**Issue**: Getting 429s despite rate limiting  
**Cause**: Another application using same key  
**Solution**: Use separate keys per application

**Issue**: Intermittent 429s  
**Cause**: Clock drift or header parsing issues  
**Solution**: Add buffer (use 18 req/s instead of 20)

**Issue**: Circuit breaker keeps opening  
**Cause**: Riot API downtime  
**Solution**: Increase recovery timeout, check status page

---

## References

- [Riot Rate Limiting Docs](https://developer.riotgames.com/docs/portal)
- [Token Bucket Algorithm](https://en.wikipedia.org/wiki/Token_bucket)
- [Circuit Breaker Pattern](https://martinfowler.com/bliki/CircuitBreaker.html)

---

*Last updated: 2026-03-15*
