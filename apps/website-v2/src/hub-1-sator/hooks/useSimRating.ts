/** [Ver001.000]
 * useSimRating Hook for 4NJZ4 TENET Platform
 * Hook for calculating SimRating with Web Worker support
 * 
 * Features:
 * - Worker-based calculation for non-blocking UI
 * - Result caching to avoid recalculation
 * - Batch calculation support
 * - Loading and error states
 */

import { useCallback, useRef, useState, useEffect } from 'react'
import { useAnalyticsWorker } from '../../hooks/workers/useAnalyticsWorker'
import type { SimRatingPayload, SimRatingResult } from '../../types/worker'

// Cache configuration
const CACHE_MAX_SIZE = 100
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CacheEntry {
  result: SimRatingResult
  timestamp: number
}

interface UseSimRatingOptions {
  enableCache?: boolean
  onError?: (error: Error) => void
  onCalculated?: (result: SimRatingResult) => void
}

interface UseSimRatingReturn {
  // State
  isReady: boolean
  isCalculating: boolean
  currentResult: SimRatingResult | null
  error: Error | null
  
  // Single calculation
  calculate: (payload: SimRatingPayload) => Promise<SimRatingResult>
  calculateForPlayer: (
    playerId: string, 
    playerStats: Record<string, number>, 
    role: string,
    confidence?: number
  ) => Promise<SimRatingResult>
  
  // Batch calculation
  calculateBatch: (players: Array<{
    id: string
    payload: SimRatingPayload
  }>) => Promise<Map<string, SimRatingResult>>
  
  // Cache management
  clearCache: () => void
  getCachedResult: (playerId: string, role: string) => SimRatingResult | null
  cacheSize: number
  
  // Cleanup
  terminate: () => void
}

/**
 * Hook for SimRating calculations with caching and batch support
 */
export function useSimRating(options: UseSimRatingOptions = {}): UseSimRatingReturn {
  const { enableCache = true, onError, onCalculated } = options
  
  const analytics = useAnalyticsWorker({
    onError: (error) => {
      setError(error)
      onError?.(error)
    }
  })
  
  // Local state
  const [currentResult, setCurrentResult] = useState<SimRatingResult | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [cacheSize, setCacheSize] = useState(0)
  
  // Cache ref (persists across renders)
  const cacheRef = useRef<Map<string, CacheEntry>>(new Map())
  
  // Cleanup expired cache entries periodically
  useEffect(() => {
    if (!enableCache) return
    
    const cleanup = setInterval(() => {
      const now = Date.now()
      let expired = 0
      for (const [key, entry] of cacheRef.current.entries()) {
        if (now - entry.timestamp > CACHE_TTL_MS) {
          cacheRef.current.delete(key)
          expired++
        }
      }
      if (expired > 0) {
        setCacheSize(cacheRef.current.size)
      }
    }, 60000) // Clean up every minute
    
    return () => clearInterval(cleanup)
  }, [enableCache])
  
  /**
   * Generate cache key for a player/role combination
   */
  const getCacheKey = useCallback((playerId: string, role: string): string => {
    return `${playerId}:${role.toLowerCase()}`
  }, [])
  
  /**
   * Get cached result if available and not expired
   */
  const getCachedResult = useCallback((playerId: string, role: string): SimRatingResult | null => {
    if (!enableCache) return null
    
    const key = getCacheKey(playerId, role)
    const entry = cacheRef.current.get(key)
    
    if (entry && Date.now() - entry.timestamp <= CACHE_TTL_MS) {
      return entry.result
    }
    
    // Remove expired entry
    if (entry) {
      cacheRef.current.delete(key)
      setCacheSize(cacheRef.current.size)
    }
    
    return null
  }, [enableCache, getCacheKey])
  
  /**
   * Store result in cache
   */
  const setCachedResult = useCallback((playerId: string, role: string, result: SimRatingResult): void => {
    if (!enableCache) return
    
    const key = getCacheKey(playerId, role)
    
    // Implement LRU: remove oldest if at capacity
    if (cacheRef.current.size >= CACHE_MAX_SIZE && !cacheRef.current.has(key)) {
      const firstKey = cacheRef.current.keys().next().value
      if (firstKey !== undefined) {
        cacheRef.current.delete(firstKey)
      }
    }
    
    cacheRef.current.set(key, {
      result,
      timestamp: Date.now()
    })
    
    setCacheSize(cacheRef.current.size)
  }, [enableCache, getCacheKey])
  
  /**
   * Clear all cached results
   */
  const clearCache = useCallback((): void => {
    cacheRef.current.clear()
    setCacheSize(0)
  }, [])
  
  /**
   * Calculate SimRating with payload
   */
  const calculate = useCallback(async (
    payload: SimRatingPayload
  ): Promise<SimRatingResult> => {
    setError(null)
    
    // Check cache first
    const cached = getCachedResult(payload.playerId, payload.role)
    if (cached) {
      setCurrentResult(cached)
      onCalculated?.(cached)
      return cached
    }
    
    try {
      const result = await analytics.calculateSimRating(payload)
      
      // Cache the result
      setCachedResult(payload.playerId, payload.role, result)
      setCurrentResult(result)
      onCalculated?.(result)
      
      return result
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Calculation failed')
      setError(error)
      throw error
    }
  }, [analytics, getCachedResult, setCachedResult, onCalculated])
  
  /**
   * Convenience method for calculating with individual parameters
   */
  const calculateForPlayer = useCallback(async (
    playerId: string,
    playerStats: Record<string, number>,
    role: string,
    confidence: number = 1.0
  ): Promise<SimRatingResult> => {
    return calculate({
      playerId,
      playerStats,
      role,
      confidence
    })
  }, [calculate])
  
  /**
   * Calculate SimRatings for multiple players
   */
  const calculateBatch = useCallback(async (
    players: Array<{ id: string; payload: SimRatingPayload }>
  ): Promise<Map<string, SimRatingResult>> => {
    setError(null)
    const results = new Map<string, SimRatingResult>()
    const uncachedPlayers: Array<{ id: string; payload: SimRatingPayload }> = []
    
    // Check cache for each player
    for (const player of players) {
      const cached = getCachedResult(player.payload.playerId, player.payload.role)
      if (cached) {
        results.set(player.id, cached)
      } else {
        uncachedPlayers.push(player)
      }
    }
    
    // Calculate uncached players
    try {
      for (const player of uncachedPlayers) {
        const result = await analytics.calculateSimRating(player.payload)
        setCachedResult(player.payload.playerId, player.payload.role, result)
        results.set(player.id, result)
      }
      
      return results
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Batch calculation failed')
      setError(error)
      throw error
    }
  }, [analytics, getCachedResult, setCachedResult])
  
  return {
    isReady: analytics.isReady,
    isCalculating: analytics.isCalculating,
    currentResult,
    error,
    calculate,
    calculateForPlayer,
    calculateBatch,
    clearCache,
    getCachedResult,
    cacheSize,
    terminate: analytics.terminate
  }
}

/**
 * Hook for comparing multiple players' SimRatings
 */
export function useSimRatingComparison(playerIds: string[]) {
  const { calculateBatch, isCalculating, isReady } = useSimRating()
  const [results, setResults] = useState<Map<string, SimRatingResult>>(new Map())
  const [compared, setCompared] = useState(false)
  
  const compare = useCallback(async (
    getPlayerData: (id: string) => { stats: Record<string, number>; role: string }
  ): Promise<void> => {
    if (!isReady || playerIds.length === 0) return
    
    const players = playerIds.map(id => ({
      id,
      payload: {
        playerId: id,
        playerStats: getPlayerData(id).stats,
        role: getPlayerData(id).role
      }
    }))
    
    const batchResults = await calculateBatch(players)
    setResults(batchResults)
    setCompared(true)
  }, [playerIds, isReady, calculateBatch])
  
  // Find best and worst performers
  const ranked = Array.from(results.entries())
    .sort((a, b) => b[1].rating - a[1].rating)
  
  const best = ranked[0] || null
  const worst = ranked[ranked.length - 1] || null
  const average = ranked.length > 0
    ? ranked.reduce((sum, [, result]) => sum + result.rating, 0) / ranked.length
    : 0
  
  return {
    compare,
    results,
    ranked,
    best,
    worst,
    average,
    isCalculating,
    isReady,
    compared
  }
}

export default useSimRating
