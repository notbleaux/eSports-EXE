/** [Ver001.000]
 * Cognitive Load Library Index
 * ============================
 * Centralized exports for cognitive load detection and adaptation.
 * 
 * @module lib/cognitive
 */

// Types
export type {
  CognitiveLoadLevel,
  CognitiveLoadState,
  LoadDetectionConfig,
  LoadLevelValue,
  MouseHesitation,
  MouseMovement,
  ScrollPattern,
  TypingPattern,
  InputInteraction,
  NavigationPattern,
  HelpRequestPattern,
  EyeTrackingPoint,
  EyeMovementAnalysis,
  TaskAnalysis,
  SimplificationLevel,
  SimplificationRule,
  SimplificationConfig,
  AdaptiveUIState,
  LoadDetectorReturn,
  UseCognitiveLoadReturn,
} from './types';

export {
  DEFAULT_LOAD_DETECTION_CONFIG,
} from './types';

// Load Detector
export {
  initializeLoadDetector,
  startLoadDetection,
  stopLoadDetection,
  resetLoadDetector,
  setManualLoadLevel,
  clearManualOverride,
  startTask,
  completeTask,
  recordHelpRequest,
  getCurrentLoadState,
  getLoadTrend,
  isDetectionActive,
  createLoadDetector,
} from './loadDetector';

export { default as loadDetector } from './loadDetector';

// Indicators
export {
  recordError,
  resolveError,
  resolveErrorsByField,
  getErrorRate,
  getErrorPattern,
  startTypingSession,
  recordKeystroke,
  endTypingSession,
  getTypingPattern,
  getTypingStressIndicator,
  recordBackNavigation,
  getBackNavigationFrequency,
  getNavigationPattern,
  recordHelpRequest as recordIndicatorHelpRequest,
  resolveHelpRequest,
  getHelpRequestPattern,
  getHelpSeekingBehavior,
  trackInputFocus,
  trackInputBlur,
  getInputInteractions,
  getProblematicFields,
  getAllIndicators,
  resetIndicators,
} from './indicators';

export { default as indicators } from './indicators';

// Simplification
export {
  DEFAULT_SIMPLIFICATION_RULES,
  SIMPLIFICATION_CONFIGS,
  LOAD_TO_SIMPLIFICATION_MAP,
  SIMPLIFICATION_CSS_CLASSES,
  SIMPLIFICATION_STYLES,
  HUB_SPECIFIC_RULES,
  getSimplificationLevelForLoad,
  getSimplificationConfigForLoad,
  getActiveRules,
  addSimplificationRule,
  removeSimplificationRule,
  toggleRuleEnabled,
  updateRule,
  toggleFeature,
  setFeature,
  isFeatureEnabled,
  setUserOverride,
  getEffectiveLevel,
  clearUserOverride,
  getSimplificationClasses,
  getHubRules,
  mergeWithHubRules,
} from './simplification';

export { default as simplification } from './simplification';

// Adaptive UI System
export * from './adaptive';
export { default as adaptive } from './adaptive';
