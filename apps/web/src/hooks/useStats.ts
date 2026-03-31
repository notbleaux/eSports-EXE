/**
 * React Hooks for Stats API
 * 
 * Provides data fetching with loading states, error handling, and caching.
 * Phase 3: Frontend Integration
 * 
 * [Ver001.000]
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import * as statsApi from '@/lib/api/stats';

// --- Query Keys ---

export const statsKeys = {
  all: ['stats'] as const,
  player: (id: number, options?: object) => [...statsKeys.all, 'player', id, options] as const,
  match: (id: number) => [...statsKeys.all, 'match', id] as const,
  trends: (id: number, options?: object) => [...statsKeys.all, 'trends', id, options] as const,
  comparison: (id1: number, id2: number) => [...statsKeys.all, 'comparison', id1, id2] as const,
  leaderboard: (category: string, options?: object) => [...statsKeys.all, 'leaderboard', category, options] as const,
  cache: () => [...statsKeys.all, 'cache'] as const,
};

// --- Player Stats Hook ---

interface UsePlayerStatsOptions {
  game?: string;
  periodDays?: number;
  useCache?: boolean;
  enabled?: boolean;
}

export function usePlayerStats(
  playerId: number,
  options: UsePlayerStatsOptions = {}
) {
  const { game = 'valorant', periodDays = 30, useCache = true, enabled = true } = options;
  
  return useQuery({
    queryKey: statsKeys.player(playerId, { game, periodDays }),
    queryFn: () => statsApi.getPlayerStats(playerId, { game, periodDays, useCache }),
    enabled: !!playerId && enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}

// --- Match Stats Hook ---

interface UseMatchStatsOptions {
  useCache?: boolean;
  enabled?: boolean;
}

export function useMatchStats(
  matchId: number,
  options: UseMatchStatsOptions = {}
) {
  const { useCache = true, enabled = true } = options;
  
  return useQuery({
    queryKey: statsKeys.match(matchId),
    queryFn: () => statsApi.getMatchStats(matchId, useCache),
    enabled: !!matchId && enabled,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

// --- Player Trends Hook ---

interface UsePlayerTrendsOptions {
  game?: string;
  currentPeriodDays?: number;
  previousPeriodDays?: number;
  enabled?: boolean;
}

export function usePlayerTrends(
  playerId: number,
  options: UsePlayerTrendsOptions = {}
) {
  const {
    game = 'valorant',
    currentPeriodDays = 14,
    previousPeriodDays = 14,
    enabled = true,
  } = options;
  
  return useQuery({
    queryKey: statsKeys.trends(playerId, { game, currentPeriodDays, previousPeriodDays }),
    queryFn: () => statsApi.getPlayerTrends(playerId, { game, currentPeriodDays, previousPeriodDays }),
    enabled: !!playerId && enabled,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

// --- Player Comparison Hook ---

interface UsePlayerComparisonOptions {
  game?: string;
  periodDays?: number;
  enabled?: boolean;
}

export function usePlayerComparison(
  player1Id: number,
  player2Id: number,
  options: UsePlayerComparisonOptions = {}
) {
  const { game = 'valorant', periodDays = 30, enabled = true } = options;
  
  return useQuery({
    queryKey: statsKeys.comparison(player1Id, player2Id),
    queryFn: () => statsApi.comparePlayers(player1Id, player2Id, { game, periodDays }),
    enabled: !!player1Id && !!player2Id && enabled,
    staleTime: 10 * 60 * 1000,
  });
}

// --- Leaderboard Hook ---

interface UseLeaderboardOptions {
  game?: string;
  limit?: number;
  periodDays?: number;
  enabled?: boolean;
}

export function useLeaderboard(
  category: 'kda' | 'acs' | 'adr' | 'kast' | 'kills' | 'headshot_pct' = 'kda',
  options: UseLeaderboardOptions = {}
) {
  const { game = 'valorant', limit = 10, periodDays = 30, enabled = true } = options;
  
  return useQuery({
    queryKey: statsKeys.leaderboard(category, { game, limit, periodDays }),
    queryFn: () => statsApi.getLeaderboard(category, { game, limit, periodDays }),
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// --- Cache Stats Hook (Admin) ---

export function useCacheStats(enabled = false) {
  return useQuery({
    queryKey: statsKeys.cache(),
    queryFn: statsApi.getCacheStats,
    enabled,
    staleTime: 60 * 1000, // 1 minute
  });
}

// --- Invalidate Cache Mutation ---

export function useInvalidatePlayerCache() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ playerId, game }: { playerId: number; game?: string }) =>
      statsApi.invalidatePlayerCache(playerId, game),
    onSuccess: (_, variables) => {
      // Invalidate all queries for this player
      queryClient.invalidateQueries({
        queryKey: statsKeys.player(variables.playerId),
      });
    },
  });
}

// --- Optimistic Update Helper ---

export function useOptimisticPlayerStats(playerId: number) {
  const queryClient = useQueryClient();
  
  const updateStats = useCallback((updater: (old: statsApi.AggregatedPlayerStats | undefined) => statsApi.AggregatedPlayerStats | undefined) => {
    queryClient.setQueryData(
      statsKeys.player(playerId),
      updater
    );
  }, [queryClient, playerId]);
  
  return { updateStats };
}

// --- Polling Hook for Live Data ---

interface UsePollingOptions {
  interval?: number;
  enabled?: boolean;
}

export function usePollingStats(
  playerId: number,
  options: UsePollingOptions = {}
) {
  const { interval = 30000, enabled = true } = options;
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playerIdRef = useRef(playerId);
  const queryClient = useQueryClient();
  
  // Keep ref updated to avoid stale closure
  playerIdRef.current = playerId;
  
  const startPolling = useCallback(() => {
    if (intervalRef.current) return;
    
    setIsPolling(true);
    intervalRef.current = setInterval(() => {
      // Use ref for latest value to avoid stale closure
      queryClient.invalidateQueries({
        queryKey: statsKeys.player(playerIdRef.current),
      });
    }, interval);
  }, [queryClient, interval]);
  
  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
  }, []);
  
  useEffect(() => {
    if (enabled) {
      startPolling();
    } else {
      stopPolling();
    }
    
    return () => stopPolling();
  }, [enabled, startPolling, stopPolling]);
  
  return { isPolling, startPolling, stopPolling };
}

// --- Combined Hook for Player Dashboard ---

interface UsePlayerDashboardOptions {
  game?: string;
  periodDays?: number;
  trendsPeriodDays?: number;
  enabled?: boolean;
}

export function usePlayerDashboard(
  playerId: number,
  options: UsePlayerDashboardOptions = {}
) {
  const {
    game = 'valorant',
    periodDays = 30,
    trendsPeriodDays = 14,
    enabled = true,
  } = options;
  
  const statsQuery = usePlayerStats(playerId, { game, periodDays, enabled });
  const trendsQuery = usePlayerTrends(playerId, {
    game,
    currentPeriodDays: trendsPeriodDays,
    enabled: enabled && !statsQuery.isLoading,
  });
  
  return {
    stats: statsQuery.data,
    trends: trendsQuery.data,
    isLoading: statsQuery.isLoading || trendsQuery.isLoading,
    isError: statsQuery.isError || trendsQuery.isError,
    error: statsQuery.error || trendsQuery.error,
    refetch: () => {
      statsQuery.refetch();
      trendsQuery.refetch();
    },
  };
}

// --- Hook for Prefetching ---

export function usePrefetchPlayerStats() {
  const queryClient = useQueryClient();
  
  return useCallback((playerId: number, options?: { game?: string; periodDays?: number }) => {
    queryClient.prefetchQuery({
      queryKey: statsKeys.player(playerId, options),
      queryFn: () => statsApi.getPlayerStats(playerId, options),
      staleTime: 5 * 60 * 1000,
    });
  }, [queryClient]);
}
