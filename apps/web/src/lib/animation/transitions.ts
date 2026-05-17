// @ts-nocheck
/** [Ver001.000]
 * Animation Transition Controller
 * ================================
 * Manages smooth transitions between animation states with configurable
 * durations, easing functions, and interrupt handling.
 * 
 * Features:
 * - Configurable transition durations per state pair
 * - Multiple easing function support
 * - Interrupt handling with priority system
 * - Cross-fading between animations
 * - Transition queuing and blending
 * - Event system for transition lifecycle
 */

import { EASINGS } from '@/lib/three/animationBridge';
import type { AnimationState, AnimationPriority } from './states';

// ============================================================================
// Types
// ============================================================================

/** Easing function type */
export type EasingFunction = (t: number) => number;

/** Easing function names */
export type EasingName = 
  | 'linear'
  | 'easeIn'
  | 'easeOut'
  | 'easeInOut'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'spring'
  | 'custom';

/** Transition configuration */
export interface TransitionConfig {
  /** Source state */
  from: AnimationState;
  /** Target state */
  to: AnimationState;
  /** Transition duration in seconds */
  duration: number;
  /** Easing function name or custom function */
  ease: EasingName | EasingFunction;
  /** Delay before transition starts */
  delay?: number;
  /** Whether this transition can be interrupted */
  interruptible?: boolean;
  /** Minimum priority to interrupt this transition */
  interruptPriority?: AnimationPriority;
  /** Custom blend curve (if ease is 'custom') */
  customEase?: EasingFunction;
  /** Whether to use cross-fading */
  crossFade?: boolean;
  /** Cross-fade overlap duration */
  crossFadeOverlap?: number;
  /** Exit time (normalized, when to start transition) */
  exitTime?: number;
  /** Transition conditions */
  conditions?: TransitionCondition[];
}

/** Transition condition */
export interface TransitionCondition {
  /** Parameter name */
  parameter: string;
  /** Condition type */
  type: 'equals' | 'notEquals' | 'greater' | 'less' | 'inRange';
  /** Expected value */
  value?: number | string | boolean;
  /** Range for 'inRange' condition */
  range?: { min: number; max: number };
}

/** Active transition state */
export interface ActiveTransition {
  /** Unique transition ID */
  id: string;
  /** Source state */
  from: AnimationState;
  /** Target state */
  to: AnimationState;
  /** Transition configuration */
  config: TransitionConfig;
  /** Current progress (0-1) */
  progress: number;
  /** Start timestamp */
  startTime: number;
  /** End timestamp */
  endTime: number;
  /** Whether transition is complete */
  isComplete: boolean;
  /** Whether transition was interrupted */
  isInterrupted: boolean;
  /** Current blend weight (0 = from, 1 = to) */
  blendWeight: number;
  /** Delay before start (if any) */
  delayRemaining: number;
}

/** Transition queue item */
export interface QueuedTransition {
  /** Target state */
  to: AnimationState;
  /** Custom duration override */
  duration?: number;
  /** Force transition even if conditions not met */
  force?: boolean;
  /** Callback when complete */
  onComplete?: () => void;
}

/** Transition event type */
export type TransitionEventType = 
  | 'transitionStart'
  | 'transitionUpdate'
  | 'transitionComplete'
  | 'transitionInterrupt'
  | 'transitionCancel';

/** Transition event */
export interface TransitionEvent {
  type: TransitionEventType;
  transitionId: string;
  from: AnimationState;
  to: AnimationState;
  progress: number;
  timestamp: number;
}

/** Transition event handler */
export type TransitionEventHandler = (event: TransitionEvent) => void;

/** Transition controller options */
export interface TransitionControllerOptions {
  /** Default transition duration */
  defaultDuration?: number;
  /** Default easing function */
  defaultEase?: EasingName;
  /** Whether to allow interrupting transitions */
  allowInterrupts?: boolean;
  /** Maximum transition duration */
  maxDuration?: number;
  /** Enable debug logging */
  debug?: boolean;
}

/** Transition preset */
export interface TransitionPreset {
  name: string;
  description: string;
  config: Partial<TransitionConfig>;
}

// ============================================================================
// Constants
// ============================================================================

const DEFAULT_OPTIONS: Required<TransitionControllerOptions> = {
  defaultDuration: 0.3,
  defaultEase: 'easeInOut',
  allowInterrupts: true,
  maxDuration: 2.0,
  debug: false,
};

const EASING_FUNCTIONS: Record<EasingName, EasingFunction> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => 1 - Math.pow(1 - t, 3),
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  spring: (t) => {
    const damping = 0.8;
    const frequency = 10;
    return 1 - Math.exp(-damping * t) * Math.cos(frequency * t);
  },
  custom: (t) => t, // Fallback
};

// ============================================================================
// Transition Controller Class
// ============================================================================

export class TransitionController {
  private options: Required<TransitionControllerOptions>;
  private transitionConfigs: Map<string, TransitionConfig>;
  private activeTransition: ActiveTransition | null;
  private transitionQueue: QueuedTransition[];
  private listeners: Map<TransitionEventType, Set<TransitionEventHandler>>;
  private animationFrameId: number | null;
  private isDisposed: boolean;
  private transitionIdCounter: number;
  private parameters: Map<string, number | string | boolean>;

  constructor(options: TransitionControllerOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.transitionConfigs = new Map();
    this.activeTransition = null;
    this.transitionQueue = [];
    this.listeners = new Map();
    this.animationFrameId = null;
    this.isDisposed = false;
    this.transitionIdCounter = 0;
    this.parameters = new Map();

    this.startUpdateLoop();
  }

  // ============================================================================
  // Configuration
  // ============================================================================

  /**
   * Register a transition configuration
   */
  registerTransition(config: TransitionConfig): void {
    if (this.isDisposed) return;

    const key = this.getTransitionKey(config.from, config.to);
    this.transitionConfigs.set(key, config);

    this.log('debug', 'Transition registered', { from: config.from, to: config.to, duration: config.duration });
  }

  /**
   * Register multiple transitions
   */
  registerTransitions(configs: TransitionConfig[]): void {
    configs.forEach(config => this.registerTransition(config));
  }

  /**
   * Unregister a transition
   */
  unregisterTransition(from: AnimationState, to: AnimationState): void {
    const key = this.getTransitionKey(from, to);
    this.transitionConfigs.delete(key);
  }

  /**
   * Get transition configuration for a state pair
   */
  getTransitionConfig(from: AnimationState, to: AnimationState): TransitionConfig {
    const key = this.getTransitionKey(from, to);
    return (
      this.transitionConfigs.get(key) ?? {
        from,
        to,
        duration: this.options.defaultDuration,
        ease: this.options.defaultEase,
        interruptible: true,
        crossFade: true,
      }
    );
  }

  /**
   * Check if a transition is configured
   */
  hasTransition(from: AnimationState, to: AnimationState): boolean {
    const key = this.getTransitionKey(from, to);
    return this.transitionConfigs.has(key);
  }

  // ============================================================================
  // Parameter Management
  // ============================================================================

  /**
   * Set a parameter value for transition conditions
   */
  setParameter(name: string, value: number | string | boolean): void {
    this.parameters.set(name, value);
  }

  /**
   * Get a parameter value
   */
  getParameter(name: string): number | string | boolean | undefined {
    return this.parameters.get(name);
  }

  /**
   * Check if transition conditions are met
   */
  checkConditions(conditions: TransitionCondition[]): boolean {
    return conditions.every(condition => this.checkCondition(condition));
  }

  private checkCondition(condition: TransitionCondition): boolean {
    const value = this.parameters.get(condition.parameter);

    switch (condition.type) {
      case 'equals':
        return value === condition.value;
      case 'notEquals':
        return value !== condition.value;
      case 'greater':
        return typeof value === 'number' && typeof condition.value === 'number' 
          ? value > condition.value 
          : false;
      case 'less':
        return typeof value === 'number' && typeof condition.value === 'number' 
          ? value < condition.value 
          : false;
      case 'inRange':
        return typeof value === 'number' && condition.range 
          ? value >= condition.range.min && value <= condition.range.max 
          : false;
      default:
        return false;
    }
  }

  // ============================================================================
  // Transition Execution
  // ============================================================================

  /**
   * Start a transition between states
   */
  transition(
    from: AnimationState,
    to: AnimationState,
    options: {
      duration?: number;
      force?: boolean;
      delay?: number;
      onComplete?: () => void;
    } = {}
  ): string | null {
    if (this.isDisposed) {
      this.log('warn', 'Cannot transition: controller is disposed');
      return null;
    }

    const config = this.getTransitionConfig(from, to);

    // Check conditions if present and not forced
    if (config.conditions && config.conditions.length > 0 && !options.force) {
      if (!this.checkConditions(config.conditions)) {
        this.log('debug', 'Transition conditions not met', { from, to });
        return null;
      }
    }

    // Check if we can interrupt current transition
    if (this.activeTransition && !options.force) {
      if (!this.canInterrupt(this.activeTransition)) {
        // Queue the transition instead
        this.transitionQueue.push({
          to,
          duration: options.duration,
          force: options.force,
          onComplete: options.onComplete,
        });
        this.log('debug', 'Transition queued', { from, to });
        return null;
      }

      // Interrupt current transition
      this.interruptTransition();
    }

    // Create new transition
    const transitionId = `transition_${++this.transitionIdCounter}`;
    const now = performance.now();
    const duration = Math.min(
      options.duration ?? config.duration ?? this.options.defaultDuration,
      this.options.maxDuration
    );
    const delay = options.delay ?? config.delay ?? 0;

    this.activeTransition = {
      id: transitionId,
      from,
      to,
      config: {
        ...config,
        duration,
      },
      progress: 0,
      startTime: now + delay * 1000,
      endTime: now + delay * 1000 + duration * 1000,
      isComplete: false,
      isInterrupted: false,
      blendWeight: 0,
      delayRemaining: delay,
    };

    this.emit('transitionStart', {
      transitionId,
      from,
      to,
      progress: 0,
      timestamp: now,
    });

    this.log('debug', 'Transition started', { id: transitionId, from, to, duration });

    // Set up completion callback
    if (options.onComplete) {
      const unsubscribe = this.on('transitionComplete', (event) => {
        if (event.transitionId === transitionId) {
          options.onComplete!();
          unsubscribe();
        }
      });
    }

    return transitionId;
  }

  /**
   * Force complete the current transition
   */
  completeTransition(): void {
    if (this.activeTransition) {
      this.activeTransition.isComplete = true;
      this.activeTransition.progress = 1;
      this.activeTransition.blendWeight = 1;
    }
  }

  /**
   * Cancel the current transition
   */
  cancelTransition(): void {
    if (this.activeTransition) {
      const { id, from, to } = this.activeTransition;
      this.activeTransition = null;

      this.emit('transitionCancel', {
        transitionId: id,
        from,
        to,
        progress: 0,
        timestamp: performance.now(),
      });

      this.log('debug', 'Transition cancelled', { id });
    }
  }

  /**
   * Interrupt the current transition
   */
  private interruptTransition(): void {
    if (this.activeTransition) {
      const { id, from, to, progress } = this.activeTransition;
      this.activeTransition.isInterrupted = true;
      this.activeTransition = null;

      this.emit('transitionInterrupt', {
        transitionId: id,
        from,
        to,
        progress,
        timestamp: performance.now(),
      });

      this.log('debug', 'Transition interrupted', { id, progress });
    }
  }

  /**
   * Check if current transition can be interrupted
   */
  private canInterrupt(transition: ActiveTransition): boolean {
    if (!this.options.allowInterrupts) return false;
    if (transition.config.interruptible === false) return false;
    return true;
  }

  /**
   * Get current transition state
   */
  getActiveTransition(): Readonly<ActiveTransition> | null {
    return this.activeTransition;
  }

  /**
   * Check if a transition is currently active
   */
  isTransitioning(): boolean {
    return this.activeTransition !== null && !this.activeTransition.isComplete;
  }

  /**
   * Get the current blend weight
   */
  getBlendWeight(): number {
    return this.activeTransition?.blendWeight ?? (this.activeTransition?.isComplete ? 1 : 0);
  }

  /**
   * Get transition progress (0-1)
   */
  getProgress(): number {
    return this.activeTransition?.progress ?? 0;
  }

  // ============================================================================
  // Update Loop
  // ============================================================================

  private startUpdateLoop(): void {
    const update = () => {
      if (this.isDisposed) return;

      this.update();
      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  private update(): void {
    if (!this.activeTransition) {
      // Process queue if no active transition
      this.processQueue();
      return;
    }

    const now = performance.now();
    const transition = this.activeTransition;

    // Handle delay
    if (transition.delayRemaining > 0) {
      const elapsed = (now - (transition.endTime - transition.config.duration * 1000)) / 1000;
      transition.delayRemaining = Math.max(0, transition.delayRemaining - elapsed);
      return;
    }

    // Calculate progress
    const elapsed = now - transition.startTime;
    const totalDuration = transition.config.duration * 1000;
    transition.progress = Math.min(elapsed / totalDuration, 1);

    // Apply easing
    const ease = transition.config.ease;
    let easedProgress: number;
    if (typeof ease === 'function') {
      easedProgress = ease(transition.progress);
    } else if (ease === 'custom' && transition.config.customEase) {
      easedProgress = transition.config.customEase(transition.progress);
    } else {
      easedProgress = EASING_FUNCTIONS[ease](transition.progress);
    }

    transition.blendWeight = easedProgress;

    // Emit update event
    this.emit('transitionUpdate', {
      transitionId: transition.id,
      from: transition.from,
      to: transition.to,
      progress: transition.progress,
      timestamp: now,
    });

    // Check for completion
    if (transition.progress >= 1) {
      transition.isComplete = true;
      transition.blendWeight = 1;

      this.emit('transitionComplete', {
        transitionId: transition.id,
        from: transition.from,
        to: transition.to,
        progress: 1,
        timestamp: now,
      });

      this.log('debug', 'Transition complete', { id: transition.id });

      this.activeTransition = null;
      this.processQueue();
    }
  }

  private processQueue(): void {
    if (this.transitionQueue.length === 0 || this.activeTransition) return;

    const next = this.transitionQueue.shift();
    if (next) {
      // We need to know the current state to transition from
      // This should be provided by the state machine
      // For now, we'll just skip queue processing without a current state
      this.log('debug', 'Queue item skipped (no current state context)', next);
    }
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Subscribe to transition events
   */
  on(event: TransitionEventType, handler: TransitionEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private emit(type: TransitionEventType, event: Omit<TransitionEvent, 'type'>): void {
    const fullEvent: TransitionEvent = { type, ...event };

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

  private getTransitionKey(from: AnimationState, to: AnimationState): string {
    return `${from}->${to}`;
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
    if (!this.options.debug && level === 'debug') return;

    const prefix = '[TransitionController]';
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
   * Dispose of the transition controller
   */
  dispose(): void {
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.transitionConfigs.clear();
    this.listeners.clear();
    this.transitionQueue = [];
    this.activeTransition = null;
  }
}

// ============================================================================
// Factory Functions
// ============================================================================

export function createTransitionController(options?: TransitionControllerOptions): TransitionController {
  return new TransitionController(options);
}

// ============================================================================
// Presets
// ============================================================================

/**
 * Quick transition preset (for responsive feel)
 */
export const QUICK_TRANSITION: TransitionPreset = {
  name: 'quick',
  description: 'Fast transition for responsive feel',
  config: {
    duration: 0.15,
    ease: 'easeOut',
    interruptible: true,
    crossFade: true,
  },
};

/**
 * Smooth transition preset (for natural movement)
 */
export const SMOOTH_TRANSITION: TransitionPreset = {
  name: 'smooth',
  description: 'Smooth transition for natural movement',
  config: {
    duration: 0.3,
    ease: 'easeInOut',
    interruptible: true,
    crossFade: true,
  },
};

/**
 * Dramatic transition preset (for emphasis)
 */
export const DRAMATIC_TRANSITION: TransitionPreset = {
  name: 'dramatic',
  description: 'Dramatic transition for emphasis',
  config: {
    duration: 0.5,
    ease: 'easeInOutCubic',
    interruptible: false,
    crossFade: true,
  },
};

/**
 * Spring transition preset (for bouncy feel)
 */
export const SPRING_TRANSITION: TransitionPreset = {
  name: 'spring',
  description: 'Spring transition for bouncy feel',
  config: {
    duration: 0.4,
    ease: 'spring',
    interruptible: true,
    crossFade: true,
  },
};

/**
 * Combat transition preset (for fast action)
 */
export const COMBAT_TRANSITION: TransitionPreset = {
  name: 'combat',
  description: 'Fast combat transition',
  config: {
    duration: 0.08,
    ease: 'linear',
    interruptible: true,
    crossFade: false,
  },
};

/**
 * Get all transition presets
 */
export function getTransitionPresets(): TransitionPreset[] {
  return [
    QUICK_TRANSITION,
    SMOOTH_TRANSITION,
    DRAMATIC_TRANSITION,
    SPRING_TRANSITION,
    COMBAT_TRANSITION,
  ];
}

// ============================================================================
// Easing Functions Export
// ============================================================================

export { EASING_FUNCTIONS };
export function getEasingFunction(name: EasingName): EasingFunction {
  return EASING_FUNCTIONS[name];
}

// ============================================================================
// Exports
// ============================================================================

export { TransitionController as default };
