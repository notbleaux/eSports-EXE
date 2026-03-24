/** [Ver001.000]
 * PlayerRatingCard Component for 4NJZ4 TENET Platform
 * 
 * Displays a player card with SimRating calculated via Web Worker.
 * Shows loading state during calculation and supports both compact
 * and full display modes.
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useSimRating } from '../hooks/useSimRating'
import type { SimRatingResult } from '../../types/worker'

// Player data interface
export interface PlayerData {
  id: string
  name: string
  team?: string
  role: 'duelist' | 'initiator' | 'controller' | 'sentinel' | string
  region?: string
  stats: PlayerStats
}

export interface PlayerStats {
  // Combat stats
  kills?: number
  deaths?: number
  assists?: number
  kd_ratio?: number
  adr?: number
  damage?: number
  firstKills?: number
  first_kills_per_round?: number
  roundsPlayed?: number
  matchesPlayed?: number
  
  // Economy stats
  buy_efficiency?: number
  save_rate?: number
  
  // Clutch stats
  clutchesWon?: number
  clutch_success_rate?: number
  clutchOpportunities?: number
  
  // Support stats
  utility_usage?: number
  assists_per_round?: number
  
  // Entry stats
  entry_success_rate?: number
  entryWins?: number
  entryAttempts?: number
  
  // Confidence
  sample_size?: number
  stdDev?: number
  
  // Legacy/alt names for compatibility
  adjusted_kill_value?: number
}

interface PlayerRatingCardProps {
  player: PlayerData
  compact?: boolean
  showComponents?: boolean
  className?: string
  onRatingCalculated?: (result: SimRatingResult) => void
  onError?: (error: Error) => void
}

// Grade color mapping
const gradeColors: Record<string, string> = {
  'A+': '#10B981', // Emerald
  'A': '#22C55E',  // Green
  'B': '#3B82F6',  // Blue
  'C': '#F59E0B',  // Amber
  'D': '#EF4444',  // Red
  'N/A': '#9CA3AF' // Gray
}

// Role icon mapping
const roleIcons: Record<string, string> = {
  duelist: '⚔️',
  initiator: '🔍',
  controller: '☁️',
  sentinel: '🛡️'
}

/**
 * Compact rating badge component
 */
const RatingBadge: React.FC<{ 
  rating: number; 
  grade: string; 
  isCalculating: boolean 
}> = ({ rating, grade, isCalculating }) => {
  if (isCalculating) {
    return (
      <div className="rating-badge-loading" style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8
      }}>
        <div className="spinner" style={{
          width: 16,
          height: 16,
          border: '2px solid #E5E7EB',
          borderTop: '2px solid #3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <span style={{ fontSize: 12, color: '#6B7280' }}>Calc...</span>
      </div>
    )
  }
  
  const color = gradeColors[grade] || gradeColors['D']
  
  return (
    <div className="rating-badge" style={{
      display: 'flex',
      alignItems: 'center',
      gap: 8
    }}>
      <span style={{
        fontSize: 20,
        fontWeight: 'bold',
        color
      }}>
        {rating.toFixed(1)}
      </span>
      <span style={{
        fontSize: 12,
        padding: '2px 6px',
        borderRadius: 4,
        backgroundColor: color + '20',
        color,
        fontWeight: 600
      }}>
        {grade}
      </span>
    </div>
  )
}

/**
 * Component breakdown visualization
 */
const ComponentBreakdown: React.FC<{ components: SimRatingResult['components'] }> = ({ 
  components 
}) => {
  const items = [
    { label: 'Combat', value: components.combat, color: '#EF4444' },
    { label: 'Economy', value: components.economy, color: '#F59E0B' },
    { label: 'Clutch', value: components.clutch, color: '#8B5CF6' },
    { label: 'Support', value: components.support, color: '#10B981' },
    { label: 'Entry', value: components.entry, color: '#3B82F6' },
  ]
  
  return (
    <div className="component-breakdown" style={{ marginTop: 16 }}>
      <h4 style={{
        margin: '0 0 12px 0',
        fontSize: 12,
        fontWeight: 600,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Component Breakdown
      </h4>
      <div style={{ display: 'grid', gap: 8 }}>
        {items.map(({ label, value, color }) => (
          <div key={label} style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <span style={{
              fontSize: 12,
              color: '#6B7280',
              width: 60
            }}>{label}</span>
            <div style={{
              flex: 1,
              height: 6,
              backgroundColor: '#E5E7EB',
              borderRadius: 3,
              overflow: 'hidden'
            }}>
              <div style={{
                width: `${Math.min(value, 100)}%`,
                height: '100%',
                backgroundColor: color,
                borderRadius: 3,
                transition: 'width 0.5s ease-out'
              }} />
            </div>
            <span style={{
              fontSize: 12,
              fontWeight: 500,
              color: '#111827',
              width: 36,
              textAlign: 'right'
            }}>{value.toFixed(0)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * Key factors display
 */
const KeyFactors: React.FC<{ factors: string[] }> = ({ factors }) => {
  if (!factors || factors.length === 0) return null
  
  return (
    <div className="key-factors" style={{ marginTop: 16 }}>
      <h4 style={{
        margin: '0 0 8px 0',
        fontSize: 12,
        fontWeight: 600,
        color: '#6B7280',
        textTransform: 'uppercase',
        letterSpacing: '0.05em'
      }}>
        Key Factors
      </h4>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
        {factors.map((factor, i) => (
          <span key={i} style={{
            fontSize: 11,
            padding: '4px 8px',
            backgroundColor: '#F3F4F6',
            color: '#4B5563',
            borderRadius: 12,
            border: '1px solid #E5E7EB'
          }}>
            {factor}
          </span>
        ))}
      </div>
    </div>
  )
}

/**
 * Main PlayerRatingCard component
 */
export const PlayerRatingCard: React.FC<PlayerRatingCardProps> = ({
  player,
  compact = false,
  showComponents = true,
  className = '',
  onRatingCalculated,
  onError
}) => {
  const [rating, setRating] = useState<SimRatingResult | null>(null)
  
  const { 
    calculateForPlayer, 
    isCalculating, 
    isReady,
    getCachedResult 
  } = useSimRating({
    onCalculated: (result) => {
      setRating(result)
      onRatingCalculated?.(result)
    },
    onError: (error) => {
      onError?.(error)
    }
  })
  
  // Calculate rating on mount or player change
  useEffect(() => {
    if (!isReady) return
    
    // Check cache first
    const cached = getCachedResult(player.id, player.role)
    if (cached) {
      setRating(cached)
      onRatingCalculated?.(cached)
      return
    }
    
    // Calculate if not cached
    calculateForPlayer(
      player.id,
      player.stats as Record<string, number>,
      player.role,
      player.stats.sample_size ? Math.min(player.stats.sample_size / 20, 1) : 1
    ).catch(() => {
      // Error handled by onError callback
    })
  }, [player.id, player.role, isReady, calculateForPlayer, getCachedResult, onRatingCalculated])
  
  // Retry calculation
  const handleRetry = useCallback(() => {
    calculateForPlayer(
      player.id,
      player.stats as Record<string, number>,
      player.role,
      player.stats.sample_size ? Math.min(player.stats.sample_size / 20, 1) : 1
    ).catch(() => {})
  }, [player, calculateForPlayer])
  
  // Compact mode
  if (compact) {
    return (
      <div className={`player-rating-card-compact ${className}`} style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        borderRadius: 8,
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
      }}>
        {/* Avatar/Icon */}
        <div style={{
          width: 40,
          height: 40,
          borderRadius: '50%',
          backgroundColor: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 20
        }}>
          {roleIcons[player.role.toLowerCase()] || '👤'}
        </div>
        
        {/* Player Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontWeight: 600,
            fontSize: 14,
            color: '#111827',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}>
            {player.name}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            {player.role} {player.team && `• ${player.team}`}
          </div>
        </div>
        
        {/* Rating */}
        <RatingBadge 
          rating={rating?.rating ?? 0} 
          grade={rating?.grade ?? 'N/A'}
          isCalculating={isCalculating}
        />
      </div>
    )
  }
  
  // Full mode
  return (
    <div className={`player-rating-card ${className}`} style={{
      padding: 20,
      borderRadius: 12,
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E7EB',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      maxWidth: 360
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        marginBottom: 16
      }}>
        {/* Avatar */}
        <div style={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: '#F3F4F6',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 24
        }}>
          {roleIcons[player.role.toLowerCase()] || '👤'}
        </div>
        
        {/* Player Info */}
        <div style={{ flex: 1 }}>
          <h3 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 600,
            color: '#111827'
          }}>
            {player.name}
          </h3>
          <div style={{ 
            fontSize: 13, 
            color: '#6B7280',
            marginTop: 2
          }}>
            {player.role}
            {player.team && ` • ${player.team}`}
            {player.region && ` • ${player.region}`}
          </div>
        </div>
        
        {/* Main Rating */}
        <div style={{ textAlign: 'right' }}>
          {isCalculating ? (
            <div className="rating-loading" style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4
            }}>
              <div className="spinner" style={{
                width: 24,
                height: 24,
                border: '3px solid #E5E7EB',
                borderTop: '3px solid #3B82F6',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <span style={{ fontSize: 11, color: '#6B7280' }}>Calculating...</span>
            </div>
          ) : rating ? (
            <>
              <div style={{
                fontSize: 32,
                fontWeight: 'bold',
                color: gradeColors[rating.grade] || gradeColors['D'],
                lineHeight: 1
              }}>
                {rating.rating.toFixed(1)}
              </div>
              <div style={{
                fontSize: 12,
                color: '#6B7280',
                marginTop: 4
              }}>
                Grade <span style={{
                  fontWeight: 600,
                  color: gradeColors[rating.grade] || gradeColors['D']
                }}>{rating.grade}</span>
              </div>
            </>
          ) : (
            <div style={{ color: '#9CA3AF', fontSize: 14 }}>--</div>
          )}
        </div>
      </div>
      
      {/* Error State */}
      {!isCalculating && !rating && (
        <div style={{
          padding: 12,
          backgroundColor: '#FEF2F2',
          border: '1px solid #FECACA',
          borderRadius: 8,
          marginBottom: 16
        }}>
          <div style={{ fontSize: 13, color: '#DC2626' }}>
            Failed to calculate rating
          </div>
          <button
            onClick={handleRetry}
            style={{
              marginTop: 8,
              padding: '6px 12px',
              fontSize: 12,
              backgroundColor: '#DC2626',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      )}
      
      {/* Component Breakdown */}
      {showComponents && rating && (
        <ComponentBreakdown components={rating.components} />
      )}
      
      {/* Key Factors */}
      {rating && <KeyFactors factors={rating.factors} />}
      
      {/* Footer */}
      <div style={{
        marginTop: 16,
        paddingTop: 16,
        borderTop: '1px solid #E5E7EB',
        fontSize: 11,
        color: '#9CA3AF',
        display: 'flex',
        justifyContent: 'space-between'
      }}>
        <span>
          {player.stats.matchesPlayed !== undefined && (
            <>Sample: {player.stats.matchesPlayed} matches</>
          )}
          {player.stats.sample_size !== undefined && (
            <>Sample: {player.stats.sample_size} matches</>
          )}
        </span>
        <span>
          {rating ? (
            <>Confidence: {Math.round(rating.confidence * 100)}%</>
          ) : (
            'Calculating...'
          )}
        </span>
      </div>
      
      {/* CSS for spinner animation */}
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

export default PlayerRatingCard
