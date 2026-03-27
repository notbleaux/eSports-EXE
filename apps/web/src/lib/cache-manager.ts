/**
 * Cache Manager
 *
 * Implements caching strategies for TanStack Query including invalidation,
 * prefetching, and optimistic updates.
 *
 * [Ver001.000]
 */

import { QueryClient } from '@tanstack/react-query';

export interface CacheConfig {
  staleTime?: number;
  cacheTime?: number;
  refetchInterval?: number;
  refetchOnWindowFocus?: boolean;
  refetchOnReconnect?: boolean;
}

/**
 * Standard cache configurations
 */
export const CACHE_CONFIGS = {
  // Live data - short stale time, frequent refetches
  LIVE: {
    staleTime: 3000, // 3 seconds
    cacheTime: 15000, // 15 seconds
    refetchInterval: 5000, // 5 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  // Real-time data - minimal stale time
  REALTIME: {
    staleTime: 1000, // 1 second
    cacheTime: 5000, // 5 seconds
    refetchInterval: 2000, // 2 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  // Historical data - longer stale time
  HISTORICAL: {
    staleTime: 60000, // 60 seconds
    cacheTime: 300000, // 5 minutes
    refetchInterval: null,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },

  // Admin data - balance between freshness and performance
  ADMIN: {
    staleTime: 30000, // 30 seconds
    cacheTime: 120000, // 2 minutes
    refetchInterval: 60000, // 60 seconds
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  },

  // Static data - long cache, no refetches
  STATIC: {
    staleTime: Infinity,
    cacheTime: Infinity,
    refetchInterval: null,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  },
};

/**
 * Cache Manager for TanStack Query operations
 */
export class CacheManager {
  constructor(private queryClient: QueryClient) {}

  /**
   * Invalidate cache for a specific query key
   */
  invalidateQuery(queryKey: unknown[]) {
    return this.queryClient.invalidateQueries({
      queryKey,
    });
  }

  /**
   * Invalidate multiple query keys by prefix
   */
  invalidateQueriesByPrefix(prefix: string) {
    return this.queryClient.invalidateQueries({
      queryKey: [prefix],
    });
  }

  /**
   * Prefetch data for better UX
   */
  prefetchQuery(queryKey: unknown[], queryFn: () => Promise<any>) {
    return this.queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: CACHE_CONFIGS.LIVE.staleTime,
    });
  }

  /**
   * Clear all cache
   */
  clearCache() {
    return this.queryClient.clear();
  }

  /**
   * Get cached data without fetching
   */
  getQueryData(queryKey: unknown[]) {
    return this.queryClient.getQueryData(queryKey);
  }

  /**
   * Set cache data manually
   */
  setQueryData(queryKey: unknown[], data: any) {
    return this.queryClient.setQueryData(queryKey, data);
  }

  /**
   * Cancel ongoing queries
   */
  cancelQueries(queryKey?: unknown[]) {
    return this.queryClient.cancelQueries(queryKey ? { queryKey } : {});
  }

  /**
   * Optimistic update with rollback support
   */
  async optimisticUpdate<T>(
    queryKey: unknown[],
    updateFn: (prev: T) => T,
    mutationFn: () => Promise<T>
  ): Promise<T> {
    // Cancel in-flight queries
    await this.queryClient.cancelQueries({ queryKey });

    // Snapshot previous data
    const previousData = this.queryClient.getQueryData(queryKey);

    // Optimistically update cache
    if (previousData) {
      this.queryClient.setQueryData(queryKey, updateFn(previousData as T));
    }

    try {
      // Execute mutation
      const response = await mutationFn();

      // Update cache with response
      this.queryClient.setQueryData(queryKey, response);

      return response;
    } catch (error) {
      // Rollback on error
      if (previousData) {
        this.queryClient.setQueryData(queryKey, previousData);
      }
      throw error;
    }
  }

  /**
   * Batch invalidate multiple query prefixes
   */
  invalidateMultiple(prefixes: string[]) {
    return Promise.all(
      prefixes.map((prefix) => this.invalidateQueriesByPrefix(prefix))
    );
  }

  /**
   * Batch prefetch multiple queries
   */
  prefetchMultiple(queries: Array<{ key: unknown[]; fn: () => Promise<any> }>) {
    return Promise.all(
      queries.map(({ key, fn }) => this.prefetchQuery(key, fn))
    );
  }
}

/**
 * Query key factory for consistent key generation
 */
export const queryKeys = {
  matches: {
    all: ['matches'] as const,
    live: () => [...queryKeys.matches.all, 'live'] as const,
    liveByGame: (game?: string) =>
      [...queryKeys.matches.live(), game] as const,
    history: () => [...queryKeys.matches.all, 'history'] as const,
    historyByGame: (game?: string, limit?: number, offset?: number) =>
      [...queryKeys.matches.history(), game, limit, offset] as const,
    detail: (matchId: string) =>
      [...queryKeys.matches.all, 'detail', matchId] as const,
    historyDetail: (matchId: string) =>
      [...queryKeys.matches.all, 'history-detail', matchId] as const,
  },

  review: {
    all: ['review'] as const,
    queue: () => [...queryKeys.review.all, 'queue'] as const,
    queueFiltered: (game?: string, priority?: string) =>
      [...queryKeys.review.queue(), game, priority] as const,
  },

  admin: {
    all: ['admin'] as const,
    health: () => [...queryKeys.admin.all, 'health'] as const,
    stats: () => [...queryKeys.admin.all, 'stats'] as const,
  },

  realtime: {
    all: ['realtime'] as const,
    websocket: () => [...queryKeys.realtime.all, 'websocket'] as const,
    liveScoreboard: (matchId: string) =>
      [...queryKeys.realtime.websocket(), matchId] as const,
  },
};

/**
 * Create a configured cache manager instance
 */
export function createCacheManager(queryClient: QueryClient) {
  return new CacheManager(queryClient);
}
