[Ver001.000]

# Product Requirements Document (PRD) — Phase 3: Frontend Architecture Correction

## 1. Introduction
The NJZiteGeisTe Platform is currently undergoing a structural correction to align its frontend architecture with the newly established **TENET Topology**. Previously, `hub-5-tenet/` was incorrectly classified as a 5th content hub. This PRD outlines the requirements for refactoring this layer into a navigation and routing infrastructure.

## 2. Goals & Objectives
- **Correct Hub Classification**: Refactor `hub-5-tenet/` from a content hub to a navigation layer.
- **Implement TeNeT Portal**: Create a new user-facing entry page (Home Portal) that replaces the current generic landing page.
- **Implement TeNET Directory**: Create a network directory (game selector) that routes users to specific World-Ports (e.g., `/valorant`, `/cs2`).
- **Standardize Routing**: Update `App.tsx` and all hub routing to match the hierarchical `/game/hub/branch` structure.
- **Shared UI Library**: Create `@njz/ui` to house standardized components used across the TENET hierarchy.

## 3. User Experience (UX) Flow
1. **Entry**: User visits `/` and sees the **TeNeT Portal** (Entry Page).
2. **Game Selection**: User navigates to `/hubs` (the **TeNET Directory**) to see a grid of available game worlds (World-Ports).
3. **World-Port Entry**: Clicking a game (e.g., Valorant) routes to the **World-Port** (e.g., `/valorant`).
4. **Hub Navigation**: Within the World-Port, the user sees a **2×2 Quarter GRID** (SATOR, AREPO, OPERA, ROTAS).
5. **Deep Dive**: User selects a hub and is routed to a specific **TeZeT branch** (e.g., `/valorant/analytics/simrating`).

## 4. Functional Requirements

### 4.1 TeNeT Portal (Entry Page)
- **File**: `apps/web/src/hub-5-tenet/TeNeTPortal.tsx`
- **Replaces**: `apps/web/src/pages/LandingPage.tsx`
- **Features**:
  - Authoritative entry point for the NJZ ecosystem.
  - Clear "Enter Platform" CTA leading to `/hubs`.
  - Onboarding and authentication hooks.

### 4.2 TeNET Network Directory (Game Selector)
- **File**: `apps/web/src/hub-5-tenet/TeNETDirectory.tsx`
- **Route**: `/hubs`
- **Features**:
  - A grid of **WorldPortCard** components representing different games.
  - Visual distinction between active and "coming soon" games.
  - Responsive layout for mobile and desktop.

### 4.3 World-Port Routing & Framing
- **File**: `apps/web/src/hub-5-tenet/WorldPortRouter.tsx`
- **Features**:
  - Handles routing for top-level game paths (`/valorant`, `/cs2`, etc.).
  - Renders the **GameNodeIDFrame** as the standard container for any node.
- **File**: `apps/web/src/hub-5-tenet/GameNodeIDFrame.tsx`
  - Renders the **2×2 Quarter GRID** (SATOR/AREPO/OPERA/ROTAS).

### 4.4 TeZeT Branch Selector
- **File**: `apps/web/src/hub-5-tenet/TeZeTBranch.tsx`
- **Features**:
  - Renders sub-branch selectors within each of the 4 hubs.
  - Dynamically loads branches based on the `GameNodeID` configuration.

### 4.5 Shared UI Package (`@njz/ui`)
- **Package**: `packages/@njz/ui/`
- **Components**:
  - `QuarterGrid`: Standardized 2×2 layout for SATOR, AREPO, OPERA, ROTAS.
  - `WorldPortCard`: Card component for the network directory.
  - `GameNodeBadge`: Badge displaying GameNodeID metadata and confidence scores.

## 5. Technical Constraints
- **Types**: Must use canonical types from `@njz/types` (Phase 1 complete).
- **Routing**: Must use `react-router-dom` v6 patterns already established in `App.tsx`.
- **State**: Use existing `Zustand` and `TanStack Query` patterns for data fetching.
- **Styling**: Must follow the **Boitano-style** pink and sharp geometry visual system documented in `VISUAL_SYSTEM.md`.

## 6. Verification & Acceptance Criteria
- [ ] `/` route renders `TeNeTPortal`.
- [ ] `/hubs` route renders `TeNETDirectory` with a grid of games.
- [ ] Clicking a game routes correctly to its World-Port (e.g., `/valorant`).
- [ ] Hub URLs include game context (e.g., `/valorant/analytics`).
- [ ] `hub-5-tenet/` no longer contains content (ControlPanel, SatorSquare) — these are moved or removed.
- [ ] TypeScript `pnpm run typecheck` passes with zero errors.
- [ ] Playwright E2E navigation tests pass.
