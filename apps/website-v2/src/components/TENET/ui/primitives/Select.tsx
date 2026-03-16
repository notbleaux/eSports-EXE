/** [Ver001.000] */
/**
 * Select Component
 * ================
 * Dropdown select with options and custom styling.
 */

import React from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'flushed';
  options: SelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      options,
      placeholder,
      disabled = false,
      onChange,
      className = '',
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange?.(e.target.value);
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-4 py-2 text-base h-10',
      lg: 'px-4 py-3 text-lg h-12',
    };

    const variantStyles = {
      outline: 'border border-gray-300 rounded-md focus:border-primary-500 focus:ring-primary-500 bg-white',
      filled: 'bg-gray-100 border-2 border-transparent rounded-md focus:bg-white focus:border-primary-500',
      flushed: 'border-b-2 border-gray-300 rounded-none px-0 bg-transparent focus:border-primary-500',
    };

    return (
      <div className="relative">
        <select
          ref={ref}
          disabled={disabled}
          onChange={handleChange}
          className={`block w-full appearance-none transition-all duration-200 focus:outline-none focus:ring-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;
