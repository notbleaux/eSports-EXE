/** [Ver001.000] */
/**
 * KnowledgeGraphView Component
 * ============================
 * D3.js force-directed graph visualization for knowledge exploration.
 * 
 * Features:
 * - Interactive force-directed layout
 * - Click nodes to explore
 * - Highlight connections
 * - Zoom and pan
 * - Node filtering by type
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as d3 from 'd3';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Filter,
  X,
  Info,
  GitBranch,
  Target,
  Layers
} from 'lucide-react';
import { cn } from '../../lib/utils';
import type { 
  KnowledgeGraph, 
  KnowledgeNode, 
  KnowledgeEdge,
  KnowledgeNodeType,
  VisualNode,
  VisualEdge 
} from '../../lib/help/knowledge-types';
import { traverseGraph } from '../../lib/help/knowledge-graph';

// ============================================================================
// Types
// ============================================================================

export interface KnowledgeGraphViewProps {
  /** Knowledge graph to visualize */
  graph: KnowledgeGraph;
  /** Width of the visualization */
  width?: number;
  /** Height of the visualization */
  height?: number;
  /** Called when a node is clicked */
  onNodeClick?: (node: KnowledgeNode) => void;
  /** Additional className */
  className?: string;
  /** Initial selected node ID */
  initialSelectedNodeId?: string;
  /** Node types to filter (show only these types) */
  filterTypes?: KnowledgeNodeType[];
}

interface SimulationNode extends d3.SimulationNodeDatum {
  id: string;
  node: KnowledgeNode;
  radius: number;
  color: string;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface SimulationLink extends d3.SimulationLinkDatum<SimulationNode> {
  id: string;
  edge: KnowledgeEdge;
  source: string | SimulationNode;
  target: string | SimulationNode;
  strength: number;
}

// ============================================================================
// Color Schemes
// ============================================================================

const TYPE_COLORS: Record<KnowledgeNodeType, string> = {
  concept: '#8b5cf6',    // Violet
  topic: '#6366f1',      // Indigo
  feature: '#3b82f6',    // Blue
  tutorial: '#10b981',   // Emerald
  guide: '#14b8a6',      // Teal
  reference: '#64748b',  // Slate
  hub: '#f59e0b',        // Amber
  page: '#6b7280',       // Gray
  command: '#ec4899',    // Pink
  setting: '#84cc16',    // Lime
};

const DIFFICULTY_COLORS: Record<string, string> = {
  beginner: '#22c55e',
  intermediate: '#3b82f6',
  advanced: '#f59e0b',
  expert: '#ef4444',
};

const HUB_COLORS: Record<string, string> = {
  sator: '#8b5cf6',
  rotas: '#3b82f6',
  arepo: '#10b981',
  opera: '#f59e0b',
  tenet: '#ec4899',
};

// ============================================================================
// Component
// ============================================================================

export const KnowledgeGraphView: React.FC<KnowledgeGraphViewProps> = ({
  graph,
  width = 800,
  height = 600,
  onNodeClick,
  className,
  initialSelectedNodeId,
  filterTypes,
}) => {
  // Refs
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const simulationRef = useRef<d3.Simulation<SimulationNode, SimulationLink> | null>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown> | null>(null);

  // State
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(initialSelectedNodeId || null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [colorScheme, setColorScheme] = useState<'type' | 'difficulty' | 'hub'>('type');
  const [showLabels, setShowLabels] = useState(true);
  const [activeTypes, setActiveTypes] = useState<Set<KnowledgeNodeType>>(
    () => new Set(filterTypes || (Object.keys(TYPE_COLORS) as KnowledgeNodeType[]))
  );
  const [showSidebar, setShowSidebar] = useState(false);

  // Get node color based on scheme
  const getNodeColor = useCallback((node: KnowledgeNode): string => {
    switch (colorScheme) {
      case 'difficulty':
        return DIFFICULTY_COLORS[node.difficulty] || '#6b7280';
      case 'hub':
        return node.hub ? HUB_COLORS[node.hub] || '#6b7280' : '#6b7280';
      case 'type':
      default:
        return TYPE_COLORS[node.type] || '#6b7280';
    }
  }, [colorScheme]);

  // Get node radius based on connections
  const getNodeRadius = useCallback((nodeId: string): number => {
    let connections = 0;
    graph.edges.forEach(edge => {
      if (edge.source === nodeId || edge.target === nodeId) {
        connections++;
      }
    });
    return Math.max(8, Math.min(25, 8 + connections * 1.5));
  }, [graph.edges]);

  // Filter nodes and edges
  const getFilteredData = useCallback(() => {
    const nodes: SimulationNode[] = [];
    const nodeMap = new Map<string, SimulationNode>();

    graph.nodes.forEach(node => {
      if (!activeTypes.has(node.type)) return;

      const simNode: SimulationNode = {
        id: node.id,
        node,
        radius: getNodeRadius(node.id),
        color: getNodeColor(node),
      };
      nodes.push(simNode);
      nodeMap.set(node.id, simNode);
    });

    const links: SimulationLink[] = [];
    graph.edges.forEach(edge => {
      const sourceNode = nodeMap.get(edge.source);
      const targetNode = nodeMap.get(edge.target);
      
      if (sourceNode && targetNode) {
        links.push({
          id: edge.id,
          edge,
          source: edge.source,
          target: edge.target,
          strength: edge.strength,
        });
      }
    });

    return { nodes, links, nodeMap };
  }, [graph, activeTypes, getNodeColor, getNodeRadius]);

  // Get connected nodes
  const getConnectedNodes = useCallback((nodeId: string): Set<string> => {
    const connected = new Set<string>();
    graph.edges.forEach(edge => {
      if (edge.source === nodeId) {
        connected.add(edge.target);
      } else if (edge.target === nodeId) {
        connected.add(edge.source);
      }
    });
    return connected;
  }, [graph.edges]);

  // Initialize/update visualization
  useEffect(() => {
    if (!svgRef.current) return;

    const svg = d3.select(svgRef.current);
    const { nodes, links, nodeMap } = getFilteredData();

    // Clear existing
    svg.selectAll('*').remove();

    // Create container group for zoom
    const g = svg.append('g');

    // Zoom behavior
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    zoomRef.current = zoom;
    svg.call(zoom);

    // Force simulation
    const simulation = d3.forceSimulation<SimulationNode>(nodes)
      .force('link', d3.forceLink<SimulationNode, SimulationLink>(links)
        .id(d => d.id)
        .distance(100)
        .strength(d => d.strength * 0.5)
      )
      .force('charge', d3.forceManyBody().strength(-300))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<SimulationNode>().radius(d => d.radius + 5));

    simulationRef.current = simulation;

    // Links
    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(links)
      .enter()
      .append('line')
      .attr('stroke', '#94a3b8')
      .attr('stroke-opacity', 0.4)
      .attr('stroke-width', d => Math.sqrt(d.strength * 2));

    // Nodes group
    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('g')
      .data(nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .attr('cursor', 'pointer')
      .call(d3.drag<SVGGElement, SimulationNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x;
          d.fy = d.y;
        })
        .on('drag', (event, d) => {
          d.fx = event.x;
          d.fy = event.y;
        })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null;
          d.fy = null;
        })
      );

    // Node circles
    node.append('circle')
      .attr('r', d => d.radius)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .style('transition', 'all 0.2s ease');

    // Node labels
    const labels = node.append('text')
      .text(d => d.node.title)
      .attr('x', d => d.radius + 5)
      .attr('y', 4)
      .attr('font-size', '12px')
      .attr('fill', '#374151')
      .attr('font-weight', '500')
      .style('pointer-events', 'none')
      .style('opacity', showLabels ? 1 : 0);

    // Node interactions
    node
      .on('click', (event, d) => {
        event.stopPropagation();
        setSelectedNodeId(d.id);
        setShowSidebar(true);
        onNodeClick?.(d.node);
      })
      .on('mouseenter', (event, d) => {
        setHoveredNodeId(d.id);
        
        // Highlight connected links
        const connected = getConnectedNodes(d.id);
        link
          .attr('stroke-opacity', l => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return (sourceId === d.id || targetId === d.id) ? 0.8 : 0.1;
          })
          .attr('stroke', l => {
            const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
            const targetId = typeof l.target === 'string' ? l.target : l.target.id;
            return (sourceId === d.id || targetId === d.id) ? d.color : '#94a3b8';
          });

        // Dim other nodes
        node.selectAll('circle')
          .attr('opacity', n => 
            n.id === d.id || connected.has(n.id) ? 1 : 0.3
          );
      })
      .on('mouseleave', () => {
        setHoveredNodeId(null);
        link
          .attr('stroke-opacity', 0.4)
          .attr('stroke', '#94a3b8');
        node.selectAll('circle').attr('opacity', 1);
      });

    // Update positions on tick
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as SimulationNode).x!)
        .attr('y1', d => (d.source as SimulationNode).y!)
        .attr('x2', d => (d.target as SimulationNode).x!)
        .attr('y2', d => (d.target as SimulationNode).y!);

      node.attr('transform', d => `translate(${d.x},${d.y})`);
    });

    // Highlight selected node
    if (selectedNodeId && nodeMap.has(selectedNodeId)) {
      const connected = getConnectedNodes(selectedNodeId);
      
      node.selectAll('circle')
        .attr('stroke-width', d => d.id === selectedNodeId ? 4 : 2)
        .attr('stroke', d => {
          if (d.id === selectedNodeId) return '#f59e0b';
          if (connected.has(d.id)) return '#3b82f6';
          return '#fff';
        });

      link
        .attr('stroke-opacity', l => {
          const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
          const targetId = typeof l.target === 'string' ? l.target : l.target.id;
          return (sourceId === selectedNodeId || targetId === selectedNodeId) ? 0.8 : 0.1;
        });
    }

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [graph, width, height, selectedNodeId, colorScheme, activeTypes, showLabels, getFilteredData, getConnectedNodes, onNodeClick]);

  // Zoom controls
  const handleZoomIn = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 1.3);
  };

  const handleZoomOut = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(300)
      .call(zoomRef.current.scaleBy, 0.7);
  };

  const handleResetZoom = () => {
    if (!svgRef.current || !zoomRef.current) return;
    d3.select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, d3.zoomIdentity);
  };

  // Toggle node type filter
  const toggleType = (type: KnowledgeNodeType) => {
    setActiveTypes(prev => {
      const next = new Set(prev);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  };

  // Get selected node info
  const selectedNode = selectedNodeId ? graph.nodes.get(selectedNodeId) : null;
  const selectedNodeConnections = selectedNodeId ? getConnectedNodes(selectedNodeId) : new Set<string>();

  return (
    <div ref={containerRef} className={cn('relative bg-gray-50 dark:bg-gray-900 rounded-lg overflow-hidden', className)}>
      {/* Controls */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
        {/* Zoom controls */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-1.5 flex flex-col gap-1">
          <button
            onClick={handleZoomIn}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Zoom in"
          >
            <ZoomIn className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Zoom out"
          >
            <ZoomOut className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <button
            onClick={handleResetZoom}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
            title="Reset view"
          >
            <Maximize2 className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
        </div>

        {/* Color scheme */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-2">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Color by</div>
          <div className="flex flex-col gap-1">
            {(['type', 'difficulty', 'hub'] as const).map(scheme => (
              <button
                key={scheme}
                onClick={() => setColorScheme(scheme)}
                className={cn(
                  'px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize',
                  colorScheme === scheme
                    ? 'bg-primary-100 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                )}
              >
                {scheme}
              </button>
            ))}
          </div>
        </div>

        {/* Toggle labels */}
        <button
          onClick={() => setShowLabels(!showLabels)}
          className={cn(
            'bg-white dark:bg-gray-800 rounded-lg shadow-md px-3 py-2 text-sm font-medium transition-colors',
            showLabels 
              ? 'text-primary-600 dark:text-primary-400' 
              : 'text-gray-600 dark:text-gray-300'
          )}
        >
          Labels
        </button>
      </div>

      {/* Type filter */}
      <div className="absolute bottom-4 left-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 max-w-xs">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Filter Types</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(TYPE_COLORS) as KnowledgeNodeType[]).map(type => (
            <button
              key={type}
              onClick={() => toggleType(type)}
              className={cn(
                'px-2 py-1 text-xs font-medium rounded-full capitalize transition-all',
                activeTypes.has(type)
                  ? 'text-white shadow-sm'
                  : 'bg-gray-100 text-gray-400 dark:bg-gray-700 dark:text-gray-500'
              )}
              style={{
                backgroundColor: activeTypes.has(type) ? TYPE_COLORS[type] : undefined,
              }}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute top-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-md p-3">
        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Legend</div>
        {colorScheme === 'type' && (
          <div className="space-y-1">
            {(Object.entries(TYPE_COLORS) as [KnowledgeNodeType, string][]).map(([type, color]) => (
              <div key={type} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{type}</span>
              </div>
            ))}
          </div>
        )}
        {colorScheme === 'difficulty' && (
          <div className="space-y-1">
            {Object.entries(DIFFICULTY_COLORS).map(([diff, color]) => (
              <div key={diff} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600 dark:text-gray-300 capitalize">{diff}</span>
              </div>
            ))}
          </div>
        )}
        {colorScheme === 'hub' && (
          <div className="space-y-1">
            {Object.entries(HUB_COLORS).map(([hub, color]) => (
              <div key={hub} className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-xs text-gray-600 dark:text-gray-300 uppercase">{hub}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="absolute bottom-4 right-4 z-10 bg-white dark:bg-gray-800 rounded-lg shadow-md px-4 py-2">
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {graph.nodes.size} nodes · {graph.edges.size} edges
        </div>
      </div>

      {/* SVG */}
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="cursor-grab active:cursor-grabbing"
      />

      {/* Sidebar */}
      {showSidebar && selectedNode && (
        <div className="absolute inset-y-0 right-0 w-80 bg-white dark:bg-gray-800 shadow-xl border-l border-gray-200 dark:border-gray-700 z-20 overflow-y-auto">
          <div className="p-4">
            <div className="flex items-start justify-between mb-4">
              <span 
                className="px-2 py-1 text-xs font-medium rounded-full text-white"
                style={{ backgroundColor: TYPE_COLORS[selectedNode.type] }}
              >
                {selectedNode.type}
              </span>
              <button
                onClick={() => setShowSidebar(false)}
                className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {selectedNode.title}
            </h2>
            
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              {selectedNode.description}
            </p>

            <div className="space-y-3 mb-6">
              <div className="flex items-center gap-2 text-sm">
                <Target className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Difficulty:</span>
                <span 
                  className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                  style={{ backgroundColor: DIFFICULTY_COLORS[selectedNode.difficulty] }}
                >
                  {selectedNode.difficulty}
                </span>
              </div>
              
              {selectedNode.hub && (
                <div className="flex items-center gap-2 text-sm">
                  <Layers className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600 dark:text-gray-400">Hub:</span>
                  <span 
                    className="px-2 py-0.5 rounded-full text-xs font-medium text-white"
                    style={{ backgroundColor: HUB_COLORS[selectedNode.hub] || '#6b7280' }}
                  >
                    {selectedNode.hub.toUpperCase()}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2 text-sm">
                <GitBranch className="w-4 h-4 text-gray-400" />
                <span className="text-gray-600 dark:text-gray-400">Connections:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {selectedNodeConnections.size}
                </span>
              </div>
            </div>

            {selectedNode.content && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2 flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  About
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedNode.content}
                </p>
              </div>
            )}

            {selectedNodeConnections.size > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  Connected Topics
                </h3>
                <div className="space-y-1.5">
                  {Array.from(selectedNodeConnections).map(id => {
                    const node = graph.nodes.get(id);
                    if (!node) return null;
                    return (
                      <button
                        key={id}
                        onClick={() => setSelectedNodeId(id)}
                        className="w-full text-left px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-700/50 
                                   hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {node.title}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 ml-2 capitalize">
                          ({node.type})
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraphView;
