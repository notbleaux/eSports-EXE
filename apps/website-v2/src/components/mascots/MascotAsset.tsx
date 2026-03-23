/**
 * Universal Mascot Asset Component
 * 
 * [Ver001.000]
 * 
 * Integrates all 3 generation options with runtime switching:
 * - svg: Scalable vector (default)
 * - png: Pixel-perfect raster
 * - css: Zero-dependency
 */

import React, { useState, useEffect } from 'react';

export type MascotType = 'fox' | 'owl' | 'wolf' | 'hawk';
export type AssetFormat = 'svg' | 'png' | 'css' | 'auto';

interface MascotAssetProps {
  /** Mascot character */
  mascot: MascotType;
  
  /** Display size in pixels */
  size?: 32 | 64 | 128 | 256 | 512;
  
  /** Asset format - 'auto' selects best for size */
  format?: AssetFormat;
  
  /** Enable hover animations */
  animate?: boolean;
  
  /** Animation type */
  animation?: 'idle' | 'wave' | 'celebrate';
  
  /** CSS class */
  className?: string;
  
  /** Alt text for accessibility */
  alt?: string;
  
  /** Called when asset loads */
  onLoad?: () => void;
  
  /** Called on error */
  onError?: (error: Error) => void;
}

interface AssetMeta {
  loaded: boolean;
  error: Error | null;
  format: AssetFormat;
}

/**
 * Universal Mascot Asset
 * 
 * Automatically selects optimal format:
 * - Small sizes (≤64): CSS or SVG
 * - Medium sizes (128-256): SVG
 * - Large sizes (≥512): PNG (if available) or SVG
 * - Animation: SVG or CSS
 * 
 * @example
 * <MascotAsset mascot="fox" size={128} format="auto" animate />
 */
export const MascotAsset: React.FC<MascotAssetProps> = ({
  mascot,
  size = 128,
  format = 'auto',
  animate = false,
  animation = 'idle',
  className = '',
  alt,
  onLoad,
  onError
}) => {
  const [meta, setMeta] = useState<AssetMeta>({
    loaded: false,
    error: null,
    format: 'auto'
  });

  // Determine optimal format
  const resolvedFormat = format === 'auto' ? selectOptimalFormat(size, animate) : format;

  // Load asset metadata
  useEffect(() => {
    setMeta({ loaded: false, error: null, format: resolvedFormat });

    // Simulate asset check (in production, this would check if file exists)
    const checkAsset = async () => {
      try {
        // In production: fetch HEAD request to check existence
        // For now, assume SVG always exists
        if (resolvedFormat === 'png') {
          // Check if PNG exists, fallback to SVG
          const pngExists = await checkPngExists(mascot, size);
          if (!pngExists) {
            setMeta(prev => ({ ...prev, format: 'svg' }));
          }
        }
        setMeta(prev => ({ ...prev, loaded: true }));
        onLoad?.();
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setMeta(prev => ({ ...prev, error: err }));
        onError?.(err);
      }
    };

    checkAsset();
  }, [mascot, size, resolvedFormat, onLoad, onError]);

  // Render based on format
  if (meta.format === 'svg') {
    return (
      <SVGAsset
        mascot={mascot}
        size={size}
        animate={animate}
        animation={animation}
        className={className}
        alt={alt}
      />
    );
  }

  if (meta.format === 'png') {
    return (
      <PNGAsset
        mascot={mascot}
        size={size}
        className={className}
        alt={alt || `${mascot} mascot`}
      />
    );
  }

  if (meta.format === 'css') {
    return (
      <CSSAsset
        mascot={mascot}
        size={size}
        animate={animate}
        animation={animation}
        className={className}
      />
    );
  }

  // Fallback to SVG
  return (
    <SVGAsset
      mascot={mascot}
      size={size}
      animate={animate}
      animation={animation}
      className={className}
      alt={alt}
    />
  );
};

// ============================================
// SVG ASSET
// ============================================

interface SVGAssetProps {
  mascot: MascotType;
  size: number;
  animate: boolean;
  animation: 'idle' | 'wave' | 'celebrate';
  className: string;
  alt?: string;
}

const SVGAsset: React.FC<SVGAssetProps> = ({
  mascot,
  size,
  animate,
  animation,
  className,
  alt
}) => {
  const [svgContent, setSvgContent] = useState<string>('');

  useEffect(() => {
    // Load SVG content
    fetch(`/mascots/svg/${mascot}-${size}x${size}.svg`)
      .then(res => res.text())
      .then(setSvgContent)
      .catch(() => {
        // Fallback to inline generated SVG
        setSvgContent(generateInlineSVG(mascot, size));
      });
  }, [mascot, size]);

  const animationClass = animate ? `animate-${animation}` : '';

  return (
    <div
      className={`mascot-svg ${className} ${animationClass}`}
      style={{
        width: size,
        height: size,
        imageRendering: 'pixelated'
      }}
      aria-label={alt || `${mascot} mascot`}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

// ============================================
// PNG ASSET
// ============================================

interface PNGAssetProps {
  mascot: MascotType;
  size: number;
  className: string;
  alt: string;
}

const PNGAsset: React.FC<PNGAssetProps> = ({
  mascot,
  size,
  className,
  alt
}) => {
  const [loaded, setLoaded] = useState(false);

  return (
    <img
      src={`/mascots/png/${mascot}-${size}x${size}.png`}
      alt={alt}
      width={size}
      height={size}
      className={`mascot-png pixelated ${className} ${loaded ? 'loaded' : 'loading'}`}
      style={{
        imageRendering: 'pixelated',
        opacity: loaded ? 1 : 0,
        transition: 'opacity 0.2s'
      }}
      onLoad={() => setLoaded(true)}
    />
  );
};

// ============================================
// CSS ASSET
// ============================================

interface CSSAssetProps {
  mascot: MascotType;
  size: number;
  animate: boolean;
  animation: 'idle' | 'wave' | 'celebrate';
  className: string;
}

const CSSAsset: React.FC<CSSAssetProps> = ({
  mascot,
  size,
  animate,
  animation,
  className
}) => {
  const scale = size / 64;

  return (
    <div
      className={`mascot-css-wrapper ${className}`}
      style={{
        width: size,
        height: size,
        display: 'inline-block'
      }}
    >
      <div
        className={`${mascot}-mascot ${animate ? `animate-${animation}` : ''}`}
        style={{
          transform: `scale(${scale})`,
          transformOrigin: 'top left'
        }}
      />
    </div>
  );
};

// ============================================
// UTILITIES
// ============================================

function selectOptimalFormat(size: number, animate: boolean): AssetFormat {
  // Small sizes: CSS is fastest
  if (size <= 64 && !animate) {
    return 'css';
  }

  // Animation: SVG has best support
  if (animate) {
    return 'svg';
  }

  // Large sizes: PNG if available (better performance)
  if (size >= 512) {
    return 'png';
  }

  // Default: SVG for best quality/scalability
  return 'svg';
}

async function checkPngExists(mascot: MascotType, size: number): Promise<boolean> {
  try {
    const response = await fetch(
      `/mascots/png/${mascot}-${size}x${size}.png`,
      { method: 'HEAD' }
    );
    return response.ok;
  } catch {
    return false;
  }
}

function generateInlineSVG(mascot: MascotType, size: number): string {
  // Fallback inline SVG if file loading fails
  // In production, this would be the actual SVG generation logic
  const colors = getMascotColors(mascot);
  
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">
    <rect width="${size}" height="${size}" fill="${colors.primary}" rx="${size * 0.2}" />
    <circle cx="${size * 0.35}" cy="${size * 0.4}" r="${size * 0.1}" fill="#000" />
    <circle cx="${size * 0.65}" cy="${size * 0.4}" r="${size * 0.1}" fill="#000" />
  </svg>`;
}

function getMascotColors(mascot: MascotType): { primary: string } {
  const colors: Record<MascotType, string> = {
    fox: '#F97316',
    owl: '#6366F1',
    wolf: '#475569',
    hawk: '#DC2626'
  };
  return { primary: colors[mascot] };
}

// ============================================
// STYLES
// ============================================

const styles = `
.mascot-svg,
.mascot-png,
.mascot-css-wrapper {
  display: inline-block;
  vertical-align: middle;
}

.pixelated {
  image-rendering: pixelated;
  image-rendering: -moz-crisp-edges;
  image-rendering: crisp-edges;
}

/* Animations */
@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-5%); }
}

@keyframes wave {
  0%, 100% { transform: rotate(0deg); }
  25% { transform: rotate(-5deg); }
  75% { transform: rotate(5deg); }
}

@keyframes celebrate {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

.animate-idle {
  animation: bounce 2s ease-in-out infinite;
}

.animate-wave {
  animation: wave 0.5s ease-in-out 3;
}

.animate-celebrate {
  animation: celebrate 0.5s ease-in-out 3;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'mascot-asset-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = styles;
    document.head.appendChild(styleEl);
  }
}

export default MascotAsset;
