/** [Ver001.000] */
/**
 * Map Data
 * ========
 * Comprehensive map data for all Valorant maps.
 */

import { MapData, MapId } from './types';

export const VALORANT_MAP_DATA: Record<MapId, MapData> = {
  ascent: {
    id: 'ascent',
    name: 'Ascent',
    game: 'valorant',
    thumbnail: '/maps/ascent/thumb.jpg',
    minimapUrl: '/maps/ascent/minimap.png',
    fullmapUrl: '/maps/ascent/full.jpg',
    dimensions: {
      width: 1024,
      height: 1024,
      inGameUnits: 10000,
    },
    callouts: [
      // A Site
      { id: 'a-site', name: 'A Site', x: 75, y: 25, z: 0, region: 'a' },
      { id: 'a-main', name: 'A Main', x: 85, y: 35, z: 0, region: 'a', commonNames: ['A Long'] },
      { id: 'a-short', name: 'A Short', x: 65, y: 30, z: 0, region: 'a' },
      { id: 'a-lobby', name: 'A Lobby', x: 90, y: 40, z: 0, region: 'a' },
      { id: 'tree', name: 'Tree', x: 60, y: 20, z: 0, region: 'a' },
      { id: 'heaven-a', name: 'Heaven', x: 75, y: 20, z: 1, region: 'a' },
      
      // B Site
      { id: 'b-site', name: 'B Site', x: 25, y: 75, z: 0, region: 'b' },
      { id: 'b-main', name: 'B Main', x: 35, y: 85, z: 0, region: 'b', commonNames: ['B Long'] },
      { id: 'b-short', name: 'B Short', x: 30, y: 65, z: 0, region: 'b' },
      { id: 'b-lobby', name: 'B Lobby', x: 40, y: 90, z: 0, region: 'b' },
      { id: 'market', name: 'Market', x: 20, y: 70, z: 0, region: 'b' },
      { id: 'heaven-b', name: 'Heaven', x: 25, y: 70, z: 1, region: 'b' },
      
      // Mid
      { id: 'mid', name: 'Mid', x: 50, y: 50, z: 0, region: 'mid' },
      { id: 'mid-courtyard', name: 'Courtyard', x: 55, y: 45, z: 0, region: 'mid' },
      { id: 'mid-bottom', name: 'Bottom Mid', x: 50, y: 60, z: 0, region: 'mid' },
      { id: 'mid-top', name: 'Top Mid', x: 50, y: 40, z: 0, region: 'mid' },
      { id: 'link', name: 'Link', x: 60, y: 50, z: 0, region: 'mid' },
      
      // Spawn
      { id: 'attacker-spawn', name: 'Attacker Spawn', x: 90, y: 90, z: 0, region: 'spawn' },
      { id: 'defender-spawn', name: 'Defender Spawn', x: 10, y: 10, z: 0, region: 'spawn' },
      
      // Other
      { id: 'wine', name: 'Wine', x: 35, y: 35, z: 0, region: 'other' },
      { id: 'garden', name: 'Garden', x: 65, y: 65, z: 0, region: 'other' },
    ],
    spawns: [
      { id: 'attacker-1', team: 'attacker', x: 90, y: 90, z: 0 },
      { id: 'attacker-2', team: 'attacker', x: 88, y: 92, z: 0 },
      { id: 'attacker-3', team: 'attacker', x: 92, y: 88, z: 0 },
      { id: 'defender-1', team: 'defender', x: 10, y: 10, z: 0 },
      { id: 'defender-2', team: 'defender', x: 12, y: 8, z: 0 },
      { id: 'defender-3', team: 'defender', x: 8, y: 12, z: 0 },
    ],
    spikeSites: [
      { id: 'A', name: 'A Site', x: 75, y: 25, z: 0, plantRadius: 15 },
      { id: 'B', name: 'B Site', x: 25, y: 75, z: 0, plantRadius: 15 },
    ],
    doors: [
      { id: 'a-door', x: 80, y: 30, z: 0, direction: 'vertical', destructible: true },
      { id: 'b-door', x: 30, y: 80, z: 0, direction: 'vertical', destructible: true },
    ],
    zLevels: 2,
  },

  bind: {
    id: 'bind',
    name: 'Bind',
    game: 'valorant',
    thumbnail: '/maps/bind/thumb.jpg',
    minimapUrl: '/maps/bind/minimap.png',
    fullmapUrl: '/maps/bind/full.jpg',
    dimensions: {
      width: 1024,
      height: 1024,
      inGameUnits: 9000,
    },
    callouts: [
      // A Site
      { id: 'a-site', name: 'A Site', x: 20, y: 50, z: 0, region: 'a' },
      { id: 'a-bath', name: 'Bath', x: 25, y: 45, z: 0, region: 'a' },
      { id: 'a-lobby', name: 'A Lobby', x: 30, y: 55, z: 0, region: 'a' },
      { id: 'a-short', name: 'A Short', x: 35, y: 40, z: 0, region: 'a' },
      
      // B Site
      { id: 'b-site', name: 'B Site', x: 80, y: 50, z: 0, region: 'b' },
      { id: 'b-long', name: 'B Long', x: 70, y: 60, z: 0, region: 'b' },
      { id: 'b-short', name: 'B Short', x: 75, y: 40, z: 0, region: 'b' },
      { id: 'b-lobby', name: 'B Lobby', x: 70, y: 45, z: 0, region: 'b' },
      { id: 'b-window', name: 'Window', x: 75, y: 35, z: 0, region: 'b' },
      
      // Mid
      { id: 'mid', name: 'Mid', x: 50, y: 50, z: 0, region: 'mid' },
      { id: 'mid-connector', name: 'Connector', x: 50, y: 60, z: 0, region: 'mid' },
      
      // Spawn
      { id: 'attacker-spawn', name: 'Attacker Spawn', x: 50, y: 90, z: 0, region: 'spawn' },
      { id: 'defender-spawn', name: 'Defender Spawn', x: 50, y: 10, z: 0, region: 'spawn' },
      
      // Other
      { id: 'hookah', name: 'Hookah', x: 60, y: 70, z: 0, region: 'other' },
      { id: 'showers', name: 'Showers', x: 40, y: 30, z: 0, region: 'other' },
      { id: 'elbow', name: 'Elbow', x: 65, y: 55, z: 0, region: 'other' },
      { id: 'u-hall', name: 'U Hall', x: 35, y: 45, z: 0, region: 'other' },
    ],
    spawns: [
      { id: 'attacker-1', team: 'attacker', x: 50, y: 90, z: 0 },
      { id: 'defender-1', team: 'defender', x: 50, y: 10, z: 0 },
    ],
    spikeSites: [
      { id: 'A', name: 'A Site', x: 20, y: 50, z: 0, plantRadius: 15 },
      { id: 'B', name: 'B Site', x: 80, y: 50, z: 0, plantRadius: 15 },
    ],
    teleporters: [
      { 
        id: 'tp-short', 
        entrance: { x: 45, y: 45, z: 0 }, 
        exit: { x: 55, y: 55, z: 0 }, 
        oneWay: false, 
        cooldown: 0 
      },
      { 
        id: 'tp-long', 
        entrance: { x: 55, y: 45, z: 0 }, 
        exit: { x: 45, y: 55, z: 0 }, 
        oneWay: false, 
        cooldown: 0 
      },
    ],
    zLevels: 1,
  },

  // Add more maps as needed...
  breeze: {
    id: 'breeze',
    name: 'Breeze',
    game: 'valorant',
    thumbnail: '/maps/breeze/thumb.jpg',
    minimapUrl: '/maps/breeze/minimap.png',
    fullmapUrl: '/maps/breeze/full.jpg',
    dimensions: {
      width: 1200,
      height: 1200,
      inGameUnits: 12000,
    },
    callouts: [
      { id: 'a-site', name: 'A Site', x: 20, y: 50, z: 0, region: 'a' },
      { id: 'b-site', name: 'B Site', x: 80, y: 50, z: 0, region: 'b' },
      { id: 'mid', name: 'Mid', x: 50, y: 50, z: 0, region: 'mid' },
      { id: 'hall', name: 'Hall', x: 60, y: 40, z: 0, region: 'mid' },
      { id: 'cave', name: 'Cave', x: 40, y: 60, z: 0, region: 'other' },
    ],
    spawns: [
      { id: 'attacker-1', team: 'attacker', x: 10, y: 50, z: 0 },
      { id: 'defender-1', team: 'defender', x: 90, y: 50, z: 0 },
    ],
    spikeSites: [
      { id: 'A', name: 'A Site', x: 20, y: 50, z: 0, plantRadius: 15 },
      { id: 'B', name: 'B Site', x: 80, y: 50, z: 0, plantRadius: 15 },
    ],
    zLevels: 1,
  },

  haven: {
    id: 'haven',
    name: 'Haven',
    game: 'valorant',
    thumbnail: '/maps/haven/thumb.jpg',
    minimapUrl: '/maps/haven/minimap.png',
    fullmapUrl: '/maps/haven/full.jpg',
    dimensions: {
      width: 1200,
      height: 1200,
      inGameUnits: 11000,
    },
    callouts: [
      { id: 'a-site', name: 'A Site', x: 85, y: 30, z: 0, region: 'a' },
      { id: 'b-site', name: 'B Site', x: 50, y: 50, z: 0, region: 'b' },
      { id: 'c-site', name: 'C Site', x: 15, y: 70, z: 0, region: 'c' },
      { id: 'mid', name: 'Mid', x: 50, y: 30, z: 0, region: 'mid' },
      { id: 'garage', name: 'Garage', x: 40, y: 40, z: 0, region: 'other' },
      { id: 'window', name: 'Window', x: 60, y: 40, z: 0, region: 'other' },
    ],
    spawns: [
      { id: 'attacker-1', team: 'attacker', x: 50, y: 90, z: 0 },
      { id: 'defender-1', team: 'defender', x: 50, y: 10, z: 0 },
    ],
    spikeSites: [
      { id: 'A', name: 'A Site', x: 85, y: 30, z: 0, plantRadius: 15 },
      { id: 'B', name: 'B Site', x: 50, y: 50, z: 0, plantRadius: 15 },
      { id: 'C', name: 'C Site', x: 15, y: 70, z: 0, plantRadius: 15 },
    ],
    zLevels: 1,
  },

  // Placeholder data for remaining maps
  fracture: {
    id: 'fracture',
    name: 'Fracture',
    game: 'valorant',
    thumbnail: '/maps/fracture/thumb.jpg',
    minimapUrl: '/maps/fracture/minimap.png',
    fullmapUrl: '/maps/fracture/full.jpg',
    dimensions: { width: 1024, height: 1024, inGameUnits: 10000 },
    callouts: [
      { id: 'a-site', name: 'A Site', x: 30, y: 30, z: 0, region: 'a' },
      { id: 'b-site', name: 'B Site', x: 70, y: 70, z: 0, region: 'b' },
      { id: 'attacker-spawn', name: 'Attacker Spawn', x: 50, y: 90, z: 0, region: 'spawn' },
      { id: 'defender-spawn', name: 'Defender Spawn', x: 50, y: 10, z: 0, region: 'spawn' },
    ],
    spawns: [
      { id: 'attacker-1', team: 'attacker', x: 50, y: 90, z: 0 },
      { id: 'defender-1', team: 'defender', x: 50, y: 10, z: 0 },
    ],
    spikeSites: [
      { id: 'A', name: 'A Site', x: 30, y: 30, z: 0, plantRadius: 15 },
      { id: 'B', name: 'B Site', x: 70, y: 70, z: 0, plantRadius: 15 },
    ],
    zLevels: 1,
  },

  icebox: {
    id: 'icebox',
    name: 'Icebox',
    game: 'valorant',
    thumbnail: '/maps/icebox/thumb.jpg',
    minimapUrl: '/maps/icebox/minimap.png',
    fullmapUrl: '/maps/icebox/full.jpg',
    dimensions: { width: 1024, height: 1024, inGameUnits: 10000 },
    callouts: [
      { id: 'a-site', name: 'A Site', x: 80, y: 30, z: 0, region: 'a' },
      { id: 'b-site', name: 'B Site', x: 20, y: 70, z: 0, region: 'b' },
      { id: 'attacker-spawn', name: 'Attacker Spawn', x: 50, y: 90, z: 0, region: 'spawn' },
      { id: 'defender-spawn', name: 'Defender Spawn', x: 50, y: 10, z: 0, region: 'spawn' },
    ],
    spawns: [
      { id: 'attacker-1', team: 'attacker', x: 50, y: 90, z: 0 },
      { id: 'defender-1', team: 'defender', x: 50, y: 10, z: 0 },
    ],
    spikeSites: [
      { id: 'A', name: 'A Site', x: 80, y: 30, z: 0, plantRadius: 15 },
      { id: 'B', name: 'B Site', x: 20, y: 70, z: 0, plantRadius: 15 },
    ],
    zLevels: 2,
  },

  lotus: {
    id: 'lotus',
    name: 'Lotus',
    game: 'valorant',
    thumbnail: '/maps/lotus/thumb.jpg',
    minimapUrl: '/maps/lotus/minimap.png',
    fullmapUrl: '/maps/lotus/full.jpg',
    dimensions: { width: 1024, height: 1024, inGameUnits: 10000 },
    callouts: [
      { id: 'a-site', name: 'A Site', x: 20, y: 20, z: 0, region: 'a' },
      { id: 'b-site', name: 'B Site', x: 80, y: 50, z: 0, region: 'b' },
      { id: 'c-site', name: 'C Site', x: 20, y: 80, z: 0, region: 'c' },
      { id: 'attacker-spawn', name: 'Attacker Spawn', x: 90, y: 50, z: 0, region: 'spawn' },
      { id: 'defender-spawn', name: 'Defender Spawn', x: 10, y: 50, z: 0, region: 'spawn' },
    ],
    spawns: [
      { id: 'attacker-1', team: 'attacker', x: 90, y: 50, z: 0 },
      { id: 'defender-1', team: 'defender', x: 10, y: 50, z: 0 },
    ],
    spikeSites: [
      { id: 'A', name: 'A Site', x: 20, y: 20, z: 0, plantRadius: 15 },
      { id: 'B', name: 'B Site', x: 80, y: 50, z: 0, plantRadius: 15 },
      { id: 'C', name: 'C Site', x: 20, y: 80, z: 0, plantRadius: 15 },
    ],
    zLevels: 1,
  },

  pearl: {
    id: 'pearl',
    name: 'Pearl',
    game: 'valorant',
    thumbnail: '/maps/pearl/thumb.jpg',
    minimapUrl: '/maps/pearl/minimap.png',
    fullmapUrl: '/maps/pearl/full.jpg',
    dimensions: { width: 1024, height: 1024, inGameUnits: 10000 },
    callouts: [
      { id: 'a-site', name: 'A Site', x: 20, y: 50, z: 0, region: 'a' },
      { id: 'b-site', name: 'B Site', x: 80, y: 50, z: 0, region: 'b' },
      { id: 'attacker-spawn', name: 'Attacker Spawn', x: 50, y: 90, z: 0, region: 'spawn' },
      { id: 'defender-spawn', name: 'Defender Spawn', x: 50, y: 10, z: 0, region: 'spawn' },
    ],
    spawns: [
      { id: 'attacker-1', team: 'attacker', x: 50, y: 90, z: 0 },
      { id: 'defender-1', team: 'defender', x: 50, y: 10, z: 0 },
    ],
    spikeSites: [
      { id: 'A', name: 'A Site', x: 20, y: 50, z: 0, plantRadius: 15 },
      { id: 'B', name: 'B Site', x: 80, y: 50, z: 0, plantRadius: 15 },
    ],
    zLevels: 1,
  },

  split: {
    id: 'split',
    name: 'Split',
    game: 'valorant',
    thumbnail: '/maps/split/thumb.jpg',
    minimapUrl: '/maps/split/minimap.png',
    fullmapUrl: '/maps/split/full.jpg',
    dimensions: { width: 1024, height: 1024, inGameUnits: 9000 },
    callouts: [
      { id: 'a-site', name: 'A Site', x: 50, y: 20, z: 0, region: 'a' },
      { id: 'b-site', name: 'B Site', x: 50, y: 80, z: 0, region: 'b' },
      { id: 'mid', name: 'Mid', x: 50, y: 50, z: 0, region: 'mid' },
      { id: 'attacker-spawn', name: 'Attacker Spawn', x: 10, y: 50, z: 0, region: 'spawn' },
      { id: 'defender-spawn', name: 'Defender Spawn', x: 90, y: 50, z: 0, region: 'spawn' },
    ],
    spawns: [
      { id: 'attacker-1', team: 'attacker', x: 10, y: 50, z: 0 },
      { id: 'defender-1', team: 'defender', x: 90, y: 50, z: 0 },
    ],
    spikeSites: [
      { id: 'A', name: 'A Site', x: 50, y: 20, z: 0, plantRadius: 15 },
      { id: 'B', name: 'B Site', x: 50, y: 80, z: 0, plantRadius: 15 },
    ],
    zLevels: 2,
  },

  sunset: {
    id: 'sunset',
    name: 'Sunset',
    game: 'valorant',
    thumbnail: '/maps/sunset/thumb.jpg',
    minimapUrl: '/maps/sunset/minimap.png',
    fullmapUrl: '/maps/sunset/full.jpg',
    dimensions: { width: 1024, height: 1024, inGameUnits: 10000 },
    callouts: [
      { id: 'a-site', name: 'A Site', x: 20, y: 50, z: 0, region: 'a' },
      { id: 'b-site', name: 'B Site', x: 80, y: 50, z: 0, region: 'b' },
      { id: 'attacker-spawn', name: 'Attacker Spawn', x: 10, y: 50, z: 0, region: 'spawn' },
      { id: 'defender-spawn', name: 'Defender Spawn', x: 90, y: 50, z: 0, region: 'spawn' },
    ],
    spawns: [
      { id: 'attacker-1', team: 'attacker', x: 10, y: 50, z: 0 },
      { id: 'defender-1', team: 'defender', x: 90, y: 50, z: 0 },
    ],
    spikeSites: [
      { id: 'A', name: 'A Site', x: 20, y: 50, z: 0, plantRadius: 15 },
      { id: 'B', name: 'B Site', x: 80, y: 50, z: 0, plantRadius: 15 },
    ],
    zLevels: 1,
  },
};

// Helper functions
export const getMapById = (id: MapId): MapData => {
  return VALORANT_MAP_DATA[id] || VALORANT_MAP_DATA.ascent;
};

export const getAllMaps = (): MapData[] => {
  return Object.values(VALORANT_MAP_DATA);
};

export const getMapsByGame = (game: 'valorant' | 'cs2'): MapData[] => {
  return Object.values(VALORANT_MAP_DATA).filter(m => m.game === game);
};
