/** [Ver001.000] */
/**
 * DatePicker Component
 * ====================
 * Date input with format support and validation.
 */

import React from 'react';

export interface DatePickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange' | 'min' | 'max'> {
  value?: Date;
  defaultValue?: Date;
  minDate?: Date;
  maxDate?: Date;
  format?: string;
  placeholder?: string;
  onChange?: (date: Date) => void;
}

export const DatePicker = React.forwardRef<HTMLInputElement, DatePickerProps>(
  (
    {
      value,
      defaultValue,
      minDate,
      maxDate,
      format = 'yyyy-MM-dd',
      placeholder = 'Select date...',
      disabled = false,
      onChange,
      className = '',
      ...props
    },
    ref
  ) => {
    const formatDate = (date: Date | undefined): string => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const parseDate = (dateString: string): Date | null => {
      if (!dateString) return null;
      const parsed = new Date(dateString);
      return isNaN(parsed.getTime()) ? null : parsed;
    };

    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState<Date | null>(defaultValue ?? null);
    const currentValue = isControlled ? value : internalValue;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const parsed = parseDate(e.target.value);
      if (parsed) {
        if (!isControlled) {
          setInternalValue(parsed);
        }
        onChange?.(parsed);
      }
    };

    return (
      <div className="relative">
        <input
          ref={ref}
          type="date"
          value={formatDate(currentValue ?? undefined)}
          min={formatDate(minDate ?? undefined)}
          max={formatDate(maxDate ?? undefined)}
          disabled={disabled}
          onChange={handleChange}
          placeholder={placeholder}
          className={`block w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-base transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed opacity-50 bg-gray-100' : ''} ${className}`}
          {...props}
        />
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </div>
    );
  }
);

DatePicker.displayName = 'DatePicker';

export default DatePicker;
