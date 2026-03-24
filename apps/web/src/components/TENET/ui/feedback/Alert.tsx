/** [Ver001.000] */
/**
 * Alert Component
 * ===============
 * Contextual feedback messages for user actions.
 */

import { forwardRef, useState } from 'react';

export interface AlertProps {
  status?: 'info' | 'success' | 'warning' | 'error';
  variant?: 'subtle' | 'solid' | 'left-accent' | 'top-accent';
  title?: string;
  description?: string;
  isClosable?: boolean;
  onClose?: () => void;
  icon?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}

const statusConfig = {
  info: {
    subtle: 'bg-blue-50 text-blue-800 border-blue-200',
    solid: 'bg-blue-600 text-white border-blue-600',
    accent: 'border-blue-500',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
      </svg>
    ),
  },
  success: {
    subtle: 'bg-green-50 text-green-800 border-green-200',
    solid: 'bg-green-600 text-white border-green-600',
    accent: 'border-green-500',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ),
  },
  warning: {
    subtle: 'bg-amber-50 text-amber-800 border-amber-200',
    solid: 'bg-amber-500 text-white border-amber-500',
    accent: 'border-amber-500',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
    ),
  },
  error: {
    subtle: 'bg-red-50 text-red-800 border-red-200',
    solid: 'bg-red-600 text-white border-red-600',
    accent: 'border-red-500',
    icon: (
      <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
      </svg>
    ),
  },
};

const variantStyles = {
  subtle: 'border rounded-lg',
  solid: 'border rounded-lg',
  'left-accent': 'border-l-4 rounded-r-lg bg-gray-50',
  'top-accent': 'border-t-4 rounded-b-lg bg-gray-50',
};

export const Alert = forwardRef<HTMLDivElement, AlertProps>(
  (
    {
      status = 'info',
      variant = 'subtle',
      title,
      description,
      isClosable = false,
      onClose,
      icon,
      className = '',
      children,
    },
    ref
  ) => {
    const [isVisible, setIsVisible] = useState(true);
    const config = statusConfig[status];

    if (!isVisible) return null;

    const handleClose = () => {
      setIsVisible(false);
      onClose?.();
    };

    const baseStyles = variant === 'subtle' || variant === 'solid'
      ? `${config[variant]} ${variantStyles[variant]}`
      : `${config.subtle} ${config.accent} ${variantStyles[variant]}`;

    return (
      <div
        ref={ref}
        role="alert"
        className={`p-4 ${baseStyles} ${className}`}
      >
        <div className="flex">
          <div className={`flex-shrink-0 ${variant === 'solid' ? 'text-white' : `text-${status}-500`}`}>
            {icon || config.icon}
          </div>
          <div className="ml-3 flex-1">
            {title && (
              <h3 className="text-sm font-medium">{title}</h3>
            )}
            {(description || children) && (
              <div className={`text-sm ${title ? 'mt-2' : ''} opacity-90`}>
                {description}
                {children}
              </div>
            )}
          </div>
          {isClosable && (
            <div className="ml-auto pl-3">
              <button
                type="button"
                onClick={handleClose}
                className={`inline-flex rounded-md p-1.5 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                  variant === 'solid' 
                    ? 'focus:ring-white focus:ring-offset-0' 
                    : `focus:ring-${status}-500`
                }`}
              >
                <span className="sr-only">Dismiss</span>
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

Alert.displayName = 'Alert';

export default Alert;
