[Ver002.000]

# OPTIMIZED AI SUB-AGENT PROMPT: Panel Components
## Draggable Panels, Content Types & UI Optimization

**Role:** UI Component Specialist  
**Priority:** P1 - Presentation Layer  
**Dependencies:** Grid Store (must be complete)

---

## I. MISSION OBJECTIVE

Implement high-performance panel components with React.memo, proper event delegation, and 60fps animations. Each panel type must be independently optimized.

**Success Criteria:**
- [ ] DraggablePanel with React.memo
- [ ] 4 panel types with lazy loading
- [ ] Virtual scrolling for long lists
- [ ] Event delegation for control buttons
- [ ] CSS containment for paint isolation

---

## II. COMPONENT ARCHITECTURE

### 2.1 DraggablePanel (Optimized Container)

```typescript
// components/grid/DraggablePanel.jsx
import React, { useCallback, memo } from 'react';
import { Minus, Square, X, Move, GripVertical } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGridStore } from '@/store/gridStore';
import { colors } from '@/theme/colors';

const HUB_COLORS = {
  SATOR: colors.hub.sator,
  ROTAS: colors.hub.rotas,
  AREPO: colors.hub.arepo,
  OPERA: colors.hub.opera,
  TENET: colors.hub.tenet,
};

// Memoized to prevent re-render when sibling panels change
export const DraggablePanel = memo(function DraggablePanel({ 
  panel, 
  children, 
  isDragging 
}) {
  // Select only needed actions to minimize re-renders
  const minimizePanel = useGridStore(state => state.minimizePanel);
  const maximizePanel = useGridStore(state => state.maximizePanel);
  const restorePanel = useGridStore(state => state.restorePanel);
  const closePanel = useGridStore(state => state.closePanel);
  
  const hubColor = HUB_COLORS[panel.hub] || colors.hub.sator;
  
  // Stable callbacks
  const handleMinimize = useCallback(() => minimizePanel(panel.i), [panel.i, minimizePanel]);
  const handleMaximize = useCallback(() => maximizePanel(panel.i), [panel.i, maximizePanel]);
  const handleRestore = useCallback(() => restorePanel(panel.i), [panel.i, restorePanel]);
  const handleClose = useCallback(() => closePanel(panel.i), [panel.i, closePanel]);
  
  // Handle maximized state
  if (panel.state === 'maximized') {
    return (
      <MaximizedOverlay 
        panel={panel} 
        hubColor={hubColor}
        onRestore={handleRestore}
        onClose={handleClose}
      >
        {children}
      </MaximizedOverlay>
    );
  }
  
  // Handle minimized state
  if (panel.state === 'minimized') {
    return (
      <MinimizedPanel 
        panel={panel}
        hubColor={hubColor}
        onRestore={handleRestore}
        onClose={handleClose}
      />
    );
  }
  
  // Normal state
  return (
    <div 
      className={`
        w-full h-full flex flex-col rounded-xl border overflow-hidden
        transition-shadow duration-200
        ${isDragging ? 'shadow-2xl scale-[1.02] z-50' : 'shadow-lg'}
      `}
      style={{
        backgroundColor: 'rgba(20, 20, 26, 0.95)',
        borderColor: `${hubColor.base}30`,
        boxShadow: isDragging ? `0 0 30px ${hubColor.glow}` : 'none',
        // CSS containment for paint isolation
        contain: 'layout style paint',
        willChange: isDragging ? 'transform' : 'auto',
      }}
    >
      {/* Header - draggable handle */}
      <PanelHeader 
        panel={panel}
        hubColor={hubColor}
        onMinimize={handleMinimize}
        onMaximize={handleMaximize}
        onClose={handleClose}
      />
      
      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {children}
      </div>
    </div>
  );
}, 
// Custom comparison for memo
(prev, next) => {
  return prev.panel.i === next.panel.i &&
         prev.panel.state === next.panel.state &&
         prev.isDragging === next.isDragging &&
         prev.panel.x === next.panel.x &&
         prev.panel.y === next.panel.y &&
         prev.panel.w === next.panel.w &&
         prev.panel.h === next.panel.h;
});

// Sub-components extracted for reusability
function PanelHeader({ panel, hubColor, onMinimize, onMaximize, onClose }) {
  return (
    <div 
      className="flex items-center justify-between px-3 py-2.5 cursor-move select-none draggable-handle"
      style={{ 
        backgroundColor: `${hubColor.base}08`,
        borderBottom: `1px solid ${hubColor.base}20`,
      }}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="w-3.5 h-3.5 text-white/30" />
        <div 
          className="w-2 h-2 rounded-full"
          style={{ 
            backgroundColor: hubColor.base, 
            boxShadow: `0 0 6px ${hubColor.glow}` 
          }}
        />
        <span className="text-sm font-medium text-white/90">{panel.title}</span>
      </div>
      
      {/* Window Controls - Event Delegation Pattern */}
      <div 
        className="flex items-center gap-0.5 panel-controls"
        onClick={(e) => {
          // Event delegation for better performance
          const action = e.target.closest('[data-action]')?.dataset.action;
          switch (action) {
            case 'minimize': onMinimize(); break;
            case 'maximize': onMaximize(); break;
            case 'close': onClose(); break;
          }
        }}
      >
        <button
          data-action="minimize"
          className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          title="Minimize"
        >
          <Minus className="w-3.5 h-3.5 pointer-events-none" />
        </button>
        <button
          data-action="maximize"
          className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
          title="Maximize"
        >
          <Square className="w-3.5 h-3.5 pointer-events-none" />
        </button>
        <button
          data-action="close"
          className="p-1.5 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
          title="Close"
        >
          <X className="w-3.5 h-3.5 pointer-events-none" />
        </button>
      </div>
    </div>
  );
}

function MaximizedOverlay({ children, panel, hubColor, onRestore, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-4 z-[1000] flex flex-col rounded-xl border overflow-hidden"
      style={{
        backgroundColor: 'rgba(20, 20, 26, 0.98)',
        borderColor: `${hubColor.base}50`,
        boxShadow: `0 0 50px ${hubColor.glow}`,
      }}
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 bg-black/50 -z-10"
        onClick={onRestore}
      />
      
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3"
        style={{ 
          backgroundColor: `${hubColor.base}15`,
          borderBottom: `1px solid ${hubColor.base}30`,
        }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-3 h-3 rounded-full"
            style={{ 
              backgroundColor: hubColor.base, 
              boxShadow: `0 0 8px ${hubColor.glow}` 
            }}
          />
          <span className="text-base font-semibold text-white">{panel.title}</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={onRestore}
            className="px-3 py-1.5 rounded-lg bg-white/10 text-sm text-white/80 hover:bg-white/15 transition-colors"
          >
            Restore
          </button>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {/* Maximized Content */}
      <div className="flex-1 overflow-hidden p-4">
        {children}
      </div>
    </motion.div>
  );
}
```

### 2.2 Panel Content Components (Lazy Loaded)

```typescript
// components/grid/PanelTypes/index.js
import { lazy, Suspense } from 'react';

// Lazy load all panel types for code splitting
const MinimapPanel = lazy(() => import('./MinimapPanel'));
const AnalyticsPanel = lazy(() => import('./AnalyticsPanel'));
const StatsPanel = lazy(() => import('./StatsPanel'));
const VideoPanel = lazy(() => import('./VideoPanel'));
const ChatPanel = lazy(() => import('./ChatPanel'));
const LiveMapPanel = lazy(() => import('./LiveMapPanel'));

// Loading fallback
const PanelSkeleton = () => (
  <div className="w-full h-full flex items-center justify-center">
    <div className="animate-pulse flex flex-col items-center gap-2">
      <div className="w-8 h-8 rounded-full bg-white/10" />
      <div className="w-20 h-3 rounded bg-white/10" />
    </div>
  </div>
);

// Panel router with suspense
export function PanelContent({ type, panelId }) {
  const panels = {
    minimap: MinimapPanel,
    analytics: AnalyticsPanel,
    stats: StatsPanel,
    video: VideoPanel,
    chat: ChatPanel,
    livemap: LiveMapPanel,
  };
  
  const Component = panels[type];
  
  if (!Component) {
    return (
      <div className="w-full h-full flex items-center justify-center text-white/40">
        Unknown panel type: {type}
      </div>
    );
  }
  
  return (
    <Suspense fallback={<PanelSkeleton />}>
      <Component panelId={panelId} />
    </Suspense>
  );
}
```

### 2.3 MinimapPanel (Performance Optimized)

```typescript
// components/grid/PanelTypes/MinimapPanel.jsx
import React, { useRef, useCallback, useEffect, memo } from 'react';
import { ZoomIn, ZoomOut, Crosshair, MapPin, Layers } from 'lucide-react';
import { colors } from '@/theme/colors';

// Canvas-based minimap for 60fps performance
export const MinimapPanel = memo(function MinimapPanel({ panelId }) {
  const canvasRef = useRef(null);
  const [zoom, setZoom] = useState(1);
  const [showGrid, setShowGrid] = useState(true);
  const [players, setPlayers] = useState(MOCK_PLAYERS);
  
  // Use refs for animation loop to avoid re-renders
  const animationRef = useRef();
  const radarAngleRef = useRef(0);
  
  // Canvas rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    
    // Set canvas size with DPR for sharp rendering
    const resize = () => {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      ctx.scale(dpr, dpr);
    };
    resize();
    
    const render = () => {
      const width = canvas.width / dpr;
      const height = canvas.height / dpr;
      
      // Clear
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0, 0, width, height);
      
      // Draw grid
      if (showGrid) {
        ctx.strokeStyle = 'rgba(255,255,255,0.1)';
        ctx.lineWidth = 1;
        const gridSize = 20 * zoom;
        
        for (let x = 0; x < width; x += gridSize) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
          ctx.stroke();
        }
        for (let y = 0; y < height; y += gridSize) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
          ctx.stroke();
        }
      }
      
      // Draw radar sweep
      const centerX = width / 2;
      const centerY = height / 2;
      const radarGradient = ctx.createConicGradient(
        radarAngleRef.current,
        centerX,
        centerY
      );
      radarGradient.addColorStop(0, 'rgba(0, 212, 255, 0)');
      radarGradient.addColorStop(0.7, 'rgba(0, 212, 255, 0)');
      radarGradient.addColorStop(1, 'rgba(0, 212, 255, 0.3)');
      
      ctx.fillStyle = radarGradient;
      ctx.beginPath();
      ctx.arc(centerX, centerY, Math.max(width, height), 0, Math.PI * 2);
      ctx.fill();
      
      // Draw players
      players.forEach(player => {
        const x = (player.x / 100) * width;
        const y = (player.y / 100) * height;
        
        ctx.save();
        ctx.translate(x, y);
        
        // Glow
        ctx.shadowColor = player.team === 'ally' ? colors.hub.rotas.base : colors.status.error;
        ctx.shadowBlur = 10;
        
        // Shape
        ctx.fillStyle = player.team === 'ally' ? colors.hub.rotas.base : colors.status.error;
        ctx.beginPath();
        if (player.team === 'ally') {
          // Triangle for allies
          ctx.moveTo(0, -6);
          ctx.lineTo(5, 4);
          ctx.lineTo(-5, 4);
        } else {
          // Circle for enemies
          ctx.arc(0, 0, 5, 0, Math.PI * 2);
        }
        ctx.fill();
        
        ctx.restore();
      });
      
      // Update radar angle
      radarAngleRef.current += 0.02;
      
      animationRef.current = requestAnimationFrame(render);
    };
    
    render();
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [zoom, showGrid, players]);
  
  // Stable callbacks
  const zoomIn = useCallback(() => setZoom(z => Math.min(z + 0.5, 5)), []);
  const zoomOut = useCallback(() => setZoom(z => Math.max(z - 0.5, 1)), []);
  
  return (
    <div className="w-full h-full flex flex-col">
      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden">
        <canvas
          ref={canvasRef}
          className="absolute inset-0"
          style={{ imageRendering: 'crisp-edges' }}
        />
      </div>
      
      {/* Controls */}
      <div className="flex items-center justify-between p-2 border-t border-white/10 bg-[#14141a]">
        <div className="flex items-center gap-1">
          <button
            onClick={zoomOut}
            className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-30"
            disabled={zoom <= 1}
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-mono text-white/60 w-12 text-center">
            {zoom.toFixed(1)}x
          </span>
          <button
            onClick={zoomIn}
            className="p-1.5 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors disabled:opacity-30"
            disabled={zoom >= 5}
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`p-1.5 rounded transition-colors ${
              showGrid ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/60'
            }`}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
});
```

---

## III. PERFORMANCE OPTIMIZATIONS

### 3.1 React.memo Best Practices

```typescript
// Always use custom comparison for complex props
const MyComponent = memo(function MyComponent({ data, callback }) {
  // Component logic
}, (prevProps, nextProps) => {
  // Return true if equal (don't re-render)
  return prevProps.id === nextProps.id &&
         shallowEqual(prevProps.style, nextProps.style);
});

// Use useMemo for expensive computations
const processedData = useMemo(() => {
  return data.map(item => expensiveTransform(item));
}, [data]);

// Use useCallback for stable callbacks
const handleClick = useCallback((id) => {
  // handler
}, [/* deps */]);
```

### 3.2 CSS Containment

```css
/* Apply containment to panels */
.draggable-panel {
  contain: layout style paint;
  content-visibility: auto;
}

/* Optimize animations */
.panel-dragging {
  will-change: transform;
  transform: translateZ(0); /* Force GPU layer */
}
```

### 3.3 Virtual Scrolling for Lists

```typescript
// For long lists in StatsPanel, use virtual scrolling
import { useVirtualizer } from '@tanstack/react-virtual';

function VirtualList({ items }) {
  const parentRef = useRef();
  
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50,
    overscan: 5,
  });
  
  return (
    <div ref={parentRef} className="h-full overflow-auto">
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map((virtualItem) => (
          <div
            key={virtualItem.key}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: `${virtualItem.size}px`,
              transform: `translateY(${virtualItem.start}px)`,
            }}
          >
            {items[virtualItem.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## IV. TESTING CHECKLIST

### 4.1 Performance Tests

- [ ] Panel drag at 60fps (Chrome DevTools Performance)
- [ ] No re-renders when unrelated panels update
- [ ] Memory usage stable after 100 panel operations
- [ ] Initial render < 100ms for 4 panels

### 4.2 Functional Tests

- [ ] Minimize/Maximize/Restore/Close all work
- [ ] Event delegation handles all control clicks
- [ ] Maximized overlay displays correctly
- [ ] Lazy loading works (verify chunk in Network tab)

---

## V. DELIVERABLES

1. `DraggablePanel.jsx` - Memoized container with all states
2. `PanelContent.jsx` - Lazy-loaded router
3. `MinimapPanel.jsx` - Canvas-based 60fps implementation
4. `AnalyticsPanel.jsx` - Charts with memoization
5. `StatsPanel.jsx` - Virtual scrolling list
6. `VideoPanel.jsx` - Media controls
7. `__tests__/DraggablePanel.test.jsx`

---

*End of Panel Components Sub-Agent Prompt*
