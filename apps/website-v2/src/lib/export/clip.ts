/**
 * Clip Export System
 * Video clip generation from canvas/video sources
 * [Ver001.000]
 */

import type {
  ClipOptions,
  ExportProgress,
  ExportMetadata,
  ExportResolution,
  NATIVE_RESOLUTION,
  DEFAULT_CLIP_OPTIONS,
  EXPORT_LIMITS,
} from './types';

/** Generate unique clip ID */
function generateClipId(): string {
  return `clip_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/** Capture frames from video/canvas element */
async function captureFrames(
  source: HTMLCanvasElement | HTMLVideoElement,
  startTime: number,
  endTime: number,
  fps: number,
  onProgress?: (progress: number) => void
): Promise<ImageBitmap[]> {
  const frames: ImageBitmap[] = [];
  const duration = endTime - startTime;
  const frameCount = Math.ceil(duration * fps);
  const frameInterval = 1 / fps;

  const isVideo = source instanceof HTMLVideoElement;
  const canvas = isVideo ? document.createElement('canvas') : source;
  const ctx = canvas.getContext('2d')!;

  if (isVideo) {
    canvas.width = source.videoWidth || source.clientWidth;
    canvas.height = source.videoHeight || source.clientHeight;
  }

  // Save current video time
  const originalTime = isVideo ? source.currentTime : 0;

  for (let i = 0; i < frameCount; i++) {
    const currentTime = startTime + i * frameInterval;

    if (isVideo) {
      // Seek to time
      source.currentTime = currentTime;
      await new Promise<void>((resolve) => {
        const handler = () => {
          source.removeEventListener('seeked', handler);
          resolve();
        };
        source.addEventListener('seeked', handler);
      });

      // Draw frame
      ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
    }

    // Capture frame
    const frame = await createImageBitmap(canvas);
    frames.push(frame);

    onProgress?.(Math.round((i / frameCount) * 50));
  }

  // Restore original time
  if (isVideo) {
    source.currentTime = originalTime;
  }

  return frames;
}

/** Encode frames to WebP animation (if supported) or fallback */
async function encodeClip(
  frames: ImageBitmap[],
  options: ClipOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const { format, fps, quality, resolution } = options;

  // For MVP, we'll use WebP animation or frame sequence
  if (format === 'webp') {
    // Try to create animated WebP
    return await encodeWebPAnimation(frames, fps, quality, resolution, onProgress);
  }

  // For MP4/GIF, return as frame sequence for server-side encoding
  // or use MediaRecorder API if available
  if (format === 'mp4' && 'MediaRecorder' in window) {
    return await encodeMediaRecorder(frames, fps, options, onProgress);
  }

  // Fallback: return as frame sequence
  return await createFrameSequence(frames, format, onProgress);
}

/** Encode to WebP animation */
async function encodeWebPAnimation(
  frames: ImageBitmap[],
  fps: number,
  quality: ClipOptions['quality'],
  resolution: ExportResolution,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  // WebP animation requires canvas-writer or similar
  // For now, return first frame with metadata
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const width = resolution === NATIVE_RESOLUTION ? frames[0].width : resolution.width;
  const height = resolution === NATIVE_RESOLUTION ? frames[0].height : resolution.height;

  canvas.width = width;
  canvas.height = height;

  const qualityValue = quality === 'ultra' ? 0.95 : quality === 'high' ? 0.85 : 0.7;

  // Create individual frame blobs
  const frameBlobs: Blob[] = [];
  for (let i = 0; i < frames.length; i++) {
    ctx.drawImage(frames[i], 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/webp', qualityValue);
    });
    frameBlobs.push(blob);
    onProgress?.(50 + Math.round((i / frames.length) * 50));
  }

  // For now, return first frame
  // In production, this would use a WebP encoder WASM module
  return frameBlobs[0];
}

/** Encode using MediaRecorder API */
async function encodeMediaRecorder(
  frames: ImageBitmap[],
  fps: number,
  options: ClipOptions,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  const { resolution, includeAudio, audioVolume } = options;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  const width = resolution === NATIVE_RESOLUTION ? frames[0].width : resolution.width;
  const height = resolution === NATIVE_RESOLUTION ? frames[0].height : resolution.height;

  canvas.width = width;
  canvas.height = height;

  // Get canvas stream
  const stream = canvas.captureStream(fps);

  // Add audio if source is video with audio
  if (includeAudio && options.target instanceof HTMLVideoElement) {
    const videoStream = options.target.captureStream();
    const audioTracks = videoStream.getAudioTracks();
    audioTracks.forEach((track) => stream.addTrack(track));
  }

  // Setup MediaRecorder
  const mimeType = 'video/webm;codecs=vp9';
  const mediaRecorder = new MediaRecorder(stream, {
    mimeType,
    videoBitsPerSecond: 5000000, // 5 Mbps
  });

  const chunks: Blob[] = [];
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
    }
  };

  return new Promise((resolve, reject) => {
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType });
      resolve(blob);
    };

    mediaRecorder.onerror = (e) => {
      reject(new Error(`MediaRecorder error: ${e}`));
    };

    // Start recording
    mediaRecorder.start();

    // Draw frames
    let frameIndex = 0;
    const frameInterval = 1000 / fps;

    const drawFrame = () => {
      if (frameIndex >= frames.length) {
        mediaRecorder.stop();
        return;
      }

      ctx.drawImage(frames[frameIndex], 0, 0, width, height);
      frameIndex++;

      onProgress?.(50 + Math.round((frameIndex / frames.length) * 50));

      setTimeout(drawFrame, frameInterval);
    };

    drawFrame();
  });
}

/** Create frame sequence for server-side encoding */
async function createFrameSequence(
  frames: ImageBitmap[],
  format: string,
  onProgress?: (progress: number) => void
): Promise<Blob> {
  // Create a JSON manifest with frame metadata
  const manifest = {
    type: 'frame-sequence',
    format,
    frameCount: frames.length,
    frames: frames.map((f, i) => ({
      index: i,
      width: f.width,
      height: f.height,
    })),
  };

  // For now, return first frame as placeholder
  const canvas = document.createElement('canvas');
  canvas.width = frames[0].width;
  canvas.height = frames[0].height;
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(frames[0], 0, 0);

  onProgress?.(100);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}

/** Validate clip options */
function validateClipOptions(options: ClipOptions): void {
  const duration = options.endTime - options.startTime;

  if (duration < EXPORT_LIMITS.CLIP_MIN_DURATION) {
    throw new Error(`Clip duration (${duration}s) below minimum (${EXPORT_LIMITS.CLIP_MIN_DURATION}s)`);
  }

  if (duration > EXPORT_LIMITS.CLIP_MAX_DURATION) {
    throw new Error(`Clip duration (${duration}s) exceeds maximum (${EXPORT_LIMITS.CLIP_MAX_DURATION}s)`);
  }

  if (options.fps < EXPORT_LIMITS.CLIP_MIN_FPS || options.fps > EXPORT_LIMITS.CLIP_MAX_FPS) {
    throw new Error(`FPS (${options.fps}) must be between ${EXPORT_LIMITS.CLIP_MIN_FPS} and ${EXPORT_LIMITS.CLIP_MAX_FPS}`);
  }
}

/** Capture clip with progress tracking */
export async function captureClip(
  options: Partial<ClipOptions> & {
    target: HTMLCanvasElement | HTMLVideoElement;
    startTime: number;
    endTime: number;
  },
  onProgress?: (progress: ExportProgress) => void
): Promise<{ blob: Blob; progress: ExportProgress }> {
  const opts: ClipOptions = {
    ...DEFAULT_CLIP_OPTIONS,
    ...options,
    metadata: {
      platform: '4NJZ4-TENET',
      specmapVersion: '2.0.0',
      timestamp: Date.now(),
      ...options.metadata,
    } as ExportMetadata,
  };

  validateClipOptions(opts);

  const clipId = generateClipId();

  // Initialize progress
  let progress: ExportProgress = {
    id: clipId,
    type: 'clip',
    status: 'processing',
    progress: 0,
    stage: 'Initializing clip capture...',
    options: opts,
    createdAt: Date.now(),
  };
  onProgress?.(progress);

  try {
    // Step 1: Capture frames (0-50%)
    progress = { ...progress, progress: 5, stage: 'Capturing frames...' };
    onProgress?.(progress);

    const frames = await captureFrames(
      opts.target,
      opts.startTime,
      opts.endTime,
      opts.fps,
      (p) => {
        progress = { ...progress, progress: p };
        onProgress?.(progress);
      }
    );

    // Step 2: Encode clip (50-100%)
    progress = { ...progress, progress: 50, stage: 'Encoding clip...' };
    onProgress?.(progress);

    const blob = await encodeClip(frames, opts, (p) => {
      progress = { ...progress, progress: p };
      onProgress?.(progress);
    });

    // Check size limit
    if (blob.size > EXPORT_LIMITS.CLIP_MAX_SIZE) {
      throw new Error(`Clip size (${(blob.size / 1024 / 1024).toFixed(1)}MB) exceeds limit (50MB)`);
    }

    // Cleanup frames
    frames.forEach((f) => f.close());

    // Complete
    progress = {
      ...progress,
      status: 'complete',
      progress: 100,
      stage: 'Clip export complete',
      result: blob,
      completedAt: Date.now(),
    };
    onProgress?.(progress);

    return { blob, progress };
  } catch (error) {
    progress = {
      ...progress,
      status: 'error',
      stage: 'Clip export failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    onProgress?.(progress);
    throw error;
  }
}

/** Quick clip capture */
export async function quickClip(
  target: HTMLCanvasElement | HTMLVideoElement,
  startTime: number,
  endTime: number,
  format: 'mp4' | 'gif' | 'webp' = 'mp4'
): Promise<Blob> {
  const { blob } = await captureClip({ target, startTime, endTime, format });
  return blob;
}

/** Estimate clip file size */
export function estimateClipSize(
  duration: number,
  fps: number,
  resolution: ExportResolution,
  quality: ClipOptions['quality']
): number {
  const width = resolution === NATIVE_RESOLUTION ? 1920 : resolution.width;
  const height = resolution === NATIVE_RESOLUTION ? 1080 : resolution.height;
  const frames = duration * fps;

  // Rough estimate: 3 bytes per pixel * compression factor
  const compressionFactor = quality === 'ultra' ? 0.1 : quality === 'high' ? 0.15 : 0.25;
  const frameSize = width * height * 3 * compressionFactor;

  return frameSize * frames;
}

/** Get recommended clip settings */
export function getRecommendedClipSettings(
  availableStorage: number
): { fps: number; quality: ClipOptions['quality']; maxDuration: number } {
  if (availableStorage > 100 * 1024 * 1024) {
    // > 100MB available
    return { fps: 60, quality: 'high', maxDuration: 60 };
  } else if (availableStorage > 50 * 1024 * 1024) {
    // > 50MB available
    return { fps: 30, quality: 'high', maxDuration: 45 };
  } else if (availableStorage > 20 * 1024 * 1024) {
    // > 20MB available
    return { fps: 30, quality: 'medium', maxDuration: 30 };
  }
  // Limited storage
  return { fps: 15, quality: 'medium', maxDuration: 15 };
}
