/** [Ver001.000]
 * GlassCard Component
 * 
 * Enhanced glassmorphism card component with fluid animations,
 * hub-specific theming, and accessibility support.
 */

import React from 'react';
import { motion, type HTMLMotionProps } from 'framer-motion';
import { cn } from '@/utils/cn';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';
import { easings } from '@/lib/easing';

// ============================================================================
// Hub Theme Configuration
// ============================================================================

export type HubId = 'sator' | 'rotas' | 'arepo' | 'opera' | 'tenet';

const HUB_COLORS: Record<HubId, string> = {
  sator: '#00d4ff',
  rotas: '#ff4444',
  arepo: '#ffaa00',
  opera: '#ff00ff',
  tenet: '#8b5cf6',
};

const HUB_GLOW_COLORS: Record<HubId, string> = {
  sator: 'rgba(0, 212, 255, 0.5)',
  rotas: 'rgba(255, 68, 68, 0.5)',
  arepo: 'rgba(255, 170, 0, 0.5)',
  opera: 'rgba(255, 0, 255, 0.5)',
  tenet: 'rgba(139, 92, 246, 0.4)',
};

type GlowIntensity = 'none' | 'subtle' | 'medium' | 'strong';

const GLOW_INTENSITY_MAP: Record<GlowIntensity, { boxShadow: string; scale: number }> = {
  none: {
    boxShadow: 'none',
    scale: 1,
  },
  subtle: {
    boxShadow: '0 0 10px {color}',
    scale: 1.01,
  },
  medium: {
    boxShadow: '0 0 20px {color}, 0 0 40px {color}',
    scale: 1.02,
  },
  strong: {
    boxShadow: '0 0 30px {color}, 0 0 60px {color}, 0 0 90px {color}',
    scale: 1.03,
  },
};

function getGlowColor(hubTheme?: HubId, customGlow?: string): string {
  if (customGlow) return customGlow;
  if (hubTheme) return HUB_GLOW_COLORS[hubTheme];
  return 'rgba(255, 255, 255, 0.3)';
}

function getBorderGlowColor(hubTheme?: HubId): string {
  if (hubTheme) return HUB_COLORS[hubTheme];
  return 'rgba(255, 255, 255, 0.2)';
}

// ============================================================================
// Component Props
// ============================================================================

export interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverGlow?: string;
  glowColor?: string;
  hubTheme?: HubId;
  glowIntensity?: GlowIntensity;
  borderGlow?: boolean;
  elevated?: boolean;
  reducedMotion?: boolean;
  onClick?: () => void;
  as?: React.ElementType;
}

export interface GlassCardComponentProps extends GlassCardProps {
  motionProps?: HTMLMotionProps<'div'>;
  style?: React.CSSProperties;
}

// ============================================================================
// Component
// ============================================================================

export const GlassCard = React.forwardRef<HTMLDivElement, GlassCardComponentProps>(
  function GlassCard({
    children,
    className,
    hoverGlow,
    glowColor,
    hubTheme,
    glowIntensity = 'medium',
    borderGlow = true,
    elevated = false,
    reducedMotion: forceReducedMotion,
    onClick,
    motionProps,
    style,
  }, ref): JSX.Element {
    const effectiveGlowColor = glowColor || hoverGlow;
    const { prefersReducedMotion } = useReducedMotion(forceReducedMotion);
    
    const glowColorValue = getGlowColor(hubTheme, effectiveGlowColor);
    const borderGlowColor = getBorderGlowColor(hubTheme);
    
    const intensityConfig = GLOW_INTENSITY_MAP[glowIntensity];
    const hoverScale = prefersReducedMotion ? 1 : intensityConfig.scale;
    const hoverShadow = glowIntensity === 'none' 
      ? 'none' 
      : intensityConfig.boxShadow.replace(/{color}/g, glowColorValue);
    
    const baseClasses = cn(
      'relative overflow-hidden',
      elevated ? 'bg-white/[0.06]' : 'bg-white/[0.03]',
      elevated ? 'backdrop-blur-xl' : 'backdrop-blur-md',
      'border border-white/[0.08]',
      elevated ? 'rounded-2xl' : 'rounded-xl',
      'transition-all duration-200',
      onClick && 'cursor-pointer',
      className
    );
    
    const variants = {
      initial: {
        scale: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
        boxShadow: '0 0 0px rgba(0, 0, 0, 0)',
      },
      hover: prefersReducedMotion 
        ? {} 
        : {
            scale: hoverScale,
            borderColor: borderGlow ? borderGlowColor : 'rgba(255, 255, 255, 0.08)',
            boxShadow: hoverShadow,
          },
      tap: prefersReducedMotion ? {} : { scale: 0.98 },
    };
    
    return (
      <motion.div
        ref={ref}
        className={baseClasses}
        style={style}
        initial="initial"
        whileHover={onClick || hoverGlow || hubTheme ? 'hover' : undefined}
        whileTap={onClick ? 'tap' : undefined}
        variants={variants}
        transition={{
          duration: 0.2,
          ease: easings.fluid,
        }}
        onClick={onClick}
        {...motionProps}
      >
        <div 
          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: hubTheme 
              ? `radial-gradient(circle at 50% 0%, ${HUB_GLOW_COLORS[hubTheme].replace('0.5', '0.1')}, transparent 70%)`
              : 'radial-gradient(circle at 50% 0%, rgba(255, 255, 255, 0.05), transparent 70%)',
          }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </motion.div>
    );
  }
);

// ============================================================================
// Variants
// ============================================================================

type HubCardProps = Omit<GlassCardComponentProps, 'hubTheme'>;

export const SatorCard = React.forwardRef<HTMLDivElement, HubCardProps>(
  function SatorCard(props, ref) {
    return <GlassCard ref={ref} hubTheme="sator" {...props} />;
  }
);

export const RotasCard = React.forwardRef<HTMLDivElement, HubCardProps>(
  function RotasCard(props, ref) {
    return <GlassCard ref={ref} hubTheme="rotas" {...props} />;
  }
);

export const ArepoCard = React.forwardRef<HTMLDivElement, HubCardProps>(
  function ArepoCard(props, ref) {
    return <GlassCard ref={ref} hubTheme="arepo" {...props} />;
  }
);

export const OperaCard = React.forwardRef<HTMLDivElement, HubCardProps>(
  function OperaCard(props, ref) {
    return <GlassCard ref={ref} hubTheme="opera" {...props} />;
  }
);

export const TenetCard = React.forwardRef<HTMLDivElement, HubCardProps>(
  function TenetCard(props, ref) {
    return <GlassCard ref={ref} hubTheme="tenet" {...props} />;
  }
);

export default GlassCard;
