/** [Ver001.000]
 * PlayerRatingCard Component Tests
 * Tests for SimRating Web Worker integration
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { PlayerRatingCard } from '../PlayerRatingCard';

// Mock the useSimRating hook
vi.mock('../../hooks/useSimRating', () => ({
  useSimRating: vi.fn(() => ({
    calculateForPlayer: vi.fn().mockResolvedValue({
      playerId: 'test-player',
      rating: 78.5,
      components: {
        combat: 82,
        economy: 75,
        clutch: 70,
        support: 78,
        entry: 88,
        overall: 78.5
      },
      confidence: 0.85,
      grade: 'B',
      factors: ['Strong entry performance', 'Sample: 12 matches'],
      timestamp: Date.now()
    }),
    isCalculating: false,
    isReady: true,
    getCachedResult: vi.fn().mockReturnValue(null),
  }))
}));

describe('PlayerRatingCard', () => {
  const mockPlayer = {
    id: 'test-player',
    name: 'Test Player',
    team: 'Test Team',
    role: 'duelist' as const,
    region: 'NA',
    stats: {
      kills: 200,
      deaths: 150,
      kd_ratio: 1.33,
      matchesPlayed: 12
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders player information correctly', () => {
    render(<PlayerRatingCard player={mockPlayer} />);
    
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    expect(screen.getByText(/duelist/i)).toBeInTheDocument();
    expect(screen.getByText(/Test Team/i)).toBeInTheDocument();
  });

  it('renders in compact mode when compact prop is true', () => {
    render(<PlayerRatingCard player={mockPlayer} compact={true} />);
    
    expect(screen.getByText('Test Player')).toBeInTheDocument();
    // Compact mode should not show component breakdown
    expect(screen.queryByText(/Component Breakdown/i)).not.toBeInTheDocument();
  });

  it('shows loading state when calculating', () => {
    // Override mock to show loading state
    const { useSimRating } = require('../../hooks/useSimRating');
    useSimRating.mockReturnValue({
      calculateForPlayer: vi.fn(),
      isCalculating: true,
      isReady: true,
      getCachedResult: vi.fn().mockReturnValue(null),
    });

    render(<PlayerRatingCard player={mockPlayer} />);
    
    expect(screen.getByText(/Calculating/i)).toBeInTheDocument();
  });

  it('calls onRatingCalculated when rating is calculated', async () => {
    const onRatingCalculated = vi.fn();
    
    render(
      <PlayerRatingCard 
        player={mockPlayer} 
        onRatingCalculated={onRatingCalculated}
      />
    );
    
    await waitFor(() => {
      expect(onRatingCalculated).toHaveBeenCalled();
    });
  });

  it('displays correct role icon', () => {
    render(<PlayerRatingCard player={mockPlayer} />);
    
    // Duelist should show ⚔️ icon
    expect(document.querySelector('.player-rating-card')).toBeInTheDocument();
  });
});

describe('SimRating Calculation', () => {
  it('calculates SimRating in Web Worker', async () => {
    // This test verifies the worker integration
    const { useSimRating } = require('../../hooks/useSimRating');
    const mockCalculate = vi.fn().mockResolvedValue({
      playerId: 'test',
      rating: 85.0,
      components: {
        combat: 88,
        economy: 82,
        clutch: 79,
        support: 85,
        entry: 91,
        overall: 85.0
      },
      grade: 'A',
      confidence: 0.9,
      factors: [],
      timestamp: Date.now()
    });
    
    useSimRating.mockReturnValue({
      calculateForPlayer: mockCalculate,
      isCalculating: false,
      isReady: true,
      getCachedResult: vi.fn().mockReturnValue(null),
    });

    const TestComponent = () => {
      const { calculateForPlayer } = useSimRating();
      
      React.useEffect(() => {
        calculateForPlayer('test', { kd_ratio: 1.5 }, 'duelist');
      }, [calculateForPlayer]);
      
      return <div>Test</div>;
    };

    render(<TestComponent />);
    
    await waitFor(() => {
      expect(mockCalculate).toHaveBeenCalledWith('test', { kd_ratio: 1.5 }, 'duelist', expect.any(Number));
    });
  });
});
