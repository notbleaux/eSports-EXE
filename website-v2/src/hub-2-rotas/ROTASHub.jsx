import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Layers, Zap, Eye, Brain, Activity } from 'lucide-react'

const layers = [
  { id: 'persona', label: 'Persona', icon: Eye, description: 'Surface metrics — KDA, win rate, ACS', color: '#00f0ff', active: true },
  { id: 'shadow', label: 'Shadow', icon: Zap, description: 'Hidden metrics — clutch performance, tilt indicators', color: '#ff9f1c', active: false },
  { id: 'animus', label: 'Animus', icon: Brain, description: 'Predictive models — outcome forecasting', color: '#c9b037', active: false }
]

const mockData = [
  { metric: 'Match Accuracy', value: 87.3, trend: '+2.1%' },
  { metric: 'Investment Score', value: 92.1, trend: '+5.4%' },
  { metric: 'Risk Factor', value: 78.5, trend: '-1.2%' },
  { metric: 'Talent Potential', value: 94.2, trend: '+3.8%' }
]

function ROTASHub() {
  const [activeLayers, setActiveLayers] = useState(['persona'])
  const [selectedMetric, setSelectedMetric] = useState(null)

  const toggleLayer = (layerId) => {
    setActiveLayers(prev => 
      prev.includes(layerId) 
        ? prev.filter(id => id !== layerId)
        : [...prev, layerId]
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-signal-cyan/10 border border-signal-cyan/30 mb-6">
            <Layers className="w-4 h-4 text-signal-cyan" />
            <span className="text-sm font-mono text-signal-cyan">ROTAS HUB</span>
          </div>

          <h1 className="font-display text-h1 font-bold mb-4">
            <span className="text-signal-cyan">The Harmonic Layer</span>
          </h1>
          
          <p className="text-xl text-slate max-w-2xl mx-auto">
            Advanced analytics with ellipse layer blending.
            <span className="text-porcelain"> Probability engines and predictive modeling.</span>
          </p>
        </motion.div>
      </div>

      {/* Layer Control */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="glass-panel rounded-2xl p-6">
          <h3 className="font-display font-semibold mb-6 flex items-center gap-2">
            <Layers className="w-5 h-5 text-signal-cyan" />
            Analytics Layers
          </h3>

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
                      {isActive && <svg className="w-4 h-4 text-void-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>}
                    </div>
                  </div>

                  <h4 className="font-display font-semibold text-lg mb-2" style={{ color: isActive ? layer.color : 'white' }}>
                    {layer.label}
                  </h4>
                  
                  <p className="text-sm text-slate">
                    {layer.description}
                  </p>
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Ellipse Visualization */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="relative aspect-square max-w-[500px] mx-auto">
          {/* Background glow */}
          <div className="absolute inset-0 bg-signal-cyan/5 rounded-full blur-3xl"></div>

          {/* Ellipses */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 500 500">
            {layers.map((layer, index) => {
              const isActive = activeLayers.includes(layer.id)
              const rx = 200 - index * 40
              const ry = 120 - index * 20
              
              return (
                <motion.ellipse
                  key={layer.id}
                  cx="250"
                  cy="250"
                  rx={rx}
                  ry={ry}
                  fill="none"
                  stroke={isActive ? layer.color : 'rgba(255,255,255,0.1)'}
                  strokeWidth={isActive ? 3 : 1}
                  opacity={isActive ? 1 : 0.3}
                  animate={{ 
                    rotate: isActive ? [0, 360] : 0,
                    scale: isActive ? [1, 1.05, 1] : 1
                  }}
                  transition={{ 
                    rotate: { duration: 20 + index * 5, repeat: Infinity, ease: 'linear' },
                    scale: { duration: 3, repeat: Infinity }
                  }}
                  style={{ transformOrigin: 'center' }}
                />
              )
            })}
          </svg>

          {/* Center */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-signal-cyan to-blue-500 flex flex-col items-center justify-center shadow-glow-cyan"
            >
              <span className="font-display font-bold text-void-black">BASE</span>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Metrics */}
      <div className="max-w-6xl mx-auto">
        <h3 className="font-display font-semibold text-xl mb-6 flex items-center gap-2">
          <Activity className="w-5 h-5 text-signal-cyan" />
          Probability Metrics
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {mockData.map((item, index) => (
            <motion.div
              key={item.metric}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                glass-panel rounded-xl p-6 cursor-pointer transition-all duration-300
                ${selectedMetric === item.metric ? 'border-signal-cyan shadow-glow-cyan' : 'hover:border-white/20'}
              `}
              onClick={() => setSelectedMetric(selectedMetric === item.metric ? null : item.metric)}
            >
              <div className="text-sm text-slate mb-2">{item.metric}</div>
              
              <div className="text-3xl font-display font-bold text-porcelain mb-2">
                {item.value}%
              </div>
              
              <div className="text-sm text-green-400 font-mono">
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
                    <div className="h-2 bg-void-mid rounded-full overflow-hidden">
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
      </div>
    </div>
  )
}

export default ROTASHub