/**
 * Export Web Worker
 * Off-thread processing for screenshot and clip exports
 * [Ver001.000]
 */

import type {
  WorkerMessage,
  ScreenshotWorkerMessage,
  ClipWorkerMessage,
  ExportProgress,
} from './types';

/** Worker state */
interface WorkerState {
  activeJobs: Map<string, { abort: boolean }>;
}

const state: WorkerState = {
  activeJobs: new Map(),
};

/** Handle incoming messages */
self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const { type, id } = event.data;

  switch (type) {
    case 'init':
      postMessage({ type: 'init', id, payload: { ready: true } });
      break;

    case 'process':
      handleProcess(event.data as ScreenshotWorkerMessage | ClipWorkerMessage);
      break;

    default:
      postMessage({ type: 'error', id, payload: { error: 'Unknown message type' } });
  }
};

/** Handle processing request */
async function handleProcess(
  message: ScreenshotWorkerMessage | ClipWorkerMessage
): Promise<void> {
  const { id } = message;

  // Register job
  state.activeJobs.set(id, { abort: false });

  try {
    if ('imageData' in message) {
      await processScreenshot(message);
    } else if ('frames' in message) {
      await processClip(message);
    }
  } catch (error) {
    postMessage({
      type: 'error',
      id,
      payload: { error: error instanceof Error ? error.message : 'Processing failed' },
    });
  } finally {
    state.activeJobs.delete(id);
  }
}

/** Process screenshot in worker */
async function processScreenshot(message: ScreenshotWorkerMessage): Promise<void> {
  const { id, imageData, options } = message;

  // Report progress
  postProgress(id, 10, 'Scaling image...');

  // Create offscreen canvas
  const canvas = new OffscreenCanvas(options.resolution.width || 1920, options.resolution.height || 1080);
  const ctx = canvas.getContext('2d')!;

  // Draw image data
  ctx.drawImage(imageData, 0, 0, canvas.width, canvas.height);

  // Check abort
  if (checkAbort(id)) return;

  postProgress(id, 50, 'Applying filters...');

  // Apply quality/compression settings
  const imageBitmap = canvas.transferToImageBitmap();

  postProgress(id, 90, 'Encoding...');

  // Convert to blob
  const blob = await imageBitmapToBlob(imageBitmap, options.format, options.quality);

  postProgress(id, 100, 'Complete', blob);
}

/** Process clip in worker */
async function processClip(message: ClipWorkerMessage): Promise<void> {
  const { id, frames, options } = message;

  const totalFrames = frames.length;
  const processedFrames: Blob[] = [];

  for (let i = 0; i < totalFrames; i++) {
    if (checkAbort(id)) return;

    const frame = frames[i];
    const progress = Math.round((i / totalFrames) * 80);
    postProgress(id, progress, `Processing frame ${i + 1}/${totalFrames}...`);

    // Process frame
    const canvas = new OffscreenCanvas(frame.width, frame.height);
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(frame, 0, 0);

    const blob = await canvas.convertToBlob({
      type: 'image/webp',
      quality: options.quality === 'ultra' ? 0.95 : options.quality === 'high' ? 0.85 : 0.7,
    });

    processedFrames.push(blob);
  }

  postProgress(id, 90, 'Encoding video...');

  // For MVP, return as image sequence (actual video encoding would require WASM codec)
  const resultBlob = await createVideoFromFrames(processedFrames, options);

  postProgress(id, 100, 'Complete', resultBlob);
}

/** Check if job was aborted */
function checkAbort(id: string): boolean {
  const job = state.activeJobs.get(id);
  return job?.abort ?? false;
}

/** Post progress update */
function postProgress(
  id: string,
  progress: number,
  stage: string,
  result?: Blob
): void {
  const payload: Partial<ExportProgress> = {
    id,
    status: progress === 100 ? 'complete' : 'processing',
    progress,
    stage,
  };

  if (result) {
    payload.result = result;
  }

  postMessage({ type: 'progress', id, payload });
}

/** Convert ImageBitmap to Blob */
async function imageBitmapToBlob(
  bitmap: ImageBitmap,
  format: string,
  quality: number
): Promise<Blob> {
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext('2d')!;
  ctx.drawImage(bitmap, 0, 0);

  const mimeType = format === 'jpg' ? 'image/jpeg' : `image/${format}`;

  return canvas.convertToBlob({
    type: mimeType,
    quality: format === 'png' ? undefined : quality,
  });
}

/** Create video from frame blobs (placeholder implementation) */
async function createVideoFromFrames(
  frames: Blob[],
  options: ClipWorkerMessage['options']
): Promise<Blob> {
  // In production, this would use a WASM video encoder like ffmpeg.wasm
  // For MVP, we return a ZIP-like blob with metadata
  const metadata = {
    type: 'clip-sequence',
    format: options.format,
    fps: options.fps,
    frameCount: frames.length,
  };

  // Return first frame as placeholder with metadata
  const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });

  // Combine metadata and first frame
  return new Blob([metadataBlob, frames[0]], { type: 'application/x-specmap-clip' });
}

// Export empty object to make this a module
export {};
