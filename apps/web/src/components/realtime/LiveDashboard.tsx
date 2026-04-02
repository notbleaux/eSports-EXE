/**
 * Live Dashboard Component
 * 
 * Real-time analytics dashboard for live matches featuring:
 * - Win probability visualization
 * - Economy tracking
 * - Performance ratings
 * - Momentum indicators
 * - Real-time charts
 * - Updating statistics
 * - Trend indicators
 * - Alert system integration
 * 
 * [Ver001.000] - Live dashboard component
 * 
 * Agent: TL-S4-3-C
 * Team: Real-time Analytics (TL-S4)
 */

// @ts-nocheck
import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  DollarSign, 
  Target, 
  Zap,
  Users,
  AlertCircle,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Clock
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

import { useLiveMatch } from '../../hooks/useLiveMatch';
import { useRealtimeStore } from '../../lib/realtime/store';
import type { LiveMatchState } from '../../lib/realtime/types';
import {
  calculateLiveAnalytics,
  calculateWinProbability,
  calculateEconomyMetrics,
  calculateMomentum,
  formatProbability,
  getProbabilityColor,
  getMomentumColor,
  formatEconomy,
  AlertManager,
  getAlertManager,
  type LiveAnalytics,
  type Alert,
  type AlertSeverity,
} from '../../lib/realtime/analytics';
import { GlassCard } from '../ui/GlassCard';
import { GlowButton } from '../ui/GlowButton';

// =============================================================================
// Types
// =============================================================================

interface LiveDashboardProps {
  matchId?: string;
  autoConnect?: boolean;
  updateInterval?: number;
  showAlerts?: boolean;
  onAlert?: (alert: Alert) => void;
}

interface ChartDataPoint {
  timestamp: string;
  teamA: number;
  teamB: number;
  round: number;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  color?: string;
  children?: React.ReactNode;
}

// =============================================================================
// Constants
// =============================================================================

const COLORS = {
  teamA: '#3b82f6', // Blue
  teamB: '#ef4444', // Red
  neutral: '#9ca3af',
  success: '#22c55e',
  warning: '#f59e0b',
  danger: '#dc2626',
};

const SEVERITY_COLORS: Record<AlertSeverity, string> = {
  critical: '#dc2626',
  warning: '#f59e0b',
  info: '#3b82f6',
  success: '#22c55e',
};

// =============================================================================
// Metric Card Component
// =============================================================================

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendValue,
  color = '#3b82f6',
  children,
}) => {
  return (
    <GlassCard className="p-4 min-h-[120px]">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg" style={{ backgroundColor: `${color}20` }}>
            {React.cloneElement(icon as React.ReactElement, { 
              size: 20, 
              style: { color } 
            })}
          </div>
          <span className="text-sm text-gray-400 font-medium">{title}</span>
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs ${
            trend === 'up' ? 'text-green-400' : 
            trend === 'down' ? 'text-red-400' : 'text-gray-400'
          }`}>
            {trend === 'up' ? <TrendingUp size={14} /> : 
             trend === 'down' ? <TrendingDown size={14} /> : null}
            {trendValue}
          </div>
        )}
      </div>
      
      <div className="mt-3">
        <div className="text-2xl font-bold text-white">{value}</div>
        {subtitle && (
          <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
        )}
      </div>
      
      {children && <div className="mt-4">{children}</div>}
    </GlassCard>
  );
};

// =============================================================================
// Win Probability Gauge
// =============================================================================

interface WinProbabilityGaugeProps {
  probability: number;
  teamName: string;
  color: string;
}

const WinProbabilityGauge: React.FC<WinProbabilityGaugeProps> = ({
  probability,
  teamName,
  color,
}) => {
  const percentage = Math.round(probability * 100);
  const circumference = 2 * Math.PI * 40;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-24 h-24">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
          {/* Background circle */}
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="#374151"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <motion.circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={color}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{percentage}%</span>
        </div>
      </div>
      <span className="text-sm text-gray-400 mt-2 text-center">{teamName}</span>
    </div>
  );
};

// =============================================================================
// Alert Toast Component
// =============================================================================

interface AlertToastProps {
  alert: Alert;
  onDismiss: () => void;
  onAcknowledge: () => void;
}

const AlertToast: React.FC<AlertToastProps> = ({ alert, onDismiss, onAcknowledge }) => {
  const color = SEVERITY_COLORS[alert.severity];
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className="mb-3 p-4 rounded-lg border-l-4 bg-gray-900/90 backdrop-blur-sm"
      style={{ borderLeftColor: color }}
    >
      <div className="flex items-start gap-3">
        <AlertCircle size={20} style={{ color }} />
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-white">{alert.title}</span>
            <span 
              className="text-xs px-2 py-0.5 rounded-full uppercase"
              style={{ backgroundColor: `${color}30`, color }}
            >
              {alert.severity}
            </span>
          </div>
          <p className="text-sm text-gray-400 mt-1">{alert.message}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onAcknowledge}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Ack
          </button>
          <button
            onClick={onDismiss}
            className="text-xs text-gray-500 hover:text-white transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </motion.div>
  );
};

// =============================================================================
// Main LiveDashboard Component
// =============================================================================

export const LiveDashboard: React.FC<LiveDashboardProps> = ({
  matchId: propMatchId,
  autoConnect = true,
  updateInterval = 2000,
  showAlerts = true,
  onAlert,
}) => {
  // Connection state
  const { match, isConnected, isLoading, error, latency } = useLiveMatch({
    matchId: propMatchId,
    autoConnect,
  });

  // Analytics state
  const [analytics, setAnalytics] = useState<LiveAnalytics | null>(null);
  const [history, setHistory] = useState<ChartDataPoint[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // Alert manager
  const alertManager = useMemo(() => getAlertManager(), []);

  // Calculate analytics when match updates
  useEffect(() => {
    if (!match) return;

    const newAnalytics = calculateLiveAnalytics(match);
    setAnalytics(newAnalytics);

    // Update history
    setHistory(prev => {
      const newPoint: ChartDataPoint = {
        timestamp: new Date().toISOString(),
        teamA: newAnalytics.winProbability.teamA,
        teamB: newAnalytics.winProbability.teamB,
        round: match.currentRound,
      };
      
      const updated = [...prev, newPoint];
      if (updated.length > 20) updated.shift();
      return updated;
    });

    // Process alerts
    if (showAlerts) {
      const newAlerts = alertManager.processAnalytics(match.matchId, newAnalytics);
      if (newAlerts.length > 0) {
        setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
        newAlerts.forEach(onAlert || (() => {}));
      }
    }
  }, [match, alertManager, showAlerts, onAlert]);

  // Setup alert handler
  useEffect(() => {
    if (!showAlerts) return;

    const unsubscribe = alertManager.onAlert((alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 10));
      onAlert?.(alert);
    });

    return () => unsubscribe();
  }, [alertManager, showAlerts, onAlert]);

  // Handle alert actions
  const handleDismissAlert = useCallback((alertId: string) => {
    alertManager.dismissAlert(alertId);
    setAlerts(prev => prev.filter(a => a.id !== alertId));
  }, [alertManager]);

  const handleAcknowledgeAlert = useCallback((alertId: string) => {
    alertManager.acknowledgeAlert(alertId);
    setAlerts(prev => prev.map(a => 
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  }, [alertManager]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4" />
          <p className="text-gray-400">Connecting to live match data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <p className="text-red-400 mb-2">Failed to connect</p>
          <p className="text-gray-500 text-sm">{error.message}</p>
        </div>
      </div>
    );
  }

  // No match state
  if (!match || !analytics) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">No live match selected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="text-blue-500" />
            Live Match Dashboard
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            {match.teamA.name} vs {match.teamB.name} • {match.map}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Connection status */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className={isConnected ? 'text-green-400' : 'text-red-400'}>
              {isConnected ? 'Live' : 'Disconnected'}
            </span>
            {latency > 0 && (
              <span className="text-gray-500">({latency}ms)</span>
            )}
          </div>
          
          {/* Score */}
          <div className="flex items-center gap-3 bg-gray-800/50 px-4 py-2 rounded-lg">
            <span className="text-blue-400 font-bold">{match.teamA.score}</span>
            <span className="text-gray-500">-</span>
            <span className="text-red-400 font-bold">{match.teamB.score}</span>
          </div>
        </div>
      </div>

      {/* Alert Container */}
      {showAlerts && alerts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 w-96 max-w-full">
          <AnimatePresence>
            {alerts.filter(a => !a.dismissed).slice(0, 3).map(alert => (
              <AlertToast
                key={alert.id}
                alert={alert}
                onDismiss={() => handleDismissAlert(alert.id)}
                onAcknowledge={() => handleAcknowledgeAlert(alert.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Win Probability */}
        <MetricCard
          title="Win Probability"
          value={`${Math.round(Math.max(analytics.winProbability.teamA, analytics.winProbability.teamB) * 100)}%`}
          subtitle={`Confidence: ${Math.round(analytics.winProbability.confidence * 100)}%`}
          icon={<Target />}
          color="#8b5cf6"
        >
          <div className="flex justify-around mt-2">
            <WinProbabilityGauge
              probability={analytics.winProbability.teamA}
              teamName={match.teamA.name}
              color={COLORS.teamA}
            />
            <WinProbabilityGauge
              probability={analytics.winProbability.teamB}
              teamName={match.teamB.name}
              color={COLORS.teamB}
            />
          </div>
        </MetricCard>

        {/* Economy */}
        <MetricCard
          title="Economy"
          value={formatEconomy(analytics.economy.teamA.totalCredits + analytics.economy.teamB.totalCredits)}
          subtitle={`Advantage: ${analytics.economy.advantage > 0 ? match.teamB.name : match.teamA.name}`}
          icon={<DollarSign />}
          trend={analytics.economy.trend === 'improving' ? 'up' : analytics.economy.trend === 'declining' ? 'down' : 'neutral'}
          trendValue={analytics.economy.trend}
          color="#22c55e"
        >
          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-xs">
              <span className="text-blue-400">{match.teamA.name}</span>
              <span className="text-white">{formatEconomy(analytics.economy.teamA.totalCredits)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-400">{match.teamB.name}</span>
              <span className="text-white">{formatEconomy(analytics.economy.teamB.totalCredits)}</span>
            </div>
          </div>
        </MetricCard>

        {/* Momentum */}
        <MetricCard
          title="Momentum"
          value={`${Math.round(analytics.momentum.strength * 100)}%`}
          subtitle={`${analytics.momentum.direction === 'neutral' ? 'Balanced' : `Favoring ${analytics.momentum.direction === 'teamA' ? match.teamA.name : match.teamB.name}`}`}
          icon={<Zap />}
          trend={analytics.momentum.strength > 0.6 ? 'up' : 'neutral'}
          color="#f59e0b"
        >
          <div className="flex items-center gap-2 mt-2">
            <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ 
                  backgroundColor: getMomentumColor(analytics.momentum.direction),
                  marginLeft: analytics.momentum.direction === 'teamB' ? 'auto' : 0,
                  marginRight: analytics.momentum.direction === 'teamA' ? 'auto' : 0,
                }}
                initial={{ width: 0 }}
                animate={{ width: `${analytics.momentum.strength * 50}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </MetricCard>

        {/* Performance */}
        <MetricCard
          title="Performance"
          value={`${Math.round((analytics.teamA.overallRating + analytics.teamB.overallRating) / 2)}`}
          subtitle="Average team rating"
          icon={<BarChart3 />}
          color="#ec4899"
        >
          <div className="space-y-2 mt-2">
            <div className="flex justify-between text-xs">
              <span className="text-blue-400">{match.teamA.name}</span>
              <span className="text-white">{Math.round(analytics.teamA.overallRating)}/100</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-red-400">{match.teamB.name}</span>
              <span className="text-white">{Math.round(analytics.teamB.overallRating)}/100</span>
            </div>
          </div>
        </MetricCard>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Win Probability History */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <LineChartIcon size={18} />
              Win Probability History
            </h3>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.teamA }} />
                <span className="text-gray-400">{match.teamA.name}</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.teamB }} />
                <span className="text-gray-400">{match.teamB.name}</span>
              </div>
            </div>
          </div>
          
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="colorTeamA" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.teamA} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.teamA} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTeamB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.teamB} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.teamB} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis 
                  dataKey="round" 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 1]} 
                  stroke="#6b7280"
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  tickFormatter={(v) => `${Math.round(v * 100)}%`}
                />
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => `${Math.round(value * 100)}%`}
                />
                <ReferenceLine y={0.5} stroke="#6b7280" strokeDasharray="3 3" />
                <Area
                  type="monotone"
                  dataKey="teamA"
                  stroke={COLORS.teamA}
                  fillOpacity={1}
                  fill="url(#colorTeamA)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="teamB"
                  stroke={COLORS.teamB}
                  fillOpacity={1}
                  fill="url(#colorTeamB)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Economy Comparison */}
        <GlassCard className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <PieChartIcon size={18} />
              Economy Distribution
            </h3>
          </div>
          
          <div className="h-64 flex items-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: match.teamA.name, value: analytics.economy.teamA.totalCredits },
                    { name: match.teamB.name, value: analytics.economy.teamB.totalCredits },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill={COLORS.teamA} />
                  <Cell fill={COLORS.teamB} />
                </Pie>
                <Tooltip
                  contentStyle={{ 
                    backgroundColor: '#1f2937', 
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  formatter={(value: number) => formatEconomy(value)}
                />
                <Legend 
                  verticalAlign="bottom" 
                  height={36}
                  formatter={(value) => <span className="text-gray-400">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold text-white">
                  {formatEconomy(analytics.economy.teamA.totalCredits + analytics.economy.teamB.totalCredits)}
                </div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Player Performance Grid */}
      <GlassCard className="p-6">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Users size={18} />
          Player Performance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team A Players */}
          <div>
            <h4 className="text-sm font-medium text-blue-400 mb-3">{match.teamA.name}</h4>
            <div className="space-y-2">
              {analytics.teamA.players.map((player) => (
                <div 
                  key={player.playerId}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-semibold text-sm">
                      {player.playerName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{player.playerName}</div>
                      <div className="text-xs text-gray-500">ACS: {player.acs} • ADR: {player.adr}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{player.rating}</div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${player.rating}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Team B Players */}
          <div>
            <h4 className="text-sm font-medium text-red-400 mb-3">{match.teamB.name}</h4>
            <div className="space-y-2">
              {analytics.teamB.players.map((player) => (
                <div 
                  key={player.playerId}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-semibold text-sm">
                      {player.playerName.charAt(0)}
                    </div>
                    <div>
                      <div className="text-sm text-white font-medium">{player.playerName}</div>
                      <div className="text-xs text-gray-500">ACS: {player.acs} • ADR: {player.adr}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-white">{player.rating}</div>
                      <div className="text-xs text-gray-500">Rating</div>
                    </div>
                    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${player.rating}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Predictions */}
      {analytics.predictions.length > 0 && (
        <GlassCard className="p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Target size={18} />
            Live Predictions
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.predictions.map((pred) => (
              <div 
                key={pred.id}
                className="p-4 bg-gray-800/50 rounded-lg border border-gray-700"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-300 capitalize">
                    {pred.type.replace('_', ' ')}
                  </span>
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ 
                      backgroundColor: `${getProbabilityColor(pred.confidence)}30`,
                      color: getProbabilityColor(pred.confidence)
                    }}
                  >
                    {Math.round(pred.confidence * 100)}% confidence
                  </span>
                </div>
                <p className="text-white font-medium mb-2">{pred.prediction}</p>
                <div className="flex items-center gap-4 text-xs text-gray-500">
                  <span>{Math.round(pred.probability * 100)}% probability</span>
                  <span>•</span>
                  <span>{pred.timeframe}</span>
                </div>
                {pred.reasoning.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-700">
                    <p className="text-xs text-gray-500">
                      Based on: {pred.reasoning.join(', ')}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </GlassCard>
      )}
    </div>
  );
};

export default LiveDashboard;
