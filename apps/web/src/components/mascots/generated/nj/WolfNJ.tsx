/**
 * NJ Style Wolf Mascot Component
 * ==============================
 * React component for the NJ Wolf mascot character.
 * Features: Bold wolf outline, determined expression, alert ear twitch
 * Style: Minimalist line art, electric blue stroke
 * 
 * [Ver001.000] - Production-ready NJ Wolf mascot component
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { motion, type Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type WolfNJSize = 32 | 64 | 128 | 256 | 512;

export type WolfNJVariant = 
  | 'classic-blue' 
  | 'midnight' 
  | 'electric' 
  | 'ice';

export type WolfNJAnimation = 'idle' | 'alert' | 'howl' | 'focus' | 'none';

export interface WolfNJMascotProps {
  /** Display size in pixels */
  size?: WolfNJSize;
  
  /** Visual color variant */
  variant?: WolfNJVariant;
  
  /** Enable animations */
  animate?: boolean;
  
  /** Animation type */
  animation?: WolfNJAnimation;
  
  /** Use CSS-only version instead of SVG */
  useCSS?: boolean;
  
  /** Additional CSS class */
  className?: string;
  
  /** Click handler */
  onClick?: () => void;
  
  /** Accessible label */
  alt?: string;
  
  /** Disable interactions */
  disabled?: boolean;
  
  /** Apply glow effect */
  glow?: boolean;
  
  /** Whether the mascot is interactive */
  interactive?: boolean;
}

// ============================================================================
// Color Configuration
// ============================================================================

const VARIANT_COLORS: Record<WolfNJVariant, { stroke: string; fill: string; glow: string }> = {
  'classic-blue': {
    stroke: '#0000FF',
    fill: '#0000FF',
    glow: 'rgba(0, 0, 255, 0.5)',
  },
  'midnight': {
    stroke: '#191970',
    fill: '#191970',
    glow: 'rgba(25, 25, 112, 0.5)',
  },
  'electric': {
    stroke: '#00FFFF',
    fill: '#00FFFF',
    glow: 'rgba(0, 255, 255, 0.5)',
  },
  'ice': {
    stroke: '#4169E1',
    fill: '#4169E1',
    glow: 'rgba(65, 105, 225, 0.5)',
  },
};

// ============================================================================
// Animation Variants (Framer Motion)
// ============================================================================

const createAnimationVariants = (
  animation: WolfNJAnimation,
  shouldAnimate: boolean
): Variants => {
  if (!shouldAnimate || animation === 'none') {
    return {
      initial: {},
      animate: {},
    };
  }

  switch (animation) {
    case 'idle':
      return {
        initial: { y: 0 },
        animate: {
          y: [0, -2, 0, -1, 0],
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      };
    
    case 'alert':
      return {
        initial: { y: 0, rotate: 0 },
        animate: {
          y: [0, -1, 0, -1, 0],
          rotate: [0, -1, 0, 1, 0],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      };
    
    case 'howl':
      return {
        initial: { rotate: 0, y: 0 },
        animate: {
          rotate: [0, -20, -25, -20, -10, 0],
          y: [0, -5, -8, -5, -2, 0],
          transition: {
            duration: 2,
            ease: 'easeInOut',
          },
        },
      };
    
    case 'focus':
      return {
        initial: { scale: 1 },
        animate: {
          scale: [1, 1.02, 1, 1.01, 1],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      };
    
    default:
      return {
        initial: {},
        animate: {},
      };
  }
};

const createEarVariants = (
  animation: WolfNJAnimation,
  shouldAnimate: boolean,
  isLeft: boolean
): Variants => {
  if (!shouldAnimate || animation === 'none') {
    return {
      initial: {},
      animate: {},
    };
  }

  const baseRotation = isLeft ? -12 : 12;

  switch (animation) {
    case 'idle':
      return {
        initial: { rotate: baseRotation },
        animate: {
          rotate: [
            baseRotation,
            baseRotation + (isLeft ? -2 : 2),
            baseRotation,
            baseRotation + (isLeft ? 1 : -1),
            baseRotation,
          ],
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      };
    
    case 'alert':
      return {
        initial: { rotate: baseRotation },
        animate: {
          rotate: [
            baseRotation,
            baseRotation + (isLeft ? -6 : 6),
            baseRotation + (isLeft ? -3 : 3),
            baseRotation + (isLeft ? -5 : 5),
            baseRotation,
          ],
          transition: {
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      };
    
    case 'howl':
      return {
        initial: { rotate: baseRotation },
        animate: {
          rotate: [
            baseRotation,
            baseRotation + (isLeft ? -10 : 10),
            baseRotation + (isLeft ? -5 : 5),
            baseRotation,
          ],
          transition: {
            duration: 2,
            ease: 'easeInOut',
          },
        },
      };
    
    case 'focus':
      return {
        initial: { rotate: baseRotation },
        animate: {
          rotate: [
            baseRotation,
            baseRotation + (isLeft ? -4 : 4),
            baseRotation,
          ],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      };
    
    default:
      return {
        initial: {},
        animate: {},
      };
  }
};

// ============================================================================
// SVG Component
// ============================================================================

interface WolfNJSVGProps {
  size: WolfNJSize;
  variant: WolfNJVariant;
  animation: WolfNJAnimation;
  shouldAnimate: boolean;
  colors: { stroke: string; fill: string; glow: string };
  className?: string;
}

const WolfNJSVG: React.FC<WolfNJSVGProps> = ({
  size,
  variant,
  animation,
  shouldAnimate,
  colors,
  className = '',
}) => {
  const containerVariants = useMemo(
    () => createAnimationVariants(animation, shouldAnimate),
    [animation, shouldAnimate]
  );

  const leftEarVariants = useMemo(
    () => createEarVariants(animation, shouldAnimate, true),
    [animation, shouldAnimate]
  );

  const rightEarVariants = useMemo(
    () => createEarVariants(animation, shouldAnimate, false),
    [animation, shouldAnimate]
  );

  // Calculate viewBox and stroke width based on size
  const { viewBox, strokeWidth } = useMemo(() => {
    switch (size) {
      case 32:
        return { viewBox: '0 0 32 32', strokeWidth: 1 };
      case 64:
        return { viewBox: '0 0 64 64', strokeWidth: 1.5 };
      case 128:
        return { viewBox: '0 0 128 128', strokeWidth: 2 };
      case 256:
        return { viewBox: '0 0 256 256', strokeWidth: 3 };
      case 512:
        return { viewBox: '0 0 512 512', strokeWidth: 5 };
      default:
        return { viewBox: '0 0 128 128', strokeWidth: 2 };
    }
  }, [size]);

  const basePath = '/mascots/nj';
  const src = `${basePath}/wolf-${size}x${size}.svg`;

  return (
    <motion.img
      src={src}
      alt="NJ Wolf Mascot"
      width={size}
      height={size}
      className={`mascot-wolf-nj ${className}`}
      variants={containerVariants}
      initial="initial"
      animate="animate"
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
};

// ============================================================================
// CSS Version Component
// ============================================================================

interface WolfNJCSSProps {
  size: WolfNJSize;
  variant: WolfNJVariant;
  animation: WolfNJAnimation;
  className?: string;
}

const WolfNJCSS: React.FC<WolfNJCSSProps> = ({
  size,
  variant,
  animation,
  className = '',
}) => {
  // Map size to CSS size class
  const sizeClass = useMemo(() => {
    if (size <= 64) return 'size-small';
    if (size <= 128) return 'size-medium';
    return 'size-large';
  }, [size]);

  // Map variant to CSS variant class
  const variantClass = useMemo(() => {
    switch (variant) {
      case 'midnight':
        return 'variant-midnight';
      case 'electric':
        return 'variant-electric';
      case 'ice':
        return 'variant-ice';
      default:
        return '';
    }
  }, [variant]);

  // Map animation to CSS animation class
  const animationClass = useMemo(() => {
    switch (animation) {
      case 'idle':
        return 'animate-idle';
      case 'alert':
        return 'animate-alert';
      case 'howl':
        return 'animate-howl';
      case 'focus':
        return 'animate-focus';
      default:
        return '';
    }
  }, [animation]);

  return (
    <div 
      className={`nj-wolf-container ${className}`}
      style={{ width: size, height: size }}
    >
      <div 
        className={`nj-wolf ${sizeClass} ${variantClass} ${animationClass}`}
        style={{ transform: `scale(${size / (size <= 64 ? 64 : size <= 128 ? 128 : 256)})` }}
      >
        <div className="nj-wolf-ear-left" />
        <div className="nj-wolf-ear-right" />
        <div className="nj-wolf-head">
          <div className="nj-wolf-eyebrow-left" />
          <div className="nj-wolf-eyebrow-right" />
          <div className="nj-wolf-eye-left" />
          <div className="nj-wolf-eye-right" />
        </div>
        <div className="nj-wolf-snout">
          <div className="nj-wolf-nose" />
        </div>
        <div className="nj-wolf-body" />
        <div className="nj-wolf-mouth" />
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const WolfNJ = forwardRef<HTMLDivElement, WolfNJMascotProps>(
  ({
    size = 128,
    variant = 'classic-blue',
    animate = false,
    animation = 'alert',
    useCSS = false,
    className = '',
    onClick,
    alt = 'NJ Wolf mascot',
    disabled = false,
    glow = false,
    interactive = false,
  }, ref) => {
    // Check for reduced motion preference
    const { enabled: motionEnabled } = useReducedMotion();
    const shouldAnimate = animate && motionEnabled;

    // Get colors for variant
    const colors = VARIANT_COLORS[variant];

    // Dynamic classes
    const glowClass = glow ? `drop-shadow-[0_0_20px_${colors.glow.replace(/[()]/g, '')}]` : '';
    const disabledClass = disabled 
      ? 'opacity-50 grayscale cursor-not-allowed' 
      : onClick || interactive ? 'cursor-pointer' : '';
    const darkModeClass = 'dark:brightness-110';

    // Handle click
    const handleClick = () => {
      if (!disabled && onClick) {
        onClick();
      }
    };

    // Handle keyboard
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if ((onClick || interactive) && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick?.();
        }
      },
      [onClick, interactive]
    );

    // Build CSS classes
    const cssClasses = useMemo(() => {
      const classes = [
        'wolf-nj-mascot',
        `wolf-nj--${variant}`,
        `wolf-nj--size-${size}`,
        animate && `wolf-nj--animate-${animation}`,
        (interactive || !!onClick) && 'wolf-nj--interactive',
        className,
      ].filter(Boolean);
      return classes.join(' ');
    }, [variant, size, animation, animate, interactive, onClick, className]);

    // Get animation variants
    const animationVariants = useMemo(
      () => createAnimationVariants(animation, shouldAnimate),
      [animation, shouldAnimate]
    );

    // Render CSS version
    if (useCSS) {
      return (
        <motion.div
          ref={ref}
          className={`inline-block ${disabledClass} ${darkModeClass} ${cssClasses}`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          role="img"
          aria-label={alt}
          tabIndex={interactive || onClick ? 0 : -1}
          style={{ 
            width: size, 
            height: size,
          }}
          variants={animationVariants}
          initial="initial"
          animate="animate"
          whileHover={interactive || onClick ? { scale: 1.05 } : undefined}
          whileTap={interactive || onClick ? { scale: 0.95 } : undefined}
          data-variant={variant}
          data-size={size}
          data-animation={animate ? animation : 'none'}
        >
          <WolfNJCSS
            size={size}
            variant={variant}
            animation={animation}
            className={glowClass}
          />
        </motion.div>
      );
    }

    // Render SVG version
    return (
      <motion.div
        ref={ref}
        className={`inline-block ${disabledClass} ${darkModeClass} ${cssClasses}`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        role="img"
        aria-label={alt}
        tabIndex={interactive || onClick ? 0 : -1}
        style={{ 
          width: size, 
          height: size,
        }}
        variants={animationVariants}
        initial="initial"
        animate="animate"
        whileHover={interactive || onClick ? { scale: 1.05 } : undefined}
        whileTap={interactive || onClick ? { scale: 0.95 } : undefined}
        data-variant={variant}
        data-size={size}
        data-animation={animate ? animation : 'none'}
      >
        <WolfNJSVG
          size={size}
          variant={variant}
          animation={animation}
          shouldAnimate={shouldAnimate}
          colors={colors}
          className={glowClass}
        />
      </motion.div>
    );
  }
);

WolfNJ.displayName = 'WolfNJ';

// ============================================================================
// Static Animation Styles (injected once)
// ============================================================================

const animationStyles = `
  /* NJ Wolf SVG Animation Styles */
  
  @keyframes wolf-nj-idle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-2px); }
  }
  
  @keyframes wolf-nj-alert {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-2deg); }
    75% { transform: rotate(2deg); }
  }
  
  @keyframes wolf-nj-howl {
    0%, 100% { transform: rotate(0deg); }
    20% { transform: rotate(-15deg); }
    40% { transform: rotate(-20deg); }
    60% { transform: rotate(-15deg); }
    80% { transform: rotate(-5deg); }
  }
  
  @keyframes wolf-nj-focus {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.02); }
  }
  
  .animate-idle {
    animation: wolf-nj-idle 4s ease-in-out infinite;
  }
  
  .animate-alert {
    animation: wolf-nj-alert 3s ease-in-out infinite;
  }
  
  .animate-howl {
    animation: wolf-nj-howl 2s ease-in-out;
  }
  
  .animate-focus {
    animation: wolf-nj-focus 2s ease-in-out infinite;
  }
  
  /* Dark mode adjustments */
  @media (prefers-color-scheme: dark) {
    .mascot-wolf-nj {
      filter: brightness(1.2);
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .animate-idle,
    .animate-alert,
    .animate-howl,
    .animate-focus {
      animation: none !important;
    }
  }
`;

// Inject styles once (client-side only)
if (typeof document !== 'undefined') {
  const styleId = 'nj-wolf-mascot-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = animationStyles;
    document.head.appendChild(styleEl);
  }
}

// ============================================================================
// Exports
// ============================================================================

export default WolfNJ;
export { VARIANT_COLORS as WolfNJVariantColors };
