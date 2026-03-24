/** [Ver001.000] */
/**
 * Avatar Component
 * ================
 * User profile images with fallback support and grouping.
 */

import { forwardRef, useState } from 'react';

export interface AvatarProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  name?: string;
  src?: string;
  srcSet?: string;
  loading?: 'eager' | 'lazy';
  icon?: React.ReactNode;
  bg?: string;
  getInitials?: (name: string) => string;
  className?: string;
}

export interface AvatarBadgeProps {
  bg?: string;
  boxSize?: string;
  children?: React.ReactNode;
  className?: string;
}

export interface AvatarGroupProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  max?: number;
  spacing?: string | number;
  children: React.ReactNode;
  className?: string;
}

const sizeStyles = {
  xs: 'h-6 w-6 text-xs',
  sm: 'h-8 w-8 text-sm',
  md: 'h-10 w-10 text-base',
  lg: 'h-12 w-12 text-lg',
  xl: 'h-14 w-14 text-xl',
  '2xl': 'h-16 w-16 text-2xl',
};

const defaultGetInitials = (name: string): string => {
  const names = name.trim().split(' ');
  if (names.length === 1) return names[0].charAt(0).toUpperCase();
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
};

const defaultIcon = (
  <svg className="h-full w-full text-gray-400" fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
  </svg>
);

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  (
    {
      size = 'md',
      name,
      src,
      srcSet,
      loading = 'lazy',
      icon,
      bg = '#E5E7EB',
      getInitials = defaultGetInitials,
      className = '',
    },
    ref
  ) => {
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const showImage = src && !hasError;
    const showInitials = name && (!src || hasError);
    const showIcon = !showImage && !showInitials;

    return (
      <div
        ref={ref}
        className={`relative inline-flex items-center justify-center rounded-full overflow-hidden ${sizeStyles[size]} ${className}`}
        style={{ backgroundColor: showInitials || showIcon ? bg : undefined }}
        title={name}
      >
        {showImage && (
          <img
            src={src}
            srcSet={srcSet}
            alt={name || 'Avatar'}
            loading={loading}
            onError={() => setHasError(true)}
            onLoad={() => setIsLoaded(true)}
            className={`h-full w-full object-cover transition-opacity duration-200 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          />
        )}
        {showInitials && (
          <span className="font-medium text-gray-700 select-none">
            {getInitials(name)}
          </span>
        )}
        {showIcon && (
          <div className="h-3/5 w-3/5">
            {icon || defaultIcon}
          </div>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export const AvatarBadge = forwardRef<HTMLDivElement, AvatarBadgeProps>(
  (
    {
      bg = '#22C55E',
      boxSize = '1rem',
      children,
      className = '',
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={`absolute bottom-0 right-0 rounded-full border-2 border-white flex items-center justify-center ${className}`}
        style={{ 
          backgroundColor: bg, 
          width: boxSize, 
          height: boxSize,
        }}
      >
        {children}
      </div>
    );
  }
);

AvatarBadge.displayName = 'AvatarBadge';

export const AvatarGroup = forwardRef<HTMLDivElement, AvatarGroupProps>(
  (
    {
      size = 'md',
      max,
      spacing = '-0.75rem',
      children,
      className = '',
    },
    ref
  ) => {
    const spacingValue = typeof spacing === 'number' ? `${spacing}px` : spacing;
    const childArray = Array.isArray(children) ? children : [children];
    const totalChildren = childArray.length;
    const showExcess = max !== undefined && totalChildren > max;
    const visibleChildren = showExcess ? childArray.slice(0, max) : childArray;
    const excessCount = totalChildren - (max || 0);

    return (
      <div ref={ref} className={`flex items-center ${className}`}>
        {visibleChildren.map((child, index) => (
          <div
            key={index}
            style={{ marginLeft: index > 0 ? spacingValue : 0 }}
            className="relative inline-block border-2 border-white rounded-full"
          >
            {child}
          </div>
        ))}
        {showExcess && excessCount > 0 && (
          <div
            style={{ marginLeft: spacingValue }}
            className={`relative inline-flex items-center justify-center rounded-full bg-gray-200 text-gray-600 font-medium ${sizeStyles[size]}`}
          >
            +{excessCount}
          </div>
        )}
      </div>
    );
  }
);

AvatarGroup.displayName = 'AvatarGroup';

export default Avatar;
