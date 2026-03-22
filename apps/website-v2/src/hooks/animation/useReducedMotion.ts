/** [Ver001.000]
 * useReducedMotion Hook
 * 
 * Detects and responds to the user's prefers-reduced-motion preference.
 * Essential for accessibility compliance and respecting user preferences.
 * 
 * Features:
 * - Detects system-level reduced motion preference
 * - Supports forced reduced motion (e.g., for performance reasons)
 * - Provides instant alternative for reduced motion users
 * - SSR-safe (works during server-side rendering)
 * 
 * @example
 * ```tsx
 * function AnimatedComponent() {
 *   const { prefersReducedMotion, enabled } = useReducedMotion();
 *   
 *   return (
 *     <motion.div
 *       animate={enabled ? { scale: 1.1 } : {}}
 *       transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
 *     />
 *   );
 * }
 * ```
 */

import { useState, useEffect, useCallback } from 'react';
import type { ReducedMotionState, AnimationAccessibility } from '@/types/animation';

// Global cache for reduced motion query to avoid creating multiple listeners
let mediaQuery: MediaQueryList | null = null;

/**
 * Get the reduced motion media query (cached)
 */
const getMediaQuery = (): MediaQueryList | null => {
  if (typeof window === 'undefined') return null;
  
  if (!mediaQuery) {
    mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  }
  
  return mediaQuery;
};

/**
 * Check if reduced motion is preferred (works during SSR)
 */
const checkReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const mq = getMediaQuery();
  return mq?.matches ?? false;
};

/**
 * React hook for detecting and responding to reduced motion preferences.
 * 
 * @param forcedReducedMotion - Optional override to force reduced motion
 * @returns Object containing reduced motion state and helpers
 */
export type UseReducedMotionReturn = ReducedMotionState & AnimationAccessibility;

export function useReducedMotion(
  forcedReducedMotion: boolean = false
): UseReducedMotionReturn {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => 
    checkReducedMotion()
  );
  
  // Combined state: animation is disabled if user prefers reduced motion OR if forced
  const enabled = !prefersReducedMotion && !forcedReducedMotion;
  
  // Determine alternative animation strategy
  const alternative: AnimationAccessibility['alternative'] = prefersReducedMotion 
    ? 'instant' 
    : forcedReducedMotion 
      ? 'subtle' 
      : 'none';
  
  useEffect(() => {
    const mq = getMediaQuery();
    if (!mq) return;
    
    // Update state when media query changes
    const handleChange = (event: MediaQueryListEvent): void => {
      setPrefersReducedMotion(event.matches);
    };
    
    // Modern API (addEventListener)
    if (mq.addEventListener) {
      mq.addEventListener('change', handleChange);
      return () => mq.removeEventListener('change', handleChange);
    } 
    // Legacy API (addListener) for older browsers
    else {
      mq.addListener(handleChange);
      return () => mq.removeListener(handleChange);
    }
  }, []);
  
  return {
    prefersReducedMotion,
    forcedReducedMotion,
    enabled,
    alternative,
  };
}

/**
 * Hook to get animation duration adjusted for reduced motion.
 * 
 * @param normalDuration - The normal animation duration in seconds
 * @returns Adjusted duration (0 for reduced motion, original otherwise)
 */
export function useAccessibleDuration(normalDuration: number): number {
  const { enabled, alternative } = useReducedMotion();
  
  if (!enabled) {
    return alternative === 'instant' ? 0 : normalDuration * 0.5;
  }
  
  return normalDuration;
}

/**
 * Hook to conditionally apply animation properties.
 * 
 * @returns Object with helper functions for conditional animations
 */
export function useConditionalAnimation() {
  const { enabled, alternative, prefersReducedMotion } = useReducedMotion();
  
  /**
   * Conditionally apply a value based on motion preference
   */
  const conditional = useCallback(<T,>(
    animatedValue: T,
    staticValue?: T
  ): T | undefined => {
    if (!enabled) {
      return staticValue;
    }
    return animatedValue;
  }, [enabled]);
  
  /**
   * Get transition duration adjusted for accessibility
   */
  const getDuration = useCallback((
    normalDuration: number,
    options?: { instant?: number; subtle?: number }
  ): number => {
    if (!enabled) {
      if (alternative === 'instant') {
        return options?.instant ?? 0;
      }
      return options?.subtle ?? normalDuration * 0.5;
    }
    return normalDuration;
  }, [enabled, alternative]);
  
  /**
   * Check if a specific animation type should be enabled
   */
  const shouldAnimate = useCallback((
    type: 'scale' | 'translate' | 'rotate' | 'opacity' | 'complex'
  ): boolean => {
    if (!enabled) return false;
    
    // For reduced motion, only allow opacity changes
    if (prefersReducedMotion) {
      return type === 'opacity';
    }
    
    return true;
  }, [enabled, prefersReducedMotion]);
  
  return {
    enabled,
    alternative,
    prefersReducedMotion,
    conditional,
    getDuration,
    shouldAnimate,
  };
}

export default useReducedMotion;
