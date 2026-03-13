[Ver002.000]

# OPTIMIZED AI SUB-AGENT PROMPT: Grid System Core
## Quaternary Grid Infrastructure & State Management

**Role:** Grid Architecture Specialist  
**Priority:** P0 - Foundation Layer  
**Dependencies:** None (base layer)

---

## I. MISSION OBJECTIVE

Implement the core grid infrastructure with optimized state management, ensuring 60fps drag/resize performance and zero unnecessary re-renders.

**Success Criteria:**
- [ ] Zustand store with proper selector memoization
- [ ] Panel state updates without full grid re-render
- [ ] localStorage persistence with compression
- [ ] TypeScript-ready architecture (JSDoc types)

---

## II. ARCHITECTURE SPECIFICATION

### 2.1 State Structure (Optimized)

```typescript
// store/gridStore.js - OPTIMIZED VERSION
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createSelector } from 'reselect'; // If available, else manual memoization

// Panel Types Enum
const PanelType = {
  MINIMAP: 'minimap',
  ANALYTICS: 'analytics',
  STATS: 'stats',
  VIDEO: 'video',
  CHAT: 'chat',
  LIVEMAP: 'livemap',
};

// Panel State Shape
const DEFAULT_PANELS = [
  {
    i: 'minimap-1',
    x: 0,
    y: 0,
    w: 3,
    h: 4,
    minW: 2,
    minH: 2,
    maxW: 6,
    maxH: 8,
    type: PanelType.MINIMAP,
    title: 'Minimap',
    hub: 'SATOR',
    state: 'normal', // 'normal' | 'minimized' | 'maximized'
    zIndex: 1,
    data: {}, // Panel-specific data
  },
  // ... other default panels
];

// OPTIMIZED: Split store into slices to prevent cascade re-renders
export const useGridStore = create(
  persist(
    (set, get) => ({
      // === LAYOUT SLICE ===
      panels: DEFAULT_PANELS,
      layoutConfig: {
        cols: { lg: 6, md: 4, sm: 2, xs: 1, xxs: 1 },
        rowHeight: 80,
        margin: [16, 16],
        breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
      },
      
      // === GROUP VIEWS SLICE ===
      groupViews: [{ id: 'default', name: 'Default', panels: DEFAULT_PANELS }],
      currentGroupId: 'default',
      
      // === ACTIONS - Optimized for minimal re-renders ===
      
      /**
       * Update single panel property without affecting others
       * Usage: updatePanel('minimap-1', { h: 6 })
       */
      updatePanel: (id, updates) => set((state) => ({
        panels: state.panels.map((p) =>
          p.i === id ? { ...p, ...updates } : p
        ),
      })),
      
      /**
       * Batch update multiple panels efficiently
       * Usage: updatePanels([{ id: 'p1', updates: {...} }, ...])
       */
      updatePanels: (updates) => set((state) => {
        const updateMap = new Map(updates.map(u => [u.id, u.updates]));
        return {
          panels: state.panels.map((p) => {
            const updates = updateMap.get(p.i);
            return updates ? { ...p, ...updates } : p;
          }),
        };
      }),
      
      /**
       * Update layout from react-grid-layout callback
       * Only updates position/size, preserves other properties
       */
      updateLayout: (layout) => set((state) => {
        const layoutMap = new Map(layout.map(l => [l.i, l]));
        return {
          panels: state.panels.map((p) => {
            const l = layoutMap.get(p.i);
            return l ? { ...p, x: l.x, y: l.y, w: l.w, h: l.h } : p;
          }),
        };
      }),
      
      // === PANEL STATE MANAGEMENT ===
      minimizePanel: (id) => get().updatePanel(id, { state: 'minimized' }),
      maximizePanel: (id) => get().updatePanel(id, { state: 'maximized' }),
      restorePanel: (id) => get().updatePanel(id, { state: 'normal' }),
      closePanel: (id) => set((state) => ({
        panels: state.panels.filter((p) => p.i !== id),
      })),
      
      addPanel: (type, hub, title) => set((state) => {
        const id = `${type}-${Date.now()}`;
        // Find first available position
        const y = Math.max(...state.panels.map(p => p.y + p.h), 0);
        
        const newPanel = {
          i: id,
          x: 0,
          y,
          w: 3,
          h: 4,
          minW: 2,
          minH: 2,
          maxW: 6,
          maxH: 8,
          type,
          title: title || type.charAt(0).toUpperCase() + type.slice(1),
          hub,
          state: 'normal',
          zIndex: 1,
          data: {},
        };
        return { panels: [...state.panels, newPanel] };
      }),
      
      // === GROUP VIEW MANAGEMENT ===
      saveGroupView: (name) => set((state) => {
        const newGroup = {
          id: `group-${Date.now()}`,
          name,
          panels: JSON.parse(JSON.stringify(state.panels)), // Deep clone
          createdAt: Date.now(),
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
            panels: JSON.parse(JSON.stringify(group.panels)), // Deep clone
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
      name: 'quaternary-grid-v2',
      // Compress before storing to avoid quota issues
      serialize: (state) => {
        const compressed = {
          p: state.state.panels.map(p => ({
            i: p.i,
            x: p.x,
            y: p.y,
            w: p.w,
            h: p.h,
            t: p.type,
            h: p.hub,
            s: p.state,
          })),
          g: state.state.groupViews.map(g => ({
            id: g.id,
            n: g.name,
            p: g.panels,
          })),
          c: state.state.currentGroupId,
        };
        return JSON.stringify(compressed);
      },
      deserialize: (str) => {
        const data = JSON.parse(str);
        return {
          panels: data.p.map(p => ({
            ...p,
            title: p.t,
            hub: p.h,
            state: p.s,
            minW: 2, minH: 2, maxW: 6, maxH: 8,
          })),
          groupViews: data.g,
          currentGroupId: data.c,
        };
      },
    }
  )
);

// OPTIMIZED SELECTORS - Use these instead of direct store access
export const usePanelSelector = (id) => 
  useGridStore(useCallback(state => state.panels.find(p => p.i === id), [id]));

export const usePanelsByType = (type) =>
  useGridStore(useCallback(state => state.panels.filter(p => p.type === type), [type]));

export const useCurrentGroup = () =>
  useGridStore(useCallback(state => 
    state.groupViews.find(g => g.id === state.currentGroupId), 
  []));
```

### 2.2 Performance Optimizations

```typescript
/**
 * useGridActions - Hook that returns stable action references
 * Prevents re-renders when only actions are needed
 */
export function useGridActions() {
  const store = useGridStore();
  
  // Use useMemo to maintain stable references
  return useMemo(() => ({
    updatePanel: store.updatePanel,
    minimizePanel: store.minimizePanel,
    maximizePanel: store.maximizePanel,
    restorePanel: store.restorePanel,
    closePanel: store.closePanel,
    addPanel: store.addPanel,
    saveGroupView: store.saveGroupView,
    loadGroupView: store.loadGroupView,
    resetLayout: store.resetLayout,
  }), []); // Actions are stable in Zustand
}

/**
 * usePanel - Optimized single panel selector with equality check
 */
export function usePanel(id) {
  return useGridStore(
    useCallback(state => state.panels.find(p => p.i === id), [id]),
    // Custom equality function
    (a, b) => a?.i === b?.i && a?.x === b?.x && a?.y === b?.y && 
              a?.w === b?.w && a?.h === b?.h && a?.state === b?.state
  );
}
```

---

## III. CRITICAL IMPLEMENTATION NOTES

### 3.1 Common Performance Pitfalls (AVOID)

```typescript
// ❌ BAD: Destructuring causes re-render on any state change
const { panels, updatePanel } = useGridStore();

// ✅ GOOD: Select only what you need
const panels = useGridStore(state => state.panels);
const updatePanel = useGridStore(state => state.updatePanel);

// ❌ BAD: Creating new array in render
panels.map(p => ({ ...p, x: p.x + 1 }));

// ✅ GOOD: Use store action
updatePanel(id, { x: newX });

// ❌ BAD: Inline callback in event handler
onClick={() => updatePanel(id, { state: 'minimized' })}

// ✅ GOOD: Use stable callback
const handleMinimize = useCallback(() => {
  updatePanel(id, { state: 'minimized' });
}, [id, updatePanel]);
```

### 3.2 localStorage Quota Management

```typescript
// Implement LRU eviction for group views
const MAX_GROUP_VIEWS = 10;

saveGroupView: (name) => set((state) => {
  let views = [...state.groupViews];
  
  // Evict oldest non-default if at limit
  if (views.length >= MAX_GROUP_VIEWS) {
    const oldestIndex = views.findIndex(v => !v.isDefault);
    if (oldestIndex !== -1) {
      views.splice(oldestIndex, 1);
    }
  }
  
  const newGroup = {
    id: `group-${Date.now()}`,
    name,
    panels: JSON.parse(JSON.stringify(state.panels)),
    createdAt: Date.now(),
  };
  
  return {
    groupViews: [...views, newGroup],
    currentGroupId: newGroup.id,
  };
}),
```

---

## IV. TESTING REQUIREMENTS

### 4.1 Unit Tests (Jest/Vitest)

```typescript
// __tests__/gridStore.test.js
describe('Grid Store', () => {
  beforeEach(() => {
    // Reset store to initial state
    useGridStore.setState({ panels: DEFAULT_PANELS });
  });
  
  test('updatePanel modifies only target panel', () => {
    const { updatePanel } = useGridStore.getState();
    updatePanel('minimap-1', { h: 6 });
    
    const state = useGridStore.getState();
    expect(state.panels[0].h).toBe(6);
    expect(state.panels[1]).toEqual(DEFAULT_PANELS[1]);
  });
  
  test('loadGroupView replaces all panels', () => {
    // Save current, modify, then restore
    const { saveGroupView, loadGroupView, closePanel } = useGridStore.getState();
    
    saveGroupView('Test View');
    const savedId = useGridStore.getState().currentGroupId;
    
    closePanel('minimap-1');
    expect(useGridStore.getState().panels).toHaveLength(3);
    
    loadGroupView(savedId);
    expect(useGridStore.getState().panels).toHaveLength(4);
  });
  
  test('persistence compresses data', () => {
    // Verify serialization reduces size
  });
});
```

### 4.2 Performance Benchmarks

```typescript
// benchmarks/gridStore.bench.js
benchmark('updatePanel', () => {
  const { updatePanel } = useGridStore.getState();
  updatePanel('minimap-1', { h: 6 });
});

benchmark('updateLayout (batch)', () => {
  const { updateLayout } = useGridStore.getState();
  const newLayout = panels.map(p => ({ ...p, x: p.x + 1 }));
  updateLayout(newLayout);
});
```

---

## V. INTEGRATION CONTRACT

### 5.1 Exports

```typescript
// store/index.js
export { useGridStore, usePanel, useCurrentGroup, useGridActions } from './gridStore';
export { PanelType } from './constants';
```

### 5.2 Consumed By

- `QuaternaryGrid.jsx` - Main grid container
- `DraggablePanel.jsx` - Panel wrapper
- `GroupViewSelector.jsx` - View management UI

---

## VI. DELIVERABLES

1. `src/store/gridStore.js` - Optimized store with persistence
2. `src/store/constants.js` - PanelType enum, default configs
3. `src/hooks/useGridActions.js` - Stable action hook
4. `src/hooks/usePanel.js` - Optimized panel selector
5. `__tests__/gridStore.test.js` - Unit tests

---

*End of Grid System Sub-Agent Prompt*
