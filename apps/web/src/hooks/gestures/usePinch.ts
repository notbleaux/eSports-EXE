/**
 * usePinch Hook
 * Pinch zoom detection with scale tracking and min/max limits
 * [Ver001.000]
 */
// @ts-nocheck
import { usePinch as useGesturePinch, PinchConfig } from '@use-gesture/react';
import { useCallback, useRef, useState } from 'react';

export interface PinchConfig {
  /** Minimum scale value [default: 0.5] */
  minScale?: number;
  /** Maximum scale value [default: 3] */
  maxScale?: number;
  /** Scale sensitivity [default: 1] */
  sensitivity?: number;
  /** Enable double-tap to reset [default: true] */
  doubleTapReset?: boolean;
  /** Double-tap delay in ms [default: 300] */
  doubleTapDelay?: number;
  /** Prevent default gesture [default: true] */
  preventDefault?: boolean;
}

export interface PinchState {
  /** Current scale value */
  scale: number;
  /** Previous scale value */
  previousScale: number;
  /** Scale delta from last event */
  delta: number;
  /** Whether currently pinching */
  isPinching: boolean;
  /** Origin of the pinch (center point) */
  origin: { x: number; y: number } | null;
}

export interface UsePinchReturn {
  /** Bind props to attach to element */
  bind: ReturnType<typeof useGesturePinch>;
  /** Current pinch state */
  state: PinchState;
  /** Set scale programmatically */
  setScale: (scale: number) => void;
  /** Reset scale to initial value */
  reset: () => void;
  /** Scale to specific value with animation */
  scaleTo: (targetScale: number, duration?: number) => void;
}

const DEFAULT_CONFIG: Required<PinchConfig> = {
  minScale: 0.5,
  maxScale: 3,
  sensitivity: 1,
  doubleTapReset: true,
  doubleTapDelay: 300,
  preventDefault: true,
};

/**
 * Hook for pinch-to-zoom gestures
 * @param onPinch - Callback when pinch changes
 * @param config - Pinch configuration
 */
export function usePinch(
  onPinch?: (state: PinchState) => void,
  config: PinchConfig = {}
): UsePinchReturn {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const [state, setState] = useState<PinchState>({
    scale: 1,
    previousScale: 1,
    delta: 0,
    isPinching: false,
    origin: null,
  });

  // Track pinch origin for zooming towards center
  const originRef = useRef<{ x: number; y: number } | null>(null);
  
  // Track last tap for double-tap detection
  const lastTapRef = useRef<number>(0);
  const isDoubleTapRef = useRef<boolean>(false);

  const clampScale = useCallback((scale: number): number => {
    return Math.max(cfg.minScale, Math.min(cfg.maxScale, scale));
  }, [cfg.minScale, cfg.maxScale]);

  const setScale = useCallback((newScale: number) => {
    const clamped = clampScale(newScale);
    setState(prev => ({
      ...prev,
      previousScale: prev.scale,
      scale: clamped,
      delta: clamped - prev.scale,
    }));
  }, [clampScale]);

  const reset = useCallback(() => {
    setState({
      scale: 1,
      previousScale: 1,
      delta: 0,
      isPinching: false,
      origin: null,
    });
    originRef.current = null;
  }, []);

  const scaleTo = useCallback((targetScale: number, duration = 300) => {
    const clamped = clampScale(targetScale);
    const startScale = state.scale;
    const startTime = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const newScale = startScale + (clamped - startScale) * easeProgress;

      setState(prev => ({
        ...prev,
        previousScale: prev.scale,
        scale: newScale,
        delta: newScale - prev.scale,
      }));

      onPinch?.({
        ...state,
        scale: newScale,
        previousScale: startScale,
        delta: newScale - startScale,
        isPinching: false,
        origin: originRef.current,
      });

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [state, clampScale, onPinch]);

  const bind = useGesturePinch(
    ({ first, last, movement: [scale], origin: [ox, oy], memo, event, type }) => {
      // Handle double-tap
      if (type === 'pointerdown' && cfg.doubleTapReset) {
        const now = Date.now();
        const timeSinceLastTap = now - lastTapRef.current;
        
        if (timeSinceLastTap < cfg.doubleTapDelay) {
          isDoubleTapRef.current = true;
          scaleTo(1); // Reset to default
          lastTapRef.current = 0;
          return;
        }
        
        lastTapRef.current = now;
        isDoubleTapRef.current = false;
      }

      // Calculate new scale with sensitivity
      const newScale = clampScale(1 + (scale - 1) * cfg.sensitivity);

      // Store origin on first pinch
      if (first) {
        originRef.current = { x: ox, y: oy };
      }

      // Update state
      setState(prev => {
        const updated = {
          scale: newScale,
          previousScale: prev.scale,
          delta: newScale - prev.scale,
          isPinching: !last,
          origin: originRef.current,
        };

        // Call callback
        onPinch?.(updated);

        return updated;
      });

      // Cleanup on last event
      if (last) {
        originRef.current = null;
      }

      return memo;
    },
    {
      preventDefault: cfg.preventDefault,
      pinchOnWheel: true,
    } as PinchConfig
  );

  return { bind, state, setScale, reset, scaleTo };
}

/**
 * Hook for wheel-based zoom (desktop fallback)
 */
export function useWheelZoom(
  onZoom?: (scale: number, delta: number) => void,
  config: Pick<PinchConfig, 'minScale' | 'maxScale' | 'sensitivity'> = {}
): {
  scale: number;
  setScale: (scale: number) => void;
  reset: () => void;
  bind: ReturnType<typeof useGesturePinch>;
} {
  const cfg = {
    minScale: 0.5,
    maxScale: 3,
    sensitivity: 0.1,
    ...config,
  };

  const [scale, setScaleState] = useState(1);

  const clampScale = useCallback((s: number) => {
    return Math.max(cfg.minScale, Math.min(cfg.maxScale, s));
  }, [cfg.minScale, cfg.maxScale]);

  const setScale = useCallback((newScale: number) => {
    setScaleState(clampScale(newScale));
  }, [clampScale]);

  const reset = useCallback(() => {
    setScaleState(1);
  }, []);

  const bind = useGesturePinch(
    ({ wheeling, movement: [scale], event }) => {
      if (!wheeling) return;

      // Calculate delta from wheel
      const delta = (event as WheelEvent).deltaY * -cfg.sensitivity * 0.01;
      const newScale = clampScale(scale + delta);

      setScaleState(newScale);
      onZoom?.(newScale, delta);
    },
    {
      wheel: {
        axis: 'y',
      },
    } as PinchConfig
  );

  return { scale, setScale, reset, bind };
}

export default usePinch;
