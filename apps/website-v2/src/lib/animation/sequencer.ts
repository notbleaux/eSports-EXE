/** [Ver001.000]
 * Animation Sequencer
 * ===================
 * Chain multiple animations with queue management, timing control,
 * and support for loops and one-shot animations.
 * 
 * Features:
 * - Chain animations in sequence
 * - Parallel animation execution
 * - Loop and repeat support
 * - Conditional branching
 * - Time-based triggers
 * - Integration with AnimationStateMachine
 */

import {
  type AnimationState,
  type AnimationEventHandler,
  type AnimationPriority,
  PRIORITY_WEIGHTS,
} from './states';
import type { AnimationStateMachine } from './stateMachine';

// ============================================================================
// Types
// ============================================================================

/**
 * Animation step types
 */
export type AnimationStepType = 
  | 'state'
  | 'wait'
  | 'parallel'
  | 'branch'
  | 'loop'
  | 'callback'
  | 'label'
  | 'goto';

/**
 * Base animation step interface
 */
export interface BaseAnimationStep {
  /** Step type */
  type: AnimationStepType;
  /** Step identifier */
  id?: string;
  /** Step label for goto references */
  label?: string;
}

/**
 * State animation step
 */
export interface StateAnimationStep extends BaseAnimationStep {
  type: 'state';
  /** Target animation state */
  state: AnimationState;
  /** Duration to hold state (0 = use state default) */
  duration?: number;
  /** Speed multiplier */
  speed?: number;
  /** Whether to wait for state completion */
  waitForComplete?: boolean;
  /** Blend duration override */
  blendDuration?: number;
  /** Condition to execute this step */
  condition?: () => boolean;
}

/**
 * Wait step
 */
export interface WaitAnimationStep extends BaseAnimationStep {
  type: 'wait';
  /** Duration to wait (ms) */
  duration: number;
  /** Or wait for a condition */
  condition?: () => boolean;
  /** Timeout for condition wait */
  timeout?: number;
}

/**
 * Parallel animation step
 */
export interface ParallelAnimationStep extends BaseAnimationStep {
  type: 'parallel';
  /** Steps to execute in parallel */
  steps: AnimationStep[];
  /** Wait for all to complete */
  waitForAll?: boolean;
  /** Wait for any to complete */
  waitForAny?: boolean;
}

/**
 * Branch/conditional step
 */
export interface BranchAnimationStep extends BaseAnimationStep {
  type: 'branch';
  /** Condition to evaluate */
  condition: () => boolean;
  /** Steps if condition is true */
  then: AnimationStep[];
  /** Steps if condition is false */
  else?: AnimationStep[];
}

/**
 * Loop step
 */
export interface LoopAnimationStep extends BaseAnimationStep {
  type: 'loop';
  /** Number of iterations (undefined = infinite) */
  count?: number;
  /** Steps to loop */
  steps: AnimationStep[];
  /** Loop condition (takes precedence over count) */
  while?: () => boolean;
  /** Max iterations safeguard */
  maxIterations?: number;
}

/**
 * Callback step
 */
export interface CallbackAnimationStep extends BaseAnimationStep {
  type: 'callback';
  /** Callback function to execute */
  callback: () => void | Promise<void>;
  /** Wait for async callback */
  waitForComplete?: boolean;
  /** Timeout for async operation */
  timeout?: number;
}

/**
 * Label step (for goto references)
 */
export interface LabelAnimationStep extends BaseAnimationStep {
  type: 'label';
  /** Label name */
  name: string;
}

/**
 * Goto step (jump to label)
 */
export interface GotoAnimationStep extends BaseAnimationStep {
  type: 'goto';
  /** Label to jump to */
  label: string;
  /** Condition for jump */
  condition?: () => boolean;
  /** Max jumps safeguard */
  maxJumps?: number;
}

/**
 * Union type for all animation steps
 */
export type AnimationStep =
  | StateAnimationStep
  | WaitAnimationStep
  | ParallelAnimationStep
  | BranchAnimationStep
  | LoopAnimationStep
  | CallbackAnimationStep
  | LabelAnimationStep
  | GotoAnimationStep;

/**
 * Animation sequence configuration
 */
export interface AnimationSequence {
  /** Sequence identifier */
  id: string;
  /** Sequence name */
  name?: string;
  /** Animation steps */
  steps: AnimationStep[];
  /** Whether to loop the entire sequence */
  loop?: boolean;
  /** Priority level */
  priority?: AnimationPriority;
  /** Auto-start on creation */
  autoStart?: boolean;
  /** Callback when sequence completes */
  onComplete?: () => void;
  /** Callback on error */
  onError?: (error: Error) => void;
}

/**
 * Sequencer event types
 */
export type SequencerEventType =
  | 'start'
  | 'stepStart'
  | 'stepComplete'
  | 'stateChange'
  | 'wait'
  | 'complete'
  | 'error'
  | 'pause'
  | 'resume'
  | 'stop';

/**
 * Sequencer event
 */
export interface SequencerEvent {
  type: SequencerEventType;
  sequenceId: string;
  timestamp: number;
  stepIndex?: number;
  step?: AnimationStep;
  error?: Error;
}

/**
 * Sequencer event handler
 */
export type SequencerEventHandler = (event: SequencerEvent) => void;

/**
 * Sequencer state
 */
export interface SequencerState {
  /** Whether sequencer is running */
  isRunning: boolean;
  /** Whether sequencer is paused */
  isPaused: boolean;
  /** Current step index */
  currentStep: number;
  /** Total steps */
  totalSteps: number;
  /** Whether sequence is complete */
  isComplete: boolean;
  /** Current loop iteration (if in loop) */
  loopIteration: number;
  /** Jump count (for goto safeguard) */
  jumpCount: number;
  /** Step start time */
  stepStartTime: number;
}

/**
 * Queue item
 */
interface QueueItem {
  sequence: AnimationSequence;
  stateMachine: AnimationStateMachine;
  resolve: (value: boolean) => void;
  reject: (error: Error) => void;
}

// ============================================================================
// Animation Sequencer Class
// ============================================================================

export class AnimationSequencer {
  private sequences: Map<string, AnimationSequence>;
  private listeners: Map<SequencerEventType, Set<SequencerEventHandler>>;
  private queue: QueueItem[];
  private currentSequence: AnimationSequence | null;
  private currentStateMachine: AnimationStateMachine | null;
  private state: SequencerState;
  private stepStack: { stepIndex: number; iteration: number }[];
  private labels: Map<string, number>;
  private animationFrameId: number | null;
  private isDisposed: boolean;
  private debug: boolean;

  constructor(debug = false) {
    this.sequences = new Map();
    this.listeners = new Map();
    this.queue = [];
    this.currentSequence = null;
    this.currentStateMachine = null;
    this.state = {
      isRunning: false,
      isPaused: false,
      currentStep: 0,
      totalSteps: 0,
      isComplete: false,
      loopIteration: 0,
      jumpCount: 0,
      stepStartTime: 0,
    };
    this.stepStack = [];
    this.labels = new Map();
    this.animationFrameId = null;
    this.isDisposed = false;
    this.debug = debug;

    this.startUpdateLoop();
  }

  // ============================================================================
  // Sequence Registration
  // ============================================================================

  /**
   * Register an animation sequence
   */
  registerSequence(sequence: AnimationSequence): void {
    if (this.isDisposed) {
      throw new Error('Sequencer is disposed');
    }

    this.sequences.set(sequence.id, sequence);
    this.log('debug', 'Sequence registered', { id: sequence.id });

    // Build label map
    sequence.steps.forEach((step, index) => {
      if (step.type === 'label' && 'name' in step) {
        this.labels.set(`${sequence.id}:${step.name}`, index);
      }
      if (step.label) {
        this.labels.set(`${sequence.id}:${step.label}`, index);
      }
    });

    // Note: autoStart sequences need a stateMachine to be passed during registration
    // This will be handled when the sequence is retrieved from the queue
    if (sequence.autoStart) {
      this.log('debug', 'Sequence registered with autoStart (requires stateMachine)', { id: sequence.id });
    }
  }

  /**
   * Unregister a sequence
   */
  unregisterSequence(sequenceId: string): void {
    // Remove labels for this sequence
    const keysToDelete: string[] = [];
    this.labels.forEach((value, key) => {
      if (key.startsWith(`${sequenceId}:`)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.labels.delete(key));

    this.sequences.delete(sequenceId);
    this.log('debug', 'Sequence unregistered', { id: sequenceId });
  }

  // ============================================================================
  // Playback Control
  // ============================================================================

  /**
   * Play a registered sequence
   */
  play(
    sequenceId: string,
    stateMachine: AnimationStateMachine
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      const sequence = this.sequences.get(sequenceId);

      if (!sequence) {
        reject(new Error(`Sequence not found: ${sequenceId}`));
        return;
      }

      // Add to queue
      this.queue.push({ sequence, stateMachine, resolve, reject });
      this.log('debug', 'Sequence queued', { id: sequenceId });

      // Try to start immediately if not running
      this.processQueue();
    });
  }

  /**
   * Play a sequence directly (without registration)
   */
  playImmediate(
    sequence: AnimationSequence,
    stateMachine: AnimationStateMachine
  ): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Register temporarily
      this.registerSequence(sequence);

      // Play and clean up after
      this.play(sequence.id, stateMachine)
        .then((result) => {
          this.unregisterSequence(sequence.id);
          resolve(result);
        })
        .catch((error) => {
          this.unregisterSequence(sequence.id);
          reject(error);
        });
    });
  }

  /**
   * Pause current sequence
   */
  pause(): void {
    if (this.state.isRunning && !this.state.isPaused) {
      this.state.isPaused = true;
      this.emit('pause', {});
      this.log('debug', 'Sequence paused');
    }
  }

  /**
   * Resume current sequence
   */
  resume(): void {
    if (this.state.isRunning && this.state.isPaused) {
      this.state.isPaused = false;
      this.emit('resume', {});
      this.log('debug', 'Sequence resumed');
    }
  }

  /**
   * Stop current sequence
   */
  stop(): void {
    if (this.state.isRunning) {
      this.state.isRunning = false;
      this.state.isPaused = false;
      this.emit('stop', {});
      this.log('debug', 'Sequence stopped');

      // Clear current sequence
      this.currentSequence = null;
      this.currentStateMachine = null;

      // Process next in queue
      this.processQueue();
    }
  }

  /**
   * Skip to next step
   */
  skip(): void {
    if (this.state.isRunning && !this.state.isPaused) {
      this.state.currentStep++;
      this.log('debug', 'Step skipped', { newIndex: this.state.currentStep });
    }
  }

  /**
   * Jump to specific step
   */
  jumpTo(stepIndex: number): void {
    if (this.state.isRunning && !this.state.isPaused) {
      if (this.currentSequence && stepIndex >= 0 && stepIndex < this.currentSequence.steps.length) {
        this.state.currentStep = stepIndex;
        this.log('debug', 'Jumped to step', { index: stepIndex });
      }
    }
  }

  // ============================================================================
  // Queue Management
  // ============================================================================

  /**
   * Process the queue
   */
  private processQueue(): void {
    if (this.state.isRunning || this.queue.length === 0 || this.isDisposed) {
      return;
    }

    const item = this.queue.shift();
    if (!item) return;

    this.startSequence(item.sequence, item.stateMachine, item.resolve, item.reject);
  }

  /**
   * Start a sequence
   */
  private startSequence(
    sequence: AnimationSequence,
    stateMachine: AnimationStateMachine,
    resolve: (value: boolean) => void,
    reject: (error: Error) => void
  ): void {
    this.currentSequence = sequence;
    this.currentStateMachine = stateMachine;
    this.state = {
      isRunning: true,
      isPaused: false,
      currentStep: 0,
      totalSteps: sequence.steps.length,
      isComplete: false,
      loopIteration: 0,
      jumpCount: 0,
      stepStartTime: performance.now(),
    };
    this.stepStack = [];

    this.emit('start', { sequenceId: sequence.id });
    this.log('debug', 'Sequence started', { id: sequence.id });

    // Set up completion handler
    const checkComplete = () => {
      if (this.state.isComplete) {
        resolve(true);
        this.processQueue();
      } else if (!this.state.isRunning) {
        resolve(false);
        this.processQueue();
      } else {
        requestAnimationFrame(checkComplete);
      }
    };

    checkComplete();
  }

  // ============================================================================
  // Update Loop
  // ============================================================================

  private startUpdateLoop(): void {
    const update = () => {
      if (this.isDisposed) return;

      if (this.state.isRunning && !this.state.isPaused) {
        this.update();
      }

      this.animationFrameId = requestAnimationFrame(update);
    };

    this.animationFrameId = requestAnimationFrame(update);
  }

  private update(): void {
    if (!this.currentSequence || !this.currentStateMachine) return;

    const { steps } = this.currentSequence;
    const currentStepIndex = this.state.currentStep;

    // Check if sequence is complete
    if (currentStepIndex >= steps.length) {
      if (this.currentSequence.loop) {
        // Restart loop
        this.state.currentStep = 0;
        this.state.loopIteration++;
        this.log('debug', 'Sequence loop restarted', { iteration: this.state.loopIteration });
        return;
      }

      // Complete sequence
      this.completeSequence();
      return;
    }

    // Execute current step
    const step = steps[currentStepIndex];
    const completed = this.executeStep(step);

    if (completed) {
      this.state.currentStep++;
      this.state.stepStartTime = performance.now();
      this.emit('stepComplete', { stepIndex: currentStepIndex, step });
    }
  }

  // ============================================================================
  // Step Execution
  // ============================================================================

  private executeStep(step: AnimationStep): boolean {
    this.emit('stepStart', { step, stepIndex: this.state.currentStep });

    try {
      switch (step.type) {
        case 'state':
          return this.executeStateStep(step as StateAnimationStep);
        case 'wait':
          return this.executeWaitStep(step as WaitAnimationStep);
        case 'parallel':
          return this.executeParallelStep(step as ParallelAnimationStep);
        case 'branch':
          return this.executeBranchStep(step as BranchAnimationStep);
        case 'loop':
          return this.executeLoopStep(step as LoopAnimationStep);
        case 'callback':
          return this.executeCallbackStep(step as CallbackAnimationStep);
        case 'label':
          // Labels are just markers, immediately complete
          return true;
        case 'goto':
          return this.executeGotoStep(step as GotoAnimationStep);
        default:
          this.log('warn', 'Unknown step type', { type: (step as AnimationStep).type });
          return true;
      }
    } catch (error) {
      this.log('error', 'Step execution error', { error, step });
      this.handleError(error as Error);
      return true; // Continue to next step on error
    }
  }

  private executeStateStep(step: StateAnimationStep): boolean {
    const stateMachine = this.currentStateMachine!;

    // Check condition
    if (step.condition && !step.condition()) {
      return true; // Skip step
    }

    // Transition to state
    const success = stateMachine.transitionTo(step.state, {
      blendDuration: step.blendDuration,
    });

    if (!success) {
      this.log('warn', 'State transition failed', { state: step.state });
    }

    this.emit('stateChange', { step, stepIndex: this.state.currentStep });

    // Wait for completion if required
    if (step.waitForComplete) {
      const stateConfig = stateMachine.getStateConfig(step.state);
      const duration = step.duration || stateConfig.duration;

      if (duration > 0) {
        const elapsed = performance.now() - this.state.stepStartTime;
        return elapsed >= duration * 1000;
      }
    }

    return true;
  }

  private executeWaitStep(step: WaitAnimationStep): boolean {
    const elapsed = performance.now() - this.state.stepStartTime;

    // Check condition if provided
    if (step.condition) {
      if (step.condition()) {
        return true;
      }
      // Check timeout
      if (step.timeout && elapsed >= step.timeout) {
        return true;
      }
      return false;
    }

    // Time-based wait
    return elapsed >= step.duration;
  }

  private executeParallelStep(step: ParallelAnimationStep): boolean {
    // For simplicity, parallel steps execute sequentially but don't block
    // A more complex implementation would use Promise.all
    const results = step.steps.map((s, i) => {
      this.log('debug', 'Executing parallel step', { index: i, type: s.type });
      return this.executeStep(s);
    });

    if (step.waitForAll) {
      return results.every(r => r);
    }

    if (step.waitForAny) {
      return results.some(r => r);
    }

    // Default: continue immediately
    return true;
  }

  private executeBranchStep(step: BranchAnimationStep): boolean {
    const condition = step.condition();
    const stepsToExecute = condition ? step.then : (step.else ?? []);

    // Push current position to stack
    this.stepStack.push({
      stepIndex: this.state.currentStep + 1,
      iteration: 0,
    });

    // Insert branch steps
    const currentSequence = this.currentSequence!;
    const beforeSteps = currentSequence.steps.slice(0, this.state.currentStep + 1);
    const afterSteps = currentSequence.steps.slice(this.state.currentStep + 1);

    // Modify sequence temporarily
    currentSequence.steps = [...beforeSteps, ...stepsToExecute, ...afterSteps];
    this.state.totalSteps = currentSequence.steps.length;

    return true;
  }

  private executeLoopStep(step: LoopAnimationStep): boolean {
    // Check while condition
    if (step.while && !step.while()) {
      return true; // Exit loop
    }

    // Check count
    if (step.count !== undefined && this.state.loopIteration >= step.count) {
      return true; // Exit loop
    }

    // Check max iterations safeguard
    if (step.maxIterations && this.state.loopIteration >= step.maxIterations) {
      this.log('warn', 'Loop max iterations reached', { max: step.maxIterations });
      return true;
    }

    // Push current position to stack
    this.stepStack.push({
      stepIndex: this.state.currentStep + 1,
      iteration: this.state.loopIteration,
    });

    // Insert loop steps
    const currentSequence = this.currentSequence!;
    const beforeSteps = currentSequence.steps.slice(0, this.state.currentStep + 1);
    const afterSteps = currentSequence.steps.slice(this.state.currentStep + 1);

    currentSequence.steps = [...beforeSteps, ...step.steps, ...afterSteps];
    this.state.totalSteps = currentSequence.steps.length;
    this.state.loopIteration++;

    return true;
  }

  private executeCallbackStep(step: CallbackAnimationStep): boolean {
    const result = step.callback();

    if (step.waitForComplete && result instanceof Promise) {
      // For async callbacks, we need to handle completion
      // This is simplified - a full implementation would track pending promises
      result.catch(error => this.handleError(error));
    }

    return !step.waitForComplete;
  }

  private executeGotoStep(step: GotoAnimationStep): boolean {
    // Check condition
    if (step.condition && !step.condition()) {
      return true; // Skip goto
    }

    // Check max jumps
    if (step.maxJumps && this.state.jumpCount >= step.maxJumps) {
      this.log('warn', 'Goto max jumps reached', { max: step.maxJumps });
      return true;
    }

    // Find label
    const labelKey = `${this.currentSequence!.id}:${step.label}`;
    const targetIndex = this.labels.get(labelKey);

    if (targetIndex === undefined) {
      this.log('error', 'Goto label not found', { label: step.label });
      return true;
    }

    this.state.jumpCount++;
    this.state.currentStep = targetIndex;

    this.log('debug', 'Goto executed', { label: step.label, index: targetIndex });

    return false; // Don't increment, we've set the new position
  }

  // ============================================================================
  // Completion & Error Handling
  // ============================================================================

  private completeSequence(): void {
    this.state.isRunning = false;
    this.state.isComplete = true;

    this.emit('complete', { sequenceId: this.currentSequence!.id });
    this.log('debug', 'Sequence completed', { id: this.currentSequence!.id });

    if (this.currentSequence?.onComplete) {
      try {
        this.currentSequence.onComplete();
      } catch (error) {
        this.handleError(error as Error);
      }
    }
  }

  private handleError(error: Error): void {
    this.emit('error', { error, sequenceId: this.currentSequence?.id });
    this.log('error', 'Sequence error', { error: error.message });

    if (this.currentSequence?.onError) {
      this.currentSequence.onError(error);
    }

    this.state.isRunning = false;
  }

  // ============================================================================
  // Event System
  // ============================================================================

  on(event: SequencerEventType, handler: SequencerEventHandler): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(handler);

    return () => {
      this.listeners.get(event)?.delete(handler);
    };
  }

  private emit(type: SequencerEventType, data: Partial<SequencerEvent>): void {
    const event: SequencerEvent = {
      type,
      sequenceId: this.currentSequence?.id ?? '',
      timestamp: performance.now(),
      ...data,
    };

    const handlers = this.listeners.get(type);
    if (handlers) {
      handlers.forEach(handler => {
        try {
          handler(event);
        } catch (error) {
          console.error('[AnimationSequencer] Event handler error:', error);
        }
      });
    }
  }

  // ============================================================================
  // State Queries
  // ============================================================================

  getState(): Readonly<SequencerState> {
    return { ...this.state };
  }

  getCurrentSequence(): AnimationSequence | null {
    return this.currentSequence;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  isPlaying(): boolean {
    return this.state.isRunning;
  }

  // ============================================================================
  // Cleanup
  // ============================================================================

  dispose(): void {
    this.isDisposed = true;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    this.sequences.clear();
    this.listeners.clear();
    this.queue = [];
    this.labels.clear();

    this.log('debug', 'Sequencer disposed');
  }

  // ============================================================================
  // Debug Logging
  // ============================================================================

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
    if (!this.debug && level === 'debug') return;

    const prefix = '[AnimationSequencer]';
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

export function createAnimationSequencer(debug?: boolean): AnimationSequencer {
  return new AnimationSequencer(debug);
}

// ============================================================================
// Predefined Sequences
// ============================================================================

/**
 * Victory celebration sequence
 */
export const VICTORY_SEQUENCE: AnimationSequence = {
  id: 'victory',
  name: 'Victory Celebration',
  steps: [
    { type: 'state', state: 'celebrate', waitForComplete: true, duration: 2000 },
    { type: 'wait', duration: 500 },
    { type: 'state', state: 'idle' },
  ],
};

/**
 * Combat attack sequence
 */
export const ATTACK_SEQUENCE: AnimationSequence = {
  id: 'attack',
  name: 'Combat Attack',
  steps: [
    { type: 'state', state: 'attack', waitForComplete: true, blendDuration: 0.05 },
    { type: 'state', state: 'idle' },
  ],
};

/**
 * Take damage and defeat sequence
 */
export const DEFEAT_SEQUENCE: AnimationSequence = {
  id: 'defeat',
  name: 'Defeat',
  steps: [
    { type: 'wait', duration: 200 },
    { type: 'state', state: 'defeat', waitForComplete: true },
  ],
};

/**
 * Jump attack combo sequence
 */
export const JUMP_ATTACK_SEQUENCE: AnimationSequence = {
  id: 'jumpAttack',
  name: 'Jump Attack Combo',
  steps: [
    { type: 'state', state: 'jump', waitForComplete: true, blendDuration: 0.1 },
    { type: 'state', state: 'attack', waitForComplete: true, blendDuration: 0.05 },
    { type: 'state', state: 'idle' },
  ],
};

// ============================================================================
// Exports
// ============================================================================

export { AnimationSequencer as default };
