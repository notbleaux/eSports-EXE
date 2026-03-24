/** [Ver001.000]
 * FPS Monitor
 * RAF-based FPS calculation with rolling window average and drop detection
 * 
 * Target: 60fps
 * Reports to analytics when thresholds are exceeded
 */

import type { FPSMetrics, PerformanceConfig, PerformanceAlert, WarningLevel } from '../types/performance'
import { DEFAULT_PERFORMANCE_CONFIG } from '../types/performance'

export class FPSMonitor {
  private frames: number[] = []
  private lastTime = 0
  private running = false
  private rafId: number | null = null
  private onAlert?: (alert: PerformanceAlert) => void

  constructor(
    private config: PerformanceConfig = DEFAULT_PERFORMANCE_CONFIG,
    onAlert?: (alert: PerformanceAlert) => void
  ) {
    this.onAlert = onAlert
  }

  start(): void {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.tick()
  }

  stop(): void {
    this.running = false
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId)
    }
  }

  private tick(): void {
    if (!this.running) return

    const now = performance.now()
    const delta = now - this.lastTime
    this.lastTime = now

    const fps = 1000 / delta
    this.frames.push(fps)

    // Keep rolling window
    const windowSize = this.config.fpsWindowSize || 60
    if (this.frames.length > windowSize) {
      this.frames.shift()
    }

    // Check for FPS drops
    if (fps < (this.config.fpsDropThreshold || 30)) {
      this.onAlert?.({
        type: 'fps_drop',
        severity: 'warning',
        message: `FPS drop detected: ${fps.toFixed(1)}fps`,
        timestamp: now,
        value: fps
      })
    }

    this.rafId = requestAnimationFrame(() => this.tick())
  }

  getMetrics(): FPSMetrics {
    if (this.frames.length === 0) {
      return { average: 0, min: 0, max: 0, drops: 0 }
    }

    const average = this.frames.reduce((a, b) => a + b, 0) / this.frames.length
    const min = Math.min(...this.frames)
    const max = Math.max(...this.frames)
    const drops = this.frames.filter(f => f < 30).length

    return { average, min, max, drops }
  }

  reset(): void {
    this.frames = []
    this.lastTime = 0
  }
}
