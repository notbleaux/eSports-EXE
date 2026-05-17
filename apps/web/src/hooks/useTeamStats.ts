/**
 * useTeamStats Hook
 *
 * Fetches team statistics from ROTAS backend.
 *
 * [Ver001.000]
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, CACHE_CONFIGS } from '@lib/cache-manager';
import { rotasApi } from '@api/rotas';
import type { RotasTeamStats } from '@api/rotas';

interface UseTeamStatsOptions {
  teamId: number;
  game?: string;
  enabled?: boolean;
}

export function useTeamStats({
  teamId,
  game,
  enabled = true,
}: UseTeamStatsOptions): UseQueryResult<RotasTeamStats, Error> {
  return useQuery({
    queryKey: queryKeys.teams.stats(teamId, game),
    queryFn: async () => rotasApi.teams.stats(teamId, game),
    staleTime: CACHE_CONFIGS.STANDARD.staleTime,
    gcTime: CACHE_CONFIGS.STANDARD.cacheTime,
    enabled: enabled && teamId > 0,
    retry: 2,
  });
}
