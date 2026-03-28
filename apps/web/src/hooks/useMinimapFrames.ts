/**
 * useMinimapFrames Hook
 *
 * TanStack Query hook for fetching paginated minimap frames.
 * Part of Phase 9: Minimap Feature for NJZiteGeisTe Platform.
 *
 * Tasks: MF-6, MF-8 - Initial implementation + Real API integration
 *
 * [Ver002.000] - Phase 2: Real Archival API integration (MF-8)
 * [Ver001.000] - Initial implementation with mock client (MF-6)
 */

import { useState, useCallback, useMemo } from 'react';
import { useQuery, useQueryClient, type QueryFunctionContext } from '@tanstack/react-query';
import { queryKeys, CACHE_CONFIGS } from '@/lib/cache-manager';
import { archivalApi } from '@/services/archivalApi';
import type { FrameData } from '@components/MinimapFrameGrid';

/**
 * Options for useMinimapFrames hook
 */
export interface UseMinimapFramesOptions {
  /** Match ID to fetch frames for */
  matchId: string;
  /** Initial page number (default: 1) */
  initialPage?: number;
  /** Number of frames per page (default: 50) */
  pageSize?: number;
  /** Whether to enable the query */
  enabled?: boolean;
}

/**
 * Result returned from useMinimapFrames hook
 */
export interface UseMinimapFramesResult {
  /** Array of frame data for current page */
  frames: FrameData[];
  /** Whether the query is loading */
  isLoading: boolean;
  /** Whether the query has errored */
  isError: boolean;
  /** Error object if query failed */
  error: Error | null;
  /** Whether more pages are available */
  hasMore: boolean;
  /** Current page number (1-indexed) */
  currentPage: number;
  /** Navigate to next page */
  nextPage: () => void;
  /** Navigate to previous page */
  prevPage: () => void;
  /** Total number of pages */
  totalPages: number;
  /** Total number of frames */
  totalItems: number;
  /** Function to refetch data */
  refetch: () => void;
}

/**
 * Query key factory for minimap frames
 */
const minimapQueryKeys = {
  all: ['minimap'] as const,
  frames: (matchId: string) => [...minimapQueryKeys.all, 'frames', matchId] as const,
  page: (matchId: string, page: number, pageSize: number) =>
    [...minimapQueryKeys.frames(matchId), page, pageSize] as const,
};

/**
 * Fetch frames query function for TanStack Query
 */
async function fetchFrames({
  queryKey,
}: QueryFunctionContext<ReturnType<typeof minimapQueryKeys.page>>): Promise<{
  frames: FrameData[];
  totalPages: number;
  total: number;
  hasMore: boolean;
}> {
  const [, , matchId, page, pageSize] = queryKey;
  
  const response = await archivalApi.getFrames(
    matchId as string,
    page as number,
    pageSize as number
  );
  
  return {
    frames: response.frames,
    totalPages: response.totalPages,
    total: response.total,
    hasMore: response.hasMore,
  };
}

/**
 * Hook for fetching and managing paginated minimap frames
 *
 * @example
 * ```tsx
 * const { frames, isLoading, nextPage, prevPage } = useMinimapFrames({
 *   matchId: 'match-123',
 *   pageSize: 50
 * });
 * ```
 */
export function useMinimapFrames({
  matchId,
  initialPage = 1,
  pageSize = 50,
  enabled = true,
}: UseMinimapFramesOptions): UseMinimapFramesResult {
  // Local page state for pagination controls
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Fetch frames using TanStack Query
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: minimapQueryKeys.page(matchId, currentPage, pageSize),
    queryFn: fetchFrames,
    // Use HISTORICAL config since frame data doesn't change frequently
    staleTime: CACHE_CONFIGS.HISTORICAL.staleTime,
    gcTime: CACHE_CONFIGS.HISTORICAL.cacheTime,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    enabled: enabled && !!matchId,
    retry: 2,
  });

  // Pagination navigation handlers
  const nextPage = useCallback(() => {
    if (data?.hasMore) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [data?.hasMore]);

  const prevPage = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  // Reset to first page when matchId changes
  useMemo(() => {
    setCurrentPage(initialPage);
  }, [matchId, initialPage]);

  // Extract data with defaults
  const frames = data?.frames ?? [];
  const totalPages = data?.totalPages ?? 0;
  const totalItems = data?.total ?? 0;
  const hasMore = data?.hasMore ?? false;

  return {
    frames,
    isLoading,
    isError,
    error: error as Error | null,
    hasMore,
    currentPage,
    nextPage,
    prevPage,
    totalPages,
    totalItems,
    refetch,
  };
}

/**
 * Hook for pinning/unpinning frames with automatic cache invalidation
 */
export function useFramePinning(matchId: string) {
  const queryClient = useQueryClient();
  const [isPinning, setIsPinning] = useState(false);
  const [pinError, setPinError] = useState<Error | null>(null);

  const handlePinToggle = useCallback(
    async (frameId: string, pin: boolean) => {
      setIsPinning(true);
      setPinError(null);

      try {
        if (pin) {
          await archivalApi.pinFrame(frameId, 'Verified by TeNET');
        } else {
          await archivalApi.unpinFrame(frameId);
        }

        // Invalidate cache to refresh frames
        await queryClient.invalidateQueries({
          queryKey: minimapQueryKeys.frames(matchId),
        });

        return true;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Pin toggle failed');
        setPinError(err);
        return false;
      } finally {
        setIsPinning(false);
      }
    },
    [matchId, queryClient]
  );

  return {
    handlePinToggle,
    isPinning,
    pinError,
    clearPinError: () => setPinError(null),
  };
}

export default useMinimapFrames;
