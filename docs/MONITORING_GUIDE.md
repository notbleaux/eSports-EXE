[Ver001.000]

# Monitoring and Alerting Guide — 4NJZ4 TENET Platform

**Version:** 2.1.0  
**Last Updated:** 2026-03-15

---

## Table of Contents

1. [Overview](#overview)
2. [Metrics Collection](#metrics-collection)
3. [Dashboard Setup](#dashboard-setup)
4. [Alerting Rules](#alerting-rules)
5. [Log Aggregation](#log-aggregation)
6. [Health Checks](#health-checks)

---

## Overview

This guide covers monitoring and alerting for the 4NJZ4 TENET Platform.

### Monitoring Stack

| Component | Tool | Purpose |
|-----------|------|---------|
| Metrics | Prometheus + Grafana | System metrics |
| Logs | Render Logs / Vercel Analytics | Application logs |
| APM | Custom + Web Vitals | Performance monitoring |
| Alerts | GitHub Actions + Slack | Alert notifications |

### Key Metrics

| Category | Metrics | Target |
|----------|---------|--------|
| **API** | Response time, Error rate, Throughput | <100ms, <1%, >100 RPS |
| **Web** | LCP, FID, CLS, TTFB | <2.5s, <100ms, <0.1, <600ms |
| **Database** | Query time, Connection pool, Slow queries | <50ms, <80%, 0 |
| **Cache** | Hit rate, Memory usage, Eviction rate | >80%, <90%, <1% |
| **WebSocket** | Connections, Message rate, Latency | Stable, >1000/s, <50ms |

---

## Metrics Collection

### API Metrics (FastAPI + Prometheus)

```python
# packages/shared/axiom-esports-data/api/src/metrics.py
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from fastapi import Request, Response

# Request counter
REQUEST_COUNT = Counter(
    'http_requests_total',
    'Total HTTP requests',
    ['method', 'endpoint', 'status']
)

# Request latency
REQUEST_LATENCY = Histogram(
    'http_request_duration_seconds',
    'HTTP request latency',
    ['method', 'endpoint']
)

# Active connections
ACTIVE_CONNECTIONS = Gauge(
    'websocket_active_connections',
    'Number of active WebSocket connections'
)

# Database connections
DB_CONNECTIONS = Gauge(
    'db_connections_active',
    'Active database connections'
)

@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_LATENCY.labels(
        method=request.method,
        endpoint=request.url.path
    ).observe(duration)
    
    return response

@app.get("/metrics")
async def metrics():
    return Response(
        content=generate_latest(),
        media_type="text/plain"
    )
```

### Web Vitals (Frontend)

```typescript
// apps/website-v2/src/utils/analytics.ts
import { getCLS, getFCP, getFID, getLCP, getTTFB } from 'web-vitals';

export function initWebVitals() {
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
}

function sendToAnalytics(metric: any) {
  const body = JSON.stringify(metric);
  
  // Send to analytics endpoint
  fetch('/api/analytics/vitals', {
    body,
    method: 'POST',
    keepalive: true,
  });
  
  // Log in development
  if (import.meta.env.DEV) {
    console.log('[Web Vitals]', metric);
  }
}
```

### Custom Performance Metrics

```typescript
// React component performance
import { Profiler } from 'react';

function onRenderCallback(
  id: string,
  phase: string,
  actualDuration: number,
  baseDuration: number
) {
  // Send to analytics
  gtag('event', 'component_render', {
    component_id: id,
    phase,
    duration: actualDuration,
  });
}

// Usage
<Profiler id="SatorHub" onRender={onRenderCallback}>
  <SatorHub />
</Profiler>
```

---

## Dashboard Setup

### Grafana Dashboard (JSON)

```json
{
  "dashboard": {
    "title": "4NJZ4 TENET Platform",
    "panels": [
      {
        "title": "API Request Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{endpoint}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "API Response Time (p95)",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "{{endpoint}}"
          }
        ],
        "type": "graph"
      },
      {
        "title": "Error Rate",
        "targets": [
          {
            "expr": "rate(http_requests_total{status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          }
        ],
        "type": "graph"
      },
      {
        "title": "WebSocket Connections",
        "targets": [
          {
            "expr": "websocket_active_connections",
            "legendFormat": "Active"
          }
        ],
        "type": "stat"
      },
      {
        "title": "Database Connections",
        "targets": [
          {
            "expr": "db_connections_active",
            "legendFormat": "Active"
          }
        ],
        "type": "stat"
      }
    ]
  }
}
```

### Vercel Analytics Dashboard

Access at: https://vercel.com/dashboard

Key metrics:
- Real Experience Score (RES)
- Core Web Vitals
- Traffic and bandwidth
- Build performance

---

## Alerting Rules

### GitHub Actions Alerts

```yaml
# .github/workflows/monitoring.yml
name: Monitoring Alerts

on:
  schedule:
    - cron: '*/5 * * * *'  # Every 5 minutes

jobs:
  health-check:
    runs-on: ubuntu-latest
    steps:
      - name: API Health Check
        run: |
          if ! curl -sf https://api.libre-x-esport.com/health; then
            echo "::error::API health check failed"
            exit 1
          fi
      
      - name: Web Health Check
        run: |
          if ! curl -sf https://libre-x-esport.com; then
            echo "::error::Web health check failed"
            exit 1
          fi
      
      - name: Notify Slack on Failure
        if: failure()
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "🚨 4NJZ4 Platform Alert: Health check failed",
              "blocks": [
                {
                  "type": "section",
                  "text": {
                    "type": "mrkdwn",
                    "text": "*Health check failed*\nTime: ${{ github.event.schedule }}"
                  }
                }
              ]
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK_URL }}
```

### Alert Thresholds

| Alert | Condition | Severity | Action |
|-------|-----------|----------|--------|
| API Down | Health check fails 3x | Critical | Page on-call |
| High Error Rate | >5% 5xx errors | Warning | Notify Slack |
| Slow Response | p95 >500ms | Warning | Notify Slack |
| DB Connection Pool | >90% used | Warning | Scale up |
| Cache Hit Rate | <70% | Info | Review cache policy |
| Web Vitals | LCP >4s | Warning | Optimize frontend |

---

## Log Aggregation

### Structured Logging (Python)

```python
import logging
import json
from pythonjsonlogger import jsonlogger

# Configure JSON logging
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter(
    '%(timestamp)s %(level)s %(name)s %(message)s'
)
logHandler.setFormatter(formatter)

logger = logging.getLogger()
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

# Usage
logger.info("Player created", extra={
    "player_id": player_id,
    "name": name,
    "region": region
})
```

### Log Levels

| Level | Usage | Example |
|-------|-------|---------|
| DEBUG | Development troubleshooting | Query execution details |
| INFO | Normal operations | Request processed successfully |
| WARNING | Unusual but handled | Slow query detected |
| ERROR | Failed operations | Database connection failed |
| CRITICAL | System failure | Service unable to start |

### Log Retention

| Environment | Retention | Storage |
|-------------|-----------|---------|
| Development | 7 days | Local |
| Staging | 14 days | Render/Vercel |
| Production | 30 days | External service |

---

## Health Checks

### Custom Health Endpoint

```python
@app.get("/health")
async def health_check():
    checks = {
        "database": await check_database(),
        "redis": await check_redis(),
        "pandascore": await check_pandascore()
    }
    
    all_healthy = all(c["status"] == "healthy" for c in checks.values())
    
    return {
        "status": "healthy" if all_healthy else "unhealthy",
        "version": "2.1.0",
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat()
    }

async def check_database():
    try:
        pool = get_pool()
        await pool.fetch("SELECT 1")
        return {"status": "healthy", "latency_ms": 5}
    except Exception as e:
        return {"status": "unhealthy", "error": str(e)}
```

### Synthetic Monitoring

```javascript
// Synthetic test with Playwright
// tests/monitoring/health-check.spec.ts

import { test, expect } from '@playwright/test';

test('Platform health check', async ({ page }) => {
  // Test main page
  await page.goto('/');
  await expect(page).toHaveTitle(/4NJZ4/);
  
  // Test API
  const response = await page.request.get(
    process.env.API_URL + '/health'
  );
  expect(response.ok()).toBeTruthy();
  
  // Test WebSocket
  // (Use WebSocket client in test)
});
```

---

## On-Call Runbook

### P1 - Service Down

1. Check status page: https://status.libre-x-esport.com
2. Verify health endpoints
3. Check Render/Vercel dashboards
4. Review recent deployments
5. Escalate if not resolved in 15 minutes

### P2 - Performance Degraded

1. Check Grafana dashboards
2. Identify bottleneck (DB/Cache/API)
3. Review slow query logs
4. Consider scaling up

### P3 - Data Issue

1. Check data freshness
2. Verify pipeline status
3. Review extraction logs
4. Consider manual data refresh

---

*End of Monitoring Guide*
