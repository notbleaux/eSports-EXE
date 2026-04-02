// @ts-nocheck
/** [Ver001.000] */
/**
 * Flash Assists Lens
 * ==================
 * Visualizes flash → kill correlation.
 * Shows flashbang locations, duration, and connected kills.
 * Draws lines from flash origin to assisted kills with timing indicators.
 */

import type { Lens, GameData, LensOptions, KillEvent, SoundEvent, Vector2D } from '../types'

export interface FlashAssistsOptions extends Partial<LensOptions> {
  /** Time window for flash-to-kill correlation (ms) */
  correlationWindow?: number
  /** Maximum flash effect distance */
  maxFlashDistance?: number
  /** Show flash duration indicators */
  showDuration?: boolean
  /** Show blinded player indicators */
  showBlinded?: boolean
  /** Highlight multi-kill flashes */
  highlightMultiKills?: boolean
  /** Minimum assists to show */
  minAssists?: number
}

/** Flash event derived from sound events */
interface FlashEvent {
  id: string
  position: Vector2D
  timestamp: number
  source: string
  duration: number // Flash duration in ms
  affectedPlayers: string[]
}

/** Flash assist - connection between flash and kill */
interface FlashAssist {
  flash: FlashEvent
  kill: KillEvent
  timeDiff: number
  distance: number
}

/**
 * Extract flash events from sound events
 */
function extractFlashEvents(soundEvents: SoundEvent[]): FlashEvent[] {
  const flashAbilities = ['flash', 'paranoia', 'blinding', 'curveball']

  return soundEvents
    .filter(event =>
      event.type === 'ability' &&
      flashAbilities.some(f => event.source.toLowerCase().includes(f))
    )
    .map((event, index) => ({
      id: `flash-${index}`,
      position: event.position,
      timestamp: event.timestamp,
      source: event.source,
      duration: 2000 + Math.random() * 1000, // Simulated duration
      affectedPlayers: [] // Would be populated from actual game data
    }))
}

/**
 * Correlate flashes with kills
 */
function correlateFlashesWithKills(
  flashes: FlashEvent[],
  kills: KillEvent[],
  window: number
): FlashAssist[] {
  const assists: FlashAssist[] = []

  flashes.forEach(flash => {
    kills.forEach(kill => {
      const timeDiff = kill.timestamp - flash.timestamp

      if (timeDiff >= 0 && timeDiff <= window) {
        const dx = kill.position.x - flash.position.x
        const dy = kill.position.y - flash.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        assists.push({
          flash,
          kill,
          timeDiff,
          distance
        })
      }
    })
  })

  return assists
}

/**
 * Group assists by flash event
 */
function groupAssistsByFlash(assists: FlashAssist[]): Map<string, FlashAssist[]> {
  const groups = new Map<string, FlashAssist[]>()

  assists.forEach(assist => {
    const list = groups.get(assist.flash.id) || []
    list.push(assist)
    groups.set(assist.flash.id, list)
  })

  return groups
}

export const flashAssistsLens: Lens = {
  name: 'flash-assists',
  displayName: 'Flash Assists',
  description: 'Shows flash → kill correlation. Lines connect flashes to assisted kills. Thicker lines = more assists.',
  opacity: 0.8,

  defaultOptions: {
    opacity: 0.8,
    color: 'rgb(251, 191, 36)',
    blendMode: 'screen',
    animationSpeed: 1,
    showLabels: false
  },

  render: (
    ctx: CanvasRenderingContext2D,
    data: GameData,
    options?: FlashAssistsOptions
  ): void => {
    const mergedOptions = { ...flashAssistsLens.defaultOptions, ...options }
    const {
      correlationWindow = 4000,
      maxFlashDistance = 800,
      showDuration = true,
      showBlinded = true,
      highlightMultiKills = true,
      minAssists = 1
    } = options || {}

    const flashEvents = extractFlashEvents(data.soundEvents)
    const assists = correlateFlashesWithKills(flashEvents, data.killEvents, correlationWindow)
    const groupedAssists = groupAssistsByFlash(assists)

    if (assists.length === 0) return

    ctx.save()
    ctx.globalAlpha = mergedOptions.opacity

    // Draw flash effect areas
    flashEvents.forEach(flash => {
      const assistCount = groupedAssists.get(flash.id)?.length || 0

      if (assistCount < minAssists) return

      const x = flash.position.x
      const y = flash.position.y
      const isMultiKill = assistCount >= 2

      // Draw flash origin marker
      const markerSize = 8 + assistCount * 2

      // Glow effect
      const glowRadius = maxFlashDistance * 0.6
      const glowGradient = ctx.createRadialGradient(x, y, 0, x, y, glowRadius)
      glowGradient.addColorStop(0, 'rgba(251, 191, 36, 0.2)')
      glowGradient.addColorStop(0.5, 'rgba(251, 191, 36, 0.1)')
      glowGradient.addColorStop(1, 'rgba(251, 191, 36, 0)')
      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(x, y, glowRadius, 0, Math.PI * 2)
      ctx.fill()

      // Main flash marker
      ctx.fillStyle = isMultiKill && highlightMultiKills ? '#f59e0b' : '#fbbf24'
      ctx.beginPath()
      ctx.arc(x, y, markerSize, 0, Math.PI * 2)
      ctx.fill()

      // Star shape for multi-kills
      if (isMultiKill && highlightMultiKills) {
        ctx.strokeStyle = '#dc2626'
        ctx.lineWidth = 2
        ctx.beginPath()
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          const r = i % 2 === 0 ? markerSize + 6 : markerSize + 2
          const px = x + Math.cos(angle) * r
          const py = y + Math.sin(angle) * r
          if (i === 0) ctx.moveTo(px, py)
          else ctx.lineTo(px, py)
        }
        ctx.closePath()
        ctx.stroke()
      }

      // Flash icon
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 10px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('⚡', x, y)

      // Show assist count
      if (assistCount > 0) {
        ctx.fillStyle = '#dc2626'
        ctx.font = 'bold 11px sans-serif'
        ctx.fillText(assistCount.toString(), x + markerSize + 8, y - markerSize - 2)
      }

      // Duration indicator
      if (showDuration) {
        const durationSec = (flash.duration / 1000).toFixed(1)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
        ctx.font = '9px sans-serif'
        ctx.fillText(`${durationSec}s`, x, y + markerSize + 12)
      }
    })

    // Draw assist connections
    groupedAssists.forEach((flashAssists, flashId) => {
      if (flashAssists.length < minAssists) return

      const flash = flashAssists[0].flash
      const isMultiKill = flashAssists.length >= 2

      flashAssists.forEach(assist => {
        const x1 = flash.position.x
        const y1 = flash.position.y
        const x2 = assist.kill.position.x
        const y2 = assist.kill.position.y

        // Line thickness based on number of assists
        const lineWidth = isMultiKill ? 3 : 1.5

        // Color based on timing (faster = more intense)
        const timingRatio = 1 - (assist.timeDiff / correlationWindow)
        const alpha = 0.4 + timingRatio * 0.4

        // Draw connection line
        ctx.strokeStyle = isMultiKill
          ? `rgba(220, 38, 38, ${alpha})` // Red for multi-kills
          : `rgba(251, 191, 36, ${alpha})` // Amber for single assists
        ctx.lineWidth = lineWidth

        // Animated dash effect
        const dashOffset = (Date.now() / 50) % 20
        ctx.setLineDash([5, 5])
        ctx.lineDashOffset = -dashOffset

        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.stroke()
        ctx.setLineDash([])

        // Draw timing indicator at midpoint
        const midX = (x1 + x2) / 2
        const midY = (y1 + y2) / 2

        ctx.fillStyle = 'white'
        ctx.font = '9px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${(assist.timeDiff / 1000).toFixed(1)}s`, midX, midY - 8)

        // Highlight assisted kill
        ctx.fillStyle = isMultiKill ? '#dc2626' : '#fbbf24'
        ctx.beginPath()
        ctx.arc(x2, y2, 5, 0, Math.PI * 2)
        ctx.fill()

        // Kill marker
        ctx.strokeStyle = 'white'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(x2 - 4, y2 - 4)
        ctx.lineTo(x2 + 4, y2 + 4)
        ctx.moveTo(x2 + 4, y2 - 4)
        ctx.lineTo(x2 - 4, y2 + 4)
        ctx.stroke()
      })
    })

    // Draw blinded player indicators
    if (showBlinded) {
      drawBlindedIndicators(ctx, flashEvents, data.playerPositions)
    }

    ctx.restore()
  }
}

/**
 * Draw indicators for players blinded by flashes
 */
function drawBlindedIndicators(
  ctx: CanvasRenderingContext2D,
  flashes: FlashEvent[],
  playerPositions: { playerId: string; positions: { x: number; y: number; timestamp: number }[] }[]
): void {
  flashes.forEach(flash => {
    // Find players near flash at time of detonation
    playerPositions.forEach(player => {
      const posAtTime = player.positions.find(p =>
        Math.abs(p.timestamp - flash.timestamp) < 500
      )

      if (posAtTime) {
        const dx = posAtTime.x - flash.position.x
        const dy = posAtTime.y - flash.position.y
        const distance = Math.sqrt(dx * dx + dy * dy)

        if (distance < 400) { // Within flash range
          // Draw blinded indicator
          ctx.strokeStyle = 'rgba(251, 191, 36, 0.5)'
          ctx.lineWidth = 1
          ctx.setLineDash([2, 2])
          ctx.beginPath()
          ctx.arc(posAtTime.x, posAtTime.y, 15, 0, Math.PI * 2)
          ctx.stroke()
          ctx.setLineDash([])

          // Blind duration indicator
          ctx.fillStyle = 'rgba(251, 191, 36, 0.3)'
          ctx.beginPath()
          ctx.arc(posAtTime.x, posAtTime.y, 8, 0, Math.PI * 2)
          ctx.fill()
        }
      }
    })
  })
}

export default flashAssistsLens
