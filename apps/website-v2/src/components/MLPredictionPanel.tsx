/**
 * MLPredictionPanel - Real-time ML Prediction Display
 * Shows predictions with confidence scores and history
 * 
 * [Ver001.000]
 */

import React, { useState, useCallback, useRef } from 'react'
import { useMLInference } from '../hooks/useMLInference'
import { PanelSkeleton } from './grid/PanelSkeleton'
import { Activity, TrendingUp, History, AlertCircle } from 'lucide-react'

interface Prediction {
  id: string
  input: number[]
  output: number[]
  confidence: number
  timestamp: Date
  latency: number
}

interface MLPredictionPanelProps {
  modelUrl?: string
  hub?: 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET'
}

const HUB_COLORS = {
  SATOR: '#ffd700',
  ROTAS: '#00d4ff',
  AREPO: '#0066ff',
  OPERA: '#9d4edd',
  TENET: '#ffffff'
}

export const MLPredictionPanel: React.FC<MLPredictionPanelProps> = ({
  modelUrl = '/models/default-model.json',
  hub = 'SATOR'
}) => {
  const { loadModel, predict, isModelReady, isModelLoading, error, progress } = useMLInference({
    useWorker: true
  })

  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [inputValues, setInputValues] = useState<number[]>([0.5, 0.5, 0.5])
  const [isPredicting, setIsPredicting] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)

  const hubColor = HUB_COLORS[hub]

  // Load model on mount
  React.useEffect(() => {
    if (!isModelReady && !isModelLoading && !error) {
      loadModel(modelUrl)
    }
  }, [loadModel, isModelReady, isModelLoading, error, modelUrl])

  /**
   * Run prediction and store result
   */
  const handlePredict = useCallback(async () => {
    if (!isModelReady || isPredicting) return

    setIsPredicting(true)
    const startTime = performance.now()

    try {
      const result = await predict(inputValues)
      const latency = performance.now() - startTime
      
      // Calculate confidence (using softmax for demo)
      const maxVal = Math.max(...result)
      const confidence = maxVal / result.reduce((a, b) => a + b, 0)

      const newPrediction: Prediction = {
        id: `pred-${Date.now()}`,
        input: [...inputValues],
        output: result,
        confidence,
        timestamp: new Date(),
        latency
      }

      setPredictions(prev => [newPrediction, ...prev].slice(0, 10)) // Keep last 10
    } catch (err) {
      console.error('Prediction failed:', err)
    } finally {
      setIsPredicting(false)
    }
  }, [isModelReady, isPredicting, predict, inputValues])

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
        <p className="text-sm text-gray-400 mb-4">{error.message}</p>
        <button
          onClick={() => loadModel(modelUrl)}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ backgroundColor: hubColor, color: '#0a0a0f' }}
        >
          Retry
        </button>
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
        {isModelReady && (
          <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
            Ready
          </span>
        )}
      </div>

      {/* Input Controls */}
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
          className="w-full mt-3 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50"
          style={{
            backgroundColor: isModelReady && !isPredicting ? hubColor : 'rgba(255,255,255,0.1)',
            color: isModelReady && !isPredicting ? '#0a0a0f' : '#6b7280'
          }}
        >
          {isPredicting ? 'Predicting...' : 'Run Prediction'}
        </button>
      </div>

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
          <div className="text-xs text-gray-500 mt-2">
            Latency: {predictions[0].latency.toFixed(1)}ms
          </div>
        </div>
      )}

      {/* Prediction History */}
      {predictions.length > 1 && (
        <div className="flex-1 overflow-auto">
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
