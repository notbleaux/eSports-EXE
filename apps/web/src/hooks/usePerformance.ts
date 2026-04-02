/** [Ver001.000]
 * usePerformance Hook
 * React hook for tracking component render times and measuring interaction latency
 * 
 * Usage:
 *   const { trackRender, trackInteraction, metrics } = usePerformance('ComponentName')
 *   
 *   // Track render time
 *   useEffect(() => {
 *     trackRender()
 *   })
 *   
 *   // Track interaction
 *   const handleClick = () => {
 *     trackInteraction('click', 'button', () => {
 *       // Your handler
 *     })
 *   }
 */

// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from 'react'
import { createLogger } from '@/utils/logger'
import type { RenderMetrics, InteractionMetrics, PerformanceConfig, PerformanceAlert } from '../types/performance'
import { DEFAULT_PERFORMANCE_CONFIG } from '../types/performance'

const logger = createLogger('usePerformance')

/** Performance metrics state */
interface PerformanceState {
  renderCount: number
  totalRenderTime: number
  lastRenderTime: number
  interactions: InteractionMetrics[]
}

/** usePerformance options */
interface UsePerformanceOptions {
  /** Component name for tracking */
  componentName: string
  /** Performance configuration */
  config?: Partial<PerformanceConfig>
  /** Callback when performance alert triggers */
  onAlert?: (alert: PerformanceAlert) => void
  /** Callback when metrics are reported */
  onMetrics?: (type: 'render' | 'interaction', metrics: RenderMetrics | InteractionMetrics) => void
  /** Whether to track initial render */
  trackInitialRender?: boolean
}

/** usePerformance return type */
interface UsePerformanceReturn {
  /** Track a component render */
  trackRender: (changedProps?: string[]) => void
  /** Track a user interaction */
  trackInteraction: <T>(
    type: InteractionMetrics['type'],
    target: string,
    handler: () => T
  ) => T
  /** Measure async operation */
  measureAsync: <T>(
    name: string,
    operation: () => Promise<T>
  ) => Promise<T>
  /** Get current metrics */
  metrics: {
    renderCount: number
    averageRenderTime: number
    lastRenderTime: number
    interactionCount: number
  }
  /** Clear metrics history */
  clearMetrics: () => void
}

export function usePerformance({
  componentName,
  config: userConfig,
  onAlert,
  onMetrics,
  trackInitialRender = true,
}: UsePerformanceOptions): UsePerformanceReturn {
  const config = { ...DEFAULT_PERFORMANCE_CONFIG, ...userConfig }
  const state = useRef<PerformanceState>({
    renderCount: 0,
    totalRenderTime: 0,
    lastRenderTime: 0,
    interactions: [],
  })
  const renderStartTime = useRef<number>(0)
  const isInitialRender = useRef(true)

  const [renderTrigger, setRenderTrigger] = useState(0)

  // Start timing on each render
  renderStartTime.current = performance.now()

  // Track render completion
  useEffect(() => {
    const endTime = performance.now()
    const renderTime = endTime - renderStartTime.current

    // Skip initial render if not tracking
    if (isInitialRender.current && !trackInitialRender) {
      isInitialRender.current = false
      return
    }

    isInitialRender.current = false

    // Update state
    state.current.renderCount++
    state.current.totalRenderTime += renderTime
    state.current.lastRenderTime = renderTime

    // Report metrics
    const renderMetrics: RenderMetrics = {
      componentName,
      renderTime,
      renderCount: state.current.renderCount,
      timestamp: endTime,
    }

    onMetrics?.('render', renderMetrics)

    // Check for slow render
    if (renderTime > 16.67 && onAlert) { // Longer than one frame (60fps)
      const alert: PerformanceAlert = {
        type: 'interaction',
        level: renderTime > 50 ? 'high' : 'medium',
        message: `Slow render in ${componentName}: ${renderTime.toFixed(2)}ms`,
        value: renderTime,
        threshold: 16.67,
        timestamp: endTime,
      }
      onAlert(alert)
    }

    // Trigger state update for metrics display
    setRenderTrigger((prev) => prev + 1)
  }, [componentName, trackInitialRender, onAlert, onMetrics])

  /** Track a render explicitly (for custom tracking) */
  const trackRender = useCallback(
    (changedProps?: string[]) => {
      const endTime = performance.now()
      const renderTime = endTime - renderStartTime.current

      state.current.renderCount++
      state.current.totalRenderTime += renderTime
      state.current.lastRenderTime = renderTime

      const renderMetrics: RenderMetrics = {
        componentName,
        renderTime,
        renderCount: state.current.renderCount,
        changedProps,
        timestamp: endTime,
      }

      onMetrics?.('render', renderMetrics)
      setRenderTrigger((prev) => prev + 1)
    },
    [componentName, onMetrics]
  )

  /** Track a user interaction */
  const trackInteraction = useCallback(
    <T>(type: InteractionMetrics['type'], target: string, handler: () => T): T => {
      const startTime = performance.now()
      let result: T
      let error: Error | null = null

      try {
        result = handler()
      } catch (e) {
        error = e as Error
        throw e
      } finally {
        const endTime = performance.now()
        const latency = endTime - startTime

        const interactionMetrics: InteractionMetrics = {
          type,
          target,
          latency,
          smooth: latency < config.interactionWarningThreshold,
          component: componentName,
          timestamp: endTime,
        }

        state.current.interactions.push(interactionMetrics)

        // Keep last 50 interactions
        if (state.current.interactions.length > 50) {
          state.current.interactions.shift()
        }

        onMetrics?.('interaction', interactionMetrics)

        // Check for slow interaction
        if (latency > config.interactionWarningThreshold && onAlert) {
          const alert: PerformanceAlert = {
            type: 'interaction',
            level: latency > config.interactionWarningThreshold * 2 ? 'high' : 'medium',
            message: `Slow ${type} interaction on ${target}: ${latency.toFixed(2)}ms`,
            value: latency,
            threshold: config.interactionWarningThreshold,
            timestamp: endTime,
          }
          onAlert(alert)
        }

        setRenderTrigger((prev) => prev + 1)
      }

      return result!
    },
    [componentName, config.interactionWarningThreshold, onAlert, onMetrics]
  )

  /** Measure async operation */
  const measureAsync = useCallback(
    async <T>(name: string, operation: () => Promise<T>): Promise<T> => {
      const startTime = performance.now()

      try {
        const result = await operation()
        const endTime = performance.now()
        const duration = endTime - startTime

        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
        }

        return result
      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime

        logger.error(`${name} failed`, {
          duration: `${duration.toFixed(2)}ms`,
          error: error instanceof Error ? error.message : String(error),
        })

        throw error
      }
    },
    []
  )

  /** Clear metrics history */
  const clearMetrics = useCallback(() => {
    state.current = {
      renderCount: 0,
      totalRenderTime: 0,
      lastRenderTime: 0,
      interactions: [],
    }
    setRenderTrigger((prev) => prev + 1)
  }, [])

  // Calculate derived metrics
  const metrics = {
    renderCount: state.current.renderCount,
    averageRenderTime:
      state.current.renderCount > 0
        ? state.current.totalRenderTime / state.current.renderCount
        : 0,
    lastRenderTime: state.current.lastRenderTime,
    interactionCount: state.current.interactions.length,
  }

  // Trigger re-render for metrics updates
  // eslint-disable-next-line @typescript-eslint/no-unused-expressions
  renderTrigger

  return {
    trackRender,
    trackInteraction,
    measureAsync,
    metrics,
    clearMetrics,
  }
}

/** Hook to track render count (simple version) */
export function useRenderCount(componentName: string): number {
  const count = useRef(0)
  count.current++

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[${componentName}] Render count:`, count.current)
    }
  })

  return count.current
}

/** Hook to measure mount/unmount timing */
export function useMountTiming(componentName: string): void {
  const mountTime = useRef<number>(0)

  useEffect(() => {
    mountTime.current = performance.now()

    return () => {
      const unmountTime = performance.now()
      const lifetime = unmountTime - mountTime.current

      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.log(`[${componentName}] Lifetime: ${lifetime.toFixed(2)}ms`)
      }
    }
  }, [componentName])
}

export default usePerformance
