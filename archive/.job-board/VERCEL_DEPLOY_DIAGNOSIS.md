[Ver001.000]

# Vercel Deployment MIME Type Issue - Diagnosis Report

**Date**: 2026-03-23  
**Status**: READ-ONLY SCOUTING PASS - NO CHANGES MADE  
**Issue**: JavaScript files returning MIME type "text/html" instead of "application/javascript"

---

## 1. Current Configuration Files

### 1.1 vercel.json (Root Level)

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "version": 2,
  "name": "libre-x-4njz4-tenet-platform",
  "alias": ["sator-platform.vercel.app"],
  "github": {
    "enabled": true,
    "autoAlias": true
  },
  "buildCommand": "cd apps/website-v2 && npm run build",
  "outputDirectory": "apps/website-v2/dist",
  "installCommand": "npm install",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/sator/:path*",
      "destination": "/index.html"
    },
    {
      "source": "/rotas/:path*",
      "destination": "/index.html"
    },
    {
      "source": "/arepo/:path*",
      "destination": "/index.html"
    },
    {
      "source": "/opera/:path*",
      "destination": "/index.html"
    },
    {
      "source": "/tenet/:path*",
      "destination": "/index.html"
    },
    {
      "source": "/:path*",
      "has": [{ "type": "header", "key": "Accept", "value": "text/html" }],
      "destination": "/index.html"
    }
  ],
  "redirects": [
    {
      "source": "/home",
      "destination": "/",
      "permanent": true
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    }
  ],
  "env": {
    "VITE_APP_ENVIRONMENT": "production",
    "VITE_APP_VERSION": "2.1.0"
  },
  "build": {
    "env": {
      "VITE_BASE_PATH": "/",
      "VITE_API_URL": "@api_url",
      "VITE_WS_URL": "@ws_url",
      "VITE_SENTRY_DSN": "@sentry_dsn"
    }
  }
}
```

### 1.2 vite.config.js (apps/website-v2/)

**Key Build Settings:**
- `base`: `process.env.VITE_BASE_PATH || '/eSports-EXE/'` (defaults to `/eSports-EXE/` if env not set)
- `outDir`: `'dist'`
- `target`: `'es2020'`
- Module preload polyfill: **enabled**
- Output file naming:
  - Entry: `js/[name]-[hash].js`
  - Chunks: `js/vendor/[name]-[hash].js`, `js/hubs/[name]-[hash].js`, etc.

### 1.3 package.json (apps/website-v2/)

```json
{
  "name": "libre-x-4njz4-tenet-platform",
  "version": "2.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

### 1.4 index.html

- Entry point: `<script type="module" src="/src/main.jsx"></script>`
- Service worker: `/sw.js`
- Manifest: `/manifest.json`

---

## 2. Identified Issues (Ranked by Severity)

### 🔴 CRITICAL: SPA Rewrite Rule Catching JS Files

**Issue**: The catch-all SPA rewrite rule:
```json
{
  "source": "/:path*",
  "has": [{ "type": "header", "key": "Accept", "value": "text/html" }],
  "destination": "/index.html"
}
```

**Problem**: Browsers send complex Accept headers for JavaScript module requests that include `text/html`. For example:
```
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8
```

The Vercel rewrite `has` condition checks if the header **contains** the value, not exact match. This means JS files with typical browser Accept headers will incorrectly match and be rewritten to `index.html`, causing the MIME type mismatch.

**Impact**: All JavaScript files may be served as `text/html`

---

### 🔴 CRITICAL: Missing JavaScript MIME Type Headers

**Issue**: No explicit Content-Type headers configured for `.js` files in `vercel.json`.

**Current headers config only covers:**
- `/(.*)` - Security headers for all files
- `/assets/(.*)` - Cache-Control for assets

**Missing**: Explicit `Content-Type: application/javascript` for `.js` files

While Vercel auto-detects MIME types, explicit headers prevent issues when rewrite rules interfere.

---

### 🟠 HIGH: Missing Static File Routes

**Issue**: No explicit routes for static assets before the SPA catch-all.

Vite outputs to these directories:
- `/js/` - JavaScript entry and chunks
- `/css/` - Stylesheets
- `/img/` - Images
- `/fonts/` - Font files
- `/assets/` - Other assets

**Problem**: Without explicit routes, static files may fall through to the SPA rewrite.

**Recommended**: Add explicit routes for static assets before the SPA rewrite:
```json
{
  "source": "/js/(.*)",
  "headers": [{ "key": "Content-Type", "value": "application/javascript" }]
}
```

---

### 🟠 HIGH: Missing Headers for JS/Chunks Directories

**Issue**: The `headers` array in vercel.json doesn't include MIME type headers for:
- `/js/*.js` - Main JS files
- `/js/vendor/*.js` - Vendor chunks
- `/js/hubs/*.js` - Hub-specific chunks
- `/js/components/*.js` - Component chunks
- `/js/chunks/*.js` - Dynamic chunks

**Build Output Structure** (from vite.config.js):
```
dist/
├── js/
│   ├── [name]-[hash].js           (entry files)
│   ├── vendor/                    (vendor chunks)
│   ├── hubs/                      (hub chunks)
│   ├── components/                (component chunks)
│   └── chunks/                    (other chunks)
├── css/
├── img/
├── fonts/
└── assets/
```

---

### 🟡 MEDIUM: Service Worker Scope Issue

**Issue**: Service worker registration at `/sw.js` with scope potentially affected by rewrites.

**Code in index.html:**
```javascript
navigator.serviceWorker.register('/sw.js')
```

**Potential Problem**: If the service worker file is served with `text/html` MIME type, registration will fail with:
```
Failed to register a ServiceWorker: The script has an unsupported MIME type ('text/html')
```

---

### 🟡 MEDIUM: WASM Module MIME Type

**Issue**: The project uses TensorFlow.js with WASM backend (`@tensorflow/tfjs-backend-wasm`).

WASM files (`.wasm`) need `application/wasm` MIME type. No explicit configuration for `.wasm` files found.

**Related dependency**: `onnxruntime-web` also uses WASM files.

---

### 🟢 LOW: Cache Headers Only for /assets/

**Issue**: Cache headers are only configured for `/assets/(.*)` but Vite outputs to multiple directories:
- `/js/` - No cache headers
- `/css/` - No cache headers
- `/img/` - No cache headers

Files in these directories should have immutable cache headers since they have content hashes.

---

## 3. Root Cause Analysis

### Primary Cause: SPA Rewrite Interception

The root cause of the "Failed to load module script: Expected a JavaScript-or-Wasm module script but the server responded with a MIME type of 'text/html'" error is:

1. Browser requests `/js/main-abc123.js` with Accept header containing `text/html`
2. Vercel matches the catch-all rewrite rule: `"source": "/:path*"` with `"has": [{ "type": "header", "key": "Accept", "value": "text/html" }]`
3. Request is rewritten to `/index.html`
4. Browser receives HTML instead of JavaScript
5. Browser rejects the module because MIME type `text/html` ≠ `application/javascript`

### Contributing Factors:

1. **No explicit static file routes** - Static files have no priority routing
2. **No MIME type headers** - Missing explicit Content-Type headers for JS/WASM
3. **Broad Accept header matching** - The rewrite rule is too permissive

---

## 4. Recommended Fixes

### Fix 1: Add Explicit Static File Routes (HIGHEST PRIORITY)

Add routes BEFORE the SPA rewrites to serve static files directly:

```json
{
  "rewrites": [
    {
      "source": "/js/(.*)",
      "destination": "/js/$1"
    },
    {
      "source": "/css/(.*)",
      "destination": "/css/$1"
    },
    {
      "source": "/fonts/(.*)",
      "destination": "/fonts/$1"
    },
    {
      "source": "/manifest.json",
      "destination": "/manifest.json"
    },
    {
      "source": "/sw.js",
      "destination": "/sw.js"
    },
    {
      "source": "/sator/:path*",
      "destination": "/index.html"
    },
    ...
  ]
}
```

### Fix 2: Add MIME Type Headers for JS and WASM Files

Extend the headers configuration:

```json
{
  "headers": [
    {
      "source": "/js/(.*)\\.js$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/javascript"
        },
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    },
    {
      "source": "/(.*)\\.wasm$",
      "headers": [
        {
          "key": "Content-Type",
          "value": "application/wasm"
        }
      ]
    },
    {
      "source": "/css/(.*)\\.css$",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

### Fix 3: Narrow the SPA Rewrite Rule

Change the catch-all rewrite to be more specific:

```json
{
  "source": "/:path((?!js/|css/|assets/|icons/|fonts/|.*\\.js$|.*\\.css$|.*\\.wasm$|manifest\\.json|sw\\.js).*)"
}
```

Or use explicit exclusions:

```json
{
  "rewrites": [
    {
      "source": "/((?!js/|css/|assets/|.*\\.js$|.*\\.css$|.*\\.wasm$).*)"
    }
  ]
}
```

### Fix 4: Ensure VITE_BASE_PATH is Set Correctly

Verify the build environment variable is applied:

```json
{
  "build": {
    "env": {
      "VITE_BASE_PATH": "/"
    }
  }
}
```

This is already configured correctly in the current vercel.json.

---

## 5. Verification Steps

After implementing fixes, verify:

1. **Check JS MIME type:**
   ```bash
   curl -I https://<your-domain>/js/main-[hash].js
   # Should return: Content-Type: application/javascript
   ```

2. **Check WASM MIME type:**
   ```bash
   curl -I https://<your-domain>/assets/[name].wasm
   # Should return: Content-Type: application/wasm
   ```

3. **Check SPA routing still works:**
   ```bash
   curl -H "Accept: text/html" https://<your-domain>/sator/analytics
   # Should return: index.html content
   ```

4. **Check static files are not rewritten:**
   ```bash
   curl -H "Accept: text/html,application/javascript" https://<your-domain>/js/main-[hash].js
   # Should return: JavaScript content, not HTML
   ```

---

## 6. Summary Table

| Issue | Severity | File | Description |
|-------|----------|------|-------------|
| SPA rewrite catching JS files | 🔴 CRITICAL | vercel.json | Rewrite rule matches browser Accept headers that include text/html |
| Missing JS MIME type headers | 🔴 CRITICAL | vercel.json | No explicit Content-Type for .js files |
| Missing static file routes | 🟠 HIGH | vercel.json | No priority routes for /js/, /css/, etc. |
| Missing chunk directory headers | 🟠 HIGH | vercel.json | Cache/MIME headers not applied to all build outputs |
| Service worker MIME issue | 🟡 MEDIUM | vercel.json | sw.js may be served as text/html |
| Missing WASM MIME type | 🟡 MEDIUM | vercel.json | No application/wasm header for .wasm files |
| Incomplete cache headers | 🟢 LOW | vercel.json | Only /assets/ has cache headers |

---

## 7. Files Reviewed

- ✅ `vercel.json` (92 lines)
- ✅ `apps/website-v2/vite.config.js` (279 lines)
- ✅ `apps/website-v2/package.json` (74 lines)
- ✅ `apps/website-v2/index.html` (195 lines)
- ✅ `.vercel/project.json` (linked project info)

---

*This is a READ-ONLY scouting pass. No files were modified.*
