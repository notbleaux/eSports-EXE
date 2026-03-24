/**
 * ML Model Registry API Client
 * Manages model registration, versioning, metrics, and A/B testing
 * 
 * [Ver002.000] - Fixed return types to unwrap ApiResponse
 * [Ver001.000]
 */

import { api } from './client'
import type {
  MLModel,
  MLModelCreate,
  MLModelUpdate,
  MLModelListResponse,
  ModelMetric,
  ModelMetricCreate,
  ModelMetricsHistory,
  Deployment,
  DeploymentCreate,
  ABTest,
  ABTestCreate,
  ModelComparison,
  ActiveDeployment
} from '../types/mlRegistry'

const ML_REGISTRY_BASE = '/v1/ml'

/**
 * Get all ML models with optional filtering
 */
export async function getModels(params?: {
  name?: string
  type?: string
  status?: string
  framework?: string
  tag?: string
  limit?: number
  offset?: number
}): Promise<MLModelListResponse> {
  const searchParams = new URLSearchParams()
  if (params?.name) searchParams.set('name', params.name)
  if (params?.type) searchParams.set('type', params.type)
  if (params?.status) searchParams.set('status', params.status)
  if (params?.framework) searchParams.set('framework', params.framework)
  if (params?.tag) searchParams.set('tag', params.tag)
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const query = searchParams.toString()
  const response = await api.get<MLModelListResponse>(`${ML_REGISTRY_BASE}/models${query ? `?${query}` : ''}`)
  return response.data
}

/**
 * Get a single model by ID
 */
export async function getModel(modelId: string): Promise<MLModel> {
  const response = await api.get<MLModel>(`${ML_REGISTRY_BASE}/models/${modelId}`)
  return response.data
}

/**
 * Register a new model
 */
export async function createModel(model: MLModelCreate): Promise<MLModel> {
  const response = await api.post<MLModel>(`${ML_REGISTRY_BASE}/models`, model)
  return response.data
}

/**
 * Update model metadata
 */
export async function updateModel(modelId: string, update: MLModelUpdate): Promise<MLModel> {
  const response = await api.put<MLModel>(`${ML_REGISTRY_BASE}/models/${modelId}`, update)
  return response.data
}

/**
 * Delete a model
 */
export async function deleteModel(modelId: string): Promise<void> {
  await api.delete<void>(`${ML_REGISTRY_BASE}/models/${modelId}`)
}

/**
 * Deploy a model to an environment
 */
export async function deployModel(
  modelId: string,
  deployment: DeploymentCreate
): Promise<Deployment> {
  const response = await api.post<Deployment>(`${ML_REGISTRY_BASE}/models/${modelId}/deploy`, deployment)
  return response.data
}

/**
 * Rollback a deployment (retire active deployment)
 */
export async function rollbackDeployment(deploymentId: number): Promise<void> {
  // This will be handled by updating the deployment status
  await api.put<void>(`${ML_REGISTRY_BASE}/deployments/${deploymentId}/rollback`, {})
}

/**
 * Record a metric for a model
 */
export async function recordMetric(
  modelId: string,
  metric: ModelMetricCreate
): Promise<ModelMetric> {
  const response = await api.post<ModelMetric>(`${ML_REGISTRY_BASE}/models/${modelId}/metrics`, metric)
  return response.data
}

/**
 * Get metrics history for a model
 */
export async function getModelMetrics(
  modelId: string,
  params?: {
    metric_name?: string
    environment?: string
    limit?: number
    offset?: number
  }
): Promise<ModelMetricsHistory> {
  const searchParams = new URLSearchParams()
  if (params?.metric_name) searchParams.set('metric_name', params.metric_name)
  if (params?.environment) searchParams.set('environment', params.environment)
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const query = searchParams.toString()
  const response = await api.get<ModelMetricsHistory>(
    `${ML_REGISTRY_BASE}/models/${modelId}/metrics${query ? `?${query}` : ''}`
  )
  return response.data
}

/**
 * Create a new A/B test
 */
export async function createABTest(test: ABTestCreate): Promise<ABTest> {
  const response = await api.post<ABTest>(`${ML_REGISTRY_BASE}/ab-tests`, test)
  return response.data
}

/**
 * Get all A/B tests
 */
export async function getABTests(params?: {
  status?: string
  environment?: string
  limit?: number
  offset?: number
}): Promise<ABTest[]> {
  const searchParams = new URLSearchParams()
  if (params?.status) searchParams.set('status', params.status)
  if (params?.environment) searchParams.set('environment', params.environment)
  if (params?.limit) searchParams.set('limit', params.limit.toString())
  if (params?.offset) searchParams.set('offset', params.offset.toString())

  const query = searchParams.toString()
  const response = await api.get<ABTest[]>(`${ML_REGISTRY_BASE}/ab-tests${query ? `?${query}` : ''}`)
  return response.data
}

/**
 * Get A/B test by ID
 */
export async function getABTest(testId: string): Promise<ABTest> {
  const response = await api.get<ABTest>(`${ML_REGISTRY_BASE}/ab-tests/${testId}`)
  return response.data
}

/**
 * Start an A/B test
 */
export async function startABTest(testId: string): Promise<ABTest> {
  const response = await api.post<ABTest>(`${ML_REGISTRY_BASE}/ab-tests/${testId}/start`, {})
  return response.data
}

/**
 * Complete an A/B test with a winner
 */
export async function completeABTest(
  testId: string,
  winnerModelId: string,
  reason?: string
): Promise<ABTest> {
  const response = await api.post<ABTest>(`${ML_REGISTRY_BASE}/ab-tests/${testId}/complete`, {
    winner_model_id: winnerModelId,
    reason
  })
  return response.data
}

/**
 * Compare two models
 */
export async function compareModels(modelAId: string, modelBId: string): Promise<ModelComparison> {
  const response = await api.get<ModelComparison>(`${ML_REGISTRY_BASE}/models/${modelAId}/compare/${modelBId}`)
  return response.data
}

/**
 * Get active deployments
 */
export async function getActiveDeployments(environment?: string): Promise<ActiveDeployment[]> {
  const searchParams = new URLSearchParams()
  if (environment) searchParams.set('environment', environment)

  const query = searchParams.toString()
  const response = await api.get<ActiveDeployment[]>(
    `${ML_REGISTRY_BASE}/deployments/active${query ? `?${query}` : ''}`
  )
  return response.data
}

/**
 * ML Model Registry API client object
 */
export const mlRegistry = {
  // Models
  getModels,
  getModel,
  createModel,
  updateModel,
  deleteModel,
  
  // Deployments
  deployModel,
  rollbackDeployment,
  getActiveDeployments,
  
  // Metrics
  recordMetric,
  getModelMetrics,
  
  // A/B Testing
  createABTest,
  getABTests,
  getABTest,
  startABTest,
  completeABTest,
  
  // Comparison
  compareModels
}

export default mlRegistry
