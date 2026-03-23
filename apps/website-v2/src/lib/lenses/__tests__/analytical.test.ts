/** [Ver001.000]
 * Analytical Lenses Test Suite
 * ============================
 * Comprehensive tests for all 8 SpecMap V2 Analytical Lenses.
 * 
 * Test Coverage:
 * - Rotation Predictor: 3 tests
 * - Timing Windows: 3 tests
 * - Push Probability: 3 tests
 * - Clutch Zones: 3 tests
 * - Utility Coverage: 3 tests
 * - Trade Routes: 3 tests
 * - Info Gaps: 3 tests
 * - Economy Pressure: 3 tests
 * 
 * Total: 24 tests
 */

import { describe, it, expect, beforeEach } from 'vitest'

// Import all lenses
import {
  calculate as calculateRotationPredictor,
  render as renderRotationPredictor,
  DEFAULT_SITES,
  type RotationInput,
  type RotationLensData
} from '../rotation-predictor'

import {
  calculate as calculateTimingWindows,
  render as renderTimingWindows,
  DEFAULT_PHASES,
  type TimingInput,
  type TimingLensData
} from '../timing-windows'

import {
  calculate as calculatePushProbability,
  render as renderPushProbability,
  FACTOR_WEIGHTS,
  type PushProbabilityInput,
  type PushProbabilityLensData
} from '../push-probability'

import {
  calculate as calculateClutchZones,
  render as renderClutchZones,
  TIER_THRESHOLDS,
  type ClutchZoneInput,
  type ClutchZoneLensData
} from '../clutch-zones'

import {
  calculate as calculateUtilityCoverage,
  render as renderUtilityCoverage,
  UTILITY_RADII,
  type UtilityCoverageInput,
  type UtilityCoverageLensData
} from '../utility-coverage'

import {
  calculate as calculateTradeRoutes,
  render as renderTradeRoutes,
  findOptimalRoute,
  type TradeRouteInput,
  type TradeRouteLensData
} from '../trade-routes'

import {
  calculate as calculateInfoGaps,
  render as renderInfoGaps,
  isInBlindSpot,
  type InfoGapInput,
  type InfoGapLensData
} from '../info-gaps'

import {
  calculate as calculateEcoPressure,
  render as renderEcoPressure,
  determineOptimalBuy,
  BUY_THRESHOLDS,
  type EcoPressureInput,
  type EcoPressureLensData
} from '../eco-pressure'

// ============================================================================
// Test Utilities
// ============================================================================

/** Create a mock canvas for rendering tests */
function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 200
  canvas.height = 200
  return canvas
}

/** Create mock 2D context */
function createMockContext(): CanvasRenderingContext2D {
  return {
    save: () => {},
    restore: () => {},
    clearRect: () => {},
    scale: () => {},
    translate: () => {},
    rotate: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
    arc: () => {},
    fill: () => {},
    stroke: () => {},
    fillRect: () => {},
    strokeRect: () => {},
    fillText: () => {},
    measureText: () => ({ width: 50 }),
    createRadialGradient: () => ({
      addColorStop: () => {}
    }),
    createLinearGradient: () => ({
      addColorStop: () => {}
    }),
    setLineDash: () => {}
  } as unknown as CanvasRenderingContext2D
}

// ============================================================================
// Rotation Predictor Tests
// ============================================================================

describe('Rotation Predictor Lens', () => {
  const baseInput: RotationInput = {
    playerPositions: [
      { playerId: 'p1', team: 'attackers', x: 20, y: 25, timestamp: 0 },
      { playerId: 'p2', team: 'attackers', x: 22, y: 27, timestamp: 0 },
      { playerId: 'p3', team: 'attackers', x: 24, y: 23, timestamp: 0 },
      { playerId: 'p4', team: 'defenders', x: 80, y: 75, timestamp: 0 },
      { playerId: 'p5', team: 'defenders', x: 82, y: 77, timestamp: 0 }
    ],
    roundTime: 30000,
    sites: DEFAULT_SITES
  }

  it('should calculate predictions with valid input', () => {
    const result = calculateRotationPredictor(baseInput) as RotationLensData
    
    expect(result).toBeDefined()
    expect(result.predictions).toBeInstanceOf(Array)
    expect(result.positionHeatmap).toBeInstanceOf(Array)
    expect(result.overallConfidence).toBeGreaterThanOrEqual(0)
    expect(result.overallConfidence).toBeLessThanOrEqual(1)
    expect(result.calculatedAt).toBeGreaterThan(0)
  })

  it('should generate position heatmap with correct structure', () => {
    const result = calculateRotationPredictor(baseInput) as RotationLensData
    
    if (result.positionHeatmap.length > 0) {
      const cell = result.positionHeatmap[0]
      expect(cell).toHaveProperty('x')
      expect(cell).toHaveProperty('y')
      expect(cell).toHaveProperty('value')
      expect(cell).toHaveProperty('intensity')
      expect(cell.intensity).toBeGreaterThanOrEqual(0)
      expect(cell.intensity).toBeLessThanOrEqual(1)
    }
  })

  it('should render to canvas successfully', () => {
    const data = calculateRotationPredictor(baseInput) as RotationLensData
    const canvas = createMockCanvas()
    
    // Mock getContext
    canvas.getContext = () => createMockContext()
    
    const result = renderRotationPredictor({
      canvas,
      data,
      showConfidence: true,
      showTiming: true
    })
    
    expect(result).toBe(true)
  })
})

// ============================================================================
// Timing Windows Tests
// ============================================================================

describe('Timing Windows Lens', () => {
  const baseInput: TimingInput = {
    currentTime: 30000,
    roundDuration: 100000,
    economy: {
      attackers: { canFullBuy: true, utilityAvailable: true },
      defenders: { canFullBuy: true, utilityAvailable: true }
    }
  }

  it('should calculate timing windows with valid input', () => {
    const result = calculateTimingWindows(baseInput) as TimingLensData
    
    expect(result).toBeDefined()
    expect(result.windows).toBeInstanceOf(Array)
    expect(result.phases).toBeInstanceOf(Array)
    expect(result.timelineHeatmap).toBeInstanceOf(Array)
    expect(result.calculatedAt).toBeGreaterThan(0)
  })

  it('should generate execute windows for all sites', () => {
    const result = calculateTimingWindows(baseInput) as TimingLensData
    
    const executeWindows = result.windows.filter(w => w.type === 'execute')
    expect(executeWindows.length).toBeGreaterThanOrEqual(2)
    
    executeWindows.forEach(window => {
      expect(window.startTime).toBeGreaterThan(0)
      expect(window.endTime).toBeGreaterThan(window.startTime)
      expect(window.score).toBeGreaterThanOrEqual(0)
      expect(window.score).toBeLessThanOrEqual(1)
    })
  })

  it('should render to canvas successfully', () => {
    const data = calculateTimingWindows(baseInput) as TimingLensData
    const canvas = createMockCanvas()
    canvas.getContext = () => createMockContext()
    
    const result = renderTimingWindows({
      canvas,
      data,
      showCurrentTime: true,
      input: baseInput
    })
    
    expect(result).toBe(true)
  })
})

// ============================================================================
// Push Probability Tests
// ============================================================================

describe('Push Probability Lens', () => {
  const baseInput: PushProbabilityInput = {
    playerPositions: [
      { playerId: 'p1', team: 'attackers', x: 20, y: 25, health: 100 },
      { playerId: 'p2', team: 'attackers', x: 22, y: 27, health: 100 },
      { playerId: 'p3', team: 'defenders', x: 80, y: 75, health: 100 },
      { playerId: 'p4', team: 'defenders', x: 82, y: 77, health: 100 }
    ],
    activeUtility: [],
    roundTime: 30000,
    economy: {
      attackers: { totalMoney: 20000, canFullBuy: true },
      defenders: { totalMoney: 20000, canFullBuy: true }
    },
    sites: [
      { id: 'A', x: 20, y: 25, entryPoints: [{ x: 25, y: 25, name: 'main' }] },
      { id: 'B', x: 80, y: 75, entryPoints: [{ x: 75, y: 75, name: 'main' }] }
    ]
  }

  it('should calculate push probabilities with valid input', () => {
    const result = calculatePushProbability(baseInput) as PushProbabilityLensData
    
    expect(result).toBeDefined()
    expect(result.sites).toBeInstanceOf(Array)
    expect(result.combinedHeatmap).toBeInstanceOf(Array)
    expect(result.calculatedAt).toBeGreaterThan(0)
  })

  it('should calculate probabilities within valid range', () => {
    const result = calculatePushProbability(baseInput) as PushProbabilityLensData
    
    result.sites.forEach(site => {
      expect(site.probability).toBeGreaterThanOrEqual(0)
      expect(site.probability).toBeLessThanOrEqual(1)
      expect(site.confidence).toBeGreaterThanOrEqual(0)
      expect(site.confidence).toBeLessThanOrEqual(1)
      expect(site.factors).toBeInstanceOf(Array)
    })
  })

  it('should render to canvas successfully', () => {
    const data = calculatePushProbability(baseInput) as PushProbabilityLensData
    const canvas = createMockCanvas()
    canvas.getContext = () => createMockContext()
    
    const result = renderPushProbability({
      canvas,
      data,
      showNumbers: true,
      showPaths: true
    })
    
    expect(result).toBe(true)
  })
})

// ============================================================================
// Clutch Zones Tests
// ============================================================================

describe('Clutch Zones Lens', () => {
  const baseInput: ClutchZoneInput = {
    events: [
      {
        timestamp: Date.now(),
        playerId: 'p1',
        agent: 'Jett',
        situation: { remainingAllies: 1, remainingEnemies: 2 },
        wasSuccessful: true,
        position: { x: 50, y: 50 },
        duration: 15000,
        kills: [{ time: 1000, weapon: 'vandal', headshot: true }]
      },
      {
        timestamp: Date.now() - 60000,
        playerId: 'p2',
        agent: 'Sage',
        situation: { remainingAllies: 1, remainingEnemies: 3 },
        wasSuccessful: false,
        position: { x: 50, y: 50 },
        duration: 8000,
        kills: []
      },
      {
        timestamp: Date.now() - 120000,
        playerId: 'p3',
        agent: 'Jett',
        situation: { remainingAllies: 1, remainingEnemies: 2 },
        wasSuccessful: true,
        position: { x: 50, y: 50 },
        duration: 12000,
        kills: [{ time: 2000, weapon: 'vandal', headshot: false }]
      }
    ],
    mapBounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    gridSize: 10,
    minEvents: 2
  }

  it('should calculate clutch zones with valid input', () => {
    const result = calculateClutchZones(baseInput) as ClutchZoneLensData
    
    expect(result).toBeDefined()
    expect(result.zones).toBeInstanceOf(Array)
    expect(result.heatmap).toBeInstanceOf(Array)
    expect(result.statistics).toBeDefined()
    expect(result.calculatedAt).toBeGreaterThan(0)
  })

  it('should calculate correct success rates', () => {
    const result = calculateClutchZones(baseInput) as ClutchZoneLensData
    
    result.zones.forEach(zone => {
      expect(zone.successRate).toBeGreaterThanOrEqual(0)
      expect(zone.successRate).toBeLessThanOrEqual(1)
      expect(zone.attempts).toBeGreaterThanOrEqual(zone.successes)
      
      // Verify success rate calculation
      const calculatedRate = zone.attempts > 0 ? zone.successes / zone.attempts : 0
      expect(zone.successRate).toBeCloseTo(calculatedRate, 5)
    })
  })

  it('should render to canvas successfully', () => {
    const data = calculateClutchZones(baseInput) as ClutchZoneLensData
    const canvas = createMockCanvas()
    canvas.getContext = () => createMockContext()
    
    const result = renderClutchZones({
      canvas,
      data,
      showRates: true,
      showTiers: true
    })
    
    expect(result).toBe(true)
  })
})

// ============================================================================
// Utility Coverage Tests
// ============================================================================

describe('Utility Coverage Lens', () => {
  const now = Date.now()
  
  const baseInput: UtilityCoverageInput = {
    utilities: [
      {
        id: 'smoke1',
        type: 'smoke',
        team: 'attackers',
        position: { x: 50, y: 50 },
        radius: UTILITY_RADII.smoke,
        deployedAt: now - 5000,
        expiresAt: now + 13000,
        deployedBy: 'p1',
        agent: 'Omen',
        status: 'active',
        intensity: 1
      },
      {
        id: 'flash1',
        type: 'flash',
        team: 'attackers',
        position: { x: 60, y: 50 },
        radius: UTILITY_RADII.flash,
        deployedAt: now - 1000,
        expiresAt: now + 1000,
        deployedBy: 'p2',
        agent: 'Phoenix',
        status: 'active',
        intensity: 1
      }
    ],
    currentTime: now,
    sites: [
      { id: 'A', x: 20, y: 25, importance: 0.9 },
      { id: 'B', x: 80, y: 75, importance: 0.9 }
    ],
    mapBounds: { width: 100, height: 100 }
  }

  it('should calculate utility coverage with valid input', () => {
    const result = calculateUtilityCoverage(baseInput) as UtilityCoverageLensData
    
    expect(result).toBeDefined()
    expect(result.utilities).toBeInstanceOf(Array)
    expect(result.coverageHeatmap).toBeInstanceOf(Array)
    expect(result.stats).toBeDefined()
    expect(result.calculatedAt).toBeGreaterThan(0)
  })

  it('should update utility statuses correctly', () => {
    const result = calculateUtilityCoverage(baseInput) as UtilityCoverageLensData
    
    result.utilities.forEach(utility => {
      expect(utility.status).toBeDefined()
      expect(['active', 'fading', 'expired']).toContain(utility.status)
      
      if (utility.status === 'active') {
        expect(utility.intensity).toBeGreaterThan(0.5)
      }
    })
  })

  it('should render to canvas successfully', () => {
    const data = calculateUtilityCoverage(baseInput) as UtilityCoverageLensData
    const canvas = createMockCanvas()
    canvas.getContext = () => createMockContext()
    
    const result = renderUtilityCoverage({
      canvas,
      data,
      showLabels: true,
      showCoverage: true
    })
    
    expect(result).toBe(true)
  })
})

// ============================================================================
// Trade Routes Tests
// ============================================================================

describe('Trade Routes Lens', () => {
  const baseInput: TradeRouteInput = {
    events: [
      {
        timestamp: Date.now(),
        playerId: 'p1',
        team: 'attackers',
        routeId: 'a-to-b',
        duration: 8000,
        tradeSuccessful: true,
        enemiesEncountered: 1
      },
      {
        timestamp: Date.now() - 30000,
        playerId: 'p2',
        team: 'attackers',
        routeId: 'a-to-b',
        duration: 9000,
        tradeSuccessful: false,
        enemiesEncountered: 2
      },
      {
        timestamp: Date.now() - 60000,
        playerId: 'p3',
        team: 'defenders',
        routeId: 'spawn-to-b',
        duration: 12000,
        tradeSuccessful: true,
        enemiesEncountered: 0
      }
    ],
    routes: [
      {
        id: 'a-to-b',
        name: 'A to B',
        from: { x: 20, y: 25, name: 'A Site' },
        to: { x: 80, y: 75, name: 'B Site' },
        waypoints: [{ x: 35, y: 35 }, { x: 50, y: 50 }, { x: 65, y: 65 }]
      },
      {
        id: 'spawn-to-b',
        name: 'Spawn to B',
        from: { x: 10, y: 10, name: 'Defender Spawn' },
        to: { x: 80, y: 75, name: 'B Site' },
        waypoints: [{ x: 30, y: 30 }, { x: 55, y: 55 }]
      }
    ],
    timeWindow: 5 * 60 * 1000
  }

  it('should calculate trade routes with valid input', () => {
    const result = calculateTradeRoutes(baseInput) as TradeRouteLensData
    
    expect(result).toBeDefined()
    expect(result.routes).toBeInstanceOf(Array)
    expect(result.trafficHeatmap).toBeInstanceOf(Array)
    expect(result.summary).toBeDefined()
    expect(result.calculatedAt).toBeGreaterThan(0)
  })

  it('should calculate route statistics correctly', () => {
    const result = calculateTradeRoutes(baseInput) as TradeRouteLensData
    
    result.routes.forEach(route => {
      expect(route.stats.frequency).toBeGreaterThanOrEqual(0)
      expect(route.stats.avgTime).toBeGreaterThanOrEqual(0)
      expect(route.stats.successRate).toBeGreaterThanOrEqual(0)
      expect(route.stats.successRate).toBeLessThanOrEqual(1)
      expect(route.properties.distance).toBeGreaterThan(0)
    })
  })

  it('should render to canvas successfully', () => {
    const data = calculateTradeRoutes(baseInput) as TradeRouteLensData
    const canvas = createMockCanvas()
    canvas.getContext = () => createMockContext()
    
    const result = renderTradeRoutes({
      canvas,
      data,
      showLabels: true,
      showFrequency: true
    })
    
    expect(result).toBe(true)
  })
})

// ============================================================================
// Info Gaps Tests
// ============================================================================

describe('Info Gaps Lens', () => {
  const baseInput: InfoGapInput = {
    visionSources: [
      {
        position: { x: 20, y: 25 },
        direction: 0,
        fov: Math.PI / 3,
        range: 50,
        type: 'player',
        team: 'allies',
        isActive: true,
        since: Date.now()
      },
      {
        position: { x: 80, y: 75 },
        direction: Math.PI,
        fov: Math.PI / 3,
        range: 50,
        type: 'player',
        team: 'allies',
        isActive: true,
        since: Date.now()
      }
    ],
    mapBounds: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    keyAreas: [
      { id: 'mid', x: 50, y: 50, radius: 15, importance: 'high' },
      { id: 'flank', x: 10, y: 90, radius: 10, importance: 'medium' }
    ],
    attackPaths: [
      { id: 'main', waypoints: [{ x: 20, y: 20 }, { x: 50, y: 50 }, { x: 80, y: 80 }], frequency: 8 }
    ],
    gridResolution: 20,
    currentTime: Date.now()
  }

  it('should calculate info gaps with valid input', () => {
    const result = calculateInfoGaps(baseInput) as InfoGapLensData
    
    expect(result).toBeDefined()
    expect(result.gaps).toBeInstanceOf(Array)
    expect(result.coverageHeatmap).toBeInstanceOf(Array)
    expect(result.gapHeatmap).toBeInstanceOf(Array)
    expect(result.coverageStats).toBeDefined()
    expect(result.calculatedAt).toBeGreaterThan(0)
  })

  it('should identify gaps with proper severity', () => {
    const result = calculateInfoGaps(baseInput) as InfoGapLensData
    
    result.gaps.forEach(gap => {
      expect(gap.severity).toBeGreaterThanOrEqual(0)
      expect(gap.severity).toBeLessThanOrEqual(1)
      expect(gap.position).toHaveProperty('x')
      expect(gap.position).toHaveProperty('y')
      expect(gap.reason).toBeDefined()
      expect(gap.importance).toMatch(/^(low|medium|high|critical)$/)
    })
  })

  it('should render to canvas successfully', () => {
    const data = calculateInfoGaps(baseInput) as InfoGapLensData
    const canvas = createMockCanvas()
    canvas.getContext = () => createMockContext()
    
    const result = renderInfoGaps({
      canvas,
      data,
      showGaps: true,
      showRecommendations: true
    })
    
    expect(result).toBe(true)
  })
})

// ============================================================================
// Economy Pressure Tests
// ============================================================================

describe('Economy Pressure Lens', () => {
  const baseInput: EcoPressureInput = {
    economies: {
      attackers: {
        totalMoney: 22500,
        playerMoney: [5000, 5000, 4500, 4000, 4000],
        equipmentValue: 20000,
        streak: { type: 'win', count: 2 },
        spendingHistory: [4000, 4500, 4100]
      },
      defenders: {
        totalMoney: 15000,
        playerMoney: [3000, 3000, 3000, 3000, 3000],
        equipmentValue: 15000,
        streak: { type: 'loss', count: 2 },
        spendingHistory: [1000, 1500, 2000]
      }
    },
    currentRound: 8,
    roundHistory: [
      { round: 1, winner: 'attackers', attackerSpend: 4000, defenderSpend: 4000 },
      { round: 2, winner: 'defenders', attackerSpend: 4500, defenderSpend: 4500 },
      { round: 3, winner: 'attackers', attackerSpend: 4100, defenderSpend: 3500 },
      { round: 4, winner: 'attackers', attackerSpend: 4200, defenderSpend: 2000 }
    ],
    teamPositions: {
      attackers: { x: 20, y: 25 },
      defenders: { x: 80, y: 75 }
    }
  }

  it('should calculate economy pressure with valid input', () => {
    const result = calculateEcoPressure(baseInput) as EcoPressureLensData
    
    expect(result).toBeDefined()
    expect(result.teams).toBeInstanceOf(Array)
    expect(result.teams).toHaveLength(2)
    expect(result.pressureZones).toBeInstanceOf(Array)
    expect(result.forecast).toBeInstanceOf(Array)
    expect(result.calculatedAt).toBeGreaterThan(0)
  })

  it('should calculate correct buy types', () => {
    const result = calculateEcoPressure(baseInput) as EcoPressureLensData
    
    result.teams.forEach(team => {
      expect(team.buyType).toMatch(/^(full|semi|eco|force)$/)
      expect(team.moneyPerPlayer).toBeGreaterThanOrEqual(0)
      expect(team.canFullBuy).toBe(team.moneyPerPlayer >= BUY_THRESHOLDS.full)
      
      // Check predicted buy
      expect(team.predictedBuy).toMatch(/^(full|semi|eco|force)$/)
      expect(team.predictionConfidence).toBeGreaterThanOrEqual(0)
      expect(team.predictionConfidence).toBeLessThanOrEqual(1)
    })
  })

  it('should render to canvas successfully', () => {
    const data = calculateEcoPressure(baseInput) as EcoPressureLensData
    const canvas = createMockCanvas()
    canvas.getContext = () => createMockContext()
    
    const result = renderEcoPressure({
      canvas,
      data,
      showTeamInfo: true,
      showForecast: true
    })
    
    expect(result).toBe(true)
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Analytical Lenses Integration', () => {
  it('should export all 8 lenses through index', async () => {
    const index = await import('../analytical-index')
    
    expect(index.calculateRotationPredictor).toBeDefined()
    expect(index.calculateTimingWindows).toBeDefined()
    expect(index.calculatePushProbability).toBeDefined()
    expect(index.calculateClutchZones).toBeDefined()
    expect(index.calculateUtilityCoverage).toBeDefined()
    expect(index.calculateTradeRoutes).toBeDefined()
    expect(index.calculateInfoGaps).toBeDefined()
    expect(index.calculateEcoPressure).toBeDefined()
  })

  it('should have consistent lens registry', async () => {
    const index = await import('../analytical-index')
    
    const registry = index.ANALYTICAL_LENS_REGISTRY
    expect(Object.keys(registry)).toHaveLength(8)
    
    Object.values(registry).forEach(lens => {
      expect(lens).toHaveProperty('id')
      expect(lens).toHaveProperty('name')
      expect(lens).toHaveProperty('description')
      expect(lens).toHaveProperty('category')
      expect(lens).toHaveProperty('defaultOpacity')
    })
  })
})
