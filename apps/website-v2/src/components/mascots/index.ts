/** [Ver004.000]
 * Mascot Components Index
 * =======================
 * Export all mascot character showcase components.
 * 
 * Includes: MascotAssetEnhanced (INT-002), Generated Mascots (INT-001)
 * New Mascots: Dropout Bear, NJ Bunny (v2.0)
 */

// Enhanced Mascot Asset (INT-002)
export { MascotAsset as MascotAssetEnhanced } from './MascotAssetEnhanced';
export { default as MascotAssetEnhancedDefault } from './MascotAssetEnhanced';
export type { 
  MascotType, 
  MascotVariant,
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

// Dropout Bear Mascot (v2.0) - INT-004
export { DropoutBearMascot } from './generated/DropoutBearMascot';
export { default as DropoutBearMascotDefault } from './generated/DropoutBearMascot';
export type {
  DropoutBearSize,
  DropoutBearVariant,
  DropoutBearAnimation,
  DropoutBearMascotProps,
  DropoutBearVariantColors,
} from './generated/DropoutBearMascot';
export { DropoutBearVariantColors } from './generated/DropoutBearMascot';

// NJ Bunny Mascot (v2.0) - INT-005  
export { 
  NJBunnyMascot,
  NJBunnySVG,
  NJBunnyCSS,
} from './generated/NJBunnyMascot';
export { default as NJBunnyMascotDefault } from './generated/NJBunnyMascot';
export { default as NJBunnySVG32 } from './generated/NJBunnySVG32';
export { default as NJBunnySVG64 } from './generated/NJBunnySVG64';
export { default as NJBunnySVG128 } from './generated/NJBunnySVG128';
export { default as NJBunnySVG256 } from './generated/NJBunnySVG256';
export { default as NJBunnySVG512 } from './generated/NJBunnySVG512';
export type {
  NJBunnySize,
  NJBunnyVariant,
  NJBunnyAnimation,
  NJBunnyMascotProps,
} from './generated/NJBunnyMascot';

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

// New Mascot Configuration Constants (v2.0)
// These will be available once the generated components are created
export const NEW_MASCOT_CONFIG = {
  bear: {
    id: 'bear',
    displayName: 'Dropout Bear',
    variants: ['homecoming', 'graduation', 'late-registration', 'yeezus', 'donda'] as const,
    defaultColor: '#8B4513',
  },
  bunny: {
    id: 'bunny',
    displayName: 'NJ Bunny',
    variants: ['classic-blue', 'attention', 'hype-boy', 'cookie', 'ditto'] as const,
    defaultColor: '#0000FF',
  },
};

// Helper function to check if a mascot supports variants
export const supportsVariants = (mascotType: string): boolean => {
  return ['dropout-bear', 'nj-bunny'].includes(mascotType);
};

// Helper function to get available variants for a mascot
export const getMascotVariants = (mascotType: string): string[] => {
  if (mascotType === 'dropout-bear') return [...NEW_MASCOT_CONFIG.bear.variants];
  if (mascotType === 'nj-bunny') return [...NEW_MASCOT_CONFIG.bunny.variants];
  return ['default'];
};

// Default exports
export { default } from './MascotGallery';
