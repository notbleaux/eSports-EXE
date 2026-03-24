/** [Ver001.000]
 * AnalyticalLensSelector Component
 * ================================
 * UI component for selecting and configuring the 8 SpecMap V2 Analytical Lenses.
 * 
 * Features:
 * - Lens selection with toggle switches
 * - Opacity control per lens
 * - Preset configurations
 * - Lens category filtering
 * - Real-time preview
 */

import React, { useState, useCallback, useMemo } from 'react'
import {
  ANALYTICAL_LENS_REGISTRY,
  LENS_PRESETS,
  getLensesByCategory,
  getPresetLenses,
  validateLensInputs,
  getMissingInputs,
  type LensMetadata
} from '@/lib/lenses/analytical-index'

// ============================================================================
// Types
// ============================================================================

/** Lens selection state */
export interface LensSelection {
  /** Lens ID */
  id: string
  /** Whether lens is enabled */
  enabled: boolean
  /** Lens opacity (0-1) */
  opacity: number
  /** Custom lens options */
  options?: Record<string, unknown>
}

/** Selector props */
export interface AnalyticalLensSelectorProps {
  /** Current lens selections */
  selections: LensSelection[]
  /** Available input data (for validation) */
  availableInputs?: string[]
  /** Callback when selection changes */
  onChange: (selections: LensSelection[]) => void
  /** Callback when preset is selected */
  onPresetSelect?: (presetName: string) => void
  /** Additional className */
  className?: string
  /** Disabled state */
  disabled?: boolean
}

/** Category filter type */
type CategoryFilter = LensMetadata['category'] | 'all'

// ============================================================================
// Component
// ============================================================================

/**
 * AnalyticalLensSelector Component
 * 
 * Provides UI for selecting and configuring analytical lenses.
 */
export const AnalyticalLensSelector: React.FC<AnalyticalLensSelectorProps> = ({
  selections,
  availableInputs = [],
  onChange,
  onPresetSelect,
  className = '',
  disabled = false
}) => {
  // State for category filter
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all')
  
  // State for expanded lens details
  const [expandedLens, setExpandedLens] = useState<string | null>(null)
  
  // Get all lens metadata
  const allLenses = useMemo(() => Object.values(ANALYTICAL_LENS_REGISTRY), [])
  
  // Filter lenses by category
  const filteredLenses = useMemo(() => {
    if (categoryFilter === 'all') return allLenses
    return getLensesByCategory(categoryFilter)
  }, [allLenses, categoryFilter])
  
  // Get presets
  const presets = useMemo(() => Object.keys(LENS_PRESETS), [])
  
  // Handle lens toggle
  const handleToggleLens = useCallback((lensId: string) => {
    const existingSelection = selections.find(s => s.id === lensId)
    
    if (existingSelection) {
      // Toggle existing
      onChange(selections.map(s => 
        s.id === lensId ? { ...s, enabled: !s.enabled } : s
      ))
    } else {
      // Add new with default values
      const metadata = ANALYTICAL_LENS_REGISTRY[lensId]
      onChange([
        ...selections,
        {
          id: lensId,
          enabled: true,
          opacity: metadata?.defaultOpacity ?? 0.7
        }
      ])
    }
  }, [selections, onChange])
  
  // Handle opacity change
  const handleOpacityChange = useCallback((lensId: string, opacity: number) => {
    onChange(selections.map(s => 
      s.id === lensId ? { ...s, opacity } : s
    ))
  }, [selections, onChange])
  
  // Handle preset selection
  const handlePresetSelect = useCallback((preset: string) => {
    const lensIds = getPresetLenses(preset as keyof typeof LENS_PRESETS)
    
    const newSelections: LensSelection[] = lensIds.map(id => {
      const existing = selections.find(s => s.id === id)
      const metadata = ANALYTICAL_LENS_REGISTRY[id]
      
      return existing || {
        id,
        enabled: true,
        opacity: metadata?.defaultOpacity ?? 0.7
      }
    })
    
    onChange(newSelections)
    onPresetSelect?.(preset)
  }, [selections, onChange, onPresetSelect])
  
  // Get selection state for a lens
  const getSelection = useCallback((lensId: string): LensSelection => {
    return selections.find(s => s.id === lensId) || {
      id: lensId,
      enabled: false,
      opacity: ANALYTICAL_LENS_REGISTRY[lensId]?.defaultOpacity ?? 0.7
    }
  }, [selections])
  
  // Get category icon
  const getCategoryIcon = (category: LensMetadata['category']): string => {
    switch (category) {
      case 'predictive': return '🔮'
      case 'positional': return '📍'
      case 'strategic': return '🎯'
      case 'economic': return '💰'
      default: return '📊'
    }
  }
  
  // Get category label
  const getCategoryLabel = (category: LensMetadata['category']): string => {
    switch (category) {
      case 'predictive': return 'Predictive'
      case 'positional': return 'Positional'
      case 'strategic': return 'Strategic'
      case 'economic': return 'Economic'
      default: return category
    }
  }
  
  return (
    <div className={`analytical-lens-selector ${className}`}>
      {/* Header */}
      <div className="selector-header">
        <h3 className="selector-title">Analytical Lenses</h3>
        <span className="lens-count">
          {selections.filter(s => s.enabled).length}/8 active
        </span>
      </div>
      
      {/* Presets */}
      <div className="preset-section">
        <label className="section-label">Presets</label>
        <div className="preset-buttons">
          {presets.map(preset => (
            <button
              key={preset}
              className="preset-button"
              onClick={() => handlePresetSelect(preset)}
              disabled={disabled}
            >
              {preset.charAt(0).toUpperCase() + preset.slice(1)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Category Filter */}
      <div className="filter-section">
        <label className="section-label">Filter</label>
        <div className="category-filters">
          <button
            className={`filter-button ${categoryFilter === 'all' ? 'active' : ''}`}
            onClick={() => setCategoryFilter('all')}
            disabled={disabled}
          >
            All
          </button>
          {(['predictive', 'positional', 'strategic', 'economic'] as const).map(cat => (
            <button
              key={cat}
              className={`filter-button ${categoryFilter === cat ? 'active' : ''}`}
              onClick={() => setCategoryFilter(cat)}
              disabled={disabled}
            >
              {getCategoryIcon(cat)} {getCategoryLabel(cat)}
            </button>
          ))}
        </div>
      </div>
      
      {/* Lens List */}
      <div className="lens-list">
        {filteredLenses.map(lens => {
          const selection = getSelection(lens.id)
          const isValid = validateLensInputs(lens.id, availableInputs)
          const missingInputs = getMissingInputs(lens.id, availableInputs)
          const isExpanded = expandedLens === lens.id
          
          return (
            <div
              key={lens.id}
              className={`lens-item ${selection.enabled ? 'enabled' : ''} ${!isValid ? 'invalid' : ''}`}
            >
              {/* Toggle Switch */}
              <label className="lens-toggle">
                <input
                  type="checkbox"
                  checked={selection.enabled}
                  onChange={() => handleToggleLens(lens.id)}
                  disabled={disabled || !isValid}
                />
                <span className="toggle-slider" />
              </label>
              
              {/* Lens Info */}
              <div className="lens-info">
                <div className="lens-header">
                  <span className="lens-icon">{getCategoryIcon(lens.category)}</span>
                  <span className="lens-name">{lens.name}</span>
                  {!isValid && (
                    <span className="validation-warning" title={`Missing: ${missingInputs.join(', ')}`}>
                      ⚠️
                    </span>
                  )}
                </div>
                <p className="lens-description">{lens.description}</p>
              </div>
              
              {/* Opacity Control */}
              {selection.enabled && (
                <div className="lens-controls">
                  <div className="opacity-control">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={selection.opacity}
                      onChange={(e) => handleOpacityChange(lens.id, parseFloat(e.target.value))}
                      disabled={disabled}
                      className="opacity-slider"
                    />
                    <span className="opacity-value">{Math.round(selection.opacity * 100)}%</span>
                  </div>
                </div>
              )}
              
              {/* Expand Button */}
              <button
                className="expand-button"
                onClick={() => setExpandedLens(isExpanded ? null : lens.id)}
              >
                {isExpanded ? '▲' : '▼'}
              </button>
              
              {/* Expanded Details */}
              {isExpanded && (
                <div className="lens-details">
                  <div className="detail-row">
                    <span className="detail-label">Category:</span>
                    <span className="detail-value">{getCategoryLabel(lens.category)}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Required Inputs:</span>
                    <span className="detail-value">{lens.requiredInputs.join(', ')}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Supported Modes:</span>
                    <span className="detail-value">{lens.supportedModes.join(', ')}</span>
                  </div>
                  {!isValid && (
                    <div className="detail-row missing">
                      <span className="detail-label">Missing Inputs:</span>
                      <span className="detail-value">{missingInputs.join(', ')}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      
      {/* Summary */}
      <div className="selector-summary">
        <div className="summary-item">
          <span className="summary-label">Active Lenses:</span>
          <span className="summary-value">{selections.filter(s => s.enabled).length}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Avg Opacity:</span>
          <span className="summary-value">
            {selections.filter(s => s.enabled).length > 0
              ? Math.round(
                  selections
                    .filter(s => s.enabled)
                    .reduce((sum, s) => sum + s.opacity, 0) /
                    selections.filter(s => s.enabled).length *
                    100
                )
              : 0}%
          </span>
        </div>
      </div>
      
      {/* Styles */}
      <style>{`
        .analytical-lens-selector {
          background: #1e293b;
          border-radius: 8px;
          padding: 16px;
          color: #e2e8f0;
          font-family: system-ui, -apple-system, sans-serif;
          max-width: 400px;
        }
        
        .selector-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
          padding-bottom: 12px;
          border-bottom: 1px solid #334155;
        }
        
        .selector-title {
          margin: 0;
          font-size: 18px;
          font-weight: 600;
        }
        
        .lens-count {
          font-size: 14px;
          color: #94a3b8;
        }
        
        .section-label {
          display: block;
          font-size: 12px;
          text-transform: uppercase;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .preset-section {
          margin-bottom: 16px;
        }
        
        .preset-buttons {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        
        .preset-button {
          padding: 6px 12px;
          border: 1px solid #475569;
          background: #334155;
          color: #e2e8f0;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        
        .preset-button:hover:not(:disabled) {
          background: #475569;
        }
        
        .preset-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .filter-section {
          margin-bottom: 16px;
        }
        
        .category-filters {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
        }
        
        .filter-button {
          padding: 4px 10px;
          border: 1px solid #475569;
          background: transparent;
          color: #94a3b8;
          border-radius: 4px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        
        .filter-button.active {
          background: #3b82f6;
          border-color: #3b82f6;
          color: white;
        }
        
        .filter-button:hover:not(:disabled) {
          border-color: #64748b;
        }
        
        .lens-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
          max-height: 400px;
          overflow-y: auto;
        }
        
        .lens-item {
          display: grid;
          grid-template-columns: auto 1fr auto auto;
          gap: 12px;
          align-items: start;
          padding: 12px;
          background: #0f172a;
          border-radius: 6px;
          border: 1px solid transparent;
          transition: all 0.2s;
        }
        
        .lens-item.enabled {
          border-color: #3b82f6;
        }
        
        .lens-item.invalid {
          opacity: 0.6;
        }
        
        .lens-toggle {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          cursor: pointer;
        }
        
        .lens-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        
        .toggle-slider {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #475569;
          border-radius: 24px;
          transition: 0.3s;
        }
        
        .toggle-slider:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 3px;
          bottom: 3px;
          background: white;
          border-radius: 50%;
          transition: 0.3s;
        }
        
        input:checked + .toggle-slider {
          background: #3b82f6;
        }
        
        input:checked + .toggle-slider:before {
          transform: translateX(20px);
        }
        
        input:disabled + .toggle-slider {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .lens-info {
          min-width: 0;
        }
        
        .lens-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 4px;
        }
        
        .lens-icon {
          font-size: 16px;
        }
        
        .lens-name {
          font-weight: 600;
          font-size: 14px;
        }
        
        .validation-warning {
          color: #eab308;
          font-size: 12px;
        }
        
        .lens-description {
          margin: 0;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.4;
        }
        
        .lens-controls {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        
        .opacity-control {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .opacity-slider {
          width: 80px;
          height: 4px;
          -webkit-appearance: none;
          background: #475569;
          border-radius: 2px;
          outline: none;
        }
        
        .opacity-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          background: #3b82f6;
          border-radius: 50%;
          cursor: pointer;
        }
        
        .opacity-value {
          font-size: 12px;
          color: #94a3b8;
          min-width: 36px;
        }
        
        .expand-button {
          padding: 4px 8px;
          background: transparent;
          border: none;
          color: #64748b;
          cursor: pointer;
          font-size: 12px;
        }
        
        .expand-button:hover {
          color: #e2e8f0;
        }
        
        .lens-details {
          grid-column: 1 / -1;
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid #334155;
          font-size: 12px;
        }
        
        .detail-row {
          display: flex;
          gap: 8px;
          margin-bottom: 4px;
        }
        
        .detail-row.missing {
          color: #eab308;
        }
        
        .detail-label {
          color: #64748b;
          min-width: 100px;
        }
        
        .detail-value {
          color: #e2e8f0;
        }
        
        .selector-summary {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
          padding-top: 12px;
          border-top: 1px solid #334155;
          font-size: 14px;
        }
        
        .summary-label {
          color: #64748b;
        }
        
        .summary-value {
          font-weight: 600;
          color: #3b82f6;
        }
      `}</style>
    </div>
  )
}

/** Default export */
export default AnalyticalLensSelector
