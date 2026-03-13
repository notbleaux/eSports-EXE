/**
 * StreamingPredictionPanel - Real-time Streaming Prediction Display
 * Shows live predictions with lag indicators and throughput metrics
 * 
 * [Ver001.000]
 */

import React, { useMemo } from 'react'
import { useStreamingInference } from '../hooks/useStreamingInference'
import { Activity, Wifi, WifiOff, Pause, Play, AlertCircle, Zap, Clock } from 'lucide-react'

interface StreamingPredictionPanelProps {
  wsUrl?: string
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

/**
 * Get lag color based on latency thresholds
 * <100ms: green, 100-500ms: yellow, >500ms: red
 */
function getLagColor(lag: number): string {
  if (lag < 100) return '#22c55e' // green-500
  if (lag < 500) return '#eab308' // yellow-500
  return '#ef4444' // red-500
}

/**
 * Get lag status text
 */
function getLagStatus(lag: number): string {
  if (lag < 100) return 'Optimal'
  if (lag < 500) return 'Acceptable'
  return 'High Latency'
}

/**
 * Format throughput with appropriate units
 */
function formatThroughput(tps: number): string {
  if (tps >= 1000) {
    return `${(tps / 1000).toFixed(1)}k preds/s`
  }
  return `${tps.toFixed(1)} preds/s`
}

export const StreamingPredictionPanel: React.FC<StreamingPredictionPanelProps> = ({
  wsUrl = 'ws://localhost:8080/stream',
  modelUrl = '/models/default-model.json',
  hub = 'SATOR'
}) => {
  const {
    predictions,
    isStreaming,
    isPaused,
    lag,
    throughput,
    bufferSize,
    error,
    pause,
    resume
  } = useStreamingInference({
    wsUrl,
    modelUrl,
    maxPredictionsPerSecond: 10
  })

  const hubColor = HUB_COLORS[hub]
  const lagColor = getLagColor(lag)
  const lagStatus = getLagStatus(lag)

  // Get latest prediction
  const latestPrediction = predictions[0]

  // Determine connection status
  const connectionStatus = useMemo(() => {
    if (error) return { text: 'Error', color: '#ef4444', icon: AlertCircle }
    if (!isStreaming) return { text: 'Disconnected', color: '#6b7280', icon: WifiOff }
    if (isPaused) return { text: 'Paused', color: '#eab308', icon: Pause }
    return { text: 'Connected', color: '#22c55e', icon: Wifi }
  }, [isStreaming, isPaused, error])

  const StatusIcon = connectionStatus.icon

  // Error state
  if (error) {
    return (
      <div className="w-full h-full p-4 flex flex-col items-center justify-center text-center glassmorphic-panel">
        <AlertCircle className="w-12 h-12 mb-4" style={{ color: '#ef4444' }} />
        <h3 className="text-lg font-medium text-white mb-2">Streaming Error</h3>
        <p className="text-sm text-gray-400 mb-4">{error.message}</p>
        <button
          onClick={resume}
          className="px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
          style={{ backgroundColor: hubColor, color: '#0a0a0f' }}
        >
          Retry Connection
        </button>
      </div>
    )
  }

  return (
    <div className="w-full h-full p-4 flex flex-col glassmorphic-panel">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5" style={{ color: hubColor }} />
          <h3 className="font-semibold text-white">Live Predictions</h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className="text-xs px-2 py-1 rounded-full flex items-center gap-1"
            style={{ backgroundColor: `${connectionStatus.color}20`, color: connectionStatus.color }}
          >
            <StatusIcon className="w-3 h-3" />
            {connectionStatus.text}
          </span>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {/* Lag Indicator */}
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4" style={{ color: lagColor }} />
            <span className="text-xs text-gray-400">Lag</span>
          </div>
          <div className="text-xl font-bold" style={{ color: lagColor }}>
            {lag.toFixed(0)}ms
          </div>
          <div className="text-xs" style={{ color: lagColor }}>
            {lagStatus}
          </div>
        </div>

        {/* Throughput */}
        <div className="p-3 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center gap-2 mb-1">
            <Zap className="w-4 h-4" style={{ color: hubColor }} />
            <span className="text-xs text-gray-400">Throughput</span>
          </div>
          <div className="text-xl font-bold text-white">
            {formatThroughput(throughput)}
          </div>
          <div className="text-xs text-gray-500">
            Buffer: {bufferSize}/100
          </div>
        </div>

        {/* Control Button */}
        <div className="p-3 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <button
            onClick={isPaused ? resume : pause}
            disabled={!isStreaming}
            className="flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all disabled:opacity-50 hover:bg-white/10"
          >
            {isPaused ? (
              <>
                <Play className="w-6 h-6" style={{ color: hubColor }} />
                <span className="text-xs text-gray-400">Resume</span>
              </>
            ) : (
              <>
                <Pause className="w-6 h-6" style={{ color: hubColor }} />
                <span className="text-xs text-gray-400">Pause</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Latest Prediction */}
      {latestPrediction ? (
        <div className="mb-4 p-4 rounded-lg bg-white/5 border border-white/10">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-400">Latest Prediction</span>
            <span className="text-xs text-gray-500">
              {latestPrediction.timestamp.toLocaleTimeString()}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-3">
            {/* Output Values */}
            <div>
              <div className="text-xs text-gray-500 mb-1">Output</div>
              <div className="flex gap-2">
                {latestPrediction.output.map((val, i) => (
                  <div
                    key={i}
                    className="text-lg font-bold"
                    style={{ color: hubColor }}
                  >
                    {val.toFixed(3)}
                  </div>
                ))}
              </div>
            </div>

            {/* Confidence */}
            <div className="text-right">
              <div className="text-xs text-gray-500 mb-1">Confidence</div>
              <div
                className="text-2xl font-bold"
                style={{
                  color: latestPrediction.confidence > 0.8 ? '#22c55e' :
                    latestPrediction.confidence > 0.5 ? '#eab308' : '#ef4444'
                }}
              >
                {(latestPrediction.confidence * 100).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Latency Bar */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">Inference Latency</span>
            <span style={{ color: getLagColor(latestPrediction.latencyMs) }}>
              {latestPrediction.latencyMs.toFixed(1)}ms
            </span>
          </div>
          <div className="mt-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min((latestPrediction.latencyMs / 100) * 100, 100)}%`,
                backgroundColor: getLagColor(latestPrediction.latencyMs)
              }}
            />
          </div>
        </div>
      ) : (
        <div className="mb-4 p-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
          <span className="text-sm text-gray-500">Waiting for data stream...</span>
        </div>
      )}

      {/* Prediction History */}
      {predictions.length > 1 && (
        <div className="flex-1 overflow-auto">
          <div className="text-xs text-gray-500 mb-2">Recent Predictions</div>
          <div className="space-y-2">
            {predictions.slice(1, 11).map((pred) => (
              <div
                key={pred.id}
                className="p-2 rounded bg-white/5 text-sm flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs text-gray-500">
                    {pred.timestamp.toLocaleTimeString()}
                  </span>
                  <span className="text-gray-400 font-mono">
                    [{pred.input.slice(0, 3).map(v => v.toFixed(2)).join(', ')}]
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-gray-300 font-mono">
                    → [{pred.output.map(v => v.toFixed(2)).join(', ')}]
                  </span>
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: pred.confidence > 0.8 ? 'rgba(34, 197, 94, 0.2)' :
                        pred.confidence > 0.5 ? 'rgba(234, 179, 8, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                      color: pred.confidence > 0.8 ? '#22c55e' :
                        pred.confidence > 0.5 ? '#eab308' : '#ef4444'
                    }}
                  >
                    {(pred.confidence * 100).toFixed(0)}%
                  </span>
                  <span className="text-xs text-gray-500 w-14 text-right">
                    {pred.latencyMs.toFixed(0)}ms
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Glassmorphism style injection */}
      <style>{`
        .glassmorphic-panel {
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
        }
      `}</style>
    </div>
  )
}

export default StreamingPredictionPanel
