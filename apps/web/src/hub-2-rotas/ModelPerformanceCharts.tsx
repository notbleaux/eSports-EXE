/**
 * Model Performance Charts - Visualization component for ROTAS Hub
 * Recharts integration for ML model analytics
 * 
 * [Ver001.000]
 */

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Clock, Target, TrendingUp, Zap } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { usePredictionHistoryStore } from '@/store/predictionHistoryStore';

// Chart colors
const CHART_COLORS = {
  primary: '#00d4ff',
  secondary: '#0099ff',
  success: '#00ff88',
  warning: '#ffaa00',
  error: '#ff4655',
  muted: 'rgba(255, 255, 255, 0.5)',
  grid: 'rgba(255, 255, 255, 0.05)',
};

const PIE_COLORS = [
  CHART_COLORS.error,
  CHART_COLORS.warning,
  CHART_COLORS.secondary,
  CHART_COLORS.success,
];

/**
 * Custom tooltip component
 */
interface TooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; name: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: TooltipProps) {
  if (active && payload && payload.length) {
    return (
      <div
        className="p-3 rounded-lg border border-white/10"
        style={{ backgroundColor: 'rgba(10, 10, 15, 0.95)' }}
      >
        <p className="text-sm font-medium mb-1" style={{ color: colors.text.primary }}>
          {label}
        </p>
        {payload.map((entry, index) => (
          <p key={index} className="text-xs" style={{ color: colors.text.secondary }}>
            {entry.name}: {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
}

/**
 * Latency Line Chart Component
 */
function LatencyChart({ data }: { data: Array<{ time: string; latency: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="time"
          tick={{ fill: colors.text.muted, fontSize: 11 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={{ stroke: CHART_COLORS.grid }}
        />
        <YAxis
          tick={{ fill: colors.text.muted, fontSize: 11 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={{ stroke: CHART_COLORS.grid }}
          label={{ value: 'ms', angle: -90, position: 'insideLeft', fill: colors.text.muted, fontSize: 11 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line
          type="monotone"
          dataKey="latency"
          name="Latency"
          stroke={CHART_COLORS.primary}
          strokeWidth={2}
          dot={{ fill: CHART_COLORS.primary, strokeWidth: 0, r: 3 }}
          activeDot={{ r: 5, fill: CHART_COLORS.primary }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

/**
 * Accuracy Bar Chart Component
 */
function AccuracyChart({
  data,
}: {
  data: Array<{ model: string; accuracy: number; predictions: number }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <BarChart data={data}>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="model"
          tick={{ fill: colors.text.muted, fontSize: 11 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={{ stroke: CHART_COLORS.grid }}
        />
        <YAxis
          tick={{ fill: colors.text.muted, fontSize: 11 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={{ stroke: CHART_COLORS.grid }}
          domain={[0, 1]}
          tickFormatter={(value) => `${(value * 100).toFixed(0)}%`}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="accuracy" name="Accuracy" radius={[4, 4, 0, 0]}>
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={
                entry.accuracy >= 0.9
                  ? CHART_COLORS.success
                  : entry.accuracy >= 0.7
                  ? CHART_COLORS.warning
                  : CHART_COLORS.error
              }
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/**
 * Confidence Distribution Pie Chart Component
 */
function ConfidencePieChart({
  data,
}: {
  data: Array<{ name: string; value: number; color: string }>;
}) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
          paddingAngle={2}
          dataKey="value"
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          wrapperStyle={{ fontSize: 11, color: colors.text.secondary }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

/**
 * Predictions per Hour Area Chart Component
 */
function PredictionsPerHourChart({ data }: { data: Array<{ hour: string; count: number }> }) {
  return (
    <ResponsiveContainer width="100%" height={200}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id="colorPredictions" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={CHART_COLORS.primary} stopOpacity={0.3} />
            <stop offset="95%" stopColor={CHART_COLORS.primary} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke={CHART_COLORS.grid} strokeDasharray="3 3" />
        <XAxis
          dataKey="hour"
          tick={{ fill: colors.text.muted, fontSize: 11 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={{ stroke: CHART_COLORS.grid }}
        />
        <YAxis
          tick={{ fill: colors.text.muted, fontSize: 11 }}
          axisLine={{ stroke: CHART_COLORS.grid }}
          tickLine={{ stroke: CHART_COLORS.grid }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Area
          type="monotone"
          dataKey="count"
          name="Predictions"
          stroke={CHART_COLORS.primary}
          fillOpacity={1}
          fill="url(#colorPredictions)"
          strokeWidth={2}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/**
 * Main Model Performance Charts component
 */
interface ModelPerformanceChartsProps {
  color?: string;
  glow?: string;
  muted?: string;
}

function ModelPerformanceCharts({
  color = colors.hub.rotas,
  glow = 'rgba(255, 68, 68, 0.4)',
  muted = '#cc3333',
}: ModelPerformanceChartsProps) {
  const { predictions, getStats } = usePredictionHistoryStore();

  // Get last 100 predictions for latency chart
  const latencyData = useMemo(() => {
    return predictions
      .slice(0, 100)
      .reverse()
      .map((p, index) => ({
        time: `${index + 1}`,
        latency: p.latencyMs,
      }));
  }, [predictions]);

  // Calculate accuracy by model
  const accuracyData = useMemo(() => {
    const modelStats: Record<
      string,
      { totalAccuracy: number; count: number; predictions: number }
    > = {};

    predictions.forEach((p) => {
      if (p.accuracy !== undefined) {
        if (!modelStats[p.modelId]) {
          modelStats[p.modelId] = { totalAccuracy: 0, count: 0, predictions: 0 };
        }
        modelStats[p.modelId].totalAccuracy += p.accuracy;
        modelStats[p.modelId].count++;
      }
      if (!modelStats[p.modelId]) {
        modelStats[p.modelId] = { totalAccuracy: 0, count: 0, predictions: 0 };
      }
      modelStats[p.modelId].predictions++;
    });

    return Object.entries(modelStats)
      .filter(([, stats]) => stats.count > 0)
      .map(([model, stats]) => ({
        model,
        accuracy: stats.totalAccuracy / stats.count,
        predictions: stats.predictions,
      }))
      .sort((a, b) => b.predictions - a.predictions)
      .slice(0, 8);
  }, [predictions]);

  // Calculate confidence distribution
  const confidenceDistribution = useMemo(() => {
    const buckets = {
      '0-0.5': 0,
      '0.5-0.8': 0,
      '0.8-0.95': 0,
      '0.95-1.0': 0,
    };

    predictions.forEach((p) => {
      if (p.confidence < 0.5) buckets['0-0.5']++;
      else if (p.confidence < 0.8) buckets['0.5-0.8']++;
      else if (p.confidence < 0.95) buckets['0.8-0.95']++;
      else buckets['0.95-1.0']++;
    });

    return [
      { name: '0-50%', value: buckets['0-0.5'], color: PIE_COLORS[0] },
      { name: '50-80%', value: buckets['0.5-0.8'], color: PIE_COLORS[1] },
      { name: '80-95%', value: buckets['0.8-0.95'], color: PIE_COLORS[2] },
      { name: '95-100%', value: buckets['0.95-1.0'], color: PIE_COLORS[3] },
    ].filter((d) => d.value > 0);
  }, [predictions]);

  // Calculate predictions per hour (last 24 hours)
  const predictionsPerHour = useMemo(() => {
    const now = new Date();
    const hourlyData: Record<string, number> = {};

    // Initialize last 24 hours
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const key = hour.getHours().toString().padStart(2, '0') + ':00';
      hourlyData[key] = 0;
    }

    // Count predictions per hour
    predictions.forEach((p) => {
      const predHour = new Date(p.timestamp);
      const hoursAgo = (now.getTime() - predHour.getTime()) / (1000 * 60 * 60);
      if (hoursAgo <= 24) {
        const key = predHour.getHours().toString().padStart(2, '0') + ':00';
        if (hourlyData[key] !== undefined) {
          hourlyData[key]++;
        }
      }
    });

    return Object.entries(hourlyData).map(([hour, count]) => ({
      hour,
      count,
    }));
  }, [predictions]);

  const stats = useMemo(() => getStats(), [getStats, predictions]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Latency Over Time */}
      <GlassCard hoverGlow={glow} className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="w-4 h-4" style={{ color }} />
          <h3 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
            Prediction Latency (Last 100)
          </h3>
        </div>
        {latencyData.length > 0 ? (
          <LatencyChart data={latencyData} />
        ) : (
          <div className="h-[200px] flex items-center justify-center" style={{ color: colors.text.muted }}>
            <p className="text-sm">No latency data available</p>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span style={{ color: colors.text.muted }}>
            Avg: {stats.avgLatency.toFixed(1)}ms
          </span>
          <span style={{ color: muted }}>Real-time</span>
        </div>
      </GlassCard>

      {/* Accuracy by Model */}
      <GlassCard hoverGlow={glow} className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4" style={{ color }} />
          <h3 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
            Accuracy by Model
          </h3>
        </div>
        {accuracyData.length > 0 ? (
          <AccuracyChart data={accuracyData} />
        ) : (
          <div className="h-[200px] flex items-center justify-center" style={{ color: colors.text.muted }}>
            <p className="text-sm">No accuracy data available</p>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span style={{ color: colors.text.muted }}>
            {accuracyData.length} models with accuracy data
          </span>
          <span style={{ color: muted }}>Based on feedback</span>
        </div>
      </GlassCard>

      {/* Confidence Distribution */}
      <GlassCard hoverGlow={glow} className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4" style={{ color }} />
          <h3 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
            Confidence Distribution
          </h3>
        </div>
        {confidenceDistribution.length > 0 ? (
          <ConfidencePieChart data={confidenceDistribution} />
        ) : (
          <div className="h-[200px] flex items-center justify-center" style={{ color: colors.text.muted }}>
            <p className="text-sm">No confidence data available</p>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span style={{ color: colors.text.muted }}>
            Total: {stats.totalPredictions} predictions
          </span>
          <span style={{ color: muted }}>All time</span>
        </div>
      </GlassCard>

      {/* Predictions per Hour */}
      <GlassCard hoverGlow={glow} className="p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4" style={{ color }} />
          <h3 className="text-sm font-semibold" style={{ color: colors.text.primary }}>
            Predictions per Hour (Last 24h)
          </h3>
        </div>
        {predictionsPerHour.some((d) => d.count > 0) ? (
          <PredictionsPerHourChart data={predictionsPerHour} />
        ) : (
          <div className="h-[200px] flex items-center justify-center" style={{ color: colors.text.muted }}>
            <p className="text-sm">No recent prediction data</p>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between text-xs">
          <span style={{ color: colors.text.muted }}>
            Peak: {Math.max(...predictionsPerHour.map((d) => d.count))} predictions
          </span>
          <span style={{ color: muted }}>Hourly aggregation</span>
        </div>
      </GlassCard>
    </div>
  );
}

export default ModelPerformanceCharts;
