/** [Ver001.000] */
/**
 * Rating Component
 * ================
 * Star rating display with optional interactivity.
 */

import { forwardRef, useState } from 'react';

export interface RatingProps {
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  emptyIcon?: React.ReactNode;
  filledIcon?: React.ReactNode;
  halfIcon?: React.ReactNode;
  isReadOnly?: boolean;
  isDisabled?: boolean;
  onChange?: (value: number) => void;
  onHover?: (value: number) => void;
  className?: string;
}

const sizeStyles = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

const StarIcon = ({
  filled,
  half,
  color,
  className,
}: {
  filled?: boolean;
  half?: boolean;
  color: string;
  className: string;
}) => {
  if (half) {
    return (
      <svg className={className} viewBox="0 0 20 20" fill="currentColor">
        <defs>
          <linearGradient id="half">
            <stop offset="50%" stopColor={color} />
            <stop offset="50%" stopColor="currentColor" stopOpacity="0.25" />
          </linearGradient>
        </defs>
        <path
          fill="url(#half)"
          d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"
        />
      </svg>
    );
  }

  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill={filled ? color : 'currentColor'}
      style={{ opacity: filled ? 1 : 0.25 }}
    >
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
    </svg>
  );
};

export const Rating = forwardRef<HTMLDivElement, RatingProps>(
  (
    {
      value = 0,
      max = 5,
      size = 'md',
      color = '#F59E0B',
      emptyIcon,
      filledIcon,
      halfIcon,
      isReadOnly = false,
      isDisabled = false,
      onChange,
      onHover,
      className = '',
    },
    ref
  ) => {
    const [hoverValue, setHoverValue] = useState(0);
    const displayValue = hoverValue || value;

    const handleMouseEnter = (index: number) => {
      if (isReadOnly || isDisabled) return;
      setHoverValue(index);
      onHover?.(index);
    };

    const handleMouseLeave = () => {
      if (isReadOnly || isDisabled) return;
      setHoverValue(0);
      onHover?.(0);
    };

    const handleClick = (index: number) => {
      if (isReadOnly || isDisabled) return;
      onChange?.(index);
    };

    const renderStar = (index: number) => {
      const isFilled = index <= displayValue;
      const isHalf = !Number.isInteger(displayValue) && 
                     Math.ceil(displayValue) === index && 
                     index - 0.5 <= displayValue;

      if (isHalf && halfIcon) {
        return (
          <span style={{ color }}>{halfIcon}</span>
        );
      }

      if (isFilled && filledIcon) {
        return (
          <span style={{ color }}>{filledIcon}</span>
        );
      }

      if (!isFilled && emptyIcon) {
        return (
          <span style={{ color }}>{emptyIcon}</span>
        );
      }

      return (
        <StarIcon
          filled={isFilled}
          half={isHalf && !halfIcon}
          color={color}
          className={sizeStyles[size]}
        />
      );
    };

    const stars = Array.from({ length: max }, (_, i) => i + 1);

    return (
      <div
        ref={ref}
        role={isReadOnly ? 'img' : 'radiogroup'}
        aria-label={`Rating: ${value} out of ${max}`}
        className={`inline-flex items-center ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
        onMouseLeave={handleMouseLeave}
      >
        {stars.map((index) => (
          <button
            key={index}
            type="button"
            disabled={isDisabled || isReadOnly}
            onClick={() => handleClick(index)}
            onMouseEnter={() => handleMouseEnter(index)}
            onFocus={() => handleMouseEnter(index)}
            className={`p-0.5 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 rounded ${
              isReadOnly || isDisabled ? 'cursor-default' : 'cursor-pointer'
            }`}
            style={{ color }}
            aria-label={`${index} stars`}
            aria-pressed={value >= index}
          >
            {renderStar(index)}
          </button>
        ))}
      </div>
    );
  }
);

Rating.displayName = 'Rating';

export default Rating;
