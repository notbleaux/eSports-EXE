# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NJZ eSports — NJZiteGeisTe Platform** (v2.1.0) — A community eSports analytics and simulation platform for Valorant and CS2.

### TENET Architecture — CRITICAL: Read Before Modifying Any Route, Hub, or Data Layer

TENET is a **data networking and verification topology**, NOT a 5th content hub. Full documentation: `docs/architecture/TENET_TOPOLOGY.md`.

Correct hierarchy:
- **TeNeT** — User-facing Home Portal (entry page, auth, onboarding)
- **TeNET** — Network Directory (routes users to World-Ports by game; URL: `/hubs`)
- **World-Ports** — Game-specific entry points (`/valorant`, `/cs2`, etc.)
- **GameNodeID** — Base unit carrying the standardized 2×2 Quarter GRID
- **Quarter GRID** — The four WorldTree hubs present in every GameNodeID:
    - SATOR — Advanced Analytics → `/analytics`
    - AREPO — Community, Players & Fans → `/community`
    - OPERA — Professional eSports → `/pro-scene`
    - ROTAS — Stats Reference / Simulation → `/stats`
- **TeZeT** — World-Tree within each Quarter (hub-specific sub-branches)
- **tenet** (lowercase) — Network channels / database directory (maps the GameNodeID base)
- **TeneT Key.Links** — Verification bridge: parses, verifies, and tiers data from all sources

`hub-5-tenet/` in the frontend is the **TeNET navigation layer** (portal + directory + routing). It is NOT a content hub.

### Data Flow — Two Paths

- **Path A (Live):** Pandascore webhook → Redis → WebSocket → Companion/Extension/Overlay (low-latency, eventual accuracy)
- **Path B (Legacy):** All sources → TeneT Key.Links verification → PostgreSQL truth layer → SATOR analytics (high granularity, authoritative)

Full data architecture: `docs/architecture/TENET_TOPOLOGY.md`
Schema types: `data/schemas/GameNodeID.ts`, `data/schemas/tenet-protocol.ts`

## Commands

### Root Monorepo

```bash
pnpm install                   # Install all workspace dependencies
pnpm run build                 # Build all workspaces (Turbo)
pnpm run typecheck             # TypeScript check across all packages
pnpm run dev:web               # Vite dev server for web app (port 5173)
pnpm run dev:api               # FastAPI dev server (port 8000)
pnpm run test:unit             # Web unit tests (Vitest)
pnpm run test:e2e              # Playwright E2E tests
pnpm run test:firewall         # Data partition security tests
pnpm run validate:schema       # Stats schema validation
pnpm run docker:up             # Start PostgreSQL + Redis in Docker
pnpm run docker:down           # Stop Docker services
```

### Web App (`apps/web/`)

```bash
npm run dev                    # Vite dev server
npm run build                  # Production build
npm run lint                   # ESLint
npm run typecheck              # tsc --noEmit
npm run test                   # Vitest (watch mode)
npm run test:run               # Vitest (single run)
npm run test:coverage          # Vitest with coverage
npx playwright test            # E2E tests
npm run test:visual            # Playwright visual regression tests
npm run build:analyze          # Build + bundle size analysis
```

### Backend (`packages/shared/`)

```bash
uvicorn main:app --reload --port 8000 --host 0.0.0.0   # FastAPI dev server
pytest                                                    # All Python tests
pytest tests/unit/ -v                                    # Unit tests only
pytest tests/integration/ -v                             # Integration tests only
pytest --cov=packages/shared/ --cov-report=xml          # With coverage
```

### Godot Simulation (`platform/simulation-game/`)

```bash
godot --editor project.godot              # Open Godot editor
godot --headless --script tests/run_tests.gd   # Run headless tests
```

## Architecture

### Monorepo Structure (pnpm workspaces + Turbo)

```
apps/web/                     # NJZiteGeisTe Platform — React 18 + Vite (MAIN)
apps/VCT Valorant eSports/    # VCT data project (Python/FastAPI)
packages/shared/api/          # FastAPI REST backend
packages/shared/axiom-esports-data/   # Python data pipeline (PostgreSQL, asyncpg)
packages/shared/packages/data-partition-lib/  # Security firewall library
packages/shared/packages/stats-schema/        # Stats validation schemas
services/api/                 # API service placeholder (Phase 4)
infra/docker/                 # Docker Compose for local dev
infra/migrations/             # Alembic migrations (Phase 4)
platform/simulation-game/     # Godot 4 simulation engine (status: paused)
tests/e2e/                    # Playwright E2E (95+ tests)
tests/integration/            # Python integration tests (35+)
tests/load/                   # Load testing (Locust, k6)
```

### Frontend Hub Architecture (`apps/web/src/`)

The web app has four content hubs + one navigation layer:

| Directory | Path Alias | Role | Type |
|-----------|------------|------|------|
| `hub-1-sator/` | `@hub-1/*` | SATOR — Advanced Analytics (SimRating, RAR, player metrics) | Content Hub |
| `hub-2-rotas/` | `@hub-2/*` | ROTAS — Stats Reference (historical data, leaderboards) | Content Hub |
| `hub-3-arepo/` | `@hub-3/*` | AREPO — Community (forums, players, fans) | Content Hub |
| `hub-4-opera/` | `@hub-4/*` | OPERA — Pro eSports (tournaments, pro scene, live matches) | Content Hub |
| `hub-5-tenet/` | `@hub-5/*` | TeNET Navigation Layer (portal, game-world directory, routing) | **Navigation Layer — NOT a content hub** |

Additional aliases: `@/*` → `src/*`, `@shared/*` → `src/shared/*`

Profile routes (added Phase 4): `/player/:slug` (Player profile page), `/team/:slug` (Team profile page).

Shared packages: `@sator/types` (packages/shared/types/ — Player, Team, Match, SimRating, Game) and `@sator/services` (packages/shared/services/).

### Key Technology Choices

- **State:** Zustand (client state), TanStack Query (server state + caching)
- **3D/Visualization:** Three.js + React Three Fiber, D3.js, Recharts
- **Animation:** Framer Motion, GSAP
- **ML:** TensorFlow.js (WASM + WebGPU backends), ONNX Runtime Web
- **Deployment:** Vercel (frontend), Render.com (API), Supabase (PostgreSQL 15), Upstash (Redis 7)
- **PWA:** Service worker via `apps/web/src/sw.ts`

### Data Flow

**Live (Path A):** Pandascore webhook → Redis Streams → WebSocket service → Frontend (low-latency score/round updates)
**Legacy (Path B):** All sources → TeneT Key.Links verification bridge → PostgreSQL truth layer → FastAPI → TanStack Query → Content hubs (authoritative, high-granularity)
**Shared:** `data-partition-lib` enforces security boundaries between game simulation data and web platform data.

## Code Style

### Commit Messages (Conventional Commits)

```
<type>(<scope>): <description> - <context>
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

Examples:
```
feat(website): Add SATOR hub orbital navigation - implements 3D scene
fix(api): Resolve VLR data parsing error - handles null values
```

### Document Versioning

All documents must include a version header:
```
[VerMMM.mmm]
# Document Title
```

### Pre-commit Hooks (auto-run on commit)

Python: Black (`--line-length=100`), Ruff, mypy (`--ignore-missing-imports`)
JS/TS: ESLint, Prettier
All: trailing whitespace, end-of-file, YAML/JSON validation, detect-secrets, 1000KB file size limit

### TypeScript Config

Strict mode is on. `noUnusedLocals` and `noUnusedParameters` are enabled — unused variables will fail type-check.

## Agent Coordination

AI agents working on this project MUST read these files before starting any task:
1. `MASTER_PLAN.md` — Current phase, scope, and full ecosystem plan
2. `.agents/AGENT_CONTRACT.md` — Behavioral contract (domain boundaries, prohibited actions)
3. `.agents/PHASE_GATES.md` — Which phases are unlocked
4. `.agents/SCHEMA_REGISTRY.md` — All canonical types (check before creating any new type)

The `.agents/` directory contains project-specific skills and the coordination system.

The `.job-board/` coordination system is archived in `archive/` — do not use it.

## Known Duplications

`packages/shared/apps/sator-web/` — removed in Phase 3 (no external references found)
