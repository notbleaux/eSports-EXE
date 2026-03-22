/** [Ver001.000]
 * Performance Dashboard
 * Development-only overlay for real-time metrics display
 * 
 * Shows: FPS, Memory, Web Vitals, API timing
 * Features: Drag to reposition, Export data, Configurable thresholds
 * 
 * Usage:
 *   import { PerformanceDashboard } from './performance'
 *   
 *   // In your app (dev only):
 *   {process.env.NODE_ENV === 'development' && <PerformanceDashboard />}
 */

import React, { useEffect, useRef, useState, useCallback } from 'react'
import type {
  FPSMetrics,
  MemoryMetrics,
  WebVitalsMetrics,
  PerformanceConfig,
  PerformanceSnapshot,
} from '../../types/performance'
import { DEFAULT_PERFORMANCE_CONFIG } from '../../types/performance'
import { FPSMonitor, getGlobalFPSMonitor } from '../../performance/FPSMonitor'
import { MemoryMonitor, getGlobalMemoryMonitor } from '../../performance/MemoryMonitor'
import { createWebVitalsReporter } from '../../performance/webVitals'

/** Dashboard position */
interface Position {
  x: number
  y: number
}

/** Dashboard props */
interface PerformanceDashboardProps {
  /** Initial position */
  initialPosition?: Position
  /** Performance configuration */
  config?: Partial<PerformanceConfig>
  /** Whether dashboard is initially collapsed */
  initiallyCollapsed?: boolean
}

/** Metric card component */
const MetricCard: React.FC<{
  title: string
  value: string | number
  unit?: string
  status: 'good' | 'warning' | 'error'
  subtitle?: string
}> = ({ title, value, unit, status, subtitle }) => {
  const statusColors = {
    good: 'bg-green-500/20 border-green-500/50 text-green-400',
    warning: 'bg-yellow-500/20 border-yellow-500/50 text-yellow-400',
    error: 'bg-red-500/20 border-red-500/50 text-red-400',
  }

  return (
    <div className={`p-3 rounded border ${statusColors[status]} min-w-[120px]`}>
      <div className="text-xs opacity-70 uppercase tracking-wider">{title}</div>
      <div className="text-2xl font-bold">
        {value}
        {unit && <span className="text-sm ml-1">{unit}</span>}
      </div>
      {subtitle && <div className="text-xs opacity-60">{subtitle}</div>}
    </div>
  )
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  initialPosition = { x: typeof window !== 'undefined' ? window.innerWidth - 320 : 0, y: 20 },
  config: userConfig,
  initiallyCollapsed = false,
}) => {
  const config = { ...DEFAULT_PERFORMANCE_CONFIG, ...userConfig }
  const [position, setPosition] = useState<Position>(initialPosition)
  const [isCollapsed, setIsCollapsed] = useState(initiallyCollapsed)
  const [isDragging, setIsDragging] = useState(false)
  const [fps, setFps] = useState<FPSMetrics | null>(null)
  const [memory, setMemory] = useState<MemoryMetrics | null>(null)
  const [webVitals, setWebVitals] = useState<WebVitalsMetrics | null>(null)
  const [snapshots, setSnapshots] = useState<PerformanceSnapshot[]>([])

  const dragRef = useRef<{ startX: number; startY: number; initialX: number; initialY: number } | null>(null)
  const dashboardRef = useRef<HTMLDivElement>(null)
  const fpsMonitorRef = useRef<FPSMonitor | null>(null)
  const memoryMonitorRef = useRef<MemoryMonitor | null>(null)

  // Initialize monitors
  useEffect(() => {
    if (typeof window === 'undefined') return

    // FPS Monitor
    fpsMonitorRef.current = getGlobalFPSMonitor(config, undefined, setFps)
    if (config.enableFPS) {
      fpsMonitorRef.current.start()
    }

    // Memory Monitor
    memoryMonitorRef.current = getGlobalMemoryMonitor(config, undefined, setMemory)
    if (config.enableMemory && MemoryMonitor.isSupported()) {
      memoryMonitorRef.current.start(2000)
    }

    // Web Vitals
    if (config.enableWebVitals) {
      const webVitalsReporter = createWebVitalsReporter(config, () => {
        setWebVitals(webVitalsReporter.getMetrics())
      })
      webVitalsReporter.start()

      return () => {
        webVitalsReporter.stop()
      }
    }
  }, [config])

  // Collect snapshots
  useEffect(() => {
    const interval = setInterval(() => {
      const snapshot: PerformanceSnapshot = {
        fps: fps || undefined,
        memory: memory || undefined,
        webVitals: webVitals || undefined,
        timestamp: performance.now(),
        sessionId: 'dev-session',
      }

      setSnapshots((prev) => {
        const updated = [...prev, snapshot]
        return updated.slice(-100) // Keep last 100 snapshots
      })
    }, 5000)

    return () => clearInterval(interval)
  }, [fps, memory, webVitals])

  // Drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.no-drag')) return

    setIsDragging(true)
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialX: position.x,
      initialY: position.y,
    }
  }, [position])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !dragRef.current) return

    const dx = e.clientX - dragRef.current.startX
    const dy = e.clientY - dragRef.current.startY

    setPosition({
      x: Math.max(0, Math.min(window.innerWidth - 300, dragRef.current.initialX + dx)),
      y: Math.max(0, Math.min(window.innerHeight - 200, dragRef.current.initialY + dy)),
    })
  }, [isDragging])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
    dragRef.current = null
  }, [])

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
      return () => {
        window.removeEventListener('mousemove', handleMouseMove)
        window.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, handleMouseMove, handleMouseUp])

  // Export data
  const exportData = useCallback(() => {
    const data = {
      snapshots,
      summary: {
        avgFps: snapshots.reduce((acc, s) => acc + (s.fps?.average || 0), 0) / snapshots.length,
        avgMemory: snapshots.reduce((acc, s) => acc + (s.memory?.used || 0), 0) / snapshots.length,
        webVitals,
      },
      exportedAt: new Date().toISOString(),
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `performance-data-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [snapshots, webVitals])

  // Reset monitors
  const resetMonitors = useCallback(() => {
    fpsMonitorRef.current?.reset()
    memoryMonitorRef.current?.clearHistory()
    setSnapshots([])
  }, [])

  // Calculate status
  const getFpsStatus = (avg: number): 'good' | 'warning' | 'error' => {
    if (avg >= 55) return 'good'
    if (avg >= 30) return 'warning'
    return 'error'
  }

  const getMemoryStatus = (used: number): 'good' | 'warning' | 'error' => {
    if (used < config.memoryWarningThreshold) return 'good'
    if (used < config.memoryWarningThreshold * 1.5) return 'warning'
    return 'error'
  }

  // Only render in development
  if (process.env.NODE_ENV !== 'development') {
    return null
  }

  return (
    <div
      ref={dashboardRef}
      className={`fixed z-[9999] bg-slate-900/95 backdrop-blur text-white rounded-lg shadow-2xl border border-slate-700 overflow-hidden transition-opacity ${
        isDragging ? 'cursor-grabbing opacity-90' : 'cursor-grab'
      }`}
      style={{ left: position.x, top: position.y, width: isCollapsed ? 'auto' : 300 }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="bg-slate-800 px-4 py-2 flex items-center justify-between border-b border-slate-700">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${fps && fps.average >= 55 ? 'bg-green-500' : fps && fps.average >= 30 ? 'bg-yellow-500' : 'bg-red-500'}`} />
          <span className="text-sm font-semibold">Performance</span>
        </div>
        <div className="flex items-center gap-1 no-drag">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 hover:bg-slate-700 rounded text-xs"
          >
            {isCollapsed ? '□' : '−'}
          </button>
        </div>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="p-4 space-y-4 no-drag">
          {/* FPS Section */}
          {config.enableFPS && fps && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase">FPS</h3>
              <div className="grid grid-cols-2 gap-2">
                <MetricCard
                  title="Current"
                  value={fps.current.toFixed(1)}
                  status={getFpsStatus(fps.current)}
                />
                <MetricCard
                  title="Average"
                  value={fps.average.toFixed(1)}
                  status={getFpsStatus(fps.average)}
                />
              </div>
              <div className="text-xs text-slate-500">
                Min: {fps.min.toFixed(1)} | Max: {fps.max.toFixed(1)} | Drops: {fps.drops}
              </div>
            </div>
          )}

          {/* Memory Section */}
          {config.enableMemory && memory && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase">Memory</h3>
              <MetricCard
                title="Heap Used"
                value={memory.used.toFixed(1)}
                unit="MB"
                status={getMemoryStatus(memory.used)}
                subtitle={`${memory.percentUsed.toFixed(1)}% of ${memory.limit.toFixed(0)}MB`}
              />
            </div>
          )}

          {/* Web Vitals Section */}
          {config.enableWebVitals && webVitals && (
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-slate-400 uppercase">Web Vitals</h3>
              <div className="grid grid-cols-3 gap-2 text-center">
                {webVitals.lcp && (
                  <div className="bg-slate-800 rounded p-2">
                    <div className="text-xs text-slate-500">LCP</div>
                    <div className={`font-mono ${webVitals.lcp < 2500 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {(webVitals.lcp / 1000).toFixed(2)}s
                    </div>
                  </div>
                )}
                {webVitals.fid && (
                  <div className="bg-slate-800 rounded p-2">
                    <div className="text-xs text-slate-500">FID</div>
                    <div className={`font-mono ${webVitals.fid < 100 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {webVitals.fid.toFixed(0)}ms
                    </div>
                  </div>
                )}
                {webVitals.cls !== undefined && (
                  <div className="bg-slate-800 rounded p-2">
                    <div className="text-xs text-slate-500">CLS</div>
                    <div className={`font-mono ${webVitals.cls < 0.1 ? 'text-green-400' : 'text-yellow-400'}`}>
                      {webVitals.cls.toFixed(3)}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t border-slate-700">
            <button
              onClick={exportData}
              className="flex-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded text-xs font-medium transition-colors"
            >
              Export Data
            </button>
            <button
              onClick={resetMonitors}
              className="flex-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded text-xs font-medium transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default PerformanceDashboard
