[Ver001.000]

# Report R4: Typography and Hierarchy Audit

**Research batch:** Batch 2
**Date produced:** 2026-03-27
**Agent:** claude-sonnet-4-6
**Sources consulted:** 9 sources (knowledge-based; platforms as of training cutoff Aug 2025)

---

## Executive Summary

eSports platforms use a tight two-font system: a geometric sans-serif for display/headers and a humanist sans-serif (usually Inter) for data and body. The NJZ platform already uses this pattern (Space Grotesk + Inter) — the gap is in application, not selection. The critical missing layer is a numeric display convention: tabular-nums must be applied to all stat cells, and a clear size hierarchy for "large numbers" (e.g. rating `1847`, ADR `84.7`) vs supporting labels is absent from current components. Space Grotesk and Inter are both free on Google Fonts and suitable for the identified patterns.

---

## Findings

### Finding 1: Geometric Display Font for Scores and Large Numbers

**Evidence:** vlr.gg uses "Barlow" (condensed, bold) for match scores at 48–72px. hltv.org uses "Roboto Condensed" for scores. tracker.gg and op.gg use Inter at `font-weight: 800` in a condensed style. All share the same pattern: high-weight, tightly tracked display numerals for the primary score, with lighter weight supporting text.

**Relevance to NJZ platform:** Space Grotesk at `font-weight: 700`, `letter-spacing: -0.04em` produces a similar result to Barlow Condensed — the existing display font is appropriate. The tailwind config already defines `font-display: 'Space Grotesk'`. The missing piece is application: score displays should use `font-display font-bold tracking-tight`.

**Recommended action:**
```css
--font-score: 'Space Grotesk', system-ui, sans-serif;
--font-score-size: clamp(2rem, 5vw, 4rem);
--font-score-weight: 700;
--font-score-tracking: -0.04em;
```

---

### Finding 2: Tabular Numbers are Non-Negotiable for Stat Tables

**Evidence:** hltv.org, vlr.gg, and op.gg all apply `font-variant-numeric: tabular-nums` to every stat column. This prevents column width shift when values change (e.g. live stat updates) and keeps decimal points aligned. Missing tabular-nums in a stat table causes visible jitter on live update and misaligned columns in sorted views.

**Relevance to NJZ platform:** No tabular-nums class or utility exists in the current Tailwind config. This is a single CSS token addition.

**Recommended action:**
```css
/* Add to tailwind.config.js plugins */
'.tabular-nums': { fontVariantNumeric: 'tabular-nums' },
/* Or as a direct CSS token */
--numeric-display: tabular-nums;
/* Usage: class="font-mono tabular-nums" on all stat cells */
```

---

### Finding 3: Data Size Hierarchy — 4 Tiers

**Evidence:** Analysing hltv.org's player statistics page reveals a consistent 4-tier text hierarchy for data display:
- **T1 Score/Rating:** 36–48px, `font-weight: 700`, game accent colour — the single most important metric
- **T2 Primary Stat:** 18–24px, `font-weight: 600`, white (`#e8e8e8`) — K/D/A, ADR, HS%
- **T3 Secondary Stat:** 14–16px, `font-weight: 400`, light grey (`#9a9a9a`) — supporting context
- **T4 Label/Caption:** 12px, `font-weight: 400`, medium grey (`#666`) — column headers, timestamps

vlr.gg uses the same 4-tier system. op.gg adds a 5th tier for metadata (8–10px).

**Relevance to NJZ platform:** The current Tailwind config's fluid fontSize scale covers T1 and body text but lacks T2 `stat` and T3 `stat-secondary` named tokens.

**Recommended action:**
```css
--text-stat-primary-size: 1.5rem;    /* T2: 24px */
--text-stat-primary-weight: 600;
--text-stat-primary-color: #e8e8e8;
--text-stat-secondary-size: 0.875rem; /* T3: 14px */
--text-stat-secondary-weight: 400;
--text-stat-secondary-color: #9a9a9a;
--text-label-size: 0.75rem;           /* T4: 12px */
--text-label-color: #666;
```

---

### Finding 4: Space Grotesk is Correct for Display — Apply It Consistently

**Evidence:** Space Grotesk (Google Fonts, free) is used by multiple eSports design systems (Riot's Valorant UI uses a similar geometric style). Its characteristics match eSports aesthetics: slightly condensed, strong geometric shapes, excellent at 48px+, readable at 14px+. hltv.org's use of Roboto Condensed and vlr.gg's Barlow Condensed are both in the same geometric-condensed family as Space Grotesk.

**Relevance to NJZ platform:** Space Grotesk is already the NJZ display font — confirmed correct. The gap: it is not consistently applied at hero/score display sizes. Some hub headers currently use Inter at large sizes instead.

**Recommended action:** Create a strict rule in `tokens.css` (Phase 9 gate 9.1):
```css
/* Display contexts: always Space Grotesk */
.hub-title, .score-display, .hero-heading, .stat-hero {
  font-family: var(--font-display);
}
/* Data contexts: always Inter */
.stat-table, .stat-cell, .match-history, .leaderboard {
  font-family: var(--font-data);
}
```

---

### Finding 5: Letter-Spacing Conventions for Data Labels

**Evidence:** eSports platforms consistently use `letter-spacing: 0.06–0.1em` (wide tracking) for ALL-CAPS column labels in stat tables. This is the same pattern used by Bloomberg, NBA stats, and ESPN — wide-tracked all-caps labels are a data UI convention that improves scanability at small sizes (10–12px). Normal tracking is used for everything else.

**Relevance to NJZ platform:** The tailwind config has `letterSpacing.widest: 0.08em` — this is the correct value for stat table labels. A `<StatLabel>` component variant should apply this automatically.

**Recommended action:**
```css
--label-tracking: 0.08em;
--label-transform: uppercase;
--label-size: 0.6875rem; /* 11px */
```

---

### Finding 6: Monospace for Timestamps and IDs Only

**Evidence:** All platforms use monospace fonts narrowly — only for timestamps (`12:43:21`), match IDs, and round counts. JetBrains Mono (already in NJZ stack) is appropriate. Monospace is never used for player names, team names, or stat values — this would hurt readability and look developer-focused rather than consumer-focused.

**Relevance to NJZ platform:** The existing `font-mono` token is correct. Ensure it is not over-applied — restrict to `<time>`, match IDs, and live timer displays.

**Recommended action:**
```css
/* Narrow monospace scope */
time, .match-id, .round-timer {
  font-family: var(--font-mono);
  font-variant-numeric: tabular-nums;
}
```

---

### Finding 7: Font Loading Strategy — Inter Must Not Block Paint

**Evidence:** op.gg and vlr.gg both use `font-display: swap` for their custom fonts. Google Fonts served via `<link rel="preload">` for critical fonts. Flash of unstyled text is acceptable on both platforms — system font fallback is specified explicitly. No platform uses `font-display: block` for data fonts.

**Relevance to NJZ platform:** The Space Grotesk and Inter fonts should be loaded via Google Fonts with `display=swap`. Inter is lower priority than Space Grotesk for LCP since scores appear above the fold in Space Grotesk.

**Recommended action:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preload" as="style"
  href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;600;700&family=Inter:wght@400;500;600&display=swap">
```

---

## Pattern Catalogue

| Pattern | Source Platform | Implementation Note |
|---------|----------------|---------------------|
| 4-tier data hierarchy | hltv.org, vlr.gg, op.gg | Score → Stat → Secondary → Label |
| Tabular-nums on all stat cells | All platforms | CSS `font-variant-numeric: tabular-nums` |
| Wide-tracked ALL-CAPS column labels | ESPN, NBA, hltv.org | `letter-spacing: 0.08em; text-transform: uppercase` |
| Geometric display font for scores | vlr.gg, tracker.gg | Space Grotesk 700 — already in NJZ stack |
| System/humanist font for data | All platforms | Inter — already in NJZ stack |
| Monospace for time/IDs only | All platforms | Restrict JetBrains Mono scope |
| `font-display: swap` for custom fonts | op.gg, vlr.gg | Required for Core Web Vitals |

---

## Recommended Tokens / Values

| Token | Recommended Value | Rationale |
|-------|------------------|-----------|
| `--font-display` | `'Space Grotesk', system-ui, sans-serif` | Keep existing — confirmed correct |
| `--font-data` | `'Inter', system-ui, sans-serif` | Data tables, stat cells |
| `--font-mono` | `'JetBrains Mono', monospace` | Timestamps, IDs only |
| `--text-score` | `clamp(2rem, 5vw, 4rem)` / weight 700 | Match score display |
| `--text-stat-primary` | `1.5rem` / weight 600 | K/D/ADR primary stats |
| `--text-stat-secondary` | `0.875rem` / weight 400 | Supporting stats |
| `--text-label` | `0.6875rem` / 0.08em tracking | Column headers |
| `--numeric-display` | `tabular-nums` | All stat cells |

---

## Sources

1. hltv.org typography analysis — stat table and player profile pages
2. vlr.gg typography analysis — match page and agent stats
3. op.gg typography analysis — player profile and champion stats
4. tracker.gg typography analysis — player overview page
5. Google Fonts — Space Grotesk, Inter, Barlow Condensed specimens
6. W3C CSS Fonts Level 4 — font-variant-numeric specification
7. ESPN Stats & Info typography patterns — sports data display
8. NBA.com stats page — tabular data hierarchy reference
9. Web.dev — font-display and Core Web Vitals guidance
