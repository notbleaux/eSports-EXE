# TypeScript Remediation Plan

## Current Status
- Total Errors: 3,322
- TS6133 (unused variables): 851
- Target: <100 errors

## Phase 1: Hub Export Fixes (Priority 1)
Files to create:
1. `src/hub-3-arepo/index.ts` - Re-export ArepoHub.tsx
2. `src/hub-4-opera/index.d.ts` - Type declaration for OperaHub

## Phase 2: Sator Square Types (Priority 2)
New components requiring type attention:
- SatorSquare.tsx (224 lines)
- 5 layer components (Arepo, Opera, Rotas, Sator, Tenet)
- useSpatialData.ts (293 lines)
- Type guards in src/types/guards.ts (410 lines)

## Phase 3: TS6133 Batch Cleanup (Priority 3)
Strategy: File-by-file targeted fixes
- Focus on high-error-count files first
- Remove unused imports
- Prefix unused parameters with underscore
- Document intentional unused variables

## Execution Order
1. Fix hub exports (blocks React.lazy loading)
2. Verify Sator Square types compile
3. Systematic TS6133 cleanup
