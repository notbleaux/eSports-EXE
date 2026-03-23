/**
 * Export Types
 * Type definitions for screenshot, clip, and share functionality
 * [Ver001.000]
 */

/** Supported export formats */
export type ExportFormat = 'png' | 'webp' | 'jpg' | 'mp4' | 'gif';

/** Export quality settings */
export type ExportQuality = 'low' | 'medium' | 'high' | 'ultra';

/** Resolution presets */
export interface ExportResolution {
  width: number;
  height: number;
  label: string;
}

/** Standard export resolutions */
export const EXPORT_RESOLUTIONS: ExportResolution[] = [
  { width: 1920, height: 1080, label: '1080p (FHD)' },
  { width: 2560, height: 1440, label: '1440p (QHD)' },
  { width: 3840, height: 2160, label: '4K (UHD)' },
  { width: 7680, height: 4320, label: '8K (UHD)' },
];

/** Default/native resolution */
export const NATIVE_RESOLUTION: ExportResolution = {
  width: 0,
  height: 0,
  label: 'Native (Current View)',
};

/** Metadata embedded in exported files */
export interface ExportMetadata {
  /** Match or map identifier */
  matchId?: string;
  /** Match name or title */
  matchName?: string;
  /** Map name (e.g., 'Ascent', 'Inferno') */
  mapName?: string;
  /** Game version (e.g., 'Valorant v9.0') */
  gameVersion?: string;
  /** Timestamp when export was created */
  timestamp: number;
  /** Platform identifier */
  platform: string;
  /** SpecMap version */
  specmapVersion: string;
  /** User who created the export */
  userId?: string;
  /** Lens/HUB configuration at export time */
  lensConfig?: string[];
  /** Export format and quality */
  format: ExportFormat;
  quality: ExportQuality;
  /** Resolution */
  resolution: ExportResolution;
}

/** Screenshot export options */
export interface ScreenshotOptions {
  /** Target element to capture */
  target: HTMLElement;
  /** Export format */
  format: Extract<ExportFormat, 'png' | 'webp' | 'jpg'>;
  /** Quality (0-1 for lossy formats) */
  quality: number;
  /** Export resolution */
  resolution: ExportResolution;
  /** Include lens overlay in capture */
  includeLensOverlay: boolean;
  /** Add watermark */
  includeWatermark: boolean;
  /** Custom watermark text (defaults to platform) */
  watermarkText?: string;
  /** Include metadata in exported file */
  includeMetadata: boolean;
  /** Metadata to embed */
  metadata: Partial<ExportMetadata>;
  /** Transparent background (PNG only) */
  transparent?: boolean;
}

/** Clip/Timeline export options */
export interface ClipOptions {
  /** Target canvas/video element */
  target: HTMLCanvasElement | HTMLVideoElement;
  /** Export format */
  format: Extract<ExportFormat, 'mp4' | 'gif' | 'webp'>;
  /** Clip start time in seconds */
  startTime: number;
  /** Clip end time in seconds */
  endTime: number;
  /** Target resolution */
  resolution: ExportResolution;
  /** Frame rate for clip export */
  fps: number;
  /** Include audio */
  includeAudio: boolean;
  /** Audio volume (0-1) */
  audioVolume?: number;
  /** Quality setting */
  quality: ExportQuality;
  /** Add watermark */
  includeWatermark: boolean;
  /** Include metadata */
  includeMetadata: boolean;
  metadata: Partial<ExportMetadata>;
}

/** Export progress state */
export interface ExportProgress {
  /** Unique export job ID */
  id: string;
  /** Export type */
  type: 'screenshot' | 'clip';
  /** Current status */
  status: 'pending' | 'processing' | 'complete' | 'error';
  /** Progress percentage (0-100) */
  progress: number;
  /** Current stage description */
  stage: string;
  /** Estimated time remaining (ms) */
  estimatedTime?: number;
  /** Result data URL or blob */
  result?: string | Blob;
  /** Error message if failed */
  error?: string;
  /** Export options used */
  options: ScreenshotOptions | ClipOptions;
  /** Creation timestamp */
  createdAt: number;
  /** Completion timestamp */
  completedAt?: number;
}

/** Share destination types */
export type ShareDestination = 'twitter' | 'discord' | 'copy' | 'download' | 'cloud';

/** Share options */
export interface ShareOptions {
  /** Export to share */
  exportId: string;
  /** Destination platform */
  destination: ShareDestination;
  /** Share message/text */
  message?: string;
  /** Privacy setting */
  privacy: 'public' | 'unlisted' | 'private';
  /** Allow comments/replies */
  allowComments?: boolean;
  /** Custom tags */
  tags?: string[];
}

/** Cloud upload result */
export interface CloudUploadResult {
  /** Upload success status */
  success: boolean;
  /** URL to access uploaded file */
  url?: string;
  /** Presigned URL for direct access (if applicable) */
  presignedUrl?: string;
  /** Public shareable link */
  shareUrl?: string;
  /** Expiration time (if temporary) */
  expiresAt?: number;
  /** File size in bytes */
  size?: number;
  /** Error message if failed */
  error?: string;
}

/** Share history entry */
export interface ShareHistoryEntry {
  /** Unique share ID */
  id: string;
  /** Associated export ID */
  exportId: string;
  /** Share destination */
  destination: ShareDestination;
  /** Privacy setting at share time */
  privacy: 'public' | 'unlisted' | 'private';
  /** Share URL if available */
  shareUrl?: string;
  /** Share timestamp */
  sharedAt: number;
  /** View count (if tracked) */
  views?: number;
  /** Tags */
  tags?: string[];
}

/** Export history entry */
export interface ExportHistoryEntry {
  /** Unique export ID */
  id: string;
  /** Export type */
  type: 'screenshot' | 'clip';
  /** Export format */
  format: ExportFormat;
  /** Thumbnail data URL */
  thumbnail?: string;
  /** File size in bytes */
  size: number;
  /** Creation timestamp */
  createdAt: number;
  /** Export metadata */
  metadata: ExportMetadata;
  /** Local storage URL (if saved locally) */
  localUrl?: string;
  /** Cloud URL (if uploaded) */
  cloudUrl?: string;
  /** Privacy setting */
  privacy: 'public' | 'unlisted' | 'private';
}

/** Web Worker message types */
export interface WorkerMessage {
  type: 'init' | 'process' | 'progress' | 'complete' | 'error';
  id: string;
  payload?: unknown;
}

/** Screenshot processing message */
export interface ScreenshotWorkerMessage extends WorkerMessage {
  type: 'process';
  imageData: ImageBitmap;
  options: Pick<ScreenshotOptions, 'format' | 'quality' | 'resolution' | 'includeWatermark' | 'watermarkText'>;
}

/** Clip processing message */
export interface ClipWorkerMessage extends WorkerMessage {
  type: 'process';
  frames: ImageBitmap[];
  options: Pick<ClipOptions, 'format' | 'fps' | 'quality' | 'includeAudio' | 'audioVolume'>;
}

/** File size limits */
export const EXPORT_LIMITS = {
  /** Max image size in bytes (10MB) */
  IMAGE_MAX_SIZE: 10 * 1024 * 1024,
  /** Max clip size in bytes (50MB) */
  CLIP_MAX_SIZE: 50 * 1024 * 1024,
  /** Min clip duration in seconds */
  CLIP_MIN_DURATION: 5,
  /** Max clip duration in seconds */
  CLIP_MAX_DURATION: 60,
  /** Max clip frame rate */
  CLIP_MAX_FPS: 60,
  /** Min clip frame rate */
  CLIP_MIN_FPS: 15,
} as const;

/** Quality to compression ratio mapping */
export const QUALITY_SETTINGS: Record<ExportQuality, { compression: number; scale: number }> = {
  low: { compression: 0.6, scale: 0.5 },
  medium: { compression: 0.8, scale: 0.75 },
  high: { compression: 0.95, scale: 1.0 },
  ultra: { compression: 1.0, scale: 1.0 },
};

/** Default export options */
export const DEFAULT_SCREENSHOT_OPTIONS: Omit<ScreenshotOptions, 'target' | 'metadata'> = {
  format: 'png',
  quality: 0.95,
  resolution: NATIVE_RESOLUTION,
  includeLensOverlay: true,
  includeWatermark: true,
  includeMetadata: true,
  transparent: false,
};

/** Default clip options */
export const DEFAULT_CLIP_OPTIONS: Omit<ClipOptions, 'target' | 'startTime' | 'endTime' | 'metadata'> = {
  format: 'mp4',
  resolution: NATIVE_RESOLUTION,
  fps: 30,
  includeAudio: false,
  audioVolume: 1.0,
  quality: 'high',
  includeWatermark: true,
  includeMetadata: true,
};
