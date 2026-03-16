/** [Ver001.000] */
/**
 * Switch Component
 * ================
 * Toggle switch for binary state control.
 */

import React from 'react';

export interface SwitchProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'onChange' | 'checked'> {
  checked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  onChange?: (checked: boolean) => void;
}

export const Switch = React.forwardRef<HTMLButtonElement, SwitchProps>(
  (
    {
      checked = false,
      size = 'md',
      colorScheme = 'primary',
      disabled = false,
      onChange,
      className = '',
      ...props
    },
    ref
  ) => {
    const handleClick = () => {
      if (!disabled) {
        onChange?.(!checked);
      }
    };

    const sizeStyles = {
      sm: { track: 'h-5 w-9', thumb: 'h-4 w-4', translate: 'translate-x-4' },
      md: { track: 'h-6 w-11', thumb: 'h-5 w-5', translate: 'translate-x-5' },
      lg: { track: 'h-8 w-14', thumb: 'h-7 w-7', translate: 'translate-x-6' },
    };

    const colorStyles = {
      primary: 'bg-primary-600',
      secondary: 'bg-secondary-600',
      success: 'bg-green-600',
      warning: 'bg-yellow-600',
      error: 'bg-red-600',
    };

    const currentSize = sizeStyles[size];

    return (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleClick}
        className={`relative inline-flex flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${checked ? colorStyles[colorScheme] : 'bg-gray-200'} ${currentSize.track} ${className}`}
        {...props}
      >
        <span
          className={`pointer-events-none inline-block transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${checked ? currentSize.translate : 'translate-x-0'} ${currentSize.thumb}`}
        />
      </button>
    );
  }
);

Switch.displayName = 'Switch';

export default Switch;
