[Ver001.000]

# Week 3 Optimization Roadmap

Based on baseline measurements, follow these optimization paths.

## PATH A: Render Performance

**Trigger:** 1000 panels render >150ms OR 5000 panels >800ms

### React.memo on PanelCard
```typescript
// PanelCard.tsx
const PanelCard = React.memo(({ panel, ...props }) => {
  // Component logic
}, (prev, next) => {
  // Custom comparison
  return prev.panel.id === next.panel.id &&
         prev.panel.updatedAt === next.panel.updatedAt
})
```

### Virtual Window Optimization
```typescript
// Adjust overscan based on performance
const virtualizer = useVirtualizer({
  overscan: renderTime > 100 ? 3 : 5,  // Reduce if slow
})
```

**Target files:**
- `src/components/grid/PanelCard.tsx`
- `src/components/UnifiedGrid.tsx`
- `src/hooks/useVirtualizer config`

**Impact:** High | **Effort:** Medium

---

## PATH B: Memory Efficiency

**Trigger:** Memory growth >5MB/min OR leak detected

### Worker Termination Review
```typescript
// useGridWorker.ts - ensure cleanup
useEffect(() => {
  return () => {
    worker.terminate()
    URL.revokeObjectURL(workerUrl)
  }
}, [])
```

### Unmount Cleanup Audit
```typescript
// Panel components
useEffect(() => {
  return () => {
    // Cleanup subscriptions
    // Cancel pending requests
    // Clear timers
  }
}, [])
```

**Target files:**
- `src/workers/grid.worker.ts`
- `src/workers/useGridWorker.ts`
- Panel lifecycle hooks

**Impact:** High | **Effort:** Medium

---

## PATH C: Scroll Performance

**Trigger:** Scroll FPS <45 (good) OR <30 (critical)

### Overscan Tuning
```typescript
// UnifiedGrid.tsx
overscan: fps < 30 ? 2 : fps < 45 ? 4 : 5
```

### Item Size Caching
```typescript
// Cache calculated sizes
const sizeCache = useRef(new Map())

const getSize = (index) => {
  if (sizeCache.current.has(index)) {
    return sizeCache.current.get(index)
  }
  const size = calculateSize(index)
  sizeCache.current.set(index, size)
  return size
}
```

### RAF Optimization
```typescript
// Throttle scroll to animation frame
const scrollRef = useRef(0)

const onScroll = () => {
  if (scrollRef.current) return
  scrollRef.current = requestAnimationFrame(() => {
    // Handle scroll
    scrollRef.current = 0
  })
}
```

**Target files:**
- `src/workers/grid.renderer.ts`
- `src/components/UnifiedGrid.tsx`

**Impact:** Medium | **Effort:** Low

---

## PATH D: Advanced Features

**Trigger:** All metrics good (render <150ms, FPS >45, memory <5MB/min)

### ML Integration Performance
- Measure inference time impact
- Consider Web Workers for ML tasks
- Implement progressive enhancement

### Real-time Streaming
- Bandwidth analysis for live data
- WebSocket connection pooling
- Backpressure handling

### Preparation Checklist
- [ ] Performance budget defined
- [ ] Monitoring in place
- [ ] Feature flags ready
- [ ] A/B test framework

**Impact:** Variable | **Effort:** High

---

## Optimization Priority Matrix

| Priority | Path | Impact | Effort | Condition |
|----------|------|--------|--------|-----------|
| P0 | A | High | Medium | Render >150ms (1000 panels) |
| P1 | B | High | Medium | Memory >5MB/min |
| P2 | C | Medium | Low | FPS <45 |
| P3 | D | Variable | High | All metrics good |

## Decision Tree

```
Start
│
├─ Render 1000 panels >150ms? ──Yes──► PATH A (Render)
│   No
├─ Memory growth >5MB/min? ──Yes────► PATH B (Memory)
│   No
├─ Scroll FPS <45? ──Yes────────────► PATH C (Scroll)
│   No
└─ All metrics good? ──Yes──────────► PATH D (Features)
```

## Success Criteria

After optimizations:
- [ ] Render 1000 panels <150ms
- [ ] Scroll FPS consistently >45
- [ ] Memory growth <5MB/min
- [ ] No console warnings
- [ ] Lighthouse Performance >90
