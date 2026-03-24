# AGENTS.md — Libre-X-eSport 4NJZ4 TENET Platform

**Purpose:** This file provides essential context for AI coding agents working on the Libre-X-eSport 4NJZ4 TENET Platform project.  
**Project:** Libre-X-eSport 4NJZ4 TENET Platform (formerly SATOR-eXe-ROTAS / NJZ Platform / RadiantX)  
**Repository:** https://github.com/notbleaux/eSports-EXE  
**Last Updated:** 2026-03-19

---

## 📋 Project Overview

Libre-X-eSport 4NJZ4 TENET Platform is an esports simulation and analytics platform focused on tactical FPS games (Valorant with planned Counter-Strike 2 support). The platform provides:

- **SATOR Analytics:** Advanced player metrics (SimRating, RAR) with confidence weighting
- **eXe Directory:** Service registry and coordination hub
- **ROTAS Simulation:** Deterministic tactical FPS match simulation (Godot 4)
- **4NJZ4 TENET Platform:** 5-hub web interface (SATOR, ROTAS, AREPO, OPERA, TENET Central Hub)
- **Pandascore Integration:** Official API for legal esports data access

### Key Components

| Component | Location | Technology | Status |
|-----------|----------|------------|--------|
| **4NJZ4 TENET Platform** | `apps/website-v2/` | React 18, Vite, Tailwind, TypeScript | ✅ Active v2.0 |
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

## 🏗️ Architecture

### Monorepo Structure (npm workspaces)

```
/
├── apps/                          # Applications
│   ├── website-v2/               # 4NJZ4 TENET Platform (React + Vite) - MAIN
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
├── .job-board/                   # AI agent coordination system
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

Location: `apps/website-v2/`

```bash
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

### API Backend (FastAPI)

Location: `packages/shared/api/`

```bash
# Run API development server
uvicorn main:app --reload --port 8000 --host 0.0.0.0

# Or from root
npm run dev:api
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
cd apps/website-v2
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
cd apps/website-v2
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
6. **Job Board:** Check `.job-board/` for task coordination
7. **Skills Available:** Use `.agents/skills/` for domain-specific guidance
8. **API v1:** All new API work should use `/v1/` prefix
9. **Pre-commit:** Install hooks with `pre-commit install`

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
