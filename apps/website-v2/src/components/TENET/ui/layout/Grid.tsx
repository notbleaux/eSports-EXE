/** [Ver001.000] */
/**
 * Grid Components
 * ===============
 * CSS Grid layout components for complex layouts.
 */

import React from 'react';

export interface GridProps extends React.HTMLAttributes<HTMLDivElement> {
  templateColumns?: string;
  templateRows?: string;
  templateAreas?: string;
  gap?: string | number;
  columnGap?: string | number;
  rowGap?: string | number;
  autoFlow?: 'row' | 'column' | 'row dense' | 'column dense';
  autoColumns?: string;
  autoRows?: string;
  children: React.ReactNode;
}

export interface GridItemProps extends React.HTMLAttributes<HTMLDivElement> {
  colSpan?: number | 'auto';
  rowSpan?: number | 'auto';
  colStart?: number;
  colEnd?: number;
  rowStart?: number;
  rowEnd?: number;
  area?: string;
  children: React.ReactNode;
}

const normalizeGap = (gap: string | number | undefined): string | undefined => {
  if (gap === undefined) return undefined;
  return typeof gap === 'number' ? `${gap * 0.25}rem` : gap;
};

export const Grid = React.forwardRef<HTMLDivElement, GridProps>(
  (
    {
      children,
      templateColumns,
      templateRows,
      templateAreas,
      gap,
      columnGap,
      rowGap,
      autoFlow,
      autoColumns,
      autoRows,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`grid ${className}`}
        style={{
          gridTemplateColumns: templateColumns,
          gridTemplateRows: templateRows,
          gridTemplateAreas: templateAreas,
          gap: normalizeGap(gap),
          columnGap: normalizeGap(columnGap),
          rowGap: normalizeGap(rowGap),
          gridAutoFlow: autoFlow,
          gridAutoColumns: autoColumns,
          gridAutoRows: autoRows,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Grid.displayName = 'Grid';

export const GridItem = React.forwardRef<HTMLDivElement, GridItemProps>(
  (
    {
      children,
      colSpan,
      rowSpan,
      colStart,
      colEnd,
      rowStart,
      rowEnd,
      area,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const gridColumn = colSpan === 'auto' ? 'auto' : colSpan ? `span ${colSpan}` : undefined;
    const gridRow = rowSpan === 'auto' ? 'auto' : rowSpan ? `span ${rowSpan}` : undefined;

    return (
      <div
        ref={ref}
        className={`${className}`}
        style={{
          gridColumn,
          gridRow,
          gridColumnStart: colStart,
          gridColumnEnd: colEnd,
          gridRowStart: rowStart,
          gridRowEnd: rowEnd,
          gridArea: area,
          ...style,
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GridItem.displayName = 'GridItem';

export default Grid;
