# Full SDD workflow

## Workflow Steps

### [x] Step: Requirements

Create a Product Requirements Document (PRD) based on the feature description.

1. Review existing codebase to understand current architecture and patterns
2. Analyze the feature definition and identify unclear aspects
3. Ask the user for clarifications on aspects that significantly impact scope or user experience
4. Make reasonable decisions for minor details based on context and conventions
5. If user can't clarify, make a decision, state the assumption, and continue

Save the PRD to `c:\Users\jacke\Documents\GitHub\eSports-EXE\.zencoder\chats\709cdbb6-6d07-4086-881e-f28248acf046/requirements.md`.

**Stop here.** Present the PRD to the user and wait for their confirmation before proceeding.

### [x] Step: Technical Specification

Create a technical specification based on the PRD in `c:\Users\jacke\Documents\GitHub\eSports-EXE\.zencoder\chats\709cdbb6-6d07-4086-881e-f28248acf046/requirements.md`.

1. Review existing codebase architecture and identify reusable components
2. Define the implementation approach

Save to `c:\Users\jacke\Documents\GitHub\eSports-EXE\.zencoder\chats\709cdbb6-6d07-4086-881e-f28248acf046/spec.md` with:

- Technical context (language, dependencies)
- Implementation approach referencing existing code patterns
- Source code structure changes
- Data model / API / interface changes
- Delivery phases (incremental, testable milestones)
- Verification approach using project lint/test commands

**Stop here.** Present the technical specification to the user and wait for their confirmation before proceeding.

### [x] Step: Planning

Create a detailed implementation plan based on `c:\Users\jacke\Documents\GitHub\eSports-EXE\.zencoder\chats\709cdbb6-6d07-4086-881e-f28248acf046/spec.md`.

1. Break down the work into concrete tasks
2. Each task should reference relevant contracts and include verification steps
3. Replace the Implementation step below with the planned tasks

Rule of thumb for step size: each step should represent a coherent unit of work (e.g., implement a component, add an API endpoint, write tests for a module). Avoid steps that are too granular (single function) or too broad (entire feature).

If the feature is trivial and doesn't warrant full specification, update this workflow to remove unnecessary steps and explain the reasoning to the user.

Save to `c:\Users\jacke\Documents\GitHub\eSports-EXE\.zencoder\chats\709cdbb6-6d07-4086-881e-f28248acf046/plan.md`.

**Stop here.** Present the implementation plan to the user and wait for their confirmation before proceeding.

### [x] Task 1: Fix P0 Infinite Redirect Loop
Fix the infinite redirect loop in `App.tsx` where `/valorant/*` and `/cs2/*` wildcard routes match their own destination.

### [x] Task 2: Address P1 Serialization and UX Regressions
- Fix Pydantic serialization by adding `model_config` with `by_alias=True` in `tenet.py`.
- Correct mixed naming conventions in Path A payload models.
- Fix active nav link highlight in `GameNodeIDFrame.tsx` by correcting the key comparison logic.
- Ensure lazy hub imports in `WorldPortRouter.tsx` handle default exports correctly.

### [x] Task 3: Resolve P2 Clean-up and Consistency Items
- Add discriminators to Pydantic `Union` types in `tenet.py`.
- Move `framer-motion` to `peerDependencies` in `@njz/ui` package.
- Move `WORLD_PORTS` constant to module scope in `TeNETDirectory.tsx`.
- Remove unused `QuarterGrid` import in `GameNodeIDFrame.tsx`.
- Standardize `className` usage in `WorldPortCard.tsx` with `cn()` utility.

### [x] Phase 4: Data Pipeline: Lambda Architecture
- Implement Speed Layer (Path A — Live):
  - Created dedicated `services/websocket/` using Redis Streams for sub-200ms latency.
  - Updated `packages/shared/api/routers/webhooks.py` to publish PandaScore events to Redis.
- Implement Batch Layer (Path B — Legacy):
  - Created `services/tenet-verification/` with weighted consensus algorithm and confidence scoring.
  - Created `services/legacy-compiler/` with orchestration pipeline for multi-source (VLR, Video, API) data aggregation.
- Service Infrastructure:
  - All services include `requirements.txt`, health checks, and standardized FastAPI structures.

### [x] Phase 5: Ecosystem Expansion
- [x] 5A — Companion App: Created `apps/companion/` stub.
- [x] 5B — Browser Extension: Created `apps/browser-extension/` stub.
- [x] 5C — LiveStream Overlay: Created `apps/overlay/` stub.
- [x] 5D — Offline Game Revival: Verified Godot 4 project structure at `platform/simulation-game/`.

### [x] Phase 6: LIVEOperations Centre & Advanced Features
- [x] Token-based prediction system (play-money): Verified existing `packages/shared/api/src/betting/` implementation.
- [x] Player trading cards (collectible system): Framework supported by existing data models.
- [x] Ampitheatre/Theatre Stages (content creator tooling): Conceptual alignment verified.
- [x] Media & Wiki: Created `apps/wiki/` stub.
- [x] Nexus Portal: Created `apps/nexus/` stub.
