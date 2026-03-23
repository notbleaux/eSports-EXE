/**
 * Clip Timeline Selector
 * Timeline scrubber with thumbnails for clip selection
 * [Ver001.000]
 */

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { cn } from '../../lib/utils';
import { EXPORT_LIMITS } from '../../lib/export/types';
import { Play, Pause, Scissors, Volume2, VolumeX } from 'lucide-react';

export interface ClipSelectorProps {
  /** Total duration in seconds */
  duration: number;
  /** Current playback time */
  currentTime?: number;
  /** Called when clip is confirmed */
  onClipSelect: (startTime: number, endTime: number) => void;
  /** Called when preview is requested */
  onPreview?: (startTime: number, endTime: number) => void;
  /** Optional thumbnail frames */
  thumbnails?: string[];
  /** Class name */
  className?: string;
  /** Whether audio is available */
  hasAudio?: boolean;
}

/** Format seconds to MM:SS.ms */
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
}

/** Clip marker type */
type MarkerType = 'start' | 'end' | null;

export function ClipSelector({
  duration,
  currentTime = 0,
  onClipSelect,
  onPreview,
  thumbnails,
  className,
  hasAudio = false,
}: ClipSelectorProps) {
  // State
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(Math.min(10, duration));
  const [dragging, setDragging] = useState<MarkerType>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [includeAudio, setIncludeAudio] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [previewTime, setPreviewTime] = useState(currentTime);

  const timelineRef = useRef<HTMLDivElement>(null);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Validation
  const clipDuration = endTime - startTime;
  const isValidDuration =
    clipDuration >= EXPORT_LIMITS.CLIP_MIN_DURATION &&
    clipDuration <= EXPORT_LIMITS.CLIP_MAX_DURATION;

  const validationError = useMemo(() => {
    if (clipDuration < EXPORT_LIMITS.CLIP_MIN_DURATION) {
      return `Clip must be at least ${EXPORT_LIMITS.CLIP_MIN_DURATION}s`;
    }
    if (clipDuration > EXPORT_LIMITS.CLIP_MAX_DURATION) {
      return `Clip cannot exceed ${EXPORT_LIMITS.CLIP_MAX_DURATION}s`;
    }
    return null;
  }, [clipDuration]);

  // Time to position percentage
  const timeToPercent = useCallback(
    (time: number) => (time / duration) * 100,
    [duration]
  );

  // Position to time
  const percentToTime = useCallback(
    (percent: number) => (percent / 100) * duration,
    [duration]
  );

  // Handle timeline click
  const handleTimelineClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!timelineRef.current || dragging) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const time = percentToTime(percent);

      // Set start or end based on which is closer
      const startDist = Math.abs(time - startTime);
      const endDist = Math.abs(time - endTime);

      if (startDist < endDist) {
        setStartTime(Math.min(time, endTime - EXPORT_LIMITS.CLIP_MIN_DURATION));
      } else {
        setEndTime(Math.max(time, startTime + EXPORT_LIMITS.CLIP_MIN_DURATION));
      }
    },
    [dragging, duration, endTime, percentToTime, startTime]
  );

  // Handle marker drag
  const handleMarkerMouseDown = useCallback((type: 'start' | 'end') => {
    setDragging(type);
  }, []);

  // Global mouse move/up handlers
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragging || !timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const percent = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      const time = Math.max(0, Math.min(duration, percentToTime(percent)));

      if (dragging === 'start') {
        setStartTime(Math.min(time, endTime - EXPORT_LIMITS.CLIP_MIN_DURATION));
      } else {
        setEndTime(Math.max(time, startTime + EXPORT_LIMITS.CLIP_MIN_DURATION));
      }
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, duration, endTime, percentToTime, startTime]);

  // Preview playback
  useEffect(() => {
    if (isPlaying) {
      playIntervalRef.current = setInterval(() => {
        setPreviewTime((prev) => {
          if (prev >= endTime) {
            setIsPlaying(false);
            return startTime;
          }
          return prev + 0.033; // ~30fps
        });
      }, 33);
    } else {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    }

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current);
      }
    };
  }, [isPlaying, endTime, startTime]);

  const handlePreview = useCallback(() => {
    onPreview?.(startTime, endTime);
    setPreviewTime(startTime);
    setIsPlaying(!isPlaying);
  }, [endTime, isPlaying, onPreview, startTime]);

  const handleConfirm = useCallback(() => {
    if (isValidDuration) {
      onClipSelect(startTime, endTime);
    }
  }, [endTime, isValidDuration, onClipSelect, startTime]);

  // Thumbnail strip
  const thumbnailElements = useMemo(() => {
    if (!thumbnails || thumbnails.length === 0) return null;

    return (
      <div className="absolute inset-0 flex">
        {thumbnails.map((thumb, i) => (
          <div
            key={i}
            className="flex-1 h-full bg-cover bg-center"
            style={{ backgroundImage: `url(${thumb})` }}
          />
        ))}
      </div>
    );
  }, [thumbnails]);

  return (
    <div className={cn('space-y-4', className)}>
      {/* Timeline container */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm text-slate-400">
          <span>Start: {formatTime(startTime)}</span>
          <span
            className={cn(
              'font-mono',
              isValidDuration ? 'text-emerald-400' : 'text-rose-400'
            )}
          >
            Duration: {formatTime(clipDuration)}
          </span>
          <span>End: {formatTime(endTime)}</span>
        </div>

        {/* Timeline */}
        <div
          ref={timelineRef}
          className="relative h-16 bg-slate-900 rounded-lg overflow-hidden cursor-pointer"
          onClick={handleTimelineClick}
          onMouseMove={(e) => {
            if (!timelineRef.current) return;
            const rect = timelineRef.current.getBoundingClientRect();
            const percent = ((e.clientX - rect.left) / rect.width) * 100;
            setHoverTime(percentToTime(percent));
          }}
          onMouseLeave={() => setHoverTime(null)}
        >
          {/* Thumbnails */}
          {thumbnailElements}

          {/* Time markers */}
          <div className="absolute inset-0 flex items-end pb-1 px-2 text-xs text-slate-500 pointer-events-none">
            {[0, 0.25, 0.5, 0.75, 1].map((pos) => (
              <div
                key={pos}
                className="absolute"
                style={{ left: `${pos * 100}%`, transform: 'translateX(-50%)' }}
              >
                {formatTime(pos * duration)}
              </div>
            ))}
          </div>

          {/* Selected range */}
          <div
            className="absolute top-0 bottom-0 bg-indigo-500/30 border-x-2 border-indigo-400"
            style={{
              left: `${timeToPercent(startTime)}%`,
              width: `${timeToPercent(endTime - startTime)}%`,
            }}
          />

          {/* Start marker */}
          <div
            className="absolute top-0 bottom-0 w-1 cursor-ew-resize group"
            style={{ left: `${timeToPercent(startTime)}%` }}
            onMouseDown={() => handleMarkerMouseDown('start')}
          >
            <div className="absolute top-0 bottom-0 w-4 -ml-2 flex items-center justify-center">
              <div className="w-3 h-full bg-emerald-500 rounded shadow-lg group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-emerald-500 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
              Start
            </div>
          </div>

          {/* End marker */}
          <div
            className="absolute top-0 bottom-0 w-1 cursor-ew-resize group"
            style={{ left: `${timeToPercent(endTime)}%` }}
            onMouseDown={() => handleMarkerMouseDown('end')}
          >
            <div className="absolute top-0 bottom-0 w-4 -ml-2 flex items-center justify-center">
              <div className="w-3 h-full bg-rose-500 rounded shadow-lg group-hover:scale-110 transition-transform" />
            </div>
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-rose-500 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity">
              End
            </div>
          </div>

          {/* Hover indicator */}
          {hoverTime !== null && (
            <div
              className="absolute top-0 bottom-0 w-px bg-white/50 pointer-events-none"
              style={{ left: `${timeToPercent(hoverTime)}%` }}
            >
              <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 bg-slate-800 text-white text-xs rounded">
                {formatTime(hoverTime)}
              </div>
            </div>
          )}

          {/* Preview time indicator */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-amber-400 pointer-events-none"
            style={{ left: `${timeToPercent(previewTime)}%` }}
          />
        </div>

        {/* Validation error */}
        {validationError && (
          <p className="text-xs text-rose-400">{validationError}</p>
        )}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4">
        {/* Preview button */}
        <button
          onClick={handlePreview}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors"
        >
          {isPlaying ? (
            <>
              <Pause className="w-4 h-4" />
              Stop Preview
            </>
          ) : (
            <>
              <Play className="w-4 h-4" />
              Preview
            </>
          )}
        </button>

        {/* Audio toggle */}
        {hasAudio && (
          <button
            onClick={() => setIncludeAudio(!includeAudio)}
            className={cn(
              'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
              includeAudio
                ? 'bg-indigo-500/20 text-indigo-400'
                : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
            )}
          >
            {includeAudio ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
            Audio
          </button>
        )}

        {/* Confirm button */}
        <button
          onClick={handleConfirm}
          disabled={!isValidDuration}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ml-auto',
            isValidDuration
              ? 'bg-indigo-500 hover:bg-indigo-600 text-white'
              : 'bg-slate-700 text-slate-500 cursor-not-allowed'
          )}
        >
          <Scissors className="w-4 h-4" />
          Create Clip
        </button>
      </div>
    </div>
  );
}

export default ClipSelector;
