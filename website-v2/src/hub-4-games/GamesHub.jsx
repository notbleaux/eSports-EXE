/**
 * Games Hub - Hub 4: The Nexus
 * Simulation platform with toroidal flow and resonant matchmaking
 */
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Gamepad2, 
  Users, 
  Zap, 
  Trophy, 
  Activity,
  Target,
  Flame,
  Play,
  Settings,
  Radio
} from 'lucide-react'
import HubWrapper, { HubCard, HubStatCard } from '../../shared/components/HubWrapper'
import { useNJZStore, useHubState } from '../../shared/store/njzStore'

// Game modes
const GAME_MODES = [
  { 
    id: 'simulation', 
    name: 'Tactical Sim', 
    description: '5v5 tactical FPS simulation',
    icon: Target,
    color: '#00f0ff',
    players: 1247,
    status: 'live'
  },
  { 
    id: 'arena', 
    name: 'Arena', 
    description: 'Fast-paced deathmatch',
    icon: Zap,
    color: '#ff9f1c',
    players: 892,
    status: 'live'
  },
  { 
    id: 'tournament', 
    name: 'Tournament', 
    description: 'Competitive bracket play',
    icon: Trophy,
    color: '#c9b037',
    players: 256,
    status: 'lobby'
  },
]

// Active matches
const ACTIVE_MATCHES = [
  { id: 1, teamA: 'Phoenix', teamB: 'Viper', scoreA: 12, scoreB: 10, status: 'live', map: 'Ascent' },
  { id: 2, teamA: 'Drift', teamB: 'Nova', scoreA: 8, scoreB: 13, status: 'live', map: 'Bind' },
  { id: 3, teamA: 'Echo', teamB: 'Pulse', scoreA: 0, scoreB: 0, status: 'starting', map: 'Split' },
]

// Leaderboard
const LEADERBOARD = [
  { rank: 1, player: 'Ace', elo: 2847, wins: 156, streak: 12 },
  { rank: 2, player: 'Vortex', elo: 2734, wins: 142, streak: 8 },
  { rank: 3, player: 'Phoenix', elo: 2691, wins: 138, streak: -1 },
  { rank: 4, player: 'Shadow', elo: 2654, wins: 129, streak: 5 },
  { rank: 5, player: 'Nova', elo: 2612, wins: 124, streak: 3 },
]

function GamesHub() {
  const [selectedMode, setSelectedMode] = useState(GAME_MODES[0])
  const [matchmakingStatus, setMatchmakingStatus] = useState('idle') // 'idle' | 'searching' | 'found'
  const [torusRotation, setTorusRotation] = useState(0)
  const addNotification = useNJZStore(state => state.addNotification)
  const { state, setState } = useHubState('games')

  // Torus animation
  useEffect(() => {
    const interval = setInterval(() => {
      setTorusRotation(prev => (prev + 0.5) % 360)
    }, 50)
    return () => clearInterval(interval)
  }, [])

  const startMatchmaking = () => {
    setMatchmakingStatus('searching')
    addNotification('Searching for opponents...', 'info')
    
    setTimeout(() => {
      setMatchmakingStatus('found')
      addNotification('Match found! Starting game...', 'success')
      
      setTimeout(() => {
        setMatchmakingStatus('idle')
      }, 3000)
    }, 3000)
  }

  return (
    <HubWrapper hubId="games">
      {/* Stats Row */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HubStatCard 
            label="Online Players" 
            value="2,395" 
            change="Live" 
            color="cyan" 
          />
          <HubStatCard 
            label="Active Matches" 
            value="47" 
            change="+3 starting" 
            color="amber" 
          />
          <HubStatCard 
            label="Queue Time" 
            value="12s" 
            change="Avg" 
            color="green" 
          />
          <HubStatCard 
            label="Daily Games" 
            value="12.4K" 
            change="+8%" 
            color="gold" 
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Toroidal Flow Visualization */}
          <HubCard accent="cyan">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Radio className="w-5 h-5 text-signal-cyan" />
                <h3 className="font-display font-semibold">Nexus Core</h3>
              </div>
              <span className="text-xs font-mono text-slate">Toroidal Flow Active</span>
            </div>

            {/* Torus Visualization */}
            <div className="relative h-64 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 300 200" className="w-full h-full">
                  {/* Outer ring */}
                  <motion.ellipse
                    cx="150"
                    cy="100"
                    rx="120"
                    ry="60"
                    fill="none"
                    stroke="rgba(0, 240, 255, 0.3)"
                    strokeWidth="2"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: 'center' }}
                  />
                  
                  {/* Inner ring */}
                  <motion.ellipse
                    cx="150"
                    cy="100"
                    rx="80"
                    ry="40"
                    fill="none"
                    stroke="rgba(201, 176, 55, 0.3)"
                    strokeWidth="2"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                    style={{ transformOrigin: 'center' }}
                  />
                  
                  {/* Flow particles */}
                  {[...Array(6)].map((_, i) => (
                    <motion.circle
                      key={i}
                      r="4"
                      fill="#00f0ff"
                      animate={{
                        cx: [150 + 100 * Math.cos((i * 60 * Math.PI) / 180), 150 + 100 * Math.cos(((i * 60 + 360) * Math.PI) / 180)],
                        cy: [100 + 50 * Math.sin((i * 60 * Math.PI) / 180), 100 + 50 * Math.sin(((i * 60 + 360) * Math.PI) / 180)],
                      }}
                      transition={{
                        duration: 4,
                        repeat: Infinity,
                        delay: i * 0.5,
                        ease: 'linear'
                      }}
                    />
                  ))}
                </svg>
              </div>
              
              {/* Center hub */}
              <motion.div
                className="relative z-10 w-20 h-20 rounded-full bg-gradient-to-br from-signal-cyan to-cobalt 
                         flex items-center justify-center shadow-glow-cyan"
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 3, repeat: Infinity }}
              >
                <Gamepad2 className="w-8 h-8 text-white" />
              </motion.div>
            </div>

            {/* Mode Selection */}
            <div className="grid grid-cols-3 gap-4 mt-6">
              {GAME_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => {
                    setSelectedMode(mode)
                    addNotification(`Switched to ${mode.name}`, 'info')
                  }}
                  className={`
                    p-4 rounded-xl border transition-all duration-300 text-left
                    ${selectedMode.id === mode.id 
                      ? 'border-signal-cyan bg-signal-cyan/10' 
                      : 'border-mist bg-void-mid hover:border-white/20'
                    }
                  `}
                >
                  <div className="flex items-start justify-between mb-2">
                    <mode.icon 
                      className="w-5 h-5" 
                      style={{ color: mode.color }}
                    />
                    <span className={`
                      text-xs px-2 py-0.5 rounded-full
                      ${mode.status === 'live' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}
                    `}>
                      {mode.status}
                    </span>
                  </div>
                  <div className="font-medium text-sm">{mode.name}</div>
                  <div className="text-xs text-slate">{mode.players} playing</div>
                </button>
              ))}
            </div>
          </HubCard>

          {/* Matchmaking Panel */}
          <HubCard accent="cyan">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-signal-cyan" />
                <h3 className="font-display font-semibold">Resonant Matchmaking</h3>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs text-slate">Servers Online</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 p-4 rounded-lg bg-void-mid">
                <div className="text-sm text-slate mb-1">Selected Mode</div>
                <div className="font-medium">{selectedMode.name}</div>
                <div className="text-xs text-slate">{selectedMode.description}</div>
              </div>
              
              <button
                onClick={startMatchmaking}
                disabled={matchmakingStatus !== 'idle'}
                className={`
                  px-8 py-4 rounded-lg font-medium flex items-center justify-center gap-2
                  transition-all duration-300 min-w-[180px]
                  ${matchmakingStatus === 'searching' 
                    ? 'bg-yellow-500/20 text-yellow-400 cursor-wait' 
                    : matchmakingStatus === 'found'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-signal-cyan text-void-black hover:shadow-glow-cyan'
                  }
                `}
              >
                {matchmakingStatus === 'idle' && (<><Play className="w-5 h-5" /> Find Match</>)}
                {matchmakingStatus === 'searching' && (<><Activity className="w-5 h-5 animate-spin" /> Searching...</>)}
                {matchmakingStatus === 'found' && (<><Flame className="w-5 h-5" /> Match Found!</>)}
              </button>
            </div>
          </HubCard>

          {/* Active Matches */}
          <HubCard accent="cyan">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Activity className="w-5 h-5 text-green-400" />
                <h3 className="font-display font-semibold">Live Matches</h3>
              </div>
              <button className="text-sm text-slate hover:text-white transition-colors">
                Spectate →
              </button>
            </div>

            <div className="space-y-3">
              {ACTIVE_MATCHES.map((match) => (
                <div 
                  key={match.id}
                  className="flex items-center justify-between p-4 rounded-lg bg-void-mid border border-mist"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <span className="text-xs px-2 py-1 rounded bg-green-500/20 text-green-400 font-mono">
                      {match.status === 'live' ? 'LIVE' : 'STARTING'}
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{match.teamA}</span>
                      <span className="text-signal-cyan font-mono">{match.scoreA}</span>
                      <span className="text-slate">-</span>
                      <span className="text-signal-cyan font-mono">{match.scoreB}</span>
                      <span className="font-medium">{match.teamB}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate">{match.map}</span>
                </div>
              ))}
            </div>
          </HubCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Leaderboard */}
          <HubCard accent="gold">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-aged-gold" />
                <h3 className="font-display font-semibold">Leaderboard</h3>
              </div>
              <span className="text-xs text-slate">Top 5</span>
            </div>

            <div className="space-y-2">
              {LEADERBOARD.map((player) => (
                <div 
                  key={player.rank}
                  className="flex items-center gap-3 p-3 rounded-lg bg-void-mid hover:bg-white/5 transition-colors"
                >
                  <span className={`
                    w-6 h-6 rounded flex items-center justify-center text-xs font-bold
                    ${player.rank === 1 ? 'bg-aged-gold text-void-black' : 
                      player.rank === 2 ? 'bg-slate text-white' : 
                      player.rank === 3 ? 'bg-cobalt text-white' : 'text-slate'}
                  `}>
                    {player.rank}
                  </span>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{player.player}</div>
                    <div className="text-xs text-slate">{player.wins} wins</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-signal-cyan">{player.elo}</div>
                    <div className={`
                      text-xs
                      ${player.streak > 0 ? 'text-green-400' : 'text-red-400'}
                    `}>
                      {player.streak > 0 ? `+${player.streak}` : player.streak} streak
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </HubCard>

          {/* Quick Actions */}
          <HubCard>
            <div className="flex items-center gap-3 mb-4">
              <Settings className="w-5 h-5 text-slate" />
              <h3 className="font-display font-semibold">Quick Actions</h3>
            </div>

            <div className="space-y-2">
              {['Create Custom Room', 'Join Private Match', 'Training Grounds', 'Replay Library'].map((action) => (
                <button
                  key={action}
                  className="w-full text-left px-4 py-3 rounded-lg text-sm text-slate 
                           hover:text-white hover:bg-white/5 transition-colors"
                >
                  {action}
                </button>
              ))}
            </div>
          </HubCard>
        </div>
      </div>
    </HubWrapper>
  )
}

export default GamesHub
