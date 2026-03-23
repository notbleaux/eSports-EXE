# Art Generation Plan: Inspired Mascots

[Ver001.000]

**Date**: 2026-03-23  
**Status**: PLANNING  
**Inspiration**: Dropout Bear + NewJeans Bunny Styles  
**Scope**: 2 New Mascot Lines + Asset Variations

---

## Inspiration Analysis

### Style 1: Dropout Bear (Kanye West)
**Characteristics**:
- Cartoon bear with oversized head
- Hip-hop/streetwear fashion aesthetic
- Graduation/collegiate themes
- Bold, saturated colors (browns, golds, reds)
- Expressive eyes with character
- Clothing variations per "album era"
- Dynamic poses (standing, flying, celebrating)

**Color Palette**:
- Primary: Warm browns (#8B4513, #D2691E)
- Secondary: Gold accents (#FFD700, #DAA520)
- Accent: Deep reds (#B22222, #DC143C)
- Background: Rich gradients (purple, pink, orange)

### Style 2: NewJeans Bunny
**Characteristics**:
- Minimalist line art style
- Single color (blue) on transparent/white
- Cute, friendly expression
- Simple geometric shapes
- Small accessories (stars, hearts, etc.)
- Group compositions possible
- Clean, modern aesthetic

**Color Palette**:
- Primary: Electric blue (#0000FF, #4169E1)
- Accent: White (#FFFFFF)
- Optional: Pastel pinks, mint greens for variants

---

## New Mascot Configurations

### Mascot 5: Dropout Bear
```typescript
export const DROPOUT_BEAR_MASCOT: MascotConfig = {
  name: 'dropout-bear',
  displayName: 'Dropout Bear',
  personality: 'Confident, creative, trailblazer',
  colors: {
    primary: '#8B4513',    // Saddle Brown
    secondary: '#D2691E',  // Chocolate
    light: '#DEB887',      // Burlywood
    dark: '#5D3A1A',       // Dark Brown
    gold: '#FFD700',       // Gold
    red: '#DC143C',        // Crimson
    outline: '#000000',
    white: '#FFFFFF',
    black: '#000000'
  },
  features: {
    earShape: 'rounded',
    eyeSize: 'large',
    snoutLength: 'short',
    hasTail: false,
    hasClothing: true,
    clothingStyle: 'varsity-jacket'
  },
  animations: {
    idle: ['blink', 'head-nod', 'jacket-adjust'],
    wave: ['paw-raise', 'dip', 'paw-lower'],
    celebrate: ['graduation-toss', 'mic-drop', 'crowd-surf']
  },
  styleVariants: [
    'homecoming',      // Pink/brown colorway
    'graduation',      // Purple/gold colorway
    'late-registration', // Maroon/formal
    'yeezus',          // Minimal/black
    'donda'            // All black
  ]
};
```

### Mascot 6: NewJeans Bunny
```typescript
export const NEWJEANS_BUNNY_MASCOT: MascotConfig = {
  name: 'nj-bunny',
  displayName: 'NJ Bunny',
  personality: 'Playful, trendy, youthful',
  colors: {
    primary: '#0000FF',    // Electric Blue
    secondary: '#4169E1',  // Royal Blue
    light: '#87CEEB',      // Sky Blue
    dark: '#00008B',       // Dark Blue
    pink: '#FFB6C1',       // Light Pink
    mint: '#98FF98',       // Mint Green
    outline: '#0000FF',    // Blue outline (line art style)
    white: '#FFFFFF',
    black: '#000000'
  },
  features: {
    earShape: 'floppy',
    eyeSize: 'large',
    snoutLength: 'short',
    hasTail: true,
    style: 'line-art',
    lineWeight: 2
  },
  animations: {
    idle: ['ear-wiggle', 'nose-twitch', 'blink'],
    wave: ['ear-wave', 'paw-wave', 'hop'],
    celebrate: ['star-jump', 'heart-eyes', 'spin']
  },
  styleVariants: [
    'classic-blue',    // Single blue line art
    'attention',       // Pink accents
    'hype-boy',        // Mint accents
    'cookie',          // Full color version
    'ditto'            // Minimalist
  ]
};
```

---

## Generation Tasks

### Phase A: Dropout Bear Assets (3 Agents)

| Agent | Task | Output | Time |
|-------|------|--------|------|
| BEAR-001 | Generate SVGs (5 sizes) | 5 SVG files | 1h |
| BEAR-002 | Generate CSS animations | 1 CSS file | 1h |
| BEAR-003 | Generate React components | 2 TSX files | 1h |

**Deliverables**:
- `public/mascots/svg/dropout-bear-32x32.svg`
- `public/mascots/svg/dropout-bear-64x64.svg`
- `public/mascots/svg/dropout-bear-128x128.svg`
- `public/mascots/svg/dropout-bear-256x256.svg`
- `public/mascots/svg/dropout-bear-512x512.svg`
- `public/mascots/css/dropout-bear.css`
- `src/components/mascots/generated/DropoutBearSVG.tsx`
- `src/components/mascots/generated/DropoutBearCSS.tsx`

### Phase B: NJ Bunny Assets (3 Agents)

| Agent | Task | Output | Time |
|-------|------|--------|------|
| BUNNY-001 | Generate SVGs (5 sizes) | 5 SVG files | 1h |
| BUNNY-002 | Generate CSS animations | 1 CSS file | 1h |
| BUNNY-003 | Generate React components | 2 TSX files | 1h |

**Deliverables**:
- `public/mascots/svg/nj-bunny-32x32.svg`
- `public/mascots/svg/nj-bunny-64x64.svg`
- `public/mascots/svg/nj-bunny-128x128.svg`
- `public/mascots/svg/nj-bunny-256x256.svg`
- `public/mascots/svg/nj-bunny-512x512.svg`
- `public/mascots/css/nj-bunny.css`
- `src/components/mascots/generated/NJBunnySVG.tsx`
- `src/components/mascots/generated/NJBunnyCSS.tsx`

### Phase C: Style Variants (4 Agents)

| Agent | Task | Output | Time |
|-------|------|--------|------|
| VAR-001 | Dropout Bear variants (5 styles) | 5 SVG sets | 2h |
| VAR-002 | NJ Bunny variants (5 styles) | 5 SVG sets | 2h |
| VAR-003 | Integration & testing | Updated components | 1h |
| VAR-004 | Documentation & gallery | Updated docs | 1h |

---

## Technical Requirements

### SVG Specifications
```typescript
const BEAR_SVG_SPEC = {
  viewBox: '0 0 64 64',
  baseUnit: 2,  // 2px grid
  colors: {
    fur: '#8B4513',
    furLight: '#DEB887',
    snout: '#F5DEB3',
    eyes: '#000000',
    jacket: '#DC143C',
    jacketTrim: '#FFD700'
  },
  features: [
    'round-head',
    'large-expressive-eyes',
    'varsity-jacket',
    'graduation-cap-optional'
  ]
};

const BUNNY_SVG_SPEC = {
  viewBox: '0 0 64 64',
  baseUnit: 2,
  strokeWidth: 2,
  strokeColor: '#0000FF',
  fill: 'none',  // Line art style
  features: [
    'floppy-ears',
    'large-round-eyes',
    'small-nose',
    'simple-body-line'
  ]
};
```

### Animation Specifications

**Dropout Bear Animations**:
```css
/* Graduation toss */
@keyframes graduation-toss {
  0%, 100% { transform: translateY(0) rotate(0); }
  25% { transform: translateY(-10px) rotate(-10deg); }
  50% { transform: translateY(-20px) rotate(0); }
  75% { transform: translateY(-10px) rotate(10deg); }
}

/* Mic drop */
@keyframes mic-drop {
  0% { transform: translateY(0) scale(1); }
  30% { transform: translateY(-15px) scale(1.1); }
  100% { transform: translateY(0) scale(1) rotate(5deg); }
}
```

**NJ Bunny Animations**:
```css
/* Ear wiggle */
@keyframes ear-wiggle {
  0%, 100% { transform: rotate(0); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

/* Star jump */
@keyframes star-jump {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px) scale(1.1); }
}
```

---

## Integration Plan

### Step 1: Update Config
Add to `config.ts`:
```typescript
export { DROPOUT_BEAR_MASCOT, NEWJEANS_BUNNY_MASCOT };
export const ALL_MASCOTS = [
  FOX_MASCOT, OWL_MASCOT, WOLF_MASCOT, HAWK_MASCOT,
  DROPOUT_BEAR_MASCOT, NEWJEANS_BUNNY_MASCOT
];
```

### Step 2: Update Pipeline
Ensure pipeline handles new mascots automatically.

### Step 3: Update Components
Add to type definitions:
```typescript
export type MascotType = 'fox' | 'owl' | 'wolf' | 'hawk' | 'dropout-bear' | 'nj-bunny';
```

### Step 4: Gallery Update
Add new mascots to MascotGallery with variant selectors.

---

## Asset Manifest

### Total New Assets
| Type | Count | Size Est. |
|------|-------|-----------|
| SVG files | 50 (2 mascots × 5 sizes × 5 variants) | ~500KB |
| CSS files | 2 | ~30KB |
| React components | 4 | ~200KB |
| Documentation | 2 | ~20KB |
| **Total** | **58 files** | **~750KB** |

---

## Quality Checklist

- [ ] All SVGs valid and render correctly
- [ ] All animations smooth at 60fps
- [ ] Components type-safe
- [ ] Accessibility: ARIA labels, alt text
- [ ] Responsive: All sizes look good
- [ ] Dark mode compatible
- [ ] Consistent with existing mascots
- [ ] Style matches inspiration images

---

## Timeline

| Phase | Agents | Duration | Parallel |
|-------|--------|----------|----------|
| A: Dropout Bear | 3 | 3h | Yes |
| B: NJ Bunny | 3 | 3h | Yes |
| C: Variants | 4 | 6h | Partial |
| Integration | 2 | 2h | No |
| **Total** | **12** | **14h** | **-** |

---

## Rollback Plan

If generation fails:
1. Remove new mascot configs from `config.ts`
2. Delete generated files
3. Revert type definitions
4. Keep existing 4 mascots functional

---

*Plan Version: 001.000*  
*Ready for Sub-Agent Execution*
