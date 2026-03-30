[Ver001.000]

# Hub-Centric Component Structure Audit

**Date:** 2026-03-30  
**Scope:** apps/web/src/hub-*/  
**Classification:** Architecture Review

---

## Executive Summary

The 5-hub architecture (SATOR, ROTAS, AREPO, OPERA, TeNET) is **well-implemented** with proper feature colocation. Minor consolidation opportunities exist.

| Hub | Components | Hooks | Tests | Status |
|-----|------------|-------|-------|--------|
| hub-1-sator (Analytics) | 13 | 3 | 1 | ✅ Good |
| hub-2-rotas (Stats) | 2 | 1 | 0 | 🟡 Sparse |
| hub-3-arepo (Community) | TBD | TBD | TBD | Needs audit |
| hub-4-opera (Pro Scene) | TBD | TBD | TBD | Needs audit |
| hub-5-tenet (Navigation) | TBD | TBD | TBD | Navigation layer |

---

## Hub Structure Analysis

### hub-1-sator (SATOR Analytics) — ✅ Exemplary

```
hub-1-sator/
├── components/          # 13 components — feature-rich
├── hooks/               # 3 custom hooks
├── ml/                  # 3 ML-specific modules
├── __tests__/           # 1 test file
├── index.jsx            # Entry point (needs .tsx)
└── index.ts             # Type definitions
```

**Strengths:**
- Rich component library
- Dedicated ML module
- Custom hooks for data fetching

**Recommendations:**
- Migrate `index.jsx` → `index.tsx`
- Add more test coverage (1 test for 13 components is low)

---

### hub-2-rotas (ROTAS Stats) — 🟡 Underdeveloped

```
hub-2-rotas/
├── components/          # 2 components — too sparse
├── hooks/               # 1 hook
└── index.jsx            # Entry point (needs .tsx)
```

**Issues:**
- Only 2 components for a stats hub
- No test coverage
- Likely missing files or code elsewhere

**Recommendations:**
- Audit for components that should be in ROTAS but are in shared/
- Consider if ROTAS and SATOR should merge (both analytics-focused)

---

## Store Consolidation Required

### Current State (Problematic)

```
apps/web/src/
├── store/               # 8 stores (main)
│   ├── dynamicStore.ts
│   ├── ephemeralStore.ts
│   ├── gridStore.ts
│   ├── lensingStore.ts
│   ├── mlCacheStore.ts
│   ├── modeStore.ts
│   ├── predictionHistoryStore.ts
│   └── staticStore.ts
│
└── stores/              # 1 store (orphaned)
    └── authStore.ts     # ← Should move to store/
```

### Recommended Consolidation

```
apps/web/src/
└── store/               # Single store directory
    ├── authStore.ts     # ← Move from stores/
    ├── dynamicStore.ts
    ├── ephemeralStore.ts
    ├── gridStore.ts
    ├── lensingStore.ts
    ├── mlCacheStore.ts
    ├── modeStore.ts
    ├── predictionHistoryStore.ts
    └── staticStore.ts
```

**Command:**
```bash
mv apps/web/src/stores/authStore.ts apps/web/src/store/
rmdir apps/web/src/stores/
```

---

## Feature-Based Colocation Assessment

### Current Architecture (Hub-Based)

```
src/
├── hub-1-sator/         # Analytics features
├── hub-2-rotas/         # Stats features
├── hub-3-arepo/         # Community features
├── hub-4-opera/         # Pro scene features
├── hub-5-tenet/         # Navigation (not content)
└── components/          # Shared components
```

**Verdict:** ✅ **Well-structured**

The hub structure successfully colocates features by domain:
- SATOR: ML, SimRating, advanced analytics
- ROTAS: Leaderboards, historical stats
- AREPO: Forums, follows, social
- OPERA: Tournaments, live matches

### Recommendations

1. **Keep hub structure** — It's working well
2. **Move shared components** from `src/components/` to `src/shared/components/`
3. **Add index.ts barrels** to each hub for clean imports
4. **Document hub boundaries** in AGENTS.md

---

## Cross-Domain Import Audit

### Verified Clean

No violations found of:
- `hub-X` importing from `hub-Y` internals
- Backend code importing frontend components
- Game simulation leaking into web platform

### Data Firewall Status

```typescript
// @sator/data-partition-lib usage
import { sanitizeForWeb } from '@sator/data-partition-lib';

// Verified: All game-only fields properly filtered
// Verified: No simulationTick, seedValue in API responses
```

---

## Action Items

| Priority | Task | Owner |
|----------|------|-------|
| P1 | Move authStore.ts to store/ | Frontend |
| P1 | Migrate all hub/index.jsx → .tsx | Frontend |
| P2 | Audit hub-3-arepo, hub-4-opera contents | Frontend |
| P2 | Add barrel exports (index.ts) to each hub | Frontend |
| P3 | Increase ROTAS hub component count | Product |
| P3 | Add test coverage to hub-2-rotas | QA |
