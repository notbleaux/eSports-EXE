# AGENTS.md — NJZiteGeisTe Platform

**Purpose:** This file provides essential context for AI coding agents working on the NJZiteGeisTe Platform project.
**Project:** NJZiteGeisTe Platform (formerly SATOR-eXe-ROTAS / NJZ Platform / RadiantX)
**Repository:** https://github.com/notbleaux/eSports-EXE  
**Last Updated:** 2026-03-26 (Phase 10 initiated)

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
| **API Backend** | `packages/shared/api/` | FastAPI, Python 3.11+ | ✅ Active |
| **Data Pipeline** | `packages/shared/axiom-esports-data/` | Python, PostgreSQL, asyncpg | ✅ Active |
| **Simulation Game** | `platform/simulation-game/` | Godot 4, GDScript, C# | 🟡 Paused |
| **VCT Data** | `apps/VCT Valorant eSports/` | Python, FastAPI | ✅ Active |

### Version Information

- **Current Version:** 2.1.0
- **API Version:** v1
- **WebSocket Protocol:** v1
- **Last Updated:** March 2026

---

## Current Phase

**Phase 3: Tooling Modernisation** — COMPLETE
- pnpm migration complete (pnpm-workspace.yaml + pnpm-lock.yaml)
- Poetry pyproject.toml in place (packages/shared/api/)
- Vercel config corrected (SPA routing + pnpm install)
- packages/shared/apps/sator-web/ removed

**Phase 4: Data Layer** — COMPLETE
  ✓ SQLAlchemy models (Player, Team, Match)
  ✓ Alembic migrations (001_initial_schema)
  ✓ FastAPI routers (/v1/players, /v1/teams, /v1/matches, /v1/simrating)
  ✓ TanStack Query hooks (usePlayers, useTeams, useMatches, useSimRating)
  ✓ Redis caching layer (cache.py)
  ✓ WebSocket live match feed (/ws/matches/live)
  ✓ Player + Team profile pages (/player/:slug, /team/:slug)
  ✓ ROTAS leaderboard connected to SimRating API
  ✓ Vite production build passing (4.32s, 675 kB JS)
  ✓ E2E routes synced (124 updates across 23 test files)

**Phase 5: SimRating ML + Live Data** — IN PROGRESS
  ✓ player_stats table (migration 002_player_stats)
  ✓ PlayerStats SQLAlchemy model (services/api/src/njz_api/models/player_stats.py)
  ✓ PandaScore stats fetcher (pandascore.py + sync_pandascore.py — teams, players, matches, stats)
  ✓ SimRating v2 (real K/D/A + ACS + headshot% formula with v1 fallback)
  ✓ PandaScore webhook receiver (/v1/webhooks/pandascore — HMAC verified)
  ✓ WebSocket live match broadcasting (ws_matches.py + webhook wired via push_match_event)
  ✓ sim_calculations audit table (migration 003, SimCalculation model)
  ✓ AREPO hub refactored as Cross-Reference Engine
  ✓ Player profile page — real SimRating v2 score + component stats
  ✓ Team profile page — real roster + recent matches
  ✓ ROTAS leaderboard — v2 scores, grade badges (S/A/B/C/D/F), source tags, game filter
  ✓ PWA manifest + service worker (sw.ts v3, manifest.json)
  ✓ Vite bundle: gsap chunk added, chunkSizeWarningLimit → 500
  ✓ Performance targets documented (docs/PERFORMANCE_TARGETS.md)
  ✓ /v1/admin/sync endpoint for manual stats refresh

**Phase 6** — COMPLETE (agents 81-88)

**Phase 7: Bracket, Mobile, CI, Auth, Compare, Errors, Health** — IN PROGRESS
  ✓ OPERA tournament bracket (TournamentBracket.tsx, 8-team single-elim, useTournamentData.ts)
  ✓ Mobile responsive audit (HubGridV2 overflow, ROTAS table scroll, LandingPage hamburger nav, docs/MOBILE_AUDIT.md)
  ✓ Lighthouse CI (.lighthouserc.json, ci.yml lighthouse job, docs/PERFORMANCE_TARGETS.md v2)
  ✓ OAuth Google/Discord (packages/shared/api/routers/oauth.py, useAuth.ts hook, .env.example)
  ✓ SATOR PlayerCompare + TopPerformers (3-player compare panel, top-5 by game)
  ✓ Error boundaries + 404 (NotFoundPage.tsx, HubRoute wrapper in App.tsx with AppErrorBoundary)
  ✓ Health check cron (.github/workflows/health-check.yml — every 30 min)
  ✓ Sentry integration (shared/lib/sentry.ts, main.jsx initSentry(), HubErrorBoundary captureException, API sentry_sdk.init)

**Phase 8: ML Training + Community + Quality** — COMPLETE (agents 97-104)
  ✓ OAuth full token exchange (routers/oauth.py — httpx exchange, user upsert, JWT issuance, frontend redirect)
  ✓ SimRating ML training script (services/api/src/njz_api/ml/train_simrating.py) + TFJS loadTrainedModel()
  ✓ Player follow system (useFollows, FollowButton, FollowedFeed) in AREPO hub
  ✓ Playwright E2E: follows.spec.ts, error-boundaries.spec.ts, tournament-bracket.spec.ts
  ✓ CDN caching headers (vercel.json) + API Cache-Control on GET /v1/players
  ✓ GameWorldPage (/valorant, /cs2 tezet grid) replacing placeholder
  ✓ ROTAS raw stats tab (usePlayerStats hook + GET /v1/players/stats endpoint)
  ✓ Pre-deploy smoke test (tests/smoke/smoke_test.sh)
  ✓ PRE_DEPLOY_CHECKLIST.md + CACHING_STRATEGY.md + PHASE8_COMPLETE.md

## Status: DEPLOYMENT READY
All phases 1-8 complete. See docs/PRE_DEPLOY_CHECKLIST.md.

**Phase 9: Post-Launch Features** — IN PROGRESS
  ✓ usePlayerStats URL bug fixed (apiFetch normalization — was double /v1/v1/players/stats)
  ✓ Unified search API (GET /v1/search/) + useSearch hook
  ✓ OAuth CSRF state validation fixed (secrets.token_urlsafe nonce)
  ✓ OAuth GitHub provider added (GITHUB_CLIENT_ID/SECRET env vars)
  ✓ Auth DB migration (004_auth_users_oauth_accounts.py — tables were missing)
  ✓ ML pipeline audit: initMLBackend() now called in SATOR hub on mount
  ✓ Forum API (/v1/forum/posts, comments, flag) + useForumPosts hook
  ✓ Position-based SimRating (position_simrating.py + GET /v1/simrating/position)
  ✓ eSports calendar component (EsportsCalendar.tsx in OPERA hub)
  ✓ Push notifications (pushNotifications.ts + sw.ts push/notificationclick handlers)
  ✓ PostgreSQL version corrected: docker-compose.yml 14 → 15
  ✓ test_api_firewall.py UTF-16 corruption fixed
  ✓ E2E test coverage: 59 static tests + 5 new feature specs

**Phase 10: Hardening, Security, Accessibility** — IN PROGRESS (2026-03-26)
  ✓ Forum migrated to PostgreSQL (migration 005, ForumPost/Comment/Flag ORM models, JWT auth on writes)
  ✓ FantasyDataFilter recursive filtering — deepSanitize + deepValidate at all nesting depths + test suite
  ✓ players.py GROUP BY bug fixed, count query optimised, silent ImportError → 503
  ✓ players.py hasattr fragility removed — Player.name used consistently
  ✓ oauth.py GitHub Accept: application/json header added to token exchange
  ✓ oauth.py JWT moved from URL param to HttpOnly SameSite=Lax cookie
  ✓ oauth.py DB upsert failure now logs at ERROR level with provider:id context
  ✓ simrating-model.ts fallback uses weighted normalised average (0-100 scale, was raw sum)
  ✓ simrating-model.ts input normalization applied before tensor creation (kd 0.3-3.5, acs 30-500)
  ✓ playwright.config.ts testDir fixed: ../../tests/e2e (was ./e2e — all tests missing from CI)
  ✓ mascot-cross-browser.spec.ts vacuous expect(true).toBe(true) replaced with real assertions
  ✓ follows.spec.ts rewritten to test FollowButton component interaction
  ✓ E2E specs added: sim-rating, player-profile, search, admin, mobile-responsive, accessibility
  ✓ Admin API extended: /admin/users, /admin/flags, /admin/flags/:id, /admin/posts/:id, /admin/ml/train, /admin/ml/status
  ✓ Data export API: GET /v1/export/players|matches|simratings (CSV + NDJSON streaming, auth required)
  ✓ cache_warmup.py: leaderboard pre-population at startup for all games × 10 pages
  ✓ AGENTS.md stale gap corrected: scheduled_at already exists in Match model + migration 001

  ✓ Admin import endpoint: POST /v1/admin/import/players (bulk upsert up to 500 rows, admin-only)
  ✓ @axe-core/playwright added to apps/web/package.json devDependencies (accessibility tests now active)
  ✓ FollowedFeed (AREPO) refactored from inline styles to Tailwind responsive classes
  ✓ Cache warmup wired into main.py lifespan (asyncio.create_task → warm_leaderboard_cache via AsyncSessionLocal)

## Known Gaps (Phase 10 remaining):
→ ML model training not run (2K synthetic samples, needs 50K+ real matches post-Pandascore sync)

**Phase 1: Schema Foundation** — COMPLETE (2026-03-27)
  ✓ data/schemas/GameNodeID.ts — canonical GameNodeID, WorldPort, TeZeT, QuarterGrid types
  ✓ data/schemas/tenet-protocol.ts — TeneT verification protocol, trust levels, confidence scoring, Path A/B contracts
  ✓ data/schemas/live-data.ts — WebSocket client contracts (LiveMatchView, WsMessage, LivePlayerStats)
  ✓ data/schemas/legacy-data.ts — Historical API response contracts (VerifiedMatchSummary, SimRatingEntry, PlayerSeasonStats)
  ✓ data/schemas/index.ts — barrel export
  ✓ packages/@njz/types/ — pnpm workspace package, resolves from apps/web via @njz/types alias
  ✓ No duplicate inline type definitions found in apps/web/src/ (confirmed gate 1.6)

---

## 🏗️ Architecture

### Monorepo Structure (pnpm workspaces)

```
/
├── apps/                          # Applications
│   ├── web/                      # NJZiteGeisTe Platform (React + Vite) - MAIN
│   └── VCT Valorant eSports/     # VCT data project
│
├── packages/                      # Shared packages
│   └── shared/                   # Shared libraries
│       ├── api/                  # FastAPI REST components
│       ├── axiom-esports-data/   # Complete data pipeline
│       └── packages/             # @sator/* libraries
│           ├── data-partition-lib/   # Security firewall library
│           └── stats-schema/         # Stats validation schemas
│
├── platform/                      # Simulation platform
│   └── simulation-game/          # Godot 4 project
│
├── services/                      # Backend services
│   ├── api/                      # API service placeholder (Phase 4)
│   └── exe-directory/            # Service registry (planned)
│
├── tests/                         # Test suites
│   ├── e2e/                      # Playwright E2E tests
│   ├── integration/              # Python integration tests
│   ├── unit/                     # Python unit tests
│   └── load/                     # Load testing (Locust, k6)
│
├── docs/                          # Documentation
│   ├── API_V1_DOCUMENTATION.md   # API reference
│   ├── ARCHITECTURE_V2.md        # System architecture
│   ├── CHANGELOG_MASTER.md       # All changes
│   ├── DEPLOYMENT_GUIDE.md       # Deployment instructions
│   └── TROUBLESHOOTING_GUIDE.md  # Troubleshooting
│
├── infrastructure/                # Deployment configs
│   └── render.yaml               # Render deployment
│
├── .agents/skills/               # Project-specific AI skills
└── .github/workflows/            # CI/CD pipelines
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React, Vite, Tailwind CSS | React 18, Vite 5 |
| **Language** | TypeScript | 5.9+ |
| **3D/Visualization** | Three.js, React Three Fiber, D3.js | Three 0.158 |
| **Animation** | Framer Motion, GSAP | Framer Motion 10, GSAP 3.12 |
| **State Management** | Zustand, TanStack Query | 4.4+, 5.90+ |
| **Virtualization** | @tanstack/react-virtual | 3.13.22 |
| **ML** | TensorFlow.js, ONNX Runtime | 4.22.0, 1.20.1 |
| **Backend API** | FastAPI (Python) | 3.11+ |
| **Database** | PostgreSQL (Supabase) | 15+ |
| **Cache** | Redis | 7+ |
| **Game Engine** | Godot 4 | 4.2+ |
| **Game Languages** | GDScript, C# | .NET 6+ |
| **Testing** | Playwright, Vitest, pytest, GUT | Latest |
| **Package Manager** | pnpm (workspaces) | Node 18+ |
| **CI/CD** | GitHub Actions | — |

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

# Test data partition firewall
pnpm run test:firewall

# Validate stats schema
pnpm run validate:schema
```

### NJZiteGeisTe Platform (apps/web/)

Location: `apps/web/`

```bash
# Development server
pnpm run dev

# Production build
pnpm run build

# Preview production build
pnpm run preview

# Lint
pnpm run lint

# Type check
pnpm run typecheck

# Unit tests
pnpm run test

# E2E tests
npx playwright test
```

### API Backend (FastAPI)

Location: `packages/shared/api/`

```bash
# Run API development server
uvicorn main:app --reload --port 8000 --host 0.0.0.0

# Or from root
pnpm run dev:api
```

### Data Pipeline (Python)

Location: `packages/shared/`

```bash
# Install Python dependencies
pip install -r requirements.txt

# Run tests
pytest

# With coverage
pytest --cov=packages/shared/ --cov-report=xml
```

### Docker Development

```bash
# Start database and cache services
docker-compose up -d db redis

# Start full stack (API + Frontend)
docker-compose up -d

# Stop services
docker-compose down

# Reset with data loss
docker-compose down -v
```

### Godot Simulation

Location: `platform/simulation-game/`

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
| Python | Ruff | Fix enabled |
| Python | mypy | `--ignore-missing-imports` |
| JavaScript/TypeScript | ESLint | `@typescript-eslint` |
| JavaScript/TypeScript | Prettier | Default |
| All | trailing-whitespace | Auto-fix |
| All | end-of-file-fixer | Auto-fix |

### TypeScript Path Mapping

```typescript
// tsconfig.json paths
{
  "@/*": ["src/*"],
  "@shared/*": ["src/shared/*"],
  "@hub-1/*": ["src/hub-1-sator/*"],
  "@hub-2/*": ["src/hub-2-rotas/*"],
  "@hub-3/*": ["src/hub-3-arepo/*"],
  "@hub-4/*": ["src/hub-4-opera/*"],
  "@hub-5/*": ["src/hub-5-tenet/*"]
}
```

---

## 🧪 Testing Instructions

### Test Structure

```
tests/
├── e2e/                         # Playwright E2E tests
│   ├── specmap-viewer.spec.ts
│   ├── websocket.spec.ts
│   ├── test_api_endpoints.py
│   └── test_user_flows.py
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
└── load/                        # Load testing
    ├── k6-load-test.js
    └── locustfile.py
```

### Running Tests

```bash
# E2E tests (Playwright)
cd apps/web
npx playwright test

# Python unit tests
pytest tests/unit/ -v

# Python integration tests
pytest tests/integration/ -v

# Python E2E tests
pytest tests/e2e/ -v

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

---

## 🚀 Deployment

### Platforms

| Platform | Use Case | Config File |
|----------|----------|-------------|
| **Vercel** | Frontend hosting | `vercel.json` |
| **Render** | API backend | `infrastructure/render.yaml` |
| **Supabase** | PostgreSQL | Dashboard config |
| **Upstash** | Redis | Dashboard config |

### Environment Variables by Platform

**Vercel (Frontend):**
- `VITE_API_URL` — Backend API endpoint (include `/v1`)
- `VITE_WS_URL` — WebSocket endpoint

**Render (Backend):**
- `DATABASE_URL` — PostgreSQL connection (use pooler port 6543)
- `REDIS_URL` — Redis connection (TLS)
- `PANDASCORE_API_KEY` — Pandascore API key
- `APP_ENVIRONMENT` — production/development
- `JWT_SECRET_KEY` — JWT signing key
- `TOTP_ENCRYPTION_KEY` — 2FA encryption key

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
JWT_SECRET_KEY=generate_with_openssl_rand_hex_32
TOTP_ENCRYPTION_KEY=generate_with_openssl_rand_hex_32

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

All agents must read in order:
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
| `.agents/COORDINATION_PROTOCOL.md` | Multi-agent conflict prevention (archived, for reference) |

### Agent Domain Map

| Domain | Scope |
|--------|-------|
| `schema-agent` | `data/schemas/`, `packages/@njz/types/` |
| `frontend-agent` | `apps/web/src/`, `packages/@njz/ui/` |
| `backend-agent` | `packages/shared/api/`, `services/` |
| `pipeline-agent` | `packages/shared/axiom-esports-data/`, `services/legacy-compiler/` |
| `infra-agent` | `infra/`, `.github/workflows/`, `docker-compose*.yml` |
| `docs-agent` | `docs/`, `AGENTS.md`, `CLAUDE.md`, `MASTER_PLAN.md` |
| `test-agent` | `tests/`, `*.spec.ts`, `*.spec.py` |

### Sub-Agent Orchestration (Phase 5+)

For multi-stream parallel work, use coordinator + specialist pattern:
- Coordinator reads `MASTER_PLAN.md §8` and dispatches specialists
- Each specialist operates within its declared domain
- Schema boundary is the synchronization point between domains
- Full model documented in `MASTER_PLAN.md §8`

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
| API Docs | `docs/API_V1_DOCUMENTATION.md` | Complete API reference |
| Architecture | `docs/ARCHITECTURE_V2.md` | System design |
| Changelog | `docs/CHANGELOG_MASTER.md` | All changes |
| Deployment | `docs/DEPLOYMENT_GUIDE.md` | Deployment instructions |
| Troubleshooting | `docs/TROUBLESHOOTING_GUIDE.md` | Troubleshooting guide |
| Contributing | `CONTRIBUTING.md` | Contribution guidelines |

---

## ⚠️ Important Notes for Agents

1. **Version All Documents:** Use `[VerMMM.mmm]` format at the top
2. **Conventional Commits:** Follow `type(scope): description - context` format
3. **Data Partition:** Never expose game-only fields to web platform
4. **No Secrets:** Never commit credentials; use environment variables
5. **Test Changes:** Run appropriate tests before committing
6. **TENET Is Not a Hub:** `hub-5-tenet/` is the TeNET navigation layer. Do not add content features to it. See `docs/architecture/TENET_TOPOLOGY.md`.
7. **Schema First:** Check `.agents/SCHEMA_REGISTRY.md` before creating any new type
8. **Phase Gates:** Check `.agents/PHASE_GATES.md` before starting any phase work
9. **Agent Contract:** Read `.agents/AGENT_CONTRACT.md` before starting any task
10. **Skills Available:** Use `.agents/skills/` for domain-specific guidance
11. **API v1:** All new API work should use `/v1/` prefix
12. **Pre-commit:** Install hooks with `pre-commit install`
13. **Root Cleanliness:** Do not create `.md` files at the repo root. Reports go in `docs/reports/`, architecture in `docs/architecture/`, archives in `docs/archive/`.

---

## 🔗 Quick References

### VS Code Settings

Configured in `.vscode/settings.json`:
- Tab size: 2 spaces
- Python formatter: Black
- TypeScript: Path mapping enabled
- File associations: `*.gd` → GDScript

### CI/CD Workflows

- `.github/workflows/ci.yml` — Python/TypeScript tests, linting, security
- `.github/workflows/deploy.yml` — Deployment automation
- `.github/workflows/static.yml` — Static site deployment

### API Endpoints (v1)

- `/v1/players/*` — Player management
- `/v1/matches/*` — Match data
- `/v1/analytics/*` — Analytics and rankings
- `/v1/search/*` — Full-text search
- `/v1/ws` — WebSocket real-time
- `/health` — Health check
- `/ready` — Readiness check
- `/metrics` — Prometheus metrics

### Ports (Development)

- Web: http://localhost:5173
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

*This file is maintained for AI coding agents. Update when project structure or conventions change.*
