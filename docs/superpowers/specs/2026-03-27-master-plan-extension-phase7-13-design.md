[Ver001.000]

# Master Plan Extension — Phase 7–13 + Governance Framework Design

**Date:** 2026-03-27
**Status:** APPROVED — Implementation-Ready
**Authority:** MASTER_PLAN.md §4 (extended)
**Scope:** Phase 0-X non-blockers, Phases 7–13 full plan, CODEOWNER framework, PR/commit conventions, archive consolidation protocol, agent spawning sequence, time-quarter system, Visual Design Book request

---

## Table of Contents

1. [Scope and Rationale](#1-scope-and-rationale)
2. [Phase Dependency Graph](#2-phase-dependency-graph)
3. [Phase 0-X — Non-Blocking Supplementals](#3-phase-0-x--non-blocking-supplementals)
4. [Phase 7 — Repository Governance and Hygiene](#4-phase-7--repository-governance-and-hygiene)
5. [Phase 8 — API Gateway and Auth Platform](#5-phase-8--api-gateway-and-auth-platform)
6. [Phase 9 — Web App UI/UX Enhancement](#6-phase-9--web-app-uiux-enhancement)
7. [Phase 10 — Companion App MVP](#7-phase-10--companion-app-mvp)
8. [Phase 11 — Browser Extension and LiveStream Overlay](#8-phase-11--browser-extension-and-livestream-overlay)
9. [Phase 12 — Content and Prediction Platform](#9-phase-12--content-and-prediction-platform)
10. [Phase 13 — Simulation Engine and Production Launch](#10-phase-13--simulation-engine-and-production-launch)
11. [CODEOWNER Framework](#11-codeowner-framework)
12. [PR and Commit Convention System](#12-pr-and-commit-convention-system)
13. [Archive Consolidation Protocol](#13-archive-consolidation-protocol)
14. [Monthly Archive Index Report Protocol](#14-monthly-archive-index-report-protocol)
15. [Agent Spawning Sequence](#15-agent-spawning-sequence)
16. [Time-Quarter Cadence System](#16-time-quarter-cadence-system)
17. [Visual Design Book Request File](#17-visual-design-book-request-file)
18. [Document Update Checklist](#18-document-update-checklist)

---

## 1. Scope and Rationale

All phases 0–6 are verified COMPLETE as of 2026-03-27. This document extends the Master Plan to Phase 13 and introduces the governance infrastructure that was deferred during the initial build-out.

**The critical gap addressed here:** the repo has no CODEOWNERS file, no risk-tiered PR system, no formal commit conventions, a deprecated 329-file Job Board in archive/ posing a security surface, and no archive consolidation strategy. Phase 7 resolves all of these before any new feature work begins.

**Approach selected:** Infrastructure-first (Approach 1). Phase 9 UI/UX runs concurrently with Phase 8 Auth as the sole exception. All client app phases (10, 11, 12) are hard-blocked on Phase 8 completion.

---

## 2. Phase Dependency Graph

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

**CODEOWNER_APPROVAL_REQUIRED touchpoints:**
- Phase 7: Job Board deletion PR (CRIT)
- Phase 8: Auth0 provider configuration (requires user credentials)
- Phase 12: Betting UI feature (gambling-adjacent, deliberate opt-in)
- Phase 13: Production deployment (irreversible)

---

## 3. Phase 0-X — Non-Blocking Supplementals

**Status:** Parallel background track — never blocks any numbered phase gate.
**CODEOWNER approval required:** Yes, before any agent may claim tasks.

### 0-X.1 — Website UI/UX Visual Design Book

A deep research task producing a Visual Design Book comprising 6 analysis reports. This is assigned to a future agent (Kimi 2.5 Deep Research Mode preferred). The task context file is:

`docs/superpowers/visual-design-book/VISUAL_DESIGN_REQUEST_CONTEXT.md`

**Schema files required (to be created alongside the context file):**
- `VISUAL_DESIGN_BOOK_SCHEMA.md` — structure of the 6 reports
- `RESEARCH_REPORT_SCHEMA.md` — per-report template
- `RESEARCH_CONTEXT_PROMPT_SCHEMA.md` — the context prompt format for the research agent

**Claiming protocol:**
1. Agent must read CODEOWNER_CHECKLIST.md and confirm this task is unclaimed
2. Agent posts a CLAIM comment in the task file
3. CODEOWNER approves the claim via PR review
4. Agent proceeds with the 3-batch deep research process described in the context file

**Output:** 6 research reports + synthesis, feeding into Phase 9 design system work when ready.

---

## 4. Phase 7 — Repository Governance and Hygiene

**DEPENDS_ON:** None (first unlocked phase)
**BLOCKS:** All subsequent phases until gate passed
**CODEOWNER touchpoints:** Job Board deletion PR (CRIT)

### 7.1 — CODEOWNERS File and Risk-Tiered PR System

**Deliverables:**

| File | Purpose |
| ---- | ------- |
| `.github/CODEOWNERS` | Single owner `@notbleaux` on all paths; specific overrides for `data/schemas/`, `services/`, `.agents/` |
| `.github/workflows/pr-classification.yml` | Reads commit risk tag, assigns label, routes to auto-merge or review queue |
| `.github/workflows/auto-merge.yml` | Auto-merges `safe-auto-merge` PRs after all CI checks pass |

**Risk tier definitions:**

| Tier | Tag | Label | Behaviour |
| ---- | --- | ----- | --------- |
| Safe | `[SAFE]` | `safe-auto-merge` | Auto-merge after CI green |
| Structural | `[STRUCT]` | `structural-review` | Requires CODEOWNER review, no hold |
| Critical | `[CRIT]` | `critical-block` | Requires CODEOWNER review + 24-hour hold |

**Auto-safe types** (tag optional, always treated as SAFE): `docs:`, `test:`, `chore:` (lint/format only).

**Always-CRIT types:** Any commit touching `data/schemas/`, `services/*/models.py`, `.github/`, `infra/`, `package.json` at root, deletions of more than 5 files.

### 7.2 — Job Board Complete Removal

**This is a permanent deletion. Files are NOT archived. No copy is kept anywhere.**

**Useful patterns noted from the Job Board (preserved as concepts only, not files):**

| Pattern | Implementation in new framework |
| ------- | ------------------------------- |
| INBOX → CLAIMED → COMPLETED queue | CODEOWNER_CHECKLIST.md task states |
| Priority tiers HIGH/MEDIUM/LOW | PR labels + PHASE_GATES.md priority field |
| Wave-based deployment | Phase gates numbered sequentially |
| Team Lead / Foreman / Scout hierarchy | Agent spawning sequence (§15) |
| Lock files for concurrent access | Git branch per agent, no shared branches |
| Session documentation | `.agents/spawn-logs/YYYY-MM-DD/` |
| Verification manifests | PHASE_GATES.md verification commands |
| SPAWN_LOGS | `.agents/spawn-logs/` (new location) |

**Deletion procedure:**
1. Single `[CRIT]` PR: `delete(archive): remove job board — 329 files [CRIT]`
2. PR description body lists all 329 files as the permanent audit trail
3. 24-hour hold after CODEOWNER approval before merge
4. Second `[STRUCT]` PR immediately after: scrub all 5 reference files

**Files requiring reference scrub after deletion:**
- `CLAUDE.md` — remove Job Board section from Agent Coordination
- `AGENTS.md` — remove `.job-board/` from directory structure diagram
- `README.md` — remove archive/.job-board/ from tree
- `docs/UNIFIED_MASTER_PLAN.md` — remove all job board references
- `docs/IMPLEMENTATION_READINESS_CHECKLIST.md` — remove all job board references

**Workflow review during Phase 7:**
- `twice-daily-kimi-check.yml` — legacy job-board-era workflow; assess if still needed, update trigger or disable
- `agent-health-check.yml` — review against new agent spawning protocol; update to check `.agents/spawn-logs/` instead of job board paths

### 7.3 — Archive Consolidation

**Objective:** Reorganise `archive/` into a date-indexed holding structure pending migration to a separate archive repository (`notbleaux/eSports-EXE-archives`, to be created).

**Date determination method:**
```bash
git log --diff-filter=A --name-only --format="%ai %H" -- archive/ | head -500
```
Cross-reference file content for docs predating tracked commits. Files with no determinable date → `Archived/Y25/M00-UNDATED/`.

**Target folder structure (in current repo, transitional):**
```
Archived/
├── Y25/
│   ├── M01/ through M12/
│   └── M00-UNDATED/
└── Y26/
    ├── M01/ through M12/
    └── M00-UNDATED/
```

**Migration to archive repo (Phase 7 planning deliverable):**
- Create `notbleaux/eSports-EXE-archives` as an empty GitHub repository
- Plan: `git subtree push` of `Archived/` subtree once local reorganisation is verified
- The `Archived/` folder is REMOVED from the current repo after successful migration
- Only the `ARCHIVE_MASTER_DOSSIER.md` remains in the current repo

### 7.4 — Archive Master Dossier Report

**File:** `ARCHIVE_MASTER_DOSSIER.md` at repo root
**Tier:** T0 — always loaded by all agents
**Version:** Created at Phase 7, updated monthly via the 360-cycle protocol

**Document structure:**

```markdown
# Archive Master Dossier — NJZ eSports Platform
## Summary
- Total archived files: [N]
- Date range covered: [earliest] – [latest]
- Migration status: [Pending / Partially migrated / Complete]

## Topic Map
[Key topics with file counts per topic]

## Index Table
| Filename | Date | Topic | One-Line Summary |
|----------|------|-------|-----------------|
[One row per archived file]

## Cross-Reference Map
[Which archived docs answer which active platform questions]

## Historical Artefacts and Case Examples
[Inline summaries of files worth preserving as reference — no separate files]

## FAQ
[10 questions the archived docs collectively answer, with answers drawn from the index]
```

### 7.5 — Agent Coordination Updates

**Deliverables:**

| File | Change |
| ---- | ------ |
| `.agents/CODEOWNER_CHECKLIST.md` | New T0 file — all CODEOWNER_APPROVAL_REQUIRED touchpoints, chronological |
| `.agents/COORDINATION_PROTOCOL.md` | Add time-quarter cadence system, spawning sequence protocol, archive cycle schedule |
| `.agents/ARCHIVE_INDEX_SCHEDULE.md` | New file — 360-update rolling schedule for archive index updates |
| `.agents/AGENT_CONTRACT.md` | Add prohibition: agents must not begin CODEOWNER_APPROVAL_REQUIRED tasks without confirmed CLAIMED entry |
| `.doc-tiers.json` | Add `ARCHIVE_MASTER_DOSSIER.md` and `.agents/CODEOWNER_CHECKLIST.md` to T0 |
| `PHASE_GATES.md` | Add ASCII DAG header, DEPENDS_ON fields for Phases 7–13, CODEOWNER_APPROVAL_REQUIRED flags |

### Phase 7 Gate

| Gate | Criteria | Verification |
| ---- | -------- | ------------ |
| 7.1 | `.github/CODEOWNERS` active, risk-tier workflow passes on test PR | Create test `[SAFE]` PR, verify auto-merge |
| 7.2 | Job Board fully deleted, all 5 reference files scrubbed | `grep -r "job-board" . --include="*.md"` returns 0 |
| 7.3 | `Archived/` date structure created, all archive/ files assigned | `ls Archived/Y25/ Archived/Y26/` shows populated subdirs |
| 7.4 | `ARCHIVE_MASTER_DOSSIER.md` exists at repo root with complete index table | Manual review |
| 7.5 | `CODEOWNER_CHECKLIST.md` exists, AGENT_CONTRACT.md updated | `test -f .agents/CODEOWNER_CHECKLIST.md` |
| 7.6 | PHASE_GATES.md has DAG header and DEPENDS_ON fields for phases 7–13 | Manual review |

---

## 5. Phase 8 — API Gateway and Auth Platform

**DEPENDS_ON:** Phase 7 gate passed
**BLOCKS:** Phases 10, 11, 12
**CODEOWNER touchpoints:** Auth0 provider configuration (requires user's Auth0 account credentials and tenant setup)

### 8.1 — API Gateway Full Implementation

`services/api-gateway/` upgraded from placeholder to production-ready FastAPI gateway.

**Responsibilities:**
- Unified entry point for all `services/` (tenet-verification, websocket, legacy-compiler, betting, future services)
- Request routing with service registry
- Request/response logging (structured JSON, queryable)
- Circuit breaker pattern per downstream service
- Rate limiting: tiered by endpoint class (public / authenticated / admin)
- Health aggregation endpoint: `GET /health` polls all downstream services

**Tech:** FastAPI + httpx (async proxy) + slowapi (rate limiting) + structlog (audit logging)

### 8.2 — Auth0 Integration

Auth0 is already referenced in `packages/shared/api/src/auth/` and `apps/web/src/lib/auth.ts`. Phase 8 wires it end-to-end.

**Deliverables:**
- Auth0 tenant configuration guide (`.agents/AUTH0_SETUP.md`) — CODEOWNER must complete before agents can proceed
- JWT validation middleware shared across all services via `packages/shared/api/src/middleware/auth.py`
- Frontend auth context wired to Auth0 provider (replacing stub in `apps/web/src/lib/auth.ts`)
- Admin role check (`https://njz.gg/roles` claim) validated server-side, not just client-side
- Refresh token rotation configured

### 8.3 — Service Hardening

- Circuit breakers: each service gets a `services/<name>/circuit_breaker.py` module
- Rate limiting tiers: `PUBLIC: 60/min`, `AUTHENTICATED: 300/min`, `ADMIN: unlimited`
- Structured audit log: all auth events, schema changes, admin actions written to `logs/audit.jsonl`

### Phase 8 Gate

| Gate | Criteria | Verification |
| ---- | -------- | ------------ |
| 8.1 | Gateway routes to all services, health endpoint aggregates all | `curl localhost:9000/health` returns all service statuses |
| 8.2 | JWT auth middleware rejects unauthenticated requests to protected routes | `pytest services/api-gateway/tests/test_auth.py` |
| 8.3 | Rate limiting enforced, circuit breaker trips on service outage | Load test + manual service kill test |

---

## 6. Phase 9 — Web App UI/UX Enhancement

**DEPENDS_ON:** None (concurrent with Phase 8)
**Note:** Phase 0-X design book research feeds into this phase when available. If not yet complete, Phase 9 proceeds with the existing design system.

### 9.1 — Design Token System

- CSS custom properties strategy: all colours, spacing, typography as tokens in `apps/web/src/styles/tokens.css`
- Tailwind theme extension: tokens mapped to Tailwind config
- Dark mode: confirmed single dark theme, no toggle required
- Game-specific accent palettes: Valorant `#ff4655`, CS2 `#f0a500` already exist in `WorldPortCard.tsx` — formalised into the token system

### 9.2 — Component Documentation

- All shared `@njz/ui` components documented with usage examples
- All 4 hub components (SATOR, AREPO, OPERA, ROTAS) have visual consistency audit
- `packages/@njz/ui/` README updated with component catalogue

### 9.3 — Accessibility and Performance

- WCAG 2.1 AA audit across all routes: colour contrast, keyboard navigation, focus management
- Core Web Vitals gate: LCP < 2.5s, CLS < 0.1, INP < 200ms on all routes
- Bundle analysis: `pnpm build:analyze` run, any chunk > 500KB flagged for splitting
- Service Worker (`apps/web/src/sw.ts`) reviewed and updated for cache strategy alignment with CACHE_CONFIGS tiers

### Phase 9 Gate

| Gate | Criteria | Verification |
| ---- | -------- | ------------ |
| 9.1 | All tokens defined, Tailwind config updated | `pnpm typecheck` passes, visual regression tests pass |
| 9.2 | All @njz/ui components have documented usage | Manual review of packages/@njz/ui/README.md |
| 9.3 | Lighthouse ≥ 90 on all routes, WCAG AA | `npx playwright test --project=accessibility` + Lighthouse CI |

---

## 7. Phase 10 — Companion App MVP

**DEPENDS_ON:** Phase 8 gate passed
**CODEOWNER touchpoints:** None (standard structural work)

### MVP Scope Floor

The minimum viable gate for Phase 10 is: the companion app builds, authenticates, and displays live match scores. Native features (camera, contacts, deep links) are deferred to post-launch.

### 10.1 — Expo SDK Setup

- Upgrade `apps/companion/` from Vite stub to proper Expo SDK project
- EAS Build configuration for iOS simulator + Android emulator builds
- `app.json` / `app.config.ts` with NJZ branding

### 10.2 — Core Features

- Auth: Auth0 via `expo-auth-session` (Phase 8 dependency)
- Live scores: `@njz/websocket-client` connected to `services/websocket/`
- Match list screen: live + upcoming matches filtered by game
- Player profile screen: basic stats from Phase 4 legacy-compiler endpoints
- Navigation: React Navigation v6, bottom tab navigator (Scores | Profile)

### 10.3 — Push Notifications

- Expo Notifications configured
- Match start / score change notifications (server-side trigger from websocket service)
- Notification permissions request flow

### Phase 10 Gate

| Gate | Criteria | Verification |
| ---- | -------- | ------------ |
| 10.1 | App builds on iOS simulator and Android emulator | `eas build --platform all --local` passes |
| 10.2 | Auth login, live scores display, profile page render | Manual smoke test on both simulators |
| 10.3 | Push notification received on device | `eas notifications:test` |

---

## 8. Phase 11 — Browser Extension and LiveStream Overlay

**DEPENDS_ON:** Phase 8 gate passed
**Note:** Extension and Overlay share `@njz/websocket-client` and the Phase 8 auth token pattern — bundled in one phase for this reason.

### 11.1 — Browser Extension (Full)

Upgrade `apps/browser-extension/` from stub to installable extension.

**Manifest V3 compliance:**
- Permissions: `storage`, `alarms`, `notifications`
- No `background.js` page (replaced by service worker per MV3)
- Content Security Policy declared in manifest

**Features:**
- Popup: live match scores, current round, team names
- WebSocket connection via `@njz/websocket-client` (persistent via service worker keep-alive)
- Auth: stored token from popup login (Auth0 implicit flow)
- Badge counter: number of live matches currently running

### 11.2 — LiveStream Overlay (Full)

Upgrade `apps/overlay/` from stub to production OBS browser source.

**OBS Browser Source requirements:**
- Transparent background (`body { background: transparent; }`)
- No scrollbars, no title bar chrome
- Target resolution: 1920×1080 with configurable overlay zones

**Features:**
- Score HUD: team names, map score, current round number
- Round timer (if data available from websocket)
- Confidence indicator (TeneT confidence score displayed as data quality badge)
- Framer Motion entrance/exit animations for score changes
- Configuration URL parameters: `?matchId=&position=topleft|topright|bottomleft|bottomright`

### Phase 11 Gate

| Gate | Criteria | Verification |
| ---- | -------- | ------------ |
| 11.1 | Extension installs in Chrome, popup shows live scores | Manual install + WebSocket connection test |
| 11.2 | Overlay renders correctly in OBS browser source at 1080p | Manual OBS test + visual regression screenshot |

---

## 9. Phase 12 — Content and Prediction Platform

**DEPENDS_ON:** Phase 8 gate passed
**CODEOWNER touchpoints:** Betting UI (gambling-adjacent feature — explicit opt-in required before agents begin 12.3)

### 12.1 — Wiki Editorial Pipeline

Upgrade `apps/wiki/` from stub to content-browsable wiki.

**MDX-based content pipeline:**
- `apps/wiki/content/valorant/` and `apps/wiki/content/cs2/` — 5 seed articles per game at launch
- Article schema: frontmatter (title, category, game, lastUpdated, author) + MDX body
- Search: Next.js App Router + `flexsearch` client-side index
- Categories: Agents/Players/Maps/Strategy/Patch Notes (Valorant), Maps/Weapons/Economy/Strategy (CS2)

### 12.2 — Nexus Portal Full Aggregation

Upgrade `apps/nexus/` from stub to functional portal.

**Features:**
- All World-Port cards with live match count badges (WebSocket data)
- Global search across Wiki articles, player profiles, match history
- TeNET Directory embedded in Nexus as the game selector
- "Now Live" section aggregating all active matches across games

### 12.3 — Betting UI Frontend

**CODEOWNER_APPROVAL_REQUIRED:** Agent must not begin this sub-phase until CODEOWNER approves in CODEOWNER_CHECKLIST.md.

- Match odds display using existing `packages/shared/api/src/betting/routes.py`
- Leaderboard page (read-only, no wagering mechanics in MVP)
- Token balance display (future — Phase 13+)

### 12.4 — Fantasy Scoring Frontend

- Draft UI: player selection for fantasy roster
- Scoring display: points from `packages/shared/api/src/fantasy/` routes
- Leaderboard

### Phase 12 Gate

| Gate | Criteria | Verification |
| ---- | -------- | ------------ |
| 12.1 | Wiki builds, 10 seed articles browsable, search returns results | `pnpm --filter @njz/wiki build` + manual test |
| 12.2 | Nexus portal shows all World-Ports with live badges | `pnpm --filter @njz/nexus build` + manual test |
| 12.3 | Betting odds display renders (CODEOWNER approved) | Manual review behind auth |
| 12.4 | Fantasy draft UI renders with player list | Manual review behind auth |

---

## 10. Phase 13 — Simulation Engine and Production Launch

**DEPENDS_ON:** Phase 10 + Phase 11 + Phase 12 all gate-passed
**CODEOWNER touchpoints:** Production deployment (irreversible — final approval required)

### 13.1 — Security Audit and Hardening

First action: re-enable `.github/workflows/security.yml.disabled` → `security.yml`.

- OWASP Top 10 checklist run against all API endpoints
- Dependency vulnerability scan: `pnpm audit` + `safety check` (Python)
- Secrets scanning: confirm `detect-secrets` pre-commit hook catching all patterns
- Auth0 security review: token expiry, audience validation, PKCE enforcement
- CSP headers on all services
- Rate limiting stress test

### 13.2 — Godot 4 Simulation Revival and XSim

- Reconnect `platform/simulation-game/` to current platform data schemas
- XSim Python engine: match simulation using TensorFlow.js-compatible model
- Integration: simulation results feed into SATOR analytics hub
- Gate: headless Godot test suite passes, simulation produces valid match data

### 13.3 — Production Hardening

- Monitoring: Uptime monitoring on all service health endpoints
- Error tracking: integrate Sentry (free tier) into web app and all services
- CDN: Vercel Edge Network confirmed for static assets
- Database: Supabase connection pooling reviewed for production load
- Redis: Upstash usage reviewed against free tier limits, upgrade plan documented if needed

### 13.4 — Final Repo Split Evaluation

Evaluate the four split trigger conditions from MASTER_PLAN.md §1:
- Team size
- CI build time
- Simulation game independence
- Companion app production readiness

Update `docs/architecture/REPO_STRUCTURE_DECISION.md` with Phase 13 findings.

### 13.5 — Launch Readiness Gate

| Gate | Criteria | Verification |
| ---- | -------- | ------------ |
| 13.1 | Security audit clean, no HIGH/CRITICAL findings | Security report in docs/reports/ |
| 13.2 | Simulation produces valid match data, headless tests pass | `godot --headless --script tests/run_tests.gd` |
| 13.3 | All services responding in production, error tracking active | Live health check across all endpoints |
| 13.4 | REPO_STRUCTURE_DECISION.md updated with Phase 13 findings | `test -f docs/architecture/REPO_STRUCTURE_DECISION.md` |
| 13.5 | All Phase 7–12 gates verified passing in production environment | Full gate re-run against production URLs |

**CODEOWNER_APPROVAL_REQUIRED:** Production deployment proceeds only after CODEOWNER approves Gate 13.5.

---

## 11. CODEOWNER Framework

### .github/CODEOWNERS Structure

```
# NJZ eSports Platform — CODEOWNERS
# Single owner: @notbleaux
# All paths require CODEOWNER review for STRUCT and CRIT changes

*                                   @notbleaux
data/schemas/                       @notbleaux
packages/@njz/types/                @notbleaux
services/                           @notbleaux
.agents/                            @notbleaux
.github/                            @notbleaux
infra/                              @notbleaux
MASTER_PLAN.md                      @notbleaux
CLAUDE.md                           @notbleaux
```

### Branch Protection Rules (main branch)

| Rule | Setting |
| ---- | ------- |
| Require status checks | CI Pipeline, TypeScript Validation |
| Require branches to be up to date | Yes |
| Require CODEOWNER review | Yes (for STRUCT + CRIT labels) |
| Restrict who can push to main | @notbleaux only |
| Allow force push | No |
| Allow deletions | No |

### CODEOWNER_CHECKLIST.md Structure

```markdown
# CODEOWNER Approval Checklist

## Approval Touchpoints (chronological)

| Phase | Task | Status | Approved At |
|-------|------|--------|-------------|
| 7 | Job Board deletion PR | PENDING | — |
| 0-X | Visual Design Book agent claim | PENDING | — |
| 8 | Auth0 provider configuration | PENDING | — |
| 12 | Betting UI feature (12.3) | PENDING | — |
| 13 | Production deployment | PENDING | — |

## How to Approve
1. Review the relevant PR or task file
2. Add your GitHub review approval to the PR, OR
3. Update the Status and Approved At fields above in a [STRUCT] PR
```

---

## 12. PR and Commit Convention System

### Commit Message Format

```
type(scope): description [RISK_TAG]

[optional body]

[optional footer]
[agent: <agent-id>]
```

**Type values:** `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `delete`, `schema`, `style`, `perf`, `ci`

**Risk tag rules:**

| Type | Default Tag | Override allowed |
| ---- | ----------- | ---------------- |
| `docs:` | Always SAFE (tag optional) | No — docs are always safe |
| `test:` | Always SAFE | No |
| `chore:` (lint/format only) | Always SAFE | No |
| `feat:` | STRUCT | Yes → SAFE if no API changes |
| `fix:` | SAFE | Yes → STRUCT if schema touched |
| `refactor:` | STRUCT | Yes → SAFE if pure rename |
| `schema:` | Always CRIT | No |
| `delete:` | Always CRIT | No |
| `ci:` | CRIT | No |

**Agent footer format:**
```
[agent: claude-sonnet-4-6 | session: 2026-03-27-001]
```

### Six PR Templates

Located at `.github/PULL_REQUEST_TEMPLATE/`:

**1. feature.md**
```markdown
## Summary
<!-- What does this add? -->

## Risk Level
- [ ] [SAFE] — No API changes, no schema changes
- [ ] [STRUCT] — New API surface, component changes
- [ ] [CRIT] — Schema changes, dependency additions

## Tests
- [ ] Unit tests added/updated
- [ ] E2E tests added/updated

## CODEOWNER Action
<!-- If STRUCT or CRIT: assign @notbleaux for review -->
```

**2. fix.md** — Same as feature + mandatory: *"Does this fix touch a schema or auth path? If yes, upgrade to STRUCT."*

**3. refactor.md** — Requires: *"Confirm no external API surface changed."* Checklist: imports updated, no new public exports, types unchanged.

**4. schema-change.md** — Mandatory fields:
- `[ ] SCHEMA_REGISTRY.md updated`
- `[ ] Pydantic mirror updated in services/`
- `[ ] @njz/types version bumped`
- `[ ] Downstream consumers identified and updated`

**5. deletion.md** — Mandatory field: *"Audit trail: explain why this cannot be archived."* Lists all files being deleted. Confirms `[CRIT]` tag used.

**6. docs.md** — Lightweight. Only requires: summary + confirmation that no code was changed alongside docs. Always SAFE.

### Three-Pass PR Refinement Protocol

For PRs touching core architecture (MASTER_PLAN.md, PHASE_GATES.md, AGENT_CONTRACT.md, SCHEMA_REGISTRY.md), agents must perform 3 internal review passes before raising the PR:

**Pass 1 — Accuracy:** Does every statement in the changed document accurately reflect the current codebase state?
**Pass 2 — Consistency:** Does the change contradict anything in T0 or T1 documents?
**Pass 3 — Completeness:** Are all cross-referenced documents identified for simultaneous update?

The PR description must include a `## Refinement Passes` section confirming all three passes were completed.

---

## 13. Archive Consolidation Protocol

### Phase 1 — Date Determination (Phase 7 deliverable)

```bash
# For each file in archive/
git log --diff-filter=A --name-only --format="%ai" -- "archive/<file>" | head -1
```

If no result: check file content for date mentions. If still ambiguous: `Archived/Y25/M00-UNDATED/`.

Year determination: files from 2025 → Y25, files from 2026 → Y26.

### Phase 2 — Folder Migration (Phase 7 deliverable)

Move all `archive/` contents into `Archived/Y{YY}/M{MM}/` structure. One `[STRUCT]` PR per year-folder to keep diffs reviewable.

### Phase 3 — Archive Repository Migration (Phase 7 planning, Phase 13 execution)

1. Create `notbleaux/eSports-EXE-archives` on GitHub
2. Initialize with README explaining the repo's purpose
3. `git subtree push --prefix=Archived origin main` from the archive repo after cloning Archived/ contents
4. Delete `Archived/` from current repo in a `[CRIT]` PR after confirming all files exist in archive repo
5. Only `ARCHIVE_MASTER_DOSSIER.md` remains in current repo

### Master Dossier Update Cadence

- Initial version: Phase 7 (covers job board deletion audit + existing archive/docs/)
- Monthly updates: via Archive Index Report Protocol (§14)
- Format: always a `[SAFE]` PR (docs update only)

---

## 14. Monthly Archive Index Report Protocol

### Reporting Cadence (Time-Quarter System — see §16)

- **Trigger:** W+1 compression day each month
- **Output:** One Archive Index Report PR, labelled `[SAFE]`, updating `ARCHIVE_MASTER_DOSSIER.md`
- **360-update cycle:** Approximately one index update per day over the next year, distributed across agents via `ARCHIVE_INDEX_SCHEDULE.md`

### Agent Spawning Sequence (per monthly cycle)

**Step 1 — Async Verifier Agent (pre-spawn)**

Spawn one async verifier before all others. The verifier runs 9 passes, each with two phases:

| Pass | Phase 1 | Phase 2 |
| ---- | ------- | ------- |
| 1–9 | Scout new archive entries, proof-read index additions | Verify and cross-reference prior agent's contributions |

After 9 passes, verifier submits one consolidated report covering: discrepancies found, confirmations, items requiring CODEOWNER attention.

**Step 2 — Sub-Agent Spawn (after verifier report received)**

Spawn simultaneously:
- **1 Foreman Agent** managing 3 sub-agents (parallel date-range sections)
- **5 Standard Agents** (parallel topic-cluster sections)

The Foreman coordinates its 3 sub-agents; all contributions submitted as `[SAFE]` PRs to the primary agent's review queue.

**Step 3 — Final Comprehensive Pass (primary agent)**

After all sub-agent PRs reviewed:

| Phase | Action |
| ----- | ------ |
| Phase 1 | Internal consistency check across all sub-agent contributions |
| Phase 2 | Completeness audit against index table — every migrated file must have an entry |
| Phase 3 | Compression and publish — final `[STRUCT]` PR updating ARCHIVE_MASTER_DOSSIER.md |

The Phase 3 PR requires CODEOWNER review (STRUCT, not CRIT — monthly docs update is structural but not critical).

### First Report (Phase 7 deliverable)

The first Archive Index Report is created during Phase 7, covering:
- All files removed in the Job Board deletion
- All files in `archive/docs/` before reorganisation
- Baseline entry count for the 360-update cycle

It is marked `INCOMPLETE — 359 updates remaining` in its header.

---

## 15. Agent Spawning Sequence

### Hierarchy

```
Primary Agent (CODEOWNER proxy for task coordination)
├── Async Verifier (9-pass review cycle, independent)
│   └── Reports to: Primary Agent
├── Foreman Agent
│   ├── Sub-Agent A (date range batch)
│   ├── Sub-Agent B (date range batch)
│   └── Sub-Agent C (date range batch)
├── Standard Agent 1 (topic cluster)
├── Standard Agent 2 (topic cluster)
├── Standard Agent 3 (topic cluster)
├── Standard Agent 4 (topic cluster)
└── Standard Agent 5 (topic cluster)
```

### Spawn Log Format

File: `.agents/spawn-logs/YYYY-MM-DD/spawn-record.md`

```markdown
# Spawn Record — YYYY-MM-DD

## Session
- Primary Agent: [agent-id]
- Task: [description]
- Spawned At: [timestamp]

## Spawned Agents
| Agent ID | Role | Task Assigned | Status | Completed At |
|----------|------|---------------|--------|-------------|
| [id] | async-verifier | [task] | [status] | [time] |
| [id] | foreman | [task] | [status] | [time] |
...

## Reports Received
[List of report links or summaries]

## Final Pass Status
- Phase 1: [ ]
- Phase 2: [ ]
- Phase 3: [ ]
```

### Agent Contract Additions (Phase 7 deliverable)

Add to `.agents/AGENT_CONTRACT.md`:

```markdown
## CODEOWNER_APPROVAL_REQUIRED Protocol

Agents MUST NOT begin work on any task marked CODEOWNER_APPROVAL_REQUIRED
without a confirmed `CLAIMED: CODEOWNER` entry in CODEOWNER_CHECKLIST.md.

Violation of this rule is grounds for the primary agent to reject all
work product from the violating agent without review.

## Spawn Log Requirement

Any agent that spawns sub-agents MUST create a spawn log entry at
.agents/spawn-logs/YYYY-MM-DD/spawn-record.md before spawning.
```

---

## 16. Time-Quarter Cadence System

### Daily Quarters

| Quarter | Hours (UTC) | Primary Use |
| ------- | ----------- | ----------- |
| Q1 | 06:00–12:00 | Development work, feature PRs |
| Q2 | 12:00–18:00 | Review cycles, STRUCT PRs |
| Q3 | 18:00–00:00 | Testing, validation, docs |
| Q4 | 00:00–06:00 | Automated CI, agent archive work |

### Weekly Periods

| Period | Days | Notes |
| ------ | ---- | ----- |
| W1 | Days 1–7 | Development sprint start |
| W2 | Days 8–14 | Mid-sprint |
| W3 | Days 15–21 | Sprint close, review |
| W4 | Days 22–28 | Integration + QA |
| W5 | Days 29–35 | Buffer / overflow |
| W+1 | Day 36 | Compression day — archive index consolidation only |

### Monthly Quarters

| M-Quarter | Weeks | Focus |
| --------- | ----- | ----- |
| M-Q1 | W1–W2 | Feature development |
| M-Q2 | W3–W4 | Integration and review |
| M-Q3 | W5 | Hardening and documentation |
| M-Q4 | W+1 | Archive compression and index publish |

---

## 17. Visual Design Book Request File

### Files to Create

**Primary context file:**
`docs/superpowers/visual-design-book/VISUAL_DESIGN_REQUEST_CONTEXT.md`
Contains the full deep research directive (copy-paste verbatim, not to be read as implementation instructions by the creating agent — it is a task brief for a future research agent).

**Schema files:**

`docs/superpowers/visual-design-book/VISUAL_DESIGN_BOOK_SCHEMA.md`
```markdown
# Visual Design Book Schema
## Structure
- Report 1: Batch 1 (20 sites) — per-site analysis + frequency table
- Report 2: Batch 2 (20 sites) — per-site analysis + frequency table
- Report 3: Batch 3 (20 sites) — per-site analysis + frequency table
- Report 4: Master Cumulative Table (60-site aggregate)
- Report 5: CSS Methodology Distribution + Premium Component Deep Dives
- Report 6: Design Review Report (trends, innovation index, accessibility)
## Version: 1.0 | Status: Awaiting Agent Assignment
```

`docs/superpowers/visual-design-book/RESEARCH_REPORT_SCHEMA.md`
```markdown
# Per-Site Analysis Schema (per batch report)
Fields: Site Number, Domain, URL, Tech Stack Detection, CSS Architecture
Forensics, Component Inventory, Interesting Code Patterns, Design Blurb
Frequency Table: Component/Pattern | Count/20 | Sites | Variations
```

`docs/superpowers/visual-design-book/RESEARCH_CONTEXT_PROMPT_SCHEMA.md`
```markdown
# Research Context Prompt Schema
## Format for agent activation
- Batch number: [1|2|3]
- URL list: 20 URLs from Category B list
- Output format: Per-site analysis + batch table + CSV export data
- Handoff: CONTINUE or FINALIZE command
```

---

## 18. Document Update Checklist

Documents requiring updates as a result of this design being implemented.

### Phase 7 must update

| File | Change Required | Risk |
| ---- | --------------- | ---- |
| `MASTER_PLAN.md` | Add Phases 7–13 sections, update Phase table | STRUCT |
| `.agents/PHASE_GATES.md` | Add DAG header, Phases 7–13 gates, DEPENDS_ON fields | STRUCT |
| `CLAUDE.md` | Remove Job Board reference, add CODEOWNER_CHECKLIST.md to agent reading list | STRUCT |
| `AGENTS.md` | Remove .job-board/ from directory tree, add new .agents/ subdirs | STRUCT |
| `README.md` | Remove archive/.job-board/ from tree, update architecture section | SAFE |
| `.doc-tiers.json` | Add ARCHIVE_MASTER_DOSSIER.md and CODEOWNER_CHECKLIST.md to T0 | STRUCT |
| `.agents/AGENT_CONTRACT.md` | Add CODEOWNER_APPROVAL_REQUIRED protocol, spawn log requirement | STRUCT |
| `.agents/SCHEMA_REGISTRY.md` | No changes required — schemas unchanged | — |
| `docs/UNIFIED_MASTER_PLAN.md` | Scrub job board references | STRUCT |
| `docs/IMPLEMENTATION_READINESS_CHECKLIST.md` | Scrub job board references | STRUCT |
| `docs/architecture/REPO_STRUCTURE_DECISION.md` | Already updated to v001.001 in Phase 6 | — |

### Phase 7 must create

| File | Purpose |
| ---- | ------- |
| `.github/CODEOWNERS` | Single-owner governance |
| `.github/workflows/pr-classification.yml` | Risk-tier auto-merge |
| `.github/workflows/auto-merge.yml` | Auto-merge safe PRs |
| `.github/PULL_REQUEST_TEMPLATE/feature.md` | PR template |
| `.github/PULL_REQUEST_TEMPLATE/fix.md` | PR template |
| `.github/PULL_REQUEST_TEMPLATE/refactor.md` | PR template |
| `.github/PULL_REQUEST_TEMPLATE/schema-change.md` | PR template |
| `.github/PULL_REQUEST_TEMPLATE/deletion.md` | PR template |
| `.github/PULL_REQUEST_TEMPLATE/docs.md` | PR template |
| `ARCHIVE_MASTER_DOSSIER.md` | T0 — archive index |
| `.agents/CODEOWNER_CHECKLIST.md` | T0 — approval touchpoints |
| `.agents/ARCHIVE_INDEX_SCHEDULE.md` | 360-update cycle tracker |
| `docs/superpowers/visual-design-book/VISUAL_DESIGN_REQUEST_CONTEXT.md` | Deep research directive |
| `docs/superpowers/visual-design-book/VISUAL_DESIGN_BOOK_SCHEMA.md` | Report structure schema |
| `docs/superpowers/visual-design-book/RESEARCH_REPORT_SCHEMA.md` | Per-site analysis schema |
| `docs/superpowers/visual-design-book/RESEARCH_CONTEXT_PROMPT_SCHEMA.md` | Agent prompt schema |

---

*This document is the authoritative design spec for Master Plan extension. All agents working on Phases 7–13 must read this document and AGENT_CONTRACT.md before beginning any task.*
