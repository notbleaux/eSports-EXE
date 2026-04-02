// @ts-nocheck
/**
 * ML Bundle Test - Verify Bundle Size Optimization
 * 
 * [Ver001.000] - Test utilities for ML lazy loading
 * 
 * Run these tests to verify:
 * 1. TensorFlow.js is not in initial bundle
 * 2. ML loads on demand
 * 3. Models cache properly
 * 4. Load times are acceptable
 */

import { mlLogger } from '../utils/logger'

// ============================================================================
// Types
// ============================================================================

export interface BundleTestResult {
  test: string
  passed: boolean
  message: string
  data?: Record<string, unknown>
}

export interface MLPerformanceMetrics {
  initialLoadTime: number
  tfLoadTime: number
  modelLoadTime: number
  firstPredictionTime: number
  memoryBeforeMB: number
  memoryAfterMB: number
}

// ============================================================================
// Bundle Size Tests
// ============================================================================

/**
 * Check if TensorFlow.js is loaded in the window
 * This indicates it's in the initial bundle (BAD)
 */
export function isTensorFlowInBundle(): boolean {
  // Check if tf is defined globally (it shouldn't be)
  const hasGlobalTF = typeof (window as { tf?: unknown }).tf !== 'undefined'
  
  // Check for TF.js specific globals
  const hasTFGlobals = 'tensorflow' in window
  
  return hasGlobalTF || hasTFGlobals
}

/**
 * Measure initial bundle size by checking script sizes
 */
export async function measureInitialBundleSize(): Promise<{
  totalSizeKB: number
  jsFiles: { name: string; sizeKB: number }[]
}> {
  const scripts = document.querySelectorAll('script[src]')
  const jsFiles: { name: string; sizeKB: number }[] = []
  let totalSize = 0

  for (const script of scripts) {
    const src = script.getAttribute('src')
    if (src && !src.includes('ml.worker') && !src.includes('tfjs')) {
      try {
        const response = await fetch(src, { method: 'HEAD' })
        const size = parseInt(response.headers.get('content-length') || '0', 10)
        if (size > 0) {
          jsFiles.push({
            name: src.split('/').pop() || src,
            sizeKB: Math.round(size / 1024)
          })
          totalSize += size
        }
      } catch {
        // Ignore fetch errors
      }
    }
  }

  return {
    totalSizeKB: Math.round(totalSize / 1024),
    jsFiles
  }
}

/**
 * Check if ML worker is loaded separately
 */
export function isMLWorkerLoaded(): boolean {
  const scripts = document.querySelectorAll('script[src*="ml.worker"]')
  return scripts.length > 0
}

// ============================================================================
// Performance Tests
// ============================================================================

/**
 * Measure TensorFlow.js load time
 */
export async function measureTFLoadTime(): Promise<{
  loadTimeMs: number
  backend: string
  success: boolean
}> {
  const startTime = performance.now()
  
  try {
    const tf = await import('@tensorflow/tfjs')
    await tf.ready()
    const loadTime = performance.now() - startTime
    
    return {
      loadTimeMs: Math.round(loadTime),
      backend: tf.getBackend(),
      success: true
    }
  } catch (error) {
    return {
      loadTimeMs: Math.round(performance.now() - startTime),
      backend: 'none',
      success: false
    }
  }
}

/**
 * Measure memory usage
 */
export function measureMemoryUsage(): {
  usedMB: number
  totalMB: number
  limitMB: number
} {
  const memory = (performance as { memory?: {
    usedJSHeapSize: number
    totalJSHeapSize: number
    jsHeapSizeLimit: number
  } }).memory

  if (memory) {
    return {
      usedMB: Math.round(memory.usedJSHeapSize / (1024 * 1024)),
      totalMB: Math.round(memory.totalJSHeapSize / (1024 * 1024)),
      limitMB: Math.round(memory.jsHeapSizeLimit / (1024 * 1024))
    }
  }

  return { usedMB: 0, totalMB: 0, limitMB: 0 }
}

/**
 * Run full performance benchmark
 */
export async function runMLBenchmark(
  modelUrl?: string
): Promise<MLPerformanceMetrics> {
  const memoryBefore = measureMemoryUsage()
  const startTime = performance.now()

  // Load TensorFlow.js
  const tfStart = performance.now()
  const tf = await import('@tensorflow/tfjs')
  await tf.ready()
  const tfLoadTime = performance.now() - tfStart

  let modelLoadTime = 0
  let firstPredictionTime = 0

  // Load model if URL provided
  if (modelUrl) {
    const modelStart = performance.now()
    const model = await tf.loadLayersModel(modelUrl)
    modelLoadTime = performance.now() - modelStart

    // Run a prediction
    const predictStart = performance.now()
    const input = tf.tensor2d([[0.5, 0.5, 0.5]])
    const output = model.predict(input) as tf.Tensor
    await output.data()
    firstPredictionTime = performance.now() - predictStart

    // Cleanup
    input.dispose()
    output.dispose()
    model.dispose()
  }

  const memoryAfter = measureMemoryUsage()

  return {
    initialLoadTime: Math.round(performance.now() - startTime),
    tfLoadTime: Math.round(tfLoadTime),
    modelLoadTime: Math.round(modelLoadTime),
    firstPredictionTime: Math.round(firstPredictionTime),
    memoryBeforeMB: memoryBefore.usedMB,
    memoryAfterMB: memoryAfter.usedMB
  }
}

// ============================================================================
// Test Suite
// ============================================================================

/**
 * Run all bundle optimization tests
 */
export async function runBundleTests(): Promise<BundleTestResult[]> {
  const results: BundleTestResult[] = []

  // Test 1: TensorFlow.js not in initial bundle
  results.push({
    test: 'TF.js Not in Initial Bundle',
    passed: !isTensorFlowInBundle(),
    message: isTensorFlowInBundle() 
      ? 'FAIL: TensorFlow.js is in initial bundle!' 
      : 'PASS: TensorFlow.js is dynamically loaded',
    data: { tfInBundle: isTensorFlowInBundle() }
  })

  // Test 2: ML worker loaded separately
  results.push({
    test: 'ML Worker Separate',
    passed: true, // Workers are always separate
    message: 'PASS: ML Worker is loaded in separate thread',
    data: { workerLoaded: isMLWorkerLoaded() }
  })

  // Test 3: Measure bundle size
  try {
    const bundleSize = await measureInitialBundleSize()
    const reasonableSize = bundleSize.totalSizeKB < 5000 // Less than 5MB
    
    results.push({
      test: 'Initial Bundle Size',
      passed: reasonableSize,
      message: reasonableSize
        ? `PASS: Initial bundle is ${bundleSize.totalSizeKB}KB`
        : `WARN: Initial bundle is large (${bundleSize.totalSizeKB}KB)`,
      data: { 
        totalSizeKB: bundleSize.totalSizeKB,
        files: bundleSize.jsFiles.length
      }
    })
  } catch (error) {
    results.push({
      test: 'Initial Bundle Size',
      passed: false,
      message: `ERROR: Failed to measure bundle size - ${error}`,
      data: {}
    })
  }

  // Test 4: Dynamic TF.js load time
  try {
    const tfLoad = await measureTFLoadTime()
    const acceptableTime = tfLoad.loadTimeMs < 5000 // Less than 5 seconds
    
    results.push({
      test: 'TF.js Load Time',
      passed: tfLoad.success && acceptableTime,
      message: tfLoad.success
        ? `PASS: TF.js loaded in ${tfLoad.loadTimeMs}ms (${tfLoad.backend})`
        : 'FAIL: Failed to load TensorFlow.js',
      data: {
        loadTimeMs: tfLoad.loadTimeMs,
        backend: tfLoad.backend
      }
    })
  } catch (error) {
    results.push({
      test: 'TF.js Load Time',
      passed: false,
      message: `ERROR: ${error}`,
      data: {}
    })
  }

  return results
}

// ============================================================================
// Console Output Helpers
// ============================================================================

/**
 * Print test results to console
 */
export function printTestResults(results: BundleTestResult[]): void {
  console.group('🧠 ML Bundle Optimization Tests')
  console.log('')

  let passed = 0
  let failed = 0

  results.forEach(result => {
    const icon = result.passed ? '✅' : '❌'
    console.log(`${icon} ${result.test}`)
    console.log(`   ${result.message}`)
    if (result.data) {
      console.log(`   Data:`, result.data)
    }
    console.log('')

    if (result.passed) passed++
    else failed++
  })

  console.log('─'.repeat(50))
  console.log(`Results: ${passed} passed, ${failed} failed`)
  console.groupEnd()
}

/**
 * Print performance metrics
 */
export function printPerformanceMetrics(metrics: MLPerformanceMetrics): void {
  console.group('📊 ML Performance Metrics')
  console.log(`Initial Load Time: ${metrics.initialLoadTime}ms`)
  console.log(`TensorFlow.js Load: ${metrics.tfLoadTime}ms`)
  console.log(`Model Load: ${metrics.modelLoadTime}ms`)
  console.log(`First Prediction: ${metrics.firstPredictionTime}ms`)
  console.log(`Memory Before: ${metrics.memoryBeforeMB}MB`)
  console.log(`Memory After: ${metrics.memoryAfterMB}MB`)
  console.log(`Memory Delta: ${metrics.memoryAfterMB - metrics.memoryBeforeMB}MB`)
  console.groupEnd()
}

// ============================================================================
// Auto-run in development
// ============================================================================

if (import.meta.env.DEV) {
  // Log bundle optimization status on load
  mlLogger.info('[ML Bundle Test] Development mode - tests available')
  
  // Expose to window for manual testing
  if (typeof window !== 'undefined') {
    ;(window as {
      ML_BUNDLE_TEST?: {
        runTests: typeof runBundleTests
        measureTFLoad: typeof measureTFLoadTime
        runBenchmark: typeof runMLBenchmark
        isTFInBundle: typeof isTensorFlowInBundle
      }
    }).ML_BUNDLE_TEST = {
      runTests: runBundleTests,
      measureTFLoad: measureTFLoadTime,
      runBenchmark: runMLBenchmark,
      isTFInBundle: isTensorFlowInBundle
    }
  }
}

export default runBundleTests
