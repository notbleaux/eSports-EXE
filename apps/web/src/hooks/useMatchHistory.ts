/**
 * useMatchHistory Hook
 *
 * Fetches historical match data using TanStack Query with HISTORICAL cache strategy.
 * Optimized for one-time loads and static reference data.
 *
 * [Ver001.000]
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, CACHE_CONFIGS } from '@lib/cache-manager';
import { pandascoreApi } from '@api/pandascore';
import type { PandascoreMatch } from '@api/pandascore';

interface UseMatchHistoryOptions {
  game?: string;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useMatchHistory({
  game,
  limit = 20,
  offset = 0,
  enabled = true,
}: UseMatchHistoryOptions = {}): UseQueryResult<PandascoreMatch[], Error> {
  return useQuery({
    queryKey: queryKeys.matches.historyByGame(game, limit, offset),
    queryFn: async () => {
      const videogame = (game as 'valorant') ?? 'valorant';
      return pandascoreApi.fetchMatches(videogame, 'finished', limit);
    },
    staleTime: CACHE_CONFIGS.HISTORICAL.staleTime,
    gcTime: CACHE_CONFIGS.HISTORICAL.cacheTime,
    enabled,
    retry: 2,
  });
}
