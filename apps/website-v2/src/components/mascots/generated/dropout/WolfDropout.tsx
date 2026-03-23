/**
 * Dropout Style Wolf Mascot Component
 * ===================================
 * A React TypeScript component for the Dropout Wolf mascot with SVG and CSS variants,
 * featuring strong stance, varsity jacket, and leadership pose.
 * 
 * Colors:
 * - Slate: #6C757D
 * - Black jacket: #212529
 * - Silver accents: #C0C0C0
 * 
 * [Ver001.000] - Production-ready Dropout Wolf mascot component
 */

import React, { forwardRef, useMemo, useCallback } from 'react';
import { motion, Variants } from 'framer-motion';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';

// ============================================================================
// Types & Interfaces
// ============================================================================

export type WolfDropoutSize = 32 | 64 | 128 | 256 | 512;

export type WolfDropoutVariant = 
  | 'default' 
  | 'alpha' 
  | 'pack-leader' 
  | 'silverback';

export type WolfDropoutAnimation = 'idle' | 'howl' | 'leadership' | 'none';

export interface WolfDropoutMascotProps {
  /** Size of the mascot in pixels */
  size?: WolfDropoutSize;
  /** Visual variant */
  variant?: WolfDropoutVariant;
  /** Enable animations */
  animate?: boolean;
  /** Animation type to play */
  animation?: WolfDropoutAnimation;
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
// Variant Color Configurations
// ============================================================================

interface VariantColors {
  slate: string;
  slateDark: string;
  slateLight: string;
  jacket: string;
  jacketDark: string;
  silver: string;
  silverLight: string;
  outline: string;
  filter?: string;
}

const VARIANT_COLORS: Record<WolfDropoutVariant, VariantColors> = {
  default: {
    slate: '#6C757D',
    slateDark: '#495057',
    slateLight: '#ADB5BD',
    jacket: '#212529',
    jacketDark: '#000000',
    silver: '#C0C0C0',
    silverLight: '#E8E8E8',
    outline: '#212529',
  },
  alpha: {
    slate: '#5A6268',
    slateDark: '#343A40',
    slateLight: '#868E96',
    jacket: '#1A1D20',
    jacketDark: '#000000',
    silver: '#D4D4D4',
    silverLight: '#F0F0F0',
    outline: '#1A1D20',
  },
  'pack-leader': {
    slate: '#495057',
    slateDark: '#343A40',
    slateLight: '#CED4DA',
    jacket: '#DC143C',
    jacketDark: '#8B0000',
    silver: '#FFD700',
    silverLight: '#FFEC8B',
    outline: '#212529',
  },
  silverback: {
    slate: '#868E96',
    slateDark: '#6C757D',
    slateLight: '#ADB5BD',
    jacket: '#495057',
    jacketDark: '#343A40',
    silver: '#E8E8E8',
    silverLight: '#FFFFFF',
    outline: '#495057',
    filter: 'grayscale(0.3) contrast(1.1)',
  },
};

// ============================================================================
// Animation Variants for Framer Motion
// ============================================================================

const createIdleVariants = (shouldAnimate: boolean): Variants => ({
  initial: { scale: 1, y: 0 },
  animate: shouldAnimate
    ? {
        scale: [1, 1.03, 1, 0.98, 1],
        y: [0, 1, 0, -2, 0],
        transition: {
          duration: 4,
          ease: 'easeInOut',
          repeat: Infinity,
          repeatType: 'loop',
        },
      }
    : { scale: 1, y: 0 },
});

const createHowlVariants = (shouldAnimate: boolean): Variants => ({
  initial: { rotate: 0, y: 0 },
  animate: shouldAnimate
    ? {
        rotate: [0, -20, -25, -20, -10, 0],
        y: [0, -5, -8, -5, -2, 0],
        transition: {
          duration: 2,
          ease: 'easeInOut',
          times: [0, 0.2, 0.4, 0.6, 0.8, 1],
        },
      }
    : { rotate: 0, y: 0 },
});

const createLeadershipVariants = (shouldAnimate: boolean): Variants => ({
  initial: { scale: 1, y: 0 },
  animate: shouldAnimate
    ? {
        scale: [1, 1.02, 1, 1.01, 1],
        y: [0, -5, 0, -3, 0],
        transition: {
          duration: 3,
          ease: 'easeOut',
          times: [0, 0.1, 0.2, 0.3, 1],
        },
      }
    : { scale: 1, y: 0 },
});

const getAnimationVariants = (
  animation: WolfDropoutAnimation,
  shouldAnimate: boolean
): Variants => {
  switch (animation) {
    case 'idle':
      return createIdleVariants(shouldAnimate);
    case 'howl':
      return createHowlVariants(shouldAnimate);
    case 'leadership':
      return createLeadershipVariants(shouldAnimate);
    default:
      return { initial: {}, animate: {} };
  }
};

// ============================================================================
// SVG Component
// ============================================================================

interface WolfDropoutSVGProps {
  size: WolfDropoutSize;
  variant: WolfDropoutVariant;
  colors: VariantColors;
  className?: string;
}

const WolfDropoutSVG: React.FC<WolfDropoutSVGProps> = ({
  size,
  variant,
  colors,
  className = '',
}) => {
  const basePath = '/mascots/dropout';
  const src = `${basePath}/wolf-${size}x${size}.svg`;

  return (
    <img
      src={src}
      alt="Dropout Wolf Mascot"
      width={size}
      height={size}
      className={`mascot-wolf-dropout ${className}`}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        filter: colors.filter,
      }}
    />
  );
};

// ============================================================================
// CSS-Only Wolf Component
// ============================================================================

interface WolfDropoutCSSProps {
  size: WolfDropoutSize;
  variant: WolfDropoutVariant;
  animation: WolfDropoutAnimation;
  animate: boolean;
  colors: VariantColors;
}

const WolfDropoutCSS: React.FC<WolfDropoutCSSProps> = ({
  size,
  variant,
  animation,
  animate,
  colors,
}) => {
  const scale = size / 128;

  const cssVariables = useMemo(
    () => ({
      '--wolf-slate': colors.slate,
      '--wolf-slate-dark': colors.slateDark,
      '--wolf-slate-light': colors.slateLight,
      '--wolf-jacket': colors.jacket,
      '--wolf-jacket-dark': colors.jacketDark,
      '--wolf-silver': colors.silver,
      '--wolf-silver-light': colors.silverLight,
      '--wolf-outline': colors.outline,
      '--wolf-scale': scale,
    } as React.CSSProperties),
    [colors, scale]
  );

  const sizeClass = size <= 64 ? 'small' : size <= 128 ? 'medium' : 'large';
  const animationClass = animate ? `animate-${animation}` : '';

  return (
    <div
      className={`wolf-dropout-container ${sizeClass} ${animationClass}`}
      style={{ ...cssVariables, width: size, height: size }}
    >
      <div className="wolf-dropout">
        <div className="wolf-dropout-ear-left" />
        <div className="wolf-dropout-ear-right" />
        <div className="wolf-dropout-head">
          <div className="wolf-dropout-eyebrow-left" />
          <div className="wolf-dropout-eyebrow-right" />
          <div className="wolf-dropout-eye-left" />
          <div className="wolf-dropout-eye-right" />
          <div className="wolf-dropout-snout" />
        </div>
        <div className="wolf-dropout-jacket">
          <div className="wolf-dropout-emblem" />
        </div>
        <div className="wolf-dropout-paw-left" />
        <div className="wolf-dropout-paw-right" />
      </div>
    </div>
  );
};

// ============================================================================
// CSS Class Builder
// ============================================================================

const buildCSSClasses = (
  variant: WolfDropoutVariant,
  size: WolfDropoutSize,
  animation: WolfDropoutAnimation,
  animate: boolean,
  interactive: boolean,
  baseClassName?: string
): string => {
  const classes = [
    'wolf-dropout-mascot',
    `wolf-dropout--${variant}`,
    `wolf-dropout--size-${size}`,
    animate && `wolf-dropout--animate-${animation}`,
    interactive && 'wolf-dropout--interactive',
    baseClassName,
  ].filter(Boolean);

  return classes.join(' ');
};

// ============================================================================
// Main Dropout Wolf Mascot Component
// ============================================================================

export const WolfDropout = forwardRef<HTMLDivElement, WolfDropoutMascotProps>(
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
    const { enabled: motionEnabled } = useReducedMotion();
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
      const variantNames: Record<WolfDropoutVariant, string> = {
        default: 'Dropout Wolf',
        alpha: 'Dropout Wolf - Alpha Edition',
        'pack-leader': 'Dropout Wolf - Pack Leader Edition',
        silverback: 'Dropout Wolf - Silverback Edition',
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
          <WolfDropoutCSS
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
        <WolfDropoutSVG
          size={size}
          variant={variant}
          colors={colors}
          className="wolf-dropout-svg"
        />
      </motion.div>
    );
  }
);

WolfDropout.displayName = 'WolfDropout';

// ============================================================================
// Export Additional Types and Utilities
// ============================================================================

export { VARIANT_COLORS as WolfDropoutVariantColors };
export type { VariantColors as WolfDropoutVariantColors };

// Default export
export default WolfDropout;
