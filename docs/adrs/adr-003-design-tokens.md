# ADR-003: Design Token System

**Status:** Accepted  
**Date:** 2026-03-31  
**Deciders:** Elijah Bleaux, Kimi  
**Technical Story:** UI consistency and theming

---

## Context and Problem Statement

eSports-EXE needs a consistent visual identity that:
- Prevents design drift across HUBs
- Supports dark mode (default) and light mode
- Enables rapid UI development
- Maintains accessibility standards

## Decision Drivers

- Visual consistency across the platform
- Maintainability as the UI grows
- Accessibility compliance (WCAG 2.1)
- Developer productivity

## Considered Options

### Option 1: Hardcoded Values
Colors, spacing, typography defined per-component.

### Option 2: CSS Variables Only
Custom properties without formal system.

### Option 3: Design Token System
Formalized tokens with semantic meaning.

## Decision Outcome

Chosen option: **Design Token System**

**Implementation:**
- Tokens defined in Tailwind config
- Semantic naming (e.g., `--color-accent-rotas` not `--color-teal`)
- Dark mode as default, light mode secondary
- WCAG 2.1 AA compliance minimum

**Token Categories:**
1. **Colors**: Backgrounds, accents, semantic states
2. **Typography**: Font families, scale, weights
3. **Spacing**: 4px base unit, consistent scale
4. **Components**: Primitives (buttons, cards, inputs)

### Positive Consequences

- Single source of truth for design values
- Easy theme switching (dark/light)
- Prevents arbitrary color usage
- Enables design system documentation
- Changes propagate automatically

### Negative Consequences

- Initial setup overhead
- Learning curve for new developers
- Requires discipline to use tokens

## Color System

```css
/* Primary Palette */
--color-bg-primary: #0F172A;      /* Deep slate */
--color-bg-secondary: #1E293B;    /* Cards, panels */
--color-bg-tertiary: #334155;     /* Borders */

/* HUB Accents */
--color-accent-rotas: #14B8A6;    /* Teal - Stats */
--color-accent-sator: #8B5CF6;    /* Violet - Analytics */
--color-accent-opera: #F97316;    /* Orange - Matches */
--color-accent-arepo: #EC4899;    /* Pink - Community */

/* Semantic */
--color-success: #22C55E;
--color-warning: #EAB308;
--color-error: #EF4444;
--color-info: #3B82F6;
```

## Typography System

```css
--font-heading: 'Inter', system-ui, sans-serif;
--font-body: 'Inter', system-ui, sans-serif;
--font-mono: 'JetBrains Mono', monospace;

/* Scale (Major Third - 1.25) */
--text-xs: 0.75rem;   /* 12px */
--text-base: 1rem;    /* 16px */
--text-4xl: 2.25rem;  /* 36px */
```

## Spacing System

```css
/* 4px base unit */
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-4: 1rem;      /* 16px */
--space-8: 2rem;      /* 32px */
```

## Links

- [Master Plan](../master-plan/master-plan.md#4-design-system-contracts)
- [Design System Documentation](../design-system/README.md)

## Notes

Colors derived from UI consultancy analysis of Valorant, VLR.gg, and HLTV.org. Dark mode default aligns with esports industry standards (most platforms use dark themes).
