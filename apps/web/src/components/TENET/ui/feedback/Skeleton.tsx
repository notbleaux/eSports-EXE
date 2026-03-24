/** [Ver001.000] */
/**
 * Skeleton Component
 * ==================
 * Placeholder loading state for content that hasn't loaded yet.
 */

import { forwardRef, useMemo } from 'react';

export interface SkeletonProps {
  height?: string | number;
  width?: string | number;
  isLoaded?: boolean;
  fadeDuration?: number;
  speed?: number;
  startColor?: string;
  endColor?: string;
  className?: string;
  children?: React.ReactNode;
}

export interface SkeletonCircleProps {
  size?: string | number;
  isLoaded?: boolean;
  fadeDuration?: number;
  speed?: number;
  startColor?: string;
  endColor?: string;
  className?: string;
}

export interface SkeletonTextProps {
  noOfLines?: number;
  spacing?: string | number;
  skeletonHeight?: string | number;
  isLoaded?: boolean;
  fadeDuration?: number;
  speed?: number;
  startColor?: string;
  endColor?: string;
  className?: string;
}

const useSkeletonStyles = (
  speed: number,
  startColor: string,
  endColor: string
) => {
  const animationId = useMemo(() => `skeleton-${Math.random().toString(36).substr(2, 9)}`, []);
  
  const keyframes = `
    @keyframes ${animationId} {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
  `;

  const style = {
    backgroundImage: `linear-gradient(90deg, ${startColor} 25%, ${endColor} 50%, ${startColor} 75%)`,
    backgroundSize: '200% 100%',
    animation: `${animationId} ${speed}s ease-in-out infinite`,
  };

  return { keyframes, style };
};

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  (
    {
      height = '1rem',
      width = '100%',
      isLoaded = false,
      fadeDuration = 0.2,
      speed = 1.5,
      startColor = '#E5E7EB',
      endColor = '#F3F4F6',
      className = '',
      children,
    },
    ref
  ) => {
    const { keyframes, style } = useSkeletonStyles(speed, startColor, endColor);

    if (isLoaded) {
      return (
        <div
          ref={ref}
          className={`transition-opacity ${className}`}
          style={{ transitionDuration: `${fadeDuration}s` }}
        >
          {children}
        </div>
      );
    }

    const heightValue = typeof height === 'number' ? `${height}px` : height;
    const widthValue = typeof width === 'number' ? `${width}px` : width;

    return (
      <>
        <style>{keyframes}</style>
        <div
          ref={ref}
          className={`rounded-md ${className}`}
          style={{
            ...style,
            height: heightValue,
            width: widthValue,
          }}
        />
      </>
    );
  }
);

Skeleton.displayName = 'Skeleton';

export const SkeletonCircle = forwardRef<HTMLDivElement, SkeletonCircleProps>(
  (
    {
      size = '3rem',
      isLoaded = false,
      fadeDuration = 0.2,
      speed = 1.5,
      startColor = '#E5E7EB',
      endColor = '#F3F4F6',
      className = '',
    },
    ref
  ) => {
    const { keyframes, style } = useSkeletonStyles(speed, startColor, endColor);
    const sizeValue = typeof size === 'number' ? `${size}px` : size;

    if (isLoaded) {
      return (
        <div
          ref={ref}
          className={`transition-opacity rounded-full ${className}`}
          style={{ transitionDuration: `${fadeDuration}s`, width: sizeValue, height: sizeValue }}
        />
      );
    }

    return (
      <>
        <style>{keyframes}</style>
        <div
          ref={ref}
          className={`rounded-full ${className}`}
          style={{
            ...style,
            width: sizeValue,
            height: sizeValue,
          }}
        />
      </>
    );
  }
);

SkeletonCircle.displayName = 'SkeletonCircle';

export const SkeletonText = forwardRef<HTMLDivElement, SkeletonTextProps>(
  (
    {
      noOfLines = 3,
      spacing = '0.5rem',
      skeletonHeight = '0.75rem',
      isLoaded = false,
      fadeDuration = 0.2,
      speed = 1.5,
      startColor = '#E5E7EB',
      endColor = '#F3F4F6',
      className = '',
    },
    ref
  ) => {
    const { keyframes, style } = useSkeletonStyles(speed, startColor, endColor);
    const spacingValue = typeof spacing === 'number' ? `${spacing}px` : spacing;
    const heightValue = typeof skeletonHeight === 'number' ? `${skeletonHeight}px` : skeletonHeight;

    if (isLoaded) {
      return (
        <div
          ref={ref}
          className={`transition-opacity ${className}`}
          style={{ transitionDuration: `${fadeDuration}s` }}
        />
      );
    }

    const lines = Array.from({ length: noOfLines }, (_, i) => (
      <div
        key={i}
        className={`rounded-md ${i < noOfLines - 1 ? '' : 'w-4/5'}`}
        style={{
          ...style,
          height: heightValue,
          marginBottom: i < noOfLines - 1 ? spacingValue : 0,
        }}
      />
    ));

    return (
      <>
        <style>{keyframes}</style>
        <div ref={ref} className={className}>
          {lines}
        </div>
      </>
    );
  }
);

SkeletonText.displayName = 'SkeletonText';

export default Skeleton;
