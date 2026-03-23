/**
 * useMascotFilter Hook Tests
 * ==========================
 * Unit tests for the useMascotFilter custom hook.
 * 
 * [Ver001.000]
 */

import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMascotFilter } from '../hooks/useMascotFilter';
import { MOCK_MASCOTS } from '../mocks/mascots';
import type { MascotId } from '../types';

describe('useMascotFilter', () => {
  const mascots = MOCK_MASCOTS;
  const favorites: MascotId[] = ['sol', 'lun'];

  beforeEach(() => {});

  // ============================================================================
  // Initial State Tests
  // ============================================================================

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    expect(result.current.filterState.searchQuery).toBe('');
    expect(result.current.filterState.elements).toEqual([]);
    expect(result.current.filterState.rarities).toEqual([]);
    expect(result.current.filterState.sortBy).toBe('name');
    expect(result.current.filterState.sortDirection).toBe('asc');
    expect(result.current.filterState.favoritesOnly).toBe(false);
  });

  it('should initialize with provided initial state', () => {
    const { result } = renderHook(() =>
      useMascotFilter(mascots, [], { sortBy: 'rarity', sortDirection: 'desc' })
    );

    expect(result.current.filterState.sortBy).toBe('rarity');
    expect(result.current.filterState.sortDirection).toBe('desc');
  });

  it('should return all mascots by default', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));
    expect(result.current.filteredMascots).toHaveLength(mascots.length);
  });

  // ============================================================================
  // Search Tests
  // ============================================================================

  it('should filter by search query', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.setSearchQuery('Sol');
    });

    expect(result.current.filteredMascots).toHaveLength(1);
    expect(result.current.filteredMascots[0].displayName).toBe('Sol');
  });

  it('should filter case-insensitively', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.setSearchQuery('sol');
    });

    expect(result.current.filteredMascots).toHaveLength(1);
    expect(result.current.filteredMascots[0].displayName).toBe('Sol');
  });

  it('should search in backstory', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.setSearchQuery('phoenix');
    });

    expect(result.current.filteredMascots.length).toBeGreaterThan(0);
  });

  it('should clear search', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.setSearchQuery('Sol');
    });

    act(() => {
      result.current.setSearchQuery('');
    });

    expect(result.current.filteredMascots).toHaveLength(mascots.length);
  });

  // ============================================================================
  // Element Filter Tests
  // ============================================================================

  it('should filter by element', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.toggleElement('solar');
    });

    expect(result.current.filteredMascots.every(m => m.element === 'solar')).toBe(true);
  });

  it('should filter by multiple elements', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.toggleElement('solar');
      result.current.toggleElement('lunar');
    });

    expect(result.current.filteredMascots.every(m => 
      m.element === 'solar' || m.element === 'lunar'
    )).toBe(true);
  });

  it('should toggle element off when already active', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.toggleElement('solar');
    });

    act(() => {
      result.current.toggleElement('solar');
    });

    expect(result.current.filterState.elements).not.toContain('solar');
  });

  // ============================================================================
  // Rarity Filter Tests
  // ============================================================================

  it('should filter by rarity', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.toggleRarity('legendary');
    });

    expect(result.current.filteredMascots.every(m => m.rarity === 'legendary')).toBe(true);
  });

  it('should filter by multiple rarities', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.toggleRarity('epic');
      result.current.toggleRarity('legendary');
    });

    expect(result.current.filteredMascots.every(m => 
      m.rarity === 'epic' || m.rarity === 'legendary'
    )).toBe(true);
  });

  // ============================================================================
  // Sort Tests
  // ============================================================================

  it('should sort by name ascending', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    const names = result.current.filteredMascots.map(m => m.displayName);
    const sortedNames = [...names].sort((a, b) => a.localeCompare(b));

    expect(names).toEqual(sortedNames);
  });

  it('should sort by name descending', () => {
    const { result } = renderHook(() => useMascotFilter(mascots, [], { 
      sortBy: 'name', 
      sortDirection: 'desc' 
    }));

    act(() => {
      result.current.setSortBy('name');
    });

    // Click again to toggle direction
    act(() => {
      result.current.setSortBy('name');
    });

    const names = result.current.filteredMascots.map(m => m.displayName);
    const sortedNames = [...names].sort((a, b) => b.localeCompare(a));

    expect(names).toEqual(sortedNames);
  });

  it('should sort by rarity', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.setSortBy('rarity');
    });

    const rarities = result.current.filteredMascots.map(m => m.rarity);
    const rarityOrder = { common: 1, rare: 2, epic: 3, legendary: 4 };

    for (let i = 1; i < rarities.length; i++) {
      expect(rarityOrder[rarities[i]]).toBeGreaterThanOrEqual(rarityOrder[rarities[i - 1]]);
    }
  });

  it('should sort by power', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.setSortBy('power');
    });

    // Check that power values are sorted
    const powers = result.current.filteredMascots.map(m => 
      (m.stats.agility + m.stats.power + m.stats.wisdom + m.stats.defense + m.stats.speed + m.stats.luck) / 6
    );

    for (let i = 1; i < powers.length; i++) {
      expect(powers[i]).toBeGreaterThanOrEqual(powers[i - 1]);
    }
  });

  it('should allow setting sort direction explicitly', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.setSortDirection('desc');
    });

    expect(result.current.filterState.sortDirection).toBe('desc');
  });

  // ============================================================================
  // Favorites Filter Tests
  // ============================================================================

  it('should filter to favorites only', () => {
    const { result } = renderHook(() => useMascotFilter(mascots, favorites));

    act(() => {
      result.current.toggleFavoritesOnly();
    });

    expect(result.current.filteredMascots).toHaveLength(2);
    expect(result.current.filteredMascots.every(m => favorites.includes(m.id))).toBe(true);
  });

  it('should toggle favorites only off', () => {
    const { result } = renderHook(() => useMascotFilter(mascots, favorites));

    act(() => {
      result.current.toggleFavoritesOnly();
    });

    act(() => {
      result.current.toggleFavoritesOnly();
    });

    expect(result.current.filterState.favoritesOnly).toBe(false);
    expect(result.current.filteredMascots).toHaveLength(mascots.length);
  });

  // ============================================================================
  // Combined Filter Tests
  // ============================================================================

  it('should apply multiple filters together', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.setSearchQuery('S');
      result.current.toggleElement('solar');
      result.current.toggleRarity('legendary');
    });

    expect(result.current.filteredMascots.every(m => 
      m.displayName.includes('S') &&
      m.element === 'solar' &&
      m.rarity === 'legendary'
    )).toBe(true);
  });

  // ============================================================================
  // Derived State Tests
  // ============================================================================

  it('should track active filters', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    expect(result.current.hasActiveFilters).toBe(false);

    act(() => {
      result.current.setSearchQuery('test');
    });

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('should count results', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    expect(result.current.resultCount).toBe(mascots.length);

    act(() => {
      result.current.setSearchQuery('Sol');
    });

    expect(result.current.resultCount).toBe(1);
  });

  // ============================================================================
  // Reset Tests
  // ============================================================================

  it('should reset all filters', () => {
    const { result } = renderHook(() => useMascotFilter(mascots));

    act(() => {
      result.current.setSearchQuery('test');
      result.current.toggleElement('solar');
      result.current.toggleRarity('legendary');
      result.current.toggleFavoritesOnly();
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filterState.searchQuery).toBe('');
    expect(result.current.filterState.elements).toEqual([]);
    expect(result.current.filterState.rarities).toEqual([]);
    expect(result.current.filterState.favoritesOnly).toBe(false);
    expect(result.current.hasActiveFilters).toBe(false);
  });
});
