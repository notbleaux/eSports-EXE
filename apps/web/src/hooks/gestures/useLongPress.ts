// @ts-nocheck
/**
 * useLongPress Hook
 * Long press detection with configurable duration and cancel on move
 * [Ver001.000]
 */
import { useDrag, DragConfig } from '@use-gesture/react';
import { useCallback, useRef, useState } from 'react';

export interface LongPressConfig {
  /** Duration (ms) to trigger long press [default: 500] */
  duration?: number;
  /** Maximum movement (px) allowed before cancel [default: 10] */
  moveThreshold?: number;
  /** Prevent default on long press [default: false] */
  preventDefault?: boolean;
  /** Enable right-click as long press [default: true] */
  acceptRightClick?: boolean;
}

export interface LongPressState {
  /** Whether currently pressing */
  isPressing: boolean;
  /** Whether long press was triggered */
  isLongPressed: boolean;
  /** Progress 0-1 towards long press */
  progress: number;
  /** Time elapsed in ms */
  elapsed: number;
}

export interface UseLongPressReturn {
  /** Bind props to attach to element */
  bind: ReturnType<typeof useDrag>;
  /** Current long press state */
  state: LongPressState;
  /** Reset state */
  reset: () => void;
  /** Cancel current long press */
  cancel: () => void;
}

const DEFAULT_CONFIG: Required<LongPressConfig> = {
  duration: 500,
  moveThreshold: 10,
  preventDefault: false,
  acceptRightClick: true,
};

/**
 * Hook for detecting long press gestures
 * @param onLongPress - Callback when long press is triggered
 * @param onPressStart - Callback when press starts
 * @param onPressEnd - Callback when press ends (whether long or short)
 * @param config - Long press configuration
 */
export function useLongPress(
  onLongPress?: (event: PointerEvent | MouseEvent | TouchEvent) => void,
  onPressStart?: (event: PointerEvent | MouseEvent | TouchEvent) => void,
  onPressEnd?: (wasLongPress: boolean, event: PointerEvent | MouseEvent | TouchEvent) => void,
  config: LongPressConfig = {}
): UseLongPressReturn {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const startPosRef = useRef<{ x: number; y: number } | null>(null);
  const isLongPressedRef = useRef<boolean>(false);
  const animationFrameRef = useRef<number | null>(null);

  const [state, setState] = useState<LongPressState>({
    isPressing: false,
    isLongPressed: false,
    progress: 0,
    elapsed: 0,
  });

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    isLongPressedRef.current = false;
    startPosRef.current = null;
    setState({
      isPressing: false,
      isLongPressed: false,
      progress: 0,
      elapsed: 0,
    });
  }, [clearTimer]);

  const cancel = useCallback(() => {
    clearTimer();
    isLongPressedRef.current = false;
    setState(prev => ({
      ...prev,
      isPressing: false,
      isLongPressed: false,
    }));
  }, [clearTimer]);

  const updateProgress = useCallback(() => {
    if (!startTimeRef.current || !state.isPressing) return;

    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / cfg.duration, 1);

    setState(prev => ({
      ...prev,
      progress,
      elapsed,
    }));

    if (progress < 1 && state.isPressing) {
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  }, [cfg.duration, state.isPressing]);

  const bind = useDrag(
    ({ down, movement: [mx, my], first, last, cancel: cancelGesture, event }) => {
      // Handle right-click as long press alternative
      if (event.type === 'contextmenu' && cfg.acceptRightClick) {
        event.preventDefault();
        onLongPress?.(event);
        return;
      }

      if (first) {
        // Press started
        startTimeRef.current = Date.now();
        startPosRef.current = { x: (event as PointerEvent).clientX, y: (event as PointerEvent).clientY };
        isLongPressedRef.current = false;

        setState({
          isPressing: true,
          isLongPressed: false,
          progress: 0,
          elapsed: 0,
        });

        onPressStart?.(event);

        // Start progress animation
        animationFrameRef.current = requestAnimationFrame(updateProgress);

        // Set long press timer
        timerRef.current = setTimeout(() => {
          if (!isLongPressedRef.current && state.isPressing) {
            isLongPressedRef.current = true;
            setState(prev => ({
              ...prev,
              isLongPressed: true,
              progress: 1,
            }));
            onLongPress?.(event);
          }
        }, cfg.duration);
      }

      // Check if moved too much (cancel long press)
      if (down && startPosRef.current) {
        const distance = Math.sqrt(mx * mx + my * my);
        if (distance > cfg.moveThreshold) {
          clearTimer();
          cancelGesture();
          reset();
          return;
        }
      }

      if (last) {
        // Press ended
        clearTimer();
        const wasLongPress = isLongPressedRef.current;
        onPressEnd?.(wasLongPress, event);

        // Reset after short delay to allow visual feedback
        setTimeout(reset, wasLongPress ? 150 : 0);
      }
    },
    {
      preventDefault: cfg.preventDefault,
      filterTaps: true,
    } as DragConfig
  );

  return { bind, state, reset, cancel };
}

/**
 * Hook for detecting double-tap gestures
 */
export function useDoubleTap(
  onDoubleTap?: (event: PointerEvent | MouseEvent | TouchEvent) => void,
  onTap?: (event: PointerEvent | MouseEvent | TouchEvent) => void,
  config: { delay?: number; preventDefault?: boolean } = {}
): {
  bind: ReturnType<typeof useDrag>;
  isDoubleTap: boolean;
} {
  const { delay = 300, preventDefault = false } = config;
  const lastTapRef = useRef<number>(0);
  const tapCountRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [isDoubleTap, setIsDoubleTap] = useState(false);

  const bind = useDrag(
    ({ tap, event }) => {
      if (!tap) return;

      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (timeSinceLastTap < delay) {
        // Double tap detected
        tapCountRef.current = 0;
        lastTapRef.current = 0;
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setIsDoubleTap(true);
        onDoubleTap?.(event);
        setTimeout(() => setIsDoubleTap(false), 100);
      } else {
        // First tap
        tapCountRef.current = 1;
        lastTapRef.current = now;
        
        // Set timer for single tap
        timerRef.current = setTimeout(() => {
          if (tapCountRef.current === 1) {
            onTap?.(event);
          }
          tapCountRef.current = 0;
        }, delay);
      }
    },
    {
      filterTaps: true,
      preventDefault,
    } as DragConfig
  );

  return { bind, isDoubleTap };
}

/**
 * Combined hook for press, long press, and double tap
 */
export function usePressable(
  handlers: {
    onPress?: (event: PointerEvent | MouseEvent | TouchEvent) => void;
    onLongPress?: (event: PointerEvent | MouseEvent | TouchEvent) => void;
    onDoubleTap?: (event: PointerEvent | MouseEvent | TouchEvent) => void;
  },
  config: LongPressConfig & { doubleTapDelay?: number } = {}
): {
  bind: ReturnType<typeof useDrag>;
  state: LongPressState & { isDoubleTap: boolean };
} {
  const { doubleTapDelay = 300, ...longPressConfig } = config;
  const lastTapRef = useRef<number>(0);
  const [isDoubleTap, setIsDoubleTap] = useState(false);

  const { bind: longPressBind, state: longPressState } = useLongPress(
    handlers.onLongPress,
    undefined,
    (wasLongPress, event) => {
      if (!wasLongPress && !isDoubleTap) {
        handlers.onPress?.(event);
      }
    },
    longPressConfig
  );

  const bind = useDrag(
    ({ tap, event }) => {
      if (!tap) {
        // Forward to long press handler
        const [, ...rest] = longPressBind();
        return rest;
      }

      const now = Date.now();
      const timeSinceLastTap = now - lastTapRef.current;

      if (timeSinceLastTap < doubleTapDelay) {
        // Double tap
        lastTapRef.current = 0;
        setIsDoubleTap(true);
        handlers.onDoubleTap?.(event);
        setTimeout(() => setIsDoubleTap(false), 100);
      } else {
        lastTapRef.current = now;
      }
    },
    {
      filterTaps: true,
      preventDefault: config.preventDefault,
    } as DragConfig
  );

  return {
    bind,
    state: {
      ...longPressState,
      isDoubleTap,
    },
  };
}

export default useLongPress;
