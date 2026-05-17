/**
 * usePlayerStats Hook
 *
 * Fetches career statistics for a player from ROTAS backend.
 *
 * [Ver001.000]
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, CACHE_CONFIGS } from '@lib/cache-manager';
import { rotasApi } from '@api/rotas';
import type { RotasPlayerStats } from '@api/rotas';

interface UsePlayerStatsOptions {
  playerId: number;
  game?: string;
  enabled?: boolean;
}

export function usePlayerStats({
  playerId,
  game,
  enabled = true,
}: UsePlayerStatsOptions): UseQueryResult<RotasPlayerStats, Error> {
  return useQuery({
    queryKey: queryKeys.players.stats(playerId, game),
    queryFn: async () => rotasApi.players.stats(playerId, game),
    staleTime: CACHE_CONFIGS.STANDARD.staleTime,
    gcTime: CACHE_CONFIGS.STANDARD.cacheTime,
    enabled: enabled && playerId > 0,
    retry: 2,
  });
}
