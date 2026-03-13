/**
 * ML Analytics - Prediction Tracking & Performance Monitoring
 * Tracks latency, errors, and model usage for dashboard reporting
 * 
 * [Ver001.000]
 */

export interface PredictionEvent {
  timestamp: number
  latency: number
  success: boolean
  modelId: string
  inputSize: number
  errorType?: string
}

export interface ModelLoadEvent {
  timestamp: number
  modelId: string
  duration: number
  source: 'cache' | 'network'
  sizeBytes?: number
  quantization?: 'fp32' | 'int16' | 'int8'
}

export interface MLError {
  type: 'validation' | 'inference' | 'network' | 'timeout' | 'unknown'
  message: string
  stack?: string
}

export interface ErrorEvent {
  timestamp: number
  error: MLError
  context: string
  modelId?: string
}

export interface LatencyDistribution {
  p50: number
  p95: number
  p99: number
  min: number
  max: number
  avg: number
}

export interface ModelMetrics {
  modelId: string
  predictions: number
  errors: number
  avgLatency: number
  latencyDistribution: LatencyDistribution
  cacheHitRate: number
  lastUsed: number
}

export interface AnalyticsReport {
  generatedAt: number
  timeRange: { start: number; end: number }
  summary: {
    totalPredictions: number
    totalErrors: number
    errorRate: number
    avgLatency: number
    activeModels: number
  }
  latencyDistribution: LatencyDistribution
  modelMetrics: ModelMetrics[]
  errorsByType: Record<string, number>
  hourlyActivity: { hour: number; predictions: number; errors: number }[]
}

interface MLAnalyticsState {
  predictions: PredictionEvent[]
  modelLoads: ModelLoadEvent[]
  errors: ErrorEvent[]
  maxEvents: number
}

const DEFAULT_MAX_EVENTS = 10000

/**
 * Create ML Analytics instance
 */
export function createMLAnalytics(maxEvents: number = DEFAULT_MAX_EVENTS) {
  const state: MLAnalyticsState = {
    predictions: [],
    modelLoads: [],
    errors: [],
    maxEvents
  }

  /**
   * Track a prediction event
   */
  function trackPrediction(
    latency: number,
    success: boolean,
    modelId: string = 'default',
    inputSize: number = 0
  ): void {
    const event: PredictionEvent = {
      timestamp: Date.now(),
      latency,
      success,
      modelId,
      inputSize
    }

    state.predictions.push(event)
    
    // Trim old events
    if (state.predictions.length > state.maxEvents) {
      state.predictions = state.predictions.slice(-state.maxEvents)
    }

    // Log slow predictions
    if (latency > 100) {
      console.warn(`[ML Analytics] Slow prediction: ${latency.toFixed(1)}ms`)
    }
  }

  /**
   * Track a prediction error
   */
  function trackPredictionError(
    error: Error,
    modelId: string = 'default',
    context: string = 'predict'
  ): void {
    const mlError: MLError = {
      type: classifyError(error),
      message: error.message,
      stack: error.stack
    }

    trackError(mlError, context, modelId)
  }

  /**
   * Track model load event
   */
  function trackModelLoad(
    modelId: string,
    duration: number,
    source: 'cache' | 'network',
    sizeBytes?: number,
    quantization?: 'fp32' | 'int16' | 'int8'
  ): void {
    const event: ModelLoadEvent = {
      timestamp: Date.now(),
      modelId,
      duration,
      source,
      sizeBytes,
      quantization
    }

    state.modelLoads.push(event)
    
    if (state.modelLoads.length > state.maxEvents) {
      state.modelLoads = state.modelLoads.slice(-state.maxEvents)
    }

    // Log slow loads
    if (duration > 5000) {
      console.warn(`[ML Analytics] Slow model load: ${duration.toFixed(0)}ms (${source})`)
    }
  }

  /**
   * Track error event
   */
  function trackError(
    error: MLError,
    context: string,
    modelId?: string
  ): void {
    const event: ErrorEvent = {
      timestamp: Date.now(),
      error,
      context,
      modelId
    }

    state.errors.push(event)
    
    if (state.errors.length > state.maxEvents) {
      state.errors = state.errors.slice(-state.maxEvents)
    }

    console.error(`[ML Analytics] Error in ${context}:`, error.message)
  }

  /**
   * Classify error type
   */
  function classifyError(error: Error): MLError['type'] {
    const message = error.message.toLowerCase()
    
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation'
    }
    if (message.includes('inference') || message.includes('predict')) {
      return 'inference'
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
      return 'network'
    }
    if (message.includes('timeout')) {
      return 'timeout'
    }
    
    return 'unknown'
  }

  /**
   * Calculate latency distribution
   */
  function calculateLatencyDistribution(latencies: number[]): LatencyDistribution {
    if (latencies.length === 0) {
      return { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 }
    }

    const sorted = [...latencies].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)

    const percentile = (p: number) => {
      const index = Math.ceil((p / 100) * sorted.length) - 1
      return sorted[Math.max(0, index)]
    }

    return {
      p50: percentile(50),
      p95: percentile(95),
      p99: percentile(99),
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length
    }
  }

  /**
   * Get comprehensive analytics report
   */
  function getReport(timeRange?: { start: number; end: number }): AnalyticsReport {
    const end = timeRange?.end || Date.now()
    const start = timeRange?.start || end - 24 * 60 * 60 * 1000 // Default 24 hours

    // Filter events by time range
    const predictions = state.predictions.filter(p => p.timestamp >= start && p.timestamp <= end)
    const modelLoads = state.modelLoads.filter(m => m.timestamp >= start && m.timestamp <= end)
    const errors = state.errors.filter(e => e.timestamp >= start && e.timestamp <= end)

    // Calculate summary
    const successfulPredictions = predictions.filter(p => p.success)
    const failedPredictions = predictions.filter(p => !p.success)
    
    const totalPredictions = predictions.length
    const totalErrors = failedPredictions.length + errors.length
    const errorRate = totalPredictions > 0 ? totalErrors / totalPredictions : 0

    const latencies = successfulPredictions.map(p => p.latency)
    const avgLatency = latencies.length > 0 ? latencies.reduce((a, b) => a + b, 0) / latencies.length : 0

    // Calculate per-model metrics
    const modelMap = new Map<string, ModelMetrics>()
    
    for (const pred of predictions) {
      if (!modelMap.has(pred.modelId)) {
        modelMap.set(pred.modelId, {
          modelId: pred.modelId,
          predictions: 0,
          errors: 0,
          avgLatency: 0,
          latencyDistribution: { p50: 0, p95: 0, p99: 0, min: 0, max: 0, avg: 0 },
          cacheHitRate: 0,
          lastUsed: 0
        })
      }
      
      const metrics = modelMap.get(pred.modelId)!
      metrics.predictions++
      if (!pred.success) metrics.errors++
      metrics.lastUsed = Math.max(metrics.lastUsed, pred.timestamp)
    }

    // Calculate model-specific metrics
    for (const [modelId, metrics] of modelMap) {
      const modelPreds = predictions.filter(p => p.modelId === modelId)
      const modelLatencies = modelPreds.filter(p => p.success).map(p => p.latency)
      
      metrics.latencyDistribution = calculateLatencyDistribution(modelLatencies)
      metrics.avgLatency = metrics.latencyDistribution.avg
      
      const loads = modelLoads.filter(m => m.modelId === modelId)
      const cacheLoads = loads.filter(m => m.source === 'cache').length
      metrics.cacheHitRate = loads.length > 0 ? cacheLoads / loads.length : 0
    }

    // Errors by type
    const errorsByType: Record<string, number> = {}
    for (const error of errors) {
      const type = error.error.type
      errorsByType[type] = (errorsByType[type] || 0) + 1
    }

    // Hourly activity
    const hourlyActivity: { hour: number; predictions: number; errors: number }[] = []
    for (let i = 0; i < 24; i++) {
      const hourStart = end - (24 - i) * 60 * 60 * 1000
      const hourEnd = hourStart + 60 * 60 * 1000
      
      const hourPreds = predictions.filter(p => p.timestamp >= hourStart && p.timestamp < hourEnd)
      
      hourlyActivity.push({
        hour: i,
        predictions: hourPreds.length,
        errors: hourPreds.filter(p => !p.success).length
      })
    }

    return {
      generatedAt: Date.now(),
      timeRange: { start, end },
      summary: {
        totalPredictions,
        totalErrors,
        errorRate,
        avgLatency,
        activeModels: modelMap.size
      },
      latencyDistribution: calculateLatencyDistribution(latencies),
      modelMetrics: Array.from(modelMap.values()),
      errorsByType,
      hourlyActivity
    }
  }

  /**
   * Get quick summary stats
   */
  function getSummary(): { predictions: number; errors: number; avgLatency: number } {
    const recent = state.predictions.slice(-100)
    const successful = recent.filter(p => p.success)
    
    return {
      predictions: recent.length,
      errors: recent.filter(p => !p.success).length,
      avgLatency: successful.length > 0
        ? successful.reduce((a, p) => a + p.latency, 0) / successful.length
        : 0
    }
  }

  /**
   * Export raw data
   */
  function exportData(): { predictions: PredictionEvent[]; modelLoads: ModelLoadEvent[]; errors: ErrorEvent[] } {
    return {
      predictions: [...state.predictions],
      modelLoads: [...state.modelLoads],
      errors: [...state.errors]
    }
  }

  /**
   * Clear all data
   */
  function clear(): void {
    state.predictions = []
    state.modelLoads = []
    state.errors = []
  }

  return {
    trackPrediction,
    trackPredictionError,
    trackModelLoad,
    trackError,
    getReport,
    getSummary,
    exportData,
    clear
  }
}

// Create global instance
export const mlAnalytics = createMLAnalytics()

// Expose to window for console access
declare global {
  interface Window {
    mlAnalytics: ReturnType<typeof createMLAnalytics>
  }
}

if (typeof window !== 'undefined') {
  window.mlAnalytics = mlAnalytics
}

export default mlAnalytics
