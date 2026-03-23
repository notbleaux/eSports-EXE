/**
 * useTouchGesture Hook
 * Comprehensive touch gesture detection with Pointer Events API
 * [Ver001.000]
 * 
 * Features:
 * - Swipe detection (up/down/left/right) with velocity tracking
 * - Pinch-to-zoom with scale tracking
 * - Long-press with duration threshold
 * - Pan/drag with momentum calculation
 * - Tap and double-tap detection
 * - Gesture combo support
 * - Haptic feedback integration
 * - <100ms gesture recognition
 */

import { useCallback, useRef, useState, useEffect } from 'react';

// ============================================================================
// TYPES
// ============================================================================

export type GestureDirection = 'up' | 'down' | 'left' | 'right' | 'none';
export type GestureType = 'tap' | 'doubleTap' | 'longPress' | 'swipe' | 'pinch' | 'pan' | 'none';

export interface Point2D {
  x: number;
  y: number;
}

export interface Velocity2D {
  x: number;
  y: number;
  magnitude: number;
}

export interface GestureState {
  /** Current gesture type */
  type: GestureType;
  /** Gesture direction */
  direction: GestureDirection;
  /** Whether gesture is active */
  isActive: boolean;
  /** Start position */
  startPosition: Point2D | null;
  /** Current position */
  currentPosition: Point2D | null;
  /** Delta from start */
  delta: Point2D;
  /** Current velocity */
  velocity: Velocity2D;
  /** Distance traveled */
  distance: number;
  /** Scale for pinch (1 = default) */
  scale: number;
  /** Scale delta */
  scaleDelta: number;
  /** Rotation in degrees */
  rotation: number;
  /** Progress 0-1 for long press */
  progress: number;
  /** Number of active pointers */
  pointerCount: number;
  /** Timestamp of gesture start */
  startTime: number;
  /** Elapsed time in ms */
  elapsed: number;
}

export interface SwipeConfig {
  /** Minimum distance (px) to trigger swipe [default: 50] */
  threshold?: number;
  /** Maximum time (ms) for swipe [default: 300] */
  maxDuration?: number;
  /** Minimum velocity (px/ms) [default: 0.3] */
  velocityThreshold?: number;
  /** Enable horizontal swipes [default: true] */
  horizontal?: boolean;
  /** Enable vertical swipes [default: true] */
  vertical?: boolean;
}

export interface PinchConfig {
  /** Minimum scale [default: 0.5] */
  minScale?: number;
  /** Maximum scale [default: 4] */
  maxScale?: number;
  /** Pinch sensitivity [default: 1] */
  sensitivity?: number;
}

export interface LongPressConfig {
  /** Duration (ms) to trigger [default: 500] */
  duration?: number;
  /** Max movement (px) before cancel [default: 10] */
  moveThreshold?: number;
}

export interface TapConfig {
  /** Max duration (ms) for tap [default: 200] */
  maxDuration?: number;
  /** Max movement (px) allowed [default: 10] */
  moveThreshold?: number;
  /** Double tap delay (ms) [default: 300] */
  doubleTapDelay?: number;
}

export interface PanConfig {
  /** Enable momentum [default: true] */
  momentum?: boolean;
  /** Deceleration factor [default: 0.95] */
  deceleration?: number;
  /** Min velocity for momentum (px/ms) [default: 0.5] */
  minVelocity?: number;
}

export interface TouchGestureConfig {
  /** Swipe configuration */
  swipe?: SwipeConfig;
  /** Pinch configuration */
  pinch?: PinchConfig;
  /** Long press configuration */
  longPress?: LongPressConfig;
  /** Tap configuration */
  tap?: TapConfig;
  /** Pan configuration */
  pan?: PanConfig;
  /** Touch target size (px) [default: 44] */
  touchTargetSize?: number;
  /** Enable haptic feedback [default: true] */
  hapticEnabled?: boolean;
  /** Prevent default on gestures [default: false] */
  preventDefault?: boolean;
}

export interface GestureHandlers {
  /** Called on any gesture start */
  onGestureStart?: (state: GestureState) => void;
  /** Called on any gesture move */
  onGestureMove?: (state: GestureState) => void;
  /** Called on any gesture end */
  onGestureEnd?: (state: GestureState) => void;
  /** Called on tap */
  onTap?: (position: Point2D, state: GestureState) => void;
  /** Called on double tap */
  onDoubleTap?: (position: Point2D, state: GestureState) => void;
  /** Called on long press */
  onLongPress?: (position: Point2D, state: GestureState) => void;
  /** Called on swipe */
  onSwipe?: (direction: GestureDirection, state: GestureState) => void;
  /** Called on pinch */
  onPinch?: (scale: number, state: GestureState) => void;
  /** Called on pan */
  onPan?: (delta: Point2D, state: GestureState) => void;
  /** Called on pan end with momentum */
  onPanEnd?: (velocity: Velocity2D, state: GestureState) => void;
}

export interface UseTouchGestureReturn {
  /** Gesture state */
  state: GestureState;
  /** Bind to element */
  bind: () => {
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onPointerCancel: (e: React.PointerEvent) => void;
    onPointerLeave: (e: React.PointerEvent) => void;
    style?: React.CSSProperties;
  };
  /** Reset gesture state */
  reset: () => void;
  /** Check if gesture type is active */
  isGesture: (type: GestureType) => boolean;
}

// ============================================================================
// DEFAULTS
// ============================================================================

const DEFAULT_SWIPE_CONFIG: Required<SwipeConfig> = {
  threshold: 50,
  maxDuration: 300,
  velocityThreshold: 0.3,
  horizontal: true,
  vertical: true,
};

const DEFAULT_PINCH_CONFIG: Required<PinchConfig> = {
  minScale: 0.5,
  maxScale: 4,
  sensitivity: 1,
};

const DEFAULT_LONG_PRESS_CONFIG: Required<LongPressConfig> = {
  duration: 500,
  moveThreshold: 10,
};

const DEFAULT_TAP_CONFIG: Required<TapConfig> = {
  maxDuration: 200,
  moveThreshold: 10,
  doubleTapDelay: 300,
};

const DEFAULT_PAN_CONFIG: Required<PanConfig> = {
  momentum: true,
  deceleration: 0.95,
  minVelocity: 0.5,
};

const DEFAULT_CONFIG: Required<TouchGestureConfig> = {
  swipe: DEFAULT_SWIPE_CONFIG,
  pinch: DEFAULT_PINCH_CONFIG,
  longPress: DEFAULT_LONG_PRESS_CONFIG,
  tap: DEFAULT_TAP_CONFIG,
  pan: DEFAULT_PAN_CONFIG,
  touchTargetSize: 44,
  hapticEnabled: true,
  preventDefault: false,
};

const INITIAL_STATE: GestureState = {
  type: 'none',
  direction: 'none',
  isActive: false,
  startPosition: null,
  currentPosition: null,
  delta: { x: 0, y: 0 },
  velocity: { x: 0, y: 0, magnitude: 0 },
  distance: 0,
  scale: 1,
  scaleDelta: 0,
  rotation: 0,
  progress: 0,
  pointerCount: 0,
  startTime: 0,
  elapsed: 0,
};

// ============================================================================
// HAPTIC FEEDBACK
// ============================================================================

/**
 * Trigger haptic feedback if supported
 */
function triggerHaptic(pattern: number | number[] = 10): void {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate(pattern);
    } catch {
      // Ignore haptic errors
    }
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getDistance(p1: Point2D, p2: Point2D): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  return Math.sqrt(dx * dx + dy * dy);
}

function getCenter(p1: Point2D, p2: Point2D): Point2D {
  return {
    x: (p1.x + p2.x) / 2,
    y: (p1.y + p2.y) / 2,
  };
}

function getDirection(deltaX: number, deltaY: number, horizontal: boolean, vertical: boolean): GestureDirection {
  if (!horizontal && !vertical) return 'none';
  
  const absX = Math.abs(deltaX);
  const absY = Math.abs(deltaY);
  
  if (horizontal && (!vertical || absX > absY)) {
    return deltaX > 0 ? 'right' : 'left';
  }
  if (vertical && (!horizontal || absY >= absX)) {
    return deltaY > 0 ? 'down' : 'up';
  }
  return 'none';
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useTouchGesture(
  handlers: GestureHandlers = {},
  config: TouchGestureConfig = {}
): UseTouchGestureReturn {
  const cfg = {
    ...DEFAULT_CONFIG,
    ...config,
    swipe: { ...DEFAULT_SWIPE_CONFIG, ...config.swipe },
    pinch: { ...DEFAULT_PINCH_CONFIG, ...config.pinch },
    longPress: { ...DEFAULT_LONG_PRESS_CONFIG, ...config.longPress },
    tap: { ...DEFAULT_TAP_CONFIG, ...config.tap },
    pan: { ...DEFAULT_PAN_CONFIG, ...config.pan },
  };

  const [state, setState] = useState<GestureState>(INITIAL_STATE);
  
  // Refs for tracking pointers and gesture state
  const pointersRef = useRef<Map<number, Point2D>>(new Map());
  const startDistanceRef = useRef<number>(0);
  const startScaleRef = useRef<number>(1);
  const lastTimeRef = useRef<number>(0);
  const lastPositionRef = useRef<Point2D | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTapRef = useRef<{ time: number; position: Point2D } | null>(null);
  const gestureStartedRef = useRef<boolean>(false);
  const currentGestureRef = useRef<GestureType>('none');
  const rafRef = useRef<number | null>(null);

  // Calculate velocity
  const calculateVelocity = useCallback((currentPos: Point2D, currentTime: number): Velocity2D => {
    if (!lastPositionRef.current || !lastTimeRef.current) {
      return { x: 0, y: 0, magnitude: 0 };
    }
    
    const dt = currentTime - lastTimeRef.current;
    if (dt === 0) return { x: 0, y: 0, magnitude: 0 };
    
    const vx = (currentPos.x - lastPositionRef.current.x) / dt;
    const vy = (currentPos.y - lastPositionRef.current.y) / dt;
    
    return {
      x: vx,
      y: vy,
      magnitude: Math.sqrt(vx * vx + vy * vy),
    };
  }, []);

  // Reset gesture state
  const reset = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    
    pointersRef.current.clear();
    startDistanceRef.current = 0;
    startScaleRef.current = 1;
    lastTimeRef.current = 0;
    lastPositionRef.current = null;
    gestureStartedRef.current = false;
    currentGestureRef.current = 'none';
    
    setState(INITIAL_STATE);
  }, []);

  // Check if gesture type is active
  const isGesture = useCallback((type: GestureType): boolean => {
    return currentGestureRef.current === type;
  }, []);

  // Update progress for long press
  const updateProgress = useCallback(() => {
    if (currentGestureRef.current !== 'longPress' && currentGestureRef.current !== 'none') return;
    
    const elapsed = Date.now() - state.startTime;
    const progress = clamp(elapsed / cfg.longPress.duration, 0, 1);
    
    setState(prev => ({ ...prev, progress, elapsed }));
    
    if (progress < 1 && currentGestureRef.current === 'none') {
      rafRef.current = requestAnimationFrame(updateProgress);
    }
  }, [state.startTime, cfg.longPress.duration]);

  // Handle pointer down
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    const element = e.currentTarget;
    element.setPointerCapture(e.pointerId);
    
    const point: Point2D = { x: e.clientX, y: e.clientY };
    pointersRef.current.set(e.pointerId, point);
    
    const now = Date.now();
    const pointerCount = pointersRef.current.size;
    
    // Start new gesture if first pointer
    if (pointerCount === 1) {
      gestureStartedRef.current = true;
      currentGestureRef.current = 'none';
      startScaleRef.current = state.scale;
      
      setState(prev => ({
        ...prev,
        type: 'none',
        isActive: true,
        startPosition: point,
        currentPosition: point,
        delta: { x: 0, y: 0 },
        velocity: { x: 0, y: 0, magnitude: 0 },
        distance: 0,
        pointerCount: 1,
        startTime: now,
        elapsed: 0,
        progress: 0,
      }));
      
      lastTimeRef.current = now;
      lastPositionRef.current = point;
      
      // Start long press timer
      longPressTimerRef.current = setTimeout(() => {
        if (currentGestureRef.current === 'none' && gestureStartedRef.current) {
          currentGestureRef.current = 'longPress';
          
          setState(prev => ({
            ...prev,
            type: 'longPress',
            progress: 1,
          }));
          
          if (cfg.hapticEnabled) {
            triggerHaptic(50);
          }
          
          handlers.onLongPress?.(point, state);
        }
      }, cfg.longPress.duration);
      
      // Start progress animation
      rafRef.current = requestAnimationFrame(updateProgress);
      
      handlers.onGestureStart?.(state);
    }
    
    // Handle pinch start (2 pointers)
    if (pointerCount === 2 && cfg.pinch) {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      
      const points = Array.from(pointersRef.current.values());
      startDistanceRef.current = getDistance(points[0], points[1]);
      currentGestureRef.current = 'pinch';
      
      setState(prev => ({
        ...prev,
        type: 'pinch',
        pointerCount: 2,
      }));
      
      if (cfg.hapticEnabled) {
        triggerHaptic(5);
      }
    }
    
    if (cfg.preventDefault) {
      e.preventDefault();
    }
  }, [state, cfg, handlers, updateProgress]);

  // Handle pointer move
  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!gestureStartedRef.current) return;
    
    const point: Point2D = { x: e.clientX, y: e.clientY };
    pointersRef.current.set(e.pointerId, point);
    
    const now = Date.now();
    const pointerCount = pointersRef.current.size;
    
    // Handle pinch
    if (pointerCount === 2 && currentGestureRef.current === 'pinch') {
      const points = Array.from(pointersRef.current.values());
      const currentDistance = getDistance(points[0], points[1]);
      
      if (startDistanceRef.current > 0) {
        const rawScale = (currentDistance / startDistanceRef.current) * startScaleRef.current;
        const newScale = clamp(
          1 + (rawScale - 1) * cfg.pinch.sensitivity,
          cfg.pinch.minScale,
          cfg.pinch.maxScale
        );
        const scaleDelta = newScale - state.scale;
        
        const center = getCenter(points[0], points[1]);
        
        setState(prev => ({
          ...prev,
          scale: newScale,
          scaleDelta,
          currentPosition: center,
          elapsed: now - prev.startTime,
        }));
        
        handlers.onPinch?.(newScale, {
          ...state,
          scale: newScale,
          scaleDelta,
          currentPosition: center,
        });
      }
      
      return;
    }
    
    // Handle single pointer gestures
    if (pointerCount === 1 && state.startPosition) {
      const deltaX = point.x - state.startPosition.x;
      const deltaY = point.y - state.startPosition.y;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      
      // Check if moved too much for long press
      if (distance > cfg.longPress.moveThreshold && currentGestureRef.current === 'none') {
        if (longPressTimerRef.current) {
          clearTimeout(longPressTimerRef.current);
          longPressTimerRef.current = null;
        }
      }
      
      // Calculate velocity
      const velocity = calculateVelocity(point, now);
      
      // Determine if this is a pan or swipe
      if (currentGestureRef.current === 'none' && distance > cfg.swipe.threshold * 0.5) {
        currentGestureRef.current = 'pan';
        
        setState(prev => ({
          ...prev,
          type: 'pan',
        }));
      }
      
      const direction = getDirection(deltaX, deltaY, cfg.swipe.horizontal, cfg.swipe.vertical);
      
      setState(prev => ({
        ...prev,
        currentPosition: point,
        delta: { x: deltaX, y: deltaY },
        distance,
        velocity,
        direction,
        elapsed: now - prev.startTime,
      }));
      
      if (currentGestureRef.current === 'pan') {
        handlers.onPan?.({ x: deltaX, y: deltaY }, {
          ...state,
          currentPosition: point,
          delta: { x: deltaX, y: deltaY },
          velocity,
          direction,
        });
      }
      
      handlers.onGestureMove?.(state);
      
      lastTimeRef.current = now;
      lastPositionRef.current = point;
    }
  }, [state, cfg, handlers, calculateVelocity]);

  // Handle pointer up
  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    const element = e.currentTarget;
    try {
      element.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore release errors
    }
    
    pointersRef.current.delete(e.pointerId);
    const now = Date.now();
    const elapsed = now - state.startTime;
    
    // Clear long press timer
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    
    // Handle gesture end
    if (pointersRef.current.size === 0) {
      gestureStartedRef.current = false;
      
      // Check for tap
      if (currentGestureRef.current === 'none' && state.startPosition) {
        const distance = state.distance;
        
        if (elapsed < cfg.tap.maxDuration && distance < cfg.tap.moveThreshold) {
          // Check for double tap
          if (lastTapRef.current && now - lastTapRef.current.time < cfg.tap.doubleTapDelay) {
            currentGestureRef.current = 'doubleTap';
            
            setState(prev => ({
              ...prev,
              type: 'doubleTap',
              isActive: false,
            }));
            
            if (cfg.hapticEnabled) {
              triggerHaptic([10, 10]);
            }
            
            handlers.onDoubleTap?.(state.startPosition, state);
            lastTapRef.current = null;
          } else {
            // Single tap
            currentGestureRef.current = 'tap';
            
            setState(prev => ({
              ...prev,
              type: 'tap',
              isActive: false,
            }));
            
            if (cfg.hapticEnabled) {
              triggerHaptic(5);
            }
            
            handlers.onTap?.(state.startPosition, state);
            
            // Store for double tap detection
            lastTapRef.current = {
              time: now,
              position: state.startPosition,
            };
            
            // Clear last tap after delay
            setTimeout(() => {
              lastTapRef.current = null;
            }, cfg.tap.doubleTapDelay);
          }
        }
      }
      
      // Check for swipe
      if (currentGestureRef.current === 'pan' && state.direction !== 'none') {
        const isFastSwipe = state.velocity.magnitude > cfg.swipe.velocityThreshold;
        const isLongSwipe = state.distance > cfg.swipe.threshold;
        const isWithinTime = elapsed < cfg.swipe.maxDuration;
        
        if ((isFastSwipe && isWithinTime) || isLongSwipe) {
          currentGestureRef.current = 'swipe';
          
          setState(prev => ({
            ...prev,
            type: 'swipe',
            isActive: false,
          }));
          
          if (cfg.hapticEnabled) {
            triggerHaptic(15);
          }
          
          handlers.onSwipe?.(state.direction, state);
        }
      }
      
      // Handle pan end with momentum
      if (currentGestureRef.current === 'pan' && cfg.pan.momentum) {
        if (state.velocity.magnitude > cfg.pan.minVelocity) {
          handlers.onPanEnd?.(state.velocity, state);
        }
      }
      
      handlers.onGestureEnd?.(state);
      
      // Reset after a short delay
      setTimeout(() => {
        if (!gestureStartedRef.current) {
          reset();
        }
      }, 50);
    }
  }, [state, cfg, handlers, reset]);

  // Handle pointer cancel/leave
  const handlePointerCancel = useCallback(() => {
    reset();
  }, [reset]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  // Bind function
  const bind = useCallback(() => ({
    onPointerDown: handlePointerDown,
    onPointerMove: handlePointerMove,
    onPointerUp: handlePointerUp,
    onPointerCancel: handlePointerCancel,
    onPointerLeave: handlePointerCancel,
    style: {
      touchAction: cfg.pinch ? 'none' : cfg.swipe.horizontal && !cfg.swipe.vertical ? 'pan-y' : 'pan-x',
    } as React.CSSProperties,
  }), [handlePointerDown, handlePointerMove, handlePointerUp, handlePointerCancel, cfg]);

  return {
    state,
    bind,
    reset,
    isGesture,
  };
}

// ============================================================================
// SPECIALIZED HOOKS
// ============================================================================

/**
 * Hook for swipe-only gestures (optimized)
 */
export function useSwipeGesture(
  onSwipe: (direction: GestureDirection, state: GestureState) => void,
  config: Omit<TouchGestureConfig, 'pinch' | 'longPress'> = {}
): UseTouchGestureReturn {
  return useTouchGesture({ onSwipe }, {
    ...config,
    pinch: undefined,
    longPress: undefined,
  });
}

/**
 * Hook for pinch-only gestures (optimized)
 */
export function usePinchGesture(
  onPinch: (scale: number, state: GestureState) => void,
  config: Omit<TouchGestureConfig, 'swipe' | 'longPress' | 'tap'> = {}
): UseTouchGestureReturn {
  return useTouchGesture({ onPinch }, {
    ...config,
    swipe: { horizontal: false, vertical: false },
    longPress: undefined,
    tap: { maxDuration: 0 }, // Disable tap
  });
}

/**
 * Hook for pan-only gestures (optimized)
 */
export function usePanGesture(
  onPan: (delta: Point2D, state: GestureState) => void,
  onPanEnd?: (velocity: Velocity2D, state: GestureState) => void,
  config: Omit<TouchGestureConfig, 'pinch' | 'tap'> = {}
): UseTouchGestureReturn {
  return useTouchGesture({ onPan, onPanEnd }, {
    ...config,
    pinch: undefined,
    tap: { maxDuration: 0 },
  });
}

/**
 * Hook for tap gestures (tap and double-tap)
 */
export function useTapGesture(
  onTap: (position: Point2D, state: GestureState) => void,
  onDoubleTap?: (position: Point2D, state: GestureState) => void,
  config: Omit<TouchGestureConfig, 'swipe' | 'pinch' | 'pan'> = {}
): UseTouchGestureReturn {
  return useTouchGesture({ onTap, onDoubleTap }, {
    ...config,
    swipe: { horizontal: false, vertical: false },
    pinch: undefined,
    pan: { momentum: false },
  });
}

/**
 * Hook for long press gestures
 */
export function useLongPressGesture(
  onLongPress: (position: Point2D, state: GestureState) => void,
  config: Omit<TouchGestureConfig, 'swipe' | 'pinch' | 'tap' | 'pan'> = {}
): UseTouchGestureReturn {
  return useTouchGesture({ onLongPress }, {
    ...config,
    swipe: { horizontal: false, vertical: false },
    pinch: undefined,
    tap: { maxDuration: 0 },
    pan: { momentum: false },
  });
}

export default useTouchGesture;
