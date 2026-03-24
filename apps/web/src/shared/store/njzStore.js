/**
 * Zustand store for NJZ Platform state management
 * Handles navigation, hub states, twin-file integrity, and UI preferences
 */
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

// Hub definitions with metadata
export const HUBS = {
  sator: {
    id: 'sator',
    name: 'SATOR',
    subtitle: 'The Observatory',
    description: 'Raw data ingestion with orbital ring navigation',
    color: '#ff9f1c',
    glowColor: 'rgba(255, 159, 28, 0.4)',
    icon: '◎',
    path: '/analytics',
    stats: { records: '2.4M', status: 'active' }
  },
  rotas: {
    id: 'rotas',
    name: 'ROTAS',
    subtitle: 'The Harmonic Layer',
    description: 'Advanced analytics with ellipse layer blending',
    color: '#00f0ff',
    glowColor: 'rgba(0, 240, 255, 0.4)',
    icon: '◈',
    path: '/stats',
    stats: { accuracy: '99.9%', status: 'active' }
  },
  arepo: {
    id: 'arepo',
    name: 'AREPO',
    subtitle: 'The Directory',
    description: 'Q&A, documentation, and knowledge base',
    color: '#0066ff',
    glowColor: 'rgba(0, 102, 255, 0.4)',
    icon: '◉',
    path: '/community',
    stats: { entries: '2,135', status: 'active' }
  },
  opera: {
    id: 'opera',
    name: 'OPERA',
    subtitle: 'The Nexus',
    description: 'Maps, fog of war, and spatial visualization',
    color: '#9d4edd',
    glowColor: 'rgba(157, 78, 221, 0.4)',
    icon: '◆',
    path: '/opera',
    stats: { maps: '6', status: 'active' }
  },
  tenet: {
    id: 'tenet',
    name: 'TENET',
    subtitle: 'The Control Center',
    description: 'Central coordination hub with SATOR Square visualization',
    color: '#ffffff',
    glowColor: 'rgba(255, 255, 255, 0.3)',
    icon: '◈',
    path: '/tenet',
    stats: { hubs: '5', status: 'active' }
  }
}

// Initial twin-file state
const initialTwinFileState = {
  raws: {
    hash: 'a3f7d2e8c9b1a4f5',
    timestamp: Date.now(),
    status: 'synced',
    lastSync: new Date().toISOString(),
    recordCount: 2400000
  },
  base: {
    hash: 'b8e2c1d4f9a7e3b6',
    timestamp: Date.now(),
    status: 'synced',
    lastSync: new Date().toISOString(),
    layerCount: 3
  },
  integrity: {
    verified: true,
    checksum: 'sha256:7f8a9b...',
    correlation: 100,
    lastVerified: new Date().toISOString()
  }
}

// Create store with persistence
export const useNJZStore = create(
  persist(
    (set, get) => ({
      // Navigation state
      currentHub: null,
      previousHub: null,
      navigationHistory: [],
      
      // Hub states
      hubStates: {
        sator: { activeRing: null, rotation: 0 },
        rotas: { activeLayers: ['persona'], correlation: 87.3 },
        arepo: { activeSection: 'directory', selectedCategory: null },
        opera: { selectedMap: 'ascent', viewMode: 'tactical' },
        tenet: { activeTab: 'hubs', selectedHub: null }
      },
      
      // Twin-file integrity
      twinFile: initialTwinFileState,
      
      // UI preferences
      preferences: {
        reducedMotion: false,
        highContrast: false,
        compactMode: false,
        sidebarCollapsed: false
      },
      
      // Notifications
      notifications: [],
      
      // Loading states
      isLoading: false,
      loadingMessage: '',
      
      // Actions
      setCurrentHub: (hubId) => {
        const state = get()
        set({
          previousHub: state.currentHub,
          currentHub: hubId,
          navigationHistory: [...state.navigationHistory.slice(-9), hubId]
        })
      },
      
      setHubState: (hubId, updates) => {
        set((state) => ({
          hubStates: {
            ...state.hubStates,
            [hubId]: { ...state.hubStates[hubId], ...updates }
          }
        }))
      },
      
      updateTwinFile: (type, updates) => {
        set((state) => ({
          twinFile: {
            ...state.twinFile,
            [type]: { ...state.twinFile[type], ...updates }
          }
        }))
      },
      
      verifyIntegrity: () => {
        const state = get()
        const correlation = Math.floor(Math.random() * 5) + 95 // 95-100%
        set({
          twinFile: {
            ...state.twinFile,
            integrity: {
              verified: true,
              checksum: `sha256:${Math.random().toString(36).substring(2, 15)}`,
              correlation,
              lastVerified: new Date().toISOString()
            }
          }
        })
        return correlation
      },
      
      setPreference: (key, value) => {
        set((state) => ({
          preferences: { ...state.preferences, [key]: value }
        }))
      },
      
      addNotification: (message, type = 'info') => {
        const id = Date.now()
        set((state) => ({
          notifications: [...state.notifications, { id, message, type, time: Date.now() }]
        }))
        setTimeout(() => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }))
        }, 3000)
      },
      
      setLoading: (isLoading, message = '') => {
        set({ isLoading, loadingMessage: message })
      },
      
      resetStore: () => {
        set({
          currentHub: null,
          previousHub: null,
          navigationHistory: [],
          hubStates: {
            sator: { activeRing: null, rotation: 0 },
            rotas: { activeLayers: ['persona'], correlation: 87.3 },
            arepo: { activeSection: 'directory', selectedCategory: null },
            opera: { selectedMap: 'ascent', viewMode: 'tactical' }
          },
          twinFile: initialTwinFileState,
          notifications: []
        })
      }
    }),
    {
      name: 'njz-platform-storage',
      partialize: (state) => ({
        preferences: state.preferences,
        navigationHistory: state.navigationHistory
      })
    }
  )
)

// Hook for hub-specific state
export const useHubState = (hubId) => {
  const store = useNJZStore()
  return {
    state: store.hubStates[hubId] || {},
    setState: (updates) => store.setHubState(hubId, updates)
  }
}

// Hook for twin-file integrity
export const useTwinFile = () => {
  const store = useNJZStore()
  return {
    raws: store.twinFile.raws,
    base: store.twinFile.base,
    integrity: store.twinFile.integrity,
    verify: store.verifyIntegrity,
    update: store.updateTwinFile
  }
}

export default useNJZStore
