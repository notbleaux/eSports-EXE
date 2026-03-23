/**
 * Mascot Components Index
 * 
 * Central export hub for all mascot-related components and utilities
 * Supports the 14-mascot lineup (7 animals × 2 styles)
 * 
 * [Ver004.000]
 */

// ===== CORE COMPONENTS =====

export { MascotAssetEnhanced } from './MascotAssetEnhanced';
export type { 
  MascotAssetEnhancedProps,
  MascotAnimal,
  MascotStyle,
  MascotSize,
  MascotAnimation,
  UseStyleSwitchReturn,
} from './MascotAssetEnhanced';
export { useStyleSwitch } from './MascotAssetEnhanced';

// ===== STYLE TOGGLE COMPONENTS =====

export { 
  MascotStyleToggle,
  MascotStyleToggleCompact,
  MascotStyleDisplay,
} from './MascotStyleToggle';
export type { 
  MascotStyleToggleProps,
  MascotStyleToggleCompactProps,
  MascotStyleDisplayProps,
} from './MascotStyleToggle';

// ===== STYLE SELECTOR COMPONENTS =====

export { 
  MascotStyleSelector,
  StyleBadge,
} from './MascotStyleSelector';
export type { 
  MascotStyleSelectorProps,
  StyleBadgeProps,
} from './MascotStyleSelector';

// ===== GALLERY COMPONENT =====

export { MascotGallery } from './MascotGallery';
export type { MascotGalleryProps } from './MascotGallery';

// ===== GENERATED COMPONENTS - DROPOUT STYLE =====

export { FoxDropout, DropoutFox } from './generated/dropout/FoxDropout';
export type { FoxDropoutProps, FoxDropoutSize, FoxDropoutAnimation } from './generated/dropout/FoxDropout';

export { OwlDropout, OwlDropoutInline } from './generated/dropout/OwlDropout';
export type { OwlDropoutProps } from './generated/dropout/OwlDropout';

export { WolfDropout, DropoutWolf } from './generated/dropout/WolfDropout';
export type { WolfDropoutProps, WolfDropoutSize, WolfDropoutAnimation, WolfDropoutVariant } from './generated/dropout/WolfDropout';

export { HawkDropout, DropoutHawk } from './generated/dropout/HawkDropout';
export type { HawkDropoutProps, HawkDropoutSize, HawkDropoutAnimation } from './generated/dropout/HawkDropout';

export { CatDropout, DropoutCat, CatInOnesie } from './generated/dropout/CatDropout';
export type { CatDropoutProps, CatDropoutSize, CatDropoutAnimation, CatDropoutVariant } from './generated/dropout/CatDropout';

// ===== GENERATED COMPONENTS - NJ STYLE =====

export { FoxNJ, NJFox } from './generated/nj/FoxNJ';
export type { FoxNJProps, FoxNJSize, FoxNJAnimation, FoxNJVariant } from './generated/nj/FoxNJ';

export { OwlNJ, OwlNJInline } from './generated/nj/OwlNJ';
export type { OwlNJProps } from './generated/nj/OwlNJ';

export { WolfNJ, NJWolf } from './generated/nj/WolfNJ';
export type { WolfNJProps, WolfNJSize, WolfNJAnimation, WolfNJVariant } from './generated/nj/WolfNJ';

export { HawkNJ, NJHawk, HawkNJ32, HawkNJ64, HawkNJ128, HawkNJ256, HawkNJ512 } from './generated/nj/HawkNJ';
export type { HawkNJProps, HawkSize, HawkState } from './generated/nj/HawkNJ';

export { CatNJ, NJCat, CatInOnesieNJ } from './generated/nj/CatNJ';
export type { CatNJProps, CatNJSize, CatNJAnimation, CatNJVariant } from './generated/nj/CatNJ';

// ===== LEGACY COMPONENTS - DROPOUT STYLE =====

export { BearDropout } from './dropout/BearDropout';
export type { BearDropoutProps, BearVariant, BearSize, BearAnimation } from './dropout/BearDropout';

export { BunnyDropout } from './dropout/BunnyDropout';
export type { BunnyDropoutProps, BunnyDropoutSize, BunnyDropoutAnimation } from './dropout/BunnyDropout';

// ===== LEGACY COMPONENTS - NJ STYLE =====

export { BearNJ } from './nj/BearNJ';
export type { BearNJProps, BearNJSize, BearNJAnimation } from './nj/BearNJ';

export { BunnyNJ } from './nj/BunnyNJ';
export type { BunnyNJProps, BunnyVariant, BunnySize, BunnyAnimation } from './nj/BunnyNJ';

// ===== CONFIGURATION EXPORTS =====

export {
  MASCOT_STYLES,
  MASCOT_ANIMALS,
  MASCOT_CONFIGS,
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
} from '../../../scripts/mascot-generator/config';
export type { 
  MascotConfig 
} from '../../../scripts/mascot-generator/config';

export {
  STYLE_SWITCH_CONFIG,
  CROSS_STYLE_MAP,
  VARIANT_COMPATIBILITY_MAP,
  LAZY_LOAD_CONFIG,
  ANIMATION_MAP,
  GALLERY_CONFIG,
  ACCESSIBILITY_CONFIG,
  getCounterpartMascot,
  getCompatibleVariant,
  getCompatibleAnimation,
  canSwitchStyle,
  getCrossStyleAnimals,
} from '../../../scripts/mascot-generator/config-new-mascots';
export type { 
  StyleSwitchConfig,
  StyleSpecificProps,
} from '../../../scripts/mascot-generator/config-new-mascots';

// ===== UTILITY CONSTANTS =====

/** All available mascot animals */
export const ALL_MASCOT_ANIMALS: MascotAnimal[] = ['fox', 'owl', 'wolf', 'hawk', 'bear', 'bunny', 'cat'];

/** All available mascot styles */
export const ALL_MASCOT_STYLES: MascotStyle[] = ['dropout', 'nj'];

/** Total number of mascot variations (7 animals × 2 styles) */
export const TOTAL_MASCOT_COUNT = 14;

/** Default mascot size */
export const DEFAULT_MASCOT_SIZE: MascotSize = 128;

/** Default mascot animation */
export const DEFAULT_MASCOT_ANIMATION: MascotAnimation = 'idle';

/** Storage key for style preference */
export const STYLE_PREFERENCE_KEY = 'sator-mascot-style-preference';

// ===== HELPER FUNCTIONS =====

/**
 * Get display name for an animal
 */
export function getAnimalDisplayName(animal: MascotAnimal): string {
  const names: Record<MascotAnimal, string> = {
    fox: 'Fox',
    owl: 'Owl',
    wolf: 'Wolf',
    hawk: 'Hawk',
    bear: 'Bear',
    bunny: 'Bunny',
    cat: 'Cat',
  };
  return names[animal];
}

/**
 * Get display name for a style
 */
export function getStyleDisplayName(style: MascotStyle): string {
  return style === 'dropout' ? 'Dropout' : 'NJ';
}

/**
 * Get emoji for an animal
 */
export function getAnimalEmoji(animal: MascotAnimal): string {
  const emojis: Record<MascotAnimal, string> = {
    fox: '🦊',
    owl: '🦉',
    wolf: '🐺',
    hawk: '🦅',
    bear: '🐻',
    bunny: '🐰',
    cat: '🐱',
  };
  return emojis[animal];
}

/**
 * Check if a mascot variant exists
 */
export function hasVariant(animal: MascotAnimal, style: MascotStyle, variant: string): boolean {
  const config = MASCOT_CONFIGS.find(c => c.animal === animal && c.style === style);
  return config?.variants?.includes(variant) ?? false;
}

/**
 * Get all variants for a mascot
 */
export function getVariants(animal: MascotAnimal, style: MascotStyle): string[] | undefined {
  const config = MASCOT_CONFIGS.find(c => c.animal === animal && c.style === style);
  return config?.variants;
}

/**
 * Get animations for a mascot
 */
export function getAnimations(animal: MascotAnimal, style: MascotStyle): string[] {
  const config = MASCOT_CONFIGS.find(c => c.animal === animal && c.style === style);
  return config?.animations ?? ['idle'];
}

// ===== RE-EXPORT TYPES =====

export type { 
  MascotConfig as MascotConfiguration,
};

// ===== DEFAULT EXPORT =====

export { MascotAssetEnhanced as default } from './MascotAssetEnhanced';
