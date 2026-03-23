/** [Ver001.000]
 * Learning Path System Index
 * ==========================
 * Centralized exports for AI-powered personalized learning paths.
 * 
 * Components:
 * - Path Generator: Create personalized learning paths
 * - Assessment: Skill evaluation and gap analysis
 * - Recommendations: Content suggestions and spaced repetition
 * - Difficulty: Adaptive difficulty adjustment
 * 
 * Integration:
 * - Works with TL-A3-3-B adaptive UI
 * - Uses TL-A1-1-C knowledge graph
 * - Adapts based on cognitive load
 * 
 * @module lib/cognitive/learning
 */

// ============================================================================
// Types
// ============================================================================

export type {
  // Core
  ContentId,
  PathId,
  SkillId,
  DifficultyLevel,
  ContentType,
  LearningStyle,
  
  // Skills
  Skill,
  SkillProficiency,
  SkillGap,
  
  // Content
  LearningContent,
  PersonalizedContent,
  
  // Paths
  LearningGoal,
  PathNode,
  LearningPath,
  PathProgress,
  
  // Assessment
  QuestionType,
  QuizQuestion,
  Assessment,
  AssessmentAttempt,
  
  // Recommendations
  RecommendationType,
  ContentRecommendation,
  SpacedRepetitionItem,
  
  // Profile
  LearningProfile,
  LearningAnalytics,
  
  // Achievements
  Achievement,
  UserAchievement,
  
  // Performance
  PerformanceMetrics,
  DifficultyAdjustment,
  
  // Configuration
  PathGeneratorConfig,
  AssessmentConfig,
  RecommendationConfig,
  
  // Events
  LearningEventType,
  LearningEvent,
} from './types';

// ============================================================================
// Path Generator
// ============================================================================

export {
  DEFAULT_PATH_CONFIG,
  difficultyToValue,
  valueToDifficulty,
  calculateDifficultyProgression,
  getOptimalDifficulty,
  checkPrerequisites,
  analyzeSkillGaps,
  buildPrerequisiteChain,
  scoreContent,
  calculatePathQuality,
  generatePath,
  generateAlternativePaths,
  optimizePath,
} from './pathGenerator';

export type { } from './pathGenerator';

// ============================================================================
// Assessment
// ============================================================================

export {
  DEFAULT_ASSESSMENT_CONFIG,
  registerQuestions,
  getQuestionsForSkill,
  generateSampleQuestions,
  createDiagnosticAssessment,
  createPlacementAssessment,
  createFormativeAssessment,
  startAssessment,
  recordAnswer,
  submitAssessment,
  analyzeSkillGapsFromAssessment,
  detectLearningStyle,
  getRecommendedContentTypes,
  calculateSkillProficiency,
  trackProgress,
} from './assessment';

export type { } from './assessment';

// ============================================================================
// Recommendations
// ============================================================================

export {
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
} from './recommendations';

export type { } from './recommendations';

// ============================================================================
// Adaptive Difficulty
// ============================================================================

export {
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
} from './difficulty';

export type { 
  AdaptiveDifficultyConfig 
} from './difficulty';

// ============================================================================
// Default Export
// ============================================================================

import pathGenerator from './pathGenerator';
import assessment from './assessment';
import recommendations from './recommendations';
import difficulty from './difficulty';

export const learning = {
  pathGenerator,
  assessment,
  recommendations,
  difficulty,
};

export default learning;
