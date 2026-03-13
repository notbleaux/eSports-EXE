/**
 * Grid Store - Quaternary Grid State Management
 * Handles panel states, layouts, and group views
 * 
 * [Ver001.000]
 */
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Default panel configuration
const DEFAULT_PANELS = [
  {
    i: 'minimap',
    x: 0,
    y: 0,
    w: 3,
    h: 4,
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 8,
    type: 'minimap',
    title: 'Minimap',
    hub: 'SATOR',
    isMinimized: false,
    isMaximized: false,
  },
  {
    i: 'analytics',
    x: 3,
    y: 0,
    w: 3,
    h: 4,
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 8,
    type: 'analytics',
    title: 'Analytics',
    hub: 'ROTAS',
    isMinimized: false,
    isMaximized: false,
  },
  {
    i: 'stats',
    x: 0,
    y: 4,
    w: 3,
    h: 4,
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 8,
    type: 'stats',
    title: 'Player Stats',
    hub: 'AREPO',
    isMinimized: false,
    isMaximized: false,
  },
  {
    i: 'video',
    x: 3,
    y: 4,
    w: 3,
    h: 4,
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 8,
    type: 'video',
    title: 'Video Feed',
    hub: 'OPERA',
    isMinimized: false,
    isMaximized: false,
  },
];

const DEFAULT_GROUP_VIEWS = [
  {
    id: 'default',
    name: 'Default View',
    panels: DEFAULT_PANELS,
    isDefault: true,
  },
];

export const useGridStore = create(
  persist(
    (set, get) => ({
      // Panel state
      panels: DEFAULT_PANELS,
      
      // Layout configuration
      layout: {
        cols: 6,
        rowHeight: 80,
        margin: [16, 16],
        containerPadding: [16, 16],
      },
      
      // Group views
      groupViews: DEFAULT_GROUP_VIEWS,
      currentGroupId: 'default',
      
      // Actions
      updatePanel: (id, updates) => set((state) => ({
        panels: state.panels.map((p) =>
          p.i === id ? { ...p, ...updates } : p
        ),
      })),
      
      updateLayout: (layout) => set((state) => ({
        panels: state.panels.map((panel) => {
          const layoutItem = layout.find((l) => l.i === panel.i);
          return layoutItem ? { ...panel, ...layoutItem } : panel;
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
        const id = `${type}-${Date.now()}`;
        const newPanel = {
          i: id,
          x: 0,
          y: Infinity, // Auto-position at bottom
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
        };
        return { panels: [...state.panels, newPanel] };
      }),
      
      // Group views
      saveGroupView: (name) => set((state) => {
        const newGroup = {
          id: `group-${Date.now()}`,
          name,
          panels: [...state.panels],
          isDefault: false,
        };
        return {
          groupViews: [...state.groupViews, newGroup],
          currentGroupId: newGroup.id,
        };
      }),
      
      loadGroupView: (id) => set((state) => {
        const group = state.groupViews.find((g) => g.id === id);
        if (group) {
          return {
            panels: [...group.panels],
            currentGroupId: id,
          };
        }
        return state;
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
      name: 'quaternary-grid-storage',
      partialize: (state) => ({
        panels: state.panels,
        groupViews: state.groupViews,
        currentGroupId: state.currentGroupId,
      }),
    }
  )
);

// Selector hooks
export const usePanel = (id) => useGridStore((state) => 
  state.panels.find((p) => p.i === id)
);

export const useCurrentGroup = () => useGridStore((state) =>
  state.groupViews.find((g) => g.id === state.currentGroupId)
);
