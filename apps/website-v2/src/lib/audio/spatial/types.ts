/** [Ver001.000]
 * Spatial Audio Types
 * ===================
 * Type definitions for 3D spatial audio system.
 * Provides comprehensive type safety for immersive mascot audio experiences.
 * 
 * Features:
 * - 3D position and orientation types
 * - HRTF (Head-Related Transfer Function) configuration
 * - Occlusion and reverb zone definitions
 * - Doppler effect parameters
 */

// ============================================================================
// Vector Types
// ============================================================================

/**
 * 3D Vector for positions, velocities, and directions
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Quaternion for 3D rotations
 */
export interface Quaternion {
  x: number;
  y: number;
  z: number;
  w: number;
}

/**
 * Euler angles for 3D rotation
 */
export interface Euler {
  x: number;
  y: number;
  z: number;
  order?: 'XYZ' | 'YZX' | 'ZXY' | 'XZY' | 'YXZ' | 'ZYX';
}

// ============================================================================
// Audio Source Types
// ============================================================================

/**
 * Unique identifier for spatial audio sources
 */
export type AudioSourceId = string;

/**
 * Audio source types
 */
export type AudioSourceType = 'mascot' | 'ambient' | 'effect' | 'ui' | 'voice';

/**
 * Spatial audio source configuration
 */
export interface SpatialAudioSource {
  id: AudioSourceId;
  type: AudioSourceType;
  position: Vector3;
  velocity?: Vector3;
  orientation?: Vector3;
  volume: number;
  pitch: number;
  loop: boolean;
  audioUrl?: string;
  buffer?: AudioBuffer;
  maxDistance: number;
  refDistance: number;
  rolloffFactor: number;
  coneInnerAngle: number;
  coneOuterAngle: number;
  coneOuterGain: number;
  isPlaying: boolean;
  isPaused: boolean;
  currentTime: number;
  playbackRate: number;
  muted: boolean;
}

/**
 * Audio source creation options
 */
export interface AudioSourceOptions {
  id?: AudioSourceId;
  type?: AudioSourceType;
  position?: Partial<Vector3>;
  velocity?: Partial<Vector3>;
  orientation?: Partial<Vector3>;
  volume?: number;
  pitch?: number;
  loop?: boolean;
  audioUrl?: string;
  buffer?: AudioBuffer;
  maxDistance?: number;
  refDistance?: number;
  rolloffFactor?: number;
  coneInnerAngle?: number;
  coneOuterAngle?: number;
  coneOuterGain?: number;
}

// ============================================================================
// Listener Types
// ============================================================================

/**
 * Audio listener state
 */
export interface AudioListener {
  position: Vector3;
  velocity: Vector3;
  forward: Vector3;
  up: Vector3;
  listenerObject?: AudioListenerNode;
}

/**
 * Audio listener configuration
 */
export interface ListenerConfig {
  position?: Partial<Vector3>;
  velocity?: Partial<Vector3>;
  forward?: Partial<Vector3>;
  up?: Partial<Vector3>;
}

// ============================================================================
// HRTF Types
// ============================================================================

/**
 * HRTF (Head-Related Transfer Function) configuration
 */
export interface HRTFConfig {
  enabled: boolean;
  azimuth: number;
  elevation: number;
  distance: number;
  sampleRate: number;
  crossfadeDuration: number;
}

/**
 * HRTF database entry
 */
export interface HRTFEntry {
  azimuth: number;
  elevation: number;
  leftEar: Float32Array;
  rightEar: Float32Array;
  sampleRate: number;
}

// ============================================================================
// Occlusion Types
// ============================================================================

/**
 * Occlusion configuration for sound obstruction
 */
export interface OcclusionConfig {
  enabled: boolean;
  lowpassFrequency: number;
  lowpassQ: number;
  volumeAttenuation: number;
  maxOcclusion: number;
  updateInterval: number;
}

/**
 * Occlusion state for an audio source
 */
export interface OcclusionState {
  isOccluded: boolean;
  occlusionFactor: number;
  lowpassFilter: BiquadFilterNode | null;
  lastUpdate: number;
}

// ============================================================================
// Reverb Zone Types
// ============================================================================

/**
 * Reverb zone type
 */
export type ReverbZoneType = 'room' | 'hall' | 'cavern' | 'outside' | 'underwater' | 'custom';

/**
 * Reverb zone configuration
 */
export interface ReverbZone {
  id: string;
  name: string;
  type: ReverbZoneType;
  center: Vector3;
  size: Vector3;
  shape: 'box' | 'sphere';
  reverbTime: number; // RT60 in seconds
  reverbPreDelay: number; // Pre-delay in seconds
  reverbDecay: number; // High frequency decay ratio
  reverbGain: number;
  transitionDistance: number;
  isGlobal: boolean;
}

/**
 * Reverb zone creation options
 */
export interface ReverbZoneOptions {
  id?: string;
  name?: string;
  type?: ReverbZoneType;
  center?: Partial<Vector3>;
  size?: Partial<Vector3>;
  shape?: 'box' | 'sphere';
  reverbTime?: number;
  reverbPreDelay?: number;
  reverbDecay?: number;
  reverbGain?: number;
  transitionDistance?: number;
  isGlobal?: boolean;
}

/**
 * Reverb impulse response
 */
export interface ReverbImpulseResponse {
  id: string;
  name: string;
  buffer: AudioBuffer;
  reverbTime: number;
  sampleRate: number;
}

// ============================================================================
// Doppler Effect Types
// ============================================================================

/**
 * Doppler effect configuration
 */
export interface DopplerConfig {
  enabled: boolean;
  dopplerFactor: number;
  speedOfSound: number; // m/s
  maxPitchShift: number; // Maximum pitch shift ratio
}

/**
 * Doppler state for a source
 */
export interface DopplerState {
  lastPosition: Vector3;
  lastTime: number;
  currentPitch: number;
}

// ============================================================================
// Distance Attenuation Types
// ============================================================================

/**
 * Distance attenuation model
 */
export type DistanceModel = 'linear' | 'inverse' | 'exponential' | 'custom';

/**
 * Distance attenuation configuration
 */
export interface DistanceAttenuationConfig {
  model: DistanceModel;
  refDistance: number;
  maxDistance: number;
  rolloffFactor: number;
  customCurve?: Float32Array;
}

// ============================================================================
// Environment Audio Types
// ============================================================================

/**
 * Environment preset
 */
export type EnvironmentPreset = 
  | 'default'
  | 'small_room'
  | 'medium_room'
  | 'large_room'
  | 'hall'
  | 'cavern'
  | 'outdoor'
  | 'underwater'
  | 'space';

/**
 * Environment audio configuration
 */
export interface EnvironmentConfig {
  preset: EnvironmentPreset;
  reverbZone: ReverbZone | null;
  ambientSoundscape: string | null;
  ambientVolume: number;
  occlusionEnabled: boolean;
  dopplerEnabled: boolean;
  hrtfEnabled: boolean;
}

/**
 * Soundscape layer
 */
export interface SoundscapeLayer {
  id: string;
  name: string;
  audioUrl: string;
  volume: number;
  loop: boolean;
  spatialized: boolean;
  minDistance: number;
  maxDistance: number;
  position?: Vector3;
}

// ============================================================================
// Engine State Types
// ============================================================================

/**
 * Spatial audio engine state
 */
export interface SpatialAudioState {
  isInitialized: boolean;
  listener: AudioListener;
  sources: Map<AudioSourceId, SpatialAudioSource>;
  reverbZones: Map<string, ReverbZone>;
  activeReverbZone: ReverbZone | null;
  globalReverbGain: number;
  masterVolume: number;
  isMuted: boolean;
}

/**
 * Spatial audio engine configuration
 */
export interface SpatialAudioEngineConfig {
  audioContext?: AudioContext;
  masterVolume?: number;
  hrtfEnabled?: boolean;
  occlusionEnabled?: boolean;
  dopplerEnabled?: boolean;
  maxSources?: number;
  updateRate?: number; // Updates per second
  defaultDistanceModel?: DistanceModel;
}

// ============================================================================
// Event Types
// ============================================================================

/**
 * Spatial audio event types
 */
export type SpatialAudioEventType = 
  | 'sourceCreated'
  | 'sourceDestroyed'
  | 'sourceStarted'
  | 'sourceStopped'
  | 'sourceMoved'
  | 'listenerMoved'
  | 'zoneEntered'
  | 'zoneExited'
  | 'occlusionChanged'
  | 'reverbChanged'
  | 'error';

/**
 * Spatial audio event
 */
export interface SpatialAudioEvent {
  type: SpatialAudioEventType;
  timestamp: number;
  sourceId?: AudioSourceId;
  zoneId?: string;
  data?: unknown;
}

/**
 * Event handler type
 */
export type SpatialAudioEventHandler = (event: SpatialAudioEvent) => void;

// ============================================================================
// Visualization Types
// ============================================================================

/**
 * Audio visualization data
 */
export interface AudioVisualizationData {
  sourceId: AudioSourceId;
  position: Vector3;
  volume: number;
  isPlaying: boolean;
  distance: number;
  occlusionFactor: number;
}

/**
 * Distance visualization settings
 */
export interface DistanceVisualizationConfig {
  enabled: boolean;
  showRings: boolean;
  showCone: boolean;
  ringCount: number;
  ringColor: string;
  coneColor: string;
  fadeWithDistance: boolean;
}

// ============================================================================
// Constants
// ============================================================================

export const DEFAULT_VECTOR3: Vector3 = { x: 0, y: 0, z: 0 };
export const DEFAULT_FORWARD: Vector3 = { x: 0, y: 0, z: -1 };
export const DEFAULT_UP: Vector3 = { x: 0, y: 1, z: 0 };

export const DEFAULT_REVERB_ZONE: ReverbZone = {
  id: 'default',
  name: 'Default',
  type: 'room',
  center: { x: 0, y: 0, z: 0 },
  size: { x: 50, y: 20, z: 50 },
  shape: 'box',
  reverbTime: 1.5,
  reverbPreDelay: 0.02,
  reverbDecay: 0.5,
  reverbGain: 0.3,
  transitionDistance: 5,
  isGlobal: false,
};

export const ENVIRONMENT_PRESETS: Record<EnvironmentPreset, Partial<ReverbZone>> = {
  default: { reverbTime: 1.2, reverbPreDelay: 0.01, reverbDecay: 0.5, reverbGain: 0.2 },
  small_room: { reverbTime: 0.5, reverbPreDelay: 0.005, reverbDecay: 0.3, reverbGain: 0.15 },
  medium_room: { reverbTime: 1.0, reverbPreDelay: 0.015, reverbDecay: 0.4, reverbGain: 0.25 },
  large_room: { reverbTime: 2.0, reverbPreDelay: 0.025, reverbDecay: 0.5, reverbGain: 0.35 },
  hall: { reverbTime: 3.5, reverbPreDelay: 0.04, reverbDecay: 0.6, reverbGain: 0.4 },
  cavern: { reverbTime: 5.0, reverbPreDelay: 0.05, reverbDecay: 0.4, reverbGain: 0.5 },
  outdoor: { reverbTime: 0.1, reverbPreDelay: 0.001, reverbDecay: 0.9, reverbGain: 0.05 },
  underwater: { reverbTime: 0.3, reverbPreDelay: 0.02, reverbDecay: 0.2, reverbGain: 0.6 },
  space: { reverbTime: 0, reverbPreDelay: 0, reverbDecay: 1, reverbGain: 0 },
};

export const SPEED_OF_SOUND_AIR = 343; // m/s at 20°C
export const SPEED_OF_SOUND_WATER = 1482; // m/s
