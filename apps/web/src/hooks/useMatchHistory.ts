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
import { rotasApi } from '@api/rotas';
import type { RotasMatchSummary } from '@api/rotas';

interface UseMatchHistoryOptions {
  game?: string;
  teamId?: number;
  limit?: number;
  offset?: number;
  enabled?: boolean;
}

export function useMatchHistory({
  game,
  teamId,
  limit = 20,
  offset = 0,
  enabled = true,
}: UseMatchHistoryOptions = {}): UseQueryResult<RotasMatchSummary[], Error> {
  return useQuery({
    queryKey: queryKeys.matches.historyByGame(game, limit, offset),
    queryFn: async () => {
      const videogame = game ?? 'valorant';
      const response = await rotasApi.matches.history(videogame, teamId, 1, limit);
      return response.items;
    },
    staleTime: CACHE_CONFIGS.HISTORICAL.staleTime,
    gcTime: CACHE_CONFIGS.HISTORICAL.cacheTime,
    enabled,
    retry: 2,
  });
}
