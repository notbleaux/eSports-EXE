/** [Ver001.000]
 * useViscousSpring Hook
 * 
 * Implements viscous fluid dynamics-based spring animations.
 * Creates an "overshoot + settle" effect that mimics liquid motion.
 * 
 * Features:
 * - Configurable tension, friction, and mass
 * - Overshoot control for liquid-like behavior
 * - Reduced motion support
 * - GPU-accelerated transforms
 * 
 * The Physics:
 * - Tension: How "stiff" the spring is (higher = faster, more bounce)
 * - Friction: Resistance to motion (higher = quicker settle)
 * - Mass: Weight of the object (higher = slower, more momentum)
 * - Overshoot: How much the animation exceeds the target before settling
 * 
 * @example
 * ```tsx
 * function BouncyCard() {
 *   const { ref, style, isAnimating } = useViscousSpring({
 *     tension: 300,
 *     friction: 30,
 *     overshoot: 0.1,
 *   });
 *   
 *   return (
 *     <div ref={ref} style={style} className="card">
 *       Hover me!
 *     </div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';
import type { ViscousSpringConfig } from '@/types/animation';

// Default configuration for viscous spring
const DEFAULT_CONFIG: ViscousSpringConfig = {
  tension: 300,
  friction: 30,
  mass: 1,
  overshoot: 0.05,
  settleDuration: 0.6,
};

// Physics constants
const FPS = 60;
// FRAME_TIME is kept for reference: 1000 / FPS

interface SpringState {
  position: number;
  velocity: number;
}

export interface UseViscousSpringOptions extends Partial<ViscousSpringConfig> {
  /** Target value for the spring (0-1) */
  target?: number;
  /** Initial value */
  initial?: number;
  /** Callback when animation completes */
  onComplete?: () => void;
  /** Callback on each frame */
  onUpdate?: (value: number) => void;
}

export interface UseViscousSpringReturn {
  /** Current spring value (0-1) */
  value: number;
  /** Whether the spring is currently animating */
  isAnimating: boolean;
  /** Set a new target value */
  setTarget: (target: number) => void;
  /** Immediately set value without animation */
  setValue: (value: number) => void;
  /** Reset to initial value */
  reset: () => void;
}

/**
 * Calculate the next spring state using semi-implicit Euler integration.
 * 
 * @param state - Current position and velocity
 * @param target - Target position
 * @param config - Spring configuration
 * @param dt - Time delta in seconds
 * @returns New spring state
 */
function integrateSpring(
  state: SpringState,
  target: number,
  config: ViscousSpringConfig,
  dt: number
): SpringState {
  const displacement = state.position - target;
  const springForce = -config.tension * displacement;
  const dampingForce = -config.friction * state.velocity;
  const acceleration = (springForce + dampingForce) / config.mass;
  
  // Semi-implicit Euler integration (stable for springs)
  const newVelocity = state.velocity + acceleration * dt;
  const newPosition = state.position + newVelocity * dt;
  
  return {
    position: newPosition,
    velocity: newVelocity,
  };
}

/**
 * Apply overshoot effect to the spring value.
 * 
 * @param value - Current spring value
 * @param target - Target value
 * @param overshoot - Overshoot amount (0-1)
 * @returns Value with overshoot applied
 */
function applyOvershoot(value: number, target: number, overshoot: number): number {
  if (target === 0) return value * (1 - overshoot);
  if (target === 1) {
    const overshootAmount = overshoot * Math.sin(value * Math.PI);
    return value + overshootAmount * (1 - value);
  }
  return value;
}

/**
 * React hook for viscous spring animations.
 * 
 * @param options - Configuration options
 * @returns Spring state and controls
 */
export function useViscousSpring(
  options: UseViscousSpringOptions = {}
): UseViscousSpringReturn {
  const {
    target: initialTarget = 1,
    initial: initialValue = 0,
    onComplete,
    onUpdate,
    ...configOverrides
  } = options;
  
  const config: ViscousSpringConfig = { ...DEFAULT_CONFIG, ...configOverrides };
  const { enabled } = useReducedMotion();
  
  const [value, setValue] = useState<number>(initialValue);
  const [target, setTarget] = useState<number>(initialTarget);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  
  const stateRef = useRef<SpringState>({
    position: initialValue,
    velocity: 0,
  });
  const rafRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  
  // Cancel any ongoing animation
  const cancelAnimation = useCallback((): void => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);
  
  // Start animation loop
  const animate = useCallback((timestamp: number): void => {
    if (!lastTimeRef.current) {
      lastTimeRef.current = timestamp;
    }
    
    // Calculate time delta, capped to prevent large jumps
    const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
    lastTimeRef.current = timestamp;
    
    // Integrate physics
    const newState = integrateSpring(stateRef.current, target, config, dt);
    stateRef.current = newState;
    
    // Apply overshoot effect
    const displayValue = applyOvershoot(
      Math.max(0, Math.min(1, newState.position)),
      target,
      config.overshoot
    );
    
    // Update state
    setValue(displayValue);
    onUpdate?.(displayValue);
    
    // Check for settlement
    const displacement = Math.abs(newState.position - target);
    const isSettled = displacement < 0.001 && Math.abs(newState.velocity) < 0.001;
    
    if (isSettled) {
      // Snap to exact target
      stateRef.current = { position: target, velocity: 0 };
      setValue(target);
      setIsAnimating(false);
      onComplete?.();
    } else {
      rafRef.current = requestAnimationFrame(animate);
    }
  }, [target, config, onComplete, onUpdate]);
  
  // Start animation when target changes
  useEffect(() => {
    if (!enabled) {
      // Skip animation for reduced motion
      setValue(target);
      stateRef.current = { position: target, velocity: 0 };
      return;
    }
    
    // Don't animate if already at target
    if (Math.abs(stateRef.current.position - target) < 0.001) {
      return;
    }
    
    cancelAnimation();
    setIsAnimating(true);
    lastTimeRef.current = 0;
    rafRef.current = requestAnimationFrame(animate);
    
    return cancelAnimation;
  }, [target, enabled, animate, cancelAnimation]);
  
  // Cleanup on unmount
  useEffect(() => {
    return cancelAnimation;
  }, [cancelAnimation]);
  
  // Set target with animation
  const handleSetTarget = useCallback((newTarget: number): void => {
    setTarget(Math.max(0, Math.min(1, newTarget)));
  }, []);
  
  // Set value immediately without animation
  const handleSetValue = useCallback((newValue: number): void => {
    cancelAnimation();
    const clampedValue = Math.max(0, Math.min(1, newValue));
    setValue(clampedValue);
    stateRef.current = { position: clampedValue, velocity: 0 };
    setIsAnimating(false);
  }, [cancelAnimation]);
  
  // Reset to initial value
  const reset = useCallback((): void => {
    handleSetValue(initialValue);
  }, [handleSetValue, initialValue]);
  
  return {
    value,
    isAnimating,
    setTarget: handleSetTarget,
    setValue: handleSetValue,
    reset,
  };
}

/**
 * Hook for viscous spring transform values.
 * Returns CSS transform string based on spring value.
 * 
 * @example
 * ```tsx
 * const { transform, value } = useViscousSpringTransform({
 *   scale: { from: 1, to: 1.05 },
 *   translateY: { from: 0, to: -10 },
 * });
 * ```
 */
export interface TransformConfig {
  scale?: { from: number; to: number };
  translateX?: { from: number; to: number };
  translateY?: { from: number; to: number };
  rotate?: { from: number; to: number };
  opacity?: { from: number; to: number };
}

interface UseViscousSpringTransformReturn {
  transform: string;
  opacity: number | undefined;
  value: number;
  isAnimating: boolean;
  setTarget: (target: number) => void;
}

export function useViscousSpringTransform(
  transformConfig: TransformConfig,
  springOptions: UseViscousSpringOptions = {}
): UseViscousSpringTransformReturn {
  const { value, isAnimating, setTarget } = useViscousSpring(springOptions);
  
  // Build transform string
  const transforms: string[] = [];
  
  if (transformConfig.scale) {
    const scale = transformConfig.scale.from + 
      (transformConfig.scale.to - transformConfig.scale.from) * value;
    transforms.push(`scale(${scale})`);
  }
  
  if (transformConfig.translateX || transformConfig.translateY) {
    const x = transformConfig.translateX 
      ? transformConfig.translateX.from + 
        (transformConfig.translateX.to - transformConfig.translateX.from) * value
      : 0;
    const y = transformConfig.translateY
      ? transformConfig.translateY.from + 
        (transformConfig.translateY.to - transformConfig.translateY.from) * value
      : 0;
    transforms.push(`translate3d(${x}px, ${y}px, 0)`);
  }
  
  if (transformConfig.rotate) {
    const rotate = transformConfig.rotate.from + 
      (transformConfig.rotate.to - transformConfig.rotate.from) * value;
    transforms.push(`rotate(${rotate}deg)`);
  }
  
  // Calculate opacity
  const opacity = transformConfig.opacity
    ? transformConfig.opacity.from + 
      (transformConfig.opacity.to - transformConfig.opacity.from) * value
    : undefined;
  
  return {
    transform: transforms.join(' '),
    opacity,
    value,
    isAnimating,
    setTarget,
  };
}

export default useViscousSpring;
