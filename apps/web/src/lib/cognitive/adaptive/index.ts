/** [Ver001.000]
 * Adaptive UI System Index
 * ========================
 * Centralized exports for the Adaptive UI System.
 * 
 * Components:
 * - Layout Engine: Dynamic layout adjustments
 * - Smart Defaults: Context-aware default values
 * - Content Simplification: Text complexity reduction
 * - Learning: Preference tracking and prediction
 * 
 * Integration:
 * - Uses TL-A3-3-A cognitive load detector
 * - Works with all form components
 * - Connects to preference learning system
 */

// ============================================================================
// Layout Engine
// ============================================================================

export type {
  LayoutMode,
  GridConfig,
  SpacingConfig,
  LayoutModeConfig,
  DisclosureLevel,
  SectionVisibility,
  ProgressiveDisclosureConfig,
  DisclosureDecision,
  BreakpointConfig,
  LayoutState,
} from './layout';

export {
  FULL_LAYOUT,
  SIMPLIFIED_LAYOUT,
  MINIMAL_LAYOUT,
  FOCUSED_LAYOUT,
  LAYOUT_MODES,
  DEFAULT_PROGRESSIVE_DISCLOSURE,
  LOAD_TO_LAYOUT_MAP,
  SIMPLIFICATION_TO_LAYOUT_MAP,
  DEFAULT_BREAKPOINTS,
  getLayoutModeForLoad,
  getLayoutModeForSimplification,
  getLayoutConfig,
  getLayoutConfigForLoad,
  calculateEffectiveLayoutMode,
  loadToDisclosureLevel,
  shouldDisclose,
  getDisclosureDecision,
  sortSectionsByPriority,
  generateLayoutCSS,
  getLayoutModeClass,
  getLayoutClasses,
  adjustLayoutForViewport,
  createLayoutState,
  updateLayoutForLoad,
  toggleSectionCollapse,
  setUserLayoutPreference,
} from './layout';

// ============================================================================
// Smart Defaults
// ============================================================================

export type {
  DefaultSource,
  DefaultValueMeta,
  SmartDefault,
  ContextData,
  FieldContext,
  UserPreference,
  PreferencePattern,
  PreferenceStorage,
  DefaultProvider,
  DefaultProviderEntry,
  InferenceRule,
  GetSmartDefaultOptions,
  AutoFillResult,
  AutoFillOptions,
} from './defaults';

export {
  LocalPreferenceStorage,
  registerDefaultProvider,
  unregisterDefaultProvider,
  setProviderEnabled,
  getProvidersForFieldType,
  evaluateRule,
  findMatchingRules,
  setGlobalPreferenceStorage,
  getGlobalPreferenceStorage,
  getSmartDefault,
  autoFillForm,
  recordDefaultUsed,
} from './defaults';

// ============================================================================
// Content Simplification
// ============================================================================

export type {
  ReadabilityScore,
  ComplexityConfig,
  SimplificationStrategy,
  ContentSection,
  AdaptiveContentConfig,
  AdaptiveContentResult,
} from './content';

export {
  VERY_EASY_CONFIG,
  EASY_CONFIG,
  STANDARD_CONFIG,
  COMPLEX_CONFIG,
  LOAD_TO_COMPLEXITY_CONFIG,
  countSyllables,
  splitSentences,
  splitWords,
  calculateFleschScore,
  calculateGradeLevel,
  getComplexityLevel,
  analyzeReadability,
  simplifySentence,
  simplifyVocabulary,
  removeRedundancy,
  simplifyText,
  extractKeywords,
  scoreSentences,
  generateTLDR,
  generateBulletSummary,
  flattenHierarchy,
  filterByImportance,
  simplifyHierarchy,
  processAdaptiveContent,
} from './content';

// ============================================================================
// Preference Learning
// ============================================================================

export type {
  LearnedPreference,
  PreferenceContext,
  PreferencePattern,
  PatternType,
  TemporalPattern,
  ContextualPattern,
  SequentialPattern,
  LearningConfig,
  ABTestVariant,
  ABTestConfig,
  ABTestResult,
  PredictionResult,
} from './learning';

export {
  DEFAULT_LEARNING_CONFIG,
  PreferenceStore,
  setGlobalStore,
  getGlobalStore,
  getTimeOfDay,
  getDeviceType,
  getScreenSize,
  buildContext,
  ABTestManager,
  getABTestManager,
  predictOptimal,
} from './learning';

// ============================================================================
// Default Export
// ============================================================================

import layout from './layout';
import defaults from './defaults';
import content from './content';
import learning from './learning';

export const adaptive = {
  layout,
  defaults,
  content,
  learning,
};

export default adaptive;
