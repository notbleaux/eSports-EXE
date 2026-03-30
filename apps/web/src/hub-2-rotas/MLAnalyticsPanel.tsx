/**
 * ML Analytics Panel - Main analytics dashboard for ROTAS Hub
 * Displays ML model metrics, predictions stats, and model comparison
 * 
 * [Ver001.000]
 */

import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Brain,
  Activity,
  Clock,
  Target,
  TrendingUp,
  Calendar,
  Download,
  Filter,
  BarChart3,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { usePredictionHistoryStore, DateRange } from '@/store/predictionHistoryStore';

// Time range options
type TimeRange = '24h' | '7d' | '30d' | 'custom';

/**
 * Time range selector component
 */
interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
  color: string;
}

function TimeRangeSelector({ value, onChange, color }: TimeRangeSelectorProps) {
  const ranges: { value: TimeRange; label: string }[] = [
    { value: '24h', label: '24h' },
    { value: '7d', label: '7d' },
    { value: '30d', label: '30d' },
    { value: 'custom', label: 'Custom' },
  ];

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
      {ranges.map((range) => (
        <button
          key={range.value}
          onClick={() => onChange(range.value)}
          className="px-3 py-1.5 text-xs font-medium rounded-md transition-all duration-200"
          style={{
            backgroundColor: value === range.value ? `${color}20` : 'transparent',
            color: value === range.value ? color : colors.text.muted,
          }}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}

/**
 * Metric card component for displaying stats
 */
interface MetricCardProps {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  color: string;
  glow: string;
}

function MetricCard({ label, value, subtext, icon: Icon, color, glow }: MetricCardProps) {
  return (
    <GlassCard hoverGlow={glow} className="p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs mb-1" style={{ color: colors.text.muted }}>
            {label}
          </p>
          <p className="text-2xl font-bold" style={{ color: colors.text.primary }}>
            {value}
          </p>
          {subtext && (
            <p className="text-xs mt-1" style={{ color: colors.text.secondary }}>
              {subtext}
            </p>
          )}
        </div>
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </GlassCard>
  );
}

/**
 * Model comparison table row
 */
interface ModelComparisonRowProps {
  modelId: string;
  predictions: number;
  avgLatency: number;
  accuracy: number | null;
  color: string;
  index: number;
}

function ModelComparisonRow({
  modelId,
  predictions,
  avgLatency,
  accuracy,
  color,
  index,
}: ModelComparisonRowProps) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors"
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-medium" style={{ color: colors.text.primary }}>
            {modelId}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm" style={{ color: colors.text.secondary }}>
        {predictions.toLocaleString()}
      </td>
      <td className="py-3 px-4 text-sm" style={{ color: colors.text.secondary }}>
        {avgLatency.toFixed(1)}ms
      </td>
      <td className="py-3 px-4">
        {accuracy !== null ? (
          <div className="flex items-center gap-2">
            <span
              className="text-sm font-medium"
              style={{
                color:
                  accuracy >= 0.9
                    ? colors.status.success
                    : accuracy >= 0.7
                    ? colors.status.warning
                    : colors.status.error,
              }}
            >
              {(accuracy * 100).toFixed(1)}%
            </span>
            <div className="w-16 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${accuracy * 100}%`,
                  backgroundColor:
                    accuracy >= 0.9
                      ? colors.status.success
                      : accuracy >= 0.7
                      ? colors.status.warning
                      : colors.status.error,
                }}
              />
            </div>
          </div>
        ) : (
          <span className="text-sm" style={{ color: colors.text.muted }}>
            N/A
          </span>
        )}
      </td>
    </motion.tr>
  );
}

/**
 * Main ML Analytics Panel component
 */
interface MLAnalyticsPanelProps {
  color?: string;
  glow?: string;
  muted?: string;
}

function MLAnalyticsPanel({
  color = colors.hub.rotas,
  glow = 'rgba(255, 68, 68, 0.4)',
  muted = '#cc3333',
}: MLAnalyticsPanelProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h');
  const [showFilters, setShowFilters] = useState(false);

  const { getPredictions, getStats, predictions } = usePredictionHistoryStore();

  // Calculate date range based on selection
  const dateRange = useMemo<DateRange | undefined>(() => {
    const end = new Date();
    const start = new Date();

    switch (timeRange) {
      case '24h':
        start.setHours(start.getHours() - 24);
        break;
      case '7d':
        start.setDate(start.getDate() - 7);
        break;
      case '30d':
        start.setDate(start.getDate() - 30);
        break;
      case 'custom':
        return undefined; // Would need custom date picker
      default:
        start.setHours(start.getHours() - 24);
    }

    return { start, end };
  }, [timeRange]);

  // Get filtered predictions
  const filteredPredictions = useMemo(() => {
    return getPredictions(dateRange);
  }, [getPredictions, dateRange, predictions]);

  // Get stats
  const stats = useMemo(() => {
    // Calculate stats from filtered predictions
    const totalPredictions = filteredPredictions.length;
    const accuracies = filteredPredictions
      .map((p) => p.accuracy)
      .filter((a): a is number => a !== undefined);
    const avgAccuracy =
      accuracies.length > 0
        ? accuracies.reduce((a, b) => a + b, 0) / accuracies.length
        : null;
    const avgLatency =
      filteredPredictions.length > 0
        ? filteredPredictions.reduce((sum, p) => sum + p.latencyMs, 0) /
          filteredPredictions.length
        : 0;

    // Get unique models from filtered predictions
    const modelSet = new Set(filteredPredictions.map((p) => p.modelId));
    const activeModels = modelSet.size;

    // Predictions by model
    const modelStats: Record<
      string,
      { predictions: number; totalLatency: number; accuracies: number[] }
    > = {};
    filteredPredictions.forEach((p) => {
      if (!modelStats[p.modelId]) {
        modelStats[p.modelId] = { predictions: 0, totalLatency: 0, accuracies: [] };
      }
      modelStats[p.modelId].predictions++;
      modelStats[p.modelId].totalLatency += p.latencyMs;
      if (p.accuracy !== undefined) {
        modelStats[p.modelId].accuracies.push(p.accuracy);
      }
    });

    return {
      totalPredictions,
      avgAccuracy,
      avgLatency,
      activeModels,
      modelStats,
    };
  }, [filteredPredictions]);

  // Export data
  const handleExport = (format: 'csv' | 'json') => {
    const { exportToCSV, exportToJSON } = usePredictionHistoryStore.getState();
    const data = format === 'csv' ? exportToCSV() : exportToJSON();
    const blob = new Blob([data], {
      type: format === 'csv' ? 'text/csv' : 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `predictions-${new Date().toISOString().split('T')[0]}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <GlassCard hoverGlow={glow} className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Brain className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h2 className="text-lg font-semibold" style={{ color: colors.text.primary }}>
              ML Analytics Dashboard
            </h2>
            <p className="text-xs" style={{ color: colors.text.muted }}>
              Model performance and prediction metrics
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <TimeRangeSelector value={timeRange} onChange={setTimeRange} color={color} />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 rounded-lg transition-colors hover:bg-white/5"
            style={{ color: colors.text.muted }}
          >
            <Filter className="w-4 h-4" />
          </button>
          <div className="relative group">
            <button
              className="p-2 rounded-lg transition-colors hover:bg-white/5"
              style={{ color: colors.text.muted }}
            >
              <Download className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-2 hidden group-hover:block z-10">
              <GlassCard className="p-2 min-w-[120px]">
                <button
                  onClick={() => handleExport('csv')}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-white/5 transition-colors"
                  style={{ color: colors.text.secondary }}
                >
                  Export CSV
                </button>
                <button
                  onClick={() => handleExport('json')}
                  className="w-full text-left px-3 py-2 text-sm rounded hover:bg-white/5 transition-colors"
                  style={{ color: colors.text.secondary }}
                >
                  Export JSON
                </button>
              </GlassCard>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <MetricCard
          label="Total Predictions"
          value={stats.totalPredictions.toLocaleString()}
          subtext={timeRange === '24h' ? 'Last 24 hours' : `Last ${timeRange}`}
          icon={Activity}
          color={color}
          glow={glow}
        />
        <MetricCard
          label="Avg Accuracy"
          value={stats.avgAccuracy !== null ? `${(stats.avgAccuracy * 100).toFixed(1)}%` : 'N/A'}
          subtext={stats.avgAccuracy !== null ? 'Based on feedback' : 'No accuracy data'}
          icon={Target}
          color={stats.avgAccuracy && stats.avgAccuracy >= 0.9 ? colors.status.success : color}
          glow={glow}
        />
        <MetricCard
          label="Avg Latency"
          value={`${stats.avgLatency.toFixed(1)}ms`}
          subtext={stats.avgLatency < 100 ? 'Fast' : stats.avgLatency < 500 ? 'Normal' : 'Slow'}
          icon={Clock}
          color={stats.avgLatency < 100 ? colors.status.success : stats.avgLatency < 500 ? color : colors.status.warning}
          glow={glow}
        />
        <MetricCard
          label="Active Models"
          value={stats.activeModels}
          subtext="Currently deployed"
          icon={BarChart3}
          color={color}
          glow={glow}
        />
      </div>

      {/* Model Comparison Table */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color }} />
          <h3 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
            Model Performance Comparison
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th
                  className="text-left py-2 px-4 text-xs font-medium"
                  style={{ color: colors.text.muted }}
                >
                  Model
                </th>
                <th
                  className="text-left py-2 px-4 text-xs font-medium"
                  style={{ color: colors.text.muted }}
                >
                  Predictions
                </th>
                <th
                  className="text-left py-2 px-4 text-xs font-medium"
                  style={{ color: colors.text.muted }}
                >
                  Avg Latency
                </th>
                <th
                  className="text-left py-2 px-4 text-xs font-medium"
                  style={{ color: colors.text.muted }}
                >
                  Accuracy
                </th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(stats.modelStats).length > 0 ? (
                Object.entries(stats.modelStats)
                  .sort((a, b) => b[1].predictions - a[1].predictions)
                  .map(([modelId, modelData], index) => (
                    <ModelComparisonRow
                      key={modelId}
                      modelId={modelId}
                      predictions={modelData.predictions}
                      avgLatency={modelData.totalLatency / modelData.predictions}
                      accuracy={
                        modelData.accuracies.length > 0
                          ? modelData.accuracies.reduce((a, b) => a + b, 0) /
                            modelData.accuracies.length
                          : null
                      }
                      color={color}
                      index={index}
                    />
                  ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="py-8 text-center text-sm"
                    style={{ color: colors.text.muted }}
                  >
                    No predictions in selected time range
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2" style={{ color: colors.text.muted }}>
          <Calendar className="w-3 h-3" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <div style={{ color: muted }}>ROTAS ML Analytics</div>
      </div>
    </GlassCard>
  );
}

export default MLAnalyticsPanel;
