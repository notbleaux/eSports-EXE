/**
 * useQuarterStats Hook
 * 
 * Fetches live statistics for quarters.
 * 
 * @see SPEC-TD-P3-001 for full specification
 */

import { useState, useEffect, useCallback } from 'react';
import type { QuarterStats, QuarterId } from '../types';

type QuarterStatsMap = Record<QuarterId, QuarterStats | undefined>;

interface UseQuarterStatsResult {
  /** Stats for each quarter */
  stats: QuarterStatsMap;
  /** Loading state */
  loading: boolean;
  /** Error state */
  error: Error | null;
  /** Manually refresh stats */
  refresh: () => void;
}

/**
 * Hook for fetching live quarter statistics.
 * 
 * @param gameId - The game identifier
 * @param refreshInterval - Auto-refresh interval in ms (default: 30000)
 * 
 * @example
 * ```tsx
 * const { stats, loading } = useQuarterStats('valorant');
 * // stats.SATOR?.liveEvents
 * ```
 */
export function useQuarterStats(
  gameId: string,
  refreshInterval: number = 30000
): UseQuarterStatsResult {
  const [stats, setStats] = useState<QuarterStatsMap>({
    SATOR: undefined,
    AREPO: undefined,
    OPERA: undefined,
    ROTAS: undefined,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // TODO: Replace with actual API call
      // const response = await fetch(`/api/v1/games/${gameId}/quarter-stats`);
      // const data = await response.json();

      // Mock data for now
      const mockData: QuarterStatsMap = {
        SATOR: { liveEvents: 3, activeUsers: 1247, recentUpdates: 12 },
        AREPO: { liveEvents: 0, activeUsers: 3421, recentUpdates: 45 },
        OPERA: { liveEvents: 2, activeUsers: 892, recentUpdates: 8 },
        ROTAS: { liveEvents: 0, activeUsers: 2156, recentUpdates: 23 },
      };

      setStats(mockData);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch stats'));
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    fetchStats();

    // Auto-refresh
    const interval = setInterval(fetchStats, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchStats, refreshInterval]);

  return {
    stats,
    loading,
    error,
    refresh: fetchStats,
  };
}
