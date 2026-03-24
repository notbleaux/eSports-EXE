# [JLB-LISTING] Phase 3 Task 1: Fix TypeScript Compilation Errors

**ID:** PHASE3-CRIT-TYPESCRIPT-001  
**Priority:** P0 - CRITICAL  
**Phase:** 3  
**Status:** ACTIVE  
**Assignee:** @coder-typescript-specialist  
**Estimated:** 4-6 hours  

## Objective
Fix the 224+ TypeScript compilation errors blocking production builds.

## Error Categories to Fix

### Category A: Missing Type Exports (TS2307)
**Pattern:** `Cannot find module './types' or corresponding type declarations`

**Files to Scout:**
```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep "TS2307" | head -50
```

**Likely Affected Areas:**
- `apps/web/src/components/SATOR/RAR/` - Missing RAR type exports
- `apps/web/src/lib/ml/` - Missing ML inference types
- `apps/web/src/hooks/workers/` - Missing worker message types
- `apps/web/src/api/` - Missing API response types

**Fix Pattern:**
1. Identify missing type exports
2. Create or update `types.ts` files
3. Export all required interfaces
4. Update imports

**Acceptance:**
- [ ] No TS2307 errors remain

---

### Category B: Test Mock Interface Mismatches (TS2345)
**Pattern:** `Argument of type 'X' is not assignable to parameter of type 'Y'`

**Files to Scout:**
```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep -B2 "TS2345" | head -100
```

**Likely Affected Tests:**
- `apps/web/src/hooks/__tests__/useMLInference.test.ts`
- `apps/web/src/hooks/__tests__/useMLModelManager.test.ts`
- `apps/web/src/components/__tests__/MLPredictionPanel.test.tsx`

**Fix Pattern:**
1. Compare mock objects with actual interfaces
2. Add missing properties to mocks
3. Use `Partial<Type>` where appropriate
4. Cast mocks properly: `as unknown as Type`

**Acceptance:**
- [ ] No TS2345 errors in test files

---

### Category C: Duplicate Export Declarations (TS2300)
**Pattern:** `Duplicate identifier 'exportName'`

**Files to Scout:**
```bash
cd apps/web
npx tsc --noEmit 2>&1 | grep "TS2300" | head -30
```

**Likely Affected:**
- `apps/web/src/lib/audio/index.ts`
- `apps/web/src/components/error/index.ts`
- `apps/web/src/lib/animation/index.ts`

**Fix Pattern:**
1. Identify duplicate exports
2. Consolidate into single export statement
3. Use `export * from './module'` pattern
4. Remove redundant re-exports

**Acceptance:**
- [ ] No TS2300 errors remain

---

## Verification Commands

After each category fix, run:
```bash
cd apps/web
npx tsc --noEmit 2>&1 | wc -l
```

Track error count reduction:
- Start: ~224 errors
- After Category A: Target <150 errors
- After Category B: Target <50 errors  
- After Category C: Target 0 errors

---

## Deliverables

1. **Commit:** `[JLB-PHASE3] Fix TypeScript errors - Category X`
2. **Report:** Error count before/after for each category
3. **Verification:** `npx tsc --noEmit` returns 0 errors

---

## Coordination

- Work in parallel with PHASE3-CRIT-FEATURES-002 (feature flags)
- Report any systemic issues to Foreman
- Do NOT change runtime logic - fix types only
