/**
 * Analytics Panel - Data visualization and charts
 * 
 * [Ver001.000]
 */
import { useState } from 'react';
import { TrendingUp, Users, Target, Clock } from 'lucide-react';
import { colors } from '@/theme/colors';

const MOCK_STATS = [
  { label: 'Win Rate', value: '67.3%', change: '+2.1%', trend: 'up' },
  { label: 'Avg ACS', value: '234.5', change: '+5.2', trend: 'up' },
  { label: 'K/D Ratio', value: '1.42', change: '-0.1', trend: 'down' },
  { label: 'First Bloods', value: '12.5%', change: '+1.5%', trend: 'up' },
];

const SPARKLINE_DATA = [30, 45, 35, 50, 40, 60, 55, 70, 65, 80];

function Sparkline({ data, color }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((value - min) / range) * 100;
    return `${x},${y}`;
  }).join(' ');
  
  return (
    <svg viewBox="0 0 100 100" className="w-full h-12" preserveAspectRatio="none">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        points={points}
        vectorEffect="non-scaling-stroke"
      />
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        fill={`url(#gradient-${color})`}
        points={`0,100 ${points} 100,100`}
      />
    </svg>
  );
}

export function AnalyticsPanel() {
  const [timeRange, setTimeRange] = useState('7d');
  
  return (
    <div className="w-full h-full flex flex-col p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-4 h-4" style={{ color: colors.hub.sator.base }} />
          <span className="text-sm font-medium text-white/80">Performance Metrics</span>
        </div>
        
        {/* Time Range Selector */}
        <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
          {['24h', '7d', '30d', 'All'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                timeRange === range
                  ? 'bg-white/10 text-white'
                  : 'text-white/40 hover:text-white/60'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {MOCK_STATS.map((stat, index) => (
          <div
            key={stat.label}
            className="p-3 rounded-lg bg-white/5 border border-white/5"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-white/50">{stat.label}</span>
              <span
                className={`text-xs font-mono ${
                  stat.trend === 'up' ? 'text-green-400' : 'text-red-400'
                }`}
              >
                {stat.change}
              </span>
            </div>
            <div className="text-lg font-bold font-mono" style={{ color: colors.hub.sator.base }}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      
      {/* Sparkline Chart */}
      <div className="flex-1 min-h-0">
        <div className="text-xs text-white/50 mb-2">Win Rate Trend</div>
        <Sparkline data={SPARKLINE_DATA} color={colors.hub.sator.base} />
      </div>
      
      {/* Bottom Stats */}
      <div className="flex items-center justify-between pt-3 border-t border-white/5 mt-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/60">247 matches</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-white/40" />
            <span className="text-xs text-white/60">83% accuracy</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-white/40" />
          <span className="text-xs text-white/60">Updated 2m ago</span>
        </div>
      </div>
    </div>
  );
}
