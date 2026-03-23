/** [Ver001.000] */
/**
 * POV Switcher
 * ===========
 * Player Point-of-View switching with smooth transitions
 * and availability checking for 10 player matches.
 * 
 * Targets: 10 player POVs, smooth transitions
 * Agent: TL-S2-2-D
 * Team: Replay 2.0 Core (TL-S2)
 */

import { useTimelineStore } from '../timeline/state';
import { useMultiViewStore, type POVAssignment, type ViewSlot } from './state';
import { SyncManager, type SyncAdapter } from './sync';

// ============================================================================
// Types
// ============================================================================

/** Transition type for POV switches */
export type TransitionType = 'instant' | 'fade' | 'slide' | 'zoom' | 'crossfade';

/** Transition configuration */
export interface TransitionConfig {
  type: TransitionType;
  duration: number;
  easing: string;
}

/** POV switch options */
export interface POVSwitchOptions {
  /** Transition type */
  transition?: TransitionType;
  /** Transition duration in ms */
  duration?: number;
  /** Whether to maintain timeline position */
  maintainTime?: boolean;
  /** Callback when transition completes */
  onComplete?: () => void;
}

/** Player POV information */
export interface PlayerPOV {
  playerId: string;
  playerName: string;
  teamId: string;
  teamSide: string;
  agent?: string;
  isAlive: boolean;
  isAvailable: boolean;
  isCurrentPOV: boolean;
}

/** POV availability status */
export interface POVAvailability {
  playerId: string;
  isAvailable: boolean;
  reason?: 'alive' | 'dead' | 'disconnected' | 'spectating' | 'in-use';
  currentViewer?: string;
}

/** Camera position for transitions */
export interface CameraPosition {
  position: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  fov: number;
}

// ============================================================================
// Constants
// ============================================================================

export const TRANSITION_PRESETS: Record<TransitionType, TransitionConfig> = {
  instant: { type: 'instant', duration: 0, easing: 'none' },
  fade: { type: 'fade', duration: 300, easing: 'ease-in-out' },
  slide: { type: 'slide', duration: 400, easing: 'ease-out' },
  zoom: { type: 'zoom', duration: 500, easing: 'ease-in-out' },
  crossfade: { type: 'crossfade', duration: 600, easing: 'ease-in-out' },
};

/** Maximum number of players in a match */
export const MAX_PLAYERS = 10;

/** Default transition duration */
export const DEFAULT_TRANSITION_DURATION = 300;

// ============================================================================
// Transition Controller
// ============================================================================

export class TransitionController {
  private isTransitioning = false;
  private currentTransition: TransitionConfig | null = null;
  private abortController: AbortController | null = null;
  private onCompleteCallbacks: (() => void)[] = [];

  /**
   * Start a transition
   */
  async startTransition(
    config: TransitionConfig,
    fromState: CameraPosition | null,
    toState: CameraPosition
  ): Promise<void> {
    // Abort any ongoing transition
    if (this.abortController) {
      this.abortController.abort();
    }

    this.isTransitioning = true;
    this.currentTransition = config;
    this.abortController = new AbortController();
    const { signal } = this.abortController;

    // Instant transition
    if (config.type === 'instant' || config.duration === 0) {
      this.isTransitioning = false;
      this.executeCallbacks();
      return;
    }

    // Animated transition
    const startTime = performance.now();
    const duration = config.duration;

    return new Promise((resolve, reject) => {
      const animate = (currentTime: number) => {
        if (signal.aborted) {
          reject(new Error('Transition aborted'));
          return;
        }

        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = this.applyEasing(progress, config.easing);

        // Interpolate camera position if we have fromState
        if (fromState) {
          this.interpolateCamera(fromState, toState, easedProgress);
        }

        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          this.isTransitioning = false;
          this.executeCallbacks();
          resolve();
        }
      };

      requestAnimationFrame(animate);
    });
  }

  /**
   * Check if a transition is currently active
   */
  isActive(): boolean {
    return this.isTransitioning;
  }

  /**
   * Abort current transition
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.isTransitioning = false;
  }

  /**
   * Add completion callback
   */
  onComplete(callback: () => void): void {
    this.onCompleteCallbacks.push(callback);
  }

  private executeCallbacks(): void {
    this.onCompleteCallbacks.forEach(cb => {
      try { cb(); } catch (e) { /* ignore */ }
    });
    this.onCompleteCallbacks = [];
  }

  private applyEasing(t: number, easing: string): number {
    switch (easing) {
      case 'ease-in':
        return t * t;
      case 'ease-out':
        return 1 - (1 - t) * (1 - t);
      case 'ease-in-out':
        return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      default:
        return t;
    }
  }

  private interpolateCamera(
    from: CameraPosition,
    to: CameraPosition,
    t: number
  ): CameraPosition {
    return {
      position: {
        x: from.position.x + (to.position.x - from.position.x) * t,
        y: from.position.y + (to.position.y - from.position.y) * t,
        z: from.position.z + (to.position.z - from.position.z) * t,
      },
      rotation: {
        pitch: from.rotation.pitch + (to.rotation.pitch - from.rotation.pitch) * t,
        yaw: from.rotation.yaw + (to.rotation.yaw - from.rotation.yaw) * t,
        roll: from.rotation.roll + (to.rotation.roll - from.rotation.roll) * t,
      },
      fov: from.fov + (to.fov - from.fov) * t,
    };
  }

  /**
   * Get current transition progress (0-1)
   */
  getProgress(): number {
    // This would track actual progress in a real implementation
    return this.isTransitioning ? 0.5 : 0;
  }
}

// ============================================================================
// POV Switcher Class
// ============================================================================

export class POVSwitcher {
  private transitionController = new TransitionController();
  private currentPOV: POVAssignment | null = null;
  private prewarmCache = new Map<string, CameraPosition>();
  private onSwitchCallbacks: Array<(from: POVAssignment | null, to: POVAssignment) => void> = [];

  constructor(
    private syncManager: SyncManager,
    private slotId: string
  ) {}

  /**
   * Switch to a new POV
   */
  async switchPOV(
    newPOV: POVAssignment,
    options: POVSwitchOptions = {}
  ): Promise<boolean> {
    const {
      transition = 'fade',
      duration = DEFAULT_TRANSITION_DURATION,
      maintainTime = true,
      onComplete,
    } = options;

    // Check if already at this POV
    if (this.isSamePOV(this.currentPOV, newPOV)) {
      return true;
    }

    // Check if transition is already in progress
    if (this.transitionController.isActive()) {
      this.transitionController.abort();
    }

    // Get current camera position for transition
    const fromPosition = this.currentPOV ? this.getCameraPosition(this.currentPOV) : null;
    const toPosition = this.getCameraPosition(newPOV);

    // Start transition
    const config: TransitionConfig = {
      type: transition,
      duration,
      easing: TRANSITION_PRESETS[transition].easing,
    };

    try {
      await this.transitionController.startTransition(config, fromPosition, toPosition);
      
      const previousPOV = this.currentPOV;
      this.currentPOV = newPOV;

      // Notify listeners
      this.onSwitchCallbacks.forEach(cb => {
        try { cb(previousPOV, newPOV); } catch (e) { /* ignore */ }
      });

      onComplete?.();
      return true;
    } catch (error) {
      console.error('POV switch failed:', error);
      return false;
    }
  }

  /**
   * Quick switch to player POV
   */
  async switchToPlayer(
    playerId: string,
    options?: POVSwitchOptions
  ): Promise<boolean> {
    return this.switchPOV(
      { playerId, viewMode: 'fpv' },
      options
    );
  }

  /**
   * Switch to free camera
   */
  async switchToFreeCamera(options?: POVSwitchOptions): Promise<boolean> {
    return this.switchPOV(
      { playerId: null, viewMode: 'free' },
      options
    );
  }

  /**
   * Switch to tactical map view
   */
  async switchToMap(options?: POVSwitchOptions): Promise<boolean> {
    return this.switchPOV(
      { playerId: null, viewMode: 'map' },
      options
    );
  }

  /**
   * Get current POV
   */
  getCurrentPOV(): POVAssignment | null {
    return this.currentPOV;
  }

  /**
   * Check if switching is in progress
   */
  isSwitching(): boolean {
    return this.transitionController.isActive();
  }

  /**
   * Add switch callback
   */
  onSwitch(callback: (from: POVAssignment | null, to: POVAssignment) => void): () => void {
    this.onSwitchCallbacks.push(callback);
    return () => {
      const index = this.onSwitchCallbacks.indexOf(callback);
      if (index > -1) {
        this.onSwitchCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Prewarm cache for a player POV
   */
  prewarmPlayerPOV(playerId: string): void {
    const position = this.calculatePlayerCameraPosition(playerId);
    this.prewarmCache.set(playerId, position);
  }

  /**
   * Clear prewarm cache
   */
  clearPrewarmCache(): void {
    this.prewarmCache.clear();
  }

  private isSamePOV(a: POVAssignment | null, b: POVAssignment): boolean {
    if (!a) return false;
    return a.playerId === b.playerId && a.viewMode === b.viewMode;
  }

  private getCameraPosition(pov: POVAssignment): CameraPosition {
    if (pov.playerId && this.prewarmCache.has(pov.playerId)) {
      return this.prewarmCache.get(pov.playerId)!;
    }
    return this.calculateCameraPosition(pov);
  }

  private calculateCameraPosition(pov: POVAssignment): CameraPosition {
    // This would integrate with actual game state
    if (pov.playerId) {
      return this.calculatePlayerCameraPosition(pov.playerId);
    }
    return this.calculateFreeCameraPosition();
  }

  private calculatePlayerCameraPosition(playerId: string): CameraPosition {
    // Integration point: get actual player position from game state
    return {
      position: { x: 0, y: 0, z: 0 },
      rotation: { pitch: 0, yaw: 0, roll: 0 },
      fov: 90,
    };
  }

  private calculateFreeCameraPosition(): CameraPosition {
    return {
      position: { x: 0, y: 100, z: 0 },
      rotation: { pitch: -90, yaw: 0, roll: 0 },
      fov: 90,
    };
  }

  /**
   * Destroy the switcher
   */
  destroy(): void {
    this.transitionController.abort();
    this.onSwitchCallbacks = [];
    this.prewarmCache.clear();
  }
}

// ============================================================================
// POV Availability Checker
// ============================================================================

export class POVAvailabilityChecker {
  /**
   * Check POV availability for all players
   */
  static checkAvailability(
    players: Array<{
      id: string;
      name: string;
      teamId: string;
      teamSide: string;
      isAlive?: boolean;
    }>,
    currentSlotId: string,
    slots: ViewSlot[]
  ): PlayerPOV[] {
    const usedPlayerIds = new Set(
      slots
        .filter(s => s.id !== currentSlotId && s.pov.playerId !== null)
        .map(s => s.pov.playerId)
    );

    return players.map(player => ({
      playerId: player.id,
      playerName: player.name,
      teamId: player.teamId,
      teamSide: player.teamSide,
      isAlive: player.isAlive ?? true,
      isAvailable: !usedPlayerIds.has(player.id),
      isCurrentPOV: false, // Set by consumer
    }));
  }

  /**
   * Get available POVs (not currently in use)
   */
  static getAvailablePOVs(
    players: Array<{ id: string; name: string; teamId: string; teamSide: string; isAlive?: boolean }>,
    slots: ViewSlot[],
    excludeSlotId?: string
  ): Array<{ playerId: string; name: string; teamId: string }> {
    const usedPlayerIds = new Set(
      slots
        .filter(s => s.id !== excludeSlotId && s.pov.playerId !== null)
        .map(s => s.pov.playerId)
    );

    return players
      .filter(p => !usedPlayerIds.has(p.id))
      .map(p => ({
        playerId: p.id,
        name: p.name,
        teamId: p.teamId,
      }));
  }

  /**
   * Check if a specific player POV is available
   */
  static isPlayerAvailable(
    playerId: string,
    slots: ViewSlot[],
    excludeSlotId?: string
  ): boolean {
    return !slots.some(
      s => s.id !== excludeSlotId && s.pov.playerId === playerId
    );
  }

  /**
   * Find next available player POV
   */
  static findNextAvailable(
    currentPlayerId: string | null,
    players: Array<{ id: string; name: string }>,
    slots: ViewSlot[],
    excludeSlotId?: string,
    direction: 'next' | 'previous' = 'next'
  ): string | null {
    const availablePlayers = this.getAvailablePOVs(players, slots, excludeSlotId);
    
    if (availablePlayers.length === 0) return null;

    if (!currentPlayerId) {
      return availablePlayers[0].playerId;
    }

    const currentIndex = availablePlayers.findIndex(p => p.playerId === currentPlayerId);
    
    if (direction === 'next') {
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % availablePlayers.length;
      return availablePlayers[nextIndex].playerId;
    } else {
      const prevIndex = currentIndex === -1 
        ? availablePlayers.length - 1 
        : (currentIndex - 1 + availablePlayers.length) % availablePlayers.length;
      return availablePlayers[prevIndex].playerId;
    }
  }
}

// ============================================================================
// React Integration Hook
// ============================================================================

import { useEffect, useRef, useCallback, useState, useMemo } from 'react';

export interface UsePOVSwitcherOptions {
  slotId: string;
  syncManager: SyncManager;
  defaultTransition?: TransitionType;
}

export interface UsePOVSwitcherReturn {
  /** Current POV assignment */
  currentPOV: POVAssignment;
  /** Whether a switch is in progress */
  isSwitching: boolean;
  /** Switch to a new POV */
  switchPOV: (pov: POVAssignment, options?: POVSwitchOptions) => Promise<boolean>;
  /** Switch to specific player */
  switchToPlayer: (playerId: string, options?: POVSwitchOptions) => Promise<boolean>;
  /** Switch to free camera */
  switchToFreeCamera: (options?: POVSwitchOptions) => Promise<boolean>;
  /** Switch to map view */
  switchToMap: (options?: POVSwitchOptions) => Promise<boolean>;
  /** Switch to next available player */
  switchToNextPlayer: () => Promise<boolean>;
  /** Switch to previous available player */
  switchToPreviousPlayer: () => Promise<boolean>;
  /** Prewarm player POV for faster switching */
  prewarmPlayer: (playerId: string) => void;
}

export function usePOVSwitcher(options: UsePOVSwitcherOptions): UsePOVSwitcherReturn {
  const { slotId, syncManager, defaultTransition = 'fade' } = options;
  
  const switcherRef = useRef<POVSwitcher>(new POVSwitcher(syncManager, slotId));
  const store = useMultiViewStore();
  
  const [isSwitching, setIsSwitching] = useState(false);
  
  // Get current POV from store
  const slot = store.layout.slots.find(s => s.id === slotId);
  const currentPOV = slot?.pov ?? { playerId: null, viewMode: 'free' as const };

  // Update switcher when store POV changes externally
  useEffect(() => {
    const switcher = switcherRef.current;
    const currentSwitcherPOV = switcher.getCurrentPOV();
    
    if (!currentSwitcherPOV || !switcher.isSamePOV(currentSwitcherPOV, currentPOV)) {
      // External POV change - update switcher without transition
      // This is handled by the store subscription
    }
  }, [currentPOV]);

  // Monitor switching state
  useEffect(() => {
    const checkSwitching = () => {
      setIsSwitching(switcherRef.current.isSwitching());
      requestAnimationFrame(checkSwitching);
    };
    const rafId = requestAnimationFrame(checkSwitching);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const switchPOV = useCallback(async (
    pov: POVAssignment,
    switchOptions?: POVSwitchOptions
  ): Promise<boolean> => {
    const mergedOptions: POVSwitchOptions = {
      transition: defaultTransition,
      ...switchOptions,
    };

    const success = await switcherRef.current.switchPOV(pov, mergedOptions);
    
    if (success) {
      // Update store
      store.updateSlotPOV(slotId, pov);
    }
    
    return success;
  }, [slotId, store, defaultTransition]);

  const switchToPlayer = useCallback(async (
    playerId: string,
    switchOptions?: POVSwitchOptions
  ): Promise<boolean> => {
    return switchPOV({ playerId, viewMode: 'fpv' }, switchOptions);
  }, [switchPOV]);

  const switchToFreeCamera = useCallback(async (
    switchOptions?: POVSwitchOptions
  ): Promise<boolean> => {
    return switchPOV({ playerId: null, viewMode: 'free' }, switchOptions);
  }, [switchPOV]);

  const switchToMap = useCallback(async (
    switchOptions?: POVSwitchOptions
  ): Promise<boolean> => {
    return switchPOV({ playerId: null, viewMode: 'map' }, switchOptions);
  }, [switchPOV]);

  const switchToNextPlayer = useCallback(async (): Promise<boolean> => {
    const players = store.availablePlayers;
    const nextPlayerId = POVAvailabilityChecker.findNextAvailable(
      currentPOV.playerId,
      players,
      store.layout.slots,
      slotId,
      'next'
    );
    
    if (nextPlayerId) {
      return switchToPlayer(nextPlayerId);
    }
    return false;
  }, [currentPOV.playerId, store, slotId, switchToPlayer]);

  const switchToPreviousPlayer = useCallback(async (): Promise<boolean> => {
    const players = store.availablePlayers;
    const prevPlayerId = POVAvailabilityChecker.findNextAvailable(
      currentPOV.playerId,
      players,
      store.layout.slots,
      slotId,
      'previous'
    );
    
    if (prevPlayerId) {
      return switchToPlayer(prevPlayerId);
    }
    return false;
  }, [currentPOV.playerId, store, slotId, switchToPlayer]);

  const prewarmPlayer = useCallback((playerId: string) => {
    switcherRef.current.prewarmPlayerPOV(playerId);
  }, []);

  return {
    currentPOV,
    isSwitching,
    switchPOV,
    switchToPlayer,
    switchToFreeCamera,
    switchToMap,
    switchToNextPlayer,
    switchToPreviousPlayer,
    prewarmPlayer,
  };
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get transition display name
 */
export function getTransitionDisplayName(type: TransitionType): string {
  const names: Record<TransitionType, string> = {
    instant: 'Instant',
    fade: 'Fade',
    slide: 'Slide',
    zoom: 'Zoom',
    crossfade: 'Crossfade',
  };
  return names[type];
}

/**
 * Get POV display name
 */
export function getPOVDisplayName(pov: POVAssignment, playerName?: string): string {
  if (pov.viewMode === 'map') return 'Tactical Map';
  if (pov.viewMode === 'free') return 'Free Camera';
  if (pov.playerId && playerName) return playerName;
  if (pov.playerId) return `Player ${pov.playerId}`;
  return 'Unknown';
}

/**
 * Validate POV assignment
 */
export function validatePOV(pov: POVAssignment): { valid: boolean; error?: string } {
  if (pov.viewMode === 'fpv' && !pov.playerId) {
    return { valid: false, error: 'FPV mode requires a player ID' };
  }
  return { valid: true };
}

export default POVSwitcher;
