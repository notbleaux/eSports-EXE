/** [Ver001.000] */
/**
 * Radio Component
 * ===============
 * Form radio button with label support for single selection.
 */

import React from 'react';

export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> {
  name: string;
  label?: string;
  value: string;
  checked?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  onChange?: (value: string) => void;
}

export const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  (
    {
      name,
      label,
      value,
      checked,
      size = 'md',
      colorScheme = 'primary',
      disabled = false,
      onChange,
      className = '',
      ...props
    },
    ref
  ) => {
    const handleChange = () => {
      onChange?.(value);
    };

    const sizeStyles = {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    };

    const labelSizeStyles = {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    };

    const colorStyles = {
      primary: 'text-primary-600 focus:ring-primary-500',
      secondary: 'text-secondary-600 focus:ring-secondary-500',
      success: 'text-green-600 focus:ring-green-500',
      warning: 'text-yellow-600 focus:ring-yellow-500',
      error: 'text-red-600 focus:ring-red-500',
    };

    return (
      <label className={`inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'} ${className}`}>
        <input
          ref={ref}
          type="radio"
          name={name}
          value={value}
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          className={`form-radio border-gray-300 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${sizeStyles[size]} ${colorStyles[colorScheme]}`}
          {...props}
        />
        {label && (
          <span className={`ml-2 text-gray-700 select-none ${labelSizeStyles[size]}`}>
            {label}
          </span>
        )}
      </label>
    );
  }
);

Radio.displayName = 'Radio';

export default Radio;
