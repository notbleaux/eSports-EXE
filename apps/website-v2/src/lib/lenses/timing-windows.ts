/** [Ver001.000]
 * Timing Windows Lens
 * ===================
 * Shows optimal execute timings for tactical plays.
 * Visual timeline with timing windows for executes, rotates, and ability usage.
 * 
 * Features:
 * - Optimal execute window calculation
 * - Visual timeline with color-coded phases
 * - Window overlap analysis
 * - Round phase indicators
 */

import type { HeatmapCell } from '@/components/SpecMapViewer/lenses/types'

// ============================================================================
// Types
// ============================================================================

/** Timing window definition */
export interface TimingWindow {
  /** Unique identifier */
  id: string
  /** Window type/category */
  type: 'execute' | 'rotate' | 'ability' | 'plant' | 'defuse' | 'peek'
  /** Start time in round (ms from round start) */
  startTime: number
  /** End time in round (ms from round start) */
  endTime: number
  /** Optimal timing within window */
  optimalTime: number
  /** Confidence/score for this window (0.0 - 1.0) */
  score: number
  /** Description of the timing */
  description: string
  /** Associated site/position */
  site?: string
  /** Team this applies to */
  teamSide: 'attackers' | 'defenders' | 'both'
  /** Visual color for this window */
  color: string
  /** Dependencies on other windows */
  dependencies?: string[]
}

/** Round phase definition */
export interface RoundPhase {
  /** Phase name */
  name: string
  /** Start time (ms) */
  startTime: number
  /** End time (ms) */
  endTime: number
  /** Phase description */
  description: string
  /** Phase color */
  color: string
}

/** Input data for timing calculation */
export interface TimingInput {
  /** Current round time (ms) */
  currentTime: number
  /** Round duration (typically 100000ms = 100s) */
  roundDuration?: number
  /** Plant time if bomb planted (ms from round start) */
  plantTime?: number
  /** Site planted at */
  plantedSite?: string
  /** Team economy info */
  economy?: {
    attackers: { canFullBuy: boolean; utilityAvailable: boolean }
    defenders: { canFullBuy: boolean; utilityAvailable: boolean }
  }
  /** Previous round timing data for patterns */
  historicalRounds?: Array<{
    roundNumber: number
    successfulExecutes: Array<{ site: string; time: number }>
    plantTime?: number
    roundDuration: number
  }>
  /** Map-specific timing data */
  mapTimings?: MapTimingData
}

/** Map-specific timing data */
export interface MapTimingData {
  /** Default execute times by site */
  executeTimes: Record<string, number>
  /** Rotation times between sites */
  rotationTimes: Record<string, number>
  /** Ability timings */
  abilityTimings: Array<{
    name: string
    optimalTime: number
    duration: number
  }>
}

/** Lens data output */
export interface TimingLensData {
  /** Calculated timing windows */
  windows: TimingWindow[]
  /** Round phases */
  phases: RoundPhase[]
  /** Current active window IDs */
  activeWindows: string[]
  /** Recommended next action timing */
  recommendation?: {
    action: string
    optimalTime: number
    urgency: 'low' | 'medium' | 'high'
  }
  /** Timeline heatmap data */
  timelineHeatmap: HeatmapCell[]
  /** Calculation timestamp */
  calculatedAt: number
}

/** Render options */
export interface TimingRenderOptions {
  /** Canvas to render to */
  canvas: HTMLCanvasElement
  /** Lens data */
  data: TimingLensData
  /** Current time indicator */
  showCurrentTime?: boolean
  /** Show phase labels */
  showPhaseLabels?: boolean
  /** Show window details */
  showDetails?: boolean
  /** Animation progress */
  animationProgress?: number
  /** Input data for current time reference */
  input?: TimingInput
}

// ============================================================================
// Constants
// ============================================================================

/** Standard round phases for Valorant/CS2 */
export const DEFAULT_PHASES: RoundPhase[] = [
  { name: 'Pistol', startTime: 0, endTime: 5000, description: 'Initial contact phase', color: '#94a3b8' },
  { name: 'Early', startTime: 5000, endTime: 20000, description: 'Information gathering', color: '#60a5fa' },
  { name: 'Mid', startTime: 20000, endTime: 55000, description: 'Main execute window', color: '#34d399' },
  { name: 'Late', startTime: 55000, endTime: 85000, description: 'Post-plant/retake', color: '#fbbf24' },
  { name: 'Final', startTime: 85000, endTime: 100000, description: 'Time pressure', color: '#f87171' }
]

/** Window type colors */
export const WINDOW_COLORS: Record<TimingWindow['type'], string> = {
  execute: '#8b5cf6',  // Violet
  rotate: '#3b82f6',   // Blue
  ability: '#10b981',  // Emerald
  plant: '#f59e0b',    // Amber
  defuse: '#ef4444',   // Red
  peek: '#ec4899'      // Pink
}

/** Default round duration (100 seconds) */
export const DEFAULT_ROUND_DURATION = 100000

// ============================================================================
// Calculation Functions
// ============================================================================

/**
 * Calculate timing windows based on input data
 * @param input - Timing input data
 * @returns Timing lens data
 */
export function calculate(input: TimingInput): TimingLensData {
  const calculatedAt = Date.now()
  const roundDuration = input.roundDuration || DEFAULT_ROUND_DURATION
  
  // Generate base timing windows
  const windows = generateTimingWindows(input, roundDuration)
  
  // Calculate phases
  const phases = calculatePhases(input, roundDuration)
  
  // Determine active windows
  const activeWindows = windows
    .filter(w => input.currentTime >= w.startTime && input.currentTime <= w.endTime)
    .map(w => w.id)
  
  // Generate recommendation
  const recommendation = generateRecommendation(windows, input)
  
  // Generate timeline heatmap
  const timelineHeatmap = generateTimelineHeatmap(windows, roundDuration)
  
  return {
    windows,
    phases,
    activeWindows,
    recommendation,
    timelineHeatmap,
    calculatedAt
  }
}

/**
 * Generate timing windows based on round state
 */
function generateTimingWindows(input: TimingInput, roundDuration: number): TimingWindow[] {
  const windows: TimingWindow[] = []
  
  // Execute windows (mid-round)
  const sites = ['A', 'B', 'C']
  sites.forEach((site, index) => {
    const baseTime = 25000 + index * 5000
    windows.push({
      id: `execute-${site}`,
      type: 'execute',
      startTime: baseTime,
      endTime: baseTime + 15000,
      optimalTime: baseTime + 8000,
      score: calculateExecuteScore(input, site),
      description: `Optimal execute window for ${site} site`,
      site,
      teamSide: 'attackers',
      color: WINDOW_COLORS.execute
    })
  })
  
  // Rotation windows
  windows.push({
    id: 'rotate-early',
    type: 'rotate',
    startTime: 15000,
    endTime: 30000,
    optimalTime: 20000,
    score: 0.8,
    description: 'Early rotation window',
    teamSide: 'defenders',
    color: WINDOW_COLORS.rotate
  })
  
  windows.push({
    id: 'rotate-late',
    type: 'rotate',
    startTime: 55000,
    endTime: 70000,
    optimalTime: 60000,
    score: 0.9,
    description: 'Late rotation (retake) window',
    teamSide: 'defenders',
    color: WINDOW_COLORS.rotate
  })
  
  // Ability usage windows
  windows.push({
    id: 'utility-entry',
    type: 'ability',
    startTime: 20000,
    endTime: 35000,
    optimalTime: 25000,
    score: 0.85,
    description: 'Entry utility window (flashes, smokes)',
    teamSide: 'attackers',
    color: WINDOW_COLORS.ability
  })
  
  windows.push({
    id: 'utility-defense',
    type: 'ability',
    startTime: 10000,
    endTime: 25000,
    optimalTime: 18000,
    score: 0.8,
    description: 'Defensive utility window',
    teamSide: 'defenders',
    color: WINDOW_COLORS.ability
  })
  
  // Plant window
  windows.push({
    id: 'plant-window',
    type: 'plant',
    startTime: 40000,
    endTime: 75000,
    optimalTime: 55000,
    score: 0.9,
    description: 'Optimal bomb plant window',
    teamSide: 'attackers',
    color: WINDOW_COLORS.plant
  })
  
  // Defuse window (only if bomb planted)
  if (input.plantTime) {
    windows.push({
      id: 'defuse-window',
      type: 'defuse',
      startTime: input.plantTime + 5000,
      endTime: input.plantTime + 40000,
      optimalTime: input.plantTime + 15000,
      score: 0.85,
      description: 'Defuse window',
      site: input.plantedSite,
      teamSide: 'defenders',
      color: WINDOW_COLORS.defuse
    })
  }
  
  // Peek windows
  windows.push({
    id: 'peek-early',
    type: 'peek',
    startTime: 3000,
    endTime: 8000,
    optimalTime: 5000,
    score: 0.7,
    description: 'Early peek window',
    teamSide: 'both',
    color: WINDOW_COLORS.peek
  })
  
  return windows
}

/**
 * Calculate execute score based on context
 */
function calculateExecuteScore(input: TimingInput, site: string): number {
  let score = 0.75
  
  // Economy factor
  if (input.economy?.attackers.canFullBuy) {
    score += 0.1
  }
  
  // Historical success
  if (input.historicalRounds) {
    const successes = input.historicalRounds.filter(
      r => r.successfulExecutes.some(e => e.site === site)
    ).length
    const successRate = successes / input.historicalRounds.length
    score += successRate * 0.1
  }
  
  return Math.min(1, score)
}

/**
 * Calculate round phases
 */
function calculatePhases(input: TimingInput, roundDuration: number): RoundPhase[] {
  return DEFAULT_PHASES.map(phase => ({
    ...phase,
    // Adjust late phase if bomb planted
    endTime: input.plantTime && phase.name === 'Late' 
      ? Math.min(phase.endTime, input.plantTime + 45000)
      : phase.endTime
  }))
}

/**
 * Generate recommendation based on current time
 */
function generateRecommendation(
  windows: TimingWindow[],
  input: TimingInput
): TimingLensData['recommendation'] | undefined {
  const currentTime = input.currentTime
  
  // Find upcoming windows
  const upcoming = windows.filter(w => w.startTime > currentTime)
  if (upcoming.length === 0) return undefined
  
  // Sort by start time and score
  const best = upcoming
    .filter(w => w.score > 0.6)
    .sort((a, b) => {
      const timeDiffA = a.startTime - currentTime
      const timeDiffB = b.startTime - currentTime
      // Prefer closer windows with good scores
      return (b.score * 10000 - timeDiffB) - (a.score * 10000 - timeDiffA)
    })[0]
  
  if (!best) return undefined
  
  const timeUntil = best.startTime - currentTime
  const urgency: TimingLensData['recommendation']['urgency'] = 
    timeUntil < 5000 ? 'high' : timeUntil < 15000 ? 'medium' : 'low'
  
  return {
    action: best.description,
    optimalTime: best.optimalTime,
    urgency
  }
}

/**
 * Generate timeline heatmap showing activity density
 */
function generateTimelineHeatmap(windows: TimingWindow[], roundDuration: number): HeatmapCell[] {
  const cells: HeatmapCell[] = []
  const timeSlots = 50 // 2-second intervals
  
  for (let i = 0; i < timeSlots; i++) {
    const time = (i / timeSlots) * roundDuration
    let intensity = 0
    
    windows.forEach(window => {
      if (time >= window.startTime && time <= window.endTime) {
        // Higher intensity at optimal time
        const distFromOptimal = Math.abs(time - window.optimalTime)
        const windowInfluence = 1 - (distFromOptimal / (window.endTime - window.startTime))
        intensity += windowInfluence * window.score * 0.5
      }
    })
    
    if (intensity > 0.1) {
      cells.push({
        x: (time / roundDuration) * 100,
        y: 50, // Center of timeline
        value: intensity,
        intensity: Math.min(1, intensity)
      })
    }
  }
  
  return cells
}

// ============================================================================
// Rendering Functions
// ============================================================================

/**
 * Render timing windows to canvas
 * @param options - Render options
 * @returns Render success status
 */
export function render(options: TimingRenderOptions): boolean {
  const {
    canvas,
    data,
    showCurrentTime = true,
    showPhaseLabels = true,
    showDetails = true,
    animationProgress = 1,
    input
  } = options
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return false
  
  ctx.save()
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  
  // Layout constants
  const padding = 20
  const timelineY = canvas.height / 2
  const timelineHeight = canvas.height * 0.6
  const phaseHeight = timelineHeight / data.phases.length
  
  // Draw phase backgrounds
  data.phases.forEach((phase, index) => {
    const startX = padding + (phase.startTime / DEFAULT_ROUND_DURATION) * (canvas.width - 2 * padding)
    const endX = padding + (phase.endTime / DEFAULT_ROUND_DURATION) * (canvas.width - 2 * padding)
    const width = endX - startX
    const y = padding + index * phaseHeight
    
    ctx.fillStyle = phase.color + '20' // Add transparency
    ctx.fillRect(startX, y, width, phaseHeight - 2)
    
    if (showPhaseLabels) {
      ctx.fillStyle = phase.color
      ctx.font = '11px sans-serif'
      ctx.textAlign = 'left'
      ctx.fillText(phase.name, startX + 5, y + phaseHeight / 2)
    }
  })
  
  // Draw timeline
  const timelineStart = padding
  const timelineEnd = canvas.width - padding
  
  ctx.strokeStyle = '#475569'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(timelineStart, timelineY)
  ctx.lineTo(timelineEnd, timelineY)
  ctx.stroke()
  
  // Draw time markers
  for (let i = 0; i <= 10; i++) {
    const x = timelineStart + (i / 10) * (timelineEnd - timelineStart)
    const time = (i / 10) * DEFAULT_ROUND_DURATION / 1000
    
    ctx.strokeStyle = '#64748b'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(x, timelineY - 5)
    ctx.lineTo(x, timelineY + 5)
    ctx.stroke()
    
    ctx.fillStyle = '#94a3b8'
    ctx.font = '10px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${time.toFixed(0)}s`, x, timelineY + 20)
  }
  
  // Draw timing windows
  data.windows.forEach((window, index) => {
    renderWindow(ctx, window, timelineStart, timelineEnd, timelineY, showDetails, index, animationProgress)
  })
  
  // Draw current time indicator
  if (showCurrentTime && input) {
    const currentX = timelineStart + (input.currentTime / DEFAULT_ROUND_DURATION) * (timelineEnd - timelineStart)
    
    ctx.strokeStyle = '#ef4444'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(currentX, padding)
    ctx.lineTo(currentX, canvas.height - padding)
    ctx.stroke()
    
    // Draw time label
    ctx.fillStyle = '#ef4444'
    ctx.font = 'bold 12px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${(input.currentTime / 1000).toFixed(1)}s`, currentX, padding - 5)
  }
  
  // Draw recommendation
  if (data.recommendation && showDetails) {
    renderRecommendation(ctx, data.recommendation, canvas.width / 2, canvas.height - 30)
  }
  
  ctx.restore()
  return true
}

/**
 * Render a single timing window
 */
function renderWindow(
  ctx: CanvasRenderingContext2D,
  window: TimingWindow,
  timelineStart: number,
  timelineEnd: number,
  timelineY: number,
  showDetails: boolean,
  index: number,
  animationProgress: number
): void {
  const startX = timelineStart + (window.startTime / DEFAULT_ROUND_DURATION) * (timelineEnd - timelineStart)
  const endX = timelineStart + (window.endTime / DEFAULT_ROUND_DURATION) * (timelineEnd - timelineStart)
  const optimalX = timelineStart + (window.optimalTime / DEFAULT_ROUND_DURATION) * (timelineEnd - timelineStart)
  const width = (endX - startX) * animationProgress
  
  const row = index % 3
  const yOffset = (row - 1) * 25
  const y = timelineY + yOffset
  
  ctx.save()
  
  // Window bar
  const gradient = ctx.createLinearGradient(startX, y - 10, startX + width, y + 10)
  gradient.addColorStop(0, window.color + '40')
  gradient.addColorStop(0.5, window.color + '80')
  gradient.addColorStop(1, window.color + '40')
  
  ctx.fillStyle = gradient
  ctx.fillRect(startX, y - 8, width, 16)
  
  // Border
  ctx.strokeStyle = window.color
  ctx.lineWidth = 1
  ctx.strokeRect(startX, y - 8, width, 16)
  
  // Optimal time marker
  const optimalProgress = Math.min(1, animationProgress * 1.2)
  ctx.fillStyle = window.color
  ctx.beginPath()
  ctx.arc(startX + (optimalX - startX) * optimalProgress, y, 4, 0, Math.PI * 2)
  ctx.fill()
  
  // Score indicator
  if (showDetails) {
    ctx.fillStyle = window.color
    ctx.font = '9px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(`${Math.round(window.score * 100)}%`, startX + width / 2, y + 20)
  }
  
  ctx.restore()
}

/**
 * Render recommendation
 */
function renderRecommendation(
  ctx: CanvasRenderingContext2D,
  recommendation: TimingLensData['recommendation'],
  x: number,
  y: number
): void {
  const urgencyColors = {
    low: '#22c55e',
    medium: '#eab308',
    high: '#ef4444'
  }
  
  ctx.save()
  
  const text = `Next: ${recommendation.action} (${(recommendation.optimalTime / 1000).toFixed(1)}s)`
  ctx.font = 'bold 12px sans-serif'
  const metrics = ctx.measureText(text)
  
  // Background
  ctx.fillStyle = 'rgba(15, 23, 42, 0.9)'
  ctx.fillRect(x - metrics.width / 2 - 10, y - 15, metrics.width + 20, 30)
  
  // Border with urgency color
  ctx.strokeStyle = urgencyColors[recommendation.urgency]
  ctx.lineWidth = 2
  ctx.strokeRect(x - metrics.width / 2 - 10, y - 15, metrics.width + 20, 30)
  
  // Text
  ctx.fillStyle = '#e2e8f0'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(text, x, y)
  
  ctx.restore()
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if current time is within an optimal window
 * @param windows - Timing windows
 * @param currentTime - Current round time
 * @returns Active window or undefined
 */
export function getActiveWindow(
  windows: TimingWindow[],
  currentTime: number
): TimingWindow | undefined {
  return windows.find(w => currentTime >= w.startTime && currentTime <= w.endTime)
}

/**
 * Find the next upcoming window
 * @param windows - All timing windows
 * @param currentTime - Current round time
 * @returns Next window or undefined
 */
export function getNextWindow(
  windows: TimingWindow[],
  currentTime: number
): TimingWindow | undefined {
  return windows
    .filter(w => w.startTime > currentTime)
    .sort((a, b) => a.startTime - b.startTime)[0]
}

/**
 * Calculate time until next optimal action
 * @param data - Timing lens data
 * @param currentTime - Current round time
 * @returns Time in ms or undefined
 */
export function getTimeToNextOptimal(
  data: TimingLensData,
  currentTime: number
): number | undefined {
  const next = getNextWindow(data.windows, currentTime)
  return next ? next.optimalTime - currentTime : undefined
}

// ============================================================================
// Export
// ============================================================================

export default {
  calculate,
  render,
  getActiveWindow,
  getNextWindow,
  getTimeToNextOptimal,
  DEFAULT_PHASES,
  WINDOW_COLORS,
  DEFAULT_ROUND_DURATION
}
