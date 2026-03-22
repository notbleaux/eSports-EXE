---
name: sator-deployment
description: "Free-tier deployment for 4NJZ4 TENET Platform on Render, Vercel, GitHub Pages, Supabase. USE FOR: Render FastAPI deploy, Vercel React deploy, GitHub Actions CI/CD, Supabase database, cold start mitigation. DO NOT USE FOR: enterprise deployment, paid tier optimization, non-SATOR projects."
license: MIT
metadata:
  author: SATOR Team
  version: "2.1.0"
---

# SATOR Deployment

> **ZERO-COST STACK**
>
> Supabase (DB): 500MB, 2M reads
> Render (API): 512MB, 750hrs, cold start
> Vercel (Web): 100GB bandwidth
> GitHub Pages: Static site
> Total: $0/month

## Triggers

Activate this skill when user wants to:
- Deploy FastAPI to Render
- Deploy React to Vercel
- Set up GitHub Actions CI/CD
- Configure Supabase database
- Implement cold start mitigation
- Set up health check monitoring
- Configure environment variables

## Rules

1. **Free Tier First** — Optimize for zero cost
2. **Cold Start Mitigation** — Ping /health every 10-14 min
3. **Connection Pooling** — min=1, max=5 for Supabase
4. **Health Checks** — Required: /health, /ready, /live
5. **Environment Security** — Never commit .env files
6. **Sequential Deploy** — DB → API → Web

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| Free-tier deployment | Enterprise/paid deployment |
| Render FastAPI hosting | AWS/Azure/GCP hosting |
| Vercel React hosting | Self-hosted solutions |
| GitHub Actions CI/CD | Jenkins, GitLab CI |
| Supabase PostgreSQL | RDS, Cloud SQL |
| Cold start mitigation | Always-on requirements |

## Zero-Cost Stack

| Component | Service | Free Tier | Cost |
|-----------|---------|-----------|------|
| Database | Supabase | 500MB, 2M reads | $0 |
| API | Render | 512MB, 750hrs | $0 |
| Web | Vercel | 100GB bandwidth | $0 |
| Static | GitHub Pages | 1GB, 100GB | $0 |
| CI/CD | GitHub Actions | 2000 mins | $0 |

## Project Structure

```
/
├── infrastructure/
│   └── render.yaml             # Render Blueprint
├── vercel.json                 # Vercel config (root)
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI pipeline
│       ├── deploy-api.yml      # API deployment
│       ├── deploy-web.yml      # Web deployment
│       └── keepalive.yml       # Cold start mitigation
├── packages/shared/
│   ├── api/
│   │   ├── Dockerfile
│   │   └── requirements.txt
│   └── axiom-esports-data/
│       └── infrastructure/
│           └── migrations/
└── apps/website-v2/
    └── vercel.json             # Vercel config (app)
```

## Render Configuration (render.yaml)

```yaml
# infrastructure/render.yaml
services:
  - type: web
    name: sator-api
    runtime: docker
    plan: free
    dockerfilePath: ./packages/shared/api/Dockerfile
    envVars:
      - key: DATABASE_URL
        sync: false  # Set in dashboard
      - key: API_PORT
        value: 8000
      - key: APP_ENVIRONMENT
        value: production
      - key: LOG_LEVEL
        value: INFO
      - key: CORS_ORIGINS
        value: "https://sator-web.vercel.app,https://satorx.github.io"
    healthCheckPath: /health
    autoDeploy: true

  # Optional: Pipeline worker
  - type: worker
    name: sator-pipeline
    runtime: python
    plan: free
    buildCommand: "pip install -r requirements.txt"
    startCommand: "python -m axiom-esports-data.pipeline.orchestrator"
    envVars:
      - key: DATABASE_URL
        sync: false
```

## Vercel Configuration

```json
// vercel.json (root)
{
  "version": 2,
  "builds": [
    {
      "src": "apps/website-v2/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ],
  "env": {
    "VITE_API_URL": "https://sator-api.onrender.com/v1"
  }
}
```

```json
// apps/website-v2/vercel.json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

## Dockerfile

```dockerfile
# packages/shared/api/Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application
COPY . .

# Expose port
EXPOSE 8000

# Run with single worker (free tier)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
```

## GitHub Actions Workflows

### API Deployment

```yaml
# .github/workflows/deploy-api.yml
name: Deploy API to Render

on:
  push:
    branches: [main]
    paths:
      - 'packages/shared/api/**'
      - 'packages/shared/axiom-esports-data/pipeline/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd packages/shared
          pip install -r requirements.txt
          pip install pytest pytest-asyncio
      
      - name: Run tests
        run: |
          cd packages/shared
          pytest tests/ -v

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Render
        uses: johnbeynon/render-deploy-action@v0.0.8
        with:
          service-id: ${{ secrets.RENDER_SERVICE_ID }}
          api-key: ${{ secrets.RENDER_API_KEY }}
```

### Web Deployment

```yaml
# .github/workflows/deploy-web.yml
name: Deploy Web to Vercel

on:
  push:
    branches: [main]
    paths:
      - 'apps/website-v2/**'
      - 'packages/shared/packages/**'

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Set up Node
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd apps/website-v2
          npm install
      
      - name: Type check
        run: |
          cd apps/website-v2
          npm run typecheck
      
      - name: Build
        run: |
          cd apps/website-v2
          npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: vercel/action-deploy@v1
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
```

### Cold Start Mitigation

```yaml
# .github/workflows/keepalive.yml
name: API Keepalive

on:
  schedule:
    - cron: '*/10 * * * *'  # Every 10 minutes
  workflow_dispatch:

jobs:
  ping:
    runs-on: ubuntu-latest
    steps:
      - name: Ping API Health Endpoint
        run: |
          curl -s -o /dev/null -w "%{http_code}" \
            https://sator-api.onrender.com/health
      
      - name: Ping Ready Endpoint
        run: |
          curl -s -o /dev/null -w "%{http_code}" \
            https://sator-api.onrender.com/ready
```

## Supabase Setup

```sql
-- Enable TimescaleDB
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Create hypertables
SELECT create_hypertable('player_performance', 'time', 
    chunk_time_interval => INTERVAL '90 days',
    if_not_exists => TRUE
);

-- Set up connection pooling
ALTER SYSTEM SET max_connections = 30;
```

### Environment Variables

```bash
# .env.production (NEVER COMMIT)
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
SUPABASE_URL=https://[PROJECT_REF].supabase.co
SUPABASE_ANON_KEY=[ANON_KEY]
```

## Deployment Sequence

```bash
# Phase 1: Database
# 1. Create Supabase project
# 2. Run migrations in SQL Editor
# 3. Get connection string

# Phase 2: API
# 1. Push render.yaml to repo
# 2. Create Blueprint in Render Dashboard
# 3. Set environment variables
# 4. Deploy

# Phase 3: Web
# 1. Connect repo to Vercel
# 2. Set environment variables
# 3. Deploy

# Phase 4: Keepalive
# 1. Copy keepalive.yml to .github/workflows
# 2. Verify cron is running
```

## Health Check Endpoints

```python
# FastAPI health endpoints
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
    }

@app.get("/ready")
async def readiness():
    # Check database connection
    try:
        pool = await DatabasePool.get_pool()
        async with pool.acquire() as conn:
            await conn.fetchval("SELECT 1")
        return {"ready": True}
    except Exception:
        return {"ready": False}

@app.get("/live")
async def liveness():
    return {"status": "alive"}
```

## Upgrade Path

| When | Upgrade To | Cost |
|------|-----------|------|
| >400MB storage | Supabase Pro | $25/mo |
| Cold start issues | Render Starter | $7/mo |
| >100GB bandwidth | Vercel Pro | $20/mo |

## Troubleshooting

### Cold Start Too Slow

```bash
# Check keepalive is running
github.com → Actions → keepalive

# Optimize Docker image size
# Use python:3.11-slim, not python:3.11
```

### Database Connection Limits

```bash
# Check connection count
SELECT count(*) FROM pg_stat_activity;

# Use connection pooling
# PgBouncer enabled by default on Supabase
```

### Build Failures

```bash
# Check Render logs
render.com → Dashboard → Service → Logs

# Check Vercel logs
vercel.com → Dashboard → Project → Deployments
```

## New in 2.1.0

- Cold start mitigation with keepalive workflow
- Enhanced health check patterns
- GitHub Actions deployment automation
- Zero-cost stack optimization

## References

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [memory/CURRENT_FOCUS.md](../../../memory/CURRENT_FOCUS.md)
