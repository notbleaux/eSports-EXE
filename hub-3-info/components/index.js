/**
 * Hub 3 - Information Directory
 * Component Exports
 */

export { default as InformationHub } from './InformationHub';
export { default as RadialMenu } from './RadialMenu';
export { default as TierComparison } from './TierComparison';
export { default as RadiatingSearch } from './RadiatingSearch';
export { default as AISuggestions } from './AISuggestions';
export { default as ConicalDirectory } from './ConicalDirectory';

// Data exports
export { GAME_CATEGORIES, getTotalTeams } from '../data/categories';
export { TIER_COMPARISON } from '../data/tiers';
export { TEAMS_DATA, generateTeamsList } from '../data/teams';
export { AI_SUGGESTIONS, getSuggestionsByRole } from '../data/ai-suggestions';

// Hook exports
export {
  useMousePosition,
  useScrollPosition,
  useIntersectionObserver,
  useAnimatedCounter,
  useLocalStorage,
  useDebounce,
  useWindowSize,
  useHover,
  useToggle,
  usePrevious,
  useAnimationFrame,
  useReducedMotion,
  useKeyPress,
  useClickOutside
} from '../hooks';

// Utility exports
export {
  formatNumber,
  formatCurrency,
  debounce,
  throttle,
  generateId,
  deepClone,
  getRadialPosition,
  describeArc,
  polarToCartesian,
  describePieSlice,
  filterItems,
  groupBy,
  sortBy,
  clamp,
  lerp,
  mapRange,
  isInViewport,
  getCSSVariable,
  setCSSVariable,
  animateNumber,
  parseQueryString,
  buildQueryString
} from '../utils/helpers';