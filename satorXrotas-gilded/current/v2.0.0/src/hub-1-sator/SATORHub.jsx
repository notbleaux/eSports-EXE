[Ver002.000]

/**
 * SATORHub.jsx — Hub 1: The Observatory
 * NJZ Platform v2.0
 * 
 * Raw data ingestion hub with orbital ring navigation.
 * Implements the RAWS (Raw Archive Write System) visualization
 * with concentric orbital rings representing data domains.
 * 
 * Features:
 * - 5 Concentric orbital rings (Teams, Matches, Players, Tournaments, History)
 * - Real-time rotation animation
 * - Interactive ring selection
 * - RAWS database search interface
 * - Integrity verification display
 * 
 * @module SATORHub
 * @version 2.0.0
 * @since 2024-03
 * @partof SATORxROTAS Platform
 * @see ROTASHub — Analytics counterpart
 */

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Database, Shield, Clock, Users, Trophy, FileCheck, Search } from 'lucide-react'
import HubWrapper, { HubCard, HubStatCard } from '../shared/components/HubWrapper'
import { useNJZStore, useHubState } from '../shared/store/njzStore'

/**
 * Orbital ring configuration
 * Represents the 5 data domains in the SATOR system
 */
const rings = [
  { id: 'teams', label: 'Teams', icon: Users, count: '2,847', color: '#ff9f1c' },
  { id: 'matches', label: 'Matches', icon: Trophy, count: '156', color: '#ff9f1c' },
  { id: 'players', label: 'Players', icon: Users, count: '12,847', color: '#ff9f1c' },
  { id: 'tournaments', label: 'Tournaments', icon: Trophy, count: '48', color: '#ff9f1c' },
  { id: 'history', label: 'History', icon: Clock, count: '2.4M', color: '#ff9f1c' }
]

/**
 * Data integrity verification steps
 */
const verificationSteps = [
  { id: 1, label: 'SHA-256 Checksum', status: 'verified', icon: FileCheck },
  { id: 2, label: 'Cross-reference', status: 'verified', icon: FileCheck },
  { id: 3, label: 'Timestamp Sync', status: 'verified', icon: Clock },
]

/**
 * SATOR Hub Component
 * The Observatory — Raw data ingestion and visualization
 */
function SATORHub() {
  const [activeRing, setActiveRing] = useState(null)
  const [rotation, setRotation] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const addNotification = useNJZStore(state => state.addNotification)
  const { state, setState } = useHubState('sator')

  // Continuous rotation animation
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
          {rings.map((ring) => (
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
                  </motion.div>
                )
              })}
            </div>
          </HubCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
          </HubCard>
        </div>
      </div>
    </HubWrapper>
  )
}

export default SATORHub
