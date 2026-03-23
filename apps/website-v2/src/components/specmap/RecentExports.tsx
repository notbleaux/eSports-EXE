/**
 * Recent Exports Component
 * History list of recent exports with actions
 * [Ver001.000]
 */

import { useState, useCallback, useEffect } from 'react';
import { cn } from '../../lib/utils';
import type { ExportHistoryEntry, ShareHistoryEntry } from '../../lib/export/types';
import { exportHistory, shareHistory } from '../../lib/export/share';
import {
  Image as ImageIcon,
  Video,
  Download,
  Share2,
  Trash2,
  ExternalLink,
  Clock,
  Globe,
  Eye,
  Lock,
  ChevronDown,
  ChevronUp,
  X,
} from 'lucide-react';

export interface RecentExportsProps {
  /** Maximum number of exports to show */
  limit?: number;
  /** Called when export is selected */
  onSelect?: (exportEntry: ExportHistoryEntry) => void;
  /** Called when an export is deleted */
  onDelete?: (id: string) => void;
  /** Optional class name */
  className?: string;
  /** Show share history for selected export */
  showShareHistory?: boolean;
}

/** Format date to relative time */
function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString();
}

/** Get privacy icon */
function PrivacyIcon({ privacy }: { privacy: ExportHistoryEntry['privacy'] }) {
  switch (privacy) {
    case 'public':
      return <Globe className="w-3 h-3" />;
    case 'unlisted':
      return <Eye className="w-3 h-3" />;
    case 'private':
      return <Lock className="w-3 h-3" />;
  }
}

/** Get privacy label */
function PrivacyLabel({ privacy }: { privacy: ExportHistoryEntry['privacy'] }) {
  const labels = {
    public: 'Public',
    unlisted: 'Unlisted',
    private: 'Private',
  };
  return <span className="text-xs">{labels[privacy]}</span>;
}

export function RecentExports({
  limit = 10,
  onSelect,
  onDelete,
  className,
  showShareHistory = true,
}: RecentExportsProps) {
  const [exports, setExports] = useState<ExportHistoryEntry[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [shareHistoryEntries, setShareHistoryEntries] = useState<ShareHistoryEntry[]>([]);
  const [expandedShares, setExpandedShares] = useState<Set<string>>(new Set());

  // Load exports
  useEffect(() => {
    const allExports = exportHistory.getAll();
    setExports(allExports.slice(0, limit));
  }, [limit]);

  // Load share history for selected export
  useEffect(() => {
    if (selectedId && showShareHistory) {
      const entries = shareHistory.getByExport(selectedId);
      setShareHistoryEntries(entries);
    }
  }, [selectedId, showShareHistory]);

  const handleDelete = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      exportHistory.remove(id);
      setExports((prev) => prev.filter((exp) => exp.id !== id));
      onDelete?.(id);
    },
    [onDelete]
  );

  const handleDownload = useCallback(
    (exportEntry: ExportHistoryEntry, e: React.MouseEvent) => {
      e.stopPropagation();
      // TODO: Implement actual download from storage
      console.log('Download:', exportEntry.id);
    },
    []
  );

  const handleShare = useCallback(
    (exportEntry: ExportHistoryEntry, e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedId(exportEntry.id);
      onSelect?.(exportEntry);
    },
    [onSelect]
  );

  const toggleShareExpansion = useCallback((shareId: string) => {
    setExpandedShares((prev) => {
      const next = new Set(prev);
      if (next.has(shareId)) {
        next.delete(shareId);
      } else {
        next.add(shareId);
      }
      return next;
    });
  }, []);

  const getDestinationIcon = (destination: ShareHistoryEntry['destination']) => {
    switch (destination) {
      case 'twitter':
        return '𝕏';
      case 'discord':
        return '💬';
      case 'copy':
        return '🔗';
      case 'download':
        return '⬇️';
      case 'cloud':
        return '☁️';
      default:
        return '•';
    }
  };

  if (exports.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center p-8 text-center text-slate-500',
          className
        )}
      >
        <Clock className="w-8 h-8 mb-2 opacity-50" />
        <p className="text-sm">No recent exports</p>
        <p className="text-xs mt-1">Your exports will appear here</p>
      </div>
    );
  }

  return (
    <div className={cn('space-y-2', className)}>
      {/* Header */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-medium text-slate-300">Recent Exports</h3>
        <button
          onClick={() => {
            exportHistory.clear();
            setExports([]);
          }}
          className="text-xs text-slate-500 hover:text-rose-400 transition-colors"
        >
          Clear all
        </button>
      </div>

      {/* Export list */}
      <div className="space-y-2">
        {exports.map((exportEntry) => (
          <div
            key={exportEntry.id}
            className={cn(
              'group relative p-3 bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-transparent hover:border-slate-700 transition-all cursor-pointer',
              selectedId === exportEntry.id && 'border-indigo-500/50 bg-indigo-500/5'
            )}
            onClick={() => setSelectedId(exportEntry.id)}
          >
            <div className="flex items-start gap-3">
              {/* Thumbnail */}
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center shrink-0 overflow-hidden">
                {exportEntry.thumbnail ? (
                  <img
                    src={exportEntry.thumbnail}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : exportEntry.type === 'screenshot' ? (
                  <ImageIcon className="w-5 h-5 text-slate-500" />
                ) : (
                  <Video className="w-5 h-5 text-slate-500" />
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm text-white truncate">
                    {exportEntry.metadata.mapName ||
                      exportEntry.metadata.matchName ||
                      'Untitled Export'}
                  </span>
                  <span className="text-xs text-slate-500 uppercase">
                    {exportEntry.format}
                  </span>
                </div>

                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span>{formatRelativeTime(exportEntry.createdAt)}</span>
                  <span>{(exportEntry.size / 1024).toFixed(0)} KB</span>
                  <div className="flex items-center gap-1 px-1.5 py-0.5 bg-slate-700/50 rounded">
                    <PrivacyIcon privacy={exportEntry.privacy} />
                    <PrivacyLabel privacy={exportEntry.privacy} />
                  </div>
                </div>

                {/* Resolution info */}
                {exportEntry.metadata.resolution &&
                  exportEntry.metadata.resolution.width > 0 && (
                    <p className="text-xs text-slate-500 mt-1">
                      {exportEntry.metadata.resolution.width}×
                      {exportEntry.metadata.resolution.height}
                    </p>
                  )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {exportEntry.cloudUrl && (
                  <a
                    href={exportEntry.cloudUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                    title="Open"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
                <button
                  onClick={(e) => handleShare(exportEntry, e)}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                  title="Share"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDownload(exportEntry, e)}
                  className="p-1.5 hover:bg-slate-700 rounded text-slate-400 hover:text-white"
                  title="Download"
                >
                  <Download className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => handleDelete(exportEntry.id, e)}
                  className="p-1.5 hover:bg-rose-500/20 rounded text-slate-400 hover:text-rose-400"
                  title="Delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Share history for selected export */}
            {selectedId === exportEntry.id && shareHistoryEntries.length > 0 && showShareHistory && (
              <div className="mt-3 pt-3 border-t border-slate-700/50">
                <p className="text-xs font-medium text-slate-400 mb-2">Share History</p>
                <div className="space-y-1">
                  {shareHistoryEntries.map((share) => (
                    <div
                      key={share.id}
                      className="flex items-center gap-2 text-xs text-slate-500"
                    >
                      <span className="w-4 text-center">{getDestinationIcon(share.destination)}</span>
                      <span className="capitalize">{share.destination}</span>
                      <span>•</span>
                      <span>{formatRelativeTime(share.sharedAt)}</span>
                      {share.shareUrl && (
                        <>
                          <span>•</span>
                          {expandedShares.has(share.id) ? (
                            <span className="text-indigo-400 break-all">{share.shareUrl}</span>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleShareExpansion(share.id);
                              }}
                              className="text-indigo-400 hover:underline"
                            >
                              View link
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/** Compact recent exports (for sidebar) */
export function RecentExportsCompact({
  limit = 5,
  onSelect,
  className,
}: Omit<RecentExportsProps, 'onDelete' | 'showShareHistory'>) {
  const [exports, setExports] = useState<ExportHistoryEntry[]>([]);

  useEffect(() => {
    const allExports = exportHistory.getAll();
    setExports(allExports.slice(0, limit));
  }, [limit]);

  if (exports.length === 0) return null;

  return (
    <div className={cn('space-y-1', className)}>
      {exports.map((exportEntry) => (
        <button
          key={exportEntry.id}
          onClick={() => onSelect?.(exportEntry)}
          className="w-full flex items-center gap-2 p-2 hover:bg-slate-800/50 rounded-lg text-left transition-colors"
        >
          {exportEntry.type === 'screenshot' ? (
            <ImageIcon className="w-4 h-4 text-slate-500" />
          ) : (
            <Video className="w-4 h-4 text-slate-500" />
          )}
          <span className="flex-1 text-sm text-slate-300 truncate">
            {exportEntry.metadata.mapName || 'Export'}
          </span>
          <span className="text-xs text-slate-500">{formatRelativeTime(exportEntry.createdAt)}</span>
        </button>
      ))}
    </div>
  );
}

export default RecentExports;
