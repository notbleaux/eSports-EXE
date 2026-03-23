[Ver001.000]

# Mascot System API Documentation

Complete API reference for the 4NJZ4 TENET Platform mascot system.

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Component API Reference](#component-api-reference)
4. [Type Definitions](#type-definitions)
5. [Variant Reference](#variant-reference)
6. [Usage Examples](#usage-examples)
7. [Animation Guide](#animation-guide)
8. [Styling Guide](#styling-guide)
9. [Hooks](#hooks)
10. [Troubleshooting](#troubleshooting)

---

## Overview

The mascot system provides a unified interface for 14 mascot variations (7 animals × 2 styles) used throughout the 4NJZ4 TENET Platform.

### Two Style Systems

| Style | Description | Visual Characteristics |
|-------|-------------|------------------------|
| **Dropout** | Full-color cartoon style | Rich gradients, detailed shading, vibrant colors, warm orange/red tones |
| **NJ** | Minimalist line art | Clean lines, minimal design, electric blue strokes (#0000FF), geometric shapes |

### 14 Available Mascots

| # | Animal | Emoji | Dropout Component | NJ Component |
|---|--------|-------|------------------|--------------|
| 1 | Fox | 🦊 | `FoxDropout` | `FoxNJ` |
| 2 | Owl | 🦉 | `OwlDropout` | `OwlNJ` |
| 3 | Wolf | 🐺 | `WolfDropout` | `WolfNJ` |
| 4 | Hawk | 🦅 | `HawkDropout` | `HawkNJ` |
| 5 | Bear | 🐻 | `BearDropout` | `BearNJ` |
| 6 | Bunny | 🐰 | `BunnyDropout` | `BunnyNJ` |
| 7 | Cat | 🐱 | `CatDropout` | `CatNJ` |

---

## Quick Start

### Installation

Components are available from the mascot module:

```tsx
import { 
  MascotAssetEnhanced, 
  MascotStyleToggle,
  MascotGallery,
  useStyleSwitch 
} from '@/components/mascots';
```

### Basic Usage

```tsx
// Render a fox mascot at default size (128px)
<MascotAssetEnhanced animal="fox" />

// Render with specific style and size
<MascotAssetEnhanced 
  animal="bear" 
  style="dropout" 
  size={256}
  animation="wave"
/>
```

---

## Component API Reference

### MascotAssetEnhanced

The main component for rendering mascots with full style-switching support.

```typescript
interface MascotAssetEnhancedProps {
  /** The animal type to display (required) */
  animal: MascotAnimal;
  
  /** Visual style - 'dropout' or 'nj' (default: 'dropout') */
  style?: MascotStyle;
  
  /** Size in pixels - 32 | 64 | 128 | 256 | 512 (default: 128) */
  size?: MascotSize;
  
  /** Animation state */
  animation?: MascotAnimation;
  
  /** Style-specific variant name */
  variant?: string;
  
  /** Additional CSS class names */
  className?: string;
  
  /** Click handler for interactive mascots */
  onClick?: () => void;
  
  /** Alt text for accessibility (auto-generated if not provided) */
  alt?: string;
  
  /** Enable hover effects (default: true) */
  hoverable?: boolean;
  
  /** Custom stroke color for NJ style only */
  strokeColor?: string;
  
  /** Show glasses glint effect - Dropout Owl only (default: true) */
  showGlint?: boolean;
  
  /** Callback when style switches */
  onStyleChange?: (newStyle: MascotStyle) => void;
}
```

#### Usage

```tsx
import { MascotAssetEnhanced } from '@/components/mascots';

// Basic usage
<MascotAssetEnhanced animal="fox" />

// With all props
<MascotAssetEnhanced
  animal="wolf"
  style="dropout"
  size={256}
  animation="howl"
  variant="midnight"
  className="my-mascot"
  onClick={() => console.log('Clicked!')}
  alt="Midnight wolf mascot"
  hoverable={true}
/>

// NJ style with custom stroke
<MascotAssetEnhanced
  animal="fox"
  style="nj"
  variant="hype-boy"
  size={128}
  strokeColor="#00AAFF"
/>
```

---

### MascotStyleToggle

Accessible toggle switch for switching between Dropout and NJ styles.

```typescript
interface MascotStyleToggleProps {
  /** Currently selected style (required) */
  value: MascotStyle;
  
  /** Callback when style changes (required) */
  onChange: (style: MascotStyle) => void;
  
  /** Additional CSS class names */
  className?: string;
  
  /** Size variant - 'sm' | 'md' | 'lg' (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
  
  /** Show style labels (default: true) */
  showLabels?: boolean;
  
  /** Show preview icons on thumb (default: true) */
  showPreview?: boolean;
  
  /** Disable the toggle (default: false) */
  disabled?: boolean;
  
  /** Custom accessibility label */
  ariaLabel?: string;
  
  /** Persist preference to localStorage (default: true) */
  persist?: boolean;
  
  /** Custom localStorage key (default: 'sator-mascot-style-preference') */
  storageKey?: string;
}
```

#### Size Specifications

| Size | Height | Width | Thumb Size | Font Size |
|------|--------|-------|------------|-----------|
| sm | 28px | 100px | 24px | 11px |
| md | 36px | 120px | 32px | 13px |
| lg | 44px | 140px | 40px | 15px |

#### Usage

```tsx
import { MascotStyleToggle } from '@/components/mascots';

function StyleSwitcher() {
  const [style, setStyle] = useState<MascotStyle>('dropout');
  
  return (
    <MascotStyleToggle
      value={style}
      onChange={setStyle}
      size="md"
      showLabels={true}
      showPreview={true}
      persist={true}
      ariaLabel="Toggle mascot style"
    />
  );
}
```

#### Keyboard Navigation

- **Enter/Space**: Toggle between styles
- **ArrowLeft/ArrowUp**: Select Dropout style
- **ArrowRight/ArrowDown**: Select NJ style

---

### MascotStyleToggleCompact

Compact button-style toggle for space-constrained UIs.

```typescript
interface MascotStyleToggleCompactProps {
  /** Currently selected style (required) */
  value: MascotStyle;
  
  /** Callback when style changes (required) */
  onChange: (style: MascotStyle) => void;
  
  /** Additional CSS class names */
  className?: string;
  
  /** Disable the toggle (default: false) */
  disabled?: boolean;
}
```

#### Usage

```tsx
import { MascotStyleToggleCompact } from '@/components/mascots';

<MascotStyleToggleCompact
  value={style}
  onChange={setStyle}
/>
```

---

### MascotStyleSelector

Visual card selector with descriptions and feature tags.

```typescript
interface MascotStyleSelectorProps {
  /** Currently selected style (required) */
  value: MascotStyle;
  
  /** Callback when style changes (required) */
  onChange: (style: MascotStyle) => void;
  
  /** Additional CSS class names */
  className?: string;
  
  /** Layout direction - 'horizontal' | 'vertical' (default: 'horizontal') */
  direction?: 'horizontal' | 'vertical';
  
  /** Size variant - 'sm' | 'md' | 'lg' (default: 'md') */
  size?: 'sm' | 'md' | 'lg';
  
  /** Show descriptions (default: true) */
  showDescription?: boolean;
  
  /** Disable the selector (default: false) */
  disabled?: boolean;
}
```

#### Usage

```tsx
import { MascotStyleSelector } from '@/components/mascots';

<MascotStyleSelector
  value={style}
  onChange={setStyle}
  direction="horizontal"
  size="lg"
  showDescription={true}
/>
```

---

### StyleBadge

Compact badge for displaying the current style.

```typescript
interface StyleBadgeProps {
  /** Style to display */
  style: MascotStyle;
  
  /** Size variant - 'sm' | 'md' (default: 'sm') */
  size?: 'sm' | 'md';
}
```

#### Usage

```tsx
import { StyleBadge } from '@/components/mascots';

<StyleBadge style="dropout" size="sm" />
```

---

### MascotGallery

Complete gallery displaying all 14 mascots with filtering and selection.

```typescript
interface MascotGalleryProps {
  /** Default selected animal (default: null - show all) */
  defaultAnimal?: MascotAnimal | null;
  
  /** Default selected style (default: 'dropout') */
  defaultStyle?: MascotStyle;
  
  /** Callback when a mascot is selected */
  onSelect?: (animal: MascotAnimal, style: MascotStyle, variant?: string) => void;
  
  /** Additional CSS class names */
  className?: string;
  
  /** Show style toggle in header (default: true) */
  showStyleToggle?: boolean;
  
  /** Show animal selector filter (default: true) */
  showAnimalSelector?: boolean;
  
  /** Show variant dropdowns (default: true) */
  showVariantSelectors?: boolean;
  
  /** Display mode - 'all' | 'by-style' | 'by-animal' (default: 'all') */
  mode?: 'all' | 'by-style' | 'by-animal';
  
  /** Preview size for mascot cards (default: 128) */
  previewSize?: MascotSize;
}
```

#### Usage

```tsx
import { MascotGallery } from '@/components/mascots';

<MascotGallery
  mode="by-style"
  showStyleToggle={true}
  showAnimalSelector={true}
  showVariantSelectors={true}
  previewSize={128}
  onSelect={(animal, style, variant) => {
    console.log('Selected:', { animal, style, variant });
  }}
/>
```

---

## Type Definitions

### Core Types

```typescript
/** Available mascot animals */
type MascotAnimal = 'fox' | 'owl' | 'wolf' | 'hawk' | 'bear' | 'bunny' | 'cat';

/** Available mascot styles */
type MascotStyle = 'dropout' | 'nj';

/** Available mascot sizes in pixels */
type MascotSize = 32 | 64 | 128 | 256 | 512;

/** Available animation types */
type MascotAnimation = 
  | 'idle' 
  | 'wave' 
  | 'celebrate' 
  | 'confident' 
  | 'thinking' 
  | 'reading' 
  | 'howl' 
  | 'prowl' 
  | 'mischief' 
  | 'peekaboo' 
  | 'alert' 
  | 'scanning'
  | 'none';
```

### Configuration Types

```typescript
interface MascotConfig {
  id: string;
  animal: MascotAnimal;
  style: MascotStyle;
  componentName: string;
  displayName: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
  sizes: number[];
  animations: string[];
  variants?: string[];
  filePath: string;
}
```

### Utility Types

```typescript
/** Return type of useStyleSwitch hook */
interface UseStyleSwitchReturn {
  currentStyle: MascotStyle;
  toggleStyle: () => void;
  setStyle: (style: MascotStyle) => void;
  getCompatibleProps: (props: Partial<MascotAssetEnhancedProps>) => Partial<MascotAssetEnhancedProps>;
}
```

---

## Variant Reference

### Dropout Style Variants

| Animal | Variants Available | Default |
|--------|-------------------|---------|
| Fox | - | - |
| Owl | - | - |
| Wolf | `midnight`, `silverback` | `midnight` |
| Hawk | - | - |
| Bear | `default`, `homecoming`, `graduation`, `late-registration`, `yeezus`, `donda` | `default` |
| Bunny | - | - |
| Cat | `tuxedo`, `onesie-only` | `tuxedo` |

### NJ Style Variants

All NJ style mascots except Owl and Hawk support the following variants:

| Variant | Description |
|---------|-------------|
| `classic-blue` | Default electric blue (#0000FF) |
| `attention` | Attention-themed styling |
| `hype-boy` | Hype Boy themed styling |
| `cookie` | Cookie-themed styling |
| `ditto` | Ditto-themed styling |

### NJ Variant Support by Animal

| Animal | NJ Variants Available |
|--------|----------------------|
| Fox | `classic-blue`, `attention`, `hype-boy`, `cookie`, `ditto` |
| Owl | - |
| Wolf | `classic-blue`, `attention`, `hype-boy`, `cookie`, `ditto` |
| Hawk | - |
| Bear | - |
| Bunny | `classic-blue`, `attention`, `hype-boy`, `cookie`, `ditto` |
| Cat | `classic-blue`, `attention`, `hype-boy`, `cookie`, `ditto` |

---

## Usage Examples

### Basic Mascot Display

```tsx
import { MascotAssetEnhanced } from '@/components/mascots';

// Simple usage with defaults
<MascotAssetEnhanced animal="fox" />

// Specific size
<MascotAssetEnhanced animal="bear" size={64} />

// Large size with animation
<MascotAssetEnhanced animal="wolf" size={512} animation="howl" />
```

### Style Toggle Integration

```tsx
import { MascotAssetEnhanced, useStyleSwitch } from '@/components/mascots';

function MascotDisplay() {
  const { currentStyle, toggleStyle } = useStyleSwitch('fox', 'dropout');
  
  return (
    <div>
      <MascotAssetEnhanced 
        animal="fox" 
        style={currentStyle}
        size={256}
        animation="wave"
      />
      <button onClick={toggleStyle}>
        Switch to {currentStyle === 'dropout' ? 'NJ' : 'Dropout'}
      </button>
    </div>
  );
}
```

### With Variants

```tsx
// Dropout style with variant
<MascotAssetEnhanced 
  mascot="bear" 
  style="dropout"
  variant="graduation"
  size={256}
  animate
  animation="celebrate"
/>

// NJ style with variant
<MascotAssetEnhanced 
  animal="bunny"
  style="nj"
  variant="attention"
  size={64}
  animation="wave"
/>
```

### Complete Toggle Component

```tsx
import { 
  MascotAssetEnhanced, 
  MascotStyleToggle,
  MascotStyleSelector 
} from '@/components/mascots';

function MascotPicker() {
  const [style, setStyle] = useState<MascotStyle>('dropout');
  const [animal, setAnimal] = useState<MascotAnimal>('fox');
  
  return (
    <div className="mascot-picker">
      <MascotStyleToggle 
        value={style}
        onChange={setStyle}
        persist={true}
      />
      
      <MascotStyleSelector
        value={style}
        onChange={setStyle}
        direction="horizontal"
      />
      
      <MascotAssetEnhanced 
        animal={animal}
        style={style}
        size={128}
        hoverable
      />
    </div>
  );
}
```

### Gallery Implementation

```tsx
import { MascotGallery } from '@/components/mascots';

function MascotBrowser() {
  const handleSelect = (animal: MascotAnimal, style: MascotStyle, variant?: string) => {
    console.log('Selected mascot:', { animal, style, variant });
  };
  
  return (
    <MascotGallery
      mode="by-style"
      showStyleToggle={true}
      showAnimalSelector={true}
      showVariantSelectors={true}
      onSelect={handleSelect}
    />
  );
}
```

### Direct Component Import (Tree-shaking)

```tsx
// For optimized bundles, import components directly
import { FoxDropout } from '@/components/mascots/generated/dropout/FoxDropout';
import { WolfNJ } from '@/components/mascots/generated/nj/WolfNJ';

<FoxDropout size={128} animation="wave" />
<WolfNJ size={256} variant="hype-boy" />
```

---

## Animation Guide

### Available Animations by Mascot

| Animal | Dropout Animations | NJ Animations |
|--------|-------------------|---------------|
| Fox | `idle`, `wave`, `celebrate`, `confident` | `idle`, `wave`, `celebrate` |
| Owl | `idle`, `thinking`, `reading` | `idle`, `thinking`, `reading` |
| Wolf | `idle`, `howl`, `prowl`, `celebrate` | `idle`, `howl`, `prowl` |
| Hawk | `idle`, `alert`, `swoop` | `idle`, `alert`, `scanning` |
| Bear | `idle`, `wave`, `celebrate`, `none` | `idle`, `wave`, `celebrate`, `none` |
| Bunny | `idle`, `wave`, `celebrate`, `none` | `idle`, `wave`, `celebrate`, `none` |
| Cat | `idle`, `mischief`, `peekaboo`, `celebrate` | `idle`, `mischief`, `peekaboo` |

### Animation Timing

| Animation | Duration | Easing | Description |
|-----------|----------|--------|-------------|
| `idle` | Continuous | ease-in-out | Subtle breathing or floating motion |
| `wave` | 800ms | cubic-bezier(0.4, 0, 0.2, 1) | Single wave gesture |
| `celebrate` | 1200ms | cubic-bezier(0.34, 1.56, 0.64, 1) | Jumping/party animation |
| `howl` | 2000ms | ease-in-out | Wolf howling at moon |
| `prowl` | 1500ms | linear | Stealthy walking motion |

### Animation States

```tsx
// Trigger animation on click
const [isAnimating, setIsAnimating] = useState(false);

<MascotAssetEnhanced
  animal="fox"
  animation={isAnimating ? 'celebrate' : 'idle'}
  onClick={() => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 1200);
  }}
/>
```

### Reduced Motion Support

All animations respect the user's `prefers-reduced-motion` preference:

```css
@media (prefers-reduced-motion: reduce) {
  .mascot-animation {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## Hooks

### useStyleSwitch

Hook for managing style switching with automatic persistence.

```typescript
function useStyleSwitch(
  initialAnimal: MascotAnimal,
  initialStyle?: MascotStyle
): UseStyleSwitchReturn;
```

#### Returns

| Property | Type | Description |
|----------|------|-------------|
| `currentStyle` | `MascotStyle` | Currently selected style |
| `toggleStyle` | `() => void` | Toggle between dropout/nj |
| `setStyle` | `(style: MascotStyle) => void` | Set specific style |
| `getCompatibleProps` | `(props) => Partial<MascotAssetEnhancedProps>` | Get props for counterpart style |

#### Usage

```tsx
import { useStyleSwitch } from '@/components/mascots';

function MyComponent() {
  const { 
    currentStyle, 
    toggleStyle, 
    setStyle,
    getCompatibleProps 
  } = useStyleSwitch('fox', 'dropout');
  
  // Get props for the opposite style
  const njProps = getCompatibleProps({ 
    animal: 'fox', 
    style: 'dropout',
    variant: 'graduation'
  });
  
  return (
    <div>
      <MascotAssetEnhanced animal="fox" style={currentStyle} />
      <button onClick={toggleStyle}>Toggle</button>
      <button onClick={() => setStyle('nj')}>Set NJ</button>
    </div>
  );
}
```

---

## Styling Guide

### CSS Custom Properties

The mascot system exposes CSS custom properties for theming:

```css
:root {
  /* Dropout style colors */
  --mascot-dropout-primary: #F48C06;
  --mascot-dropout-secondary: #6A040F;
  --mascot-dropout-accent: #FFD60A;
  
  /* NJ style colors */
  --mascot-nj-primary: #0000FF;
  --mascot-nj-secondary: #0066FF;
  --mascot-nj-accent: #00AAFF;
  
  /* Animation timing */
  --mascot-transition-duration: 300ms;
  --mascot-transition-easing: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Overriding Styles

```tsx
// Add custom class
<MascotAssetEnhanced 
  animal="fox" 
  className="custom-mascot"
/>
```

```css
.custom-mascot {
  /* Add drop shadow */
  filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
  
  /* Custom border */
  border: 3px solid var(--mascot-dropout-primary);
  border-radius: 50%;
  
  /* Custom transition */
  transition: transform 0.3s ease;
}

.custom-mascot:hover {
  transform: scale(1.1);
}
```

### Dark Mode Support

Components automatically adapt to dark mode:

```css
@media (prefers-color-scheme: dark) {
  .mascot-container {
    background: #1a1a1a;
  }
  
  /* NJ style is more visible in dark mode */
  [data-style="nj"] {
    filter: brightness(1.2);
  }
}
```

### Container Styling

```tsx
<div className="mascot-wrapper">
  <MascotAssetEnhanced animal="wolf" size={256} />
</div>
```

```css
.mascot-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
  border-radius: 1rem;
}
```

---

## Configuration Utilities

### Import from Config

```typescript
import {
  MASCOT_CONFIGS,
  MASCOT_STYLES,
  MASCOT_ANIMALS,
  STYLE_CONFIG,
  getMascotsByStyle,
  getMascotsByAnimal,
  getMascotById,
  getMascot,
  getAnimals,
  getStyles,
  generateImport,
  getDefaultVariant,
  hasVariants,
} from '@/components/mascots';
```

### Usage Examples

```typescript
// Get all mascot configurations
const allMascots = MASCOT_CONFIGS; // 14 configs

// Filter by style
const dropoutMascots = getMascotsByStyle('dropout'); // 7 configs
const njMascots = getMascotsByStyle('nj'); // 7 configs

// Filter by animal
const foxVariations = getMascotsByAnimal('fox'); // 2 configs (dropout + nj)

// Get specific mascot
const wolfNJ = getMascotById('wolf-nj');
const bearDropout = getMascot('bear', 'dropout');

// Get available options
const animals = getAnimals(); // ['fox', 'owl', 'wolf', ...]
const styles = getStyles(); // ['dropout', 'nj']

// Generate import statement
const importStatement = generateImport(wolfNJ);
// -> "import { WolfNJ } from '@/components/mascots/generated/nj/WolfNJ';"

// Check for variants
const hasVariant = hasVariants(wolfNJ); // true
const defaultVariant = getDefaultVariant(wolfNJ); // 'midnight'
```

### Style Switch Configuration

```typescript
import {
  STYLE_SWITCH_CONFIG,
  CROSS_STYLE_MAP,
  getCounterpartMascot,
  getCompatibleVariant,
  getCompatibleAnimation,
  canSwitchStyle,
  getCrossStyleAnimals,
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
// -> { animal: 'wolf', style: 'nj', config: {...} }

// Check if style switch is possible
const canSwitch = canSwitchStyle('wolf'); // true

// Get compatible variant for target style
const njVariant = getCompatibleVariant('midnight', 'nj'); // 'classic-blue'

// Get compatible animation
const njAnimation = getCompatibleAnimation('howl', 'nj'); // 'howl'
```

---

## Troubleshooting

### Common Issues

#### Issue: Mascot not displaying

**Symptoms**: Empty space or broken image icon where mascot should be

**Solutions**:
1. Check that `animal` prop is one of the valid values
2. Verify the component file exists in the generated folder
3. Check browser console for import errors
4. Ensure Suspense boundary is present (handled automatically by MascotAssetEnhanced)

```tsx
// Correct usage
<MascotAssetEnhanced animal="fox" />

// Incorrect - will show fallback
<MascotAssetEnhanced animal="invalid-animal" />
```

#### Issue: Animations not working

**Symptoms**: Mascot is static even with animation prop set

**Solutions**:
1. Check that the animation name is valid for the specific mascot
2. Verify CSS animations are loaded
3. Check if `prefers-reduced-motion` is enabled
4. Ensure animation CSS file is imported

```tsx
// Check supported animations
import { getAnimations } from '@/components/mascots';
const wolfAnimations = getAnimations('wolf', 'dropout');
// ['idle', 'howl', 'prowl', 'celebrate']
```

#### Issue: Style toggle not persisting

**Symptoms**: Style preference resets on page reload

**Solutions**:
1. Ensure `persist` prop is set to `true`
2. Check localStorage is not disabled/private browsing
3. Verify storage key is consistent

```tsx
<MascotStyleToggle
  value={style}
  onChange={setStyle}
  persist={true}
  storageKey="my-app-mascot-style"
/>
```

#### Issue: Variants not applying

**Symptoms**: Mascot appears with default appearance despite variant prop

**Solutions**:
1. Check variant exists for the specific mascot and style
2. Verify variant name spelling (case-sensitive)
3. Check if mascot component supports variants

```tsx
// Get available variants
import { getVariants } from '@/components/mascots';
const bearVariants = getVariants('bear', 'dropout');
// ['default', 'homecoming', 'graduation', ...]
```

#### Issue: TypeScript errors

**Symptoms**: Type errors when using mascot components

**Solutions**:
1. Ensure types are imported correctly
2. Check that props match the defined interfaces
3. Verify `MascotAnimal` and `MascotStyle` types are used correctly

```tsx
import type { MascotAnimal, MascotStyle } from '@/components/mascots';

const animal: MascotAnimal = 'fox'; // ✓ Valid
const animal: MascotAnimal = 'dog'; // ✗ Error - not a valid animal
```

### FAQ

**Q: Can I use multiple mascots on the same page?**

Yes, each mascot component is self-contained and can be used independently.

```tsx
<div>
  <MascotAssetEnhanced animal="fox" />
  <MascotAssetEnhanced animal="owl" />
  <MascotAssetEnhanced animal="wolf" />
</div>
```

**Q: How do I preload mascots for better performance?**

Import components directly to include them in the main bundle:

```tsx
import { FoxDropout, WolfNJ } from '@/components/mascots';

// Preload on mount
useEffect(() => {
  // Components are now in bundle
}, []);
```

**Q: Can I create custom animations?**

Yes, by passing a custom class and defining CSS animations:

```tsx
<MascotAssetEnhanced 
  animal="fox" 
  className="custom-bounce"
  animation="idle"
/>
```

```css
.custom-bounce {
  animation: customBounce 1s infinite;
}

@keyframes customBounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
```

**Q: How do I make mascots responsive?**

Use CSS to control size responsively:

```tsx
<MascotAssetEnhanced 
  animal="fox" 
  size={128}
  className="responsive-mascot"
/>
```

```css
.responsive-mascot {
  width: 100%;
  height: auto;
  max-width: 256px;
}

@media (max-width: 768px) {
  .responsive-mascot {
    max-width: 128px;
  }
}
```

**Q: Are mascots accessible?**

Yes, all mascots include:
- ARIA labels via `alt` prop
- Keyboard navigation support
- Screen reader announcements
- Reduced motion support
- WCAG compliant contrast ratios

---

## Browser Support

| Browser | Minimum Version |
|---------|-----------------|
| Chrome/Edge | 90+ |
| Firefox | 88+ |
| Safari | 14+ |
| iOS Safari | 14+ |
| Chrome Android | 90+ |

---

## Performance Notes

- Components use React.lazy() for code splitting
- SVGs are optimized and inline for instant rendering
- Animations use CSS transforms for GPU acceleration
- localStorage reads are cached
- Component props are memoized to prevent unnecessary re-renders

---

## Constants Reference

```typescript
import {
  ALL_MASCOT_ANIMALS,
  ALL_MASCOT_STYLES,
  TOTAL_MASCOT_COUNT,
  DEFAULT_MASCOT_SIZE,
  DEFAULT_MASCOT_ANIMATION,
  STYLE_PREFERENCE_KEY,
} from '@/components/mascots';

ALL_MASCOT_ANIMALS; // ['fox', 'owl', 'wolf', 'hawk', 'bear', 'bunny', 'cat']
ALL_MASCOT_STYLES; // ['dropout', 'nj']
TOTAL_MASCOT_COUNT; // 14
DEFAULT_MASCOT_SIZE; // 128
DEFAULT_MASCOT_ANIMATION; // 'idle'
STYLE_PREFERENCE_KEY; // 'sator-mascot-style-preference'
```

---

*Part of the Libre-X-eSport 4NJZ4 TENET Platform*
