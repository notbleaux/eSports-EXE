/**
 * usePWA Hook - PWA Install & Offline Status Management
 * [Ver001.000] - Comprehensive PWA utilities
 * 
 * Features:
 * - Detect if app is installed
 * - Track online/offline status
 * - Manage beforeinstallprompt for custom install UI
 * - Cache player data for offline use
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { logger } from '../utils/logger'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

interface PWAState {
  isInstalled: boolean
  isOnline: boolean
  canInstall: boolean
  isStandalone: boolean
}

interface PWAActions {
  promptInstall: () => Promise<boolean>
  dismissInstall: () => void
  cachePlayerData: (playerId: string, data: unknown) => Promise<void>
  getCachedPlayer: (playerId: string) => Promise<unknown | null>
}

export function usePWA(): PWAState & PWAActions {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [canInstall, setCanInstall] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null)

  // Check if running in standalone mode
  useEffect(() => {
    const checkStandalone = () => {
      const standalone = 
        window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
      setIsStandalone(standalone)
      setIsInstalled(standalone)
    }

    checkStandalone()

    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleChange = (e: MediaQueryListEvent) => {
      setIsStandalone(e.matches)
      setIsInstalled(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Handle beforeinstallprompt event
  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Store the event for later use
      deferredPromptRef.current = e as BeforeInstallPromptEvent
      setCanInstall(true)
      logger.info('[PWA] Install prompt available')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Handle appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setCanInstall(false)
      deferredPromptRef.current = null
      logger.info('[PWA] App installed')
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [])

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      logger.info('[PWA] Connection restored')
    }

    const handleOffline = () => {
      setIsOnline(false)
      logger.info('[PWA] Connection lost')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Prompt for installation
  const promptInstall = useCallback(async (): Promise<boolean> => {
    const deferredPrompt = deferredPromptRef.current
    if (!deferredPrompt) return false

    // Show the install prompt
    deferredPrompt.prompt()

    // Wait for user choice
    const { outcome } = await deferredPrompt.userChoice
    
    if (outcome === 'accepted') {
      logger.info('[PWA] User accepted install')
      setCanInstall(false)
      deferredPromptRef.current = null
      return true
    } else {
      logger.info('[PWA] User dismissed install')
      return false
    }
  }, [])

  // Dismiss install prompt
  const dismissInstall = useCallback(() => {
    setCanInstall(false)
    // Keep the deferred prompt in case user wants to install later
    logger.info('[PWA] Install prompt dismissed')
  }, [])

  // Cache player data via service worker
  const cachePlayerData = useCallback(async (playerId: string, data: unknown): Promise<void> => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      // Fallback to localStorage
      localStorage.setItem(`player_${playerId}`, JSON.stringify({
        data,
        timestamp: Date.now(),
      }))
      return
    }

    const channel = new MessageChannel()
    navigator.serviceWorker.controller.postMessage(
      { type: 'CACHE_PLAYER_DATA', playerId, data },
      [channel.port2]
    )

    return new Promise((resolve) => {
      channel.port1.onmessage = (event) => {
        if (event.data?.success) {
          resolve()
        }
      }
    })
  }, [])

  // Get cached player data
  const getCachedPlayer = useCallback(async (playerId: string): Promise<unknown | null> => {
    // Try service worker first
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const channel = new MessageChannel()
      navigator.serviceWorker.controller.postMessage(
        { type: 'GET_CACHED_PLAYER', playerId },
        [channel.port2]
      )

      const result = await new Promise<unknown | null>((resolve) => {
        channel.port1.onmessage = (event) => {
          resolve(event.data?.data || null)
        }
        setTimeout(() => resolve(null), 1000)
      })

      if (result) return result
    }

    // Fallback to localStorage
    const cached = localStorage.getItem(`player_${playerId}`)
    if (cached) {
      const { data } = JSON.parse(cached)
      return data
    }

    return null
  }, [])

  return {
    isInstalled,
    isOnline,
    canInstall,
    isStandalone,
    promptInstall,
    dismissInstall,
    cachePlayerData,
    getCachedPlayer,
  }
}

export default usePWA
