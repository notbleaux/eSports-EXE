/** [Ver001.000] */
/**
 * Recommendation Engine
 * =====================
 * Personalized help content recommendation system for the NJZiteGeisTe Platform.
 * Provides intelligent suggestions based on user expertise, learning progress,
 * and identified knowledge gaps.
 */

import type {
  KnowledgeNode,
  PersonalizedRecommendation,
  RecommendationEngineConfig,
  KnowledgeGap,
  LearningPath,
} from '@sator/types/help';
import { DEFAULT_RECOMMENDATION_CONFIG } from '@sator/types/help/knowledgeGraph';

// ============================================================================
// Scored Topic Type
// ============================================================================

interface ScoredTopic {
  node: KnowledgeNode;
  score: number;
  reason: 'prerequisite' | 'next_in_series' | 'related' | 'popular' | 'trending' | 'gap' | 'progression';
  personalizationFactors: {
    expertiseMatch: number;
    historyBoost: number;
    popularityBoost: number;
    noveltyBoost: number;
  };
}

// ============================================================================
// Graph Data Interface (simplified for recommendations)
// ============================================================================

export interface GraphData {
  nodes: KnowledgeNode[];
  edges: Array<{
    source: string;
    target: string;
    type: 'prerequisite' | 'related' | 'next' | 'parent' | 'seealso';
    weight: number;
  }>;
}

// ============================================================================
// User Progress Tracking
// ============================================================================

interface UserProgress {
  completedNodes: Set<string>;
  inProgressNodes: Set<string>;
  nodeScores: Map<string, number>; // nodeId -> comprehension score
  lastAccessed: Map<string, Date>;
  totalTimeSpent: Map<string, number>; // nodeId -> seconds
}

// ============================================================================
// Recommendation Engine Class
// ============================================================================

export class RecommendationEngine {
  private config: RecommendationEngineConfig;
  private graph: GraphData;
  private userProgress: Map<string, UserProgress> = new Map();

  constructor(
    graph: GraphData,
    config: Partial<RecommendationEngineConfig> = {}
  ) {
    this.graph = graph;
    this.config = { ...DEFAULT_RECOMMENDATION_CONFIG, ...config };
  }

  // ==========================================================================
  // Main Recommendation Method
  // ==========================================================================

  /**
   * Generate personalized recommendations based on user context
   */
  recommend(context: import('@sator/types/help').RecommendationContext): PersonalizedRecommendation[] {
    const scoredTopics: ScoredTopic[] = [];

    // Get progression-based recommendations
    const progressionTopics = this.getProgressionTopics(context);
    scoredTopics.push(...progressionTopics);

    // Get expertise gap recommendations
    const gapTopics = this.getExpertiseGapTopics(context);
    scoredTopics.push(...gapTopics);

    // Get related content recommendations
    const relatedTopics = this.getRelatedTopics(context);
    scoredTopics.push(...relatedTopics);

    // Diversify if enabled
    let finalTopics = scoredTopics;
    if (this.config.diversify) {
      finalTopics = this.diversifyRecommendations(scoredTopics);
    }

    // Filter by minimum score
    finalTopics = finalTopics.filter(t => t.score >= this.config.minScore);

    // Sort by score and convert to output format
    const sorted = finalTopics
      .sort((a, b) => b.score - a.score)
      .slice(0, this.config.maxRecommendations);

    return sorted.map(st => this.toPersonalizedRecommendation(st));
  }

  // ==========================================================================
  // Progression-Based Recommendations
  // ==========================================================================

  /**
   * Get recommendations for natural learning progression
   */
  private getProgressionTopics(context: import('@sator/types/help').RecommendationContext): ScoredTopic[] {
    const scored: ScoredTopic[] = [];
    const completedSet = new Set(context.completedNodes);
    
    // Get user's progress
    const progress = this.getUserProgress(context.userId);

    for (const node of this.graph.nodes) {
      // Skip completed nodes
      if (completedSet.has(node.id)) continue;

      // Skip current node
      if (node.id === context.currentNodeId) continue;

      let score = 0;
      const factors = {
        expertiseMatch: 0,
        historyBoost: 0,
        popularityBoost: 0,
        noveltyBoost: 0,
      };

      // Check if this is a "next" node from a completed node
      const nextEdges = this.graph.edges.filter(
        e => e.type === 'next' && completedSet.has(e.source) && e.target === node.id
      );

      for (const edge of nextEdges) {
        score += edge.weight * 10;
        factors.historyBoost += edge.weight;
      }

      // Check if all prerequisites are completed
      const prereqEdges = this.graph.edges.filter(
        e => e.type === 'prerequisite' && e.target === node.id
      );

      const completedPrereqs = prereqEdges.filter(e => completedSet.has(e.source)).length;
      const totalPrereqs = prereqEdges.length;

      if (totalPrereqs > 0) {
        const prereqRatio = completedPrereqs / totalPrereqs;
        
        // Boost if all prerequisites are completed
        if (prereqRatio === 1) {
          score += 15;
          factors.historyBoost += 1;
        } else if (prereqRatio >= 0.5) {
          // Partial boost if some prerequisites are done
          score += prereqRatio * 8;
          factors.historyBoost += prereqRatio * 0.5;
        } else {
          // Penalize if too many prerequisites missing
          score -= (1 - prereqRatio) * 5;
        }
      }

      // Expertise level alignment
      if (this.config.considerExpertise) {
        const difficultyMap = { beginner: 1, intermediate: 3, advanced: 4, expert: 5 };
        const userLevel = difficultyMap[context.userLevel];
        const diff = Math.abs(node.difficulty - userLevel);
        
        if (diff === 0) {
          score += 5;
          factors.expertiseMatch = 1;
        } else if (diff === 1) {
          score += 3;
          factors.expertiseMatch = 0.6;
        } else if (diff >= 3) {
          score -= 3;
          factors.expertiseMatch = 0.2;
        }
      }

      // Novelty boost (content not recently accessed)
      const lastAccessed = progress.lastAccessed.get(node.id);
      if (!lastAccessed) {
        score += 2;
        factors.noveltyBoost = 1;
      } else {
        const daysSinceAccess = (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24);
        if (daysSinceAccess > 30) {
          score += 1;
          factors.noveltyBoost = 0.5;
        }
      }

      if (score > 0) {
        scored.push({
          node,
          score,
          reason: nextEdges.length > 0 ? 'next_in_series' : 'progression',
          personalizationFactors: factors,
        });
      }
    }

    return scored;
  }

  // ==========================================================================
  // Expertise Gap Analysis
  // ==========================================================================

  /**
   * Get recommendations to fill identified knowledge gaps
   */
  private getExpertiseGapTopics(context: import('@sator/types/help').RecommendationContext): ScoredTopic[] {
    const scored: ScoredTopic[] = [];
    const completedSet = new Set(context.completedNodes);

    // Analyze gaps for current node
    if (context.currentNodeId) {
      const gaps = this.identifyKnowledgeGaps(context.currentNodeId, completedSet);

      for (const gap of gaps) {
        const factors = {
          expertiseMatch: 0.8,
          historyBoost: 0.5,
          popularityBoost: 0,
          noveltyBoost: 0,
        };

        // Higher priority gaps get higher scores
        const priorityMultiplier = gap.priority === 'high' ? 3 : gap.priority === 'medium' ? 2 : 1;
        
        for (const missingPrereq of gap.missingPrerequisites) {
          scored.push({
            node: missingPrereq,
            score: 10 * priorityMultiplier,
            reason: 'gap',
            personalizationFactors: factors,
          });
        }
      }
    }

    // Find generally important missing foundations
    const foundationNodes = this.graph.nodes.filter(n => n.difficulty <= 2);
    
    for (const node of foundationNodes) {
      if (!completedSet.has(node.id)) {
        // Check how many advanced nodes depend on this
        const dependentCount = this.graph.edges.filter(
          e => e.type === 'prerequisite' && e.source === node.id && !completedSet.has(e.target)
        ).length;

        if (dependentCount > 0) {
          scored.push({
            node,
            score: dependentCount * 2,
            reason: 'gap',
            personalizationFactors: {
              expertiseMatch: 1,
              historyBoost: 0,
              popularityBoost: dependentCount * 0.1,
              noveltyBoost: 0,
            },
          });
        }
      }
    }

    return scored;
  }

  /**
   * Identify knowledge gaps for a target node
   */
  private identifyKnowledgeGaps(
    targetNodeId: string,
    completedNodes: Set<string>
  ): KnowledgeGap[] {
    const gaps: KnowledgeGap[] = [];
    const targetNode = this.graph.nodes.find(n => n.id === targetNodeId);
    
    if (!targetNode) return gaps;

    // Find all missing prerequisites
    const prereqEdges = this.graph.edges.filter(
      e => e.type === 'prerequisite' && e.target === targetNodeId
    );

    const missingPrereqs: KnowledgeNode[] = [];
    
    for (const edge of prereqEdges) {
      if (!completedNodes.has(edge.source)) {
        const prereqNode = this.graph.nodes.find(n => n.id === edge.source);
        if (prereqNode) {
          missingPrereqs.push(prereqNode);
        }
      }
    }

    if (missingPrereqs.length > 0) {
      // Determine priority based on difficulty and count
      const avgDifficulty = missingPrereqs.reduce((sum, n) => sum + n.difficulty, 0) / missingPrereqs.length;
      
      let priority: 'high' | 'medium' | 'low';
      if (avgDifficulty >= 4 || missingPrereqs.length >= 3) {
        priority = 'high';
      } else if (avgDifficulty >= 2 || missingPrereqs.length >= 2) {
        priority = 'medium';
      } else {
        priority = 'low';
      }

      gaps.push({
        targetNode,
        missingPrerequisites: missingPrereqs,
        priority,
      });
    }

    return gaps;
  }

  // ==========================================================================
  // Related Content Recommendations
  // ==========================================================================

  /**
   * Get recommendations based on related content
   */
  private getRelatedTopics(context: import('@sator/types/help').RecommendationContext): ScoredTopic[] {
    const scored: ScoredTopic[] = [];
    
    if (!context.currentNodeId && context.recentNodes.length === 0) {
      return scored;
    }

    const recentNodeIds = context.currentNodeId 
      ? [context.currentNodeId, ...context.recentNodes]
      : context.recentNodes;

    const seenNodes = new Set<string>();
    const completedSet = new Set(context.completedNodes);

    for (const nodeId of recentNodeIds) {
      // Find related nodes
      const relatedEdges = this.graph.edges.filter(
        e => (e.type === 'related' || e.type === 'seealso') &&
             (e.source === nodeId || e.target === nodeId)
      );

      for (const edge of relatedEdges) {
        const relatedId = edge.source === nodeId ? edge.target : edge.source;
        
        // Skip if already seen, completed, or current
        if (seenNodes.has(relatedId)) continue;
        if (completedSet.has(relatedId)) continue;
        if (relatedId === context.currentNodeId) continue;

        seenNodes.add(relatedId);

        const relatedNode = this.graph.nodes.find(n => n.id === relatedId);
        if (!relatedNode) continue;

        const factors = {
          expertiseMatch: 0,
          historyBoost: 0.5,
          popularityBoost: edge.weight,
          noveltyBoost: 0.5,
        };

        // Boost for recent node relevance
        const recencyBoost = nodeId === context.currentNodeId ? 1.5 : 1;

        scored.push({
          node: relatedNode,
          score: edge.weight * 5 * recencyBoost,
          reason: 'related',
          personalizationFactors: factors,
        });
      }
    }

    return scored;
  }

  // ==========================================================================
  // Diversification
  // ==========================================================================

  /**
   * Ensure recommendation diversity by type and difficulty
   */
  private diversifyRecommendations(scoredTopics: ScoredTopic[]): ScoredTopic[] {
    const diversified: ScoredTopic[] = [];
    const typeCounts: Record<string, number> = {};
    const difficultyCounts: Record<number, number> = {};

    // Sort by score first
    const sorted = [...scoredTopics].sort((a, b) => b.score - a.score);

    for (const topic of sorted) {
      const type = topic.node.type;
      const difficulty = topic.node.difficulty;

      typeCounts[type] = (typeCounts[type] || 0) + 1;
      difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1;

      // Penalize over-represented types
      const typePenalty = Math.max(0, (typeCounts[type] - 2) * 0.2);
      
      // Penalize over-represented difficulties
      const difficultyPenalty = Math.max(0, (difficultyCounts[difficulty] - 2) * 0.15);

      const adjustedScore = topic.score * (1 - typePenalty) * (1 - difficultyPenalty);

      diversified.push({
        ...topic,
        score: adjustedScore,
      });
    }

    return diversified.sort((a, b) => b.score - a.score);
  }

  // ==========================================================================
  // Learning Path Generation
  // ==========================================================================

  /**
   * Generate a learning path from one node to another
   */
  generateLearningPath(fromNodeId: string, toNodeId: string): LearningPath | null {
    const fromNode = this.graph.nodes.find(n => n.id === fromNodeId);
    const toNode = this.graph.nodes.find(n => n.id === toNodeId);

    if (!fromNode || !toNode) return null;

    // BFS to find shortest path considering prerequisites
    const queue: Array<{ nodeId: string; path: string[]; totalDifficulty: number }> = [
      { nodeId: fromNodeId, path: [fromNodeId], totalDifficulty: 0 },
    ];
    const visited = new Set<string>([fromNodeId]);

    while (queue.length > 0) {
      const { nodeId, path, totalDifficulty } = queue.shift()!;

      if (nodeId === toNodeId) {
        const pathNodes = path
          .map(id => this.graph.nodes.find(n => n.id === id))
          .filter((n): n is KnowledgeNode => n !== undefined);

        // Find prerequisites for the whole path
        const allPrereqs = new Set<string>();
        for (const pNode of pathNodes) {
          const prereqs = this.graph.edges
            .filter(e => e.type === 'prerequisite' && e.target === pNode.id)
            .map(e => e.source);
          prereqs.forEach(p => allPrereqs.add(p));
        }

        const prereqNodes = Array.from(allPrereqs)
          .map(id => this.graph.nodes.find(n => n.id === id))
          .filter((n): n is KnowledgeNode => n !== undefined);

        return {
          startNode: fromNode,
          endNode: toNode,
          path: pathNodes,
          totalDifficulty,
          estimatedTime: pathNodes.reduce((sum, n) => sum + n.estimatedReadTime, 0),
          prerequisites: prereqNodes,
        };
      }

      // Find connected nodes (including prerequisites in reverse)
      const connectedEdges = this.graph.edges.filter(
        e => e.source === nodeId || (e.target === nodeId && e.type === 'prerequisite')
      );

      for (const edge of connectedEdges) {
        const nextId = edge.source === nodeId ? edge.target : edge.source;
        
        if (!visited.has(nextId)) {
          visited.add(nextId);
          const nextNode = this.graph.nodes.find(n => n.id === nextId);
          if (nextNode) {
            queue.push({
              nodeId: nextId,
              path: [...path, nextId],
              totalDifficulty: totalDifficulty + nextNode.difficulty,
            });
          }
        }
      }
    }

    return null;
  }

  // ==========================================================================
  // User Progress Management
  // ==========================================================================

  private getUserProgress(userId: string): UserProgress {
    if (!this.userProgress.has(userId)) {
      this.userProgress.set(userId, {
        completedNodes: new Set(),
        inProgressNodes: new Set(),
        nodeScores: new Map(),
        lastAccessed: new Map(),
        totalTimeSpent: new Map(),
      });
    }
    return this.userProgress.get(userId)!;
  }

  /**
   * Record node completion for a user
   */
  recordCompletion(userId: string, nodeId: string, score?: number): void {
    const progress = this.getUserProgress(userId);
    progress.completedNodes.add(nodeId);
    progress.inProgressNodes.delete(nodeId);
    
    if (score !== undefined) {
      progress.nodeScores.set(nodeId, score);
    }
    
    progress.lastAccessed.set(nodeId, new Date());
  }

  /**
   * Record node access for a user
   */
  recordAccess(userId: string, nodeId: string, timeSpentSeconds?: number): void {
    const progress = this.getUserProgress(userId);
    progress.lastAccessed.set(nodeId, new Date());
    
    if (timeSpentSeconds) {
      const current = progress.totalTimeSpent.get(nodeId) || 0;
      progress.totalTimeSpent.set(nodeId, current + timeSpentSeconds);
    }
    
    if (!progress.completedNodes.has(nodeId)) {
      progress.inProgressNodes.add(nodeId);
    }
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private toPersonalizedRecommendation(scoredTopic: ScoredTopic): PersonalizedRecommendation {
    return {
      node: scoredTopic.node,
      score: Math.min(scoredTopic.score / 20, 1), // Normalize to 0-1
      reason: scoredTopic.reason,
      personalizedScore: scoredTopic.score,
      personalizationFactors: scoredTopic.personalizationFactors,
    };
  }

  /**
   * Update the graph data
   */
  updateGraph(graph: GraphData): void {
    this.graph = graph;
  }

  /**
   * Get recommendation engine statistics
   */
  getStats(userId?: string): {
    totalNodes: number;
    totalEdges: number;
    userCompletedNodes?: number;
    userInProgressNodes?: number;
  } {
    const stats = {
      totalNodes: this.graph.nodes.length,
      totalEdges: this.graph.edges.length,
    };

    if (userId) {
      const progress = this.userProgress.get(userId);
      if (progress) {
        return {
          ...stats,
          userCompletedNodes: progress.completedNodes.size,
          userInProgressNodes: progress.inProgressNodes.size,
        };
      }
    }

    return stats;
  }
}

export default RecommendationEngine;
