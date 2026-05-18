// @ts-nocheck
/**
 * SimulatorPanel Component
 * Main simulator container with tabs for different prediction modes
 * 
 * [Ver001.000]
 */

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Trophy, 
  Users, 
  Swords, 
  History,
  Sparkles,
  Target,
  Zap
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import TeamH2HCompare from './TeamH2HCompare';
import PlayerH2HCompare from './PlayerH2HCompare';
import DuelPredictor from './DuelPredictor';
import PredictionHistory from './PredictionHistory';
import type { SimulatorPanelProps, TeamPredictionResult, PastPrediction } from './types';
import { useSimulator } from './hooks/useSimulator';
import { PURPLE, mockPredictions } from './mockData';

type TabMode = 'team' | 'player' | 'duel' | 'history';

const tabs: { id: TabMode; label: string; icon: typeof Trophy; description: string }[] = [
  { 
    id: 'team', 
    label: 'Team H2H', 
    icon: Trophy, 
    description: 'Predict match outcomes between teams' 
  },
  { 
    id: 'player', 
    label: 'Player H2H', 
    icon: Users, 
    description: 'Compare player statistics' 
  },
  { 
    id: 'duel', 
    label: 'Duel Predictor', 
    icon: Swords, 
    description: 'Predict duel outcomes' 
  },
  { 
    id: 'history', 
    label: 'History', 
    icon: History, 
    description: 'View past predictions' 
  },
];

const SimulatorPanel: React.FC<SimulatorPanelProps> = ({ defaultMode = 'team' }) => {
  const [activeTab, setActiveTab] = useState<TabMode>(defaultMode);
  const [predictions, setPredictions] = useState<PastPrediction[]>(mockPredictions);
  const { predictTeamH2H, predictDuel } = useSimulator();

  // Handle team prediction
  const handleTeamPredict = useCallback(async (teamAId: string, teamBId: string): Promise<TeamPredictionResult> => {
    const result = await predictTeamH2H(teamAId, teamBId);
    
    // Add to history
    const newPrediction: PastPrediction = {
      id: `pred-${Date.now()}`,
      date: new Date().toISOString(),
      type: 'team',
      teams: [result.teamA.name, result.teamB.name],
      predicted: result.teamA.winProbability > 0.5 ? result.teamA.name : result.teamB.name,
      predictedProbability: Math.max(result.teamA.winProbability, result.teamB.winProbability),
      confidence: result.confidence,
    };
    
    setPredictions(prev => [newPrediction, ...prev]);
    return result;
  }, [predictTeamH2H]);

  // Handle player comparison
  const handlePlayerCompare = useCallback((playerAId: string, playerBId: string) => {
    // In a real app, this might trigger additional analysis
    console.log('Comparing players:', playerAId, playerBId);
  }, []);

  // Handle viewing prediction details
  const handleViewDetails = useCallback((id: string) => {
    console.log('Viewing prediction details:', id);
  }, []);

  const activeTabData = tabs.find(t => t.id === activeTab) || tabs[0];
  const ActiveIcon = activeTabData.icon;

  return (
    <div className="space-y-4">
      {/* Header */}
      <GlassCard className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <div 
            className="w-12 h-12 rounded-xl flex items-center justify-center"
            style={{ 
              background: `linear-gradient(135deg, ${PURPLE.base}40, ${PURPLE.base}20)`,
              boxShadow: `0 0 20px ${PURPLE.glow}`
            }}
          >
            <Sparkles className="w-6 h-6" style={{ color: PURPLE.base }} />
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: PURPLE.base }}>
              OPERA Simulator
            </h2>
            <p className="text-sm opacity-60">
              AI-powered match and duel predictions
            </p>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive 
                    ? 'text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
                style={{
                  backgroundColor: isActive ? `${PURPLE.base}30` : undefined,
                  borderColor: isActive ? PURPLE.base : undefined,
                  border: isActive ? '1px solid' : '1px solid transparent',
                }}
                whileHover={!isActive ? { scale: 1.02 } : {}}
                whileTap={!isActive ? { scale: 0.98 } : {}}
              >
                <Icon 
                  className="w-4 h-4" 
                  style={{ color: isActive ? PURPLE.base : undefined }}
                />
                <span className="hidden sm:inline">{tab.label}</span>
              </motion.button>
            );
          })}
        </div>
      </GlassCard>

      {/* Tab Content Header */}
      <div className="flex items-center gap-2 px-1">
        <ActiveIcon className="w-5 h-5" style={{ color: PURPLE.base }} />
        <h3 className="text-lg font-medium">{activeTabData.label}</h3>
        <span className="text-sm opacity-50">— {activeTabData.description}</span>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'team' && (
            <TeamH2HCompare 
              onPredict={handleTeamPredict}
            />
          )}
          
          {activeTab === 'player' && (
            <PlayerH2HCompare 
              onCompare={handlePlayerCompare}
            />
          )}
          
          {activeTab === 'duel' && (
            <DuelPredictor 
              scenario="first_blood"
            />
          )}
          
          {activeTab === 'history' && (
            <PredictionHistory 
              predictions={predictions}
              onViewDetails={handleViewDetails}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Tips Footer */}
      <GlassCard className="p-3">
        <div className="flex items-start gap-2">
          <Zap className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: PURPLE.base }} />
          <div className="text-xs opacity-70">
            <span className="font-medium" style={{ color: PURPLE.base }}>Pro Tip:</span>
            {' '}
            {activeTab === 'team' && 'Team predictions consider rating, form, and map pool advantages.'}
            {activeTab === 'player' && 'Player comparisons use ACS, K/D, ADR, and clutch rate metrics.'}
            {activeTab === 'duel' && 'Duel predictions factor in weapons, HP, and player clutch ability.'}
            {activeTab === 'history' && 'Track your prediction accuracy and refine your strategies over time.'}
          </div>
        </div>
      </GlassCard>
    </div>
  );
};

export default SimulatorPanel;
