/** [Ver001.000] */
/**
 * Divider Component
 * =================
 * Visual separator with optional label.
 */

import React from 'react';

export interface DividerProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical';
  variant?: 'solid' | 'dashed' | 'dotted';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  labelPosition?: 'left' | 'center' | 'right';
}

const variantMap: Record<string, string> = {
  solid: 'solid',
  dashed: 'dashed',
  dotted: 'dotted',
};

const sizeMap: Record<string, { horizontal: string; vertical: string }> = {
  sm: { horizontal: '1px', vertical: '1px' },
  md: { horizontal: '2px', vertical: '2px' },
  lg: { horizontal: '4px', vertical: '4px' },
};

export const Divider = React.forwardRef<HTMLDivElement, DividerProps>(
  (
    {
      orientation = 'horizontal',
      variant = 'solid',
      size = 'sm',
      label,
      labelPosition = 'center',
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const borderStyle = variantMap[variant];
    const sizeValue = sizeMap[size];
    const borderColor = 'var(--color-neutral-200, #E5E7EB)';

    if (label && orientation === 'horizontal') {
      const labelFlex = {
        left: { before: '0', after: '1' },
        center: { before: '1', after: '1' },
        right: { before: '1', after: '0' },
      }[labelPosition];

      return (
        <div
          ref={ref}
          className={`flex items-center w-full ${className}`}
          style={style}
          role="separator"
          {...props}
        >
          <div
            style={{
              flex: labelFlex.before,
              borderTop: `${sizeValue.horizontal} ${borderStyle} ${borderColor}`,
            }}
          />
          <span
            className="px-3 text-sm text-neutral-500"
            style={{ color: 'var(--color-neutral-500, #6B7280)' }}
          >
            {label}
          </span>
          <div
            style={{
              flex: labelFlex.after,
              borderTop: `${sizeValue.horizontal} ${borderStyle} ${borderColor}`,
            }}
          />
        </div>
      );
    }

    const isHorizontal = orientation === 'horizontal';

    return (
      <div
        ref={ref}
        className={`${isHorizontal ? 'w-full' : 'h-full'} ${className}`}
        style={{
          borderTop: isHorizontal ? `${sizeValue.horizontal} ${borderStyle} ${borderColor}` : undefined,
          borderLeft: !isHorizontal ? `${sizeValue.vertical} ${borderStyle} ${borderColor}` : undefined,
          ...style,
        }}
        role="separator"
        {...props}
      />
    );
  }
);

Divider.displayName = 'Divider';

export default Divider;
