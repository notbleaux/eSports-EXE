/**
 * useServiceWorker Hook - PWA Registration & Update Management
 * [Ver001.000]
 */

import { useState, useEffect, useCallback } from 'react'

interface ServiceWorkerState {
  isSupported: boolean
  isRegistered: boolean
  isOfflineReady: boolean
  updateAvailable: boolean
  waitingWorker: ServiceWorker | null
  registration: ServiceRegistration | null
}

interface ServiceRegistration {
  update: () => Promise<void>
  unregister: () => Promise<boolean>
}

export function useServiceWorker(): ServiceWorkerState & {
  checkForUpdates: () => Promise<void>
  applyUpdate: () => void
} {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isOfflineReady: false,
    updateAvailable: false,
    waitingWorker: null,
    registration: null,
  })

  useEffect(() => {
    if (!('serviceWorker' in navigator)) {
      console.log('[SW] Service Worker not supported')
      return
    }

    let isMounted = true

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        })

        if (!isMounted) return

        console.log('[SW] Registered:', registration.scope)

        setState((prev) => ({
          ...prev,
          isRegistered: true,
          registration: {
            update: () => registration.update(),
            unregister: () => registration.unregister(),
          },
        }))

        // Check for updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing

          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                console.log('[SW] Update available')
                setState((prev) => ({
                  ...prev,
                  updateAvailable: true,
                  waitingWorker: newWorker,
                }))
              }
            })
          }
        })

        // Listen for controlling worker changes
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          console.log('[SW] Controller changed - reloading for fresh content')
          window.location.reload()
        })

        // Check if already controlling
        if (navigator.serviceWorker.controller) {
          setState((prev) => ({
            ...prev,
            isOfflineReady: true,
          }))
        }
      } catch (error) {
        console.error('[SW] Registration failed:', error)
      }
    }

    registerSW()

    // Listen for online/offline
    const handleOnline = () => {
      console.log('[SW] App is online')
    }

    const handleOffline = () => {
      console.log('[SW] App is offline - using cached assets')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      isMounted = false
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const checkForUpdates = useCallback(async () => {
    if (!state.registration) return

    console.log('[SW] Checking for updates...')
    await state.registration.update()
  }, [state.registration])

  const applyUpdate = useCallback(() => {
    if (state.waitingWorker) {
      console.log('[SW] Applying update...')
      state.waitingWorker.postMessage('SKIP_WAITING')
    }
  }, [state.waitingWorker])

  return {
    ...state,
    checkForUpdates,
    applyUpdate,
  }
}

export default useServiceWorker
