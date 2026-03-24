[Ver001.000]

# Week 3 Day 2 Strategy

## Selected Focus: OPTION A - MODEL OPTIMIZATION

**Rationale**: Performance analysis shows excellent baseline metrics. Model quantization offers immediate 75% size reduction with minimal risk. Aligns with platform performance goals and provides tangible user benefit.

## Day 2 Deliverables

### Task 1: Model Quantization Support (90 min)
**File**: `src/workers/ml.worker.ts` (+60 lines)

Add quantized model loading:
- INT8 weight support via TF.js converter
- Automatic format detection (fp32 vs int8)
- Fallback to fp32 if quantization unsupported

```typescript
// New message type
| { type: 'LOAD_MODEL_QUANTIZED'; url: string; modelName: string; bits: 8 | 16 }

// Usage
worker.postMessage({
  type: 'LOAD_MODEL_QUANTIZED',
  url: '/models/model-int8.json',
  modelName: 'model-int8',
  bits: 8
})
```

**Success Criteria**:
- Quantized model loads successfully
- 75% size reduction achieved
- Accuracy loss <2%

---

### Task 2: Warm-up API (60 min)
**File**: `src/hooks/useMLInference.ts` (+30 lines)

Add explicit warm-up function:
```typescript
interface UseMLInferenceReturn {
  // ... existing
  warmUp: () => Promise<void>
  isWarmedUp: boolean
}
```

Implementation runs dummy prediction to initialize backend:
```typescript
const warmUp = useCallback(async () => {
  if (!isModelReady || isWarmedUp) return
  await predict([0, 0, 0]) // Dummy inference
  setIsWarmedUp(true)
}, [isModelReady, isWarmedUp, predict])
```

**Success Criteria**:
- First real prediction <10ms after warm-up
- No UI blocking during warm-up

---

### Task 3: Batch Prediction Support (90 min)
**Files**: 
- `src/workers/ml.worker.ts` (+40 lines)
- `src/hooks/useMLInference.ts` (+50 lines)

Enable batch processing for multiple inputs:
```typescript
// Worker message
| { type: 'PREDICT_BATCH'; inputs: number[][]; requestId: string }

// Hook API
predictBatch: (inputs: number[][]) => Promise<number[][]>
```

Amortize tensor creation overhead across batch.

**Success Criteria**:
- Batch of 10 predictions: <50ms total
- 5x faster than 10 individual predictions
- Memory usage <20MB for batch

---

### Task 4: Model Info & Export (60 min)
**File**: `src/hooks/useMLInference.ts` (+40 lines)

Add introspection capabilities:
```typescript
interface ModelInfo {
  name: string
  version: string
  sizeBytes: number
  lastUpdated: Date
  quantization: 'fp32' | 'int16' | 'int8'
  inputShape: number[]
  outputShape: number[]
}

interface UseMLInferenceReturn {
  // ... existing
  getModelInfo: () => ModelInfo | null
  exportModel: () => Promise<Blob | null>
}
```

**Success Criteria**:
- Model metadata accessible
- Export downloads valid model file
- Info displays in MLPredictionPanel

---

## Implementation Schedule

| Time | Task | File | Lines |
|------|------|------|-------|
| 0:00-1:30 | Quantization | ml.worker.ts | +60 |
| 1:30-2:30 | Warm-up API | useMLInference.ts | +30 |
| 2:30-4:00 | Batch predictions | ml.worker.ts, useMLInference.ts | +90 |
| 4:00-5:00 | Model info/export | useMLInference.ts | +40 |
| 5:00-6:00 | Integration tests | - | - |
| 6:00-7:00 | Documentation update | TOOLS-GUIDE.md | +20 |
| 7:00-8:00 | Verification | Build, tests, lint | - |

## Success Criteria

### Performance Targets
| Metric | Current | Day 2 Target | Impact |
|--------|---------|--------------|--------|
| Model size | 50MB | 12MB | 75% reduction |
| Load time (network) | 4-6s | 1-2s | 3x faster |
| First prediction | 15-25ms | <10ms | 2x faster |
| Batch (10) | ~150ms | <50ms | 3x faster |

### Code Quality
- [ ] All new functions have JSDoc
- [ ] TypeScript types complete
- [ ] Error handling comprehensive
- [ ] No new lint errors
- [ ] Build passes
- [ ] Tests pass (18/18)

## Risk Assessment

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Quantization accuracy loss | Medium | High | Test with validation set, fallback to fp32 |
| Batch memory overflow | Low | Medium | Limit batch size, chunk large batches |
| Browser compatibility | Low | Medium | Feature detection, graceful degradation |
| Worker communication overhead | Low | Low | Benchmark vs main thread, fallback available |

## Alternative Paths (If Blocked)

**If Option A blocked**:
- Pivot to Option B (Advanced Features)
- Focus: Multi-model management
- Lower risk, different value proposition

**If major issue encountered**:
- Reduce scope: Skip batch prediction
- Focus on quantization + warm-up only
- Still achieves primary goal (performance)

## Integration Points

### Files to Modify
1. `src/workers/ml.worker.ts` - Core inference logic
2. `src/hooks/useMLInference.ts` - Public API
3. `src/components/MLPredictionPanel.tsx` - UI updates
4. `src/dev/TOOLS-GUIDE.md` - Documentation

### Files to Create
None - extending existing architecture

### Dependencies
- @tensorflow/tfjs (existing)
- No new dependencies required

## Post-Day-2 State

**Expected improvements**:
- 75% smaller model downloads
- 3x faster initial load
- 2x faster first prediction
- Batch processing for analytics workflows

**User experience**:
- Faster model loading on all connections
- Instant predictions after warm-up
- Batch analysis capabilities
- Model metadata visibility

## Verification Checklist

□ Quantized model loads and runs
□ Warm-up reduces first prediction latency
□ Batch predictions work correctly
□ Model info displays accurately
□ Export downloads valid file
□ Performance targets met
□ Documentation updated
□ No regressions in existing tests

---

**Selected by**: Eli (via relay from Kimi)
**Date**: 2026-03-13
**Confidence**: High - builds on solid Day 1 foundation
