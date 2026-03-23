/**
 * Export Progress Component
 * Progress indicator for ongoing exports
 * [Ver001.000]
 */

import { useEffect, useState } from 'react';
import { cn } from '../../lib/utils';
import type { ExportProgress as ExportProgressType } from '../../lib/export/types';
import { X, Check, AlertCircle, Loader2, Image as ImageIcon, Video } from 'lucide-react';

export interface ExportProgressProps {
  /** Export progress state */
  progress: ExportProgressType;
  /** Called when user dismisses the notification */
  onDismiss?: () => void;
  /** Optional class name */
  className?: string;
  /** Auto-dismiss after completion (ms) */
  autoDismiss?: number;
}

/** Format duration from milliseconds */
function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60000).toFixed(1)}m`;
}

/** Get status icon and color */
function getStatusStyles(status: ExportProgressType['status']) {
  switch (status) {
    case 'pending':
      return {
        icon: <Loader2 className="w-5 h-5 animate-spin" />,
        bg: 'bg-slate-800',
        border: 'border-slate-700',
        text: 'text-slate-400',
      };
    case 'processing':
      return {
        icon: <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />,
        bg: 'bg-indigo-500/10',
        border: 'border-indigo-500/30',
        text: 'text-indigo-400',
      };
    case 'complete':
      return {
        icon: <Check className="w-5 h-5 text-emerald-400" />,
        bg: 'bg-emerald-500/10',
        border: 'border-emerald-500/30',
        text: 'text-emerald-400',
      };
    case 'error':
      return {
        icon: <AlertCircle className="w-5 h-5 text-rose-400" />,
        bg: 'bg-rose-500/10',
        border: 'border-rose-500/30',
        text: 'text-rose-400',
      };
    default:
      return {
        icon: <Loader2 className="w-5 h-5 animate-spin" />,
        bg: 'bg-slate-800',
        border: 'border-slate-700',
        text: 'text-slate-400',
      };
  }
}

export function ExportProgress({
  progress,
  onDismiss,
  className,
  autoDismiss = 5000,
}: ExportProgressProps) {
  const [show, setShow] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);

  const styles = getStatusStyles(progress.status);
  const Icon = progress.type === 'screenshot' ? ImageIcon : Video;

  // Track elapsed time
  useEffect(() => {
    if (progress.status === 'complete' || progress.status === 'error') return;

    const interval = setInterval(() => {
      setElapsedTime(Date.now() - progress.createdAt);
    }, 100);

    return () => clearInterval(interval);
  }, [progress.createdAt, progress.status]);

  // Auto-dismiss on completion
  useEffect(() => {
    if (progress.status === 'complete' && autoDismiss > 0) {
      const timer = setTimeout(() => {
        setShow(false);
        onDismiss?.();
      }, autoDismiss);
      return () => clearTimeout(timer);
    }
  }, [progress.status, autoDismiss, onDismiss]);

  const handleDismiss = () => {
    setShow(false);
    onDismiss?.();
  };

  if (!show) return null;

  // Calculate estimated time remaining
  const estimatedRemaining =
    progress.estimatedTime ||
    (progress.progress > 0 && progress.progress < 100
      ? (elapsedTime / progress.progress) * (100 - progress.progress)
      : undefined);

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border p-4 transition-all',
        styles.bg,
        styles.border,
        className
      )}
    >
      {/* Progress bar background */}
      {progress.status === 'processing' && (
        <div
          className="absolute bottom-0 left-0 h-1 bg-indigo-500/30 transition-all duration-300"
          style={{ width: `${progress.progress}%` }}
        />
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
            progress.status === 'processing' && 'bg-indigo-500/20',
            progress.status === 'complete' && 'bg-emerald-500/20',
            progress.status === 'error' && 'bg-rose-500/20'
          )}
        >
          {styles.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Icon className="w-4 h-4 text-slate-400" />
              <span className="font-medium text-white">
                {progress.type === 'screenshot' ? 'Screenshot' : 'Clip'} Export
              </span>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-white/10 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Stage */}
          <p className={cn('text-sm mt-1', styles.text)}>{progress.stage}</p>

          {/* Progress info */}
          {progress.status === 'processing' && (
            <div className="mt-2 space-y-1">
              {/* Progress bar */}
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>

              {/* Time info */}
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{progress.progress}%</span>
                {estimatedRemaining && estimatedRemaining > 0 ? (
                  <span>{formatDuration(estimatedRemaining)} remaining</span>
                ) : (
                  <span>{formatDuration(elapsedTime)} elapsed</span>
                )}
              </div>
            </div>
          )}

          {/* Error message */}
          {progress.status === 'error' && progress.error && (
            <p className="mt-2 text-sm text-rose-400">{progress.error}</p>
          )}

          {/* Completion info */}
          {progress.status === 'complete' && progress.completedAt && (
            <p className="mt-2 text-xs text-slate-500">
              Completed in {formatDuration(progress.completedAt - progress.createdAt)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** Multiple export progress list */
export interface ExportProgressListProps {
  /** Array of export progress states */
  exports: ExportProgressType[];
  /** Called when an export is dismissed */
  onDismiss?: (id: string) => void;
  /** Called when all exports are cleared */
  onClearAll?: () => void;
  /** Maximum number to show */
  maxVisible?: number;
}

export function ExportProgressList({
  exports,
  onDismiss,
  onClearAll,
  maxVisible = 5,
}: ExportProgressListProps) {
  const activeExports = exports
    .filter((e) => e.status === 'processing' || e.status === 'pending')
    .slice(0, maxVisible);

  const completedExports = exports
    .filter((e) => e.status === 'complete' || e.status === 'error')
    .slice(0, maxVisible - activeExports.length);

  const visibleExports = [...activeExports, ...completedExports];
  const hiddenCount = exports.length - visibleExports.length;

  if (visibleExports.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 w-80">
      {visibleExports.map((progress) => (
        <ExportProgress
          key={progress.id}
          progress={progress}
          onDismiss={() => onDismiss?.(progress.id)}
        />
      ))}

      {/* Hidden count */}
      {hiddenCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2 bg-slate-800 rounded-lg text-sm text-slate-400">
          <span>+{hiddenCount} more exports</span>
          <button
            onClick={onClearAll}
            className="text-indigo-400 hover:text-indigo-300"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportProgress;
