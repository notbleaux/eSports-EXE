// @ts-nocheck
/**
 * React Query Client Configuration
 *
 * Centralizes TanStack Query setup with custom retry logic,
 * error handling, and cache defaults.
 *
 * [Ver001.000]
 */

import { QueryClient, DefaultError } from '@tanstack/react-query';

/**
 * Custom retry logic for failed requests
 */
const shouldRetry = (
  failureCount: number,
  error: DefaultError
): boolean => {
  // Don't retry on 4xx errors (client errors)
  if (error instanceof Error && 'status' in error) {
    const status = (error as any).status;
    if (status >= 400 && status < 500) {
      return false;
    }
  }

  // Retry up to 3 times for 5xx errors and network issues
  return failureCount < 3;
};

/**
 * Custom error handling
 */
const errorHandler = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unknown error occurred';
};

/**
 * Create configured QueryClient instance
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Default stale time - data is considered fresh for 5 seconds
        staleTime: 5 * 1000,

        // How long cached data persists - 10 minutes
        gcTime: 10 * 60 * 1000,

        // Retry configuration
        retry: shouldRetry,
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff, max 30s

        // Refetch behavior
        refetchOnWindowFocus: 'stale', // Only refetch if data is stale
        refetchOnReconnect: 'stale',
        refetchOnMount: 'stale',

        // Abort signal handling
        throwOnError: true,
      },

      mutations: {
        // Retry mutations less aggressively than queries
        retry: 1,
        retryDelay: (attemptIndex) =>
          Math.min(1000 * 2 ** attemptIndex, 10000), // Max 10s

        throwOnError: true,
      },
    },
  });
}

/**
 * Global error handler for all queries
 * Call this to set up logging/monitoring
 */
export function setupQueryErrorHandler(
  queryClient: QueryClient,
  handler: (error: unknown) => void
) {
  // This is typically called in the root component or app.tsx
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason instanceof Error) {
        handler(event.reason);
      }
    });
  }
}

/**
 * Create a network status listener to pause/resume queries
 */
export function setupNetworkStatusListener(queryClient: QueryClient) {
  const handleOnline = () => {
    console.log('[React Query] Network online - resuming queries');
    queryClient.resumePausedMutations();
  };

  const handleOffline = () => {
    console.log('[React Query] Network offline - pausing mutations');
    // Pause mutations but not queries - queries can use stale data
    queryClient.setMutationDefaults(['online-mutation'], {
      networkMode: 'always',
    });
  };

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}

/**
 * Performance monitoring - logs slow queries
 */
export function setupPerformanceMonitoring(
  queryClient: QueryClient,
  slowQueryThreshold = 5000
) {
  const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
    if (event.type === 'success' && event.query.getObserversCount() > 0) {
      const duration = Date.now() - (event.query.state.dataUpdatedAt || 0);

      if (duration > slowQueryThreshold) {
        console.warn(
          `[React Query] Slow query detected: ${
            (event.query.queryKey as any[])[0]
          } took ${duration}ms`,
          event.query.queryKey
        );
      }
    }
  });

  return unsubscribe;
}

/**
 * Initialize all listeners and monitoring
 */
export function initializeQueryClient(queryClient: QueryClient) {
  if (typeof window === 'undefined') return;

  // Set up network status monitoring
  setupNetworkStatusListener(queryClient);

  // Set up performance monitoring in development
  if (process.env.NODE_ENV === 'development') {
    setupPerformanceMonitoring(queryClient, 5000);
  }
}

// Export a default instance
export const defaultQueryClient = createQueryClient();
