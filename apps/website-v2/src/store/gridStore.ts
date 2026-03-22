/**
 * Grid Store - Quaternary Grid State Management (Legacy Compatibility)
 * Re-exports from split stores for backward compatibility
 * 
 * [Ver003.000] - Converted to TypeScript
 */

// Re-export types from split stores
export type { Panel, GroupView, DynamicState } from './dynamicStore';
export type { GridConfig } from './staticStore';
export type { DragState, HoverState, ScrollState, EphemeralState } from './ephemeralStore';
export type { AppMode, ModeColors, ModeState } from './modeStore';

// Import from split stores
export {
  useDynamicStore,
  usePanel,
  usePanels,
  useGroupViews,
  useCurrentGroupId,
  useCurrentGroup,
} from './dynamicStore';

export {
  useStaticStore,
  useGridConfig,
  useCols,
  useRowHeight,
} from './staticStore';

export {
  useEphemeralStore,
  useHoveredPanel,
  useIsDragging,
  useDragId,
} from './ephemeralStore';

// Legacy compatibility alias - useDynamicStore as useGridStore
export { useDynamicStore as useGridStore } from './dynamicStore';
