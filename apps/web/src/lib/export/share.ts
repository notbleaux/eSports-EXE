/**
 * Share System
 * Social sharing, direct download, cloud upload, and share history
 * [Ver001.000]
 */

import type {
  ShareDestination,
  ShareOptions,
  CloudUploadResult,
  ShareHistoryEntry,
  ExportHistoryEntry,
} from './types';

/** Share platform configurations */
const SHARE_CONFIGS: Record<ShareDestination, { name: string; icon: string; maxChars?: number }> = {
  twitter: { name: 'Twitter/X', icon: 'twitter', maxChars: 280 },
  discord: { name: 'Discord', icon: 'message-circle' },
  copy: { name: 'Copy Link', icon: 'link' },
  download: { name: 'Download', icon: 'download' },
  cloud: { name: 'Cloud Upload', icon: 'cloud' },
};

/** Get share destination config */
export function getShareConfig(destination: ShareDestination) {
  return SHARE_CONFIGS[destination];
}

/** Share to Twitter/X */
export async function shareToTwitter(
  shareUrl: string,
  message?: string
): Promise<void> {
  const text = message || 'Check out this SpecMap analysis!';
  const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
  window.open(url, '_blank', 'width=600,height=400');
}

/** Share to Discord via webhook */
export async function shareToDiscord(
  shareUrl: string,
  webhookUrl: string,
  message?: string
): Promise<void> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: message || 'SpecMap export shared',
      embeds: [
        {
          title: 'SpecMap Analysis',
          description: 'View the full analysis on SpecMap',
          url: shareUrl,
          color: 0x6366f1, // Indigo
          timestamp: new Date().toISOString(),
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`Discord share failed: ${response.statusText}`);
  }
}

/** Copy share link to clipboard */
export async function copyShareLink(shareUrl: string): Promise<void> {
  await navigator.clipboard.writeText(shareUrl);
}

/** Download file directly */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Upload to cloud storage (presigned URL pattern) */
export async function uploadToCloud(
  blob: Blob,
  filename: string,
  privacy: 'public' | 'unlisted' | 'private' = 'unlisted',
  options?: {
    /** Presigned URL endpoint */
    presignedUrlEndpoint?: string;
    /** Custom upload endpoint */
    uploadEndpoint?: string;
    /** Auth token */
    authToken?: string;
    /** Progress callback */
    onProgress?: (progress: number) => void;
  }
): Promise<CloudUploadResult> {
  const endpoint = options?.presignedUrlEndpoint || '/api/v1/exports/presign';

  try {
    // Step 1: Get presigned URL
    const presignResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(options?.authToken && { Authorization: `Bearer ${options.authToken}` }),
      },
      body: JSON.stringify({
        filename,
        contentType: blob.type,
        size: blob.size,
        privacy,
      }),
    });

    if (!presignResponse.ok) {
      throw new Error(`Failed to get presigned URL: ${presignResponse.statusText}`);
    }

    const { uploadUrl, fileUrl, shareUrl, expiresAt } = await presignResponse.json();

    // Step 2: Upload to presigned URL
    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': blob.type,
      },
      body: blob,
    });

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: ${uploadResponse.statusText}`);
    }

    return {
      success: true,
      url: fileUrl,
      shareUrl,
      expiresAt,
      size: blob.size,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

/** Native Web Share API (mobile) */
export async function nativeShare(
  blob: Blob,
  filename: string,
  title?: string,
  text?: string
): Promise<boolean> {
  if (!navigator.share || !navigator.canShare) {
    return false;
  }

  const file = new File([blob], filename, { type: blob.type });
  const shareData = {
    title: title || 'SpecMap Export',
    text: text || 'Check out this SpecMap analysis',
    files: [file],
  };

  if (!navigator.canShare(shareData)) {
    return false;
  }

  try {
    await navigator.share(shareData);
    return true;
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return true; // User cancelled
    }
    return false;
  }
}

/** Share history management */
export const shareHistory = {
  /** Storage key */
  STORAGE_KEY: 'specmap_share_history',

  /** Get all share history */
  getAll(): ShareHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /** Add entry to history */
  add(entry: Omit<ShareHistoryEntry, 'id' | 'sharedAt'>): ShareHistoryEntry {
    const history = this.getAll();
    const newEntry: ShareHistoryEntry = {
      ...entry,
      id: `share_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      sharedAt: Date.now(),
    };

    // Keep last 100 entries
    history.unshift(newEntry);
    if (history.length > 100) {
      history.pop();
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    return newEntry;
  },

  /** Remove entry from history */
  remove(id: string): void {
    const history = this.getAll().filter((e) => e.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  },

  /** Clear all history */
  clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  },

  /** Get entries for export */
  getByExport(exportId: string): ShareHistoryEntry[] {
    return this.getAll().filter((e) => e.exportId === exportId);
  },
};

/** Export history management */
export const exportHistory = {
  /** Storage key */
  STORAGE_KEY: 'specmap_export_history',

  /** Max stored exports */
  MAX_EXPORTS: 50,

  /** Get all export history */
  getAll(): ExportHistoryEntry[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /** Add export to history */
  add(entry: Omit<ExportHistoryEntry, 'id' | 'createdAt'>): ExportHistoryEntry {
    const history = this.getAll();
    const newEntry: ExportHistoryEntry = {
      ...entry,
      id: `export_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      createdAt: Date.now(),
    };

    // Keep max exports
    history.unshift(newEntry);
    if (history.length > this.MAX_EXPORTS) {
      // Clean up old exports (remove from indexedDB if stored)
      const removed = history.splice(this.MAX_EXPORTS);
      removed.forEach((e) => this.deleteExportData(e.id));
    }

    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    return newEntry;
  },

  /** Update export entry */
  update(id: string, updates: Partial<ExportHistoryEntry>): void {
    const history = this.getAll();
    const index = history.findIndex((e) => e.id === id);
    if (index !== -1) {
      history[index] = { ...history[index], ...updates };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
    }
  },

  /** Remove export from history */
  remove(id: string): void {
    this.deleteExportData(id);
    const history = this.getAll().filter((e) => e.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(history));
  },

  /** Clear all history */
  clear(): void {
    this.getAll().forEach((e) => this.deleteExportData(e.id));
    localStorage.removeItem(this.STORAGE_KEY);
  },

  /** Delete export data from storage */
  deleteExportData(id: string): void {
    // TODO: Implement indexedDB cleanup for blob storage
  },
};

/** Main share function */
export async function shareExport(
  blob: Blob,
  filename: string,
  options: ShareOptions,
  config?: {
    authToken?: string;
    presignedUrlEndpoint?: string;
    onProgress?: (progress: number) => void;
  }
): Promise<{ success: boolean; url?: string; error?: string }> {
  const { destination, message, privacy } = options;

  try {
    switch (destination) {
      case 'twitter': {
        // For Twitter, we need to upload first then share URL
        const result = await uploadToCloud(blob, filename, privacy, config);
        if (result.success && result.shareUrl) {
          await shareToTwitter(result.shareUrl, message);
          shareHistory.add({
            exportId: options.exportId,
            destination,
            privacy,
            shareUrl: result.shareUrl,
          });
          return { success: true, url: result.shareUrl };
        }
        throw new Error(result.error || 'Upload failed');
      }

      case 'discord': {
        const result = await uploadToCloud(blob, filename, privacy, config);
        return { success: result.success, url: result.shareUrl, error: result.error };
      }

      case 'copy': {
        const result = await uploadToCloud(blob, filename, privacy, config);
        if (result.success && result.shareUrl) {
          await copyShareLink(result.shareUrl);
          shareHistory.add({
            exportId: options.exportId,
            destination,
            privacy,
            shareUrl: result.shareUrl,
          });
        }
        return { success: result.success, url: result.shareUrl, error: result.error };
      }

      case 'download': {
        downloadFile(blob, filename);
        shareHistory.add({
          exportId: options.exportId,
          destination,
          privacy,
        });
        return { success: true };
      }

      case 'cloud': {
        const result = await uploadToCloud(blob, filename, privacy, config);
        if (result.success) {
          shareHistory.add({
            exportId: options.exportId,
            destination,
            privacy,
            shareUrl: result.shareUrl,
          });
        }
        return { success: result.success, url: result.shareUrl, error: result.error };
      }

      default:
        throw new Error(`Unknown destination: ${destination}`);
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Share failed',
    };
  }
}
