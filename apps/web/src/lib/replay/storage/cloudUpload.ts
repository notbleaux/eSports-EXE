/**
 * Cloud Upload Pattern
 * Presigned URL uploads with progress tracking, retry logic, and chunked uploads
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-E
 * Team: Replay 2.0 Core (TL-S2)
 */

// ============================================================================
// Types
// ============================================================================

export interface PresignedUrlRequest {
  filename: string;
  contentType: string;
  fileSize: number;
  metadata: {
    matchId: string;
    gameType: string;
    mapName: string;
    timestamp: number;
    duration: number;
  };
}

export interface PresignedUrlResponse {
  uploadId: string;
  uploadUrl: string;
  fields?: Record<string, string>;
  headers?: Record<string, string>;
  expiresAt: number;
  supportsChunking: boolean;
  maxChunkSize?: number;
  maxRetries?: number;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
  speed: number; // bytes per second
  estimatedTimeRemaining: number; // seconds
}

export interface UploadOptions {
  retryCount?: number;
  retryDelay?: number;
  chunkSize?: number; // bytes, default 5MB
  parallelChunks?: number;
  onProgress?: (progress: UploadProgress) => void;
  onRetry?: (attempt: number, error: Error) => void;
  abortSignal?: AbortSignal;
}

export interface UploadResult {
  success: boolean;
  uploadId: string;
  url?: string;
  error?: UploadError;
}

export interface UploadError {
  code: string;
  message: string;
  retryable: boolean;
  details?: unknown;
}

export interface ChunkUploadResult {
  chunkIndex: number;
  etag: string;
  success: boolean;
  error?: UploadError;
}

// ============================================================================
// Presigned URL API
// ============================================================================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1';

/**
 * Request a presigned URL from the backend
 */
export async function requestPresignedUrl(
  request: PresignedUrlRequest
): Promise<PresignedUrlResponse> {
  const response = await fetch(`${API_BASE_URL}/replays/upload-url`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to get presigned URL: ${error.message}`);
  }
  
  return response.json();
}

/**
 * Complete a multipart upload
 */
export async function completeMultipartUpload(
  uploadId: string,
  parts: { partNumber: number; etag: string }[]
): Promise<{ success: boolean; url: string }> {
  const response = await fetch(`${API_BASE_URL}/replays/upload-complete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ uploadId, parts }),
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Failed to complete upload: ${error.message}`);
  }
  
  return response.json();
}

// ============================================================================
// Upload Functions
// ============================================================================

const DEFAULT_CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY = 1000; // 1 second

/**
 * Upload a file using presigned URL with automatic retry
 */
export async function uploadFile(
  file: File | Blob,
  presignedUrl: PresignedUrlResponse,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelay = DEFAULT_RETRY_DELAY,
    onProgress,
    onRetry,
    abortSignal,
  } = options;
  
  let lastError: Error | undefined;
  
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    // Check if aborted
    if (abortSignal?.aborted) {
      return {
        success: false,
        uploadId: presignedUrl.uploadId,
        error: {
          code: 'ABORTED',
          message: 'Upload was aborted',
          retryable: false,
        },
      };
    }
    
    try {
      return await attemptUpload(file, presignedUrl, onProgress, abortSignal);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Check if error is retryable
      const isRetryable = isRetryableError(error);
      
      if (!isRetryable || attempt >= retryCount) {
        return {
          success: false,
          uploadId: presignedUrl.uploadId,
          error: {
            code: 'UPLOAD_FAILED',
            message: lastError.message,
            retryable: isRetryable,
            details: error,
          },
        };
      }
      
      // Notify retry
      onRetry?.(attempt + 1, lastError);
      
      // Wait before retry with exponential backoff
      const delay = retryDelay * Math.pow(2, attempt);
      await sleep(delay);
    }
  }
  
  return {
    success: false,
    uploadId: presignedUrl.uploadId,
    error: {
      code: 'UPLOAD_FAILED',
      message: lastError?.message || 'Upload failed after retries',
      retryable: false,
    },
  };
}

/**
 * Attempt a single upload
 */
async function attemptUpload(
  file: File | Blob,
  presignedUrl: PresignedUrlResponse,
  onProgress?: (progress: UploadProgress) => void,
  abortSignal?: AbortSignal
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    // Track progress
    let startTime = Date.now();
    let lastLoaded = 0;
    let lastTime = startTime;
    
    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable) return;
      
      const now = Date.now();
      const timeDiff = (now - lastTime) / 1000;
      const loadedDiff = event.loaded - lastLoaded;
      
      const speed = timeDiff > 0 ? loadedDiff / timeDiff : 0;
      const remaining = event.total - event.loaded;
      const estimatedTimeRemaining = speed > 0 ? remaining / speed : 0;
      
      onProgress?.({
        loaded: event.loaded,
        total: event.total,
        percent: (event.loaded / event.total) * 100,
        speed,
        estimatedTimeRemaining,
      });
      
      lastLoaded = event.loaded;
      lastTime = now;
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({
          success: true,
          uploadId: presignedUrl.uploadId,
          url: presignedUrl.uploadUrl.split('?')[0], // Remove query params
        });
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    });
    
    xhr.addEventListener('error', () => {
      reject(new Error('Network error during upload'));
    });
    
    xhr.addEventListener('abort', () => {
      reject(new Error('Upload was aborted'));
    });
    
    // Handle abort signal
    abortSignal?.addEventListener('abort', () => {
      xhr.abort();
    });
    
    xhr.open('PUT', presignedUrl.uploadUrl);
    
    // Set headers if provided
    if (presignedUrl.headers) {
      for (const [key, value] of Object.entries(presignedUrl.headers)) {
        xhr.setRequestHeader(key, value);
      }
    }
    
    xhr.send(file);
  });
}

/**
 * Upload large file in chunks using multipart upload
 */
export async function uploadFileInChunks(
  file: File,
  getPresignedUrl: (partNumber: number) => Promise<PresignedUrlResponse>,
  options: UploadOptions = {}
): Promise<UploadResult> {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    parallelChunks = 3,
    retryCount = DEFAULT_RETRY_COUNT,
    retryDelay = DEFAULT_RETRY_DELAY,
    onProgress,
    onRetry,
    abortSignal,
  } = options;
  
  const totalSize = file.size;
  const chunks: { start: number; end: number; index: number }[] = [];
  
  // Calculate chunks
  for (let start = 0; start < totalSize; start += chunkSize) {
    const end = Math.min(start + chunkSize, totalSize);
    chunks.push({ start, end, index: chunks.length + 1 });
  }
  
  const totalChunks = chunks.length;
  const completedChunks: (ChunkUploadResult & { partNumber: number })[] = [];
  const progressMap = new Map<number, number>();
  
  // Upload chunks with parallelism
  const uploadChunk = async (chunkInfo: typeof chunks[0]): Promise<void> => {
    const chunk = file.slice(chunkInfo.start, chunkInfo.end);
    
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      if (abortSignal?.aborted) {
        throw new Error('Upload was aborted');
      }
      
      try {
        const presignedUrl = await getPresignedUrl(chunkInfo.index);
        
        // Create progress handler for this chunk
        const chunkOnProgress = onProgress 
          ? (progress: UploadProgress) => {
              progressMap.set(chunkInfo.index, progress.loaded);
              
              // Calculate total progress
              let totalLoaded = 0;
              for (let i = 1; i <= totalChunks; i++) {
                if (i === chunkInfo.index) {
                  totalLoaded += progress.loaded;
                } else if (progressMap.has(i)) {
                  // Use completed chunk size or last known progress
                  const chunkStart = (i - 1) * chunkSize;
                  const chunkEnd = Math.min(chunkStart + chunkSize, totalSize);
                  totalLoaded += chunkEnd - chunkStart;
                }
              }
              
              const now = Date.now();
              const elapsed = (now - startTime) / 1000;
              const speed = elapsed > 0 ? totalLoaded / elapsed : 0;
              const remaining = totalSize - totalLoaded;
              
              onProgress({
                loaded: totalLoaded,
                total: totalSize,
                percent: (totalLoaded / totalSize) * 100,
                speed,
                estimatedTimeRemaining: speed > 0 ? remaining / speed : 0,
              });
            }
          : undefined;
        
        const result = await uploadChunkWithProgress(
          chunk,
          presignedUrl,
          chunkOnProgress,
          abortSignal
        );
        
        if (result.success && result.etag) {
          completedChunks.push({
            chunkIndex: chunkInfo.index,
            partNumber: chunkInfo.index,
            etag: result.etag,
            success: true,
          });
          return;
        }
        
        throw new Error(result.error?.message || 'Chunk upload failed');
      } catch (error) {
        const isLastAttempt = attempt >= retryCount;
        const err = error instanceof Error ? error : new Error(String(error));
        
        if (!isRetryableError(error) || isLastAttempt) {
          throw err;
        }
        
        onRetry?.(attempt + 1, err);
        await sleep(retryDelay * Math.pow(2, attempt));
      }
    }
  };
  
  const startTime = Date.now();
  
  // Upload chunks in parallel batches
  try {
    for (let i = 0; i < chunks.length; i += parallelChunks) {
      const batch = chunks.slice(i, i + parallelChunks);
      await Promise.all(batch.map(uploadChunk));
    }
    
    // Complete multipart upload
    const parts = completedChunks
      .sort((a, b) => a.partNumber - b.partNumber)
      .map(c => ({ partNumber: c.partNumber, etag: c.etag }));
    
    const completion = await completeMultipartUpload(parts[0]?.etag || '', parts);
    
    return {
      success: completion.success,
      uploadId: parts[0]?.etag || '',
      url: completion.url,
    };
  } catch (error) {
    return {
      success: false,
      uploadId: '',
      error: {
        code: 'CHUNKED_UPLOAD_FAILED',
        message: error instanceof Error ? error.message : 'Chunked upload failed',
        retryable: isRetryableError(error),
      },
    };
  }
}

/**
 * Upload a single chunk with progress tracking
 */
async function uploadChunkWithProgress(
  chunk: Blob,
  presignedUrl: PresignedUrlResponse,
  onProgress?: (progress: UploadProgress) => void,
  abortSignal?: AbortSignal
): Promise<ChunkUploadResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    let startTime = Date.now();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || !onProgress) return;
      
      const now = Date.now();
      const elapsed = (now - startTime) / 1000;
      const speed = elapsed > 0 ? event.loaded / elapsed : 0;
      const remaining = event.total - event.loaded;
      
      onProgress({
        loaded: event.loaded,
        total: event.total,
        percent: (event.loaded / event.total) * 100,
        speed,
        estimatedTimeRemaining: speed > 0 ? remaining / speed : 0,
      });
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // Extract ETag from response headers
        const etag = xhr.getResponseHeader('ETag') || 
                     xhr.getResponseHeader('etag') || 
                     `part-${Date.now()}`;
        
        resolve({
          chunkIndex: 0,
          etag,
          success: true,
        });
      } else {
        reject(new Error(`Chunk upload failed with status ${xhr.status}`));
      }
    });
    
    xhr.addEventListener('error', () => reject(new Error('Network error')));
    xhr.addEventListener('abort', () => reject(new Error('Upload aborted')));
    
    abortSignal?.addEventListener('abort', () => xhr.abort());
    
    xhr.open('PUT', presignedUrl.uploadUrl);
    
    if (presignedUrl.headers) {
      for (const [key, value] of Object.entries(presignedUrl.headers)) {
        xhr.setRequestHeader(key, value);
      }
    }
    
    xhr.send(chunk);
  });
}

// ============================================================================
// Upload Manager
// ============================================================================

export interface UploadTask {
  id: string;
  file: File;
  metadata: PresignedUrlRequest['metadata'];
  status: 'pending' | 'uploading' | 'paused' | 'completed' | 'failed';
  progress: UploadProgress;
  error?: UploadError;
  url?: string;
  abortController: AbortController;
}

export class UploadManager {
  private tasks = new Map<string, UploadTask>();
  private onTaskUpdate?: (task: UploadTask) => void;
  private maxConcurrent: number;
  private activeUploads = 0;
  
  constructor(options: { maxConcurrent?: number; onTaskUpdate?: (task: UploadTask) => void } = {}) {
    this.maxConcurrent = options.maxConcurrent || 2;
    this.onTaskUpdate = options.onTaskUpdate;
  }
  
  /**
   * Add a file to the upload queue
   */
  addTask(file: File, metadata: PresignedUrlRequest['metadata']): string {
    const id = `upload-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    const task: UploadTask = {
      id,
      file,
      metadata,
      status: 'pending',
      progress: {
        loaded: 0,
        total: file.size,
        percent: 0,
        speed: 0,
        estimatedTimeRemaining: 0,
      },
      abortController: new AbortController(),
    };
    
    this.tasks.set(id, task);
    this.processQueue();
    
    return id;
  }
  
  /**
   * Process the upload queue
   */
  private async processQueue(): Promise<void> {
    if (this.activeUploads >= this.maxConcurrent) return;
    
    const pendingTask = Array.from(this.tasks.values())
      .find(t => t.status === 'pending');
    
    if (!pendingTask) return;
    
    this.activeUploads++;
    pendingTask.status = 'uploading';
    this.notifyUpdate(pendingTask);
    
    try {
      // Request presigned URL
      const presignedUrl = await requestPresignedUrl({
        filename: pendingTask.file.name,
        contentType: pendingTask.file.type || 'application/octet-stream',
        fileSize: pendingTask.file.size,
        metadata: pendingTask.metadata,
      });
      
      // Upload file
      const result = await uploadFile(pendingTask.file, presignedUrl, {
        onProgress: (progress) => {
          pendingTask.progress = progress;
          this.notifyUpdate(pendingTask);
        },
        onRetry: (attempt, error) => {
          console.warn(`[UploadManager] Retry ${attempt} for ${pendingTask.id}:`, error.message);
        },
        abortSignal: pendingTask.abortController.signal,
      });
      
      if (result.success) {
        pendingTask.status = 'completed';
        pendingTask.url = result.url;
        pendingTask.progress = {
          loaded: pendingTask.file.size,
          total: pendingTask.file.size,
          percent: 100,
          speed: 0,
          estimatedTimeRemaining: 0,
        };
      } else {
        pendingTask.status = 'failed';
        pendingTask.error = result.error;
      }
    } catch (error) {
      pendingTask.status = 'failed';
      pendingTask.error = {
        code: 'UPLOAD_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        retryable: isRetryableError(error),
      };
    } finally {
      this.activeUploads--;
      this.notifyUpdate(pendingTask);
      this.processQueue();
    }
  }
  
  /**
   * Pause an upload
   */
  pauseTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task || task.status !== 'uploading') return false;
    
    task.status = 'paused';
    task.abortController.abort();
    task.abortController = new AbortController();
    this.activeUploads--;
    this.notifyUpdate(task);
    this.processQueue();
    
    return true;
  }
  
  /**
   * Resume a paused upload
   */
  resumeTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task || task.status !== 'paused') return false;
    
    task.status = 'pending';
    task.progress.loaded = 0;
    task.error = undefined;
    this.notifyUpdate(task);
    this.processQueue();
    
    return true;
  }
  
  /**
   * Cancel an upload
   */
  cancelTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    
    const wasUploading = task.status === 'uploading';
    
    task.abortController.abort();
    task.status = 'failed';
    task.error = {
      code: 'CANCELLED',
      message: 'Upload was cancelled',
      retryable: false,
    };
    
    if (wasUploading) {
      this.activeUploads--;
    }
    
    this.notifyUpdate(task);
    this.processQueue();
    
    return true;
  }
  
  /**
   * Remove a task from the manager
   */
  removeTask(id: string): boolean {
    const task = this.tasks.get(id);
    if (!task) return false;
    
    if (task.status === 'uploading') {
      task.abortController.abort();
      this.activeUploads--;
    }
    
    this.tasks.delete(id);
    this.processQueue();
    
    return true;
  }
  
  /**
   * Get a task by ID
   */
  getTask(id: string): UploadTask | undefined {
    return this.tasks.get(id);
  }
  
  /**
   * Get all tasks
   */
  getAllTasks(): UploadTask[] {
    return Array.from(this.tasks.values());
  }
  
  /**
   * Clear completed and failed tasks
   */
  clearCompleted(): number {
    let cleared = 0;
    
    for (const [id, task] of this.tasks) {
      if (task.status === 'completed' || task.status === 'failed') {
        this.tasks.delete(id);
        cleared++;
      }
    }
    
    return cleared;
  }
  
  /**
   * Notify listeners of task update
   */
  private notifyUpdate(task: UploadTask): void {
    this.onTaskUpdate?.(task);
  }
  
  /**
   * Get overall progress
   */
  getOverallProgress(): { total: number; completed: number; percent: number } {
    const tasks = this.getAllTasks();
    if (tasks.length === 0) {
      return { total: 0, completed: 0, percent: 0 };
    }
    
    const total = tasks.reduce((sum, t) => sum + t.progress.total, 0);
    const loaded = tasks.reduce((sum, t) => sum + t.progress.loaded, 0);
    const completed = tasks.filter(t => t.status === 'completed').length;
    
    return {
      total: tasks.length,
      completed,
      percent: total > 0 ? (loaded / total) * 100 : 0,
    };
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Determine if an error is retryable
 */
function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    // Network errors are retryable
    if (error.message.includes('network') || 
        error.message.includes('timeout') ||
        error.message.includes('ECONNRESET') ||
        error.message.includes('ETIMEDOUT')) {
      return true;
    }
    
    // 5xx errors are retryable
    if (error.message.includes('status 5')) {
      return true;
    }
    
    // Aborted is not retryable
    if (error.message.includes('abort')) {
      return false;
    }
  }
  
  return false;
}

// ============================================================================
// Export
// ============================================================================

export default {
  uploadFile,
  uploadFileInChunks,
  requestPresignedUrl,
  completeMultipartUpload,
  UploadManager,
};
