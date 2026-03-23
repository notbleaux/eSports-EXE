/**
 * Mobile Components Index
 * [Ver003.000] - Mobile UI Components with Screen Reader Support
 * 
 * Export all mobile-specific components for the 4NJZ4 TENET Platform.
 * These components are optimized for touch interactions, PWA experiences,
 * and mobile screen reader accessibility (VoiceOver/TalkBack).
 */

// Core mobile components
export { BottomNavigation } from './BottomNavigation';
export { InstallPrompt } from './InstallPrompt';
export { PullToRefresh, usePullToRefresh } from './PullToRefresh';
export { 
  TouchFeedback, 
  TouchFeedbackButton, 
  TouchFeedbackCard 
} from './TouchFeedback';
export { 
  GestureDemo,
  CompactGestureDemo,
} from './GestureDemo';

// Screen reader accessibility components
export {
  MobileA11yProvider,
  ScreenReaderAnnouncement,
  MobileFocusTrap,
  SkipLink,
  SkipLinks,
  TouchTarget,
  AccessibleRegion,
  VisuallyHiddenText,
  ScreenReaderOnly,
  MobileA11yButton,
  useMobileA11y,
} from './MobileAccessible';

// Touch exploration components
export {
  TouchExplorerProvider,
  TouchExplorerButton,
  TouchExplorationZone,
  useTouchExplorer,
} from './TouchExplorer';

// Default exports for convenience
export { default } from './BottomNavigation';
