---
name: sator-project
description: "Libre-X-eSport 4NJZ4 TENET Platform project orchestration. USE FOR: project setup, repository initialization, component scaffolding, skill selection guidance, architecture decisions. DO NOT USE FOR: general project management, non-SATOR projects."
license: MIT
metadata:
  author: SATOR Team
  version: "2.0.0"
---

# Libre-X-eSport 4NJZ4 TENET Platform

> **PROJECT ORCHESTRATION**
>
> Central skill for 4NJZ4 TENET Platform development.
> Routes to specialized skills based on task type.
> Maintains project-wide conventions and standards.

## Project Identity

- **Name**: Libre-X-eSport 4NJZ4 TENET Platform
- **Former Names**: SATOR-eXe-ROTAS / NJZ Platform / RadiantX
- **Repository**: https://github.com/notbleaux/eSports-EXE
- **Version**: 2.0.0
- **License**: MIT (Game), CC BY-NC 4.0 (Data Pipeline)

## Triggers

Activate this skill when user wants to:
- Set up a new SATOR project
- Initialize repository structure
- Scaffold new components
- Understand which skill to use
- Make architecture decisions
- Get project overview

## Rules

1. **Route to Specialized Skills** — Use appropriate skill for task
2. **Maintain Conventions** — Follow established patterns
3. **Firewall Always** — Never compromise data partition
4. **Determinism Matters** — Game simulation must be reproducible
5. **Document Decisions** — Update AGENTS.md when conventions change
6. **Version Headers** — All documents must use [VerMMM.mmm] format

## WHEN to Use / DO NOT USE

| USE FOR | DO NOT USE FOR |
|---------|----------------|
| Project initialization | Day-to-day coding |
| Skill selection | Specific implementation |
| Architecture decisions | Bug fixes |
| Component scaffolding | Testing |
| Repository setup | Deployment |

## Skill Routing Guide

| Task | Use Skill |
|------|-----------|
| Data firewall, sanitization | `sator-data-firewall` |
| Godot game, GDScript, C# | `sator-godot-dev` |
| Python ETL, async pipelines | `sator-python-pipeline` |
| VLR.gg scraping | `sator-extraction` |
| FastAPI, Pydantic | `sator-fastapi-backend` |
| React, TypeScript, Tailwind | `sator-react-frontend` |
| SimRating, RAR, analytics | `sator-analytics` |
| SATOR Square visualization | `sator-sator-square` |
| Combat resolution, duels | `sator-simulation` |
| Render, Vercel, CI/CD | `sator-deployment` |
| Cross-component features | `sator-end-to-end` |

## Project Architecture

```
Libre-X-eSport 4NJZ4 TENET Platform
│
├── apps/
│   ├── website-v2/              # 4NJZ4 TENET Platform (React 18 + Vite) ⭐ MAIN
│   └── VCT Valorant eSports/    # VCT data project
│
├── packages/shared/
│   ├── api/                     # FastAPI REST backend
│   ├── axiom-esports-data/      # Python data pipeline
│   │   ├── extraction/          # VLR.gg scraping
│   │   ├── pipeline/            # ETL orchestration
│   │   ├── analytics/           # SimRating, RAR
│   │   └── infrastructure/      # PostgreSQL migrations
│   └── packages/
│       ├── data-partition-lib/  # Security firewall library
│       └── stats-schema/        # Stats validation schemas
│
├── platform/
│   └── simulation-game/         # Godot 4 project (Paused)
│
├── services/
│   └── exe-directory/           # Service registry (Planned)
│
├── tests/
│   ├── e2e/                     # Playwright E2E tests
│   ├── integration/             # Python integration tests
│   ├── unit/                    # Python unit tests
│   └── load/                    # Load testing
│
├── docs/                        # Documentation
├── .job-board/                  # AI agent coordination
└── .agents/skills/              # Project-specific AI skills
```

## Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React, Vite, Tailwind CSS | React 18, Vite 5 |
| **Language** | TypeScript | 5.9+ |
| **3D/Visualization** | Three.js, React Three Fiber, D3.js | Three 0.158 |
| **Animation** | Framer Motion, GSAP | Framer Motion 10, GSAP 3.12 |
| **State Management** | Zustand, TanStack Query | 4.4+, 5.90+ |
| **Backend API** | FastAPI (Python) | 3.11+ |
| **Database** | PostgreSQL (Supabase) | 15+ |
| **Cache** | Redis | 7+ |
| **Game Engine** | Godot 4 | 4.2+ |
| **Testing** | Playwright, Vitest, pytest | Latest |

## Quick Start

### New Developer Setup

```bash
# 1. Clone repository
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE

# 2. Install Node dependencies
npm install

# 3. Set up Python environment
cd packages/shared
pip install -r requirements.txt

# 4. Configure environment
cp .env.example .env
# Edit .env with your values

# 5. Start development
cd apps/website-v2
npm run dev
```

## The 5 Hubs (4NJZ4 TENET)

The web platform consists of 5 interconnected hubs:

| Hub | Name | Purpose | Path |
|-----|------|---------|------|
| SATOR | Sator Hub | Analytics & Ratings | `src/hub-1-sator/` |
| ROTAS | Rotas Hub | Simulation & Replays | `src/hub-2-rotas/` |
| AREPO | Arepo Hub | Tournaments & Events | `src/hub-3-arepo/` |
| OPERA | Opera Hub | Maps & Visualization | `src/hub-4-opera/` |
| TENET | Tenet Hub | Central Navigation | `src/hub-5-tenet/` |

## Component Scaffolding

### New React Component (website-v2)

```bash
cd apps/website-v2
```

```tsx
// src/components/MyFeature.tsx
import { useQuery } from '@tanstack/react-query'

export function MyFeature() {
  const { data } = useQuery({...})
  return <div className="...">...</div>
}
```

### New API Endpoint

```bash
cd packages/shared/api
```

```python
# src/routes/my_feature.py
from fastapi import APIRouter
from src.schemas import MyFeatureSchema

router = APIRouter()

@router.get("/my-feature")
async def get_my_feature():
    return {"status": "ok"}
```

### New Godot Script

```bash
cd platform/simulation-game
```

```gdscript
# scripts/MyFeature.gd
class_name MyFeature
extends Node

const TICK_RATE: float = 20.0

func _ready() -> void:
    pass

func process_tick() -> void:
    pass
```

## Key Decisions

### Why Godot 4?

- Open source
- Deterministic physics (20 TPS)
- GDScript flexibility
- Export to multiple platforms

### Why FastAPI?

- Async Python performance
- Automatic OpenAPI docs
- Pydantic validation
- Native asyncpg support

### Why React + Vite?

- Fast development HMR
- TypeScript support
- Small bundle size
- Modern tooling

## Project Standards

### Code Style

| Language | Standard |
|----------|----------|
| TypeScript | Strict mode, 2-space tabs |
| Python | Black, 100 char line length |
| GDScript | Tabs, snake_case, PascalCase classes |
| SQL | snake_case, numbered migrations |

### Commit Messages (Conventional Commits)

```
<type>(<scope>): <description> - <context>
```

**Types:** feat, fix, docs, style, refactor, test, chore
**AI Agent Prefix:** Use `[JLB]` for Job Listing Board commits

### Testing Requirements

| Component | Requirement |
|-----------|-------------|
| TypeScript | typecheck, firewall tests |
| Python | pytest, >80% coverage |
| Godot | Determinism tests |
| E2E | Critical paths covered |

### Document Versioning

All documents MUST include version header:
```
[VerMMM.mmm]

# Document Title
```

## Environment Variables

**Frontend (Vercel):**
- `VITE_API_URL` — Backend API endpoint
- `VITE_WS_URL` — WebSocket endpoint

**Backend (Render):**
- `DATABASE_URL` — PostgreSQL connection
- `REDIS_URL` — Redis connection
- `PANDASCORE_API_KEY` — Pandascore API key
- `JWT_SECRET_KEY` — JWT signing key

## Getting Help

1. Check relevant SKILL.md for component
2. Review docs/ARCHITECTURE_V2.md for system design
3. Consult AGENTS.md for conventions
4. Check existing code for patterns
5. Review .job-board/ for task coordination

## References

- **Primary**: `notbleaux/eSports-EXE`
- **AGENTS.md**: Project conventions and guidelines
- **README.md**: User overview
- **docs/**: Architecture and API documentation
