[Ver001.000]

# Dropout Style Specification

**Purpose:** Comprehensive style guide for generating mascots in the Kanye West "Dropout Bear" aesthetic.  
**Project:** Libre-X-eSport 4NJZ4 TENET Platform  
**Last Updated:** 2026-03-23

---

## Table of Contents

1. [Overview](#overview)
2. [Visual Philosophy](#visual-philosophy)
3. [Proportion System](#proportion-system)
4. [Color System](#color-system)
5. [Head Construction](#head-construction)
6. [Facial Features](#facial-features)
7. [Body & Clothing](#body--clothing)
8. [Limbs & Accessories](#limbs--accessories)
9. [Expression Library](#expression-library)
10. [Animal Adaptations](#animal-adaptations)
11. [Animation Guidelines](#animation-guidelines)
12. [SVG Component Reference](#svg-component-reference)

---

## Overview

The Dropout Style is inspired by Kanye West's iconic "Dropout Bear" mascot - a cartoony, hip-hop influenced character design featuring oversized heads, expressive eyes, varsity fashion, and confident attitudes. This style guide ensures consistency across all 7 animal mascots while allowing for species-specific adaptations.

### Design Principles

- **Approachable Cuteness**: Large eyes and rounded forms create instant appeal
- **Hip-Hop Aesthetic**: Streetwear fashion (varsity jackets, sneakers, chains)
- **Bold Outlines**: Strong black outlines for clear definition and comic appeal
- **Gradient Shading**: Subtle depth without losing the flat design charm
- **Personality First**: Each character should exude confidence and attitude

---

## Visual Philosophy

### Core Aesthetic Values

| Value | Description | Implementation |
|-------|-------------|----------------|
| **Boldness** | Strong visual impact | Thick outlines, saturated colors, confident poses |
| **Playfulness** | Fun and engaging | Exaggerated proportions, bouncy animations |
| **Street Cred** | Urban culture connection | Varsity jackets, backwards caps, gold accessories |
| **Cuteness** | Broad appeal | Large eyes, rounded shapes, soft shading |

### Kanye West Dropout Bear Reference Points

- **Album Art**: The College Dropout (2004) - teddy bear mascot
- **Style Era**: Early 2000s hip-hop culture
- **Key Elements**: Varsity jackets, backpacks, urban settings
- **Color Palette**: Reds, golds, browns, whites
- **Attitude**: Confident, slightly mischievous, aspirational

---

## Proportion System

### Golden Ratio for Dropout Characters

```
┌─────────────────────────────────────┐
│         HEAD (60% of body)          │
│    ┌─────────────────────────┐      │
│    │                         │      │
│    │    Eyes: 25% of head    │      │
│    │    width each           │      │
│    │                         │      │
│    └─────────────────────────┘      │
│                                     │
│         BODY (40% of body)          │
│    ┌─────────────────────────┐      │
│    │                         │      │
│    │    Clothing emphasis    │      │
│    │                         │      │
│    └─────────────────────────┘      │
│                                     │
│    Total Height = 2-3 head diameters│
└─────────────────────────────────────┘
```

### Specific Measurements

| Component | Ratio | Notes |
|-----------|-------|-------|
| Head Height | 60% of body | Dominant visual element |
| Head Width | 1.05x height | Slightly wider than tall |
| Eye Width | 25% of head width | Large and expressive |
| Eye Spacing | 60% of head width | Between eye centers |
| Snout Width | 40% of head width | Centered, lower half |
| Body Height | 40% of total | Compact and stylish |
| Limb Length | Short and stylized | Exaggerated thickness |

### Implementation Formula

```javascript
// Pseudocode for proportion calculation
function calculateDropoutProportions(baseSize) {
  return {
    head: {
      height: baseSize * 0.6,
      width: baseSize * 0.6 * 1.05
    },
    eye: {
      width: baseSize * 0.6 * 0.25,
      spacing: baseSize * 0.6 * 0.6
    },
    body: {
      height: baseSize * 0.4,
      width: baseSize * 0.5
    }
  };
}
```

---

## Color System

### CSS Variables

```css
:root {
  /* Core Outline */
  --dropout-outline: #2D1810;
  --dropout-outline-width: 2.5px;
  
  /* Shadows & Highlights */
  --dropout-shadow: rgba(0, 0, 0, 0.2);
  --dropout-shadow-hard: rgba(0, 0, 0, 0.4);
  --dropout-highlight: rgba(255, 255, 255, 0.3);
  --dropout-highlight-soft: rgba(255, 255, 255, 0.15);
  
  /* Accent Colors */
  --dropout-gold: #FFD700;
  --dropout-gold-dark: #DAA520;
  --dropout-gold-deep: #B8860B;
  
  /* Clothing */
  --dropout-varsity-red: #DC143C;
  --dropout-varsity-red-dark: #8B0000;
  --dropout-sleeve-white: #FFFFFF;
  --dropout-denim: #4169E1;
  
  /* Fur/Skin Base Colors (per animal) */
  --dropout-bear-brown: #8B4513;
  --dropout-wolf-gray: #696969;
  --dropout-rabbit-pink: #FFB6C1;
  --dropout-tiger-orange: #FF8C00;
}
```

### Gradient Definitions

#### Bear Fur Gradient
```svg
<linearGradient id="grad-fur-primary" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="#8B4513"/>  <!-- SaddleBrown -->
  <stop offset="50%" stop-color="#654321"/> <!-- DarkBrown -->
  <stop offset="100%" stop-color="#4A3018"/><!-- Deepest Brown -->
</linearGradient>
```

#### Eye Sclera Gradient
```svg
<radialGradient id="grad-eye-sclera" cx="50%" cy="50%" r="50%">
  <stop offset="70%" stop-color="#FFFFFF"/>
  <stop offset="100%" stop-color="#F5F5F5"/>
</radialGradient>
```

#### Varsity Jacket Body
```svg
<linearGradient id="grad-varsity-red" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="#DC143C"/>  <!-- Crimson -->
  <stop offset="50%" stop-color="#B22222"/> <!-- FireBrick -->
  <stop offset="100%" stop-color="#8B0000"/><!-- DarkRed -->
</linearGradient>
```

#### Gold Accent
```svg
<linearGradient id="grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="#FFD700"/>  <!-- Gold -->
  <stop offset="50%" stop-color="#DAA520"/> <!-- GoldenRod -->
  <stop offset="100%" stop-color="#B8860B"/><!-- DarkGoldenRod -->
</linearGradient>
```

### Color Usage Rules

1. **Outlines**: Always `#2D1810` (dark brown-black), 2-3px stroke
2. **Shadows**: Use `rgba(0,0,0,0.2)` for soft shadows, `0.4` for hard shadows
3. **Highlights**: Use `rgba(255,255,255,0.3)` for main highlights
4. **Gold Accents**: Use gradients for metallic effect on buttons, chains, emblems
5. **Fur Base**: Use species-appropriate base with gradient overlay for depth

---

## Head Construction

### Basic Head Shape

The head is an ellipse that's slightly wider than tall:

```svg
<!-- Standard Dropout Head -->
<ellipse 
  cx="0" 
  cy="0" 
  rx="60"   <!-- width -->
  ry="58"   <!-- height (slightly less) -->
  fill="url(#grad-fur-primary)"
  stroke="#2D1810"
  stroke-width="3"
/>
```

### Head Views

#### Front View
- Perfectly symmetrical
- Eyes equally spaced from center
- Snout centered
- Ears at equal height

#### 3/4 View
- Head ellipse compressed on far side (rx * 0.9)
- Near eye larger than far eye (scale 1.1x vs 0.9x)
- Snout shifted toward camera side
- Near ear higher and larger

#### Side View
- Teardrop/profile shape
- One eye visible (full size)
- Snout protrudes forward
- Single ear visible at back

### Ear Placement

| Ear Type | Position | Angle | Size |
|----------|----------|-------|------|
| Round (Bear) | Top of head, 60% apart | Slight outward (10°) | 40% of head width |
| Pointed (Wolf) | Higher on head | 20° outward | 50% of head height |
| Long (Rabbit) | Top-center | Vertical/parallel | Extends 80% above head |
| Floppy (Dog) | Mid-head sides | 30° downward | 45% of head width |

---

## Facial Features

### Eye Construction

#### Layer Order (Bottom to Top)

```svg
<g id="eye-construction">
  <!-- 1. Sclera -->
  <ellipse cx="0" cy="0" rx="22" ry="24" 
           fill="url(#grad-eye-sclera)" 
           stroke="#2D1810" 
           stroke-width="2"/>
  
  <!-- 2. Pupil (offset for direction) -->
  <ellipse cx="-3" cy="1" rx="12" ry="14" 
           fill="url(#grad-eye-pupil)"/>
  
  <!-- 3. Primary Highlight -->
  <circle cx="-8" cy="-7" r="5" 
          fill="url(#grad-eye-highlight)"/>
  
  <!-- 4. Secondary Highlight -->
  <circle cx="4" cy="7" r="2" 
          fill="#FFF" opacity="0.8"/>
</g>
```

#### Eye Direction Variations

| Direction | Pupil Offset | Primary Highlight Offset |
|-----------|--------------|--------------------------|
| Forward | (0, 1) | (-5, -6) |
| Left | (-3, 1) | (-8, -7) |
| Right | (3, 1) | (-2, -7) |
| Up | (0, -3) | (-5, -10) |
| Down | (0, 4) | (-5, -3) |

### Snout Construction

```svg
<g id="snout-construction">
  <!-- Snout base -->
  <ellipse cx="0" cy="5" rx="35" ry="30" 
           fill="url(#grad-snout)" 
           stroke="#2D1810" 
           stroke-width="2"/>
  
  <!-- Nose -->
  <ellipse cx="0" cy="-2" rx="12" ry="8" 
           fill="#2D1810"/>
  <!-- Nose highlight -->
  <ellipse cx="-4" cy="-5" rx="3" ry="2" 
           fill="#FFF" opacity="0.6"/>
</g>
```

### Mouth Styles

| Expression | Path Command | Description |
|------------|--------------|-------------|
| Neutral | `M-8 25 L8 25` | Straight line |
| Happy | `M-12 22 Q0 32 12 22` | Upward curve |
| Smile | `M-10 24 Q0 28 10 24` | Subtle upward |
| Open Happy | `M-10 22 Q0 35 10 22` | Wider curve with fill |
| Surprised | Ellipse rx=8 ry=10 | Open O shape |
| Smirk | `M-8 25 Q0 28 10 22` | Asymmetric |

---

## Body & Clothing

### Body Base

```svg
<!-- Compact body shape -->
<path d="M-45 -20 
         Q-50 30 -45 80 
         L45 80 
         Q50 30 45 -20 
         Q0 -30 -45 -20" 
      fill="url(#grad-varsity-red)" 
      stroke="#2D1810" 
      stroke-width="2.5"/>
```

### Varsity Jacket Components

#### Jacket Body
- **Fill**: `url(#grad-varsity-red)`
- **Shape**: Slightly tapered cylinder
- **Center Placket**: Vertical line with buttons
- **Collar**: Contrasting color (darker red)
- **Pockets**: Curved flaps on hips

#### Jacket Sleeves
- **Fill**: `url(#grad-varsity-sleeve)` (white)
- **Stripes**: 3 horizontal gold/dark red stripes
- **Cuffs**: Dark red band at wrists

#### Buttons
```svg
<circle cx="8" cy="0" r="4" 
        fill="url(#grad-gold)" 
        stroke="#2D1810" 
        stroke-width="1"/>
```

**Placement**: Vertical line at x=8 (right of center placket), spaced 25px apart

#### Emblem
```svg
<circle cx="0" cy="-10" r="25" 
        fill="#FFF" 
        stroke="#FFD700" 
        stroke-width="3"/>
<text x="0" y="-5" 
      text-anchor="middle" 
      fill="#8B0000" 
      font-family="Arial Black" 
      font-size="24">S</text>
```

### Alternative Clothing Options

| Style | Body Fill | Sleeve Fill | Key Features |
|-------|-----------|-------------|--------------|
| Classic Varsity | grad-varsity-red | grad-varsity-sleeve | Gold buttons, striped sleeves |
| Hoodie | Denim blue | Same as body | Drawstrings, front pocket |
| Bomber Jacket | Olive/Black | Same as body | Ribbed cuffs, zipper |
| T-Shirt | White/Graphic | None | Simple, logo on chest |

---

## Limbs & Accessories

### Hand/Paw Template

```svg
<g id="hand-paw">
  <!-- Palm -->
  <ellipse cx="0" cy="10" rx="22" ry="25" 
           fill="url(#grad-fur-primary)" 
           stroke="#2D1810" 
           stroke-width="2.5"/>
  
  <!-- Three fingers (cartoon style) -->
  <ellipse cx="-12" cy="-10" rx="7" ry="10" 
           fill="url(#grad-fur-primary)" 
           stroke="#2D1810" 
           stroke-width="2"/>
  <ellipse cx="0" cy="-15" rx="7" ry="12" 
           fill="url(#grad-fur-primary)" 
           stroke="#2D1810" 
           stroke-width="2"/>
  <ellipse cx="12" cy="-10" rx="7" ry="10" 
           fill="url(#grad-fur-primary)" 
           stroke="#2D1810" 
           stroke-width="2"/>
  
  <!-- Paw pads (optional) -->
  <circle cx="-8" cy="20" r="5" fill="#654321"/>
  <circle cx="8" cy="20" r="5" fill="#654321"/>
  <ellipse cx="0" cy="8" rx="8" ry="10" fill="#654321"/>
</g>
```

### Foot/Sneaker Template

```svg
<g id="sneaker-foot">
  <!-- Shoe base -->
  <path d="M-30 20 Q-35 35 -15 40 L20 40 
           Q35 35 30 20 Q25 10 0 10 
           Q-25 10 -30 20" 
        fill="#FFF" 
        stroke="#2D1810" 
        stroke-width="2.5"/>
  
  <!-- High top -->
  <path d="M-20 15 L-20 -5 L20 -5 L20 15" 
        fill="#FFF" 
        stroke="#2D1810" 
        stroke-width="2"/>
  
  <!-- Toe cap -->
  <path d="M-15 25 Q0 22 15 25 
           Q18 30 15 35 Q0 38 -15 35 
           Q-18 30 -15 25" 
        fill="#E0E0E0" 
        stroke="#2D1810" 
        stroke-width="1.5"/>
  
  <!-- Laces -->
  <rect x="-12" y="-2" width="24" height="15" rx="2" 
        fill="#FFF" stroke="#2D1810" stroke-width="1"/>
  <line x1="-10" y1="2" x2="10" y2="2" stroke="#2D1810"/>
  <line x1="-10" y1="7" x2="10" y2="7" stroke="#2D1810"/>
</g>
```

### Accessories Library

#### Backwards Cap
```svg
<g id="cap-backwards">
  <!-- Crown -->
  <path d="M-35 -10 Q0 -35 35 -10 L35 5 
           Q0 -10 -35 5 Z" 
        fill="#DC143C" 
        stroke="#2D1810" 
        stroke-width="2"/>
  <!-- Brim (pointing back) -->
  <rect x="25" y="-15" width="20" height="8" rx="2" 
        fill="#DC143C" 
        stroke="#2D1810" 
        stroke-width="2"/>
  <!-- Front emblem -->
  <circle cx="0" cy="-15" r="10" 
          fill="url(#grad-gold)" 
          stroke="#2D1810" 
          stroke-width="1.5"/>
</g>
```

#### Gold Chain
```svg
<g id="gold-chain">
  <!-- Links -->
  <ellipse cx="-15" cy="-10" rx="10" ry="12" 
           fill="none" stroke="url(#grad-gold)" stroke-width="4"/>
  <ellipse cx="0" cy="5" rx="10" ry="12" 
           fill="none" stroke="url(#grad-gold)" stroke-width="4"/>
  <ellipse cx="15" cy="-10" rx="10" ry="12" 
           fill="none" stroke="url(#grad-gold)" stroke-width="4"/>
  <!-- Pendant -->
  <circle cx="0" cy="20" r="12" 
          fill="url(#grad-gold)" 
          stroke="#2D1810" 
          stroke-width="2"/>
</g>
```

#### Sunglasses
```svg
<g id="sunglasses">
  <!-- Frame -->
  <path d="M-30 -5 L-25 -5 Q-15 -15 -5 -5 
           L5 -5 Q15 -15 25 -5 L30 -5" 
        stroke="#2D1810" stroke-width="3" fill="none"/>
  <!-- Left lens -->
  <ellipse cx="-15" cy="5" rx="12" ry="10" 
           fill="#1A1A1A" stroke="#FFD700" stroke-width="2"/>
  <ellipse cx="-18" cy="2" rx="4" ry="3" 
           fill="#FFF" opacity="0.3"/>
  <!-- Right lens -->
  <ellipse cx="15" cy="5" rx="12" ry="10" 
           fill="#1A1A1A" stroke="#FFD700" stroke-width="2"/>
  <ellipse cx="12" cy="2" rx="4" ry="3" 
           fill="#FFF" opacity="0.3"/>
</g>
```

---

## Expression Library

### Expression Quick Reference

| Expression | Eyebrows | Eyes | Mouth | Usage |
|------------|----------|------|-------|-------|
| **Confident** | Slight arch, level | Half-lidded | Subtle smirk | Default, cool poses |
| **Happy** | Raised, curved | Wide open, sparkles | Big smile | Victories, celebrations |
| **Excited** | High arch | Very wide, extra sparkles | Open mouth | Goals, big moments |
| **Mischievous** | One raised | One wink | Side smirk | Tricks, clever plays |
| **Surprised** | Raised high | Perfect circles | Open O | Unexpected events |
| **Chill** | Relaxed flat | Closed/smooth | Straight line | Relaxed moments |
| **Determined** | Angled down | Narrowed | Frown/firm | Competition focus |

### Detailed Expression Specifications

#### Confident (Default)
```svg
<g id="expression-confident">
  <!-- Eyebrows - level with slight arch -->
  <path d="M-50 -45 Q-35 -52 -20 -45" 
        stroke="#2D1810" stroke-width="4" fill="none"/>
  <path d="M20 -45 Q35 -52 50 -45" 
        stroke="#2D1810" stroke-width="4" fill="none"/>
  
  <!-- Eyes - half-lidded -->
  <path d="M-22 -5 Q-15 -8 -8 -5" 
        stroke="#2D1810" stroke-width="6" fill="none"/>
  <path d="M8 -5 Q15 -8 22 -5" 
        stroke="#2D1810" stroke-width="6" fill="none"/>
  
  <!-- Mouth - subtle smirk -->
  <path d="M-8 25 Q0 28 8 25" 
        stroke="#2D1810" stroke-width="2" fill="none"/>
</g>
```

#### Happy
```svg
<g id="expression-happy">
  <!-- Eyebrows - raised and curved -->
  <path d="M-50 -50 Q-35 -60 -20 -50" 
        stroke="#2D1810" stroke-width="4" fill="none"/>
  <path d="M20 -50 Q35 -60 50 -50" 
        stroke="#2D1810" stroke-width="4" fill="none"/>
  
  <!-- Eyes - curved up at edges -->
  <ellipse cx="-15" cy="-5" rx="12" ry="14" 
           fill="#FFF" stroke="#2D1810"/>
  <ellipse cx="15" cy="-5" rx="12" ry="14" 
           fill="#FFF" stroke="#2D1810"/>
  
  <!-- Mouth - big curve -->
  <path d="M-12 22 Q0 32 12 22" 
        stroke="#2D1810" stroke-width="3" fill="none"/>
</g>
```

---

## Animal Adaptations

### Species-Specific Modifications

#### 1. Bear (Base Reference)
- **Ears**: Round, positioned high
- **Snout**: Wide, rounded
- **Body**: Stocky, broad shoulders
- **Fur**: Brown gradients
- **Personality**: Confident leader

#### 2. Wolf
- **Ears**: Triangular, pointed, 20° outward
- **Snout**: Longer, more tapered
- **Body**: Leaner, athletic
- **Fur**: Gray with darker markings
- **Personality**: Fierce competitor

#### 3. Tiger
- **Ears**: Round with white spot
- **Snout**: Wide with stripes
- **Body**: Muscular, powerful
- **Fur**: Orange with black stripes
- **Personality**: Aggressive striker

#### 4. Rabbit
- **Ears**: Very long, extend 80% above head
- **Snout**: Small, button nose
- **Body**: Compact, agile
- **Fur**: Soft grays or whites
- **Personality**: Quick, nimble

#### 5. Eagle/Bird
- **Eyes**: Forward-facing, intense
- **Beak**: Replace snout with curved beak
- **Body**: Wings instead of arms (or wing-like sleeves)
- **Feathers**: Gradient from dark to light
- **Personality**: Sharp, focused

#### 6. Dragon
- **Eyes**: Reptilian, slit pupils
- **Snout**: Extended with nostrils
- **Body**: Scaled texture
- **Extras**: Small horns, tail visible
- **Personality**: Powerful, mythical

#### 7. Fox
- **Ears**: Large, triangular, fluffy
- **Snout**: Pointed
- **Body**: Slender, graceful
- **Fur**: Red-orange with white accents
- **Personality**: Clever, tricky

### Adaptation Rules

1. **Maintain Head Ratio**: All animals keep 60% head proportion
2. **Keep Large Eyes**: 25% of head width minimum
3. **Preserve Style**: Varsity jacket works on all body types
4. **Species Features**: Adapt ears, snout, and fur patterns
5. **Outline Consistency**: All use `#2D1810` outlines

---

## Animation Guidelines

### Animation Principles

#### Easing Function
```css
animation-timing-function: cubic-bezier(0.34, 1.56, 0.64, 1);
```
This creates a bouncy, energetic feel with slight overshoot.

#### Standard Durations
| Animation Type | Duration | Easing |
|----------------|----------|--------|
| Idle bounce | 2s infinite | ease-in-out |
| Happy jump | 0.5s | bounce easing |
| Victory pose | 0.8s | bounce easing |
| Expression change | 0.3s | ease-out |
| Arm wave | 1s | ease-in-out |

### Keyframe Templates

#### Idle Bounce
```css
@keyframes idle-bounce {
  0%, 100% { transform: translateY(0) scaleY(1); }
  50% { transform: translateY(-10px) scaleY(0.95); }
}
```

#### Excited Jump
```css
@keyframes excited-jump {
  0% { transform: translateY(0) scale(1); }
  40% { transform: translateY(-30px) scale(1.1, 0.9); }
  60% { transform: translateY(-30px) scale(1.1, 0.9); }
  100% { transform: translateY(0) scale(1); }
}
```

#### Victory Arm Raise
```css
@keyframes victory-arms {
  0% { transform: rotate(0deg); }
  50% { transform: rotate(-20deg); }
  100% { transform: rotate(0deg); }
}
```

### Animation Do's and Don'ts

✅ **Do:**
- Use squash and stretch for impact
- Add anticipation before big movements
- Keep movements snappy and energetic
- Use overlapping action (ears lag behind head)

❌ **Don't:**
- Use linear easing (too robotic)
- Make movements too slow
- Animate every element at once
- Break silhouette readability

---

## SVG Component Reference

### Component Files

| File | Path | Contents |
|------|------|----------|
| Style Guide | `apps/website-v2/public/mascots/templates/dropout-style-guide.svg` | Full reference with all specs |
| Components | `apps/website-v2/public/mascots/templates/dropout-components.svg` | Reusable SVG components |

### Reusable Component IDs

#### Head Components
- `#eye-left` - Left eye template
- `#eye-right` - Right eye template
- `#eye-forward` - Forward-facing eye
- `#eye-excited` - Wide excited eye
- `#ear-round` - Round bear ear
- `#ear-pointed` - Pointed wolf ear
- `#ear-long` - Long rabbit ear
- `#ear-floppy` - Floppy dog ear

#### Body Components
- `#jacket-body` - Varsity jacket torso
- `#jacket-sleeve` - Jacket sleeve with stripes
- `#jacket-back` - Back view with emblem
- `#jacket-emblem` - Chest emblem

#### Accessory Components
- `#hand-paw` - Three-finger paw
- `#foot-template` - High-top sneaker
- `#cap-template` - Backwards cap
- `#chain-template` - Gold chain with pendant
- `#sunglasses-template` - Hip-hop sunglasses

### Implementation Example

```svg
<!-- Using component library -->
<svg xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Reference the component file -->
    <use href="dropout-components.svg#eye-left" id="my-eye"/>
  </defs>
  
  <!-- Use in character -->
  <g transform="translate(100, 100)">
    <use href="#my-eye" x="-20" y="0"/>
    <use href="#my-eye" x="20" y="0" transform="scale(-1, 1)"/>
  </g>
</svg>
```

---

## Quick Reference Card

### Dropout Style Checklist

- [ ] Head is 60% of body height
- [ ] Eyes are 25% of head width each
- [ ] Bold black outline (#2D1810, 2.5px)
- [ ] Gradient fills for depth
- [ ] Varsity jacket or hip-hop fashion
- [ ] Confident, slightly mischievous expression
- [ ] Gold accents on buttons/emblems
- [ ] Bouncy animation easing
- [ ] Rounded, cartoony proportions
- [ ] Species-appropriate ear shape

### Color Quick Ref

| Element | Color | Hex/Value |
|---------|-------|-----------|
| Outline | Dark Brown | #2D1810 |
| Gold | Gold | #FFD700 |
| Varsity Red | Crimson | #DC143C |
| Shadow | Black 20% | rgba(0,0,0,0.2) |
| Highlight | White 30% | rgba(255,255,255,0.3) |

---

*Document Version: 1.0 | Libre-X-eSport 4NJZ4 TENET Platform*
