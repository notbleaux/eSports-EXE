/** [Ver001.000]
 * Audio Library
 * =============
 * Central export point for the NJZiteGeisTe audio system.
 * Provides comprehensive audio control for mascot voices, SFX, and ambient audio.
 * 
 * Usage:
 * ```typescript
 * import { 
 *   getAudioManager, 
 *   getVoiceController, 
 *   getSFXController,
 *   useAudio 
 * } from '@/lib/audio';
 * 
 * // Play a voice line
 * const voice = getVoiceController();
 * await voice.playVoiceLine({ mascotId: 'sol', context: 'greeting' });
 * 
 * // Play SFX
 * const sfx = getSFXController();
 * await sfx.playUI('click');
 * 
 * // Control audio
 * const audio = getAudioManager();
 * audio.setMasterVolume(0.5);
 * ```
 */

// ============================================================================
// Internal Imports (for utility functions)
// ============================================================================

import { getAudioManager, destroyAudioManager } from './manager';
import { getVoiceController, destroyVoiceController } from './voice';
import { getSFXController, destroySFXController } from './sfx';

// ============================================================================
// Types
// ============================================================================

export type {
  // Core Types
  AudioState,
  AudioCategory,
  AudioCategoryConfig,
  AudioQuality,
  AudioQualityConfig,
  AudioPriority,
  AudioManagerConfig,
  AudioManagerState,
  AudioEvent,
  AudioEventType,
  AudioEventHandler,
  
  // Voice Types
  VoiceLine,
  VoiceLineRequest,
  VoiceEmotion,
  VoiceContext,
  VoicePlaybackState,
  
  // SFX Types
  SFXEvent,
  SFXType,
  SFXDefinition,
  ActiveSound,
  SpatialPosition,
  
  // Ambient Types
  AmbientType,
  AmbientTrack,
  AmbientState,
  
  // Buffer Types
  AudioBufferCache,
  PannerConfig,
} from './types';

// ============================================================================
// Constants
// ============================================================================

export {
  DEFAULT_AUDIO_STATE,
  AUDIO_QUALITY_CONFIGS,
  PRIORITY_WEIGHTS,
  DEFAULT_CROSSFADE_DURATION,
  MAX_QUEUE_SIZE,
  VOICE_LINE_COOLDOWN,
  DEFAULT_PANNER_CONFIG,
} from './types';

// ============================================================================
// Audio Manager
// ============================================================================

export {
  AudioManager,
  getAudioManager,
  destroyAudioManager,
  createAudioManager,
} from './manager';

export type {
  AudioManagerConfig as AudioManagerOptions,
} from './manager';

// ============================================================================
// Voice System
// ============================================================================

export {
  VOICE_LINE_DATABASE,
  VoiceSelectionEngine,
  VoiceQueueManager,
  VoiceController,
  getVoiceController,
  destroyVoiceController,
  generateLipSyncEvents,
} from './voice';

export type {
  VoiceSelectionOptions,
  QueuedVoiceLine,
  VoiceControllerOptions,
  AnimationSyncEvent,
  AnimationSyncHandler,
} from './voice';

// ============================================================================
// SFX System
// ============================================================================

export {
  SFX_LIBRARY,
  ABILITY_SFX_MAPPINGS,
  SFXQueue,
  SFXController,
  getSFXController,
  destroySFXController,
  createAnimationSyncedSFX,
  ABILITY_SYNC_POINTS,
} from './sfx';

export type {
  AbilitySFXMapping,
  QueuedSFX,
  SFXControllerOptions,
  SFXAnimationSync,
} from './sfx';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Web Audio API is supported
 */
export function isWebAudioSupported(): boolean {
  return !!(window.AudioContext || (window as unknown as { webkitAudioContext: unknown }).webkitAudioContext);
}

/**
 * Check if speech synthesis is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  return 'speechSynthesis' in window;
}

/**
 * Format volume as percentage
 */
export function formatVolumeAsPercentage(volume: number): string {
  return `${Math.round(volume * 100)}%`;
}

/**
 * Convert decibels to gain value
 */
export function dbToGain(db: number): number {
  return Math.pow(10, db / 20);
}

/**
 * Convert gain value to decibels
 */
export function gainToDb(gain: number): number {
  return 20 * Math.log10(gain);
}

/**
 * Clamp volume between 0 and 1
 */
export function clampVolume(volume: number): number {
  return Math.max(0, Math.min(1, volume));
}

/**
 * Create a volume ramp for smooth transitions
 */
export function createVolumeRamp(
  from: number,
  to: number,
  duration: number,
  steps: number = 30
): number[] {
  const ramp: number[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    // Ease-in-out curve
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    ramp.push(from + (to - from) * eased);
  }
  return ramp;
}

// ============================================================================
// Predefined Configurations
// ============================================================================

/**
 * Preset audio configurations for different use cases
 */
export const AUDIO_PRESETS = {
  /** Default balanced settings */
  default: {
    masterVolume: 0.8,
    quality: 'high' as const,
    categoryVolumes: {
      sfx: 0.7,
      voice: 1.0,
      ambient: 0.5,
      ui: 0.6,
      ability: 0.8,
    },
  },
  
  /** Voice-focused settings */
  voiceFocused: {
    masterVolume: 0.9,
    quality: 'high' as const,
    categoryVolumes: {
      sfx: 0.4,
      voice: 1.0,
      ambient: 0.3,
      ui: 0.5,
      ability: 0.6,
    },
  },
  
  /** Performance-optimized settings */
  performance: {
    masterVolume: 0.7,
    quality: 'medium' as const,
    categoryVolumes: {
      sfx: 0.6,
      voice: 0.9,
      ambient: 0.4,
      ui: 0.5,
      ability: 0.7,
    },
  },
  
  /** Mobile/low-bandwidth settings */
  mobile: {
    masterVolume: 0.8,
    quality: 'low' as const,
    categoryVolumes: {
      sfx: 0.5,
      voice: 0.9,
      ambient: 0.3,
      ui: 0.5,
      ability: 0.6,
    },
  },
  
  /** Accessibility-focused settings */
  accessibility: {
    masterVolume: 0.9,
    quality: 'high' as const,
    categoryVolumes: {
      sfx: 0.8,
      voice: 1.0,
      ambient: 0.6,
      ui: 0.8,
      ability: 0.9,
    },
  },
};

/**
 * Apply a preset configuration
 */
export function applyAudioPreset(
  preset: keyof typeof AUDIO_PRESETS,
  manager?: import('./manager').AudioManager
): void {
  const config = AUDIO_PRESETS[preset];
  const audioManager = manager ?? getAudioManager();
  
  audioManager.setMasterVolume(config.masterVolume);
  audioManager.setQuality(config.quality);
  
  for (const [category, volume] of Object.entries(config.categoryVolumes)) {
    audioManager.setCategoryVolume(category as import('./types').AudioCategory, volume);
  }
}

// ============================================================================
// Integration Helpers
// ============================================================================

/**
 * Initialize the complete audio system
 */
export async function initializeAudioSystem(
  options?: import('./manager').AudioManagerConfig
): Promise<boolean> {
  const manager = getAudioManager(options);
  const initialized = await manager.initialize();
  
  if (initialized) {
    // Initialize subsystems
    getVoiceController();
    getSFXController();
  }
  
  return initialized;
}

/**
 * Dispose all audio system resources
 */
export function disposeAudioSystem(): void {
  destroyVoiceController();
  destroySFXController();
  destroyAudioManager();
}

/**
 * Resume audio context (useful after user interaction)
 */
export async function resumeAudioContext(): Promise<boolean> {
  const manager = getAudioManager();
  return manager.resume();
}

/**
 * Suspend audio context
 */
export async function suspendAudioContext(): Promise<void> {
  const manager = getAudioManager();
  return manager.suspend();
}

// ============================================================================
// Debug Utilities
// ============================================================================

/**
 * Debug logger for audio events
 */
export function attachAudioDebugger(
  logger: (message: string, data?: unknown) => void = console.log
): () => void {
  const manager = getAudioManager();
  
  const unsubs = [
    manager.on('initialized', (e) => logger('Audio initialized', e)),
    manager.on('suspended', (e) => logger('Audio suspended', e)),
    manager.on('resumed', (e) => logger('Audio resumed', e)),
    manager.on('volumeChanged', (e) => logger('Volume changed', e)),
    manager.on('voiceStarted', (e) => logger('Voice started', e)),
    manager.on('voiceEnded', (e) => logger('Voice ended', e)),
    manager.on('sfxPlayed', (e) => logger('SFX played', e)),
    manager.on('ambientChanged', (e) => logger('Ambient changed', e)),
    manager.on('error', (e) => logger('Audio error', e)),
  ];
  
  return () => {
    unsubs.forEach(unsub => unsub());
  };
}

// ============================================================================
// React Hooks (Re-exported from hooks)
// ============================================================================

export { useAudio } from '@/hooks/useAudio';
export type { UseAudioReturn, UseAudioOptions } from '@/hooks/useAudio';

// ============================================================================
// Version
// ============================================================================

export const AUDIO_SYSTEM_VERSION = '1.0.0';
