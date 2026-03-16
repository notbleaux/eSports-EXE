/** [Ver001.000] */
/**
 * Spacer Component
 * ================
 * Flexible spacer for creating space between elements.
 */

import React from 'react';

export interface SpacerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | number;
  axis?: 'horizontal' | 'vertical';
}

const sizeMap: Record<string, string> = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
};

export const Spacer: React.FC<SpacerProps> = ({ size = 'md', axis = 'vertical' }) => {
  const sizeValue = typeof size === 'number' ? `${size * 0.25}rem` : sizeMap[size] || size;

  const style: React.CSSProperties = {
    flexShrink: 0,
  };

  if (axis === 'vertical') {
    style.height = sizeValue;
    style.width = '1px';
  } else {
    style.width = sizeValue;
    style.height = '1px';
  }

  return <div style={style} aria-hidden="true" />;
};

Spacer.displayName = 'Spacer';

export default Spacer;
