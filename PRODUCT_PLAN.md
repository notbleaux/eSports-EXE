[Ver001.000]

# eSports-EXE — Product Plan
## Executive Summary & Implementation Roadmap

**Goal**: Turn notbleaux/eSports-EXE into a focused, free-hosted public product that demonstrates core platform value (match replay, analytics, hubs) while shipping a unified, type-first visual system inspired by GT Standard, Detail, and Endex.

**Date**: 2026-03-22  
**Status**: Approved for Implementation  
**Budget**: Zero-cost (GitHub Pages)  
**Timeline**: 5-7 weeks to public MVP  

---

## 🎯 Executive Summary

Keep the repo lean: surface a marketing/demo site, a read-only match viewer, and a small component library; archive legacy artifacts.

**Core Value Proposition**:
- Match replay with timeline scrubbing and event markers
- Analytics dashboards for coaches and analysts  
- Hub-based organization (Analytics, Events, Ops, TeNET)
- Type-first, motion-forward design system

**Technical Approach**:
- Static front end (React + Vite or plain HTML/CSS/JS)
- Deployed to GitHub Pages or Cloudflare Pages
- Demo JSON endpoints under `/public/api/demo/*.json`
- Component library in `ui/` with CSS variables tokens

---

## 📊 Current Repo Posture

| Aspect | Status | Action |
|--------|--------|--------|
| **Codebase** | Large hybrid (backend, simulation, replay, web) | Archive legacy; focus on public MVP surface |
| **Design** | No unified system | Adopt tokens-first approach; create `ui/` folder |
| **Docs** | Operational docs mixed with public | Archive deep runbooks; keep public governance |
| **UI** | Inconsistent patterns | Enforce unified component library |

---

## 🏗️ Site Architecture

### Top-Level Site Map

```
Home
├── Hero + value proposition
├── Hub selector
└── Featured match

Hubs
├── Analytics Hub (Cyan accent)
├── Events Hub (Amber accent)
├── Ops Hub (Violet accent)
└── TeNET Hub
    ├── TeNET CS (Steel Blue accent)
    └── TeNET Valorant (Neon Magenta accent)

Match Viewer
├── Replay canvas
├── Timeline scrub
├── Event panel
└── Share/embed

Docs / API
├── Demo endpoints
├── Data schema
└── Contribution guide

Governance
├── About
├── Roadmap
├── Contact
└── Security
```

---

## 🎨 Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Type First** | Headings and scale drive hierarchy; body copy calm and readable |
| **Panelled Lenses** | Hubs composed of stacked, interactive panels |
| **Motion for Function** | Entrance and panel transitions guide attention; no decorative motion |
| **Per-Hub Flair** | Single accent token + micro-motion signature per hub |
| **Data Clarity** | Tables, KPIs, sparklines optimized for glanceability and accessibility |

---

## 🧩 Unified Component System (MVP)

| Component | Purpose | Key Props |
|-----------|---------|-----------|
| **Top Nav** | Global navigation, hub selector, search | Compact; hub badge |
| **Hub Tabs** | Switch lenses inside a hub | Animated underline; keyboard focus |
| **Panel** | Modular container for tools/content | Header, actions, collapsible |
| **Data Card** | KPI + sparkline + CTA | Small, medium, large sizes |
| **Match Viewer** | Replay canvas + timeline | Scrub, markers, event focus |
| **Timeline** | Event navigation | Zoom, scrub, marker tooltips |
| **Badge** | Status indicator | Color token driven |

### Component Files
- `ui/tokens.css` — CSS variables for colors, spacing, radii
- `ui/components/` — Tabs, Panel, DataCard, Timeline, MatchViewer

---

## 🏢 Hub Specifications

### Hub Template (Shared)

**Layout**: Asymmetric two-column (content 65% / context 35%) on desktop; stacked on mobile

**Structure**:
- Header: Hub title, description, accent chip, quick filters
- Primary area: Panel stack (KPI row, matches list, spotlight)
- Context column: Filters, saved views, notes, actions
- Interaction: Tabs for lenses (Overview, Live, Replays, Insights)

**Accessibility**: Keyboard tabbing, ARIA roles, color contrast >= 4.5:1

---

### Analytics Hub (Accent: Cyan #00D1FF)

**Purpose**: Deep match analytics, player metrics, heatmaps, event breakdowns

**Users**: Analysts, coaches, data scientists

**Key Screens**:
- **Overview**: KPI row (matches, avg K/D, avg round time), recent matches, quick compare
- **Match Detail**: Large match viewer; timeline with filters; per-player stat cards
- **Compare Lens**: Side-by-side comparison with synchronized scrub
- **Export/Share**: Shareable snapshots

**Components & Interactions**:
- KPI row: numeric + sparkline; hover reveals mini-chart
- Heatmap panel: interactive map overlay; opacity slider
- Player card: role, key metrics, recent form sparkline

**Motion Language**:
- Panel reveal: cross-fade + scale 200ms
- Timeline scrub: scrub head with subtle glow and marker pulse

**Acceptance**: Timeline filters update charts in <200ms

---

### Events Hub (Accent: Amber #FFB86B)

**Purpose**: Schedule, manage, and present tournaments and live events

**Users**: Organizers, casters, community managers

**Key Screens**:
- **Calendar view**: Day/week/month with match cards
- **Event page**: Hero with schedule, bracket, live match embed
- **Broadcast lens**: Overlay controls for stream metadata, sponsor cards, scoreboard

**Components & Interactions**:
- Match card: time, teams, status badge, quick join link
- Bracket panel: interactive bracket with hover details
- Broadcast overlay: toggle sponsor banners, lower thirds

**Motion Language**:
- Card flip for match details
- Slide panels for bracket navigation

**Acceptance**: Event page loads with embedded match viewer and live status badges

---

### Ops Hub (Accent: Violet #9B7CFF)

**Purpose**: Platform health, ingestion pipelines, replay processing

**Users**: DevOps, platform engineers, product ops

**Key Screens**:
- **System status**: Pipeline health, queue lengths, recent errors
- **Replay queue**: List with retry, inspect, reprocess actions
- **Runbook index**: Curated operational docs (public safe subset)

**Components & Interactions**:
- Status tiles: color coded, click to drill into logs
- Replay inspector: small player with metadata and raw event list

**Motion Language**:
- Status transitions: subtle color fade
- Error shake for critical alerts

**Security**: Sensitive runbooks redacted; link to private runbook for internal use

---

### TeNET Hub — CS & Valorant

**Purpose**: Community and competitive hubs tailored to CS and Valorant ecosystems

**Common Features**:
- Player profiles: role, agent/weapon preferences, recent matches
- Training drills: linked replays with annotated highlights
- Community feed: curated posts, clips, coach notes
- Match playlists: curated highlight reels

#### TeNET CS (Accent: Steel Blue #2B6FA6)

**Special Tools**:
- Round economy simulator
- Grenade line visualizer
- Tick-accurate timeline

**UI Specifics**:
- Compact dense tables for round-by-round stats
- Map heatmaps with grenade arcs overlay

**Motion**: Precise micro-interactions for timeline; marker snap to tick

#### TeNET Valorant (Accent: Neon Magenta #FF2D9C)

**Special Tools**:
- Agent ability timeline
- Site control heatmaps
- Ability usage breakdown

**UI Specifics**:
- Ability icons integrated into timeline
- Per-agent ability usage charts

**Motion**: Ability reveal animations tied to timeline events

**Acceptance**: Each TeNET sub-hub demonstrates one gameplay-specific interactive tool

---

## 👤 User Paths and Journeys

### Primary Personas

| Persona | Path | Actions |
|---------|------|---------|
| **Analyst** | Analytics Hub → Match → Timeline → Export | Scrubs timeline, exports snapshot |
| **Coach** | TeNET CS → Training Drill → Annotate → Share | Annotates replay, shares playlist |
| **Organizer** | Events Hub → Create Event → Schedule → Monitor | Creates event, monitors live matches |
| **Casual Fan** | Home → Featured Match → Watch → Share | Watches replay, shares clip |

### Key Flows

1. **Discover → Inspect**: Home → Hub → Match list → Match viewer
2. **Analyze → Compare**: Analytics Hub → Select two matches → Synchronized compare
3. **Train → Practice**: TeNET → Select drill → Play annotated replay → Save playlist
4. **Organize → Broadcast**: Events Hub → Create event → Link match → Broadcast overlay

### Conversion & Retention

- **CTAs**: Save view, Follow hub, Subscribe to updates, Join live
- **Retention hooks**: Saved playlists, watched history, recommended drills

---

## 🎨 Visual Styling System

### Core Tokens (Shared)

| Token | Value |
|-------|-------|
| Base text | `#111217` (Charcoal) |
| Background | `#F6F5F4` (Warm Gray) |
| Spacing unit | 8px |
| Card radius | 16px |

### Per-Hub Accents

| Hub | Accent | Hex |
|-----|--------|-----|
| Analytics | Cyan | `#00D1FF` |
| Events | Amber | `#FFB86B` |
| Ops | Violet | `#9B7CFF` |
| TeNET CS | Steel Blue | `#2B6FA6` |
| TeNET Valorant | Neon Magenta | `#FF2D9C` |

### Typography

- **Display**: GT Standard style variable geometric sans for headings
- **Body**: Neutral humanist sans at 16–18px

### Motion

| Animation | Spec |
|-----------|------|
| Entrance | fade + translateY 12px, 240ms |
| Panel transitions | cross-fade + scale, 200ms |
| Timeline scrub | transform + opacity only; reduced motion respected |

---

## 📁 Implementation Structure

```
ui/
├── tokens.css              # CSS variables for colors, spacing, radii
└── components/
    ├── Tabs.html
    ├── Panel.html
    ├── DataCard.html
    ├── Timeline.html
    └── MatchViewer.html

public/
└── api/demo/
    ├── matches.json
    ├── matches/
    │   └── m-001.json
    ├── players/
    └── hubs.json

pages/
├── index.html              # Home
├── hubs/
│   ├── analytics.html
│   ├── events.html
│   └── ops.html
├── tenet/
│   ├── cs.html
│   └── valorant.html
└── match.html              # ?id=m-001

.github/
└── workflows/
    └── deploy.yml          # GitHub Pages deployment
```

---

## 📅 Roadmap and MVP Tasks

### Phase 0: Prep (3 days)

- [ ] Audit repo; move sensitive runbooks to `archive/` and add index
- [ ] Create `MVP.md`, `STYLE_BRIEF.md`, and `ui/tokens.css` skeleton
- [ ] Set up GitHub Pages deployment workflow

**Deliverable**: Clean repo structure with public-safe surface

### Phase 1: Core Build (2 weeks)

- [ ] Implement static marketing pages and hub shell
- [ ] Build `ui/components` minimal set: Tabs, Panel, DataCard, Timeline
- [ ] Add demo JSON endpoints in `/public/api/demo/`
- [ ] Implement Match Viewer with static replay file and timeline

**Deliverable**: Working demo site with match viewer

### Phase 2: Hub Features (2–4 weeks)

- [ ] **Analytics Hub**: KPI row, heatmap panel, compare lens
- [ ] **Events Hub**: Calendar and event page with embedded match viewer
- [ ] **Ops Hub**: Status tiles and replay queue UI
- [ ] **TeNET CS & Valorant**: One gameplay tool each

**Deliverable**: All 5 hubs functional with unique features

### Phase 3: Polish and Launch (1 week)

- [ ] Accessibility pass (keyboard nav, contrast, reduced motion)
- [ ] Performance tuning (Lighthouse ≥ 80)
- [ ] Deploy to GitHub Pages
- [ ] Create README with supported modules and contribution guide

**Deliverable**: Production-ready public MVP

---

## ⚠️ Risks, Mitigations, and Tradeoffs

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Sensitive operational docs exposed | Medium | High | Archive and redact; add SECURITY.md |
| Scope creep across many hubs | High | High | Strict MVP scope; one tool per TeNET sub-hub |
| Free hosting limits server features | Low | Medium | Use static JSON and client-side logic; add serverless later |
| Design system drift | Medium | Medium | Lock tokens early; enforce via CSS variables and CRIT reviews |
| Performance issues with large replays | Medium | Medium | Lazy-load assets; optimize video; use efficient data structures |

---

## ✅ Definition of Done (MVP)

- [ ] Public URL on GitHub Pages
- [ ] Home page with hub selector
- [ ] 5 hubs implemented (Analytics, Events, Ops, TeNET CS, TeNET Valorant)
- [ ] Match Viewer with timeline scrubber and event markers
- [ ] Design system tokens in `ui/tokens.css`
- [ ] Component library: Tabs, Panel, DataCard, Timeline, MatchViewer
- [ ] Demo data endpoints functional
- [ ] Lighthouse score ≥ 80 (all categories)
- [ ] Keyboard navigation works
- [ ] `prefers-reduced-motion` supported
- [ ] Color contrast ≥ 4.5:1
- [ ] `SECURITY.md` present
- [ ] README with deploy instructions

---

## 🔍 Professional Critical Review Summary

### Strengths
- Rich codebase with replay and simulation assets
- Strong inspiration set for type-first, editorial UI
- Clear hub-based architecture
- Zero-cost deployment path

### Weaknesses (Addressed)
- ✅ No unified component library → `ui/` folder with documented components
- ✅ Public surface noisy → Archived legacy; focused MVP scope
- ✅ No design system → Tokens-first approach with locked values

### Immediate Priorities
1. Prune repo (archive sensitive docs)
2. Create tokens and `ui/` components
3. Deploy public demo match viewer

### Design Direction
**GT Standard** typographic rigor + **Detail's** motion craft + **Endex's** editorial clarity = Professional, credible platform

---

## 📚 Reference Documents

| Document | Purpose |
|----------|---------|
| **MVP_v2.md** | One-page MVP specification |
| **STYLE_BRIEF_v2.md** | Visual style brief with tokens |
| **HUB_BLUEPRINTS.md** | Annotated wireframes for all hubs |
| **CRIT_TEMPLATE_v2.md** | Review session template |
| **INDEX.md** | Complete deliverables index |

---

## 🚀 Next Steps

### Today
1. [ ] Review this product plan with stakeholders
2. [ ] Confirm hub priorities and timeline
3. [ ] Set up project board (GitHub Projects or similar)

### This Week
4. [ ] Archive sensitive docs to private storage
5. [ ] Initialize `site/` directory with chosen framework
6. [ ] Implement `ui/tokens.css`
7. [ ] Build first component (Tabs)

### Next Week
8. [ ] Complete Home page and hub shell
9. [ ] Implement Match Viewer
10. [ ] Deploy to staging URL

---

*Document Version: [Ver001.000]*  
*Last Updated: 2026-03-22*  
*Owner: Product Manager / Foreman Agent*  
*Status: Approved for Implementation*
