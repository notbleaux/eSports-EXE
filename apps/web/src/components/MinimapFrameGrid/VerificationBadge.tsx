/**
 * VerificationBadge Component
 *
 * Displays a verification status indicator for frames.
 * Shows checkmark for pinned frames with tooltip details.
 * Supports admin pinning/unpinning interactions (MF-9).
 *
 * Tasks: MF-5, MF-9 - Initial component + Pinning integration
 *
 * [Ver002.000] - Phase 2: Pinning support for admin users (MF-9)
 * [Ver001.000] - Initial component implementation (MF-5)
 */

import React, { useState } from 'react';
import { CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/utils/cn';

/**
 * Props for VerificationBadge component
 */
export interface VerificationBadgeProps {
  /** Unique frame identifier */
  frameId: string;
  /** Whether the frame is pinned */
  isPinned: boolean;
  /** ISO timestamp when frame was pinned */
  pinnedAt?: string;
  /** User who pinned the frame */
  pinnedBy?: string;
  /** Callback when pin is toggled (admin only) */
  onPinToggle?: (frameId: string, pin: boolean) => Promise<void>;
  /** Whether current user has admin privileges */
  isAdmin?: boolean;
  /** Whether a pin operation is in progress */
  isLoading?: boolean;
  /** Optional CSS class name */
  className?: string;
}

/**
 * Format a timestamp for display in the tooltip
 */
function formatPinnedAt(dateString?: string): string {
  if (!dateString) return 'Unknown';

  try {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return 'Invalid date';
  }
}

/**
 * VerificationBadge - Displays pin status with tooltip and optional pinning action
 *
 * @example
 * ```tsx
 * // Read-only display
 * <VerificationBadge frameId="abc" isPinned={true} pinnedAt="2026-03-28T10:00:00Z" pinnedBy="admin" />
 *
 * // Admin with pinning capability
 * <VerificationBadge
 *   frameId="abc"
 *   isPinned={false}
 *   isAdmin={true}
 *   onPinToggle={handlePinToggle}
 * />
 * ```
 */
export const VerificationBadge: React.FC<VerificationBadgeProps> = ({
  frameId,
  isPinned,
  pinnedAt,
  pinnedBy,
  onPinToggle,
  isAdmin = false,
  isLoading = false,
  className,
}) => {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);

  const handleClick = async () => {
    if (!isAdmin || !onPinToggle || isLoading) return;
    await onPinToggle(frameId, !isPinned);
  };

  // Determine if this is an interactive element
  const isInteractive = isAdmin && onPinToggle && !isLoading;

  // Base button classes
  const baseClasses = cn(
    'inline-flex items-center justify-center',
    'w-6 h-6 rounded-full',
    'transition-all duration-200',
    isInteractive && 'cursor-pointer hover:scale-110',
    !isInteractive && 'cursor-default',
    isLoading && 'cursor-wait'
  );

  // Pinned state styling
  const pinnedClasses = cn(
    'bg-green-500/20 text-green-400',
    'border border-green-500/30',
    isInteractive && 'hover:bg-green-500/30 hover:border-green-500/50'
  );

  // Unpinned state styling
  const unpinnedClasses = cn(
    'bg-amber-500/10 text-amber-400/60',
    'border border-amber-500/20',
    isInteractive && 'hover:bg-amber-500/20 hover:border-amber-500/40 hover:text-amber-400'
  );

  if (isPinned) {
    return (
      <div
        className={cn('relative inline-flex', className)}
        onMouseEnter={() => setIsTooltipVisible(true)}
        onMouseLeave={() => setIsTooltipVisible(false)}
        onFocus={() => setIsTooltipVisible(true)}
        onBlur={() => setIsTooltipVisible(false)}
      >
        <button
          type="button"
          onClick={handleClick}
          disabled={!isInteractive}
          className={cn(baseClasses, pinnedClasses)}
          aria-label={isInteractive ? 'Unpin this frame' : 'Frame verified and pinned'}
          aria-pressed={true}
          role="switch"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <CheckCircle2 className="w-4 h-4" />
          )}
        </button>

        {/* Tooltip */}
        {isTooltipVisible && (
          <div
            className={cn(
              'absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2',
              'px-3 py-2 rounded-lg min-w-[180px]',
              'bg-gray-900/95 border border-white/10',
              'backdrop-blur-md shadow-xl',
              'text-xs'
            )}
            role="tooltip"
          >
            <div className="font-medium text-green-400 mb-1">
              Verified & Pinned
              {isInteractive && <span className="text-gray-400 ml-1">(click to unpin)</span>}
            </div>
            {pinnedBy && (
              <div className="text-gray-300">
                By: <span className="text-white">{pinnedBy}</span>
              </div>
            )}
            {pinnedAt && (
              <div className="text-gray-300">
                At: <span className="text-white">{formatPinnedAt(pinnedAt)}</span>
              </div>
            )}
            {/* Arrow */}
            <div
              className={cn(
                'absolute top-full left-1/2 -translate-x-1/2',
                'border-4 border-transparent border-t-gray-900/95'
              )}
            />
          </div>
        )}
      </div>
    );
  }

  // Unpinned state
  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!isInteractive}
      className={cn(baseClasses, unpinnedClasses)}
      aria-label={isInteractive ? 'Pin this frame for verification' : 'Frame pending verification'}
      aria-pressed={false}
      role="switch"
      title={isInteractive ? 'Click to pin this frame' : 'Pending verification'}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Clock className="w-4 h-4" />
      )}
    </button>
  );
};

export default VerificationBadge;
