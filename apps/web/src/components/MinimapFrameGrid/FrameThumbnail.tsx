/**
 * FrameThumbnail Component
 *
 * Individual frame display with image, timestamp overlay,
 * segment type badge, and verification status.
 * Supports admin pinning interactions (MF-9).
 *
 * Tasks: MF-5, MF-9
 *
 * [Ver002.000] - Phase 2: Pinning support for admin users (MF-9)
 * [Ver001.000] - Initial component implementation (MF-5)
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageOff } from 'lucide-react';
import { cn } from '@/utils/cn';
import { colors } from '@/theme/colors';
import { SegmentTypeBadge } from './SegmentTypeBadge';
import { VerificationBadge } from './VerificationBadge';
import type { FrameThumbnailProps } from './types';

/**
 * Format milliseconds to HH:MM:SS.mmm display
 */
function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = Math.floor((ms % 1000));

  const pad = (n: number, digits: number = 2) => n.toString().padStart(digits, '0');

  if (hours > 0) {
    return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
  }
  return `${pad(minutes)}:${pad(seconds)}.${pad(milliseconds, 3)}`;
}

/**
 * FrameThumbnail - Displays a single frame with metadata
 *
 * @example
 * ```tsx
 * <FrameThumbnail frame={frameData} onClick={() => handleClick(frameData)} />
 * ```
 */
export const FrameThumbnail: React.FC<FrameThumbnailProps> = ({
  frame,
  onClick,
  onPinToggle,
  isAdmin = false,
  isPinning = false,
  className,
}) => {
  const [imageError, setImageError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        'relative group rounded-lg overflow-hidden',
        'bg-white/[0.03] border border-white/[0.08]',
        'transition-all duration-200',
        onClick && 'cursor-pointer hover:border-white/20 hover:shadow-lg',
        className
      )}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={`Frame at ${formatTimestamp(frame.timestampMs)}, ${frame.segmentType}`}
    >
      {/* Image Container */}
      <div className="relative aspect-video bg-gray-900">
        {/* Loading State */}
        {isLoading && !imageError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          </div>
        )}

        {/* Image */}
        {!imageError && (
          <img
            src={frame.storageUrl}
            alt={`Frame ${frame.frameIndex}`}
            className={cn(
              'w-full h-full object-cover transition-opacity duration-200',
              isLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setIsLoading(false);
              setImageError(true);
            }}
            loading="lazy"
          />
        )}

        {/* Error State */}
        {imageError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white/40">
            <ImageOff className="w-8 h-8 mb-2" />
            <span className="text-xs">Failed to load</span>
          </div>
        )}

        {/* Timestamp Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
          <span className="text-xs font-mono text-white/90 tabular-nums">
            {formatTimestamp(frame.timestampMs)}
          </span>
        </div>

        {/* Verification Badge - Top Right */}
        <div className="absolute top-2 right-2">
          <VerificationBadge
            frameId={frame.frameId}
            isPinned={frame.isPinned}
            pinnedAt={frame.pinnedAt}
            pinnedBy={frame.pinnedBy}
            onPinToggle={onPinToggle}
            isAdmin={isAdmin}
            isLoading={isPinning}
          />
        </div>
      </div>

      {/* Metadata Footer */}
      <div className="p-2 flex items-center justify-between gap-2 bg-white/[0.02]">
        <SegmentTypeBadge type={frame.segmentType} />
        <span
          className="text-xs tabular-nums"
          style={{ color: colors.text.muted }}
        >
          #{frame.frameIndex.toString().padStart(4, '0')}
        </span>
      </div>

      {/* Hover Overlay Effect */}
      {onClick && (
        <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
      )}
    </motion.div>
  );
};

export default FrameThumbnail;
