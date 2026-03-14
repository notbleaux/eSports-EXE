/**
 * API Types - Request/Response type definitions
 * 
 * [Ver001.000]
 */

import type { PredictionResult } from '../types/ml'

// HTTP Client Types
export interface ApiRequestConfig {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  headers?: Record<string, string>
  body?: unknown
  timeout?: number
  retry?: boolean
  skipAuth?: boolean // Skip authentication for public endpoints
  signal?: AbortSignal // External AbortSignal for request cancellation
}

export interface ApiResponse<T> {
  data: T
  status: number
  headers: Headers
}

export interface ApiError {
  message: string
  code: string
  status: number
  details?: Record<string, unknown>
}

// ML Service Types
export interface PredictRequest {
  input: number[]
  modelId?: string
  options?: {
    returnConfidence?: boolean
    returnLatency?: boolean
  }
}

export interface PredictResponse {
  prediction: PredictionResult
}

export interface BatchPredictRequest {
  inputs: number[][]
  modelId?: string
}

export interface BatchPredictResponse {
  predictions: PredictionResult[]
  totalTime: number
  throughput: number
}

// Model Management Types
export interface ModelInfoResponse {
  id: string
  version: string
  url: string
  checksum: string
  accuracy: number
  size: number
  deployedAt: string
  status: 'development' | 'staging' | 'production'
}

export interface ModelListResponse {
  models: ModelInfoResponse[]
  total: number
}

export interface ModelDownloadResponse {
  url: string
  expiresAt: string
}

// Health Check Types
export interface HealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy'
  timestamp: string
  version: string
  uptime: number
}

export interface ReadyResponse {
  ready: boolean
  checks: {
    database: boolean
    cache: boolean
    models: boolean
  }
}

// Analytics Types
export interface AnalyticsEventRequest {
  type: 'prediction' | 'model_load' | 'error'
  data: Record<string, unknown>
  timestamp: string
}

export interface AnalyticsMetricsResponse {
  predictions: {
    total: number
    errors: number
    avgLatency: number
    p95Latency: number
  }
  models: {
    active: number
    cached: number
  }
}

// WebSocket Types
export interface WebSocketMessage<T = unknown> {
  type: string
  payload: T
  timestamp: number
  id: string
}

export interface UnifiedWebSocketMessage<T = unknown> {
  type: string
  channel?: string
  data: T
  timestamp: string
  error?: string
}

export interface StreamDataMessage {
  id: string
  features: number[]
  timestamp: number
}

export interface StreamPredictionMessage {
  prediction: PredictionResult
}

// Unified WebSocket Specific Types
export interface MatchUpdateData {
  matchId: string
  eventType: 'kill' | 'death' | 'round_end' | 'spike_plant' | 'spike_defuse' | 'economy_update'
  data: Record<string, unknown>
  round?: number
  timestamp: string
}

export interface PlayerStatsUpdateData {
  playerId: string
  matchId: string
  stats: {
    kills?: number
    deaths?: number
    assists?: number
    acs?: number
    adr?: number
    [key: string]: unknown
  }
  timestamp: string
}

export interface AnalyticsUpdateData {
  metric: string
  value: number
  previousValue?: number
  change?: number
  context: Record<string, unknown>
  timestamp: string
}

export interface SystemNotificationData {
  level: 'info' | 'warning' | 'error' | 'success'
  title: string
  message: string
  details?: Record<string, unknown>
  timestamp: string
}

export interface WebSocketSubscription {
  channel: string
  filters?: Record<string, unknown>
}

// Error Response
export interface ErrorResponse {
  error: {
    message: string
    code: string
    status: number
    path?: string
    timestamp: string
  }
}
