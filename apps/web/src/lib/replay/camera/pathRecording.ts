// @ts-nocheck
/**
 * Camera Path Recording System
 * Record, save, load, and interpolate smooth camera paths
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-C
 * Team: Replay 2.0 Core (TL-S2)
 */

import type { Position3D } from '../types';
import type { CameraState, EasingFunction } from './modes';
import { createLogger } from '@/utils/logger';

const logger = createLogger('CameraPathRecording');

// ============================================================================
// Path Types
// ============================================================================

export interface PathKeyframe {
  /** Unique identifier */
  id: string;
  /** Timestamp in the path sequence (ms from start) */
  time: number;
  /** Camera state at this keyframe */
  state: CameraState;
  /** Easing to next keyframe */
  easing: EasingFunction;
  /** Hold duration at this keyframe (ms) */
  holdDuration: number;
  /** Metadata for this keyframe */
  metadata?: Record<string, unknown>;
}

export interface CameraPath {
  /** Unique identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** Total duration (ms) */
  duration: number;
  /** Keyframe sequence */
  keyframes: PathKeyframe[];
  /** Whether path should loop */
  loop: boolean;
  /** Creation timestamp */
  createdAt: number;
  /** Last modified timestamp */
  modifiedAt: number;
  /** Associated map/level */
  mapName?: string;
  /** Tags for categorization */
  tags: string[];
}

export interface PathRecordingSession {
  /** Session identifier */
  id: string;
  /** Recording start time */
  startTime: number;
  /** Recorded samples (higher frequency than keyframes) */
  samples: PathSample[];
  /** Whether currently recording */
  isRecording: boolean;
  /** Sample interval (ms) */
  sampleInterval: number;
}

export interface PathSample {
  /** Timestamp in recording (ms) */
  time: number;
  /** Camera state */
  state: CameraState;
}

export interface PathPlaybackState {
  /** Current path being played */
  currentPath: CameraPath | null;
  /** Current time in path (ms) */
  currentTime: number;
  /** Whether path is playing */
  isPlaying: boolean;
  /** Playback speed multiplier */
  speed: number;
  /** Current interpolated state */
  currentState: CameraState | null;
}

export interface PathOptimizationOptions {
  /** Maximum error tolerance for simplification */
  errorTolerance: number;
  /** Minimum time between keyframes (ms) */
  minKeyframeInterval: number;
  /** Maximum time between keyframes (ms) */
  maxKeyframeInterval: number;
  /** Whether to smooth rotation */
  smoothRotation: boolean;
  /** Whether to auto-detect hold points */
  autoHoldDetection: boolean;
}

export const DEFAULT_OPTIMIZATION_OPTIONS: PathOptimizationOptions = {
  errorTolerance: 5,
  minKeyframeInterval: 100,
  maxKeyframeInterval: 5000,
  smoothRotation: true,
  autoHoldDetection: true,
};

// ============================================================================
// Path Recorder
// ============================================================================

export class PathRecorder {
  private session: PathRecordingSession | null = null;
  private onSampleRecorded?: (sample: PathSample) => void;

  /**
   * Start a new recording session
   */
  startRecording(sampleInterval: number = 50): PathRecordingSession {
    this.session = {
      id: `rec-${Date.now()}`,
      startTime: performance.now(),
      samples: [],
      isRecording: true,
      sampleInterval,
    };
    return this.session;
  }

  /**
   * Record a sample (call this each frame while recording)
   */
  recordSample(state: CameraState): void {
    if (!this.session || !this.session.isRecording) return;

    const now = performance.now();
    const elapsed = now - this.session.startTime;

    // Check if enough time has passed since last sample
    const lastSample = this.session.samples[this.session.samples.length - 1];
    if (lastSample && elapsed - lastSample.time < this.session.sampleInterval) {
      return;
    }

    const sample: PathSample = {
      time: elapsed,
      state: { ...state },
    };

    this.session.samples.push(sample);
    this.onSampleRecorded?.(sample);
  }

  /**
   * Stop recording and return the session
   */
  stopRecording(): PathRecordingSession | null {
    if (!this.session) return null;

    this.session.isRecording = false;
    return this.session;
  }

  /**
   * Check if currently recording
   */
  isRecording(): boolean {
    return this.session?.isRecording ?? false;
  }

  /**
   * Get current recording duration
   */
  getCurrentDuration(): number {
    if (!this.session) return 0;
    return performance.now() - this.session.startTime;
  }

  /**
   * Get recorded sample count
   */
  getSampleCount(): number {
    return this.session?.samples.length ?? 0;
  }

  /**
   * Discard current recording
   */
  discard(): void {
    this.session = null;
  }

  /**
   * Set callback for sample recording
   */
  onSample(callback: (sample: PathSample) => void): void {
    this.onSampleRecorded = callback;
  }
}

// ============================================================================
// Path Builder
// ============================================================================

export class PathBuilder {
  private keyframes: PathKeyframe[] = [];
  private pathId: string;
  private pathName: string;

  constructor(name: string = 'Untitled Path') {
    this.pathId = `path-${Date.now()}`;
    this.pathName = name;
  }

  /**
   * Add a keyframe
   */
  addKeyframe(
    time: number,
    state: CameraState,
    easing: EasingFunction = 'easeInOut',
    holdDuration: number = 0,
    metadata?: Record<string, unknown>
  ): PathBuilder {
    const keyframe: PathKeyframe = {
      id: `kf-${this.keyframes.length}`,
      time,
      state: { ...state },
      easing,
      holdDuration,
      metadata,
    };

    this.keyframes.push(keyframe);
    this.keyframes.sort((a, b) => a.time - b.time);

    return this;
  }

  /**
   * Remove a keyframe
   */
  removeKeyframe(id: string): PathBuilder {
    this.keyframes = this.keyframes.filter(kf => kf.id !== id);
    return this;
  }

  /**
   * Update a keyframe
   */
  updateKeyframe(id: string, updates: Partial<Omit<PathKeyframe, 'id'>>): PathBuilder {
    const index = this.keyframes.findIndex(kf => kf.id === id);
    if (index >= 0) {
      this.keyframes[index] = { ...this.keyframes[index], ...updates };
    }
    return this;
  }

  /**
   * Build the final path
   */
  build(loop: boolean = false, mapName?: string, tags: string[] = []): CameraPath {
    const duration = this.keyframes.length > 0
      ? Math.max(...this.keyframes.map(kf => kf.time + kf.holdDuration))
      : 0;

    return {
      id: this.pathId,
      name: this.pathName,
      duration,
      keyframes: [...this.keyframes],
      loop,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      mapName,
      tags,
    };
  }

  /**
   * Build path from recording session
   */
  static fromRecording(
    session: PathRecordingSession,
    options: Partial<PathOptimizationOptions> = {}
  ): CameraPath {
    const opts = { ...DEFAULT_OPTIMIZATION_OPTIONS, ...options };
    
    // Convert samples to keyframes using simplification
    const keyframes = simplifyPath(session.samples, opts);

    const duration = session.samples.length > 0
      ? session.samples[session.samples.length - 1].time
      : 0;

    return {
      id: `path-${session.id}`,
      name: `Recording ${new Date().toLocaleString()}`,
      duration,
      keyframes,
      loop: false,
      createdAt: Date.now(),
      modifiedAt: Date.now(),
      tags: ['recorded'],
    };
  }

  /**
   * Create a preset path (common cinematic shots)
   */
  static createPreset(presetType: 'intro' | 'outro' | 'dramatic' | 'overview', mapCenter?: Position3D): CameraPath {
    const center = mapCenter ?? { x: 0, y: 0, z: 0 };
    const builder = new PathBuilder(`${presetType} preset`);

    switch (presetType) {
      case 'intro':
        // Sweeping overview that zooms in
        builder
          .addKeyframe(0, {
            position: { x: center.x, y: center.y + 500, z: center.z + 800 },
            rotation: { x: -0.6, y: 0, z: 0 },
            fov: 90,
            up: { x: 0, y: 1, z: 0 },
          }, 'easeIn')
          .addKeyframe(3000, {
            position: { x: center.x, y: center.y + 200, z: center.z + 400 },
            rotation: { x: -0.4, y: 0.5, z: 0 },
            fov: 75,
            up: { x: 0, y: 1, z: 0 },
          }, 'easeOut');
        break;

      case 'outro':
        // Pull back and rotate
        builder
          .addKeyframe(0, {
            position: { x: center.x, y: center.y + 200, z: center.z + 300 },
            rotation: { x: -0.4, y: 0, z: 0 },
            fov: 75,
            up: { x: 0, y: 1, z: 0 },
          }, 'linear')
          .addKeyframe(2000, {
            position: { x: center.x, y: center.y + 400, z: center.z + 500 },
            rotation: { x: -0.6, y: 2, z: 0 },
            fov: 90,
            up: { x: 0, y: 1, z: 0 },
          }, 'easeOut');
        break;

      case 'dramatic':
        // Low angle push in
        builder
          .addKeyframe(0, {
            position: { x: center.x - 200, y: center.y + 50, z: center.z - 200 },
            rotation: { x: -0.1, y: 0.8, z: 0 },
            fov: 60,
            up: { x: 0, y: 1, z: 0 },
          }, 'easeInOut')
          .addKeyframe(2500, {
            position: { x: center.x - 100, y: center.y + 30, z: center.z - 100 },
            rotation: { x: -0.15, y: 0.9, z: 0 },
            fov: 55,
            up: { x: 0, y: 1, z: 0 },
          }, 'spring', 500);
        break;

      case 'overview':
        // Slow rotating bird's eye
        builder
          .addKeyframe(0, {
            position: { x: center.x, y: center.y + 600, z: center.z },
            rotation: { x: -Math.PI / 2, y: 0, z: 0 },
            fov: 80,
            up: { x: 0, y: 0, z: -1 },
          }, 'linear')
          .addKeyframe(10000, {
            position: { x: center.x, y: center.y + 600, z: center.z },
            rotation: { x: -Math.PI / 2, y: Math.PI * 2, z: 0 },
            fov: 80,
            up: { x: 0, y: 0, z: -1 },
          }, 'linear');
        break;
    }

    return builder.build(presetType === 'overview');
  }

  /**
   * Get current keyframe count
   */
  getKeyframeCount(): number {
    return this.keyframes.length;
  }

  /**
   * Clear all keyframes
   */
  clear(): PathBuilder {
    this.keyframes = [];
    return this;
  }
}

// ============================================================================
// Path Player
// ============================================================================

export class PathPlayer {
  private state: PathPlaybackState = {
    currentPath: null,
    currentTime: 0,
    isPlaying: false,
    speed: 1,
    currentState: null,
  };

  private onStateChange?: (state: CameraState) => void;
  private onComplete?: () => void;

  /**
   * Load a path for playback
   */
  loadPath(path: CameraPath): void {
    this.state = {
      currentPath: path,
      currentTime: 0,
      isPlaying: false,
      speed: 1,
      currentState: path.keyframes.length > 0 ? path.keyframes[0].state : null,
    };
  }

  /**
   * Start playback
   */
  play(): void {
    if (!this.state.currentPath) return;
    this.state.isPlaying = true;
  }

  /**
   * Pause playback
   */
  pause(): void {
    this.state.isPlaying = false;
  }

  /**
   * Stop playback and reset to start
   */
  stop(): void {
    this.state.isPlaying = false;
    this.state.currentTime = 0;
    if (this.state.currentPath && this.state.currentPath.keyframes.length > 0) {
      this.state.currentState = this.state.currentPath.keyframes[0].state;
    }
  }

  /**
   * Seek to a specific time
   */
  seek(time: number): void {
    if (!this.state.currentPath) return;
    
    this.state.currentTime = clamp(time, 0, this.state.currentPath.duration);
    this.updateCurrentState();
  }

  /**
   * Set playback speed
   */
  setSpeed(speed: number): void {
    this.state.speed = Math.max(0.1, Math.min(5, speed));
  }

  /**
   * Update playback for current frame
   */
  update(deltaTime: number): CameraState | null {
    if (!this.state.isPlaying || !this.state.currentPath) {
      return this.state.currentState;
    }

    // Advance time
    this.state.currentTime += deltaTime * 1000 * this.state.speed;

    // Check for completion
    if (this.state.currentTime >= this.state.currentPath.duration) {
      if (this.state.currentPath.loop) {
        this.state.currentTime = this.state.currentTime % this.state.currentPath.duration;
      } else {
        this.state.currentTime = this.state.currentPath.duration;
        this.state.isPlaying = false;
        this.onComplete?.();
      }
    }

    // Update state
    this.updateCurrentState();

    return this.state.currentState;
  }

  /**
   * Get current playback state
   */
  getState(): PathPlaybackState {
    return { ...this.state };
  }

  /**
   * Check if path is playing
   */
  isPlaying(): boolean {
    return this.state.isPlaying;
  }

  /**
   * Get progress percentage (0-1)
   */
  getProgress(): number {
    if (!this.state.currentPath || this.state.currentPath.duration === 0) return 0;
    return this.state.currentTime / this.state.currentPath.duration;
  }

  /**
   * Set callbacks
   */
  setCallbacks(callbacks: {
    onStateChange?: (state: CameraState) => void;
    onComplete?: () => void;
  }): void {
    this.onStateChange = callbacks.onStateChange;
    this.onComplete = callbacks.onComplete;
  }

  private updateCurrentState(): void {
    if (!this.state.currentPath) return;

    const newState = interpolatePathState(
      this.state.currentPath,
      this.state.currentTime
    );

    this.state.currentState = newState;
    this.onStateChange?.(newState);
  }
}

// ============================================================================
// Path Storage
// ============================================================================

const STORAGE_KEY = 'replay_camera_paths';

export class PathStorage {
  /**
   * Save a path to local storage
   */
  static savePath(path: CameraPath): void {
    const paths = this.loadAllPaths();
    const existingIndex = paths.findIndex(p => p.id === path.id);
    
    if (existingIndex >= 0) {
      paths[existingIndex] = { ...path, modifiedAt: Date.now() };
    } else {
      paths.push(path);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(paths));
    } catch (e) {
      logger.error('Failed to save camera path', { error: e instanceof Error ? e.message : String(e) });
    }
  }

  /**
   * Load a specific path
   */
  static loadPath(id: string): CameraPath | null {
    const paths = this.loadAllPaths();
    return paths.find(p => p.id === id) || null;
  }

  /**
   * Load all saved paths
   */
  static loadAllPaths(): CameraPath[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      logger.error('Failed to load camera paths', { error: e instanceof Error ? e.message : String(e) });
      return [];
    }
  }

  /**
   * Delete a path
   */
  static deletePath(id: string): boolean {
    const paths = this.loadAllPaths();
    const filtered = paths.filter(p => p.id !== id);
    
    if (filtered.length === paths.length) return false;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return true;
    } catch (e) {
      logger.error('Failed to delete camera path', { error: e instanceof Error ? e.message : String(e) });
      return false;
    }
  }

  /**
   * Export path as JSON
   */
  static exportPath(path: CameraPath): string {
    return JSON.stringify(path, null, 2);
  }

  /**
   * Import path from JSON
   */
  static importPath(json: string): CameraPath | null {
    try {
      const path = JSON.parse(json) as CameraPath;
      // Validate
      if (path.id && path.keyframes && Array.isArray(path.keyframes)) {
        return path;
      }
    } catch (e) {
      logger.error('Failed to import camera path', { error: e instanceof Error ? e.message : String(e) });
    }
    return null;
  }

  /**
   * Clear all saved paths
   */
  static clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      logger.error('Failed to clear camera paths', { error: e instanceof Error ? e.message : String(e) });
    }
  }
}

// ============================================================================
// Interpolation Functions
// ============================================================================

export function interpolatePathState(path: CameraPath, time: number): CameraState {
  const keyframes = path.keyframes;
  if (keyframes.length === 0) {
    throw new Error('Cannot interpolate empty path');
  }

  // Handle before first keyframe
  if (time <= keyframes[0].time) {
    return { ...keyframes[0].state };
  }

  // Handle after last keyframe
  const lastKf = keyframes[keyframes.length - 1];
  if (time >= lastKf.time + lastKf.holdDuration) {
    return { ...lastKf.state };
  }

  // Find surrounding keyframes
  let currentIndex = 0;
  for (let i = 0; i < keyframes.length - 1; i++) {
    if (time >= keyframes[i].time && time < keyframes[i + 1].time) {
      currentIndex = i;
      break;
    }
  }

  const current = keyframes[currentIndex];
  const next = keyframes[currentIndex + 1];

  // Check if in hold period
  const currentEndTime = current.time + current.holdDuration;
  if (time < currentEndTime) {
    return { ...current.state };
  }

  // Interpolate between keyframes
  const segmentStart = currentEndTime;
  const segmentEnd = next.time;
  const segmentDuration = segmentEnd - segmentStart;
  const segmentTime = time - segmentStart;
  const t = segmentDuration > 0 ? segmentTime / segmentDuration : 0;

  // Apply easing
  const easedT = applyEasing(t, current.easing);

  return {
    position: lerpVector(current.state.position, next.state.position, easedT),
    rotation: lerpRotation(current.state.rotation, next.state.rotation, easedT),
    fov: lerp(current.state.fov, next.state.fov, easedT),
    up: normalizeVector(lerpVector(current.state.up, next.state.up, easedT)),
    target: next.state.target,
  };
}

// ============================================================================
// Path Optimization (Douglas-Peucker Simplification)
// ============================================================================

function simplifyPath(
  samples: PathSample[],
  options: PathOptimizationOptions
): PathKeyframe[] {
  if (samples.length < 2) {
    return samples.map((s, i) => ({
      id: `kf-${i}`,
      time: s.time,
      state: s.state,
      easing: 'easeInOut' as EasingFunction,
      holdDuration: 0,
    }));
  }

  // Apply Douglas-Peucker simplification
  const pointDistances = samples.map(s => ({
    time: s.time,
    distance: vectorLength(s.state.position),
  }));

  const simplifiedIndices = douglasPeucker(
    pointDistances,
    0,
    samples.length - 1,
    options.errorTolerance
  );

  // Add endpoints if not included
  if (!simplifiedIndices.includes(0)) simplifiedIndices.unshift(0);
  if (!simplifiedIndices.includes(samples.length - 1)) {
    simplifiedIndices.push(samples.length - 1);
  }

  // Detect hold points
  const holdPoints = options.autoHoldDetection
    ? detectHoldPoints(samples, simplifiedIndices)
    : new Set<number>();

  // Build keyframes
  const keyframes: PathKeyframe[] = [];
  for (let i = 0; i < simplifiedIndices.length; i++) {
    const sampleIndex = simplifiedIndices[i];
    const sample = samples[sampleIndex];
    const nextSample = samples[simplifiedIndices[i + 1]];

    // Calculate hold duration
    let holdDuration = 0;
    if (holdPoints.has(sampleIndex) && nextSample) {
      const holdEnd = detectHoldEnd(samples, sampleIndex);
      holdDuration = samples[holdEnd].time - sample.time;
    }

    // Determine easing based on movement
    let easing: EasingFunction = 'easeInOut';
    if (i === 0) easing = 'easeOut';
    else if (i === simplifiedIndices.length - 1) easing = 'easeIn';

    keyframes.push({
      id: `kf-${i}`,
      time: sample.time,
      state: sample.state,
      easing,
      holdDuration: Math.min(holdDuration, options.maxKeyframeInterval),
      metadata: { sourceSample: sampleIndex },
    });
  }

  return keyframes;
}

function douglasPeucker(
  points: { time: number; distance: number }[],
  start: number,
  end: number,
  epsilon: number
): number[] {
  if (end <= start + 1) {
    return [start, end];
  }

  // Find point with maximum distance from line
  let maxDist = 0;
  let maxIndex = start;

  const startPoint = points[start];
  const endPoint = points[end];

  for (let i = start + 1; i < end; i++) {
    const dist = perpendicularDistance(points[i], startPoint, endPoint);
    if (dist > maxDist) {
      maxDist = dist;
      maxIndex = i;
    }
  }

  if (maxDist > epsilon) {
    // Recursively simplify
    const left = douglasPeucker(points, start, maxIndex, epsilon);
    const right = douglasPeucker(points, maxIndex, end, epsilon);
    return [...left.slice(0, -1), ...right];
  } else {
    return [start, end];
  }
}

function perpendicularDistance(
  point: { time: number; distance: number },
  lineStart: { time: number; distance: number },
  lineEnd: { time: number; distance: number }
): number {
  const dx = lineEnd.time - lineStart.time;
  const dy = lineEnd.distance - lineStart.distance;
  const mag = Math.sqrt(dx * dx + dy * dy);

  if (mag === 0) return 0;

  return Math.abs(dy * point.time - dx * point.distance + lineEnd.time * lineStart.distance - lineEnd.distance * lineStart.time) / mag;
}

function detectHoldPoints(samples: PathSample[], indices: number[]): Set<number> {
  const holds = new Set<number>();

  for (let i = 1; i < indices.length - 1; i++) {
    const prev = samples[indices[i - 1]];
    const curr = samples[indices[i]];
    const next = samples[indices[i + 1]];

    const prevDist = vectorDistance(prev.state.position, curr.state.position);
    const nextDist = vectorDistance(curr.state.position, next.state.position);

    // If surrounded by movement but not moving much ourselves, it's a hold
    if (prevDist > 10 && nextDist > 10 && prevDist + nextDist > 50) {
      holds.add(indices[i]);
    }
  }

  return holds;
}

function detectHoldEnd(samples: PathSample[], startIndex: number): number {
  const threshold = 5; // Movement threshold
  const startPos = samples[startIndex].state.position;

  for (let i = startIndex + 1; i < samples.length; i++) {
    const dist = vectorDistance(startPos, samples[i].state.position);
    if (dist > threshold) {
      return i;
    }
  }

  return samples.length - 1;
}

// ============================================================================
// Math Utilities
// ============================================================================

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpVector(a: Position3D, b: Position3D, t: number): Position3D {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

function lerpRotation(a: Position3D, b: Position3D, t: number): Position3D {
  return {
    x: lerpAngle(a.x, b.x, t),
    y: lerpAngle(a.y, b.y, t),
    z: lerpAngle(a.z, b.z, t),
  };
}

function lerpAngle(a: number, b: number, t: number): number {
  const diff = b - a;
  const wrapped = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
  return a + wrapped * t;
}

function vectorLength(v: Position3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vectorDistance(a: Position3D, b: Position3D): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const dz = b.z - a.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function normalizeVector(v: Position3D): Position3D {
  const len = vectorLength(v);
  if (len === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / len, y: v.y / len, z: v.z / len };
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function applyEasing(t: number, easing: EasingFunction): number {
  switch (easing) {
    case 'linear':
      return t;
    case 'easeIn':
      return t * t;
    case 'easeOut':
      return 1 - (1 - t) * (1 - t);
    case 'easeInOut':
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    case 'spring':
      return 1 - Math.exp(-8 * t) * Math.cos(10 * t);
    case 'bounce':
      if (t < 1 / 2.75) {
        return 7.5625 * t * t;
      } else if (t < 2 / 2.75) {
        return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75;
      } else if (t < 2.5 / 2.75) {
        return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375;
      } else {
        return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
      }
    default:
      return t;
  }
}

// ============================================================================
// Default Export
// ============================================================================

export default {
  PathRecorder,
  PathBuilder,
  PathPlayer,
  PathStorage,
  interpolatePathState,
  DEFAULT_OPTIMIZATION_OPTIONS,
};
