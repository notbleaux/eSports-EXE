/**
 * ML Service API - Model management and predictions
 * 
 * [Ver001.000]
 */

import { api } from './client'
import { ML_API } from '../config/api'
import type {
  PredictRequest,
  PredictResponse,
  BatchPredictRequest,
  BatchPredictResponse,
  ModelInfoResponse,
  ModelListResponse,
  HealthResponse,
  ReadyResponse
} from './types'

/**
 * Get list of available models
 */
export async function getModels(): Promise<ModelListResponse> {
  return api.get<ModelListResponse>(ML_API.models)
}

/**
 * Get model information by ID
 */
export async function getModel(modelId: string): Promise<ModelInfoResponse> {
  return api.get<ModelInfoResponse>(ML_API.modelById(modelId))
}

/**
 * Download model
 */
export async function downloadModel(modelId: string): Promise<Blob> {
  const response = await fetch(ML_API.modelDownload(modelId))
  if (!response.ok) {
    throw new Error(`Failed to download model: ${response.statusText}`)
  }
  return response.blob()
}

/**
 * Make a single prediction
 */
export async function predict(
  input: number[],
  modelId?: string
): Promise<PredictResponse> {
  const request: PredictRequest = {
    input,
    modelId,
    options: {
      returnConfidence: true,
      returnLatency: true
    }
  }
  
  return api.post<PredictResponse>(ML_API.predict, request)
}

/**
 * Make batch predictions
 */
export async function predictBatch(
  inputs: number[][],
  modelId?: string
): Promise<BatchPredictResponse> {
  const request: BatchPredictRequest = {
    inputs,
    modelId
  }
  
  return api.post<BatchPredictResponse>(ML_API.predictBatch, request)
}

/**
 * Check service health
 */
export async function checkHealth(): Promise<HealthResponse> {
  return api.get<HealthResponse>(ML_API.health)
}

/**
 * Check if service is ready
 */
export async function checkReady(): Promise<ReadyResponse> {
  return api.get<ReadyResponse>(ML_API.ready)
}

/**
 * ML Service API client
 */
export const mlService = {
  getModels,
  getModel,
  downloadModel,
  predict,
  predictBatch,
  checkHealth,
  checkReady
}

export default mlService
