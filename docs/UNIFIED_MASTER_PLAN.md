[Ver001.000]

# eSports-EXE — UNIFIED MASTER PLAN
## Comprehensive Development Roadmap & Coordination Document

**Repository:** notbleaux/eSports-EXE  
**Version:** 1.0.0  
**Date:** March 23, 2026  
**Status:** Foundation Complete — Implementation Ready  
**Estimated Duration:** 536 hours (13 weeks @ 42h/week, parallel execution)

---

## EXECUTIVE SUMMARY

This Unified Master Plan synthesizes all project documentation, MVP specifications, design systems, and development pipelines into a single coordinated roadmap. It serves as the central source of truth for the foreman-led development process.

### Core Philosophy

**"Type-first hierarchy, panelled lens architecture, motion for function only."**

The eSports-EXE platform demonstrates core value through match replay visualization, analytics dashboards, and hub-based organization—unified under a cohesive visual system inspired by GT Standard, Ciridae, and Endex.

### Document Hierarchy

```
UNIFIED_MASTER_PLAN.md (this document)
├── Strategic Layer: PRODUCT_PLAN.md, MVP_v2.md
├── Design Layer: STYLE_BRIEF_v2.md, DELIVERABLES_INDEX.md
├── Process Layer: CRIT_TEMPLATE_v2.md, AGENTS.md
├── Pipeline Layer: 3 Development Pipelines
│   ├── HEROES_MASCOTS_MASTER_PLAN.md
│   ├── HELP_ACCESSIBILITY_INTEGRATION_MASTER_PLAN.md
│   └── SPECMAPVIEWER_V2_EXPANSION_MASTER_PLAN.md
└── Implementation Layer: Job Board, Sprint Backlog
```

---

## PART 1: FOUNDATION DOCUMENTATION

### 1.1 MVP Specification (v2)

**Source:** `MVP_v2.md` [Ver002.000]

**Scope:**
| Module | Features |
|--------|----------|
| **Marketing Site** | Home, About, Roadmap, Contact, Docs index |
| **Demo App** | Read-only Match Viewer with timeline scrubber, event markers, contextual side panel |
| **API Stubs** | Static JSON endpoints (matches, players, events) |
| **Design System** | Tokens, typography, color, panels, tabs, data cards |
| **Deployment** | GitHub Pages or Cloudflare Pages |

**Acceptance Criteria:**
- [ ] Public URL with marketing pages and demo app
- [ ] Match viewer loads from `/api/demo/matches/{id}`
- [ ] Smooth timeline scrubbing with event markers
- [ ] Responsive down to 768px
- [ ] Lighthouse scores >90 (Performance, Accessibility, Best Practices, SEO)

### 1.2 Visual Style Brief (v2)

**Source:** `STYLE_BRIEF_v2.md` [Ver002.000]

**Design Principles:**
1. **Editorial Clarity:** Content reads with authority; hierarchy obvious
2. **Dashboard Behavior:** Hubs behave like tools; panels are interactive surfaces
3. **Accent Identity:** Each hub has distinct color while sharing core system
4. **Purposeful Motion:** Animations guide attention, never distract
5. **Accessible by Default:** Works for everyone

**Design Tokens:**

| Token | Value | Usage |
|-------|-------|-------|
| **Background** | `#F6F5F4` | Page background |
| **Text** | `#111217` | Primary text, headings |
| **Surface** | `#FFFFFF` | Cards, panels |
| **Border** | `#E5E5E7` | Dividers |

**Hub Accents:**
| Hub | Color | Hex |
|-----|-------|-----|
| Analytics | Electric Cyan | `#00D1FF` |
| Events | Amber | `#FFB86B` |
| Ops | Violet | `#9B7CFF` |
| TeNET CS | Steel Blue | `#2B6FA6` |
| TeNET Valorant | Neon Magenta | `#FF2D9C` |

**Typography Scale:**
| Element | Size | Line Height | Weight |
|---------|------|-------------|--------|
| H1 (Display) | 64px / 4rem | 1.05 | 700 |
| H2 | 40px / 2.5rem | 1.1 | 600 |
| H3 | 28px / 1.75rem | 1.15 | 600 |
| Body | 16-18px | 1.45 | 400 |
| Small | 14px | 1.5 | 400 |

### 1.3 CRIT Review Process (v2)

**Source:** `CRIT_TEMPLATE_v2.md` [Ver002.000]

**Session Parameters:**
- **Duration:** 60-90 minutes
- **Frequency:** Weekly during active development
- **Participants:** Moderator (required), Product Owner (required), Engineer (required), QA/Accessibility (recommended)

**Agenda:**
| Time | Phase | Activity |
|------|-------|----------|
| 0:00–0:10 | Opening | Context and goals |
| 0:10–0:25 | Walkthrough | Guided demo of current state |
| 0:25–0:55 | Critique Rounds | Three 10-minute focused rounds |
| 0:55–1:15 | Usability & a11y | Accessibility check |
| 1:15–1:25 | Prioritization | Rank issues, assign severity |
| 1:25–1:30 | Closing | Quick recap |

**Critique Rounds:**
1. **Round A:** Visual Hierarchy & Typography
2. **Round B:** Panels, Tabs & Interaction Patterns
3. **Round C:** Motion and Performance

---

## PART 2: EXISTING DELIVERABLES

### 2.1 Completed Assets (From DELIVERABLES_INDEX.md)

**Design System:**
- [x] `ui/tokens.css` — CSS variables for colors, typography, motion
- [x] 5 annotated SVG wireframes (1400×900px)
- [x] 7 HTML/CSS components (Tabs, Panel, Timeline, MatchViewer, etc.)

**Technical Specifications:**
- [x] TeNET CS Grenade Visualizer spec
- [x] TeNET Valorant Ability Timeline spec
- [x] Data architecture documentation
- [x] Complete schema reference

**Demo Data:**
- [x] `data/matches.json` — 5 sample matches
- [x] `data/replays/replay-001.json` — 24-round replay
- [x] `data/events.json` — Event type catalog
- [x] `data/hubs.json` — Hub definitions

### 2.2 Site Architecture

```
Home
├── Hero + value proposition
├── Hub selector
└── Featured match

Hubs
├── Analytics Hub (Cyan #00D1FF)
├── Events Hub (Amber #FFB86B)
├── Ops Hub (Violet #9B7CFF)
└── TeNET Hub
    ├── TeNET CS (Steel Blue #2B6FA6)
    └── TeNET Valorant (Neon Magenta #FF2D9C)

Match Viewer
├── Replay canvas
├── Timeline scrub
├── Event panel
└── Share/embed

Docs / API
└── Demo endpoints, schema, contribution guide

Governance
└── About, Roadmap, Contact, Security
```

---

## PART 3: DEVELOPMENT PIPELINES

### 3.1 Pipeline Overview

| Pipeline | Source Branch | Agents | Hours | Duration | Focus |
|----------|--------------|--------|-------|----------|-------|
| **Heroes & Mascots** | 18adbe1e | 32 | 168h | 4 weeks | Creative/visual identity |
| **Help & Accessibility** | 105bfaf1 | 30 | 144h | 3.5 weeks | Technical/systems architecture |
| **SpecMapViewer V2** | 7df305d5 | 36 | 224h | 5.5 weeks | Advanced visualization |
| **TOTAL** | — | **98** | **536h** | **13 weeks** | **Complete platform** |

### 3.2 Pipeline 1: Heroes & Mascots

**Source:** `docs/HEROES_MASCOTS_MASTER_PLAN.md`

**Core Deliverables:**
- 5 Heroes: Sol (Day/Leader), Lun (Night/Support), Bin (Strategist), Fat (Fate), Uni (Unity)
- 4 Mascots: CheCat, CheBun (little), NyxiaCat, LunariaBunny (anthro)
- 3 Villains: ADORE, HYBER, Vexor
- 13 Seasonal Styling Suites
- Mascot Editor with 13-tier economy

**Integration Points:**
- Hero overlays in SpecMapViewer (broadcast mode)
- Mascot companion in Help system
- Seasonal themes apply to all hubs

**Phase Breakdown:**
| Phase | Focus | Agents | Hours |
|-------|-------|--------|-------|
| 1 | Conceptualization | 9 | 72h |
| 2 | Web Hero Implementation | 6 | 48h |
| 3 | Godot Hero Implementation | 5 | 40h |
| 4 | Mascot Implementation | 6 | 48h |
| 5 | Visual Systems | 3 | 24h |
| 6 | Testing & Polish | 3 | 24h |

### 3.3 Pipeline 2: Help & Accessibility

**Source:** `docs/HELP_ACCESSIBILITY_INTEGRATION_MASTER_PLAN.md`

**Core Deliverables:**
- Unified Help System (single content source, progressive disclosure)
- WCAG 2.2 AA compliance (screen readers, keyboard nav, color-blind modes)
- Game-Web Integration (bidirectional sync, shared auth, HTML5 embed)
- Knowledge Graph (search, recommendations, learning paths)

**Integration Points:**
- Help overlays in all hubs
- Accessibility settings sync web→game
- Shared state with SpecMapViewer

**Phase Breakdown:**
| Phase | Focus | Agents | Hours |
|-------|-------|--------|-------|
| 1 | Unified Help System | 8 | 64h |
| 2 | Accessibility Architecture | 5 | 40h |
| 3 | Game-Web Integration | 5 | 40h |
| 4 | Advanced Features | 4 | 32h |
| 5 | Testing | 4 | 32h |
| 6 | Documentation | 4 | 32h |

### 3.4 Pipeline 3: SpecMapViewer V2

**Source:** `docs/SPECMAPVIEWER_V2_EXPANSION_MASTER_PLAN.md`

**Foundation (Already Complete):**
- DimensionManager.ts (5 modes, matrix math)
- CameraController.ts (60fps animations)
- Predictive4D.ts (WebGL foundation)
- Tests passing

**Expansion Deliverables:**
- 20+ Lens Ecosystem (8 tactical, 8 analytical, 4 broadcast, 10 creative)
- Real-Time Data Pipeline (WebSocket, 20 TPS)
- ML Prediction Engine (TensorFlow.js, position/outcome/pattern)
- Professional Broadcast Tools (observer controls, replay system)
- Multi-User Collaboration (annotations, 10+ users)
- Mobile Companion App

**Integration Points:**
- Core visualization for all match viewing
- ML predictions feed analytics hub
- Broadcast tools for live events

**Phase Breakdown:**
| Phase | Focus | Agents | Hours |
|-------|-------|--------|-------|
| 1 | Advanced Lens System | 8 | 64h |
| 2 | Real-Time Data | 5 | 40h |
| 3 | ML Prediction Engine | 5 | 40h |
| 4 | Broadcast Tools | 5 | 40h |
| 5 | Collaboration | 4 | 32h |
| 6 | Mobile Companion | 3 | 24h |
| 7 | Performance | 3 | 24h |
| 8 | Testing & Docs | 3 | 24h |

---

## PART 4: UNIFIED COORDINATION

### 4.1 Cross-Pipeline Dependencies

```
┌─────────────────────────────────────────────────────────────────┐
│                    CROSS-PIPELINE GRAPH                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Heroes & Mascots ──────┬──► SpecMapViewer (broadcast overlays) │
│  (Pipeline 1)           │                                        │
│                         └──► Help System (mascot guides)         │
│                                                                  │
│  Help & Accessibility ──┬──► SpecMapViewer (help overlays)       │
│  (Pipeline 2)           │                                        │
│                         ├──► All Hubs (WCAG compliance)          │
│                         └──► Heroes (accessibility settings)     │
│                                                                  │
│  SpecMapViewer ─────────┬──► Help System (visualization help)    │
│  (Pipeline 3)           │                                        │
│                         ├──► All Hubs (match viewer)             │
│                         └──► Mobile (companion app)              │
│                                                                  │
│  SHARED INFRASTRUCTURE:                                          │
│  ├── Zustand stores                                              │
│  ├── WebSocket layer                                             │
│  ├── TensorFlow.js ML                                            │
│  └── Godot integration                                           │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 Shared Infrastructure

All three pipelines depend on and contribute to shared infrastructure:

| Infrastructure | Owner | Users | Status |
|---------------|-------|-------|--------|
| **Zustand Stores** | Pipeline 2 | All | Design needed |
| **WebSocket Layer** | Pipeline 2 | Pipelines 1, 3 | Design needed |
| **TensorFlow.js** | Pipeline 3 | Pipeline 2 | Foundation ready |
| **Godot Bridge** | Pipeline 1 | Pipelines 2, 3 | Foundation ready |
| **Design Tokens** | STYLE_BRIEF | All | ✅ Complete |
| **Component Library** | DELIVERABLES | All | ✅ Complete |

### 4.3 Unified Quality Gates

| Gate | Description | Criteria | Owner Pipeline |
|------|-------------|----------|----------------|
| **G1** | Design System | Tokens, components, wireframes match STYLE_BRIEF | All |
| **G2** | Heroes Complete | 5 heroes, 4 mascots, functional in web+Godot | Pipeline 1 |
| **G3** | Help System | Unified help, progressive disclosure, 3 languages | Pipeline 2 |
| **G4** | Accessibility | WCAG 2.2 AA, Lighthouse 100 | Pipeline 2 |
| **G5** | Lens System | 20+ lenses, compositable, 60fps | Pipeline 3 |
| **G6** | Real-Time | <100ms latency, replay system | Pipeline 3 |
| **G7** | ML Engine | 70%+ accuracy, <10MB models | Pipeline 3 |
| **G8** | Integration | Cross-pipeline features functional | All |
| **G9** | Performance | Lighthouse >90, mobile 30fps | All |
| **G10** | Release Ready | 80% test coverage, docs complete | All |

### 4.4 CRIT Schedule by Pipeline

| Week | Pipeline 1 Focus | Pipeline 2 Focus | Pipeline 3 Focus |
|------|------------------|------------------|------------------|
| 1 | Hero concepts | Help schema | Lens framework |
| 2 | Web components | Web help UI | Analytical lenses |
| 3 | Godot heroes | A11y foundation | Tactical lenses |
| 4 | Mascots | Godot a11y | Real-time data |
| 5 | Visual systems | State sync | ML prediction |
| 6 | Testing | Testing | Broadcast tools |
| 7 | — | Documentation | Collaboration |
| 8 | — | — | Mobile + Performance |
| 9-13 | — | — | Testing + Docs |

---

## PART 5: IMPLEMENTATION ROADMAP

### 5.1 Execution Strategy

**Parallel Execution:**
- All three pipelines run simultaneously
- Shared infrastructure coordinated via foreman
- Weekly cross-pipeline sync meetings
- Dependency blocking tracked in job board

**Priority Order (within pipelines):**
1. Foundation/Architecture (Phase 1 of each)
2. Core Features (Phase 2-3)
3. Integration (Phase 4-5)
4. Polish/Release (Final phases)

### 5.2 Sprint Structure

**Sprint Duration:** 2 weeks  
**Sprint Planning:** Monday, Week 1  
**Sprint Review:** Friday, Week 2  
**CRIT Session:** Wednesday, Week 2

**Sprint Backlog Sources:**
- Pipeline task files (`.job-board/01_LISTINGS/`)
- Cross-pipeline integration tasks
- CRIT feedback items
- Bug reports

### 5.3 Job Listing Board (JLB) Coordination

**Structure:**
```
.job-board/
├── README.md                         # Multi-pipeline overview
├── UNIFIED_MASTER_PLAN.md            # This document (reference)
├── FOREMAN_*.md                      # Per-pipeline tracking
├── 01_LISTINGS/ACTIVE/               # Ready tasks (all pipelines)
├── 02_CLAIMED/{agent-id}/            # Agent work directories
├── 03_COMPLETED/                     # Approved work
├── 04_BLOCKS/                        # Cross-pipeline blockers
└── 05_TEMPLATES/                     # Submission templates
```

**Claim Process:**
1. Agent reviews available tasks across all pipelines
2. Claims task by moving to `02_CLAIMED/{agent-id}/`
3. Submits via `SUBMISSION_{task}.md`
4. Foreman reviews with 4-pass protocol
5. Approved work moves to `03_COMPLETED/`

### 5.4 Foreman Protocol (Unified)

**4-Pass Review (per submission):**
1. **Scout:** File exists, runs without errors
2. **Plan:** Matches spec, notes deviations
3. **Review:** Code quality, accessibility, performance
4. **Implement:** Approve or specific changes required

**Cross-Pipeline Coordination:**
1. Identify shared infrastructure needs
2. Assign infrastructure tasks to appropriate pipeline
3. Track dependencies in `04_BLOCKS/`
4. Weekly sync to resolve cross-cutting concerns

---

## PART 6: RISK MANAGEMENT

### 6.1 Risk Register

| Risk | Likelihood | Impact | Mitigation | Owner |
|------|------------|--------|------------|-------|
| Scope creep | High | High | Strict gate criteria, weekly CRIT | Foreman |
| Pipeline conflict | Medium | High | Shared infra coordination, JLB tracking | Foreman |
| ML model accuracy | Medium | High | Fallback heuristics, iterative training | Pipeline 3 |
| WebSocket reliability | Medium | Medium | Reconnection logic, offline mode | Pipeline 2 |
| WebGL compatibility | Low | High | Canvas2D fallback, feature detection | Pipeline 3 |
| Resource contention | Medium | Medium | Agent coordination, parallel waves | Foreman |
| Integration failures | Medium | High | Early integration testing, stubs | All |

### 6.2 Mitigation Strategies

**For Scope Creep:**
- Strict adherence to MVP acceptance criteria
- CRIT sessions review scope weekly
- Change requests require foreman approval
- "Parking lot" for post-MVP features

**For Pipeline Conflicts:**
- Shared infrastructure defined upfront
- Clear ownership per component
- Dependency tracking in job board
- Weekly cross-pipeline sync

**For Technical Risks:**
- Proof-of-concept for risky features
- Fallback implementations
- Performance budgets enforced
- Browser/device testing matrix

---

## PART 7: SUCCESS METRICS

### 7.1 MVP Success Criteria

| Criterion | Target | Measurement |
|-----------|--------|-------------|
| Public deployment | ✅ Live URL | GitHub Pages accessible |
| Match viewer | ✅ Functional | Loads, scrubs, displays events |
| Responsive design | ✅ 768px+ | Device testing |
| Lighthouse scores | >90 all categories | Automated audit |
| Component library | ✅ 7 components | Visual regression tests |
| Cross-browser | Chrome, Firefox, Safari | Manual testing |

### 7.2 Pipeline Success Criteria

**Pipeline 1 (Heroes & Mascots):**
- 5 heroes with distinct personalities
- 4 mascots with editor system
- 13 seasonal suites functional
- Cross-platform presence (web + Godot)

**Pipeline 2 (Help & Accessibility):**
- Unified help content schema
- WCAG 2.2 AA compliance
- Bidirectional web-game sync
- Knowledge graph with search

**Pipeline 3 (SpecMapViewer):**
- 20+ lenses at 60fps
- Real-time data <100ms latency
- ML predictions 70%+ accuracy
- Professional broadcast tools

### 7.3 Unified Platform Success

| Metric | Target | Timeline |
|--------|--------|----------|
| User engagement | 5 min avg session | Week 13 |
| Help effectiveness | <3 help requests per session | Week 13 |
| Accessibility | 100% WCAG AA | Week 13 |
| Performance | 60fps desktop, 30fps mobile | Week 13 |
| Collaboration | 10+ concurrent users | Week 13 |

---

## PART 8: DOCUMENTATION & REFERENCES

### 8.1 Core Documents

| Document | Purpose | Location |
|----------|---------|----------|
| `UNIFIED_MASTER_PLAN.md` | This document — central coordination | `docs/` |
| `PRODUCT_PLAN.md` | Executive summary, roadmap | `PRODUCT_PLAN.md` |
| `MVP_v2.md` | One-page MVP specification | `MVP_v2.md` |
| `STYLE_BRIEF_v2.md` | Design tokens, principles | `STYLE_BRIEF_v2.md` |
| `CRIT_TEMPLATE_v2.md` | Review process | `CRIT_TEMPLATE_v2.md` |
| `DELIVERABLES_INDEX.md` | Completed assets index | `DELIVERABLES_INDEX.md` |
| `AGENTS.md` | Project conventions | `AGENTS.md` |

### 8.2 Pipeline Documents

| Pipeline | Master Plan | Tracking |
|----------|-------------|----------|
| Heroes & Mascots | `docs/HEROES_MASCOTS_MASTER_PLAN.md` | `.job-board/FOREMAN_HEROES_MASCOTS_TRACKING.md` |
| Help & Accessibility | `docs/HELP_ACCESSIBILITY_INTEGRATION_MASTER_PLAN.md` | `.job-board/FOREMAN_HELP_ACCESSIBILITY_TRACKING.md` |
| SpecMapViewer V2 | `docs/SPECMAPVIEWER_V2_EXPANSION_MASTER_PLAN.md` | `.job-board/FOREMAN_SPECMAPVIEWER_V2_TRACKING.md` |

### 8.3 Implementation Documents

| Document | Purpose | Location |
|----------|---------|----------|
| Job Board | Task listings, claims | `.job-board/README.md` |
| Sprint Backlog | Tickets, acceptance criteria | `docs/SPRINT_BACKLOG.md` |
| Project Notebook | Daily tracking | `docs/PROJECT_NOTEBOOK.md` |

---

## APPENDIX A: QUICK REFERENCE

### A.1 Version Numbers

All documents use `[VerMMM.mmm]` format:
- Major (MMM): Structural changes
- Minor (mmm): Content updates

### A.2 Status Emojis

| Emoji | Meaning |
|-------|---------|
| 🔵 | Ready to claim |
| 🟡 | In progress |
| 🟠 | In review |
| 🟢 | Approved/complete |
| 🔴 | Changes requested |
| ⏳ | Queued (dependencies) |
| ⛔ | Blocked |

### A.3 File Naming Conventions

| Type | Pattern | Example |
|------|---------|---------|
| Master plans | `*_MASTER_PLAN.md` | `HEROES_MASCOTS_MASTER_PLAN.md` |
| Tracking | `FOREMAN_*_TRACKING.md` | `FOREMAN_HELP_ACCESSIBILITY_TRACKING.md` |
| Task files | `{PIPE}_WAVE_*_AGENT_*.md` | `HELP_WAVE_1_1_AGENT_1A.md` |
| Submissions | `SUBMISSION_{agent}_v{N}.md` | `SUBMISSION_1A_v1.md` |

---

## APPENDIX B: CHANGE LOG

| Version | Date | Changes |
|---------|------|---------|
| Ver001.000 | 2026-03-23 | Initial unified master plan |

---

*This document is maintained by the Foreman. Update with [VerMMM.mmm] on each revision.*
*All agents must reference this document for coordination and context.*
