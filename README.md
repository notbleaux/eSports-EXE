[Ver003.000]

# NJZiteGeisTe Platform

[![CI Status](https://github.com/notbleaux/eSports-EXE/actions/workflows/ci.yml/badge.svg)](https://github.com/notbleaux/eSports-EXE/actions)
[![Playwright Tests](https://github.com/notbleaux/eSports-EXE/actions/workflows/playwright.yml/badge.svg)](https://github.com/notbleaux/eSports-EXE/actions)
[![Security Audit](https://github.com/notbleaux/eSports-EXE/actions/workflows/security.yml/badge.svg)](https://github.com/notbleaux/eSports-EXE/actions)
[![Health Check](https://github.com/notbleaux/eSports-EXE/actions/workflows/health-check.yml/badge.svg)](https://github.com/notbleaux/eSports-EXE/actions)

[![Code Coverage](https://img.shields.io/codecov/c/github/notbleaux/eSports-EXE/main)](https://codecov.io/gh/notbleaux/eSports-EXE)
[![License](https://img.shields.io/github/license/notbleaux/eSports-EXE)](LICENSE)

> **Advanced Esports Analytics & Simulation Platform for Valorant and Counter-Strike 2**

---

## 📋 Master Plan

**⚠️ IMPORTANT: Before contributing or making architectural decisions, read the [Master Plan](docs/master-plan/master-plan.md).**

The Master Plan is the single source of truth that prevents Design Drift and Architecture Drift. All decisions must align with the five strategic pillars and TENET architecture documented there.

| Resource | Description |
|----------|-------------|
| [🎯 Master Plan](docs/master-plan/master-plan.md) | Single source of truth for project direction |
| [📊 Roadmap](docs/roadmap/roadmap.md) | Development timeline and milestones |
| [🏗️ ADRs](docs/adrs/) | Architecture Decision Records |
| [🎨 Design System](docs/design-system/) | UI/UX guidelines and tokens |

**Quick Validation:** Run `./scripts/validate-master-plan.sh` to check compliance.

---

## 🎯 Overview

NJZiteGeisTe Platform (formerly SATOR-eXe-ROTAS) is a comprehensive esports analytics and simulation platform focused on tactical FPS games. The platform provides advanced player metrics, match predictions, and deterministic tactical simulations.

### Key Components

| Component | Technology | Status | Description |
|-----------|------------|--------|-------------|
| **SATOR Analytics** | Python/FastAPI | ✅ Active | Advanced player metrics (SimRating, RAR) |
| **ROTAS Simulation** | Godot 4/GDScript | 🟡 Paused | Deterministic match simulation |
| **eXe Directory** | FastAPI | ✅ Active | Service registry and API gateway |
| **Web Platform** | React 18/Vite | ✅ Active | 5-hub web interface |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Web App    │  │ Browser Ext  │  │   Mobile (Planned)   │  │
│  │  (React 18)  │  │  (Planned)   │  │                      │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
└─────────┼─────────────────┼─────────────────────┼──────────────┘
          │                 │                     │
          └─────────────────┴─────────────────────┘
                            │
                  ┌─────────┴─────────┐
                  │   Vercel Edge     │
                  └─────────┬─────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                      API LAYER (Render)                         │
├───────────────────────────┼─────────────────────────────────────┤
│  ┌────────────────────────┴──────────────────────────────────┐  │
│  │              FastAPI (Python 3.11+)                        │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │  │
│  │  │   v1/*   │  │  ws/*    │  │ /health  │  │ /admin/* │  │  │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                       DATA LAYER                                 │
├───────────────────────────┼─────────────────────────────────────┤
│  ┌──────────────┐  ┌──────┴──────┐  ┌──────────────────────┐   │
│  │ PostgreSQL   │  │    Redis    │  │   ML Model Store     │   │
│  │ (Supabase)   │  │  (Upstash)  │  │ (TensorFlow.js)      │   │
│  └──────────────┘  └─────────────┘  └──────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and pnpm 8+
- Python 3.11+
- Docker (optional, for local database)

### Installation

```bash
# Clone repository
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE

# Install dependencies
pnpm install

# Setup Python environment
cd packages/shared
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

### Development

```bash
# Start web app
cd apps/web
pnpm run dev

# Start API (in another terminal)
cd packages/shared/api
uvicorn main:app --reload --port 8000

# Run tests
pnpm run test
pytest packages/shared/
```

---

## 📊 Project Status

| Metric | Status |
|--------|--------|
| **Build** | [![CI Status](https://github.com/notbleaux/eSports-EXE/actions/workflows/ci.yml/badge.svg)](https://github.com/notbleaux/eSports-EXE/actions) |
| **Tests** | [![Playwright Tests](https://github.com/notbleaux/eSports-EXE/actions/workflows/playwright.yml/badge.svg)](https://github.com/notbleaux/eSports-EXE/actions) |
| **Security** | [![Security Audit](https://github.com/notbleaux/eSports-EXE/actions/workflows/security.yml/badge.svg)](https://github.com/notbleaux/eSports-EXE/actions) |
| **Coverage** | [![Code Coverage](https://img.shields.io/codecov/c/github/notbleaux/eSports-EXE/main)](https://codecov.io/gh/notbleaux/eSports-EXE) |
| **Uptime** | [![Health Check](https://github.com/notbleaux/eSports-EXE/actions/workflows/health-check.yml/badge.svg)](https://status.njzitegeist.com) |

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React 18 with TypeScript
- **Build Tool:** Vite 5
- **Styling:** Tailwind CSS
- **State:** Zustand + TanStack Query
- **Testing:** Playwright, Vitest

### Backend
- **Framework:** FastAPI (Python 3.11+)
- **Database:** PostgreSQL (Supabase)
- **Cache:** Redis (Upstash)
- **Auth:** JWT + OAuth (Google, Discord, GitHub)
- **Testing:** pytest

### Infrastructure
- **Hosting:** Vercel (Frontend), Render (Backend)
- **Database:** Supabase (PostgreSQL)
- **Cache:** Upstash (Redis)
- **CI/CD:** GitHub Actions

---

## 🏗️ Architecture Decision Records (ADRs)

Key architectural decisions are documented in `docs/adrs/`:

### Strategic Decisions
| ADR | Decision | Status |
|-----|----------|--------|
| [001](docs/adrs/adr-001-tenet-architecture.md) | TENET Four-HUB Architecture | ✅ Accepted |
| [002](docs/adrs/adr-002-tech-stack.md) | React + FastAPI Tech Stack | ✅ Accepted |
| [003](docs/adrs/adr-003-design-tokens.md) | Design Token System | ✅ Accepted |

### Historical Decisions
| ADR | Decision | Status |
|-----|----------|--------|
| [001](docs/adr/001-godot-vs-web-simulation.md) | Godot 4 vs Web-Based Simulation | ✅ Accepted |
| [002](docs/adr/002-postgresql-vs-timescaledb.md) | PostgreSQL vs TimescaleDB | ✅ Accepted |
| [003](docs/adr/003-monorepo-vs-multirepo.md) | Monorepo vs Multi-Repository | ✅ Accepted |
| [004](docs/adr/004-react-vue-frontend.md) | React vs Vue Frontend | ✅ Accepted |
| [005](docs/adr/005-fastapi-vs-flask-django.md) | FastAPI vs Flask/Django | ✅ Accepted |

## 📁 Repository Structure

```
/
├── apps/                           # Applications
│   ├── web/                       # Main web platform (React + Vite)
│   ├── browser-extension/         # Browser extension (planned)
│   └── VCT Valorant eSports/      # VCT data project
│
├── packages/                       # Shared packages
│   └── shared/                    # API, data pipeline, schemas
│
├── platform/                       # Simulation platform
│   └── simulation-game/           # Godot 4 project (to be extracted)
│
├── docs/                           # Documentation
│   ├── master-plan/               # ⭐ PROJECT MASTER PLAN
│   │   └── master-plan.md         # Single source of truth
│   ├── adrs/                      # Architecture Decision Records
│   │   ├── README.md
│   │   ├── adr-template.md
│   │   ├── adr-001-tenet-architecture.md
│   │   ├── adr-002-tech-stack.md
│   │   └── adr-003-design-tokens.md
│   ├── design-system/             # UI/UX Design System
│   │   └── README.md
│   ├── roadmap/                   # Development Roadmap
│   │   └── roadmap.md
│   ├── api-contracts/             # API Specifications
│   ├── architecture/              # System architecture
│   │   ├── CANONICAL_SYSTEM_ARCHITECTURE.md
│   │   ├── DATA_FLOW_DIAGRAM.md
│   │   ├── DEPLOYMENT_ARCHITECTURE.md
│   │   └── DATA_PARTITION_FIREWALL.md
│   ├── API_V1_DOCUMENTATION.md
│   ├── API_VERSIONING_POLICY.md
│   ├── DEPLOYMENT_GUIDE.md
│   └── SECURITY_HARDENING.md      # TeXeT security guide
│
├── scripts/                        # Utility scripts
│   └── validate-master-plan.sh    # Architecture validation
│
├── tests/                          # Test suites
│   ├── e2e/                       # Playwright tests
│   ├── integration/               # Python integration tests
│   ├── simulation/                # ROTAS validation framework
│   └── unit/                      # Unit tests
│
├── docker-compose.yml              # One-command dev setup
├── Dockerfile.api                  # API container
├── Dockerfile.web                  # Web container
├── .devcontainer/                  # VS Code dev container
└── .github/workflows/              # CI/CD pipelines
```

---

## 📖 Documentation

### Essential Reading
- **[🎯 Master Plan](docs/master-plan/master-plan.md)** - **START HERE** - Project direction and governance
- **[📊 Roadmap](docs/roadmap/roadmap.md)** - Development timeline and milestones
- **[🎨 Design System](docs/design-system/README.md)** - UI/UX guidelines and tokens

### Technical Documentation
- **[API Documentation](docs/API_V1_DOCUMENTATION.md)** - Complete API reference
- **[Architecture Guide](docs/ARCHITECTURE_V2.md)** - System design and patterns
- **[Deployment Guide](docs/DEPLOYMENT_GUIDE.md)** - Production deployment
- **[Contributing Guide](CONTRIBUTING.md)** - Contribution guidelines

---

## 🔐 Security

Security is a top priority. Please see our security documentation:

- [Security Policy](SECURITY.md)
- [Vulnerability Reporting](SECURITY.md#reporting-vulnerabilities)
- [Security Audit Status](https://github.com/notbleaux/eSports-EXE/actions/workflows/security.yml)

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Pandascore** - Official esports data provider
- **Supabase** - Database and authentication
- **Vercel** - Frontend hosting
- **Render** - Backend hosting

---

<p align="center">
  <strong>NJZiteGeisTe Platform</strong><br>
  Advanced Esports Analytics & Simulation
</p>
