[Ver002.000]

# Task 1: Deployment Documentation (Final)
## Production Deployment Guide with Fixes Applied

**Date:** March 8, 2026  
**Version:** 2.0 (Post-Restructure)  
**Status:** READY FOR DEPLOYMENT

---

## 🚨 PRE-DEPLOYMENT: Issues Fixed

Based on Task 4 analysis, the following issues were identified and **FIXED**:

### ✅ Fixed Issues

| Issue | Status | Fix Applied |
|-------|--------|-------------|
| Workflows in wrong location | ✅ FIXED | Moved to `.github/workflows/` |
| Missing requirements.txt | ✅ FIXED | Created `packages/shared/requirements.txt` |
| Render.yaml outdated paths | ✅ FIXED | Updated to `packages/shared/` |
| PYTHONPATH not set | ✅ FIXED | Added to render.yaml env vars |
| Build filters missing | ✅ FIXED | Added path filters to reduce builds |

---

## 🎯 Deployment Targets

| Platform | URL | Purpose | Status |
|----------|-----|---------|--------|
| **Vercel** | `https://satorx.vercel.app` | Primary website (NJZ Platform) | Ready ✅ |
| **GitHub Pages** | `https://notbleaux.github.io/eSports-EXE` | Archive website | Ready ✅ |
| **Render** | `https://sator-api.onrender.com` | API backend | Ready ✅ |

---

## 📋 Pre-Deployment Checklist

### 1. Environment Variables Setup

Set these in **Render Dashboard** BEFORE first deploy:

```bash
# Required
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://user:pass@host:6379

# Optional but Recommended
PANDASCORE_API_KEY=your_pandascore_api_key
SATOR_API_KEY=your_internal_api_key
LOG_LEVEL=INFO
```

**How to Set:**
1. Go to https://dashboard.render.com/
2. Select your service
3. Click "Environment" tab
4. Add each variable

### 2. Database Setup

```sql
-- Run migrations on your Supabase database
-- Files in: packages/shared/axiom-esports-data/infrastructure/migrations/

-- Example (run in Supabase SQL editor):
-- 001_initial_schema.sql
-- 002_sator_layers.sql
-- ... etc
```

### 3. Verify Build Locally

```bash
# Test website build
cd apps/website-v2
npm install
npm run build

# Should output: dist/ folder with no errors
```

### 4. Test API Locally (Optional)

```bash
# Install dependencies
cd packages/shared
pip install -r requirements.txt

# Run API locally
uvicorn api.main:app --reload --port 8000

# Test health endpoint
curl http://localhost:8000/health
```

---

## 🚀 Deployment Steps

### Step 1: Push Fixes to GitHub

```bash
# Commit the fixes
git add -A
git commit -m "fix(deploy): Apply deployment fixes

- Move workflows to .github/workflows/
- Create packages/shared/requirements.txt
- Update render.yaml with correct paths
- Add PYTHONPATH and build filters

Fixes issues from Task 4 analysis"

# Push
git push origin main
```

### Step 2: Deploy API to Render

**Option A: Blueprint (Recommended)**
1. Go to https://dashboard.render.com/blueprints
2. Click "New Blueprint Instance"
3. Connect `notbleaux/eSports-EXE`
4. Render reads `infrastructure/render.yaml`
5. Click "Apply"

**Option B: Manual**
1. Go to https://dashboard.render.com/
2. Click "New +" → "Web Service"
3. Connect repository
4. Settings:
   - Name: `sator-api`
   - Runtime: Python 3
   - Build Command: `cd packages/shared && pip install -r requirements.txt`
   - Start Command: `cd packages/shared/api && uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables
6. Click "Create Web Service"

### Step 3: Deploy Website to Vercel

1. Go to https://vercel.com/new
2. Import `notbleaux/eSports-EXE`
3. Configure:
   - Framework Preset: **Vite**
   - Root Directory: `apps/website-v2`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. Add Environment Variable:
   - Name: `VITE_API_URL`
   - Value: `https://sator-api.onrender.com` (from Step 2)
5. Click "Deploy"

**Expected Output:**
- Build completes in ~30 seconds
- URL: `https://satorx.vercel.app` (or similar)

### Step 4: Enable GitHub Pages (Archive)

1. Go to https://github.com/notbleaux/eSports-EXE/settings/pages
2. Source: **Deploy from a branch**
3. Branch: `main` → `/docs`
4. Click **Save**

**Expected Output:**
- URL: `https://notbleaux.github.io/eSports-EXE`
- Shows archive website

---

## ✅ Post-Deployment Verification

### Check Each Service

```bash
# 1. API Health Check
curl https://sator-api.onrender.com/health
# Expected: {"status":"healthy"}

# 2. Website Load
curl -I https://satorx.vercel.app
# Expected: HTTP/2 200

# 3. GitHub Pages
curl -I https://notbleaux.github.io/eSports-EXE
# Expected: HTTP/2 200
```

### Verify Features

- [ ] Website loads without errors
- [ ] All 4 hubs accessible (SATOR, ROTAS, Info, Games)
- [ ] API responds to requests
- [ ] GitHub Actions workflows run (check Actions tab)
- [ ] Security scanning active

---

## 🔧 Troubleshooting

### Issue: "Module not found" in Render

**Cause:** PYTHONPATH not set correctly

**Fix:** Already applied in render.yaml. If still failing:
```yaml
# Add to render.yaml envVars
- key: PYTHONPATH
  value: "/opt/render/project/src/packages/shared:/opt/render/project/src"
```

### Issue: "Database connection failed"

**Cause:** DATABASE_URL not set or incorrect format

**Fix:**
1. Verify format: `postgresql://user:password@host:5432/database`
2. Check Supabase dashboard for correct URL
3. Ensure IP allowlist includes Render IPs

### Issue: "Build failed" on Vercel

**Cause:** Missing dependencies or wrong root directory

**Fix:**
1. Check Root Directory is `apps/website-v2`
2. Verify `package.json` has build script
3. Check Vercel build logs for specific error

### Issue: "Workflows not running"

**Cause:** Workflows not in correct location

**Fix:** Already applied. Verify:
```bash
ls .github/workflows/
# Should show: ci.yml, security.yml, deploy.yml, etc.
```

---

## 📊 Monitoring & Maintenance

### Health Checks

| Endpoint | URL | Expected |
|----------|-----|----------|
| API Health | `/health` | `{"status":"healthy"}` |
| API Ready | `/ready` | `{"status":"ready"}` |
| API Live | `/live` | `{"status":"alive"}` |

### Logs

| Platform | Where to Check |
|----------|----------------|
| Render | Dashboard → Logs tab |
| Vercel | Dashboard → Deployments → Logs |
| GitHub | Actions tab |

### Alerts

Set up alerts for:
- API 500 errors > 5%
- Response time > 500ms
- Database connection failures
- Disk usage > 80%

---

## 🔄 Rollback Procedure

If deployment fails:

```bash
# 1. Revert to last known good commit
git log --oneline -10  # Find good commit
git revert [COMMIT_HASH]
git push origin main

# 2. For Render: Manual deploy previous version
# Dashboard → Manual Deploy → Deploy previous commit

# 3. For Vercel: Rollback in dashboard
# Deployments → [Previous] → Promote to Production
```

---

## 📞 Support Resources

| Resource | Link |
|----------|------|
| Troubleshooting Guide | `TROUBLESHOOTING.md` |
| GitHub Desktop Guide | `docs/guides/GITHUB_DESKTOP_USER_GUIDE.md` |
| AI Collaboration | `docs/guides/AI_COLLABORATION.md` |
| Secret Management | `docs/guides/SECRET_MANAGEMENT.md` |

---

## ✅ DEPLOYMENT READY

**All fixes applied:**
- ✅ Workflows in correct location
- ✅ Dependencies defined
- ✅ Paths corrected
- ✅ Environment variables documented
- ✅ Troubleshooting guide included

**Status:** 🟢 **READY FOR PRODUCTION**

---

*Deployment documentation complete. Proceed with confidence.*