/**
 * NJZ Platform v2 - Transition Utilities
 * Page transitions and state change animations
 * 
 * @version 2.0.0
 * @requires gsap
 */

import { gsap } from 'gsap';

/**
 * Page transition wrapper
 * Handles enter/exit animations for route changes
 * @param {Element} container - Page container element
 * @param {string} direction - Transition direction
 * @param {Object} options - Transition options
 * @returns {Promise} Resolves when transition completes
 */
export function pageTransition(container, direction = 'in', options = {}) {
  const {
    duration = 0.6,
    ease = 'power3.inOut',
    from = null,
    to = null,
  } = options;

  const directions = {
    in: {
      from: from || { opacity: 0, y: 30 },
      to: to || { opacity: 1, y: 0 },
    },
    out: {
      from: from || { opacity: 1, y: 0 },
      to: to || { opacity: 0, y: -30 },
    },
    left: {
      in: { from: { opacity: 0, x: 50 }, to: { opacity: 1, x: 0 } },
      out: { from: { opacity: 1, x: 0 }, to: { opacity: 0, x: -50 } },
    },
    right: {
      in: { from: { opacity: 0, x: -50 }, to: { opacity: 1, x: 0 } },
      out: { from: { opacity: 1, x: 0 }, to: { opacity: 0, x: 50 } },
    },
    up: {
      in: { from: { opacity: 0, y: 50 }, to: { opacity: 1, y: 0 } },
      out: { from: { opacity: 1, y: 0 }, to: { opacity: 0, y: -50 } },
    },
    down: {
      in: { from: { opacity: 0, y: -50 }, to: { opacity: 1, y: 0 } },
      out: { from: { opacity: 1, y: 0 }, to: { opacity: 0, y: 50 } },
    },
    scale: {
      in: { from: { opacity: 0, scale: 0.9 }, to: { opacity: 1, scale: 1 } },
      out: { from: { opacity: 1, scale: 1 }, to: { opacity: 0, scale: 1.1 } },
    },
    fade: {
      in: { from: { opacity: 0 }, to: { opacity: 1 } },
      out: { from: { opacity: 1 }, to: { opacity: 0 } },
    },
  };

  let animConfig;
  if (direction === 'in' || direction === 'out') {
    animConfig = directions[direction];
  } else if (directions[direction]) {
    animConfig = directions[direction][direction === 'in' || direction === 'out' ? direction : 'in'];
  } else {
    animConfig = directions.in;
  }

  return new Promise((resolve) => {
    gsap.fromTo(
      container,
      animConfig.from,
      {
        ...animConfig.to,
        duration,
        ease,
        onComplete: resolve,
      }
    );
  });
}

/**
 * Staggered content reveal
 * Animates child elements in sequence
 * @param {string|Element[]} elements - Child elements to animate
 * @param {Object} options - Animation options
 * @returns {gsap.core.Timeline} GSAP timeline
 */
export function staggeredReveal(elements, options = {}) {
  const {
    stagger = 0.1,
    duration = 0.5,
    ease = 'power2.out',
    from = { opacity: 0, y: 20 },
    to = { opacity: 1, y: 0 },
    onComplete,
  } = options;

  const tl = gsap.timeline({ onComplete });

  tl.fromTo(
    elements,
    from,
    {
      ...to,
      duration,
      stagger,
      ease,
    }
  );

  return tl;
}

/**
 * Morphing transition between two elements
 * @param {Element} fromEl - Element to transition from
 * @param {Element} toEl - Element to transition to
 * @param {Object} options - Transition options
 * @returns {Promise} Resolves when transition completes
 */
export function morphTransition(fromEl, toEl, options = {}) {
  const {
    duration = 0.5,
    ease = 'power2.inOut',
  } = options;

  return new Promise((resolve) => {
    // Capture initial state
    const fromRect = fromEl.getBoundingClientRect();
    const toRect = toEl.getBoundingClientRect();

    // Create FLIP animation
    const deltaX = toRect.left - fromRect.left;
    const deltaY = toRect.top - fromRect.top;
    const deltaW = toRect.width / fromRect.width;
    const deltaH = toRect.height / fromRect.height;

    // Animate fromEl to toEl position
    const tl = gsap.timeline({
      onComplete: () => {
        fromEl.style.cssText = '';
        toEl.style.opacity = '1';
        resolve();
      },
    });

    tl.to(fromEl, {
      x: deltaX,
      y: deltaY,
      scaleX: deltaW,
      scaleY: deltaH,
      opacity: 0,
      duration,
      ease,
    });

    // Fade in toEl
    gsap.set(toEl, { opacity: 0 });
    tl.to(toEl, {
      opacity: 1,
      duration: duration * 0.5,
    }, `-=${duration * 0.5}`);
  });
}

/**
 * Curtain reveal transition
 * Slides curtains away to reveal content
 * @param {Element} container - Container element
 * @param {Object} options - Transition options
 * @returns {Promise} Resolves when transition completes
 */
export function curtainReveal(container, options = {}) {
  const {
    duration = 0.8,
    ease = 'power3.inOut',
    direction = 'horizontal',
    color = '#0a0a0f',
  } = options;

  return new Promise((resolve) => {
    // Create curtain elements
    const curtain1 = document.createElement('div');
    const curtain2 = document.createElement('div');

    const baseStyles = `
      position: fixed;
      background: ${color};
      z-index: 9999;
      pointer-events: none;
    `;

    if (direction === 'horizontal') {
      curtain1.style.cssText = baseStyles + 'top: 0; left: 0; width: 50%; height: 100%;';
      curtain2.style.cssText = baseStyles + 'top: 0; right: 0; width: 50%; height: 100%;';
    } else {
      curtain1.style.cssText = baseStyles + 'top: 0; left: 0; width: 100%; height: 50%;';
      curtain2.style.cssText = baseStyles + 'bottom: 0; left: 0; width: 100%; height: 50%;';
    }

    document.body.appendChild(curtain1);
    document.body.appendChild(curtain2);

    // Animate curtains
    const tl = gsap.timeline({
      onComplete: () => {
        curtain1.remove();
        curtain2.remove();
        resolve();
      },
    });

    if (direction === 'horizontal') {
      tl.to([curtain1, curtain2], {
        scaleX: 0,
        duration,
        ease,
        transformOrigin: (i) => i === 0 ? 'left center' : 'right center',
      });
    } else {
      tl.to([curtain1, curtain2], {
        scaleY: 0,
        duration,
        ease,
        transformOrigin: (i) => i === 0 ? 'center top' : 'center bottom',
      });
    }
  });
}

/**
 * Glitch transition effect
 * @param {Element} element - Target element
 * @param {Object} options - Transition options
 * @returns {Promise} Resolves when transition completes
 */
export function glitchTransition(element, options = {}) {
  const {
    duration = 0.4,
    intensity = 10,
  } = options;

  return new Promise((resolve) => {
    const originalFilter = element.style.filter;
    
    const tl = gsap.timeline({
      onComplete: () => {
        element.style.filter = originalFilter;
        resolve();
      },
    });

    // Create glitch keyframes
    for (let i = 0; i < 5; i++) {
      const offsetX = (Math.random() - 0.5) * intensity;
      tl.to(element, {
        x: offsetX,
        filter: `hue-rotate(${Math.random() * 360}deg)`,
        duration: duration / 10,
      });
    }

    tl.to(element, {
      x: 0,
      filter: originalFilter,
      duration: duration / 10,
    });
  });
}

/**
 * Smooth scroll to element
 * @param {string|Element} target - Target element or selector
 * @param {Object} options - Scroll options
 * @returns {Promise} Resolves when scroll completes
 */
export function smoothScrollTo(target, options = {}) {
  const {
    duration = 1,
    ease = 'power2.inOut',
    offset = 0,
  } = options;

  const element = typeof target === 'string' ? document.querySelector(target) : target;
  if (!element) return Promise.resolve();

  const targetY = element.getBoundingClientRect().top + window.pageYOffset + offset;

  return new Promise((resolve) => {
    gsap.to(window, {
      scrollTo: { y: targetY },
      duration,
      ease,
      onComplete: resolve,
    });
  });
}

/**
 * Tab panel transition
 * @param {Element} fromPanel - Panel to hide
 * @param {Element} toPanel - Panel to show
 * @param {Object} options - Transition options
 * @returns {Promise} Resolves when transition completes
 */
export function tabTransition(fromPanel, toPanel, options = {}) {
  const {
    duration = 0.3,
    ease = 'power2.out',
  } = options;

  return new Promise((resolve) => {
    const tl = gsap.timeline({ onComplete: resolve });

    if (fromPanel) {
      tl.to(fromPanel, {
        opacity: 0,
        x: -20,
        duration: duration * 0.5,
        ease: 'power2.in',
      });
    }

    gsap.set(toPanel, { opacity: 0, x: 20 });
    tl.to(toPanel, {
      opacity: 1,
      x: 0,
      duration,
      ease,
    }, fromPanel ? `-=${duration * 0.3}` : 0);
  });
}

/**
 * Expand/collapse transition for accordions
 * @param {Element} element - Element to expand/collapse
 * @param {boolean} expand - Whether to expand or collapse
 * @param {Object} options - Transition options
 * @returns {Promise} Resolves when transition completes
 */
export function expandCollapse(element, expand, options = {}) {
  const {
    duration = 0.3,
    ease = 'power2.out',
  } = options;

  return new Promise((resolve) => {
    if (expand) {
      gsap.set(element, { height: 'auto', opacity: 1 });
      const height = element.offsetHeight;
      gsap.set(element, { height: 0, opacity: 0, overflow: 'hidden' });

      gsap.to(element, {
        height,
        opacity: 1,
        duration,
        ease,
        onComplete: () => {
          element.style.height = 'auto';
          element.style.overflow = '';
          resolve();
        },
      });
    } else {
      gsap.to(element, {
        height: 0,
        opacity: 0,
        duration,
        ease,
        onComplete: () => {
          element.style.overflow = '';
          resolve();
        },
      });
    }
  });
}

/**
 * Sequential reveal for lists
 * @param {Element[]} items - List items to reveal
 * @param {Object} options - Animation options
 * @returns {gsap.core.Timeline} GSAP timeline
 */
export function sequentialReveal(items, options = {}) {
  const {
    stagger = 0.08,
    duration = 0.4,
    ease = 'back.out(1.2)',
  } = options;

  gsap.set(items, { opacity: 0, y: 20, scale: 0.95 });

  return gsap.to(items, {
    opacity: 1,
    y: 0,
    scale: 1,
    duration,
    stagger,
    ease,
  });
}

export default {
  pageTransition,
  staggeredReveal,
  morphTransition,
  curtainReveal,
  glitchTransition,
  smoothScrollTo,
  tabTransition,
  expandCollapse,
  sequentialReveal,
};
