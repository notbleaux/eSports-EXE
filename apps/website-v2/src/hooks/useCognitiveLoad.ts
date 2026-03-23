/** [Ver001.000]
 * useCognitiveLoad Hook
 * =====================
 * React hook for accessing cognitive load state and controlling the detector.
 * 
 * Features:
 * - Returns current load level (low/medium/high/critical)
 * - Subscribe to load changes
 - Manual override option
 * - Integration with React component lifecycle
 * 
 * Integration:
 * - Uses lib/cognitive/loadDetector
 * - Works with AdaptiveUI component
 * - Integrates with TL-A1 context detection
 * 
 * @module hooks/useCognitiveLoad
 */

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import type {
  CognitiveLoadState,
  CognitiveLoadLevel,
  LoadDetectionConfig,
  UseCognitiveLoadReturn,
} from '../lib/cognitive/types';
import {
  createLoadDetector,
  startLoadDetection,
  stopLoadDetection,
  resetLoadDetector,
  setManualLoadLevel,
  clearManualOverride,
  getCurrentLoadState,
  getLoadTrend,
  isDetectionActive,
} from '../lib/cognitive/loadDetector';

// ============================================================================
// Types
// ============================================================================

/**
 * Options for useCognitiveLoad hook
 */
export interface UseCognitiveLoadOptions {
  /** Whether to auto-start detection on mount */
  autoStart?: boolean;
  /** Detection configuration */
  config?: Partial<LoadDetectionConfig>;
  /** Callback when load level changes */
  onLoadChange?: (state: CognitiveLoadState) => void;
  /** Callback when high load is detected */
  onHighLoad?: (state: CognitiveLoadState) => void;
  /** Initial manual override level */
  initialOverride?: CognitiveLoadLevel | null;
}

/**
 * Return type for useCognitiveLoad hook (extended)
 */
export interface UseCognitiveLoadResult {
  /** Current cognitive load state */
  state: CognitiveLoadState;
  /** Current load level */
  level: CognitiveLoadLevel;
  /** Current load score (0-100) */
  score: number;
  /** Whether detection is active */
  isActive: boolean;
  /** Whether manual override is set */
  isManualOverride: boolean;
  /** Start detection */
  start: () => void;
  /** Stop detection */
  stop: () => void;
  /** Reset all metrics */
  reset: () => void;
  /** Manually set load level */
  setManualLevel: (level: CognitiveLoadLevel) => void;
  /** Clear manual override */
  clearManualOverride: () => void;
  /** Subscribe to load changes */
  subscribe: (callback: (state: CognitiveLoadState) => void) => () => void;
  /** Get current trend */
  trend: 'improving' | 'stable' | 'worsening';
  /** Whether load is increasing */
  isIncreasing: boolean;
  /** Whether load is high or critical */
  isHighLoad: boolean;
  /** Start tracking a task */
  startTask: (taskId: string, expectedTime: number, optimalSteps: number) => void;
  /** Complete a task */
  completeTask: (taskId: string, completed: boolean) => void;
}

// ============================================================================
// Subscription Manager
// ============================================================================

/** Global subscribers set */
const subscribers = new Set<(state: CognitiveLoadState) => void>();

/** Notify all subscribers */
function notifySubscribers(state: CognitiveLoadState): void {
  subscribers.forEach(callback => {
    try {
      callback(state);
    } catch (error) {
      console.error('Error in cognitive load subscriber:', error);
    }
  });
}

/** Subscribe to state changes */
function subscribe(callback: (state: CognitiveLoadState) => void): () => void {
  subscribers.add(callback);
  
  // Immediately call with current state
  callback(getCurrentLoadState());
  
  return () => {
    subscribers.delete(callback);
  };
}

// ============================================================================
// Hook Implementation
// ============================================================================

/**
 * React hook for cognitive load detection
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { 
 *     level, 
 *     score, 
 *     isHighLoad,
 *     setManualLevel 
 *   } = useCognitiveLoad({
 *     autoStart: true,
 *     onHighLoad: (state) => console.log('High load detected!', state),
 *   });
 * 
 *   return (
 *     <div>
 *       <p>Current load: {level} ({score})</p>
 *       {isHighLoad && <button onClick={() => setManualLevel('low')}>Reset Load</button>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useCognitiveLoad(
  options: UseCognitiveLoadOptions = {}
): UseCognitiveLoadResult {
  const {
    autoStart = true,
    config: userConfig,
    onLoadChange: userOnLoadChange,
    onHighLoad: userOnHighLoad,
    initialOverride = null,
  } = options;

  // Local state for re-renders
  const [state, setState] = useState<CognitiveLoadState>(getCurrentLoadState);
  const [isActive, setIsActive] = useState(isDetectionActive());
  const [isManualOverride, setIsManualOverride] = useState(initialOverride !== null);

  // Refs for callbacks
  const onLoadChangeRef = useRef(userOnLoadChange);
  const onHighLoadRef = useRef(userOnHighLoad);
  const configRef = useRef(userConfig);

  // Update refs when callbacks change
  useEffect(() => {
    onLoadChangeRef.current = userOnLoadChange;
    onHighLoadRef.current = userOnHighLoad;
    configRef.current = userConfig;
  }, [userOnLoadChange, userOnHighLoad, userConfig]);

  // Initialize detector
  useEffect(() => {
    // Initialize with merged config
    const config: Partial<LoadDetectionConfig> = {
      ...configRef.current,
      onLoadChange: (newState) => {
        setState(newState);
        notifySubscribers(newState);
        onLoadChangeRef.current?.(newState);
      },
      onHighLoad: (newState) => {
        onHighLoadRef.current?.(newState);
      },
    };

    createLoadDetector(config);

    // Apply initial override if set
    if (initialOverride) {
      setManualLoadLevel(initialOverride);
    }

    // Auto-start if enabled
    if (autoStart && !isDetectionActive()) {
      startLoadDetection();
      setIsActive(true);
    }

    return () => {
      // Cleanup is handled by component unmount, but we could stop here
      // if we wanted per-component detection control
    };
  }, [autoStart, initialOverride]);

  // Start detection
  const start = useCallback(() => {
    startLoadDetection();
    setIsActive(true);
  }, []);

  // Stop detection
  const stop = useCallback(() => {
    stopLoadDetection();
    setIsActive(false);
  }, []);

  // Reset detector
  const reset = useCallback(() => {
    resetLoadDetector();
    setState(getCurrentLoadState());
    setIsActive(false);
    setIsManualOverride(false);
  }, []);

  // Set manual level
  const setManualLevel = useCallback((level: CognitiveLoadLevel) => {
    setManualLoadLevel(level);
    setIsManualOverride(true);
    // Update state immediately
    setState(getCurrentLoadState());
  }, []);

  // Clear manual override
  const clearOverride = useCallback(() => {
    clearManualOverride();
    setIsManualOverride(false);
    setState(getCurrentLoadState());
  }, []);

  // Start task tracking
  const startTask = useCallback((taskId: string, expectedTime: number, optimalSteps: number) => {
    // Import dynamically to avoid circular dependencies
    const { startTask: detectorStartTask } = await import('../lib/cognitive/loadDetector');
    detectorStartTask(taskId, expectedTime, optimalSteps);
  }, []);

  // Complete task tracking
  const completeTask = useCallback((taskId: string, completed: boolean) => {
    // Import dynamically to avoid circular dependencies
    const { completeTask: detectorCompleteTask } = await import('../lib/cognitive/loadDetector');
    detectorCompleteTask(taskId, completed);
  }, []);

  // Subscribe to changes
  const subscribeToChanges = useCallback((callback: (state: CognitiveLoadState) => void) => {
    return subscribe(callback);
  }, []);

  // Memoized derived values
  const level = useMemo(() => state.level, [state.level]);
  const score = useMemo(() => state.score, [state.score]);
  const trend = useMemo(() => state.trend, [state.trend]);
  const isIncreasing = useMemo(() => state.isIncreasing, [state.isIncreasing]);
  const isHighLoad = useMemo(() => 
    state.level === 'high' || state.level === 'critical', 
    [state.level]
  );

  return {
    state,
    level,
    score,
    isActive,
    isManualOverride,
    start,
    stop,
    reset,
    setManualLevel,
    clearManualOverride: clearOverride,
    subscribe: subscribeToChanges,
    trend,
    isIncreasing,
    isHighLoad,
    startTask,
    completeTask,
  };
}

/**
 * Hook to get only the current load level
 * 
 * @example
 * ```tsx
 * function SimpleComponent() {
 *   const level = useCognitiveLoadLevel();
 *   return <div>Load: {level}</div>;
 * }
 * ```
 */
export function useCognitiveLoadLevel(): CognitiveLoadLevel {
  const [level, setLevel] = useState<CognitiveLoadLevel>(getCurrentLoadState().level);

  useEffect(() => {
    return subscribe((state) => {
      setLevel(state.level);
    });
  }, []);

  return level;
}

/**
 * Hook to check if load is high
 * 
 * @example
 * ```tsx
 * function ConditionalComponent() {
 *   const isHighLoad = useIsHighCognitiveLoad();
 *   return isHighLoad ? <SimplifiedView /> : <FullView />;
 * }
 * ```
 */
export function useIsHighCognitiveLoad(): boolean {
  const [isHigh, setIsHigh] = useState(() => {
    const level = getCurrentLoadState().level;
    return level === 'high' || level === 'critical';
  });

  useEffect(() => {
    return subscribe((state) => {
      setIsHigh(state.level === 'high' || state.level === 'critical');
    });
  }, []);

  return isHigh;
}

/**
 * Hook to get specific metric
 * 
 * @example
 * ```tsx
 * function MouseStressIndicator() {
 *   const mouseStress = useCognitiveMetric('mouseStress');
 *   return <div>Mouse stress: {mouseStress}</div>;
 * }
 * ```
 */
export function useCognitiveMetric(
  metricName: keyof CognitiveLoadState['metrics']
): number {
  const [value, setValue] = useState(() => 
    getCurrentLoadState().metrics[metricName] ?? 0
  );

  useEffect(() => {
    return subscribe((state) => {
      setValue(state.metrics[metricName] ?? 0);
    });
  }, [metricName]);

  return value;
}

/**
 * Hook to track a task with cognitive load
 * 
 * @example
 * ```tsx
 * function TaskComponent() {
 *   const { startTask, completeTask } = useCognitiveTaskTracker();
 *   
 *   const handleStart = () => {
 *     startTask('form-completion', 120000, 5);
 *   };
 *   
 *   const handleComplete = () => {
 *     completeTask('form-completion', true);
 *   };
 *   
 *   return (
 *     <form onFocus={handleStart} onSubmit={handleComplete}>
 *       {/* form fields */}
 *     </form>
 *   );
 * }
 * ```
 */
export function useCognitiveTaskTracker() {
  const activeTasks = useRef<Set<string>>(new Set());

  const startTask = useCallback((taskId: string, expectedTime: number, optimalSteps: number) => {
    if (activeTasks.current.has(taskId)) return;
    
    activeTasks.current.add(taskId);
    
    // Dynamic import to avoid issues
    import('../lib/cognitive/loadDetector').then(({ startTask: detectorStartTask }) => {
      detectorStartTask(taskId, expectedTime, optimalSteps);
    });
  }, []);

  const completeTask = useCallback((taskId: string, completed: boolean) => {
    if (!activeTasks.current.has(taskId)) return;
    
    activeTasks.current.delete(taskId);
    
    import('../lib/cognitive/loadDetector').then(({ completeTask: detectorCompleteTask }) => {
      detectorCompleteTask(taskId, completed);
    });
  }, []);

  const recordTaskStep = useCallback((taskId: string) => {
    if (!activeTasks.current.has(taskId)) return;
    
    import('../lib/cognitive/loadDetector').then(({ recordTaskStep }) => {
      recordTaskStep(taskId);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // Mark all active tasks as incomplete
      activeTasks.current.forEach(taskId => {
        import('../lib/cognitive/loadDetector').then(({ completeTask: detectorCompleteTask }) => {
          detectorCompleteTask(taskId, false);
        });
      });
      activeTasks.current.clear();
    };
  }, []);

  return {
    startTask,
    completeTask,
    recordTaskStep,
    activeTaskCount: activeTasks.current.size,
  };
}

// ============================================================================
// Export
// ============================================================================

export default useCognitiveLoad;

// Re-export types
export type {
  CognitiveLoadState,
  CognitiveLoadLevel,
  LoadDetectionConfig,
  UseCognitiveLoadReturn,
  UseCognitiveLoadOptions,
  UseCognitiveLoadResult,
};
