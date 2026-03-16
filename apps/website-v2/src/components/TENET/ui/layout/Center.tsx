/** [Ver001.000] */
/**
 * Center Component
 * ================
 * Centers content both horizontally and vertically.
 */

import React from 'react';

export interface CenterProps extends React.HTMLAttributes<HTMLDivElement> {
  inline?: boolean;
  children: React.ReactNode;
}

export const Center = React.forwardRef<HTMLDivElement, CenterProps>(
  ({ children, inline = false, className = '', style, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`${inline ? 'inline-flex' : 'flex'} items-center justify-center ${className}`}
        style={style}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Center.displayName = 'Center';

export default Center;
