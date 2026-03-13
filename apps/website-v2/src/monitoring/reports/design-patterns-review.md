# Design Patterns Review: Libre-X-eSport ML Platform

**Scope:** ML Inference System (`apps/website-v2/src/`)
**Date:** 2026-03-13
**Reviewer:** AI Code Review Agent
**Files Analyzed:** 8 files, ~2,771 lines

---

## Executive Summary

**Overall Score: 7.2/10**

The ML platform demonstrates solid foundational patterns with good separation of concerns between hooks, stores, and components. The codebase shows mature handling of Web Workers, circuit breaker patterns, and state persistence. However, several performance anti-patterns and React optimization gaps prevent it from reaching production-grade excellence.

| Category | Score | Notes |
|----------|-------|-------|
| React Patterns | 6.5/10 | Good hooks, missing memoization |
| State Management | 8/10 | Zustand well-used, Map state could be optimized |
| Component Architecture | 7/10 | Good composition, minor prop drilling |
| TypeScript Patterns | 8.5/10 | Excellent type safety, good generics |

---

## Pattern Inventory

| Pattern | Location | Quality | Notes |
|---------|----------|---------|-------|
| Custom Hooks | 3 files | Good | Proper cleanup, good abstraction |
| Zustand Store | 2 files | Good | Persistence, middleware usage |
| Circuit Breaker | useMLInference.ts | Excellent | Full state machine implementation |
| Web Workers | 2 hooks | Good | Proper lifecycle management |
| LRU Cache | mlCacheStore.ts | Good | Access tracking, eviction |
| Debouncing | useStreamingInference.ts | Needs Work | Creates new function each render |
| Component Composition | 3 components | Good | Clear separation |
| Memoization | Sparse | Needs Work | Missing useMemo/useCallback in key areas |

---

## Critical Issues (P0)

### 1. Unstable Hook Dependencies Causing Excessive Re-renders
**Location:** `useMLInference.ts:510`
**Issue:** `progress` state included in `loadModel` dependency array causes the callback to be recreated on every progress update (every 200ms during loading).

```typescript
// CURRENT (BROKEN)
const loadModel = useCallback(async (url: string, quantization?: 8 | 16 | 32): Promise<void> => {
  // ... loading logic with setProgress calls
}, [isModelLoading, isModelReady, useWorker, initWorker, loadTensorFlow, progress]) // ❌ progress changes often!
```

**Impact:** Unnecessary re-renders of any component using `loadModel`, potential cascade effects.

**Fix:** Remove `progress` from dependencies; use functional updates for setProgress.

```typescript
// FIXED
const loadModel = useCallback(async (url: string, quantization?: 8 | 16 | 32): Promise<void> => {
  // ... 
  setProgress(p => Math.min(p + 10, 90)) // ✅ Functional update
  // ...
}, [isModelLoading, isModelReady, useWorker, initWorker, loadTensorFlow]) // ✅ Removed progress
```

---

### 2. Debounced Function Recreation on Every Render
**Location:** `useStreamingInference.ts:140-189`
**Issue:** The `debounce` wrapper creates a new function every time `processPrediction` dependencies change, losing the internal timeout state.

```typescript
// CURRENT (BROKEN)
const processPrediction = useCallback(
  debounce(async (data: StreamData) => {
    // ... prediction logic
  }, debounceDelay),
  [isModelReady, predict, debounceDelay] // ❌ New debounce instance each time
)
```

**Impact:** Debouncing doesn't work correctly - multiple predictions may fire unexpectedly.

**Fix:** Use a stable debounce reference with `useRef`.

```typescript
// FIXED
const processPredictionRef = useRef<((data: StreamData) => void) | null>(null)

useEffect(() => {
  processPredictionRef.current = debounce(async (data: StreamData) => {
    // ... prediction logic
  }, debounceDelay)
}, [isModelReady, predict, debounceDelay])

const processPrediction = useCallback((data: StreamData) => {
  processPredictionRef.current?.(data)
}, [])
```

---

### 3. Missing Memoization on Hook Return Objects
**Location:** `useMLInference.ts:717-730`, `useMLModelManager.ts:401-418`
**Issue:** Hook return objects are recreated on every render, breaking referential equality for downstream memoization.

```typescript
// CURRENT (BROKEN)
return {
  isModelLoading,
  isModelReady,
  // ... all properties recreated each render
  loadModel, // This is memoized but the container object isn't
  // ...
} // ❌ New object reference every time
```

**Impact:** Components using these hooks can't effectively use `React.memo` - unnecessary re-renders cascade.

**Fix:** Wrap return in `useMemo`.

```typescript
// FIXED
return useMemo(() => ({
  isModelLoading,
  isModelReady,
  isWarmedUp,
  loadModel,
  predict,
  predictBatch,
  warmUp,
  getModelInfo,
  error,
  progress,
  useWorker
}), [isModelLoading, isModelReady, isWarmedUp, loadModel, predict, predictBatch, warmUp, getModelInfo, error, progress, useWorker])
```

---

## Design Smells (P1)

### 4. Map State Updates Without Structural Sharing
**Location:** `mlCacheStore.ts:150-154`, `useMLModelManager.ts:150-165`
**Issue:** Creating new Map instances on every update is expensive for large caches.

```typescript
// CURRENT
set(state => ({
  cachedModels: new Map(state.cachedModels).set(id, newModel), // ❌ O(n) copy
  accessOrder: [...state.accessOrder, id], // ❌ O(n) copy
  currentSize: state.currentSize + sizeBytes
}))
```

**Recommendation:** Consider using Immer with Zustand for efficient immutable updates, or normalize to objects for better performance.

```typescript
// WITH IMMER
set(produce(state => {
  state.cachedModels.set(id, newModel) // ✅ Mutates draft, produces efficient patch
  state.accessOrder.push(id)
  state.currentSize += sizeBytes
}))
```

---

### 5. Store Selector Functions Cause Unnecessary Re-renders
**Location:** `predictionHistoryStore.ts:132-140`
**Issue:** Selector functions (`getPredictions`, `getStats`) are part of the store state, causing components to re-render even when only using these functions.

```typescript
// CURRENT
const { getPredictions, getStats, predictions } = usePredictionHistoryStore() // ❌ Re-renders on any state change
```

**Recommendation:** Use Zustand selectors or split into separate stores.

```typescript
// FIXED - Using selectors
const predictions = usePredictionHistoryStore(state => state.predictions)
const getPredictions = usePredictionHistoryStore(state => state.getPredictions) // Still stable but better pattern

// OR - Split stores
const usePredictionDataStore = create(() => ({ predictions: [] }))
const usePredictionActions = create(() => ({ getPredictions: () => {} }))
```

---

### 6. Dynamic Import in Render Path
**Location:** `useStreamingInference.ts:172-177`
**Issue:** Store import happens during prediction processing.

```typescript
// CURRENT
const { usePredictionHistoryStore } = await import('../store/predictionHistoryStore')
usePredictionHistoryStore.getState().addPrediction(prediction) // ❌ Dynamic import in hot path
```

**Recommendation:** Pre-load or use static import at top level.

```typescript
// FIXED
import { usePredictionHistoryStore } from '../store/predictionHistoryStore'
// ...
usePredictionHistoryStore.getState().addPrediction(prediction) // ✅ No async overhead
```

---

### 7. Inline Style Injection on Every Render
**Location:** `StreamingPredictionPanel.tsx:291-298`
**Issue:** CSS-in-JS style tag injected on every component render.

```typescript
// CURRENT
<style>{`
  .glassmorphic-panel {
    // ... styles
  }
`}</style> // ❌ Parsed on every render
```

**Recommendation:** Use CSS modules or styled-components, or at least define outside component.

```typescript
// FIXED - Define outside component
const GLASSMORPHIC_STYLES = `
  .glassmorphic-panel {
    // ... styles
  }
`
// In component:
<style>{GLASSMORPHIC_STYLES}</style> // ✅ Same string reference
```

---

### 8. Missing React.memo on Pure Components
**Location:** `MLPredictionPanel.tsx:35`, `StreamingPredictionPanel.tsx:55`
**Issue:** Components receive stable props but will re-render with parent regardless.

**Recommendation:** Wrap with `React.memo` for components that receive stable props.

```typescript
export const MLPredictionPanel: React.FC<MLPredictionPanelProps> = React.memo(({
  modelUrl = '/models/default-model.json',
  hub = 'SATOR'
}) => {
  // ...
})
```

---

## Code Quality Observations

### Positive Patterns ✅

1. **Excellent TypeScript Coverage** - Comprehensive interfaces, discriminated unions for message types, proper generic constraints.

2. **Circuit Breaker Implementation** - Full state machine with proper transitions (CLOSED → OPEN → HALF_OPEN).

3. **Worker Lifecycle Management** - Proper cleanup in useEffect returns, DISPOSE messages sent before terminate.

4. **Zustand Persistence** - Correct usage of persist middleware with custom serialize/deserialize for Date objects.

5. **Error Boundary Considerations** - Custom error classes (MLValidationError, MLTimeoutError) enable precise error handling.

### Areas for Improvement 🔧

1. **Dependency Array Consistency** - Some hooks use empty deps `[]` when they should include cleanup functions.

2. **Magic Numbers** - Threshold values scattered (1000 max predictions, 500MB cache size, 50ms switch timeout) should be configurable constants.

3. **Testing Hooks** - No evidence of test utilities for hook isolation testing.

---

## Refactoring Recommendations (Prioritized)

### Immediate (This Sprint)
1. **Fix P0 Issue #1** - Remove `progress` from `loadModel` dependencies
2. **Fix P0 Issue #2** - Stabilize debounced function with `useRef`
3. **Fix P0 Issue #3** - Add `useMemo` to hook return objects

### Short-term (Next 2 Sprints)
4. **Add Immer** - Integrate Immer for efficient Map state updates
5. **Extract Selectors** - Create selector hooks for store data access
6. **Add React.memo** - Wrap pure presentation components

### Long-term (Technical Debt)
7. **Normalize State** - Consider converting Maps to normalized objects for better performance
8. **Extract Constants** - Move configuration to central config object
9. **Add Hook Tests** - Implement React Testing Library tests for custom hooks

---

## Appendix: Pattern Examples

### Correct: Worker Cleanup Pattern
```typescript
useEffect(() => {
  return () => {
    isMountedRef.current = false
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'DISPOSE' })
      workerRef.current.terminate()
      workerRef.current = null
    }
  }
}, [])
```

### Correct: Circuit Breaker State Machine
```typescript
type CircuitState = 'CLOSED' | 'OPEN' | 'HALF_OPEN' // Discriminated union

// Proper state transitions with console logging for debugging
// Timeout-based recovery with configurable thresholds
```

### Needs Improvement: Map State Update
```typescript
// Current - creates full copy
set(state => ({
  cachedModels: new Map(state.cachedModels).set(id, model) // O(n)
}))

// Better with Immer
set(produce(state => {
  state.cachedModels.set(id, model) // O(1) patch
}))
```

---

## Summary

The ML platform codebase shows architectural maturity with proper separation of concerns, good TypeScript practices, and robust error handling. The critical issues center around React's render optimization (dependency arrays, memoization) rather than functional defects. Addressing the P0 issues will significantly improve performance during model loading and streaming inference. The P1 design smells represent technical debt that should be addressed before scaling to additional features.

**Recommended Focus:**
- Week 1: Fix all P0 dependency/memoization issues
- Week 2: Add Immer, extract selectors
- Week 3: Component memoization pass
- Week 4: Performance profiling and validation

---

*Report Version: 1.0*
*Generated: 2026-03-13*
