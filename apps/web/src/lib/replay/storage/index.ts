/**
 * Replay Storage Module
 * IndexedDB storage, metadata indexing, and cloud upload
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-E
 * Team: Replay 2.0 Core (TL-S2)
 */

// IndexedDB Storage
export {
  // Core operations
  storeReplay,
  retrieveReplay,
  getMetadata,
  deleteReplay,
  queryReplays,
  
  // Filters & discovery
  getUniqueMaps,
  getUniqueTags,
  
  // Tag management
  addTags,
  removeTags,
  
  // Thumbnails
  storeThumbnail,
  getThumbnail,
  
  // Quota management
  getStorageQuota,
  cleanupStorage,
  
  // Database lifecycle
  closeDB,
  deleteDB,
  
  // Compression
  compressReplay,
  decompressReplay,
} from './indexeddb';

export type {
  StoredReplay,
  ReplayMetadata,
  ReplayThumbnail,
  TagIndex,
  StorageQuota,
  StorageFilters,
  StorageSortOptions,
  StorageQueryResult,
} from './indexeddb';

// Metadata Indexing
export {
  extractMetadata,
  buildIndex,
  searchMetadata,
  extractAllTags,
  getTagStats,
  serializeIndex,
  deserializeIndex,
} from './metadata';

export type {
  ExtractedMetadata,
  MetadataIndex,
  FullTextSearchResult,
  SearchQuery,
} from './metadata';

// Cloud Upload
export {
  uploadFile,
  uploadFileInChunks,
  requestPresignedUrl,
  completeMultipartUpload,
  UploadManager,
} from './cloudUpload';

export type {
  PresignedUrlRequest,
  PresignedUrlResponse,
  UploadProgress,
  UploadOptions,
  UploadResult,
  UploadError,
  ChunkUploadResult,
  UploadTask,
} from './cloudUpload';
