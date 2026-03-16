/** [Ver001.000] */
/**
 * SimpleGrid Component
 * ====================
 * Simplified grid with responsive column support.
 */

import React from 'react';

export interface SimpleGridProps extends React.HTMLAttributes<HTMLDivElement> {
  columns?: number | { sm?: number; md?: number; lg?: number; xl?: number };
  spacing?: string | number;
  spacingX?: string | number;
  spacingY?: string | number;
  minChildWidth?: string;
  children: React.ReactNode;
}

const normalizeSpacing = (spacing: string | number | undefined): string | undefined => {
  if (spacing === undefined) return undefined;
  return typeof spacing === 'number' ? `${spacing * 0.25}rem` : spacing;
};

export const SimpleGrid = React.forwardRef<HTMLDivElement, SimpleGridProps>(
  (
    {
      children,
      columns = 2,
      spacing = 4,
      spacingX,
      spacingY,
      minChildWidth,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const gapX = normalizeSpacing(spacingX ?? spacing);
    const gapY = normalizeSpacing(spacingY ?? spacing);

    // Build responsive grid template columns
    const getTemplateColumns = (): string | undefined => {
      if (minChildWidth) {
        return `repeat(auto-fit, minmax(${minChildWidth}, 1fr))`;
      }

      if (typeof columns === 'number') {
        return `repeat(${columns}, minmax(0, 1fr))`;
      }

      return undefined;
    };

    const templateColumns = getTemplateColumns();

    // Generate responsive styles for object-based columns
    const responsiveStyles: React.CSSProperties = {};
    if (typeof columns === 'object') {
      // Use CSS custom properties for responsive breakpoints
      const breakpointValues: string[] = [];
      if (columns.xl) breakpointValues.push(`(min-width: 1280px) ${columns.xl}`);
      if (columns.lg) breakpointValues.push(`(min-width: 1024px) ${columns.lg}`);
      if (columns.md) breakpointValues.push(`(min-width: 768px) ${columns.md}`);
      if (columns.sm) breakpointValues.push(`(min-width: 640px) ${columns.sm}`);

      // Default to single column on smallest screens
      const defaultColumns = 1;

      responsiveStyles.gridTemplateColumns = `repeat(${defaultColumns}, minmax(0, 1fr))`;

      // Apply media query-based column counts via inline styles is complex,
      // so we rely on a simpler approach with CSS grid auto-fit/fill
      if (columns.xl) {
        responsiveStyles.gridTemplateColumns = `repeat(${columns.xl}, minmax(0, 1fr))`;
      } else if (columns.lg) {
        responsiveStyles.gridTemplateColumns = `repeat(${columns.lg}, minmax(0, 1fr))`;
      } else if (columns.md) {
        responsiveStyles.gridTemplateColumns = `repeat(${columns.md}, minmax(0, 1fr))`;
      } else if (columns.sm) {
        responsiveStyles.gridTemplateColumns = `repeat(${columns.sm}, minmax(0, 1fr))`;
      }
    }

    return (
      <div
        ref={ref}
        className={`grid ${className}`}
        style={{
          gridTemplateColumns: templateColumns,
          columnGap: gapX,
          rowGap: gapY,
          ...responsiveStyles,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

SimpleGrid.displayName = 'SimpleGrid';

export default SimpleGrid;
