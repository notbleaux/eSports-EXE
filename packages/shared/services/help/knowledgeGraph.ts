/** [Ver001.000] */
/**
 * Knowledge Graph Service
 * =======================
 * Core service for managing the help knowledge graph, including topics,
 * categories, relationships, and graph traversal operations.
 */

import type {
  KnowledgeNode,
  KnowledgeEdge,
  KnowledgeGraph as KnowledgeGraphData,
  NodeType,
  EdgeType,
  SearchFilters,
  SearchResult,
  RecommendationContext,
  LearningPath,
  KnowledgeGap,
  GraphTraversalOptions,
} from '../../types/help/knowledgeGraph';

// ============================================================================
// Help Topic and Category Types
// ============================================================================

export interface HelpTopic {
  id: string;
  title: string;
  description: string;
  nodeId: string;           // Links to KnowledgeNode
  categoryIds: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  estimatedTime: number;    // minutes
  keywords: string[];
  popularity: number;       // 0-1 based on views
}

export interface HelpCategory {
  id: string;
  name: string;
  description: string;
  parentId?: string;
  topicIds: string[];
  order: number;
}

// ============================================================================
// Search and Filter Types
// ============================================================================

export interface SearchFilters {
  types?: NodeType[];
  difficulties?: number[];
  categories?: string[];
  keywords?: string[];
  minPopularity?: number;
}

interface ScoredTopic {
  topic: HelpTopic;
  score: number;
  reason: string;
}

// ============================================================================
// Knowledge Graph Class
// ============================================================================

export class KnowledgeGraph {
  private topics: Map<string, HelpTopic> = new Map();
  private categories: Map<string, HelpCategory> = new Map();
  private nodes: Map<string, KnowledgeNode> = new Map();
  private edges: KnowledgeEdge[] = [];
  private nodeToTopic: Map<string, string> = new Map(); // nodeId -> topicId

  constructor(initialData?: KnowledgeGraphData) {
    if (initialData) {
      this.loadGraph(initialData);
    }
  }

  // ==========================================================================
  // Data Loading
  // ==========================================================================

  loadGraph(data: KnowledgeGraphData): void {
    // Load nodes
    for (const node of data.nodes) {
      this.nodes.set(node.id, node);
    }

    // Load edges
    this.edges = [...data.edges];
  }

  addTopic(topic: HelpTopic, node: KnowledgeNode): void {
    this.topics.set(topic.id, topic);
    this.nodes.set(node.id, node);
    this.nodeToTopic.set(node.id, topic.id);
  }

  addCategory(category: HelpCategory): void {
    this.categories.set(category.id, category);
  }

  // ==========================================================================
  // Graph Queries
  // ==========================================================================

  /**
   * Find related topics for a given topic
   */
  findRelated(topicId: string, limit: number = 5): HelpTopic[] {
    const topic = this.topics.get(topicId);
    if (!topic) return [];

    const nodeId = topic.nodeId;
    const relatedNodeIds = new Set<string>();

    // Find all edges from this node
    for (const edge of this.edges) {
      if (edge.source === nodeId && (edge.type === 'related' || edge.type === 'seealso')) {
        relatedNodeIds.add(edge.target);
      }
      if (edge.target === nodeId && (edge.type === 'related' || edge.type === 'seealso')) {
        relatedNodeIds.add(edge.source);
      }
    }

    // Convert node IDs to topics
    const relatedTopics: HelpTopic[] = [];
    for (const nodeId of relatedNodeIds) {
      const relatedTopicId = this.nodeToTopic.get(nodeId);
      if (relatedTopicId) {
        const relatedTopic = this.topics.get(relatedTopicId);
        if (relatedTopic && relatedTopic.id !== topicId) {
          relatedTopics.push(relatedTopic);
        }
      }
    }

    // Sort by popularity and weight
    return relatedTopics
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  }

  /**
   * Find prerequisite topics for a given topic
   */
  findPrerequisites(topicId: string): HelpTopic[] {
    const topic = this.topics.get(topicId);
    if (!topic) return [];

    const nodeId = topic.nodeId;
    const prereqNodeIds: string[] = [];

    // Find all prerequisite edges
    for (const edge of this.edges) {
      if (edge.target === nodeId && edge.type === 'prerequisite') {
        prereqNodeIds.push(edge.source);
      }
    }

    // Convert node IDs to topics
    const prereqTopics: HelpTopic[] = [];
    for (const nodeId of prereqNodeIds) {
      const prereqTopicId = this.nodeToTopic.get(nodeId);
      if (prereqTopicId) {
        const prereqTopic = this.topics.get(prereqTopicId);
        if (prereqTopic) {
          prereqTopics.push(prereqTopic);
        }
      }
    }

    // Sort by difficulty (easiest first)
    return prereqTopics.sort((a, b) => a.difficulty - b.difficulty);
  }

  /**
   * Find learning path from one topic to another
   */
  findPath(fromTopicId: string, toTopicId: string): HelpTopic[] {
    const fromTopic = this.topics.get(fromTopicId);
    const toTopic = this.topics.get(toTopicId);
    
    if (!fromTopic || !toTopic) return [];

    // BFS to find shortest path
    const startNode = fromTopic.nodeId;
    const targetNode = toTopic.nodeId;
    
    const queue: { nodeId: string; path: string[] }[] = [{ nodeId: startNode, path: [startNode] }];
    const visited = new Set<string>([startNode]);

    while (queue.length > 0) {
      const { nodeId, path } = queue.shift()!;

      if (nodeId === targetNode) {
        // Convert node path to topic path
        return path
          .map(id => this.nodeToTopic.get(id))
          .filter((id): id is string => id !== undefined)
          .map(id => this.topics.get(id))
          .filter((topic): topic is HelpTopic => topic !== undefined);
      }

      // Find all connected nodes
      for (const edge of this.edges) {
        let nextNodeId: string | null = null;
        
        if (edge.source === nodeId && !visited.has(edge.target)) {
          nextNodeId = edge.target;
        } else if (edge.target === nodeId && !visited.has(edge.source)) {
          nextNodeId = edge.source;
        }

        if (nextNodeId) {
          visited.add(nextNodeId);
          queue.push({ nodeId: nextNodeId, path: [...path, nextNodeId] });
        }
      }
    }

    return []; // No path found
  }

  /**
   * Search topics with filters
   */
  search(query: string, filters?: SearchFilters): SearchResult[] {
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase();

    for (const topic of this.topics.values()) {
      let score = 0;
      const highlights: string[] = [];

      // Title match (highest weight)
      if (topic.title.toLowerCase().includes(queryLower)) {
        score += 10;
        highlights.push(topic.title);
      }

      // Description match
      if (topic.description.toLowerCase().includes(queryLower)) {
        score += 5;
        highlights.push(topic.description.substring(0, 100) + '...');
      }

      // Keyword matches
      const node = this.nodes.get(topic.nodeId);
      if (node) {
        for (const keyword of node.keywords) {
          if (keyword.toLowerCase().includes(queryLower)) {
            score += 3;
            highlights.push(keyword);
          }
        }
      }

      // Apply filters
      if (score > 0 && this.matchesFilters(topic, node, filters)) {
        results.push({
          node: node || {
            id: topic.nodeId,
            type: 'topic',
            title: topic.title,
            contentIds: [],
            keywords: topic.keywords,
            difficulty: topic.difficulty,
            estimatedReadTime: topic.estimatedTime,
          },
          score,
          highlights: highlights.slice(0, 3),
          snippet: topic.description.substring(0, 150),
        });
      }
    }

    return results.sort((a, b) => b.score - a.score);
  }

  /**
   * Get personalized recommendations based on user context
   */
  recommend(context: KnowledgeGraphRecommendationContext): HelpTopic[] {
    const scoredTopics: ScoredTopic[] = [];

    for (const topic of this.topics.values()) {
      let score = 0;
      let reason = 'related';

      // Skip completed topics
      if (context.completedTopicIds.includes(topic.id)) {
        continue;
      }

      // Skip current topic
      if (topic.id === context.currentTopicId) {
        continue;
      }

      // Difficulty match (prefer topics at user's level)
      const difficultyMap = { beginner: 1, intermediate: 3, advanced: 4, expert: 5 };
      const targetDifficulty = difficultyMap[context.userExpertiseLevel];
      const difficultyDiff = Math.abs(topic.difficulty - targetDifficulty);
      score += Math.max(0, 5 - difficultyDiff);

      // Prerequisite boost: topics that are prerequisites for current topic
      if (context.currentTopicId) {
        const currentTopic = this.topics.get(context.currentTopicId);
        if (currentTopic) {
          const prereqs = this.findPrerequisites(context.currentTopicId);
          if (prereqs.some(p => p.id === topic.id)) {
            score += 15;
            reason = 'prerequisite';
          }
        }
      }

      // Next in series boost: topics that have current as prerequisite
      if (context.currentTopicId) {
        const currentNodeId = this.topics.get(context.currentTopicId)?.nodeId;
        if (currentNodeId) {
          const nextEdges = this.edges.filter(
            e => e.source === currentNodeId && e.type === 'next'
          );
          for (const edge of nextEdges) {
            const nextTopicId = this.nodeToTopic.get(edge.target);
            if (nextTopicId === topic.id) {
              score += 12;
              reason = 'next_in_series';
            }
          }
        }
      }

      // Popularity boost
      score += topic.popularity * 5;

      // Related topics boost
      if (context.currentTopicId) {
        const related = this.findRelated(context.currentTopicId, 10);
        if (related.some(r => r.id === topic.id)) {
          score += 8;
          if (reason === 'related') {
            reason = 'related';
          }
        }
      }

      // Search history alignment
      if (context.recentSearches.length > 0) {
        const searchTerms = context.recentSearches.join(' ').toLowerCase();
        const topicText = `${topic.title} ${topic.description} ${topic.keywords.join(' ')}`.toLowerCase();
        
        for (const term of context.recentSearches) {
          if (topicText.includes(term.toLowerCase())) {
            score += 3;
          }
        }
      }

      if (score > 0) {
        scoredTopics.push({ topic, score, reason });
      }
    }

    // Sort by score and return top recommendations
    const maxRecommendations = context.maxRecommendations || 5;
    return scoredTopics
      .sort((a, b) => b.score - a.score)
      .slice(0, maxRecommendations)
      .map(st => st.topic);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  private matchesFilters(
    topic: HelpTopic,
    node: KnowledgeNode | undefined,
    filters?: KnowledgeGraphSearchFilters
  ): boolean {
    if (!filters) return true;

    // Type filter
    if (filters.types && node) {
      if (!filters.types.includes(node.type)) {
        return false;
      }
    }

    // Difficulty filter
    if (filters.difficulties) {
      if (!filters.difficulties.includes(topic.difficulty)) {
        return false;
      }
    }

    // Category filter
    if (filters.categories) {
      const hasMatchingCategory = topic.categoryIds.some(catId =>
        filters.categories!.includes(catId)
      );
      if (!hasMatchingCategory) {
        return false;
      }
    }

    // Keyword filter
    if (filters.keywords) {
      const hasMatchingKeyword = topic.keywords.some(kw =>
        filters.keywords!.some(fkw => kw.toLowerCase().includes(fkw.toLowerCase()))
      );
      if (!hasMatchingKeyword) {
        return false;
      }
    }

    // Popularity filter
    if (filters.minPopularity !== undefined) {
      if (topic.popularity < filters.minPopularity) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get topic by ID
   */
  getTopic(id: string): HelpTopic | undefined {
    return this.topics.get(id);
  }

  /**
   * Get category by ID
   */
  getCategory(id: string): HelpCategory | undefined {
    return this.categories.get(id);
  }

  /**
   * Get node by ID
   */
  getNode(id: string): KnowledgeNode | undefined {
    return this.nodes.get(id);
  }

  /**
   * Get all topics in a category
   */
  getTopicsByCategory(categoryId: string): HelpTopic[] {
    const category = this.categories.get(categoryId);
    if (!category) return [];

    return category.topicIds
      .map(id => this.topics.get(id))
      .filter((topic): topic is HelpTopic => topic !== undefined)
      .sort((a, b) => a.difficulty - b.difficulty);
  }

  /**
   * Get all categories (optionally filtered by parent)
   */
  getCategories(parentId?: string): HelpCategory[] {
    const categories = Array.from(this.categories.values());
    
    if (parentId !== undefined) {
      return categories.filter(c => c.parentId === parentId).sort((a, b) => a.order - b.order);
    }
    
    return categories.sort((a, b) => a.order - b.order);
  }

  /**
   * Export the graph data
   */
  exportGraph(): KnowledgeGraphData {
    return {
      nodes: Array.from(this.nodes.values()),
      edges: this.edges,
      version: '1.0.0',
      lastUpdated: new Date(),
    };
  }
}

export default KnowledgeGraph;
