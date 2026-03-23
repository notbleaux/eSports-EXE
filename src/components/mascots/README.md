# Mascot System Integration

Complete 14-mascot integration for the 4NJZ4 TENET Platform (7 animals × 2 styles).

[Ver004.000]

## Overview

The mascot system provides a unified interface for 14 mascot variations across two distinct art styles:

- **Dropout Style**: Full-color cartoon with rich gradients and detailed shading
- **NJ Style**: Minimalist line art with electric blue strokes and geometric shapes

## Animals (7 total)

| Animal | Dropout Component | NJ Component | Variants (Dropout) | Variants (NJ) |
|--------|------------------|--------------|-------------------|---------------|
| 🦊 Fox | `FoxDropout` | `FoxNJ` | - | `classic-blue`, `attention`, `hype-boy`, `cookie`, `ditto` |
| 🦉 Owl | `OwlDropout` | `OwlNJ` | - | - |
| 🐺 Wolf | `WolfDropout` | `WolfNJ` | `midnight`, `silverback` | `classic-blue`, `attention`, `hype-boy`, `cookie`, `ditto` |
| 🦅 Hawk | `HawkDropout` | `HawkNJ` | - | - |
| 🐻 Bear | `BearDropout` | `BearNJ` | `default`, `homecoming`, `graduation`, `late-registration`, `yeezus`, `donda` | - |
| 🐰 Bunny | `BunnyDropout` | `BunnyNJ` | - | `classic-blue`, `attention`, `hype-boy`, `cookie`, `ditto` |
| 🐱 Cat | `CatDropout` | `CatNJ` | `tuxedo`, `onesie-only` | `classic-blue`, `attention`, `hype-boy`, `cookie`, `ditto` |

## File Structure

```
src/components/mascots/
├── generated/
│   ├── dropout/
│   │   ├── FoxDropout.tsx
│   │   ├── OwlDropout.tsx
│   │   ├── WolfDropout.tsx      [NEW]
│   │   ├── HawkDropout.tsx
│   │   ├── CatDropout.tsx
│   │   └── index.ts
│   ├── nj/
│   │   ├── FoxNJ.tsx
│   │   ├── OwlNJ.tsx
│   │   ├── WolfNJ.tsx           [NEW]
│   │   ├── HawkNJ.tsx
│   │   ├── CatNJ.tsx
│   │   └── index.ts
│   └── index.ts                 [UPDATED]
├── dropout/
│   ├── BearDropout.tsx          [LEGACY]
│   └── BunnyDropout.tsx         [LEGACY]
├── nj/
│   ├── BearNJ.tsx               [LEGACY]
│   └── BunnyNJ.tsx              [LEGACY]
├── MascotAssetEnhanced.tsx      [NEW/UPDATED]
├── MascotStyleToggle.tsx        [NEW]
├── MascotStyleSelector.tsx      [NEW]
├── MascotGallery.tsx            [NEW/UPDATED]
├── index.ts                     [NEW/UPDATED]
└── README.md                    [THIS FILE]

scripts/mascot-generator/
├── config.ts                    [NEW]
└── config-new-mascots.ts        [NEW]
```

## Quick Start

### Basic Usage

```tsx
import { MascotAssetEnhanced } from '@/components/mascots';

// Simple usage with defaults
<MascotAssetEnhanced animal="fox" />

// With specific style and size
<MascotAssetEnhanced 
  animal="wolf" 
  style="dropout"
  size={256}
  animation="howl"
/>

// With variant (NJ style)
<MascotAssetEnhanced 
  animal="fox"
  style="nj"
  variant="hype-boy"
  strokeColor="#00AAFF"
/>
```

### Style Toggle

```tsx
import { MascotStyleToggle, useStyleSwitch } from '@/components/mascots';

function MyComponent() {
  const { currentStyle, toggleStyle, setStyle } = useStyleSwitch('fox');

  return (
    <div>
      <MascotStyleToggle 
        value={currentStyle}
        onChange={setStyle}
        persist
      />
      <MascotAssetEnhanced 
        animal="fox" 
        style={currentStyle}
      />
    </div>
  );
}
```

### Gallery Component

```tsx
import { MascotGallery } from '@/components/mascots';

function MascotPicker() {
  return (
    <MascotGallery
      mode="by-style"
      showStyleToggle
      showAnimalSelector
      showVariantSelectors
      onSelect={(animal, style, variant) => {
        console.log('Selected:', { animal, style, variant });
      }}
    />
  );
}
```

## Components

### MascotAssetEnhanced

The main component for rendering mascots with style-switching support.

```tsx
interface MascotAssetEnhancedProps {
  animal: MascotAnimal;        // 'fox' | 'owl' | 'wolf' | 'hawk' | 'bear' | 'bunny' | 'cat'
  style?: MascotStyle;         // 'dropout' | 'nj' (default: 'dropout')
  size?: MascotSize;           // 32 | 64 | 128 | 256 | 512 (default: 128)
  animation?: MascotAnimation; // Animation state
  variant?: string;            // Style-specific variant
  className?: string;
  onClick?: () => void;
  alt?: string;
  hoverable?: boolean;
  strokeColor?: string;        // NJ style only
  showGlint?: boolean;         // Dropout Owl only
}
```

### MascotStyleToggle

Accessible toggle switch for switching between styles.

```tsx
interface MascotStyleToggleProps {
  value: MascotStyle;
  onChange: (style: MascotStyle) => void;
  size?: 'sm' | 'md' | 'lg';
  showLabels?: boolean;
  showPreview?: boolean;
  persist?: boolean;           // Save to localStorage
}
```

### MascotStyleSelector

Visual card selector with descriptions and feature tags.

```tsx
interface MascotStyleSelectorProps {
  value: MascotStyle;
  onChange: (style: MascotStyle) => void;
  direction?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
}
```

### MascotGallery

Complete gallery with all 14 mascots, animal filtering, and variant selection.

```tsx
interface MascotGalleryProps {
  defaultAnimal?: MascotAnimal;
  defaultStyle?: MascotStyle;
  onSelect?: (animal, style, variant) => void;
  mode?: 'all' | 'by-style' | 'by-animal';
  showStyleToggle?: boolean;
  showAnimalSelector?: boolean;
  showVariantSelectors?: boolean;
  previewSize?: MascotSize;
}
```

## Configuration

### Style Configuration

```typescript
import { 
  MASCOT_CONFIGS,
  getMascotsByStyle,
  getMascotsByAnimal,
  getMascotById,
} from '@/components/mascots';

// Get all configs
console.log(MASCOT_CONFIGS); // Array of 14 mascot configs

// Filter by style
const dropoutMascots = getMascotsByStyle('dropout');

// Filter by animal
const foxVariations = getMascotsByAnimal('fox');

// Get specific mascot
const wolfNJ = getMascotById('wolf-nj');
```

### Style Switching Configuration

```typescript
import {
  STYLE_SWITCH_CONFIG,
  getCounterpartMascot,
  getCompatibleVariant,
  getCompatibleAnimation,
} from '@/components/mascots';

// Default configuration
console.log(STYLE_SWITCH_CONFIG);
// {
//   defaultStyle: 'dropout',
//   allowStyleSwitch: true,
//   persistPreference: true,
//   storageKey: 'sator-mascot-style-preference',
//   transitionDuration: 300,
//   lazyLoadComponents: true,
// }

// Get counterpart when switching styles
const counterpart = getCounterpartMascot('wolf', 'dropout');
// { animal: 'wolf', style: 'nj', config: {...} }
```

## Hooks

### useStyleSwitch

Hook for managing style switching with persistence.

```tsx
const {
  currentStyle,      // Current selected style
  toggleStyle,       // Toggle between styles
  setStyle,          // Set specific style
  getCompatibleProps // Get props compatible with target style
} = useStyleSwitch(initialAnimal, initialStyle);
```

## Lazy Loading

Components are lazy-loaded for performance. A loading fallback is shown while components load.

```tsx
// This will lazy-load the appropriate component
<MascotAssetEnhanced animal="wolf" style="dropout" />

// Components are code-split and loaded on-demand
```

## Accessibility

- All components support keyboard navigation
- ARIA labels and roles are properly set
- Focus management is handled
- Screen reader announcements for style changes
- Color contrast meets WCAG guidelines

```tsx
// Screen reader announcement
<MascotStyleToggle
  announceChanges
  ariaLabel="Toggle between Dropout and NJ mascot styles"
/>
```

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- iOS Safari 14+
- Chrome Android 90+

## Performance Considerations

- Lazy loading of SVG components
- Memoized prop calculations
- CSS transitions for smooth style switching
- Debounced animation state changes
- Lazy-loaded preview images in gallery

## TypeScript

Full TypeScript support with exported types:

```typescript
import type {
  MascotAnimal,
  MascotStyle,
  MascotSize,
  MascotAnimation,
  MascotAssetEnhancedProps,
  MascotStyleToggleProps,
  MascotGalleryProps,
  MascotConfig,
} from '@/components/mascots';
```

## Examples

### Responsive Mascot Display

```tsx
import { MascotAssetEnhanced, useStyleSwitch } from '@/components/mascots';

function ResponsiveMascot() {
  const { currentStyle, toggleStyle } = useStyleSwitch('fox');
  const [size, setSize] = useState<MascotSize>(128);

  return (
    <div className="mascot-container">
      <MascotAssetEnhanced
        animal="fox"
        style={currentStyle}
        size={size}
        animation="wave"
        hoverable
      />
      <button onClick={toggleStyle}>
        Switch Style
      </button>
    </div>
  );
}
```

### Custom Style Toggle

```tsx
import { 
  MascotStyleToggle, 
  MascotStyleToggleCompact,
  MascotStyleDisplay 
} from '@/components/mascots';

// Full toggle with labels and preview
<MascotStyleToggle
  value={style}
  onChange={setStyle}
  showLabels
  showPreview
  size="lg"
/>

// Compact button toggle
<MascotStyleToggleCompact
  value={style}
  onChange={setStyle}
/>

// Display only (no interaction)
<MascotStyleDisplay style="dropout" showDescription />
```

## Migration Guide

### From Legacy Components

Old:
```tsx
import { FoxDropout } from '@/components/mascots/generated/dropout/FoxDropout';

<FoxDropout size={128} animation="wave" />
```

New:
```tsx
import { MascotAssetEnhanced } from '@/components/mascots';

<MascotAssetEnhanced animal="fox" style="dropout" size={128} animation="wave" />
```

### Direct Component Imports

You can still import components directly for tree-shaking:

```tsx
import { FoxDropout } from '@/components/mascots';
import { WolfNJ } from '@/components/mascots';
```

## License

Part of the Libre-X-eSport 4NJZ4 TENET Platform.
