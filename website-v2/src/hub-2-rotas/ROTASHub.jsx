/**
 * ROTAS Hub - Hub 2: The Harmonic Layer
 * Advanced analytics with ellipse layer blending
 */
import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Zap, Eye, Brain, Activity, TrendingUp, AlertTriangle } from 'lucide-react'
import HubWrapper, { HubCard, HubStatCard } from '../shared/components/HubWrapper'
import { useNJZStore, useHubState } from '../shared/store/njzStore'

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

const mockData = [
  { metric: 'Match Accuracy', value: 87.3, trend: '+2.1%', status: 'good' },
  { metric: 'Investment Score', value: 92.1, trend: '+5.4%', status: 'good' },
  { metric: 'Risk Factor', value: 78.5, trend: '-1.2%', status: 'warning' },
  { metric: 'Talent Potential', value: 94.2, trend: '+3.8%', status: 'good' }
]

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

  const correlation = Math.round(
    70 + (activeLayers.length / layers.length) * 30
  )

  return (
    <HubWrapper hubId="rotas">
      {/* Stats Row */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HubStatCard 
            label="Correlation" 
            value={`${correlation}%`} 
            change={activeLayers.length > 1 ? '+Improved' : 'Base'}
            color="cyan" 
          />
          <HubStatCard 
            label="Active Layers" 
            value={activeLayers.length.toString()} 
            change={`/ ${layers.length}`}
            color="amber" 
          />
          <HubStatCard 
            label="Prediction Confidence" 
            value={`${(correlation * 0.92).toFixed(1)}%`} 
            change="High"
            color="gold" 
          />
          <HubStatCard 
            label="Processing" 
            value="Real-time" 
            change="60fps"
            color="green" 
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
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
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
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

                    <h4 
                      className="font-display font-semibold text-lg mb-2"
                      style={{ color: isActive ? layer.color : 'white' }}
                    >
                      {layer.label}
                    </h4>
                    
                    <p className="text-sm text-slate">{layer.description}</p>

                    {/* Metrics preview */}
                    <AnimatePresence>
                      {isActive && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-4 pt-4 border-t border-mist overflow-hidden"
                        >
                          <div className="flex flex-wrap gap-2">
                            {layer.metrics.map((metric) => (
                              <span 
                                key={metric}
                                className="text-xs px-2 py-1 rounded bg-void-black/50 text-slate"
                              >
                                {metric}
                              </span>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.button>
                )
              })}
            </div>
          </HubCard>

          {/* Ellipse Visualization */}
          <HubCard accent="cyan"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-signal-cyan" />
                <h3 className="font-display font-semibold">Harmonic Visualization</h3>
              </div>
              <div className="text-xs text-slate">Interactive ellipse layers</div>
            </div>

            <div className="relative aspect-square max-w-[400px] mx-auto">
              {/* Background glow */}
              <div className="absolute inset-0 bg-signal-cyan/5 rounded-full blur-3xl" />

              {/* Ellipses */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 400 400">
                {layers.map((layer, index) => {
                  const isActive = activeLayers.includes(layer.id)
                  const rx = 180 - index * 40
                  const ry = 100 - index * 20
                  
                  return (
                    <motion.g key={layer.id}>
                      <motion.ellipse
                        cx="200"
                        cy="200"
                        rx={rx}
                        ry={ry}
                        fill="none"
                        stroke={isActive ? layer.color : 'rgba(255,255,255,0.1)'}
                        strokeWidth={isActive ? 3 : 1}
                        opacity={isActive ? 1 : 0.3}
                        animate={{ 
                          rotate: isActive ? [0, 360] : 0,
                        }}
                        transition={{ 
                          rotate: { duration: 20 + index * 5, repeat: Infinity, ease: 'linear' }
                        }}
                        style={{ transformOrigin: 'center' }}
                      />
                      
                      {isActive && (
                        <>
                          {[...Array(3)].map((_, i) => (
                            <motion.circle
                              key={i}
                              r="4"
                              fill={layer.color}
                              animate={{
                                cx: [
                                  200 + rx * Math.cos((i * 120 * Math.PI) / 180),
                                  200 + rx * Math.cos(((i * 120 + 360) * Math.PI) / 180)
                                ],
                                cy: [
                                  200 + ry * Math.sin((i * 120 * Math.PI) / 180),
                                  200 + ry * Math.sin(((i * 120 + 360) * Math.PI) / 180)
                                ]
                              }}
                              transition={{
                                duration: 4 + index,
                                repeat: Infinity,
                                delay: i * 0.5,
                                ease: 'linear'
                              }}
                            />
                          ))}
                        </>
                      )}
                    </motion.g>
                  )
                })}
              </svg>

              {/* Center */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-signal-cyan to-cobalt 
                              flex items-center justify-center shadow-glow-cyan"
                >
                  <span className="font-display font-bold text-white text-sm">BASE</span>
                </div>
              </motion.div>
            </div>
          </HubCard>

          {/* Metrics */}
          <HubCard accent="cyan">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-5 h-5 text-signal-cyan" />
                <h3 className="font-display font-semibold">Probability Metrics</h3>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {mockData.map((item, index) => (
                <motion.div
                  key={item.metric}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`
                    p-4 rounded-xl bg-void-mid border cursor-pointer transition-all duration-300
                    ${selectedMetric === item.metric 
                      ? 'border-signal-cyan shadow-glow-cyan' 
                      : 'border-mist hover:border-white/20'
                    }
                  `}
                  onClick={() => setSelectedMetric(selectedMetric === item.metric ? null : item.metric)}
                >
                  <div className="text-xs text-slate mb-2">{item.metric}</div>
                  
                  <div className="text-2xl font-display font-bold text-porcelain mb-2">
                    {item.value}%
                  </div>
                  
                  <div className={`text-xs flex items-center gap-1
                    ${item.status === 'good' ? 'text-green-400' : 'text-yellow-400'}
                  `}>
                    {item.status === 'warning' && <AlertTriangle className="w-3 h-3" />}
                    {item.trend}
                  </div>

                  <AnimatePresence>
                    {selectedMetric === item.metric && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-4 pt-4 border-t border-mist"
                      >
                        <div className="h-2 bg-void-deep rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-signal-cyan to-aged-gold"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.value}%` }}
                            transition={{ duration: 1 }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </HubCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Layer Info */}
          <HubCard accent="cyan">
            <h3 className="font-display font-semibold mb-4">Active Layers</h3>
            
            <div className="space-y-3">
              {activeLayers.length === 0 ? (
                <p className="text-sm text-slate">No layers active. Select at least one layer.</p>
              ) : (
                layers.filter(l => activeLayers.includes(l.id)).map(layer => (
                  <div 
                    key={layer.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-void-mid"
                  >
                    <div 
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: `${layer.color}20` }}
                    >
                      <layer.icon className="w-4 h-4" style={{ color: layer.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-medium">{layer.label}</div>
                      <div className="text-xs text-slate">{layer.metrics.length} metrics</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </HubCard>

          {/* Correlation Gauge */}
          <HubCard accent="cyan">
            <h3 className="font-display font-semibold mb-4">Correlation Score</h3>
            
            <div className="flex items-center justify-center py-4">
              <div className="relative w-32 h-32">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth="8"
                  />
                  <motion.circle
                    cx="64"
                    cy="64"
                    r="56"
                    fill="none"
                    stroke="url(#gradient)"
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${correlation * 3.52} 352`}
                    initial={{ strokeDasharray: '0 352' }}
                    animate={{ strokeDasharray: `${correlation * 3.52} 352` }}
                    transition={{ duration: 1 }}
                  />
                  
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#00f0ff" />
                      <stop offset="100%" stopColor="#c9b037" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-2xl font-display font-bold">{correlation}%</span>
                  <span className="text-xs text-slate">{correlation > 90 ? 'Excellent' : correlation > 80 ? 'Good' : 'Fair'}</span>
                </div>
              </div>
            </div>
          </HubCard>

          {/* About BASE */}
          <HubCard>
            <h3 className="font-display font-semibold mb-4">About BASE</h3>
            
            <p className="text-sm text-slate mb-4">
              Base Analytics System for Esports (BASE) processes RAWS data through multi-layer harmonic analysis.
            </p>
            
            <div className="text-xs text-slate font-mono space-y-1">
              <div>Jungian Archetype Mapping</div>
              <div>Harmonic Wave Analysis</div>
              <div>Probability Cloud Modeling</div>
            </div>
          </HubCard>
        </div>
      </div>
    </HubWrapper>
  )
}

export default ROTASHub
