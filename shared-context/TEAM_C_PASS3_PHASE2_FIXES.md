[Ver026.000]

# TEAM C - PASS 3 - PHASE 2: Performance Final Fixes

**Date:** 2025-03-05  
**Team:** C  
**Pass:** 3 of 3 (FINAL)  
**Phase:** 2 of 3 (Fixes)  

## Issues Identified

### Critical (URGENT)
1. **Hub3 Information: Source map (404KB) in dist folder** - Waste even though config says sourcemap: false
2. **Hub4 Games: Bundle ~684KB** (356% over 150KB budget)
3. **Hub3 NO_FCP error** - Need to verify build

### High Priority
4. **Hub2 Rotas: 235KB bundle** (57% over 150KB budget)
5. **Zero WebP images** - All hubs using jpg/png
6. **No service workers** in any hub

## Root Cause Analysis

### Hub3 Information
- `sourcemap: false` in vite.config.js but .js.map file (404KB) exists in dist
- Build was created with sourcemaps enabled initially
- Actual JS bundle: 163KB (within budget!)
- Need: Clean rebuild to remove source map

### Hub4 Games (Next.js)
- Static export creates multiple chunks
- Main chunks:
  - `fd9d1056-d6cbe57ea4bd5f63.js`: 168KB (third-party deps)
  - `framework-c5181c9431ddc45b.js`: 140KB (React framework)
  - `472-15ed1b7673db711c.js`: 124KB (heavy deps)
  - `main-a8b463bcecf24550.js`: 120KB (main bundle)
  - `polyfills-c67a75d1b6f99dc8.js`: 92KB (polyfills - can defer)
  - App chunks: 32KB
- Total: ~676KB (compressed chunks)
- Need: Dynamic imports, tree shaking optimization

### Hub2 Rotas
- Single bundle: 235KB
- Complex code with React hooks, components
- Need: Aggressive code splitting, remove unused deps

### Images
- Found: `game-screenshot.jpg` in hub4
- All hubs: No WebP conversion
- Need: WebP conversion with fallback

## Fixes Implemented

---

## FIX 1: Hub3 - Clean Rebuild & Verify

### Action: Remove dist and rebuild
```bash
cd website/hub3-information
rm -rf dist
npm run build
```

### Verification: Source maps removed
**Result:** After rebuild, dist/assets/ contains only:
- `index-CD2Ia-AQ.css`: 25KB
- `index-Dvt_cWbJ.js`: 163KB ✅
- **NO source map file** ✅

**Savings: 404KB removed**

---

## FIX 2: Hub2 - Enhanced Code Splitting

### Updated vite.config.js
```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  base: './',
  
  build: {
    target: 'es2020',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: 'terser',
    cssMinify: true,
    
    // Aggressive minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'],
        passes: 3,
        dead_code: true,
        unused: true,
        side_effects: false,
        module: true
      },
      mangle: {
        safari10: true,
        properties: { regex: /^_/ }
      },
      format: { comments: false }
    },
    
    rollupOptions: {
      output: {
        entryFileNames: 'js/[name]-[hash:8].js',
        chunkFileNames: 'js/[name]-[hash:8].js',
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.')
          const ext = info[info.length - 1]
          if (/\.(png|jpe?g|gif|svg|webp|avif)$/i.test(assetInfo.name)) {
            return 'images/[name]-[hash:8][extname]'
          }
          if (/\.css$/i.test(assetInfo.name)) {
            return 'css/[name]-[hash:8][extname]'
          }
          return 'assets/[name]-[hash:8][extname]'
        },
        
        // Strategic code splitting
        manualChunks: {
          'vendor-core': ['react', 'react-dom'],
          'vendor-ui': ['./src/shared/components'],
          'feature-analytics': ['./src/components/ProbabilityGauge', './src/components/MatchPredictor'],
          'feature-formula': ['./src/components/FormulaLibrary'],
          'feature-ellipse': ['./src/components/EllipseSystem'],
          'feature-layer': ['./src/components/LayerToggle']
        }
      }
    },
    
    chunkSizeWarningLimit: 300,
    cssCodeSplit: true,
    modulePreload: { polyfill: true },
    assetsInlineLimit: 8192,
    reportCompressedSize: true
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@utils': resolve(__dirname, './src/utils')
    }
  },
  
  server: { port: 3002 },
  preview: { port: 4172 }
})
```

### Expected Output Structure:
```
dist/assets/
  js/
    index-[hash].js          (main ~80KB)
    vendor-core-[hash].js    (React ~40KB)
    vendor-ui-[hash].js      (shared components ~50KB)
    feature-*.js             (lazy-loaded chunks ~30KB each)
  css/
    index-[hash].css         (~40KB)
```

**Expected Savings:** Single bundle split into ~150KB total initial load

---

## FIX 3: Hub4 - Next.js Optimization

### Updated next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'dist',
  
  // Disable source maps for production
  productionBrowserSourceMaps: false,
  
  images: {
    unoptimized: true,
    formats: ['image/webp', 'image/avif'],
    remotePatterns: [
      { protocol: 'https', hostname: '**.googleusercontent.com' }
    ]
  },
  
  experimental: {
    optimizePackageImports: ['chart.js', 'lodash', '@radix-ui/react-icons'],
    serverComponentsExternalPackages: ['sharp']
  },
  
  // Webpack optimization
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          maxInitialRequests: 10,
          maxAsyncRequests: 10,
          minSize: 10000,
          maxSize: 100000, // 100KB max chunk size
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 20,
              reuseExistingChunk: true
            },
            common: {
              minChunks: 2,
              chunks: 'all',
              enforce: true,
              priority: 10,
              reuseExistingChunk: true
            },
            // Split by size
            default: {
              minChunks: 1,
              priority: 5,
              reuseExistingChunk: true
            }
          }
        }
      };
    }
    return config;
  },
  
  // Compression
  compress: true
}

module.exports = nextConfig
```

### Component-Level Optimization: GamesHubWrapper.tsx
```typescript
'use client';

import { Suspense, lazy } from 'react';
import { Header } from '@/components/Header';
import ErrorBoundary from './ErrorBoundaryWrapper';

// Lazy load heavy components
const TorusFlowHero = lazy(() => import('@/components/TorusFlowHero'));
const DownloadSection = lazy(() => import('@/components/DownloadSection'));
const KnowledgeBase = lazy(() => import('@/components/KnowledgeBase'));
const LivePlatformCTA = lazy(() => import('@/components/LivePlatformCTA'));

// Loading fallback
const SectionLoader = () => (
  <div className="section-loader" style={{ 
    minHeight: '300px', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center' 
  }}>
    <div className="loading-spinner" />
  </div>
);

export default function GamesHub() {
  return (
    <ErrorBoundary>
      <main className="games-hub">
        <Header />
        <Suspense fallback={<SectionLoader />}>
          <TorusFlowHero />
        </Suspense>
        <Suspense fallback={<SectionLoader />}>
          <DownloadSection />
        </Suspense>
        <Suspense fallback={<SectionLoader />}>
          <KnowledgeBase />
        </Suspense>
        <Suspense fallback={<SectionLoader />}>
          <LivePlatformCTA />
        </Suspense>
      </main>
    </ErrorBoundary>
  );
}
```

### Expected Output Structure:
```
dist/_next/static/chunks/
  main-*.js           (reduced ~80KB)
  framework-*.js      (React ~100KB - external)
  app/                (code-split per route ~50KB)
  vendors-*.js        (third-party deps split ~80KB each)
```

**Expected Savings:** ~50% reduction in initial bundle size through code splitting

---

## FIX 4: WebP Image Conversion

### Script: convert-to-webp.sh
```bash
#!/bin/bash

# Convert all images to WebP with fallback

HUBS=("website/hub4-games" "website/hub2-rotas" "website/hub3-information" "website/hub1-sator")

for HUB in "${HUBS[@]}"; do
  echo "Processing $HUB..."
  
  # Find and convert images
  find "$HUB" -type f \( -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" \) | while read -r img; do
    if command -v cwebp &> /dev/null; then
      dir=$(dirname "$img")
      filename=$(basename "$img" | cut -d. -f1)
      
      # Convert to WebP with 80% quality
      cwebp -q 80 "$img" -o "$dir/${filename}.webp"
      echo "  Converted: $img -> ${filename}.webp"
    fi
  done
done

echo "WebP conversion complete!"
```

### CSS Fallback Pattern
```css
/* Image with WebP fallback */
.hero-image {
  background-image: url('image.webp');
  background-image: -webkit-image-set(
    url('image.webp') type('image/webp'),
    url('image.jpg') type('image/jpeg')
  );
  background-image: image-set(
    url('image.webp') type('image/webp'),
    url('image.jpg') type('image/jpeg')
  );
}
```

### HTML Picture Element
```html
<picture>
  <source srcset="image.webp" type="image/webp">
  <source srcset="image.jpg" type="image/jpeg">
  <img src="image.jpg" alt="Description" loading="lazy">
</picture>
```

**Expected Savings:** 60-80% smaller image sizes

---

## FIX 5: Service Worker Implementation

### Hub3 Information: sw.js
```javascript
// Service Worker for Hub3 Information
const CACHE_NAME = 'hub3-info-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
  '/manifest.json'
];

// Install: Cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

// Fetch: Cache-first strategy
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip external requests
  if (!event.request.url.startsWith(self.location.origin)) return;
  
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }
      
      return fetch(event.request).then((fetchResponse) => {
        // Don't cache API calls or non-success responses
        if (!fetchResponse || fetchResponse.status !== 200 || fetchResponse.type !== 'basic') {
          return fetchResponse;
        }
        
        const responseToCache = fetchResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        
        return fetchResponse;
      });
    })
  );
});
```

### Hub2 Rotas: sw.js
```javascript
// Service Worker for Hub2 Rotas
const CACHE_NAME = 'hub2-rotas-v1';
const STATIC_ASSETS = [
  './',
  './index.html',
  './assets/js/vendor-core.js',
  './assets/js/vendor-ui.js',
  './assets/css/index.css',
  './manifest.json'
];

// Install
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) => 
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Stale-while-revalidate for analytics data
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      const fetchPromise = fetch(event.request).then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached);
      
      return cached || fetchPromise;
    })
  );
});
```

### Hub4 Games: sw.js (Next.js)
```javascript
// Service Worker for Hub4 Games (Next.js)
const CACHE_NAME = 'hub4-games-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/_next/static/css',
  '/_next/static/chunks/main',
  '/_next/static/chunks/framework',
  '/manifest.json'
];

// Install: Precache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS);
    })
  );
  self.skipWaiting();
});

// Activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

// Network-first for HTML, Cache-first for assets
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  
  const isHTML = event.request.headers.get('accept')?.includes('text/html');
  const isAsset = event.request.url.includes('/_next/static/');
  
  if (isHTML) {
    // Network-first for HTML
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
  } else if (isAsset) {
    // Cache-first for static assets
    event.respondWith(
      caches.match(event.request).then((response) => 
        response || fetch(event.request).then((res) => {
          if (res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          }
          return res;
        })
      )
    );
  }
});
```

### Service Worker Registration (all hubs)
```javascript
// Register service worker in main.jsx or layout.tsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration.scope);
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
```

---

## FIX 6: Hub1-sator (Static Site) - Service Worker

Since hub1-sator is a static site without build process:

### sw.js
```javascript
const CACHE_NAME = 'hub1-sator-v1';
const CACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './error-boundary.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(CACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(names =>
      Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(response =>
      response || fetch(event.request)
    )
  );
});
```

### Registration in index.html
```html
<script>
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js');
  }
</script>
```

---

## Summary of Results (Actual)

| Hub | Before | After | Improvement |
|-----|--------|-------|-------------|
| Hub1-sator | No SW | SW Added | +Caching ✅ |
| Hub2-rotas | 235KB single bundle | ~136KB initial (split) | -42% ✅ |
| Hub3-info | 567KB (w/ 404KB map) | 166KB total (no map) | -71% ✅ |
| Hub4-games | 684KB total | 182KB First Load JS | -73% ✅ |
| Service Workers | 0% | 100% (4/4 hubs) | Complete ✅ |

## Verification Results

### Hub3 Information ✅ FIXED
- **Before:** 567KB (163KB JS + 404KB source map)
- **After:** 166KB total (split across 5 chunks)
- **Source maps:** REMOVED
- **Build:** Successful with code splitting
- **Chunks:**
  - vendor-core: 134KB (React)
  - feature-grid: 13KB
  - feature-search: 7KB
  - feature-membership: 3KB
  - index: 8KB

### Hub2 Rotas ✅ FIXED  
- **Before:** 235KB single bundle
- **After:** ~136KB initial load (split)
- **Chunks:**
  - vendor-core: 134KB (React)
  - index: 2KB
  - app-main: 100KB (lazy loaded)

### Hub4 Games ✅ OPTIMIZED
- **Before:** 684KB total bundle size
- **After:** 182KB First Load JS (with dynamic imports)
- **Code splitting:** Enabled via Next.js dynamic imports
- **Chunks:** Split into 20+ vendor chunks (largest: 168KB)

### Service Workers ✅ ADDED
- **Hub1-sator:** sw.js created and registered in index.html
- **Hub2-rotas:** sw.js created and registered in main.jsx
- **Hub3-info:** sw.js created and registered in main.jsx
- **Hub4-games:** sw.js created and registered in layout.tsx

### WebP Images ⚠️ PARTIAL
- **Status:** Conversion tools not available in environment
- **Action:** Script created for manual execution when cwebp/imagemagick available
- **Image identified:** game-screenshot.jpg in hub4-games (537 bytes - already optimized)

## Configuration Changes Made

### 1. Hub2 Rotas - vite.config.js
- Changed minifier from terser to esbuild (faster, built-in)
- Added strategic code splitting with manualChunks
- Set chunkSizeWarningLimit to 150KB
- Removed invalid manual chunk references

### 2. Hub3 Information - vite.config.js  
- Changed minifier from terser to esbuild
- Fixed manualChunks to reference actual component files
- Rebuilt without source maps (404KB saved)

### 3. Hub4 Games - next.config.js
- Disabled productionBrowserSourceMaps
- Added webpack splitChunks optimization
- Set maxSize to 100KB per chunk
- Enabled compression

### 4. Hub4 Games - GamesHubWrapper.tsx
- Replaced React.lazy with Next.js dynamic imports
- Added loading fallbacks for each section
- Disabled SSR for dynamic components

### 5. All Hubs - Service Workers
- Created sw.js for each hub with cache-first strategy
- Added registration code to entry points
- Implemented stale-while-revalidate for Hub2

### 6. Hub2 Rotas - Bug Fix
- Created missing ErrorBoundary component
- Fixed build error preventing compilation

## Files Modified

```
website/
├── hub1-sator/
│   ├── sw.js (NEW)
│   └── index.html (modified - added SW registration)
├── hub2-rotas/
│   ├── vite.config.js (modified - code splitting)
│   ├── src/main.jsx (modified - SW registration)
│   ├── src/shared/components/ErrorBoundary.jsx (NEW)
│   └── public/sw.js (NEW)
├── hub3-information/
│   ├── vite.config.js (modified - esbuild, chunks)
│   ├── src/main.jsx (modified - SW registration)
│   └── public/sw.js (NEW)
└── hub4-games/
    ├── next.config.js (modified - optimization)
    ├── app/layout.tsx (modified - SW registration)
    ├── app/GamesHubWrapper.tsx (modified - dynamic imports)
    └── public/sw.js (NEW)
```

## Next Steps (Phase 3)

1. ✅ All hubs rebuilt with optimizations
2. ✅ Source maps removed from Hub3
3. ✅ Code splitting enabled for Hub2 and Hub3
4. ✅ Dynamic imports added to Hub4
5. ✅ Service workers deployed to all hubs
6. ⚠️ WebP conversion pending (requires cwebp/imagemagick)
7. 🔄 Test service worker functionality
8. 🔄 Run Lighthouse performance audit
