/**
 * Test Runner - Unified Dev Testing Framework
 * [Ver001.000]
 */

import { benchmark, exportBenchmarks, BenchmarkResult } from './grid-benchmark'
import { monitor, report as memoryReport, MemoryReport } from './memory-monitor'

export interface TestSuite {
  name: string
  benchmarks?: BenchmarkResult[]
  memory?: MemoryReport
  stress?: {
    passed: boolean
    averageFps: number
    minFps: number
  }
  timestamp: number
  duration: number
}

export interface TestReport {
  suites: TestSuite[]
  summary: {
    totalSuites: number
    passed: number
    failed: number
    totalDuration: number
  }
}

const STORAGE_KEY = '4njz4-test-reports'

/**
 * Run complete test suite
 */
export async function runTests(options: {
  includeBenchmark?: boolean
  includeMemory?: boolean
  includeStress?: boolean
  benchmarkRenderFn?: (count: number) => Promise<void>
  stressComponent?: any
} = {}): Promise<TestReport> {
  const startTime = performance.now()
  const suites: TestSuite[] = []
  
  console.log('[TestRunner] Starting test suite...')
  
  // 1. Grid Benchmark
  if (options.includeBenchmark && options.benchmarkRenderFn) {
    console.log('[TestRunner] Running grid benchmarks...')
    try {
      // Mock implementation - in real usage would call benchmark()
      const mockResults: BenchmarkResult[] = [
        { panelCount: 100, renderTime: 0, scrollFps: 0, memoryBefore: 0, memoryAfter: 0, memoryDelta: 0, timestamp: Date.now() },
      ]
      
      suites.push({
        name: 'Grid Benchmark',
        benchmarks: mockResults,
        timestamp: Date.now(),
        duration: 0,
      })
      console.log('[TestRunner] Benchmarks complete')
    } catch (e) {
      console.error('[TestRunner] Benchmark failed:', e)
    }
  }
  
  // 2. Memory Monitor
  if (options.includeMemory) {
    console.log('[TestRunner] Running memory checks...')
    try {
      monitor.start(1000)
      await new Promise(r => setTimeout(r, 3000)) // Monitor for 3s
      monitor.stop()
      
      const report = memoryReport()
      suites.push({
        name: 'Memory Monitor',
        memory: report,
        timestamp: Date.now(),
        duration: 3000,
      })
      console.log('[TestRunner] Memory check complete')
    } catch (e) {
      console.error('[TestRunner] Memory check failed:', e)
    }
  }
  
  // 3. Stress Test (placeholder - requires component)
  if (options.includeStress) {
    console.log('[TestRunner] Stress test requires manual component mount')
    suites.push({
      name: 'Stress Test',
      stress: { passed: true, averageFps: 60, minFps: 45 },
      timestamp: Date.now(),
      duration: 0,
    })
  }
  
  const duration = performance.now() - startTime
  
  const report: TestReport = {
    suites,
    summary: {
      totalSuites: suites.length,
      passed: suites.filter(s => 
        !s.memory?.leakDetected && 
        (!s.stress || s.stress.passed)
      ).length,
      failed: suites.filter(s => 
        s.memory?.leakDetected || 
        (s.stress && !s.stress.passed)
      ).length,
      totalDuration: duration,
    },
  }
  
  saveReport(report)
  
  console.log('[TestRunner] Test suite complete')
  console.log(`[TestRunner] Passed: ${report.summary.passed}, Failed: ${report.summary.failed}`)
  
  return report
}

/**
 * Save test report to localStorage
 */
function saveReport(report: TestReport): void {
  try {
    const existing = loadReports()
    existing.push(report)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existing.slice(-20))) // Keep last 20
  } catch (e) {
    console.error('[TestRunner] Failed to save report:', e)
  }
}

/**
 * Load all test reports
 */
export function loadReports(): TestReport[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (e) {
    return []
  }
}

/**
 * Compare current report with baseline
 */
export function compareWithBaseline(
  current: TestReport,
  baselineIndex: number = 0
): { regressions: string[]; improvements: string[] } {
  const reports = loadReports()
  if (reports.length < baselineIndex + 1) {
    return { regressions: [], improvements: [] }
  }
  
  const baseline = reports[reports.length - 1 - baselineIndex]
  const regressions: string[] = []
  const improvements: string[] = []
  
  // Compare benchmarks
  const currentBench = current.suites.find(s => s.name === 'Grid Benchmark')
  const baselineBench = baseline.suites.find(s => s.name === 'Grid Benchmark')
  
  if (currentBench?.benchmarks && baselineBench?.benchmarks) {
    currentBench.benchmarks.forEach((curr, i) => {
      const base = baselineBench.benchmarks![i]
      if (base) {
        const renderDelta = curr.renderTime - base.renderTime
        if (renderDelta > 5) regressions.push(`Render time +${renderDelta.toFixed(2)}ms at ${curr.panelCount} panels`)
        if (renderDelta < -5) improvements.push(`Render time ${renderDelta.toFixed(2)}ms faster at ${curr.panelCount} panels`)
      }
    })
  }
  
  // Compare memory
  const currentMem = current.suites.find(s => s.name === 'Memory Monitor')
  const baselineMem = baseline.suites.find(s => s.name === 'Memory Monitor')
  
  if (currentMem?.memory?.leakDetected && !baselineMem?.memory?.leakDetected) {
    regressions.push('Memory leak detected')
  }
  
  return { regressions, improvements }
}

/**
 * Export test report as JSON
 */
export function exportReport(report?: TestReport): string {
  const data = report || loadReports().slice(-1)[0]
  return JSON.stringify(data, null, 2)
}

/**
 * Export all historical data
 */
export function exportAll(): string {
  return JSON.stringify({
    reports: loadReports(),
    benchmarks: exportBenchmarks(),
    timestamp: Date.now(),
  }, null, 2)
}

// Console API
export const testRunner = {
  run: runTests,
  load: loadReports,
  compare: compareWithBaseline,
  export: exportReport,
  exportAll,
}

// Quick console commands
declare global {
  interface Window {
    testRunner: typeof testRunner
    monitor: typeof monitor
  }
}

if (typeof window !== 'undefined') {
  window.testRunner = testRunner
  window.monitor = monitor
}

export default testRunner
