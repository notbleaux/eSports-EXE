/**
 * useReviewQueue Hook
 *
 * Fetches the TeneT verification review queue using TanStack Query with ADMIN
 * cache strategy. Integrates with SyncManager via review_queue_update messages
 * which invalidate this query's cache on WebSocket push.
 *
 * Endpoint: GET /v1/review-queue (tenet-verification service, port 8001)
 *
 * [Ver001.000]
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { queryKeys, CACHE_CONFIGS } from '@lib/cache-manager';
import { api } from '@api';

export interface ReviewQueueItem {
  item_id: string;
  data_type: string;
  confidence: number;
  issues: string[];
  game?: string;
  priority?: boolean;
  created_at: string;
}

interface UseReviewQueueOptions {
  game?: string;
  priority?: boolean;
  enabled?: boolean;
}

export function useReviewQueue({
  game,
  priority,
  enabled = true,
}: UseReviewQueueOptions = {}): UseQueryResult<ReviewQueueItem[], Error> {
  return useQuery({
    queryKey: queryKeys.review.queueFiltered(game, priority ? 'high' : undefined),
    queryFn: async () => {
      const params = new URLSearchParams();
      if (game) params.set('game', game);
      if (priority !== undefined) params.set('priority', String(priority));
      params.set('limit', '100');

      const query = params.toString();
      const response = await api.get<ReviewQueueItem[]>(
        `/v1/review-queue${query ? `?${query}` : ''}`
      );
      return response;
    },
    staleTime: CACHE_CONFIGS.ADMIN.staleTime,
    gcTime: CACHE_CONFIGS.ADMIN.cacheTime,
    refetchInterval: CACHE_CONFIGS.ADMIN.refetchInterval,
    refetchOnWindowFocus: CACHE_CONFIGS.ADMIN.refetchOnWindowFocus,
    refetchOnReconnect: CACHE_CONFIGS.ADMIN.refetchOnReconnect,
    enabled,
    retry: 2,
  });
}
