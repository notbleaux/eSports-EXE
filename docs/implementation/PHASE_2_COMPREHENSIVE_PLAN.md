[Ver001.000]

# PHASE 2 — COMPREHENSIVE PERFORMANCE OPTIMIZATION PLAN
## 4NJZ4 TENET Platform: Production-Ready Performance

**Phase Duration:** 1.5 weeks  
**Estimated Effort:** 60-75 hours  
**Target Performance:** 60fps grid operations, <100ms API response

---

## I. PHASE 2 OBJECTIVES

### Primary Goals

1. **Grid Rendering:** 60fps drag operations with 50+ panels
2. **Memory Management:** LRU panel eviction preventing OOM
3. **API Performance:** Sub-100ms response times
4. **Bundle Optimization:** Code splitting by hub
5. **Database Optimization:** Index strategy + query optimization

### Success Criteria

| Metric | Current (Est) | Target |
|--------|--------------|--------|
| Grid drag FPS | ~40-50fps | 60fps |
| Initial load | ~3-5s | <2s |
| API response | ~200-500ms | <100ms |
| Bundle size | ~800KB | <500KB (initial) |
| Memory per panel | ~5MB | <2MB |
| Max panels | ~20 | 50+ |

---

## II. WORK STREAMS

### Work Stream A: Canvas Minimap System (15 hours)

**Purpose:** Offload grid rendering to Canvas for 60fps performance

#### A.1 Canvas Grid Renderer

**New File:** `src/components/grid/CanvasGridRenderer.jsx`

```typescript
// Core responsibilities:
// 1. Render panel thumbnails to Canvas (not DOM)
// 2. Handle drag interactions on Canvas
// 3. Sync with react-grid-layout for final positions

interface CanvasGridRendererProps {
  panels: Panel[];
  layout: LayoutItem[];
  onLayoutChange: (layout: LayoutItem[]) => void;
  width: number;
  height: number;
}

// Implementation approach:
// - OffscreenCanvas for background rendering
// - RequestAnimationFrame for smooth animations
// - Hit detection for panel selection
// - Double-buffering to prevent flicker
```

**Implementation Steps:**

1. **Create Canvas renderer component** (4 hours)
   - Setup Canvas 2D context
   - Implement panel thumbnail rendering
   - Add hit detection (panel picking)

2. **Add animation frame loop** (3 hours)
   - requestAnimationFrame integration
   - Smooth drag interpolation
   - Frame timing optimization

3. **Sync with react-grid-layout** (4 hours)
   - Bidirectional state sync
   - Position interpolation
   - Finalize-on-drop behavior

4. **Performance testing & tuning** (4 hours)
   - 60fps verification
   - Memory leak testing
   - Edge case handling

#### A.2 Hybrid Rendering Mode

**File:** `src/components/QuaternaryGrid.jsx`

```typescript
// Add hybrid rendering support
interface GridRenderMode {
  mode: 'dom' | 'canvas' | 'hybrid';
  canvasThreshold: number; // Switch to canvas above N panels
}

// Default: Use Canvas for >10 panels
// Hybrid: Canvas during drag, DOM at rest
```

#### A.3 Deliverables

- [ ] `CanvasGridRenderer.jsx` - Full Canvas implementation
- [ ] `useCanvasGrid.js` - Hook for Canvas operations
- [ ] Render mode selector in UI
- [ ] Performance benchmark suite

---

### Work Stream B: Panel Virtualization (12 hours)

**Purpose:** Only render visible panels, virtualize off-screen

#### B.1 Virtual Scrolling System

**New File:** `src/components/grid/VirtualGrid.jsx`

```typescript
// Virtual grid that only renders panels in viewport

interface VirtualGridProps {
  panels: Panel[];
  viewportWidth: number;
  viewportHeight: number;
  overscan: number; // Render N panels beyond viewport
}

// Calculate visible panels based on scroll position
// Use IntersectionObserver for visibility detection
// Maintain panel state while virtualized
```

#### B.2 Intersection Observer Integration

**New File:** `src/hooks/usePanelVisibility.js`

```javascript
// Track panel visibility efficiently
export function usePanelVisibility(panelId) {
  const [isVisible, setIsVisible] = useState(true);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    
    const element = document.getElementById(`panel-${panelId}`);
    if (element) observer.observe(element);
    
    return () => observer.disconnect();
  }, [panelId]);
  
  return isVisible;
}
```

#### B.3 Deliverables

- [ ] `VirtualGrid.jsx` - Virtual scrolling implementation
- [ ] `usePanelVisibility.js` - Visibility tracking hook
- [ ] `PanelPlaceholder.jsx` - Lightweight placeholder
- [ ] Virtual scroll demo with 100 panels

---

### Work Stream C: LRU Panel Eviction (10 hours)

**Purpose:** Prevent memory bloat with automatic panel lifecycle

#### C.1 LRU Cache Implementation

**New File:** `src/utils/lruCache.js`

```typescript
// Generic LRU cache for panel management
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;
  
  constructor(maxSize: number) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }
  
  set(key: K, value: V): void {
    if (this.cache.size >= this.maxSize) {
      // Evict oldest
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
}

// Panel-specific: Evict oldest panels when limit reached
```

#### C.2 Panel Lifecycle Manager

**New File:** `src/store/panelLifecycle.js`

```javascript
// Manage panel lifecycle with LRU eviction

const PANEL_MEMORY_LIMIT = 20; // Max panels in memory
const PANEL_STATE_LIMIT = 50;  // Max panels in state (virtualized)

export function usePanelLifecycle() {
  const { panels, removePanel } = useGridStore();
  const lruCache = useRef(new LRUCache(20));
  
  // Track panel access
  const touchPanel = useCallback((panelId) => {
    lruCache.current.get(panelId);
  }, []);
  
  // Evict oldest panel when limit reached
  const evictIfNeeded = useCallback(() => {
    if (panels.length > PANEL_MEMORY_LIMIT) {
      const oldestId = lruCache.current.getOldest();
      if (oldestId) {
        removePanel(oldestId);
      }
    }
  }, [panels.length, removePanel]);
  
  return { touchPanel, evictIfNeeded };
}
```

#### C.3 Deliverables

- [ ] `lruCache.js` - Generic LRU implementation
- [ ] `usePanelLifecycle.js` - Panel lifecycle hook
- [ ] Eviction UI notification
- [ ] Memory usage dashboard

---

### Work Stream D: Code Splitting (10 hours)

**Purpose:** Reduce initial bundle size, lazy load by hub

#### D.1 Hub-Based Dynamic Imports

**Modify:** `src/components/grid/DraggablePanel.jsx`

```typescript
// Lazy load panel content by hub

const HubPanels = {
  SATOR: lazy(() => import('../hubs/sator/SATORPanels')),
  ROTAS: lazy(() => import('../hubs/rotas/ROTASPanels')),
  AREPO: lazy(() => import('../hubs/arepo/AREPOPanels')),
  OPERA: lazy(() => import('../hubs/opera/OPERAPanels')),
  TENET: lazy(() => import('../hubs/tenet/TENETPanels')),
};

// Use Suspense with fallback
<Suspense fallback={<PanelSkeleton />}>
  <HubPanel panelType={panel.type} />
</Suspense>
```

#### D.2 Route-Based Code Splitting

**Modify:** `src/App.jsx`

```typescript
// Lazy load entire hub sections

const SATORHub = lazy(() => import('./pages/SATORHub'));
const ROTASHub = lazy(() => import('./pages/ROTASHub'));
const AREPOHub = lazy(() => import('./pages/AREPOHub'));
const OPERAHub = lazy(() => import('./pages/OPERAHub'));
const TENETHub = lazy(() => import('./pages/TENETHub'));

// Router with lazy loading
<Route path="/sator/*" element={
  <Suspense fallback={<HubLoader />}>
    <SATORHub />
  </Suspense>
} />
```

#### D.3 Vendor Chunking

**Modify:** `vite.config.js`

```javascript
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Core framework
          'vendor-core': ['react', 'react-dom', 'react-router-dom'],
          
          // State & data
          'vendor-state': ['zustand', '@tanstack/react-query'],
          
          // UI components
          'vendor-ui': ['lucide-react', '@radix-ui/*'],
          
          // Grid system
          'vendor-grid': ['react-grid-layout'],
          
          // Visualization (large)
          'vendor-viz': ['three', '@react-three/fiber', 'd3'],
          
          // Animation
          'vendor-motion': ['framer-motion'],
        }
      }
    }
  }
});
```

#### D.4 Deliverables

- [ ] Hub-based lazy loading
- [ ] Route-based code splitting
- [ ] Vendor chunking strategy
- [ ] Bundle analyzer report
- [ ] <500KB initial bundle

---

### Work Stream E: API Performance (12 hours)

**Purpose:** Sub-100ms API response times

#### E.1 Database Query Optimization

**File:** `packages/shared/axiom-esports-data/api/src/db.py`

```python
# Add query optimization hints

# 1. Add strategic indexes
# Migration: 006_performance_indexes.sql
"""
CREATE INDEX CONCURRENTLY idx_player_performance_lookup 
    ON player_performance(player_id, realworld_time DESC);

CREATE INDEX CONCURRENTLY idx_matches_time 
    ON matches(match_time DESC);

CREATE INDEX CONCURRENTLY idx_events_timestamp 
    ON events(timestamp DESC);
"""

# 2. Optimize get_player_list with cursor pagination
async def get_player_list_paginated(
    cursor: Optional[str] = None,
    limit: int = 20,
    filters: Optional[dict] = None
) -> dict:
    """Cursor-based pagination for better performance"""
    pool = await db.get_pool()
    
    # Build optimized query
    where_clause = build_where_clause(filters)
    
    query = f"""
    SELECT player_id, name, team, region, role,
           kills, deaths, acs, adr, kast_pct, sim_rating
    FROM player_performance
    {where_clause}
    AND ($1::text IS NULL OR 
         (realworld_time, player_id) < (
             SELECT realworld_time, player_id 
             FROM player_performance 
             WHERE player_id = $1
         ))
    ORDER BY realworld_time DESC, player_id DESC
    LIMIT $2
    """
    
    async with pool.acquire() as conn:
        rows = await conn.fetch(query, cursor, limit)
        
    # Get next cursor
    next_cursor = rows[-1]['player_id'] if len(rows) == limit else None
    
    return {
        'players': [dict(row) for row in rows],
        'next_cursor': next_cursor,
        'has_more': next_cursor is not None
    }
```

#### E.2 Response Caching Layer

**New File:** `packages/shared/axiom-esports-data/api/src/cache.py`

```python
# Simple in-memory cache with TTL

from functools import wraps
from typing import Callable, Any
import time
import hashlib

class ResponseCache:
    def __init__(self, default_ttl: int = 300):
        self.cache = {}
        self.default_ttl = default_ttl
    
    def get(self, key: str) -> Any:
        if key in self.cache:
            value, expiry = self.cache[key]
            if time.time() < expiry:
                return value
            del self.cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl: int = None):
        expiry = time.time() + (ttl or self.default_ttl)
        self.cache[key] = (value, expiry)
    
    def cached(self, ttl: int = None):
        def decorator(func: Callable):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # Generate cache key
                cache_key = hashlib.md5(
                    f"{func.__name__}:{args}:{kwargs}".encode()
                ).hexdigest()
                
                # Try cache
                cached = self.get(cache_key)
                if cached:
                    return cached
                
                # Execute and cache
                result = await func(*args, **kwargs)
                self.set(cache_key, result, ttl)
                return result
            return wrapper
        return decorator

# Global cache instance
cache = ResponseCache()
```

#### E.3 API Response Compression

**File:** `packages/shared/axiom-esports-data/api/main.py`

```python
from fastapi.middleware.gzip import GZipMiddleware

# Add compression middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Also enable brotli if available
try:
    from starlette.middleware.compression import CompressionMiddleware
    app.add_middleware(CompressionMiddleware, minimum_size=1000)
except ImportError:
    pass
```

#### E.4 Deliverables

- [ ] Migration `006_performance_indexes.sql`
- [ ] Cursor pagination for player lists
- [ ] Response caching layer
- [ ] Gzip/Brotli compression
- [ ] API benchmark suite (<100ms target)

---

### Work Stream F: Testing & Validation (6 hours)

**Purpose:** Ensure all optimizations work correctly

#### F.1 Performance Test Suite

**New File:** `tests/performance/grid.perf.test.js`

```javascript
// Performance benchmarks for grid system

describe('Grid Performance', () => {
  it('maintains 60fps during drag with 50 panels', async () => {
    const fps = await measureDragFPS(50);
    expect(fps).toBeGreaterThanOrEqual(60);
  });
  
  it('renders initial grid in <100ms', async () => {
    const renderTime = await measureRenderTime();
    expect(renderTime).toBeLessThan(100);
  });
  
  it('memory usage <100MB for 20 panels', async () => {
    const memory = await measureMemoryUsage(20);
    expect(memory).toBeLessThan(100 * 1024 * 1024);
  });
});
```

#### F.2 API Load Testing

**Update:** `tests/load/locustfile.py`

```python
from locust import HttpUser, task, between

class APIUser(HttpUser):
    wait_time = between(1, 3)
    
    @task(3)
    def get_players(self):
        self.client.get("/api/players/", params={"limit": 20})
    
    @task(2)
    def get_player_detail(self):
        self.client.get("/api/players/player_001")
    
    @task(1)
    def get_leaderboard(self):
        self.client.get("/api/analytics/leaderboard")
```

#### F.3 Deliverables

- [ ] Grid performance test suite
- [ ] API load testing
- [ ] Memory leak detection
- [ ] Performance dashboard

---

## III. IMPLEMENTATION SCHEDULE

### Week 1: Core Performance (36 hours)

| Day | Task | Hours | Output |
|-----|------|-------|--------|
| Mon | Canvas Grid Renderer | 8 | CanvasGridRenderer.jsx |
| Tue | Canvas Animation Loop | 8 | 60fps drag verified |
| Wed | Virtual Scrolling | 8 | VirtualGrid.jsx |
| Thu | LRU Cache System | 6 | lruCache.js, panelLifecycle.js |
| Fri | Integration & Testing | 6 | Working prototype |

### Week 2: Optimization & Polish (36 hours)

| Day | Task | Hours | Output |
|-----|------|-------|--------|
| Mon | Code Splitting | 8 | Hub-based lazy loading |
| Tue | Bundle Optimization | 6 | <500KB initial bundle |
| Wed | DB Indexes & Caching | 8 | Migration 006, cache.py |
| Thu | API Optimization | 6 | <100ms responses |
| Fri | Testing & Documentation | 8 | Full test suite |

---

## IV. TECHNICAL SPECIFICATIONS

### Canvas Renderer Details

```typescript
// Rendering approach for 60fps

class CanvasGridRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private offscreenCanvas: OffscreenCanvas;
  private panels: Map<string, PanelThumbnail>;
  
  render() {
    // 1. Clear offscreen canvas
    this.offscreenCtx.clearRect(0, 0, width, height);
    
    // 2. Render panel thumbnails (not full DOM)
    this.panels.forEach(panel => {
      this.renderThumbnail(panel);
    });
    
    // 3. Composite to main canvas
    this.ctx.drawImage(this.offscreenCanvas, 0, 0);
    
    // 4. Request next frame if animating
    if (this.isAnimating) {
      requestAnimationFrame(() => this.render());
    }
  }
}
```

### Virtual Scrolling Algorithm

```typescript
// Efficient viewport calculation

function getVisiblePanels(
  panels: Panel[],
  scrollX: number,
  scrollY: number,
  viewportW: number,
  viewportH: number,
  overscan: number = 2
): Panel[] {
  return panels.filter(panel => {
    const panelRight = panel.x + panel.w;
    const panelBottom = panel.y + panel.h;
    
    // Check intersection with viewport + overscan
    return (
      panelRight >= scrollX - overscan &&
      panel.x <= scrollX + viewportW + overscan &&
      panelBottom >= scrollY - overscan &&
      panel.y <= scrollY + viewportH + overscan
    );
  });
}
```

---

## V. RISK MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| Canvas compatibility | High | Fallback to DOM mode |
| Memory leaks in Canvas | Medium | Automated testing |
| Lazy loading UX | Medium | Skeleton placeholders |
| Cache invalidation | Medium | Versioned cache keys |
| Index migration time | Low | CONCURRENTLY indexes |

---

## VI. SUCCESS METRICS

### Performance Targets

| Metric | Before | After | Verification |
|--------|--------|-------|--------------|
| Drag FPS | ~40fps | 60fps | Chrome DevTools |
| Initial Load | ~3s | <2s | Lighthouse |
| API Latency | ~200ms | <100ms | k6/locust |
| Bundle Size | ~800KB | <500KB | Bundle analyzer |
| Memory Usage | ~5MB/panel | <2MB/panel | Chrome Memory |

### Code Quality

- Test coverage >80%
- Zero console warnings
- Lighthouse score >90
- No memory leaks (verified with 1hr test)

---

## VII. PHASE 2 COMPLETION CRITERIA

✅ **Canvas Minimap:** 60fps with 50+ panels  
✅ **Virtual Scrolling:** Smooth with 100 panels  
✅ **LRU Eviction:** Memory stable at 20 panels  
✅ **Code Splitting:** <500KB initial bundle  
✅ **API Performance:** <100ms response times  
✅ **Test Coverage:** >80% with perf tests  
✅ **Documentation:** All changes documented

---

*End of Phase 2 Comprehensive Plan*
