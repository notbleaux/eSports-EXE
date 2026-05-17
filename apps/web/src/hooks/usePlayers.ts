/**
 * usePlayers Hook
 *
 * Fetches player listings from ROTAS backend using TanStack Query with
 * STANDARD cache strategy. Supports game filtering, team filtering, and search.
 *
 * [Ver001.000] - Phase 1: ROTAS API integration
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, CACHE_CONFIGS } from '@lib/cache-manager';
import { rotasApi } from '@api/rotas';
import type { RotasPlayerSummary, PaginatedResponse } from '@api/rotas';

interface UsePlayersOptions {
  game?: string;
  teamId?: number;
  search?: string;
  page?: number;
  perPage?: number;
  enabled?: boolean;
}

export function usePlayers({
  game,
  teamId,
  search,
  page = 1,
  perPage = 20,
  enabled = true,
}: UsePlayersOptions = {}): UseQueryResult<PaginatedResponse<RotasPlayerSummary>, Error> {
  return useQuery({
    queryKey: queryKeys.players.list({ game, teamId, search, page, perPage }),
    queryFn: async () => {
      return rotasApi.players.list(game, teamId, search, page, perPage);
    },
    staleTime: CACHE_CONFIGS.STANDARD.staleTime,
    gcTime: CACHE_CONFIGS.STANDARD.cacheTime,
    enabled,
    retry: 2,
  });
}
