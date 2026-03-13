/**
 * OfflineGrid - Offline Fallback Component with Cache Display
 * [Ver001.000]
 */

import React, { useState, useEffect, useCallback } from 'react'

interface CachedGridData {
  data: unknown
  timestamp: number
}

interface OfflineGridProps {
  children: React.ReactNode
  onCacheData?: (data: CachedGridData) => void
}

export const OfflineGrid: React.FC<OfflineGridProps> = ({ 
  children, 
  onCacheData 
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [cacheInfo, setCacheInfo] = useState<{
    hasCache: boolean
    timestamp: Date | null
    age: string
  }>({ hasCache: false, timestamp: null, age: '' })

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
    }

    const handleOffline = () => {
      setIsOnline(false)
      checkCacheStatus()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Initial cache check
    checkCacheStatus()

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Check cache status via Service Worker
  const checkCacheStatus = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return
    }

    try {
      const messageChannel = new MessageChannel()
      
      const response = await new Promise<{ data: unknown; timestamp: number } | null>(
        (resolve) => {
          messageChannel.port1.onmessage = (event) => {
            if (event.data?.success) {
              resolve(event.data.timestamp ? {
                data: event.data.data,
                timestamp: event.data.timestamp,
              } : null)
            } else {
              resolve(null)
            }
          }

          navigator.serviceWorker.controller?.postMessage(
            { type: 'GET_CACHED_GRID', panels: [] },
            [messageChannel.port2]
          )

          // Timeout
          setTimeout(() => resolve(null), 1000)
        }
      )

      if (response?.timestamp) {
        const date = new Date(response.timestamp)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)

        let age = ''
        if (diffHours > 0) {
          age = `${diffHours}h ago`
        } else if (diffMins > 0) {
          age = `${diffMins}m ago`
        } else {
          age = 'just now'
        }

        setCacheInfo({
          hasCache: true,
          timestamp: date,
          age,
        })

        onCacheData?.({ data: response.data, timestamp: response.timestamp })
      }
    } catch (err) {
      console.error('[OfflineGrid] Cache check failed:', err)
    }
  }, [onCacheData])

  // Format timestamp for display
  const formatTimestamp = (date: Date | null): string => {
    if (!date) return 'Unknown'
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="offline-grid-container" style={{ position: 'relative' }}>
      {/* Offline indicator */}
      {!isOnline && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 100,
            padding: '8px 12px',
            background: 'rgba(251, 191, 36, 0.9)',
            color: '#1a1a2e',
            borderRadius: '6px',
            fontSize: '12px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
          }}
        >
          <span>⚠️</span>
          <span>
            Offline Mode
            {cacheInfo.hasCache && (
              <span style={{ opacity: 0.8, marginLeft: '4px' }}>
                • Cached {cacheInfo.age}
              </span>
            )}
          </span>
        </div>
      )}

      {/* Cache info when online but showing cached data */}
      {isOnline && cacheInfo.hasCache && (
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 100,
            padding: '6px 10px',
            background: 'rgba(74, 222, 128, 0.9)',
            color: '#0a0a0f',
            borderRadius: '6px',
            fontSize: '11px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <span>✓</span>
          <span>Cached {formatTimestamp(cacheInfo.timestamp)}</span>
        </div>
      )}

      {/* Main grid content */}
      {children}
    </div>
  )
}

// Hook for caching grid renders
export function useGridCache() {
  const cacheGridRender = useCallback(async (panels: unknown[], renderData: unknown) => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return false
    }

    try {
      const messageChannel = new MessageChannel()
      
      await new Promise<void>((resolve, reject) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data?.success) {
            resolve()
          } else {
            reject(new Error('Cache operation failed'))
          }
        }

        navigator.serviceWorker.controller?.postMessage(
          { type: 'CACHE_GRID_RENDER', panels, renderData },
          [messageChannel.port2]
        )

        setTimeout(() => reject(new Error('Cache timeout')), 5000)
      })

      return true
    } catch (err) {
      console.error('[useGridCache] Failed to cache:', err)
      return false
    }
  }, [])

  const clearGridCache = useCallback(async () => {
    if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) {
      return false
    }

    try {
      const messageChannel = new MessageChannel()
      
      await new Promise<void>((resolve, reject) => {
        messageChannel.port1.onmessage = (event) => {
          if (event.data?.success) {
            resolve()
          } else {
            reject(new Error('Clear cache failed'))
          }
        }

        navigator.serviceWorker.controller?.postMessage(
          { type: 'CLEAR_GRID_CACHE' },
          [messageChannel.port2]
        )

        setTimeout(() => reject(new Error('Clear timeout')), 5000)
      })

      return true
    } catch (err) {
      console.error('[useGridCache] Failed to clear:', err)
      return false
    }
  }, [])

  return { cacheGridRender, clearGridCache }
}

export default OfflineGrid
