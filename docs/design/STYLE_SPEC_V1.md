[Ver001.000]

# 4NJZ4 TENET Platform — Style Specification v1
## Consultant-Ready Design System for MVP

**Date:** 2026-03-22  
**Status:** Draft for Review  
**Inspirations:** GT Standard (type), Ciridae/Endex (panels), Sunrise Robotics (motion)  
**Budget:** Zero-cost hosting (GitHub Pages/Vercel)  

---

## 1. Typography System (GT Standard-Based)

### Font Stack
```css
--font-display: 'GT Standard', 'Inter', -apple-system, sans-serif;
--font-body: 'GT Standard Text', 'Inter', -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', 'Fira Code', monospace;
```

### Type Scale (1.25 Modular Scale)

| Token | Size | Line Height | Weight | Usage |
|-------|------|-------------|--------|-------|
| `text-hero` | 72px / 4.5rem | 1.1 | 700 | Landing headlines |
| `text-display` | 48px / 3rem | 1.15 | 600 | Page titles |
| `text-headline` | 32px / 2rem | 1.2 | 600 | Hub headers |
| `text-subhead` | 24px / 1.5rem | 1.3 | 500 | Panel titles |
| `text-body-lg` | 18px / 1.125rem | 1.6 | 400 | Lead paragraphs |
| `text-body` | 16px / 1rem | 1.6 | 400 | Body copy |
| `text-caption` | 14px / 0.875rem | 1.5 | 500 | Labels, metadata |
| `text-micro` | 12px / 0.75rem | 1.4 | 500 | Badges, timestamps |

### Typographic Rules
- **Optical sizing:** Use display cuts for 32px+, text cuts for body
- **Max-width:** 65ch for body text (readability)
- **Letter-spacing:** -0.02em for headlines, 0 for body, +0.05em for micro/uppercase

---

## 2. Color System (Endex-Inspired)

### Base Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-primary` | `#0F1113` | Main background (charcoal) |
| `bg-secondary` | `#1A1D21` | Panel surfaces |
| `bg-tertiary` | `#252A2F` | Elevated panels, hover states |
| `bg-elevated` | `#2F353B` | Modals, dropdowns |

### Neutral Scale

| Token | Hex | Usage |
|-------|-----|-------|
| `neutral-100` | `#FFFFFF` | Primary text |
| `neutral-80` | `#C9CBCF` | Secondary text |
| `neutral-60` | `#8B8F96` | Tertiary text, disabled |
| `neutral-40` | `#5A5E65` | Borders, dividers |
| `neutral-20` | `#3A3E45` | Subtle borders |
| `neutral-0` | `#0F1113` | Backgrounds |

### Accent (Electric Cyan — Hub Identity)

| Token | Hex | Usage |
|-------|-----|-------|
| `accent-primary` | `#00D4FF` | CTAs, active states, links |
| `accent-hover` | `#33DDFF` | Hover states |
| `accent-subtle` | `#00D4FF20` | Subtle backgrounds |
| `accent-glow` | `#00D4FF40` | Glow effects |

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `success` | `#00E676` | Positive metrics, wins |
| `warning` | `#FFB300` | Warnings, draft states |
| `error` | `#FF5252` | Errors, losses |
| `info` | `#448AFF` | Information, neutral status |

### Hub Color Coding (Distinct Accents)

| Hub | Accent | Hex |
|-----|--------|-----|
| SATOR (Stats) | Electric Cyan | `#00D4FF` |
| ROTAS (Sim) | Warm Orange | `#FF6B35` |
| AREPO (Maps) | Lime Green | `#B8FF00` |
| OPERA (Fantasy) | Purple | `#B967FF` |
| TENET (Hub) | Gold | `#FFD700` |

---

## 3. Grid & Layout

### Container System

| Token | Max Width | Padding |
|-------|-----------|---------|
| `container-sm` | 640px | 16px |
| `container-md` | 880px | 24px |
| `container-lg` | 1100px | 32px |
| `container-xl` | 1400px | 48px |

### Layout Patterns

**Editorial Pages (Landing, Docs):**
- Single centered column (max 880px)
- Generous whitespace (80px section spacing)

**Hub Dashboards:**
- Asymmetric two-column: 65% primary / 35% context
- Gap: 24px between panels
- Left: Data panels, tables, visualizations
- Right: Lenses, controls, context

**Panel Grid:**
- 12-column modular grid
- Panel min-width: 280px
- Gap: 16px (compact) / 24px (comfortable)

### Spacing Scale (4px Base)

| Token | Value |
|-------|-------|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 24px |
| `space-6` | 32px |
| `space-7` | 48px |
| `space-8` | 64px |
| `space-9` | 96px |

---

## 4. Motion System (Sunrise Robotics-Inspired)

### Animation Principles
1. **Purposeful:** Motion clarifies, never decorates
2. **Fast:** 200-300ms for UI feedback
3. **Smooth:** Ease-out for entrances, ease-in-out for transitions
4. **Respectful:** Honor `prefers-reduced-motion`

### Timing Tokens

| Token | Duration | Easing |
|-------|----------|--------|
| `duration-fast` | 150ms | ease-out |
| `duration-normal` | 250ms | ease-out |
| `duration-slow` | 350ms | ease-in-out |
| `duration-slower` | 500ms | cubic-bezier(0.4, 0, 0.2, 1) |

### Motion Patterns

**Panel Entrance:**
```css
/* Fade + slight upward reveal */
opacity: 0 → 1
transform: translateY(12px) → translateY(0)
duration: 250ms
easing: ease-out
stagger: 50ms between panels
```

**Tab Lens Switch:**
```css
/* Cross-fade content, animate panel height */
opacity: 1 → 0 → 1 (cross-fade)
transform: translateX(-8px) → translateX(0) (subtle slide)
duration: 200ms
easing: ease-in-out
```

**Hover Elevation:**
```css
/* Subtle lift + shadow increase */
transform: translateY(0) → translateY(-2px)
box-shadow: 0 2px 8px rgba(0,0,0,0.2) → 0 8px 24px rgba(0,0,0,0.3)
duration: 200ms
```

**Status Badge Pulse:**
```css
/* Live indicator */
animation: pulse 2s infinite
scale: 1 → 1.05 → 1
opacity: 1 → 0.7 → 1
```

**Replay Scrub:**
```css
/* Timeline progress */
transform: scaleX(0) → scaleX(1)
transform-origin: left
duration: 100ms linear updates
```

---

## 5. Component Inventory (MVP)

### Global Components

**Header (Minimal):**
- Logo + wordmark (left)
- Hub switcher (center, dropdown on mobile)
- Search + Account (right)
- Height: 64px, sticky on scroll
- Backdrop blur when scrolled

**Footer (Minimal):**
- Links row: GitHub, Docs, Privacy
- Copyright
- Height: 48px

### Layout Components

**Panel (Core Container):**
```
Background: bg-secondary
Border: 1px solid neutral-20
Border-radius: 8px
Padding: space-5 (24px)
Shadow: 0 2px 8px rgba(0,0,0,0.15)
Hover: Elevated shadow (optional)
```

**Tabbed Lens Container:**
- Tab bar: horizontal, underline active state
- Content area: fades/slides on tab change
- Supports: 2-5 tabs optimal

**Two-Column Hub Layout:**
- Left (65%): Primary data panel
- Right (35%): Context panel stack
- Responsive: Stacks on <768px

### Content Components

**Hero (Landing):**
- Type-first: text-hero headline
- Subhead: text-body-lg, max 55ch
- CTA button group (primary + secondary)
- Background: subtle gradient or abstract data viz

**Match Card:**
- Teams: logos + names
- Score: large display type
- Status: badge (live/upcoming/completed)
- Metadata: time, tournament, map
- Hover: Elevated panel + quick actions

**Replay Viewer:**
- Main: Video/replay canvas
- Controls: Play/pause, scrub bar, speed
- Timeline: Event markers (kills, rounds)
- Panels: Team stats, player cams

**Data Table (Matches/Players):**
- Header: sortable columns
- Rows: hover highlight
- Pagination: load more / infinite scroll
- Empty: illustration + CTA

**Status Badge:**
```
Variants: live, upcoming, completed, draft
Live: accent-primary + pulse animation
Shape: pill (border-radius: 999px)
Padding: 4px 12px
```

**Button:**
```
Primary: accent-primary bg, neutral-0 text
Secondary: transparent bg, accent-primary border + text
Ghost: transparent, neutral-80 text
Size: 40px height, 16px horizontal padding
Border-radius: 6px
```

### Navigation Components

**Hub Switcher:**
- Dropdown on mobile
- Tab bar on desktop
- Icons + labels for each hub
- Active: accent color + underline

**Breadcrumbs:**
- Hub > Section > Page
- Truncate middle on overflow
- Clickable parent levels

---

## 6. Responsive Breakpoints

| Name | Width | Behavior |
|------|-------|----------|
| `mobile` | < 640px | Single column, stacked panels, hamburger nav |
| `tablet` | 640-1024px | Two columns where appropriate, condensed spacing |
| `desktop` | 1024-1440px | Full two-column hubs, comfortable spacing |
| `wide` | > 1440px | Max-width containers, generous whitespace |

### Mobile Adaptations
- Header: Logo + hamburger
- Hub switcher: Bottom tab bar (iOS style) or drawer
- Panels: Full width, stacked
- Tables: Card view or horizontal scroll
- Typography: Scale down 15%

---

## 7. Accessibility Requirements

### Color Contrast
- All text: WCAG AA (4.5:1) minimum
- Large text (18px+ bold): WCAG AA (3:1)
- Interactive elements: Visible focus states

### Motion
- Respect `prefers-reduced-motion`
- Fallback: Instant transitions instead of animated

### Keyboard Navigation
- All interactive elements: focusable
- Tab order: Logical, top-to-bottom
- Escape: Close modals, dropdowns
- Enter/Space: Activate buttons, links

### Screen Readers
- Landmarks: `<header>`, `<main>`, `<nav>`, `<footer>`
- Headings: Proper hierarchy (h1 → h2 → h3)
- Images: Descriptive alt text
- Live regions: For status updates, loading states

---

## 8. Implementation Notes

### Tech Stack Recommendation
- **Framework:** Next.js (static export) or Astro
- **Styling:** CSS Modules or Tailwind with custom tokens
- **Animation:** Framer Motion (React) or vanilla CSS transitions
- **Hosting:** GitHub Pages (free) or Vercel (free tier)
- **CMS:** Markdown files (Git-based) or Sanity (free tier)

### Token Implementation (CSS Variables)
```css
:root {
  /* Colors */
  --bg-primary: #0F1113;
  --bg-secondary: #1A1D21;
  --accent-primary: #00D4FF;
  
  /* Typography */
  --font-display: 'GT Standard', sans-serif;
  --text-hero: 4.5rem;
  
  /* Spacing */
  --space-4: 1rem;
  
  /* Motion */
  --duration-normal: 250ms;
}
```

### Performance Targets
- First Contentful Paint: < 1.5s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Bundle size: < 200KB initial

---

## 9. Deliverables Checklist

### Design Phase
- [ ] Style guide (this document)
- [ ] Component library in Figma
- [ ] Landing page mockup
- [ ] Hub shell mockup (with tabbed lenses)
- [ ] Match detail mockup

### Development Phase
- [ ] CSS token file
- [ ] Component library (Storybook)
- [ ] Landing page
- [ ] Hub shell with routing
- [ ] Match viewer prototype

### Launch Phase
- [ ] Accessibility audit
- [ ] Performance optimization
- [ ] SEO meta tags
- [ ] Analytics integration (privacy-friendly)

---

## 10. References

### Inspiration Sites
- **GT Standard:** https://gt-standard.com (type system)
- **Endex:** https://www.siteinspire.com/website/13263-endex (panels)
- **Ciridae:** Panel layouts, editorial clarity
- **Sunrise Robotics:** https://www.siteinspire.com/website/13268-sunrise-robotics (motion)
- **Detail Design:** https://detail.design (data presentation)

### Technical Resources
- GitHub Pages: https://docs.github.com/pages
- Vercel: https://vercel.com (free tier)
- Framer Motion: https://www.framer.com/motion/

---

*Document Version: [Ver001.000]*  
*Next Review: After design phase completion*  
*Owner: Design Lead / Foreman Agent*
