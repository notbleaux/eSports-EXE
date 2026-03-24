/** [Ver001.000]
 * Recommendation Engine
 * =====================
 * AI-powered content recommendations and resource curation.
 * 
 * Features:
 * - Content recommendations based on user profile
 * - Next step suggestions
 * - Resource curation
 * - Spaced repetition system
 * 
 * Integration:
 * - Uses knowledge graph for related content
 * - Adapts to cognitive load
 * - Integrates with learning paths
 */

import type {
  ContentId,
  SkillId,
  DifficultyLevel,
  LearningContent,
  LearningProfile,
  ContentRecommendation,
  RecommendationType,
  SpacedRepetitionItem,
  LearningPath,
  PathProgress,
  AssessmentAttempt,
  RecommendationConfig,
  SkillGap,
} from './types';
import type { CognitiveLoadLevel } from '../types';
import { difficultyToValue, valueToDifficulty } from './pathGenerator';

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationConfig = {
  maxRecommendations: 5,
  minConfidenceThreshold: 0.6,
  diversityFactor: 0.3,
  recencyWeight: 0.2,
  skillGapWeight: 0.4,
  interestWeight: 0.4,
  enableSpacedRepetition: true,
  enableSocialRecommendations: false,
};

// ============================================================================
// Content Scoring
// ============================================================================

/**
 * Score content for recommendation
 */
export function scoreContentForRecommendation(
  content: LearningContent,
  profile: LearningProfile,
  skillGaps: SkillGap[],
  recentContentIds: Set<ContentId>,
  config: RecommendationConfig
): {
  score: number;
  factors: Record<string, number>;
} {
  const factors: Record<string, number> = {};
  
  // Skill gap relevance
  const relevantGaps = skillGaps.filter(gap => 
    content.skills.includes(gap.skillId)
  );
  const gapScore = relevantGaps.length > 0 
    ? relevantGaps.reduce((sum, g) => sum + g.gap, 0) / (skillGaps.length * 100)
    : 0;
  factors.skillGap = gapScore * config.skillGapWeight;
  
  // Interest match
  const interestScore = profile.interests.some(i => 
    content.tags.includes(i) || content.title.toLowerCase().includes(i.toLowerCase())
  ) ? 1 : 0.3;
  factors.interest = interestScore * config.interestWeight;
  
  // Difficulty match
  const profileDifficulty = difficultyToValue(profile.preferredDifficulty);
  const contentDifficulty = difficultyToValue(content.difficulty);
  const difficultyMatch = 1 - Math.abs(profileDifficulty - contentDifficulty) / 3;
  factors.difficulty = difficultyMatch * 0.2;
  
  // Content type preference
  const typeIndex = profile.preferredContentTypes.indexOf(content.type);
  const typeScore = typeIndex !== -1 
    ? 1 - typeIndex / profile.preferredContentTypes.length 
    : 0.2;
  factors.contentType = typeScore * 0.15;
  
  // Recency penalty (avoid recently viewed)
  const recencyPenalty = recentContentIds.has(content.id) ? -0.3 : 0;
  factors.recency = recencyPenalty * config.recencyWeight;
  
  // Diversity bonus (different from recent content)
  const diversityScore = recentContentIds.has(content.id) ? 0 : 1;
  factors.diversity = diversityScore * config.diversityFactor;
  
  const totalScore = Object.values(factors).reduce((sum, v) => sum + v, 0);
  
  return { score: totalScore, factors };
}

// ============================================================================
// Recommendation Generation
// ============================================================================

/**
 * Generate content recommendations
 */
export function generateRecommendations(
  profile: LearningProfile,
  contentLibrary: LearningContent[],
  skillGaps: SkillGap[],
  recentContentIds: ContentId[],
  currentPath?: LearningPath,
  pathProgress?: PathProgress,
  config: Partial<RecommendationConfig> = {}
): ContentRecommendation[] {
  const mergedConfig = { ...DEFAULT_RECOMMENDATION_CONFIG, ...config };
  const recentSet = new Set(recentContentIds);
  
  // Score all content
  const scoredContent = contentLibrary.map(content => {
    const { score, factors } = scoreContentForRecommendation(
      content, profile, skillGaps, recentSet, mergedConfig
    );
    return { content, score, factors };
  });
  
  // Sort by score
  scoredContent.sort((a, b) => b.score - a.score);
  
  // Generate recommendations
  const recommendations: ContentRecommendation[] = [];
  const usedTypes = new Set<string>();
  
  for (const { content, score, factors } of scoredContent) {
    if (recommendations.length >= mergedConfig.maxRecommendations) break;
    if (score < mergedConfig.minConfidenceThreshold) continue;
    
    // Ensure diversity in content types
    if (usedTypes.has(content.type) && usedTypes.size < 3) {
      continue;
    }
    
    // Determine recommendation type
    const type = determineRecommendationType(content, skillGaps, currentPath, pathProgress);
    
    // Generate reason
    const reason = generateRecommendationReason(content, factors, profile);
    
    const recommendation: ContentRecommendation = {
      id: `rec-${content.id}-${Date.now()}`,
      type,
      contentId: content.id,
      priority: recommendations.length + 1,
      confidence: Math.min(0.99, score),
      reason,
      context: {
        basedOn: Object.keys(factors).filter(k => factors[k] > 0.1),
        userSkills: content.skills,
        learningStyle: profile.learningStyle,
        cognitiveLoad: 'low', // Will be updated by consumer
      },
    };
    
    recommendations.push(recommendation);
    usedTypes.add(content.type);
  }
  
  return recommendations;
}

/**
 * Generate next step recommendations for active path
 */
export function generateNextSteps(
  path: LearningPath,
  progress: PathProgress,
  contentLibrary: LearningContent[],
  profile: LearningProfile
): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];
  
  // Find current node
  const currentNode = path.nodes[progress.currentNodeIndex];
  if (!currentNode) return recommendations;
  
  // Current node is priority
  const currentContent = contentLibrary.find(c => c.id === currentNode.contentId);
  if (currentContent) {
    recommendations.push({
      id: `rec-next-${currentContent.id}`,
      type: 'next_content',
      contentId: currentContent.id,
      priority: 1,
      confidence: 0.95,
      reason: 'Continue your current learning path',
      context: {
        basedOn: ['current_path'],
        userSkills: currentContent.skills,
        learningStyle: profile.learningStyle,
        cognitiveLoad: 'low',
      },
    });
  }
  
  // Look ahead to next nodes
  const nextNodes = path.nodes.slice(progress.currentNodeIndex + 1, progress.currentNodeIndex + 3);
  for (let i = 0; i < nextNodes.length; i++) {
    const node = nextNodes[i];
    const content = contentLibrary.find(c => c.id === node.contentId);
    if (!content) continue;
    
    recommendations.push({
      id: `rec-ahead-${content.id}`,
      type: i === 0 ? 'next_content' : 'supplemental',
      contentId: content.id,
      priority: i + 2,
      confidence: 0.8 - i * 0.1,
      reason: i === 0 ? 'Up next in your path' : 'Coming up soon',
      context: {
        basedOn: ['path_progress'],
        userSkills: content.skills,
        learningStyle: profile.learningStyle,
        cognitiveLoad: 'low',
      },
    });
  }
  
  return recommendations;
}

/**
 * Generate review recommendations
 */
export function generateReviewRecommendations(
  weakSkills: SkillId[],
  contentLibrary: LearningContent[],
  completedContent: ContentId[],
  profile: LearningProfile
): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];
  
  // Find content related to weak skills
  const reviewContent = contentLibrary.filter(c => 
    c.skills.some(s => weakSkills.includes(s)) &&
    !completedContent.includes(c.id) &&
    c.type !== 'project' // Skip large projects for review
  );
  
  // Sort by difficulty (prefer intermediate for review)
  reviewContent.sort((a, b) => {
    const aDiff = difficultyToValue(a.difficulty);
    const bDiff = difficultyToValue(b.difficulty);
    return Math.abs(2 - aDiff) - Math.abs(2 - bDiff);
  });
  
  for (let i = 0; i < Math.min(3, reviewContent.length); i++) {
    const content = reviewContent[i];
    const relatedSkills = content.skills.filter(s => weakSkills.includes(s));
    
    recommendations.push({
      id: `rec-review-${content.id}`,
      type: 'review',
      contentId: content.id,
      priority: i + 1,
      confidence: 0.75,
      reason: `Strengthen your skills in ${relatedSkills.join(', ')}`,
      context: {
        basedOn: ['weak_skills'],
        userSkills: relatedSkills,
        learningStyle: profile.learningStyle,
        cognitiveLoad: 'low',
      },
    });
  }
  
  return recommendations;
}

/**
 * Generate challenge recommendations
 */
export function generateChallengeRecommendations(
  strongSkills: SkillId[],
  contentLibrary: LearningContent[],
  completedContent: ContentId[],
  profile: LearningProfile
): ContentRecommendation[] {
  const recommendations: ContentRecommendation[] = [];
  
  // Find advanced content for strong skills
  const challengeContent = contentLibrary.filter(c => 
    c.skills.some(s => strongSkills.includes(s)) &&
    !completedContent.includes(c.id) &&
    (c.difficulty === 'advanced' || c.difficulty === 'expert')
  );
  
  for (let i = 0; i < Math.min(2, challengeContent.length); i++) {
    const content = challengeContent[i];
    
    recommendations.push({
      id: `rec-challenge-${content.id}`,
      type: 'challenge',
      contentId: content.id,
      priority: i + 1,
      confidence: 0.7,
      reason: 'Push your skills to the next level',
      context: {
        basedOn: ['strong_skills'],
        userSkills: content.skills,
        learningStyle: profile.learningStyle,
        cognitiveLoad: 'medium',
      },
    });
  }
  
  return recommendations;
}

function determineRecommendationType(
  content: LearningContent,
  skillGaps: SkillGap[],
  currentPath?: LearningPath,
  pathProgress?: PathProgress
): RecommendationType {
  // Check if it's on the current path
  if (currentPath && pathProgress) {
    const nodeIndex = currentPath.nodes.findIndex(n => n.contentId === content.id);
    if (nodeIndex === pathProgress.currentNodeIndex) {
      return 'next_content';
    }
    if (nodeIndex > pathProgress.currentNodeIndex) {
      return 'next_content';
    }
  }
  
  // Check if it addresses a skill gap
  const addressesGap = content.skills.some(s => 
    skillGaps.some(g => g.skillId === s)
  );
  if (addressesGap) {
    return 'next_content';
  }
  
  // Default to supplemental
  return 'supplemental';
}

function generateRecommendationReason(
  content: LearningContent,
  factors: Record<string, number>,
  profile: LearningProfile
): string {
  const topFactors = Object.entries(factors)
    .filter(([, value]) => value > 0.1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([key]) => key);
  
  if (topFactors.includes('skillGap')) {
    return `Helps you master ${content.skills.join(', ')}`;
  }
  
  if (topFactors.includes('interest')) {
    return `Matches your interest in ${profile.interests[0] || 'this topic'}`;
  }
  
  if (topFactors.includes('contentType')) {
    return `${content.type} format suits your ${profile.learningStyle} learning style`;
  }
  
  if (topFactors.includes('difficulty')) {
    return `At your preferred ${content.difficulty} level`;
  }
  
  return 'Recommended based on your learning profile';
}

// ============================================================================
// Spaced Repetition
// ============================================================================

/**
 * SM-2 algorithm parameters
 */
const SM2_DEFAULTS = {
  initialEaseFactor: 2.5,
  minimumEaseFactor: 1.3,
  intervalModifier: 1.0,
};

/**
 * Initialize a spaced repetition item
 */
export function initializeSpacedRepetition(
  contentId: ContentId,
  skillId: SkillId
): SpacedRepetitionItem {
  return {
    contentId,
    skillId,
    interval: 0,
    repetitionCount: 0,
    easeFactor: SM2_DEFAULTS.initialEaseFactor,
    nextReview: Date.now(),
    performance: [],
  };
}

/**
 * Process a review using SM-2 algorithm
 */
export function processReview(
  item: SpacedRepetitionItem,
  performance: number // 0-5, where 0-2 is failure, 3-5 is success
): SpacedRepetitionItem {
  const updated = { ...item };
  updated.performance = [...item.performance, performance];
  updated.lastReview = Date.now();
  
  // Quality thresholds
  const isSuccess = performance >= 3;
  
  if (!isSuccess) {
    // Reset on failure
    updated.repetitionCount = 0;
    updated.interval = 1; // Review tomorrow
  } else {
    // Increment repetition count
    updated.repetitionCount++;
    
    // Calculate new interval
    if (updated.repetitionCount === 1) {
      updated.interval = 1;
    } else if (updated.repetitionCount === 2) {
      updated.interval = 6;
    } else {
      updated.interval = Math.round(updated.interval * updated.easeFactor);
    }
  }
  
  // Update ease factor
  const newEaseFactor = updated.easeFactor + (0.1 - (5 - performance) * (0.08 + (5 - performance) * 0.02));
  updated.easeFactor = Math.max(SM2_DEFAULTS.minimumEaseFactor, newEaseFactor);
  
  // Calculate next review date
  const dayInMs = 24 * 60 * 60 * 1000;
  updated.nextReview = Date.now() + updated.interval * dayInMs;
  
  return updated;
}

/**
 * Get items due for review
 */
export function getDueItems(
  items: SpacedRepetitionItem[],
  limit: number = 10
): SpacedRepetitionItem[] {
  const now = Date.now();
  
  return items
    .filter(item => item.nextReview <= now)
    .sort((a, b) => a.nextReview - b.nextReview)
    .slice(0, limit);
}

/**
 * Get review schedule for upcoming days
 */
export function getReviewSchedule(
  items: SpacedRepetitionItem[],
  days: number = 7
): Record<string, number> {
  const schedule: Record<string, number> = {};
  const now = Date.now();
  const dayInMs = 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < days; i++) {
    const date = new Date(now + i * dayInMs);
    const dateKey = date.toISOString().split('T')[0];
    const dayEnd = now + (i + 1) * dayInMs;
    
    schedule[dateKey] = items.filter(item => 
      item.nextReview <= dayEnd && item.nextReview > now + (i - 1) * dayInMs
    ).length;
  }
  
  return schedule;
}

// ============================================================================
// Resource Curation
// ============================================================================

/**
 * Curate resources for a specific topic
 */
export function curateResources(
  topic: string,
  contentLibrary: LearningContent[],
  profile: LearningProfile,
  maxResults: number = 10
): LearningContent[] {
  // Filter by topic relevance
  const relevantContent = contentLibrary.filter(c => 
    c.title.toLowerCase().includes(topic.toLowerCase()) ||
    c.description.toLowerCase().includes(topic.toLowerCase()) ||
    c.tags.some(t => t.toLowerCase().includes(topic.toLowerCase()))
  );
  
  // Score and sort
  const scored = relevantContent.map(content => {
    let score = 0;
    
    // Exact match bonus
    if (content.title.toLowerCase().includes(topic.toLowerCase())) {
      score += 0.3;
    }
    
    // Difficulty match
    const profileDiff = difficultyToValue(profile.preferredDifficulty);
    const contentDiff = difficultyToValue(content.difficulty);
    score += 0.2 * (1 - Math.abs(profileDiff - contentDiff) / 3);
    
    // Content type preference
    const typeIndex = profile.preferredContentTypes.indexOf(content.type);
    if (typeIndex !== -1) {
      score += 0.2 * (1 - typeIndex / profile.preferredContentTypes.length);
    }
    
    // Quality indicators (would come from metadata in real system)
    score += 0.1;
    
    return { content, score };
  });
  
  scored.sort((a, b) => b.score - a.score);
  
  return scored.slice(0, maxResults).map(s => s.content);
}

/**
 * Generate learning playlist
 */
export function generatePlaylist(
  name: string,
  focusSkills: SkillId[],
  contentLibrary: LearningContent[],
  profile: LearningProfile,
  maxDuration: number = 120 // minutes
): {
  name: string;
  content: LearningContent[];
  totalDuration: number;
  skills: SkillId[];
} {
  const relevantContent = contentLibrary.filter(c => 
    c.skills.some(s => focusSkills.includes(s))
  );
  
  // Sort by difficulty progression
  relevantContent.sort((a, b) => 
    difficultyToValue(a.difficulty) - difficultyToValue(b.difficulty)
  );
  
  // Build playlist within duration limit
  const playlist: LearningContent[] = [];
  let totalDuration = 0;
  
  for (const content of relevantContent) {
    if (totalDuration + content.estimatedTimeMinutes > maxDuration) {
      break;
    }
    playlist.push(content);
    totalDuration += content.estimatedTimeMinutes;
  }
  
  return {
    name,
    content: playlist,
    totalDuration,
    skills: Array.from(new Set(playlist.flatMap(c => c.skills))),
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  DEFAULT_RECOMMENDATION_CONFIG,
  scoreContentForRecommendation,
  generateRecommendations,
  generateNextSteps,
  generateReviewRecommendations,
  generateChallengeRecommendations,
  initializeSpacedRepetition,
  processReview,
  getDueItems,
  getReviewSchedule,
  curateResources,
  generatePlaylist,
};
