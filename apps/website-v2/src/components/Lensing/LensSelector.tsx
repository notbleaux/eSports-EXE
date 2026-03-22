/**
 * LensSelector - HUB Toggle UI
 * [Ver001.000]
 */

import React from 'react'
import { Button } from '../ui/button' // Assume UI lib or Tailwind
import { useLensingStore, useActiveLens, useIsMobile } from '../../store/lensingStore'
import { PanelLeft, PanelRight, LayoutGrid, Smartphone, Monitor } from 'lucide-react'
import { motion } from 'framer-motion'

const presets = [
  { id: 'analytics', label: 'Analytics', hubs: ['SATOR', 'ROTAS'] },
  { id: 'community', label: 'Community', hubs: ['AREPO', 'OPERA'] },
  { id: 'pro', label: 'Pro', hubs: ['OPERA'] },
  { id: 'full', label: 'Full', hubs: ['SATOR', 'ROTAS', 'AREPO', 'OPERA'] }
]

const hubLabels = {
  SATOR: 'SATOR Stats',
  ROTAS: 'ROTAS Maps',
  AREPO: 'AREPO Community',
  OPERA: 'OPERA Pro'
}

const LensSelector: React.FC = () => {
  const activeLens = useActiveLens()
  const isMobile = useIsMobile()
  const { toggleHub, loadPreset, setMobile } = useLensingStore()

  const toggleHubHandler = (hub: string) => toggleHub(hub)

  const loadPresetHandler = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId)
    if (preset) loadPreset(presetId, 'Valorant') // Default tenet
  }

  return (
    <motion.div
      className="flex flex-col gap-4 p-6 bg-gradient-to-r from-black/80 to-purple-900/50 backdrop-blur-xl border border-purple-500/30 rounded-2xl shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Mobile/Desktop toggle */}
      <div className="flex items-center justify-center gap-2 text-xs text-purple-300 mb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobile(true)}
          className={isMobile ? 'bg-purple-500/50' : ''}
        >
          <Smartphone className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setMobile(false)}
          className={!isMobile ? 'bg-indigo-500/50' : ''}
        >
          <Monitor className="w-4 h-4" />
        </Button>
      </div>

      {/* HUB Toggles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {(['SATOR', 'ROTAS', 'AREPO', 'OPERA'] as const).map(hub => (
          <motion.div key={hub} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => toggleHubHandler(hub)}
              variant={activeLens.includes(hub) ? 'default' : 'outline'}
              className={`h-12 w-full flex flex-col gap-1 text-xs capitalize ${
                activeLens.includes(hub)
                  ? 'bg-gradient-to-r from-purple-500 to-indigo-600 shadow-lg'
                  : 'border-purple-500/50 hover:border-purple-400/80'
              }`}
            >
              <span className="font-mono tracking-wider">{hub}</span>
              <span className="text-[10px] opacity-80 font-light">
                {hubLabels[hub as keyof typeof hubLabels]}
              </span>
            </Button>
          </motion.div>
        ))}
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-white/10">
        {presets.map(preset => (
          <Button
            key={preset.id}
            variant="outline"
            size="sm"
            onClick={() => loadPresetHandler(preset.id)}
            className="text-xs border-purple-500/50 hover:bg-purple-500/20 px-3 py-1.5"
          >
            {preset.label}
          </Button>
        ))}
      </div>

      {/* Status */}
      <div className="text-center text-[11px] text-purple-400/80 mt-2">
        Active: {activeLens.join(', ')} | Max: {isMobile ? 2 : 4} hubs
      </div>
    </motion.div>
  )
}

export default LensSelector
