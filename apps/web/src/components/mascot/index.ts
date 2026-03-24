/**
 * Hawk Mascot Components - Index
 * 
 * Export all Hawk mascot components for easy importing.
 * 
 * @example
 * import { HawkMascot, HawkMascotContainer, VictoryHawk } from '@/components/mascot';
 */

// Main Components
export { HawkMascot } from './HawkMascot';
export { HawkMascotContainer } from './HawkMascotContainer';

// Size variants
export {
  HawkMascotXS,
  HawkMascotSM,
  HawkMascotMD,
  HawkMascotLG,
  HawkMascotXL,
} from './HawkMascot';

// Animation variants
export {
  FloatingHawk,
  PulsingHawk,
  GlowingHawk,
  BouncingHawk,
} from './HawkMascot';

// Style variants
export {
  GoldHawk,
  IntenseHawk,
  TeamHawk,
  VictoryHawk,
} from './HawkMascot';

// Container layouts
export {
  VerticalHawkContainer,
  HorizontalHawkContainer,
  CenteredHawkContainer,
} from './HawkMascotContainer';

// Container presets
export {
  HawkVictoryBanner,
  HawkTeamBadge,
  HawkLoadingState,
  HawkEmptyState,
  HawkErrorState,
  HawkScoreDisplay,
  HawkNotification,
} from './HawkMascotContainer';

// Types
export type {
  HawkSize,
  HawkVariant,
  HawkAnimation,
  HawkMascotProps,
} from './HawkMascot';

export type {
  ContainerLayout,
  BadgeStyle,
  HawkMascotContainerProps,
  HawkScoreDisplayProps,
  HawkNotificationProps,
} from './HawkMascotContainer';

// Default export
export { HawkMascot as default } from './HawkMascot';
