// @ts-nocheck
/**
 * DuelPredictor Component
 * Duel outcome predictor with scenario selection and context inputs
 * 
 * [Ver001.000]
 */

import React, { useState, useMemo } from 'react';
import { createLogger } from '@/utils/logger';

const logger = createLogger('DuelPredictor');
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Swords, 
  Crosshair, 
  User, 
  Heart, 
  Zap, 
  Target,
  Shield,
  Flame,
  ChevronDown,
  Search
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { DuelPredictorProps, DuelScenario, DuelPredictionResult, DuelContext } from './types';
import { useSimulator } from './hooks/useSimulator';
import { PURPLE, weapons, abilities, mockPlayers } from './mockData';

const scenarios: { id: DuelScenario; label: string; icon: typeof Swords; description: string }[] = [
  { id: 'first_blood', label: 'First Blood', icon: Flame, description: 'Opening duel prediction' },
  { id: '1v1', label: '1v1 Duel', icon: Swords, description: 'Fair 1v1 engagement' },
  { id: '1v2', label: '1v2 Clutch', icon: Target, description: 'One versus two situation' },
  { id: '1v3', label: '1v3 Clutch', icon: Shield, description: 'One versus three situation' },
  { id: 'clutch', label: 'Clutch', icon: Zap, description: 'General clutch scenario' },
];

const DuelPredictor: React.FC<DuelPredictorProps> = ({ scenario: initialScenario, onPredict, players = mockPlayers }) => {
  const [selectedScenario, setSelectedScenario] = useState<DuelScenario>(initialScenario);
  const [playerAId, setPlayerAId] = useState<string>('');
  const [playerBId, setPlayerBId] = useState<string>('');
  const [showScenarioSelect, setShowScenarioSelect] = useState(false);
  const [showPlayerASelect, setShowPlayerASelect] = useState(false);
  const [showPlayerBSelect, setShowPlayerBSelect] = useState(false);
  const [searchA, setSearchA] = useState('');
  const [searchB, setSearchB] = useState('');
  
  // Context state
  const [context, setContext] = useState<Partial<DuelContext>>({
    playerAWeapon: 'Vandal',
    playerBWeapon: 'Vandal',
    playerAAbilities: [],
    playerBAbilities: [],
    playerAHP: 100,
    playerBHP: 100,
  });
  
  const [prediction, setPrediction] = useState<DuelPredictionResult | null>(null);
  const { isLoading, predictDuel } = useSimulator();

  const playerA = useMemo(() => players.find(p => p.id === playerAId), [players, playerAId]);
  const playerB = useMemo(() => players.find(p => p.id === playerBId), [players, playerBId]);

  const currentScenario = scenarios.find(s => s.id === selectedScenario) || scenarios[0];
  const ScenarioIcon = currentScenario.icon;

  // Filter players for dropdown
  const filteredPlayersA = useMemo(() => {
    return players.filter(p => 
      p.id !== playerBId && 
      (p.name.toLowerCase().includes(searchA.toLowerCase()) || 
       p.team?.toLowerCase().includes(searchA.toLowerCase()))
    );
  }, [players, playerBId, searchA]);

  const filteredPlayersB = useMemo(() => {
    return players.filter(p => 
      p.id !== playerAId && 
      (p.name.toLowerCase().includes(searchB.toLowerCase()) || 
       p.team?.toLowerCase().includes(searchB.toLowerCase()))
    );
  }, [players, playerAId, searchB]);

  const handlePredict = async () => {
    if (!playerAId || !playerBId) return;
    
    try {
      const result = await predictDuel(selectedScenario, playerAId, playerBId, context);
      setPrediction(result);
    } catch (error) {
      logger.error('Duel prediction failed', {
        error: error instanceof Error ? error.message : String(error),
        scenario: selectedScenario,
        playerAId,
        playerBId,
      });
    }
  };

  const toggleAbility = (player: 'A' | 'B', ability: string) => {
    const key = player === 'A' ? 'playerAAbilities' : 'playerBAbilities';
    const current = context[key] || [];
    const updated = current.includes(ability)
      ? current.filter(a => a !== ability)
      : [...current, ability];
    setContext(prev => ({ ...prev, [key]: updated }));
  };

  // Get probability color
  const getProbabilityColor = (prob: number) => {
    if (prob >= 0.6) return '#22c55e';
    if (prob >= 0.4) return '#eab308';
    return '#ef4444';
  };

  return (
    <div className="space-y-4">
      {/* Scenario Selector */}
      <GlassCard className="p-4">
        <div className="text-xs opacity-60 mb-2 flex items-center gap-1">
          <Target className="w-3 h-3" style={{ color: PURPLE.base }} />
          Scenario
        </div>
        <button
          onClick={() => setShowScenarioSelect(!showScenarioSelect)}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ScenarioIcon className="w-4 h-4" style={{ color: PURPLE.base }} />
            <span>{currentScenario.label}</span>
            <span className="text-xs opacity-50">- {currentScenario.description}</span>
          </span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showScenarioSelect ? 'rotate-180' : ''}`} />
        </button>
        
        <AnimatePresence>
          {showScenarioSelect && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-2 bg-[#1a1a2e] border border-white/10 rounded-lg overflow-hidden"
            >
              {scenarios.map(scenario => {
                const Icon = scenario.icon;
                return (
                  <button
                    key={scenario.id}
                    onClick={() => {
                      setSelectedScenario(scenario.id);
                      setShowScenarioSelect(false);
                      setPrediction(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-3 hover:bg-white/5 transition-colors text-left ${
                      selectedScenario === scenario.id ? 'bg-white/10' : ''
                    }`}
                  >
                    <Icon className="w-4 h-4" style={{ color: PURPLE.base }} />
                    <div>
                      <div className="text-sm">{scenario.label}</div>
                      <div className="text-xs opacity-50">{scenario.description}</div>
                    </div>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Player Selectors */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Player A */}
        <GlassCard className="p-4">
          <div className="text-xs opacity-60 mb-2 flex items-center gap-1">
            <Crosshair className="w-3 h-3" style={{ color: PURPLE.base }} />
            Player A (Attacker)
          </div>
          <button
            onClick={() => setShowPlayerASelect(!showPlayerASelect)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-purple-500/50 transition-colors"
          >
            <span className={playerA ? 'text-white' : 'opacity-50'}>
              {playerA ? (
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {playerA.name}
                </span>
              ) : 'Select Player...'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showPlayerASelect ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showPlayerASelect && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 bg-[#1a1a2e] border border-white/10 rounded-lg overflow-hidden max-h-48 overflow-y-auto"
              >
                <div className="p-2 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={searchA}
                      onChange={(e) => setSearchA(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white/5 rounded text-sm focus:outline-none focus:ring-1"
                      style={{ '--tw-ring-color': PURPLE.base } as React.CSSProperties}
                    />
                  </div>
                </div>
                {filteredPlayersA.map(player => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setPlayerAId(player.id);
                      setShowPlayerASelect(false);
                      setSearchA('');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                  >
                    <User className="w-4 h-4 opacity-50" />
                    <span className="text-sm">{player.name}</span>
                    {player.team && (
                      <span className="text-xs opacity-50 ml-auto">{player.team}</span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {playerA && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-60">Rating</span>
                <span className="font-medium" style={{ color: PURPLE.base }}>{playerA.rating.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="opacity-60">Clutch Rate</span>
                <span className="font-medium">{(playerA.clutchRate * 100).toFixed(1)}%</span>
              </div>
            </motion.div>
          )}
        </GlassCard>

        {/* Player B */}
        <GlassCard className="p-4">
          <div className="text-xs opacity-60 mb-2 flex items-center gap-1">
            <Shield className="w-3 h-3" style={{ color: '#22c55e' }} />
            Player B (Defender)
          </div>
          <button
            onClick={() => setShowPlayerBSelect(!showPlayerBSelect)}
            className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-white/5 border border-white/10 hover:border-green-500/50 transition-colors"
          >
            <span className={playerB ? 'text-white' : 'opacity-50'}>
              {playerB ? (
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {playerB.name}
                </span>
              ) : 'Select Player...'}
            </span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showPlayerBSelect ? 'rotate-180' : ''}`} />
          </button>
          
          <AnimatePresence>
            {showPlayerBSelect && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mt-2 bg-[#1a1a2e] border border-white/10 rounded-lg overflow-hidden max-h-48 overflow-y-auto"
              >
                <div className="p-2 border-b border-white/10">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
                    <input
                      type="text"
                      placeholder="Search players..."
                      value={searchB}
                      onChange={(e) => setSearchB(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white/5 rounded text-sm focus:outline-none focus:ring-1"
                      style={{ '--tw-ring-color': '#22c55e' } as React.CSSProperties}
                    />
                  </div>
                </div>
                {filteredPlayersB.map(player => (
                  <button
                    key={player.id}
                    onClick={() => {
                      setPlayerBId(player.id);
                      setShowPlayerBSelect(false);
                      setSearchB('');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition-colors text-left"
                  >
                    <User className="w-4 h-4 opacity-50" />
                    <span className="text-sm">{player.name}</span>
                    {player.team && (
                      <span className="text-xs opacity-50 ml-auto">{player.team}</span>
                    )}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          
          {playerB && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 pt-3 border-t border-white/10"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="opacity-60">Rating</span>
                <span className="font-medium text-green-400">{playerB.rating.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm mt-1">
                <span className="opacity-60">Clutch Rate</span>
                <span className="font-medium">{(playerB.clutchRate * 100).toFixed(1)}%</span>
              </div>
            </motion.div>
          )}
        </GlassCard>
      </div>

      {/* Context Inputs */}
      <GlassCard className="p-4">
        <h3 className="text-sm font-medium mb-4 flex items-center gap-2" style={{ color: PURPLE.base }}>
          <Swords className="w-4 h-4" />
          Context
        </h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Weapons */}
          <div>
            <div className="text-xs opacity-60 mb-2">Weapons</div>
            <div className="space-y-2">
              <select
                value={context.playerAWeapon}
                onChange={(e) => setContext(prev => ({ ...prev, playerAWeapon: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-purple-500"
              >
                {weapons.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
              <select
                value={context.playerBWeapon}
                onChange={(e) => setContext(prev => ({ ...prev, playerBWeapon: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm focus:outline-none focus:border-green-500"
              >
                {weapons.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
          </div>

          {/* HP */}
          <div>
            <div className="text-xs opacity-60 mb-2 flex items-center gap-1">
              <Heart className="w-3 h-3" />
              HP
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="150"
                  value={context.playerAHP}
                  onChange={(e) => setContext(prev => ({ ...prev, playerAHP: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-sm w-10 text-right" style={{ color: PURPLE.base }}>{context.playerAHP}</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="range"
                  min="1"
                  max="150"
                  value={context.playerBHP}
                  onChange={(e) => setContext(prev => ({ ...prev, playerBHP: parseInt(e.target.value) }))}
                  className="flex-1"
                />
                <span className="text-sm w-10 text-right text-green-400">{context.playerBHP}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Abilities */}
        <div className="mt-4">
          <div className="text-xs opacity-60 mb-2">Abilities Available</div>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-wrap gap-1">
              {abilities.map(ability => (
                <button
                  key={ability}
                  onClick={() => toggleAbility('A', ability)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    context.playerAAbilities?.includes(ability)
                      ? 'bg-purple-500/40 text-purple-200'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {ability}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {abilities.map(ability => (
                <button
                  key={ability}
                  onClick={() => toggleAbility('B', ability)}
                  className={`text-xs px-2 py-1 rounded transition-colors ${
                    context.playerBAbilities?.includes(ability)
                      ? 'bg-green-500/40 text-green-200'
                      : 'bg-white/5 hover:bg-white/10'
                  }`}
                >
                  {ability}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Predict Button */}
      <motion.button
        onClick={handlePredict}
        disabled={!playerAId || !playerBId || isLoading}
        className="w-full py-4 rounded-lg font-medium flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
        style={{ 
          backgroundColor: playerAId && playerBId ? PURPLE.base : 'rgba(255,255,255,0.1)',
          color: playerAId && playerBId ? 'white' : 'rgba(255,255,255,0.5)'
        }}
        whileHover={playerAId && playerBId ? { scale: 1.02, boxShadow: `0 0 30px ${PURPLE.glow}` } : {}}
        whileTap={playerAId && playerBId ? { scale: 0.98 } : {}}
      >
        {isLoading ? (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full"
          />
        ) : (
          <>
            <Swords className="w-5 h-5" />
            Predict Duel Outcome
          </>
        )}
      </motion.button>

      {/* Prediction Result */}
      {prediction && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <GlassCard className="p-6">
              <div className="text-center mb-6">
                <h3 className="text-lg font-medium mb-2" style={{ color: PURPLE.base }}>
                  Prediction Result
                </h3>
                <p className="text-sm opacity-60">{scenarios.find(s => s.id === prediction.scenario)?.label}</p>
              </div>

              {/* Win Probabilities */}
              <div className="flex items-center justify-between gap-4 mb-6">
                {/* Player A */}
                <div className="flex-1 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="text-4xl font-bold mb-2"
                    style={{ color: PURPLE.base }}
                  >
                    {(prediction.playerA.winProbability * 100).toFixed(1)}%
                  </motion.div>
                  <div className="text-sm opacity-60">{prediction.playerA.name}</div>
                  <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${prediction.playerA.winProbability * 100}%` }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: PURPLE.base }}
                    />
                  </div>
                </div>

                {/* VS */}
                <div className="text-lg opacity-40 font-bold">VS</div>

                {/* Player B */}
                <div className="flex-1 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring' }}
                    className="text-4xl font-bold mb-2 text-green-400"
                  >
                    {(prediction.playerB.winProbability * 100).toFixed(1)}%
                  </motion.div>
                  <div className="text-sm opacity-60">{prediction.playerB.name}</div>
                  <div className="mt-2 h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${prediction.playerB.winProbability * 100}%` }}
                      transition={{ delay: 0.3, duration: 0.5 }}
                      className="h-full rounded-full bg-green-500"
                    />
                  </div>
                </div>
              </div>

              {/* Confidence */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="text-center">
                  <div className="text-xs opacity-60 mb-1">Confidence</div>
                  <div 
                    className="text-2xl font-bold"
                    style={{ color: prediction.confidence >= 70 ? '#22c55e' : prediction.confidence >= 50 ? '#eab308' : '#ef4444' }}
                  >
                    {prediction.confidence.toFixed(0)}%
                  </div>
                </div>
                {prediction.similarSituations !== undefined && (
                  <div className="text-center">
                    <div className="text-xs opacity-60 mb-1">Similar Situations</div>
                    <div className="text-2xl font-bold text-blue-400">
                      {prediction.similarSituations}
                    </div>
                  </div>
                )}
              </div>

              {/* Confidence Interval */}
              <div className="bg-white/5 rounded-lg p-3">
                <div className="text-xs opacity-60 mb-2">Confidence Interval (95%)</div>
                <div className="relative h-6 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${prediction.confidence}%` }}
                    transition={{ delay: 0.5, duration: 0.5 }}
                    className="absolute left-0 top-0 h-full rounded-full"
                    style={{ 
                      background: `linear-gradient(90deg, ${getProbabilityColor(prediction.playerA.winProbability)}22, ${getProbabilityColor(prediction.playerA.winProbability)})`,
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                    ±{(100 - prediction.confidence).toFixed(1)}%
                  </div>
                </div>
              </div>
            </GlassCard>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  );
};

export default DuelPredictor;
