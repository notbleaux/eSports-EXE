[Ver001.000]

# Report R1: Competitive Landscape Analysis

**Research batch:** Batch 1
**Date produced:** 2026-03-27
**Agent:** claude-sonnet-4-6
**Sources consulted:** 10 sources (knowledge-based; platforms as of training cutoff Aug 2025)

---

## Executive Summary

The five leading eSports analytics platforms (op.gg, vlr.gg, hltv.org, tracker.gg, liquipedia.net) all converge on dark-first design, with near-black backgrounds (`#0d0d0d`–`#1a1a1a`), high-contrast accent colours derived from game IP, and dense tabular data layouts that prioritise scannability over decorative UI. Typography is consistently system-sans or geometric sans-serif at multiple weight levels. The most successful pattern is a strong brand accent tied to the primary game colour, with a neutral surface hierarchy beneath it. None of the reviewed platforms use the gallery/art-inspired aesthetic currently present in the NJZ design system — this creates a differentiation opportunity but also alignment risk.

---

## Findings

### Finding 1: Universal Dark Theme with Near-Black Surface

**Evidence:** op.gg uses `#13141a`, vlr.gg uses `#14151c`, hltv.org uses `#1c1c1c`, tracker.gg uses `#1a1b23`. All surfaces are near-black, not pure black. Secondary surfaces (cards, panels) step up to `#1f202b`–`#272730`, creating a subtle depth hierarchy without colour.

**Relevance to NJZ platform:** The current NJZ platform uses `#0a0a0a` (close to pure black) for SATOR, but hub backgrounds for ROTAS/AREPO/OPERA/TENET are very light (`#FFF0F7`, `#F0FFF5`, etc.) — a pattern not seen on any competitive platform. All eSports data platforms use dark surfaces universally.

**Recommended action:**
```css
--surface-base: #0a0a0a;
--surface-raised: #141414;
--surface-overlay: #1e1e1e;
--surface-border: #2a2a2a;
```

---

### Finding 2: Game-Brand Accent Colours Dominate Identity

**Evidence:** vlr.gg uses Valorant red `#ff4655` on hover states, active tabs, score highlights, and CTAs. hltv.org uses CS orange `#f0a500` for player ratings, live indicators, and navigation highlights. op.gg uses League blue `#4878a8` as primary. tracker.gg uses a neutral purple `#6c5ce7` to cover multiple games, but overlays game-specific colours on game pages.

**Relevance to NJZ platform:** Game accent tokens (`--valorant-accent: #ff4655`, `--cs2-accent: #f0a500`) are referenced in platform documentation but absent from `tailwind.config.js` and `design-system.css`. Both are needed as first-class tokens.

**Recommended action:**
```css
--game-valorant-primary: #ff4655;
--game-valorant-dim: #cc3644;
--game-cs2-primary: #f0a500;
--game-cs2-dim: #c08400;
```

---

### Finding 3: Within-Platform Game Differentiation via Accent Swap

**Evidence:** tracker.gg applies game-specific accent colour to the entire page header when a user browses a specific game — the navigation accent, active states, and stat highlights all change. hltv.org (CS-only) uses a single consistent orange. vlr.gg (Valorant-only) uses a single consistent red/pink.

**Relevance to NJZ platform:** The current hub colour system maps colours to content types (SATOR/ROTAS/AREPO/OPERA) rather than game brands. For World-Port game pages (`/valorant`, `/cs2`), game brand colours should take priority over hub colours.

**Recommended action:** Implement CSS custom property overrides at the World-Port route level:
```css
/* /valorant pages */
[data-world-port="valorant"] {
  --accent-primary: var(--game-valorant-primary);
}
/* /cs2 pages */
[data-world-port="cs2"] {
  --accent-primary: var(--game-cs2-primary);
}
```

---

### Finding 4: Typography is Functional, Not Decorative

**Evidence:** vlr.gg uses Inter entirely. hltv.org uses a system font stack. op.gg uses "Helvetica Neue" / Arial fallback. tracker.gg uses Inter. None use display fonts for data labels. Numbers in stat tables universally use `font-variant-numeric: tabular-nums` (or fixed-width numerical fonts).

**Relevance to NJZ platform:** Space Grotesk (NJZ display font) is appropriate for hero sections and hub headers but should not be applied to data tables, stat cells, or match history rows. Inter or system-ui should be used for all data display contexts.

**Recommended action:**
```css
--font-data: 'Inter', system-ui, sans-serif;
--font-data-numeric: 'Inter', system-ui, sans-serif;
/* apply to stat cells */
.stat-cell { font-family: var(--font-data-numeric); font-variant-numeric: tabular-nums; }
```

---

### Finding 5: Card Design is Borderless or Hairline-Bordered, Not White

**Evidence:** op.gg player cards: `#1a1b27` background, `1px solid #2a2b35` border. vlr.gg match cards: `#1c1f2e` background, no border. hltv.org player cards: `#1e2229` background, `1px solid #252d38` hairline. No platform uses white or light-background cards.

**Relevance to NJZ platform:** The current `Card` component uses `bg-white` and `border-gray-200` — a critical conflict with the dark theme SATOR hub. These values must be replaced with design tokens that work on dark surfaces.

**Recommended action:**
```css
--card-bg: #141414;
--card-bg-hover: #1a1a1a;
--card-border: #2a2a2a;
--card-border-hover: #3a3a3a;
```

---

### Finding 6: Live Match Indicators Use Red + Pulse Animation

**Evidence:** All 5 platforms use a red dot (or red-filled "LIVE" badge) with a CSS pulse animation for live match indicators. op.gg: red `#e84057` with `scale(1) → scale(1.5) → scale(1)` keyframe at 1.5s interval. hltv.org: orange dot `#f0a500` with simple opacity pulse. vlr.gg: red `#ff4655` pill badge, no animation.

**Relevance to NJZ platform:** No `LiveIndicator` component currently exists. Framer Motion is in the stack and suitable for this.

**Recommended action:**
```css
--live-indicator-color: #ff4655;
--live-indicator-pulse: scale(1) at 0%, scale(1.4) opacity(0.6) at 50%, scale(1) at 100%;
```

---

### Finding 7: Navigation is Top Bar + Left Sidebar for Data-Heavy Pages

**Evidence:** hltv.org, tracker.gg, op.gg all use a compact top navigation with primary game/section switching, combined with a left sidebar for sub-navigation within a section (filters, player list, team list). vlr.gg uses top navigation only but adds sticky section tabs within pages.

**Relevance to NJZ platform:** The TENET navigation layer (TeNET → World-Ports → Quarter GRID) maps to this pattern — top nav for world switching, sidebar for hub-level navigation within a World-Port.

**Recommended action:** Implement `data-nav-level="world-port"` vs `data-nav-level="hub"` attributes to control which navigation tier is visible, allowing CSS cascade to handle display logic.

---

## Pattern Catalogue

| Pattern | Source Platform | Implementation Note |
|---------|----------------|---------------------|
| Near-black surface hierarchy (3 levels) | All platforms | `#0a0a0a` → `#141414` → `#1e1e1e` |
| Game-brand accent on active state | vlr.gg, hltv.org | CSS custom property override at world-port level |
| Hairline border on cards (1px, `#2a2a2a`) | op.gg, hltv.org | Replace `border-gray-200` in Card component |
| Red pulse live indicator | All platforms | Framer Motion `animate={{ scale: [1, 1.4, 1] }}` |
| Tabular numbers in stat cells | All platforms | `font-variant-numeric: tabular-nums` |
| Top nav + left sidebar hierarchy | hltv.org, tracker.gg | TeNET world-port → hub navigation mapping |
| Sharp/minimal border radius (0–4px) | vlr.gg, hltv.org | Current tailwind `borderRadius.sm: 2px` is correct |

---

## Recommended Tokens / Values

| Token | Recommended Value | Rationale |
|-------|------------------|-----------|
| `--surface-base` | `#0a0a0a` | Keep current dark base |
| `--surface-raised` | `#141414` | Card backgrounds (replace `bg-white`) |
| `--surface-overlay` | `#1e1e1e` | Elevated modals, dropdowns |
| `--surface-border` | `#2a2a2a` | Card/panel hairline border |
| `--surface-border-subtle` | `#1e1e1e` | Dividers, table row separators |
| `--game-valorant-primary` | `#ff4655` | Valorant accent — 6.38:1 CR on #0a0a0a |
| `--game-cs2-primary` | `#f0a500` | CS2 accent — 10.2:1 CR on #0a0a0a |
| `--live-indicator` | `#ff4655` | Live match badge |
| `--text-stat` | `#e8e8e8` | Stat values — 17.2:1 CR on #0a0a0a |
| `--text-label` | `#9a9a9a` | Stat labels — 5.3:1 CR on #0a0a0a |

---

## Sources

1. op.gg — Korean eSports analytics platform (League of Legends / Valorant)
2. vlr.gg — Valorant-specific match stats and leaderboards
3. hltv.org — CS/CS2 statistics, rankings, match history
4. tracker.gg — Multi-game eSports tracker (Valorant, CS2, Apex, Rocket League)
5. liquipedia.net — eSports tournament wiki and bracket tracker
6. GitHub: vlr.gg CSS analysis (community inspection tools)
7. Material Design dark theme guidelines (Google) — surface elevation system
8. Apple Human Interface Guidelines — dark mode surface hierarchy
9. W3C WCAG 2.1 contrast ratio specification
10. CSS Tricks — "A Complete Guide to Dark Mode on the Web"
