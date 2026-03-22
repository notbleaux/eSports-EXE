/**
 * OfflineFallback Component
 * [Ver001.000] - Displays offline status and cached player data
 * 
 * Features:
 * - Shows when user is offline
 * - Displays cached player data from service worker
 * - "You're offline" indicator with visual feedback
 * - Auto-updates when connection returns
 */

import React, { useEffect, useState, useCallback } from 'react'
import { WifiOff, RefreshCw, Database, Users, TrendingUp, Calendar } from 'lucide-react'

interface CachedPlayer {
  id: string
  name: string
  team?: string
  stats?: {
    rating?: number
    acs?: number
    kd?: number
  }
  cachedAt: string
}

interface CachedData {
  players: CachedPlayer[]
  lastUpdated: string
  totalMatches: number
}

export const OfflineFallback: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [cachedData, setCachedData] = useState<CachedData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showOfflineIndicator, setShowOfflineIndicator] = useState(!navigator.onLine)

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineIndicator(false)
      // Reload to get fresh data
      window.location.reload()
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineIndicator(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Load cached data from service worker
  const loadCachedData = useCallback(async () => {
    try {
      // Try to get cached players from service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        const messageChannel = new MessageChannel()
        
        const response = await new Promise<CachedData | null>((resolve) => {
          messageChannel.port1.onmessage = (event) => {
            resolve(event.data?.data || null)
          }
          
          navigator.serviceWorker.controller.postMessage(
            { type: 'GET_CACHED_PLAYER', playerId: 'all' },
            [messageChannel.port2]
          )
          
          // Timeout after 2 seconds
          setTimeout(() => resolve(null), 2000)
        })

        if (response) {
          setCachedData(response)
        }
      }

      // Fallback: try to get from localStorage
      const localData = localStorage.getItem('offline_player_data')
      if (localData && !cachedData) {
        setCachedData(JSON.parse(localData))
      }
    } catch (error) {
      console.error('[OfflineFallback] Error loading cached data:', error)
    } finally {
      setIsLoading(false)
    }
  }, [cachedData])

  useEffect(() => {
    if (!isOnline) {
      loadCachedData()
    }
  }, [isOnline, loadCachedData])

  // Handle retry
  const handleRetry = () => {
    if (navigator.onLine) {
      window.location.reload()
    } else {
      // Trigger a network request to check
      fetch(window.location.href, { method: 'HEAD', cache: 'no-store' })
        .then(() => window.location.reload())
        .catch(() => {
          // Still offline
          setShowOfflineIndicator(true)
        })
    }
  }

  // Offline indicator (compact version for embedding in other pages)
  if (!showOfflineIndicator) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0f]/95 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#12121a] border border-[#2a2a3a] rounded-2xl overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#00f0ff]/10 to-[#9d4edd]/10 p-6 border-b border-[#2a2a3a]">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-[#00f0ff]/10 rounded-full flex items-center justify-center">
              <WifiOff className="w-8 h-8 text-[#00f0ff]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">You're Offline</h2>
              <p className="text-sm text-gray-400 mt-1">
                Connection lost. Using cached data.
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status indicator */}
          <div className="flex items-center justify-between p-4 bg-[#0a0a0f] rounded-xl border border-[#2a2a3a]">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
              <span className="text-sm text-gray-300">Network Status</span>
            </div>
            <span className="text-sm font-medium text-red-400">Disconnected</span>
          </div>

          {/* Cached data section */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 text-[#00f0ff] animate-spin" />
              <span className="ml-3 text-sm text-gray-400">Loading cached data...</span>
            </div>
          ) : cachedData ? (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-300 flex items-center gap-2">
                <Database className="w-4 h-4 text-[#00f0ff]" />
                Available Offline Data
              </h3>

              {/* Stats grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#0a0a0f] p-3 rounded-lg border border-[#2a2a3a] text-center">
                  <Users className="w-5 h-5 text-[#00f0ff] mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">
                    {cachedData.players?.length || 0}
                  </div>
                  <div className="text-xs text-gray-500">Players</div>
                </div>
                <div className="bg-[#0a0a0f] p-3 rounded-lg border border-[#2a2a3a] text-center">
                  <TrendingUp className="w-5 h-5 text-[#9d4edd] mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">
                    {cachedData.totalMatches || 0}
                  </div>
                  <div className="text-xs text-gray-500">Matches</div>
                </div>
                <div className="bg-[#0a0a0f] p-3 rounded-lg border border-[#2a2a3a] text-center">
                  <Calendar className="w-5 h-5 text-[#00f0ff] mx-auto mb-2" />
                  <div className="text-lg font-bold text-white">
                    {cachedData.lastUpdated 
                      ? new Date(cachedData.lastUpdated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                      : '—'}
                  </div>
                  <div className="text-xs text-gray-500">Updated</div>
                </div>
              </div>

              {/* Player list */}
              {cachedData.players && cachedData.players.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-3">
                    Cached Players
                  </h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {cachedData.players.slice(0, 5).map((player) => (
                      <div
                        key={player.id}
                        className="flex items-center justify-between p-3 bg-[#0a0a0f] rounded-lg border border-[#2a2a3a]"
                      >
                        <div>
                          <div className="text-sm font-medium text-white">{player.name}</div>
                          {player.team && (
                            <div className="text-xs text-gray-500">{player.team}</div>
                          )}
                        </div>
                        {player.stats?.rating && (
                          <div className="text-right">
                            <div className="text-sm font-bold text-[#00f0ff]">
                              {player.stats.rating.toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500">Rating</div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <Database className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No cached data available</p>
              <p className="text-xs mt-1">Visit pages while online to cache data</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-[#2a2a3a]">
            <button
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-[#00f0ff] to-[#9d4edd] text-[#0a0a0f] font-semibold rounded-xl hover:opacity-90 transition-opacity"
            >
              <RefreshCw className="w-4 h-4" />
              Retry Connection
            </button>
            <button
              onClick={() => setShowOfflineIndicator(false)}
              className="px-4 py-3 bg-[#2a2a3a] text-white font-medium rounded-xl hover:bg-[#3a3a4a] transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0a0a0f] border-t border-[#2a2a3a] text-center">
          <p className="text-xs text-gray-600">
            4NJZ4 TENET Platform • Offline Mode
          </p>
        </div>
      </div>
    </div>
  )
}

// Compact offline indicator for embedding in headers
export const OfflineIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [isVisible, setIsVisible] = useState(!navigator.onLine)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setTimeout(() => setIsVisible(false), 3000) // Hide after 3 seconds
    }

    const handleOffline = () => {
      setIsOnline(false)
      setIsVisible(true)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 flex items-center justify-center px-4 py-2 text-sm font-medium transition-all ${
        isOnline
          ? 'bg-green-500/20 text-green-400 border-b border-green-500/30'
          : 'bg-red-500/20 text-red-400 border-b border-red-500/30'
      }`}
    >
      <WifiOff className="w-4 h-4 mr-2" />
      {isOnline ? 'Connection restored' : 'You are offline'}
    </div>
  )
}

export default OfflineFallback
