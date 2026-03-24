/**
 * AnalyticsWidget - Data visualization component for ROTAS Hub
 * Displays charts, metrics, and statistical analysis
 * [Ver001.000]
 */
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';

// Mock chart data generator
const generateChartData = (layer) => {
  const baseData = {
    surface: [
      { label: 'Mon', value: 65, target: 70 },
      { label: 'Tue', value: 72, target: 70 },
      { label: 'Wed', value: 68, target: 70 },
      { label: 'Thu', value: 78, target: 70 },
      { label: 'Fri', value: 82, target: 70 },
      { label: 'Sat', value: 75, target: 70 },
      { label: 'Sun', value: 80, target: 70 },
    ],
    behavioral: [
      { label: 'Clutch', value: 34, benchmark: 28 },
      { label: 'Consistency', value: 87, benchmark: 75 },
      { label: 'Momentum', value: 72, benchmark: 65 },
      { label: 'Adaptability', value: 91, benchmark: 70 },
      { label: 'Pressure', value: 68, benchmark: 60 },
    ],
    predictive: [
      { label: 'Q1', value: 88, confidence: 92 },
      { label: 'Q2', value: 91, confidence: 89 },
      { label: 'Q3', value: 86, confidence: 94 },
      { label: 'Q4', value: 93, confidence: 91 },
    ],
  };
  return baseData[layer] || baseData.surface;
};

// Metric card component
function MetricCard({ label, value, change, trend, color, glow }) {
  const isPositive = trend === 'up';
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;
  const trendColor = isPositive ? colors.status.success : colors.status.error;
  
  return (
    <GlassCard hoverGlow={glow} className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs" style={{ color: colors.text.muted }}>
          {label}
        </span>
        <TrendIcon 
          className="w-4 h-4" 
          style={{ color: trendColor }}
        />
      </div>
      <div 
        className="text-2xl font-bold mb-1"
        style={{ color: colors.text.primary }}
      >
        {value}
      </div>
      <div className="flex items-center gap-1">
        <span 
          className="text-xs font-medium"
          style={{ color: trendColor }}
        >
          {change}
        </span>
        <span className="text-xs" style={{ color: colors.text.muted }}>
          vs last period
        </span>
      </div>
    </GlassCard>
  );
}

// Bar chart component
function BarChart({ data, color, maxValue = 100 }) {
  return (
    <div className="space-y-3">
      {data.map((item, index) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.05 }}
          className="space-y-1"
        >
          <div className="flex items-center justify-between text-sm">
            <span style={{ color: colors.text.secondary }}>{item.label}</span>
            <span style={{ color }}>{item.value}%</span>
          </div>
          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: color }}
              initial={{ width: 0 }}
              animate={{ width: `${(item.value / maxValue) * 100}%` }}
              transition={{ duration: 0.8, delay: index * 0.1, ease: "easeOut" }}
            />
          </div>
          {item.target !== undefined && (
            <div className="flex justify-end">
              <span className="text-xs" style={{ color: colors.text.muted }}>
                Target: {item.target}%
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

// Line chart visualization
function LineChart({ data, color }) {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((d.value - minValue) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <div className="relative h-48 mt-4">
      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map(y => (
          <line
            key={y}
            x1="0"
            y1={y}
            x2="100"
            y2={y}
            stroke="rgba(255,255,255,0.05)"
            strokeWidth="0.5"
          />
        ))}
        
        {/* Area fill */}
        <motion.polygon
          points={`0,100 ${points} 100,100`}
          fill={`${color}20`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
        
        {/* Line */}
        <motion.polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
        
        {/* Data points */}
        {data.map((d, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((d.value - minValue) / range) * 80 - 10;
          return (
            <motion.circle
              key={i}
              cx={x}
              cy={y}
              r="3"
              fill={color}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + i * 0.1 }}
            />
          );
        })}
      </svg>
      
      {/* X-axis labels */}
      <div className="flex justify-between mt-2">
        {data.map((d, i) => (
          <span 
            key={i} 
            className="text-xs"
            style={{ color: colors.text.muted }}
          >
            {d.label}
          </span>
        ))}
      </div>
    </div>
  );
}

function AnalyticsWidget({ 
  activeLayer, 
  color, 
  glow, 
  muted,
  data,
  isLoading 
}) {
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState('7d');
  
  useEffect(() => {
    setChartData(generateChartData(activeLayer));
  }, [activeLayer]);
  
  const layerConfig = {
    surface: {
      title: 'Performance Metrics',
      icon: Activity,
      metrics: [
        { label: 'Avg KDA', value: '1.24', change: '+8.2%', trend: 'up' },
        { label: 'Win Rate', value: '58.3%', change: '+3.1%', trend: 'up' },
        { label: 'ACS', value: '214', change: '-2.4%', trend: 'down' },
        { label: 'HS %', value: '34.2%', change: '+1.8%', trend: 'up' },
      ],
    },
    behavioral: {
      title: 'Behavioral Analysis',
      icon: BarChart3,
      metrics: [
        { label: 'Clutch Rate', value: '34%', change: '+5.2%', trend: 'up' },
        { label: 'Consistency', value: '87%', change: '+2.1%', trend: 'up' },
        { label: 'Momentum', value: '72%', change: '-1.3%', trend: 'down' },
        { label: 'Adaptability', value: '91%', change: '+4.7%', trend: 'up' },
      ],
    },
    predictive: {
      title: 'Predictive Models',
      icon: TrendingUp,
      metrics: [
        { label: 'Accuracy', value: '92.4%', change: '+1.2%', trend: 'up' },
        { label: 'Precision', value: '89.7%', change: '+0.8%', trend: 'up' },
        { label: 'Recall', value: '94.1%', change: '+2.3%', trend: 'up' },
        { label: 'F1 Score', value: '91.8%', change: '+1.5%', trend: 'up' },
      ],
    },
  };
  
  const config = layerConfig[activeLayer] || layerConfig.surface;
  const Icon = config.icon;
  
  if (isLoading) {
    return (
      <GlassCard className="p-6 h-96 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-t-transparent rounded-full"
          style={{ borderColor: color, borderTopColor: 'transparent' }}
        />
      </GlassCard>
    );
  }
  
  return (
    <GlassCard hoverGlow={glow} className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}15` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold" style={{ color: colors.text.primary }}>
              {config.title}
            </h3>
            <p className="text-xs" style={{ color: colors.text.muted }}>
              Real-time analytics
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Time range selector */}
          <div className="flex items-center gap-1 p-1 rounded-lg bg-white/5">
            {['24h', '7d', '30d'].map((range) => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className="px-3 py-1 text-xs rounded transition-colors"
                style={{
                  backgroundColor: timeRange === range ? `${color}20` : 'transparent',
                  color: timeRange === range ? color : colors.text.muted,
                }}
              >
                {range}
              </button>
            ))}
          </div>
          
          <button 
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: colors.text.muted }}
          >
            <Filter className="w-4 h-4" />
          </button>
          
          <button 
            className="p-2 rounded-lg hover:bg-white/5 transition-colors"
            style={{ color: colors.text.muted }}
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {config.metrics.map((metric, index) => (
          <MetricCard
            key={metric.label}
            {...metric}
            color={color}
            glow={glow}
          />
        ))}
      </div>
      
      {/* Chart Section */}
      <div className="mt-6 pt-6 border-t border-white/5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeLayer}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
          >
            {activeLayer === 'surface' && (
              <LineChart data={chartData} color={color} />
            )}
            {(activeLayer === 'behavioral' || activeLayer === 'predictive') && (
              <BarChart data={chartData} color={color} maxValue={100} />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      
      {/* Footer */}
      <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2" style={{ color: colors.text.muted }}>
          <Calendar className="w-3 h-3" />
          <span>Last updated: {new Date().toLocaleTimeString()}</span>
        </div>
        <div style={{ color: muted }}>
          Data source: BASE Analytics
        </div>
      </div>
    </GlassCard>
  );
}

export default AnalyticsWidget;
