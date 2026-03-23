/** [Ver001.000] */
/**
 * useRecommendations Hook
 * =======================
 * React hook for fetching and managing personalized help recommendations.
 * Integrates with user expertise tracking for contextual suggestions.
 * 
 * @example
 * ```tsx
 * const { recommendations, refresh, isLoading, markCompleted } = useRecommendations({
 *   userId: 'user-123',
 *   currentNodeId: 'node-456',
 * });
 * ```
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  KnowledgeNode,
  PersonalizedRecommendation,
  RecommendationContext,
  ExpertiseLevel,
  UserExpertiseProfile,
} from '@sator/types/help';

// ============================================================================
// Hook Options
// ============================================================================

export interface UseRecommendationsOptions {
  /** User ID for personalization */
  userId: string;
  /** Current node being viewed (optional) */
  currentNodeId?: string;
  /** User's expertise level */
  userExpertiseLevel?: ExpertiseLevel;
  /** Maximum number of recommendations */
  maxRecommendations?: number;
  /** API endpoint for recommendations */
  apiEndpoint?: string;
  /** Auto-fetch on mount or when dependencies change */
  autoFetch?: boolean;
  /** Poll interval in ms (0 to disable) */
  pollInterval?: number;
  /** Initial data to avoid loading state */
  initialData?: PersonalizedRecommendation[];
}

// ============================================================================
// Hook Return Type
// ============================================================================

export interface UseRecommendationsReturn {
  /** Current recommendations */
  recommendations: PersonalizedRecommendation[];
  /** Next best recommendation */
  nextBest: PersonalizedRecommendation | null;
  /** Whether recommendations are loading */
  isLoading: boolean;
  /** Error if any occurred */
  error: Error | null;
  /** Refresh recommendations */
  refresh: () => Promise<void>;
  /** Mark a node as completed */
  markCompleted: (nodeId: string, score?: number) => Promise<void>;
  /** Mark a node as in progress */
  markInProgress: (nodeId: string) => Promise<void>;
  /** Record node access for progress tracking */
  recordAccess: (nodeId: string, timeSpentSeconds?: number) => Promise<void>;
  /** Dismiss a recommendation */
  dismissRecommendation: (nodeId: string) => void;
  /** Get learning path to a target node */
  getLearningPath: (fromNodeId: string, toNodeId: string) => Promise<KnowledgeNode[] | null>;
  /** Completed node IDs */
  completedNodes: string[];
  /** In-progress node IDs */
  inProgressNodes: string[];
  /** User expertise profile */
  userProfile: UserExpertiseProfile | null;
}

// ============================================================================
// Hook Implementation
// ============================================================================

const DISMISSED_KEY = 'help_dismissed_recommendations';

export function useRecommendations(
  options: UseRecommendationsOptions
): UseRecommendationsReturn {
  const {
    userId,
    currentNodeId,
    userExpertiseLevel = 'beginner',
    maxRecommendations = 5,
    apiEndpoint = '/api/v1/help/recommendations',
    autoFetch = true,
    pollInterval = 0,
    initialData,
  } = options;

  const [recommendations, setRecommendations] = useState<PersonalizedRecommendation[]>(
    initialData || []
  );
  const [nextBest, setNextBest] = useState<PersonalizedRecommendation | null>(null);
  const [isLoading, setIsLoading] = useState(!initialData && autoFetch);
  const [error, setError] = useState<Error | null>(null);
  const [completedNodes, setCompletedNodes] = useState<string[]>([]);
  const [inProgressNodes, setInProgressNodes] = useState<string[]>([]);
  const [userProfile, setUserProfile] = useState<UserExpertiseProfile | null>(null);
  const [dismissedNodes, setDismissedNodes] = useState<Set<string>>(new Set());

  const abortControllerRef = useRef<AbortController | null>(null);
  const isFirstLoadRef = useRef(true);

  // Load dismissed recommendations from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`${DISMISSED_KEY}_${userId}`);
      if (stored) {
        setDismissedNodes(new Set(JSON.parse(stored)));
      }
    } catch {
      // Ignore localStorage errors
    }
  }, [userId]);

  // Save dismissed recommendations
  const saveDismissed = useCallback((dismissed: Set<string>) => {
    try {
      localStorage.setItem(`${DISMISSED_KEY}_${userId}`, JSON.stringify([...dismissed]));
    } catch {
      // Ignore localStorage errors
    }
  }, [userId]);

  /**
   * Fetch recommendations from API
   */
  const fetchRecommendations = useCallback(async () => {
    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setIsLoading(true);
      setError(null);

      const context: RecommendationContext = {
        userId,
        currentNodeId,
        userLevel: userExpertiseLevel,
        recentNodes: inProgressNodes.slice(0, 10),
        completedNodes: [...completedNodes, ...Array.from(dismissedNodes).map(String)],
        maxRecommendations,
      };

      const response = await fetch(apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(context),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch recommendations: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (!controller.signal.aborted) {
        setRecommendations(data.recommendations || []);
        setNextBest(data.nextBest || null);
        
        // Update user profile if returned
        if (data.userProfile) {
          setUserProfile(data.userProfile);
        }

        // Update completed/in-progress nodes if returned
        if (data.completedNodes) {
          setCompletedNodes(data.completedNodes);
        }
        if (data.inProgressNodes) {
          setInProgressNodes(data.inProgressNodes);
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        return;
      }
      
      setError(err instanceof Error ? err : new Error('Failed to fetch recommendations'));
      console.error('Recommendations error:', err);
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false);
      }
    }
  }, [
    userId,
    currentNodeId,
    userExpertiseLevel,
    maxRecommendations,
    apiEndpoint,
    completedNodes,
    inProgressNodes,
    dismissedNodes,
  ]);

  /**
   * Refresh recommendations
   */
  const refresh = useCallback(async () => {
    await fetchRecommendations();
  }, [fetchRecommendations]);

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    if (autoFetch) {
      fetchRecommendations();
    }
    isFirstLoadRef.current = false;
  }, [userId, currentNodeId, userExpertiseLevel]); // eslint-disable-line react-hooks/exhaustive-deps

  // Polling
  useEffect(() => {
    if (pollInterval > 0) {
      const interval = setInterval(fetchRecommendations, pollInterval);
      return () => clearInterval(interval);
    }
  }, [pollInterval, fetchRecommendations]);

  /**
   * Mark a node as completed
   */
  const markCompleted = useCallback(async (nodeId: string, score?: number) => {
    try {
      const response = await fetch(`${apiEndpoint}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nodeId,
          action: 'complete',
          score,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark node as completed');
      }

      // Optimistic update
      setCompletedNodes(prev => [...prev.filter(id => id !== nodeId), nodeId]);
      setInProgressNodes(prev => prev.filter(id => id !== nodeId));

      // Remove from recommendations
      setRecommendations(prev => prev.filter(r => r.node.id !== nodeId));

      // Refresh to get new recommendations
      if (!isFirstLoadRef.current) {
        await fetchRecommendations();
      }
    } catch (err) {
      console.error('Error marking node as completed:', err);
    }
  }, [userId, apiEndpoint, fetchRecommendations]);

  /**
   * Mark a node as in progress
   */
  const markInProgress = useCallback(async (nodeId: string) => {
    try {
      const response = await fetch(`${apiEndpoint}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nodeId,
          action: 'start',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark node as in progress');
      }

      // Optimistic update
      setInProgressNodes(prev => [...prev.filter(id => id !== nodeId), nodeId]);
    } catch (err) {
      console.error('Error marking node as in progress:', err);
    }
  }, [userId, apiEndpoint]);

  /**
   * Record node access
   */
  const recordAccess = useCallback(async (nodeId: string, timeSpentSeconds?: number) => {
    try {
      await fetch(`${apiEndpoint}/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          nodeId,
          action: 'access',
          timeSpentSeconds,
        }),
      });

      // Optimistic update
      if (!inProgressNodes.includes(nodeId) && !completedNodes.includes(nodeId)) {
        setInProgressNodes(prev => [...prev, nodeId]);
      }
    } catch (err) {
      console.error('Error recording node access:', err);
    }
  }, [userId, apiEndpoint, inProgressNodes, completedNodes]);

  /**
   * Dismiss a recommendation
   */
  const dismissRecommendation = useCallback((nodeId: string) => {
    setDismissedNodes(prev => {
      const updated = new Set(prev);
      updated.add(nodeId);
      saveDismissed(updated);
      return updated;
    });

    // Remove from current recommendations
    setRecommendations(prev => prev.filter(r => r.node.id !== nodeId));
  }, [saveDismissed]);

  /**
   * Get learning path between nodes
   */
  const getLearningPath = useCallback(async (
    fromNodeId: string,
    toNodeId: string
  ): Promise<KnowledgeNode[] | null> => {
    try {
      const response = await fetch(
        `${apiEndpoint}/path?from=${fromNodeId}&to=${toNodeId}&userId=${userId}`
      );

      if (!response.ok) {
        throw new Error('Failed to get learning path');
      }

      const data = await response.json();
      return data.path || null;
    } catch (err) {
      console.error('Error getting learning path:', err);
      return null;
    }
  }, [userId, apiEndpoint]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Filter out dismissed recommendations
  const visibleRecommendations = recommendations.filter(
    r => !dismissedNodes.has(r.node.id)
  );

  return {
    recommendations: visibleRecommendations,
    nextBest: nextBest && !dismissedNodes.has(nextBest.node.id) ? nextBest : null,
    isLoading,
    error,
    refresh,
    markCompleted,
    markInProgress,
    recordAccess,
    dismissRecommendation,
    getLearningPath,
    completedNodes,
    inProgressNodes,
    userProfile,
  };
}

export default useRecommendations;
