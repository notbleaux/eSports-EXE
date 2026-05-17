// @ts-nocheck
/** [Ver001.000] */
/**
 * Help Engine
 * ===========
 * Integration layer combining ContextDetector and TriggerEvaluator
 * with auto-promotion logic.
 * 
 * This is the main entry point for the Context Detection Engine.
 * 
 * @example
 * ```typescript
 * const helpEngine = new HelpEngine({
 *   promotionCriteria: {
 *     minInteractions: 5,
 *     minSuccessRate: 0.8,
 *     decliningHelpUsage: true,
 *   }
 * });
 * 
 * // In your component
 * useEffect(() => {
 *   const check = helpEngine.checkForHelp(featureId);
 *   if (check.shouldShowHelp) {
 *     showHelp(check.helpLevel);
 *   }
 * }, [userActions]);
 * ```
 */

import type {
  HelpContext,
  UserAction,
  ErrorEvent,
  HelpTrigger,
  HelpLevel,
  FeatureId,
  UserExpertiseProfile,
  UserExpertiseProfileData,
  PromotionCriteria,
  FeatureExpertise,
} from '@sator/types/help';

// Import UserExpertiseProfile class directly
import { UserExpertiseProfile as UserExpertiseProfileClass } from '@sator/types/help';

import { ContextDetector, DEFAULT_CONFIG as DEFAULT_CONTEXT_CONFIG } from './ContextDetector';
import { TriggerEvaluator, DEFAULT_TRIGGER_CONFIG } from './TriggerEngine';

export interface HelpEngineConfig {
  contextDetector?: Partial<typeof DEFAULT_CONTEXT_CONFIG>;
  triggerEngine?: Partial<typeof DEFAULT_TRIGGER_CONFIG>;
  promotionCriteria?: Partial<PromotionCriteria>;
  autoTriggerEnabled?: boolean;
}

export interface HelpEngineResult {
  shouldShowHelp: boolean;
  helpLevel: HelpLevel;
  confidence: number;
  reason: string;
  triggerId?: string;
  promotionReady?: FeatureExpertise[];
}

/**
 * Default promotion criteria based on task requirements:
 * - 5+ interactions
 * - 80% success rate  
 * - Declining help usage
 */
export const DEFAULT_PROMOTION_CRITERIA: PromotionCriteria = {
  minInteractions: 5,
  minSuccessRate: 0.8,
  decliningHelpUsage: true,
  timeWindowDays: 30,
};

/**
 * Help Engine - Main Integration Class
 */
export class HelpEngine {
  private contextDetector: ContextDetector;
  private triggerEvaluator: TriggerEvaluator;
  private promotionCriteria: PromotionCriteria;
  private autoTriggerEnabled: boolean;
  private userProfile: UserExpertiseProfile | null = null;

  constructor(config: HelpEngineConfig = {}) {
    this.contextDetector = new ContextDetector(config.contextDetector);
    this.triggerEvaluator = new TriggerEvaluator(config.triggerEngine);
    this.promotionCriteria = { ...DEFAULT_PROMOTION_CRITERIA, ...config.promotionCriteria };
    this.autoTriggerEnabled = config.autoTriggerEnabled ?? true;
  }

  /**
   * Check if help should be shown for the current context
   */
  checkForHelp(featureId?: FeatureId): HelpEngineResult {
    const context = this.contextDetector.getCurrentContext();
    
    // Update feature context if provided
    if (featureId) {
      this.contextDetector.setCurrentFeature(featureId);
    }

    // Check if user is stuck
    const stuckIndicators = this.contextDetector.isUserStuck();
    
    if (stuckIndicators.isStuck && this.autoTriggerEnabled) {
      return {
        shouldShowHelp: true,
        helpLevel: this.determineHelpLevel(stuckIndicators.reason),
        confidence: stuckIndicators.confidence,
        reason: `User appears stuck: ${stuckIndicators.reason}`,
      };
    }

    // Check for error spikes
    const errorSpike = this.contextDetector.detectErrorSpike();
    if (errorSpike.hasSpike && this.autoTriggerEnabled) {
      return {
        shouldShowHelp: true,
        helpLevel: 'interactive',
        confidence: errorSpike.confidence,
        reason: `Error spike detected: ${errorSpike.errorCount} errors`,
      };
    }

    // Check for repeated errors
    const repeatedErrors = this.contextDetector.hasRepeatedErrors(3, 60000);
    if (repeatedErrors.hasRepeatedErrors && this.autoTriggerEnabled) {
      return {
        shouldShowHelp: true,
        helpLevel: 'detail',
        confidence: 0.8,
        reason: `Repeated errors: ${repeatedErrors.errorCode}`,
      };
    }

    // Check user expertise profile for auto-trigger preference
    if (this.userProfile && featureId) {
      const shouldAuto = this.userProfile.shouldAutoTrigger(featureId);
      if (shouldAuto && this.autoTriggerEnabled) {
        const helpLevelResult = this.userProfile.getHelpLevel(featureId);
        return {
          shouldShowHelp: true,
          helpLevel: helpLevelResult.level,
          confidence: helpLevelResult.confidence,
          reason: helpLevelResult.reason,
        };
      }

      // Return help level even if not auto-triggering
      const helpLevelResult = this.userProfile.getHelpLevel(featureId);
      return {
        shouldShowHelp: false,
        helpLevel: helpLevelResult.level,
        confidence: helpLevelResult.confidence,
        reason: 'Auto-trigger disabled or not needed',
      };
    }

    return {
      shouldShowHelp: false,
      helpLevel: 'summary',
      confidence: 0.5,
      reason: 'No help conditions met',
    };
  }

  /**
   * Evaluate triggers against current context
   */
  evaluateTriggers(triggers: HelpTrigger[]): HelpEngineResult {
    const { triggered, suppressed } = this.triggerEvaluator.evaluateAll(triggers);

    if (triggered.length > 0) {
      const highestPriority = triggered[0];
      this.triggerEvaluator.markTriggered(highestPriority.id, this.contextDetector.getCurrentContext());
      
      return {
        shouldShowHelp: true,
        helpLevel: highestPriority.suggestedLevel,
        confidence: 0.9,
        reason: `Trigger fired: ${highestPriority.type}`,
        triggerId: highestPriority.id,
      };
    }

    return {
      shouldShowHelp: false,
      helpLevel: 'summary',
      confidence: 0.5,
      reason: suppressed.length > 0 
        ? `Triggers suppressed: ${suppressed.length}` 
        : 'No triggers matched',
    };
  }

  /**
   * Record a user action
   */
  recordAction(action: UserAction): void {
    this.contextDetector.recordAction(action);
    
    // Update user profile if available
    if (this.userProfile && action.featureId) {
      this.userProfile.updateFeature(action.featureId, action.type);
    }
  }

  /**
   * Record an error
   */
  recordError(error: ErrorEvent): void {
    this.contextDetector.recordError(error);
    
    // Update user profile if available
    if (this.userProfile && error.featureId) {
      this.userProfile.updateFeature(error.featureId, 'error');
    }
  }

  /**
   * Set user expertise profile
   */
  setUserProfile(profileData: UserExpertiseProfileData): void {
    this.userProfile = new UserExpertiseProfileClass(profileData);
  }

  /**
   * Get current user profile
   */
  getUserProfile(): UserExpertiseProfile | null {
    return this.userProfile;
  }

  /**
   * Check for features ready for promotion
   * Based on criteria:
   * - 5+ interactions
   * - 80% success rate
   * - Declining help usage
   */
  checkPromotions(): FeatureExpertise[] {
    if (!this.userProfile) {
      return [];
    }

    return this.userProfile.calculatePromotion(this.promotionCriteria);
  }

  /**
   * Get current help context
   */
  getContext(): HelpContext {
    return this.contextDetector.getCurrentContext();
  }

  /**
   * Mark a help trigger as responded to
   */
  markHelpResponded(triggerId: string): void {
    this.triggerEvaluator.markResponded(triggerId);
  }

  /**
   * Dismiss active help
   */
  dismissHelp(triggerId?: string): void {
    if (triggerId) {
      this.triggerEvaluator.dismissTrigger(triggerId);
    }
  }

  /**
   * Enable/disable auto-trigger
   */
  setAutoTrigger(enabled: boolean): void {
    this.autoTriggerEnabled = enabled;
  }

  /**
   * Update promotion criteria
   */
  setPromotionCriteria(criteria: Partial<PromotionCriteria>): void {
    this.promotionCriteria = { ...this.promotionCriteria, ...criteria };
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.contextDetector.clear();
    this.triggerEvaluator.resetAllCooldowns();
  }

  /**
   * Determine help level based on stuck reason
   */
  private determineHelpLevel(reason: string | null): HelpLevel {
    switch (reason) {
      case 'rapid_clicks':
        return 'interactive'; // User is frustrated, needs guidance
      case 'scroll_confusion':
        return 'detail'; // User is confused about navigation
      case 'no_action':
      default:
        return 'summary'; // User might just be reading
    }
  }
}

export default HelpEngine;
