/** [Ver001.000]
 *
 * Touch-friendly Button Component
 * 
 * Mobile-optimized button with 44px minimum touch target,
 * visual feedback, and ripple effects.
 * 
 * @module components/mobile/TouchButton
 */

import React, { 
  useState, 
  useRef, 
  useCallback, 
  forwardRef,
  useImperativeHandle 
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Ripple animation configuration
 */
interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

/**
 * Button variant styles
 */
export type ButtonVariant = 
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success'
  | 'hub-sator'
  | 'hub-rotas'
  | 'hub-arepo'
  | 'hub-opera'
  | 'hub-tenet';

/**
 * Button size presets
 */
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'touch';

/**
 * Props for TouchButton
 */
export interface TouchButtonProps extends 
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Show loading state */
  loading?: boolean;
  /** Disable ripple effect */
  noRipple?: boolean;
  /** Add press animation */
  pressAnimation?: boolean;
  /** Left icon element */
  leftIcon?: React.ReactNode;
  /** Right icon element */
  rightIcon?: React.ReactNode;
  /** Icon only button (square) */
  iconOnly?: boolean;
  /** Loading text */
  loadingText?: string;
  /** Additional classes */
  className?: string;
  /** Children */
  children?: React.ReactNode;
  /** Haptic feedback (vibration) */
  haptic?: boolean | number;
}

/**
 * Merge Tailwind classes
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Minimum touch target size (44px as per WCAG/W3C guidelines)
 */
const MIN_TOUCH_TARGET = 44;

/**
 * Button size configurations
 */
const SIZE_CONFIGS: Record<ButtonSize, {
  height: string;
  padding: string;
  fontSize: string;
  iconSize: string;
  touchTarget: string;
}> = {
  xs: {
    height: 'h-7',
    padding: 'px-2',
    fontSize: 'text-xs',
    iconSize: 'w-3 h-3',
    touchTarget: 'min-w-[44px] min-h-[44px]',
  },
  sm: {
    height: 'h-8',
    padding: 'px-3',
    fontSize: 'text-sm',
    iconSize: 'w-4 h-4',
    touchTarget: 'min-w-[44px] min-h-[44px]',
  },
  md: {
    height: 'h-10',
    padding: 'px-4',
    fontSize: 'text-sm',
    iconSize: 'w-4 h-4',
    touchTarget: 'min-w-[44px] min-h-[44px]',
  },
  lg: {
    height: 'h-12',
    padding: 'px-6',
    fontSize: 'text-base',
    iconSize: 'w-5 h-5',
    touchTarget: 'min-w-[44px] min-h-[44px]',
  },
  xl: {
    height: 'h-14',
    padding: 'px-8',
    fontSize: 'text-lg',
    iconSize: 'w-6 h-6',
    touchTarget: 'min-w-[48px] min-h-[48px]',
  },
  touch: {
    height: 'h-11',
    padding: 'px-5',
    fontSize: 'text-base',
    iconSize: 'w-5 h-5',
    touchTarget: 'min-w-[44px] min-h-[44px]',
  },
};

/**
 * Variant style configurations
 */
const VARIANT_CONFIGS: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-gold-500 text-prussian-blue',
    'hover:bg-gold-500/90',
    'active:bg-gold-500/80',
    'focus:ring-gold-500/50',
    'disabled:bg-gold-500/50'
  ),
  secondary: cn(
    'bg-silver text-prussian-blue',
    'hover:bg-silver/90',
    'active:bg-silver/80',
    'focus:ring-silver/50',
    'disabled:bg-silver/50'
  ),
  outline: cn(
    'bg-transparent border-2 border-porcelain/30 text-porcelain',
    'hover:border-porcelain/50 hover:bg-white/5',
    'active:bg-white/10',
    'focus:ring-porcelain/30',
    'disabled:border-porcelain/20 disabled:text-porcelain/50'
  ),
  ghost: cn(
    'bg-transparent text-porcelain',
    'hover:bg-white/10',
    'active:bg-white/15',
    'focus:ring-white/20',
    'disabled:text-porcelain/40'
  ),
  danger: cn(
    'bg-red-500 text-white',
    'hover:bg-red-500/90',
    'active:bg-red-500/80',
    'focus:ring-red-500/50',
    'disabled:bg-red-500/50'
  ),
  success: cn(
    'bg-green-500 text-white',
    'hover:bg-green-500/90',
    'active:bg-green-500/80',
    'focus:ring-green-500/50',
    'disabled:bg-green-500/50'
  ),
  'hub-sator': cn(
    'bg-sator-accent text-sator-bg',
    'hover:bg-sator-accent/90',
    'active:bg-sator-accent/80',
    'focus:ring-sator-accent/50',
    'disabled:bg-sator-accent/50'
  ),
  'hub-rotas': cn(
    'bg-rotas-bg text-rotas-text border border-rotas-accent',
    'hover:bg-rotas-bg/90',
    'active:bg-rotas-bg/80',
    'focus:ring-rotas-accent/50',
    'disabled:opacity-50'
  ),
  'hub-arepo': cn(
    'bg-arepo-bg text-arepo-text',
    'hover:bg-arepo-bg/90',
    'active:bg-arepo-bg/80',
    'focus:ring-arepo-accent/50',
    'disabled:bg-arepo-bg/50'
  ),
  'hub-opera': cn(
    'bg-opera-bg text-opera-text border border-opera-accent',
    'hover:bg-opera-bg/90',
    'active:bg-opera-bg/80',
    'focus:ring-opera-accent/50',
    'disabled:opacity-50'
  ),
  'hub-tenet': cn(
    'bg-prussian-blue text-porcelain border border-gold-500',
    'hover:bg-prussian-blue/90',
    'active:bg-prussian-blue/80',
    'focus:ring-gold-500/50',
    'disabled:opacity-50'
  ),
};

/**
 * Touch-optimized Button Component
 * 
 * Features:
 * - 44px minimum touch target (WCAG compliant)
 * - Ripple effect on press
 * - Visual press feedback
 * - Haptic feedback support
 * - Loading state
 * 
 * @example
 * ```tsx
 * // Basic button
 * <TouchButton>Click me</TouchButton>
 * 
 * // With variant and size
 * <TouchButton variant="primary" size="lg">
 *   Submit
 * </TouchButton>
 * 
 * // Icon button
 * <TouchButton iconOnly leftIcon={<Icon />} aria-label="Settings" />
 * 
 * // With loading state
 * <TouchButton loading loadingText="Saving...">
 *   Save
 * </TouchButton>
 * ```
 */
export const TouchButton = forwardRef<
  HTMLButtonElement,
  TouchButtonProps
>(
  (
    {
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      loading = false,
      noRipple = false,
      pressAnimation = true,
      leftIcon,
      rightIcon,
      iconOnly = false,
      loadingText,
      className,
      children,
      haptic = false,
      disabled,
      onClick,
      onPointerDown,
      onPointerUp,
      style,
      ...props
    },
    forwardedRef
  ) => {
    const [ripples, setRipples] = useState<Ripple[]>([]);
    const [isPressed, setIsPressed] = useState(false);
    const buttonRef = useRef<HTMLButtonElement>(null);
    
    // Forward ref
    useImperativeHandle(forwardedRef, () => buttonRef.current!);

    // Generate unique ripple ID
    const rippleIdRef = useRef(0);

    // Trigger haptic feedback
    const triggerHaptic = useCallback(() => {
      if (!haptic || typeof navigator === 'undefined') return;
      
      if (navigator.vibrate) {
        const duration = typeof haptic === 'number' ? haptic : 10;
        navigator.vibrate(duration);
      }
    }, [haptic]);

    // Create ripple effect
    const createRipple = useCallback((event: React.PointerEvent<HTMLButtonElement>) => {
      if (noRipple || loading) return;

      const button = buttonRef.current;
      if (!button) return;

      const rect = button.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = event.clientX - rect.left - size / 2;
      const y = event.clientY - rect.top - size / 2;

      const newRipple: Ripple = {
        id: rippleIdRef.current++,
        x,
        y,
        size,
      };

      setRipples((prev) => [...prev, newRipple]);

      // Remove ripple after animation
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);
    }, [noRipple, loading]);

    // Handle pointer down
    const handlePointerDown = useCallback((
      event: React.PointerEvent<HTMLButtonElement>
    ) => {
      if (!disabled && !loading) {
        setIsPressed(true);
        createRipple(event);
        triggerHaptic();
      }
      onPointerDown?.(event);
    }, [disabled, loading, createRipple, triggerHaptic, onPointerDown]);

    // Handle pointer up
    const handlePointerUp = useCallback((
      event: React.PointerEvent<HTMLButtonElement>
    ) => {
      setIsPressed(false);
      onPointerUp?.(event);
    }, [onPointerUp]);

    // Handle pointer leave
    const handlePointerLeave = useCallback(() => {
      setIsPressed(false);
    }, []);

    // Handle click
    const handleClick = useCallback((
      event: React.MouseEvent<HTMLButtonElement>
    ) => {
      if (!disabled && !loading) {
        onClick?.(event);
      }
    }, [disabled, loading, onClick]);

    const sizeConfig = SIZE_CONFIGS[size];
    const isDisabled = disabled || loading;

    const baseClasses = cn(
      // Base styles
      'relative inline-flex items-center justify-center',
      'font-medium transition-all duration-150',
      'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-prussian-blue',
      'overflow-hidden select-none',
      'touch-manipulation',
      
      // Touch target (minimum 44px)
      sizeConfig.touchTarget,
      
      // Size styles
      iconOnly ? `w-${sizeConfig.height.replace('h-', '')}` : [
        sizeConfig.height,
        sizeConfig.padding,
      ],
      
      // Typography
      sizeConfig.fontSize,
      
      // Width
      fullWidth && 'w-full',
      
      // Variant styles
      VARIANT_CONFIGS[variant],
      
      // State styles
      isDisabled && 'opacity-60 cursor-not-allowed',
      !isDisabled && 'cursor-pointer active:scale-[0.98]',
      
      // Icon only shape
      iconOnly && 'rounded-xl',
      !iconOnly && 'rounded-lg',
      
      // Press animation
      pressAnimation && isPressed && !isDisabled && 'scale-[0.98]',
      
      // Custom classes
      className
    );

    return (
      <motion.button
        ref={buttonRef}
        type="button"
        className={baseClasses}
        disabled={isDisabled}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={style}
        whileTap={pressAnimation && !isDisabled ? { scale: 0.98 } : undefined}
        {...props}
      >
        {/* Ripples */}
        <AnimatePresence>
          {!noRipple && ripples.map((ripple) => (
            <motion.span
              key={ripple.id}
              className={cn(
                'absolute rounded-full pointer-events-none',
                variant === 'primary' ? 'bg-white/30' : 'bg-current/20'
              )}
              style={{
                left: ripple.x,
                top: ripple.y,
                width: ripple.size,
                height: ripple.size,
              }}
              initial={{ scale: 0, opacity: 0.5 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        {/* Loading spinner */}
        {loading && (
          <span className="absolute inset-0 flex items-center justify-center">
            <svg
              className={cn(
                'animate-spin',
                sizeConfig.iconSize
              )}
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </span>
        )}

        {/* Button content */}
        <span
          className={cn(
            'flex items-center gap-2',
            loading && 'opacity-0'
          )}
        >
          {leftIcon && (
            <span className={cn(
              'flex-shrink-0',
              sizeConfig.iconSize
            )}>
              {leftIcon}
            </span>
          )}
          
          {iconOnly ? null : (
            <span>
              {loading && loadingText ? loadingText : children}
            </span>
          )}
          
          {rightIcon && !iconOnly && (
            <span className={cn(
              'flex-shrink-0',
              sizeConfig.iconSize
            )}>
              {rightIcon}
            </span>
          )}
        </span>
      </motion.button>
    );
  }
);

TouchButton.displayName = 'TouchButton';

/**
 * Touch-friendly Icon Button
 * Simplified API for icon-only buttons
 */
export interface TouchIconButtonProps extends 
  Omit<TouchButtonProps, 'iconOnly' | 'leftIcon' | 'rightIcon' | 'children'> {
  /** Icon element */
  icon: React.ReactNode;
  /** Accessible label (required for icon-only buttons) */
  'aria-label': string;
}

export const TouchIconButton = forwardRef<
  HTMLButtonElement,
  TouchIconButtonProps
>(
  ({ icon, size = 'md', ...props }, ref) => (
    <TouchButton
      ref={ref}
      iconOnly
      size={size}
      leftIcon={icon}
      {...props}
    />
  )
);

TouchIconButton.displayName = 'TouchIconButton';

/**
 * Touch-friendly Link Button
 * Renders as anchor tag with button styling
 */
export interface TouchLinkButtonProps extends 
  Omit<TouchButtonProps, 'onClick'> {
  /** Link href */
  href: string;
  /** Open in new tab */
  external?: boolean;
}

export const TouchLinkButton = forwardRef<
  HTMLAnchorElement,
  TouchLinkButtonProps
>(
  (
    { href, external, onPointerDown, onPointerUp, ...props },
    ref
  ) => {
    return (
      <a
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={cn(
          'inline-flex',
          props.fullWidth && 'w-full'
        )}
        {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
      >
        <TouchButton
          {...props}
          fullWidth={props.fullWidth}
          onPointerDown={onPointerDown as React.PointerEventHandler<HTMLButtonElement>}
          onPointerUp={onPointerUp as React.PointerEventHandler<HTMLButtonElement>}
        />
      </a>
    );
  }
);

TouchLinkButton.displayName = 'TouchLinkButton';

export default TouchButton;
