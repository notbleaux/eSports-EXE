[Ver001.000]

# NJZ eSports Platform — Master Restructuring & Ecosystem Plan

**Project:** NJZ eSports (NJZiteGeisTe Platform)
**Status:** ACTIVE — Authoritative Document
**Created:** 2026-03-27
**Supersedes:** `docs/ARCHITECTURAL_REMODELING_MASTER_PLAN.md`, `docs/COMPREHENSIVE_PLATFORM_MASTER_PLAN.md`, all scattered `PHASE_*.md` files at root

---

## Table of Contents

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

### Phase 2 — Service Architecture Scaffolding (Week 2–4)

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

### Phase 3 — Frontend Architecture Correction (Week 3–5)

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

### Phase 4 — Data Pipeline: Lambda Architecture (Month 2)

**Owner:** Data pipeline agent + Backend agent
**Depends on:** Phases 2, 3 complete

Tasks:
- [ ] Speed Layer (Path A — Live):
  - Redis Streams for real-time match events
  - WebSocket broadcaster connected to `services/websocket/`
  - Pandascore webhook → Redis → broadcast pipeline
  - Latency target: <200ms from event to client
- [ ] Batch Layer (Path B — Legacy):
  - S3/R2 bucket for raw video uploads and scraped HTML
  - Python batch processor: raw → structured → TeneT verification
  - ClickHouse analytics table (columnar, fast aggregation)
  - Scheduled sync: every 6 hours from Pandascore, daily from scrapers
- [ ] Serving Layer (Merged):
  - API endpoints serve from PostgreSQL (verified) with Redis cache overlay
  - Separate endpoints for Live (`/v1/live/`) and Legacy (`/v1/history/`)
  - TeneT confidence score exposed per data point
- [ ] TeneT Key.Links integration:
  - Wire `services/tenet-verification/` into batch pipeline
  - Confidence threshold: 0.90 → auto-accept, 0.70–0.90 → flag, <0.70 → reject
  - Manual review dashboard in SATOR admin panel

**Gate:** Live match scores reach frontend in <500ms. Historical data queries return verified confidence scores. TeneT review queue visible in admin panel.

---

### Phase 5 — Ecosystem Expansion (Month 3+)

**Owner:** Multiple agents (see Sub-Agent Orchestration)
**Depends on:** Phase 4 complete

#### 5A — Companion App
- [ ] `apps/companion/` — React Native + Expo
  - Shares `@njz/types`, `@njz/websocket-client`, `@njz/ui` packages
  - Push notifications for live match events
  - Offline caching via AsyncStorage + TanStack Query persistence
  - Quick-view overlay for active game sessions

#### 5B — Browser Extension
- [ ] `apps/browser-extension/` — Chrome/Firefox (Manifest V3)
  - Shares `@njz/types`, `@njz/websocket-client`
  - Quick stats panel on hover over player names
  - Live match sidebar on esports streaming sites
  - Build: Vite + WebExtension plugin

#### 5C — LiveStream Overlay
- [ ] `apps/overlay/` — OBS Studio Browser Source
  - Shares `@njz/types`, `@njz/websocket-client`
  - Real-time round stats, economy graphs, player highlights
  - Live polls integration
  - Build: Vite, SPA, no server-side rendering required

#### 5D — Offline Game Revival
- [ ] `platform/simulation-game/` — Godot 4 revival
  - GDScript + C# hybrid
  - Strategy/simulation calibration mode
  - Synthetic match data exported to feed TeneT Legacy compiler
  - XSimulations: what-if scenario engine

**Gate:** Each app builds and deploys independently. Shared packages version-locked. E2E smoke tests per app.

---

### Phase 6 — LIVEOperations Centre & Advanced Features (Month 4+)

**Owner:** Full-stack agents
**Depends on:** Phase 5 complete

- [ ] Token-based prediction system (play-money only, jurisdictionally safe)
- [ ] Player trading cards (collectible system)
- [ ] Ampitheatre/Theatre Stages (content creator tooling)
- [ ] Media & Wiki (`apps/wiki/` — Next.js SSG)
- [ ] Nexus Portal (`apps/nexus/` — aggregated directory)
- [ ] eSports Nexus WorldPorts directory
- [ ] Social media integration layer

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

*This document is the single source of truth for all structural decisions. All agents read this before starting work.*
