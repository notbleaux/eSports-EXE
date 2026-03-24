/**
 * Mascot Components - Optimized Exports
 * 
 * Tree-shaking friendly exports with lazy loading support.
 * 
 * [Ver002.000] - REF-004 Bundle Optimization
 */

// ============================================================================
// Core Components - Always loaded (lightweight)
// ============================================================================

export { MascotAsset } from './MascotAsset';
export { MascotAssetEnhanced, MascotAssetEnhanced as MascotAssetEnhancedDefault } from './MascotAssetEnhanced';
export { MascotSkeleton, MascotSkeletonCompact } from './MascotSkeleton';

// ============================================================================
// Lazy Loading Components - Use for code splitting
// ============================================================================

export { MascotAssetLazy } from './MascotAssetLazy';
export { 
  MascotAssetLazyLoaded, 
  preloadMascot, 
  preloadMascots 
} from './MascotAssetLazyLoaded';

// ============================================================================
// Utility Components
// ============================================================================

export { MascotCard } from './MascotCard';
export { MascotGallery } from './MascotGallery';
export { MascotStatsRadar } from './MascotStatsRadar';
export { CharacterBible } from './CharacterBible';

// ============================================================================
// Legacy Mascots - Direct exports (use sparingly)
// ============================================================================

export { WolfMascot } from './WolfMascot';
export { WolfMascotAnimated } from './WolfMascotAnimated';

// ============================================================================
// Types
// ============================================================================

export type { 
  MascotType, 
  AssetFormat, 
  LoadingState, 
  MascotAssetProps 
} from './MascotAssetEnhanced';

export type { 
  LazyLoadedMascotProps,
  MascotStyle,
  MascotSize
} from './MascotAssetLazyLoaded';

// ============================================================================
// Lazy-Loaded Generated Components (for dynamic imports)
// ============================================================================

// These should be imported dynamically to enable code splitting:
// 
// Dropout style:
//   const { WolfDropout } = await import('./generated/dropout/WolfDropout');
//
// NJ style:
//   const { WolfNJ } = await import('./generated/nj/WolfNJ');
//   const { BunnyNJ } = await import('./generated/nj/BunnyNJ');
//
// Default mascots:
//   const { FoxMascotSVG } = await import('./generated/FoxMascotSVG');
//   const { OwlMascotSVG } = await import('./generated/OwlMascotSVG');

// ============================================================================
// Bundle Optimization Notes
// ============================================================================

/**
 * RECOMMENDED USAGE PATTERNS:
 * 
 * 1. For most use cases (lazy loaded):
 *    import { MascotAssetLazyLoaded } from '@/components/mascots';
 *    
 *    <MascotAssetLazyLoaded mascot="fox" size={128} />
 * 
 * 2. For immediate display (preloaded):
 *    import { MascotAssetLazyLoaded, preloadMascot } from '@/components/mascots';
 *    
 *    useEffect(() => {
 *      preloadMascot('fox', 'default', 128);
 *    }, []);
 *    
 *    <MascotAssetLazyLoaded mascot="fox" size={128} />
 * 
 * 3. For critical path (eager loaded):
 *    import { MascotAssetEnhanced } from '@/components/mascots';
 *    
 *    <MascotAssetEnhanced mascot="fox" size={128} />
 * 
 * 4. For style-specific mascots:
 *    import { MascotAssetLazyLoaded } from '@/components/mascots';
 *    
 *    <MascotAssetLazyLoaded mascot="wolf" style="dropout" size={256} />
 *    <MascotAssetLazyLoaded mascot="bunny" style="nj" size={128} />
 * 
 * BUNDLE IMPACT:
 * - mascot-base (eager): ~15KB
 * - mascot-dropout (lazy): ~45KB  
 * - mascot-nj (lazy): ~55KB
 * - mascot-default (lazy): ~120KB
 * - mascot-svgs (lazy): ~80KB
 */
