[Ver001.000]

# IMPLEMENTATION GUIDE — MASTER
## Libre-X-eSport 4NJZ4 TENET Platform
### From Planning to Production: Actionable Roadmap

**Status:** Phase 1 Complete, Phase 2 Ready to Begin  
**Audience:** Development Team, Tech Leads, Project Managers  

---

## QUICK START

### Immediate Actions (This Week)

```bash
# 1. Verify Phase 1 Build
cd apps/website-v2 && npm run build

# 2. Install Phase 2 Dependencies (after blockers fixed)
cd apps/website-v2
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks
npm install @tanstack/react-virtual scheduler

# 3. Remove duplicates
rm packages/shared/axiom-esports-data/api/src/db_implemented.py

# 4. Start Phase 2
npm run dev
```

---

## PHASE TRANSITION MATRIX

### From Phase 1 → Phase 2

| Phase 1 Output | Phase 2 Input | Transformation |
|----------------|---------------|----------------|
| Optimized DraggablePanel | Web Worker Canvas | Render to OffscreenCanvas |
| PanelSkeleton | Virtual Grid | Lazy load with overscan |
| PanelErrorBoundary | Production Hardening | Sentry integration |
| QuaternaryGrid | Hybrid Mode | Auto-switch DOM/Canvas |
| DB Layer | API Optimization | Edge caching, indexes |

### Critical Path Dependencies

```
Phase 1 ─────────────────────────────────────────►
  │
  ├── ✅ DraggablePanel (optimized)
  ├── ✅ PanelSkeleton
  ├── ✅ PanelErrorBoundary
  ├── ✅ QuaternaryGrid
  └── ✅ DB Layer
  │
  ▼
BLOCKERS ─────────────────────────────────────────►
  │
  ├── ❌ Testing Framework (8h) ────────────────────┐
  ├── ❌ ESLint Config (2h) ────────────────────────┤ REQUIRED
  └── ❌ Remove Duplicates (0.5h) ──────────────────┘
  │
  ▼
Phase 2 ─────────────────────────────────────────►
  │
  ├── Week 1: Web Workers, Virtual Scroll, State Split
  ├── Week 2: PWA, Code Splitting, Bundle Opt
  └── Week 3: Integration, Testing, Documentation
```

---

## WEEK-BY-WEEK PLAYBOOK

### WEEK 0: Pre-Phase 2 Setup (2-3 days)

**Day 1: Fix Blockers**

```bash
# Morning: Testing Framework
npm install -D vitest @testing-library/react @testing-library/jest-dom jsdom

# Create vitest.config.js
cat > vitest.config.js << 'EOF'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.js'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      thresholds: {
        branches: 75,
        functions: 80,
        lines: 80,
        statements: 80
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  }
})
EOF

# Create test setup
mkdir -p src/test
cat > src/test/setup.js << 'EOF'
import { expect, afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import * as matchers from '@testing-library/jest-dom/matchers'

expect.extend(matchers)
afterEach(cleanup)
EOF

# Update package.json scripts
npm pkg set scripts.test="vitest"
npm pkg set scripts.test:ui="vitest --ui"
npm pkg set scripts.coverage="vitest --coverage"

# Afternoon: ESLint
npm install -D eslint eslint-plugin-react eslint-plugin-react-hooks

cat > .eslintrc.cjs << 'EOF'
module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:react/jsx-runtime'
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  rules: {
    'react/prop-types': 'off',
    'react/jsx-no-target-blank': 'off'
  }
}
EOF

# Verify lint works
npm run lint
```

**Day 2: Cleanup & Preparation**

```bash
# Remove duplicates
rm packages/shared/axiom-esports-data/api/src/db_implemented.py

# Consolidate unused component
mv src/components/QuarterGrid.jsx src/components/deprecated/

# Verify build still works
npm run build

# Create first test as example
cat > src/components/grid/DraggablePanel.test.jsx << 'EOF'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DraggablePanel } from './DraggablePanel'

const mockPanel = {
  i: 'test-panel',
  x: 0,
  y: 0,
  w: 3,
  h: 4,
  title: 'Test Panel',
  hub: 'SATOR',
  isMinimized: false,
  isMaximized: false
}

describe('DraggablePanel', () => {
  it('renders panel with title', () => {
    render(
      <DraggablePanel panel={mockPanel}>
        <div>Content</div>
      </DraggablePanel>
    )
    
    expect(screen.getByText('Test Panel')).toBeInTheDocument()
  })
  
  it('renders minimize button', () => {
    render(
      <DraggablePanel panel={mockPanel}>
        <div>Content</div>
      </DraggablePanel>
    )
    
    expect(screen.getByLabelText('Minimize panel')).toBeInTheDocument()
  })
  
  it('renders in minimized state', () => {
    const minimizedPanel = { ...mockPanel, isMinimized: true }
    render(
      <DraggablePanel panel={minimizedPanel}>
        <div>Content</div>
      </DraggablePanel>
    )
    
    expect(screen.getByLabelText(/minimized/)).toBeInTheDocument()
  })
})
EOF

# Run tests
npm run test
```

**Day 3: Phase 2 Kickoff**

```bash
# Install Phase 2 dependencies
npm install @tanstack/react-virtual scheduler

# Create Phase 2 branch
git checkout -b feature/phase-2-performance

# Verify everything works
npm run lint
npm run test
npm run build
```

---

### WEEK 1: Core Performance Implementation

#### Monday: Web Worker Foundation

**Morning: Worker Setup**

```typescript
// src/workers/grid.worker.ts
/// <reference lib="webworker" />

interface WorkerMessage {
  type: 'INIT' | 'RENDER' | 'DRAG' | 'RESIZE' | 'DESTROY';
  payload: any;
}

let canvas: OffscreenCanvas;
let ctx: OffscreenCanvasRenderingContext2D;
let offscreenCanvas: OffscreenCanvas;
let offscreenCtx: OffscreenCanvasRenderingContext2D;

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, payload } = event.data;
  
  switch (type) {
    case 'INIT':
      initialize(payload);
      break;
    case 'RENDER':
      render(payload);
      break;
    case 'DRAG':
      handleDrag(payload);
      break;
    case 'RESIZE':
      resize(payload);
      break;
  }
};

function initialize(payload: { canvas: OffscreenCanvas; width: number; height: number }) {
  canvas = payload.canvas;
  ctx = canvas.getContext('2d')!;
  
  // Double buffer
  offscreenCanvas = new OffscreenCanvas(payload.width, payload.height);
  offscreenCtx = offscreenCanvas.getContext('2d')!;
  
  self.postMessage({ type: 'INITIALIZED' });
}

function render(payload: { panels: PanelThumbnail[] }) {
  // Clear offscreen
  offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  
  // Render panels
  payload.panels.forEach(panel => {
    renderPanel(offscreenCtx, panel);
  });
  
  // Composite
  ctx.drawImage(offscreenCanvas, 0, 0);
  
  self.postMessage({ type: 'FRAME_COMPLETE' });
}

function renderPanel(ctx: OffscreenCanvasRenderingContext2D, panel: PanelThumbnail) {
  // Background
  ctx.fillStyle = 'rgba(20, 20, 26, 0.95)';
  ctx.fillRect(panel.x, panel.y, panel.w, panel.h);
  
  // Border
  ctx.strokeStyle = panel.hubColor;
  ctx.lineWidth = 2;
  ctx.strokeRect(panel.x, panel.y, panel.w, panel.h);
  
  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = '12px sans-serif';
  ctx.fillText(panel.title, panel.x + 8, panel.y + 20);
}
```

**Afternoon: Hook Implementation**

```typescript
// src/hooks/useCanvasGrid.ts
import { useEffect, useRef, useCallback } from 'react';

export function useCanvasGrid(containerRef: RefObject<HTMLElement>) {
  const workerRef = useRef<Worker>();
  const canvasRef = useRef<HTMLCanvasElement>();
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create and transfer canvas
    const canvas = document.createElement('canvas');
    const offscreen = canvas.transferControlToOffscreen();
    
    // Initialize worker
    const worker = new Worker(
      new URL('../workers/grid.worker.ts', import.meta.url),
      { type: 'module' }
    );
    
    worker.postMessage({
      type: 'INIT',
      payload: { 
        canvas: offscreen,
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight
      }
    }, [offscreen]);
    
    workerRef.current = worker;
    canvasRef.current = canvas;
    
    return () => {
      worker.terminate();
      canvas.remove();
    };
  }, []);
  
  const updatePanels = useCallback((panels: PanelThumbnail[]) => {
    workerRef.current?.postMessage({
      type: 'RENDER',
      payload: { panels }
    });
  }, []);
  
  return { canvasRef, updatePanels };
}
```

#### Tuesday: Canvas Rendering & Double Buffering

**Tasks:**
- Implement full panel rendering in worker
- Add drag preview rendering
- Optimize for 60fps
- Add ResizeObserver for responsive sizing

#### Wednesday: Virtual Scrolling

```typescript
// src/components/grid/VirtualGrid.tsx
import { useVirtualizer } from '@tanstack/react-virtual';

export function VirtualGrid({ panels }: { panels: Panel[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  
  const rowVirtualizer = useVirtualizer({
    count: Math.ceil(panels.length / 6), // 6 columns
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // rowHeight
    overscan: 3,
  });
  
  const virtualRows = rowVirtualizer.getVirtualItems();
  
  return (
    <div ref={parentRef} style={{ height: '100vh', overflow: 'auto' }}>
      <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
        {virtualRows.map(virtualRow => (
          <div
            key={virtualRow.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {/* Render panels in this row */}
          </div>
        ))}
      </div>
    </div>
  );
}
```

#### Thursday: State Management Splitting

```typescript
// Split stores for performance
// 1. Static store (layout, theme) - persisted
// 2. Dynamic store (panels, positions) - frequent updates
// 3. Ephemeral store (drag state, hover) - UI only

const useStaticStore = create(persist(...));
const useDynamicStore = create(...);
const useEphemeralStore = create(...);
```

#### Friday: Integration & Testing

**Tasks:**
- Integrate Web Worker + Virtual Grid
- Implement hybrid mode (DOM/Canvas switching)
- Performance testing with 50 panels
- Document API and usage

---

### WEEK 2: PWA & Production Optimization

#### Monday: Service Worker

```typescript
// public/service-worker.ts
const CACHE_NAME = 'tenet-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/assets/index.js',
  '/assets/index.css'
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

// Fetch: Cache-first strategy
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
```

#### Tuesday: Code Splitting

```typescript
// Route-based lazy loading
const SATORHub = lazy(() => import('./pages/SATORHub'));
const ROTASHub = lazy(() => import('./pages/ROTASHub'));

// Preload on hover
const preloadHub = (hub: string) => {
  const hubs: Record<string, () => Promise<any>> = {
    SATOR: () => import('./pages/SATORHub'),
    ROTAS: () => import('./pages/ROTASHub'),
    // ...
  };
  hubs[hub]?.();
};
```

#### Wednesday: Bundle Optimization

```javascript
// vite.config.js - Manual chunks
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-core': ['react', 'react-dom'],
          'vendor-state': ['zustand', '@tanstack/react-query'],
          'vendor-motion': ['framer-motion'],
          'vendor-three': ['three', '@react-three/fiber'],
        }
      }
    }
  }
});
```

#### Thursday: Testing & Coverage

**Tasks:**
- Write tests for new components
- Achieve >80% coverage
- Add E2E tests for critical paths
- Performance benchmarks

#### Friday: Documentation & Review

**Tasks:**
- Update API documentation
- Write runbooks
- Code review
- Merge to main

---

## TECHNICAL DECISION RECORDS

### TDR-001: Web Workers for Canvas Rendering

**Context:** Need 60fps performance with 50+ panels

**Decision:** Use OffscreenCanvas in Web Worker

**Consequences:**
- ✅ True parallelism, no main thread blocking
- ✅ 60fps achievable
- ⚠️ Safari <16.4 doesn't support OffscreenCanvas
- ⚠️ More complex architecture

**Mitigation:** Implement main thread fallback

---

### TDR-002: TanStack Virtual vs Custom Implementation

**Context:** Need virtual scrolling for 100+ panels

**Decision:** Use @tanstack/react-virtual

**Consequences:**
- ✅ Battle-tested, well-maintained
- ✅ Excellent accessibility
- ✅ Dynamic sizing support
- ⚠️ Additional dependency

---

### TDR-003: Zustand Store Splitting

**Context:** Full store subscription causes unnecessary re-renders

**Decision:** Split into Static/Dynamic/Ephemeral stores

**Consequences:**
- ✅ Granular subscriptions
- ✅ Better performance
- ⚠️ More complex state management

---

## TROUBLESHOOTING GUIDE

### Issue: Web Worker not initializing

**Symptoms:** Canvas blank, no worker errors

**Diagnosis:**
```javascript
// Check support
console.log('OffscreenCanvas:', 'OffscreenCanvas' in window);
console.log('Worker:', 'Worker' in window);
```

**Solution:**
- Verify browser support
- Check worker file path
- Ensure proper MIME type

### Issue: Memory leaks with panels

**Symptoms:** Memory grows over time, eventual crash

**Diagnosis:**
```javascript
// Chrome DevTools Memory tab
// Take heap snapshots, compare
```

**Solution:**
- Implement LRU eviction
- Cleanup event listeners
- Use WeakMap for caches

### Issue: Virtual scroll jumping

**Symptoms:** Scroll position jumps when new items load

**Solution:**
```typescript
// Ensure stable item sizes
estimateSize: useCallback(() => ROW_HEIGHT, [])

// Or measure actual sizes
measureElement: true
```

---

## CHECKLISTS

### Pre-Commit Checklist

- [ ] Code passes ESLint
- [ ] Tests pass (`npm run test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No console errors
- [ ] Accessibility verified (axe-core)

### Pre-Release Checklist

- [ ] Test coverage >80%
- [ ] Lighthouse score >90
- [ ] Bundle size <500KB
- [ ] Performance tested (60fps)
- [ ] Documentation updated
- [ ] Runbooks written

### Phase 2 Completion Checklist

- [ ] Web Worker Canvas rendering
- [ ] Virtual scrolling with 100 panels
- [ ] PWA offline functionality
- [ ] Code splitting active
- [ ] Bundle <500KB initial
- [ ] Lighthouse >90
- [ ] Tests >80% coverage
- [ ] Documentation complete

---

## METRICS & MONITORING

### Development Metrics

| Metric | Target | Tool | Frequency |
|--------|--------|------|-----------|
| Build time | <5 min | CI | Every commit |
| Test coverage | >80% | Vitest | Every PR |
| Bundle size | <500KB | Analyzer | Every release |
| Lint errors | 0 | ESLint | Every commit |

### Production Metrics

| Metric | Target | Tool | Alert |
|--------|--------|------|-------|
| FPS | 60 | Chrome | <45 |
| Memory | <200MB | Performance API | >300MB |
| API latency | <100ms | Prometheus | >200ms |
| Error rate | <0.1% | Sentry | >1% |

---

## APPENDICES

### A. File Structure Reference

```
apps/website-v2/src/
├── components/
│   ├── grid/
│   │   ├── DraggablePanel.tsx
│   │   ├── PanelSkeleton.tsx
│   │   ├── PanelErrorBoundary.tsx
│   │   ├── VirtualGrid.tsx          ← NEW (Phase 2)
│   │   └── HybridGrid.tsx           ← NEW (Phase 2)
│   └── ui/
├── hooks/
│   ├── useCanvasGrid.ts             ← NEW (Phase 2)
│   ├── useVirtualPanels.ts          ← NEW (Phase 2)
│   └── usePanelLifecycle.ts         ← NEW (Phase 2)
├── workers/
│   └── grid.worker.ts               ← NEW (Phase 2)
├── stores/
│   ├── staticStore.ts               ← NEW (Phase 2)
│   ├── dynamicStore.ts              ← NEW (Phase 2)
│   └── ephemeralStore.ts            ← NEW (Phase 2)
└── utils/
    └── lruCache.ts                  ← NEW (Phase 2)
```

### B. Command Reference

```bash
# Development
npm run dev              # Start dev server
npm run test             # Run tests
npm run test:ui          # Run tests with UI
npm run coverage         # Generate coverage report
npm run lint             # Run ESLint

# Build
npm run build            # Production build
npm run preview          # Preview production build

# Analysis
npm run analyze          # Bundle analysis
```

### C. Dependency Reference

```json
{
  "Phase 2 Additions": {
    "@tanstack/react-virtual": "^3.0.0",
    "scheduler": "^0.23.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.0.0",
    "eslint": "^8.0.0"
  }
}
```

---

**Document Control:**
- Version: 1.0.0
- Last Updated: 2026-03-13
- Owner: Development Team
- Next Review: 2026-03-20

*End of Implementation Guide*
