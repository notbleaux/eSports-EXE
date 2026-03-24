/**
 * PredictionCard - Displays individual prediction with confidence score
 * ROTAS Hub prediction visualization component
 * [Ver001.000]
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Clock,
  ChevronDown,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';

// Confidence level indicator
function ConfidenceIndicator({ score, color }) {
  let level = 'low';
  let icon = AlertCircle;
  
  if (score >= 85) {
    level = 'high';
    icon = CheckCircle2;
  } else if (score >= 60) {
    level = 'medium';
    icon = Target;
  }
  
  const Icon = icon;
  
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <span 
        className="text-xs font-medium w-8 text-right"
        style={{ color }}
      >
        {score}%
      </span>
    </div>
  );
}

// Trend indicator
function TrendIndicator({ trend, value }) {
  const trendConfig = {
    up: { Icon: TrendingUp, color: colors.status.success },
    down: { Icon: TrendingDown, color: colors.status.error },
    neutral: { Icon: Minus, color: colors.text.muted },
  };
  
  const { Icon, color } = trendConfig[trend] || trendConfig.neutral;
  
  return (
    <div className="flex items-center gap-1">
      <Icon className="w-3 h-3" style={{ color }} />
      <span className="text-xs font-medium" style={{ color }}>
        {value}
      </span>
    </div>
  );
}

function PredictionCard({ 
  prediction, 
  color, 
  glow,
  index = 0 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Default prediction data if not provided
  const defaultPredictions = [
    {
      id: 1,
      title: 'Match Outcome',
      description: 'Sentinels vs Cloud9',
      confidence: 87,
      prediction: 'Sentinels Win',
      trend: 'up',
      trendValue: '+12%',
      timeframe: 'Next 24h',
      factors: ['Recent Form', 'Map Pool', 'Head-to-Head'],
      details: 'Based on historical performance and current team dynamics',
    },
    {
      id: 2,
      title: 'Player Performance',
      description: 'TenZ ACS Projection',
      confidence: 92,
      prediction: '245+ ACS',
      trend: 'up',
      trendValue: '+8%',
      timeframe: 'Next Match',
      factors: ['Map Suitability', 'Agent Pool', 'Opponent Analysis'],
      details: 'Strong performance expected on Haven and Ascent',
    },
    {
      id: 3,
      title: 'Tournament Advancement',
      description: 'VCT Masters Tokyo',
      confidence: 76,
      prediction: 'Quarterfinals',
      trend: 'neutral',
      trendValue: '0%',
      timeframe: 'Tournament',
      factors: ['Group Stage', 'Seeding', 'Bracket Analysis'],
      details: 'Favorable bracket position with manageable opponents',
    },
  ];
  
  const data = prediction || defaultPredictions[index % defaultPredictions.length];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <GlassCard
        hoverGlow={glow}
        className="p-4 cursor-pointer transition-all duration-300"
        style={{
          borderColor: isExpanded ? `${color}40` : undefined,
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4" style={{ color }} />
              <span 
                className="text-sm font-medium"
                style={{ color: colors.text.primary }}
              >
                {data.title}
              </span>
            </div>
            <p className="text-xs" style={{ color: colors.text.secondary }}>
              {data.description}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <TrendIndicator trend={data.trend} value={data.trendValue} />
            <motion.div
              animate={{ rotate: isExpanded ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown 
                className="w-4 h-4" 
                style={{ color: colors.text.muted }}
              />
            </motion.div>
          </div>
        </div>
        
        {/* Prediction Value */}
        <div 
          className="text-lg font-bold mb-3"
          style={{ color }}
        >
          {data.prediction}
        </div>
        
        {/* Confidence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs" style={{ color: colors.text.muted }}>
              Confidence
            </span>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" style={{ color: colors.text.muted }} />
              <span className="text-xs" style={{ color: colors.text.muted }}>
                {data.timeframe}
              </span>
            </div>
          </div>
          <ConfidenceIndicator score={data.confidence} color={color} />
        </div>
        
        {/* Expanded Details */}
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4 pt-4 border-t border-white/10">
                <p 
                  className="text-xs mb-3"
                  style={{ color: colors.text.secondary }}
                >
                  {data.details}
                </p>
                
                <div className="space-y-2">
                  <span 
                    className="text-xs font-medium"
                    style={{ color: colors.text.muted }}
                  >
                    Key Factors:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {data.factors?.map((factor, i) => (
                      <motion.span
                        key={factor}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.05 }}
                        className="text-xs px-2 py-1 rounded"
                        style={{
                          backgroundColor: `${color}15`,
                          color: colors.text.secondary,
                        }}
                      >
                        {factor}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </motion.div>
  );
}

export default PredictionCard;
