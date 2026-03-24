// WORKERS DISABLED FOR VERCEL BUILD - stub accepts options but does nothing
export const useMLWorker = (_options?: unknown) => ({ 
  isReady: false, 
  isLoading: false, 
  error: new Error('ML Workers disabled'),
  modelInfo: null,
  predict: async () => { throw new Error('Workers disabled'); },
  loadModel: async () => { throw new Error('Workers disabled'); },
  terminate: () => {}
});

export type UseMLWorkerOptions = unknown;
export type UseMLWorkerReturn = ReturnType<typeof useMLWorker>;

export default useMLWorker;
