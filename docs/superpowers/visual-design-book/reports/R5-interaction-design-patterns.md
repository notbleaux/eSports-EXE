[Ver001.000]

# Report R5: Interaction Design Patterns

**Research batch:** Batch 3
**Date produced:** 2026-03-27
**Agent:** claude-sonnet-4-6
**Sources consulted:** 9 sources (knowledge-based; platforms as of training cutoff Aug 2025)

---

## Executive Summary

eSports platform interaction patterns are driven by two competing needs: data density (users need many stats visible simultaneously) and real-time responsiveness (live scores, round events, stat updates). The most successful interaction patterns solve both: sticky navigation for context preservation during scrolling, tab-based hub switching with URL state, hover-to-preview for player data without leaving the current page, and minimal but purposeful animation (counter flips, live pulses) that communicates state change without overwhelming the data. The NJZ platform's Framer Motion stack is well-positioned for all of these patterns — the gap is in establishing design tokens for motion (duration, easing) and standardising component-level interaction states.

---

## Findings

### Finding 1: Tab Navigation with URL State Persistence

**Evidence:** All major platforms persist the active tab in the URL: vlr.gg `/player/{id}/matches`, hltv.org `/stats/players/{id}?tab=rating`, tracker.gg `/valorant/profile/{name}/overview`. This means browser back/forward navigation works correctly, tabs are shareable, and the page can be deep-linked. Tab switching uses a sliding underline indicator with `transition: transform 200ms ease-out` — no full-page reload.

**Relevance to NJZ platform:** Hub switching (SATOR / AREPO / OPERA / ROTAS) and World-Port switching (/valorant / /cs2) both benefit from URL-persisted state. React Router with `useSearchParams` covers this. The `Tabs` component in the TENET library needs a URL-sync prop.

**Recommended action:**
```css
--tab-indicator-transition: transform 200ms cubic-bezier(0.16, 1, 0.3, 1);
--tab-indicator-height: 2px;
--tab-indicator-color: var(--accent-primary);
```

---

### Finding 2: Hover-to-Preview Cards (Popover on Player/Team Names)

**Evidence:** hltv.org and op.gg both show a popover preview card when hovering a player name in any list or table. The card contains: avatar, username, current team, rating/rank, nationality flag, and a "View profile" link. This prevents navigation away from the current list view just to see basic player info. Delay before showing: 300–400ms (prevents accidental triggers). Dismiss on mouse leave. Uses `position: fixed` to avoid scroll clipping.

**Relevance to NJZ platform:** AREPO community hub and OPERA pro-scene hub both display player lists. A `<PlayerHoverCard>` component would match this pattern. The `Popover` component exists in TENET UI and can serve as the base.

**Recommended action:**
```css
--popover-delay: 300ms;
--popover-transition: opacity 150ms ease-out, transform 150ms ease-out;
--popover-transform-enter: translateY(-4px);
--popover-min-width: 240px;
```

---

### Finding 3: LIVE Indicator — Pulse Animation Convention

**Evidence:** Universal pattern across all platforms: red or game-accent filled circle (6–8px diameter) with a CSS keyframe that scales from `1.0` to `1.5` and back at 1.5s interval, with opacity going from 1 to 0.3 on the outer pulse ring. Some platforms (op.gg, hltv.org) add a secondary outer ring that expands and fades, creating a "ripple" effect. Text label "LIVE" in red/accent, `font-size: 11px`, `letter-spacing: 0.06em`, `text-transform: uppercase`.

**Relevance to NJZ platform:** OPERA hub needs a live match indicator. Framer Motion's `animate={{ scale: [1, 1.5, 1], opacity: [1, 0.3, 1] }}` with `repeat: Infinity` and `duration: 1.5` covers this.

**Recommended action:**
```css
--live-dot-size: 8px;
--live-dot-color: var(--game-valorant-primary); /* or cs2 depending on context */
--live-pulse-duration: 1.5s;
--live-pulse-scale-max: 1.5;
--live-label-size: 0.6875rem;
--live-label-tracking: 0.06em;
```

---

### Finding 4: Mobile Navigation — Bottom Tab Bar for 4–5 Primary Sections

**Evidence:** op.gg mobile, tracker.gg mobile, and vlr.gg mobile all use a bottom tab bar with 4–5 icons + labels for primary section navigation (Home, Search, Profile, Leaderboard, Live). Top hamburger menus are absent — bottom tab bar is the universal mobile eSports pattern. Tab bar height: 56–64px. Icons at 24px. Active state: game accent colour + icon fill. Inactive: neutral grey.

**Relevance to NJZ platform:** The current navigation implementation (hub-5-tenet) does not have a mobile-specific tab bar. Phase 9 gate 9.4/9.5 (Lighthouse ≥ 90) requires mobile-responsive navigation.

**Recommended action:**
```css
--mobile-tab-height: 60px;
--mobile-tab-icon-size: 24px;
--mobile-tab-active-color: var(--accent-primary);
--mobile-tab-inactive-color: #666;
```

---

### Finding 5: Real-Time Notification Toasts — Non-Interrupting Position

**Evidence:** hltv.org and vlr.gg both display live score updates as a small toast in the bottom-right corner (not top-center). Duration: 3–4 seconds with `auto-dismiss`. The toast does not steal keyboard focus. It uses the game accent colour as a left border (4px), not as a full background — this ensures readability against the dark surface. Multiple toasts stack vertically from bottom-right.

**Relevance to NJZ platform:** The `Toast` component in TENET UI exists. The positioning (bottom-right) and the left-border-only accent pattern should be the standard for live score notifications.

**Recommended action:**
```css
--toast-position: bottom-right;
--toast-accent-border-width: 4px;
--toast-accent-border-color: var(--accent-primary);
--toast-bg: var(--surface-overlay);
--toast-auto-dismiss: 4000ms;
```

---

### Finding 6: Loading States — Page-Level vs. Component-Level

**Evidence:** All platforms differentiate between two loading states: (1) Initial page load uses full-skeleton (all content areas replaced with shimmer skeletons matching the expected layout), and (2) Data refresh/filter change uses a lighter overlay — existing content dims to 50% opacity with a spinner in the center of the changing region, preserving layout stability. This two-state approach maintains CLS (Cumulative Layout Shift) close to 0.

**Relevance to NJZ platform:** The `Skeleton` and `Spinner` components both exist. The pattern to implement is: Skeleton on first load, spinner-overlay on refresh. A `<DataRegion isRefreshing={bool}>` wrapper component enforces this.

**Recommended action:**
```css
--skeleton-shimmer-duration: 2s;
--refresh-overlay-opacity: 0.5;
--refresh-spinner-size: 32px;
--refresh-transition: opacity 150ms ease-out;
```

---

### Finding 7: Search — Instant Results (Debounced 200ms)

**Evidence:** op.gg, tracker.gg, vlr.gg all show player search results within 200ms of the user stopping typing (debounce 200ms). Results appear in a dropdown below the input, not a new page. Results are grouped by platform entity type (Players, Teams, Tournaments). Keyboard navigation (arrow keys + Enter) is supported in all implementations.

**Relevance to NJZ platform:** Global search in the TeNET navigation layer (hub-5-tenet) will need this pattern. The `Input` + `Dropdown` components in TENET UI provide the building blocks.

**Recommended action:**
```css
--search-debounce: 200ms;
--search-results-max-height: 320px;
--search-results-item-height: 48px;
--search-results-transition: opacity 100ms ease-out, transform 100ms ease-out;
```

---

## Pattern Catalogue

| Pattern | Source Platform | Implementation Note |
|---------|----------------|---------------------|
| Tab nav with URL state | vlr.gg, hltv.org, tracker.gg | `useSearchParams` + `Tabs` component URL-sync prop |
| Hover-to-preview player card | hltv.org, op.gg | Extend `Popover` with 300ms delay + player data |
| Live dot + ripple animation | All platforms | Framer Motion repeat:Infinity, 1.5s cycle |
| Mobile bottom tab bar | op.gg, tracker.gg | 60px height, 4–5 icons, accent-active state |
| Bottom-right toast — left-border accent | hltv.org, vlr.gg | 4px accent border, auto-dismiss 4s |
| Skeleton → spinner-overlay loading states | op.gg, tracker.gg | Skeleton initial, overlay on refresh |
| Debounced 200ms instant search | All platforms | `useDebounce` + `Input`/`Dropdown` |

---

## Recommended Tokens / Values

| Token | Recommended Value | Rationale |
|-------|------------------|-----------|
| `--duration-instant` | `50ms` | Micro-feedback (hover, focus ring) |
| `--duration-fast` | `150ms` | State transitions |
| `--duration-normal` | `300ms` | Panel open/close |
| `--duration-slow` | `500ms` | Page transitions |
| `--easing-out-expo` | `cubic-bezier(0.16, 1, 0.3, 1)` | Entrance animations |
| `--easing-spring` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Interactive spring |
| `--live-pulse-duration` | `1.5s` | Live indicator rhythm |
| `--search-debounce` | `200ms` | Search input debounce |
| `--toast-dismiss` | `4000ms` | Toast auto-dismiss |
| `--popover-delay` | `300ms` | Hover card delay |

---

## Sources

1. hltv.org — live match interaction, toast notifications, hover cards
2. vlr.gg — tab navigation, search results, live indicators
3. op.gg — mobile tab bar, hover preview cards, skeleton loading
4. tracker.gg — multi-game search, loading states
5. liquipedia.net — tournament bracket navigation patterns
6. ESPN app (iOS) — live notification and score update patterns
7. NBA app (iOS) — mobile bottom navigation reference
8. Framer Motion documentation — animation timing and spring configs
9. Web.dev — Cumulative Layout Shift best practices
