/** [Ver001.000] */
/**
 * Player Trajectories Lens
 * ========================
 * Visualizes player movement patterns across the map.
 * Shows paths taken by players with velocity indicators,
 * fade effects, and predictive trajectory extensions.
 */

import type { Lens, GameData, LensOptions, PlayerPosition, TimedPosition } from '../types'
import {
  renderTrajectory,
  TrajectoryOptions,
  applyLOD,
  generatePredictiveTrajectory,
  TrajectoryPoint
} from '../utils/trajectory'

export interface PlayerTrajectoriesOptions extends Partial<LensOptions> {
  /** Filter by team */
  teamFilter?: 'attackers' | 'defenders' | null
  /** Filter by specific player */
  playerFilter?: string | null
  /** Show velocity vectors */
  showVelocity?: boolean
  /** Show predictive paths */
  showPredictive?: boolean
  /** Trail fade effect */
  trailFade?: boolean
  /** Trail length in seconds */
  trailLength?: number
  /** LOD distance for performance */
  lodDistance?: number
  /** Highlight rotations */
  highlightRotations?: boolean
}

/** Convert internal position to trajectory point */
function toTrajectoryPoint(pos: TimedPosition, velocity?: { x: number; y: number }): TrajectoryPoint {
  return {
    x: pos.x,
    y: pos.y,
    timestamp: pos.timestamp,
    velocity: velocity || pos.velocity
  }
}

/**
 * Detect rotation patterns in player movement
 */
function detectRotation(
  positions: TrajectoryPoint[],
  threshold: number = 200
): { isRotation: boolean; confidence: number } {
  if (positions.length < 5) return { isRotation: false, confidence: 0 }

  // Calculate total distance traveled
  let totalDistance = 0
  for (let i = 1; i < positions.length; i++) {
    const dx = positions[i].x - positions[i - 1].x
    const dy = positions[i].y - positions[i - 1].y
    totalDistance += Math.sqrt(dx * dx + dy * dy)
  }

  // Calculate straight-line distance from start to end
  const start = positions[0]
  const end = positions[positions.length - 1]
  const straightDistance = Math.sqrt(
    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
  )

  // High ratio indicates rotation (lots of movement, little net progress)
  const ratio = totalDistance > 0 ? totalDistance / straightDistance : 0
  const isRotation = ratio > 2 && totalDistance > threshold
  const confidence = Math.min(1, (ratio - 2) / 2)

  return { isRotation, confidence }
}

/**
 * Get color for player trajectory based on team and rotation status
 */
function getTrajectoryColor(
  team: 'attackers' | 'defenders',
  isRotation: boolean,
  isPredictive: boolean = false
): string {
  if (isPredictive) {
    return 'rgba(156, 163, 175, 0.4)'
  }

  if (team === 'attackers') {
    return isRotation ? '#f97316' : '#ef4444' // Orange for rotations, Red for pushes
  } else {
    return isRotation ? '#22d3ee' : '#3b82f6' // Cyan for rotations, Blue for holds
  }
}

export const playerTrajectoriesLens: Lens = {
  name: 'player-trajectories',
  displayName: 'Player Trajectories',
  description: 'Shows player movement patterns. Red/Blue = team paths, Orange/Cyan = rotations, Dashed = predicted.',
  opacity: 0.7,

  defaultOptions: {
    opacity: 0.7,
    color: 'rgb(59, 130, 246)',
    blendMode: 'source-over',
    animationSpeed: 1,
    showLabels: false
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: PlayerTrajectoriesOptions
  ): void => {
    const mergedOptions = { ...playerTrajectoriesLens.defaultOptions, ...options }
    const {
      teamFilter = null,
      playerFilter = null,
      showVelocity = true,
      showPredictive = true,
      trailFade = true,
      trailLength = 5000,
      lodDistance = 300,
      highlightRotations = true
    } = options || {}

    const currentTime = Date.now()

    ctx.save()
    ctx.globalAlpha = mergedOptions.opacity

    // Process each player's trajectory
    data.playerPositions.forEach(player => {
      // Apply filters
      if (teamFilter && player.team !== teamFilter) return
      if (playerFilter && player.playerId !== playerFilter) return

      // Filter positions by time window
      const cutoffTime = currentTime - trailLength
      const recentPositions = player.positions.filter(p => p.timestamp > cutoffTime)

      if (recentPositions.length < 2) return

      // Convert to trajectory points
      let trajectoryPoints: TrajectoryPoint[] = recentPositions.map((pos, index) => {
        // Calculate velocity if not present
        let velocity = pos.velocity
        if (!velocity && index > 0) {
          const prev = recentPositions[index - 1]
          const dt = pos.timestamp - prev.timestamp
          if (dt > 0) {
            velocity = {
              x: (pos.x - prev.x) / dt * 1000,
              y: (pos.y - prev.y) / dt * 1000
            }
          }
        }
        return toTrajectoryPoint(pos, velocity)
      })

      // Apply LOD simplification
      trajectoryPoints = applyLOD(trajectoryPoints, lodDistance)

      // Detect rotation patterns
      const { isRotation, confidence } = detectRotation(trajectoryPoints)

      // Get trajectory color
      const color = getTrajectoryColor(player.team, isRotation && highlightRotations)

      // Render main trajectory
      const trajectoryOptions: Partial<TrajectoryOptions> = {
        color,
        width: isRotation ? 4 : 3,
        opacity: mergedOptions.opacity,
        fade: trailFade,
        fadeDirection: 'end',
        fadeIntensity: 0.6,
        style: isRotation ? 'dashed' : 'solid',
        dashPattern: [6, 4],
        predictive: false,
        lineCap: 'round',
        lineJoin: 'round'
      }

      renderTrajectory(ctx, trajectoryPoints, trajectoryOptions)

      // Render predictive extension
      if (showPredictive && trajectoryPoints.length > 0) {
        const lastPoint = trajectoryPoints[trajectoryPoints.length - 1]
        if (lastPoint.velocity) {
          const predictivePoints = generatePredictiveTrajectory(lastPoint, 5, 500)

          ctx.save()
          ctx.strokeStyle = getTrajectoryColor(player.team, false, true)
          ctx.lineWidth = 2
          ctx.setLineDash([4, 4])

          ctx.beginPath()
          ctx.moveTo(lastPoint.x, lastPoint.y)
          predictivePoints.forEach(p => ctx.lineTo(p.x, p.y))
          ctx.stroke()

          // Draw certainty indicators
          predictivePoints.forEach(p => {
            ctx.fillStyle = `rgba(156, 163, 175, ${p.certainty || 0.3})`
            ctx.beginPath()
            ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
            ctx.fill()
          })

          ctx.restore()
        }
      }

      // Render velocity vectors
      if (showVelocity) {
        renderVelocityVectors(ctx, trajectoryPoints, player.team)
      }

      // Render rotation indicator
      if (highlightRotations && isRotation && confidence > 0.5) {
        renderRotationIndicator(ctx, trajectoryPoints, player.team, confidence)
      }

      // Render current position marker
      if (trajectoryPoints.length > 0) {
        const current = trajectoryPoints[trajectoryPoints.length - 1]
        ctx.fillStyle = player.team === 'attackers' ? '#ef4444' : '#3b82f6'
        ctx.beginPath()
        ctx.arc(current.x, current.y, 6, 0, Math.PI * 2)
        ctx.fill()

        // Player ID label
        ctx.fillStyle = 'white'
        ctx.font = '9px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(player.playerId.slice(0, 3), current.x, current.y)
      }
    })

    ctx.restore()
  }
}

/**
 * Render velocity vectors along trajectory
 */
function renderVelocityVectors(
  ctx: CanvasRenderingContext2D,
  points: TrajectoryPoint[],
  team: 'attackers' | 'defenders'
): void {
  const sampleInterval = Math.max(1, Math.floor(points.length / 8))

  ctx.save()
  ctx.strokeStyle = team === 'attackers' ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'
  ctx.lineWidth = 1

  for (let i = 0; i < points.length; i += sampleInterval) {
    const point = points[i]
    if (!point.velocity) continue

    const speed = Math.sqrt(
      point.velocity.x * point.velocity.x + point.velocity.y * point.velocity.y
    )

    if (speed < 10) continue // Skip slow movements

    const maxArrowLength = 30
    const arrowLength = Math.min(maxArrowLength, speed * 0.5)
    const angle = Math.atan2(point.velocity.y, point.velocity.x)

    const endX = point.x + Math.cos(angle) * arrowLength
    const endY = point.y + Math.sin(angle) * arrowLength

    // Draw arrow shaft
    ctx.beginPath()
    ctx.moveTo(point.x, point.y)
    ctx.lineTo(endX, endY)
    ctx.stroke()

    // Draw arrowhead
    ctx.fillStyle = ctx.strokeStyle
    ctx.beginPath()
    ctx.moveTo(endX, endY)
    ctx.lineTo(
      endX - 6 * Math.cos(angle - Math.PI / 6),
      endY - 6 * Math.sin(angle - Math.PI / 6)
    )
    ctx.lineTo(
      endX - 6 * Math.cos(angle + Math.PI / 6),
      endY - 6 * Math.sin(angle + Math.PI / 6)
    )
    ctx.fill()
  }

  ctx.restore()
}

/**
 * Render rotation pattern indicator
 */
function renderRotationIndicator(
  ctx: CanvasRenderingContext2D,
  points: TrajectoryPoint[],
  team: 'attackers' | 'defenders',
  confidence: number
): void {
  if (points.length < 3) return

  // Find center of rotation
  const centerX = points.reduce((sum, p) => sum + p.x, 0) / points.length
  const centerY = points.reduce((sum, p) => sum + p.y, 0) / points.length

  ctx.save()
  ctx.strokeStyle = team === 'attackers' ? '#f97316' : '#22d3ee'
  ctx.lineWidth = 2
  ctx.globalAlpha = confidence * 0.6

  // Draw rotation arc
  ctx.beginPath()
  ctx.arc(centerX, centerY, 20, 0, Math.PI * 2)
  ctx.stroke()

  // Draw rotation indicator icon
  ctx.fillStyle = ctx.strokeStyle
  ctx.font = 'bold 12px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('↻', centerX, centerY)

  ctx.restore()
}

export default playerTrajectoriesLens
