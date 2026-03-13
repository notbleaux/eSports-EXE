/**
 * Grid Store - Quaternary Grid State Management (Legacy Compatibility)
 * Re-exports from split stores for backward compatibility
 * 
 * [Ver002.000] - Migrated to split stores
 */

// Import from split stores
export { 
  useDynamicStore, 
  usePanel, 
  usePanels, 
  useGroupViews, 
  useCurrentGroupId, 
  useCurrentGroup 
} from './dynamicStore';

export { 
  useStaticStore, 
  useGridConfig, 
  useCols, 
  useRowHeight 
} from './staticStore';

export { 
  useEphemeralStore, 
  useHoveredPanel, 
  useIsDragging, 
  useDragId 
} from './ephemeralStore';

// Legacy compatibility alias - useDynamicStore as useGridStore
export { useDynamicStore as useGridStore } from './dynamicStore';
