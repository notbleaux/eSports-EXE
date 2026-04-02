/** [Ver001.000]
 * Spatial Audio Library
 * =====================
 * Central export point for 3D spatial audio system.
 * 
 * Features:
 * - 3D audio positioning and spatialization
 * - HRTF support for immersive audio
 * - Distance attenuation and occlusion
 * - Doppler effect simulation
 * - Reverb zones and environment audio
 * - R3F integration helpers
 * 
 * Usage:
 * ```typescript
 * import { 
 *   getSpatialAudioEngine,
 *   getEnvironmentAudioManager,
 *   useSpatialAudio,
 *   SpatialAudio,
 * } from '@/lib/audio/spatial';
 * 
 * // Initialize engine
 * const engine = getSpatialAudioEngine();
 * await engine.initialize();
 * 
 * // Create spatial audio source
 * const sourceId = engine.createSource({
 *   type: 'mascot',
 *   position: { x: 5, y: 0, z: 0 },
 *   audioUrl: '/audio/mascot_voice.mp3',
 * });
 * 
 * // Play with 3D positioning
 * await engine.playSource(sourceId);
 * 
 * // Update position as mascot moves
 * engine.setSourcePosition(sourceId, { x: 3, y: 0, z: 2 });
 * ```
 */

// ============================================================================
// Internal Imports (for utility functions below)
// ============================================================================

import { getSpatialAudioEngine, destroySpatialAudioEngine } from './engine';
import { getEnvironmentAudioManager, destroyEnvironmentAudioManager } from './environment';

// ============================================================================
// Core Engine Exports
// ============================================================================

export {
  SpatialAudioEngine,
  getSpatialAudioEngine,
  destroySpatialAudioEngine,
  createSpatialAudioEngine,
} from './engine';

// ============================================================================
// Environment Manager Exports
// ============================================================================

export {
  EnvironmentAudioManager,
  getEnvironmentAudioManager,
  destroyEnvironmentAudioManager,
  createEnvironmentAudioManager,
} from './environment';

// ============================================================================
// Positioning Utilities Exports
// ============================================================================

export {
  // Position interpolation
  setSourcePositionSmooth,
  clearInterpolation,
  DEFAULT_INTERPOLATION_CONFIG,
  
  // Listener tracking
  createListenerTracker,
  type ListenerTracker,
  
  // Doppler calculations
  calculateDopplerRatio,
  calculateApproachDoppler,
  calculateRecedeDoppler,
  type DopplerParams,
  
  // Velocity effects
  calculateVelocityAudio,
  type VelocityAudioEffect,
  
  // R3F integration
  syncListenerWithCamera,
  syncSourceWithObject,
  
  // Vector math
  distance,
  distanceSquared,
  normalize,
  add,
  subtract,
  multiply,
  dot,
  cross,
  sphericalToCartesian,
  cartesianToSpherical,
  
  // Mascot helpers
  registerMascotAudio,
  updateMascotPosition,
  getMascotAudioPosition,
  getAllMascotAudioPositions,
  unregisterMascotAudio,
  type MascotAudioPosition,
} from './positioning';

// ============================================================================
// Types Exports
// ============================================================================

export type {
  // Vector types
  Vector3,
  Quaternion,
  Euler,
  
  // Audio source types
  AudioSourceId,
  AudioSourceType,
  SpatialAudioSource,
  AudioSourceOptions,
  
  // Listener types
  AudioListener,
  ListenerConfig,
  
  // HRTF types
  HRTFConfig,
  HRTFEntry,
  
  // Occlusion types
  OcclusionConfig,
  OcclusionState,
  
  // Reverb zone types
  ReverbZoneType,
  ReverbZone,
  ReverbZoneOptions,
  ReverbImpulseResponse,
  
  // Doppler types
  DopplerConfig,
  DopplerState,
  
  // Distance attenuation types
  DistanceModel,
  DistanceAttenuationConfig,
  
  // Environment types
  EnvironmentPreset,
  EnvironmentConfig,
  SoundscapeLayer,
  
  // Engine state types
  SpatialAudioState,
  SpatialAudioEngineConfig,
  
  // Event types
  SpatialAudioEventType,
  SpatialAudioEvent,
  SpatialAudioEventHandler,
  
  // Visualization types
  AudioVisualizationData,
  DistanceVisualizationConfig,
} from './types';

// ============================================================================
// Constants Exports
// ============================================================================

export {
  DEFAULT_VECTOR3,
  DEFAULT_FORWARD,
  DEFAULT_UP,
  DEFAULT_REVERB_ZONE,
  ENVIRONMENT_PRESETS,
  SPEED_OF_SOUND_AIR,
  SPEED_OF_SOUND_WATER,
} from './types';

// ============================================================================
// Environment Audio Types
// ============================================================================

export type {
  AmbientLayer,
  AmbientSoundscape,
  SoundscapeTransition,
  WeatherType,
  WeatherEffect,
  WeatherAudioLayer,
} from './environment';

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if spatial audio is supported
 */
export function isSpatialAudioSupported(): boolean {
  if (typeof window === 'undefined') return false;
  
  const AudioContextClass = window.AudioContext || 
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  
  if (!AudioContextClass) return false;
  
  try {
    const ctx = new AudioContextClass();
    // Check for PannerNode support (HRTF)
    const panner = ctx.createPanner();
    return panner.panningModel !== undefined;
  } catch {
    return false;
  }
}

/**
 * Check if HRTF is supported
 */
export function isHRTFSupported(): boolean {
  if (!isSpatialAudioSupported()) return false;
  
  try {
    const ctx = new (window.AudioContext || 
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    const panner = ctx.createPanner();
    panner.panningModel = 'HRTF';
    return panner.panningModel === 'HRTF';
  } catch {
    return false;
  }
}

/**
 * Initialize complete spatial audio system
 */
export async function initializeSpatialAudio(
  options?: { hrtf?: boolean; occlusion?: boolean; doppler?: boolean }
): Promise<boolean> {
  const engine = getSpatialAudioEngine({
    hrtfEnabled: options?.hrtf ?? true,
    occlusionEnabled: options?.occlusion ?? true,
    dopplerEnabled: options?.doppler ?? true,
  });
  
  const success = await engine.initialize();
  
  if (success) {
    // Initialize environment manager
    getEnvironmentAudioManager(engine);
  }
  
  return success;
}

/**
 * Dispose all spatial audio resources
 */
export function disposeSpatialAudio(): void {
  destroyEnvironmentAudioManager();
  destroySpatialAudioEngine();
}

/**
 * Get current spatial audio capabilities
 */
export function getSpatialAudioCapabilities(): {
  supported: boolean;
  hrtf: boolean;
  maxDistanceModels: number;
  recommendedMaxSources: number;
} {
  const supported = isSpatialAudioSupported();
  
  return {
    supported,
    hrtf: isHRTFSupported(),
    maxDistanceModels: supported ? 3 : 0, // linear, inverse, exponential
    recommendedMaxSources: supported ? 32 : 0,
  };
}

// ============================================================================
// Hub-Specific Presets
// ============================================================================

/**
 * Presets for each TENET hub environment
 */
export const HUB_AUDIO_PRESETS = {
  sator: {
    environment: 'medium_room' as const,
    soundscape: 'sator_hub',
    baseReverbGain: 0.4,
    ambientVolume: 0.5,
  },
  rotas: {
    environment: 'large_room' as const,
    soundscape: 'rotas_hub',
    baseReverbGain: 0.5,
    ambientVolume: 0.6,
  },
  arepo: {
    environment: 'cavern' as const,
    soundscape: 'arepo_hub',
    baseReverbGain: 0.6,
    ambientVolume: 0.45,
  },
  opera: {
    environment: 'hall' as const,
    soundscape: 'opera_hub',
    baseReverbGain: 0.7,
    ambientVolume: 0.5,
  },
  tenet: {
    environment: 'default' as const,
    soundscape: 'tenet_hub',
    baseReverbGain: 0.35,
    ambientVolume: 0.4,
  },
};

/**
 * Apply hub-specific audio preset
 */
export async function applyHubAudioPreset(
  hubId: keyof typeof HUB_AUDIO_PRESETS
): Promise<void> {
  const preset = HUB_AUDIO_PRESETS[hubId];
  if (!preset) return;

  const engine = getSpatialAudioEngine();
  const envManager = getEnvironmentAudioManager();

  // Apply environment preset
  engine.applyEnvironmentPreset(preset.environment);

  // Play soundscape
  await envManager.playSoundscape(preset.soundscape);

  // Set reverb gain
  engine['state'].globalReverbGain = preset.baseReverbGain;
}

// ============================================================================
// Version
// ============================================================================

export const SPATIAL_AUDIO_VERSION = '1.0.0';
