/** [Ver001.000]
 * Animation Library Index
 * =======================
 * Central export point for the animation state machine system.
 * Provides mascot character animation management with Framer Motion
 * and Three.js integration.
 */

// ============================================================================
// Core Exports
// ============================================================================

export { AnimationStateMachine } from './stateMachine';
export type { StateMachineState, TransitionContext } from './stateMachine';

export { AnimationSequencer } from './sequencer';
export type {
  AnimationSequence,
  AnimationStep,
  AnimationStepType,
  SequencerState,
  SequencerEvent,
  SequencerEventType,
  SequencerEventHandler,
  // Step types
  StateAnimationStep,
  WaitAnimationStep,
  ParallelAnimationStep,
  BranchAnimationStep,
  LoopAnimationStep,
  CallbackAnimationStep,
  LabelAnimationStep,
  GotoAnimationStep,
} from './sequencer';

export {
  VICTORY_SEQUENCE,
  ATTACK_SEQUENCE,
  DEFEAT_SEQUENCE,
  JUMP_ATTACK_SEQUENCE,
  createAnimationSequencer,
} from './sequencer';

// ============================================================================
// State Types & Configurations
// ============================================================================

export type {
  AnimationState,
  ExtendedAnimationState,
  TransitionDirection,
  AnimationPriority,
  AnimationStateConfig,
  StateTransition,
  MascotStateData,
  AnimationEvent,
  AnimationEventType,
  AnimationEventHandler,
  BlendConfig,
  ActiveBlend,
  MixerConfig,
  AnimationClipMapping,
  StateMachineOptions,
} from './states';

export {
  DEFAULT_STATE_CONFIGS,
  DEFAULT_TRANSITIONS,
  PRIORITY_WEIGHTS,
} from './states';

export type { MascotId } from './states';

// ============================================================================
// Blend Tree System
// ============================================================================

export { BlendTreeSystem, createBlendTreeSystem } from './blendTree';
export type {
  BlendTree,
  BlendTreeType,
  BlendTree1D,
  BlendTree2DCartesian,
  BlendTree2DDirectional,
  BlendClip,
  BlendParameter,
  BlendParameterConfig,
  BlendResult,
  BlendTreeState,
  BlendTreeOptions,
} from './blendTree';

export {
  create1DBlendTree,
  create2DCartesianTree,
  create2DDirectionalTree,
  createBlendParameter,
  createMovementBlendTree,
  create8DirectionalTree,
  blendValues,
} from './blendTree';

// ============================================================================
// Transition Controller
// ============================================================================

export { TransitionController, createTransitionController } from './transitions';
export type {
  TransitionConfig,
  TransitionCondition,
  ActiveTransition,
  QueuedTransition,
  TransitionEvent,
  TransitionEventType,
  TransitionEventHandler,
  TransitionControllerOptions,
  TransitionPreset,
  EasingFunction,
  EasingName,
} from './transitions';

export {
  QUICK_TRANSITION,
  SMOOTH_TRANSITION,
  DRAMATIC_TRANSITION,
  SPRING_TRANSITION,
  COMBAT_TRANSITION,
  getTransitionPresets,
  getEasingFunction,
  EASING_FUNCTIONS,
} from './transitions';

// ============================================================================
// Animation Layer System
// ============================================================================

export { AnimationLayerSystem, createAnimationLayerSystem } from './layers';
export type {
  AnimationLayer,
  LayerBlendMode,
  BodyMask,
  LayerState,
  LayerMixerResult,
  LayerTransition,
  LayerSystemOptions,
  LayerEvent,
  LayerEventType,
  LayerEventHandler,
} from './layers';

export {
  createBaseLayer,
  createUpperBodyLayer,
  createAdditiveLayer,
  createIKLayer,
  createFullBodyMask,
  createPartialBodyMask,
  createUpperBodyMask,
  createLowerBodyMask,
} from './layers';

// ============================================================================
// IK System
// ============================================================================

export { IKSystem, createIKSystem } from './ik';
export type {
  IKChain,
  IKChainType,
  IKTarget,
  IKResult,
  IKChainState,
  IKSystemOptions,
  FootIKConfig,
  LookAtIKConfig,
  TwoBoneIKConfig,
} from './ik';

export {
  createLeftFootIKConfig,
  createRightFootIKConfig,
  createHeadLookAtConfig,
  createLeftArmIKConfig,
  createRightArmIKConfig,
  blendIKWeight,
  calculateInfluenceByDistance,
  fadeInIK,
  fadeOutIK,
} from './ik';

// ============================================================================
// Factory Functions
// ============================================================================

export { createAnimationStateMachine } from './stateMachine';

// ============================================================================
// Utility Functions (for advanced use)
// ============================================================================

/**
 * Check if a transition between two states is valid
 */
export function isValidTransition(
  from: AnimationState,
  to: AnimationState
): boolean {
  const transitions = DEFAULT_TRANSITIONS[from];
  return transitions?.some(t => t.to === to) ?? false;
}

/**
 * Get priority weight for an animation state
 */
export function getStatePriority(state: AnimationState): number {
  const config = DEFAULT_STATE_CONFIGS[state];
  return PRIORITY_WEIGHTS[config.priority];
}

/**
 * Check if a state can interrupt another state
 */
export function canInterrupt(
  currentState: AnimationState,
  targetState: AnimationState
): boolean {
  const currentConfig = DEFAULT_STATE_CONFIGS[currentState];
  const targetConfig = DEFAULT_STATE_CONFIGS[targetState];

  if (!currentConfig.interruptible) {
    const currentPriority = PRIORITY_WEIGHTS[currentConfig.priority];
    const targetPriority = PRIORITY_WEIGHTS[targetConfig.priority];
    return targetPriority > currentPriority;
  }

  return true;
}

/**
 * Get blend duration between two states
 */
export function getBlendDuration(
  from: AnimationState,
  to: AnimationState
): number {
  const fromConfig = DEFAULT_STATE_CONFIGS[from];
  const toConfig = DEFAULT_STATE_CONFIGS[to];
  
  // Use the target state's blend in duration, or fallback to from state's blend out
  return toConfig.blendInDuration ?? fromConfig.blendOutDuration ?? 0.3;
}

/**
 * Get all valid transitions from a state
 */
export function getValidTransitions(from: AnimationState): AnimationState[] {
  const transitions = DEFAULT_TRANSITIONS[from];
  return transitions?.map(t => t.to) ?? [];
}

/**
 * Create a simple state animation step
 */
export function createStateStep(
  state: AnimationState,
  options: {
    waitForComplete?: boolean;
    duration?: number;
    blendDuration?: number;
    condition?: () => boolean;
  } = {}
): AnimationStep {
  return {
    type: 'state',
    state,
    waitForComplete: options.waitForComplete ?? false,
    duration: options.duration,
    blendDuration: options.blendDuration,
    condition: options.condition,
  };
}

/**
 * Create a wait animation step
 */
export function createWaitStep(
  duration: number,
  options: {
    condition?: () => boolean;
    timeout?: number;
  } = {}
): AnimationStep {
  return {
    type: 'wait',
    duration,
    condition: options.condition,
    timeout: options.timeout,
  };
}

/**
 * Create a callback animation step
 */
export function createCallbackStep(
  callback: () => void | Promise<void>,
  options: {
    waitForComplete?: boolean;
    timeout?: number;
  } = {}
): AnimationStep {
  return {
    type: 'callback',
    callback,
    waitForComplete: options.waitForComplete ?? false,
    timeout: options.timeout,
  };
}

/**
 * Create a loop animation step
 */
export function createLoopStep(
  steps: AnimationStep[],
  options: {
    count?: number;
    while?: () => boolean;
    maxIterations?: number;
  } = {}
): AnimationStep {
  return {
    type: 'loop',
    steps,
    count: options.count,
    while: options.while,
    maxIterations: options.maxIterations,
  };
}

/**
 * Create a complete animation sequence
 */
export function createSequence(
  id: string,
  steps: AnimationStep[],
  options: {
    name?: string;
    loop?: boolean;
    priority?: AnimationPriority;
    autoStart?: boolean;
    onComplete?: () => void;
    onError?: (error: Error) => void;
  } = {}
): AnimationSequence {
  return {
    id,
    name: options.name ?? id,
    steps,
    loop: options.loop ?? false,
    priority: options.priority ?? 'normal',
    autoStart: options.autoStart ?? false,
    onComplete: options.onComplete,
    onError: options.onError,
  };
}

// ============================================================================
// Re-export from @/lib/three/animationBridge for convenience
// ============================================================================

export {
  useAnimationBridge,
  useAnimationState,
  useCoordinatedAnimation,
  createAnimationBridge,
  getGlobalAnimationBridge,
  lerp,
  lerpVector,
  lerpColor,
  smoothstep,
  EASINGS,
} from '@/lib/three/animationBridge';

export type {
  AnimationBridgeState,
  AnimationBridgeAPI,
  BridgeTransition,
  SpringConfig,
  AnimationBridgeOptions,
} from '@/lib/three/animationBridge';
