[Ver003.000]

# AGENTS.md — Libre-X-eSport 4NJZ4 TENET Platform

**Purpose:** This file provides essential context for AI coding agents working on the Libre-X-eSport 4NJZ4 TENET Platform project.  
**Project:** Libre-X-eSport 4NJZ4 TENET Platform (formerly SATOR-eXe-ROTAS / NJZ Platform / RadiantX)  
**Repository:** https://github.com/notbleaux/eSports-EXE  
**Last Updated:** 2026-03-15

---

## 📋 Project Overview

Libre-X-eSport 4NJZ4 TENET Platform is an esports simulation and analytics platform focused on tactical FPS games (Valorant with planned Counter-Strike support). The platform provides:

- **SATOR Analytics:** Advanced player metrics (SimRating, RAR) with confidence weighting
- **eXe Directory:** Service registry and coordination hub
- **ROTAS Simulation:** Deterministic tactical FPS match simulation (Godot 4)
- **4NJZ4 TENET Platform:** 4-hub web interface (SATOR, ROTAS, AREPO, OPERA) + Central Hub
- **Pandascore Integration:** Official API for legal esports data access

### Key Components

| Component | Location | Technology | Status |
|-----------|----------|------------|--------|
| **4NJZ4 TENET Platform** | `apps/website-v2/` | React 18, Vite, Tailwind | ✅ Active v2.1 |
| **API Backend** | `packages/shared/axiom-esports-data/api/` | FastAPI, Python 3.11+ | ✅ Active v2.1 |
| **Original Website** | `apps/website/` | HTML/CSS/JS Static | 🟡 Legacy |
| **Simulation Game** | `platform/simulation-game/` | Godot 4, GDScript, C# | 🟡 Paused |
| **Data Pipeline** | `packages/shared/axiom-esports-data/` | Python, PostgreSQL | ✅ Active |
| **eXe Directory** | `services/exe-directory/` | TBD | 🔵 Planned |
| **VCT Data** | `apps/VCT Valorant eSports/` | Python, FastAPI | ✅ Active |

### Version Information

- **Current Version:** 2.1.0
- **API Version:** v1 (stable)
- **WebSocket Protocol:** v1 (unified endpoint)
- **Last Major Update:** Phase 4.4 (Documentation)

---

## 🏗️ Architecture

### Monorepo Structure (npm workspaces)

```
/
├── apps/                          # Applications
│   ├── website/                  # Static legacy website
│   ├── website-v2/               # 4NJZ4 TENET Platform (React + Vite)
│   └── VCT Valorant eSports/     # VCT data project
│
├── packages/                      # Shared packages
│   └── shared/                   # Shared libraries
│       ├── api/                  # FastAPI REST components
│       ├── axiom-esports-data/   # Complete data pipeline
│       ├── apps/                 # sator-web, radiantx-game
│       └── packages/             # @sator/data-partition-lib, @sator/stats-schema
│
├── platform/                      # Simulation platform
│   └── simulation-game/          # Godot 4 project
│
├── services/                      # Backend services
│   └── exe-directory/            # Service registry (planned)
│
├── tests/                         # Test suites
│   ├── e2e/                      # Playwright E2E (95+ tests)
│   ├── integration/              # Python integration (35+ tests)
│   ├── unit/godot/               # Godot unit tests (70+ tests)
│   └── load/                     # Load testing (Locust)
│
├── docs/                          # Documentation
│   ├── API_V1_DOCUMENTATION.md   # API reference
│   ├── ARCHITECTURE_V2.md        # System architecture
│   ├── CHANGELOG_MASTER.md       # All changes from Phases 1-4
│   ├── MIGRATION_GUIDE.md        # Migration from v2.0
│   ├── DEPLOYMENT_GUIDE.md       # Deployment instructions
│   ├── MONITORING_GUIDE.md       # Monitoring & alerting
│   └── TROUBLESHOOTING_GUIDE.md  # Troubleshooting
│
├── infrastructure/                # Deployment configs
│   ├── render.yaml               # Render deployment
│   └── scripts/                  # Deployment scripts
│
├── .job-board/                   # AI agent coordination system
├── .agents/skills/               # Project-specific AI skills
└── .github/workflows/            # CI/CD pipelines
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React, Vite, Tailwind CSS | React 18, Vite 5 |
| **3D/Visualization** | Three.js, React Three Fiber, D3.js | Three 0.158 |
| **Animation** | Framer Motion, GSAP | Framer Motion 10, GSAP 3.12 |
| **State Management** | Zustand, TanStack Query | 4.4+, 5.90+ |
| **Virtualization** | @tanstack/react-virtual | 3.13.22 |
| **ML** | TensorFlow.js, ONNX Runtime | 4.22.0, 1.20.1 |
| **Backend API** | FastAPI (Python) | 3.11+ |
| **Database** | PostgreSQL + TimescaleDB | 15+ |
| **Cache** | Redis | 7+ |
| **Game Engine** | Godot 4 | 4.2+ |
| **Game Languages** | GDScript, C# | .NET 6+ |
| **Testing** | Playwright, Vitest, GUT | Latest |
| **Package Manager** | npm (workspaces) | Node 18+ |
| **CI/CD** | GitHub Actions | — |

---

## 🔧 Build and Development Commands

### Root Level (Monorepo)

```bash
# Install all dependencies
npm install

# Build all workspaces
npm run build

# Type check all TypeScript packages
npm run typecheck

# Test data partition firewall
npm run test:firewall

# Validate stats schema
npm run validate:schema
```

### Website-V2 (4NJZ4 TENET Platform)

```bash
cd apps/website-v2

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint

# Type check
npm run typecheck

# Unit tests
npm run test

# E2E tests
npx playwright test
```

### Data Pipeline (Python)

```bash
cd packages/shared

# Install Python dependencies
pip install -r requirements.txt

# Run API
uvicorn axiom-esports-data.api.main:app --reload

# Run tests
pytest

# With coverage
pytest --cov=packages/shared/ --cov-report=xml
```

### Godot Simulation

```bash
# Open in Godot Editor
godot --editor platform/simulation-game/project.godot

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

**AI Agent Coordination Prefix:**
- Use `[JLB]` prefix for Job Listing Board coordination commits
- Use `[JLB-FOREMAN]` for foreman actions

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

---

## 🧪 Testing Instructions

### Test Structure

```
tests/
├── e2e/                         # Playwright E2E tests (95+)
│   ├── hub-navigation.spec.ts
│   ├── search.spec.ts
│   ├── realtime.spec.ts
│   ├── auth.spec.ts
│   ├── errors.spec.ts
│   ├── mobile.spec.ts
│   ├── accessibility.spec.ts
│   ├── visualization.spec.ts
│   ├── ml-prediction.spec.ts
│   ├── export.spec.ts
│   ├── critical-path.spec.ts
│   └── health.spec.ts
│
├── integration/                 # Python integration tests (35+)
│   ├── conftest.py
│   ├── test_api_endpoints.py
│   ├── test_user_flows.py
│   ├── test_api_firewall.py
│   ├── test_cold_start_resilience.py
│   ├── test_database_connection.py
│   ├── test_dedup_redundancy.py
│   └── test_pipeline_e2e.py
│
├── unit/godot/                  # Godot unit tests (70+)
│   ├── test_combat_resolver.gd
│   ├── test_duel_resolver.gd
│   ├── test_economy_simulation.gd
│   ├── test_player_movement.gd
│   ├── test_weapon_mechanics.gd
│   └── test_round_management.gd
│
└── load/                        # Load testing
    └── locustfile.py
```

### Running Tests

```bash
# E2E tests
cd apps/website-v2
npx playwright test

# Python integration tests
pytest tests/integration/ -v

# Python E2E tests
pytest tests/e2e/ -v

# Godot tests
cd platform/simulation-game
godot --headless --script tests/run_tests.gd

# Firewall tests
npm run test:firewall

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

## 🛡️ Error Boundary Strategy (website-v2)

### Hierarchy

Error boundaries are implemented in a hierarchical pattern:

```
AppErrorBoundary (Top-level)
├── HubErrorBoundary (Hub-level)
│   ├── DataErrorBoundary (API/Data errors)
│   ├── MLInferenceErrorBoundary (ML errors)
│   ├── StreamingErrorBoundary (WebSocket errors)
│   └── PanelErrorBoundary (Component-level)
```

### Error Boundary Types

| Boundary | Location | Purpose | Recovery |
|----------|----------|---------|----------|
| `AppErrorBoundary` | `components/error/` | Top-level, catches all | Full reload, navigate home |
| `HubErrorBoundary` | `components/error/` | Hub-specific theming | Reset hub, switch hubs |
| `DataErrorBoundary` | `components/error/` | API/data fetching errors | Exponential backoff retry |
| `MLInferenceErrorBoundary` | `components/error/` | ML model/prediction errors | Retry model, cached preds |
| `StreamingErrorBoundary` | `components/error/` | WebSocket/streaming errors | Auto-reconnect |
| `PanelErrorBoundary` | `components/grid/` | Grid panel errors | Panel reload, close |

### Hub Configuration

Each hub has at least 2 levels of error boundaries:

- **SATOR**: HubErrorBoundary → MLInferenceErrorBoundary → PanelErrorBoundary
- **ROTAS**: HubErrorBoundary → MLInferenceErrorBoundary → StreamingErrorBoundary → PanelErrorBoundary  
- **AREPO**: HubErrorBoundary → DataErrorBoundary → PanelErrorBoundary
- **OPERA**: HubErrorBoundary → DataErrorBoundary → PanelErrorBoundary + MapVisualizationErrorBoundary
- **TENET**: HubErrorBoundary → PanelErrorBoundary

### Error Logging

All boundaries use centralized logger:
```typescript
import { logger } from '@/utils/logger'

logger.error('[Component] Error:', error)
```

### UI Consistency

- Use `HubErrorFallback` for consistent theming
- GlassCard styling with hub-specific colors
- Retry functionality in all boundaries
- Technical details only in development

---

## 🚀 Deployment

### Platforms

| Platform | Use Case | Config File |
|----------|----------|-------------|
| **Vercel** | Frontend hosting | `vercel.json` |
| **Render** | Full-stack apps | `infrastructure/render.yaml` |
| **GitHub Pages** | Static sites | `.github/workflows/static.yml` |
| **Supabase** | PostgreSQL | Dashboard config |
| **Upstash** | Redis | Dashboard config |

### Environment Variables by Platform

**Vercel:**
- `VITE_API_URL` — Backend API endpoint (include `/v1`)
- `VITE_WS_URL` — WebSocket endpoint

**Render:**
- `DATABASE_URL` — PostgreSQL connection (use pooler port 6543)
- `REDIS_URL` — Redis connection (TLS)
- `PANDASCORE_API_KEY` — Pandascore API key
- `APP_ENVIRONMENT` — production/development

### Deployment Commands

```bash
# Vercel (manual)
vercel --prod

# Render (via blueprint)
# Push to main triggers auto-deploy
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
# .env.example
databases:
  DATABASE_URL=postgresql://user:pass@localhost/sator
  REDIS_URL=redis://localhost:6379
  
api_keys:
  GITHUB_TOKEN=ghp_xxxxxxxxxxxx
  VLR_API_KEY=your_api_key_here
  PANDASCORE_API_KEY=pc_live_xxxxxxxx
```

### Security Headers (Vercel)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy` (configured in vercel.json)

### Secrets Detection

Pre-commit hook `detect-secrets` scans for:
- API keys
- Passwords
- Tokens
- Private keys

Baseline stored in `.secrets.baseline`.

---

## 🤖 AI Agent Coordination (Job Listing Board)

### Framework Location

- **Main:** `.job-board/README.md`
- **Framework:** `memory/JOB_LISTING_BOARD_FRAMEWORK.md`

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `00_INBOX/{agent-id}/` | Your incoming tasks |
| `01_LISTINGS/ACTIVE/` | Available tasks |
| `02_CLAIMED/{agent-id}/` | Your claimed tasks |
| `03_COMPLETED/` | Finished tasks |
| `04_BLOCKS/` | Obstacles and solutions |
| `05_TEMPLATES/` | Task templates |

### Foreman Schedule

- Activates at **:00** and **:30** (30-minute blocks)
- Maximum **1 foreman** active at any time
- Privileges **expire after exactly 30 minutes**

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
- `sator-extraction` — Web scraping (VLR.gg)
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
| Changelog | `docs/CHANGELOG_MASTER.md` | All changes from Phases 1-4 |
| Migration | `docs/MIGRATION_GUIDE.md` | Upgrading from v2.0 |
| Deployment | `docs/DEPLOYMENT_GUIDE.md` | Deployment instructions |
| Monitoring | `docs/MONITORING_GUIDE.md` | Monitoring & alerting |
| Troubleshooting | `docs/TROUBLESHOOTING_GUIDE.md` | Troubleshooting guide |
| Contributing | `CONTRIBUTING.md` | Contribution guidelines |
| Tech Stack | `docs/SATOR-TECH-STACK.md` | Technology assessment |
| Guides | `docs/guides/` | User guides |

---

## 🆕 New in v2.1 (Phase 4.4)

### API Changes
- New `/v1/` prefix for all API endpoints
- Unified WebSocket endpoint (`/v1/ws`)
- Full-text search API with fuzzy matching
- Pandascore integration for legal data

### New Components
- DataErrorBoundary for API errors
- HubErrorBoundary for hub-specific handling
- Virtual scrolling with @tanstack/react-virtual
- React Scheduler for priority-based updates

### New Dependencies
```json
{
  "@tanstack/react-virtual": "^3.13.22",
  "scheduler": "^0.21.0",
  "ws": "^8.14.0"
}
```

### Testing
- 200+ tests across E2E, integration, and unit
- Playwright E2E test suite (95+ tests)
- Godot GUT test framework (70+ tests)
- Fixed CI/CD test execution

---

## ⚠️ Important Notes for Agents

1. **Version All Documents:** Use `[VerMMM.mmm]` format
2. **Conventional Commits:** Follow `type(scope): description - context` format
3. **Data Partition:** Never expose game-only fields to web platform
4. **No Secrets:** Never commit credentials; use environment variables
5. **Test Changes:** Run appropriate tests before committing
6. **Job Board:** Check `.job-board/` for task coordination
7. **Skills Available:** Use `.agents/skills/` for domain-specific guidance
8. **API v1:** All new API work should use `/v1/` prefix
9. **Error Boundaries:** Use 2+ level hierarchy for all hubs
10. **Documentation:** Update relevant docs when making changes

---

## 🔗 Quick References

### VS Code Settings
- Tab size: 2 spaces
- Python formatter: Black
- TypeScript: Relative imports
- File associations: `*.gd` → GDScript

### CI/CD Workflows
- `ci.yml` — Python/TypeScript/Godot tests, linting
- `deploy.yml` — GitHub Pages deployment
- `security.yml` — Security scanning
- `static.yml` — Static site deployment
- `keepalive.yml` — Cold start mitigation

### Database Migrations (axiom-esports-data)
1. `001_initial_schema.sql`
2. `002_sator_layers.sql`
3. `003_dual_storage.sql` (Twin-table implementation)
4. `004_extraction_log.sql`
5. `005_staging_system.sql`
6. `006_performance_indexes.sql`

### API Endpoints (v1)
- `/v1/players/*` — Player management
- `/v1/matches/*` — Match data
- `/v1/analytics/*` — Analytics and rankings
- `/v1/search/*` — Full-text search
- `/v1/ws` — WebSocket real-time
- `/health` — Health check
- `/ready` — Readiness check
- `/metrics` — Prometheus metrics

---

*This file is maintained for AI coding agents. Update when project structure or conventions change.*
