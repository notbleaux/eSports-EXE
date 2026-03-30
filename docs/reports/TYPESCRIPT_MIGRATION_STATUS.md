[Ver001.000]

# TypeScript Migration Status Report

**Date:** 2026-03-30  
**Scope:** apps/web/src/  
**Classification:** P1 Technical Debt

---

## Current State

| Metric | Count | Status |
|--------|-------|--------|
| TypeScript (.tsx/.ts) | 346 files | ✅ Migrated |
| JavaScript (.jsx/.js) | 47 files | 🟡 Pending |
| Duplicate App files | 2 (App.jsx + App.tsx) | 🔴 Conflict |

---

## Critical Issue: Dual App Components

### App.jsx (ACTIVE - v007.000)
- **Used by:** `main.jsx` (entry point)
- **Status:** Legacy, functional
- **Imports:** Hub components from `.jsx` files
- **Features:** Optimized bundle loading, PWA components

### App.tsx (INACTIVE - v001.002)
- **Used by:** Nothing currently
- **Status:** TypeScript, cleaner architecture
- **Imports:** Hub components from proper aliases
- **Features:** Error boundaries, AdminGuard

### Migration Path

The correct approach is to:
1. **Keep App.tsx** — it has proper TypeScript typing
2. **Delete App.jsx** — it's the duplicate
3. **Update main.tsx** — use App.tsx as root
4. **Migrate hub entry points** from .jsx to .tsx

---

## Pending JSX → TSX Migration

### High Priority (Core Components)

```
apps/web/src/
├── App.jsx                    → App.tsx (delete old)
├── main.jsx                   → main.tsx
├── components/
│   ├── ModernQuarterGrid.jsx  → ModernQuarterGrid.tsx
│   ├── ModeToggle.jsx         → ModeToggle.tsx
│   ├── Navigation.jsx         → Navigation.tsx
│   ├── QuarterGrid.jsx        → QuarterGrid.tsx
│   └── QuaternaryGrid.jsx     → QuaternaryGrid.tsx
```

### Medium Priority (Grid System)

```
components/grid/
├── DraggablePanel.jsx
├── PanelSkeleton.jsx (already TSX? verify)
├── PanelTypes/
│   ├── AnalyticsPanel.jsx
│   ├── MinimapPanel.jsx
│   ├── StatsPanel.jsx
│   └── VideoPanel.jsx
```

### Lower Priority (UI Components)

```
components/ui/
├── AnimatedBackground.jsx
├── GlassCard.jsx
├── GlowButton.jsx
├── ModernCard.jsx
└── StatBadge.jsx
```

---

## Hub Entry Point Migration

Current hub imports in App.jsx:
```javascript
const SatorHub = lazy(() => import('./hub-1-sator/index.jsx'));
const RotasHub = lazy(() => import('./hub-2-rotas/index.jsx'));
const ArepoHub = lazy(() => import('./hub-3-arepo/index.jsx'));
const OperaHub = lazy(() => import('./hub-4-opera/index.tsx'));  // ✅ Already TSX
const TenetHub = lazy(() => import('./hub-5-tenet/index.jsx'));
```

All hubs need `index.tsx` entry points.

---

## store/ vs stores/ Duplication

```
apps/web/src/
├── store/     ← Verify contents
└── stores/    ← Verify contents
```

**Action Required:** Audit both directories, consolidate into single `store/` (singular) per convention.

---

## Migration Commands

```bash
# 1. Remove duplicate App.jsx
rm apps/web/src/App.jsx

# 2. Rename main.jsx → main.tsx
mv apps/web/src/main.jsx apps/web/src/main.tsx

# 3. Update hub index files
for hub in hub-1-sator hub-2-rotas hub-3-arepo hub-5-tenet; do
  mv apps/web/src/$hub/index.jsx apps/web/src/$hub/index.tsx
done

# 4. Type check
pnpm run typecheck

# 5. Build test
pnpm run build
```

---

## Verification Checklist

- [ ] App.jsx deleted
- [ ] main.tsx imports App.tsx
- [ ] All hub index files are .tsx
- [ ] No .jsx imports remain in App.tsx
- [ ] pnpm run typecheck passes
- [ ] pnpm run build succeeds
- [ ] E2E tests pass
