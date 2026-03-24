[Ver001.000]

# WAVE 1.3 — VISUAL SYSTEM FOUNDATION (3 Agents)
**Priority:** P0  
**Estimated:** 24 hours total (8h each)  
**Dependencies:** Hero colors (Wave 1.1), mascot colors (Wave 1.2)

---

## OVERVIEW

Create the complete visual design system: 13 seasonal styling suites, logo/symbol systems, and typography/free space principles.

---

## AGENT 3-A: 13 Seasonal Styling Suites

### Task
Define complete CSS and Godot theme resources for all 13 seasonal suites.

### Suite Definitions

```typescript
// Complete 13-suite specification
const SEASONAL_SUITES = [
  {
    id: 1,
    name: 'Spring Awakening',
    theme: 'New beginnings, fresh growth',
    colors: {
      primary: '#4ade80',      // Fresh green
      secondary: '#f472b6',    // Cherry pink
      accent: '#fbbf24',       // Sun yellow
      background: '#f0fdf4',   // Mint cream
      surface: '#ffffff',
      text: '#14532d'
    },
    effects: {
      particles: 'pollen_drift',
      animation: 'gentle_sway',
      soundscape: 'birds_morning'
    },
    hero_focus: null, // General onboarding
    unlock_condition: 'default'
  },
  {
    id: 2,
    name: 'Cherry Blossom',
    theme: 'NJZ signature, ephemeral beauty',
    colors: {
      primary: '#f472b6',
      secondary: '#fb7185',
      accent: '#fcd34d',
      background: '#fdf2f8',
      surface: '#ffffff',
      text: '#831843'
    },
    effects: {
      particles: 'petal_fall',
      animation: 'bloom_burst',
      soundscape: 'soft_wind'
    },
    hero_focus: null,
    unlock_condition: 'default'
  },
  {
    id: 3,
    name: 'Summer Solstice',
    theme: 'Peak energy, solar maximum',
    colors: {
      primary: '#fbbf24',
      secondary: '#f97316',
      accent: '#3b82f6',
      background: '#fffbeb',
      surface: '#ffffff',
      text: '#92400e'
    },
    effects: {
      particles: 'sun_sparkle',
      animation: 'heat_shimmer',
      soundscape: 'cricket_day'
    },
    hero_focus: 'sol',
    unlock_condition: 'sol_events_completed:3'
  },
  // ... continue for all 13
  {
    id: 13,
    name: 'Hyper Exclusive',
    theme: 'Beyond seasons, ultimate prestige',
    colors: {
      primary: '#0f172a',      // Deep void
      secondary: '#1e1b4b',    // Dark indigo
      accent: 'prism',         // Cycling rainbow
      background: '#020617',
      surface: '#0f172a',
      text: '#e2e8f0'
    },
    effects: {
      particles: 'nebula_swirl',
      animation: 'prism_shift',
      soundscape: 'ethereal_choir'
    },
    hero_focus: null,
    unlock_condition: 'tier_13_achieved'
  }
];
```

### CSS Variable Output

```css
/* Auto-generated from suite definitions */
:root {
  /* Suite 1: Spring Awakening */
  --suite-1-primary: #4ade80;
  --suite-1-secondary: #f472b6;
  --suite-1-accent: #fbbf24;
  --suite-1-bg: #f0fdf4;
  --suite-1-surface: #ffffff;
  --suite-1-text: #14532d;
  
  /* Suite 2: Cherry Blossom */
  --suite-2-primary: #f472b6;
  /* ... etc for all 13 */
  
  /* Active suite (JS updates this) */
  --active-suite: 1;
  --color-primary: var(--suite-1-primary);
  --color-secondary: var(--suite-2-secondary);
  /* ... all reference active suite */
}
```

### Godot Theme Resources

```gdscript
# Generated .tres files
# res://themes/seasonal/suite_1_spring.tres
# res://themes/seasonal/suite_2_cherry.tres
# ... etc

# Dynamic loading
func load_seasonal_theme(suite_id: int):
    var theme_path = "res://themes/seasonal/suite_%d.tres" % suite_id
    var theme = load(theme_path)
    get_tree().root.theme = theme
```

### Deliverables
1. Complete 13-suite JSON spec
2. CSS variable generator script
3. Godot theme resource templates
4. Transition animation spec (how suites blend)

---

## AGENT 3-B: Logo & Symbol System

### Task
Define complete logo architecture and symbol library.

### Logo Hierarchy

```
Primary Logo: 4NJZ4 + SATOR Square
├── Main: Full lockup with cherry motifs
├── Compact: Icon only (square)
├── Wordmark: 4NJZ4 text only
└── Favicon: 16x16, 32x32 variants

Secondary Marks:
├── TENET Dial (animated)
├── Vine Runes (decorative)
└── Bubble Glyphs (?ji!•IlLrRPp)
```

### SATOR Square + NJZ Integration

```
[S][A][T][O][R]
[A][R][E][P][O]
[T][E][N][E][T]
[O][P][E][R][A]
[R][O][T][A][S]

+ Central cherry blossom
+ Quarterly grid overlay
+ 4NJZ4 logomark below
```

### Vine Runes (Decorative)

| Rune | Meaning | Usage |
|------|---------|-------|
| ᚠ | Growth | Spring, new features |
| ᚢ | Connection | Social, teams |
| ᚦ | Challenge | Competitive modes |
| ᚨ | Wisdom | Analytics, stats |
| ᚱ | Speed | Performance |

### Bubble Glyphs

Original set: `? j i ! • I l L r R P p`

Usage:
- Spinning dial decoration
- Loading states
- Secret codes/easter eggs

### Deliverables
1. SVG logo files (all variants)
2. Symbol font/glyph sheet
3. Usage guidelines (spacing, minimum size, don'ts)
4. Animation specs for TENET dial

---

## AGENT 3-C: Typography & Free Space

### Task
Define complete typography system and "free space" (Goya math) grid principles.

### Typography System

```css
/* Primary: Hyperpop Sans */
@font-face {
  font-family: 'Hyperpop';
  src: url('/fonts/hyperpop-variable.woff2') format('woff2');
  font-weight: 300 900;
  font-display: swap;
}

/* Secondary: Rune Mono */
@font-face {
  font-family: 'Rune Mono';
  src: url('/fonts/rune-mono.woff2') format('woff2');
  font-display: swap;
}

/* Fallback stack */
--font-primary: 'Hyperpop', system-ui, sans-serif;
--font-secondary: 'Rune Mono', 'Fira Code', monospace;
```

### Type Scale

| Level | Size | Weight | Use |
|-------|------|--------|-----|
| Display | fluid(48, 96) | 900 | Hero titles |
| H1 | fluid(32, 64) | 800 | Page titles |
| H2 | fluid(24, 48) | 700 | Section headers |
| H3 | fluid(20, 32) | 600 | Card titles |
| Body | fluid(16, 20) | 400 | Paragraphs |
| Caption | fluid(12, 14) | 400 | Labels, meta |
| Mono | fluid(14, 16) | 500 | Stats, code |

### Goya Math: Free Space Grid

Based on Francisco Goya's compositional principles:

```
Grid System: "Rule of Thirds" + "Golden Ratio" hybrid

┌─────────────────────────────────┐
│     A       │        B          │
│   (1/3)     │      (2/3)        │
│─────────────┼───────────────────│
│             │                   │
│     C       │        D          │
│  (divine    │    (active        │
│   ratio)    │     space)        │
│             │                   │
└─────────────────────────────────┘

- A: Hero/portrait focus
- B: Content, data
- C: Secondary nav, context
- D: Primary interaction space

Margins: 8% of viewport (breathing room)
Gutters: 24px (4px grid aligned)
```

### Fluid Typography Function

```typescript
// From extracted fluid.ts — refined
export const fluidFont = (
  minSize: number,    // px at mobile
  maxSize: number,    // px at desktop
  minVw: number = 375,
  maxVw: number = 1920
): string => {
  const slope = (maxSize - minSize) / (maxVw - minVw);
  const intercept = minSize - slope * minVw;
  return `clamp(${minSize}px, ${intercept.toFixed(2)}px + ${(slope * 100).toFixed(2)}vw, ${maxSize}px)`;
};

// Usage: font-size: ${fluidFont(16, 24)};
```

### Free Space Principles

1. **40% Empty:** Never fill more than 60% of viewport
2. **Breathing Room:** 8% margins minimum
3. **Visual Hierarchy:** Most important element gets most space
4. **Motion Rest:** Still areas balance animated ones

### Deliverables
1. Typography CSS/SCSS file
2. Font files or CDN links
3. Type scale documentation
4. Goya grid template (Figma/CSS)
5. Fluid typography utility functions

---

## FOREMAN INTEGRATION

### Cross-Agent Dependencies

```
Agent 3-A needs:
  - Hero colors (1-A, 1-B, 1-C) → hero-focus suites
  - Mascot colors (2-A) → suite color harmony
  
Agent 3-B needs:
  - Hero archetypes (1-A, 1-B, 1-C) → rune meanings
  
Agent 3-C needs:
  - Nothing (can start immediately)
```

### Timeline
- Day 1-2: Agent 3-C (typography) — no deps
- Day 2-3: Agent 3-A waiting on color inputs
- Day 3-4: Agent 3-B with archetype context

---

*Submit all to `.job-board/02_CLAIMED/{agent-id}/`*
