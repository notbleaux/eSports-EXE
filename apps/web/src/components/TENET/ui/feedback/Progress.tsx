/** [Ver001.000] */
/**
 * Progress Component
 * ==================
 * Linear progress indicator for displaying completion status.
 */

import { forwardRef, useEffect, useState } from 'react';

export interface ProgressProps {
  value?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  colorScheme?: string;
  isIndeterminate?: boolean;
  hasStripe?: boolean;
  isAnimated?: boolean;
  min?: number;
  max?: number;
  className?: string;
}

const sizeStyles = {
  xs: 'h-1',
  sm: 'h-2',
  md: 'h-3',
  lg: 'h-4',
};

const colorSchemes: Record<string, string> = {
  blue: 'bg-blue-500',
  green: 'bg-green-500',
  red: 'bg-red-500',
  yellow: 'bg-yellow-500',
  purple: 'bg-purple-500',
  pink: 'bg-pink-500',
  gray: 'bg-gray-500',
};

export const Progress = forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      value = 0,
      size = 'md',
      colorScheme = 'blue',
      isIndeterminate = false,
      hasStripe = false,
      isAnimated = false,
      min = 0,
      max = 100,
      className = '',
    },
    ref
  ) => {
    const [stripeOffset, setStripeOffset] = useState(0);

    const clampedValue = Math.min(Math.max(value, min), max);
    const percentage = ((clampedValue - min) / (max - min)) * 100;

    const bgColor = colorSchemes[colorScheme] || colorSchemes.blue;

    useEffect(() => {
      if (!isIndeterminate && isAnimated && hasStripe) {
        const interval = setInterval(() => {
          setStripeOffset((prev) => (prev + 1) % 40);
        }, 50);
        return () => clearInterval(interval);
      }
    }, [isIndeterminate, isAnimated, hasStripe]);

    const stripeStyle = hasStripe
      ? {
          backgroundImage: `linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.15) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.15) 50%,
            rgba(255, 255, 255, 0.15) 75%,
            transparent 75%,
            transparent
          )`,
          backgroundSize: '1rem 1rem',
          backgroundPosition: `${stripeOffset}px 0`,
        }
      : {};

    return (
      <div
        ref={ref}
        role="progressbar"
        aria-valuemin={min}
        aria-valuemax={max}
        aria-valuenow={isIndeterminate ? undefined : clampedValue}
        className={`w-full overflow-hidden rounded-full bg-gray-200 ${sizeStyles[size]} ${className}`}
      >
        <div
          className={`h-full transition-all duration-300 ease-out ${bgColor} ${
            isIndeterminate ? 'animate-progress-indeterminate' : ''
          }`}
          style={{
            width: isIndeterminate ? '100%' : `${percentage}%`,
            ...stripeStyle,
          }}
        />
      </div>
    );
  }
);

Progress.displayName = 'Progress';

// Add keyframe animation for indeterminate state
const style = document.createElement('style');
style.textContent = `
  @keyframes progress-indeterminate {
    0% {
      transform: translateX(-100%);
    }
    50% {
      transform: translateX(0%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  .animate-progress-indeterminate {
    animation: progress-indeterminate 1.5s ease-in-out infinite;
  }
`;
if (typeof document !== 'undefined') {
  document.head.appendChild(style);
}

export default Progress;
