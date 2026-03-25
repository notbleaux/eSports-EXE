# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**NJZiteGeisTe Platform** (v2.1.0) — A community eSports analytics and simulation platform for Valorant and CS2.

Architecture hierarchy:
- TENET: Universal WorldHUBs top layer (game-agnostic)
- tenet: Game-specific world (e.g., /valorant, /cs2)
- tezet: Hub selector within each game world (2x2 grid)
- Four hub types (appear in every tezet):
    - SATOR — Advanced Analytics
    - ROTAS — Stats Reference
    - OPERA — Professional eSports Information
    - AREPO — Community, Players & Fans

Developer hub names (SATOR/ROTAS/OPERA/AREPO) are internal identifiers.
User-facing route names:
- SATOR → /analytics
- ROTAS → /stats
- OPERA → /pro-scene
- AREPO → /community
- TENET/tezet → /hubs

## Commands

### Root Monorepo

```bash
npm install                    # Install all workspace dependencies
npm run build                  # Build all workspaces (Turbo)
npm run typecheck              # TypeScript check across all packages
npm run dev:web                # Vite dev server for web app (port 5173)
npm run dev:api                # FastAPI dev server (port 8000)
npm run test:unit              # Web unit tests (Vitest)
npm run test:e2e               # Playwright E2E tests
npm run test:firewall          # Data partition security tests
npm run validate:schema        # Stats schema validation
npm run docker:up              # Start PostgreSQL + Redis in Docker
npm run docker:down            # Stop Docker services
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

### Monorepo Structure (npm workspaces + Turbo)

```
apps/web/                     # NJZiteGeisTe Platform — React 18 + Vite (MAIN)
apps/VCT Valorant eSports/    # VCT data project (Python/FastAPI)
packages/shared/api/          # FastAPI REST backend
packages/shared/axiom-esports-data/   # Python data pipeline (PostgreSQL, asyncpg)
packages/shared/packages/data-partition-lib/  # Security firewall library
packages/shared/packages/stats-schema/        # Stats validation schemas
platform/simulation-game/     # Godot 4 simulation engine (status: paused)
tests/e2e/                    # Playwright E2E (95+ tests)
tests/integration/            # Python integration tests (35+)
tests/load/                   # Load testing (Locust, k6)
```

### Frontend Hub Architecture (`apps/web/src/`)

The web app is organized into five hubs, each with a TypeScript path alias:

| Hub | Path | Alias | Purpose |
|-----|------|-------|---------|
| SATOR | `hub-1-sator/` | `@hub-1/*` | Advanced Analytics — SimRating, RAR, player metrics |
| ROTAS | `hub-2-rotas/` | `@hub-2/*` | Stats Reference — historical data, leaderboards |
| AREPO | `hub-3-arepo/` | `@hub-3/*` | Community — forums, players, fans |
| OPERA | `hub-4-opera/` | `@hub-4/*` | Pro eSports — tournaments, pro scene, live matches |
| TENET | `hub-5-tenet/` | `@hub-5/*` | WorldHUBs — central platform, game-world selector |

Additional aliases: `@/*` → `src/*`, `@shared/*` → `src/shared/*`

Shared packages are also available as `@sator/types` and `@sator/services`.

### Key Technology Choices

- **State:** Zustand (client state), TanStack Query (server state + caching)
- **3D/Visualization:** Three.js + React Three Fiber, D3.js, Recharts
- **Animation:** Framer Motion, GSAP
- **ML:** TensorFlow.js (WASM + WebGPU backends), ONNX Runtime Web
- **Deployment:** Vercel (frontend), Render.com (API), Supabase (PostgreSQL 15), Upstash (Redis 7)
- **PWA:** Service worker via `apps/web/src/sw.ts`

### Data Flow

Pandascore API → Python data pipeline (`axiom-esports-data`) → PostgreSQL → FastAPI → TanStack Query → React hubs. WebSockets provide real-time match updates. The `data-partition-lib` enforces security boundaries between data sources.

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

AI agents working on this project should read `AGENTS.md` at the repo root
for current context and guidelines.

The `.agents/` directory contains project-specific Claude Code skills.

The `.job-board/` coordination system is archived in `archive/`.

## Known Duplications

`packages/shared/apps/sator-web/` appears to duplicate `apps/web/` — scheduled for removal in Phase 3
