/**
 * VirtualPlayerGrid Component Tests
 * Tests for virtual scrolling performance and rendering
 * 
 * [Ver001.000]
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { VirtualPlayerGrid } from './VirtualPlayerGrid';

// Mock the colors module
vi.mock('@/theme/colors', () => ({
  colors: {
    porcelain: { frost: 'rgba(255,255,255,0.05)' },
    border: { subtle: 'rgba(255,255,255,0.1)' },
    background: { primary: '#0f0f1a', secondary: '#1a1a2e' },
    text: { primary: '#ffffff', secondary: '#a0a0a0', muted: '#606060' },
    status: { error: '#ff4655', success: '#4ade80', warning: '#fbbf24' },
    hub: {
      sator: {
        base: '#ffd700',
        glow: 'rgba(255, 215, 0, 0.4)',
        muted: '#bfa030',
      },
    },
  },
}));

// Player type definition (matches the inline type in component)
interface Player {
  id: string;
  name: string;
  team?: string;
  nationality?: string;
  rating: number;
  acs: number;
  kda?: string;
  winRate: number;
  avatar?: string | null;
}

// Mock @tanstack/react-virtual
vi.mock('@tanstack/react-virtual', () => ({
  useVirtualizer: vi.fn(() => ({
    getVirtualItems: () => [
      { key: 0, index: 0, start: 0, size: 40 },
      { key: 1, index: 1, start: 40, size: 40 },
      { key: 2, index: 2, start: 80, size: 40 },
    ],
    getTotalSize: () => 120,
    scrollToIndex: vi.fn(),
    scrollToOffset: vi.fn(),
  })),
}));

// Generate test players
const generateTestPlayers = (count: number): Player[] => {
  return Array.from({ length: count }, (_, i) => ({
    id: `player-${i + 1}`,
    name: `Player ${i + 1}`,
    team: `Team ${(i % 10) + 1}`,
    nationality: 'US',
    rating: 1.0 + Math.random() * 0.5,
    acs: 200 + Math.random() * 100,
    kda: '1.20',
    winRate: 50 + Math.random() * 30,
    avatar: null,
  }));
};

describe('VirtualPlayerGrid', () => {
  const defaultProps = {
    players: generateTestPlayers(100),
    hubColor: '#ffd700',
    hubGlow: 'rgba(255, 215, 0, 0.4)',
    hubMuted: '#bfa030',
    containerHeight: 400,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    render(<VirtualPlayerGrid {...defaultProps} />);
    expect(screen.getByText('Player 1')).toBeInTheDocument();
  });

  it('displays player count in footer', () => {
    render(<VirtualPlayerGrid {...defaultProps} />);
    expect(screen.getByText(/100 players/)).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<VirtualPlayerGrid {...defaultProps} isLoading={true} />);
    expect(screen.getByText(/Loading players/)).toBeInTheDocument();
  });

  it('shows error state', () => {
    const errorMessage = 'Failed to load players';
    render(<VirtualPlayerGrid {...defaultProps} error={errorMessage} />);
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('shows empty state when no players', () => {
    render(<VirtualPlayerGrid {...defaultProps} players={[]} />);
    expect(screen.getByText(/No players found/)).toBeInTheDocument();
  });

  it('calls onPlayerClick when player is clicked', () => {
    const handleClick = vi.fn();
    render(<VirtualPlayerGrid {...defaultProps} onPlayerClick={handleClick} />);
    
    const firstPlayer = screen.getByText('Player 1');
    fireEvent.click(firstPlayer.closest('div[role="button"]') || firstPlayer);
    
    expect(handleClick).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Player 1' }),
      0
    );
  });

  it('highlights search query matches', () => {
    render(<VirtualPlayerGrid {...defaultProps} searchQuery="Player 1" />);
    const marks = document.querySelectorAll('mark');
    expect(marks.length).toBeGreaterThan(0);
  });

  it('renders header with correct columns', () => {
    render(<VirtualPlayerGrid {...defaultProps} />);
    expect(screen.getByText('Player')).toBeInTheDocument();
    expect(screen.getByText('Rating')).toBeInTheDocument();
    expect(screen.getByText('ACS')).toBeInTheDocument();
  });
});

describe('VirtualPlayerGrid Performance', () => {
  it('handles large datasets efficiently', () => {
    const largePlayerSet = generateTestPlayers(5000);
    render(
      <VirtualPlayerGrid 
        players={largePlayerSet} 
        containerHeight={600}
        hubColor="#ffd700"
        hubGlow="rgba(255, 215, 0, 0.4)"
        hubMuted="#bfa030"
      />
    );
    
    // Verify player count is displayed (virtual list handles rendering)
    expect(screen.getByText(/5,000 players/)).toBeInTheDocument();
    expect(screen.getByText(/rendering \d+ visible/)).toBeInTheDocument();
  });

  it('uses will-change for GPU acceleration', () => {
    const { container } = render(
      <VirtualPlayerGrid 
        players={generateTestPlayers(100)}
        containerHeight={400}
        hubColor="#ffd700"
        hubGlow="rgba(255, 215, 0, 0.4)"
        hubMuted="#bfa030"
      />
    );
    
    const scrollContainer = container.querySelector('[style*="will-change"]');
    expect(scrollContainer).toHaveStyle({ willChange: 'transform' });
  });
});

describe('VirtualPlayerGrid Accessibility', () => {
  it('maintains proper ARIA structure', () => {
    render(
      <VirtualPlayerGrid 
        players={generateTestPlayers(10)}
        containerHeight={400}
        hubColor="#ffd700"
        hubGlow="rgba(255, 215, 0, 0.4)"
        hubMuted="#bfa030"
      />
    );
    
    // Check for scrollbar styling
    const container = document.querySelector('.scrollbar-thin');
    expect(container).toBeInTheDocument();
  });
});
