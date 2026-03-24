// WORKERS DISABLED FOR VERCEL BUILD
export const useGridWorker = () => ({ 
  isReady: false, 
  isSupported: false,
  error: new Error('Grid Workers disabled'), 
  render: async () => { throw new Error('Workers disabled'); },
  clear: () => {},
  destroy: () => {}
});
export default useGridWorker;
