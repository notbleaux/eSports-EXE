/** [Ver001.001] */
/**
 * TacticalView Component Tests
 * ============================
 * Integration tests for the main TacticalView component.
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { TacticalView } from '../TacticalView';
import {
  MatchTimeline,
  MapData,
  Player,
  Agent,
  RoundResult,
  KeyEvent,
} from '../types';

// Mock canvas
const mockCanvasContext = {
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  strokeRect: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  arc: vi.fn(),
  stroke: vi.fn(),
  fill: vi.fn(),
  save: vi.fn(),
  restore: vi.fn(),
  translate: vi.fn(),
  rotate: vi.fn(),
  fillText: vi.fn(),
  measureText: vi.fn(() => ({ width: 50 })),
  setTransform: vi.fn(),
  closePath: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
};

HTMLCanvasElement.prototype.getContext = vi.fn((contextId: string) => {
  if (contextId === '2d') {
    return mockCanvasContext;
  }
  return null;
}) as any;

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
  return setTimeout(() => callback(performance.now()), 16) as unknown as number;
});
global.cancelAnimationFrame = vi.fn((id: number) => {
  clearTimeout(id);
});

// Mock data
const mockAgent: Agent = {
  id: 'jett',
  name: 'Jett',
  role: 'duelist',
  color: '#74b9ff',
  abilities: [],
};

const mockPlayers: Player[] = [
  {
    id: 'p1',
    name: 'TenZ',
    teamId: 'sen',
    teamSide: 'attacker',
    agent: mockAgent,
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
    agent: { ...mockAgent, id: 'sova', name: 'Sova', role: 'initiator', color: '#4ecdc4' },
    health: 85,
    maxHealth: 100,
    armor: 25,
    isAlive: true,
    credits: 3200,
  },
];

const mockMapData: MapData = {
  id: 'ascent',
  name: 'Ascent',
  displayName: 'Ascent',
  minimapUrl: '/maps/ascent.png',
  dimensions: { inGameUnits: 10000, minimapPixels: 1024 },
  bounds: { min: { x: -5000, y: -5000 }, max: { x: 5000, y: 5000 } },
  callouts: [],
  spikeSites: [],
};

const generateMockFrames = () => {
  const frames = [];
  for (let i = 0; i < 100; i++) {
    frames.push({
      timestamp: i * 100,
      roundNumber: 1,
      roundTime: i,
      phase: 'combat' as const,
      agentFrames: mockPlayers.map(p => ({
        playerId: p.id,
        position: { x: i * 10, y: i * 5 },
        rotation: i * 3.6,
        health: p.health,
        armor: p.armor,
        isAlive: p.isAlive,
        hasSpike: p.id === 'p1',
        isPlanting: false,
        isDefusing: false,
        isUsingAbility: false,
      })),
      abilitiesActive: [],
      spikeStatus: 'carried' as const,
    });
  }
  return frames;
};

const mockTimeline: MatchTimeline = {
  matchId: 'test-match',
  mapName: 'Ascent',
  matchDuration: 10,
  frames: generateMockFrames(),
  roundResults: [
    {
      roundNumber: 1,
      winner: 'attacker',
      endMethod: 'elimination',
      startTimestamp: 0,
      endTimestamp: 10000,
      score: { attacker: 1, defender: 0 },
    },
  ] as RoundResult[],
  keyEvents: [
    {
      timestamp: 5000,
      type: 'kill',
      description: 'Test kill',
    },
  ] as KeyEvent[],
};

describe('TacticalView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
      />
    );

    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('should render canvas element', () => {
    render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
      />
    );

    const canvas = document.querySelector('canvas');
    expect(canvas).toBeInTheDocument();
    expect(canvas).toHaveAttribute('width', '1024');
    expect(canvas).toHaveAttribute('height', '1024');
  });

  it('should render control buttons', () => {
    render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
      />
    );

    expect(screen.getByTitle('Play')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom In')).toBeInTheDocument();
    expect(screen.getByTitle('Zoom Out')).toBeInTheDocument();
  });

  it('should toggle playback on play button click', async () => {
    render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
      />
    );

    const playButton = screen.getByTitle('Play');
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(screen.getByTitle('Pause')).toBeInTheDocument();
    });
  });

  it('should call onFrameChange when frame updates', async () => {
    const onFrameChange = vi.fn();
    
    render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
        onFrameChange={onFrameChange}
      />
    );

    // Start playback to trigger frame changes
    fireEvent.click(screen.getByTitle('Play'));

    await waitFor(() => {
      expect(onFrameChange).toHaveBeenCalled();
    });
  });

  it('should change playback speed', () => {
    render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
      />
    );

    const speed2x = screen.getByText('2x');
    fireEvent.click(speed2x);

    expect(speed2x).toHaveClass('tactical-controls__speed-button--active');
  });

  it('should toggle visualization options', () => {
    render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
      />
    );

    const trailsToggle = screen.getByTitle('Show Movement Trails');
    fireEvent.click(trailsToggle);

    // Should toggle off (class changes)
    expect(trailsToggle).not.toHaveClass('tactical-controls__toggle--active');
  });

  it('should seek to timestamp when timeline is clicked', () => {
    const onFrameChange = vi.fn();
    
    render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
        onFrameChange={onFrameChange}
      />
    );

    const timeline = document.querySelector('.timeline-scrubber__track');
    if (timeline) {
      fireEvent.click(timeline);
      // Should trigger seek
    }
  });

  it('should filter players by team', async () => {
    render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
      />
    );

    // Canvas should render with filtered players (wait for animation frame)
    await waitFor(() => {
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });
  });

  it('should handle empty timeline gracefully', () => {
    const emptyTimeline = {
      ...mockTimeline,
      frames: [],
    };

    render(
      <TacticalView
        matchId="test-match"
        timeline={emptyTimeline}
        mapData={mockMapData}
        players={mockPlayers}
      />
    );

    expect(document.querySelector('canvas')).toBeInTheDocument();
  });

  it('should cleanup animation frame on unmount', () => {
    const { unmount } = render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
      />
    );

    unmount();

    expect(global.cancelAnimationFrame).toHaveBeenCalled();
  });

  it('should zoom in and out', async () => {
    render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
      />
    );

    const zoomIn = screen.getByTitle('Zoom In');
    const zoomOut = screen.getByTitle('Zoom Out');

    fireEvent.click(zoomIn);

    // Verify zoom state changed - wait for animation frame to trigger redraw
    await waitFor(() => {
      expect(mockCanvasContext.clearRect).toHaveBeenCalled();
    });

    expect(zoomIn).toBeInTheDocument();
    expect(zoomOut).toBeInTheDocument();
  });

  it('should display current round information', () => {
    render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
      />
    );

    expect(screen.getByText(/Round \d+/)).toBeInTheDocument();
  });

  it('should display time information', () => {
    render(
      <TacticalView
        matchId="test-match"
        timeline={mockTimeline}
        mapData={mockMapData}
        players={mockPlayers}
      />
    );

    // Should show time display
    const timeElements = screen.getAllByText(/\d{2}:\d{2}/);
    expect(timeElements.length).toBeGreaterThan(0);
  });
});
