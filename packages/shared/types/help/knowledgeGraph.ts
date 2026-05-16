/** [Ver001.000] */
/**
 * Knowledge Graph Types
 * =====================
 * Types for the knowledge graph, search, and recommendations.
 */

import type {
  KnowledgeNode,
  KnowledgeEdge,
  KnowledgeGraph,
  Recommendation,
  SearchQuery,
  SearchResult,
  SearchEntry,
  NodeType,
  EdgeType,
  ExpertiseLevel
} from './index';

// Re-export for convenience
export type {
  KnowledgeNode,
  KnowledgeEdge,
  KnowledgeGraph,
  Recommendation,
  SearchQuery,
  SearchResult,
  SearchEntry,
  NodeType,
  EdgeType
};

// ============================================================================
// Graph Service Types
// ============================================================================

export interface GraphTraversalOptions {
  maxDepth?: number;
  minWeight?: number;
  edgeTypes?: EdgeType[];
  excludeVisited?: boolean;
}

export interface LearningPath {
  startNode: KnowledgeNode;
  endNode: KnowledgeNode;
  path: KnowledgeNode[];
  totalDifficulty: number;
  estimatedTime: number;       // minutes
  prerequisites: KnowledgeNode[];
}

export interface KnowledgeGap {
  targetNode: KnowledgeNode;
  missingPrerequisites: KnowledgeNode[];
  priority: 'high' | 'medium' | 'low';
}

// ============================================================================
// Search Engine Types
// ============================================================================

export interface SearchEngineConfig {
  minQueryLength: number;
  maxResults: number;
  fuzzyThreshold: number;      // 0-1, lower = more fuzzy
  synonymExpansion: boolean;
  stemming: boolean;
}

export const DEFAULT_SEARCH_CONFIG: SearchEngineConfig = {
  minQueryLength: 2,
  maxResults: 10,
  fuzzyThreshold: 0.6,
  synonymExpansion: true,
  stemming: true,
};

export interface AutocompleteSuggestion {
  text: string;
  type: 'exact' | 'fuzzy' | 'popular';
  score: number;
}

export interface SearchFacet {
  field: string;
  values: { value: string; count: number }[];
}

export interface EnrichedSearchResult extends SearchResult {
  breadcrumbs: string[];       // Parent topic path
  related: KnowledgeNode[];
}

// ============================================================================
// Recommendation Engine Types
// ============================================================================

export interface RecommendationEngineConfig {
  maxRecommendations: number;
  minScore: number;            // 0-1
  diversify: boolean;          // Avoid similar recommendations
  considerExpertise: boolean;
  considerHistory: boolean;
}

export const DEFAULT_RECOMMENDATION_CONFIG: RecommendationEngineConfig = {
  maxRecommendations: 5,
  minScore: 0.1,
  diversify: true,
  considerExpertise: true,
  considerHistory: true,
};

export interface RecommendationContext {
  userId: string;
  userLevel: ExpertiseLevel;
  /** @deprecated Use currentNodeId instead */
  currentTopicId?: string;
  currentNodeId?: string;
  /** @deprecated Use recentNodes instead */
  recentSearches?: string[];
  recentNodes: string[];
  /** @deprecated Use completedNodes instead */
  completedTopicIds?: string[];
  completedNodes: string[];
  /** Max number of recommendations to return */
  maxRecommendations?: number;
  /** @deprecated Use userLevel instead */
  userExpertiseLevel?: ExpertiseLevel;
}

export interface PersonalizedRecommendation extends Recommendation {
  personalizedScore: number;
  personalizationFactors: {
    expertiseMatch: number;
    historyBoost: number;
    popularityBoost: number;
    noveltyBoost: number;
  };
}

// ============================================================================
// API Types
// ============================================================================

export interface GetNodeRequest {
  nodeId: string;
  includeRelated?: boolean;
  includePrerequisites?: boolean;
}

export interface GetNodeResponse {
  node: KnowledgeNode;
  related?: KnowledgeNode[];
  prerequisites?: KnowledgeNode[];
}

export interface SearchRequest extends SearchQuery {
  cursor?: string;             // For pagination
}

export interface SearchResponse {
  results: SearchResult[];
  facets: SearchFacet[];
  total: number;
  cursor?: string;
  didYouMean?: string;
}

export interface GetRecommendationsRequest {
  userId: string;
  contextNodeId?: string;
  limit?: number;
}

export interface GetRecommendationsResponse {
  recommendations: PersonalizedRecommendation[];
  nextBest: PersonalizedRecommendation | null;
}

export interface GetLearningPathRequest {
  userId: string;
  fromNodeId: string;
  toNodeId: string;
}

export interface GetLearningPathResponse {
  path: LearningPath;
  gaps: KnowledgeGap[];
  alternativePaths: LearningPath[];
}

// ============================================================================
// Service Aliases (for backward compatibility)
// ============================================================================

/** Alias for RecommendationContext used in KnowledgeGraph service */
export type KnowledgeGraphRecommendationContext = RecommendationContext;

/** Alias for SearchQuery filters used in KnowledgeGraph service */
export interface KnowledgeGraphSearchFilters {
  type?: NodeType[];
  difficulty?: number[];
  /** @deprecated Use difficulty instead */
  difficulties?: number[];
  feature?: string[];
  userLevel?: ExpertiseLevel;
  limit?: number;
  // Extended properties used in knowledgeGraph service
  types?: NodeType[];
  categories?: string[];
  keywords?: string[];
  minPopularity?: number;
}
