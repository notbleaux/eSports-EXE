/** [Ver001.000]
 * Adaptive Difficulty System
 * ==========================
 * Dynamically adjusts content difficulty based on user performance.
 * 
 * Features:
 * - Performance-based difficulty adjustment
 * - Challenge calibration
 * - Success rate optimization
 * - Cognitive load integration
 * 
 * Integration:
 * - Uses cognitive load detector for real-time adjustments
 * - Feeds into path generator for path optimization
 * - Tracks performance metrics for long-term adaptation
 */

import type {
  DifficultyLevel,
  ContentId,
  PerformanceMetrics,
  DifficultyAdjustment,
  LearningContent,
  LearningProfile,
} from './types';
import type { CognitiveLoadLevel } from '../types';
import { difficultyToValue, valueToDifficulty } from './pathGenerator';

// ============================================================================
// Configuration
// ============================================================================

/**
 * Difficulty adjustment configuration
 */
export interface AdaptiveDifficultyConfig {
  /** Target success rate (0-1) */
  targetSuccessRate: number;
  /** Success rate tolerance */
  tolerance: number;
  /** Minimum attempts before adjustment */
  minAttempts: number;
  /** Maximum adjustment per evaluation */
  maxAdjustment: number;
  /** Weight of recent performance vs historical */
  recencyWeight: number;
  /** Enable cognitive load integration */
  useCognitiveLoad: boolean;
  /** High load difficulty reduction */
  highLoadReduction: number;
}

export const DEFAULT_DIFFICULTY_CONFIG: AdaptiveDifficultyConfig = {
  targetSuccessRate: 0.75,
  tolerance: 0.1,
  minAttempts: 3,
  maxAdjustment: 1,
  recencyWeight: 0.6,
  useCognitiveLoad: true,
  highLoadReduction: 0.5,
};

// ============================================================================
// Performance Analysis
// ============================================================================

/**
 * Calculate success rate from performance history
 */
export function calculateSuccessRate(
  metrics: PerformanceMetrics[]
): {
  overall: number;
  recent: number;
  trend: 'improving' | 'stable' | 'declining';
  confidence: number;
} {
  if (metrics.length === 0) {
    return { overall: 0.5, recent: 0.5, trend: 'stable', confidence: 0 };
  }
  
  // Overall success rate
  const scores = metrics.map(m => m.score);
  const overall = scores.reduce((a, b) => a + b, 0) / scores.length;
  
  // Recent success rate (last 3 attempts)
  const recentMetrics = metrics.slice(-3);
  const recent = recentMetrics.length > 0
    ? recentMetrics.reduce((sum, m) => sum + m.score, 0) / recentMetrics.length
    : overall;
  
  // Trend analysis
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  if (metrics.length >= 5) {
    const firstHalf = metrics.slice(0, Math.floor(metrics.length / 2));
    const secondHalf = metrics.slice(Math.floor(metrics.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, m) => sum + m.score, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, m) => sum + m.score, 0) / secondHalf.length;
    
    const diff = secondAvg - firstAvg;
    if (diff > 0.15) trend = 'improving';
    else if (diff < -0.15) trend = 'declining';
  }
  
  // Confidence based on sample size
  const confidence = Math.min(0.95, metrics.length / 10);
  
  return { overall, recent, trend, confidence };
}

/**
 * Calculate completion efficiency
 */
export function calculateEfficiency(
  metrics: PerformanceMetrics[],
  expectedTime: number
): {
  timeEfficiency: number;
  attemptEfficiency: number;
  helpEfficiency: number;
  overall: number;
} {
  if (metrics.length === 0) {
    return { timeEfficiency: 1, attemptEfficiency: 1, helpEfficiency: 1, overall: 1 };
  }
  
  // Time efficiency (lower is better, but too fast may indicate it's too easy)
  const avgTime = metrics.reduce((sum, m) => sum + m.completionTime, 0) / metrics.length;
  const timeRatio = avgTime / expectedTime;
  const timeEfficiency = timeRatio > 0.5 && timeRatio < 2 ? 1 : Math.max(0, 1 - Math.abs(1 - timeRatio));
  
  // Attempt efficiency
  const avgAttempts = metrics.reduce((sum, m) => sum + m.attempts, 0) / metrics.length;
  const attemptEfficiency = Math.max(0, 1 - (avgAttempts - 1) * 0.3);
  
  // Help efficiency (less help is better, but some help is normal)
  const avgHelp = metrics.reduce((sum, m) => sum + m.helpRequests, 0) / metrics.length;
  const helpEfficiency = Math.max(0, 1 - Math.max(0, avgHelp - 1) * 0.2);
  
  const overall = (timeEfficiency + attemptEfficiency + helpEfficiency) / 3;
  
  return { timeEfficiency, attemptEfficiency, helpEfficiency, overall };
}

/**
 * Detect frustration patterns
 */
export function detectFrustration(
  metrics: PerformanceMetrics[]
): {
  isFrustrated: boolean;
  frustrationLevel: number;
  indicators: string[];
} {
  if (metrics.length < 2) {
    return { isFrustrated: false, frustrationLevel: 0, indicators: [] };
  }
  
  const indicators: string[] = [];
  let frustrationScore = 0;
  
  // Check for declining performance
  const recent = metrics.slice(-3);
  const recentAvg = recent.reduce((sum, m) => sum + m.score, 0) / recent.length;
  
  if (recentAvg < 0.4) {
    frustrationScore += 0.3;
    indicators.push('low_recent_performance');
  }
  
  // Check for multiple attempts
  const highAttempts = metrics.filter(m => m.attempts > 3).length;
  if (highAttempts / metrics.length > 0.5) {
    frustrationScore += 0.25;
    indicators.push('high_attempt_frequency');
  }
  
  // Check for excessive help requests
  const highHelp = metrics.filter(m => m.helpRequests > 3).length;
  if (highHelp / metrics.length > 0.5) {
    frustrationScore += 0.2;
    indicators.push('frequent_help_requests');
  }
  
  // Check for high error rate
  const highError = metrics.filter(m => m.errorRate > 0.5).length;
  if (highError / metrics.length > 0.5) {
    frustrationScore += 0.25;
    indicators.push('high_error_rate');
  }
  
  // Check cognitive load
  const highLoadCount = metrics.filter(m => 
    m.cognitiveLoad === 'high' || m.cognitiveLoad === 'critical'
  ).length;
  if (highLoadCount / metrics.length > 0.5) {
    frustrationScore += 0.25;
    indicators.push('consistently_high_cognitive_load');
  }
  
  return {
    isFrustrated: frustrationScore > 0.5,
    frustrationLevel: frustrationScore,
    indicators,
  };
}

/**
 * Detect boredom patterns (too easy)
 */
export function detectBoredom(
  metrics: PerformanceMetrics[],
  expectedTime: number
): {
  isBored: boolean;
  boredomLevel: number;
  indicators: string[];
} {
  if (metrics.length < 2) {
    return { isBored: false, boredomLevel: 0, indicators: [] };
  }
  
  const indicators: string[] = [];
  let boredomScore = 0;
  
  // Check for very high performance
  const perfectScores = metrics.filter(m => m.score >= 0.95).length;
  if (perfectScores / metrics.length > 0.7) {
    boredomScore += 0.3;
    indicators.push('consistently_perfect_scores');
  }
  
  // Check for very fast completion
  const fastCompletions = metrics.filter(m => 
    m.completionTime < expectedTime * 0.5
  ).length;
  if (fastCompletions / metrics.length > 0.6) {
    boredomScore += 0.25;
    indicators.push('very_fast_completion');
  }
  
  // Check for single attempts
  const singleAttempts = metrics.filter(m => m.attempts === 1).length;
  if (singleAttempts / metrics.length > 0.8) {
    boredomScore += 0.2;
    indicators.push('no_challenge');
  }
  
  // Check for no help needed
  const noHelp = metrics.filter(m => m.helpRequests === 0).length;
  if (noHelp / metrics.length > 0.8) {
    boredomScore += 0.15;
    indicators.push('no_help_needed');
  }
  
  // Check for low cognitive load
  const lowLoadCount = metrics.filter(m => m.cognitiveLoad === 'low').length;
  if (lowLoadCount / metrics.length > 0.8) {
    boredomScore += 0.1;
    indicators.push('consistently_low_cognitive_load');
  }
  
  return {
    isBored: boredomScore > 0.5,
    boredomLevel: boredomScore,
    indicators,
  };
}

// ============================================================================
// Difficulty Adjustment
// ============================================================================

/**
 * Calculate difficulty adjustment
 */
export function calculateDifficultyAdjustment(
  currentDifficulty: DifficultyLevel,
  metrics: PerformanceMetrics[],
  cognitiveLoad: CognitiveLoadLevel,
  config: Partial<AdaptiveDifficultyConfig> = {}
): DifficultyAdjustment {
  const mergedConfig = { ...DEFAULT_DIFFICULTY_CONFIG, ...config };
  
  // Check if we have enough data
  if (metrics.length < mergedConfig.minAttempts) {
    return {
      currentDifficulty,
      recommendedDifficulty: currentDifficulty,
      confidence: 0.3,
      reason: 'Insufficient data for adjustment',
      adjustmentFactor: 0,
      nextContentRecommendation: [],
    };
  }
  
  const currentValue = difficultyToValue(currentDifficulty);
  
  // Calculate success rate
  const { overall: successRate, recent: recentSuccess, trend } = calculateSuccessRate(metrics);
  
  // Detect emotional states
  const frustration = detectFrustration(metrics);
  const boredom = detectBoredom(metrics, 600); // Default 10 min expected
  
  // Calculate adjustment
  let adjustment = 0;
  let reason = '';
  
  if (frustration.isFrustrated) {
    // Reduce difficulty when frustrated
    adjustment = -Math.min(
      mergedConfig.maxAdjustment,
      frustration.frustrationLevel * 0.8
    );
    reason = `Reducing difficulty due to frustration (${frustration.indicators.join(', ')})`;
  } else if (boredom.isBored) {
    // Increase difficulty when bored
    adjustment = Math.min(
      mergedConfig.maxAdjustment,
      boredom.boredomLevel * 0.8
    );
    reason = `Increasing difficulty due to lack of challenge (${boredom.indicators.join(', ')})`;
  } else {
    // Standard adjustment based on success rate
    const target = mergedConfig.targetSuccessRate;
    const diff = successRate - target;
    
    if (Math.abs(diff) > mergedConfig.tolerance) {
      adjustment = Math.sign(diff) * Math.min(
        mergedConfig.maxAdjustment * 0.5,
        Math.abs(diff)
      );
      reason = `Adjusting to optimize success rate (${(successRate * 100).toFixed(0)}% vs target ${(target * 100).toFixed(0)}%)`;
    } else {
      reason = 'Current difficulty is optimal';
    }
  }
  
  // Apply cognitive load adjustment
  if (mergedConfig.useCognitiveLoad) {
    if (cognitiveLoad === 'high' || cognitiveLoad === 'critical') {
      adjustment -= mergedConfig.highLoadReduction;
      reason += '; additional reduction due to high cognitive load';
    } else if (cognitiveLoad === 'low' && adjustment < 0) {
      // Reduce the negative adjustment if load is low
      adjustment *= 0.7;
    }
  }
  
  // Calculate new difficulty
  let newValue = currentValue + adjustment;
  newValue = Math.max(1, Math.min(4, newValue));
  
  const recommendedDifficulty = valueToDifficulty(newValue);
  
  // Calculate confidence
  const confidence = Math.min(0.95, 
    0.4 + (metrics.length / 20) * 0.3 + (frustration.isFrustrated || boredom.isBored ? 0.2 : 0)
  );
  
  return {
    currentDifficulty,
    recommendedDifficulty,
    confidence,
    reason,
    adjustmentFactor: adjustment,
    nextContentRecommendation: [], // Would be populated by recommendation engine
  };
}

/**
 * Get optimal content difficulty for user
 */
export function getOptimalDifficultyForUser(
  profile: LearningProfile,
  contentHistory: Map<ContentId, PerformanceMetrics[]>,
  cognitiveLoad: CognitiveLoadLevel
): DifficultyLevel {
  // Start from profile preference
  let baseValue = difficultyToValue(profile.preferredDifficulty);
  
  // Analyze recent performance across all content
  const allMetrics: PerformanceMetrics[] = [];
  contentHistory.forEach((metrics) => {
    allMetrics.push(...metrics);
  });
  
  if (allMetrics.length >= DEFAULT_DIFFICULTY_CONFIG.minAttempts) {
    const adjustment = calculateDifficultyAdjustment(
      profile.preferredDifficulty,
      allMetrics,
      cognitiveLoad
    );
    baseValue = difficultyToValue(adjustment.recommendedDifficulty);
  }
  
  // Adjust for pace preference
  if (profile.pacePreference === 'fast') {
    baseValue += 0.3;
  } else if (profile.pacePreference === 'slow') {
    baseValue -= 0.3;
  }
  
  return valueToDifficulty(baseValue);
}

/**
 * Calibrate challenge level
 */
export function calibrateChallenge(
  targetChallenge: number, // 0-1, where 0 is easy, 1 is hard
  currentPerformance: PerformanceMetrics[],
  availableContent: LearningContent[]
): {
  recommendedDifficulty: DifficultyLevel;
  challengeMatch: number;
  suggestedContent: LearningContent[];
} {
  // Map target challenge to difficulty
  const targetDifficultyValue = 1 + targetChallenge * 3; // 1-4 range
  
  // Adjust based on performance
  const { overall: successRate } = calculateSuccessRate(currentPerformance);
  const adjustment = (successRate - 0.5) * 0.5;
  const adjustedValue = Math.max(1, Math.min(4, targetDifficultyValue + adjustment));
  
  const recommendedDifficulty = valueToDifficulty(adjustedValue);
  
  // Calculate how well we can match this challenge level
  const matchingContent = availableContent.filter(c => 
    Math.abs(difficultyToValue(c.difficulty) - adjustedValue) < 0.5
  );
  const challengeMatch = matchingContent.length / availableContent.length;
  
  // Sort by closest match to target
  const suggestedContent = availableContent
    .map(c => ({
      content: c,
      distance: Math.abs(difficultyToValue(c.difficulty) - adjustedValue),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 5)
    .map(c => c.content);
  
  return {
    recommendedDifficulty,
    challengeMatch,
    suggestedContent,
  };
}

// ============================================================================
// Real-time Adaptation
// ============================================================================

/**
 * Suggest real-time difficulty adjustment during content
 */
export function suggestRealtimeAdjustment(
  currentMetrics: Partial<PerformanceMetrics>,
  sessionDuration: number,
  expectedDuration: number
): {
  shouldAdjust: boolean;
  suggestion: 'continue' | 'simplify' | 'hint' | 'skip' | 'extra_time';
  reason: string;
} {
  const suggestions: Array<{ suggestion: 'continue' | 'simplify' | 'hint' | 'skip' | 'extra_time'; reason: string; priority: number }> = [];
  
  // Check time spent
  const timeRatio = sessionDuration / expectedDuration;
  if (timeRatio > 2) {
    suggestions.push({
      suggestion: 'simplify',
      reason: 'Taking significantly longer than expected',
      priority: 3,
    });
  } else if (timeRatio > 1.5) {
    suggestions.push({
      suggestion: 'hint',
      reason: 'Taking longer than expected, may need help',
      priority: 2,
    });
  }
  
  // Check error rate
  if (currentMetrics.errorRate && currentMetrics.errorRate > 0.7) {
    suggestions.push({
      suggestion: 'simplify',
      reason: 'High error rate indicates difficulty',
      priority: 4,
    });
  } else if (currentMetrics.errorRate && currentMetrics.errorRate > 0.5) {
    suggestions.push({
      suggestion: 'hint',
      reason: 'Multiple errors suggest need for guidance',
      priority: 2,
    });
  }
  
  // Check help requests
  if (currentMetrics.helpRequests && currentMetrics.helpRequests > 3) {
    suggestions.push({
      suggestion: 'simplify',
      reason: 'Frequent help requests indicate struggle',
      priority: 3,
    });
  }
  
  // Check cognitive load
  if (currentMetrics.cognitiveLoad === 'critical') {
    suggestions.push({
      suggestion: 'extra_time',
      reason: 'Very high cognitive load detected',
      priority: 5,
    });
  } else if (currentMetrics.cognitiveLoad === 'high') {
    suggestions.push({
      suggestion: 'hint',
      reason: 'High cognitive load, may benefit from guidance',
      priority: 2,
    });
  }
  
  // Check attempts
  if (currentMetrics.attempts && currentMetrics.attempts > 5) {
    suggestions.push({
      suggestion: 'skip',
      reason: 'Multiple failed attempts, consider moving on',
      priority: 4,
    });
  }
  
  if (suggestions.length === 0) {
    return {
      shouldAdjust: false,
      suggestion: 'continue',
      reason: 'Progressing well',
    };
  }
  
  // Sort by priority and return highest
  suggestions.sort((a, b) => b.priority - a.priority);
  
  return {
    shouldAdjust: true,
    suggestion: suggestions[0].suggestion,
    reason: suggestions[0].reason,
  };
}

// ============================================================================
// Performance Tracking
// ============================================================================

/**
 * Track performance and update difficulty preference
 */
export function trackAndUpdateDifficulty(
  contentId: ContentId,
  metric: PerformanceMetrics,
  history: PerformanceMetrics[],
  currentPreference: DifficultyLevel
): {
  updatedHistory: PerformanceMetrics[];
  suggestedPreference: DifficultyLevel;
  shouldNotifyUser: boolean;
} {
  // Add new metric to history
  const updatedHistory = [...history, metric].slice(-20); // Keep last 20
  
  // Calculate adjustment
  const adjustment = calculateDifficultyAdjustment(
    currentPreference,
    updatedHistory,
    metric.cognitiveLoad
  );
  
  // Determine if we should notify user
  const shouldNotifyUser = 
    adjustment.currentDifficulty !== adjustment.recommendedDifficulty &&
    adjustment.confidence > 0.7;
  
  return {
    updatedHistory,
    suggestedPreference: adjustment.recommendedDifficulty,
    shouldNotifyUser,
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  DEFAULT_DIFFICULTY_CONFIG,
  calculateSuccessRate,
  calculateEfficiency,
  detectFrustration,
  detectBoredom,
  calculateDifficultyAdjustment,
  getOptimalDifficultyForUser,
  calibrateChallenge,
  suggestRealtimeAdjustment,
  trackAndUpdateDifficulty,
};
