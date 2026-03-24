/**
 * Enhanced Mascot Asset Component
 * 
 * Includes Recommendations:
 * #4: Progressive Enhancement
 * #6: Loading Animations
 * #8: Accessibility Patterns
 * #7: Mascot Rotation
 * #5: User Personalization
 * 
 * [Ver002.000]
 */

import React, { useState, useEffect, useCallback } from 'react';

export type MascotType = 'fox' | 'owl' | 'wolf' | 'hawk' | 'dropout-bear' | 'nj-bunny';

// Mascot variant types for new mascots
export type MascotVariant =
  | 'default'
  // Bear variants
  | 'homecoming' | 'graduation' | 'late-registration' | 'yeezus' | 'donda'
  // Bunny variants
  | 'classic-blue' | 'attention' | 'hype-boy' | 'cookie' | 'ditto';
export type AssetFormat = 'svg' | 'png' | 'css' | 'auto';
export type LoadingState = 'idle' | 'loading' | 'loaded' | 'error';

export interface MascotAssetProps {
  mascot?: MascotType;
  size?: 32 | 64 | 128 | 256 | 512;
  format?: AssetFormat;
  animate?: boolean;
  animation?: 'idle' | 'wave' | 'celebrate';
  className?: string;
  alt?: string;
  /** Enable progressive enhancement fallback */
  progressive?: boolean;
  /** Show loading animation */
  showLoading?: boolean;
  /** Easter egg: click 5x for celebrate */
  easterEggs?: boolean;
  /** Personalization: user preference key */
  preferenceKey?: string;
  /** Rotation: random on load */
  rotate?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

// Personalization storage
const getUserPreference = (key: string): MascotType | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(`mascot-${key}`) as MascotType | null;
};

const setUserPreference = (key: string, mascot: MascotType): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(`mascot-${key}`, mascot);
};

// Rotation: random mascot
const getRandomMascot = (): MascotType => {
  const mascots: MascotType[] = ['fox', 'owl', 'wolf', 'hawk', 'dropout-bear', 'nj-bunny'];
  return mascots[Math.floor(Math.random() * mascots.length)];
};

/**
 * Enhanced Mascot Asset with all recommendations integrated
 */
export const MascotAsset: React.FC<MascotAssetProps> = ({
  mascot: propMascot,
  size = 128,
  format = 'auto',
  animate = false,
  animation = 'idle',
  className = '',
  alt,
  progressive = true,
  showLoading = true,
  easterEggs = true,
  preferenceKey,
  rotate = false,
  onLoad,
  onError
}) => {
  // Personalization: use stored preference or prop
  const [mascot, setMascot] = useState<MascotType>(() => {
    if (preferenceKey) {
      return getUserPreference(preferenceKey) || propMascot || 'fox';
    }
    if (rotate && !propMascot) {
      return getRandomMascot();
    }
    return propMascot || 'fox';
  });

  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [currentFormat, setCurrentFormat] = useState<AssetFormat>(format);
  const [clickCount, setClickCount] = useState(0);
  const [isCelebrate, setIsCelebrate] = useState(false);

  // Select optimal format based on size
  useEffect(() => {
    if (format === 'auto') {
      if (size <= 64) setCurrentFormat('css');
      else if (size >= 512) setCurrentFormat('png');
      else setCurrentFormat('svg');
    } else {
      setCurrentFormat(format);
    }
  }, [format, size]);

  // Load asset
  useEffect(() => {
    setLoadingState('loading');
    
    // Simulate or actual load
    const loadAsset = async () => {
      try {
        if (currentFormat === 'svg' || currentFormat === 'png') {
          const ext = currentFormat;
          const response = await fetch(`/mascots/${ext}/${mascot}-${size}x${size}.${ext}`);
          
          if (!response.ok) {
            // Progressive enhancement: fallback to SVG
            if (progressive && currentFormat === 'png') {
              console.warn(`PNG not found, falling back to SVG for ${mascot}`);
              setCurrentFormat('svg');
              return;
            }
            throw new Error(`Failed to load ${mascot} asset`);
          }
        }
        
        setLoadingState('loaded');
        onLoad?.();
      } catch (error) {
        setLoadingState('error');
        onError?.(error instanceof Error ? error : new Error(String(error)));
      }
    };

    const timer = setTimeout(loadAsset, 100);
    return () => clearTimeout(timer);
  }, [mascot, size, currentFormat, progressive, onLoad, onError]);

  // Easter egg: 5 clicks for celebrate
  const handleClick = useCallback(() => {
    if (!easterEggs) return;
    
    const newCount = clickCount + 1;
    setClickCount(newCount);
    
    if (newCount >= 5) {
      setIsCelebrate(true);
      setTimeout(() => {
        setIsCelebrate(false);
        setClickCount(0);
      }, 2000);
    }
  }, [clickCount, easterEggs]);

  // User personalization: cycle mascot on right-click
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    if (!preferenceKey) return;
    e.preventDefault();
    
    const mascots: MascotType[] = ['fox', 'owl', 'wolf', 'hawk'];
    const currentIndex = mascots.indexOf(mascot);
    const nextMascot = mascots[(currentIndex + 1) % mascots.length];
    
    setMascot(nextMascot);
    setUserPreference(preferenceKey, nextMascot);
  }, [mascot, preferenceKey]);

  // ARIA labels for accessibility
  const ariaLabel = alt || `${mascot} mascot, ${loadingState}`;
  const ariaLive = loadingState === 'loading' ? 'polite' : 'off';

  // Determine animation class
  const animClass = isCelebrate ? 'celebrate' : animate ? animation : '';

  return (
    <div
      className={`mascot-asset-wrapper ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
      aria-live={ariaLive}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      {/* Loading State */}
      {showLoading && loadingState === 'loading' && (
        <LoadingAnimation size={size} mascot={mascot} />
      )}

      {/* Error State */}
      {loadingState === 'error' && (
        <ErrorFallback size={size} mascot={mascot} />
      )}

      {/* Asset Content */}
      {loadingState === 'loaded' && (
        <AssetContent
          mascot={mascot}
          size={size}
          format={currentFormat}
          animation={animClass}
        />
      )}

      {/* Screen reader only description */}
      <span className="sr-only">
        {mascot} mascot. Click 5 times for a surprise! Right-click to change mascot.
      </span>

      {/* Click counter for easter egg (visual feedback) */}
      {easterEggs && clickCount > 0 && clickCount < 5 && (
        <div 
          className="click-indicator"
          style={{
            position: 'absolute',
            top: -20,
            right: 0,
            fontSize: 12,
            opacity: 0.6
          }}
        >
          {clickCount}/5
        </div>
      )}
    </div>
  );
};

/**
 * Loading Animation Component - Recommendation #6
 */
const LoadingAnimation: React.FC<{ size: number; mascot: MascotType }> = ({ size, mascot }) => {
  const colors: Record<MascotType, string> = {
    fox: '#F97316',
    owl: '#6366F1',
    wolf: '#475569',
    hawk: '#DC2626',
    'dropout-bear': '#8B4513',
    'nj-bunny': '#0000FF'
  };

  return (
    <div
      className="mascot-loading"
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        className="loading-pulse"
        style={{
          width: size * 0.5,
          height: size * 0.5,
          borderRadius: '50%',
          backgroundColor: colors[mascot],
          opacity: 0.5,
          animation: 'pulse 1.5s ease-in-out infinite'
        }}
      />
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: scale(0.8); opacity: 0.5; }
          50% { transform: scale(1); opacity: 0.8; }
        }
      `}</style>
    </div>
  );
};

/**
 * Error Fallback - Recommendation #4 (Progressive Enhancement)
 */
const ErrorFallback: React.FC<{ size: number; mascot: MascotType }> = ({ size, mascot }) => {
  const initials = mascot.charAt(0).toUpperCase();
  
  return (
    <div
      className="mascot-error"
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fee2e2',
        borderRadius: size * 0.1,
        color: '#dc2626',
        fontSize: size * 0.4,
        fontWeight: 'bold'
      }}
      title={`Failed to load ${mascot} mascot`}
    >
      {initials}
    </div>
  );
};

/**
 * Asset Content Renderer
 */
const AssetContent: React.FC<{
  mascot: MascotType;
  size: number;
  format: AssetFormat;
  animation: string;
}> = ({ mascot, size, format, animation }) => {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    imageRendering: 'pixelated',
    animation: animation ? `${animation} 1s ease-in-out` : undefined
  };

  if (format === 'css') {
    return (
      <div style={style}>
        <div
          className={`${mascot}-mascot ${animation}`}
          style={{
            width: 64,
            height: 64,
            transform: `scale(${size / 64})`,
            transformOrigin: 'top left'
          }}
        />
      </div>
    );
  }

  const ext = format;
  return (
    <img
      src={`/mascots/${ext}/${mascot}-${size}x${size}.${ext}`}
      alt={`${mascot} mascot`}
      style={style}
      className={`${animation}`}
      loading="lazy"
    />
  );
};

// CSS for animations
const animationStyles = `
  @keyframes idle {
    0%, 100% { transform: translateY(0); }
    50% { transform: translateY(-5%); }
  }
  
  @keyframes wave {
    0%, 100% { transform: rotate(0deg); }
    25% { transform: rotate(-10deg); }
    75% { transform: rotate(10deg); }
  }
  
  @keyframes celebrate {
    0% { transform: scale(1) rotate(0deg); }
    25% { transform: scale(1.2) rotate(-10deg); }
    50% { transform: scale(1) rotate(0deg); }
    75% { transform: scale(1.2) rotate(10deg); }
    100% { transform: scale(1) rotate(0deg); }
  }
  
  .idle { animation: idle 2s ease-in-out infinite; }
  .wave { animation: wave 0.5s ease-in-out 3; }
  .celebrate { animation: celebrate 0.8s ease-in-out; }
  
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border-width: 0;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleId = 'mascot-asset-enhanced-styles';
  if (!document.getElementById(styleId)) {
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = animationStyles;
    document.head.appendChild(styleEl);
  }
}

// Named export alias for backward compatibility
export const MascotAssetEnhanced = MascotAsset;

export default MascotAsset;
