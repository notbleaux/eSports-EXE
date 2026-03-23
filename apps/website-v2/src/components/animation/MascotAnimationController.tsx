/** [Ver001.000]
 * Mascot Animation Controller
 * ===========================
 * React component for controlling mascot animations with R3F integration.
 * Provides smooth state transitions and coordination with Three.js animation mixer.
 * 
 * Features:
 * - React-based animation control
 * - Smooth transitions between states
 * - R3F integration with AnimationBridge
 * - Interrupt handling
 * - Debug visualization
 */

import React, {
  useRef,
  useEffect,
  useCallback,
  useState,
  forwardRef,
  useImperativeHandle,
  useMemo,
} from 'react';
import { motion, AnimatePresence, type Transition } from 'framer-motion';
import * as THREE from 'three';
import type { MascotId } from '@/components/mascots/types';
import {
  type AnimationState,
  type AnimationStateConfig,
  type AnimationEvent,
  type StateMachineOptions,
  DEFAULT_STATE_CONFIGS,
} from '@/lib/animation/states';
import { AnimationStateMachine } from '@/lib/animation/stateMachine';
import { AnimationSequencer, type AnimationSequence, type AnimationStep } from '@/lib/animation/sequencer';
import { useAnimationBridge, useAnimationState, createAnimationBridge } from '@/lib/three/animationBridge';

// ============================================================================
// Types
// ============================================================================

export interface MascotAnimationControllerProps {
  /** Mascot identifier */
  mascotId: MascotId;
  /** Current animation state (controlled) */
  currentState?: AnimationState;
  /** Target animation state to transition to */
  targetState?: AnimationState;
  /** Whether state is controlled externally */
  controlled?: boolean;
  /** Initial animation state */
  initialState?: AnimationState;
  /** State machine options */
  stateMachineOptions?: StateMachineOptions;
  /** Animation sequence to play */
  sequence?: AnimationSequence;
  /** Callback on state change */
  onStateChange?: (from: AnimationState | null, to: AnimationState) => void;
  /** Callback on animation events */
  onAnimationEvent?: (event: AnimationEvent) => void;
  /** Whether to enable debug UI */
  debug?: boolean;
  /** CSS class for container */
  className?: string;
  /** Children (typically the 3D mascot component) */
  children?: React.ReactNode;
  /** Blend duration override */
  blendDuration?: number;
  /** Playback speed */
  speed?: number;
  /** Whether animation is paused */
  paused?: boolean;
  /** Whether to show state label */
  showStateLabel?: boolean;
}

export interface MascotAnimationControllerRef {
  /** Get current state */
  getCurrentState: () => AnimationState;
  /** Transition to new state */
  transitionTo: (state: AnimationState, options?: { force?: boolean; blendDuration?: number }) => boolean;
  /** Play a sequence */
  playSequence: (sequence: AnimationSequence) => Promise<boolean>;
  /** Pause animation */
  pause: () => void;
  /** Resume animation */
  resume: () => void;
  /** Reset to initial state */
  reset: () => void;
  /** Get state machine instance */
  getStateMachine: () => AnimationStateMachine;
  /** Get sequencer instance */
  getSequencer: () => AnimationSequencer;
  /** Get blend weight (0-1) */
  getBlendWeight: () => number;
  /** Check if currently transitioning */
  isTransitioning: () => boolean;
}

// ============================================================================
// State Label Component
// ============================================================================

interface StateLabelProps {
  state: AnimationState;
  config: AnimationStateConfig;
  isTransitioning: boolean;
  progress: number;
}

const StateLabel: React.FC<StateLabelProps> = ({ state, config, isTransitioning, progress }) => (
  <motion.div
    className="absolute top-2 left-2 px-2 py-1 rounded text-xs font-mono pointer-events-none select-none z-10"
    style={{
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      color: config.priority === 'critical' ? '#ff6b6b' : 
             config.priority === 'high' ? '#ffd93d' : '#fff',
      borderLeft: `3px solid ${isTransitioning ? '#ffd93d' : '#4ade80'}`,
    }}
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -10 }}
  >
    <div className="flex items-center gap-2">
      <span className="font-bold uppercase">{config.displayName}</span>
      {isTransitioning && (
        <span className="text-yellow-400 animate-pulse">⟳</span>
      )}
    </div>
    <div className="text-[10px] opacity-70">
      {isTransitioning ? `Blending: ${(progress * 100).toFixed(0)}%` : 'Stable'}
    </div>
  </motion.div>
);

// ============================================================================
// Debug Panel Component
// ============================================================================

interface DebugPanelProps {
  stateMachine: AnimationStateMachine;
  sequencer: AnimationSequencer;
  mascotId: MascotId;
}

const DebugPanel: React.FC<DebugPanelProps> = ({ stateMachine, sequencer, mascotId }) => {
  const [currentState, setCurrentState] = useState(stateMachine.getCurrentState());
  const [progress, setProgress] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [timeInState, setTimeInState] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentState(stateMachine.getCurrentState());
      setProgress(stateMachine.getProgress());
      setIsTransitioning(stateMachine.isBlending());
      setTimeInState(stateMachine.getTimeInState());
    }, 100);

    return () => clearInterval(interval);
  }, [stateMachine]);

  const validTransitions = stateMachine.getValidTransitions();

  return (
    <motion.div
      className="absolute bottom-2 right-2 p-3 rounded text-xs font-mono pointer-events-auto select-none z-10 min-w-[200px]"
      style={{
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
    >
      <div className="font-bold text-white mb-2 flex items-center justify-between">
        <span>🎮 Animation Debug</span>
        <span className="text-[10px] text-gray-400">{mascotId}</span>
      </div>
      
      <div className="space-y-1 text-gray-300">
        <div className="flex justify-between">
          <span>State:</span>
          <span className="font-bold text-green-400 uppercase">{currentState}</span>
        </div>
        <div className="flex justify-between">
          <span>Progress:</span>
          <span>{(progress * 100).toFixed(1)}%</span>
        </div>
        <div className="flex justify-between">
          <span>Time:</span>
          <span>{timeInState.toFixed(2)}s</span>
        </div>
        <div className="flex justify-between">
          <span>Blending:</span>
          <span className={isTransitioning ? 'text-yellow-400' : 'text-gray-500'}>
            {isTransitioning ? 'Yes' : 'No'}
          </span>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-700">
        <div className="text-gray-500 mb-1">Valid Transitions:</div>
        <div className="flex flex-wrap gap-1">
          {validTransitions.map((state) => (
            <button
              key={state}
              onClick={() => stateMachine.transitionTo(state)}
              className="px-2 py-0.5 rounded bg-gray-700 hover:bg-gray-600 text-white transition-colors"
            >
              {state}
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const MascotAnimationController = forwardRef<
  MascotAnimationControllerRef,
  MascotAnimationControllerProps
>((
  {
    mascotId,
    currentState,
    targetState,
    controlled = false,
    initialState = 'idle',
    stateMachineOptions = {},
    sequence,
    onStateChange,
    onAnimationEvent,
    debug = false,
    className = '',
    children,
    blendDuration,
    speed = 1,
    paused = false,
    showStateLabel = false,
  },
  ref
) => {
  // Create refs for instances
  const stateMachineRef = useRef<AnimationStateMachine | null>(null);
  const sequencerRef = useRef<AnimationSequencer | null>(null);
  const bridgeRef = useRef<ReturnType<typeof createAnimationBridge> | null>(null);
  const isMountedRef = useRef(true);

  // State for re-rendering
  const [, forceUpdate] = useState({});

  // Initialize instances
  useEffect(() => {
    if (stateMachineRef.current) return;

    // Create state machine
    stateMachineRef.current = new AnimationStateMachine({
      initialState,
      debug,
      ...stateMachineOptions,
    });

    // Create sequencer
    sequencerRef.current = new AnimationSequencer(debug);

    // Create animation bridge
    bridgeRef.current = createAnimationBridge();

    // Subscribe to events
    const unsubscribeStateChange = stateMachineRef.current.on('stateChange', (event) => {
      if (!isMountedRef.current) return;
      
      onStateChange?.(event.from as AnimationState | null, event.to as AnimationState);
      onAnimationEvent?.(event);
      forceUpdate({});
    });

    const unsubscribeAll = stateMachineRef.current.on('stateChange', (event) => {
      if (!isMountedRef.current) return;
      onAnimationEvent?.(event);
    });

    forceUpdate({});

    return () => {
      unsubscribeStateChange();
      unsubscribeAll();
    };
  }, [initialState, debug, stateMachineOptions, onStateChange, onAnimationEvent]);

  // Handle controlled state changes
  useEffect(() => {
    if (!controlled || !stateMachineRef.current) return;

    if (targetState && targetState !== stateMachineRef.current.getCurrentState()) {
      stateMachineRef.current.transitionTo(targetState, { blendDuration });
    }
  }, [controlled, targetState, blendDuration]);

  // Handle speed changes
  useEffect(() => {
    stateMachineRef.current?.setPlaybackSpeed(speed);
  }, [speed]);

  // Handle pause/resume
  useEffect(() => {
    if (paused) {
      stateMachineRef.current?.pause();
      sequencerRef.current?.pause();
    } else {
      stateMachineRef.current?.resume();
      sequencerRef.current?.resume();
    }
  }, [paused]);

  // Play sequence when provided
  useEffect(() => {
    if (sequence && stateMachineRef.current && sequencerRef.current) {
      sequencerRef.current.playImmediate(sequence, stateMachineRef.current);
    }
  }, [sequence]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      stateMachineRef.current?.dispose();
      sequencerRef.current?.dispose();
      stateMachineRef.current = null;
      sequencerRef.current = null;
    };
  }, []);

  // Expose imperative API
  useImperativeHandle(ref, () => ({
    getCurrentState: () => stateMachineRef.current?.getCurrentState() ?? initialState,
    transitionTo: (state, options) => 
      stateMachineRef.current?.transitionTo(state, options) ?? false,
    playSequence: (seq) => {
      if (!sequencerRef.current || !stateMachineRef.current) {
        return Promise.resolve(false);
      }
      return sequencerRef.current.playImmediate(seq, stateMachineRef.current);
    },
    pause: () => {
      stateMachineRef.current?.pause();
      sequencerRef.current?.pause();
    },
    resume: () => {
      stateMachineRef.current?.resume();
      sequencerRef.current?.resume();
    },
    reset: () => stateMachineRef.current?.reset(),
    getStateMachine: () => stateMachineRef.current!,
    getSequencer: () => sequencerRef.current!,
    getBlendWeight: () => stateMachineRef.current?.getBlendWeight() ?? 1,
    isTransitioning: () => stateMachineRef.current?.isBlending() ?? false,
  }), [initialState]);

  // Get current state for display
  const currentAnimState = stateMachineRef.current?.getCurrentState() ?? initialState;
  const stateConfig = DEFAULT_STATE_CONFIGS[currentAnimState];
  const isTransitioning = stateMachineRef.current?.isBlending() ?? false;
  const blendWeight = stateMachineRef.current?.getBlendWeight() ?? 1;
  const animProgress = stateMachineRef.current?.getProgress() ?? 0;

  // Framer Motion variants for container
  const containerVariants = useMemo(() => ({
    idle: {
      scale: 1,
      rotate: 0,
      transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
    },
    walk: {
      scale: [1, 1.02, 1],
      transition: { duration: 0.6, repeat: Infinity, ease: 'linear' },
    },
    run: {
      scale: [1, 1.05, 1],
      transition: { duration: 0.3, repeat: Infinity, ease: 'linear' },
    },
    jump: {
      y: [0, -20, 0],
      scaleY: [1, 0.9, 1.1, 1],
      transition: { duration: 0.8, ease: [0.4, 0, 0.2, 1] },
    },
    attack: {
      scale: [1, 1.2, 0.95, 1],
      x: [0, 30, -10, 0],
      transition: { duration: 0.5, ease: [0.7, 0, 0.84, 0] },
    },
    celebrate: {
      scale: [1, 1.1, 1],
      rotate: [0, 10, -10, 0],
      y: [0, -10, 0],
      transition: { duration: 0.5, repeat: 2, ease: [0.34, 1.56, 0.64, 1] },
    },
    defeat: {
      scale: 0.95,
      rotateX: 15,
      opacity: 0.7,
      transition: { duration: 0.5 },
    },
    custom: {
      scale: 1,
      transition: { duration: 0.3 },
    },
  }), []);

  return (
    <motion.div
      className={`relative ${className}`}
      variants={containerVariants}
      animate={currentAnimState}
      initial={initialState}
      style={{ perspective: 1000 }}
    >
      {/* State Label */}
      <AnimatePresence>
        {showStateLabel && (
          <StateLabel
            state={currentAnimState}
            config={stateConfig}
            isTransitioning={isTransitioning}
            progress={blendWeight}
          />
        )}
      </AnimatePresence>

      {/* Debug Panel */}
      <AnimatePresence>
        {debug && stateMachineRef.current && sequencerRef.current && (
          <DebugPanel
            stateMachine={stateMachineRef.current}
            sequencer={sequencerRef.current}
            mascotId={mascotId}
          />
        )}
      </AnimatePresence>

      {/* Children with animation context */}
      {children}
    </motion.div>
  );
});

MascotAnimationController.displayName = 'MascotAnimationController';

export default MascotAnimationController;

// ============================================================================
// Utility Exports
// ============================================================================

export { AnimationStateMachine, AnimationSequencer };
export type { AnimationSequence, AnimationStep, AnimationState };
