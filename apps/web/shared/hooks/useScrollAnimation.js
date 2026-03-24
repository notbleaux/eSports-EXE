/**
 * NJZ Platform v2 - useScrollAnimation Hook
 * Scroll-triggered animations with GSAP ScrollTrigger
 * 
 * @version 2.0.0
 * @requires gsap, @gsap/react
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register plugin
gsap.registerPlugin(ScrollTrigger);

/**
 * Hook for scroll-triggered animations
 * @param {Object} options - Configuration options
 * @returns {Object} Refs and controls
 * 
 * @example
 * const { ref, trigger } = useScrollAnimation({
 *   animation: { y: 50, opacity: 0 },
 *   to: { y: 0, opacity: 1 },
 *   start: 'top 80%',
 * });
 */
export function useScrollAnimation(options = {}) {
  const {
    // Animation config
    from = { opacity: 0, y: 50 },
    to = { opacity: 1, y: 0 },
    duration = 0.8,
    ease = 'power2.out',
    delay = 0,
    
    // ScrollTrigger config
    start = 'top 80%',
    end = 'bottom 20%',
    scrub = false,
    toggleActions = 'play none none reverse',
    markers = false,
    
    // Trigger config
    trigger = null,
    
    // Callbacks
    onEnter,
    onLeave,
    onEnterBack,
    onLeaveBack,
  } = options;

  const elementRef = useRef(null);
  const triggerRef = useRef(null);
  const animationRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    const triggerElement = trigger || element;
    
    if (!element || !triggerElement) return;

    // Set initial state
    gsap.set(element, from);

    // Create animation
    animationRef.current = gsap.to(element, {
      ...to,
      duration,
      ease,
      delay,
      scrollTrigger: {
        trigger: triggerElement,
        start,
        end,
        scrub,
        toggleActions,
        markers,
        onEnter,
        onLeave,
        onEnterBack,
        onLeaveBack,
      },
    });

    return () => {
      if (animationRef.current) {
        animationRef.current.scrollTrigger?.kill();
        animationRef.current.kill();
      }
    };
  }, []);

  return {
    ref: elementRef,
    trigger: triggerRef,
    animation: animationRef,
  };
}

/**
 * Hook for parallax scrolling effect
 * @param {number} speed - Parallax speed (0.1 to 1)
 * @param {Object} options - Additional options
 * @returns {Object} Ref
 * 
 * @example
 * const { ref } = useParallax(0.3);
 */
export function useParallax(speed = 0.3, options = {}) {
  const { scrub = true } = options;
  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const animation = gsap.to(element, {
      yPercent: speed * 100,
      ease: 'none',
      scrollTrigger: {
        trigger: element,
        start: 'top bottom',
        end: 'bottom top',
        scrub,
      },
    });

    return () => {
      animation.scrollTrigger?.kill();
      animation.kill();
    };
  }, [speed, scrub]);

  return { ref: elementRef };
}

/**
 * Hook for pinning element during scroll
 * @param {Object} options - Pin configuration
 * @returns {Object} Ref
 * 
 * @example
 * const { ref } = usePin({
 *   start: 'top top',
 *   end: '+=500',
 * });
 */
export function usePin(options = {}) {
  const {
    start = 'top top',
    end = '+=500',
    pinSpacing = true,
    onEnter,
    onLeave,
  } = options;

  const elementRef = useRef(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const trigger = ScrollTrigger.create({
      trigger: element,
      start,
      end,
      pin: true,
      pinSpacing,
      onEnter,
      onLeave,
    });

    return () => {
      trigger.kill();
    };
  }, [start, end, pinSpacing]);

  return { ref: elementRef };
}

/**
 * Hook for scroll progress tracking
 * @param {Object} options - Configuration options
 * @returns {Object} Ref and progress value
 * 
 * @example
 * const { ref, progress } = useScrollProgress();
 */
export function useScrollProgress(options = {}) {
  const { onProgress } = options;
  const elementRef = useRef(null);
  const progressRef = useRef(0);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const trigger = ScrollTrigger.create({
      trigger: element,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        progressRef.current = self.progress;
        onProgress?.(self.progress);
      },
    });

    return () => {
      trigger.kill();
    };
  }, [onProgress]);

  return {
    ref: elementRef,
    get progress() {
      return progressRef.current;
    },
  };
}

/**
 * Hook for revealing multiple elements on scroll
 * @param {number} count - Number of elements
 * @param {Object} options - Animation options
 * @returns {Object} Refs array and container ref
 * 
 * @example
 * const { containerRef, refs } = useStaggerReveal(5, { stagger: 0.1 });
 */
export function useStaggerReveal(count, options = {}) {
  const {
    from = { opacity: 0, y: 30 },
    to = { opacity: 1, y: 0 },
    duration = 0.6,
    stagger = 0.1,
    ease = 'power2.out',
    start = 'top 80%',
  } = options;

  const containerRef = useRef(null);
  const refs = useRef(Array(count).fill(null).map(() => ({ current: null })));

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = refs.current.map((ref) => ref.current).filter(Boolean);
    if (elements.length === 0) return;

    gsap.set(elements, from);

    const animation = gsap.to(elements, {
      ...to,
      duration,
      stagger,
      ease,
      scrollTrigger: {
        trigger: container,
        start,
        toggleActions: 'play none none reverse',
      },
    });

    return () => {
      animation.scrollTrigger?.kill();
      animation.kill();
    };
  }, [count]);

  return {
    containerRef,
    refs: refs.current,
  };
}

/**
 * Hook for horizontal scroll animation
 * @param {Object} options - Configuration options
 * @returns {Object} Container and track refs
 */
export function useHorizontalScroll(options = {}) {
  const {
    sections = 3,
    duration = 1,
    ease = 'none',
  } = options;

  const containerRef = useRef(null);
  const trackRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const scrollWidth = track.scrollWidth - window.innerWidth;

    const animation = gsap.to(track, {
      x: -scrollWidth,
      ease,
      scrollTrigger: {
        trigger: container,
        pin: true,
        scrub: 1,
        end: () => `+=${scrollWidth}`,
      },
    });

    return () => {
      animation.scrollTrigger?.kill();
      animation.kill();
    };
  }, [sections, duration]);

  return {
    containerRef,
    trackRef,
  };
}

export default useScrollAnimation;
