/**
 * Annotation Export System
 * Export replays with annotations in various formats
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-F
 * Team: Replay 2.0 Core (TL-S2)
 */

import type { 
  AnnotationSet, 
  Annotation, 
  DrawingAnnotation, 
  TextAnnotation, 
  VoiceAnnotation,
  ExportOptions, 
  ExportResult,
  ExportFormat,
} from './types';
import { isDrawingAnnotation, isTextAnnotation, isVoiceAnnotation } from './types';
import { renderDrawingAnnotation } from './drawing';
import { renderTextAnnotation } from './text';
import { renderWaveform } from './voiceNotes';

// ============================================================================
// Export Configuration
// ============================================================================

export const EXPORT_PRESETS: Record<string, Partial<ExportOptions>> = {
  'web': {
    format: 'json',
    quality: 'high',
    fps: 30,
    resolution: { width: 1920, height: 1080 },
    burnAnnotations: false,
  },
  'social': {
    format: 'video',
    quality: 'medium',
    fps: 30,
    resolution: { width: 1080, height: 1920 }, // Vertical for mobile
    burnAnnotations: true,
  },
  'analysis': {
    format: 'video',
    quality: 'high',
    fps: 60,
    resolution: { width: 1920, height: 1080 },
    burnAnnotations: true,
  },
  'overlay': {
    format: 'overlay',
    quality: 'high',
    fps: 60,
    resolution: { width: 1920, height: 1080 },
    burnAnnotations: false,
  },
};

// ============================================================================
// JSON Export
// ============================================================================

/**
 * Export annotations as JSON
 */
export function exportToJSON(annotationSet: AnnotationSet): ExportResult {
  try {
    const json = JSON.stringify(annotationSet, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    return {
      success: true,
      url,
      blob,
      metadata: {
        duration: 0,
        fileSize: blob.size,
        format: 'json',
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Export failed',
    };
  }
}

/**
 * Import annotations from JSON
 */
export function importFromJSON(json: string): AnnotationSet | null {
  try {
    const data = JSON.parse(json) as AnnotationSet;
    
    // Validate structure
    if (!data.id || !data.layers || !Array.isArray(data.layers)) {
      return null;
    }
    
    return data;
  } catch {
    return null;
  }
}

// ============================================================================
// Video Export with Annotations
// ============================================================================

export interface VideoExportProgress {
  stage: 'preparing' | 'rendering' | 'encoding' | 'finalizing';
  frame: number;
  totalFrames: number;
  percent: number;
}

export type VideoExportCallback = (progress: VideoExportProgress) => void;

/**
 * Export annotations as video with burned-in annotations
 * Uses MediaRecorder API for client-side encoding
 */
export async function exportToVideo(
  annotationSet: AnnotationSet,
  options: ExportOptions,
  renderFrame: (ctx: CanvasRenderingContext2D, time: number) => void,
  onProgress?: VideoExportCallback
): Promise<ExportResult> {
  const { resolution, fps, quality, timeRange } = options;
  const duration = timeRange ? timeRange.end - timeRange.start : 30000; // Default 30s
  const totalFrames = Math.floor((duration / 1000) * fps);
  
  // Create canvas for rendering
  const canvas = document.createElement('canvas');
  canvas.width = resolution.width;
  canvas.height = resolution.height;
  const ctx = canvas.getContext('2d')!;
  
  // Determine video MIME type and bitrate based on quality
  const { mimeType, videoBitsPerSecond } = getVideoSettings(quality);
  
  // Check for MediaRecorder support
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    return {
      success: false,
      error: `Video format not supported: ${mimeType}`,
    };
  }
  
  // Set up MediaRecorder
  const stream = canvas.captureStream(fps);
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond,
  });
  
  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };
  
  return new Promise((resolve) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      resolve({
        success: true,
        url,
        blob,
        metadata: {
          duration: duration / 1000,
          fileSize: blob.size,
          format: mimeType.split('/')[1].split(';')[0],
        },
      });
    };
    
    mediaRecorder.onerror = () => {
      resolve({
        success: false,
        error: 'Video recording error',
      });
    };
    
    // Start recording
    mediaRecorder.start();
    
    // Render frames
    let frame = 0;
    const startTime = timeRange?.start || 0;
    
    const renderNextFrame = () => {
      if (frame >= totalFrames) {
        mediaRecorder.stop();
        return;
      }
      
      const currentTime = startTime + (frame / fps) * 1000;
      
      // Clear canvas
      ctx.clearRect(0, 0, resolution.width, resolution.height);
      
      // Render base frame (game footage)
      renderFrame(ctx, currentTime);
      
      // Render annotations if burning
      if (options.burnAnnotations) {
        renderAnnotationsToCanvas(ctx, annotationSet, currentTime, resolution);
      }
      
      // Report progress
      onProgress?.({
        stage: 'rendering',
        frame,
        totalFrames,
        percent: Math.round((frame / totalFrames) * 100),
      });
      
      frame++;
      
      // Schedule next frame
      requestAnimationFrame(renderNextFrame);
    };
    
    onProgress?.({
      stage: 'preparing',
      frame: 0,
      totalFrames,
      percent: 0,
    });
    
    renderNextFrame();
  });
}

/**
 * Get video encoding settings based on quality
 */
function getVideoSettings(quality: ExportOptions['quality']): {
  mimeType: string;
  videoBitsPerSecond: number;
} {
  const bitrates = {
    low: 2500000,    // 2.5 Mbps
    medium: 5000000, // 5 Mbps
    high: 8000000,   // 8 Mbps
  };
  
  // Find supported MIME type
  const mimeTypes = [
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
    'video/mp4',
  ];
  
  const mimeType = mimeTypes.find(type => MediaRecorder.isTypeSupported(type)) || 'video/webm';
  
  return {
    mimeType,
    videoBitsPerSecond: bitrates[quality],
  };
}

// ============================================================================
// Image Sequence Export
// ============================================================================

/**
 * Export annotations as image sequence
 */
export async function exportToImageSequence(
  annotationSet: AnnotationSet,
  options: ExportOptions,
  renderFrame: (ctx: CanvasRenderingContext2D, time: number) => void,
  onProgress?: VideoExportCallback
): Promise<ExportResult> {
  const { resolution, fps, timeRange } = options;
  const duration = timeRange ? timeRange.end - timeRange.start : 30000;
  const totalFrames = Math.floor((duration / 1000) * fps);
  
  // Create canvas for rendering
  const canvas = document.createElement('canvas');
  canvas.width = resolution.width;
  canvas.height = resolution.height;
  const ctx = canvas.getContext('2d')!;
  
  const frames: Blob[] = [];
  const startTime = timeRange?.start || 0;
  
  for (let frame = 0; frame < totalFrames; frame++) {
    const currentTime = startTime + (frame / fps) * 1000;
    
    // Clear canvas
    ctx.clearRect(0, 0, resolution.width, resolution.height);
    
    // Render base frame
    renderFrame(ctx, currentTime);
    
    // Render annotations
    if (options.burnAnnotations) {
      renderAnnotationsToCanvas(ctx, annotationSet, currentTime, resolution);
    }
    
    // Capture frame as blob
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    
    frames.push(blob);
    
    onProgress?.({
      stage: 'rendering',
      frame,
      totalFrames,
      percent: Math.round((frame / totalFrames) * 100),
    });
  }
  
  // Create ZIP file with all frames
  const zipBlob = await createZipFromBlobs(frames, 'frame');
  const url = URL.createObjectURL(zipBlob);
  
  return {
    success: true,
    url,
    blob: zipBlob,
    metadata: {
      duration: duration / 1000,
      fileSize: zipBlob.size,
      format: 'zip',
    },
  };
}

/**
 * Create ZIP file from blobs
 */
async function createZipFromBlobs(blobs: Blob[], prefix: string): Promise<Blob> {
  // Simple ZIP implementation using JSZip-like structure
  // In production, use JSZip library
  
  // For now, return as a tar-like structure
  const encoder = new TextEncoder();
  const parts: BlobPart[] = [];
  
  for (let i = 0; i < blobs.length; i++) {
    const filename = `${prefix}_${String(i).padStart(5, '0')}.png`;
    const header = encoder.encode(`${filename}:${blobs[i].size}\n`);
    parts.push(header);
    parts.push(blobs[i]);
  }
  
  return new Blob(parts, { type: 'application/octet-stream' });
}

// ============================================================================
// Overlay Export (Separate Annotation Layer)
// ============================================================================

/**
 * Export annotations as separate overlay
 */
export function exportOverlay(
  annotationSet: AnnotationSet,
  options: ExportOptions
): ExportResult {
  // Create overlay data structure
  const overlay = {
    version: '1.0.0',
    resolution: options.resolution,
    annotations: annotationSet.layers.flatMap(layer => 
      layer.annotations.map(annotation => ({
        ...annotation,
        layerName: layer.name,
        layerOpacity: layer.opacity,
      }))
    ),
  };
  
  const json = JSON.stringify(overlay, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  return {
    success: true,
    url,
    blob,
    metadata: {
      duration: 0,
      fileSize: blob.size,
      format: 'overlay',
    },
  };
}

// ============================================================================
// Annotation Rendering for Export
// ============================================================================

/**
 * Render all annotations to canvas for export
 */
export function renderAnnotationsToCanvas(
  ctx: CanvasRenderingContext2D,
  annotationSet: AnnotationSet,
  currentTime: number,
  resolution: { width: number; height: number }
): void {
  // Get visible annotations for current time
  const annotations = annotationSet.layers
    .filter(layer => layer.visible)
    .flatMap(layer => 
      layer.annotations
        .filter(annotation => isAnnotationVisible(annotation, currentTime))
        .map(annotation => ({ annotation, layerOpacity: layer.opacity }))
    );
  
  ctx.save();
  
  for (const { annotation, layerOpacity } of annotations) {
    const timeProgress = calculateTimeProgress(annotation, currentTime);
    const finalOpacity = annotation.opacity * layerOpacity;
    
    if (isDrawingAnnotation(annotation)) {
      ctx.globalAlpha = finalOpacity;
      renderDrawingAnnotation(ctx, annotation, timeProgress);
    } else if (isTextAnnotation(annotation)) {
      renderTextAnnotation({
        ctx,
        annotation,
        timeProgress,
      });
    } else if (isVoiceAnnotation(annotation) && annotation.waveformData) {
      // Render voice note indicator
      renderVoiceNoteIndicator(ctx, annotation, finalOpacity);
    }
  }
  
  ctx.restore();
}

/**
 * Check if annotation is visible at given time
 */
function isAnnotationVisible(annotation: Annotation, currentTime: number): boolean {
  if (!annotation.visible) return false;
  
  const endTime = annotation.timestamp + annotation.duration;
  return currentTime >= annotation.timestamp && currentTime <= endTime;
}

/**
 * Calculate animation progress (0-1) based on current time
 */
function calculateTimeProgress(annotation: Annotation, currentTime: number): number {
  const elapsed = currentTime - annotation.timestamp;
  const fadeInDuration = 200; // 200ms fade in
  
  if (elapsed < fadeInDuration) {
    return elapsed / fadeInDuration;
  }
  
  return 1;
}

/**
 * Render voice note indicator
 */
function renderVoiceNoteIndicator(
  ctx: CanvasRenderingContext2D,
  annotation: import('./types').VoiceAnnotation,
  opacity: number
): void {
  const x = 50;
  const y = ctx.canvas.height - 100;
  const width = 200;
  const height = 40;
  
  ctx.save();
  ctx.globalAlpha = opacity;
  
  // Background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();
  
  // Icon
  ctx.fillStyle = '#FF4655';
  ctx.beginPath();
  ctx.arc(x + 20, y + 20, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Waveform
  if (annotation.waveformData) {
    const waveformX = x + 40;
    const waveformY = y + 10;
    const waveformWidth = 140;
    const waveformHeight = 20;
    
    renderWaveform({
      ctx,
      waveformData: annotation.waveformData,
      width: waveformWidth,
      height: waveformHeight,
      color: '#00D4AA',
      backgroundColor: 'rgba(0, 212, 170, 0.3)',
    });
  }
  
  ctx.restore();
}

// ============================================================================
// Download Helpers
// ============================================================================

/**
 * Trigger download of exported file
 */
export function downloadExport(result: ExportResult, filename?: string): void {
  if (!result.success || !result.url) {
    return;
  }
  
  const link = document.createElement('a');
  link.href = result.url;
  link.download = filename || `export-${Date.now()}.${getFileExtension(result)}`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get file extension from export result
 */
function getFileExtension(result: ExportResult): string {
  const format = result.metadata?.format || 'bin';
  
  switch (format) {
    case 'json':
    case 'overlay':
      return 'json';
    case 'webm':
      return 'webm';
    case 'mp4':
      return 'mp4';
    case 'zip':
      return 'zip';
    default:
      return 'bin';
  }
}

// ============================================================================
// Main Export Function
// ============================================================================

/**
 * Main export function - dispatches to appropriate export method
 */
export async function exportAnnotations(
  annotationSet: AnnotationSet,
  options: ExportOptions,
  renderFrame?: (ctx: CanvasRenderingContext2D, time: number) => void,
  onProgress?: VideoExportCallback
): Promise<ExportResult> {
  switch (options.format) {
    case 'json':
      return exportToJSON(annotationSet);
    
    case 'video':
      if (!renderFrame) {
        return {
          success: false,
          error: 'Render function required for video export',
        };
      }
      return exportToVideo(annotationSet, options, renderFrame, onProgress);
    
    case 'image-sequence':
      if (!renderFrame) {
        return {
          success: false,
          error: 'Render function required for image sequence export',
        };
      }
      return exportToImageSequence(annotationSet, options, renderFrame, onProgress);
    
    case 'overlay':
      return exportOverlay(annotationSet, options);
    
    default:
      return {
        success: false,
        error: `Unknown export format: ${options.format}`,
      };
  }
}

// ============================================================================
// Export
// ============================================================================

export default {
  EXPORT_PRESETS,
  exportToJSON,
  importFromJSON,
  exportToVideo,
  exportToImageSequence,
  exportOverlay,
  renderAnnotationsToCanvas,
  downloadExport,
  exportAnnotations,
};
