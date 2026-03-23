/** [Ver001.000]
 * Audio Positioning Utilities
 * ===========================
 * Utilities for positioning audio sources in 3D space with advanced features.
 * 
 * Features:
 * - Position audio sources in 3D space
 * - Listener position tracking and synchronization
 * - Doppler effect calculations
 * - Velocity-based audio changes
 * - Smooth position interpolation
 * - R3F integration helpers
 * 
 * Integration:
 * - Works with R3F scene graph
 * - Syncs with Three.js camera and objects
 * - Supports mascot animation positions
 */

import {
  type Vector3,
  type AudioSourceId,
  type SpatialAudioSource,
  DEFAULT_VECTOR3,
  SPEED_OF_SOUND_AIR,
} from './types';
import { type SpatialAudioEngine, getSpatialAudioEngine } from './engine';

// ============================================================================
// Position Interpolation
// ============================================================================

export interface InterpolationConfig {
  enabled: boolean;
  smoothingFactor: number; // 0-1, higher = more responsive
  maxDelta: number; // Maximum position change per frame
  useVelocityPrediction: boolean;
}

export const DEFAULT_INTERPOLATION_CONFIG: InterpolationConfig = {
  enabled: true,
  smoothingFactor: 0.3,
  maxDelta: 10,
  useVelocityPrediction: true,
};

interface InterpolatedPosition {
  current: Vector3;
  target: Vector3;
  velocity: Vector3;
  lastUpdate: number;
}

const interpolatedPositions = new Map<AudioSourceId, InterpolatedPosition>();

/**
 * Set source position with smooth interpolation
 */
export function setSourcePositionSmooth(
  engine: SpatialAudioEngine,
  sourceId: AudioSourceId,
  targetPosition: Vector3,
  config: Partial<InterpolationConfig> = {}
): boolean {
  const fullConfig = { ...DEFAULT_INTERPOLATION_CONFIG, ...config };
  
  if (!fullConfig.enabled) {
    return engine.setSourcePosition(sourceId, targetPosition);
  }

  // Get or create interpolated position
  let interp = interpolatedPositions.get(sourceId);
  if (!interp) {
    // Get current source position or use default
    const source = engine.getSource(sourceId);
    const currentPos = source?.position ?? { ...DEFAULT_VECTOR3 };
    
    interp = {
      current: { ...currentPos },
      target: { ...targetPosition },
      velocity: { ...DEFAULT_VECTOR3 },
      lastUpdate: performance.now(),
    };
    interpolatedPositions.set(sourceId, interp);
  }

  // Update target
  interp.target = { ...targetPosition };

  // Calculate velocity
  const now = performance.now();
  const dt = (now - interp.lastUpdate) / 1000;
  
  if (dt > 0 && fullConfig.useVelocityPrediction) {
    interp.velocity = {
      x: (targetPosition.x - interp.current.x) / dt,
      y: (targetPosition.y - interp.current.y) / dt,
      z: (targetPosition.z - interp.current.z) / dt,
    };
  }

  // Smooth interpolation
  interp.current.x = lerp(interp.current.x, interp.target.x, fullConfig.smoothingFactor);
  interp.current.y = lerp(interp.current.y, interp.target.y, fullConfig.smoothingFactor);
  interp.current.z = lerp(interp.current.z, interp.target.z, fullConfig.smoothingFactor);

  // Clamp delta
  const deltaX = interp.current.x - interp.target.x;
  const deltaY = interp.current.y - interp.target.y;
  const deltaZ = interp.current.z - interp.target.z;
  
  if (Math.abs(deltaX) > fullConfig.maxDelta) {
    interp.current.x = interp.target.x + Math.sign(deltaX) * fullConfig.maxDelta;
  }
  if (Math.abs(deltaY) > fullConfig.maxDelta) {
    interp.current.y = interp.target.y + Math.sign(deltaY) * fullConfig.maxDelta;
  }
  if (Math.abs(deltaZ) > fullConfig.maxDelta) {
    interp.current.z = interp.target.z + Math.sign(deltaZ) * fullConfig.maxDelta;
  }

  interp.lastUpdate = now;

  // Update engine with smoothed position
  const success = engine.setSourcePosition(sourceId, interp.current);
  
  // Also update velocity in engine
  if (fullConfig.useVelocityPrediction) {
    engine.setSourceVelocity(sourceId, interp.velocity);
  }

  return success;
}

/**
 * Linear interpolation helper
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Clear interpolation data for a source
 */
export function clearInterpolation(sourceId: AudioSourceId): void {
  interpolatedPositions.delete(sourceId);
}

// ============================================================================
// Listener Tracking
// ============================================================================

export interface ListenerTracker {
  position: Vector3;
  forward: Vector3;
  up: Vector3;
  velocity: Vector3;
  lastUpdate: number;
  update: (position: Vector3, forward?: Vector3, up?: Vector3) => void;
}

/**
 * Create a listener tracker with velocity calculation
 */
export function createListenerTracker(
  engine: SpatialAudioEngine,
  initialPosition: Vector3 = DEFAULT_VECTOR3
): ListenerTracker {
  const tracker: ListenerTracker = {
    position: { ...initialPosition },
    forward: { x: 0, y: 0, z: -1 },
    up: { x: 0, y: 1, z: 0 },
    velocity: { ...DEFAULT_VECTOR3 },
    lastUpdate: performance.now(),
    
    update(position: Vector3, forward?: Vector3, up?: Vector3) {
      const now = performance.now();
      const dt = (now - this.lastUpdate) / 1000;
      
      // Calculate velocity
      if (dt > 0) {
        this.velocity = {
          x: (position.x - this.position.x) / dt,
          y: (position.y - this.position.y) / dt,
          z: (position.z - this.position.z) / dt,
        };
      }
      
      // Update position
      this.position = { ...position };
      if (forward) this.forward = { ...forward };
      if (up) this.up = { ...up };
      this.lastUpdate = now;
      
      // Update engine
      engine.setListenerPosition(this.position, {
        forward: this.forward,
        up: this.up,
      });
    },
  };
  
  return tracker;
}

// ============================================================================
// Doppler Effect Calculations
// ============================================================================

export interface DopplerParams {
  sourceVelocity: Vector3;
  listenerVelocity: Vector3;
  sourcePosition: Vector3;
  listenerPosition: Vector3;
  speedOfSound: number;
  dopplerFactor: number;
}

/**
 * Calculate Doppler pitch shift ratio
 */
export function calculateDopplerRatio(params: DopplerParams): number {
  // Calculate distance vector
  const distance = {
    x: params.sourcePosition.x - params.listenerPosition.x,
    y: params.sourcePosition.y - params.listenerPosition.y,
    z: params.sourcePosition.z - params.listenerPosition.z,
  };
  const dist = Math.sqrt(distance.x ** 2 + distance.y ** 2 + distance.z ** 2);
  
  if (dist < 0.001) return 1;
  
  // Calculate relative velocity
  const relativeVelocity = {
    x: params.sourceVelocity.x - params.listenerVelocity.x,
    y: params.sourceVelocity.y - params.listenerVelocity.y,
    z: params.sourceVelocity.z - params.listenerVelocity.z,
  };
  
  // Radial velocity (component along line of sight)
  const radialVelocity = (
    relativeVelocity.x * distance.x +
    relativeVelocity.y * distance.y +
    relativeVelocity.z * distance.z
  ) / dist;
  
  // Calculate Doppler ratio
  const ratio = params.speedOfSound / (params.speedOfSound - radialVelocity * params.dopplerFactor);
  
  // Clamp to reasonable range
  return Math.max(0.5, Math.min(2, ratio));
}

/**
 * Calculate Doppler ratio for a moving source toward a stationary listener
 */
export function calculateApproachDoppler(
  approachSpeed: number,
  speedOfSound: number = SPEED_OF_SOUND_AIR
): number {
  return speedOfSound / (speedOfSound - approachSpeed);
}

/**
 * Calculate Doppler ratio for a moving source away from a stationary listener
 */
export function calculateRecedeDoppler(
  recedeSpeed: number,
  speedOfSound: number = SPEED_OF_SOUND_AIR
): number {
  return speedOfSound / (speedOfSound + recedeSpeed);
}

// ============================================================================
// Velocity-Based Audio Changes
// ============================================================================

export interface VelocityAudioEffect {
  minVelocity: number;
  maxVelocity: number;
  pitchShift: number; // Semitones
  volumeBoost: number; // dB
  filterFrequency: number; // Hz
}

/**
 * Calculate audio parameters based on velocity
 */
export function calculateVelocityAudio(
  velocity: Vector3,
  effects: VelocityAudioEffect[]
): { pitch: number; volume: number; filterFreq: number } {
  const speed = Math.sqrt(velocity.x ** 2 + velocity.y ** 2 + velocity.z ** 2);
  
  // Find applicable effect range
  let activeEffect: VelocityAudioEffect | null = null;
  let t = 0;
  
  for (const effect of effects) {
    if (speed >= effect.minVelocity && speed <= effect.maxVelocity) {
      activeEffect = effect;
      t = (speed - effect.minVelocity) / (effect.maxVelocity - effect.minVelocity);
      break;
    }
  }
  
  if (!activeEffect) {
    // Use nearest effect
    const below = effects.filter(e => speed < e.minVelocity).pop();
    const above = effects.find(e => speed > e.maxVelocity);
    activeEffect = below || above || effects[0] || null;
    t = speed < (below?.maxVelocity ?? 0) ? 0 : 1;
  }
  
  if (!activeEffect) {
    return { pitch: 1, volume: 1, filterFreq: 20000 };
  }
  
  // Convert semitones to ratio
  const pitchRatio = Math.pow(2, activeEffect.pitchShift / 12);
  
  // Convert dB to gain
  const volumeGain = Math.pow(10, activeEffect.volumeBoost / 20);
  
  return {
    pitch: pitchRatio,
    volume: volumeGain,
    filterFreq: activeEffect.filterFrequency,
  };
}

// ============================================================================
// R3F Integration
// ============================================================================

// Types for R3F integration (without importing Three.js directly)
interface R3FVector3 {
  x: number;
  y: number;
  z: number;
}

interface R3FObject3D {
  position: R3FVector3;
  rotation: { x: number; y: number; z: number; order?: string };
  getWorldPosition(target: { set: (x: number, y: number, z: number) => void }): void;
  getWorldDirection(target: { set: (x: number, y: number, z: number) => void }): void;
}

interface R3FCamera extends R3FObject3D {
  up: R3FVector3;
}

/**
 * Sync listener position with R3F camera
 */
export function syncListenerWithCamera(
  engine: SpatialAudioEngine,
  camera: R3FCamera,
  tracker?: ListenerTracker
): void {
  // Get world position
  const position = { x: 0, y: 0, z: 0 };
  const direction = { x: 0, y: 0, z: 0 };
  
  camera.getWorldPosition({ set: (x, y, z) => { position.x = x; position.y = y; position.z = z; } });
  camera.getWorldDirection({ set: (x, y, z) => { direction.x = x; direction.y = y; direction.z = z; } });
  
  const up = {
    x: camera.up.x,
    y: camera.up.y,
    z: camera.up.z,
  };
  
  if (tracker) {
    tracker.update(position, direction, up);
  } else {
    engine.setListenerPosition(position, { forward: direction, up });
  }
}

/**
 * Sync audio source with R3F object
 */
export function syncSourceWithObject(
  engine: SpatialAudioEngine,
  sourceId: AudioSourceId,
  object: R3FObject3D,
  config?: Partial<InterpolationConfig>
): boolean {
  const position = { x: 0, y: 0, z: 0 };
  object.getWorldPosition({ set: (x, y, z) => { position.x = x; position.y = y; position.z = z; } });
  
  return setSourcePositionSmooth(engine, sourceId, position, config);
}

// ============================================================================
// Position Utilities
// ============================================================================

/**
 * Calculate distance between two points
 */
export function distance(a: Vector3, b: Vector3): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2) +
    Math.pow(a.z - b.z, 2)
  );
}

/**
 * Calculate squared distance (faster, for comparisons)
 */
export function distanceSquared(a: Vector3, b: Vector3): number {
  return (
    Math.pow(a.x - b.x, 2) +
    Math.pow(a.y - b.y, 2) +
    Math.pow(a.z - b.z, 2)
  );
}

/**
 * Normalize a vector
 */
export function normalize(v: Vector3): Vector3 {
  const len = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
  if (len < 0.0001) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

/**
 * Add two vectors
 */
export function add(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

/**
 * Subtract two vectors
 */
export function subtract(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

/**
 * Multiply vector by scalar
 */
export function multiply(v: Vector3, scalar: number): Vector3 {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
}

/**
 * Dot product of two vectors
 */
export function dot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

/**
 * Cross product of two vectors
 */
export function cross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

/**
 * Convert spherical coordinates to cartesian
 */
export function sphericalToCartesian(
  radius: number,
  theta: number, // azimuth angle in radians
  phi: number // polar angle in radians
): Vector3 {
  return {
    x: radius * Math.sin(phi) * Math.cos(theta),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.sin(theta),
  };
}

/**
 * Convert cartesian coordinates to spherical
 */
export function cartesianToSpherical(v: Vector3): { radius: number; theta: number; phi: number } {
  const radius = Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
  if (radius < 0.0001) return { radius: 0, theta: 0, phi: 0 };
  
  return {
    radius,
    theta: Math.atan2(v.z, v.x),
    phi: Math.acos(v.y / radius),
  };
}

// ============================================================================
// Mascot Position Helpers
// ============================================================================

export interface MascotAudioPosition {
  mascotId: string;
  audioSourceId: AudioSourceId;
  position: Vector3;
  isSpeaking: boolean;
}

const mascotAudioPositions = new Map<string, MascotAudioPosition>();

/**
 * Register a mascot's audio position
 */
export function registerMascotAudio(
  mascotId: string,
  audioSourceId: AudioSourceId,
  initialPosition: Vector3 = DEFAULT_VECTOR3
): MascotAudioPosition {
  const position: MascotAudioPosition = {
    mascotId,
    audioSourceId,
    position: initialPosition,
    isSpeaking: false,
  };
  
  mascotAudioPositions.set(mascotId, position);
  return position;
}

/**
 * Update a mascot's audio position
 */
export function updateMascotPosition(
  engine: SpatialAudioEngine,
  mascotId: string,
  position: Vector3
): boolean {
  const mascot = mascotAudioPositions.get(mascotId);
  if (!mascot) return false;
  
  mascot.position = position;
  return engine.setSourcePosition(mascot.audioSourceId, position);
}

/**
 * Get mascot audio position
 */
export function getMascotAudioPosition(mascotId: string): MascotAudioPosition | undefined {
  return mascotAudioPositions.get(mascotId);
}

/**
 * Get all mascot audio positions
 */
export function getAllMascotAudioPositions(): MascotAudioPosition[] {
  return Array.from(mascotAudioPositions.values());
}

/**
 * Unregister a mascot's audio
 */
export function unregisterMascotAudio(mascotId: string): boolean {
  return mascotAudioPositions.delete(mascotId);
}

// ============================================================================
// Exports
// ============================================================================

export {
  type SpatialAudioEngine,
  getSpatialAudioEngine,
};
