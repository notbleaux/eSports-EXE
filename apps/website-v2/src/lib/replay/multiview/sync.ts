/** [Ver001.000] */
/**
 * Timeline Synchronization
 * ========================
 * Multi-view timeline synchronization with buffer management
 * and sync status indicators.
 * 
 * Targets: Sync <50ms drift, 5 POV support
 * Agent: TL-S2-2-D
 * Team: Replay 2.0 Core (TL-S2)
 */

import { useTimelineStore, type PlaybackState } from '../timeline/state';
import { MAX_SYNC_DRIFT_MS } from './state';
import { createLogger } from '@/utils/logger';

const logger = createLogger('SyncManager');

// ============================================================================
// Types
// ============================================================================

/** Sync status for a view */
export interface ViewSyncStatus {
  viewId: string;
  currentTime: number;
  bufferedEnd: number;
  bufferHealth: number; // 0-1
  drift: number; // ms from master time
  isSynced: boolean;
  lastUpdate: number;
}

/** Master sync state */
export interface SyncState {
  masterTime: number;
  isPlaying: boolean;
  playbackSpeed: number;
  viewStatuses: Map<string, ViewSyncStatus>;
  globalBufferHealth: number;
  worstDrift: number;
  allSynced: boolean;
}

/** Buffer configuration */
export interface BufferConfig {
  /** Pre-buffer duration in ms */
  preBuffer: number;
  /** Post-buffer duration in ms */
  postBuffer: number;
  /** Maximum buffer size in MB */
  maxSizeMB: number;
  /** Buffer low threshold (0-1) */
  lowThreshold: number;
}

/** Sync event types */
export type SyncEventType = 
  | 'time-update'
  | 'buffer-update'
  | 'sync-lost'
  | 'sync-restored'
  | 'playback-change'
  | 'speed-change';

export interface SyncEvent {
  type: SyncEventType;
  timestamp: number;
  viewId?: string;
  data?: unknown;
}

/** Sync adapter interface for different view types */
export interface SyncAdapter {
  id: string;
  getCurrentTime(): number;
  seek(time: number): void;
  setPlaybackSpeed(speed: number): void;
  getBufferEnd(): number;
  isReady(): boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const SYNC_CONSTANTS = {
  /** Maximum allowed drift in milliseconds */
  MAX_DRIFT_MS: MAX_SYNC_DRIFT_MS,
  /** Sync check interval in ms */
  CHECK_INTERVAL_MS: 16, // ~60fps
  /** Buffer health check interval in ms */
  BUFFER_CHECK_INTERVAL_MS: 100,
  /** Default buffer configuration */
  DEFAULT_BUFFER_CONFIG: {
    preBuffer: 2000, // 2 seconds ahead
    postBuffer: 1000, // 1 second behind
    maxSizeMB: 50,
    lowThreshold: 0.3,
  } as BufferConfig,
  /** Sync recovery threshold (when to resync) */
  RESYNC_THRESHOLD_MS: 100,
  /** Smooth seek threshold (interpolate vs jump) */
  SMOOTH_SEEK_THRESHOLD_MS: 500,
} as const;

// ============================================================================
// Sync Manager Class
// ============================================================================

export class SyncManager {
  private adapters = new Map<string, SyncAdapter>();
  private statusMap = new Map<string, ViewSyncStatus>();
  private masterTime = 0;
  private isPlaying = false;
  private playbackSpeed = 1;
  private bufferConfig: BufferConfig;
  private checkInterval: number | null = null;
  private bufferCheckInterval: number | null = null;
  private eventListeners = new Set<(event: SyncEvent) => void>();
  private lastMasterUpdate = 0;

  constructor(config: Partial<BufferConfig> = {}) {
    this.bufferConfig = { ...SYNC_CONSTANTS.DEFAULT_BUFFER_CONFIG, ...config };
  }

  /** Register a view adapter */
  registerAdapter(adapter: SyncAdapter): void {
    this.adapters.set(adapter.id, adapter);
    this.statusMap.set(adapter.id, {
      viewId: adapter.id,
      currentTime: 0,
      bufferedEnd: 0,
      bufferHealth: 0,
      drift: 0,
      isSynced: false,
      lastUpdate: Date.now(),
    });
  }

  /** Unregister a view adapter */
  unregisterAdapter(viewId: string): void {
    this.adapters.delete(viewId);
    this.statusMap.delete(viewId);
  }

  /** Set master time and sync all views */
  setMasterTime(time: number, forceSync = false): void {
    this.masterTime = time;
    this.lastMasterUpdate = Date.now();

    this.adapters.forEach((adapter, viewId) => {
      const status = this.statusMap.get(viewId);
      if (!status) return;

      const viewTime = adapter.getCurrentTime();
      const drift = Math.abs(viewTime - time);

      // Update status
      status.currentTime = viewTime;
      status.drift = drift;
      status.lastUpdate = Date.now();

      // Determine if sync is needed
      if (forceSync || drift > SYNC_CONSTANTS.MAX_DRIFT_MS) {
        if (drift > SYNC_CONSTANTS.RESYNC_THRESHOLD_MS) {
          // Hard seek for large differences
          adapter.seek(time);
        } else {
          // Smooth interpolation for small differences
          this.smoothSync(adapter, time, viewTime);
        }
      }

      status.isSynced = status.drift <= SYNC_CONSTANTS.MAX_DRIFT_MS;
    });

    this.emitEvent({ type: 'time-update', timestamp: Date.now(), data: { time } });
  }

  /** Smoothly sync a view to master time */
  private smoothSync(adapter: SyncAdapter, targetTime: number, currentTime: number): void {
    const drift = targetTime - currentTime;
    const adjustment = drift * 0.1; // 10% adjustment per frame
    adapter.seek(currentTime + adjustment);
  }

  /** Set playback state for all views */
  setPlaybackState(isPlaying: boolean): void {
    this.isPlaying = isPlaying;
    this.emitEvent({ 
      type: 'playback-change', 
      timestamp: Date.now(), 
      data: { isPlaying } 
    });
  }

  /** Set playback speed for all views */
  setPlaybackSpeed(speed: number): void {
    this.playbackSpeed = speed;
    this.adapters.forEach(adapter => {
      adapter.setPlaybackSpeed(speed);
    });
    this.emitEvent({ 
      type: 'speed-change', 
      timestamp: Date.now(), 
      data: { speed } 
    });
  }

  /** Update buffer status for a view */
  updateBuffer(viewId: string, bufferedEnd: number): void {
    const status = this.statusMap.get(viewId);
    if (!status) return;

    const bufferAhead = bufferedEnd - this.masterTime;
    const maxBuffer = this.bufferConfig.preBuffer + this.bufferConfig.postBuffer;
    const bufferHealth = Math.min(bufferAhead / maxBuffer, 1);

    status.bufferedEnd = bufferedEnd;
    status.bufferHealth = Math.max(0, bufferHealth);

    // Check if buffer is critically low
    if (bufferHealth < this.bufferConfig.lowThreshold && this.isPlaying) {
      this.emitEvent({
        type: 'buffer-update',
        timestamp: Date.now(),
        viewId,
        data: { bufferHealth, status: 'low' },
      });
    }

    this.statusMap.set(viewId, status);
  }

  /** Get current sync state */
  getSyncState(): SyncState {
    const viewStatuses = new Map(this.statusMap);
    const statuses = Array.from(viewStatuses.values());
    
    const globalBufferHealth = statuses.length > 0
      ? statuses.reduce((sum, s) => sum + s.bufferHealth, 0) / statuses.length
      : 1;
    
    const worstDrift = statuses.length > 0
      ? Math.max(...statuses.map(s => s.drift))
      : 0;
    
    const allSynced = statuses.every(s => s.isSynced);

    return {
      masterTime: this.masterTime,
      isPlaying: this.isPlaying,
      playbackSpeed: this.playbackSpeed,
      viewStatuses,
      globalBufferHealth,
      worstDrift,
      allSynced,
    };
  }

  /** Get sync status for a specific view */
  getViewStatus(viewId: string): ViewSyncStatus | undefined {
    return this.statusMap.get(viewId);
  }

  /** Check if all views are ready */
  areAllViewsReady(): boolean {
    return Array.from(this.adapters.values()).every(a => a.isReady());
  }

  /** Wait for all views to be ready */
  async waitForAllReady(timeoutMs = 5000): Promise<boolean> {
    const startTime = Date.now();
    
    while (Date.now() - startTime < timeoutMs) {
      if (this.areAllViewsReady()) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    return false;
  }

  /** Start continuous sync monitoring */
  startSync(): void {
    if (this.checkInterval !== null) return;

    // Time sync check at ~60fps
    this.checkInterval = window.setInterval(() => {
      this.checkSync();
    }, SYNC_CONSTANTS.CHECK_INTERVAL_MS);

    // Buffer health check at lower frequency
    this.bufferCheckInterval = window.setInterval(() => {
      this.checkBufferHealth();
    }, SYNC_CONSTANTS.BUFFER_CHECK_INTERVAL_MS);
  }

  /** Stop continuous sync monitoring */
  stopSync(): void {
    if (this.checkInterval !== null) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    if (this.bufferCheckInterval !== null) {
      clearInterval(this.bufferCheckInterval);
      this.bufferCheckInterval = null;
    }
  }

  /** Perform sync check on all views */
  private checkSync(): void {
    const state = this.getSyncState();
    
    if (!state.allSynced) {
      const unsyncedViews = Array.from(state.viewStatuses.entries())
        .filter(([, status]) => !status.isSynced)
        .map(([id]) => id);

      this.emitEvent({
        type: 'sync-lost',
        timestamp: Date.now(),
        data: { unsyncedViews, worstDrift: state.worstDrift },
      });
    } else if (state.worstDrift <= SYNC_CONSTANTS.MAX_DRIFT_MS / 2) {
      // Emit sync restored when all views are well within threshold
      this.emitEvent({
        type: 'sync-restored',
        timestamp: Date.now(),
        data: { worstDrift: state.worstDrift },
      });
    }
  }

  /** Check buffer health for all views */
  private checkBufferHealth(): void {
    this.adapters.forEach((adapter, viewId) => {
      const bufferedEnd = adapter.getBufferEnd();
      this.updateBuffer(viewId, bufferedEnd);
    });
  }

  /** Add event listener */
  onEvent(listener: (event: SyncEvent) => void): () => void {
    this.eventListeners.add(listener);
    return () => this.eventListeners.delete(listener);
  }

  /** Emit event to all listeners */
  private emitEvent(event: SyncEvent): void {
    this.eventListeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        logger.error('Sync event listener error', { error: error instanceof Error ? error.message : String(error) });
      }
    });
  }

  /** Destroy the sync manager */
  destroy(): void {
    this.stopSync();
    this.adapters.clear();
    this.statusMap.clear();
    this.eventListeners.clear();
  }
}

// ============================================================================
// React Integration Hook
// ============================================================================

import { useEffect, useRef, useCallback, useState } from 'react';

export interface UseSyncManagerOptions {
  bufferConfig?: Partial<BufferConfig>;
  onSyncLost?: (viewIds: string[], drift: number) => void;
  onSyncRestored?: (drift: number) => void;
  onBufferLow?: (viewId: string, health: number) => void;
}

export interface UseSyncManagerReturn {
  manager: SyncManager;
  syncState: SyncState;
  registerView: (adapter: SyncAdapter) => void;
  unregisterView: (viewId: string) => void;
  isReady: boolean;
}

/**
 * React hook for sync manager integration
 * Connects to the timeline store for automatic time synchronization
 */
export function useSyncManager(options: UseSyncManagerOptions = {}): UseSyncManagerReturn {
  const managerRef = useRef<SyncManager>(new SyncManager(options.bufferConfig));
  const [syncState, setSyncState] = useState<SyncState>(managerRef.current.getSyncState());
  const [isReady, setIsReady] = useState(false);
  const animationFrameRef = useRef<number | null>(null);

  // Subscribe to timeline store
  useEffect(() => {
    const timelineStore = useTimelineStore;
    
    // Subscribe to time updates
    const unsubscribeTime = timelineStore.subscribe(
      state => state.currentTime,
      (currentTime) => {
        managerRef.current.setMasterTime(currentTime);
      }
    );

    // Subscribe to playback state
    const unsubscribePlayback = timelineStore.subscribe(
      state => state.playbackState,
      (playbackState) => {
        const isPlaying = playbackState === 'playing';
        managerRef.current.setPlaybackState(isPlaying);
        
        if (isPlaying) {
          managerRef.current.startSync();
        } else {
          managerRef.current.stopSync();
        }
      }
    );

    // Subscribe to speed changes
    const unsubscribeSpeed = timelineStore.subscribe(
      state => state.speed,
      (speed) => {
        managerRef.current.setPlaybackSpeed(speed);
      }
    );

    // Start update loop for sync state
    const updateSyncState = () => {
      setSyncState(managerRef.current.getSyncState());
      animationFrameRef.current = requestAnimationFrame(updateSyncState);
    };
    animationFrameRef.current = requestAnimationFrame(updateSyncState);

    return () => {
      unsubscribeTime();
      unsubscribePlayback();
      unsubscribeSpeed();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Event handlers
  useEffect(() => {
    const { onSyncLost, onSyncRestored, onBufferLow } = options;
    
    return managerRef.current.onEvent((event) => {
      switch (event.type) {
        case 'sync-lost':
          if (onSyncLost && event.data) {
            const { unsyncedViews, worstDrift } = event.data as { unsyncedViews: string[]; worstDrift: number };
            onSyncLost(unsyncedViews, worstDrift);
          }
          break;
        case 'sync-restored':
          if (onSyncRestored && event.data) {
            onSyncRestored((event.data as { worstDrift: number }).worstDrift);
          }
          break;
        case 'buffer-update':
          if (onBufferLow && event.viewId && event.data) {
            const { bufferHealth, status } = event.data as { bufferHealth: number; status: string };
            if (status === 'low') {
              onBufferLow(event.viewId, bufferHealth);
            }
          }
          break;
      }
    });
  }, [options.onSyncLost, options.onSyncRestored, options.onBufferLow]);

  // Wait for ready state
  useEffect(() => {
    managerRef.current.waitForAllReady().then(setIsReady);
  }, []);

  const registerView = useCallback((adapter: SyncAdapter) => {
    managerRef.current.registerAdapter(adapter);
  }, []);

  const unregisterView = useCallback((viewId: string) => {
    managerRef.current.unregisterAdapter(viewId);
  }, []);

  return {
    manager: managerRef.current,
    syncState,
    registerView,
    unregisterView,
    isReady,
  };
}

// ============================================================================
// Sync Status Indicator Component Logic
// ============================================================================

export interface SyncStatusIndicator {
  /** Overall status color */
  color: 'green' | 'yellow' | 'red' | 'gray';
  /** Status message */
  message: string;
  /** Sync drift in ms */
  drift: number;
  /** Buffer health percentage */
  bufferHealth: number;
  /** Number of synced views */
  syncedCount: number;
  /** Total number of views */
  totalCount: number;
}

export function getSyncStatusIndicator(state: SyncState): SyncStatusIndicator {
  const { allSynced, worstDrift, globalBufferHealth } = state;
  const totalCount = state.viewStatuses.size;
  const syncedCount = Array.from(state.viewStatuses.values()).filter(s => s.isSynced).length;

  let color: SyncStatusIndicator['color'] = 'gray';
  let message = 'Sync idle';

  if (state.isPlaying) {
    if (allSynced) {
      color = 'green';
      message = `All synced (${Math.round(worstDrift)}ms drift)`;
    } else if (worstDrift <= SYNC_CONSTANTS.RESYNC_THRESHOLD_MS) {
      color = 'yellow';
      message = `Sync recovering (${Math.round(worstDrift)}ms drift)`;
    } else {
      color = 'red';
      message = `Sync lost! (${Math.round(worstDrift)}ms drift)`;
    }
  }

  return {
    color,
    message,
    drift: worstDrift,
    bufferHealth: globalBufferHealth,
    syncedCount,
    totalCount,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate adaptive buffer size based on network conditions
 */
export function calculateAdaptiveBuffer(
  baseBuffer: number,
  recentLatencies: number[]
): number {
  if (recentLatencies.length === 0) return baseBuffer;

  const avgLatency = recentLatencies.reduce((a, b) => a + b, 0) / recentLatencies.length;
  const maxLatency = Math.max(...recentLatencies);
  const variance = recentLatencies.reduce((sum, lat) => sum + Math.pow(lat - avgLatency, 2), 0) / recentLatencies.length;
  const stdDev = Math.sqrt(variance);

  // Increase buffer for high variance or high latency
  const multiplier = 1 + (stdDev / avgLatency) * 0.5 + (maxLatency / avgLatency - 1) * 0.3;
  
  return Math.min(baseBuffer * multiplier, baseBuffer * 3);
}

/**
 * Format drift for display
 */
export function formatDrift(driftMs: number): string {
  if (driftMs < 1) return '<1ms';
  if (driftMs < 1000) return `${Math.round(driftMs)}ms`;
  return `${(driftMs / 1000).toFixed(1)}s`;
}

/**
 * Check if sync is within acceptable range
 */
export function isSyncAcceptable(driftMs: number): boolean {
  return driftMs <= SYNC_CONSTANTS.MAX_DRIFT_MS;
}

export default SyncManager;
