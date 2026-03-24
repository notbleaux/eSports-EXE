/**
 * Animation System - Framer Motion configurations
 */

export const animation = {
  // Durations (in seconds)
  duration: {
    micro: 0.15,
    fast: 0.2,
    standard: 0.3,
    slow: 0.5,
    dramatic: 0.8,
  },
  
  // Easing functions
  easing: {
    smooth: [0.4, 0, 0.2, 1],
    bounce: [0.68, -0.55, 0.265, 1.55],
    linear: [0, 0, 1, 1],
    dramatic: [0.87, 0, 0.13, 1],
  },
};

// Common Framer Motion variants
export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
};

export const hoverScale = {
  rest: { scale: 1 },
  hover: { scale: 1.02, transition: { duration: 0.15 } },
};

export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const pulseGlow = {
  animate: {
    boxShadow: [
      '0 0 0px rgba(255, 70, 85, 0)',
      '0 0 20px rgba(255, 70, 85, 0.6)',
      '0 0 0px rgba(255, 70, 85, 0)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

export default animation;
