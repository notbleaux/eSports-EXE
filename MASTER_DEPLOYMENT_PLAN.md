[Ver001.000]

# Master Deployment Plan
## Libre-X-eSport 4NJZ4 TENET Platform v2.1

**Date:** 2026-03-16  
**Status:** Ready for Execution  
**Target:** Staging → Production  
**Cost:** $0.00/month (Free Tier)

---

## Pre-Deployment Checklist

### Environment Variables (Set in Render/Vercel Dashboards)

**Render (API) - Required:**
```bash
DATABASE_URL=postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
REDIS_URL=rediss://default:[password]@[host]:[port]
JWT_SECRET_KEY=[generate: openssl rand -hex 32]
TOTP_ENCRYPTION_KEY=[generate: openssl rand -hex 32]
ENCRYPTION_KEY=[generate: openssl rand -hex 32]
APP_ENVIRONMENT=production
LOG_LEVEL=INFO
DB_POOL_MIN_SIZE=2
DB_POOL_MAX_SIZE=5
```

**Vercel (Frontend) - Required:**
```bash
VITE_API_URL=https://sator-api.onrender.com
VITE_WS_URL=wss://sator-api.onrender.com/v1/ws
VITE_APP_ENV=production
```

**Optional (for enhanced features):**
```bash
PANDASCORE_API_KEY=[optional, for live data]
SENTRY_DSN=[optional, for error tracking]
VITE_SENTRY_DSN=[optional, frontend error tracking]
```

### Database Setup (Supabase)
- [ ] Create Supabase project
- [ ] Run all migrations (001-019)
- [ ] Verify materialized views created
- [ ] Test connection from local

### Repository State
- [ ] All changes committed
- [ ] `render.yaml` verified (plan: free)
- [ ] `vercel.json` verified
- [ ] No hardcoded secrets
- [ ] Tests passing

---

## Deployment Phases

### Phase 1: Database Migration (5 minutes)

```bash
# 1. Connect to Supabase
psql $DATABASE_URL -f packages/shared/axiom-esports-data/infrastructure/migrations/001_initial_schema.sql
psql $DATABASE_URL -f packages/shared/axiom-esports-data/infrastructure/migrations/002_sator_layers.sql
# ... continue for all migrations

# Or use migration script
cd packages/shared/axiom-esports-data
python scripts/run_migrations.py
```

**Verification:**
```bash
psql $DATABASE_URL -c "SELECT COUNT(*) FROM player_performance;"
# Should return 0 (empty but table exists)
```

---

### Phase 2: API Deployment - Render (10 minutes)

**Step 1: Connect Repository**
1. Go to https://dashboard.render.com
2. Click "New +" → "Blueprint"
3. Connect GitHub repository
4. Select `notbleaux/eSports-EXE`
5. Render will detect `render.yaml`

**Step 2: Configure Environment**
```bash
# In Render dashboard, add environment variables:
DATABASE_URL=[supabase connection string]
REDIS_URL=[upstash connection string]
JWT_SECRET_KEY=[generated]
TOTP_ENCRYPTION_KEY=[generated]
ENCRYPTION_KEY=[generated]
```

**Step 3: Deploy**
```bash
# Auto-deploy on push to main
git push origin main

# Or manual deploy
render deploy --service sator-api
```

**Verification:**
```bash
# Wait 2-3 minutes for cold start
curl https://sator-api.onrender.com/health
# Expected: {"status":"healthy","version":"2.1.0"}

curl https://sator-api.onrender.com/ready
# Expected: {"ready":true,"checks":{"database":true}}
```

---

### Phase 3: Frontend Deployment - Vercel (5 minutes)

**Step 1: Connect Repository**
1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import GitHub repository
4. Configure:
   - Framework: Vite
   - Root Directory: `apps/website-v2`
   - Build Command: `npm run build`
   - Output Directory: `dist`

**Step 2: Environment Variables**
```bash
VITE_API_URL=https://sator-api.onrender.com
VITE_WS_URL=wss://sator-api.onrender.com/v1/ws
VITE_APP_ENV=production
```

**Step 3: Deploy**
```bash
# Auto-deploy on push to main
git push origin main

# Or manual deploy
cd apps/website-v2
vercel --prod
```

**Verification:**
```bash
curl -I https://sator-platform.vercel.app
# Expected: HTTP/2 200
```

---

### Phase 4: Post-Deployment Validation (30 minutes)

**4.1 Health Checks**
```bash
# API health
curl https://sator-api.onrender.com/health
curl https://sator-api.onrender.com/ready
curl https://sator-api.onrender.com/metrics

# Frontend loads
curl https://sator-platform.vercel.app
```

**4.2 End-to-End Tests**
- [ ] Homepage loads without errors
- [ ] Player search returns results
- [ ] RAR leaderboard displays
- [ ] Betting odds load
- [ ] WebSocket connects
- [ ] OAuth login works (if configured)

**4.3 Performance Check**
- [ ] LCP < 2.5s (check DevTools)
- [ ] API response < 200ms (warm)
- [ ] Cold start < 60s

---

### Phase 5: Monitoring Setup (Optional, 1 hour)

**5.1 Sentry Error Tracking (Free)**
```bash
# 1. Sign up at sentry.io
# 2. Create project, get DSN
# 3. Add to Render environment: SENTRY_DSN=...
# 4. Add to Vercel environment: VITE_SENTRY_DSN=...
# 5. Redeploy
```

**5.2 Keepalive (Prevent Cold Starts)**
```bash
# Set up GitHub Action to ping every 10 minutes
# Already configured in .github/workflows/keepalive.yml
```

---

## Rollback Plan

### If Deployment Fails:

**Step 1: Identify Issue**
```bash
# Check Render logs
render logs --service sator-api --tail 100

# Check Vercel logs
vercel logs sator-platform
```

**Step 2: Rollback**
```bash
# Revert to previous commit
git revert HEAD
git push origin main

# Or manually redeploy previous version in Render/Vercel dashboard
```

**Step 3: Verify Rollback**
```bash
curl https://sator-api.onrender.com/health
# Should return healthy with previous version
```

---

## Success Criteria

Deployment is **SUCCESSFUL** when:

- [ ] All health checks pass
- [ ] Frontend loads without errors
- [ ] API responds in < 500ms (cold start OK)
- [ ] Database queries work
- [ ] WebSocket connects
- [ ] No critical errors in logs
- [ ] Zero cost verified (all free tier)

---

## Post-Deployment Tasks

### Day 1:
- [ ] Monitor error rates
- [ ] Check Web Vitals
- [ ] Verify free tier limits not exceeded

### Week 1:
- [ ] Set up Sentry (optional)
- [ ] Review performance metrics
- [ ] Document any issues

### Month 1:
- [ ] Usage review
- [ ] Performance optimization
- [ ] Plan for growth (if needed)

---

## Emergency Contacts

| Service | Support URL | Status Page |
|---------|-------------|-------------|
| Render | dashboard.render.com | status.render.com |
| Supabase | app.supabase.com | status.supabase.com |
| Upstash | console.upstash.com | status.upstash.com |
| Vercel | vercel.com/dashboard | status.vercel.com |

---

## Estimated Timeline

| Phase | Duration | Cumulative |
|-------|----------|------------|
| Database Migration | 5 min | 5 min |
| API Deployment | 10 min | 15 min |
| Frontend Deployment | 5 min | 20 min |
| Validation | 30 min | 50 min |
| Monitoring Setup | 60 min | 110 min |

**Total Time: ~2 hours**

---

*Plan Version: 001.000*  
*Last Updated: 2026-03-16*  
*Status: READY FOR EXECUTION*
