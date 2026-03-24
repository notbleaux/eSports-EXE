/**
 * NJZ Platform v2 - useFluidTransition Hook
 * Fluid, physics-based transitions using Framer Motion
 * 
 * @version 2.0.0
 * @requires framer-motion
 */

import { useRef, useCallback } from 'react';

/**
 * Spring configuration presets
 */
export const fluidSprings = {
  // Gentle, smooth movement
  gentle: {
    type: 'spring',
    stiffness: 120,
    damping: 14,
    mass: 1,
  },
  // Quick, snappy response
  snappy: {
    type: 'spring',
    stiffness: 400,
    damping: 25,
    mass: 0.8,
  },
  // Heavy, luxurious feel
  luxurious: {
    type: 'spring',
    stiffness: 80,
    damping: 20,
    mass: 1.5,
  },
  // Elastic bounce
  bouncy: {
    type: 'spring',
    stiffness: 300,
    damping: 10,
    mass: 1,
  },
  // Underwater/viscous feel
  viscous: {
    type: 'spring',
    stiffness: 50,
    damping: 30,
    mass: 2,
  },
  // Abyssal theme - slow and deep
  abyssal: {
    type: 'spring',
    stiffness: 60,
    damping: 18,
    mass: 1.2,
  },
};

/**
 * Easing presets
 */
export const fluidEasings = {
  smooth: [0.4, 0, 0.2, 1],
  smoothOut: [0, 0, 0.2, 1],
  smoothIn: [0.4, 0, 1, 1],
  anticipate: [0.36, 0, 0.66, -0.56],
  overshoot: [0.34, 1.56, 0.64, 1],
  abyss: [0.87, 0, 0.13, 1],
};

/**
 * Hook for fluid page transitions
 * @param {string} preset - Spring preset name
 * @returns {Object} Transition variants and controls
 * 
 * @example
 * const { variants, controls } = useFluidTransition('abyssal');
 * 
 * <motion.div
 *   initial="hidden"
 *   animate="visible"
 *   exit="exit"
 *   variants={variants}
 * >
 *   Content
 * </motion.div>
 */
export function useFluidTransition(preset = 'gentle', customConfig = {}) {
  const config = { ...fluidSprings[preset], ...customConfig };

  const variants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.98,
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: config,
    },
    exit: {
      opacity: 0,
      y: -20,
      scale: 0.98,
      transition: {
        ...config,
        duration: 0.2,
      },
    },
  };

  return {
    variants,
    config,
  };
}

/**
 * Hook for staggered children animations
 * @param {Object} options - Configuration options
 * @returns {Object} Container and item variants
 * 
 * @example
 * const { containerVariants, itemVariants } = useStaggerChildren({ stagger: 0.1 });
 * 
 * <motion.div variants={containerVariants} initial="hidden" animate="visible">
 *   {items.map(item => (
 *     <motion.div key={item.id} variants={itemVariants}>{item.content}</motion.div>
 *   ))}
 * </motion.div>
 */
export function useStaggerChildren(options = {}) {
  const {
    stagger = 0.1,
    delayChildren = 0,
    spring = 'gentle',
  } = options;

  const springConfig = fluidSprings[spring];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: stagger,
        delayChildren,
      },
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: stagger * 0.5,
        staggerDirection: -1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: springConfig,
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 },
    },
  };

  return {
    containerVariants,
    itemVariants,
  };
}

/**
 * Hook for magnetic hover effect
 * @param {Object} options - Effect options
 * @returns {Object} Motion props
 * 
 * @example
 * const motionProps = useMagneticHover({ strength: 0.3 });
 * <motion.div {...motionProps}>Hover me</motion.div>
 */
export function useMagneticHover(options = {}) {
  const { strength = 0.3, spring = 'snappy' } = options;
  const ref = useRef(null);

  const handleMouseMove = useCallback((e) => {
    if (!ref.current) return;
    
    const rect = ref.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    return {
      x: x * strength,
      y: y * strength,
    };
  }, [strength]);

  return {
    ref,
    whileHover: { scale: 1.05 },
    whileTap: { scale: 0.95 },
    transition: fluidSprings[spring],
    onMouseMove: handleMouseMove,
  };
}

/**
 * Hook for drag with fluid physics
 * @param {Object} options - Drag options
 * @returns {Object} Drag props
 */
export function useFluidDrag(options = {}) {
  const {
    constraints = { left: 0, right: 0, top: 0, bottom: 0 },
    spring = 'bouncy',
  } = options;

  return {
    drag: true,
    dragConstraints: constraints,
    dragElastic: 0.2,
    dragTransition: { 
      bounceStiffness: fluidSprings[spring].stiffness,
      bounceDamping: fluidSprings[spring].damping,
    },
    whileDrag: { scale: 1.05, cursor: 'grabbing' },
  };
}

/**
 * Hook for scroll-linked animations
 * @param {Object} options - Configuration options
 * @returns {Object} Scroll props and ref
 */
export function useFluidScroll(options = {}) {
  const {
    inputRange = [0, 1],
    outputRange = [0, 100],
  } = options;

  const ref = useRef(null);

  return {
    ref,
    style: {
      // Use with useScroll and useTransform from framer-motion
      // This is a placeholder for the pattern
    },
  };
}

/**
 * Hook for animate presence with custom exit
 * @param {Object} options - Animation options
 * @returns {Object} Presence props
 */
export function useAnimatePresence(options = {}) {
  const {
    mode = 'wait',
    spring = 'gentle',
  } = options;

  return {
    mode,
    initial: false,
    transition: fluidSprings[spring],
  };
}

/**
 * Create custom transition with delay
 * @param {string} preset - Spring preset
 * @param {number} delay - Delay in seconds
 * @returns {Object} Transition config
 */
export function createDelayedTransition(preset = 'gentle', delay = 0) {
  return {
    ...fluidSprings[preset],
    delay,
  };
}

/**
 * Hook for layout animations
 * @param {string} preset - Spring preset
 * @returns {Object} Layout animation props
 */
export function useLayoutTransition(preset = 'bouncy') {
  return {
    layout: true,
    transition: fluidSprings[preset],
  };
}

export default useFluidTransition;
