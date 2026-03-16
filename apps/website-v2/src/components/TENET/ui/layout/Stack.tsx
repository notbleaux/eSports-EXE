/** [Ver001.000] */
/**
 * Stack Components
 * ================
 * Vertical and horizontal stacking layout components.
 */

import React from 'react';

export interface StackProps extends React.HTMLAttributes<HTMLDivElement> {
  spacing?: string | number;
  align?: 'start' | 'center' | 'end' | 'stretch';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
}

export const Stack = React.forwardRef<HTMLDivElement, StackProps>(
  (
    { children, spacing = 4, align = 'stretch', justify = 'start', wrap = false, className = '', ...props },
    ref
  ) => {
    const spacingValue = typeof spacing === 'number' ? `${spacing * 0.25}rem` : spacing;
    
    const alignItems = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      stretch: 'stretch',
    };
    
    const justifyContent = {
      start: 'flex-start',
      center: 'center',
      end: 'flex-end',
      between: 'space-between',
      around: 'space-around',
      evenly: 'space-evenly',
    };
    
    return (
      <div
        ref={ref}
        className={`flex flex-col ${wrap ? 'flex-wrap' : ''} ${className}`}
        style={{
          gap: spacingValue,
          alignItems: alignItems[align],
          justifyContent: justifyContent[justify],
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Stack.displayName = 'Stack';

export const HStack = React.forwardRef<HTMLDivElement, StackProps>(
  ({ children, ...props }, ref) => (
    <Stack ref={ref} className="flex-row" {...props}>
      {children}
    </Stack>
  )
);

HStack.displayName = 'HStack';

export const VStack = Stack;

export default Stack;
