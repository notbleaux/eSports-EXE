[Ver001.000]

# Post-Deployment Checklist
## Immediate Actions After Staging Deploy

**Date:** 2026-03-16  
**Environment:** Staging  
**Cost:** $0 (Free Tier)

---

## Phase 1: Immediate Verification (0-30 minutes)

### 1.1 Deployment Verification
- [ ] GitHub Actions CI passed
- [ ] Render deployment succeeded
- [ ] Vercel deployment succeeded
- [ ] No build errors in logs

### 1.2 Health Checks
```bash
# Run these commands
 curl -s https://api-staging.libre-x-esport.com/health | jq .
 curl -s https://api-staging.libre-x-esport.com/ready | jq .
 curl -s https://api-staging.libre-x-esport.com/metrics | head -20
```

Expected:
- [ ] `status: "healthy"`
- [ ] `ready: true`
- [ ] Database connected
- [ ] No error spikes

### 1.3 Critical Endpoints
```bash
# Test critical endpoints
curl https://api-staging.libre-x-esport.com/api/sator/players?limit=1
curl https://api-staging.libre-x-esport.com/api/betting/matches/1/odds
curl https://api-staging.libre-x-esport.com/api/sator/rar/leaderboard
```

- [ ] All return 200 OK
- [ ] Response time < 500ms (cold start acceptable)
- [ ] JSON structure correct

---

## Phase 2: Frontend Validation (30-60 minutes)

### 2.1 Basic Functionality
- [ ] Homepage loads without errors
- [ ] No console errors (F12 → Console)
- [ ] All hubs accessible (SATOR, ROTAS, AREPO, OPERA, TENET)
- [ ] Navigation works

### 2.2 Feature Testing
- [ ] Player search works
- [ ] RAR leaderboard displays
- [ ] Betting odds load
- [ ] WebSocket connects (check Network tab)
- [ ] OAuth login flows work

### 2.3 Performance Check
Open DevTools → Performance:
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] No layout shifts

---

## Phase 3: Error Tracking Setup (Day 1)

### 3.1 Sentry Configuration
```bash
# 1. Sign up at sentry.io (free tier)
# 2. Create project "sator-api"
# 3. Get DSN
```

- [ ] Add `SENTRY_DSN` to Render environment variables
- [ ] Add `VITE_SENTRY_DSN` to Vercel environment variables
- [ ] Redeploy
- [ ] Test by triggering an error (e.g., visit `/error-test`)
- [ ] Verify error appears in Sentry dashboard

### 3.2 Alert Configuration
- [ ] Set up Slack integration (if desired)
- [ ] Configure alert rules:
  - Email on 5+ errors in 5 minutes
  - Email on new error type

---

## Phase 4: Performance Monitoring (Day 1-2)

### 4.1 Web Vitals
- [ ] Confirm `initWebVitals()` called in main.tsx
- [ ] Check `/api/analytics/vitals` endpoint receiving data
- [ ] View logs: `render logs --service sator-api | grep "Web Vital"`

### 4.2 Bundle Analysis
```bash
cd apps/website-v2
npm run build
npm run analyze
```

- [ ] Open `dist/stats.html`
- [ ] Verify bundle size < 500KB
- [ ] Check for unexpected large dependencies

---

## Phase 5: Security Verification (Day 2)

### 5.1 Headers Check
```bash
curl -I https://api-staging.libre-x-esport.com/health
```

Verify headers present:
- [ ] `strict-transport-security`
- [ ] `content-security-policy`
- [ ] `x-frame-options: DENY`
- [ ] `x-content-type-options: nosniff`

### 5.2 CORS Test
```bash
curl -H "Origin: https://evil.com" \
  https://api-staging.libre-x-esport.com/health
```

- [ ] Should return CORS error (blocked)

### 5.3 Rate Limiting
```bash
# Send 150 requests rapidly
for i in {1..150}; do
  curl -s https://api-staging.libre-x-esport.com/health > /dev/null
done
```

- [ ] Should see 429 errors after limit
- [ ] Wait 1 minute, should recover

---

## Phase 6: Load Testing (Day 2-3)

### 6.1 Basic Load Test
```bash
cd tests/load
locust -f locustfile.py \
  --headless \
  -u 10 \
  -r 2 \
  --run-time 5m \
  --host https://api-staging.libre-x-esport.com
```

- [ ] Error rate < 1%
- [ ] p95 latency < 500ms
- [ ] No 503/504 errors

### 6.2 Cold Start Test
```bash
# After 20 min idle (wait for Render spin-down)
time curl https://api-staging.libre-x-esport.com/health
```

- [ ] Response within 60 seconds
- [ ] Subsequent requests < 200ms

---

## Phase 7: Data Integrity (Day 3)

### 7.1 Database Check
```sql
-- Connect to Supabase SQL editor
SELECT 
    'player_performance' as table_name, 
    COUNT(*) as count,
    MAX(realworld_time) as latest
FROM player_performance
UNION ALL
SELECT 'users', COUNT(*), MAX(created_at)
FROM users;
```

- [ ] Tables have expected row counts
- [ ] Recent data present (not stale)
- [ ] No duplicate entries

### 7.2 API Response Validation
```bash
# Check RAR calculation returns real data
curl -s https://api-staging.libre-x-esport.com/api/sator/rar/leaderboard | jq '.[0]'
```

- [ ] Returns actual database results
- [ ] Not mock/placeholder data
- [ ] Investment grades calculated correctly

---

## Phase 8: Documentation (Day 3-5)

### 8.1 Runbook Updates
- [ ] Update DR runbook with actual connection strings
- [ ] Document any staging-specific configs
- [ ] Note any issues found and resolutions

### 8.2 Team Communication
- [ ] Share staging URLs with team
- [ ] Document known limitations
- [ ] Share monitoring dashboard links

---

## Sign-Off Criteria

Staging deployment is **APPROVED** when:
- [ ] All Phase 1-5 checks pass
- [ ] Error rate < 1% for 24 hours
- [ ] No critical security issues
- [ ] Performance meets targets
- [ ] Team review complete

---

## Quick Reference

### Staging URLs
```
Frontend: https://sator-staging.vercel.app
API:      https://api-staging.libre-x-esport.com
Health:   https://api-staging.libre-x-esport.com/health
Metrics:  https://api-staging.libre-x-esport.com/metrics
```

### Emergency Commands
```bash
# Check logs
render logs --service sator-api --tail 100

# Restart
render deploy --service sator-api

# Database check
psql $DATABASE_URL -c "SELECT version();"
```

### Support Contacts
- Render: https://dashboard.render.com
- Supabase: https://app.supabase.com
- Vercel: https://vercel.com/dashboard

---

**Checklist Version:** 001.000  
**Estimated Time:** 2-3 days  
**Next Phase:** Production Deployment (after sign-off)
