/** [Ver001.000] */
/**
 * useKnowledgeGraph Hook
 * ======================
 * React hook for interacting with the help knowledge graph.
 * Provides graph traversal, path finding, and topic discovery.
 * 
 * @example
 * ```tsx
 * const { findRelated, findPrerequisites, findPath, isLoading } = useKnowledgeGraph();
 * const relatedTopics = await findRelated('topic-123');
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { createLogger } from '@/utils/logger';
import type {
  KnowledgeGraph,
  HelpTopic,
  SearchResult,
} from '@sator/types/help';
import type {
  KnowledgeGraphSearchFilters,
  KnowledgeGraphRecommendationContext,
} from '@sator/services/help';

// ============================================================================
// Logger
// ============================================================================

const logger = createLogger('useKnowledgeGraph');

// ============================================================================
// Hook Options
// ============================================================================

export interface UseKnowledgeGraphOptions {
  /** Initial graph data to load */
  initialData?: KnowledgeGraph;
  /** Auto-load graph on mount */
  autoLoad?: boolean;
  /** Graph API endpoint */
  apiEndpoint?: string;
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseKnowledgeGraphReturn {
  /** The knowledge graph instance */
  graph: KnowledgeGraph | null;
  /** Whether the graph is loading */
  isLoading: boolean;
  /** Error if any occurred */
  error: Error | null;
  /** Find related topics */
  findRelated: (topicId: string, limit?: number) => Promise<HelpTopic[]>;
  /** Find prerequisite topics */
  findPrerequisites: (topicId: string) => Promise<HelpTopic[]>;
  /** Find path between topics */
  findPath: (fromTopicId: string, toTopicId: string) => Promise<HelpTopic[]>;
  /** Search topics */
  search: (query: string, filters?: KnowledgeGraphSearchFilters) => Promise<SearchResult[]>;
  /** Get recommendations */
  recommend: (context: KnowledgeGraphRecommendationContext) => Promise<HelpTopic[]>;
  /** Load graph from API */
  loadGraph: () => Promise<void>;
  /** Refresh graph data */
  refresh: () => Promise<void>;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useKnowledgeGraph(
  options: UseKnowledgeGraphOptions = {}
): UseKnowledgeGraphReturn {
  const {
    initialData,
    autoLoad = true,
    apiEndpoint = '/api/v1/help/graph',
  } = options;

  const [graph, setGraph] = useState<KnowledgeGraph | null>(initialData || null);
  const [isLoading, setIsLoading] = useState(!initialData && autoLoad);
  const [error, setError] = useState<Error | null>(null);
  
  // Cache for graph operations
  const cacheRef = useRef<Map<string, unknown>>(new Map());

  /**
   * Load graph data from API
   */
  const loadGraph = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(apiEndpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to load knowledge graph: ${response.statusText}`);
      }

      const data: KnowledgeGraph = await response.json();
      setGraph(data);
      
      // Clear cache when graph reloads
      cacheRef.current.clear();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load knowledge graph'));
      logger.error('Error loading knowledge graph', {
        error: err instanceof Error ? err.message : String(err),
      });
    } finally {
      setIsLoading(false);
    }
  }, [apiEndpoint]);

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad && !initialData) {
      loadGraph();
    }
  }, [autoLoad, initialData, loadGraph]);

  /**
   * Find related topics with caching
   */
  const findRelated = useCallback(async (
    topicId: string,
    limit: number = 5
  ): Promise<HelpTopic[]> => {
    const cacheKey = `related-${topicId}-${limit}`;
    
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey) as HelpTopic[];
    }

    try {
      const response = await fetch(
        `${apiEndpoint}/topics/${topicId}/related?limit=${limit}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch related topics');
      }

      const data: HelpTopic[] = await response.json();
      cacheRef.current.set(cacheKey, data);
      return data;
    } catch (err) {
      logger.error('Error finding related topics', {
        error: err instanceof Error ? err.message : String(err),
        topicId,
      });
      return [];
    }
  }, [apiEndpoint]);

  /**
   * Find prerequisite topics with caching
   */
  const findPrerequisites = useCallback(async (
    topicId: string
  ): Promise<HelpTopic[]> => {
    const cacheKey = `prereqs-${topicId}`;
    
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey) as HelpTopic[];
    }

    try {
      const response = await fetch(
        `${apiEndpoint}/topics/${topicId}/prerequisites`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch prerequisites');
      }

      const data: HelpTopic[] = await response.json();
      cacheRef.current.set(cacheKey, data);
      return data;
    } catch (err) {
      logger.error('Error finding prerequisites', {
        error: err instanceof Error ? err.message : String(err),
        topicId,
      });
      return [];
    }
  }, [apiEndpoint]);

  /**
   * Find learning path between topics
   */
  const findPath = useCallback(async (
    fromTopicId: string,
    toTopicId: string
  ): Promise<HelpTopic[]> => {
    const cacheKey = `path-${fromTopicId}-${toTopicId}`;
    
    if (cacheRef.current.has(cacheKey)) {
      return cacheRef.current.get(cacheKey) as HelpTopic[];
    }

    try {
      const response = await fetch(
        `${apiEndpoint}/path?from=${fromTopicId}&to=${toTopicId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to find path');
      }

      const data: HelpTopic[] = await response.json();
      cacheRef.current.set(cacheKey, data);
      return data;
    } catch (err) {
      logger.error('Error finding path', {
        error: err instanceof Error ? err.message : String(err),
        fromTopicId,
        toTopicId,
      });
      return [];
    }
  }, [apiEndpoint]);

  /**
   * Search topics
   */
  const search = useCallback(async (
    query: string,
    filters?: KnowledgeGraphSearchFilters
  ): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    try {
      const filterParams = filters 
        ? new URLSearchParams({
            ...(filters.types && { types: filters.types.join(',') }),
            ...(filters.difficulties && { difficulties: filters.difficulties.join(',') }),
            ...(filters.categories && { categories: filters.categories.join(',') }),
          })
        : '';

      const response = await fetch(
        `${apiEndpoint}/search?q=${encodeURIComponent(query)}&${filterParams}`
      );
      
      if (!response.ok) {
        throw new Error('Search failed');
      }

      return await response.json();
    } catch (err) {
      logger.error('Error searching topics', {
        error: err instanceof Error ? err.message : String(err),
        query,
      });
      return [];
    }
  }, [apiEndpoint]);

  /**
   * Get personalized recommendations
   */
  const recommend = useCallback(async (
    context: KnowledgeGraphRecommendationContext
  ): Promise<HelpTopic[]> => {
    try {
      const response = await fetch(`${apiEndpoint}/recommendations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
      });
      
      if (!response.ok) {
        throw new Error('Failed to get recommendations');
      }

      return await response.json();
    } catch (err) {
      logger.error('Error getting recommendations', {
        error: err instanceof Error ? err.message : String(err),
        context,
      });
      return [];
    }
  }, [apiEndpoint]);

  /**
   * Refresh graph data
   */
  const refresh = useCallback(async () => {
    cacheRef.current.clear();
    await loadGraph();
  }, [loadGraph]);

  return {
    graph,
    isLoading,
    error,
    findRelated,
    findPrerequisites,
    findPath,
    search,
    recommend,
    loadGraph,
    refresh,
  };
}

export default useKnowledgeGraph;
