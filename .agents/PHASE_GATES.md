[Ver001.001]

# Phase Gates — NJZ eSports Platform

**Purpose:** Agents MUST NOT begin work on Phase N+1 until all Phase N gates are verified.
**Authority:** `MASTER_PLAN.md §9`
**Update policy:** Mark gate as PASSED only after running the verification command and confirming result.

---

## Current Phase Status

| Phase | Name | Status |
|-------|------|--------|
| Phase 0 | Immediate Housekeeping | ✅ COMPLETE |
| Phase 1 | Schema Foundation | 🟡 UNLOCKED |
| Phase 2 | Service Architecture | 🔒 LOCKED |
| Phase 3 | Frontend Correction | 🔒 LOCKED |
| Phase 4 | Data Pipeline Lambda | 🔒 LOCKED |
| Phase 5 | Ecosystem Expansion | 🔒 LOCKED |
| Phase 6 | LIVEOperations & Advanced | 🔒 LOCKED |

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
| 1.6 | No duplicate type definitions across frontend/backend | `grep -r "interface Player" apps/web/src/` returns 0 inline defs | 🔒 |
| 1.7 | `.agents/SCHEMA_REGISTRY.md` lists all new types | Manual review | ✅ PASSED — 2026-03-27 |

**Phase 1 unlocks Phase 2 AND Phase 3 when:** All 7 gates show ✅ PASSED

---

## Phase 2 Gates — Service Architecture

**Required to unlock Phase 4**

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 2.1 | `services/tenet-verification/README.md` exists | `test -f services/tenet-verification/README.md` | 🔒 |
| 2.2 | `services/tenet-verification/` health endpoint returns 200 | `curl localhost:8001/health` | 🔒 |
| 2.3 | `services/websocket/README.md` exists | `test -f services/websocket/README.md` | 🔒 |
| 2.4 | `services/legacy-compiler/README.md` exists | `test -f services/legacy-compiler/README.md` | 🔒 |
| 2.5 | Each new service has at least one unit test | `pytest services/*/tests/ -v` passes | 🔒 |
| 2.6 | Cross-service type contracts match Phase 1 schemas | Manual review of Pydantic vs TypeScript types | 🔒 |

**Phase 2 unlocks Phase 4 when (together with Phase 3):** All 6 gates show ✅ PASSED

---

## Phase 3 Gates — Frontend Architecture Correction

**Required to unlock Phase 4**

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 3.1 | `/hubs` route renders TeNET directory component | `npx playwright test navigation` | 🔒 |
| 3.2 | World-Port routes `/valorant`, `/cs2` resolve | E2E test | 🔒 |
| 3.3 | Hub URLs include game context (e.g., `/valorant/analytics`) | E2E test | 🔒 |
| 3.4 | No "TENET Hub" labels remain in nav, breadcrumbs, page titles | `grep -r "TENET Hub" apps/web/src/` returns 0 | 🔒 |
| 3.5 | `GameNodeIDFrame` component renders 2×2 Quarter GRID | Vitest unit test | 🔒 |
| 3.6 | TypeScript strict mode passes | `pnpm typecheck` | 🔒 |

**Phase 3 unlocks Phase 4 when (together with Phase 2):** All 6 gates show ✅ PASSED

---

## Phase 4 Gates — Data Pipeline Lambda

**Required to unlock Phase 5**

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 4.1 | Live match score reaches frontend in <500ms from event | Load test measurement | 🔒 |
| 4.2 | TeneT confidence scores visible in API responses | `curl /v1/history/matches?include_confidence=true` | 🔒 |
| 4.3 | `/v1/live/` and `/v1/history/` endpoints exist and respond | `pytest tests/integration/` | 🔒 |
| 4.4 | TeneT review queue accessible in admin panel | E2E admin test | 🔒 |
| 4.5 | Pandascore webhook → Redis → WebSocket pipeline works end-to-end | Integration test | 🔒 |

**Phase 4 unlocks Phase 5 when:** All 5 gates show ✅ PASSED

---

## Phase 5 Gates — Ecosystem Expansion

**Required to unlock Phase 6**

| Gate | Criteria | Verification Command | Status |
|------|----------|---------------------|--------|
| 5.1 | `apps/companion/` builds without errors | `pnpm --filter @njz/companion build` | 🔒 |
| 5.2 | `apps/browser-extension/` builds without errors | `pnpm --filter @njz/extension build` | 🔒 |
| 5.3 | `apps/overlay/` builds without errors | `pnpm --filter @njz/overlay build` | 🔒 |
| 5.4 | All apps import from `@njz/types` (no inline type duplication) | Manual review | 🔒 |
| 5.5 | Smoke tests pass for each new app | `tests/smoke/` per app | 🔒 |
| 5.6 | Monorepo vs polyrepo split formally evaluated and decision documented | `docs/architecture/REPO_STRUCTURE_DECISION.md` exists | 🔒 |

**Phase 5 unlocks Phase 6 when:** All 6 gates show ✅ PASSED

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
