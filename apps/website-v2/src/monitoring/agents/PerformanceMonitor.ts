/**
 * Performance Monitor - Tracks bundle size, build time, Web Vitals
 * 
 * [Ver001.000]
 */

import { logger } from '../../utils/logger'

interface PerformanceReport {
  timestamp: string
  buildTime: number
  bundleSize: number
  jsSize: number
  cssSize: number
  largestChunk: string
  webVitals?: {
    LCP: number
    FID: number
    CLS: number
  }
  regressions: string[]
}

export class PerformanceMonitor {
  private report: PerformanceReport = {
    timestamp: new Date().toISOString(),
    buildTime: 0,
    bundleSize: 0,
    jsSize: 0,
    cssSize: 0,
    largestChunk: '',
    regressions: []
  }

  private baseline = {
    maxBuildTime: 10000, // 10s
    maxBundleSize: 2 * 1024 * 1024, // 2MB
    maxJsSize: 1.5 * 1024 * 1024 // 1.5MB
  }

  /**
   * Record build metrics
   */
  recordBuild(buildTime: number): void {
    this.report.buildTime = buildTime
    this.report.timestamp = new Date().toISOString()
    
    if (buildTime > this.baseline.maxBuildTime) {
      const regression = `Build time ${buildTime}ms exceeds baseline ${this.baseline.maxBuildTime}ms`
      this.report.regressions.push(regression)
      logger.warn(`[PerformanceMonitor] ${regression}`)
    }
  }

  /**
   * Record bundle metrics
   */
  recordBundle(jsSize: number, cssSize: number): void {
    this.report.jsSize = jsSize
    this.report.cssSize = cssSize
    this.report.bundleSize = jsSize + cssSize
    
    if (jsSize > this.baseline.maxJsSize) {
      const regression = `JS size ${(jsSize / 1024 / 1024).toFixed(2)}MB exceeds baseline`
      this.report.regressions.push(regression)
      logger.warn(`[PerformanceMonitor] ${regression}`)
    }
  }

  /**
   * Generate markdown report
   */
  generateReport(): string {
    return `# Performance Report
Generated: ${this.report.timestamp}

## Build Metrics
- Build time: ${this.report.buildTime}ms (target: <${this.baseline.maxBuildTime}ms)
- Status: ${this.report.buildTime < this.baseline.maxBuildTime ? '✅' : '⚠️'}

## Bundle Metrics
- Total: ${(this.report.bundleSize / 1024 / 1024).toFixed(2)}MB
- JavaScript: ${(this.report.jsSize / 1024 / 1024).toFixed(2)}MB
- CSS: ${(this.report.cssSize / 1024 / 1024).toFixed(2)}MB

## Regressions
${this.report.regressions.length > 0
  ? this.report.regressions.map(r => `- ⚠️ ${r}`).join('\n')
  : '✅ No regressions detected'}
`
  }
}

export const performanceMonitor = new PerformanceMonitor()
export default performanceMonitor
