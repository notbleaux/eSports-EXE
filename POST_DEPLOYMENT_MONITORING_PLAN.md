[Ver001.000]

# Post-Deployment Monitoring & Observability Plan
## Libre-X-eSport 4NJZ4 TENET Platform

**Date:** 2026-03-16  
**Status:** Staging Deployment Phase  
**Cost Target:** $0 (Free Tier Only)

---

## Executive Summary

This plan outlines monitoring, debugging, and performance optimization tools to implement AFTER staging deployment. All recommendations respect the **$0 cost constraint**.

```
PHASE 1: Basic Monitoring      ████████░░  Priority: HIGH   (Week 1)
PHASE 2: Performance Insights  ██████░░░░  Priority: MEDIUM (Week 2-3)
PHASE 3: Advanced Observability ████░░░░░░ Priority: LOW    (Month 2+)
```

---

## Phase 1: Essential Monitoring (Free Tier)

### 1.1 Error Tracking - Sentry (Free Tier) 🚨

**Service:** Sentry.io  
**Cost:** $0 (5,000 errors/month free)  
**Priority:** HIGH

**Implementation:**
```python
# packages/shared/api/main.py
# Add to requirements.txt: sentry-sdk[fastapi]==1.40.4

import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.asyncpg import AsyncPGIntegration

SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN and APP_ENVIRONMENT == "production":
    sentry_sdk.init(
        dsn=SENTRY_DSN,
        environment=APP_ENVIRONMENT,
        release="2.1.0",
        integrations=[
            FastApiIntegration(),
            AsyncPGIntegration(),
        ],
        traces_sample_rate=0.1,  # 10% of requests for performance monitoring
        profiles_sample_rate=0.1,
    )
```

**Frontend:**
```typescript
// apps/website-v2/src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.VITE_APP_ENV,
  release: "2.1.0",
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
  ],
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,
});
```

**Value:**
- Real-time error alerts
- Stack traces with source maps
- Error frequency tracking
- User impact analysis

---

### 1.2 Web Vitals Monitoring (Native) 📊

**Service:** Built-in + Vercel Analytics  
**Cost:** $0  
**Priority:** HIGH

**Implementation:**
```typescript
// apps/website-v2/src/utils/webVitals.ts
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';

export function initWebVitals() {
  const reportWebVital = (metric: any) => {
    // Send to your analytics endpoint
    fetch('/api/analytics/vitals', {
      method: 'POST',
      body: JSON.stringify({
        name: metric.name,
        value: metric.value,
        rating: metric.rating, // 'good', 'needs-improvement', 'poor'
        delta: metric.delta,
        id: metric.id,
        timestamp: new Date().toISOString(),
      }),
      keepalive: true,
    }).catch(console.error);
    
    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[Web Vital] ${metric.name}:`, metric.value);
    }
  };
  
  getCLS(reportWebVital);
  getFID(reportWebVital);
  getFCP(reportWebVital);
  getLCP(reportWebVital);
  getTTFB(reportWebVital);
}
```

**Backend Endpoint:**
```python
@router.post("/analytics/vitals")
async def record_web_vitals(
    data: WebVitalsPayload,
    request: Request
):
    """Receive and log Web Vitals from frontend."""
    logger.info(f"Web Vital: {data.name}={data.value}ms ({data.rating})")
    
    # Alert on poor performance
    if data.rating == "poor":
        logger.warning(f"Poor {data.name}: {data.value}ms from {request.client.host}")
    
    return {"status": "recorded"}
```

**Target Thresholds:**
| Metric | Good | Needs Improvement | Poor |
|--------|------|-------------------|------|
| LCP | ≤2.5s | ≤4.0s | >4.0s |
| FID | ≤100ms | ≤300ms | >300ms |
| CLS | ≤0.1 | ≤0.25 | >0.25 |
| TTFB | ≤600ms | ≤1000ms | >1000ms |

---

### 1.3 Health Check Dashboard 🏥

**Service:** Custom + Render Native  
**Cost:** $0  
**Priority:** HIGH

**Enhanced Health Endpoint:**
```python
@app.get("/health/detailed")
async def detailed_health_check():
    """Detailed health check for monitoring dashboards."""
    checks = {
        "database": await check_database(),
        "redis": await check_redis(),
        "disk": check_disk_space(),
        "memory": check_memory_usage(),
    }
    
    all_healthy = all(c["status"] == "healthy" for c in checks.values())
    
    return {
        "status": "healthy" if all_healthy else "degraded",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "version": "2.1.0",
        "environment": os.getenv("APP_ENVIRONMENT"),
        "uptime_seconds": get_uptime(),
        "checks": checks,
    }

async def check_database():
    try:
        start = time.time()
        pool = await db.get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        latency = (time.time() - start) * 1000
        return {
            "status": "healthy",
            "latency_ms": round(latency, 2),
            "connections": len(pool._holders),
        }
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

**Value:**
- Quick diagnostics
- Proactive alerting
- Performance trending

---

## Phase 2: Performance Insights

### 2.1 Database Query Profiler 🔍

**Service:** Custom middleware  
**Cost:** $0  
**Priority:** MEDIUM

**Implementation:**
```python
# packages/shared/api/src/middleware/query_profiler.py

import time
import logging
from typing import Callable
from fastapi import Request, Response

logger = logging.getLogger("query_profiler")

class QueryProfilerMiddleware:
    """Profile slow database queries."""
    
    def __init__(self, slow_query_threshold_ms: float = 100.0):
        self.slow_query_threshold = slow_query_threshold_ms
    
    async def __call__(self, request: Request, call_next: Callable):
        start_time = time.time()
        
        response = await call_next(request)
        
        duration_ms = (time.time() - start_time) * 1000
        
        if duration_ms > self.slow_query_threshold:
            logger.warning(
                f"Slow request: {request.method} {request.url.path} "
                f"took {duration_ms:.2f}ms"
            )
        
        # Add performance header
        response.headers["X-Response-Time-Ms"] = str(round(duration_ms, 2))
        
        return response
```

**Slow Query Log Analysis:**
```bash
# View slow queries
render logs --service sator-api | grep "Slow request"

# Weekly report
grep "Slow request" app.log | awk '{print $4}' | sort | uniq -c | sort -rn
```

---

### 2.2 API Endpoint Analytics 📈

**Service:** Custom metrics  
**Cost:** $0  
**Priority:** MEDIUM

**Implementation:**
```python
# Add to existing metrics in main.py

ENDPOINT_USAGE = Counter(
    'api_endpoint_calls_total',
    'API calls by endpoint',
    ['endpoint', 'method', 'user_type']  # user_type: anonymous, authenticated
)

ERROR_BREAKDOWN = Counter(
    'api_errors_total',
    'API errors by type',
    ['endpoint', 'error_type', 'status_code']
)

@app.middleware("http")
async def analytics_middleware(request: Request, call_next):
    # Existing metrics...
    
    # Track endpoint usage
    user_type = "authenticated" if request.headers.get("Authorization") else "anonymous"
    ENDPOINT_USAGE.labels(
        endpoint=request.url.path,
        method=request.method,
        user_type=user_type
    ).inc()
    
    return response
```

**Weekly Report:**
```python
# Generate usage report
@app.get("/admin/usage-report")
async def usage_report():
    """Generate weekly API usage report."""
    return {
        "top_endpoints": get_top_endpoints(limit=10),
        "error_rate": calculate_error_rate(),
        "avg_response_time": get_avg_response_time(),
        "unique_users": count_unique_users(days=7),
    }
```

---

### 2.3 Bundle Analysis (Frontend) 📦

**Service:** Build-time analysis  
**Cost:** $0  
**Priority:** MEDIUM

**Implementation:**
```bash
# Add to package.json scripts
"analyze": "vite-bundle-visualizer"
```

```typescript
// vite.config.js - Add rollup plugin
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    // ... existing plugins
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  build: {
    // Track chunk sizes
    rollupOptions: {
      output: {
        manualChunks: {
          // Existing chunks...
        },
      },
    },
    // Warn on large chunks
    chunkSizeWarningLimit: 100, // kb
  },
});
```

**Bundle Size Budgets:**
| Chunk | Current | Budget | Status |
|-------|---------|--------|--------|
| main | ~80KB | 100KB | ✅ |
| react-vendor | ~120KB | 150KB | ✅ |
| three-vendor | ~150KB | 200KB | ✅ |
| Total | 306KB | 500KB | ✅ |

---

## Phase 3: Advanced Observability

### 3.1 Distributed Tracing (Optional) 🔗

**Service:** OpenTelemetry (self-hosted)  
**Cost:** $0 (complex setup)  
**Priority:** LOW

**Note:** Skip for initial deployment. Implement only if debugging complex issues.

---

### 3.2 Real User Monitoring (RUM) 👥

**Service:** Custom implementation  
**Cost:** $0  
**Priority:** LOW

**Implementation:**
```typescript
// Track user journeys
export function trackUserJourney(event: string, metadata?: object) {
  fetch('/api/analytics/events', {
    method: 'POST',
    body: JSON.stringify({
      event,
      metadata,
      timestamp: Date.now(),
      session_id: getSessionId(),
      path: window.location.pathname,
    }),
    keepalive: true,
  }).catch(() => {}); // Silent fail
}

// Usage in components
useEffect(() => {
  trackUserJourney('page_view', { hub: 'sator' });
}, []);

// Track feature usage
const handleBetPlaced = () => {
  trackUserJourney('bet_placed', { amount, odds });
};
```

---

### 3.3 Cache Performance Monitoring 💾

**Service:** Custom metrics  
**Cost:** $0  
**Priority:** MEDIUM

**Implementation:**
```python
# Track cache hit/miss rates
CACHE_HITS = Counter('redis_cache_hits_total', 'Cache hits', ['cache_name'])
CACHE_MISSES = Counter('redis_cache_misses_total', 'Cache misses', ['cache_name'])

async def get_cached_odds(match_id: str):
    cache_key = f"odds:{match_id}"
    cached = await redis.get(cache_key)
    
    if cached:
        CACHE_HITS.labels(cache_name="odds").inc()
        return json.loads(cached)
    
    CACHE_MISSES.labels(cache_name="odds").inc()
    # Fetch from DB...
```

**Target Metrics:**
- Cache hit rate: > 80%
- Cache miss rate: < 20%
- Eviction rate: < 5%

---

## Implementation Timeline

### Week 1 (Staging Deploy)
- [ ] Deploy to staging
- [ ] Set up Sentry (free tier)
- [ ] Enable Web Vitals tracking
- [ ] Verify health endpoints
- [ ] Test error alerting

### Week 2-3 (Performance Baseline)
- [ ] Analyze bundle sizes
- [ ] Profile slow queries
- [ ] Monitor Web Vitals
- [ ] Establish performance baseline
- [ ] Document normal vs abnormal metrics

### Month 2+ (Optimization)
- [ ] Review cache hit rates
- [ ] Optimize slow queries
- [ ] Implement RUM (if needed)
- [ ] Set up weekly performance reports

---

## Monitoring Checklist

### Daily Checks (Automated)
- [ ] Error rate < 1%
- [ ] API response time p95 < 200ms
- [ ] Database connections < 80%
- [ ] Redis memory < 80%
- [ ] Web Vitals "Good" > 90%

### Weekly Reviews
- [ ] Top 10 slowest endpoints
- [ ] Error breakdown by type
- [ ] Cache hit rates
- [ ] Bundle size trends
- [ ] User journey analytics

### Monthly Deep Dives
- [ ] Performance regression analysis
- [ ] Cost review (stay at $0)
- [ ] Security audit
- [ ] Dependency updates
- [ ] Documentation updates

---

## Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| Error Rate | > 1% | > 5% | Page on-call |
| API Latency p95 | > 200ms | > 500ms | Investigate |
| DB Connections | > 80% | > 95% | Scale/Optimize |
| Redis Memory | > 80% | > 95% | Clear cache |
| LCP (Web Vitals) | > 2.5s | > 4s | Optimize |
| Cold Start | > 30s | > 60s | Keepalive check |

---

## Tools Summary (All Free)

| Tool | Purpose | Cost | Setup |
|------|---------|------|-------|
| **Sentry** | Error tracking | $0 | 30 min |
| **Web Vitals** | Performance | $0 | 15 min |
| **Render Logs** | Application logs | $0 | Built-in |
| **Vercel Analytics** | Web Vitals | $0 | Built-in |
| **Custom Metrics** | Business metrics | $0 | 1 hour |
| **Health Checks** | System health | $0 | Built-in |

**Total Monthly Cost: $0**  
**Total Setup Time: ~2-3 hours**

---

## Success Criteria

After implementing Phase 1-2:
- ✅ Error detection within 5 minutes
- ✅ Performance regression detection within 1 hour
- ✅ Root cause analysis time < 30 minutes
- ✅ Web Vitals "Good" rating > 90%
- ✅ Cache hit rate > 80%
- ✅ Zero blind spots in monitoring

---

*Plan Version: 001.000*  
*Target: Staging Deployment Week 1*  
*Cost: $0.00/month*
