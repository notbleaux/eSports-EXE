/** [Ver001.000]
 * Tactical Lens Tests - SpecMap V2
 * 
 * Comprehensive test suite for all 8 Tactical Lenses.
 * Tests calculation functions, rendering, and type safety.
 * 
 * Tests per lens: 3 (calculate, render, integration)
 * Total: 24 tests
 */

import { describe, it, expect, beforeEach } from 'vitest'

// ============================================================================
// Test Utilities
// ============================================================================

import type {
  Player,
  MapBounds,
  Site,
  Vector2D,
  LensResult
} from '../tactical-types'

/** Create a mock player for testing */
function createMockPlayer(
  id: string,
  team: 'attackers' | 'defenders' = 'attackers',
  position: Vector2D = { x: 100, y: 100 },
  rotation: number = 0
): Player {
  return {
    id,
    name: `Player ${id}`,
    team,
    agent: 'Jett',
    position,
    rotation,
    isAlive: true
  }
}

/** Create mock map bounds for testing */
function createMockMapBounds(): MapBounds {
  return {
    width: 1024,
    height: 1024,
    scale: 1,
    sites: [
      { name: 'A', position: { x: 200, y: 200 }, radius: 100, type: 'a' },
      { name: 'B', position: { x: 800, y: 800 }, radius: 100, type: 'b' },
      { name: 'Mid', position: { x: 512, y: 512 }, radius: 80, type: 'mid' }
    ]
  }
}

/** Create a mock canvas for testing */
function createMockCanvas(): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  return canvas
}

// ============================================================================
// Lens 1: Vision Cone Tests
// ============================================================================

describe('Vision Cone Lens', () => {
  const { calculate: calculateVisionCone, render: renderVisionCone, isPositionVisible, DEFAULT_FOV } = await import('../vision-cone')

  const players = [
    createMockPlayer('p1', 'attackers', { x: 500, y: 500 }, 0),
    createMockPlayer('p2', 'attackers', { x: 600, y: 500 }, 90),
    createMockPlayer('p3', 'defenders', { x: 700, y: 500 }, 180)
  ]
  const mapBounds = createMockMapBounds()

  it('should calculate vision cones for all players', () => {
    const result = calculateVisionCone(players, mapBounds)
    
    expect(result.data.cones).toHaveLength(3)
    expect(result.data.cones[0].playerId).toBe('p1')
    expect(result.data.cones[0].fovAngle).toBe(DEFAULT_FOV)
    expect(result.data.cones[0].visibleArea.length).toBeGreaterThan(0)
    expect(result.metadata.confidence).toBeGreaterThan(0)
    expect(result.metadata.sampleSize).toBe(3)
  })

  it('should render vision cones to canvas without errors', () => {
    const result = calculateVisionCone(players, mapBounds)
    const canvas = createMockCanvas()
    
    expect(() => {
      renderVisionCone(canvas, result)
    }).not.toThrow()
  })

  it('should correctly determine visibility', () => {
    const viewer = { x: 500, y: 500 }
    const target = { x: 600, y: 500 }
    const rotation = 0
    
    const visible = isPositionVisible(viewer, rotation, DEFAULT_FOV, target)
    expect(visible).toBe(true)
    
    // Target behind viewer should not be visible
    const behind = { x: 400, y: 500 }
    const notVisible = isPositionVisible(viewer, rotation, DEFAULT_FOV, behind)
    expect(notVisible).toBe(false)
  })
})

// ============================================================================
// Lens 2: Crossfire Analysis Tests
// ============================================================================

describe('Crossfire Analysis Lens', () => {
  const { calculate: calculateCrossfire, render: renderCrossfire, OPTIMAL_CROSSFIRE_ANGLE } = await import('../crossfire-analysis')

  const players = [
    createMockPlayer('p1', 'defenders', { x: 200, y: 200 }, 45),
    createMockPlayer('p2', 'defenders', { x: 300, y: 300 }, 225),
    createMockPlayer('p3', 'defenders', { x: 400, y: 200 }, 135)
  ]
  const mapBounds = createMockMapBounds()

  it('should identify crossfire setups', () => {
    const result = calculateCrossfire(players, mapBounds)
    
    expect(result.data.setups.length).toBeGreaterThan(0)
    expect(result.data.coverage.total).toBeGreaterThan(0)
    expect(result.data.recommendations.length).toBeGreaterThanOrEqual(0)
    expect(result.metadata.confidence).toBeGreaterThan(0)
  })

  it('should render crossfire analysis to canvas', () => {
    const result = calculateCrossfire(players, mapBounds)
    const canvas = createMockCanvas()
    
    expect(() => {
      renderCrossfire(canvas, result)
    }).not.toThrow()
  })

  it('should calculate angle quality correctly', () => {
    const result = calculateCrossfire(players, mapBounds)
    
    for (const setup of result.data.setups) {
      expect(setup.effectiveness.angleQuality).toBeGreaterThanOrEqual(0)
      expect(setup.effectiveness.angleQuality).toBeLessThanOrEqual(1)
      
      // Setup near optimal angle should have higher quality
      const nearOptimal = setup.angles.some(angle => 
        Math.abs(angle - OPTIMAL_CROSSFIRE_ANGLE) < 30
      )
      if (nearOptimal) {
        expect(setup.effectiveness.angleQuality).toBeGreaterThan(0.5)
      }
    }
  })
})

// ============================================================================
// Lens 3: Retake Efficiency Tests
// ============================================================================

describe('Retake Efficiency Lens', () => {
  const { calculate: calculateRetake, render: renderRetake, MOVEMENT_SPEED, RETAKE_TIMINGS } = await import('../retake-efficiency')

  const defenders = [
    createMockPlayer('d1', 'defenders', { x: 100, y: 100 }),
    createMockPlayer('d2', 'defenders', { x: 150, y: 150 }),
    createMockPlayer('d3', 'defenders', { x: 200, y: 100 })
  ]
  const mapBounds = createMockMapBounds()
  const site = mapBounds.sites[0]

  it('should calculate optimal retake paths', () => {
    const result = calculateRetake(defenders, mapBounds, site)
    
    expect(result.data.optimalPaths.length).toBeGreaterThan(0)
    expect(result.data.metrics.overallSuccessRate).toBeGreaterThanOrEqual(0)
    expect(result.data.metrics.averageTime).toBeGreaterThan(0)
    expect(result.data.scenarios.length).toBeGreaterThan(0)
  })

  it('should render retake paths to canvas', () => {
    const result = calculateRetake(defenders, mapBounds, site)
    const canvas = createMockCanvas()
    
    expect(() => {
      renderRetake(canvas, result)
    }).not.toThrow()
  })

  it('should respect movement speed constants', () => {
    const result = calculateRetake(defenders, mapBounds, site)
    
    for (const path of result.data.optimalPaths) {
      // Distance should be consistent with time and speed
      const expectedTime = path.distance / MOVEMENT_SPEED
      expect(path.estimatedTime).toBeCloseTo(expectedTime, 0)
      
      // Risk should be between 0 and 1
      expect(path.risk).toBeGreaterThanOrEqual(0)
      expect(path.risk).toBeLessThanOrEqual(1)
      
      // Success rate should be between 0 and 1
      expect(path.successRate).toBeGreaterThanOrEqual(0)
      expect(path.successRate).toBeLessThanOrEqual(1)
    }
  })
})

// ============================================================================
// Lens 4: Entry Fragging Tests
// ============================================================================

describe('Entry Fragging Lens', () => {
  const { calculate: calculateEntry, render: renderEntry, getEntryTimingCategory, ENTRY_TIMINGS } = await import('../entry-fragging')

  const players = [
    createMockPlayer('a1', 'attackers', { x: 100, y: 100 }),
    createMockPlayer('a2', 'attackers', { x: 120, y: 120 }),
    createMockPlayer('d1', 'defenders', { x: 200, y: 200 })
  ]
  const mapBounds = createMockMapBounds()

  it('should analyze entry fragging patterns', () => {
    const result = calculateEntry(players, mapBounds)
    
    expect(result.data.attempts.length).toBeGreaterThan(0)
    expect(result.data.overallStats.totalAttempts).toBeGreaterThan(0)
    expect(result.data.positionStats.length).toBeGreaterThanOrEqual(0)
    expect(result.metadata.confidence).toBeGreaterThan(0)
  })

  it('should render entry analysis to canvas', () => {
    const result = calculateEntry(players, mapBounds)
    const canvas = createMockCanvas()
    
    expect(() => {
      renderEntry(canvas, result)
    }).not.toThrow()
  })

  it('should categorize entry timing correctly', () => {
    expect(getEntryTimingCategory(5)).toBe('Rush')
    expect(getEntryTimingCategory(15)).toBe('Fast')
    expect(getEntryTimingCategory(25)).toBe('Default')
    expect(getEntryTimingCategory(40)).toBe('Late')
  })
})

// ============================================================================
// Lens 5: Post-Plant Positioning Tests
// ============================================================================

describe('Post-Plant Positioning Lens', () => {
  const { calculate: calculatePostPlant, render: renderPostPlant, calculateTimeRemaining, isDefusePossible, BOMB_TIMER, DEFUSE_TIME } = await import('../post-plant')

  const players = [
    createMockPlayer('a1', 'attackers', { x: 200, y: 200 }),
    createMockPlayer('a2', 'attackers', { x: 220, y: 220 }),
    createMockPlayer('d1', 'defenders', { x: 800, y: 800 })
  ]
  const mapBounds = createMockMapBounds()

  it('should calculate optimal post-plant positions', () => {
    const result = calculatePostPlant(players, mapBounds)
    
    expect(result.data.optimalPositions.length).toBeGreaterThan(0)
    expect(result.data.scenarios.length).toBeGreaterThan(0)
    expect(Object.keys(result.data.winRates.byRole).length).toBeGreaterThan(0)
    expect(result.metadata.confidence).toBeGreaterThan(0)
  })

  it('should render post-plant analysis to canvas', () => {
    const result = calculatePostPlant(players, mapBounds)
    const canvas = createMockCanvas()
    
    expect(() => {
      renderPostPlant(canvas, result)
    }).not.toThrow()
  })

  it('should calculate bomb timing correctly', () => {
    expect(calculateTimeRemaining(0)).toBe(BOMB_TIMER)
    expect(calculateTimeRemaining(30)).toBe(BOMB_TIMER - 30)
    expect(calculateTimeRemaining(BOMB_TIMER + 10)).toBe(0)
    
    expect(isDefusePossible(BOMB_TIMER)).toBe(true)
    expect(isDefusePossible(DEFUSE_TIME)).toBe(true)
    expect(isDefusePossible(DEFUSE_TIME - 1)).toBe(false)
  })
})

// ============================================================================
// Lens 6: Fake Detection Tests
// ============================================================================

describe('Fake Detection Lens', () => {
  const { calculate: calculateFakeDetection, render: renderFakeDetection, analyzeCurrentExecute, MIN_COMMIT_TIME } = await import('../fake-detection')

  const players = [
    createMockPlayer('a1', 'attackers', { x: 500, y: 100 }),
    createMockPlayer('a2', 'attackers', { x: 520, y: 120 }),
    createMockPlayer('d1', 'defenders', { x: 200, y: 200 })
  ]
  const mapBounds = createMockMapBounds()

  it('should identify fake executes', () => {
    const result = calculateFakeDetection(players, mapBounds)
    
    expect(result.data.fakes.length).toBeGreaterThan(0)
    expect(result.data.patterns.length).toBeGreaterThanOrEqual(0)
    expect(result.data.detectionModel.thresholds.timingWindow).toBe(MIN_COMMIT_TIME)
    expect(result.data.metrics.totalFakes).toBeGreaterThan(0)
  })

  it('should render fake detection to canvas', () => {
    const result = calculateFakeDetection(players, mapBounds)
    const canvas = createMockCanvas()
    
    expect(() => {
      renderFakeDetection(canvas, result)
    }).not.toThrow()
  })

  it('should analyze execute for fake indicators', () => {
    const positions = [{ x: 100, y: 100 }, { x: 500, y: 500 }]
    const utility: string[] = []
    const sounds: string[] = []
    const site = mapBounds.sites[0]
    
    const analysis = analyzeCurrentExecute(positions, utility, sounds, site, MIN_COMMIT_TIME + 5)
    
    expect(analysis.isFake).toBeDefined()
    expect(analysis.confidence).toBeGreaterThanOrEqual(0)
    expect(analysis.confidence).toBeLessThanOrEqual(1)
    expect(Array.isArray(analysis.indicators)).toBe(true)
  })
})

// ============================================================================
// Lens 7: Anchor Performance Tests
// ============================================================================

describe('Anchor Performance Lens', () => {
  const { calculate: calculateAnchor, render: renderAnchor, calculateHoldQuality, MIN_HOLDS_FOR_STATS } = await import('../anchor-performance')

  const players = [
    createMockPlayer('d1', 'defenders', { x: 200, y: 200 }),
    createMockPlayer('d2', 'defenders', { x: 220, y: 220 }),
    createMockPlayer('d3', 'defenders', { x: 250, y: 180 })
  ]
  const mapBounds = createMockMapBounds()

  it('should calculate anchor performance metrics', () => {
    const result = calculateAnchor(players, mapBounds)
    
    expect(result.data.anchors.length).toBeGreaterThanOrEqual(0)
    expect(result.data.bestPractices.length).toBeGreaterThanOrEqual(0)
    expect(Object.keys(result.data.siteAnalysis).length).toBeGreaterThanOrEqual(0)
  })

  it('should render anchor performance to canvas', () => {
    const result = calculateAnchor(players, mapBounds)
    const canvas = createMockCanvas()
    
    expect(() => {
      renderAnchor(canvas, result)
    }).not.toThrow()
  })

  it('should calculate hold quality correctly', () => {
    const hold = {
      roundId: 'r1',
      outcome: 'success' as const,
      kills: 2,
      damageDealt: 200,
      utilityUsed: ['smoke', 'molly'],
      callouts: ['enemy_count'],
      survivalTime: 30,
      supportReceived: 10
    }
    
    const quality = calculateHoldQuality(hold)
    expect(quality).toBeGreaterThan(0)
    expect(quality).toBeLessThanOrEqual(1)
    
    // Better holds should have higher quality
    const poorHold = { ...hold, outcome: 'death' as const, kills: 0, survivalTime: 5 }
    const poorQuality = calculateHoldQuality(poorHold)
    expect(poorQuality).toBeLessThan(quality)
  })
})

// ============================================================================
// Lens 8: Lurk Effectiveness Tests
// ============================================================================

describe('Lurk Effectiveness Lens', () => {
  const { calculate: calculateLurk, render: renderLurk, calculateOptimalLurkTiming, evaluateLurkPath, LURK_SPEED } = await import('../lurk-effectiveness')

  const players = [
    createMockPlayer('a1', 'attackers', { x: 100, y: 500 }),
    createMockPlayer('a2', 'attackers', { x: 120, y: 520 }),
    createMockPlayer('d1', 'defenders', { x: 800, y: 500 })
  ]
  const mapBounds = createMockMapBounds()

  it('should calculate lurk effectiveness', () => {
    const result = calculateLurk(players, mapBounds)
    
    expect(result.data.rounds.length).toBeGreaterThan(0)
    expect(result.data.optimalPaths.length).toBeGreaterThan(0)
    expect(result.data.metrics.successRate).toBeGreaterThanOrEqual(0)
    expect(result.data.metrics.backstabRate).toBeGreaterThanOrEqual(0)
  })

  it('should render lurk analysis to canvas', () => {
    const result = calculateLurk(players, mapBounds)
    const canvas = createMockCanvas()
    
    expect(() => {
      renderLurk(canvas, result)
    }).not.toThrow()
  })

  it('should calculate optimal lurk timing', () => {
    const distance = 2000
    const executeTime = 35
    const isStealthy = true
    
    const timing = calculateOptimalLurkTiming(distance, executeTime, isStealthy)
    
    expect(timing.startTime).toBeGreaterThanOrEqual(0)
    expect(timing.arrivalTime).toBeGreaterThan(timing.startTime)
    expect(timing.arrivalTime).toBeCloseTo(executeTime, 5)
    
    // Stealthy should take longer
    const fastTiming = calculateOptimalLurkTiming(distance, executeTime, false)
    expect(fastTiming.startTime).toBeLessThan(timing.startTime)
  })
})

// ============================================================================
// Integration Tests
// ============================================================================

describe('Tactical Lens Integration', () => {
  const { calculateLens, renderLens, getTacticalLensIds, hasSufficientData } = await import('../tactical-index')

  const players = [
    createMockPlayer('p1', 'attackers', { x: 500, y: 500 }),
    createMockPlayer('p2', 'defenders', { x: 600, y: 600 })
  ]
  const mapBounds = createMockMapBounds()

  it('should export all 8 lens IDs', () => {
    const lensIds = getTacticalLensIds()
    expect(lensIds).toHaveLength(8)
    expect(lensIds).toContain('vision-cone')
    expect(lensIds).toContain('crossfire-analysis')
    expect(lensIds).toContain('retake-efficiency')
    expect(lensIds).toContain('entry-fragging')
    expect(lensIds).toContain('post-plant')
    expect(lensIds).toContain('fake-detection')
    expect(lensIds).toContain('anchor-performance')
    expect(lensIds).toContain('lurk-effectiveness')
  })

  it('should calculate any lens using unified interface', () => {
    const lensIds = getTacticalLensIds()
    
    for (const lensId of lensIds) {
      const result = calculateLens(lensId, players, mapBounds)
      expect(result).toHaveProperty('data')
      expect(result).toHaveProperty('metadata')
      expect(result.metadata).toHaveProperty('confidence')
      expect(result.metadata).toHaveProperty('sampleSize')
    }
  })

  it('should check data sufficiency correctly', () => {
    const lensIds = getTacticalLensIds()
    const result = calculateLens(lensIds[0], players, mapBounds)
    
    expect(hasSufficientData(result, 1)).toBe(true)
    expect(hasSufficientData(result, 1000)).toBe(false)
  })
})

// ============================================================================
// Type Safety Tests
// ============================================================================

describe('Type Safety', () => {
  it('should maintain type safety across all lens types', async () => {
    const { 
      calculateVisionCone,
      calculateCrossfire,
      calculateRetakeEfficiency,
      calculateEntryFragging,
      calculatePostPlant,
      calculateFakeDetection,
      calculateAnchorPerformance,
      calculateLurkEffectiveness
    } = await import('../tactical-index')

    const players = [createMockPlayer('p1')]
    const mapBounds = createMockMapBounds()

    // Each should return proper LensResult with typed data
    const visionResult = calculateVisionCone(players, mapBounds)
    expect(visionResult.data.cones).toBeDefined()

    const crossfireResult = calculateCrossfire(players, mapBounds)
    expect(crossfireResult.data.setups).toBeDefined()

    const retakeResult = calculateRetakeEfficiency(players, mapBounds)
    expect(retakeResult.data.optimalPaths).toBeDefined()

    const entryResult = calculateEntryFragging(players, mapBounds)
    expect(entryResult.data.attempts).toBeDefined()

    const postPlantResult = calculatePostPlant(players, mapBounds)
    expect(postPlantResult.data.optimalPositions).toBeDefined()

    const fakeResult = calculateFakeDetection(players, mapBounds)
    expect(fakeResult.data.fakes).toBeDefined()

    const anchorResult = calculateAnchorPerformance(players, mapBounds)
    expect(anchorResult.data.anchors).toBeDefined()

    const lurkResult = calculateLurkEffectiveness(players, mapBounds)
    expect(lurkResult.data.rounds).toBeDefined()
  })
})

// ============================================================================
// Performance Tests
// ============================================================================

describe('Performance', () => {
  it('should calculate lenses within acceptable time', async () => {
    const { calculateLens, getTacticalLensIds } = await import('../tactical-index')
    
    const players = Array.from({ length: 10 }, (_, i) => 
      createMockPlayer(`p${i}`, i < 5 ? 'attackers' : 'defenders', { 
        x: 100 + i * 50, 
        y: 100 + i * 50 
      })
    )
    const mapBounds = createMockMapBounds()

    for (const lensId of getTacticalLensIds()) {
      const start = performance.now()
      calculateLens(lensId, players, mapBounds)
      const duration = performance.now() - start
      
      // Each lens should calculate in under 100ms for 10 players
      expect(duration).toBeLessThan(100)
    }
  })
})
