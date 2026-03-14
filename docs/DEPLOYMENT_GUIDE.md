[Ver001.000]

# Deployment Guide — 4NJZ4 TENET Platform

**Version:** 2.1.0  
**Last Updated:** 2026-03-15

---

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Platform Setup](#platform-setup)
4. [Environment Configuration](#environment-configuration)
5. [Deployment Steps](#deployment-steps)
6. [Verification](#verification)
7. [Rollback Procedures](#rollback-procedures)

---

## Overview

This guide covers deploying the 4NJZ4 TENET Platform to production using the zero-cost stack:

| Component | Service | Purpose |
|-----------|---------|---------|
| Web Frontend | Vercel | React application hosting |
| API Backend | Render | FastAPI server hosting |
| Database | Supabase | PostgreSQL 15 |
| Cache | Upstash | Redis 7 |
| CI/CD | GitHub Actions | Automated testing & deployment |

---

## Prerequisites

### Accounts Required

1. **GitHub** — Source control and CI/CD
2. **Vercel** — Frontend hosting (https://vercel.com)
3. **Render** — API hosting (https://render.com)
4. **Supabase** — Database hosting (https://supabase.com)
5. **Upstash** — Redis hosting (https://upstash.com)
6. **Pandascore** — Esports data API (https://pandascore.co) — Optional

### Tools Required

```bash
# Install Vercel CLI
npm i -g vercel

# Install Render CLI (optional)
curl -fsSL https://raw.githubusercontent.com/render-oss/cli/main/bin/install.sh | bash
```

---

## Platform Setup

### 1. Database Setup (Supabase)

```bash
# 1. Create new project at https://supabase.com
# 2. Note the connection details

# 3. Run migrations
psql $DATABASE_URL -f packages/shared/axiom-esports-data/infrastructure/migrations/001_initial_schema.sql
psql $DATABASE_URL -f packages/shared/axiom-esports-data/infrastructure/migrations/002_sator_layers.sql
psql $DATABASE_URL -f packages/shared/axiom-esports-data/infrastructure/migrations/003_dual_storage.sql
psql $DATABASE_URL -f packages/shared/axiom-esports-data/infrastructure/migrations/004_extraction_log.sql
psql $DATABASE_URL -f packages/shared/axiom-esports-data/infrastructure/migrations/005_staging_system.sql
```

**Connection String Format:**
```
postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres
```

### 2. Cache Setup (Upstash)

```bash
# 1. Create Redis database at https://upstash.com
# 2. Select "Global" for edge caching
# 3. Note the REST API credentials

# Redis URL format
REDIS_URL=rediss://default:[password]@[host]:[port]
```

### 3. API Setup (Render)

**Option A: Using render.yaml (Recommended)**

The repository includes `infrastructure/render.yaml`:

```yaml
services:
  - type: web
    name: libre-x-esport-api
    runtime: python
    plan: free
    buildCommand: |
      cd packages/shared/axiom-esports-data/api
      pip install -r requirements.txt
    startCommand: |
      cd packages/shared/axiom-esports-data/api
      uvicorn main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: REDIS_URL
        sync: false
      - key: PANDASCORE_API_KEY
        sync: false
```

**Option B: Manual Setup**

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r packages/shared/axiom-esports-data/api/requirements.txt`
   - **Start Command:** `cd packages/shared/axiom-esports-data/api && uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Plan:** Free

### 4. Web Setup (Vercel)

```bash
# 1. Link project
vercel

# 2. Configure build settings
# Build Command: cd apps/website-v2 && npm run build
# Output Directory: apps/website-v2/dist
# Install Command: npm install

# 3. Deploy
vercel --prod
```

**Or via Vercel Dashboard:**

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** `apps/website-v2`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`

---

## Environment Configuration

### API Environment Variables (Render)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `DATABASE_URL` | Yes | Supabase connection | `postgresql://...` |
| `REDIS_URL` | Yes | Upstash connection | `rediss://...` |
| `PANDASCORE_API_KEY` | No* | Legal data source | `pc_live_...` |
| `APP_ENVIRONMENT` | Yes | Environment | `production` |
| `LOG_LEVEL` | No | Logging level | `INFO` |
| `CORS_ORIGINS` | Yes | Allowed origins | `https://...` |
| `JWT_SECRET` | Yes | JWT signing | `your-secret` |

\* Required for Pandascore integration

### Web Environment Variables (Vercel)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | API base URL | `https://api.libre-x-esport.com/v1` |
| `VITE_WS_URL` | Yes | WebSocket URL | `wss://api.libre-x-esport.com/v1/ws` |

### GitHub Secrets (CI/CD)

```bash
# Required for GitHub Actions
RENDER_API_KEY          # From Render dashboard
VERCEL_TOKEN            # From Vercel settings
VERCEL_ORG_ID           # From Vercel project
VERCEL_PROJECT_ID       # From Vercel project
SUPABASE_ACCESS_TOKEN   # From Supabase settings
```

---

## Deployment Steps

### 1. Pre-deployment Checklist

```bash
# Run all tests
npm run test:all

# Verify builds
npm run build
cd packages/shared/axiom-esports-data/api && python -m py_compile main.py

# Check linting
npm run lint
cd packages/shared && ruff check .

# Verify environment variables
cat .env.local | grep -E '^(DATABASE_URL|REDIS_URL|VITE_API_URL)='
```

### 2. Database Migration

```bash
# Backup first (if upgrading)
pg_dump $DATABASE_URL > backup_$(date +%Y%m%d).sql

# Run migrations
psql $DATABASE_URL -f infrastructure/migrations/006_performance_indexes.sql
```

### 3. Deploy API

```bash
# Option 1: Git push (auto-deploy)
git push origin main

# Option 2: Manual deploy
render deploy --service libre-x-esport-api
```

### 4. Deploy Web

```bash
# Deploy to production
vercel --prod

# Or via Git push (auto-deploy)
git push origin main
```

### 5. Verify Deployment

```bash
# Check API health
curl https://api.libre-x-esport.com/health

# Check API docs
curl https://api.libre-x-esport.com/docs

# Check web
curl -I https://libre-x-esport.com

# Run smoke tests
./scripts/smoke-tests.sh
```

---

## Verification

### Health Checks

```bash
# API Health
$ curl https://api.libre-x-esport.com/health
{
  "status": "healthy",
  "version": "2.1.0",
  "timestamp": "2026-03-15T10:00:00Z"
}

# API Readiness
$ curl https://api.libre-x-esport.com/ready
{
  "status": "ready",
  "checks": {
    "database": "connected",
    "redis": "connected",
    "pandascore": "available"
  }
}

# Web Check
$ curl -s https://libre-x-esport.com | grep -o "4NJZ4"
4NJZ4
```

### Smoke Tests

```bash
#!/bin/bash
# scripts/smoke-tests.sh

API_URL="https://api.libre-x-esport.com/v1"
WEB_URL="https://libre-x-esport.com"

# Test API endpoints
echo "Testing API..."
curl -sf "$API_URL/health" || exit 1
curl -sf "$API_URL/players/?limit=1" || exit 1
curl -sf "$API_URL/search/?q=test&limit=1" || exit 1

# Test Web
echo "Testing Web..."
curl -sf "$WEB_URL" || exit 1
curl -sf "$WEB_URL/sator" || exit 1

echo "All smoke tests passed!"
```

---

## Rollback Procedures

### API Rollback

```bash
# Option 1: Redeploy previous version (Render)
render deploy --service libre-x-esport-api --commit <previous-commit>

# Option 2: Manual rollback
git checkout v2.0.x
git push origin main --force
```

### Web Rollback

```bash
# Vercel rollback
vercel --version v2.0.x

# Or via dashboard:
# 1. Go to https://vercel.com/dashboard
# 2. Select project
# 3. Deployments → Find previous version
# 4. Click "..." → "Promote to Production"
```

### Database Rollback

```bash
# Restore from backup
psql $DATABASE_URL < backup_20260315.sql

# Or rollback specific migration
psql $DATABASE_URL -c "DROP TABLE IF EXISTS new_table CASCADE;"
```

---

## Troubleshooting

### API Cold Start Issues

**Problem:** API takes 10-30 seconds to respond after inactivity

**Solution:**
```bash
# Set up keepalive ping
# Add to .github/workflows/keepalive.yml

name: Keepalive
on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - run: curl -s https://api.libre-x-esport.com/health
```

### Database Connection Issues

**Problem:** `Connection refused` or timeout errors

**Solution:**
```bash
# 1. Check connection string format
# Should use port 6543 (connection pooler)
postgresql://...:6543/postgres

# 2. Verify SSL mode
?sslmode=require

# 3. Check Supabase status
# https://status.supabase.com
```

### CORS Errors

**Problem:** `Access-Control-Allow-Origin` errors in browser

**Solution:**
```python
# Update CORS origins in config.py
CORS_ORIGINS = [
    "https://libre-x-esport.com",
    "https://www.libre-x-esport.com",
    # Add any additional origins
]
```

---

## Security Checklist

- [ ] All environment variables set
- [ ] JWT_SECRET is strong (32+ random characters)
- [ ] CORS origins restricted to production domains
- [ ] Database using connection pooler (port 6543)
- [ ] Redis using TLS (rediss://)
- [ ] API rate limiting enabled
- [ ] Firewall tests passing (`npm run test:firewall`)
- [ ] No secrets in repository
- [ ] Security headers configured (Vercel)

---

## Support

For deployment issues:

- **Vercel:** https://vercel.com/support
- **Render:** https://render.com/docs
- **Supabase:** https://supabase.com/docs
- **Platform Issues:** https://github.com/notbleaux/eSports-EXE/issues

---

*End of Deployment Guide*
