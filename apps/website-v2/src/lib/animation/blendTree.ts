/** [Ver001.000]
 * Blend Tree System
 * ================
 * Advanced animation blending using 1D and 2D blend trees.
 * Provides smooth interpolation between multiple animation states
 * based on blend parameters like speed, direction, and intensity.
 * 
 * Features:
 * - 1D blend trees (linear interpolation along single axis)
 * - 2D blend trees (Cartesian/Directional interpolation)
 * - Smooth parameter control with spring physics
 * - Weight normalization and validation
 * - Integration with AnimationStateMachine
 */

import { lerp, smoothstep, EASINGS } from '@/lib/three/animationBridge';

// ============================================================================
// Types
// ============================================================================

/** Blend tree types */
export type BlendTreeType = '1d' | '2d-cartesian' | '2d-directional';

/** Blend parameter identifier */
export type BlendParameter = string;

/** Single animation clip in a blend tree */
export interface BlendClip {
  /** Animation state name */
  state: string;
  /** Position in 1D blend space */
  threshold?: number;
  /** Position in 2D blend space */
  position?: { x: number; y: number };
  /** Animation speed multiplier */
  speed?: number;
  /** Whether to loop this clip */
  loop?: boolean;
}

/** Blend parameter configuration */
export interface BlendParameterConfig {
  /** Parameter name */
  name: BlendParameter;
  /** Current value */
  value: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Whether to clamp values */
  clamped: boolean;
  /** Spring stiffness for smoothing */
  springStiffness?: number;
  /** Spring damping for smoothing */
  springDamping?: number;
}

/** 1D Blend Tree configuration */
export interface BlendTree1D {
  type: '1d';
  /** Parameter controlling the blend */
  parameter: BlendParameter;
  /** Animation clips sorted by threshold */
  clips: BlendClip[];
  /** Optional default clip when no others match */
  defaultClip?: string;
}

/** 2D Cartesian Blend Tree configuration */
export interface BlendTree2DCartesian {
  type: '2d-cartesian';
  /** X-axis parameter */
  parameterX: BlendParameter;
  /** Y-axis parameter */
  parameterY: BlendParameter;
  /** Animation clips with 2D positions */
  clips: BlendClip[];
}

/** 2D Directional Blend Tree configuration */
export interface BlendTree2DDirectional {
  type: '2d-directional';
  /** X-axis parameter (typically direction x) */
  parameterX: BlendParameter;
  /** Y-axis parameter (typically direction y) */
  parameterY: BlendParameter;
  /** Animation clips arranged radially */
  clips: BlendClip[];
  /** Time scale for directional transitions */
  timeScale?: number;
}

/** Union type for all blend tree types */
export type BlendTree = BlendTree1D | BlendTree2DCartesian | BlendTree2DDirectional;

/** Blend result containing weights for each clip */
export interface BlendResult {
  /** Map of state names to their blend weights (0-1) */
  weights: Map<string, number>;
  /** Normalized weights that sum to 1 */
  normalizedWeights: Map<string, number>;
  /** Total weight before normalization */
  totalWeight: number;
  /** Active clip count (weights > 0) */
  activeCount: number;
  /** Dominant clip (highest weight) */
  dominantClip: string | null;
}

/** Blend tree state */
export interface BlendTreeState {
  /** Current parameter values */
  parameters: Map<BlendParameter, number>;
  /** Target parameter values (for smoothing) */
  targetParameters: Map<BlendParameter, number>;
  /** Parameter velocities for spring physics */
  parameterVelocities: Map<BlendParameter, number>;
  /** Current blend result */
  currentResult: BlendResult;
  /** Whether parameters are being smoothed */
  isSmoothing: boolean;
}

/** Blend tree options */
export interface BlendTreeOptions {
  /** Enable parameter smoothing with spring physics */
  enableSmoothing?: boolean;
  /** Default spring stiffness */
  defaultStiffness?: number;
  /** Default spring damping */
  defaultDamping?: number;
  /** Minimum weight threshold (clips below this are ignored) */
  weightThreshold?: number;
  /** Whether to use normalized weights */
  normalizeWeights?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<BlendTreeOptions> = {
  enableSmoothing: true,
  defaultStiffness: 100,
  defaultDamping: 10,
  weightThreshold: 0.001,
  normalizeWeights: true,
};

// ============================================================================
// Blend Tree System Class
// ============================================================================

export class BlendTreeSystem {
  private trees: Map<string, BlendTree>;
  private parameters: Map<BlendParameter, BlendParameterConfig>;
  private state: BlendTreeState;
  private options: Required<BlendTreeOptions>;
  private animationFrameId: number | null;
  private isDisposed: boolean;
  private listeners: Set<(state: BlendTreeState) => void>;

  constructor(options: BlendTreeOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.trees = new Map();
    this.parameters = new Map();
    this.listeners = new Set();
    this.isDisposed = false;
    this.animationFrameId = null;

    this.state = {
      parameters: new Map(),
      targetParameters: new Map(),
      parameterVelocities: new Map(),
      currentResult: this.createEmptyResult(),
      isSmoothing: false,
    };

    this.startUpdateLoop();
  }

  // ============================================================================
  // Tree Management
  // ============================================================================

  /**
   * Register a 1D blend tree
   */
  register1DTree(id: string, config: Omit<BlendTree1D, 'type'>): void {
    if (this.isDisposed) return;

    // Sort clips by threshold
    const sortedClips = [...config.clips].sort((a, b) => 
      (a.threshold ?? 0) - (b.threshold ?? 0)
    );

    this.trees.set(id, {
      type: '1d',
      parameter: config.parameter,
      clips: sortedClips,
      defaultClip: config.defaultClip,
    });
  }

  /**
   * Register a 2D Cartesian blend tree
   */
  register2DCartesianTree(id: string, config: Omit<BlendTree2DCartesian, 'type'>): void {
    if (this.isDisposed) return;

    this.trees.set(id, {
      type: '2d-cartesian',
      parameterX: config.parameterX,
      parameterY: config.parameterY,
      clips: config.clips,
    });
  }

  /**
   * Register a 2D Directional blend tree
   */
  register2DDirectionalTree(id: string, config: Omit<BlendTree2DDirectional, 'type'>): void {
    if (this.isDisposed) return;

    this.trees.set(id, {
      type: '2d-directional',
      parameterX: config.parameterX,
      parameterY: config.parameterY,
      clips: config.clips,
      timeScale: config.timeScale ?? 1,
    });
  }

  /**
   * Unregister a blend tree
   */
  unregisterTree(id: string): void {
    this.trees.delete(id);
  }

  /**
   * Get a registered blend tree
   */
  getTree(id: string): BlendTree | undefined {
    return this.trees.get(id);
  }

  // ============================================================================
  // Parameter Management
  // ============================================================================

  /**
   * Register a blend parameter
   */
  registerParameter(config: BlendParameterConfig): void {
    if (this.isDisposed) return;

    this.parameters.set(config.name, config);
    this.state.parameters.set(config.name, config.value);
    this.state.targetParameters.set(config.name, config.value);
    this.state.parameterVelocities.set(config.name, 0);
  }

  /**
   * Set a parameter value
   */
  setParameter(name: BlendParameter, value: number, immediate = false): void {
    if (this.isDisposed) return;

    const config = this.parameters.get(name);
    if (!config) {
      console.warn(`[BlendTreeSystem] Parameter not found: ${name}`);
      return;
    }

    // Clamp if necessary
    let clampedValue = value;
    if (config.clamped) {
      clampedValue = Math.max(config.min, Math.min(config.max, value));
    }

    if (immediate || !this.options.enableSmoothing) {
      this.state.parameters.set(name, clampedValue);
      this.state.targetParameters.set(name, clampedValue);
      this.state.parameterVelocities.set(name, 0);
    } else {
      this.state.targetParameters.set(name, clampedValue);
      this.state.isSmoothing = true;
    }
  }

  /**
   * Get current parameter value
   */
  getParameter(name: BlendParameter): number {
    return this.state.parameters.get(name) ?? 0;
  }

  /**
   * Get target parameter value
   */
  getTargetParameter(name: BlendParameter): number {
    return this.state.targetParameters.get(name) ?? 0;
  }

  /**
   * Get parameter configuration
   */
  getParameterConfig(name: BlendParameter): BlendParameterConfig | undefined {
    return this.parameters.get(name);
  }

  // ============================================================================
  // Blend Computation
  // ============================================================================

  /**
   * Compute blend weights for a 1D tree
   */
  private compute1DBlend(tree: BlendTree1D): BlendResult {
    const value = this.state.parameters.get(tree.parameter) ?? 0;
    const clips = tree.clips;

    if (clips.length === 0) {
      return this.createEmptyResult();
    }

    if (clips.length === 1) {
      return this.createSingleResult(clips[0].state);
    }

    const weights = new Map<string, number>();

    // Find the two clips to blend between
    let lowerIndex = 0;
    let upperIndex = clips.length - 1;

    for (let i = 0; i < clips.length - 1; i++) {
      const current = clips[i].threshold ?? 0;
      const next = clips[i + 1].threshold ?? 0;

      if (value >= current && value <= next) {
        lowerIndex = i;
        upperIndex = i + 1;
        break;
      }
    }

    const lowerClip = clips[lowerIndex];
    const upperClip = clips[upperIndex];
    const lowerThreshold = lowerClip.threshold ?? 0;
    const upperThreshold = upperClip.threshold ?? 0;

    // Calculate blend factor
    let t = 0;
    if (upperThreshold !== lowerThreshold) {
      t = (value - lowerThreshold) / (upperThreshold - lowerThreshold);
    }
    t = Math.max(0, Math.min(1, t));

    // Apply smoothstep for smoother blending
    t = smoothstep(0, 1, t);

    weights.set(lowerClip.state, 1 - t);
    weights.set(upperClip.state, t);

    return this.createResult(weights);
  }

  /**
   * Compute blend weights for a 2D Cartesian tree
   */
  private compute2DCartesianBlend(tree: BlendTree2DCartesian): BlendResult {
    const x = this.state.parameters.get(tree.parameterX) ?? 0;
    const y = this.state.parameters.get(tree.parameterY) ?? 0;
    const clips = tree.clips;

    if (clips.length === 0) {
      return this.createEmptyResult();
    }

    if (clips.length === 1) {
      return this.createSingleResult(clips[0].state);
    }

    // Find the bounding triangle/quadrant for the current position
    // Use inverse distance weighting for smooth blending
    const weights = new Map<string, number>();
    let totalWeight = 0;

    for (const clip of clips) {
      const pos = clip.position ?? { x: 0, y: 0 };
      const dx = x - pos.x;
      const dy = y - pos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Inverse distance weighting
      let weight = 0;
      if (distance < 0.0001) {
        // Very close to this clip, give it full weight
        weight = 1000;
      } else {
        weight = 1 / (distance * distance);
      }

      weights.set(clip.state, weight);
      totalWeight += weight;
    }

    // Normalize weights
    if (this.options.normalizeWeights && totalWeight > 0) {
      for (const [state, weight] of weights) {
        weights.set(state, weight / totalWeight);
      }
    }

    return this.createResult(weights);
  }

  /**
   * Compute blend weights for a 2D Directional tree
   */
  private compute2DDirectionalBlend(tree: BlendTree2DDirectional): BlendResult {
    const x = this.state.parameters.get(tree.parameterX) ?? 0;
    const y = this.state.parameters.get(tree.parameterY) ?? 0;
    const clips = tree.clips;

    if (clips.length === 0) {
      return this.createEmptyResult();
    }

    // Calculate direction and magnitude
    const magnitude = Math.sqrt(x * x + y * y);
    const angle = Math.atan2(y, x); // -π to π

    const weights = new Map<string, number>();

    if (clips.length === 1) {
      weights.set(clips[0].state, magnitude);
      return this.createResult(weights);
    }

    // Find the two closest clips by angle
    let closestIndex1 = 0;
    let closestIndex2 = 1;
    let minAngleDiff1 = Infinity;
    let minAngleDiff2 = Infinity;

    for (let i = 0; i < clips.length; i++) {
      const clip = clips[i];
      const pos = clip.position ?? { x: 0, y: 0 };
      const clipAngle = Math.atan2(pos.y, pos.x);

      // Calculate smallest angle difference
      let diff = Math.abs(angle - clipAngle);
      if (diff > Math.PI) {
        diff = 2 * Math.PI - diff;
      }

      if (diff < minAngleDiff1) {
        minAngleDiff2 = minAngleDiff1;
        closestIndex2 = closestIndex1;
        minAngleDiff1 = diff;
        closestIndex1 = i;
      } else if (diff < minAngleDiff2) {
        minAngleDiff2 = diff;
        closestIndex2 = i;
      }
    }

    // Calculate blend factor based on angle
    const clip1 = clips[closestIndex1];
    const clip2 = clips[closestIndex2];
    const pos1 = clip1.position ?? { x: 1, y: 0 };
    const pos2 = clip2.position ?? { x: 0, y: 1 };
    const angle1 = Math.atan2(pos1.y, pos1.x);
    const angle2 = Math.atan2(pos2.y, pos2.x);

    let angleDiff = angle2 - angle1;
    if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    let currentDiff = angle - angle1;
    if (currentDiff > Math.PI) currentDiff -= 2 * Math.PI;
    if (currentDiff < -Math.PI) currentDiff += 2 * Math.PI;

    let t = 0;
    if (Math.abs(angleDiff) > 0.0001) {
      t = currentDiff / angleDiff;
    }
    t = Math.max(0, Math.min(1, t));

    // Apply magnitude as overall weight
    const weight1 = magnitude * (1 - t);
    const weight2 = magnitude * t;

    weights.set(clip1.state, weight1);
    weights.set(clip2.state, weight2);

    return this.createResult(weights);
  }

  /**
   * Compute blend result for a tree
   */
  computeBlend(treeId: string): BlendResult {
    if (this.isDisposed) {
      return this.createEmptyResult();
    }

    const tree = this.trees.get(treeId);
    if (!tree) {
      console.warn(`[BlendTreeSystem] Tree not found: ${treeId}`);
      return this.createEmptyResult();
    }

    let result: BlendResult;

    switch (tree.type) {
      case '1d':
        result = this.compute1DBlend(tree);
        break;
      case '2d-cartesian':
        result = this.compute2DCartesianBlend(tree);
        break;
      case '2d-directional':
        result = this.compute2DDirectionalBlend(tree);
        break;
      default:
        result = this.createEmptyResult();
    }

    this.state.currentResult = result;
    return result;
  }

  // ============================================================================
  // Result Helpers
  // ============================================================================

  private createEmptyResult(): BlendResult {
    return {
      weights: new Map(),
      normalizedWeights: new Map(),
      totalWeight: 0,
      activeCount: 0,
      dominantClip: null,
    };
  }

  private createSingleResult(state: string): BlendResult {
    const weights = new Map([[state, 1]]);
    return {
      weights,
      normalizedWeights: new Map(weights),
      totalWeight: 1,
      activeCount: 1,
      dominantClip: state,
    };
  }

  private createResult(weights: Map<string, number>): BlendResult {
    // Apply threshold
    const threshold = this.options.weightThreshold;
    const filteredWeights = new Map<string, number>();

    for (const [state, weight] of weights) {
      if (weight >= threshold) {
        filteredWeights.set(state, weight);
      }
    }

    // Calculate total weight
    let totalWeight = 0;
    for (const weight of filteredWeights.values()) {
      totalWeight += weight;
    }

    // Normalize weights
    const normalizedWeights = new Map<string, number>();
    if (totalWeight > 0 && this.options.normalizeWeights) {
      for (const [state, weight] of filteredWeights) {
        normalizedWeights.set(state, weight / totalWeight);
      }
    } else {
      for (const [state, weight] of filteredWeights) {
        normalizedWeights.set(state, weight);
      }
    }

    // Find dominant clip
    let dominantClip: string | null = null;
    let maxWeight = -1;
    for (const [state, weight] of normalizedWeights) {
      if (weight > maxWeight) {
        maxWeight = weight;
        dominantClip = state;
      }
    }

    return {
      weights: filteredWeights,
      normalizedWeights,
      totalWeight,
      activeCount: filteredWeights.size,
      dominantClip,
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
    if (!this.state.isSmoothing) return;

    let anyMoving = false;

    // Update parameters with spring physics
    for (const [name, targetValue] of this.state.targetParameters) {
      const config = this.parameters.get(name);
      if (!config) continue;

      const currentValue = this.state.parameters.get(name) ?? targetValue;

      if (Math.abs(targetValue - currentValue) < 0.0001) {
        this.state.parameters.set(name, targetValue);
        this.state.parameterVelocities.set(name, 0);
        continue;
      }

      anyMoving = true;

      // Spring physics
      const stiffness = config.springStiffness ?? this.options.defaultStiffness;
      const damping = config.springDamping ?? this.options.defaultDamping;

      const displacement = currentValue - targetValue;
      const velocity = this.state.parameterVelocities.get(name) ?? 0;

      const springForce = -stiffness * displacement;
      const dampingForce = -damping * velocity;
      const acceleration = springForce + dampingForce;

      const newVelocity = velocity + acceleration * deltaTime;
      const newValue = currentValue + newVelocity * deltaTime;

      this.state.parameters.set(name, newValue);
      this.state.parameterVelocities.set(name, newVelocity);
    }

    this.state.isSmoothing = anyMoving;

    // Notify listeners
    if (anyMoving) {
      this.listeners.forEach(listener => listener({ ...this.state }));
    }
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Subscribe to blend tree state changes
   */
  subscribe(listener: (state: BlendTreeState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Get current blend tree state
   */
  getState(): Readonly<BlendTreeState> {
    return { ...this.state };
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Dispose of the blend tree system
   */
  dispose(): void {
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.trees.clear();
    this.parameters.clear();
    this.listeners.clear();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createBlendTreeSystem(options?: BlendTreeOptions): BlendTreeSystem {
  return new BlendTreeSystem(options);
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a 1D blend tree configuration
 */
export function create1DBlendTree(
  parameter: BlendParameter,
  clips: BlendClip[],
  defaultClip?: string
): BlendTree1D {
  return {
    type: '1d',
    parameter,
    clips: clips.sort((a, b) => (a.threshold ?? 0) - (b.threshold ?? 0)),
    defaultClip,
  };
}

/**
 * Create a 2D Cartesian blend tree configuration
 */
export function create2DCartesianTree(
  parameterX: BlendParameter,
  parameterY: BlendParameter,
  clips: BlendClip[]
): BlendTree2DCartesian {
  return {
    type: '2d-cartesian',
    parameterX,
    parameterY,
    clips,
  };
}

/**
 * Create a 2D Directional blend tree configuration
 */
export function create2DDirectionalTree(
  parameterX: BlendParameter,
  parameterY: BlendParameter,
  clips: BlendClip[],
  timeScale?: number
): BlendTree2DDirectional {
  return {
    type: '2d-directional',
    parameterX,
    parameterY,
    clips,
    timeScale,
  };
}

/**
 * Create a blend parameter configuration
 */
export function createBlendParameter(
  name: string,
  options: Partial<Omit<BlendParameterConfig, 'name' | 'value'>> & { initialValue?: number } = {}
): BlendParameterConfig {
  return {
    name,
    value: options.initialValue ?? 0,
    min: options.min ?? 0,
    max: options.max ?? 1,
    clamped: options.clamped ?? true,
    springStiffness: options.springStiffness,
    springDamping: options.springDamping,
  };
}

/**
 * Blend two values using a result weight
 */
export function blendValues<T extends number | { x: number; y: number; z: number }>(
  from: T,
  to: T,
  weight: number
): T {
  if (typeof from === 'number' && typeof to === 'number') {
    return lerp(from, to, weight) as T;
  }

  // Assume it's a vector-like object
  const fromVec = from as { x: number; y: number; z: number };
  const toVec = to as { x: number; y: number; z: number };

  return {
    x: lerp(fromVec.x, toVec.x, weight),
    y: lerp(fromVec.y, toVec.y, weight),
    z: lerp(fromVec.z, toVec.z, weight),
  } as T;
}

// ============================================================================
// Preset Blend Trees
// ============================================================================

/**
 * Create a standard movement blend tree (idle -> walk -> run)
 */
export function createMovementBlendTree(speedParam: BlendParameter = 'speed'): BlendTree1D {
  return create1DBlendTree(speedParam, [
    { state: 'idle', threshold: 0, speed: 1 },
    { state: 'walk', threshold: 0.5, speed: 1 },
    { state: 'run', threshold: 1, speed: 1.2 },
  ], 'idle');
}

/**
 * Create an 8-directional movement blend tree
 */
export function create8DirectionalTree(
  xParam: BlendParameter = 'directionX',
  yParam: BlendParameter = 'directionY'
): BlendTree2DDirectional {
  const angleStep = (Math.PI * 2) / 8;
  const clips: BlendClip[] = [
    { state: 'move_n', position: { x: 0, y: 1 } },
    { state: 'move_ne', position: { x: Math.cos(angleStep * 0.5), y: Math.sin(angleStep * 0.5) } },
    { state: 'move_e', position: { x: 1, y: 0 } },
    { state: 'move_se', position: { x: Math.cos(angleStep * -0.5), y: Math.sin(angleStep * -0.5) } },
    { state: 'move_s', position: { x: 0, y: -1 } },
    { state: 'move_sw', position: { x: Math.cos(angleStep * -1.5), y: Math.sin(angleStep * -1.5) } },
    { state: 'move_w', position: { x: -1, y: 0 } },
    { state: 'move_nw', position: { x: Math.cos(angleStep * 1.5), y: Math.sin(angleStep * 1.5) } },
  ];

  return create2DDirectionalTree(xParam, yParam, clips);
}

// ============================================================================
// Exports
// ============================================================================

export { BlendTreeSystem as default };
