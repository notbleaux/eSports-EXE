// @ts-nocheck
/**
 * Historical Comparison System
 * 
 * Compare live matches to historical data, pattern matching,
 * anomaly detection, and context enrichment.
 * 
 * [Ver001.000] - Historical comparison engine
 * 
 * Agent: TL-S4-3-C
 * Team: Real-time Analytics (TL-S4)
 */

import type { LiveMatchState, LiveEvent, LivePlayerState } from '../types';
import type { LiveAnalytics, WinProbability, MomentumIndicator } from './metrics';

// =============================================================================
// Types
// =============================================================================

export interface HistoricalMatch {
  id: string;
  matchId: string;
  teams: {
    teamA: { id: string; name: string; score: number };
    teamB: { id: string; name: string; score: number };
  };
  map: string;
  finalScore: { teamA: number; teamB: number };
  rounds: HistoricalRound[];
  timestamp: string;
  tournament?: string;
  tags: string[];
}

export interface HistoricalRound {
  round: number;
  winner: string;
  winCondition: string;
  teamAEconomy: number;
  teamBEconomy: number;
  duration: number;
  firstBloodTeam?: string;
}

export interface PatternMatch {
  pattern: MatchPattern;
  confidence: number;
  similarity: number;
  historicalMatches: HistoricalMatch[];
  predictions: PatternPrediction[];
}

export interface MatchPattern {
  id: string;
  name: string;
  description: string;
  type: 'comeback' | 'dominance' | 'back_and_forth' | 'economic_advantage' | 'momentum_shift' | 'close_match';
  criteria: PatternCriteria;
}

export interface PatternCriteria {
  minRounds?: number;
  maxRounds?: number;
  scoreDifferential?: number;
  economyThreshold?: number;
  momentumThreshold?: number;
  winConditions?: string[];
}

export interface PatternPrediction {
  outcome: string;
  probability: number;
  confidence: number;
  reasoning: string[];
}

export interface AnomalyDetection {
  isAnomaly: boolean;
  anomalyScore: number;
  anomalies: Anomaly[];
  explanation: string;
}

export interface Anomaly {
  type: 'statistical' | 'temporal' | 'behavioral';
  field: string;
  expectedValue: number;
  actualValue: number;
  severity: 'low' | 'medium' | 'high';
  description: string;
}

export interface ContextEnrichment {
  similarMatches: SimilarMatch[];
  teamHistory: TeamHistory;
  playerContext: PlayerContext[];
  mapContext: MapContext;
  tournamentContext?: TournamentContext;
}

export interface SimilarMatch {
  historicalMatch: HistoricalMatch;
  similarity: number;
  atRound: number;
  currentScore: { teamA: number; teamB: number };
  finalScore: { teamA: number; teamB: number };
  outcome: string;
}

export interface TeamHistory {
  teamA: TeamHistoricalStats;
  teamB: TeamHistoricalStats;
  h2h: HeadToHeadStats;
}

export interface TeamHistoricalStats {
  matchesPlayed: number;
  wins: number;
  losses: number;
  winRate: number;
  averageScore: number;
  mapWinRates: Record<string, number>;
  recentForm: ('W' | 'L')[];
}

export interface HeadToHeadStats {
  matchesPlayed: number;
  teamAWins: number;
  teamBWins: number;
  lastMatch?: HistoricalMatch;
  averageScoreDiff: number;
}

export interface PlayerContext {
  playerId: string;
  playerName: string;
  historicalAverage: PlayerHistoricalStats;
  currentVsAverage: StatComparison;
  trend: 'above_average' | 'average' | 'below_average';
}

export interface PlayerHistoricalStats {
  matches: number;
  avgACS: number;
  avgADR: number;
  avgKills: number;
  avgDeaths: number;
  consistency: number;
}

export interface StatComparison {
  acs: number;
  adr: number;
  kills: number;
  performance: 'better' | 'similar' | 'worse';
}

export interface MapContext {
  map: string;
  totalMatches: number;
  averageRounds: number;
  sideWinRates: {
    attack: number;
    defense: number;
  };
  commonStrategies: string[];
}

export interface TournamentContext {
  tournament: string;
  stage: string;
  stakes: 'low' | 'medium' | 'high' | 'critical';
  elimination: boolean;
  prizePool?: number;
}

export interface HistoricalComparison {
  matchId: string;
  timestamp: string;
  currentState: LiveMatchState;
  patterns: PatternMatch[];
  anomaly: AnomalyDetection;
  context: ContextEnrichment;
  projections: MatchProjection[];
  insights: HistoricalInsight[];
}

export interface MatchProjection {
  scenario: string;
  probability: number;
  projectedScore: { teamA: number; teamB: number };
  confidence: number;
  factors: string[];
}

export interface HistoricalInsight {
  id: string;
  type: 'pattern' | 'anomaly' | 'context' | 'projection';
  title: string;
  description: string;
  confidence: number;
  actionable: boolean;
  recommendation?: string;
}

// =============================================================================
// Historical Database (In-Memory Cache)
// =============================================================================

class HistoricalDatabase {
  private matches: Map<string, HistoricalMatch> = new Map();
  private patterns: Map<string, MatchPattern> = new Map();
  private teamStats: Map<string, TeamHistoricalStats> = new Map();
  
  constructor() {
    this.initializeDefaultPatterns();
    this.initializeMockData();
  }

  private initializeDefaultPatterns(): void {
    const patterns: MatchPattern[] = [
      {
        id: 'comeback_pattern',
        name: 'Comeback Pattern',
        description: 'Team overcomes significant deficit to win',
        type: 'comeback',
        criteria: {
          minRounds: 15,
          scoreDifferential: 5,
        },
      },
      {
        id: 'dominance_pattern',
        name: 'Dominance Pattern',
        description: 'One team maintains control throughout',
        type: 'dominance',
        criteria: {
          minRounds: 13,
          maxRounds: 24,
          scoreDifferential: 8,
        },
      },
      {
        id: 'back_and_forth',
        name: 'Back and Forth',
        description: 'Match alternates between teams',
        type: 'back_and_forth',
        criteria: {
          minRounds: 20,
          momentumThreshold: 0.3,
        },
      },
      {
        id: 'close_match',
        name: 'Close Match',
        description: 'Match decided by narrow margin',
        type: 'close_match',
        criteria: {
          minRounds: 24,
          scoreDifferential: 2,
        },
      },
    ];

    patterns.forEach(p => this.patterns.set(p.id, p));
  }

  private initializeMockData(): void {
    // Add some mock historical matches for demonstration
    const mockMatches: HistoricalMatch[] = [
      {
        id: 'hist_001',
        matchId: 'match_001',
        teams: {
          teamA: { id: 'team_a', name: 'Team Alpha', score: 13 },
          teamB: { id: 'team_b', name: 'Team Beta', score: 11 },
        },
        map: 'Haven',
        finalScore: { teamA: 13, teamB: 11 },
        rounds: this.generateMockRounds(13, 11),
        timestamp: '2026-01-15T10:00:00Z',
        tournament: 'VCT Masters',
        tags: ['close', 'competitive'],
      },
      {
        id: 'hist_002',
        matchId: 'match_002',
        teams: {
          teamA: { id: 'team_c', name: 'Team Gamma', score: 5 },
          teamB: { id: 'team_d', name: 'Team Delta', score: 13 },
        },
        map: 'Ascent',
        finalScore: { teamA: 5, teamB: 13 },
        rounds: this.generateMockRounds(5, 13),
        timestamp: '2026-01-20T14:00:00Z',
        tournament: 'VCT Challengers',
        tags: ['dominance'],
      },
      {
        id: 'hist_003',
        matchId: 'match_003',
        teams: {
          teamA: { id: 'team_a', name: 'Team Alpha', score: 14 },
          teamB: { id: 'team_c', name: 'Team Gamma', score: 12 },
        },
        map: 'Split',
        finalScore: { teamA: 14, teamB: 12 },
        rounds: this.generateMockRounds(14, 12),
        timestamp: '2026-02-01T16:00:00Z',
        tournament: 'VCT Masters',
        tags: ['overtime', 'close'],
      },
    ];

    mockMatches.forEach(m => this.matches.set(m.id, m));
  }

  private generateMockRounds(teamAScore: number, teamBScore: number): HistoricalRound[] {
    const rounds: HistoricalRound[] = [];
    let aWins = 0;
    let bWins = 0;
    
    for (let i = 1; i <= teamAScore + teamBScore; i++) {
      const teamAWins = aWins < teamAScore && (bWins >= teamBScore || Math.random() > 0.5);
      
      if (teamAWins) {
        aWins++;
      } else {
        bWins++;
      }
      
      rounds.push({
        round: i,
        winner: teamAWins ? 'team_a' : 'team_b',
        winCondition: Math.random() > 0.3 ? 'elimination' : 'spike_explode',
        teamAEconomy: 3000 + Math.random() * 2000,
        teamBEconomy: 3000 + Math.random() * 2000,
        duration: 60 + Math.random() * 60,
        firstBloodTeam: Math.random() > 0.5 ? 'team_a' : 'team_b',
      });
    }
    
    return rounds;
  }

  getMatch(id: string): HistoricalMatch | undefined {
    return this.matches.get(id);
  }

  getAllMatches(): HistoricalMatch[] {
    return Array.from(this.matches.values());
  }

  getMatchesByTeam(teamId: string): HistoricalMatch[] {
    return this.getAllMatches().filter(m => 
      m.teams.teamA.id === teamId || m.teams.teamB.id === teamId
    );
  }

  getMatchesByMap(map: string): HistoricalMatch[] {
    return this.getAllMatches().filter(m => m.map === map);
  }

  getPattern(id: string): MatchPattern | undefined {
    return this.patterns.get(id);
  }

  getAllPatterns(): MatchPattern[] {
    return Array.from(this.patterns.values());
  }

  addMatch(match: HistoricalMatch): void {
    this.matches.set(match.id, match);
  }
}

const historicalDB = new HistoricalDatabase();

// =============================================================================
// Pattern Matching
// =============================================================================

/**
 * Detect patterns in the current match state
 */
export function detectPatterns(
  match: LiveMatchState,
  analytics: LiveAnalytics
): PatternMatch[] {
  const patterns: PatternMatch[] = [];
  const allPatterns = historicalDB.getAllPatterns();

  for (const pattern of allPatterns) {
    const match_result = matchPattern(match, analytics, pattern);
    if (match_result.matches) {
      const historicalMatches = findSimilarHistoricalMatches(match, pattern);
      
      patterns.push({
        pattern,
        confidence: match_result.confidence,
        similarity: match_result.similarity,
        historicalMatches,
        predictions: generatePatternPredictions(pattern, historicalMatches, match),
      });
    }
  }

  // Sort by confidence
  return patterns.sort((a, b) => b.confidence - a.confidence);
}

function matchPattern(
  match: LiveMatchState,
  analytics: LiveAnalytics,
  pattern: MatchPattern
): { matches: boolean; confidence: number; similarity: number } {
  const criteria = pattern.criteria;
  const totalRounds = match.teamA.score + match.teamB.score;
  const scoreDiff = Math.abs(match.teamA.score - match.teamB.score);

  let matches = true;
  let confidence = 0;
  let checks = 0;

  // Check round count
  if (criteria.minRounds !== undefined) {
    checks++;
    if (totalRounds >= criteria.minRounds) confidence++;
    else matches = false;
  }

  if (criteria.maxRounds !== undefined) {
    checks++;
    if (totalRounds <= criteria.maxRounds) confidence++;
    else matches = false;
  }

  // Check score differential
  if (criteria.scoreDifferential !== undefined) {
    checks++;
    if (scoreDiff >= criteria.scoreDifferential) confidence++;
    // For comeback pattern, we need the losing team to be making progress
    if (pattern.type === 'comeback') {
      const recentMomentum = analytics.momentum.recentRounds.slice(-3);
      const recentWinsByTrailing = recentMomentum.filter(r => {
        const trailingTeam = match.teamA.score < match.teamB.score ? match.teamA.id : match.teamB.id;
        return r.winner === trailingTeam;
      }).length;
      if (recentWinsByTrailing >= 2) confidence += 0.5;
    }
  }

  // Check momentum
  if (criteria.momentumThreshold !== undefined) {
    checks++;
    if (analytics.momentum.strength >= criteria.momentumThreshold) confidence++;
  }

  // Calculate overall confidence
  const confidenceScore = checks > 0 ? confidence / checks : 0;
  const similarity = calculateStateSimilarity(match, pattern);

  return {
    matches: confidenceScore > 0.5,
    confidence: confidenceScore,
    similarity,
  };
}

function calculateStateSimilarity(match: LiveMatchState, pattern: MatchPattern): number {
  // Simplified similarity calculation
  const totalRounds = match.teamA.score + match.teamB.score;
  
  switch (pattern.type) {
    case 'comeback':
      // Higher similarity if score is close but one team was behind
      return totalRounds > 10 ? 0.7 : 0.3;
    case 'dominance':
      // Higher similarity if one team has significant lead
      return Math.abs(match.teamA.score - match.teamB.score) > 5 ? 0.8 : 0.2;
    case 'close_match':
      // Higher similarity if score is very close
      return Math.abs(match.teamA.score - match.teamB.score) <= 2 ? 0.8 : 0.2;
    default:
      return 0.5;
  }
}

function findSimilarHistoricalMatches(
  currentMatch: LiveMatchState,
  pattern: MatchPattern
): HistoricalMatch[] {
  const matches = historicalDB.getMatchesByMap(currentMatch.map);
  
  return matches.filter(m => {
    const finalDiff = Math.abs(m.finalScore.teamA - m.finalScore.teamB);
    
    switch (pattern.type) {
      case 'comeback':
        return finalDiff <= 3 && m.rounds.length >= 20;
      case 'dominance':
        return finalDiff >= 5;
      case 'close_match':
        return finalDiff <= 2;
      default:
        return true;
    }
  }).slice(0, 5);
}

function generatePatternPredictions(
  pattern: MatchPattern,
  historicalMatches: HistoricalMatch[],
  currentMatch: LiveMatchState
): PatternPrediction[] {
  const predictions: PatternPrediction[] = [];

  if (historicalMatches.length === 0) {
    return predictions;
  }

  // Calculate outcome probabilities from historical matches
  const teamAWins = historicalMatches.filter(m => 
    m.finalScore.teamA > m.finalScore.teamB
  ).length;
  
  const teamBWins = historicalMatches.filter(m => 
    m.finalScore.teamB > m.finalScore.teamA
  ).length;

  const total = teamAWins + teamBWins;
  
  if (total > 0) {
    const teamAProb = teamAWins / total;
    const teamBProb = teamBWins / total;
    
    if (teamAProb > 0.5) {
      predictions.push({
        outcome: `${currentMatch.teamA.name} wins`,
        probability: teamAProb,
        confidence: 0.6 + (teamAProb - 0.5),
        reasoning: [`Historical ${pattern.name} matches favor ${currentMatch.teamA.name}`],
      });
    } else {
      predictions.push({
        outcome: `${currentMatch.teamB.name} wins`,
        probability: teamBProb,
        confidence: 0.6 + (teamBProb - 0.5),
        reasoning: [`Historical ${pattern.name} matches favor ${currentMatch.teamB.name}`],
      });
    }
  }

  return predictions;
}

// =============================================================================
// Anomaly Detection
// =============================================================================

/**
 * Detect anomalies in current match state
 */
export function detectAnomalies(
  match: LiveMatchState,
  analytics: LiveAnalytics
): AnomalyDetection {
  const anomalies: Anomaly[] = [];

  // Check for statistical anomalies
  anomalies.push(...detectStatisticalAnomalies(match, analytics));
  
  // Check for temporal anomalies
  anomalies.push(...detectTemporalAnomalies(match));
  
  // Check for behavioral anomalies
  anomalies.push(...detectBehavioralAnomalies(match, analytics));

  // Calculate overall anomaly score
  const anomalyScore = calculateAnomalyScore(anomalies);
  const isAnomaly = anomalyScore > 0.6;

  return {
    isAnomaly,
    anomalyScore,
    anomalies,
    explanation: generateAnomalyExplanation(anomalies, isAnomaly),
  };
}

function detectStatisticalAnomalies(match: LiveMatchState, analytics: LiveAnalytics): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Check win probability confidence
  if (analytics.winProbability.confidence < 0.4) {
    anomalies.push({
      type: 'statistical',
      field: 'winProbability.confidence',
      expectedValue: 0.7,
      actualValue: analytics.winProbability.confidence,
      severity: 'medium',
      description: 'Unusually low prediction confidence - match is unpredictable',
    });
  }

  // Check for extreme momentum
  if (analytics.momentum.strength > 0.9) {
    anomalies.push({
      type: 'statistical',
      field: 'momentum.strength',
      expectedValue: 0.5,
      actualValue: analytics.momentum.strength,
      severity: 'low',
      description: 'Exceptionally strong momentum detected',
    });
  }

  // Check economy disparity
  const maxEconomy = Math.max(analytics.economy.teamA.totalCredits, analytics.economy.teamB.totalCredits);
  const minEconomy = Math.min(analytics.economy.teamA.totalCredits, analytics.economy.teamB.totalCredits);
  
  if (maxEconomy > 0 && minEconomy / maxEconomy < 0.3) {
    anomalies.push({
      type: 'statistical',
      field: 'economy.disparity',
      expectedValue: 0.8,
      actualValue: minEconomy / maxEconomy,
      severity: 'high',
      description: 'Extreme economic disparity between teams',
    });
  }

  return anomalies;
}

function detectTemporalAnomalies(match: LiveMatchState): Anomaly[] {
  const anomalies: Anomaly[] = [];
  
  // Check for unusual round durations or timing patterns
  // This would require round duration data
  
  return anomalies;
}

function detectBehavioralAnomalies(match: LiveMatchState, analytics: LiveAnalytics): Anomaly[] {
  const anomalies: Anomaly[] = [];

  // Check for player performance anomalies
  for (const player of [...match.teamA.players, ...match.teamB.players]) {
    // Very high ACS
    if (player.acs > 400) {
      anomalies.push({
        type: 'behavioral',
        field: `player.${player.name}.acs`,
        expectedValue: 220,
        actualValue: player.acs,
        severity: 'medium',
        description: `${player.name} is performing exceptionally well`,
      });
    }
    
    // Very low performance
    if (match.currentRound > 5 && player.acs < 100 && player.kills === 0) {
      anomalies.push({
        type: 'behavioral',
        field: `player.${player.name}.performance`,
        expectedValue: 150,
        actualValue: player.acs,
        severity: 'medium',
        description: `${player.name} is significantly underperforming`,
      });
    }
  }

  return anomalies;
}

function calculateAnomalyScore(anomalies: Anomaly[]): number {
  if (anomalies.length === 0) return 0;
  
  const severityWeights = { low: 0.3, medium: 0.6, high: 1.0 };
  const totalWeight = anomalies.reduce((sum, a) => sum + severityWeights[a.severity], 0);
  
  return Math.min(1, totalWeight / 3);
}

function generateAnomalyExplanation(anomalies: Anomaly[], isAnomaly: boolean): string {
  if (!isAnomaly) {
    return 'Match is progressing within expected parameters.';
  }

  const highSeverity = anomalies.filter(a => a.severity === 'high');
  if (highSeverity.length > 0) {
    return `Significant anomalies detected: ${highSeverity.map(a => a.description).join(', ')}`;
  }

  return `Some unusual patterns detected: ${anomalies.slice(0, 2).map(a => a.description).join(', ')}`;
}

// =============================================================================
// Context Enrichment
// =============================================================================

/**
 * Enrich match data with historical context
 */
export function enrichContext(
  match: LiveMatchState,
  analytics: LiveAnalytics
): ContextEnrichment {
  return {
    similarMatches: findSimilarMatches(match),
    teamHistory: getTeamHistory(match),
    playerContext: getPlayerContext(match),
    mapContext: getMapContext(match),
    tournamentContext: match.tournament ? getTournamentContext(match) : undefined,
  };
}

function findSimilarMatches(match: LiveMatchState): SimilarMatch[] {
  const historical = historicalDB.getMatchesByMap(match.map);
  
  return historical
    .map(hm => {
      const atRound = match.teamA.score + match.teamB.score;
      const similarity = calculateMatchSimilarity(match, hm);
      
      return {
        historicalMatch: hm,
        similarity,
        atRound,
        currentScore: { teamA: match.teamA.score, teamB: match.teamB.score },
        finalScore: hm.finalScore,
        outcome: hm.finalScore.teamA > hm.finalScore.teamB ? 'team_a' : 'team_b',
      };
    })
    .filter(sm => sm.similarity > 0.5)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 5);
}

function calculateMatchSimilarity(current: LiveMatchState, historical: HistoricalMatch): number {
  let similarity = 0;
  let factors = 0;
  
  // Map similarity
  if (current.map === historical.map) {
    similarity += 1;
    factors++;
  }
  
  // Score similarity
  const currentDiff = Math.abs(current.teamA.score - current.teamB.score);
  const historicalDiff = Math.abs(historical.finalScore.teamA - historical.finalScore.teamB);
  const diffSimilarity = 1 - Math.abs(currentDiff - historicalDiff) / 10;
  similarity += Math.max(0, diffSimilarity);
  factors++;
  
  return factors > 0 ? similarity / factors : 0;
}

function getTeamHistory(match: LiveMatchState): TeamHistory {
  const teamAStats = calculateTeamStats(match.teamA.id);
  const teamBStats = calculateTeamStats(match.teamB.id);
  
  return {
    teamA: teamAStats,
    teamB: teamBStats,
    h2h: calculateH2H(match.teamA.id, match.teamB.id),
  };
}

function calculateTeamStats(teamId: string): TeamHistoricalStats {
  const matches = historicalDB.getMatchesByTeam(teamId);
  
  const wins = matches.filter(m => {
    const isTeamA = m.teams.teamA.id === teamId;
    return isTeamA ? m.finalScore.teamA > m.finalScore.teamB : m.finalScore.teamB > m.finalScore.teamA;
  }).length;
  
  const mapWinRates: Record<string, number> = {};
  matches.forEach(m => {
    if (!mapWinRates[m.map]) mapWinRates[m.map] = 0;
    const isTeamA = m.teams.teamA.id === teamId;
    const won = isTeamA ? m.finalScore.teamA > m.finalScore.teamB : m.finalScore.teamB > m.finalScore.teamA;
    if (won) mapWinRates[m.map]++;
  });
  
  // Normalize map win rates
  Object.keys(mapWinRates).forEach(map => {
    const mapMatches = matches.filter(m => m.map === map).length;
    mapWinRates[map] = mapMatches > 0 ? mapWinRates[map] / mapMatches : 0;
  });
  
  return {
    matchesPlayed: matches.length,
    wins,
    losses: matches.length - wins,
    winRate: matches.length > 0 ? wins / matches.length : 0,
    averageScore: matches.length > 0 
      ? matches.reduce((sum, m) => {
          const isTeamA = m.teams.teamA.id === teamId;
          return sum + (isTeamA ? m.finalScore.teamA : m.finalScore.teamB);
        }, 0) / matches.length 
      : 0,
    mapWinRates,
    recentForm: matches.slice(-5).map(m => {
      const isTeamA = m.teams.teamA.id === teamId;
      return isTeamA 
        ? (m.finalScore.teamA > m.finalScore.teamB ? 'W' : 'L')
        : (m.finalScore.teamB > m.finalScore.teamA ? 'W' : 'L');
    }) as ('W' | 'L')[],
  };
}

function calculateH2H(teamAId: string, teamBId: string): HeadToHeadStats {
  const teamAMatches = historicalDB.getMatchesByTeam(teamAId);
  const h2hMatches = teamAMatches.filter(m => 
    m.teams.teamA.id === teamBId || m.teams.teamB.id === teamBId
  );
  
  const teamAWins = h2hMatches.filter(m => {
    const isTeamA = m.teams.teamA.id === teamAId;
    return isTeamA ? m.finalScore.teamA > m.finalScore.teamB : m.finalScore.teamB > m.finalScore.teamA;
  }).length;
  
  const scoreDiffs = h2hMatches.map(m => {
    const isTeamA = m.teams.teamA.id === teamAId;
    const teamAScore = isTeamA ? m.finalScore.teamA : m.finalScore.teamB;
    const teamBScore = isTeamA ? m.finalScore.teamB : m.finalScore.teamA;
    return teamAScore - teamBScore;
  });
  
  return {
    matchesPlayed: h2hMatches.length,
    teamAWins,
    teamBWins: h2hMatches.length - teamAWins,
    lastMatch: h2hMatches.length > 0 ? h2hMatches[h2hMatches.length - 1] : undefined,
    averageScoreDiff: scoreDiffs.length > 0 
      ? scoreDiffs.reduce((a, b) => a + b, 0) / scoreDiffs.length 
      : 0,
  };
}

function getPlayerContext(match: LiveMatchState): PlayerContext[] {
  // Simplified - would pull from player database
  return [...match.teamA.players, ...match.teamB.players].map(p => ({
    playerId: p.id,
    playerName: p.name,
    historicalAverage: {
      matches: 50,
      avgACS: 210,
      avgADR: 145,
      avgKills: 15,
      avgDeaths: 14,
      consistency: 0.75,
    },
    currentVsAverage: {
      acs: (p.acs - 210) / 210,
      adr: (p.adr - 145) / 145,
      kills: 0,
      performance: p.acs > 230 ? 'better' : p.acs < 190 ? 'worse' : 'similar',
    },
    trend: p.acs > 250 ? 'above_average' : p.acs < 170 ? 'below_average' : 'average',
  }));
}

function getMapContext(match: LiveMatchState): MapContext {
  const mapMatches = historicalDB.getMatchesByMap(match.map);
  
  // Calculate side win rates (simplified)
  const attackWins = mapMatches.filter(m => 
    m.rounds.filter(r => r.round <= 12 && r.winner === 'team_a').length > 6
  ).length;
  
  return {
    map: match.map,
    totalMatches: mapMatches.length,
    averageRounds: mapMatches.length > 0 
      ? mapMatches.reduce((sum, m) => sum + m.rounds.length, 0) / mapMatches.length 
      : 24,
    sideWinRates: {
      attack: mapMatches.length > 0 ? attackWins / mapMatches.length : 0.5,
      defense: mapMatches.length > 0 ? 1 - (attackWins / mapMatches.length) : 0.5,
    },
    commonStrategies: ['Default', 'Fast A', 'Slow execute'],
  };
}

function getTournamentContext(match: LiveMatchState): TournamentContext {
  return {
    tournament: match.tournament?.name || 'Unknown',
    stage: match.tournament?.stage || 'Group Stage',
    stakes: 'high',
    elimination: false,
  };
}

// =============================================================================
// Match Projections
// =============================================================================

/**
 * Generate match outcome projections
 */
export function generateProjections(
  match: LiveMatchState,
  analytics: LiveAnalytics,
  patterns: PatternMatch[]
): MatchProjection[] {
  const projections: MatchProjection[] = [];

  // Most likely scenario
  const winProb = analytics.winProbability;
  const favoredTeam = winProb.teamA > winProb.teamB ? match.teamA : match.teamB;
  const winProbability = Math.max(winProb.teamA, winProb.teamB);
  
  projections.push({
    scenario: 'Most Likely',
    probability: winProbability,
    projectedScore: {
      teamA: winProb.teamA > winProb.teamB ? 13 : 10,
      teamB: winProb.teamB > winProb.teamA ? 13 : 10,
    },
    confidence: winProb.confidence,
    factors: ['Current win probability', 'Team performance', 'Economic state'],
  });

  // Close match scenario
  projections.push({
    scenario: 'Close Match',
    probability: 0.25,
    projectedScore: { teamA: 13, teamB: 11 },
    confidence: 0.5,
    factors: ['Evenly matched teams', 'Historical data suggests close games'],
  });

  // Upset scenario (if underdog has momentum)
  if (analytics.momentum.direction === 'teamB' && winProb.teamB < 0.5) {
    projections.push({
      scenario: 'Upset',
      probability: 0.15,
      projectedScore: { teamA: 10, teamB: 13 },
      confidence: analytics.momentum.strength * winProb.confidence,
      factors: ['Momentum shift detected', 'Underdog gaining confidence'],
    });
  }

  // Pattern-based projection
  if (patterns.length > 0 && patterns[0].predictions.length > 0) {
    const topPattern = patterns[0];
    const prediction = topPattern.predictions[0];
    
    projections.push({
      scenario: `Pattern: ${topPattern.pattern.name}`,
      probability: prediction.probability,
      projectedScore: prediction.outcome.includes(match.teamA.name) 
        ? { teamA: 13, teamB: 10 }
        : { teamA: 10, teamB: 13 },
      confidence: prediction.confidence,
      factors: prediction.reasoning,
    });
  }

  return projections.sort((a, b) => b.probability - a.probability);
}

// =============================================================================
// Main Historical Comparison
// =============================================================================

/**
 * Perform complete historical comparison analysis
 */
export function performHistoricalComparison(
  match: LiveMatchState,
  analytics: LiveAnalytics
): HistoricalComparison {
  const patterns = detectPatterns(match, analytics);
  const anomaly = detectAnomalies(match, analytics);
  const context = enrichContext(match, analytics);
  const projections = generateProjections(match, analytics, patterns);
  
  // Generate insights
  const insights: HistoricalInsight[] = [];
  
  // Pattern insights
  patterns.slice(0, 2).forEach(p => {
    insights.push({
      id: `pattern_${p.pattern.id}`,
      type: 'pattern',
      title: `${p.pattern.name} Detected`,
      description: p.pattern.description,
      confidence: p.confidence,
      actionable: true,
      recommendation: p.predictions[0]?.reasoning[0],
    });
  });
  
  // Anomaly insights
  if (anomaly.isAnomaly) {
    insights.push({
      id: 'anomaly_main',
      type: 'anomaly',
      title: 'Anomalies Detected',
      description: anomaly.explanation,
      confidence: anomaly.anomalyScore,
      actionable: anomaly.anomalies.some(a => a.severity === 'high'),
    });
  }
  
  // Context insights
  if (context.similarMatches.length > 0) {
    const topSimilar = context.similarMatches[0];
    insights.push({
      id: 'context_similar',
      type: 'context',
      title: 'Similar Match Found',
      description: `This match is ${Math.round(topSimilar.similarity * 100)}% similar to a previous ${topSimilar.historicalMatch.tournament} match`,
      confidence: topSimilar.similarity,
      actionable: false,
    });
  }
  
  // Projection insights
  projections.slice(0, 2).forEach(p => {
    insights.push({
      id: `proj_${p.scenario}`,
      type: 'projection',
      title: `${p.scenario}: ${p.projectedScore.teamA}-${p.projectedScore.teamB}`,
      description: `Based on ${p.factors.join(', ')}`,
      confidence: p.confidence,
      actionable: true,
    });
  });

  return {
    matchId: match.matchId,
    timestamp: new Date().toISOString(),
    currentState: match,
    patterns,
    anomaly,
    context,
    projections,
    insights: insights.sort((a, b) => b.confidence - a.confidence),
  };
}

// =============================================================================
// Exports
// =============================================================================

export default {
  detectPatterns,
  detectAnomalies,
  enrichContext,
  generateProjections,
  performHistoricalComparison,
};
