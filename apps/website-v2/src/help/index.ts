/** [Ver002.000] */
/**
 * Help System - Context Detection Engine
 * ======================================
 * Export all help system components for the context detection engine.
 */

export { ContextDetector, DEFAULT_CONFIG as DEFAULT_CONTEXT_CONFIG } from './ContextDetector';
export type {
  ContextDetectorConfig,
  StuckBehaviorIndicators,
  ErrorSpikeIndicators,
  RepeatedErrorPattern,
} from './ContextDetector';

export { 
  TriggerEvaluator, 
  DEFAULT_TRIGGER_CONFIG,
  createTriggerEvaluatorWithPromotions,
} from './TriggerEngine';
export type {
  TriggerResult,
  TriggerHistoryEntry,
  TriggerEngineConfig,
} from './TriggerEngine';

export { HelpEngine } from './HelpEngine';
export type { HelpEngineConfig, HelpEngineResult } from './HelpEngine';

// Recommendation Engine
export { RecommendationEngine } from './recommendationEngine';
export type { GraphData } from './recommendationEngine';
