/**
 * ZiXiS Station Router Configuration
 * TENET Coordinate System Implementation
 * 
 * Routing Structure:
 * /{hub}-ZiXiS-{base}/inXYS-{subbase}:{YJH}-{SZNxr}
 * 
 * Example: /rotas-ZiXiS-Base:inXYS-Ace-PiTAU-LI3-222
 */

import { lazy } from 'react';
import type { ComponentType } from 'react';

// Station Type Definitions
export interface StationCoordinate {
  path: string;           // CATE, VAC, TAU, etc.
  zixis: 'ZiXiS';         // Fixed station marker
  base: string;           // Base, Sub-Base, XBaseX, etc.
  inXYS: string;          // Ace, Ese, Eca, Asa, Aca, Aza, etc.
  yjh: string;            // PiTAU, FiTAU, ViTAU, etc.
  sznxr: string;          // LI3-xxx, lI3-xxx, Il3-xxx
}

export interface GateCoordinate {
  szixisz: 'sZiXiSz';     // Fixed gate marker
  gate: string;           // CATE, VAC, TAU, ARC, ETAC, etc.
  inXYS: string;          // Sub-base identifier
  yjh: string;            // Tonal marker
  sznxr: string;          // Identity coordinate
}

// HUB Definitions with Teal/Indigo/Orange/Rose color coding
export const HUB_STATIONS = {
  ROTAS: {
    id: 'rotas',
    name: 'ROTAS',
    title: 'Stats Reference HUB',
    description: 'Raw esports statistics and data foundation',
    color: '#2DD4BF',      // Teal
    colorClass: 'text-teal-400',
    bgClass: 'bg-teal-500/10',
    borderClass: 'border-teal-500/30',
    icon: 'BarChart3',
    coordinate: 'ROTAS-ZiXiS-Base:inXYS-Ace-PiTAU-LI3-131181131',
    system: 'Pi',          // Mathematical foundation
  },
  SATOR: {
    id: 'sator',
    name: 'SATOR',
    title: 'Analytics HUB',
    description: 'Advanced analytics and predictive intelligence',
    color: '#6366F1',      // Indigo
    colorClass: 'text-indigo-400',
    bgClass: 'bg-indigo-500/10',
    borderClass: 'border-indigo-500/30',
    icon: 'Brain',
    coordinate: 'SATOR-ZiXiS-Base:inXYS-Ace-FiTAU-LI3-131181131',
    system: 'Fi',          // Golden ratio / optimization
  },
  OPERA: {
    id: 'opera',
    name: 'OPERA',
    title: 'Pro Scene HUB',
    description: 'Professional esports information and live tracking',
    color: '#F97316',      // Orange
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/10',
    borderClass: 'border-orange-500/30',
    icon: 'Trophy',
    coordinate: 'OPERA-ZiXiS-Base:inXYS-Asa-ViTAU-LI3-131181131',
    system: 'Vi',          // Frequency / broadcast
  },
  AREPO: {
    id: 'arepo',
    name: 'AREPO',
    title: 'Community HUB',
    description: 'Forums, players, and fan engagement',
    color: '#FB7185',      // Rose
    colorClass: 'text-rose-400',
    bgClass: 'bg-rose-500/10',
    borderClass: 'border-rose-500/30',
    icon: 'Users',
    coordinate: 'AREPO-ZiXiS-Base:inXYS-Ese-ViTAU-LI3-131181131',
    system: 'Vi/Rose',     // Community frequency
  },
  TENET: {
    id: 'tenet',
    name: 'TENET',
    title: 'Grand-Transversal Central',
    description: 'Master coordination and navigation station',
    color: '#8B5CF6',      // Violet
    colorClass: 'text-violet-400',
    bgClass: 'bg-violet-500/10',
    borderClass: 'border-violet-500/30',
    icon: 'Network',
    coordinate: 'TENET-ZiXiS-Base:inXYS-Ace-PiTAU-LI3-131181131',
    system: 'Pi/Fi/Vi',    // All systems integrated
  },
} as const;

export type HubId = keyof typeof HUB_STATIONS;

// TeZet Game Selection System
export const TEZET_GAMES = {
  VALORANT: {
    id: 'valorant',
    name: 'Valorant',
    nome: 'VAL',           // nome.ID component
    xystem: 'TAC',         // xystem code
    gNomeId: 'VAL.TAC.001',
    icon: 'Crosshair',
    color: '#FF4655',
    leagues: ['VCT', 'VCL', 'GC'],
  },
  CS2: {
    id: 'cs2',
    name: 'CS2',
    nome: 'CSG',           // Counter-Strike Global
    xystem: 'FPS',
    gNomeId: 'CSG.FPS.002',
    icon: 'Target',
    color: '#F7931E',
    leagues: ['BLAST', 'IEM', 'PGL', 'Major'],
  },
  LOL: {
    id: 'lol',
    name: 'League of Legends',
    nome: 'LOL',
    xystem: 'MOBA',
    gNomeId: 'LOL.MOBA.003',
    icon: 'Sword',
    color: '#C28F2C',
    leagues: ['LCS', 'LEC', 'LCK', 'LPL', 'Worlds'],
  },
  DOTA2: {
    id: 'dota2',
    name: 'Dota 2',
    nome: 'DOT',
    xystem: 'MOBA',
    gNomeId: 'DOT.MOBA.004',
    icon: 'Shield',
    color: '#E03C3C',
    leagues: ['DPC', 'TI', 'ESL'],
  },
} as const;

export type GameId = keyof typeof TEZET_GAMES;

// Gate Vocabulary (Group 5 from pattern analysis)
export const GATE_VOCABULARY = {
  CATE: { label: 'Tournaments', icon: 'Trophy', description: 'Competitive events and leagues' },
  VAC: { label: 'Matches', icon: 'Swords', description: 'Individual match data and results' },
  TAU: { label: 'Players', icon: 'User', description: 'Player statistics and profiles' },
  ARC: { label: 'Teams', icon: 'Users', description: 'Team rosters and organization data' },
  ETAC: { label: 'Analytics', icon: 'LineChart', description: 'Advanced statistical analysis' },
  ATEC: { label: 'Trends', icon: 'TrendingUp', description: 'Historical patterns and trends' },
  EVAC: { label: 'Events', icon: 'Calendar', description: 'Upcoming and past events' },
  CAVE: { label: 'Archives', icon: 'Archive', description: 'Historical data repository' },
  XAVA: { label: 'Cross-Reference', icon: 'GitCompare', description: 'Multi-source verification' },
  ZETA: { label: 'Finals', icon: 'Crown', description: 'Championship and final matches' },
} as const;

export type GateId = keyof typeof GATE_VOCABULARY;

// Sub-Base Morphology (Group 13 from pattern analysis)
export const SUBBASE_MORPHOLOGY = {
  Ace: { state: 'active', position: 'external', description: 'Primary active instance' },
  Ese: { state: 'entry', position: 'external', description: 'Entry point / east anchor' },
  Eca: { state: 'echo', position: 'center', description: 'Centered echo instance' },
  Asa: { state: 'stable', position: 'anchor', description: 'Stable anchor point' },
  Aca: { state: 'active-secondary', position: 'center', description: 'Secondary active' },
  Aza: { state: 'dormant', position: 'zone', description: 'Dormant/archive zone' },
  Eze: { state: 'edge', position: 'external', description: 'Edge/external boundary' },
  Exe: { state: 'executable', position: 'external', description: 'Processing instance' },
} as const;

export type SubBaseId = keyof typeof SUBBASE_MORPHOLOGY;

// Route Generation Functions
export function generateStationRoute(
  hub: HubId,
  base: string = 'Base',
  inXYS: SubBaseId = 'Ace',
  yjhSuffix: string = 'TAU',
  sznxr: string = 'LI3-131181131'
): string {
  const hubConfig = HUB_STATIONS[hub];
  const yjh = `${hubConfig.system}${yjhSuffix}`;
  return `/${hubConfig.id}-ZiXiS-${base}:inXYS-${inXYS}-${yjh}-${sznxr}`;
}

export function generateGateRoute(
  hub: HubId,
  game: GameId,
  gate: GateId,
  inXYS: SubBaseId = 'Ace',
  sznxr: string = 'LI3-222'
): string {
  const hubConfig = HUB_STATIONS[hub];
  const gameConfig = TEZET_GAMES[game];
  const yjh = `${hubConfig.system}TOU`; // Transfer protocol for gates
  return `/${hubConfig.id}/${gameConfig.id}/${gate}:inXYS-${inXYS}-${yjh}-${sznxr}`;
}

export function generateTeZetRoute(hub: HubId, game: GameId): string {
  return `/${HUB_STATIONS[hub].id}/${TEZET_GAMES[game].id}`;
}

// Navigation Helper Functions
export function getHubRoutes(): Array<{ path: string; hub: HubId; label: string }> {
  return Object.entries(HUB_STATIONS).map(([key, config]) => ({
    path: `/${config.id}`,
    hub: key as HubId,
    label: config.name,
  }));
}

export function getTeZetRoutes(hub: HubId): Array<{ path: string; game: GameId; label: string }> {
  return Object.entries(TEZET_GAMES).map(([key, config]) => ({
    path: `/${HUB_STATIONS[hub].id}/${config.id}`,
    game: key as GameId,
    label: config.name,
  }));
}

export function getGateRoutes(hub: HubId, game: GameId): Array<{ path: string; gate: GateId; label: string }> {
  return Object.entries(GATE_VOCABULARY).map(([key, config]) => ({
    path: `/${HUB_STATIONS[hub].id}/${TEZET_GAMES[game].id}/${key}`,
    gate: key as GateId,
    label: config.label,
  }));
}

// Legacy Route Redirects (for backward compatibility)
export const LEGACY_REDIRECTS = {
  '/analytics': '/sator',
  '/stats': '/rotas',
  '/community': '/arepo',
  '/pro-scene': '/opera',
  '/hubs': '/tenet',
} as const;

// Coordinate Parser
export function parseCoordinate(url: string): Partial<StationCoordinate> | null {
  // Pattern: /{path}-ZiXiS-{base}:inXYS-{inXYS}-{yjh}-{sznxr}
  const pattern = /\/([^-]+)-ZiXiS-([^:]+):inXYS-([^-]+)-([^-]+)-(.+)/;
  const match = url.match(pattern);
  
  if (!match) return null;
  
  return {
    path: match[1],
    zixis: 'ZiXiS',
    base: match[2],
    inXYS: match[3],
    yjh: match[4],
    sznxr: match[5],
  };
}

// Lazy load hub components
export const hubLoaders: Record<HubId, () => Promise<{ default: ComponentType }>> = {
  ROTAS: () => import('../hub-2-rotas/index.tsx'),
  SATOR: () => import('../hub-1-sator/index.tsx'),
  OPERA: () => import('../hub-4-opera/index.ts'),
  AREPO: () => import('../hub-3-arepo/index.ts'),
  TENET: () => import('../hub-5-tenet/index.tsx'),
};
