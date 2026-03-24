/**
 * ML Model Registry TypeScript Types
 * 
 * [Ver001.000]
 */

// ============================================================================
// Model Types
// ============================================================================

export type ModelStatus = 'development' | 'staging' | 'production' | 'archived' | 'deprecated'
export type ModelType = 'classification' | 'regression' | 'clustering' | 'reinforcement_learning' | 'custom'
export type ModelFramework = 'onnx' | 'tensorflow' | 'pytorch' | 'sklearn' | 'xgboost' | 'lightgbm'
export type QuantizationType = 'fp32' | 'fp16' | 'int8' | 'int16'

export interface MLModel {
  id: string
  name: string
  version: string
  type: ModelType | string
  status: ModelStatus
  description?: string
  
  // Artifacts
  artifact_url?: string
  checksum_sha256?: string
  size_bytes?: number
  
  // Configuration
  framework?: ModelFramework | string
  quantization: QuantizationType
  input_shape?: Record<string, unknown>
  output_shape?: Record<string, unknown>
  
  // Performance metrics
  accuracy?: number
  precision?: number
  recall?: number
  f1_score?: number
  
  // Resource metrics
  avg_latency_ms?: number
  p95_latency_ms?: number
  memory_usage_mb?: number
  
  // Metadata
  tags: string[]
  hyperparameters?: Record<string, unknown>
  training_config?: Record<string, unknown>
  
  // Lineage
  parent_model_id?: string
  dataset_id?: string
  training_job_id?: string
  
  // Timestamps
  created_at: string
  updated_at: string
  trained_at?: string
}

export interface MLModelCreate {
  name: string
  version: string
  type: ModelType | string
  description?: string
  framework?: ModelFramework | string
  quantization?: QuantizationType
  tags?: string[]
  
  // Artifacts
  artifact_url?: string
  checksum_sha256?: string
  size_bytes?: number
  
  // Shapes
  input_shape?: Record<string, unknown>
  output_shape?: Record<string, unknown>
  
  // Metrics
  accuracy?: number
  precision?: number
  recall?: number
  f1_score?: number
  avg_latency_ms?: number
  p95_latency_ms?: number
  memory_usage_mb?: number
  
  // Configuration
  hyperparameters?: Record<string, unknown>
  training_config?: Record<string, unknown>
  
  // Lineage
  parent_model_id?: string
  dataset_id?: string
  training_job_id?: string
}

export interface MLModelUpdate {
  description?: string
  status?: ModelStatus
  tags?: string[]
  hyperparameters?: Record<string, unknown>
  
  // Metrics (can be updated as new benchmarks are run)
  accuracy?: number
  precision?: number
  recall?: number
  f1_score?: number
  avg_latency_ms?: number
  p95_latency_ms?: number
  memory_usage_mb?: number
}

export interface MLModelListResponse {
  models: MLModel[]
  total: number
  offset: number
  limit: number
}

// ============================================================================
// Metric Types
// ============================================================================

export type MetricName = 'accuracy' | 'precision' | 'recall' | 'f1_score' | 'latency' | 'throughput' | 'memory' | 'error_rate' | 'custom'
export type MetricUnit = 'percent' | 'ms' | 'ops/sec' | 'MB' | 'count' | string
export type Environment = 'development' | 'staging' | 'production'

export interface ModelMetric {
  id: number
  model_id: string
  metric_name: MetricName | string
  metric_value: number
  metric_unit?: MetricUnit
  environment: Environment | string
  context?: Record<string, unknown>
  recorded_at: string
}

export interface ModelMetricCreate {
  metric_name: MetricName | string
  metric_value: number
  metric_unit?: MetricUnit
  environment?: Environment | string
  context?: Record<string, unknown>
}

export interface ModelMetricsHistory {
  model_id: string
  metrics: ModelMetric[]
}

// ============================================================================
// Deployment Types
// ============================================================================

export type DeploymentStatus = 'pending' | 'deploying' | 'active' | 'rolling_back' | 'failed' | 'retired'
export type DeploymentType = 'full' | 'canary' | 'shadow'
export type DeploymentEnvironment = 'development' | 'staging' | 'production' | 'edge'

export interface Deployment {
  id: number
  model_id: string
  environment: DeploymentEnvironment | string
  deployment_type: DeploymentType
  status: DeploymentStatus
  traffic_percentage: number
  deployed_by?: string
  deployment_notes?: string
  endpoint_url?: string
  deployed_at: string
  retired_at?: string
}

export interface DeploymentCreate {
  environment: DeploymentEnvironment | string
  deployment_type?: DeploymentType
  traffic_percentage?: number
  deployed_by?: string
  deployment_notes?: string
  endpoint_url?: string
}

export interface ActiveDeployment extends Deployment {
  model_name: string
  model_version: string
}

// ============================================================================
// A/B Test Types
// ============================================================================

export type ABTestStatus = 'draft' | 'running' | 'paused' | 'completed' | 'cancelled'

export interface ABTest {
  id: string
  name: string
  description?: string
  
  // Models
  model_a_id: string
  model_b_id: string
  model_a_traffic_pct: number
  model_b_traffic_pct: number
  
  // Status
  status: ABTestStatus
  
  // Success criteria
  success_metric: string
  min_sample_size: number
  confidence_level: number
  
  // Winner
  winner_model_id?: string
  winner_reason?: string
  
  // Environment
  environment: Environment | string
  
  // Timestamps
  created_at: string
  started_at?: string
  ended_at?: string
}

export interface ABTestCreate {
  name: string
  description?: string
  model_a_id: string
  model_b_id: string
  model_a_traffic_pct?: number
  model_b_traffic_pct?: number
  success_metric?: string
  min_sample_size?: number
  confidence_level?: number
  environment?: Environment | string
}

export interface ABTestResult {
  test_id: string
  model_id: string
  metric_name: string
  metric_value: number
  sample_size: number
  std_dev?: number
  confidence_interval?: { lower: number; upper: number }
  p_value?: number
  recorded_at: string
}

// ============================================================================
// Comparison Types
// ============================================================================

export interface ModelComparison {
  model_a: MLModel
  model_b: MLModel
  accuracy_diff?: number
  latency_diff?: number
  size_diff_bytes?: number
  recommendation: 'A' | 'B' | 'equivalent'
}

// ============================================================================
// UI State Types
// ============================================================================

export interface ModelRegistryState {
  models: MLModel[]
  selectedModel: MLModel | null
  isLoading: boolean
  error: string | null
  filters: ModelRegistryFilters
}

export interface ModelRegistryFilters {
  name?: string
  type?: string
  status?: ModelStatus
  framework?: string
  tag?: string
}

export interface ModelVersionLineage {
  id: string
  name: string
  version: string
  parent_model_id?: string
  created_at: string
  generation: number
  path: string[]
}

// ============================================================================
// Chart Data Types
// ============================================================================

export interface MetricChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    color: string
  }[]
}

export interface ModelComparisonChartData {
  metrics: string[]
  modelA: number[]
  modelB: number[]
}

// ============================================================================
// API Response Types
// ============================================================================

export interface ModelRegistryApiError {
  message: string
  code: string
  status: number
  details?: Record<string, unknown>
}
