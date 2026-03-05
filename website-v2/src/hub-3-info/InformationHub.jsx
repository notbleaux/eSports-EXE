import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Users, Zap, Crown, ChevronRight } from 'lucide-react'

const categories = [
  { id: 'fps', label: 'FPS', subcategories: ['Valorant', 'CS2', 'Overwatch'] },
  { id: 'moba', label: 'MOBA', subcategories: ['League', 'Dota 2', 'SMITE'] },
  { id: 'br', label: 'Battle Royale', subcategories: ['Apex', 'Fortnite', 'PUBG'] },
  { id: 'rts', label: 'RTS', subcategories: ['StarCraft', 'Age of Empires'] },
  { id: 'fighting', label: 'Fighting', subcategories: ['Street Fighter', 'Tekken'] },
  { id: 'sports', label: 'Sports', subcategories: ['FIFA', 'NBA 2K', 'Rocket League'] },
  { id: 'racing', label: 'Racing', subcategories: ['F1', 'Forza', 'Gran Turismo'] },
  { id: 'card', label: 'Card Games', subcategories: ['Hearthstone', 'MTG'] }
]

const tiers = [
  {
    name: 'Nvr Die',
    price: 'Free',
    color: 'from-green-500 to-emerald-600',
    features: [
      '24-hour delayed data',
      'Basic analytics',
      'Standard visualizations',
      'Community support'
    ]
  },
  {
    name: 'NJZ 4eva',
    price: '$19/mo',
    color: 'from-aged-gold to-yellow-600',
    features: [
      'Real-time RAWS streams',
      'Advanced ROTAS layers',
      'Predictive tools',
      'Priority support',
      'Early patch access',
      'Custom dashboards'
    ],
    recommended: true
  }
]

function InformationHub() {
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredCategory, setHoveredCategory] = useState(null)

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-porcelain/10 border border-porcelain/30 mb-6">
            <Users className="w-4 h-4 text-porcelain" />
            <span className="text-sm font-mono text-porcelain">INFORMATION HUB</span>
          </div>

          <h1 className="font-display text-h1 font-bold mb-4">
            <span className="text-porcelain">The Directory</span>
          </h1>
          
          <p className="text-xl text-slate max-w-2xl mx-auto">
            Central directory with unified information infrastructure.
            <span className="text-porcelain"> 2,135 teams indexed.</span>
          </p>
        </motion.div>
      </div>

      {/* Search */}
      <div className="max-w-2xl mx-auto mb-12">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate" />
          <input
            type="text"
            placeholder="Search teams, players, tournaments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-void-mid border border-mist rounded-xl text-white placeholder-slate focus:outline-none focus:border-porcelain transition-colors"
          />
        </div>
      </div>

      {/* Categories Grid */}
      <div className="max-w-6xl mx-auto mb-16">
        <h3 className="font-display font-semibold text-xl mb-6">Browse Categories</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.map((category, index) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="relative"
              onMouseEnter={() => setHoveredCategory(category.id)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <div className="glass-panel rounded-xl p-6 cursor-pointer hover:border-porcelain/50 transition-colors">
                <h4 className="font-display font-semibold text-lg mb-2">{category.label}</h4>
                <div className="text-sm text-slate">
                  {category.subcategories.length} games
                </div>

                {hoveredCategory === category.id && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute top-full left-0 right-0 mt-2 p-4 bg-void-mid rounded-xl border border-mist z-10"
                  >
                    <div className="flex flex-wrap gap-2">
                      {category.subcategories.map(sub => (
                        <span key={sub} className="text-xs px-2 py-1 bg-white/5 rounded-full">
                          {sub}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Tier Comparison */}
      <div className="max-w-5xl mx-auto">
        <h3 className="font-display font-semibold text-xl mb-6 flex items-center gap-2">
          <Crown className="w-5 h-5 text-aged-gold" />
          Membership Tiers
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tiers.map((tier, index) => (
            <motion.div
              key={tier.name}
              initial={{ opacity: 0, x: index === 0 ? -20 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className={`
                relative rounded-2xl p-8
                ${tier.recommended ? 'bg-gradient-to-b from-aged-gold/20 to-transparent border-2 border-aged-gold' : 'glass-panel border border-mist'}
              `}
            >
              {tier.recommended && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 bg-aged-gold text-void-black text-xs font-bold rounded-full">
                    RECOMMENDED
                  </span>
                </div>
              )}

              <div className="text-center mb-6">
                <h4 className="font-display text-2xl font-bold mb-2">{tier.name}</h4>
                <div className="text-4xl font-display font-bold">
                  {tier.price}
                </div>
              </div>

              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, i) => (
                  <li key={i} className="flex items-center gap-3">
                    <Zap className={`w-4 h-4 ${tier.recommended ? 'text-aged-gold' : 'text-green-500'}`} />
                    <span className="text-slate">{feature}</span>
                  </li>
                ))}
              </ul>

              <button className={`
                w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2
                ${tier.recommended 
                  ? 'bg-gradient-to-r from-aged-gold to-yellow-600 text-void-black hover:shadow-glow-gold' 
                  : 'bg-void-mid border border-mist hover:border-porcelain'}
                transition-all
              `}>
                {tier.recommended ? 'Get Premium' : 'Start Free'}
                <ChevronRight className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default InformationHub