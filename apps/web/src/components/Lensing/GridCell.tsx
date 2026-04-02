/**
 * GridCell - react-grid-layout Item Wrapper
 * [Ver001.001]
 */

import React from 'react'
import HubCell from '../../../hubs/HubCell.js'
import { Panel } from '../../../store/dynamicStore.js'
import { useDynamicStore } from '../../../store/dynamicStore.js'
import { cn } from '../../../lib/utils.js' // Tailwind merge

interface GridCellProps {
  panel: Panel
}

const GridCell: React.FC<GridCellProps> = ({ panel }) => {
  const { closePanel, minimizePanel } = useDynamicStore()

  return (
    <div
      key={panel.i}
      data-grid={{
        x: panel.x,
        y: panel.y,
        w: panel.w,
        h: panel.h,
        minW: panel.minW,
        minH: panel.minH,
        maxW: panel.maxW,
        maxH: panel.maxH
      }}
      className={cn(
        'relative bg-gradient-to-br from-slate-900/50 to-purple-900/30 border-2 border-purple-400/50 rounded-xl shadow-2xl backdrop-blur-sm overflow-hidden',
        panel.isMinimized && 'opacity-50',
        panel.isMaximized && 'col-span-full row-span-full z-50'
      )}
    >
      <HubCell hubId={panel.hub} panel={panel} />

      {/* Controls */}
      <div className="absolute top-2 right-2 z-50 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button
          onClick={() => minimizePanel(panel.i)}
          className="p-1.5 bg-black/50 hover:bg-purple-500/70 rounded-full text-white text-xs transition-all"
          title="Minimize"
        >
          _
        </button>
        <button
          onClick={() => closePanel(panel.i)}
          className="p-1.5 bg-black/50 hover:bg-red-500/70 rounded-full text-white text-xs transition-all"
          title="Close"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default GridCell
