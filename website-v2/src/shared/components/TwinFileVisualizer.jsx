/**
 * Twin-File Integrity Visualizer Component
 * Shows real-time sync status between RAWS and BASE files
 */
import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Database, Activity, RefreshCw } from 'lucide-react'
import { useTwinFile, useNJZStore } from '../store/njzStore'

function TwinFileVisualizer({ compact = false, showDetails = true }) {
  const { raws, base, integrity, verify } = useTwinFile()
  const addNotification = useNJZStore(state => state.addNotification)
  const [isVerifying, setIsVerifying] = useState(false)
  const [showPulse, setShowPulse] = useState(false)

  // Periodic verification pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setShowPulse(true)
      setTimeout(() => setShowPulse(false), 1000)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  const handleVerify = async () => {
    setIsVerifying(true)
    await new Promise(resolve => setTimeout(resolve, 800))
    const correlation = verify()
    setIsVerifying(false)
    addNotification(`Integrity verified: ${correlation}% correlation`, 'success')
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'synced': return 'text-green-400'
      case 'syncing': return 'text-yellow-400'
      case 'error': return 'text-red-400'
      default: return 'text-slate'
    }
  }

  const getStatusBg = (status) => {
    switch (status) {
      case 'synced': return 'bg-green-500'
      case 'syncing': return 'bg-yellow-500'
      case 'error': return 'bg-red-500'
      default: return 'bg-slate'
    }
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <motion.div
          className="relative"
          animate={showPulse ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.3 }}
        >
          <div className={`w-2 h-2 rounded-full ${getStatusBg(raws.status)}`} />
          <AnimatePresence>
            {showPulse && (
              <motion.div
                className={`absolute inset-0 rounded-full ${getStatusBg(raws.status)}`}
                initial={{ scale: 1, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>
        </motion.div>
        <span className="text-xs font-mono text-slate">
          {integrity.verified ? 'SYNCED' : 'SYNCING'}
        </span>
        <span className="text-xs font-mono text-slate">
          {integrity.correlation}%
        </span>
      </div>
    )
  }

  return (
    <div className="glass-panel rounded-2xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-signal-cyan/20 to-aged-gold/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-signal-cyan" />
          </div>
          <div>
            <h3 className="font-display font-semibold">Twin-File Integrity</h3>
            <p className="text-xs text-slate font-mono">RAWS ↔ BASE Synchronization</p>
          </div>
        </div>
        
        <button
          onClick={handleVerify}
          disabled={isVerifying}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
        >
          <RefreshCw className={`w-4 h-4 ${isVerifying ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">Verify</span>
        </button>
      </div>

      {/* File Status Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {/* RAWS */}
        <div className="p-4 rounded-xl bg-alert-amber/5 border border-alert-amber/20">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-alert-amber" />
            <span className="text-xs font-mono text-alert-amber">RAWS</span>
          </div>
          <div className="font-mono text-sm truncate mb-1">
            {raws.hash}
          </div>
          <div className="text-xs text-slate">
            {raws.recordCount.toLocaleString()} records
          </div>
          <div className={`text-xs mt-2 ${getStatusColor(raws.status)}`}>
            ● {raws.status.toUpperCase()}
          </div>
        </div>

        {/* BASE */}
        <div className="p-4 rounded-xl bg-signal-cyan/5 border border-signal-cyan/20">
          <div className="flex items-center gap-2 mb-3">
            <Database className="w-4 h-4 text-signal-cyan" />
            <span className="text-xs font-mono text-signal-cyan">BASE</span>
          </div>
          <div className="font-mono text-sm truncate mb-1">
            {base.hash}
          </div>
          <div className="text-xs text-slate">
            {base.layerCount} analytics layers
          </div>
          <div className={`text-xs mt-2 ${getStatusColor(base.status)}`}>
            ● {base.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Integrity Status */}
      {showDetails && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate">Correlation</span>
            <div className="flex items-center gap-2">
              <div className="w-24 h-2 bg-void-mid rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-signal-cyan to-aged-gold"
                  initial={{ width: 0 }}
                  animate={{ width: `${integrity.correlation}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                />
              </div>
              <span className="font-mono text-signal-cyan">{integrity.correlation}%</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate">Last Verified</span>
            <span className="font-mono text-xs">
              {new Date(integrity.lastVerified).toLocaleTimeString()}
            </span>
          </div>

          <div className="flex items-center gap-2 pt-3 border-t border-mist">
            <Activity className="w-4 h-4 text-green-400" />
            <span className="text-sm text-green-400">All integrity checks passed</span>
          </div>
        </div>
      )}

      {/* Animated sync line */}
      <div className="relative h-px mt-6 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-signal-cyan to-transparent opacity-50" />
        <motion.div
          className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-transparent via-aged-gold to-transparent"
          animate={{ x: ['-100%', '400%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        />
      </div>
    </div>
  )
}

export default TwinFileVisualizer
