[Ver001.000]

# Report R6: Component Catalogue Audit

**Research batch:** Batch 3
**Date produced:** 2026-03-27
**Agent:** claude-sonnet-4-6
**Sources consulted:** N/A — internal audit of `apps/web/src/components/TENET/ui/` and `packages/@njz/ui/src/`

---

## Executive Summary

The TENET UI library contains 37 components across composites, feedback, layout, and primitives, plus 3 TENET-specific components in `packages/@njz/ui`. The library is architecturally sound (TypeScript, `React.forwardRef`, named exports) but has five critical design-system gaps that will cause visual failures in the eSports context: light-theme hardcoded values in dark-hub components, dynamic Tailwind class interpolation (a build-time failure mode), absent game-brand token bindings, and a complete absence of eSports-specific components. Nine new eSports-specific components are needed before Phase 9 gate 9.6 (Visual Design Book designs applied) can be considered closeable.

---

## Critical Gaps

### Gap 1: Card Component — Hardcoded Light Theme Values (BLOCKER)

**Component:** `apps/web/src/components/TENET/ui/composite/Card.tsx`

**Current state:** `baseStyles = 'bg-white rounded-lg overflow-hidden'`, `border-gray-200`, `bg-gray-50`. These are light theme values.

**Impact:** On SATOR hub (`--surface-base: #0a0a0a`) and any dark context, `Card` components will render as white boxes — completely breaking the design.

**Remediation:**
```tsx
// Replace hardcoded classes with design token utilities
const baseStyles = 'bg-surface-raised border border-surface-border rounded-lg overflow-hidden';
const variantStyles = {
  elevated: 'shadow-elevated',
  outline: 'border-surface-border',
  filled: 'bg-surface-overlay',
};
// Add to tailwind.config.js (or use CSS custom property approach):
// '--surface-raised': '#141414',
// '--surface-border': '#2a2a2a',
```

---

### Gap 2: Button Component — Dynamic Class Interpolation (BUILD FAILURE)

**Component:** `apps/web/src/components/TENET/ui/primitives/Button.tsx`

**Current state:**
```ts
solid: `bg-${colorScheme}-600 text-white hover:bg-${colorScheme}-700`
```

**Impact:** Tailwind's JIT compiler performs static analysis — it cannot find classes with dynamic string interpolation at build time. `bg-primary-600` will not be generated. In development (with full class generation) this may appear to work, but production builds will have missing styles.

**Remediation:** Replace dynamic interpolation with an explicit class map:
```tsx
const solidStyles: Record<string, string> = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
  secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500',
  success: 'bg-success text-black hover:opacity-90',
  warning: 'bg-warning text-black hover:opacity-90',
  error: 'bg-error text-white hover:opacity-90',
  valorant: 'bg-[#ff4655] text-white hover:bg-[#cc3644]',
  cs2: 'bg-[#f0a500] text-black hover:bg-[#c08400]',
};
```

---

### Gap 3: No Game-Brand Token Bindings in Any Component

**Current state:** No component references `--game-valorant-primary` or `--game-cs2-primary`. Hub colour tokens (`hub-sator`, `hub-rotas`, etc.) exist in tailwind config but game-brand tokens do not.

**Impact:** World-Port pages (`/valorant`, `/cs2`) cannot apply game-brand accent colours to buttons, active states, or indicators without inline overrides in every component.

**Remediation:** Add game tokens to `tailwind.config.js`:
```js
colors: {
  'valorant': { primary: '#ff4655', dim: '#cc3644' },
  'cs2': { primary: '#f0a500', dim: '#c08400' },
}
```
And add a CSS custom property layer in `tokens.css` (gate 9.1):
```css
:root {
  --game-valorant-primary: #ff4655;
  --game-cs2-primary: #f0a500;
}
[data-world-port="valorant"] { --accent-primary: var(--game-valorant-primary); }
[data-world-port="cs2"] { --accent-primary: var(--game-cs2-primary); }
```

---

### Gap 4: Design Token Layer Missing (tokens.css does not exist)

**Current state:** `apps/web/src/styles/design-system.css` (Ver002.000) contains CSS custom properties for colours and typography but is titled "Kunsthalle Basel + Boitano Inspired" — a generic art system, not the eSports token layer. The `tokens.css` file referenced in Phase 9 gate 9.1 does not exist at `packages/@njz/ui/src/tokens.css`.

**Impact:** Gate 9.1 is blocked. Components cannot reference `--surface-raised`, `--accent-primary`, or any game-brand tokens until `tokens.css` exists.

**Remediation:** Create `packages/@njz/ui/src/tokens.css` as the canonical token file (gate 9.1). Include: surface hierarchy, game-brand tokens, typography scale, animation durations, chart colours, semantic status colours.

---

### Gap 5: No eSports-Specific Components

**Current state:** The TENET UI library has 37 generic UI components. It has zero eSports-specific components. The `packages/@njz/ui` has 3 TENET-structural components (GameNodeBadge, QuarterGrid, WorldPortCard) but none are data-display components.

**Impact:** SATOR, ROTAS, OPERA, AREPO hubs need eSports data components that do not exist yet.

**Missing components (9 identified):**

| Component | Hub | Purpose |
|-----------|-----|---------|
| `StatCard` | SATOR, ROTAS | Single stat metric with label + value + trend |
| `PlayerRankBadge` | SATOR, AREPO, OPERA | Valorant/CS2 rank display with official rank colour |
| `LiveScoreTicker` | OPERA | Real-time score for a live match, with pulse animation |
| `MatchHistoryRow` | ROTAS | Single match row: teams, score, map, date, result |
| `AgentAbilityBar` | SATOR | Valorant agent's ability usage rate bar |
| `RoundEconomyChart` | ROTAS | 30-round bar timeline with buy/eco indicators |
| `HeatmapOverlay` | SATOR | Map position heatmap (Three.js/R3F canvas layer) |
| `PlayerHoverCard` | AREPO, OPERA | Hover preview card for player names in tables |
| `TeamCompBadge` | OPERA | 5-agent lineup display (Valorant) or role display (CS2) |

---

## Full Component Audit Table

| Component | Category | Current State | Dark Theme Ready | Design Token Binding | eSports-Ready | Priority Fix |
|-----------|----------|---------------|-----------------|---------------------|---------------|-------------|
| Accordion | Composite | Functional | Unknown | None | Partial | Medium |
| Breadcrumb | Composite | Functional | Unknown | None | Yes | Low |
| **Card** | Composite | `bg-white` hardcoded | **NO** | None | **NO** | **CRITICAL** |
| Drawer | Composite | Functional | Unknown | None | Partial | Medium |
| Dropdown | Composite | Functional | Unknown | None | Yes | Low |
| Modal | Composite | Functional | Unknown | None | Yes | Low |
| Pagination | Composite | Functional | Unknown | None | Yes | Medium |
| Popover | Composite | Functional | Unknown | None | Yes — base for PlayerHoverCard | Medium |
| Tabs | Composite | Functional | Unknown | None | Partial — needs URL sync | Medium |
| Tooltip | Composite | Functional | Unknown | None | Yes | Low |
| Alert | Feedback | Functional | Unknown | None | Partial | Low |
| CircularProgress | Feedback | Functional | Unknown | None | Yes | Low |
| Progress | Feedback | Functional | Unknown | None | Yes | Low |
| Rating | Feedback | Functional | Unknown | None | No — not eSports-relevant | Low |
| Skeleton | Feedback | Shimmer present | Yes | Partial | Yes | Low |
| Spinner | Feedback | Functional | Yes | None | Yes | Low |
| Toast | Feedback | Functional | Unknown | None | Partial — needs left-border accent pattern | Medium |
| AspectRatio | Layout | Functional | Yes | None | Yes | Low |
| Box | Layout | Functional | Yes | None | Yes | Low |
| Center | Layout | Functional | Yes | None | Yes | Low |
| Container | Layout | Functional | Yes | None | Yes | Low |
| Divider | Layout | Unknown | Unknown | None | Yes | Low |
| Flex | Layout | Functional | Yes | None | Yes | Low |
| Grid | Layout | Functional | Yes | None | Yes | Low |
| SimpleGrid | Layout | Functional | Yes | None | Yes | Low |
| Spacer | Layout | Functional | Yes | None | Yes | Low |
| Stack | Layout | Functional | Yes | None | Yes | Low |
| Avatar | Primitive | Functional | Unknown | None | Yes | Low |
| Badge | Primitive | Functional | Unknown | None | Partial — needs rank variant | Medium |
| **Button** | Primitive | Dynamic class interpolation | Partial | **BROKEN** | **NO** | **CRITICAL** |
| Checkbox | Primitive | Functional | Unknown | None | Yes | Low |
| ColorPicker | Primitive | Functional | N/A | None | No — not eSports-relevant | None |
| DatePicker | Primitive | Functional | Unknown | None | Partial | Low |
| FileUpload | Primitive | Functional | Unknown | None | No — not eSports-relevant | None |
| Input | Primitive | Functional | Unknown | None | Yes | Low |
| Radio | Primitive | Functional | Unknown | None | Yes | Low |
| Select | Primitive | Functional | Unknown | None | Yes | Low |
| Slider | Primitive | Functional | Unknown | None | Partial | Low |
| Switch | Primitive | Functional | Unknown | None | Yes | Low |
| Textarea | Primitive | Functional | Unknown | None | Yes | Low |
| GameNodeBadge | TENET-specific | Functional | Yes | Hub tokens | Yes | Low |
| QuarterGrid | TENET-specific | Functional | Yes | Hub tokens | Yes | Low |
| WorldPortCard | TENET-specific | Functional | Yes | Hub tokens | Partial | Medium |

---

## Missing Components List

All 9 missing components are required before Phase 9 gate 9.6 (Visual Design Book designs applied) closes:

| Component | Complexity | Phase 9 Gate | Notes |
|-----------|-----------|-------------|-------|
| `StatCard` | Low | 9.1 | Use Card + tokens; depends on tokens.css |
| `PlayerRankBadge` | Low | 9.1 | Badge variant with official rank colours from R2 |
| `LiveScoreTicker` | Medium | 9.3 | Framer Motion counter animation; WebSocket-connected |
| `MatchHistoryRow` | Medium | 9.3 | Complex layout; depends on Match type from @sator/types |
| `AgentAbilityBar` | Low | 9.1 | Progress variant with Valorant role colour |
| `RoundEconomyChart` | High | 9.3 | Custom D3.js; blocked on chart token definitions |
| `HeatmapOverlay` | High | 9.3 | Three.js/R3F; complex; may be Phase 10 |
| `PlayerHoverCard` | Medium | 9.3 | Extend Popover; depends on Player type from @sator/types |
| `TeamCompBadge` | Low | 9.1 | Avatar group variant with role colour coding |

---

## Recommended Token Additions for Component Layer

```css
/* Surface tokens (fix Card component) */
--surface-raised: #141414;
--surface-overlay: #1e1e1e;
--surface-border: #2a2a2a;

/* Component-level tokens */
--card-bg: var(--surface-raised);
--card-border: var(--surface-border);
--button-radius: 4px;
--input-bg: var(--surface-raised);
--input-border: var(--surface-border);
--input-focus-border: var(--accent-primary);
--badge-rank-size: 0.6875rem;
--toast-accent-width: 4px;
```
