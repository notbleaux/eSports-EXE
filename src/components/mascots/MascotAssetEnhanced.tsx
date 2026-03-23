/**
 * MascotAssetEnhanced.tsx
 * 
 * Enhanced mascot component with full style-switching support
 * Provides a unified interface for all 14 mascots (7 animals × 2 styles)
 * 
 * [Ver004.000]
 */

import React, { useMemo, Suspense, lazy, ComponentType } from 'react';
import type { MascotAnimal, MascotStyle } from '../../../scripts/mascot-generator/config';
import { 
  CROSS_STYLE_MAP, 
  getCompatibleVariant, 
  getCompatibleAnimation,
  STYLE_SWITCH_CONFIG,
} from '../../../scripts/mascot-generator/config-new-mascots';

// ===== TYPE DEFINITIONS =====

export type { MascotAnimal, MascotStyle };

export const MASCOT_ANIMALS: MascotAnimal[] = ['fox', 'owl', 'wolf', 'hawk', 'bear', 'bunny', 'cat'];
export const MASCOT_STYLES: MascotStyle[] = ['dropout', 'nj'];

export type MascotSize = 32 | 64 | 128 | 256 | 512;

export type MascotAnimation = 
  | 'idle' 
  | 'wave' 
  | 'celebrate' 
  | 'confident' 
  | 'thinking' 
  | 'reading' 
  | 'howl' 
  | 'prowl' 
  | 'mischief' 
  | 'peekaboo' 
  | 'alert' 
  | 'scanning'
  | 'none';

export interface MascotAssetEnhancedProps {
  /** The animal type to display */
  animal: MascotAnimal;
  /** The style variant (dropout or nj) */
  style?: MascotStyle;
  /** Size in pixels */
  size?: MascotSize;
  /** Animation state */
  animation?: MascotAnimation;
  /** Visual variant (style-specific) */
  variant?: string;
  /** Additional CSS class */
  className?: string;
  /** Click handler */
  onClick?: () => void;
  /** Alt text for accessibility */
  alt?: string;
  /** Whether to apply hover effects */
  hoverable?: boolean;
  /** Custom stroke color (NJ style only) */
  strokeColor?: string;
  /** Whether to show glasses glint (Dropout Owl only) */
  showGlint?: boolean;
  /** Callback when style switches */
  onStyleChange?: (newStyle: MascotStyle) => void;
}

// ===== DYNAMIC IMPORTS =====

// Dropout style components
const FoxDropout = lazy(() => import('./generated/dropout/FoxDropout'));
const OwlDropout = lazy(() => import('./generated/dropout/OwlDropout'));
const WolfDropout = lazy(() => import('./generated/dropout/WolfDropout'));
const HawkDropout = lazy(() => import('./generated/dropout/HawkDropout'));
const BearDropout = lazy(() => import('./dropout/BearDropout'));
const BunnyDropout = lazy(() => import('./dropout/BunnyDropout'));
const CatDropout = lazy(() => import('./generated/dropout/CatDropout'));

// NJ style components
const FoxNJ = lazy(() => import('./generated/nj/FoxNJ'));
const OwlNJ = lazy(() => import('./generated/nj/OwlNJ'));
const WolfNJ = lazy(() => import('./generated/nj/WolfNJ'));
const HawkNJ = lazy(() => import('./generated/nj/HawkNJ'));
const BearNJ = lazy(() => import('./nj/BearNJ'));
const BunnyNJ = lazy(() => import('./nj/BunnyNJ'));
const CatNJ = lazy(() => import('./generated/nj/CatNJ'));

// ===== COMPONENT MAP =====

interface ComponentMapEntry {
  component: ComponentType<any>;
  propsAdapter: (props: MascotAssetEnhancedProps) => Record<string, any>;
}

const COMPONENT_MAP: Record<MascotAnimal, Record<MascotStyle, ComponentMapEntry>> = {
  fox: {
    dropout: {
      component: FoxDropout,
      propsAdapter: (props) => ({
        size: props.size,
        animation: props.animation === 'none' ? 'idle' : props.animation,
        className: props.className,
        onClick: props.onClick,
        alt: props.alt || 'Fox mascot',
        hoverable: props.hoverable,
      }),
    },
    nj: {
      component: FoxNJ,
      propsAdapter: (props) => ({
        size: props.size,
        animation: props.animation === 'none' ? 'idle' : props.animation,
        variant: props.variant || 'classic-blue',
        className: props.className,
        onClick: props.onClick,
        alt: props.alt || 'Fox mascot',
        hoverable: props.hoverable,
        strokeColor: props.strokeColor,
      }),
    },
  },
  owl: {
    dropout: {
      component: OwlDropout,
      propsAdapter: (props) => ({
        size: props.size,
        className: props.className,
        state: props.animation === 'none' ? 'default' : props.animation,
        showGlint: props.showGlint ?? true,
        onClick: props.onClick,
        alt: props.alt || 'Owl mascot',
      }),
    },
    nj: {
      component: OwlNJ,
      propsAdapter: (props) => ({
        size: props.size,
        className: props.className,
        onClick: props.onClick,
        alt: props.alt || 'Owl mascot',
      }),
    },
  },
  wolf: {
    dropout: {
      component: WolfDropout,
      propsAdapter: (props) => ({
        size: props.size,
        animation: props.animation === 'none' ? 'idle' : props.animation,
        variant: props.variant || 'midnight',
        className: props.className,
        onClick: props.onClick,
        alt: props.alt || 'Wolf mascot',
        hoverable: props.hoverable,
      }),
    },
    nj: {
      component: WolfNJ,
      propsAdapter: (props) => ({
        size: props.size,
        animation: props.animation === 'none' ? 'idle' : props.animation,
        variant: props.variant || 'classic-blue',
        className: props.className,
        onClick: props.onClick,
        alt: props.alt || 'Wolf mascot',
        hoverable: props.hoverable,
        strokeColor: props.strokeColor,
      }),
    },
  },
  hawk: {
    dropout: {
      component: HawkDropout,
      propsAdapter: (props) => ({
        size: props.size,
        className: props.className,
        onClick: props.onClick,
        alt: props.alt || 'Hawk mascot',
      }),
    },
    nj: {
      component: HawkNJ,
      propsAdapter: (props) => ({
        size: String(props.size) as '32' | '64' | '128' | '256' | '512',
        state: props.animation === 'none' ? 'idle' : props.animation === 'alert' || props.animation === 'scanning' ? props.animation : 'idle',
        className: props.className,
        onClick: props.onClick,
        ariaLabel: props.alt || 'Hawk mascot',
      }),
    },
  },
  bear: {
    dropout: {
      component: BearDropout,
      propsAdapter: (props) => ({
        variant: props.variant || 'default',
        size: props.size,
        animation: props.animation,
        className: props.className,
        alt: props.alt || 'Bear mascot',
      }),
    },
    nj: {
      component: BearNJ,
      propsAdapter: (props) => ({
        size: props.size,
        animation: props.animation,
        className: props.className,
        alt: props.alt || 'Bear mascot',
      }),
    },
  },
  bunny: {
    dropout: {
      component: BunnyDropout,
      propsAdapter: (props) => ({
        size: props.size,
        animation: props.animation,
        className: props.className,
        alt: props.alt || 'Bunny mascot',
      }),
    },
    nj: {
      component: BunnyNJ,
      propsAdapter: (props) => ({
        variant: props.variant || 'classic-blue',
        size: props.size,
        animation: props.animation,
        className: props.className,
        alt: props.alt || 'Bunny mascot',
      }),
    },
  },
  cat: {
    dropout: {
      component: CatDropout,
      propsAdapter: (props) => ({
        size: props.size,
        animation: props.animation === 'none' ? 'idle' : props.animation,
        variant: props.variant || 'tuxedo',
        className: props.className,
        onClick: props.onClick,
        alt: props.alt || 'Cat mascot',
        hoverable: props.hoverable,
      }),
    },
    nj: {
      component: CatNJ,
      propsAdapter: (props) => ({
        size: props.size,
        animation: props.animation === 'none' ? 'idle' : props.animation,
        variant: props.variant || 'classic-blue',
        className: props.className,
        onClick: props.onClick,
        alt: props.alt || 'Cat mascot',
        hoverable: props.hoverable,
        strokeColor: props.strokeColor,
      }),
    },
  },
};

// ===== LOADING FALLBACK =====

const MascotLoadingFallback: React.FC<{ size?: number }> = ({ size = 128 }) => (
  <div
    style={{
      width: size,
      height: size,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.05)',
      borderRadius: '8px',
    }}
    role="status"
    aria-label="Loading mascot..."
  >
    <div
      style={{
        width: size * 0.3,
        height: size * 0.3,
        border: `3px solid rgba(0, 0, 255, 0.1)`,
        borderTopColor: '#0000FF',
        borderRadius: '50%',
        animation: 'mascot-spin 1s linear infinite',
      }}
    />
    <style>{`
      @keyframes mascot-spin {
        to { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

// ===== MAIN COMPONENT =====

export const MascotAssetEnhanced: React.FC<MascotAssetEnhancedProps> = ({
  animal,
  style = 'dropout',
  size = 128,
  animation = 'idle',
  variant,
  className = '',
  onClick,
  alt,
  hoverable = true,
  strokeColor,
  showGlint,
}) => {
  // Get component configuration
  const componentConfig = useMemo(() => {
    return COMPONENT_MAP[animal]?.[style];
  }, [animal, style]);

  // Adapt props for the specific component
  const adaptedProps = useMemo(() => {
    if (!componentConfig) return {};
    return componentConfig.propsAdapter({
      animal,
      style,
      size,
      animation,
      variant,
      className,
      onClick,
      alt,
      hoverable,
      strokeColor,
      showGlint,
    });
  }, [animal, style, size, animation, variant, className, onClick, alt, hoverable, strokeColor, showGlint]);

  // Handle missing configuration
  if (!componentConfig) {
    console.warn(`Mascot configuration not found for ${animal} in ${style} style`);
    return (
      <div
        style={{
          width: size,
          height: size,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 0, 0, 0.1)',
          borderRadius: '8px',
          fontSize: size * 0.2,
        }}
        role="img"
        aria-label={alt || `${animal} mascot`}
      >
        🎭
      </div>
    );
  }

  const MascotComponent = componentConfig.component;

  return (
    <Suspense fallback={<MascotLoadingFallback size={size} />}>
      <MascotComponent {...adaptedProps} />
    </Suspense>
  );
};

// ===== STYLE SWITCHING HOOK =====

export interface UseStyleSwitchReturn {
  currentStyle: MascotStyle;
  toggleStyle: () => void;
  setStyle: (style: MascotStyle) => void;
  getCompatibleProps: (props: Partial<MascotAssetEnhancedProps>) => Partial<MascotAssetEnhancedProps>;
}

export function useStyleSwitch(
  initialAnimal: MascotAnimal,
  initialStyle: MascotStyle = STYLE_SWITCH_CONFIG.defaultStyle
): UseStyleSwitchReturn {
  const [currentStyle, setCurrentStyle] = React.useState<MascotStyle>(initialStyle);

  const toggleStyle = React.useCallback(() => {
    setCurrentStyle(prev => prev === 'dropout' ? 'nj' : 'dropout');
  }, []);

  const setStyle = React.useCallback((style: MascotStyle) => {
    setCurrentStyle(style);
  }, []);

  const getCompatibleProps = React.useCallback((
    props: Partial<MascotAssetEnhancedProps>
  ): Partial<MascotAssetEnhancedProps> => {
    const targetStyle = currentStyle === 'dropout' ? 'nj' : 'dropout';
    
    return {
      ...props,
      style: targetStyle,
      variant: props.variant ? getCompatibleVariant(props.variant, targetStyle) : undefined,
      animation: props.animation ? getCompatibleAnimation(props.animation, targetStyle) as MascotAnimation : 'idle',
    };
  }, [currentStyle]);

  return {
    currentStyle,
    toggleStyle,
    setStyle,
    getCompatibleProps,
  };
}

// ===== UTILITY EXPORTS =====

export { CROSS_STYLE_MAP };
export { getCompatibleVariant, getCompatibleAnimation };

export default MascotAssetEnhanced;
