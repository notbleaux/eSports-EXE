/**
 * Dynamic Store - Panel Positions & Group Views (Change Occasionally)
 * [Ver001.000]
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Panel {
  i: string
  x: number
  y: number
  w: number
  h: number
  minW: number
  minH: number
  maxW: number
  maxH: number
  type: string
  title: string
  hub: string
  isMinimized: boolean
  isMaximized: boolean
}

export interface GroupView {
  id: string
  name: string
  panels: Panel[]
  isDefault: boolean
}

export interface DynamicState {
  panels: Panel[]
  groupViews: GroupView[]
  currentGroupId: string
  
  // Actions
  updatePanel: (id: string, updates: Partial<Panel>) => void
  updateLayout: (layout: Array<Partial<Panel> & { i: string }>) => void
  minimizePanel: (id: string) => void
  maximizePanel: (id: string) => void
  restorePanel: (id: string) => void
  closePanel: (id: string) => void
  addPanel: (type: string, hub: string) => void
  saveGroupView: (name: string) => void
  loadGroupView: (id: string) => void
  deleteGroupView: (id: string) => void
  resetLayout: () => void
}

const DEFAULT_PANELS: Panel[] = [
  { i: 'minimap', x: 0, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 6, maxH: 8, type: 'minimap', title: 'Minimap', hub: 'SATOR', isMinimized: false, isMaximized: false },
  { i: 'analytics', x: 3, y: 0, w: 3, h: 4, minW: 2, minH: 2, maxW: 6, maxH: 8, type: 'analytics', title: 'Analytics', hub: 'ROTAS', isMinimized: false, isMaximized: false },
  { i: 'stats', x: 0, y: 4, w: 3, h: 4, minW: 2, minH: 2, maxW: 6, maxH: 8, type: 'stats', title: 'Player Stats', hub: 'AREPO', isMinimized: false, isMaximized: false },
  { i: 'video', x: 3, y: 4, w: 3, h: 4, minW: 2, minH: 2, maxW: 6, maxH: 8, type: 'video', title: 'Video Feed', hub: 'OPERA', isMinimized: false, isMaximized: false },
]

const DEFAULT_GROUP_VIEWS: GroupView[] = [
  { id: 'default', name: 'Default View', panels: DEFAULT_PANELS, isDefault: true },
]

export const useDynamicStore = create<DynamicState>()(
  persist(
    (set, get) => ({
      panels: DEFAULT_PANELS,
      groupViews: DEFAULT_GROUP_VIEWS,
      currentGroupId: 'default',

      updatePanel: (id, updates) => set((state) => ({
        panels: state.panels.map((p) => (p.i === id ? { ...p, ...updates } : p)),
      })),

      updateLayout: (layout) => set((state) => ({
        panels: state.panels.map((panel) => {
          const layoutItem = layout.find((l) => l.i === panel.i)
          return layoutItem ? { ...panel, ...layoutItem } : panel
        }),
      })),

      minimizePanel: (id) => set((state) => ({
        panels: state.panels.map((p) =>
          p.i === id ? { ...p, isMinimized: true, isMaximized: false } : p
        ),
      })),

      maximizePanel: (id) => set((state) => ({
        panels: state.panels.map((p) =>
          p.i === id ? { ...p, isMinimized: false, isMaximized: true } : p
        ),
      })),

      restorePanel: (id) => set((state) => ({
        panels: state.panels.map((p) =>
          p.i === id ? { ...p, isMinimized: false, isMaximized: false } : p
        ),
      })),

      closePanel: (id) => set((state) => ({
        panels: state.panels.filter((p) => p.i !== id),
      })),

      addPanel: (type, hub) => set((state) => {
        const id = `${type}-${Date.now()}`
        const newPanel: Panel = {
          i: id,
          x: 0,
          y: Infinity,
          w: 3,
          h: 4,
          minW: 2,
          minH: 2,
          maxW: 6,
          maxH: 8,
          type,
          title: type.charAt(0).toUpperCase() + type.slice(1),
          hub,
          isMinimized: false,
          isMaximized: false,
        }
        return { panels: [...state.panels, newPanel] }
      }),

      saveGroupView: (name) => set((state) => {
        const newGroup: GroupView = {
          id: `group-${Date.now()}`,
          name,
          panels: [...state.panels],
          isDefault: false,
        }
        return {
          groupViews: [...state.groupViews, newGroup],
          currentGroupId: newGroup.id,
        }
      }),

      loadGroupView: (id) => set((state) => {
        const group = state.groupViews.find((g) => g.id === id)
        if (group) {
          return {
            panels: [...group.panels],
            currentGroupId: id,
          }
        }
        return state
      }),

      deleteGroupView: (id) => set((state) => ({
        groupViews: state.groupViews.filter((g) => g.id !== id),
        currentGroupId: state.currentGroupId === id ? 'default' : state.currentGroupId,
      })),

      resetLayout: () => set({
        panels: DEFAULT_PANELS,
        currentGroupId: 'default',
      }),
    }),
    {
      name: 'dynamic-grid-storage',
      partialize: (state) => ({
        panels: state.panels,
        groupViews: state.groupViews,
        currentGroupId: state.currentGroupId,
      }),
    }
  )
)

// Granular selector hooks
export const usePanels = () => useDynamicStore((state) => state.panels)
export const usePanel = (id: string) => useDynamicStore((state) => state.panels.find((p) => p.i === id))
export const useGroupViews = () => useDynamicStore((state) => state.groupViews)
export const useCurrentGroupId = () => useDynamicStore((state) => state.currentGroupId)
export const useCurrentGroup = () => useDynamicStore((state) =>
  state.groupViews.find((g) => g.id === state.currentGroupId)
)
