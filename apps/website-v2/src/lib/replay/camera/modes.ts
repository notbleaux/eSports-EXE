/**
 * Camera Modes for Replay System
 * Free, Follow, Orbit, and Cinematic camera implementations
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-C
 * Team: Replay 2.0 Core (TL-S2)
 */

import type { Position3D, Player, GameEvent } from '../types';

// ============================================================================
// Camera Types
// ============================================================================

export type CameraMode = 'free' | 'follow' | 'orbit' | 'cinematic';

export interface CameraState {
  position: Position3D;
  rotation: Position3D; // pitch, yaw, roll in radians
  fov: number;
  target?: Position3D;
  up: Position3D;
}

export interface CameraBounds {
  min: Position3D;
  max: Position3D;
}

export interface CameraTransition {
  from: CameraState;
  to: CameraState;
  duration: number;
  easing: EasingFunction;
  progress: number; // 0-1
}

export type EasingFunction = 
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'spring'
  | 'bounce';

export interface CameraConfig {
  mode: CameraMode;
  state: CameraState;
  bounds?: CameraBounds;
  transition?: CameraTransition;
  targetPlayerId?: string;
  targetActionId?: string;
}

// ============================================================================
// Camera Settings
// ============================================================================

export const CAMERA_SETTINGS = {
  /** Default field of view */
  DEFAULT_FOV: 75,
  /** Minimum FOV */
  MIN_FOV: 20,
  /** Maximum FOV */
  MAX_FOV: 120,
  /** Default camera distance for orbit mode */
  DEFAULT_ORBIT_DISTANCE: 300,
  /** Minimum orbit distance */
  MIN_ORBIT_DISTANCE: 100,
  /** Maximum orbit distance */
  MAX_ORBIT_DISTANCE: 800,
  /** Height offset for follow camera */
  FOLLOW_HEIGHT_OFFSET: 50,
  /** Distance behind player for follow camera */
  FOLLOW_DISTANCE: 150,
  /** Smoothing factor for camera movement (0-1) */
  SMOOTHING: 0.15,
  /** Maximum camera speed units/sec */
  MAX_SPEED: 1000,
  /** Transition default duration (ms) */
  DEFAULT_TRANSITION_MS: 500,
  /** Cinematic shake intensity */
  SHAKE_INTENSITY: 0.5,
} as const;

// ============================================================================
// Base Camera Class
// ============================================================================

export abstract class BaseCamera {
  protected state: CameraState;
  protected bounds?: CameraBounds;
  protected targetPosition: Position3D = { x: 0, y: 0, z: 0 };
  protected currentTransition: CameraTransition | null = null;

  constructor(initialState?: Partial<CameraState>, bounds?: CameraBounds) {
    this.state = {
      position: initialState?.position ?? { x: 0, y: 200, z: 300 },
      rotation: initialState?.rotation ?? { x: -0.3, y: 0, z: 0 },
      fov: initialState?.fov ?? CAMERA_SETTINGS.DEFAULT_FOV,
      target: initialState?.target,
      up: initialState?.up ?? { x: 0, y: 1, z: 0 },
    };
    this.bounds = bounds;
  }

  /**
   * Get current camera state
   */
  getState(): CameraState {
    return { ...this.state };
  }

  /**
   * Set camera state directly
   */
  setState(state: Partial<CameraState>): void {
    this.state = {
      ...this.state,
      ...state,
      position: state.position ?? this.state.position,
      rotation: state.rotation ?? this.state.rotation,
      up: state.up ?? this.state.up,
    };
    this.clampToBounds();
  }

  /**
   * Update camera for current frame
   */
  abstract update(deltaTime: number, timestamp: number): void;

  /**
   * Start a transition to a new state
   */
  transitionTo(
    targetState: Partial<CameraState>,
    duration: number = CAMERA_SETTINGS.DEFAULT_TRANSITION_MS,
    easing: EasingFunction = 'easeInOut'
  ): void {
    this.currentTransition = {
      from: { ...this.state },
      to: {
        ...this.state,
        ...targetState,
        position: targetState.position ?? this.state.position,
        rotation: targetState.rotation ?? this.state.rotation,
        fov: targetState.fov ?? this.state.fov,
        up: targetState.up ?? this.state.up,
      },
      duration,
      easing,
      progress: 0,
    };
  }

  /**
   * Check if camera is currently transitioning
   */
  isTransitioning(): boolean {
    return this.currentTransition !== null && this.currentTransition.progress < 1;
  }

  /**
   * Get forward direction vector
   */
  getForwardVector(): Position3D {
    const { x: pitch, y: yaw } = this.state.rotation;
    return {
      x: Math.sin(yaw) * Math.cos(pitch),
      y: Math.sin(pitch),
      z: Math.cos(yaw) * Math.cos(pitch),
    };
  }

  /**
   * Get right direction vector
   */
  getRightVector(): Position3D {
    const forward = this.getForwardVector();
    const up = this.state.up;
    return normalizeVector(crossProduct(forward, up));
  }

  /**
   * Project a point to screen coordinates
   */
  projectToScreen(point: Position3D, screenWidth: number, screenHeight: number): { x: number; y: number; visible: boolean } {
    // Transform point to camera space
    const toPoint = subtractVectors(point, this.state.position);
    const forward = this.getForwardVector();
    const right = this.getRightVector();
    const up = this.state.up;

    const z = dotProduct(toPoint, forward);
    if (z <= 0) return { x: 0, y: 0, visible: false };

    const x = dotProduct(toPoint, right);
    const y = dotProduct(toPoint, up);

    // Project
    const fovRad = (this.state.fov * Math.PI) / 180;
    const aspect = screenWidth / screenHeight;
    const scale = (1 / Math.tan(fovRad / 2)) / z;

    const screenX = (x * scale / aspect + 1) * screenWidth / 2;
    const screenY = (1 - y * scale) * screenHeight / 2;

    return {
      x: screenX,
      y: screenY,
      visible: screenX >= 0 && screenX <= screenWidth && screenY >= 0 && screenY <= screenHeight,
    };
  }

  // --------------------------------------------------------------------------
  // Protected Methods
  // --------------------------------------------------------------------------

  protected updateTransition(deltaTime: number): void {
    if (!this.currentTransition) return;

    const { from, to, duration, easing, progress } = this.currentTransition;
    const newProgress = Math.min(1, progress + deltaTime / duration);

    const easedProgress = applyEasing(newProgress, easing);

    this.state = {
      position: lerpVector(from.position, to.position, easedProgress),
      rotation: lerpRotation(from.rotation, to.rotation, easedProgress),
      fov: lerp(from.fov, to.fov, easedProgress),
      target: to.target,
      up: normalizeVector(lerpVector(from.up, to.up, easedProgress)),
    };

    this.currentTransition.progress = newProgress;

    if (newProgress >= 1) {
      this.currentTransition = null;
    }
  }

  protected clampToBounds(): void {
    if (!this.bounds) return;

    this.state.position = {
      x: clamp(this.state.position.x, this.bounds.min.x, this.bounds.max.x),
      y: clamp(this.state.position.y, this.bounds.min.y, this.bounds.max.y),
      z: clamp(this.state.position.z, this.bounds.min.z, this.bounds.max.z),
    };
  }

  protected lookAt(target: Position3D): void {
    const direction = normalizeVector(subtractVectors(target, this.state.position));
    
    // Calculate pitch and yaw from direction
    const pitch = Math.asin(direction.y);
    const yaw = Math.atan2(direction.x, direction.z);

    this.state.rotation = { x: pitch, y: yaw, z: 0 };
    this.state.target = target;
  }

  protected smoothDamp(
    current: Position3D,
    target: Position3D,
    deltaTime: number,
    smoothing: number = CAMERA_SETTINGS.SMOOTHING
  ): Position3D {
    const t = 1 - Math.exp(-smoothing * deltaTime * 60);
    return lerpVector(current, target, t);
  }
}

// ============================================================================
// Free Camera (User Controlled)
// ============================================================================

export interface FreeCameraInput {
  moveForward: number; // -1 to 1
  moveRight: number; // -1 to 1
  moveUp: number; // -1 to 1
  lookDeltaX: number; // Mouse delta
  lookDeltaY: number; // Mouse delta
  zoomDelta: number; // Scroll delta
  sprint: boolean;
}

export class FreeCamera extends BaseCamera {
  private input: FreeCameraInput = {
    moveForward: 0,
    moveRight: 0,
    moveUp: 0,
    lookDeltaX: 0,
    lookDeltaY: 0,
    zoomDelta: 0,
    sprint: false,
  };
  private moveSpeed: number = 200;
  private lookSensitivity: number = 0.002;

  setInput(input: Partial<FreeCameraInput>): void {
    this.input = { ...this.input, ...input };
  }

  update(deltaTime: number): void {
    if (this.isTransitioning()) {
      this.updateTransition(deltaTime);
      return;
    }

    // Handle look rotation
    this.state.rotation.y -= this.input.lookDeltaX * this.lookSensitivity;
    this.state.rotation.x -= this.input.lookDeltaY * this.lookSensitivity;
    this.state.rotation.x = clamp(this.state.rotation.x, -Math.PI / 2 + 0.1, Math.PI / 2 - 0.1);

    // Clear look deltas
    this.input.lookDeltaX = 0;
    this.input.lookDeltaY = 0;

    // Handle zoom
    this.state.fov = clamp(
      this.state.fov - this.input.zoomDelta * 2,
      CAMERA_SETTINGS.MIN_FOV,
      CAMERA_SETTINGS.MAX_FOV
    );
    this.input.zoomDelta = 0;

    // Handle movement
    const forward = this.getForwardVector();
    const right = this.getRightVector();
    const up = { x: 0, y: 1, z: 0 };

    const speed = this.input.sprint ? this.moveSpeed * 2 : this.moveSpeed;

    const movement = multiplyVector(
      addVectors(
        addVectors(
          multiplyVector(forward, this.input.moveForward),
          multiplyVector(right, this.input.moveRight)
        ),
        multiplyVector(up, this.input.moveUp)
      ),
      speed * deltaTime
    );

    this.state.position = addVectors(this.state.position, movement);
    this.clampToBounds();
  }

  setMoveSpeed(speed: number): void {
    this.moveSpeed = speed;
  }

  setLookSensitivity(sensitivity: number): void {
    this.lookSensitivity = sensitivity;
  }
}

// ============================================================================
// Follow Camera
// ============================================================================

export interface FollowCameraConfig {
  /** Distance behind target */
  distance: number;
  /** Height above target */
  height: number;
  /** Horizontal offset from target */
  offset: number;
  /** Smoothing factor (0-1, higher = tighter follow) */
  smoothing: number;
  /** Whether to predict target movement */
  predictMovement: boolean;
  /** Field of view */
  fov: number;
}

export const DEFAULT_FOLLOW_CONFIG: FollowCameraConfig = {
  distance: CAMERA_SETTINGS.FOLLOW_DISTANCE,
  height: CAMERA_SETTINGS.FOLLOW_HEIGHT_OFFSET,
  offset: 0,
  smoothing: 0.1,
  predictMovement: false,
  fov: CAMERA_SETTINGS.DEFAULT_FOV,
};

export class FollowCamera extends BaseCamera {
  private targetPlayerId: string | null = null;
  private getPlayerPosition: (playerId: string, timestamp: number) => Position3D | null;
  private getPlayerVelocity: (playerId: string, timestamp: number) => Position3D | null;
  private config: FollowCameraConfig;
  private lastTargetPosition: Position3D = { x: 0, y: 0, z: 0 };

  constructor(
    getPlayerPosition: (playerId: string, timestamp: number) => Position3D | null,
    getPlayerVelocity: (playerId: string, timestamp: number) => Position3D | null,
    config: Partial<FollowCameraConfig> = {},
    bounds?: CameraBounds
  ) {
    super(undefined, bounds);
    this.getPlayerPosition = getPlayerPosition;
    this.getPlayerVelocity = getPlayerVelocity;
    this.config = { ...DEFAULT_FOLLOW_CONFIG, ...config };
    this.state.fov = this.config.fov;
  }

  setTarget(playerId: string | null): void {
    if (this.targetPlayerId !== playerId && playerId !== null) {
      // Start transition when switching targets
      this.transitionTo({ fov: this.config.fov }, 300, 'easeOut');
    }
    this.targetPlayerId = playerId;
  }

  getTarget(): string | null {
    return this.targetPlayerId;
  }

  setConfig(config: Partial<FollowCameraConfig>): void {
    this.config = { ...this.config, ...config };
  }

  update(deltaTime: number, timestamp: number): void {
    if (this.isTransitioning()) {
      this.updateTransition(deltaTime);
    }

    if (!this.targetPlayerId) return;

    const targetPos = this.getPlayerPosition(this.targetPlayerId, timestamp);
    if (!targetPos) return;

    // Predict position if enabled
    let predictedPos = targetPos;
    if (this.config.predictMovement) {
      const velocity = this.getPlayerVelocity(this.targetPlayerId, timestamp);
      if (velocity) {
        predictedPos = addVectors(targetPos, multiplyVector(velocity, deltaTime * 0.1));
      }
    }

    // Calculate desired camera position (behind and above target)
    // Use target's velocity direction for offset if moving
    let offsetDirection = { x: 0, y: 0, z: -1 };
    const velocity = this.getPlayerVelocity(this.targetPlayerId, timestamp);
    if (velocity) {
      const speed = Math.sqrt(velocity.x ** 2 + velocity.z ** 2);
      if (speed > 1) {
        offsetDirection = normalizeVector({ x: -velocity.x, y: 0, z: -velocity.z });
      }
    }

    const desiredPosition = addVectors(
      predictedPos,
      addVectors(
        multiplyVector(offsetDirection, this.config.distance),
        { x: this.config.offset, y: this.config.height, z: 0 }
      )
    );

    // Smooth camera movement
    this.state.position = this.smoothDamp(
      this.state.position,
      desiredPosition,
      deltaTime,
      this.config.smoothing
    );

    // Look at target
    const lookTarget = addVectors(predictedPos, { x: 0, y: 30, z: 0 }); // Look slightly above player
    this.lookAt(lookTarget);

    this.lastTargetPosition = targetPos;
    this.clampToBounds();
  }

  getFramingScore(timestamp: number): number {
    if (!this.targetPlayerId) return 0;

    const targetPos = this.getPlayerPosition(this.targetPlayerId, timestamp);
    if (!targetPos) return 0;

    // Calculate how well framed the target is
    const toTarget = subtractVectors(targetPos, this.state.position);
    const distance = vectorLength(toTarget);
    const forward = this.getForwardVector();
    const alignment = dotProduct(normalizeVector(toTarget), forward);

    // Higher score when target is centered and at good distance
    let score = (alignment + 1) / 2; // 0-1 based on alignment
    score *= 1 - Math.abs(distance - this.config.distance) / this.config.distance;

    return Math.max(0, score);
  }
}

// ============================================================================
// Orbit Camera
// ============================================================================

export interface OrbitCameraConfig {
  /** Distance from target */
  distance: number;
  /** Height offset from target */
  height: number;
  /** Orbit speed in radians/sec */
  orbitSpeed: number;
  /** Current orbit angle */
  orbitAngle: number;
  /** Whether to auto-orbit */
  autoOrbit: boolean;
  /** Field of view */
  fov: number;
}

export const DEFAULT_ORBIT_CONFIG: OrbitCameraConfig = {
  distance: CAMERA_SETTINGS.DEFAULT_ORBIT_DISTANCE,
  height: 100,
  orbitSpeed: 0.5,
  orbitAngle: 0,
  autoOrbit: true,
  fov: CAMERA_SETTINGS.DEFAULT_FOV,
};

export class OrbitCamera extends BaseCamera {
  private centerPoint: Position3D = { x: 0, y: 0, z: 0 };
  private config: OrbitCameraConfig;
  private targetActionId: string | null = null;

  constructor(
    config: Partial<OrbitCameraConfig> = {},
    bounds?: CameraBounds
  ) {
    super(undefined, bounds);
    this.config = { ...DEFAULT_ORBIT_CONFIG, ...config };
    this.state.fov = this.config.fov;
    this.updatePositionFromOrbit();
  }

  setCenter(point: Position3D): void {
    this.centerPoint = point;
    this.updatePositionFromOrbit();
  }

  setTargetAction(actionId: string | null): void {
    this.targetActionId = actionId;
  }

  setConfig(config: Partial<OrbitCameraConfig>): void {
    this.config = { ...this.config, ...config };
  }

  update(deltaTime: number, _timestamp: number): void {
    if (this.isTransitioning()) {
      this.updateTransition(deltaTime);
    }

    // Auto-orbit
    if (this.config.autoOrbit) {
      this.config.orbitAngle += this.config.orbitSpeed * deltaTime;
    }

    this.updatePositionFromOrbit();
  }

  /** Manual orbit control */
  orbit(deltaAngle: number, deltaDistance: number = 0): void {
    this.config.orbitAngle += deltaAngle;
    this.config.distance = clamp(
      this.config.distance + deltaDistance,
      CAMERA_SETTINGS.MIN_ORBIT_DISTANCE,
      CAMERA_SETTINGS.MAX_ORBIT_DISTANCE
    );
    this.updatePositionFromOrbit();
  }

  private updatePositionFromOrbit(): void {
    const { distance, height, orbitAngle } = this.config;

    this.state.position = {
      x: this.centerPoint.x + Math.sin(orbitAngle) * distance,
      y: this.centerPoint.y + height,
      z: this.centerPoint.z + Math.cos(orbitAngle) * distance,
    };

    this.lookAt(this.centerPoint);
    this.clampToBounds();
  }

  getOrbitPosition(angle: number): Position3D {
    return {
      x: this.centerPoint.x + Math.sin(angle) * this.config.distance,
      y: this.centerPoint.y + this.config.height,
      z: this.centerPoint.z + Math.cos(angle) * this.config.distance,
    };
  }
}

// ============================================================================
// Cinematic Camera
// ============================================================================

export interface CinematicShot {
  id: string;
  name: string;
  startState: CameraState;
  endState: CameraState;
  duration: number;
  easing: EasingFunction;
  shakeIntensity: number;
  focusPoint?: Position3D;
}

export interface CinematicSequence {
  id: string;
  name: string;
  shots: CinematicShot[];
  loop: boolean;
}

export class CinematicCamera extends BaseCamera {
  private sequences: Map<string, CinematicSequence> = new Map();
  private currentSequence: CinematicSequence | null = null;
  private currentShotIndex: number = 0;
  private shotStartTime: number = 0;
  private isPlaying: boolean = false;
  private shakeOffset: Position3D = { x: 0, y: 0, z: 0 };

  addSequence(sequence: CinematicSequence): void {
    this.sequences.set(sequence.id, sequence);
  }

  removeSequence(sequenceId: string): void {
    this.sequences.delete(sequenceId);
  }

  playSequence(sequenceId: string, startTime: number): boolean {
    const sequence = this.sequences.get(sequenceId);
    if (!sequence || sequence.shots.length === 0) return false;

    this.currentSequence = sequence;
    this.currentShotIndex = 0;
    this.shotStartTime = startTime;
    this.isPlaying = true;

    // Set initial state
    const firstShot = sequence.shots[0];
    this.state = { ...firstShot.startState };

    return true;
  }

  stop(): void {
    this.isPlaying = false;
    this.currentSequence = null;
    this.currentShotIndex = 0;
  }

  pause(): void {
    this.isPlaying = false;
  }

  resume(): void {
    this.isPlaying = true;
  }

  isSequencePlaying(): boolean {
    return this.isPlaying;
  }

  getCurrentSequence(): CinematicSequence | null {
    return this.currentSequence;
  }

  update(deltaTime: number, timestamp: number): void {
    if (!this.isPlaying || !this.currentSequence) return;

    const currentShot = this.currentSequence.shots[this.currentShotIndex];
    if (!currentShot) {
      this.handleSequenceEnd();
      return;
    }

    const shotElapsed = timestamp - this.shotStartTime;
    const shotProgress = Math.min(1, shotElapsed / currentShot.duration);

    // Apply easing
    const easedProgress = applyEasing(shotProgress, currentShot.easing);

    // Interpolate camera state
    this.state = {
      position: lerpVector(currentShot.startState.position, currentShot.endState.position, easedProgress),
      rotation: lerpRotation(currentShot.startState.rotation, currentShot.endState.rotation, easedProgress),
      fov: lerp(currentShot.startState.fov, currentShot.endState.fov, easedProgress),
      target: currentShot.focusPoint,
      up: normalizeVector(lerpVector(currentShot.startState.up, currentShot.endState.up, easedProgress)),
    };

    // Apply camera shake
    if (currentShot.shakeIntensity > 0) {
      this.applyShake(currentShot.shakeIntensity, deltaTime);
    }

    // Check if shot is complete
    if (shotProgress >= 1) {
      this.advanceToNextShot(timestamp);
    }
  }

  private handleSequenceEnd(): void {
    if (this.currentSequence?.loop) {
      this.currentShotIndex = 0;
      this.shotStartTime = performance.now();
    } else {
      this.isPlaying = false;
    }
  }

  private advanceToNextShot(timestamp: number): void {
    if (!this.currentSequence) return;

    this.currentShotIndex++;
    this.shotStartTime = timestamp;

    if (this.currentShotIndex >= this.currentSequence.shots.length) {
      this.handleSequenceEnd();
    }
  }

  private applyShake(intensity: number, deltaTime: number): void {
    const shakeAmount = intensity * CAMERA_SETTINGS.SHAKE_INTENSITY;
    this.shakeOffset = {
      x: (Math.random() - 0.5) * shakeAmount,
      y: (Math.random() - 0.5) * shakeAmount,
      z: (Math.random() - 0.5) * shakeAmount,
    };

    this.state.position = addVectors(this.state.position, this.shakeOffset);
  }

  /**
   * Create a dramatic shot for an action
   */
  static createActionShot(
    actionPosition: Position3D,
    playerPosition: Position3D,
    duration: number = 3000,
    name: string = 'Action Shot'
  ): CinematicShot {
    // Calculate dramatic camera position (low angle, looking up at action)
    const direction = normalizeVector(subtractVectors(actionPosition, playerPosition));
    const cameraDistance = 200;
    const cameraHeight = 50;

    const startPosition: Position3D = {
      x: actionPosition.x - direction.x * cameraDistance,
      y: actionPosition.y + cameraHeight,
      z: actionPosition.z - direction.z * cameraDistance,
    };

    const endPosition: Position3D = {
      x: actionPosition.x - direction.x * cameraDistance * 0.5,
      y: actionPosition.y + cameraHeight * 1.5,
      z: actionPosition.z - direction.z * cameraDistance * 0.5,
    };

    return {
      id: `shot-${Date.now()}`,
      name,
      startState: {
        position: startPosition,
        rotation: { x: -0.2, y: 0, z: 0 },
        fov: 60,
        up: { x: 0, y: 1, z: 0 },
      },
      endState: {
        position: endPosition,
        rotation: { x: -0.3, y: 0, z: 0 },
        fov: 75,
        up: { x: 0, y: 1, z: 0 },
      },
      duration,
      easing: 'easeInOut',
      shakeIntensity: 0.3,
      focusPoint: actionPosition,
    };
  }
}

// ============================================================================
// Camera Mode Factory
// ============================================================================

export interface CameraModeFactory {
  createFreeCamera(initialState?: Partial<CameraState>, bounds?: CameraBounds): FreeCamera;
  createFollowCamera(
    getPlayerPosition: (playerId: string, timestamp: number) => Position3D | null,
    getPlayerVelocity: (playerId: string, timestamp: number) => Position3D | null,
    config?: Partial<FollowCameraConfig>,
    bounds?: CameraBounds
  ): FollowCamera;
  createOrbitCamera(config?: Partial<OrbitCameraConfig>, bounds?: CameraBounds): OrbitCamera;
  createCinematicCamera(): CinematicCamera;
}

export function createCameraFactory(): CameraModeFactory {
  return {
    createFreeCamera: (initialState, bounds) => new FreeCamera(initialState, bounds),
    createFollowCamera: (getPlayerPos, getPlayerVel, config, bounds) => 
      new FollowCamera(getPlayerPos, getPlayerVel, config, bounds),
    createOrbitCamera: (config, bounds) => new OrbitCamera(config, bounds),
    createCinematicCamera: () => new CinematicCamera(),
  };
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
  // Handle angle wrapping
  const wrapped = ((diff + Math.PI) % (2 * Math.PI)) - Math.PI;
  return a + wrapped * t;
}

function addVectors(a: Position3D, b: Position3D): Position3D {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function subtractVectors(a: Position3D, b: Position3D): Position3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function multiplyVector(v: Position3D, scalar: number): Position3D {
  return { x: v.x * scalar, y: v.y * scalar, z: v.z * scalar };
}

function dotProduct(a: Position3D, b: Position3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function crossProduct(a: Position3D, b: Position3D): Position3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}

function vectorLength(v: Position3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
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
  FreeCamera,
  FollowCamera,
  OrbitCamera,
  CinematicCamera,
  createCameraFactory,
  CAMERA_SETTINGS,
  DEFAULT_FOLLOW_CONFIG,
  DEFAULT_ORBIT_CONFIG,
};
