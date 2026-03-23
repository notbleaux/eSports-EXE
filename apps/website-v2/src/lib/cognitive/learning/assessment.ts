/** [Ver001.000]
 * Skill Assessment System
 * =======================
 * Quiz/evaluation system with skill gap identification and learning style detection.
 * 
 * Features:
 * - Multiple assessment types (diagnostic, formative, summative)
 * - Adaptive question selection
 * - Skill gap analysis
 * - Learning style detection
 * - Progress tracking
 * 
 * Integration:
 * - Uses cognitive load data for difficulty adjustment
 * - Feeds into path generator for personalized paths
 * - Tracks progress in user learning profile
 */

import type {
  ContentId,
  SkillId,
  DifficultyLevel,
  LearningStyle,
  QuizQuestion,
  Assessment,
  AssessmentAttempt,
  SkillProficiency,
  SkillGap,
  AssessmentConfig,
  LearningProfile,
  QuestionType,
  ContentType,
} from './types';
import { difficultyToValue, valueToDifficulty } from './pathGenerator';

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_ASSESSMENT_CONFIG: AssessmentConfig = {
  defaultQuestionCount: 10,
  adaptiveQuestionSelection: true,
  showHints: true,
  timeLimitEnabled: false,
  passingScorePercent: 70,
  maxAttempts: 3,
  retakeDelayHours: 24,
};

// ============================================================================
// Question Bank & Generation
// ============================================================================

/**
 * In-memory question bank (in production, this would come from a database)
 */
const questionBank: Map<string, QuizQuestion[]> = new Map();

/**
 * Register questions for a skill
 */
export function registerQuestions(skillId: SkillId, questions: QuizQuestion[]): void {
  questionBank.set(skillId, questions);
}

/**
 * Get questions for a skill
 */
export function getQuestionsForSkill(skillId: SkillId): QuizQuestion[] {
  return questionBank.get(skillId) || [];
}

/**
 * Generate sample questions for testing
 */
export function generateSampleQuestions(
  skillId: SkillId,
  count: number = 5,
  difficulty: DifficultyLevel = 'intermediate'
): QuizQuestion[] {
  const questions: QuizQuestion[] = [];
  const types: QuestionType[] = ['multiple_choice', 'true_false', 'fill_in_blank'];
  
  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    const points = difficultyToValue(difficulty) * 10;
    
    questions.push({
      id: `${skillId}-q${i}`,
      type,
      question: `Sample ${difficulty} question ${i + 1} for skill ${skillId}`,
      options: type === 'multiple_choice' ? ['Option A', 'Option B', 'Option C', 'Option D'] : undefined,
      correctAnswer: type === 'true_false' ? 'true' : type === 'multiple_choice' ? 'Option A' : 'answer',
      explanation: `Explanation for question ${i + 1}`,
      points,
      difficulty,
      skills: [skillId],
      hints: ['Hint 1', 'Hint 2'],
      metadata: { skillId },
    });
  }
  
  return questions;
}

// ============================================================================
// Assessment Creation
// ============================================================================

/**
 * Create a diagnostic assessment for skill gap analysis
 */
export function createDiagnosticAssessment(
  skills: SkillId[],
  config: Partial<AssessmentConfig> = {}
): Assessment {
  const mergedConfig = { ...DEFAULT_ASSESSMENT_CONFIG, ...config };
  const questions: QuizQuestion[] = [];
  
  // Get questions for each skill at different difficulty levels
  for (const skillId of skills) {
    const skillQuestions = getQuestionsForSkill(skillId);
    
    // Select questions across difficulty levels
    const difficulties: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced'];
    for (const diff of difficulties) {
      const diffQuestions = skillQuestions.filter(q => q.difficulty === diff);
      if (diffQuestions.length > 0) {
        questions.push(diffQuestions[0]);
      }
    }
  }
  
  // Limit to configured count
  const selectedQuestions = questions.slice(0, mergedConfig.defaultQuestionCount);
  
  const totalPoints = selectedQuestions.reduce((sum, q) => sum + q.points, 0);
  
  return {
    id: `diagnostic-${Date.now()}`,
    name: 'Skill Diagnostic Assessment',
    description: 'Comprehensive assessment to identify your current skill levels',
    type: 'diagnostic',
    questions: selectedQuestions,
    totalPoints,
    timeLimitMinutes: selectedQuestions.length * 2,
    skillsAssessed: skills,
    passingScore: Math.floor(totalPoints * mergedConfig.passingScorePercent / 100),
    allowRetake: true,
    maxAttempts: mergedConfig.maxAttempts,
  };
}

/**
 * Create a placement assessment
 */
export function createPlacementAssessment(
  subjectSkills: SkillId[],
  config: Partial<AssessmentConfig> = {}
): Assessment {
  const questions: QuizQuestion[] = [];
  
  // Get questions across all difficulty levels
  for (const skillId of subjectSkills) {
    const skillQuestions = getQuestionsForSkill(skillId);
    questions.push(...skillQuestions.slice(0, 2));
  }
  
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  
  return {
    id: `placement-${Date.now()}`,
    name: 'Placement Assessment',
    description: 'Determine your optimal starting level',
    type: 'placement',
    questions: questions.slice(0, 15),
    totalPoints,
    timeLimitMinutes: 30,
    skillsAssessed: subjectSkills,
    passingScore: Math.floor(totalPoints * 0.6),
    allowRetake: false,
  };
}

/**
 * Create a formative assessment (check understanding during learning)
 */
export function createFormativeAssessment(
  contentId: ContentId,
  skillIds: SkillId[],
  difficulty: DifficultyLevel = 'intermediate'
): Assessment {
  const questions: QuizQuestion[] = [];
  
  for (const skillId of skillIds) {
    const skillQuestions = getQuestionsForSkill(skillId).filter(
      q => q.difficulty === difficulty
    );
    questions.push(...skillQuestions.slice(0, 2));
  }
  
  const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
  
  return {
    id: `formative-${contentId}-${Date.now()}`,
    name: 'Knowledge Check',
    description: 'Quick check of your understanding',
    type: 'formative',
    questions: questions.slice(0, 5),
    totalPoints,
    timeLimitMinutes: 10,
    skillsAssessed: skillIds,
    passingScore: Math.floor(totalPoints * 0.8),
    allowRetake: true,
    maxAttempts: 2,
  };
}

// ============================================================================
// Assessment Attempt Management
// ============================================================================

/**
 * Start an assessment attempt
 */
export function startAssessment(
  assessment: Assessment,
  userId: string,
  adaptive: boolean = true
): AssessmentAttempt {
  let questions = [...assessment.questions];
  
  // Shuffle questions if adaptive
  if (adaptive) {
    questions = shuffleArray(questions);
  }
  
  return {
    id: `attempt-${Date.now()}`,
    assessmentId: assessment.id,
    userId,
    startedAt: Date.now(),
    status: 'in_progress',
    answers: {},
    totalScore: 0,
    percentageScore: 0,
    passed: false,
    skillResults: {},
    cognitiveLoad: 'low',
  };
}

/**
 * Record an answer
 */
export function recordAnswer(
  attempt: AssessmentAttempt,
  questionId: string,
  answer: unknown,
  timeSpent: number,
  hintsUsed: number = 0
): AssessmentAttempt {
  const updated = { ...attempt };
  
  updated.answers[questionId] = {
    answer,
    timeSpent,
    hintsUsed,
    points: 0,
  };
  
  return updated;
}

/**
 * Submit and grade an assessment
 */
export function submitAssessment(
  attempt: AssessmentAttempt,
  assessment: Assessment
): AssessmentAttempt {
  const updated = { ...attempt };
  updated.status = 'completed';
  updated.completedAt = Date.now();
  
  let totalScore = 0;
  const skillScores: Record<SkillId, number[]> = {};
  
  // Grade each answer
  for (const question of assessment.questions) {
    const answer = updated.answers[question.id];
    if (!answer) continue;
    
    const isCorrect = gradeAnswer(question, answer.answer);
    const points = isCorrect ? question.points : 0;
    
    answer.correct = isCorrect;
    answer.points = points;
    totalScore += points;
    
    // Track scores by skill
    for (const skillId of question.skills) {
      if (!skillScores[skillId]) skillScores[skillId] = [];
      skillScores[skillId].push(isCorrect ? 1 : 0);
    }
  }
  
  updated.totalScore = totalScore;
  updated.percentageScore = assessment.totalPoints > 0 
    ? (totalScore / assessment.totalPoints) * 100 
    : 0;
  updated.passed = totalScore >= assessment.passingScore;
  
  // Calculate skill results
  for (const skillId of assessment.skillsAssessed) {
    const scores = skillScores[skillId] || [0];
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    
    updated.skillResults[skillId] = {
      score: avgScore,
      level: Math.floor(avgScore * 100),
    };
  }
  
  return updated;
}

/**
 * Grade an individual answer
 */
function gradeAnswer(question: QuizQuestion, answer: unknown): boolean {
  switch (question.type) {
    case 'multiple_choice':
    case 'true_false':
    case 'fill_in_blank':
      return String(answer).toLowerCase() === String(question.correctAnswer).toLowerCase();
    
    case 'matching':
    case 'ordering':
      return JSON.stringify(answer) === JSON.stringify(question.correctAnswer);
    
    case 'short_answer':
      // Simple contains check for short answers
      return String(answer).toLowerCase().includes(String(question.correctAnswer).toLowerCase());
    
    default:
      return false;
  }
}

// ============================================================================
// Skill Gap Analysis
// ============================================================================

/**
 * Analyze skill gaps from assessment results
 */
export function analyzeSkillGapsFromAssessment(
  attempt: AssessmentAttempt,
  assessment: Assessment,
  targetLevel: DifficultyLevel = 'intermediate'
): SkillGap[] {
  const gaps: SkillGap[] = [];
  const targetLevelValue = difficultyToValue(targetLevel) * 25;
  
  for (const skillId of assessment.skillsAssessed) {
    const result = attempt.skillResults[skillId];
    if (!result) continue;
    
    const currentLevel = result.level;
    
    if (currentLevel < targetLevelValue) {
      const gap = targetLevelValue - currentLevel;
      
      gaps.push({
        skillId,
        requiredLevel: targetLevelValue,
        currentLevel,
        gap,
        priority: determineGapPriority(gap, targetLevelValue),
        estimatedTimeToClose: estimateTimeToClose(gap),
      });
    }
  }
  
  // Sort by priority
  gaps.sort((a, b) => {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
  
  return gaps;
}

function determineGapPriority(
  gap: number, 
  targetLevel: number
): SkillGap['priority'] {
  const gapPercent = gap / targetLevel;
  
  if (gapPercent >= 0.5) return 'critical';
  if (gapPercent >= 0.3) return 'high';
  if (gapPercent >= 0.15) return 'medium';
  return 'low';
}

function estimateTimeToClose(gap: number): number {
  // Estimate ~5 minutes per point of gap
  return Math.min(gap * 5, 480); // Cap at 8 hours
}

// ============================================================================
// Learning Style Detection
// ============================================================================

/**
 * Learning style preference indicators
 */
interface StyleIndicator {
  visual: number;
  auditory: number;
  reading: number;
  kinesthetic: number;
}

/**
 * Detect learning style from user behavior
 */
export function detectLearningStyle(
  contentInteractions: Array<{
    contentType: ContentType;
    timeSpent: number;
    completionRate: number;
    rating?: number;
  }>
): { style: LearningStyle; confidence: number; indicators: StyleIndicator } {
  const indicators: StyleIndicator = {
    visual: 0,
    auditory: 0,
    reading: 0,
    kinesthetic: 0,
  };
  
  for (const interaction of contentInteractions) {
    const weight = interaction.completionRate * (interaction.rating || 3) / 3;
    
    switch (interaction.contentType) {
      case 'video':
        indicators.visual += interaction.timeSpent * weight;
        indicators.auditory += interaction.timeSpent * weight * 0.8;
        break;
      case 'article':
        indicators.reading += interaction.timeSpent * weight;
        break;
      case 'interactive':
        indicators.kinesthetic += interaction.timeSpent * weight;
        indicators.visual += interaction.timeSpent * weight * 0.5;
        break;
      case 'exercise':
      case 'project':
        indicators.kinesthetic += interaction.timeSpent * weight;
        break;
      case 'quiz':
        indicators.reading += interaction.timeSpent * weight * 0.5;
        indicators.kinesthetic += interaction.timeSpent * weight * 0.3;
        break;
    }
  }
  
  // Normalize indicators
  const total = Object.values(indicators).reduce((a, b) => a + b, 0);
  if (total > 0) {
    indicators.visual /= total;
    indicators.auditory /= total;
    indicators.reading /= total;
    indicators.kinesthetic /= total;
  }
  
  // Determine dominant style
  const entries = Object.entries(indicators) as [keyof StyleIndicator, number][];
  entries.sort((a, b) => b[1] - a[1]);
  
  const [dominant, dominantScore] = entries[0];
  const [, secondScore] = entries[1];
  
  // If top two are close, it's mixed
  let style: LearningStyle;
  if (dominantScore - secondScore < 0.15) {
    style = 'mixed';
  } else {
    style = dominant;
  }
  
  // Confidence based on data quantity and clarity
  const confidence = Math.min(0.95, 
    0.3 + (total / 3600) * 0.4 + (dominantScore - secondScore) * 0.3
  );
  
  return { style, confidence, indicators };
}

/**
 * Get content type recommendations for learning style
 */
export function getRecommendedContentTypes(
  style: LearningStyle
): ContentType[] {
  const recommendations: Record<LearningStyle, ContentType[]> = {
    visual: ['video', 'interactive', 'article', 'quiz', 'exercise', 'project'],
    auditory: ['video', 'article', 'interactive', 'quiz', 'exercise', 'project'],
    reading: ['article', 'quiz', 'exercise', 'video', 'interactive', 'project'],
    kinesthetic: ['exercise', 'project', 'interactive', 'quiz', 'video', 'article'],
    mixed: ['interactive', 'video', 'exercise', 'article', 'quiz', 'project'],
  };
  
  return recommendations[style];
}

// ============================================================================
// Progress Tracking
// ============================================================================

/**
 * Calculate skill proficiency from multiple assessments
 */
export function calculateSkillProficiency(
  skillId: SkillId,
  attempts: AssessmentAttempt[],
  contentCompletions: Array<{ contentId: string; score: number }>
): SkillProficiency {
  const relevantAttempts = attempts.filter(a => 
    skillId in a.skillResults
  );
  
  // Get most recent assessment score
  const latestAttempt = relevantAttempts.sort((a, b) => 
    (b.completedAt || 0) - (a.completedAt || 0)
  )[0];
  
  const assessmentScore = latestAttempt?.skillResults[skillId]?.level || 0;
  
  // Factor in content completion scores
  const completionScore = contentCompletions.length > 0
    ? contentCompletions.reduce((sum, c) => sum + c.score, 0) / contentCompletions.length
    : 0;
  
  // Weighted average (60% assessment, 40% completion) - only weight if we have completions
  const level = contentCompletions.length > 0
    ? Math.round(assessmentScore * 0.6 + completionScore * 0.4)
    : assessmentScore;
  
  // Build history
  const history = relevantAttempts.map(a => ({
    level: a.skillResults[skillId]?.level || 0,
    timestamp: a.completedAt || a.startedAt,
    source: a.assessmentId,
  }));
  
  // Add content completion as history entries
  for (const completion of contentCompletions) {
    history.push({
      level: completion.score,
      timestamp: Date.now(), // Should use actual completion time
      source: 'content-completion',
    });
  }
  
  history.sort((a, b) => a.timestamp - b.timestamp);
  
  return {
    skillId,
    level,
    confidence: Math.min(0.95, 0.5 + relevantAttempts.length * 0.1),
    assessedAt: latestAttempt?.completedAt || Date.now(),
    assessedVia: 'system',
    history,
  };
}

/**
 * Track learning progress over time
 */
export function trackProgress(
  userId: string,
  skillId: SkillId,
  assessments: AssessmentAttempt[],
  contentCompletions: Array<{ contentId: string; completedAt: number }>
): {
  currentLevel: number;
  levelChange: number;
  trend: 'improving' | 'stable' | 'declining';
  estimatedTimeToNextLevel: number;
} {
  const proficiency = calculateSkillProficiency(skillId, assessments, []);
  
  // Calculate trend
  const history = proficiency.history;
  let trend: 'improving' | 'stable' | 'declining' = 'stable';
  
  if (history.length >= 3) {
    const recent = history.slice(-3);
    const firstAvg = recent[0].level;
    const lastAvg = recent[recent.length - 1].level;
    
    if (lastAvg > firstAvg + 10) {
      trend = 'improving';
    } else if (lastAvg < firstAvg - 10) {
      trend = 'declining';
    }
  }
  
  // Calculate level change
  let levelChange = 0;
  if (history.length >= 2) {
    levelChange = history[history.length - 1].level - history[0].level;
  }
  
  // Estimate time to next level (25-point increments)
  const nextLevel = Math.min(100, Math.ceil(proficiency.level / 25) * 25);
  const pointsToNext = nextLevel - proficiency.level;
  
  // Estimate based on recent progress rate
  let estimatedTimeToNextLevel = 0;
  if (history.length >= 2 && levelChange > 0) {
    const timeSpan = history[history.length - 1].timestamp - history[0].timestamp;
    const progressRate = levelChange / (timeSpan / (1000 * 60 * 60)); // points per hour
    estimatedTimeToNextLevel = progressRate > 0 ? pointsToNext / progressRate : 0;
  } else {
    estimatedTimeToNextLevel = pointsToNext * 30; // Default: 30 min per point
  }
  
  return {
    currentLevel: proficiency.level,
    levelChange,
    trend,
    estimatedTimeToNextLevel,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// Export
// ============================================================================

export default {
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
};
