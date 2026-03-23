/**
 * New Mascots Configuration
 * 
 * Comprehensive definitions for the new 14-mascot lineup
 * Includes detailed style configurations and cross-style mappings
 * 
 * [Ver004.000]
 */

import type { MascotAnimal, MascotStyle } from './config';

// ===== STYLE-SWITCHING CONFIGURATION =====

export interface StyleSwitchConfig {
  defaultStyle: MascotStyle;
  allowStyleSwitch: boolean;
  persistPreference: boolean;
  storageKey: string;
  transitionDuration: number;
  lazyLoadComponents: boolean;
}

export const STYLE_SWITCH_CONFIG: StyleSwitchConfig = {
  defaultStyle: 'dropout',
  allowStyleSwitch: true,
  persistPreference: true,
  storageKey: 'sator-mascot-style-preference',
  transitionDuration: 300,
  lazyLoadComponents: true,
};

// ===== CROSS-STYLE MAPPINGS =====

/**
 * Maps animals between styles for seamless switching
 */
export const CROSS_STYLE_MAP: Record<MascotAnimal, Record<MascotStyle, {
  componentName: string;
  importPath: string;
  defaultVariant?: string;
}>> = {
  fox: {
    dropout: {
      componentName: 'FoxDropout',
      importPath: '@/components/mascots/generated/dropout/FoxDropout',
      defaultVariant: undefined,
    },
    nj: {
      componentName: 'FoxNJ',
      importPath: '@/components/mascots/generated/nj/FoxNJ',
      defaultVariant: 'classic-blue',
    },
  },
  owl: {
    dropout: {
      componentName: 'OwlDropout',
      importPath: '@/components/mascots/generated/dropout/OwlDropout',
      defaultVariant: undefined,
    },
    nj: {
      componentName: 'OwlNJ',
      importPath: '@/components/mascots/generated/nj/OwlNJ',
      defaultVariant: undefined,
    },
  },
  wolf: {
    dropout: {
      componentName: 'WolfDropout',
      importPath: '@/components/mascots/generated/dropout/WolfDropout',
      defaultVariant: 'midnight',
    },
    nj: {
      componentName: 'WolfNJ',
      importPath: '@/components/mascots/generated/nj/WolfNJ',
      defaultVariant: 'classic-blue',
    },
  },
  hawk: {
    dropout: {
      componentName: 'HawkDropout',
      importPath: '@/components/mascots/generated/dropout/HawkDropout',
      defaultVariant: undefined,
    },
    nj: {
      componentName: 'HawkNJ',
      importPath: '@/components/mascots/generated/nj/HawkNJ',
      defaultVariant: undefined,
    },
  },
  bear: {
    dropout: {
      componentName: 'BearDropout',
      importPath: '@/components/mascots/dropout/BearDropout',
      defaultVariant: 'default',
    },
    nj: {
      componentName: 'BearNJ',
      importPath: '@/components/mascots/nj/BearNJ',
      defaultVariant: undefined,
    },
  },
  bunny: {
    dropout: {
      componentName: 'BunnyDropout',
      importPath: '@/components/mascots/dropout/BunnyDropout',
      defaultVariant: undefined,
    },
    nj: {
      componentName: 'BunnyNJ',
      importPath: '@/components/mascots/nj/BunnyNJ',
      defaultVariant: 'classic-blue',
    },
  },
  cat: {
    dropout: {
      componentName: 'CatDropout',
      importPath: '@/components/mascots/generated/dropout/CatDropout',
      defaultVariant: 'tuxedo',
    },
    nj: {
      componentName: 'CatNJ',
      importPath: '@/components/mascots/generated/nj/CatNJ',
      defaultVariant: 'classic-blue',
    },
  },
};

// ===== VARIANT COMPATIBILITY MAP =====

/**
 * Maps variants between styles when switching
 * If a variant doesn't exist in the target style, falls back to default
 */
export const VARIANT_COMPATIBILITY_MAP: Record<string, Record<MascotStyle, string | null>> = {
  // NJ variants that map to Dropout
  'classic-blue': { dropout: null, nj: 'classic-blue' },
  'attention': { dropout: null, nj: 'attention' },
  'hype-boy': { dropout: null, nj: 'hype-boy' },
  'cookie': { dropout: null, nj: 'cookie' },
  'ditto': { dropout: null, nj: 'ditto' },
  
  // Dropout variants that map to NJ
  'default': { dropout: 'default', nj: null },
  'homecoming': { dropout: 'homecoming', nj: null },
  'graduation': { dropout: 'graduation', nj: null },
  'late-registration': { dropout: 'late-registration', nj: null },
  'yeezus': { dropout: 'yeezus', nj: null },
  'donda': { dropout: 'donda', nj: null },
  'midnight': { dropout: 'midnight', nj: null },
  'silverback': { dropout: 'silverback', nj: null },
  'tuxedo': { dropout: 'tuxedo', nj: null },
  'onesie-only': { dropout: 'onesie-only', nj: null },
};

// ===== STYLE-SPECIFIC PROPS =====

export interface StyleSpecificProps {
  dropout: {
    animation?: 'idle' | 'wave' | 'celebrate' | 'confident' | 'thinking' | 'reading' | 'howl' | 'prowl' | 'mischief' | 'peekaboo' | 'none';
    hoverable?: boolean;
    showGlint?: boolean;
  };
  nj: {
    animation?: 'idle' | 'wave' | 'celebrate' | 'thinking' | 'reading' | 'howl' | 'prowl' | 'mischief' | 'peekaboo' | 'alert' | 'scanning';
    variant?: string;
    strokeColor?: string;
    hoverable?: boolean;
  };
}

// ===== LAZY LOADING CONFIGURATION =====

export const LAZY_LOAD_CONFIG = {
  // Components below this size threshold are eagerly loaded
  eagerLoadThreshold: 1024, // bytes
  
  // Loading fallback component
  loadingComponent: 'MascotLoadingPlaceholder',
  
  // Error fallback component
  errorComponent: 'MascotErrorPlaceholder',
  
  // Retry attempts for failed loads
  retryAttempts: 3,
  
  // Delay before showing loading state (prevents flash)
  loadingDelay: 200,
};

// ===== ANIMATION MAPPING =====

/**
 * Maps animation names between styles for consistency
 */
export const ANIMATION_MAP: Record<string, Record<MascotStyle, string | null>> = {
  'idle': { dropout: 'idle', nj: 'idle' },
  'wave': { dropout: 'wave', nj: 'wave' },
  'celebrate': { dropout: 'celebrate', nj: 'celebrate' },
  'confident': { dropout: 'confident', nj: 'idle' },
  'thinking': { dropout: 'thinking', nj: 'thinking' },
  'reading': { dropout: 'reading', nj: 'reading' },
  'howl': { dropout: 'howl', nj: 'howl' },
  'prowl': { dropout: 'prowl', nj: 'prowl' },
  'mischief': { dropout: 'mischief', nj: 'mischief' },
  'peekaboo': { dropout: 'peekaboo', nj: 'peekaboo' },
  'alert': { dropout: 'idle', nj: 'alert' },
  'scanning': { dropout: 'idle', nj: 'scanning' },
  'none': { dropout: 'none', nj: 'idle' },
};

// ===== UTILITY FUNCTIONS =====

/**
 * Get the counterpart mascot when switching styles
 */
export function getCounterpartMascot(
  animal: MascotAnimal,
  currentStyle: MascotStyle
): { animal: MascotAnimal; style: MascotStyle; config: typeof CROSS_STYLE_MAP[MascotAnimal][MascotStyle] } {
  const targetStyle = currentStyle === 'dropout' ? 'nj' : 'dropout';
  return {
    animal,
    style: targetStyle,
    config: CROSS_STYLE_MAP[animal][targetStyle],
  };
}

/**
 * Get compatible variant when switching styles
 */
export function getCompatibleVariant(
  variant: string,
  targetStyle: MascotStyle
): string | undefined {
  const mapping = VARIANT_COMPATIBILITY_MAP[variant];
  if (!mapping) return undefined;
  
  const compatibleVariant = mapping[targetStyle];
  return compatibleVariant === null ? undefined : compatibleVariant;
}

/**
 * Get compatible animation when switching styles
 */
export function getCompatibleAnimation(
  animation: string,
  targetStyle: MascotStyle
): string | undefined {
  const mapping = ANIMATION_MAP[animation];
  if (!mapping) return 'idle';
  
  return mapping[targetStyle] || 'idle';
}

/**
 * Check if style switching is available for an animal
 */
export function canSwitchStyle(animal: MascotAnimal): boolean {
  return !!(CROSS_STYLE_MAP[animal].dropout && CROSS_STYLE_MAP[animal].nj);
}

/**
 * Get all animals that support both styles
 */
export function getCrossStyleAnimals(): MascotAnimal[] {
  return (['fox', 'owl', 'wolf', 'hawk', 'bear', 'bunny', 'cat'] as MascotAnimal[])
    .filter(animal => canSwitchStyle(animal));
}

// ===== GALLERY CONFIGURATION =====

export const GALLERY_CONFIG = {
  // Group mascots by style in gallery
  groupByStyle: true,
  
  // Default view mode
  defaultViewMode: 'grid', // 'grid' | 'list'
  
  // Grid columns by breakpoint
  gridColumns: {
    mobile: 2,
    tablet: 3,
    desktop: 4,
    wide: 5,
  },
  
  // Show variant selectors
  showVariantSelectors: true,
  
  // Show animation preview
  showAnimationPreview: true,
  
  // Default preview size
  defaultPreviewSize: 128,
};

// ===== ACCESSIBILITY CONFIGURATION =====

export const ACCESSIBILITY_CONFIG = {
  // Announce style changes to screen readers
  announceStyleChanges: true,
  
  // Style change announcement template
  styleChangeAnnouncement: (animal: string, style: string) => 
    `Switched to ${style} style ${animal} mascot`,
  
  // Keyboard shortcuts
  keyboardShortcuts: {
    toggleStyle: 'KeyS',
    nextMascot: 'ArrowRight',
    previousMascot: 'ArrowLeft',
  },
  
  // Focus trap in gallery
  focusTrapInGallery: true,
};

export default {
  STYLE_SWITCH_CONFIG,
  CROSS_STYLE_MAP,
  VARIANT_COMPATIBILITY_MAP,
  LAZY_LOAD_CONFIG,
  ANIMATION_MAP,
  GALLERY_CONFIG,
  ACCESSIBILITY_CONFIG,
};
