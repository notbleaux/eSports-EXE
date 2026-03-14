/**
 * OPERA Simulator Components - Index
 * Exports all simulator components and hooks
 * 
 * [Ver001.000]
 */

// Components
export { default as TeamH2HCompare } from './TeamH2HCompare';
export { default as PlayerH2HCompare } from './PlayerH2HCompare';
export { default as DuelPredictor } from './DuelPredictor';
export { default as WinProbabilityGauge } from './WinProbabilityGauge';
export { default as PredictionHistory } from './PredictionHistory';
export { default as SimulatorPanel } from './SimulatorPanel';

// Hooks
export { useSimulator, type UseSimulatorReturn } from './hooks/useSimulator';

// Types
export type {
  TeamPredictionData,
  TeamPredictionResult,
  PlayerPredictionData,
  PlayerComparisonResult,
  DuelScenario,
  DuelContext,
  DuelPredictionResult,
  PastPrediction,
  PredictionStats,
  TeamH2HCompareProps,
  PlayerH2HCompareProps,
  DuelPredictorProps,
  WinProbabilityGaugeProps,
  PredictionHistoryProps,
  SimulatorPanelProps,
  H2HHistory,
} from './types';

// Mock Data
export {
  PURPLE,
  mockTeams,
  mockPlayers,
  mockPredictions,
  mockH2HHistory,
  weapons,
  abilities,
  maps,
  roleColors,
} from './mockData';
