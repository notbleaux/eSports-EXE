/**
 * useMatchHistoryDetail Hook
 *
 * Fetches a single historical match record using TanStack Query with HISTORICAL
 * cache strategy. Same endpoint as useMatchData but optimised for archive reads
 * — long stale time, no polling, no WebSocket sync.
 *
 * [Ver001.000]
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, CACHE_CONFIGS } from '@lib/cache-manager';
import { pandascoreApi } from '@api/pandascore';
import type { PandascoreMatch } from '@api/pandascore';

interface UseMatchHistoryDetailOptions {
  matchId: string;
  enabled?: boolean;
}

export function useMatchHistoryDetail({
  matchId,
  enabled = true,
}: UseMatchHistoryDetailOptions): UseQueryResult<PandascoreMatch, Error> {
  return useQuery({
    queryKey: queryKeys.matches.historyDetail(matchId),
    queryFn: async () => {
      const response = await pandascoreApi.fetchMatchDetails(Number(matchId));
      return response;
    },
    staleTime: CACHE_CONFIGS.HISTORICAL.staleTime,
    gcTime: CACHE_CONFIGS.HISTORICAL.cacheTime,
    enabled: enabled && !!matchId,
    retry: 2,
  });
}
