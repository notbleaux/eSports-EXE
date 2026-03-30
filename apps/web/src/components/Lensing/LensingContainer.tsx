/**
 * LensingContainer - Main Lensing Grid
 * react-grid-layout + dynamicStore + HUB registry
 * [Ver001.000]
 */

import React, { useEffect, useCallback } from 'react'
import { Responsive, WidthProvider } from 'react-grid-layout'
import GridCell from './GridCell'
import LensSelector from './LensSelector'
import { useLensingStore, useLensingPanels } from '../../store/lensingStore'
import { useDynamicStore } from '../../store/dynamicStore'
import { useStaticStore } from '../../store/staticStore'
import { preloadHeavyHubs } from '../../hubs'
import UnifiedGrid from '../UnifiedGrid'
import { useMediaQuery } from 'react-responsive' // or Tailwind

const ResponsiveGridLayout = WidthProvider(Responsive)

const LensingContainer: React.FC = () => {
  const panels = useLensingPanels()
  const { updateLayout } = useDynamicStore()
  const isMobile = useMediaQuery({ maxWidth: 768 })
  const { setMobile } = useLensingStore()
  useStaticStore()

  // Sync mobile state
  useEffect(() => {
    setMobile(isMobile)
  }, [isMobile, setMobile])

  // Preload on mount
  useEffect(() => {
    preloadHeavyHubs()
  }, [])

  const onLayoutChange = useCallback(
    (newLayout: any[]) => {
      updateLayout(newLayout)
    },
    [updateLayout]
  )

  const layout = panels.map(p => ({
    i: p.i,
    x: p.x,
    y: p.y,
    w: p.w,
    h: p.h,
    minW: p.minW,
    minH: p.minH,
    maxW: p.maxW,
    maxH: p.maxH
  }))

  if (panels.length === 0) {
    return (
      <div className="flex items-center justify-center h-96 text-purple-400">
        <div>
          <LayoutGrid className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <h2 className="text-2xl font-bold mb-2">No Active Lenses</h2>
          <p className="text-purple-300">Select HUBs to begin lensing</p>
        </div>
      </div>
    )
  }

  return (
    <div className="lensing-container min-h-[600px] bg-gradient-to-br from-slate-950 via-purple-950/30 to-black border-4 border-purple-500/20 rounded-3xl p-8 shadow-2xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-6 mb-8">
        <h1 className="text-4xl font-black bg-gradient-to-r from-purple-400 via-pink-400 to-indigo-400 bg-clip-text text-transparent drop-shadow-2xl">
          TENET LENSING
        </h1>
        <LensSelector />
      </div>

      {/* Grid */}
      <ResponsiveGridLayout
        className="layout"
        layouts={{
          lg: layout,
          md: layout.map(l => ({ ...l, w: Math.max(2, l.w - 1), h: l.h })),
          sm: layout.slice(0, 2).map(l => ({ ...l, x: 0, y: 0, w: 4, h: l.h }))
        }}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480 }}
        cols={{ lg: 12, md: 10, sm: 8, xs: 4 }}
        rowHeight={60}
        margin={[16, 16]}
        containerPadding={[20, 20]}
        onLayoutChange={onLayoutChange}
        allowOverlap={false}
        preventCollision={true}
        measureBeforeMount={true}
        useCSSTransforms={true}
        isDraggable={true}
        isResizable={true}
        draggableHandle=".title-bar" // CSS selector
        style={{ height: '70vh', position: 'relative' }}
      >
        {panels.map(panel => (
          <GridCell key={panel.i} panel={panel} />
        ))}
      </ResponsiveGridLayout>

      {/* Status Bar */}
      <div className="mt-8 pt-6 border-t border-white/10 flex justify-between items-center text-sm text-purple-400">
        <div>Panels: {panels.length} | Layout persisted to localStorage</div>
        <div className="flex gap-4">
          <UnifiedGrid panelCount={panels.length} />
        </div>
      </div>
    </div>
  )
}

export default LensingContainer
