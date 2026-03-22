/** [Ver001.000]
 * useScrollReveal Hook
 * 
 * IntersectionObserver-based scroll reveal animations.
 * Efficiently detects when elements enter the viewport and triggers animations.
 * 
 * Features:
 * - Uses native IntersectionObserver (performant)
 * - Configurable threshold and rootMargin
 * - One-time or continuous triggering
 * - Directional reveal animations
 * - Reduced motion support
 * - SSR-safe
 * 
 * @example
 * ```tsx
 * function RevealSection() {
 *   const { ref, isVisible, hasRevealed } = useScrollReveal({
 *     threshold: 0.2,
 *     triggerOnce: true,
 *     direction: 'up',
 *     distance: 50,
 *   });
 *   
 *   return (
 *     <motion.div
 *       ref={ref}
 *       initial={{ opacity: 0, y: 50 }}
 *       animate={isVisible ? { opacity: 1, y: 0 } : {}}
 *       transition={{ duration: 0.6, ease: easings.fluid }}
 *     >
 *       Content revealed on scroll
 *     </motion.div>
 *   );
 * }
 * ```
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useReducedMotion } from './useReducedMotion';
import type { ScrollRevealOptions, ScrollRevealState } from '@/types/animation';

// Default configuration
const DEFAULT_OPTIONS: Required<Omit<ScrollRevealOptions, 'delay' | 'duration'>> = {
  threshold: 0.1,
  rootMargin: '0px',
  triggerOnce: true,
  distance: 30,
  direction: 'up',
};

/**
 * Calculate initial transform based on reveal direction and distance.
 */
function getInitialTransform(
  direction: ScrollRevealOptions['direction'],
  distance: number
): { x?: number; y?: number } {
  switch (direction) {
    case 'up':
      return { y: distance };
    case 'down':
      return { y: -distance };
    case 'left':
      return { x: distance };
    case 'right':
      return { x: -distance };
    default:
      return { y: distance };
  }
}

/**
 * React hook for scroll reveal animations.
 * 
 * @param options - Configuration options
 * @returns Scroll reveal state and ref
 */
export function useScrollReveal(
  options: ScrollRevealOptions = {}
): ScrollRevealState & {
  /** Element ref to attach to the target element */
  ref: React.RefObject<HTMLElement | null>;
  /** Initial animation values for Framer Motion */
  initial: { opacity: number; x?: number; y?: number };
  /** Target animation values for Framer Motion */
  animate: { opacity: number; x?: number; y?: number };
  /** Whether element has been revealed (persists after leaving viewport if triggerOnce) */
  hasRevealed: boolean;
} {
  const config = { ...DEFAULT_OPTIONS, ...options };
  const { enabled } = useReducedMotion();
  
  const [isVisible, setIsVisible] = useState<boolean>(false);
  const [hasRevealed, setHasRevealed] = useState<boolean>(false);
  const ref = useRef<HTMLElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Calculate initial transform values
  const initialTransform = getInitialTransform(config.direction, config.distance);
  
  // Build animation values
  const initial = enabled 
    ? { opacity: 1, x: 0, y: 0 }
    : { opacity: 0, ...initialTransform };
  
  const animate = isVisible || hasRevealed
    ? { opacity: 1, x: 0, y: 0 }
    : initial;
  
  // Cleanup observer
  const cleanup = useCallback((): void => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);
  
  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      // Fallback: immediately show content if IntersectionObserver not available
      setIsVisible(true);
      setHasRevealed(true);
      return;
    }
    
    // If reduced motion, show immediately without observing
    if (!enabled) {
      // Check if element is already in viewport
      const rect = element.getBoundingClientRect();
      const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;
      
      if (isInViewport) {
        setIsVisible(true);
        setHasRevealed(true);
        return;
      }
    }
    
    // Create observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const visible = entry.isIntersecting;
          setIsVisible(visible);
          
          if (visible) {
            setHasRevealed(true);
            
            // Disconnect if triggerOnce
            if (config.triggerOnce && observerRef.current) {
              observerRef.current.disconnect();
            }
          }
        });
      },
      {
        threshold: config.threshold,
        rootMargin: config.rootMargin,
      }
    );
    
    observerRef.current.observe(element);
    
    return cleanup;
  }, [config.threshold, config.rootMargin, config.triggerOnce, enabled, cleanup]);
  
  return {
    isVisible,
    hasRevealed,
    ref,
    initial,
    animate,
  };
}

/**
 * Hook for staggered scroll reveals within a container.
 * 
 * @example
 * ```tsx
 * function StaggeredList() {
 *   const containerRef = useStaggerReveal({ staggerDelay: 0.1 });
 *   
 *   return (
 *     <div ref={containerRef}>
 *       {items.map((item, i) => (
 *         <StaggerItem key={i} index={i}>
 *           {item}
 *         </StaggerItem>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export interface StaggerRevealOptions extends ScrollRevealOptions {
  /** Delay between each item's animation */
  staggerDelay?: number;
  /** Initial delay before starting stagger */
  initialDelay?: number;
}

interface StaggerItemState {
  isVisible: boolean;
  delay: number;
}

export function useStaggerReveal(
  options: StaggerRevealOptions = {}
): {
  containerRef: React.RefObject<HTMLElement | null>;
  getItemProps: (index: number) => StaggerItemState;
} {
  const { staggerDelay = 0.1, initialDelay = 0, ...scrollOptions } = options;
  const { isVisible, ref } = useScrollReveal(scrollOptions);
  
  const getItemProps = useCallback((index: number): StaggerItemState => ({
    isVisible,
    delay: initialDelay + index * staggerDelay,
  }), [isVisible, initialDelay, staggerDelay]);
  
  return {
    containerRef: ref,
    getItemProps,
  };
}

/**
 * Hook for parallax scroll effects.
 * 
 * @example
 * ```tsx
 * function ParallaxSection() {
 *   const { ref, transform } = useParallax({ speed: 0.5 });
 *   
 *   return (
 *     <div ref={ref} style={{ transform }}>
 *       Parallax content
 *     </div>
 *   );
 * }
 * ```
 */
export interface ParallaxOptions {
  /** Parallax speed multiplier (0.1 = slow, 1 = normal, 2 = fast) */
  speed?: number;
  /** Direction of parallax */
  direction?: 'vertical' | 'horizontal';
  /** Maximum offset in pixels */
  maxOffset?: number;
  /** Whether to disable for reduced motion */
  respectReducedMotion?: boolean;
}

interface ParallaxReturn {
  ref: React.RefObject<HTMLElement | null>;
  transform: string;
  offset: number;
}

export function useParallax(options: ParallaxOptions = {}): ParallaxReturn {
  const {
    speed = 0.5,
    direction = 'vertical',
    maxOffset = 200,
    respectReducedMotion = true,
  } = options;
  
  const { prefersReducedMotion } = useReducedMotion();
  const [offset, setOffset] = useState<number>(0);
  const ref = useRef<HTMLElement>(null);
  const rafRef = useRef<number | null>(null);
  
  const isDisabled = respectReducedMotion && prefersReducedMotion;
  
  useEffect(() => {
    if (isDisabled) return;
    
    const handleScroll = (): void => {
      if (rafRef.current !== null) return;
      
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        
        const element = ref.current;
        if (!element) return;
        
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight;
        
        // Calculate how far the element is through the viewport
        const elementCenter = rect.top + rect.height / 2;
        const viewportCenter = windowHeight / 2;
        const distance = elementCenter - viewportCenter;
        
        // Apply speed and clamp
        const rawOffset = distance * speed * -0.1;
        const clampedOffset = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));
        
        setOffset(clampedOffset);
      });
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial calculation
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [speed, maxOffset, isDisabled]);
  
  const transform = isDisabled
    ? 'none'
    : direction === 'vertical'
      ? `translate3d(0, ${offset}px, 0)`
      : `translate3d(${offset}px, 0, 0)`;
  
  return {
    ref,
    transform,
    offset,
  };
}

export default useScrollReveal;
