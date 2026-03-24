/** [Ver001.000] */
/**
 * Performance Benchmark Suite
 * ===========================
 * FPS monitoring and render time tracking.
 */

export interface BenchmarkResult {
  fps: { average: number; min: number; max: number; onePercentLow: number }
  frameTime: { average: number; p95: number; p99: number }
  droppedFrames: number
  totalFrames: number
}

export class PerformanceBenchmark {
  private frameTimes: number[] = []
  private startTime: number = 0
  private lastFrameTime: number = 0
  private isRunning: boolean = false

  async runBenchmark(renderFn: () => void, duration: number = 5000): Promise<BenchmarkResult> {
    this.reset()
    this.isRunning = true
    this.startTime = performance.now()
    this.lastFrameTime = this.startTime

    return new Promise((resolve) => {
      const runFrame = () => {
        const now = performance.now()
        const elapsed = now - this.startTime

        if (elapsed >= duration) {
          this.finish(resolve)
          return
        }

        const frameTime = now - this.lastFrameTime
        this.frameTimes.push(frameTime)
        this.lastFrameTime = now

        renderFn()
        requestAnimationFrame(runFrame)
      }
      requestAnimationFrame(runFrame)
    })
  }

  private reset(): void {
    this.frameTimes = []
    this.isRunning = false
  }

  private finish(resolve: (result: BenchmarkResult) => void): void {
    const sorted = [...this.frameTimes].sort((a, b) => a - b)
    const avg = sorted.reduce((a, b) => a + b, 0) / sorted.length

    resolve({
      fps: {
        average: 1000 / avg,
        min: 1000 / Math.max(...sorted),
        max: 1000 / Math.min(...sorted),
        onePercentLow: 1000 / (sorted[Math.floor(sorted.length * 0.01)] || avg)
      },
      frameTime: {
        average: avg,
        p95: sorted[Math.floor(sorted.length * 0.95)],
        p99: sorted[Math.floor(sorted.length * 0.99)]
      },
      droppedFrames: sorted.filter(t => t > 33.33).length,
      totalFrames: sorted.length
    })
  }
}

export default PerformanceBenchmark
