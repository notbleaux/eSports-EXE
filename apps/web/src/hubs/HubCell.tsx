/**
 * HubCell - HUB Wrapper Component
 * Handles visibility pause, worker fallback, animations
 * [Ver001.000]
 */

// @ts-nocheck
import React, { useEffect, useRef, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePageVisibility } from 'react-page-visibility' // polyfill if needed
import { useGridWorker } from '../workers/useGridWorker'
import { useHubDefinition } from '../hubs/HubRegistry'
import { useLensingStore } from '../store/lensingStore'
import type { Panel } from '../store/dynamicStore'
import { useIsHeavyHub } from './hooks' // Custom hook

interface HubCellProps {
  hubId: string
  panel: Panel
  className?: string
}

const HubCell: React.FC<HubCellProps> = memo(({ hubId, panel, className = '' }) => {
  const isVisible = usePageVisibility()
  const { component: HubComponent, weight } = useHubDefinition(hubId) || {
    component: null,
    weight: 'light'
  }
  const isHeavy = useIsHeavyHub(weight)

  // Pause heavy rendering when tab hidden
  useEffect(() => {
    if (isHeavy && !isVisible) {
      // Signal worker to pause
      // Implementation with grid.worker
    }
  }, [isVisible, isHeavy])

  if (!HubComponent) {
    return (
      <div className="flex items-center justify-center h-full bg-red-900/50 border-2 border-red-500 rounded-lg">
        <span className="text-red-400 text-sm">Missing HUB: {hubId}</span>
      </div>
    )
  }

  return (
    <motion.div
      className={`relative h-full w-full overflow-hidden rounded-lg border border-purple-500/50 bg-gradient-to-br from-black/50 to-purple-900/20 backdrop-blur-sm ${className}`}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
    >
      {/* Panel title bar */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-gradient-to-r from-purple-600/90 to-indigo-600/90 backdrop-blur-sm border-b border-white/20 px-3 py-2">
        <div className="flex items-center justify-between text-xs font-bold text-white">
          <span>{panel.title || hubId}</span>
          <div className="flex gap-1">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                weight === 'heavy'
                  ? 'bg-red-500/80 text-white'
                  : weight === 'medium'
                    ? 'bg-yellow-500/80 text-black'
                    : 'bg-green-500/80 text-black'
              }`}
            >
              {weight.toUpperCase()}
            </span>
            {isHeavy && <span className="w-2 h-2 bg-green-400 rounded-full animate-ping"></span>}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="h-full pt-10 p-2">
        {isHeavy ? <HeavyHubRenderer hubId={hubId} panel={panel} /> : <HubLoader hubId={hubId} />}
      </div>
    </motion.div>
  )
})

const HeavyHubRenderer = ({ hubId, panel }: { hubId: string; panel: Panel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { init, render } = useGridWorker()

  useEffect(() => {
    if (canvasRef.current) {
      init(canvasRef.current)
    }
  }, [])

  return (
    <div className="h-full w-full">
      <canvas
        ref={canvasRef}
        className="h-full w-full"
        style={{
          width: panel.w * 100,
          height: panel.h * 50
        }}
      />
    </div>
  )
}

export default HubCell

// Custom hook for heavy hub logic
const useIsHeavyHub = (weight: HubWeight): boolean => weight === 'heavy'
