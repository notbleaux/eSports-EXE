/** [Ver001.000] */
/**
 * Slider Component
 * ================
 * Range input for numeric value selection.
 */

import React from 'react';

export interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'value' | 'defaultValue' | 'onChange'> {
  min?: number;
  max?: number;
  step?: number;
  value?: number;
  defaultValue?: number;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  onChange?: (value: number) => void;
  onChangeEnd?: (value: number) => void;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      min = 0,
      max = 100,
      step = 1,
      value,
      defaultValue,
      orientation = 'horizontal',
      size = 'md',
      colorScheme = 'primary',
      disabled = false,
      onChange,
      onChangeEnd,
      className = '',
      ...props
    },
    ref
  ) => {
    const [internalValue, setInternalValue] = React.useState(defaultValue ?? min);
    const isControlled = value !== undefined;
    const currentValue = isControlled ? value : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = parseFloat(e.target.value);
      if (!isControlled) {
        setInternalValue(newValue);
      }
      onChange?.(newValue);
    };

    const handleMouseUp = () => {
      onChangeEnd?.(currentValue);
    };

    const percentage = ((currentValue - min) / (max - min)) * 100;

    const sizeStyles = {
      sm: orientation === 'horizontal' ? 'h-1' : 'w-1',
      md: orientation === 'horizontal' ? 'h-2' : 'w-2',
      lg: orientation === 'horizontal' ? 'h-3' : 'w-3',
    };

    const colorStyles = {
      primary: '#2563EB',
      secondary: '#9333EA',
      success: '#16A34A',
      warning: '#CA8A04',
      error: '#DC2626',
    };

    const orientationStyles = {
      horizontal: 'w-full h-2',
      vertical: 'h-32 w-2',
    };

    const trackStyles = {
      background: `linear-gradient(to ${orientation === 'horizontal' ? 'right' : 'top'}, ${colorStyles[colorScheme]} ${percentage}%, #E5E7EB ${percentage}%)`,
    };

    return (
      <div className={`relative flex items-center ${orientation === 'vertical' ? 'h-40' : ''} ${className}`}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentValue}
          disabled={disabled}
          onChange={handleChange}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          className={`appearance-none rounded-full cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${sizeStyles[size]} ${orientationStyles[orientation]}`}
          style={trackStyles}
          {...props}
        />
        <style>{`
          input[type="range"]::-webkit-slider-thumb {
            appearance: none;
            width: ${size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px'};
            height: ${size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px'};
            background: white;
            border: 2px solid ${colorStyles[colorScheme]};
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            transition: transform 0.1s ease;
          }
          input[type="range"]::-webkit-slider-thumb:hover {
            transform: scale(1.1);
          }
          input[type="range"]::-moz-range-thumb {
            width: ${size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px'};
            height: ${size === 'sm' ? '12px' : size === 'md' ? '16px' : '20px'};
            background: white;
            border: 2px solid ${colorStyles[colorScheme]};
            border-radius: 50%;
            cursor: pointer;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>
    );
  }
);

Slider.displayName = 'Slider';

export default Slider;
