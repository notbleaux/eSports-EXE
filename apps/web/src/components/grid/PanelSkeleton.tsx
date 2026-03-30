/**
 * PanelSkeleton - Loading placeholder for grid panels
 * Provides visual feedback while panel content loads
 * 
 * [Ver003.000] - Converted to TypeScript
 */
import { colors } from '@/theme/colors';
import type { ReactNode } from 'react';

const PORCELAIN_COLORS = {
  base: '#00f0ff',
  accent: '#9d4edd',
  bg: '#0a0a0f',
  surface: '#14141a',
};

const HUB_COLORS = {
  SATOR: colors.hub.sator,
  ROTAS: colors.hub.rotas,
  AREPO: colors.hub.arepo,
  OPERA: colors.hub.opera,
  TENET: colors.hub.tenet,
};

type HubType = 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET';
type SkeletonVariant = 'panel-loading' | 'worker-init' | 'grid-loading' | 'hub-loading' | '3d-loading';

/** Props for WorkerInitSkeleton component */
interface WorkerInitSkeletonProps {
  /** Message to display during initialization */
  message?: string;
}

/**
 * Shimmer animation styles
 */
const shimmerStyles = `
  @keyframes shimmer {
    0% { background-position: -200% 0; }
    100% { background-position: 200% 0; }
  }
  .skeleton-shimmer {
    background: linear-gradient(
      90deg,
      rgba(255, 255, 255, 0.03) 25%,
      rgba(255, 255, 255, 0.08) 50%,
      rgba(255, 255, 255, 0.03) 75%
    );
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
  }
`;

/**
 * Worker initialization skeleton with progress dots
 */
export function WorkerInitSkeleton({ message = 'Initializing Grid Engine...' }: WorkerInitSkeletonProps): ReactNode {
  return (
    <>
      <style>{shimmerStyles}</style>
      <div 
        className="w-full h-full flex flex-col items-center justify-center rounded-xl border border-white/10 bg-[#0a0a0f]"
        role="status"
        aria-label="Initializing grid worker"
        aria-busy="true"
      >
        {/* Animated grid icon */}
        <div className="relative w-16 h-16 mb-6">
          <div className="absolute inset-0 grid grid-cols-2 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded skeleton-shimmer"
                style={{
                  backgroundColor: i % 2 === 0 ? PORCELAIN_COLORS.base : PORCELAIN_COLORS.accent,
                  opacity: 0.3 + (i * 0.15),
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        </div>

        {/* Message */}
        <p className="text-white/70 text-sm font-medium mb-4">{message}</p>

        {/* Progress dots */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: PORCELAIN_COLORS.base,
                animation: 'pulse 1s infinite',
                animationDelay: `${i * 0.2}s`,
              }}
            />
          ))}
        </div>

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.2); }
          }
        `}</style>
      </div>
    </>
  );
}

/**
 * Grid loading skeleton with 6 mock panels
 */
export function GridLoadingSkeleton(): ReactNode {
  return (
    <>
      <style>{shimmerStyles}</style>
      <div 
        className="w-full h-full p-4 bg-[#0a0a0f]"
        role="status"
        aria-label="Loading grid"
        aria-busy="true"
      >
        {/* Grid of 6 mock panels */}
        <div className="grid grid-cols-2 gap-4 h-full">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="rounded-xl border border-white/10 overflow-hidden skeleton-shimmer"
              style={{
                backgroundColor: 'rgba(20, 20, 26, 0.8)',
                animationDelay: `${i * 0.1}s`,
              }}
            >
              {/* Mock header */}
              <div 
                className="h-8 px-3 flex items-center gap-2"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}
              >
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: PORCELAIN_COLORS.base }}
                />
                <div className="h-3 w-20 rounded bg-white/10" />
              </div>
              {/* Mock content */}
              <div className="p-3 space-y-2">
                <div className="h-4 w-3/4 rounded bg-white/5" />
                <div className="h-4 w-1/2 rounded bg-white/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

/** Props for PanelSkeleton component */
interface PanelSkeletonProps {
  /** Hub type for color theming */
  hub?: HubType;
  /** Panel title */
  title?: string;
  /** Skeleton variant for different loading states */
  variant?: SkeletonVariant;
}

/**
 * PanelSkeleton - Loading state placeholder with variant support
 */
export function PanelSkeleton({ 
  hub = 'SATOR', 
  title = 'Loading...',
  variant = 'panel-loading'
}: PanelSkeletonProps): ReactNode {
  // Handle special variants
  if (variant === 'worker-init') {
    return <WorkerInitSkeleton message={title} />;
  }
  
  if (variant === 'grid-loading') {
    return <GridLoadingSkeleton />;
  }

  // Default: panel-loading
  const hubColor = HUB_COLORS[hub] || colors.hub.sator;
  
  return (
    <>
      <style>{shimmerStyles}</style>
      <div 
        className="w-full h-full flex flex-col rounded-xl border border-white/10 overflow-hidden bg-[#14141a]"
        role="status"
        aria-label="Loading panel content"
        aria-busy="true"
      >
        {/* Skeleton Header */}
        <div 
          className="flex items-center justify-between px-3 py-2.5"
          style={{ 
            backgroundColor: `${hubColor}08`,
            borderBottom: `1px solid ${hubColor}20`
          }}
        >
          <div className="flex items-center gap-2">
            {/* Hub indicator dot */}
            <div 
              className="w-2 h-2 rounded-full skeleton-shimmer"
              style={{ backgroundColor: hubColor }}
            />
            {/* Title placeholder */}
            <div 
              className="h-4 w-24 rounded skeleton-shimmer"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            />
          </div>
          
          {/* Window controls placeholder */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((i) => (
              <div 
                key={i}
                className="w-6 h-6 rounded skeleton-shimmer"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
              />
            ))}
          </div>
        </div>
        
        {/* Skeleton Content */}
        <div className="flex-1 p-4 space-y-3">
          {/* Content blocks */}
          <div 
            className="h-8 w-3/4 rounded skeleton-shimmer"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
          />
          <div 
            className="h-4 w-full rounded skeleton-shimmer"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          />
          <div 
            className="h-4 w-5/6 rounded skeleton-shimmer"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)' }}
          />
          
          {/* Chart/graph placeholder */}
          <div className="pt-4 space-y-2">
            <div className="flex items-end gap-2 h-20">
              {[40, 70, 50, 90, 60, 80, 45].map((height, i) => (
                <div 
                  key={i}
                  className="flex-1 rounded-t skeleton-shimmer"
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: `${hubColor}30`
                  }}
                />
              ))}
            </div>
          </div>
          
          {/* Stats row placeholder */}
          <div className="flex gap-4 pt-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-1">
                <div 
                  className="h-3 w-12 rounded mb-1 skeleton-shimmer"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
                />
                <div 
                  className="h-6 w-16 rounded skeleton-shimmer"
                  style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                />
              </div>
            ))}
          </div>
        </div>
        
        {/* Hidden text for screen readers */}
        <span className="sr-only">Loading {title} panel content</span>
      </div>
    </>
  );
}

/** Props for PanelSkeletonCompact component */
interface PanelSkeletonCompactProps {
  /** Hub type for color theming */
  hub?: HubType;
}

/**
 * Compact skeleton for minimized panels
 */
export function PanelSkeletonCompact({ hub = 'SATOR' }: PanelSkeletonCompactProps): ReactNode {
  const hubColor = HUB_COLORS[hub] || colors.hub.sator;
  
  return (
    <>
      <style>{shimmerStyles}</style>
      <div 
        className="w-full h-full flex flex-col rounded-xl border border-white/10 overflow-hidden bg-[#14141a]"
        role="status"
        aria-label="Loading panel"
        aria-busy="true"
      >
        <div 
          className="flex items-center justify-between px-3 py-2"
          style={{ 
            backgroundColor: `${hubColor}10`,
            borderBottom: `1px solid ${hubColor}30`
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full skeleton-shimmer"
              style={{ backgroundColor: hubColor }}
            />
            <div 
              className="h-3 w-20 rounded skeleton-shimmer"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}
            />
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * Hub loader skeleton for route transitions
 */
export function HubLoader(): ReactNode {
  return (
    <>
      <style>{shimmerStyles}</style>
      <div 
        className="w-full h-full flex items-center justify-center bg-[#0a0a0f]"
        role="status"
        aria-label="Loading hub"
        aria-busy="true"
      >
        <div className="text-center space-y-4">
          {/* Animated spinner */}
          <div className="relative w-12 h-12 mx-auto">
            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
            <div 
              className="absolute inset-0 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: `${colors.hub.sator} transparent transparent transparent` }}
            />
          </div>
          <p className="text-white/50 text-sm">Loading hub...</p>
        </div>
      </div>
    </>
  );
}

export default PanelSkeleton;
