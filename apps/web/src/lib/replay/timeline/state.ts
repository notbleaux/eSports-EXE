// @ts-nocheck
/** [Ver001.000] */
/**
 * Timeline State Management
 * =========================
 * Zustand-based state machine for replay timeline control.
 * Handles play/pause, speed control, bounds, and loop modes.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// Types
// ============================================================================

export type PlaybackState = 'playing' | 'paused' | 'buffering' | 'ended';

export type PlaybackSpeed = 0.25 | 0.5 | 1 | 1.5 | 2 | 4;

export const PLAYBACK_SPEEDS: PlaybackSpeed[] = [0.25, 0.5, 1, 1.5, 2, 4];

export type LoopMode = 'none' | 'loop' | 'loop-round';

export type ZoomLevel = 'match' | 'round' | 'moment';

export interface TimelineBounds {
  start: number;
  end: number;
}

export interface TimelineChapter {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  type: 'round' | 'clutch' | 'highlight' | 'custom';
  color?: string;
}

export interface TimelineState {
  // Core playback state
  playbackState: PlaybackState;
  currentTime: number;
  duration: number;
  
  // Speed control
  speed: PlaybackSpeed;
  
  // Bounds management
  bounds: TimelineBounds;
  
  // Loop/repeat modes
  loopMode: LoopMode;
  
  // Zoom level
  zoomLevel: ZoomLevel;
  
  // Chapters/markers
  chapters: TimelineChapter[];
  activeChapterId: string | null;
  
  // Frame/Tick data
  currentTick: number;
  ticksPerSecond: number;
  totalTicks: number;
}

export interface TimelineActions {
  // Playback control
  play: () => void;
  pause: () => void;
  toggle: () => void;
  stop: () => void;
  seek: (time: number) => void;
  seekToTick: (tick: number) => void;
  
  // Speed control
  setSpeed: (speed: PlaybackSpeed) => void;
  cycleSpeed: (direction?: 'up' | 'down') => void;
  
  // Bounds management
  setBounds: (bounds: Partial<TimelineBounds>) => void;
  resetBounds: () => void;
  setZoomLevel: (level: ZoomLevel) => void;
  
  // Loop modes
  setLoopMode: (mode: LoopMode) => void;
  cycleLoopMode: () => void;
  
  // Frame advancement
  nextFrame: () => void;
  prevFrame: () => void;
  skipForward: (seconds?: number) => void;
  skipBackward: (seconds?: number) => void;
  nextChapter: () => void;
  prevChapter: () => void;
  
  // Chapter management
  setChapters: (chapters: TimelineChapter[]) => void;
  addChapter: (chapter: Omit<TimelineChapter, 'id'>) => string;
  removeChapter: (id: string) => void;
  updateChapter: (id: string, updates: Partial<TimelineChapter>) => void;
  jumpToChapter: (id: string) => void;
  
  // Duration/initialization
  setDuration: (duration: number) => void;
  setTicksPerSecond: (tps: number) => void;
  
  // Time update (called by animation loop)
  advanceTime: (deltaMs: number) => void;
}

export type TimelineStore = TimelineState & TimelineActions;

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_TICKS_PER_SECOND = 20; // Valorant runs at 20 TPS

export const SKIP_INTERVALS = {
  short: 5,    // 5 seconds
  medium: 10,  // 10 seconds
  round: 100,  // ~1.5 min rounds typical
} as const;

// ============================================================================
// Helper Functions
// ============================================================================

const clampTime = (time: number, bounds: TimelineBounds): number => {
  return Math.max(bounds.start, Math.min(bounds.end, time));
};

const timeToTick = (time: number, tps: number): number => {
  return Math.floor((time / 1000) * tps);
};

const tickToTime = (tick: number, tps: number): number => {
  return (tick / tps) * 1000;
};

const findCurrentChapter = (
  time: number,
  chapters: TimelineChapter[]
): TimelineChapter | null => {
  return chapters.find(ch => time >= ch.startTime && time <= ch.endTime) || null;
};

const findNextChapter = (
  time: number,
  chapters: TimelineChapter[]
): TimelineChapter | null => {
  const sorted = [...chapters].sort((a, b) => a.startTime - b.startTime);
  return sorted.find(ch => ch.startTime > time) || sorted[0] || null;
};

const findPrevChapter = (
  time: number,
  chapters: TimelineChapter[]
): TimelineChapter | null => {
  const sorted = [...chapters].sort((a, b) => b.startTime - a.startTime);
  return sorted.find(ch => ch.endTime < time) || sorted[0] || null;
};

// ============================================================================
// Store Creation
// ============================================================================

const initialState: TimelineState = {
  playbackState: 'paused',
  currentTime: 0,
  duration: 0,
  speed: 1,
  bounds: { start: 0, end: 0 },
  loopMode: 'none',
  zoomLevel: 'match',
  chapters: [],
  activeChapterId: null,
  currentTick: 0,
  ticksPerSecond: DEFAULT_TICKS_PER_SECOND,
  totalTicks: 0,
};

export const useTimelineStore = create<TimelineStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Playback control
      play: () => {
        const state = get();
        if (state.currentTime >= state.bounds.end && state.loopMode === 'none') {
          // Restart if at end
          set(draft => {
            draft.playbackState = 'playing';
            draft.currentTime = draft.bounds.start;
            draft.currentTick = timeToTick(draft.currentTime, draft.ticksPerSecond);
          });
        } else {
          set(draft => {
            draft.playbackState = 'playing';
          });
        }
      },

      pause: () => {
        set(draft => {
          draft.playbackState = 'paused';
        });
      },

      toggle: () => {
        const state = get();
        if (state.playbackState === 'playing') {
          get().pause();
        } else {
          get().play();
        }
      },

      stop: () => {
        set(draft => {
          draft.playbackState = 'paused';
          draft.currentTime = draft.bounds.start;
          draft.currentTick = timeToTick(draft.currentTime, draft.ticksPerSecond);
        });
      },

      seek: (time: number) => {
        const state = get();
        const clampedTime = clampTime(time, state.bounds);
        set(draft => {
          draft.currentTime = clampedTime;
          draft.currentTick = timeToTick(clampedTime, draft.ticksPerSecond);
          draft.activeChapterId = findCurrentChapter(clampedTime, draft.chapters)?.id || null;
          
          // Reset to playing if ended and seeking backward
          if (draft.playbackState === 'ended' && clampedTime < draft.bounds.end) {
            draft.playbackState = 'paused';
          }
        });
      },

      seekToTick: (tick: number) => {
        const state = get();
        const time = tickToTime(tick, state.ticksPerSecond);
        get().seek(time);
      },

      // Speed control
      setSpeed: (speed: PlaybackSpeed) => {
        set(draft => {
          draft.speed = speed;
        });
      },

      cycleSpeed: (direction: 'up' | 'down' = 'up') => {
        const state = get();
        const currentIndex = PLAYBACK_SPEEDS.indexOf(state.speed);
        let newIndex: number;
        
        if (direction === 'up') {
          newIndex = (currentIndex + 1) % PLAYBACK_SPEEDS.length;
        } else {
          newIndex = currentIndex === 0 ? PLAYBACK_SPEEDS.length - 1 : currentIndex - 1;
        }
        
        set(draft => {
          draft.speed = PLAYBACK_SPEEDS[newIndex];
        });
      },

      // Bounds management
      setBounds: (bounds: Partial<TimelineBounds>) => {
        set(draft => {
          draft.bounds = { ...draft.bounds, ...bounds };
          // Ensure current time stays within bounds
          draft.currentTime = clampTime(draft.currentTime, draft.bounds);
          draft.currentTick = timeToTick(draft.currentTime, draft.ticksPerSecond);
        });
      },

      resetBounds: () => {
        set(draft => {
          draft.bounds = { start: 0, end: draft.duration };
          draft.currentTime = clampTime(draft.currentTime, draft.bounds);
          draft.currentTick = timeToTick(draft.currentTime, draft.ticksPerSecond);
        });
      },

      setZoomLevel: (level: ZoomLevel) => {
        set(draft => {
          draft.zoomLevel = level;
        });
      },

      // Loop modes
      setLoopMode: (mode: LoopMode) => {
        set(draft => {
          draft.loopMode = mode;
        });
      },

      cycleLoopMode: () => {
        const modes: LoopMode[] = ['none', 'loop', 'loop-round'];
        const state = get();
        const currentIndex = modes.indexOf(state.loopMode);
        const newMode = modes[(currentIndex + 1) % modes.length];
        set(draft => {
          draft.loopMode = newMode;
        });
      },

      // Frame advancement
      nextFrame: () => {
        const state = get();
        const tickDuration = 1000 / state.ticksPerSecond;
        get().seek(state.currentTime + tickDuration);
      },

      prevFrame: () => {
        const state = get();
        const tickDuration = 1000 / state.ticksPerSecond;
        get().seek(state.currentTime - tickDuration);
      },

      skipForward: (seconds = SKIP_INTERVALS.short) => {
        const state = get();
        get().seek(state.currentTime + seconds * 1000);
      },

      skipBackward: (seconds = SKIP_INTERVALS.short) => {
        const state = get();
        get().seek(state.currentTime - seconds * 1000);
      },

      nextChapter: () => {
        const state = get();
        const next = findNextChapter(state.currentTime, state.chapters);
        if (next) {
          get().jumpToChapter(next.id);
        }
      },

      prevChapter: () => {
        const state = get();
        const prev = findPrevChapter(state.currentTime, state.chapters);
        if (prev) {
          get().jumpToChapter(prev.id);
        }
      },

      // Chapter management
      setChapters: (chapters: TimelineChapter[]) => {
        set(draft => {
          draft.chapters = chapters;
          draft.activeChapterId = findCurrentChapter(draft.currentTime, chapters)?.id || null;
        });
      },

      addChapter: (chapter: Omit<TimelineChapter, 'id'>): string => {
        const id = `chapter-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        set(draft => {
          draft.chapters.push({ ...chapter, id });
        });
        return id;
      },

      removeChapter: (id: string) => {
        set(draft => {
          draft.chapters = draft.chapters.filter(ch => ch.id !== id);
          if (draft.activeChapterId === id) {
            draft.activeChapterId = null;
          }
        });
      },

      updateChapter: (id: string, updates: Partial<TimelineChapter>) => {
        set(draft => {
          const chapter = draft.chapters.find(ch => ch.id === id);
          if (chapter) {
            Object.assign(chapter, updates);
          }
        });
      },

      jumpToChapter: (id: string) => {
        const state = get();
        const chapter = state.chapters.find(ch => ch.id === id);
        if (chapter) {
          set(draft => {
            draft.currentTime = chapter.startTime;
            draft.currentTick = timeToTick(chapter.startTime, draft.ticksPerSecond);
            draft.activeChapterId = id;
            draft.playbackState = 'paused';
          });
        }
      },

      // Duration/initialization
      setDuration: (duration: number) => {
        set(draft => {
          draft.duration = duration;
          draft.bounds = { start: 0, end: duration };
          draft.totalTicks = timeToTick(duration, draft.ticksPerSecond);
        });
      },

      setTicksPerSecond: (tps: number) => {
        set(draft => {
          draft.ticksPerSecond = tps;
          draft.currentTick = timeToTick(draft.currentTime, tps);
          draft.totalTicks = timeToTick(draft.duration, tps);
        });
      },

      // Time update (called by animation loop)
      advanceTime: (deltaMs: number) => {
        const state = get();
        if (state.playbackState !== 'playing') return;

        const adjustedDelta = deltaMs * state.speed;
        let newTime = state.currentTime + adjustedDelta;

        set(draft => {
          // Handle loop modes
          if (newTime >= draft.bounds.end) {
            switch (draft.loopMode) {
              case 'loop':
                newTime = draft.bounds.start;
                break;
              case 'loop-round':
                // Loop within current chapter if it's a round
                const currentChapter = draft.chapters.find(ch => ch.id === draft.activeChapterId);
                if (currentChapter && currentChapter.type === 'round') {
                  newTime = currentChapter.startTime;
                } else {
                  newTime = draft.bounds.start;
                }
                break;
              case 'none':
              default:
                newTime = draft.bounds.end;
                draft.playbackState = 'ended';
                break;
            }
          }

          draft.currentTime = newTime;
          draft.currentTick = timeToTick(newTime, draft.ticksPerSecond);
          draft.activeChapterId = findCurrentChapter(newTime, draft.chapters)?.id || draft.activeChapterId;
        });
      },
    }))
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const usePlaybackState = () => useTimelineStore(state => state.playbackState);
export const useCurrentTime = () => useTimelineStore(state => state.currentTime);
export const useDuration = () => useTimelineStore(state => state.duration);
export const useSpeed = () => useTimelineStore(state => state.speed);
export const useBounds = () => useTimelineStore(state => state.bounds);
export const useLoopMode = () => useTimelineStore(state => state.loopMode);
export const useZoomLevel = () => useTimelineStore(state => state.zoomLevel);
export const useChapters = () => useTimelineStore(state => state.chapters);
export const useActiveChapter = () => 
  useTimelineStore(state => state.chapters.find(ch => ch.id === state.activeChapterId));
export const useCurrentTick = () => useTimelineStore(state => state.currentTick);
export const useTotalTicks = () => useTimelineStore(state => state.totalTicks);
export const useProgress = () => 
  useTimelineStore(state => state.duration > 0 ? state.currentTime / state.duration : 0);

// ============================================================================
// Utility Functions
// ============================================================================

export const formatTime = (ms: number, showMs = true): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  if (!showMs) {
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  
  const milliseconds = Math.floor((ms % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

export const formatTick = (tick: number): string => {
  return `Tick ${tick}`;
};

export const parseTimeToMs = (timeStr: string): number => {
  // Parse formats: "mm:ss.ms", "mm:ss", "ss"
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const [min, secMs] = parts;
    const [sec, ms] = secMs.split('.');
    return parseInt(min) * 60000 + parseInt(sec) * 1000 + (parseInt(ms || '0') * 10);
  }
  return parseInt(parts[0]) * 1000;
};

export default useTimelineStore;
