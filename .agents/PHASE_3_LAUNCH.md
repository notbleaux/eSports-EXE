[Ver001.000]

# Phase 3 Launch — Frontend Architecture Correction

**Date:** 2026-03-27
**Status:** 🟡 READY TO LAUNCH (All Phase 2 gates passed)
**Duration Estimate:** ~15 hours
**Dependency:** Phase 2.3-2.4 COMPLETE ✅

---

## Executive Summary

Phase 3 focuses on correcting frontend architecture to align with TENET topology (TeNET navigation layer, not content hub). Primary work: routing correction, component restructuring, and GameNodeIDFrame implementation.

**Phase 3 Gates (Must Pass for Phase 4 Unlock):**
- 3.1: `/hubs` route renders TeNET directory component
- 3.2: World-Port routes `/valorant`, `/cs2` resolve
- 3.3: Hub URLs include game context (e.g., `/valorant/analytics`)
- 3.4: No "TENET Hub" labels in nav/breadcrumbs/titles
- 3.5: `GameNodeIDFrame` renders 2×2 Quarter GRID
- 3.6: TypeScript strict mode passes

---

## Critical Architecture Context

### Current Problem
Frontend currently has `hub-5-tenet/` as a content hub, which violates TENET topology. TeNET is the **navigation layer**, NOT a content hub.

### Required Correction
```
CURRENT (WRONG):
/                    (Home)
├── /hubs            (Navigate to hubs — TeNET is 5th hub)
│   ├── /tenet       (TeNET content — WRONG)
│   ├── /sator       (SATOR content)
│   └── ...
└── /admin

CORRECT (TENET):
/                    (Home)
├── /hubs            (TeNET directory — shows game/hub options)
├── /valorant        (World-Port: Valorant game entry)
│   ├── /analytics   (SATOR hub)
│   ├── /stats       (ROTAS hub)
│   ├── /pro-scene   (OPERA hub)
│   └── /community   (AREPO hub)
├── /cs2             (World-Port: CS2 game entry)
│   ├── /analytics
│   ├── /stats
│   ├── /pro-scene
│   └── /community
└── /admin
```

### Terminology Corrections
- "TENET Hub" → "TeNET Directory" or "Game Directory"
- "Fifth Hub" → "Navigation Layer"
- `hub-5-tenet/` → `navigation/` or `tenet/` (but NOT a content hub)

---

## Phase 3 Tasks & Ownership

### Task 3.1: Routing Structure Correction (~3 hours)

**Current State:** Routes defined in `apps/web/src/routes.ts` or routing context

**Required Changes:**

1. **Add `/hubs` route (TeNET directory entry point)**
   ```typescript
   const routes = [
     {
       path: '/hubs',
       component: () => import('@hub-5/*').then(m => m.TeNETDirectory),
       name: 'Game Directory',
     },
     // ... other routes
   ]
   ```

2. **Add World-Port routes for each game**
   ```typescript
   {
     path: '/:game(valorant|cs2)',
     component: () => import('@/components/WorldPort'),
     children: [
       { path: 'analytics', component: SATORHub },
       { path: 'stats', component: ROTASHub },
       { path: 'pro-scene', component: OPERAHub },
       { path: 'community', component: AREPOHub },
     ],
   }
   ```

3. **Deprecate old `/hubs/:hubId` routing if present**

**Verification Command:**
```bash
npx playwright test navigation.spec.ts --grep "routing"
```

**Files to Modify:**
- `apps/web/src/routes.ts` or `apps/web/src/router.ts`
- `apps/web/src/app.tsx` or root component
- Any config files (`vite.config.ts`, `tsconfig.paths.json`)

---

### Task 3.2: TeNET Directory Component (~2 hours)

**Objective:** Create hub-5-tenet/TeNETDirectory.tsx component

**Requirements:**

```typescript
interface TeNETDirectoryProps {
  // Shows game selection and hub options
}

export function TeNETDirectory() {
  // Displays:
  // - Game selector (Valorant, CS2)
  // - For each game:
  //   ├─ SATOR (Analytics)
  //   ├─ ROTAS (Stats)
  //   ├─ OPERA (Pro)
  //   └─ AREPO (Community)
  // - Links to each hub with game context

  return (
    <div className="tenet-directory">
      {/* Grid of game/hub options */}
    </div>
  )
}
```

**File Location:** `apps/web/src/hub-5-tenet/TeNETDirectory.tsx`

**Exports:** Update `apps/web/src/hub-5-tenet/index.ts`

---

### Task 3.3: GameNodeIDFrame Component (~3 hours)

**Objective:** Implement Quarter GRID (2×2 grid of hubs)

**Requirements:**

The Quarter GRID displays 4 hubs in a 2×2 grid:
```
┌─────────┬─────────┐
│ SATOR   │ ROTAS   │
│ (top-L) │ (top-R) │
├─────────┼─────────┤
│ AREPO   │ OPERA   │
│ (bot-L) │ (bot-R) │
└─────────┴─────────┘
```

```typescript
interface QuarterGridLayout {
  topLeft: 'SATOR'    // Analytics
  topRight: 'ROTAS'   // Stats
  bottomLeft: 'AREPO' // Community
  bottomRight: 'OPERA' // Pro
}

export function GameNodeIDFrame({ game }: { game: string }) {
  // Renders 2×2 grid of hub entrance cards
  // Each card shows:
  // - Hub icon/color
  // - Hub name
  // - Short description
  // - Link to /game/analytics (SATOR), etc.

  return (
    <div className="quarter-grid">
      <HubCard hub="SATOR" game={game} position="top-left" />
      <HubCard hub="ROTAS" game={game} position="top-right" />
      <HubCard hub="AREPO" game={game} position="bottom-left" />
      <HubCard hub="OPERA" game={game} position="bottom-right" />
    </div>
  )
}
```

**File Location:** `apps/web/src/components/GameNodeIDFrame.tsx`

**Component Breakdown:**
- QuarterGrid container
- HubCard component (reusable for each hub)
- Navigation logic to `/game/:hubPath`

**Styling:** CSS Grid or Flexbox, responsive (1×4 on mobile, 2×2 on desktop)

---

### Task 3.4: Navigation & Breadcrumb Updates (~2 hours)

**Changes Required:**

1. **Remove "TENET Hub" labels**
   - Search: `grep -r "TENET Hub" apps/web/src/`
   - Replace with: "Game Directory" or "Navigation"

2. **Update breadcrumbs**
   - `/hubs` → "Game Directory"
   - `/valorant/analytics` → "Valorant > Analytics"
   - Never show "TENET" as a hub name

3. **Update nav sidebar**
   - Rename "TENET Hub" menu item to "Game Directory"
   - Update routing to `/hubs` instead of `/hubs/5` or `/tenet`

**Verification Command:**
```bash
grep -r "TENET Hub" apps/web/src/
# Should return 0 results after changes
```

---

### Task 3.5: Type Safety & Import Consolidation (~2 hours)

**Objective:** Ensure TypeScript strict mode passes

**Changes:**

1. **Verify imports use canonical type sources**
   ```typescript
   // ✅ CORRECT
   import { Player, Team, Match } from '@sator/types'

   // ❌ WRONG
   import { Player } from '@/components/types'
   ```

2. **Fix any `any` type usage**
   - Use TypeScript interfaces instead
   - Add `noImplicitAny: true` verification

3. **Verify exports from index files**
   - `apps/web/src/hub-*/index.ts` should export all components
   - Aliases should resolve correctly (`@hub-1/*`, etc.)

**Verification Command:**
```bash
pnpm typecheck
# Should pass with 0 errors
```

---

### Task 3.6: End-to-End Testing (~2 hours)

**Navigation E2E Tests:**

```typescript
// tests/e2e/navigation.spec.ts
describe('Navigation & Routing', () => {
  test('should navigate to /hubs and show directory', async () => {
    await page.goto('http://localhost:5173/')
    await page.click('[data-testid="nav-game-directory"]')
    await page.waitForURL('**/hubs')
    expect(await page.locator('[data-testid="tenet-directory"]')).toBeVisible()
  })

  test('should navigate to game-specific hub', async () => {
    await page.goto('http://localhost:5173/hubs')
    await page.click('[data-testid="game-valorant"]')
    await page.waitForURL('**/valorant')
    expect(await page.locator('[data-testid="quarter-grid"]')).toBeVisible()
  })

  test('should navigate to specific hub', async () => {
    await page.goto('http://localhost:5173/valorant')
    await page.click('[data-testid="hub-analytics"]')
    await page.waitForURL('**/valorant/analytics')
    expect(await page.locator('[data-testid="sator-hub"]')).toBeVisible()
  })

  test('should show correct breadcrumbs', async () => {
    await page.goto('http://localhost:5173/valorant/analytics')
    const breadcrumbs = await page.locator('.breadcrumb').textContent()
    expect(breadcrumbs).toContain('Valorant')
    expect(breadcrumbs).toContain('Analytics')
    expect(breadcrumbs).not.toContain('TENET')
  })
})
```

**Verification Command:**
```bash
npx playwright test tests/e2e/navigation.spec.ts
```

---

## Task Dependencies & Parallelization

**Sequential Path:**
```
3.1 (Routing)
  ↓
3.2 (TeNET Directory)
  ↓
3.3 (GameNodeIDFrame)
  ├→ 3.4 (Navigation updates) — can run in parallel with 3.3
  ├→ 3.5 (Type safety) — can run in parallel with 3.3
  ↓
3.6 (E2E Testing)
```

**Parallel Opportunities:**
- Tasks 3.4 & 3.5 can start after 3.1 completes
- Task 3.6 can start after 3.3 completes (doesn't depend on all tasks)

---

## File Structure After Phase 3

```
apps/web/src/
├── routes.ts (updated with new routing)
├── navigation/
│   ├── TeNETDirectory.tsx (new)
│   └── index.ts
├── components/
│   ├── GameNodeIDFrame.tsx (new)
│   ├── HubCard.tsx (new)
│   └── Breadcrumb.tsx (updated)
├── hub-1-sator/
│   ├── components/ (existing hubs, no changes)
│   └── index.ts
├── hub-2-rotas/
│   ├── components/
│   └── index.ts
├── hub-3-arepo/
│   ├── components/
│   └── index.ts
├── hub-4-opera/
│   ├── components/
│   └── index.ts
└── hub-5-tenet/
    ├── TeNETDirectory.tsx (navigation, not content)
    ├── index.ts
    └── README.md (clarifies: "Navigation layer, not content hub")
```

---

## Gate Verification Commands

Run these after completing each task:

**After 3.1 (Routing):**
```bash
# Check routes are defined
grep -A5 "path.*hubs\|path.*:game" apps/web/src/routes.ts
```

**After 3.2 (TeNET Directory):**
```bash
# Check component exists
test -f apps/web/src/hub-5-tenet/TeNETDirectory.tsx && echo "✓ OK"
```

**After 3.3 (GameNodeIDFrame):**
```bash
# Check component exists
test -f apps/web/src/components/GameNodeIDFrame.tsx && echo "✓ OK"
```

**After 3.4 (Navigation):**
```bash
# Check no "TENET Hub" references
grep -r "TENET Hub" apps/web/src/ | wc -l
# Should return 0
```

**After 3.5 (Type Safety):**
```bash
pnpm typecheck
# Should show 0 errors
```

**After 3.6 (E2E Testing):**
```bash
npx playwright test tests/e2e/navigation.spec.ts -v
# Should show all tests PASSED
```

---

## Implementation Checklist

- [ ] Task 3.1: Routing structure corrected
- [ ] Task 3.2: TeNET Directory component created
- [ ] Task 3.3: GameNodeIDFrame component created
- [ ] Task 3.4: Navigation/breadcrumb labels updated
- [ ] Task 3.5: TypeScript strict mode passes
- [ ] Task 3.6: E2E navigation tests pass

- [ ] Gate 3.1: `/hubs` renders directory
- [ ] Gate 3.2: World-Ports resolve `/valorant`, `/cs2`
- [ ] Gate 3.3: Hub URLs include game context
- [ ] Gate 3.4: No "TENET Hub" labels found
- [ ] Gate 3.5: GameNodeIDFrame renders 2×2 grid
- [ ] Gate 3.6: TypeScript strict mode passes

---

## Success Criteria

✅ **Phase 3 is complete when:**
1. All 6 routing gates show PASSED
2. Frontend reflects correct TENET topology (navigation layer, not hub)
3. No TypeScript errors in strict mode
4. E2E tests for navigation all pass
5. Code review confirms architecture matches TENET specification

---

## Handoff to Phase 4

Once Phase 3 completes:
1. Update PHASE_GATES.md: Mark gates 3.1-3.6 as PASSED
2. Update PHASE_2_EXECUTION_STATUS.md: Mark Phase 3 as COMPLETE
3. Dispatch Phase 4 specialists (Data Pipeline Lambda)
4. Phase 4 will implement webhook → Redis → WebSocket flow

---

**Ready to launch Phase 3? All Phase 2 gates passed ✅**

Next step: Assign Phase 3 tasks and begin routing implementation.
