// WORKERS DISABLED FOR VERCEL BUILD
export const useMLWorker = () => ({ 
  isReady: false, 
  isLoading: false, 
  error: new Error('ML Workers disabled'), 
  predict: async () => { throw new Error('Workers disabled'); },
  predictBatch: async () => { throw new Error('Workers disabled'); },
  initialize: async () => { throw new Error('Workers disabled'); },
  terminate: () => {}
});
export default useMLWorker;
