/**
 * Screenshot Capture System
 * Full map screenshot capture with lens overlay and metadata support
 * [Ver001.000]
 */

import {
  type ScreenshotOptions,
  type ExportProgress,
  type ExportMetadata,
  type ExportResolution,
  NATIVE_RESOLUTION,
  QUALITY_SETTINGS,
  EXPORT_LIMITS,
  DEFAULT_SCREENSHOT_OPTIONS,
} from './types';
import { generateWatermark } from './watermark';
import { embedMetadata } from './metadata';

/** Generate unique export ID */
function generateExportId(): string {
  return `ss_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Scale canvas to target resolution */
function scaleCanvas(
  source: HTMLCanvasElement,
  targetResolution: ExportResolution
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  if (targetResolution === NATIVE_RESOLUTION) {
    canvas.width = source.width;
    canvas.height = source.height;
    ctx.drawImage(source, 0, 0);
    return canvas;
  }

  canvas.width = targetResolution.width;
  canvas.height = targetResolution.height;

  // Use high-quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);

  return canvas;
}

/** Capture element to canvas using html2canvas-like approach */
async function captureElement(element: HTMLElement): Promise<HTMLCanvasElement> {
  // Get element bounds
  const rect = element.getBoundingClientRect();
  const scale = window.devicePixelRatio || 1;

  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = rect.width * scale;
  canvas.height = rect.height * scale;

  const ctx = canvas.getContext('2d')!;
  ctx.scale(scale, scale);

  // Clone element for capture
  const clone = element.cloneNode(true) as HTMLElement;
  clone.style.position = 'fixed';
  clone.style.left = '-9999px';
  clone.style.top = '0';
  clone.style.width = `${rect.width}px`;
  clone.style.height = `${rect.height}px`;
  clone.style.transform = 'none';
  clone.style.opacity = '1';
  document.body.appendChild(clone);

  try {
    // Use SVG foreignObject for rendering
    const svgData = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
        <foreignObject width="100%" height="100%">
          <div xmlns="http://www.w3.org/1999/xhtml">
            ${clone.outerHTML}
          </div>
        </foreignObject>
      </svg>
    `;

    const img = new Image();
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = url;
    });

    ctx.drawImage(img, 0, 0, rect.width, rect.height);
    URL.revokeObjectURL(url);
  } finally {
    document.body.removeChild(clone);
  }

  return canvas;
}

/** Apply background to canvas (for non-transparent exports) */
function applyBackground(canvas: HTMLCanvasElement, backgroundColor: string): HTMLCanvasElement {
  const newCanvas = document.createElement('canvas');
  newCanvas.width = canvas.width;
  newCanvas.height = canvas.height;

  const ctx = newCanvas.getContext('2d')!;
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
  ctx.drawImage(canvas, 0, 0);

  return newCanvas;
}

/** Capture screenshot with progress tracking */
export async function captureScreenshot(
  options: Partial<ScreenshotOptions> & { target: HTMLElement },
  onProgress?: (progress: ExportProgress) => void
): Promise<{ blob: Blob; progress: ExportProgress }> {
  const opts: ScreenshotOptions = {
    ...DEFAULT_SCREENSHOT_OPTIONS,
    ...options,
    metadata: {
      platform: '4NJZ4-TENET',
      specmapVersion: '2.0.0',
      timestamp: Date.now(),
      ...options.metadata,
    } as ExportMetadata,
  };

  const exportId = generateExportId();

  // Initialize progress
  let progress: ExportProgress = {
    id: exportId,
    type: 'screenshot',
    status: 'processing',
    progress: 0,
    stage: 'Initializing capture...',
    options: opts,
    createdAt: Date.now(),
  };
  onProgress?.(progress);

  try {
    // Step 1: Capture element (25%)
    progress = { ...progress, progress: 10, stage: 'Capturing viewport...' };
    onProgress?.(progress);

    let canvas = await captureElement(opts.target);
    progress = { ...progress, progress: 25 };
    onProgress?.(progress);

    // Step 2: Scale to target resolution (40%)
    progress = { ...progress, progress: 30, stage: 'Scaling to target resolution...' };
    onProgress?.(progress);

    if (opts.resolution !== NATIVE_RESOLUTION) {
      canvas = scaleCanvas(canvas, opts.resolution);
    }
    progress = { ...progress, progress: 40 };
    onProgress?.(progress);

    // Step 3: Apply background if not transparent (50%)
    if (!opts.transparent && opts.format !== 'jpg') {
      canvas = applyBackground(canvas, '#0a0a0f');
    }
    progress = { ...progress, progress: 50 };
    onProgress?.(progress);

    // Step 4: Add watermark if enabled (65%)
    if (opts.includeWatermark) {
      progress = { ...progress, progress: 55, stage: 'Adding watermark...' };
      onProgress?.(progress);

      const watermark = generateWatermark({
        text: opts.watermarkText || 'Libre-X 4NJZ4',
        width: canvas.width,
        height: canvas.height,
      });

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(watermark, canvas.width - watermark.width - 20, canvas.height - watermark.height - 20);
    }
    progress = { ...progress, progress: 65 };
    onProgress?.(progress);

    // Step 5: Encode to format (85%)
    progress = { ...progress, progress: 70, stage: `Encoding as ${opts.format.toUpperCase()}...` };
    onProgress?.(progress);

    const mimeType = opts.format === 'jpg' ? 'image/jpeg' : `image/${opts.format}`;
    const quality = opts.format === 'png' ? undefined : opts.quality;

    let blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
        mimeType,
        quality
      );
    });

    // Check size limit
    if (blob.size > EXPORT_LIMITS.IMAGE_MAX_SIZE) {
      // Try with lower quality
      if (opts.format !== 'png') {
        blob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob(
            (b) => (b ? resolve(b) : reject(new Error('Failed to create blob'))),
            mimeType,
            0.7
          );
        });
      }

      if (blob.size > EXPORT_LIMITS.IMAGE_MAX_SIZE) {
        throw new Error(`Export size (${(blob.size / 1024 / 1024).toFixed(1)}MB) exceeds limit (10MB)`);
      }
    }

    progress = { ...progress, progress: 85 };
    onProgress?.(progress);

    // Step 6: Embed metadata if enabled (100%)
    if (opts.includeMetadata) {
      progress = { ...progress, progress: 90, stage: 'Embedding metadata...' };
      onProgress?.(progress);

      blob = await embedMetadata(blob, opts.metadata as ExportMetadata);
    }

    // Complete
    progress = {
      ...progress,
      status: 'complete',
      progress: 100,
      stage: 'Export complete',
      result: blob,
      completedAt: Date.now(),
    };
    onProgress?.(progress);

    return { blob, progress };
  } catch (error) {
    progress = {
      ...progress,
      status: 'error',
      stage: 'Export failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    onProgress?.(progress);
    throw error;
  }
}

/** Quick screenshot capture (no progress tracking) */
export async function quickScreenshot(
  target: HTMLElement,
  format: 'png' | 'webp' | 'jpg' = 'png'
): Promise<Blob> {
  const { blob } = await captureScreenshot({ target, format });
  return blob;
}

/** Download screenshot directly */
export function downloadScreenshot(
  blob: Blob,
  filename?: string,
  metadata?: Partial<ExportMetadata>
): void {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const mapName = metadata?.mapName ? `_${metadata.mapName}` : '';
  const matchName = metadata?.matchName ? `_${metadata.matchName.replace(/\s+/g, '_')}` : '';
  const defaultName = `specmap${mapName}${matchName}_${timestamp}`;

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${defaultName}.${blob.type.split('/')[1] || 'png'}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Get recommended format based on browser support */
export function getRecommendedFormat(): 'png' | 'webp' | 'jpg' {
  const canvas = document.createElement('canvas');

  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp';
  }
  return 'png';
}

/** Estimate file size for given options */
export function estimateFileSize(
  resolution: ExportResolution,
  format: 'png' | 'webp' | 'jpg',
  quality: number
): number {
  const width = resolution === NATIVE_RESOLUTION ? 1920 : resolution.width;
  const height = resolution === NATIVE_RESOLUTION ? 1080 : resolution.height;
  const pixels = width * height;

  // Rough estimation
  switch (format) {
    case 'png':
      return pixels * 4 * 0.3; // ~30% compression
    case 'webp':
      return pixels * 3 * (1 - quality * 0.7);
    case 'jpg':
      return pixels * 3 * (1 - quality * 0.6);
    default:
      return pixels * 4;
  }
}
