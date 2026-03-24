/** [Ver001.000]
 * Animation State Machine
 * =======================
 * Core state machine for mascot character animations.
 * Provides state transitions, animation blending, and interrupt handling.
 * 
 * Features:
 * - State transitions with configurable conditions
 * - Smooth animation blending between states
 * - Priority-based interrupt handling
 * - Event system for state changes
 * - Integration with Framer Motion and Three.js
 */

import {
  type AnimationState,
  type AnimationStateConfig,
  type AnimationEvent,
  type AnimationEventHandler,
  type AnimationEventType,
  type StateTransition,
  type TransitionContext,
  type BlendConfig,
  type ActiveBlend,
  type StateMachineState,
  type StateMachineOptions,
  type MascotStateData,
  DEFAULT_STATE_CONFIGS,
  DEFAULT_TRANSITIONS,
  PRIORITY_WEIGHTS,
} from './states';

// ============================================================================
// Constants
// ============================================================================

/** Default blend configuration */
const DEFAULT_BLEND_CONFIG: BlendConfig = {
  duration: 0.3,
  ease: [0.4, 0, 0.2, 1],
  weightCurve: 'easeInOut',
};

/** Minimum time between state changes (debounce) */
const MIN_STATE_CHANGE_INTERVAL = 16; // ~1 frame at 60fps

/** Maximum blend duration */
const MAX_BLEND_DURATION = 1.0;

// ============================================================================
// Easing Functions
// ============================================================================

const EASING_FUNCTIONS: Record<string, (t: number) => number> = {
  linear: (t) => t,
  easeIn: (t) => t * t,
  easeOut: (t) => 1 - (1 - t) * (1 - t),
  easeInOut: (t) => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
};

// ============================================================================
// State Machine Class
// ============================================================================

export class AnimationStateMachine {
  private state: StateMachineState;
  private config: Record<AnimationState, AnimationStateConfig>;
  private transitions: Record<AnimationState, StateTransition[]>;
  private listeners: Map<AnimationEventType, Set<AnimationEventHandler>>;
  private lastStateChangeTime: number;
  private animationFrameId: number | null;
  private isDisposed: boolean;
  private options: Required<StateMachineOptions>;
  private customConditions: Map<string, (context: TransitionContext) => boolean>;

  constructor(options: StateMachineOptions = {}) {
    this.options = {
      initialState: 'idle',
      defaultBlend: {},
      debug: false,
      stateConfigs: {},
      customTransitions: {},
      ...options,
    };

    // Merge default configs with custom configs
    this.config = { ...DEFAULT_STATE_CONFIGS };
    for (const [state, customConfig] of Object.entries(this.options.stateConfigs)) {
      if (customConfig && state in this.config) {
        this.config[state as AnimationState] = {
          ...this.config[state as AnimationState],
          ...customConfig,
        };
      }
    }

    // Merge default transitions with custom transitions
    this.transitions = { ...DEFAULT_TRANSITIONS };
    for (const [state, customTrans] of Object.entries(this.options.customTransitions)) {
      if (customTrans && state in this.transitions) {
        this.transitions[state as AnimationState] = customTrans;
      }
    }

    // Initialize state
    this.state = {
      current: this.options.initialState,
      previous: null,
      timeInState: 0,
      progress: 0,
      isTransitioning: false,
      activeBlend: null,
      isPaused: false,
      playbackSpeed: 1,
    };

    this.listeners = new Map();
    this.lastStateChangeTime = 0;
    this.animationFrameId = null;
    this.isDisposed = false;
    this.customConditions = new Map();

    this.startUpdateLoop();
    this.log('debug', 'State machine initialized', { initialState: this.state.current });
  }

  // ============================================================================
  // Core State Management
  // ============================================================================

  /**
   * Get current state
   */
  getCurrentState(): AnimationState {
    return this.state.current;
  }

  /**
   * Get previous state
   */
  getPreviousState(): AnimationState | null {
    return this.state.previous;
  }

  /**
   * Get full state snapshot
   */
  getState(): Readonly<StateMachineState> {
    return { ...this.state };
  }

  /**
   * Get configuration for current state
   */
  getCurrentConfig(): AnimationStateConfig {
    return this.config[this.state.current];
  }

  /**
   * Get configuration for specific state
   */
  getStateConfig(state: AnimationState): AnimationStateConfig {
    return this.config[state];
  }

  // ============================================================================
  // State Transitions
  // ============================================================================

  /**
   * Attempt to transition to a new state
   * Returns true if transition was successful
   */
  transitionTo(
    targetState: AnimationState,
    options: {
      force?: boolean;
      blendDuration?: number;
      triggerData?: unknown;
      mascotData?: MascotStateData;
    } = {}
  ): boolean {
    if (this.isDisposed) {
      this.log('warn', 'Cannot transition: state machine is disposed');
      return false;
    }

    const { force = false, blendDuration, triggerData, mascotData } = options;
    const currentState = this.state.current;

    // Check for self-transition
    if (targetState === currentState) {
      if (force) {
        // Reset progress for forced self-transition
        this.state.progress = 0;
        this.state.timeInState = 0;
        this.emit('stateChange', { from: currentState, to: targetState });
        return true;
      }
      this.log('debug', 'Ignoring self-transition', { state: currentState });
      return false;
    }

    // Check debounce (skip on first transition when lastStateChangeTime is 0)
    const now = performance.now();
    if (!force && this.lastStateChangeTime > 0 && now - this.lastStateChangeTime < MIN_STATE_CHANGE_INTERVAL) {
      this.log('debug', 'State change debounced');
      return false;
    }

    // Check if transition is valid
    if (!this.canTransitionTo(targetState, triggerData, mascotData, force)) {
      this.log('debug', 'Transition not allowed', { from: currentState, to: targetState });
      return false;
    }

    // Check interrupt priority
    if (!force && !this.canInterruptCurrentState(targetState)) {
      this.log('debug', 'Current state cannot be interrupted', { 
        from: currentState, 
        to: targetState 
      });
      return false;
    }

    // Execute transition
    this.executeTransition(targetState, blendDuration, mascotData);
    this.lastStateChangeTime = now;
    return true;
  }

  /**
   * Check if transition to target state is allowed
   */
  canTransitionTo(
    targetState: AnimationState,
    triggerData?: unknown,
    mascotData?: MascotStateData,
    force?: boolean
  ): boolean {
    const currentState = this.state.current;
    const validTransitions = this.transitions[currentState];

    if (!validTransitions) {
      return false;
    }

    const transition = validTransitions.find(t => t.to === targetState);

    if (!transition) {
      // Allow force transition even if not in valid transitions
      return force === true;
    }

    // Check custom condition if present (skip if force=true)
    if (transition.condition && !force) {
      const context: TransitionContext = {
        from: currentState,
        to: targetState,
        timeInState: this.state.timeInState,
        progress: this.state.progress,
        mascotData,
        triggerData,
      };

      this.log('debug', 'Checking transition condition', { 
        from: currentState, 
        to: targetState, 
        hasMascotData: !!mascotData,
        isGrounded: mascotData?.isGrounded,
        health: mascotData?.health 
      });

      try {
        const conditionResult = transition.condition(context);
        this.log('debug', 'Condition result', { result: conditionResult });
        if (!conditionResult) {
          return false;
        }
      } catch (error) {
        this.log('error', 'Transition condition threw error', { error });
        return false;
      }
    }

    return true;
  }

  /**
   * Check if current state can be interrupted by target state
   */
  canInterruptCurrentState(targetState: AnimationState): boolean {
    const currentConfig = this.config[this.state.current];
    const targetConfig = this.config[targetState];

    // Non-interruptible states can be interrupted by equal or higher priority
    if (!currentConfig.interruptible) {
      const currentPriority = PRIORITY_WEIGHTS[currentConfig.priority];
      const targetPriority = PRIORITY_WEIGHTS[targetConfig.priority];
      return targetPriority >= currentPriority;
    }

    return true;
  }

  /**
   * Execute the actual state transition
   */
  private executeTransition(
    targetState: AnimationState,
    customBlendDuration?: number,
    mascotData?: MascotStateData
  ): void {
    const previousState = this.state.current;
    const targetConfig = this.config[targetState];

    // Calculate blend duration
    const blendDuration = customBlendDuration ??
      targetConfig.blendInDuration ??
      DEFAULT_BLEND_CONFIG.duration;

    // Create active blend
    const now = performance.now();
    const blend: ActiveBlend = {
      from: previousState,
      to: targetState,
      progress: 0,
      config: {
        ...DEFAULT_BLEND_CONFIG,
        duration: Math.min(blendDuration, MAX_BLEND_DURATION),
      },
      startTime: now,
      isComplete: false,
    };

    // Update state
    this.state.previous = previousState;
    this.state.current = targetState;
    this.state.timeInState = 0;
    this.state.progress = 0;
    this.state.isTransitioning = true;
    this.state.activeBlend = blend;

    // Emit events
    this.emit('stateExit', { from: previousState, progress: 1 });
    this.emit('transitionStart', { from: previousState, to: targetState });
    this.emit('stateEnter', { to: targetState, progress: 0 });
    this.emit('stateChange', { from: previousState, to: targetState });

    this.log('debug', 'State transition executed', {
      from: previousState,
      to: targetState,
      blendDuration,
    });
  }

  // ============================================================================
  // Animation Control
  // ============================================================================

  /**
   * Pause animation updates
   */
  pause(): void {
    this.state.isPaused = true;
    this.log('debug', 'Animation paused');
  }

  /**
   * Resume animation updates
   */
  resume(): void {
    this.state.isPaused = false;
    this.log('debug', 'Animation resumed');
  }

  /**
   * Set playback speed multiplier
   */
  setPlaybackSpeed(speed: number): void {
    this.state.playbackSpeed = Math.max(0, speed);
    this.log('debug', 'Playback speed changed', { speed });
  }

  /**
   * Reset to initial state
   */
  reset(): void {
    this.state.previous = null;
    this.state.current = this.options.initialState;
    this.state.timeInState = 0;
    this.state.progress = 0;
    this.state.isTransitioning = false;
    this.state.activeBlend = null;
    this.state.isPaused = false;
    this.state.playbackSpeed = 1;

    this.emit('stateChange', { to: this.options.initialState });
    this.log('debug', 'State machine reset');
  }

  // ============================================================================
  // Event System
  // ============================================================================

  /**
   * Subscribe to animation events
   */
  on(event: AnimationEventType, handler: AnimationEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  /**
   * Subscribe to state changes specifically
   */
  onStateChange(handler: (from: AnimationState | null, to: AnimationState) => void): () => void {
    return this.on('stateChange', (event) => {
      handler(event.from as AnimationState | null, event.to as AnimationState);
    });
  }

  /**
   * Emit an animation event
   */
  private emit(type: AnimationEventType, data: Partial<AnimationEvent> = {}): void {
    const event: AnimationEvent = {
      type,
      timestamp: performance.now(),
      ...data,
    };

    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          this.log('error', 'Event handler threw error', { error, type });
        }
      });
    }

    // Also emit to wildcard listeners
    const wildcards = this.listeners.get('stateChange');
    if (wildcards && type !== 'stateChange') {
      wildcards.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          this.log('error', 'Wildcard handler threw error', { error, type });
        }
      });
    }
  }

  // ============================================================================
  // Update Loop
  // ============================================================================

  /**
   * Start the update loop
   */
  private startUpdateLoop(): void {
    let lastTime = performance.now();

    const update = (currentTime: number) => {
      if (this.isDisposed) return;

      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (!this.state.isPaused) {
        this.update(deltaTime);
      }

      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  /**
   * Update state machine
   */
  private update(deltaTime: number): void {
    const scaledDelta = deltaTime * this.state.playbackSpeed;

    // Update time in state
    this.state.timeInState += scaledDelta * 1000;

    // Update blend progress
    if (this.state.activeBlend && !this.state.activeBlend.isComplete) {
      const blend = this.state.activeBlend;
      const elapsed = this.state.timeInState - (blend.startTime - performance.now() + this.state.timeInState);
      const rawProgress = Math.min(elapsed / (blend.config.duration * 1000), 1);

      // Apply easing
      const easeFunc = EASING_FUNCTIONS[blend.config.weightCurve ?? 'easeInOut'];
      blend.progress = easeFunc ? easeFunc(rawProgress) : rawProgress;

      if (rawProgress >= 1) {
        blend.isComplete = true;
        this.state.isTransitioning = false;
        this.emit('transitionComplete', { from: blend.from, to: blend.to });
      }
    }

    // Update animation progress
    const currentConfig = this.config[this.state.current];
    if (!currentConfig.loop && currentConfig.duration > 0) {
      this.state.progress = Math.min(this.state.timeInState / (currentConfig.duration * 1000), 1);

      if (this.state.progress >= 1) {
        this.emit('animationComplete', { to: this.state.current, progress: 1 });
      }
    } else {
      // For looping animations, progress cycles 0-1
      this.state.progress = (this.state.timeInState % (currentConfig.duration * 1000)) / (currentConfig.duration * 1000);
      if (currentConfig.duration === 0) {
        this.state.progress = (this.state.timeInState / 1000) % 1;
      }

      // Emit loop event on cycle completion
      const cyclePosition = this.state.timeInState % (currentConfig.duration * 1000 || 1000);
      if (cyclePosition < scaledDelta * 1000) {
        this.emit('animationLoop', { to: this.state.current });
      }
    }
  }

  // ============================================================================
  // Blend Operations
  // ============================================================================

  /**
   * Get current blend weight (0 = fully from state, 1 = fully to state)
   */
  getBlendWeight(): number {
    if (!this.state.activeBlend || this.state.activeBlend.isComplete) {
      return 1;
    }
    return this.state.activeBlend.progress;
  }

  /**
   * Check if currently blending between states
   */
  isBlending(): boolean {
    return this.state.isTransitioning && !!this.state.activeBlend && !this.state.activeBlend.isComplete;
  }

  /**
   * Force complete current blend
   */
  completeBlend(): void {
    if (this.state.activeBlend) {
      this.state.activeBlend.isComplete = true;
      this.state.activeBlend.progress = 1;
      this.state.isTransitioning = false;
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Register a custom transition condition
   */
  registerCondition(name: string, condition: (context: TransitionContext) => boolean): void {
    this.customConditions.set(name, condition);
  }

  /**
   * Get valid transition targets from current state
   */
  getValidTransitions(): AnimationState[] {
    return this.transitions[this.state.current]?.map(t => t.to) ?? [];
  }

  /**
   * Check if target state is a valid transition from current state
   */
  isValidTransition(targetState: AnimationState): boolean {
    return this.transitions[this.state.current]?.some(t => t.to === targetState) ?? false;
  }

  /**
   * Get time spent in current state (seconds)
   */
  getTimeInState(): number {
    return this.state.timeInState / 1000;
  }

  /**
   * Get current animation progress (0-1)
   */
  getProgress(): number {
    return this.state.progress;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  /**
   * Dispose of the state machine and clean up resources
   */
  dispose(): void {
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.listeners.clear();
    this.customConditions.clear();

    this.log('debug', 'State machine disposed');
  }

  // ============================================================================
  // Debug Logging
  // ============================================================================

  private log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (!this.options.debug && level === 'debug') return;

    const prefix = '[AnimationStateMachine]';
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
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a new animation state machine
 */
export function createAnimationStateMachine(options?: StateMachineOptions): AnimationStateMachine {
  return new AnimationStateMachine(options);
}

// ============================================================================
// Exports
// ============================================================================

export { AnimationStateMachine as default };
export type { StateMachineState, TransitionContext };
