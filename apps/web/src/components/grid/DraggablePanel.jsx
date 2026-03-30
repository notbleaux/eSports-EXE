/**
 * DraggablePanel - Optimized wrapper for grid panels with header controls
 * 
 * Performance optimizations:
 * - React.memo with custom comparison
 * - useCallback for stable event handlers
 * - Individual Zustand selectors to prevent unnecessary re-renders
 * - useMemo for computed values
 * 
 * [Ver002.000]
 */
import { memo, useCallback, useMemo } from 'react';
import { Minus, Square, X, Move } from 'lucide-react';
import { colors } from '@/theme/colors';
import { useGridStore } from '@/store/gridStore';

const HUB_COLORS = {
  SATOR: colors.hub.sator.base,
  ROTAS: colors.hub.rotas.base,
  AREPO: colors.hub.arepo.base,
  OPERA: colors.hub.opera.base,
  TENET: colors.hub.tenet.base,
};

const HUB_GLOW_COLORS = {
  SATOR: colors.hub.sator.glow,
  ROTAS: colors.hub.rotas.glow,
  AREPO: colors.hub.arepo.glow,
  OPERA: colors.hub.opera.glow,
  TENET: colors.hub.tenet.glow,
};

/**
 * DraggablePanel - Individual grid panel with window controls
 * @param {Object} props
 * @param {Object} props.panel - Panel configuration object
 * @param {React.ReactNode} props.children - Panel content
 * @param {boolean} [props.isDragging=false] - Whether panel is being dragged
 */
export const DraggablePanel = memo(function DraggablePanel({ 
  panel, 
  children, 
  isDragging = false 
}) {
  // Use individual selectors for optimal re-render prevention
  // Only re-renders when these specific actions change (never, they're stable)
  const minimizePanel = useGridStore((state) => state.minimizePanel);
  const maximizePanel = useGridStore((state) => state.maximizePanel);
  const restorePanel = useGridStore((state) => state.restorePanel);
  const closePanel = useGridStore((state) => state.closePanel);
  
  // Memoize hub color calculation
  const hubColor = useMemo(() => 
    HUB_COLORS[panel.hub] || colors.hub.sator.base,
    [panel.hub]
  );
  
  // Memoize hub glow color calculation
  const hubGlowColor = useMemo(() => 
    HUB_GLOW_COLORS[panel.hub] || colors.hub.sator.glow,
    [panel.hub]
  );
  
  // Stable callback handlers - prevent inline function recreation
  const handleMinimize = useCallback(() => {
    minimizePanel(panel.i);
  }, [minimizePanel, panel.i]);
  
  const handleMaximize = useCallback(() => {
    maximizePanel(panel.i);
  }, [maximizePanel, panel.i]);
  
  const handleRestore = useCallback(() => {
    restorePanel(panel.i);
  }, [restorePanel, panel.i]);
  
  const handleClose = useCallback(() => {
    closePanel(panel.i);
  }, [closePanel, panel.i]);
  
  // Determine maximize/restore handler based on current state
  const handleMaximizeRestore = useCallback(() => {
    if (panel.isMaximized) {
      restorePanel(panel.i);
    } else {
      maximizePanel(panel.i);
    }
  }, [panel.isMaximized, panel.i, restorePanel, maximizePanel]);
  
  // Minimized state render
  if (panel.isMinimized) {
    return (
      <div 
        className="w-full h-full flex flex-col bg-[#14141a] rounded-xl border border-white/10 overflow-hidden"
        role="region"
        aria-label={`${panel.title} panel (minimized)`}
      >
        {/* Minimized Header */}
        <div 
          className="flex items-center justify-between px-3 py-2 cursor-move"
          style={{ 
            backgroundColor: `${hubColor}10`,
            borderBottom: `1px solid ${hubColor}30`
          }}
        >
          <div className="flex items-center gap-2">
            <Move className="w-3.5 h-3.5 text-white/40" aria-hidden="true" />
            <span className="text-sm font-medium text-white/80">{panel.title}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleRestore}
              className="p-1 rounded hover:bg-white/10 text-white/60 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
              aria-label="Restore panel"
              title="Restore"
            >
              <Square className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
            <button
              onClick={handleClose}
              className="p-1 rounded hover:bg-red-500/20 text-white/60 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
              aria-label="Close panel"
              title="Close"
            >
              <X className="w-3.5 h-3.5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  // Normal/maximized state render
  return (
    <div 
      className={`
        w-full h-full flex flex-col rounded-xl border overflow-hidden
        transition-shadow duration-200
        ${isDragging ? 'shadow-2xl scale-[1.02]' : 'shadow-lg'}
      `}
      style={{
        backgroundColor: 'rgba(20, 20, 26, 0.95)',
        borderColor: `${hubColor}30`,
        boxShadow: isDragging ? `0 0 30px ${hubGlowColor}` : 'none',
      }}
      role="region"
      aria-label={`${panel.title} panel${panel.isMaximized ? ' (maximized)' : ''}`}
    >
      {/* Panel Header */}
      <div 
        className="flex items-center justify-between px-3 py-2.5 cursor-move select-none"
        style={{ 
          backgroundColor: `${hubColor}08`,
          borderBottom: `1px solid ${hubColor}20`
        }}
      >
        <div className="flex items-center gap-2">
          <Move className="w-3.5 h-3.5 text-white/30" aria-hidden="true" />
          <div 
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: hubColor, boxShadow: `0 0 6px ${hubGlowColor}` }}
            aria-hidden="true"
          />
          <span className="text-sm font-medium text-white/90">{panel.title}</span>
        </div>
        
        {/* Window Controls */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleMinimize}
            className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label="Minimize panel"
            title="Minimize"
          >
            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            onClick={handleMaximizeRestore}
            className="p-1.5 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors focus:outline-none focus:ring-2 focus:ring-white/20"
            aria-label={panel.isMaximized ? "Restore panel" : "Maximize panel"}
            title={panel.isMaximized ? "Restore" : "Maximize"}
          >
            <Square className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500/20"
            aria-label="Close panel"
            title="Close"
          >
            <X className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
        </div>
      </div>
      
      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison to prevent unnecessary re-renders
  // Returns true if props are equal (no re-render needed)
  return (
    prevProps.panel.i === nextProps.panel.i &&
    prevProps.panel.isMinimized === nextProps.panel.isMinimized &&
    prevProps.panel.isMaximized === nextProps.panel.isMaximized &&
    prevProps.panel.x === nextProps.panel.x &&
    prevProps.panel.y === nextProps.panel.y &&
    prevProps.panel.w === nextProps.panel.w &&
    prevProps.panel.h === nextProps.panel.h &&
    prevProps.isDragging === nextProps.isDragging
  );
});

export default DraggablePanel;
