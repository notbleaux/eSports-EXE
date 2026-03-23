/**
 * Mascot Skeleton Loading Component
 * 
 * Lightweight placeholder while mascot assets load.
 * 
 * [Ver001.000] - REF-004 Bundle Optimization
 */

import React from 'react';

export interface MascotSkeletonProps {
  /** Size of the skeleton in pixels */
  size?: number;
  /** Mascot type for color hinting */
  mascot?: string;
  /** Animation style */
  pulse?: boolean;
  /** Additional CSS classes */
  className?: string;
}

// Color hints for different mascots
const MASCOT_COLORS: Record<string, string> = {
  fox: '#F97316',
  owl: '#6366F1',
  wolf: '#475569',
  hawk: '#DC2626',
  'dropout-bear': '#8B4513',
  'nj-bunny': '#0000FF',
  default: '#00f0ff',
};

/**
 * Skeleton placeholder for loading mascots
 */
export const MascotSkeleton: React.FC<MascotSkeletonProps> = ({
  size = 128,
  mascot = 'default',
  pulse = true,
  className = '',
}) => {
  const color = MASCOT_COLORS[mascot] || MASCOT_COLORS.default;
  
  return (
    <div
      className={`mascot-skeleton ${pulse ? 'pulse' : ''} ${className}`}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.03)',
        borderRadius: size * 0.1,
        position: 'relative',
        overflow: 'hidden',
      }}
      role="status"
      aria-label="Loading mascot..."
    >
      {/* Animated placeholder shape */}
      <div
        className="skeleton-shape"
        style={{
          width: size * 0.6,
          height: size * 0.6,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${color}20 0%, ${color}40 50%, ${color}20 100%)`,
          animation: pulse ? 'mascot-skeleton-pulse 1.5s ease-in-out infinite' : 'none',
        }}
      />
      
      {/* Loading indicator */}
      <div
        className="loading-indicator"
        style={{
          position: 'absolute',
          width: size * 0.15,
          height: size * 0.15,
          border: `2px solid ${color}30`,
          borderTopColor: color,
          borderRadius: '50%',
          animation: 'mascot-skeleton-spin 1s linear infinite',
        }}
      />
      
      {/* Shimmer effect */}
      <div
        className="shimmer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.03) 50%, transparent 100%)',
          animation: pulse ? 'mascot-skeleton-shimmer 2s ease-in-out infinite' : 'none',
        }}
      />
      
      {/* Inline styles for animations */}
      <style>{`
        @keyframes mascot-skeleton-pulse {
          0%, 100% { 
            transform: scale(0.95); 
            opacity: 0.6;
          }
          50% { 
            transform: scale(1.05); 
            opacity: 0.8;
          }
        }
        
        @keyframes mascot-skeleton-spin {
          to { transform: rotate(360deg); }
        }
        
        @keyframes mascot-skeleton-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .mascot-skeleton .skeleton-shape,
          .mascot-skeleton .loading-indicator,
          .mascot-skeleton .shimmer {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
};

/**
 * Compact skeleton for small mascots (32x32, 64x64)
 */
export const MascotSkeletonCompact: React.FC<Omit<MascotSkeletonProps, 'pulse'>> = ({
  size = 32,
  mascot = 'default',
  className = '',
}) => {
  const color = MASCOT_COLORS[mascot] || MASCOT_COLORS.default;
  
  return (
    <div
      className={`mascot-skeleton-compact ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: `${color}15`,
        borderRadius: size * 0.2,
        animation: 'mascot-skeleton-fade 1s ease-in-out infinite alternate',
      }}
      role="status"
      aria-label="Loading..."
    >
      <style>{`
        @keyframes mascot-skeleton-fade {
          from { opacity: 0.4; }
          to { opacity: 0.7; }
        }
        
        @media (prefers-reduced-motion: reduce) {
          .mascot-skeleton-compact {
            animation: none !important;
            opacity: 0.5;
          }
        }
      `}</style>
    </div>
  );
};

export default MascotSkeleton;
