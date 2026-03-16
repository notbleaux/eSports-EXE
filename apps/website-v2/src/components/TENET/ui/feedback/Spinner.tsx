/** [Ver001.000] */
/**
 * Spinner Component
 * =================
 * Loading indicator for asynchronous operations.
 */

import { forwardRef } from 'react';

export interface SpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  color?: string;
  emptyColor?: string;
  thickness?: string;
  speed?: string;
  label?: string;
  className?: string;
}

const sizeMap = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

export const Spinner = forwardRef<SVGSVGElement, SpinnerProps>(
  (
    {
      size = 'md',
      color = 'currentColor',
      emptyColor = 'transparent',
      thickness = '4',
      speed = '0.75s',
      label = 'Loading...',
      className = '',
    },
    ref
  ) => {
    return (
      <svg
        ref={ref}
        className={`animate-spin ${sizeMap[size]} ${className}`}
        style={{ animationDuration: speed }}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
        aria-label={label}
        role="status"
      >
        {/* Background circle (empty) */}
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke={emptyColor === 'transparent' ? 'currentColor' : emptyColor}
          strokeWidth={thickness}
          strokeOpacity={0.25}
        />
        {/* Foreground arc (spinner) */}
        <path
          fill="none"
          stroke={color}
          strokeWidth={thickness}
          strokeLinecap="round"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    );
  }
);

Spinner.displayName = 'Spinner';

export default Spinner;
