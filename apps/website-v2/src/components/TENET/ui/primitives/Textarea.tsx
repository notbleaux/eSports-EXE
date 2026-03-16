/** [Ver001.000] */
/**
 * Textarea Component
 * ==================
 * Multi-line text input with auto-resize and character count.
 */

import React from 'react';

export interface TextareaProps extends Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  size?: 'sm' | 'md' | 'lg';
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
  autoResize?: boolean;
  maxLength?: number;
  showCount?: boolean;
  isInvalid?: boolean;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      size = 'md',
      resize = 'vertical',
      autoResize = false,
      maxLength,
      showCount = false,
      isInvalid = false,
      disabled = false,
      value,
      defaultValue,
      onChange,
      className = '',
      rows = 3,
      ...props
    },
    ref
  ) => {
    const internalRef = React.useRef<HTMLTextAreaElement>(null);
    const [currentValue, setCurrentValue] = React.useState(value ?? defaultValue ?? '');

    React.useImperativeHandle(ref, () => internalRef.current!);

    React.useEffect(() => {
      if (autoResize && internalRef.current) {
        internalRef.current.style.height = 'auto';
        internalRef.current.style.height = `${internalRef.current.scrollHeight}px`;
      }
    }, [currentValue, autoResize]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCurrentValue(e.target.value);
      onChange?.(e);
    };

    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-4 py-3 text-lg',
    };

    const resizeStyles = {
      none: 'resize-none',
      vertical: 'resize-y',
      horizontal: 'resize-x',
      both: 'resize',
    };

    const stateStyles = isInvalid
      ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500';

    const characterCount = typeof currentValue === 'string' ? currentValue.length : 0;

    return (
      <div className="w-full">
        <textarea
          ref={internalRef}
          disabled={disabled}
          maxLength={maxLength}
          onChange={handleChange}
          rows={rows}
          className={`block w-full rounded-md border bg-white transition-all duration-200 focus:outline-none focus:ring-2 ${disabled ? 'opacity-50 cursor-not-allowed bg-gray-100' : ''} ${sizeStyles[size]} ${resizeStyles[resize]} ${stateStyles} ${className}`}
          {...props}
        />
        {showCount && (
          <div className="mt-1 flex justify-end text-xs text-gray-500">
            <span>{characterCount}</span>
            {maxLength && <span> / {maxLength}</span>}
          </div>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;
