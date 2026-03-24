// WORKERS DISABLED FOR VERCEL BUILD
export const useGridWorker = () => ({ 
  isSupported: false, 
  isReady: false,
  error: { type: 'unsupported', message: 'Workers disabled', timestamp: Date.now() },
  retry: () => {},
  retryCount: 0,
  canRetry: false,
  init: async () => { throw new Error('Workers disabled'); },
  render: async () => { throw new Error('Workers disabled'); },
  renderPanel: async () => { throw new Error('Workers disabled'); },
  resize: async () => { throw new Error('Workers disabled'); },
  clear: async () => {},
  destroy: () => {}
});
export default useGridWorker;
