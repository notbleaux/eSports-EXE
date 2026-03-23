/** [Ver002.000]
 * Heroes Components Index
 * =======================
 * Barrel exports for hero-related components.
 * 
 * Includes: INT-001 - Mascot Integration with format support
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
 * import type { HeroProps, HeroMascotProps, MascotFormat } from '@/components/heroes';
 * 
 * // Use with format prop
 * <HeroMascot mascot="fox" size={128} format="auto" animate />
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
  HeroProps,
  HeroCta,
  HeroBackground,
  HeroSectionProps,
  SectionBackground,
} from './types';

// Export extended types from HeroMascot component (INT-001)
export type {
  HeroMascotProps,
  MascotType,
  MascotAnimation,
  MascotPosition,
  MascotFormat,
  MascotSize,
} from './HeroMascot';

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
