[Ver002.000]

/**
 * Mobile Library Index
 * 
 * Centralized exports for mobile-first responsive utilities and
 * screen reader optimization for VoiceOver and TalkBack.
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

// VoiceOver support (iOS)
export {
  isVoiceOverEnabled,
  getIOSVersion,
  supportsAdvancedVoiceOver,
  announceToVoiceOver,
  stopVoiceOverAnnouncements,
  createRotorConfig,
  setupRotorNavigation,
  getCustomActionAttributes,
  executeCustomAction,
  createRegionConfig,
  getRegionAttributes,
  announceRegionChange,
  useVoiceOver,
  optimizeForVoiceOver,
  createAccessibleLabel,
  formatNumberForVoiceOver,
  formatPercentageForVoiceOver,
  VOICEOVER_CSS,
  TRAIT_TO_ROLE,
} from './voiceover';

export type {
  VoiceOverRotorConfig,
  VoiceOverRotorItem,
  VoiceOverCustomAction,
  VoiceOverRegionConfig,
  VoiceOverTrait,
  VoiceOverPriority,
  VoiceOverAnnouncementOptions,
  VoiceOverState,
} from './voiceover';

// TalkBack support (Android)
export {
  isTalkBackEnabled,
  getAndroidVersion,
  supportsAdvancedTalkBack,
  supportsAccessibilityDelegate,
  announceToTalkBack,
  createTraversalManager,
  TalkBackTraversalManager,
  buildNodeInfo,
  performAction,
  createGestureManager,
  TalkBackGestureManager,
  useTalkBack,
  optimizeForTalkBack,
  formatNumberForTalkBack,
  getTalkBackAttributes,
  TALKBACK_CSS,
  TALKBACK_VIBRATIONS,
  TALKBACK_EARCONS,
} from './talkback';

export type {
  TalkBackTraversalConfig,
  AccessibilityNodeInfo,
  TalkBackAction,
  TalkBackGesture,
  TalkBackGestureHandler,
  TalkBackState,
  TalkBackAnnouncementOptions,
  TraversalStrategy,
} from './talkback';
