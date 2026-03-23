/** [Ver001.000]
 * Tactical Lens Selector - SpecMap V2
 * 
 * UI Component for selecting and configuring the 8 Tactical Lenses.
 * Provides lens selection, opacity control, and quick stats display.
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
  TACTICAL_LENS_REGISTRY,
  getAllTacticalLenses,
  type TacticalLensRegistryEntry
} from '@/lib/lenses/tactical-index'

// ============================================================================
// Types
// ============================================================================

/** Lens selection state */
export interface LensSelection {
  id: string
  enabled: boolean
  opacity: number
  config: Record<string, unknown>
}

/** Selector props */
export interface TacticalLensSelectorProps {
  /** Currently selected lens IDs */
  selectedLenses?: string[]
  /** Callback when selection changes */
  onSelectionChange?: (lenses: LensSelection[]) => void
  /** Callback when lens is toggled */
  onLensToggle?: (lensId: string, enabled: boolean) => void
  /** Callback when opacity changes */
  onOpacityChange?: (lensId: string, opacity: number) => void
  /** Whether selector is disabled */
  disabled?: boolean
  /** Compact mode (minimal UI) */
  compact?: boolean
  /** Custom className */
  className?: string
}

/** Lens category grouping */
interface LensCategory {
  name: string
  lenses: TacticalLensRegistryEntry[]
}

// ============================================================================
// Constants
// ============================================================================

const CATEGORY_ORDER = ['vision', 'positioning', 'timing', 'effectiveness']

const CATEGORY_LABELS: Record<string, string> = {
  vision: 'Vision & Coverage',
  positioning: 'Positioning',
  timing: 'Timing & Execution',
  effectiveness: 'Performance'
}

const LENS_CATEGORY_MAP: Record<string, string> = {
  'vision-cone': 'vision',
  'crossfire-analysis': 'vision',
  'retake-efficiency': 'positioning',
  'entry-fragging': 'timing',
  'post-plant': 'positioning',
  'fake-detection': 'timing',
  'anchor-performance': 'effectiveness',
  'lurk-effectiveness': 'effectiveness'
}

// ============================================================================
// Component
// ============================================================================

export const TacticalLensSelector: React.FC<TacticalLensSelectorProps> = ({
  selectedLenses = [],
  onSelectionChange,
  onLensToggle,
  onOpacityChange,
  disabled = false,
  compact = false,
  className = ''
}) => {
  // Local state for lens selections
  const [selections, setSelections] = useState<Record<string, LensSelection>>(() => {
    const initial: Record<string, LensSelection> = {}
    for (const lens of getAllTacticalLenses()) {
      initial[lens.name] = {
        id: lens.name,
        enabled: selectedLenses.includes(lens.name),
        opacity: 0.7,
        config: {}
      }
    }
    return initial
  })

  // Group lenses by category
  const categories = useMemo((): LensCategory[] => {
    const groups: Record<string, TacticalLensRegistryEntry[]> = {}
    
    for (const lens of getAllTacticalLenses()) {
      const category = LENS_CATEGORY_MAP[lens.name] || 'other'
      if (!groups[category]) {
        groups[category] = []
      }
      groups[category].push(lens)
    }

    return CATEGORY_ORDER.map(cat => ({
      name: CATEGORY_LABELS[cat] || cat,
      lenses: groups[cat] || []
    })).filter(cat => cat.lenses.length > 0)
  }, [])

  // Handle lens toggle
  const handleToggle = useCallback((lensId: string) => {
    setSelections(prev => {
      const updated = {
        ...prev,
        [lensId]: {
          ...prev[lensId],
          enabled: !prev[lensId]?.enabled
        }
      }
      
      onLensToggle?.(lensId, updated[lensId].enabled)
      onSelectionChange?.(Object.values(updated))
      
      return updated
    })
  }, [onLensToggle, onSelectionChange])

  // Handle opacity change
  const handleOpacityChange = useCallback((lensId: string, opacity: number) => {
    setSelections(prev => {
      const updated = {
        ...prev,
        [lensId]: {
          ...prev[lensId],
          opacity
        }
      }
      
      onOpacityChange?.(lensId, opacity)
      onSelectionChange?.(Object.values(updated))
      
      return updated
    })
  }, [onOpacityChange, onSelectionChange])

  // Handle select all
  const handleSelectAll = useCallback(() => {
    setSelections(prev => {
      const updated: Record<string, LensSelection> = {}
      for (const key of Object.keys(prev)) {
        updated[key] = { ...prev[key], enabled: true }
      }
      onSelectionChange?.(Object.values(updated))
      return updated
    })
  }, [onSelectionChange])

  // Handle clear all
  const handleClearAll = useCallback(() => {
    setSelections(prev => {
      const updated: Record<string, LensSelection> = {}
      for (const key of Object.keys(prev)) {
        updated[key] = { ...prev[key], enabled: false }
      }
      onSelectionChange?.(Object.values(updated))
      return updated
    })
  }, [onSelectionChange])

  // Count enabled lenses
  const enabledCount = useMemo(() => 
    Object.values(selections).filter(s => s.enabled).length,
    [selections]
  )

  // Compact mode render
  if (compact) {
    return (
      <div className={`tactical-lens-selector compact ${className}`}>
        <div className="lens-chips">
          {getAllTacticalLenses().map(lens => (
            <button
              key={lens.name}
              className={`lens-chip ${selections[lens.name]?.enabled ? 'active' : ''}`}
              onClick={() => handleToggle(lens.name)}
              disabled={disabled}
              title={lens.description}
            >
              {getLensIcon(lens.name)}
              <span>{lens.displayName}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Full mode render
  return (
    <div className={`tactical-lens-selector ${className}`}>
      {/* Header */}
      <div className="selector-header">
        <h3>Tactical Lenses</h3>
        <div className="selector-actions">
          <span className="enabled-count">{enabledCount}/8 active</span>
          <button onClick={handleSelectAll} disabled={disabled}>All</button>
          <button onClick={handleClearAll} disabled={disabled}>None</button>
        </div>
      </div>

      {/* Categories */}
      <div className="lens-categories">
        {categories.map(category => (
          <div key={category.name} className="lens-category">
            <h4>{category.name}</h4>
            <div className="lens-list">
              {category.lenses.map(lens => (
                <LensItem
                  key={lens.name}
                  lens={lens}
                  selection={selections[lens.name]}
                  onToggle={() => handleToggle(lens.name)}
                  onOpacityChange={(opacity) => handleOpacityChange(lens.name, opacity)}
                  disabled={disabled}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ============================================================================
// Lens Item Component
// ============================================================================

interface LensItemProps {
  lens: TacticalLensRegistryEntry
  selection?: LensSelection
  onToggle: () => void
  onOpacityChange: (opacity: number) => void
  disabled?: boolean
}

const LensItem: React.FC<LensItemProps> = ({
  lens,
  selection,
  onToggle,
  onOpacityChange,
  disabled
}) => {
  const isEnabled = selection?.enabled ?? false
  const opacity = selection?.opacity ?? 0.7

  return (
    <div className={`lens-item ${isEnabled ? 'enabled' : ''}`}>
      <div className="lens-header">
        <label className="lens-toggle">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={onToggle}
            disabled={disabled}
          />
          <span className="checkmark">{getLensIcon(lens.name)}</span>
        </label>
        
        <div className="lens-info">
          <span className="lens-name">{lens.displayName}</span>
          <span className="lens-id">{lens.lensId}</span>
        </div>
        
        <div className="lens-weight" title={`Memory: ~${lens.memoryEstimate}MB`}>
          {getWeightIcon(lens.weight)}
        </div>
      </div>

      <p className="lens-description">{lens.description}</p>

      {isEnabled && (
        <div className="lens-controls">
          <label className="opacity-control">
            <span>Opacity</span>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={opacity}
              onChange={(e) => onOpacityChange(parseFloat(e.target.value))}
              disabled={disabled}
            />
            <span className="opacity-value">{Math.round(opacity * 100)}%</span>
          </label>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// Helper Functions
// ============================================================================

/** Get icon for lens type */
function getLensIcon(lensName: string): string {
  const icons: Record<string, string> = {
    'vision-cone': '👁️',
    'crossfire-analysis': '✕',
    'retake-efficiency': '↩️',
    'entry-fragging': '🚪',
    'post-plant': '💣',
    'fake-detection': '🎭',
    'anchor-performance': '⚓',
    'lurk-effectiveness': '🥷'
  }
  return icons[lensName] || '🔍'
}

/** Get icon for lens weight */
function getWeightIcon(weight: string): string {
  const icons: Record<string, string> = {
    light: '⚡',
    medium: '⚖️',
    heavy: '🔋'
  }
  return icons[weight] || '⚪'
}

// ============================================================================
// Styles (CSS-in-JS for portability)
// ============================================================================

export const TacticalLensSelectorStyles = `
.tactical-lens-selector {
  background: rgba(20, 25, 35, 0.95);
  border: 1px solid rgba(100, 150, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  color: #e0e6ed;
  font-family: system-ui, -apple-system, sans-serif;
  max-width: 400px;
}

.selector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(100, 150, 255, 0.2);
}

.selector-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #64a0ff;
}

.selector-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.enabled-count {
  font-size: 12px;
  color: #8a94a6;
  margin-right: 8px;
}

.selector-actions button {
  background: rgba(100, 150, 255, 0.1);
  border: 1px solid rgba(100, 150, 255, 0.3);
  color: #8a94a6;
  padding: 4px 10px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 11px;
  transition: all 0.2s;
}

.selector-actions button:hover:not(:disabled) {
  background: rgba(100, 150, 255, 0.2);
  color: #e0e6ed;
}

.lens-categories {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.lens-category h4 {
  margin: 0 0 8px 0;
  font-size: 12px;
  font-weight: 600;
  color: #8a94a6;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.lens-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.lens-item {
  background: rgba(30, 35, 45, 0.8);
  border: 1px solid rgba(100, 150, 255, 0.1);
  border-radius: 6px;
  padding: 12px;
  transition: all 0.2s;
}

.lens-item.enabled {
  border-color: rgba(100, 150, 255, 0.4);
  background: rgba(100, 150, 255, 0.05);
}

.lens-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lens-toggle {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
}

.lens-toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.checkmark {
  width: 28px;
  height: 28px;
  background: rgba(50, 55, 65, 0.8);
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.2s;
}

.lens-toggle input:checked + .checkmark {
  background: rgba(100, 150, 255, 0.3);
}

.lens-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.lens-name {
  font-size: 13px;
  font-weight: 500;
  color: #e0e6ed;
}

.lens-id {
  font-size: 10px;
  color: #5a6480;
}

.lens-weight {
  font-size: 12px;
  opacity: 0.6;
}

.lens-description {
  margin: 8px 0 0 38px;
  font-size: 11px;
  color: #8a94a6;
  line-height: 1.4;
}

.lens-controls {
  margin: 12px 0 0 38px;
  padding-top: 12px;
  border-top: 1px solid rgba(100, 150, 255, 0.1);
}

.opacity-control {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: #8a94a6;
}

.opacity-control span:first-child {
  min-width: 45px;
}

.opacity-control input[type="range"] {
  flex: 1;
  height: 4px;
  -webkit-appearance: none;
  background: rgba(100, 150, 255, 0.2);
  border-radius: 2px;
  outline: none;
}

.opacity-control input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 12px;
  height: 12px;
  background: #64a0ff;
  border-radius: 50%;
  cursor: pointer;
}

.opacity-value {
  min-width: 35px;
  text-align: right;
}

/* Compact Mode */
.tactical-lens-selector.compact {
  padding: 8px;
}

.lens-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.lens-chip {
  display: flex;
  align-items: center;
  gap: 4px;
  background: rgba(50, 55, 65, 0.8);
  border: 1px solid rgba(100, 150, 255, 0.2);
  border-radius: 16px;
  padding: 4px 10px;
  font-size: 11px;
  color: #8a94a6;
  cursor: pointer;
  transition: all 0.2s;
}

.lens-chip:hover:not(:disabled) {
  background: rgba(100, 150, 255, 0.1);
}

.lens-chip.active {
  background: rgba(100, 150, 255, 0.25);
  border-color: rgba(100, 150, 255, 0.5);
  color: #e0e6ed;
}

.lens-chip:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`

// ============================================================================
// Export
// ============================================================================

export default TacticalLensSelector
