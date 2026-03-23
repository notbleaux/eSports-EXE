/** [Ver002.000] */
/**
 * Expertise Detection Types
 * =========================
 * Types and implementation for user expertise profiling and context detection.
 * 
 * Changes:
 * - v002.000: Added UserExpertiseProfile class with methods for help level evaluation
 */

import type { 
  ExpertiseLevel, 
  FeatureId, 
  FeatureExpertise,
  HelpContext,
  UserAction,
  ErrorEvent,
  InteractionType,
  HelpTrigger,
  TriggerType,
  TriggerCondition,
  HelpLevel,
} from './index';

// Re-export for convenience
export type {
  ExpertiseLevel,
  FeatureId,
  FeatureExpertise,
  HelpContext,
  UserAction,
  ErrorEvent,
  InteractionType,
  HelpTrigger,
  TriggerType,
  TriggerCondition,
  HelpLevel,
};

// ============================================================================
// User Expertise Profile Model
// ============================================================================

export interface UserExpertiseProfileData {
  userId: string;
  overallLevel: ExpertiseLevel;
  features: Record<string, FeatureExpertise>;
  lastUpdated: Date;
}

export interface HelpLevelResult {
  level: HelpLevel;
  confidence: number;
  reason: string;
}

export interface PromotionCriteria {
  minInteractions: number;
  minSuccessRate: number;
  decliningHelpUsage: boolean;
  timeWindowDays: number;
}

export const DEFAULT_PROMOTION_CRITERIA: PromotionCriteria = {
  minInteractions: 5,
  minSuccessRate: 0.8,
  decliningHelpUsage: true,
  timeWindowDays: 30,
};

/**
 * User Expertise Profile Class
 * Manages user expertise data and determines appropriate help levels
 */
export class UserExpertiseProfile implements UserExpertiseProfileData {
  userId: string;
  overallLevel: ExpertiseLevel;
  features: Record<string, FeatureExpertise>;
  lastUpdated: Date;

  constructor(data: UserExpertiseProfileData) {
    this.userId = data.userId;
    this.overallLevel = data.overallLevel;
    this.features = data.features;
    this.lastUpdated = data.lastUpdated;
  }

  /**
   * Get the appropriate help level for a specific feature
   * Based on user's expertise level and confidence
   */
  getHelpLevel(featureId: string): HelpLevelResult {
    const feature = this.features[featureId];
    
    if (!feature) {
      return {
        level: 'summary',
        confidence: 0.5,
        reason: 'No prior interaction with this feature',
      };
    }

    const { level, confidence, helpRequests, errors } = feature;

    // High error rate or many help requests = show detailed help
    const errorRate = errors > 0 
      ? errors / (errors + feature.successfulActions) 
      : 0;
    
    if (level === 'beginner' || confidence < 0.3) {
      return {
        level: helpRequests > 2 ? 'interactive' : 'detail',
        confidence: 1 - confidence,
        reason: 'Low expertise or confidence',
      };
    }

    if (level === 'intermediate') {
      if (errorRate > 0.2 || helpRequests > 1) {
        return {
          level: 'detail',
          confidence: 0.7,
          reason: 'Struggling with feature',
        };
      }
      return {
        level: 'summary',
        confidence: 0.6,
        reason: 'Intermediate with good progress',
      };
    }

    if (level === 'advanced' || level === 'expert') {
      return {
        level: 'summary',
        confidence: 0.9,
        reason: 'High expertise level',
      };
    }

    return {
      level: 'summary',
      confidence: 0.5,
      reason: 'Default level',
    };
  }

  /**
   * Determine if help should auto-trigger for a feature
   * Based on user behavior patterns
   */
  shouldAutoTrigger(featureId: string): boolean {
    const feature = this.features[featureId];
    
    if (!feature) {
      // New feature - auto-trigger for beginners
      return this.overallLevel === 'beginner';
    }

    const { level, errors, helpRequests, successfulActions } = feature;
    
    // Auto-trigger conditions:
    // 1. Beginner level with errors
    if (level === 'beginner' && errors > 0) {
      return true;
    }
    
    // 2. Multiple help requests indicate continued need
    if (helpRequests >= 2 && errors > 1) {
      return true;
    }
    
    // 3. High error rate despite successful actions
    const totalActions = errors + successfulActions;
    if (totalActions > 5) {
      const errorRate = errors / totalActions;
      if (errorRate > 0.3) {
        return true;
      }
    }
    
    // 4. Expert users rarely need auto-trigger
    if (level === 'expert') {
      return false;
    }
    
    return false;
  }

  /**
   * Calculate which features are ready for promotion
   * Returns array of features that meet promotion criteria
   */
  calculatePromotion(criteria: PromotionCriteria = DEFAULT_PROMOTION_CRITERIA): FeatureExpertise[] {
    const promotable: FeatureExpertise[] = [];
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - criteria.timeWindowDays);

    for (const [featureId, feature] of Object.entries(this.features)) {
      // Skip recently promoted or already expert
      if (feature.level === 'expert') continue;
      if (feature.lastInteraction < cutoffDate) continue;

      const totalActions = feature.successfulActions + feature.errors;
      
      // Check minimum interactions
      if (totalActions < criteria.minInteractions) continue;

      // Check success rate
      const successRate = totalActions > 0 
        ? feature.successfulActions / totalActions 
        : 0;
      if (successRate < criteria.minSuccessRate) continue;

      // Check declining help usage (simulated by low help requests relative to actions)
      if (criteria.decliningHelpUsage) {
        const helpRate = totalActions > 0 ? feature.helpRequests / totalActions : 0;
        if (helpRate > 0.2) continue; // Still asking for help frequently
      }

      // Feature meets all criteria - mark for promotion
      promotable.push({
        ...feature,
        // Promotion happens to next level
        level: this.getNextLevel(feature.level),
        confidence: Math.min(feature.confidence + 0.1, 1.0),
      });
    }

    return promotable;
  }

  /**
   * Get the next expertise level
   */
  private getNextLevel(current: ExpertiseLevel): ExpertiseLevel {
    const levels: ExpertiseLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const index = levels.indexOf(current);
    return levels[Math.min(index + 1, levels.length - 1)];
  }

  /**
   * Update feature expertise with new interaction data
   */
  updateFeature(featureId: string, interaction: InteractionType): void {
    const existing = this.features[featureId] || {
      level: this.overallLevel,
      confidence: 0.1,
      lastInteraction: new Date(),
      helpRequests: 0,
      errors: 0,
      successfulActions: 0,
      timeSpentSeconds: 0,
    };

    const updated = { ...existing };
    updated.lastInteraction = new Date();

    switch (interaction) {
      case 'complete':
        updated.successfulActions++;
        updated.confidence = Math.min(updated.confidence + 0.05, 1.0);
        break;
      case 'error':
        updated.errors++;
        updated.confidence = Math.max(updated.confidence - 0.05, 0);
        break;
      case 'help_request':
        updated.helpRequests++;
        break;
      case 'view':
      case 'click':
        // Minor confidence boost for engagement
        updated.confidence = Math.min(updated.confidence + 0.01, 1.0);
        break;
    }

    this.features[featureId] = updated;
    this.lastUpdated = new Date();
  }

  /**
   * Create a plain object for serialization
   */
  toJSON(): UserExpertiseProfileData {
    return {
      userId: this.userId,
      overallLevel: this.overallLevel,
      features: this.features,
      lastUpdated: this.lastUpdated,
    };
  }
}

// ============================================================================
// Context Detector Types
// ============================================================================

export interface ContextDetectorConfig {
  // Time thresholds (ms)
  stuckThreshold: number;      // Default: 30000 (30s)
  errorSpikeThreshold: number; // Default: 3 errors in 60s
  rapidClickThreshold: number; // Default: 5 clicks in 3s
  rapidClickWindow: number;    // Default: 3000 (3s)
  errorSpikeWindow: number;    // Default: 60000 (60s)
  scrollConfusionThreshold: number; // Default: 10 scroll direction changes in 10s
  scrollConfusionWindow: number;    // Default: 10000 (10s)
  
  // Confidence weights (should sum to 1)
  actionWeight: number;        // Default: 0.3
  errorWeight: number;         // Default: 0.4
  timeWeight: number;          // Default: 0.2
  helpRequestWeight: number;   // Default: 0.1
}

export const DEFAULT_CONTEXT_DETECTOR_CONFIG: ContextDetectorConfig = {
  stuckThreshold: 30000,
  errorSpikeThreshold: 3,
  rapidClickThreshold: 5,
  rapidClickWindow: 3000,
  errorSpikeWindow: 60000,
  scrollConfusionThreshold: 10,
  scrollConfusionWindow: 10000,
  actionWeight: 0.3,
  errorWeight: 0.4,
  timeWeight: 0.2,
  helpRequestWeight: 0.1,
};

export interface StuckBehaviorIndicators {
  isStuck: boolean;
  reason: 'no_action' | 'rapid_clicks' | 'scroll_confusion' | null;
  confidence: number;
}

export interface ErrorSpikeIndicators {
  hasSpike: boolean;
  errorCount: number;
  timeWindow: number;
  confidence: number;
}

export interface RepeatedErrorPattern {
  hasRepeatedErrors: boolean;
  errorCode: string | null;
  count: number;
  isRecoverable: boolean;
}

// ============================================================================
// Trigger Engine Types
// ============================================================================

export interface TriggerEngineConfig {
  maxConcurrentTriggers: number;
  defaultCooldownMs: number;
  minPriorityForAutoShow: number;
}

export const DEFAULT_TRIGGER_ENGINE_CONFIG: TriggerEngineConfig = {
  maxConcurrentTriggers: 1,
  defaultCooldownMs: 60000, // 1 minute cooldown
  minPriorityForAutoShow: 3,
};

export interface TriggerResult {
  shouldTrigger: boolean;
  trigger: HelpTrigger | null;
  reason: string;
  suppressed: boolean;
  cooldownRemainingMs: number;
}

export interface TriggerEvaluationResult {
  triggered: HelpTrigger[];
  suppressed: HelpTrigger[];   // On cooldown or low priority
  context: HelpContext;
}

export interface TriggerHistoryEntry {
  triggerId: string;
  firedAt: Date;
  context: HelpContext;
  userResponded: boolean;
}

// ============================================================================
// Expertise Calculation Types
// ============================================================================

export interface ExpertiseCalculationInput {
  actions: UserAction[];
  errors: ErrorEvent[];
  helpRequests: number;
  timeSpent: number;
  sessionsCompleted: number;
}

export interface ExpertiseCalculationResult {
  level: ExpertiseLevel;
  confidence: number;
  factors: {
    actionScore: number;
    errorScore: number;
    helpScore: number;
    timeScore: number;
  };
  recommendations: string[];
}

// ============================================================================
// API Types
// ============================================================================

export interface GetExpertiseProfileRequest {
  userId: string;
  featureId?: FeatureId;
}

export interface GetExpertiseProfileResponse {
  profile: UserExpertiseProfileData;
  featureExpertise?: FeatureExpertise;
}

export interface RecordInteractionRequest {
  userId: string;
  action: UserAction;
}

export interface RecordInteractionResponse {
  success: boolean;
  updatedProfile: UserExpertiseProfileData;
  promotionOccurred?: {
    featureId: FeatureId;
    fromLevel: ExpertiseLevel;
    toLevel: ExpertiseLevel;
  };
}
