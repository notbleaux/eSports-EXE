// @ts-nocheck
/** [Ver001.000] */
/**
 * Help Module - Knowledge Graph & Search
 * ======================================
 * Main exports for the help documentation knowledge graph system.
 * 
 * Usage:
 * ```typescript
 * import { 
 *   createSampleKnowledgeGraph, 
 *   KnowledgeSearch, 
 *   KnowledgeGraphView 
 * } from '@/lib/help';
 * ```
 */

// ============================================================================
// Types
// ============================================================================

export type {
  KnowledgeNode,
  KnowledgeEdge,
  KnowledgeGraph,
  KnowledgeNodeType,
  KnowledgeEdgeType,
  KnowledgeNodeStatus,
  DifficultyLevel,
  KnowledgeNodeMetadata,
  SearchResult,
  SearchFilters,
  SearchCategory,
  LearningPath,
  LearningProgress,
  TraversalOptions,
  TraversalResult,
  GraphStats,
  ValidationError,
  GraphVisualizationOptions,
  VisualNode,
  VisualEdge,
} from './knowledge-types';

// ============================================================================
// Graph Engine
// ============================================================================

export {
  createKnowledgeGraph,
  addNode,
  removeNode,
  updateNode,
  getNode,
  getNodesByType,
  getNodesByHub,
  addEdge,
  removeEdge,
  getEdgesFromNode,
  getEdgesToNode,
  getRelatedNodes,
  traverseGraph,
  findPrerequisites,
  findPrerequisitesForPath,
  hasPrerequisites,
  buildLearningPath,
  buildProgressiveLearningPath,
  calculateGraphStats,
  serializeGraph,
  deserializeGraph,
  validateGraph,
} from './knowledge-graph';

// ============================================================================
// Search Index
// ============================================================================

export {
  buildSearchIndex,
  search,
  getAutocompleteSuggestions,
  getRecentSearches,
  addRecentSearch,
  clearRecentSearches,
  getFacetCounts,
} from './search-index';

export type { SearchOptions, FacetCounts } from './search-index';

// ============================================================================
// Sample Data
// ============================================================================

export {
  createSampleKnowledgeGraph,
  allNodes,
  allEdges,
  predefinedLearningPaths,
  platformNodes,
  satorNodes,
  rotasNodes,
  arepoNodes,
  operaNodes,
  tenetNodes,
  advancedNodes,
} from './knowledge-data';

// ============================================================================
// Components (re-export for convenience)
// ============================================================================

// Note: Components are in components/help/ but re-exported here for convenience
// Use direct imports for tree-shaking: import { KnowledgeSearch } from '@/components/help/KnowledgeSearch';
