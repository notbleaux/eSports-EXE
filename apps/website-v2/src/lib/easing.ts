/** [Ver001.000]
 * Easing Functions Library
 * 
 * Fluid dynamics-inspired easing functions for the 4NJZ4 TENET Platform.
 * All easings are designed to create smooth, organic motion that respects
 * the platform's aesthetic while maintaining 60fps performance.
 * 
 * Key Principles:
 * - Use CSS transforms and opacity only (GPU acceleration)
 * - Viscous easing creates "overshoot + settle" effect
 * - Fluid easing provides smooth, natural deceleration
 */

import type { CubicBezier, EasingFunction, EasingPresets } from '@/types/animation';

// ============================================================================
// Cubic Bezier Presets
// ============================================================================

/**
 * Smooth, fluid motion - the default for most UI transitions.
 * Creates a gentle ease-out effect that feels natural.
 * 
 * Use for: Cards, panels, general UI elements
 */
export const fluid: CubicBezier = [0.4, 0, 0.2, 1];

/**
 * Slow, smoke-like motion - gradual acceleration and deceleration.
 * Creates an ethereal, floating effect.
 * 
 * Use for: Background elements, ambient animations
 */
export const smoke: CubicBezier = [0.25, 0.1, 0.25, 1];

/**
 * Dramatic, deep motion - slow start, fast middle, slow end.
 * Creates a sense of depth and weight.
 * 
 * Use for: Modals, important reveals, dramatic entrances
 */
export const abyss: CubicBezier = [0.7, 0, 0.3, 1];

/**
 * Bouncy spring motion - overshoots then settles.
 * Creates a playful, energetic feel.
 * 
 * Use for: Buttons, interactive elements, success states
 */
export const spring: CubicBezier = [0.34, 1.56, 0.64, 1];

// ============================================================================
// Custom Easing Functions
// ============================================================================

/**
 * Viscous easing - creates an "overshoot + settle" effect.
 * Mathematically models a viscous fluid's resistance to motion.
 * 
 * The formula uses a quadratic ease-out with a slight overshoot
 * that settles back to 1.0, creating a liquid-like motion.
 * 
 * @param t - Progress value from 0 to 1
 * @returns Eased value from 0 to 1
 * 
 * Use for: Spring animations, liquid effects, organic motion
 * 
 * @example
 * ```typescript
 * const progress = viscous(0.5); // Returns ~0.825
 * ```
 */
export const viscous: EasingFunction = (t: number): number => {
  // Clamp input to valid range
  const clampedT = Math.max(0, Math.min(1, t));
  // Quadratic ease-out with slight overshoot (1.1x)
  // Then clamp result to not exceed 1.0
  return Math.min(1.1 * clampedT * (2 - clampedT), 1);
};

/**
 * Elastic easing - creates a bouncy, rubber-band effect.
 * Useful for attention-grabbing animations.
 * 
 * @param t - Progress value from 0 to 1
 * @returns Eased value that may briefly exceed 0-1 range
 */
export const elastic: EasingFunction = (t: number): number => {
  const clampedT = Math.max(0, Math.min(1, t));
  const c4 = (2 * Math.PI) / 3;
  
  if (clampedT === 0) return 0;
  if (clampedT === 1) return 1;
  
  return Math.pow(2, -10 * clampedT) * Math.sin((clampedT * 10 - 0.75) * c4) + 1;
};

/**
 * Expo easing - exponential acceleration/deceleration.
 * Creates a sharp, modern feel.
 * 
 * @param t - Progress value from 0 to 1
 * @returns Eased value from 0 to 1
 */
export const expoOut: EasingFunction = (t: number): number => {
  const clampedT = Math.max(0, Math.min(1, t));
  return clampedT === 1 ? 1 : 1 - Math.pow(2, -10 * clampedT);
};

/**
 * Circ easing - circular acceleration/deceleration.
 * Creates a smooth, rounded motion.
 * 
 * @param t - Progress value from 0 to 1
 * @returns Eased value from 0 to 1
 */
export const circOut: EasingFunction = (t: number): number => {
  const clampedT = Math.max(0, Math.min(1, t));
  return Math.sqrt(1 - Math.pow(clampedT - 1, 2));
};

/**
 * Back easing - pulls back slightly before moving forward.
 * Creates anticipation before the main motion.
 * 
 * @param t - Progress value from 0 to 1
 * @returns Eased value from 0 to 1 (may go negative briefly)
 */
export const backOut: EasingFunction = (t: number): number => {
  const clampedT = Math.max(0, Math.min(1, t));
  const c1 = 1.70158;
  const c3 = c1 + 1;
  
  return 1 + c3 * Math.pow(clampedT - 1, 3) + c1 * Math.pow(clampedT - 1, 2);
};

// ============================================================================
// Easing Presets Collection
// ============================================================================

/**
 * Complete collection of easing presets for the animation system.
 * Import this object for convenient access to all easings.
 */
export const easings: EasingPresets = {
  fluid,
  smoke,
  abyss,
  spring,
  viscous,
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create a custom cubic bezier easing function.
 * 
 * @param p1x - First control point X (0-1)
 * @param p1y - First control point Y
 * @param p2x - Second control point X (0-1)
 * @param p2y - Second control point Y
 * @returns Cubic bezier array for Framer Motion
 */
export const createBezier = (
  p1x: number,
  p1y: number,
  p2x: number,
  p2y: number
): CubicBezier => [p1x, p1y, p2x, p2y];

/**
 * Create a stepped easing function for discrete animations.
 * 
 * @param steps - Number of steps
 * @returns Easing function that progresses in steps
 */
export const createStepped = (steps: number): EasingFunction => {
  return (t: number): number => {
    const clampedT = Math.max(0, Math.min(1, t));
    return Math.floor(clampedT * steps) / steps;
  };
};

/**
 * Blend two easing functions together.
 * 
 * @param easing1 - First easing function
 * @param easing2 - Second easing function
 * @param ratio - Blend ratio (0 = all easing1, 1 = all easing2)
 * @returns Blended easing function
 */
export const blendEasings = (
  easing1: EasingFunction,
  easing2: EasingFunction,
  ratio: number
): EasingFunction => {
  const clampedRatio = Math.max(0, Math.min(1, ratio));
  return (t: number): number => {
    const v1 = easing1(t);
    const v2 = easing2(t);
    return v1 * (1 - clampedRatio) + v2 * clampedRatio;
  };
};

/**
 * Reverse an easing function (play it backwards).
 * 
 * @param easing - Easing function to reverse
 * @returns Reversed easing function
 */
export const reverseEasing = (easing: EasingFunction): EasingFunction => {
  return (t: number): number => 1 - easing(1 - t);
};

/**
 * Apply an easing to a value range.
 * 
 * @param value - Input value (0-1)
 * @param easing - Easing function to apply
 * @param from - Start of output range
 * @param to - End of output range
 * @returns Eased value mapped to output range
 */
export const applyEasing = (
  value: number,
  easing: EasingFunction,
  from: number = 0,
  to: number = 1
): number => {
  const clampedValue = Math.max(0, Math.min(1, value));
  const easedValue = easing(clampedValue);
  return from + (to - from) * easedValue;
};

// ============================================================================
// Hub-Specific Easings
// ============================================================================

/**
 * Hub-specific easing configurations for consistent theming.
 */
export const hubEasings = {
  /** SATOR (Analytics) - Precise, calculated motion */
  sator: fluid,
  
  /** ROTAS (Simulation) - Dynamic, energetic motion */
  rotas: spring,
  
  /** AREPO (Community) - Warm, inviting motion */
  arepo: smoke,
  
  /** OPERA (Live Events) - Fast, responsive motion */
  opera: expoOut,
  
  /** TENET (Central Hub) - Balanced, neutral motion */
  tenet: circOut,
} as const;

/**
 * Get the appropriate easing for a hub.
 * 
 * @param hubId - The hub identifier
 * @returns Cubic bezier or easing function for the hub
 */
export const getHubEasing = (hubId: keyof typeof hubEasings): CubicBezier | EasingFunction => {
  return hubEasings[hubId];
};

// ============================================================================
// Performance-Optimized Easings
// ============================================================================

/**
 * Linear easing - no acceleration, constant velocity.
 * Best performance, use when motion must be perfectly smooth.
 */
export const linear: CubicBezier = [0, 0, 1, 1];

/**
 * Instant easing - jumps to end state immediately.
 * Use for reduced motion preferences.
 */
export const instant: EasingFunction = (): number => 1;

/**
 * Subtle easing - minimal motion for accessibility.
 * Respects reduced motion while still providing visual feedback.
 */
export const subtle: CubicBezier = [0.4, 0, 0.6, 1];

// Default export for convenience
export default easings;
