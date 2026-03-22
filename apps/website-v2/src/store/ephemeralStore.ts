/**
 * Ephemeral Store - UI States (Change Frequently)
 * [Ver001.000]
 */
import { create } from 'zustand'

export interface DragState {
  isDragging: boolean
  dragId: string | null
  dragStart: { x: number; y: number } | null
}

export interface HoverState {
  hoveredPanelId: string | null
  hoveredResizeHandle: string | null
}

export interface ScrollState {
  scrollTop: number
  scrollLeft: number
  isScrolling: boolean
}

export interface EphemeralState extends DragState, HoverState, ScrollState {
  // Actions
  setHoveredPanel: (id: string | null) => void
  setHoveredResizeHandle: (handle: string | null) => void
  startDrag: (id: string, x: number, y: number) => void
  endDrag: () => void
  setScrollPosition: (top: number, left: number) => void
  setIsScrolling: (isScrolling: boolean) => void
}

export const useEphemeralStore = create<EphemeralState>((set) => ({
  // Drag state
  isDragging: false,
  dragId: null,
  dragStart: null,

  // Hover state
  hoveredPanelId: null,
  hoveredResizeHandle: null,

  // Scroll state
  scrollTop: 0,
  scrollLeft: 0,
  isScrolling: false,

  // Actions
  setHoveredPanel: (id) => set({ hoveredPanelId: id }),
  
  setHoveredResizeHandle: (handle) => set({ hoveredResizeHandle: handle }),
  
  startDrag: (id, x, y) => set({
    isDragging: true,
    dragId: id,
    dragStart: { x, y },
  }),
  
  endDrag: () => set({
    isDragging: false,
    dragId: null,
    dragStart: null,
  }),
  
  setScrollPosition: (top, left) => set({
    scrollTop: top,
    scrollLeft: left,
  }),
  
  setIsScrolling: (isScrolling) => set({ isScrolling }),
}))

// Granular selector hooks - each only triggers re-render when specific state changes
export const useHoveredPanel = () => useEphemeralStore((state) => state.hoveredPanelId)
export const useIsDragging = () => useEphemeralStore((state) => state.isDragging)
export const useDragId = () => useEphemeralStore((state) => state.dragId)
export const useScrollState = () => useEphemeralStore((state) => ({
  scrollTop: state.scrollTop,
  scrollLeft: state.scrollLeft,
  isScrolling: state.isScrolling,
}))
