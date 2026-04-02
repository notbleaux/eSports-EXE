// @ts-nocheck
/**
 * Performance Monitor - Real User Monitoring (RUM)
 * Tracks Web Vitals, ML inference metrics, and circuit breaker telemetry
 * 
 * [Ver002.000] - Enhanced with INP, TBT, and user timing marks
 */

import { analyticsSync } from '../services/analyticsSync'
import { logger } from '../utils/logger'

// Performance entry types
// Note: FID is deprecated in favor of INP
type WebVitalName = 'LCP' | 'INP' | 'CLS' | 'FCP' | 'TTFB' | 'TBT' | 'FPL'
type MLMetricName = 'inference_latency' | 'model_load_time' | 'prediction_queue_depth'
type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN'

interface WebVitalMetric {
  name: WebVitalName
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta?: number
  entries?: PerformanceEntry[]
  navigationType?: string
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

interface ResourceMetric {
  name: string
  duration: number
  transferSize: number
  initiatorType: string
  rating: 'good' | 'needs-improvement' | 'poor'
}

interface NavigationMetric {
  type: string
  duration: number
  dnsTime: number
  connectTime: number
  ttfb: number
  domContentLoaded: number
  loadComplete: number
}

interface UserTimingMetric {
  name: string
  duration: number
  startTime: number
}

interface PerformanceSnapshot {
  timestamp: number
  webVitals: Record<WebVitalName, WebVitalMetric | undefined>
  resources: ResourceMetric[]
  navigation?: NavigationMetric
  userTimings: UserTimingMetric[]
}

// INP tracking state
interface INPState {
  entries: PerformanceEventTiming[]
  maxDuration: number
  observer?: PerformanceObserver
}

class PerformanceMonitor {
  private isInitialized = false
  private webVitalsBuffer: WebVitalMetric[] = []
  private mlMetricsBuffer: MLMetric[] = []
  private circuitBreakerState: Map<string, CircuitBreakerMetric> = new Map()
  private flushInterval: number | null = null
  private readonly FLUSH_INTERVAL_MS = 30000 // 30 seconds
  
  // Enhanced tracking state
  private inpState: INPState = { entries: [], maxDuration: 0 }
  private longTaskObserver?: PerformanceObserver
  private resourceObserver?: PerformanceObserver
  private navigationObserver?: PerformanceObserver
  private snapshots: PerformanceSnapshot[] = []
  private userTimings: UserTimingMetric[] = []
  private slowResources: ResourceMetric[] = []
  
  // Performance budgets (ms)
  private readonly BUDGETS = {
    LCP: 2500,
    INP: 200,
    CLS: 0.1,
    FCP: 1800,
    TTFB: 800,
    TBT: 200,
    resource: 1000,
    longTask: 50
  }

  initialize(): void {
    if (this.isInitialized || typeof window === 'undefined') return
    this.isInitialized = true

    this.observeWebVitals()
    this.observePerformanceEntries()
    this.observeLongTasks()
    this.startFlushInterval()
    this.measureNavigationTiming()
    
    // Track First Paint separately
    this.measureFirstPaint()

    logger.info('[PerformanceMonitor] RUM initialized v2.0')
  }

  cleanup(): void {
    if (this.flushInterval) {
      window.clearInterval(this.flushInterval)
    }
    this.longTaskObserver?.disconnect()
    this.resourceObserver?.disconnect()
    this.navigationObserver?.disconnect()
    this.inpState.observer?.disconnect()
    this.flushMetrics() // Final flush
  }

  // ==================== Web Vitals Tracking ====================

  private observeWebVitals(): void {
    // Largest Contentful Paint (LCP)
    this.observeLCP()
    // Interaction to Next Paint (INP) - replaces FID
    this.observeINP()
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
        const lastEntry = entries[entries.length - 1] as PerformanceEntry & { startTime: number; size: number; url?: string }
        
        this.recordWebVital({
          name: 'LCP',
          value: lastEntry.startTime,
          rating: this.getLCPRating(lastEntry.startTime),
          entries,
          navigationType: this.getNavigationType()
        })

        // Mark LCP element for debugging
        this.markUserTiming('LCP-observed', lastEntry.startTime)
      })

      observer.observe({ entryTypes: ['largest-contentful-paint'] })
    } catch (e) {
      logger.warn('[PerformanceMonitor] LCP not supported')
    }
  }

  private observeINP(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      this.inpState.observer = new PerformanceObserver((list) => {
        const entries = list.getEntries() as PerformanceEventTiming[]
        
        for (const entry of entries) {
          // Only track interactions with duration > 0
          if (entry.duration > 0) {
            this.inpState.entries.push(entry)
            
            // Update max duration
            if (entry.duration > this.inpState.maxDuration) {
              this.inpState.maxDuration = entry.duration
            }
          }
        }
      })

      this.inpState.observer.observe({ 
        entryTypes: ['event'],
        buffered: true
      })

      // Report INP on page hide
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && this.inpState.maxDuration > 0) {
          this.recordWebVital({
            name: 'INP',
            value: this.inpState.maxDuration,
            rating: this.getINPRating(this.inpState.maxDuration),
            navigationType: this.getNavigationType()
          })
        }
      })
    } catch (e) {
      logger.warn('[PerformanceMonitor] INP not supported, falling back to FID')
      this.observeFID()
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
          name: 'INP',
          value,
          rating: this.getFIDRating(value),
          entries,
          navigationType: this.getNavigationType()
        })
      })

      observer.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      logger.warn('[PerformanceMonitor] FID not supported')
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
            entries: clsEntries,
            navigationType: this.getNavigationType()
          })
        }
      })
    } catch (e) {
      logger.warn('[PerformanceMonitor] CLS not supported')
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
          entries,
          navigationType: this.getNavigationType()
        })
      })

      observer.observe({ entryTypes: ['paint'] })
    } catch (e) {
      logger.warn('[PerformanceMonitor] FCP not supported')
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
          rating: this.getTTFBRating(value),
          navigationType: this.getNavigationType()
        })
      }
    })
  }

  // ==================== Long Tasks & TBT ====================

  private observeLongTasks(): void {
    if (!('PerformanceObserver' in window)) return

    let totalBlockingTime = 0
    let longTaskCount = 0

    try {
      this.longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const longTask = entry as PerformanceEntry & { duration: number; startTime: number }
          
          // TBT calculation: sum of durations > 50ms, minus 50ms each
          if (longTask.duration > 50) {
            const blockingTime = longTask.duration - 50
            totalBlockingTime += blockingTime
            longTaskCount++

            // Track slow tasks
            if (longTask.duration > this.BUDGETS.longTask) {
              analyticsSync.track('long_task', {
                duration: longTask.duration,
                startTime: longTask.startTime,
                timestamp: Date.now()
              })
            }
          }
        }
      })

      this.longTaskObserver.observe({ entryTypes: ['longtask'] })

      // Report TBT on page hide
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden' && totalBlockingTime > 0) {
          this.recordWebVital({
            name: 'TBT',
            value: totalBlockingTime,
            rating: this.getTBTRating(totalBlockingTime),
            navigationType: this.getNavigationType()
          })
          
          analyticsSync.track('tbt_final', {
            value: totalBlockingTime,
            longTaskCount,
            timestamp: Date.now()
          })
        }
      })
    } catch (e) {
      logger.warn('[PerformanceMonitor] Long tasks not supported')
    }
  }

  // ==================== Resource Timing ====================

  private observePerformanceEntries(): void {
    if (!('PerformanceObserver' in window)) return

    try {
      this.resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming
          
          // Track slow resources (>1s)
          if (resource.duration > this.BUDGETS.resource) {
            const metric: ResourceMetric = {
              name: resource.name,
              duration: resource.duration,
              transferSize: resource.transferSize,
              initiatorType: resource.initiatorType,
              rating: resource.duration > 3000 ? 'poor' : 'needs-improvement'
            }
            
            this.slowResources.push(metric)
            
            analyticsSync.track('slow_resource', {
              name: resource.name,
              duration: resource.duration,
              transferSize: resource.transferSize,
              initiatorType: resource.initiatorType
            })
          }
        }
      })

      this.resourceObserver.observe({ entryTypes: ['resource'] })
    } catch (e) {
      logger.warn('[PerformanceMonitor] Resource timing not supported')
    }
  }

  // ==================== Navigation Timing ====================

  private measureNavigationTiming(): void {
    if (typeof window === 'undefined' || !window.performance) return

    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        if (navigation) {
          const metric: NavigationMetric = {
            type: navigation.type,
            duration: navigation.duration,
            dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
            connectTime: navigation.connectEnd - navigation.connectStart,
            ttfb: navigation.responseStart - navigation.startTime,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
            loadComplete: navigation.loadEventEnd - navigation.startTime
          }

          analyticsSync.track('navigation_timing', {
            ...metric,
            timestamp: Date.now()
          })
        }
      }, 0)
    })
  }

  private measureFirstPaint(): void {
    if (typeof window === 'undefined' || !window.performance) return

    window.addEventListener('load', () => {
      const paintEntries = window.performance.getEntriesByType('paint')
      const firstPaint = paintEntries.find(entry => entry.name === 'first-paint')
      
      if (firstPaint) {
        this.recordWebVital({
          name: 'FPL',
          value: firstPaint.startTime,
          rating: firstPaint.startTime < 1000 ? 'good' : firstPaint.startTime < 2000 ? 'needs-improvement' : 'poor',
          navigationType: this.getNavigationType()
        })
      }
    })
  }

  // ==================== User Timing API ====================

  markUserTiming(name: string, duration?: number): void {
    if (typeof window === 'undefined' || !window.performance) return

    const startTime = performance.now()
    
    if (duration !== undefined) {
      // Direct measurement
      const metric: UserTimingMetric = {
        name,
        duration,
        startTime
      }
      this.userTimings.push(metric)
      
      // Also mark in browser's User Timing API
      performance.mark(`${name}-end`)
    } else {
      // Start mark
      performance.mark(`${name}-start`)
    }
  }

  measureUserTiming(name: string): number | null {
    if (typeof window === 'undefined' || !window.performance) return null

    try {
      performance.mark(`${name}-end`)
      performance.measure(name, `${name}-start`, `${name}-end`)
      
      const entries = performance.getEntriesByName(name, 'measure')
      const lastEntry = entries[entries.length - 1]
      
      if (lastEntry) {
        const metric: UserTimingMetric = {
          name,
          duration: lastEntry.duration,
          startTime: lastEntry.startTime
        }
        this.userTimings.push(metric)
        
        // Track slow measurements
        if (lastEntry.duration > 100) {
          analyticsSync.track('slow_user_timing', {
            name,
            duration: lastEntry.duration,
            timestamp: Date.now()
          })
        }
        
        return lastEntry.duration
      }
    } catch (e) {
      logger.warn(`[PerformanceMonitor] Failed to measure ${name}:`, e)
    }
    return null
  }

  // ==================== Component Performance ====================

  measureComponentRender(componentName: string, renderStartTime: number): void {
    const duration = performance.now() - renderStartTime
    
    this.markUserTiming(`render-${componentName}`, duration)
    
    if (duration > 16) { // Frame budget
      analyticsSync.track('slow_component_render', {
        component: componentName,
        duration,
        timestamp: Date.now()
      })
    }
  }

  // ==================== ML Metrics ====================

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
    if (depth > maxSize * 0.5) {
      this.mlMetricsBuffer.push({
        name: 'prediction_queue_depth',
        value: depth,
        timestamp: Date.now()
      })
    }
  }

  // ==================== Circuit Breaker ====================

  trackCircuitBreaker(
    componentId: string,
    state: CircuitBreakerState,
    metrics: Omit<CircuitBreakerMetric, 'state'>
  ): void {
    this.circuitBreakerState.set(componentId, {
      state,
      ...metrics
    })

    analyticsSync.track('circuit_breaker', {
      componentId,
      state,
      failureCount: metrics.failureCount,
      successCount: metrics.successCount,
      timestamp: Date.now()
    })
  }

  // ==================== Error Tracking ====================

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

  // ==================== Performance Snapshot ====================

  takeSnapshot(): PerformanceSnapshot {
    const snapshot: PerformanceSnapshot = {
      timestamp: Date.now(),
      webVitals: this.getWebVitalsRecord(),
      resources: [...this.slowResources],
      userTimings: [...this.userTimings]
    }

    // Get navigation timing if available
    if (typeof window !== 'undefined' && window.performance) {
      const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      if (navigation) {
        snapshot.navigation = {
          type: navigation.type,
          duration: navigation.duration,
          dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
          connectTime: navigation.connectEnd - navigation.connectStart,
          ttfb: navigation.responseStart - navigation.startTime,
          domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
          loadComplete: navigation.loadEventEnd - navigation.startTime
        }
      }
    }

    this.snapshots.push(snapshot)
    
    // Keep only last 10 snapshots
    if (this.snapshots.length > 10) {
      this.snapshots.shift()
    }

    return snapshot
  }

  // ==================== Getters ====================

  getMetrics(): {
    webVitals: WebVitalMetric[]
    mlMetrics: MLMetric[]
    circuitBreakers: Map<string, CircuitBreakerMetric>
    slowResources: ResourceMetric[]
    userTimings: UserTimingMetric[]
    snapshots: PerformanceSnapshot[]
  } {
    return {
      webVitals: [...this.webVitalsBuffer],
      mlMetrics: [...this.mlMetricsBuffer],
      circuitBreakers: new Map(this.circuitBreakerState),
      slowResources: [...this.slowResources],
      userTimings: [...this.userTimings],
      snapshots: [...this.snapshots]
    }
  }

  getWebVitalsRecord(): Record<WebVitalName, WebVitalMetric | undefined> {
    const record: Partial<Record<WebVitalName, WebVitalMetric>> = {}
    
    for (const vital of this.webVitalsBuffer) {
      // Keep the latest value for each vital
      record[vital.name] = vital
    }
    
    return record as Record<WebVitalName, WebVitalMetric | undefined>
  }

  getINP(): number {
    return this.inpState.maxDuration
  }

  getCLS(): number {
    const clsVital = this.webVitalsBuffer.find(v => v.name === 'CLS')
    return clsVital?.value || 0
  }

  // ==================== Rating Functions ====================

  private getLCPRating(value: number): WebVitalMetric['rating'] {
    if (value <= 2500) return 'good'
    if (value <= 4000) return 'needs-improvement'
    return 'poor'
  }

  private getINPRating(value: number): WebVitalMetric['rating'] {
    if (value <= 200) return 'good'
    if (value <= 500) return 'needs-improvement'
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

  private getTBTRating(value: number): WebVitalMetric['rating'] {
    if (value <= 200) return 'good'
    if (value <= 600) return 'needs-improvement'
    return 'poor'
  }

  // ==================== Helpers ====================

  private getNavigationType(): string {
    if (typeof window === 'undefined' || !window.performance) return 'unknown'
    
    const navigation = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    return navigation?.type || 'unknown'
  }

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
      navigationType: metric.navigationType,
      timestamp: Date.now()
    })
  }

  private startFlushInterval(): void {
    this.flushInterval = window.setInterval(() => {
      this.flushMetrics()
    }, this.FLUSH_INTERVAL_MS)
  }

  private flushMetrics(): void {
    // Flush any buffered metrics
    if (this.webVitalsBuffer.length > 0) {
      analyticsSync.track('web_vitals_batch', {
        count: this.webVitalsBuffer.length,
        metrics: this.webVitalsBuffer.map(v => ({ name: v.name, value: v.value, rating: v.rating })),
        timestamp: Date.now()
      })
      this.webVitalsBuffer = []
    }
    
    if (this.mlMetricsBuffer.length > 0) {
      this.mlMetricsBuffer = []
    }
    
    if (this.userTimings.length > 50) {
      // Keep recent timings
      this.userTimings = this.userTimings.slice(-25)
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()
export default performanceMonitor

// Export types
export type {
  WebVitalMetric,
  MLMetric,
  CircuitBreakerMetric,
  ErrorMetric,
  ResourceMetric,
  NavigationMetric,
  UserTimingMetric,
  PerformanceSnapshot,
  WebVitalName
}
