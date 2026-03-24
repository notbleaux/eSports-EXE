/**
 * Ingestion API Client
 * ====================
 * RESTful API client for external esports data ingestion with
 * authentication, rate limiting, and retry logic.
 * 
 * [Ver001.000] - Ingestion API client
 * 
 * Agent: TL-S6-3-A
 * Team: Data Ingestion (TL-S6)
 */

import type {
  IngestionApiConfig,
  IngestionApiResponse,
  ApiError,
  ResponseMetadata,
  DataSourceConfig,
  DataSourceHealth,
  BatchJob,
  BatchFilters,
  BatchSchedule,
  IngestionHistoryEntry,
  IngestionDataType,
  RawDataRecord,
  NormalizedRecord,
  DataSourceType,
} from './types';

// =============================================================================
// Configuration
// =============================================================================

const DEFAULT_CONFIG: Partial<IngestionApiConfig> = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  rateLimitPerSecond: 10,
};

// =============================================================================
// Rate Limiter
// =============================================================================

class RateLimiter {
  private tokens: number;
  private lastRefill: number;
  private readonly maxTokens: number;
  private readonly refillRate: number;

  constructor(maxRequestsPerSecond: number) {
    this.maxTokens = maxRequestsPerSecond;
    this.tokens = maxRequestsPerSecond;
    this.refillRate = maxRequestsPerSecond;
    this.lastRefill = Date.now();
  }

  async acquire(): Promise<void> {
    this.refill();
    
    if (this.tokens >= 1) {
      this.tokens--;
      return;
    }

    // Wait for token
    const waitTime = (1 - this.tokens) * (1000 / this.refillRate);
    await sleep(waitTime);
    return this.acquire();
  }

  private refill(): void {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.maxTokens, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }
}

// =============================================================================
// Retry Handler
// =============================================================================

interface RetryConfig {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier: number;
  retryableStatuses: number[];
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  retryDelay: 1000,
  backoffMultiplier: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
};

async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const retryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | undefined;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === retryConfig.maxRetries) {
        break;
      }

      // Check if error is retryable
      if (!isRetryableError(error, retryConfig.retryableStatuses)) {
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = retryConfig.retryDelay * Math.pow(retryConfig.backoffMultiplier, attempt);
      await sleep(delay);
    }
  }

  throw lastError;
}

function isRetryableError(error: unknown, retryableStatuses: number[]): boolean {
  if (error && typeof error === 'object') {
    const status = (error as { status?: number }).status;
    if (status && retryableStatuses.includes(status)) {
      return true;
    }
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// =============================================================================
// API Client
// =============================================================================

export class IngestionApiClient {
  private config: IngestionApiConfig;
  private rateLimiter: RateLimiter;
  private abortController: AbortController | null = null;
  private requestQueue: Map<string, Promise<unknown>> = new Map();

  constructor(config: Partial<IngestionApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config } as IngestionApiConfig;
    this.rateLimiter = new RateLimiter(this.config.rateLimitPerSecond);
  }

  // ===========================================================================
  // Core HTTP Methods
  // ===========================================================================

  private async request<T>(
    method: string,
    endpoint: string,
    options: {
      body?: unknown;
      params?: Record<string, string>;
      headers?: Record<string, string>;
      skipAuth?: boolean;
    } = {}
  ): Promise<IngestionApiResponse<T>> {
    // Apply rate limiting
    await this.rateLimiter.acquire();

    const url = this.buildUrl(endpoint, options.params);
    const headers = this.buildHeaders(options.headers, options.skipAuth);

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: this.getSignal(),
    };

    if (options.body) {
      fetchOptions.body = JSON.stringify(options.body);
    }

    const startTime = Date.now();

    try {
      const response = await withRetry(
        () => fetch(url, fetchOptions),
        {
          maxRetries: this.config.retries,
          retryDelay: this.config.retryDelay,
        }
      );

      const metadata: ResponseMetadata = {
        requestId: response.headers.get('X-Request-ID') || this.generateRequestId(),
        timestamp: new Date().toISOString(),
        rateLimitRemaining: this.parseHeaderNumber(response.headers.get('X-RateLimit-Remaining')),
        rateLimitReset: this.parseHeaderNumber(response.headers.get('X-RateLimit-Reset')),
        cacheHit: response.headers.get('X-Cache') === 'HIT',
        responseTime: Date.now() - startTime,
      };

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return {
          success: false,
          error: this.createApiError(response.status, errorData),
          metadata,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data,
        metadata,
      };
    } catch (error) {
      return {
        success: false,
        error: this.createNetworkError(error),
        metadata: {
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString(),
          responseTime: Date.now() - startTime,
        },
      };
    }
  }

  private buildUrl(endpoint: string, params?: Record<string, string>): string {
    const url = new URL(endpoint, this.config.baseUrl);
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value);
        }
      });
    }
    return url.toString();
  }

  private buildHeaders(
    customHeaders?: Record<string, string>,
    skipAuth = false
  ): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...this.config.headers,
      ...customHeaders,
    };

    if (!skipAuth && this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  private getSignal(): AbortSignal | undefined {
    this.abortController = new AbortController();
    
    // Set timeout
    const timeoutId = setTimeout(() => {
      this.abortController?.abort();
    }, this.config.timeout);

    // Clean up timeout when request completes
    const cleanup = () => clearTimeout(timeoutId);
    this.abortController.signal.addEventListener('abort', cleanup, { once: true });

    return this.abortController.signal;
  }

  private parseHeaderNumber(value: string | null): number | undefined {
    if (!value) return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createApiError(status: number, data: Record<string, unknown>): ApiError {
    return {
      code: (data.code as string) || `HTTP_${status}`,
      message: (data.message as string) || `HTTP Error ${status}`,
      details: data.details as Record<string, unknown>,
      retryable: [408, 429, 500, 502, 503, 504].includes(status),
    };
  }

  private createNetworkError(error: unknown): ApiError {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return {
          code: 'TIMEOUT',
          message: 'Request timed out',
          retryable: true,
        };
      }
      return {
        code: 'NETWORK_ERROR',
        message: error.message,
        retryable: true,
      };
    }
    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      retryable: false,
    };
  }

  // ===========================================================================
  // Public API Methods
  // ===========================================================================

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    params?: Record<string, string>,
    headers?: Record<string, string>
  ): Promise<IngestionApiResponse<T>> {
    return this.request<T>('GET', endpoint, { params, headers });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<IngestionApiResponse<T>> {
    return this.request<T>('POST', endpoint, { body, headers });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<IngestionApiResponse<T>> {
    return this.request<T>('PUT', endpoint, { body, headers });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body: unknown,
    headers?: Record<string, string>
  ): Promise<IngestionApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, { body, headers });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    headers?: Record<string, string>
  ): Promise<IngestionApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, { headers });
  }

  /**
   * Cancel pending requests
   */
  cancel(): void {
    this.abortController?.abort();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<IngestionApiConfig>): void {
    this.config = { ...this.config, ...config };
    this.rateLimiter = new RateLimiter(this.config.rateLimitPerSecond);
  }
}

// =============================================================================
// Data Source API
// =============================================================================

export class DataSourceApi {
  private client: IngestionApiClient;

  constructor(client: IngestionApiClient) {
    this.client = client;
  }

  /**
   * Get all configured data sources
   */
  async getSources(): Promise<IngestionApiResponse<DataSourceConfig[]>> {
    return this.client.get<DataSourceConfig[]>('/ingestion/sources');
  }

  /**
   * Get a specific data source
   */
  async getSource(id: string): Promise<IngestionApiResponse<DataSourceConfig>> {
    return this.client.get<DataSourceConfig>(`/ingestion/sources/${id}`);
  }

  /**
   * Create a new data source
   */
  async createSource(config: Omit<DataSourceConfig, 'id'>): Promise<IngestionApiResponse<DataSourceConfig>> {
    return this.client.post<DataSourceConfig>('/ingestion/sources', config);
  }

  /**
   * Update a data source
   */
  async updateSource(
    id: string,
    updates: Partial<DataSourceConfig>
  ): Promise<IngestionApiResponse<DataSourceConfig>> {
    return this.client.patch<DataSourceConfig>(`/ingestion/sources/${id}`, updates);
  }

  /**
   * Delete a data source
   */
  async deleteSource(id: string): Promise<IngestionApiResponse<void>> {
    return this.client.delete<void>(`/ingestion/sources/${id}`);
  }

  /**
   * Test data source connection
   */
  async testConnection(id: string): Promise<IngestionApiResponse<{ success: boolean; message: string }>> {
    return this.client.post<{ success: boolean; message: string }>(`/ingestion/sources/${id}/test`, {});
  }

  /**
   * Get data source health
   */
  async getHealth(id: string): Promise<IngestionApiResponse<DataSourceHealth>> {
    return this.client.get<DataSourceHealth>(`/ingestion/sources/${id}/health`);
  }

  /**
   * Sync data from source
   */
  async syncSource(
    id: string,
    dataTypes?: IngestionDataType[],
    filters?: BatchFilters
  ): Promise<IngestionApiResponse<BatchJob>> {
    return this.client.post<BatchJob>(`/ingestion/sources/${id}/sync`, {
      dataTypes,
      filters,
    });
  }
}

// =============================================================================
// Batch Job API
// =============================================================================

export class BatchJobApi {
  private client: IngestionApiClient;

  constructor(client: IngestionApiClient) {
    this.client = client;
  }

  /**
   * Get all batch jobs
   */
  async getJobs(params?: {
    status?: string;
    sourceType?: string;
    page?: number;
    limit?: number;
  }): Promise<IngestionApiResponse<BatchJob[]>> {
    return this.client.get<BatchJob[]>('/ingestion/jobs', params as Record<string, string>);
  }

  /**
   * Get a specific batch job
   */
  async getJob(id: string): Promise<IngestionApiResponse<BatchJob>> {
    return this.client.get<BatchJob>(`/ingestion/jobs/${id}`);
  }

  /**
   * Create a new batch job
   */
  async createJob(
    name: string,
    sourceConfig: DataSourceConfig,
    dataTypes: IngestionDataType[],
    options?: {
      priority?: 'low' | 'normal' | 'high' | 'critical';
      filters?: BatchFilters;
      schedule?: BatchSchedule;
    }
  ): Promise<IngestionApiResponse<BatchJob>> {
    return this.client.post<BatchJob>('/ingestion/jobs', {
      name,
      sourceConfig,
      dataTypes,
      ...options,
    });
  }

  /**
   * Cancel a batch job
   */
  async cancelJob(id: string): Promise<IngestionApiResponse<BatchJob>> {
    return this.client.post<BatchJob>(`/ingestion/jobs/${id}/cancel`, {});
  }

  /**
   * Pause a batch job
   */
  async pauseJob(id: string): Promise<IngestionApiResponse<BatchJob>> {
    return this.client.post<BatchJob>(`/ingestion/jobs/${id}/pause`, {});
  }

  /**
   * Resume a batch job
   */
  async resumeJob(id: string): Promise<IngestionApiResponse<BatchJob>> {
    return this.client.post<BatchJob>(`/ingestion/jobs/${id}/resume`, {});
  }

  /**
   * Get job progress
   */
  async getJobProgress(id: string): Promise<IngestionApiResponse<BatchJob['progress']>> {
    return this.client.get<BatchJob['progress']>(`/ingestion/jobs/${id}/progress`);
  }

  /**
   * Get job results
   */
  async getJobResults(id: string): Promise<IngestionApiResponse<BatchJob['results']>> {
    return this.client.get<BatchJob['results']>(`/ingestion/jobs/${id}/results`);
  }
}

// =============================================================================
// Data API
// =============================================================================

export class DataApi {
  private client: IngestionApiClient;

  constructor(client: IngestionApiClient) {
    this.client = client;
  }

  /**
   * Get raw data records
   */
  async getRawData(params?: {
    sourceType?: DataSourceType;
    dataType?: IngestionDataType;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<IngestionApiResponse<RawDataRecord[]>> {
    return this.client.get<RawDataRecord[]>('/ingestion/data/raw', params as Record<string, string>);
  }

  /**
   * Get normalized data records
   */
  async getNormalizedData(params?: {
    sourceType?: DataSourceType;
    dataType?: IngestionDataType;
    page?: number;
    limit?: number;
  }): Promise<IngestionApiResponse<NormalizedRecord[]>> {
    return this.client.get<NormalizedRecord[]>('/ingestion/data/normalized', params as Record<string, string>);
  }

  /**
   * Submit raw data for processing
   */
  async submitRawData(data: unknown, metadata: {
    sourceType: DataSourceType;
    dataType: IngestionDataType;
    sourceId: string;
  }): Promise<IngestionApiResponse<{ recordId: string; status: string }>> {
    return this.client.post<{ recordId: string; status: string }>('/ingestion/data/raw', {
      data,
      metadata,
    });
  }

  /**
   * Trigger data normalization
   */
  async normalizeData(recordIds: string[]): Promise<IngestionApiResponse<{ processed: number; failed: number }>> {
    return this.client.post<{ processed: number; failed: number }>('/ingestion/data/normalize', {
      recordIds,
    });
  }
}

// =============================================================================
// History API
// =============================================================================

export class HistoryApi {
  private client: IngestionApiClient;

  constructor(client: IngestionApiClient) {
    this.client = client;
  }

  /**
   * Get ingestion history
   */
  async getHistory(params?: {
    sourceType?: string;
    dataType?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: number;
    limit?: number;
  }): Promise<IngestionApiResponse<IngestionHistoryEntry[]>> {
    return this.client.get<IngestionHistoryEntry[]>('/ingestion/history', params as Record<string, string>);
  }

  /**
   * Get ingestion statistics
   */
  async getStatistics(period: 'hour' | 'day' | 'week' | 'month'): Promise<IngestionApiResponse<{
    totalRecords: number;
    successRate: number;
    avgProcessingTime: number;
    recordsBySource: Record<string, number>;
    recordsByType: Record<string, number>;
  }>> {
    return this.client.get('/ingestion/history/statistics', { period });
  }
}

// =============================================================================
// Main API Export
// =============================================================================

export class IngestionApi {
  client: IngestionApiClient;
  sources: DataSourceApi;
  jobs: BatchJobApi;
  data: DataApi;
  history: HistoryApi;

  constructor(config: Partial<IngestionApiConfig> = {}) {
    this.client = new IngestionApiClient(config);
    this.sources = new DataSourceApi(this.client);
    this.jobs = new BatchJobApi(this.client);
    this.data = new DataApi(this.client);
    this.history = new HistoryApi(this.client);
  }

  /**
   * Update API configuration
   */
  updateConfig(config: Partial<IngestionApiConfig>): void {
    this.client.updateConfig(config);
  }

  /**
   * Cancel all pending requests
   */
  cancel(): void {
    this.client.cancel();
  }
}

// =============================================================================
// Factory Functions
// =============================================================================

export function createIngestionApi(config: Partial<IngestionApiConfig> = {}): IngestionApi {
  return new IngestionApi(config);
}

export function createApiClient(config: Partial<IngestionApiConfig> = {}): IngestionApiClient {
  return new IngestionApiClient(config);
}

// Default export
export default IngestionApi;
