# [Ver001.000] - Vercel Deployment Setup Guide

## Summary of Changes

This document outlines the Vercel deployment fixes implemented for the 4NJZ4 TENET Platform.

---

## Files Modified/Created

### 1. `apps/website-v2/vite.config.js`
**Change:** Made base path configurable via environment variable
```javascript
base: process.env.VITE_BASE_PATH || '/eSports-EXE/',
```

### 2. `vercel.json` (Updated)
**Changes:**
- Added alias: `sator-platform.vercel.app`
- Enabled GitHub integration with autoAlias
- Added `VITE_BASE_PATH: "/"` to build.env
- Added catch-all rewrite for SPA routing
- Updated build environment variable references

### 3. `apps/website-v2/.env.vercel` (Created)
Template for Vercel environment variables with production values.

### 4. `.github/workflows/vercel-deploy.yml` (Created)
Automated deployment workflow that triggers on:
- Push to `main` branch (when website-v2, shared packages, or vercel.json change)
- Manual workflow dispatch (with environment selection)

### 5. `.github/workflows/static.yml` (Updated)
- Changed to manual trigger only (`workflow_dispatch`)
- Requires "deploy" confirmation input
- Marked as fallback (Vercel is primary)

### 6. `package.json` (Fixed)
- Resolved merge conflict in devDependencies
- Combined both sets of dependencies

---

## Required Vercel Setup

### 1. Install Vercel CLI (local)
```bash
npm install -g vercel
```

### 2. Link Project
```bash
vercel link
```

### 3. Set Environment Variables in Vercel Dashboard
Go to Project Settings > Environment Variables and add:

| Variable | Value | Environment |
|----------|-------|-------------|
| `VITE_BASE_PATH` | `/` | Production, Preview |
| `VITE_API_URL` | `https://sator-api.onrender.com/v1` | Production, Preview |
| `VITE_WS_URL` | `wss://sator-api.onrender.com/v1/ws` | Production, Preview |
| `VITE_APP_ENVIRONMENT` | `production` | Production |
| `VITE_APP_VERSION` | `2.1.0` | Production |

Or use CLI:
```bash
cd apps/website-v2
vercel env add VITE_BASE_PATH production
vercel env add VITE_API_URL production
vercel env add VITE_WS_URL production
```

### 4. Required GitHub Secrets
For automated deployment via GitHub Actions, add these secrets:

- `VERCEL_TOKEN` - Your Vercel API token
- `VERCEL_ORG_ID` - Your Vercel organization ID
- `VERCEL_PROJECT_ID` - Your Vercel project ID
- `VITE_API_URL` - API URL for build
- `VITE_WS_URL` - WebSocket URL for build

Get these values from:
```bash
vercel env ls
```

Or from `.vercel/project.json` after linking.

---

## Deployment Commands

### Local Deployment (Preview)
```bash
cd apps/website-v2
vercel
```

### Production Deployment
```bash
cd apps/website-v2
vercel --prod
```

### With explicit environment variables
```bash
cd apps/website-v2
VITE_BASE_PATH=/ VITE_API_URL=https://sator-api.onrender.com/v1 vercel --prod
```

---

## Verification Steps

1. **Build locally with Vercel settings:**
   ```bash
   cd apps/website-v2
   VITE_BASE_PATH=/ npm run build
   ```

2. **Check dist/index.html for correct paths:**
   - Should have `src="/assets/..."` (not `/eSports-EXE/assets/...`)
   - Should have `href="/manifest.json"` (not `/eSports-EXE/manifest.json`)

3. **Test routes after deployment:**
   - `/` - Home/central hub
   - `/sator` - SATOR Analytics hub
   - `/rotas` - ROTAS Simulation hub
   - `/arepo` - AREPO hub
   - `/opera` - OPERA hub
   - `/tenet` - TENET Central Hub

---

## Troubleshooting

### Issue: Routes return 404
**Solution:** Vercel rewrites are configured in `vercel.json`. If still failing, check:
- SPA fallback rewrite is working
- `vercel.json` is at project root (not in apps/website-v2)

### Issue: Assets not loading (404)
**Solution:** Check base path configuration:
```bash
# Should output paths starting with "/" not "/eSports-EXE/"
grep -o 'src="[^"]*"' dist/index.html
```

### Issue: API calls failing
**Solution:** Verify `VITE_API_URL` is set correctly in Vercel environment variables.

### Issue: WebSocket connection failing
**Solution:** 
- Ensure `VITE_WS_URL` uses `wss://` (secure) for production
- Check that API server accepts WebSocket connections

---

## Expected Deploy URL

After successful deployment, the site will be available at:
- **Production:** `https://sator-platform.vercel.app`
- **Preview:** `https://<branch-name>-<project>.vercel.app`

---

## Rollback

If needed, rollback to GitHub Pages:
1. Go to Actions tab
2. Run "Deploy to GitHub Pages (Manual)" workflow
3. Type "deploy" as confirmation

---

*Last updated: 2026-03-22*
*Agent: H1-EDIT (Phase 3-2 Implementation)*
