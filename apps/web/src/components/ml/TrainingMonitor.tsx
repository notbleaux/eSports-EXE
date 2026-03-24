/**
 * Training Monitor Component
 * 
 * [Ver001.000]
 * 
 * Real-time training progress UI:
 * - Loss/accuracy graphs
 * - Model comparison
 * - Export functionality
 * 
 * Agent: TL-S3-3-C
 * Team: ML Training Pipeline (TL-S3)
 */

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { mlLogger } from '@/utils/logger'
import type { TrainingJob, TrainingProgress, TrainingResult, JobStatus } from '@/lib/ml/training/orchestrator'
import type { Trial, SearchResult } from '@/lib/ml/training/hyperparameters'
import type { CrossValidationResult } from '@/lib/ml/training/validation'

// ============================================================================
// Types
// ============================================================================

interface TrainingMonitorProps {
  jobs?: TrainingJob[]
  onExportModel?: (jobId: string) => void
  onCancelJob?: (jobId: string) => void
  onCompareModels?: (jobIds: string[]) => void
  className?: string
}

interface ChartDataPoint {
  epoch: number
  loss?: number
  valLoss?: number
  accuracy?: number
  valAccuracy?: number
  learningRate?: number
}

interface JobView {
  job: TrainingJob
  history: ChartDataPoint[]
  isSelected: boolean
}

interface ComparisonData {
  metric: string
  [jobId: string]: number | string
}

// ============================================================================
// Utility Components
// ============================================================================

const StatusBadge: React.FC<{ status: JobStatus }> = ({ status }) => {
  const statusStyles: Record<JobStatus, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse',
    paused: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${statusStyles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

const ProgressBar: React.FC<{ progress: number; className?: string }> = ({ 
  progress, 
  className = '' 
}) => (
  <div className={`w-full bg-gray-700 rounded-full h-2 ${className}`}>
    <div
      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
)

const MetricCard: React.FC<{
  label: string
  value: string | number
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
}> = ({ label, value, trend, trendValue }) => {
  const trendColors = {
    up: 'text-green-400',
    down: 'text-red-400',
    neutral: 'text-gray-400'
  }

  return (
    <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
      <div className="text-gray-400 text-sm">{label}</div>
      <div className="text-2xl font-bold text-white mt-1">{value}</div>
      {trend && trendValue && (
        <div className={`text-xs mt-1 ${trendColors[trend]}`}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Main Component
// ============================================================================

export const TrainingMonitor: React.FC<TrainingMonitorProps> = ({
  jobs = [],
  onExportModel,
  onCancelJob,
  onCompareModels,
  className = ''
}) => {
  // State
  const [jobViews, setJobViews] = useState<Map<string, JobView>>(new Map())
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null)
  const [selectedForCompare, setSelectedForCompare] = useState<Set<string>>(new Set())
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'comparison'>('overview')
  const [isRealtime, setIsRealtime] = useState(true)
  
  const chartRefs = useRef<Map<string, ChartDataPoint[]>>(new Map())

  // Initialize job views from props
  useEffect(() => {
    setJobViews(prev => {
      const updated = new Map(prev)
      
      for (const job of jobs) {
        const existing = updated.get(job.id)
        if (!existing) {
          updated.set(job.id, {
            job,
            history: [],
            isSelected: false
          })
        } else {
          existing.job = job
          
          // Update history if there's new progress
          if (job.progress) {
            const history = chartRefs.current.get(job.id) || existing.history
            const lastPoint = history[history.length - 1]
            
            if (!lastPoint || lastPoint.epoch !== job.progress.epoch) {
              const newPoint: ChartDataPoint = {
                epoch: job.progress.epoch,
                loss: job.progress.loss,
                valLoss: job.progress.valLoss,
                accuracy: job.progress.metrics?.accuracy,
                valAccuracy: job.progress.metrics?.valAccuracy,
                learningRate: job.progress.learningRate
              }
              history.push(newPoint)
              chartRefs.current.set(job.id, history)
              existing.history = [...history]
            }
          }
        }
      }
      
      return updated
    })
  }, [jobs])

  // Update selected job history
  const selectedJob = selectedJobId ? jobViews.get(selectedJobId) : null

  // Handle job selection
  const handleSelectJob = useCallback((jobId: string) => {
    setSelectedJobId(jobId)
    setActiveTab('metrics')
  }, [])

  // Handle comparison toggle
  const handleToggleCompare = useCallback((jobId: string) => {
    setSelectedForCompare(prev => {
      const next = new Set(prev)
      if (next.has(jobId)) {
        next.delete(jobId)
      } else if (next.size < 4) {
        next.add(jobId)
      }
      return next
    })
  }, [])

  // Handle export
  const handleExport = useCallback((jobId: string) => {
    onExportModel?.(jobId)
  }, [onExportModel])

  // Handle cancel
  const handleCancel = useCallback((jobId: string) => {
    if (confirm('Are you sure you want to cancel this training job?')) {
      onCancelJob?.(jobId)
    }
  }, [onCancelJob])

  // Handle compare
  const handleCompare = useCallback(() => {
    if (selectedForCompare.size >= 2) {
      onCompareModels?.(Array.from(selectedForCompare))
      setActiveTab('comparison')
    }
  }, [selectedForCompare, onCompareModels])

  // Format time
  const formatTime = (ms: number): string => {
    if (ms < 60000) return `${Math.floor(ms / 1000)}s`
    if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`
    return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`
  }

  // Get color for job line
  const getJobColor = (index: number): string => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899']
    return colors[index % colors.length]
  }

  // ============================================================================
  // Render Helpers
  // ============================================================================

  const renderJobList = () => (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Training Jobs</h3>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">
            {Array.from(jobViews.values()).filter(j => j.job.status === 'running').length} running
          </span>
          {selectedForCompare.size >= 2 && (
            <button
              onClick={handleCompare}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-md transition-colors"
            >
              Compare ({selectedForCompare.size})
            </button>
          )}
        </div>
      </div>
      
      {Array.from(jobViews.values()).map(({ job }) => (
        <div
          key={job.id}
          className={`p-3 rounded-lg border cursor-pointer transition-all ${
            selectedJobId === job.id
              ? 'bg-blue-900/20 border-blue-500'
              : 'bg-gray-800/50 border-gray-700 hover:border-gray-600'
          }`}
          onClick={() => handleSelectJob(job.id)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedForCompare.has(job.id)}
                onChange={(e) => {
                  e.stopPropagation()
                  handleToggleCompare(job.id)
                }}
                className="w-4 h-4 rounded border-gray-600"
              />
              <div>
                <div className="font-medium text-white">{job.name}</div>
                <div className="text-xs text-gray-400">{job.type} • {job.samples.length} samples</div>
              </div>
            </div>
            <StatusBadge status={job.status} />
          </div>
          
          {job.progress && job.status === 'running' && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Epoch {job.progress.epoch}/{job.progress.totalEpochs}</span>
                <span>{((job.progress.epoch / job.progress.totalEpochs) * 100).toFixed(0)}%</span>
              </div>
              <ProgressBar progress={(job.progress.epoch / job.progress.totalEpochs) * 100} />
            </div>
          )}
          
          {job.result && (
            <div className="mt-2 flex gap-4 text-xs">
              <span className="text-green-400">
                Acc: {((job.result.finalMetrics.accuracy || 0) * 100).toFixed(1)}%
              </span>
              <span className="text-gray-400">
                Time: {formatTime(job.result.trainingTimeMs)}
              </span>
            </div>
          )}
          
          <div className="mt-2 flex gap-2">
            {job.status === 'running' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleCancel(job.id)
                }}
                className="text-xs px-2 py-1 bg-red-600/20 text-red-400 rounded hover:bg-red-600/30 transition-colors"
              >
                Cancel
              </button>
            )}
            {job.status === 'completed' && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleExport(job.id)
                }}
                className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded hover:bg-green-600/30 transition-colors"
              >
                Export
              </button>
            )}
          </div>
        </div>
      ))}
      
      {jobViews.size === 0 && (
        <div className="text-center py-8 text-gray-500">
          No training jobs yet
        </div>
      )}
    </div>
  )

  const renderMetricsTab = () => {
    if (!selectedJob) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Select a job to view metrics
        </div>
      )
    }

    const { job, history } = selectedJob
    const latest = history[history.length - 1]

    return (
      <div className="space-y-6">
        {/* Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            label="Current Epoch"
            value={job.progress?.epoch || job.result?.totalEpochs || 0}
          />
          <MetricCard
            label="Loss"
            value={latest?.loss?.toFixed(4) || '-'}
            trend={latest && history.length > 1 ? (latest.loss! < history[history.length - 2]?.loss! ? 'down' : 'up') : undefined}
            trendValue="vs last epoch"
          />
          <MetricCard
            label="Accuracy"
            value={latest?.accuracy ? `${(latest.accuracy * 100).toFixed(1)}%` : '-'}
            trend={latest && history.length > 1 ? (latest.accuracy! > history[history.length - 2]?.accuracy! ? 'up' : 'down') : undefined}
            trendValue="vs last epoch"
          />
          <MetricCard
            label="ETA"
            value={job.progress?.estimatedTimeRemaining ? formatTime(job.progress.estimatedTimeRemaining) : '-'}
          />
        </div>

        {/* Loss Chart */}
        {history.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4">Loss Over Time</h4>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="epoch" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="loss" 
                  stroke="#3B82F6" 
                  name="Training Loss"
                  strokeWidth={2}
                  dot={false}
                />
                {latest?.valLoss !== undefined && (
                  <Line 
                    type="monotone" 
                    dataKey="valLoss" 
                    stroke="#10B981" 
                    name="Validation Loss"
                    strokeWidth={2}
                    dot={false}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Accuracy Chart */}
        {history.some(h => h.accuracy !== undefined) && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4">Accuracy Over Time</h4>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="epoch" 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                />
                <YAxis 
                  stroke="#9CA3AF"
                  tick={{ fill: '#9CA3AF' }}
                  domain={[0, 1]}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => [(value * 100).toFixed(1) + '%', '']}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="accuracy" 
                  stroke="#8B5CF6" 
                  fill="#8B5CF6"
                  fillOpacity={0.2}
                  name="Training Accuracy"
                />
                {latest?.valAccuracy !== undefined && (
                  <Area 
                    type="monotone" 
                    dataKey="valAccuracy" 
                    stroke="#F59E0B" 
                    fill="#F59E0B"
                    fillOpacity={0.2}
                    name="Validation Accuracy"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Final Results */}
        {job.result && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-3">Final Results</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(job.result.finalMetrics).map(([key, value]) => (
                <div key={key} className="bg-gray-900/50 rounded p-3">
                  <div className="text-gray-400 text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                  <div className="text-white font-mono text-lg">
                    {typeof value === 'number' 
                      ? (value < 1 && value > 0 ? `${(value * 100).toFixed(1)}%` : value.toFixed(4))
                      : value}
                  </div>
                </div>
              ))}
              <div className="bg-gray-900/50 rounded p-3">
                <div className="text-gray-400 text-xs">Training Time</div>
                <div className="text-white font-mono text-lg">{formatTime(job.result.trainingTimeMs)}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  const renderComparisonTab = () => {
    if (selectedForCompare.size < 2) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Select at least 2 jobs to compare
        </div>
      )
    }

    const selectedJobs = Array.from(selectedForCompare)
      .map(id => jobViews.get(id))
      .filter((j): j is JobView => j !== undefined)
      .filter(j => j.job.result)

    if (selectedJobs.length < 2) {
      return (
        <div className="flex items-center justify-center h-64 text-gray-500">
          Selected jobs must be completed to compare
        </div>
      )
    }

    // Build comparison data
    const allMetrics = new Set<string>()
    selectedJobs.forEach(j => {
      Object.keys(j.job.result!.finalMetrics).forEach(m => allMetrics.add(m))
    })

    const comparisonData: ComparisonData[] = Array.from(allMetrics).map(metric => ({
      metric: metric.charAt(0).toUpperCase() + metric.slice(1).replace(/([A-Z])/g, ' $1'),
      ...Object.fromEntries(selectedJobs.map(j => [
        j.job.id,
        j.job.result!.finalMetrics[metric]?.toFixed(4) || '-'
      ]))
    }))

    // Combine histories for chart
    const combinedHistory = selectedJobs[0].history.map((point, idx) => ({
      epoch: point.epoch,
      ...Object.fromEntries(selectedJobs.map((j, i) => [
        `${j.job.name}_loss`,
        j.history[idx]?.loss
      ]))
    }))

    return (
      <div className="space-y-6">
        {/* Comparison Table */}
        <div className="bg-gray-800/50 border border-gray-700 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-900/50">
                <th className="px-4 py-3 text-left text-gray-400 font-medium">Metric</th>
                {selectedJobs.map((j, i) => (
                  <th key={j.job.id} className="px-4 py-3 text-left text-gray-400 font-medium">
                    <span style={{ color: getJobColor(i) }}>{j.job.name}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonData.map((row, idx) => (
                <tr key={row.metric} className={idx % 2 === 0 ? 'bg-gray-800/30' : ''}>
                  <td className="px-4 py-3 text-gray-300">{row.metric}</td>
                  {selectedJobs.map(j => (
                    <td key={j.job.id} className="px-4 py-3 text-white font-mono">
                      {row[j.job.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Comparison Chart */}
        {combinedHistory.length > 0 && (
          <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
            <h4 className="text-white font-medium mb-4">Loss Comparison</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={combinedHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="epoch" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151',
                    borderRadius: '6px'
                  }}
                />
                <Legend />
                {selectedJobs.map((j, i) => (
                  <Line
                    key={j.job.id}
                    type="monotone"
                    dataKey={`${j.job.name}_loss`}
                    stroke={getJobColor(i)}
                    name={j.job.name}
                    strokeWidth={2}
                    dot={false}
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    )
  }

  // ============================================================================
  // Main Render
  // ============================================================================

  return (
    <div className={`bg-gray-900 rounded-xl border border-gray-800 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white">Training Monitor</h2>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer">
              <input
                type="checkbox"
                checked={isRealtime}
                onChange={(e) => setIsRealtime(e.target.checked)}
                className="rounded border-gray-600"
              />
              Real-time updates
            </label>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-gray-800">
        <div className="flex gap-6">
          {(['overview', 'metrics', 'comparison'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar - Job List */}
          <div className="lg:col-span-1">
            {renderJobList()}
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'overview' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Overview</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Total Jobs</div>
                    <div className="text-3xl font-bold text-white">{jobViews.size}</div>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Completed</div>
                    <div className="text-3xl font-bold text-green-400">
                      {Array.from(jobViews.values()).filter(j => j.job.status === 'completed').length}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Running</div>
                    <div className="text-3xl font-bold text-blue-400">
                      {Array.from(jobViews.values()).filter(j => j.job.status === 'running').length}
                    </div>
                  </div>
                  <div className="bg-gray-800/50 border border-gray-700 rounded-lg p-4">
                    <div className="text-gray-400 text-sm">Failed</div>
                    <div className="text-3xl font-bold text-red-400">
                      {Array.from(jobViews.values()).filter(j => j.job.status === 'failed').length}
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {activeTab === 'metrics' && renderMetricsTab()}
            {activeTab === 'comparison' && renderComparisonTab()}
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrainingMonitor
