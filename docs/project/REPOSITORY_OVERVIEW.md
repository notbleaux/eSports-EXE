[Ver013.000]

# SATOR / RadiantX - Repository Overview

**Primary Repository:** `notbleaux/eSports-EXE`  
**Secondary Repository:** `hvrryh-web/satorXrotas` (archived reference)  
**Platform:** Esports Intelligence & Simulation  
**Last Updated:** 2026-03-04

---

## Executive Summary

The SATOR (also known as RadiantX) platform is a comprehensive esports intelligence system combining:

1. **RadiantX Game** - Deterministic tactical FPS simulation (Godot 4)
2. **Axiom Esports Data** - Python analytics pipeline with dual-game support
3. **SATOR Web** - React-based intelligence platform with Porcelain³ design

This repository (`eSports-EXE`) is the consolidated, production-ready version containing all documentation, configurations, and code from the development repository.

---

## Repository Comparison

### `hvrryh-web/satorXrotas` (Source/Archive)

| Aspect | Details |
|--------|---------|
| **Role** | Development & documentation source |
| **Documentation** | Extensive (13 root-level docs) |
| **Purpose** | Active development, planning, architecture |
| **Status** | Migrated to eSports-EXE |

**Key Characteristics:**
- Primary development occurred here
- Comprehensive skill architecture documentation
- Migration guides and transfer documentation
- File index manifest for verification

### `notbleaux/eSports-EXE` (Target/Production)

| Aspect | Details |
|--------|---------|
| **Role** | Production repository |
| **Documentation** | Consolidated (7 active + 5 legacy docs) |
| **Purpose** | Active development, deployment, operations |
| **Status** | ✅ Enriched with satorXrotas content |

**Key Characteristics:**
- Contains all production code
- Deployment-ready configurations
- Enhanced CI/CD workflows
- Organized documentation structure

---

## Platform Goals

### Primary Objectives

1. **Deterministic Simulation**
   - 20 TPS fixed timestep
   - Seeded RNG for reproducible matches
   - EventLog for deterministic replay

2. **Dual-Game Analytics**
   - Counter-Strike data (HLTV)
   - Valorant data (VLR.gg)
   - Unified KCRITR schema

3. **Advanced Metrics**
   - SimRating (5-component player rating)
   - RAR (Role-Adjusted Replacement)
   - Investment Grading (A+ to D)

4. **Intelligence Platform**
   - Porcelain³ branded interface
   - Quarterly grid navigation
   - SATOR Square 5-layer visualization
   - Real-time data pipeline

5. **Zero-Cost Deployment**
   - Supabase (PostgreSQL)
   - Render (FastAPI)
   - Vercel (React)
   - GitHub Pages (Static)

---

## Component Overview

### 1. Simulation Game (`simulation-game/`)

| Element | Technology | Purpose |
|---------|------------|---------|
| Engine | Godot 4.x | Game runtime |
| Scripts | GDScript | Game logic |
| Core | C# / .NET | Deterministic simulation |
| Data | JSON | Definitions & maps |

**Key Files:**
- `project.godot` - Godot project configuration
- `scripts/MatchEngine.gd` - Core simulation loop
- `scripts/Agent.gd` - AI agent behavior
- `tactical-fps-sim-core-updated/` - C# simulation core

### 2. Axiom Data Pipeline (`shared/axiom-esports-data/`)

| Element | Technology | Purpose |
|---------|------------|---------|
| Extraction | Python, aiohttp | Web scraping |
| Pipeline | Python, asyncio | ETL orchestration |
| Analytics | Python, pandas | Statistical models |
| API | FastAPI, asyncpg | REST backend |
| Database | PostgreSQL, TimescaleDB | Data storage |

**Key Features:**
- 3-epoch temporal extraction
- Conflict prevention system
- Real-time job coordination
- Dual-game support (CS + Valorant)

### 3. Web Platform (`shared/apps/sator-web/`)

| Element | Technology | Purpose |
|---------|------------|---------|
| Framework | React 18 | UI library |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Styling system |
| Build | Vite | Build tool |
| Data | TanStack Query | Data fetching |

**Key Features:**
- Porcelain³ design system
- Quarterly grid navigation
- SATOR Sphere visualization
- HelpHub with health dashboard

### 4. Static Website (`website/`)

| Element | Technology | Purpose |
|---------|------------|---------|
| Type | Static HTML | Marketing site |
| Styling | Tailwind CSS | Design system |
| Deploy | GitHub Pages | Hosting |

**Key Files:**
- `index.html` - Main entry
- `landing.html` - Landing page
- `launchpad.html` - Service hub
- `sator-sphere-*.html` - Visualization demos

---

## Differences Between Repositories

### What Was Migrated

| Category | From satorXrotas | To eSports-EXE |
|----------|------------------|----------------|
| Active Docs | 7 files | Root directory |
| Legacy Docs | 5 files | `legacy/docs/` |
| Metadata | 1 file | `legacy/metadata/` |
| Deployment | 2 configs | Root directory |
| Workflows | 4 workflows | `.github/workflows/` |

### What Was Already Identical

| Component | Path | Notes |
|-----------|------|-------|
| Simulation Game | `simulation-game/` | SHA-identical |
| Shared Packages | `shared/packages/` | SHA-identical |
| Axiom Core | `shared/axiom-esports-data/` | SHA-identical |
| Website | `website/` | SHA-identical |
| Shared API | `shared/api/` | SHA-identical |
| Shared Apps | `shared/apps/` | SHA-identical |

### What Was Redundant

| Item | Location | Resolution |
|------|----------|------------|
| CONTRIBUTING.md | `website/` | Keep root only |
| LICENSE | `website/` | Keep root only |
| CHANGELOG.md | `website/` | Keep root only |

---

## Legacy Archive

The `legacy/` directory preserves historical documentation:

```
legacy/
├── README.md                    # Archive guide
├── docs/                        # Historical docs
│   ├── CRIT_REPORT.md          # Critical assessment
│   ├── DESIGN_GAP_ANALYSIS.md  # Gap analysis
│   ├── REPOSITORY_CHANGES.md   # Change history
│   ├── REPOSITORY_TRANSFER_GUIDE.md  # Migration guide
│   └── SKILL_ARCHITECTURE_ANALYSIS.md # Skill planning
└── metadata/
    └── file_index.json         # Source file manifest
```

---

## Deployment Architecture

### Zero-Cost Stack

| Service | Provider | Free Tier | Usage |
|---------|----------|-----------|-------|
| Database | Supabase | 500MB, 2M reads | PostgreSQL + TimescaleDB |
| API | Render | 512MB, 750hrs | FastAPI hosting |
| Web | Vercel | 100GB bandwidth | React app |
| Static | GitHub Pages | 1GB, 100GB | Marketing site |
| CI/CD | GitHub Actions | 2000 mins | Workflows |

### Configuration Files

| File | Purpose |
|------|---------|
| `render.yaml` | Render.com deployment blueprint |
| `vercel.json` | Vercel deployment configuration |
| `.github/workflows/` | CI/CD automation |

---

## Security

### Data Partition Firewall

The platform enforces strict separation between game-internal data and public web data:

**GAME_ONLY_FIELDS (blocked from web):**
- `internalAgentState` - AI decision tree
- `radarData` - Real-time positions
- `detailedReplayFrameData` - Per-tick frames
- `simulationTick` - Engine counter
- `seedValue` - RNG seed
- `visionConeData` - Agent vision
- `smokeTickData` - Smoke state
- `recoilPattern` - Weapon recoil

**Enforcement Points:**
1. Game extraction (`LiveSeasonModule.gd`)
2. API middleware (`firewall.py`)
3. Web schema validation
4. CI/CD testing

---

## Documentation Index

### Active Documentation (Root)

| Document | Purpose |
|----------|---------|
| `AGENTS.md` | AI agent guide for development |
| `ARCHITECTURE.md` | System architecture & design |
| `CHANGELOG.md` | Version history & changes |
| `CONTRIBUTING.md` | Contribution guidelines |
| `DEPLOYMENT_ARCHITECTURE.md` | Deployment guide |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step deployment |
| `DESIGN_OVERVIEW.md` | Design system overview |
| `MIGRATION_PLAN.md` | Migration planning document |
| `MIGRATION_SUMMARY.md` | Migration completion report |
| `REPOSITORY_OVERVIEW.md` | This document |

### Component Documentation

| Path | Description |
|------|-------------|
| `shared/axiom-esports-data/AXIOM.md` | Pipeline operational guide |
| `shared/axiom-esports-data/docs/` | Data dictionary, API reference |
| `shared/docs/` | Cross-project documentation |
| `website/README.md` | Website-specific docs |

---

## Quick Start

### Prerequisites
- Node.js 20+
- Python 3.11+
- PostgreSQL 15 (or Docker)
- Godot 4.x (for simulation)

### Setup
```bash
# Clone repository
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE

# Install dependencies
npm install
cd shared/axiom-esports-data
pip install -r requirements-pipeline.txt

# Database setup
cd infrastructure
docker-compose up -d
./setup.sh  # or setup.ps1 for Windows

# Start development
# Terminal 1: API
uvicorn api.main:app --reload

# Terminal 2: Web
cd shared/apps/sator-web
npm run dev
```

---

## Migration Notes

**Migration Date:** 2026-03-04  
**Source:** `hvrryh-web/satorXrotas`  
**Method:** Selective file migration with SHA verification  
**Status:** ✅ Complete

All valuable documentation and configurations from `satorXrotas` have been migrated and organized. The source repository can be archived.

---

## Contact & Support

- **Repository:** https://github.com/notbleaux/eSports-EXE
- **Issues:** GitHub Issues
- **Documentation:** See docs listed above

---

**◈ SATOR³ ◈**  
*Porcelain Intelligence Platform*
