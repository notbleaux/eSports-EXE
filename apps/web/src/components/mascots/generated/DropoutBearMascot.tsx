/**
 * Dropout Bear Mascot Component
 * =============================
 * A React TypeScript component for the Dropout Bear mascot with SVG and CSS variants,
 * supporting multiple album-inspired colorways and smooth Framer Motion animations.
 * 
 * [Ver001.000] - Production-ready Dropout Bear mascot component
 */

import React, { forwardRef, lazy, Suspense, useMemo, useCallback } from 'react';
import { motion, Variants, Transition } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type DropoutBearSize = 32 | 64 | 128 | 256 | 512;

export type DropoutBearVariant = 
  | 'default' 
  | 'homecoming' 
  | 'graduation' 
  | 'late-registration' 
  | 'yeezus' 
  | 'donda';

export type DropoutBearAnimation = 'idle' | 'wave' | 'celebrate' | 'graduation';

export interface DropoutBearMascotProps {
  /** Size of the mascot in pixels */
  size?: DropoutBearSize;
  /** Visual variant inspired by album eras */
  variant?: DropoutBearVariant;
  /** Enable animations */
  animate?: boolean;
  /** Animation type to play */
  animation?: DropoutBearAnimation;
  /** Use CSS-only version instead of SVG */
  useCSS?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Accessible label */
  ariaLabel?: string;
  /** Whether the mascot is interactive */
  interactive?: boolean;
}

// ============================================================================
// Lazy-loaded SVG Components for Code Splitting
// ============================================================================

const DropoutBearSVG32 = lazy(() => import('./svg/DropoutBear32'));
const DropoutBearSVG64 = lazy(() => import('./svg/DropoutBear64'));
const DropoutBearSVG128 = lazy(() => import('./svg/DropoutBear128'));
const DropoutBearSVG256 = lazy(() => import('./svg/DropoutBear256'));
const DropoutBearSVG512 = lazy(() => import('./svg/DropoutBear512'));

// ============================================================================
// Variant Color Configurations
// ============================================================================

interface VariantColors {
  jacket: string;
  jacketDark: string;
  fur: string;
  furDark: string;
  accent: string;
  shirt: string;
  filter?: string;
}

const VARIANT_COLORS: Record<DropoutBearVariant, VariantColors> = {
  default: {
    jacket: '#DC143C',      // Crimson
    jacketDark: '#8B0000',  // Dark red
    fur: '#8B4513',         // Saddle brown
    furDark: '#5D3A1A',     // Dark brown
    accent: '#FFD700',      // Gold
    shirt: '#F5F5DC',       // Beige
  },
  homecoming: {
    jacket: '#FF69B4',      // Hot pink
    jacketDark: '#C71585',  // Medium violet red
    fur: '#8B4513',
    furDark: '#5D3A1A',
    accent: '#00CED1',      // Dark turquoise
    shirt: '#FFF0F5',       // Lavender blush
  },
  graduation: {
    jacket: '#800080',      // Purple
    jacketDark: '#4B0082',  // Indigo
    fur: '#8B4513',
    furDark: '#5D3A1A',
    accent: '#FFD700',      // Gold
    shirt: '#F0E68C',       // Khaki
  },
  'late-registration': {
    jacket: '#800020',      // Burgundy
    jacketDark: '#4A0404',  // Deep maroon
    fur: '#8B4513',
    furDark: '#5D3A1A',
    accent: '#D4AF37',      // Metallic gold
    shirt: '#E6E6FA',       // Lavender
  },
  yeezus: {
    jacket: '#2F2F2F',      // Dark gray
    jacketDark: '#1A1A1A',  // Near black
    fur: '#4A4A4A',         // Gray
    furDark: '#2F2F2F',
    accent: '#FFFFFF',      // White
    shirt: '#1A1A1A',       // Black
    filter: 'grayscale(0.3) contrast(1.1)',
  },
  donda: {
    jacket: '#0A0A0A',      // Black
    jacketDark: '#000000',  // Pure black
    fur: '#1A1A1A',         // Very dark gray
    furDark: '#0A0A0A',
    accent: '#333333',      // Dark gray
    shirt: '#000000',
    filter: 'grayscale(1) contrast(1.2)',
  },
};

// ============================================================================
// Animation Variants for Framer Motion
// ============================================================================

const createIdleVariants = (shouldAnimate: boolean): Variants => ({
  initial: { scale: 1, y: 0 },
  animate: shouldAnimate
    ? {
        scale: [1, 1.02, 1],
        y: [0, -2, 0],
        transition: {
          duration: 2,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'loop',
        },
      }
    : { scale: 1, y: 0 },
});

const createWaveVariants = (shouldAnimate: boolean): Variants => ({
  initial: { rotate: 0 },
  animate: shouldAnimate
    ? {
        rotate: [0, -15, 15, -15, 15, 0],
        transition: {
          duration: 1.2,
          ease: 'easeInOut',
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        },
      }
    : { rotate: 0 },
});

const createCelebrateVariants = (shouldAnimate: boolean): Variants => ({
  initial: { scale: 1, y: 0 },
  animate: shouldAnimate
    ? {
        scale: [1, 1.15, 1, 1.1, 1],
        y: [0, -20, 0, -10, 0],
        transition: {
          duration: 1,
          ease: 'easeOut',
          times: [0, 0.3, 0.5, 0.7, 1],
        },
      }
    : { scale: 1, y: 0 },
});

const createGraduationVariants = (shouldAnimate: boolean): Variants => ({
  initial: { scale: 1, y: 0 },
  animate: shouldAnimate
    ? {
        scale: [1, 0.95, 1.05, 1],
        y: [0, 10, -30, 0],
        transition: {
          duration: 1.5,
          ease: 'easeInOut',
          times: [0, 0.2, 0.5, 1],
        },
      }
    : { scale: 1, y: 0 },
});

const getAnimationVariants = (
  animation: DropoutBearAnimation,
  shouldAnimate: boolean
): Variants => {
  switch (animation) {
    case 'idle':
      return createIdleVariants(shouldAnimate);
    case 'wave':
      return createWaveVariants(shouldAnimate);
    case 'celebrate':
      return createCelebrateVariants(shouldAnimate);
    case 'graduation':
      return createGraduationVariants(shouldAnimate);
    default:
      return { initial: {}, animate: {} };
  }
};

// ============================================================================
// CSS Class Builder
// ============================================================================

const buildCSSClasses = (
  variant: DropoutBearVariant,
  size: DropoutBearSize,
  animation: DropoutBearAnimation,
  animate: boolean,
  interactive: boolean,
  baseClassName?: string
): string => {
  const classes = [
    'dropout-bear',
    `dropout-bear--${variant}`,
    `dropout-bear--size-${size}`,
    animate && `dropout-bear--animate-${animation}`,
    interactive && 'dropout-bear--interactive',
    baseClassName,
  ].filter(Boolean);

  return classes.join(' ');
};

// ============================================================================
// SVG Import Helper
// ============================================================================

const getSVGComponent = (size: DropoutBearSize): React.LazyExoticComponent<React.FC<React.SVGProps<SVGSVGElement>>> => {
  switch (size) {
    case 32:
      return DropoutBearSVG32;
    case 64:
      return DropoutBearSVG64;
    case 128:
      return DropoutBearSVG128;
    case 256:
      return DropoutBearSVG256;
    case 512:
      return DropoutBearSVG512;
    default:
      return DropoutBearSVG64;
  }
};

// ============================================================================
// CSS-Only Dropout Bear Component
// ============================================================================

interface DropoutBearCSSProps {
  size: DropoutBearSize;
  variant: DropoutBearVariant;
  animation: DropoutBearAnimation;
  animate: boolean;
  colors: VariantColors;
}

const DropoutBearCSS: React.FC<DropoutBearCSSProps> = ({
  size,
  variant,
  animation,
  animate,
  colors,
}) => {
  const scale = size / 64;
  
  const cssVariables = useMemo(
    () => ({
      '--bear-jacket': colors.jacket,
      '--bear-jacket-dark': colors.jacketDark,
      '--bear-fur': colors.fur,
      '--bear-fur-dark': colors.furDark,
      '--bear-accent': colors.accent,
      '--bear-shirt': colors.shirt,
      '--bear-scale': scale,
    } as React.CSSProperties),
    [colors, scale]
  );

  return (
    <div
      className={`dropout-bear-css dropout-bear-css--${variant} ${animate ? `animate-${animation}` : ''}`}
      style={cssVariables}
    >
      {/* Head */}
      <div className="bear-head">
        {/* Ears */}
        <div className="bear-ear bear-ear--left" />
        <div className="bear-ear bear-ear--right" />
        
        {/* Face */}
        <div className="bear-face">
          {/* Eyes */}
          <div className="bear-eye bear-eye--left">
            <div className="bear-pupil" />
          </div>
          <div className="bear-eye bear-eye--right">
            <div className="bear-pupil" />
          </div>
          
          {/* Snout */}
          <div className="bear-snout">
            <div className="bear-nose" />
          </div>
          
          {/* Mouth */}
          <div className="bear-mouth" />
        </div>
      </div>
      
      {/* Body */}
      <div className="bear-body">
        {/* Jacket */}
        <div className="bear-jacket">
          <div className="bear-collar bear-collar--left" />
          <div className="bear-collar bear-collar--right" />
          <div className="bear-zipper" />
          <div className="bear-pocket bear-pocket--left" />
          <div className="bear-pocket bear-pocket--right" />
        </div>
        
        {/* Arms */}
        <div className="bear-arm bear-arm--left" />
        <div className="bear-arm bear-arm--right" />
      </div>
      
      {/* Graduation Cap (only for graduation variant) */}
      {variant === 'graduation' && (
        <div className="bear-cap">
          <div className="bear-cap--top" />
          <div className="bear-cap--tassel" />
        </div>
      )}
      
      {/* Shadow */}
      <div className="bear-shadow" />
    </div>
  );
};

// ============================================================================
// Main Dropout Bear Mascot Component
// ============================================================================

export const DropoutBearMascot = forwardRef<HTMLDivElement, DropoutBearMascotProps>(
  (
    {
      size = 128,
      variant = 'default',
      animate = false,
      animation = 'idle',
      useCSS = false,
      className,
      onClick,
      ariaLabel,
      interactive = false,
    },
    ref
  ) => {
    // Get reduced motion preference
    const { enabled: motionEnabled, prefersReducedMotion } = useReducedMotion();
    const shouldAnimate = animate && motionEnabled;

    // Get variant colors
    const colors = VARIANT_COLORS[variant];

    // Get animation variants
    const animationVariants = useMemo(
      () => getAnimationVariants(animation, shouldAnimate),
      [animation, shouldAnimate]
    );

    // Build CSS classes
    const cssClasses = useMemo(
      () => buildCSSClasses(variant, size, animation, animate, interactive ?? !!onClick, className),
      [variant, size, animation, animate, interactive, onClick, className]
    );

    // Generate accessible label
    const accessibleLabel = useMemo(() => {
      if (ariaLabel) return ariaLabel;
      const variantNames: Record<DropoutBearVariant, string> = {
        default: 'Dropout Bear',
        homecoming: 'Dropout Bear - Homecoming Edition',
        graduation: 'Dropout Bear - Graduation Edition',
        'late-registration': 'Dropout Bear - Late Registration Edition',
        yeezus: 'Dropout Bear - Yeezus Edition',
        donda: 'Dropout Bear - Donda Edition',
      };
      return variantNames[variant];
    }, [ariaLabel, variant]);

    // Handle click with keyboard support
    const handleKeyDown = useCallback(
      (event: React.KeyboardEvent) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          event.preventDefault();
          onClick();
        }
      },
      [onClick]
    );

    // CSS Version
    if (useCSS) {
      return (
        <motion.div
          ref={ref}
          className={cssClasses}
          style={{
            width: size,
            height: size,
            display: 'inline-block',
            position: 'relative',
          }}
          variants={animationVariants}
          initial="initial"
          animate="animate"
          whileHover={interactive ? { scale: 1.05 } : undefined}
          whileTap={interactive ? { scale: 0.95 } : undefined}
          onClick={onClick}
          onKeyDown={handleKeyDown}
          role="img"
          aria-label={accessibleLabel}
          tabIndex={interactive || onClick ? 0 : -1}
          data-variant={variant}
          data-size={size}
          data-animation={animate ? animation : 'none'}
        >
          <DropoutBearCSS
            size={size}
            variant={variant}
            animation={animation}
            animate={animate}
            colors={colors}
          />
        </motion.div>
      );
    }

    // SVG Version
    const SVGComponent = getSVGComponent(size);

    return (
      <motion.div
        ref={ref}
        className={cssClasses}
        style={{
          width: size,
          height: size,
          display: 'inline-block',
          position: 'relative',
          filter: colors.filter,
        }}
        variants={animationVariants}
        initial="initial"
        animate="animate"
        whileHover={interactive ? { scale: 1.05 } : undefined}
        whileTap={interactive ? { scale: 0.95 } : undefined}
        onClick={onClick}
        onKeyDown={handleKeyDown}
        role="img"
        aria-label={accessibleLabel}
        tabIndex={interactive || onClick ? 0 : -1}
        data-variant={variant}
        data-size={size}
        data-animation={animate ? animation : 'none'}
      >
        <Suspense
          fallback={
            <div
              style={{
                width: size,
                height: size,
                backgroundColor: colors.fur,
                borderRadius: '50%',
                opacity: 0.3,
              }}
            />
          }
        >
          <SVGComponent
            width={size}
            height={size}
            className="dropout-bear-svg"
            style={{
              width: '100%',
              height: '100%',
              display: 'block',
            }}
            aria-hidden="true"
          />
        </Suspense>
      </motion.div>
    );
  }
);

DropoutBearMascot.displayName = 'DropoutBearMascot';

// ============================================================================
// Export Additional Types and Utilities
// ============================================================================

export { VARIANT_COLORS as DropoutBearVariantColors };
export type { VariantColors as DropoutBearVariantColorsType };

// Default export
export default DropoutBearMascot;
