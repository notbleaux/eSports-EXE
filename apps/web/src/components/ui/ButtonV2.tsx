/**
 * ButtonV2 - Valorant-styled Button Component
 * Tactical, sharp, with signature red glow effects
 * 
 * [Ver001.000] - Initial Valorant button implementation
 */
import React from 'react';
import { cn } from '@/utils/cn';

export interface ButtonV2Props extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Button visual variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  
  /**
   * Button size
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  /**
   * Full width button
   * @default false
   */
  fullWidth?: boolean;
  
  /**
   * Add glow effect
   * @default false
   */
  glow?: boolean;
  
  /**
   * Loading state
   * @default false
   */
  loading?: boolean;
  
  /**
   * Left icon
   */
  leftIcon?: React.ReactNode;
  
  /**
   * Right icon
   */
  rightIcon?: React.ReactNode;
}

export const ButtonV2 = React.forwardRef<HTMLButtonElement, ButtonV2Props>(
  (
    {
      children,
      variant = 'primary',
      size = 'md',
      fullWidth = false,
      glow = false,
      loading = false,
      leftIcon,
      rightIcon,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles - sharp corners, tactical feel
    const baseStyles = `
      relative inline-flex items-center justify-center
      font-semibold uppercase tracking-wider
      transition-all duration-200 ease-out
      focus:outline-none focus:ring-2 focus:ring-valorant-accent-red focus:ring-offset-2 focus:ring-offset-valorant-bg-base
      disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none
      active:scale-[0.98]
    `;

    // Variant styles
    const variantStyles = {
      primary: `
        bg-valorant-accent-red text-white
        hover:bg-valorant-accent-red-hover
        border-2 border-valorant-accent-red
        shadow-valorant-glow-sm hover:shadow-valorant-glow
      `,
      secondary: `
        bg-valorant-accent-teal text-valorant-bg-base
        hover:bg-valorant-accent-teal-hover
        border-2 border-valorant-accent-teal
        shadow-valorant-teal hover:shadow-[0_0_30px_rgba(10,200,185,0.4)]
      `,
      outline: `
        bg-transparent text-valorant-text-primary
        hover:bg-valorant-bg-elevated
        border-2 border-valorant-border-medium
        hover:border-valorant-accent-red
        hover:text-valorant-accent-red
      `,
      ghost: `
        bg-transparent text-valorant-text-secondary
        hover:bg-valorant-bg-elevated
        hover:text-valorant-text-primary
        border-2 border-transparent
      `,
      danger: `
        bg-transparent text-valorant-status-error
        hover:bg-valorant-status-error/10
        border-2 border-valorant-status-error
        hover:shadow-[0_0_20px_rgba(255,70,85,0.3)]
      `,
    };

    // Size styles - compact tactical sizing
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-xs rounded-sm',
      md: 'px-4 py-2 text-sm rounded-sm',
      lg: 'px-6 py-3 text-base rounded-sm',
      xl: 'px-8 py-4 text-lg rounded-sm',
    };

    // Loading spinner
    const LoadingSpinner = () => (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
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
    );

    return (
      <button
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          glow && !disabled && 'shadow-valorant-glow hover:shadow-valorant-glow-lg',
          className
        )}
        disabled={disabled || loading}
        {...props}
      >
        {loading && <LoadingSpinner />}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

ButtonV2.displayName = 'ButtonV2';

export default ButtonV2;
