[Ver006.000]

# SATOR-eXe-ROTAS: INTEGRATION PLAN v3.0
## Website Design Dossier + Master Plan Integration

**Date:** March 5, 2026  
**Integration Scope:** eSports-EXE Repository + Checkerboard Lipstick 4-Hub Ecosystem  
**Visual Assets Reviewed:** 26 esoteric/sacred geometry images  
**Document Version:** 3.0-INTEGRATION

---

## EXECUTIVE SUMMARY

### Current State Analysis

**Repository A (eSports-EXE):**
- Infrastructure-focused (Python backend, data pipeline, API)
- 65% completion
- Missing: Web components, deployment configs, coordinator implementation
- Strengths: Solid database schema, Valorant pipeline operational

**Repository B (Checkerboard Lipstick - External):**
- 4-hub website ecosystem (234+ files, 5.2MB)
- Complete visual design system
- Swiss Design + Dadaist collage aesthetics
- Deployed on GitHub Pages + Vercel

### Integration Strategy

Merge the infrastructure backend (eSports-EXE) with the frontend ecosystem (Checkerboard Lipstick) to create a unified platform:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SATOR-eXe-ROTAS UNIFIED PLATFORM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  FRONTEND LAYER (Checkerboard Lipstick)                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Hub 1      │  │  Hub 2      │  │  Hub 3      │  │  Hub 4      │        │
│  │ satorXrotas │  │ eSports-EXE │  │ Dashboard   │  │ Directory   │        │
│  │ (Esoteric)  │  │ (Gaming)    │  │ (Analytics) │  │ (Nav)       │        │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘        │
│         │                │                │                │                │
│         └────────────────┴────────────────┴────────────────┘                │
│                                    │                                        │
│                              Main Portal                                    │
│                    (Integration Hub - Landing Page)                         │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  BACKEND LAYER (eSports-EXE Infrastructure)                                 │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  FastAPI Layer                                                      │   │
│  │  ├── Pipeline Coordinator (Phase 1)                                 │   │
│  │  ├── API Firewall (Phase 2A)                                        │   │
│  │  └── Authentication & Rate Limiting                                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Data Layer                                                         │   │
│  │  ├── PostgreSQL + TimescaleDB                                       │   │
│  │  ├── RAWS/BASE Twin Tables                                          │   │
│  │  └── Redis Cache                                                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Pipeline Workers                                                   │   │
│  │  ├── CS2 Extraction (HLTV)                                          │   │
│  │  ├── Valorant Extraction (VLR)                                      │   │
│  │  └── Conflict Resolution                                            │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## VISUAL DESIGN DOSSIER

### Design Philosophy

**Primary Aesthetic:** Swiss Design × Dadaist Collage × Esoteric Geometry  
**Color Palette:** "Checkerboard Lipstick" - High contrast B&W with hot pink accents  
**Typography:** Helvetica Neue / Inter (clean) + Cinzel (esoteric) + Orbitron (gaming)

### Hub Design Specifications

#### Hub 1: satorXrotas (Esoteric/Legacy)

**Theme:** Ancient mysticism meets digital grimoire  
**Visual Language:**
- Parchment textures with gold glow effects
- Sacred geometry overlays (from provided images)
- Particle systems for mystical atmosphere
- Three.js 3D SATOR Sphere visualization
- SATOR Square 5×5 Latin palindrome grid

**Color Palette:**
| Token | Hex | Usage |
|-------|-----|-------|
| --sator-gold | #D4AF37 | Primary accent |
| --sator-copper | #B87333 | Secondary accent |
| --sator-parchment | #F5F5DC | Background |
| --sator-ink | #2C241B | Text |

**Key Visual Elements from Assets:**
1. Arabic astronomical diagrams (celestial spheres)
2. Alchemical diagrams (Spiriti Damnati)
3. Jungian psychology maps (Persona/Ego/Self)
4. Lissajous figures (mathematical beauty)
5. Dimensions of Well-being (spherical layout)
6. Soul Elements diagram (layered consciousness)

**Animation:**
- GSAP rotational symmetry
- Three.js particle systems
- Parchment aging effects

#### Hub 2: eSports-EXE (Gaming/Master)

**Theme:** NASA Mission Control meets esports arena  
**Visual Language:**
- "DARE TO WEAR" hero in checkerboard pink boxes
- B&W makeup photo sliced into grid squares
- CRT scanline effects and energy borders
- Tournament bracket visualizations
- Real-time data streams (SimRating™, RAR)

**Color Palette:**
| Token | Hex | Usage |
|-------|-----|-------|
| --exe-hot-pink | #FF006E | Brand accent |
| --exe-neon-pink | #FF1493 | Secondary |
| --exe-cyan | #00F0FF | Data streams |
| --exe-electric | #39FF14 | Success states |
| --exe-black | #0A0A0A | Background |

**Key Components:**
- Hero: Checkerboard grid with pink lipstick boxes
- Data panels: Glassmorphism with cyan borders
- Charts: CRT-style with phosphor green
- Countdown timers: Seven-segment display style

#### Hub 3: Dashboard (Analytics)

**Theme:** Clinical data control center  
**Visual Language:**
- Glassmorphism data panels
- Clean line charts (Recharts)
- KPI cards with trend indicators
- Real-time metrics with auto-refresh

**Color Palette:**
| Token | Hex | Usage |
|-------|-----|-------|
| --dash-teal | #008080 | Primary |
| --dash-chart-blue | #4169E1 | Charts |
| --dash-panel-bg | rgba(255,255,255,0.1) | Glass |

**Key Components:**
- SimRating™ panel with top performers
- RAR calculator interface
- Investment grading visualization
- Line/Bar/Pie/Gauge charts

#### Hub 4: Directory (Navigation)

**Theme:** Digital concierge and wayfinding  
**Visual Language:**
- Swiss-style grid layout
- Clean typography hierarchy
- Real-time search with relevance scoring
- Breadcrumb navigation

**Color Palette:**
| Token | Hex | Usage |
|-------|-----|-------|
| --dir-nav-blue | #1E90FF | Links |
| --dir-purple | #9370DB | Accents |
| --dir-white | #FFFFFF | Background |

**Key Components:**
- Category filtering (6 categories, 24 services)
- Service cards with 3 variants
- Keyboard shortcuts (Cmd+K for search)
- WCAG accessible (ARIA, focus traps)

### Unified Design System

**Typography Scale:**
```css
--font-display: 'Helvetica Neue', 'Inter', sans-serif;
--font-body: 'Inter', sans-serif;
--font-mono: 'JetBrains Mono', monospace;
--font-esoteric: 'Cinzel', serif;
--font-gaming: 'Orbitron', sans-serif;

--text-xs: 0.75rem;
--text-sm: 0.875rem;
--text-base: 1rem;
--text-lg: 1.125rem;
--text-xl: 1.25rem;
--text-2xl: 1.5rem;
--text-3xl: 1.875rem;
--text-4xl: 2.25rem;
--text-5xl: 3rem;
--text-6xl: 3.75rem;
--text-7xl: 4.5rem;
```

**Spacing System:**
```css
--space-1: 0.25rem;
--space-2: 0.5rem;
--space-3: 0.75rem;
--space-4: 1rem;
--space-6: 1.5rem;
--space-8: 2rem;
--space-12: 3rem;
--space-16: 4rem;
--space-24: 6rem;
```

**Animation Timing:**
```css
--ease-swiss: cubic-bezier(0.4, 0, 0.2, 1);
--ease-dramatic: cubic-bezier(0.87, 0, 0.13, 1);
--duration-fast: 150ms;
--duration-normal: 300ms;
--duration-slow: 500ms;
--duration-dramatic: 800ms;
```

---

## TECHNICAL ARCHITECTURE

### Frontend Stack

| Hub | Framework | Deploy | Key Libraries |
|-----|-----------|--------|---------------|
| Main Portal | Vanilla JS | GitHub Pages | GSAP, Three.js |
| satorXrotas | Vanilla JS | GitHub Pages | Three.js, GSAP, particles.js |
| eSports-EXE | Next.js 14 | Vercel | React, TypeScript, Tailwind, Framer Motion |
| Dashboard | React + Vite | Vercel | Recharts, Zustand, Tailwind |
| Directory | React + Vite | Vercel | Lucide Icons, Tailwind |

### Backend Stack (Existing + Enhancements)

| Component | Technology | Status |
|-----------|------------|--------|
| API | FastAPI (Python 3.11) | Exists |
| Database | PostgreSQL 15 + TimescaleDB | Exists |
| Cache | Redis | Planned |
| Pipeline | Python asyncio | Exists |
| Workers | HLTV/VLR clients | Exists |
| Auth | JWT + OAuth2 | Phase 2A |
| Firewall | Custom middleware | Phase 2A |
| ML | scikit-learn GradB | Phase 5 |
| Graph | Neo4j | Phase 5 |

### Integration Points

```
┌─────────────────────────────────────────────────────────────────┐
│                      INTEGRATION MAP                            │
└─────────────────────────────────────────────────────────────────┘

Hub 1 (satorXrotas) ─────┐
                         │
Hub 2 (eSports-EXE) ─────┼───► API Gateway ───► FastAPI Backend
                         │         │                  │
Hub 3 (Dashboard) ───────┘         │                  ├──► PostgreSQL
                                   │                  ├──► Redis
                                   │                  └──► Pipeline Workers
                                   │
                                   ▼
                           Rate Limiting (Redis)
                           Auth (JWT)
                           Firewall (Data Partition)
```

---

## FILE STRUCTURE (Integrated)

```
notbleaux/eSports-EXE/
├── .github/
│   └── workflows/
│       ├── ci.yml                    # CI/CD pipeline
│       ├── deploy-hub1.yml           # Deploy satorXrotas
│       ├── deploy-hub2.yml           # Deploy eSports-EXE
│       ├── deploy-dashboard.yml      # Deploy Dashboard
│       └── deploy-directory.yml      # Deploy Directory
│
├── docs/
│   ├── analysis/                     # Context dossiers
│   ├── legacy/                       # Historical docs
│   └── design/                       # Design system docs
│       ├── visual-language.md
│       ├── color-palettes.md
│       └── typography.md
│
├── infrastructure/                   # Backend infrastructure
│   ├── api/                          # FastAPI application
│   │   ├── src/
│   │   │   ├── middleware/
│   │   │   │   └── firewall.py       # Phase 2A
│   │   │   ├── pipeline/
│   │   │   │   ├── coordinator/      # Phase 1
│   │   │   │   ├── models.py
│   │   │   │   ├── queue_manager.py
│   │   │   │   ├── agent_manager.py
│   │   │   │   ├── main.py
│   │   │   │   ├── conflict_resolver.py
│   │   │   │   └── workers/
│   │   │   └── auth/                 # JWT/OAuth2
│   │   └── tests/
│   │
│   ├── database/
│   │   ├── schema/
│   │   │   ├── raws_schema.sql
│   │   │   └── base_schema.sql
│   │   └── migrations/
│   │
│   └── pipeline/
│       ├── extraction/
│       └── workers/
│
├── website/                          # 4-Hub Ecosystem
│   ├── main-portal/                  # Integration landing
│   │   ├── index.html
│   │   ├── css/
│   │   │   ├── design-system.css
│   │   │   └── checkerboard.css
│   │   └── js/
│   │
│   ├── hub1-satorxrotas/             # Esoteric hub
│   │   ├── index.html
│   │   ├── sphere.html               # Three.js 3D
│   │   ├── css/
│   │   │   └── main.css
│   │   └── js/
│   │       ├── sator.js              # SATOR Square
│   │       ├── sphere.js             # 3D visualization
│   │       └── particles.js          # Mystical effects
│   │
│   ├── hub2-esports-exe/             # Gaming hub
│   │   ├── app/                      # Next.js App Router
│   │   │   ├── page.tsx              # "DARE TO WEAR" hero
│   │   │   ├── layout.tsx
│   │   │   └── hubs/
│   │   ├── components/
│   │   │   ├── CRT.tsx               # CRT effects
│   │   │   ├── EnergyBorder.tsx      # Neon borders
│   │   │   ├── SimRating.tsx         # Rating display
│   │   │   └── TournamentBracket.tsx
│   │   └── public/
│   │       └── images/
│   │           └── dare-to-wear.jpg   # B&W makeup photo
│   │
│   ├── hub3-dashboard/               # Analytics hub
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── charts/
│   │   │   │   │   ├── LineChart.tsx
│   │   │   │   │   ├── BarChart.tsx
│   │   │   │   │   └── GaugeChart.tsx
│   │   │   │   ├── widgets/
│   │   │   │   │   ├── SimRatingPanel.tsx
│   │   │   │   │   └── RARCalculator.tsx
│   │   │   │   └── layout/
│   │   │   ├── store/                # Zustand state
│   │   │   └── data/
│   │   └── vercel.json
│   │
│   └── hub4-directory/               # Navigation hub
│       ├── src/
│       │   ├── components/
│       │   │   ├── Search.tsx        # Real-time search
│       │   │   ├── ServiceCard.tsx   # 3 variants
│       │   │   └── Navigation.tsx    # Breadcrumbs
│       │   └── data/
│       │       └── services.ts       # 24 services
│       └── vercel.json
│
├── assets/                           # Shared visual assets
│   ├── hub1-esoteric/                # 7 assets
│   │   ├── arabic-astronomy.jpg      # Uploaded image 1
│   │   ├── spiriti-damnati.png       # Uploaded image 2
│   │   ├── jung-maps.jpg             # Uploaded image 6
│   │   ├── lissajous.jpg             # Uploaded image 8
│   │   ├── dimensions-wellbeing.jpg  # Uploaded image 9
│   │   ├── soul-elements.jpg         # Uploaded image 10
│   │   └── smiling-heart.jpg         # Uploaded image 5
│   ├── hub2-gaming/                  # 10 assets
│   ├── hub3-dashboard/               # 5 assets
│   ├── hub4-directory/               # 5 assets
│   └── shared/                       # 11 assets
│
├── shared/                           # Shared libraries
│   └── packages/
│       ├── design-system/            # Unified tokens
│       │   ├── tokens.css
│       │   ├── components/
│       │   └── utils/
│       ├── stats-schema/
│       └── api-client/
│
├── simulation-game/                  # Godot 4 project
│
├── render.yaml                       # Render deployment
├── vercel.json                       # Vercel config
├── docker-compose.yml                # Local dev
├── PROJECT_PLAN.md                   # Original plan
├── MASTER_PLAN_v2.md                 # Research-driven plan
└── INTEGRATION_PLAN_v3.md            # This document
```

---

## IMPLEMENTATION ROADMAP (Integrated)

### Phase 0: Foundation (Days 1-3)

**Day 1: Repository Setup**
- [ ] Create website/ directory structure
- [ ] Move visual assets to assets/
- [ ] Set up shared design-system package
- [ ] Configure GitHub Actions workflows

**Day 2: Design System Implementation**
- [ ] Create unified CSS tokens
- [ ] Implement typography scale
- [ ] Create color palette CSS variables
- [ ] Build shared component library

**Day 3: Main Portal**
- [ ] Build landing page with 4-hub navigation
- [ ] Implement checkerboard hero section
- [ ] Add cross-hub state management
- [ ] Deploy to GitHub Pages

### Phase 1: Hub 1 - satorXrotas (Days 4-7)

**Day 4: Foundation**
- [ ] Set up Three.js scene
- [ ] Implement SATOR Square 5×5 grid
- [ ] Add sacred geometry overlays

**Day 5: 3D Visualization**
- [ ] Build SATOR Sphere (Three.js)
- [ ] Implement particle systems
- [ ] Add rotational symmetry

**Day 6: Styling**
- [ ] Apply parchment textures
- [ ] Implement gold glow effects
- [ ] Add GSAP animations

**Day 7: Deployment**
- [ ] Connect to API endpoints
- [ ] Deploy to GitHub Pages
- [ ] Cross-browser testing

### Phase 2: Hub 2 - eSports-EXE (Days 8-12)

**Day 8: Next.js Setup**
- [ ] Initialize Next.js 14 project
- [ ] Configure Tailwind + Framer Motion
- [ ] Set up App Router structure

**Day 9: Hero Section**
- [ ] Build "DARE TO WEAR" hero
- [ ] Implement checkerboard pink boxes
- [ ] Slice B&W makeup photo into grid

**Day 10: Components**
- [ ] CRT scanline effects
- [ ] Energy border components
- [ ] Tournament bracket visualization

**Day 11: Data Integration**
- [ ] Connect SimRating™ API
- [ ] Real-time data streams
- [ ] Countdown timers

**Day 12: Deployment**
- [ ] Deploy to Vercel
- [ ] Performance optimization
- [ ] Lighthouse CI setup

### Phase 3: Hub 3 - Dashboard (Days 13-16)

**Day 13: React Setup**
- [ ] Initialize Vite + React project
- [ ] Configure Recharts
- [ ] Set up Zustand state

**Day 14: Charts & Panels**
- [ ] Line, Bar, Pie, Gauge charts
- [ ] SimRating™ panel
- [ ] RAR calculator

**Day 15: Real-time Data**
- [ ] WebSocket connections
- [ ] Auto-refresh functionality
- [ ] KPI cards

**Day 16: Deployment**
- [ ] Deploy to Vercel
- [ ] Connect to backend API

### Phase 4: Hub 4 - Directory (Days 17-19)

**Day 17: Foundation**
- [ ] Initialize Vite + React project
- [ ] Implement Swiss-style grid
- [ ] Set up Lucide icons

**Day 18: Search & Navigation**
- [ ] Real-time search with relevance
- [ ] Category filtering
- [ ] Service cards (3 variants)
- [ ] Keyboard shortcuts (Cmd+K)

**Day 19: Accessibility & Deploy**
- [ ] WCAG compliance
- [ ] ARIA labels
- [ ] Focus traps
- [ ] Deploy to Vercel

### Phase 5: Backend Completion (Days 20-26)

**Day 20-22: Pipeline Coordinator (Phase 1)**
- [ ] agent_manager.py
- [ ] main.py (FastAPI)
- [ ] conflict_resolver.py
- [ ] workers/

**Day 23-24: API Firewall (Phase 2A)**
- [ ] firewall.py middleware
- [ ] GAME_ONLY_FIELDS
- [ ] Request/response filtering

**Day 25-26: Testing**
- [ ] Unit tests (pytest)
- [ ] Integration tests
- [ ] Security audit

### Phase 6: Integration & Launch (Days 27-30)

**Day 27: System Integration**
- [ ] Connect all hubs to backend
- [ ] End-to-end testing
- [ ] Performance optimization

**Day 28: Deployment Pipeline**
- [ ] render.yaml
- [ ] vercel.json updates
- [ ] GitHub Actions CI/CD

**Day 29: Load Testing**
- [ ] k6 benchmarks
- [ ] Stress testing
- [ ] Optimization

**Day 30: Launch**
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Documentation finalization

---

## MASTER PROMPT DRAFT (For Agent Implementation)

### Prompt 1: Website Ecosystem Implementation

```markdown
## TASK: Implement 4-Hub Website Ecosystem

### Context
You are implementing the frontend layer of the SATOR-eXe-ROTAS platform, consisting of 4 themed hubs plus a main portal. The design system is "Checkerboard Lipstick" - Swiss Design × Dadaist Collage aesthetics.

### Visual Assets (Use These)
Location: /root/.openclaw/workspace/assets/

Hub 1 (satorXrotas) - Esoteric:
- arabic-astronomy.jpg - Celestial sphere diagram
- spiriti-damnati.png - Alchemical triangle diagram  
- jung-maps.jpg - Psychology archetype map
- lissajous.jpg - Mathematical figures
- dimensions-wellbeing.jpg - Spherical wellness diagram
- soul-elements.jpg - Layered consciousness
- smiling-heart.jpg - Emotional states diagram

### Deliverables

1. **Main Portal** (/website/main-portal/)
   - index.html with 4-hub navigation
   - Checkerboard hero section
   - "DARE TO WEAR" tagline
   - Cross-hub state management

2. **Hub 1: satorXrotas** (/website/hub1-satorxrotas/)
   - Three.js SATOR Sphere (3D visualization)
   - SATOR Square 5×5 grid (Latin palindrome)
   - Sacred geometry overlays
   - GSAP animations
   - Parchment textures + gold glow

3. **Hub 2: eSports-EXE** (/website/hub2-esports-exe/)
   - Next.js 14 project
   - "DARE TO WEAR" hero with checkerboard pink boxes
   - CRT scanline effects
   - SimRating™ display
   - Tournament brackets

4. **Hub 3: Dashboard** (/website/hub3-dashboard/)
   - React + Vite project
   - Glassmorphism panels
   - Recharts integration
   - Real-time data widgets

5. **Hub 4: Directory** (/website/hub4-directory/)
   - React + Vite project
   - Swiss-style grid
   - Real-time search
   - Service cards (3 variants)

### Design Tokens (Use Exactly)

```css
:root {
  /* Core */
  --cl-primary-black: #0A0A0A;
  --cl-accent-hot-pink: #FF006E;
  --cl-accent-neon-pink: #FF1493;
  
  /* Hub 1: satorXrotas */
  --sator-gold: #D4AF37;
  --sator-copper: #B87333;
  --sator-parchment: #F5F5DC;
  
  /* Hub 2: eSports-EXE */
  --exe-cyan: #00F0FF;
  --exe-electric: #39FF14;
  
  /* Typography */
  --font-display: 'Helvetica Neue', 'Inter', sans-serif;
  --font-esoteric: 'Cinzel', serif;
  --font-gaming: 'Orbitron', sans-serif;
}
```

### Technical Requirements

1. **Responsive**: Mobile-first, desktop-optimized
2. **Performance**: <3s LCP, >90 Lighthouse score
3. **Accessibility**: WCAG 2.1 AA compliant
4. **Animation**: 60fps, prefers-reduced-motion support

### API Integration Points

```javascript
// Connect to backend
const API_BASE = 'https://sator-api.onrender.com';

// Endpoints to use:
// GET /jobs/{id}/status
// GET /players/{id}/stats
// GET /health
// POST /agents/register
```

### Success Criteria

- [ ] All 4 hubs visually distinct but unified
- [ ] Main portal provides seamless navigation
- [ ] Three.js 3D sphere renders correctly
- [ ] All animations at 60fps
- [ ] Responsive on mobile/tablet/desktop
- [ ] API connections functional

### Constraints

- Use provided visual assets
- Follow design tokens exactly
- Free-tier only (GitHub Pages + Vercel)
- No external dependencies without approval
```

### Prompt 2: Backend Infrastructure Completion

```markdown
## TASK: Complete Backend Infrastructure (Phase 1 + 2A)

### Context
Complete the eSports-EXE backend infrastructure by implementing the Pipeline Coordinator and API Firewall. This enables dual-game (CS/Valorant) data extraction with security partitioning.

### Existing Files (DO NOT MODIFY)

1. models.py (550 LOC) - Pydantic v2 models
   - JobConfig, AgentConfig, BatchResult
   - GameType (CS/VALORANT), JobStatus, AgentStatus

2. queue_manager.py (500 LOC) - Priority queue
   - QueueManager class
   - add_job(), get_next_job(), complete_job()

### Files to Create

1. **agent_manager.py**
   ```python
   class AgentManager:
       async def register_agent(self, agent_config: AgentConfig) -> str
       async def heartbeat(self, agent_id: str) -> bool
       async def assign_work(self, agent_id: str) -> Optional[JobConfig]
       async def mark_busy(self, agent_id: str, job_id: str)
       async def mark_idle(self, agent_id: str)
   ```

2. **main.py** (FastAPI)
   ```python
   @app.post("/jobs/submit")
   @app.get("/jobs/{job_id}/status")
   @app.post("/agents/register")
   @app.post("/agents/{agent_id}/heartbeat")
   @app.get("/agents/{agent_id}/work")
   @app.post("/jobs/{job_id}/complete")
   ```

3. **conflict_resolver.py**
   ```python
   class ConflictResolver:
       async def check_duplicate(self, job: JobConfig) -> Optional[str]
       async def detect_drift(self, old_data: dict, new_data: dict) -> dict
       async def resolve_conflict(self, job_id1: str, job_id2: str) -> str
   ```

4. **workers/base_worker.py**
   ```python
   class BaseExtractionWorker(ABC):
       async def run(self)
       @abstractmethod
       async def extract(self, job: JobConfig) -> BatchResult
   ```

5. **workers/cs2_worker.py**
   - Uses HLTV client
   - GameType.CS

6. **workers/valorant_worker.py**
   - Uses VLR client
   - GameType.VALORANT

7. **firewall.py** (Phase 2A)
   ```python
   GAME_ONLY_FIELDS = {
       'cs': ['weapon_name', 'grenade_type', ...],
       'valorant': ['agent_name', 'ability_name', ...]
   }
   
   class FirewallMiddleware:
       async def validate_request(self, request)
       async def filter_response(self, response, game_type)
   ```

### Testing Requirements

- pytest coverage >80%
- All type hints complete
- Integration tests for API endpoints
- Security tests for firewall

### Success Criteria

- [ ] FastAPI app starts without errors
- [ ] All 6 API endpoints respond correctly
- [ ] Dual-game extraction tested
- [ ] Firewall blocks cross-partition access
- [ ] 100% type coverage
- [ ] All tests passing

### Integration

```bash
# Verify implementation
python -c "from coordinator.main import app; print('OK')"
pytest coordinator/tests/ -v --cov
```
```

---

## DEPLOYMENT CONFIGURATION

### GitHub Pages (Hub 1 + Main Portal)

```yaml
# .github/workflows/deploy-hub1.yml
name: Deploy satorXrotas
on:
  push:
    branches: [main]
    paths: ['website/hub1-satorxrotas/**']
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./website/hub1-satorxrotas
```

### Vercel (Hubs 2, 3, 4)

```json
// website/hub2-esports-exe/vercel.json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "API_BASE": "https://sator-api.onrender.com"
  }
}
```

### Render (Backend)

```yaml
# render.yaml
services:
  - type: web
    name: sator-api
    runtime: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn coordinator.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: DATABASE_URL
        fromDatabase:
          name: sator-db
          property: connectionString
      - key: JWT_SECRET
        generateValue: true

databases:
  - name: sator-db
    databaseName: sator
    user: sator
    plan: free
```

---

## BUDGET (Free Tier Only)

| Service | Provider | Free Tier Limits |
|---------|----------|------------------|
| Static Hosting | GitHub Pages | 1GB storage, 100GB/mo |
| Frontend Hosting | Vercel | 100GB bandwidth, 6k build mins |
| API Hosting | Render | 512MB RAM, 750hrs/mo |
| Database | Supabase | 500MB storage |
| CI/CD | GitHub Actions | 2,000 mins/mo |
| **Total** | | **$0/month** |

---

## SUCCESS METRICS

| Metric | Target | Measurement |
|--------|--------|-------------|
| Lighthouse Score | >90 | Chrome DevTools |
| API Response Time | <100ms p95 | Prometheus |
| Bundle Size | <200KB | Webpack Analyzer |
| Test Coverage | >80% | pytest-cov |
| Uptime | 99.9% | UptimeRobot |
| Cache Hit Rate | >85% | Redis metrics |

---

## CONCLUSION

This Integration Plan v3.0 merges the infrastructure strength of eSports-EXE with the visual excellence of the Checkerboard Lipstick 4-hub ecosystem. The result is a unified platform that:

1. **Honors the esoteric heritage** (satorXrotas hub with sacred geometry)
2. **Delivers gaming excellence** (eSports-EXE hub with Mission Control aesthetic)
3. **Provides data intelligence** (Dashboard hub with real-time analytics)
4. **Enables seamless navigation** (Directory hub with Swiss precision)
5. **Maintains technical rigor** (Backend infrastructure with 99.9% uptime target)

**Ready for implementation.**

---

*Document prepared by: Kimi Coding Agent*  
*Visual assets analyzed: 26 images*  
*Integration complexity: High*  
*Estimated implementation: 30 days*