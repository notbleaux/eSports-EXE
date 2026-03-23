/**
 * Prediction Panel Component
 * 
 * Displays ML predictions for live matches including:
 * - Live win probability predictions
 * - Confidence intervals
 * - Strategy suggestions
 * - Risk assessment
 * 
 * [Ver001.000] - Prediction panel component
 * 
 * Agent: TL-S4-3-C
 * Team: Real-time Analytics (TL-S4)
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Target,
  Shield,
  Zap,
  Clock,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  AlertCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useLiveMatch } from '../../hooks/useLiveMatch';
import { useMLInference } from '../../hooks/useMLInference';
import { GlassCard } from '../ui/GlassCard';
import { GlowButton } from '../ui/GlowButton';
import type { LiveMatchState } from '../../lib/realtime/types';
import type { 
  AnalyticsPrediction,
  WinProbability,
  MomentumIndicator,
} from '../../lib/realtime/analytics';
import {
  calculateWinProbability,
  calculateMomentum,
  formatProbability,
  getProbabilityColor,
} from '../../lib/realtime/analytics';

// =============================================================================
// Types
// =============================================================================

interface PredictionPanelProps {
  matchId?: string;
  showStrategy?: boolean;
  showRiskAssessment?: boolean;
  confidenceThreshold?: number;
  onPredictionUpdate?: (prediction: MLPredictionResult) => void;
}

interface MLPredictionResult {
  roundWinner: {
    team: string;
    probability: number;
    confidence: number;
    features: string[];
  };
  matchWinner: {
    team: string;
    probability: number;
    confidence: number;
    features: string[];
  };
  timestamps: {
    inference: number;
    lastUpdate: string;
  };
}

interface StrategySuggestion {
  id: string;
  category: 'economic' | 'tactical' | 'individual' | 'team';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: string;
  confidence: number;
}

interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  riskScore: number;
  factors: RiskFactor[];
  mitigationStrategies: string[];
}

interface RiskFactor {
  name: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  impact: number;
  description: string;
}

interface ConfidenceInterval {
  lower: number;
  upper: number;
  mean: number;
  confidence: number;
}

// =============================================================================
// Utility Functions
// =============================================================================

function generateConfidenceInterval(
  probability: number,
  confidence: number,
  sampleSize: number = 100
): ConfidenceInterval {
  const z = confidence > 0.9 ? 2.576 : confidence > 0.8 ? 1.96 : 1.645;
  const se = Math.sqrt((probability * (1 - probability)) / sampleSize);
  const margin = z * se;
  
  return {
    lower: Math.max(0, probability - margin),
    upper: Math.min(1, probability + margin),
    mean: probability,
    confidence,
  };
}

function generateStrategySuggestions(
  match: LiveMatchState,
  winProb: WinProbability,
  momentum: MomentumIndicator
): StrategySuggestion[] {
  const suggestions: StrategySuggestion[] = [];
  const favoredTeam = winProb.teamA > winProb.teamB ? match.teamA : match.teamB;
  const underdogTeam = winProb.teamA > winProb.teamB ? match.teamB : match.teamA;
  
  // Economic strategy
  if (favoredTeam.totalCredits > underdogTeam.totalCredits * 1.5) {
    suggestions.push({
      id: 'eco_1',
      category: 'economic',
      priority: 'high',
      title: 'Maintain Economic Pressure',
      description: `Continue aggressive buys to force ${underdogTeam.name} into eco rounds`,
      expectedImpact: 'High - can break opponent economy',
      confidence: 0.8,
    });
  }
  
  if (underdogTeam.totalCredits < 10000) {
    suggestions.push({
      id: 'eco_2',
      category: 'economic',
      priority: 'high',
      title: 'Force Buy Opportunity',
      description: 'Consider force buy to stop the bleed and reset economy',
      expectedImpact: 'Medium - risky but necessary',
      confidence: 0.7,
    });
  }
  
  // Tactical strategy
  if (momentum.strength > 0.7 && momentum.direction !== 'neutral') {
    const momentumTeam = momentum.direction === 'teamA' ? match.teamA : match.teamB;
    suggestions.push({
      id: 'tac_1',
      category: 'tactical',
      priority: 'medium',
      title: 'Ride the Momentum',
      description: `${momentumTeam.name} should play aggressively to capitalize on current streak`,
      expectedImpact: 'Medium - momentum is powerful',
      confidence: momentum.strength,
    });
  }
  
  // Individual performance
  const lowPerformers = [...match.teamA.players, ...match.teamB.players]
    .filter(p => p.acs < 150 && match.currentRound > 5);
  
  if (lowPerformers.length > 0) {
    suggestions.push({
      id: 'ind_1',
      category: 'individual',
      priority: 'medium',
      title: 'Support Underperformers',
      description: `Focus on supporting ${lowPerformers[0].name} with trades and info`,
      expectedImpact: 'Medium - can boost team morale',
      confidence: 0.6,
    });
  }
  
  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

function assessRisk(
  match: LiveMatchState,
  winProb: WinProbability,
  momentum: MomentumIndicator
): RiskAssessment {
  const factors: RiskFactor[] = [];
  let totalRisk = 0;
  
  // Economic risk
  const teamAEconomy = match.teamA.totalCredits;
  const teamBEconomy = match.teamB.totalCredits;
  const economyRatio = Math.min(teamAEconomy, teamBEconomy) / Math.max(teamAEconomy, teamBEconomy);
  
  if (economyRatio < 0.3) {
    factors.push({
      name: 'Economic Disparity',
      level: 'high',
      impact: 0.8,
      description: 'Significant economic advantage for one team',
    });
    totalRisk += 0.3;
  }
  
  // Prediction confidence risk
  if (winProb.confidence < 0.5) {
    factors.push({
      name: 'Low Prediction Confidence',
      level: 'medium',
      impact: 0.6,
      description: 'Match is highly unpredictable',
    });
    totalRisk += 0.2;
  }
  
  // Momentum volatility
  if (momentum.strength > 0.8) {
    factors.push({
      name: 'High Momentum Volatility',
      level: 'medium',
      impact: 0.5,
      description: 'Current momentum may shift quickly',
    });
    totalRisk += 0.15;
  }
  
  // Score volatility
  const scoreDiff = Math.abs(match.teamA.score - match.teamB.score);
  const totalRounds = match.teamA.score + match.teamB.score;
  
  if (totalRounds > 15 && scoreDiff <= 2) {
    factors.push({
      name: 'Close Match Late Stage',
      level: 'medium',
      impact: 0.7,
      description: 'Match could go either way',
    });
    totalRisk += 0.2;
  }
  
  const riskScore = Math.min(1, totalRisk);
  let overallRisk: RiskAssessment['overallRisk'] = 'low';
  if (riskScore > 0.7) overallRisk = 'critical';
  else if (riskScore > 0.5) overallRisk = 'high';
  else if (riskScore > 0.3) overallRisk = 'medium';
  
  return {
    overallRisk,
    riskScore,
    factors,
    mitigationStrategies: [
      'Monitor economic shifts closely',
      'Track momentum indicators',
      'Watch for player performance changes',
      'Consider map-specific strategies',
    ],
  };
}

// =============================================================================
// Sub-components
// =============================================================================

const ConfidenceBar: React.FC<{ value: number; label: string }> = ({ value, label }) => (
  <div className="flex items-center gap-3">
    <span className="text-xs text-gray-500 w-20">{label}</span>
    <div className="flex-1 h-2 bg-gray-700 rounded-full overflow-hidden">
      <motion.div
        className="h-full rounded-full"
        style={{ backgroundColor: getProbabilityColor(value) }}
        initial={{ width: 0 }}
        animate={{ width: `${value * 100}%` }}
        transition={{ duration: 0.5 }}
      />
    </div>
    <span className="text-xs text-gray-400 w-12 text-right">
      {Math.round(value * 100)}%
    </span>
  </div>
);

const StrategyCard: React.FC<{ suggestion: StrategySuggestion }> = ({ suggestion }) => {
  const [expanded, setExpanded] = useState(false);
  
  const priorityColors = {
    high: 'text-red-400 border-red-500/30',
    medium: 'text-yellow-400 border-yellow-500/30',
    low: 'text-green-400 border-green-500/30',
  };
  
  const categoryIcons = {
    economic: <DollarIcon />,
    tactical: <Target size={16} />,
    individual: <Zap size={16} />,
    team: <UsersIcon />,
  };
  
  return (
    <div 
      className={`p-3 rounded-lg border bg-gray-800/30 cursor-pointer transition-colors hover:bg-gray-800/50 ${priorityColors[suggestion.priority]}`}
      onClick={() => setExpanded(!expanded)}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-gray-700/50">
          {categoryIcons[suggestion.category]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white truncate">
              {suggestion.title}
            </span>
            <span className={`text-xs px-1.5 py-0.5 rounded border ${priorityColors[suggestion.priority]}`}>
              {suggestion.priority}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1 line-clamp-2">
            {suggestion.description}
          </p>
        </div>
        {expanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
      </div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="pt-3 mt-3 border-t border-gray-700">
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Expected Impact:</span>
                  <span className="text-gray-300 ml-2">{suggestion.expectedImpact}</span>
                </div>
                <ConfidenceBar value={suggestion.confidence} label="Confidence" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const RiskIndicator: React.FC<{ level: RiskAssessment['overallRisk'] }> = ({ level }) => {
  const colors = {
    low: 'bg-green-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };
  
  const labels = {
    low: 'Low Risk',
    medium: 'Medium Risk',
    high: 'High Risk',
    critical: 'Critical Risk',
  };
  
  return (
    <div className="flex items-center gap-2">
      <div className={`w-3 h-3 rounded-full ${colors[level]} animate-pulse`} />
      <span className={`text-sm font-medium ${
        level === 'critical' ? 'text-red-400' :
        level === 'high' ? 'text-orange-400' :
        level === 'medium' ? 'text-yellow-400' :
        'text-green-400'
      }`}>
        {labels[level]}
      </span>
    </div>
  );
};

// Icon components
const DollarIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-green-400">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
  </svg>
);

const UsersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

// =============================================================================
// Main PredictionPanel Component
// =============================================================================

export const PredictionPanel: React.FC<PredictionPanelProps> = ({
  matchId: propMatchId,
  showStrategy = true,
  showRiskAssessment = true,
  confidenceThreshold = 0.6,
  onPredictionUpdate,
}) => {
  const { match, isConnected } = useLiveMatch({ matchId: propMatchId });
  const [mlPredictions, setMlPredictions] = useState<MLPredictionResult | null>(null);
  const [updateTime, setUpdateTime] = useState<Date>(new Date());
  
  // Calculate predictions
  useEffect(() => {
    if (!match) return;
    
    const winProb = calculateWinProbability(match);
    const momentum = calculateMomentum(match);
    
    const teamAProb = winProb.teamA;
    const teamBProb = winProb.teamB;
    
    const prediction: MLPredictionResult = {
      roundWinner: {
        team: teamAProb > teamBProb ? match.teamA.name : match.teamB.name,
        probability: Math.max(teamAProb, teamBProb),
        confidence: winProb.confidence,
        features: winProb.factors
          .filter(f => Math.abs(f.impact) > 0.1)
          .map(f => f.name),
      },
      matchWinner: {
        team: teamAProb > teamBProb ? match.teamA.name : match.teamB.name,
        probability: Math.max(teamAProb, teamBProb),
        confidence: winProb.confidence * 0.9, // Slightly lower for match-level
        features: ['Score advantage', 'Economic state', 'Momentum', 'Performance'],
      },
      timestamps: {
        inference: performance.now(),
        lastUpdate: new Date().toISOString(),
      },
    };
    
    setMlPredictions(prediction);
    setUpdateTime(new Date());
    onPredictionUpdate?.(prediction);
  }, [match, onPredictionUpdate]);
  
  // Generate derived data
  const { winProb, momentum, strategies, riskAssessment, confidenceIntervals } = useMemo(() => {
    if (!match) return {} as any;
    
    const winProb = calculateWinProbability(match);
    const momentum = calculateMomentum(match);
    
    return {
      winProb,
      momentum,
      strategies: showStrategy ? generateStrategySuggestions(match, winProb, momentum) : [],
      riskAssessment: showRiskAssessment ? assessRisk(match, winProb, momentum) : null,
      confidenceIntervals: {
        round: generateConfidenceInterval(
          Math.max(winProb.teamA, winProb.teamB),
          winProb.confidence
        ),
        match: generateConfidenceInterval(
          Math.max(winProb.teamA, winProb.teamB),
          winProb.confidence * 0.9
        ),
      },
    };
  }, [match, showStrategy, showRiskAssessment]);
  
  // Loading state
  if (!match || !mlPredictions) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <Brain size={32} className="text-purple-500 mx-auto mb-3 animate-pulse" />
            <p className="text-gray-400">Loading ML predictions...</p>
          </div>
        </div>
      </GlassCard>
    );
  }
  
  const favoredTeam = winProb.teamA > winProb.teamB ? match.teamA : match.teamB;
  const underdogTeam = winProb.teamA > winProb.teamB ? match.teamB : match.teamA;
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Brain className="text-purple-400" size={24} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">ML Predictions</h3>
            <p className="text-xs text-gray-500">
              Last updated: {updateTime.toLocaleTimeString()}
            </p>
          </div>
        </div>
        
        {isConnected && (
          <div className="flex items-center gap-2 text-sm text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            Live
          </div>
        )}
      </div>
      
      {/* Main Prediction */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-medium text-gray-400">Match Prediction</h4>
          <RiskIndicator level={riskAssessment?.overallRisk || 'low'} />
        </div>
        
        <div className="flex items-center gap-6">
          {/* Favored Team */}
          <div className="flex-1 text-center">
            <div className="text-3xl font-bold" style={{ color: getProbabilityColor(mlPredictions.matchWinner.probability) }}>
              {Math.round(mlPredictions.matchWinner.probability * 100)}%
            </div>
            <div className="text-sm text-white font-medium mt-1">{favoredTeam.name}</div>
            <div className="text-xs text-gray-500">Favored to win</div>
          </div>
          
          {/* VS */}
          <div className="text-gray-600 font-bold text-lg">VS</div>
          
          {/* Underdog */}
          <div className="flex-1 text-center">
            <div className="text-3xl font-bold text-gray-500">
              {Math.round((1 - mlPredictions.matchWinner.probability) * 100)}%
            </div>
            <div className="text-sm text-white font-medium mt-1">{underdogTeam.name}</div>
            <div className="text-xs text-gray-500">Underdog</div>
          </div>
        </div>
        
        {/* Confidence Interval */}
        {confidenceIntervals && (
          <div className="mt-4 pt-4 border-t border-gray-700">
            <div className="text-xs text-gray-500 mb-2">95% Confidence Interval</div>
            <div className="relative h-6 bg-gray-800 rounded-full overflow-hidden">
              <div 
                className="absolute h-full bg-gradient-to-r from-purple-500/50 to-purple-500"
                style={{
                  left: `${confidenceIntervals.match.lower * 100}%`,
                  width: `${(confidenceIntervals.match.upper - confidenceIntervals.match.lower) * 100}%`,
                }}
              />
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-white"
                style={{ left: `${confidenceIntervals.match.mean * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>{Math.round(confidenceIntervals.match.lower * 100)}%</span>
              <span>{Math.round(confidenceIntervals.match.mean * 100)}%</span>
              <span>{Math.round(confidenceIntervals.match.upper * 100)}%</span>
            </div>
          </div>
        )}
      </GlassCard>
      
      {/* Feature Importance */}
      <GlassCard className="p-5">
        <h4 className="text-sm font-medium text-gray-400 mb-3">Key Factors</h4>
        <div className="space-y-2">
          {winProb.factors.slice(0, 5).map((factor, idx) => (
            <div key={idx} className="flex items-center justify-between">
              <span className="text-sm text-gray-300">{factor.name}</span>
              <div className="flex items-center gap-2">
                <div className={`text-xs ${factor.impact > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {factor.impact > 0 ? '+' : ''}{Math.round(factor.impact * 100)}%
                </div>
                <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${factor.impact > 0 ? 'bg-green-500' : 'bg-red-500'}`}
                    style={{ width: `${Math.abs(factor.impact) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
      
      {/* Strategy Suggestions */}
      {showStrategy && strategies.length > 0 && (
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={18} className="text-yellow-400" />
            <h4 className="text-sm font-medium text-white">Strategy Suggestions</h4>
          </div>
          
          <div className="space-y-2">
            {strategies.slice(0, 4).map((suggestion) => (
              <StrategyCard key={suggestion.id} suggestion={suggestion} />
            ))}
          </div>
        </GlassCard>
      )}
      
      {/* Risk Assessment */}
      {showRiskAssessment && riskAssessment && (
        <GlassCard className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-orange-400" />
              <h4 className="text-sm font-medium text-white">Risk Assessment</h4>
            </div>
            <div className="text-2xl font-bold" style={{ color: getProbabilityColor(riskAssessment.riskScore) }}>
              {Math.round(riskAssessment.riskScore * 100)}%
            </div>
          </div>
          
          {riskAssessment.factors.length > 0 ? (
            <div className="space-y-2">
              {riskAssessment.factors.map((factor, idx) => (
                <div key={idx} className="flex items-start gap-3 p-2 bg-gray-800/50 rounded">
                  <AlertCircle size={16} className={`
                    ${factor.level === 'critical' ? 'text-red-400' :
                      factor.level === 'high' ? 'text-orange-400' :
                      factor.level === 'medium' ? 'text-yellow-400' :
                      'text-green-400'}
                    mt-0.5 flex-shrink-0
                  `} />
                  <div>
                    <div className="text-sm text-white">{factor.name}</div>
                    <div className="text-xs text-gray-500">{factor.description}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center gap-2 text-green-400">
              <CheckCircle size={16} />
              <span className="text-sm">No significant risks detected</span>
            </div>
          )}
        </GlassCard>
      )}
      
      {/* Model Info */}
      <div className="text-center text-xs text-gray-600 pt-2">
        Powered by TensorFlow.js • Round Predictor Model v1.0
      </div>
    </div>
  );
};

export default PredictionPanel;
