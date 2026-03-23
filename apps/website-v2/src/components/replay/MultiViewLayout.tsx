/** [Ver001.000] */
/**
 * Multi-view Layout Component
 * ===========================
 * Split-screen layout with draggable view arrangement and focus mode.
 * 
 * Features: 2x2, 3x1, quad layouts, draggable, focus mode
 * Agent: TL-S2-2-D
 * Team: Replay 2.0 Core (TL-S2)
 */

import React, { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Grid3X3, 
  LayoutGrid, 
  Maximize2, 
  Minimize2, 
  Move,
  PictureInPicture,
  Square,
  LayoutTemplate,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import {
  useMultiViewStore,
  useLayout,
  useLayoutType,
  useVisibleSlots,
  useFocusedSlot,
  useIsFocusMode,
  type LayoutType,
  type ViewSlot,
  getLayoutDisplayName,
} from '@/lib/replay/multiview/state';
import { useSyncManager, getSyncStatusIndicator } from '@/lib/replay/multiview/sync';
import { usePOVSwitcher, getPOVDisplayName } from '@/lib/replay/multiview/povSwitcher';

// ============================================================================
// Utility Functions
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Types
// ============================================================================

export interface MultiViewLayoutProps {
  /** Render function for view content */
  renderView: (slot: ViewSlot, isActive: boolean) => React.ReactNode;
  /** Additional CSS classes */
  className?: string;
  /** Whether to show layout controls */
  showControls?: boolean;
  /** Whether to show sync status */
  showSyncStatus?: boolean;
  /** Callback when slot is clicked */
  onSlotClick?: (slotId: string) => void;
  /** Callback when layout changes */
  onLayoutChange?: (layout: LayoutType) => void;
}

export interface ViewSlotProps {
  slot: ViewSlot;
  isActive: boolean;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent, slotId: string) => void;
  onDragOver: (e: React.DragEvent, slotId: string) => void;
  onDrop: (e: React.DragEvent, slotId: string) => void;
  onClick: () => void;
  children: React.ReactNode;
}

// ============================================================================
// Layout Selector Component
// ============================================================================

const LAYOUT_OPTIONS: { type: LayoutType; icon: React.ReactNode; label: string }[] = [
  { type: 'single', icon: <Square className="w-4 h-4" />, label: 'Single' },
  { type: 'split', icon: <LayoutGrid className="w-4 h-4" />, label: 'Split' },
  { type: 'triple', icon: <LayoutTemplate className="w-4 h-4" />, label: 'Triple' },
  { type: 'quad', icon: <Grid3X3 className="w-4 h-4" />, label: 'Quad' },
  { type: 'main-plus-3', icon: <LayoutGrid className="w-4 h-4" />, label: 'Main+3' },
  { type: 'pip', icon: <PictureInPicture className="w-4 h-4" />, label: 'PiP' },
];

const LayoutSelector: React.FC<{
  currentLayout: LayoutType;
  onChange: (layout: LayoutType) => void;
}> = ({ currentLayout, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentOption = LAYOUT_OPTIONS.find(o => o.type === currentLayout);

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium",
          "bg-gray-800 hover:bg-gray-700 text-gray-200",
          "border border-gray-700 transition-colors"
        )}
      >
        {currentOption?.icon}
        <span className="hidden sm:inline">{currentOption?.label}</span>
        <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <div className={cn(
          "absolute top-full left-0 mt-1 z-50",
          "bg-gray-800 border border-gray-700 rounded-lg shadow-xl",
          "min-w-[140px] overflow-hidden"
        )}>
          {LAYOUT_OPTIONS.map(option => (
            <button
              key={option.type}
              onClick={() => {
                onChange(option.type);
                setIsOpen(false);
              }}
              className={cn(
                "w-full flex items-center gap-2 px-3 py-2 text-sm",
                "hover:bg-gray-700 transition-colors",
                currentLayout === option.type && "bg-blue-600/30 text-blue-400"
              )}
            >
              {option.icon}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// View Slot Component
// ============================================================================

const ViewSlotComponent: React.FC<ViewSlotProps> = ({
  slot,
  isActive,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onClick,
  children,
}) => {
  const store = useMultiViewStore();
  const isFocusMode = useIsFocusMode();
  
  const slotStyle = useMemo(() => ({
    left: `${slot.position.x}%`,
    top: `${slot.position.y}%`,
    width: `${slot.size.width}%`,
    height: `${slot.size.height}%`,
    zIndex: slot.zIndex,
  }), [slot.position, slot.size, slot.zIndex]);

  if (!slot.isVisible) return null;

  return (
    <div
      className={cn(
        "absolute border-2 rounded-lg overflow-hidden transition-all duration-200",
        "bg-gray-900 border-gray-700",
        isActive && "border-blue-500 ring-2 ring-blue-500/30",
        isDragging && "opacity-50 scale-95",
        isFocusMode && !slot.isFocused && "hidden",
        !isFocusMode && slot.isFocused && "ring-2 ring-yellow-500/50"
      )}
      style={slotStyle}
      draggable={store.layout.isDraggable && !isFocusMode}
      onDragStart={(e) => onDragStart(e, slot.id)}
      onDragOver={(e) => onDragOver(e, slot.id)}
      onDrop={(e) => onDrop(e, slot.id)}
      onClick={onClick}
    >
      {/* Slot Header */}
      <div className={cn(
        "absolute top-0 left-0 right-0 z-10",
        "flex items-center justify-between px-2 py-1",
        "bg-gradient-to-b from-black/80 to-transparent"
      )}>
        <div className="flex items-center gap-1">
          {store.layout.isDraggable && !isFocusMode && (
            <GripVertical className="w-4 h-4 text-gray-500 cursor-grab" />
          )}
          <span className="text-xs font-medium text-gray-300 truncate">
            {getPOVDisplayName(slot.pov, slot.name)}
          </span>
        </div>
        
        {/* Focus Toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            store.toggleFocus(slot.id);
          }}
          className={cn(
            "p-1 rounded transition-colors",
            slot.isFocused 
              ? "text-yellow-400 hover:text-yellow-300" 
              : "text-gray-500 hover:text-gray-300"
          )}
          title={slot.isFocused ? 'Exit focus' : 'Focus this view'}
        >
          {slot.isFocused ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
        </button>
      </div>

      {/* View Content */}
      <div className="w-full h-full">
        {children}
      </div>

      {/* Resize Handle (only in resizable layouts) */}
      {store.layout.isResizable && !isFocusMode && (
        <div
          className={cn(
            "absolute bottom-1 right-1 w-4 h-4 cursor-se-resize",
            "flex items-end justify-end"
          )}
        >
          <div className="w-2 h-2 border-r-2 border-b-2 border-gray-600" />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Sync Status Indicator Component
// ============================================================================

const SyncStatusIndicator: React.FC<{
  className?: string;
}> = ({ className }) => {
  const { syncState } = useSyncManager();
  const indicator = getSyncStatusIndicator(syncState);

  const colorClasses = {
    green: 'bg-green-500 text-green-100',
    yellow: 'bg-yellow-500 text-yellow-100',
    red: 'bg-red-500 text-red-100',
    gray: 'bg-gray-500 text-gray-100',
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className={cn(
        "w-2 h-2 rounded-full",
        colorClasses[indicator.color].split(' ')[0]
      )} />
      <span className="text-xs text-gray-400">
        {indicator.message}
      </span>
      {indicator.totalCount > 0 && (
        <span className="text-xs text-gray-500">
          ({indicator.syncedCount}/{indicator.totalCount})
        </span>
      )}
    </div>
  );
};

// ============================================================================
// Main MultiViewLayout Component
// ============================================================================

export const MultiViewLayout: React.FC<MultiViewLayoutProps> = ({
  renderView,
  className,
  showControls = true,
  showSyncStatus = true,
  onSlotClick,
  onLayoutChange,
}) => {
  const store = useMultiViewStore();
  const layout = useLayout();
  const layoutType = useLayoutType();
  const visibleSlots = useVisibleSlots();
  const focusedSlotId = useFocusedSlot();
  const isFocusMode = useIsFocusMode();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggedSlotId, setDraggedSlotId] = useState<string | null>(null);
  const [activeSlotId, setActiveSlotId] = useState<string | null>(null);

  // Handle layout change
  const handleLayoutChange = useCallback((newLayout: LayoutType) => {
    store.setLayout(newLayout);
    onLayoutChange?.(newLayout);
  }, [store, onLayoutChange]);

  // Handle drag start
  const handleDragStart = useCallback((e: React.DragEvent, slotId: string) => {
    setDraggedSlotId(slotId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', slotId);
  }, []);

  // Handle drag over
  const handleDragOver = useCallback((e: React.DragEvent, slotId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }, []);

  // Handle drop - swap POVs between slots
  const handleDrop = useCallback((e: React.DragEvent, targetSlotId: string) => {
    e.preventDefault();
    const sourceSlotId = e.dataTransfer.getData('text/plain');
    
    if (sourceSlotId && sourceSlotId !== targetSlotId) {
      store.swapSlots(sourceSlotId, targetSlotId);
    }
    
    setDraggedSlotId(null);
  }, [store]);

  // Handle slot click
  const handleSlotClick = useCallback((slotId: string) => {
    setActiveSlotId(slotId);
    onSlotClick?.(slotId);
  }, [onSlotClick]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Number keys 1-9 to focus slots
      if (e.key >= '1' && e.key <= '9') {
        const index = parseInt(e.key) - 1;
        if (index < visibleSlots.length) {
          handleSlotClick(visibleSlots[index].id);
        }
      }
      
      // Escape to exit focus mode
      if (e.key === 'Escape' && isFocusMode) {
        store.exitFocusMode();
      }
      
      // F key to toggle focus on active slot
      if (e.key === 'f' || e.key === 'F') {
        if (activeSlotId) {
          store.toggleFocus(activeSlotId);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visibleSlots, activeSlotId, isFocusMode, store, handleSlotClick]);

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Controls Bar */}
      {showControls && (
        <div className={cn(
          "flex items-center justify-between px-3 py-2",
          "bg-gray-800 border-b border-gray-700"
        )}>
          <div className="flex items-center gap-2">
            <LayoutSelector 
              currentLayout={layoutType} 
              onChange={handleLayoutChange} 
            />
            
            {isFocusMode && (
              <button
                onClick={() => store.exitFocusMode()}
                className={cn(
                  "flex items-center gap-1 px-2 py-1 rounded text-xs",
                  "bg-yellow-600/30 text-yellow-400 hover:bg-yellow-600/50"
                )}
              >
                <Minimize2 className="w-3 h-3" />
                Exit Focus
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            {showSyncStatus && <SyncStatusIndicator />}
            
            {/* Slot indicators */}
            <div className="hidden sm:flex items-center gap-1">
              {visibleSlots.map((slot, index) => (
                <button
                  key={slot.id}
                  onClick={() => handleSlotClick(slot.id)}
                  className={cn(
                    "w-6 h-6 rounded text-xs font-medium transition-colors",
                    activeSlotId === slot.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  )}
                  title={`Slot ${index + 1}`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Layout Container */}
      <div 
        ref={containerRef}
        className={cn(
          "flex-1 relative overflow-hidden",
          "bg-gray-950"
        )}
      >
        {visibleSlots.map(slot => (
          <ViewSlotComponent
            key={slot.id}
            slot={slot}
            isActive={activeSlotId === slot.id}
            isDragging={draggedSlotId === slot.id}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => handleSlotClick(slot.id)}
          >
            {renderView(slot, activeSlotId === slot.id)}
          </ViewSlotComponent>
        ))}

        {/* Empty state */}
        {visibleSlots.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <LayoutGrid className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>No views configured</p>
              <p className="text-sm opacity-70">Select a layout to begin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// Compact Layout Selector
// ============================================================================

export const CompactLayoutSelector: React.FC<{
  value: LayoutType;
  onChange: (layout: LayoutType) => void;
  className?: string;
}> = ({ value, onChange, className }) => {
  return (
    <div className={cn("flex items-center gap-1", className)}>
      {LAYOUT_OPTIONS.map(option => (
        <button
          key={option.type}
          onClick={() => onChange(option.type)}
          className={cn(
            "p-2 rounded-lg transition-colors",
            value === option.type
              ? "bg-blue-600 text-white"
              : "bg-gray-800 text-gray-400 hover:bg-gray-700"
          )}
          title={option.label}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// Layout Preset Button
// ============================================================================

export const LayoutPresetButton: React.FC<{
  layout: LayoutType;
  isActive: boolean;
  onClick: () => void;
  className?: string;
}> = ({ layout, isActive, onClick, className }) => {
  const option = LAYOUT_OPTIONS.find(o => o.type === layout);
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-1 p-3 rounded-lg transition-colors",
        isActive
          ? "bg-blue-600 text-white"
          : "bg-gray-800 text-gray-400 hover:bg-gray-700",
        className
      )}
    >
      {option?.icon}
      <span className="text-xs">{option?.label}</span>
    </button>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default MultiViewLayout;
