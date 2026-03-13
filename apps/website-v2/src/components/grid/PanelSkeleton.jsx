/**
 * PanelSkeleton - Loading placeholder for grid panels
 * Provides visual feedback while panel content loads
 * 
 * [Ver001.000]
 */
import { colors } from '@/theme/colors';

const HUB_COLORS = {
  SATOR: colors.hub.sator,
  ROTAS: colors.hub.rotas,
  AREPO: colors.hub.arepo,
  OPERA: colors.hub.opera,
  TENET: colors.hub.tenet,
};

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
 * PanelSkeleton - Loading state placeholder
 * @param {Object} props
 * @param {string} [props.hub='SATOR'] - Hub type for color theming
 * @param {string} [props.title='Loading...'] - Panel title
 */
export function PanelSkeleton({ hub = 'SATOR', title = 'Loading...' }) {
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
            backgroundColor: `${hubColor.base}08`,
            borderBottom: `1px solid ${hubColor.base}20`
          }}
        >
          <div className="flex items-center gap-2">
            {/* Hub indicator dot */}
            <div 
              className="w-2 h-2 rounded-full skeleton-shimmer"
              style={{ backgroundColor: hubColor.base }}
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
                    backgroundColor: `${hubColor.base}30`
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

/**
 * Compact skeleton for minimized panels
 */
export function PanelSkeletonCompact({ hub = 'SATOR' }) {
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
            backgroundColor: `${hubColor.base}10`,
            borderBottom: `1px solid ${hubColor.base}30`
          }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full skeleton-shimmer"
              style={{ backgroundColor: hubColor.base }}
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
export function HubLoader() {
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
              style={{ borderColor: `${colors.hub.sator.base} transparent transparent transparent` }}
            />
          </div>
          <p className="text-white/50 text-sm">Loading hub...</p>
        </div>
      </div>
    </>
  );
}

export default PanelSkeleton;
