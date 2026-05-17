/**
 * useTeams Hook
 *
 * Fetches team listings from ROTAS backend using TanStack Query.
 * Supports game filtering, region filtering, and search.
 *
 * [Ver001.000]
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, CACHE_CONFIGS } from '@lib/cache-manager';
import { rotasApi } from '@api/rotas';
import type { RotasTeamSummary, PaginatedResponse } from '@api/rotas';

interface UseTeamsOptions {
  game?: string;
  region?: string;
  search?: string;
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export function useTeams({
  game,
  region,
  search,
  page = 1,
  perPage = 20,
  enabled = true,
}: UseTeamsOptions = {}): UseQueryResult<PaginatedResponse<RotasTeamSummary>, Error> {
  return useQuery({
    queryKey: queryKeys.teams.list({ game, region, search, page, perPage }),
    queryFn: async () => {
      return rotasApi.teams.list(game, region, search, page, perPage);
    },
    staleTime: CACHE_CONFIGS.STANDARD.staleTime,
    gcTime: CACHE_CONFIGS.STANDARD.cacheTime,
    enabled,
    retry: 2,
  });
}
