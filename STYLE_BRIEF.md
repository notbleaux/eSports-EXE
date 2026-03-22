[Ver001.000]

# eSports-EXE — Visual Style Brief
## Type-First, Motion-Forward Enterprise UI

**Project**: 4NJZ4 TENET Platform  
**Date**: 2026-03-22  
**Status**: Approved for MVP  
**Inspirations**: GT Standard (typography), Ciridae/Endex (panels), Sunrise Robotics (motion)  

---

## Design Intent

Type-first, motion-forward enterprise UI with panelled, tabbed hubs. Each hub has a distinct accent while sharing a single modular system.

**Core Principles**:
1. **Data feels editorial** — authoritative typography, clear hierarchy
2. **Alive and discoverable** — purposeful motion guides attention
3. **Modular hubs** — consistent shell, unique accents per hub
4. **Accessible by default** — keyboard, screen reader, reduced motion support

---

## Design Tokens

### CSS Variables

```css
:root {
  /* Backgrounds */
  --color-bg: #F6F5F4;
  --color-surface: #FFFFFF;
  --color-surface-elevated: #FAFAFA;
  
  /* Text */
  --color-text: #111217;
  --color-text-secondary: #6B6F76;
  --color-text-muted: #9A9EA5;
  
  /* Borders */
  --color-border: #E5E5E7;
  --color-border-subtle: #F0F0F1;
  
  /* Hub Accents */
  --accent-analytics: #00C8FF;
  --accent-events: #FFB86B;
  --accent-replays: #8A6CFF;
  
  /* Semantic */
  --color-success: #00C48C;
  --color-warning: #FFB86B;
  --color-error: #FF5C5C;
  --color-info: #448AFF;
  
  /* Radius */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  
  /* Spacing */
  --gap-xs: 4px;
  --gap-sm: 8px;
  --gap-md: 16px;
  --gap-lg: 24px;
  --gap-xl: 32px;
  --gap-2xl: 48px;
  
  /* Container */
  --container-max: 1200px;
  --container-narrow: 880px;
  
  /* Typography */
  --type-scale-ratio: 1.25;
  --font-sans: "GT Standard", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --font-serif: "Merriweather", Georgia, "Times New Roman", serif;
  --font-mono: "JetBrains Mono", "Fira Code", "SF Mono", Consolas, monospace;
  
  /* Motion */
  --duration-fast: 150ms;
  --duration-normal: 240ms;
  --duration-slow: 350ms;
  --easing-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --easing-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

---

## Typography

### Type Scale (1.25 Modular Ratio)

| Level | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| **H1** | 64px / 4rem | 1.05 | 700 | Hero headlines |
| **H2** | 48px / 3rem | 1.1 | 600 | Page titles |
| **H3** | 32px / 2rem | 1.15 | 600 | Hub headers |
| **H4** | 24px / 1.5rem | 1.2 | 500 | Panel titles |
| **H5** | 20px / 1.25rem | 1.3 | 500 | Card titles |
| **Body** | 16px / 1rem | 1.5 | 400 | Body text |
| **Small** | 14px / 0.875rem | 1.5 | 400 | Captions |
| **Micro** | 12px / 0.75rem | 1.4 | 500 | Labels, timestamps |

### Font Families

**Headings**: GT Standard variable geometric sans  
- Weights: 400 (Regular), 500 (Medium), 600 (Semibold), 700 (Bold)
- Optical sizing: Display cuts for 32px+, Text cuts for body

**Body**: Humanist serif or neutral sans  
- Recommendation: Merriweather (editorial) or Inter (neutral)
- Max-width: 65ch for optimal reading

**Code/Monospace**: JetBrains Mono  
- Use for: Timestamps, stats, JSON snippets

### Typography Rules

```css
/* Headings */
h1, h2, h3 { font-family: var(--font-sans); letter-spacing: -0.02em; }
h4, h5, h6 { font-family: var(--font-sans); letter-spacing: -0.01em; }

/* Body */
body { font-family: var(--font-serif); line-height: 1.6; }

/* Uppercase labels */
.label { text-transform: uppercase; letter-spacing: 0.05em; font-size: 12px; }
```

---

## Color Palette

### Base Colors

| Token | Hex | Usage |
|-------|-----|-------|
| **Charcoal** | `#111217` | Primary text, headings |
| **Warm Gray 100** | `#F6F5F4` | Page background |
| **Warm Gray 200** | `#E5E5E7` | Borders, dividers |
| **Surface** | `#FFFFFF` | Cards, panels, modals |

### Hub Accents

| Hub | Accent | Hex | RGBA |
|-----|--------|-----|------|
| **Analytics** | Electric Cyan | `#00C8FF` | rgba(0, 200, 255, 1) |
| **Events** | Warm Orange | `#FFB86B` | rgba(255, 184, 107, 1) |
| **Replays** | Purple | `#8A6CFF` | rgba(138, 108, 255, 1) |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| **Success** | `#00C48C` | Wins, positive metrics, confirmations |
| **Warning** | `#FFB86B` | Drafts, pending, cautions |
| **Error** | `#FF5C5C` | Losses, errors, deletions |
| **Info** | `#448AFF` | Neutral status, information |

### Color Usage Patterns

```css
/* Primary actions */
.btn-primary { background: var(--accent-analytics); color: white; }

/* Hub identity */
.hub-analytics { --hub-accent: var(--accent-analytics); }
.hub-events { --hub-accent: var(--accent-events); }
.hub-replays { --hub-accent: var(--accent-replays); }

/* Status badges */
.badge-live { background: var(--color-error); color: white; }
.badge-completed { background: var(--color-success); color: white; }
```

---

## Grid & Layout

### Container System

| Token | Max Width | Usage |
|-------|-----------|-------|
| `container-full` | 100% | Fluid layouts |
| `container-xl` | 1400px | Wide dashboards |
| `container-lg` | 1200px | Default container |
| `container-md` | 960px | Hub content |
| `container-narrow` | 880px | Editorial pages |
| `container-sm` | 640px | Mobile-first |

### Grid System

**12-column responsive grid**:
```css
.grid { display: grid; grid-template-columns: repeat(12, 1fr); gap: var(--gap-lg); }
.col-6 { grid-column: span 6; }
.col-4 { grid-column: span 4; }
.col-3 { grid-column: span 3; }
```

### Layout Patterns

**Editorial Pages** (Landing, About):
- Single centered column
- Max-width: 880px
- Generous whitespace (80px section padding)

**Hub Dashboards**:
- Asymmetric two-column: 65% content / 35% context
- Gap: 24px
- Left: Data tables, visualizations
- Right: Lenses, filters, metadata

**Panels**:
- Background: `--color-surface`
- Border-radius: `--radius-lg` (16px)
- Padding: `--gap-lg` (24px)
- Shadow: `0 2px 8px rgba(0,0,0,0.06)`
- Hover shadow: `0 8px 24px rgba(0,0,0,0.1)`

---

## Motion System

### Animation Principles

1. **Purposeful** — Motion clarifies, never decorates
2. **Fast** — 150-350ms for UI feedback
3. **Smooth** — Custom easing curves
4. **Respectful** — Honor `prefers-reduced-motion`

### Timing

| Token | Duration | Usage |
|-------|----------|-------|
| `--duration-fast` | 150ms | Hover states, micro-interactions |
| `--duration-normal` | 240ms | Panel entrances, tab switches |
| `--duration-slow` | 350ms | Page transitions, complex sequences |

### Easing

| Token | Curve | Usage |
|-------|-------|-------|
| `--easing-out` | `cubic-bezier(0.2, 0.8, 0.2, 1)` | Entrances, reveals |
| `--easing-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Tab switches, toggles |

### Motion Patterns

**Panel Entrance**:
```css
@keyframes panel-enter {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}
.panel { animation: panel-enter var(--duration-normal) var(--easing-out); }
```

**Tab Panel Switch**:
```css
.tab-panel {
  transition: opacity var(--duration-fast) var(--easing-in-out),
              transform var(--duration-fast) var(--easing-in-out);
}
.tab-panel.exit { opacity: 0; transform: scale(0.98); }
.tab-panel.enter { opacity: 1; transform: scale(1); }
```

**Hover Elevation**:
```css
.panel-hover {
  transition: transform var(--duration-fast) var(--easing-out),
              box-shadow var(--duration-fast) var(--easing-out);
}
.panel-hover:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 32px rgba(0,0,0,0.12);
}
```

**Live Badge Pulse**:
```css
@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.05); }
}
.badge-live { animation: pulse 2s infinite; }
```

### Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

---

## Components (Priority)

### Global

**Top Navigation**:
- Height: 64px
- Logo left, search center, user menu right
- Background: `--color-surface` with backdrop blur
- Shadow on scroll

**Footer**:
- Height: 48px
- Links: GitHub, Docs, Privacy
- Minimal, clean

### Layout

**Panel**:
```css
.panel {
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  padding: var(--gap-lg);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
```

**Tabbed Container**:
- Tab bar: horizontal, underline active state
- Animated indicator
- Content: cross-fade on switch
- Keyboard: arrow navigation, Enter/Space activation

**Two-Column Hub**:
```css
.hub-layout {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: var(--gap-lg);
}
@media (max-width: 768px) {
  .hub-layout { grid-template-columns: 1fr; }
}
```

### Content

**Data Card**:
- Header: title, subtitle, badge
- KPI row: large number, trend indicator
- Optional: sparkline chart
- Actions: button row

**Match Card**:
- Teams: logos, names
- Score: large display type (H2)
- Status: badge (live/upcoming/completed)
- Metadata: map, tournament, time
- Hover: lift + shadow

**Replay Canvas**:
- Full-bleed canvas area
- Timeline scrub bar
- Event markers on timeline
- Side panel: context, stats

**Timeline**:
- Horizontal scrub bar
- Play/pause controls
- Time display (MM:SS)
- Event markers as dots/icons

### Controls

**Button**:
```css
.btn {
  height: 40px;
  padding: 0 16px;
  border-radius: var(--radius-sm);
  font-weight: 500;
  transition: all var(--duration-fast) var(--easing-out);
}
.btn-primary { background: var(--hub-accent); color: white; }
.btn-secondary { background: transparent; border: 1px solid var(--color-border); }
```

**Status Badge**:
```css
.badge {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
```

---

## Accessibility

### Requirements

| Criterion | Standard | Implementation |
|-----------|----------|----------------|
| Color Contrast | WCAG AA 4.5:1 | All body text meets ratio |
| Focus Visible | WCAG 2.4.7 | 3px solid accent outline |
| Keyboard Navigation | WCAG 2.1.1 | All interactive elements focusable |
| Reduced Motion | WCAG 2.3.3 | Respect `prefers-reduced-motion` |
| Screen Readers | WCAG 1.3.1 | Semantic HTML, ARIA labels |

### Focus States

```css
:focus-visible {
  outline: 3px solid var(--hub-accent);
  outline-offset: 2px;
}
```

### Semantic HTML

```html
<header><!-- Logo, nav --></header>
<main>
  <nav aria-label="Hub navigation"><!-- Tabs --></nav>
  <section aria-labelledby="panel-title"><!-- Content --></section>
</main>
<footer><!-- Links --></footer>
```

---

## Responsive Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `xs` | < 480px | Single column, stacked panels |
| `sm` | 480-640px | Single column, larger touch targets |
| `md` | 640-1024px | Two columns where appropriate |
| `lg` | 1024-1440px | Full hub layouts |
| `xl` | > 1440px | Max-width containers |

### Mobile Adaptations

- Header: Logo + hamburger menu
- Hub switcher: Bottom tab bar
- Panels: Full width, stacked
- Tables: Card view or horizontal scroll
- Typography: Scale down ~10%

---

## File References

### Inspirations
- **GT Standard**: https://gt-standard.com (type system)
- **Endex**: https://www.siteinspire.com/website/13263-endex (panels)
- **Ciridae**: Panel layouts, editorial clarity
- **Sunrise Robotics**: https://www.siteinspire.com/website/13268-sunrise-robotics (motion)

### Technical
- **GitHub Pages**: https://docs.github.com/pages
- **Framer Motion**: https://www.framer.com/motion/

---

*Document Version: [Ver001.000]*  
*Next Review: After component library implementation*  
*Owner: Design Lead*
