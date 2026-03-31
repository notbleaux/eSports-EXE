# 01 - Project Overview
## eSports-EXE Platform Context

---

## Project Identity

**Name:** eSports-EXE (formerly NJZiteGeisTe Platform / SATOR-eXe-ROTAS)
**Repository:** https://github.com/notbleaux/eSports-EXE
**Current Version:** 2.1.0
**Status:** ROTAS MVP Backend Complete, Frontend UI Design Phase

---

## What We're Building

An esports analytics and simulation platform focused on tactical FPS games:
- **Primary:** Valorant (fully supported)
- **Planned:** Counter-Strike 2 (CS2)
- **Future:** Additional tactical FPS titles

---

## The Four HUBs (TENET Architecture)

```
TENET (Navigation Layer — NOT a content hub)
    ↓
Game Selection (Valorant / CS2 / ...)
    ↓
tezeit (Four HUBs):
```

| HUB | Purpose | Data Density | Color |
|-----|---------|--------------|-------|
| **ROTAS** | Stats Reference | Very High | Teal (#14B8A6) |
| **SATOR** | Advanced Analytics | High | Teal (#14B8A6) |
| **OPERA** | Pro Scene Info | Medium | Orange (#F97316) |
| **AREPO** | Community & Forums | Variable | Orange (#F97316) |

---

## Current Implementation Status

### Backend (ROTAS) — ✅ COMPLETE
- Data models: Tournament, Match, Player, Team
- PandaScore API integration
- REST API: 11 endpoints
- Celery task queue for distributed ingestion
- Prometheus metrics + Grafana dashboards
- Comprehensive testing (unit + integration)

### Frontend — 🟡 DESIGN PHASE
- React 18 + Vite + Tailwind + TypeScript
- TypeScript errors: 0
- Build: Stable
- UI Design: **THIS IS YOUR TASK**

### Simulation — 🟡 PAUSED
- Godot 4 project exists
- Status: Deprioritized for web platform focus

---

## Key Differentiators

1. **Cross-Game Unification** — First platform to compare Valorant + CS2 stats
2. **Progressive Disclosure** — Interface adapts to user expertise
3. **Historical Authority** — Verified data with audit trail
4. **Legal Data** — Official PandaScore API (not scraped)

---

## Data Flow

```
PandaScore API
    ↓
[Celery Workers] → Fetch → Transform → Write
    ↓
PostgreSQL (truth layer)
    ↓
FastAPI (REST endpoints)
    ↓
React Frontend ← TanStack Query
```

---

## What's Been Done (Foundation)

- ✅ Master Plan governance system
- ✅ 1/2/3/5 Review Framework applied
- ✅ Zero TypeScript errors
- ✅ Complete ROTAS backend
- ✅ Sub-agent architecture (Celery)
- ✅ Monitoring and alerting
- ✅ OpenAPI documentation

## What You Need to Do (UI Layer)

- 🟡 Design user journeys for 3 personas
- 🟡 Create page specifications
- 🟡 Plan component architecture
- 🟡 Map routes to HUBs

---

## Golden Rules for UI Design

1. **Every feature maps to one HUB** — if it doesn't fit, flag it
2. **Use design tokens** — no hardcoded colors
3. **Respect progressive disclosure** — 3-tier interface
4. **Cross-game unification** — same patterns for Valorant/CS2
5. **Information density** — ROTAS/SATOR = high density (HLTV-style)

---

*Reference: docs/master-plan/master-plan.md for full strategic pillars*
