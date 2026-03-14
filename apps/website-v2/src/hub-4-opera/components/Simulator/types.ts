/**
 * OPERA Simulator Type Definitions
 * Types for prediction and simulation components
 * 
 * [Ver001.000]
 */

// ============================================================================
// PREDICTION RESULTS
// ============================================================================

export interface TeamPredictionData {
  id: string;
  name: string;
  tag?: string;
  avgRating: number;
  recentForm: number; // 0-100
  winRate: number;
  mapsPlayed: number;
  mapPool: string[];
}

export interface TeamPredictionResult {
  teamA: {
    id: string;
    name: string;
    winProbability: number;
  };
  teamB: {
    id: string;
    name: string;
    winProbability: number;
  };
  factors: {
    ratingDiff: number;
    formDiff: number;
    mapAdvantage?: string;
    h2hAdvantage?: number;
  };
  confidence: number; // 0-100
  timestamp: string;
}

export interface PlayerPredictionData {
  id: string;
  name: string;
  team?: string;
  role: 'duelist' | 'controller' | 'initiator' | 'sentinel' | 'flex';
  rating: number;
  acs: number; // Average Combat Score
  kdr: number; // K/D Ratio
  adr: number; // Average Damage per Round
  fkpr: number; // First Kill per Round
  fdpr: number; // First Death per Round
  clutchRate: number;
  agentPool: string[];
  recentForm: number[]; // Last 5 matches ratings
}

export interface PlayerComparisonResult {
  playerA: PlayerPredictionData;
  playerB: PlayerPredictionData;
  statsComparison: {
    ratingDiff: number;
    acsDiff: number;
    kdrDiff: number;
    adrDiff: number;
  };
  roleAdvantage?: string;
}

// ============================================================================
// DUEL PREDICTION
// ============================================================================

export type DuelScenario = 'first_blood' | '1v1' | '1v2' | '1v3' | 'clutch';

export interface DuelContext {
  playerAWeapon: string;
  playerBWeapon: string;
  playerAAbilities: string[];
  playerBAbilities: string[];
  playerAHP: number;
  playerBHP: number;
  mapName?: string;
  situation?: string;
}

export interface DuelPredictionResult {
  scenario: DuelScenario;
  playerA: {
    id: string;
    name: string;
    winProbability: number;
  };
  playerB: {
    id: string;
    name: string;
    winProbability: number;
  };
  confidence: number;
  context: DuelContext;
  similarSituations?: number;
}

// ============================================================================
// PREDICTION HISTORY
// ============================================================================

export interface PastPrediction {
  id: string;
  date: string;
  type: 'team' | 'player' | 'duel';
  teams: [string, string];
  predicted: string;
  predictedProbability: number;
  actual?: string;
  confidence: number;
  wasCorrect?: boolean;
}

export interface PredictionStats {
  totalPredictions: number;
  correctPredictions: number;
  accuracy: number;
  averageConfidence: number;
  byType: {
    team: { total: number; correct: number };
    player: { total: number; correct: number };
    duel: { total: number; correct: number };
  };
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface TeamH2HCompareProps {
  onPredict: (teamA: string, teamB: string) => Promise<TeamPredictionResult>;
  teams?: TeamPredictionData[];
}

export interface PlayerH2HCompareProps {
  onCompare: (playerA: string, playerB: string) => void;
  players?: PlayerPredictionData[];
}

export interface DuelPredictorProps {
  scenario: DuelScenario;
  onPredict?: (scenario: DuelScenario, playerAId: string, playerBId: string, context: DuelContext) => Promise<DuelPredictionResult>;
  players?: PlayerPredictionData[];
}

export interface WinProbabilityGaugeProps {
  teamAName: string;
  teamBName: string;
  probability: number; // 0-1, team A's win chance
  confidence?: number;
  size?: 'sm' | 'md' | 'lg';
}

export interface PredictionHistoryProps {
  predictions: PastPrediction[];
  onViewDetails: (id: string) => void;
}

export interface SimulatorPanelProps {
  defaultMode?: 'team' | 'player' | 'duel';
}

// ============================================================================
// MOCK DATA INTERFACES
// ============================================================================

export interface H2HHistory {
  date: string;
  winner: string;
  score: string;
  map: string;
}
