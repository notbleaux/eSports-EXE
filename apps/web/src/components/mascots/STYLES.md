[Ver001.000]

# Mascot Character Showcase - Style Documentation
## Libre-X-eSport 4NJZ4 TENET Platform

---

## Overview

This document outlines the styling conventions and design tokens used in the Mascot Character Showcase system. All components follow the **Style Brief v2** design system with mascot-specific enhancements.

---

## Design Tokens

### Colors

#### Base Palette (from Style Brief v2)
| Token | Hex | Usage |
|-------|-----|-------|
| Charcoal | `#111217` | Primary text, headings |
| Warm Gray | `#F6F5F4` | Page background |
| Surface | `#FFFFFF` | Cards, panels |
| Border | `#E5E5E7` | Dividers, borders |

#### Element Colors
| Element | Hex | Glow |
|---------|-----|------|
| Solar | `#F59E0B` | `#FFB86B` |
| Lunar | `#6366F1` | `#818CF8` |
| Binary | `#00C48C` | `#00E5A0` |
| Fire | `#EF4444` | `#FF6B6B` |
| Magic | `#A855F7` | `#C084FC` |

#### Rarity Colors
| Rarity | Hex | Badge Style |
|--------|-----|-------------|
| Common | `#9CA3AF` | Gray subtle |
| Rare | `#00D1FF` | Cyan subtle |
| Epic | `#9B7CFF` | Violet medium |
| Legendary | `#FFB86B` | Amber strong |

### Typography

| Element | Size | Weight | Usage |
|---------|------|--------|-------|
| Card Title | 1rem (16px) | 600 | Mascot name |
| Rarity Label | 0.75rem (12px) | 500 | Rarity badge text |
| Stats Label | 0.875rem (14px) | 400 | Stat names |
| Stats Value | 0.875rem (14px) | 600 | Stat numbers |
| Bible Title | 2.25rem (36px) | 700 | Character bible header |
| Bible Heading | 1.25rem (20px) | 600 | Section headings |

### Spacing

| Context | Value |
|---------|-------|
| Card Padding (sm) | 12px |
| Card Padding (md) | 16px |
| Card Padding (lg) | 20px |
| Grid Gap | 24px |
| Filter Bar Padding | 16px |
| Bible Section Gap | 32px |

### Border Radius

| Element | Radius |
|---------|--------|
| Card | 16px |
| Avatar | 12px (card), 50% (circular) |
| Badge | 9999px (pill) |
| Button | 8px |
| Modal | 24px |

### Shadows

| Context | Shadow |
|---------|--------|
| Card Default | `0 6px 18px rgba(17, 18, 23, 0.08)` |
| Card Hover | `0 12px 32px rgba(17, 18, 23, 0.12)` |
| Legendary Glow | `0 0 30px rgba(255, 184, 107, 0.4)` |
| Epic Glow | `0 0 20px rgba(155, 124, 255, 0.3)` |
| Rare Glow | `0 0 15px rgba(0, 209, 255, 0.2)` |

---

## Component Styles

### MascotCard

#### Base Classes
```
relative {size} {padding}
bg-surface rounded-2xl border-2 overflow-hidden
transition-shadow duration-200
```

#### Size Variants
| Size | Width | Image Height |
|------|-------|--------------|
| sm | 160px | 96px |
| md | 224px | 144px |
| lg | 288px | 192px |

#### State Modifiers
- **Selected**: `ring-2 ring-[color]/30`
- **Locked**: `opacity-60 cursor-not-allowed`
- **Hover**: `hover:shadow-lg translateY(-6px)`

#### Rarity Glow Classes
```typescript
const glowClass = {
  none: '',
  subtle: 'shadow-[0_0_15px_rgba(0,209,255,0.2)]',
  medium: 'shadow-[0_0_20px_rgba(155,124,255,0.3)]',
  strong: 'shadow-[0_0_30px_rgba(255,184,107,0.4)]',
};
```

### MascotGallery

#### Filter Bar
```
bg-surface rounded-2xl p-4 shadow-sm border border-border
```

#### Search Input
```
w-full pl-10 pr-4 py-2.5
bg-gray-50 border border-border rounded-xl
text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30
```

#### Filter Pills
```
px-3 py-1.5 rounded-full text-xs font-medium
transition-all
```

#### Grid Layout
```
grid gap-6
grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4
```

### CharacterBible

#### Modal Container
```
relative w-full max-w-4xl max-h-[90vh] overflow-y-auto
bg-surface rounded-3xl shadow-2xl
```

#### Header Gradient
```
background: linear-gradient(135deg, {color}40 0%, {color}20 100%)
```

#### Content Sections
```
pt-20 sm:pt-24 px-6 sm:px-10 pb-10
```

#### Info Cards
```
bg-gray-50 rounded-2xl p-6
```

---

## Animation Specifications

### Entrance Animation
```css
@keyframes entrance {
  from {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
/* Duration: 240ms, Easing: cubic-bezier(0, 0, 0.2, 1) */
```

### Hover Animation
```css
transform: translateY(-6px);
box-shadow: 0 12px 32px rgba(17, 18, 23, 0.12);
/* Duration: 200ms, Easing: ease-out */
```

### Modal Animation
```css
/* Enter */
opacity: 0 → 1
y: 50px → 0
scale: 0.95 → 1
/* Duration: 300ms, Easing: cubic-bezier(0, 0, 0.2, 1) */

/* Exit */
opacity: 1 → 0
y: 0 → 20px
scale: 1 → 0.95
/* Duration: 200ms */
```

### Stagger Animation
```css
/* Gallery items stagger in */
delay: index * 50ms
```

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

## Accessibility Styles

### Focus Ring
```css
:focus-visible {
  outline: 3px solid var(--hub-accent, #00D1FF);
  outline-offset: 2px;
}
```

### Screen Reader Only
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
```

### Contrast Requirements
- Body text: ≥ 4.5:1 against background
- Large text (18px+ bold): ≥ 3:1
- Interactive elements: Visible focus states

---

## Responsive Breakpoints

| Name | Width | Grid Columns |
|------|-------|--------------|
| Mobile | < 640px | 1 |
| Tablet | 640-1024px | 2 |
| Desktop | 1024-1440px | 3 |
| Wide | > 1440px | 4 |

---

## CSS Custom Properties

```css
:root {
  /* Colors */
  --mascot-solar: #F59E0B;
  --mascot-lunar: #6366F1;
  --mascot-binary: #00C48C;
  --mascot-fire: #EF4444;
  --mascot-magic: #A855F7;
  
  /* Rarity */
  --rarity-common: #9CA3AF;
  --rarity-rare: #00D1FF;
  --rarity-epic: #9B7CFF;
  --rarity-legendary: #FFB86B;
  
  /* Animation */
  --transition-fast: 200ms;
  --transition-standard: 240ms;
  --easing-entrance: cubic-bezier(0, 0, 0.2, 1);
  --easing-hover: ease-out;
}
```

---

## File Structure

```
components/mascots/
├── index.ts                    # Public exports
├── MascotCard.tsx              # Card component
├── MascotGallery.tsx           # Gallery grid component
├── CharacterBible.tsx          # Detail modal component
├── MascotStatsRadar.tsx        # Stats chart component
├── STYLES.md                   # This file
├── types/
│   └── index.ts                # TypeScript types
├── hooks/
│   ├── useMascotFilter.ts      # Filter logic hook
│   └── useMascotAnimation.ts   # Animation hook
├── mocks/
│   └── mascots.ts              # Mock data & configs
├── __stories__/
│   ├── MascotCard.stories.tsx
│   ├── MascotGallery.stories.tsx
│   └── CharacterBible.stories.tsx
└── __tests__/
    ├── MascotCard.test.tsx
    ├── useMascotFilter.test.ts
    └── MascotGallery.test.tsx
```

---

## Implementation Notes

1. **Color Application**: Use inline styles for dynamic mascot colors (e.g., `style={{ color: mascot.color }}`). Use Tailwind classes for static styling.

2. **Glow Effects**: Glow intensity is determined by rarity and applied via Tailwind shadow utilities with inline colors.

3. **Responsive Design**: Grid columns adjust automatically based on screen width using Tailwind responsive prefixes.

4. **Animation Performance**: All animations use `transform` and `opacity` for GPU acceleration. Reduced motion is respected via `useReducedMotion` hook.

5. **Accessibility**: All interactive elements have proper ARIA labels, keyboard navigation, and focus management.

---

*Document Version: [Ver001.000]*
*Last Updated: 2026-03-23*
*Author: Agent TL-H1-1-E*
