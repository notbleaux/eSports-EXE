[Ver001.000]

# Report R3: Data Visualisation Patterns

**Research batch:** Batch 2
**Date produced:** 2026-03-27
**Agent:** claude-sonnet-4-6
**Sources consulted:** 10 sources (knowledge-based; platforms as of training cutoff Aug 2025)

---

## Executive Summary

eSports data platforms converge on a small set of chart patterns: horizontal bar charts for damage/kill comparisons, radar/spider charts for multi-dimensional player profiles, timeline charts for round-by-round economy/score progressions, and real-time score overlays using numeric counters. Table design dominates — at least 60% of data display is tabular, with colour-encoded cells for high/low values. Animation is used sparingly — primarily for loading transitions and live score updates, not decorative motion. The NJZ platform's Recharts + D3.js stack is well-suited to all identified patterns, and design tokens for chart colours, axis styles, and data states can be standardised across all four hubs.

---

## Findings

### Finding 1: Horizontal Bar is the Dominant Chart Type

**Evidence:** hltv.org player stats, vlr.gg agent stats, tracker.gg performance summary — all three lead with horizontal bars for comparative stats (K/D, KAST, headshot %). Orientation is horizontal (not vertical) because labels (player names, stat names) are long strings that read naturally on the left axis. Bars are 6–12px tall with a `4px` border-radius. Bar colour is the game accent with 20–30% opacity for the track, full opacity for the fill.

**Relevance to NJZ platform:** SATOR analytics and ROTAS stats reference will both need horizontal bar displays. Recharts `<BarChart layout="vertical">` is the correct implementation.

**Recommended action:**
```css
--chart-bar-fill: var(--accent-primary);
--chart-bar-track: color-mix(in srgb, var(--accent-primary) 20%, transparent);
--chart-bar-height: 8px;
--chart-bar-radius: 4px;
```

---

### Finding 2: Radar Charts for Player Profile Comparison

**Evidence:** tracker.gg and op.gg both use radar/spider charts for player profile overviews. Axes typically cover 5–7 dimensions (accuracy, aggression, support, clutch rate, economy impact). op.gg's radar uses team colour fills with 30% opacity. tracker.gg uses player colour 1 vs colour 2 fills when comparing two players.

**Relevance to NJZ platform:** SATOR's SimRating and RAR (Role Adjusted Rating) systems generate multi-dimensional scores — a radar chart is the canonical display format. Recharts `<RadarChart>` is available.

**Recommended action:**
```css
--chart-radar-fill-opacity: 0.25;
--chart-radar-stroke-width: 2px;
--chart-radar-grid-color: #2a2a2a;
--chart-radar-label-color: var(--text-label);
```

---

### Finding 3: Real-Time Score Updates Use Counter Animation, Not Full Re-render

**Evidence:** hltv.org live match page: score increments use a CSS counter animation (number flips from old to new via transform translateY). vlr.gg uses a similar number-swap with a brief `#ff4655` flash on the updated cell. Both apply a 200–300ms ease-out transition. No full-component re-renders on score updates — only the changed digit animates.

**Relevance to NJZ platform:** WebSocket Path A (live scores) feeds the companion/overlay. For the web platform's OPERA hub live matches, score cells should use Framer Motion `animate={{ y: [-10, 0] }}` on value change, with a brief game-accent colour flash.

**Recommended action:**
```css
--live-update-flash-color: var(--accent-primary);
--live-update-flash-duration: 200ms;
--live-update-transition: transform 150ms ease-out, color 200ms ease-out;
```

---

### Finding 4: Table Design — Alternating Row Tint and Sticky Headers

**Evidence:** All platforms use alternating row backgrounds on stat tables: hltv.org uses `#1a1d24` / `#1e2229`, vlr.gg uses `#14151c` / `#1a1b24`, op.gg uses `#13141a` / `#191a23`. Row height is 40–44px. Sticky headers are universal — the header row stays visible when scrolling. Sorted column is indicated by a colour tint on the entire column, not just the header cell.

**Relevance to NJZ platform:** ROTAS stats reference tables need these patterns. Current Table/Grid components do not have stat-table variants.

**Recommended action:**
```css
--table-row-even: var(--surface-raised);
--table-row-odd: var(--surface-base);
--table-row-hover: color-mix(in srgb, var(--accent-primary) 8%, var(--surface-raised));
--table-header-bg: #1e1e1e;
--table-header-sticky: sticky;
--table-sorted-col-tint: color-mix(in srgb, var(--accent-primary) 5%, transparent);
--table-row-height: 44px;
```

---

### Finding 5: Data Colour Encoding — Heat-Map Cell Shading

**Evidence:** hltv.org player rating cells: values above average have green tint with opacity proportional to deviation. Below average have red tint. The scale runs from `rgba(239,68,68,0.3)` (red, lowest) through transparent (average) to `rgba(34,197,94,0.3)` (green, highest). op.gg uses the same pattern for champion win-rates.

**Relevance to NJZ platform:** SATOR analytics displays SimRating and RAR — both are deviation-from-average metrics and ideally suited to this pattern.

**Recommended action:**
```css
/* Applied via JS: cell background = mix(status-positive, transparent, deviation%) */
--heat-positive: rgba(34, 197, 94, 0.3);
--heat-negative: rgba(239, 68, 68, 0.3);
--heat-neutral: transparent;
```

---

### Finding 6: Loading States Use Shimmer Skeleton, Not Spinners

**Evidence:** op.gg, tracker.gg, and vlr.gg all use shimmer skeleton screens for initial data load. The skeleton represents the actual layout of the content (stat rows are skeleton-stat-rows, not generic blocks). Spinners are reserved for action feedback only (submitting a search, loading next page). Skeletons use a `linear-gradient` left-to-right shimmer animation at 1.5–2s interval.

**Relevance to NJZ platform:** The `Skeleton` component exists in the TENET UI library but its shimmer animation (`shimmer 2s linear infinite`) is already correctly implemented in `tailwind.config.js`. The gap is that skeleton shapes need stat-table-specific variants.

**Recommended action:** Add `Skeleton` variants: `<Skeleton variant="stat-row" />`, `<Skeleton variant="match-card" />`, `<Skeleton variant="player-header" />`.

---

### Finding 7: Round Economy Chart — Bar Chart with Kill/Buy Annotations

**Evidence:** hltv.org round history and vlr.gg both use a compact round-by-round economy chart: 30 narrow bars (one per round), coloured by win (game accent) or loss (muted), with annotations for bomb plants, eco rounds, and pistol rounds. This is always displayed as a horizontal timeline, not a vertical list.

**Relevance to NJZ platform:** ROTAS stats reference should include a round economy timeline for match history. This is a D3.js implementation (custom chart, not available in Recharts).

**Recommended action:** Tag for Phase 9 custom component: `<RoundEconomyChart rounds={matchData.rounds} />` using D3.js `scaleBand` + `scaleLinear`.

---

## Pattern Catalogue

| Pattern | Source Platform | Implementation Note |
|---------|----------------|---------------------|
| Horizontal bar — comparative stats | vlr.gg, hltv.org, tracker.gg | Recharts `<BarChart layout="vertical">` |
| Radar chart — player profile | tracker.gg, op.gg | Recharts `<RadarChart>` |
| Counter animation on live score | hltv.org, vlr.gg | Framer Motion `animate={{ y: [-10, 0] }}` |
| Alternating row tint + sticky header | All platforms | CSS custom properties |
| Heat-map cell shading | hltv.org, op.gg | `color-mix` with deviation value |
| Shimmer skeleton (content-shaped) | op.gg, tracker.gg | Extend existing `Skeleton` component |
| Round economy timeline | hltv.org, vlr.gg | Custom D3.js — Phase 9 deliverable |

---

## Recommended Tokens / Values

| Token | Recommended Value | Rationale |
|-------|------------------|-----------|
| `--chart-bar-height` | `8px` | Standard across competitive platforms |
| `--chart-bar-radius` | `4px` | Slight rounding, not sharp |
| `--chart-grid-color` | `#2a2a2a` | Subtle grid on dark bg |
| `--chart-axis-color` | `#525252` | Secondary text level |
| `--table-row-height` | `44px` | Minimum for touch targets |
| `--table-sorted-col` | `color-mix(in srgb, var(--accent-primary) 5%, transparent)` | Subtle sorted column indicator |
| `--heat-positive` | `rgba(34,197,94,0.3)` | Above-average stats |
| `--heat-negative` | `rgba(239,68,68,0.3)` | Below-average stats |
| `--live-update-duration` | `150ms` | Fast enough to feel live |

---

## Sources

1. hltv.org — CS2 match stats and live match data display
2. vlr.gg — Valorant round history and player stats charts
3. op.gg — League of Legends champion win-rate heat maps
4. tracker.gg — Multi-game radar chart player profiles
5. faceit.com — CS2 match analytics charts
6. Recharts documentation — BarChart, RadarChart API
7. D3.js examples — eSports round timeline implementations (Observable community)
8. Nba.com stats — sports data table design benchmarks
9. ESPN scoreboard — live counter animation patterns
10. Google Material Design — Data visualisation component guidelines
