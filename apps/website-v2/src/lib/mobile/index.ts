[Ver001.000]

/**
 * Mobile Library Index
 * 
 * Centralized exports for mobile-first responsive utilities.
 * 
 * @module lib/mobile
 */

// Breakpoint system
export {
  BREAKPOINTS,
  DEFAULT_BREAKPOINT_STATE,
  getBreakpointFromWidth,
  isAtLeastBreakpoint,
  isBetweenBreakpoints,
  getBreakpointMediaQuery,
  useBreakpoint,
  useBreakpointMatch,
  useResponsiveValue,
  useResponsiveStyles,
} from './breakpoints';

export type {
  BreakpointName,
  BreakpointValue,
  BreakpointState,
  UseBreakpointOptions,
  ResponsiveValueConfig,
  ResponsiveStyleConfig,
  ResponsiveStyleValue,
} from './breakpoints';

// Viewport adapter
export {
  DEFAULT_VIEWPORT,
  STANDALONE_VIEWPORT,
  generateViewportContent,
  SAFE_AREA_FALLBACKS,
  NOTCH_HEIGHTS,
  ANDROID_STATUS_BAR_HEIGHTS,
  hasNotch,
  getSafeAreaInsets,
  SAFE_AREA_CSS,
  getOrientation,
  isLandscape,
  isPortrait,
  useViewport,
  useOrientationLock,
  useVirtualKeyboard,
  PREVENT_BOUNCE_CSS,
  FULL_HEIGHT_CSS,
} from './viewport';

export type {
  ViewportOptions,
  SafeAreaInsets,
  Orientation,
  UseViewportOptions,
  ViewportState,
} from './viewport';
