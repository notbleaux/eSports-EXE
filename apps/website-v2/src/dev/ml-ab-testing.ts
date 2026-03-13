/**
 * ML A/B Testing Framework
 * Statistical model comparison with automatic winner selection
 * 50/50 traffic split with 95% confidence threshold
 * 
 * [Ver001.000]
 */

import { useMLInference } from '../hooks/useMLInference'

export interface VariantConfig {
  id: string
  modelId: string
  modelUrl: string
  name: string
  description?: string
}

export interface VariantMetrics {
  variantId: string
  predictions: number
  totalLatency: number
  errors: number
  accuracySum: number // For tracking accuracy if ground truth available
}

export interface ABTestResult {
  variant: 'A' | 'B'
  latency: number
  timestamp: number
  success: boolean
  output: number[]
}

export interface ABTestStats {
  variantA: {
    id: string
    predictions: number
    avgLatency: number
    errorRate: number
    p95Latency: number
  }
  variantB: {
    id: string
    predictions: number
    avgLatency: number
    errorRate: number
    p95Latency: number
  }
  confidence: number // 0-1
  winner: 'A' | 'B' | null
  isSignificant: boolean
  sampleSizeAdequate: boolean
}

export interface ABTestConfig {
  id: string
  variantA: VariantConfig
  variantB: VariantConfig
  trafficSplit?: number // 0-1, default 0.5 (50/50)
  minSampleSize?: number // Minimum predictions per variant (default 100)
  confidenceThreshold?: number // 0-1, default 0.95
  maxDuration?: number // Max test duration in ms (default 7 days)
  primaryMetric?: 'latency' | 'accuracy' | 'error_rate'
}

interface ABTestState {
  startTime: number
  endTime?: number
  variantA: VariantMetrics
  variantB: VariantMetrics
  latenciesA: number[]
  latenciesB: number[]
}

// Minimum sample size for statistical significance
const DEFAULT_MIN_SAMPLE_SIZE = 100
const DEFAULT_CONFIDENCE_THRESHOLD = 0.95
const DEFAULT_MAX_DURATION = 7 * 24 * 60 * 60 * 1000 // 7 days
const MAX_LATENCY_SAMPLES = 1000 // Keep last N latencies for percentile calc

/**
 * Calculate mean of array
 */
function mean(arr: number[]): number {
  if (arr.length === 0) return 0
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

/**
 * Calculate standard deviation
 */
function stdDev(arr: number[]): number {
  if (arr.length < 2) return 0
  const m = mean(arr)
  const variance = arr.reduce((sum, val) => sum + Math.pow(val - m, 2), 0) / (arr.length - 1)
  return Math.sqrt(variance)
}

/**
 * Calculate percentile
 */
function percentile(arr: number[], p: number): number {
  if (arr.length === 0) return 0
  const sorted = [...arr].sort((a, b) => a - b)
  const index = Math.ceil((p / 100) * sorted.length) - 1
  return sorted[Math.max(0, index)]
}

/**
 * Calculate confidence interval for difference in means
 * Returns confidence level (0-1) that variant A is better than B
 */
function calculateConfidence(metricsA: VariantMetrics, metricsB: VariantMetrics): number {
  const n1 = metricsA.predictions
  const n2 = metricsB.predictions
  
  if (n1 < 2 || n2 < 2) return 0.5
  
  const avgLatencyA = metricsA.totalLatency / n1
  const avgLatencyB = metricsB.totalLatency / n2
  
  // Pooled standard error
  const varianceA = metricsA.predictions > 1 
    ? Math.pow(metricsA.totalLatency / n1, 2) / n1 
    : 0
  const varianceB = metricsB.predictions > 1 
    ? Math.pow(metricsB.totalLatency / n2, 2) / n2 
    : 0
  
  const se = Math.sqrt(varianceA + varianceB)
  
  if (se === 0) return 0.5
  
  // Z-score for difference
  const diff = avgLatencyB - avgLatencyA // Positive if A is faster
  const z = diff / se
  
  // Convert z-score to confidence using normal CDF approximation
  // This is simplified - in production use a proper statistical library
  const confidence = normalCDF(z)
  
  return confidence
}

/**
 * Normal cumulative distribution function approximation
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911
  
  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)
  
  const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)
  
  return 0.5 * (1 + sign * y)
}

/**
 * Create A/B test instance
 */
export function createABTest(config: ABTestConfig) {
  const {
    id,
    variantA,
    variantB,
    trafficSplit = 0.5,
    minSampleSize = DEFAULT_MIN_SAMPLE_SIZE,
    confidenceThreshold = DEFAULT_CONFIDENCE_THRESHOLD,
    maxDuration = DEFAULT_MAX_DURATION,
    primaryMetric = 'latency'
  } = config
  
  const state: ABTestState = {
    startTime: Date.now(),
    variantA: {
      variantId: variantA.id,
      predictions: 0,
      totalLatency: 0,
      errors: 0,
      accuracySum: 0
    },
    variantB: {
      variantId: variantB.id,
      predictions: 0,
      totalLatency: 0,
      errors: 0,
      accuracySum: 0
    },
    latenciesA: [],
    latenciesB: []
  }
  
  // Load models (lazy initialization)
  let modelA: ReturnType<typeof useMLInference> | null = null
  let modelB: ReturnType<typeof useMLInference> | null = null
  let modelsLoaded = false
  
  /**
   * Initialize models for testing
   */
  async function initialize(): Promise<void> {
    if (modelsLoaded) return
    
    // Create separate inference instances for each variant
    // In a real implementation, these would be separate model instances
    console.log(`[AB Test ${id}] Initializing models...`)
    
    modelsLoaded = true
  }
  
  /**
   * Run prediction with traffic splitting
   */
  async function predict(
    input: number[],
    predictA: (input: number[]) => Promise<number[]>,
    predictB: (input: number[]) => Promise<number[]>
  ): Promise<ABTestResult> {
    await initialize()
    
    // Traffic split: 50/50 by default
    const useVariantA = Math.random() < trafficSplit
    const startTime = performance.now()
    
    try {
      let output: number[]
      
      if (useVariantA) {
        output = await predictA(input)
        
        const latency = performance.now() - startTime
        state.variantA.predictions++
        state.variantA.totalLatency += latency
        state.latenciesA.push(latency)
        
        // Keep only last N samples
        if (state.latenciesA.length > MAX_LATENCY_SAMPLES) {
          state.latenciesA.shift()
        }
        
        return {
          variant: 'A',
          latency,
          timestamp: Date.now(),
          success: true,
          output
        }
      } else {
        output = await predictB(input)
        
        const latency = performance.now() - startTime
        state.variantB.predictions++
        state.variantB.totalLatency += latency
        state.latenciesB.push(latency)
        
        if (state.latenciesB.length > MAX_LATENCY_SAMPLES) {
          state.latenciesB.shift()
        }
        
        return {
          variant: 'B',
          latency,
          timestamp: Date.now(),
          success: true,
          output
        }
      }
    } catch (err) {
      // Track error
      if (useVariantA) {
        state.variantA.errors++
      } else {
        state.variantB.errors++
      }
      
      throw err
    }
  }
  
  /**
   * Get current test statistics
   */
  function getStats(): ABTestStats {
    const n1 = state.variantA.predictions
    const n2 = state.variantB.predictions
    
    const avgLatencyA = n1 > 0 ? state.variantA.totalLatency / n1 : 0
    const avgLatencyB = n2 > 0 ? state.variantB.totalLatency / n2 : 0
    
    const errorRateA = n1 > 0 ? state.variantA.errors / n1 : 0
    const errorRateB = n2 > 0 ? state.variantB.errors / n2 : 0
    
    const p95A = percentile(state.latenciesA, 95)
    const p95B = percentile(state.latenciesB, 95)
    
    // Calculate confidence
    const confidence = calculateConfidence(state.variantA, state.variantB)
    
    // Determine if sample size is adequate
    const sampleSizeAdequate = n1 >= minSampleSize && n2 >= minSampleSize
    
    // Determine if result is significant
    const isSignificant = sampleSizeAdequate && 
      (confidence >= confidenceThreshold || confidence <= (1 - confidenceThreshold))
    
    // Determine winner
    let winner: 'A' | 'B' | null = null
    if (isSignificant) {
      if (confidence >= confidenceThreshold) {
        winner = 'A'
      } else if (confidence <= (1 - confidenceThreshold)) {
        winner = 'B'
      }
    }
    
    // Check if test has exceeded max duration
    const elapsed = Date.now() - state.startTime
    if (elapsed > maxDuration && !state.endTime) {
      state.endTime = Date.now()
      console.log(`[AB Test ${id}] Test completed after ${(elapsed / 1000 / 60 / 60).toFixed(1)} hours`)
    }
    
    return {
      variantA: {
        id: variantA.id,
        predictions: n1,
        avgLatency: avgLatencyA,
        errorRate: errorRateA,
        p95Latency: p95A
      },
      variantB: {
        id: variantB.id,
        predictions: n2,
        avgLatency: avgLatencyB,
        errorRate: errorRateB,
        p95Latency: p95B
      },
      confidence: Math.max(confidence, 1 - confidence),
      winner,
      isSignificant,
      sampleSizeAdequate
    }
  }
  
  /**
   * Declare winner manually or check if auto-winner exists
   */
  function declareWinner(): 'A' | 'B' | null {
    const stats = getStats()
    
    if (stats.winner) {
      console.log(`[AB Test ${id}] Winner declared: Variant ${stats.winner}`)
      console.log(`  - Confidence: ${(stats.confidence * 100).toFixed(1)}%`)
      console.log(`  - Variant A: ${stats.variantA.predictions} predictions, ${stats.variantA.avgLatency.toFixed(1)}ms avg`)
      console.log(`  - Variant B: ${stats.variantB.predictions} predictions, ${stats.variantB.avgLatency.toFixed(1)}ms avg`)
    } else {
      console.log(`[AB Test ${id}] No clear winner yet`)
      console.log(`  - Current confidence: ${(stats.confidence * 100).toFixed(1)}%`)
      console.log(`  - Need ${(confidenceThreshold * 100).toFixed(0)}% confidence`)
    }
    
    return stats.winner
  }
  
  /**
   * Export test data for analysis
   */
  function exportData() {
    return {
      testId: id,
      config: {
        trafficSplit,
        minSampleSize,
        confidenceThreshold,
        primaryMetric
      },
      state: {
        startTime: state.startTime,
        endTime: state.endTime,
        duration: (state.endTime || Date.now()) - state.startTime
      },
      variantA: { ...state.variantA },
      variantB: { ...state.variantB },
      stats: getStats()
    }
  }
  
  /**
   * Reset test state
   */
  function reset(): void {
    state.startTime = Date.now()
    state.endTime = undefined
    state.variantA = {
      variantId: variantA.id,
      predictions: 0,
      totalLatency: 0,
      errors: 0,
      accuracySum: 0
    }
    state.variantB = {
      variantId: variantB.id,
      predictions: 0,
      totalLatency: 0,
      errors: 0,
      accuracySum: 0
    }
    state.latenciesA = []
    state.latenciesB = []
    
    console.log(`[AB Test ${id}] Test reset`)
  }
  
  return {
    id,
    predict,
    getStats,
    declareWinner,
    exportData,
    reset
  }
}

export type ABTest = ReturnType<typeof createABTest>

/**
 * React hook for A/B testing
 */
export function useABTest(config: ABTestConfig) {
  // In a real React hook, this would use useState/useEffect
  // For now, return the test instance directly
  return createABTest(config)
}

// Global test registry for managing multiple tests
const activeTests = new Map<string, ABTest>()

/**
 * Create and register a new A/B test
 */
export function createTest(config: ABTestConfig): ABTest {
  const test = createABTest(config)
  activeTests.set(config.id, test)
  return test
}

/**
 * Get an existing test by ID
 */
export function getTest(id: string): ABTest | undefined {
  return activeTests.get(id)
}

/**
 * List all active tests
 */
export function listTests(): Array<{ id: string; stats: ABTestStats }> {
  return Array.from(activeTests.entries()).map(([id, test]) => ({
    id,
    stats: test.getStats()
  }))
}

/**
 * Clear all tests
 */
export function clearTests(): void {
  activeTests.clear()
}

// Expose to window for debugging
declare global {
  interface Window {
    mlABTesting: {
      createTest: typeof createTest
      getTest: typeof getTest
      listTests: typeof listTests
      clearTests: typeof clearTests
      activeTests: Map<string, ABTest>
    }
  }
}

if (typeof window !== 'undefined') {
  window.mlABTesting = {
    createTest,
    getTest,
    listTests,
    clearTests,
    activeTests
  }
}

export default createABTest
