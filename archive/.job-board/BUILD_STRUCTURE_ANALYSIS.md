[Ver001.000]

# Build Structure Analysis Report
**Date:** 2026-03-23  
**Project:** Libre-X-eSport 4NJZ4 TENET Platform  
**Scope:** READ-ONLY scouting pass on build output structure for Vercel deployment

---

## Executive Summary

**Status:** ⚠️ NO BUILD OUTPUT PRESENT

No build output directories currently exist in the repository. This is a pre-build analysis of the expected structure based on configuration files.

---

## 1. Build Output Locations Checked

### 1.1 `apps/website-v2/dist/` - NOT FOUND ❌
**Status:** Directory does not exist

**Expected Location:** `apps/website-v2/dist/` (per vite.config.ts `outDir: 'dist'`)

### 1.2 `dist/` at Root - NOT FOUND ❌
**Status:** Directory does not exist

**Expected Location:** `dist/` (per vercel.json `outputDirectory: "dist"`)

**⚠️ CRITICAL ISSUE IDENTIFIED:**
There is a **path mismatch** between:
- `vite.config.ts` sets `outDir: 'dist'` → creates `apps/website-v2/dist/`
- `vercel.json` sets `outputDirectory: "dist"` → expects `dist/` at root level

When Vercel runs the build from repository root, it will look for `./dist/` but Vite creates `./apps/website-v2/dist/`.

### 1.3 `.vercel/output/` - NOT FOUND ❌
**Status:** Directory does not exist

This directory is created by `vercel build` CLI command for local preview/deployment.

---

## 2. Configuration Analysis

### 2.1 Vite Configuration (`apps/website-v2/vite.config.ts`)

```javascript
export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/eSports-EXE/',  // ⚠️ Issue for Vercel
  build: {
    outDir: 'dist',      // Creates apps/website-v2/dist/
    sourcemap: true,
    chunkSizeWarningLimit: 600,
    minify: 'terser',
    // ... rollupOptions with manual chunks
  }
})
```

**Base Path Analysis:**
- Default: `/eSports-EXE/` (for GitHub Pages)
- Vercel Workflow Override: `/` (set via `VITE_BASE_PATH: "/"`)

**Output Structure (Expected):**
```
apps/website-v2/dist/
├── index.html              # Entry point
├── manifest.json           # PWA manifest
├── sw.js                   # Service worker
├── js/
│   ├── [name]-[hash].js    # Entry chunks
│   ├── vendor/
│   │   ├── react-core-[hash].js
│   │   ├── data-layer-[hash].js
│   │   ├── ui-animation-[hash].js
│   │   ├── gsap-vendor-[hash].js
│   │   ├── three-vendor-[hash].js
│   │   ├── ml-vendor-[hash].js
│   │   ├── onnx-vendor-[hash].js
│   │   ├── charts-vendor-[hash].js
│   │   └── utils-vendor-[hash].js
│   ├── hubs/
│   │   ├── hub-sator-[hash].js
│   │   ├── hub-rotas-[hash].js
│   │   ├── hub-arepo-[hash].js
│   │   ├── hub-opera-[hash].js
│   │   └── hub-tenet-[hash].js
│   ├── components/
│   │   └── ml-components-[hash].js
│   └── chunks/
│       └── [name]-[hash].js
├── css/
│   └── [name]-[hash].css
├── img/
│   └── [name]-[hash].[ext]
├── fonts/
│   └── [name]-[hash].[ext]
├── assets/
│   └── [name]-[hash].[ext]
└── bundle-stats.html       # Build analysis
```

### 2.2 Vercel Configuration (`vercel.json`)

```json
{
  "version": 2,
  "buildCommand": "npm install && npm run build",
  "outputDirectory": "dist",        // ⚠️ Expects root/dist, not apps/website-v2/dist
  "framework": "vite",
  "installCommand": "npm install",
  "routes": [
    { "handle": "filesystem" },
    { "src": "/(.*)", "dest": "/index.html" }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

---

## 3. HTML Entry Point Analysis (`apps/website-v2/index.html`)

### 3.1 Current Script References

```html
<!-- Development entry point -->
<script type="module" src="/src/main.jsx"></script>

<!-- Service Worker -->
<script>
  navigator.serviceWorker.register('/sw.js')
</script>

<!-- Manifest -->
<link rel="manifest" href="/manifest.json">
```

### 3.2 Expected Post-Build HTML Structure

After Vite build, the HTML should be transformed to:

```html
<!-- Transformed script reference -->
<script type="module" src="/js/main-[hash].js"></script>

<!-- Module preloads injected by Vite -->
<link rel="modulepreload" href="/js/vendor/react-core-[hash].js">
<link rel="modulepreload" href="/js/vendor/data-layer-[hash].js">
<!-- ... -->

<!-- CSS injected -->
<link rel="stylesheet" href="/css/main-[hash].css">
```

### 3.3 Path Reference Analysis

| Resource | Current Path | Expected Build Path | Type |
|----------|--------------|---------------------|------|
| Main Entry | `/src/main.jsx` | `/js/main-[hash].js` | Transformed |
| Service Worker | `/sw.js` | `/sw.js` | Copied (root) |
| Manifest | `/manifest.json` | `/manifest.json` | Copied (root) |
| Icons | `/icons/icon-*.svg` | `/icons/icon-*.svg` | Copied from public/ |

---

## 4. Issues Identified

### 🔴 Critical Issues

#### Issue 1: Output Directory Mismatch
**Problem:** Vercel expects `dist/` at root, but Vite creates `apps/website-v2/dist/`

**Impact:** Build will fail on Vercel with "No Output Directory found" error

**Solutions (in order of preference):**
1. **Option A (Recommended):** Add `workingDirectory` to vercel.json (not natively supported; use build script)
2. **Option B:** Add a post-build script to move `apps/website-v2/dist` to root `dist`
3. **Option C:** Change vercel.json `buildCommand` to:
   ```json
   "buildCommand": "cd apps/website-v2 && npm install && npm run build && cp -r dist ../../dist"
   ```

#### Issue 2: Base Path Configuration
**Problem:** Default base path is `/eSports-EXE/` for GitHub Pages

**Impact:** On Vercel, assets will be requested from `/eSports-EXE/` which doesn't exist

**Current Fix in Workflow:**
```yaml
env:
  VITE_BASE_PATH: "/"  # Override for Vercel
```

**Verification Needed:** Ensure this env var is properly passed to Vite build

### 🟡 Warnings

#### Warning 1: Icon Format Mismatch
**Problem:** `manifest.json` references PNG icons (`icon-192x192.png`) but only SVG files exist in `public/icons/`

**Files Missing:**
- `public/icons/icon-72x72.png`
- `public/icons/icon-96x96.png`
- ... (all PNG variants)

**Files Present:**
- `public/icons/icon-192x192.svg` ✓
- `public/icons/icon-512x512.svg` ✓

#### Warning 2: Screenshots Missing
**Problem:** `manifest.json` references screenshots that don't exist:
- `/screenshots/wide.png`
- `/screenshots/narrow.png`

### 🟢 Good Practices Observed

1. **Advanced Code Splitting:** Excellent manual chunking strategy for performance
2. **Long-term Caching:** Assets have content hashes and proper Cache-Control headers
3. **PWA Ready:** Service worker, manifest, and offline page configured
4. **Source Maps:** Enabled for debugging
5. **Terser Minification:** Console logs stripped in production

---

## 5. Comparison: Local Build vs Vercel Expectations

### Local Build (from `apps/website-v2/`)
```
cd apps/website-v2
npm run build
# Output: apps/website-v2/dist/
# Base URL: /eSports-EXE/ (unless VITE_BASE_PATH is set)
```

### Vercel Build (from root)
```
# Runs: npm install && npm run build
# Looks for: ./dist/
# Actually created: ./apps/website-v2/dist/
# Result: ❌ Deployment fails
```

### Expected Vercel Output Structure
```
dist/                          # Vercel expects this at root
├── index.html
├── manifest.json
├── sw.js
├── js/
│   ├── main-[hash].js
│   ├── vendor/
│   ├── hubs/
│   └── chunks/
├── css/
├── img/
├── icons/
└── fonts/
```

---

## 6. Recommendations

### Immediate Actions Required

1. **Fix Output Directory Mismatch:**
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build:vercel",
     "outputDirectory": "dist"
   }
   ```
   
   ```json
   // package.json (root)
   {
     "scripts": {
       "build:vercel": "cd apps/website-v2 && npm install && npm run build && cp -r dist ../../dist"
     }
   }
   ```

2. **Verify Environment Variable Passing:**
   Ensure `VITE_BASE_PATH` is set correctly in the workflow

3. **Add Missing Icons:**
   Either:
   - Generate PNG icons from SVGs
   - Update `manifest.json` to use SVG icons exclusively

### Nice to Have

1. Add build verification step to CI
2. Add `.vercel/output` to `.gitignore`
3. Document the build output structure in README

---

## 7. Appendix

### File Locations Summary

| File | Location | Purpose |
|------|----------|---------|
| vite.config.ts | `apps/website-v2/vite.config.ts` | Vite build configuration |
| vercel.json | `vercel.json` (root) | Vercel deployment config |
| index.html | `apps/website-v2/index.html` | HTML entry point |
| manifest.json | `apps/website-v2/public/manifest.json` | PWA manifest |
| sw.ts | `apps/website-v2/src/sw.ts` | Service worker source |

### Environment Variables

| Variable | Current Value | Set In |
|----------|---------------|--------|
| VITE_BASE_PATH | `/` (Vercel), `/eSports-EXE/` (default) | Workflow / vite.config.ts |
| VITE_API_URL | `https://sator-api.onrender.com` | vercel.json |
| VITE_WS_URL | `wss://sator-api.onrender.com/v1/ws` | vercel.json |

### Workflow Files

| File | Purpose |
|------|---------|
| `.github/workflows/vercel-deploy.yml` | Production Vercel deployment |
| `.github/workflows/static.yml` | GitHub Pages fallback deployment |

---

*Report generated for READ-ONLY analysis. No files were modified.*
