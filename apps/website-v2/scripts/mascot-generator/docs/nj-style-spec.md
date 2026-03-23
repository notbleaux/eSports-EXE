# NJ Style Specification — Mascot Generation Guide

**Version:** 1.0.0  
**Project:** Libre-X-eSport 4NJZ4 TENET Platform  
**Based On:** NewJeans Bunny Style  
**Last Updated:** 2026-03-24

---

## Overview

This document defines the complete NJ (NewJeans) style system for generating consistent, minimalist line art mascots. The style emphasizes clean geometry, simple expressions, and maximum cuteness through minimal strokes.

### Design Philosophy

- **Less is more**: Fewer lines = more charm
- **Geometric foundation**: Built from circles, ellipses, and smooth curves
- **Consistent proportions**: Maintain visual harmony across all mascots
- **Friendly expressions**: Approachable, youthful, universally appealing

---

## Core Style Rules

### 1. Line Art Principles

| Property | Value | Notes |
|----------|-------|-------|
| **Stroke Width** | `2px` | Consistent across all elements |
| **Stroke Color** | Variable (see palette) | Solid colors only |
| **Fill** | `none` | Never use fill on main shapes |
| **Line Cap** | `round` | Soft, friendly edges |
| **Line Join** | `round` | No sharp corners |

### 2. SVG Attributes Template

```svg
<path 
  d="..."
  fill="none"
  stroke="#1a1a1a"
  stroke-width="2"
  stroke-linecap="round"
  stroke-linejoin="round"
/>
```

### 3. Composition Rules

1. **Continuous Paths**: Use single paths where possible to reduce anchor points
2. **No Overlapping**: Lines should meet but not cross unnecessarily
3. **Consistent Spacing**: Maintain equal visual weight throughout
4. **Centered Composition**: Main subject centered in viewBox

---

## Color Palette

### Primary Colors

| Name | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Classic** | `#0000FF` | `--nj-classic` | Default stroke color |
| **Attention** | `#FF006E` | `--nj-attention` | Accents, highlights, emphasis |
| **Hype** | `#00F5D4` | `--nj-hype` | Secondary, energy states |
| **Cookie** | `#8B4513` | `--nj-cookie` | Warm variants, earth tones |
| **Ditto** | `#E0E0E0` | `--nj-ditto` | Neutral, subtle states |
| **Outline** | `#1a1a1a` | `--nj-outline` | Definition, details |

### Usage Guidelines

- **Single color per mascot**: Each mascot uses one primary stroke color
- **Eyes**: Always use dark fill (`#1a1a1a`) or match stroke color
- **Details**: May use slightly darker/lighter variants of primary

---

## Anatomy Specifications

### 1. Head Standards

#### Circle Head (Default)
```svg
<circle cx="0" cy="0" r="45" fill="none" stroke="#1a1a1a" stroke-width="2"/>
```

**Standard Sizes:**
- **Small**: r="35" (hamsters, small animals)
- **Medium**: r="45" (rabbits, cats, default)
- **Large**: r="55" (bears, larger animals)

#### Oval Head Variants

**Wide Oval:**
```svg
<ellipse cx="0" cy="0" rx="50" ry="40" fill="none" stroke="#1a1a1a" stroke-width="2"/>
```

**Tall Oval:**
```svg
<ellipse cx="0" cy="0" rx="40" ry="55" fill="none" stroke="#1a1a1a" stroke-width="2"/>
```

### 2. Eye Standards

#### Style 1: Simple Dot (Default)
```svg
<circle cx="-18" cy="-5" r="5" fill="#1a1a1a"/>
<circle cx="18" cy="-5" r="5" fill="#1a1a1a"/>
```
**Spacing**: 36px between centers  
**Position**: 5px above horizontal center line

#### Style 2: Circle Outline
```svg
<circle cx="-18" cy="-5" r="6" fill="none" stroke="#1a1a1a" stroke-width="2"/>
<circle cx="18" cy="-5" r="6" fill="none" stroke="#1a1a1a" stroke-width="2"/>
```

#### Style 3: Happy Arc
```svg
<path d="M -26 0 Q -18 -8 -10 0" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
<path d="M 10 0 Q 18 -8 26 0" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
```

#### Eye Positioning Matrix

| Expression | Eye Y Offset | Eye Spacing | Style |
|------------|--------------|-------------|-------|
| Neutral | -5px | 36px | Dot |
| Happy | -8px | 36px | Arc |
| Excited | -10px | 32px | Large dot |
| Sleepy | 0px | 40px | Closed line |
| Surprised | -8px | 30px | Large circle |

### 3. Ear Standards

#### Rabbit Ears (Long)
```svg
<!-- Left ear -->
<ellipse cx="-25" cy="-55" rx="12" ry="35" fill="none" stroke="#1a1a1a" stroke-width="2"/>
<ellipse cx="-25" cy="-55" rx="6" ry="25" fill="none" stroke="#1a1a1a" stroke-width="2"/>
<!-- Right ear (mirror) -->
<ellipse cx="25" cy="-55" rx="12" ry="35" fill="none" stroke="#1a1a1a" stroke-width="2"/>
<ellipse cx="25" cy="-55" rx="6" ry="25" fill="none" stroke="#1a1a1a" stroke-width="2"/>
```

**Key Measurements:**
- Outer ellipse: rx="12" ry="35"
- Inner detail: rx="6" ry="25"
- Position: cy="-55" (relative to head center)
- Spread: cx="±25"

#### Bear Ears (Round)
```svg
<circle cx="-35" cy="-35" r="15" fill="none" stroke="#1a1a1a" stroke-width="2"/>
<circle cx="35" cy="-35" r="15" fill="none" stroke="#1a1a1a" stroke-width="2"/>
```

#### Cat Ears (Pointed)
```svg
<path d="M -40 -20 L -55 -55 L -20 -40 Z" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/>
<path d="M 40 -20 L 55 -55 L 20 -40 Z" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/>
```

### 4. Body Standards

#### Pear Shape (Rabbit Style)
```svg
<path d="M -25 42 
         Q -30 70 -20 90 
         Q 0 100 20 90 
         Q 30 70 25 42" 
      fill="none" 
      stroke="#1a1a1a" 
      stroke-width="2" 
      stroke-linecap="round"/>
```

**Connection Point**: Body starts at head radius + 2px (y="42" for r="45" head)

#### Bean Shape (Compact)
```svg
<path d="M -20 40 
         Q -30 65 -10 80 
         Q 10 85 25 75 
         Q 35 60 25 40" 
      fill="none" 
      stroke="#1a1a1a" 
      stroke-width="2" 
      stroke-linecap="round"/>
```

#### Oval Body
```svg
<ellipse cx="0" cy="65" rx="30" ry="40" fill="none" stroke="#1a1a1a" stroke-width="2"/>
```

### 5. Limb Standards

#### Simple Arm
```svg
<path d="M -35 55 Q -50 65 -45 80" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
```

#### Simple Foot
```svg
<ellipse cx="-15" cy="95" rx="10" ry="8" fill="none" stroke="#1a1a1a" stroke-width="2"/>
```

#### Tail Variants

**Curled:**
```svg
<path d="M -30 80 Q -45 60 -35 45" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
```

**Round:**
```svg
<circle cx="-35" cy="50" r="12" fill="none" stroke="#1a1a1a" stroke-width="2"/>
```

---

## Expression Guidelines

### Mouth Variations

| Expression | SVG Path | Description |
|------------|----------|-------------|
| **Neutral** | `<line x1="-8" y1="15" x2="8" y2="15"/>` | Simple horizontal line |
| **Happy** | `<path d="M -8 15 Q 0 20 8 15"/>` | Subtle upward curve |
| **Excited** | `<path d="M -10 15 Q 0 25 10 15"/>` | Deeper smile |
| **Open** | `<circle cx="0" cy="18" r="5"/>` | Small surprised circle |
| **Cat** | `<path d="M -6 18 L 0 12 L 6 18"/>` | Small W shape |

### Nose Styles

| Animal | Style | SVG |
|--------|-------|-----|
| Rabbit | Tiny vertical line | `<line x1="0" y1="5" x2="0" y2="10"/>` |
| Bear | Small oval | `<ellipse cx="0" cy="8" rx="4" ry="3"/>` |
| Cat | Tiny triangle | `<path d="M -3 8 L 0 5 L 3 8 Z"/>` |

---

## Animal-Specific Templates

### Template: NJ Rabbit (Reference)

```svg
<svg viewBox="-60 -100 120 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Ears -->
  <ellipse cx="-25" cy="-55" rx="12" ry="35" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  <ellipse cx="-25" cy="-55" rx="6" ry="25" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  <ellipse cx="25" cy="-55" rx="12" ry="35" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  <ellipse cx="25" cy="-55" rx="6" ry="25" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  
  <!-- Head -->
  <circle cx="0" cy="0" r="45" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  
  <!-- Face -->
  <circle cx="-18" cy="-5" r="5" fill="#1a1a1a"/>
  <circle cx="18" cy="-5" r="5" fill="#1a1a1a"/>
  <line x1="0" y1="5" x2="0" y2="10" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <path d="M -8 15 Q 0 20 8 15" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Body -->
  <path d="M -25 42 Q -30 70 -20 90 Q 0 100 20 90 Q 30 70 25 42" 
        fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Arms -->
  <path d="M -35 55 Q -50 65 -45 80" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <path d="M 35 55 Q 50 65 45 80" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Feet -->
  <ellipse cx="-15" cy="95" rx="10" ry="8" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  <ellipse cx="15" cy="95" rx="10" ry="8" fill="none" stroke="#1a1a1a" stroke-width="2"/>
</svg>
```

### Template: NJ Bear

```svg
<svg viewBox="-60 -90 120 180" xmlns="http://www.w3.org/2000/svg">
  <!-- Ears -->
  <circle cx="-35" cy="-35" r="15" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  <circle cx="35" cy="-35" r="15" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  
  <!-- Head -->
  <circle cx="0" cy="0" r="42" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  
  <!-- Face -->
  <circle cx="-15" cy="-5" r="5" fill="#1a1a1a"/>
  <circle cx="15" cy="-5" r="5" fill="#1a1a1a"/>
  <ellipse cx="0" cy="10" rx="6" ry="4" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  <path d="M -10 20 Q 0 25 10 20" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Body -->
  <ellipse cx="0" cy="65" rx="35" ry="45" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  
  <!-- Arms -->
  <path d="M -30 50 Q -45 60 -40 75" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  <path d="M 30 50 Q 45 60 40 75" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Feet -->
  <ellipse cx="-20" cy="105" rx="12" ry="10" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  <ellipse cx="20" cy="105" rx="12" ry="10" fill="none" stroke="#1a1a1a" stroke-width="2"/>
</svg>
```

### Template: NJ Cat

```svg
<svg viewBox="-60 -90 120 180" xmlns="http://www.w3.org/2000/svg">
  <!-- Ears -->
  <path d="M -35 -25 L -50 -60 L -20 -40 Z" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/>
  <path d="M 35 -25 L 50 -60 L 20 -40 Z" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/>
  
  <!-- Head -->
  <ellipse cx="0" cy="-5" rx="42" ry="38" fill="none" stroke="#1a1a1a" stroke-width="2"/>
  
  <!-- Face -->
  <circle cx="-16" cy="-8" r="5" fill="#1a1a1a"/>
  <circle cx="16" cy="-8" r="5" fill="#1a1a1a"/>
  <path d="M -3 8 L 0 4 L 3 8 Z" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linejoin="round"/>
  <path d="M -6 15 L 0 12 L 6 15" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Whiskers -->
  <line x1="-35" y1="5" x2="-55" y2="0" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="-35" y1="10" x2="-55" y2="12" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="35" y1="5" x2="55" y2="0" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="35" y1="10" x2="55" y2="12" stroke="#1a1a1a" stroke-width="1.5" stroke-linecap="round"/>
  
  <!-- Body -->
  <path d="M -22 35 Q -28 65 -15 85 Q 0 92 15 85 Q 28 65 22 35" 
        fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
  
  <!-- Tail -->
  <path d="M 20 75 Q 45 60 40 35" fill="none" stroke="#1a1a1a" stroke-width="2" stroke-linecap="round"/>
</svg>
```

---

## 7 Mascot Lineup Specifications

Based on project requirements, the complete mascot lineup:

| # | Animal | Head | Ears | Body | Tail | Primary Color |
|---|--------|------|------|------|------|---------------|
| 1 | **Rabbit** | Circle r=45 | Long ellipse | Pear | None | `--nj-classic` |
| 2 | **Bear** | Circle r=42 | Round r=15 | Oval | None | `--nj-cookie` |
| 3 | **Cat** | Oval | Pointed triangle | Compact | Curved | `--nj-attention` |
| 4 | **Dog** | Circle r=40 | Floppy | Bean | Curved | `--nj-hype` |
| 5 | **Hamster** | Round square | Wide ellipse | Bean | Round | `--nj-ditto` |
| 6 | **Fox** | Oval | Pointed | Compact | Bushy | `--nj-classic` |
| 7 | **Penguin** | Oval tall | None (tuft) | Teardrop | None | `--nj-hype` |

---

## Component Reference

### Using the Component Library

Reference SVG components from `nj-components.svg`:

```svg
<use href="/mascots/templates/nj-components.svg#eye-dot" x="-18" y="-5"/>
<use href="/mascots/templates/nj-components.svg#ear-rabbit-long" x="-25" y="-55"/>
<use href="/mascots/templates/nj-components.svg#body-pear" x="0" y="42"/>
```

### Available Component IDs

#### Eyes
- `eye-dot` - Simple filled circle (r=5)
- `eye-circle` - Outlined circle (r=6)
- `eye-large` - Large filled circle (r=8)
- `eye-happy` - Inverted arc
- `eye-sparkle` - Plus shape
- `eye-wink` - Curved line
- `eye-closed` - Horizontal line
- `eye-dazzled` - Circle with center dot

#### Ears
- `ear-rabbit-long` - Elongated ellipse (ry=40)
- `ear-rabbit-short` - Shorter ellipse (ry=25)
- `ear-bear-round` - Perfect circles
- `ear-cat-pointed` - Triangle shape
- `ear-dog-floppy` - Curved drooping
- `ear-hamster-wide` - Wide ellipse
- `ear-bird-tuft` - Three curved lines

#### Body Parts
- `body-pear` - Rabbit-style pear
- `body-bean` - Compact hamster
- `body-oval` - Simple ellipse
- `body-chubby` - Wide round
- `body-teardrop` - Pointed top

#### Limbs
- `arm-simple` - Single curve
- `arm-stubby` - Thick short
- `arm-paw` - With paw circle
- `leg-simple` - Basic line
- `foot-oval` - Oval foot
- `foot-round` - Circle foot
- `tail-curved` - Upward curl
- `tail-bushy` - Three lines
- `tail-round` - Circle with connector

#### Heads
- `head-circle` - Perfect circle
- `head-oval-wide` - Horizontal oval
- `head-oval-tall` - Vertical oval
- `head-round-square` - Rounded rect
- `head-hexagon` - 6-sided
- `head-heart` - Heart shape

---

## File Locations

```
apps/website-v2/
├── public/
│   └── mascots/
│       └── templates/
│           ├── nj-style-guide.svg      # This guide
│           └── nj-components.svg       # Component library
└── scripts/
    └── mascot-generator/
        └── docs/
            └── nj-style-spec.md        # This document
```

---

## Quick Reference Card

### Essential Measurements

```
Head radius: 40-45px (default 45px)
Eye radius: 5px
Eye spacing: 36px
Stroke width: 2px
Ear length: 35-40px
Body height: 50-60px
Total height: ~190px
viewBox: "-60 -100 120 200"
```

### Style Checklist

- [ ] 2px stroke width throughout
- [ ] No fill on main shapes
- [ ] Round line caps and joins
- [ ] Centered composition
- [ ] Consistent proportions
- [ ] Simple geometric shapes
- [ ] Friendly expression
- [ ] Transparent background

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0.0 | 2026-03-24 | Initial specification |

---

*NJ Style System — 4NJZ4 TENET Platform*
