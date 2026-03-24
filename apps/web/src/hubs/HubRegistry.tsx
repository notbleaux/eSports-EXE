/**
 * HubRegistry - Lazy HUB Component Definitions
 * Phase 1: Lensing System
 * [Ver001.000]
 */

import React, { lazy, Suspense } from 'react'

// Hub weights for rendering strategy
export type HubWeight = 'light' | 'medium' | 'heavy'

// HUB Definition
export interface HubDefinition {
  component: React.LazyExoticComponent<React.FC<any>>
  weight: HubWeight
  preload: boolean
  description: string
}

// Lazy load HUB components (stubs - replace with real implementations)
const SATORHub = lazy(() => import('../hub-1-sator/index.jsx'))
const ROTASHub = lazy(() => import('../hub-2-rotas/index.jsx'))
const AREPOHub = lazy(() => import('../hub-3-arepo/index.jsx'))
const OPERAHub = lazy(() => import('../hub-4-opera/index.tsx'))

// Main Registry - 4 HUBs per TENET
export const HUB_REGISTRY: Record<string, HubDefinition> = {
  SATOR: {
    component: SATORHub,
    weight: 'heavy',  // Charts, ML models, leaderboards
    preload: true,
    description: 'Player statistics (SimRating, RAR, performance)'
  },
  ROTAS: {
    component: ROTASHub,
    weight: 'heavy',  // Three.js maps, simulations, tactical analysis
    preload: true,
    description: 'Simulation/analytics (maps, heatmaps, tactics)'
  },
  AREPO: {
    component: AREPOHub,
    weight: 'light',  // Text content, clips, forums
    preload: false,
    description: 'Community content (clips, strategies, forums)'
  },
  OPERA: {
    component: OPERAHub,
    weight: 'medium', // Schedules, tournaments, betting
    preload: false,
    description: 'Pro esports (tournaments, schedules, betting)'
  }
}

// Preload heavy HUBs (performance optimization)
export const preloadHeavyHubs = async (): Promise<void> => {
  const heavyHubs = Object.values(HUB_REGISTRY).filter(h => h.weight === 'heavy' && h.preload)
  await Promise.all(
    heavyHubs.map(hub => hub.component.preload?.())
  )
}

// HUB Loader Component
export const HubLoader = ({ hubId }: { hubId: string }) => {
  const hubDef = HUB_REGISTRY[hubId]
  if (!hubDef) {
    return <div className="p-4 text-red-400">Unknown HUB: {hubId}</div>
  }

  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center h-64 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 border border-purple-500/30 rounded-lg">
          <div className="text-sm text-purple-300 animate-pulse">
            Loading {hubId}...
          </div>
        </div>
      }
    >
      <hubDef.component />
    </Suspense>
  )
}

// Hook for hub definition
export const useHubDefinition = (hubId: string) => {
  return HUB_REGISTRY[hubId] || null
}

export default HUB_REGISTRY

