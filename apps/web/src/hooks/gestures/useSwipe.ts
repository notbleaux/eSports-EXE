/**
 * useSwipe Hook
 * Detect horizontal/vertical swipes with velocity detection
 * [Ver001.000]
 */
// @ts-nocheck
import { useDrag, DragConfig } from '@use-gesture/react';
import { useCallback, useRef, useState } from 'react';

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export interface SwipeConfig {
  /** Minimum distance (px) to trigger swipe [default: 50] */
  threshold?: number;
  /** Maximum time (ms) for swipe to complete [default: 500] */
  timeout?: number;
  /** Minimum velocity (px/ms) for fast swipe [default: 0.5] */
  velocityThreshold?: number;
  /** Enable horizontal swipes [default: true] */
  horizontal?: boolean;
  /** Enable vertical swipes [default: false] */
  vertical?: boolean;
  /** Prevent default on swipe [default: true] */
  preventDefault?: boolean;
  /** Touch action CSS property [default: 'pan-y'] */
  touchAction?: string;
}

export interface SwipeState {
  /** Current swipe direction */
  direction: SwipeDirection | null;
  /** Swipe velocity in px/ms */
  velocity: number;
  /** Distance traveled in pixels */
  distance: number;
  /** Whether swipe exceeded threshold */
  isSwiping: boolean;
  /** Swipe progress 0-1 */
  progress: number;
}

export interface UseSwipeReturn {
  /** Bind props to attach to element */
  bind: ReturnType<typeof useDrag>;
  /** Current swipe state */
  state: SwipeState;
  /** Reset swipe state */
  reset: () => void;
}

const DEFAULT_CONFIG: Required<SwipeConfig> = {
  threshold: 50,
  timeout: 500,
  velocityThreshold: 0.5,
  horizontal: true,
  vertical: false,
  preventDefault: true,
  touchAction: 'pan-y',
};

/**
 * Hook for detecting swipe gestures
 * @param onSwipe - Callback when swipe is detected
 * @param config - Swipe configuration
 */
export function useSwipe(
  onSwipe?: (direction: SwipeDirection, state: SwipeState) => void,
  config: SwipeConfig = {}
): UseSwipeReturn {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const startTimeRef = useRef<number>(0);
  const [state, setState] = useState<SwipeState>({
    direction: null,
    velocity: 0,
    distance: 0,
    isSwiping: false,
    progress: 0,
  });

  const reset = useCallback(() => {
    setState({
      direction: null,
      velocity: 0,
      distance: 0,
      isSwiping: false,
      progress: 0,
    });
  }, []);

  const bind = useDrag(
    ({ down, movement: [mx, my], velocity: [vx, vy], direction: [dx, dy], first, last, cancel }) => {
      // Track start time
      if (first) {
        startTimeRef.current = Date.now();
      }

      // Calculate distance based on enabled directions
      const distance = cfg.horizontal && cfg.vertical
        ? Math.sqrt(mx * mx + my * my)
        : cfg.horizontal
          ? Math.abs(mx)
          : Math.abs(my);

      // Calculate velocity
      const velocity = cfg.horizontal && cfg.vertical
        ? Math.sqrt(vx * vx + vy * vy)
        : cfg.horizontal
          ? vx
          : vy;

      // Determine direction
      let direction: SwipeDirection | null = null;
      if (Math.abs(mx) > Math.abs(my)) {
        direction = mx > 0 ? 'right' : 'left';
      } else {
        direction = my > 0 ? 'down' : 'up';
      }

      // Check if direction is enabled
      const isDirectionEnabled = direction === 'left' || direction === 'right'
        ? cfg.horizontal
        : cfg.vertical;

      // Calculate progress (0-1 based on threshold)
      const progress = Math.min(distance / cfg.threshold, 1);

      // Update state while swiping
      if (down) {
        setState({
          direction: isDirectionEnabled ? direction : null,
          velocity,
          distance,
          isSwiping: distance > cfg.threshold * 0.3,
          progress,
        });
      }

      // Check for swipe completion
      if (last) {
        const elapsed = Date.now() - startTimeRef.current;
        const isFastSwipe = velocity > cfg.velocityThreshold;
        const isLongSwipe = distance > cfg.threshold;
        const isWithinTimeout = elapsed < cfg.timeout;

        // Trigger swipe if:
        // 1. Distance exceeds threshold, OR
        // 2. Velocity exceeds threshold AND within timeout
        if ((isLongSwipe || (isFastSwipe && isWithinTimeout)) && isDirectionEnabled && onSwipe) {
          onSwipe(direction, {
            direction,
            velocity,
            distance,
            isSwiping: true,
            progress: 1,
          });
        }

        // Reset state after animation frame
        requestAnimationFrame(reset);
      }
    },
    {
      axis: cfg.horizontal && !cfg.vertical ? 'x' : !cfg.horizontal && cfg.vertical ? 'y' : undefined,
      preventDefault: cfg.preventDefault,
      touchAction: cfg.touchAction as DragConfig['touchAction'],
    }
  );

  return { bind, state, reset };
}

/**
 * Hook specifically for horizontal swipes (simplified API)
 */
export function useHorizontalSwipe(
  onSwipe?: (direction: 'left' | 'right', state: SwipeState) => void,
  config: Omit<SwipeConfig, 'horizontal' | 'vertical'> = {}
): UseSwipeReturn {
  return useSwipe(onSwipe as (direction: SwipeDirection, state: SwipeState) => void, {
    ...config,
    horizontal: true,
    vertical: false,
  });
}

/**
 * Hook specifically for vertical swipes (simplified API)
 */
export function useVerticalSwipe(
  onSwipe?: (direction: 'up' | 'down', state: SwipeState) => void,
  config: Omit<SwipeConfig, 'horizontal' | 'vertical'> = {}
): UseSwipeReturn {
  return useSwipe(onSwipe as (direction: SwipeDirection, state: SwipeState) => void, {
    ...config,
    horizontal: false,
    vertical: true,
  });
}

export default useSwipe;
