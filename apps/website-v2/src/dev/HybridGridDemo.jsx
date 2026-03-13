/**
 * HybridGrid Demo - Week 1 Integration Test
 * 50 panels, 60fps target, automatic fallback detection
 */

import { useState, useEffect, useCallback } from 'react'
import { HybridGrid } from '../components/HybridGrid'
import { useDynamicStore } from '../store/dynamicStore'

// Generate 50 test panels
const generatePanels = () => {
  return Array.from({ length: 50 }, (_, i) => ({
    i: `panel-${i}`,
    x: 0,
    y: 0,
    w: 3,
    h: 4,
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 8,
    type: 'test',
    title: `Panel ${i + 1}`,
    hub: 'TENET',
    content: `Test content for panel ${i + 1}`,
    isMinimized: false,
    isMaximized: false,
  }))
}

export default function HybridGridDemo() {
  const [metrics, setMetrics] = useState({ renderTime: 0, visibleCount: 0, mode: 'worker' })
  const [isLoading, setIsLoading] = useState(true)
  const panels = useDynamicStore((state) => state.panels)
  const resetLayout = useDynamicStore((state) => state.resetLayout)

  // Initialize with 50 panels
  useEffect(() => {
    const initPanels = generatePanels()
    useDynamicStore.setState({ panels: initPanels })
    setIsLoading(false)
  }, [])

  const handleMetrics = useCallback((newMetrics) => {
    setMetrics(newMetrics)
  }, [])

  const handleError = useCallback((error) => {
    console.error('HybridGrid error:', error)
  }, [])

  const targetMet = metrics.renderTime > 0 && metrics.renderTime < 16
  const supportsWorker = typeof OffscreenCanvas !== 'undefined'

  if (isLoading) {
    return <div style={{ padding: 20 }}>Loading 50 panels...</div>
  }

  return (
    <div style={{ padding: 20, maxWidth: 1000, margin: '0 auto' }}>
      <h1 style={{ marginBottom: 16 }}>Week 1 Integration: HybridGrid</h1>
      
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(4, 1fr)', 
        gap: 16, 
        marginBottom: 16,
        padding: 16,
        background: 'rgba(30, 30, 40, 0.5)',
        borderRadius: 8,
        fontSize: 14,
      }}>
        <div>
          <div style={{ color: '#9ca3af', fontSize: 12 }}>Render Mode</div>
          <div style={{ color: metrics.mode === 'worker' ? '#4ade80' : '#fbbf24', fontWeight: 'bold' }}>
            {supportsWorker ? '⚡ Worker' : '🌐 DOM'}
          </div>
          <div style={{ color: '#6b7280', fontSize: 11 }}>
            {supportsWorker ? 'OffscreenCanvas supported' : 'Using DOM fallback'}
          </div>
        </div>
        
        <div>
          <div style={{ color: '#9ca3af', fontSize: 12 }}>Frame Time</div>
          <div style={{ color: targetMet ? '#4ade80' : '#fbbf24', fontWeight: 'bold' }}>
            {metrics.renderTime.toFixed(2)}ms
          </div>
          <div style={{ color: '#6b7280', fontSize: 11 }}>
            Target: &lt;16ms (60fps)
          </div>
        </div>
        
        <div>
          <div style={{ color: '#9ca3af', fontSize: 12 }}>Visible Panels</div>
          <div style={{ color: '#a78bfa', fontWeight: 'bold' }}>
            {metrics.visibleCount}
          </div>
          <div style={{ color: '#6b7280', fontSize: 11 }}>
            of 50 total panels
          </div>
        </div>
        
        <div>
          <div style={{ color: '#9ca3af', fontSize: 12 }}>Status</div>
          <div style={{ color: targetMet ? '#4ade80' : '#fbbf24', fontWeight: 'bold' }}>
            {targetMet ? '✓ PASS' : 'Testing...'}
          </div>
          <div style={{ color: '#6b7280', fontSize: 11 }}>
            {targetMet ? '60fps achieved' : 'Measure in progress'}
          </div>
        </div>
      </div>

      <HybridGrid
        rowHeight={100}
        overscan={5}
        onPerformanceMetrics={handleMetrics}
        onError={handleError}
      />

      <div style={{ marginTop: 16, color: '#6b7280', fontSize: 12 }}>
        <p>Scroll the grid above. The component automatically detects browser capabilities:</p>
        <ul style={{ marginLeft: 20, marginTop: 8 }}>
          <li>Chrome/Edge/Firefox: Uses Web Worker + OffscreenCanvas</li>
          <li>Safari &lt;16.4: Falls back to DOM rendering</li>
        </ul>
      </div>
    </div>
  )
}
