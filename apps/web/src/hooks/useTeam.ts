/**
 * useTeam Hook
 *
 * Fetches detailed team information including roster from ROTAS backend.
 *
 * [Ver001.000]
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, CACHE_CONFIGS } from '@lib/cache-manager';
import { rotasApi } from '@api/rotas';
import type { RotasTeamDetail } from '@api/rotas';

interface UseTeamOptions {
  teamId: number;
  enabled?: boolean;
}

export function useTeam({
  teamId,
  enabled = true,
}: UseTeamOptions): UseQueryResult<RotasTeamDetail, Error> {
  return useQuery({
    queryKey: queryKeys.teams.detail(teamId),
    queryFn: async () => rotasApi.teams.get(teamId),
    staleTime: CACHE_CONFIGS.STANDARD.staleTime,
    gcTime: CACHE_CONFIGS.STANDARD.cacheTime,
    enabled: enabled && teamId > 0,
    retry: 2,
  });
}
