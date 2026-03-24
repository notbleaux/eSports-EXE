/**
 * NJZ Platform v2 - Animation Utilities
 * GSAP-based animation orchestration
 * 
 * @version 2.0.0
 * @requires gsap
 */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Register GSAP plugins
gsap.registerPlugin(ScrollTrigger);

/**
 * Fade in element(s) with configurable options
 * @param {string|Element|Element[]} target - Target element(s)
 * @param {Object} options - Animation options
 * @returns {gsap.core.Tween} GSAP tween instance
 */
export function fadeIn(target, options = {}) {
  const {
    duration = 0.6,
    delay = 0,
    ease = 'power2.out',
    y = 20,
    stagger = 0,
    onComplete,
  } = options;

  return gsap.fromTo(
    target,
    { opacity: 0, y },
    {
      opacity: 1,
      y: 0,
      duration,
      delay,
      ease,
      stagger,
      onComplete,
    }
  );
}

/**
 * Fade out element(s)
 * @param {string|Element|Element[]} target - Target element(s)
 * @param {Object} options - Animation options
 * @returns {gsap.core.Tween} GSAP tween instance
 */
export function fadeOut(target, options = {}) {
  const {
    duration = 0.4,
    delay = 0,
    ease = 'power2.in',
    y = -10,
    onComplete,
  } = options;

  return gsap.to(target, {
    opacity: 0,
    y,
    duration,
    delay,
    ease,
    onComplete,
  });
}

/**
 * Scale animation for modal/dialog appearances
 * @param {string|Element} target - Target element
 * @param {Object} options - Animation options
 * @returns {gsap.core.Tween} GSAP tween instance
 */
export function scaleIn(target, options = {}) {
  const {
    duration = 0.5,
    delay = 0,
    ease = 'back.out(1.7)',
    onComplete,
  } = options;

  return gsap.fromTo(
    target,
    { opacity: 0, scale: 0.8 },
    {
      opacity: 1,
      scale: 1,
      duration,
      delay,
      ease,
      onComplete,
    }
  );
}

/**
 * Slide animation
 * @param {string|Element} target - Target element
 * @param {string} direction - Slide direction: 'left', 'right', 'up', 'down'
 * @param {Object} options - Animation options
 * @returns {gsap.core.Tween} GSAP tween instance
 */
export function slideIn(target, direction = 'up', options = {}) {
  const directions = {
    left: { x: -50, y: 0 },
    right: { x: 50, y: 0 },
    up: { x: 0, y: 50 },
    down: { x: 0, y: -50 },
  };

  const { x, y } = directions[direction] || directions.up;
  const {
    duration = 0.6,
    delay = 0,
    ease = 'power3.out',
    onComplete,
  } = options;

  return gsap.fromTo(
    target,
    { opacity: 0, x, y },
    {
      opacity: 1,
      x: 0,
      y: 0,
      duration,
      delay,
      ease,
      onComplete,
    }
  );
}

/**
 * Stagger animation for lists/grids
 * @param {string|Element[]} targets - Target elements
 * @param {string} animationType - Type of animation
 * @param {Object} options - Animation options
 * @returns {gsap.core.Tween} GSAP tween instance
 */
export function staggerAnimation(targets, animationType = 'fadeUp', options = {}) {
  const animations = {
    fadeUp: { opacity: 0, y: 30 },
    fadeDown: { opacity: 0, y: -30 },
    fadeLeft: { opacity: 0, x: -30 },
    fadeRight: { opacity: 0, x: 30 },
    scale: { opacity: 0, scale: 0.8 },
  };

  const from = animations[animationType] || animations.fadeUp;
  const {
    duration = 0.5,
    stagger = 0.1,
    ease = 'power2.out',
    onComplete,
  } = options;

  return gsap.fromTo(
    targets,
    from,
    {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration,
      stagger,
      ease,
      onComplete,
    }
  );
}

/**
 * Create scroll-triggered animation
 * @param {string|Element} trigger - Trigger element
 * @param {string|Element} target - Target element (defaults to trigger)
 * @param {Object} animation - Animation configuration
 * @param {Object} options - ScrollTrigger options
 * @returns {ScrollTrigger} ScrollTrigger instance
 */
export function scrollTriggerAnimation(
  trigger,
  target = null,
  animation = {},
  options = {}
) {
  const animTarget = target || trigger;
  const {
    from = { opacity: 0, y: 50 },
    to = { opacity: 1, y: 0 },
    duration = 0.8,
    ease = 'power2.out',
  } = animation;

  const {
    start = 'top 80%',
    end = 'bottom 20%',
    toggleActions = 'play none none reverse',
    scrub = false,
    markers = false,
  } = options;

  return ScrollTrigger.create({
    trigger,
    start,
    end,
    toggleActions,
    scrub,
    markers,
    onEnter: () => {
      gsap.fromTo(animTarget, from, { ...to, duration, ease });
    },
  });
}

/**
 * Parallax effect on scroll
 * @param {string|Element} target - Target element
 * @param {number} speed - Parallax speed (0.1 to 1)
 * @param {Object} options - Additional options
 * @returns {ScrollTrigger} ScrollTrigger instance
 */
export function parallax(target, speed = 0.5, options = {}) {
  const { trigger = target, scrub = true } = options;

  return gsap.to(target, {
    yPercent: speed * 100,
    ease: 'none',
    scrollTrigger: {
      trigger,
      start: 'top bottom',
      end: 'bottom top',
      scrub,
    },
  });
}

/**
 * Pin element during scroll
 * @param {string|Element} target - Target element
 * @param {Object} options - Pin options
 * @returns {ScrollTrigger} ScrollTrigger instance
 */
export function pinElement(target, options = {}) {
  const {
    start = 'top top',
    end = '+=500',
    pinSpacing = true,
    onEnter,
    onLeave,
  } = options;

  return ScrollTrigger.create({
    trigger: target,
    start,
    end,
    pin: true,
    pinSpacing,
    onEnter,
    onLeave,
  });
}

/**
 * Text reveal animation - character by character
 * @param {string|Element} target - Target text element
 * @param {Object} options - Animation options
 * @returns {gsap.core.Timeline} GSAP timeline instance
 */
export function textReveal(target, options = {}) {
  const {
    duration = 0.05,
    stagger = 0.03,
    ease = 'power2.out',
  } = options;

  const element = typeof target === 'string' ? document.querySelector(target) : target;
  const text = element.textContent;
  element.innerHTML = text
    .split('')
    .map((char) => `<span class="char" style="opacity: 0; display: inline-block;">${char === ' ' ? '&nbsp;' : char}</span>`)
    .join('');

  const chars = element.querySelectorAll('.char');
  return gsap.to(chars, {
    opacity: 1,
    y: 0,
    duration,
    stagger,
    ease,
  });
}

/**
 * Magnetic hover effect
 * @param {Element} element - Target element
 * @param {Object} options - Effect options
 */
export function magneticHover(element, options = {}) {
  const { strength = 0.3 } = options;

  const handleMouseMove = (e) => {
    const rect = element.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;

    gsap.to(element, {
      x: x * strength,
      y: y * strength,
      duration: 0.3,
      ease: 'power2.out',
    });
  };

  const handleMouseLeave = () => {
    gsap.to(element, {
      x: 0,
      y: 0,
      duration: 0.5,
      ease: 'elastic.out(1, 0.3)',
    });
  };

  element.addEventListener('mousemove', handleMouseMove);
  element.addEventListener('mouseleave', handleMouseLeave);

  // Return cleanup function
  return () => {
    element.removeEventListener('mousemove', handleMouseMove);
    element.removeEventListener('mouseleave', handleMouseLeave);
  };
}

/**
 * Cleanup all ScrollTrigger instances
 */
export function cleanupAnimations() {
  ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
}

/**
 * Pause all animations
 */
export function pauseAnimations() {
  gsap.globalTimeline.pause();
}

/**
 * Resume all animations
 */
export function resumeAnimations() {
  gsap.globalTimeline.resume();
}

export default {
  fadeIn,
  fadeOut,
  scaleIn,
  slideIn,
  staggerAnimation,
  scrollTriggerAnimation,
  parallax,
  pinElement,
  textReveal,
  magneticHover,
  cleanupAnimations,
  pauseAnimations,
  resumeAnimations,
};
