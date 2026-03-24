/** [Ver001.000] */
/**
 * Container Component
 * ===================
 * Max-width container for content with optional centering.
 */

import React from 'react';

export interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  maxW?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | string;
  centerContent?: boolean;
  children: React.ReactNode;
}

const maxWidthMap: Record<string, string> = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
};

export const Container = React.forwardRef<HTMLDivElement, ContainerProps>(
  ({ children, maxW = 'lg', centerContent = false, className = '', style, ...props }, ref) => {
    const maxWidth = maxWidthMap[maxW] || maxW;

    return (
      <div
        ref={ref}
        className={`w-full ${className}`}
        style={{
          maxWidth,
          marginLeft: 'auto',
          marginRight: 'auto',
          display: centerContent ? 'flex' : undefined,
          flexDirection: centerContent ? 'column' : undefined,
          alignItems: centerContent ? 'center' : undefined,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Container.displayName = 'Container';

export default Container;
