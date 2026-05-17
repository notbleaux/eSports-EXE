// @ts-nocheck
/** [Ver001.000]
 * Animation Layer System
 * ======================
 * Manages animation layers for complex character animation blending.
 * Supports layer mixing, additive animations, and body masking.
 * 
 * Features:
 * - Layer mixing with weight-based blending
 * - Additive animation support
 * - Body masking for partial animation
 * - Layer priorities and ordering
 * - Smooth weight transitions
 */

// ============================================================================
// Types
// ============================================================================

/** Layer blending modes */
export type LayerBlendMode = 'override' | 'additive' | 'multiply' | 'screen';

/** Body mask definition (which body parts are affected) */
export interface BodyMask {
  /** Full body override */
  fullBody?: boolean;
  /** Individual body parts */
  parts?: {
    head?: boolean;
    neck?: boolean;
    chest?: boolean;
    spine?: boolean;
    leftArm?: boolean;
    rightArm?: boolean;
    leftHand?: boolean;
    rightHand?: boolean;
    leftLeg?: boolean;
    rightLeg?: boolean;
    leftFoot?: boolean;
    rightFoot?: boolean;
  };
  /** Custom bone weights */
  boneWeights?: Map<string, number>;
}

/** Animation layer configuration */
export interface AnimationLayer {
  /** Unique layer identifier */
  id: string;
  /** Layer name */
  name: string;
  /** Layer priority (higher = applied later) */
  priority: number;
  /** Layer weight (0-1) */
  weight: number;
  /** Blending mode */
  blendMode: LayerBlendMode;
  /** Body mask for this layer */
  mask?: BodyMask;
  /** Current animation state */
  currentState: string;
  /** Target animation state */
  targetState?: string;
  /** Animation playback speed */
  speed: number;
  /** Whether layer is enabled */
  enabled: boolean;
  /** Whether layer is muted */
  muted: boolean;
  /** Whether this layer is additive */
  additive: boolean;
}

/** Layer state snapshot */
export interface LayerState {
  /** Layer ID */
  id: string;
  /** Current weight */
  weight: number;
  /** Current state */
  state: string;
  /** Blend progress (0-1) */
  blendProgress: number;
  /** Time in current state */
  timeInState: number;
  /** Playback position (0-1) */
  normalizedTime: number;
}

/** Layer mixer result */
export interface LayerMixerResult {
  /** Final blended pose weights per state */
  finalWeights: Map<string, number>;
  /** Active layer count */
  activeLayerCount: number;
  /** Dominant layer */
  dominantLayer: string | null;
  /** Per-layer contributions */
  layerContributions: Map<string, number>;
}

/** Layer transition configuration */
export interface LayerTransition {
  /** Target layer ID */
  layerId: string;
  /** Target state */
  targetState: string;
  /** Transition duration */
  duration: number;
  /** Easing function */
  ease?: (t: number) => number;
}

/** Animation layer system options */
export interface LayerSystemOptions {
  /** Maximum number of layers */
  maxLayers?: number;
  /** Default layer weight */
  defaultWeight?: number;
  /** Enable smooth weight transitions */
  smoothWeightTransitions?: boolean;
  /** Weight transition speed */
  weightTransitionSpeed?: number;
  /** Debug logging */
  debug?: boolean;
}

/** Layer event type */
export type LayerEventType = 
  | 'layerAdded'
  | 'layerRemoved'
  | 'layerStateChange'
  | 'layerWeightChange'
  | 'layerEnabled'
  | 'layerDisabled';

/** Layer event */
export interface LayerEvent {
  type: LayerEventType;
  layerId: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

/** Layer event handler */
export type LayerEventHandler = (event: LayerEvent) => void;

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<LayerSystemOptions> = {
  maxLayers: 16,
  defaultWeight: 1,
  smoothWeightTransitions: true,
  weightTransitionSpeed: 5,
  debug: false,
};

const DEFAULT_BODY_MASK: BodyMask = {
  fullBody: true,
  parts: {
    head: true,
    neck: true,
    chest: true,
    spine: true,
    leftArm: true,
    rightArm: true,
    leftHand: true,
    rightHand: true,
    leftLeg: true,
    rightLeg: true,
    leftFoot: true,
    rightFoot: true,
  },
};

// ============================================================================
// Animation Layer System
// ============================================================================

export class AnimationLayerSystem {
  private layers: Map<string, AnimationLayer>;
  private layerStates: Map<string, LayerState>;
  private options: Required<LayerSystemOptions>;
  private listeners: Map<LayerEventType, Set<LayerEventHandler>>;
  private animationFrameId: number | null;
  private isDisposed: boolean;
  private targetWeights: Map<string, number>;

  constructor(options: LayerSystemOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.layers = new Map();
    this.layerStates = new Map();
    this.listeners = new Map();
    this.targetWeights = new Map();
    this.animationFrameId = null;
    this.isDisposed = false;

    this.startUpdateLoop();
  }

  // ============================================================================
  // Layer Management
  // ============================================================================

  /**
   * Add a new animation layer
   */
  addLayer(layer: Omit<AnimationLayer, 'weight'> & { weight?: number }): boolean {
    if (this.isDisposed) return false;

    if (this.layers.size >= this.options.maxLayers) {
      this.log('warn', 'Maximum layer count reached', { max: this.options.maxLayers });
      return false;
    }

    if (this.layers.has(layer.id)) {
      this.log('warn', 'Layer already exists', { id: layer.id });
      return false;
    }

    const fullLayer: AnimationLayer = {
      ...layer,
      weight: layer.weight ?? this.options.defaultWeight,
      enabled: layer.enabled ?? true,
      muted: layer.muted ?? false,
      additive: layer.additive ?? false,
    };

    this.layers.set(layer.id, fullLayer);
    this.targetWeights.set(layer.id, fullLayer.weight);
    
    this.layerStates.set(layer.id, {
      id: layer.id,
      weight: fullLayer.weight,
      state: fullLayer.currentState,
      blendProgress: 0,
      timeInState: 0,
      normalizedTime: 0,
    });

    this.emit('layerAdded', {
      layerId: layer.id,
      timestamp: performance.now(),
      data: { name: layer.name, priority: layer.priority },
    });

    this.log('debug', 'Layer added', { id: layer.id, name: layer.name });
    return true;
  }

  /**
   * Remove an animation layer
   */
  removeLayer(layerId: string): boolean {
    if (!this.layers.has(layerId)) return false;

    this.layers.delete(layerId);
    this.layerStates.delete(layerId);
    this.targetWeights.delete(layerId);

    this.emit('layerRemoved', {
      layerId,
      timestamp: performance.now(),
    });

    this.log('debug', 'Layer removed', { id: layerId });
    return true;
  }

  /**
   * Get a layer by ID
   */
  getLayer(layerId: string): AnimationLayer | undefined {
    return this.layers.get(layerId);
  }

  /**
   * Get all layers sorted by priority
   */
  getLayers(): AnimationLayer[] {
    return Array.from(this.layers.values()).sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get layer count
   */
  getLayerCount(): number {
    return this.layers.size;
  }

  // ============================================================================
  // Layer State Control
  // ============================================================================

  /**
   * Set the animation state for a layer
   */
  setLayerState(layerId: string, state: string, immediate = false): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) {
      this.log('warn', 'Layer not found', { id: layerId });
      return false;
    }

    if (layer.currentState === state) return true;

    layer.targetState = state;

    if (immediate) {
      layer.currentState = state;
      layer.targetState = undefined;

      const layerState = this.layerStates.get(layerId);
      if (layerState) {
        layerState.state = state;
        layerState.blendProgress = 1;
        layerState.timeInState = 0;
      }
    }

    this.emit('layerStateChange', {
      layerId,
      timestamp: performance.now(),
      data: { from: layer.currentState, to: state },
    });

    return true;
  }

  /**
   * Get the current state of a layer
   */
  getLayerState(layerId: string): LayerState | undefined {
    return this.layerStates.get(layerId);
  }

  /**
   * Update layer playback time
   */
  updateLayerTime(layerId: string, deltaTime: number): void {
    const layerState = this.layerStates.get(layerId);
    const layer = this.layers.get(layerId);
    
    if (layerState && layer) {
      layerState.timeInState += deltaTime * layer.speed;
      layerState.normalizedTime = (layerState.normalizedTime + deltaTime * layer.speed) % 1;
    }
  }

  // ============================================================================
  // Layer Weight Control
  // ============================================================================

  /**
   * Set layer weight
   */
  setLayerWeight(layerId: string, weight: number, smooth = true): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) {
      this.log('warn', 'Layer not found', { id: layerId });
      return false;
    }

    const clampedWeight = Math.max(0, Math.min(1, weight));

    if (smooth && this.options.smoothWeightTransitions) {
      this.targetWeights.set(layerId, clampedWeight);
    } else {
      layer.weight = clampedWeight;
      this.targetWeights.set(layerId, clampedWeight);
      
      const layerState = this.layerStates.get(layerId);
      if (layerState) {
        layerState.weight = clampedWeight;
      }
    }

    this.emit('layerWeightChange', {
      layerId,
      timestamp: performance.now(),
      data: { weight: clampedWeight },
    });

    return true;
  }

  /**
   * Get layer weight
   */
  getLayerWeight(layerId: string): number {
    return this.layers.get(layerId)?.weight ?? 0;
  }

  /**
   * Enable a layer
   */
  enableLayer(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.enabled = true;

    this.emit('layerEnabled', {
      layerId,
      timestamp: performance.now(),
    });

    return true;
  }

  /**
   * Disable a layer
   */
  disableLayer(layerId: string): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.enabled = false;

    this.emit('layerDisabled', {
      layerId,
      timestamp: performance.now(),
    });

    return true;
  }

  /**
   * Mute a layer (keep running but output is zero)
   */
  muteLayer(layerId: string, muted = true): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.muted = muted;
    return true;
  }

  // ============================================================================
  // Layer Mixing
  // ============================================================================

  /**
   * Compute final blended result from all layers
   */
  computeBlend(): LayerMixerResult {
    const layers = this.getLayers();
    const finalWeights = new Map<string, number>();
    const layerContributions = new Map<string, number>();
    let activeCount = 0;
    let dominantLayer: string | null = null;
    let maxContribution = 0;

    // Process layers in priority order
    for (const layer of layers) {
      if (!layer.enabled || layer.muted) continue;

      const effectiveWeight = layer.weight;
      if (effectiveWeight <= 0.001) continue;

      activeCount++;
      layerContributions.set(layer.id, effectiveWeight);

      // Track dominant layer
      if (effectiveWeight > maxContribution) {
        maxContribution = effectiveWeight;
        dominantLayer = layer.id;
      }

      // Apply based on blend mode
      switch (layer.blendMode) {
        case 'override':
          this.applyOverrideBlend(finalWeights, layer, effectiveWeight);
          break;
        case 'additive':
          this.applyAdditiveBlend(finalWeights, layer, effectiveWeight);
          break;
        case 'multiply':
          this.applyMultiplyBlend(finalWeights, layer, effectiveWeight);
          break;
        case 'screen':
          this.applyScreenBlend(finalWeights, layer, effectiveWeight);
          break;
      }
    }

    // Normalize final weights
    let totalWeight = 0;
    for (const weight of finalWeights.values()) {
      totalWeight += weight;
    }

    if (totalWeight > 0) {
      for (const [state, weight] of finalWeights) {
        finalWeights.set(state, weight / totalWeight);
      }
    }

    return {
      finalWeights,
      activeLayerCount: activeCount,
      dominantLayer,
      layerContributions,
    };
  }

  private applyOverrideBlend(
    weights: Map<string, number>,
    layer: AnimationLayer,
    effectiveWeight: number
  ): void {
    const currentWeight = weights.get(layer.currentState) ?? 0;
    const newWeight = currentWeight * (1 - effectiveWeight) + effectiveWeight;
    weights.set(layer.currentState, newWeight);
  }

  private applyAdditiveBlend(
    weights: Map<string, number>,
    layer: AnimationLayer,
    effectiveWeight: number
  ): void {
    const currentWeight = weights.get(layer.currentState) ?? 0;
    weights.set(layer.currentState, currentWeight + effectiveWeight);
  }

  private applyMultiplyBlend(
    weights: Map<string, number>,
    layer: AnimationLayer,
    effectiveWeight: number
  ): void {
    const currentWeight = weights.get(layer.currentState) ?? 0;
    const multiplied = currentWeight * (1 + effectiveWeight);
    weights.set(layer.currentState, Math.min(1, multiplied));
  }

  private applyScreenBlend(
    weights: Map<string, number>,
    layer: AnimationLayer,
    effectiveWeight: number
  ): void {
    const currentWeight = weights.get(layer.currentState) ?? 0;
    // Screen blend formula: 1 - (1 - a) * (1 - b)
    const screened = 1 - (1 - currentWeight) * (1 - effectiveWeight);
    weights.set(layer.currentState, screened);
  }

  // ============================================================================
  // Body Masking
  // ============================================================================

  /**
   * Set body mask for a layer
   */
  setLayerMask(layerId: string, mask: BodyMask): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    layer.mask = { ...DEFAULT_BODY_MASK, ...mask };
    return true;
  }

  /**
   * Get effective mask for a layer
   */
  getLayerMask(layerId: string): BodyMask | undefined {
    return this.layers.get(layerId)?.mask;
  }

  /**
   * Check if a body part is affected by a layer
   */
  isBodyPartAffected(layerId: string, part: keyof BodyMask['parts']): boolean {
    const layer = this.layers.get(layerId);
    if (!layer) return false;

    const mask = layer.mask;
    if (!mask) return true;

    if (mask.fullBody) return true;
    if (mask.parts?.[part]) return true;

    return false;
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
    // Smooth weight transitions
    if (this.options.smoothWeightTransitions) {
      for (const [layerId, targetWeight] of this.targetWeights) {
        const layer = this.layers.get(layerId);
        if (!layer) continue;

        const currentWeight = layer.weight;
        const diff = targetWeight - currentWeight;

        if (Math.abs(diff) < 0.001) {
          layer.weight = targetWeight;
        } else {
          const speed = this.options.weightTransitionSpeed * deltaTime;
          layer.weight = currentWeight + diff * Math.min(speed, 1);
        }

        // Update layer state
        const layerState = this.layerStates.get(layerId);
        if (layerState) {
          layerState.weight = layer.weight;
        }
      }
    }

    // Update layer times
    for (const layer of this.layers.values()) {
      if (layer.enabled && !layer.muted) {
        this.updateLayerTime(layer.id, deltaTime);
      }
    }
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Subscribe to layer events
   */
  on(event: LayerEventType, handler: LayerEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private emit(type: LayerEventType, event: Omit<LayerEvent, 'type'>): void {
    const fullEvent: LayerEvent = { type, ...event };

    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(fullEvent);
        } catch (error) {
          this.log('error', 'Event handler error', { error });
        }
      });
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
    if (!this.options.debug && level === 'debug') return;

    const prefix = '[AnimationLayerSystem]';
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
   * Dispose of the layer system
   */
  dispose(): void {
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.layers.clear();
    this.layerStates.clear();
    this.listeners.clear();
    this.targetWeights.clear();
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createAnimationLayerSystem(options?: LayerSystemOptions): AnimationLayerSystem {
  return new AnimationLayerSystem(options);
}

// ============================================================================
// Preset Layers
// ============================================================================

/**
 * Create a base layer for locomotion
 */
export function createBaseLayer(id: string = 'base'): AnimationLayer {
  return {
    id,
    name: 'Base Layer',
    priority: 0,
    weight: 1,
    blendMode: 'override',
    currentState: 'idle',
    speed: 1,
    enabled: true,
    muted: false,
    additive: false,
    mask: DEFAULT_BODY_MASK,
  };
}

/**
 * Create an upper body layer for gestures/actions
 */
export function createUpperBodyLayer(id: string = 'upperBody'): AnimationLayer {
  return {
    id,
    name: 'Upper Body Layer',
    priority: 1,
    weight: 0,
    blendMode: 'override',
    currentState: 'none',
    speed: 1,
    enabled: true,
    muted: false,
    additive: false,
    mask: {
      fullBody: false,
      parts: {
        head: true,
        neck: true,
        chest: true,
        spine: true,
        leftArm: true,
        rightArm: true,
        leftHand: true,
        rightHand: true,
      },
    },
  };
}

/**
 * Create an additive layer for detail animations
 */
export function createAdditiveLayer(id: string = 'additive'): AnimationLayer {
  return {
    id,
    name: 'Additive Layer',
    priority: 10,
    weight: 0,
    blendMode: 'additive',
    currentState: 'none',
    speed: 1,
    enabled: true,
    muted: false,
    additive: true,
    mask: DEFAULT_BODY_MASK,
  };
}

/**
 * Create an IK layer for foot placement
 */
export function createIKLayer(id: string = 'ik'): AnimationLayer {
  return {
    id,
    name: 'IK Layer',
    priority: 100,
    weight: 1,
    blendMode: 'override',
    currentState: 'ik_active',
    speed: 1,
    enabled: true,
    muted: false,
    additive: false,
    mask: {
      fullBody: false,
      parts: {
        leftLeg: true,
        rightLeg: true,
        leftFoot: true,
        rightFoot: true,
      },
    },
  };
}

// ============================================================================
// Body Mask Utilities
// ============================================================================

/**
 * Create a full body mask
 */
export function createFullBodyMask(): BodyMask {
  return { ...DEFAULT_BODY_MASK };
}

/**
 * Create a partial body mask
 */
export function createPartialBodyMask(parts: (keyof BodyMask['parts'])[]): BodyMask {
  const mask: BodyMask = {
    fullBody: false,
    parts: {},
  };

  for (const part of parts) {
    mask.parts![part] = true;
  }

  return mask;
}

/**
 * Create an upper body only mask
 */
export function createUpperBodyMask(): BodyMask {
  return createPartialBodyMask([
    'head', 'neck', 'chest', 'spine',
    'leftArm', 'rightArm', 'leftHand', 'rightHand',
  ]);
}

/**
 * Create a lower body only mask
 */
export function createLowerBodyMask(): BodyMask {
  return createPartialBodyMask([
    'leftLeg', 'rightLeg', 'leftFoot', 'rightFoot',
  ]);
}

// ============================================================================
// Exports
// ============================================================================

export { AnimationLayerSystem as default };
