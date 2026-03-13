/**
 * Regression Test Configuration
 * Performance thresholds for automated testing
 * [Ver001.000]
 */

export interface Threshold {
  good: number      // Target performance
  acceptable: number // Warning threshold
  critical: number   // Action required
}

export const THRESHOLDS = {
  render100: { good: 50, acceptable: 75, critical: 100 },      // ms
  render1000: { good: 150, acceptable: 225, critical: 300 },   // ms
  render5000: { good: 800, acceptable: 1200, critical: 1500 }, // ms
  scrollFps: { good: 45, acceptable: 35, critical: 30 },       // fps
  memoryGrowth: { good: 5, acceptable: 8, critical: 10 },      // MB/min
} as const

export type MetricKey = keyof typeof THRESHOLDS

/**
 * Check if value passes threshold
 */
export function checkThreshold(
  metric: MetricKey,
  value: number
): { status: 'good' | 'acceptable' | 'critical'; withinBudget: boolean } {
  const threshold = THRESHOLDS[metric]
  
  // For FPS: higher is better
  // For time/memory: lower is better
  const isHigherBetter = metric === 'scrollFps'
  
  if (isHigherBetter) {
    if (value >= threshold.good) return { status: 'good', withinBudget: true }
    if (value >= threshold.acceptable) return { status: 'acceptable', withinBudget: true }
    return { status: 'critical', withinBudget: false }
  } else {
    if (value <= threshold.good) return { status: 'good', withinBudget: true }
    if (value <= threshold.acceptable) return { status: 'acceptable', withinBudget: true }
    return { status: 'critical', withinBudget: false }
  }
}

/**
 * Format metric for display
 */
export function formatMetric(metric: MetricKey, value: number): string {
  switch (metric) {
    case 'render100':
    case 'render1000':
    case 'render5000':
      return `${value.toFixed(2)}ms`
    case 'scrollFps':
      return `${Math.round(value)}fps`
    case 'memoryGrowth':
      return `${value.toFixed(2)}MB/min`
    default:
      return String(value)
  }
}

/**
 * Generate status emoji
 */
export function getStatusEmoji(status: 'good' | 'acceptable' | 'critical'): string {
  switch (status) {
    case 'good': return '✓'
    case 'acceptable': return '⚠'
    case 'critical': return '✗'
  }
}

/**
 * Create regression test for a metric
 */
export function createTest(
  metric: MetricKey,
  value: number
): { pass: boolean; message: string } {
  const { status, withinBudget } = checkThreshold(metric, value)
  const formatted = formatMetric(metric, value)
  const emoji = getStatusEmoji(status)
  
  return {
    pass: withinBudget,
    message: `${emoji} ${metric}: ${formatted} (${status})`,
  }
}

/**
 * Run full regression suite
 */
export function runRegressionSuite(results: {
  render100: number
  render1000: number
  render5000: number
  scrollFps: number
  memoryGrowth: number
}): { allPass: boolean; tests: Array<{ pass: boolean; message: string }> } {
  const tests = [
    createTest('render100', results.render100),
    createTest('render1000', results.render1000),
    createTest('render5000', results.render5000),
    createTest('scrollFps', results.scrollFps),
    createTest('memoryGrowth', results.memoryGrowth),
  ]
  
  return {
    allPass: tests.every(t => t.pass),
    tests,
  }
}

/**
 * Export thresholds as JSON
 */
export function exportThresholds(): string {
  return JSON.stringify(THRESHOLDS, null, 2)
}

export default THRESHOLDS
