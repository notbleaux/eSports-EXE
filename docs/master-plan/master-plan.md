# eSports-EXE Master Plan
## The Single Source of Truth for Project Direction

> **Version:** 1.0.0  
> **Last Updated:** 2026-03-31  
> **Status:** ACTIVE  
> **Approver:** Elijah Bleaux (notbleaux)

---

## 1. Purpose & Philosophy

### What This Document Is
The Master Plan is the **immutable reference** that prevents Design Drift and Architecture Drift. When in doubt, consult this document. When conflicting ideas arise, this document resolves them.

### What This Document Is NOT
- Not a detailed technical spec (see ADRs for that)
- Not a design system (see design-system/ for that)
- Not a task tracker (use your preferred PM tool)

### Core Philosophy: TENET Architecture
The project follows the TENET layered architecture:

```
TENET (Meta-Layer)
    └── WorldHUBs Database
        └── tenet (Game-Specific Instance)
            └── tezet (Four HUBs)
                ├── ROTAS — Stats Reference
                ├── SATOR — Advanced Analytics
                ├── OPERA — Pro Scene Information
                └── AREPO — Community & Forums
```

**Golden Rule:** Every feature, component, and decision must map to one of these four HUBs. If it doesn't fit, it doesn't ship.

---

## 2. Strategic Pillars

These five pillars are non-negotiable. They guide every decision.

### Pillar 1: Cross-Game Unification
**Statement:** eSports-EXE is the first platform to provide unified analytics across multiple esports titles.

**Implications:**
- Player ratings must be comparable across games
- Tournament structures must be normalized
- Stats must have cross-game semantic meaning

**Anti-Patterns:**
- ❌ Game-specific silos that don't communicate
- ❌ Different UI patterns for different games
- ❌ Separate databases per game

### Pillar 2: Progressive Disclosure
**Statement:** The interface adapts to user expertise, not the other way around.

**Three-Tier Model:**
1. **Casual** — Scores, schedules, highlights
2. **Aspiring** — Match details, player stats, context
3. **Professional** — Deep analytics, raw data, custom dashboards

**Implications:**
- Every view must have a "complexity toggle"
- Default to casual, enable deeper exploration
- No expert-only features without casual equivalents

### Pillar 3: Historical Authority
**Statement:** Data without context is noise. We provide the narrative.

**Implications:**
- Every stat must have historical comparison
- Career trajectories are first-class features
- "When did this player switch teams?" is a core query

### Pillar 4: Community-Driven Intelligence
**Statement:** The crowd sees things algorithms miss.

**Implications:**
- User predictions inform our models
- Forum discussions surface insights
- Fan narratives complement statistical analysis

### Pillar 5: Technical Excellence
**Statement:** Build for the future, not for today.

**Implications:**
- Type safety is mandatory
- Test coverage is non-negotiable
- Performance budgets are enforced
- Accessibility is a feature, not an afterthought

---

## 3. Architecture Boundaries

### 3.1 Frontend Boundaries

**Tech Stack (Locked):**
- React 18+ with TypeScript
- TailwindCSS for styling
- Framer Motion for animations
- TanStack Query for data fetching
- Recharts for visualizations

**Component Architecture:**
```
src/
├── components/          # Shared UI components
│   ├── ui/             # Primitive components (buttons, inputs)
│   ├── layout/         # Layout components (nav, footer)
│   └── data-display/   # Charts, tables, stat cards
├── hub-1-sator/        # SATOR HUB (self-contained)
├── hub-2-rotas/        # ROTAS HUB (self-contained)
├── hub-3-arepo/        # AREPO HUB (self-contained)
├── hub-4-opera/        # OPERA HUB (self-contained)
├── hub-5-tenet/        # TENET Meta-HUB
├── shared/             # Cross-HUB utilities
│   ├── api/            # API clients and hooks
│   ├── types/          # Shared TypeScript types
│   └── utils/          # Helper functions
└── lib/                # Third-party configurations
```

**Boundary Rules:**
1. HUBs cannot import from other HUBs (isolation)
2. Shared components must be game-agnostic
3. Types must live in shared/types/
4. No direct API calls outside of shared/api/

### 3.2 Backend Boundaries

**Tech Stack (Locked):**
- Python 3.11+
- FastAPI for API layer
- PostgreSQL for primary data
- Redis for caching
- Celery for background tasks

**Service Architecture:**
```
services/
├── api/                    # FastAPI application
│   ├── src/njz_api/
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   ├── clients/        # External API clients
│   │   └── rotas/          # ROTAS-specific logic
│   └── tests/
├── ml/                     # Machine learning pipeline
│   ├── models/             # Trained models
│   ├── training/           # Training scripts
│   └── inference/          # Inference API
└── etl/                    # Data ingestion
    ├── sources/            # Data source connectors
    └── transforms/         # Data transformations
```

**Boundary Rules:**
1. Services communicate via API contracts only
2. No direct database access across service boundaries
3. External APIs must use circuit breakers
4. All data transformations must be logged

### 3.3 Data Boundaries

**Normalization Rules:**
1. Players have global IDs (not per-game)
2. Teams have global IDs with game-specific rosters
3. Tournaments have tier classifications (S-Tier, A-Tier, etc.)
4. Stats have semantic types (KDA is KDA, regardless of game)

**Game-Specific Mappings:**
```yaml
# Example: Cross-game stat normalization
stats:
  kda:
    valorant: "KDA"
    cs2: "KDR"
    formula: "(kills + assists) / deaths"
  
  rating:
    valorant: "ACS"
    cs2: "HLTV Rating 2.0"
    normalized: "SATOR_Rating"
```

---

## 4. Design System Contracts

### 4.1 Color System (Immutable)

```css
/* Primary Palette */
--color-bg-primary: #0F172A;      /* Deep slate - main background */
--color-bg-secondary: #1E293B;    /* Lighter slate - cards, panels */
--color-bg-tertiary: #334155;     /* Borders, dividers */

/* Accent Colors */
--color-accent-rotas: #14B8A6;    /* Teal - Stats, data */
--color-accent-sator: #8B5CF6;    /* Violet - Analytics, ML */
--color-accent-opera: #F97316;    /* Orange - Matches, live events */
--color-accent-arepo: #EC4899;    /* Pink - Community, social */

/* Semantic Colors */
--color-success: #22C55E;
--color-warning: #EAB308;
--color-error: #EF4444;
--color-info: #3B82F6;

/* Text Colors */
--color-text-primary: #F8FAFC;
--color-text-secondary: #94A3B8;
--color-text-muted: #64748B;
```

**Rules:**
- No new colors without ADR approval
- All colors must have WCAG 4.5:1 contrast minimum
- Dark mode is default; light mode is secondary

### 4.2 Typography System (Immutable)

```css
/* Font Families */
--font-heading: 'Inter', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Scale (Major Third - 1.25) */
--text-xs: 0.75rem;      /* 12px */
--text-sm: 0.875rem;     /* 14px */
--text-base: 1rem;       /* 16px */
--text-lg: 1.125rem;     /* 18px */
--text-xl: 1.25rem;      /* 20px */
--text-2xl: 1.5rem;      /* 24px */
--text-3xl: 1.875rem;    /* 30px */
--text-4xl: 2.25rem;     /* 36px */
```

**Rules:**
- Headings use font-heading
- Data tables use font-mono for alignment
- Body text never smaller than text-base (16px)

### 4.3 Spacing System (Immutable)

```css
/* 4px base unit */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
```

### 4.4 Component Primitives

**Button Variants:**
- `primary` — Main actions, accent color
- `secondary` — Alternative actions, muted
- `ghost` — Low emphasis, text only
- `danger` — Destructive actions

**Card Variants:**
- `default` — Standard content container
- `interactive` — Hover state, clickable
- `stat` — Data display, monospace numbers
- `match` — Match summary, specific layout

**Input Variants:**
- `text` — Standard text input
- `search` — Search with icon
- `select` — Dropdown selection
- `toggle` — Boolean switch

---

## 5. API Contracts

### 5.1 REST API Standards

**Base URL:** `/api/v1/`

**Response Format:**
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "per_page": 20,
    "total": 150
  },
  "error": null
}
```

**Error Format:**
```json
{
  "success": false,
  "data": null,
  "meta": {},
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": { ... }
  }
}
```

### 5.2 Endpoint Categories

**ROTAS Endpoints:**
- `GET /players` — List players with stats
- `GET /players/:id` — Player profile
- `GET /teams` — List teams
- `GET /matches` — Match history
- `GET /matches/:id` — Match details

**SATOR Endpoints:**
- `GET /analytics/player/:id` — Player analytics
- `GET /predictions/match/:id` — Match predictions
- `GET /ratings/leaderboard` — Rating rankings

**OPERA Endpoints:**
- `GET /tournaments` — Tournament listings
- `GET /tournaments/:id` — Tournament details
- `GET /live-matches` — Currently live matches
- `GET /news` — News articles

**AREPO Endpoints:**
- `GET /forums` — Forum categories
- `GET /threads` — Discussion threads
- `POST /threads` — Create thread
- `GET /predictions/user/:id` — User predictions

### 5.3 WebSocket Events

**Live Match Updates:**
- `match:started` — Match begins
- `match:update` — Score/timeline update
- `match:ended` — Match concludes

**User Notifications:**
- `notification:new` — New notification
- `notification:read` — Mark as read

---

## 6. Development Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Stable development environment and design system

**Deliverables:**
- [ ] Design tokens implemented in Tailwind config
- [ ] Component library with Storybook
- [ ] API contract documentation
- [ ] CI/CD pipeline for automated testing

**Success Criteria:**
- `pnpm build` passes with zero errors
- Component library has 20+ documented components
- API contracts have OpenAPI specs

### Phase 2: ROTAS MVP (Weeks 3-6)
**Goal:** Functional stats reference HUB

**Deliverables:**
- [ ] Player/Team database schema
- [ ] PandaScore data ingestion pipeline
- [ ] Player profile pages
- [ ] Team roster pages
- [ ] Match result listings
- [ ] Stats tables with sorting/filtering

**Success Criteria:**
- Can view real match data from last 30 days
- Player stats are searchable and filterable
- Page load time < 2 seconds

### Phase 3: SATOR Analytics (Weeks 7-10)
**Goal:** Advanced analytics and predictions

**Deliverables:**
- [ ] Rating algorithm implementation
- [ ] Player comparison tool
- [ ] Match prediction models
- [ ] Performance trend charts
- [ ] Anomaly detection for upsets

**Success Criteria:**
- Rating system has explanatory transparency
- Predictions have confidence intervals
- Charts are interactive and responsive

### Phase 4: OPERA Live Scene (Weeks 11-14)
**Goal:** Pro scene information and live coverage

**Deliverables:**
- [ ] Tournament bracket visualizations
- [ ] Live match integration
- [ ] News content management
- [ ] Observer interface tools
- [ ] Calendar/schedule views

**Success Criteria:**
- Live match data updates in real-time
- Tournament brackets are interactive
- News articles support rich media

### Phase 5: AREPO Community (Weeks 15-18)
**Goal:** Community engagement features

**Deliverables:**
- [ ] Forum thread system
- [ ] User prediction tracking
- [ ] Reputation/badges system
- [ ] Content moderation tools
- [ ] Social sharing features

**Success Criteria:**
- Users can create and reply to threads
- Prediction accuracy is tracked over time
- Moderation queue processes within 24 hours

### Phase 6: Integration & Polish (Weeks 19-22)
**Goal:** Cross-HUB features and performance optimization

**Deliverables:**
- [ ] Unified search across all HUBs
- [ ] Cross-HUB navigation
- [ ] Mobile responsiveness audit
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG 2.1 AA)

**Success Criteria:**
- Lighthouse score > 90 across all categories
- Mobile experience is first-class
- Accessibility audit passes with zero critical issues

---

## 7. Governance Model

### 7.1 Decision-Making Authority

**TIER 1: Master Plan Changes (Architectural)**
- **Approver:** Elijah Bleaux only
- **Scope:** Changes to pillars, boundaries, or contracts
- **Process:** ADR required → Review → Approval

**TIER 2: Design System Changes**
- **Approver:** Design Lead + Technical Lead
- **Scope:** New components, color additions, typography changes
- **Process:** Proposal → Design review → Implementation

**TIER 3: Feature Implementation**
- **Approver:** Technical Lead
- **Scope:** Feature development within existing boundaries
- **Process:** Task assignment → Development → Code review

### 7.2 Change Control Process

**When You Want to Change Something:**

1. **Check This Document First**
   - Does the change violate any pillar?
   - Does it cross any boundary?
   - Has this been tried before? (Check ADRs)

2. **Create an ADR (Architecture Decision Record)**
   - Template in `docs/adrs/adr-template.md`
   - Explain the problem
   - List considered options
   - State the decision
   - Document consequences

3. **Submit for Review**
   - TIER 1: Direct to Elijah
   - TIER 2: Design/Technical leads
   - TIER 3: Standard code review

4. **Update Documentation**
   - If approved, update Master Plan
   - Update ADR status to "Accepted"
   - Update relevant docs

### 7.3 Anti-Drift Mechanisms

**Weekly Architecture Review:**
- Review all ADRs from the week
- Check for boundary violations
- Ensure design system compliance

**Monthly Master Plan Audit:**
- Does the code match the plan?
- Are there undocumented deviations?
- Should the plan evolve?

**Quarterly Strategy Review:**
- Are the pillars still correct?
- Is the roadmap on track?
- What have we learned?

---

## 8. Quality Gates

### 8.1 Code Quality

**Before Any PR Merges:**
- [ ] TypeScript compiles with zero errors
- [ ] Linting passes (`pnpm lint`)
- [ ] Tests pass (`pnpm test`)
- [ ] No console errors in dev tools
- [ ] Design system compliance verified

### 8.2 Design Quality

**Before Any UI Ships:**
- [ ] Matches Figma/design specs pixel-perfectly
- [ ] Responsive at all breakpoints
- [ ] Color contrast meets WCAG AA
- [ ] Animations are performant (60fps)
- [ ] Progressive disclosure implemented

### 8.3 Data Quality

**Before Any Data Feature Ships:**
- [ ] Data sources are documented
- [ ] Validation rules are in place
- [ ] Error states are handled
- [ ] Loading states are implemented
- [ ] Cache strategy is defined

---

## 9. Documentation Standards

### 9.1 Required Documentation

**Every HUB Must Have:**
- `README.md` — Overview and quick start
- `ARCHITECTURE.md` — Technical architecture
- `API.md` — API endpoints and contracts

**Every Component Must Have:**
- JSDoc comments
- Usage example
- Props documentation
- Edge case handling

**Every ADR Must Have:**
- Context (why now?)
- Decision (what was chosen?)
- Consequences (what are the trade-offs?)

### 9.2 Documentation Maintenance

**Rule:** Code and docs change together. No exceptions.

**Checklist:**
- [ ] README updated with new features
- [ ] API docs updated with new endpoints
- [ ] ADRs created for architectural changes
- [ ] Comments added for complex logic

---

## 10. Appendices

### Appendix A: Glossary

**TENET:** The meta-layer architecture connecting all HUBs  
**tezet:** A game-specific instance containing four HUBs  
**ROTAS:** Stats Reference HUB (raw data)  
**SATOR:** Advanced Analytics HUB (insights, predictions)  
**OPERA:** Pro Scene Information HUB (tournaments, matches)  
**AREPO:** Community HUB (forums, engagement)  
**ADR:** Architecture Decision Record  
**Progressive Disclosure:** UI pattern revealing complexity gradually  

### Appendix B: Reference Documents

- Design System: `docs/design-system/README.md`
- API Contracts: `docs/api-contracts/openapi.yaml`
- Roadmap: `docs/roadmap/roadmap.md`
- ADRs: `docs/adrs/`

### Appendix C: External References

- UI Design Briefing: `UI_DESIGN_CONSULTANCY_BRIEFING.md`
- Repository Audit: `memory/REPOSITORY_AUDIT_2026-03-30.md`
- Stabilization Plan: `memory/STABILIZATION_PLAN.md`

---

## Signatures

By approving this document, you agree to:
1. Uphold the strategic pillars
2. Respect architecture boundaries
3. Follow the governance process
4. Maintain documentation standards

**Approved By:**

| Name | Role | Date | Signature |
|------|------|------|-----------|
| Elijah Bleaux | Project Owner / Architect | 2026-03-31 | ✅ APPROVED |

---

**Document Control:**
- Version: 1.0.0
- Last Updated: 2026-03-31
- Next Review: 2026-04-30
- Status: ACTIVE ✅
