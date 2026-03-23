/** [Ver001.000]
 * Inverse Kinematics System
 * =========================
 * Basic IK solver for foot placement, look-at targeting, and two-bone IK.
 * Provides smooth weight blending and target interpolation.
 * 
 * Features:
 * - Foot IK for ground adaptation
 * - Look-at IK for head/eye tracking
 * - Simple two-bone IK solver
 * - IK weight blending for smooth enable/disable
 */

import * as THREE from 'three';
import { lerp } from '@/lib/three/animationBridge';

// ============================================================================
// Types
// ============================================================================

/** IK chain type */
export type IKChainType = 'foot' | 'lookAt' | 'twoBone';

/** IK target definition */
export interface IKTarget {
  /** Target position in world space */
  position: THREE.Vector3;
  /** Optional target rotation */
  rotation?: THREE.Quaternion;
  /** Target weight (0-1) */
  weight: number;
  /** Reach distance from joint */
  reach?: number;
}

/** IK chain configuration */
export interface IKChain {
  /** Chain identifier */
  id: string;
  /** Chain type */
  type: IKChainType;
  /** Root joint name */
  rootJoint: string;
  /** End effector joint name */
  endEffector: string;
  /** Middle joint (for two-bone IK) */
  midJoint?: string;
  /** Pole vector for elbow/knee direction */
  poleVector?: THREE.Vector3;
  /** Maximum reach distance */
  maxReach: number;
  /** Current IK weight */
  weight: number;
  /** Whether chain is enabled */
  enabled: boolean;
  /** Chain length segments */
  lengths?: number[];
}

/** IK solver result */
export interface IKResult {
  /** Chain ID */
  chainId: string;
  /** Joint rotations in local space */
  jointRotations: Map<string, THREE.Quaternion>;
  /** Whether solution was found */
  hasSolution: boolean;
  /** Distance error from target */
  error: number;
  /** Number of iterations used */
  iterations: number;
}

/** Foot IK configuration */
export interface FootIKConfig {
  /** Foot joint name */
  footJoint: string;
  /** Ankle joint name */
  ankleJoint: string;
  /** Knee joint name */
  kneeJoint: string;
  /** Foot offset from ground */
  footOffset: number;
  /** Maximum foot lift height */
  maxFootLift: number;
  /** Ground check distance */
  groundCheckDistance: number;
  /** Layer mask for ground detection */
  groundLayers: number;
}

/** Look-at IK configuration */
export interface LookAtIKConfig {
  /** Head/eye joint name */
  headJoint: string;
  /** Neck joint name */
  neckJoint?: string;
  /** Spine joint name */
  spineJoint?: string;
  /** Maximum horizontal angle */
  maxHorizontalAngle: number;
  /** Maximum vertical angle */
  maxVerticalAngle: number;
  /** Damping factor for smooth following */
  damping: number;
  /** Offset from joint to eyes */
  eyeOffset: THREE.Vector3;
}

/** Two-bone IK configuration */
export interface TwoBoneIKConfig {
  /** Root joint name (shoulder/hip) */
  rootJoint: string;
  /** Mid joint (elbow/knee) */
  midJoint: string;
  /** End joint (hand/foot) */
  endJoint: string;
  /** Bone lengths (if known) */
  boneLengths?: [number, number];
  /** Bend direction hint */
  bendDirection: THREE.Vector3;
}

/** IK system options */
export interface IKSystemOptions {
  /** Maximum iterations for solver */
  maxIterations?: number;
  /** Solution tolerance */
  tolerance?: number;
  /** Enable weight smoothing */
  smoothWeights?: boolean;
  /** Weight smoothing speed */
  weightSmoothSpeed?: number;
  /** Debug visualization */
  debug?: boolean;
}

/** IK chain state */
export interface IKChainState {
  /** Current weight */
  currentWeight: number;
  /** Target weight */
  targetWeight: number;
  /** Current target position */
  currentTarget: THREE.Vector3;
  /** Desired target position */
  desiredTarget: THREE.Vector3;
  /** Velocity for smoothing */
  targetVelocity: THREE.Vector3;
  /** Is actively solving */
  isActive: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<IKSystemOptions> = {
  maxIterations: 10,
  tolerance: 0.001,
  smoothWeights: true,
  weightSmoothSpeed: 5,
  debug: false,
};

// ============================================================================
// IK System Class
// ============================================================================

export class IKSystem {
  private chains: Map<string, IKChain>;
  private chainStates: Map<string, IKChainState>;
  private options: Required<IKSystemOptions>;
  private isDisposed: boolean;
  private animationFrameId: number | null;
  private tempVec3: THREE.Vector3;
  private tempQuat: THREE.Quaternion;

  constructor(options: IKSystemOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.chains = new Map();
    this.chainStates = new Map();
    this.isDisposed = false;
    this.animationFrameId = null;
    this.tempVec3 = new THREE.Vector3();
    this.tempQuat = new THREE.Quaternion();

    this.startUpdateLoop();
  }

  // ============================================================================
  // Chain Management
  // ============================================================================

  /**
   * Register a foot IK chain
   */
  registerFootIK(id: string, config: FootIKConfig): void {
    if (this.isDisposed) return;

    const chain: IKChain = {
      id,
      type: 'foot',
      rootJoint: config.kneeJoint,
      midJoint: config.ankleJoint,
      endEffector: config.footJoint,
      maxReach: config.maxFootLift * 2,
      weight: 0,
      enabled: true,
    };

    this.chains.set(id, chain);
    this.chainStates.set(id, this.createInitialState());
  }

  /**
   * Register a look-at IK chain
   */
  registerLookAtIK(id: string, config: LookAtIKConfig): void {
    if (this.isDisposed) return;

    const chain: IKChain = {
      id,
      type: 'lookAt',
      rootJoint: config.headJoint,
      midJoint: config.neckJoint,
      endEffector: config.headJoint,
      maxReach: 1,
      weight: 0,
      enabled: true,
    };

    this.chains.set(id, chain);
    this.chainStates.set(id, this.createInitialState());
  }

  /**
   * Register a two-bone IK chain
   */
  registerTwoBoneIK(id: string, config: TwoBoneIKConfig): void {
    if (this.isDisposed) return;

    const chain: IKChain = {
      id,
      type: 'twoBone',
      rootJoint: config.rootJoint,
      midJoint: config.midJoint,
      endEffector: config.endJoint,
      poleVector: config.bendDirection,
      maxReach: (config.boneLengths?.[0] ?? 1) + (config.boneLengths?.[1] ?? 1),
      weight: 0,
      enabled: true,
    };

    this.chains.set(id, chain);
    this.chainStates.set(id, this.createInitialState());
  }

  /**
   * Unregister an IK chain
   */
  unregisterChain(id: string): void {
    this.chains.delete(id);
    this.chainStates.delete(id);
  }

  /**
   * Get an IK chain
   */
  getChain(id: string): IKChain | undefined {
    return this.chains.get(id);
  }

  /**
   * Enable/disable an IK chain
   */
  setChainEnabled(id: string, enabled: boolean): boolean {
    const chain = this.chains.get(id);
    if (!chain) return false;

    chain.enabled = enabled;
    return true;
  }

  private createInitialState(): IKChainState {
    return {
      currentWeight: 0,
      targetWeight: 0,
      currentTarget: new THREE.Vector3(),
      desiredTarget: new THREE.Vector3(),
      targetVelocity: new THREE.Vector3(),
      isActive: false,
    };
  }

  // ============================================================================
  // Target Control
  // ============================================================================

  /**
   * Set target for an IK chain
   */
  setTarget(chainId: string, target: THREE.Vector3, weight: number = 1): boolean {
    const chain = this.chains.get(chainId);
    const state = this.chainStates.get(chainId);

    if (!chain || !state) {
      this.log('warn', 'Chain not found', { id: chainId });
      return false;
    }

    if (!chain.enabled) return false;

    state.desiredTarget.copy(target);
    state.targetWeight = Math.max(0, Math.min(1, weight));
    state.isActive = state.targetWeight > 0.001;

    return true;
  }

  /**
   * Set target weight for smooth blending
   */
  setWeight(chainId: string, weight: number): boolean {
    const chain = this.chains.get(chainId);
    const state = this.chainStates.get(chainId);

    if (!chain || !state) return false;

    state.targetWeight = Math.max(0, Math.min(1, weight));
    state.isActive = state.targetWeight > 0.001;

    return true;
  }

  /**
   * Get current chain weight
   */
  getWeight(chainId: string): number {
    return this.chainStates.get(chainId)?.currentWeight ?? 0;
  }

  // ============================================================================
  // IK Solvers
  // ============================================================================

  /**
   * Solve two-bone IK analytically
   */
  solveTwoBoneIK(
    rootPos: THREE.Vector3,
    midPos: THREE.Vector3,
    endPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    poleVector: THREE.Vector3,
    boneLengths?: [number, number]
  ): { rootRotation: THREE.Quaternion; midRotation: THREE.Quaternion } | null {
    // Calculate bone lengths if not provided
    const length1 = boneLengths?.[0] ?? rootPos.distanceTo(midPos);
    const length2 = boneLengths?.[1] ?? midPos.distanceTo(endPos);

    const totalLength = length1 + length2;
    const targetDistance = rootPos.distanceTo(targetPos);

    // Check if target is reachable
    if (targetDistance > totalLength * 0.999) {
      // Target is out of reach, fully extend
      const direction = this.tempVec3.subVectors(targetPos, rootPos).normalize();
      targetPos.copy(direction.multiplyScalar(totalLength * 0.999).add(rootPos));
    }

    // Calculate triangle sides
    const a = length2;
    const b = targetDistance;
    const c = length1;

    // Law of cosines to find angles
    const cosAngle = (c * c + b * b - a * a) / (2 * c * b);
    const angle = Math.acos(Math.max(-1, Math.min(1, cosAngle)));

    // Calculate bend angle at mid joint
    const cosBend = (c * c + a * a - b * b) / (2 * c * a);
    const bendAngle = Math.PI - Math.acos(Math.max(-1, Math.min(1, cosBend)));

    // Calculate direction to target
    const toTarget = this.tempVec3.subVectors(targetPos, rootPos).normalize();

    // Calculate rotation axis using pole vector
    const poleDir = poleVector.clone().normalize();
    const rotationAxis = new THREE.Vector3().crossVectors(toTarget, poleDir).normalize();

    // Create root rotation
    const rootRotation = new THREE.Quaternion();
    const baseRotation = new THREE.Quaternion().setFromUnitVectors(
      new THREE.Vector3(0, 0, 1),
      toTarget
    );
    const poleRotation = new THREE.Quaternion().setFromAxisAngle(rotationAxis, angle);
    rootRotation.multiplyQuaternions(baseRotation, poleRotation);

    // Create mid joint rotation (bend)
    const bendAxis = new THREE.Vector3(1, 0, 0); // Assuming X is bend axis
    const midRotation = new THREE.Quaternion().setFromAxisAngle(bendAxis, bendAngle);

    return { rootRotation, midRotation };
  }

  /**
   * Solve look-at IK
   */
  solveLookAt(
    headPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    upVector: THREE.Vector3,
    maxHorizontalAngle: number,
    maxVerticalAngle: number
  ): THREE.Quaternion {
    const toTarget = this.tempVec3.subVectors(targetPos, headPos).normalize();

    // Convert to local space and clamp angles
    const forward = new THREE.Vector3(0, 0, 1);
    const right = new THREE.Vector3(1, 0, 0);
    const up = new THREE.Vector3(0, 1, 0);

    // Calculate yaw (horizontal) and pitch (vertical)
    const horizontal = new THREE.Vector3(toTarget.x, 0, toTarget.z).normalize();
    const yaw = Math.atan2(horizontal.x, horizontal.z);
    const pitch = Math.asin(Math.max(-1, Math.min(1, toTarget.y)));

    // Clamp angles
    const clampedYaw = Math.max(-maxHorizontalAngle, Math.min(maxHorizontalAngle, yaw));
    const clampedPitch = Math.max(-maxVerticalAngle, Math.min(maxVerticalAngle, pitch));

    // Create rotation
    const yawQuat = new THREE.Quaternion().setFromAxisAngle(up, clampedYaw);
    const pitchQuat = new THREE.Quaternion().setFromAxisAngle(right, clampedPitch);

    return new THREE.Quaternion().multiplyQuaternions(yawQuat, pitchQuat);
  }

  /**
   * Solve foot IK
   */
  solveFootIK(
    hipPos: THREE.Vector3,
    kneePos: THREE.Vector3,
    anklePos: THREE.Vector3,
    footPos: THREE.Vector3,
    groundHeight: number,
    footOffset: number
  ): { kneeRotation: THREE.Quaternion; ankleRotation: THREE.Quaternion } | null {
    // Calculate target foot position
    const targetY = groundHeight + footOffset;
    const targetPos = footPos.clone();
    targetPos.y = Math.max(targetY, footPos.y);

    // Use two-bone IK to position leg
    const result = this.solveTwoBoneIK(
      hipPos,
      kneePos,
      anklePos,
      targetPos,
      new THREE.Vector3(0, 1, 0)
    );

    if (!result) return null;

    return {
      kneeRotation: result.rootRotation,
      ankleRotation: result.midRotation,
    };
  }

  // ============================================================================
  // Main Solver
  // ============================================================================

  /**
   * Solve IK for all chains
   */
  solve(jointPositions: Map<string, THREE.Vector3>): Map<string, IKResult> {
    const results = new Map<string, IKResult>();

    for (const [chainId, chain] of this.chains) {
      const state = this.chainStates.get(chainId);
      if (!state || !chain.enabled || state.currentWeight <= 0.001) continue;

      const result = this.solveChain(chain, state, jointPositions);
      results.set(chainId, result);
    }

    return results;
  }

  private solveChain(
    chain: IKChain,
    state: IKChainState,
    jointPositions: Map<string, THREE.Vector3>
  ): IKResult {
    const jointRotations = new Map<string, THREE.Quaternion>();
    let hasSolution = false;
    let error = 0;
    let iterations = 0;

    switch (chain.type) {
      case 'twoBone':
      case 'foot': {
        const rootPos = jointPositions.get(chain.rootJoint);
        const midPos = jointPositions.get(chain.midJoint!);
        const endPos = jointPositions.get(chain.endEffector);

        if (rootPos && midPos && endPos) {
          const solution = this.solveTwoBoneIK(
            rootPos,
            midPos,
            endPos,
            state.currentTarget,
            chain.poleVector ?? new THREE.Vector3(0, 1, 0)
          );

          if (solution) {
            jointRotations.set(chain.rootJoint, solution.rootRotation);
            jointRotations.set(chain.midJoint!, solution.midRotation);
            hasSolution = true;
            error = endPos.distanceTo(state.currentTarget);
          }
        }
        break;
      }

      case 'lookAt': {
        const headPos = jointPositions.get(chain.rootJoint);
        if (headPos) {
          const rotation = this.solveLookAt(
            headPos,
            state.currentTarget,
            new THREE.Vector3(0, 1, 0),
            Math.PI / 3, // 60 degrees
            Math.PI / 4  // 45 degrees
          );
          jointRotations.set(chain.rootJoint, rotation);
          hasSolution = true;
          error = 0;
        }
        break;
      }
    }

    return {
      chainId: chain.id,
      jointRotations,
      hasSolution,
      error,
      iterations,
    };
  }

  // ============================================================================
  // Update Loop
  // ============================================================================

  private startUpdateLoop(): void {
    let lastTime = performance.now();

    const update = (currentTime: number) => {
      if (this.isDisposed) return;

      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      this.update(deltaTime);
      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  private update(deltaTime: number): void {
    for (const [chainId, state] of this.chainStates) {
      // Smooth weight transitions
      if (this.options.smoothWeights) {
        const diff = state.targetWeight - state.currentWeight;
        if (Math.abs(diff) > 0.001) {
          const speed = this.options.weightSmoothSpeed * deltaTime;
          state.currentWeight = lerp(state.currentWeight, state.targetWeight, Math.min(speed, 1));
        } else {
          state.currentWeight = state.targetWeight;
        }
      } else {
        state.currentWeight = state.targetWeight;
      }

      // Smooth target position
      if (state.isActive) {
        state.currentTarget.lerp(state.desiredTarget, 0.5);
      }
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
    if (!this.options.debug && level === 'debug') return;

    const prefix = '[IKSystem]';
    const fullMessage = `${prefix} ${message}`;

    switch (level) {
      case 'debug':
        console.debug(fullMessage, data);
        break;
      case 'info':
        console.info(fullMessage, data);
        break;
      case 'warn':
        console.warn(fullMessage, data);
        break;
      case 'error':
        console.error(fullMessage, data);
        break;
    }
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Dispose of the IK system
   */
  dispose(): void {
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.chains.clear();
    this.chainStates.clear();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createIKSystem(options?: IKSystemOptions): IKSystem {
  return new IKSystem(options);
}

// ============================================================================
// Preset Configurations
// ============================================================================

/**
 * Create standard left foot IK configuration
 */
export function createLeftFootIKConfig(): FootIKConfig {
  return {
    footJoint: 'LeftFoot',
    ankleJoint: 'LeftAnkle',
    kneeJoint: 'LeftKnee',
    footOffset: 0.05,
    maxFootLift: 0.3,
    groundCheckDistance: 0.5,
    groundLayers: 1, // Default ground layer
  };
}

/**
 * Create standard right foot IK configuration
 */
export function createRightFootIKConfig(): FootIKConfig {
  return {
    footJoint: 'RightFoot',
    ankleJoint: 'RightAnkle',
    kneeJoint: 'RightKnee',
    footOffset: 0.05,
    maxFootLift: 0.3,
    groundCheckDistance: 0.5,
    groundLayers: 1,
  };
}

/**
 * Create standard head look-at configuration
 */
export function createHeadLookAtConfig(): LookAtIKConfig {
  return {
    headJoint: 'Head',
    neckJoint: 'Neck',
    spineJoint: 'Spine',
    maxHorizontalAngle: Math.PI / 2,
    maxVerticalAngle: Math.PI / 3,
    damping: 0.1,
    eyeOffset: new THREE.Vector3(0, 0.1, 0.05),
  };
}

/**
 * Create left arm IK configuration
 */
export function createLeftArmIKConfig(): TwoBoneIKConfig {
  return {
    rootJoint: 'LeftShoulder',
    midJoint: 'LeftElbow',
    endJoint: 'LeftHand',
    bendDirection: new THREE.Vector3(-1, 0, 0),
  };
}

/**
 * Create right arm IK configuration
 */
export function createRightArmIKConfig(): TwoBoneIKConfig {
  return {
    rootJoint: 'RightShoulder',
    midJoint: 'RightElbow',
    endJoint: 'RightHand',
    bendDirection: new THREE.Vector3(1, 0, 0),
  };
}

// ============================================================================
// Weight Blending Utilities
// ============================================================================

/**
 * Blend IK weight with existing animation weight
 */
export function blendIKWeight(ikWeight: number, animWeight: number, blendFactor: number): number {
  return lerp(animWeight, ikWeight, blendFactor);
}

/**
 * Calculate IK influence based on distance to target
 */
export function calculateInfluenceByDistance(
  currentPos: THREE.Vector3,
  targetPos: THREE.Vector3,
  maxDistance: number,
  minWeight: number = 0,
  maxWeight: number = 1
): number {
  const distance = currentPos.distanceTo(targetPos);
  if (distance >= maxDistance) return minWeight;
  
  const t = 1 - (distance / maxDistance);
  return lerp(minWeight, maxWeight, t);
}

/**
 * Smoothly enable IK with fade-in
 */
export function fadeInIK(weight: number, speed: number, deltaTime: number): number {
  return Math.min(1, weight + speed * deltaTime);
}

/**
 * Smoothly disable IK with fade-out
 */
export function fadeOutIK(weight: number, speed: number, deltaTime: number): number {
  return Math.max(0, weight - speed * deltaTime);
}

// ============================================================================
// Exports
// ============================================================================

export { IKSystem as default };
