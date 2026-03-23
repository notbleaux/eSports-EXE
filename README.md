[Ver004.000]

# 🏗️ Libre-X-eSport 4NJZ4 TENET Platform v2.1

**Status:** 🟢 Production Ready  
**Version:** 2.1.0  
**Repository:** https://github.com/notbleaux/eSports-EXE

---

## 📋 Overview

The Libre-X-eSport 4NJZ4 TENET Platform is a comprehensive esports analytics and simulation platform focused on tactical FPS games (Valorant with planned Counter-Strike support).

### Key Features

- **SATOR Analytics:** Advanced player metrics (SimRating, RAR) with confidence weighting
- **ROTAS Simulation:** Deterministic tactical FPS match simulation (Godot 4)
- **4NJZ4 TENET Platform:** 4-hub web interface with real-time updates
- **Pandascore Integration:** Official API for legal esports data access
- **WebSocket Real-time:** Live match updates and player statistics
- **ML Predictions:** TensorFlow.js-based prediction engine
- **Feature Flags:** Gradual rollout and A/B testing support
- **Error Tracking:** Sentry integration for production monitoring
- **Component Docs:** Storybook for UI component documentation
- **Mascot System:** Enhanced mascot assets with SVG/CSS/PNG formats and animations

---

## 📁 Repository Structure

```
main-repo/
├── 📁 apps/                      # Applications
│   ├── website/                 # Original static website (Legacy)
│   ├── website-v2/             # 4NJZ4 TENET Platform (React 18, Vite)
│   └── VCT Valorant eSports/   # VCT data project (Python, FastAPI)
│
├── 📁 packages/                  # Shared packages
│   └── shared/                 # Shared libraries
│       ├── api/                # FastAPI components
│       ├── axiom-esports-data/ # Complete data pipeline
│       └── packages/           # @sator/* libraries
│
├── 📁 platform/                  # Simulation platform
│   └── simulation-game/        # Godot 4 project
│
├── 📁 services/                  # Backend services
│   └── exe-directory/          # Service registry (Planned)
│
├── 📁 infrastructure/            # DevOps & Infrastructure
│   ├── .github/workflows/      # CI/CD pipelines
│   ├── scripts/                # Utility scripts
│   ├── render.yaml             # Render deployment config
│   └── vercel.json             # Vercel deployment config
│
├── 📁 docs/                      # Documentation
│   ├── architecture/           # System design docs
│   ├── guides/                 # User guides
│   ├── API_V1_DOCUMENTATION.md # API reference
│   ├── MIGRATION_GUIDE.md      # Migration guide
│   └── WEBSOCKET_PROTOCOL.md   # WebSocket docs
│
├── 📁 tests/                     # Test suites
│   ├── e2e/                    # Playwright E2E tests (95+)
│   ├── integration/            # Python integration tests (35+)
│   ├── unit/godot/             # Godot unit tests (70+)
│   └── load/                   # Load testing
│
├── 📁 .job-board/               # AI agent coordination system
├── 📁 .agents/                  # AI skills and configuration
├── LICENSE                      # MIT License
├── package.json                 # Node dependencies
└── AGENTS.md                    # AI agent documentation
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- PostgreSQL 14+ (or Supabase account)
- Redis (or Upstash account)
- Git

### Installation

```bash
# Clone repository
git clone https://github.com/notbleaux/eSports-EXE.git
cd eSports-EXE

# Install Node dependencies
npm install

# Install Python dependencies
cd packages/shared
pip install -r requirements.txt
```

### Environment Setup

```bash
# Copy environment template
cp .env.example .env.local

# Edit .env.local with your credentials
# Required variables:
# - DATABASE_URL
# - REDIS_URL
# - VITE_API_URL
# - PANDASCORE_API_KEY (optional, for legal data)
```

### Running Development Servers

```bash
# Terminal 1: API Server
cd packages/shared/axiom-esports-data/api
uvicorn main:app --reload

# Terminal 2: Web Development Server
cd apps/website-v2
npm run dev

# Terminal 3: Godot Editor (optional)
godot --editor platform/simulation-game/project.godot
```

Access the application:
- Web: http://localhost:5173
- API: http://localhost:8000
- API Docs: http://localhost:8000/docs

---

## 📊 Platform Components

### 4NJZ4 Hubs

| Hub | Name | Purpose | Color | Route |
|-----|------|---------|-------|-------|
| 1 | **SATOR** | The Observatory — Analytics & Insights | Gold `#ff9f1c` | `/sator` |
| 2 | **ROTAS** | The Harmonic Layer — Simulations & ML | Cyan `#00f0ff` | `/rotas` |
| 3 | **AREPO** | The Directory — Information & Search | Blue `#0066ff` | `/arepo` |
| 4 | **OPERA** | The Action Layer — Maps & Visualization | Purple `#9d4edd` | `/opera` |
| 5 | **TENET** | Central Hub — Platform Overview | White `#ffffff` | `/` |

### Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| **Frontend** | React, Vite, Tailwind CSS | React 18, Vite 5 |
| **3D/Visualization** | Three.js, React Three Fiber | Three 0.158 |
| **Animation** | Framer Motion, GSAP | Framer Motion 10 |
| **State Management** | Zustand, TanStack Query | 4.4+, 5.90+ |
| **Backend API** | FastAPI (Python) | 3.11+ |
| **Database** | PostgreSQL + TimescaleDB | 15+ |
| **Cache** | Redis | 7+ |
| **Game Engine** | Godot | 4.2+ |
| **Testing** | Playwright, Vitest, GUT | Latest |
| **CI/CD** | GitHub Actions | — |

---

## 🧪 Testing

### Running Tests

```bash
# E2E Tests (Playwright)
cd apps/website-v2
npx playwright test

# Unit Tests (Vitest)
cd apps/website-v2
npm run test

# Python Tests
pytest tests/integration/ tests/e2e/ -v

# Godot Tests
cd platform/simulation-game
godot --headless --script tests/run_tests.gd

# Load Tests
locust -f tests/load/locustfile.py

# All Tests (CI)
npm run test:all
```

### Test Coverage

| Category | Count | Framework |
|----------|-------|-----------|
| E2E Tests | 95+ | Playwright |
| Integration Tests | 35+ | pytest |
| Unit Tests (Godot) | 70+ | GUT |
| **Total** | **200+** | — |

---

## 📚 Documentation

### API Documentation

- [API v1 Documentation](docs/API_V1_DOCUMENTATION.md) — Complete REST API reference
- [WebSocket Protocol](docs/WEBSOCKET_PROTOCOL.md) — Real-time communication
- [Migration Guide](docs/MIGRATION_GUIDE.md) — Upgrading from v2.0

### Architecture

- [Architecture v2](docs/ARCHITECTURE_V2.md) — System design and diagrams
- [Master Changelog](docs/CHANGELOG_MASTER.md) — All changes from Phases 1-4

### Development

- [AGENTS.md](AGENTS.md) — AI agent coordination and coding guidelines
- [CONTRIBUTING.md](CONTRIBUTING.md) — Contribution guidelines
- [DEPLOYMENT.md](DEPLOYMENT.md) — Deployment instructions

---

## 🌐 API Quick Reference

### Base URL
```
https://api.libre-x-esport.com/v1
```

### Key Endpoints

```bash
# Players
GET /v1/players/{id}              # Get player by ID
GET /v1/players/?region=Americas  # List players with filters

# Matches
GET /v1/matches/{id}              # Get match details
GET /v1/matches/?game=valorant    # List matches

# Analytics
GET /v1/analytics/simrating/{id}  # SimRating breakdown
GET /v1/analytics/leaderboard     # Leaderboard rankings

# Search
GET /v1/search/?q=TenZ            # Unified search
GET /v1/search/suggestions?q=Te   # Autocomplete

# WebSocket
wss://api.libre-x-esport.com/v1/ws  # Real-time updates
```

See [API Documentation](docs/API_V1_DOCUMENTATION.md) for complete reference.

---

## 🎨 Mascot System

The 4NJZ4 TENET Platform features an advanced mascot system with multiple asset formats, animations, and accessibility features.

### Mascot Characters

| Mascot | Name | Element | Rarity | Color |
|--------|------|---------|--------|-------|
| 🦊 | **Fox** | Solar | Legendary | Orange `#F97316` |
| 🦉 | **Owl** | Lunar | Epic | Indigo `#6366F1` |
| 🐺 | **Wolf** | Binary | Rare | Slate `#475569` |
| 🦅 | **Hawk** | Fire | Epic | Red `#DC2626` |

### Asset Formats

Mascots support multiple formats for optimal performance:

| Format | Extension | Best For | Features |
|--------|-----------|----------|----------|
| **SVG** | `.svg` | Scalability, animations | Vector-based, crisp at any size |
| **PNG** | `.png` | Pixel-perfect raster | High quality, no compression artifacts |
| **CSS** | Pure CSS | Zero dependencies, fast loading | No image files required |
| **Auto** | — | Runtime optimization | Automatically selects best format |

### Usage Examples

#### Basic Usage

```tsx
import { MascotAssetEnhanced } from '@/components/mascots';

// Default mascot with auto format
<MascotAssetEnhanced mascot="fox" size={128} />

// Specific format
<MascotAssetEnhanced mascot="owl" size={64} format="svg" />

// With animation
<MascotAssetEnhanced mascot="wolf" size={128} animate animation="wave" />
```

#### Gallery Component

```tsx
import { MascotGallery, MOCK_MASCOTS } from '@/components/mascots';

<MascotGallery
  mascots={MOCK_MASCOTS}
  config={{ viewMode: 'grid', cardSize: 'md' }}
  onMascotSelect={(mascot) => console.log('Selected:', mascot.name)}
/>
```

### 10 Design Recommendations

The mascot system implements the following recommendations:

| # | Recommendation | Status | Description |
|---|----------------|--------|-------------|
| 1 | **Consistent Color Palette** | ✅ | Each mascot has defined primary/glow colors |
| 2 | **Scalable Base Design** | ✅ | SVG format supports any resolution |
| 3 | **Preview Tool** | ✅ | `/dev/mascots` route for testing all variants |
| 4 | **Progressive Enhancement** | ✅ | Falls back from PNG → SVG → CSS automatically |
| 5 | **User Personalization** | ✅ | localStorage remembers user mascot preferences |
| 6 | **Loading Animations** | ✅ | Pulse animation while assets load |
| 7 | **Mascot Rotation** | ✅ | Random mascot selection on load option |
| 8 | **Accessibility Patterns** | ✅ | ARIA labels, keyboard navigation, screen reader support |
| 9 | **Contextual Usage** | ✅ | Different animations for different states |
| 10 | **Format Optimization** | ✅ | Auto-selects best format based on size |

### Animation Types

| Animation | Description | Use Case |
|-----------|-------------|----------|
| `idle` | Subtle breathing/bouncing | Default state, continuous |
| `wave` | Playful waving gesture | Hover interactions, greetings |
| `celebrate` | Excited celebration | Achievements, milestones |

### Dev Tools

Access the mascot preview tool at:

```
http://localhost:5173/dev/mascots
```

Features:
- Format switching (SVG/PNG/CSS/Auto)
- Size comparison (32px to 256px)
- Animation showcase
- Dark/light mode toggle

### Troubleshooting

#### Mascot not displaying

1. Check that the mascot files exist in `public/mascots/{format}/`
2. Verify the format is supported for the selected size
3. Check browser console for 404 errors

#### Animations not working

1. Ensure `animate` prop is set to `true`
2. Check that `animation` prop is one of: `idle`, `wave`, `celebrate`
3. Verify CSS animations are not disabled via `prefers-reduced-motion`

#### Performance issues

1. Use `format="auto"` for optimal format selection
2. For small sizes (≤64px), use `format="css"`
3. For large sizes (≥512px), use `format="png"`
4. Limit animated mascots on screen simultaneously

#### Format fallbacks not working

1. Ensure `progressive` prop is `true` (default)
2. Check that fallback formats exist in the expected paths
3. Verify `onError` callback is not suppressing errors

---

## 🚀 Deployment

### Platforms

| Component | Platform | URL |
|-----------|----------|-----|
| Web Frontend | Vercel | https://libre-x-esport.com |
| API Backend | Render | https://api.libre-x-esport.com |
| Database | Supabase | PostgreSQL 15 |
| Cache | Upstash | Redis 7 |

### Deploy Commands

```bash
# Deploy Web (Vercel)
cd apps/website-v2
vercel --prod

# Deploy API (Render)
git push origin main  # Auto-deploys via render.yaml
```

---

## 🤖 AI Agent Coordination

This repository uses a **Job Listing Board** system for AI agent coordination:

- **Location:** `.job-board/`
- **Documentation:** [AGENTS.md](AGENTS.md)

### For AI Agents

1. Check your inbox: `.job-board/00_INBOX/{your-agent-id}/NEW/`
2. Browse tasks: `.job-board/01_LISTINGS/ACTIVE/`
3. Use `[JLB]` prefix in commit messages

---

## 📝 Commit Standards

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description> - <context>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Examples:**
```bash
feat(api): Add Pandascore integration - enables legal data source
fix(website): Resolve WebSocket reconnection issue
docs(readme): Update installation instructions
[JLB] feat(sator): Implement search API
```

---

## 📊 Project Status

**Current Version:** 2.1.0  
**Status:** Production Ready ✅

### Phase Completion

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1 | ✅ Complete | Foundation (DB layer, React optimizations) |
| Phase 2 | ✅ Complete | Performance (Web Workers, Virtual scrolling) |
| Phase 3 | ✅ Complete | Quality (Tests, Error boundaries) |
| Phase 4 | ✅ Complete | Production (API stabilization, Documentation) |

---

## 🔐 Security

- Data partition firewall between game and web platforms
- JWT authentication for API access
- Rate limiting on all endpoints
- Secrets detection in CI/CD
- No credentials committed to repository

See [AGENTS.md#security-considerations](AGENTS.md) for details.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat(scope): Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file.

---

## 📞 Contact

- **Repository:** https://github.com/notbleaux/eSports-EXE
- **Issues:** https://github.com/notbleaux/eSports-EXE/issues
- **Discussions:** https://github.com/notbleaux/eSports-EXE/discussions

---

**Libre-X-eSport 4NJZ4 TENET Platform** — *4eva and Nvr Die*

*Last Updated: March 15, 2026*
