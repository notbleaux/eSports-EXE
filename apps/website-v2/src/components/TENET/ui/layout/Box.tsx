/** [Ver001.000] */
/**
 * Box Component
 * =============
 * Primitive layout component for spacing and sizing.
 */

import React from 'react';

export interface BoxProps extends React.HTMLAttributes<HTMLDivElement> {
  as?: keyof JSX.IntrinsicElements;
  p?: string | number;
  px?: string | number;
  py?: string | number;
  m?: string | number;
  mx?: string | number;
  my?: string | number;
}

export const Box = React.forwardRef<HTMLDivElement, BoxProps>(
  ({ as: Component = 'div', p, px, py, m, mx, my, style, ...props }, ref) => {
    const customStyles = {
      ...(p && { padding: p }),
      ...(px && { paddingLeft: px, paddingRight: px }),
      ...(py && { paddingTop: py, paddingBottom: py }),
      ...(m && { margin: m }),
      ...(mx && { marginLeft: mx, marginRight: mx }),
      ...(my && { marginTop: my, marginBottom: my }),
      ...style,
    };
    
    return <Component ref={ref} style={customStyles} {...props} />;
  }
);

Box.displayName = 'Box';

export default Box;
