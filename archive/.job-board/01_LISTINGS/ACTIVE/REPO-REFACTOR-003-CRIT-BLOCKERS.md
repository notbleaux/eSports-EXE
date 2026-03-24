# [JLB-LISTING] Phase 3: CRIT Blocker Resolution (TypeScript & Code Quality)

**ID:** REPO-REFACTOR-003-CRIT  
**Priority:** P0 - CRITICAL  
**Status:** ACTIVE  
**Created:** 2026-03-24  
**Source:** Docker CRIT Report Integration  
**Coordinator:** Main Agent  

---

## 🎯 Phase Objective

Resolve the **224+ TypeScript compilation errors** and **code quality blockers** identified in the Docker CRIT report (`CRIT_MONOREPO_OVERVIEW_2026-03-23.md`).

**Production Status:** 🔴 BLOCKED until these are fixed.

---

## CRITICAL BLOCKERS (P0)

### Task 3.1: Fix TypeScript Compilation Errors (224+)
**Assignee:** @coder-typescript-specialist  
**Estimated Effort:** 8-10 hours  
**Files:** Multiple across `apps/web/src/`

**Error Categories from CRIT:**

#### 3.1.1 Missing Type Exports
**Pattern:** `TS2307: Cannot find module './types' or its corresponding type declarations`

**Files Affected:**
- `apps/web/src/components/SATOR/RAR/` - Missing `RARCard.types.ts` exports
- `apps/web/src/lib/ml/` - Missing `inference.types.ts` exports  
- `apps/web/src/hooks/workers/` - Missing worker message type exports

**Fix Strategy:**
1. Create missing `types.ts` files where needed
2. Export all required interfaces
3. Update imports to use proper type paths

**Scout Command:**
```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep "TS2307" | head -30
```

---

#### 3.1.2 Test Mock Interface Mismatches  
**Pattern:** `TS2345: Argument of type 'X' is not assignable to parameter of type 'Y'`

**Files Affected:**
- `apps/web/src/hooks/__tests__/useMLInference.test.ts`
- `apps/web/src/hooks/__tests__/useMLModelManager.test.ts`
- `apps/web/src/components/__tests__/MLPredictionPanel.test.tsx`

**Fix Strategy:**
1. Audit all test mocks
2. Add missing properties to mock objects
3. Update interfaces to match actual usage

**Scout Command:**
```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep -A2 "TS2345" | head -50
```

---

#### 3.1.3 Duplicate Export Declarations
**Pattern:** `TS2300: Duplicate identifier 'exportName'`

**Files Affected:**
- `apps/web/src/lib/audio/` - Multiple index.ts exports
- `apps/web/src/components/error/` - Error boundary exports

**Fix Strategy:**
1. Consolidate duplicate exports
2. Use `export * from` pattern correctly
3. Remove redundant re-exports

---

### Task 3.2: Implement Missing Feature Flag Config Functions
**Assignee:** @coder-config-specialist  
**Estimated Effort:** 1-2 hours  
**File:** `apps/web/src/config/features.ts`

**Issue:** The following functions are referenced but not implemented:

```typescript
// Missing implementations:
- getFeatureFlags()
- setFeatureOverride()  
- clearFeatureOverride()
- isFeatureEnabled()
```

**Required Implementation:**
```typescript
// apps/web/src/config/features.ts

export interface FeatureFlags {
  enableMLPredictions: boolean;
  enableRealTimeUpdates: boolean;
  enableNewUI: boolean;
  // ... etc
}

const defaultFlags: FeatureFlags = {
  enableMLPredictions: import.meta.env.VITE_ENABLE_ML === 'true',
  enableRealTimeUpdates: true,
  enableNewUI: false,
};

let overrides: Partial<FeatureFlags> = {};

export function getFeatureFlags(): FeatureFlags {
  return { ...defaultFlags, ...overrides };
}

export function setFeatureOverride<K extends keyof FeatureFlags>(
  key: K, 
  value: FeatureFlags[K]
): void {
  overrides[key] = value;
}

export function clearFeatureOverride(key: keyof FeatureFlags): void {
  delete overrides[key];
}

export function isFeatureEnabled(key: keyof FeatureFlags): boolean {
  return getFeatureFlags()[key];
}
```

---

### Task 3.3: Fix GlassCard Prop Validation
**Assignee:** @coder-frontend  
**Estimated Effort:** 30 minutes  
**File:** `apps/web/src/components/ui/GlassCard.tsx`

**Issue:** Missing/excess props in component interface

---

### Task 3.4: Fix D3 Type Declarations
**Assignee:** @coder-frontend  
**Estimated Effort:** 1 hour  
**File:** Type declaration files for D3 visualizations

**Issue:** `d3` module declarations missing for custom visualization types

---

### Task 3.5: Fix Property Type Guards
**Assignee:** @coder-typescript-specialist  
**Estimated Effort:** 2 hours  
**Files:** Components using strict property checking

**Issue:** Runtime property access without proper type guards

---

## HIGH PRIORITY (P1)

### Task 3.6: Fix Audio Export Duplicates
**Assignee:** @coder-cleanup  
**File:** `apps/web/src/lib/audio/index.ts`

### Task 3.7: Update Precheck Scripts
**Assignee:** @coder-devops  
**Files:** `scripts/phase2_precheck.py`, `scripts/phase3_precheck.py`

**Note:** These reference old paths - update for consistency

---

## Verification Commands

After all fixes, verify with:

```bash
# 1. TypeScript compilation
cd apps/web
npx tsc --noEmit
# Should output: 0 errors

# 2. Run tests
cd apps/web
npm run test:run
# Should pass

# 3. Build verification
cd apps/web
npm run build
# Should complete without errors

# 4. Full monorepo build
cd ../..
npm run build
# Should pass
```

---

## Acceptance Criteria

- [ ] `npx tsc --noEmit` returns 0 errors
- [ ] `npm run test:run` passes all tests
- [ ] `npm run build` completes successfully
- [ ] All feature flag functions implemented and tested
- [ ] No console warnings about missing types

---

## Coordination

1. **Start with Task 3.1** (biggest impact)
2. **Parallel work possible:** Tasks 3.2-3.5 can run simultaneously
3. **Report blockers** to Foreman immediately
4. **Use skill:** `advanced-typescript`

---

## Dependencies

- ✅ Phase 1 & 2 structural work (COMPLETE)
- ✅ Scout verification (COMPLETE)
- 🔄 This Phase 3 addresses actual CRIT blockers

---

## Success Metrics

| Metric | Before | After |
|--------|--------|-------|
| TypeScript Errors | 224+ | 0 |
| Test Mock Mismatches | 15+ | 0 |
| Missing Feature Functions | 4 | 0 |
| Build Status | 🔴 FAIL | 🟢 PASS |
