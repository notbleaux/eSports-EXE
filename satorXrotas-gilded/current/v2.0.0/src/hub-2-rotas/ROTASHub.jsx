[Ver002.000]

/**
 * ROTASHub.jsx — Hub 2: The Harmonic Layer
 * NJZ Platform v2.0
 * 
 * Advanced analytics hub implementing ellipse layer blending.
 * Processes RAWS data through the BASE (Base Analytics System for Esports)
 * using Jungian archetype mapping: Persona, Shadow, and Animus layers.
 * 
 * Features:
 * - Three-layer analytics (Persona/Shadow/Animus)
 * - Interactive layer toggling
 * - Harmonic ellipse visualization
 * - Correlation scoring
 * - Probability metrics
 * 
 * @module ROTASHub
 * @version 2.0.0
 * @since 2024-03
 * @partof SATORxROTAS Platform
 * @see SATORHub — Data ingestion counterpart
 */

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Zap, Eye, Brain, Activity, TrendingUp, AlertTriangle } from 'lucide-react'
import HubWrapper, { HubCard, HubStatCard } from '../shared/components/HubWrapper'
import { useNJZStore, useHubState } from '../shared/store/njzStore'

/**
 * Analytics layer definitions
 * Based on Jungian psychological archetypes
 */
const layers = [
  { 
    id: 'persona', 
    label: 'Persona', 
    icon: Eye, 
    description: 'Surface metrics — KDA, win rate, ACS', 
    color: '#00f0ff',
    metrics: ['KDA Ratio', 'Win Rate', 'ACS Score', 'Headshot %']
  },
  { 
    id: 'shadow', 
    label: 'Shadow', 
    icon: Zap, 
    description: 'Hidden metrics — clutch performance, tilt indicators', 
    color: '#ff9f1c',
    metrics: ['Clutch Rate', 'Tilt Score', 'Momentum', 'Consistency']
  },
  { 
    id: 'animus', 
    label: 'Animus', 
    icon: Brain, 
    description: 'Predictive models — outcome forecasting', 
    color: '#c9b037',
    metrics: ['Match Prediction', 'Player Potential', 'Risk Factor', 'ROI']
  }
]

/**
 * Mock probability metrics for demonstration
 */
const mockData = [
  { metric: 'Match Accuracy', value: 87.3, trend: '+2.1%', status: 'good' },
  { metric: 'Investment Score', value: 92.1, trend: '+5.4%', status: 'good' },
  { metric: 'Risk Factor', value: 78.5, trend: '-1.2%', status: 'warning' },
  { metric: 'Talent Potential', value: 94.2, trend: '+3.8%', status: 'good' }
]

/**
 * ROTAS Hub Component
 * The Harmonic Layer — Multi-layer analytics visualization
 */
function ROTASHub() {
  const [activeLayers, setActiveLayers] = useState(['persona'])
  const [selectedMetric, setSelectedMetric] = useState(null)
  const addNotification = useNJZStore(state => state.addNotification)
  const { state, setState } = useHubState('rotas')

  const toggleLayer = (layerId) => {
    const newLayers = activeLayers.includes(layerId) 
      ? activeLayers.filter(id => id !== layerId)
      : [...activeLayers, layerId]
    
    setActiveLayers(newLayers)
    setState({ activeLayers: newLayers })
    
    addNotification(
      `${layers.find(l => l.id === layerId)?.label} layer ${newLayers.includes(layerId) ? 'activated' : 'deactivated'}`,
      'info'
    )
  }

  const correlation = Math.round(70 + (activeLayers.length / layers.length) * 30)

  return (
    <HubWrapper hubId="rotas">
      {/* Stats Row */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HubStatCard label="Correlation" value={`${correlation}%`} 
            change={activeLayers.length > 1 ? '+Improved' : 'Base'} color="cyan" />
          <HubStatCard label="Active Layers" value={activeLayers.length.toString()} 
            change={`/ ${layers.length}`} color="amber" />
          <HubStatCard label="Prediction Confidence" value={`${(correlation * 0.92).toFixed(1)}%`} 
            change="High" color="gold" />
          <HubStatCard label="Processing" value="Real-time" change="60fps" color="green" />
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          
          {/* Layer Control */}
          <HubCard accent="cyan">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-signal-cyan" />
                <h3 className="font-display font-semibold">Analytics Layers</h3>
              </div>
              <div className="text-xs text-slate">Select layers to blend</div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {layers.map((layer) => {
                const isActive = activeLayers.includes(layer.id)
                
                return (
                  <motion.button
                    key={layer.id}
                    onClick={() => toggleLayer(layer.id)}
                    className={`
                      relative p-6 rounded-xl text-left transition-all duration-300
                      ${isActive 
                        ? 'bg-signal-cyan/10 border-2 border-signal-cyan' 
                        : 'bg-void-mid border-2 border-transparent hover:border-white/10'
                      }
                    `}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${layer.color}20` }}
                      >
                        <layer.icon className="w-6 h-6" style={{ color: layer.color }} />
                      </div>
                      
                      <div className={`
                        w-6 h-6 rounded-full border-2 flex items-center justify-center
                        ${isActive ? 'border-signal-cyan bg-signal-cyan' : 'border-slate'}
                      `}>
                        {isActive && (
                          <svg className="w-4 h-4 text-void-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    </div>

                    <h4 className="font-display font-semibold text-lg mb-2" style={{ color: isActive ? layer.color : 'white' }}>
                      {layer.label}
                    </h4>
                    
                    <p className="text-sm text-slate">{layer.description}</p>
                  </motion.button>
                )
              })}
            </div>
          </HubCard>
        </div>
      </div>
    </HubWrapper>
  )
}

export default ROTASHub
