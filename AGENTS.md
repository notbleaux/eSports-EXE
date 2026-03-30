[Ver003.000]

# AGENTS.md — NJZiteGeisTe Platform

**Purpose:** This file provides essential context for AI coding agents working on the NJZiteGeisTe Platform project.
**Project:** NJZiteGeisTe Platform (formerly SATOR-eXe-ROTAS / NJZ Platform / RadiantX)
**Repository:** https://github.com/notbleaux/eSports-EXE  
**Last Updated:** 2026-03-30

---

## 📋 Project Overview

NJZiteGeisTe Platform is an esports simulation and analytics platform focused on tactical FPS games (Valorant with planned Counter-Strike 2 support). The platform provides:

- **SATOR Analytics:** Advanced player metrics (SimRating, RAR) with confidence weighting
- **eXe Directory:** Service registry and coordination hub
- **ROTAS Simulation:** Deterministic tactical FPS match simulation (Godot 4)
- **NJZiteGeisTe Platform:** 5-hub web interface (SATOR, ROTAS, AREPO, OPERA, TENET Central Hub)
- **Pandascore Integration:** Official API for legal esports data access

### Key Components

| Component | Location | Technology | Status |
|-----------|----------|------------|--------|
| **NJZiteGeisTe Platform** | `apps/web/` | React 18, Vite, Tailwind, TypeScript | ✅ Active v2.1 |
| **API Backend** | `services/api/` | FastAPI, Python 3.11+, Poetry | ✅ Active |
| **Data Pipeline** | `packages/shared/axiom-esports-data/` | Python, PostgreSQL, asyncpg | ✅ Active |
| **Simulation Game** | `platform/simulation-game/` | Godot 4, GDScript, C# | 🟡 Paused |
| **VCT Data** | `apps/VCT Valorant eSports/` | Python, FastAPI | ✅ Active |
| **Browser Extension** | `apps/browser-extension/` | TypeScript, WebExtension API | 🟡 Planned |
| **Companion App** | `apps/companion/` | React Native | 🟡 Planned |
| **Live Overlay** | `apps/overlay/` | TypeScript, OBS integration | 🟡 Planned |

### Version Information

- **Current Version:** 2.1.0
- **API Version:** v1
- **WebSocket Protocol:** v1
- **Last Updated:** March 2026

---

## 🏗️ Architecture

### Monorepo Structure (pnpm workspaces + Turbo)

```
/
├── apps/                          # Applications
│   ├── web/                      # NJZiteGeisTe Platform (React + Vite) - MAIN
│   ├── browser-extension/        # WebExtension for live data
│   ├── companion/                # Mobile companion app
│   ├── nexus/                    # Nexus hub application
│   ├── overlay/                  # Livestream overlay
│   ├── VCT Valorant eSports/     # VCT data project
│   └── wiki/                     # Wiki application
│
├── packages/                      # Shared packages
│   ├── @njz/types/               # Canonical TypeScript types (@njz/types)
│   ├── @njz/ui/                  # Shared UI components (@njz/ui)
│   ├── @njz/websocket-client/    # WebSocket client library
│   └── shared/                   # Shared Python libraries
│       ├── api/                  # FastAPI components (legacy - use services/api/)
│       ├── axiom-esports-data/   # Data pipeline
│       └── packages/             # @sator/* libraries
│           ├── data-partition-lib/   # Security firewall library
│           └── stats-schema/         # Stats validation schemas
│
├── platform/                      # Simulation platform
│   └── simulation-game/          # Godot 4 project
│
├── services/                      # Backend services (primary)
│   ├── api/                      # Main FastAPI service (Poetry)
│   ├── api-gateway/              # API Gateway service
│   ├── exe-directory/            # Service registry
│   ├── legacy-compiler/          # Legacy data compiler
│   ├── tenet-verification/       # TeneT verification service
│   └── websocket/                # WebSocket service
│
├── data/                          # Canonical schema definitions
│   └── schemas/                  # TypeScript schema source of truth
│       ├── GameNodeID.ts         # Core hierarchy types
│       ├── tenet-protocol.ts     # TeneT verification types
│       ├── live-data.ts          # WebSocket contracts
│       └── legacy-data.ts        # API response contracts
│
├── tests/                         # Test suites
│   ├── e2e/                      # Playwright E2E tests
│   ├── integration/              # Python integration tests
│   ├── unit/                     # Python unit tests
│   ├── load/                     # Load testing (Locust, k6)
│   ├── accessibility/            # A11y test suite
│   ├── cross-browser/            # Cross-browser tests
│   └── smoke/                    # Smoke tests
│
├── infra/                         # Infrastructure
│   └── migrations/               # Alembic database migrations
│
├── docs/                          # Documentation
│   ├── architecture/             # Architecture docs
│   ├── governance/               # Governance docs
│   ├── guides/                   # User guides
│   └── reports/                  # Generated reports
│
├── .agents/                       # AI agent coordination
│   ├── skills/                   # Project-specific skills
│   ├── AGENT_CONTRACT.md         # Behavioral contract
│   ├── PHASE_GATES.md            # Phase gate criteria
│   └── SCHEMA_REGISTRY.md        # Type registry
│
└── .github/workflows/            # CI/CD pipelines
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React, Vite, Tailwind CSS | React 18.2, Vite 5 |
| **Language** | TypeScript | 5.9+ |
| **3D/Visualization** | Three.js, React Three Fiber, D3.js | Three 0.159 |
| **Animation** | Framer Motion, GSAP | Framer Motion 11, GSAP 3.12 |
| **State Management** | Zustand, TanStack Query | 4.4+, 5.90+ |
| **Virtualization** | @tanstack/react-virtual | 3.13.22 |
| **ML** | TensorFlow.js, ONNX Runtime | 4.22.0, 1.20.1 |
| **Backend API** | FastAPI (Python) | 0.115+ |
| **Database** | PostgreSQL (Supabase) | 15+ |
| **Cache** | Redis (Upstash) | 7+ |
| **Game Engine** | Godot 4 | 4.2+ |
| **Testing** | Playwright, Vitest, pytest | Latest |
| **Package Manager** | pnpm (workspaces) | 8.15+ |
| **Build System** | Turbo | 2.4+ |
| **CI/CD** | GitHub Actions | — |

### Frontend Hub Architecture

The web app (`apps/web/src/`) has four content hubs + one navigation layer:

| Directory | Path Alias | Role | Type |
|-----------|------------|------|------|
| `hub-1-sator/` | `@hub-1/*` | SATOR — Advanced Analytics (SimRating, RAR, ML) | Content Hub |
| `hub-2-rotas/` | `@hub-2/*` | ROTAS — Stats Reference (leaderboards, history) | Content Hub |
| `hub-3-arepo/` | `@hub-3/*` | AREPO — Community (forums, follows, social) | Content Hub |
| `hub-4-opera/` | `@hub-4/*` | OPERA — Pro eSports (tournaments, live matches) | Content Hub |
| `hub-5-tenet/` | `@hub-5/*` | TeNET Navigation Layer (portal, routing) | **Navigation ONLY** |

**CRITICAL:** `hub-5-tenet/` is the TeNET navigation layer, NOT a content hub. Do not add content features here.

### TENET Data Architecture

TENET is a data networking and verification topology with two data paths:

- **Path A (Live):** Pandascore webhook → Redis → WebSocket → Frontend (low-latency)
- **Path B (Legacy):** All sources → TeneT Key.Links → PostgreSQL → FastAPI (authoritative)

Full documentation: `docs/architecture/TENET_TOPOLOGY.md`

### TypeScript Path Mapping (apps/web/)

```typescript
// tsconfig.json paths
{
  "@/*": ["src/*"],
  "@shared/*": ["src/shared/*"],
  "@hub-1/*": ["src/hub-1-sator/*"],
  "@hub-2/*": ["src/hub-2-rotas/*"],
  "@hub-3/*": ["src/hub-3-arepo/*"],
  "@hub-4/*": ["src/hub-4-opera/*"],
  "@hub-5/*": ["src/hub-5-tenet/*"],
  "@njz/types": ["../../packages/@njz/types/src/index.ts"],
  "@njz/ui": ["../../packages/@njz/ui/src/index.ts"],
  "@sator/types": ["../../packages/shared/types"],
  "@sator/services": ["../../packages/shared/services/help"]
}
```

---

## 🔧 Build and Development Commands

### Root Level (Monorepo)

```bash
# Install all dependencies
pnpm install

# Build all workspaces
pnpm run build

# Type check all TypeScript packages
pnpm run typecheck

# Development servers
pnpm run dev:web               # Vite dev server (port 5173)
pnpm run dev:api               # FastAPI dev server (port 8000)

# Docker services
pnpm run docker:up             # Start PostgreSQL + Redis
pnpm run docker:down           # Stop services
pnpm run docker:reset          # Stop + remove volumes

# Testing
pnpm run test:unit             # Web unit tests (Vitest)
pnpm run test:e2e              # Playwright E2E tests
pnpm run test:firewall         # Data partition security tests
pnpm run validate:schema       # Stats schema validation
pnpm run test:smoke            # Smoke tests

# Database migrations
pnpm run db:migrate            # Run Alembic migrations
pnpm run db:generate           # Generate new migration

# Setup
pnpm run setup                 # Initial setup (PowerShell)
pnpm run setup:reset           # Reset database
```

### NJZiteGeisTe Platform (apps/web/)

```bash
cd apps/web

# Development
pnpm run dev                   # Vite dev server (port 5173)
pnpm run build                 # Production build
pnpm run preview               # Preview production build

# Code quality
pnpm run lint                  # ESLint
pnpm run typecheck             # tsc --noEmit

# Testing
pnpm run test                  # Vitest (watch mode)
pnpm run test:run              # Vitest (single run)
pnpm run test:coverage         # Vitest with coverage
npx playwright test            # E2E tests
pnpm run test:visual           # Visual regression tests

# Analysis
pnpm run build:analyze         # Build + bundle analysis
```

### API Backend (services/api/)

```bash
cd services/api

# Development
poetry install                 # Install dependencies
poetry run uvicorn main:app --reload --port 8000 --host 0.0.0.0

# Or from root
pnpm run dev:api

# Testing
poetry run pytest              # Run all tests
poetry run pytest tests/unit/ -v
poetry run pytest tests/integration/ -v
poetry run pytest --cov=src --cov-report=xml

# Code quality
poetry run black src/          # Format with Black
poetry run ruff check src/     # Lint with Ruff
poetry run mypy src/           # Type check with mypy
```

### Docker Development

```bash
# Start database and cache only
docker-compose up -d db redis

# Start full stack (API + Frontend + Archival)
docker-compose up -d

# View logs
docker-compose logs -f api
docker-compose logs -f db

# Stop services
docker-compose down

# Reset with data loss
docker-compose down -v
```

### Godot Simulation (platform/simulation-game/)

```bash
# Open in Godot Editor
godot --editor project.godot

# Run headless tests
godot --headless --script tests/run_tests.gd
```

---

## 📝 Code Style Guidelines

### Commit Messages (Conventional Commits)

```
<type>(<scope>): <description> - <context>
```

**Types:**
- `feat` — New feature
- `fix` — Bug fix
- `docs` — Documentation only
- `style` — Formatting (no code change)
- `refactor` — Code restructuring
- `test` — Adding/updating tests
- `chore` — Maintenance tasks

**Examples:**
```bash
feat(website): Add SATOR hub orbital navigation - implements 3D scene
fix(api): Resolve VLR data parsing error - handles null values
docs(readme): Update installation instructions
```

### Document Versioning

All documents MUST include version header:
```
[VerMMM.mmm]

# Document Title
```

- Increment major (MMM) for structural changes
- Increment minor (mmm) for content updates

### Code Formatting

| Language | Tool | Configuration |
|----------|------|---------------|
| Python | Black | `--line-length=100` |
| Python | Ruff | Fix enabled (`E`, `F`, `I`) |
| Python | mypy | `--ignore-missing-imports` |
| JavaScript/TypeScript | ESLint | `@typescript-eslint` |
| JavaScript/TypeScript | Prettier | Default |
| All | trailing-whitespace | Auto-fix (pre-commit) |
| All | end-of-file-fixer | Auto-fix (pre-commit) |

### TypeScript Configuration

- **Strict mode:** Enabled
- **noUnusedLocals:** Enabled (unused variables fail build)
- **noUnusedParameters:** Enabled
- **Target:** ES2020
- **Module:** ESNext

---

## 🧪 Testing Instructions

### Test Structure

```
tests/
├── e2e/                         # Playwright E2E tests
│   ├── accessibility.spec.ts
│   ├── follows.spec.ts
│   ├── mascot-cross-browser.spec.ts
│   ├── navigation.spec.ts
│   ├── player-profile.spec.ts
│   ├── search.spec.ts
│   ├── sim-rating.spec.ts
│   ├── tournament-bracket.spec.ts
│   └── websocket.spec.ts
│
├── integration/                 # Python integration tests
│   ├── conftest.py
│   ├── test_api_firewall.py
│   ├── test_auth.py
│   ├── test_database_connection.py
│   └── test_pipeline_e2e.py
│
├── unit/                        # Python unit tests
│   └── test_health.py
│
├── load/                        # Load testing
│   ├── k6-load-test.js
│   └── locustfile.py
│
└── smoke/                       # Smoke tests
    └── smoke_test.sh
```

### Running Tests

```bash
# E2E tests (Playwright)
cd apps/web
npx playwright test              # All tests
npx playwright test --ui         # With UI
npx playwright test --project=chromium  # Single browser

# Python tests
pytest tests/unit/ -v            # Unit tests
pytest tests/integration/ -v     # Integration tests
pytest tests/e2e/ -v             # E2E tests
pytest --cov=services/api/src --cov-report=xml  # With coverage

# Godot tests
cd platform/simulation-game
godot --headless --script tests/run_tests.gd

# Load testing
locust -f tests/load/locustfile.py
```

### Pre-commit Testing

The following checks run automatically on commit:
1. Trailing whitespace removal
2. End of file fixing
3. YAML/JSON validation
4. Large file check (max 1000KB)
5. Black formatting (Python)
6. Ruff linting (Python)
7. mypy type checking (Python)
8. ESLint (JavaScript/TypeScript)
9. Prettier formatting
10. detect-secrets (security)

Install hooks: `pre-commit install`

---

## 🚀 Deployment

### Platforms

| Platform | Use Case | Config File |
|----------|----------|-------------|
| **Vercel** | Frontend hosting | `vercel.json` |
| **Render** | API backend | `render.yaml` |
| **Supabase** | PostgreSQL | Dashboard config |
| **Upstash** | Redis | Dashboard config |

### Environment Variables

**Vercel (Frontend):**
```bash
VITE_API_URL=http://localhost:8000    # Backend API endpoint
VITE_WS_URL=ws://localhost:8000/ws    # WebSocket endpoint
VITE_APP_ENV=development              # Environment
VITE_SENTRY_DSN=                      # Sentry DSN (optional)
```

**Render/Local (Backend):**
```bash
DATABASE_URL=postgresql://...         # PostgreSQL connection
REDIS_URL=redis://...                 # Redis connection
JWT_SECRET_KEY=...                    # 32+ char random (openssl rand -base64 32)
TOTP_ENCRYPTION_KEY=...               # 32+ char random
PANDASCORE_API_KEY=pc_live_...        # Pandascore API key
APP_ENVIRONMENT=development           # Environment
```

### Deployment Commands

```bash
# Vercel (manual)
cd apps/web
vercel --prod

# Render (via blueprint)
# Push to main triggers auto-deploy via render.yaml
```

---

## 🔐 Security Considerations

### Data Partition Firewall

**CRITICAL:** Game simulation data and web platform data are strictly separated.

- `GAME_ONLY_FIELDS` — Fields only available in game simulation:
  - `internalAgentState`
  - `radarData`
  - `detailedReplayFrameData`
  - `simulationTick`
  - `seedValue`
  - `visionConeData`
  - `smokeTickData`
  - `recoilPattern`

- `WEB_ONLY_FIELDS` — Fields only available in web platform
- `SHARED_FIELDS` — Common fields allowed in both

**Firewall Library:** `@sator/data-partition-lib`

```typescript
// Example: Enforcing data partition
import { sanitizeForWeb } from '@sator/data-partition-lib';

const webSafeData = sanitizeForWeb(gameData);
```

### Environment Variables

Sensitive configuration (NEVER commit):
```bash
# API Keys
PANDASCORE_API_KEY=pc_live_xxxxxxxx
RIOT_API_KEY=RGAPI-xxxxxxxx
JWT_SECRET_KEY=generate_with_openssl_rand_base64_32
TOTP_ENCRYPTION_KEY=generate_with_openssl_rand_base64_32

# Database (Supabase)
DATABASE_URL=postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres

# Redis (Upstash)
REDIS_URL=rediss://default:[password]@[host]:6379
```

### Security Headers (Vercel)

Configured in `vercel.json`:
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### Secrets Detection

Pre-commit hook `detect-secrets` scans for:
- API keys
- Passwords
- Tokens
- Private keys

Baseline stored in `.secrets.baseline`.

---

## 🤖 AI Agent Coordination

### Required Reading Before Any Task

All agents MUST read in order:
1. `MASTER_PLAN.md` — Current phase, ecosystem scope, phase gates
2. `.agents/AGENT_CONTRACT.md` — Domain boundaries, prohibited actions, TENET terminology
3. `.agents/PHASE_GATES.md` — Which phases are unlocked (check before starting phase work)
4. `.agents/SCHEMA_REGISTRY.md` — All canonical types (prevents duplicate type definitions)

### Coordination System Files

| File | Purpose |
|------|---------|
| `.agents/AGENT_CONTRACT.md` | Behavioral contract — binds all agents |
| `.agents/PHASE_GATES.md` | Go/No-Go criteria per phase |
| `.agents/SCHEMA_REGISTRY.md` | Registry of all canonical types |
| `.agents/CODEOWNER_CHECKLIST.md` | Ownership and approval tracking |

### Domain Boundaries

Every agent must identify its domain before starting work:

| Domain | Primary Files | Agent Role |
|--------|--------------|------------|
| `schema` | `data/schemas/`, `packages/@njz/types/` | Define only. No component code. |
| `frontend` | `apps/web/src/`, `packages/@njz/ui/` | Components, hooks, routes, styles |
| `backend` | `services/api/`, `packages/shared/api/` | Routers, models, services, migrations |
| `pipeline` | `packages/shared/axiom-esports-data/`, `services/legacy-compiler/` | ETL, scrapers, data sync |
| `infra` | `infra/`, `.github/workflows/`, `docker-compose*.yml` | CI/CD, containers, deployment |
| `docs` | `docs/`, `AGENTS.md`, `CLAUDE.md`, `MASTER_PLAN.md` | Documentation only |
| `test` | `tests/`, `*.spec.ts`, `*.spec.py` | Tests only |

### Agent Skills

Project-specific skills in `.agents/skills/`:
- `sator-project` — Project orchestration
- `sator-fastapi-backend` — FastAPI development
- `sator-react-frontend` — React frontend
- `sator-python-pipeline` — Data pipelines
- `sator-analytics` — Analytics calculations
- `sator-deployment` — Deployment automation
- `sator-godot-dev` — Godot game development
- `sator-simulation` — Simulation mechanics
- `sator-extraction` — Web scraping (VLR.gg, Liquidpedia)
- `sator-sator-square` — D3.js/WebGL visualization
- `sator-data-firewall` — Data partition firewall

---

## 📚 Key Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| README | `README.md` | Project overview |
| This File | `AGENTS.md` | Agent coordination |
| Agent Contract | `.agents/AGENT_CONTRACT.md` | Behavioral rules |
| Phase Gates | `.agents/PHASE_GATES.md` | Phase unlock criteria |
| Schema Registry | `.agents/SCHEMA_REGISTRY.md` | Type registry |
| Master Plan | `MASTER_PLAN.md` | Full project plan |
| Claude Guide | `CLAUDE.md` | Claude-specific guidance |
| API Docs | `docs/API_V1_DOCUMENTATION.md` | Complete API reference |
| Architecture | `docs/architecture/TENET_TOPOLOGY.md` | System design |
| Deployment | `docs/DEPLOYMENT_GUIDE.md` | Deployment instructions |

---

## ⚠️ Important Notes for Agents

1. **Version All Documents:** Use `[VerMMM.mmm]` format at the top
2. **Conventional Commits:** Follow `type(scope): description - context` format
3. **Data Partition:** Never expose game-only fields to web platform
4. **No Secrets:** Never commit credentials; use environment variables
5. **Test Changes:** Run appropriate tests before committing
6. **TENET Is Not a Hub:** `hub-5-tenet/` is the TeNET navigation layer. Do not add content features to it.
7. **Schema First:** Check `.agents/SCHEMA_REGISTRY.md` before creating any new type
8. **Phase Gates:** Check `.agents/PHASE_GATES.md` before starting any phase work
9. **Agent Contract:** Read `.agents/AGENT_CONTRACT.md` before starting any task
10. **Skills Available:** Use `.agents/skills/` for domain-specific guidance
11. **API v1:** All new API work should use `/v1/` prefix
12. **Pre-commit:** Install hooks with `pre-commit install`
13. **Root Cleanliness:** Do not create `.md` files at the repo root. Reports go in `docs/reports/`, architecture in `docs/architecture/`, archives in `docs/archive/`.
14. **Session Lifecycle:** Complete 5-stage lifecycle (Cleanup → Orient → Plan → Work → Close) before writing code.

---

## 🔗 Quick References

### VS Code Settings

Configured in `.vscode/settings.json`:
- Tab size: 2 spaces
- Python formatter: Black
- TypeScript: Path mapping enabled
- File associations: `*.gd` → GDScript

### CI/CD Workflows

- `.github/workflows/ci.yml` — Python/TypeScript tests, linting, security, Lighthouse
- `.github/workflows/playwright.yml` — E2E test runner
- `.github/workflows/deploy.yml` — Deployment automation
- `.github/workflows/health-check.yml` — Health check cron (every 30 min)
- `.github/workflows/security.yml` — Security scanning

### API Endpoints (v1)

- `/v1/players/*` — Player management
- `/v1/teams/*` — Team management
- `/v1/matches/*` — Match data
- `/v1/simrating/*` — SimRating calculations
- `/v1/forum/*` — Forum posts and comments
- `/v1/search/*` — Full-text search
- `/v1/admin/*` — Admin operations
- `/v1/webhooks/pandascore` — Pandascore webhook
- `/ws` — WebSocket real-time
- `/health` — Health check
- `/ready` — Readiness check
- `/metrics` — Prometheus metrics

### Ports (Development)

| Service | URL |
|---------|-----|
| Web | http://localhost:5173 |
| API | http://localhost:8000 |
| API Docs | http://localhost:8000/docs |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### Database Migrations

Located in `infra/migrations/versions/`:
- `001_initial_schema.py` — Initial schema (Player, Team, Match)
- `002_player_stats.py` — Player statistics
- `003_sim_calculations.py` — SimRating audit trail
- `004_auth_users_oauth_accounts.py` — OAuth authentication
- `005_forum_schema.py` — Forum tables

---

*This file is maintained for AI coding agents. Update when project structure or conventions change.*
