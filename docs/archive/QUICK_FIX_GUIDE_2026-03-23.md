# QUICK REFERENCE — Critical Issues & Fixes

**Last Updated:** 2026-03-23  
**Status:** 🔴 Production blocked by TypeScript errors  
**Total Issues:** 224+ TypeScript errors across 50+ files  

---

## 🚨 TOP 5 ISSUES (BY IMPACT)

| # | Issue | Severity | Effort | Files | Fix |
|---|-------|----------|--------|-------|-----|
| 1 | TypeScript compilation fails | 🔴 CRITICAL | 8-10h | 50+ | Export missing types, fix mocks |
| 2 | Test mock interface mismatches | 🟡 HIGH | 2h | 5 | Add missing properties to mocks |
| 3 | Feature flag functions missing | 🟡 HIGH | 1-2h | 2 | Implement getFeatureFlags(), etc. |
| 4 | Duplicate audio exports | 🟡 HIGH | 1h | 1 | Consolidate exports at EOF |
| 5 | GlassCard variant prop undefined | 🟠 MEDIUM | 30m | 3 | Add variant to interface or remove usage |

---

## 🔧 QUICK FIXES (COPY-PASTE READY)

### Fix #1: Export Missing Hook Type
**File:** `apps/web/src/hooks/useMLInference.ts`  
**Add after function definition:**
```typescript
export type UseMLInferenceReturn = ReturnType<typeof useMLInference>;
```

### Fix #2: Fix Test Mock Properties
**File:** `apps/web/src/components/__tests__/MLPredictionPanel.test.tsx`  
**Change line ~72:**
```typescript
// ❌ BEFORE:
const mockUseMLInference: UseMLInferenceReturn = {
  modelUrl: 'test.onnx',
  predictions: [],
  isLoading: false,
};

// ✅ AFTER:
const mockUseMLInference: UseMLInferenceReturn = {
  modelUrl: 'test.onnx',
  predictions: [],
  isLoading: false,
  queueDepth: 0,        // ADD
  maxQueueSize: 10,     // ADD
  isModelReady: true,   // ADD
  error: null,          // ADD
};
```

### Fix #3: Type Assert Test Response
**File:** `apps/web/src/api/__tests__/ml.test.ts`  
**Change lines ~119, 144, 145:**
```typescript
// ❌ BEFORE:
const predictions = response.data;  // TS18046: unknown

// ✅ AFTER:
const predictions = response.data as Prediction[];
```

### Fix #4: Remove Duplicate Audio Exports
**File:** `apps/web/src/components/audio/SpatialAudio.tsx`  
**Delete lines ~598, ~620, ~742 (duplicates)**  
**Keep only lines ~551, etc. (first definitions)**  
**Add at EOF:**
```typescript
export {
  MascotSpatialAudio,
  AmbientSpatialAudio,
  VoiceSpatialAudio,
  SpatialAudioVisualization
};
```

### Fix #5: Add Audio Hook Export
**File:** `apps/web/src/lib/audio.ts`  
**Add export:**
```typescript
export const useAudio = () => {
  // Implementation
};
```

---

## 📋 VERIFICATION COMMANDS

```bash
# Check TypeScript status
cd apps/web
npm run typecheck

# Run linter
npm run lint

# Run tests
npm run test:run

# Build for production
npm run build
```

**Expected Output When Fixed:**
```
✓ Compilation: 0 errors
✓ Linting: 0 errors  
✓ Tests: All passing
✓ Build: Success (dist/ created)
```

---

## 🎯 PRIORITY CHECKLIST

**Must Fix This Week:**
- [ ] TypeScript errors < 50 (down from 224+)
- [ ] Test mocks have all required properties
- [ ] Compilation succeeds with `npm run build`
- [ ] Feature flag functions implemented

**Next Week:**
- [ ] TypeScript errors = 0
- [ ] All tests passing
- [ ] Lighthouse audit > 90
- [ ] Load tests completed

---

## 📁 KEY FILES TO CHECK/FIX

```
apps/web/src/
├── hooks/useMLInference.ts           ← ADD EXPORT
├── lib/audio.ts                      ← ADD EXPORT
├── config/features.ts                ← IMPLEMENT FUNCTIONS
├── components/
│   ├── audio/SpatialAudio.tsx        ← REMOVE DUPLICATES
│   ├── grid/PanelSkeleton.tsx        ← FIX hubColor.base
│   ├── cs2/CS2MapViewer.tsx          ← REMOVE variant prop
│   └── __tests__/
│       ├── MLPredictionPanel.test.tsx ← ADD MOCK PROPERTIES
│       └── ml.test.ts                 ← ADD TYPE ASSERTS
```

---

## ⏱️ TIME ESTIMATES (With 1 Developer)

| Task | Time | Status |
|------|------|--------|
| Export missing types | 1h | 🟡 TODO |
| Fix test mocks | 1h | 🟡 TODO |
| Consolidate exports | 30m | 🟡 TODO |
| Type assertions & cleanup | 1.5h | 🟡 TODO |
| Config implementations | 1h | 🟡 TODO |
| Verify builds/tests | 1h | 🟡 TODO |
| **TOTAL** | **5.5h** | — |

**With 2-3 Developers (Parallel):** 2-3 hours

---

## ✅ SUCCESS CRITERIA

When you've fixed all issues:
```bash
cd apps/web
npm run typecheck   # Should return: 0 errors, 0 warnings
npm run lint        # Should pass cleanly
npm run test:run    # Should have 0 failures
npm run build       # Should succeed with dist/ created
```

If all ✅ green → **Ready for production deployment**

---

**Last Check:** 2026-03-23 TypeScript output: 224+ errors  
**Target:** 0 errors before deployment  
**Timeline:** This week is critical
