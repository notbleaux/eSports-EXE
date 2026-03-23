/**
 * Generated Mascot Components Index
 * 
 * Exported mascot components for the 4NJZ4 TENET Platform.
 * These are AI-generated mascot components following the style guide.
 * 
 * Includes all 14 mascots: 7 animals × 2 styles
 * - Dropout Style: Full-color cartoon with rich gradients
 * - NJ Style: Minimalist line art with electric blue strokes
 * 
 * [Ver004.000]
 */

// ===== DROPOUT STYLE MASCOTS =====

// Dropout Style Fox
export { FoxDropout, DropoutFox } from './dropout/FoxDropout';
export type { FoxDropoutProps, FoxDropoutSize, FoxDropoutAnimation } from './dropout/FoxDropout';

// Dropout Style Owl
export { OwlDropout, OwlDropoutInline } from './dropout/OwlDropout';
export type { OwlDropoutProps } from './dropout/OwlDropout';

// Dropout Style Wolf (NEW)
export { WolfDropout, DropoutWolf } from './dropout/WolfDropout';
export type { WolfDropoutProps, WolfDropoutSize, WolfDropoutAnimation, WolfDropoutVariant } from './dropout/WolfDropout';

// Dropout Style Hawk
export { HawkDropout, DropoutHawk } from './dropout/HawkDropout';
export type { HawkDropoutProps, HawkDropoutSize, HawkDropoutAnimation } from './dropout/HawkDropout';

// Dropout Style Cat in Bunny Onesie (Special 7th Mascot)
export { CatDropout, DropoutCat, CatInOnesie } from './dropout/CatDropout';
export type { CatDropoutProps, CatDropoutSize, CatDropoutAnimation, CatDropoutVariant } from './dropout/CatDropout';

// ===== NJ STYLE MASCOTS =====

// NJ Style Fox
export { FoxNJ, NJFox } from './nj/FoxNJ';
export type { FoxNJProps, FoxNJSize, FoxNJAnimation, FoxNJVariant } from './nj/FoxNJ';

// NJ Style Owl
export { OwlNJ, OwlNJInline } from './nj/OwlNJ';
export type { OwlNJProps } from './nj/OwlNJ';

// NJ Style Wolf (NEW)
export { WolfNJ, NJWolf } from './nj/WolfNJ';
export type { WolfNJProps, WolfNJSize, WolfNJAnimation, WolfNJVariant } from './nj/WolfNJ';

// NJ Style Hawk
export { HawkNJ, NJHawk } from './nj/HawkNJ';
export type { HawkNJProps, HawkNJSize, HawkNJAnimation, HawkNJVariant } from './nj/HawkNJ';

// NJ Style Cat in Bunny Onesie (Special 7th Mascot)
export { CatNJ, NJCat, CatInOnesieNJ } from './nj/CatNJ';
export type { CatNJProps, CatNJSize, CatNJAnimation, CatNJVariant } from './nj/CatNJ';

// ===== CONVENIENCE EXPORTS =====

/** All Dropout style component names (for dynamic imports) */
export const DROPOUT_COMPONENTS = [
  'FoxDropout',
  'OwlDropout',
  'WolfDropout',
  'HawkDropout',
  'CatDropout',
] as const;

/** All NJ style component names (for dynamic imports) */
export const NJ_COMPONENTS = [
  'FoxNJ',
  'OwlNJ',
  'WolfNJ',
  'HawkNJ',
  'CatNJ',
] as const;

/** All generated component names */
export const ALL_GENERATED_COMPONENTS = [
  ...DROPOUT_COMPONENTS,
  ...NJ_COMPONENTS,
] as const;

/** Map of animal to component names by style */
export const ANIMAL_COMPONENT_MAP = {
  fox: { dropout: 'FoxDropout', nj: 'FoxNJ' },
  owl: { dropout: 'OwlDropout', nj: 'OwlNJ' },
  wolf: { dropout: 'WolfDropout', nj: 'WolfNJ' },
  hawk: { dropout: 'HawkDropout', nj: 'HawkNJ' },
  cat: { dropout: 'CatDropout', nj: 'CatNJ' },
} as const;

export type MascotAnimal = keyof typeof ANIMAL_COMPONENT_MAP;
export type MascotStyle = 'dropout' | 'nj';
