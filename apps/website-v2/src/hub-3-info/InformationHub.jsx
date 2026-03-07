/**
 * Information Hub - Hub 3: The Directory
 * Central directory with radial navigation, conical visualization, and AI suggestions
 */
import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Users, 
  Layers, 
  Sparkles, 
  FolderTree,
  ChevronRight,
  Globe,
  Trophy,
  Gamepad2
} from 'lucide-react'
import HubWrapper, { HubCard, HubStatCard } from '../shared/components/HubWrapper'
import { useNJZStore, useHubState } from '../shared/store/njzStore'

// Categories for radial menu
const CATEGORIES = [
  { id: 'lol', name: 'League of Legends', icon: '🎮', teams: 845, color: '#00f0ff' },
  { id: 'valorant', name: 'Valorant', icon: '🎯', teams: 623, color: '#ff9f1c' },
  { id: 'cs2', name: 'CS2', icon: '🔫', teams: 412, color: '#c9b037' },
  { id: 'dota2', name: 'Dota 2', icon: '⚔️', teams: 156, color: '#ef4444' },
  { id: 'rl', name: 'Rocket League', icon: '🏎️', teams: 98, color: '#10b981' },
]

// Mock team data
const FEATURED_TEAMS = [
  { id: 1, name: 'T1', region: 'KR', tier: 'S', game: 'League of Legends', rank: 1 },
  { id: 2, name: 'Sentinels', region: 'NA', tier: 'S', game: 'Valorant', rank: 2 },
  { id: 3, name: 'Vitality', region: 'EU', tier: 'A', game: 'CS2', rank: 3 },
  { id: 4, name: 'Gen.G', region: 'KR', tier: 'S', game: 'League of Legends', rank: 4 },
  { id: 5, name: 'Team Liquid', region: 'NA', tier: 'A', game: 'Dota 2', rank: 5 },
]

// AI Suggestions
const AI_SUGGESTIONS = [
  { id: 1, text: 'Follow the upcoming LCK playoffs for tier updates', type: 'trending' },
  { id: 2, text: 'New Valorant team "Apex" showing strong fundamentals', type: 'discovery' },
  { id: 3, text: 'Tier adjustment recommended for EU CS2 region', type: 'insight' },
]

function InformationHub() {
  const [activeCategory, setActiveCategory] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [view, setView] = useState('grid') // 'grid' | 'list' | 'conical'
  const addNotification = useNJZStore(state => state.addNotification)
  const { state, setState } = useHubState('info')

  const handleCategorySelect = useCallback((category) => {
    setActiveCategory(category)
    setState({ selectedCategory: category })
    addNotification(`Browsing ${category.name}`, 'info')
  }, [setState, addNotification])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      addNotification(`Searching for "${searchQuery}"...`, 'info')
    }
  }

  return (
    <HubWrapper hubId="info">
      {/* Stats Row */}
      <div className="max-w-6xl mx-auto mb-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <HubStatCard 
            label="Total Teams" 
            value="2,135" 
            change="+47 this week" 
            color="cyan" 
          />
          <HubStatCard 
            label="Active Regions" 
            value="12" 
            change="Global" 
            color="amber" 
          />
          <HubStatCard 
            label="Categories" 
            value="8" 
            change="+2 new" 
            color="gold" 
          />
          <HubStatCard 
            label="Data Points" 
            value="1.2M" 
            change="Real-time" 
            color="green" 
          />
        </div>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Search Section */}
          <HubCard accent="cyan">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate" />
              <input
                type="text"
                placeholder="Search teams, players, tournaments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-void-mid rounded-lg border border-mist 
                         focus:border-signal-cyan focus:outline-none focus:ring-1 focus:ring-signal-cyan
                         text-white placeholder-slate transition-colors"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-4 py-2 
                         bg-signal-cyan/10 text-signal-cyan rounded-lg
                         hover:bg-signal-cyan/20 transition-colors text-sm"
              >
                Search
              </button>
            </form>
          </HubCard>

          {/* Radial Category Menu */}
          <HubCard
            accent="cyan"
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Layers className="w-5 h-5 text-signal-cyan" />
                <h3 className="font-display font-semibold">Browse by Category</h3>
              </div>
              <div className="flex gap-2">
                {['grid', 'list'].map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`px-3 py-1 rounded text-xs capitalize transition-colors
                      ${view === v ? 'bg-signal-cyan/20 text-signal-cyan' : 'text-slate hover:text-white'}`}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {CATEGORIES.map((category, index) => (
                <motion.button
                  key={category.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => handleCategorySelect(category)}
                  className={`
                    p-4 rounded-xl border transition-all duration-300 text-center
                    ${activeCategory?.id === category.id 
                      ? 'border-signal-cyan bg-signal-cyan/10' 
                      : 'border-mist bg-void-mid hover:border-white/20'
                    }
                  `}
                >
                  <span className="text-3xl mb-2 block">{category.icon}</span>
                  <div className="text-sm font-medium mb-1">{category.name}</div>
                  <div className="text-xs text-slate">{category.teams} teams</div>
                </motion.button>
              ))}
            </div>
          </HubCard>

          {/* Featured Teams */}
          <HubCard accent="cyan">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <Trophy className="w-5 h-5 text-aged-gold" />
                <h3 className="font-display font-semibold">Featured Teams</h3>
              </div>
              <button className="text-sm text-slate hover:text-signal-cyan transition-colors flex items-center gap-1">
                View All <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              {FEATURED_TEAMS.map((team, index) => (
                <motion.div
                  key={team.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 rounded-lg bg-void-mid border border-mist 
                           hover:border-signal-cyan/50 transition-colors cursor-pointer group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-signal-cyan/10 flex items-center justify-center font-mono text-sm text-signal-cyan">
                      #{team.rank}
                    </div>
                    <div>
                      <div className="font-medium group-hover:text-signal-cyan transition-colors">{team.name}</div>
                      <div className="text-xs text-slate">{team.game}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs px-2 py-1 rounded bg-void-deep">{team.region}</span>
                    <span className={`text-xs px-2 py-1 rounded font-medium
                      ${team.tier === 'S' ? 'bg-aged-gold/20 text-aged-gold' : 'bg-signal-cyan/20 text-signal-cyan'}`}>
                      Tier {team.tier}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </HubCard>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* AI Suggestions */}
          <HubCard accent="gold">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-aged-gold" />
              <h3 className="font-display font-semibold">AI Insights</h3>
            </div>

            <div className="space-y-3">
              {AI_SUGGESTIONS.map((suggestion) => (
                <div 
                  key={suggestion.id}
                  className="p-3 rounded-lg bg-void-mid border border-mist hover:border-aged-gold/30 
                           transition-colors cursor-pointer"
                >
                  <div className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-aged-gold mt-2 flex-shrink-0" />
                    <p className="text-sm text-slate">{suggestion.text}</p>
                  </div>
                  <span className="text-xs text-aged-gold ml-3.5 capitalize">{suggestion.type}</span>
                </div>
              ))}
            </div>
          </HubCard>

          {/* Quick Stats */}
          <HubCard>
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-signal-cyan" />
              <h3 className="font-display font-semibold">Global Stats</h3>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Active Matches', value: '47', icon: Gamepad2 },
                { label: 'Live Updates', value: '1.2K/min', icon: Layers },
                { label: 'Contributors', value: '2,847', icon: Users },
              ].map((stat) => (
                <div key={stat.label} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate">
                    <stat.icon className="w-4 h-4" />
                    <span className="text-sm">{stat.label}</span>
                  </div>
                  <span className="font-mono text-signal-cyan">{stat.value}</span>
                </div>
              ))}
            </div>
          </HubCard>

          {/* Directory Navigation */}
          <HubCard>
            <div className="flex items-center gap-3 mb-4">
              <FolderTree className="w-5 h-5 text-slate" />
              <h3 className="font-display font-semibold">Directory</h3>
            </div>

            <nav className="space-y-1">
              {['All Teams', 'By Region', 'By Tier', 'By Game', 'Recently Updated'].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="flex items-center justify-between px-3 py-2 rounded-lg text-sm text-slate 
                           hover:text-white hover:bg-white/5 transition-colors"
                >
                  {item}
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100" />
                </a>
              ))}
            </nav>
          </HubCard>
        </div>
      </div>
    </HubWrapper>
  )
}

export default InformationHub
