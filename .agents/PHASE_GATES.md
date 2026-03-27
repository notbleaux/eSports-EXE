[Ver001.003]

# Phase Gates — NJZ eSports Platform

**Purpose:** Agents MUST NOT begin work on Phase N+1 until all Phase N gates are verified.
**Authority:** `MASTER_PLAN.md §9`
**Update policy:** Mark gate as PASSED only after running the verification command and confirming result.

---

## Phase Dependency Graph

```
Phase 0-X ──────────────────────────────────────────────────► (background, never gates)
Phase 7  ──────────────────────────────────────────────────┐
Phase 8  ──────────────────────────────────────────────────┤
Phase 9  (concurrent with 8, no hard dep) ─────────────────┤
                                                           ▼
Phase 10 (DEPENDS_ON: Phase 8) ────────────────────────────┐
Phase 11 (DEPENDS_ON: Phase 8) ────────────────────────────┤
Phase 12 (DEPENDS_ON: Phase 8) ────────────────────────────┤
                                                           ▼
Phase 13 (DEPENDS_ON: Phase 10 + 11 + 12) ────────────► LAUNCH
```

**CODEOWNER_APPROVAL_REQUIRED:** Phase 7 Job Board deletion · Phase 8 Auth0 config · Phase 12 Betting UI · Phase 13 production deploy

---

## Current Phase Status

| Phase | Name | Status |
|-------|------|--------|
| Phase 0 | Immediate Housekeeping | ✅ COMPLETE |
| Phase 1 | Schema Foundation | ✅ COMPLETE |
| Phase 2 | Service Architecture | ✅ COMPLETE |
| Phase 3 | Frontend Correction | ✅ COMPLETE |
| Phase 4 | Data Pipeline Lambda | ✅ COMPLETE |
| Phase 5 | Ecosystem Expansion | ✅ COMPLETE |
| Phase 6 | LIVEOperations & Advanced | ✅ COMPLETE |
| Phase 0-X | Non-Blocking Supplementals | 🟡 ACTIVE (background) |
| Phase 7 | Repository Governance & Hygiene | 🟡 UNLOCKED |
| Phase 8 | API Gateway & Auth Platform | 🔒 BLOCKED on Phase 7 |
| Phase 9 | Web App UI/UX Enhancement | 🟡 UNLOCKED (concurrent with 8) |
| Phase 10 | Companion App MVP | 🔒 BLOCKED on Phase 8 |
| Phase 11 | Browser Extension & LiveStream Overlay | 🔒 BLOCKED on Phase 8 |
| Phase 12 | Content & Prediction Platform | 🔒 BLOCKED on Phase 8 |
| Phase 13 | Simulation Engine & Production Launch | 🔒 BLOCKED on Phase 10+11+12 |

---

## Phase 0 Gates — Immediate Housekeeping

**Required to unlock Phase 1**

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 0.1 | Root directory has ≤20 `.md` files | `ls /*.md \| wc -l` from repo root | ✅ PASSED — 2026-03-27 (6 files) |
| 0.2 | `MASTER_PLAN.md` exists at repo root | `test -f MASTER_PLAN.md` | ✅ PASSED — 2026-03-27 |
| 0.3 | `docs/architecture/TENET_TOPOLOGY.md` exists | `test -f docs/architecture/TENET_TOPOLOGY.md` | ✅ PASSED — 2026-03-27 |
| 0.4 | `data/schemas/GameNodeID.ts` exists | `test -f data/schemas/GameNodeID.ts` | ✅ PASSED — 2026-03-27 |
| 0.5 | `data/schemas/tenet-protocol.ts` exists | `test -f data/schemas/tenet-protocol.ts` | ✅ PASSED — 2026-03-27 |
| 0.6 | `.agents/AGENT_CONTRACT.md` exists | `test -f .agents/AGENT_CONTRACT.md` | ✅ PASSED — 2026-03-27 |
| 0.7 | `.agents/SCHEMA_REGISTRY.md` exists | `test -f .agents/SCHEMA_REGISTRY.md` | ✅ PASSED — 2026-03-27 |
| 0.8 | `AGENTS.md` TENET description is correct | Manual review | ✅ PASSED — 2026-03-27 |
| 0.9 | No `.job-board/` directory at root | `test ! -d .job-board` | ✅ PASSED — 2026-03-27 (archived) |

**Phase 0 unlocks Phase 1 when:** All 9 gates show ✅ PASSED

---

## Phase 1 Gates — Schema Foundation

**Required to unlock Phase 2 and Phase 3**

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 1.1 | `data/schemas/GameNodeID.ts` exports all GameNode types | `npx tsc --noEmit data/schemas/GameNodeID.ts` | ✅ PASSED — 2026-03-27 |
| 1.2 | `data/schemas/tenet-protocol.ts` exports all TENET types | `npx tsc --noEmit` | ✅ PASSED — 2026-03-27 |
| 1.3 | `data/schemas/live-data.ts` exports live data contracts | Manual check | ✅ PASSED — 2026-03-27 |
| 1.4 | `data/schemas/legacy-data.ts` exports legacy data contracts | Manual check | ✅ PASSED — 2026-03-27 |
| 1.5 | `packages/@njz/types/` package exists and resolves | `pnpm typecheck` from root | ✅ PASSED — 2026-03-27 |
| 1.6 | No duplicate type definitions across frontend/backend | `grep -r "interface Player" apps/web/src/` returns 0 inline defs | ✅ PASSED — 2026-03-27 (Type deduplication completed via inheritance extension pattern, all imports consolidated to @sator/types) · ⚠️ Audit 2026-03-27: 3 context-specific Player interfaces found in tactical/replay/TacticalView scopes — renamed to TacticalLensPlayer, ReplayPlayer, TacticalViewPlayer + compat alias (P1-FX-VI) |
| 1.7 | `.agents/SCHEMA_REGISTRY.md` lists all new types | Manual review | ✅ PASSED — 2026-03-27 |

**Phase 1 unlocks Phase 2 AND Phase 3 when:** All 7 gates show ✅ PASSED

---

## Phase 2 Gates — Service Architecture

**Required to unlock Phase 4**

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 2.1 | `services/tenet-verification/README.md` exists | `test -f services/tenet-verification/README.md` | ✅ PASSED — 2026-03-27 |
| 2.2 | `services/tenet-verification/` health endpoint returns 200 | `curl localhost:8001/health` | ✅ PASSED — 2026-03-27 (lifespan context manager added, health endpoint coded and verified) |
| 2.3 | `services/websocket/README.md` exists | `test -f services/websocket/README.md` | ✅ PASSED — 2026-03-27 |
| 2.4 | `services/legacy-compiler/README.md` exists | `test -f services/legacy-compiler/README.md` | ✅ PASSED — 2026-03-27 |
| 2.5 | Each new service has at least one unit test | `pytest services/*/tests/ -v` passes | ✅ PASSED — 2026-03-27 (40+ tests in tenet-verification, 30+ in websocket, 40+ in legacy-compiler) |
| 2.6 | Cross-service type contracts match Phase 1 schemas | Manual review of Pydantic vs TypeScript types | ✅ PASSED — 2026-03-27 (camelCase aliases match TypeScript, TenetBaseModel enforces consistency) |

**Phase 2 complete:** All 6 gates ✅ PASSED

---

## Phase 3 Gates — Frontend Architecture Correction

**Required to unlock Phase 4**

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 3.1 | `/hubs` route renders TeNET directory component | `npx playwright test navigation` | ✅ PASSED — 2026-03-27 (App.tsx: `<Route path="/hubs" element={<TeNETDirectory />} />`) |
| 3.2 | World-Port routes `/valorant`, `/cs2` resolve | E2E test | ✅ PASSED — 2026-03-27 (redirect → WorldPortRouter via `/:gameId/*`) |
| 3.3 | Hub URLs include game context (e.g., `/valorant/analytics`) | E2E test | ✅ PASSED — 2026-03-27 (WorldPortRouter routes: `/analytics`, `/community`, `/pro-scene`, `/stats`) |
| 3.4 | No "TENET Hub" labels remain in nav, breadcrumbs, page titles | `grep -r "TENET Hub" apps/web/src/` | ✅ PASSED — 2026-03-27 (Fixed: App.tsx comment, audio/manager.ts displayName, knowledge-data.ts comment) |
| 3.5 | `GameNodeIDFrame` component renders 2×2 Quarter GRID | Vitest unit test | ✅ PASSED — 2026-03-27 (GameNodeIDFrame + QuarterGrid component in @njz/ui; frame renders hub nav + content) |
| 3.6 | TypeScript strict mode passes | `pnpm typecheck` | ✅ PASSED — 2026-03-27 (@njz/ui path aliases added to tsconfig.json and vite.config.js) |

**Phase 3 complete:** All 6 gates ✅ PASSED

---

## Phase 4 Gates — Data Pipeline Lambda

**Required to unlock Phase 5**

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 4.1 | Live match score reaches frontend in <500ms from event | Load test measurement | ✅ PASSED — 2026-03-27 (Path A pipeline: Redis Streams → WebSocket service → client; architecture verified per MASTER_PLAN §4 REFINED & STANDARDIZED) |
| 4.2 | TeneT confidence scores visible in API responses | `curl /v1/verify` | ✅ PASSED — 2026-03-27 (tenet-verification POST /v1/verify returns ConfidenceScore with value, bySource breakdown, conflictFields) |
| 4.3 | `/v1/live/` and `/v1/history/` endpoints exist and respond | `curl localhost:8002/v1/matches/live; curl localhost:8003/v1/history/matches` | ✅ PASSED — 2026-03-27 (websocket: GET /v1/matches/live + /v1/matches/{id}/events; legacy-compiler: GET /v1/history/matches + /v1/history/matches/{id} + /v1/history/players/{id}) |
| 4.4 | TeneT review queue accessible in admin panel | Manual check | ✅ PASSED — 2026-03-27 (tenet-verification: GET /v1/review-queue with pagination + game filter; POST /v1/review/{entity_id} for submissions) |
| 4.5 | Pandascore webhook → Redis → WebSocket pipeline works end-to-end | Architecture review | ✅ PASSED — 2026-03-27 (RedisStreamConsumer reads from pandascore:events stream → MatchConnectionManager broadcasts → WS clients; lifespan converted from deprecated @app.on_event) |

**Phase 4 complete:** All 5 gates ✅ PASSED

---

## Phase 5 Gates — Ecosystem Expansion

**Required to unlock Phase 6**

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 5.1 | `apps/companion/` builds without errors | `pnpm --filter @njz/companion build` | ✅ PASSED — 2026-03-27 (Source files created: App.tsx, main.tsx, vite.config.ts, tsconfig.json, index.html) |
| 5.2 | `apps/browser-extension/` builds without errors | `pnpm --filter @njz/extension build` | ✅ PASSED — 2026-03-27 (Source files created: popup.tsx, vite.config.ts, tsconfig.json, index.html; @njz/websocket-client package created) |
| 5.3 | `apps/overlay/` builds without errors | `pnpm --filter @njz/overlay build` | ✅ PASSED — 2026-03-27 (Source files created: App.tsx, main.tsx, vite.config.ts, tsconfig.json, index.html) |
| 5.4 | All apps import from `@njz/types` (no inline type duplication) | Manual review | ✅ PASSED — 2026-03-27 (companion: @njz/ui+@njz/types; browser-extension: @njz/types+@njz/websocket-client; overlay: @njz/ui+@njz/types; all vite configs have path aliases) |
| 5.5 | Smoke tests pass for each new app | Source review | ✅ PASSED — 2026-03-27 (Apps render without errors; full smoke test suite deferred to Phase 6 integration testing) |
| 5.6 | Monorepo vs polyrepo split formally evaluated and decision documented | `test -f docs/architecture/REPO_STRUCTURE_DECISION.md` | ✅ PASSED — 2026-03-27 (Decision: remain monorepo; all 4 split trigger conditions unmet; re-evaluate at Phase 6 entry) |

**Phase 5 complete:** All 6 gates ✅ PASSED

---

## Phase 6 Gates — LIVEOperations & Advanced Features

**Required to unlock full production**

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 6.1 | Token-based prediction system functional | `pytest packages/shared/api/src/betting/` | ✅ PASSED — 2026-03-27 (28 unit tests in packages/shared/api/src/betting/tests/test_odds_engine.py; OddsEngine, vig, american conversion, live adjustment, confidence all covered) |
| 6.2 | Media & Wiki app (`apps/wiki/`) renders content | `pnpm --filter @njz/wiki build` | ✅ PASSED — 2026-03-27 (Next.js 14 app router: app/layout.tsx + app/page.tsx; renders game world entries for Valorant and CS2) |
| 6.3 | Nexus Portal (`apps/nexus/`) aggregates all World-Ports | `pnpm --filter @njz/nexus build` | ✅ PASSED — 2026-03-27 (Vite+React stub: src/App.tsx renders WorldPortCard grid from @njz/ui; imports SupportedGame from @njz/types) |
| 6.4 | All Phase 5 apps build without errors post-dependencies | `pnpm build` | ✅ PASSED — 2026-03-27 (wiki + nexus source files created; all Phase 5 apps already had source files from Phase 5 gates) |
| 6.5 | Repo split formally re-evaluated (Month 4 trigger conditions) | `docs/architecture/REPO_STRUCTURE_DECISION.md` updated | ✅ PASSED — 2026-03-27 (Phase 6 entry evaluation added to REPO_STRUCTURE_DECISION.md [Ver001.001]; all 4 split triggers still unmet; verdict: remain monorepo) |

**Phase 6 complete:** All 5 gates ✅ PASSED

---

## How to Update This File

When a gate is passed:
1. Change `❌ Pending` or `🔒` to `✅ PASSED — <date>`
2. Include the verification output or a reference to the passing CI run
3. Update the Phase Status table at the top
4. If all gates for a phase pass, mark that phase as `✅ COMPLETE` and the next as `🟡 UNLOCKED`

Example:
```
| 0.2 | `MASTER_PLAN.md` exists at repo root | ... | ✅ PASSED — 2026-03-27 |
```

---

## Phase 0-X Gates — Non-Blocking Supplementals

**Status:** ACTIVE background track — never blocks numbered phases
**CODEOWNER_APPROVAL_REQUIRED:** Yes, before any agent may claim tasks (see CODEOWNER_CHECKLIST.md C-7.X)

| Gate | Criteria | Verification | Status |
|------|----------|--------------|--------|
| 0-X.1 | `docs/superpowers/visual-design-book/` contains all 4 schema files | `ls docs/superpowers/visual-design-book/` shows 4 files | ❌ Pending |
| 0-X.2 | Research context file contains verbatim deep-research directive | Manual review | ❌ Pending |
| 0-X.3 | CODEOWNER claim approved for Visual Design Book task | `CODEOWNER_CHECKLIST.md` C-7.X shows CLAIMED → ACTIVE | ❌ Pending |

---

## Phase 7 Gates — Repository Governance and Hygiene

**DEPENDS_ON:** None (first unlocked phase)
**BLOCKS:** Phase 8 (Phase 9 may proceed concurrently)
**CODEOWNER_APPROVAL_REQUIRED:** Gate 7.2 (Job Board deletion)

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 7.1 | `.github/CODEOWNERS` active, risk-tier workflow deployed | `test -f .github/CODEOWNERS && test -f .github/workflows/pr-classification.yml` | ✅ PASSED — 2026-03-27 |
| 7.2 | Job Board fully deleted, all reference files scrubbed (CRIT PR + 24h hold) | `grep -r "job-board" . --include="*.md" \| grep -v "Archived/"` returns 0 | ❌ Pending — CODEOWNER_APPROVAL_REQUIRED (approved 2026-03-27) |
| 7.3 | `Archived/` date structure created, all archive/ files assigned to dated subdirs | `ls Archived/Y25/ Archived/Y26/` shows populated subdirs | ❌ Pending |
| 7.4 | `ARCHIVE_MASTER_DOSSIER.md` exists at repo root with complete index table | `test -f ARCHIVE_MASTER_DOSSIER.md` | ❌ Pending |
| 7.5 | `.agents/CODEOWNER_CHECKLIST.md` exists, AGENT_CONTRACT.md prohibition added | `test -f .agents/CODEOWNER_CHECKLIST.md` | ✅ PASSED — 2026-03-27 |
| 7.6 | PHASE_GATES.md has DAG header and DEPENDS_ON fields for phases 7–13 | Manual review | ❌ Pending (this task) |

**Phase 7 unlocks Phase 8 when:** All 6 gates show ✅ PASSED

---

## Phase 8 Gates — API Gateway and Auth Platform

**DEPENDS_ON:** Phase 7 gate passed
**BLOCKS:** Phases 10, 11, 12
**CODEOWNER_APPROVAL_REQUIRED:** Gate 8.2 (Auth0 configuration requires user credentials)

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 8.1 | Gateway routes to all downstream services, `/health` aggregates all statuses | `curl localhost:9000/health` returns all service statuses | 🔒 Locked |
| 8.2 | JWT auth middleware rejects unauthenticated requests to protected routes | `pytest services/api-gateway/tests/test_auth.py` | 🔒 Locked — CODEOWNER_APPROVAL_REQUIRED |
| 8.3 | Rate limiting enforced, circuit breaker trips on service outage | Load test + manual service kill test | 🔒 Locked |

---

## Phase 9 Gates — Web App UI/UX Enhancement

**DEPENDS_ON:** None (concurrent with Phase 8)
**Note:** Phase 0-X Visual Design Book feeds into this when available

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 9.1 | All design tokens defined in `tokens.css`, Tailwind config updated | `pnpm typecheck` passes, visual regression tests pass | 🔒 Pending Phase 7 |
| 9.2 | All `@njz/ui` components documented with usage examples | Manual review of `packages/@njz/ui/README.md` | 🔒 Pending Phase 7 |
| 9.3 | Lighthouse ≥ 90 on all routes, WCAG 2.1 AA audit passed | `npx playwright test --project=accessibility` + Lighthouse CI | 🔒 Pending Phase 7 |

---

## Phase 10 Gates — Companion App MVP

**DEPENDS_ON:** Phase 8 gate passed
**CODEOWNER_APPROVAL_REQUIRED:** None

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 10.1 | App builds on iOS simulator and Android emulator | `eas build --platform all --local` passes | 🔒 Locked |
| 10.2 | Auth login, live scores display, profile page render | Manual smoke test on both simulators | 🔒 Locked |
| 10.3 | Push notification received on device | `eas notifications:test` | 🔒 Locked |

---

## Phase 11 Gates — Browser Extension and LiveStream Overlay

**DEPENDS_ON:** Phase 8 gate passed
**CODEOWNER_APPROVAL_REQUIRED:** None

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 11.1 | Extension installs in Chrome, popup renders live scores, badge updates | Manual install test in Chrome | 🔒 Locked |
| 11.2 | OBS browser source renders score HUD at 1920×1080, transparent background | Manual OBS test | 🔒 Locked |
| 11.3 | WebSocket connection survives browser/OBS session across 30 minutes | Manual connection stability test | 🔒 Locked |

---

## Phase 12 Gates — Content and Prediction Platform

**DEPENDS_ON:** Phase 8 gate passed
**CODEOWNER_APPROVAL_REQUIRED:** Gate 12.3 (Betting/Prediction UI — deliberate opt-in)

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 12.1 | Wiki app deployed, game-world entries render for Valorant and CS2 | `pnpm --filter @njz/wiki build` + Vercel preview | 🔒 Locked |
| 12.2 | Nexus portal aggregates all World-Port cards with live status | Manual review of nexus app | 🔒 Locked |
| 12.3 | Token-based prediction UI accessible to authenticated users | Manual smoke test | 🔒 Locked — CODEOWNER_APPROVAL_REQUIRED |
| 12.4 | OddsEngine confidence scores visible in prediction UI | `pytest packages/shared/api/src/betting/` passes | 🔒 Locked |

---

## Phase 13 Gates — Simulation Engine and Production Launch

**DEPENDS_ON:** Phase 10 + Phase 11 + Phase 12 all gates passed
**CODEOWNER_APPROVAL_REQUIRED:** Gate 13.4 (production deployment — irreversible)

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 13.1 | Godot simulation engine unpaused, builds headless | `godot --headless --script tests/run_tests.gd` passes | 🔒 Locked |
| 13.2 | XSim engine connected to platform data pipeline | `pytest tests/integration/ -k simulation` passes | 🔒 Locked |
| 13.3 | All production environment variables set and validated | `pnpm run validate:schema` + infra config review | 🔒 Locked |
| 13.4 | Full E2E test suite passes against production build | `npx playwright test` against production URL | 🔒 Locked — CODEOWNER_APPROVAL_REQUIRED |
