# TypeScript Error Fix Plan - RETURN-1 Agent Report

## Current Status

| Metric | Count |
|--------|-------|
| **Total TS Errors** | 2,759 |
| **TS6133 (Unused Variables)** | 1,216 (44% of all errors) |
| **TS6196 (Unused Exports)** | 118 |
| **Target** | <100 errors |

## Top Error Types

| Error Code | Count | Description |
|------------|-------|-------------|
| TS6133 | 1,216 | 'X' is declared but its value is never read |
| TS2339 | 293 | Property 'X' does not exist on type |
| TS2322 | 253 | Type 'X' is not assignable to type 'Y' |
| TS6196 | 118 | 'X' is declared but never used |
| TS7006 | 113 | Parameter 'X' implicitly has 'any' type |
| TS2614 | 98 | Module '"X"' has no exported member |
| TS2304 | 97 | Cannot find name 'X' |
| TS2345 | 73 | Argument of type 'X' is not assignable |
| TS2353 | 50 | Object literal may only specify known properties |
| TS2484 | 47 | Derived classes must call super() |

## TS6133 Quick Fix Candidates

Files with highest TS6133 counts (easy wins):

| File | TS6133 Count |
|------|-------------|
| src/lib/ml/pipeline/__tests__/pipeline.expanded.test.ts | 37 |
| src/lib/cognitive/adaptive/__tests__/adaptive.test.ts | 31 |
| src/lib/ml/pipeline/manager.ts | 20 |
| src/lib/map3d/__tests__/optimization.error.test.ts | 20 |
| src/hub-2-rotas/MLModelRegistry.tsx | 17 |
| src/lib/ingestion/__tests__/ingestion.test.ts | 14 |
| src/components/realtime/LiveDashboard.tsx | 14 |
| src/lib/replay/camera/__tests__/director.test.ts | 12 |
| src/components/realtime/PredictionPanel.tsx | 12 |
| src/components/replay/AnnotationTools.tsx | 11 |

## Batch Fix Strategy

### Phase 1: TS6133 Mass Fix (Target: 1,216 → ~200 errors)
**Approach:** Automated removal of unused imports and variables

**Safe to auto-fix:**
1. Unused imports (`import { X } from 'y'` where X is never used)
2. Unused variables declared with `const`/`let`/`var`
3. Unused function parameters (prefix with `_`)
4. Unused React imports in .tsx files (React 17+ doesn't need it)

**Command pattern for sed/perl:**
```bash
# Remove unused imports (careful - one per file, verify no side effects)
# Remove unused const/let declarations
# Prefix unused params with _
```

**Files prioritized (top 30 account for ~400 TS6133 errors):**
1. Test files (safe to remove unused imports/variables)
2. Component files (React imports, unused state)
3. Library files (unused utilities)

### Phase 2: TS6196 Unused Exports (118 errors)
**Approach:** Either use the exports or remove them

### Phase 3: Property/Type Errors (TS2339/TS2322 - 546 errors)
**Approach:** 
- Add missing properties to types
- Fix type assertions
- Update interfaces

### Phase 4: Module Resolution (TS2614/TS2307 - 130 errors)
**Approach:**
- Add missing type declarations
- Fix import paths
- Install missing @types packages

## Recommended Fix Order

1. **Start with test files** - Safest to fix, often just unused imports
2. **React imports in .tsx** - Can safely remove most `import React` statements
3. **Unused hook imports** - Common pattern `import { useState, useEffect }` when only one is used
4. **Unused constants** - API URLs, config objects declared but unused
5. **Unused function parameters** - Prefix with `_`

## Ready to Fix: YES

**Estimated fix rate:**
- TS6133: 1,216 errors can be reduced to ~100 with automated + manual fixes
- TS6196: 118 errors can be reduced to ~20
- Combined Phase 1: ~1,200 errors eliminated, leaving ~1,500

**Next agent should:**
1. Start with top 10 TS6133 files
2. Use pattern: remove unused imports first, then unused variables
3. For each file: verify changes don't break functionality
4. Commit after every ~10 files
5. Re-run tsc to verify error count reduction

## Files to Skip (Complex)

These files have mixed error types requiring careful analysis:
- MLPredictionPanel.test.tsx (interface mismatches)
- StreamingPredictionPanel.test.tsx (type mismatches)
- Files with >5 different error types
