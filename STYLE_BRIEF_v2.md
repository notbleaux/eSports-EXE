[Ver002.000]

# eSports-EXE — Visual Style Brief v2
## Type-First, Motion-Forward UI

**Project**: eSports-EXE public demo  
**Design Intent**: Type-first, motion-forward UI that reads editorially for content and behaves like a dashboard for hubs. Each hub has a distinct accent and paneled lens.  
**Date**: 2026-03-22  
**Status**: Approved for MVP  

---

## Design Principles

1. **Editorial Clarity**: Content reads with authority; hierarchy is obvious
2. **Dashboard Behavior**: Hubs behave like tools; panels are interactive surfaces
3. **Accent Identity**: Each hub has a distinct color while sharing core system
4. **Purposeful Motion**: Animations guide attention, never distract
5. **Accessible by Default**: Works for everyone, regardless of ability

---

## Design Tokens

### Typography

**Display Font**: GT Standard style variable geometric sans  
**Body Font**: Humanist sans or neutral serif (Inter or Merriweather)

#### Type Scale

| Element | Size | Line Height | Weight | Letter Spacing |
|---------|------|-------------|--------|----------------|
| H1 (Display) | 64px / 4rem | 1.05 | 700 | -0.02em |
| H2 | 40px / 2.5rem | 1.1 | 600 | -0.02em |
| H3 | 28px / 1.75rem | 1.15 | 600 | -0.01em |
| H4 | 20px / 1.25rem | 1.2 | 500 | -0.01em |
| Body | 16-18px / 1-1.125rem | 1.45 | 400 | 0 |
| Small | 14px / 0.875rem | 1.5 | 400 | 0 |
| Micro | 12px / 0.75rem | 1.4 | 500 | +0.05em |

### Color

#### Base Palette

| Token | Hex | Usage |
|-------|-----|-------|
| Charcoal | `#111217` | Primary text, headings |
| Warm Gray | `#F6F5F4` | Page background |
| Surface | `#FFFFFF` | Cards, panels |
| Border | `#E5E5E7` | Dividers, borders |

#### Hub Accents

| Hub | Color | Hex |
|-----|-------|-----|
| Analytics | Electric Cyan | `#00D1FF` |
| Events | Amber | `#FFB86B` |
| Ops | Violet | `#9B7CFF` |

#### Status Colors

| Status | Hex |
|--------|-----|
| Success | `#00C48C` |
| Warning | `#FFB86B` |
| Error | `#FF5C5C` |

### Spacing

| Token | Value | Usage |
|-------|-------|-------|
| Unit | 8px | Base spacing unit |
| Card Padding | 24px | Internal panel spacing |
| Gutter | 24px | Between grid items |
| Section | 64-96px | Between major sections |

### Radius & Elevation

| Token | Value |
|-------|-------|
| Card Radius | 16px |
| Button Radius | 8px |
| Shadow | `0 6px 18px rgba(17, 18, 23, 0.08)` |
| Shadow Hover | `0 12px 32px rgba(17, 18, 23, 0.12)` |

---

## Grid & Layout

### System: 12-Column Responsive Grid

```css
.container { max-width: 1200px; margin: 0 auto; }
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: 24px; }
.col-8 { grid-column: span 8; }
.col-4 { grid-column: span 4; }
```

### Layout Patterns

**Editorial Pages** (Home, About, Roadmap):
- Centered single column
- Max-width: 720px
- Generous whitespace: 96px between sections

**Hubs / Dashboards**:
- Asymmetric two-column: 65% content / 35% context
- Stacked panels in right column
- Gap: 24px

---

## Motion Rules

### Principles
- Use `transform` and `opacity` only (GPU accelerated)
- Provide `prefers-reduced-motion` fallback
- Motion should feel snappy (200-300ms)

### Patterns

**Entrance**:
```css
@keyframes entrance {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
/* Duration: 240ms, Easing: cubic-bezier(0, 0, 0.2, 1) */
```

**Panel Transition**:
```css
/* Cross-fade + subtle scale */
opacity: 0 → 1
transform: scale(0.98) → scale(1)
/* Duration: 200ms */
```

**Hover Elevation**:
```css
transform: translateY(0) → translateY(-6px)
box-shadow: increase intensity
/* Duration: 200ms */
```

### Timing

| Animation | Duration | Easing |
|-----------|----------|--------|
| Entrance | 240ms | `cubic-bezier(0, 0, 0.2, 1)` |
| Panel Switch | 200ms | `ease-in-out` |
| Hover | 200ms | `ease-out` |

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Components to Ship

### Top Nav
- Compact height (64px)
- Logo left, search center, user menu right
- Backdrop blur on scroll
- Mobile: Logo + hamburger

### Hub Tabs
- Animated underline (slides to active tab)
- Per-hub accent color
- Keyboard accessible (arrow navigation)
- 2-5 tabs optimal

### Panel
```
┌─────────────────────────────┐
│ Header Title          [...] │
├─────────────────────────────┤
│ KPI Row: [Metric] [Trend]   │
├─────────────────────────────┤
│ Body content...             │
│                             │
├─────────────────────────────┤
│ [Action 1]  [Action 2]      │
└─────────────────────────────┘
```
- Border radius: 16px
- Padding: 24px
- Shadow on hover (optional)

### Match Viewer
```
┌─────────────────────────────────────────────┐
│ Replay Canvas                               │
│                                             │
├─────────────────────────────────────────────┤
│ [Play] |========●========| [Speed] [Time]  │
│ ● Kill    ○ Ability    ▲ Plant            │
└─────────────────────────────────────────────┘
┌──────────────┐
│ Side Panel   │
│ ──────────── │
│ Event: Kill  │
│ Player: TenZ │
│ Time: 1:24   │
└──────────────┘
```

### Data Card
```
┌─────────────────────────┐
│ Metric Name        [?]  │
├─────────────────────────┤
│         24,521          │
│    ↑ 12% vs last week   │
├─────────────────────────┤
│ [Sparkline]             │
├─────────────────────────┤
│ [View Details]          │
└─────────────────────────┘
```

---

## Accessibility Requirements

### Contrast
- Body text: ≥ 4.5:1 against background
- Large text (18px+ bold): ≥ 3:1
- Interactive elements: Visible focus states

### Keyboard Navigation
- All interactive elements: focusable
- Tab order: Logical, top-to-bottom
- Tabs: Arrow keys to navigate, Enter/Space to activate
- Escape: Close modals, dropdowns

### Focus Ring
```css
:focus-visible {
  outline: 3px solid var(--hub-accent);
  outline-offset: 2px;
}
```

### Semantic HTML
```html
<header>
  <nav aria-label="Main">...</nav>
</header>
<main>
  <nav aria-label="Hub">...</nav>
  <section aria-labelledby="panel-title">...</section>
</main>
<footer>...</footer>
```

---

## Responsive Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| Mobile | < 640px | Single column, stacked panels, bottom nav |
| Tablet | 640-1024px | Two columns where appropriate |
| Desktop | 1024-1440px | Full hub layouts |
| Wide | > 1440px | Max-width containers |

---

## References

### Inspiration
- **GT Standard**: https://gt-standard.com — Typographic system
- **Detail.design**: https://detail.design — Craft and motion language
- **Endex**: https://www.siteinspire.com/website/13263-endex — Data panels
- **Sunrise Robotics**: https://www.siteinspire.com/website/13268-sunrise-robotics — Motion

### Technical
- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/ — Accessibility standards
- **MDN prefers-reduced-motion**: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

---

*Document Version: [Ver002.000]*  
*Last Updated: 2026-03-22*  
*Owner: Design Lead*
