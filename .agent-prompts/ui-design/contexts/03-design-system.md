# 03 - Design System
## Visual Design Tokens & Component Guidelines

---

## Color System

### Primary Palette

```css
/* Dark Slate — Primary Background */
--color-primary-bg: #0F172A;
--color-primary-bg-light: #1E293B;
--color-primary-bg-lighter: #334155;

/* Text Colors */
--color-text-primary: #F8FAFC;
--color-text-secondary: #94A3B8;
--color-text-muted: #64748B;

/* Accent Colors */
--color-accent-rotas: #14B8A6;      /* Teal — ROTAS/SATOR */
--color-accent-rotas-light: #2DD4BF;
--color-accent-rotas-dark: #0D9488;

--color-accent-opera: #F97316;      /* Orange — OPERA/AREPO */
--color-accent-opera-light: #FB923C;
--color-accent-opera-dark: #EA580C;
```

### HUB Color Mapping

| HUB | Primary | Light | Dark | Usage |
|-----|---------|-------|------|-------|
| ROTAS | #14B8A6 | #2DD4BF | #0D9488 | Leaderboards, stats tables |
| SATOR | #14B8A6 | #2DD4BF | #0D9488 | Analytics charts, gauges |
| OPERA | #F97316 | #FB923C | #EA580C | Tournament cards, schedules |
| AREPO | #F97316 | #FB923C | #EA580C | Forum topics, community |

### Semantic Colors

```css
--color-success: #22C55E;
--color-warning: #EAB308;
--color-error: #EF4444;
--color-info: #3B82F6;
```

### Valorant-Inspired Accents

```css
/* From design analysis */
--valorant-red: #FF4655;
--valorant-dark-bg: #0F1419;
--valorant-teal: #00D4AA;
```

---

## Typography

### Font Stack

```css
/* Headings — Geometric Sans */
--font-heading: 'Inter', 'SF Pro Display', -apple-system, sans-serif;

/* Body — Clean Sans */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;

/* Data/Monospace — For stats, numbers */
--font-mono: 'JetBrains Mono', 'Fira Code', 'SF Mono', monospace;
```

### Type Scale

| Token | Size | Weight | Line Height | Usage |
|-------|------|--------|-------------|-------|
| text-hero | 48px | 700 | 1.1 | Landing page headlines |
| text-h1 | 36px | 700 | 1.2 | Page titles |
| text-h2 | 28px | 600 | 1.3 | Section headers |
| text-h3 | 22px | 600 | 1.4 | Card titles |
| text-h4 | 18px | 600 | 1.4 | Subsection titles |
| text-body | 16px | 400 | 1.6 | Body text |
| text-body-sm | 14px | 400 | 1.5 | Secondary text |
| text-caption | 12px | 500 | 1.4 | Labels, timestamps |
| text-data | 14px | 600 | 1.2 | Stats, numbers (mono) |

---

## Spacing System

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
--space-16: 64px;
```

### Layout Grid

- **Container max-width:** 1400px
- **Grid:** 12-column
- **Gutter:** 24px
- **Padding (desktop):** 32px
- **Padding (mobile):** 16px

---

## Component Patterns

### Card Variants

```typescript
// HUB-specific card styles
interface CardProps {
  variant: 'rotas' | 'sator' | 'opera' | 'arepo' | 'neutral';
  elevation: 'flat' | 'raised' | 'floating';
}

// Usage
<Card variant="rotas" elevation="raised">
  {/* Teal accent border, dark bg */}
</Card>

<Card variant="opera" elevation="floating">
  {/* Orange accent, shadow */}
</Card>
```

### Button Variants

```typescript
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost' | 'accent';
  size: 'sm' | 'md' | 'lg';
  hub?: 'rotas' | 'sator' | 'opera' | 'arepo';
}

// Primary — Solid accent color
// Secondary — Outlined
// Ghost — Text only
// Accent — Hub-colored (teal/orange)
```

### Data Table Pattern

```typescript
// ROTAS-style dense data table
<DataTable
  columns={[
    { key: 'rank', label: '#', width: '60px' },
    { key: 'player', label: 'Player', width: '200px' },
    { key: 'team', label: 'Team', width: '150px' },
    { key: 'kd', label: 'K/D', width: '80px', align: 'right' },
    { key: 'adr', label: 'ADR', width: '80px', align: 'right' },
    { key: 'rating', label: 'Rating', width: '100px', align: 'right' },
  ]}
  data={playerStats}
  sortable
  filterable
/>
```

---

## Progressive Disclosure UI

### Three-Tier Display

```typescript
// Tier 1: Casual — Essential only
<CasualView>
  <MatchResult team1="Team A" team2="Team B" score="2-1" />
  <PlayerHighlight name="TenZ" stats={{ kills: 25, rating: 1.45 }} />
</CasualView>

// Tier 2: Aspiring — Details on interaction
<AspiringView>
  <MatchResult expanded>
    <RoundBreakdown rounds={match.rounds} />
    <EconomyChart economy={match.economy} />
  </MatchResult>
  <PlayerStatsDetailed player={player} />
</AspiringView>

// Tier 3: Professional — Full data access
<ProfessionalView>
  <RawDataTable data={player.rawStats} />
  <ExportTools formats={['csv', 'json', 'xlsx']} />
  <APIAccess docsLink="/api-docs" />
</ProfessionalView>
```

---

## Animation Guidelines

### Micro-interactions

```css
/* Hover transitions */
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 350ms ease;

/* Easing */
--ease-out: cubic-bezier(0.16, 1, 0.3, 1);
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
```

### Page Transitions

```typescript
// Framer Motion variants
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const transition = {
  duration: 0.3,
  ease: [0.16, 1, 0.3, 1],
};
```

### Loading States

```typescript
// Skeleton loading for data tables
<SkeletonTable rows={10} columns={6} />

// Spinner for buttons
<Button loading={isLoading}>
  {isLoading ? <Spinner size="sm" /> : 'Load Data'}
</Button>
```

---

## Responsive Breakpoints

```css
--breakpoint-sm: 640px;   /* Mobile landscape */
--breakpoint-md: 768px;   /* Tablet */
--breakpoint-lg: 1024px;  /* Desktop */
--breakpoint-xl: 1280px;  /* Large desktop */
--breakpoint-2xl: 1536px; /* Extra large */
```

### Responsive Patterns

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Navigation | Hamburger menu | Collapsible sidebar | Persistent sidebar |
| Stats Tables | Scroll horizontal | Condensed columns | Full columns |
| Player Cards | Stacked vertical | 2-column grid | 4-column grid |
| HUB Layout | Single column | 2×2 grid | Full 4-quarter layout |

---

## Accessibility Requirements

```css
/* Focus indicators */
--focus-ring: 0 0 0 3px rgba(20, 184, 166, 0.4);

/* Minimum contrast ratios */
/* Text on bg-primary: 4.5:1 minimum */
/* Large text on bg-primary: 3:1 minimum */
```

### ARIA Patterns

- Tables: `role="table"`, `aria-sort` for sortable columns
- Navigation: `role="navigation"`, `aria-label` for HUB nav
- Live regions: `aria-live="polite"` for score updates

---

## Design Tokens File

```typescript
// design-tokens.ts
export const colors = {
  primary: {
    bg: '#0F172A',
    bgLight: '#1E293B',
    bgLighter: '#334155',
  },
  text: {
    primary: '#F8FAFC',
    secondary: '#94A3B8',
    muted: '#64748B',
  },
  accent: {
    rotas: '#14B8A6',
    opera: '#F97316',
  },
};

export const typography = {
  heading: "'Inter', sans-serif",
  body: "'Inter', sans-serif",
  mono: "'JetBrains Mono', monospace",
};

export const spacing = {
  1: '4px',
  2: '8px',
  // ... etc
};
```

---

*Reference: docs/design-system/README.md for complete guidelines*
