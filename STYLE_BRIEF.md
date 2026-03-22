[Ver003.000]

# Visual Style Brief — eSports-EXE

**Design Intent**: Type-first, motion-forward UI that reads editorially for content pages and behaves like a dashboard for hubs. Each hub is a panelled lens: tabbed, layered panels with a distinct accent and micro-motion to signal role.  
**Date**: 2026-03-22  
**Status**: Locked for MVP  

---

## Tokens

| Token | Value |
|-------|-------|
| Base text | Charcoal `#111217` |
| Background | Warm Gray `#F6F5F4` |
| Accent (analytics) | Cyan `#00D1FF` |
| Accent (events) | Amber `#FFB86B` |
| Accent (ops) | Violet `#9B7CFF` |
| Success | `#00C48C` |
| Warning | `#FFB86B` |
| Error | `#FF5C5C` |
| Radius (card) | 16px |
| Shadow (card) | `0 6px 18px rgba(17,18,23,0.08)` |
| Spacing unit | 8px |

---

## Type Scale

| Level | Size | Usage |
|-------|------|-------|
| **H1 (Display)** | 64px, tight leading (0.95) | Hero statements |
| **H2** | 40px | Section headings |
| **H3** | 28px | Subheadings, panel titles |
| **Body** | 16–18px, line-height 1.45 | Primary content |
| **UI Small** | 12–14px | Captions, microcopy |

**Font choices**: Variable geometric sans for display (GT Standard style); neutral humanist sans or serif for body. Use variable fonts where possible for weight/optical sizing.

---

## Color Usage

- **Primary UI**: Charcoal text on warm gray background for editorial clarity
- **Accents**: One accent per hub to create distinct hub identity (apply to tab underline, active states, KPI highlights)
- **Status**: Use status tokens consistently for badges and alerts

---

## Grid & Layout

- **Grid**: 12-column responsive grid; container max-width 1200px
- **Editorial pages**: Centered single column (max 720px)
- **Hubs / Dashboards**: Asymmetric two-column layout (content 65% / context 35%) with stacked panels
- **Card padding**: 24px; gutters 24px

---

## Motion Rules

| Animation | Spec |
|-----------|------|
| **Entrance** | opacity 0 → 1 + translateY 12px; 240ms; easing `cubic-bezier(.0,.0,.2,1)` |
| **Panel transitions** | Cross-fade + scale 0.98 → 1.00; 200ms |
| **Hover** | lift 6px, shadow intensify, subtle accent tint shift |
| **Performance** | Animate only transform and opacity; respect `prefers-reduced-motion` |

---

## Core Components (Ship in MVP)

| Component | Description |
|-----------|-------------|
| **Top Nav** | Compact, left logo, center search, right user menu |
| **Hub Tabs** | Animated underline, per-hub accent, keyboard accessible |
| **Panel** | Header, KPI row, body, action menu |
| **Data Card** | Title, KPI, sparkline, CTA |
| **Match Viewer** | Canvas, timeline scrub, event markers, contextual side panel |

---

## Accessibility

- **Contrast**: Body text >= 4.5:1
- **Keyboard**: All interactive elements reachable and operable
- **Focus**: Visible focus ring for keyboard users
- **Motion**: Provide reduced-motion fallback

---

## Implementation Notes

- **Tokens**: Implement as CSS variables in `ui/tokens.css`
- **Components**: Keep markup semantic; use ARIA roles for complex widgets (tabs, timeline)
- **Theming**: Per-hub accent applied via a single CSS class (e.g., `.hub-analytics { --accent: #00D1FF }`)
- **Performance**: Lazy-load heavy assets (replay media) and prefer vector sparklines for KPIs

---

## Reference Tone

- **GT Standard** — typographic system and scale
- **Endex** — editorial product framing
- **Ciridae** — hub flair and motion language

---

*Document Version: [Ver003.000]*  
*Last Updated: 2026-03-22*  
*Owner: Design Lead*
