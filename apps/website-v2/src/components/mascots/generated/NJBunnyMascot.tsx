/**
 * NJ Bunny Mascot Component
 * [Ver001.000]
 * 
 * React component for the NJ Bunny mascot character.
 * Features: Long floppy ears, minimalist line art style, NewJeans aesthetic
 * 
 * Supports both SVG and CSS versions with Framer Motion animations.
 * 
 * @example
 * <NJBunnyMascot size={128} variant="attention" animate animation="hop" />
 * <NJBunnyMascot size={64} useCSS variant="hype-boy" />
 */

import React, { 
  forwardRef, 
  useMemo, 
  useState, 
  useEffect
} from 'react';
import { motion, type Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type NJBunnySize = 32 | 64 | 128 | 256 | 512;

export type NJBunnyVariant = 
  | 'classic-blue' 
  | 'attention' 
  | 'hype-boy' 
  | 'cookie' 
  | 'ditto';

export type NJBunnyAnimation = 'idle' | 'wave' | 'hop' | 'celebrate' | 'none';

export interface NJBunnyMascotProps {
  /** Display size in pixels */
  size?: NJBunnySize;
  
  /** Visual color variant */
  variant?: NJBunnyVariant;
  
  /** Enable animations */
  animate?: boolean;
  
  /** Animation type */
  animation?: NJBunnyAnimation;
  
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
}

// ============================================================================
// Lazy-loaded SVG Components (dynamically imported in LazySVGContent)
// ============================================================================

// ============================================================================
// Color Configuration
// ============================================================================

const VARIANT_COLORS: Record<NJBunnyVariant, { stroke: string; fill: string; glow: string }> = {
  'classic-blue': {
    stroke: '#0000FF',
    fill: '#0000FF',
    glow: 'rgba(0, 0, 255, 0.5)',
  },
  'attention': {
    stroke: '#FF69B4',
    fill: '#FF69B4',
    glow: 'rgba(255, 105, 180, 0.5)',
  },
  'hype-boy': {
    stroke: '#00CED1',
    fill: '#00CED1',
    glow: 'rgba(0, 206, 209, 0.5)',
  },
  'cookie': {
    stroke: '#8B4513',
    fill: '#D2691E',
    glow: 'rgba(139, 69, 19, 0.5)',
  },
  'ditto': {
    stroke: '#A9A9A9',
    fill: '#D3D3D3',
    glow: 'rgba(169, 169, 169, 0.5)',
  },
};

// ============================================================================
// Animation Variants (Framer Motion)
// ============================================================================

const createAnimationVariants = (
  animation: NJBunnyAnimation,
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
          y: [0, -3, 0, -2, 0],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      };
    
    case 'wave':
      return {
        initial: { rotate: 0 },
        animate: {
          rotate: [0, -5, 5, -5, 5, 0],
          transition: {
            duration: 0.8,
            repeat: 2,
            ease: 'easeInOut',
          },
        },
      };
    
    case 'hop':
      return {
        initial: { y: 0, scaleY: 1 },
        animate: {
          y: [0, -20, 0],
          scaleY: [1, 1.05, 0.95, 1],
          transition: {
            duration: 0.6,
            ease: 'easeOut',
          },
        },
      };
    
    case 'celebrate':
      return {
        initial: { y: 0, rotate: 0, scale: 1 },
        animate: {
          y: [0, -10, -40, -10, 0],
          rotate: [0, -5, 0, 5, 0],
          scale: [1, 1.05, 0.95, 1.05, 1],
          transition: {
            duration: 1,
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
  animation: NJBunnyAnimation,
  shouldAnimate: boolean,
  isLeft: boolean
): Variants => {
  if (!shouldAnimate || animation === 'none') {
    return {
      initial: {},
      animate: {},
    };
  }

  const baseRotation = isLeft ? -15 : 15;

  switch (animation) {
    case 'idle':
      return {
        initial: { rotate: baseRotation },
        animate: {
          rotate: [
            baseRotation,
            baseRotation + (isLeft ? -3 : 3),
            baseRotation,
            baseRotation + (isLeft ? 2 : -2),
            baseRotation,
          ],
          transition: {
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
      };
    
    case 'wave':
      return {
        initial: { rotate: baseRotation },
        animate: {
          rotate: [
            baseRotation,
            baseRotation + (isLeft ? -10 : 10),
            baseRotation,
            baseRotation + (isLeft ? -8 : 8),
            baseRotation,
          ],
          transition: {
            duration: 0.6,
            repeat: 2,
            ease: 'easeInOut',
          },
        },
      };
    
    case 'hop':
      return {
        initial: { rotate: baseRotation },
        animate: {
          rotate: [
            baseRotation,
            baseRotation + (isLeft ? -15 : 15),
            baseRotation,
          ],
          transition: {
            duration: 0.6,
            ease: 'easeOut',
          },
        },
      };
    
    case 'celebrate':
      return {
        initial: { rotate: baseRotation },
        animate: {
          rotate: [
            baseRotation,
            baseRotation + (isLeft ? -20 : 20),
            baseRotation + (isLeft ? -10 : 10),
            baseRotation + (isLeft ? -15 : 15),
            baseRotation,
          ],
          transition: {
            duration: 1,
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

interface NJBunnySVGProps {
  size: NJBunnySize;
  variant: NJBunnyVariant;
  animation: NJBunnyAnimation;
  shouldAnimate: boolean;
  colors: { stroke: string; fill: string; glow: string };
  className?: string;
}

const NJBunnySVG: React.FC<NJBunnySVGProps> = ({
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

  // Adjust colors for ditto variant (filled style)
  const isFilled = variant === 'cookie' || variant === 'ditto';
  const fillColor = isFilled ? colors.fill : 'none';

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox={viewBox}
      className={`inline-block ${className}`}
      style={{ imageRendering: 'pixelated' }}
      variants={containerVariants}
      initial="initial"
      animate="animate"
    >
      <defs>
        <filter id={`bunny-glow-${size}`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
          <feMerge>
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>

      <g filter={variant === 'classic-blue' ? `url(#bunny-glow-${size})` : undefined}>
        {/* Left Ear */}
        <motion.path
          d={size <= 64 
            ? 'M10 8 C10 2, 6 2, 6 8 C6 12, 10 14, 12 16'
            : 'M40 32 C40 8, 24 8, 24 32 C24 48, 40 56, 48 64'
          }
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={leftEarVariants}
          style={{ transformOrigin: '40% 30%' }}
        />

        {/* Right Ear */}
        <motion.path
          d={size <= 64
            ? 'M22 8 C22 3, 26 4, 25 9 C24.5 12, 22 14, 20 16'
            : 'M88 32 C88 12, 104 16, 100 36 C98 48, 88 56, 80 64'
          }
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
          variants={rightEarVariants}
          style={{ transformOrigin: '60% 30%' }}
        />

        {/* Head */}
        <ellipse
          cx={size <= 64 ? 16 : 64}
          cy={size <= 64 ? 18 : 72}
          rx={size <= 64 ? 7 : 28}
          ry={size <= 64 ? 6 : 24}
          fill={fillColor}
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
        />

        {/* Left Eye */}
        <circle
          cx={size <= 64 ? 13 : 52}
          cy={size <= 64 ? 17 : 68}
          r={size <= 64 ? 1.8 : 7.2}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size <= 64 ? 13.5 : 54}
          cy={size <= 64 ? 16.5 : 66}
          r={size <= 64 ? 0.4 : 1.6}
          fill={colors.fill}
        />

        {/* Right Eye */}
        <circle
          cx={size <= 64 ? 19 : 76}
          cy={size <= 64 ? 17 : 68}
          r={size <= 64 ? 1.8 : 7.2}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size <= 64 ? 19.5 : 78}
          cy={size <= 64 ? 16.5 : 66}
          r={size <= 64 ? 0.4 : 1.6}
          fill={colors.fill}
        />

        {/* Nose */}
        <ellipse
          cx={size <= 64 ? 16 : 64}
          cy={size <= 64 ? 20 : 80}
          rx={size <= 64 ? 0.8 : 3.2}
          ry={size <= 64 ? 0.5 : 2}
          fill={colors.fill}
        />

        {/* Mouth */}
        <path
          d={size <= 64
            ? 'M14 21 Q16 22.5, 18 21'
            : 'M58 84 Q64 90, 70 84'
          }
          fill="none"
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Body */}
        <path
          d={size <= 64
            ? 'M12 23 Q10 26, 10 28 Q16 29, 22 28 Q22 26, 20 23'
            : 'M48 92 Q40 104, 40 112 Q64 116, 88 112 Q88 104, 80 92'
          }
          fill={fillColor}
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Tail */}
        <circle
          cx={size <= 64 ? 24 : 96}
          cy={size <= 64 ? 26 : 104}
          r={size <= 64 ? 2 : 8}
          fill={fillColor}
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
        />
        
        {/* Tail fluff details (only for larger sizes) */}
        {size >= 128 && (
          <path
            d="M90 100 L92 104 L88 108 M96 96 L96 102 L100 100 M102 104 L98 106 L102 110"
            fill="none"
            stroke={colors.stroke}
            strokeWidth={strokeWidth * 0.8}
            strokeLinecap="round"
          />
        )}
      </g>
    </motion.svg>
  );
};

// ============================================================================
// CSS Version Component
// ============================================================================

interface NJBunnyCSSProps {
  size: NJBunnySize;
  variant: NJBunnyVariant;
  animation: NJBunnyAnimation;
  className?: string;
}

const NJBunnyCSS: React.FC<NJBunnyCSSProps> = ({
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
      case 'attention':
        return 'variant-attention';
      case 'hype-boy':
        return 'variant-hype-boy';
      case 'cookie':
        return 'variant-cookie';
      case 'ditto':
        return 'variant-ditto';
      default:
        return '';
    }
  }, [variant]);

  // Map animation to CSS animation class
  const animationClass = useMemo(() => {
    switch (animation) {
      case 'idle':
        return 'animate-idle';
      case 'wave':
        return 'animate-wave';
      case 'hop':
        return 'animate-hop';
      case 'celebrate':
        return 'animate-celebrate';
      default:
        return '';
    }
  }, [animation]);

  return (
    <div 
      className={`nj-bunny-container ${className}`}
      style={{ width: size, height: size }}
    >
      <div 
        className={`nj-bunny ${sizeClass} ${variantClass} ${animationClass}`}
        style={{ transform: `scale(${size / (size <= 64 ? 64 : size <= 128 ? 128 : 256)})` }}
      >
        <div className="nj-bunny-ear-left" />
        <div className="nj-bunny-ear-right" />
        <div className="nj-bunny-head" />
        <div className="nj-bunny-eye-left" />
        <div className="nj-bunny-eye-right" />
        <div className="nj-bunny-nose" />
        <div className="nj-bunny-body" />
        <div className="nj-bunny-tail" />
        <div className="nj-bunny-paw-left" />
        <div className="nj-bunny-paw-right" />
      </div>
      <div className="nj-bunny-shadow" />
    </div>
  );
};

// ============================================================================
// Lazy SVG Loader
// ============================================================================

const LazySVGContent: React.FC<{
  size: NJBunnySize;
  variant: NJBunnyVariant;
  animation: NJBunnyAnimation;
  shouldAnimate: boolean;
  colors: { stroke: string; fill: string; glow: string };
  className?: string;
}> = ({ size, variant, animation, shouldAnimate, colors, className }) => {
  const [SvgComponent, setSvgComponent] = useState<React.FC<{ className?: string }> | null>(null);

  useEffect(() => {
    const loadComponent = async () => {
      try {
        let component;
        switch (size) {
          case 32:
            component = await import('./NJBunnySVG32');
            break;
          case 64:
            component = await import('./NJBunnySVG64');
            break;
          case 256:
            component = await import('./NJBunnySVG256');
            break;
          case 512:
            component = await import('./NJBunnySVG512');
            break;
          default:
            component = await import('./NJBunnySVG128');
        }
        setSvgComponent(() => component.default);
      } catch (error) {
        console.warn('Failed to load SVG component, falling back to inline SVG:', error);
      }
    };

    loadComponent();
  }, [size]);

  if (SvgComponent) {
    return (
      <motion.div
        variants={createAnimationVariants(animation, shouldAnimate)}
        initial="initial"
        animate="animate"
        className={className}
      >
        <SvgComponent className={className} />
      </motion.div>
    );
  }

  // Fallback to inline SVG
  return (
    <NJBunnySVG
      size={size}
      variant={variant}
      animation={animation}
      shouldAnimate={shouldAnimate}
      colors={colors}
      className={className}
    />
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const NJBunnyMascot = forwardRef<HTMLDivElement, NJBunnyMascotProps>(
  ({
    size = 128,
    variant = 'classic-blue',
    animate = false,
    animation = 'idle',
    useCSS = false,
    className = '',
    onClick,
    alt = 'NJ Bunny mascot',
    disabled = false,
    glow = false,
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
      : onClick ? 'cursor-pointer' : '';
    const darkModeClass = 'dark:invert-[0.15]';

    // Handle click
    const handleClick = () => {
      if (!disabled && onClick) {
        onClick();
      }
    };

    // Render CSS version
    if (useCSS) {
      return (
        <div
          ref={ref}
          className={`inline-block ${className} ${disabledClass} ${darkModeClass}`}
          onClick={handleClick}
          role="img"
          aria-label={alt}
          style={{ 
            width: size, 
            height: size,
          }}
        >
          <NJBunnyCSS
            size={size}
            variant={variant}
            animation={animation}
            className={glowClass}
          />
        </div>
      );
    }

    // Render SVG version
    return (
      <div
        ref={ref}
        className={`inline-block ${className} ${disabledClass} ${darkModeClass}`}
        onClick={handleClick}
        role="img"
        aria-label={alt}
        style={{ 
          width: size, 
          height: size,
        }}
      >
        <LazySVGContent
          size={size}
          variant={variant}
          animation={animation}
          shouldAnimate={shouldAnimate}
          colors={colors}
          className={glowClass}
        />
      </div>
    );
  }
);

NJBunnyMascot.displayName = 'NJBunnyMascot';

// ============================================================================
// Static Animation Styles (injected once)
// ============================================================================

const animationStyles = `
  /* NJ Bunny SVG Animation Styles */
  
  @keyframes bunny-svg-idle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-3px); }
  }
  
  @keyframes bunny-svg-wave {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-5deg); }
    75% { transform: rotate(5deg); }
  }
  
  @keyframes bunny-svg-hop {
    0%, 100% { transform: translateY(0) scaleY(1); }
    40% { transform: translateY(-20px) scaleY(1.05); }
    50% { transform: translateY(-25px) scaleY(0.95); }
    60% { transform: translateY(-20px) scaleY(1.05); }
  }
  
  @keyframes bunny-svg-celebrate {
    0% { transform: translateY(0) rotate(0deg) scale(1); }
    25% { transform: translateY(-10px) rotate(-5deg) scale(1.05); }
    50% { transform: translateY(-40px) rotate(0deg) scale(0.95); }
    75% { transform: translateY(-10px) rotate(5deg) scale(1.05); }
    100% { transform: translateY(0) rotate(0deg) scale(1); }
  }
  
  .animate-idle {
    animation: bunny-svg-idle 3s ease-in-out infinite;
  }
  
  .animate-wave {
    animation: bunny-svg-wave 0.6s ease-in-out 3;
  }
  
  .animate-hop {
    animation: bunny-svg-hop 0.6s ease-out;
  }
  
  .animate-celebrate {
    animation: bunny-svg-celebrate 1s ease-in-out;
  }
  
  /* Dark mode color adjustments */
  @media (prefers-color-scheme: dark) {
    .nj-bunny-svg {
      filter: brightness(1.2);
    }
  }
  
  /* Reduced motion support */
  @media (prefers-reduced-motion: reduce) {
    .animate-idle,
    .animate-wave,
    .animate-hop,
    .animate-celebrate {
      animation: none !important;
    }
  }
`;

// Inject styles once (client-side only)
if (typeof document !== 'undefined') {
  const styleId = 'nj-bunny-mascot-styles';
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

export default NJBunnyMascot;
export { NJBunnySVG, NJBunnyCSS };
