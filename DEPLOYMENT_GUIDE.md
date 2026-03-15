[Ver001.000]

# SATOR Platform Deployment Guide

## Overview

This guide covers deploying the SATOR Esports Platform to Render (backend) and Vercel (frontend).

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Vercel (Frontend)                       │
│              React 18 + Vite + TypeScript                    │
│                     TacticalView Component                   │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTPS
                       ▼
┌─────────────────────────────────────────────────────────────┐
│                     Render (Backend)                         │
│              FastAPI + asyncpg + TimescaleDB                 │
│                   Lazy Lifespan Init                         │
└──────────────────────┬──────────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌──────────────────┐      ┌──────────────────┐
│   PostgreSQL     │      │      Redis       │
│   (Primary DB)   │      │   (Cache/Rate)   │
└──────────────────┘      └──────────────────┘
```

## Backend Deployment (Render)

### 1. Create PostgreSQL Database

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "PostgreSQL"
3. Configure:
   - Name: `sator-db`
   - Plan: Free (or Starter for production)
   - Database: `sator_production`
   - User: `sator_api`

### 2. Create Redis Instance

1. Click "New" → "Redis"
2. Configure:
   - Name: `sator-redis`
   - Plan: Free

### 3. Deploy FastAPI Service

1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Configure:
   - Name: `sator-api`
   - Environment: `Python`
   - Build Command:
     ```bash
     pip install -r packages/shared/axiom-esports-data/api/requirements.txt
     ```
   - Start Command:
     ```bash
     cd packages/shared/axiom_esports_data/api && uvicorn main:app --host 0.0.0.0 --port $PORT --workers 1
     ```

### 4. Environment Variables

Set these in Render Dashboard → Environment:

| Variable | Value | Source |
|----------|-------|--------|
| `DATABASE_URL` | Auto-filled | From PostgreSQL service |
| `REDIS_URL` | Auto-filled | From Redis service |
| `APP_ENVIRONMENT` | `production` | Manual |
| `JWT_SECRET_KEY` | Generate | Render can generate |
| `PANDASCORE_API_KEY` | Your key | Manual (get from pandascore.co) |
| `CORS_ORIGINS` | Vercel URLs | Manual |

### 5. Verify Deployment

```bash
# Health check
curl https://sator-api.onrender.com/health

# Expected response:
{
  "status": "healthy",
  "service": "sator-api",
  "version": "2.1.0",
  "database": "not_initialized"  # Lazy init - connects on first request
}

# Ready check (triggers DB connection)
curl https://sator-api.onrender.com/ready

# Expected response:
{
  "ready": true
}
```

## Frontend Deployment (Vercel)

### 1. Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com)
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure:
   - Framework Preset: `Vite`
   - Root Directory: `apps/website-v2`

### 2. Environment Variables

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://sator-api.onrender.com` |
| `VITE_WS_URL` | `wss://sator-api.onrender.com/v1/ws` |
| `VITE_APP_ENV` | `production` |

### 3. Deploy

Vercel will auto-deploy on every push to main branch.

## Verification Checklist

### Backend

- [ ] `/health` returns 200 with service info
- [ ] `/ready` returns 200 (DB connected)
- [ ] `/v1/players` returns player data
- [ ] Rate limiting active (5 req/min for auth)
- [ ] CORS configured for Vercel domain

### Frontend

- [ ] Loads without console errors
- [ ] API requests succeed
- [ ] TacticalView renders mock data
- [ ] WebSocket connects (wss://)

## Troubleshooting

### Cold Starts (Free Tier)

Render free tier has 15-minute idle timeout. First request after idle will be slow (10-30s).

**Solution**: Use keepalive ping
```bash
# Add to GitHub Actions or external cron
curl -s https://sator-api.onrender.com/health > /dev/null
```

### Database Connection Failed

Check:
1. DATABASE_URL is set correctly
2. PostgreSQL service is running
3. DB initialized with migrations

```bash
# Run migrations
psql $DATABASE_URL -f packages/shared/axiom-esports-data/migrations/001_initial_schema.sql
```

### CORS Errors

Add your Vercel domain to `CORS_ORIGINS`:
```
https://your-project.vercel.app,https://sator-api.onrender.com
```

### WebSocket Connection Failed

Ensure:
1. Using `wss://` (secure) not `ws://`
2. Path is `/v1/ws`
3. Render service is awake

## Security Considerations

1. **JWT Secret**: Use Render's generated value, don't commit to git
2. **API Keys**: Set via dashboard, not in code
3. **CORS**: Restrict to your domains only
4. **Rate Limiting**: Enabled by default (SlowAPI)

## Monitoring

### Render Logs
```bash
# View logs in dashboard or CLI
render logs --service sator-api
```

### Health Monitoring
```bash
# Setup uptime check
curl -fsS -o /dev/null https://sator-api.onrender.com/health || echo "DOWN"
```

## Scaling

| Tier | Use Case | Cost |
|------|----------|------|
| Free | Development, demos | $0 |
| Starter | Production hobby | $7/mo |
| Standard | Production apps | $25/mo+ |

## Support

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- SATOR Issues: https://github.com/notbleaux/eSports-EXE/issues
