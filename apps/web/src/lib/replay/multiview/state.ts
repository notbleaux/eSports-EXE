// @ts-nocheck
/** [Ver001.000] */
/**
 * Multi-view State Management
 * ===========================
 * Zustand-based state store for replay multi-view system.
 * Manages layout, POV assignments, and view preferences.
 * 
 * Agent: TL-S2-2-D
 * Team: Replay 2.0 Core (TL-S2)
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// Types
// ============================================================================

/** Available layout configurations */
export type LayoutType = 'single' | 'split' | 'triple' | 'quad' | 'main-plus-3' | 'pip';

/** POV (Point of View) assignment for a view slot */
export interface POVAssignment {
  /** Player ID for POV, or null for free camera */
  playerId: string | null;
  /** Team ID for team-wide view */
  teamId?: string;
  /** View mode for this slot */
  viewMode: 'fpv' | 'tpv' | 'free' | 'map';
}

/** View slot configuration */
export interface ViewSlot {
  id: string;
  name: string;
  pov: POVAssignment;
  isFocused: boolean;
  isVisible: boolean;
  position: { x: number; y: number };
  size: { width: number; height: number };
  /** Z-index for layering */
  zIndex: number;
}

/** Layout configuration with view slots */
export interface LayoutConfig {
  type: LayoutType;
  slots: ViewSlot[];
  /** Whether slots can be rearranged */
  isDraggable: boolean;
  /** Whether slots can be resized */
  isResizable: boolean;
}

/** Observer tool settings */
export interface ObserverTools {
  xrayMode: boolean;
  trajectoryVisualization: boolean;
  playerInfoOverlay: boolean;
  outlinePlayers: boolean;
  showVisionCones: boolean;
  showHealthBars: boolean;
}

/** Multi-view state */
export interface MultiViewState {
  // Layout configuration
  layout: LayoutConfig;
  
  // Available players (populated from replay)
  availablePlayers: Array<{
    id: string;
    name: string;
    teamId: string;
    teamSide: string;
    isAlive?: boolean;
  }>;
  
  // Observer tools
  tools: ObserverTools;
  
  // Focus mode
  focusedSlotId: string | null;
  previousLayout: LayoutType | null;
}

/** Multi-view actions */
export interface MultiViewActions {
  // Layout management
  setLayout: (type: LayoutType) => void;
  updateSlotPOV: (slotId: string, pov: Partial<POVAssignment>) => void;
  swapSlots: (slotIdA: string, slotIdB: string) => void;
  
  // Focus mode
  enterFocusMode: (slotId: string) => void;
  exitFocusMode: () => void;
  toggleFocus: (slotId: string) => void;
  
  // Slot visibility
  showSlot: (slotId: string) => void;
  hideSlot: (slotId: string) => void;
  toggleSlotVisibility: (slotId: string) => void;
  
  // Observer tools
  setTool: <K extends keyof ObserverTools>(tool: K, value: ObserverTools[K]) => void;
  toggleTool: (tool: keyof ObserverTools) => void;
  resetTools: () => void;
  
  // Player management
  setAvailablePlayers: (players: MultiViewState['availablePlayers']) => void;
  updatePlayerStatus: (playerId: string, isAlive: boolean) => void;
  
  // Slot arrangement
  moveSlot: (slotId: string, position: { x: number; y: number }) => void;
  resizeSlot: (slotId: string, size: { width: number; height: number }) => void;
  bringToFront: (slotId: string) => void;
  
  // Presets
  loadPreset: (preset: LayoutType) => void;
  saveAsPreset: (name: string) => void;
}

export type MultiViewStore = MultiViewState & MultiViewActions;

// ============================================================================
// Constants
// ============================================================================

/** Default layout configurations */
export const LAYOUT_PRESETS: Record<LayoutType, Omit<LayoutConfig, 'type'>> = {
  single: {
    slots: [
      {
        id: 'slot-0',
        name: 'Main View',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        zIndex: 1,
      },
    ],
    isDraggable: false,
    isResizable: false,
  },
  split: {
    slots: [
      {
        id: 'slot-0',
        name: 'Left View',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 0, y: 0 },
        size: { width: 50, height: 100 },
        zIndex: 1,
      },
      {
        id: 'slot-1',
        name: 'Right View',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 50, y: 0 },
        size: { width: 50, height: 100 },
        zIndex: 1,
      },
    ],
    isDraggable: true,
    isResizable: false,
  },
  triple: {
    slots: [
      {
        id: 'slot-0',
        name: 'Main View',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 0, y: 0 },
        size: { width: 66.67, height: 100 },
        zIndex: 1,
      },
      {
        id: 'slot-1',
        name: 'Top Right',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 66.67, y: 0 },
        size: { width: 33.33, height: 50 },
        zIndex: 1,
      },
      {
        id: 'slot-2',
        name: 'Bottom Right',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 66.67, y: 50 },
        size: { width: 33.33, height: 50 },
        zIndex: 1,
      },
    ],
    isDraggable: true,
    isResizable: false,
  },
  quad: {
    slots: [
      {
        id: 'slot-0',
        name: 'Top Left',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 0, y: 0 },
        size: { width: 50, height: 50 },
        zIndex: 1,
      },
      {
        id: 'slot-1',
        name: 'Top Right',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 50, y: 0 },
        size: { width: 50, height: 50 },
        zIndex: 1,
      },
      {
        id: 'slot-2',
        name: 'Bottom Left',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 0, y: 50 },
        size: { width: 50, height: 50 },
        zIndex: 1,
      },
      {
        id: 'slot-3',
        name: 'Bottom Right',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 50, y: 50 },
        size: { width: 50, height: 50 },
        zIndex: 1,
      },
    ],
    isDraggable: true,
    isResizable: false,
  },
  'main-plus-3': {
    slots: [
      {
        id: 'slot-0',
        name: 'Main View',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 0, y: 0 },
        size: { width: 75, height: 100 },
        zIndex: 1,
      },
      {
        id: 'slot-1',
        name: 'Side 1',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 75, y: 0 },
        size: { width: 25, height: 33.33 },
        zIndex: 1,
      },
      {
        id: 'slot-2',
        name: 'Side 2',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 75, y: 33.33 },
        size: { width: 25, height: 33.33 },
        zIndex: 1,
      },
      {
        id: 'slot-3',
        name: 'Side 3',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 75, y: 66.67 },
        size: { width: 25, height: 33.34 },
        zIndex: 1,
      },
    ],
    isDraggable: true,
    isResizable: false,
  },
  pip: {
    slots: [
      {
        id: 'slot-0',
        name: 'Main View',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 0, y: 0 },
        size: { width: 100, height: 100 },
        zIndex: 1,
      },
      {
        id: 'slot-1',
        name: 'Picture in Picture',
        pov: { playerId: null, viewMode: 'free' },
        isFocused: false,
        isVisible: true,
        position: { x: 75, y: 75 },
        size: { width: 25, height: 25 },
        zIndex: 10,
      },
    ],
    isDraggable: true,
    isResizable: true,
  },
};

/** Default observer tools state */
export const DEFAULT_TOOLS: ObserverTools = {
  xrayMode: false,
  trajectoryVisualization: false,
  playerInfoOverlay: true,
  outlinePlayers: true,
  showVisionCones: false,
  showHealthBars: true,
};

/** Maximum number of POVs supported */
export const MAX_POV_COUNT = 10;

/** Maximum sync drift allowed in milliseconds */
export const MAX_SYNC_DRIFT_MS = 50;

// ============================================================================
// Helper Functions
// ============================================================================

const createLayoutConfig = (type: LayoutType): LayoutConfig => ({
  type,
  ...LAYOUT_PRESETS[type],
});

const findMaxZIndex = (slots: ViewSlot[]): number => {
  return Math.max(...slots.map(s => s.zIndex), 1);
};

// ============================================================================
// Store Creation
// ============================================================================

const initialState: MultiViewState = {
  layout: createLayoutConfig('single'),
  availablePlayers: [],
  tools: { ...DEFAULT_TOOLS },
  focusedSlotId: null,
  previousLayout: null,
};

export const useMultiViewStore = create<MultiViewStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Layout management
      setLayout: (type: LayoutType) => {
        set(draft => {
          draft.layout = createLayoutConfig(type);
          draft.focusedSlotId = null;
        });
      },

      updateSlotPOV: (slotId: string, pov: Partial<POVAssignment>) => {
        set(draft => {
          const slot = draft.layout.slots.find(s => s.id === slotId);
          if (slot) {
            slot.pov = { ...slot.pov, ...pov };
          }
        });
      },

      swapSlots: (slotIdA: string, slotIdB: string) => {
        set(draft => {
          const slotA = draft.layout.slots.find(s => s.id === slotIdA);
          const slotB = draft.layout.slots.find(s => s.id === slotIdB);
          if (slotA && slotB) {
            const tempPOV = slotA.pov;
            slotA.pov = slotB.pov;
            slotB.pov = tempPOV;
          }
        });
      },

      // Focus mode
      enterFocusMode: (slotId: string) => {
        set(draft => {
          if (draft.focusedSlotId === slotId) return;
          
          draft.previousLayout = draft.layout.type;
          draft.focusedSlotId = slotId;
          
          // Mark slot as focused
          draft.layout.slots.forEach(slot => {
            slot.isFocused = slot.id === slotId;
          });
        });
      },

      exitFocusMode: () => {
        set(draft => {
          if (draft.previousLayout) {
            draft.layout = createLayoutConfig(draft.previousLayout);
          }
          draft.focusedSlotId = null;
          draft.previousLayout = null;
          draft.layout.slots.forEach(slot => {
            slot.isFocused = false;
          });
        });
      },

      toggleFocus: (slotId: string) => {
        const state = get();
        if (state.focusedSlotId === slotId) {
          get().exitFocusMode();
        } else {
          get().enterFocusMode(slotId);
        }
      },

      // Slot visibility
      showSlot: (slotId: string) => {
        set(draft => {
          const slot = draft.layout.slots.find(s => s.id === slotId);
          if (slot) {
            slot.isVisible = true;
          }
        });
      },

      hideSlot: (slotId: string) => {
        set(draft => {
          const slot = draft.layout.slots.find(s => s.id === slotId);
          if (slot) {
            slot.isVisible = false;
          }
        });
      },

      toggleSlotVisibility: (slotId: string) => {
        set(draft => {
          const slot = draft.layout.slots.find(s => s.id === slotId);
          if (slot) {
            slot.isVisible = !slot.isVisible;
          }
        });
      },

      // Observer tools
      setTool: <K extends keyof ObserverTools>(tool: K, value: ObserverTools[K]) => {
        set(draft => {
          draft.tools[tool] = value;
        });
      },

      toggleTool: (tool: keyof ObserverTools) => {
        set(draft => {
          draft.tools[tool] = !draft.tools[tool];
        });
      },

      resetTools: () => {
        set(draft => {
          draft.tools = { ...DEFAULT_TOOLS };
        });
      },

      // Player management
      setAvailablePlayers: (players) => {
        set(draft => {
          draft.availablePlayers = players;
        });
      },

      updatePlayerStatus: (playerId: string, isAlive: boolean) => {
        set(draft => {
          const player = draft.availablePlayers.find(p => p.id === playerId);
          if (player) {
            player.isAlive = isAlive;
          }
        });
      },

      // Slot arrangement
      moveSlot: (slotId: string, position: { x: number; y: number }) => {
        set(draft => {
          const slot = draft.layout.slots.find(s => s.id === slotId);
          if (slot && draft.layout.isDraggable) {
            slot.position = {
              x: Math.max(0, Math.min(100 - slot.size.width, position.x)),
              y: Math.max(0, Math.min(100 - slot.size.height, position.y)),
            };
          }
        });
      },

      resizeSlot: (slotId: string, size: { width: number; height: number }) => {
        set(draft => {
          const slot = draft.layout.slots.find(s => s.id === slotId);
          if (slot && draft.layout.isResizable) {
            slot.size = {
              width: Math.max(10, Math.min(100 - slot.position.x, size.width)),
              height: Math.max(10, Math.min(100 - slot.position.y, size.height)),
            };
          }
        });
      },

      bringToFront: (slotId: string) => {
        set(draft => {
          const slot = draft.layout.slots.find(s => s.id === slotId);
          if (slot) {
            const maxZ = findMaxZIndex(draft.layout.slots);
            slot.zIndex = maxZ + 1;
          }
        });
      },

      // Presets
      loadPreset: (preset: LayoutType) => {
        get().setLayout(preset);
      },

      saveAsPreset: (name: string) => {
        // In a real implementation, this would save to localStorage or backend
        const state = get();
        const presetData = {
          name,
          layout: state.layout,
          timestamp: Date.now(),
        };
        
        try {
          const presets = JSON.parse(localStorage.getItem('multiview-presets') || '[]');
          presets.push(presetData);
          localStorage.setItem('multiview-presets', JSON.stringify(presets));
        } catch {
          // LocalStorage not available
        }
      },
    }))
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const useLayout = () => useMultiViewStore(state => state.layout);
export const useLayoutType = () => useMultiViewStore(state => state.layout.type);
export const useViewSlots = () => useMultiViewStore(state => state.layout.slots);
export const useVisibleSlots = () => 
  useMultiViewStore(state => state.layout.slots.filter(s => s.isVisible));
export const useSlotById = (slotId: string) => 
  useMultiViewStore(state => state.layout.slots.find(s => s.id === slotId));
export const useAvailablePlayers = () => useMultiViewStore(state => state.availablePlayers);
export const useAlivePlayers = () => 
  useMultiViewStore(state => state.availablePlayers.filter(p => p.isAlive !== false));
export const useTools = () => useMultiViewStore(state => state.tools);
export const useIsToolEnabled = (tool: keyof ObserverTools) => 
  useMultiViewStore(state => state.tools[tool]);
export const useFocusedSlot = () => useMultiViewStore(state => state.focusedSlotId);
export const useIsFocusMode = () => useMultiViewStore(state => state.focusedSlotId !== null);
export const usePreviousLayout = () => useMultiViewStore(state => state.previousLayout);

// ============================================================================
// Utility Functions
// ============================================================================

export function getLayoutDisplayName(type: LayoutType): string {
  const names: Record<LayoutType, string> = {
    single: 'Single View',
    split: 'Split Screen (2x1)',
    triple: 'Triple View',
    quad: 'Quad View (2x2)',
    'main-plus-3': 'Main + 3 Side',
    pip: 'Picture in Picture',
  };
  return names[type];
}

export function getAvailablePOVs(
  players: MultiViewState['availablePlayers'],
  currentSlotId: string,
  slots: ViewSlot[]
): Array<{ id: string | null; name: string; type: 'player' | 'free' | 'map' }> {
  const usedPlayerIds = new Set(
    slots
      .filter(s => s.id !== currentSlotId && s.pov.playerId !== null)
      .map(s => s.pov.playerId)
  );

  const options: Array<{ id: string | null; name: string; type: 'player' | 'free' | 'map' }> = [
    { id: null, name: 'Free Camera', type: 'free' },
    { id: 'map', name: 'Tactical Map', type: 'map' },
  ];

  players.forEach(player => {
    if (!usedPlayerIds.has(player.id)) {
      options.push({
        id: player.id,
        name: player.name,
        type: 'player',
      });
    }
  });

  return options;
}

export function validateLayout(layout: LayoutConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!layout.slots || layout.slots.length === 0) {
    errors.push('Layout must have at least one slot');
  }

  if (layout.slots.length > MAX_POV_COUNT) {
    errors.push(`Layout cannot have more than ${MAX_POV_COUNT} slots`);
  }

  // Check for overlapping slots
  for (let i = 0; i < layout.slots.length; i++) {
    for (let j = i + 1; j < layout.slots.length; j++) {
      const a = layout.slots[i];
      const b = layout.slots[j];
      
      if (
        a.position.x < b.position.x + b.size.width &&
        a.position.x + a.size.width > b.position.x &&
        a.position.y < b.position.y + b.size.height &&
        a.position.y + a.size.height > b.position.y
      ) {
        errors.push(`Slots ${a.id} and ${b.id} overlap`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

export default useMultiViewStore;
