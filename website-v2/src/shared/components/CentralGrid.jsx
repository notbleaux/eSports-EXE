import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Database, BarChart3, Users, Gamepad2 } from 'lucide-react'

const hubs = [
  {
    id: 'sator',
    title: 'SATOR',
    subtitle: 'The Observatory',
    description: 'Raw data ingestion with orbital ring navigation',
    icon: Database,
    color: 'from-alert-amber to-orange-500',
    glow: 'group-hover:shadow-glow-amber',
    path: '/sator',
    stat: '2.4M Records'
  },
  {
    id: 'rotas',
    title: 'ROTAS',
    subtitle: 'The Harmonic Layer',
    description: 'Advanced analytics with ellipse layer blending',
    icon: BarChart3,
    color: 'from-signal-cyan to-blue-500',
    glow: 'group-hover:shadow-glow-cyan',
    path: '/rotas',
    stat: '99.9% Accuracy'
  },
  {
    id: 'info',
    title: 'Information',
    subtitle: 'The Directory',
    description: 'Central directory with radial navigation',
    icon: Users,
    color: 'from-porcelain to-slate',
    glow: 'group-hover:shadow-[0_0_40px_rgba(232,230,227,0.2)]',
    path: '/info',
    stat: '2,135 Teams'
  },
  {
    id: 'games',
    title: 'Games',
    subtitle: 'The Nexus',
    description: 'Simulation platform with toroidal flow',
    icon: Gamepad2,
    color: 'from-deep-cobalt to-signal-cyan',
    glow: 'group-hover:shadow-[0_0_40px_rgba(30,58,95,0.4)]',
    path: '/games',
    stat: 'Live Platform'
  }
]

function CentralGrid() {
  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Hero */}
      <div className="max-w-7xl mx-auto text-center mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="font-display text-hero font-bold mb-6">
            <span className="gradient-text">NJZ</span>
            <span className="text-white"> ¿!? Platform</span>
          </h1>
          
          <p className="text-xl text-slate max-w-2xl mx-auto mb-8">
            Twin-file database system with SATOR/ROTAS infrastructure.
            <span className="text-porcelain"> 4eva and Nvr Die.</span>
          </p>

          <div className="flex flex-wrap justify-center gap-4 text-sm font-mono text-slate">
            <span className="px-4 py-2 rounded-full bg-white/5 border border-mist">
              RAWS <span className="text-signal-amber">↔</span> BASE
            </span>
            <span className="px-4 py-2 rounded-full bg-white/5 border border-mist">
              SHA-256 Verified
            </span>
            <span className="px-4 py-2 rounded-full bg-white/5 border border-mist">
              Real-time Sync
            </span>
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
              <Link to={hub.path} className="block group">
                <div className={`
                  glass-panel rounded-2xl p-8 h-full
                  transition-all duration-500
                  hover:border-white/20
                  ${hub.glow}
                `}>
                  <div className="flex items-start justify-between mb-6">
                    <div className={`
                      w-14 h-14 rounded-xl bg-gradient-to-br ${hub.color}
                      flex items-center justify-center
                      group-hover:scale-110 transition-transform duration-300
                    `}>
                      <hub.icon className="w-7 h-7 text-void-black" />
                    </div>
                    
                    <span className="font-mono text-xs text-slate">
                      {hub.stat}
                    </span>
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

                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="group-hover:text-signal-cyan transition-colors">
                      Enter Hub
                    </span>
                    <svg 
                      className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Twin File Visualization */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="max-w-4xl mx-auto mt-16"
      >
        <div className="glass-panel rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold">Twin-File Integrity</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-xs text-slate font-mono">SYNCED</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-alert-amber/10 border border-alert-amber/30">
              <div className="text-xs text-alert-amber font-mono mb-1">RAWS</div>
              <div className="text-sm font-mono truncate">
                a3f7...9d2e
              </div>
              <div className="text-xs text-slate mt-1">Immutable snapshots</div>
            </div>

            <div className="p-4 rounded-lg bg-signal-cyan/10 border border-signal-cyan/30">
              <div className="text-xs text-signal-cyan font-mono mb-1">BASE</div>
              <div className="text-sm font-mono truncate">
                b8e2...1c4a
              </div>
              <div className="text-xs text-slate mt-1">Analytics layers</div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default CentralGrid