/**
 * MascotCard Component Tests
 * ==========================
 * Unit tests for MascotCard component with accessibility checks.
 * 
 * [Ver001.000]
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MascotCard } from '../MascotCard';
import { MOCK_MASCOTS } from '../mocks/mascots';
import type { Mascot } from '../types';

// Mock matchMedia for reduced motion
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
};

describe('MascotCard', () => {
  const mockMascot: Mascot = MOCK_MASCOTS[0]; // Sol

  beforeEach(() => {
    mockMatchMedia(false);
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  it('should render mascot name', () => {
    render(<MascotCard mascot={mockMascot} />);
    expect(screen.getByText('Sol')).toBeInTheDocument();
  });

  it('should render rarity label', () => {
    render(<MascotCard mascot={mockMascot} />);
    expect(screen.getByText('Legendary')).toBeInTheDocument();
  });

  it('should render element badge', () => {
    render(<MascotCard mascot={mockMascot} />);
    expect(screen.getByText('Solar')).toBeInTheDocument();
  });

  it('should render total power', () => {
    render(<MascotCard mascot={mockMascot} />);
    expect(screen.getByText('Power')).toBeInTheDocument();
  });

  // ============================================================================
  // Props Tests
  // ============================================================================

  it('should apply custom className', () => {
    const { container } = render(
      <MascotCard mascot={mockMascot} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should show selected state', () => {
    render(<MascotCard mascot={mockMascot} isSelected />);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Sol'));
  });

  it('should show locked state', () => {
    render(<MascotCard mascot={mockMascot} isLocked />);
    const lockIcon = screen.getByLabelText(/locked/i);
    expect(lockIcon).toBeInTheDocument();
  });

  it('should not be clickable when locked', () => {
    const handleClick = vi.fn();
    render(<MascotCard mascot={mockMascot} isLocked onClick={handleClick} />);
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  // ============================================================================
  // Interaction Tests
  // ============================================================================

  it('should call onClick when clicked', () => {
    const handleClick = vi.fn();
    render(<MascotCard mascot={mockMascot} onClick={handleClick} />);
    
    const card = screen.getByRole('button');
    fireEvent.click(card);
    
    expect(handleClick).toHaveBeenCalledWith(mockMascot);
  });

  it('should call onFavoriteToggle when favorite button clicked', () => {
    const handleFavorite = vi.fn();
    render(<MascotCard mascot={mockMascot} onFavoriteToggle={handleFavorite} />);
    
    const favoriteButton = screen.getByLabelText(/add to favorites/i);
    fireEvent.click(favoriteButton);
    
    expect(handleFavorite).toHaveBeenCalledWith(mockMascot);
  });

  it('should not trigger onClick when favorite button clicked', () => {
    const handleClick = vi.fn();
    const handleFavorite = vi.fn();
    render(
      <MascotCard 
        mascot={mockMascot} 
        onClick={handleClick}
        onFavoriteToggle={handleFavorite}
      />
    );
    
    const favoriteButton = screen.getByLabelText(/add to favorites/i);
    fireEvent.click(favoriteButton);
    
    expect(handleClick).not.toHaveBeenCalled();
    expect(handleFavorite).toHaveBeenCalled();
  });

  // ============================================================================
  // Accessibility Tests
  // ============================================================================

  it('should have correct ARIA label', () => {
    render(<MascotCard mascot={mockMascot} />);
    const card = screen.getByRole('button');
    
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Sol'));
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Legendary'));
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('solar'));
  });

  it('should be keyboard accessible', () => {
    const handleClick = vi.fn();
    render(<MascotCard mascot={mockMascot} onClick={handleClick} />);
    
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: 'Enter' });
    
    expect(handleClick).toHaveBeenCalled();
  });

  it('should respond to space key', () => {
    const handleClick = vi.fn();
    render(<MascotCard mascot={mockMascot} onClick={handleClick} />);
    
    const card = screen.getByRole('button');
    fireEvent.keyDown(card, { key: ' ' });
    
    expect(handleClick).toHaveBeenCalled();
  });

  it('should have correct tab index when not locked', () => {
    render(<MascotCard mascot={mockMascot} />);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '0');
  });

  it('should have negative tab index when locked', () => {
    render(<MascotCard mascot={mockMascot} isLocked />);
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('tabIndex', '-1');
  });

  // ============================================================================
  // Size Tests
  // ============================================================================

  it('should render small size', () => {
    const { container } = render(<MascotCard mascot={mockMascot} size="sm" />);
    expect(container.querySelector('.w-40')).toBeInTheDocument();
  });

  it('should render medium size', () => {
    const { container } = render(<MascotCard mascot={mockMascot} size="md" />);
    expect(container.querySelector('.w-56')).toBeInTheDocument();
  });

  it('should render large size', () => {
    const { container } = render(<MascotCard mascot={mockMascot} size="lg" />);
    expect(container.querySelector('.w-72')).toBeInTheDocument();
  });

  // ============================================================================
  // Stats Display Tests
  // ============================================================================

  it('should hide stats when showStats is false', () => {
    render(<MascotCard mascot={mockMascot} showStats={false} />);
    expect(screen.queryByText('Power')).not.toBeInTheDocument();
  });

  it('should hide rarity badge when showRarity is false', () => {
    render(<MascotCard mascot={mockMascot} showRarity={false} />);
    // Stars should not be visible
    const stars = screen.queryAllByRole('img', { hidden: true });
    expect(stars.length).toBeLessThan(5);
  });

  // ============================================================================
  // Favorite State Tests
  // ============================================================================

  it('should show filled heart when favorited', () => {
    render(<MascotCard mascot={mockMascot} isFavorite onFavoriteToggle={vi.fn()} />);
    const favoriteButton = screen.getByLabelText(/remove from favorites/i);
    expect(favoriteButton).toHaveAttribute('aria-pressed', 'true');
  });

  it('should show empty heart when not favorited', () => {
    render(<MascotCard mascot={mockMascot} isFavorite={false} onFavoriteToggle={vi.fn()} />);
    const favoriteButton = screen.getByLabelText(/add to favorites/i);
    expect(favoriteButton).toHaveAttribute('aria-pressed', 'false');
  });

  // ============================================================================
  // All Mascot Types Test
  // ============================================================================

  it('should render all mascot types', () => {
    MOCK_MASCOTS.forEach((mascot) => {
      const { unmount } = render(<MascotCard mascot={mascot} />);
      expect(screen.getByText(mascot.displayName)).toBeInTheDocument();
      unmount();
    });
  });
});
