/**
 * useLiveMatches Hook
 *
 * Fetches live match data using TanStack Query with LIVE cache strategy.
 * Integrates with SyncManager for real-time WebSocket synchronization via batch updates.
 *
 * [Ver001.000]
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, CACHE_CONFIGS } from '@lib/cache-manager';
import { pandascoreApi } from '@api/pandascore';
import type { PandascoreMatch } from '@api/pandascore';

interface UseLiveMatchesOptions {
  game?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useLiveMatches({
  game,
  limit = 20,
  offset: _offset = 0,
  enabled = true,
}: UseLiveMatchesOptions = {}): UseQueryResult<PandascoreMatch[], Error> {
  return useQuery({
    queryKey: queryKeys.matches.liveByGame(game),
    queryFn: async () => {
      const videogame = (game as 'valorant') ?? 'valorant';
      return pandascoreApi.fetchMatches(videogame, 'running', limit);
    },
    staleTime: CACHE_CONFIGS.LIVE.staleTime,
    gcTime: CACHE_CONFIGS.LIVE.cacheTime,
    refetchInterval: CACHE_CONFIGS.LIVE.refetchInterval,
    refetchOnWindowFocus: CACHE_CONFIGS.LIVE.refetchOnWindowFocus,
    refetchOnReconnect: CACHE_CONFIGS.LIVE.refetchOnReconnect,
    enabled,
    retry: 2,
  });
}
