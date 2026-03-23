/** [Ver001.000] */
/**
 * Knowledge Graph Engine
 * ======================
 * Core engine for managing the help documentation knowledge graph.
 * 
 * Features:
 * - Add/remove nodes and edges
 * - Graph traversal (BFS/DFS)
 * - Find prerequisites and learning paths
 * - Relationship management
 * - Graph statistics
 */

import type {
  KnowledgeNode,
  KnowledgeEdge,
  KnowledgeNodeType,
  KnowledgeEdgeType,
  KnowledgeGraph,
  GraphStats,
  TraversalOptions,
  TraversalResult,
  LearningPath,
  DifficultyLevel,
} from './knowledge-types';

// ============================================================================
// Graph Factory
// ============================================================================

export function createKnowledgeGraph(
  id: string,
  name: string,
  description: string
): KnowledgeGraph {
  return {
    id,
    name,
    description,
    version: '1.0.0',
    nodes: new Map(),
    edges: new Map(),
    typeIndex: new Map(),
    keywordIndex: new Map(),
    hubIndex: new Map(),
    lastUpdated: new Date().toISOString(),
  };
}

// ============================================================================
// Node Management
// ============================================================================

export function addNode(graph: KnowledgeGraph, node: KnowledgeNode): KnowledgeGraph {
  // Add node to main map
  graph.nodes.set(node.id, node);

  // Update type index
  if (!graph.typeIndex.has(node.type)) {
    graph.typeIndex.set(node.type, new Set());
  }
  graph.typeIndex.get(node.type)!.add(node.id);

  // Update keyword index
  node.keywords.forEach(keyword => {
    if (!graph.keywordIndex.has(keyword)) {
      graph.keywordIndex.set(keyword, new Set());
    }
    graph.keywordIndex.get(keyword)!.add(node.id);
  });

  // Update hub index
  if (node.hub) {
    if (!graph.hubIndex.has(node.hub)) {
      graph.hubIndex.set(node.hub, new Set());
    }
    graph.hubIndex.get(node.hub)!.add(node.id);
  }

  graph.lastUpdated = new Date().toISOString();
  return graph;
}

export function removeNode(graph: KnowledgeGraph, nodeId: string): KnowledgeGraph {
  const node = graph.nodes.get(nodeId);
  if (!node) return graph;

  // Remove from type index
  graph.typeIndex.get(node.type)?.delete(nodeId);

  // Remove from keyword index
  node.keywords.forEach(keyword => {
    graph.keywordIndex.get(keyword)?.delete(nodeId);
  });

  // Remove from hub index
  if (node.hub) {
    graph.hubIndex.get(node.hub)?.delete(nodeId);
  }

  // Remove all edges connected to this node
  const edgesToRemove: string[] = [];
  graph.edges.forEach((edge, id) => {
    if (edge.source === nodeId || edge.target === nodeId) {
      edgesToRemove.push(id);
    }
  });
  edgesToRemove.forEach(id => graph.edges.delete(id));

  // Remove node
  graph.nodes.delete(nodeId);

  graph.lastUpdated = new Date().toISOString();
  return graph;
}

export function updateNode(
  graph: KnowledgeGraph,
  nodeId: string,
  updates: Partial<KnowledgeNode>
): KnowledgeNode | undefined {
  const node = graph.nodes.get(nodeId);
  if (!node) return undefined;

  // If type changes, update type index
  if (updates.type && updates.type !== node.type) {
    graph.typeIndex.get(node.type)?.delete(nodeId);
    if (!graph.typeIndex.has(updates.type)) {
      graph.typeIndex.set(updates.type, new Set());
    }
    graph.typeIndex.get(updates.type)!.add(nodeId);
  }

  // If keywords change, update keyword index
  if (updates.keywords) {
    // Remove old keywords
    node.keywords.forEach(keyword => {
      graph.keywordIndex.get(keyword)?.delete(nodeId);
    });
    // Add new keywords
    updates.keywords.forEach(keyword => {
      if (!graph.keywordIndex.has(keyword)) {
        graph.keywordIndex.set(keyword, new Set());
      }
      graph.keywordIndex.get(keyword)!.add(nodeId);
    });
  }

  // If hub changes, update hub index
  if (updates.hub !== undefined && updates.hub !== node.hub) {
    if (node.hub) {
      graph.hubIndex.get(node.hub)?.delete(nodeId);
    }
    if (updates.hub) {
      if (!graph.hubIndex.has(updates.hub)) {
        graph.hubIndex.set(updates.hub, new Set());
      }
      graph.hubIndex.get(updates.hub)!.add(nodeId);
    }
  }

  const updatedNode = {
    ...node,
    ...updates,
    metadata: {
      ...node.metadata,
      ...updates.metadata,
      updatedAt: new Date().toISOString(),
    },
  };

  graph.nodes.set(nodeId, updatedNode);
  graph.lastUpdated = new Date().toISOString();

  return updatedNode;
}

export function getNode(graph: KnowledgeGraph, nodeId: string): KnowledgeNode | undefined {
  return graph.nodes.get(nodeId);
}

export function getNodesByType(graph: KnowledgeGraph, type: KnowledgeNodeType): KnowledgeNode[] {
  const ids = graph.typeIndex.get(type);
  if (!ids) return [];
  return Array.from(ids)
    .map(id => graph.nodes.get(id))
    .filter((n): n is KnowledgeNode => n !== undefined);
}

export function getNodesByHub(graph: KnowledgeGraph, hub: string): KnowledgeNode[] {
  const ids = graph.hubIndex.get(hub);
  if (!ids) return [];
  return Array.from(ids)
    .map(id => graph.nodes.get(id))
    .filter((n): n is KnowledgeNode => n !== undefined);
}

// ============================================================================
// Edge Management
// ============================================================================

export function addEdge(graph: KnowledgeGraph, edge: KnowledgeEdge): KnowledgeGraph {
  // Validate nodes exist
  if (!graph.nodes.has(edge.source) || !graph.nodes.has(edge.target)) {
    throw new Error('Source or target node does not exist');
  }

  graph.edges.set(edge.id, edge);

  // If bidirectional, create reverse edge
  if (edge.bidirectional) {
    const reverseEdge: KnowledgeEdge = {
      ...edge,
      id: `${edge.id}-reverse`,
      source: edge.target,
      target: edge.source,
    };
    graph.edges.set(reverseEdge.id, reverseEdge);
  }

  graph.lastUpdated = new Date().toISOString();
  return graph;
}

export function removeEdge(graph: KnowledgeGraph, edgeId: string): KnowledgeGraph {
  const edge = graph.edges.get(edgeId);
  if (edge?.bidirectional) {
    graph.edges.delete(`${edgeId}-reverse`);
  }
  graph.edges.delete(edgeId);
  graph.lastUpdated = new Date().toISOString();
  return graph;
}

export function getEdgesFromNode(graph: KnowledgeGraph, nodeId: string): KnowledgeEdge[] {
  return Array.from(graph.edges.values()).filter(e => e.source === nodeId);
}

export function getEdgesToNode(graph: KnowledgeGraph, nodeId: string): KnowledgeEdge[] {
  return Array.from(graph.edges.values()).filter(e => e.target === nodeId);
}

export function getRelatedNodes(
  graph: KnowledgeGraph,
  nodeId: string,
  edgeType?: KnowledgeEdgeType
): Array<{ node: KnowledgeNode; edge: KnowledgeEdge }> {
  const edges = getEdgesFromNode(graph, nodeId);
  return edges
    .filter(e => !edgeType || e.type === edgeType)
    .map(edge => ({
      edge,
      node: graph.nodes.get(edge.target)!,
    }))
    .filter(({ node }) => node !== undefined);
}

// ============================================================================
// Graph Traversal
// ============================================================================

export function traverseGraph(
  graph: KnowledgeGraph,
  startNodeId: string,
  options: TraversalOptions = {}
): TraversalResult {
  const {
    maxDepth = 3,
    edgeTypes,
    minStrength = 0,
    includeStart = true,
    direction = 'outgoing',
  } = options;

  const visited = new Map<string, { depth: number; path: string[] }>();
  const traversedEdges: KnowledgeEdge[] = [];
  const queue: Array<{ nodeId: string; depth: number; path: string[] }> = [];

  // Start traversal
  queue.push({ nodeId: startNodeId, depth: 0, path: [] });

  while (queue.length > 0) {
    const { nodeId, depth, path } = queue.shift()!;

    if (visited.has(nodeId)) continue;
    if (depth > maxDepth) continue;

    visited.set(nodeId, { depth, path });

    // Get edges based on direction
    let edges: KnowledgeEdge[] = [];
    if (direction === 'outgoing' || direction === 'both') {
      edges.push(...getEdgesFromNode(graph, nodeId));
    }
    if (direction === 'incoming' || direction === 'both') {
      edges.push(...getEdgesToNode(graph, nodeId));
    }

    // Filter edges
    edges = edges.filter(e => {
      if (edgeTypes && !edgeTypes.includes(e.type)) return false;
      if (e.strength < minStrength) return false;
      return true;
    });

    for (const edge of edges) {
      const targetId = edge.source === nodeId ? edge.target : edge.source;

      if (!visited.has(targetId) && depth < maxDepth) {
        queue.push({
          nodeId: targetId,
          depth: depth + 1,
          path: [...path, edge.id],
        });
        traversedEdges.push(edge);
      }
    }
  }

  // Build result
  const nodes = Array.from(visited.entries())
    .filter(([id]) => includeStart || id !== startNodeId)
    .map(([id, { depth, path }]) => ({
      node: graph.nodes.get(id)!,
      depth,
      path,
    }))
    .filter(({ node }) => node !== undefined);

  return {
    nodes,
    edges: traversedEdges,
    maxDepthReached: Math.max(...nodes.map(n => n.depth), 0),
  };
}

// ============================================================================
// Prerequisite Analysis
// ============================================================================

export function findPrerequisites(
  graph: KnowledgeGraph,
  nodeId: string,
  includeIndirect: boolean = false
): KnowledgeNode[] {
  const result = traverseGraph(graph, nodeId, {
    direction: 'incoming',
    edgeTypes: ['prerequisite'],
    maxDepth: includeIndirect ? 5 : 1,
    includeStart: false,
  });

  // Sort by depth (closest first)
  return result.nodes
    .sort((a, b) => a.depth - b.depth)
    .map(n => n.node);
}

export function findPrerequisitesForPath(
  graph: KnowledgeGraph,
  nodeIds: string[]
): Map<string, KnowledgeNode[]> {
  const prerequisites = new Map<string, KnowledgeNode[]>();

  for (const nodeId of nodeIds) {
    const prereqs = findPrerequisites(graph, nodeId, true);
    prerequisites.set(nodeId, prereqs);
  }

  return prerequisites;
}

export function hasPrerequisites(
  graph: KnowledgeGraph,
  nodeId: string,
  completedNodes: Set<string>
): { met: boolean; missing: KnowledgeNode[] } {
  const prerequisites = findPrerequisites(graph, nodeId);
  const missing = prerequisites.filter(p => !completedNodes.has(p.id));

  return {
    met: missing.length === 0,
    missing,
  };
}

// ============================================================================
// Learning Path Building
// ============================================================================

export function buildLearningPath(
  graph: KnowledgeGraph,
  startNodeId: string,
  endNodeId: string,
  options: {
    maxNodes?: number;
    preferShortest?: boolean;
    difficulty?: DifficultyLevel;
  } = {}
): LearningPath | null {
  const { maxNodes = 10, preferShortest = true } = options;

  // BFS to find shortest path
  const queue: Array<{ nodeId: string; path: string[]; visited: Set<string> }> = [
    { nodeId: startNodeId, path: [], visited: new Set() },
  ];

  const visitedPaths: string[][] = [];

  while (queue.length > 0) {
    const { nodeId, path, visited } = queue.shift()!;

    if (nodeId === endNodeId) {
      visitedPaths.push([...path, nodeId]);
      continue;
    }

    if (path.length >= maxNodes) continue;
    if (visited.has(nodeId)) continue;

    visited.add(nodeId);

    // Get outgoing edges
    const edges = getEdgesFromNode(graph, nodeId).filter(
      e => e.type === 'leads-to' || e.type === 'prerequisite'
    );

    for (const edge of edges) {
      if (!visited.has(edge.target)) {
        queue.push({
          nodeId: edge.target,
          path: [...path, nodeId],
          visited: new Set(visited),
        });
      }
    }
  }

  if (visitedPaths.length === 0) return null;

  // Select best path
  const bestPath = preferShortest
    ? visitedPaths.reduce((a, b) => (a.length <= b.length ? a : b))
    : visitedPaths[0];

  const steps = bestPath.map(id => graph.nodes.get(id)!).filter(Boolean);
  const totalTime = steps.reduce((sum, node) => sum + (node.metadata.readingTime || 5), 0);

  // Find prerequisites for the whole path
  const allPrereqs = new Set<string>();
  for (const nodeId of bestPath) {
    const prereqs = findPrerequisites(graph, nodeId);
    prereqs.forEach(p => {
      if (!bestPath.includes(p.id)) {
        allPrereqs.add(p.id);
      }
    });
  }

  return {
    id: `path-${startNodeId}-${endNodeId}`,
    name: `Learning Path: ${graph.nodes.get(startNodeId)?.title} → ${graph.nodes.get(endNodeId)?.title}`,
    description: `Structured learning path from ${graph.nodes.get(startNodeId)?.title} to ${graph.nodes.get(endNodeId)?.title}`,
    difficulty: graph.nodes.get(startNodeId)?.difficulty || 'beginner',
    estimatedTime: totalTime,
    steps: bestPath,
    prerequisites: Array.from(allPrereqs),
    tags: ['auto-generated', 'learning-path'],
  };
}

export function buildProgressiveLearningPath(
  graph: KnowledgeGraph,
  targetDifficulty: DifficultyLevel = 'intermediate',
  startFrom?: string
): LearningPath {
  const difficultyOrder: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced', 'expert'];
  const targetIndex = difficultyOrder.indexOf(targetDifficulty);

  // Get nodes up to target difficulty
  const eligibleNodes = Array.from(graph.nodes.values()).filter(node => {
    const nodeIndex = difficultyOrder.indexOf(node.difficulty);
    return nodeIndex <= targetIndex;
  });

  // Sort by difficulty
  eligibleNodes.sort((a, b) => {
    const aIndex = difficultyOrder.indexOf(a.difficulty);
    const bIndex = difficultyOrder.indexOf(b.difficulty);
    if (aIndex !== bIndex) return aIndex - bIndex;
    return (a.metadata.readingTime || 5) - (b.metadata.readingTime || 5);
  });

  // Start from specific node or first beginner node
  let startIndex = 0;
  if (startFrom) {
    startIndex = eligibleNodes.findIndex(n => n.id === startFrom);
    if (startIndex === -1) startIndex = 0;
  }

  const steps = eligibleNodes.slice(startIndex).map(n => n.id);
  const totalTime = eligibleNodes
    .slice(startIndex)
    .reduce((sum, node) => sum + (node.metadata.readingTime || 5), 0);

  return {
    id: `progressive-${targetDifficulty}-${Date.now()}`,
    name: `Progressive Learning: ${targetDifficulty}`,
    description: `Comprehensive learning path progressing from beginner to ${targetDifficulty} level`,
    difficulty: targetDifficulty,
    estimatedTime: totalTime,
    steps,
    prerequisites: [],
    tags: ['progressive', 'comprehensive', targetDifficulty],
  };
}

// ============================================================================
// Graph Statistics
// ============================================================================

export function calculateGraphStats(graph: KnowledgeGraph): GraphStats {
  const nodesByType = {} as Record<KnowledgeNodeType, number>;
  const edgesByType = {} as Record<KnowledgeEdgeType, number>;

  // Count nodes by type
  graph.nodes.forEach(node => {
    nodesByType[node.type] = (nodesByType[node.type] || 0) + 1;
  });

  // Count edges by type
  graph.edges.forEach(edge => {
    edgesByType[edge.type] = (edgesByType[edge.type] || 0) + 1;
  });

  // Find orphaned nodes (no edges)
  const connectedNodes = new Set<string>();
  graph.edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });
  const orphanedNodes = Array.from(graph.nodes.keys()).filter(id => !connectedNodes.has(id));

  // Find most connected nodes
  const connectionCounts = new Map<string, number>();
  graph.edges.forEach(edge => {
    connectionCounts.set(edge.source, (connectionCounts.get(edge.source) || 0) + 1);
    connectionCounts.set(edge.target, (connectionCounts.get(edge.target) || 0) + 1);
  });

  const mostConnected = Array.from(connectionCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([id]) => id);

  // Calculate average connections
  const totalConnections = Array.from(connectionCounts.values()).reduce((a, b) => a + b, 0);
  const avgConnections = graph.nodes.size > 0 ? totalConnections / graph.nodes.size : 0;

  return {
    totalNodes: graph.nodes.size,
    totalEdges: graph.edges.size,
    nodesByType,
    edgesByType,
    orphanedNodes: orphanedNodes.length,
    mostConnectedNodes: mostConnected,
    averageConnections: Math.round(avgConnections * 100) / 100,
  };
}

// ============================================================================
// Graph Serialization
// ============================================================================

export function serializeGraph(graph: KnowledgeGraph): string {
  const data = {
    id: graph.id,
    name: graph.name,
    description: graph.description,
    version: graph.version,
    lastUpdated: graph.lastUpdated,
    nodes: Array.from(graph.nodes.values()),
    edges: Array.from(graph.edges.values()),
  };
  return JSON.stringify(data, null, 2);
}

export function deserializeGraph(json: string): KnowledgeGraph {
  const data = JSON.parse(json);
  const graph = createKnowledgeGraph(data.id, data.name, data.description);
  graph.version = data.version;
  graph.lastUpdated = data.lastUpdated;

  // Add nodes
  data.nodes.forEach((node: KnowledgeNode) => {
    addNode(graph, node);
  });

  // Add edges
  data.edges.forEach((edge: KnowledgeEdge) => {
    addEdge(graph, edge);
  });

  return graph;
}

// ============================================================================
// Graph Validation
// ============================================================================

export interface ValidationError {
  type: 'node' | 'edge' | 'graph';
  id: string;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export function validateGraph(graph: KnowledgeGraph): ValidationError[] {
  const errors: ValidationError[] = [];

  // Validate nodes
  graph.nodes.forEach((node, id) => {
    if (!node.title || node.title.trim() === '') {
      errors.push({
        type: 'node',
        id,
        message: 'Node has empty title',
        severity: 'error',
      });
    }

    if (node.keywords.length === 0) {
      errors.push({
        type: 'node',
        id,
        message: 'Node has no keywords',
        severity: 'warning',
      });
    }
  });

  // Validate edges
  graph.edges.forEach((edge, id) => {
    if (!graph.nodes.has(edge.source)) {
      errors.push({
        type: 'edge',
        id,
        message: `Edge references non-existent source node: ${edge.source}`,
        severity: 'error',
      });
    }

    if (!graph.nodes.has(edge.target)) {
      errors.push({
        type: 'edge',
        id,
        message: `Edge references non-existent target node: ${edge.target}`,
        severity: 'error',
      });
    }
  });

  // Check for orphaned nodes
  const connected = new Set<string>();
  graph.edges.forEach(edge => {
    connected.add(edge.source);
    connected.add(edge.target);
  });

  graph.nodes.forEach((node, id) => {
    if (!connected.has(id) && node.type !== 'hub') {
      errors.push({
        type: 'node',
        id,
        message: 'Node is orphaned (no connections)',
        severity: 'warning',
      });
    }
  });

  return errors;
}
