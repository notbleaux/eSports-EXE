[Ver002.000]

# Tech Stack Assessment — SATOR-eXe-ROTAS

**Assessment Date:** 2026-03-04  
**Based on:** `notbleaux/eSports-EXE` repository (RadiantX platform)

---

## Repository Status

| Repository | Status | Notes |
|------------|--------|-------|
| `notbleaux/eSports-EXE` | ✅ **FOUND** | Active, last commit Mar 2, 2026 |
| `hvrryh-web/sator-exe-rotas` | ❌ **404** | All capitalization variations tried — does not exist or is private |

**Note:** `hvrryh-web` appears as a contributor on the working repo (likely your alternate account).

---

## Current Architecture (RadiantX / eSports-EXE)

### Directory Structure
```
/
├── website/           # Static site (deployable to GitHub Pages)
├── simulation-game/   # Godot 4.x + C# tactical FPS simulation
├── shared/            # Data pipelines, APIs, schemas
│   ├── api/           # FastAPI REST service
│   ├── apps/
│   ├── axiom-esports-data/  # Complete Valorant data pipeline
│   ├── docs/
│   └── packages/
└── .github/workflows/ # CI/CD (GitHub Pages deployment)
```

### Tech Stack by Component

| Component | Technology | Cost |
|-----------|------------|------|
| **Website** | Static HTML/CSS/JS + Tailwind | ✅ FREE (GitHub Pages) |
| **Data Pipeline** | Python 3.11+ + PostgreSQL + Docker | ✅ FREE (self-hosted/local) |
| **API** | FastAPI (Python) | ✅ FREE |
| **Visualization** | React + D3 + WebGL | ✅ FREE (open source) |
| **Simulation Game** | Godot 4.x + C# | ✅ FREE (MIT license) |
| **CI/CD** | GitHub Actions | ✅ FREE (public repo) |

### Language Breakdown
- **Python 45.0%** — Data pipeline, analytics, API
- **HTML 19.9%** — Website structure
- **GDScript 15.4%** — Godot engine scripts
- **C# 8.9%** — Game core simulation
- **TypeScript 5.6%** — Frontend visualization
- **JavaScript 2.7%** — Website interactivity

---

## Existing Data Infrastructure (axiom-esports-data)

### What's Already Built

| Feature | Status | Description |
|---------|--------|-------------|
| **88,560 validated player records** | ✅ Complete | Valorant data spanning 2020–2026 |
| **Dual-storage architecture** | ✅ Implemented | `raw_extractions` + `reconstructed_records` |
| **VLR.gg scraping pipeline** | ✅ Complete | Delta mode (only new/changed matches) |
| **PostgreSQL with migrations** | ✅ Complete | 5 migration files including SATOR layers |
| **Docker + Docker Compose** | ✅ Complete | Full containerized setup |
| **FastAPI REST service** | ✅ Complete | API endpoints |
| **React/D3/WebGL frontend** | ✅ Complete | SATOR Square visualization |
| **SimRating + RAR metrics** | ✅ Complete | Advanced analytics with guardrails |
| **CI/CD pipelines** | ✅ Complete | Structure, extraction, validation, release |

### Database Migrations
1. `001_initial_schema.sql` — Base tables
2. `002_sator_layers.sql` — SATOR architecture layers
3. `003_dual_storage.sql` — **Twin-table implementation** (raw + reconstructed)
4. `004_extraction_log.sql` — Audit logging
5. `005_staging_system.sql` — Data staging

### Dual-Storage Pattern (Twin-Table Implementation)

**Raw Extractions Table:**
- Immutable append-only store
- SHA-256 checksums for integrity
- Epoch tracking (1: 2020-2022, 2: 2023-2025, 3: 2026+)
- Update/delete trigger-enforced immutability

**Reconstructed Records Table:**
- References raw_extractions via `partner_raw_id`
- Tracks reconstruction methods
- Confidence tier scoring
- Field-level reconstruction tracking

**Unified View:**
- Joins both tables with metadata
- Separation flag indicates RAW vs RECONSTRUCTED

---

## Gaps vs SATOR-eXe-ROTAS Requirements

### What's Missing for Your Full Vision

| Requirement | Current Status | Gap |
|-------------|---------------|-----|
| **CS/Valorant dual support** | ❌ Valorant only | Need CS:GO/CS2 data pipeline |
| **RAWS static website** | ⚠️ Partial | Has visualization, needs Pro-Football-Reference style tables |
| **BASE advanced analytics** | ⚠️ Partial | Has SimRating/RAR, needs member tier system |
| **eXe Directory** | ❌ Not built | Needs central service registry |
| **NJZ Platform** | ❌ Not built | Needs tools/dashboards/glossary system |
| **AXIOM Game integration** | ⚠️ Foundation | Godot project exists, needs database bridge |
| **NJZ Market Sim** | ❌ Not built | Needs stock-trading validation engine |
| **Member/payment system** | ❌ Not built | Needs auth + subscription tiers |

---

## Data Sources Research Needed

### Current (Valorant)
- **VLR.gg** — Scraping pipeline already built

### Needed (Counter-Strike)
- **HLTV** — Requires scraping strategy or API access
- **Steam Web API** — Player stats, match history
- **GRID API** — You mentioned possible access
- **Alternative sources** — Liquipedia, etc.

---

## Free Infrastructure Stack (Confirmed)

| Layer | Technology | Monthly Cost |
|-------|------------|--------------|
| **Frontend Hosting** | GitHub Pages / Vercel | $0 |
| **API Hosting** | Railway / Render / Fly.io free tier | $0 |
| **Database** | Supabase / Neon / Railway PostgreSQL free tier | $0 |
| **Auth** | Supabase Auth / Clerk free tier | $0 |
| **Storage** | Cloudflare R2 / AWS S3 free tier | $0 |
| **Monitoring** | UptimeRobot + GitHub Actions | $0 |
| **Total** | | **$0** |

---

## Sub-Agent Prototypes In Progress

Three sub-agents currently running:

1. **research-data-sources** — Free CS/Valorant data source research
2. **prototype-raws-schema** — RAWS twin-table schema design
3. **prototype-exe-directory** — eXe Directory service architecture

Results will be merged with existing infrastructure.

---

## Key Insight: You're Not Starting from Zero

The `axiom-esports-data` pipeline is **production-grade** with:
- 88K+ validated records
- Complete CI/CD
- Dual-storage architecture already implemented
- FastAPI + React stack

**This is your foundation.** The work ahead is:
1. Extend to Counter-Strike (parallel pipeline)
2. Add eXe Directory for service coordination
3. Build NJZ Market Sim (new component)
4. Add member tier system
5. Connect AXIOM Game to live data

---

*Assessment complete. Waiting for sub-agent results.*
