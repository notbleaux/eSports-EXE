/**
 * IngestionStatus Component
 * 
 * UI for monitoring live data ingestion status.
 * 
 * [Ver001.000] - Ingestion monitor component
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Play, 
  Pause, 
  Square, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle, 
  Activity,
  Database,
  Upload,
  Zap,
  FileJson,
  Settings,
  ChevronDown,
  ChevronUp,
  X,
  Plus,
  Trash2,
  Edit2,
  Wifi,
  WifiOff,
  Clock,
  TrendingUp,
  Filter,
  Download,
  BarChart3,
} from 'lucide-react';
import { logger } from '../../utils/logger';
import type { 
  EngineState, 
  EngineHealth, 
  EngineMetrics,
  IngestionResult,
} from '../../lib/realtime/ingestion/engine';
import type { SourceConnector, SourceHealth, SourceType } from '../../lib/realtime/ingestion/connectors';

const componentLogger = logger.child('IngestionStatus');

// =============================================================================
// Types
// =============================================================================

interface IngestionStatusProps {
  className?: string;
  onConnect?: () => void;
  onDisconnect?: () => void;
  compact?: boolean;
}

interface SourceCardProps {
  connector: SourceConnector;
  onRemove?: (id: string) => void;
  onToggle?: (id: string) => void;
}

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
}

// =============================================================================
// Helper Components
// =============================================================================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusStyles: Record<string, string> = {
    running: 'bg-green-500/20 text-green-400 border-green-500/30',
    stopped: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    paused: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    error: 'bg-red-500/20 text-red-400 border-red-500/30',
    starting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    stopping: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    connected: 'bg-green-500/20 text-green-400 border-green-500/30',
    disconnected: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    connecting: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    excellent: 'bg-green-500/20 text-green-400 border-green-500/30',
    good: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    fair: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    poor: 'bg-red-500/20 text-red-400 border-red-500/30',
    unknown: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  };

  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusStyles[status] || statusStyles.unknown}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const MetricCard: React.FC<MetricCardProps> = ({ label, value, unit, trend, icon, color = 'blue' }) => {
  const colorStyles = {
    blue: 'bg-blue-500/10 border-blue-500/20',
    green: 'bg-green-500/10 border-green-500/20',
    yellow: 'bg-yellow-500/10 border-yellow-500/20',
    red: 'bg-red-500/10 border-red-500/20',
    purple: 'bg-purple-500/10 border-purple-500/20',
  };

  return (
    <div className={`p-4 rounded-lg border ${colorStyles[color]}`}>
      <div className="flex items-start justify-between">
        <div className="p-2 rounded-md bg-white/5">{icon}</div>
        {trend && (
          <span className={`text-xs ${trend === 'up' ? 'text-green-400' : trend === 'down' ? 'text-red-400' : 'text-gray-400'}`}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
          </span>
        )}
      </div>
      <div className="mt-3">
        <p className="text-2xl font-semibold text-white">{value}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {unit && <p className="text-xs text-gray-500">{unit}</p>}
      </div>
    </div>
  );
};

const SourceCard: React.FC<SourceCardProps> = ({ connector, onRemove, onToggle }) => {
  const [health, setHealth] = useState<SourceHealth>(connector.getHealth());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = connector.onStatusChange(() => {
      setHealth(connector.getHealth());
    });
    return unsubscribe;
  }, [connector]);

  const sourceIcons: Record<SourceType, React.ReactNode> = {
    pandascore: <Database className="w-5 h-5" />,
    manual: <Edit2 className="w-5 h-5" />,
    file: <Upload className="w-5 h-5" />,
    mock: <Zap className="w-5 h-5" />,
    websocket: <Wifi className="w-5 h-5" />,
    custom: <Settings className="w-5 h-5" />,
  };

  return (
    <div className="bg-surface-800/50 border border-surface-700 rounded-lg overflow-hidden">
      <div 
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-700/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-md ${health.status === 'connected' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
            {sourceIcons[connector.config.type]}
          </div>
          <div>
            <h4 className="font-medium text-white">{connector.config.name}</h4>
            <p className="text-xs text-gray-400 capitalize">{connector.config.type}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={health.status} />
          {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-surface-700">
          <div className="grid grid-cols-2 gap-4 py-4">
            <div>
              <p className="text-xs text-gray-500">Events Received</p>
              <p className="text-lg font-medium text-white">{health.eventsReceived.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Events/min</p>
              <p className="text-lg font-medium text-white">{health.eventsPerMinute}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Latency</p>
              <p className="text-lg font-medium text-white">{health.latency}ms</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Quality</p>
              <StatusBadge status={health.quality} />
            </div>
            {health.errorCount > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500">Errors</p>
                <p className="text-lg font-medium text-red-400">{health.errorCount}</p>
                {health.lastError && (
                  <p className="text-xs text-red-400/70 mt-1">{health.lastError}</p>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {health.status === 'disconnected' ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  connector.connect();
                }}
                className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-md text-sm hover:bg-blue-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Wifi className="w-4 h-4" />
                Connect
              </button>
            ) : (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  connector.disconnect();
                }}
                className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-md text-sm hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <WifiOff className="w-4 h-4" />
                Disconnect
              </button>
            )}
            {onRemove && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemove(connector.id);
                }}
                className="px-3 py-2 bg-red-500/10 text-red-400 rounded-md text-sm hover:bg-red-500/20 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================================================
// Main Component
// =============================================================================

export const IngestionStatus: React.FC<IngestionStatusProps> = ({ 
  className = '', 
  onConnect, 
  onDisconnect,
  compact = false,
}) => {
  // State
  const [engineState, setEngineState] = useState<EngineState>('stopped');
  const [engineHealth, setEngineHealth] = useState<EngineHealth | null>(null);
  const [engineMetrics, setEngineMetrics] = useState<EngineMetrics | null>(null);
  const [connectors, setConnectors] = useState<SourceConnector[]>([]);
  const [recentResults, setRecentResults] = useState<IngestionResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddSource, setShowAddSource] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'sources' | 'metrics' | 'logs'>('overview');

  // Load ingestion engine
  useEffect(() => {
    loadEngine();
  }, []);

  // Poll for updates
  useEffect(() => {
    if (engineState === 'stopped') return;

    const interval = setInterval(() => {
      updateStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, [engineState]);

  const loadEngine = async () => {
    try {
      setIsLoading(true);
      const { getDefaultEngine } = await import('../../lib/realtime/ingestion/engine');
      const engine = getDefaultEngine();
      
      setEngineState(engine.getState());
      setEngineHealth(engine.getHealth());
      setEngineMetrics(engine.getMetrics());
      setConnectors(engine.getConnectors());

      // Subscribe to results
      engine.onResult((result) => {
        setRecentResults(prev => [result, ...prev].slice(0, 50));
      });

      componentLogger.info('Ingestion status component loaded');
    } catch (err) {
      setError((err as Error).message);
      componentLogger.error('Failed to load engine:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const updateStatus = async () => {
    try {
      const { getDefaultEngine } = await import('../../lib/realtime/ingestion/engine');
      const engine = getDefaultEngine();
      
      setEngineState(engine.getState());
      setEngineHealth(engine.getHealth());
      setEngineMetrics(engine.getMetrics());
      setConnectors(engine.getConnectors());
    } catch (err) {
      componentLogger.error('Failed to update status:', err);
    }
  };

  const handleStart = async () => {
    try {
      const { getDefaultEngine } = await import('../../lib/realtime/ingestion/engine');
      const engine = getDefaultEngine();
      await engine.start();
      setEngineState('running');
      onConnect?.();
      componentLogger.info('Engine started');
    } catch (err) {
      setError((err as Error).message);
      componentLogger.error('Failed to start engine:', err);
    }
  };

  const handleStop = async () => {
    try {
      const { getDefaultEngine } = await import('../../lib/realtime/ingestion/engine');
      const engine = getDefaultEngine();
      await engine.stop();
      setEngineState('stopped');
      onDisconnect?.();
      componentLogger.info('Engine stopped');
    } catch (err) {
      setError((err as Error).message);
      componentLogger.error('Failed to stop engine:', err);
    }
  };

  const handlePause = () => {
    const { getDefaultEngine } = require('../../lib/realtime/ingestion/engine');
    const engine = getDefaultEngine();
    engine.pause();
    setEngineState('paused');
  };

  const handleResume = () => {
    const { getDefaultEngine } = require('../../lib/realtime/ingestion/engine');
    const engine = getDefaultEngine();
    engine.resume();
    setEngineState('running');
  };

  const handleRemoveSource = (id: string) => {
    const { getDefaultEngine } = require('../../lib/realtime/ingestion/engine');
    const engine = getDefaultEngine();
    engine.removeConnector(id);
    setConnectors(engine.getConnectors());
  };

  // Compact view
  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-3 bg-surface-800/50 border border-surface-700 rounded-lg ${className}`}>
        <div className={`w-2 h-2 rounded-full ${engineState === 'running' ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
        <div className="flex-1">
          <p className="text-sm font-medium text-white">Ingestion</p>
          <p className="text-xs text-gray-400 capitalize">{engineState}</p>
        </div>
        {engineMetrics && (
          <div className="text-right">
            <p className="text-sm font-medium text-white">{engineMetrics.eventsProcessed.toLocaleString()}</p>
            <p className="text-xs text-gray-400">events</p>
          </div>
        )}
        {engineState === 'stopped' ? (
          <button
            onClick={handleStart}
            className="p-2 bg-green-500/20 text-green-400 rounded-md hover:bg-green-500/30 transition-colors"
          >
            <Play className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={handleStop}
            className="p-2 bg-red-500/20 text-red-400 rounded-md hover:bg-red-500/30 transition-colors"
          >
            <Square className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div className={`bg-surface-900 border border-surface-700 rounded-xl overflow-hidden ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-surface-700 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Data Ingestion Monitor</h2>
          <StatusBadge status={engineState} />
        </div>
        <div className="flex items-center gap-2">
          {error && (
            <button
              onClick={() => setError(null)}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 text-red-400 rounded-md text-sm"
            >
              <AlertCircle className="w-4 h-4" />
              Error
              <X className="w-3 h-3" />
            </button>
          )}
          {engineState === 'stopped' && (
            <button
              onClick={handleStart}
              className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
            >
              <Play className="w-4 h-4" />
              Start
            </button>
          )}
          {engineState === 'running' && (
            <>
              <button
                onClick={handlePause}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-lg hover:bg-yellow-500/30 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </>
          )}
          {engineState === 'paused' && (
            <>
              <button
                onClick={handleResume}
                className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30 transition-colors"
              >
                <Play className="w-4 h-4" />
                Resume
              </button>
              <button
                onClick={handleStop}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </>
          )}
          <button
            onClick={updateStatus}
            className="p-2 bg-surface-700 text-gray-400 rounded-lg hover:bg-surface-600 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-surface-700">
        <div className="flex gap-6">
          {(['overview', 'sources', 'metrics', 'logs'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium capitalize border-b-2 transition-colors ${
                activeTab === tab
                  ? 'text-blue-400 border-blue-400'
                  : 'text-gray-400 border-transparent hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Metrics Grid */}
            {engineMetrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <MetricCard
                  label="Events Ingested"
                  value={engineMetrics.eventsIngested.toLocaleString()}
                  icon={<Database className="w-5 h-5 text-blue-400" />}
                  color="blue"
                />
                <MetricCard
                  label="Events Processed"
                  value={engineMetrics.eventsProcessed.toLocaleString()}
                  icon={<CheckCircle className="w-5 h-5 text-green-400" />}
                  color="green"
                />
                <MetricCard
                  label="Failed"
                  value={engineMetrics.eventsFailed.toLocaleString()}
                  icon={<AlertCircle className="w-5 h-5 text-red-400" />}
                  color={engineMetrics.eventsFailed > 0 ? 'red' : 'blue'}
                />
                <MetricCard
                  label="Throughput"
                  value={engineMetrics.throughputPerSecond.toFixed(1)}
                  unit="events/sec"
                  icon={<TrendingUp className="w-5 h-5 text-purple-400" />}
                  color="purple"
                />
              </div>
            )}

            {/* Sources Overview */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-white">Active Sources</h3>
                <button
                  onClick={() => setShowAddSource(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-md text-sm hover:bg-blue-500/30 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  Add Source
                </button>
              </div>
              
              {connectors.length === 0 ? (
                <div className="p-8 text-center bg-surface-800/50 rounded-lg border border-surface-700 border-dashed">
                  <Database className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400">No sources configured</p>
                  <p className="text-sm text-gray-500 mt-1">Add a data source to start ingesting</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {connectors.map((connector) => (
                    <SourceCard
                      key={connector.id}
                      connector={connector}
                      onRemove={handleRemoveSource}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'sources' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Data Sources</h3>
              <button
                onClick={() => setShowAddSource(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-md text-sm hover:bg-blue-500/30 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Source
              </button>
            </div>
            
            <div className="grid gap-4">
              {connectors.map((connector) => (
                <SourceCard
                  key={connector.id}
                  connector={connector}
                  onRemove={handleRemoveSource}
                />
              ))}
            </div>

            {connectors.length === 0 && (
              <div className="p-8 text-center bg-surface-800/50 rounded-lg border border-surface-700 border-dashed">
                <p className="text-gray-400">No sources configured</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'metrics' && engineMetrics && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <MetricCard
                label="Total Events Ingested"
                value={engineMetrics.eventsIngested.toLocaleString()}
                icon={<Database className="w-5 h-5 text-blue-400" />}
                color="blue"
              />
              <MetricCard
                label="Successfully Processed"
                value={engineMetrics.eventsProcessed.toLocaleString()}
                icon={<CheckCircle className="w-5 h-5 text-green-400" />}
                color="green"
              />
              <MetricCard
                label="Failed Events"
                value={engineMetrics.eventsFailed.toLocaleString()}
                icon={<AlertCircle className="w-5 h-5 text-red-400" />}
                color={engineMetrics.eventsFailed > 0 ? 'red' : 'blue'}
              />
              <MetricCard
                label="Filtered Out"
                value={engineMetrics.eventsFiltered.toLocaleString()}
                icon={<Filter className="w-5 h-5 text-yellow-400" />}
                color="yellow"
              />
              <MetricCard
                label="Transformed"
                value={engineMetrics.eventsTransformed.toLocaleString()}
                icon={<RefreshCw className="w-5 h-5 text-purple-400" />}
                color="purple"
              />
              <MetricCard
                label="Avg Processing Time"
                value={engineMetrics.averageProcessingTime.toFixed(2)}
                unit="ms"
                icon={<Clock className="w-5 h-5 text-blue-400" />}
                color="blue"
              />
              <MetricCard
                label="Throughput"
                value={engineMetrics.throughputPerSecond.toFixed(1)}
                unit="events/sec"
                icon={<TrendingUp className="w-5 h-5 text-green-400" />}
                color="green"
              />
              <MetricCard
                label="Error Rate"
                value={engineMetrics.errorRate}
                unit="errors/min"
                icon={<AlertCircle className="w-5 h-5 text-red-400" />}
                color={engineMetrics.errorRate > 0 ? 'red' : 'blue'}
              />
            </div>

            {engineHealth?.lastError && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <AlertCircle className="w-5 h-5" />
                  <span className="font-medium">Last Error</span>
                </div>
                <p className="text-red-400/80 text-sm">{engineHealth.lastError}</p>
                {engineHealth.lastErrorTime && (
                  <p className="text-red-400/60 text-xs mt-1">
                    {new Date(engineHealth.lastErrorTime).toLocaleString()}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-white">Recent Events</h3>
              <button
                onClick={() => setRecentResults([])}
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Clear
              </button>
            </div>
            
            <div className="bg-surface-800/50 rounded-lg border border-surface-700 overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                {recentResults.length === 0 ? (
                  <div className="p-8 text-center">
                    <p className="text-gray-400">No events yet</p>
                    <p className="text-sm text-gray-500 mt-1">Events will appear here when processed</p>
                  </div>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-surface-700/50 text-gray-400 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-left">Time</th>
                        <th className="px-4 py-2 text-left">Event</th>
                        <th className="px-4 py-2 text-left">Source</th>
                        <th className="px-4 py-2 text-left">Status</th>
                        <th className="px-4 py-2 text-right">Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentResults.map((result, index) => (
                        <tr 
                          key={`${result.timestamp}-${index}`}
                          className="border-t border-surface-700 hover:bg-surface-700/30"
                        >
                          <td className="px-4 py-2 text-gray-400">
                            {new Date(result.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="px-4 py-2 text-white">
                            {result.event?.type || 'N/A'}
                          </td>
                          <td className="px-4 py-2 text-gray-400">
                            {result.sourceId}
                          </td>
                          <td className="px-4 py-2">
                            {result.success ? (
                              <span className="text-green-400 flex items-center gap-1">
                                <CheckCircle className="w-3 h-3" />
                                Success
                              </span>
                            ) : (
                              <span className="text-red-400 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                Failed
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-right text-gray-400">
                            {result.processingTimeMs}ms
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IngestionStatus;
