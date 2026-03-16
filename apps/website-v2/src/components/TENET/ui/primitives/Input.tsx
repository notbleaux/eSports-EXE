/** [Ver001.000] */
/**
 * Input Component
 * ===============
 * Text input with variants for different use cases.
 */

import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'outline' | 'filled' | 'flushed';
  isInvalid?: boolean;
  isDisabled?: boolean;
  leftElement?: React.ReactNode;
  rightElement?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      size = 'md',
      variant = 'outline',
      isInvalid = false,
      isDisabled = false,
      leftElement,
      rightElement,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = 'w-full bg-white transition-all duration-200 focus:outline-none focus:ring-2';
    
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm h-8',
      md: 'px-4 py-2 text-base h-10',
      lg: 'px-4 py-3 text-lg h-12',
    };
    
    const variantStyles = {
      outline: 'border border-gray-300 rounded-md focus:border-primary-500 focus:ring-primary-500',
      filled: 'bg-gray-100 border-2 border-transparent rounded-md focus:bg-white focus:border-primary-500',
      flushed: 'border-b-2 border-gray-300 rounded-none px-0 focus:border-primary-500',
    };
    
    const stateStyles = isInvalid
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : '';
    
    const disabledStyles = isDisabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : '';
    
    const input = (
      <input
        ref={ref}
        className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${stateStyles} ${disabledStyles} ${className}`}
        disabled={isDisabled}
        {...props}
      />
    );
    
    if (leftElement || rightElement) {
      return (
        <div className="relative flex items-center">
          {leftElement && (
            <div className="absolute left-3 text-gray-400">{leftElement}</div>
          )}
          <div className={leftElement ? 'pl-10' : ''}>
            {input}
          </div>
          {rightElement && (
            <div className="absolute right-3 text-gray-400">{rightElement}</div>
          )}
        </div>
      );
    }
    
    return input;
  }
);

Input.displayName = 'Input';

export default Input;
