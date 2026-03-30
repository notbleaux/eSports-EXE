/**
 * PredictionAccuracyDashboard Component
 * 
 * Comprehensive accuracy tracking visualization for ML predictions.
 * Features: trend charts, model comparison, confusion matrix.
 * 
 * [Ver001.000]
 */

import React, { useMemo } from 'react';
// import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Target,
  Brain,
  Activity,
  RefreshCw,
  Clock,
  CheckCircle2,
  // XCircle,
  AlertCircle,
  BarChart3,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { usePredictionAccuracy } from '@/hooks/usePredictionAccuracy';
import { colors, CHART_COLORS as ThemeChartColors } from '@/theme/colors';

// ============================================================================
// Chart Colors
// ============================================================================

const CHART_COLORS = {
  primary: ThemeChartColors.primary,
  secondary: ThemeChartColors.secondary,
  success: ThemeChartColors.success,
  warning: ThemeChartColors.warning,
  error: ThemeChartColors.error,
  muted: 'rgba(255, 255, 255, 0.5)',
  grid: ThemeChartColors.grid,
  sator: colors.hub.sator.base,
  rotas: colors.hub.rotas.base,
  arepo: colors.hub.arepo.base,
  opera: colors.hub.opera.base,
};

const MODEL_COLORS = [
  CHART_COLORS.sator,
  CHART_COLORS.rotas,
  CHART_COLORS.arepo,
  CHART_COLORS.opera,
  colors.hub.tenet.base,
  '#10b981',
];

// ============================================================================
// Types
// ============================================================================

interface PredictionAccuracyDashboardProps {
  className?: string;
  showMockData?: boolean;
}

// ============================================================================
// Custom Tooltip Component
// ============================================================================

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color?: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-lg border border-white/10 backdrop-blur-md"
        style={{ backgroundColor: 'rgba(10, 10, 15, 0.95)' }}
      >
        <p className="text-sm font-medium mb-2" style={{ color: colors.text?.primary || '#fff' }}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <p 
            key={index} 
            className="text-xs flex items-center gap-2"
            style={{ color: entry.color || colors.text?.secondary || '#aaa' }}
          >
            <span 
              className="w-2 h-2 rounded-full" 
              style={{ backgroundColor: entry.color || CHART_COLORS.primary }}
            />
            {entry.name}: {typeof entry.value === 'number' 
              ? entry.value < 1 && entry.value > 0 
                ? `${(entry.value * 100).toFixed(1)}%`
                : entry.value.toFixed(2)
              : entry.value
            }
          </p>
        ))}
      </div>
    );
  }
  return null;
}

// ============================================================================
// Accuracy Trend Chart
// ============================================================================

interface TrendChartProps {
  data: Array<{
    timestamp: Date;
    accuracy: number;
    rollingAccuracy: number;
  }>;
}

function AccuracyTrendChart({ data }: TrendChartProps) {
  const chartData = useMemo(() => {
    return data.map(point => ({
      time: point.timestamp.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      }),
      accuracy: point.accuracy * 100,
      rolling: point.rollingAccuracy * 100,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="accuracyGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 11 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={{ stroke: CHART_COLORS.grid }}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 11 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={{ stroke: CHART_COLORS.grid }}
          domain={[50, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend 
          wrapperStyle={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }}
        />
        <ReferenceLine 
          y={80} 
          stroke={CHART_COLORS.success} 
          strokeDasharray="3 3" 
          label={{ value: 'Target', fill: CHART_COLORS.success, fontSize: 10 }}
        />
        <Line
          type="monotone"
          dataKey="accuracy"
          name="Hourly Accuracy"
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: CHART_COLORS.primary }}
          fillOpacity={0.1}
        />
        <Line
          type="monotone"
          dataKey="rolling"
          name="5-Period Rolling"
          stroke={CHART_COLORS.success}
          strokeWidth={2}
          strokeDasharray="5 5"
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// Model Comparison Chart
// ============================================================================

interface ModelComparisonProps {
  data: Array<{
    modelId: string;
    accuracy: number;
    totalPredictions: number;
    avgConfidence: number;
  }>;
}

function ModelComparisonChart({ data }: ModelComparisonProps) {
  const chartData = useMemo(() => {
    return data.map(model => ({
      name: model.modelId.split('-').map(w => 
        w.charAt(0).toUpperCase() + w.slice(1)
      ).join(' '),
      accuracy: model.accuracy * 100,
      confidence: model.avgConfidence * 100,
      predictions: model.totalPredictions,
    }));
  }, [data]);

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="name"
          tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 10 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={{ stroke: CHART_COLORS.grid }}
          interval={0}
          angle={-15}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tick={{ fill: 'rgba(255, 255, 255, 0.5)', fontSize: 11 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={{ stroke: CHART_COLORS.grid }}
          domain={[0, 100]}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: 12, color: 'rgba(255, 255, 255, 0.7)' }} />
        <Bar dataKey="accuracy" name="Accuracy" radius={[4, 4, 0, 0]}>
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={entry.accuracy >= 80 
                ? CHART_COLORS.success 
                : entry.accuracy >= 70 
                  ? CHART_COLORS.warning 
                  : CHART_COLORS.error
              }
            />
          ))}
        </Bar>
        <Bar 
          dataKey="confidence" 
          name="Avg Confidence" 
          fill={CHART_COLORS.secondary}
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ============================================================================
// Confusion Matrix Visualization
// ============================================================================

interface ConfusionMatrixProps {
  matrix: {
    truePositives: number;
    trueNegatives: number;
    falsePositives: number;
    falseNegatives: number;
    precision: number;
    recall: number;
    f1Score: number;
  };
}

function ConfusionMatrix({ matrix }: ConfusionMatrixProps) {
  const total = matrix.truePositives + matrix.trueNegatives + 
                matrix.falsePositives + matrix.falseNegatives;
  
  const getOpacity = (value: number) => {
    return Math.max(0.3, Math.min(1, value / (total * 0.4)));
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Matrix Grid */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        {/* Header */}
        <div className="text-center text-white/50 p-2"></div>
        <div className="text-center text-white/70 p-2 font-medium">Predicted Positive</div>
        <div className="text-center text-white/70 p-2 font-medium">Predicted Negative</div>
        
        {/* True Positive row */}
        <div className="text-white/70 p-2 flex items-center font-medium">Actual Positive</div>
        <div 
          className="rounded-lg p-3 text-center transition-all"
          style={{ 
            backgroundColor: `rgba(0, 255, 136, ${getOpacity(matrix.truePositives)})`,
          }}
        >
          <div className="text-lg font-bold text-white">{matrix.truePositives}</div>
          <div className="text-white/80">True +</div>
        </div>
        <div 
          className="rounded-lg p-3 text-center transition-all"
          style={{ 
            backgroundColor: `rgba(255, 70, 85, ${getOpacity(matrix.falseNegatives)})`,
          }}
        >
          <div className="text-lg font-bold text-white">{matrix.falseNegatives}</div>
          <div className="text-white/80">False -</div>
        </div>
        
        {/* True Negative row */}
        <div className="text-white/70 p-2 flex items-center font-medium">Actual Negative</div>
        <div 
          className="rounded-lg p-3 text-center transition-all"
          style={{ 
            backgroundColor: `rgba(255, 70, 85, ${getOpacity(matrix.falsePositives)})`,
          }}
        >
          <div className="text-lg font-bold text-white">{matrix.falsePositives}</div>
          <div className="text-white/80">False +</div>
        </div>
        <div 
          className="rounded-lg p-3 text-center transition-all"
          style={{ 
            backgroundColor: `rgba(0, 255, 136, ${getOpacity(matrix.trueNegatives)})`,
          }}
        >
          <div className="text-lg font-bold text-white">{matrix.trueNegatives}</div>
          <div className="text-white/80">True -</div>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-white/10">
        <div className="text-center">
          <div className="text-xs text-white/50">Precision</div>
          <div className="text-lg font-bold" style={{ color: CHART_COLORS.primary }}>
            {(matrix.precision * 100).toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-white/50">Recall</div>
          <div className="text-lg font-bold" style={{ color: CHART_COLORS.success }}>
            {(matrix.recall * 100).toFixed(1)}%
          </div>
        </div>
        <div className="text-center">
          <div className="text-xs text-white/50">F1 Score</div>
          <div className="text-lg font-bold" style={{ color: CHART_COLORS.warning }}>
            {(matrix.f1Score * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Metric Card Component
// ============================================================================

interface MetricCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
  color?: string;
}

function MetricCard({ icon, label, value, trend, trendUp, color = CHART_COLORS.primary }: MetricCardProps) {
  return (
    <GlassCard className="p-4 flex items-center gap-4">
      <div 
        className="w-12 h-12 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: `${color}20` }}
      >
        <div style={{ color }}>{icon}</div>
      </div>
      <div className="flex-1">
        <div className="text-xs text-white/50 uppercase tracking-wider">{label}</div>
        <div className="text-2xl font-bold text-white">{value}</div>
        {trend && (
          <div className={`text-xs flex items-center gap-1 ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
            {trendUp ? <TrendingUp className="w-3 h-3" /> : <TrendingUp className="w-3 h-3 rotate-180" />}
            {trend}
          </div>
        )}
      </div>
    </GlassCard>
  );
}

// ============================================================================
// Main Dashboard Component
// ============================================================================

export function PredictionAccuracyDashboard({ className = '' }: PredictionAccuracyDashboardProps) {
  const { data, isLoading, error, lastUpdated, refresh, isStale } = usePredictionAccuracy({
    autoRefresh: true,
    refreshInterval: 30000,
  });

  const handleRefresh = () => {
    refresh();
  };

  if (isLoading && !data) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          <span className="text-white/50 text-sm">Loading accuracy metrics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <GlassCard className="p-6 text-center max-w-md">
          <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-400" />
          <h3 className="text-lg font-semibold text-white mb-2">Failed to Load</h3>
          <p className="text-white/60 text-sm mb-4">{error.message}</p>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </GlassCard>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`flex items-center justify-center h-96 ${className}`}>
        <GlassCard className="p-6 text-center max-w-md">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-white/30" />
          <h3 className="text-lg font-semibold text-white mb-2">No Data Available</h3>
          <p className="text-white/60 text-sm">Start making predictions to see accuracy metrics.</p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Target className="w-5 h-5" style={{ color: CHART_COLORS.sator }} />
            Prediction Accuracy
          </h2>
          <p className="text-sm text-white/50">
            Track model performance and accuracy trends
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <div className="flex items-center gap-2 text-xs text-white/40">
              <Clock className="w-3 h-3" />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
              {isStale && (
                <span className="text-yellow-400">(Stale)</span>
              )}
            </div>
          )}
          <button
            onClick={handleRefresh}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-all"
            title="Refresh data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          icon={<Target className="w-6 h-6" />}
          label="Overall Accuracy"
          value={`${(data.metrics.overallAccuracy * 100).toFixed(1)}%`}
          trend="+2.3% from last week"
          trendUp={true}
          color={CHART_COLORS.success}
        />
        <MetricCard
          icon={<CheckCircle2 className="w-6 h-6" />}
          label="Correct Predictions"
          value={data.metrics.correctPredictions.toLocaleString()}
          trend="Out of total"
          color={CHART_COLORS.primary}
        />
        <MetricCard
          icon={<Brain className="w-6 h-6" />}
          label="Active Models"
          value={data.modelComparison.length.toString()}
          trend="All operational"
          trendUp={true}
          color={CHART_COLORS.arepo}
        />
        <MetricCard
          icon={<Activity className="w-6 h-6" />}
          label="Total Predictions"
          value={data.metrics.totalPredictions.toLocaleString()}
          color={CHART_COLORS.opera}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend */}
        <GlassCard hoverGlow={CHART_COLORS.sator} className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4" style={{ color: CHART_COLORS.sator }} />
            <h3 className="text-sm font-semibold text-white">
              Accuracy Trend (24h)
            </h3>
          </div>
          <AccuracyTrendChart data={data.timeSeries} />
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-white/40">
              Rolling average shows 5-period trend
            </span>
            <span className="text-white/30">Target: 80%</span>
          </div>
        </GlassCard>

        {/* Model Comparison */}
        <GlassCard hoverGlow={CHART_COLORS.rotas} className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4" style={{ color: CHART_COLORS.rotas }} />
            <h3 className="text-sm font-semibold text-white">
              Model Comparison
            </h3>
          </div>
          {data.modelComparison.length > 1 ? (
            <ModelComparisonChart data={data.modelComparison} />
          ) : (
            <div className="h-[250px] flex items-center justify-center text-white/40">
              <p className="text-sm">Need 2+ models for comparison</p>
            </div>
          )}
          <div className="mt-3 flex items-center justify-between text-xs">
            <span className="text-white/40">
              {data.modelComparison.length} models compared
            </span>
            <span className="text-white/30">
              Best: {data.modelComparison[0]?.modelId || 'N/A'}
            </span>
          </div>
        </GlassCard>

        {/* Confusion Matrix */}
        <GlassCard hoverGlow={CHART_COLORS.arepo} className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4" style={{ color: CHART_COLORS.arepo }} />
            <h3 className="text-sm font-semibold text-white">
              Confusion Matrix
            </h3>
          </div>
          <ConfusionMatrix matrix={data.confusionMatrix} />
        </GlassCard>

        {/* Model Performance Table */}
        <GlassCard hoverGlow={CHART_COLORS.opera} className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Brain className="w-4 h-4" style={{ color: CHART_COLORS.opera }} />
            <h3 className="text-sm font-semibold text-white">
              Model Performance Details
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-2 text-white/50 font-medium">Model</th>
                  <th className="text-right py-2 text-white/50 font-medium">Accuracy</th>
                  <th className="text-right py-2 text-white/50 font-medium">Preds</th>
                  <th className="text-right py-2 text-white/50 font-medium">Latency</th>
                </tr>
              </thead>
              <tbody>
                {data.modelComparison.map((model, index) => (
                  <tr key={model.modelId} className="border-b border-white/5 last:border-0">
                    <td className="py-2 text-white">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-2 h-2 rounded-full" 
                          style={{ backgroundColor: MODEL_COLORS[index % MODEL_COLORS.length] }}
                        />
                        <span className="truncate max-w-[120px]">
                          {model.modelId}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 text-right">
                      <span 
                        className="font-medium"
                        style={{ 
                          color: model.accuracy >= 0.8 
                            ? CHART_COLORS.success 
                            : model.accuracy >= 0.7 
                              ? CHART_COLORS.warning 
                              : CHART_COLORS.error 
                        }}
                      >
                        {(model.accuracy * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 text-right text-white/60">
                      {model.totalPredictions}
                    </td>
                    <td className="py-2 text-right text-white/60">
                      {model.avgLatency.toFixed(0)}ms
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Footer Note */}
      <div className="text-xs text-white/30 text-center">
        Data updates automatically every 30 seconds. Click refresh for immediate update.
      </div>
    </div>
  );
}

export default PredictionAccuracyDashboard;
