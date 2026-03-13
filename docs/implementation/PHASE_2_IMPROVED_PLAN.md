[Ver002.000]

# PHASE 2 — IMPROVED PERFORMANCE OPTIMIZATION PLAN
## 4NJZ4 TENET Platform: Production-Ready Architecture

**Phase Duration:** 1.5 weeks  
**Estimated Effort:** 60-75 hours  
**Target Performance:** 60fps grid operations, <100ms API response, <500ms TTI

---

## I. ARCHITECTURE IMPROVEMENTS OVER PREVIOUS PLAN

### Key Changes from Original Phase 2 Plan

| Aspect | Original Plan | Improved Plan | Benefit |
|--------|--------------|---------------|---------|
| **Canvas Rendering** | Main thread Canvas | OffscreenCanvas + Web Worker | No main thread blocking |
| **Virtualization** | Custom implementation | @tanstack/react-virtual | Battle-tested, better a11y |
| **Scheduling** | requestAnimationFrame | scheduler package | Priority-based updates |
| **Offline Support** | None | Service Worker + Cache API | Offline functionality |
| **Performance Monitoring** | Manual testing | React Profiler API + Web Vitals | Real-user metrics |
| **Responsive Canvas** | Window resize events | ResizeObserver | Efficient size tracking |

---

## II. PHASE 2 OBJECTIVES

### Primary Goals

1. **Grid Rendering:** 60fps drag operations with 50+ panels using Web Workers
2. **Memory Management:** LRU eviction + virtual scrolling for 100+ panels
3. **API Performance:** Sub-100ms response with edge caching
4. **Bundle Optimization:** Aggressive code splitting, <300KB initial
5. **PWA Capabilities:** Offline support, installable, background sync
6. **Accessibility:** Full keyboard navigation, screen reader support

### Success Criteria

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Grid drag FPS | ~40-50fps | 60fps | Chrome DevTools FPS meter |
| Time to Interactive | ~4s | <2s | Lighthouse TTI |
| API response p95 | ~300ms | <100ms | Server logs |
| Initial bundle | ~530KB | <300KB | Chrome Network |
| Memory (50 panels) | ~250MB | <150MB | Chrome Memory |
| Lighthouse Score | ~75 | >90 | Lighthouse CI |
| Accessibility | Partial | WCAG 2.1 AA | axe-core |

---

## III. WORK STREAMS

### Work Stream A: Web Worker Canvas System (16 hours)

**Purpose:** Offload all grid rendering to Web Worker for true 60fps

#### A.1 OffscreenCanvas Architecture

**New File:** `src/workers/gridRenderer.worker.js`

```javascript
/**
 * Grid Renderer Web Worker
 * Handles all canvas rendering off main thread
 */

self.onmessage = function(event) {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'INIT':
      initializeCanvas(payload.canvas, payload.width, payload.height);
      break;
    case 'RENDER_PANELS':
      renderPanels(payload.panels, payload.viewport);
      break;
    case 'UPDATE_DRAG':
      updateDragPosition(payload.panelId, payload.x, payload.y);
      break;
    case 'RESIZE':
      handleResize(payload.width, payload.height);
      break;
  }
};

let canvas, ctx, offscreenCanvas, offscreenCtx;

function initializeCanvas(offscreenCanvasElement, width, height) {
  // Use OffscreenCanvas passed from main thread
  canvas = offscreenCanvasElement;
  ctx = canvas.getContext('2d');
  
  // Create double buffer
  offscreenCanvas = new OffscreenCanvas(width, height);
  offscreenCtx = offscreenCanvas.getContext('2d');
  
  self.postMessage({ type: 'INITIALIZED' });
}

function renderPanels(panels, viewport) {
  // Clear offscreen buffer
  offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  
  // Render visible panels only
  panels.forEach(panel => {
    if (isInViewport(panel, viewport)) {
      renderPanelThumbnail(offscreenCtx, panel);
    }
  });
  
  // Composite to main canvas
  ctx.drawImage(offscreenCanvas, 0, 0);
  
  // Request next frame if animating
  if (isAnimating) {
    requestAnimationFrame(() => {
      self.postMessage({ type: 'FRAME_COMPLETE' });
    });
  }
}

function renderPanelThumbnail(ctx, panel) {
  // Render simplified panel representation
  const { x, y, w, h, hubColor, title } = panel;
  
  // Background
  ctx.fillStyle = 'rgba(20, 20, 26, 0.95)';
  ctx.fillRect(x, y, w, h);
  
  // Hub color border
  ctx.strokeStyle = hubColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(x, y, w, h);
  
  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.fillText(title, x + 8, y + 20);
  
  // Content preview (simplified chart/visualization)
  renderContentPreview(ctx, panel);
}
```

**New File:** `src/hooks/useCanvasGrid.js`

```javascript
/**
 * useCanvasGrid - Hook for Web Worker canvas grid rendering
 */
import { useEffect, useRef, useCallback } from 'react';

export function useCanvasGrid(containerRef, panels, options = {}) {
  const workerRef = useRef(null);
  const canvasRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const isDraggingRef = useRef(false);
  
  // Initialize Web Worker and OffscreenCanvas
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    containerRef.current.appendChild(canvas);
    canvasRef.current = canvas;
    
    // Transfer canvas control to worker
    const offscreen = canvas.transferControlToOffscreen();
    
    // Initialize worker
    const worker = new Worker(
      new URL('../workers/gridRenderer.worker.js', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;
    
    // Send canvas to worker
    worker.postMessage({
      type: 'INIT',
      payload: {
        canvas: offscreen,
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      }
    }, [offscreen]);
    
    // Setup ResizeObserver for efficient size tracking
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        worker.postMessage({
          type: 'RESIZE',
          payload: { width, height }
        });
      }
    });
    resizeObserverRef.current.observe(containerRef.current);
    
    return () => {
      worker.terminate();
      resizeObserverRef.current?.disconnect();
      canvas.remove();
    };
  }, []);
  
  // Send panel updates to worker
  useEffect(() => {
    if (!workerRef.current) return;
    
    workerRef.current.postMessage({
      type: 'RENDER_PANELS',
      payload: {
        panels: panels.map(p => ({
          i: p.i,
          x: p.x,
          y: p.y,
          w: p.w * colWidth,
          h: p.h * rowHeight,
          hubColor: HUB_COLORS[p.hub]?.base,
          title: p.title
        })),
        viewport: calculateViewport()
      }
    });
  }, [panels]);
  
  // Drag handling
  const handleDragStart = useCallback((panelId) => {
    isDraggingRef.current = true;
    // Switch to high-frequency updates during drag
  }, []);
  
  const handleDragMove = useCallback((panelId, x, y) => {
    if (!workerRef.current) return;
    
    // Throttle updates to every 2nd frame for performance
    workerRef.current.postMessage({
      type: 'UPDATE_DRAG',
      payload: { panelId, x, y }
    });
  }, []);
  
  return {
    canvasRef,
    handleDragStart,
    handleDragMove
  };
}
```

#### A.2 Hybrid Rendering Strategy

**New File:** `src/components/grid/HybridGrid.jsx`

```jsx
/**
 * HybridGrid - Switches between DOM and Canvas based on panel count
 */
import { useMemo } from 'react';
import { useCanvasGrid } from '@/hooks/useCanvasGrid';
import { QuaternaryGrid } from '../QuaternaryGrid';

const CANVAS_THRESHOLD = 15; // Switch to canvas above this many panels

export function HybridGrid({ panels, ...props }) {
  const shouldUseCanvas = panels.length > CANVAS_THRESHOLD;
  
  if (shouldUseCanvas) {
    return <CanvasGrid panels={panels} {...props} />;
  }
  
  return <QuaternaryGrid panels={panels} {...props} />;
}
```

#### A.3 Deliverables

- [ ] `gridRenderer.worker.js` - Full Web Worker implementation
- [ ] `useCanvasGrid.js` - Hook for worker communication
- [ ] `CanvasGrid.jsx` - Canvas-based grid component
- [ ] `HybridGrid.jsx` - Smart switching component
- [ ] 60fps verified with 50+ panels

---

### Work Stream B: Virtual Scrolling with TanStack Virtual (10 hours)

**Purpose:** Efficient rendering of large panel sets using industry-standard library

#### B.1 @tanstack/react-virtual Integration

```bash
npm install @tanstack/react-virtual
```

**New File:** `src/components/grid/VirtualGrid.jsx`

```jsx
/**
 * VirtualGrid - Virtualized grid using @tanstack/react-virtual
 */
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { GridPanel } from './GridPanel';

export function VirtualGrid({ panels, layout, ...props }) {
  const parentRef = useRef(null);
  
  // Virtualizer for rows
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(panels.length / layout.cols),
    getScrollElement: () => parentRef.current,
    estimateSize: () => layout.rowHeight + layout.margin[1],
    overscan: 3, // Render 3 rows above/below viewport
  });
  
  // Virtualizer for columns (if horizontal scrolling needed)
  const colVirtualizer = useVirtualizer({
    horizontal: true,
    count: layout.cols,
    getScrollElement: () => parentRef.current,
    estimateSize: () => (parentRef.current?.clientWidth || 1200) / layout.cols,
    overscan: 1,
  });
  
  const virtualRows = rowVirtualizer.getVirtualItems();
  const virtualCols = colVirtualizer.getVirtualItems();
  
  return (
    <div
      ref={parentRef}
      style={{
        height: '100vh',
        overflow: 'auto',
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: `${colVirtualizer.getTotalSize()}px`,
          position: 'relative',
        }}
      >
        {virtualRows.map((virtualRow) => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualRow.size}px`,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {/* Render panels in this row */}
            {getPanelsInRow(panels, virtualRow.index, layout.cols).map((panel) => (
              <GridPanel
                key={panel.i}
                panel={panel}
                style={{
                  position: 'absolute',
                  left: panel.x * colWidth,
                  width: panel.w * colWidth,
                }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### B.2 Deliverables

- [ ] `@tanstack/react-virtual` installed
- [ ] `VirtualGrid.jsx` implementation
- [ ] Smooth scrolling with 100 panels
- [ ] Keyboard navigation support

---

### Work Stream C: Priority-Based Scheduling (8 hours)

**Purpose:** Use React's scheduler for smooth updates

```bash
npm install scheduler
```

**New File:** `src/utils/scheduler.js`

```javascript
/**
 * Priority-based update scheduling
 */
import { 
  unstable_scheduleCallback as scheduleCallback,
  unstable_NormalPriority as NormalPriority,
  unstable_UserBlockingPriority as UserBlockingPriority,
  unstable_IdleCallbackPriority as IdlePriority
} from 'scheduler';

// Schedule high-priority updates (user interactions)
export function scheduleUserUpdate(callback) {
  scheduleCallback(UserBlockingPriority, callback);
}

// Schedule normal updates (data fetching)
export function scheduleNormalUpdate(callback) {
  scheduleCallback(NormalPriority, callback);
}

// Schedule background work (analytics, cleanup)
export function scheduleBackgroundWork(callback) {
  scheduleCallback(IdlePriority, callback);
}
```

---

### Work Stream D: Service Worker & PWA (10 hours)

**Purpose:** Offline support and installable app

#### D.1 Service Worker Setup

**New File:** `public/service-worker.js`

```javascript
/**
 * Service Worker for 4NJZ4 TENET Platform
 * Provides offline caching and background sync
 */

const CACHE_NAME = 'tenet-platform-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.css',
  '/assets/index.js',
];

const API_CACHE_NAME = 'tenet-api-v1';
const API_ROUTES = ['/api/players', '/api/matches'];

// Install - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Fetch - serve from cache or network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // API requests - network first, cache fallback
  if (API_ROUTES.some(route => request.url.includes(route))) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Cache successful API responses
          const clone = response.clone();
          caches.open(API_CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // Static assets - cache first
  event.respondWith(
    caches.match(request).then((response) => {
      return response || fetch(request);
    })
  );
});

// Background sync for offline mutations
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-panel-updates') {
    event.waitUntil(syncPanelUpdates());
  }
});
```

#### D.2 Web App Manifest

**New File:** `public/manifest.json`

```json
{
  "name": "4NJZ4 TENET Platform",
  "short_name": "TENET",
  "description": "Advanced esports analytics and simulation platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#050508",
  "theme_color": "#14141a",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

#### D.3 Deliverables

- [ ] Service Worker registered
- [ ] Static asset caching
- [ ] API response caching
- [ ] Background sync support
- [ ] Web App Manifest
- [ ] Installable PWA

---

### Work Stream E: Advanced Code Splitting (8 hours)

**Purpose:** <300KB initial bundle with granular loading

#### E.1 Route-Based Splitting

**Update:** `src/App.jsx`

```jsx
import { lazy, Suspense } from 'react';
import { HubLoader } from '@/components/grid/PanelSkeleton';

// Lazy load each hub
const SATORHub = lazy(() => import('./pages/SATORHub'));
const ROTASHub = lazy(() => import('./pages/ROTASHub'));
const AREPOHub = lazy(() => import('./pages/AREPOHub'));
const OPERAHub = lazy(() => import('./pages/OPERAHub'));
const TENETHub = lazy(() => import('./pages/TENETHub'));

// Preload on hover
const preloadHub = (hubName) => {
  const hubs = {
    SATOR: () => import('./pages/SATORHub'),
    ROTAS: () => import('./pages/ROTASHub'),
    AREPO: () => import('./pages/AREPOHub'),
    OPERA: () => import('./pages/OPERAHub'),
    TENET: () => import('./pages/TENETHub'),
  };
  hubs[hubName]?.();
};
```

#### E.2 Component-Level Splitting

```jsx
// Lazy load heavy visualization components
const ThreeJSCanvas = lazy(() => import('@/components/ThreeJSCanvas'));
const D3Chart = lazy(() => import('@/components/D3Chart'));

// Prefetch on viewport approach
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function LazyPanel({ type }) {
  return (
    <Suspense fallback={<PanelSkeleton />}>
      {type === '3d' && <ThreeJSCanvas />}
      {type === 'chart' && <D3Chart />}
    </Suspense>
  );
}
```

#### E.3 Module Preloading

**Update:** `index.html`

```html
<!-- Preload critical resources -->
<link rel="modulepreload" href="/assets/react-vendor.js">
<link rel="modulepreload" href="/assets/index.js">

<!-- Prefetch next likely navigation -->
<link rel="prefetch" href="/assets/rotas-hub.js">
```

---

### Work Stream F: API Performance Optimization (10 hours)

**Purpose:** <100ms API responses with edge caching

#### F.1 Database Optimization

**Migration:** `006_performance_indexes.sql`

```sql
-- Concurrent index creation (no table locks)
CREATE INDEX CONCURRENTLY idx_player_performance_lookup 
    ON player_performance(player_id, realworld_time DESC);

CREATE INDEX CONCURRENTLY idx_matches_time 
    ON matches(match_time DESC);

-- Partial index for active players only
CREATE INDEX CONCURRENTLY idx_active_players
    ON player_performance(player_id, realworld_time DESC)
    WHERE is_active = true;

-- Covering index for common queries
CREATE INDEX CONCURRENTLY idx_player_stats_covering
    ON player_performance(team, region, realworld_time DESC)
    INCLUDE (player_id, name, kills, deaths, acs, sim_rating);
```

#### F.2 Edge Caching with Vercel/Cloudflare

**Update:** `vercel.json`

```json
{
  "headers": [
    {
      "source": "/api/players",
      "headers": [
        { "key": "Cache-Control", "value": "s-maxage=60, stale-while-revalidate=300" }
      ]
    },
    {
      "source": "/api/analytics/leaderboard",
      "headers": [
        { "key": "Cache-Control", "value": "s-maxage=300, stale-while-revalidate=3600" }
      ]
    }
  ]
}
```

---

### Work Stream G: Performance Monitoring (6 hours)

**Purpose:** Real-user performance metrics

#### G.1 Web Vitals Integration

**New File:** `src/utils/analytics.js`

```javascript
/**
 * Web Vitals and performance monitoring
 */
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

export function initPerformanceMonitoring() {
  // Core Web Vitals
  getCLS(sendToAnalytics);
  getFID(sendToAnalytics);
  getFCP(sendToAnalytics);
  getLCP(sendToAnalytics);
  getTTFB(sendToAnalytics);
  
  // Custom metrics
  measureGridPerformance();
}

function sendToAnalytics(metric) {
  // Send to analytics endpoint
  const body = JSON.stringify(metric);
  
  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/vitals', body);
  } else {
    fetch('/api/analytics/vitals', {
      method: 'POST',
      body,
      keepalive: true
    });
  }
}
```

#### G.2 React Profiler

**New File:** `src/components/PerformanceProfiler.jsx`

```jsx
/**
 * React Profiler for component performance tracking
 */
import { Profiler } from 'react';

function onRenderCallback(
  id, // Component identifier
  phase, // "mount" or "update"
  actualDuration, // Time spent rendering
  baseDuration, // Estimated time without memoization
  startTime, // When React began rendering
  commitTime // When React committed changes
) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Profiler:', { id, phase, actualDuration, baseDuration });
  }
  
  // Log slow renders
  if (actualDuration > 16) { // Longer than one frame
    console.warn(`Slow render detected: ${id} took ${actualDuration.toFixed(2)}ms`);
  }
}

export function PerformanceProfiler({ children, id }) {
  return (
    <Profiler id={id} onRender={onRenderCallback}>
      {children}
    </Profiler>
  );
}
```

---

### Work Stream H: Accessibility Improvements (6 hours)

**Purpose:** WCAG 2.1 AA compliance

#### H.1 Keyboard Navigation

**New File:** `src/hooks/useKeyboardNavigation.js`

```javascript
/**
 * Keyboard navigation for grid panels
 */
import { useEffect, useCallback } from 'react';

export function useKeyboardNavigation(panelId, { 
  onFocusNext, 
  onFocusPrev,
  onClose,
  onMinimize,
  onMaximize 
}) {
  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'ArrowRight':
        event.preventDefault();
        onFocusNext?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        onFocusPrev?.();
        break;
      case 'Escape':
        event.preventDefault();
        onClose?.();
        break;
      case 'm':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onMinimize?.();
        }
        break;
      case 'f':
        if (event.ctrlKey || event.metaKey) {
          event.preventDefault();
          onMaximize?.();
        }
        break;
    }
  }, [onFocusNext, onFocusPrev, onClose, onMinimize, onMaximize]);
  
  useEffect(() => {
    const element = document.getElementById(`panel-${panelId}`);
    element?.addEventListener('keydown', handleKeyDown);
    return () => element?.removeEventListener('keydown', handleKeyDown);
  }, [panelId, handleKeyDown]);
}
```

#### H.2 Screen Reader Support

Add to `DraggablePanel.jsx`:

```jsx
// ARIA attributes for screen readers
<div
  role="region"
  aria-label={`${panel.title} panel`}
  aria-expanded={!panel.isMinimized}
  tabIndex={0}
  // ...
>
```

---

## IV. IMPLEMENTATION SCHEDULE

### Week 1: Core Performance (36 hours)

| Day | Task | Hours | Output |
|-----|------|-------|--------|
| Mon | Web Worker Canvas setup | 8 | Worker communication working |
| Tue | OffscreenCanvas rendering | 8 | 60fps with 30 panels |
| Wed | @tanstack/react-virtual | 6 | Virtual grid working |
| Thu | LRU + Scheduler | 6 | Memory management |
| Fri | Service Worker | 8 | Offline support |

### Week 2: Polish & Monitoring (36 hours)

| Day | Task | Hours | Output |
|-----|------|-------|--------|
| Mon | Code splitting | 6 | <300KB bundle |
| Tue | API optimization | 6 | <100ms responses |
| Wed | Web Vitals + Profiler | 6 | Performance monitoring |
| Thu | Accessibility | 6 | WCAG 2.1 AA |
| Fri | Testing + Documentation | 12 | Full test suite |

---

## V. TECHNICAL SPECIFICATIONS

### Web Worker Communication Protocol

```typescript
// Main thread to Worker
interface WorkerMessage {
  type: 'INIT' | 'RENDER_PANELS' | 'UPDATE_DRAG' | 'RESIZE';
  payload: unknown;
}

// Worker to Main thread
interface WorkerResponse {
  type: 'INITIALIZED' | 'FRAME_COMPLETE' | 'DRAG_COMPLETE' | 'ERROR';
  payload: unknown;
}
```

### ResizeObserver Pattern

```javascript
// Efficient size tracking without polling
const resizeObserver = new ResizeObserver((entries) => {
  for (const entry of entries) {
    if (entry.contentBoxSize) {
      // Modern browsers
      const { inlineSize, blockSize } = entry.contentBoxSize[0];
      handleResize(inlineSize, blockSize);
    } else {
      // Fallback
      handleResize(entry.contentRect.width, entry.contentRect.height);
    }
  }
});
```

---

## VI. SUCCESS METRICS

| Metric | Target | Verification |
|--------|--------|--------------|
| Drag FPS | 60fps | Chrome DevTools |
| TTI | <2s | Lighthouse |
| Bundle | <300KB | Chrome Network |
| Lighthouse | >90 | Lighthouse CI |
| WCAG | AA | axe-core |
| Offline | Full | Service Worker test |

---

## VII. RISK MITIGATION

| Risk | Mitigation |
|------|------------|
| Web Worker compatibility | Fallback to main thread Canvas |
| Service Worker cache bloat | Versioned caches, max size limits |
| Accessibility regressions | Automated axe-core testing |
| Memory leaks in workers | Worker termination on unmount |
| Bundle splitting complexity | Module preload hints |

---

*End of Improved Phase 2 Plan*
