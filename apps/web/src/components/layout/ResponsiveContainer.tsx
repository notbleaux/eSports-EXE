/** [Ver001.000]
 *
 * Responsive Container Component
 * 
 * Adaptive container that adjusts max-width, padding, and margins
 * based on current breakpoint. Supports fluid and fixed modes.
 * 
 * @module components/layout/ResponsiveContainer
 */

import React, { forwardRef } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Container width presets
 */
export type ContainerSize = 
  | 'xs'      // 480px
  | 'sm'      // 640px  
  | 'md'      // 768px
  | 'lg'      // 1024px
  | 'xl'      // 1280px
  | '2xl'     // 1536px
  | 'full'    // 100%
  | 'fluid';  // No max-width

/**
 * Container padding presets
 */
export type ContainerPadding = 
  | 'none'    // 0
  | 'xs'      // 4px
  | 'sm'      // 8px
  | 'md'      // 16px
  | 'lg'      // 24px
  | 'xl'      // 32px
  | '2xl';    // 48px

/**
 * Props for ResponsiveContainer
 */
export interface ResponsiveContainerProps extends 
  React.HTMLAttributes<HTMLElement> {
  /** HTML element to render (default: 'div') */
  as?: keyof JSX.IntrinsicElements;
  /** Maximum width of container */
  size?: ContainerSize;
  /** Horizontal padding */
  padding?: ContainerPadding;
  /** Whether to center the container */
  centered?: boolean;
  /** Whether container takes full height */
  fullHeight?: boolean;
  /** Whether to add safe area insets */
  respectSafeAreas?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Children */
  children: React.ReactNode;
}

/**
 * Max-width map corresponding to Tailwind breakpoints
 */
const SIZE_CLASSES: Record<ContainerSize, string> = {
  xs: 'max-w-[480px]',
  sm: 'max-w-screen-sm',
  md: 'max-w-screen-md',
  lg: 'max-w-screen-lg',
  xl: 'max-w-screen-xl',
  '2xl': 'max-w-screen-2xl',
  full: 'max-w-full',
  fluid: '',
};

/**
 * Padding classes with responsive behavior
 * Mobile gets smaller padding, scales up on larger screens
 */
const PADDING_CLASSES: Record<ContainerPadding, string> = {
  none: 'px-0',
  xs: 'px-1 sm:px-1',
  sm: 'px-2 sm:px-3 md:px-4',
  md: 'px-4 sm:px-6 md:px-8',
  lg: 'px-6 sm:px-8 md:px-12',
  xl: 'px-8 sm:px-12 md:px-16',
  '2xl': 'px-12 sm:px-16 md:px-24',
};

/**
 * Merge Tailwind classes with proper precedence
 */
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Responsive Container Component
 * 
 * Provides consistent responsive layout with automatic breakpoint handling.
 * 
 * @example
 * ```tsx
 * // Basic usage
 * <ResponsiveContainer size="lg" padding="md">
 *   <YourContent />
 * </ResponsiveContainer>
 * 
 * // Full-width with padding
 * <ResponsiveContainer size="full" padding="lg">
 *   <HeroSection />
 * </ResponsiveContainer>
 * 
 * // Fluid with custom element
 * <ResponsiveContainer as="main" size="fluid" padding="md" fullHeight>
 *   <PageContent />
 * </ResponsiveContainer>
 * ```
 */
export const ResponsiveContainer = forwardRef<
  HTMLElement,
  ResponsiveContainerProps
>(
  (
    {
      as: Component = 'div',
      size = 'lg',
      padding = 'md',
      centered = true,
      fullHeight = false,
      respectSafeAreas = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const classes = cn(
      // Base styles
      'w-full',
      
      // Max-width constraint
      SIZE_CLASSES[size],
      
      // Padding
      PADDING_CLASSES[padding],
      
      // Centering
      centered && 'mx-auto',
      
      // Full height
      fullHeight && 'min-h-screen',
      
      // Safe areas for mobile notches
      respectSafeAreas && [
        'pt-[env(safe-area-inset-top)]',
        'pr-[env(safe-area-inset-right)]',
        'pb-[env(safe-area-inset-bottom)]',
        'pl-[env(safe-area-inset-left)]',
      ],
      
      // Custom classes
      className
    );

    return React.createElement(
      Component,
      {
        ref,
        className: classes,
        ...props,
      },
      children
    );
  }
);

ResponsiveContainer.displayName = 'ResponsiveContainer';

/**
 * Specialized container variants for common use cases
 */

/**
 * Page container - Full viewport with safe areas and standard padding
 */
export const PageContainer = forwardRef<
  HTMLElement,
  Omit<ResponsiveContainerProps, 'size' | 'padding' | 'fullHeight'>
>(
  (props, ref) => (
    <ResponsiveContainer
      ref={ref}
      as="main"
      size="fluid"
      padding="md"
      fullHeight
      respectSafeAreas
      {...props}
    />
  )
);

PageContainer.displayName = 'PageContainer';

/**
 * Content container - Constrained width for readability
 */
export const ContentContainer = forwardRef<
  HTMLElement,
  Omit<ResponsiveContainerProps, 'size'>
>(
  (props, ref) => (
    <ResponsiveContainer
      ref={ref}
      size="lg"
      padding="md"
      {...props}
    />
  )
);

ContentContainer.displayName = 'ContentContainer';

/**
 * Section container - Full-width section with constrained content
 */
export const SectionContainer = forwardRef<
  HTMLElement,
  Omit<ResponsiveContainerProps, 'size'>
>(
  ({ children, className, ...props }, ref) => (
    <section ref={ref} className={cn('w-full', className)} {...props}>
      <ResponsiveContainer size="xl" padding="lg">
        {children}
      </ResponsiveContainer>
    </section>
  )
);

SectionContainer.displayName = 'SectionContainer';

/**
 * Grid container - Responsive grid layout wrapper
 */
export interface GridContainerProps extends 
  Omit<ResponsiveContainerProps, 'size'> {
  /** Number of columns on mobile */
  cols?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Number of columns on tablet */
  colsMd?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Number of columns on desktop */
  colsLg?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Gap between grid items */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export const GridContainer = forwardRef<
  HTMLElement,
  GridContainerProps
>(
  (
    {
      cols = 1,
      colsMd = cols,
      colsLg = colsMd,
      gap = 'md',
      className,
      children,
      ...props
    },
    ref
  ) => {
    const gapClasses = {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    };

    const gridClasses = cn(
      'grid',
      `grid-cols-${cols}`,
      `md:grid-cols-${colsMd}`,
      `lg:grid-cols-${colsLg}`,
      gapClasses[gap],
      className
    );

    return (
      <ResponsiveContainer
        ref={ref}
        size="fluid"
        padding="none"
        className={gridClasses}
        {...props}
      >
        {children}
      </ResponsiveContainer>
    );
  }
);

GridContainer.displayName = 'GridContainer';

/**
 * Flex container - Responsive flexbox wrapper
 */
export interface FlexContainerProps extends
  Omit<ResponsiveContainerProps, 'size'> {
  /** Flex direction */
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  /** Flex direction on tablet+ */
  directionMd?: 'row' | 'col' | 'row-reverse' | 'col-reverse';
  /** Justify content */
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  /** Align items */
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline';
  /** Gap between items */
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  /** Whether to wrap */
  wrap?: boolean | 'reverse';
}

export const FlexContainer = forwardRef<
  HTMLElement,
  FlexContainerProps
>(
  (
    {
      direction = 'row',
      directionMd,
      justify = 'start',
      align = 'stretch',
      gap = 'md',
      wrap = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const justifyClasses = {
      start: 'justify-start',
      center: 'justify-center',
      end: 'justify-end',
      between: 'justify-between',
      around: 'justify-around',
      evenly: 'justify-evenly',
    };

    const alignClasses = {
      start: 'items-start',
      center: 'items-center',
      end: 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    };

    const gapClasses = {
      none: 'gap-0',
      xs: 'gap-1',
      sm: 'gap-2',
      md: 'gap-4',
      lg: 'gap-6',
      xl: 'gap-8',
    };

    const wrapClass = wrap === 'reverse' 
      ? 'flex-wrap-reverse' 
      : wrap ? 'flex-wrap' : 'flex-nowrap';

    const flexClasses = cn(
      'flex',
      `flex-${direction}`,
      directionMd && `md:flex-${directionMd}`,
      justifyClasses[justify],
      alignClasses[align],
      gapClasses[gap],
      wrapClass,
      className
    );

    return (
      <ResponsiveContainer
        ref={ref}
        size="fluid"
        padding="none"
        className={flexClasses}
        {...props}
      >
        {children}
      </ResponsiveContainer>
    );
  }
);

FlexContainer.displayName = 'FlexContainer';

export default ResponsiveContainer;
