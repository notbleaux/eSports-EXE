/**
 * SegmentTypeBadge Component
 *
 * Displays a colored badge indicating the segment classification
 * of a VOD frame (IN_ROUND, BUY_PHASE, etc.).
 *
 * [Ver001.000]
 */

import React from 'react';
import { cn } from '@/utils/cn';
import type { SegmentTypeBadgeProps, SegmentType, SegmentTypeMeta } from './types';

/**
 * Segment type metadata with colors and labels
 */
const SEGMENT_TYPE_META: Record<SegmentType, SegmentTypeMeta> = {
  IN_ROUND: {
    label: 'In Round',
    colors: {
      bg: 'bg-red-500/20',
      text: 'text-red-400',
      border: 'border-red-500/30',
    },
  },
  BUY_PHASE: {
    label: 'Buy Phase',
    colors: {
      bg: 'bg-green-500/20',
      text: 'text-green-400',
      border: 'border-green-500/30',
    },
  },
  HALFTIME: {
    label: 'Halftime',
    colors: {
      bg: 'bg-blue-500/20',
      text: 'text-blue-400',
      border: 'border-blue-500/30',
    },
  },
  BETWEEN_ROUND: {
    label: 'Between Round',
    colors: {
      bg: 'bg-gray-500/20',
      text: 'text-gray-400',
      border: 'border-gray-500/30',
    },
  },
  UNKNOWN: {
    label: 'Unknown',
    colors: {
      bg: 'bg-slate-500/20',
      text: 'text-slate-400',
      border: 'border-slate-500/30',
    },
  },
};

/**
 * SegmentTypeBadge - Displays a badge for segment classification
 *
 * @example
 * ```tsx
 * <SegmentTypeBadge type="IN_ROUND" />
 * <SegmentTypeBadge type="BUY_PHASE" className="text-sm" />
 * ```
 */
export const SegmentTypeBadge: React.FC<SegmentTypeBadgeProps> = ({
  type,
  className,
}) => {
  const meta = SEGMENT_TYPE_META[type];

  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium',
        'border backdrop-blur-sm',
        meta.colors.bg,
        meta.colors.text,
        meta.colors.border,
        className
      )}
      aria-label={`Segment type: ${meta.label}`}
    >
      {meta.label}
    </span>
  );
};

export default SegmentTypeBadge;
