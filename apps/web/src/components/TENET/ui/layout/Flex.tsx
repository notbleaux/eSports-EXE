/** [Ver001.000] */
/**
 * Flex Component
 * ==============
 * Flexible box layout component with alignment controls.
 */

import React from 'react';

export interface FlexProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch';
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly';
  basis?: string | number;
  grow?: number;
  shrink?: number;
  gap?: string | number;
  children: React.ReactNode;
}

const alignItemsMap: Record<string, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  baseline: 'baseline',
  stretch: 'stretch',
};

const justifyContentMap: Record<string, string> = {
  start: 'flex-start',
  end: 'flex-end',
  center: 'center',
  between: 'space-between',
  around: 'space-around',
  evenly: 'space-evenly',
};

export const Flex = React.forwardRef<HTMLDivElement, FlexProps>(
  (
    {
      children,
      direction = 'row',
      wrap = 'nowrap',
      align = 'stretch',
      justify = 'start',
      basis,
      grow,
      shrink,
      gap,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const gapValue = typeof gap === 'number' ? `${gap * 0.25}rem` : gap;

    return (
      <div
        ref={ref}
        className={`flex ${className}`}
        style={{
          flexDirection: direction,
          flexWrap: wrap,
          alignItems: alignItemsMap[align],
          justifyContent: justifyContentMap[justify],
          flexBasis: basis,
          flexGrow: grow,
          flexShrink: shrink,
          gap: gapValue,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Flex.displayName = 'Flex';

export default Flex;
