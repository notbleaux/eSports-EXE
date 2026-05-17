/**
 * usePlayer Hook
 *
 * Fetches detailed player information from ROTAS backend.
 *
 * [Ver001.000]
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, CACHE_CONFIGS } from '@lib/cache-manager';
import { rotasApi } from '@api/rotas';
import type { RotasPlayerDetail } from '@api/rotas';

interface UsePlayerOptions {
  playerId: number;
  enabled?: boolean;
}

export function usePlayer({
  playerId,
  enabled = true,
}: UsePlayerOptions): UseQueryResult<RotasPlayerDetail, Error> {
  return useQuery({
    queryKey: queryKeys.players.detail(playerId),
    queryFn: async () => rotasApi.players.get(playerId),
    staleTime: CACHE_CONFIGS.STANDARD.staleTime,
    gcTime: CACHE_CONFIGS.STANDARD.cacheTime,
    enabled: enabled && playerId > 0,
    retry: 2,
  });
}
