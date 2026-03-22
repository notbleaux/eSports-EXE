/** [Ver003.000] - Added Grid Worker types for VirtualDataGrid
 * Worker Types for 4NJZ4 TENET Platform
 * Type definitions for Web Workers infrastructure
 */

export type WorkerType = 'grid' | 'ml' | 'analytics' | 'data'

export interface WorkerMessage<T = unknown> {
  id: string
  type: WorkerType
  action: string
  payload: T
  timestamp: number
}

export interface WorkerResponse<T = unknown> {
  id: string
  type: WorkerType
  success: boolean
  data?: T
  error?: string
  timestamp: number
}

export type WorkerStatus = 'idle' | 'busy' | 'error' | 'terminated'

export interface WorkerState {
  status: WorkerStatus
  lastActivity: number
  errorCount: number
}

// ML Worker specific types
export type MLWorkerCommand = 
  | { type: 'LOAD_MODEL'; url: string; modelName: string; quantization?: 8 | 16 | 32 }
  | { type: 'PREDICT'; input: number[]; requestId: string }
  | { type: 'PREDICT_BATCH'; inputs: number[][]; requestId: string }
  | { type: 'WARMUP'; modelType: string; inputShape: number[] }
  | { type: 'INIT' }
  | { type: 'STATS' }
  | { type: 'DISPOSE' }

export type MLWorkerResponse =
  | { type: 'MODEL_LOADED'; modelName: string; backend: string }
  | { type: 'MODEL_LOAD_ERROR'; error: string }
  | { type: 'PREDICTION_RESULT'; requestId: string; result: number[] }
  | { type: 'BATCH_PREDICTION_RESULT'; requestId: string; results: number[][]; totalTime: number }
  | { type: 'PREDICTION_ERROR'; requestId: string; error: string }
  | { type: 'PROGRESS'; requestId: string; current: number; total: number; stage: string }
  | { type: 'WARMUP_COMPLETE' }
  | { type: 'INIT_COMPLETE'; backend: string }
  | { type: 'STATS_RESULT'; backend: string; totalPredictions: number; averageInferenceTime: number; warmModels: string[]; cachedModels: string[] }
  | { type: 'DISPOSED' }
  | { type: 'BACKPRESSURE'; queueDepth: number; maxQueueSize: number }
  | { type: 'QUEUE_METRICS'; depth: number }
  | { type: 'QUEUE_OVERFLOW'; dropped: number }
  | { type: 'ERROR'; error: string }

export interface MLPredictionProgress {
  requestId: string
  current: number
  total: number
  stage: 'loading' | 'preprocessing' | 'inference' | 'postprocessing'
  percentComplete: number
}

export interface MLBatchResult {
  results: number[][]
  totalTime: number
  throughput: number
  progress?: MLPredictionProgress
}

export interface MLModelConfig {
  modelPath: string
  quantization?: 8 | 16 | 32
  warmup?: boolean
  priority?: number
}

export interface MLInferencePayload {
  inputs: number[][]
  modelType: 'simrating' | 'prediction' | 'classification'
}

export interface MLBatchPayload {
  batch: Array<{
    inputs: number[]
    metadata?: Record<string, unknown>
  }>
  modelType: 'simrating' | 'prediction' | 'classification'
}

export interface MLPredictionResult {
  prediction: number[]
  confidence: number
  latency: number
  modelVersion: string
}

export interface MLWorkerState {
  isReady: boolean
  isLoading: boolean
  isPredicting: boolean
  backend: string | null
  progress: MLPredictionProgress | null
  queueDepth: number
  error: Error | null
}

// ==========================================
// Grid Worker Types for VirtualDataGrid
// ==========================================

export interface GridCell {
  id: string | number
  value: unknown
  formatted?: string
  style?: {
    backgroundColor?: string
    color?: string
    fontWeight?: string
  }
}

export interface GridColumn {
  key: string
  header: string
  width: number
  type?: 'text' | 'number' | 'rating' | 'trend'
  align?: 'left' | 'center' | 'right'
  formatter?: (value: unknown) => string
}

export interface GridRow {
  id: string | number
  [key: string]: unknown
}

export interface GridViewport {
  x: number
  y: number
  width: number
  height: number
}

export interface GridRenderCommand {
  type: 'init' | 'render' | 'resize' | 'terminate' | 'scroll' | 'calculateRange'
  payload: unknown
}

export interface GridRenderResult {
  success: boolean
  renderTime: number
  renderedCells?: number
  visibleRows?: number
}

export interface GridInitPayload {
  canvas: OffscreenCanvas
  columns: GridColumn[]
  rows?: number
  cellWidth?: number
  cellHeight?: number
  headerHeight?: number
}

export interface GridRenderPayload {
  data: GridRow[]
  columns: GridColumn[]
  viewport: GridViewport
  scrollTop: number
  scrollLeft: number
  rowHeight?: number
  headerHeight?: number
  theme?: {
    backgroundColor?: string
    headerBackgroundColor?: string
    rowBackgroundColor?: string
    alternateRowBackgroundColor?: string
    borderColor?: string
    textColor?: string
    headerTextColor?: string
  }
}

export interface GridScrollPayload {
  scrollTop: number
  scrollLeft: number
}

export interface GridResizePayload {
  width: number
  height: number
}

export interface GridVisibleRange {
  startRow: number
  endRow: number
  startCol: number
  endCol: number
}

// Worker Pool types
export interface WorkerPoolConfig {
  maxWorkers: number
  idleTimeoutMs: number
  taskTimeoutMs: number
}

export interface WorkerTask<T, R> {
  id: string
  type: WorkerType
  action: string
  payload: T
  resolve: (value: R) => void
  reject: (error: Error) => void
  timestamp: number
}

export interface WorkerInstance {
  worker: Worker
  type: WorkerType
  busy: boolean
  lastUsed: number
  taskCount: number
}

export interface WorkerStatusInfo {
  type: WorkerType
  id: string
  state: 'idle' | 'busy'
  currentTask?: string
  taskCount: number
  errorCount: number
  lastActivity: number
}

// ==========================================
// Analytics Worker Types
// ==========================================

export interface SimRatingComponents {
  combat: number
  economy: number
  clutch: number
  support: number
  entry: number
  overall: number
}

export interface SimRatingPayload {
  playerId: string
  playerStats: Record<string, number>
  role: 'duelist' | 'initiator' | 'controller' | 'sentinel' | string
  confidence?: number
}

export interface SimRatingResult {
  playerId: string
  rating: number
  components: SimRatingComponents
  confidence: number
  grade: string
  factors: string[]
  timestamp: number
}

export interface RARComponents {
  impact: number
  consistency: number
  clutch: number
}

export interface RARPayload {
  playerId: string
  playerStats: Record<string, number>
  role: 'duelist' | 'initiator' | 'controller' | 'sentinel' | string
  simrating: number
  confidence?: number
}

export interface RARResult {
  playerId: string
  rar: number
  rarNormalized: number
  components: RARComponents
  investmentGrade: string
  riskLevel: 'low' | 'medium' | 'high'
  confidence: number
}

export interface AggregationPayload {
  data: number[]
  operation: 'sum' | 'avg' | 'median' | 'std' | 'min' | 'max' | 'percentile'
  options?: {
    percentile?: number
    weights?: number[]
  }
}

export interface BatchSimRatingPayload {
  players: Array<{
    id: string
    payload: SimRatingPayload
  }>
}

export interface BatchSimRatingResult {
  results: Map<string, SimRatingResult>
  errors: Map<string, string>
  completed: number
  failed: number
}
