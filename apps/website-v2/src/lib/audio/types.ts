/** [Ver001.000]
 * Audio System Types
 * ==================
 * Type definitions for the Libre-X-eSport audio system.
 * Provides comprehensive audio control for mascot voices, SFX, and ambient audio.
 * 
 * Features:
 * - Type-safe audio categories and priorities
 * - Voice line management with emotional states
 * - SFX event handling with priority queue
 * - Web Audio API integration types
 */

import type { MascotId } from '@/components/mascots/types';

// ============================================================================
// Audio Categories
// ============================================================================

export type AudioCategory = 'sfx' | 'voice' | 'ambient' | 'ui' | 'ability';

export interface AudioCategoryConfig {
  name: AudioCategory;
  displayName: string;
  defaultVolume: number;
  muted: boolean;
  maxConcurrent: number;
  priorityBoost: number;
}

// ============================================================================
// Audio Priority System
// ============================================================================

export type AudioPriority = 'low' | 'normal' | 'high' | 'critical';

export const PRIORITY_WEIGHTS: Record<AudioPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  critical: 4,
};

// ============================================================================
// Audio State
// ============================================================================

export interface AudioState {
  masterVolume: number;
  masterMuted: boolean;
  categories: Record<AudioCategory, AudioCategoryConfig>;
  audioQuality: AudioQuality;
  spatialAudioEnabled: boolean;
}

export type AudioQuality = 'low' | 'medium' | 'high';

export interface AudioQualityConfig {
  sampleRate: number;
  maxConcurrentSounds: number;
  useCompression: boolean;
  spatialAudio: boolean;
}

export const AUDIO_QUALITY_CONFIGS: Record<AudioQuality, AudioQualityConfig> = {
  low: {
    sampleRate: 22050,
    maxConcurrentSounds: 8,
    useCompression: true,
    spatialAudio: false,
  },
  medium: {
    sampleRate: 44100,
    maxConcurrentSounds: 16,
    useCompression: true,
    spatialAudio: true,
  },
  high: {
    sampleRate: 48000,
    maxConcurrentSounds: 32,
    useCompression: false,
    spatialAudio: true,
  },
};

// ============================================================================
// Voice System Types
// ============================================================================

export type VoiceEmotion = 
  | 'neutral' 
  | 'happy' 
  | 'excited' 
  | 'sad' 
  | 'angry' 
  | 'surprised'
  | 'confident'
  | 'encouraging';

export type VoiceContext = 
  | 'greeting'
  | 'ability_use'
  | 'victory'
  | 'defeat'
  | 'encouragement'
  | 'reaction'
  | 'farewell'
  | 'idle';

export interface VoiceLine {
  id: string;
  mascotId: MascotId;
  text: string;
  emotion: VoiceEmotion;
  context: VoiceContext;
  duration: number;
  audioUrl?: string;
  fallbackText: string;
  intensity: number; // 0-1, for matching to situation
  cooldown: number; // seconds before this line can play again
  priority: AudioPriority;
}

export interface VoiceLineRequest {
  mascotId: MascotId;
  context: VoiceContext;
  emotion?: VoiceEmotion;
  intensity?: number;
  preferShort?: boolean;
  excludeRecent?: boolean;
}

export interface VoicePlaybackState {
  isPlaying: boolean;
  currentLine: VoiceLine | null;
  queue: VoiceLine[];
  lastPlayed: Map<string, number>; // voice line id -> timestamp
}

// ============================================================================
// SFX Types
// ============================================================================

export type SFXType = 
  | 'ability_cast'
  | 'ability_hit'
  | 'ability_block'
  | 'ui_click'
  | 'ui_hover'
  | 'ui_success'
  | 'ui_error'
  | 'ui_transition'
  | 'event_alert'
  | 'event_achievement'
  | 'ambient_hub'
  | 'ambient_match';

export interface SFXEvent {
  id: string;
  type: SFXType;
  category: AudioCategory;
  priority: AudioPriority;
  audioUrl?: string;
  duration: number;
  loop?: boolean;
  volumeModifier?: number; // 0-1 multiplier
  spatialPosition?: SpatialPosition;
  delay?: number; // ms delay before playing
}

export interface SpatialPosition {
  x: number;
  y: number;
  z: number;
}

export interface SFXPlaybackState {
  activeSounds: Map<string, ActiveSound>;
  queuedSounds: SFXEvent[];
}

export interface ActiveSound {
  event: SFXEvent;
  sourceNode: AudioBufferSourceNode | null;
  gainNode: GainNode | null;
  startTime: number;
  pausedAt: number | null;
}

// ============================================================================
// Ambient Audio Types
// ============================================================================

export type AmbientType = 
  | 'hub_sator'
  | 'hub_rotas'
  | 'hub_arepo'
  | 'hub_opera'
  | 'hub_tenet'
  | 'menu_main'
  | 'match_ongoing'
  | 'match_intense'
  | 'victory'
  | 'defeat';

export interface AmbientTrack {
  id: AmbientType;
  displayName: string;
  audioUrl: string;
  loop: boolean;
  crossfadeDuration: number;
  baseVolume: number;
}

export interface AmbientState {
  currentTrack: AmbientType | null;
  previousTrack: AmbientType | null;
  isTransitioning: boolean;
  transitionProgress: number;
}

// ============================================================================
// Audio Manager Types
// ============================================================================

export interface AudioManagerConfig {
  masterVolume?: number;
  quality?: AudioQuality;
  spatialAudio?: boolean;
  autoResume?: boolean;
  categoryVolumes?: Partial<Record<AudioCategory, number>>;
}

export interface AudioManagerState {
  isInitialized: boolean;
  isSuspended: boolean;
  audioContext: AudioContext | null;
  masterGain: GainNode | null;
  categoryGains: Map<AudioCategory, GainNode>;
  compressor: DynamicsCompressorNode | null;
  analyser: AnalyserNode | null;
}

export type AudioEventType = 
  | 'initialized'
  | 'suspended'
  | 'resumed'
  | 'volumeChanged'
  | 'categoryMuted'
  | 'voiceStarted'
  | 'voiceEnded'
  | 'sfxPlayed'
  | 'sfxStopped'
  | 'ambientChanged'
  | 'error';

export interface AudioEvent {
  type: AudioEventType;
  timestamp: number;
  category?: AudioCategory;
  data?: unknown;
}

export type AudioEventHandler = (event: AudioEvent) => void;

// ============================================================================
// Web Audio API Types
// ============================================================================

export interface AudioBufferCache {
  get(url: string): AudioBuffer | undefined;
  set(url: string, buffer: AudioBuffer): void;
  has(url: string): boolean;
  clear(): void;
  size: number;
}

export interface PannerConfig {
  panningModel: PanningModelType;
  distanceModel: DistanceModelType;
  refDistance: number;
  maxDistance: number;
  rolloffFactor: number;
  coneInnerAngle: number;
  coneOuterAngle: number;
  coneOuterGain: number;
}

export const DEFAULT_PANNER_CONFIG: PannerConfig = {
  panningModel: 'HRTF',
  distanceModel: 'inverse',
  refDistance: 1,
  maxDistance: 10000,
  rolloffFactor: 1,
  coneInnerAngle: 360,
  coneOuterAngle: 360,
  coneOuterGain: 0,
};

// ============================================================================
// Hook Types
// ============================================================================

export interface UseAudioReturn {
  // State
  isInitialized: boolean;
  isSuspended: boolean;
  masterVolume: number;
  masterMuted: boolean;
  
  // Control
  initialize: () => Promise<boolean>;
  suspend: () => void;
  resume: () => Promise<boolean>;
  
  // Volume
  setMasterVolume: (volume: number) => void;
  setCategoryVolume: (category: AudioCategory, volume: number) => void;
  toggleMute: () => void;
  toggleCategoryMute: (category: AudioCategory) => void;
  
  // Playback
  playSFX: (event: SFXEvent) => Promise<string | null>;
  stopSFX: (id: string) => void;
  stopAllSFX: () => void;
  
  // Voice
  playVoiceLine: (request: VoiceLineRequest) => Promise<boolean>;
  stopVoice: () => void;
  
  // Ambient
  playAmbient: (type: AmbientType, crossfade?: number) => void;
  stopAmbient: (fadeOut?: number) => void;
  
  // Settings
  setQuality: (quality: AudioQuality) => void;
  getCategoryVolume: (category: AudioCategory) => number;
  isCategoryMuted: (category: AudioCategory) => boolean;
}

export interface UseAudioOptions {
  autoInitialize?: boolean;
  onError?: (error: Error) => void;
  onVoiceStart?: (line: VoiceLine) => void;
  onVoiceEnd?: (line: VoiceLine) => void;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_AUDIO_STATE: AudioState = {
  masterVolume: 0.8,
  masterMuted: false,
  categories: {
    sfx: {
      name: 'sfx',
      displayName: 'Sound Effects',
      defaultVolume: 0.7,
      muted: false,
      maxConcurrent: 8,
      priorityBoost: 0,
    },
    voice: {
      name: 'voice',
      displayName: 'Mascot Voices',
      defaultVolume: 1.0,
      muted: false,
      maxConcurrent: 1,
      priorityBoost: 1,
    },
    ambient: {
      name: 'ambient',
      displayName: 'Ambient Audio',
      defaultVolume: 0.5,
      muted: false,
      maxConcurrent: 2,
      priorityBoost: 0,
    },
    ui: {
      name: 'ui',
      displayName: 'UI Sounds',
      defaultVolume: 0.6,
      muted: false,
      maxConcurrent: 4,
      priorityBoost: 0,
    },
    ability: {
      name: 'ability',
      displayName: 'Ability Sounds',
      defaultVolume: 0.8,
      muted: false,
      maxConcurrent: 4,
      priorityBoost: 1,
    },
  },
  audioQuality: 'high',
  spatialAudioEnabled: true,
};

export const MAX_QUEUE_SIZE = 20;
export const DEFAULT_CROSSFADE_DURATION = 2000; // ms
export const VOICE_LINE_COOLDOWN = 30000; // 30 seconds default
