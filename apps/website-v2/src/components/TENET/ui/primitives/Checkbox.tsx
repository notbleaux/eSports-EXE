/** [Ver001.000] */
/**
 * Checkbox Component
 * ==================
 * Form checkbox with label support and indeterminate state.
 */

import React from 'react';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size' | 'onChange'> {
  label?: string;
  checked?: boolean;
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  colorScheme?: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  onChange?: (checked: boolean) => void;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      label,
      checked,
      indeterminate = false,
      size = 'md',
      colorScheme = 'primary',
      disabled = false,
      onChange,
      className = '',
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLInputElement>(null);

    React.useImperativeHandle(ref, () => internalRef.current!);

    React.useEffect(() => {
      if (internalRef.current) {
        internalRef.current.indeterminate = indeterminate;
      }
    }, [indeterminate]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange?.(e.target.checked);
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
          ref={internalRef}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          className={`form-checkbox rounded border-gray-300 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 ${sizeStyles[size]} ${colorStyles[colorScheme]}`}
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

Checkbox.displayName = 'Checkbox';

export default Checkbox;
