/**
 * Export Library
 * Main exports for screenshot, clip, and share functionality
 * [Ver001.000]
 */

// Types
export type {
  ExportFormat,
  ExportQuality,
  ExportResolution,
  ExportMetadata,
  ScreenshotOptions,
  ClipOptions,
  ExportProgress,
  ShareDestination,
  ShareOptions,
  CloudUploadResult,
  ShareHistoryEntry,
  ExportHistoryEntry,
  WorkerMessage,
  ScreenshotWorkerMessage,
  ClipWorkerMessage,
} from './types';

// Constants
export {
  EXPORT_RESOLUTIONS,
  NATIVE_RESOLUTION,
  EXPORT_LIMITS,
  QUALITY_SETTINGS,
  DEFAULT_SCREENSHOT_OPTIONS,
  DEFAULT_CLIP_OPTIONS,
} from './types';

// Screenshot
export {
  captureScreenshot,
  quickScreenshot,
  downloadScreenshot,
  getRecommendedFormat,
  estimateFileSize,
} from './screenshot';

// Clip
export {
  captureClip,
  quickClip,
  estimateClipSize,
  getRecommendedClipSettings,
} from './clip';

// Share
export {
  shareExport,
  shareToTwitter,
  shareToDiscord,
  copyShareLink,
  downloadFile,
  uploadToCloud,
  nativeShare,
  shareHistory,
  exportHistory,
  getShareConfig,
} from './share';

// Watermark
export {
  generateWatermark,
  generateBrandedWatermark,
  generateCornerWatermark,
  type WatermarkOptions,
} from './watermark';

// Metadata
export {
  embedMetadata,
  extractMetadata,
  generateSidecarMetadata,
  createMetadata,
} from './metadata';
