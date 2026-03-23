/** [Ver001.000]
 * Mascot Components Index
 * =======================
 * Export all mascot character showcase components.
 */

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
