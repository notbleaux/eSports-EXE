import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Gamepad2, Download, Wifi, Trophy, Users, Zap } from 'lucide-react'

const games = [
  {
    id: 'axiom',
    title: 'AXIOM eSports',
    description: '2D Strategy Management Simulation',
    size: '2.4 GB',
    version: 'v2.1.0',
    offline: true
  },
  {
    id: 'njz-live',
    title: 'NJZ ¿!? Live',
    description: 'Real-time Tournament Platform',
    size: 'Online',
    version: 'Web',
    offline: false
  }
]

const modes = [
  { id: 'casual', label: 'Casual', description: 'Practice matches' },
  { id: 'ranked', label: 'Ranked', description: 'Competitive ladder' },
  { id: 'pro', label: 'Pro', description: 'Tournament ready' }
]

function GamesHub() {
  const [selectedMode, setSelectedMode] = useState('casual')
  const [downloading, setDownloading] = useState(null)

  const handleDownload = (gameId) => {
    setDownloading(gameId)
    setTimeout(() => setDownloading(null), 3000)
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
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-deep-cobalt/30 border border-deep-cobalt mb-6">
            <Gamepad2 className="w-4 h-4 text-signal-cyan" />
            <span className="text-sm font-mono text-signal-cyan">GAMES HUB</span>
          </div>

          <h1 className="font-display text-h1 font-bold mb-4">
            <span className="text-signal-cyan">The Nexus</span>
          </h1>
          
          <p className="text-xl text-slate max-w-2xl mx-auto">
            Simulation platform with toroidal flow.
            <span className="text-porcelain"> Offline strategy meets live competition.</span>
          </p>
        </motion.div>
      </div>

      {/* Mode Selector */}
      <div className="max-w-4xl mx-auto mb-12">
        <div className="glass-panel rounded-2xl p-2">
          <div className="grid grid-cols-3 gap-2">
            {modes.map((mode) => (
              <button
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`
                  p-4 rounded-xl text-center transition-all
                  ${selectedMode === mode.id 
                    ? 'bg-signal-cyan/20 border border-signal-cyan' 
                    : 'hover:bg-white/5'}
                `}
              >
                <div className="font-display font-semibold mb-1">{mode.label}</div>
                <div className="text-xs text-slate">{mode.description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Games Grid */}
      <div className="max-w-5xl mx-auto mb-16">
        <h3 className="font-display font-semibold text-xl mb-6">Available Games</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {games.map((game, index) => (
            <motion.div
              key={game.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="glass-panel rounded-2xl p-6 hover:border-signal-cyan/50 transition-colors"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-deep-cobalt to-signal-cyan flex items-center justify-center"
                >
                  <Gamepad2 className="w-8 h-8 text-white" />
                </div>
                
                <div className="flex items-center gap-2">
                  {game.offline ? (
                    <span className="px-3 py-1 rounded-full text-xs font-mono bg-deep-cobalt/30 text-signal-cyan border border-deep-cobalt">
                      OFFLINE
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-mono bg-green-500/20 text-green-400 border border-green-500/30 flex items-center gap-1">
                      <Wifi className="w-3 h-3" /> LIVE
                    </span>
                  )}
                </div>
              </div>

              <h4 className="font-display text-xl font-bold mb-2">{game.title}</h4>
              
              <p className="text-slate mb-4">{game.description}</p>

              <div className="flex items-center justify-between text-sm text-slate mb-6">
                <span>{game.size}</span>
                <span className="font-mono">{game.version}</span>
              </div>

              <button
                onClick={() => handleDownload(game.id)}
                disabled={downloading === game.id}
                className="w-full py-3 rounded-xl bg-signal-cyan/20 border border-signal-cyan text-signal-cyan font-semibold hover:bg-signal-cyan hover:text-void-black transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {downloading === game.id ? (
                  <>
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                    />
                    Downloading...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    {game.offline ? 'Download' : 'Launch'}
                  </>
                )}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live Stats */}
      <div className="max-w-4xl mx-auto">
        <div className="glass-panel rounded-2xl p-6"
        >
          <h3 className="font-display font-semibold text-xl mb-6 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-aged-gold" />
            Live Platform Stats
          </h3>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Active Players', value: '12,847', icon: Users },
              { label: 'Live Matches', value: '156', icon: Zap },
              { label: 'Tournaments', value: '24', icon: Trophy },
              { label: 'Peak Concurrent', value: '3.2K', icon: Wifi }
            ].map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className="text-center p-4 rounded-xl bg-void-mid"
              >
                <stat.icon className="w-5 h-5 mx-auto mb-2 text-signal-cyan" />
                <div className="text-2xl font-display font-bold text-porcelain">{stat.value}</div>
                <div className="text-xs text-slate">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GamesHub