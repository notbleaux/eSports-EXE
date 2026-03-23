/**
 * Ingestion Dashboard Component
 * =============================
 * Dashboard for monitoring data ingestion pipeline.
 * 
 * Features:
 * - Data source status monitoring
 * - Ingestion history
 * - Error logs
 * - Manual trigger UI
 * 
 * [Ver001.000] - Ingestion dashboard component
 * 
 * Agent: TL-S6-3-A
 * Team: Data Ingestion (TL-S6)
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Database,
  Upload,
  RefreshCw,
  Play,
  Pause,
  Square,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  AlertTriangle,
  X,
  Plus,
  Settings,
  FileJson,
  Globe,
  FileText,
  Activity,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  Filter,
  Download,
  Search,
  MoreVertical,
  Zap,
  BarChart3,
  Calendar,
  Users,
  Trophy,
} from 'lucide-react';
import {
  createIngestionApi,
  createBatchJobManager,
  createConnector,
  DEFAULT_PANDASCORE_CONFIG,
  DEFAULT_LIQUIPEDIA_CONFIG,
  DEFAULT_HLTV_CONFIG,
  DEFAULT_MANUAL_CONFIG,
} from '@/lib/ingestion';
import type {
  DataSourceConfig,
  DataSourceHealth,
  BatchJob,
  IngestionHistoryEntry,
  IngestionMetrics,
  ErrorLogEntry,
  IngestionDataType,
  DataSourceType,
} from '@/lib/ingestion';

// =============================================================================
// Types
// =============================================================================

interface IngestionDashboardProps {
  className?: string;
  apiConfig?: {
    baseUrl: string;
    apiKey?: string;
  };
}

type TabType = 'overview' | 'sources' | 'jobs' | 'history' | 'errors';

// =============================================================================
// Helper Components
// =============================================================================

const StatusBadge: React.FC<{ status: string; size?: 'sm' | 'md' | 'lg' }> = ({ 
  status, 
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base',
  };

  const statusStyles: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400 border-green-500/30',
    inactive: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    syncing: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse',
    rate_limited: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    queued: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    running: 'bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse',
    paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    completed: 'bg-green-500/20 text-green-400 border-green-500/30',
    failed: 'bg-red-500/20 text-red-400 border-red-500/30',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    info: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  };

  return (
    <span className={`${sizeClasses[size]} rounded-full border ${statusStyles[status] || statusStyles.info}`}>
      {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
    </span>
  );
};

const MetricCard: React.FC<{
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'gray';
  trend?: { value: number; positive: boolean };
}> = ({ label, value, icon, color = 'blue', trend }) => {
  const colorStyles = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    yellow: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
    red: 'bg-red-500/10 border-red-500/20 text-red-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    gray: 'bg-gray-500/10 border-gray-500/20 text-gray-400',
  };

  return (
    <div className={`p-4 rounded-xl border ${colorStyles[color]} bg-surface-800/50`}>
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-lg bg-white/5">{icon}</div>
        {trend && (
          <div className={`flex items-center gap-1 text-sm ${trend.positive ? 'text-green-400' : 'text-red-400'}`}>
            {trend.positive ? '↑' : '↓'} {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-bold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
      </div>
    </div>
  );
};

const ProgressBar: React.FC<{ progress: number; className?: string }> = ({ progress, className = '' }) => (
  <div className={`h-2 bg-surface-700 rounded-full overflow-hidden ${className}`}>
    <div 
      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
      style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
    />
  </div>
);

// =============================================================================
// Source Card Component
// =============================================================================

const SourceCard: React.FC<{
  config: DataSourceConfig;
  health: DataSourceHealth;
  onEdit: () => void;
  onDelete: () => void;
  onSync: () => void;
  onTest: () => void;
}> = ({ config, health, onEdit, onDelete, onSync, onTest }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const sourceIcons: Record<DataSourceType, React.ReactNode> = {
    pandascore: <Database className="w-5 h-5" />,
    liquipedia: <Globe className="w-5 h-5" />,
    hltv: <FileText className="w-5 h-5" />,
    manual: <Upload className="w-5 h-5" />,
    file: <FileJson className="w-5 h-5" />,
  };

  return (
    <div className="bg-surface-800/50 border border-surface-700 rounded-xl overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-xl ${health.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {sourceIcons[config.type]}
          </div>
          <div>
            <h3 className="font-semibold text-white">{config.name}</h3>
            <p className="text-sm text-gray-400 capitalize">{config.type} • {health.requestsMade.toLocaleString()} requests</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={health.status} />
          {isExpanded ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-surface-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Avg Response</p>
              <p className="text-lg font-medium text-white">{health.avgResponseTime.toFixed(0)}ms</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Data Quality</p>
              <StatusBadge status={health.dataQuality} size="sm" />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Last Sync</p>
              <p className="text-lg font-medium text-white">
                {health.lastSync ? new Date(health.lastSync).toLocaleTimeString() : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">Errors</p>
              <p className={`text-lg font-medium ${health.errorCount > 0 ? 'text-red-400' : 'text-white'}`}>
                {health.errorCount}
              </p>
            </div>
          </div>

          {health.lastError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg mb-4">
              <p className="text-sm text-red-400">{health.lastError}</p>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onSync(); }}
              className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Sync Now
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onTest(); }}
              className="px-4 py-2 bg-surface-700 text-gray-300 rounded-lg hover:bg-surface-600 transition-colors"
            >
              Test
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="px-4 py-2 bg-surface-700 text-gray-300 rounded-lg hover:bg-surface-600 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Job Card Component
// =============================================================================

const JobCard: React.FC<{
  job: BatchJob;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  onView: () => void;
}> = ({ job, onPause, onResume, onCancel, onView }) => {
  const getActionButton = () => {
    switch (job.status) {
      case 'running':
        return (
          <button onClick={onPause} className="p-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30">
            <Pause className="w-4 h-4" />
          </button>
        );
      case 'paused':
        return (
          <button onClick={onResume} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">
            <Play className="w-4 h-4" />
          </button>
        );
      case 'queued':
        return (
          <button onClick={onCancel} className="p-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30">
            <X className="w-4 h-4" />
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-surface-800/50 border border-surface-700 rounded-xl p-4">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold text-white">{job.name}</h3>
            <StatusBadge status={job.status} size="sm" />
          </div>
          <p className="text-sm text-gray-400">
            {job.dataTypes.join(', ')} • Priority: {job.priority}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getActionButton()}
          <button onClick={onView} className="p-2 bg-surface-700 text-gray-300 rounded-lg hover:bg-surface-600">
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">{job.progress.currentStage}</span>
          <span className="text-white">{job.progress.percentComplete.toFixed(1)}%</span>
        </div>
        <ProgressBar progress={job.progress.percentComplete} />
        <div className="flex items-center justify-between text-xs text-gray-500">
          <span>{job.progress.processedRecords.toLocaleString()} / {job.progress.totalRecords.toLocaleString()} records</span>
          {job.progress.estimatedTimeRemaining && (
            <span>~{Math.ceil(job.progress.estimatedTimeRemaining / 1000 / 60)}m remaining</span>
          )}
        </div>
      </div>

      {job.progress.stages.length > 0 && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {job.progress.stages.map(stage => (
            <div 
              key={stage.name}
              className={`p-2 rounded-lg text-center text-xs ${
                stage.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                stage.status === 'running' ? 'bg-blue-500/20 text-blue-400' :
                'bg-surface-700 text-gray-500'
              }`}
            >
              <p className="font-medium capitalize">{stage.name}</p>
              <p>{stage.processed}/{stage.total}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Main Dashboard Component
// =============================================================================

export const IngestionDashboard: React.FC<IngestionDashboardProps> = ({ 
  className = '',
  apiConfig = { baseUrl: 'http://localhost:8000' },
}) => {
  // State
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [sources, setSources] = useState<{ config: DataSourceConfig; health: DataSourceHealth }[]>([]);
  const [jobs, setJobs] = useState<BatchJob[]>([]);
  const [history, setHistory] = useState<IngestionHistoryEntry[]>([]);
  const [errors, setErrors] = useState<ErrorLogEntry[]>([]);
  const [metrics, setMetrics] = useState<IngestionMetrics>({
    totalRecordsIngested: 0,
    recordsPerMinute: 0,
    avgProcessingTime: 0,
    successRate: 100,
    activeSources: 0,
    queuedJobs: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [showAddSource, setShowAddSource] = useState(false);
  const [showCreateJob, setShowCreateJob] = useState(false);

  // API and Manager refs
  const api = useMemo(() => createIngestionApi(apiConfig), [apiConfig]);
  const jobManager = useMemo(() => createBatchJobManager(), []);

  // Load initial data
  useEffect(() => {
    loadData();
    
    // Set up polling
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  // Set up job callbacks
  useEffect(() => {
    jobManager.onProgress((jobId, progress) => {
      setJobs(prev => prev.map(job => 
        job.id === jobId ? { ...job, progress } : job
      ));
    });

    jobManager.onComplete((jobId, results) => {
      setJobs(prev => prev.map(job => 
        job.id === jobId 
          ? { ...job, status: 'completed', results } 
          : job
      ));
    });

    jobManager.onError((jobId, error) => {
      setErrors(prev => [{
        id: `err_${Date.now()}`,
        timestamp: new Date().toISOString(),
        sourceType: 'manual',
        severity: 'error',
        message: error.error,
        details: { jobId, stage: error.stage },
      }, ...prev]);
    });
  }, [jobManager]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load sources
      const sourcesResponse = await api.sources.getSources();
      if (sourcesResponse.success && sourcesResponse.data) {
        const sourcesWithHealth = await Promise.all(
          sourcesResponse.data.map(async config => {
            const healthResponse = await api.sources.getHealth(config.id);
            return {
              config,
              health: healthResponse.success && healthResponse.data 
                ? healthResponse.data 
                : { status: 'inactive', errorCount: 0, requestsMade: 0, avgResponseTime: 0, dataQuality: 'unknown' },
            };
          })
        );
        setSources(sourcesWithHealth);
      }

      // Load jobs
      const jobsResponse = await api.jobs.getJobs();
      if (jobsResponse.success && jobsResponse.data) {
        setJobs(jobsResponse.data);
      }

      // Load history
      const historyResponse = await api.history.getHistory({ limit: '50' });
      if (historyResponse.success && historyResponse.data) {
        setHistory(historyResponse.data);
      }

      // Calculate metrics
      const activeSources = sources.filter(s => s.health.status === 'active').length;
      const queuedJobs = jobs.filter(j => j.status === 'queued' || j.status === 'running').length;
      
      setMetrics(prev => ({
        ...prev,
        activeSources,
        queuedJobs,
      }));

    } catch (error) {
      console.error('Failed to load ingestion data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSource = async (type: DataSourceType) => {
    const configs: Record<DataSourceType, Partial<DataSourceConfig>> = {
      pandascore: { ...DEFAULT_PANDASCORE_CONFIG, name: 'New Pandascore Source' },
      liquipedia: { ...DEFAULT_LIQUIPEDIA_CONFIG, name: 'New Liquipedia Source' },
      hltv: { ...DEFAULT_HLTV_CONFIG, name: 'New HLTV Source' },
      manual: { ...DEFAULT_MANUAL_CONFIG, name: 'New Manual Source' },
      file: { ...DEFAULT_MANUAL_CONFIG, name: 'New File Source' },
    };

    try {
      const response = await api.sources.createSource({
        ...configs[type],
        type,
        enabled: true,
      } as DataSourceConfig);

      if (response.success) {
        await loadData();
        setShowAddSource(false);
      }
    } catch (error) {
      console.error('Failed to create source:', error);
    }
  };

  const handleSyncSource = async (sourceId: string) => {
    try {
      await api.sources.syncSource(sourceId);
      await loadData();
    } catch (error) {
      console.error('Failed to sync source:', error);
    }
  };

  const handleDeleteSource = async (sourceId: string) => {
    if (!confirm('Are you sure you want to delete this source?')) return;
    
    try {
      await api.sources.deleteSource(sourceId);
      await loadData();
    } catch (error) {
      console.error('Failed to delete source:', error);
    }
  };

  const handleCreateJob = async (name: string, sourceId: string, dataTypes: IngestionDataType[]) => {
    const source = sources.find(s => s.config.id === sourceId);
    if (!source) return;

    try {
      const job = jobManager.createJob(name, source.config, dataTypes, {
        priority: 'normal',
      });

      await jobManager.startJob(job.id);
      setJobs(prev => [...prev, job]);
      setShowCreateJob(false);
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  const handlePauseJob = (jobId: string) => jobManager.pauseJob(jobId);
  const handleResumeJob = (jobId: string) => jobManager.resumeJob(jobId);
  const handleCancelJob = (jobId: string) => jobManager.cancelJob(jobId);

  // =============================================================================
  // Render Tabs
  // =============================================================================

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <MetricCard
          label="Total Records"
          value={metrics.totalRecordsIngested.toLocaleString()}
          icon={<Database className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          label="Records/min"
          value={metrics.recordsPerMinute.toFixed(1)}
          icon={<TrendingUp className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          label="Avg Process Time"
          value={`${metrics.avgProcessingTime.toFixed(0)}ms`}
          icon={<Clock className="w-5 h-5" />}
          color="purple"
        />
        <MetricCard
          label="Success Rate"
          value={`${metrics.successRate.toFixed(1)}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <MetricCard
          label="Active Sources"
          value={metrics.activeSources}
          icon={<Globe className="w-5 h-5" />}
          color="blue"
        />
        <MetricCard
          label="Queued Jobs"
          value={metrics.queuedJobs}
          icon={<Activity className="w-5 h-5" />}
          color="yellow"
        />
      </div>

      {/* Recent Activity */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-surface-800/50 border border-surface-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Active Jobs
            </h3>
            <button
              onClick={() => setShowCreateJob(true)}
              className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm hover:bg-blue-500/30 flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              New Job
            </button>
          </div>
          <div className="space-y-3">
            {jobs.filter(j => j.status === 'running' || j.status === 'queued' || j.status === 'paused').length === 0 ? (
              <p className="text-gray-500 text-center py-8">No active jobs</p>
            ) : (
              jobs.filter(j => j.status === 'running' || j.status === 'queued' || j.status === 'paused').map(job => (
                <div key={job.id} className="p-3 bg-surface-700/50 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white">{job.name}</span>
                    <StatusBadge status={job.status} size="sm" />
                  </div>
                  <ProgressBar progress={job.progress.percentComplete} />
                  <p className="text-xs text-gray-400 mt-1">
                    {job.progress.processedRecords.toLocaleString()} / {job.progress.totalRecords.toLocaleString()} records
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-surface-800/50 border border-surface-700 rounded-xl p-6">
          <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            Recent Errors
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {errors.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No errors</p>
            ) : (
              errors.slice(0, 5).map(error => (
                <div key={error.id} className={`p-3 rounded-lg border ${
                  error.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                  error.severity === 'error' ? 'bg-red-500/10 border-red-500/30' :
                  error.severity === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                  'bg-blue-500/10 border-blue-500/30'
                }`}>
                  <div className="flex items-center gap-2 mb-1">
                    <AlertCircle className={`w-4 h-4 ${
                      error.severity === 'critical' || error.severity === 'error' ? 'text-red-400' :
                      error.severity === 'warning' ? 'text-yellow-400' :
                      'text-blue-400'
                    }`} />
                    <span className="text-sm font-medium text-white">{error.sourceType}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(error.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{error.message}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="bg-surface-800/50 border border-surface-700 rounded-xl p-6">
        <h3 className="font-semibold text-white mb-4">Quick Stats</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <Trophy className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{history.filter(h => h.dataType === 'tournament').length}</p>
            <p className="text-sm text-gray-400">Tournaments</p>
          </div>
          <div className="text-center">
            <Users className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{history.filter(h => h.dataType === 'player').length}</p>
            <p className="text-sm text-gray-400">Players</p>
          </div>
          <div className="text-center">
            <Calendar className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{history.filter(h => h.dataType === 'match').length}</p>
            <p className="text-sm text-gray-400">Matches</p>
          </div>
          <div className="text-center">
            <BarChart3 className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{history.filter(h => h.dataType === 'statistics').length}</p>
            <p className="text-sm text-gray-400">Stats</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderSources = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Data Sources</h2>
        <button
          onClick={() => setShowAddSource(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Source
        </button>
      </div>

      {sources.length === 0 ? (
        <div className="bg-surface-800/50 border border-surface-700 rounded-xl p-12 text-center">
          <Database className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No data sources configured</h3>
          <p className="text-gray-400 mb-4">Add a data source to start ingesting esports data</p>
          <button
            onClick={() => setShowAddSource(true)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Add Your First Source
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sources.map(({ config, health }) => (
            <SourceCard
              key={config.id}
              config={config}
              health={health}
              onEdit={() => {/* TODO */}}
              onDelete={() => handleDeleteSource(config.id)}
              onSync={() => handleSyncSource(config.id)}
              onTest={() => {/* TODO */}}
            />
          ))}
        </div>
      )}

      {/* Add Source Modal */}
      {showAddSource && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-800 border border-surface-700 rounded-xl p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Add Data Source</h3>
              <button onClick={() => setShowAddSource(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleCreateSource('pandascore')}
                className="p-4 bg-surface-700 rounded-lg hover:bg-surface-600 text-left"
              >
                <Database className="w-6 h-6 text-blue-400 mb-2" />
                <p className="font-medium text-white">Pandascore</p>
                <p className="text-sm text-gray-400">Official API</p>
              </button>
              <button
                onClick={() => handleCreateSource('liquipedia')}
                className="p-4 bg-surface-700 rounded-lg hover:bg-surface-600 text-left"
              >
                <Globe className="w-6 h-6 text-green-400 mb-2" />
                <p className="font-medium text-white">Liquipedia</p>
                <p className="text-sm text-gray-400">Community Wiki</p>
              </button>
              <button
                onClick={() => handleCreateSource('hltv')}
                className="p-4 bg-surface-700 rounded-lg hover:bg-surface-600 text-left"
              >
                <FileText className="w-6 h-6 text-yellow-400 mb-2" />
                <p className="font-medium text-white">HLTV</p>
                <p className="text-sm text-gray-400">Web Scraper</p>
              </button>
              <button
                onClick={() => handleCreateSource('manual')}
                className="p-4 bg-surface-700 rounded-lg hover:bg-surface-600 text-left"
              >
                <Upload className="w-6 h-6 text-purple-400 mb-2" />
                <p className="font-medium text-white">Manual</p>
                <p className="text-sm text-gray-400">File Upload</p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderJobs = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Batch Jobs</h2>
        <button
          onClick={() => setShowCreateJob(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Job
        </button>
      </div>

      {jobs.length === 0 ? (
        <div className="bg-surface-800/50 border border-surface-700 rounded-xl p-12 text-center">
          <Activity className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No batch jobs</h3>
          <p className="text-gray-400">Create a batch job to ingest data from sources</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map(job => (
            <JobCard
              key={job.id}
              job={job}
              onPause={() => handlePauseJob(job.id)}
              onResume={() => handleResumeJob(job.id)}
              onCancel={() => handleCancelJob(job.id)}
              onView={() => {/* TODO */}}
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Ingestion History</h2>
      
      <div className="bg-surface-800/50 border border-surface-700 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-surface-700/50 text-gray-400">
            <tr>
              <th className="px-4 py-3 text-left">Time</th>
              <th className="px-4 py-3 text-left">Source</th>
              <th className="px-4 py-3 text-left">Type</th>
              <th className="px-4 py-3 text-left">Records</th>
              <th className="px-4 py-3 text-left">Status</th>
              <th className="px-4 py-3 text-left">Trigger</th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  No ingestion history
                </td>
              </tr>
            ) : (
              history.map(entry => (
                <tr key={entry.id} className="border-t border-surface-700 hover:bg-surface-700/30">
                  <td className="px-4 py-3 text-gray-400">
                    {new Date(entry.startedAt).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-white capitalize">{entry.sourceType}</td>
                  <td className="px-4 py-3 text-white capitalize">{entry.dataType}</td>
                  <td className="px-4 py-3 text-white">{entry.recordsCount.toLocaleString()}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={entry.status} size="sm" />
                  </td>
                  <td className="px-4 py-3 text-gray-400 capitalize">{entry.triggeredBy}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderErrors = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">Error Logs</h2>
        <button
          onClick={() => setErrors([])}
          className="px-3 py-1.5 text-sm text-gray-400 hover:text-white"
        >
          Clear All
        </button>
      </div>

      {errors.length === 0 ? (
        <div className="bg-surface-800/50 border border-surface-700 rounded-xl p-12 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No errors</h3>
          <p className="text-gray-400">Everything is running smoothly</p>
        </div>
      ) : (
        <div className="space-y-3">
          {errors.map(error => (
            <div 
              key={error.id}
              className={`p-4 rounded-xl border ${
                error.severity === 'critical' ? 'bg-red-500/10 border-red-500/30' :
                error.severity === 'error' ? 'bg-red-500/10 border-red-500/30' :
                error.severity === 'warning' ? 'bg-yellow-500/10 border-yellow-500/30' :
                'bg-blue-500/10 border-blue-500/30'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    error.severity === 'critical' || error.severity === 'error' ? 'bg-red-500/20 text-red-400' :
                    error.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-blue-500/20 text-blue-400'
                  }`}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium text-white">{error.sourceType}</p>
                    <p className="text-sm text-gray-400">
                      {new Date(error.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
                <StatusBadge status={error.severity} size="sm" />
              </div>
              <p className="mt-3 text-gray-300">{error.message}</p>
              {error.details && (
                <pre className="mt-2 p-2 bg-surface-900 rounded text-xs text-gray-400 overflow-x-auto">
                  {JSON.stringify(error.details, null, 2)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // =============================================================================
  // Main Render
  // =============================================================================

  return (
    <div className={`bg-surface-900 min-h-screen ${className}`}>
      {/* Header */}
      <div className="border-b border-surface-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center gap-3">
              <Database className="w-8 h-8 text-blue-400" />
              <div>
                <h1 className="text-2xl font-bold text-white">Data Ingestion</h1>
                <p className="text-sm text-gray-400">Manage external esports data sources</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={loadData}
                className="p-2 bg-surface-800 text-gray-400 rounded-lg hover:bg-surface-700"
                disabled={isLoading}
              >
                <RefreshCw className={`w-5 h-5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 -mb-px">
            {(['overview', 'sources', 'jobs', 'history', 'errors'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'text-blue-400 border-blue-400'
                    : 'text-gray-400 border-transparent hover:text-white hover:border-gray-600'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'sources' && renderSources()}
        {activeTab === 'jobs' && renderJobs()}
        {activeTab === 'history' && renderHistory()}
        {activeTab === 'errors' && renderErrors()}
      </div>
    </div>
  );
};

export default IngestionDashboard;
