[Ver001.000]

# Technical Specification — Phase 3: Frontend Architecture Correction

## 1. Technical Context
- **Language**: TypeScript 5.9+
- **Framework**: React 18
- **Routing**: react-router-dom v6
- **Styling**: Tailwind CSS
- **Components**: Framer Motion (animations), Lucide React (icons)
- **Shared Types**: `@njz/types` (already in workspace)

## 2. Implementation Approach
We will refactor the existing flat routing structure into a hierarchical system that reflects the TENET Topology. The `hub-5-tenet` directory will be transformed from a "content hub" into the core navigation and framing infrastructure of the platform.

### Key Patterns:
- **Hierarchical Routing**: Use nested routes in `App.tsx` to handle game-specific contexts.
- **Framing**: Use a layout component (`GameNodeIDFrame`) to wrap all hub content with the standard 2×2 grid and navigation.
- **Shared UI**: Extract reusable layout components into a new `@njz/ui` package (or a dedicated directory if package creation is deferred).

## 3. Source Code Structure Changes

### 3.1 New Components (in `apps/web/src/hub-5-tenet/`)
- `TeNeTPortal.tsx`: The new `/` entry page (replacing `LandingPage.tsx`).
- `TeNETDirectory.tsx`: The game selector at `/hubs`.
- `WorldPortRouter.tsx`: Orchestrates routing for a specific game (e.g., `/valorant/*`).
- `GameNodeIDFrame.tsx`: The standard layout frame for all nodes.
- `TeZeTBranch.tsx`: Selector for hub sub-branches.

### 3.2 Refactoring / Movement
- `hub-5-tenet/components/ControlPanel.tsx` → Move to `apps/web/src/pages/admin/` or a dedicated system hub.
- `hub-5-tenet/components/SatorSquare.tsx` → Move to `apps/web/src/components/visualization/`.
- `LandingPage.tsx` → Retire in favor of `TeNeTPortal.tsx`.
- `GameWorldPage.tsx` → Retire in favor of `WorldPortRouter.tsx`.

## 4. Data Model / API / Interface Changes
- **Routing Structure**:
  - `/` -> `TeNeTPortal`
  - `/hubs` -> `TeNETDirectory`
  - `/:gameId` -> `WorldPortRouter` (Entry to World-Port)
  - `/:gameId/:hubId` -> `HubContent` (SATOR, AREPO, OPERA, ROTAS)
  - `/:gameId/:hubId/:branchId` -> `TeZeTBranch` (Deep dive)

- **Props for `GameNodeIDFrame`**:
  ```typescript
  interface GameNodeIDFrameProps {
    gameId: string;
    activeHubId?: string;
    children: React.ReactNode;
  }
  ```

## 5. Delivery Phases

### Phase 3.1: Foundation & Entry
1. Implement `TeNeTPortal.tsx` and update `/` route.
2. Implement `TeNETDirectory.tsx` and update `/hubs` route.
3. Extract `QuarterGrid` to a shared component if not already standalone.

### Phase 3.2: Hierarchical Routing
1. Implement `WorldPortRouter.tsx` and `GameNodeIDFrame.tsx`.
2. Update `App.tsx` to use nested routes for `:gameId`.
3. Migrate existing Valorant/CS2 placeholders to the new router.

### Phase 3.3: Cleanup & Refinement
1. Move `ControlPanel` and `SatorSquare` to their new homes.
2. Remove legacy routes and redirects once verified.
3. Final visual polish based on `VISUAL_SYSTEM.md`.

## 6. Verification Approach
- **Type Checking**: `pnpm run typecheck` in `apps/web`.
- **Linting**: `pnpm run lint` in `apps/web`.
- **E2E Testing**: Add new Playwright specs for:
  - Navigation from `/` to `/hubs`.
  - Selection of a game and routing to `/valorant`.
  - Switching between hubs within a game context.
- **Manual Verification**: Verify that the "pink Boitano-style" is preserved in the new `TeNeTPortal`.
