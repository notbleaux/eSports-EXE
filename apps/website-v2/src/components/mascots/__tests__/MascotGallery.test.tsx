/**
 * MascotGallery Component Tests
 * =============================
 * Unit tests for MascotGallery component.
 * 
 * [Ver001.000]
 */

import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MascotGallery } from '../MascotGallery';
import { MOCK_MASCOTS } from '../mocks/mascots';
import type { MascotId } from '../types';

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

describe('MascotGallery', () => {
  const mascots = MOCK_MASCOTS;
  const favorites: MascotId[] = ['sol', 'lun'];

  beforeEach(() => {
    mockMatchMedia(false);
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  it('should render all mascots', () => {
    render(<MascotGallery mascots={mascots} />);
    
    mascots.forEach((mascot) => {
      expect(screen.getByText(mascot.displayName)).toBeInTheDocument();
    });
  });

  it('should render search input', () => {
    render(<MascotGallery mascots={mascots} />);
    expect(screen.getByPlaceholderText(/search mascots/i)).toBeInTheDocument();
  });

  it('should render filter buttons', () => {
    render(<MascotGallery mascots={mascots} />);
    
    expect(screen.getByLabelText(/grid view/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/list view/i)).toBeInTheDocument();
  });

  // ============================================================================
  // Loading State Tests
  // ============================================================================

  it('should show loading skeletons when loading', () => {
    render(<MascotGallery mascots={[]} loading />);
    
    // Should show skeleton elements
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  // ============================================================================
  // Empty State Tests
  // ============================================================================

  it('should show empty state when no mascots', () => {
    render(<MascotGallery mascots={[]} />);
    
    expect(screen.getByText(/no mascots found/i)).toBeInTheDocument();
  });

  it('should show custom empty state message', () => {
    const customMessage = 'Start your collection today!';
    render(<MascotGallery mascots={[]} emptyStateMessage={customMessage} />);
    
    expect(screen.getByText(customMessage)).toBeInTheDocument();
  });

  // ============================================================================
  // Search Tests
  // ============================================================================

  it('should filter mascots by search', () => {
    render(<MascotGallery mascots={mascots} />);
    
    const searchInput = screen.getByPlaceholderText(/search mascots/i);
    fireEvent.change(searchInput, { target: { value: 'Sol' } });
    
    expect(screen.getByText('Sol')).toBeInTheDocument();
    expect(screen.queryByText('Lun')).not.toBeInTheDocument();
  });

  it('should clear search when X clicked', () => {
    render(<MascotGallery mascots={mascots} />);
    
    const searchInput = screen.getByPlaceholderText(/search mascots/i);
    fireEvent.change(searchInput, { target: { value: 'Sol' } });
    
    const clearButton = screen.getByLabelText(/clear search/i);
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });

  // ============================================================================
  // Element Filter Tests
  // ============================================================================

  it('should filter by element', () => {
    render(<MascotGallery mascots={mascots} />);
    
    const solarFilter = screen.getByLabelText(/filter by solar/i);
    fireEvent.click(solarFilter);
    
    expect(screen.getByText('Sol')).toBeInTheDocument();
    expect(screen.queryByText('Lun')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Rarity Filter Tests
  // ============================================================================

  it('should filter by rarity', () => {
    render(<MascotGallery mascots={mascots} />);
    
    const legendaryFilter = screen.getByLabelText(/filter by legendary/i);
    fireEvent.click(legendaryFilter);
    
    const legendaryMascots = mascots.filter(m => m.rarity === 'legendary');
    legendaryMascots.forEach((mascot) => {
      expect(screen.getByText(mascot.displayName)).toBeInTheDocument();
    });
  });

  // ============================================================================
  // Sort Tests
  // ============================================================================

  it('should have sort dropdown', () => {
    render(<MascotGallery mascots={mascots} />);
    
    expect(screen.getByLabelText(/sort by/i)).toBeInTheDocument();
  });

  // ============================================================================
  // Interaction Tests
  // ============================================================================

  it('should call onMascotSelect when mascot clicked', () => {
    const handleSelect = vi.fn();
    render(<MascotGallery mascots={mascots} onMascotSelect={handleSelect} />);
    
    const solCard = screen.getByText('Sol').closest('article');
    fireEvent.click(solCard!);
    
    expect(handleSelect).toHaveBeenCalled();
  });

  it('should call onMascotFavorite when favorite toggled', () => {
    const handleFavorite = vi.fn();
    render(
      <MascotGallery 
        mascots={mascots} 
        favorites={favorites}
        onMascotFavorite={handleFavorite} 
      />
    );
    
    // Find and click favorite button
    const favoriteButtons = screen.getAllByLabelText(/add to favorites|remove from favorites/i);
    if (favoriteButtons.length > 0) {
      fireEvent.click(favoriteButtons[0]);
      expect(handleFavorite).toHaveBeenCalled();
    }
  });

  // ============================================================================
  // Clear Filters Tests
  // ============================================================================

  it('should show clear filters button when filters active', () => {
    render(<MascotGallery mascots={mascots} />);
    
    const searchInput = screen.getByPlaceholderText(/search mascots/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    expect(screen.getByText(/clear all filters/i)).toBeInTheDocument();
  });

  it('should clear all filters when clear button clicked', () => {
    render(<MascotGallery mascots={mascots} />);
    
    const searchInput = screen.getByPlaceholderText(/search mascots/i);
    fireEvent.change(searchInput, { target: { value: 'test' } });
    
    const clearButton = screen.getByText(/clear all filters/i);
    fireEvent.click(clearButton);
    
    expect(searchInput).toHaveValue('');
  });

  // ============================================================================
  // Result Count Tests
  // ============================================================================

  it('should show result count when filters active', () => {
    render(<MascotGallery mascots={mascots} />);
    
    const searchInput = screen.getByPlaceholderText(/search mascots/i);
    fireEvent.change(searchInput, { target: { value: 'Sol' } });
    
    expect(screen.getByText(/1 result/i)).toBeInTheDocument();
  });

  // ============================================================================
  // Favorites Display Tests
  // ============================================================================

  it('should show favorited mascots with filled hearts', () => {
    render(<MascotGallery mascots={mascots} favorites={favorites} />);
    
    // Check that favorites are marked
    const removeButtons = screen.getAllByLabelText(/remove from favorites/i);
    expect(removeButtons.length).toBeGreaterThan(0);
  });
});
