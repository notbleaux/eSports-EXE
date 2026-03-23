/**
 * Real-time Analytics Tests
 * 
 * Comprehensive test suite for real-time analytics module.
 * Tests metrics calculation, alerts, historical comparison, and integrations.
 * 
 * [Ver001.000] - Analytics test suite
 * 
 * Agent: TL-S4-3-C
 * Team: Real-time Analytics (TL-S4)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { LiveMatchState, LiveEvent, LivePlayerState } from '../../types';
import {
  // Metrics
  calculateWinProbability,
  calculateEconomyMetrics,
  calculatePerformanceRatings,
  calculateMomentum,
  calculateLiveAnalytics,
  detectKeyMoments,
  generatePredictions,
  formatProbability,
  formatEconomy,
  getProbabilityColor,
  getMomentumColor,
  DEFAULT_METRICS_CONFIG,
  // Alerts
  AlertManager,
  createAlertManager,
  getAlertColor,
  getAlertIcon,
  formatAlertTime,
  DEFAULT_ALERT_CONFIG,
  // Historical
  detectPatterns,
  detectAnomalies,
  enrichContext,
  generateProjections,
  performHistoricalComparison,
} from '../';

// =============================================================================
// Test Fixtures
// =============================================================================

const createMockPlayer = (
  id: string,
  name: string,
  teamId: string,
  overrides: Partial<LivePlayerState> = {}
): LivePlayerState => ({
  id,
  name,
  tag: name,
  agent: 'Jett',
  teamId,
  alive: true,
  connected: true,
  kills: 10,
  deaths: 8,
  assists: 4,
  acs: 220,
  adr: 145,
  firstBloods: 2,
  plants: 1,
  defuses: 0,
  clutchWins: 0,
  credits: 4000,
  loadoutValue: 3500,
  abilities: [],
  ...overrides,
});

const createMockMatch = (overrides: Partial<LiveMatchState> = {}): LiveMatchState => ({
  matchId: 'test_match_001',
  status: 'live',
  map: 'Haven',
  gameMode: 'competitive',
  teamA: {
    id: 'team_a',
    name: 'Team Alpha',
    tag: 'ALP',
    score: 8,
    roundsWon: [1, 3, 5, 7, 9, 11, 13, 15],
    side: 'attack',
    players: [
      createMockPlayer('p1', 'Player1', 'team_a', { kills: 12, acs: 245 }),
      createMockPlayer('p2', 'Player2', 'team_a', { kills: 10, acs: 210 }),
      createMockPlayer('p3', 'Player3', 'team_a', { kills: 9, acs: 195 }),
      createMockPlayer('p4', 'Player4', 'team_a', { kills: 11, acs: 225 }),
      createMockPlayer('p5', 'Player5', 'team_a', { kills: 8, acs: 180 }),
    ],
    timeoutsRemaining: 2,
    totalCredits: 18000,
  },
  teamB: {
    id: 'team_b',
    name: 'Team Beta',
    tag: 'BET',
    score: 6,
    roundsWon: [2, 4, 6, 8, 10, 12],
    side: 'defense',
    players: [
      createMockPlayer('p6', 'Player6', 'team_b', { kills: 9, acs: 190 }),
      createMockPlayer('p7', 'Player7', 'team_b', { kills: 7, acs: 165 }),
      createMockPlayer('p8', 'Player8', 'team_b', { kills: 10, acs: 205 }),
      createMockPlayer('p9', 'Player9', 'team_b', { kills: 6, acs: 150 }),
      createMockPlayer('p10', 'Player10', 'team_b', { kills: 8, acs: 175 }),
    ],
    timeoutsRemaining: 2,
    totalCredits: 12000,
  },
  score: {
    teamAId: 'team_a',
    teamBId: 'team_b',
    teamAScore: 8,
    teamBScore: 6,
    teamARoundsWon: [1, 3, 5, 7, 9, 11, 13, 15],
    teamBRoundsWon: [2, 4, 6, 8, 10, 12],
    currentHalf: 2,
  },
  currentRound: 15,
  roundPhase: 'buy',
  roundTimeRemaining: 30,
  events: [],
  startTime: '2026-03-23T10:00:00Z',
  lastUpdateTime: '2026-03-23T10:30:00Z',
  ...overrides,
});

// =============================================================================
// Metrics Tests
// =============================================================================

describe('Metrics', () => {
  describe('calculateWinProbability', () => {
    it('should calculate win probability for both teams', () => {
      const match = createMockMatch();
      const result = calculateWinProbability(match);

      expect(result.teamA).toBeGreaterThan(0);
      expect(result.teamB).toBeGreaterThan(0);
      expect(result.teamA + result.teamB).toBeCloseTo(1, 5);
      expect(result.confidence).toBeGreaterThan(0);
      expect(result.confidence).toBeLessThanOrEqual(1);
    });

    it('should favor team with higher score', () => {
      const match = createMockMatch({
        teamA: { ...createMockMatch().teamA, score: 12 },
        teamB: { ...createMockMatch().teamB, score: 3 },
      });
      const result = calculateWinProbability(match);

      expect(result.teamA).toBeGreaterThan(result.teamB);
    });

    it('should include probability factors', () => {
      const match = createMockMatch();
      const result = calculateWinProbability(match);

      expect(result.factors).toBeDefined();
      expect(result.factors.length).toBeGreaterThan(0);
      expect(result.factors[0]).toHaveProperty('name');
      expect(result.factors[0]).toHaveProperty('weight');
      expect(result.factors[0]).toHaveProperty('impact');
    });

    it('should clamp probabilities to valid range', () => {
      const match = createMockMatch({
        teamA: { ...createMockMatch().teamA, score: 12 },
        teamB: { ...createMockMatch().teamB, score: 0 },
      });
      const result = calculateWinProbability(match);

      expect(result.teamA).toBeLessThanOrEqual(0.95);
      expect(result.teamB).toBeGreaterThanOrEqual(0.05);
    });

    it('should handle early match state', () => {
      const match = createMockMatch({
        currentRound: 2,
        teamA: { ...createMockMatch().teamA, score: 1 },
        teamB: { ...createMockMatch().teamB, score: 1 },
      });
      const result = calculateWinProbability(match);

      expect(result.confidence).toBeLessThan(0.7);
    });
  });

  describe('calculateEconomyMetrics', () => {
    it('should calculate economy for both teams', () => {
      const match = createMockMatch();
      const result = calculateEconomyMetrics(match);

      expect(result.teamA).toBeDefined();
      expect(result.teamB).toBeDefined();
      expect(result.teamA.totalCredits).toBeGreaterThan(0);
      expect(result.teamB.totalCredits).toBeGreaterThan(0);
    });

    it('should calculate economy advantage', () => {
      const match = createMockMatch();
      const result = calculateEconomyMetrics(match);

      expect(result.advantage).toBeDefined();
      expect(typeof result.advantage).toBe('number');
    });

    it('should determine buy types', () => {
      const match = createMockMatch();
      const result = calculateEconomyMetrics(match);

      expect(['eco', 'force', 'full', 'over', 'mixed']).toContain(result.teamA.buyType);
      expect(['eco', 'force', 'full', 'over', 'mixed']).toContain(result.teamB.buyType);
    });

    it('should calculate loss bonus', () => {
      const match = createMockMatch();
      const result = calculateEconomyMetrics(match);

      expect(result.teamA.lossBonus).toBeGreaterThanOrEqual(1900);
      expect(result.teamA.lossBonus).toBeLessThanOrEqual(2900);
    });

    it('should project economic winner', () => {
      const match = createMockMatch();
      const result = calculateEconomyMetrics(match);

      // Team A has more credits and score
      expect(result.projectedWinner).toBe('team_a');
    });
  });

  describe('calculatePerformanceRatings', () => {
    it('should calculate ratings for all players', () => {
      const match = createMockMatch();
      const result = calculatePerformanceRatings(match);

      expect(result.teamA.players).toHaveLength(5);
      expect(result.teamB.players).toHaveLength(5);
      result.teamA.players.forEach(p => {
        expect(p.rating).toBeGreaterThanOrEqual(0);
        expect(p.rating).toBeLessThanOrEqual(100);
      });
    });

    it('should calculate team overall rating', () => {
      const match = createMockMatch();
      const result = calculatePerformanceRatings(match);

      expect(result.teamA.overallRating).toBeGreaterThan(0);
      expect(result.teamB.overallRating).toBeGreaterThan(0);
    });

    it('should identify team strengths', () => {
      const match = createMockMatch();
      const result = calculatePerformanceRatings(match);

      expect(Array.isArray(result.teamA.strengths)).toBe(true);
      expect(Array.isArray(result.teamA.weaknesses)).toBe(true);
    });

    it('should include player trend', () => {
      const match = createMockMatch();
      const result = calculatePerformanceRatings(match);

      result.teamA.players.forEach(p => {
        expect(['rising', 'stable', 'falling']).toContain(p.trend);
      });
    });
  });

  describe('calculateMomentum', () => {
    it('should calculate momentum direction', () => {
      const match = createMockMatch();
      const result = calculateMomentum(match);

      expect(['teamA', 'teamB', 'neutral']).toContain(result.direction);
    });

    it('should calculate momentum strength', () => {
      const match = createMockMatch();
      const result = calculateMomentum(match);

      expect(result.strength).toBeGreaterThanOrEqual(0);
      expect(result.strength).toBeLessThanOrEqual(1);
    });

    it('should track recent rounds', () => {
      const match = createMockMatch();
      const result = calculateMomentum(match);

      expect(Array.isArray(result.recentRounds)).toBe(true);
    });

    it('should include momentum factors', () => {
      const match = createMockMatch();
      const result = calculateMomentum(match);

      expect(Array.isArray(result.factors)).toBe(true);
      expect(result.factors.length).toBeGreaterThan(0);
    });

    it('should calculate streak', () => {
      const match = createMockMatch();
      const result = calculateMomentum(match);

      expect(typeof result.streak).toBe('number');
    });
  });

  describe('calculateLiveAnalytics', () => {
    it('should calculate complete analytics', () => {
      const match = createMockMatch();
      const result = calculateLiveAnalytics(match);

      expect(result.matchId).toBe(match.matchId);
      expect(result.winProbability).toBeDefined();
      expect(result.economy).toBeDefined();
      expect(result.teamA).toBeDefined();
      expect(result.teamB).toBeDefined();
      expect(result.momentum).toBeDefined();
      expect(Array.isArray(result.keyMoments)).toBe(true);
      expect(Array.isArray(result.predictions)).toBe(true);
    });

    it('should include timestamp', () => {
      const match = createMockMatch();
      const result = calculateLiveAnalytics(match);

      expect(result.timestamp).toBeDefined();
      expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });
  });

  describe('Utility Functions', () => {
    describe('formatProbability', () => {
      it('should format probability as percentage', () => {
        expect(formatProbability(0.75)).toBe('75%');
        expect(formatProbability(0.123)).toBe('12%');
        expect(formatProbability(1)).toBe('100%');
      });
    });

    describe('formatEconomy', () => {
      it('should format large numbers with k suffix', () => {
        expect(formatEconomy(1500)).toBe('1.5k');
        expect(formatEconomy(25000)).toBe('25.0k');
        expect(formatEconomy(900)).toBe('900');
      });
    });

    describe('getProbabilityColor', () => {
      it('should return appropriate colors', () => {
        expect(getProbabilityColor(0.8)).toBe('#22c55e');
        expect(getProbabilityColor(0.6)).toBe('#eab308');
        expect(getProbabilityColor(0.4)).toBe('#f97316');
        expect(getProbabilityColor(0.2)).toBe('#ef4444');
      });
    });

    describe('getMomentumColor', () => {
      it('should return team colors', () => {
        expect(getMomentumColor('teamA')).toBe('#3b82f6');
        expect(getMomentumColor('teamB')).toBe('#ef4444');
        expect(getMomentumColor('neutral')).toBe('#9ca3af');
      });
    });
  });
});

// =============================================================================
// Alert Tests
// =============================================================================

describe('Alerts', () => {
  let alertManager: AlertManager;

  beforeEach(() => {
    alertManager = createAlertManager();
  });

  describe('AlertManager', () => {
    it('should create alert manager with default config', () => {
      const manager = createAlertManager();
      expect(manager).toBeInstanceOf(AlertManager);
      expect(manager.getConfig()).toBeDefined();
    });

    it('should add custom threshold', () => {
      alertManager.addThreshold({
        id: 'test_threshold',
        category: 'probability',
        metric: 'winProbability',
        operator: 'gt',
        value: 0.9,
        severity: 'info',
        message: 'Test message',
        enabled: true,
        cooldown: 1000,
      });

      const config = alertManager.getConfig();
      expect(config.thresholds.some(t => t.id === 'test_threshold')).toBe(true);
    });

    it('should enable/disable thresholds', () => {
      alertManager.setThresholdEnabled('prob_major_shift', false);
      const config = alertManager.getConfig();
      const threshold = config.thresholds.find(t => t.id === 'prob_major_shift');
      expect(threshold?.enabled).toBe(false);
    });

    it('should track alert statistics', () => {
      const stats = alertManager.getStats();
      expect(stats.total).toBe(0);
      expect(stats.unacknowledged).toBe(0);
      expect(stats.criticalUnacknowledged).toBe(0);
    });
  });

  describe('Alert Utilities', () => {
    describe('getAlertColor', () => {
      it('should return correct severity colors', () => {
        expect(getAlertColor('critical')).toBe('#dc2626');
        expect(getAlertColor('warning')).toBe('#f59e0b');
        expect(getAlertColor('info')).toBe('#3b82f6');
        expect(getAlertColor('success')).toBe('#22c55e');
      });
    });

    describe('getAlertIcon', () => {
      it('should return icon names for categories', () => {
        expect(getAlertIcon('probability')).toBe('percent');
        expect(getAlertIcon('momentum')).toBe('trending-up');
        expect(getAlertIcon('economy')).toBe('wallet');
        expect(getAlertIcon('performance')).toBe('activity');
        expect(getAlertIcon('event')).toBe('zap');
        expect(getAlertIcon('prediction')).toBe('target');
      });
    });

    describe('formatAlertTime', () => {
      it('should format recent times', () => {
        const now = new Date();
        expect(formatAlertTime(now.toISOString())).toBe('Just now');
      });
    });
  });
});

// =============================================================================
// Historical Tests
// =============================================================================

describe('Historical', () => {
  describe('detectPatterns', () => {
    it('should detect patterns in match state', () => {
      const match = createMockMatch();
      const analytics = calculateLiveAnalytics(match);
      const patterns = detectPatterns(match, analytics);

      expect(Array.isArray(patterns)).toBe(true);
    });

    it('should include pattern predictions', () => {
      const match = createMockMatch();
      const analytics = calculateLiveAnalytics(match);
      const patterns = detectPatterns(match, analytics);

      patterns.forEach(p => {
        expect(p.pattern).toBeDefined();
        expect(typeof p.confidence).toBe('number');
        expect(Array.isArray(p.predictions)).toBe(true);
      });
    });
  });

  describe('detectAnomalies', () => {
    it('should detect anomalies in match data', () => {
      const match = createMockMatch();
      const analytics = calculateLiveAnalytics(match);
      const result = detectAnomalies(match, analytics);

      expect(typeof result.isAnomaly).toBe('boolean');
      expect(typeof result.anomalyScore).toBe('number');
      expect(Array.isArray(result.anomalies)).toBe(true);
      expect(result.explanation).toBeDefined();
    });

    it('should detect statistical anomalies', () => {
      const match = createMockMatch({
        teamA: { ...createMockMatch().teamA, totalCredits: 50000 },
        teamB: { ...createMockMatch().teamB, totalCredits: 5000 },
      });
      const analytics = calculateLiveAnalytics(match);
      const result = detectAnomalies(match, analytics);

      expect(result.anomalies.length).toBeGreaterThan(0);
    });
  });

  describe('enrichContext', () => {
    it('should enrich match with historical context', () => {
      const match = createMockMatch();
      const analytics = calculateLiveAnalytics(match);
      const context = enrichContext(match, analytics);

      expect(Array.isArray(context.similarMatches)).toBe(true);
      expect(context.teamHistory).toBeDefined();
      expect(context.mapContext).toBeDefined();
    });

    it('should include team history', () => {
      const match = createMockMatch();
      const analytics = calculateLiveAnalytics(match);
      const context = enrichContext(match, analytics);

      expect(context.teamHistory.teamA).toBeDefined();
      expect(context.teamHistory.teamB).toBeDefined();
      expect(context.teamHistory.h2h).toBeDefined();
    });
  });

  describe('generateProjections', () => {
    it('should generate match projections', () => {
      const match = createMockMatch();
      const analytics = calculateLiveAnalytics(match);
      const patterns = detectPatterns(match, analytics);
      const projections = generateProjections(match, analytics, patterns);

      expect(Array.isArray(projections)).toBe(true);
      expect(projections.length).toBeGreaterThan(0);
      
      projections.forEach(p => {
        expect(p.scenario).toBeDefined();
        expect(typeof p.probability).toBe('number');
        expect(p.projectedScore).toBeDefined();
      });
    });

    it('should include most likely scenario', () => {
      const match = createMockMatch();
      const analytics = calculateLiveAnalytics(match);
      const patterns = detectPatterns(match, analytics);
      const projections = generateProjections(match, analytics, patterns);

      const mostLikely = projections.find(p => p.scenario === 'Most Likely');
      expect(mostLikely).toBeDefined();
    });
  });

  describe('performHistoricalComparison', () => {
    it('should perform complete historical analysis', () => {
      const match = createMockMatch();
      const analytics = calculateLiveAnalytics(match);
      const result = performHistoricalComparison(match, analytics);

      expect(result.matchId).toBe(match.matchId);
      expect(Array.isArray(result.patterns)).toBe(true);
      expect(result.anomaly).toBeDefined();
      expect(result.context).toBeDefined();
      expect(Array.isArray(result.projections)).toBe(true);
      expect(Array.isArray(result.insights)).toBe(true);
    });

    it('should generate insights', () => {
      const match = createMockMatch();
      const analytics = calculateLiveAnalytics(match);
      const result = performHistoricalComparison(match, analytics);

      result.insights.forEach(insight => {
        expect(insight.id).toBeDefined();
        expect(insight.title).toBeDefined();
        expect(insight.description).toBeDefined();
        expect(typeof insight.confidence).toBe('number');
      });
    });
  });
});

// =============================================================================
// Integration Tests
// =============================================================================

describe('Integration', () => {
  it('should integrate metrics, alerts, and historical analysis', () => {
    const match = createMockMatch();
    
    // Calculate analytics
    const analytics = calculateLiveAnalytics(match);
    expect(analytics).toBeDefined();
    
    // Process through alert manager
    const alertManager = createAlertManager();
    const alerts = alertManager.processAnalytics(match.matchId, analytics);
    expect(Array.isArray(alerts)).toBe(true);
    
    // Perform historical comparison
    const historical = performHistoricalComparison(match, analytics);
    expect(historical).toBeDefined();
    expect(historical.insights.length).toBeGreaterThan(0);
  });

  it('should handle edge cases gracefully', () => {
    // Empty match
    const emptyMatch = createMockMatch({
      teamA: { ...createMockMatch().teamA, score: 0, players: [] },
      teamB: { ...createMockMatch().teamB, score: 0, players: [] },
      currentRound: 0,
    });
    
    const analytics = calculateLiveAnalytics(emptyMatch);
    expect(analytics.winProbability.teamA).toBeCloseTo(0.5, 1);
    expect(analytics.winProbability.confidence).toBeLessThan(0.5);
  });

  it('should update in real-time', () => {
    const match = createMockMatch();
    const analytics1 = calculateLiveAnalytics(match);
    
    // Simulate match progression
    const updatedMatch = createMockMatch({
      teamA: { ...match.teamA, score: 9 },
      currentRound: 16,
    });
    
    const analytics2 = calculateLiveAnalytics(updatedMatch);
    
    expect(analytics1.timestamp).not.toBe(analytics2.timestamp);
    expect(analytics2.winProbability.teamA).toBeGreaterThan(analytics1.winProbability.teamA);
  });
});

// =============================================================================
// Performance Tests
// =============================================================================

describe('Performance', () => {
  it('should calculate analytics within acceptable time', () => {
    const match = createMockMatch();
    const start = performance.now();
    
    for (let i = 0; i < 100; i++) {
      calculateLiveAnalytics(match);
    }
    
    const duration = performance.now() - start;
    expect(duration).toBeLessThan(100); // Should complete 100 calculations in <100ms
  });

  it('should handle large event lists efficiently', () => {
    const events: LiveEvent[] = Array.from({ length: 500 }, (_, i) => ({
      id: `event_${i}`,
      type: 'kill',
      matchId: 'test',
      timestamp: new Date().toISOString(),
      data: {},
      source: 'official',
      confidence: 1,
    }));
    
    const match = createMockMatch({ events });
    
    const start = performance.now();
    const analytics = calculateLiveAnalytics(match);
    const duration = performance.now() - start;
    
    expect(analytics).toBeDefined();
    expect(duration).toBeLessThan(50);
  });
});

// Export for use in other test files
export { createMockMatch, createMockPlayer };
