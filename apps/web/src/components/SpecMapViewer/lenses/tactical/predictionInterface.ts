/** [Ver001.000] */
/**
 * Tactical Prediction Models Interface
 * ====================================
 * Defines interfaces for AI-driven tactical predictions used by SpecMap lenses.
 * Provides rotation prediction, outcome forecasting, and timing analysis.
 */

import type { Vector2D } from '@/hub-3-arepo/components/TacticalMap/types'

/** Re-export Vector2D for lens consumers */
export type { Vector2D }
import type { PlayerPosition, KillEvent, GameData } from '../types'

/** Team side definition */
export type TeamSide = 'attackers' | 'defenders'

/** Bombsite identifier */
export type Bombsite = 'A' | 'B' | 'Mid'

/** Rotation prediction result */
export interface RotationPrediction {
  /** Predicted from site */
  from: Bombsite
  /** Predicted to site */
  to: Bombsite
  /** Confidence level (0-1) */
  confidence: number
  /** Estimated time to rotation completion (ms) */
  estimatedTime: number
  /** Number of players predicted to rotate */
  playerCount: number
  /** Pathway preference (main, flanking, alternative) */
  pathway: 'main' | 'flank' | 'alternative'
  /** Risk assessment */
  riskLevel: 'low' | 'medium' | 'high'
}

/** Outcome prediction result */
export interface OutcomePrediction {
  /** Predicted winner side */
  predictedWinner: TeamSide
  /** Confidence in prediction (0-1) */
  confidence: number
  /** Key factors influencing prediction */
  factors: PredictionFactor[]
  /** Recommended action */
  recommendedAction: string
  /** Success probability for attackers */
  attackerWinProb: number
  /** Success probability for defenders */
  defenderWinProb: number
}

/** Factor contributing to prediction */
export interface PredictionFactor {
  /** Factor name */
  name: string
  /** Impact weight (-1 to 1, negative favors defenders) */
  weight: number
  /** Description */
  description: string
}

/** Timing window analysis */
export interface TimingWindow {
  /** Window start time (ms from round start) */
  startTime: number
  /** Window end time */
  endTime: number
  /** Window duration */
  duration: number
  /** Optimal execute time within window */
  optimalTime: number
  /** Success probability at optimal time */
  successProbability: number
  /** Prerequisites for window */
  prerequisites: string[]
  /** Counter-play risks */
  risks: string[]
}

/** Push probability analysis */
export interface PushProbability {
  /** Target site */
  targetSite: Bombsite
  /** Probability of push (0-1) */
  probability: number
  /** Expected timing */
  expectedTiming: number
  /** Likely composition */
  expectedComposition: string[]
  /** Utility commitment prediction */
  utilityCommitment: {
    smokes: number
    flashes: number
    mollies: number
  }
}

/** Clutch zone analysis */
export interface ClutchZone {
  /** Zone center position */
  position: Vector2D
  /** Zone radius */
  radius: number
  /** Success rate in this zone (0-1) */
  successRate: number
  /** Number of historical clutch attempts */
  sampleSize: number
  /** Recommended agents for this zone */
  recommendedAgents: string[]
  /** Cover quality rating */
  coverRating: number
  /** Escape route quality */
  escapeRating: number
  /** Line of sight advantages */
  losAdvantages: string[]
}

/** Utility coverage analysis */
export interface UtilityCoverage {
  /** Utility type */
  type: 'smoke' | 'molly' | 'flash' | 'decoy'
  /** Coverage center */
  position: Vector2D
  /** Coverage radius */
  radius: number
  /** Time remaining (ms) */
  timeRemaining: number
  /** Maximum duration */
  maxDuration: number
  /** Decay progress (0-1) */
  decayProgress: number
  /** Team that deployed */
  team: TeamSide
  /** Affected area geometry */
  affectedArea: Vector2D[]
}

/** Trade route analysis */
export interface TradeRoute {
  /** Route identifier */
  id: string
  /** Route name */
  name: string
  /** Starting position */
  start: Vector2D
  /** Ending position */
  end: Vector2D
  /** Route waypoints */
  waypoints: Vector2D[]
  /** Route safety rating (0-1) */
  safetyRating: number
  /** Expected travel time (ms) */
  travelTime: number
  /** Trade success rate (0-1) */
  tradeSuccessRate: number
  /** Counter-utility risks */
  utilityRisks: string[]
  /** Optimal agents for route */
  optimalAgents: string[]
}

/** Information gap analysis */
export interface InfoGap {
  /** Gap region center */
  center: Vector2D
  /** Gap region radius */
  radius: number
  /** Time since last intel (ms) */
  timeSinceIntel: number
  /** Information confidence (0-1, 0 = no info) */
  confidence: number
  /** Risk level if enemies present */
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
  /** Recommended info gathering actions */
  recommendedActions: string[]
  /** Areas visible from gap */
  visibleAreas: string[]
}

/** Economic pressure analysis */
export interface EcoPressure {
  /** Team under pressure */
  team: TeamSide
  /** Pressure level (0-1) */
  pressureLevel: number
  /** Round type prediction */
  predictedRoundType: 'force' | 'eco' | 'half-buy' | 'full-buy'
  /** Risk of force buy */
  forceBuyRisk: number
  /** Expected utility available */
  expectedUtility: {
    smokes: number
    flashes: number
    mollies: number
  }
  /** Aggression prediction */
  aggressionPrediction: 'passive' | 'moderate' | 'aggressive' | 'desperate'
  /** Counter-strategy recommendations */
  counterStrategies: string[]
}

/** Game state for predictions */
export interface PredictionGameState {
  /** Current round time (ms) */
  roundTime: number
  /** Score state */
  score: {
    attackers: number
    defenders: number
  }
  /** Economic state */
  economy: {
    attackers: number
    defenders: number
  }
  /** Alive players by team */
  alivePlayers: {
    attackers: string[]
    defenders: string[]
  }
  /** Current player positions */
  positions: PlayerPosition[]
  /** Recent kill events */
  recentKills: KillEvent[]
  /** Bomb status */
  bombStatus: 'planted' | 'dropped' | 'carried' | 'exploded' | 'defused' | null
  /** Bomb position if planted/dropped */
  bombPosition?: Vector2D
  /** Active utility */
  activeUtility: UtilityCoverage[]
  /** Map control assessment */
  mapControl: {
    attackers: number
    defenders: number
  }
}

/** Prediction model interface */
export interface PredictionModel {
  /** Predict team rotations */
  predictRotations(positions: PlayerPosition[], gameState: PredictionGameState): RotationPrediction[]
  /** Predict round outcome */
  predictOutcome(gameState: PredictionGameState): OutcomePrediction
  /** Predict optimal timing windows */
  predictTimingWindows(gameState: PredictionGameState): TimingWindow[]
  /** Predict site push probability */
  predictPushProbability(gameState: PredictionGameState): PushProbability[]
  /** Identify clutch zones */
  identifyClutchZones(position: Vector2D, team: TeamSide): ClutchZone[]
  /** Analyze utility coverage */
  analyzeUtilityCoverage(gameState: PredictionGameState): UtilityCoverage[]
  /** Calculate trade routes */
  calculateTradeRoutes(from: Vector2D, to: Vector2D, gameState: PredictionGameState): TradeRoute[]
  /** Identify information gaps */
  identifyInfoGaps(gameState: PredictionGameState): InfoGap[]
  /** Assess economic pressure */
  assessEcoPressure(gameState: PredictionGameState): EcoPressure
}

/** Simple heuristic-based prediction model */
export class HeuristicPredictionModel implements PredictionModel {
  predictRotations(positions: PlayerPosition[], gameState: PredictionGameState): RotationPrediction[] {
    const predictions: RotationPrediction[] = []
    const { alivePlayers, bombStatus } = gameState

    // Detect attacker rotations when bomb is at opposite site
    if (bombStatus === 'carried' || bombStatus === 'dropped') {
      const attackerPositions = positions.filter(p => p.team === 'attackers')
      const siteACount = this.countPlayersAtSite(attackerPositions, 'A')
      const siteBCount = this.countPlayersAtSite(attackerPositions, 'B')

      // If stacked at one site, predict rotation to other
      if (siteACount >= 3 && siteBCount === 0) {
        predictions.push({
          from: 'A',
          to: 'B',
          confidence: 0.7,
          estimatedTime: 8000,
          playerCount: siteACount,
          pathway: 'main',
          riskLevel: 'medium'
        })
      } else if (siteBCount >= 3 && siteACount === 0) {
        predictions.push({
          from: 'B',
          to: 'A',
          confidence: 0.7,
          estimatedTime: 8000,
          playerCount: siteBCount,
          pathway: 'main',
          riskLevel: 'medium'
        })
      }
    }

    // Defender retake rotation when bomb planted
    if (bombStatus === 'planted') {
      const bombSite = this.inferBombSite(gameState.bombPosition)
      const oppositeSite = bombSite === 'A' ? 'B' : 'A'
      
      predictions.push({
        from: oppositeSite,
        to: bombSite,
        confidence: 0.85,
        estimatedTime: 5000,
        playerCount: alivePlayers.defenders.length,
        pathway: 'main',
        riskLevel: 'high'
      })
    }

    return predictions
  }

  predictOutcome(gameState: PredictionGameState): OutcomePrediction {
    const { alivePlayers, economy, bombStatus, score } = gameState
    const factors: PredictionFactor[] = []
    let attackerScore = 0
    let defenderScore = 0

    // Player advantage factor
    const playerAdvantage = alivePlayers.attackers.length - alivePlayers.defenders.length
    if (playerAdvantage > 0) {
      attackerScore += playerAdvantage * 0.15
      factors.push({
        name: 'Player Advantage',
        weight: playerAdvantage * 0.15,
        description: `${playerAdvantage} more attackers alive`
      })
    } else if (playerAdvantage < 0) {
      defenderScore += Math.abs(playerAdvantage) * 0.15
      factors.push({
        name: 'Player Advantage',
        weight: playerAdvantage * 0.15,
        description: `${Math.abs(playerAdvantage)} more defenders alive`
      })
    }

    // Bomb planted factor
    if (bombStatus === 'planted') {
      attackerScore += 0.25
      factors.push({
        name: 'Bomb Planted',
        weight: 0.25,
        description: 'Bomb planted, defenders must retake'
      })
    }

    // Economy factor
    const ecoAdvantage = economy.attackers - economy.defenders
    if (ecoAdvantage > 1000) {
      attackerScore += 0.1
      factors.push({
        name: 'Economic Advantage',
        weight: 0.1,
        description: 'Attackers have better equipment'
      })
    } else if (ecoAdvantage < -1000) {
      defenderScore += 0.1
      factors.push({
        name: 'Economic Advantage',
        weight: -0.1,
        description: 'Defenders have better equipment'
      })
    }

    // Map control factor
    const controlDiff = gameState.mapControl.attackers - gameState.mapControl.defenders
    if (controlDiff > 0.2) {
      attackerScore += 0.1
      factors.push({
        name: 'Map Control',
        weight: 0.1,
        description: 'Attackers control more map area'
      })
    } else if (controlDiff < -0.2) {
      defenderScore += 0.1
      factors.push({
        name: 'Map Control',
        weight: -0.1,
        description: 'Defenders control more map area'
      })
    }

    const total = attackerScore + defenderScore
    const attackerWinProb = total > 0 ? attackerScore / total : 0.5
    const defenderWinProb = 1 - attackerWinProb
    const confidence = 0.4 + Math.abs(attackerWinProb - 0.5) * 0.4

    return {
      predictedWinner: attackerWinProb > 0.5 ? 'attackers' : 'defenders',
      confidence,
      factors,
      recommendedAction: attackerWinProb > 0.5 
        ? 'Maintain pressure and close out the round'
        : 'Play for picks and retake opportunities',
      attackerWinProb,
      defenderWinProb
    }
  }

  predictTimingWindows(gameState: PredictionGameState): TimingWindow[] {
    const windows: TimingWindow[] = []
    const { roundTime, alivePlayers, bombStatus } = gameState

    // Early round window (first 30s)
    if (roundTime < 30000) {
      windows.push({
        startTime: 15000,
        endTime: 30000,
        duration: 15000,
        optimalTime: 22000,
        successProbability: alivePlayers.attackers.length >= 4 ? 0.6 : 0.4,
        prerequisites: ['Gather intel', 'Coordinate utility'],
        risks: ['Defender early aggression', 'Off-angle holds']
      })
    }

    // Mid-round window (30-70s)
    if (roundTime >= 30000 && roundTime < 70000) {
      windows.push({
        startTime: 45000,
        endTime: 70000,
        duration: 25000,
        optimalTime: 55000,
        successProbability: 0.65,
        prerequisites: ['Site control established', 'Utility advantage'],
        risks: ['Rotations complete', 'Defensive utility deployed']
      })
    }

    // Late round window (70s+)
    if (roundTime >= 70000 && !bombStatus) {
      windows.push({
        startTime: 70000,
        endTime: 100000,
        duration: 30000,
        optimalTime: 80000,
        successProbability: 0.45,
        prerequisites: ['Fast execute', 'Minimize defender setup time'],
        risks: ['Time pressure', 'Desperate plays']
      })
    }

    return windows
  }

  predictPushProbability(gameState: PredictionGameState): PushProbability[] {
    const probabilities: PushProbability[] = []
    const { roundTime, alivePlayers, positions } = gameState

    // Analyze attacker positioning
    const attackerPositions = positions.filter(p => p.team === 'attackers')
    const siteAWeight = this.calculateSiteWeight(attackerPositions, 'A')
    const siteBWeight = this.calculateSiteWeight(attackerPositions, 'B')

    const totalWeight = siteAWeight + siteBWeight
    if (totalWeight === 0) return probabilities

    probabilities.push({
      targetSite: 'A',
      probability: siteAWeight / totalWeight,
      expectedTiming: roundTime + 10000,
      expectedComposition: this.predictComposition(alivePlayers.attackers),
      utilityCommitment: {
        smokes: 2,
        flashes: 3,
        mollies: 1
      }
    })

    probabilities.push({
      targetSite: 'B',
      probability: siteBWeight / totalWeight,
      expectedTiming: roundTime + 10000,
      expectedComposition: this.predictComposition(alivePlayers.attackers),
      utilityCommitment: {
        smokes: 2,
        flashes: 3,
        mollies: 1
      }
    })

    return probabilities
  }

  identifyClutchZones(position: Vector2D, team: TeamSide): ClutchZone[] {
    // Define known clutch spots (simplified for Bind)
    const zones: ClutchZone[] = [
      {
        position: { x: 25, y: 25 },
        radius: 15,
        successRate: 0.35,
        sampleSize: 42,
        recommendedAgents: ['Cypher', 'Killjoy', 'Sage'],
        coverRating: 0.8,
        escapeRating: 0.6,
        losAdvantages: ['Multiple angles', 'Vertical cover']
      },
      {
        position: { x: 50, y: 45 },
        radius: 15,
        successRate: 0.32,
        sampleSize: 38,
        recommendedAgents: ['Chamber', 'Jett', 'Raze'],
        coverRating: 0.7,
        escapeRating: 0.7,
        losAdvantages: ['Open sightlines', 'Retreat options']
      }
    ]

    // Sort by distance to position
    return zones.sort((a, b) => {
      const distA = Math.hypot(a.position.x - position.x, a.position.y - position.y)
      const distB = Math.hypot(b.position.x - position.x, b.position.y - position.y)
      return distA - distB
    })
  }

  analyzeUtilityCoverage(gameState: PredictionGameState): UtilityCoverage[] {
    return gameState.activeUtility
  }

  calculateTradeRoutes(from: Vector2D, to: Vector2D, gameState: PredictionGameState): TradeRoute[] {
    const routes: TradeRoute[] = []
    const { positions } = gameState

    // Main route (direct)
    routes.push({
      id: 'main',
      name: 'Main Push',
      start: from,
      end: to,
      waypoints: [
        { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 }
      ],
      safetyRating: 0.5,
      travelTime: 5000,
      tradeSuccessRate: 0.6,
      utilityRisks: ['Flash push', 'Molly delay'],
      optimalAgents: ['Raze', 'Phoenix', 'Neon']
    })

    // Flank route (safer but longer)
    routes.push({
      id: 'flank',
      name: 'Flank Route',
      start: from,
      end: to,
      waypoints: [
        { x: from.x + 10, y: from.y },
        { x: to.x + 10, y: to.y }
      ],
      safetyRating: 0.7,
      travelTime: 8000,
      tradeSuccessRate: 0.75,
      utilityRisks: ['Rotation catch', 'Noise detection'],
      optimalAgents: ['Omen', 'Jett', 'Yoru']
    })

    return routes.sort((a, b) => b.tradeSuccessRate - a.tradeSuccessRate)
  }

  identifyInfoGaps(gameState: PredictionGameState): InfoGap[] {
    const gaps: InfoGap[] = []
    const { positions, recentKills } = gameState

    // Define key map areas
    const areas = [
      { name: 'A Site', center: { x: 25, y: 25 }, radius: 20 },
      { name: 'B Site', center: { x: 50, y: 45 }, radius: 20 },
      { name: 'Mid', center: { x: 32, y: 32 }, radius: 15 }
    ]

    areas.forEach(area => {
      // Check if any player has visibility
      const hasVision = positions.some(p => {
        const lastPos = p.positions[p.positions.length - 1]
        if (!lastPos) return false
        const dist = Math.hypot(lastPos.x - area.center.x, lastPos.y - area.center.y)
        return dist < 30 // Simplified visibility check
      })

      if (!hasVision) {
        const lastKill = recentKills.find(k => {
          const dist = Math.hypot(k.position.x - area.center.x, k.position.y - area.center.y)
          return dist < area.radius
        })

        const timeSinceIntel = lastKill 
          ? gameState.roundTime - lastKill.timestamp 
          : gameState.roundTime

        gaps.push({
          center: area.center,
          radius: area.radius,
          timeSinceIntel,
          confidence: 0,
          riskLevel: timeSinceIntel > 30000 ? 'high' : 'medium',
          recommendedActions: ['Send scout', 'Use recon ability', 'Pre-fire common angles'],
          visibleAreas: []
        })
      }
    })

    return gaps
  }

  assessEcoPressure(gameState: PredictionGameState): EcoPressure {
    const { economy, score } = gameState
    const team = 'attackers' // Focus on attackers for this analysis
    const teamEco = economy.attackers

    // Determine pressure level
    let pressureLevel = 0
    let predictedRoundType: EcoPressure['predictedRoundType'] = 'full-buy'
    let aggressionPrediction: EcoPressure['aggressionPrediction'] = 'moderate'

    if (teamEco < 2000) {
      pressureLevel = 0.9
      predictedRoundType = 'eco'
      aggressionPrediction = 'desperate'
    } else if (teamEco < 4000) {
      pressureLevel = 0.6
      predictedRoundType = 'force'
      aggressionPrediction = 'aggressive'
    } else if (teamEco < 6000) {
      pressureLevel = 0.3
      predictedRoundType = 'half-buy'
      aggressionPrediction = 'moderate'
    }

    // Adjust based on score deficit
    const scoreDeficit = score.defenders - score.attackers
    if (scoreDeficit >= 3) {
      pressureLevel += 0.2
      aggressionPrediction = 'aggressive'
    }

    return {
      team,
      pressureLevel: Math.min(1, pressureLevel),
      predictedRoundType,
      forceBuyRisk: pressureLevel > 0.5 ? 0.7 : 0.3,
      expectedUtility: {
        smokes: predictedRoundType === 'full-buy' ? 2 : 1,
        flashes: predictedRoundType === 'full-buy' ? 3 : 2,
        mollies: predictedRoundType === 'full-buy' ? 2 : 1
      },
      aggressionPrediction,
      counterStrategies: [
        'Play for picks against aggressive pushes',
        'Use defensive utility to delay',
        'Avoid over-peeking against force buys'
      ]
    }
  }

  // Helper methods
  private countPlayersAtSite(positions: PlayerPosition[], site: Bombsite): number {
    const bounds = {
      A: { minX: 20, maxX: 30, minY: 20, maxY: 30 },
      B: { minX: 45, maxX: 55, minY: 40, maxY: 50 },
      Mid: { minX: 27, maxX: 37, minY: 27, maxY: 37 }
    }
    const bound = bounds[site]

    return positions.filter(p => {
      const lastPos = p.positions[p.positions.length - 1]
      if (!lastPos) return false
      return lastPos.x >= bound.minX && lastPos.x <= bound.maxX &&
             lastPos.y >= bound.minY && lastPos.y <= bound.maxY
    }).length
  }

  private inferBombSite(position?: Vector2D): Bombsite {
    if (!position) return 'A'
    const distA = Math.hypot(position.x - 25, position.y - 25)
    const distB = Math.hypot(position.x - 50, position.y - 45)
    return distA < distB ? 'A' : 'B'
  }

  private calculateSiteWeight(positions: PlayerPosition[], site: Bombsite): number {
    const count = this.countPlayersAtSite(positions, site)
    // Weight by proximity (players near but not at site count partially)
    let proximityWeight = 0
    const siteCenter = site === 'A' ? { x: 25, y: 25 } : { x: 50, y: 45 }
    
    positions.forEach(p => {
      const lastPos = p.positions[p.positions.length - 1]
      if (!lastPos) return
      const dist = Math.hypot(lastPos.x - siteCenter.x, lastPos.y - siteCenter.y)
      if (dist < 40 && dist > 20) {
        proximityWeight += 0.5
      }
    })

    return count * 2 + proximityWeight
  }

  private predictComposition(players: string[]): string[] {
    // Simplified - would use actual agent data
    return ['Entry Fragger', 'Controller', 'Initiator', 'Sentinel', 'Flex']
  }
}

/** Global prediction model instance */
export const predictionModel = new HeuristicPredictionModel()

/** Convert GameData to PredictionGameState */
export function toPredictionState(data: GameData): PredictionGameState {
  return {
    roundTime: data.metadata.matchTime,
    score: { attackers: 0, defenders: 0 }, // Would come from metadata
    economy: { attackers: 5000, defenders: 5000 }, // Would come from metadata
    alivePlayers: {
      attackers: data.playerPositions.filter(p => p.team === 'attackers').map(p => p.playerId),
      defenders: data.playerPositions.filter(p => p.team === 'defenders').map(p => p.playerId)
    },
    positions: data.playerPositions,
    recentKills: data.killEvents.slice(-5),
    bombStatus: null, // Would be in metadata
    activeUtility: [],
    mapControl: {
      attackers: 0.5,
      defenders: 0.5
    }
  }
}

export default predictionModel
