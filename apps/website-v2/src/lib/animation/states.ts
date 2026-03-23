/** [Ver001.000]
 * Animation State Definitions
 * ===========================
 * TypeScript types and configurations for mascot animation states.
 * Provides type-safe animation state management with Framer Motion
 * and Three.js integration.
 */

import type { SpringOptions, Transition } from 'framer-motion';
// MascotId type - mirrors definition from @/components/mascots/types
export type MascotId = 'sol' | 'lun' | 'bin' | 'fat' | 'uni';

// ============================================================================
// Animation State Types
// ============================================================================

/**
 * Core animation states for mascot characters
 */
export type AnimationState =
  | 'idle'
  | 'walk'
  | 'run'
  | 'jump'
  | 'attack'
  | 'celebrate'
  | 'defeat'
  | 'custom';

/**
 * Extended animation states including transitional states
 */
export type ExtendedAnimationState = AnimationState | 'transition' | 'interrupted';

/**
 * State transition direction
 */
export type TransitionDirection = 'forward' | 'backward' | 'bidirectional';

/**
 * Animation priority levels for interrupt handling
 */
export type AnimationPriority = 'low' | 'normal' | 'high' | 'critical';

// ============================================================================
// State Configuration Types
// ============================================================================

/**
 * Configuration for a single animation state
 */
export interface AnimationStateConfig {
  /** Unique state identifier */
  name: AnimationState;
  /** Human-readable display name */
  displayName: string;
  /** Animation priority level */
  priority: AnimationPriority;
  /** Whether this state can be interrupted */
  interruptible: boolean;
  /** Whether this state loops indefinitely */
  loop: boolean;
  /** Default duration in seconds (for non-looping) */
  duration: number;
  /** Default speed multiplier */
  speed: number;
  /** Amplitude of animation movement */
  amplitude: number;
  /** Blend time when entering this state */
  blendInDuration: number;
  /** Blend time when exiting this state */
  blendOutDuration: number;
  /** Framer Motion transition config */
  transition?: Transition;
  /** Spring physics config for this state */
  springConfig?: SpringOptions;
  /** Custom data for state-specific behavior */
  customData?: Record<string, unknown>;
}

/**
 * Valid transition targets from a state
 */
export interface StateTransition {
  /** Target state */
  to: AnimationState;
  /** Condition function (returns true if transition is valid) */
  condition?: (context: TransitionContext) => boolean;
  /** Blend duration for this specific transition */
  blendDuration?: number;
  /** Whether this transition is bidirectional */
  bidirectional: boolean;
  /** Easing function for the transition */
  ease?: [number, number, number, number];
}

/**
 * Context passed to transition condition functions
 */
export interface TransitionContext {
  /** Current state */
  from: AnimationState;
  /** Target state */
  to: AnimationState;
  /** Time spent in current state */
  timeInState: number;
  /** Current animation progress (0-1) */
  progress: number;
  /** Mascot-specific data */
  mascotData?: MascotStateData;
  /** User input or trigger data */
  triggerData?: unknown;
}

/**
 * Mascot-specific state data
 */
export interface MascotStateData {
  /** Mascot identifier */
  mascotId: MascotId;
  /** Current health (0-100) */
  health?: number;
  /** Energy level (0-100) */
  energy?: number;
  /** Whether mascot is grounded */
  isGrounded?: boolean;
  /** Whether mascot is in combat */
  inCombat?: boolean;
  /** Current velocity */
  velocity?: { x: number; y: number; z: number };
  /** Custom mascot-specific state */
  customState?: Record<string, unknown>;
}

// ============================================================================
// Animation Event Types
// ============================================================================

/**
 * Animation event types
 */
export type AnimationEventType =
  | 'stateEnter'
  | 'stateExit'
  | 'stateChange'
  | 'transitionStart'
  | 'transitionComplete'
  | 'animationComplete'
  | 'animationLoop'
  | 'interrupt';

/**
 * Animation event payload
 */
export interface AnimationEvent {
  /** Event type */
  type: AnimationEventType;
  /** Timestamp */
  timestamp: number;
  /** Previous state (if applicable) */
  from?: AnimationState;
  /** Current/new state (if applicable) */
  to?: AnimationState;
  /** Animation progress (0-1) */
  progress?: number;
  /** Additional event data */
  data?: Record<string, unknown>;
}

/**
 * Event handler type
 */
export type AnimationEventHandler = (event: AnimationEvent) => void;

// ============================================================================
// Blend Configuration Types
// ============================================================================

/**
 * Animation blending configuration
 */
export interface BlendConfig {
  /** Blend duration in seconds */
  duration: number;
  /** Easing function */
  ease: [number, number, number, number];
  /** Blend weight curve (0-1 over time) */
  weightCurve?: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'custom';
  /** Custom curve function (if weightCurve is 'custom') */
  customCurve?: (t: number) => number;
}

/**
 * Active blend operation
 */
export interface ActiveBlend {
  /** Source state */
  from: AnimationState;
  /** Target state */
  to: AnimationState;
  /** Blend progress (0-1) */
  progress: number;
  /** Blend configuration */
  config: BlendConfig;
  /** Start time */
  startTime: number;
  /** Whether blend is complete */
  isComplete: boolean;
}

// ============================================================================
// Three.js Integration Types
// ============================================================================

/**
 * Three.js animation mixer configuration
 */
export interface MixerConfig {
  /** Time scale for the mixer */
  timeScale: number;
  /** Whether to auto-update */
  autoUpdate: boolean;
  /** Update frequency (Hz) */
  updateFrequency: number;
}

/**
 * Animation clip mapping for Three.js
 */
export interface AnimationClipMapping {
  /** State name */
  state: AnimationState;
  /** Three.js clip name */
  clipName: string;
  /** Alternative clip names to try */
  fallbackClips?: string[];
  /** Loop mode */
  loop: 'once' | 'repeat' | 'pingpong';
  /** Whether to clamp when finished */
  clampWhenFinished: boolean;
}

// ============================================================================
// Default State Configurations
// ============================================================================

/**
 * Default configuration for all animation states
 */
export const DEFAULT_STATE_CONFIGS: Record<AnimationState, AnimationStateConfig> = {
  idle: {
    name: 'idle',
    displayName: 'Idle',
    priority: 'low',
    interruptible: true,
    loop: true,
    duration: 0,
    speed: 1,
    amplitude: 0.1,
    blendInDuration: 0.3,
    blendOutDuration: 0.3,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
  walk: {
    name: 'walk',
    displayName: 'Walk',
    priority: 'normal',
    interruptible: true,
    loop: true,
    duration: 0,
    speed: 3,
    amplitude: 0.2,
    blendInDuration: 0.2,
    blendOutDuration: 0.2,
    transition: { duration: 0.2, ease: [0.4, 0, 0.2, 1] },
  },
  run: {
    name: 'run',
    displayName: 'Run',
    priority: 'normal',
    interruptible: true,
    loop: true,
    duration: 0,
    speed: 6,
    amplitude: 0.4,
    blendInDuration: 0.15,
    blendOutDuration: 0.15,
    transition: { duration: 0.15, ease: [0.4, 0, 0.2, 1] },
  },
  jump: {
    name: 'jump',
    displayName: 'Jump',
    priority: 'high',
    interruptible: false,
    loop: false,
    duration: 0.8,
    speed: 2,
    amplitude: 1.0,
    blendInDuration: 0.1,
    blendOutDuration: 0.2,
    transition: { duration: 0.1, ease: [0.4, 0, 1, 1] },
  },
  attack: {
    name: 'attack',
    displayName: 'Attack',
    priority: 'high',
    interruptible: false,
    loop: false,
    duration: 0.5,
    speed: 4,
    amplitude: 0.6,
    blendInDuration: 0.05,
    blendOutDuration: 0.15,
    transition: { duration: 0.05, ease: [0.7, 0, 0.84, 0] },
  },
  celebrate: {
    name: 'celebrate',
    displayName: 'Celebrate',
    priority: 'normal',
    interruptible: true,
    loop: false,
    duration: 2.0,
    speed: 4,
    amplitude: 0.5,
    blendInDuration: 0.2,
    blendOutDuration: 0.3,
    transition: { duration: 0.2, ease: [0.34, 1.56, 0.64, 1] },
    springConfig: { stiffness: 300, damping: 20 },
  },
  defeat: {
    name: 'defeat',
    displayName: 'Defeat',
    priority: 'critical',
    interruptible: false,
    loop: true,
    duration: 0,
    speed: 0.5,
    amplitude: 0.05,
    blendInDuration: 0.5,
    blendOutDuration: 0.5,
    transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] },
  },
  custom: {
    name: 'custom',
    displayName: 'Custom',
    priority: 'normal',
    interruptible: true,
    loop: false,
    duration: 1.0,
    speed: 1,
    amplitude: 0.2,
    blendInDuration: 0.3,
    blendOutDuration: 0.3,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};

/**
 * Default valid transitions between states
 */
export const DEFAULT_TRANSITIONS: Record<AnimationState, StateTransition[]> = {
  idle: [
    { to: 'walk', bidirectional: true },
    { to: 'run', bidirectional: true },
    { to: 'jump', bidirectional: false },
    { to: 'attack', bidirectional: false },
    { to: 'celebrate', bidirectional: true },
    { to: 'defeat', bidirectional: false },
    { to: 'custom', bidirectional: true },
  ],
  walk: [
    { to: 'idle', bidirectional: true },
    { to: 'run', bidirectional: true },
    { to: 'jump', bidirectional: true },
    { to: 'attack', bidirectional: true },
    { to: 'defeat', bidirectional: false },
  ],
  run: [
    { to: 'idle', bidirectional: true },
    { to: 'walk', bidirectional: true },
    { to: 'jump', bidirectional: true },
    { to: 'attack', bidirectional: true },
    { to: 'defeat', bidirectional: false },
  ],
  jump: [
    { to: 'idle', bidirectional: false, condition: (ctx) => ctx.mascotData?.isGrounded ?? false },
    { to: 'walk', bidirectional: false, condition: (ctx) => ctx.mascotData?.isGrounded ?? false },
    { to: 'run', bidirectional: false, condition: (ctx) => ctx.mascotData?.isGrounded ?? false },
    { to: 'attack', bidirectional: false },
    { to: 'defeat', bidirectional: false },
  ],
  attack: [
    { to: 'idle', bidirectional: false },
    { to: 'walk', bidirectional: false },
    { to: 'run', bidirectional: false },
    { to: 'celebrate', bidirectional: false },
    { to: 'defeat', bidirectional: false },
  ],
  celebrate: [
    { to: 'idle', bidirectional: true },
    { to: 'walk', bidirectional: true },
    { to: 'custom', bidirectional: true },
  ],
  defeat: [
    { to: 'idle', bidirectional: false, condition: (ctx) => (ctx.mascotData?.health ?? 0) > 0 },
    { to: 'custom', bidirectional: true },
  ],
  custom: [
    { to: 'idle', bidirectional: true },
    { to: 'walk', bidirectional: true },
    { to: 'celebrate', bidirectional: true },
    { to: 'defeat', bidirectional: true },
  ],
};

/**
 * Priority weights for interrupt handling
 */
export const PRIORITY_WEIGHTS: Record<AnimationPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  critical: 4,
};

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Animation state machine options
 */
export interface StateMachineOptions {
  /** Initial animation state */
  initialState?: AnimationState;
  /** Default blend configuration */
  defaultBlend?: Partial<BlendConfig>;
  /** Whether to enable debug logging */
  debug?: boolean;
  /** Custom state configurations */
  stateConfigs?: Partial<Record<AnimationState, Partial<AnimationStateConfig>>>;
  /** Custom transitions */
  customTransitions?: Partial<Record<AnimationState, StateTransition[]>>;
}

/**
 * Animation state machine state
 */
export interface StateMachineState {
  /** Current animation state */
  current: AnimationState;
  /** Previous animation state */
  previous: AnimationState | null;
  /** Time spent in current state (ms) */
  timeInState: number;
  /** Current animation progress (0-1) */
  progress: number;
  /** Whether currently transitioning */
  isTransitioning: boolean;
  /** Active blend operation */
  activeBlend: ActiveBlend | null;
  /** Whether animation is paused */
  isPaused: boolean;
  /** Playback speed multiplier */
  playbackSpeed: number;
}
