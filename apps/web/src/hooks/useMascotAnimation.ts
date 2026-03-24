/** [Ver001.000]
 * useMascotAnimation Hook
 * =======================
 * Hook for accessing and controlling mascot animation state.
 * Provides animation triggering, state change callbacks, and
 * integration with the animation state machine.
 * 
 * Features:
 * - Access current animation state
 * - Trigger state transitions
 * - Subscribe to state changes
 * - Animation sequencing
 * - Performance optimized with refs
 */

import {
  useRef,
  useEffect,
  useCallback,
  useState,
  useMemo,
  useSyncExternalStore,
} from 'react';
import type { MascotId } from '@/components/mascots/types';
import {
  type AnimationState,
  type AnimationEvent,
  type AnimationStateConfig,
  type StateMachineOptions,
  DEFAULT_STATE_CONFIGS,
} from '@/lib/animation/states';
import { AnimationStateMachine, type StateMachineState } from '@/lib/animation/stateMachine';
import { AnimationSequencer, type AnimationSequence, type AnimationStep } from '@/lib/animation/sequencer';

// ============================================================================
// Hook Options
// ============================================================================

export interface UseMascotAnimationOptions {
  /** Mascot identifier */
  mascotId: MascotId;
  /** Initial animation state */
  initialState?: AnimationState;
  /** State machine configuration options */
  stateMachineOptions?: StateMachineOptions;
  /** Auto-start with a sequence */
  autoPlaySequence?: AnimationSequence;
  /** Callback when state changes */
  onStateChange?: (from: AnimationState | null, to: AnimationState) => void;
  /** Callback for all animation events */
  onAnimationEvent?: (event: AnimationEvent) => void;
  /** Whether to enable debug logging */
  debug?: boolean;
}

// ============================================================================
// Hook Return Value
// ============================================================================

export interface UseMascotAnimationReturn {
  // State Access
  /** Current animation state */
  currentState: AnimationState;
  /** Previous animation state (null if never changed) */
  previousState: AnimationState | null;
  /** Current state configuration */
  stateConfig: AnimationStateConfig;
  /** Full state machine state snapshot */
  stateMachineState: StateMachineState;
  
  // State Control
  /** Transition to a new state */
  transitionTo: (state: AnimationState, options?: TransitionOptions) => boolean;
  /** Check if can transition to state */
  canTransitionTo: (state: AnimationState) => boolean;
  /** Get list of valid transitions from current state */
  getValidTransitions: () => AnimationState[];
  
  // Animation Control
  /** Pause animation updates */
  pause: () => void;
  /** Resume animation updates */
  resume: () => void;
  /** Toggle pause state */
  togglePause: () => void;
  /** Reset to initial state */
  reset: () => void;
  /** Set playback speed */
  setSpeed: (speed: number) => void;
  
  // Sequencing
  /** Play an animation sequence */
  playSequence: (sequence: AnimationSequence) => Promise<boolean>;
  /** Register a sequence for later playback */
  registerSequence: (sequence: AnimationSequence) => void;
  /** Check if a sequence is currently playing */
  isPlayingSequence: () => boolean;
  
  // Blend Information
  /** Current blend weight (0-1) */
  blendWeight: number;
  /** Whether currently transitioning between states */
  isTransitioning: boolean;
  /** Animation progress in current state (0-1) */
  progress: number;
  /** Time spent in current state (seconds) */
  timeInState: number;
  
  // Status
  /** Whether animation is paused */
  isPaused: boolean;
  /** Current playback speed */
  playbackSpeed: number;
  
  // Event Subscription
  /** Subscribe to state changes */
  onStateChange: (handler: StateChangeHandler) => () => void;
  /** Subscribe to specific animation events */
  onAnimationEvent: (handler: AnimationEventHandler) => () => void;
  
  // Direct Instance Access (advanced use)
  /** Direct access to state machine instance */
  stateMachine: AnimationStateMachine;
  /** Direct access to sequencer instance */
  sequencer: AnimationSequencer;
}

// ============================================================================
// Type Definitions
// ============================================================================

export interface TransitionOptions {
  /** Force transition even if not normally valid */
  force?: boolean;
  /** Custom blend duration (seconds) */
  blendDuration?: number;
  /** Custom trigger data for conditions */
  triggerData?: unknown;
  /** Mascot state data for conditions */
  mascotData?: { health?: number; energy?: number; isGrounded?: boolean };
}

export type StateChangeHandler = (from: AnimationState | null, to: AnimationState) => void;
export type AnimationEventHandler = (event: AnimationEvent) => void;

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMascotAnimation(
  options: UseMascotAnimationOptions
): UseMascotAnimationReturn {
  const {
    mascotId,
    initialState = 'idle',
    stateMachineOptions = {},
    autoPlaySequence,
    onStateChange: externalOnStateChange,
    onAnimationEvent: externalOnAnimationEvent,
    debug = false,
  } = options;

  // Create stable refs for instances
  const stateMachineRef = useRef<AnimationStateMachine | null>(null);
  const sequencerRef = useRef<AnimationSequencer | null>(null);
  const subscribersRef = useRef<Set<() => void>>(new Set());
  const isInitializedRef = useRef(false);

  // Initialize instances (once)
  if (!isInitializedRef.current) {
    stateMachineRef.current = new AnimationStateMachine({
      initialState,
      debug,
      ...stateMachineOptions,
    });

    sequencerRef.current = new AnimationSequencer(debug);

    isInitializedRef.current = true;
  }

  // Force re-render on state change using sync external store pattern
  const subscribe = useCallback((callback: () => void) => {
    subscribersRef.current.add(callback);
    return () => subscribersRef.current.delete(callback);
  }, []);

  const getSnapshot = useCallback(() => {
    return stateMachineRef.current?.getState() ?? null;
  }, []);

  const getServerSnapshot = useCallback(() => null, []);

  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // Notify subscribers when state changes
  useEffect(() => {
    const stateMachine = stateMachineRef.current;
    if (!stateMachine) return;

    const unsubscribe = stateMachine.on('stateChange', () => {
      subscribersRef.current.forEach(cb => cb());
    });

    // Also subscribe to transition complete for smoother updates
    const unsubscribeTransition = stateMachine.on('transitionComplete', () => {
      subscribersRef.current.forEach(cb => cb());
    });

    return () => {
      unsubscribe();
      unsubscribeTransition();
    };
  }, []);

  // External event handlers
  useEffect(() => {
    const stateMachine = stateMachineRef.current;
    if (!stateMachine) return;

    const handlers: (() => void)[] = [];

    if (externalOnStateChange) {
      const unsubscribe = stateMachine.on('stateChange', (event) => {
        externalOnStateChange(event.from as AnimationState | null, event.to as AnimationState);
      });
      handlers.push(unsubscribe);
    }

    if (externalOnAnimationEvent) {
      const unsubscribe = stateMachine.on('stateChange', externalOnAnimationEvent);
      handlers.push(unsubscribe);
    }

    return () => {
      handlers.forEach(unsubscribe => unsubscribe());
    };
  }, [externalOnStateChange, externalOnAnimationEvent]);

  // Auto-play sequence
  useEffect(() => {
    if (autoPlaySequence && stateMachineRef.current && sequencerRef.current) {
      sequencerRef.current.playImmediate(autoPlaySequence, stateMachineRef.current);
    }
  }, [autoPlaySequence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stateMachineRef.current?.dispose();
      sequencerRef.current?.dispose();
      stateMachineRef.current = null;
      sequencerRef.current = null;
      subscribersRef.current.clear();
    };
  }, []);

  // Get current values
  const stateMachine = stateMachineRef.current!;
  const sequencer = sequencerRef.current!;
  
  const currentState = stateMachine.getCurrentState();
  const previousState = stateMachine.getPreviousState();
  const stateConfig = stateMachine.getCurrentConfig();
  const stateMachineState = stateMachine.getState();
  const blendWeight = stateMachine.getBlendWeight();
  const isTransitioning = stateMachine.isBlending();
  const progress = stateMachine.getProgress();
  const timeInState = stateMachine.getTimeInState();

  // State control methods
  const transitionTo = useCallback((targetState: AnimationState, opts: TransitionOptions = {}) => {
    return stateMachine.transitionTo(targetState, {
      force: opts.force,
      blendDuration: opts.blendDuration,
      triggerData: opts.triggerData,
      mascotData: opts.mascotData ? {
        mascotId,
        ...opts.mascotData,
      } : undefined,
    });
  }, [stateMachine, mascotId]);

  const canTransitionTo = useCallback((targetState: AnimationState) => {
    return stateMachine.canTransitionTo(targetState);
  }, [stateMachine]);

  const getValidTransitions = useCallback(() => {
    return stateMachine.getValidTransitions();
  }, [stateMachine]);

  // Animation control methods
  const pause = useCallback(() => {
    stateMachine.pause();
    sequencer.pause();
    subscribersRef.current.forEach(cb => cb());
  }, [stateMachine, sequencer]);

  const resume = useCallback(() => {
    stateMachine.resume();
    sequencer.resume();
    subscribersRef.current.forEach(cb => cb());
  }, [stateMachine, sequencer]);

  const togglePause = useCallback(() => {
    if (stateMachineState.isPaused) {
      resume();
    } else {
      pause();
    }
  }, [stateMachineState.isPaused, pause, resume]);

  const reset = useCallback(() => {
    stateMachine.reset();
    subscribersRef.current.forEach(cb => cb());
  }, [stateMachine]);

  const setSpeed = useCallback((speed: number) => {
    stateMachine.setPlaybackSpeed(Math.max(0, speed));
  }, [stateMachine]);

  // Sequencing methods
  const playSequence = useCallback((sequence: AnimationSequence) => {
    return sequencer.playImmediate(sequence, stateMachine);
  }, [sequencer, stateMachine]);

  const registerSequence = useCallback((sequence: AnimationSequence) => {
    sequencer.registerSequence(sequence);
  }, [sequencer]);

  const isPlayingSequence = useCallback(() => {
    return sequencer.isPlaying();
  }, [sequencer]);

  // Event subscription methods
  const onStateChange = useCallback((handler: StateChangeHandler) => {
    return stateMachine.onStateChange(handler);
  }, [stateMachine]);

  const onAnimationEvent = useCallback((handler: AnimationEventHandler) => {
    return stateMachine.on('stateChange', handler);
  }, [stateMachine]);

  // Return the hook API
  return useMemo(() => ({
    // State Access
    currentState,
    previousState,
    stateConfig,
    stateMachineState,
    
    // State Control
    transitionTo,
    canTransitionTo,
    getValidTransitions,
    
    // Animation Control
    pause,
    resume,
    togglePause,
    reset,
    setSpeed,
    
    // Sequencing
    playSequence,
    registerSequence,
    isPlayingSequence,
    
    // Blend Information
    blendWeight,
    isTransitioning,
    progress,
    timeInState,
    
    // Status
    isPaused: stateMachineState.isPaused,
    playbackSpeed: stateMachineState.playbackSpeed,
    
    // Event Subscription
    onStateChange,
    onAnimationEvent,
    
    // Direct Instance Access
    stateMachine,
    sequencer,
  }), [
    currentState,
    previousState,
    stateConfig,
    stateMachineState,
    transitionTo,
    canTransitionTo,
    getValidTransitions,
    pause,
    resume,
    togglePause,
    reset,
    setSpeed,
    playSequence,
    registerSequence,
    isPlayingSequence,
    blendWeight,
    isTransitioning,
    progress,
    timeInState,
    onStateChange,
    onAnimationEvent,
    stateMachine,
    sequencer,
  ]);
}

// ============================================================================
// Helper Hooks
// ============================================================================

/**
 * Hook to track a specific animation state
 * Returns true when the mascot is in the specified state
 */
export function useAnimationStateMatch(
  mascotAnimation: UseMascotAnimationReturn,
  targetState: AnimationState
): boolean {
  return mascotAnimation.currentState === targetState;
}

/**
 * Hook to track if any of the specified states are active
 */
export function useAnimationStateMatches(
  mascotAnimation: UseMascotAnimationReturn,
  targetStates: AnimationState[]
): boolean {
  return targetStates.includes(mascotAnimation.currentState);
}

/**
 * Hook that triggers a callback when entering a specific state
 */
export function useOnAnimationStateEnter(
  mascotAnimation: UseMascotAnimationReturn,
  targetState: AnimationState,
  callback: () => void
): void {
  const lastStateRef = useRef(mascotAnimation.currentState);

  useEffect(() => {
    if (lastStateRef.current !== targetState && mascotAnimation.currentState === targetState) {
      callback();
    }
    lastStateRef.current = mascotAnimation.currentState;
  }, [mascotAnimation.currentState, targetState, callback]);
}

/**
 * Hook that triggers a callback when exiting a specific state
 */
export function useOnAnimationStateExit(
  mascotAnimation: UseMascotAnimationReturn,
  targetState: AnimationState,
  callback: () => void
): void {
  const lastStateRef = useRef(mascotAnimation.currentState);

  useEffect(() => {
    if (lastStateRef.current === targetState && mascotAnimation.currentState !== targetState) {
      callback();
    }
    lastStateRef.current = mascotAnimation.currentState;
  }, [mascotAnimation.currentState, targetState, callback]);
}

/**
 * Hook for simplified animation triggering
 * Returns trigger functions for common animations
 */
export function useAnimationTriggers(mascotAnimation: UseMascotAnimationReturn) {
  const { transitionTo } = mascotAnimation;

  return useMemo(() => ({
    idle: () => transitionTo('idle'),
    walk: () => transitionTo('walk'),
    run: () => transitionTo('run'),
    jump: () => transitionTo('jump'),
    attack: () => transitionTo('attack'),
    celebrate: () => transitionTo('celebrate'),
    defeat: () => transitionTo('defeat'),
  }), [transitionTo]);
}

// ============================================================================
// Predefined Sequences
// ============================================================================

/**
 * Predefined victory sequence
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
 * Predefined attack sequence
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
 * Predefined defeat sequence
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
 * Predefined combo sequence
 */
export const COMBO_SEQUENCE: AnimationSequence = {
  id: 'combo',
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

export default useMascotAnimation;
export type { AnimationState, AnimationSequence, AnimationStep, AnimationEvent };
