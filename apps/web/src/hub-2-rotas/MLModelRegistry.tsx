// @ts-nocheck
/**
 * ML Model Registry Component
 * Hub-2-ROTAS: Model management, versioning, metrics, and A/B testing
 * 
 * [Ver001.000]
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { mlLogger } from '@/utils/logger'
import { 
  Box, 
  Database, 
  Activity, 
  GitBranch, 
  GitCompare, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
  TrendingUp,
  Clock,
  HardDrive,
  Zap,
  Layers,
  BarChart3,
  GitCommit,
  ArrowRight,
  Plus,
  Trash2,
  Settings,
  Cpu,
  Scale,
  Download,
  Server
} from 'lucide-react'
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts'
import { motion, AnimatePresence } from 'framer-motion'

import { mlRegistry } from '../../api/mlRegistry'
import type { 
  MLModel, 
  ModelStatus, 
  ABTest, 
  ModelMetric,
  ActiveDeployment,
  ModelComparison 
} from '../../types/mlRegistry'
import { useMLModelManager } from '../../hooks/useMLModelManager'

// ============================================================================
// Types & Constants
// ============================================================================

interface MLModelRegistryProps {
  hub?: 'SATOR' | 'ROTAS' | 'AREPO' | 'OPERA' | 'TENET'
  className?: string
}

type ViewMode = 'list' | 'detail' | 'compare' | 'abtests' | 'deployments'

const HUB_COLORS = {
  SATOR: '#ffd700',
  ROTAS: '#00d4ff',
  AREPO: '#0066ff',
  OPERA: '#9d4edd',
  TENET: '#ffffff'
}

const STATUS_COLORS: Record<ModelStatus, string> = {
  development: '#6b7280',
  staging: '#f59e0b',
  production: '#22c55e',
  archived: '#6366f1',
  deprecated: '#ef4444'
}

const STATUS_LABELS: Record<ModelStatus, string> = {
  development: 'Development',
  staging: 'Staging',
  production: 'Production',
  archived: 'Archived',
  deprecated: 'Deprecated'
}

// ============================================================================
// Helper Components
// ============================================================================

const StatusBadge: React.FC<{ status: ModelStatus | string }> = ({ status }) => (
  <span 
    className="px-2 py-1 rounded-full text-xs font-medium"
    style={{ 
      backgroundColor: `${STATUS_COLORS[status as ModelStatus] || '#6b7280'}20`,
      color: STATUS_COLORS[status as ModelStatus] || '#6b7280'
    }}
  >
    {STATUS_LABELS[status as ModelStatus] || status}
  </span>
)

const MetricCard: React.FC<{
  title: string
  value: string | number
  unit?: string
  icon: React.ReactNode
  trend?: 'up' | 'down' | 'neutral'
  color?: string
}> = ({ title, value, unit, icon, trend = 'neutral', color = '#00d4ff' }) => (
  <div className="bg-white/5 rounded-lg p-4 border border-white/10">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-400">{title}</span>
      <span style={{ color }}>{icon}</span>
    </div>
    <div className="flex items-baseline gap-1">
      <span className="text-2xl font-bold text-white">{value}</span>
      {unit && <span className="text-sm text-gray-500">{unit}</span>}
    </div>
    {trend !== 'neutral' && (
      <div className={`text-xs mt-1 ${trend === 'up' ? 'text-green-400' : 'text-red-400'}`}>
        {trend === 'up' ? '↑' : '↓'} {trend === 'up' ? 'Improved' : 'Declined'}
      </div>
    )}
  </div>
)

const LoadingSpinner: React.FC<{ color?: string }> = ({ color = '#00d4ff' }) => (
  <div className="flex items-center justify-center p-8">
    <div 
      className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin"
      style={{ borderColor: `${color}40`, borderTopColor: color }}
    />
  </div>
)

// ============================================================================
// Main Component
// ============================================================================

export const MLModelRegistry: React.FC<MLModelRegistryProps> = ({ 
  hub = 'ROTAS',
  className = '' 
}) => {
  const hubColor = HUB_COLORS[hub]
  const { loadModel } = useMLModelManager()
  
  // State
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [models, setModels] = useState<MLModel[]>([])
  const [selectedModel, setSelectedModel] = useState<MLModel | null>(null)
  const [compareModel, setCompareModel] = useState<MLModel | null>(null)
  const [abTests, setABTests] = useState<ABTest[]>([])
  const [deployments, setDeployments] = useState<ActiveDeployment[]>([])
  const [metrics, setMetrics] = useState<ModelMetric[]>([])
  const [comparison, setComparison] = useState<ModelComparison | null>(null)
  
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<ModelStatus | 'all'>('all')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  
  // Load models
  const loadModels = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const params: Record<string, string> = {}
      if (searchQuery) params.name = searchQuery
      if (statusFilter !== 'all') params.status = statusFilter
      if (typeFilter !== 'all') params.type = typeFilter
      
      const response = await mlRegistry.getModels(params)
      setModels(response.models)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models')
    } finally {
      setIsLoading(false)
    }
  }, [searchQuery, statusFilter, typeFilter])
  
  // Load A/B tests
  const loadABTests = useCallback(async () => {
    try {
      const tests = await mlRegistry.getABTests()
      setABTests(tests)
    } catch (err) {
      mlLogger.error('Failed to load A/B tests', {
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }, [])
  
  // Load deployments
  const loadDeployments = useCallback(async () => {
    try {
      const deps = await mlRegistry.getActiveDeployments()
      setDeployments(deps)
    } catch (err) {
      mlLogger.error('Failed to load deployments', {
        error: err instanceof Error ? err.message : String(err),
      })
    }
  }, [])
  
  // Load model metrics
  const loadModelMetrics = useCallback(async (modelId: string) => {
    try {
      const history = await mlRegistry.getModelMetrics(modelId, { limit: 100 })
      setMetrics(history.metrics)
    } catch (err) {
      mlLogger.error('Failed to load metrics', {
        error: err instanceof Error ? err.message : String(err),
        modelId,
      })
    }
  }, [])
  
  // Initial load
  useEffect(() => {
    loadModels()
    loadABTests()
    loadDeployments()
  }, [])
  
  // Reload when filters change
  useEffect(() => {
    const timeout = setTimeout(loadModels, 300)
    return () => clearTimeout(timeout)
  }, [searchQuery, statusFilter, typeFilter, loadModels])
  
  // Load metrics when model selected
  useEffect(() => {
    if (selectedModel) {
      loadModelMetrics(selectedModel.id)
    }
  }, [selectedModel, loadModelMetrics])
  
  // Load comparison when second model selected
  useEffect(() => {
    if (selectedModel && compareModel && viewMode === 'compare') {
      mlRegistry.compareModels(selectedModel.id, compareModel.id)
        .then(setComparison)
        .catch((err) => {
          mlLogger.error('Failed to compare models', {
            error: err instanceof Error ? err.message : String(err),
            modelId1: selectedModel.id,
            modelId2: compareModel.id,
          })
        })
    }
  }, [selectedModel, compareModel, viewMode])
  
  // Handle model selection
  const handleSelectModel = (model: MLModel) => {
    setSelectedModel(model)
    setViewMode('detail')
  }
  
  // Handle model comparison
  const handleCompare = (model: MLModel) => {
    if (selectedModel && selectedModel.id !== model.id) {
      setCompareModel(model)
      setViewMode('compare')
    }
  }
  
  // Handle deploy
  const handleDeploy = async (model: MLModel, environment: string) => {
    try {
      await mlRegistry.deployModel(model.id, {
        environment: environment as any,
        deployment_type: 'full',
        traffic_percentage: 100
      })
      await loadDeployments()
      await loadModels()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Deployment failed')
    }
  }
  
  // Handle load model locally
  const handleLoadLocal = async (model: MLModel) => {
    if (model.artifact_url) {
      await loadModel(model.id, model.artifact_url, { 
        name: `${model.name} v${model.version}`,
        quantization: model.quantization === 'int8' ? 8 : model.quantization === 'int16' ? 16 : 32
      })
    }
  }
  
  // Chart data preparation
  const metricsChartData = useMemo(() => {
    const grouped = metrics.reduce((acc, m) => {
      if (!acc[m.metric_name]) acc[m.metric_name] = []
      acc[m.metric_name].push({
        time: new Date(m.recorded_at).toLocaleDateString(),
        value: m.metric_value
      })
      return acc
    }, {} as Record<string, { time: string; value: number }[]>)
    
    return Object.entries(grouped).map(([name, data]) => ({
      name,
      data: data.slice(-20) // Last 20 points
    }))
  }, [metrics])
  
  // ============================================================================
  // Views
  // ============================================================================
  
  // List View
  const ListView = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
          />
        </div>
        
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ModelStatus | 'all')}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="all">All Status</option>
          <option value="development">Development</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
          <option value="archived">Archived</option>
        </select>
        
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/30"
        >
          <option value="all">All Types</option>
          <option value="classification">Classification</option>
          <option value="regression">Regression</option>
          <option value="clustering">Clustering</option>
        </select>
        
        <button
          onClick={() => loadModels()}
          className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
        >
          <RotateCcw className="w-4 h-4 text-gray-400" />
        </button>
      </div>
      
      {/* Models Grid */}
      {isLoading ? (
        <LoadingSpinner color={hubColor} />
      ) : error ? (
        <div className="text-center py-8 text-red-400">{error}</div>
      ) : models.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No models found</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {models.map((model) => (
            <motion.div
              key={model.id}
              layoutId={model.id}
              onClick={() => handleSelectModel(model)}
              className="bg-white/5 border border-white/10 rounded-xl p-4 cursor-pointer hover:border-white/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white group-hover:text-white/90">
                    {model.name}
                  </h3>
                  <span className="text-sm text-gray-400">v{model.version}</span>
                </div>
                <StatusBadge status={model.status} />
              </div>
              
              <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                <span className="flex items-center gap-1">
                  <Cpu className="w-3 h-3" />
                  {model.framework || 'unknown'}
                </span>
                <span className="flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  {model.type}
                </span>
                {model.size_bytes && (
                  <span className="flex items-center gap-1">
                    <HardDrive className="w-3 h-3" />
                    {(model.size_bytes / 1024 / 1024).toFixed(1)}MB
                  </span>
                )}
              </div>
              
              {model.accuracy !== undefined && (
                <div className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-500">Accuracy</span>
                      <span style={{ color: hubColor }}>{(model.accuracy * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all"
                        style={{ 
                          width: `${model.accuracy * 100}%`,
                          backgroundColor: hubColor 
                        }}
                      />
                    </div>
                  </div>
                  
                  {model.avg_latency_ms && (
                    <div className="text-xs text-gray-500">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {model.avg_latency_ms.toFixed(1)}ms
                    </div>
                  )}
                </div>
              )}
              
              {model.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {model.tags.slice(0, 3).map((tag) => (
                    <span 
                      key={tag}
                      className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-400"
                    >
                      {tag}
                    </span>
                  ))}
                  {model.tags.length > 3 && (
                    <span className="text-xs px-2 py-0.5 rounded bg-white/5 text-gray-500">
                      +{model.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
  
  // Detail View
  const DetailView = () => {
    if (!selectedModel) return null
    
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <button
              onClick={() => setViewMode('list')}
              className="text-sm text-gray-400 hover:text-white mb-2 flex items-center gap-1"
            >
              <ChevronUp className="w-4 h-4" />
              Back to list
            </button>
            <h2 className="text-2xl font-bold text-white">{selectedModel.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-gray-400">v{selectedModel.version}</span>
              <StatusBadge status={selectedModel.status} />
              {selectedModel.framework && (
                <span className="text-sm text-gray-500">{selectedModel.framework}</span>
              )}
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleCompare(selectedModel)}
              disabled={!models.find(m => m.id !== selectedModel.id)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" />
              Compare
            </button>
            
            {selectedModel.artifact_url && (
              <button
                onClick={() => handleLoadLocal(selectedModel)}
                className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
                style={{ backgroundColor: hubColor, color: '#0a0a0f' }}
              >
                <Download className="w-4 h-4" />
                Load Local
              </button>
            )}
            
            {selectedModel.status !== 'production' && (
              <button
                onClick={() => handleDeploy(selectedModel, 'production')}
                className="px-3 py-2 rounded-lg bg-green-500/20 border border-green-500/30 text-sm text-green-400 hover:bg-green-500/30 flex items-center gap-2"
              >
                <Play className="w-4 h-4" />
                Deploy
              </button>
            )}
          </div>
        </div>
        
        {/* Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard
            title="Accuracy"
            value={selectedModel.accuracy !== undefined ? (selectedModel.accuracy * 100).toFixed(2) : 'N/A'}
            unit="%"
            icon={<Activity className="w-4 h-4" />}
            color={hubColor}
          />
          <MetricCard
            title="Latency (P95)"
            value={selectedModel.p95_latency_ms?.toFixed(1) || 'N/A'}
            unit="ms"
            icon={<Clock className="w-4 h-4" />}
            color={hubColor}
          />
          <MetricCard
            title="Model Size"
            value={selectedModel.size_bytes ? (selectedModel.size_bytes / 1024 / 1024).toFixed(1) : 'N/A'}
            unit="MB"
            icon={<HardDrive className="w-4 h-4" />}
            color={hubColor}
          />
          <MetricCard
            title="Memory Usage"
            value={selectedModel.memory_usage_mb?.toFixed(1) || 'N/A'}
            unit="MB"
            icon={<Zap className="w-4 h-4" />}
            color={hubColor}
          />
        </div>
        
        {/* Metrics Chart */}
        {metricsChartData.length > 0 && (
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="font-medium text-white mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4" style={{ color: hubColor }} />
              Performance History
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={metricsChartData[0]?.data || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="time" stroke="#6b7280" fontSize={12} />
                  <YAxis stroke="#6b7280" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#1a1a2e', 
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  {metricsChartData.map((series, idx) => (
                    <Line
                      key={series.name}
                      type="monotone"
                      dataKey="value"
                      data={series.data}
                      stroke={[hubColor, '#22c55e', '#f59e0b', '#ef4444'][idx % 4]}
                      strokeWidth={2}
                      dot={false}
                      name={series.name}
                    />
                  ))}
                  <Legend />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        
        {/* Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="font-medium text-white mb-3 flex items-center gap-2">
              <Settings className="w-4 h-4" style={{ color: hubColor }} />
              Configuration
            </h3>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Framework</span>
                <span className="text-white">{selectedModel.framework || 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Quantization</span>
                <span className="text-white uppercase">{selectedModel.quantization}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Type</span>
                <span className="text-white capitalize">{selectedModel.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Created</span>
                <span className="text-white">
                  {new Date(selectedModel.created_at).toLocaleDateString()}
                </span>
              </div>
              {selectedModel.trained_at && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Trained</span>
                  <span className="text-white">
                    {new Date(selectedModel.trained_at).toLocaleDateString()}
                  </span>
                </div>
              )}
            </dl>
          </div>
          
          {selectedModel.description && (
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h3 className="font-medium text-white mb-3">Description</h3>
              <p className="text-sm text-gray-400">{selectedModel.description}</p>
            </div>
          )}
        </div>
        
        {/* Tags */}
        {selectedModel.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedModel.tags.map((tag) => (
              <span 
                key={tag}
                className="text-sm px-3 py-1 rounded-full bg-white/5 text-gray-300 border border-white/10"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    )
  }
  
  // Compare View
  const CompareView = () => {
    if (!selectedModel || !compareModel) return null
    
    const comparisonMetrics = [
      { label: 'Accuracy', key: 'accuracy', format: (v: number) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
      { label: 'Precision', key: 'precision', format: (v: number) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
      { label: 'Recall', key: 'recall', format: (v: number) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
      { label: 'F1 Score', key: 'f1_score', format: (v: number) => `${(v * 100).toFixed(1)}%`, higherIsBetter: true },
      { label: 'Avg Latency', key: 'avg_latency_ms', format: (v: number) => `${v.toFixed(1)}ms`, higherIsBetter: false },
      { label: 'P95 Latency', key: 'p95_latency_ms', format: (v: number) => `${v.toFixed(1)}ms`, higherIsBetter: false },
      { label: 'Memory', key: 'memory_usage_mb', format: (v: number) => `${v.toFixed(1)}MB`, higherIsBetter: false },
      { label: 'Size', key: 'size_bytes', format: (v: number) => `${(v / 1024 / 1024).toFixed(1)}MB`, higherIsBetter: false },
    ]
    
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setViewMode('detail')}
            className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
          >
            <ChevronUp className="w-4 h-4" />
            Back to detail
          </button>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const otherModels = models.filter(m => m.id !== selectedModel.id)
                if (otherModels.length > 0) {
                  const currentIdx = otherModels.findIndex(m => m.id === compareModel.id)
                  const nextIdx = (currentIdx + 1) % otherModels.length
                  setCompareModel(otherModels[nextIdx])
                }
              }}
              className="text-sm text-gray-400 hover:text-white flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Change Model
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          {/* Model A */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="font-semibold text-white mb-1">{selectedModel.name}</h3>
            <span className="text-sm text-gray-400">v{selectedModel.version}</span>
            <div className="mt-2">
              <StatusBadge status={selectedModel.status} />
            </div>
          </div>
          
          {/* Comparison */}
          <div className="flex items-center justify-center">
            <div className="text-center">
              <GitCompare className="w-8 h-8 mx-auto mb-2" style={{ color: hubColor }} />
              {comparison && (
                <span className={`text-sm font-medium ${
                  comparison.recommendation === 'A' ? 'text-green-400' :
                  comparison.recommendation === 'B' ? 'text-yellow-400' : 'text-gray-400'
                }`}>
                  {comparison.recommendation === 'A' ? 'A is better' :
                   comparison.recommendation === 'B' ? 'B is better' : 'Equivalent'}
                </span>
              )}
            </div>
          </div>
          
          {/* Model B */}
          <div className="bg-white/5 rounded-xl p-4 border border-white/10">
            <h3 className="font-semibold text-white mb-1">{compareModel.name}</h3>
            <span className="text-sm text-gray-400">v{compareModel.version}</span>
            <div className="mt-2">
              <StatusBadge status={compareModel.status} />
            </div>
          </div>
        </div>
        
        {/* Comparison Table */}
        <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-sm font-medium text-gray-400">Metric</th>
                <th className="text-center p-4 text-sm font-medium text-white">{selectedModel.name}</th>
                <th className="text-center p-4 text-sm font-medium text-white">{compareModel.name}</th>
                <th className="text-center p-4 text-sm font-medium text-gray-400">Winner</th>
              </tr>
            </thead>
            <tbody>
              {comparisonMetrics.map((metric) => {
                const aVal = selectedModel[metric.key as keyof MLModel] as number | undefined
                const bVal = compareModel[metric.key as keyof MLModel] as number | undefined
                
                let winner: 'A' | 'B' | '-' = '-'
                if (aVal !== undefined && bVal !== undefined) {
                  const aBetter = metric.higherIsBetter ? aVal > bVal : aVal < bVal
                  const bBetter = metric.higherIsBetter ? bVal > aVal : bVal < aVal
                  winner = aBetter ? 'A' : bBetter ? 'B' : '-'
                }
                
                return (
                  <tr key={metric.key} className="border-b border-white/5 last:border-0">
                    <td className="p-4 text-sm text-gray-400">{metric.label}</td>
                    <td className="p-4 text-center text-sm text-white">
                      {aVal !== undefined ? metric.format(aVal) : 'N/A'}
                    </td>
                    <td className="p-4 text-center text-sm text-white">
                      {bVal !== undefined ? metric.format(bVal) : 'N/A'}
                    </td>
                    <td className="p-4 text-center">
                      {winner === 'A' && <CheckCircle2 className="w-5 h-5 text-green-400 mx-auto" />}
                      {winner === 'B' && <CheckCircle2 className="w-5 h-5 text-yellow-400 mx-auto" />}
                      {winner === '-' && <span className="text-gray-500">-</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }
  
  // A/B Tests View
  const ABTestsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-white">A/B Tests</h3>
        <button
          onClick={() => {/* Open create modal */}}
          className="px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
          style={{ backgroundColor: hubColor, color: '#0a0a0f' }}
        >
          <Plus className="w-4 h-4" />
          New Test
        </button>
      </div>
      
      {abTests.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Scale className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No A/B tests yet</p>
          <p className="text-sm">Create a test to compare models</p>
        </div>
      ) : (
        <div className="space-y-3">
          {abTests.map((test) => (
            <div 
              key={test.id}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-medium text-white">{test.name}</h4>
                  <p className="text-sm text-gray-500">{test.description}</p>
                </div>
                <StatusBadge status={test.status} />
              </div>
              
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Traffic Split:</span>
                  <span className="text-white">{test.model_a_traffic_pct}% / {test.model_b_traffic_pct}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Metric:</span>
                  <span className="text-white capitalize">{test.success_metric}</span>
                </div>
                {test.winner_model_id && (
                  <div className="flex items-center gap-2">
                    <span className="text-green-400">Winner: {test.winner_model_id}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
  
  // Deployments View
  const DeploymentsView = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-white">Active Deployments</h3>
      
      {deployments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No active deployments</p>
        </div>
      ) : (
        <div className="space-y-3">
          {deployments.map((dep) => (
            <div 
              key={dep.id}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-medium text-white">
                    {dep.model_name} v{dep.model_version}
                  </h4>
                  <p className="text-sm text-gray-500 capitalize">{dep.environment}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400">
                    {dep.status}
                  </span>
                  {dep.traffic_percentage < 100 && (
                    <span className="text-xs px-2 py-1 rounded bg-yellow-500/20 text-yellow-400">
                      {dep.traffic_percentage}% traffic
                    </span>
                  )}
                </div>
              </div>
              
              {dep.endpoint_url && (
                <div className="mt-2 text-sm">
                  <span className="text-gray-500">Endpoint: </span>
                  <code className="text-gray-300">{dep.endpoint_url}</code>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
  
  // ============================================================================
  // Main Render
  // ============================================================================
  
  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Database className="w-5 h-5" style={{ color: hubColor }} />
          <h2 className="text-lg font-semibold text-white">ML Model Registry</h2>
        </div>
        
        {/* View Tabs */}
        <div className="flex items-center gap-1">
          {(['list', 'abtests', 'deployments'] as ViewMode[]).map((mode) => (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                viewMode === mode 
                  ? 'text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
              style={viewMode === mode ? { backgroundColor: `${hubColor}20`, color: hubColor } : {}}
            >
              {mode === 'list' && 'Models'}
              {mode === 'detail' && 'Details'}
              {mode === 'compare' && 'Compare'}
              {mode === 'abtests' && 'A/B Tests'}
              {mode === 'deployments' && 'Deployments'}
            </button>
          ))}
        </div>
      </div>
      
      {/* Content */}
      <div className="flex-1 overflow-auto p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={viewMode}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {viewMode === 'list' && <ListView />}
            {viewMode === 'detail' && <DetailView />}
            {viewMode === 'compare' && <CompareView />}
            {viewMode === 'abtests' && <ABTestsView />}
            {viewMode === 'deployments' && <DeploymentsView />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MLModelRegistry
