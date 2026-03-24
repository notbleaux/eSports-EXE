/** [Ver001.000]
 * Learning Path Types
 * ===================
 * TypeScript interfaces for AI-powered personalized learning paths.
 * 
 * Features:
 * - Learning path structures
 * - Skill assessment types
 * - Progress tracking
 * - Recommendation engine types
 * 
 * Integration:
 * - Works with TL-A3-3-B adaptive UI
 * - Uses TL-A1-1-C knowledge graph
 * - Adapts based on cognitive load
 */

import type { CognitiveLoadLevel } from '../types';

// ============================================================================
// Core Learning Types
// ============================================================================

/**
 * Unique identifier for learning content
 */
export type ContentId = string;

/**
 * Unique identifier for learning paths
 */
export type PathId = string;

/**
 * Unique identifier for skills
 */
export type SkillId = string;

/**
 * Difficulty levels for learning content
 */
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Learning content types
 */
export type ContentType = 
  | 'video' 
  | 'article' 
  | 'quiz' 
  | 'interactive' 
  | 'exercise' 
  | 'project' 
  | 'assessment';

/**
 * Learning style preferences
 */
export type LearningStyle = 'visual' | 'auditory' | 'reading' | 'kinesthetic' | 'mixed';

// ============================================================================
// Skill Definitions
// ============================================================================

/**
 * Individual skill definition
 */
export interface Skill {
  id: SkillId;
  name: string;
  description: string;
  category: string;
  difficulty: DifficultyLevel;
  estimatedTimeMinutes: number;
  prerequisites: SkillId[];
  relatedSkills: SkillId[];
  tags: string[];
  metadata: Record<string, unknown>;
}

/**
 * User's skill proficiency level
 */
export interface SkillProficiency {
  skillId: SkillId;
  level: number; // 0-100
  confidence: number; // 0-1
  assessedAt: number;
  assessedVia: 'quiz' | 'project' | 'self' | 'peer' | 'system';
  history: Array<{
    level: number;
    timestamp: number;
    source: string;
  }>;
}

/**
 * Skill gap analysis result
 */
export interface SkillGap {
  skillId: SkillId;
  requiredLevel: number;
  currentLevel: number;
  gap: number;
  priority: 'critical' | 'high' | 'medium' | 'low';
  estimatedTimeToClose: number; // minutes
}

// ============================================================================
// Learning Content
// ============================================================================

/**
 * Learning content item
 */
export interface LearningContent {
  id: ContentId;
  title: string;
  description: string;
  type: ContentType;
  difficulty: DifficultyLevel;
  estimatedTimeMinutes: number;
  skills: SkillId[];
  prerequisites: ContentId[];
  tags: string[];
  url?: string;
  thumbnailUrl?: string;
  author?: string;
  publishedAt?: number;
  metadata: Record<string, unknown>;
  
  // Content-specific fields
  videoDuration?: number; // seconds
  readingTime?: number; // minutes
  quizQuestions?: number;
  interactivityLevel?: 'low' | 'medium' | 'high';
}

/**
 * Content with personalized metadata
 */
export interface PersonalizedContent extends LearningContent {
  relevanceScore: number;
  difficultyMatch: number;
  estimatedCompletionTime: number;
  recommendedOrder: number;
  reasonForRecommendation: string;
}

// ============================================================================
// Learning Paths
// ============================================================================

/**
 * Learning path goal
 */
export interface LearningGoal {
  id: string;
  name: string;
  description: string;
  targetSkills: SkillId[];
  targetLevel: DifficultyLevel;
  deadline?: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}

/**
 * Node in a learning path
 */
export interface PathNode {
  id: string;
  contentId: ContentId;
  order: number;
  isRequired: boolean;
  unlockRequirements?: {
    previousNodes?: string[];
    skillLevel?: Record<SkillId, number>;
    timeSpent?: number;
  };
  estimatedTimeMinutes: number;
  alternativeNodes?: ContentId[];
}

/**
 * Complete learning path
 */
export interface LearningPath {
  id: PathId;
  name: string;
  description: string;
  goal: LearningGoal;
  nodes: PathNode[];
  totalEstimatedTime: number;
  difficulty: DifficultyLevel;
  createdAt: number;
  updatedAt: number;
  version: number;
  isAdaptive: boolean;
  tags: string[];
}

/**
 * User's progress on a learning path
 */
export interface PathProgress {
  pathId: PathId;
  userId: string;
  startedAt: number;
  completedAt?: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'abandoned';
  currentNodeIndex: number;
  completedNodes: string[];
  totalTimeSpent: number;
  progress: number; // 0-100
  achievements: string[];
  
  // Node-level progress
  nodeProgress: Record<string, {
    status: 'locked' | 'available' | 'in_progress' | 'completed';
    startedAt?: number;
    completedAt?: number;
    timeSpent: number;
    attempts: number;
    score?: number;
  }>;
}

// ============================================================================
// Assessments
// ============================================================================

/**
 * Quiz question types
 */
export type QuestionType = 
  | 'multiple_choice' 
  | 'true_false' 
  | 'fill_in_blank' 
  | 'matching' 
  | 'ordering' 
  | 'short_answer' 
  | 'code';

/**
 * Quiz question
 */
export interface QuizQuestion {
  id: string;
  type: QuestionType;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation: string;
  points: number;
  difficulty: DifficultyLevel;
  skills: SkillId[];
  timeLimit?: number;
  hints?: string[];
  metadata: Record<string, unknown>;
}

/**
 * Quiz/assessment definition
 */
export interface Assessment {
  id: string;
  name: string;
  description: string;
  type: 'diagnostic' | 'formative' | 'summative' | 'placement';
  questions: QuizQuestion[];
  totalPoints: number;
  timeLimitMinutes?: number;
  skillsAssessed: SkillId[];
  passingScore: number;
  allowRetake: boolean;
  maxAttempts?: number;
}

/**
 * Assessment attempt
 */
export interface AssessmentAttempt {
  id: string;
  assessmentId: string;
  userId: string;
  startedAt: number;
  completedAt?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  answers: Record<string, {
    answer: unknown;
    timeSpent: number;
    hintsUsed: number;
    correct?: boolean;
    points: number;
  }>;
  totalScore: number;
  percentageScore: number;
  passed: boolean;
  skillResults: Record<SkillId, {
    score: number;
    level: number;
  }>;
  cognitiveLoad: CognitiveLoadLevel;
}

// ============================================================================
// Recommendations
// ============================================================================

/**
 * Recommendation types
 */
export type RecommendationType = 
  | 'next_content' 
  | 'review' 
  | 'challenge' 
  | 'supplemental' 
  | 'alternative_path' 
  | 'peer_learning';

/**
 * Content recommendation
 */
export interface ContentRecommendation {
  id: string;
  type: RecommendationType;
  contentId: ContentId;
  priority: number;
  confidence: number;
  reason: string;
  context: {
    basedOn: string[];
    userSkills: SkillId[];
    learningStyle: LearningStyle;
    cognitiveLoad: CognitiveLoadLevel;
  };
  expiresAt?: number;
}

/**
 * Spaced repetition item
 */
export interface SpacedRepetitionItem {
  contentId: ContentId;
  skillId: SkillId;
  interval: number; // days
  repetitionCount: number;
  easeFactor: number;
  nextReview: number;
  lastReview?: number;
  performance: number[]; // scores over time
}

// ============================================================================
// Learning Profile
// ============================================================================

/**
 * User learning profile
 */
export interface LearningProfile {
  userId: string;
  learningStyle: LearningStyle;
  preferredDifficulty: DifficultyLevel;
  preferredContentTypes: ContentType[];
  availableTimePerDay: number; // minutes
  preferredTimeOfDay: string[];
  pacePreference: 'slow' | 'moderate' | 'fast';
  motivationFactors: string[];
  challenges: string[];
  
  // Analytics
  strengths: SkillId[];
  weaknesses: SkillId[];
  interests: string[];
  
  // Adaptive data
  averageSessionLength: number;
  bestPerformanceTime: string;
  engagementPattern: 'consistent' | 'sporadic' | 'intensive';
  completionRate: number;
}

/**
 * Learning analytics
 */
export interface LearningAnalytics {
  userId: string;
  totalTimeSpent: number;
  contentCompleted: number;
  assessmentsTaken: number;
  averageScore: number;
  streakDays: number;
  longestStreak: number;
  currentStreak: number;
  skillsAcquired: number;
  pathsCompleted: number;
  
  // Time-based metrics
  dailyStats: Record<string, {
    timeSpent: number;
    contentCompleted: number;
    score: number;
  }>;
  
  // Engagement metrics
  sessionCount: number;
  averageSessionDuration: number;
  returnRate: number;
}

// ============================================================================
// Achievements
// ============================================================================

/**
 * Achievement definition
 */
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'skill' | 'progress' | 'engagement' | 'social' | 'special';
  criteria: {
    type: string;
    threshold: number;
    condition?: Record<string, unknown>;
  };
  points: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

/**
 * User achievement
 */
export interface UserAchievement {
  achievementId: string;
  earnedAt: number;
  progress: number;
  completed: boolean;
}

// ============================================================================
// Adaptive Difficulty
// ============================================================================

/**
 * Performance metrics for difficulty adjustment
 */
export interface PerformanceMetrics {
  contentId: ContentId;
  userId: string;
  completionTime: number;
  score: number;
  attempts: number;
  helpRequests: number;
  errorRate: number;
  cognitiveLoad: CognitiveLoadLevel;
  timestamp: number;
}

/**
 * Difficulty adjustment result
 */
export interface DifficultyAdjustment {
  currentDifficulty: DifficultyLevel;
  recommendedDifficulty: DifficultyLevel;
  confidence: number;
  reason: string;
  adjustmentFactor: number;
  nextContentRecommendation: ContentId[];
}

// ============================================================================
// Configuration
// ============================================================================

/**
 * Path generator configuration
 */
export interface PathGeneratorConfig {
  maxPathLength: number;
  minPathLength: number;
  defaultDifficulty: DifficultyLevel;
  enableAlternatives: boolean;
  maxAlternativesPerNode: number;
  prerequisiteStrictness: 'strict' | 'flexible' | 'minimal';
  timeBudgetMinutes?: number;
  skillWeight: number;
  difficultyWeight: number;
  interestWeight: number;
}

/**
 * Assessment configuration
 */
export interface AssessmentConfig {
  defaultQuestionCount: number;
  adaptiveQuestionSelection: boolean;
  showHints: boolean;
  timeLimitEnabled: boolean;
  passingScorePercent: number;
  maxAttempts: number;
  retakeDelayHours: number;
}

/**
 * Recommendation engine configuration
 */
export interface RecommendationConfig {
  maxRecommendations: number;
  minConfidenceThreshold: number;
  diversityFactor: number;
  recencyWeight: number;
  skillGapWeight: number;
  interestWeight: number;
  enableSpacedRepetition: boolean;
  enableSocialRecommendations: boolean;
}

// ============================================================================
// Events
// ============================================================================

/**
 * Learning event types
 */
export type LearningEventType =
  | 'content_started'
  | 'content_completed'
  | 'content_abandoned'
  | 'assessment_started'
  | 'assessment_completed'
  | 'skill_leveled_up'
  | 'path_completed'
  | 'achievement_earned'
  | 'difficulty_adjusted';

/**
 * Learning event
 */
export interface LearningEvent {
  id: string;
  type: LearningEventType;
  userId: string;
  timestamp: number;
  data: Record<string, unknown>;
  cognitiveLoad?: CognitiveLoadLevel;
}
