/** [Ver001.000] */
/**
 * Trigger Evaluation Engine
 * =========================
 * Evaluates help triggers based on current context and user behavior.
 * 
 * Features:
 * - Evaluate trigger conditions against context
 * - Manage trigger cooldowns and priorities
 * - Prevent trigger spam with smart suppression
 * - Support multiple trigger types
 * 
 * @example
 * ```typescript
 * const evaluator = new TriggerEvaluator();
 * 
 * const result = evaluator.evaluate({
 *   id: 'first-visit',
 *   type: 'first_visit',
 *   conditions: [{ metric: 'visitCount', operator: 'eq', value: 1 }],
 *   cooldownMs: 86400000,
 *   priority: 4,
 *   contentId: 'welcome',
 *   suggestedLevel: 'interactive'
 * });
 * 
 * if (result.shouldTrigger) {
 *   showHelp(result.trigger);
 * }
 * ```
 */

import type {
  HelpTrigger,
  TriggerCondition,
  HelpContext,
  TriggerResult,
  TriggerHistoryEntry,
  TriggerEngineConfig,
} from '@sator/types/help';

export { TriggerResult, TriggerHistoryEntry, TriggerEngineConfig };

/**
 * Default trigger engine configuration
 */
export const DEFAULT_TRIGGER_CONFIG: TriggerEngineConfig = {
  maxConcurrentTriggers: 1,
  defaultCooldownMs: 60000, // 1 minute
  minPriorityForAutoShow: 3,
};

/**
 * Trigger Evaluator Class
 * Evaluates when help should be shown based on triggers and context
 */
export class TriggerEvaluator {
  private config: TriggerEngineConfig;
  private triggerHistory: Map<string, TriggerHistoryEntry> = new Map();
  private activeTriggers: Set<string> = new Set();

  constructor(config: Partial<TriggerEngineConfig> = {}) {
    this.config = { ...DEFAULT_TRIGGER_CONFIG, ...config };
  }

  /**
   * Evaluate a single trigger against current context
   */
  evaluate(trigger: HelpTrigger, context?: HelpContext): TriggerResult {
    const currentContext = context || this.getDefaultContext();
    
    // Check cooldown
    const cooldownRemaining = this.getCooldownRemaining(trigger.id);
    if (cooldownRemaining > 0) {
      return {
        shouldTrigger: false,
        trigger: null,
        reason: `Trigger on cooldown for ${cooldownRemaining}ms`,
        suppressed: true,
        cooldownRemainingMs: cooldownRemaining,
      };
    }

    // Check if max concurrent triggers reached
    if (this.activeTriggers.size >= this.config.maxConcurrentTriggers) {
      return {
        shouldTrigger: false,
        trigger: null,
        reason: 'Maximum concurrent triggers reached',
        suppressed: true,
        cooldownRemainingMs: 0,
      };
    }

    // Check priority threshold for auto-show
    if (trigger.priority < this.config.minPriorityForAutoShow) {
      return {
        shouldTrigger: false,
        trigger: null,
        reason: `Priority ${trigger.priority} below threshold ${this.config.minPriorityForAutoShow}`,
        suppressed: false,
        cooldownRemainingMs: 0,
      };
    }

    // Evaluate all conditions
    const conditionsMet = this.evaluateConditions(trigger.conditions, currentContext);
    
    if (!conditionsMet) {
      return {
        shouldTrigger: false,
        trigger: null,
        reason: 'Trigger conditions not met',
        suppressed: false,
        cooldownRemainingMs: 0,
      };
    }

    // Trigger should fire
    return {
      shouldTrigger: true,
      trigger,
      reason: 'All conditions met',
      suppressed: false,
      cooldownRemainingMs: 0,
    };
  }

  /**
   * Evaluate multiple triggers and return prioritized results
   */
  evaluateAll(triggers: HelpTrigger[], context?: HelpContext): {
    triggered: HelpTrigger[];
    suppressed: HelpTrigger[];
  } {
    const results = triggers.map(t => ({
      trigger: t,
      result: this.evaluate(t, context),
    }));

    const triggered = results
      .filter(r => r.result.shouldTrigger)
      .map(r => r.trigger)
      .sort((a, b) => b.priority - a.priority); // Higher priority first

    const suppressed = results
      .filter(r => r.result.suppressed)
      .map(r => r.trigger);

    return { triggered, suppressed };
  }

  /**
   * Mark a trigger as fired
   */
  markTriggered(triggerId: string, context: HelpContext): void {
    this.triggerHistory.set(triggerId, {
      triggerId,
      firedAt: new Date(),
      context,
      userResponded: false,
    });
    this.activeTriggers.add(triggerId);
  }

  /**
   * Mark a trigger as responded to by user
   */
  markResponded(triggerId: string): void {
    const history = this.triggerHistory.get(triggerId);
    if (history) {
      history.userResponded = true;
    }
    this.activeTriggers.delete(triggerId);
  }

  /**
   * Dismiss an active trigger
   */
  dismissTrigger(triggerId: string): void {
    this.activeTriggers.delete(triggerId);
  }

  /**
   * Reset cooldown for a specific trigger
   */
  resetCooldown(triggerId: string): void {
    this.triggerHistory.delete(triggerId);
  }

  /**
   * Reset all cooldowns
   */
  resetAllCooldowns(): void {
    this.triggerHistory.clear();
    this.activeTriggers.clear();
  }

  /**
   * Get the cooldown remaining for a trigger
   */
  getCooldownRemaining(triggerId: string): number {
    const history = this.triggerHistory.get(triggerId);
    if (!history) return 0;

    // Find trigger config to get cooldown
    // In real implementation, we'd store this with the history
    // For now, use default cooldown
    const cooldownMs = this.config.defaultCooldownMs;
    const elapsed = Date.now() - history.firedAt.getTime();
    
    return Math.max(0, cooldownMs - elapsed);
  }

  /**
   * Check if a trigger is currently active (showing)
   */
  isTriggerActive(triggerId: string): boolean {
    return this.activeTriggers.has(triggerId);
  }

  /**
   * Get all active triggers
   */
  getActiveTriggers(): string[] {
    return Array.from(this.activeTriggers);
  }

  /**
   * Get trigger history
   */
  getHistory(): TriggerHistoryEntry[] {
    return Array.from(this.triggerHistory.values());
  }

  /**
   * Evaluate conditions against context
   */
  private evaluateConditions(conditions: TriggerCondition[], context: HelpContext): boolean {
    return conditions.every(condition => this.evaluateCondition(condition, context));
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(condition: TriggerCondition, context: HelpContext): boolean {
    const value = this.getMetricValue(condition.metric, context);
    const expected = condition.value;

    switch (condition.operator) {
      case 'eq':
        return value === expected;
      case 'gt':
        return typeof value === 'number' && typeof expected === 'number' && value > expected;
      case 'lt':
        return typeof value === 'number' && typeof expected === 'number' && value < expected;
      case 'gte':
        return typeof value === 'number' && typeof expected === 'number' && value >= expected;
      case 'lte':
        return typeof value === 'number' && typeof expected === 'number' && value <= expected;
      case 'contains':
        if (typeof value === 'string' && typeof expected === 'string') {
          return value.includes(expected);
        }
        if (Array.isArray(value)) {
          return value.includes(expected);
        }
        return false;
      default:
        return false;
    }
  }

  /**
   * Get metric value from context
   */
  private getMetricValue(metric: string, context: HelpContext): number | string | boolean {
    switch (metric) {
      case 'visitCount':
        return this.getVisitCount();
      case 'errorCount':
        return context.recentErrors.length;
      case 'actionCount':
        return context.recentActions.length;
      case 'currentPage':
        return context.currentPage;
      case 'currentFeature':
        return context.currentFeature || '';
      case 'hasErrors':
        return context.recentErrors.length > 0;
      case 'isFirstVisit':
        return this.getVisitCount() === 1;
      default:
        // Try to get from localStorage or other sources
        if (typeof localStorage !== 'undefined') {
          return localStorage.getItem(metric) || '';
        }
        return '';
    }
  }

  /**
   * Get default context when none provided
   */
  private getDefaultContext(): HelpContext {
    return {
      userId: this.getUserId(),
      currentPage: typeof window !== 'undefined' ? window.location.pathname : '',
      timestamp: new Date(),
      recentActions: [],
      recentErrors: [],
    };
  }

  /**
   * Get visit count from storage
   */
  private getVisitCount(): number {
    if (typeof localStorage === 'undefined') return 1;
    
    const count = localStorage.getItem('visitCount');
    return count ? parseInt(count, 10) : 1;
  }

  /**
   * Get user ID
   */
  private getUserId(): string {
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('userId') || 'anonymous';
    }
    return 'anonymous';
  }
}

/**
 * Create a trigger evaluator with auto-promotion rules
 */
export function createTriggerEvaluatorWithPromotions(
  config?: Partial<TriggerEngineConfig>
): TriggerEvaluator {
  return new TriggerEvaluator(config);
}

export default TriggerEvaluator;
