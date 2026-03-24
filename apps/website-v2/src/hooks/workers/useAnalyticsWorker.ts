// WORKERS DISABLED FOR VERCEL BUILD
export const useAnalyticsWorker = () => ({ 
  isReady: false, 
  isLoading: false, 
  error: new Error('Analytics Workers disabled'), 
  stats: { calculationsCompleted: 0 },
  calculateSimRating: async () => { throw new Error('Workers disabled'); },
  calculateRAR: async () => { throw new Error('Workers disabled'); },
  aggregateData: async () => { throw new Error('Workers disabled'); },
  terminate: () => {}
});
export default useAnalyticsWorker;
