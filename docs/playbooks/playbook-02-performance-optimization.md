[Ver001.000]

# Playbook 2: Performance Optimization

## Objective
Implement comprehensive performance optimizations for the 4NJZ4 TENET Platform including Web Workers for heavy computations, Canvas rendering for SATOR Square visualization, virtual scrolling for large datasets, and bundle optimization techniques.

## Prerequisites
- [ ] Playbook 1 completed
- [ ] TypeScript types configured
- [ ] Build system working (Vite)
- [ ] Large datasets available for testing

## Step-by-Step Instructions

### Step 1: Web Workers Implementation

**Objective:** Move heavy computations off the main thread.

```bash
# From apps/website-v2
# Install worker-loader if not present
npm install --save-dev worker-loader
```

**Create SimRating Calculation Worker:**

```typescript
// apps/website-v2/src/workers/simrating.worker.ts
import { SimRatingCalculator } from '@shared/analytics/simrating';

export interface SimRatingWorkerMessage {
  type: 'CALCULATE' | 'BATCH_CALCULATE';
  payload: {
    playerStats: PlayerStats[];
    matchContext: MatchContext;
  };
}

export interface SimRatingWorkerResponse {
  type: 'RESULT' | 'ERROR' | 'PROGRESS';
  data?: SimRatingResult[];
  progress?: number;
  error?: string;
}

self.onmessage = (event: MessageEvent<SimRatingWorkerMessage>) => {
  const { type, payload } = event.data;

  try {
    if (type === 'CALCULATE') {
      const calculator = new SimRatingCalculator();
      const result = calculator.calculate(payload.playerStats[0], payload.matchContext);
      self.postMessage({ type: 'RESULT', data: [result] });
    } else if (type === 'BATCH_CALCULATE') {
      const calculator = new SimRatingCalculator();
      const results: SimRatingResult[] = [];
      
      payload.playerStats.forEach((stats, index) => {
        const result = calculator.calculate(stats, payload.matchContext);
        results.push(result);
        
        // Report progress every 10 items
        if (index % 10 === 0) {
          self.postMessage({
            type: 'PROGRESS',
            progress: (index / payload.playerStats.length) * 100
          });
        }
      });
      
      self.postMessage({ type: 'RESULT', data: results });
    }
  } catch (error) {
    self.postMessage({
      type: 'ERROR',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};
```

**Create Worker Hook:**

```typescript
// apps/website-v2/src/hooks/useSimRatingWorker.ts
import { useEffect, useRef, useCallback, useState } from 'react';
import type { SimRatingWorkerMessage, SimRatingWorkerResponse } from '../workers/simrating.worker';

export function useSimRatingWorker() {
  const workerRef = useRef<Worker | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Vite handles worker imports
    workerRef.current = new Worker(
      new URL('../workers/simrating.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (event: MessageEvent<SimRatingWorkerResponse>) => {
      const { type, data, progress: workerProgress, error: workerError } = event.data;

      if (type === 'PROGRESS') {
        setProgress(workerProgress || 0);
      } else if (type === 'RESULT') {
        setIsLoading(false);
        setProgress(100);
      } else if (type === 'ERROR') {
        setIsLoading(false);
        setError(workerError || 'Worker error');
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const calculateSimRating = useCallback((message: SimRatingWorkerMessage) => {
    setIsLoading(true);
    setError(null);
    setProgress(0);
    workerRef.current?.postMessage(message);
  }, []);

  return { calculateSimRating, isLoading, progress, error };
}
```

**Verification:**
```bash
# Build to ensure worker compiles
npm run build

# Run tests
npm run test -- src/hooks/useSimRatingWorker.test.ts
```

### Step 2: Canvas Rendering Setup

**Objective:** Implement Canvas-based rendering for SATOR Square visualization.

```bash
# Install Canvas types if not present
npm install --save-dev @types/offscreencanvas
```

**Create Canvas Renderer Component:**

```typescript
// apps/website-v2/src/components/canvas/SATORCanvasRenderer.tsx
import { useEffect, useRef, useCallback } from 'react';

interface SATORCanvasRendererProps {
  width: number;
  height: number;
  layers: SATORLayer[];
  onLayerClick?: (layerId: string, x: number, y: number) => void;
}

export function SATORCanvasRenderer({
  width,
  height,
  layers,
  onLayerClick
}: SATORCanvasRendererProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Render layers
    layers.forEach(layer => {
      ctx.save();
      
      // Apply layer transforms
      ctx.globalAlpha = layer.opacity;
      ctx.translate(layer.x, layer.y);
      ctx.rotate(layer.rotation);
      ctx.scale(layer.scale, layer.scale);

      // Render based on layer type
      switch (layer.type) {
        case 'SATOR':
          renderSATORLayer(ctx, layer);
          break;
        case 'ROTAS':
          renderROTASLayer(ctx, layer);
          break;
        case 'AREPO':
          renderAREPOLayer(ctx, layer);
          break;
        case 'OPERA':
          renderOPERALayer(ctx, layer);
          break;
        case 'TENET':
          renderTENETLayer(ctx, layer);
          break;
      }

      ctx.restore();
    });

    // Request next frame
    animationFrameRef.current = requestAnimationFrame(render);
  }, [layers, width, height]);

  useEffect(() => {
    render();
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [render]);

  const handleClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !onLayerClick) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find clicked layer (reverse order for proper z-index)
    for (let i = layers.length - 1; i >= 0; i--) {
      const layer = layers[i];
      if (isPointInLayer(x, y, layer)) {
        onLayerClick(layer.id, x, y);
        break;
      }
    }
  }, [layers, onLayerClick]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      onClick={handleClick}
      className="cursor-pointer"
      style={{ width: '100%', height: '100%' }}
    />
  );
}

// Helper functions
function renderSATORLayer(ctx: CanvasRenderingContext2D, layer: SATORLayer) {
  // SATOR layer rendering logic
  ctx.fillStyle = layer.color;
  ctx.beginPath();
  ctx.arc(0, 0, layer.radius, 0, Math.PI * 2);
  ctx.fill();
}

function isPointInLayer(x: number, y: number, layer: SATORLayer): boolean {
  // Hit detection logic
  const dx = x - layer.x;
  const dy = y - layer.y;
  return Math.sqrt(dx * dx + dy * dy) <= layer.radius;
}
```

**Verification:**
```bash
# Type check
npm run typecheck

# Verify Canvas API usage
npx eslint src/components/canvas/ --ext .tsx
```

### Step 3: Virtual Scrolling with TanStack

**Objective:** Implement virtual scrolling for large player/match lists.

```bash
# Install TanStack Virtual
npm install @tanstack/react-virtual
```

**Create Virtual List Component:**

```typescript
// apps/website-v2/src/components/virtual/VirtualPlayerList.tsx
import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { PlayerCard } from '../cards/PlayerCard';

interface VirtualPlayerListProps {
  players: Player[];
  itemHeight?: number;
  overscan?: number;
}

export function VirtualPlayerList({
  players,
  itemHeight = 80,
  overscan = 5
}: VirtualPlayerListProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: players.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan,
    measureElement:
      typeof window !== 'undefined' &&
      navigator.userAgent.indexOf('Firefox') === -1
        ? (element) => element.getBoundingClientRect().height
        : undefined,
  });

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={parentRef}
      className="h-[600px] overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
          }}
        >
          {virtualItems.map((virtualItem) => (
            <div
              key={virtualItem.key}
              data-index={virtualItem.index}
              ref={virtualizer.measureElement}
            >
              <PlayerCard player={players[virtualItem.index]} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
```

**Create Virtual Match Grid:**

```typescript
// apps/website-v2/src/components/virtual/VirtualMatchGrid.tsx
import { useRef, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';

interface VirtualMatchGridProps {
  matches: Match[];
  columns?: number;
  itemHeight?: number;
}

export function VirtualMatchGrid({
  matches,
  columns = 3,
  itemHeight = 200
}: VirtualMatchGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(matches.length / columns);

  const virtualizer = useVirtualizer({
    count: rowCount,
    getScrollElement: () => parentRef.current,
    estimateSize: () => itemHeight,
    overscan: 3,
  });

  const renderRow = useCallback((rowIndex: number) => {
    const startIndex = rowIndex * columns;
    const rowMatches = matches.slice(startIndex, startIndex + columns);

    return (
      <div className="grid grid-cols-3 gap-4 mb-4">
        {rowMatches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
        {/* Fill empty slots */}
        {Array.from({ length: columns - rowMatches.length }).map((_, i) => (
          <div key={`empty-${i}`} className="invisible">
            <MatchCard match={null} />
          </div>
        ))}
      </div>
    );
  }, [matches, columns]);

  return (
    <div
      ref={parentRef}
      className="h-[800px] overflow-auto"
      style={{ contain: 'strict' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {renderRow(virtualItem.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
```

**Verification:**
```bash
# Test virtual scrolling
npm run test -- src/components/virtual/

# Verify smooth scrolling behavior
npm run dev
# Navigate to player/match lists and test with 1000+ items
```

### Step 4: Bundle Optimization

**Objective:** Optimize JavaScript bundle size.

```bash
# Install bundle analyzer
npm install --save-dev @vitejs/plugin-visualizer
```

**Update Vite Config:**

```typescript
// apps/website-v2/vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

export default defineConfig({
  plugins: [
    react(),
    process.env.ANALYZE && visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'dist/stats.html',
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-router': ['react-router-dom'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-three': ['three', '@react-three/fiber'],
          'vendor-d3': ['d3'],
          'vendor-charts': ['recharts'],
          'vendor-motion': ['framer-motion'],
          // Feature chunks
          'analytics': ['./src/analytics/index.ts'],
          'visualization': ['./src/visualization/index.ts'],
        },
      },
    },
    chunkSizeWarningLimit: 500,
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'zustand',
      '@tanstack/react-query',
    ],
  },
});
```

**Implement Dynamic Imports:**

```typescript
// apps/website-v2/src/components/lazy/SATORVisualization.tsx
import { Suspense, lazy } from 'react';
import { LoadingSpinner } from '../ui/LoadingSpinner';

const SATORSquare = lazy(() => import('./SATORSquare'));
const ROTASViewer = lazy(() => import('./ROTASViewer'));

export function SATORVisualization() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SATORSquare />
    </Suspense>
  );
}

export function ROTASMatchViewer() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ROTASViewer />
    </Suspense>
  );
}
```

**Analyze Bundle:**

```bash
# Run with bundle analysis
ANALYZE=true npm run build

# Check output
ls -lh dist/assets/
```

**Verification:**
```bash
# Check bundle sizes
find dist/assets -name "*.js" -exec ls -lh {} \;

# Verify chunks are loaded on demand
# Open browser DevTools Network tab
# Navigate to different sections and observe lazy loading
```

### Step 5: Image Optimization

**Objective:** Optimize image loading and formats.

```bash
# Install image optimization
npm install --save-dev vite-plugin-imagemin
```

**Create Responsive Image Component:**

```typescript
// apps/website-v2/src/components/ui/OptimizedImage.tsx
import { useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  loading?: 'lazy' | 'eager';
  sizes?: string;
  className?: string;
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  loading = 'lazy',
  sizes = '100vw',
  className,
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate srcset for responsive images
  const generateSrcSet = () => {
    if (!src) return '';
    const widths = [320, 640, 960, 1280, 1920];
    return widths
      .map((w) => `${src.replace(/\.(jpe?g|png)$/, `-${w}.$1`)} ${w}w`)
      .join(', ');
  };

  useEffect(() => {
    // Preload critical images
    if (loading === 'eager') {
      const img = new Image();
      img.src = src;
    }
  }, [src, loading]);

  if (error) {
    return (
      <div
        className={`bg-gray-800 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <span className="text-gray-500">Failed to load image</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      sizes={sizes}
      srcSet={generateSrcSet()}
      className={`transition-opacity duration-300 ${
        isLoaded ? 'opacity-100' : 'opacity-0'
      } ${className}`}
      onLoad={() => setIsLoaded(true)}
      onError={() => setError(true)}
    />
  );
}
```

**Verification:**
```bash
# Build and check image assets
npm run build
ls -lh dist/assets/ | grep -E "\.(png|jpg|webp|avif)$"
```

### Step 6: Memory Leak Prevention

**Objective:** Implement cleanup patterns to prevent memory leaks.

```typescript
// apps/website-v2/src/hooks/useCleanup.ts
import { useEffect, useRef } from 'react';

export function useCleanup() {
  const cleanupRef = useRef<Set<() => void>>(new Set());

  const addCleanup = (cleanup: () => void) => {
    cleanupRef.current.add(cleanup);
    return () => {
      cleanupRef.current.delete(cleanup);
    };
  };

  useEffect(() => {
    return () => {
      cleanupRef.current.forEach((cleanup) => {
        try {
          cleanup();
        } catch (error) {
          console.error('Cleanup error:', error);
        }
      });
      cleanupRef.current.clear();
    };
  }, []);

  return addCleanup;
}

// Usage example
export function useAnimationFrame(callback: (time: number) => void) {
  const addCleanup = useCleanup();

  useEffect(() => {
    let animationId: number;
    
    const animate = (time: number) => {
      callback(time);
      animationId = requestAnimationFrame(animate);
    };
    
    animationId = requestAnimationFrame(animate);
    
    addCleanup(() => cancelAnimationFrame(animationId));
  }, [callback, addCleanup]);
}
```

**Verification:**
```bash
# Run memory profiling
# In Chrome DevTools:
# 1. Performance tab → Record
# 2. Navigate through app
# 3. Force garbage collection
# 4. Check for memory leaks
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Web Worker not loading | Ensure Vite worker import syntax is correct |
| Canvas blurry on retina | Set `canvas.width = displayWidth * devicePixelRatio` |
| Virtual scroll jumping | Use `measureElement` for dynamic heights |
| Large bundle size | Check for duplicate dependencies with `npm ls` |
| Lazy load chunk errors | Implement error boundaries and retry logic |
| Canvas memory leaks | Call `ctx.clearRect()` and cancel animations |
| Virtual scroll lag | Reduce `overscan` or use `transform` instead of `top` |
| Worker message errors | Validate message types with TypeScript guards |

## Completion Criteria

- [ ] Web Workers implemented for SimRating calculations
- [ ] Canvas renderer component created for SATOR Square
- [ ] Virtual scrolling implemented for lists/grids
- [ ] Bundle split into logical chunks
- [ ] Image optimization configured
- [ ] Memory leak prevention patterns in place
- [ ] Performance budgets defined and enforced
- [ ] Lighthouse score > 90 on all metrics
- [ ] Bundle analysis completed
- [ ] Documentation updated

## Performance Budgets

```json
{
  "budgets": [
    {
      "type": "bundle",
      "name": "main",
      "maximumWarning": "150kb",
      "maximumError": "200kb"
    },
    {
      "type": "bundle",
      "name": "vendor-*",
      "maximumWarning": "300kb",
      "maximumError": "500kb"
    },
    {
      "type": "asset",
      "name": "*.js",
      "maximumWarning": "500kb",
      "maximumError": "1mb"
    }
  ]
}
```

## Post-Completion

After completing this playbook:
1. Run Lighthouse audit and document scores
2. Update performance documentation
3. Set up performance monitoring
4. Proceed to Playbook 3: UI/UX Implementation
