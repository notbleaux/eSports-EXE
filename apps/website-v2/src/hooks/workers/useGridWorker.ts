// WORKERS DISABLED FOR VERCEL BUILD - stub accepts options but does nothing
export const useGridWorker = (_options?: unknown) => ({ 
  isReady: false,
  isSupported: false, 
  isRendering: false,
  error: new Error('Grid Workers disabled'), 
  canvasRef: { current: null as HTMLCanvasElement | null },
  render: async () => { throw new Error('Workers disabled'); },
  scroll: () => {},
  resize: () => {},
  clear: () => {},
  destroy: () => {},
  calculateVisibleRange: () => ({ startRow: 0, endRow: 0, startCol: 0, endCol: 0 })
});

export type UseGridWorkerOptions = unknown;
export type UseGridWorkerReturn = ReturnType<typeof useGridWorker>;

export default useGridWorker;
