# Mascot Generator - 3-Option Pipeline

[Ver001.000]

**FREE** mascot asset generation for 4NJZ4 TENET Platform.

## Overview

This pipeline generates mascot assets in 3 formats with fine-tuning capabilities:

| Option | Format | Use Case | Cost |
|--------|--------|----------|------|
| **1** | SVG | Scalable, web-ready | FREE |
| **2** | PNG | Pixel-perfect, games | FREE |
| **3** | CSS | Zero dependencies | FREE |

## Quick Start

```bash
cd apps/website-v2

# Generate all mascots (SVG only - immediate)
npx ts-node scripts/mascot-generator/index.ts

# With PNG (requires canvas - see below)
npm install --save-dev canvas
npx ts-node scripts/mascot-generator/index.ts
```

## Installation

### Option 1: SVG Only (Immediate)
No installation required! SVG generation is pure TypeScript.

### Option 2: With PNG Support
```bash
npm install --save-dev canvas sharp
```

**Note**: `canvas` requires native dependencies:
- **Windows**: `npm install --global windows-build-tools`
- **macOS**: `brew install pkg-config cairo pango libpng jpeg giflib librsvg`
- **Linux**: `sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev`

### Option 3: CSS Only
No installation required! Pure CSS generation.

## Usage

### Command Line

```bash
# Generate all mascots in all formats
npx ts-node scripts/mascot-generator/index.ts

# Generate specific mascot
npx ts-node scripts/mascot-generator/index.ts --fox
npx ts-node scripts/mascot-generator/index.ts --owl
npx ts-node scripts/mascot-generator/index.ts --wolf
npx ts-node scripts/mascot-generator/index.ts --hawk

# Generate specific format
npx ts-node scripts/mascot-generator/index.ts --svg
npx ts-node scripts/mascot-generator/index.ts --png
npx ts-node scripts/mascot-generator/index.ts --css

# Use fine-tuning preset
npx ts-node scripts/mascot-generator/index.ts --tune=pixelPerfect
npx ts-node scripts/mascot-generator/index.ts --tune=smooth

# Custom output directory
npx ts-node scripts/mascot-generator/index.ts --out=./my-mascots
```

### Programmatic Usage

```typescript
import { MascotPipeline, PRESETS } from './scripts/mascot-generator';

// Quick SVG generation
const quick = PRESETS.quick();
await quick.run();

// Pixel art for games
const pixelArt = PRESETS.pixelArt();
await pixelArt.run();

// Web-ready (all formats)
const web = PRESETS.web();
await web.run();

// Custom pipeline
import { MascotPipeline, FINE_TUNING } from './scripts/mascot-generator';

const pipeline = new MascotPipeline({
  outputDir: 'public/mascots',
  enabledOptions: ['svg', 'png'],
  fineTuning: {
    sizes: [64, 128],
    pixelScale: 2,
    showGrid: false,
    antiAlias: false,
    formats: ['svg', 'png'],
    optimization: 'basic',
    metadata: true
  },
  generateComponents: true
});

await pipeline.run();
```

## Fine-Tuning

### Presets

| Preset | Description | Best For |
|--------|-------------|----------|
| `pixelPerfect` | Crisp pixels, no anti-aliasing | Games, pixel art |
| `smooth` | Anti-aliased, smooth edges | Web, large displays |
| `minimal` | Small file size, no metadata | Icons, performance |
| `compatible` | All formats, common sizes | Maximum support |
| `animated` | SVG/CSS with animation data | Interactive |

### Custom Fine-Tuning

```typescript
import { MascotPipeline } from './scripts/mascot-generator';

const pipeline = new MascotPipeline({
  fineTuning: {
    sizes: [32, 64, 128],        // Output sizes
    pixelScale: 2,                // Scale factor
    showGrid: true,              // Show pixel grid
    antiAlias: false,            // Anti-aliasing
    formats: ['svg', 'png'],     // Output formats
    optimization: 'aggressive',  // PNG compression
    metadata: true               // Include metadata
  }
});
```

## Output Structure

```
public/mascots/
├── svg/
│   ├── fox-32x32.svg
│   ├── fox-64x64.svg
│   ├── fox-128x128.svg
│   ├── fox-256x256.svg
│   ├── owl-32x32.svg
│   └── ...
├── png/
│   ├── fox-32x32.png
│   ├── fox-64x64.png
│   └── ...
├── css/
│   ├── fox.css
│   ├── owl.css
│   └── ...
└── mascots.css          # Bundle of all CSS

src/components/mascots/generated/
├── FoxMascotSVG.tsx     # React SVG component
├── FoxCSS.tsx           # React CSS component
├── OwlMascotSVG.tsx
└── ...
```

## Mascot Configurations

### Fox (Default)
- **Colors**: Orange theme (#F97316)
- **Personality**: Agile, clever
- **Features**: Pointed ears, medium eyes

### Owl
- **Colors**: Indigo theme (#6366F1)
- **Personality**: Wise, strategic
- **Features**: Rounded ears, large eyes

### Wolf
- **Colors**: Slate theme (#475569)
- **Personality**: Strong, leadership
- **Features**: Pointed ears, long snout

### Hawk
- **Colors**: Red theme (#DC2626) + Gold
- **Personality**: Speed, precision
- **Features**: Gold accents

## React Component Usage

### SVG Component (Recommended)

```tsx
import { FoxMascotSVG } from './components/mascots/generated/FoxMascotSVG';

function Hero() {
  return (
    <div className="hero">
      <FoxMascotSVG size={128} animate={true} />
      <h1>Welcome to SATOR</h1>
    </div>
  );
}
```

### CSS Component (Zero Dependencies)

```tsx
import { FoxCSS } from './components/mascots/generated/FoxCSS';
import './mascots/fox.css';

function Icon() {
  return <FoxCSS className="my-icon" animate={true} />;
}
```

### Direct PNG

```tsx
function Avatar() {
  return (
    <img 
      src="/mascots/png/fox-64x64.png" 
      alt="Fox Mascot"
      className="w-16 h-16 pixelated"
    />
  );
}
```

## Build Integration

### Package.json Scripts

```json
{
  "scripts": {
    "mascots:generate": "ts-node scripts/mascot-generator/index.ts",
    "mascots:watch": "ts-node scripts/mascot-generator/index.ts --watch",
    "mascots:fox": "ts-node scripts/mascot-generator/index.ts --fox",
    "mascots:pixel": "ts-node scripts/mascot-generator/index.ts --tune=pixelPerfect"
  }
}
```

### Pre-build Hook

```json
{
  "scripts": {
    "build": "npm run mascots:generate && vite build"
  }
}
```

## Advanced: Custom Mascots

```typescript
import { MascotConfig, MascotPipeline } from './scripts/mascot-generator';

const customMascot: MascotConfig = {
  name: 'dragon',
  displayName: 'Dragon',
  personality: 'Powerful, ancient, mystical',
  colors: {
    primary: '#7C3AED',    // Violet
    secondary: '#6D28D9',
    light: '#8B5CF6',
    dark: '#5B21B6',
    outline: '#000000',
    white: '#FFFFFF',
    black: '#000000'
  },
  features: {
    earShape: 'pointed',
    eyeSize: 'large',
    snoutLength: 'long',
    hasTail: true
  },
  animations: {
    idle: ['blink', 'tail-swish', 'nostril-flare'],
    wave: ['wing-flap', 'roar', 'bow'],
    celebrate: ['fire-breath', 'wing-spread', 'victory-roar']
  }
};

const pipeline = new MascotPipeline();
// Process single mascot
```

## Troubleshooting

### Canvas Installation Fails

**Problem**: `canvas` npm install fails with native module errors.

**Solution**: Use SVG-only mode (no canvas required):
```bash
npx ts-node scripts/mascot-generator/index.ts --svg
```

### PNG Quality Issues

**Problem**: PNGs look blurry.

**Solution**: Disable anti-aliasing, use pixel-perfect preset:
```bash
npx ts-node scripts/mascot-generator/index.ts --tune=pixelPerfect
```

### File Size Too Large

**Problem**: Generated files are too big.

**Solution**: Use minimal preset with aggressive optimization:
```bash
npx ts-node scripts/mascot-generator/index.ts --tune=minimal
```

## Cost Breakdown

| Component | Cost | Notes |
|-----------|------|-------|
| TypeScript/Node.js | FREE | Already in project |
| SVG Generation | FREE | Pure code |
| PNG Generation | FREE | Open source canvas |
| CSS Generation | FREE | Pure code |
| **Total** | **$0** | Completely free |

## License

Generated assets are yours to use freely. The generator code follows project license.

---

**Version**: 001.000  
**Status**: Production Ready  
**Cost**: $0
