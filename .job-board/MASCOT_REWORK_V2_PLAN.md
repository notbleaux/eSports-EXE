# Mascot Rework V2 Plan - Unified Styling

[Ver001.000]

**Date**: 2026-03-24  
**Status**: REWORK INITIATED  
**Scope**: Replace ALL mascots with unified Dropout + NJ styles  
**New Mascots**: 5 animals × 2 styles = 10 mascots + 1 special (Cat in Onesie)

---

## Style Guide Analysis

### Style A: Dropout (Kanye West Inspired)
**Characteristics**:
- Cartoon aesthetic with oversized heads
- Expressive, large eyes with character
- Hip-hop/streetwear fashion elements
- Bold, saturated color palettes
- Dynamic, confident poses
- Album-era theming

**Color Approach**:
- Rich, warm tones
- Strong outlines (#2D1810)
- Gradient shading for depth
- Gold accents for premium feel

### Style B: NJ (NewJeans Inspired)
**Characteristics**:
- Minimalist line art
- Single primary color per variant
- Clean, geometric shapes
- Cute, approachable expressions
- Transparent/white backgrounds
- Modern, trendy aesthetic

**Color Approach**:
- Electric blue (default)
- Pastel variants (pink, mint)
- 2px stroke weight
- No fill (outline only)

---

## New Mascot Lineup

### 1. Fox (Tactical Guide) → Reworked
**Dropout Style**: Street-smart fox with bomber jacket, confident stance
**NJ Style**: Minimalist fox outline, clever expression

### 2. Owl (Strategist) → Reworked
**Dropout Style**: Wise owl with glasses, preppy sweater, thoughtful pose
**NJ Style**: Simple owl outline, large wise eyes

### 3. Wolf (Combat Leader) → Reworked
**Dropout Style**: Strong wolf with varsity jacket, leadership pose
**NJ Style**: Bold wolf outline, determined expression

### 4. Hawk (Scout) → Reworked
**Dropout Style**: Sharp hawk with aviator jacket, focused gaze
**NJ Style**: Sleek hawk outline, precision lines

### 5. Bear (Artist) → Updated Dropout Bear
**Dropout Style**: Refined bear with improved graduation styling
**NJ Style**: Simple bear outline, friendly rounded features

### 6. Bunny (Trendsetter) → Updated NJ Bunny
**Dropout Style**: Cartoon bunny with trendy outfit
**NJ Style**: Refined line art, iconic floppy ears

### 7. Cat in Bunny Onesie (NEW - Special)
**Description**: Black and white tuxedo cat, grey detailing, blue eyes, cheeky expression
**Dropout Style**: Full-color cat wearing bunny onesie, mischievous pose
**NJ Style**: Line art cat with onesie outline, playful stance

---

## Generation Tasks

### Phase 1: Style Templates (2 Agents)

#### AGENT-001: Dropout Style Template
**Duration**: 2 hours
**Tasks**:
- Create master Dropout style guide SVG
- Define color palette system
- Create reusable components (eyes, poses, clothing)
- Document animation specifications

**Outputs**:
- `templates/dropout-style-guide.svg`
- `templates/dropout-components.svg`
- `docs/dropout-style-spec.md`

#### AGENT-002: NJ Style Template
**Duration**: 2 hours
**Tasks**:
- Create master NJ style guide SVG
- Define line weight and spacing
- Create reusable line art components
- Document variant color system

**Outputs**:
- `templates/nj-style-guide.svg`
- `templates/nj-components.svg`
- `docs/nj-style-spec.md`

### Phase 2: Core 5 Animals - Dropout Style (5 Agents)

| Agent | Mascot | Task | Output |
|-------|--------|------|--------|
| DROP-001 | Fox | Generate 5 sizes + CSS + React | 7 files |
| DROP-002 | Owl | Generate 5 sizes + CSS + React | 7 files |
| DROP-003 | Wolf | Generate 5 sizes + CSS + React | 7 files |
| DROP-004 | Hawk | Generate 5 sizes + CSS + React | 7 files |
| DROP-005 | Bear | Update/refine existing + variants | 7 files |

### Phase 3: Core 5 Animals - NJ Style (5 Agents)

| Agent | Mascot | Task | Output |
|-------|--------|------|--------|
| NJ-001 | Fox | Generate 5 sizes + CSS + React | 7 files |
| NJ-002 | Owl | Generate 5 sizes + CSS + React | 7 files |
| NJ-003 | Wolf | Generate 5 sizes + CSS + React | 7 files |
| NJ-004 | Hawk | Generate 5 sizes + CSS + React | 7 files |
| NJ-005 | Bunny | Update/refine existing + variants | 7 files |

### Phase 4: Special Mascot - Cat in Onesie (2 Agents)

| Agent | Task | Output |
|-------|------|--------|
| CAT-001 | Dropout style cat in bunny onesie | 7 files |
| CAT-002 | NJ style cat in bunny onesie | 7 files |

### Phase 5: Integration & Pipeline (3 Agents)

| Agent | Task | Output |
|-------|------|--------|
| INT-001 | Update config and types | Updated configs |
| INT-002 | Update components integration | Updated components |
| INT-003 | Create style switcher component | StyleToggle.tsx |

### Phase 6: Quality Review (3 Agents)

| Agent | Task | Output |
|-------|------|--------|
| QA-001 | Compare against reference images | Quality report |
| QA-002 | Animation review and polish | Polished animations |
| QA-003 | Accessibility audit | a11y report |

---

## File Structure

```
public/mascots/
├── dropout/           # Dropout style SVGs
│   ├── fox-32x32.svg
│   ├── fox-64x64.svg
│   ├── ...
│   └── cat-512x512.svg
├── nj/                # NJ style SVGs
│   ├── fox-32x32.svg
│   ├── fox-64x64.svg
│   ├── ...
│   └── cat-512x512.svg
└── css/
    ├── dropout-style.css      # Shared Dropout animations
    ├── nj-style.css           # Shared NJ animations
    ├── fox-dropout.css
    ├── fox-nj.css
    ├── ...
    └── cat-nj.css

src/components/mascots/
├── generated/
│   ├── dropout/
│   │   ├── FoxDropout.tsx
│   │   ├── OwlDropout.tsx
│   │   ├── ...
│   │   └── CatDropout.tsx
│   └── nj/
│       ├── FoxNJ.tsx
│       ├── OwlNJ.tsx
│       ├── ...
│       └── CatNJ.tsx
├── MascotAssetEnhanced.tsx     # Updated with style switching
├── MascotStyleToggle.tsx       # New: Switch between styles
└── index.ts
```

---

## Color Palettes

### Dropout Style Colors

**Fox**:
- Primary: #E85D04 (Vibrant orange)
- Secondary: #F48C06 (Light orange)
- Dark: #9D0208 (Deep red)
- Light: #FAA307 (Yellow-orange)
- Jacket: #370617 (Burgundy)

**Owl**:
- Primary: #7B2CBF (Purple)
- Secondary: #9D4EDD (Light purple)
- Dark: #5A189A (Deep purple)
- Light: #C77DFF (Lavender)
- Sweater: #FF9E00 (Mustard)

**Wolf**:
- Primary: #6C757D (Slate)
- Secondary: #ADB5BD (Light slate)
- Dark: #343A40 (Charcoal)
- Light: #DEE2E6 (Silver)
- Jacket: #212529 (Black)

**Hawk**:
- Primary: #D00000 (Red)
- Secondary: #E85D04 (Orange-red)
- Dark: #9D0208 (Deep red)
- Light: #FFBA08 (Gold)
- Jacket: #370617 (Maroon)

**Bear**:
- Primary: #8B4513 (Brown)
- Secondary: #D2691E (Tan)
- Dark: #5D3A1A (Dark brown)
- Light: #DEB887 (Wheat)
- Jacket: #DC143C (Crimson)

**Bunny**:
- Primary: #FF006E (Hot pink)
- Secondary: #FB5607 (Orange)
- Dark: #8338EC (Purple)
- Light: #FFBE0B (Yellow)
- Outfit: #3A86FF (Blue)

**Cat**:
- Primary: #000000 (Black)
- Secondary: #FFFFFF (White)
- Grey: #6C757D (Grey detailing)
- Eyes: #00B4D8 (Bright blue)
- Onesie: #F72585 (Pink)

### NJ Style Colors

**All Animals**:
- Default: #0000FF (Electric blue)
- Attention: #FF006E (Hot pink)
- Hype: #00F5D4 (Mint)
- Cookie: #8B4513 (Brown)
- Ditto: #E0E0E0 (Light gray)

---

## Total Asset Count

| Category | Count |
|----------|-------|
| Mascots | 7 animals × 2 styles = 14 |
| SVGs per mascot | 5 sizes = 70 SVGs |
| CSS files | 14 (1 per mascot-style) |
| React components | 14 (1 per mascot-style) |
| Shared CSS | 2 (dropout-style, nj-style) |
| **TOTAL** | **100 files** |

---

## Quality Checklist

- [ ] All SVGs match reference image quality
- [ ] Colors accurate to style guide
- [ ] Animations smooth at 60fps
- [ ] Consistent styling across all mascots
- [ ] Accessibility compliant
- [ ] Responsive at all sizes
- [ ] Dark mode compatible
- [ ] Style switcher functional

---

## Timeline

| Phase | Agents | Duration | Parallel |
|-------|--------|----------|----------|
| Phase 1: Templates | 2 | 4h | Yes |
| Phase 2: Dropout Style | 5 | 5h | Yes |
| Phase 3: NJ Style | 5 | 5h | Yes |
| Phase 4: Special Cat | 2 | 2h | Yes |
| Phase 5: Integration | 3 | 3h | Partial |
| Phase 6: Quality Review | 3 | 3h | Partial |
| **TOTAL** | **20** | **22h** | **-** |

---

*Plan Version: 001.000*  
*Ready for Execution*
