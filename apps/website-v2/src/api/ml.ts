/**
 * ML Service API - Model management and predictions
 * 
 * [Ver002.000] - Fixed return types to unwrap ApiResponse
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
  const response = await api.get<ModelListResponse>(ML_API.models)
  return response.data
}

/**
 * Get model information by ID
 */
export async function getModel(modelId: string): Promise<ModelInfoResponse> {
  const response = await api.get<ModelInfoResponse>(ML_API.modelById(modelId))
  return response.data
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
  
  const response = await api.post<PredictResponse>(ML_API.predict, request)
  return response.data
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
  
  const response = await api.post<BatchPredictResponse>(ML_API.predictBatch, request)
  return response.data
}

/**
 * Check service health
 */
export async function checkHealth(): Promise<HealthResponse> {
  const response = await api.get<HealthResponse>(ML_API.health)
  return response.data
}

/**
 * Check if service is ready
 */
export async function checkReady(): Promise<ReadyResponse> {
  const response = await api.get<ReadyResponse>(ML_API.ready)
  return response.data
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
