/** [Ver001.000] */
/**
 * TacticalView Demo
 * =================
 * Example usage of the TacticalView component with mock data.
 */

import React, { useState, useCallback } from 'react';
import { TacticalView } from './TacticalView';
import { useTacticalWebSocket } from './useTacticalWebSocket';
import {
  MatchTimeline,
  MapData,
  Player,
  Agent,
  MatchFrame,
  KeyEvent,
} from './types';

// Mock agents
const MOCK_AGENTS: Record<string, Agent> = {
  jett: {
    id: 'jett',
    name: 'Jett',
    role: 'duelist',
    color: '#74b9ff',
    abilities: [
      { id: 'cloudburst', name: 'Cloudburst', type: 'basic', maxCharges: 3, cost: 200 },
      { id: 'updraft', name: 'Updraft', type: 'basic', maxCharges: 2, cost: 150 },
      { id: 'tailwind', name: 'Tailwind', type: 'signature', maxCharges: 1, cost: 0 },
      { id: 'blade_storm', name: 'Blade Storm', type: 'ultimate', maxCharges: 1, cost: 0 },
    ],
  },
  sage: {
    id: 'sage',
    name: 'Sage',
    role: 'sentinel',
    color: '#81ecec',
    abilities: [
      { id: 'barrier', name: 'Barrier Orb', type: 'basic', maxCharges: 1, cost: 400 },
      { id: 'slow', name: 'Slow Orb', type: 'basic', maxCharges: 2, cost: 200 },
      { id: 'heal', name: 'Healing Orb', type: 'signature', maxCharges: 1, cost: 0 },
      { id: 'resurrection', name: 'Resurrection', type: 'ultimate', maxCharges: 1, cost: 0 },
    ],
  },
  phoenix: {
    id: 'phoenix',
    name: 'Phoenix',
    role: 'duelist',
    color: '#ff7675',
    abilities: [
      { id: 'blaze', name: 'Blaze', type: 'basic', maxCharges: 1, cost: 200 },
      { id: 'curveball', name: 'Curveball', type: 'basic', maxCharges: 2, cost: 250 },
      { id: 'hot_hands', name: 'Hot Hands', type: 'signature', maxCharges: 1, cost: 0 },
      { id: 'run_it_back', name: 'Run It Back', type: 'ultimate', maxCharges: 1, cost: 0 },
    ],
  },
  sova: {
    id: 'sova',
    name: 'Sova',
    role: 'initiator',
    color: '#74b9ff',
    abilities: [
      { id: 'shock_dart', name: 'Shock Dart', type: 'basic', maxCharges: 2, cost: 150 },
      { id: 'recon', name: 'Recon Bolt', type: 'basic', maxCharges: 1, cost: 400 },
      { id: 'drone', name: 'Owl Drone', type: 'signature', maxCharges: 1, cost: 400 },
      { id: 'hunter', name: "Hunter's Fury", type: 'ultimate', maxCharges: 1, cost: 0 },
    ],
  },
  omen: {
    id: 'omen',
    name: 'Omen',
    role: 'controller',
    color: '#6c5ce7',
    abilities: [
      { id: 'shrouded', name: 'Shrouded Step', type: 'basic', maxCharges: 2, cost: 150 },
      { id: 'paranoia', name: 'Paranoia', type: 'basic', maxCharges: 1, cost: 300 },
      { id: 'smoke', name: 'Dark Cover', type: 'signature', maxCharges: 2, cost: 150 },
      { id: 'teleport', name: 'From the Shadows', type: 'ultimate', maxCharges: 1, cost: 0 },
    ],
  },
};

// Mock map data
const MOCK_MAP_DATA: MapData = {
  id: 'ascent',
  name: 'Ascent',
  displayName: 'Ascent',
  minimapUrl: '/maps/ascent_minimap.png',
  dimensions: {
    inGameUnits: 10000,
    minimapPixels: 1024,
  },
  bounds: {
    min: { x: -5000, y: -5000 },
    max: { x: 5000, y: 5000 },
  },
  callouts: [
    { id: 'a_site', name: 'A Site', position: { x: 2000, y: -2000 }, region: 'a' },
    { id: 'b_site', name: 'B Site', position: { x: -2000, y: 2000 }, region: 'b' },
    { id: 'mid', name: 'Mid', position: { x: 0, y: 0 }, region: 'mid' },
    { id: 'spawn', name: 'Defender Spawn', position: { x: 0, y: -3500 }, region: 'spawn' },
  ],
  spikeSites: [
    { id: 'a', name: 'A', plantPositions: [{ x: 2000, y: -2000 }], defaultPlant: { x: 2000, y: -2000 } },
    { id: 'b', name: 'B', plantPositions: [{ x: -2000, y: 2000 }], defaultPlant: { x: -2000, y: 2000 } },
  ],
};

// Mock players
const MOCK_PLAYERS: Player[] = [
  {
    id: 'p1',
    name: 'TenZ',
    teamId: 'sen',
    teamSide: 'attacker',
    agent: MOCK_AGENTS.jett,
    health: 100,
    maxHealth: 100,
    armor: 50,
    isAlive: true,
    credits: 4500,
  },
  {
    id: 'p2',
    name: 'ShahZaM',
    teamId: 'sen',
    teamSide: 'attacker',
    agent: MOCK_AGENTS.sova,
    health: 85,
    maxHealth: 100,
    armor: 25,
    isAlive: true,
    credits: 3200,
  },
  {
    id: 'p3',
    name: 'SicK',
    teamId: 'sen',
    teamSide: 'attacker',
    agent: MOCK_AGENTS.phoenix,
    health: 0,
    maxHealth: 100,
    armor: 0,
    isAlive: false,
    credits: 1500,
  },
  {
    id: 'p4',
    name: 'dapr',
    teamId: 'sen',
    teamSide: 'attacker',
    agent: MOCK_AGENTS.sage,
    health: 100,
    maxHealth: 100,
    armor: 50,
    isAlive: true,
    credits: 2100,
  },
  {
    id: 'p5',
    name: 'zombs',
    teamId: 'sen',
    teamSide: 'attacker',
    agent: MOCK_AGENTS.omen,
    health: 60,
    maxHealth: 100,
    armor: 0,
    isAlive: true,
    credits: 1800,
  },
  {
    id: 'p6',
    name: 'Asuna',
    teamId: '100t',
    teamSide: 'defender',
    agent: MOCK_AGENTS.phoenix,
    health: 100,
    maxHealth: 100,
    armor: 50,
    isAlive: true,
    credits: 4100,
  },
  {
    id: 'p7',
    name: 'Hiko',
    teamId: '100t',
    teamSide: 'defender',
    agent: MOCK_AGENTS.sage,
    health: 100,
    maxHealth: 100,
    armor: 50,
    isAlive: true,
    credits: 3800,
  },
  {
    id: 'p8',
    name: 'Ethan',
    teamId: '100t',
    teamSide: 'defender',
    agent: MOCK_AGENTS.omen,
    health: 100,
    maxHealth: 100,
    armor: 50,
    isAlive: true,
    credits: 2900,
  },
  {
    id: 'p9',
    name: 'nitr0',
    teamId: '100t',
    teamSide: 'defender',
    agent: MOCK_AGENTS.jett,
    health: 35,
    maxHealth: 100,
    armor: 0,
    isAlive: true,
    credits: 1200,
  },
  {
    id: 'p10',
    name: 'steel',
    teamId: '100t',
    teamSide: 'defender',
    agent: MOCK_AGENTS.sova,
    health: 0,
    maxHealth: 100,
    armor: 0,
    isAlive: false,
    credits: 800,
  },
];

// Generate mock frames
const generateMockFrames = (): MatchFrame[] => {
  const frames: MatchFrame[] = [];
  const fps = 10;
  const duration = 100; // 100 seconds

  for (let i = 0; i < duration * fps; i++) {
    const timestamp = (i / fps) * 1000;
    const roundNumber = Math.floor(i / (fps * 100)) + 1;
    
    frames.push({
      timestamp,
      roundNumber,
      roundTime: (i % (fps * 100)) / fps,
      phase: i < fps * 30 ? 'buy' : i < fps * 80 ? 'combat' : 'postplant',
      agentFrames: MOCK_PLAYERS.map(player => ({
        playerId: player.id,
        position: {
          x: Math.sin(i * 0.1 + parseInt(player.id.slice(1))) * 2000 + (player.teamSide === 'attacker' ? -2000 : 2000),
          y: Math.cos(i * 0.15 + parseInt(player.id.slice(1))) * 1500 + (player.id === 'p1' ? 0 : Math.random() * 500),
        },
        rotation: (i * 5 + parseInt(player.id.slice(1)) * 36) % 360,
        health: player.isAlive ? Math.max(0, player.health - (i > fps * 50 ? Math.random() * 50 : 0)) : 0,
        armor: player.armor,
        isAlive: player.isAlive && (i < fps * 60 || parseInt(player.id.slice(1)) > 3),
        hasSpike: player.id === 'p1' && i < fps * 70,
        isPlanting: player.id === 'p1' && i > fps * 65 && i < fps * 70,
        isDefusing: false,
        isUsingAbility: false,
      })),
      abilitiesActive: i > fps * 40 && i < fps * 60 ? [
        {
          abilityId: 'smoke',
          agentName: 'Omen',
          position: { x: 0, y: 0 },
          radius: 400,
          duration: 15000,
          timeRemaining: Math.max(0, 15000 - (i - fps * 40) * 100),
          teamSide: 'defender',
        },
      ] : [],
      spikePosition: i > fps * 70 ? { x: 2000, y: -2000 } : undefined,
      spikeStatus: i > fps * 70 ? 'planted' : i > fps * 65 ? 'dropped' : 'carried',
      spikePlantTime: i > fps * 70 ? fps * 70 * 100 : undefined,
    });
  }

  return frames;
};

// Mock timeline
const MOCK_TIMELINE: MatchTimeline = {
  matchId: 'vct-2024-sen-vs-100t',
  mapName: 'Ascent',
  matchDuration: 100,
  frames: generateMockFrames(),
  roundResults: [
    {
      roundNumber: 1,
      winner: 'attacker',
      endMethod: 'elimination',
      startTimestamp: 0,
      endTimestamp: 80000,
      score: { attacker: 1, defender: 0 },
      mvp: 'p1',
    },
    {
      roundNumber: 2,
      winner: 'defender',
      endMethod: 'spike_defuse',
      startTimestamp: 90000,
      endTimestamp: 180000,
      score: { attacker: 1, defender: 1 },
      mvp: 'p7',
    },
  ],
  keyEvents: [
    {
      timestamp: 45000,
      type: 'kill',
      description: 'TenZ eliminated steel',
      playerId: 'p1',
      targetId: 'p10',
      position: { x: 0, y: 0 },
    },
    {
      timestamp: 52000,
      type: 'ability',
      description: 'Omen smoke deployed at Mid',
      playerId: 'p5',
      position: { x: 0, y: 0 },
    },
    {
      timestamp: 70000,
      type: 'spike_plant',
      description: 'Spike planted at A Site',
      playerId: 'p1',
      position: { x: 2000, y: -2000 },
    },
    {
      timestamp: 85000,
      type: 'round_end',
      description: 'Attackers win Round 1',
    },
  ],
};

export const TacticalViewDemo: React.FC = () => {
  const [selectedEvent, setSelectedEvent] = useState<KeyEvent | null>(null);
  const [currentFrame, setCurrentFrame] = useState<MatchFrame | null>(null);

  // WebSocket integration
  const [wsState, wsActions] = useTacticalWebSocket({
    matchId: MOCK_TIMELINE.matchId,
    onFrameUpdate: useCallback((frame: MatchFrame) => {
      console.log('Frame update received:', frame.timestamp);
    }, []),
    onEventReceived: useCallback((event: KeyEvent) => {
      console.log('Event received:', event.description);
      setSelectedEvent(event);
    }, []),
    onConnectionChange: useCallback((connected: boolean) => {
      console.log('WebSocket connected:', connected);
    }, []),
    autoConnect: false, // Demo uses mock data, don't connect
  });

  const handleFrameChange = useCallback((frame: MatchFrame) => {
    setCurrentFrame(frame);
  }, []);

  const handleEventSelect = useCallback((event: KeyEvent) => {
    setSelectedEvent(event);
  }, []);

  const handlePlayerSelect = useCallback((player: Player) => {
    console.log('Player selected:', player.name);
  }, []);

  return (
    <div className="tactical-view-demo">
      <h2>TacticalView Demo</h2>
      <p>
        Real-time VCT minimap visualization with Canvas rendering, 
        movement trails, and timeline scrubbing.
      </p>

      <div className="tactical-view-demo__status">
        <div className="tactical-view-demo__status-item">
          <strong>WebSocket:</strong>{' '}
          <span className={wsState.isConnected ? 'connected' : 'disconnected'}>
            {wsState.isConnected ? '🟢 Connected' : '🔴 Disconnected (Demo Mode)'}
          </span>
        </div>
        {currentFrame && (
          <div className="tactical-view-demo__status-item">
            <strong>Time:</strong>{' '}
            {(currentFrame.timestamp / 1000).toFixed(1)}s | 
            <strong> Round:</strong> {currentFrame.roundNumber} | 
            <strong> Phase:</strong> {currentFrame.phase}
          </div>
        )}
      </div>

      <div className="tactical-view-demo__container">
        <TacticalView
          matchId={MOCK_TIMELINE.matchId}
          timeline={MOCK_TIMELINE}
          mapData={MOCK_MAP_DATA}
          players={MOCK_PLAYERS}
          onFrameChange={handleFrameChange}
          onEventSelect={handleEventSelect}
          onPlayerSelect={handlePlayerSelect}
        />
      </div>

      {selectedEvent && (
        <div className="tactical-view-demo__event-panel">
          <h3>Last Selected Event</h3>
          <div className="tactical-view-demo__event-details">
            <span className="tactical-view-demo__event-type">{selectedEvent.type}</span>
            <span className="tactical-view-demo__event-desc">{selectedEvent.description}</span>
            <span className="tactical-view-demo__event-time">
              {(selectedEvent.timestamp / 1000).toFixed(1)}s
            </span>
          </div>
        </div>
      )}

      <style>{`
        .tactical-view-demo {
          max-width: 1200px;
          margin: 0 auto;
          padding: 24px;
        }

        .tactical-view-demo h2 {
          margin: 0 0 8px 0;
          color: #2d3436;
        }

        .tactical-view-demo p {
          margin: 0 0 16px 0;
          color: #636e72;
        }

        .tactical-view-demo__status {
          display: flex;
          gap: 24px;
          margin-bottom: 16px;
          padding: 12px 16px;
          background: #f8f9fa;
          border-radius: 8px;
          font-size: 14px;
        }

        .tactical-view-demo__status-item .connected {
          color: #00b894;
        }

        .tactical-view-demo__status-item .disconnected {
          color: #e17055;
        }

        .tactical-view-demo__container {
          background: #1a1a2e;
          border-radius: 12px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .tactical-view-demo__event-panel {
          margin-top: 16px;
          padding: 16px;
          background: #2d3436;
          border-radius: 8px;
          color: white;
        }

        .tactical-view-demo__event-panel h3 {
          margin: 0 0 12px 0;
          font-size: 16px;
        }

        .tactical-view-demo__event-details {
          display: flex;
          gap: 16px;
          align-items: center;
        }

        .tactical-view-demo__event-type {
          padding: 4px 12px;
          background: #0984e3;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .tactical-view-demo__event-desc {
          flex: 1;
        }

        .tactical-view-demo__event-time {
          font-family: 'JetBrains Mono', monospace;
          color: #b2bec3;
        }
      `}</style>
    </div>
  );
};

export default TacticalViewDemo;
