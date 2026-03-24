/** [Ver001.000]
 * Learning Path Generator
 * =======================
 * AI-powered personalized learning path generation.
 * 
 * Features:
 * - Generate paths based on user goals and current skills
 * - Prerequisite analysis and validation
 * - Difficulty progression algorithms
 * - Alternative path suggestions
 * 
 * Integration:
 * - Uses TL-A1-1-C knowledge graph for skill relationships
 * - Adapts based on cognitive load from TL-A3-3-A
 * - Integrates with recommendation engine
 */

import type {
  ContentId,
  PathId,
  SkillId,
  DifficultyLevel,
  LearningGoal,
  LearningPath,
  PathNode,
  LearningContent,
  SkillProficiency,
  SkillGap,
  PathGeneratorConfig,
  LearningProfile,
  ContentType,
} from './types';

// ============================================================================
// Default Configuration
// ============================================================================

export const DEFAULT_PATH_CONFIG: PathGeneratorConfig = {
  maxPathLength: 20,
  minPathLength: 3,
  defaultDifficulty: 'beginner',
  enableAlternatives: true,
  maxAlternativesPerNode: 2,
  prerequisiteStrictness: 'flexible',
  skillWeight: 0.4,
  difficultyWeight: 0.3,
  interestWeight: 0.3,
};

// ============================================================================
// Difficulty Utilities
// ============================================================================

const DIFFICULTY_LEVELS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
const DIFFICULTY_VALUES: Record<DifficultyLevel, number> = {
  beginner: 1,
  intermediate: 2,
  advanced: 3,
  expert: 4,
};

/**
 * Convert difficulty level to numeric value
 */
export function difficultyToValue(level: DifficultyLevel): number {
  return DIFFICULTY_VALUES[level];
}

/**
 * Convert numeric value to difficulty level
 */
export function valueToDifficulty(value: number): DifficultyLevel {
  const clamped = Math.max(1, Math.min(4, Math.round(value)));
  return DIFFICULTY_LEVELS[clamped - 1];
}

/**
 * Calculate difficulty progression for a path
 */
export function calculateDifficultyProgression(
  startDifficulty: DifficultyLevel,
  endDifficulty: DifficultyLevel,
  steps: number
): DifficultyLevel[] {
  const start = difficultyToValue(startDifficulty);
  const end = difficultyToValue(endDifficulty);
  const progression: DifficultyLevel[] = [];
  
  for (let i = 0; i < steps; i++) {
    const ratio = steps === 1 ? 1 : i / (steps - 1);
    const value = start + (end - start) * ratio;
    progression.push(valueToDifficulty(value));
  }
  
  return progression;
}

/**
 * Get optimal difficulty for user based on their profile and recent performance
 */
export function getOptimalDifficulty(
  profile: LearningProfile,
  recentPerformance?: { score: number; difficulty: DifficultyLevel }[]
): DifficultyLevel {
  let baseDifficulty = difficultyToValue(profile.preferredDifficulty);
  
  // Adjust based on recent performance
  if (recentPerformance && recentPerformance.length >= 3) {
    const avgScore = recentPerformance.reduce((sum, p) => sum + p.score, 0) / recentPerformance.length;
    
    if (avgScore > 0.9) {
      baseDifficulty += 0.5; // Too easy, increase
    } else if (avgScore < 0.6) {
      baseDifficulty -= 0.5; // Too hard, decrease
    }
  }
  
  // Adjust based on pace preference
  if (profile.pacePreference === 'fast') {
    baseDifficulty += 0.3;
  } else if (profile.pacePreference === 'slow') {
    baseDifficulty -= 0.3;
  }
  
  return valueToDifficulty(baseDifficulty);
}

// ============================================================================
// Prerequisite Analysis
// ============================================================================

/**
 * Check if prerequisites are satisfied
 */
export function checkPrerequisites(
  content: LearningContent,
  userSkills: Map<SkillId, SkillProficiency>,
  completedContent: Set<ContentId>,
  strictness: 'strict' | 'flexible' | 'minimal' = 'flexible'
): {
  satisfied: boolean;
  missingSkills: SkillId[];
  missingContent: ContentId[];
  readiness: number; // 0-1
} {
  const missingSkills: SkillId[] = [];
  const missingContent: ContentId[] = [];
  
  // Check skill prerequisites
  for (const skillId of content.skills) {
    const proficiency = userSkills.get(skillId);
    if (!proficiency || proficiency.level < 50) {
      missingSkills.push(skillId);
    }
  }
  
  // Check content prerequisites
  for (const prereqId of content.prerequisites) {
    if (!completedContent.has(prereqId)) {
      missingContent.push(prereqId);
    }
  }
  
  // Calculate readiness based on strictness
  let requiredSkills = content.skills.length;
  let requiredContent = content.prerequisites.length;
  
  let readiness = 1;
  
  switch (strictness) {
    case 'strict':
      readiness = missingSkills.length === 0 && missingContent.length === 0 ? 1 : 0;
      break;
    case 'flexible':
      const skillReadiness = requiredSkills > 0 
        ? 1 - (missingSkills.length / requiredSkills) 
        : 1;
      const contentReadiness = requiredContent > 0 
        ? 1 - (missingContent.length / requiredContent) 
        : 1;
      readiness = (skillReadiness + contentReadiness) / 2;
      break;
    case 'minimal':
      readiness = missingContent.length === 0 ? 1 : 0.5;
      break;
  }
  
  return {
    satisfied: readiness >= 0.7,
    missingSkills,
    missingContent,
    readiness,
  };
}

/**
 * Analyze skill gaps for a goal
 */
export function analyzeSkillGaps(
  goal: LearningGoal,
  userSkills: Map<SkillId, SkillProficiency>,
  contentLibrary: LearningContent[]
): SkillGap[] {
  const gaps: SkillGap[] = [];
  
  for (const skillId of goal.targetSkills) {
    const proficiency = userSkills.get(skillId);
    const targetLevel = difficultyToValue(goal.targetLevel) * 25; // 25, 50, 75, 100
    const currentLevel = proficiency?.level || 0;
    
    if (currentLevel < targetLevel) {
      // Estimate time to close gap based on content
      const relevantContent = contentLibrary.filter(c => 
        c.skills.includes(skillId) && c.difficulty !== 'expert'
      );
      
      const estimatedTime = relevantContent.reduce((sum, c) => 
        sum + c.estimatedTimeMinutes, 0
      );
      
      const gap: SkillGap = {
        skillId,
        requiredLevel: targetLevel,
        currentLevel,
        gap: targetLevel - currentLevel,
        priority: gapToPriority(targetLevel - currentLevel),
        estimatedTimeToClose: Math.min(estimatedTime, 480), // Cap at 8 hours
      };
      
      gaps.push(gap);
    }
  }
  
  // Sort by priority
  const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  
  return gaps;
}

function gapToPriority(gap: number): SkillGap['priority'] {
  if (gap >= 75) return 'critical';
  if (gap >= 50) return 'high';
  if (gap >= 25) return 'medium';
  return 'low';
}

/**
 * Build prerequisite chain for content
 */
export function buildPrerequisiteChain(
  targetContent: ContentId,
  contentLibrary: LearningContent[],
  maxDepth: number = 5
): ContentId[] {
  const chain: ContentId[] = [];
  const visited = new Set<ContentId>();
  const queue: Array<{ id: ContentId; depth: number }> = [{ id: targetContent, depth: 0 }];
  
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    
    if (visited.has(id) || depth > maxDepth) continue;
    visited.add(id);
    
    const content = contentLibrary.find(c => c.id === id);
    if (!content) continue;
    
    // Add prerequisites to chain and queue
    for (const prereqId of content.prerequisites) {
      if (!visited.has(prereqId)) {
        chain.push(prereqId);
        queue.push({ id: prereqId, depth: depth + 1 });
      }
    }
  }
  
  return chain.reverse(); // Return in order: prerequisites first
}

// ============================================================================
// Path Scoring
// ============================================================================

/**
 * Score content for a user
 */
export function scoreContent(
  content: LearningContent,
  profile: LearningProfile,
  config: PathGeneratorConfig,
  targetGoal?: LearningGoal
): number {
  let score = 0;
  
  // Skill relevance (how well does this address skill gaps?)
  if (targetGoal) {
    const skillOverlap = content.skills.filter(s => 
      targetGoal.targetSkills.includes(s)
    ).length;
    score += (skillOverlap / Math.max(content.skills.length, 1)) * config.skillWeight;
  }
  
  // Difficulty match
  const optimalDifficulty = difficultyToValue(profile.preferredDifficulty);
  const contentDifficulty = difficultyToValue(content.difficulty);
  const difficultyDiff = Math.abs(optimalDifficulty - contentDifficulty);
  const difficultyScore = Math.max(0, 1 - difficultyDiff / 3) * config.difficultyWeight;
  score += difficultyScore;
  
  // Content type preference
  const typeIndex = profile.preferredContentTypes.indexOf(content.type);
  if (typeIndex !== -1) {
    score += (1 - typeIndex / profile.preferredContentTypes.length) * config.interestWeight;
  }
  
  // Time fit (prefer content that fits available time)
  const timeFit = profile.availableTimePerDay > 0 
    ? Math.min(1, profile.availableTimePerDay / content.estimatedTimeMinutes)
    : 0.5;
  score += timeFit * 0.2;
  
  return score;
}

/**
 * Calculate path quality score
 */
export function calculatePathQuality(
  nodes: PathNode[],
  contentLibrary: LearningContent[],
  profile: LearningProfile,
  config: PathGeneratorConfig
): {
  totalScore: number;
  avgDifficulty: number;
  variety: number;
  prerequisiteCoverage: number;
  timeEfficiency: number;
} {
  const contents = nodes
    .map(n => contentLibrary.find(c => c.id === n.contentId))
    .filter(Boolean) as LearningContent[];
  
  if (contents.length === 0) {
    return {
      totalScore: 0,
      avgDifficulty: 0,
      variety: 0,
      prerequisiteCoverage: 0,
      timeEfficiency: 0,
    };
  }
  
  // Average difficulty
  const avgDifficulty = contents.reduce((sum, c) => 
    sum + difficultyToValue(c.difficulty), 0
  ) / contents.length;
  
  // Content variety
  const types = new Set(contents.map(c => c.type));
  const variety = types.size / contents.length;
  
  // Prerequisite coverage (check if prerequisites are met in path)
  let prereqMetCount = 0;
  let totalPrereqs = 0;
  const pathContentIds = new Set(contents.map(c => c.id));
  
  for (const content of contents) {
    for (const prereqId of content.prerequisites) {
      totalPrereqs++;
      if (pathContentIds.has(prereqId)) {
        prereqMetCount++;
      }
    }
  }
  
  const prerequisiteCoverage = totalPrereqs > 0 ? prereqMetCount / totalPrereqs : 1;
  
  // Time efficiency
  const totalTime = contents.reduce((sum, c) => sum + c.estimatedTimeMinutes, 0);
  const timeEfficiency = profile.availableTimePerDay > 0 
    ? Math.min(1, profile.availableTimePerDay * 7 / totalTime)
    : 0.5;
  
  // Total quality score
  const totalScore = (
    variety * 0.2 +
    prerequisiteCoverage * 0.3 +
    timeEfficiency * 0.2 +
    (1 - Math.abs(avgDifficulty - difficultyToValue(profile.preferredDifficulty)) / 3) * 0.3
  );
  
  return {
    totalScore,
    avgDifficulty,
    variety,
    prerequisiteCoverage,
    timeEfficiency,
  };
}

// ============================================================================
// Path Generation
// ============================================================================

/**
 * Generate a learning path
 */
export function generatePath(
  goal: LearningGoal,
  profile: LearningProfile,
  contentLibrary: LearningContent[],
  userSkills: Map<SkillId, SkillProficiency>,
  completedContent: Set<ContentId>,
  config: Partial<PathGeneratorConfig> = {}
): LearningPath {
  const mergedConfig = { ...DEFAULT_PATH_CONFIG, ...config };
  
  // Analyze skill gaps
  const skillGaps = analyzeSkillGaps(goal, userSkills, contentLibrary);
  
  // Determine path difficulty progression
  const startDifficulty = profile.preferredDifficulty;
  const endDifficulty = goal.targetLevel;
  
  // Filter available content
  const availableContent = contentLibrary.filter(content => {
    const prereqCheck = checkPrerequisites(
      content, 
      userSkills, 
      completedContent, 
      mergedConfig.prerequisiteStrictness
    );
    return prereqCheck.satisfied && !completedContent.has(content.id);
  });
  
  // Score and sort content
  const scoredContent = availableContent.map(content => ({
    content,
    score: scoreContent(content, profile, mergedConfig, goal),
  })).sort((a, b) => b.score - a.score);
  
  // Build path nodes
  const nodes: PathNode[] = [];
  const usedContent = new Set<ContentId>();
  const targetNodeCount = Math.min(
    mergedConfig.maxPathLength,
    Math.max(mergedConfig.minPathLength, skillGaps.length * 2)
  );
  
  const difficultyProgression = calculateDifficultyProgression(
    startDifficulty,
    endDifficulty,
    targetNodeCount
  );
  
  for (let i = 0; i < targetNodeCount && nodes.length < targetNodeCount; i++) {
    const targetDifficulty = difficultyProgression[i];
    
    // Find best matching content for this position
    const candidates = scoredContent.filter(({ content }) => 
      !usedContent.has(content.id) &&
      Math.abs(difficultyToValue(content.difficulty) - difficultyToValue(targetDifficulty)) <= 1
    );
    
    if (candidates.length === 0) continue;
    
    const bestMatch = candidates[0].content;
    usedContent.add(bestMatch.id);
    
    // Build unlock requirements
    const unlockRequirements: PathNode['unlockRequirements'] = {};
    
    if (i > 0) {
      // Previous nodes must be completed
      const previousNodes = nodes.slice(Math.max(0, i - 2), i);
      unlockRequirements.previousNodes = previousNodes.map(n => n.id);
    }
    
    // Find alternative content
    const alternatives: ContentId[] = [];
    if (mergedConfig.enableAlternatives) {
      for (const { content } of candidates.slice(1, mergedConfig.maxAlternativesPerNode + 1)) {
        alternatives.push(content.id);
      }
    }
    
    const node: PathNode = {
      id: `node-${i}`,
      contentId: bestMatch.id,
      order: i,
      isRequired: i < targetNodeCount * 0.7, // First 70% is required
      unlockRequirements,
      estimatedTimeMinutes: bestMatch.estimatedTimeMinutes,
      alternativeNodes: alternatives.length > 0 ? alternatives : undefined,
    };
    
    nodes.push(node);
  }
  
  // Calculate total time
  const totalEstimatedTime = nodes.reduce((sum, node) => 
    sum + node.estimatedTimeMinutes, 0
  );
  
  // Generate path ID
  const pathId = `path-${goal.id}-${Date.now()}`;
  
  return {
    id: pathId,
    name: generatePathName(goal, profile),
    description: generatePathDescription(goal, skillGaps, nodes.length),
    goal,
    nodes,
    totalEstimatedTime,
    difficulty: startDifficulty,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1,
    isAdaptive: true,
    tags: [...goal.targetSkills, startDifficulty, endDifficulty],
  };
}

/**
 * Generate alternative paths
 */
export function generateAlternativePaths(
  basePath: LearningPath,
  count: number,
  profile: LearningProfile,
  contentLibrary: LearningContent[],
  userSkills: Map<SkillId, SkillProficiency>,
  completedContent: Set<ContentId>
): LearningPath[] {
  const alternatives: LearningPath[] = [];
  const variations = [
    { name: 'Accelerated', factor: 0.7, difficultyOffset: 0.5 },
    { name: 'Comprehensive', factor: 1.3, difficultyOffset: -0.3 },
    { name: 'Practice-Focused', factor: 1.0, contentType: 'exercise' as ContentType },
    { name: 'Video-First', factor: 1.0, contentType: 'video' as ContentType },
  ];
  
  for (let i = 0; i < Math.min(count, variations.length); i++) {
    const variation = variations[i];
    
    const altConfig: Partial<PathGeneratorConfig> = {
      maxPathLength: Math.floor(basePath.nodes.length * variation.factor),
      interestWeight: variation.contentType ? 0.5 : DEFAULT_PATH_CONFIG.interestWeight,
    };
    
    const altPath = generatePath(
      basePath.goal,
      {
        ...profile,
        preferredDifficulty: variation.difficultyOffset 
          ? valueToDifficulty(difficultyToValue(profile.preferredDifficulty) + variation.difficultyOffset)
          : profile.preferredDifficulty,
        ...(variation.contentType && { 
          preferredContentTypes: [variation.contentType, ...profile.preferredContentTypes] 
        }),
      },
      contentLibrary,
      userSkills,
      completedContent,
      altConfig
    );
    
    altPath.name = `${basePath.name} - ${variation.name}`;
    altPath.id = `${basePath.id}-alt-${i}`;
    
    alternatives.push(altPath);
  }
  
  return alternatives;
}

/**
 * Optimize an existing path based on user progress
 */
export function optimizePath(
  path: LearningPath,
  progress: { completedNodes: string[]; strugglingNodes: string[]; fastNodes: string[] },
  contentLibrary: LearningContent[]
): LearningPath {
  const optimized = { ...path };
  const newNodes: PathNode[] = [];
  
  for (const node of path.nodes) {
    // Skip completed nodes
    if (progress.completedNodes.includes(node.id)) {
      continue;
    }
    
    // Add reinforcement for struggling nodes
    if (progress.strugglingNodes.includes(node.id)) {
      const content = contentLibrary.find(c => c.id === node.contentId);
      if (content) {
        // Find easier alternative or add practice content
        const easierContent = contentLibrary.find(c => 
          c.skills.some(s => content.skills.includes(s)) &&
          difficultyToValue(c.difficulty) < difficultyToValue(content.difficulty) &&
          c.type === 'exercise'
        );
        
        if (easierContent) {
          newNodes.push({
            id: `${node.id}-support`,
            contentId: easierContent.id,
            order: newNodes.length,
            isRequired: true,
            estimatedTimeMinutes: easierContent.estimatedTimeMinutes,
          });
        }
      }
    }
    
    // Skip fast nodes or make them optional
    if (progress.fastNodes.includes(node.id)) {
      newNodes.push({
        ...node,
        isRequired: false,
      });
    } else {
      newNodes.push(node);
    }
  }
  
  optimized.nodes = newNodes.map((node, index) => ({
    ...node,
    order: index,
  }));
  
  optimized.totalEstimatedTime = newNodes.reduce((sum, n) => 
    sum + n.estimatedTimeMinutes, 0
  );
  
  optimized.updatedAt = Date.now();
  optimized.version++;
  
  return optimized;
}

// ============================================================================
// Utility Functions
// ============================================================================

function generatePathName(goal: LearningGoal, profile: LearningProfile): string {
  const difficultyLabel = goal.targetLevel.charAt(0).toUpperCase() + goal.targetLevel.slice(1);
  const styleLabel = profile.learningStyle !== 'mixed' 
    ? `${profile.learningStyle.charAt(0).toUpperCase() + profile.learningStyle.slice(1)} ` 
    : '';
  return `${styleLabel}${difficultyLabel} Path: ${goal.name}`;
}

function generatePathDescription(
  goal: LearningGoal, 
  skillGaps: SkillGap[], 
  nodeCount: number
): string {
  const gapCount = skillGaps.length;
  const criticalGaps = skillGaps.filter(g => g.priority === 'critical').length;
  
  let description = `A personalized ${nodeCount}-step learning path to achieve ${goal.name}. `;
  description += `Addresses ${gapCount} skill gaps`;
  
  if (criticalGaps > 0) {
    description += `, including ${criticalGaps} critical priority areas`;
  }
  
  description += '.';
  
  return description;
}

// ============================================================================
// Export
// ============================================================================

export default {
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
};
