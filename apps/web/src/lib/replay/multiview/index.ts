// @ts-nocheck
/** [Ver001.000] */
/**
 * Multi-view Module Exports
 * =========================
 * Centralized exports for replay multi-view system.
 * 
 * Agent: TL-S2-2-D
 * Team: Replay 2.0 Core (TL-S2)
 */

// State Management
export {
  useMultiViewStore,
  LAYOUT_PRESETS,
  DEFAULT_TOOLS,
  MAX_POV_COUNT,
  MAX_SYNC_DRIFT_MS,
  useLayout,
  useLayoutType,
  useViewSlots,
  useVisibleSlots,
  useSlotById,
  useAvailablePlayers,
  useAlivePlayers,
  useTools,
  useIsToolEnabled,
  useFocusedSlot,
  useIsFocusMode,
  usePreviousLayout,
  getLayoutDisplayName,
  getAvailablePOVs,
  validateLayout,
} from './state';

export type {
  LayoutType,
  POVAssignment,
  ViewSlot,
  LayoutConfig,
  ObserverTools,
  MultiViewState,
  MultiViewActions,
  MultiViewStore,
} from './state';

// Timeline Synchronization
export {
  SyncManager,
  useSyncManager,
  SYNC_CONSTANTS,
  getSyncStatusIndicator,
  calculateAdaptiveBuffer,
  formatDrift,
  isSyncAcceptable,
} from './sync';

export type {
  ViewSyncStatus,
  SyncState,
  BufferConfig,
  SyncEventType,
  SyncEvent,
  SyncAdapter,
  UseSyncManagerOptions,
  UseSyncManagerReturn,
  SyncStatusIndicator,
} from './sync';

// POV Switcher
export {
  POVSwitcher,
  TransitionController,
  POVAvailabilityChecker,
  TRANSITION_PRESETS,
  MAX_PLAYERS,
  DEFAULT_TRANSITION_DURATION,
  usePOVSwitcher,
  getTransitionDisplayName,
  getPOVDisplayName,
  validatePOV,
} from './povSwitcher';

export type {
  TransitionType,
  TransitionConfig,
  POVSwitchOptions,
  PlayerPOV,
  POVAvailability,
  CameraPosition,
  UsePOVSwitcherOptions,
  UsePOVSwitcherReturn,
} from './povSwitcher';
