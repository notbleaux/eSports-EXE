/** [Ver001.000]
 * Performance Module
 * Exports performance monitoring utilities and dashboard
 * 
 * Includes:
 * - FPSMonitor: RAF-based FPS calculation with drop detection
 * - MemoryMonitor: Memory API wrapper with heap tracking
 * - usePerformance: React hook for component/interaction tracking
 * - webVitals: Core Web Vitals tracking (LCP, FID, CLS, FCP, TTFB, INP)
 * - PerformanceDashboard: Dev-only real-time metrics overlay
 * 
 * [Ver001.000]
 */

// Monitors
export { FPSMonitor, getGlobalFPSMonitor, disposeGlobalFPSMonitor } from './FPSMonitor'
export { MemoryMonitor, getGlobalMemoryMonitor, disposeGlobalMemoryMonitor } from './MemoryMonitor'

// Web Vitals
export { createWebVitalsReporter, initWebVitals, WEB_VITALS_THRESHOLDS } from './webVitals'
export type { WebVitalName, WebVitalRating, WebVitalEntry } from './webVitals'

// Legacy exports (for backward compatibility)
export { PerformanceDashboard } from './PerformanceDashboard'
export { default as withPerformanceTracking } from './withPerformanceTracking'
export { usePerformanceMetric } from './usePerformanceMetric'

// Hooks (re-exported from hooks/)
export { usePerformance, useRenderCount, useMountTiming } from '../hooks/usePerformance'

// Components (re-exported from components/performance/)
export { PerformanceDashboard as PerformanceOverlay } from '../components/performance/PerformanceDashboard'
