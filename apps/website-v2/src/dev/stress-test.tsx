/**
 * Stress Test - Virtual Scroll Stress Testing Component
 * [Ver001.000]
 */

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

interface StressTestProps {
  rowCount?: number
  scrollEventsPerSecond?: number
  onComplete?: (results: StressResults) => void
}

export interface StressResults {
  totalScrolls: number
  averageFps: number
  minFps: number
  maxFps: number
  droppedFrames: number
  memoryGrowth: number
  duration: number
  passed: boolean
}

const GAP = 4
const ROW_HEIGHT = 100
const COLS = 2

export const StressTest: React.FC<StressTestProps> = ({
  rowCount = 10000,
  scrollEventsPerSecond = 100,
  onComplete,
}) => {
  const parentRef = useRef<HTMLDivElement>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)
  const [results, setResults] = useState<StressResults | null>(null)
  
  const fpsRef = useRef<number[]>([])
  const scrollCountRef = useRef(0)
  const startTimeRef = useRef(0)
  const memoryStartRef = useRef(0)
  const animationRef = useRef<number>()

  // Generate 10k panel data
  const panels = useRef(
    Array.from({ length: rowCount }, (_, i) => ({
      id: `stress-panel-${i}`,
      title: `Panel ${i + 1}`,
      content: `Row ${Math.floor(i / COLS) + 1}, Col ${(i % COLS) + 1}`,
    }))
  ).current

  const virtualizer = useVirtualizer({
    count: Math.ceil(rowCount / COLS),
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => ROW_HEIGHT, []),
    overscan: 5,
  })

  const runStressTest = useCallback(() => {
    if (!parentRef.current) return
    
    setIsRunning(true)
    setResults(null)
    fpsRef.current = []
    scrollCountRef.current = 0
    startTimeRef.current = performance.now()
    memoryStartRef.current = (performance as any).memory?.usedJSHeapSize || 0
    
    const container = parentRef.current
    const maxScroll = container.scrollHeight - container.clientHeight
    const duration = 5000 // 5 seconds
    const scrollInterval = 1000 / scrollEventsPerSecond
    
    let lastTime = performance.now()
    let frameCount = 0
    
    const animate = (time: number) => {
      const elapsed = time - startTimeRef.current
      
      if (elapsed < duration) {
        // Calculate FPS
        frameCount++
        if (time - lastTime >= 1000) {
          fpsRef.current.push(frameCount)
          frameCount = 0
          lastTime = time
        }
        
        // Rapid scroll
        const scrollPos = (elapsed / duration) * maxScroll
        container.scrollTop = scrollPos + Math.sin(elapsed / 100) * 100 // Add jitter
        scrollCountRef.current++
        
        setProgress(Math.round((elapsed / duration) * 100))
        animationRef.current = requestAnimationFrame(animate)
      } else {
        // Complete
        const memoryEnd = (performance as any).memory?.usedJSHeapSize || 0
        const avgFps = fpsRef.current.reduce((a, b) => a + b, 0) / fpsRef.current.length
        const minFps = Math.min(...fpsRef.current)
        const maxFps = Math.max(...fpsRef.current)
        const expectedFrames = (duration / 1000) * 60
        const actualFrames = fpsRef.current.reduce((a, b) => a + b, 0)
        
        const testResults: StressResults = {
          totalScrolls: scrollCountRef.current,
          averageFps: Math.round(avgFps),
          minFps,
          maxFps,
          droppedFrames: Math.max(0, expectedFrames - actualFrames),
          memoryGrowth: memoryEnd - memoryStartRef.current,
          duration,
          passed: avgFps > 30 && minFps > 15,
        }
        
        setResults(testResults)
        setIsRunning(false)
        onComplete?.(testResults)
        
        console.log('[StressTest] Complete:', testResults)
      }
    }
    
    animationRef.current = requestAnimationFrame(animate)
  }, [onComplete, scrollEventsPerSecond])

  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const virtualItems = virtualizer.getVirtualItems()
  const totalHeight = virtualizer.getTotalSize()

  return (
    <div className="stress-test" style={{ padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <h3>Virtual Scroll Stress Test</h3>
        <p style={{ fontSize: 12, color: '#6b7280' }}>
          Dataset: {rowCount.toLocaleString()} rows | 
          Target: {scrollEventsPerSecond} scrolls/sec |
          Duration: 5s
        </p>
      </div>

      {/* Controls */}
      <div style={{ marginBottom: 16 }}>
        <button
          onClick={runStressTest}
          disabled={isRunning}
          style={{
            padding: '8px 16px',
            background: isRunning ? '#374151' : '#7c3aed',
            color: 'white',
            border: 'none',
            borderRadius: 6,
            cursor: isRunning ? 'not-allowed' : 'pointer',
          }}
        >
          {isRunning ? `Running... ${progress}%` : 'Start Stress Test'}
        </button>
      </div>

      {/* Results */}
      {results && (
        <div style={{
          marginBottom: 16,
          padding: 12,
          background: results.passed ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
          border: `1px solid ${results.passed ? '#22c55e' : '#ef4444'}`,
          borderRadius: 6,
        }}>
          <div style={{ fontWeight: 'bold', color: results.passed ? '#22c55e' : '#ef4444' }}>
            {results.passed ? '✓ PASSED' : '✗ FAILED'}
          </div>
          <div style={{ fontSize: 12, marginTop: 8, fontFamily: 'monospace' }}>
            <div>Avg FPS: {results.averageFps}</div>
            <div>Min FPS: {results.minFps}</div>
            <div>Max FPS: {results.maxFps}</div>
            <div>Scrolls: {results.totalScrolls}</div>
            <div>Dropped: {results.droppedFrames}</div>
            <div>Memory: {(results.memoryGrowth / 1024 / 1024).toFixed(2)}MB</div>
          </div>
        </div>
      )}

      {/* Virtual Grid */}
      <div
        ref={parentRef}
        style={{
          height: '300px',
          overflow: 'auto',
          border: '1px solid rgba(157, 78, 221, 0.3)',
          borderRadius: 8,
          background: '#0a0a0f',
        }}
      >
        <div style={{ height: `${totalHeight}px`, position: 'relative' }}>
          {virtualItems.map((virtualRow) => {
            const rowIndex = virtualRow.index
            return (
              <div
                key={rowIndex}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: GAP,
                  padding: GAP,
                }}
              >
                {[0, 1].map((col) => {
                  const panelIndex = rowIndex * COLS + col
                  if (panelIndex >= panels.length) return null
                  const panel = panels[panelIndex]
                  
                  return (
                    <div
                      key={panel.id}
                      style={{
                        background: 'rgba(30, 30, 40, 0.8)',
                        border: '1px solid rgba(157, 78, 221, 0.4)',
                        borderRadius: 4,
                        padding: 8,
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 'bold', color: '#fff' }}>
                        {panel.title}
                      </div>
                      <div style={{ fontSize: 10, color: 'rgba(200,200,220,0.6)' }}>
                        {panel.content}
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default StressTest
