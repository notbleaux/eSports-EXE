/** [Ver001.000] */
/**
 * Timeline Library Exports
 * ========================
 * Centralized exports for timeline state management and performance utilities.
 */

// State management
export {
  useTimelineStore,
  usePlaybackState,
  useCurrentTime,
  useDuration,
  useSpeed,
  useBounds,
  useLoopMode,
  useZoomLevel,
  useChapters,
  useActiveChapter,
  useCurrentTick,
  useTotalTicks,
  useProgress,
  formatTime,
  formatTick,
  parseTimeToMs,
  PLAYBACK_SPEEDS,
  DEFAULT_TICKS_PER_SECOND,
  SKIP_INTERVALS,
} from './state';

export type {
  PlaybackState,
  PlaybackSpeed,
  LoopMode,
  ZoomLevel,
  TimelineBounds,
  TimelineChapter,
  TimelineState,
  TimelineActions,
  TimelineStore,
} from './state';

// Performance utilities
export {
  throttle,
  debounce,
  RAFLoop,
  useSmoothScrub,
  usePerformanceMetrics,
  useVirtualTime,
  useVisibilityPause,
  FrameBuffer,
} from './performance';

export type {
  ThrottleOptions,
  RAFLoopOptions,
  UseSmoothScrubOptions,
  UseVirtualTimeOptions,
  PerformanceMetrics,
} from './performance';

// Default exports
export { default } from './state';
