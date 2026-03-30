/** [Ver001.000]
 * CS2Demo Component
 * 
 * Demo page showcasing all CS2 components.
 * Can be used for development and testing.
 */

import React, { useState } from 'react';
import { Crosshair, Map, Target, ChevronRight } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { GameSelector, type GameType } from '@/components/GameSelector';
import { CS2MapViewer } from './CS2MapViewer';
import { CS2WeaponCard, CS2WeaponCompare } from './CS2WeaponCard';
import type { CS2MapData, CS2Weapon, CS2MapId } from './types';

// Sample Map Data
const SAMPLE_MAP: CS2MapData = {
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
    { id: '6', name: 'T Spawn', x: 50, y: 85, z: 0, region: 'tspawn' },
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
};

// Sample Heatmap Data
const SAMPLE_HEATMAP = {
  type: 'kills' as const,
  points: [
    { x: 80, y: 20, z: 0, intensity: 0.8 },
    { x: 75, y: 25, z: 0, intensity: 0.6 },
    { x: 50, y: 50, z: 0, intensity: 0.9 },
    { x: 25, y: 75, z: 0, intensity: 0.7 },
    { x: 20, y: 80, z: 0, intensity: 0.5 },
    { x: 50, y: 40, z: 0, intensity: 0.4 },
  ],
  radius: 30,
  intensity: 0.7,
};

// Sample Weapons
const WEAPONS: CS2Weapon[] = [
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

export const CS2Demo: React.FC = () => {
  const [selectedGame, setSelectedGame] = useState<GameType>('cs2');
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [selectedWeapon, setSelectedWeapon] = useState<CS2Weapon>(WEAPONS[0]);
  const [compareWeapon, setCompareWeapon] = useState<CS2Weapon>(WEAPONS[1]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">CS2 Components Demo</h1>
            <p className="text-white/50">
              Testing and development page for CS2 visualization components
            </p>
          </div>
          <GameSelector
            selectedGame={selectedGame}
            onGameChange={setSelectedGame}
          />
        </div>

        {/* Section 1: Game Selector */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-orange-500" />
            1. Game Selector
          </h2>
          <GlassCard className="p-6">
            <p className="text-white/60 mb-4">
              Selected game: <span className="text-white font-semibold">{selectedGame}</span>
            </p>
            <div className="flex gap-4">
              <GameSelector
                selectedGame={selectedGame}
                onGameChange={setSelectedGame}
              />
            </div>
          </GlassCard>
        </section>

        {/* Section 2: Map Viewer */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Map className="w-5 h-5 text-orange-500" />
            2. CS2 Map Viewer
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <CS2MapViewer
                mapData={SAMPLE_MAP}
                heatmapData={showHeatmap ? SAMPLE_HEATMAP : undefined}
                className="h-[500px]"
              />
            </div>
            <div className="space-y-4">
              <GlassCard className="p-4">
                <h3 className="font-semibold text-white mb-3">Map Controls</h3>
                <div className="space-y-2 text-sm text-white/60">
                  <p>• Scroll to zoom</p>
                  <p>• Drag to pan</p>
                  <p>• Ctrl+G: Toggle grid</p>
                  <p>• 0: Reset view</p>
                </div>
              </GlassCard>
              
              <GlassCard className="p-4">
                <h3 className="font-semibold text-white mb-3">Heatmap Demo</h3>
                <button
                  onClick={() => setShowHeatmap(!showHeatmap)}
                  className={`
                    w-full px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${showHeatmap 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                    }
                  `}
                >
                  {showHeatmap ? 'Hide Heatmap' : 'Show Heatmap'}
                </button>
              </GlassCard>

              <GlassCard className="p-4">
                <h3 className="font-semibold text-white mb-3">Map Info</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/50">Map</span>
                    <span className="text-white">{SAMPLE_MAP.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Bombsites</span>
                    <span className="text-white">A & B</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/50">Callouts</span>
                    <span className="text-white">{SAMPLE_MAP.callouts.length}</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* Section 3: Weapon Cards */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-orange-500" />
            3. Weapon Cards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WEAPONS.map((weapon) => (
              <CS2WeaponCard
                key={weapon.id}
                weapon={weapon}
              />
            ))}
          </div>
        </section>

        {/* Section 4: Weapon Comparison */}
        <section>
          <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
            <ChevronRight className="w-5 h-5 text-orange-500" />
            4. Weapon Comparison
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CS2WeaponCompare
              weapon1={selectedWeapon}
              weapon2={compareWeapon}
            />
            
            <GlassCard className="p-4">
              <h3 className="font-semibold text-white mb-4">Select Weapons to Compare</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Weapon 1</label>
                  <select
                    value={selectedWeapon.id}
                    onChange={(e) => {
                      const weapon = WEAPONS.find(w => w.id === e.target.value);
                      if (weapon) setSelectedWeapon(weapon);
                    }}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  >
                    {WEAPONS.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-2 block">Weapon 2</label>
                  <select
                    value={compareWeapon.id}
                    onChange={(e) => {
                      const weapon = WEAPONS.find(w => w.id === e.target.value);
                      if (weapon) setCompareWeapon(weapon);
                    }}
                    className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white"
                  >
                    {WEAPONS.map(w => (
                      <option key={w.id} value={w.id}>{w.name}</option>
                    ))}
                  </select>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CS2Demo;
