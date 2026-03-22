/** [Ver001.000]
 * GlowButton Component
 * 
 * Enhanced button component with ripple effects, gradient glow,
 * loading states, and full accessibility support.
 * 
 * Features:
 * - Ripple click effects
 * - Gradient glow on hover
 * - Loading state with spinner
 * - Hub-specific theming
 * - Reduced motion support
 * - Multiple variants and sizes
 * - GPU-accelerated animations
 * 
 * Design Tokens:
 * - Primary: Gradient from hub color to accent
 * - Secondary: Outlined with glow
 * - Ghost: Transparent with subtle hover
 * 
 * @example
 * ```tsx
 * // Primary button
 * <GlowButton>Click Me</GlowButton>
 * 
 * // Hub-themed loading button
 * <GlowButton 
 *   hubTheme="sator" 
 *   loading={isLoading}
 *   loadingState="loading"
 * >
 *   Processing...
 * </GlowButton>
 * 
 * // Secondary with ripple
 * <GlowButton variant="secondary" ripple>
 *   Secondary Action
 * </GlowButton>
 * ```
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';
import { easings } from '@/lib/easing';
import type { GlowButtonProps, ButtonVariant, ButtonSize, RippleEffect, HubId } from '@/types/animation';

// ============================================================================
// Hub Theme Configuration
// ============================================================================

/**
 * Hub gradient configurations for button theming.
 */
const HUB_GRADIENTS: Record<HubId, string> = {
  sator: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
  rotas: 'linear-gradient(135deg, #a855f7 0%, #c084fc 100%)',
  arepo: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
  opera: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
  tenet: 'linear-gradient(135deg, #ffffff 0%, #e5e7eb 100%)',
};

const HUB_GLOW_COLORS: Record<HubId, string> = {
  sator: '#3b82f6',
  rotas: '#a855f7',
  arepo: '#f59e0b',
  opera: '#06b6d4',
  tenet: '#ffffff',
};

// ============================================================================
// Style Configurations
// ============================================================================

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm min-h-[32px]',
  md: 'px-4 py-2 text-base min-h-[40px]',
  lg: 'px-6 py-3 text-lg min-h-[48px]',
};

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: cn(
    'text-white font-semibold',
    'shadow-lg shadow-black/20'
  ),
  secondary: cn(
    'bg-transparent',
    'border-2 border-current',
    'text-white font-medium',
    'hover:bg-white/5'
  ),
  ghost: cn(
    'bg-transparent',
    'text-white/80 hover:text-white',
    'hover:bg-white/5'
  ),
};

// ============================================================================
// Loading Spinner Component
// ============================================================================

interface LoadingSpinnerProps {
  size?: ButtonSize;
  color?: string;
}

function LoadingSpinner({ size = 'md', color = 'currentColor' }: LoadingSpinnerProps): JSX.Element {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };
  
  return (
    <motion.svg
      className={cn('animate-spin', sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill={color}
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </motion.svg>
  );
}

// ============================================================================
// Ripple Effect Component
// ============================================================================

interface RippleProps {
  ripples: RippleEffect[];
  color: string;
  onComplete: (id: string) => void;
}

function RippleEffects({ ripples, color, onComplete }: RippleProps): JSX.Element {
  return (
    <>
      {ripples.map((ripple) => (
        <motion.span
          key={ripple.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            marginLeft: -ripple.size / 2,
            marginTop: -ripple.size / 2,
            backgroundColor: color,
          }}
          initial={{ scale: 0, opacity: 0.4 }}
          animate={{ scale: 2, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6, ease: easings.fluid }}
          onAnimationComplete={() => onComplete(ripple.id)}
        />
      ))}
    </>
  );
}

// ============================================================================
// Main Component
// ============================================================================

export interface GlowButtonComponentProps extends GlowButtonProps {
  /** Additional motion props */
  motionProps?: HTMLMotionProps<'button'>;
}

export function GlowButton({
  children,
  variant = 'primary',
  size = 'md',
  glowColor,
  hubTheme,
  loading = false,
  loadingState = 'idle',
  ripple = true,
  reducedMotion: forceReducedMotion,
  disabled = false,
  className,
  onClick,
  type = 'button',
  motionProps,
}: GlowButtonComponentProps): JSX.Element {
  const { prefersReducedMotion } = useReducedMotion(forceReducedMotion);
  const [ripples, setRipples] = useState<RippleEffect[]>([]);
  const buttonRef = useRef<HTMLButtonElement>(null);
  
  // Determine colors
  const effectiveGlowColor = hubTheme 
    ? HUB_GLOW_COLORS[hubTheme] 
    : glowColor || '#ff4655';
  
  const gradient = hubTheme ? HUB_GRADIENTS[hubTheme] : undefined;
  
  // Determine if button is in loading state
  const isLoading = loading || loadingState === 'loading';
  const isDisabled = disabled || isLoading;
  
  // Handle ripple creation
  const createRipple = useCallback((event: React.MouseEvent<HTMLButtonElement>): void => {
    if (!ripple || prefersReducedMotion) return;
    
    const button = buttonRef.current;
    if (!button) return;
    
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newRipple: RippleEffect = {
      id: `${Date.now()}-${Math.random()}`,
      x,
      y,
      size,
    };
    
    setRipples((prev) => [...prev, newRipple]);
  }, [ripple, prefersReducedMotion]);
  
  // Remove completed ripple
  const removeRipple = useCallback((id: string): void => {
    setRipples((prev) => prev.filter((r) => r.id !== id));
  }, []);
  
  // Handle click
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>): void => {
    createRipple(event);
    onClick?.(event);
  };
  
  // Base classes
  const baseClasses = cn(
    // Layout
    'relative overflow-hidden rounded-lg font-sans',
    'inline-flex items-center justify-center gap-2',
    
    // Focus styles
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black',
    'focus:ring-opacity-50',
    
    // Disabled state
    isDisabled && 'opacity-50 cursor-not-allowed',
    
    // Size
    SIZE_CLASSES[size],
    
    // Variant
    VARIANT_CLASSES[variant],
    
    // Custom classes
    className
  );
  
  // Motion variants
  const variants = {
    initial: { scale: 1 },
    hover: isDisabled || prefersReducedMotion 
      ? {} 
      : { 
          scale: 1.05,
          boxShadow: variant === 'primary' 
            ? `0 0 30px ${effectiveGlowColor}` 
            : `0 0 20px ${effectiveGlowColor}`,
        },
    tap: isDisabled || prefersReducedMotion ? {} : { scale: 0.95 },
  };
  
  // Loading state content
  const renderContent = (): React.ReactNode => {
    if (isLoading) {
      return (
        <>
          <LoadingSpinner size={size} />
          <span>{children}</span>
        </>
      );
    }
    
    if (loadingState === 'success') {
      return (
        <>
          <motion.svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </motion.svg>
          <span>{children}</span>
        </>
      );
    }
    
    if (loadingState === 'error') {
      return (
        <>
          <motion.svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </motion.svg>
          <span>{children}</span>
        </>
      );
    }
    
    return children;
  };
  
  return (
    <motion.button
      ref={buttonRef}
      type={type}
      className={baseClasses}
      style={{
        background: variant === 'primary' ? gradient : undefined,
        // Fallback background if no hub theme
        backgroundColor: variant === 'primary' && !gradient 
          ? effectiveGlowColor 
          : undefined,
      }}
      variants={variants}
      initial="initial"
      whileHover={!isDisabled ? 'hover' : undefined}
      whileTap={!isDisabled ? 'tap' : undefined}
      transition={{
        duration: 0.15,
        ease: easings.spring,
      }}
      onClick={handleClick}
      disabled={isDisabled}
      aria-busy={isLoading}
      aria-disabled={isDisabled}
      {...motionProps}
    >
      {/* Ripple effects */}
      <AnimatePresence>
        {ripples.length > 0 && (
          <RippleEffects
            ripples={ripples}
            color="rgba(255, 255, 255, 0.3)"
            onComplete={removeRipple}
          />
        )}
      </AnimatePresence>
      
      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.span
          key={loadingState}
          className="relative z-10 flex items-center gap-2"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
        >
          {renderContent()}
        </motion.span>
      </AnimatePresence>
    </motion.button>
  );
}

// ============================================================================
// Hub Variants
// ============================================================================

export function SatorButton(props: Omit<GlowButtonComponentProps, 'hubTheme'>): JSX.Element {
  return <GlowButton hubTheme="sator" {...props} />;
}

export function RotasButton(props: Omit<GlowButtonComponentProps, 'hubTheme'>): JSX.Element {
  return <GlowButton hubTheme="rotas" {...props} />;
}

export function ArepoButton(props: Omit<GlowButtonComponentProps, 'hubTheme'>): JSX.Element {
  return <GlowButton hubTheme="arepo" {...props} />;
}

export function OperaButton(props: Omit<GlowButtonComponentProps, 'hubTheme'>): JSX.Element {
  return <GlowButton hubTheme="opera" {...props} />;
}

export function TenetButton(props: Omit<GlowButtonComponentProps, 'hubTheme'>): JSX.Element {
  return <GlowButton hubTheme="tenet" {...props} />;
}

// ============================================================================
// Export
// ============================================================================

export default GlowButton;
