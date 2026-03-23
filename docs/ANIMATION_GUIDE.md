[Ver001.000]

# Mascot Animation Guide

Complete reference for mascot animations in the 4NJZ4 TENET Platform.

## Table of Contents

- [Overview](#overview)
- [Easing Functions](#easing-functions)
- [Shared Animations](#shared-animations)
- [NJ Style Mascots](#nj-style-mascots)
- [Dropout Style Mascots](#dropout-style-mascots)
- [React Integration](#react-integration)
- [Performance](#performance)
- [Accessibility](#accessibility)

---

## Overview

The mascot system provides smooth, physics-based animations using CSS keyframes with consistent easing functions. All animations are designed to run at 60fps with GPU acceleration.

### File Structure

```
public/mascots/css/
├── mascot-animations.css    # Shared animation variables
├── bear-nj.css             # Bear (NJ style)
├── bear-dropout.css        # Bear (Dropout style)
├── bunny-nj.css            # Bunny (NJ style)
├── bunny-dropout.css       # Bunny (Dropout style)
├── cat-nj.css              # Cat (NJ style)
├── cat-dropout.css         # Cat (Dropout style)
├── fox-nj.css              # Fox (NJ style)
├── fox-dropout.css         # Fox (Dropout style)
├── hawk-nj.css             # Hawk (NJ style)
├── hawk-dropout.css        # Hawk (Dropout style)
├── owl-nj.css              # Owl (NJ style)
└── owl-dropout.css         # Owl (Dropout style)
```

---

## Easing Functions

All mascot CSS files use CSS Custom Properties for consistent easing:

| Variable | Value | Use Case |
|----------|-------|----------|
| `--ease-linear` | `linear` | Continuous loops |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exiting elements |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Entering elements |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | General transitions |
| `--ease-bounce` | `cubic-bezier(0.68, -0.55, 0.265, 1.55)` | Playful effects |
| `--ease-elastic` | `cubic-bezier(0.175, 0.885, 0.32, 1.275)` | Springy elements |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | **Primary bouncy animations** |
| `--ease-smooth` | `cubic-bezier(0.4, 0, 0.2, 1)` | Subtle movements |
| `--ease-snappy` | `cubic-bezier(0.2, 0, 0, 1)` | Quick transitions |
| `--ease-playful` | `cubic-bezier(0.68, -0.6, 0.32, 1.6)` | Playful bounces |

### Usage Example

```css
.my-animation {
  animation: my-keyframes 1s var(--ease-spring);
}
```

---

## Shared Animations

The `mascot-animations.css` file provides shared keyframes:

### Idle Animation (Breathing)

```css
@keyframes mascot-idle {
  0%, 100% { transform: scale(1) translateY(0); }
  50% { transform: scale(1.02) translateY(-2px); }
}
```

**Duration**: 2.5s | **Easing**: `--ease-in-out`

### Wave Animation

```css
@keyframes mascot-wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-15deg); }
  75% { transform: rotate(15deg); }
}
```

**Duration**: 0.8s | **Easing**: `--ease-spring`

### Celebrate Animation (Spring Physics)

```css
@keyframes mascot-celebrate {
  0%, 100% { transform: translateY(0) scale(1); }
  25% { transform: translateY(-20px) scale(1.1); }
  50% { transform: translateY(0) scale(0.95); }
  75% { transform: translateY(-10px) scale(1.05); }
}
```

**Duration**: 1.2s | **Easing**: `--ease-spring`

### Entrance Animation

```css
@keyframes mascot-enter {
  0% { opacity: 0; transform: scale(0.8) translateY(20px); }
  60% { transform: scale(1.05) translateY(-5px); }
  100% { opacity: 1; transform: scale(1) translateY(0); }
}
```

**Duration**: 0.5s | **Easing**: `--ease-spring`

---

## NJ Style Mascots

### Bear (NJ Style)

| Animation | Class | Duration | Easing |
|-----------|-------|----------|--------|
| Idle | `.bear-nj-idle` | 2.5s | `--ease-in-out` |
| Wave | `.bear-nj-wave` | 0.8s | `--ease-spring` |
| Celebrate | `.bear-nj-celebrate` | 1.2s | `--ease-spring` |
| Enter | `.bear-nj-enter` | 0.5s | `--ease-spring` |

**Ear twitch**: 6s loop on idle
**Line pulse**: 2s loop on idle

### Bunny (NJ Style)

| Animation | Class | Duration | Easing |
|-----------|-------|----------|--------|
| Idle | `.bunny-nj-idle` | 2s | `--ease-in-out` |
| Wave | `.bunny-nj-wave` | 0.8s | `--ease-spring` |
| Celebrate | `.bunny-nj-celebrate` | 1.2s | `--ease-spring` |
| Attention | `.bunny-nj-attention` | 0.8s | `--ease-spring` |
| Hype-Boy | `.bunny-nj-hype-boy` | 0.4s loop | `--ease-playful` |
| Cookie (shy) | `.bunny-nj-cookie` | 2s loop | `--ease-in-out` |
| Ditto | `.bunny-nj-ditto` | 3s loop | `--ease-in-out` |

### Cat (NJ Style)

| Animation | Class | Duration | Easing |
|-----------|-------|----------|--------|
| Idle | `.cat-nj-idle` | 2s | `--ease-in-out` |
| Wave | `.cat-nj-wave` | 0.8s | `--ease-spring` |
| Hop | `.cat-nj-hop` | 1.2s | `--ease-spring` |
| Wiggle | `.cat-nj-wiggle` | 0.5s | `--ease-in-out` |
| Peek | `.cat-nj-peek` | 0.6s | `--ease-spring` |
| Attention | `.cat-nj-attention` | 0.8s | `--ease-spring` |

### Fox (NJ Style)

| Animation | Class | Duration | Easing |
|-----------|-------|----------|--------|
| Idle | `.fox-nj-idle` | 2s | `--ease-in-out` |
| Wave | `.fox-nj-wave` | 0.8s | `--ease-spring` |
| Celebrate | `.fox-nj-celebrate` | 1.2s | `--ease-spring` |
| Attention | `.fox-nj-attention` | 0.8s | `--ease-spring` |
| Hype-Boy | `.fox-nj-hype-boy` | 0.4s loop | `--ease-playful` |
| Cookie | `.fox-nj-cookie` | 2s loop | `--ease-in-out` |
| Ditto | `.fox-nj-ditto` | 3s loop | `--ease-in-out` |

### Hawk (NJ Style)

| Animation | Class | Duration | Easing |
|-----------|-------|----------|--------|
| Idle | `.hawk-nj-container.idle` | 4s loop | `--ease-in-out` |
| Hover Head | `.hawk-nj-container:hover .hawk-head` | 2s loop | `--ease-in-out` |
| Alert | `.hawk-nj-container.alert` | 0.6s | `--ease-spring` |
| Scanning | `.hawk-nj-container.scanning` | 3s loop | `--ease-in-out` |
| Focused | `.hawk-nj-container.focused` | - | `--ease-out` |
| Predatory | `.hawk-nj-container.predatory` | - | `--ease-spring` |
| Enter | `.hawk-nj-container.enter` | 0.5s | `--ease-spring` |
| Celebrate | `.hawk-nj-container.celebrate` | 1.2s | `--ease-spring` |
| Wave | `.hawk-nj-container.wave` | 0.8s | `--ease-spring` |

### Owl (NJ Style)

| Animation | Class | Duration | Easing |
|-----------|-------|----------|--------|
| Float | `.owl-nj` | 5s loop | `--ease-in-out` |
| Blink | `.owl-nj__eyes` | 4s loop | `--ease-in-out` |
| Head Nod | `.owl-nj__head` | 6s loop | `--ease-in-out` |
| Draw | `.owl-nj--draw` | 2s | `--ease-out` |
| Idle | `.owl-nj--idle` | - | `--ease-in-out` |
| Observing | `.owl-nj--observing` | - | `--ease-in-out` |
| Celebrate | `.owl-nj--celebrate` | 1.2s | `--ease-spring` |
| Wave | `.owl-nj--wave` | 0.8s | `--ease-spring` |

---

## Dropout Style Mascots

### Bear (Dropout Style)

**Variants**: default, homecoming, graduation, late-registration, yeezus, donda

| Animation | Class | Duration | Easing |
|-----------|-------|----------|--------|
| Idle | `.bear-dropout-idle` | 3s loop | `--ease-in-out` |
| Wave | `.bear-dropout-wave` | 0.6s | `--ease-spring` |
| Celebrate | `.bear-dropout-celebrate` | 1.5s | `--ease-spring` |

### Bunny (Dropout Style)

| Animation | Class | Duration | Easing |
|-----------|-------|----------|--------|
| Idle | `.bunny-dropout-idle` | 2s loop | `--ease-in-out` |
| Wave | `.bunny-dropout-wave` | 0.6s | `--ease-spring` |
| Celebrate | `.bunny-dropout-celebrate` | 1.5s | `--ease-spring` |

### Cat (Dropout Style)

| Animation | Class | Duration | Easing |
|-----------|-------|----------|--------|
| Idle | `.cat-dropout-idle` | 2s loop | `--ease-in-out` |
| Mischief | `.cat-dropout-mischief` | 2s | `--ease-mischief` |
| Peekaboo | `.cat-dropout-peekaboo` | 2s | `--ease-playful` |
| Celebrate | `.cat-dropout-celebrate` | 1.5s | `--ease-spring` |

### Fox (Dropout Style)

| Animation | Class | Duration | Easing |
|-----------|-------|----------|--------|
| Idle | `.fox-dropout-idle` | 2s loop | `--ease-in-out` |
| Wave | `.fox-dropout-wave` | 0.6s | `--ease-spring` |
| Celebrate | `.fox-dropout-celebrate` | 1.5s | `--ease-spring` |
| Confident | `.fox-dropout-confident` | 3s loop | `--ease-in-out` |

### Hawk (Dropout Style)

| Animation | Class | Duration | Easing |
|-----------|-------|----------|--------|
| Idle | `.hawk-dropout-container.idle` | 3s loop | `--ease-in-out` |
| Focus | `.hawk-dropout-container.focused` | 0.8s loop | `--ease-in-out` |
| Ready | `.hawk-dropout-container.ready` | - | `--ease-in-out` |
| Enter | `.hawk-dropout-container.enter` | 0.5s | `--ease-spring` |
| Celebrate | `.hawk-dropout-container.celebrate` | 1.2s | `--ease-spring` |

### Owl (Dropout Style)

| Animation | Class | Duration | Easing |
|-----------|-------|----------|--------|
| Float | `.owl-dropout` | 4s loop | `--ease-in-out` |
| Blink | `.owl-dropout__eyes` | 4s loop | `--ease-in-out` |
| Head Tilt | `.owl-dropout__head` | 6s loop | `--ease-in-out` |
| Thinking | `.owl-dropout--thinking` | - | `--ease-in-out` |
| Reading | `.owl-dropout--reading` | - | `--ease-in-out` |
| Celebrate | `.owl-dropout--celebrate` | 1.2s | `--ease-spring` |

---

## React Integration

### Spring Physics Configurations

```typescript
const springConfigs = {
  gentle: { stiffness: 100, damping: 15, mass: 1 },
  default: { stiffness: 300, damping: 20, mass: 1 },
  bouncy: { stiffness: 400, damping: 10, mass: 1 },
  stiff: { stiffness: 500, damping: 30, mass: 1 },
  slow: { stiffness: 100, damping: 20, mass: 2 },
};
```

### Using with Framer Motion

```tsx
import { motion } from 'framer-motion';

// Spring animation
<motion.div
  animate={{ scale: 1.1, y: -20 }}
  transition={{ 
    type: "spring",
    stiffness: 300,
    damping: 20
  }}
/>

// Cubic bezier easing
<motion.div
  animate={{ x: 100 }}
  transition={{ 
    duration: 0.5,
    ease: [0.34, 1.56, 0.64, 1] // Spring easing
  }}
/>
```

### Container Variants

```tsx
const variants = {
  idle: { scale: 1, y: 0 },
  celebrate: {
    scale: [1, 1.15, 0.95, 1.08, 1],
    y: [0, -25, 0, -12, 0],
    transition: { duration: 1.2, ease: [0.34, 1.56, 0.64, 1] }
  }
};
```

---

## Performance

### GPU Acceleration

All mascot containers use `will-change: transform` for GPU acceleration:

```css
.mascot-container {
  will-change: transform;
  transform: translateZ(0);
  backface-visibility: hidden;
}
```

### Animation Duration Guidelines

| Type | Duration | Notes |
|------|----------|-------|
| Micro-interactions | 100-200ms | Button hovers, toggles |
| State changes | 200-400ms | Transitions |
| Celebrate | 800-1500ms | Success feedback |
| Idle loops | 2000-5000ms | Background animations |

### Frame Rate Targets

- **Target**: 60fps
- **Minimum**: 30fps
- **Use `transform` and `opacity`** for best performance
- **Avoid animating**: `width`, `height`, `top`, `left`, `margin`, `padding`

---

## Accessibility

### Reduced Motion Support

All animations respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  .mascot-container,
  .mascot-container * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### React Implementation

```tsx
import { useReducedMotion } from 'framer-motion';

function Mascot() {
  const shouldReduceMotion = useReducedMotion();
  
  return (
    <motion.div
      animate={shouldReduceMotion ? {} : { y: -10 }}
    />
  );
}
```

### Stagger Delays

For sequential mascot appearances:

```css
.mascot-group .mascot:nth-child(1) { animation-delay: 0ms; }
.mascot-group .mascot:nth-child(2) { animation-delay: 50ms; }
.mascot-group .mascot:nth-child(3) { animation-delay: 100ms; }
.mascot-group .mascot:nth-child(4) { animation-delay: 150ms; }
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 001.000 | 2026-03-23 | Initial animation guide with spring physics |

---

*This guide is maintained alongside the mascot CSS files. Update when adding new animations or changing timing.*
