/**
 * API Configuration - All API endpoints and URLs
 * 
 * [Ver001.000]
 */

import { getEnvironment } from './environment'

const env = getEnvironment()

// Base URLs
export const API_BASE_URL = env.VITE_API_URL || 'https://api.libre-x-esport.com'
export const WS_BASE_URL = env.VITE_WS_URL || 'wss://api.libre-x-esport.com'

// ML Service Endpoints
export const ML_API = {
  // Model management
  models: `${API_BASE_URL}/v1/models`,
  modelById: (id: string) => `${API_BASE_URL}/v1/models/${id}`,
  modelDownload: (id: string) => `${API_BASE_URL}/v1/models/${id}/download`,
  
  // Predictions
  predict: `${API_BASE_URL}/v1/predict`,
  predictBatch: `${API_BASE_URL}/v1/predict/batch`,
  
  // Streaming
  streaming: `${WS_BASE_URL}/v1/stream`,
  streamingLocal: 'ws://localhost:8080/stream',
  
  // Health
  health: `${API_BASE_URL}/health`,
  ready: `${API_BASE_URL}/ready`
} as const

// Analytics Endpoints
export const ANALYTICS_API = {
  events: `${API_BASE_URL}/v1/analytics/events`,
  metrics: `${API_BASE_URL}/v1/analytics/metrics`,
  predictions: `${API_BASE_URL}/v1/analytics/predictions`
} as const

// Model Registry
export const REGISTRY_URLS = {
  production: '/models/model-registry.json',
  staging: '/models/staging-registry.json',
  local: '/models/local-registry.json'
} as const

// Request configuration
export const API_CONFIG = {
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
} as const
