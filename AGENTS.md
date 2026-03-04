# SATOR / RadiantX — AI Agent Guide

> **This file is for AI coding agents.** It contains essential context about the project structure, conventions, and critical rules. Read this file before making any changes.

---

## Project Overview

**SATOR** (also known as **RadiantX**) is a three-part esports simulation and analytics platform:

1. **RadiantX Game** — An offline, deterministic tactical FPS simulation game built with Godot 4 and GDScript
2. **Axiom Esports Data** — A tactical FPS analytics pipeline with the SATOR Square 5-layer visualization (Python + PostgreSQL + React/D3/WebGL)
3. **SATOR Web** — An online public statistics platform (TypeScript/HTML, in development)

The platform bridges real esports stats (Valorant/CS) with simulated gameplay through a strict data partition firewall.

### Repository Structure

```
/
├── website/                   # Static site (deployable) — News, Stats, Analytics
│   ├── index.html             # Main landing page
│   ├── assets/                # CSS, JS, images
│   ├── system/                # Core CSS system
│   └── package.json           # Website dependencies
│
├── simulation-game/           # Godot 4 game + C# simulation core
│   ├── project.godot          # Godot project entry point
│   ├── scripts/               # Core GDScript game logic
│   ├── scenes/                # Godot scene files
│   ├── maps/                  # JSON map definitions
│   ├── Defs/                  # Game data (weapons, agents, utilities)
│   ├── tests/                 # Godot determinism tests
│   └── tactical-fps-sim-core-updated/  # C# combat simulation core
│
├── shared/                    # Shared components, data pipelines, APIs
│   ├── apps/                  # Deployable applications
│   │   ├── radiantx-game/     # Game integration modules
│   │   └── sator-web/         # Web platform (Phase 3+)
│   ├── packages/              # Shared TypeScript packages
│   │   ├── stats-schema/      # Public statistics type definitions
│   │   ├── data-partition-lib/ # Firewall enforcement library
│   │   └── api-client/        # TypeScript API client
│   ├── api/                   # Backend API (Phase 3+)
│   ├── axiom-esports-data/    # Python analytics pipeline
│   │   ├── extraction/        # VLR.gg scraping (Python)
│   │   ├── analytics/         # SimRating, RAR metrics (Python)
│   │   ├── visualization/     # SATOR Square frontend (React/D3/WebGL)
│   │   ├── api/               # FastAPI REST service
│   │   ├── infrastructure/    # Docker, PostgreSQL migrations
│   │   └── docs/              # Analytics documentation
│   └── docs/                  # Cross-project documentation
│
├── .github/                   # GitHub workflows, CODEOWNERS
├── package.json               # Root npm workspace config
└── README.md                  # Repository overview
```

---

## Technology Stack

| Component | Technology | Version |
|-----------|------------|---------|
| Game Engine | Godot | 4.0+ |
| Game Scripting | GDScript | Godot 4 |
| Simulation Core | C# / .NET | 8.0 |
| Analytics | Python | 3.11+ |
| Database | PostgreSQL | 15 + TimescaleDB |
| Web Frontend | HTML/CSS/JS | ES2020+ |
| Styling | Tailwind CSS | 3.x |
| Packages | TypeScript | 5.0+ |
| API | FastAPI | Python 3.11+ |
| Visualization | React + D3.js + WebGL | 18.x |

---

## Build and Development Commands

### Website (Static)

```bash
cd website
# No build step required — static HTML/CSS/JS
# For development with live reload (if using a dev server):
npx serve .
```

### RadiantX Game (Godot)

```bash
# Open in Godot 4.x
# simulation-game/project.godot

# Run from Godot editor
# F5 — Run main scene
# F6 — Run current scene
```

### C# Simulation Core

```bash
cd simulation-game/tactical-fps-sim-core-updated

# Build the solution
dotnet build TacticalFpsSim.sln

# Run console runner
dotnet run --project SimConsoleRunner -- --defs ./Defs --rules rules.cs --engine ttk --rounds 5 --seed 123
```

### Axiom Esports Data (Python)

```bash
cd shared/axiom-esports-data

# Setup database
docker-compose -f infrastructure/docker-compose.yml up -d

# Install dependencies
cd extraction && pip install -r requirements.txt

# Run extraction pipeline
python src/scrapers/epoch_harvester.py --mode=delta

# Run tests
cd analytics && pytest tests/ -v
cd extraction && pytest tests/ -v
```

### TypeScript Packages (Monorepo)

```bash
# Root level — install all workspace dependencies
npm install

# Build all packages
npm run build

# Run type checking
npm run typecheck

# Validate schema (ensure no game fields leak)
npm run validate:schema

# Test firewall enforcement
npm run test:firewall
```

---

## Code Style Guidelines

### GDScript (Game Scripts)

- **Indentation:** Tabs (not spaces)
- **Naming:**
  - Variables/functions: `snake_case`
  - Classes: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
- **Determinism Rules (CRITICAL):**
  - Only use seeded RNG — never use `randf()` or `randi()` directly
  - Fixed timestep: 20 TPS (50ms per tick)
  - Never use delta-time in simulation logic
  - Process agents/actions in consistent order every tick

Example:
```gdscript
class_name MatchEngine

var current_tick: int = 0
const TICK_RATE: float = 20.0

func process_tick() -> void:
	# Use seeded RNG only
	var roll = rng.randf()
	# ... simulation logic
```

### Python (Analytics)

- Follow **PEP 8** style
- Use type hints for all function signatures
- Temporal wall: never use future data in calculations
- Use `snake_case` for functions/variables, `PascalCase` for classes

Example:
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

- Use strict mode
- Prefer `type` over `interface` for simple structures
- Use `PascalCase` for types/interfaces, `camelCase` for functions/variables

Example:
```typescript
import type { Statistics } from '@sator/stats-schema';

export function sanitizeStats(data: unknown): Statistics {
  // Runtime validation
}
```

### C# (Simulation Core)

- Target .NET 8.0
- Use nullable reference types enabled
- Follow standard C# naming conventions

---

## Testing Instructions

### Determinism Tests (Godot)

```bash
# In Godot editor, run:
# tests/test_determinism.tscn
# All tests should pass — verifies same seed produces same results
```

### TypeScript Tests

```bash
# Firewall enforcement tests
npm run test:firewall

# Schema validation
npm run validate:schema
```

### Python Tests

```bash
cd shared/axiom-esports-data

# Analytics tests (includes guardrail validation)
cd analytics && pytest tests/ -v

# Extraction tests
cd extraction && pytest tests/ -v

# API tests
cd api && pytest tests/ -v
```

### Manual Testing Checklist

- [ ] Run a full match and verify agents move/combat correctly
- [ ] Save replay and verify it loads identically
- [ ] Test with different seeds for variety
- [ ] Verify UI updates correctly during playback
- [ ] Test keyboard navigation (Tab, Space, arrows)

---

## Critical Architecture Rules

### 1. Data Partition Firewall (MOST CRITICAL)

**Game-internal data must NEVER reach the public web platform.**

**GAME-ONLY Fields (blocked):**
- `internalAgentState` — AI decision tree
- `radarData` — Real-time positions
- `detailedReplayFrameData` — Per-tick simulation frames
- `simulationTick` — Engine internal counter
- `seedValue` — RNG seed
- `visionConeData` — Agent vision state
- `smokeTickData` — Smoke simulation state
- `recoilPattern` — Weapon recoil data

**Enforcement Points:**
1. Game extraction (`LiveSeasonModule.gd`)
2. API middleware filter (`firewallMiddleware.ts`)
3. Web schema validation (`validateStats.ts`)
4. CI/CD testing (`test-firewall.yml`)

**Key Invariant:** Game code never imports web code; web code never imports game code.

### 2. Determinism

All simulation logic must be deterministic:
- Seeded RNG for all randomness
- Fixed 20 TPS timestep (50ms)
- Consistent event ordering
- No floating-point accumulation

### 3. Overfitting Guardrails (Analytics)

- Temporal wall: training data must predate 2024-01-01
- No hardcoded player IDs in tests
- No model files committed (`.pkl`, `.joblib` are gitignored)
- Stratified sampling: min 50 maps, max 200 maps per player

### 4. Accessibility

- Protanopia-safe color palette (no red-green only distinctions)
- Minimum touch target size: 48px
- Keyboard navigation support (Tab, Enter, Space, arrows)
- ARIA labels for screen readers

---

## Branch Strategy

| Branch | Purpose | Merge Target |
|--------|---------|--------------|
| `main` | Production — all tests pass, firewall enforced | — |
| `develop` | Integration — features merged here before main | `main` |
| `feature/*` | Feature development | `develop` |
| `fix/*` | Bug fixes | `develop` (or `main` for hotfixes) |
| `docs/*` | Documentation only | `develop` |

**Rules:**
- Always branch from `develop` for new features
- Open PRs to `develop`, not `main`
- PRs to `main` require `@hvrryh-web` approval (per CODEOWNERS)
- Use squash and merge to keep history clean

---

## Security Considerations

### Data Partition Security

- The firewall is the primary security boundary
- Changes to `FantasyDataFilter.GAME_ONLY_FIELDS` require `@hvrryh-web` approval
- Any data flow from game to web must go through all 4 enforcement points

### Environment Variables

- Copy `.env.example` → `.env` (NEVER COMMIT `.env`)
- Database credentials, API keys in `.env` only
- Use `.env.example` as template for new developers

### Deployment Security

- Website deploys to GitHub Pages on push to `main`
- All firewall tests must pass before deployment
- Schema validation runs on every PR

---

## Key Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Root npm workspace configuration |
| `simulation-game/project.godot` | Godot project settings (20 TPS, Forward Plus) |
| `simulation-game/tactical-fps-sim-core-updated/TacticalFpsSim.sln` | C# simulation solution |
| `website/tailwind.config.js` | Tailwind CSS theme (RadiantX colors) |
| `shared/axiom-esports-data/pytest.ini` | Python test configuration |
| `shared/axiom-esports-data/infrastructure/docker-compose.yml` | PostgreSQL/TimescaleDB setup |
| `.github/workflows/deploy-github-pages.yml` | GitHub Pages deployment |

---

## Documentation Index

| Document | Purpose |
|----------|---------|
| `README.md` | Repository overview |
| `shared/docs/PROJECT_STRUCTURE.md` | Complete directory layout |
| `shared/docs/architecture.md` | System architecture overview |
| `shared/docs/FIREWALL_POLICY.md` | ★ Critical: data partition rules |
| `shared/docs/BRANCH_STRATEGY.md` | Git workflow |
| `shared/docs/quick_start.md` | Getting started guide |
| `shared/docs/agents.md` | AI agent behavior documentation |
| `shared/docs/map_format.md` | JSON map specification |
| `shared/docs/replay.md` | Replay system guide |
| `shared/axiom-esports-data/AXIOM.md` | Analytics pipeline operational guide |
| `shared/axiom-esports-data/docs/DATA_DICTIONARY.md` | 37-field KCRITR schema |
| `shared/axiom-esports-data/docs/SATOR_ARCHITECTURE.md` | 5-layer visualization spec |
| `website/CONTRIBUTING.md` | Full contribution guidelines |

---

## Quick Reference

### File Locations by Type

| File Type | Location |
|-----------|----------|
| GDScript game code | `simulation-game/scripts/` |
| C# simulation core | `simulation-game/tactical-fps-sim-core-updated/SimCore/` |
| Godot scenes | `simulation-game/scenes/` |
| Map JSON files | `simulation-game/maps/` |
| Game definitions | `simulation-game/Defs/` |
| Python extraction | `shared/axiom-esports-data/extraction/` |
| Python analytics | `shared/axiom-esports-data/analytics/` |
| React visualization | `shared/axiom-esports-data/visualization/` |
| TypeScript packages | `shared/packages/` |
| Static website | `website/` |
| Shared documentation | `shared/docs/` |

### Common Tasks

**Add a new map:**
1. Create JSON in `simulation-game/maps/`
2. Follow format in `shared/docs/map_format.md`
3. Update `Main.gd` to load the map

**Add a new stat field:**
1. Check `shared/docs/FIREWALL_POLICY.md` classification
2. If public: add to `shared/packages/stats-schema/src/types/`
3. If game-only: add to `FantasyDataFilter.GAME_ONLY_FIELDS`

**Add a new analytics metric:**
1. Add calculator in `shared/axiom-esports-data/analytics/src/`
2. Follow `*Schema` (static) / `*Engine` (runtime) naming
3. Write range-based tests (no hardcoded player values)
4. Run overfitting guard against new metric

**Run database migrations:**
```bash
cd shared/axiom-esports-data/infrastructure
docker-compose up -d
psql $DATABASE_URL -f migrations/001_initial_schema.sql
psql $DATABASE_URL -f migrations/002_sator_layers.sql
psql $DATABASE_URL -f migrations/003_dual_storage.sql
psql $DATABASE_URL -f migrations/004_extraction_log.sql
```

---

## License

- **RadiantX Game**: MIT License
- **Axiom Esports Data**: CC BY-NC 4.0 (Non-commercial use with attribution)

---

*Last updated: Generated from project exploration. Keep this file in sync with actual project changes.*
