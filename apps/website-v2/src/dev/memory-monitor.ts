/**
 * Memory Monitor - Leak Detection Tool
 * [Ver001.000]
 */

export interface MemorySnapshot {
  timestamp: number
  jsHeapSize: number
  jsHeapTotal: number
  jsHeapLimit: number
  workerCount: number
  panelMountCount: number
  panelUnmountCount: number
}

export interface MemoryReport {
  snapshots: MemorySnapshot[]
  growthRate: number // bytes per minute
  leakDetected: boolean
  maxHeapSize: number
}

interface MemoryState {
  workerInits: number
  workerTerminations: number
  panelMounts: number
  panelUnmounts: number
  snapshots: MemorySnapshot[]
  monitoring: boolean
  intervalId?: number
}

const state: MemoryState = {
  workerInits: 0,
  workerTerminations: 0,
  panelMounts: 0,
  panelUnmounts: 0,
  snapshots: [],
  monitoring: false,
}

/**
 * Get current memory info from performance API
 */
function getMemoryInfo(): Partial<MemorySnapshot> {
  const memory = (performance as any).memory
  if (memory) {
    return {
      jsHeapSize: memory.usedJSHeapSize,
      jsHeapTotal: memory.totalJSHeapSize,
      jsHeapLimit: memory.jsHeapSizeLimit,
    }
  }
  return {
    jsHeapSize: 0,
    jsHeapTotal: 0,
    jsHeapLimit: 0,
  }
}

/**
 * Take a memory snapshot
 */
export function snapshot(): MemorySnapshot {
  const snap: MemorySnapshot = {
    timestamp: Date.now(),
    workerCount: state.workerInits - state.workerTerminations,
    panelMountCount: state.panelMounts,
    panelUnmountCount: state.panelUnmounts,
    ...getMemoryInfo(),
  }
  
  state.snapshots.push(snap)
  
  // Keep only last 100 snapshots
  if (state.snapshots.length > 100) {
    state.snapshots = state.snapshots.slice(-100)
  }
  
  return snap
}

/**
 * Track worker initialization
 */
export function trackWorkerInit(): void {
  state.workerInits++
  if (state.monitoring) {
    console.log('[MemoryMonitor] Worker initialized. Total:', state.workerInits)
  }
}

/**
 * Track worker termination
 */
export function trackWorkerTerminate(): void {
  state.workerTerminations++
  if (state.monitoring) {
    console.log('[MemoryMonitor] Worker terminated. Active:', 
                state.workerInits - state.workerTerminations)
  }
}

/**
 * Track panel mount
 */
export function trackPanelMount(): void {
  state.panelMounts++
}

/**
 * Track panel unmount
 */
export function trackPanelUnmount(): void {
  state.panelUnmounts++
}

/**
 * Calculate memory growth rate (bytes per minute)
 */
function calculateGrowthRate(snapshots: MemorySnapshot[]): number {
  if (snapshots.length < 2) return 0
  
  const first = snapshots[0]
  const last = snapshots[snapshots.length - 1]
  const timeDiff = (last.timestamp - first.timestamp) / 1000 / 60 // minutes
  
  if (timeDiff === 0) return 0
  
  return (last.jsHeapSize - first.jsHeapSize) / timeDiff
}

/**
 * Detect potential memory leak
 */
function detectLeak(snapshots: MemorySnapshot[]): boolean {
  if (snapshots.length < 10) return false
  
  const growthRate = calculateGrowthRate(snapshots.slice(-10))
  const unmountedDiff = state.panelMounts - state.panelUnmounts
  
  // Leak detected if:
  // - Memory growing > 10MB/minute
  // - Or more mounts than unmounts with memory growth
  return growthRate > 10 * 1024 * 1024 || (unmountedDiff > 10 && growthRate > 0)
}

/**
 * Generate memory report
 */
export function report(): MemoryReport {
  const snapshots = [...state.snapshots]
  
  if (snapshots.length === 0) {
    snapshot() // Take at least one snapshot
  }
  
  return {
    snapshots,
    growthRate: calculateGrowthRate(snapshots),
    leakDetected: detectLeak(snapshots),
    maxHeapSize: Math.max(...snapshots.map(s => s.jsHeapSize)),
  }
}

/**
 * Start continuous monitoring
 */
export function start(intervalMs: number = 5000): void {
  if (state.monitoring) {
    console.log('[MemoryMonitor] Already monitoring')
    return
  }
  
  state.monitoring = true
  console.log('[MemoryMonitor] Started monitoring (interval:', intervalMs, 'ms)')
  
  // Take initial snapshot
  snapshot()
  
  // Set up interval
  state.intervalId = window.setInterval(() => {
    const snap = snapshot()
    
    // Log if leak detected
    if (detectLeak(state.snapshots)) {
      console.warn('[MemoryMonitor] ⚠️ Potential memory leak detected!')
      console.warn('[MemoryMonitor] Growth rate:', 
                   (calculateGrowthRate(state.snapshots) / 1024 / 1024).toFixed(2), 'MB/min')
      console.warn('[MemoryMonitor] Unmounted panels:', 
                   state.panelMounts - state.panelUnmounts)
    }
    
    // Log every 12 snapshots (every minute at 5s interval)
    if (state.snapshots.length % 12 === 0) {
      console.log('[MemoryMonitor] Heap:', (snap.jsHeapSize / 1024 / 1024).toFixed(2), 'MB')
    }
  }, intervalMs)
}

/**
 * Stop monitoring
 */
export function stop(): void {
  if (!state.monitoring) return
  
  state.monitoring = false
  if (state.intervalId) {
    clearInterval(state.intervalId)
    state.intervalId = undefined
  }
  
  console.log('[MemoryMonitor] Stopped monitoring')
  console.log('[MemoryMonitor] Final report:', report())
}

/**
 * Reset all tracking state
 */
export function reset(): void {
  stop()
  state.workerInits = 0
  state.workerTerminations = 0
  state.panelMounts = 0
  state.panelUnmounts = 0
  state.snapshots = []
  console.log('[MemoryMonitor] State reset')
}

/**
 * Export monitoring data
 */
export function exportData(): string {
  return JSON.stringify({
    state,
    report: report(),
  }, null, 2)
}

// Console API
export const monitor = {
  start,
  stop,
  snapshot,
  report,
  reset,
  trackWorkerInit,
  trackWorkerTerminate,
  trackPanelMount,
  trackPanelUnmount,
  export: exportData,
}

export default monitor
