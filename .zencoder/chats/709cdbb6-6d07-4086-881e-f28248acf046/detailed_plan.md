[Ver001.000]

# Detailed Implementation Plan — Phase 3: Frontend Architecture Correction

## Task 1: Foundation & Entry Page
- [ ] Implement `apps/web/src/hub-5-tenet/TeNeTPortal.tsx` using the Boitano-pink visual style from `LandingPage.tsx`.
  - Verification: Component renders at `/` and includes a CTA to `/hubs`.
- [ ] Implement `apps/web/src/hub-5-tenet/TeNETDirectory.tsx` with a game world grid.
  - Verification: Component renders at `/hubs` and lists Valorant and CS2 as options.
- [ ] Update `App.tsx` to map `/` to `TeNeTPortal` and `/hubs` to `TeNETDirectory`.
  - Verification: Manual navigation to `/` and `/hubs` works as expected.

## Task 2: Core Hierarchical Infrastructure
- [ ] Implement `apps/web/src/hub-5-tenet/GameNodeIDFrame.tsx` with a 2×2 hub layout.
  - Verification: Frame renders and correctly wraps child hub components.
- [ ] Implement `apps/web/src/hub-5-tenet/WorldPortRouter.tsx` to handle nested routes.
  - Verification: Routes like `/valorant/analytics` load the correct hub within the frame.
- [ ] Implement `apps/web/src/hub-5-tenet/TeZeTBranch.tsx` for branch-level navigation.
  - Verification: Deep links like `/valorant/analytics/simrating` load correctly.

## Task 3: Migration & Integration
- [ ] Update `App.tsx` to use the new hierarchical router for all game worlds.
  - Verification: Existing `/valorant` and `/cs2` links point to the new infrastructure.
- [ ] Refactor existing hub components to be compatible with `GameNodeIDFrame`.
  - Verification: SATOR, AREPO, OPERA, and ROTAS load correctly in the new layout.
- [ ] Implement standardized `@njz/ui` components (or local equivalent) for `QuarterGrid` and `WorldPortCard`.
  - Verification: Components are used consistently across the new navigation.

## Task 4: Cleanup & Quality
- [ ] Move `ControlPanel.tsx` and `SatorSquare.tsx` out of `hub-5-tenet/`.
  - Verification: `hub-5-tenet/` contains only navigation/framing components.
- [ ] Run `pnpm run typecheck` and `pnpm run lint`.
  - Verification: Zero errors or warnings in the `apps/web` project.
- [ ] Add and run Playwright E2E tests for the new navigation flow.
  - Verification: All tests pass.
- [ ] Final visual audit against `VISUAL_SYSTEM.md`.
  - Verification: Platform maintains aesthetic consistency.
