/** [Ver001.000] */
/**
 * Zoom Controls
 * =============
 * Zoom in/out controls with visual feedback and limits.
 * Range: 25% to 400% (appropriate for tactical map analysis)
 */

import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { GlowButton } from '@/components/ui/GlowButton';
import { GlassCard } from '@/components/ui/GlassCard';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  minZoom: number;
  maxZoom: number;
  className?: string;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  minZoom,
  maxZoom,
  className = '',
}) => {
  const zoomPercent = Math.round(zoom * 100);
  const isMinZoom = zoom <= minZoom;
  const isMaxZoom = zoom >= maxZoom;

  // Calculate zoom level indicator color
  const getZoomColor = (): string => {
    if (zoom <= 0.5) return '#ff9f1c'; // Orange for far zoom
    if (zoom >= 2.0) return '#ff4655'; // Red for close zoom
    return '#00ff88'; // Green for normal range
  };

  return (
    <GlassCard 
      className={`absolute bottom-4 right-4 flex flex-col gap-2 p-2 ${className}`}
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
    >
      {/* Zoom In */}
      <GlowButton
        variant="secondary"
        size="sm"
        onClick={onZoomIn}
        disabled={isMaxZoom}
        title={`Zoom In (+10%)${isMaxZoom ? ' - Max zoom reached' : ''}`}
        className={isMaxZoom ? 'opacity-50 cursor-not-allowed' : ''}
      >
        <ZoomIn className="w-4 h-4" />
      </GlowButton>

      {/* Zoom Level Indicator */}
      <div 
        className="px-2 py-1 rounded text-center font-mono text-sm font-bold"
        style={{ 
          color: getZoomColor(),
          textShadow: `0 0 10px ${getZoomColor()}40`,
        }}
      >
        {zoomPercent}%
      </div>

      {/* Zoom Out */}
      <GlowButton
        variant="secondary"
        size="sm"
        onClick={onZoomOut}
        disabled={isMinZoom}
        title={`Zoom Out (-10%)${isMinZoom ? ' - Min zoom reached' : ''}`}
        className={isMinZoom ? 'opacity-50 cursor-not-allowed' : ''}
      >
        <ZoomOut className="w-4 h-4" />
      </GlowButton>

      {/* Reset */}
      <GlowButton
        variant="ghost"
        size="sm"
        onClick={onZoomReset}
        title="Reset Zoom (100%)"
      >
        <RotateCcw className="w-4 h-4" />
      </GlowButton>

      {/* Zoom Range Indicator */}
      <div className="mt-1 h-1 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-150"
          style={{
            width: `${((zoom - minZoom) / (maxZoom - minZoom)) * 100}%`,
            backgroundColor: getZoomColor(),
          }}
        />
      </div>

      {/* Zoom Limits Display */}
      <div className="flex justify-between text-[10px] text-white/40 font-mono">
        <span>{Math.round(minZoom * 100)}%</span>
        <span>{Math.round(maxZoom * 100)}%</span>
      </div>
    </GlassCard>
  );
};

export default ZoomControls;
