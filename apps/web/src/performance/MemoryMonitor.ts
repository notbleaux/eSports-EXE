/** [Ver001.000]
 * Memory Monitor
 * Memory API wrapper with heap size tracking and warning thresholds
 * 
 * Tracks: used, total, limit
 * Warns at 80%, error at 90%
 */

import type { MemoryMetrics, PerformanceConfig, PerformanceAlert } from '../types/performance'
import { DEFAULT_PERFORMANCE_CONFIG } from '../types/performance'

export class MemoryMonitor {
  private checkInterval: ReturnType<typeof setInterval> | null = null
  private onAlert?: (alert: PerformanceAlert) => void

  constructor(
    private config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG,
    onAlert?: (alert: PerformanceAlert) => void
  ) {
    this.onAlert = onAlert
  }

  start(): void {
    if (this.checkInterval) return
    this.checkInterval = setInterval(() => this.check(), this.config.memoryCheckInterval || 30000)
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private check(): void {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    if (!memory) return

    const { usedJSHeapSize, totalJSHeapSize, jsHeapSizeLimit } = memory
    const usageRatio = usedJSHeapSize / jsHeapSizeLimit

    if (usageRatio > (this.config.memoryCriticalThreshold || 0.9)) {
      this.onAlert?.({
        type: 'memory_critical',
        severity: 'critical',
        message: `Critical memory usage: ${(usageRatio * 100).toFixed(1)}%`,
        timestamp: performance.now(),
        value: usageRatio
      })
    } else if (usageRatio > (this.config.memoryWarningThreshold || 0.8)) {
      this.onAlert?.({
        type: 'memory_warning',
        severity: 'warning',
        message: `High memory usage: ${(usageRatio * 100).toFixed(1)}%`,
        timestamp: performance.now(),
        value: usageRatio
      })
    }
  }

  getMetrics(): MemoryMetrics | null {
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    if (!memory) return null

    return {
      used: memory.usedJSHeapSize,
      total: memory.totalJSHeapSize,
      limit: memory.jsHeapSizeLimit
    }
  }
}
