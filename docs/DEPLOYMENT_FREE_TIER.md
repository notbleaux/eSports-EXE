[Ver001.000]

# Free Tier Deployment Guide
## NJZiteGeisTe Platform

**Last Updated:** 2026-03-16  
**Version:** 2.1.0  
**Classification:** FREE TIER - Zero Cost Deployment

---

## Overview

This guide documents how to deploy the platform using **only free tier services** across all infrastructure components.

**Total Monthly Cost: $0**

---

## Free Tier Services Matrix

| Component | Service | Free Tier Limits | Status |
|-----------|---------|------------------|--------|
| **Frontend** | Vercel | 100GB bandwidth, 6,000 build mins | ✅ |
| **API** | Render | 750 hours, 512MB RAM, 1 worker | ✅ |
| **Database** | Supabase | 500MB storage, 2GB egress | ✅ |
| **Cache** | Upstash | 10,000 commands/day | ✅ |
| **CI/CD** | GitHub Actions | 2,000 minutes/month | ✅ |
| **Monitoring** | Render logs | 7-day retention | ✅ |

**Total Cost: $0/month**

---

## Service-Specific Configurations

### 1. Render Web Service (API)

**Plan:** Free  
**Limitations:**
- Single worker process only
- 512MB RAM
- Spins down after 15 min inactivity (cold start ~30s)
- 750 hours/month (sufficient for 24/7)

**Configuration:**
```yaml
# infrastructure/render.yaml
plan: free
startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
```

**Optimizations:**
- Use connection pooling (min: 2, max: 5)
- Enable lazy database initialization
- Use Redis caching to reduce DB load
- Keepalive ping every 10 minutes (prevent spin-down)

**Cold Start Mitigation:**
```yaml
# .github/workflows/keepalive.yml
# Ping every 10 minutes during business hours
```

---

### 2. Supabase Database

**Plan:** Free  
**Limitations:**
- 500MB storage
- 2GB egress/month
- 200 concurrent connections
- Paused after 7 days inactivity

**Configuration:**
```bash
# Connection string format
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

**Optimizations:**
- Connection pool: max 5 (respect 200 limit)
- Use materialized views for analytics
- Archive old data (>1 year) if needed
- Monitor egress with:
```sql
SELECT pg_size_pretty(pg_database_size('postgres'));
```

**Data Retention Strategy:**
- Raw data: 90 days
- Aggregated stats: 1 year
- Archive to JSON files if exceeding 400MB

---

### 3. Upstash Redis

**Plan:** Free  
**Limitations:**
- 10,000 commands/day
- No persistence (data lost on restart)
- 256MB max memory

**Configuration:**
```bash
REDIS_URL=rediss://default:[password]@[host]:[port]
```

**Optimizations:**
- Cache TTL: 30-300 seconds (not infinite)
- Don't store sessions in Redis (use JWT)
- Use for rate limiting and betting odds only
- Implement cache warming on startup

**Usage Monitoring:**
```python
# Log remaining commands (Upstash provides header)
remaining = response.headers.get('X-RateLimit-Remaining')
```

---

### 4. Vercel Frontend

**Plan:** Free (Hobby)  
**Limitations:**
- 100GB bandwidth/month
- 6,000 build minutes/month
- 10-second function timeout
- 1,000 image optimizations/day

**Optimizations:**
- Bundle size < 500KB (currently 306KB) ✅
- Use static generation where possible
- Lazy load TensorFlow.js (not in bundle) ✅
- Implement proper caching headers

---

## Free Tier Constraints & Workarounds

### 1. Single Worker Limitation

**Constraint:** Render free = 1 worker only  
**Impact:** No horizontal scaling, lower concurrency  
**Workarounds:**
- Use async/await for I/O bound operations
- Implement proper connection pooling
- Use Redis caching to reduce load
- Optimize database queries

**Connection Pool Sizing:**
```python
# database.py - Free tier optimized
DB_POOL_MIN_SIZE=2
DB_POOL_MAX_SIZE=5  # Low due to single worker
```

### 2. Cold Start Issues

**Constraint:** Render spins down after 15 min idle  
**Impact:** ~30 second cold start  
**Workarounds:**

```yaml
# .github/workflows/keepalive.yml
name: Keep Alive

on:
  schedule:
    - cron: '*/10 6-22 * * *'  # Every 10 min, 6am-10pm UTC

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -sf https://api.njzitegeist.com/health || true
```

### 3. No Redis Persistence

**Constraint:** Upstash free = no persistence  
**Impact:** Cache lost on restart  
**Workarounds:**
- Cache is ephemeral by design
- Don't store critical data in cache
- Implement cache warming on startup
- Use database for sessions (JWT tokens)

### 4. Database Egress Limit

**Constraint:** Supabase free = 2GB/month egress  
**Impact:** Potential overage charges  
**Monitoring:**
```sql
-- Check database size weekly
SELECT pg_size_pretty(pg_database_size('postgres'));

-- Check table sizes
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables 
WHERE schemaname='public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Mitigation:**
- Use materialized views for heavy queries
- Implement caching layer
- Archive old data if approaching limit

---

## Deployment Checklist

### Pre-Deployment
- [ ] All services configured for free tier
- [ ] Environment variables set (no paid features)
- [ ] Keepalive workflow enabled
- [ ] Monitoring configured (basic)

### Post-Deployment
- [ ] Verify `/health` endpoint responds
- [ ] Test cold start time (< 60s acceptable)
- [ ] Check database connections (< 10)
- [ ] Monitor Redis command usage (< 10k/day)
- [ ] Verify Vercel build success

---

## Monitoring Free Tier Limits

### Render Dashboard
- Hours used: < 750/month
- Memory: < 512MB
- Disk: < 1GB

### Supabase Dashboard
- Database size: < 500MB
- Egress: < 2GB/month
- Connections: < 50 (monitor pg_stat_activity)

### Upstash Dashboard
- Commands: < 10,000/day
- Memory: < 256MB

### Vercel Dashboard
- Bandwidth: < 100GB/month
- Build minutes: < 6,000/month

---

## Scaling Path (When Ready to Pay)

### Phase 1: $7/month (Render Starter)
- 2 workers instead of 1
- Better performance
- No cold starts

### Phase 2: $25/month (Supabase Pro)
- 8GB storage
- 100GB egress
- Daily backups
- No pausing

### Phase 3: $80/month (Full Production)
- Render Starter ($7)
- Supabase Pro ($25)
- Upstash Pay-as-you-go ($10)
- Vercel Pro ($20)
- Monitoring (Sentry/etc) ($18)

---

## Cost Monitoring

### Monthly Check
```bash
# 1. Check Render (must be < 750 hours)
# Dashboard: https://dashboard.render.com

# 2. Check Supabase usage
# Dashboard: https://app.supabase.com/project/_/settings/usage

# 3. Check Upstash
# Dashboard: https://console.upstash.com

# 4. Check Vercel
# Dashboard: https://vercel.com/dashboard
```

### Alerts (Set up manually)
- Supabase: 80% of 500MB storage
- Supabase: 80% of 2GB egress
- Upstash: 80% of 10k commands/day
- Vercel: 80% of 100GB bandwidth

---

## Troubleshooting Free Tier

### Issue: Cold Starts Too Slow
**Solution:** Implement keepalive ping every 10 minutes

### Issue: Database Connections Exhausted
**Solution:** Reduce pool size to max 5, check for connection leaks

### Issue: Redis Commands Limit Hit
**Solution:** Increase cache TTL, reduce cache usage

### Issue: Supabase Database Paused
**Solution:** Access dashboard to resume (7-day inactivity)

### Issue: Render Hours Limit
**Solution:** Temporary - wait for next month or upgrade

---

## Migration to Paid (When Ready)

### Step 1: Render Starter ($7/month)
```yaml
# infrastructure/render.yaml
plan: starter
startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT --workers 2
```

### Step 2: Supabase Pro ($25/month)
- Upgrade in dashboard
- No configuration changes needed

### Step 3: Upstash Paid ($10/month)
- Enables persistence
- Higher command limits

---

## Important Notes

1. **Never commit paid plan configs to repo**
   - Keep `plan: free` in committed files
   - Use environment-specific overrides

2. **Monitor usage weekly**
   - Set calendar reminders
   - Check all dashboards

3. **Have upgrade path ready**
   - Document the steps
   - Know the costs
   - Plan for traffic spikes

4. **Free tier is for**
   - Development
   - Small production loads (< 1000 users/day)
   - Proof of concept
   - Personal projects

---

*This deployment uses ZERO paid services. All infrastructure is free tier.*

**Monthly Cost: $0.00**
