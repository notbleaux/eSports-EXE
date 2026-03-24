/** [Ver001.000]
 * Fake Detection Lens - SpecMap V2 Tactical Lens
 * 
 * Identifies and analyzes fake executes vs. real commits.
 * Reveals fake patterns, timing tells, and detection strategies.
 * 
 * Features:
 * - Fake execute identification
 * - Commit timing analysis
 * - Pattern recognition
 * - Defender reaction analysis
 * - Detection model with confidence scoring
 */

import type {
  FakeDetectionData,
  FakeExecute,
  FakeIndicator,
  FakeMetrics,
  FakePattern,
  FakeDetectionModel,
  DefenderReaction,
  Player,
  MapBounds,
  Site,
  LensResult,
  LensRenderOptions
} from './tactical-types'

// ============================================================================
// Constants
// ============================================================================

/** Minimum time (seconds) to consider an execute real */
export const MIN_COMMIT_TIME = 12

/** Maximum utility for fake classification */
export const FAKE_UTILITY_THRESHOLD = 2

/** Position spread threshold for fake detection */
export const POSITION_SPREAD_THRESHOLD = 1500

/** Sound inconsistency threshold */
export const SOUND_INCONSISTENCY_THRESHOLD = 3

/** Timing windows for analysis */
export const TIMING_WINDOWS = {
  early: { max: 15, weight: 0.3 },
  mid: { min: 15, max: 30, weight: 0.5 },
  late: { min: 30, weight: 0.8 }
}

/** Colors for fake detection visualization */
export const FAKE_COLORS = {
  fake: {
    high: 'rgba(255, 100, 100, 0.8)',
    medium: 'rgba(255, 200, 100, 0.7)',
    low: 'rgba(255, 255, 100, 0.6)',
    indicator: 'rgba(255, 150, 50, 0.9)'
  },
  real: {
    high: 'rgba(100, 255, 100, 0.8)',
    medium: 'rgba(150, 255, 150, 0.7)',
    low: 'rgba(200, 255, 200, 0.6)'
  },
  uncertainty: 'rgba(150, 150, 150, 0.5)',
  commit: {
    early: 'rgba(0, 200, 255, 0.6)',
    normal: 'rgba(0, 255, 150, 0.6)',
    late: 'rgba(255, 200, 50, 0.6)'
  },
  site: 'rgba(255, 200, 100, 0.2)',
  siteBorder: 'rgba(255, 200, 100, 0.6)'
}

// ============================================================================
// Types
// ============================================================================

/** Fake detection options */
export interface FakeDetectionOptions {
  commitThreshold?: number
  utilityThreshold?: number
  considerHistory?: boolean
  confidenceThreshold?: number
}

/** Vector 2D reference */
export interface Vector2D {
  x: number
  y: number
}

/** Raw execute event from match data */
export interface RawExecuteEvent {
  roundId: string
  targetSite: Site
  actualSite?: Site
  startTime: number
  commitTime?: number
  utilityUsed: string[]
  playerPositions: { id: string; position: Vector2D; timestamp: number }[]
  soundEvents: { type: string; position: Vector2D; timestamp: number }[]
  defenderRotations: { playerId: string; rotated: boolean; rotationTime?: number; wasCorrect: boolean }[]
  outcome: 'success' | 'fake_worked' | 'fake_failed'
}

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate fake detection analysis
 * @param players - Array of player positions
 * @param mapBounds - Map boundary information
 * @param rawEvents - Raw execute events
 * @param options - Calculation options
 * @returns Fake detection data
 */
export function calculate(
  players: Player[],
  mapBounds: MapBounds,
  rawEvents: RawExecuteEvent[] = [],
  options: FakeDetectionOptions = {}
): LensResult<FakeDetectionData> {
  const {
    commitThreshold = MIN_COMMIT_TIME,
    utilityThreshold = FAKE_UTILITY_THRESHOLD,
    considerHistory = true,
    confidenceThreshold = 0.6
  } = options

  // Process execute events
  const fakes = rawEvents.length > 0
    ? processExecuteEvents(rawEvents, commitThreshold, utilityThreshold)
    : generateSyntheticFakes(players, mapBounds, commitThreshold)

  // Calculate metrics
  const metrics = calculateFakeMetrics(fakes, mapBounds)

  // Identify patterns
  const patterns = identifyFakePatterns(fakes)

  // Build detection model
  const detectionModel = buildDetectionModel(fakes, confidenceThreshold)

  const data: FakeDetectionData = {
    fakes,
    metrics,
    patterns,
    detectionModel
  }

  return {
    data,
    metadata: {
      calculatedAt: Date.now(),
      confidence: calculateConfidence(fakes.length, patterns.length),
      sampleSize: fakes.length
    }
  }
}

/**
 * Process raw execute events
 */
function processExecuteEvents(
  events: RawExecuteEvent[],
  commitThreshold: number,
  utilityThreshold: number
): FakeExecute[] {
  return events.map((event, index) => {
    const indicators: FakeIndicator[] = []
    const timing = {
      start: event.startTime,
      commit: event.commitTime || event.startTime + 20,
      rotation: event.commitTime || event.startTime + 25
    }

    // Check for minimal utility indicator
    if (event.utilityUsed.length <= utilityThreshold) {
      indicators.push({
        type: 'minimal_utility',
        confidence: 0.7,
        timestamp: event.startTime + 5,
        description: `Only ${event.utilityUsed.length} utility used`
      })
    }

    // Check for late commit indicator
    if (event.commitTime && event.commitTime - event.startTime > commitThreshold) {
      indicators.push({
        type: 'late_commit',
        confidence: 0.6,
        timestamp: event.commitTime,
        description: `Late commit at ${(event.commitTime - event.startTime).toFixed(1)}s`
      })
    }

    // Check for no planter indicator
    const hasPlanter = event.playerPositions.some(p => {
      // Check if any player is at site with plant capability
      return true // Simplified
    })

    if (!hasPlanter) {
      indicators.push({
        type: 'no_planter',
        confidence: 0.8,
        timestamp: event.startTime + 10,
        description: 'No planter present'
      })
    }

    // Check for position spread
    const spread = calculatePositionSpread(event.playerPositions)
    if (spread > POSITION_SPREAD_THRESHOLD) {
      indicators.push({
        type: 'position_gap',
        confidence: 0.65,
        timestamp: event.startTime + 8,
        description: `Wide position spread (${spread.toFixed(0)} units)`
      })
    }

    // Check for sound inconsistency
    const soundInconsistency = analyzeSoundInconsistency(event.soundEvents, event.targetSite)
    if (soundInconsistency) {
      indicators.push({
        type: 'sound_inconsistency',
        confidence: 0.55,
        timestamp: event.startTime + 6,
        description: 'Sound cues do not match execute'
      })
    }

    const defenderReactions: DefenderReaction[] = event.defenderRotations.map(r => ({
      playerId: r.playerId,
      rotation: r.rotated,
      rotationTime: r.rotationTime,
      wasCorrect: r.wasCorrect
    }))

    return {
      id: `fake-${index}`,
      roundId: event.roundId,
      targetSite: event.targetSite,
      actualSite: event.actualSite,
      fakeIndicators: indicators,
      timing,
      success: event.outcome === 'fake_worked',
      defenderReactions
    }
  })
}

/**
 * Generate synthetic fake data for demonstration
 */
function generateSyntheticFakes(
  players: Player[],
  mapBounds: MapBounds,
  commitThreshold: number
): FakeExecute[] {
  const fakes: FakeExecute[] = []
  const sites = mapBounds.sites

  for (let i = 0; i < 12; i++) {
    const targetSite = sites[i % sites.length]
    const actualSite = Math.random() > 0.6 ? sites[(i + 1) % sites.length] : undefined
    const startTime = 10 + Math.random() * 20
    const commitTime = startTime + (Math.random() > 0.5 ? 8 : 18)

    const indicators: FakeIndicator[] = []

    // Add random indicators
    if (Math.random() > 0.4) {
      indicators.push({
        type: 'minimal_utility',
        confidence: 0.5 + Math.random() * 0.4,
        timestamp: startTime + 5,
        description: 'Minimal utility deployed'
      })
    }

    if (commitTime - startTime > commitThreshold) {
      indicators.push({
        type: 'late_commit',
        confidence: 0.6,
        timestamp: commitTime,
        description: 'Late commit timing'
      })
    }

    if (Math.random() > 0.6) {
      indicators.push({
        type: 'position_gap',
        confidence: 0.55,
        timestamp: startTime + 7,
        description: 'Wide attacker spread'
      })
    }

    // Generate defender reactions
    const reactions: DefenderReaction[] = []
    for (let j = 0; j < 5; j++) {
      const rotated = Math.random() > 0.3
      reactions.push({
        playerId: `defender-${j}`,
        rotation: rotated,
        rotationTime: rotated ? startTime + 10 + Math.random() * 10 : undefined,
        wasCorrect: Math.random() > 0.4
      })
    }

    fakes.push({
      id: `fake-${i}`,
      roundId: `round-${i}`,
      targetSite,
      actualSite,
      fakeIndicators: indicators,
      timing: {
        start: startTime,
        commit: commitTime,
        rotation: commitTime + 5
      },
      success: !!actualSite && reactions.filter(r => r.wasCorrect).length < 3,
      defenderReactions: reactions
    })
  }

  return fakes
}

/**
 * Calculate position spread of attackers
 */
function calculatePositionSpread(
  positions: { position: Vector2D }[]
): number {
  if (positions.length < 2) return 0

  let maxDist = 0
  for (let i = 0; i < positions.length; i++) {
    for (let j = i + 1; j < positions.length; j++) {
      const dist = distance(positions[i].position, positions[j].position)
      maxDist = Math.max(maxDist, dist)
    }
  }

  return maxDist
}

/**
 * Analyze sound event inconsistency
 */
function analyzeSoundInconsistency(
  soundEvents: { type: string; position: Vector2D }[],
  targetSite: Site
): boolean {
  // Check if sounds are coming from unexpected locations
  const siteSounds = soundEvents.filter(s => 
    distance(s.position, targetSite.position) < targetSite.radius * 2
  )

  return siteSounds.length < soundEvents.length * 0.5
}

/**
 * Calculate fake metrics
 */
function calculateFakeMetrics(
  fakes: FakeExecute[],
  mapBounds: MapBounds
): FakeMetrics {
  const successfulFakes = fakes.filter(f => f.success).length
  
  // Calculate detection rate (defenders who didn't rotate or rotated correctly)
  let correctResponses = 0
  let totalResponses = 0

  for (const fake of fakes) {
    for (const reaction of fake.defenderReactions) {
      totalResponses++
      if ((reaction.rotation && fake.actualSite) || 
          (!reaction.rotation && !fake.actualSite)) {
        correctResponses++
      }
    }
  }

  const detectionRate = totalResponses > 0 ? correctResponses / totalResponses : 0

  // Calculate average commit time
  const avgCommitTime = fakes.reduce((sum, f) => 
    sum + (f.timing.commit - f.timing.start), 0) / fakes.length

  // Calculate by-map metrics
  const byMap: Record<string, FakeMapMetrics> = {}
  
  for (const fake of fakes) {
    const mapName = fake.targetSite.name
    if (!byMap[mapName]) {
      byMap[mapName] = {
        fakeRate: 0,
        successRate: 0,
        preferredTarget: fake.targetSite.name,
        averageDuration: 0
      }
    }
    
    byMap[mapName].fakeRate++
    if (fake.success) byMap[mapName].successRate++
    byMap[mapName].averageDuration += fake.timing.rotation - fake.timing.start
  }

  // Normalize by-map metrics
  for (const mapName in byMap) {
    const mapFakes = fakes.filter(f => f.targetSite.name === mapName).length
    if (mapFakes > 0) {
      byMap[mapName].fakeRate /= fakes.length
      byMap[mapName].successRate /= mapFakes
      byMap[mapName].averageDuration /= mapFakes
    }
  }

  return {
    totalFakes: fakes.length,
    successfulFakes,
    detectionRate,
    averageCommitTime: avgCommitTime,
    byMap
  }
}

/**
 * Identify common fake patterns
 */
function identifyFakePatterns(fakes: FakeExecute[]): FakePattern[] {
  const patterns: FakePattern[] = []

  // Pattern 1: Minimal Utility Fake
  const minimalUtilityFakes = fakes.filter(f => 
    f.fakeIndicators.some(i => i.type === 'minimal_utility')
  )
  if (minimalUtilityFakes.length > 2) {
    patterns.push({
      name: 'Minimal Utility Fake',
      description: 'Execute with significantly less utility than typical',
      indicators: ['minimal_utility'],
      occurrenceRate: minimalUtilityFakes.length / fakes.length,
      effectiveness: minimalUtilityFakes.filter(f => f.success).length / minimalUtilityFakes.length
    })
  }

  // Pattern 2: Late Commit
  const lateCommitFakes = fakes.filter(f => 
    f.fakeIndicators.some(i => i.type === 'late_commit')
  )
  if (lateCommitFakes.length > 2) {
    patterns.push({
      name: 'Late Commit Fake',
      description: 'Attackers delay committing to site until late in round',
      indicators: ['late_commit', 'position_gap'],
      occurrenceRate: lateCommitFakes.length / fakes.length,
      effectiveness: lateCommitFakes.filter(f => f.success).length / lateCommitFakes.length
    })
  }

  // Pattern 3: Sound Bait
  const soundFakes = fakes.filter(f => 
    f.fakeIndicators.some(i => i.type === 'sound_inconsistency')
  )
  if (soundFakes.length > 1) {
    patterns.push({
      name: 'Sound Bait',
      description: 'Intentional sound cues to misdirect defenders',
      indicators: ['sound_inconsistency'],
      occurrenceRate: soundFakes.length / fakes.length,
      effectiveness: soundFakes.filter(f => f.success).length / soundFakes.length
    })
  }

  // Pattern 4: Wide Split
  const splitFakes = fakes.filter(f => 
    f.fakeIndicators.some(i => i.type === 'position_gap')
  )
  if (splitFakes.length > 2) {
    patterns.push({
      name: 'Wide Split Fake',
      description: 'Attackers spread wide to create map pressure without committing',
      indicators: ['position_gap'],
      occurrenceRate: splitFakes.length / fakes.length,
      effectiveness: splitFakes.filter(f => f.success).length / splitFakes.length
    })
  }

  return patterns
}

/**
 * Build fake detection model
 */
function buildDetectionModel(
  fakes: FakeExecute[],
  confidenceThreshold: number
): FakeDetectionModel {
  // Calculate indicator weights based on effectiveness
  const indicatorCounts: Record<string, { fake: number; real: number }> = {}

  for (const fake of fakes) {
    const isActuallyFake = !!fake.actualSite
    
    for (const indicator of fake.fakeIndicators) {
      if (!indicatorCounts[indicator.type]) {
        indicatorCounts[indicator.type] = { fake: 0, real: 0 }
      }
      
      if (isActuallyFake) {
        indicatorCounts[indicator.type].fake++
      } else {
        indicatorCounts[indicator.type].real++
      }
    }
  }

  const weights: Record<string, number> = {}
  for (const [type, counts] of Object.entries(indicatorCounts)) {
    const total = counts.fake + counts.real
    if (total > 0) {
      weights[type] = counts.fake / total
    }
  }

  return {
    thresholds: {
      utilityCommit: FAKE_UTILITY_THRESHOLD,
      timingWindow: MIN_COMMIT_TIME,
      positionSpread: POSITION_SPREAD_THRESHOLD
    },
    weights,
    confidence: confidenceThreshold
  }
}

/**
 * Calculate confidence score
 */
function calculateConfidence(fakeCount: number, patternCount: number): number {
  const baseConfidence = 0.55
  const fakeBonus = Math.min(0.3, fakeCount * 0.02)
  const patternBonus = Math.min(0.15, patternCount * 0.04)
  return Math.min(1.0, baseConfidence + fakeBonus + patternBonus)
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render fake detection analysis to canvas
 * @param canvas - Canvas element to render to
 * @param result - Lens calculation result
 * @param options - Render options
 */
export function render(
  canvas: HTMLCanvasElement,
  result: LensResult<FakeDetectionData>,
  options: Partial<LensRenderOptions> = {}
): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const {
    opacity = 0.8,
    scale = 1,
    offset = { x: 0, y: 0 },
    showLabels = true
  } = options

  const { data } = result

  ctx.save()
  ctx.globalAlpha = opacity
  ctx.scale(scale, scale)
  ctx.translate(offset.x, offset.y)

  // Render sites
  renderSites(ctx, data.fakes)

  // Render fake executes
  for (const fake of data.fakes) {
    renderFakeExecute(ctx, fake)
  }

  // Render patterns
  for (const pattern of data.patterns) {
    renderPattern(ctx, pattern, data.fakes)
  }

  // Render labels
  if (showLabels) {
    renderLabels(ctx, data)
  }

  ctx.restore()
}

/**
 * Render sites
 */
function renderSites(ctx: CanvasRenderingContext2D, fakes: FakeExecute[]): void {
  const processedSites = new Set<string>()

  for (const fake of fakes) {
    if (processedSites.has(fake.targetSite.name)) continue
    processedSites.add(fake.targetSite.name)

    ctx.beginPath()
    ctx.arc(fake.targetSite.position.x, fake.targetSite.position.y, fake.targetSite.radius, 0, Math.PI * 2)
    ctx.fillStyle = FAKE_COLORS.site
    ctx.fill()
    ctx.strokeStyle = FAKE_COLORS.siteBorder
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.font = 'bold 12px sans-serif'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.fillText(fake.targetSite.name.toUpperCase(), fake.targetSite.position.x, fake.targetSite.position.y)
  }
}

/**
 * Render a fake execute
 */
function renderFakeExecute(ctx: CanvasRenderingContext2D, fake: FakeExecute): void {
  const isFake = !!fake.actualSite
  const success = fake.success

  // Calculate fake likelihood color
  let color = FAKE_COLORS.uncertainty
  if (isFake) {
    color = success ? FAKE_COLORS.fake.high : FAKE_COLORS.fake.medium
  } else {
    color = FAKE_COLORS.real.medium
  }

  // Draw indicator at target site
  const angle = (parseInt(fake.id.split('-')[1] || '0') / 12) * Math.PI * 2
  const indicatorX = fake.targetSite.position.x + Math.cos(angle) * (fake.targetSite.radius + 30)
  const indicatorY = fake.targetSite.position.y + Math.sin(angle) * (fake.targetSite.radius + 30)

  ctx.beginPath()
  ctx.arc(indicatorX, indicatorY, 10, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = 'white'
  ctx.lineWidth = 1
  ctx.stroke()

  // Draw arrow to actual site if fake
  if (fake.actualSite) {
    ctx.beginPath()
    ctx.moveTo(indicatorX, indicatorY)
    ctx.lineTo(fake.actualSite.position.x, fake.actualSite.position.y)
    ctx.strokeStyle = FAKE_COLORS.fake.indicator
    ctx.lineWidth = 2
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.setLineDash([])

    // Draw actual site indicator
    ctx.beginPath()
    ctx.arc(fake.actualSite.position.x, fake.actualSite.position.y, 8, 0, Math.PI * 2)
    ctx.fillStyle = FAKE_COLORS.real.high
    ctx.fill()
  }

  // Draw indicator count
  const indicatorCount = fake.fakeIndicators.length
  if (indicatorCount > 0) {
    ctx.font = '9px sans-serif'
    ctx.fillStyle = 'white'
    ctx.textAlign = 'center'
    ctx.fillText(indicatorCount.toString(), indicatorX, indicatorY + 3)
  }
}

/**
 * Render pattern highlights
 */
function renderPattern(ctx: CanvasRenderingContext2D, pattern: FakePattern, fakes: FakeExecute[]): void {
  // Highlight areas where pattern occurs
  const relevantFakes = fakes.filter(f => 
    pattern.indicators.some(ind => 
      f.fakeIndicators.some(fi => fi.type === ind)
    )
  )

  for (const fake of relevantFakes) {
    // Draw pattern indicator ring
    ctx.beginPath()
    ctx.arc(fake.targetSite.position.x, fake.targetSite.position.y, fake.targetSite.radius + 15, 0, Math.PI * 2)
    ctx.strokeStyle = pattern.effectiveness > 0.6 
      ? 'rgba(255, 200, 50, 0.6)' 
      : 'rgba(150, 150, 150, 0.4)'
    ctx.lineWidth = 2
    ctx.setLineDash([3, 3])
    ctx.stroke()
    ctx.setLineDash([])
  }
}

/**
 * Render labels and metrics
 */
function renderLabels(ctx: CanvasRenderingContext2D, data: FakeDetectionData): void {
  ctx.font = '12px sans-serif'
  ctx.fillStyle = 'white'
  ctx.textAlign = 'left'

  let y = 20
  ctx.fillText(`Executes Analyzed: ${data.fakes.length}`, 10, y)
  y += 20

  const fakeCount = data.fakes.filter(f => !!f.actualSite).length
  ctx.fillText(`Fakes Detected: ${fakeCount}`, 10, y)
  y += 20

  ctx.fillText(`Detection Rate: ${(data.metrics.detectionRate * 100).toFixed(0)}%`, 10, y)
  y += 20

  ctx.fillText(`Avg Commit Time: ${data.metrics.averageCommitTime.toFixed(1)}s`, 10, y)
  y += 25

  // Show patterns
  ctx.font = 'bold 12px sans-serif'
  ctx.fillText('Patterns:', 10, y)
  y += 18

  ctx.font = '11px sans-serif'
  for (const pattern of data.patterns) {
    ctx.fillText(
      `${pattern.name}: ${(pattern.occurrenceRate * 100).toFixed(0)}%`,
      10, y
    )
    y += 16
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Distance between two points
 */
function distance(a: Vector2D, b: Vector2D): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * Analyze current execute for fake indicators
 */
export function analyzeCurrentExecute(
  playerPositions: Vector2D[],
  utilityUsed: string[],
  soundEvents: string[],
  targetSite: Site,
  elapsedTime: number
): { isFake: boolean; confidence: number; indicators: string[] } {
  const indicators: string[] = []
  let confidence = 0

  // Check utility
  if (utilityUsed.length <= FAKE_UTILITY_THRESHOLD) {
    indicators.push('minimal_utility')
    confidence += 0.25
  }

  // Check timing
  if (elapsedTime > MIN_COMMIT_TIME && !hasSitePresence(playerPositions, targetSite)) {
    indicators.push('late_commit')
    confidence += 0.25
  }

  // Check position spread
  const spread = calculatePositionSpread(playerPositions.map(p => ({ position: p })))
  if (spread > POSITION_SPREAD_THRESHOLD) {
    indicators.push('position_gap')
    confidence += 0.2
  }

  return {
    isFake: confidence > 0.5,
    confidence,
    indicators
  }
}

/**
 * Check if players have site presence
 */
function hasSitePresence(positions: Vector2D[], site: Site): boolean {
  return positions.some(p => distance(p, site.position) < site.radius * 1.5)
}

/**
 * Get commit timing category
 */
export function getCommitTimingCategory(timeSeconds: number): string {
  for (const [key, window] of Object.entries(TIMING_WINDOWS)) {
    if ('max' in window && timeSeconds <= window.max) return key
    if ('min' in window && timeSeconds >= window.min) return key
  }
  return 'unknown'
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  analyzeCurrentExecute,
  getCommitTimingCategory,
  MIN_COMMIT_TIME,
  FAKE_UTILITY_THRESHOLD,
  TIMING_WINDOWS,
  FAKE_COLORS
}
