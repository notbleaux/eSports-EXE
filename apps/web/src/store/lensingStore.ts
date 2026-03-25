/**
 * Lensing Store - TENET HUB Visibility & Configuration
 * Phase 1 of NJZiteGeisTe Platform
 * Manages active lenses/HUBs, integrates with dynamicStore layouts
 * [Ver001.000]
 */

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Panel } from './dynamicStore'
import { useDynamicStore, usePanels as dynamicPanels } from './dynamicStore'
// import LensCompositor from '../../components/SpecMapViewer/lenses/LensCompositor'
// TODO: Init in component after import confirmed

export interface LensConfig {
  hubs: Record<
    string,
    {
      weight: 'light' | 'medium' | 'heavy'
      preload: boolean
    }
  >
  presets: string[]
}

export interface LensingState {
  // Core state
  activeLens: string[] // ['SATOR', 'ROTAS']
  lensConfigs: Record<'Valorant' | 'CS2', LensConfig>

  // Compositor instance
  compositor: LensCompositor | null

  // UI
  isMobile: boolean
  maxHubs: number // 2 mobile, 4 desktop

  // Computed
  visiblePanels: Panel[]

  // Actions
  toggleHub: (hub: string) => void
  setActiveLens: (lenses: string[]) => void
  loadPreset: (preset: string, tenet: 'Valorant' | 'CS2') => void
  setMobile: (isMobile: boolean) => void
  initCompositor: () => void
  resetLenses: () => void
}

// Default configs
const DEFAULT_VALORANT: LensConfig = {
  hubs: {
    SATOR: { weight: 'heavy', preload: true },
    ROTAS: { weight: 'heavy', preload: true },
    AREPO: { weight: 'light', preload: false },
    OPERA: { weight: 'medium', preload: false }
  },
  presets: ['analytics', 'community', 'pro', 'full']
}

const DEFAULT_CS2: LensConfig = {
  hubs: {
    SATOR: { weight: 'heavy', preload: true },
    ROTAS: { weight: 'heavy', preload: true },
    AREPO: { weight: 'light', preload: false },
    OPERA: { weight: 'medium', preload: false }
  },
  presets: ['tactical', 'stats', 'pro', 'full']
}

const DEFAULT_ACTIVE_LENS = ['SATOR', 'ROTAS']

export const useLensingStore = create<LensingState>()(
  persist(
    (set, get) => ({
      activeLens: DEFAULT_ACTIVE_LENS,
      lensConfigs: {
        Valorant: DEFAULT_VALORANT,
        CS2: DEFAULT_CS2
      },
      compositor: null,
      isMobile: false,
      maxHubs: 4,

      visiblePanels: [], // Computed

      toggleHub: hub =>
        set(state => {
          const active = state.activeLens
          const newActive = active.includes(hub)
            ? active.filter(h => h !== hub)
            : [...active, hub].slice(0, state.maxHubs)

          // Update dynamic store panels visibility via type/hub filter
          // (dynamicStore handles layout)
          return { activeLens: newActive }
        }),

      setActiveLens: lenses =>
        set({
          activeLens: lenses.slice(0, get().maxHubs)
        }),

      loadPreset: (preset, tenet) => {
        const configs = get().lensConfigs[tenet]
        const presetLenses = configs.presets.includes(preset)
          ? preset === 'full'
            ? Object.keys(configs.hubs)
            : ['SATOR', 'ROTAS'] // Default preset fallback
          : DEFAULT_ACTIVE_LENS

        set({ activeLens: presetLenses })
      },

      setMobile: isMobile =>
        set(state => ({
          isMobile,
          maxHubs: isMobile ? 2 : 4,
          activeLens: state.activeLens.slice(0, isMobile ? 2 : 4)
        })),

      initCompositor: () => {
        const compositor = new LensCompositor()
        // Register default lenses for ROTAS
        set({ compositor })
      },

      resetLenses: () =>
        set({
          activeLens: DEFAULT_ACTIVE_LENS,
          compositor: get().compositor ? new LensCompositor() : null
        })
    }),

    // Subscribe to dynamicStore for computed visiblePanels
    // (Zustand subscribeWithSelector could be added)

    {
      name: 'lensing-storage',
      partialize: state => ({
        activeLens: state.activeLens,
        lensConfigs: state.lensConfigs,
        isMobile: state.isMobile,
        maxHubs: state.maxHubs
      }) // Exclude compositor instance
    }
  )
)

// Computed selector - visible panels (integrates with dynamicStore)
useLensingStore.subscribe(
  state => state.activeLens,
  () => {
    // Trigger dynamicStore panel filter via custom hook
    // Implementation in consuming components
  }
)

// Granular selectors
export const useActiveLens = () => useLensingStore(s => s.activeLens)
export const useLensConfigs = () => useLensingStore(s => s.lensConfigs)
export const useIsMobile = () => useLensingStore(s => s.isMobile)
export const useVisibleHubs = () => useLensingStore(s => s.activeLens)
export const useCompositor = () => useLensingStore(s => s.compositor)

// Custom hook for filtered panels
export const useLensingPanels = () => {
  const dynamicPanelsList = dynamicPanels()
  const activeLens = useActiveLens()
  return dynamicPanelsList.filter(p => activeLens.includes(p.hub))
}

export default useLensingStore
