[Ver001.001]

# Vercel + Supabase + Cloudflare Project Reset Guide

**Date:** 2026-05-11  
**Repository:** `notbleaux/ZeSporteXte`

---

## Goal

Re-link deployment infrastructure after repository rename by creating/using **new** Vercel, Supabase, and Cloudflare projects and updating all project-level secrets.

---

## Vercel Environment Variables Required

Configure these in Vercel Dashboard → Project Settings → Environment Variables

### Required Variables

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_URL` | `https://njz-api.onrender.com/v1` | Production |
| `VITE_WS_URL` | `wss://njz-api.onrender.com/v1/ws` | Production |
| `VITE_SENTRY_DSN` | `https://xxx@sentry.io/yyy` | Production |
| `VITE_APP_VERSION` | `2.1.0` | Production |

### Getting Sentry DSN

1. Go to [sentry.io](https://sentry.io)
2. Navigate to your ZeSporteXte project
3. Settings → Client Keys (DSN)
4. Copy the DSN URL
5. Paste into Vercel environment variables

### Preview/Development Variables

For preview deployments, use staging values:

| Variable Name | Value | Environment |
|--------------|-------|-------------|
| `VITE_API_URL` | `https://njz-api-staging.onrender.com/v1` | Preview |
| `VITE_WS_URL` | `wss://njz-api-staging.onrender.com/v1/ws` | Preview |
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
vercel env pull apps/web/.env.local
```

---

## Reset Steps for New Projects

### 1) Vercel
1. Create/import a new project linked to `notbleaux/ZeSporteXte`.
2. Set Root Directory to `apps/web` if prompted.
3. Recreate env vars listed above.
4. Regenerate and store:
   - `VERCEL_PROJECT_ID`
   - `VERCEL_ORG_ID`
   - `VERCEL_TOKEN`
5. Update GitHub repository secrets with these new values.

### 2) Supabase
1. Create a new Supabase project for ZeSporteXte.
2. Re-run migrations.
3. Replace GitHub/Render secrets with new:
   - `DATABASE_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_ACCESS_TOKEN` (if used by CI)

### 3) Cloudflare
1. Create a new Pages project named `zesportexte`.
2. Issue/update:
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`
3. Confirm workflow `infrastructure/.github/workflows/cloudflare.yml` uses the new project name.

---

## Verification

After reset/redeploy, verify:

1. `https://zesportexte.vercel.app` returns HTTP 200
2. `https://njz-api.onrender.com/health` returns healthy
3. Cloudflare Pages latest deployment is successful
4. `Sentry.captureMessage('ZeSporteXte deploy test')` appears in Sentry (if enabled)

---

*Last Updated: 2026-05-11*
