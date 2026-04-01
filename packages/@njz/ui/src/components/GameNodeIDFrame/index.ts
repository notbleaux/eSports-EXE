/**
 * GameNodeIDFrame Component - Public API
 * 
 * @package @njz/ui
 * @see SPEC-TD-P3-001 for full specification
 */

// Main component
export { GameNodeIDFrame } from './GameNodeIDFrame';

// Sub-components
export { QuarterCard } from './QuarterCard';

// Icons
export {
  AnalyticsIcon,
  CommunityIcon,
  TrophyIcon,
  ChartIcon,
  QUARTER_ICONS,
} from './icons';

// Utilities
export { mergeQuarters, prefersReducedMotion, getAnimationDuration } from './utils';

// Constants
export { DEFAULT_QUARTERS, QUARTER_ORDER, ANIMATION, A11Y } from './constants';

// Types
export type {
  GameNodeIDFrameProps,
  Quarter,
  QuarterId,
  QuarterColor,
  QuarterStats,
  QuarterCardProps,
} from './types';
