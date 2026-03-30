# TypeScript Error Reduction Schedule
# Current: 2,142 errors (Target: <100)
# Started: 2026-03-30

## Cron Jobs Scheduled

| Job ID | Name | Schedule | Next Run |
|--------|------|----------|----------|
| f160f41f | ts-pass-1-specmap | */30 * * * * | Every 30 min |
| 0fb3f12b | ts-pass-2-threejs | */30 * * * * | Every 30 min |
| 40191bc7 | ts-pass-3-symbols | */30 * * * * | Every 30 min |

## Pass Schedule

### Pass 1: TS2339 Property Fixes (SpecMapViewer) - IN PROGRESS
**Target:** ~400 errors in SpecMapViewer lens types
**Files:** 
- src/components/SpecMapViewer/lens/analytical/*.ts
- src/components/SpecMapViewer/lens/core/*.ts
- Missing interfaces: GameData, KillEvent, DamageEvent, Lens

**Completed:**
- ✅ Extended GameData with soundEvents, killEvents, damageEvents, playerPositions, metadata
- ✅ Added isFirstBlood to KillEvent
- ✅ Added isFatal and isFirstBlood to DamageEvent
- ✅ Added defaultOptions, displayName, opacity to Lens interface
- ✅ Added velocity to TimedPosition
- ✅ Added team to PlayerPosition

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

| Time | Pass | Errors Before | Errors After | TS2339 | Notes |
|------|------|---------------|--------------|--------|-------|
| 23:45 | Setup | 2,104 | - | 720 | Cron jobs initialized |
| 00:00 | Pass 1 | 2,104 | 2,108 | 705 | GameData extended |
| 00:15 | Pass 1 | 2,108 | 2,142 | 685 | Lens/position types fixed |

## Error Category Tracking

| Code | Initial | Current | Delta |
|------|---------|---------|-------|
| TS2339 | 720 | 685 | -35 ✅ |
| TS2322 | 190 | 207 | +17 |
| TS2694 | 176 | 176 | 0 |
| TS2304 | 106 | 106 | 0 |
| TS2614 | 94 | 94 | 0 |
| Total | 2,104 | 2,142 | +38 |

## Commits Today

| Commit | Description |
|--------|-------------|
| 0a4e9c2 | Add GameData/event type extensions |
| 1f6cab0 | Add Lens/position properties |
