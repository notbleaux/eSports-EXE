/**
 * useSimulator Hook
 * Provides prediction algorithms and state management for OPERA Simulator
 * 
 * [Ver001.000]
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  TeamPredictionData,
  TeamPredictionResult,
  PlayerPredictionData,
  DuelPredictionResult,
  DuelScenario,
  DuelContext,
  PastPrediction,
} from '../types';
import { mockTeams, mockPlayers, mockH2HHistory } from '../mockData';

// ============================================================================
// MATH UTILITIES
// ============================================================================

/** Sigmoid function for probability calculation */
const sigmoid = (x: number): number => {
  return 1 / (1 + Math.exp(-x));
};

/** Clamp value between min and max */
const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

/** Calculate standard deviation */
const stdDev = (values: number[]): number => {
  if (values.length < 2) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
};

// ============================================================================
// PREDICTION ALGORITHMS
// ============================================================================

/**
 * Calculate team win probability using Elo-like system
 * winProb = sigmoid((ratingA - ratingB) / 200 + (formA - formB) * 0.01)
 */
const calculateTeamWinProbability = (
  teamA: TeamPredictionData,
  teamB: TeamPredictionData
): { probability: number; factors: { ratingDiff: number; formDiff: number } } => {
  const ratingDiff = teamA.avgRating - teamB.avgRating;
  const formDiff = teamA.recentForm - teamB.recentForm;
  
  // Base probability from rating difference
  const ratingContribution = ratingDiff / 200;
  
  // Form contribution (normalized to -0.5 to 0.5)
  const formContribution = formDiff * 0.01;
  
  // Combined probability with sigmoid
  const rawProb = sigmoid(ratingContribution + formContribution);
  
  // Clamp to avoid 0% or 100%
  const probability = clamp(rawProb, 0.05, 0.95);
  
  return {
    probability,
    factors: {
      ratingDiff,
      formDiff,
    },
  };
};

/**
 * Calculate first blood probability
 * fbProb = playerA_fbRate / (playerA_fbRate + playerB_fbRate)
 */
const calculateFirstBloodProbability = (
  playerA: PlayerPredictionData,
  playerB: PlayerPredictionData
): number => {
  const fbRateA = playerA.fkpr;
  const fbRateB = playerB.fkpr;
  
  if (fbRateA + fbRateB === 0) return 0.5;
  
  const probA = fbRateA / (fbRateA + fbRateB);
  return clamp(probA, 0.1, 0.9);
};

/**
 * Calculate clutch probability (1vX scenarios)
 * clutchProb = baseRate * (1 / enemies) * (hpPercent / 100) * clutchSkill
 */
const calculateClutchProbability = (
  player: PlayerPredictionData,
  enemies: number,
  hpPercent: number,
  opponentHpPercent: number
): number => {
  const baseRate = 0.15; // 15% base clutch rate
  const enemyFactor = 1 / enemies;
  const hpFactor = clamp(hpPercent / 100, 0.1, 1);
  const opponentHpFactor = clamp(opponentHpPercent / 100, 0.1, 1);
  const clutchSkill = player.clutchRate * 2; // Scale clutch rate
  
  const rawProb = baseRate * enemyFactor * (hpFactor / opponentHpFactor) * clutchSkill;
  return clamp(rawProb, 0.02, 0.8);
};

/**
 * Calculate 1v1 duel probability
 */
const calculate1v1Probability = (
  playerA: PlayerPredictionData,
  playerB: PlayerPredictionData,
  context: Partial<DuelContext>
): number => {
  // Base probability from rating
  const ratingDiff = playerA.rating - playerB.rating;
  const baseProb = sigmoid(ratingDiff * 2);
  
  // HP advantage
  const hpA = context.playerAHP ?? 100;
  const hpB = context.playerBHP ?? 100;
  const hpFactor = clamp(hpA / hpB, 0.5, 2);
  
  // Weapon factor (simplified)
  const weaponTier: Record<string, number> = {
    'Vandal': 1.0, 'Phantom': 1.0,
    'Operator': 1.2, 'Sheriff': 0.7,
    'Ghost': 0.6, 'Classic': 0.5,
    'Spectre': 0.75, 'Odin': 0.8,
    'Judge': 0.9, 'Bulldog': 0.85,
    'Guardian': 0.9, 'Marshal': 0.85,
  };
  
  const weaponA = weaponTier[context.playerAWeapon ?? 'Vandal'] ?? 1.0;
  const weaponB = weaponTier[context.playerBWeapon ?? 'Vandal'] ?? 1.0;
  const weaponFactor = weaponA / weaponB;
  
  // Combined calculation
  const finalProb = baseProb * hpFactor * weaponFactor;
  return clamp(finalProb, 0.05, 0.95);
};

/**
 * Calculate confidence based on data quality and consistency
 */
const calculateConfidence = (
  baseConfidence: number,
  factors: { sampleSize?: number; consistency?: number; recency?: number }
): number => {
  const { sampleSize = 100, consistency = 0.8, recency = 1.0 } = factors;
  
  // Sample size factor (more data = higher confidence)
  const sampleFactor = Math.min(sampleSize / 50, 1);
  
  // Consistency factor (lower variance = higher confidence)
  const consistencyFactor = consistency;
  
  // Recency factor (recent data = higher confidence)
  const recencyFactor = recency;
  
  const adjustedConfidence = baseConfidence * sampleFactor * consistencyFactor * recencyFactor;
  return clamp(adjustedConfidence * 100, 30, 95);
};

// ============================================================================
// HOOK
// ============================================================================

export interface UseSimulatorReturn {
  // State
  isLoading: boolean;
  prediction: TeamPredictionResult | DuelPredictionResult | null;
  history: PastPrediction[];
  
  // Data
  teams: TeamPredictionData[];
  players: PlayerPredictionData[];
  
  // Actions
  predictTeamH2H: (teamAId: string, teamBId: string) => Promise<TeamPredictionResult>;
  predictDuel: (
    scenario: DuelScenario,
    playerAId: string,
    playerBId: string,
    context?: Partial<DuelContext>
  ) => Promise<DuelPredictionResult>;
  addToHistory: (prediction: PastPrediction) => void;
  clearHistory: () => void;
  
  // Utilities
  getH2HHistory: (teamAId: string, teamBId: string) => Array<{ date: string; winner: string; score: string; map: string }>;
}

export const useSimulator = (): UseSimulatorReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<TeamPredictionResult | DuelPredictionResult | null>(null);
  const [history, setHistory] = useState<PastPrediction[]>([]);
  
  const teams = useMemo(() => mockTeams, []);
  const players = useMemo(() => mockPlayers, []);

  /**
   * Predict team head-to-head outcome
   */
  const predictTeamH2H = useCallback(async (
    teamAId: string,
    teamBId: string
  ): Promise<TeamPredictionResult> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const teamA = teams.find(t => t.id === teamAId);
    const teamB = teams.find(t => t.id === teamBId);
    
    if (!teamA || !teamB) {
      setIsLoading(false);
      throw new Error('Team not found');
    }
    
    const { probability, factors } = calculateTeamWinProbability(teamA, teamB);
    
    // Calculate confidence
    const avgMaps = (teamA.mapsPlayed + teamB.mapsPlayed) / 2;
    const formStdDev = stdDev([...teamA.recentForm ? [teamA.recentForm] : [], ...teamB.recentForm ? [teamB.recentForm] : []]);
    const confidence = calculateConfidence(0.85, {
      sampleSize: avgMaps,
      consistency: 1 - (formStdDev / 100),
      recency: 1.0,
    });
    
    const result: TeamPredictionResult = {
      teamA: {
        id: teamA.id,
        name: teamA.name,
        winProbability: probability,
      },
      teamB: {
        id: teamB.id,
        name: teamB.name,
        winProbability: 1 - probability,
      },
      factors: {
        ratingDiff: factors.ratingDiff,
        formDiff: factors.formDiff,
        mapAdvantage: findMapAdvantage(teamA.mapPool, teamB.mapPool),
      },
      confidence,
      timestamp: new Date().toISOString(),
    };
    
    setPrediction(result);
    setIsLoading(false);
    
    return result;
  }, [teams]);

  /**
   * Predict duel outcome
   */
  const predictDuel = useCallback(async (
    scenario: DuelScenario,
    playerAId: string,
    playerBId: string,
    context: Partial<DuelContext> = {}
  ): Promise<DuelPredictionResult> => {
    setIsLoading(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const playerA = players.find(p => p.id === playerAId);
    const playerB = players.find(p => p.id === playerBId);
    
    if (!playerA || !playerB) {
      setIsLoading(false);
      throw new Error('Player not found');
    }
    
    let probability: number;
    
    switch (scenario) {
      case 'first_blood':
        probability = calculateFirstBloodProbability(playerA, playerB);
        break;
      case 'clutch':
        probability = calculateClutchProbability(
          playerA,
          2, // Default 1v2
          context.playerAHP ?? 100,
          context.playerBHP ?? 100
        );
        break;
      case '1v2':
      case '1v3':
        probability = calculateClutchProbability(
          playerA,
          scenario === '1v2' ? 2 : 3,
          context.playerAHP ?? 100,
          context.playerBHP ?? 100
        );
        break;
      case '1v1':
      default:
        probability = calculate1v1Probability(playerA, playerB, context);
    }
    
    // Calculate confidence based on scenario
    const scenarioConfidence: Record<DuelScenario, number> = {
      'first_blood': 0.75,
      '1v1': 0.70,
      '1v2': 0.60,
      '1v3': 0.50,
      'clutch': 0.55,
    };
    
    const formStdDev = stdDev(playerA.recentForm) + stdDev(playerB.recentForm);
    const confidence = calculateConfidence(scenarioConfidence[scenario], {
      sampleSize: 50,
      consistency: 1 - (formStdDev / 2),
      recency: 1.0,
    });
    
    const fullContext: DuelContext = {
      playerAWeapon: context.playerAWeapon ?? 'Vandal',
      playerBWeapon: context.playerBWeapon ?? 'Vandal',
      playerAAbilities: context.playerAAbilities ?? [],
      playerBAbilities: context.playerBAbilities ?? [],
      playerAHP: context.playerAHP ?? 100,
      playerBHP: context.playerBHP ?? 100,
      mapName: context.mapName,
      situation: context.situation,
    };
    
    const result: DuelPredictionResult = {
      scenario,
      playerA: {
        id: playerA.id,
        name: playerA.name,
        winProbability: probability,
      },
      playerB: {
        id: playerB.id,
        name: playerB.name,
        winProbability: 1 - probability,
      },
      confidence,
      context: fullContext,
      similarSituations: Math.floor(Math.random() * 50) + 10,
    };
    
    setPrediction(result);
    setIsLoading(false);
    
    return result;
  }, [players]);

  /**
   * Add prediction to history
   */
  const addToHistory = useCallback((newPrediction: PastPrediction) => {
    setHistory(prev => [newPrediction, ...prev].slice(0, 100));
  }, []);

  /**
   * Clear prediction history
   */
  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  /**
   * Get H2H history between two teams
   */
  const getH2HHistory = useCallback((teamAId: string, teamBId: string) => {
    const key1 = `${teamAId}-${teamBId}`;
    const key2 = `${teamBId}-${teamAId}`;
    
    return mockH2HHistory[key1] || mockH2HHistory[key2] || [];
  }, []);

  /**
   * Find map advantage between two teams
   */
  function findMapAdvantage(mapPoolA: string[], mapPoolB: string[]): string | undefined {
    const commonMaps = mapPoolA.filter(m => mapPoolB.includes(m));
    if (commonMaps.length > 0) {
      return commonMaps[Math.floor(Math.random() * commonMaps.length)];
    }
    return undefined;
  }

  return {
    isLoading,
    prediction,
    history,
    teams,
    players,
    predictTeamH2H,
    predictDuel,
    addToHistory,
    clearHistory,
    getH2HHistory,
  };
};

export default useSimulator;
