import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, Shield, Clock, Users, Trophy } from 'lucide-react'

const rings = [
  { id: 'teams', label: 'Teams', icon: Users, count: '2,847', color: '#ff9f1c' },
  { id: 'matches', label: 'Matches', icon: Trophy, count: '156', color: '#ff9f1c' },
  { id: 'players', label: 'Players', icon: Users, count: '12,847', color: '#ff9f1c' },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy, count: '48', color: '#ff9f1c' },
  { id: 'history', label: 'History', icon: Clock, count: '2.4M', color: '#ff9f1c' }
]

function SATORHub() {
  const [activeRing, setActiveRing] = useState(null)
  const [rotation, setRotation] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-alert-amber/10 border border-alert-amber/30 mb-6">
            <Database className="w-4 h-4 text-alert-amber" />
            <span className="text-sm font-mono text-alert-amber">SATOR HUB</span>
          </div>

          <h1 className="font-display text-h1 font-bold mb-4">
            <span className="text-alert-amber">The Observatory</span>
          </h1>
          
          <p className="text-xl text-slate max-w-2xl mx-auto">
            Raw data ingestion with orbital ring navigation.
            <span className="text-porcelain"> Immutable RAWS files with cryptographic verification.</span>
          </p>
        </motion.div>
      </div>

      {/* Orbital Ring System */}
      <div className="max-w-4xl mx-auto mb-16">
        <div className="relative aspect-square max-w-[600px] mx-auto">
          {/* Background glow */}
          <div className="absolute inset-0 bg-alert-amber/5 rounded-full blur-3xl"></div>

          {/* Center */}
          <motion.div
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          >
            <div className="w-32 h-32 rounded-full bg-gradient-to-br from-alert-amber to-orange-600 flex flex-col items-center justify-center shadow-glow-amber">
              <span className="font-display font-bold text-2xl text-void-black">RAWS</span>
              <span className="text-xs font-mono text-void-black/70">2.4M Records</span>
            </div>
          </motion.div>

          {/* Orbital Rings */}
          {rings.map((ring, index) => {
            const size = 180 + index * 80
            const duration = 20 + index * 10
            const isActive = activeRing === ring.id

            return (
              <motion.div
                key={ring.id}
                className="absolute top-1/2 left-1/2 rounded-full cursor-pointer"
                style={{
                  width: size,
                  height: size,
                  marginLeft: -size / 2,
                  marginTop: -size / 2,
                  border: `2px solid ${isActive ? ring.color : 'rgba(255, 159, 28, 0.2)'}`,
                  boxShadow: isActive ? `0 0 30px ${ring.color}40` : 'none'
                }}
                animate={{ rotate: rotation * (index % 2 === 0 ? 1 : -1) * (1 / (index + 1)) }}
                transition={{ duration: 0.1, ease: 'linear' }}
                onClick={() => setActiveRing(activeRing === ring.id ? null : ring.id)}
                whileHover={{ scale: 1.02 }}
              >
                {/* Ring label */}
                <motion.div
                  className="absolute -top-3 left-1/2 transform -translate-x-1/2"
                  style={{ rotate: -rotation * (index % 2 === 0 ? 1 : -1) * (1 / (index + 1)) }}
                >
                  <div className={`
                    px-3 py-1 rounded-full text-xs font-mono
                    ${isActive ? 'bg-alert-amber text-void-black' : 'bg-void-mid text-alert-amber border border-alert-amber/30'}
                  `}>
                    {ring.label}
                  </div>
                </motion.div>

                {/* Data points on ring */}
                {Array.from({ length: 6 + index * 2 }).map((_, i) => {
                  const angle = (i / (6 + index * 2)) * 360
                  const x = Math.cos((angle * Math.PI) / 180) * (size / 2)
                  const y = Math.sin((angle * Math.PI) / 180) * (size / 2)

                  return (
                    <motion.div
                      key={i}
                      className="absolute w-2 h-2 rounded-full"
                      style={{
                        left: `calc(50% + ${x}px - 4px)`,
                        top: `calc(50% + ${y}px - 4px)`,
                        backgroundColor: ring.color,
                        opacity: isActive ? 1 : 0.5
                      }}
                      animate={{ scale: isActive ? [1, 1.5, 1] : 1 }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                    />
                  )
                })}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {rings.map((ring, index) => (
            <motion.div
              key={ring.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`
                glass-panel rounded-xl p-6 cursor-pointer transition-all duration-300
                ${activeRing === ring.id ? 'border-alert-amber shadow-glow-amber' : 'hover:border-white/20'}
              `}
              onClick={() => setActiveRing(activeRing === ring.id ? null : ring.id)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-10 h-10 rounded-lg bg-alert-amber/20 flex items-center justify-center">
                  <ring.icon className="w-5 h-5 text-alert-amber" />
                </div>
                <span className="text-xs font-mono text-slate">{ring.id.toUpperCase()}</span>
              </div>

              <div className="text-2xl font-display font-bold text-porcelain mb-1">
                {ring.count}
              </div>

              <div className="text-sm text-slate">
                {ring.label}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Integrity Check */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="max-w-4xl mx-auto mt-12"
      >
        <div className="glass-panel rounded-xl p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-5 h-5 text-green-500" />
            <span className="font-display font-semibold">Integrity Verification</span>
          </div>

          <div className="font-mono text-sm text-slate space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>SHA-256 checksum verified</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Cross-reference validation passed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-green-500">✓</span>
              <span>Timestamp synchronization confirmed</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default SATORHub