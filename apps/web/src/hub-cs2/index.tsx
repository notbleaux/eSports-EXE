/** [Ver001.000]
 * CS2 Hub - Hub: Counter-Strike 2
 * 
 * Central hub for CS2 content including maps, weapons, and analytics.
 * MVP placeholder with basic layout and component integration.
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crosshair,
  Map,
  Target,
  BarChart3,
  TrendingUp,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GameSelector, type GameType } from '@/components/GameSelector';
import { CS2MapViewer } from '@/components/cs2/CS2MapViewer';
import { CS2WeaponCard, CS2WeaponCompare } from '@/components/cs2/CS2WeaponCard';
import type { CS2MapData, CS2Weapon, CS2MapId } from '@/components/cs2/types';

// Hub Configuration
const HUB_CONFIG = {
  name: 'CS2',
  subtitle: 'Counter-Strike 2 Hub',
  description: 'Maps, weapons, and analytics for Counter-Strike 2',
  color: '#f59e0b', // Amber/Orange for CS2
  glowColor: 'rgba(245, 158, 11, 0.5)',
};

// Tab configuration
type HubTab = 'overview' | 'maps' | 'weapons' | 'analytics';

const TABS: { id: HubTab; label: string; icon: typeof Crosshair }[] = [
  { id: 'overview', label: 'Overview', icon: Crosshair },
  { id: 'maps', label: 'Maps', icon: Map },
  { id: 'weapons', label: 'Weapons', icon: Target },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

// Sample CS2 Maps
const SAMPLE_MAPS: Record<CS2MapId, CS2MapData> = {
  dust2: {
    id: 'dust2',
    name: 'Dust II',
    game: 'cs2',
    thumbnail: '',
    minimapUrl: '',
    fullmapUrl: '',
    dimensions: { width: 800, height: 800, inGameUnits: 4000 },
    callouts: [
      { id: '1', name: 'Long A', x: 75, y: 25, z: 0, region: 'a' },
      { id: '2', name: 'Catwalk', x: 50, y: 40, z: 0, region: 'mid' },
      { id: '3', name: 'B Tunnels', x: 25, y: 75, z: 0, region: 'b' },
      { id: '4', name: 'Mid', x: 50, y: 50, z: 0, region: 'mid' },
      { id: '5', name: 'CT Spawn', x: 50, y: 15, z: 0, region: 'ctspawn' },
    ],
    spawns: [
      { id: 't1', team: 't', x: 50, y: 90, z: 0 },
      { id: 'ct1', team: 'ct', x: 50, y: 10, z: 0 },
    ],
    bombsites: [
      { id: 'A', name: 'Bombsite A', x: 80, y: 20, z: 0, plantRadius: 10 },
      { id: 'B', name: 'Bombsite B', x: 20, y: 80, z: 0, plantRadius: 10 },
    ],
    zLevels: 1,
    competitivePool: true,
    releaseDate: '2001-03-13',
  },
  mirage: {
    id: 'mirage',
    name: 'Mirage',
    game: 'cs2',
    thumbnail: '',
    minimapUrl: '',
    fullmapUrl: '',
    dimensions: { width: 800, height: 800, inGameUnits: 4000 },
    callouts: [
      { id: '1', name: 'A Site', x: 80, y: 20, z: 0, region: 'a' },
      { id: '2', name: 'B Site', x: 20, y: 80, z: 0, region: 'b' },
      { id: '3', name: 'Mid', x: 50, y: 50, z: 0, region: 'mid' },
      { id: '4', name: 'Palace', x: 85, y: 15, z: 0, region: 'a' },
      { id: '5', name: 'Apartments', x: 15, y: 85, z: 0, region: 'b' },
    ],
    spawns: [
      { id: 't1', team: 't', x: 50, y: 90, z: 0 },
      { id: 'ct1', team: 'ct', x: 50, y: 10, z: 0 },
    ],
    bombsites: [
      { id: 'A', name: 'Bombsite A', x: 80, y: 20, z: 0, plantRadius: 10 },
      { id: 'B', name: 'Bombsite B', x: 20, y: 80, z: 0, plantRadius: 10 },
    ],
    zLevels: 1,
    competitivePool: true,
    releaseDate: '2013-06-12',
  },
  inferno: {
    id: 'inferno',
    name: 'Inferno',
    game: 'cs2',
    thumbnail: '',
    minimapUrl: '',
    fullmapUrl: '',
    dimensions: { width: 800, height: 800, inGameUnits: 4000 },
    callouts: [
      { id: '1', name: 'Banana', x: 70, y: 70, z: 0, region: 'b' },
      { id: '2', name: 'B Site', x: 80, y: 80, z: 0, region: 'b' },
      { id: '3', name: 'A Site', x: 20, y: 20, z: 0, region: 'a' },
      { id: '4', name: 'Arch', x: 40, y: 40, z: 0, region: 'mid' },
      { id: '5', name: 'Coffins', x: 75, y: 75, z: 0, region: 'b' },
    ],
    spawns: [
      { id: 't1', team: 't', x: 80, y: 80, z: 0 },
      { id: 'ct1', team: 'ct', x: 20, y: 20, z: 0 },
    ],
    bombsites: [
      { id: 'A', name: 'Bombsite A', x: 20, y: 20, z: 0, plantRadius: 10 },
      { id: 'B', name: 'Bombsite B', x: 80, y: 80, z: 0, plantRadius: 10 },
    ],
    zLevels: 1,
    competitivePool: true,
    releaseDate: '2001-03-13',
  },
} as const;

// Sample Weapons
const SAMPLE_WEAPONS: CS2Weapon[] = [
  {
    id: 'ak47',
    name: 'AK-47',
    category: 'rifle',
    side: 'terrorist',
    price: 2700,
    killReward: 300,
    stats: {
      damage: 36,
      fireRate: 600,
      recoilControl: 68,
      accurateRange: 30,
      armorPenetration: 155,
      movementSpeed: 78,
      headshotMultiplier: 3.5,
    },
    magazineSize: 30,
    reserveAmmo: 90,
    fireModes: ['semi', 'auto'],
    description: 'Powerful and reliable assault rifle. One-shot headshot potential.',
  },
  {
    id: 'm4a4',
    name: 'M4A4',
    category: 'rifle',
    side: 'counterterrorist',
    price: 3100,
    killReward: 300,
    stats: {
      damage: 33,
      fireRate: 666,
      recoilControl: 75,
      accurateRange: 32,
      armorPenetration: 140,
      movementSpeed: 80,
      headshotMultiplier: 3.5,
    },
    magazineSize: 30,
    reserveAmmo: 90,
    fireModes: ['semi', 'auto'],
    description: 'Counter-Terrorist mainstay rifle with higher fire rate.',
  },
  {
    id: 'awp',
    name: 'AWP',
    category: 'sniper',
    side: 'both',
    price: 4750,
    killReward: 100,
    stats: {
      damage: 115,
      fireRate: 41,
      recoilControl: 90,
      accurateRange: 100,
      armorPenetration: 195,
      movementSpeed: 45,
      headshotMultiplier: 4.0,
    },
    magazineSize: 5,
    reserveAmmo: 30,
    fireModes: ['semi'],
    description: 'High-risk, high-reward sniper rifle. One-shot kill to the body.',
  },
  {
    id: 'glock',
    name: 'Glock-18',
    category: 'pistol',
    side: 'terrorist',
    price: 200,
    killReward: 300,
    stats: {
      damage: 28,
      fireRate: 400,
      recoilControl: 85,
      accurateRange: 20,
      armorPenetration: 94,
      movementSpeed: 95,
      headshotMultiplier: 2.5,
    },
    magazineSize: 20,
    reserveAmmo: 120,
    fireModes: ['semi', 'burst'],
    description: 'Terrorist spawn pistol with burst fire option.',
  },
  {
    id: 'usp',
    name: 'USP-S',
    category: 'pistol',
    side: 'counterterrorist',
    price: 200,
    killReward: 300,
    stats: {
      damage: 35,
      fireRate: 352,
      recoilControl: 88,
      accurateRange: 22,
      armorPenetration: 101,
      movementSpeed: 95,
      headshotMultiplier: 2.5,
    },
    magazineSize: 12,
    reserveAmmo: 24,
    fireModes: ['semi'],
    description: 'CT spawn pistol with suppressor. Higher damage, lower capacity.',
  },
  {
    id: 'deagle',
    name: 'Desert Eagle',
    category: 'pistol',
    side: 'both',
    price: 700,
    killReward: 300,
    stats: {
      damage: 53,
      fireRate: 267,
      recoilControl: 45,
      accurateRange: 25,
      armorPenetration: 186,
      movementSpeed: 85,
      headshotMultiplier: 3.5,
    },
    magazineSize: 7,
    reserveAmmo: 35,
    fireModes: ['semi'],
    description: 'Iconic high-damage pistol. One-shot headshot potential.',
  },
];

function CS2HubContent(): JSX.Element {
  const [activeTab, setActiveTab] = useState<HubTab>('overview');
  const [selectedGame, setSelectedGame] = useState<GameType>('cs2');
  const [selectedMap, setSelectedMap] = useState<CS2MapId>('dust2');
  const [selectedWeapon, setSelectedWeapon] = useState<CS2Weapon | null>(null);
  const [compareWeapon, setCompareWeapon] = useState<CS2Weapon | null>(null);

  const handleGameChange = (game: GameType) => {
    setSelectedGame(game);
  };

  const handleWeaponSelect = (weapon: CS2Weapon) => {
    if (selectedWeapon?.id === weapon.id) {
      setSelectedWeapon(null);
    } else if (!selectedWeapon) {
      setSelectedWeapon(weapon);
    } else {
      setCompareWeapon(weapon);
    }
  };

  const clearComparison = () => {
    setSelectedWeapon(null);
    setCompareWeapon(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div 
                className="w-12 h-12 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: `${HUB_CONFIG.color}20` }}
              >
                <Crosshair className="w-6 h-6" style={{ color: HUB_CONFIG.color }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">{HUB_CONFIG.name}</h1>
                <p className="text-sm text-white/50">{HUB_CONFIG.subtitle}</p>
              </div>
            </div>
            
            <GameSelector
              selectedGame={selectedGame}
              onGameChange={handleGameChange}
              showLabel={false}
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                  transition-all duration-200
                  ${isActive 
                    ? 'bg-white/10 text-white' 
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }
                `}
                style={{
                  boxShadow: isActive ? `0 0 20px ${HUB_CONFIG.glowColor}` : undefined,
                }}
              >
                <Icon className="w-4 h-4" style={{ color: isActive ? HUB_CONFIG.color : undefined }} />
                <span style={{ color: isActive ? HUB_CONFIG.color : undefined }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Welcome Card */}
              <GlassCard className="p-8" variant="elevated">
                <div className="flex items-start gap-6">
                  <div 
                    className="w-16 h-16 rounded-2xl flex items-center justify-center"
                    style={{ backgroundColor: `${HUB_CONFIG.color}20` }}
                  >
                    <Target className="w-8 h-8" style={{ color: HUB_CONFIG.color }} />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold text-white mb-2">
                      Welcome to CS2 Hub
                    </h2>
                    <p className="text-white/60 mb-4 max-w-2xl">
                      {HUB_CONFIG.description}. Explore maps, compare weapons, 
                      and analyze your gameplay data.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                      <div className="p-4 bg-white/5 rounded-lg">
                        <Map className="w-5 h-5 mb-2" style={{ color: HUB_CONFIG.color }} />
                        <h3 className="font-medium text-white mb-1">Maps</h3>
                        <p className="text-xs text-white/50">
                          Interactive map viewer with callouts and heatmaps
                        </p>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-lg">
                        <Crosshair className="w-5 h-5 mb-2" style={{ color: HUB_CONFIG.color }} />
                        <h3 className="font-medium text-white mb-1">Weapons</h3>
                        <p className="text-xs text-white/50">
                          Detailed weapon stats and side-by-side comparison
                        </p>
                      </div>
                      
                      <div className="p-4 bg-white/5 rounded-lg">
                        <BarChart3 className="w-5 h-5 mb-2" style={{ color: HUB_CONFIG.color }} />
                        <h3 className="font-medium text-white mb-1">Analytics</h3>
                        <p className="text-xs text-white/50">
                          Match analysis and performance tracking
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </GlassCard>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <GlassCard className="p-4" variant="subtle">
                  <div className="text-2xl font-bold text-white">12</div>
                  <div className="text-xs text-white/50">Active Maps</div>
                </GlassCard>
                <GlassCard className="p-4" variant="subtle">
                  <div className="text-2xl font-bold text-white">34</div>
                  <div className="text-xs text-white/50">Weapons</div>
                </GlassCard>
                <GlassCard className="p-4" variant="subtle">
                  <div className="text-2xl font-bold text-white">8</div>
                  <div className="text-xs text-white/50">Active Duty</div>
                </GlassCard>
                <GlassCard className="p-4" variant="subtle">
                  <div className="text-2xl font-bold text-white">2026</div>
                  <div className="text-xs text-white/50">Season</div>
                </GlassCard>
              </div>
            </motion.div>
          )}

          {activeTab === 'maps' && (
            <motion.div
              key="maps"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Map Selector */}
              <div className="lg:col-span-1 space-y-4">
                <GlassCard className="p-4">
                  <h3 className="font-semibold text-white mb-4">Select Map</h3>
                  <div className="space-y-2">
                    {Object.values(SAMPLE_MAPS).map((map) => (
                      <button
                        key={map.id}
                        onClick={() => setSelectedMap(map.id)}
                        className={`
                          w-full flex items-center justify-between p-3 rounded-lg
                          transition-all duration-200
                          ${selectedMap === map.id 
                            ? 'bg-white/10' 
                            : 'bg-white/5 hover:bg-white/8'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <Map className="w-4 h-4 text-white/60" />
                          <span className="text-sm text-white">{map.name}</span>
                        </div>
                        {map.competitivePool && (
                          <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-[10px] rounded">
                            Active
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </GlassCard>

                {/* Map Info */}
                <GlassCard className="p-4">
                  <h3 className="font-semibold text-white mb-2">
                    {SAMPLE_MAPS[selectedMap].name}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-white/50">Bombsites</span>
                      <span className="text-white">A & B</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Competitive</span>
                      <span className="text-green-400">
                        {SAMPLE_MAPS[selectedMap].competitivePool ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/50">Callouts</span>
                      <span className="text-white">{SAMPLE_MAPS[selectedMap].callouts.length}</span>
                    </div>
                  </div>
                </GlassCard>
              </div>

              {/* Map Viewer */}
              <div className="lg:col-span-2">
                <CS2MapViewer
                  mapData={SAMPLE_MAPS[selectedMap]}
                  className="h-[600px]"
                />
              </div>
            </motion.div>
          )}

          {activeTab === 'weapons' && (
            <motion.div
              key="weapons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Comparison Mode Indicator */}
              {(selectedWeapon || compareWeapon) && (
                <GlassCard className="p-4" variant="subtle">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-white/60">Comparison Mode:</span>
                      {selectedWeapon && (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-400 rounded-lg text-sm">
                          {selectedWeapon.name}
                        </span>
                      )}
                      {compareWeapon && (
                        <>
                          <span className="text-white/40">vs</span>
                          <span className="px-3 py-1 bg-orange-500/20 text-orange-400 rounded-lg text-sm">
                            {compareWeapon.name}
                          </span>
                        </>
                      )}
                      {!compareWeapon && selectedWeapon && (
                        <span className="text-xs text-white/40">
                          Select another weapon to compare
                        </span>
                      )}
                    </div>
                    <button
                      onClick={clearComparison}
                      className="text-xs text-white/40 hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </GlassCard>
              )}

              {/* Weapon Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {SAMPLE_WEAPONS.map((weapon) => (
                  <CS2WeaponCard
                    key={weapon.id}
                    weapon={weapon}
                    compareWeapon={selectedWeapon?.id === weapon.id ? undefined : selectedWeapon}
                    onClick={handleWeaponSelect}
                    isSelected={selectedWeapon?.id === weapon.id || compareWeapon?.id === weapon.id}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <GlassCard className="p-8 text-center">
                <BarChart3 className="w-16 h-16 mx-auto mb-4 text-white/20" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Analytics Coming Soon
                </h3>
                <p className="text-white/50 max-w-md mx-auto">
                  Match statistics, heatmaps, and performance tracking 
                  will be available in the next update.
                </p>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}

function CS2Hub(): JSX.Element {
  return (
    <CS2HubContent />
  );
}

export default CS2Hub;
