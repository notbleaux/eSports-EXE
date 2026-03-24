// WORKERS DISABLED FOR VERCEL BUILD - stub accepts options but does nothing
export const useAnalyticsWorker = (_options?: unknown) => ({ 
  isReady: false, 
  isLoading: false, 
  error: new Error('Analytics Workers disabled'), 
  stats: { calculationsCompleted: 0, lastCalculationTime: 0 },
  calculateSimRating: async () => { throw new Error('Workers disabled'); },
  calculateRAR: async () => { throw new Error('Workers disabled'); },
  aggregateData: async () => { throw new Error('Workers disabled'); },
  terminate: () => {}
});

export type UseAnalyticsWorkerOptions = unknown;
export type UseAnalyticsWorkerReturn = ReturnType<typeof useAnalyticsWorker>;

export default useAnalyticsWorker;
