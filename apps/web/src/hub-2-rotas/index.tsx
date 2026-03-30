/**
 * ROTAS Hub - Hub 2: The Harmonic Layer
 * Analytics and predictive modeling with ellipse layer blending
 * [Ver003.000] - Converted to TypeScript with proper default export
 */
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimRatingLeaderboard, usePlayerStats } from '@/shared/api/hooks';
import { 
  Activity, 
  TrendingUp, 
  Brain, 
  Target, 
  BarChart3, 
  Zap,
  ChevronRight,
  Layers,
  Eye,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import AnalyticsWidget from './components/AnalyticsWidget';
import PredictionCard from './components/PredictionCard';
import useRotasData from './hooks/useRotasData';
import { PanelErrorBoundary } from '@/components/grid/PanelErrorBoundary';
import { 
  MLInferenceErrorBoundary, 
  StreamingErrorBoundary,
  HubErrorBoundary,
  HubErrorFallback 
} from '@/components/error';
import { useNJZStore, useHubState } from '@/shared/store/njzStore';

// ROTAS Hub Configuration
const HUB_CONFIG = {
  name: 'ROTAS',
  subtitle: 'The Harmonic Layer',
  description: 'Analytics and predictive modeling with harmonic layer blending',
  color: colors.hub.rotas.base,      // #ff4444
  glow: colors.hub.rotas.glow,       // rgba(255, 68, 68, 0.4)
  muted: colors.hub.rotas.muted,     // #cc3333
};

// Jungian archetype layers (from legacy)
const layers = [
  { 
    id: 'persona', 
    label: 'Persona', 
    icon: Eye, 
    description: 'Surface metrics — KDA, win rate, ACS', 
    color: '#00f0ff',
    metrics: ['KDA Ratio', 'Win Rate', 'ACS Score', 'Headshot %']
  },
  { 
    id: 'shadow', 
    label: 'Shadow', 
    icon: Zap, 
    description: 'Hidden metrics — clutch performance, tilt indicators', 
    color: '#ff9f1c',
    metrics: ['Clutch Rate', 'Tilt Score', 'Momentum', 'Consistency']
  },
  { 
    id: 'animus', 
    label: 'Animus', 
    icon: Brain, 
    description: 'Predictive models — outcome forecasting', 
    color: '#c9b037',
    metrics: ['Match Prediction', 'Player Potential', 'Risk Factor', 'ROI']
  }
];

// Analytics layer definitions (from newer version)
const ANALYTICS_LAYERS = [
  {
    id: 'surface',
    name: 'Surface Metrics',
    description: 'KDA, Win Rate, ACS',
    icon: Activity,
    metrics: ['KDA: 1.24', 'WR: 58%', 'ACS: 214'],
  },
  {
    id: 'behavioral',
    name: 'Behavioral Patterns',
    description: 'Clutch performance, Consistency',
    icon: Brain,
    metrics: ['Clutch: 34%', 'Cons: 87%', 'ADR: 142'],
  },
  {
    id: 'predictive',
    name: 'Predictive Models',
    description: 'Match outcomes, Player potential',
    icon: Target,
    metrics: ['Acc: 92%', 'ROI: 1.34', 'Risk: Low'],
  },
];

const mockData = [
  { metric: 'Match Accuracy', value: 87.3, trend: '+2.1%', status: 'good' as const },
  { metric: 'Investment Score', value: 92.1, trend: '+5.4%', status: 'good' as const },
  { metric: 'Risk Factor', value: 78.5, trend: '-1.2%', status: 'warning' as const },
  { metric: 'Talent Potential', value: 94.2, trend: '+3.8%', status: 'good' as const }
];

const GRADE_COLOR: Record<string, string> = {
  S: '#ffd700', A: '#22c55e', B: '#3b82f6',
  C: '#f59e0b', D: '#ef4444', F: '#6b7280',
};

interface HubProps {
  // Add any props needed
}

function RotasHubContent(): React.ReactElement {
  const [activeLayer, setActiveLayer] = useState('surface');
  const [activeLayers, setActiveLayers] = useState<string[]>(['persona']);
  const [selectedMetric, setSelectedMetric] = useState<string | null>(null);
  const [lbGame, setLbGame] = useState<string | undefined>(undefined); // 'valorant' | 'cs2' | undefined
  const [statsTab, setStatsTab] = useState('leaderboard'); // 'leaderboard' | 'raw-stats'
  const { addNotification } = useNJZStore();
  const { state, setState } = useHubState('rotas');

  // Fetch ROTAS data
  const { analytics, predictions, isLoading, error } = useRotasData();

  // SimRating leaderboard
  const { data: lbData, isLoading: lbLoading } = useSimRatingLeaderboard(lbGame);
  const topPlayers = lbData?.leaderboard?.slice(0, 10) ?? [];

  // Raw stats
  const { data: rawStatsData, isLoading: rawStatsLoading } = usePlayerStats(lbGame);

  // Layer toggle for Jungian system
  const toggleLayer = (layerId: string) => {
    const newLayers = activeLayers.includes(layerId) 
      ? activeLayers.filter(id => id !== layerId)
      : [...activeLayers, layerId];
    
    setActiveLayers(newLayers);
    setState({ activeLayers: newLayers });
    
    addNotification(
      `${layers.find(l => l.id === layerId)?.label} layer ${newLayers.includes(layerId) ? 'activated' : 'deactivated'}`,
      'info'
    );
  };

  const handleLayerChange = (layerId: string) => {
    setActiveLayer(layerId);
    setState({ activeLayer: layerId });
    
    const layer = ANALYTICS_LAYERS.find(l => l.id === layerId);
    addNotification(`${layer?.name} layer activated`, 'info');
  };

  const correlation = Math.round(
    70 + (activeLayers.length / layers.length) * 30
  );

  // Hero section animation variants
  const heroVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.25, 0.1, 0.25, 1],
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="min-h-screen p-4 md:p-6 lg:p-8"
      style={{ backgroundColor: '#0a0a0f' }}
      initial="hidden"
      animate="visible"
      variants={heroVariants}
    >
      {/* Hero Section */}
      <motion.section
        className="max-w-7xl mx-auto mb-12"
        variants={heroVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Brand Badge */}
        <motion.div 
          className="flex justify-center mb-6"
          variants={itemVariants}
        >
          <div 
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
            style={{
              backgroundColor: `${HUB_CONFIG.color}15`,
              borderColor: `${HUB_CONFIG.color}40`,
              boxShadow: `0 0 20px ${HUB_CONFIG.glow}`,
            }}
          >
            <Activity className="w-4 h-4" style={{ color: HUB_CONFIG.color }} />
            <span 
              className="text-sm font-mono font-medium"
              style={{ color: HUB_CONFIG.color }}
            >
              ROTAS ANALYTICS
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="text-4xl md:text-5xl lg:text-6xl font-bold text-center mb-4"
          variants={itemVariants}
          style={{ 
            color: HUB_CONFIG.color,
            textShadow: `0 0 40px ${HUB_CONFIG.glow}`,
          }}
        >
          The Harmonic Layer
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-lg md:text-xl text-center max-w-2xl mx-auto mb-8"
          variants={itemVariants}
          style={{ color: colors.text.secondary }}
        >
          {HUB_CONFIG.description}
        </motion.p>

        {/* Quick Stats Row */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          variants={itemVariants}
        >
          <GlassCard 
            hoverGlow={HUB_CONFIG.glow}
            className="p-4 text-center"
          >
            <div className="text-2xl font-bold" style={{ color: HUB_CONFIG.color }}>{correlation}%</div>
            <div className="text-xs" style={{ color: colors.text.muted }}>Correlation</div>
          </GlassCard>
          <GlassCard 
            hoverGlow={HUB_CONFIG.glow}
            className="p-4 text-center"
          >
            <div className="text-2xl font-bold" style={{ color: HUB_CONFIG.color }}>{activeLayers.length}</div>
            <div className="text-xs" style={{ color: colors.text.muted }}>Active Layers</div>
          </GlassCard>
          <GlassCard 
            hoverGlow={HUB_CONFIG.glow}
            className="p-4 text-center"
          >
            <div className="text-2xl font-bold" style={{ color: HUB_CONFIG.color }}>92.4%</div>
            <div className="text-xs" style={{ color: colors.text.muted }}>Accuracy</div>
          </GlassCard>
          <GlassCard 
            hoverGlow={HUB_CONFIG.glow}
            className="p-4 text-center"
          >
            <div className="text-2xl font-bold" style={{ color: HUB_CONFIG.color }}>60fps</div>
            <div className="text-xs" style={{ color: colors.text.muted }}>Real-time</div>
          </GlassCard>
        </motion.div>
      </motion.section>

      {/* Jungian Layer Control - Merged from legacy */}
      <section className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Layers className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
          <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
            Jungian Archetype Layers
          </h2>
          <span className="text-xs px-2 py-1 rounded-full" style={{ 
            backgroundColor: `${HUB_CONFIG.color}20`,
            color: HUB_CONFIG.muted 
          }}>
            Select to blend
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {layers.map((layer) => {
            const isActive = activeLayers.includes(layer.id);
            
            return (
              <motion.button
                key={layer.id}
                onClick={() => toggleLayer(layer.id)}
                className="text-left w-full"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GlassCard
                  hoverGlow={HUB_CONFIG.glow}
                  className={`p-5 h-full transition-all duration-300 ${
                    isActive ? 'border-opacity-100' : 'border-opacity-50'
                  }`}
                  style={{
                    borderColor: isActive ? layer.color : undefined,
                    boxShadow: isActive ? `0 0 20px ${layer.color}40` : undefined,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ 
                        backgroundColor: isActive ? `${layer.color}20` : 'rgba(255,255,255,0.05)',
                      }}
                    >
                      <layer.icon 
                        className="w-6 h-6" 
                        style={{ color: isActive ? layer.color : colors.text.muted }}
                      />
                    </div>
                    
                    <div 
                      className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        isActive ? 'border-cyan-400 bg-cyan-400' : 'border-slate-500'
                      }`}
                    >
                      {isActive && (
                        <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>

                  <h3 
                    className="font-semibold text-lg mb-1"
                    style={{ color: isActive ? layer.color : colors.text.primary }}
                  >
                    {layer.label}
                  </h3>
                  <p className="text-sm mb-3" style={{ color: colors.text.secondary }}>
                    {layer.description}
                  </p>

                  {/* Metrics preview */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div 
                          className="pt-3 border-t flex flex-wrap gap-2"
                          style={{ borderColor: 'rgba(255, 255, 255, 0.1)' }}
                        >
                          {layer.metrics.map((metric) => (
                            <span
                              key={metric}
                              className="text-xs px-2 py-1 rounded"
                              style={{ 
                                backgroundColor: `${layer.color}15`,
                                color: layer.color,
                              }}
                            >
                              {metric}
                            </span>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.button>
            );
          })}
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Ellipse Visualization - Merged from legacy */}
          <GlassCard hoverGlow={HUB_CONFIG.glow} className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
                <h3 className="font-semibold text-lg" style={{ color: colors.text.primary }}>
                  Harmonic Ellipse Visualization
                </h3>
              </div>
              <span className="text-xs" style={{ color: colors.text.muted }}>Interactive layers</span>
            </div>

            <div className="relative aspect-square max-w-[400px] mx-auto">
              {/* Background glow */}
              <div 
                className="absolute inset-0 rounded-full blur-3xl"
                style={{ backgroundColor: 'rgba(0, 240, 255, 0.05)' }}
              />

              {/* Ellipses */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                {layers.map((layer, index) => {
                  const isActive = activeLayers.includes(layer.id);
                  const rx = 180 - index * 40;
                  const ry = 100 - index * 20;
                  
                  return (
                    <motion.g key={layer.id}>
                      <motion.ellipse
                        cx="200"
                        cy="200"
                        rx={rx}
                        ry={ry}
                        fill="none"
                        stroke={isActive ? layer.color : 'rgba(255,255,255,0.1)'}
                        strokeWidth={isActive ? 3 : 1}
                        opacity={isActive ? 1 : 0.3}
                        animate={{ 
                          rotate: isActive ? [0, 360] : 0,
                        }}
                        transition={{ 
                          rotate: { duration: 20 + index * 5, repeat: Infinity, ease: 'linear' }
                        }}
                        style={{ transformOrigin: 'center' }}
                      />
                      
                      {isActive && (
                        <>
                          {[...Array(3)].map((_, i) => (
                            <motion.circle
                              key={i}
                              r="4"
                              fill={layer.color}
                              animate={{
                                cx: [
                                  200 + rx * Math.cos((i * 120 * Math.PI) / 180),
                                  200 + rx * Math.cos(((i * 120 + 360) * Math.PI) / 180)
                                ],
                                cy: [
                                  200 + ry * Math.sin((i * 120 * Math.PI) / 180),
                                  200 + ry * Math.sin(((i * 120 + 360) * Math.PI) / 180)
                                ]
                              }}
                              transition={{
                                duration: 4 + index,
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: 'linear'
                              }}
                            />
                          ))}
                        </>
                      )}
                    </motion.g>
                  );
                })}
                
                <defs>
                  <linearGradient id="ellipseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#00f0ff" />
                    <stop offset="100%" stopColor="#c9b037" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Center */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div 
                  className="w-20 h-20 rounded-full flex items-center justify-center"
                  style={{ 
                    background: 'linear-gradient(135deg, #00f0ff, #0066cc)',
                    boxShadow: '0 0 30px rgba(0, 240, 255, 0.4)'
                  }}
                >
                  <span className="font-bold text-white text-sm">BASE</span>
                </div>
              </motion.div>
            </div>
          </GlassCard>

          {/* Analytics Widget - Wrapped with MLInferenceErrorBoundary */}
          <MLInferenceErrorBoundary
            fallback={
              <HubErrorFallback
                hub="ROTAS"
                title="Analytics Error"
                message="Failed to load ML analytics panel."
                compact
              />
            }
          >
            <AnalyticsWidget 
              activeLayer={activeLayer}
              color={HUB_CONFIG.color}
              glow={HUB_CONFIG.glow}
              muted={HUB_CONFIG.muted}
              data={analytics}
              isLoading={isLoading}
            />
          </MLInferenceErrorBoundary>

          {/* Probability Metrics - Merged from legacy */}
          <GlassCard hoverGlow={HUB_CONFIG.glow} className="p-6">
            <div className="flex items-center gap-3 mb-6">
              <TrendingUp className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
              <h3 className="font-semibold text-lg" style={{ color: colors.text.primary }}>
                Probability Metrics
              </h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mockData.map((item, index) => (
                <motion.div
                  key={item.metric}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-xl cursor-pointer transition-all duration-300"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: `1px solid ${selectedMetric === item.metric ? HUB_CONFIG.color : 'rgba(255,255,255,0.1)'}`,
                    boxShadow: selectedMetric === item.metric ? `0 0 20px ${HUB_CONFIG.glow}` : 'none'
                  }}
                  onClick={() => setSelectedMetric(selectedMetric === item.metric ? null : item.metric)}
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="text-xs mb-2" style={{ color: colors.text.muted }}>{item.metric}</div>
                  
                  <div className="text-2xl font-bold mb-2" style={{ color: colors.text.primary }}>
                    {item.value}%
                  </div>
                  
                  <div 
                    className="text-xs flex items-center gap-1"
                    style={{ color: item.status === 'good' ? '#4ade80' : '#facc15' }}
                  >
                    {item.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
                    {item.trend}
                  </div>

                  <AnimatePresence>
                    {selectedMetric === item.metric && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4"
                        style={{ borderTop: `1px solid rgba(255, 255, 255, 0.1)` }}
                      >
                        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                          <motion.div
                            className="h-full"
                            style={{ background: `linear-gradient(90deg, ${HUB_CONFIG.color}, #c9b037)` }}
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </GlassCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Active Layers Info - Merged from legacy */}
          <GlassCard hoverGlow={HUB_CONFIG.glow} className="p-5">
            <h3 className="font-semibold mb-4" style={{ color: colors.text.primary }}>
              Active Layers
            </h3>
            
            <div className="space-y-3">
              {activeLayers.length === 0 ? (
                <p className="text-sm" style={{ color: colors.text.muted }}>No layers active. Select at least one layer.</p>
              ) : (
                layers.filter(l => activeLayers.includes(l.id)).map(layer => (
                  <div 
                    key={layer.id}
                    className="flex items-center gap-3 p-3 rounded-lg"
                    style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${layer.color}20` }}
                    >
                      <layer.icon className="w-4 h-4" style={{ color: layer.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium" style={{ color: colors.text.primary }}>{layer.label}</div>
                      <div className="text-xs" style={{ color: colors.text.muted }}>{layer.metrics.length} metrics</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </GlassCard>

          {/* Correlation Gauge - Merged from legacy */}
          <GlassCard hoverGlow={HUB_CONFIG.glow} className="p-5">
            <h3 className="font-semibold mb-4" style={{ color: colors.text.primary }}>
              Correlation Score
            </h3>
            
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="url(#gaugeGradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${correlation * 3.52} 352`}
                    initial={{ strokeDasharray: '0 352' }}
                    animate={{ strokeDasharray: `${correlation * 3.52} 352` }}
                    transition={{ duration: 1 }}
                  />
                  
                  <defs>
                    <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00f0ff" />
                      <stop offset="100%" stopColor="#c9b037" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-bold" style={{ color: HUB_CONFIG.color }}>{correlation}%</span>
                  <span className="text-xs" style={{ color: colors.text.muted }}>
                    {correlation > 90 ? 'Excellent' : correlation > 80 ? 'Good' : 'Fair'}
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Predictions Sidebar - Wrapped with StreamingErrorBoundary */}
          <StreamingErrorBoundary
            fallback={
              <HubErrorFallback
                hub="ROTAS"
                title="Streaming Error"
                message="Failed to load prediction stream."
                compact
              />
            }
          >
            <GlassCard hoverGlow={HUB_CONFIG.glow} className="p-5">
              <div className="flex items-center gap-3 mb-4">
                <Target className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
                <h3 className="font-semibold" style={{ color: colors.text.primary }}>
                  Active Predictions
                </h3>
              </div>
              
              <div className="space-y-4">
                {predictions?.map((prediction, index) => (
                  <PredictionCard
                    key={prediction.id}
                    prediction={prediction}
                    color={HUB_CONFIG.color}
                    glow={HUB_CONFIG.glow}
                    index={index}
                  />
                ))}
                
                {!predictions && !isLoading && (
                  <div className="text-center py-8" style={{ color: colors.text.muted }}>
                    <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No active predictions</p>
                  </div>
                )}
              </div>
            </GlassCard>
          </StreamingErrorBoundary>

          {/* Model Correlation - From newer version */}
          <GlassCard hoverGlow={HUB_CONFIG.glow} className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
              <h3 className="font-semibold" style={{ color: colors.text.primary }}>
                Model Performance
              </h3>
            </div>
            
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    style={{ stroke: HUB_CONFIG.color }}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray="352"
                    initial={{ strokeDashoffset: 352 }}
                    animate={{ strokeDashoffset: 352 - (352 * 0.924) }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                  />
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span 
                    className="text-3xl font-bold"
                    style={{ color: HUB_CONFIG.color }}
                  >
                    92.4%
                  </span>
                  <span className="text-xs" style={{ color: colors.text.muted }}>
                    Excellent
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>

          {/* Quick Actions - From newer version */}
          <GlassCard hoverGlow={HUB_CONFIG.glow} className="p-5">
            <h3 className="font-semibold mb-4" style={{ color: colors.text.primary }}>
              Quick Actions
            </h3>
            
            <div className="space-y-2">
              {[
                { label: 'Generate Report', icon: BarChart3 },
                { label: 'Run Simulation', icon: Zap },
                { label: 'Export Data', icon: TrendingUp },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <motion.button
                    key={action.label}
                    className="w-full flex items-center justify-between p-3 rounded-lg transition-colors"
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.03)',
                    }}
                    whileHover={{ 
                      backgroundColor: `${HUB_CONFIG.color}15`,
                    }}
                    onClick={() => addNotification(`${action.label} initiated`, 'info')}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" style={{ color: HUB_CONFIG.muted }} />
                      <span className="text-sm" style={{ color: colors.text.secondary }}>
                        {action.label}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4" style={{ color: colors.text.muted }} />
                  </motion.button>
                );
              })}
            </div>
          </GlassCard>

          {/* About BASE - Merged from legacy */}
          <GlassCard hoverGlow={HUB_CONFIG.glow} className="p-5">
            <h3 className="font-semibold mb-4" style={{ color: colors.text.primary }}>
              About BASE
            </h3>

            <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
              Base Analytics System for Esports (BASE) processes RAWS data through multi-layer harmonic analysis.
            </p>

            <div className="text-xs font-mono space-y-1" style={{ color: colors.text.muted }}>
              <div>Jungian Archetype Mapping</div>
              <div>Harmonic Wave Analysis</div>
              <div>Probability Cloud Modeling</div>
            </div>
          </GlassCard>

          {/* Stats Tabs */}
          <div className="simrating-leaderboard mt-4 p-4 bg-gray-800 rounded-lg overflow-x-auto">
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1">
                <button
                  onClick={() => setStatsTab('leaderboard')}
                  className={`text-xs px-3 py-1 rounded transition-colors ${statsTab === 'leaderboard' ? 'bg-purple-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                >
                  SimRating
                </button>
                <button
                  onClick={() => setStatsTab('raw-stats')}
                  className={`text-xs px-3 py-1 rounded transition-colors ${statsTab === 'raw-stats' ? 'bg-cyan-700 text-white' : 'bg-gray-700 text-gray-400 hover:bg-gray-600'}`}
                >
                  Raw Stats
                </button>
              </div>
              <div className="flex gap-1">
                {[undefined, 'valorant', 'cs2'].map((g) => (
                  <button
                    key={String(g)}
                    onClick={() => setLbGame(g)}
                    className={`text-xs px-2 py-1 rounded transition-colors ${
                      lbGame === g
                        ? 'bg-purple-700 text-white'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                  >
                    {g === undefined ? 'All' : g === 'valorant' ? 'VCT' : 'CS2'}
                  </button>
                ))}
              </div>
            </div>
            {statsTab === 'leaderboard' ? (
              lbLoading ? (
                <p className="text-gray-500 text-xs">Loading...</p>
              ) : topPlayers.length === 0 ? (
                <p className="text-gray-500 text-xs">No data yet — run sync_pandascore.py to seed.</p>
              ) : (
                <div className="space-y-1">
                  {topPlayers.map((p) => (
                    <div key={p.player_id} className="flex items-center justify-between text-xs text-gray-300 py-1 border-b border-gray-700 last:border-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-gray-500 w-5 shrink-0">#{p.rank}</span>
                        <Link
                          to={`/player/${p.player_slug}`}
                          className="hover:text-purple-300 transition-colors truncate"
                        >
                          {p.player_name}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-2">
                        <span
                          className="font-bold text-xs w-4 text-center"
                          style={{ color: GRADE_COLOR[p.grade] ?? '#6b7280' }}
                        >
                          {p.grade}
                        </span>
                        <span className="text-purple-300 font-mono">{p.simrating?.toFixed(1)}</span>
                        <span
                          className="text-xs px-1 rounded"
                          style={{
                            backgroundColor: p.source === 'v2_stats' ? 'rgba(34,197,94,0.15)' : 'rgba(107,114,128,0.15)',
                            color: p.source === 'v2_stats' ? '#22c55e' : '#6b7280',
                          }}
                        >
                          {p.source === 'v2_stats' ? 'v2' : 'est.'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : (
              rawStatsLoading ? (
                <p className="text-gray-500 text-xs">Loading...</p>
              ) : !rawStatsData?.stats?.length ? (
                <p className="text-gray-500 text-xs">No stats yet — run the data sync.</p>
              ) : (
                <table className="w-full text-xs text-gray-300">
                  <thead>
                    <tr className="text-gray-500 border-b border-gray-700">
                      <th className="text-left py-1">Rank</th>
                      <th className="text-left py-1">Player</th>
                      <th className="text-right py-1">K/D</th>
                      <th className="text-right py-1">Avg ACS</th>
                      <th className="text-right py-1">HS%</th>
                      <th className="text-right py-1">Games</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawStatsData.stats.map((p: { player_id: string; slug: string; handle: string; avg_kd: number; avg_acs: number; avg_hs_pct: number; games: number }, i: number) => (
                      <tr key={p.player_id} className="border-b border-gray-700 last:border-0">
                        <td className="py-1 text-gray-500">#{i + 1}</td>
                        <td className="py-1">
                          <Link to={`/player/${p.slug}`} className="hover:text-cyan-300 transition-colors">
                            {p.handle}
                          </Link>
                        </td>
                        <td className="py-1 text-right font-mono">{p.avg_kd.toFixed(2)}</td>
                        <td className="py-1 text-right font-mono">{p.avg_acs.toFixed(1)}</td>
                        <td className="py-1 text-right font-mono">{p.avg_hs_pct.toFixed(1)}%</td>
                        <td className="py-1 text-right text-gray-500">{p.games}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </div>
      </section>

      {/* Error Display */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed bottom-24 right-6 z-50"
          >
            <GlassCard 
              className="p-4"
              style={{ borderColor: 'rgba(255, 70, 85, 0.5)' }}
            >
              <div className="flex items-center gap-2" style={{ color: colors.status.error }}>
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">Error loading data: {error}</span>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/**
 * RotasHub - Root component with error boundaries
 */
function RotasHub(): React.ReactElement {
  return (
    <HubErrorBoundary hubName="rotas" componentName="RotasHub">
      <PanelErrorBoundary panelId="rotas-hub" panelTitle="ROTAS Analytics" hub="ROTAS">
        <MLInferenceErrorBoundary
          fallback={
            <div className="pt-12">
              <HubErrorFallback
                hub="ROTAS"
                title="ML Inference Error"
                message="The ROTAS analytics engine encountered an error."
                onRetry={() => window.location.reload()}
                onGoHome={() => window.location.href = '/'}
              />
            </div>
          }
        >
          <StreamingErrorBoundary
            fallback={
              <div className="pt-12">
                <HubErrorFallback
                  hub="ROTAS"
                  title="Streaming Error"
                  message="Failed to connect to real-time analytics."
                  onRetry={() => window.location.reload()}
                  onGoHome={() => window.location.href = '/'}
                />
              </div>
            }
          >
            <RotasHubContent />
          </StreamingErrorBoundary>
        </MLInferenceErrorBoundary>
      </PanelErrorBoundary>
    </HubErrorBoundary>
  );
}

export default RotasHub;
