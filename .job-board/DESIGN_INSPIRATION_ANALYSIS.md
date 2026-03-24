[Ver001.000]

# Design Inspiration Analysis for NJZ Website Redesign

**Source:** OneNote Design Mood Board  
**Key References:** Kunsthalle Basel, Boitano  
**Date:** 2026-03-23  
**Status:** Analysis Complete → Ready for Implementation

---

## 1. Color Palette Extraction

### Primary Palette (Bold & High Contrast)

| Color Name | Hex Value | Usage | CSS Variable |
|------------|-----------|-------|--------------|
| **Boitano Pink** | `#FF69B4` | Hero backgrounds, accents, CTAs | `--color-boitano-pink` |
| **Boitano Pink Dark** | `#E0529E` | Hover states, depth | `--color-boitano-pink-dark` |
| **Kunsthalle Green** | `#00D26A` | Success states, highlights | `--color-kunsthalle-green` |
| **Kunsthalle Green Dark** | `#00B85C` | Active states | `--color-kunsthalle-green-dark` |
| **Pure Black** | `#000000` | Text, borders, high contrast | `--color-pure-black` |
| **Off-White** | `#FAFAFA` | Light backgrounds | `--color-off-white` |
| **Warm White** | `#F5F5F0` | Card backgrounds, sections | `--color-warm-white` |

### Secondary Palette (Supporting Tones)

| Color Name | Hex Value | Usage |
|------------|-----------|-------|
| **Graphite** | `#2D2D2D` | Body text, secondary backgrounds |
| **Medium Gray** | `#6B6B6B` | Captions, metadata |
| **Light Gray** | `#E5E5E5` | Borders, dividers |
| **Pale Pink** | `#FFE4EC` | Subtle backgrounds, tags |
| **Mint Accent** | `#E8F5E9` | Success backgrounds |

### Gradient Patterns

```css
/* Radial spotlight effect (Kunsthalle style) */
--gradient-radial-spotlight: radial-gradient(
  circle at 30% 50%,
  rgba(255, 105, 180, 0.15) 0%,
  transparent 50%
);

/* Pink to green contrast gradient */
--gradient-pink-green: linear-gradient(
  135deg,
  var(--color-boitano-pink) 0%,
  var(--color-kunsthalle-green) 100%
);

/* Dark overlay for text readability */
--gradient-dark-overlay: linear-gradient(
  to top,
  rgba(0, 0, 0, 0.8) 0%,
  transparent 100%
);
```

---

## 2. Typography Patterns

### Font Stack Recommendation

```css
/* Primary: Clean geometric sans-serif */
--font-primary: 'Inter', 'SF Pro Display', -apple-system, BlinkMacSystemFont, sans-serif;

/* Display: Bold headlines (alternative: Space Grotesk, Neue Montreal) */
--font-display: 'Space Grotesk', 'Inter', sans-serif;

/* Mono: Data, stats, code */
--font-mono: 'JetBrains Mono', 'SF Mono', monospace;
```

### Type Scale (Desktop - 1440px base)

| Element | Size | Weight | Line Height | Letter Spacing |
|---------|------|--------|-------------|----------------|
| **Hero Display** | 120px / 7.5rem | 700 | 0.9 | -0.04em |
| **H1** | 72px / 4.5rem | 700 | 1.0 | -0.03em |
| **H2** | 48px / 3rem | 600 | 1.1 | -0.02em |
| **H3** | 32px / 2rem | 600 | 1.2 | -0.01em |
| **H4** | 24px / 1.5rem | 600 | 1.3 | 0 |
| **Body Large** | 20px / 1.25rem | 400 | 1.6 | 0 |
| **Body** | 16px / 1rem | 400 | 1.6 | 0 |
| **Caption** | 14px / 0.875rem | 500 | 1.4 | 0.02em |
| **Label** | 12px / 0.75rem | 600 | 1.2 | 0.08em |

### Typography Patterns from References

**Kunsthalle Basel Style:**
- Massive headlines that bleed off edges
- Mixed case with strategic uppercase for impact
- Text as graphic element (overlapping, rotated)
- Generous line-height for readability at large sizes

**Boitano Style:**
- Centered, single-line statements
- High contrast between text and background
- Minimal text, maximum impact
- All-caps for navigation and labels

### Implementation Classes

```css
/* Tailwind-style utility classes */
.text-hero-display {
  font-size: clamp(48px, 10vw, 120px);
  font-weight: 700;
  line-height: 0.9;
  letter-spacing: -0.04em;
}

.text-headline {
  font-size: clamp(32px, 5vw, 72px);
  font-weight: 700;
  line-height: 1.0;
  letter-spacing: -0.03em;
}

.label-uppercase {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}
```

---

## 3. Layout Principles

### Grid System: Asymmetric Dynamic Grid

```css
/* 12-column asymmetric grid */
.grid-asymmetric {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-6);
}

/* Common asymmetric patterns */
.pattern-hero {
  grid-template-areas:
    "head head head head head head . . . . . ."
    "content content content content . . . . . . . .";
}

.pattern-feature {
  grid-template-areas:
    ". . . . image image image image . . . ."
    "text text text text image image image image text2 text2 text2 text2";
}

.pattern-cards {
  grid-template-columns: 2fr 1fr 1fr;
}
```

### Spacing Scale

```css
/* 8px base unit */
--space-1: 4px;
--space-2: 8px;
--space-3: 16px;
--space-4: 24px;
--space-5: 32px;
--space-6: 48px;
--space-7: 64px;
--space-8: 96px;
--space-9: 128px;
--space-10: 192px;
```

### Box Adaptive Dynamic Stretches

**Pattern:** Elements that expand/contract based on viewport

```css
/* Dynamic width containers */
.container-stretch {
  width: 100%;
  max-width: 100vw;
  padding: 0 var(--space-4);
}

/* Content that breaks container */
.element-bleed {
  margin-left: calc(-1 * var(--space-4));
  margin-right: calc(-1 * var(--space-4));
  width: 100vw;
}

/* Responsive padding that scales */
.section-padding {
  padding: clamp(48px, 10vh, 128px) 0;
}
```

### Overlapping Elements Pattern

```css
/* Z-index layering system */
--z-base: 0;
--z-content: 10;
--z-overlay: 20;
--z-navigation: 30;
--z-modal: 40;
--z-top: 50;

/* Overlapping technique */
.overlap-container {
  position: relative;
}

.overlap-above {
  position: relative;
  z-index: var(--z-content);
  margin-top: -64px; /* Overlaps previous section */
}

.overlap-behind {
  position: absolute;
  inset: 0;
  z-index: var(--z-base);
}
```

---

## 4. Visual Effects

### Shadows (Minimal, High-Impact)

```css
/* Soft elevation (cards) */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Colored shadows for accents */
--shadow-pink: 0 20px 40px -10px rgba(255, 105, 180, 0.3);
--shadow-green: 0 20px 40px -10px rgba(0, 210, 106, 0.3);
```

### Animations & Transitions

**Radial Composition Entrance (Kunsthalle Style):**

```css
@keyframes radial-expand {
  from {
    clip-path: circle(0% at 50% 50%);
    opacity: 0;
  }
  to {
    clip-path: circle(150% at 50% 50%);
    opacity: 1;
  }
}

.animate-radial-expand {
  animation: radial-expand 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
```

**Side Scroller Smooth Scroll:**

```css
/* Horizontal scroll container */
.scroll-container {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

.scroll-item {
  flex: 0 0 100vw;
  scroll-snap-align: start;
}

/* Hide scrollbar */
.scroll-container::-webkit-scrollbar {
  display: none;
}
```

**Hover Micro-interactions:**

```css
/* Button hover lift */
.btn-hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.btn-hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lg);
}

/* Link underline animation */
.link-underline {
  position: relative;
}

.link-underline::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 2px;
  background: currentColor;
  transform: scaleX(0);
  transform-origin: right;
  transition: transform 0.3s ease;
}

.link-underline:hover::after {
  transform: scaleX(1);
  transform-origin: left;
}
```

### Geometric Accents

```css
/* Central geometric symbol (Boitano-style) */
.geometric-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 200px;
  height: 200px;
  border: 2px solid currentColor;
  border-radius: 50%; /* Or other shape */
}

/* Rotating accent element */
@keyframes slow-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.accent-rotate {
  animation: slow-rotate 60s linear infinite;
}
```

---

## 5. UI Components

### Buttons

**Primary Button (Pink Accent):**

```css
.btn-primary {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: var(--color-boitano-pink);
  color: white;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: none;
  border-radius: 0; /* Sharp edges for modern look */
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary:hover {
  background: var(--color-boitano-pink-dark);
  transform: translateY(-2px);
  box-shadow: var(--shadow-pink);
}
```

**Ghost Button (Outlined):**

```css
.btn-ghost {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-5);
  background: transparent;
  color: inherit;
  font-weight: 600;
  font-size: 14px;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border: 2px solid currentColor;
  border-radius: 0;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-ghost:hover {
  background: currentColor;
  color: var(--color-pure-black);
}
```

### Cards

**Content Card (Asymmetric):**

```css
.card-asymmetric {
  position: relative;
  background: var(--color-warm-white);
  padding: var(--space-6);
  overflow: hidden;
}

.card-asymmetric::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--color-boitano-pink);
}

.card-number {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  font-size: 48px;
  font-weight: 700;
  color: var(--color-light-gray);
  opacity: 0.5;
}
```

### Navigation

**Minimal Navigation (Boitano-style):**

```css
.nav-minimal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: var(--z-navigation);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-4) var(--space-6);
  mix-blend-mode: difference; /* Adapts to background */
  color: white;
}

.nav-logo {
  font-weight: 700;
  font-size: 18px;
  letter-spacing: -0.02em;
}

.nav-links {
  display: flex;
  gap: var(--space-6);
}

.nav-link {
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: inherit;
  text-decoration: none;
}
```

---

## 6. Recommendations for NJZ Website Redesign

### High-Priority Implementations

#### 1. Hero Section Redesign

**Current → Recommended:**
- Replace standard centered hero with **Kunsthalle-style asymmetric layout**
- Large, bleeding typography that extends beyond viewport
- Side-scroller for featured content (matches Kunsthalle landing page)
- Bold background color (Boitano pink) with geometric central element

**Implementation:**
```jsx
// Hero component structure
<HeroSection>
  <HeroBackground color="boitano-pink" />
  <GeometricSymbol 
    shape="circle" 
    center 
    animated 
  />
  <HeroHeadline 
    text="SATOR ANALYTICS"
    size="display"
    position="left-bleed"
  />
  <SideScroller>
    <FeatureCard />
    <FeatureCard />
    <FeatureCard />
  </SideScroller>
</HeroSection>
```

#### 2. Color System Integration

**Actions:**
1. Add CSS custom properties to `:root` in global styles
2. Create theme provider for dark/light variants
3. Implement `mix-blend-mode: difference` for navigation
4. Use Boitano pink sparingly for high-impact CTAs only

#### 3. Typography Overhaul

**Actions:**
1. Import Space Grotesk for display text
2. Implement fluid typography with `clamp()`
3. Create negative letter-spacing for headlines
4. Establish uppercase + tracking pattern for labels

#### 4. Layout Modernization

**Actions:**
1. Implement 12-column asymmetric grid system
2. Add overlap patterns between sections
3. Create dynamic stretch containers
4. Design card components with left accent borders

#### 5. Animation System

**Actions:**
1. Implement radial-expand reveal animation
2. Add smooth scroll for horizontal content
3. Create hover micro-interactions
4. Add geometric rotating accents

### Component Migration Plan

| Component | Current Style | New Style | Priority |
|-----------|--------------|-----------|----------|
| Hero | Centered, static | Asymmetric, scroller | P0 |
| Navigation | Standard header | Minimal, blend-mode | P0 |
| Buttons | Rounded, shadow | Sharp, colored shadow | P1 |
| Cards | Standard padding | Asymmetric, accent border | P1 |
| Typography | System defaults | Space Grotesk, fluid | P0 |
| Color System | Dark theme only | Pink/Green accents | P0 |

### File Structure for Implementation

```
apps/website-v2/src/
├── styles/
│   ├── design-system/
│   │   ├── colors.css          # Extracted color palette
│   │   ├── typography.css      # Fluid type scale
│   │   ├── spacing.css         # 8px grid system
│   │   └── shadows.css         # Elevation system
│   ├── components/
│   │   ├── buttons.css         # Button variants
│   │   ├── cards.css           # Card patterns
│   │   └── navigation.css      # Nav styles
│   └── animations/
│       ├── radial-expand.css   # Kunsthalle entrance
│       ├── scroll-snap.css     # Side scroller
│       └── hover.css           # Micro-interactions
└── components/
    └── design-system/
        ├── HeroAsymmetric.tsx
        ├── SideScroller.tsx
        ├── GeometricAccent.tsx
        └── NavigationMinimal.tsx
```

### Tailwind Configuration Updates

```javascript
// tailwind.config.js additions
module.exports = {
  theme: {
    extend: {
      colors: {
        'boitano-pink': '#FF69B4',
        'boitano-pink-dark': '#E0529E',
        'kunsthalle-green': '#00D26A',
        'graphite': '#2D2D2D',
        'warm-white': '#F5F5F0',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      fontSize: {
        'hero': ['clamp(48px, 10vw, 120px)', { lineHeight: '0.9', letterSpacing: '-0.04em' }],
        'headline': ['clamp(32px, 5vw, 72px)', { lineHeight: '1.0', letterSpacing: '-0.03em' }],
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      animation: {
        'radial-expand': 'radial-expand 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slow-rotate': 'slow-rotate 60s linear infinite',
      },
      keyframes: {
        'radial-expand': {
          '0%': { clipPath: 'circle(0% at 50% 50%)', opacity: '0' },
          '100%': { clipPath: 'circle(150% at 50% 50%)', opacity: '1' },
        },
        'slow-rotate': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
      },
    },
  },
}
```

---

## 7. Quick Reference: Design Tokens

```css
:root {
  /* Colors */
  --color-boitano-pink: #FF69B4;
  --color-kunsthalle-green: #00D26A;
  --color-pure-black: #000000;
  --color-warm-white: #F5F5F0;
  
  /* Typography */
  --font-display: 'Space Grotesk', sans-serif;
  --text-hero: clamp(48px, 10vw, 120px);
  
  /* Spacing */
  --space-section: clamp(48px, 10vh, 128px);
  
  /* Animation */
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --duration-reveal: 1.2s;
}
```

---

## Next Steps

1. **Immediate:** Update Tailwind config with new design tokens
2. **Day 1:** Create CSS custom properties file
3. **Day 2:** Build HeroAsymmetric component
4. **Day 3:** Implement SideScroller for featured content
5. **Day 4:** Update Navigation to minimal blend-mode style
6. **Day 5:** Apply new color system site-wide

**Reference Links:**
- Kunsthalle Basel: https://kunsthallebasel.ch/
- Boitano: Research independent art/design studio
