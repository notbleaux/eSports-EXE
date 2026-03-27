[Ver001.002]

# NJZ eSports Platform — Master Restructuring & Ecosystem Plan

**Project:** NJZ eSports (NJZiteGeisTe Platform)
**Status:** ACTIVE — Authoritative Document. This is the single source of truth.
**Created:** 2026-03-27 | **Last updated:** 2026-03-27
**Supersedes:** `docs/ARCHITECTURAL_REMODELING_MASTER_PLAN.md`, `docs/COMPREHENSIVE_PLATFORM_MASTER_PLAN.md`, all scattered `PHASE_*.md` files at root

---

## ⚡ Quick Navigation — Read This First

### Current Phase Status

| Phase | Name | Status |
|-------|------|--------|
| Phases 0–6 | Foundations, Schema, Services, Frontend, Data, Ecosystem, LIVEOps | ✅ COMPLETE |
| Phase 7 | Repository Governance and Hygiene | ✅ COMPLETE (2026-03-27) |
| Phase 7-S | Supplemental: Session + Operational Frameworks | ✅ COMPLETE (2026-03-27) |
| Phase 8 | API Gateway and Auth Platform | 🔒 BLOCKED — USER_INPUT_REQUIRED (Auth0) |
| Phase 9 | Web App UI/UX Enhancement | 🟡 UNLOCKED (concurrent with Phase 8) |
| Phase 10 | Companion App MVP | 🔒 BLOCKED on Phase 8 |
| Phase 11 | Browser Extension and LiveStream Overlay | 🔒 BLOCKED on Phase 8 |
| Phase 12 | Content and Prediction Platform | 🔒 BLOCKED on Phase 8 |
| Phase 13 | Simulation Engine and Production Launch | 🔒 BLOCKED on Phases 10 + 11 + 12 |

**→ Full gate status:** `.agents/PHASE_GATES.md`
**→ Active CODEOWNER approvals required:** `.agents/CODEOWNER_CHECKLIST.md`
**→ Previous session handoff:** `.agents/session/CONTEXT_FORWARD.md`

---

## 🤖 Agent Reading Protocol

**Before starting any work, agents MUST:**

1. Read `.agents/session/CONTEXT_FORWARD.md` (if it exists) — check for in-progress work, open questions, and DO NOT REDO list
2. Check `.agents/CODEOWNER_CHECKLIST.md` for any `USER_INPUT_REQUIRED` items that are `UNCLAIMED` or `PENDING` — if any exist for the current phase, **STOP and report to user** before proceeding
3. Read `.agents/PHASE_GATES.md` to confirm the current phase is unlocked
4. Read `.agents/AGENT_CONTRACT.md` for behavioral rules

**If a USER_INPUT_REQUIRED marker appears in this document:** Stop at that point, surface the requirement to the user, and wait for confirmation before continuing work on the dependent phase.

**Drift check:** Before starting any new gate task, re-read the relevant phase section of this document. If what you are about to do is NOT described in this document, stop and confirm with the user.

---

## Table of Contents

**Structural Sections**
1. [Repository Decision](#1-repository-decision)
2. [Architecture Correction — TENET Layer](#2-architecture-correction--tenet-layer)
3. [Current State Assessment](#3-current-state-assessment)
4. [Restructuring Phases](#4-restructuring-phases)
5. [Full Ecosystem Map](#5-full-ecosystem-map)
6. [Data Architecture — Live vs Legacy](#6-data-architecture--live-vs-legacy)
7. [Technology Stack Decisions](#7-technology-stack-decisions)
8. [Sub-Agent Orchestration Model](#8-sub-agent-orchestration-model)
9. [Phase Gates (Go/No-Go Criteria)](#9-phase-gates-gono-go-criteria)
10. [File Management Mandates](#10-file-management-mandates)
11. [Agent Operational Protocol](#11-agent-operational-protocol)
12. [Session Work Plan Protocol](#12-session-work-plan-protocol)
13. [Monthly Cleanup Protocol](#13-monthly-cleanup-protocol)

**Development Phases**
- [§Phase 7 — Repository Governance and Hygiene](#phase-7--repository-governance-and-hygiene)
- [§Phase 7-S — Supplemental Governance Deliverables](#phase-7-s--supplemental-governance-deliverables)
- [§Phase 8 — API Gateway and Auth Platform](#phase-8--api-gateway-and-auth-platform)
- [§Phase 9 — Web App UI/UX Enhancement](#phase-9--web-app-uiux-enhancement)
- [§Phase 10 — Companion App MVP](#phase-10--companion-app-mvp)
- [§Phase 11 — Browser Extension and LiveStream Overlay](#phase-11--browser-extension-and-livestream-overlay)
- [§Phase 12 — Content and Prediction Platform](#phase-12--content-and-prediction-platform)
- [§Phase 13 — Simulation Engine and Production Launch](#phase-13--simulation-engine-and-production-launch)

---

## 1. Repository Decision

### Verdict: Restructure Current Repo — Do Not Split Yet

**Rationale:**
- Phases 1–10 of existing work represent validated, deployable frontend and API foundations. This work is correct for the SATOR/AREPO/OPERA/ROTAS 4-hub model.
- Splitting now would require re-establishing CI/CD, Vercel, Render, Supabase, and environment configs with no functional gain.
- The current `eSports-EXE` monorepo structure (pnpm workspaces + Turbo) is architecturally compatible with the full NJZ ecosystem.
- The primary required correction is **conceptual** (TENET misclassification) and **structural** (adding missing service layers and ecosystem stubs).

**Split Trigger Conditions** (evaluate at Month 4+):
- Team exceeds 8 active developers
- CI build times exceed 25 minutes
- The Offline Game (Godot) requires independent versioning and release cycles
- The Companion Mobile App reaches production-ready status

**Renamed identity:** The repo continues as `eSports-EXE` internally. The platform brand is **NJZ eSports**. The web app is **NJZiteGeisTe Platform**.

---

## 2. Architecture Correction — TENET Layer

### Critical Correction: TENET Is Not a Hub

The previous codebase incorrectly classified TENET as a 5th UI hub (`hub-5-tenet`). This is wrong. The correct hierarchy:

```
TeNeT  (User-facing Home Portal — the Entry Page)
  ↓
TeNET  (Network Directory — routes users to World-Ports by game)
  ↓
World-Ports  (Game-specific entry points: /valorant, /cs2, /lol, etc.)
  ↓
GameNodeID  (Base unit — carries a standardized 2×2 Quarter GRID)
  ↓
  ┌─────────────────────────────────────────┐
  │       Standardized Quarter GRID         │
  │  ┌──────────┬──────────┐                │
  │  │  SATOR   │  AREPO   │  Analytics /  │
  │  │(Analytics)│(Community)│  Community /  │
  │  ├──────────┼──────────┤  Pro-Scene /  │
  │  │  OPERA   │  ROTAS   │  Simulation   │
  │  │(Pro Scene)│(Sim/Stats)│               │
  │  └──────────┴──────────┘                │
  └─────────────────────────────────────────┘
  ↓
TeZeT  (World-Tree within each Quarter — HUB-specific composition)
  ↓
tenet  (lowercase — Network Channels / Data Directory — maps the base)
  ↓
TeneT Key.Links  (Verification Bridge — the data brokerage and regulation layer)
```

### What TeneT Key.Links Does

TeneT Key.Links is a **data pipeline verification bridge** that:
- **Parses** unstructured data (video, scraped HTML, API responses)
- **Proof-reads** against known schemas and historical baselines
- **Verifies** via cross-reference: API data vs video analysis vs manual review vs scraped sources
- **Refines** granularity to meet Tier requirements
- **Tiers** output to two distribution paths:

```
Path A — Live/Real-time  (WebSocket, low-latency, simple)
  → MatchLIVE Score Updates
  → Round Updates
  → Companion App feed
  → Browser Extension quick-view

Path B — Static Truth Legacy  (High-granularity, authoritative, async)
  → Offline Analytics Pipeline
  → Historical Statistics (ultimate truth)
  → XSimulation training data
  → Comprehensive per-round granularity
```

### Frontend Implication

`hub-5-tenet/` in the web app is **not** a data hub. It is the **TeNET navigation layer** — the landing page and routing infrastructure that directs users to World-Ports. It should contain:
- The TeNeT Home Portal (landing, entry)
- The TeNET Network Directory (game-world selector)
- World-Port routing components
- GameNodeID display framework (the 2×2 Quarter GRID renderer)
- TeZeT branch selectors within each hub

The 4 actual content hubs remain: SATOR, AREPO, OPERA, ROTAS.

---

## 3. Current State Assessment

### What Exists and Is Valid
| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| SATOR hub (Analytics) | `apps/web/src/hub-1-sator/` | ✅ Active v2.1 | SimRating v2, player metrics |
| ROTAS hub (Stats) | `apps/web/src/hub-2-rotas/` | ✅ Active | Leaderboard, raw stats |
| AREPO hub (Community) | `apps/web/src/hub-3-arepo/` | ✅ Active | Forums, follows, feed |
| OPERA hub (Pro Scene) | `apps/web/src/hub-4-opera/` | ✅ Active | Brackets, calendar |
| FastAPI backend | `packages/shared/api/` | ✅ Active | 15+ routers |
| Data pipeline | `packages/shared/axiom-esports-data/` | ✅ Active | Pandascore sync |
| PostgreSQL migrations | `packages/shared/api/` | ✅ 005 applied | Auth, forum, simrating |
| Godot simulation | `platform/simulation-game/` | 🟡 Paused | Awaiting revival |
| VCT data app | `apps/VCT Valorant eSports/` | ✅ Active | Python/FastAPI |

### What Is Misclassified and Needs Correction
| Component | Current State | Required Change |
|-----------|--------------|-----------------|
| `hub-5-tenet/` | Classified as 5th content hub | Refactor to TeNET navigation/routing layer |
| `services/exe-directory/` | Placeholder | Build as TeNET Network Directory service |
| `services/api/` | Duplicate of `packages/shared/api/` | Promote to canonical NJZ API gateway |
| Root `.md` files (30+) | Cluttering root directory | Move to `docs/archive/` or `docs/reports/` |

### What Is Missing and Needs Creation
| Missing Component | Target Location | Priority |
|------------------|-----------------|----------|
| TeneT Key.Links service | `services/tenet-verification/` | Critical |
| WebSocket service (dedicated) | `services/websocket/` | High |
| Legacy data compiler | `services/legacy-compiler/` | High |
| GameNodeID type specs | `data/schemas/` | Critical |
| TENET protocol definitions | `data/schemas/` | Critical |
| Companion App stub | `apps/companion/` | Medium |
| Browser Extension stub | `apps/browser-extension/` | Medium |
| LiveStream Overlay stub | `apps/overlay/` | Medium |
| `@njz/types` shared package | `packages/@njz/types/` | Critical |
| `@njz/tenet-protocol` package | `packages/@njz/tenet-protocol/` | High |
| `@njz/websocket-client` package | `packages/@njz/websocket-client/` | High |

---

## 4. Restructuring Phases

### Phase 0 — Immediate Housekeeping (Before Any New Work)

**Owner:** Structural agent
**Duration:** 1 session
**Blocks all other phases until complete**

Tasks:
- [ ] Move all root-level `PHASE_*.md`, `CRIT_*.md`, `REVIEW_*.md`, `IMPLEMENTATION_SUMMARY_*.md` files to `docs/archive/`
- [ ] Archive `docs/ARCHITECTURAL_REMODELING_MASTER_PLAN.md` → `docs/archive/`
- [ ] Archive `docs/COMPREHENSIVE_PLATFORM_MASTER_PLAN.md` → `docs/archive/`
- [ ] Create `docs/architecture/TENET_TOPOLOGY.md` (authoritative TENET docs)
- [ ] Create `data/schemas/GameNodeID.ts` and `data/schemas/tenet-protocol.ts`
- [ ] Deploy `.agents/` coordination system (contracts, schema registry, phase gates)
- [ ] Update `AGENTS.md` and `CLAUDE.md` with correct TENET description
- [ ] Verify `hub-5-tenet/` is clearly documented as navigation layer, not content hub

**Gate:** Root directory has ≤15 files. TENET architecture documented correctly. Agent contracts in place.

---

### Phase 1 — Schema Foundation (Week 1–2)

**Owner:** Schema agent + Backend agent
**Depends on:** Phase 0 complete

Tasks:
- [ ] `data/schemas/GameNodeID.ts` — canonical TypeScript types for all GameNodeID variants
- [ ] `data/schemas/tenet-protocol.ts` — TENET hierarchy protocol definitions
- [ ] `data/schemas/world-ports.ts` — World-Port game schema polymorphic types
- [ ] `data/schemas/live-data.ts` — Live/WebSocket data contract schemas
- [ ] `data/schemas/legacy-data.ts` — Static Truth Legacy data schemas
- [ ] `packages/@njz/types/` — Shared TypeScript package exporting all schemas
- [ ] Python Pydantic equivalents in `packages/shared/api/schemas/tenet.py`
- [ ] Update `packages/shared/packages/stats-schema/` to reference `@njz/types`

**Gate:** All 4 hub components import from `@njz/types`. TypeScript strict mode passes. No duplicate type definitions across frontend and backend.

---

### Phase 2 — Service Architecture Scaffolding ✅ COMPLETE (2026-03-27)

**Owner:** Backend agent
**Depends on:** Phase 1 complete

Tasks:
- [ ] `services/tenet-verification/` — TeneT Key.Links verification service (Python FastAPI, async)
  - Multi-source data collection (API, video metadata, scraped, manual)
  - Trust level weighting per source
  - Consensus algorithm with confidence scoring
  - Flag-for-review pipeline for low-confidence matches
  - Storage router: high confidence → truth layer, low → review queue
- [ ] `services/websocket/` — Dedicated real-time WebSocket service
  - Extract from `packages/shared/api/ws_matches.py`
  - Event types: `MATCH_LIVE`, `ROUND_UPDATE`, `SCORE_UPDATE`, `MATCH_END`
  - Path A distribution endpoint
- [ ] `services/legacy-compiler/` — Static Truth Legacy data pipeline stub
  - Scrapers: VLR.gg, Liquidpedia (rate-limited, robots.txt compliant)
  - Video metadata extractor
  - Manual review queue
  - Path B distribution endpoint
- [ ] `services/api-gateway/` — Consolidate `services/api/` as canonical NJZ API gateway

**Gate:** Each service has a `README.md`, `Dockerfile`, health check endpoint. Integration tests verify cross-service contracts match Phase 1 schemas.

---

### Phase 3 — Frontend Architecture Correction ✅ COMPLETE (2026-03-27)

**Owner:** Frontend agent
**Depends on:** Phase 1 complete (Phase 2 in parallel)

Tasks:
- [ ] Refactor `apps/web/src/hub-5-tenet/` to TeNET navigation layer:
  - `TeNeTPortal.tsx` — Entry page (replaces generic landing)
  - `TeNETDirectory.tsx` — Network directory, game-world selector
  - `WorldPortRouter.tsx` — Routes to `/valorant`, `/cs2`, etc.
  - `GameNodeIDFrame.tsx` — Renders the 2×2 Quarter GRID for any GameNodeID
  - `TeZeTBranch.tsx` — World-Tree selector within each Quarter
- [ ] Update routing in `App.tsx`:
  - `/` → TeNeTPortal (entry)
  - `/hubs` → TeNETDirectory (game-world selector)
  - `/valorant` → Valorant World-Port (existing GameWorldPage, now confirmed)
  - `/cs2` → CS2 World-Port
  - `/valorant/:nodeId/analytics` → SATOR hub within Valorant GameNodeID
  - `/valorant/:nodeId/community` → AREPO hub within Valorant GameNodeID
  - `/valorant/:nodeId/pro-scene` → OPERA hub within Valorant GameNodeID
  - `/valorant/:nodeId/stats` → ROTAS hub within Valorant GameNodeID
- [ ] Create `packages/@njz/ui/` — Shared React component library:
  - `QuarterGrid` component (2×2 SATOR/AREPO/OPERA/ROTAS)
  - `WorldPortCard` component
  - `GameNodeBadge` component
- [ ] Remove any remaining "TENET hub" references from nav, breadcrumbs, route labels

**Gate:** `/hubs` route renders TeNET directory. Clicking a game routes to World-Port. Each hub URL includes game context. TypeScript strict passes. E2E navigation tests pass.

---

### Phase 4 — Data Pipeline: Lambda Architecture (COMPLETE)

**Owner:** Data pipeline agent + Backend agent
**Status:** ✅ REFINED & STANDARDIZED (2026-03-27)

- Speed Layer (Path A — Live):
  - Redis Streams implementation in `services/websocket/`
  - Standardized camelCase payloads in `webhooks.py`
  - WebSocket distribution for live match events
- Batch Layer (Path B — Legacy):
  - `services/tenet-verification/` with enhanced weighted consensus algorithm
  - `services/legacy-compiler/` for multi-source (VLR, Video, PandaScore) aggregation
  - TeneT Key.Links data verification bridge fully scaffolded
- Data Standardization:
  - All services use `TenetBaseModel` with camelCase aliases
  - Consistent naming across Path A and Path B models in `tenet.py`

### Phase 5 — Ecosystem Expansion ✅ COMPLETE (2026-03-27)

**Owner:** Multiple agents (see Sub-Agent Orchestration)
**Status:** ✅ SCAFFOLDED (2026-03-27)

#### 5A — Companion App
- [x] `apps/companion/` boilerplate with `package.json`

#### 5B — Browser Extension
- [x] `apps/browser-extension/` boilerplate with `package.json`

#### 5C — LiveStream Overlay
- [x] `apps/overlay/` boilerplate with `package.json`

#### 5D — Offline Game Revival
- [x] `platform/simulation-game/` structure verified

### Phase 6 — LIVEOperations Centre & Advanced Features (Month 4+ — 🟡 UNLOCKED)

**Owner:** Full-stack agents
**Status:** ✅ READY (2026-03-27)

- [x] Token-based prediction system: Existing `packages/shared/api/src/betting/` verified
- [x] Media & Wiki: `apps/wiki/` boilerplate created
- [x] Nexus Portal: `apps/nexus/` boilerplate created

**Phase 6 Repository Split Evaluation:**
At Phase 6 entry, evaluate whether monorepo should split into:
- `njz-platform-core` (current repo — API, DB, shared packages, web app)
- `njz-ecosystem-apps` (Companion, Extension, Overlay, Wiki, Nexus)
- `njz-simulation` (Godot game, XSim engine)

---

## 5. Full Ecosystem Map

```
NJZ eSports Platform
│
├── Entry Layer
│   └── TeNeT Portal (apps/web — landing, auth, onboarding)
│
├── Navigation Layer
│   └── TeNET Network Directory (game-world selector, /hubs)
│       ├── World-Port: Valorant (/valorant)
│       ├── World-Port: CS2 (/cs2)
│       └── World-Port: [future games]
│
├── Game Layer (per World-Port)
│   └── GameNodeID Frame (2×2 Quarter GRID)
│       ├── SATOR — Advanced Analytics (TeZeT: /analytics)
│       ├── AREPO — Community (TeZeT: /community)
│       ├── OPERA — Pro eSports (TeZeT: /pro-scene)
│       └── ROTAS — Stats Reference (TeZeT: /stats)
│
├── Data Layer (TeneT Key.Links)
│   ├── Path A: Live WebSocket
│   │   ├── MatchLIVE Score Updates
│   │   ├── Round Updates
│   │   └── Live match feed
│   └── Path B: Static Truth Legacy
│       ├── Historical Statistics (authoritative)
│       ├── XSimulation training data
│       └── Comprehensive per-round granularity
│
├── Client Applications
│   ├── Web App (apps/web) — Primary
│   ├── Companion App (apps/companion) — React Native
│   ├── Browser Extension (apps/browser-extension) — Chrome/Firefox
│   └── LiveStream Overlay (apps/overlay) — OBS Browser Source
│
├── Content Applications
│   ├── Media & Wiki (apps/wiki) — Next.js SSG
│   └── Nexus Portal (apps/nexus) — Aggregated directory
│
└── Backend Services
    ├── API Gateway (services/api-gateway) — FastAPI
    ├── WebSocket Service (services/websocket) — Real-time
    ├── TeneT Verification (services/tenet-verification) — Pipeline broker
    ├── Legacy Compiler (services/legacy-compiler) — VLR.gg, Liquidpedia
    └── Analytics Engine (services/analytics) — SimRating, XSim
```

---

## 6. Data Architecture — Live vs Legacy

### Two-Path Distribution

```
DATA SOURCES
├── Pandascore API (Tier: HIGH trust)
├── Riot Official API (Tier: HIGH trust)
├── Video Recording / Replay (Tier: MEDIUM trust, requires processing)
├── LiveStream Review Grading (Tier: MEDIUM trust)
├── Minimap Analysis (Tier: MEDIUM trust, computer vision)
├── Aggregate Stats from VLR.gg (Tier: LOW trust, scraped)
├── Liquidpedia (Tier: LOW-MEDIUM trust, wiki)
├── Fan Forum Contributions (Tier: LOW trust)
└── Manual Review (Tier: HIGH trust, human-verified)

        ↓

TeneT Key.Links Verification Bridge
├── Source trust weighting
├── Cross-reference consensus algorithm
├── Confidence scoring (0.0 – 1.0)
├── Conflict detection and flagging
└── Tiered output routing

        ↓

┌─────────────────────┐    ┌──────────────────────────────┐
│    PATH A: LIVE      │    │       PATH B: LEGACY         │
│                      │    │                              │
│  Redis Streams       │    │  PostgreSQL (verified truth) │
│  WebSocket Service   │    │  ClickHouse (analytics)      │
│  Low latency         │    │  S3/R2 (raw video/HTML)      │
│  Eventual accuracy   │    │  High granularity            │
│  Simple schemas      │    │  Ultimate authority          │
└─────────────────────┘    └──────────────────────────────┘
```

### Database Strategy

| Store | Purpose | Latency | Data type |
|-------|---------|---------|-----------|
| Redis | Live match state, sessions, cache | <1ms | Ephemeral |
| PostgreSQL (Supabase) | Verified match/player truth | 5–50ms | Authoritative |
| ClickHouse | Columnar analytics, aggregations | 10–100ms | Analytical |
| S3 / Cloudflare R2 | Video, HTML archives | N/A (batch) | Archival |
| TimescaleDB (future) | Round-by-round time-series | 5–20ms | Time-series |

---

## 7. Technology Stack Decisions

### Approved — Core Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Web Frontend | TypeScript + React 18 + Vite | Existing, validated |
| Mobile Companion | React Native + Expo | Code share with web (`@njz/ui`, `@njz/types`) |
| Browser Extension | TypeScript + Vite + WebExtension Polyfill | Manifest V3 compatible |
| API Gateway | Python + FastAPI | Existing, strong async, ML integration |
| WebSocket | Python FastAPI + WebSockets | Existing; evaluate Node.js if throughput demands |
| TeneT Verification | Python (FastAPI + Celery) | Cross-service calls, background task queues |
| Legacy Compiler | Python (Scrapy + BeautifulSoup) | Ecosystem strength for scraping |
| Offline Game | Godot 4 (GDScript + C#) | Existing |
| Database | PostgreSQL 15 (Supabase) | Existing |
| Cache | Redis (Upstash) | Existing |
| Analytics (future) | ClickHouse | Columnar, esports time-series |

### Conditionally Approved (Evaluate at Phase 4)

| Technology | Condition |
|-----------|-----------|
| Rust (TeneT verification) | If Python throughput < 10K verifications/hour |
| Go (WebSocket service) | If Python WebSocket concurrency < 5K connections |
| Julia / R (XSim) | If NumPy/SciPy insufficient for simulation modeling |
| Kafka (event streaming) | If Redis Streams cannot handle peak event volume |
| TimescaleDB | If PostgreSQL JSONB time-series queries exceed 200ms |

---

## 8. Sub-Agent Orchestration Model

### When to Use Sub-Agents

Sub-agents are appropriate when:
1. Two or more **domain-independent** work streams can proceed in parallel
2. A task has more than ~400 lines of output and benefits from isolation
3. A task requires reading 15+ files and risks polluting the main context

### Agent Domain Map

| Domain | Scope | Can modify |
|--------|-------|------------|
| `schema-agent` | `data/schemas/`, `packages/@njz/types/`, Pydantic schemas | Type definitions only |
| `frontend-agent` | `apps/web/src/`, `packages/@njz/ui/` | Components, hooks, routes |
| `backend-agent` | `packages/shared/api/`, `services/` | API routers, models, services |
| `pipeline-agent` | `packages/shared/axiom-esports-data/`, `services/legacy-compiler/` | Data pipeline, scrapers |
| `infra-agent` | `infra/`, `docker-compose*.yml`, `.github/workflows/` | Infrastructure, CI/CD |
| `docs-agent` | `docs/`, `AGENTS.md`, `CLAUDE.md` | Documentation only |
| `test-agent` | `tests/`, `apps/web/src/**/*.spec.*` | Tests only |

**Cross-domain work** (e.g., adding a new API endpoint AND the frontend hook) must either:
- Be done by a single agent sequentially, OR
- Be split at the interface boundary: backend-agent writes the endpoint + types, frontend-agent writes the hook after schema-agent confirms types

### Nested Sub-Agent Pattern

For Phase 5 (Ecosystem Expansion), use a **coordinator + specialist** pattern:

```
Coordinator Agent (reads MASTER_PLAN.md, PHASE_GATES.md)
    ↓ dispatches
    ├── Specialist: companion-agent  (apps/companion/)
    ├── Specialist: extension-agent  (apps/browser-extension/)
    ├── Specialist: overlay-agent    (apps/overlay/)
    └── Specialist: simulation-agent (platform/simulation-game/)
```

Each specialist:
1. Reads `.agents/AGENT_CONTRACT.md` first
2. Checks `.agents/PHASE_GATES.md` to confirm its phase is unlocked
3. References `.agents/SCHEMA_REGISTRY.md` before creating any types
4. Reports completion back to coordinator

### Parallelism Rules

**Always run in parallel:**
- `schema-agent` for types + `docs-agent` for documentation of those types
- `test-agent` for new test files + `pipeline-agent` for data changes
- Multiple `specialist` agents in Phase 5 (independent app stubs)

**Never run in parallel:**
- `schema-agent` changes + any agent that uses those schemas (schema must complete first)
- `backend-agent` adds endpoint + `frontend-agent` hooks into it (schema boundary must be defined first)
- Two agents modifying `AGENTS.md` or `CLAUDE.md`

---

## 9. Phase Gates (Go/No-Go Criteria)

Agents **MUST NOT** begin a phase until all gates are met. Gates are also listed in `.agents/PHASE_GATES.md`.

| Phase | Gate Criteria | Verified by |
|-------|--------------|-------------|
| 0 → 1 | Root has ≤15 .md files. TENET docs exist. Agent contracts deployed. | File count check |
| 1 → 2 | `data/schemas/*.ts` exist. `@njz/types` package resolves. TypeScript passes. | `pnpm typecheck` |
| 2 → 3 | Each new service has README, health endpoint, and unit tests. | `pytest services/*/tests/` |
| 3 → 4 | Navigation routes work. Hub URLs include game context. E2E nav tests pass. | `npx playwright test navigation` |
| 4 → 5 | Live match feed latency <500ms. TeneT confidence scores visible. | Load test + manual check |
| 5 → 6 | All Phase 5 apps build without errors. Shared packages version-locked. | `pnpm build` |

---

## 10. File Management Mandates

### Root Directory Policy

**Allowed at repo root (maximum 20 files):**
- `MASTER_PLAN.md` (this file)
- `README.md`
- `AGENTS.md`
- `CLAUDE.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `LICENSE`
- `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`
- `turbo.json`, `postcss.config.js`, `svgo.config.js`
- `docker-compose.yml`, `docker-compose.production.yml`
- `vercel.json`, `render.yaml`
- `pytest.ini`, `mkdocs.yml`

**Everything else goes to:**
- Phase/progress reports → `docs/reports/`
- Architecture docs → `docs/architecture/`
- Historical plans → `docs/archive/`
- Deployment guides → `docs/operations/`

### Document Versioning

All `.md` files must include the version header:
```
[VerMMM.mmm]
```
Increment `MMM` for structural changes, `mmm` for content updates.

### Schema Change Policy

Any change to `data/schemas/` or `packages/@njz/types/` requires:
1. Comment in the file: `// SCHEMA CHANGE: <reason> — <date>`
2. Update to `.agents/SCHEMA_REGISTRY.md`
3. Version bump in `packages/@njz/types/package.json`
4. Corresponding Pydantic schema update in Python if applicable

---

---

## §Phase 7 — Repository Governance and Hygiene

**Status:** ✅ COMPLETE (2026-03-27)
**DEPENDS_ON:** None
**BLOCKS:** Phase 8

### Objectives

- Establish single-owner CODEOWNERS with risk-tiered auto-merge (`[SAFE]`/`[STRUCT]`/`[CRIT]`)
- Permanently delete the Job Board (329 files, security surface, CRIT PR)
- Reorganise `archive/` into date-indexed `Archived/Y25/` + `Archived/Y26/` structure
- Create `ARCHIVE_MASTER_DOSSIER.md` (T0) as permanent reference replacing archived docs
- Update agent coordination files: CODEOWNER_CHECKLIST.md, COORDINATION_PROTOCOL.md, ARCHIVE_INDEX_SCHEDULE.md, AGENT_CONTRACT.md

### Phase 7 Checklist

- [x] 7.1 `.github/CODEOWNERS` — single owner `@notbleaux`, high-scrutiny path overrides
- [x] 7.2 `.github/workflows/pr-classification.yml` — risk-tier label automation
- [x] 7.3 `.github/workflows/auto-merge.yml` — `[SAFE]` auto-merge after CI
- [x] 7.4 `.github/commit-msg` hook — conventional commits + risk tag validation
- [x] 7.5 Six PR templates — `feature.md`, `fix.md`, `refactor.md`, `schema-change.md`, `deletion.md`, `docs.md`
- [x] 7.6 Job Board deletion (329 files, CRIT PR) — CODEOWNER approved 2026-03-27
- [x] 7.7 Archive consolidation — 144 files → `Archived/Y26/M03/`
- [x] 7.8 `ARCHIVE_MASTER_DOSSIER.md` (T0) created at root
- [x] 7.9 `.doc-tiers.json` updated — T0 entries for ARCHIVE_MASTER_DOSSIER, CODEOWNER_CHECKLIST
- [x] 7.10 `MASTER_PLAN.md` extended with Phases 7–13 sections
- [x] 7.11 `PHASE_GATES.md` extended with Phase Dependency DAG + gates for Phases 7–13
- [x] 7.12 Visual Design Book schema files created in `docs/superpowers/visual-design-book/`

### Gate Summary
6 gates. See `.agents/PHASE_GATES.md §Phase 7`.

---

## §Phase 7-S — Supplemental Governance Deliverables

**Status:** ✅ COMPLETE (2026-03-27)
**DEPENDS_ON:** Phase 7
**PART OF:** Phase 7 closeout — operational framework

### Objectives

Establish the agent operational frameworks needed before Phase 8 work begins: skill registry, session lifecycle, escalation matrix, CI validation pipeline, and session work plan system.

### Phase 7-S Checklist

- [x] 7-S.1 `.agents/SKILL_MAP.md` — capability registry for all agent types (T1)
- [x] 7-S.2 `docs/ai-operations/ESCALATION_PROTOCOL.md` — decision matrix: autonomous vs escalate (T1)
- [x] 7-S.3 `docs/QUICK_REFERENCE.md` — 1-page cheat sheet (T1)
- [x] 7-S.4 `.github/workflows/agent-validation.yml` — CI: typecheck, lint, Python, doc-version-headers, no-inline-types
- [x] 7-S.5 `docs/ai-operations/SESSION_LIFECYCLE.md` — 5-stage session lifecycle with archiving/deletion and dossier consolidation checks (T1)
- [x] 7-S.6 `docs/ai-operations/SESSION_WORKPLAN_TEMPLATE.md` — per-session work plan template (T1)
- [x] 7-S.7 `docs/ai-operations/MONTHLY_CLEANUP_PROTOCOL.md` — M-Q1 through M-Q4 cadence with dossier consolidation (T1)
- [ ] 7-S.8 Root-level stale file cleanup — TASK_12_FINAL_REPORT.md, PHASE_0_1_2_VERIFICATION_REPORT.md, PHASE_2_*.md, SPECIALIST_B_*.md, health_report.md, ADMIN_PANEL_INTEGRATION.md → `Archived/Y26/M03/`
- [ ] 7-S.9 `AGENT_CONTRACT.md` updated — session lifecycle requirements, CRIT PR 24h hold rule
- [ ] 7-S.10 `.doc-tiers.json` updated — new T1 entries for all 7-S files

---

> ### ⚠️ USER_INPUT_REQUIRED — Before Phase 8 Can Begin
>
> **C-8.1: Auth0 Tenant Setup**
>
> Phase 8 (API Gateway and Auth Platform) requires a live Auth0 tenant before agents can wire JWT middleware.
>
> **User must complete:**
> 1. Create an Auth0 account at auth0.com (or use existing tenant)
> 2. Create a new Application (Single Page Application for web, Machine-to-Machine for API)
> 3. Note down: `DOMAIN`, `CLIENT_ID`, `AUDIENCE`, `CLIENT_SECRET`
> 4. Add `http://localhost:5173` to Allowed Callback URLs (dev)
> 5. Update `.agents/CODEOWNER_CHECKLIST.md` — mark C-8.1 as `CLAIMED → ACTIVE`
> 6. Provide credentials to agent session via environment variables (never commit credentials)
>
> **Phase 8 is blocked until this is complete. Agents reaching this marker must stop and notify user.**

---

## §Phase 8 — API Gateway and Auth Platform

**Status:** 🔒 BLOCKED — USER_INPUT_REQUIRED (Auth0 setup — see marker above)
**DEPENDS_ON:** Phase 7 ✅
**BLOCKS:** Phases 10, 11, 12

### Objectives

- Upgrade `services/api-gateway/` from placeholder to production FastAPI gateway
- Wire Auth0 end-to-end (JWT middleware, frontend auth context, refresh token rotation)
- Add circuit breakers, tiered rate limiting, and structured audit logging

### Phase 8 Checklist

- [ ] 8.1 Auth0 tenant configured — credentials available in environment (USER_INPUT_REQUIRED)
- [ ] 8.2 `services/api-gateway/` upgraded to production FastAPI gateway with versioned routes
- [ ] 8.3 JWT middleware wired — `/api/v1/protected` routes reject unauthenticated requests
- [ ] 8.4 Frontend auth context — login/logout/refresh token rotation working
- [ ] 8.5 Circuit breakers added — downstream service failures handled gracefully
- [ ] 8.6 Tiered rate limiting — anonymous / authenticated / admin tiers
- [ ] 8.7 Structured audit logging — all auth events written to PostgreSQL audit table
- [ ] 8.8 Integration tests pass — `pytest tests/integration/ -v`

### Gate Summary
3 gates. See `.agents/PHASE_GATES.md §Phase 8`.

### CODEOWNER_APPROVAL_REQUIRED
C-8.2: Auth0 configuration — requires Auth0 tenant credentials from user before work can begin.

---

## §Phase 9 — Web App UI/UX Enhancement

**Status:** 🟡 UNLOCKED (concurrent with Phase 8)
**DEPENDS_ON:** None (concurrent — can run in parallel with Phase 8)
**Note:** Phase 0-X Visual Design Book feeds into this when available

### Objectives

- Formalise CSS design token system (`tokens.css` + Tailwind extension)
- Document all `@njz/ui` components with usage examples
- WCAG 2.1 AA audit + Lighthouse ≥ 90 on all routes

### Phase 9 Checklist

- [ ] 9.1 `packages/@njz/ui/src/tokens.css` — CSS custom properties for all design tokens
- [ ] 9.2 `tailwind.config.ts` extended with token references
- [ ] 9.3 All `@njz/ui` components documented with Storybook or equivalent usage examples
- [ ] 9.4 WCAG 2.1 AA audit complete — all violations resolved
- [ ] 9.5 Lighthouse ≥ 90 on `/`, `/valorant`, `/cs2`, and each hub route
- [ ] 9.6 Visual Design Book designs applied (when Phase 0-X delivers)

### Gate Summary
3 gates. See `.agents/PHASE_GATES.md §Phase 9`.

---

## §Phase 10 — Companion App MVP

**Status:** 🔒 BLOCKED on Phase 8
**DEPENDS_ON:** Phase 8

### Objectives

- Upgrade `apps/companion/` from Vite stub to Expo SDK project
- Auth0 login, live match scores, player profiles, push notifications

### Phase 10 Checklist

- [ ] 10.1 `apps/companion/` migrated from Vite stub to Expo SDK 51 project
- [ ] 10.2 Auth0 login flow — native Auth0 React Native SDK
- [ ] 10.3 Live match score feed — WebSocket client reusing `@njz/websocket-client`
- [ ] 10.4 Player profile pages — data from FastAPI via `@njz/types`
- [ ] 10.5 Push notifications wired — Expo Notifications with match start/end events
- [ ] 10.6 iOS + Android builds pass in CI (`eas build --profile preview`)

### Gate Summary
3 gates. See `.agents/PHASE_GATES.md §Phase 10`.

---

## §Phase 11 — Browser Extension and LiveStream Overlay

**Status:** 🔒 BLOCKED on Phase 8
**DEPENDS_ON:** Phase 8

### Objectives

- Upgrade `apps/browser-extension/` to Manifest V3 compliant, installable Chrome extension
- Upgrade `apps/overlay/` to production OBS browser source with score HUD and TeneT confidence badge

### Phase 11 Checklist

- [ ] 11.1 `apps/browser-extension/` — Manifest V3, service worker, content script, popup
- [ ] 11.2 Extension live score panel — WebSocket client, match summary overlay
- [ ] 11.3 Extension build passes Chrome Web Store pre-validation (`web-ext lint`)
- [ ] 11.4 `apps/overlay/` — OBS browser source: score HUD, round timer, TeneT confidence badge
- [ ] 11.5 Overlay renders correctly at 1920×1080 and 1280×720

### Gate Summary
3 gates. See `.agents/PHASE_GATES.md §Phase 11`.

---

> ### ⚠️ USER_INPUT_REQUIRED — Before Phase 12 Gate 12.3 Can Begin
>
> **C-12.B: Betting/Prediction UI Opt-In Confirmation**
>
> Phase 12 includes a token-based prediction system. This is a deliberate feature that requires explicit owner opt-in before agents build the UI.
>
> **User must complete:**
> 1. Confirm the prediction/betting UI feature is approved for this deployment context
> 2. Confirm the token economy design (token name, earn/spend mechanics)
> 3. Update `.agents/CODEOWNER_CHECKLIST.md` — mark C-12.B as `CLAIMED → ACTIVE`
>
> **Agents must stop at gate 12.3 and notify user if this confirmation has not been received.**

---

## §Phase 12 — Content and Prediction Platform

**Status:** 🔒 BLOCKED on Phase 8
**DEPENDS_ON:** Phase 8
**CODEOWNER_APPROVAL_REQUIRED:** C-12.B — Betting/Prediction UI (deliberate opt-in, see marker above)

### Objectives

- Deploy Wiki app (Next.js 14 SSG) and Nexus portal with live status
- Token-based prediction system accessible to authenticated users
- OddsEngine confidence scores surfaced in the prediction UI

### Phase 12 Checklist

- [ ] 12.1 `apps/wiki/` — Next.js 14 SSG deployed, content sourced from PostgreSQL
- [ ] 12.2 `apps/nexus/` — Nexus portal with live platform status and cross-app navigation
- [ ] 12.3 Token-based prediction system (USER_INPUT_REQUIRED C-12.B before this gate)
  - [ ] 12.3a Token earn/spend model in FastAPI (`packages/shared/api/src/betting/`)
  - [ ] 12.3b Prediction UI in OPERA hub (`hub-4-opera/`) — authenticated users only
  - [ ] 12.3c OddsEngine confidence scores surfaced in prediction cards
- [ ] 12.4 Wiki and Nexus E2E tests pass

### Gate Summary
4 gates. See `.agents/PHASE_GATES.md §Phase 12`.

---

> ### ⚠️ USER_INPUT_REQUIRED — Before Phase 13 Gate 13.4 (Production Deploy)
>
> **C-13.D: Production Deployment Sign-Off**
>
> Phase 13 ends with a production deployment. This is irreversible and requires explicit CODEOWNER sign-off.
>
> **User must complete:**
> 1. Review the full E2E test report (all 95+ tests passing against production build)
> 2. Confirm all production environment variables are set in Vercel + Render dashboards
> 3. Confirm Godot simulation integration is production-ready
> 4. Update `.agents/CODEOWNER_CHECKLIST.md` — mark C-13.D as `CLAIMED → ACTIVE`
> 5. Issue explicit `DEPLOY APPROVED — [date]` message in session before agent proceeds
>
> **Production deploy is irreversible. Agents must stop at gate 13.4 and await explicit approval.**

---

## §Phase 13 — Simulation Engine and Production Launch

**Status:** 🔒 BLOCKED on Phases 10 + 11 + 12
**DEPENDS_ON:** Phases 10, 11, 12 all gated
**CODEOWNER_APPROVAL_REQUIRED:** C-13.D — Production deployment sign-off (irreversible — see marker above)

### Objectives

- Unpause Godot simulation engine, connect XSim to platform data pipeline
- All production environment variables set and validated
- Full E2E suite passing against production build
- Production deploy with CODEOWNER sign-off

### Phase 13 Checklist

- [ ] 13.1 Godot simulation engine unpaused — `platform/simulation-game/` builds headlessly
- [ ] 13.2 XSim connected to platform data pipeline — reads from Path B (Legacy/authoritative)
- [ ] 13.3 All production env vars set — Vercel, Render, Supabase, Upstash, Auth0
- [ ] 13.4 Full E2E suite passes against production build (USER_INPUT_REQUIRED C-13.D before this gate)
- [ ] 13.5 Production deploy executed with CODEOWNER sign-off
- [ ] 13.6 Post-deploy smoke tests pass

### Gate Summary
4 gates. See `.agents/PHASE_GATES.md §Phase 13`.

---

## 11. Agent Operational Protocol

**Authority:** This section governs how all AI agents operate within this project. Rules here override agent defaults.
**Full detail:** `docs/ai-operations/SESSION_LIFECYCLE.md` (T1)

### 11.1 Session Lifecycle — 5 Stages (Mandatory, No Stage May Be Skipped)

| Stage | Name | Key Actions |
|-------|------|-------------|
| 1 | Cleanup | Delete previous session ephemera; archive stale root files; consolidate fragment clusters into dossiers before archiving |
| 2 | Orient | Load T0 files in order; read CONTEXT_FORWARD; check USER_INPUT_REQUIRED in CODEOWNER_CHECKLIST |
| 3 | Plan | Create `NOTEBOOK-YYYY-MM-DD.md` + `TODO-YYYY-MM-DD.md` in `.agents/session/` |
| 4 | Work | Execute tasks; update notebook with decisions; mark TODO items; drift-check before each new gate |
| 5 | Close | Mark gates in PHASE_GATES.md; append to Phase Logbook; write CONTEXT_FORWARD; archiving/deletion final check |

### 11.2 T0 Load Order (Stage 2)

Agents load these files in order at session start:

1. `MASTER_PLAN.md` — this file (current phase, active TODO)
2. `.agents/PHASE_GATES.md` — confirm which phase is unlocked
3. `.agents/CODEOWNER_CHECKLIST.md` — check for UNCLAIMED / PENDING USER_INPUT_REQUIRED
4. `.agents/session/CONTEXT_FORWARD.md` — previous session's handoff (if exists)
5. `.agents/phase-logbooks/Phase-N-LOGBOOK.md` — current phase history

### 11.3 Skill Registry

All agent capabilities are catalogued in `.agents/SKILL_MAP.md` (T1). Before dispatching a subagent, the orchestrator must verify the subagent type is listed there and confirm domain boundaries.

### 11.4 Escalation Rules

Full decision matrix: `docs/ai-operations/ESCALATION_PROTOCOL.md` (T1).

Agents decide autonomously for:
- Intra-phase implementation choices within spec
- Refactoring within a single file with no schema changes
- Test addition for existing behaviour
- Approved root cleanup (moving stale files to Archived/)

Agents escalate (stop + report to user) for:
- Any `USER_INPUT_REQUIRED` item that is `UNCLAIMED` or `PENDING`
- Any `[CRIT]` PR without a confirmed 24h hold
- Work that would modify `data/schemas/`, `.agents/`, or `.github/` without an `ACTIVE` CODEOWNER_CHECKLIST item
- Anything not described in the current phase section of this document

### 11.5 Commit and PR Standards

```
type(scope): description [SAFE|STRUCT|CRIT]
```

- `[SAFE]` — auto-merge after CI green
- `[STRUCT]` — CODEOWNER review required
- `[CRIT]` — CODEOWNER review + 24h hold before merge

Risk tag is MANDATORY. Missing tag = CI fails.

---

## 12. Session Work Plan Protocol

**Authority:** Governs session-scoped planning artefacts. These are temporary — they are NOT permanent project records.
**Full detail:** `docs/ai-operations/SESSION_WORKPLAN_TEMPLATE.md` (T1), `docs/ai-operations/SESSION_LIFECYCLE.md` (T1)

### 12.1 Session Files

| File | Location | Lifetime | Tier |
|------|----------|----------|------|
| Session Notebook | `.agents/session/NOTEBOOK-YYYY-MM-DD.md` | Deleted next session (Stage 1) | T2 |
| Session TODO | `.agents/session/TODO-YYYY-MM-DD.md` | Deleted next session (Stage 1) | T2 |
| Context Forward | `.agents/session/CONTEXT_FORWARD.md` | Replaced each session close | T1 |
| Session Work Plan | `.agents/session-workplans/Phase-N/YYYY-MM-DD-*.md` | Deleted in M-Q4 cleanup (>30 days) | T2 |
| Phase Logbook | `.agents/phase-logbooks/Phase-N-LOGBOOK.md` | Permanent — never deleted | T1 |

### 12.2 Session TODO — Anti-Drift Contract

The Session TODO is synced from this document's phase checklist at session start. Before any phase transition:

- All completed items must be marked `[x]` in both the TODO and in PHASE_GATES.md
- Any item marked `[x]` in the TODO that is NOT yet in PHASE_GATES.md is incomplete — do not advance the phase
- If a TODO item was not completed, it must appear in CONTEXT_FORWARD under "What Is In Progress"

### 12.3 Context Forward — Handoff Contract

`CONTEXT_FORWARD.md` must include:

- Gates completed this session (with commit hashes)
- Work in progress (task name + where it stopped)
- Open questions for next session
- Files needing attention
- USER_INPUT_REQUIRED status
- Explicit "Do NOT Redo" list (prevents re-doing completed work)

### 12.4 Phase Logbook — Permanent Record

Each phase has a logbook at `.agents/phase-logbooks/Phase-N-LOGBOOK.md`. Logbooks record:
- Session date, gates completed, decisions made, files created/modified
- They are **never deleted** — they are the authoritative history of what was built and why

---

## 13. Monthly Cleanup Protocol

**Authority:** Formalises the monthly maintenance cycle. Run at M-Q1 through M-Q4 cadence.
**Full detail:** `docs/ai-operations/MONTHLY_CLEANUP_PROTOCOL.md` (T1)

### 13.1 Monthly Calendar

| Quarter | Days | Primary Task |
|---------|------|--------------|
| M-Q1 | 1–7 | Archive scan, session workplan audit |
| M-Q2 | 8–14 | ARCHIVE_MASTER_DOSSIER index table update |
| M-Q3 | 15–21 | FAQ + PHASE_GATES review, doc tiers audit |
| M-Q4 | 22–end | Session workplan cleanup (>30 days), version bumps, commit |

### 13.2 Dossier Consolidation Rule (Mandatory Before Any Archiving)

Fragmented or extracted components MUST be consolidated into a compiled dossier before archiving. Do NOT archive piecemeal.

**Fragment clusters** — multiple files from the same component, session, or feature (e.g., several `TASK_*.md` for one feature, multiple `SPECIALIST_*.md` from one session) — must be:

1. Compiled into `Archived/Y26/M{MM}/DOSSIER-{component-name}-{date}.md`
2. Indexed as one row in `ARCHIVE_MASTER_DOSSIER.md` (not individual fragment rows)
3. Original fragments removed via `git rm` after dossier is confirmed complete

This rule applies at both session close (Stage 5D) and monthly M-Q4 cleanup.

### 13.3 Approved Root-Level Files

These 5 files are the ONLY valid `.md` files at repo root. All others must be moved to `docs/`, `.agents/`, or `Archived/`:

| File | Tier | Purpose |
|------|------|---------|
| `MASTER_PLAN.md` | T0 | Central truth road-map |
| `AGENTS.md` | T0-equiv | Project state for agent orientation |
| `CLAUDE.md` | T0-equiv | Claude Code instructions |
| `README.md` | T0-equiv | Repository entry point |
| `ARCHIVE_MASTER_DOSSIER.md` | T0 | Archive index |

### 13.4 Archive Repository Migration (Future)

When `notbleaux/eSports-EXE-archives` is created (USER_INPUT_REQUIRED — user must create this GitHub repo), push `Archived/` subtree to archive repo and remove from current repo. `ARCHIVE_MASTER_DOSSIER.md` remains at root permanently.

---

*This document is the single source of truth for all structural and operational decisions. All agents read this before starting work. Last reviewed: 2026-03-27 [Ver001.002]*
