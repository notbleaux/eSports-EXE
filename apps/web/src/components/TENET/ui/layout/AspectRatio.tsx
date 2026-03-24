/** [Ver001.000] */
/**
 * AspectRatio Component
 * =====================
 * Maintains a consistent width-to-height ratio.
 */

import React from 'react';

export interface AspectRatioProps extends React.HTMLAttributes<HTMLDivElement> {
  ratio?: number;
  children: React.ReactNode;
}

export const AspectRatio = React.forwardRef<HTMLDivElement, AspectRatioProps>(
  ({ children, ratio = 16 / 9, className = '', style, ...props }, ref) => {
    const paddingBottom = `${(1 / ratio) * 100}%`;

    return (
      <div
        ref={ref}
        className={`relative w-full ${className}`}
        style={style}
        {...props}
      >
        <div
          style={{
            paddingBottom,
          }}
        />
        <div
          className="absolute inset-0 overflow-hidden"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {children}
        </div>
      </div>
    );
  }
);

AspectRatio.displayName = 'AspectRatio';

export default AspectRatio;
