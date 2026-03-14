/**
 * Performance Monitor - Real User Monitoring (RUM)
 * Tracks Web Vitals, ML inference metrics, and circuit breaker telemetry
 * 
 * [Ver001.000]
 */

import { analyticsSync } from '../services/analyticsSync'
import { logger } from '../utils/logger'

// Performance entry types
type WebVitalName = 'LCP' | 'FID' | 'CLS' | 'FCP' | 'TTFB'
type MLMetricName = 'inference_latency' | 'model_load_time' | 'prediction_queue_depth'
type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface WebVitalMetric {
  name: WebVitalName
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta?: number
  entries?: PerformanceEntry[]
}

interface MLMetric {
  name: MLMetricName
  value: number
  modelId?: string
  timestamp: number
}

interface CircuitBreakerMetric {
  state: CircuitBreakerState
  failureCount: number
  successCount: number
  lastFailureTime?: number
}

interface ErrorMetric {
  component: string
  errorType: string
  message: string
  stack?: string
  timestamp: number
}

class PerformanceMonitor {
  private isInitialized = false
  private webVitalsBuffer: WebVitalMetric[] = []
  private mlMetricsBuffer: MLMetric[] = []
  private circuitBreakerState: Map<string, CircuitBreakerMetric> = new Map()
  private flushInterval: number | null = null
  private readonly FLUSH_INTERVAL_MS = 30000 // 30 seconds

  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return
    this.isInitialized = true

    this.observeWebVitals()
    this.observePerformanceEntries()
    this.startFlushInterval()

    logger.info('[PerformanceMonitor] RUM initialized')
  }

  cleanup(): void {
    if (this.flushInterval) {
      window.clearInterval(this.flushInterval)
    }
    this.flushMetrics() // Final flush
  }

  // Web Vitals tracking
  private observeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.observeLCP()
    // First Input Delay (FID)
    this.observeFID()
    // Cumulative Layout Shift (CLS)
    this.observeCLS()
    // First Contentful Paint (FCP)
    this.observeFCP()
    // Time to First Byte (TTFB)
    this.observeTTFB()
  }

  private observeLCP(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number }
        
        this.recordWebVital({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: this.getLCPRating(lastEntry.startTime),
          entries
        })
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      // LCP not supported
    }
  }

  private observeFID(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const firstEntry = entries[0] as PerformanceEntry & { processingStart: number; startTime: number }
        const value = firstEntry.processingStart - firstEntry.startTime
        
        this.recordWebVital({
          name: 'FID',
          value,
          rating: this.getFIDRating(value),
          entries
        })
      })

      observer.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      // FID not supported
    }
  }

  private observeCLS(): void {
    if (!('PerformanceObserver' in window)) return

    let clsValue = 0
    let clsEntries: PerformanceEntry[] = []

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const layoutShift = entry as PerformanceEntry & { value: number; hadRecentInput: boolean }
          if (!layoutShift.hadRecentInput) {
            clsValue += layoutShift.value
            clsEntries.push(entry)
          }
        }
      })

      observer.observe({ entryTypes: ['layout-shift'] })

      // Report CLS on page visibility change
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.recordWebVital({
            name: 'CLS',
            value: clsValue,
            rating: this.getCLSRating(clsValue),
            entries: clsEntries
          })
        }
      })
    } catch (e) {
      // CLS not supported
    }
  }

  private observeFCP(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const firstEntry = entries[0] as PerformanceEntry & { startTime: number }
        
        this.recordWebVital({
          name: 'FCP',
          value: firstEntry.startTime,
          rating: this.getFCPRating(firstEntry.startTime),
          entries
        })
      })

      observer.observe({ entryTypes: ['paint'] })
    } catch (e) {
      // FCP not supported
    }
  }

  private observeTTFB(): void {
    if (typeof window === 'undefined' || !window.performance) return

    window.addEventListener('load', () => {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        const value = navigation.responseStart - navigation.startTime
        this.recordWebVital({
          name: 'TTFB',
          value,
          rating: this.getTTFBRating(value)
        })
      }
    })
  }

  private observePerformanceEntries(): void {
    if (!('PerformanceObserver' in window)) return

    // Observe resource loading
    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming
          
          // Track slow resources (>1s)
          if (resource.duration > 1000) {
            analyticsSync.track('slow_resource', {
              name: resource.name,
              duration: resource.duration,
              initiatorType: resource.initiatorType
            })
          }
        }
      })

      observer.observe({ entryTypes: ['resource'] })
    } catch (e) {
      // Resource timing not supported
    }
  }

  // ML inference metrics
  trackMLInference(latency: number, modelId: string, success: boolean): void {
    this.mlMetricsBuffer.push({
      name: 'inference_latency',
      value: latency,
      modelId,
      timestamp: Date.now()
    })

    analyticsSync.track('ml_inference', {
      latency,
      modelId,
      success,
      timestamp: Date.now()
    })
  }

  trackModelLoad(duration: number, modelId: string, source: 'cache' | 'network'): void {
    this.mlMetricsBuffer.push({
      name: 'model_load_time',
      value: duration,
      modelId,
      timestamp: Date.now()
    })

    analyticsSync.track('model_load', {
      duration,
      modelId,
      source,
      timestamp: Date.now()
    })
  }

  trackQueueDepth(depth: number, maxSize: number): void {
    // Only track significant queue depths (>50% capacity)
    if (depth > maxSize * 0.5) {
      this.mlMetricsBuffer.push({
        name: 'prediction_queue_depth',
        value: depth,
        timestamp: Date.now()
      })
    }
  }

  // Circuit breaker telemetry
  trackCircuitBreaker(
    componentId: string,
    state: CircuitBreakerState,
    metrics: Omit<CircuitBreakerMetric, 'state'>
  ): void {
    this.circuitBreakerState.set(componentId, {
      state,
      ...metrics
    })

    // Track state changes to analytics
    analyticsSync.track('circuit_breaker', {
      componentId,
      state,
      failureCount: metrics.failureCount,
      successCount: metrics.successCount,
      timestamp: Date.now()
    })
  }

  // Error boundary metrics
  trackErrorBoundaryCatch(component: string, error: Error): void {
    const metric: ErrorMetric = {
      component,
      errorType: error.name,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now()
    }

    analyticsSync.track('error_boundary_catch', {
      component: metric.component,
      errorType: metric.errorType,
      timestamp: metric.timestamp
    })
  }

  // Get current metrics for health checks
  getMetrics(): {
    webVitals: WebVitalMetric[]
    mlMetrics: MLMetric[]
    circuitBreakers: Map<string, CircuitBreakerMetric>
  } {
    return {
      webVitals: [...this.webVitalsBuffer],
      mlMetrics: [...this.mlMetricsBuffer],
      circuitBreakers: new Map(this.circuitBreakerState)
    }
  }

  // Private helpers
  private recordWebVital(metric: WebVitalMetric): void {
    this.webVitalsBuffer.push(metric)
    
    // Log poor metrics immediately
    if (metric.rating === 'poor') {
      logger.warn(`[Web Vital] ${metric.name}: ${metric.value.toFixed(2)} (poor)`)
    }

    // Send to analytics
    analyticsSync.track('web_vital', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: Date.now()
    })
  }

  private getLCPRating(value: number): WebVitalMetric['rating'] {
    if (value <= 2500) return 'good'
    if (value <= 4000) return 'needs-improvement'
    return 'poor'
  }

  private getFIDRating(value: number): WebVitalMetric['rating'] {
    if (value <= 100) return 'good'
    if (value <= 300) return 'needs-improvement'
    return 'poor'
  }

  private getCLSRating(value: number): WebVitalMetric['rating'] {
    if (value <= 0.1) return 'good'
    if (value <= 0.25) return 'needs-improvement'
    return 'poor'
  }

  private getFCPRating(value: number): WebVitalMetric['rating'] {
    if (value <= 1800) return 'good'
    if (value <= 3000) return 'needs-improvement'
    return 'poor'
  }

  private getTTFBRating(value: number): WebVitalMetric['rating'] {
    if (value <= 800) return 'good'
    if (value <= 1800) return 'needs-improvement'
    return 'poor'
  }

  private startFlushInterval(): void {
    this.flushInterval = window.setInterval(() => {
      this.flushMetrics()
    }, this.FLUSH_INTERVAL_MS)
  }

  private flushMetrics(): void {
    // Flush any buffered metrics
    if (this.webVitalsBuffer.length > 0) {
      this.webVitalsBuffer = []
    }
    if (this.mlMetricsBuffer.length > 0) {
      this.mlMetricsBuffer = []
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()
export default performanceMonitor
