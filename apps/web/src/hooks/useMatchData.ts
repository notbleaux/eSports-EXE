/**
 * useMatchData Hook
 *
 * Fetches detailed match data using TanStack Query with REALTIME cache strategy.
 * Integrates with SyncManager for real-time WebSocket synchronization via match_update and score_update messages.
 *
 * [Ver001.000]
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, CACHE_CONFIGS } from '@lib/cache-manager';
import { pandascoreApi } from '@api/pandascore';
import type { PandascoreMatch } from '@api/pandascore';

interface UseMatchDataOptions {
  matchId: string;
  enabled?: boolean;
}

export function useMatchData({
  matchId,
  enabled = true,
}: UseMatchDataOptions): UseQueryResult<PandascoreMatch, Error> {
  return useQuery({
    queryKey: queryKeys.matches.detail(matchId),
    queryFn: async () => {
      return pandascoreApi.fetchMatchDetails(Number(matchId));
    },
    staleTime: CACHE_CONFIGS.REALTIME.staleTime,
    gcTime: CACHE_CONFIGS.REALTIME.cacheTime,
    refetchInterval: CACHE_CONFIGS.REALTIME.refetchInterval,
    refetchOnWindowFocus: CACHE_CONFIGS.REALTIME.refetchOnWindowFocus,
    refetchOnReconnect: CACHE_CONFIGS.REALTIME.refetchOnReconnect,
    enabled,
    retry: 2,
  });
}
