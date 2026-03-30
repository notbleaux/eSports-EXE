/** [Ver001.000]
 * useAudio Hook
 * =============
 * React hook for comprehensive audio control.
 * Provides access to the audio system with reactive state updates.
 * 
 * Features:
 * - Reactive audio state management
 * - Volume control with UI binding
 * - Voice line playback
 * - SFX triggering
 * - Ambient audio control
 * - Animation sync integration
 * 
 * Usage:
 * ```typescript
 * const audio = useAudio();
 * 
 * // Control volume
 * audio.setMasterVolume(0.5);
 * 
 * // Play voice line
 * audio.playVoiceLine({ mascotId: 'sol', context: 'greeting' });
 * 
 * // Play SFX
 * audio.playSFX({ type: 'ui_click', category: 'ui', priority: 'normal', duration: 0.1 });
 * ```
 */

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import type { MascotId } from '@/components/mascots/types';
import {
  type AudioCategory,
  type AudioQuality,
  type SFXEvent,
  type AmbientType,
  type VoiceLineRequest,
  type VoiceLine,
  type AudioEvent,
  type UseAudioReturn,
  type UseAudioOptions,
} from '@/lib/audio/types';
import {
  getAudioManager,
  getVoiceController,
  getSFXController,
} from '@/lib/audio';

// ============================================================================
// Hook Implementation
// ============================================================================

export function useAudio(options: UseAudioOptions = {}): UseAudioReturn {
  const { autoInitialize = true, onError, onVoiceStart, onVoiceEnd } = options;
  
  // Get singleton instances
  const audioManagerRef = useRef(getAudioManager());
  const voiceControllerRef = useRef(getVoiceController({
    onVoiceStart,
    onVoiceEnd,
  }));
  const sfxControllerRef = useRef(getSFXController());
  
  // Local state for reactivity
  const [isInitialized, setIsInitialized] = useState(audioManagerRef.current.isInitialized());
  const [isSuspended, setIsSuspended] = useState(audioManagerRef.current.isSuspended());
  const [masterVolume, setMasterVolumeState] = useState(audioManagerRef.current.getMasterVolume());
  const [masterMuted, setMasterMuted] = useState(audioManagerRef.current.isMasterMuted());
  
  // Category state
  const [categoryVolumes, setCategoryVolumes] = useState<Record<AudioCategory, number>>(() => ({
    sfx: audioManagerRef.current.getCategoryVolume('sfx'),
    voice: audioManagerRef.current.getCategoryVolume('voice'),
    ambient: audioManagerRef.current.getCategoryVolume('ambient'),
    ui: audioManagerRef.current.getCategoryVolume('ui'),
    ability: audioManagerRef.current.getCategoryVolume('ability'),
  }));
  
  const [categoryMuted, setCategoryMuted] = useState<Record<AudioCategory, boolean>>(() => ({
    sfx: audioManagerRef.current.isCategoryMuted('sfx'),
    voice: audioManagerRef.current.isCategoryMuted('voice'),
    ambient: audioManagerRef.current.isCategoryMuted('ambient'),
    ui: audioManagerRef.current.isCategoryMuted('ui'),
    ability: audioManagerRef.current.isCategoryMuted('ability'),
  }));
  
  // Subscribe to audio manager events
  useEffect(() => {
    const manager = audioManagerRef.current;
    
    const handleStateChange = (event: AudioEvent) => {
      switch (event.type) {
        case 'initialized':
          setIsInitialized(true);
          break;
        case 'suspended':
          setIsSuspended(true);
          break;
        case 'resumed':
          setIsSuspended(false);
          break;
        case 'volumeChanged':
          if (event.data && typeof event.data === 'object') {
            const { category, volume } = event.data as { category?: string; volume?: number };
            if (category === 'master') {
              setMasterVolumeState(volume ?? 0.8);
            } else if (category && volume !== undefined) {
              setCategoryVolumes(prev => ({
                ...prev,
                [category]: volume,
              }));
            }
          }
          break;
        case 'categoryMuted':
          if (event.data && typeof event.data === 'object') {
            const { category, muted } = event.data as { category?: string; muted?: boolean };
            if (category && muted !== undefined) {
              if (category === 'master') {
                setMasterMuted(muted);
              } else {
                setCategoryMuted(prev => ({
                  ...prev,
                  [category]: muted,
                }));
              }
            }
          }
          break;
        case 'error':
          if (event.data instanceof Error) {
            onError?.(event.data);
          }
          break;
      }
    };
    
    // Subscribe to all events
    const unsubInitialized = manager.on('initialized', handleStateChange);
    const unsubSuspended = manager.on('suspended', handleStateChange);
    const unsubResumed = manager.on('resumed', handleStateChange);
    const unsubVolume = manager.on('volumeChanged', handleStateChange);
    const unsubMuted = manager.on('categoryMuted', handleStateChange);
    const unsubError = manager.on('error', handleStateChange);
    
    return () => {
      unsubInitialized();
      unsubSuspended();
      unsubResumed();
      unsubVolume();
      unsubMuted();
      unsubError();
    };
  }, [onError]);
  
  // Auto-initialize
  useEffect(() => {
    if (autoInitialize && !isInitialized) {
      audioManagerRef.current.initialize().then(success => {
        if (success) {
          setIsInitialized(true);
          setIsSuspended(false);
        }
      });
    }
  }, [autoInitialize, isInitialized]);
  
  // ============================================================================
  // Control Methods
  // ============================================================================
  
  const initialize = useCallback(async (): Promise<boolean> => {
    const success = await audioManagerRef.current.initialize();
    if (success) {
      setIsInitialized(true);
      setIsSuspended(false);
    }
    return success;
  }, []);
  
  const suspend = useCallback((): void => {
    audioManagerRef.current.suspend();
    setIsSuspended(true);
  }, []);
  
  const resume = useCallback(async (): Promise<boolean> => {
    const success = await audioManagerRef.current.resume();
    if (success) {
      setIsSuspended(false);
    }
    return success;
  }, []);
  
  // ============================================================================
  // Volume Methods
  // ============================================================================
  
  const setMasterVolume = useCallback((volume: number): void => {
    audioManagerRef.current.setMasterVolume(volume);
    setMasterVolumeState(volume);
  }, []);
  
  const setCategoryVolume = useCallback((category: AudioCategory, volume: number): void => {
    audioManagerRef.current.setCategoryVolume(category, volume);
    setCategoryVolumes(prev => ({ ...prev, [category]: volume }));
  }, []);
  
  const toggleMute = useCallback((): void => {
    const muted = audioManagerRef.current.toggleMasterMute();
    setMasterMuted(muted);
  }, []);
  
  const toggleCategoryMute = useCallback((category: AudioCategory): void => {
    const muted = audioManagerRef.current.toggleCategoryMute(category);
    setCategoryMuted(prev => ({ ...prev, [category]: muted }));
  }, []);
  
  const getCategoryVolume = useCallback((category: AudioCategory): number => {
    return categoryVolumes[category];
  }, [categoryVolumes]);
  
  const isCategoryMuted = useCallback((category: AudioCategory): boolean => {
    return categoryMuted[category];
  }, [categoryMuted]);
  
  // ============================================================================
  // SFX Methods
  // ============================================================================
  
  const playSFX = useCallback(async (event: SFXEvent): Promise<string | null> => {
    try {
      return await sfxControllerRef.current.playEvent(event);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }, [onError]);
  
  const stopSFX = useCallback((id: string): void => {
    sfxControllerRef.current.stop(id);
  }, []);
  
  const stopAllSFX = useCallback((): void => {
    sfxControllerRef.current.stopAll();
  }, []);
  
  // ============================================================================
  // Voice Methods
  // ============================================================================
  
  const playVoiceLine = useCallback(async (request: VoiceLineRequest): Promise<boolean> => {
    try {
      return await voiceControllerRef.current.playVoiceLine(request);
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error(String(error)));
      return false;
    }
  }, [onError]);
  
  const stopVoice = useCallback((): void => {
    voiceControllerRef.current.stop();
  }, []);
  
  // ============================================================================
  // Ambient Methods
  // ============================================================================
  
  const playAmbient = useCallback((type: AmbientType, crossfade?: number): void => {
    audioManagerRef.current.playAmbient(type, crossfade);
  }, []);
  
  const stopAmbient = useCallback((fadeOut?: number): void => {
    audioManagerRef.current.stopAmbient(fadeOut);
  }, []);
  
  // ============================================================================
  // Settings Methods
  // ============================================================================
  
  const setQuality = useCallback((quality: AudioQuality): void => {
    audioManagerRef.current.setQuality(quality);
  }, []);
  
  const getQuality = useCallback((): AudioQuality => {
    return audioManagerRef.current.getQuality();
  }, []);
  
  // ============================================================================
  // Return Object
  // ============================================================================
  
  return {
    // State
    isInitialized,
    isSuspended,
    masterVolume,
    masterMuted,
    
    // Control
    initialize,
    suspend,
    resume,
    
    // Volume
    setMasterVolume,
    setCategoryVolume,
    toggleMute,
    toggleCategoryMute,
    
    // Playback
    playSFX,
    stopSFX,
    stopAllSFX,
    
    // Voice
    playVoiceLine,
    stopVoice,
    
    // Ambient
    playAmbient,
    stopAmbient,
    
    // Settings
    setQuality,
    getQuality,
    getCategoryVolume,
    isCategoryMuted,
  };
}

// ============================================================================
// Specialized Hooks
// ============================================================================

/**
 * Hook for voice-specific operations
 */
export function useVoiceAudio(options: {
  mascotId?: MascotId;
  onVoiceStart?: (line: VoiceLine) => void;
  onVoiceEnd?: (line: VoiceLine) => void;
} = {}) {
  const { mascotId, onVoiceStart, onVoiceEnd } = options;
  const voiceControllerRef = useRef(getVoiceController({ onVoiceStart, onVoiceEnd }));
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState<VoiceLine | null>(null);
  const [queueLength, setQueueLength] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      const queue = voiceControllerRef.current;
      // Access internal state through the queue manager
      setIsPlaying(queue['queueManager']?.getIsPlaying() ?? false);
      setCurrentLine(queue['queueManager']?.getCurrentLine() ?? null);
      setQueueLength(queue['queueManager']?.getLength() ?? 0);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  const play = useCallback(async (
    context: VoiceLineRequest['context'],
    emotion?: VoiceLineRequest['emotion']
  ): Promise<boolean> => {
    if (!mascotId) return false;
    return voiceControllerRef.current.playVoiceLine({ mascotId, context, emotion });
  }, [mascotId]);
  
  const queue = useCallback((
    context: VoiceLineRequest['context'],
    emotion?: VoiceLineRequest['emotion'],
    priority?: import('@/lib/audio/types').AudioPriority
  ): boolean => {
    if (!mascotId) return false;
    return voiceControllerRef.current.queueVoiceLine({ mascotId, context, emotion }, priority);
  }, [mascotId]);
  
  const stop = useCallback((): void => {
    voiceControllerRef.current.stop();
  }, []);
  
  const clearQueue = useCallback((): void => {
    voiceControllerRef.current['queueManager']?.clear();
  }, []);
  
  const preload = useCallback(async (): Promise<void> => {
    if (!mascotId) return;
    await voiceControllerRef.current.preloadVoiceLines(mascotId);
  }, [mascotId]);
  
  return {
    isPlaying,
    currentLine,
    queueLength,
    play,
    queue,
    stop,
    clearQueue,
    preload,
  };
}

/**
 * Hook for SFX-specific operations
 */
export function useSFXAudio() {
  const sfxControllerRef = useRef(getSFXController());
  
  const [activeCount, setActiveCount] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveCount(sfxControllerRef.current.getActiveCount());
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  const playUI = useCallback(async (
    type: 'click' | 'hover' | 'success' | 'error' | 'transition'
  ): Promise<string | null> => {
    return sfxControllerRef.current.playUI(type);
  }, []);
  
  const playAbility = useCallback(async (
    abilityId: string,
    phase: 'cast' | 'hit' | 'block' | 'impact'
  ): Promise<string | null> => {
    return sfxControllerRef.current.playAbilitySFX(abilityId, phase);
  }, []);
  
  const playEvent = useCallback(async (
    type: 'alert' | 'achievement'
  ): Promise<string | null> => {
    return sfxControllerRef.current.playEventSFX(type);
  }, []);
  
  const stop = useCallback((id: string): void => {
    sfxControllerRef.current.stop(id);
  }, []);
  
  const stopAll = useCallback((): void => {
    sfxControllerRef.current.stopAll();
  }, []);
  
  return {
    activeCount,
    playUI,
    playAbility,
    playEvent,
    stop,
    stopAll,
  };
}

/**
 * Hook for ambient audio control
 */
export function useAmbientAudio() {
  const audioManagerRef = useRef(getAudioManager());
  
  const [currentTrack, setCurrentTrack] = useState<AmbientType | null>(null);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTrack(audioManagerRef.current.getCurrentAmbient());
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  const play = useCallback((type: AmbientType, crossfade?: number): void => {
    audioManagerRef.current.playAmbient(type, crossfade);
  }, []);
  
  const stop = useCallback((fadeOut?: number): void => {
    audioManagerRef.current.stopAmbient(fadeOut);
  }, []);
  
  return {
    currentTrack,
    play,
    stop,
  };
}

/**
 * Hook for volume control with local storage persistence
 */
export function usePersistentAudioSettings(storageKey: string = 'sator-audio-settings') {
  const audio = useAudio({ autoInitialize: true });
  
  // Load settings from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const settings = JSON.parse(saved);
        if (settings.masterVolume !== undefined) {
          audio.setMasterVolume(settings.masterVolume);
        }
        if (settings.categoryVolumes) {
          for (const [category, volume] of Object.entries(settings.categoryVolumes)) {
            audio.setCategoryVolume(category as AudioCategory, volume as number);
          }
        }
        if (settings.masterMuted) {
          audio.toggleMute();
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, []);
  
  // Save settings when changed
  useEffect(() => {
    const settings = {
      masterVolume: audio.masterVolume,
      masterMuted: audio.masterMuted,
      categoryVolumes: {
        sfx: audio.getCategoryVolume('sfx'),
        voice: audio.getCategoryVolume('voice'),
        ambient: audio.getCategoryVolume('ambient'),
        ui: audio.getCategoryVolume('ui'),
        ability: audio.getCategoryVolume('ability'),
      },
    };
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
      // Ignore storage errors
    }
  }, [
    audio.masterVolume,
    audio.masterMuted,
    audio.getCategoryVolume('sfx'),
    audio.getCategoryVolume('voice'),
    audio.getCategoryVolume('ambient'),
    audio.getCategoryVolume('ui'),
    audio.getCategoryVolume('ability'),
  ]);
  
  return audio;
}

// ============================================================================
// Animation Sync Hook
// ============================================================================

/**
 * Hook to sync audio with animation states
 */
export function useAudioAnimationSync(mascotId?: MascotId) {
  const voiceControllerRef = useRef(getVoiceController());
  const sfxControllerRef = useRef(getSFXController());
  
  const syncAbilityAudio = useCallback(async (
    abilityId: string,
    animationPhase: 'start' | 'impact' | 'end'
  ): Promise<void> => {
    switch (animationPhase) {
      case 'start':
        await sfxControllerRef.current.playAbilitySFX(abilityId, 'cast');
        break;
      case 'impact':
        await sfxControllerRef.current.playAbilitySFX(abilityId, 'hit');
        break;
      case 'end':
        // Optional: play completion sound
        break;
    }
  }, []);
  
  const syncVoiceWithAnimation = useCallback(async (
    context: VoiceLineRequest['context'],
    emotion?: VoiceLineRequest['emotion']
  ): Promise<{ line: VoiceLine | null; cleanup: () => void }> => {
    if (!mascotId) return { line: null, cleanup: () => {} };
    
    const line = await voiceControllerRef.current.playVoiceLine({
      mascotId,
      context,
      emotion,
    });
    
    // Return cleanup function
    return {
      line: line ? voiceControllerRef.current['selectionEngine'].selectVoiceLine({ mascotId, context, emotion }) : null,
      cleanup: () => {
        voiceControllerRef.current.stop();
      },
    };
  }, [mascotId]);
  
  return {
    syncAbilityAudio,
    syncVoiceWithAnimation,
  };
}

// ============================================================================
// Exports
// ============================================================================

export default useAudio;

// Re-export types
export type {
  UseAudioReturn,
  UseAudioOptions,
};
