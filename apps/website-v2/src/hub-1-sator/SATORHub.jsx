/**
 * SATOR Hub - Hub 1: The Observatory
 * Raw data ingestion with orbital ring navigation
 * 
 * [Ver002.000] - Added ML error boundaries
 */
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, Shield, Clock, Users, Trophy, FileCheck, Search } from 'lucide-react'
import HubWrapper, { HubCard, HubStatCard } from '../shared/components/HubWrapper'
import { useNJZStore, useHubState } from '../shared/store/njzStore'
import { MLInferenceErrorBoundary, HubErrorFallback } from '../components/error'

const rings = [
  { id: 'teams', label: 'Teams', icon: Users, count: '2,847', color: '#ff9f1c' },
  { id: 'matches', label: 'Matches', icon: Trophy, count: '156', color: '#ff9f1c' },
  { id: 'players', label: 'Players', icon: Users, count: '12,847', color: '#ff9f1c' },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy, count: '48', color: '#ff9f1c' },
  { id: 'history', label: 'History', icon: Clock, count: '2.4M', color: '#ff9f1c' }
]

const verificationSteps = [
  { id: 1, label: 'SHA-256 Checksum', status: 'verified', icon: FileCheck },
  { id: 2, label: 'Cross-reference', status: 'verified', icon: FileCheck },
  { id: 3, label: 'Timestamp Sync', status: 'verified', icon: Clock },
]

function SATORHubContent() {
  const [activeRing, setActiveRing] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const addNotification = useNJZStore(state => state.addNotification)
  const { state, setState } = useHubState('sator')

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => (prev + 0.5) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const handleRingClick = (ringId) => {
    setActiveRing(activeRing === ringId ? null : ringId)
    addNotification(`${rings.find(r => r.id === ringId)?.label} ring activated`, 'info')
  }

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      addNotification(`Searching RAWS for "${searchQuery}"...`, 'info')
    }
  }

  return (
    <HubWrapper hubId="sator">
      {/* Stats Row */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {rings.map((ring, index) => (
            <HubStatCard
              key={ring.id}
              label={ring.label}
              value={ring.count}
              color="amber"
              onClick={() => handleRingClick(ring.id)}
            />
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Search RAWS */}
          <HubCard accent="amber">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
              <input
                type="text"
                placeholder="Search RAWS database..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-void-mid rounded-lg border border-mist 
                         focus:border-alert-amber focus:outline-none focus:ring-1 focus:ring-alert-amber
                         text-white placeholder-slate transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 
                         bg-alert-amber/10 text-alert-amber rounded-lg
                         hover:bg-alert-amber/20 transition-colors text-sm"
              >
                Query
              </button>
            </form>
          </HubCard>

          {/* Orbital Ring System */}
          <HubCard accent="amber">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Database className="w-5 h-5 text-alert-amber" />
                <h3 className="font-display font-semibold">Orbital Ring System</h3>
              </div>
              <span className="text-xs font-mono text-slate">
                Rotation: {rotation.toFixed(0)}°
              </span>
            </div>

            {/* Orbital Visualization */}
            <div className="relative aspect-square max-w-[500px] mx-auto py-8">
              {/* Background glow */}
              <div className="absolute inset-0 bg-alert-amber/5 rounded-full blur-3xl" />

              {/* Center - RAWS Core */}
              <motion.div
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 4, repeat: Infinity }}
              >
                <div className="w-28 h-28 rounded-full bg-gradient-to-br from-alert-amber to-orange-600 
                              flex flex-col items-center justify-center shadow-glow-amber">
                  <span className="font-display font-bold text-xl text-void-black">RAWS</span>
                  <span className="text-xs font-mono text-void-black/70">Immutable</span>
                </div>
              </motion.div>

              {/* Orbital Rings */}
              {rings.map((ring, index) => {
                const size = 160 + index * 70
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
                    onClick={() => handleRingClick(ring.id)}
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
                    {Array.from({ length: 4 + index }).map((_, i) => {
                      const angle = (i / (4 + index)) * 360
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
          </HubCard>

          {/* Recent Ingestion */}
          <HubCard accent="amber">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-alert-amber" />
                <h3 className="font-display font-semibold">Recent Ingestion</h3>
              </div>
              <span className="text-xs text-slate">Live feed</span>
            </div>

            <div className="space-y-3">
              {[
                { source: 'VLR API', records: 1247, time: '2 min ago', status: 'synced' },
                { source: 'HLTV Feed', records: 892, time: '5 min ago', status: 'synced' },
                { source: 'Riot API', records: 2156, time: '12 min ago', status: 'synced' },
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-void-mid">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400" />
                    <span className="font-medium">{item.source}</span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-slate">
                    <span className="font-mono">{item.records.toLocaleString()} records</span>
                    <span>{item.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </HubCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Integrity Check */}
          <HubCard accent="amber">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-green-400" />
              <h3 className="font-display font-semibold">Integrity</h3>
            </div>

            <div className="space-y-3">
              {verificationSteps.map((step) => (
                <div key={step.id} className="flex items-center gap-3">
                  <step.icon className="w-4 h-4 text-green-400" />
                  <span className="text-sm text-slate">{step.label}</span>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t border-mist">
              <div className="flex items-center gap-2 text-green-400">
                <Shield className="w-5 h-5" />
                <span className="text-sm font-medium">All checks passed</span>
              </div>
            </div>
          </HubCard>

          {/* Quick Stats */}
          <HubCard>
            <h3 className="font-display font-semibold mb-4">Data Sources</h3>
            <div className="space-y-3">
              {[
                { label: 'Active APIs', value: '12', icon: Database },
                { label: 'Queue Depth', value: '0', icon: Clock },
                { label: 'Avg Latency', value: '12ms', icon: Trophy },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate">
                    <stat.icon className="w-4 h-4" />
                    <span className="text-sm">{stat.label}</span>
                  </div>
                  <span className="font-mono text-alert-amber">{stat.value}</span>
                </div>
              ))}
            </div>
          </HubCard>

          {/* RAWS Info */}
          <HubCard>
            <h3 className="font-display font-semibold mb-4">About RAWS</h3>
            <p className="text-sm text-slate mb-4">
              Raw Archive Write System (RAWS) stores immutable snapshots of all ingested data with cryptographic verification.
            </p>
            <div className="text-xs text-slate font-mono">
              <div>Format: JSON Lines</div>
              <div>Compression: Zstd</div>
              <div>Hash: SHA-256</div>
            </div>
          </HubCard>
        </div>
      </div>
    </HubWrapper>
  )
}

/**
 * SATOR Hub with ML Error Boundary
 * Wraps the hub content with MLInferenceErrorBoundary for graceful error handling
 */
function SATORHub() {
  return (
    <MLInferenceErrorBoundary
      fallback={
        <HubWrapper hubId="sator">
          <div className="pt-12">
            <HubErrorFallback
              hub="SATOR"
              title="SATOR Hub Error"
              message="The SATOR Observatory encountered an error while loading ML features."
              onRetry={() => window.location.reload()}
              onGoHome={() => window.location.href = '/'}
            />
          </div>
        </HubWrapper>
      }
    >
      <SATORHubContent />
    </MLInferenceErrorBoundary>
  )
}

export default SATORHub
