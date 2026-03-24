# Vercel Deployment Trigger Guide

[Ver001.000]

**Date**: 2026-03-24  
**Status**: ✅ FIXES COMMITTED - READY FOR REDEPLOYMENT  
**Commit**: `d91069f2`

---

## 🔧 What Was Fixed

### Root Cause
The SPA rewrite rule in `vercel.json` was catching JavaScript files because:
```json
"has": [{ "type": "header", "key": "Accept", "value": "text/html" }]
```
Browsers send `Accept: text/html,...` for ALL requests, including JS modules.

### Solution Applied
1. **Explicit static asset rewrites** before SPA catch-all
2. **Proper MIME type headers** for JS, WASM, CSS files
3. **Fixed base path** configuration for Vercel
4. **Generated missing PWA assets** (PNG icons, screenshots)

---

## 🚀 Deployment Options

### Option 1: Git Push (Recommended)
The fixes are committed to `main` branch. Simply push:

```bash
git push origin main
```

This will trigger automatic Vercel deployment via GitHub integration.

**URL**: https://website-v2-f0yr9iqh8-notbleauxs-projects.vercel.app

---

### Option 2: Vercel CLI (Manual)

**Prerequisites**:
- Vercel CLI installed: `npm i -g vercel`
- Token ready: (use your Vercel token)

**Steps**:

1. **Login with token**:
```bash
vercel login
# Or use token directly
```

2. **Deploy from project root**:
```bash
cd c:\Users\jacke\Documents\GitHub\eSports-EXE
vercel --prod --token=YOUR_VERCEL_TOKEN_HERE
```

3. **Link to existing project** (if needed):
```bash
vercel link --project=website-v2
```

---

### Option 3: Vercel Dashboard (Web UI)

1. Go to https://vercel.com/notbleaux/njzitegeiste
2. Click "Redeploy" on the latest commit
3. Or click "Deploy" and select the `main` branch

---

## ✅ Post-Deployment Verification

After deployment, verify these work correctly:

### 1. Check JavaScript Loads
Open browser console and verify:
- No "Failed to load module script" errors
- No MIME type warnings
- Site renders correctly

### 2. Test These URLs
```
https://website-v2-f0yr9iqh8-notbleauxs-projects.vercel.app/
https://website-v2-f0yr9iqh8-notbleauxs-projects.vercel.app/sator
https://website-v2-f0yr9iqh8-notbleauxs-projects.vercel.app/rotas
```

### 3. Check Network Tab
- JS files load with `Content-Type: application/javascript`
- Status 200 (not 404 or 401)
- No redirects to index.html for .js files

### 4. PWA Check
- Manifest loads correctly
- Icons display
- Can "Install" as PWA

---

## 📋 Summary of Changes (Commit d91069f2)

| File | Change |
|------|--------|
| `vercel.json` | Fixed SPA routing, added MIME headers, added cache headers |
| `vite.config.js` | Added base path detection, server headers |
| `index.html` | Added `<base href="/">`, fixed script path |
| `manifest.json` | Added display_override |
| `public/icons/` | Added 8 PNG icons for PWA |
| `public/screenshots/` | Added 2 PWA screenshots |

---

## 🔍 If Issues Persist

### Check Build Logs
In Vercel dashboard, check the build output:
1. Go to Deployments
2. Click latest deployment
3. View Build Logs
4. Look for errors

### Common Post-Fix Issues

**Issue**: Still getting MIME errors
**Solution**: Clear browser cache and hard reload (Ctrl+F5)

**Issue**: 404 on assets
**Solution**: Verify `vercel.json` outputDirectory matches build output

**Issue**: Blank page
**Solution**: Check browser console for remaining JS errors

---

## 📞 Team Configuration

| Setting | Value |
|---------|-------|
| Team | notbleaux |
| Project | njzitegeiste |
| Framework | Vite |
| Build Command | `cd apps/website-v2 && npm run build` |
| Output Directory | `apps/website-v2/dist` |
| Install Command | `npm install` |

---

## 🎯 Expected Result

After successful deployment:
- ✅ Website loads without MIME errors
- ✅ All 14 mascots display correctly
- ✅ Style toggle works
- ✅ PWA installable
- ✅ All hubs (/sator, /rotas, etc.) work

---

*Guide Version: 001.000*  
*Status: Ready for deployment*  
*Commit: d91069f2*
