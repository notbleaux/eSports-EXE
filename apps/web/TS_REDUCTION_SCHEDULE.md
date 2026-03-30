# TypeScript Error Reduction Schedule
# Current: 2,104 errors (Target: <100)
# Started: 2026-03-30

## Pass Schedule

### Pass 1: TS2339 Property Fixes (SpecMapViewer)
**Target:** ~400 errors in SpecMapViewer lens types
**Files:** 
- src/components/SpecMapViewer/lens/analytical/*.ts
- src/components/SpecMapViewer/lens/core/*.ts
- Missing interfaces: GameData, KillEvent, DamageEvent, Lens

### Pass 2: TS2694 Namespace/Three.js Fixes
**Target:** ~176 namespace errors
**Files:**
- src/lib/map3d/*.ts
- src/lib/three/*.ts
- Need: Proper @types/three resolution

### Pass 3: TS2304/TS2614 Missing Symbols
**Target:** ~200 missing symbol/module errors
**Files:**
- Missing index.ts exports
- Missing type definitions

### Pass 4: TS2322 Type Compatibility
**Target:** ~190 type assignment errors
**Files:**
- Component prop mismatches
- Hook return type mismatches

## Progress Log

| Time | Pass | Errors Before | Errors After | Notes |
|------|------|---------------|--------------|-------|
| 23:45 | Setup | 2,104 | - | Cron jobs initialized |
