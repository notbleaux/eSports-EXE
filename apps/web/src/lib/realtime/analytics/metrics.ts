/**
 * Real-time Analytics Metrics
 * 
 * Live match analytics calculations including win probability, 
 * economy tracking, performance ratings, and momentum indicators.
 * 
 * [Ver001.000] - Real-time metrics engine
 * 
 * Agent: TL-S4-3-C
 * Team: Real-time Analytics (TL-S4)
 */

import type { 
  LiveMatchState, 
  LiveEvent, 
  LivePlayerState, 
  LiveTeamState,
  EconomyEventData,
  KillEventData,
  RoundEventData 
} from '../types';

// =============================================================================
// Types
// =============================================================================

export interface WinProbability {
  teamA: number; // 0-1 probability
  teamB: number;
  confidence: number; // 0-1 confidence in prediction
  timestamp: string;
  factors: ProbabilityFactor[];
}

export interface ProbabilityFactor {
  name: string;
  weight: number;
  impact: number; // -1 to 1 impact on probability
  description: string;
}

export interface EconomyMetrics {
  teamA: TeamEconomyMetrics;
  teamB: TeamEconomyMetrics;
  advantage: number; // Negative = teamA advantage, positive = teamB
  trend: 'improving' | 'stable' | 'declining';
  projectedWinner: string | null;
}

export interface TeamEconomyMetrics {
  teamId: string;
  totalCredits: number;
  averageLoadout: number;
  buyType: 'eco' | 'force' | 'full' | 'over' | 'mixed';
  consecutiveLosses: number;
  lossBonus: number;
  fullBuysRemaining: number;
}

export interface PerformanceRating {
  playerId: string;
  playerName: string;
  rating: number; // 0-100 scale
  acs: number;
  adr: number;
  kast: number; // Kill, Assist, Survive, Trade %
  impact: number;
  consistency: number;
  trend: 'rising' | 'stable' | 'falling';
}

export interface TeamPerformance {
  teamId: string;
  overallRating: number;
  players: PerformanceRating[];
  strengths: string[];
  weaknesses: string[];
}

export interface MomentumIndicator {
  direction: 'teamA' | 'teamB' | 'neutral';
  strength: number; // 0-1 strength of momentum
  streak: number; // Current round streak
  recentRounds: RoundTrend[];
  factors: MomentumFactor[];
}

export interface RoundTrend {
  round: number;
  winner: string;
  winCondition: string;
  economyAdvantage: number;
}

export interface MomentumFactor {
  type: 'rounds' | 'clutches' | 'entry' | 'economy' | 'adaptation';
  value: number;
  description: string;
}

export interface LiveAnalytics {
  matchId: string;
  timestamp: string;
  winProbability: WinProbability;
  economy: EconomyMetrics;
  teamA: TeamPerformance;
  teamB: TeamPerformance;
  momentum: MomentumIndicator;
  keyMoments: KeyMoment[];
  predictions: AnalyticsPrediction[];
}

export interface KeyMoment {
  id: string;
  type: 'clutch' | 'ace' | 'comeback' | 'momentum_shift' | 'economic_turn' | 'strategic_play';
  timestamp: string;
  round: number;
  description: string;
  impact: number;
  players: string[];
  videoTimestamp?: number;
}

export interface AnalyticsPrediction {
  id: string;
  type: 'round_winner' | 'match_winner' | 'player_performance' | 'economic_outcome';
  prediction: string;
  confidence: number;
  probability: number;
  timeframe: string;
  reasoning: string[];
}

export interface RealtimeMetricsConfig {
  updateInterval: number;
  historyWindow: number; // Number of rounds to consider
  confidenceThreshold: number;
  momentumDecay: number;
}

// =============================================================================
// Constants
// =============================================================================

export const DEFAULT_METRICS_CONFIG: RealtimeMetricsConfig = {
  updateInterval: 1000, // 1 second
  historyWindow: 5,
  confidenceThreshold: 0.7,
  momentumDecay: 0.9,
};

const BUY_TYPE_THRESHOLDS = {
  eco: { max: 1500 },
  force: { max: 3500 },
  full: { max: 5000 },
  over: { min: 5000 },
};

const MOMENTUM_WEIGHTS = {
  rounds: 0.4,
  clutches: 0.2,
  entry: 0.2,
  economy: 0.15,
  adaptation: 0.05,
};

// =============================================================================
// Win Probability Calculation
// =============================================================================

/**
 * Calculate live win probability for both teams
 */
export function calculateWinProbability(
  match: LiveMatchState,
  config: Partial<RealtimeMetricsConfig> = {}
): WinProbability {
  const fullConfig = { ...DEFAULT_METRICS_CONFIG, ...config };
  const factors: ProbabilityFactor[] = [];
  
  // Base probability from score
  const scoreFactor = calculateScoreFactor(match);
  factors.push({
    name: 'Score Advantage',
    weight: 0.35,
    impact: scoreFactor.impact,
    description: `${match.teamA.score}-${match.teamB.score} current score`,
  });
  
  // Economy factor
  const economyFactor = calculateEconomyFactor(match);
  factors.push({
    name: 'Economic State',
    weight: 0.25,
    impact: economyFactor.impact,
    description: economyFactor.description,
  });
  
  // Momentum factor
  const momentumFactor = calculateMomentumFactor(match, fullConfig);
  factors.push({
    name: 'Momentum',
    weight: 0.20,
    impact: momentumFactor.impact,
    description: momentumFactor.description,
  });
  
  // Performance factor
  const performanceFactor = calculatePerformanceFactor(match);
  factors.push({
    name: 'Team Performance',
    weight: 0.15,
    impact: performanceFactor.impact,
    description: performanceFactor.description,
  });
  
  // Map/position factor (if available)
  const positionFactor = calculatePositionFactor(match);
  factors.push({
    name: 'Map Control',
    weight: 0.05,
    impact: positionFactor.impact,
    description: positionFactor.description,
  });
  
  // Calculate weighted probability
  let teamAProbability = 0.5;
  factors.forEach(factor => {
    teamAProbability += factor.impact * factor.weight;
  });
  
  // Clamp to valid range
  teamAProbability = Math.max(0.05, Math.min(0.95, teamAProbability));
  const teamBProbability = 1 - teamAProbability;
  
  // Calculate confidence based on data quality and match state
  const confidence = calculateConfidence(match, factors);
  
  return {
    teamA: teamAProbability,
    teamB: teamBProbability,
    confidence,
    timestamp: new Date().toISOString(),
    factors,
  };
}

function calculateScoreFactor(match: LiveMatchState): { impact: number; description: string } {
  const scoreDiff = match.teamA.score - match.teamB.score;
  const totalRounds = match.teamA.score + match.teamB.score;
  const maxRounds = match.score.teamARoundsWon.length + match.score.teamBRoundsWon.length;
  
  if (totalRounds === 0) {
    return { impact: 0, description: 'Match just started' };
  }
  
  // Normalize score difference (-1 to 1 range)
  const normalizedDiff = Math.tanh(scoreDiff / 5);
  
  // Increase impact as match progresses
  const progressionFactor = Math.min(1, totalRounds / (maxRounds * 0.7));
  
  return {
    impact: normalizedDiff * progressionFactor,
    description: `Score difference: ${scoreDiff > 0 ? '+' : ''}${scoreDiff}`,
  };
}

function calculateEconomyFactor(match: LiveMatchState): { impact: number; description: string } {
  const teamAEconomy = match.teamA.totalCredits;
  const teamBEconomy = match.teamB.totalCredits;
  const totalEconomy = teamAEconomy + teamBEconomy;
  
  if (totalEconomy === 0) {
    return { impact: 0, description: 'Economy data unavailable' };
  }
  
  const economyAdvantage = (teamAEconomy - teamBEconomy) / totalEconomy;
  
  let description: string;
  if (economyAdvantage > 0.2) {
    description = `${match.teamA.name} has significant economic advantage`;
  } else if (economyAdvantage > 0.05) {
    description = `${match.teamA.name} has slight economic advantage`;
  } else if (economyAdvantage < -0.2) {
    description = `${match.teamB.name} has significant economic advantage`;
  } else if (economyAdvantage < -0.05) {
    description = `${match.teamB.name} has slight economic advantage`;
  } else {
    description = 'Economy is relatively even';
  }
  
  return { impact: economyAdvantage * 0.5, description };
}

function calculateMomentumFactor(
  match: LiveMatchState,
  config: RealtimeMetricsConfig
): { impact: number; description: string } {
  const recentRounds = match.score.teamARoundsWon.slice(-config.historyWindow);
  const teamBWins = match.score.teamBRoundsWon.slice(-config.historyWindow);
  
  const totalRecent = recentRounds.length + teamBWins.length;
  if (totalRecent === 0) {
    return { impact: 0, description: 'No recent rounds to analyze' };
  }
  
  const teamARecentWins = recentRounds.length;
  const momentum = (teamARecentWins / totalRecent - 0.5) * 2;
  
  let description: string;
  if (momentum > 0.5) {
    description = `${match.teamA.name} is on a strong streak`;
  } else if (momentum > 0.2) {
    description = `${match.teamA.name} has slight momentum`;
  } else if (momentum < -0.5) {
    description = `${match.teamB.name} is on a strong streak`;
  } else if (momentum < -0.2) {
    description = `${match.teamB.name} has slight momentum`;
  } else {
    description = 'Momentum is balanced';
  }
  
  return { impact: momentum * 0.3, description };
}

function calculatePerformanceFactor(match: LiveMatchState): { impact: number; description: string } {
  const teamAACS = match.teamA.players.reduce((sum, p) => sum + p.acs, 0) / Math.max(1, match.teamA.players.length);
  const teamBACS = match.teamB.players.reduce((sum, p) => sum + p.acs, 0) / Math.max(1, match.teamB.players.length);
  
  const totalACS = teamAACS + teamBACS;
  if (totalACS === 0) {
    return { impact: 0, description: 'Performance data unavailable' };
  }
  
  const performanceDiff = (teamAACS - teamBACS) / totalACS;
  
  let description: string;
  if (performanceDiff > 0.15) {
    description = `${match.teamA.name} performing significantly better`;
  } else if (performanceDiff > 0.05) {
    description = `${match.teamA.name} performing slightly better`;
  } else if (performanceDiff < -0.15) {
    description = `${match.teamB.name} performing significantly better`;
  } else if (performanceDiff < -0.05) {
    description = `${match.teamB.name} performing slightly better`;
  } else {
    description = 'Performance is evenly matched';
  }
  
  return { impact: performanceDiff * 0.4, description };
}

function calculatePositionFactor(match: LiveMatchState): { impact: number; description: string } {
  const teamAAlive = match.teamA.players.filter(p => p.alive).length;
  const teamBAlive = match.teamB.players.filter(p => p.alive).length;
  
  if (teamAAlive === 5 && teamBAlive === 5) {
    return { impact: 0, description: 'Round just started' };
  }
  
  const totalAlive = teamAAlive + teamBAlive;
  if (totalAlive === 0) {
    return { impact: 0, description: 'Round ended' };
  }
  
  const advantage = (teamAAlive - teamBAlive) / 5;
  
  return {
    impact: advantage * 0.2,
    description: `${teamAAlive}v${teamBAlive} player advantage`,
  };
}

function calculateConfidence(match: LiveMatchState, factors: ProbabilityFactor[]): number {
  // Base confidence from match state
  let confidence = 0.7;
  
  // Reduce confidence early in match
  const totalRounds = match.teamA.score + match.teamB.score;
  if (totalRounds < 3) {
    confidence *= 0.7;
  } else if (totalRounds < 6) {
    confidence *= 0.85;
  }
  
  // Increase confidence with more data points
  const dataQuality = factors.filter(f => Math.abs(f.impact) > 0.1).length / factors.length;
  confidence = confidence * 0.7 + dataQuality * 0.3;
  
  // Cap confidence
  return Math.min(0.95, Math.max(0.4, confidence));
}

// =============================================================================
// Economy Tracking
// =============================================================================

/**
 * Calculate comprehensive economy metrics
 */
export function calculateEconomyMetrics(match: LiveMatchState): EconomyMetrics {
  const teamA = calculateTeamEconomy(match.teamA, match.score.teamARoundsWon);
  const teamB = calculateTeamEconomy(match.teamB, match.score.teamBRoundsWon);
  
  const totalValue = teamA.averageLoadout + teamB.averageLoadout;
  const advantage = totalValue > 0 
    ? (teamB.averageLoadout - teamA.averageLoadout) / totalValue 
    : 0;
  
  // Determine trend
  const trend = determineEconomyTrend(match, teamA, teamB);
  
  // Project winner based on economy
  const projectedWinner = projectEconomicWinner(teamA, teamB, match);
  
  return {
    teamA,
    teamB,
    advantage,
    trend,
    projectedWinner,
  };
}

function calculateTeamEconomy(
  team: LiveTeamState,
  roundsWon: number[]
): TeamEconomyMetrics {
  const totalCredits = team.totalCredits;
  const players = team.players;
  
  // Calculate average loadout value
  const averageLoadout = players.reduce((sum, p) => sum + p.loadoutValue, 0) / players.length;
  
  // Determine buy type
  const buyType = determineBuyType(averageLoadout);
  
  // Calculate consecutive losses (simplified)
  const consecutiveLosses = calculateConsecutiveLosses(roundsWon);
  const lossBonus = Math.min(2900, 1900 + consecutiveLosses * 500);
  
  // Estimate full buys remaining
  const fullBuysRemaining = Math.floor(totalCredits / 5000);
  
  return {
    teamId: team.id,
    totalCredits,
    averageLoadout,
    buyType,
    consecutiveLosses,
    lossBonus,
    fullBuysRemaining,
  };
}

function determineBuyType(averageLoadout: number): TeamEconomyMetrics['buyType'] {
  if (averageLoadout < BUY_TYPE_THRESHOLDS.eco.max) return 'eco';
  if (averageLoadout < BUY_TYPE_THRESHOLDS.force.max) return 'force';
  if (averageLoadout < BUY_TYPE_THRESHOLDS.full.max) return 'full';
  return 'over';
}

function calculateConsecutiveLosses(roundsWon: number[]): number {
  if (roundsWon.length === 0) return 0;
  
  // Count consecutive losses from the end
  let consecutive = 0;
  const maxRound = Math.max(...roundsWon);
  
  for (let i = maxRound + 1; i > 0 && !roundsWon.includes(i); i--) {
    consecutive++;
  }
  
  return Math.min(consecutive, 4);
}

function determineEconomyTrend(
  match: LiveMatchState,
  teamA: TeamEconomyMetrics,
  teamB: TeamEconomyMetrics
): EconomyMetrics['trend'] {
  // Analyze recent economic history
  const recentRounds = Math.min(3, match.currentRound);
  if (recentRounds < 2) return 'stable';
  
  const teamATrend = teamA.totalCredits > 20000 ? 'improving' : 
    teamA.totalCredits < 10000 ? 'declining' : 'stable';
  
  // Return overall trend
  if (teamATrend === teamB.totalCredits > 20000 ? 'improving' : 
      teamB.totalCredits < 10000 ? 'declining' : 'stable') {
    return 'stable';
  }
  
  return teamATrend;
}

function projectEconomicWinner(
  teamA: TeamEconomyMetrics,
  teamB: TeamEconomyMetrics,
  match: LiveMatchState
): string | null {
  if (match.status === 'completed') return null;
  
  const scoreDiff = match.teamA.score - match.teamB.score;
  const economyAdvantage = teamA.totalCredits - teamB.totalCredits;
  
  // Project based on current trajectory
  if (scoreDiff > 3 && economyAdvantage > 5000) return match.teamA.id;
  if (scoreDiff < -3 && economyAdvantage < -5000) return match.teamB.id;
  
  return null;
}

// =============================================================================
// Performance Ratings
// =============================================================================

/**
 * Calculate real-time performance ratings for all players
 */
export function calculatePerformanceRatings(match: LiveMatchState): {
  teamA: TeamPerformance;
  teamB: TeamPerformance;
} {
  const teamAPlayers = match.teamA.players.map(p => calculatePlayerRating(p, match));
  const teamBPlayers = match.teamB.players.map(p => calculatePlayerRating(p, match));
  
  const teamAOverall = teamAPlayers.reduce((sum, p) => sum + p.rating, 0) / teamAPlayers.length;
  const teamBOverall = teamBPlayers.reduce((sum, p) => sum + p.rating, 0) / teamBPlayers.length;
  
  return {
    teamA: {
      teamId: match.teamA.id,
      overallRating: teamAOverall,
      players: teamAPlayers,
      strengths: identifyTeamStrengths(teamAPlayers, match.teamA),
      weaknesses: identifyTeamWeaknesses(teamAPlayers, match.teamA),
    },
    teamB: {
      teamId: match.teamB.id,
      overallRating: teamBOverall,
      players: teamBPlayers,
      strengths: identifyTeamStrengths(teamBPlayers, match.teamB),
      weaknesses: identifyTeamWeaknesses(teamBPlayers, match.teamB),
    },
  };
}

function calculatePlayerRating(player: LivePlayerState, match: LiveMatchState): PerformanceRating {
  // Calculate ACS (Average Combat Score) - normalized to 0-100
  const acsNormalized = Math.min(100, player.acs / 4);
  
  // Calculate KAST approximation
  const roundsPlayed = match.currentRound;
  const kast = roundsPlayed > 0 
    ? (player.kills + player.assists + (roundsPlayed - player.deaths)) / roundsPlayed * 100
    : 0;
  
  // Calculate impact score
  const impact = calculateImpactScore(player, match);
  
  // Calculate consistency
  const consistency = calculateConsistency(player);
  
  // Overall rating (weighted average)
  const rating = (
    acsNormalized * 0.35 +
    Math.min(100, player.adr) * 0.25 +
    kast * 0.25 +
    impact * 0.15
  );
  
  // Determine trend
  const trend = determinePlayerTrend(player, match);
  
  return {
    playerId: player.id,
    playerName: player.name,
    rating: Math.round(rating),
    acs: Math.round(player.acs),
    adr: Math.round(player.adr),
    kast: Math.round(kast),
    impact: Math.round(impact),
    consistency: Math.round(consistency),
    trend,
  };
}

function calculateImpactScore(player: LivePlayerState, match: LiveMatchState): number {
  let impact = 0;
  
  // First bloods
  impact += player.firstBloods * 15;
  
  // Clutch wins
  impact += player.clutchWins * 25;
  
  // Multi-kill potential (estimated)
  const avgKills = match.currentRound > 0 ? player.kills / match.currentRound : 0;
  impact += avgKills * 10;
  
  // Objective contribution
  impact += (player.plants + player.defuses) * 10;
  
  return Math.min(100, impact);
}

function calculateConsistency(player: LivePlayerState): number {
  // Simplified consistency based on K/D ratio smoothness
  if (player.deaths === 0) return 100;
  
  const kd = player.kills / player.deaths;
  // Higher consistency for K/D closer to 1
  const consistency = 100 - Math.abs(kd - 1) * 30;
  return Math.max(0, Math.min(100, consistency));
}

function determinePlayerTrend(player: LivePlayerState, match: LiveMatchState): PerformanceRating['trend'] {
  // Simplified trend detection based on recent performance
  if (match.currentRound < 3) return 'stable';
  
  const recentRounds = Math.min(5, match.currentRound);
  const expectedKills = (player.kills / match.currentRound) * recentRounds;
  
  // Placeholder - in real implementation would use round-by-round data
  if (player.acs > 250) return 'rising';
  if (player.acs < 150) return 'falling';
  return 'stable';
}

function identifyTeamStrengths(players: PerformanceRating[], team: LiveTeamState): string[] {
  const strengths: string[] = [];
  
  const avgRating = players.reduce((sum, p) => sum + p.rating, 0) / players.length;
  const avgACS = players.reduce((sum, p) => sum + p.acs, 0) / players.length;
  
  if (avgRating > 75) strengths.push('Strong overall performance');
  if (avgACS > 220) strengths.push('High damage output');
  if (players.some(p => p.acs > 280)) strengths.push('Star player performing');
  if (players.filter(p => p.trend === 'rising').length >= 3) strengths.push('Team trending up');
  
  return strengths;
}

function identifyTeamWeaknesses(players: PerformanceRating[], team: LiveTeamState): string[] {
  const weaknesses: string[] = [];
  
  const avgRating = players.reduce((sum, p) => sum + p.rating, 0) / players.length;
  const avgACS = players.reduce((sum, p) => sum + p.acs, 0) / players.length;
  
  if (avgRating < 50) weaknesses.push('Below average performance');
  if (avgACS < 180) weaknesses.push('Low damage output');
  if (players.filter(p => p.trend === 'falling').length >= 3) weaknesses.push('Team trending down');
  if (players.some(p => p.consistency < 40)) weaknesses.push('Inconsistent player performance');
  
  return weaknesses;
}

// =============================================================================
// Momentum Indicators
// =============================================================================

/**
 * Calculate momentum indicators for the match
 */
export function calculateMomentum(match: LiveMatchState): MomentumIndicator {
  const recentRounds: RoundTrend[] = [];
  const allRounds = [...match.score.teamARoundsWon, ...match.score.teamBRoundsWon].sort((a, b) => a - b);
  
  // Build recent rounds history
  for (let i = Math.max(0, allRounds.length - 5); i < allRounds.length; i++) {
    const round = allRounds[i];
    const teamAWon = match.score.teamARoundsWon.includes(round);
    
    recentRounds.push({
      round,
      winner: teamAWon ? match.teamA.id : match.teamB.id,
      winCondition: 'elimination', // Simplified - would come from actual round data
      economyAdvantage: 0, // Would calculate from round data
    });
  }
  
  // Calculate current streak
  const streak = calculateCurrentStreak(match);
  
  // Calculate momentum factors
  const factors: MomentumFactor[] = [];
  
  // Round momentum
  const teamAWins = recentRounds.filter(r => r.winner === match.teamA.id).length;
  const roundMomentum = teamAWins / recentRounds.length - 0.5;
  factors.push({
    type: 'rounds',
    value: roundMomentum,
    description: `${teamAWins}/${recentRounds.length} recent rounds won`,
  });
  
  // Clutch momentum (would come from event analysis)
  factors.push({
    type: 'clutches',
    value: 0,
    description: 'Clutch performance balanced',
  });
  
  // Entry momentum
  const entryAdvantage = calculateEntryAdvantage(match);
  factors.push({
    type: 'entry',
    value: entryAdvantage,
    description: entryAdvantage > 0 ? 'Strong entry fragging' : 'Weak entry performance',
  });
  
  // Economy momentum
  const economyAdvantage = (match.teamA.totalCredits - match.teamB.totalCredits) / 25000;
  factors.push({
    type: 'economy',
    value: Math.tanh(economyAdvantage),
    description: economyAdvantage > 0 ? 'Economic advantage' : 'Economic disadvantage',
  });
  
  // Calculate overall momentum
  let momentumScore = 0;
  factors.forEach(f => {
    momentumScore += f.value * (MOMENTUM_WEIGHTS[f.type] || 0.1);
  });
  
  // Determine direction and strength
  let direction: MomentumIndicator['direction'] = 'neutral';
  if (momentumScore > 0.1) direction = 'teamA';
  else if (momentumScore < -0.1) direction = 'teamB';
  
  const strength = Math.min(1, Math.abs(momentumScore) * 2);
  
  return {
    direction,
    strength,
    streak,
    recentRounds,
    factors,
  };
}

function calculateCurrentStreak(match: LiveMatchState): number {
  const allRounds = [
    ...match.score.teamARoundsWon.map(r => ({ round: r, team: 'A' })),
    ...match.score.teamBRoundsWon.map(r => ({ round: r, team: 'B' })),
  ].sort((a, b) => a.round - b.round);
  
  if (allRounds.length === 0) return 0;
  
  const lastWinner = allRounds[allRounds.length - 1].team;
  let streak = 0;
  
  for (let i = allRounds.length - 1; i >= 0; i--) {
    if (allRounds[i].team === lastWinner) {
      streak++;
    } else {
      break;
    }
  }
  
  return lastWinner === 'A' ? streak : -streak;
}

function calculateEntryAdvantage(match: LiveMatchState): number {
  // Simplified entry advantage calculation
  const teamAFirstBloods = match.teamA.players.reduce((sum, p) => sum + p.firstBloods, 0);
  const teamBFirstBloods = match.teamB.players.reduce((sum, p) => sum + p.firstBloods, 0);
  
  const total = teamAFirstBloods + teamBFirstBloods;
  if (total === 0) return 0;
  
  return (teamAFirstBloods / total - 0.5) * 2;
}

// =============================================================================
// Key Moments Detection
// =============================================================================

/**
 * Detect key moments from match events
 */
export function detectKeyMoments(events: LiveEvent[]): KeyMoment[] {
  const moments: KeyMoment[] = [];
  
  events.forEach(event => {
    switch (event.type) {
      case 'kill':
        const killData = event.data as KillEventData;
        
        // Check for clutch situation (1vX)
        // Simplified - would need round state tracking
        break;
        
      case 'round_end':
        const roundData = event.data as RoundEventData;
        
        // Detect comeback rounds
        if (isComebackRound(roundData)) {
          moments.push({
            id: `comeback_${event.id}`,
            type: 'comeback',
            timestamp: event.timestamp,
            round: roundData.roundNumber,
            description: `Comeback win by ${roundData.winningTeam}`,
            impact: 0.8,
            players: [],
          });
        }
        break;
    }
  });
  
  return moments;
}

function isComebackRound(roundData: RoundEventData): boolean {
  // Simplified comeback detection
  return roundData.winCondition === 'elimination' && roundData.duration > 80;
}

// =============================================================================
// Predictions
// =============================================================================

/**
 * Generate analytics-based predictions
 */
export function generatePredictions(
  match: LiveMatchState,
  winProbability: WinProbability
): AnalyticsPrediction[] {
  const predictions: AnalyticsPrediction[] = [];
  
  // Match winner prediction
  const favoredTeam = winProbability.teamA > winProbability.teamB ? match.teamA : match.teamB;
  const winProb = Math.max(winProbability.teamA, winProbability.teamB);
  
  predictions.push({
    id: `match_winner_${Date.now()}`,
    type: 'match_winner',
    prediction: `${favoredTeam.name} to win the match`,
    confidence: winProbability.confidence,
    probability: winProb,
    timeframe: 'End of match',
    reasoning: winProbability.factors
      .filter(f => Math.abs(f.impact) > 0.1)
      .map(f => f.description),
  });
  
  // Round winner prediction
  const roundProb = winProbability.teamA > 0.5 ? winProbability.teamA : winProbability.teamB;
  predictions.push({
    id: `round_winner_${Date.now()}`,
    type: 'round_winner',
    prediction: `${favoredTeam.name} favored to win next round`,
    confidence: winProbability.confidence * 0.9,
    probability: roundProb,
    timeframe: 'Next round',
    reasoning: ['Current economic state', 'Momentum factors'],
  });
  
  return predictions;
}

// =============================================================================
// Main Analytics Calculation
// =============================================================================

/**
 * Calculate complete live analytics for a match
 */
export function calculateLiveAnalytics(
  match: LiveMatchState,
  config: Partial<RealtimeMetricsConfig> = {}
): LiveAnalytics {
  const winProbability = calculateWinProbability(match, config);
  const economy = calculateEconomyMetrics(match);
  const performance = calculatePerformanceRatings(match);
  const momentum = calculateMomentum(match);
  const keyMoments = detectKeyMoments(match.events);
  const predictions = generatePredictions(match, winProbability);
  
  return {
    matchId: match.matchId,
    timestamp: new Date().toISOString(),
    winProbability,
    economy,
    teamA: performance.teamA,
    teamB: performance.teamB,
    momentum,
    keyMoments,
    predictions,
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Format probability as percentage string
 */
export function formatProbability(probability: number): string {
  return `${Math.round(probability * 100)}%`;
}

/**
 * Get probability color based on value
 */
export function getProbabilityColor(probability: number): string {
  if (probability >= 0.7) return '#22c55e'; // Green
  if (probability >= 0.5) return '#eab308'; // Yellow
  if (probability >= 0.3) return '#f97316'; // Orange
  return '#ef4444'; // Red
}

/**
 * Format economy value
 */
export function formatEconomy(credits: number): string {
  if (credits >= 1000) {
    return `${(credits / 1000).toFixed(1)}k`;
  }
  return credits.toString();
}

/**
 * Get momentum color
 */
export function getMomentumColor(direction: MomentumIndicator['direction']): string {
  switch (direction) {
    case 'teamA': return '#3b82f6';
    case 'teamB': return '#ef4444';
    default: return '#9ca3af';
  }
}

// =============================================================================
// Exports
// =============================================================================

export default {
  calculateWinProbability,
  calculateEconomyMetrics,
  calculatePerformanceRatings,
  calculateMomentum,
  calculateLiveAnalytics,
  detectKeyMoments,
  generatePredictions,
  formatProbability,
  formatEconomy,
};
