/** [Ver001.000]
 * Heroes Components Index
 * =======================
 * Barrel exports for hero-related components.
 * 
 * @example
 * ```tsx
 * // Import individual components
 * import { Hero, HeroMascot, HeroSection } from '@/components/heroes';
 * 
 * // Import specific mascot variants
 * import { FoxHeroMascot, OwlHeroMascot } from '@/components/heroes';
 * 
 * // Import types
 * import type { HeroProps, HeroMascotProps } from '@/components/heroes';
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
  HeroProps,
  HeroCta,
  HeroBackground,
  HeroMascotProps,
  HeroSectionProps,
  MascotType,
  MascotAnimation,
  MascotPosition,
  MascotSize,
  SectionBackground,
} from './types';

// ============================================================================
// Components
// ============================================================================

export { Hero, HubHero } from './Hero';
export { 
  HeroMascot, 
  FoxHeroMascot, 
  OwlHeroMascot, 
  WolfHeroMascot, 
  HawkHeroMascot 
} from './HeroMascot';
export { 
  HeroSection, 
  FullHeightHero, 
  LandingHero 
} from './HeroSection';

// ============================================================================
// Default Exports
// ============================================================================

export { default } from './Hero';
