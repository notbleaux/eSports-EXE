import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Valorant-Style Button Component
 * 
 * Design Reference:
 * - Sharp corners (minimal border radius)
 * - Bold uppercase text with wide tracking
 * - Primary: Red accent with neon glow on hover
 * - Secondary: Transparent with red border
 * - Ghost: Minimal, for subtle actions
 * 
 * @example
 * <Button variant="primary" size="lg">DEPLOY</Button>
 * <Button variant="secondary">SCAN</Button>
 */

export type ButtonVariant = 'primary' | 'secondary' | 'cyan' | 'ghost' | 'outline' | 'danger';
export type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'icon-xs' | 'icon-sm' | 'icon-md' | 'icon-lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size of the button */
  size?: ButtonSize;
  /** Full width button */
  fullWidth?: boolean;
  /** Icon displayed before the text */
  leftIcon?: React.ReactNode;
  /** Icon displayed after the text */
  rightIcon?: React.ReactNode;
  /** Loading state */
  isLoading?: boolean;
  /** Loading text (defaults to children) */
  loadingText?: string;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: [
    'bg-[#F43F5E] text-white',
    'border-2 border-[#F43F5E]',
    'hover:bg-[#E11D48] hover:border-[#E11D48]',
    'hover:shadow-[0_0_20px_rgba(244,63,94,0.5)]',
    'active:bg-[#BE123C]',
  ].join(' '),
  secondary: [
    'bg-transparent text-[#F43F5E]',
    'border-2 border-[#F43F5E]',
    'hover:bg-[rgba(244,63,94,0.1)]',
    'hover:shadow-[0_0_15px_rgba(244,63,94,0.3)]',
    'active:bg-[rgba(244,63,94,0.2)]',
  ].join(' '),
  cyan: [
    'bg-[#22D3EE] text-[#050817]',
    'border-2 border-[#22D3EE]',
    'hover:bg-[#06B6D4] hover:border-[#06B6D4]',
    'hover:shadow-[0_0_20px_rgba(34,211,238,0.5)]',
    'active:bg-[#0891B2]',
  ].join(' '),
  ghost: [
    'bg-transparent text-[#B8BAC4]',
    'border-2 border-transparent',
    'hover:bg-[#2E3652] hover:text-white',
    'active:bg-[#1A1D2E]',
  ].join(' '),
  outline: [
    'bg-transparent text-[#8A8E9E]',
    'border-2 border-[#2E3652]',
    'hover:border-[#5C6278] hover:text-[#B8BAC4]',
    'active:border-[#8A8E9E]',
  ].join(' '),
  danger: [
    'bg-[#EF4444] text-white',
    'border-2 border-[#EF4444]',
    'hover:bg-[#DC2626] hover:border-[#DC2626]',
    'hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]',
    'active:bg-[#B91C1C]',
  ].join(' '),
};

const sizeStyles: Record<ButtonSize, string> = {
  xs: 'h-7 px-3 text-[10px] gap-1.5 rounded-sm',
  sm: 'h-8 px-4 text-[11px] gap-2 rounded-sm',
  md: 'h-10 px-5 text-xs gap-2 rounded',
  lg: 'h-12 px-6 text-sm gap-2.5 rounded',
  xl: 'h-14 px-8 text-sm gap-3 rounded',
  'icon-xs': 'h-7 w-7 p-1.5 rounded-sm',
  'icon-sm': 'h-8 w-8 p-2 rounded-sm',
  'icon-md': 'h-10 w-10 p-2.5 rounded',
  'icon-lg': 'h-12 w-12 p-3 rounded',
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      leftIcon,
      rightIcon,
      isLoading,
      loadingText,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const isDisabled = disabled || isLoading;
    const isIconOnly = size?.startsWith('icon');

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center',
          'font-bold uppercase tracking-[0.15em]',
          'transition-all duration-200 ease-out',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'focus-visible:ring-[#F43F5E] focus-visible:ring-offset-[#050817]',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          'active:scale-[0.98]',
          'overflow-hidden',
          // Variant and size
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={isDisabled}
        {...props}
      >
        {/* Loading spinner */}
        {isLoading && (
          <span className="absolute inset-0 flex items-center justify-center bg-inherit">
            <svg
              className="animate-spin h-4 w-4"
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
            {!isIconOnly && (
              <span className="ml-2">{loadingText || children}</span>
            )}
          </span>
        )}
        
        {/* Button content */}
        <span
          className={cn(
            'flex items-center justify-center gap-inherit',
            isLoading && 'opacity-0'
          )}
        >
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {!isIconOnly && <span>{children}</span>}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>

        {/* Accent edge line (Valorant style) */}
        {variant === 'primary' && (
          <span className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        )}
        
        {/* Corner accent for secondary */}
        {variant === 'secondary' && (
          <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[#F43F5E]" />
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;
