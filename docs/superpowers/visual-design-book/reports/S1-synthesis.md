[Ver001.000]

# S1: Visual Design Book Synthesis and Design Recommendations

**Synthesised from:** R1 (Competitive Landscape), R2 (Game World Palette), R3 (Data Visualisation), R4 (Typography), R5 (Interaction Design), R6 (Component Audit)
**Date produced:** 2026-03-27
**Agent:** claude-sonnet-4-6
**Phase:** Feeds into Phase 9 gates 9.1–9.6

---

## Executive Summary

The NJZ eSports Platform has a well-structured technical foundation (React 18, Tailwind, Framer Motion, Three.js) and a distinctive design identity (Space Grotesk + Inter, dark base, hub colour system). The core design direction — dark surfaces, strong accent colours, geometric typography — is correct and aligned with the competitive landscape. The gaps are implementation, not concept: light-theme hardcoded values in 2 critical components, absent game-brand tokens, no `tokens.css` file, and 9 missing eSports-specific components. This synthesis provides a prioritised implementation path for Phase 9.

---

## Unified Design Direction

**Theme:** Dark-first, data-forward, game-identity-aware.

- **Surface system:** 3-level dark hierarchy (`#0a0a0a` → `#141414` → `#1e1e1e`) — adopted from competitive landscape consensus
- **Brand identity:** Retain the Kunsthalle/Boitano palette (`#FF69B4`, `#00D26A`) for platform navigation and hub identity — it is distinctive and differentiating
- **Game identity:** Override `--accent-primary` at the World-Port level with game brand colours — Valorant red / CS2 gold — for all content within game-specific pages
- **Typography:** Space Grotesk for display, Inter for data — confirmed correct; add strict scope rules and tabular-nums
- **Motion:** Purposeful, data-communicating — counter flips for live updates, live pulse at 1.5s, 150–300ms panel transitions

---

## Design Token System — Minimum 30 Tokens for tokens.css (Gate 9.1)

These tokens must exist in `packages/@njz/ui/src/tokens.css` before any Phase 9 component work begins.

### Surface Tokens (6)

| Token | Value | Notes |
|-------|-------|-------|
| `--surface-base` | `#0a0a0a` | Page background — keep current |
| `--surface-raised` | `#141414` | Card, panel backgrounds |
| `--surface-overlay` | `#1e1e1e` | Modal, dropdown, popover |
| `--surface-border` | `#2a2a2a` | Card/panel hairline border |
| `--surface-border-subtle` | `#1e1e1e` | Table row dividers |
| `--surface-hover` | `#1e1e1e` | Row hover background |

### Game Brand Tokens (8)

| Token | Value | Contrast on #0a0a0a | Notes |
|-------|-------|---------------------|-------|
| `--game-valorant-primary` | `#ff4655` | 6.4:1 ✅ | Valorant brand red |
| `--game-valorant-dim` | `#cc3644` | 4.8:1 ✅ | Hover/pressed state |
| `--game-valorant-muted` | `rgba(255,70,85,0.15)` | N/A | Tinted background |
| `--game-cs2-primary` | `#f0a500` | 10.2:1 ✅ | CS2 brand gold |
| `--game-cs2-dim` | `#c08400` | 7.1:1 ✅ | Hover/pressed state |
| `--game-cs2-ct` | `#6ec5e9` | 11.1:1 ✅ | CT side indicator |
| `--game-cs2-t` | `#e4a227` | 9.5:1 ✅ | T side indicator |
| `--accent-primary` | `var(--hub-accent, #FF69B4)` | — | Contextual override |

### Text Tokens (6)

| Token | Value | Contrast on #0a0a0a | Notes |
|-------|-------|---------------------|-------|
| `--text-primary` | `#e8e8e8` | 17.2:1 ✅ | Primary content |
| `--text-secondary` | `#9a9a9a` | 5.3:1 ✅ | Supporting content |
| `--text-muted` | `#666666` | 4.1:1 ✅ | Labels — use only at 18px+ or bold |
| `--text-inverse` | `#0a0a0a` | — | On light accent backgrounds |
| `--text-on-game` | `#ffffff` | — | On game-brand colour backgrounds |
| `--text-stat-label` | `#666666` | 4.1:1 | Column headers — 11px uppercase only |

### Status/Semantic Tokens (4)

| Token | Value | Contrast on #0a0a0a | Notes |
|-------|-------|---------------------|-------|
| `--status-positive` | `#22c55e` | 5.1:1 ✅ | Eco wins, positive delta |
| `--status-negative` | `#ef4444` | 5.2:1 ✅ | Deaths, bomb planted |
| `--status-highlight` | `#ffdd00` | 14.8:1 ✅ | Clutch, exceptional performance |
| `--status-live` | `#ff4655` | 6.4:1 ✅ | Live match indicator |

### Typography Tokens (5)

| Token | Value | Notes |
|-------|-------|-------|
| `--font-display` | `'Space Grotesk', system-ui, sans-serif` | Scores, hub titles |
| `--font-data` | `'Inter', system-ui, sans-serif` | Tables, stat cells |
| `--font-mono` | `'JetBrains Mono', monospace` | Timestamps, IDs only |
| `--numeric-display` | `tabular-nums` | All stat cells |
| `--label-tracking` | `0.08em` | ALL-CAPS column headers |

### Animation Tokens (5)

| Token | Value | Notes |
|-------|-------|-------|
| `--duration-fast` | `150ms` | State transitions |
| `--duration-normal` | `300ms` | Panel open/close |
| `--duration-live` | `1500ms` | Live pulse cycle |
| `--easing-out` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrance animations |
| `--easing-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Interactive spring |

### Chart Tokens (5)

| Token | Value | Notes |
|-------|-------|-------|
| `--chart-grid` | `#2a2a2a` | Grid lines |
| `--chart-axis` | `#525252` | Axis labels |
| `--chart-bar-height` | `8px` | Horizontal bar height |
| `--heat-positive` | `rgba(34,197,94,0.3)` | Above-average cell tint |
| `--heat-negative` | `rgba(239,68,68,0.3)` | Below-average cell tint |

**Total: 39 tokens** — exceeds the 30-token minimum.

---

## Component Gap Analysis

9 eSports-specific components are missing. Priority order for Phase 9:

### P0 — Blockers (must exist before gate 9.1)
1. **Fix `Card`** — replace `bg-white` with `bg-surface-raised`. 30-minute fix.
2. **Fix `Button`** — replace dynamic class interpolation with explicit class map. 1-hour fix.
3. **Create `tokens.css`** — 39 tokens defined above. Gate 9.1 deliverable.

### P1 — Required for gate 9.3 (component documentation)
4. **`StatCard`** — `Card` + token-bound value/label/trend. 2 hours.
5. **`PlayerRankBadge`** — `Badge` variant with R2 rank colour map. 2 hours.
6. **`TeamCompBadge`** — Avatar group with role colour coding. 2 hours.
7. **`AgentAbilityBar`** — `Progress` variant with Valorant role colours. 1 hour.
8. **`Toast` pattern update** — Left-border accent, bottom-right position. 30 minutes.
9. **`Tabs` URL sync** — `useSearchParams` prop. 1 hour.

### P2 — Required for gate 9.6 (Visual Design Book applied)
10. **`LiveScoreTicker`** — Framer Motion counter, WebSocket-ready. 3 hours.
11. **`MatchHistoryRow`** — Complex layout component. 4 hours.
12. **`PlayerHoverCard`** — Extend `Popover`. 2 hours.
13. **`RoundEconomyChart`** — D3.js custom chart. 6 hours.

### P3 — Phase 10+ (deferred)
14. **`HeatmapOverlay`** — Three.js/R3F; complex.

---

## Phase 9 Implementation Order

```
Week 1 (Gate 9.1 — Tokens + Critical Fixes):
  Day 1: Create tokens.css with 39 tokens
  Day 1: Fix Card component (bg-white → surface tokens)
  Day 2: Fix Button component (dynamic → explicit class map)
  Day 2: Extend tailwind.config.js with game-brand and surface colours
  Day 3: Add [data-world-port] CSS override pattern

Week 2 (Gate 9.3 — Component Documentation + eSports Components):
  Day 4–5: Build P1 components (StatCard, PlayerRankBadge, TeamCompBadge, AgentAbilityBar)
  Day 5: Update Toast pattern, Tabs URL sync
  Day 6: Document all components with Storybook/examples (gate 9.3)

Week 3 (Gate 9.4 + 9.5 — WCAG + Lighthouse):
  Day 7–8: WCAG 2.1 AA audit — use R2 contrast table as checklist
  Day 8–9: Lighthouse performance audit — font loading, skeleton, image optimisation
  Day 9: Fix violations found in audit

Week 4 (Gate 9.6 — Visual Design Book Applied):
  Day 10–11: Build P2 components (LiveScoreTicker, MatchHistoryRow, PlayerHoverCard)
  Day 12–13: Build RoundEconomyChart (D3.js)
  Day 14: Final visual QA against design direction in this synthesis
```

---

## Key Design Decisions (ADR candidates)

These decisions should be recorded as ADRs in the Phase 9 Logbook:

1. **Surface hierarchy: 3-level dark** — keep `#0a0a0a` base (not `#0d0d0d` like competitors) — NJZ's deeper black is the differentiation
2. **Hub identity vs. World-Port identity** — hub colours (SATOR/AREPO etc.) apply to navigation/shell; game brand colours override within World-Port content — CSS cascade resolves this cleanly
3. **Space Grotesk retained for display** — competitive research confirms geometric display fonts are correct for eSports; no font migration needed
4. **Hub backgrounds must be dark** — ROTAS/AREPO/OPERA/TENET light hub backgrounds (`#FFF0F7`, `#F0FFF5`) are incompatible with eSports UX conventions; these must be replaced with dark surface variants in Phase 9

---

## Deferred Work (Post Phase 9)

| Item | Reason Deferred | When to Pick Up |
|------|----------------|-----------------|
| `HeatmapOverlay` (Three.js) | High complexity; not blocking Phase 9 gates | Phase 10 |
| Map-specific accent tokens (`--map-{name}`) | Nice-to-have; requires game data | Phase 10 with game data integration |
| Animation system documentation | Framer Motion tokens work without formal docs | Phase 11 |
| Dark/Light hub theme toggle | Hub light backgrounds may remain for certain content types | Phase 9 QA — user decision |

---

## Quick Reference Checklist for Phase 9 Session Start

Before starting any Phase 9 gate, verify:
- [ ] `tokens.css` exists at `packages/@njz/ui/src/tokens.css`
- [ ] `Card` component uses `bg-surface-raised` (not `bg-white`)
- [ ] `Button` uses explicit class map (not dynamic interpolation)
- [ ] `tailwind.config.js` includes `valorant`, `cs2`, `surface-raised`, `surface-overlay`, `surface-border` colour tokens
- [ ] `[data-world-port="valorant"]` and `[data-world-port="cs2"]` CSS overrides exist
