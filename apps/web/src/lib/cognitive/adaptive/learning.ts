/** [Ver001.000]
 * Preference Learning System
 * ==========================
 * Track user preferences and predict optimal settings.
 * 
 * Features:
 * - Track user preferences
 * - Predict optimal settings
 * - A/B testing framework
 * - Preference clustering
 * - Temporal pattern detection
 * 
 * Integration:
 * - Uses TL-A3-3-A cognitive load detector
 * - Works with smart defaults system
 * - Connects to all adaptive components
 */

import type { CognitiveLoadLevel } from '../types';

// ============================================================================
// Preference Types
// ============================================================================

/**
 * User preference with learned metadata
 */
export interface LearnedPreference<T = unknown> {
  /** Unique preference identifier */
  id: string;
  /** Preference category */
  category: string;
  /** The preferred value */
  value: T;
  /** When this preference was first observed */
  firstObserved: number;
  /** When this preference was last observed */
  lastObserved: number;
  /** Number of times this preference was expressed */
  frequency: number;
  /** Confidence in this preference (0-1) */
  confidence: number;
  /** Contexts where this preference applies */
  contexts: PreferenceContext[];
  /** Pattern metadata if detected */
  pattern?: PreferencePattern;
}

/**
 * Context in which a preference was expressed
 */
export interface PreferenceContext {
  /** Timestamp */
  timestamp: number;
  /** Time of day */
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  /** Day of week */
  dayOfWeek: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  /** Device type */
  deviceType: 'desktop' | 'tablet' | 'mobile';
  /** Screen size category */
  screenSize: 'small' | 'medium' | 'large';
  /** Cognitive load at the time */
  cognitiveLoad: CognitiveLoadLevel;
  /** Page/section context */
  pageContext: string;
  /** Additional contextual data */
  metadata: Record<string, unknown>;
}

/**
 * Detected pattern in preferences
 */
export interface PreferencePattern {
  /** Pattern type */
  type: PatternType;
  /** Pattern-specific data */
  data: unknown;
  /** Pattern strength (0-1) */
  strength: number;
  /** When pattern was detected */
  detectedAt: number;
  /** Number of observations supporting pattern */
  observations: number;
}

/**
 * Types of patterns that can be detected
 */
export type PatternType =
  | 'temporal'      // Time-based patterns
  | 'contextual'    // Context-dependent patterns
  | 'sequential'    // Sequence-based patterns
  | 'cyclic'        // Repeating patterns
  | 'drift'         // Gradual preference changes
  | 'cluster';      // Group-based patterns

/**
 * Temporal pattern data
 */
export interface TemporalPattern {
  /** Preferred time of day */
  preferredTimeOfDay: string[];
  /** Preferred days of week */
  preferredDays: number[];
  /** Consistency score (0-1) */
  consistency: number;
}

/**
 * Contextual pattern data
 */
export interface ContextualPattern {
  /** Contexts where preference is strong */
  strongContexts: string[];
  /** Contexts where preference is weak */
  weakContexts: string[];
  /** Context sensitivity score */
  sensitivity: number;
}

/**
 * Sequential pattern data
 */
export interface SequentialPattern {
  /** Common sequences leading to this preference */
  precedingActions: string[];
  /** Common sequences following this preference */
  followingActions: string[];
  /** Transition probabilities */
  transitions: Record<string, number>;
}

// ============================================================================
// Learning Engine
// ============================================================================

/**
 * Learning engine configuration
 */
export interface LearningConfig {
  /** Minimum observations before pattern detection */
  minObservations: number;
  /** Confidence threshold for predictions */
  confidenceThreshold: number;
  /** How long to remember preferences (ms) */
  preferenceTTL: number;
  /** Whether to decay old preferences */
  enableDecay: boolean;
  /** Decay rate per day (0-1) */
  decayRate: number;
  /** Maximum preferences to store per category */
  maxPreferencesPerCategory: number;
}

/**
 * Default learning configuration
 */
export const DEFAULT_LEARNING_CONFIG: LearningConfig = {
  minObservations: 3,
  confidenceThreshold: 0.6,
  preferenceTTL: 90 * 24 * 60 * 60 * 1000, // 90 days
  enableDecay: true,
  decayRate: 0.05,
  maxPreferencesPerCategory: 50,
};

/**
 * In-memory preference store
 */
class PreferenceStore {
  private preferences: Map<string, LearnedPreference<unknown>> = new Map();
  private config: LearningConfig;

  constructor(config: Partial<LearningConfig> = {}) {
    this.config = { ...DEFAULT_LEARNING_CONFIG, ...config };
  }

  /**
   * Record a preference observation
   */
  record<T>(
    id: string,
    category: string,
    value: T,
    context: PreferenceContext
  ): LearnedPreference<T> {
    const existing = this.preferences.get(id) as LearnedPreference<T> | undefined;
    const now = Date.now();

    if (existing) {
      // Update existing preference
      const updated: LearnedPreference<T> = {
        ...existing,
        value,
        lastObserved: now,
        frequency: existing.frequency + 1,
        contexts: [...existing.contexts.slice(-19), context], // Keep last 20
      };

      // Recalculate confidence
      updated.confidence = this.calculateConfidence(updated);
      
      // Detect patterns
      if (updated.frequency >= this.config.minObservations) {
        updated.pattern = this.detectPattern(updated);
      }

      this.preferences.set(id, updated as LearnedPreference<unknown>);
      return updated;
    } else {
      // Create new preference
      const preference: LearnedPreference<T> = {
        id,
        category,
        value,
        firstObserved: now,
        lastObserved: now,
        frequency: 1,
        confidence: 0.5,
        contexts: [context],
      };

      this.preferences.set(id, preference as LearnedPreference<unknown>);
      return preference;
    }
  }

  /**
   * Get a preference by ID
   */
  get<T>(id: string): LearnedPreference<T> | null {
    const pref = this.preferences.get(id);
    if (!pref) return null;

    // Check TTL
    if (Date.now() - pref.lastObserved > this.config.preferenceTTL) {
      this.preferences.delete(id);
      return null;
    }

    return pref as LearnedPreference<T>;
  }

  /**
   * Get all preferences in a category
   */
  getByCategory(category: string): Array<LearnedPreference<unknown>> {
    return Array.from(this.preferences.values())
      .filter(p => p.category === category)
      .sort((a, b) => b.confidence - a.confidence);
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(pref: LearnedPreference<unknown>): number {
    const now = Date.now();
    const age = now - pref.firstObserved;
    const recency = now - pref.lastObserved;
    
    // Base confidence from frequency
    let confidence = Math.min(0.9, pref.frequency / 10);
    
    // Boost for consistent choices
    const consistency = this.calculateConsistency(pref);
    confidence = confidence * 0.7 + consistency * 0.3;
    
    // Decay for old preferences
    if (this.config.enableDecay) {
      const daysSinceLastUse = recency / (24 * 60 * 60 * 1000);
      const decay = Math.pow(1 - this.config.decayRate, daysSinceLastUse);
      confidence *= decay;
    }

    return Math.max(0, Math.min(1, confidence));
  }

  /**
   * Calculate consistency of preference choices
   */
  private calculateConsistency(pref: LearnedPreference<unknown>): number {
    if (pref.contexts.length < 2) return 0.5;

    // Check if same value is chosen in similar contexts
    const similarContextChoices = pref.contexts.filter(ctx => {
      // Simple similarity: same time of day and device type
      const lastCtx = pref.contexts[pref.contexts.length - 1];
      return ctx.timeOfDay === lastCtx.timeOfDay && 
             ctx.deviceType === lastCtx.deviceType;
    }).length;

    return similarContextChoices / pref.contexts.length;
  }

  /**
   * Detect patterns in preference data
   */
  private detectPattern(pref: LearnedPreference<unknown>): PreferencePattern | undefined {
    const temporal = this.detectTemporalPattern(pref);
    if (temporal && temporal.strength > 0.6) {
      return temporal;
    }

    const contextual = this.detectContextualPattern(pref);
    if (contextual && contextual.strength > 0.6) {
      return contextual;
    }

    return undefined;
  }

  /**
   * Detect temporal patterns
   */
  private detectTemporalPattern(pref: LearnedPreference<unknown>): PreferencePattern | undefined {
    const timeOfDayCounts: Record<string, number> = {};
    const dayOfWeekCounts: Record<number, number> = {};

    for (const ctx of pref.contexts) {
      timeOfDayCounts[ctx.timeOfDay] = (timeOfDayCounts[ctx.timeOfDay] || 0) + 1;
      dayOfWeekCounts[ctx.dayOfWeek] = (dayOfWeekCounts[ctx.dayOfWeek] || 0) + 1;
    }

    // Find preferred times
    const preferredTimes = Object.entries(timeOfDayCounts)
      .filter(([, count]) => count >= pref.contexts.length * 0.4)
      .map(([time]) => time);

    const preferredDays = Object.entries(dayOfWeekCounts)
      .filter(([, count]) => count >= pref.contexts.length * 0.4)
      .map(([day]) => Number(day));

    if (preferredTimes.length === 0 && preferredDays.length === 0) {
      return undefined;
    }

    // Calculate consistency
    const timeConsistency = preferredTimes.length > 0
      ? preferredTimes.reduce((sum, t) => sum + (timeOfDayCounts[t] || 0), 0) / pref.contexts.length
      : 0;

    const data: TemporalPattern = {
      preferredTimeOfDay: preferredTimes,
      preferredDays,
      consistency: timeConsistency,
    };

    return {
      type: 'temporal',
      data,
      strength: timeConsistency,
      detectedAt: Date.now(),
      observations: pref.contexts.length,
    };
  }

  /**
   * Detect contextual patterns
   */
  private detectContextualPattern(pref: LearnedPreference<unknown>): PreferencePattern | undefined {
    const contextCounts: Record<string, number> = {};

    for (const ctx of pref.contexts) {
      const key = `${ctx.deviceType}-${ctx.screenSize}-${ctx.cognitiveLoad}`;
      contextCounts[key] = (contextCounts[key] || 0) + 1;
    }

    const strongContexts = Object.entries(contextCounts)
      .filter(([, count]) => count >= pref.contexts.length * 0.5)
      .map(([key]) => key);

    if (strongContexts.length === 0) {
      return undefined;
    }

    const data: ContextualPattern = {
      strongContexts,
      weakContexts: [],
      sensitivity: strongContexts.length / Object.keys(contextCounts).length,
    };

    return {
      type: 'contextual',
      data,
      strength: data.sensitivity,
      detectedAt: Date.now(),
      observations: pref.contexts.length,
    };
  }

  /**
   * Predict preference for a context
   */
  predict<T>(id: string, context: PreferenceContext): { value: T | null; confidence: number } {
    const pref = this.get<T>(id);
    
    if (!pref) {
      return { value: null, confidence: 0 };
    }

    // Adjust confidence based on context match
    let contextMatch = 0;

    if (pref.pattern) {
      switch (pref.pattern.type) {
        case 'temporal': {
          const temporal = pref.pattern.data as TemporalPattern;
          if (temporal.preferredTimeOfDay.includes(context.timeOfDay)) {
            contextMatch += 0.3;
          }
          if (temporal.preferredDays.includes(context.dayOfWeek)) {
            contextMatch += 0.2;
          }
          break;
        }
        case 'contextual': {
          const contextual = pref.pattern.data as ContextualPattern;
          const contextKey = `${context.deviceType}-${context.screenSize}-${context.cognitiveLoad}`;
          if (contextual.strongContexts.includes(contextKey)) {
            contextMatch += 0.4;
          }
          break;
        }
      }
    }

    const adjustedConfidence = pref.confidence * (0.7 + contextMatch);
    
    if (adjustedConfidence < this.config.confidenceThreshold) {
      return { value: null, confidence: adjustedConfidence };
    }

    return { value: pref.value, confidence: adjustedConfidence };
  }

  /**
   * Clean up old preferences
   */
  cleanup(): void {
    const now = Date.now();
    for (const [id, pref] of this.preferences) {
      if (now - pref.lastObserved > this.config.preferenceTTL) {
        this.preferences.delete(id);
      }
    }
  }
}

// Global store instance
let globalStore: PreferenceStore = new PreferenceStore();

/**
 * Set global preference store
 */
export function setGlobalStore(store: PreferenceStore): void {
  globalStore = store;
}

/**
 * Get global preference store
 */
export function getGlobalStore(): PreferenceStore {
  return globalStore;
}

// ============================================================================
// Context Utilities
// ============================================================================

/**
 * Get current time of day
 */
export function getTimeOfDay(): PreferenceContext['timeOfDay'] {
  const hour = new Date().getHours();
  if (hour < 6) return 'night';
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'evening';
}

/**
 * Get device type from viewport
 */
export function getDeviceType(): PreferenceContext['deviceType'] {
  const width = window.innerWidth;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

/**
 * Get screen size category
 */
export function getScreenSize(): PreferenceContext['screenSize'] {
  const width = window.innerWidth;
  if (width < 640) return 'small';
  if (width < 1024) return 'medium';
  return 'large';
}

/**
 * Build current context
 */
export function buildContext(
  pageContext: string,
  cognitiveLoad: CognitiveLoadLevel,
  metadata: Record<string, unknown> = {}
): PreferenceContext {
  const now = new Date();
  
  return {
    timestamp: now.getTime(),
    timeOfDay: getTimeOfDay(),
    dayOfWeek: now.getDay() as 0 | 1 | 2 | 3 | 4 | 5 | 6,
    deviceType: getDeviceType(),
    screenSize: getScreenSize(),
    cognitiveLoad,
    pageContext,
    metadata,
  };
}

// ============================================================================
// A/B Testing Framework
// ============================================================================

/**
 * A/B test variant
 */
export interface ABTestVariant<T> {
  /** Variant identifier */
  id: string;
  /** Variant value */
  value: T;
  /** Variant weight (0-1, relative to others) */
  weight: number;
  /** Target metric for this variant */
  targetMetric?: string;
}

/**
 * A/B test configuration
 */
export interface ABTestConfig<T> {
  /** Test identifier */
  testId: string;
  /** Test description */
  description: string;
  /** Test variants */
  variants: ABTestVariant<T>[];
  /** Traffic allocation (0-1) */
  trafficAllocation: number;
  /** Minimum sample size per variant */
  minSampleSize: number;
  /** Test duration (ms) */
  duration: number;
  /** Success metric */
  successMetric: string;
  /** Start time */
  startTime: number;
}

/**
 * A/B test result
 */
export interface ABTestResult<T> {
  /** Winning variant (if determined) */
  winner: ABTestVariant<T> | null;
  /** Whether test is complete */
  isComplete: boolean;
  /** Variant performance data */
  variantStats: Array<{
    variant: ABTestVariant<T>;
    impressions: number;
    conversions: number;
    conversionRate: number;
    confidence: number;
  }>;
}

/**
 * A/B test manager
 */
export class ABTestManager {
  private tests: Map<string, ABTestConfig<unknown>> = new Map();
  private assignments: Map<string, string> = new Map(); // userId -> variantId
  private results: Map<string, {
    variantId: string;
    impressed: boolean;
    converted: boolean;
    timestamp: number;
  }[]> = new Map();

  /**
   * Create a new A/B test
   */
  createTest<T>(config: Omit<ABTestConfig<T>, 'startTime'>): ABTestConfig<T> {
    const test: ABTestConfig<T> = {
      ...config,
      startTime: Date.now(),
    };

    this.tests.set(config.testId, test as ABTestConfig<unknown>);
    this.results.set(config.testId, []);
    
    return test;
  }

  /**
   * Get variant assignment for a user
   */
  getVariant<T>(testId: string, userId: string): ABTestVariant<T> | null {
    const test = this.tests.get(testId) as ABTestConfig<T> | undefined;
    if (!test) return null;

    // Check if user should be in test
    const userHash = this.hashString(userId + testId);
    if (userHash > test.trafficAllocation) {
      return null; // User not in test
    }

    // Check if user already has assignment
    const assignmentKey = `${testId}:${userId}`;
    let variantId = this.assignments.get(assignmentKey);

    if (!variantId) {
      // Assign to variant based on weights
      variantId = this.assignVariant(test.variants, userId);
      this.assignments.set(assignmentKey, variantId);
    }

    return test.variants.find(v => v.id === variantId) || null;
  }

  /**
   * Record an impression
   */
  recordImpression(testId: string, userId: string): void {
    const testResults = this.results.get(testId);
    if (!testResults) return;

    const assignmentKey = `${testId}:${userId}`;
    const variantId = this.assignments.get(assignmentKey);
    if (!variantId) return;

    testResults.push({
      variantId,
      impressed: true,
      converted: false,
      timestamp: Date.now(),
    });
  }

  /**
   * Record a conversion
   */
  recordConversion(testId: string, userId: string): void {
    const testResults = this.results.get(testId);
    if (!testResults) return;

    const assignmentKey = `${testId}:${userId}`;
    const variantId = this.assignments.get(assignmentKey);
    if (!variantId) return;

    // Find last impression and mark as converted
    for (let i = testResults.length - 1; i >= 0; i--) {
      if (testResults[i].variantId === variantId && !testResults[i].converted) {
        testResults[i].converted = true;
        break;
      }
    }
  }

  /**
   * Get test results
   */
  getResults<T>(testId: string): ABTestResult<T> | null {
    const test = this.tests.get(testId) as ABTestConfig<T> | undefined;
    const testResults = this.results.get(testId);
    if (!test || !testResults) return null;

    const now = Date.now();
    const isExpired = now - test.startTime > test.duration;

    // Calculate stats per variant
    const variantStats = test.variants.map(variant => {
      const variantResults = testResults.filter(r => r.variantId === variant.id);
      const impressions = variantResults.filter(r => r.impressed).length;
      const conversions = variantResults.filter(r => r.converted).length;
      
      return {
        variant,
        impressions,
        conversions,
        conversionRate: impressions > 0 ? conversions / impressions : 0,
        confidence: this.calculateVariantConfidence(variantResults),
      };
    });

    // Determine winner if test is complete or has enough samples
    let winner: ABTestVariant<T> | null = null;
    const allHaveMinSamples = variantStats.every(v => v.impressions >= test.minSampleSize);

    if (isExpired || allHaveMinSamples) {
      variantStats.sort((a, b) => b.conversionRate - a.conversionRate);
      if (variantStats[0].conversionRate > variantStats[1]?.conversionRate) {
        winner = variantStats[0].variant;
      }
    }

    return {
      winner,
      isComplete: isExpired || (allHaveMinSamples && !!winner),
      variantStats,
    };
  }

  /**
   * Assign variant based on weights
   */
  private assignVariant<T>(variants: ABTestVariant<T>[], userId: string): string {
    const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
    const random = this.hashString(userId) * totalWeight;
    
    let cumulative = 0;
    for (const variant of variants) {
      cumulative += variant.weight;
      if (random <= cumulative) {
        return variant.id;
      }
    }

    return variants[variants.length - 1].id;
  }

  /**
   * Hash string to number between 0 and 1
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) / 0x7fffffff;
  }

  /**
   * Calculate confidence for variant performance
   */
  private calculateVariantConfidence(results: { impressed: boolean; converted: boolean }[]): number {
    const n = results.length;
    if (n < 30) return 0;

    const conversions = results.filter(r => r.converted).length;
    const rate = conversions / n;
    
    // Simple standard error calculation
    const se = Math.sqrt((rate * (1 - rate)) / n);
    
    // Confidence based on sample size and variance
    return Math.min(0.99, 1 - se * 2);
  }
}

// Global A/B test manager
let globalABTestManager: ABTestManager = new ABTestManager();

/**
 * Get global A/B test manager
 */
export function getABTestManager(): ABTestManager {
  return globalABTestManager;
}

// ============================================================================
// Prediction API
// ============================================================================

/**
 * Prediction result
 */
export interface PredictionResult<T> {
  /** Predicted value */
  value: T | null;
  /** Confidence in prediction */
  confidence: number;
  /** Alternative predictions */
  alternatives: Array<{ value: T; confidence: number }>;
  /** Basis for prediction */
  basis: 'pattern' | 'preference' | 'context' | 'default';
}

/**
 * Predict optimal setting
 */
export function predictOptimal<T>(
  preferenceId: string,
  pageContext: string,
  cognitiveLoad: CognitiveLoadLevel,
  defaultValue: T
): PredictionResult<T> {
  const context = buildContext(pageContext, cognitiveLoad);
  const prediction = globalStore.predict<T>(preferenceId, context);

  if (prediction.value !== null && prediction.confidence > 0.5) {
    return {
      value: prediction.value,
      confidence: prediction.confidence,
      alternatives: [],
      basis: 'preference',
    };
  }

  // Fall back to context-based inference
  const contextualPrediction = inferFromContext<T>(preferenceId, context, defaultValue);

  return contextualPrediction;
}

/**
 * Infer from context patterns
 */
function inferFromContext<T>(
  preferenceId: string,
  context: PreferenceContext,
  defaultValue: T
): PredictionResult<T> {
  // Check for similar contexts
  const category = preferenceId.split(':')[0];
  const preferences = globalStore.getByCategory(category);
  
  const contextMatches = preferences.filter(pref => {
    return pref.contexts.some(ctx => 
      ctx.timeOfDay === context.timeOfDay &&
      ctx.deviceType === context.deviceType &&
      ctx.cognitiveLoad === context.cognitiveLoad
    );
  });

  if (contextMatches.length > 0) {
    const best = contextMatches[0];
    return {
      value: best.value as T,
      confidence: best.confidence * 0.8,
      alternatives: contextMatches.slice(1, 3).map(p => ({
        value: p.value as T,
        confidence: p.confidence * 0.8,
      })),
      basis: 'context',
    };
  }

  return {
    value: defaultValue,
    confidence: 0.3,
    alternatives: [],
    basis: 'default',
  };
}

// ============================================================================
// Named Exports
// ============================================================================

export { PreferenceStore };

// Export
// ============================================================================

export default {
  // Store
  PreferenceStore,
  setGlobalStore,
  getGlobalStore,
  
  // Context
  getTimeOfDay,
  getDeviceType,
  getScreenSize,
  buildContext,
  
  // A/B Testing
  ABTestManager,
  getABTestManager,
  
  // Prediction
  predictOptimal,
};
