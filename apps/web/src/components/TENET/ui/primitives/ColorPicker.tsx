/** [Ver001.000] */
/**
 * ColorPicker Component
 * =====================
 * Color selection with hex input and preset colors.
 */

import React from 'react';

export interface ColorPickerProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type' | 'value' | 'defaultValue' | 'onChange'> {
  value?: string;
  defaultValue?: string;
  presetColors?: string[];
  showAlpha?: boolean;
  onChange?: (color: string) => void;
}

export const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  (
    {
      value,
      defaultValue = '#3B82F6',
      presetColors = ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#6B7280'],
      showAlpha = false,
      disabled = false,
      onChange,
      className = '',
      ...props
    },
    ref
  ) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(defaultValue);
    const [inputValue, setInputValue] = React.useState(defaultValue);
    const currentValue = isControlled ? value : internalValue;

    const isValidHex = (hex: string): boolean => {
      return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(hex);
    };

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setInputValue(newColor);
      if (!isControlled) {
        setInternalValue(newColor);
      }
      onChange?.(newColor);
    };

    const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
      let newValue = e.target.value;
      if (!newValue.startsWith('#')) {
        newValue = '#' + newValue;
      }
      setInputValue(newValue);
      if (isValidHex(newValue)) {
        if (!isControlled) {
          setInternalValue(newValue);
        }
        onChange?.(newValue);
      }
    };

    const handlePresetClick = (color: string) => {
      setInputValue(color);
      if (!isControlled) {
        setInternalValue(color);
      }
      onChange?.(color);
    };

    React.useEffect(() => {
      if (isControlled && value) {
        setInputValue(value);
      }
    }, [isControlled, value]);

    return (
      <div className={`space-y-3 ${className}`}>
        <div className="flex items-center gap-3">
          <div className="relative">
            <input
              ref={ref}
              type="color"
              value={currentValue}
              disabled={disabled}
              onChange={handleColorChange}
              className={`h-10 w-10 cursor-pointer rounded border border-gray-300 p-0.5 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              {...props}
            />
          </div>
          <input
            type="text"
            value={inputValue}
            disabled={disabled}
            onChange={handleHexInput}
            className={`block w-28 rounded-md border border-gray-300 px-3 py-2 text-sm font-mono uppercase transition-all duration-200 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 ${disabled ? 'cursor-not-allowed opacity-50 bg-gray-100' : ''}`}
            maxLength={7}
          />
          <div
            className="h-10 w-10 rounded-md border border-gray-200 shadow-sm"
            style={{ backgroundColor: currentValue }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {presetColors.map((color) => (
            <button
              key={color}
              type="button"
              disabled={disabled}
              onClick={() => handlePresetClick(color)}
              className={`h-8 w-8 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 ${currentValue.toLowerCase() === color.toLowerCase() ? 'ring-2 ring-primary-500 ring-offset-2' : ''}`}
              style={{ backgroundColor: color }}
              aria-label={`Select color ${color}`}
            />
          ))}
        </div>
      </div>
    );
  }
);

ColorPicker.displayName = 'ColorPicker';

export default ColorPicker;
