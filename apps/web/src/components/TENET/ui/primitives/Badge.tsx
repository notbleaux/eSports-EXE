/** [Ver001.000] */
/**
 * Badge Component
 * ===============
 * Status indicators for highlighting items or showing counts.
 */

import { forwardRef } from 'react';

export interface BadgeProps {
  variant?: 'solid' | 'subtle' | 'outline';
  colorScheme?: string;
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}

const variantStyles: Record<string, Record<string, string>> = {
  solid: {
    blue: 'bg-blue-600 text-white',
    green: 'bg-green-600 text-white',
    red: 'bg-red-600 text-white',
    yellow: 'bg-yellow-500 text-white',
    purple: 'bg-purple-600 text-white',
    gray: 'bg-gray-600 text-white',
  },
  subtle: {
    blue: 'bg-blue-100 text-blue-800',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    purple: 'bg-purple-100 text-purple-800',
    gray: 'bg-gray-100 text-gray-800',
  },
  outline: {
    blue: 'border border-blue-600 text-blue-600',
    green: 'border border-green-600 text-green-600',
    red: 'border border-red-600 text-red-600',
    yellow: 'border border-yellow-500 text-yellow-600',
    purple: 'border border-purple-600 text-purple-600',
    gray: 'border border-gray-600 text-gray-600',
  },
};

const sizeStyles = {
  sm: 'px-2 py-0.5 text-xs',
  md: 'px-2.5 py-0.5 text-sm',
  lg: 'px-3 py-1 text-sm',
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'subtle',
      colorScheme = 'gray',
      size = 'md',
      children,
      className = '',
    },
    ref
  ) => {
    const colorStyles = variantStyles[variant][colorScheme] || variantStyles[variant].gray;

    return (
      <span
        ref={ref}
        className={`inline-flex items-center font-medium rounded-full ${colorStyles} ${sizeStyles[size]} ${className}`}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

export default Badge;
