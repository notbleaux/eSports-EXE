# Pixcil Usage Guide for 4NJZ4 TENET Platform

[Ver001.000]

Quick reference for using Pixcil pixel art editor with the eSports-EXE project.

---

## Installation

```bash
# Via VS Code Marketplace
code --install-extension sile.pixcil
```

Or search "Pixcil" in VS Code Extensions panel.

---

## Mascot Asset Creation Workflow

### 1. Open Pixcil

**Command Palette** (`Ctrl+Shift+P`):
```
> Pixcil: Open Editor
```

### 2. Create New Mascot Sprite

**Recommended Sizes**:
| Use Case | Size | File |
|----------|------|------|
| Hero section | 128x128 | `fox-hero.png` |
| Card thumbnail | 64x64 | `fox-card.png` |
| Icon | 32x32 | `fox-icon.png` |
| 3D texture | 256x256 | `fox-texture.png` |

### 3. Color Palette (Project Standard)

**Fox Mascot**:
```
Primary:    #F97316 (Orange-500)
Secondary:  #EA580C (Orange-600)
Light:      #FB923C (Orange-400)
Dark:       #9A3412 (Orange-800)
White:      #FFFFFF (Eyes/accents)
Black:      #000000 (Outline)
```

**Owl Mascot**:
```
Primary:    #6366F1 (Indigo-500)
Secondary:  #4F46E5 (Indigo-600)
Light:      #818CF8 (Indigo-400)
Dark:       #3730A3 (Indigo-800)
```

### 4. Export Settings

**Format**: PNG  
**Location**: `apps/website-v2/public/mascots/`  
**Naming**: `{mascot}-{size}.png`  

Example:
```
public/mascots/
├── fox-32x32.png
├── fox-64x64.png
├── fox-128x128.png
├── owl-32x32.png
├── owl-64x64.png
└── owl-128x128.png
```

### 5. Using in React Components

```tsx
// Instead of inline SVG, use exported PNG
<img 
  src="/mascots/fox-128x128.png" 
  alt="Fox Mascot"
  className="w-32 h-32 pixelated"
/>
```

**CSS for Pixel Art**:
```css
.pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}
```

---

## Key Bindings

| Key | Action |
|-----|--------|
| `Tab` | Next tool |
| `Shift+Tab` | Previous tool |
| `D` | Draw tool |
| `E` | Erase tool |
| `F` | Fill tool |
| `P` | Pick color |
| `S` | Select tool |
| `M` | Move tool |
| `Ctrl+Z` | Undo |
| `Ctrl+Y` | Redo |
| `<` | Previous frame |
| `>` | Next frame |

---

## Animation Workflow

### Creating Sprite Sheets

Pixcil supports animation frames horizontally:

```
[Frame 1] [Frame 2] [Frame 3] [Frame 4]
   idle      walk      run      jump
```

**Settings**:
- Enable: `Settings → Animation → Treat horizontal frames as animation`
- Export: Only center frame exports as final image

### CSS Sprite Animation

```css
@keyframes mascot-idle {
  0% { background-position: 0 0; }
  25% { background-position: -64px 0; }
  50% { background-position: -128px 0; }
  75% { background-position: -192px 0; }
  100% { background-position: 0 0; }
}

.mascot-sprite {
  width: 64px;
  height: 64px;
  background: url('/mascots/fox-sprite.png');
  animation: mascot-idle 1s steps(4) infinite;
}
```

---

## Godot Simulation Game Assets

### Sprite Sizes

| Object | Size | Format |
|--------|------|--------|
| Player character | 32x32 | PNG |
| Enemy | 32x32 | PNG |
| Items | 16x16 | PNG |
| UI icons | 16x16 | PNG |
| Background tiles | 64x64 | PNG |

### Export Path

```
platform/simulation-game/assets/
├── characters/
│   ├── player-idle.png
│   ├── player-run.png
│   └── enemy-basic.png
├── items/
│   ├── weapon-rifle.png
│   ├── weapon-pistol.png
│   └── item-health.png
└── ui/
    ├── icon-menu.png
    └── icon-map.png
```

---

## Tips & Best Practices

### 1. Use Layers

- Enable vertical layers in settings
- Separate: Outline → Base color → Shading → Highlights

### 2. Save Frequently

Pixcil auto-saves to PNG with metadata, but:
- Keep working files in `assets/working/`
- Export finals to `public/mascots/`

### 3. Version Control

```bash
# Track final assets
git add public/mascots/*.png

# Ignore working files
echo "assets/working/" >> .gitignore
```

### 4. Pixel Art Best Practices

- ✅ Use limited color palette (4-8 colors)
- ✅ Keep consistent lighting direction
- ✅ Use 1-2px outlines for clarity
- ✅ Test at actual size (not zoomed)
- ❌ Avoid anti-aliasing (keep it crisp)
- ❌ Don't use gradients (use solid colors)

---

## Quick Commands

### Generate All Mascot Sizes

```bash
# After creating 128x128 version, resize for other uses
# (Requires ImageMagick or similar)

convert fox-128x128.png -resize 64x64 fox-64x64.png
convert fox-128x128.png -resize 32x32 fox-32x32.png
```

### Batch Optimize PNGs

```bash
# Use pngquant for smaller files
pngquant --quality=65-80 public/mascots/*.png
```

---

## Resources

- **Pixcil GitHub**: https://github.com/sile/pixcil
- **Online Editor**: https://sile.github.io/pixcil/
- **Project Mascots**: `apps/website-v2/src/components/heroes/HeroMascot.tsx`
- **Asset Directory**: `apps/website-v2/public/mascots/`

---

*Guide Version: 001.000*
