/** [Ver001.000]
 * useMascotFilter Hook
 * ====================
 * Custom hook for filtering and sorting mascot collections.
 * Provides search, element filtering, rarity filtering, and sorting.
 */

import { useState, useMemo, useCallback } from 'react';
import type {
  Mascot,
  MascotFilterState,
  MascotSortOption,
  MascotSortDirection,
  MascotElement,
  MascotRarity,
  MascotId,
} from '../types';
import { getTotalPower } from '../mocks/mascots';

// ============================================================================
// Rarity Priority Map for Sorting
// ============================================================================

const RARITY_PRIORITY: Record<MascotRarity, number> = {
  common: 1,
  rare: 2,
  epic: 3,
  legendary: 4,
};

// ============================================================================
// Hook Interface
// ============================================================================

export interface UseMascotFilterReturn {
  // Filter State
  filterState: MascotFilterState;
  setSearchQuery: (query: string) => void;
  toggleElement: (element: MascotElement) => void;
  toggleRarity: (rarity: MascotRarity) => void;
  setSortBy: (sortBy: MascotSortOption) => void;
  setSortDirection: (direction: MascotSortDirection) => void;
  toggleFavoritesOnly: () => void;
  resetFilters: () => void;
  
  // Filtered Results
  filteredMascots: Mascot[];
  hasActiveFilters: boolean;
  resultCount: number;
}

// ============================================================================
// Default Filter State
// ============================================================================

const DEFAULT_FILTER_STATE: MascotFilterState = {
  searchQuery: '',
  elements: [],
  rarities: [],
  sortBy: 'name',
  sortDirection: 'asc',
  favoritesOnly: false,
};

// ============================================================================
// Hook Implementation
// ============================================================================

export function useMascotFilter(
  mascots: Mascot[],
  favorites: MascotId[] = [],
  initialState?: Partial<MascotFilterState>
): UseMascotFilterReturn {
  // Initialize state with defaults and any provided initial state
  const [filterState, setFilterState] = useState<MascotFilterState>({
    ...DEFAULT_FILTER_STATE,
    ...initialState,
  });

  // ============================================================================
  // Action Handlers
  // ============================================================================

  const setSearchQuery = useCallback((query: string) => {
    setFilterState(prev => ({ ...prev, searchQuery: query }));
  }, []);

  const toggleElement = useCallback((element: MascotElement) => {
    setFilterState(prev => {
      const elements = prev.elements.includes(element)
        ? prev.elements.filter(e => e !== element)
        : [...prev.elements, element];
      return { ...prev, elements };
    });
  }, []);

  const toggleRarity = useCallback((rarity: MascotRarity) => {
    setFilterState(prev => {
      const rarities = prev.rarities.includes(rarity)
        ? prev.rarities.filter(r => r !== rarity)
        : [...prev.rarities, rarity];
      return { ...prev, rarities };
    });
  }, []);

  const setSortBy = useCallback((sortBy: MascotSortOption) => {
    setFilterState(prev => {
      // If clicking the same sort, toggle direction
      if (prev.sortBy === sortBy) {
        return {
          ...prev,
          sortDirection: prev.sortDirection === 'asc' ? 'desc' : 'asc',
        };
      }
      return { ...prev, sortBy, sortDirection: 'asc' };
    });
  }, []);

  const setSortDirection = useCallback((direction: MascotSortDirection) => {
    setFilterState(prev => ({ ...prev, sortDirection: direction }));
  }, []);

  const toggleFavoritesOnly = useCallback(() => {
    setFilterState(prev => ({ ...prev, favoritesOnly: !prev.favoritesOnly }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilterState(DEFAULT_FILTER_STATE);
  }, []);

  // ============================================================================
  // Filter Logic
  // ============================================================================

  const filteredMascots = useMemo(() => {
    let result = [...mascots];

    // Apply search filter
    if (filterState.searchQuery.trim()) {
      const query = filterState.searchQuery.toLowerCase().trim();
      result = result.filter(mascot =>
        mascot.displayName.toLowerCase().includes(query) ||
        mascot.lore.backstory.toLowerCase().includes(query) ||
        mascot.abilities.some(a => a.name.toLowerCase().includes(query))
      );
    }

    // Apply element filter
    if (filterState.elements.length > 0) {
      result = result.filter(mascot =>
        filterState.elements.includes(mascot.element)
      );
    }

    // Apply rarity filter
    if (filterState.rarities.length > 0) {
      result = result.filter(mascot =>
        filterState.rarities.includes(mascot.rarity)
      );
    }

    // Apply favorites filter
    if (filterState.favoritesOnly) {
      result = result.filter(mascot => favorites.includes(mascot.id));
    }

    // Apply sorting
    result.sort((a, b) => {
      let comparison = 0;

      switch (filterState.sortBy) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'rarity':
          comparison = RARITY_PRIORITY[a.rarity] - RARITY_PRIORITY[b.rarity];
          break;
        case 'power':
          comparison = getTotalPower(a) - getTotalPower(b);
          break;
        case 'element':
          comparison = a.element.localeCompare(b.element);
          break;
        case 'releaseDate':
          comparison = new Date(a.releaseDate).getTime() - new Date(b.releaseDate).getTime();
          break;
        default:
          comparison = 0;
      }

      return filterState.sortDirection === 'asc' ? comparison : -comparison;
    });

    return result;
  }, [mascots, favorites, filterState]);

  // ============================================================================
  // Derived State
  // ============================================================================

  const hasActiveFilters = useMemo(() => {
    return (
      filterState.searchQuery.trim() !== '' ||
      filterState.elements.length > 0 ||
      filterState.rarities.length > 0 ||
      filterState.favoritesOnly ||
      filterState.sortBy !== DEFAULT_FILTER_STATE.sortBy
    );
  }, [filterState]);

  const resultCount = filteredMascots.length;

  // ============================================================================
  // Return
  // ============================================================================

  return {
    filterState,
    setSearchQuery,
    toggleElement,
    toggleRarity,
    setSortBy,
    setSortDirection,
    toggleFavoritesOnly,
    resetFilters,
    filteredMascots,
    hasActiveFilters,
    resultCount,
  };
}

export default useMascotFilter;
