/**
 * Enhanced Central Grid - Landing Page
 * Features all 4 hubs with twin-file integrity visualization
 */
import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Database, BarChart3, Users, Gamepad2, ArrowRight } from 'lucide-react'
import TwinFileVisualizer from './TwinFileVisualizer'

const hubs = [
  {
    id: 'sator',
    title: 'SATOR',
    subtitle: 'The Observatory',
    description: 'Raw data ingestion with orbital ring navigation',
    icon: Database,
    color: 'from-alert-amber to-orange-500',
    glow: 'group-hover:shadow-glow-amber',
    borderHover: 'group-hover:border-alert-amber/50',
    path: '/sator',
    stat: '2.4M Records',
    features: ['Immutable RAWS', 'Cryptographic Verification', 'Orbital Navigation']
  },
  {
    id: 'rotas',
    title: 'ROTAS',
    subtitle: 'The Harmonic Layer',
    description: 'Advanced analytics with ellipse layer blending',
    icon: BarChart3,
    color: 'from-signal-cyan to-blue-500',
    glow: 'group-hover:shadow-glow-cyan',
    borderHover: 'group-hover:border-signal-cyan/50',
    path: '/rotas',
    stat: '99.9% Accuracy',
    features: ['Probability Engines', 'Layer Blending', 'Predictive Models']
  },
  {
    id: 'arepo',
    title: 'AREPO',
    subtitle: 'Questions & Knowledge',
    description: 'Central directory with radial navigation',
    icon: Users,
    color: 'from-porcelain to-slate',
    glow: 'group-hover:shadow-[0_0_40px_rgba(232,230,227,0.2)]',
    borderHover: 'group-hover:border-porcelain/30',
    path: '/arepo',
    stat: '2,135 Teams',
    features: ['Radial Navigation', 'AI Suggestions', 'Conical Directory']
  },
  {
    id: 'opera',
    title: 'OPERA',
    subtitle: 'Work & Simulation',
    description: 'Simulation platform with toroidal flow',
    icon: Gamepad2,
    color: 'from-cobalt to-signal-cyan',
    glow: 'group-hover:shadow-[0_0_40px_rgba(30,58,95,0.4)]',
    borderHover: 'group-hover:border-cobalt/50',
    path: '/opera',
    stat: 'Live Platform',
    features: ['Tactical Simulation', 'Resonant Matchmaking', 'Toroidal Flow']
  }
]

function CentralGrid() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-mist mb-8"
            animate={{ 
              boxShadow: ['0 0 0 rgba(0, 240, 255, 0)', '0 0 20px rgba(0, 240, 255, 0.2)', '0 0 0 rgba(0, 240, 255, 0)']
            }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <span className="w-2 h-2 bg-signal-cyan rounded-full animate-pulse" />
            <span className="text-sm font-mono text-slate">Platform v2.0 — All Hubs Online</span>
          </motion.div>

          <h1 className="font-display text-hero font-bold mb-6">
            <span className="gradient-text">NJZ</span>
            <span className="text-white"> ¿!? Platform</span>
          </h1>
          
          <p className="text-xl text-slate max-w-2xl mx-auto mb-8">
            Twin-file database system with SATOR/ROTAS infrastructure.
            <span className="text-porcelain"> 4eva and Nvr Die.</span>
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm font-mono text-slate">
            {[
              { label: 'RAWS', value: '↔', color: 'text-alert-amber' },
              { label: 'BASE', value: 'Sync', color: 'text-signal-cyan' },
              { label: 'Integrity', value: '100%', color: 'text-green-400' },
              { label: 'Latency', value: '<12ms', color: 'text-aged-gold' }
            ].map((badge) => (
              <span 
                key={badge.label}
                className="px-4 py-2 rounded-full bg-white/5 border border-mist"
              >
                {badge.label} <span className={badge.color}>{badge.value}</span>
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Hub Grid */}
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hubs.map((hub, index) => (
            <motion.div
              key={hub.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Link to={hub.path} className="block group h-full">
                <div className={`
                  glass-panel rounded-2xl p-8 h-full
                  border border-mist
                  transition-all duration-500
                  ${hub.glow}
                  ${hub.borderHover}
                `}>
                  <div className="flex items-start justify-between mb-6">
                    <div className={`
                      w-14 h-14 rounded-xl bg-gradient-to-br ${hub.color}
                      flex items-center justify-center
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      <hub.icon className="w-7 h-7 text-void-black" />
                    </div>
                    
                    <div className="text-right">
                      <span className="font-mono text-xs text-slate block">
                        {hub.stat}
                      </span>
                      <motion.div
                        className="w-2 h-2 rounded-full bg-green-400 ml-auto mt-1"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      />
                    </div>
                  </div>

                  <h2 className="font-display text-2xl font-bold mb-2">
                    {hub.title}
                  </h2>
                  
                  <p className="text-sm text-signal-cyan font-mono mb-3">
                    {hub.subtitle}
                  </p>
                  
                  <p className="text-slate mb-6">
                    {hub.description}
                  </p>

                  {/* Features */}
                  <div className="space-y-2 mb-6">
                    {hub.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-slate">
                        <div className="w-1 h-1 rounded-full bg-signal-cyan" />
                        {feature}
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="group-hover:text-signal-cyan transition-colors">
                      Enter Hub
                    </span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Twin File Visualization */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="max-w-4xl mx-auto mt-16"
      >
        <TwinFileVisualizer />
      </motion.div>

      {/* Platform Stats */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 0.5 }}
        className="max-w-6xl mx-auto mt-16"
      >
        <div className="glass-panel rounded-2xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { label: 'Total Records', value: '2.4M+' },
              { label: 'Active Users', value: '12.8K' },
              { label: 'Uptime', value: '99.99%' },
              { label: 'Data Sources', value: '47' },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl font-display font-bold text-signal-cyan mb-1">{stat.value}</div>
                <div className="text-sm text-slate">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default CentralGrid
