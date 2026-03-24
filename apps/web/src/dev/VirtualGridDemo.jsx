/**
 * VirtualGrid Demo - 50 Panel Performance Test
 * Verifies 60fps with windowed rendering
 */

import { useState, useCallback, useMemo } from 'react'
import { VirtualGrid } from '../components/VirtualGrid'

// Generate 50 test panels
const generatePanels = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `panel-${i}`,
    title: `Panel ${i + 1}`,
    content: `Content for panel ${i + 1}`,
  }))
}

export default function VirtualGridDemo() {
  const panels = useMemo(() => generatePanels(50), [])
  const [metrics, setMetrics] = useState({ renderTime: 0, visibleCount: 0 })
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 })
  const [scrollCount, setScrollCount] = useState(0)

  const handleMetrics = useCallback((newMetrics) => {
    setMetrics(newMetrics)
  }, [])

  const handleRangeChange = useCallback((start, end) => {
    setVisibleRange({ start, end })
    setScrollCount((c) => c + 1)
  }, [])

  const targetMet = metrics.renderTime > 0 && metrics.renderTime < 16

  return (
    <div className="p-6 space-y-4 max-w-4xl mx-auto">
      <h1 className="text-xl font-bold">VirtualGrid Performance Test (50 Panels)</h1>

      <div className="grid grid-cols-4 gap-4 p-4 bg-slate-900/50 rounded-lg text-sm">
        <div>
          <div className="text-slate-500 text-xs uppercase">Render Time</div>
          <div className={`text-xl font-mono ${targetMet ? 'text-green-400' : 'text-yellow-400'}`}>
            {metrics.renderTime.toFixed(2)}ms
          </div>
          <div className="text-xs text-slate-600">Target: &lt;16ms</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs uppercase">Visible</div>
          <div className="text-xl font-mono text-purple-400">{metrics.visibleCount}</div>
          <div className="text-xs text-slate-600">of 50 panels</div>
        </div>
        <div>
          <div className="text-slate-500 text-xs uppercase">Range</div>
          <div className="text-lg font-mono text-blue-400">
            {visibleRange.start}-{visibleRange.end}
          </div>
        </div>
        <div>
          <div className="text-slate-500 text-xs uppercase">Status</div>
          <div className={`text-lg font-semibold ${targetMet ? 'text-green-400' : 'text-slate-400'}`}>
            {targetMet ? '✓ PASS' : 'Waiting...'}
          </div>
        </div>
      </div>

      <VirtualGrid
        panels={panels}
        rowHeight={100}
        overscan={5}
        onVisibleRangeChange={handleRangeChange}
        onPerformanceMetrics={handleMetrics}
      />

      <p className="text-xs text-slate-500">
        Scroll the grid above. Only visible panels are rendered to the canvas via the worker.
      </p>
    </div>
  )
}
