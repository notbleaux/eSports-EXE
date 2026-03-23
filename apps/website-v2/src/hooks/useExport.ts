/**
 * useExport Hook
 * React hook for managing exports with progress tracking
 * [Ver001.000]
 */

import { useState, useCallback, useRef } from 'react';
import type {
  ExportProgress,
  ScreenshotOptions,
  ClipOptions,
  ExportHistoryEntry,
} from '../lib/export/types';
import {
  captureScreenshot,
  captureClip,
  downloadScreenshot,
  shareExport,
  exportHistory,
} from '../lib/export';

/** useExport options */
export interface UseExportOptions {
  /** Callback when export completes */
  onComplete?: (entry: ExportHistoryEntry) => void;
  /** Callback when export fails */
  onError?: (error: Error) => void;
  /** Auto-save to history */
  saveToHistory?: boolean;
}

/** useExport return type */
export interface UseExportReturn {
  /** Current export progress */
  progress: ExportProgress | null;
  /** All active/completed exports */
  exports: ExportProgress[];
  /** Whether an export is in progress */
  isExporting: boolean;
  /** Capture screenshot */
  captureScreenshot: (
    options: Partial<ScreenshotOptions> & { target: HTMLElement }
  ) => Promise<Blob>;
  /** Capture clip */
  captureClip: (
    options: Partial<ClipOptions> & {
      target: HTMLCanvasElement | HTMLVideoElement;
      startTime: number;
      endTime: number;
    }
  ) => Promise<Blob>;
  /** Download export */
  download: (blob: Blob, filename?: string, metadata?: Partial<ExportHistoryEntry['metadata']>) => void;
  /** Share export */
  share: (
    blob: Blob,
    filename: string,
    destination: Parameters<typeof shareExport>[2]['destination']
  ) => Promise<{ success: boolean; url?: string }>;
  /** Dismiss export notification */
  dismissExport: (id: string) => void;
  /** Clear all exports */
  clearExports: () => void;
}

export function useExport(options: UseExportOptions = {}): UseExportReturn {
  const { onComplete, onError, saveToHistory = true } = options;

  const [exports, setExports] = useState<ExportProgress[]>([]);
  const [currentProgress, setCurrentProgress] = useState<ExportProgress | null>(null);

  // Keep track of exports for cleanup
  const exportsRef = useRef<ExportProgress[]>([]);

  const updateExport = useCallback((progress: ExportProgress) => {
    setCurrentProgress(progress);
    setExports((prev) => {
      const existing = prev.find((e) => e.id === progress.id);
      if (existing) {
        const updated = prev.map((e) => (e.id === progress.id ? progress : e));
        exportsRef.current = updated;
        return updated;
      }
      const added = [...prev, progress];
      exportsRef.current = added;
      return added;
    });
  }, []);

  const handleScreenshot = useCallback(
    async (
      opts: Partial<ScreenshotOptions> & { target: HTMLElement }
    ): Promise<Blob> => {
      try {
        const { blob, progress } = await captureScreenshot(opts, updateExport);

        if (progress.status === 'complete' && saveToHistory) {
          const entry = exportHistory.add({
            type: 'screenshot',
            format: (opts.format as 'png' | 'webp' | 'jpg') || 'png',
            size: blob.size,
            metadata: progress.options.metadata as ExportHistoryEntry['metadata'],
            privacy: 'private',
          });
          onComplete?.(entry);
        }

        return blob;
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [onComplete, onError, saveToHistory, updateExport]
  );

  const handleClip = useCallback(
    async (
      opts: Partial<ClipOptions> & {
        target: HTMLCanvasElement | HTMLVideoElement;
        startTime: number;
        endTime: number;
      }
    ): Promise<Blob> => {
      try {
        const { blob, progress } = await captureClip(opts, updateExport);

        if (progress.status === 'complete' && saveToHistory) {
          const entry = exportHistory.add({
            type: 'clip',
            format: (opts.format as 'mp4' | 'gif' | 'webp') || 'mp4',
            size: blob.size,
            metadata: progress.options.metadata as ExportHistoryEntry['metadata'],
            privacy: 'private',
          });
          onComplete?.(entry);
        }

        return blob;
      } catch (error) {
        onError?.(error as Error);
        throw error;
      }
    },
    [onComplete, onError, saveToHistory, updateExport]
  );

  const handleDownload = useCallback(
    (blob: Blob, filename?: string, metadata?: Partial<ExportHistoryEntry['metadata']>) => {
      downloadScreenshot(blob, filename, metadata);
    },
    []
  );

  const handleShare = useCallback(
    async (
      blob: Blob,
      filename: string,
      destination: Parameters<typeof shareExport>[2]['destination']
    ): Promise<{ success: boolean; url?: string }> => {
      const exportId = `share_${Date.now()}`;
      const result = await shareExport(blob, filename, {
        exportId,
        destination,
        privacy: 'unlisted',
      });
      return result;
    },
    []
  );

  const dismissExport = useCallback((id: string) => {
    setExports((prev) => {
      const filtered = prev.filter((e) => e.id !== id);
      exportsRef.current = filtered;
      return filtered;
    });
  }, []);

  const clearExports = useCallback(() => {
    exportsRef.current = [];
    setExports([]);
    setCurrentProgress(null);
  }, []);

  const isExporting = exports.some(
    (e) => e.status === 'processing' || e.status === 'pending'
  );

  return {
    progress: currentProgress,
    exports,
    isExporting,
    captureScreenshot: handleScreenshot,
    captureClip: handleClip,
    download: handleDownload,
    share: handleShare,
    dismissExport,
    clearExports,
  };
}

export default useExport;
