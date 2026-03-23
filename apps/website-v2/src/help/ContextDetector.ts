/** [Ver001.000] */
/**
 * Context Detector
 * ================
 * Detects user context and behavior patterns to determine when help is needed.
 * 
 * Features:
 * - Detect stuck users based on inactivity and behavior patterns
 * - Identify error spikes and repeated errors
 * - Monitor rapid clicks and scroll confusion
 * - Calculate help context from user actions
 * 
 * @example
 * ```typescript
 * const detector = new ContextDetector();
 * 
 * // Record user actions
 * detector.recordAction({ type: 'click', featureId: 'analytics', timestamp: new Date() });
 * 
 * // Check if user is stuck
 * if (detector.isUserStuck()) {
 *   showHelp(detector.getCurrentContext());
 * }
 * ```
 */

import type {
  HelpContext,
  UserAction,
  ErrorEvent,
  FeatureId,
  ContextDetectorConfig,
  StuckBehaviorIndicators,
  ErrorSpikeIndicators,
  RepeatedErrorPattern,
} from '@sator/types/help';

export { ContextDetectorConfig, StuckBehaviorIndicators, ErrorSpikeIndicators, RepeatedErrorPattern };

/**
 * Default configuration for context detection
 */
export const DEFAULT_CONFIG: ContextDetectorConfig = {
  stuckThreshold: 30000,        // 30 seconds of inactivity
  errorSpikeThreshold: 3,       // 3 errors
  rapidClickThreshold: 5,       // 5 rapid clicks
  rapidClickWindow: 3000,       // in 3 seconds
  errorSpikeWindow: 60000,      // in 60 seconds
  scrollConfusionThreshold: 10, // 10 direction changes
  scrollConfusionWindow: 10000, // in 10 seconds
  actionWeight: 0.3,
  errorWeight: 0.4,
  timeWeight: 0.2,
  helpRequestWeight: 0.1,
};

/**
 * Context Detector Class
 * Monitors user behavior to detect when help intervention is needed
 */
export class ContextDetector {
  private config: ContextDetectorConfig;
  private actions: UserAction[] = [];
  private errors: ErrorEvent[] = [];
  private lastActionTime: Date | null = null;
  private scrollDirections: Array<{ timestamp: number; direction: 'up' | 'down' }> = [];
  private currentFeature: FeatureId | undefined;
  private currentPage: string = window.location.pathname;

  constructor(config: Partial<ContextDetectorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.setupListeners();
  }

  /**
   * Setup DOM event listeners for scroll detection
   */
  private setupListeners(): void {
    if (typeof window === 'undefined') return;

    let lastScrollY = window.scrollY;
    let scrollTimeout: ReturnType<typeof setTimeout> | null = null;

    window.addEventListener('scroll', () => {
      const currentScrollY = window.scrollY;
      const direction = currentScrollY > lastScrollY ? 'down' : 'up';
      
      // Debounce rapid scroll events
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }

      scrollTimeout = setTimeout(() => {
        this.scrollDirections.push({
          timestamp: Date.now(),
          direction,
        });

        // Keep only recent scroll events
        const cutoff = Date.now() - this.config.scrollConfusionWindow;
        this.scrollDirections = this.scrollDirections.filter(
          s => s.timestamp > cutoff
        );
      }, 50);

      lastScrollY = currentScrollY;
    }, { passive: true });
  }

  /**
   * Get the current help context based on recent activity
   */
  getCurrentContext(): HelpContext {
    const now = new Date();
    const recentActions = this.getRecentActions(60000); // Last minute
    const recentErrors = this.getRecentErrors(60000);

    return {
      userId: this.getUserId(),
      currentPage: this.currentPage,
      currentFeature: this.currentFeature,
      timestamp: now,
      recentActions,
      recentErrors,
    };
  }

  /**
   * Check if the user appears to be stuck
   * Returns stuck indicators with confidence score
   */
  isUserStuck(threshold?: number): StuckBehaviorIndicators {
    const stuckThreshold = threshold || this.config.stuckThreshold;
    const now = Date.now();

    // Check 1: No action for extended period
    if (this.lastActionTime) {
      const timeSinceAction = now - this.lastActionTime.getTime();
      if (timeSinceAction > stuckThreshold) {
        return {
          isStuck: true,
          reason: 'no_action',
          confidence: Math.min(timeSinceAction / (stuckThreshold * 2), 1.0),
        };
      }
    }

    // Check 2: Rapid clicking (frustration indicator)
    const rapidClicks = this.detectRapidClicks();
    if (rapidClicks) {
      return {
        isStuck: true,
        reason: 'rapid_clicks',
        confidence: 0.8,
      };
    }

    // Check 3: Scroll confusion (indecision)
    const scrollConfusion = this.detectScrollConfusion();
    if (scrollConfusion) {
      return {
        isStuck: true,
        reason: 'scroll_confusion',
        confidence: 0.7,
      };
    }

    return {
      isStuck: false,
      reason: null,
      confidence: 0,
    };
  }

  /**
   * Check for repeated errors within a time window
   */
  hasRepeatedErrors(count: number, window: number): RepeatedErrorPattern {
    const now = Date.now();
    const cutoff = now - window;

    // Count errors in window
    const recentErrors = this.errors.filter(e => e.timestamp.getTime() > cutoff);
    
    if (recentErrors.length < count) {
      return {
        hasRepeatedErrors: false,
        errorCode: null,
        count: recentErrors.length,
        isRecoverable: true,
      };
    }

    // Find most common error code
    const errorCounts = new Map<string, number>();
    recentErrors.forEach(e => {
      errorCounts.set(e.code, (errorCounts.get(e.code) || 0) + 1);
    });

    let mostCommonCode: string | null = null;
    let maxCount = 0;
    
    errorCounts.forEach((cnt, code) => {
      if (cnt > maxCount) {
        maxCount = cnt;
        mostCommonCode = code;
      }
    });

    // Check if errors are recoverable
    const hasUnrecoverable = recentErrors.some(e => !e.recoverable);

    return {
      hasRepeatedErrors: maxCount >= count,
      errorCode: mostCommonCode,
      count: recentErrors.length,
      isRecoverable: !hasUnrecoverable,
    };
  }

  /**
   * Detect if there's an error spike
   */
  detectErrorSpike(): ErrorSpikeIndicators {
    const window = this.config.errorSpikeWindow;
    const now = Date.now();
    const cutoff = now - window;

    const recentErrors = this.errors.filter(e => e.timestamp.getTime() > cutoff);
    const hasSpike = recentErrors.length >= this.config.errorSpikeThreshold;

    return {
      hasSpike,
      errorCount: recentErrors.length,
      timeWindow: window,
      confidence: Math.min(recentErrors.length / (this.config.errorSpikeThreshold * 2), 1.0),
    };
  }

  /**
   * Record a user action for context tracking
   */
  recordAction(action: UserAction): void {
    this.actions.push(action);
    this.lastActionTime = action.timestamp;
    
    if (action.featureId) {
      this.currentFeature = action.featureId;
    }

    // Clean old actions (keep last 100)
    if (this.actions.length > 100) {
      this.actions = this.actions.slice(-100);
    }
  }

  /**
   * Record an error event
   */
  recordError(error: ErrorEvent): void {
    this.errors.push(error);
    
    if (error.featureId) {
      this.currentFeature = error.featureId;
    }

    // Clean old errors (keep last 50)
    if (this.errors.length > 50) {
      this.errors = this.errors.slice(-50);
    }
  }

  /**
   * Set the current feature being used
   */
  setCurrentFeature(featureId: FeatureId): void {
    this.currentFeature = featureId;
  }

  /**
   * Update current page
   */
  setCurrentPage(page: string): void {
    this.currentPage = page;
  }

  /**
   * Clear all recorded data
   */
  clear(): void {
    this.actions = [];
    this.errors = [];
    this.scrollDirections = [];
    this.lastActionTime = null;
  }

  // Private helper methods

  private getRecentActions(windowMs: number): UserAction[] {
    const cutoff = Date.now() - windowMs;
    return this.actions.filter(a => a.timestamp.getTime() > cutoff);
  }

  private getRecentErrors(windowMs: number): ErrorEvent[] {
    const cutoff = Date.now() - windowMs;
    return this.errors.filter(e => e.timestamp.getTime() > cutoff);
  }

  private detectRapidClicks(): boolean {
    const now = Date.now();
    const cutoff = now - this.config.rapidClickWindow;
    
    const recentClicks = this.actions.filter(
      a => a.type === 'click' && a.timestamp.getTime() > cutoff
    );

    return recentClicks.length >= this.config.rapidClickThreshold;
  }

  private detectScrollConfusion(): boolean {
    if (this.scrollDirections.length < this.config.scrollConfusionThreshold) {
      return false;
    }

    // Count direction changes
    let directionChanges = 0;
    for (let i = 1; i < this.scrollDirections.length; i++) {
      if (this.scrollDirections[i].direction !== this.scrollDirections[i - 1].direction) {
        directionChanges++;
      }
    }

    return directionChanges >= this.config.scrollConfusionThreshold;
  }

  private getUserId(): string {
    // TODO: Replace with actual user ID from auth store
    if (typeof localStorage !== 'undefined') {
      return localStorage.getItem('userId') || 'anonymous';
    }
    return 'anonymous';
  }
}

export default ContextDetector;
