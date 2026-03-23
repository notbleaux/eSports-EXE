/** [Ver003.000]
 * Mascot Components Index
 * =======================
 * Export all mascot character showcase components.
 * 
 * Includes: MascotAssetEnhanced (INT-002), Generated Mascots (INT-001)
 */

// Enhanced Mascot Asset (INT-002)
export { MascotAsset as MascotAssetEnhanced } from './MascotAssetEnhanced';
export { default as MascotAssetEnhancedDefault } from './MascotAssetEnhanced';
export type { 
  MascotType, 
  AssetFormat,
  LoadingState,
  MascotAssetProps 
} from './MascotAssetEnhanced';

// Generated Mascot Components (INT-001)
export { FoxMascotSVG } from './generated/FoxMascotSVG';
export { FoxCSS } from './generated/FoxCSS';
export { OwlMascotSVG } from './generated/OwlMascotSVG';
export { OwlCSS } from './generated/OwlCSS';
export { WolfMascotSVG } from './generated/WolfMascotSVG';
export { WolfCSS } from './generated/WolfCSS';
export { HawkMascotSVG } from './generated/HawkMascotSVG';
export { HawkCSS } from './generated/HawkCSS';

// Lazy Loading Wrapper with Error Boundary
export { MascotAssetLazy, withLazyMascot } from './MascotAssetLazy';
export { default as MascotAssetLazyDefault } from './MascotAssetLazy';
export type { 
  LazyMascotAssetProps 
} from './MascotAssetLazy';

// Types
export type {
  Mascot,
  MascotId,
  MascotElement,
  MascotRarity,
  MascotState,
  MascotStats,
  MascotAbility,
  MascotLore,
  MascotFilterState,
  MascotSortOption,
  MascotSortDirection,
  GalleryViewMode,
  GalleryCardSize,
  GalleryConfig,
  MascotCardProps,
  MascotGalleryProps,
  CharacterBibleProps,
  RadarChartData,
  RadarChartProps,
  MascotAnimationConfig,
  RarityConfig,
  ElementConfig,
  VirtualMascotItem,
} from './types';

// Components
export { MascotCard } from './MascotCard';
export { MascotGallery } from './MascotGallery';
export { CharacterBible } from './CharacterBible';
export { MascotStatsRadar } from './MascotStatsRadar';

// Wolf Mascot Components (GEN-003)
export { WolfMascot } from './WolfMascot';
export { WolfMascotAnimated } from './WolfMascotAnimated';
export type { WolfSize, WolfAnimation, WolfVariant } from './WolfMascot';
// Note: WolfMascotAnimated props are inline in the component

// Hooks
export { useMascotFilter } from './hooks/useMascotFilter';
export { useMascotAnimation } from './hooks/useMascotAnimation';

// Mocks & Data
export {
  MOCK_MASCOTS,
  RARITY_CONFIG,
  ELEMENT_CONFIG,
  getMascotById,
  getMascotsByElement,
  getMascotsByRarity,
  getRelatedMascots,
  getRarityStars,
  getTotalPower,
  getHighestStat,
} from './mocks/mascots';

// Default exports
export { default } from './MascotGallery';
