// WORKERS DISABLED FOR VERCEL BUILD - stub accepts options but does nothing
export const useAnalyticsWorker = (_options?: unknown) => ({
  isReady: false,
  isLoading: false,
  isCalculating: false,
  error: new Error('Analytics Workers disabled'),
  stats: { calculationsCompleted: 0, lastCalculationTime: 0 },
  calculateSimRating: async (_payload?: unknown) => { throw new Error('Workers disabled'); },
  calculateRAR: async (_payload?: unknown) => { throw new Error('Workers disabled'); },
  aggregateData: async (_payload?: unknown) => { throw new Error('Workers disabled'); },
  terminate: () => {}
});

export const useBatchSimRatings = (_options?: unknown) => ({
  isReady: false,
  isCalculating: false,
  error: new Error('Workers disabled'),
  calculateBatch: async (_players?: unknown) => { throw new Error('Workers disabled'); },
  terminate: () => {}
});

export const useRealtimeSimRating = (_options?: unknown) => ({
  isReady: false,
  isCalculating: false,
  currentRating: null,
  error: new Error('Workers disabled'),
  start: () => {},
  stop: () => {},
  terminate: () => {}
});

export type UseAnalyticsWorkerOptions = unknown;
export type UseAnalyticsWorkerReturn = ReturnType<typeof useAnalyticsWorker>;

export default useAnalyticsWorker;
