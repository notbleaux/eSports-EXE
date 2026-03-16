# [Ver001.000]

# Deployment Quick Reference Card
## Libre-X-eSport 4NJZ4 TENET Platform

**One-page reference for deployment day**

---

## 🚀 Deploy in 3 Steps

### Step 1: Database (5 min)
```bash
# Run migrations on Supabase
psql $DATABASE_URL -f packages/shared/axiom-esports-data/infrastructure/migrations/001_initial_schema.sql
# ... repeat for all migration files
```

### Step 2: API on Render (10 min)
1. Go to https://dashboard.render.com/blueprint
2. Connect GitHub repo
3. Add environment variables (see `.env.production.template`)
4. Deploy

**Verify:**
```bash
curl https://sator-api.onrender.com/health
# → {"status":"healthy"}
```

### Step 3: Frontend on Vercel (5 min)
1. Go to https://vercel.com/new
2. Import GitHub repo
3. Set root directory: `apps/website-v2`
4. Add environment variables
5. Deploy

**Verify:**
```bash
curl -I https://sator-platform.vercel.app
# → HTTP/2 200
```

---

## ✅ Post-Deploy Checklist

```bash
# Run validation script
./scripts/validate-deployment.sh

# Or manually check:
curl https://sator-api.onrender.com/health
curl https://sator-api.onrender.com/ready
curl https://sator-platform.vercel.app
```

---

## 🔧 Common Issues

### Cold Start (30s delay)
**Solution:** Keepalive pings every 10 min (already configured)

### Database Connection Failed
**Solution:** Check DATABASE_URL format in Render dashboard

### CORS Errors
**Solution:** Update CORS_ORIGINS with actual Vercel URL

### 500 Errors
**Solution:** Check Render logs: `render logs --service sator-api`

---

## 📊 Monitoring URLs

| Service | URL | Dashboard |
|---------|-----|-----------|
| API Health | https://sator-api.onrender.com/health | Render Dashboard |
| API Metrics | https://sator-api.onrender.com/metrics | Render Logs |
| Frontend | https://sator-platform.vercel.app | Vercel Dashboard |
| Database | - | Supabase Dashboard |

---

## 🆘 Emergency Rollback

```bash
# Revert last commit
git revert HEAD
git push origin main

# Or in dashboard:
# Render → sator-api → Manual Deploy → Previous Build
```

---

## 📞 Support

| Service | Status Page |
|---------|-------------|
| Render | status.render.com |
| Supabase | status.supabase.com |
| Vercel | status.vercel.com |
| Upstash | status.upstash.com |

---

## 💰 Cost Check

Expected: **$0/month**

If you see charges:
1. Check Render dashboard (should be "Free")
2. Check Supabase (should be "Free Tier")
3. Check Upstash (should be "Free")

---

**Deploy Time:** ~20 minutes  
**Validation Time:** ~30 minutes  
**Total:** ~1 hour
