/**
 * MLPredictionPanel - Real-time ML Prediction Display with Worker Progress
 * Shows predictions with confidence scores, progress tracking, and history
 * 
 * [Ver002.000] - Enhanced with batch prediction and worker progress
 */

import React, { useState, useCallback, useRef } from 'react'
import { useMLInference } from '../hooks/useMLInference'
import { mlLogger } from '@/utils/logger'
import { PanelSkeleton } from './grid/PanelSkeleton'
import { 
  Activity, 
  TrendingUp, 
  History, 
  AlertCircle, 
  Cpu, 
  Zap,
  BarChart3,
  Play,
  Settings2,
  CheckCircle2,
  XCircle,
  Loader2,
  Layers
} from 'lucide-react'
import type { MLPredictionProgress } from '../types/worker'

interface Prediction {
  id: string
  input: number[]
  output: number[]
  confidence: number
  timestamp: Date
  latency: number
}

interface BatchResult {
  id: string
  count: number
  totalTime: number
  throughput: number
  timestamp: Date
}

interface MLPredictionPanelProps {
  modelUrl?: string
  hub?: 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET'
  showBatchControls?: boolean
  maxBatchSize?: number
}

const HUB_COLORS = {
  SATOR: '#ffd700',
  ROTAS: '#00d4ff',
  AREPO: '#0066ff',
  OPERA: '#9d4edd',
  TENET: '#ffffff'
}

const BATCH_SIZES = [10, 50, 100]

export const MLPredictionPanel: React.FC<MLPredictionPanelProps> = ({
  modelUrl = '/models/default-model.json',
  hub = 'SATOR',
  showBatchControls = true,
  maxBatchSize = 100
}) => {
  const {
    loadModel,
    predict,
    predictBatch,
    isModelReady,
    isModelLoading,
    isPredicting,
    error,
    progress,
    predictionProgress,
    useWorker,
    workerStatus,
    queueDepth,
    lastLatency,
    setUseWorker,
    retry
  } = useMLInference({
    useWorker: true,
    onProgress: (p) => mlLogger.info('ML progress update', p),
    onWorkerError: (e) => mlLogger.error('ML worker error', { 
      error: e instanceof Error ? e.message : String(e),
      stack: e instanceof Error ? e.stack : undefined,
    })
  })

  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [batchResults, setBatchResults] = useState<BatchResult[]>([])
  const [inputValues, setInputValues] = useState<number[]>([0.5, 0.5, 0.5])
  const [selectedBatchSize, setSelectedBatchSize] = useState(10)
  const [showSettings, setShowSettings] = useState(false)
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single')

  const hubColor = HUB_COLORS[hub]

  // Load model on mount
  React.useEffect(() => {
    if (!isModelReady && !isModelLoading && !error) {
      loadModel(modelUrl)
    }
  }, [loadModel, isModelReady, isModelLoading, error, modelUrl])

  /**
   * Run single prediction
   */
  const handlePredict = useCallback(async () => {
    if (!isModelReady || isPredicting) return

    try {
      const result = await predict(inputValues)
      
      // Calculate confidence (using softmax for demo)
      const expSum = result.reduce((sum, val) => sum + Math.exp(val), 0)
      const softmax = result.map(val => Math.exp(val) / expSum)
      const maxVal = Math.max(...softmax)
      const confidence = maxVal

      const newPrediction: Prediction = {
        id: `pred-${Date.now()}`,
        input: [...inputValues],
        output: result,
        confidence,
        timestamp: new Date(),
        latency: lastLatency
      }

      setPredictions(prev => [newPrediction, ...prev].slice(0, 10))
    } catch (err) {
      // Error handled by hook
    }
  }, [isModelReady, isPredicting, predict, inputValues, lastLatency])

  /**
   * Run batch prediction
   */
  const handleBatchPredict = useCallback(async () => {
    if (!isModelReady || isPredicting) return

    // Generate random test inputs
    const batchInputs: number[][] = Array.from({ length: selectedBatchSize }, () => 
      Array.from({ length: 3 }, () => Math.random())
    )

    try {
      const result = await predictBatch(batchInputs)

      const batchResult: BatchResult = {
        id: `batch-${Date.now()}`,
        count: selectedBatchSize,
        totalTime: result.totalTime,
        throughput: result.throughput,
        timestamp: new Date()
      }

      setBatchResults(prev => [batchResult, ...prev].slice(0, 5))

      // Also add first few predictions to single history
      const newPredictions: Prediction[] = result.results.slice(0, 3).map((output, idx) => ({
        id: `pred-${Date.now()}-${idx}`,
        input: batchInputs[idx],
        output,
        confidence: Math.max(...output) / output.reduce((a, b) => a + b, 0),
        timestamp: new Date(),
        latency: result.totalTime / selectedBatchSize
      }))

      setPredictions(prev => [...newPredictions, ...prev].slice(0, 10))
    } catch (err) {
      // Error handled by hook
    }
  }, [isModelReady, isPredicting, predictBatch, selectedBatchSize])

  /**
   * Update input value at index
   */
  const updateInput = useCallback((index: number, value: number) => {
    setInputValues(prev => {
      const next = [...prev]
      next[index] = Math.max(0, Math.min(1, value))
      return next
    })
  }, [])

  /**
   * Get progress stage display text
   */
  const getProgressStage = (stage: MLPredictionProgress['stage']): string => {
    switch (stage) {
      case 'preprocessing': return 'Preprocessing...'
      case 'inference': return 'Running inference...'
      case 'postprocessing': return 'Finalizing...'
      case 'loading': return 'Loading model...'
      default: return 'Processing...'
    }
  }

  /**
   * Get worker status display
   */
  const getWorkerStatusDisplay = () => {
    switch (workerStatus) {
      case 'idle': return { text: 'Ready', icon: CheckCircle2, color: '#22c55e' }
      case 'loading': return { text: 'Loading...', icon: Loader2, color: '#eab308' }
      case 'predicting': return { text: 'Predicting...', icon: Zap, color: hubColor }
      case 'error': return { text: 'Error', icon: XCircle, color: '#ef4444' }
      default: return { text: 'Unknown', icon: Activity, color: '#6b7280' }
    }
  }

  const workerStatusDisplay = getWorkerStatusDisplay()
  const WorkerStatusIcon = workerStatusDisplay.icon

  // Loading state
  if (isModelLoading) {
    return (
      <div className="w-full h-full p-4">
        <PanelSkeleton variant="panel-loading" hub={hub} title="Loading ML Model..." />
        <div className="mt-4">
          <div className="flex justify-between text-sm text-gray-400 mb-2">
            <span>Loading model...</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{ width: `${progress}%`, backgroundColor: hubColor }}
            />
          </div>
          {useWorker && (
            <div className="flex items-center gap-2 mt-3 text-xs text-gray-500">
              <Cpu className="w-3 h-3" />
              <span>Using Web Worker for non-blocking inference</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center">
        <AlertCircle className="w-12 h-12 mb-4" style={{ color: '#ef4444' }} />
        <h3 className="text-lg font-medium text-white mb-2">Model Failed to Load</h3>
        <p className="text-sm text-gray-400 mb-2">{error.message}</p>
        {workerStatus === 'error' && (
          <p className="text-xs text-yellow-500 mb-4">
            Worker failed - falling back to main thread
          </p>
        )}
        <div className="flex gap-2">
          <button
            onClick={retry}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{ backgroundColor: hubColor, color: '#0a0a0f' }}
          >
            Retry
          </button>
          <button
            onClick={() => setUseWorker(!useWorker)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-700 text-white hover:bg-gray-600 transition-colors"
          >
            {useWorker ? 'Disable Worker' : 'Enable Worker'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full p-4 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: hubColor }} />
          <h3 className="font-semibold text-white">ML Predictions</h3>
        </div>
        <div className="flex items-center gap-2">
          {isModelReady && (
            <span 
              className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
              style={{ 
                backgroundColor: `${workerStatusDisplay.color}20`,
                color: workerStatusDisplay.color 
              }}
            >
              <WorkerStatusIcon className="w-3 h-3" />
              {workerStatusDisplay.text}
            </span>
          )}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Settings2 className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <h4 className="text-sm font-medium text-white mb-3">Worker Settings</h4>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Use Web Worker</span>
              <button
                onClick={() => setUseWorker(!useWorker)}
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  useWorker ? 'bg-green-500' : 'bg-gray-600'
                }`}
              >
                <span 
                  className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                    useWorker ? 'left-7' : 'left-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Queue Depth</span>
              <span className="text-gray-400">{queueDepth}/100</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">Backend</span>
              <span className="text-gray-400">{useWorker ? 'Web Worker' : 'Main Thread'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab Switcher */}
      {showBatchControls && (
        <div className="flex gap-1 mb-4 p-1 rounded-lg bg-white/5">
          <button
            onClick={() => setActiveTab('single')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'single' 
                ? 'bg-white/10 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Play className="w-4 h-4" />
            Single
          </button>
          <button
            onClick={() => setActiveTab('batch')}
            className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all flex items-center justify-center gap-2 ${
              activeTab === 'batch' 
                ? 'bg-white/10 text-white' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-4 h-4" />
            Batch
          </button>
        </div>
      )}

      {/* Single Prediction Controls */}
      {activeTab === 'single' && (
        <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <label className="text-sm text-gray-400 mb-2 block">Input Values</label>
          <div className="flex gap-3">
            {inputValues.map((val, i) => (
              <div key={i} className="flex-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={val}
                  onChange={(e) => updateInput(i, parseFloat(e.target.value))}
                  className="w-full h-2 rounded-lg appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, ${hubColor} ${val * 100}%, rgba(255,255,255,0.1) ${val * 100}%)`
                  }}
                />
                <div className="text-center text-xs text-gray-400 mt-1">
                  {val.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={handlePredict}
            disabled={!isModelReady || isPredicting}
            className="w-full mt-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              backgroundColor: isModelReady && !isPredicting ? hubColor : 'rgba(255,255,255,0.1)',
              color: isModelReady && !isPredicting ? '#0a0a0f' : '#6b7280'
            }}
          >
            {isPredicting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {predictionProgress ? (
                  <span>{getProgressStage(predictionProgress.stage)} ({predictionProgress.percentComplete}%)</span>
                ) : (
                  'Predicting...'
                )}
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                Run Prediction
              </>
            )}
          </button>
          
          {/* Progress Bar for Single Prediction */}
          {isPredicting && predictionProgress && (
            <div className="mt-3">
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-200"
                  style={{ 
                    width: `${predictionProgress.percentComplete}%`,
                    backgroundColor: hubColor 
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Batch Prediction Controls */}
      {activeTab === 'batch' && showBatchControls && (
        <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <label className="text-sm text-gray-400 mb-2 block">Batch Size</label>
          <div className="flex gap-2 mb-3">
            {BATCH_SIZES.map(size => (
              <button
                key={size}
                onClick={() => setSelectedBatchSize(size)}
                disabled={size > maxBatchSize}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedBatchSize === size
                    ? 'text-gray-900'
                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
                style={{
                  backgroundColor: selectedBatchSize === size ? hubColor : undefined
                }}
              >
                {size}
              </button>
            ))}
          </div>
          <button
            onClick={handleBatchPredict}
            disabled={!isModelReady || isPredicting}
            className="w-full py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            style={{
              backgroundColor: isModelReady && !isPredicting ? hubColor : 'rgba(255,255,255,0.1)',
              color: isModelReady && !isPredicting ? '#0a0a0f' : '#6b7280'
            }}
          >
            {isPredicting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing {selectedBatchSize} predictions...
              </>
            ) : (
              <>
                <BarChart3 className="w-4 h-4" />
                Run Batch ({selectedBatchSize})
              </>
            )}
          </button>
          
          {/* Batch Progress */}
          {isPredicting && predictionProgress && activeTab === 'batch' && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{getProgressStage(predictionProgress.stage)}</span>
                <span>{predictionProgress.current}/{predictionProgress.total}</span>
              </div>
              <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-200"
                  style={{ 
                    width: `${predictionProgress.percentComplete}%`,
                    backgroundColor: hubColor 
                  }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Latest Prediction */}
      {predictions.length > 0 && (
        <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4" style={{ color: hubColor }} />
            <span className="text-sm font-medium text-white">Latest Result</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex gap-4">
              {predictions[0].output.map((val, i) => (
                <div key={i} className="text-center">
                  <div
                    className="text-2xl font-bold"
                    style={{ color: hubColor }}
                  >
                    {val.toFixed(3)}
                  </div>
                  <div className="text-xs text-gray-500">Class {i}</div>
                </div>
              ))}
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-400">Confidence</div>
              <div
                className="text-lg font-bold"
                style={{
                  color: predictions[0].confidence > 0.8 ? '#22c55e' :
                    predictions[0].confidence > 0.5 ? '#eab308' : '#ef4444'
                }}
              >
                {(predictions[0].confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
            <span>Latency: {predictions[0].latency.toFixed(1)}ms</span>
            {useWorker && <span className="text-green-400">Worker</span>}
          </div>
        </div>
      )}

      {/* Batch Results */}
      {batchResults.length > 0 && activeTab === 'batch' && (
        <div className="mb-4 p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4" style={{ color: hubColor }} />
            <span className="text-sm font-medium text-white">Batch Results</span>
          </div>
          <div className="space-y-2">
            {batchResults.slice(0, 3).map(batch => (
              <div key={batch.id} className="flex items-center justify-between text-sm">
                <span className="text-gray-400">{batch.count} predictions</span>
                <div className="flex items-center gap-4">
                  <span className="text-gray-500">{batch.totalTime.toFixed(0)}ms</span>
                  <span className="text-green-400">{batch.throughput.toFixed(0)}/s</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Prediction History */}
      {predictions.length > 1 && (
        <div className="flex-1 overflow-auto min-h-0">
          <div className="flex items-center gap-2 mb-2">
            <History className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-400">History</span>
          </div>
          <div className="space-y-2">
            {predictions.slice(1).map((pred) => (
              <div
                key={pred.id}
                className="p-2 rounded bg-white/5 text-sm flex items-center justify-between"
              >
                <div className="flex gap-2 text-gray-400">
                  {pred.input.map((v, i) => (
                    <span key={i}>{v.toFixed(2)}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-300">
                    → [{pred.output.map(v => v.toFixed(2)).join(', ')}]
                  </span>
                  <span
                    className="text-xs"
                    style={{
                      color: pred.confidence > 0.8 ? '#22c55e' :
                        pred.confidence > 0.5 ? '#eab308' : '#ef4444'
                    }}
                  >
                    {(pred.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-500">
                    {pred.latency.toFixed(0)}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MLPredictionPanel
