/**
 * UpdateNotification Component
 * [Ver001.000] - Shows update notification when service worker updates
 * 
 * Features:
 * - Detects service worker updates
 * - Shows update notification with reload button
 * - Allows skipping updates
 * - Auto-checks for updates periodically
 */

import React, { useEffect, useState, useCallback } from 'react'
import { RefreshCw, X, Download, Sparkles } from 'lucide-react'

interface UpdateNotificationProps {
  checkInterval?: number // milliseconds
}

export const UpdateNotification: React.FC<UpdateNotificationProps> = ({
  checkInterval = 60 * 60 * 1000, // 1 hour default
}) => {
  const [showUpdate, setShowUpdate] = useState(false)
  const [updateMessage, setUpdateMessage] = useState('A new version is available!')
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null)

  // Handle service worker update
  const onServiceWorkerUpdate = useCallback((registration: ServiceWorkerRegistration) => {
    if (registration.waiting) {
      setWaitingWorker(registration.waiting)
      setUpdateMessage('A new version is available!')
      setShowUpdate(true)
    }
  }, [])

  // Update service worker
  const updateServiceWorker = useCallback(() => {
    if (waitingWorker) {
      // Send skip waiting message
      waitingWorker.postMessage({ type: 'SKIP_WAITING' })
      
      // Reload after a short delay
      setTimeout(() => {
        window.location.reload()
      }, 500)
    }
  }, [waitingWorker])

  // Skip update
  const skipUpdate = useCallback(() => {
    setShowUpdate(false)
  }, [])

  // Check for updates manually
  const checkForUpdates = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        try {
          await registration.update()
        } catch (error) {
          console.error('[UpdateNotification] Update check failed:', error)
        }
      }
    }
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    let intervalId: NodeJS.Timeout

    const setupServiceWorker = async () => {
      try {
        const registration = await navigator.serviceWorker.getRegistration()
        
        if (registration) {
          // Check if there's already a waiting worker
          if (registration.waiting) {
            onServiceWorkerUpdate(registration)
          }

          // Listen for new updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New worker installed but waiting
                  onServiceWorkerUpdate(registration)
                }
              })
            }
          })
        }

        // Listen for messages from service worker
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'SW_ACTIVATED') {
            setUpdateMessage(`Updated to version ${event.data.version}`)
            setShowUpdate(true)
            
            // Auto-hide after 5 seconds
            setTimeout(() => setShowUpdate(false), 5000)
          }
        })

        // Set up periodic update checks
        intervalId = setInterval(checkForUpdates, checkInterval)
      } catch (error) {
        console.error('[UpdateNotification] Setup failed:', error)
      }
    }

    setupServiceWorker()

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [checkInterval, checkForUpdates, onServiceWorkerUpdate])

  if (!showUpdate) {
    return (
      <button
        onClick={checkForUpdates}
        className="fixed bottom-4 right-4 z-40 p-3 bg-[#12121a] border border-[#2a2a3a] rounded-full shadow-lg hover:border-[#00f0ff]/50 transition-colors"
        title="Check for updates"
      >
        <RefreshCw className="w-5 h-5 text-gray-400" />
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full mx-4 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="bg-[#12121a] border border-[#00f0ff]/30 rounded-xl shadow-2xl overflow-hidden">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-[#00f0ff]/5 to-[#9d4edd]/5 pointer-events-none" />
        
        <div className="relative p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-[#00f0ff] to-[#9d4edd] rounded-lg flex items-center justify-center flex-shrink-0">
              <Sparkles className="w-5 h-5 text-[#0a0a0f]" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-white">Update Available</h3>
              <p className="text-xs text-gray-400 mt-1">{updateMessage}</p>
              
              <div className="flex gap-2 mt-3">
                <button
                  onClick={updateServiceWorker}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-[#00f0ff] to-[#9d4edd] text-[#0a0a0f] text-xs font-semibold rounded-lg hover:opacity-90 transition-opacity"
                >
                  <Download className="w-3.5 h-3.5" />
                  Update Now
                </button>
                <button
                  onClick={skipUpdate}
                  className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
            
            <button
              onClick={skipUpdate}
              className="p-1 text-gray-500 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// Hook to use update checking programmatically
export const useServiceWorkerUpdate = () => {
  const [hasUpdate, setHasUpdate] = useState(false)

  const checkForUpdate = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration) {
        await registration.update()
        return registration.waiting !== null
      }
    }
    return false
  }, [])

  const applyUpdate = useCallback(async () => {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        registration.waiting.postMessage({ type: 'SKIP_WAITING' })
        window.location.reload()
      }
    }
  }, [])

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return

    const handleUpdate = async () => {
      const registration = await navigator.serviceWorker.getRegistration()
      if (registration?.waiting) {
        setHasUpdate(true)
      }
    }

    // Check on mount
    handleUpdate()

    // Listen for update events
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      window.location.reload()
    })
  }, [])

  return { hasUpdate, checkForUpdate, applyUpdate }
}

export default UpdateNotification
