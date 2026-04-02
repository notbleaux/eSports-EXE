/**
 * Lazy Loaded Mascot Asset Component
 * 
 * Implements code splitting with dynamic imports for mascot components.
 * Each mascot style is loaded as a separate chunk.
 * 
 * [Ver001.000] - REF-004 Bundle Optimization
 */

import React, { lazy, Suspense, useMemo } from 'react';
import { MascotSkeleton } from './MascotSkeleton';

// ============================================================================
// Types
// ============================================================================

export type MascotType = 'fox' | 'owl' | 'wolf' | 'hawk' | 'dropout-bear' | 'nj-bunny';
export type MascotStyle = 'dropout' | 'nj' | 'default';
export type MascotSize = 32 | 64 | 128 | 256 | 512;

export interface LazyLoadedMascotProps {
  /** Mascot character type */
  mascot: MascotType;
  /** Visual style variant */
  style?: MascotStyle;
  /** Display size in pixels */
  size?: MascotSize;
  /** Enable animations */
  animate?: boolean;
  /** Animation type */
  animation?: 'idle' | 'wave' | 'celebrate' | 'howl' | 'alert' | 'focus';
  /** Additional CSS classes */
  className?: string;
  /** Accessible label */
  alt?: string;
  /** Click handler */
  onClick?: () => void;
  /** Whether the mascot is interactive */
  interactive?: boolean;
  /** Custom fallback while loading */
  fallback?: React.ReactNode;
  /** Use CSS-only version */
  useCSS?: boolean;
}

// ============================================================================
// Dynamic Imports - Each style loads as separate chunk
// ============================================================================

// Dropout style mascots - lazy loaded
const dropoutComponents = {
  'wolf-dropout': lazy(() => import(/* webpackChunkName: "mascot-dropout" */ './generated/dropout/WolfDropout')),
};

// NJ style mascots - lazy loaded
const njComponents = {
  'wolf-nj': lazy(() => import(/* webpackChunkName: "mascot-nj" */ './generated/nj/WolfNJ')),
  'bunny-nj': lazy(() => import(/* webpackChunkName: "mascot-nj" */ './generated/nj/BunnyNJ')),
};

// Default/legacy mascots - lazy loaded
const defaultComponents = {
  'fox-default': lazy(() => import(/* webpackChunkName: "mascot-default" */ './generated/FoxMascotSVG')),
  'owl-default': lazy(() => import(/* webpackChunkName: "mascot-default" */ './generated/OwlMascotSVG')),
  'wolf-default': lazy(() => import(/* webpackChunkName: "mascot-default" */ './generated/WolfMascotSVG')),
  'hawk-default': lazy(() => import(/* webpackChunkName: "mascot-default" */ './generated/HawkMascotSVG')),
  'dropout-bear-default': lazy(() => import(/* webpackChunkName: "mascot-default" */ './generated/DropoutBearMascot')),
  'nj-bunny-default': lazy(() => import(/* webpackChunkName: "mascot-default" */ './generated/NJBunnyMascot')),
};

// ============================================================================
// SVG URL Builder - For direct SVG loading (smaller bundle)
// ============================================================================

/**
 * Get SVG URL for mascot - loads only the needed size
 */
const getMascotSvgUrl = (mascot: MascotType, style: MascotStyle, size: MascotSize): string => {
  const sizeMap: Record<MascotSize, string> = {
    32: '32x32',
    64: '64x64',
    128: '128x128',
    256: '256x256',
    512: '512x512',
  };
  
  const sizeStr = sizeMap[size];
  
  // Map mascot names to file names
  const fileNameMap: Record<string, string> = {
    'fox': 'fox',
    'owl': 'owl',
    'wolf': 'wolf',
    'hawk': 'hawk',
    'dropout-bear': 'dropout-bear',
    'nj-bunny': 'nj-bunny',
  };
  
  const fileName = fileNameMap[mascot] || mascot;
  
  // Route to correct folder based on style
  if (style === 'dropout') {
    return `/mascots/dropout/${fileName}-${sizeStr}.svg`;
  }
  if (style === 'nj') {
    return `/mascots/nj/${fileName}-${sizeStr}.svg`;
  }
  
  // Default style uses svg folder
  return `/mascots/svg/${fileName}-${sizeStr}.svg`;
};

// ============================================================================
// Lazy Loaded Image Component
// ============================================================================

interface LazyMascotImageProps {
  src: string;
  alt: string;
  size: MascotSize;
  className?: string;
  animate?: boolean;
}

const LazyMascotImage: React.FC<LazyMascotImageProps> = ({ 
  src, 
  alt, 
  size, 
  className = '',
  animate = false 
}) => {
  const [loaded, setLoaded] = React.useState(false);
  
  return (
    <img
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`mascot-asset ${className} ${animate ? 'mascot-animate' : ''} ${loaded ? 'loaded' : 'loading'}`}
      style={{
        width: size,
        height: size,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out',
      }}
      onLoad={() => setLoaded(true)}
      loading="lazy"
      decoding="async"
    />
  );
};

// ============================================================================
// Lazy Loaded Component Renderer
// ============================================================================

interface LazyComponentRendererProps {
  mascot: MascotType;
  style: MascotStyle;
  size: MascotSize;
  animate: boolean;
  animation?: string;
  className?: string;
  onClick?: () => void;
  alt: string;
  interactive?: boolean;
  useCSS?: boolean;
}

const LazyComponentRenderer: React.FC<LazyComponentRendererProps> = (props) => {
  const { mascot, style, size, animate, animation, className, onClick, alt, interactive, useCSS } = props;
  
  const componentKey = `${mascot}-${style}`;
  
  // Get the appropriate lazy component
  const LazyComponent = useMemo(() => {
    if (style === 'dropout') {
      return dropoutComponents[`${mascot}-dropout` as keyof typeof dropoutComponents] || null;
    }
    if (style === 'nj') {
      return njComponents[`${mascot}-nj` as keyof typeof njComponents] || 
             njComponents['wolf-nj']; // fallback
    }
    return defaultComponents[`${mascot}-default` as keyof typeof defaultComponents] || 
           defaultComponents['fox-default']; // fallback
  }, [mascot, style]);
  
  if (!LazyComponent) {
    // Fallback to SVG image if no component available
    const svgUrl = getMascotSvgUrl(mascot, style, size);
    return (
      <LazyMascotImage
        src={svgUrl}
        alt={alt}
        size={size}
        className={className}
        animate={animate}
      />
    );
  }
  
  // Render the lazy-loaded component
  return (
    <LazyComponent
      size={size}
      variant="default"
      animate={animate}
      animation={animation as any}
      className={className}
      onClick={onClick}
      ariaLabel={alt}
      interactive={interactive}
      useCSS={useCSS}
    />
  );
};

// ============================================================================
// Main Lazy Loaded Mascot Component
// ============================================================================

export const MascotAssetLazyLoaded: React.FC<LazyLoadedMascotProps> = ({
  mascot,
  style = 'default',
  size = 128,
  animate = false,
  animation = 'idle',
  className = '',
  alt,
  onClick,
  interactive = false,
  fallback,
  useCSS = false,
}) => {
  // Generate accessible label
  const accessibleLabel = alt || `${mascot} mascot${style !== 'default' ? ` (${style} style)` : ''}`;
  
  // Use SVG direct loading for simpler cases (smaller bundle impact)
  const useDirectSvg = !useCSS && style !== 'dropout' && style !== 'nj';
  
  if (useDirectSvg) {
    const svgUrl = getMascotSvgUrl(mascot, style, size);
    
    return (
      <div
        className={`mascot-asset-wrapper ${className}`}
        style={{ width: size, height: size }}
        role="img"
        aria-label={accessibleLabel}
      >
        <Suspense fallback={fallback || <MascotSkeleton size={size} />}>
          <LazyMascotImage
            src={svgUrl}
            alt={accessibleLabel}
            size={size}
            animate={animate}
          />
        </Suspense>
      </div>
    );
  }
  
  // Use lazy-loaded component for styled mascots
  return (
    <div
      className={`mascot-asset-wrapper ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={accessibleLabel}
      onClick={onClick}
      onKeyDown={(e) => {
        if ((onClick || interactive) && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick?.();
        }
      }}
      tabIndex={interactive || onClick ? 0 : -1}
    >
      <Suspense fallback={fallback || <MascotSkeleton size={size} />}>
        <LazyComponentRenderer
          mascot={mascot}
          style={style}
          size={size}
          animate={animate}
          animation={animation}
          className={className}
          onClick={onClick}
          alt={accessibleLabel}
          interactive={interactive}
          useCSS={useCSS}
        />
      </Suspense>
    </div>
  );
};

// ============================================================================
// Preload Utilities
// ============================================================================

/**
 * Preload a mascot for instant display
 * Call this when you know a mascot will be needed soon
 */
export const preloadMascot = (mascot: MascotType, style: MascotStyle = 'default', size: MascotSize = 128): void => {
  if (typeof window === 'undefined') return;
  
  const svgUrl = getMascotSvgUrl(mascot, style, size);
  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = svgUrl;
  link.type = 'image/svg+xml';
  document.head.appendChild(link);
};

/**
 * Preload multiple mascots at once
 */
export const preloadMascots = (mascots: Array<{ mascot: MascotType; style?: MascotStyle; size?: MascotSize }>): void => {
  mascots.forEach(({ mascot, style = 'default', size = 128 }) => {
    preloadMascot(mascot, style, size);
  });
};

// ============================================================================
// Exports
// ============================================================================

export default MascotAssetLazyLoaded;
