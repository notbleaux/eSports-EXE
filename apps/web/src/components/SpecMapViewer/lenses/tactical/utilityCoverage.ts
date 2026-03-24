/** [Ver001.000] */
/**
 * Utility Coverage System
 * =======================
 * Core system for tracking and rendering utility coverage areas.
 * Manages smoke, molotov, flash, and decoy effects with decay simulation.
 */

import type { Vector2D } from '@/hub-3-arepo/components/TacticalMap/types'
import type { TeamSide } from './predictionInterface'

/** Utility types */
export type UtilityType = 'smoke' | 'molly' | 'flash' | 'decoy'

/** Utility instance */
export interface UtilityInstance {
  /** Unique ID */
  id: string
  /** Utility type */
  type: UtilityType
  /** Position on map */
  position: Vector2D
  /** Coverage radius */
  radius: number
  /** Deploying team */
  team: TeamSide
  /** Deploy timestamp */
  deployTime: number
  /** Maximum duration (ms) */
  maxDuration: number
  /** Whether utility is still active */
  isActive: boolean
  /** Agent that deployed */
  agent?: string
  /** Ability name */
  ability?: string
}

/** Coverage area geometry */
export interface CoverageArea {
  /** Area center */
  center: Vector2D
  /** Area radius */
  radius: number
  /** Area polygon (for irregular shapes) */
  polygon?: Vector2D[]
  /** Current intensity (0-1) */
  intensity: number
}

/** Utility coverage manager */
export class UtilityCoverageManager {
  private utilities: Map<string, UtilityInstance> = new Map()
  private activeEffects: Map<string, CoverageArea> = new Map()

  /** Add a new utility instance */
  addUtility(utility: Omit<UtilityInstance, 'id' | 'isActive'>): string {
    const id = `util-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const instance: UtilityInstance = {
      ...utility,
      id,
      isActive: true
    }
    this.utilities.set(id, instance)
    return id
  }

  /** Remove a utility instance */
  removeUtility(id: string): boolean {
    return this.utilities.delete(id)
  }

  /** Get all active utilities */
  getActiveUtilities(): UtilityInstance[] {
    return Array.from(this.utilities.values()).filter(u => u.isActive)
  }

  /** Get utilities by type */
  getUtilitiesByType(type: UtilityType): UtilityInstance[] {
    return this.getActiveUtilities().filter(u => u.type === type)
  }

  /** Get utilities by team */
  getUtilitiesByTeam(team: TeamSide): UtilityInstance[] {
    return this.getActiveUtilities().filter(u => u.team === team)
  }

  /** Update all utilities (call each frame) */
  update(currentTime: number): void {
    this.utilities.forEach((utility, id) => {
      const elapsed = currentTime - utility.deployTime
      const isExpired = elapsed >= utility.maxDuration

      if (isExpired && utility.isActive) {
        utility.isActive = false
        this.activeEffects.delete(id)
      } else if (utility.isActive) {
        // Update coverage area based on decay
        const decayProgress = elapsed / utility.maxDuration
        const coverage = this.calculateCoverage(utility, decayProgress)
        this.activeEffects.set(id, coverage)
      }
    })
  }

  /** Calculate coverage area for a utility */
  private calculateUtility(
    utility: UtilityInstance,
    decayProgress: number
  ): CoverageArea {
    // Different decay curves for different utility types
    let intensity: number
    let radius: number

    switch (utility.type) {
      case 'smoke':
        // Smoke stays full size then fades quickly at end
        intensity = decayProgress > 0.8 ? 1 - (decayProgress - 0.8) * 5 : 1
        radius = utility.radius
        break
      case 'molly':
        // Molly burns consistently
        intensity = 1 - decayProgress * 0.3
        radius = utility.radius * (0.9 + Math.random() * 0.2)
        break
      case 'flash':
        // Flash is instant then fades
        intensity = Math.max(0, 1 - decayProgress * 3)
        radius = utility.radius * (1 - decayProgress)
        break
      case 'decoy':
        // Decoy stays constant
        intensity = 0.7
        radius = utility.radius
        break
      default:
        intensity = 1 - decayProgress
        radius = utility.radius
    }

    return {
      center: utility.position,
      radius,
      intensity: Math.max(0, intensity)
    }
  }

  /** Get combined coverage for a position */
  getCoverageAt(position: Vector2D): {
    totalIntensity: number
    types: Map<UtilityType, number>
    teams: Map<TeamSide, number>
  } {
    const types = new Map<UtilityType, number>()
    const teams = new Map<TeamSide, number>()
    let totalIntensity = 0

    this.activeEffects.forEach((area, id) => {
      const utility = this.utilities.get(id)
      if (!utility) return

      const dist = Math.hypot(
        position.x - area.center.x,
        position.y - area.center.y
      )

      if (dist <= area.radius) {
        // Calculate falloff
        const falloff = 1 - (dist / area.radius)
        const contribution = area.intensity * falloff

        totalIntensity += contribution

        // Track by type
        const currentType = types.get(utility.type) || 0
        types.set(utility.type, currentType + contribution)

        // Track by team
        const currentTeam = teams.get(utility.team) || 0
        teams.set(utility.team, currentTeam + contribution)
      }
    })

    return { totalIntensity, types, teams }
  }

  /** Check if position is in smoke */
  isInSmoke(position: Vector2D): boolean {
    return this.getUtilitiesByType('smoke').some(smoke => {
      const dist = Math.hypot(
        position.x - smoke.position.x,
        position.y - smoke.position.y
      )
      return dist <= smoke.radius * 0.8 // Inner 80% is fully smoked
    })
  }

  /** Check if position is in molly */
  isInMolly(position: Vector2D): boolean {
    return this.getUtilitiesByType('molly').some(molly => {
      const dist = Math.hypot(
        position.x - molly.position.x,
        position.y - molly.position.y
      )
      return dist <= molly.radius
    })
  }

  /** Get remaining duration for a utility */
  getRemainingTime(id: string, currentTime: number): number {
    const utility = this.utilities.get(id)
    if (!utility || !utility.isActive) return 0

    const elapsed = currentTime - utility.deployTime
    return Math.max(0, utility.maxDuration - elapsed)
  }

  /** Get decay progress for a utility (0-1) */
  getDecayProgress(id: string, currentTime: number): number {
    const utility = this.utilities.get(id)
    if (!utility) return 1

    const elapsed = currentTime - utility.deployTime
    return Math.min(1, elapsed / utility.maxDuration)
  }

  /** Clear all utilities */
  clear(): void {
    this.utilities.clear()
    this.activeEffects.clear()
  }

  /** Get utility statistics */
  getStats(): {
    total: number
    byType: Record<UtilityType, number>
    byTeam: Record<TeamSide, number>
  } {
    const active = this.getActiveUtilities()

    const byType: Record<UtilityType, number> = {
      smoke: 0,
      molly: 0,
      flash: 0,
      decoy: 0
    }

    const byTeam: Record<TeamSide, number> = {
      attackers: 0,
      defenders: 0
    }

    active.forEach(u => {
      byType[u.type]++
      byTeam[u.team]++
    })

    return {
      total: active.length,
      byType,
      byTeam
    }
  }

  /** Serialize for saving/transfer */
  serialize(): UtilityInstance[] {
    return Array.from(this.utilities.values())
  }

  /** Deserialize and restore */
  deserialize(data: UtilityInstance[]): void {
    this.clear()
    data.forEach(u => this.utilities.set(u.id, u))
  }

  private calculateCoverage(
    utility: UtilityInstance,
    decayProgress: number
  ): CoverageArea {
    return this.calculateUtility(utility, decayProgress);
  }
}

/** Default utility durations (ms) */
export const UTILITY_DURATIONS: Record<UtilityType, number> = {
  smoke: 18000,  // 18 seconds
  molly: 7000,   // 7 seconds
  flash: 2000,   // 2 seconds (effect duration)
  decoy: 15000   // 15 seconds
}

/** Default utility radii */
export const UTILITY_RADII: Record<UtilityType, number> = {
  smoke: 25,
  molly: 15,
  flash: 20,
  decoy: 10
}

/** Create a utility instance with defaults */
export function createUtility(
  type: UtilityType,
  position: Vector2D,
  team: TeamSide,
  options?: Partial<UtilityInstance>
): Omit<UtilityInstance, 'id' | 'isActive'> {
  return {
    type,
    position,
    team,
    radius: UTILITY_RADII[type],
    maxDuration: UTILITY_DURATIONS[type],
    deployTime: Date.now(),
    ...options
  }
}

/** Global utility manager instance */
export const utilityManager = new UtilityCoverageManager()

export default utilityManager
