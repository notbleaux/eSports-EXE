/** [Ver001.000]
 * Mascot Types
 * ============
 * Type definitions for the Mascot Character Showcase system.
 * 
 * Based on character bible content from TL-H1 1-A, 1-B, 1-C.
 * Aligned with Godot 4 mascot entities from TL-H1 1-D.
 */

// ============================================================================
// Core Mascot Types
// ============================================================================

export type MascotId = 'sol' | 'lun' | 'bin' | 'fat' | 'uni';

export type MascotElement = 'solar' | 'lunar' | 'binary' | 'fire' | 'magic';

export type MascotRarity = 'common' | 'rare' | 'epic' | 'legendary';

export type MascotState = 'idle' | 'cheer' | 'react' | 'celebrate' | 'sad';

// ============================================================================
// Stats Interface
// ============================================================================

export interface MascotStats {
  agility: number;      // 0-100
  power: number;        // 0-100
  wisdom: number;       // 0-100
  defense: number;      // 0-100
  speed: number;        // 0-100
  luck: number;         // 0-100
}

// ============================================================================
// Ability Interface
// ============================================================================

export interface MascotAbility {
  id: string;
  name: string;
  description: string;
  element: MascotElement;
  cooldown: number;     // in seconds
  power: number;        // 0-100
  unlockLevel: number;  // 0 = unlocked by default
}

// ============================================================================
// Lore/Backstory Interface
// ============================================================================

export interface MascotLore {
  origin: string;
  backstory: string;
  personality: string;
  quote: string;
  habitat: string;
}

// ============================================================================
// Main Mascot Interface
// ============================================================================

export interface Mascot {
  id: MascotId;
  name: string;
  displayName: string;
  element: MascotElement;
  rarity: MascotRarity;
  stats: MascotStats;
  abilities: MascotAbility[];
  lore: MascotLore;
  avatarUrl?: string;
  spriteUrl?: string;
  color: string;        // Primary theme color
  glowColor: string;    // Glow/accent color
  relatedMascots: MascotId[];
  unlockRequirements?: string;
  releaseDate: string;  // ISO date
}

// ============================================================================
// Filter & Sort Types
// ============================================================================

export type MascotSortOption = 'name' | 'rarity' | 'power' | 'element' | 'releaseDate';

export type MascotSortDirection = 'asc' | 'desc';

export interface MascotFilterState {
  searchQuery: string;
  elements: MascotElement[];
  rarities: MascotRarity[];
  sortBy: MascotSortOption;
  sortDirection: MascotSortDirection;
  favoritesOnly: boolean;
}

// ============================================================================
// Gallery View Types
// ============================================================================

export type GalleryViewMode = 'grid' | 'list';

export type GalleryCardSize = 'sm' | 'md' | 'lg';

export interface GalleryConfig {
  viewMode: GalleryViewMode;
  cardSize: GalleryCardSize;
  columns: {
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  showDetails: boolean;
  animateEntrance: boolean;
}

// ============================================================================
// Card Component Props
// ============================================================================

export interface MascotCardProps {
  mascot: Mascot;
  size?: GalleryCardSize;
  isSelected?: boolean;
  isFavorite?: boolean;
  isLocked?: boolean;
  showStats?: boolean;
  showRarity?: boolean;
  animated?: boolean;
  onClick?: (mascot: Mascot) => void;
  onFavoriteToggle?: (mascot: Mascot) => void;
  className?: string;
}

// ============================================================================
// Gallery Component Props
// ============================================================================

export interface MascotGalleryProps {
  mascots: Mascot[];
  favorites?: MascotId[];
  config?: Partial<GalleryConfig>;
  filter?: Partial<MascotFilterState>;
  onMascotSelect?: (mascot: Mascot) => void;
  onMascotFavorite?: (mascot: Mascot) => void;
  className?: string;
  loading?: boolean;
  emptyStateMessage?: string;
}

// ============================================================================
// Character Bible Props
// ============================================================================

export interface CharacterBibleProps {
  mascot: Mascot | null;
  isOpen: boolean;
  onClose: () => void;
  relatedMascots?: Mascot[];
  onRelatedMascotClick?: (mascot: Mascot) => void;
  className?: string;
}

// ============================================================================
// Radar Chart Types
// ============================================================================

export interface RadarChartData {
  subject: string;
  A: number;
  fullMark: number;
}

export interface RadarChartProps {
  data: RadarChartData[];
  color?: string;
  size?: number;
  animated?: boolean;
}

// ============================================================================
// Animation State Types
// ============================================================================

export interface MascotAnimationConfig {
  entranceDuration: number;
  hoverDuration: number;
  transitionDuration: number;
  staggerDelay: number;
  springStiffness: number;
  springDamping: number;
}

// ============================================================================
// Rarity Configuration
// ============================================================================

export interface RarityConfig {
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowIntensity: 'none' | 'subtle' | 'medium' | 'strong';
  starCount: number;
}

// ============================================================================
// Element Configuration
// ============================================================================

export interface ElementConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
  description: string;
}

// ============================================================================
// Virtual Scrolling Types
// ============================================================================

export interface VirtualMascotItem {
  index: number;
  mascot: Mascot;
  style: React.CSSProperties;
}
