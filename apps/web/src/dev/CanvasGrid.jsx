/**
 * CanvasGrid - Web Worker Powered Grid Component
 * Proof of concept for OffscreenCanvas + Web Worker rendering
 */

import { useEffect, useRef, useState } from 'react'
import { useGridWorker } from '../workers/useGridWorker'

export function CanvasGrid() {
  const canvasRef = useRef(null)
  const [panelCount, setPanelCount] = useState(4)
  const [renderStats, setRenderStats] = useState(null)
  const [logs, setLogs] = useState([])

  const addLog = (message) => {
    setLogs((prev) => [...prev.slice(-4), `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  const { isReady, isSupported, error, init, render, resize, clear, destroy } = useGridWorker({
    onError: (err) => addLog(`Error: ${err}`),
    onRenderComplete: (count, time) => {
      setRenderStats({ count, time: time.toFixed(2) })
      addLog(`Rendered ${count} panels in ${time.toFixed(2)}ms`)
    },
  })

  // Initialize canvas on mount
  useEffect(() => {
    if (!canvasRef.current || !isReady) return

    const canvas = canvasRef.current
    const dpr = window.devicePixelRatio || 1
    const rect = canvas.getBoundingClientRect()

    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr

    init(canvas, rect.width * dpr, rect.height * dpr)
      .then(() => addLog('Canvas initialized in worker'))
      .catch((err) => addLog(`Init failed: ${err.message}`))

    return () => destroy()
  }, [isReady])

  // Generate panels using worker layout algorithm (sync version)
  const generatePanels = (count) => {
    const canvas = canvasRef.current
    if (!canvas) return []

    // Use same algorithm as worker for consistency
    const cols = Math.ceil(Math.sqrt(count * (canvas.width / canvas.height)))
    const rows = Math.ceil(count / cols)
    const padding = 16

    const availableWidth = canvas.width - padding * (cols + 1)
    const availableHeight = canvas.height - padding * (rows + 1)
    const cellWidth = Math.floor(availableWidth / cols)
    const cellHeight = Math.floor(availableHeight / rows)

    return Array.from({ length: count }, (_, i) => {
      const col = i % cols
      const row = Math.floor(i / cols)

      return {
        id: `panel-${i}`,
        x: padding + col * (cellWidth + padding),
        y: padding + row * (cellHeight + padding),
        width: cellWidth,
        height: cellHeight,
        title: `Panel ${i + 1}`,
        content: `Grid ${cols}×${rows} • Cell ${cellWidth}×${cellHeight}`,
      }
    })
  }

  const handleRender = () => {
    const panels = generatePanels(panelCount)
    render(panels).catch((err) => addLog(`Render error: ${err}`))
  }

  const handleClear = () => {
    clear().then(() => addLog('Canvas cleared'))
  }

  if (!isSupported) {
    return (
      <div className="p-6 rounded-lg bg-red-900/20 border border-red-500/50">
        <h3 className="text-red-400 font-semibold mb-2">Web Worker Not Supported</h3>
        <p className="text-red-300/70 text-sm">
          Your browser does not support OffscreenCanvas or Web Workers.
          Please use Chrome 69+, Firefox 105+, or Edge 79+.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 p-4 rounded-lg bg-slate-900/50 border border-slate-700/50">
        <div className="flex items-center gap-2">
          <label className="text-sm text-slate-400">Panels:</label>
          <input
            type="range"
            min="1"
            max="50"
            value={panelCount}
            onChange={(e) => setPanelCount(Number(e.target.value))}
            className="w-32 accent-purple-500"
          />
          <span className="text-sm font-mono text-purple-400 w-8">{panelCount}</span>
        </div>

        <button
          onClick={handleRender}
          disabled={!isReady}
          className="px-4 py-2 rounded bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium transition-colors"
        >
          Render
        </button>

        <button
          onClick={handleClear}
          disabled={!isReady}
          className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 disabled:text-slate-500 text-white text-sm font-medium transition-colors"
        >
          Clear
        </button>

        <div className="flex items-center gap-2 ml-auto">
          <div className={`w-2 h-2 rounded-full ${isReady ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span className="text-xs text-slate-400">{isReady ? 'Worker Ready' : 'Loading...'}</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-lg overflow-hidden border border-slate-700/50 bg-slate-900/50">
        <canvas
          ref={canvasRef}
          className="w-full h-[400px] block"
          style={{ imageRendering: 'crisp-edges' }}
        />

        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/20">
            <div className="text-red-400 text-center p-4">
              <p className="font-semibold">Worker Error</p>
              <p className="text-sm text-red-300/70">{error}</p>
            </div>
          </div>
        )}
      </div>

      {/* Stats & Logs */}
      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-700/30">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Render Stats
          </h4>
          {renderStats ? (
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Panels:</span>
                <span className="text-purple-400 font-mono">{renderStats.count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Time:</span>
                <span className="text-green-400 font-mono">{renderStats.time}ms</span>
              </div>
            </div>
          ) : (
            <p className="text-slate-600 text-sm italic">No render yet</p>
          )}
        </div>

        <div className="p-4 rounded-lg bg-slate-900/30 border border-slate-700/30">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Worker Logs
          </h4>
          <div className="space-y-0.5 text-xs font-mono">
            {logs.length > 0 ? (
              logs.map((log, i) => (
                <div key={i} className="text-slate-400 truncate">
                  {log}
                </div>
              ))
            ) : (
              <p className="text-slate-600 italic">Waiting for activity...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CanvasGrid
