/**
 * ROTAS Hub - Hub 2: The Harmonic Layer
 * Analytics and predictive modeling with cyan theme
 * [Ver001.000]
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  TrendingUp, 
  Brain, 
  Target, 
  BarChart3, 
  Zap,
  ChevronRight,
  Layers
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import HubWrapper, { HubStatCard } from '@/shared/components/HubWrapper';
import { useNJZStore, useHubState } from '@/shared/store/njzStore';
import AnalyticsWidget from './components/AnalyticsWidget';
import PredictionCard from './components/PredictionCard';
import useRotasData from './hooks/useRotasData';
import { PanelErrorBoundary } from '@/components/grid/PanelErrorBoundary';

// ROTAS Hub Configuration - EXACT colors as specified
const HUB_CONFIG = {
  name: 'ROTAS',
  subtitle: 'The Harmonic Layer',
  description: 'Analytics and predictive modeling',
  color: colors.hub.rotas.base,      // #00d4ff
  glow: colors.hub.rotas.glow,       // rgba(0, 212, 255, 0.4)
  muted: colors.hub.rotas.muted,     // #00a0c0
};

// Analytics layer definitions
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

function RotasHubContent() {
  const [activeLayer, setActiveLayer] = useState('surface');
  const [selectedMetric, setSelectedMetric] = useState(null);
  const { addNotification } = useNJZStore();
  const { state, setState } = useHubState('rotas');
  
  // Fetch ROTAS data
  const { analytics, predictions, isLoading, error } = useRotasData();

  const handleLayerChange = (layerId) => {
    setActiveLayer(layerId);
    setState({ activeLayer: layerId });
    
    const layer = ANALYTICS_LAYERS.find(l => l.id === layerId);
    addNotification(`${layer?.name} layer activated`, 'info');
  };

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
    <HubWrapper hubId="rotas">
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
            <div className="text-2xl font-bold" style={{ color: HUB_CONFIG.color }}>92.4%</div>
            <div className="text-xs" style={{ color: colors.text.muted }}>Prediction Accuracy</div>
          </GlassCard>
          <GlassCard 
            hoverGlow={HUB_CONFIG.glow}
            className="p-4 text-center"
          >
            <div className="text-2xl font-bold" style={{ color: HUB_CONFIG.color }}>1.34x</div>
            <div className="text-xs" style={{ color: colors.text.muted }}>Avg ROI</div>
          </GlassCard>
          <GlassCard 
            hoverGlow={HUB_CONFIG.glow}
            className="p-4 text-center"
          >
            <div className="text-2xl font-bold" style={{ color: HUB_CONFIG.color }}>2.4M</div>
            <div className="text-xs" style={{ color: colors.text.muted }}>Data Points</div>
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

      {/* Layer Selection */}
      <section className="max-w-6xl mx-auto mb-12">
        <div className="flex items-center gap-3 mb-6">
          <Layers className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
          <h2 className="text-xl font-semibold" style={{ color: colors.text.primary }}>
            Analytics Layers
          </h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {ANALYTICS_LAYERS.map((layer, index) => {
            const isActive = activeLayer === layer.id;
            const Icon = layer.icon;
            
            return (
              <motion.button
                key={layer.id}
                onClick={() => handleLayerChange(layer.id)}
                className="text-left w-full"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <GlassCard
                  hoverGlow={HUB_CONFIG.glow}
                  className={`
                    p-5 h-full transition-all duration-300
                    ${isActive ? 'border-opacity-100' : 'border-opacity-50'}
                  `}
                  style={{
                    borderColor: isActive ? HUB_CONFIG.color : undefined,
                    boxShadow: isActive ? `0 0 30px ${HUB_CONFIG.glow}` : undefined,
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ 
                        backgroundColor: isActive ? `${HUB_CONFIG.color}20` : 'rgba(255,255,255,0.05)',
                      }}
                    >
                      <Icon 
                        className="w-6 h-6" 
                        style={{ color: isActive ? HUB_CONFIG.color : colors.text.muted }}
                      />
                    </div>
                    {isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: HUB_CONFIG.color }}
                      />
                    )}
                  </div>
                  
                  <h3 
                    className="font-semibold text-lg mb-1"
                    style={{ color: isActive ? HUB_CONFIG.color : colors.text.primary }}
                  >
                    {layer.name}
                  </h3>
                  <p className="text-sm mb-4" style={{ color: colors.text.secondary }}>
                    {layer.description}
                  </p>
                  
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="pt-3 border-t border-white/10 flex flex-wrap gap-2">
                          {layer.metrics.map((metric) => (
                            <span
                              key={metric}
                              className="text-xs px-2 py-1 rounded"
                              style={{ 
                                backgroundColor: `${HUB_CONFIG.color}15`,
                                color: HUB_CONFIG.muted,
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
        {/* Analytics Widget */}
        <div className="lg:col-span-2">
          <AnalyticsWidget 
            activeLayer={activeLayer}
            color={HUB_CONFIG.color}
            glow={HUB_CONFIG.glow}
            muted={HUB_CONFIG.muted}
            data={analytics}
            isLoading={isLoading}
          />
        </div>

        {/* Predictions Sidebar */}
        <div className="space-y-6">
          {/* Prediction Cards */}
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

          {/* Correlation Score */}
          <GlassCard hoverGlow={HUB_CONFIG.glow} className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-5 h-5" style={{ color: HUB_CONFIG.color }} />
              <h3 className="font-semibold" style={{ color: colors.text.primary }}>
                Model Correlation
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

          {/* Quick Actions */}
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
              className="p-4 border-red-500/50"
              style={{ borderColor: 'rgba(255, 70, 85, 0.5)' }}
            >
              <div className="flex items-center gap-2 text-red-400">
                <span className="text-sm">Error loading data: {error}</span>
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </HubWrapper>
  );
}

function RotasHub() {
  return (
    <PanelErrorBoundary panelId="rotas-hub" panelTitle="ROTAS Analytics" hub="ROTAS">
      <RotasHubContent />
    </PanelErrorBoundary>
  );
}

export default RotasHub;
