[Ver001.000]

# AGENTS.md — SATOR / eSports-EXE Project Guide

This document provides essential information for AI coding agents working on the SATOR esports simulation and analytics platform. SATOR is a complex multi-component project with strict architectural boundaries and coding conventions.

---

## Project Overview

**SATOR** (also known as **RadiantX** or **eSports-EXE**) is a three-part esports simulation and analytics platform:

1. **RadiantX** — An offline, deterministic tactical FPS simulation game built with Godot 4 and GDScript
2. **Axiom Esports Data** — A tactical FPS analytics pipeline with SATOR Square 5-layer visualization (Python + FastAPI + React/TypeScript)
3. **SATOR Web** — An online public statistics platform (Static HTML/Tailwind CSS + React/Vite frontend)

### Key Characteristics

- **Deterministic Simulation**: 20 TPS (ticks per second) fixed timestep, seeded RNG for reproducible matches
- **Data Partition Firewall**: Strict boundary preventing game-internal data from reaching the public web
- **Dual-Storage Protocol**: Immutable raw data (`separation_flag=0`) + calculated reconstruction data (`separation_flag=1`)
- **Overfitting Guardrails**: Temporal train/test wall (cutoff: 2024-01-01), adversarial validation, confidence weighting
- **37-Field KCRITR Schema**: Comprehensive player performance database (Kills-Confidence-Role-Investment-Temporal-Reliability)
- **SATOR Square Visualization**: 5-layer palindromic match analysis (D3.js + WebGL)

---

## Repository Structure

```
/
├── website/                    # Static website (HTML/CSS/JS/Tailwind CDN)
│   ├── index.html             # Main entry point
│   ├── package.json           # Minimal npm config (no build required)
│   └── ...
│
├── simulation-game/           # Godot 4 game project (RadiantX)
│   ├── project.godot          # Godot project configuration
│   ├── scripts/               # GDScript game logic
│   │   ├── Main.gd           # Entry point with HUD
│   │   ├── MatchEngine.gd    # 20 TPS deterministic simulation loop
│   │   ├── Agent.gd          # Agent AI with belief system
│   │   ├── Data/             # 22 data type definitions
│   │   └── Sim/              # Combat resolution (6 files)
│   ├── scenes/                # Godot scene files (.tscn)
│   ├── maps/                  # JSON map definitions
│   └── Defs/                  # Game definition files (JSON)
│
├── shared/                    # Shared components
│   ├── axiom-esports-data/   # Python analytics pipeline
│   │   ├── extraction/       # VLR.gg scraping pipeline
│   │   ├── analytics/        # SimRating, RAR, investment grading
│   │   ├── visualization/    # SATOR Square React/D3/WebGL
│   │   ├── api/              # FastAPI REST service
│   │   ├── infrastructure/   # Docker, PostgreSQL migrations
│   │   ├── pipeline/         # Async extraction pipeline coordinator
│   │   ├── monitoring/       # Dev dashboard and alerting
│   │   ├── scripts/          # CLI operational tools
│   │   └── config/           # Static configuration (JSON/YAML)
│   │
│   ├── apps/                 # Application implementations
│   │   ├── sator-web/        # React/Vite frontend (TypeScript)
│   │   └── radiantx-game/    # Godot game integration modules
│   │
│   ├── packages/             # TypeScript shared packages
│   │   ├── stats-schema/     # Public stats type definitions
│   │   └── data-partition-lib/  # Firewall enforcement library
│   │
│   ├── api/                  # API placeholder (Phase 3+)
│   └── docs/                 # Project documentation
│
├── .github/workflows/        # CI/CD workflows
├── package.json              # Root npm workspace configuration
├── render.yaml               # Render.com deployment config
├── vercel.json               # Vercel deployment config
└── AGENTS.md                 # This file
```

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| **Game Engine** | Godot | 4.x |
| **Game Language** | GDScript | 4.0 |
| **Simulation Core** | C# | .NET (optional) |
| **Analytics** | Python | 3.11+ |
| **Analytics Libraries** | pandas, scikit-learn, numpy | Latest stable |
| **API Framework** | FastAPI | 0.109+ |
| **Database** | PostgreSQL | 15 + TimescaleDB |
| **Cache** | Redis | 7.x |
| **Web Frontend (Static)** | HTML5, Tailwind CSS | CDN |
| **Web Frontend (React)** | React, TypeScript, Vite | 18.x, 5.x |
| **Visualization** | D3.js, WebGL/Three.js, Recharts | Latest |
| **HTTP Client** | aiohttp, httpx | Latest |
| **Containerization** | Docker, Docker Compose | Latest |
| **CI/CD** | GitHub Actions | Latest |

---

## Build and Development Commands

### Website (Static)

```bash
cd website
npm install      # Install dependencies (if any added)
npm run build    # Build CSS (Tailwind handled via CDN)
npm run dev:serve # Start local static server on port 3000
```

The website is deployed to GitHub Pages via `.github/workflows/static.yml` or `.github/workflows/deploy.yml`.

### RadiantX Game (Godot)

```bash
# Open project.godot in Godot 4.x Editor
# Press F5 to run
# Or use Godot CLI:
godot --path simulation-game --scene scenes/Main.tscn
```

**Determinism Requirements:**
- Always use seeded RNG: `rng = RandomNumberGenerator.new(); rng.seed = match_seed`
- Never use `randf()` or `randi()` directly
- Fixed timestep (20 TPS, 50ms) — never use delta-time in simulation logic
- Process agents/actions in the same order every tick

### Axiom Esports Data (Python)

```bash
cd shared/axiom-esports-data

# Database setup
docker-compose -f infrastructure/docker-compose.yml up -d postgres redis
psql $DATABASE_URL -f infrastructure/migrations/001_initial_schema.sql

# Extraction pipeline
cd extraction
pip install -r requirements.txt
python src/scrapers/epoch_harvester.py --mode=delta

# Run API
cd ../api
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Analytics
cd ../analytics
pytest tests/ -v
```

### SATOR Web (React/Vite)

```bash
cd shared/apps/sator-web
npm install
npm run dev        # Start Vite dev server
npm run build      # Production build
npm run typecheck  # TypeScript check
npm run lint       # ESLint
```

### TypeScript Packages

```bash
# Root level (workspaces)
npm install
npm run build              # Build all packages
npm run typecheck          # Type check all packages
npm run test:firewall      # Run firewall enforcement tests
npm run validate:schema    # Validate stats schema
```

---

## Code Style Guidelines

### GDScript (Game)

- **Indentation**: Tabs only (not spaces)
- **Naming**: `snake_case` for variables/functions, `PascalCase` for classes
- **Type hints**: Use static typing where possible: `func process_tick() -> void:`
- **Determinism Rules**:
  - Only use seeded RNG — never use `randf()` or `randi()` directly
  - Fixed timestep (20 TPS, 50ms) — never use delta-time in simulation logic
  - Consistent ordering — process agents/actions in the same order every tick

```gdscript
class_name MatchEngine

func calculate_damage(attacker: Agent, target: Agent) -> float:
    var base_damage: float = 25.0
    return base_damage
```

### Python (Analytics)

- Follow PEP 8 style
- Use type hints for all function signatures
- **Overfitting Guardrails**:
  - All data must pass through `integrity_checker.py` before analytics
  - Use `temporal_wall.py` to enforce train/test temporal splits (cutoff: 2024-01-01)
  - Use `confidence_sampler.py` for confidence-weighted calculations
- **Naming**: `snake_case` for functions/variables, `PascalCase` for classes

```python
from typing import Dict, List, Optional

def calculate_simrating(
    player_stats: Dict[str, float],
    role: str,
    confidence: float = 1.0
) -> float:
    """Calculate 5-component SimRating for a player."""
    pass
```

### TypeScript (Packages/Web)

- Strict TypeScript mode enabled (`strict: true` in tsconfig.json)
- **Naming**: `camelCase` for variables/functions, `PascalCase` for classes/interfaces
- **Firewall Enforcement**: Always sanitize game data before sending to API

```typescript
import { FantasyDataFilter } from '@sator/data-partition-lib';
const safe = FantasyDataFilter.sanitizeForWeb(rawData);
```

### SQL (Migrations)

- Numbered migration files: `001_`, `002_`, etc.
- Always include rollback (DOWN) migration comments
- Use `snake_case` for table and column names
- TimescaleDB hypertables for time-series data

---

## Testing Instructions

### GDScript Determinism Tests

```bash
# In Godot Editor, run:
simulation-game/tests/test_determinism.tscn
# All tests must pass before submitting game changes
```

### Python Analytics Tests

```bash
cd shared/axiom-esports-data

# All tests
pytest -v

# Specific modules
pytest analytics/tests/ -v
pytest extraction/tests/ -v
pytest api/tests/ -v

# Required coverage:
# - test_schema_validation.py — 37-field KCRITR completeness
# - test_integral_checker.py — SHA-256 checksums
# - test_temporal_wall.py — no future data in training
# - test_overfitting_guard.py — adversarial detection
```

### TypeScript Tests

```bash
# Firewall tests
npm run test:firewall

# Schema validation
npm run validate:schema

# Type checking
npm run typecheck
```

### Test Coverage Requirements

| Component | Requirement |
|-----------|-------------|
| GDScript | Determinism verification — same seed produces same output |
| Python | HLTV correlation r > 0.85, duplicate rate < 0.01% |
| Firewall | All `GAME_ONLY_FIELDS` stripped by `sanitizeForWeb()` |
| Schema | No unexpected fields in public types |

---

## Security Considerations

### Data Partition Firewall

The firewall prevents game-internal fields from reaching the public web platform:

**GAME-ONLY Fields (blocked)**:
- `internalAgentState` — AI decision tree
- `radarData` — Real-time position feed
- `detailedReplayFrameData` — Per-tick simulation frames
- `simulationTick` — Engine internal counter
- `seedValue` — RNG seed
- `visionConeData` — Agent vision state
- `smokeTickData` — Smoke utility state
- `recoilPattern` — Per-weapon recoil data

**Enforcement Points**:
1. Game extraction (`LiveSeasonModule.gd`)
2. API middleware filter (`api/src/middleware/firewall.py`)
3. Web schema validation (`stats-schema`)
4. CI/CD automated testing

### Critical Rules

- Never commit `.env` files — use `.env.example` as template
- Never commit model files (`.pkl`, `.joblib`) — gitignored
- No hardcoded player IDs in test files
- All firewall changes require explicit review (see CODEOWNERS)
- Database migrations must not create columns named after `GAME_ONLY_FIELDS`

---

## Deployment Process

### GitHub Pages (Static Website)

Triggered on push to `main` branch:
```yaml
# .github/workflows/static.yml or deploy.yml
- Uploads ./website folder to GitHub Pages
```

### Render (FastAPI Backend)

Uses `render.yaml` blueprint:
```bash
# Auto-deploys on push to main
# Services: sator-api (web), sator-keepalive (cron)
```

### Vercel (React Frontend)

Configured in `vercel.json`:
```bash
# Routes /web/* to sator-web React app
# Routes /* to static website
# API proxy to Render backend
```

### Database Migrations

```bash
cd shared/axiom-esports-data/infrastructure

# Apply in order:
psql $DATABASE_URL -f migrations/001_initial_schema.sql
psql $DATABASE_URL -f migrations/002_sator_layers.sql
# ... etc through 009_alert_scheduler_tables.sql
```

---

## Branch Strategy

```
main (production)
  │
  └─ develop (integration)
        │
        ├─ feature/stats-schema-types
        ├─ feature/firewall-implementation
        └─ ...
```

| Branch | Purpose | Merge Requirements |
|--------|---------|-------------------|
| `main` | Production | All CI passes, firewall tests, `@hvrryh-web` approval |
| `develop` | Integration | CI passes, code review |
| `feature/*` | Development | CI passes |

### Naming Convention
- `feature/<description>` — New feature
- `fix/<description>` — Bug fix
- `chore/<description>` — Non-functional change
- `docs/<description>` — Documentation only

---

## Environment Variables

Copy `shared/axiom-esports-data/.env.example` to `.env` and configure:

```bash
# Database
DATABASE_URL=postgresql://axiom:changeme@localhost:5432/axiom_esports
POSTGRES_USER=axiom
POSTGRES_PASSWORD=changeme

# Extraction
VLR_RATE_LIMIT=2.0
RAW_STORAGE_PATH=data/raw_extractions

# External validation (optional)
HLTV_API_KEY=
GRID_API_KEY=
LIQUIPEDIA_API_KEY=

# Data retention
DATA_RETENTION_DAYS=730

# Analytics
TRAIN_CUTOFF_DATE=2024-01-01
MIN_MAPS_TRAINING=50
MAX_MAPS_CEILING=200
```

**Never commit `.env` files to version control.**

---

## Documentation Index

| Document | Location | Purpose |
|----------|----------|---------|
| Quick Start | `shared/docs/quick_start.md` | Getting started guide |
| Architecture | `ARCHITECTURE.md` | System design overview |
| Agent Behavior | `shared/docs/agents.md` | AI agent documentation |
| Map Format | `shared/docs/map_format.md` | JSON map specification |
| Replay System | `shared/docs/replay.md` | Match replay guide |
| Firewall Policy | `shared/docs/FIREWALL_POLICY.md` | Data partition rules |
| Branch Strategy | `shared/docs/BRANCH_STRATEGY.md` | Git workflow |
| AXIOM Guide | `shared/axiom-esports-data/AXIOM.md` | AI agent operational guide |
| Data Dictionary | `shared/axiom-esports-data/docs/DATA_DICTIONARY.md` | 37-field KCRITR schema |
| SATOR Architecture | `shared/axiom-esports-data/docs/SATOR_ARCHITECTURE.md` | 5-layer visualization spec |
| API Reference | `shared/axiom-esports-data/docs/API_REFERENCE.md` | REST API documentation |

---

## Common Tasks for AI Agents

### Adding a New Data Source

1. Create scraper in `shared/axiom-esports-data/extraction/src/scrapers/`
2. Add parser in `shared/axiom-esports-data/extraction/src/parsers/`
3. Extend `extraction_bridge.py` to map schema to KCRITR fields
4. Add cross-reference validation in `validation_crossref.py`
5. Update `shared/axiom-esports-data/docs/DATA_DICTIONARY.md`

### Modifying Game Simulation

1. Ensure determinism — use seeded RNG only
2. Update `MatchEngine.gd` or relevant subsystem
3. Run determinism tests: `test_determinism.tscn`
4. Update documentation in `shared/docs/`

### Adding Public Statistics

1. Determine if field is game-internal (see FIREWALL_POLICY.md decision tree)
2. If public: add to `shared/packages/stats-schema/src/types/`
3. If game-only: add to `FantasyDataFilter.GAME_ONLY_FIELDS`
4. Run `npm run test:firewall` and `npm run validate:schema`
5. Update firewall documentation

### Database Schema Changes

1. Create new migration file with next sequential number
2. Follow existing naming: `XXX_description.sql`
3. Include both UP and DOWN migrations as comments
4. Test migration against local Docker database
5. Update `DATA_DICTIONARY.md` if fields added/changed

---

## Key Constants and Configuration

| Constant | Value | Location |
|----------|-------|----------|
| Tick rate | 20 TPS | `simulation-game/project.godot` |
| Training cutoff | 2024-01-01 | `analytics/src/guardrails/temporal_wall.py` |
| VLR rate limit | 2.0s | `extraction/src/scrapers/vlr_resilient_client.py` |
| Min maps training | 50 | `config/overfitting_guardrails.json` |
| Max maps ceiling | 200 | `config/overfitting_guardrails.json` |
| Validation target | r > 0.85 | `analytics/tests/` |

---

## License

- **RadiantX Game**: MIT License
- **Axiom Esports Data**: CC BY-NC 4.0 (Non-commercial use with attribution)

---

*Last updated: 2026-03-05*
