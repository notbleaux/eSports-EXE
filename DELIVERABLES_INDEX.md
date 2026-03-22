[Ver001.000]

# eSports-EXE — Production Deliverables Index

**Date**: 2026-03-22  
**Status**: Complete — Ready for Implementation  
**Repository**: notbleaux/eSports-EXE

---

## 📋 Overview

This document indexes all production-ready deliverables for the eSports-EXE MVP. Each deliverable has been created, reviewed, and committed to the repository.

**Design Philosophy**: Type-first hierarchy using GT Standard, panelled lens architecture inspired by Ciridae and Endex, per-hub accent system, motion for function only.

---

## 🎨 Design System Assets

### Core Tokens
| File | Location | Purpose |
|------|----------|---------|
| `tokens.css` | `ui/tokens.css` | CSS variables for colors, typography, motion, per-hub accents |

**Key Variables**:
- Background: `#F6F5F4`
- Text: `#111217`
- Accents: Analytics Cyan `#00D1FF`, Events Amber `#FFB86B`, Ops Violet `#9B7CFF`, CS Steel Blue `#2B6FA6`, Valorant Neon Magenta `#FF2D9C`

---

## 📐 Annotated Wireframes (5 Hubs)

All wireframes are production-ready SVGs at 1400×900px with embedded annotations.

| Hub | Accent | File | Key Components |
|-----|--------|------|----------------|
| **Analytics** | Cyan `#00D1FF` | `wireframes/analytics.svg` | KPI cards, match viewer canvas, timeline scrubber, filters sidebar |
| **Events** | Amber `#FFB86B` | `wireframes/events.svg` | Calendar grid, live badges, day/week/month toggle, event cards |
| **Ops** | Violet `#9B7CFF` | `wireframes/ops.svg` | Status tiles, replay queue table, error indicators, runbook links |
| **TeNET CS** | Steel Blue `#2B6FA6` | `wireframes/tenet-cs.svg` | Grenade visualizer canvas, arc overlays, round breakdown, drill library |
| **TeNET Valorant** | Neon Magenta `#FF2D9C` | `wireframes/tenet-valorant.svg` | Ability timeline lanes, site control heatmap, agent filter, practice playlist |

---

## 🧩 Component Library

Ready-to-use HTML/CSS components in `ui/components/`.

| Component | File | Features |
|-----------|------|----------|
| **Tabs** | `ui/components/tabs.html` | Keyboard-accessible, ARIA compliant, animated underline, per-hub accent support |
| **Panel** | `ui/components/panel.html` | Elevated container with header, actions, hover transform, cross-fade transition |
| **Timeline** | `ui/components/timeline.html` | Scrubber with ARIA slider, event markers, play/zoom controls, tick-accurate |
| **MatchViewer** | `ui/components/matchviewer.html` | 65/35 grid layout, video canvas, KPI row, event list, responsive breakpoint at 900px |

---

## 📚 Technical Specifications

### TeNET CS Grenade Visualizer
**Document**: `docs/TECH_DESIGN_TENET_CS.md`

**Schema**: `GrenadeEvent` interface with position vectors, flight time, effectiveness scores
**Algorithm**: Quadratic Bézier interpolation for ballistic arcs, world-to-radar coordinate transforms
**Performance**: 60fps target, ≤50 arcs visible, 128 tick precision
**Features**: Tick-accurate scrubber, detonation effects, team color coding

### TeNET Valorant Ability Timeline
**Document**: `docs/TECH_DESIGN_TENET_VALORANT.md`

**Schema**: `AbilityEvent` interface with agent, ability type, position, effectiveness
**Algorithm**: Virtualized lane rendering, density heatmap, SVG marker components
**Performance**: 60fps target, ≤200 events visible, 10 agent lanes
**Features**: Agent color mapping, site control widget, ability combo detection

---

## 📦 Demo Data

| File | Location | Contents |
|------|----------|----------|
| `matches.json` | `data/matches.json` | 5 sample matches with metadata |
| `replay-001.json` | `data/replays/replay-001.json` | Complete 24-round replay with events |
| `events.json` | `data/events.json` | Event type catalog |
| `hubs.json` | `data/hubs.json` | 3 hub definitions with accents |

---

## 📖 Project Documentation

| Document | Purpose | Version |
|----------|---------|---------|
| `PRODUCT_PLAN.md` | Executive summary, roadmap, site architecture | Ver001.000 |
| `MVP.md` | One-page MVP specification, endpoints, acceptance criteria | Ver003.000 |
| `STYLE_BRIEF.md` | Design tokens, typography, layout principles | Ver003.000 |
| `HUB_BLUEPRINTS.md` | Detailed hub specifications and user flows | — |
| `DELIVERABLES_INDEX.md` | This file — master index of all deliverables | Ver001.000 |

---

## ✅ Acceptance Criteria (MVP)

| Criterion | Status | Evidence |
|-----------|--------|----------|
| 5 annotated SVG wireframes | ✅ Complete | `wireframes/*.svg` |
| Component library with 4 components | ✅ Complete | `ui/components/*.html` |
| TeNET CS technical spec | ✅ Complete | `docs/TECH_DESIGN_TENET_CS.md` |
| TeNET Valorant technical spec | ✅ Complete | `docs/TECH_DESIGN_TENET_VALORANT.md` |
| Demo data files | ✅ Complete | `data/*.json` |
| Design tokens file | ✅ Complete | `ui/tokens.css` |

---

## 🚀 Next Steps (Implementation)

1. **Sprint 0** (3 days): Repo audit, tokens file integration, skeleton pages
2. **Sprint 1** (2 weeks): Implement components, match viewer with static replay, analytics hub shell
3. **Sprint 2** (2 weeks): Events and Ops hubs, TeNET tools (one per sub-hub)
4. **Sprint 3** (1 week): Accessibility pass, performance tuning, deploy to GitHub Pages

---

## 🔗 Quick Links

- **Repository**: https://github.com/notbleaux/eSports-EXE
- **Product Plan**: `PRODUCT_PLAN.md`
- **MVP Spec**: `MVP.md`
- **Style Brief**: `STYLE_BRIEF.md`
- **Wireframes**: `wireframes/`
- **Components**: `ui/components/`
- **Technical Specs**: `docs/TECH_DESIGN_*.md`

---

*All deliverables reviewed and committed. Ready for implementation.*
