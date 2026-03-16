[Ver001.000]

# Vercel Environment Setup Guide

**Date:** 2026-03-16  
**Project:** Libre-X-eSport 4NJZ4 TENET Platform

---

## Environment Variables Required

Configure these in Vercel Dashboard → Project Settings → Environment Variables

### Required Variables

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_URL` | `https://api.libre-x-esport.com/v1` | Production |
| `VITE_WS_URL` | `wss://api.libre-x-esport.com/v1/ws` | Production |
| `VITE_SENTRY_DSN` | `https://xxx@sentry.io/yyy` | Production |
| `VITE_APP_VERSION` | `2.1.0` | Production |

### Getting Sentry DSN

1. Go to [sentry.io](https://sentry.io)
2. Navigate to Projects → 4njz4-tenet-platform
3. Settings → Client Keys (DSN)
4. Copy the DSN URL
5. Paste into Vercel environment variables

### Preview/Development Variables

For preview deployments, use staging values:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_URL` | `https://api-staging.libre-x-esport.com/v1` | Preview |
| `VITE_WS_URL` | `wss://api-staging.libre-x-esport.com/v1/ws` | Preview |
| `VITE_SENTRY_DSN` | Same as production | Preview |

---

## CLI Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy with environment variables
vercel --prod

# Or pull environment variables from Vercel
vercel env pull apps/website-v2/.env.local
```

---

## Verification

After deployment, verify Sentry is working:

1. Open production site
2. Open browser console
3. Type: `Sentry.captureMessage('Test from Vercel')`
4. Check Sentry dashboard for the test message

---

*Last Updated: 2026-03-16*
