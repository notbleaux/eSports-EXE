/** [Ver002.000] */
/**
 * Timeline Scrubber Component
 * ===========================
 * Interactive timeline bar with drag-to-scrub, preview, and markers.
 * Optimized for <100ms response time during scrubbing.
 */

import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { 
  useTimelineStore, 
  useCurrentTime, 
  useDuration, 
  useProgress,
  useChapters,
  useActiveChapter,
  formatTime,
  type TimelineChapter,
  type ZoomLevel,
} from '@/lib/replay/timeline/state';
import { useBookmarkStore, useFilteredBookmarks, CATEGORY_COLORS, type Bookmark } from '@/lib/replay/bookmarks';
import { useSmoothScrub } from '@/lib/replay/timeline/performance';

// ============================================================================
// Utility
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Types
// ============================================================================

export interface TimelineScrubberProps {
  className?: string;
  showRounds?: boolean;
  showBookmarks?: boolean;
  showPreview?: boolean;
  height?: 'sm' | 'md' | 'lg';
  onSeek?: (time: number) => void;
}

export interface TimelineMarkerProps {
  position: number;
  color: string;
  label?: string;
  icon?: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

// ============================================================================
// Marker Component
// ============================================================================

const TimelineMarker: React.FC<TimelineMarkerProps> = ({
  position,
  color,
  label,
  icon,
  isActive,
  onClick,
  className,
}) => {
  return (
    <div
      className={cn(
        'absolute top-0 transform -translate-x-1/2 cursor-pointer',
        'transition-all duration-150 ease-out',
        isActive && 'scale-125 z-20',
        className
      )}
      style={{ left: `${position}%` }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      title={label}
    >
      <div
        className={cn(
          'w-3 h-3 rounded-full border-2 border-white shadow-md',
          'hover:scale-110 transition-transform'
        )}
        style={{ backgroundColor: color }}
      />
      {icon && (
        <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-xs">
          {icon}
        </span>
      )}
    </div>
  );
};

// ============================================================================
// Preview Tooltip
// ============================================================================

interface PreviewTooltipProps {
  time: number;
  position: number;
  visible: boolean;
  thumbnailUrl?: string;
  label?: string;
}

const PreviewTooltip: React.FC<PreviewTooltipProps> = ({
  time,
  position,
  visible,
  thumbnailUrl,
  label,
}) => {
  if (!visible) return null;

  return (
    <div
      className={cn(
        'absolute bottom-full mb-2 transform -translate-x-1/2',
        'bg-slate-900 border border-slate-700 rounded-lg shadow-xl',
        'px-3 py-2 pointer-events-none z-50',
        'transition-opacity duration-100',
        visible ? 'opacity-100' : 'opacity-0'
      )}
      style={{ left: `${position}%` }}
    >
      {thumbnailUrl && (
        <div className="w-32 h-20 bg-slate-800 rounded mb-2 overflow-hidden">
          <img 
            src={thumbnailUrl} 
            alt="Preview" 
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className="text-xs font-mono text-slate-300">
        {formatTime(time)}
      </div>
      {label && (
        <div className="text-xs text-slate-400 mt-1 truncate max-w-32">
          {label}
        </div>
      )}
      <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
        <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
};

// ============================================================================
// Chapter Bar
// ============================================================================

interface ChapterBarProps {
  chapters: TimelineChapter[];
  duration: number;
  currentTime: number;
  onChapterClick: (chapter: TimelineChapter) => void;
}

const ChapterBar: React.FC<ChapterBarProps> = ({
  chapters,
  duration,
  currentTime,
  onChapterClick,
}) => {
  if (chapters.length === 0) return null;

  return (
    <div className="absolute top-0 left-0 right-0 h-1.5 flex">
      {chapters.map((chapter) => {
        const startPercent = (chapter.startTime / duration) * 100;
        const endPercent = (chapter.endTime / duration) * 100;
        const width = endPercent - startPercent;
        const isActive = currentTime >= chapter.startTime && currentTime <= chapter.endTime;

        return (
          <div
            key={chapter.id}
            className={cn(
              'h-full cursor-pointer transition-all hover:brightness-110',
              isActive && 'ring-1 ring-white'
            )}
            style={{
              left: `${startPercent}%`,
              width: `${width}%`,
              backgroundColor: chapter.color || '#636e72',
              marginLeft: `${startPercent}%`,
            }}
            onClick={(e) => {
              e.stopPropagation();
              onChapterClick(chapter);
            }}
            title={chapter.label}
          />
        );
      })}
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const TimelineScrubber: React.FC<TimelineScrubberProps> = ({
  className,
  showRounds = true,
  showBookmarks = true,
  showPreview = true,
  height = 'md',
  onSeek,
}) => {
  // Store state
  const store = useTimelineStore();
  const currentTime = useCurrentTime();
  const duration = useDuration();
  const progress = useProgress();
  const chapters = useChapters();
  const activeChapter = useActiveChapter();
  
  // Bookmark state
  const bookmarks = useFilteredBookmarks();
  const jumpToBookmark = useBookmarkStore(state => state.jumpToBookmark);
  
  // Local UI state
  const [isHovered, setIsHovered] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewPosition, setPreviewPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Height classes
  const heightClasses = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  };

  // Handle scrub
  const handleScrub = useCallback((progressValue: number) => {
    const time = progressValue * duration;
    store.seek(time);
    onSeek?.(time);
  }, [duration, store, onSeek]);

  // Smooth scrub hook
  const { containerRef, handlers } = useSmoothScrub({
    onScrub: handleScrub,
    onScrubStart: () => setIsDragging(true),
    onScrubEnd: () => setIsDragging(false),
    throttleMs: 16,
    smoothingFactor: 0.5,
  });

  // Merge refs
  const mergedRef = useCallback((node: HTMLDivElement | null) => {
    (containerRef as React.MutableRefObject<HTMLElement | null>).current = node;
    (trackRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  }, [containerRef]);

  // Handle mouse move for preview
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current || !showPreview) return;
    
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const progressValue = Math.max(0, Math.min(1, x / rect.width));
    
    setPreviewPosition(progressValue * 100);
    setPreviewTime(progressValue * duration);
  }, [duration, showPreview]);

  // Handle chapter click
  const handleChapterClick = useCallback((chapter: TimelineChapter) => {
    store.jumpToChapter(chapter.id);
    onSeek?.(chapter.startTime);
  }, [store, onSeek]);

  // Handle bookmark click
  const handleBookmarkClick = useCallback((bookmark: Bookmark) => {
    jumpToBookmark(bookmark.id);
    store.seek(bookmark.timestamp);
    onSeek?.(bookmark.timestamp);
  }, [jumpToBookmark, store, onSeek]);

  // Format current time display based on zoom
  const timeDisplay = useMemo(() => {
    const showMs = store.zoomLevel === 'moment';
    return formatTime(currentTime, showMs);
  }, [currentTime, store.zoomLevel]);

  // Group bookmarks by proximity for clustering
  const visibleBookmarks = useMemo(() => {
    if (!showBookmarks) return [];
    
    // Simple clustering - group bookmarks within 5 seconds
    const clusterThreshold = 5000;
    const sorted = [...bookmarks].sort((a, b) => a.timestamp - b.timestamp);
    const clusters: Bookmark[][] = [];
    
    sorted.forEach(bookmark => {
      const lastCluster = clusters[clusters.length - 1];
      if (lastCluster && bookmark.timestamp - lastCluster[lastCluster.length - 1].timestamp < clusterThreshold) {
        lastCluster.push(bookmark);
      } else {
        clusters.push([bookmark]);
      }
    });
    
    return clusters.map(cluster => ({
      ...cluster[0],
      _clusterCount: cluster.length,
      _clusterItems: cluster,
    }));
  }, [bookmarks, showBookmarks]);

  return (
    <div className={cn('w-full', className)}>
      {/* Time Display */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-3">
          <span className="font-mono text-lg font-bold text-cyan-400">
            {timeDisplay}
          </span>
          <span className="text-slate-500">/</span>
          <span className="font-mono text-sm text-slate-400">
            {formatTime(duration)}
          </span>
          {activeChapter && (
            <span className="px-2 py-0.5 bg-slate-800 rounded text-xs text-slate-300">
              {activeChapter.label}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">
            {Math.round(progress * 100)}%
          </span>
          <ZoomIndicator level={store.zoomLevel} />
        </div>
      </div>

      {/* Timeline Track */}
      <div
        ref={mergedRef}
        className={cn(
          'relative bg-slate-800 rounded-lg cursor-pointer select-none',
          'transition-all duration-200',
          heightClasses[height],
          isDragging && 'cursor-grabbing'
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onMouseMove={handleMouseMove}
        {...handlers}
      >
        {/* Background */}
        <div className="absolute inset-0 rounded-lg overflow-hidden">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800 opacity-50" />
          
          {/* Chapter bars */}
          {showRounds && (
            <ChapterBar
              chapters={chapters}
              duration={duration}
              currentTime={currentTime}
              onChapterClick={handleChapterClick}
            />
          )}
        </div>

        {/* Progress fill */}
        <div
          className="absolute left-0 top-0 bottom-0 bg-cyan-500/30 rounded-l-lg transition-all duration-75"
          style={{ width: `${progress * 100}%` }}
        />

        {/* Buffer indicator (if applicable) */}
        <div className="absolute right-0 top-0 bottom-0 w-1 bg-slate-600/50 rounded-r-lg" />

        {/* Bookmark markers */}
        {visibleBookmarks.map((bookmark) => {
          const position = (bookmark.timestamp / duration) * 100;
          const isCluster = (bookmark as unknown as { _clusterCount?: number })._clusterCount > 1;
          const clusterCount = (bookmark as unknown as { _clusterCount: number })._clusterCount;

          return (
            <TimelineMarker
              key={bookmark.id}
              position={position}
              color={bookmark.color || CATEGORY_COLORS[bookmark.category]}
              label={`${bookmark.label}${isCluster ? ` (+${clusterCount - 1})` : ''}`}
              icon={isCluster ? '🔖' : undefined}
              onClick={() => handleBookmarkClick(bookmark)}
            />
          );
        })}

        {/* Chapter dividers */}
        {showRounds && chapters.map((chapter, index) => {
          if (index === 0) return null;
          const position = (chapter.startTime / duration) * 100;
          
          return (
            <div
              key={`divider-${chapter.id}`}
              className="absolute top-0 bottom-0 w-px bg-slate-600/50"
              style={{ left: `${position}%` }}
            />
          );
        })}

        {/* Playhead */}
        <div
          className={cn(
            'absolute top-0 bottom-0 w-0.5 bg-white shadow-lg z-10',
            'transform -translate-x-1/2 transition-all duration-75',
            isDragging && 'w-1 bg-cyan-400'
          )}
          style={{ left: `${progress * 100}%` }}
        >
          {/* Playhead handle */}
          <div
            className={cn(
              'absolute -top-1 left-1/2 transform -translate-x-1/2',
              'w-4 h-4 bg-white rounded-full shadow-md',
              'transition-transform duration-150',
              (isHovered || isDragging) && 'scale-125'
            )}
          />
        </div>

        {/* Preview tooltip */}
        {showPreview && isHovered && !isDragging && (
          <PreviewTooltip
            time={previewTime}
            position={previewPosition}
            visible={isHovered}
            label={chapters.find(ch => previewTime >= ch.startTime && previewTime <= ch.endTime)?.label}
          />
        )}

        {/* Hover indicator line */}
        {isHovered && !isDragging && (
          <div
            className="absolute top-0 bottom-0 w-px bg-white/30 pointer-events-none"
            style={{ left: `${previewPosition}%` }}
          />
        )}
      </div>

      {/* Zoom level indicator bar */}
      <div className="flex mt-2 gap-1">
        {(['match', 'round', 'moment'] as ZoomLevel[]).map((level) => (
          <button
            key={level}
            onClick={() => store.setZoomLevel(level)}
            className={cn(
              'px-2 py-0.5 text-xs rounded capitalize transition-colors',
              store.zoomLevel === level
                ? 'bg-cyan-500/20 text-cyan-400'
                : 'bg-slate-800 text-slate-500 hover:text-slate-300'
            )}
          >
            {level}
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Zoom Indicator
// ============================================================================

interface ZoomIndicatorProps {
  level: ZoomLevel;
}

const ZoomIndicator: React.FC<ZoomIndicatorProps> = ({ level }) => {
  const icons: Record<ZoomLevel, string> = {
    match: '🔍−',
    round: '🔍',
    moment: '🔍+',
  };

  return (
    <span 
      className="text-xs text-slate-500"
      title={`Zoom: ${level}`}
    >
      {icons[level]}
    </span>
  );
};

// ============================================================================
// Mini Timeline (Compact version)
// ============================================================================

export interface MiniTimelineProps {
  className?: string;
  currentTime: number;
  duration: number;
  bookmarks?: Bookmark[];
  onSeek: (time: number) => void;
}

export const MiniTimeline: React.FC<MiniTimelineProps> = ({
  className,
  currentTime,
  duration,
  bookmarks = [],
  onSeek,
}) => {
  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const progress = (e.clientX - rect.left) / rect.width;
    onSeek(progress * duration);
  }, [duration, onSeek]);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={cn(
        'h-2 bg-slate-800 rounded-full cursor-pointer relative overflow-hidden',
        className
      )}
      onClick={handleClick}
    >
      {/* Progress fill */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-cyan-500/50 rounded-full"
        style={{ width: `${progress}%` }}
      />

      {/* Bookmark ticks */}
      {bookmarks.map((bookmark) => {
        const position = (bookmark.timestamp / duration) * 100;
        return (
          <div
            key={bookmark.id}
            className="absolute top-0 bottom-0 w-0.5 bg-white/50"
            style={{ left: `${position}%` }}
          />
        );
      })}

      {/* Playhead */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white"
        style={{ left: `${progress}%` }}
      />
    </div>
  );
};

export default TimelineScrubber;
