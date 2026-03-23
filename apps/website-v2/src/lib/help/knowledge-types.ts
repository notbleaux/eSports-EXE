/** [Ver001.000] */
/**
 * Knowledge Graph Types
 * =====================
 * Type definitions for the help documentation knowledge graph system.
 * 
 * Features:
 * - KnowledgeNode: Concepts, topics, features, tutorials
 * - KnowledgeEdge: Relationships between nodes
 * - KnowledgeGraph: Complete graph structure
 * - SearchResult: Ranked search results
 */

// ============================================================================
// Node Types
// ============================================================================

export type KnowledgeNodeType = 
  | 'concept'      // Abstract concepts (e.g., "SimRating")
  | 'topic'        // General topics (e.g., "Analytics")
  | 'feature'      // Platform features (e.g., "RAR Card")
  | 'tutorial'     // Step-by-step guides
  | 'guide'        // Long-form documentation
  | 'reference'    // API/reference docs
  | 'hub'          // Platform hub (SATOR, ROTAS, etc.)
  | 'page'         // Specific pages/screens
  | 'command'      // Voice commands, shortcuts
  | 'setting';     // Configuration options

export type KnowledgeNodeStatus = 
  | 'draft' 
  | 'published' 
  | 'archived' 
  | 'deprecated';

export type DifficultyLevel = 
  | 'beginner' 
  | 'intermediate' 
  | 'advanced' 
  | 'expert';

export interface KnowledgeNodeMetadata {
  /** Creation timestamp */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;
  /** Author/creator */
  author?: string;
  /** Version of documentation */
  version?: string;
  /** Estimated reading time in minutes */
  readingTime?: number;
  /** Whether this is a featured article */
  featured?: boolean;
  /** Tags for categorization */
  tags?: string[];
  /** Icon identifier (Lucide icon name) */
  icon?: string;
  /** Color theme for the node */
  color?: string;
}

export interface KnowledgeNode {
  /** Unique identifier */
  id: string;
  /** Human-readable title */
  title: string;
  /** Short description */
  description: string;
  /** Full content (markdown supported) */
  content?: string;
  /** Node type classification */
  type: KnowledgeNodeType;
  /** Current status */
  status: KnowledgeNodeStatus;
  /** Difficulty level */
  difficulty: DifficultyLevel;
  /** URL path to this resource */
  path?: string;
  /** Associated hub (if applicable) */
  hub?: string;
  /** Metadata */
  metadata: KnowledgeNodeMetadata;
  /** Search keywords */
  keywords: string[];
  /** Parent node ID (for hierarchy) */
  parentId?: string;
  /** Child node IDs */
  children?: string[];
  /** For tutorials: ordered step IDs */
  steps?: string[];
}

// ============================================================================
// Edge Types
// ============================================================================

export type KnowledgeEdgeType =
  | 'relates-to'      // General relationship
  | 'prerequisite'    // Must know before learning
  | 'parent-of'       // Hierarchical parent
  | 'child-of'        // Hierarchical child
  | 'similar-to'      // Similar concepts
  | 'contrasts-with'  // Opposing concepts
  | 'leads-to'        // Learning path progression
  | 'uses'            // Uses this feature/concept
  | 'used-by'         // Used by this feature
  | 'part-of'         // Component relationship
  | 'contains'        // Container relationship
  | 'implements'      // Implementation relationship
  | 'extends'         // Extension relationship
  | 'references';     // General reference

export interface KnowledgeEdge {
  /** Unique identifier */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Relationship type */
  type: KnowledgeEdgeType;
  /** Relationship strength (0-1) */
  strength: number;
  /** Optional description */
  description?: string;
  /** Whether this is a bidirectional relationship */
  bidirectional: boolean;
  /** Creation timestamp */
  createdAt: string;
}

// ============================================================================
// Graph Types
// ============================================================================

export interface KnowledgeGraph {
  /** Graph identifier */
  id: string;
  /** Graph name */
  name: string;
  /** Graph description */
  description: string;
  /** Version */
  version: string;
  /** All nodes in the graph */
  nodes: Map<string, KnowledgeNode>;
  /** All edges in the graph */
  edges: Map<string, KnowledgeEdge>;
  /** Index: node type -> node IDs */
  typeIndex: Map<KnowledgeNodeType, Set<string>>;
  /** Index: keyword -> node IDs */
  keywordIndex: Map<string, Set<string>>;
  /** Index: hub -> node IDs */
  hubIndex: Map<string, Set<string>>;
  /** Last updated */
  lastUpdated: string;
}

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByType: Record<KnowledgeNodeType, number>;
  edgesByType: Record<KnowledgeEdgeType, number>;
  orphanedNodes: number;
  mostConnectedNodes: string[];
  averageConnections: number;
}

// ============================================================================
// Search Types
// ============================================================================

export type SearchCategory = 
  | 'all'
  | 'feature'
  | 'concept'
  | 'tutorial'
  | 'guide'
  | 'reference';

export interface SearchFilters {
  /** Filter by category */
  category?: SearchCategory;
  /** Filter by difficulty */
  difficulty?: DifficultyLevel;
  /** Filter by hub */
  hub?: string;
  /** Filter by status */
  status?: KnowledgeNodeStatus;
  /** Include archived content */
  includeArchived?: boolean;
  /** Minimum relevance score */
  minRelevance?: number;
}

export interface SearchResult {
  /** The matched node */
  node: KnowledgeNode;
  /** Relevance score (0-1) */
  score: number;
  /** Matched fields */
  matchedFields: Array<'title' | 'description' | 'content' | 'keywords'>;
  /** Highlighted matches */
  highlights?: {
    title?: string;
    description?: string;
    excerpt?: string;
  };
  /** Why this result (explanation) */
  explanation?: string;
}

export interface SearchState {
  /** Current query */
  query: string;
  /** Search results */
  results: SearchResult[];
  /** Whether search is loading */
  isLoading: boolean;
  /** Error message if any */
  error?: string;
  /** Active filters */
  filters: SearchFilters;
  /** Total result count (before pagination) */
  totalCount: number;
  /** Current page */
  page: number;
  /** Items per page */
  pageSize: number;
  /** Recent searches */
  recentSearches: string[];
  /** Suggested queries */
  suggestions: string[];
}

// ============================================================================
// Learning Path Types
// ============================================================================

export interface LearningPath {
  /** Path identifier */
  id: string;
  /** Path name */
  name: string;
  /** Path description */
  description: string;
  /** Target difficulty */
  difficulty: DifficultyLevel;
  /** Estimated completion time (minutes) */
  estimatedTime: number;
  /** Ordered node IDs in the path */
  steps: string[];
  /** Prerequisites for this path */
  prerequisites: string[];
  /** Tags */
  tags: string[];
}

export interface LearningProgress {
  /** Path ID */
  pathId: string;
  /** User ID */
  userId: string;
  /** Completed step IDs */
  completedSteps: Set<string>;
  /** Current step index */
  currentStepIndex: number;
  /** Progress percentage (0-100) */
  percentage: number;
  /** Started timestamp */
  startedAt: string;
  /** Last updated */
  updatedAt: string;
  /** Completed timestamp */
  completedAt?: string;
}

// ============================================================================
// Traversal Types
// ============================================================================

export interface TraversalOptions {
  /** Maximum depth to traverse */
  maxDepth?: number;
  /** Edge types to follow */
  edgeTypes?: KnowledgeEdgeType[];
  /** Minimum edge strength */
  minStrength?: number;
  /** Include starting node */
  includeStart?: boolean;
  /** Traversal direction */
  direction?: 'outgoing' | 'incoming' | 'both';
}

export interface TraversalResult {
  /** Visited nodes with their depth */
  nodes: Array<{ node: KnowledgeNode; depth: number; path: string[] }>;
  /** Traversed edges */
  edges: KnowledgeEdge[];
  /** Total depth reached */
  maxDepthReached: number;
}

// ============================================================================
// Visualization Types
// ============================================================================

export interface GraphVisualizationOptions {
  /** Width of the visualization */
  width: number;
  /** Height of the visualization */
  height: number;
  /** Node size scale */
  nodeSize?: number;
  /** Link distance */
  linkDistance?: number;
  /** Charge strength */
  chargeStrength?: number;
  /** Collision radius */
  collisionRadius?: number;
  /** Enable zoom */
  enableZoom?: boolean;
  /** Enable pan */
  enablePan?: boolean;
  /** Color scheme */
  colorScheme?: 'type' | 'difficulty' | 'hub';
}

export interface VisualNode extends KnowledgeNode {
  /** D3 force simulation properties */
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
  /** Visual properties */
  radius: number;
  color: string;
  /** Selection state */
  selected?: boolean;
  highlighted?: boolean;
  /** Connected node IDs */
  connectedNodeIds: Set<string>;
}

export interface VisualEdge extends KnowledgeEdge {
  /** Source as node object */
  sourceNode: VisualNode;
  /** Target as node object */
  targetNode: VisualNode;
  /** Visual properties */
  strokeWidth: number;
  opacity: number;
}
