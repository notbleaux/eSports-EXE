[Ver002.000]

# AGENTS.md — Libre-X-eSport 4NJZ4 TENET Platform

**Purpose:** This file provides essential context for AI coding agents working on the Libre-X-eSport 4NJZ4 TENET Platform project.  
**Project:** Libre-X-eSport 4NJZ4 TENET Platform (formerly SATOR-eXe-ROTAS / NJZ Platform / RadiantX)  
**Repository:** https://github.com/notbleaux/eSports-EXE  
**Last Updated:** 2026-03-12

---

## 📋 Project Overview

Libre-X-eSport 4NJZ4 TENET Platform is an esports simulation and analytics platform focused on tactical FPS games (Valorant with planned Counter-Strike support). The platform provides:

- **SATOR Analytics:** Advanced player metrics (SimRating, RAR) with confidence weighting
- **eXe Directory:** Service registry and coordination hub
- **ROTAS Simulation:** Deterministic tactical FPS match simulation (Godot 4)
- **4NJZ4 TENET Platform:** 4-hub web interface (SATOR, ROTAS, AREPO, OPERA)

### Key Components

| Component | Location | Technology | Status |
|-----------|----------|------------|--------|
| **4NJZ4 TENET Platform** | `apps/website-v2/` | React 18, Vite, Tailwind | ✅ Active |
| **Original Website** | `apps/website/` | HTML/CSS/JS Static | 🟡 Legacy |
| **Simulation Game** | `platform/simulation-game/` | Godot 4, GDScript, C# | 🟡 Paused |
| **Data Pipeline** | `packages/shared/axiom-esports-data/` | Python, PostgreSQL | ✅ Active |
| **eXe Directory** | `services/exe-directory/` | TBD | 🔵 Planned |
| **VCT Data** | `apps/VCT Valorant eSports/` | Python, FastAPI | ✅ Active |

---

## 🏗️ Architecture

### Monorepo Structure (npm workspaces)

```
/
├── apps/                      # Applications
│   ├── website/              # Static legacy website
│   ├── website-v2/           # 4NJZ4 TENET Platform (React + Vite)
│   └── VCT Valorant eSports/ # VCT data project
│
├── packages/                  # Shared packages
│   └── shared/               # Shared libraries
│       ├── api/              # FastAPI REST service
│       ├── axiom-esports-data/  # Complete data pipeline
│       ├── apps/             # sator-web, radiantx-game
│       └── packages/         # @sator/data-partition-lib, @sator/stats-schema
│
├── platform/                  # Simulation platform
│   └── simulation-game/      # Godot 4 project
│
├── services/                  # Backend services
│   └── exe-directory/        # Service registry (planned)
│
├── tests/                     # Test suites
│   ├── integration/          # Integration tests
│   └── load/                 # Load testing (Locust)
│
├── docs/                      # Documentation (MkDocs)
├── infrastructure/            # Deployment configs
│   ├── render.yaml           # Render deployment
│   └── scripts/              # Deployment scripts
│
├── .job-board/               # AI agent coordination system
├── .agents/skills/           # Project-specific AI skills
└── .github/workflows/        # CI/CD pipelines
```

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React, Vite, Tailwind CSS | React 18, Vite 5 |
| **3D/Visualization** | Three.js, React Three Fiber, D3.js | Three 0.158 |
| **Animation** | Framer Motion, GSAP | Framer Motion 10, GSAP 3.12 |
| **State Management** | Zustand | 4.4+ |
| **Backend API** | FastAPI (Python) | 3.11+ |
| **Database** | PostgreSQL | 14+ |
| **Game Engine** | Godot 4 | 4.2+ |
| **Game Languages** | GDScript, C# | .NET 6+ |
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
```

### Data Pipeline (Python)

```bash
cd packages/shared

# Install Python dependencies
pip install -r requirements.txt

# Run tests
pytest

# Run with coverage
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
├── integration/
│   ├── conftest.py              # pytest configuration
│   ├── test_api_firewall.py     # Data partition tests
│   ├── test_cold_start_resilience.py
│   ├── test_database_connection.py
│   ├── test_dedup_redundancy.py
│   ├── test_end_to_end.py
│   └── test_pipeline_e2e.py
└── load/
    └── locustfile.py            # Load testing
```

### Running Tests

```bash
# Python tests
pytest tests/integration/

# With coverage
pytest tests/integration/ --cov --cov-report=html

# Firewall tests specifically
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

## 🔐 Security Considerations

### Data Partition Firewall

**CRITICAL:** Game simulation data and web platform data are strictly separated.

- `GAME_ONLY_FIELDS` — Fields only available in game simulation
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
```

### Security Headers (Vercel)

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

### Secrets Detection

Pre-commit hook `detect-secrets` scans for:
- API keys
- Passwords
- Tokens
- Private keys

Baseline stored in `.secrets.baseline`.

---

## 🚀 Deployment

### Platforms

| Platform | Use Case | Config File |
|----------|----------|-------------|
| **Vercel** | Frontend hosting | `vercel.json` |
| **Render** | Full-stack apps | `infrastructure/render.yaml` |
| **GitHub Pages** | Static sites | `.github/workflows/static.yml` |

### Environment Variables by Platform

**Vercel:**
- `VITE_API_URL` — Backend API endpoint

**Render:**
- `DATABASE_URL` — PostgreSQL connection
- `GITHUB_TOKEN` — GitHub API access

### Deployment Commands

```bash
# Vercel (manual)
vercel --prod

# Render (via blueprint)
# Push to main triggers auto-deploy
```

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

---

## 📚 Key Documentation

| Document | Location | Purpose |
|----------|----------|---------|
| README | `README.md` | Project overview |
| Contributing | `CONTRIBUTING.md` | Contribution guidelines |
| Deployment | `DEPLOYMENT.md` | Deployment guide |
| Tech Stack | `docs/SATOR-TECH-STACK.md` | Technology assessment |
| Architecture | `docs/architecture/` | System design |
| API Reference | `docs/api/` | API documentation |
| Guides | `docs/guides/` | User guides |

---

## ⚠️ Important Notes for Agents

1. **Version All Documents:** Use `[VerMMM.mmm]` format
2. **Conventional Commits:** Follow `type(scope): description - context` format
3. **Data Partition:** Never expose game-only fields to web platform
4. **No Secrets:** Never commit credentials; use environment variables
5. **Test Changes:** Run appropriate tests before committing
6. **Job Board:** Check `.job-board/` for task coordination
7. **Skills Available:** Use `.agents/skills/` for domain-specific guidance

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

### Database Migrations (axiom-esports-data)
1. `001_initial_schema.sql`
2. `002_sator_layers.sql`
3. `003_dual_storage.sql` (Twin-table implementation)
4. `004_extraction_log.sql`
5. `005_staging_system.sql`

---

*This file is maintained for AI coding agents. Update when project structure or conventions change.*
