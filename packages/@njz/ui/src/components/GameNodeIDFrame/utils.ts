/**
 * GameNodeIDFrame Utilities
 * 
 * Helper functions for quarter configuration and data handling.
 * 
 * @see SPEC-TD-P3-001 for full specification
 */

import type { Quarter, QuarterId } from './types';
import { DEFAULT_QUARTERS } from './constants';

/**
 * Deep merge default quarters with user-provided overrides.
 * 
 * @param defaults - Default quarter configurations
 * @param overrides - User-provided overrides (partial)
 * @returns Merged quarter configurations
 * 
 * @example
 * ```typescript
 * const quarters = mergeQuarters(DEFAULT_QUARTERS, {
 *   SATOR: { name: 'Custom Analytics' }
 * });
 * ```
 */
export function mergeQuarters(
  defaults: Record<QuarterId, Quarter>,
  overrides?: Partial<Record<QuarterId, Partial<Quarter>>>
): Record<QuarterId, Quarter> {
  if (!overrides) {
    return { ...defaults };
  }

  const merged = { ...defaults };

  for (const quarterId of Object.keys(overrides) as QuarterId[]) {
    const override = overrides[quarterId];
    if (override && merged[quarterId]) {
      merged[quarterId] = {
        ...merged[quarterId],
        ...override,
        // Deep merge color if provided
        color: override.color
          ? { ...merged[quarterId].color, ...override.color }
          : merged[quarterId].color,
      };
    }
  }

  return merged;
}

/**
 * Check if reduced motion is preferred.
 * Returns true if user prefers reduced motion.
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Get animation duration based on user preference.
 * Returns 0 if reduced motion is preferred.
 * 
 * @param duration - Default duration in milliseconds
 * @returns Duration to use (0 if reduced motion preferred)
 */
export function getAnimationDuration(duration: number): number {
  return prefersReducedMotion() ? 0 : duration;
}
