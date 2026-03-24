/** [Ver001.000]
 * useMascotAnimation Hook
 * =======================
 * Custom hook for managing mascot animations with accessibility support.
 * Integrates with Framer Motion and respects reduced motion preferences.
 */

import { useMemo } from 'react';
import type { Variants, Transition } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';
import type { GalleryCardSize, MascotAnimationConfig } from '../types';

// ============================================================================
// Default Animation Configuration
// ============================================================================

const DEFAULT_CONFIG: MascotAnimationConfig = {
  entranceDuration: 0.24,
  hoverDuration: 0.2,
  transitionDuration: 0.2,
  staggerDelay: 0.05,
  springStiffness: 400,
  springDamping: 30,
};

// ============================================================================
// Hook Options Interface
// ============================================================================

export interface UseMascotAnimationOptions {
  config?: Partial<MascotAnimationConfig>;
  cardSize?: GalleryCardSize;
  index?: number;
  enabled?: boolean;
}

// ============================================================================
// Hook Return Interface
// ============================================================================

export interface UseMascotAnimationReturn {
  // Framer Motion Variants
  cardVariants: Variants;
  imageVariants: Variants;
  contentVariants: Variants;
  glowVariants: Variants;
  
  // Transition presets
  springTransition: Transition;
  smoothTransition: Transition;
  instantTransition: Transition;
  
  // Accessibility
  shouldAnimate: boolean;
  prefersReducedMotion: boolean;
  
  // Stagger delay for this item
  staggerDelay: number;
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMascotAnimation(
  options: UseMascotAnimationOptions = {}
): UseMascotAnimationReturn {
  const {
    config = {},
    index = 0,
    enabled = true,
  } = options;

  // Merge with defaults
  const animationConfig: MascotAnimationConfig = {
    ...DEFAULT_CONFIG,
    ...config,
  };

  // Check reduced motion preference
  const { enabled: motionEnabled, prefersReducedMotion } = useReducedMotion();
  const shouldAnimate = enabled && motionEnabled;

  // Calculate stagger delay based on index
  const staggerDelay = useMemo(() => {
    if (!shouldAnimate) return 0;
    return index * animationConfig.staggerDelay;
  }, [index, animationConfig.staggerDelay, shouldAnimate]);

  // ============================================================================
  // Transition Presets
  // ============================================================================

  const springTransition: Transition = useMemo(() => ({
    type: 'spring',
    stiffness: animationConfig.springStiffness,
    damping: animationConfig.springDamping,
  }), [animationConfig.springStiffness, animationConfig.springDamping]);

  const smoothTransition: Transition = useMemo(() => ({
    duration: animationConfig.transitionDuration,
    ease: [0, 0, 0.2, 1], // cubic-bezier from Style Brief v2
  }), [animationConfig.transitionDuration]);

  const instantTransition: Transition = useMemo(() => ({
    duration: 0,
  }), []);

  // ============================================================================
  // Card Variants
  // ============================================================================

  const cardVariants: Variants = useMemo(() => {
    if (!shouldAnimate) {
      return {
        initial: {},
        animate: {},
        hover: {},
        tap: {},
      };
    }

    return {
      initial: {
        opacity: 0,
        y: 12,
        scale: 0.98,
      },
      animate: {
        opacity: 1,
        y: 0,
        scale: 1,
        transition: {
          ...smoothTransition,
          delay: staggerDelay,
        },
      },
      hover: {
        y: -6,
        scale: 1.02,
        transition: {
          duration: animationConfig.hoverDuration,
          ease: 'easeOut',
        },
      },
      tap: {
        scale: 0.98,
        transition: {
          duration: 0.1,
        },
      },
    };
  }, [shouldAnimate, smoothTransition, staggerDelay, animationConfig.hoverDuration]);

  // ============================================================================
  // Image Variants
  // ============================================================================

  const imageVariants: Variants = useMemo(() => {
    if (!shouldAnimate) {
      return {
        initial: {},
        animate: {},
        hover: {},
      };
    }

    return {
      initial: {
        scale: 1,
      },
      animate: {
        scale: 1,
        transition: smoothTransition,
      },
      hover: {
        scale: 1.1,
        transition: {
          duration: animationConfig.hoverDuration,
          ease: 'easeOut',
        },
      },
    };
  }, [shouldAnimate, smoothTransition, animationConfig.hoverDuration]);

  // ============================================================================
  // Content Variants
  // ============================================================================

  const contentVariants: Variants = useMemo(() => {
    if (!shouldAnimate) {
      return {
        initial: {},
        animate: {},
      };
    }

    return {
      initial: {
        opacity: 0,
        y: 8,
      },
      animate: {
        opacity: 1,
        y: 0,
        transition: {
          ...smoothTransition,
          delay: staggerDelay + 0.05,
        },
      },
    };
  }, [shouldAnimate, smoothTransition, staggerDelay]);

  // ============================================================================
  // Glow Variants
  // ============================================================================

  const glowVariants: Variants = useMemo(() => {
    if (!shouldAnimate) {
      return {
        initial: {},
        animate: {},
        hover: {},
      };
    }

    return {
      initial: {
        opacity: 0,
        scale: 0.8,
      },
      animate: {
        opacity: 1,
        scale: 1,
        transition: {
          ...smoothTransition,
          delay: staggerDelay + 0.1,
        },
      },
      hover: {
        opacity: 1,
        scale: 1.15,
        transition: {
          duration: animationConfig.hoverDuration,
          ease: 'easeOut',
        },
      },
    };
  }, [shouldAnimate, smoothTransition, staggerDelay, animationConfig.hoverDuration]);

  // ============================================================================
  // Return
  // ============================================================================

  return {
    cardVariants,
    imageVariants,
    contentVariants,
    glowVariants,
    springTransition,
    smoothTransition,
    instantTransition,
    shouldAnimate,
    prefersReducedMotion,
    staggerDelay,
  };
}

export default useMascotAnimation;
