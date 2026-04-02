// @ts-nocheck
/** [Ver001.000]
 * useSpatialAudio Hook
 * ====================
 * React hook for 3D spatial audio control.
 * 
 * Features:
 * - Create and manage spatial audio sources
 * - Position audio sources in 3D space
 * - Track listener (camera) position
 * - Control spatial effects (occlusion, doppler, reverb)
 * - Integration with mascot positions
 * - Smooth position interpolation
 * 
 * Usage:
 * ```typescript
 * const spatial = useSpatialAudio();
 * 
 * // Create spatial source
 * const sourceId = spatial.createSource({
 *   type: 'mascot',
 *   position: { x: 5, y: 0, z: 0 },
 * });
 * 
 * // Play audio
 * await spatial.play(sourceId, audioBuffer);
 * 
 * // Update position (smoothly interpolated)
 * spatial.setPosition(sourceId, { x: 3, y: 0, z: 2 });
 * 
 * // For R3F integration, use useSpatialAudioR3F inside Canvas:
 * useSpatialAudioR3F(spatial);
 * ```
 */

import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import type { Camera } from 'three';

import {
  type SpatialAudioEngine,
  type SpatialAudioSource,
  type AudioSourceOptions,
  type AudioSourceId,
  type Vector3,
  type EnvironmentAudioManager,
  type AmbientSoundscape,
  type ReverbZone,
  type WeatherEffect,
  type WeatherType,
  type EnvironmentPreset,
  type AudioVisualizationData,
  getSpatialAudioEngine,
  getEnvironmentAudioManager,
  syncListenerWithCamera,
  createListenerTracker,
  registerMascotAudio,
  updateMascotPosition,
  unregisterMascotAudio,
  setSourcePositionSmooth,
  DEFAULT_INTERPOLATION_CONFIG,
} from '@/lib/audio/spatial';

// ============================================================================
// Hook Types
// ============================================================================

export interface UseSpatialAudioOptions {
  /** Auto-initialize spatial audio on mount */
  autoInitialize?: boolean;
  /** Enable HRTF spatialization */
  hrtfEnabled?: boolean;
  /** Enable occlusion effects */
  occlusionEnabled?: boolean;
  /** Enable Doppler effect */
  dopplerEnabled?: boolean;
  /** Maximum concurrent sources */
  maxSources?: number;
  /** Update rate in Hz */
  updateRate?: number;
  /** Callback for errors */
  onError?: (error: Error) => void;
  /** Callback when source state changes */
  onSourceStateChange?: (sourceId: AudioSourceId, isPlaying: boolean) => void;
}

export interface UseSpatialAudioReturn {
  // State
  isInitialized: boolean;
  isSupported: boolean;
  activeSources: SpatialAudioSource[];
  listenerPosition: Vector3;
  activeSoundscape: AmbientSoundscape | null;
  activeReverbZone: ReverbZone | null;
  visualizationData: AudioVisualizationData[];
  
  // Engine refs (for advanced usage)
  engine: SpatialAudioEngine | null;
  envManager: EnvironmentAudioManager | null;
  
  // Control
  initialize: () => Promise<boolean>;
  dispose: () => void;
  
  // Source management
  createSource: (options: AudioSourceOptions) => AudioSourceId;
  destroySource: (id: AudioSourceId) => boolean;
  getSource: (id: AudioSourceId) => SpatialAudioSource | undefined;
  
  // Playback control
  play: (id: AudioSourceId, audioBuffer?: AudioBuffer) => Promise<boolean>;
  pause: (id: AudioSourceId) => boolean;
  stop: (id: AudioSourceId) => boolean;
  stopAll: () => void;
  
  // Position control
  setPosition: (id: AudioSourceId, position: Partial<Vector3>) => boolean;
  setPositionSmooth: (id: AudioSourceId, position: Vector3, smoothing?: number) => boolean;
  setVelocity: (id: AudioSourceId, velocity: Partial<Vector3>) => boolean;
  setListenerPosition: (position: Partial<Vector3>) => void;
  
  // Effects
  setOcclusion: (id: AudioSourceId, factor: number) => void;
  setVolume: (id: AudioSourceId, volume: number) => void;
  setMasterVolume: (volume: number) => void;
  setMuted: (muted: boolean) => void;
  toggleMute: () => boolean;
  
  // R3F integration (to be called inside Canvas with useFrame)
  syncWithCamera: (camera?: Camera) => void;
  
  // Environment control
  playSoundscape: (id: string, transitionDuration?: number) => Promise<boolean>;
  stopSoundscape: (fadeOutDuration?: number) => void;
  setSoundscapeVolume: (volume: number, fadeDuration?: number) => void;
  applyEnvironmentPreset: (preset: EnvironmentPreset) => void;
  setWeather: (type: WeatherType, intensity: number) => void;
  clearWeather: (fadeOutDuration?: number) => void;
  
  // Mascot integration
  registerMascot: (mascotId: string, sourceId: AudioSourceId, position?: Vector3) => void;
  updateMascot: (mascotId: string, position: Vector3) => boolean;
  unregisterMascot: (mascotId: string) => boolean;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useSpatialAudio(options: UseSpatialAudioOptions = {}): UseSpatialAudioReturn {
  const {
    autoInitialize = true,
    hrtfEnabled = true,
    occlusionEnabled = true,
    dopplerEnabled = true,
    maxSources = 32,
    updateRate = 60,
    onError,
    onSourceStateChange,
  } = options;

  // Refs for engine instances
  const engineRef = useRef<SpatialAudioEngine | null>(null);
  const envManagerRef = useRef<EnvironmentAudioManager | null>(null);
  const listenerTrackerRef = useRef<ReturnType<typeof createListenerTracker> | null>(null);
  
  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [activeSources, setActiveSources] = useState<SpatialAudioSource[]>([]);
  const [listenerPosition, setListenerPosition] = useState<Vector3>({ x: 0, y: 0, z: 0 });
  const [activeSoundscape, setActiveSoundscape] = useState<AmbientSoundscape | null>(null);
  const [activeReverbZone, setActiveReverbZone] = useState<ReverbZone | null>(null);
  const [visualizationData, setVisualizationData] = useState<AudioVisualizationData[]>([]);
  const [isMuted, setIsMuted] = useState(false);

  // Initialize engine instances
  useEffect(() => {
    try {
      engineRef.current = getSpatialAudioEngine({
        hrtfEnabled,
        occlusionEnabled,
        dopplerEnabled,
        maxSources,
        updateRate,
      });
      
      envManagerRef.current = getEnvironmentAudioManager(engineRef.current);
    } catch (error) {
      setIsSupported(false);
      onError?.(error instanceof Error ? error : new Error(String(error)));
    }

    return () => {
      // Don't dispose on unmount - singleton pattern
    };
  }, []);

  // Initialize on mount
  useEffect(() => {
    if (!autoInitialize || !engineRef.current || isInitialized) return;

    engineRef.current.initialize().then(success => {
      setIsInitialized(success);
      
      if (success && engineRef.current) {
        // Create listener tracker
        listenerTrackerRef.current = createListenerTracker(engineRef.current);
        
        // Subscribe to events
        const unsubSourceCreated = engineRef.current.on('sourceCreated', () => {
          updateState();
        });
        
        const unsubSourceDestroyed = engineRef.current.on('sourceDestroyed', () => {
          updateState();
        });
        
        const unsubSourceStarted = engineRef.current.on('sourceStarted', (e) => {
          updateState();
          if (e.sourceId) {
            onSourceStateChange?.(e.sourceId, true);
          }
        });
        
        const unsubSourceStopped = engineRef.current.on('sourceStopped', (e) => {
          updateState();
          if (e.sourceId) {
            onSourceStateChange?.(e.sourceId, false);
          }
        });
        
        const unsubListenerMoved = engineRef.current.on('listenerMoved', () => {
          setListenerPosition(engineRef.current!.getListenerPosition());
        });

        return () => {
          unsubSourceCreated();
          unsubSourceDestroyed();
          unsubSourceStarted();
          unsubSourceStopped();
          unsubListenerMoved();
        };
      }
    });
  }, [autoInitialize]);

  // Update loop for state
  useEffect(() => {
    if (!isInitialized) return;

    const interval = setInterval(() => {
      updateState();
    }, 100);

    return () => clearInterval(interval);
  }, [isInitialized]);

  const updateState = useCallback(() => {
    if (!engineRef.current) return;
    
    const state = engineRef.current.getState();
    setActiveSources(Array.from(state.sources.values()));
    setListenerPosition(engineRef.current.getListenerPosition());
    setVisualizationData(engineRef.current.getVisualizationData());
    
    if (envManagerRef.current) {
      setActiveSoundscape(envManagerRef.current.getActiveSoundscape());
      setActiveReverbZone(envManagerRef.current.getActiveReverbZone());
    }
  }, []);

  // ============================================================================
  // Control Methods
  // ============================================================================

  const initialize = useCallback(async (): Promise<boolean> => {
    if (!engineRef.current) return false;
    
    const success = await engineRef.current.initialize();
    setIsInitialized(success);
    return success;
  }, []);

  const dispose = useCallback((): void => {
    engineRef.current?.dispose();
    envManagerRef.current?.dispose();
    setIsInitialized(false);
  }, []);

  // ============================================================================
  // Source Management
  // ============================================================================

  const createSource = useCallback((options: AudioSourceOptions): AudioSourceId => {
    if (!engineRef.current) {
      throw new Error('Spatial audio engine not initialized');
    }
    
    return engineRef.current.createSource(options);
  }, []);

  const destroySource = useCallback((id: AudioSourceId): boolean => {
    if (!engineRef.current) return false;
    return engineRef.current.destroySource(id);
  }, []);

  const getSource = useCallback((id: AudioSourceId): SpatialAudioSource | undefined => {
    return engineRef.current?.getSource(id);
  }, []);

  // ============================================================================
  // Playback Control
  // ============================================================================

  const play = useCallback(async (id: AudioSourceId, audioBuffer?: AudioBuffer): Promise<boolean> => {
    if (!engineRef.current) return false;
    
    try {
      return await engineRef.current.playSource(id, audioBuffer);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }, [onError]);

  const pause = useCallback((id: AudioSourceId): boolean => {
    return engineRef.current?.pauseSource(id) ?? false;
  }, []);

  const stop = useCallback((id: AudioSourceId): boolean => {
    return engineRef.current?.stopSource(id) ?? false;
  }, []);

  const stopAll = useCallback((): void => {
    engineRef.current?.stopAllSources();
  }, []);

  // ============================================================================
  // Position Control
  // ============================================================================

  const setPosition = useCallback((id: AudioSourceId, position: Partial<Vector3>): boolean => {
    return engineRef.current?.setSourcePosition(id, position) ?? false;
  }, []);

  const setPositionSmooth = useCallback(
    (id: AudioSourceId, position: Vector3, smoothing?: number): boolean => {
      if (!engineRef.current) return false;
      
      return setSourcePositionSmooth(engineRef.current, id, position, {
        smoothingFactor: smoothing ?? DEFAULT_INTERPOLATION_CONFIG.smoothingFactor,
      });
    },
    []
  );

  const setVelocity = useCallback((id: AudioSourceId, velocity: Partial<Vector3>): boolean => {
    return engineRef.current?.setSourceVelocity(id, velocity) ?? false;
  }, []);

  const setListenerPosition = useCallback((position: Partial<Vector3>): void => {
    engineRef.current?.setListenerPosition(position);
  }, []);

  // ============================================================================
  // Effects
  // ============================================================================

  const setOcclusion = useCallback((id: AudioSourceId, factor: number): void => {
    engineRef.current?.setOcclusionFactor(id, factor);
  }, []);

  const setVolume = useCallback((id: AudioSourceId, volume: number): void => {
    const source = engineRef.current?.getSource(id);
    if (source) {
      source.volume = Math.max(0, Math.min(1, volume));
    }
  }, []);

  const setMasterVolume = useCallback((volume: number): void => {
    engineRef.current?.setMasterVolume(volume);
  }, []);

  const setMuted = useCallback((muted: boolean): void => {
    engineRef.current?.setMuted(muted);
    setIsMuted(muted);
  }, []);

  const toggleMute = useCallback((): boolean => {
    const newState = engineRef.current?.toggleMute() ?? false;
    setIsMuted(newState);
    return newState;
  }, []);

  // ============================================================================
  // R3F Integration
  // ============================================================================

  const syncWithCamera = useCallback((camera?: Camera): void => {
    if (!engineRef.current) return;
    
    if (camera) {
      syncListenerWithCamera(engineRef.current, camera as any, listenerTrackerRef.current ?? undefined);
    }
  }, []);

  // ============================================================================
  // Environment Control
  // ============================================================================

  const playSoundscape = useCallback(
    async (id: string, transitionDuration?: number): Promise<boolean> => {
      if (!envManagerRef.current) return false;
      
      try {
        return await envManagerRef.current.playSoundscape(id, transitionDuration);
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
        return false;
      }
    },
    [onError]
  );

  const stopSoundscape = useCallback((fadeOutDuration?: number): void => {
    envManagerRef.current?.stopActiveSoundscape(fadeOutDuration);
  }, []);

  const setSoundscapeVolume = useCallback((volume: number, fadeDuration?: number): void => {
    const soundscape = envManagerRef.current?.getActiveSoundscape();
    if (soundscape) {
      envManagerRef.current?.setSoundscapeVolume(soundscape.id, volume, fadeDuration);
    }
  }, []);

  const applyEnvironmentPreset = useCallback((preset: EnvironmentPreset): void => {
    engineRef.current?.applyEnvironmentPreset(preset);
    envManagerRef.current?.applyEnvironmentPreset(preset);
  }, []);

  const setWeather = useCallback((type: WeatherType, intensity: number): void => {
    envManagerRef.current?.setWeatherEffect({ type, intensity });
  }, []);

  const clearWeather = useCallback((fadeOutDuration?: number): void => {
    envManagerRef.current?.clearWeatherEffect(fadeOutDuration);
  }, []);

  // ============================================================================
  // Mascot Integration
  // ============================================================================

  const registerMascot = useCallback(
    (mascotId: string, sourceId: AudioSourceId, position?: Vector3): void => {
      registerMascotAudio(mascotId, sourceId, position);
    },
    []
  );

  const updateMascot = useCallback((mascotId: string, position: Vector3): boolean => {
    if (!engineRef.current) return false;
    return updateMascotPosition(engineRef.current, mascotId, position);
  }, []);

  const unregisterMascot = useCallback((mascotId: string): boolean => {
    return unregisterMascotAudio(mascotId);
  }, []);

  // ============================================================================
  // Return Object
  // ============================================================================

  return useMemo(
    () => ({
      // State
      isInitialized,
      isSupported,
      activeSources,
      listenerPosition,
      activeSoundscape,
      activeReverbZone,
      visualizationData,
      
      // Engine refs
      engine: engineRef.current,
      envManager: envManagerRef.current,
      
      // Control
      initialize,
      dispose,
      
      // Source management
      createSource,
      destroySource,
      getSource,
      
      // Playback control
      play,
      pause,
      stop,
      stopAll,
      
      // Position control
      setPosition,
      setPositionSmooth,
      setVelocity,
      setListenerPosition,
      
      // Effects
      setOcclusion,
      setVolume,
      setMasterVolume,
      setMuted,
      toggleMute,
      
      // R3F integration
      syncWithCamera,
      
      // Environment control
      playSoundscape,
      stopSoundscape,
      setSoundscapeVolume,
      applyEnvironmentPreset,
      setWeather,
      clearWeather,
      
      // Mascot integration
      registerMascot,
      updateMascot,
      unregisterMascot,
    }),
    [
      isInitialized,
      isSupported,
      activeSources,
      listenerPosition,
      activeSoundscape,
      activeReverbZone,
      visualizationData,
      initialize,
      dispose,
      createSource,
      destroySource,
      getSource,
      play,
      pause,
      stop,
      stopAll,
      setPosition,
      setPositionSmooth,
      setVelocity,
      setListenerPosition,
      setOcclusion,
      setVolume,
      setMasterVolume,
      setMuted,
      toggleMute,
      syncWithCamera,
      playSoundscape,
      stopSoundscape,
      setSoundscapeVolume,
      applyEnvironmentPreset,
      setWeather,
      clearWeather,
      registerMascot,
      updateMascot,
      unregisterMascot,
    ]
  );
}

// ============================================================================
// R3F-Specific Hooks
// ============================================================================

/**
 * Hook to be used inside R3F Canvas for automatic camera sync
 * Must be called inside a component that's a child of Canvas
 */
export function useSpatialAudioR3F(spatial: UseSpatialAudioReturn): void {
  const { camera } = useThree();
  
  useFrame(() => {
    if (camera && spatial.isInitialized) {
      spatial.syncWithCamera(camera);
    }
  });
}

/**
 * Hook for syncing a spatial audio source with a R3F object ref
 * Must be called inside a component that's a child of Canvas
 */
export function useSyncSpatialSource(
  spatial: UseSpatialAudioReturn,
  sourceId: AudioSourceId,
  objectRef: React.RefObject<{ position: Vector3 }>
): void {
  useFrame(() => {
    if (objectRef.current && spatial.isInitialized) {
      spatial.setPositionSmooth(sourceId, objectRef.current.position);
    }
  });
}

/**
 * Hook for managing a single spatial audio source
 */
export function useSpatialAudioSource(
  options: AudioSourceOptions & { audioBuffer?: AudioBuffer; autoPlay?: boolean }
) {
  const spatial = useSpatialAudio();
  const sourceIdRef = useRef<AudioSourceId | null>(null);
  const { audioBuffer, autoPlay, ...sourceOptions } = options;

  useEffect(() => {
    if (!spatial.isInitialized) return;
    
    // Create source
    sourceIdRef.current = spatial.createSource(sourceOptions);
    
    // Auto-play if requested
    if (autoPlay && audioBuffer) {
      spatial.play(sourceIdRef.current, audioBuffer);
    }

    return () => {
      if (sourceIdRef.current) {
        spatial.destroySource(sourceIdRef.current);
      }
    };
  }, [spatial.isInitialized]);

  const play = useCallback(() => {
    if (sourceIdRef.current) {
      return spatial.play(sourceIdRef.current, audioBuffer);
    }
    return Promise.resolve(false);
  }, [audioBuffer]);

  const stop = useCallback(() => {
    if (sourceIdRef.current) {
      spatial.stop(sourceIdRef.current);
    }
  }, []);

  const setPosition = useCallback(
    (position: Vector3) => {
      if (sourceIdRef.current) {
        spatial.setPosition(sourceIdRef.current, position);
      }
    },
    [spatial]
  );

  return {
    play,
    stop,
    setPosition,
    sourceId: sourceIdRef.current,
  };
}

/**
 * Hook for environment audio control
 */
export function useEnvironmentAudio() {
  const spatial = useSpatialAudio();

  return {
    playSoundscape: spatial.playSoundscape,
    stopSoundscape: spatial.stopSoundscape,
    setVolume: spatial.setSoundscapeVolume,
    applyPreset: spatial.applyEnvironmentPreset,
    setWeather: spatial.setWeather,
    clearWeather: spatial.clearWeather,
    activeSoundscape: spatial.activeSoundscape,
    activeReverbZone: spatial.activeReverbZone,
  };
}

/**
 * Hook for mascot spatial audio
 */
export function useMascotSpatialAudio(mascotId: string) {
  const spatial = useSpatialAudio();
  const sourceIdRef = useRef<AudioSourceId | null>(null);

  const register = useCallback(
    (sourceId: AudioSourceId, position?: Vector3) => {
      sourceIdRef.current = sourceId;
      spatial.registerMascot(mascotId, sourceId, position);
    },
    [mascotId, spatial]
  );

  const updatePosition = useCallback(
    (position: Vector3) => {
      return spatial.updateMascot(mascotId, position);
    },
    [mascotId, spatial]
  );

  const unregister = useCallback(() => {
    return spatial.unregisterMascot(mascotId);
  }, [mascotId, spatial]);

  return {
    register,
    updatePosition,
    unregister,
    sourceId: sourceIdRef.current,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default useSpatialAudio;
