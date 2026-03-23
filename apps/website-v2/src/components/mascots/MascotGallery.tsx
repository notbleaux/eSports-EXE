/** [Ver001.000]
 * MascotGallery Component
 * =======================
 * Grid layout with responsive breakpoints for displaying mascot cards.
 * 
 * Features:
 * - Responsive grid (1-4 columns based on screen size)
 * - Filtering by element (solar, lunar, binary, fire, magic)
 * - Search functionality
 * - Sort options (name, rarity, power)
 * - Virtual scrolling for large collections
 * - View mode toggle (grid/list)
 * - Empty state handling
 * - Loading skeletons
 */

import React, { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search,
  Filter,
  Grid3X3,
  List,
  ArrowUpDown,
  Star,
  X,
  Heart,
} from 'lucide-react';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';
import type { MascotGalleryProps, GalleryConfig, MascotElement, MascotRarity } from './types';
import { MascotCard } from './MascotCard';
import { useMascotFilter } from './hooks/useMascotFilter';
import { ELEMENT_CONFIG, RARITY_CONFIG } from './mocks/mascots';

// ============================================================================
// Default Configuration
// ============================================================================

const DEFAULT_CONFIG: GalleryConfig = {
  viewMode: 'grid',
  cardSize: 'md',
  columns: {
    sm: 1,
    md: 2,
    lg: 3,
    xl: 4,
  },
  showDetails: true,
  animateEntrance: true,
};

// ============================================================================
// Component
// ============================================================================

export const MascotGallery: React.FC<MascotGalleryProps> = ({
  mascots,
  favorites = [],
  config: userConfig,
  filter: initialFilter,
  onMascotSelect,
  onMascotFavorite,
  className = '',
  loading = false,
  emptyStateMessage = 'No mascots found matching your criteria.',
}) => {
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...userConfig }), [userConfig]);
  const { prefersReducedMotion } = useReducedMotion();

  // Filter hook
  const {
    filterState,
    setSearchQuery,
    toggleElement,
    toggleRarity,
    setSortBy,
    resetFilters,
    filteredMascots,
    hasActiveFilters,
    resultCount,
  } = useMascotFilter(mascots, favorites, initialFilter);

  // ============================================================================
  // Virtual Scrolling Setup
  // ============================================================================

  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: filteredMascots.length,
    getScrollElement: () => parentRef.current,
    estimateSize: useCallback(() => {
      // Estimated row height based on card size
      const heights = { sm: 220, md: 280, lg: 340 };
      return heights[config.cardSize];
    }, [config.cardSize]),
    overscan: 5,
  });

  // ============================================================================
  // Grid Column Classes
  // ============================================================================

  const gridClasses = useMemo(() => {
    if (config.viewMode === 'list') return 'grid-cols-1';
    return `
      grid-cols-${config.columns.sm}
      sm:grid-cols-${config.columns.sm}
      md:grid-cols-${config.columns.md}
      lg:grid-cols-${config.columns.lg}
      xl:grid-cols-${config.columns.xl}
    `;
  }, [config.viewMode, config.columns]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleMascotClick = useCallback((mascot: typeof mascots[0]) => {
    onMascotSelect?.(mascot);
  }, [onMascotSelect]);

  const handleMascotFavorite = useCallback((mascot: typeof mascots[0]) => {
    onMascotFavorite?.(mascot);
  }, [onMascotFavorite]);

  // ============================================================================
  // Filter UI Helpers
  // ============================================================================

  const elements: MascotElement[] = ['solar', 'lunar', 'binary', 'fire', 'magic'];
  const rarities: MascotRarity[] = ['common', 'rare', 'epic', 'legendary'];

  // ============================================================================
  // Render
  // ============================================================================

  if (loading) {
    return (
      <div className={`space-y-6 ${className}`}>
        {/* Loading Skeleton */}
        <div className="animate-pulse space-y-4">
          <div className="h-12 bg-gray-200 rounded-lg" />
          <div className="flex gap-2">
            <div className="h-8 w-24 bg-gray-200 rounded-full" />
            <div className="h-8 w-24 bg-gray-200 rounded-full" />
            <div className="h-8 w-24 bg-gray-200 rounded-full" />
          </div>
          <div className={`grid ${gridClasses} gap-6`}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 bg-gray-200 rounded-2xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Search & Filter Bar */}
      <div className="bg-surface rounded-2xl p-4 shadow-sm border border-border space-y-4">
        {/* Search Row */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search mascots..."
              value={filterState.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500 transition-all"
              aria-label="Search mascots"
            />
            {filterState.searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded-full transition-colors"
                aria-label="Clear search"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              className={`p-2.5 rounded-xl transition-colors ${
                config.viewMode === 'grid' ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              aria-label="Grid view"
              aria-pressed={config.viewMode === 'grid'}
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              className={`p-2.5 rounded-xl transition-colors ${
                config.viewMode === 'list' ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              aria-label="List view"
              aria-pressed={config.viewMode === 'list'}
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Element Filters */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Elements:</span>
            {elements.map((element) => {
              const elementConfig = ELEMENT_CONFIG[element];
              const isActive = filterState.elements.includes(element);
              return (
                <button
                  key={element}
                  onClick={() => toggleElement(element)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all
                    ${isActive 
                      ? 'text-white shadow-sm' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                  style={{ backgroundColor: isActive ? elementConfig.color : undefined }}
                  aria-pressed={isActive}
                  aria-label={`Filter by ${elementConfig.label}`}
                >
                  {elementConfig.label}
                </button>
              );
            })}
          </div>

          {/* Rarity Filters */}
          <div className="flex items-center gap-2">
            <Star className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Rarity:</span>
            {rarities.map((rarity) => {
              const rarityConfig = RARITY_CONFIG[rarity];
              const isActive = filterState.rarities.includes(rarity);
              return (
                <button
                  key={rarity}
                  onClick={() => toggleRarity(rarity)}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all border
                    ${isActive 
                      ? 'border-current' 
                      : 'border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }
                  `}
                  style={{ color: isActive ? rarityConfig.color : undefined }}
                  aria-pressed={isActive}
                  aria-label={`Filter by ${rarityConfig.label}`}
                >
                  {rarityConfig.label}
                </button>
              );
            })}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={`${filterState.sortBy}-${filterState.sortDirection}`}
              onChange={(e) => {
                const [sortBy, direction] = e.target.value.split('-') as [typeof filterState.sortBy, typeof filterState.sortDirection];
                setSortBy(sortBy);
              }}
              className="px-3 py-1.5 bg-gray-50 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              aria-label="Sort by"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="rarity-desc">Rarity (High-Low)</option>
              <option value="rarity-asc">Rarity (Low-High)</option>
              <option value="power-desc">Power (High-Low)</option>
              <option value="power-asc">Power (Low-High)</option>
            </select>
          </div>
        </div>

        {/* Active Filters & Clear */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2 pt-2 border-t border-border">
            <span className="text-sm text-gray-500">
              {resultCount} result{resultCount !== 1 ? 's' : ''}
            </span>
            <button
              onClick={resetFilters}
              className="ml-auto text-sm text-cyan-600 hover:text-cyan-700 font-medium"
            >
              Clear all filters
            </button>
          </div>
        )}
      </div>

      {/* Mascot Grid */}
      {filteredMascots.length > 0 ? (
        <div
          ref={parentRef}
          className={`grid ${gridClasses} gap-6`}
          style={{ minHeight: '400px' }}
        >
          <AnimatePresence mode="popLayout">
            {filteredMascots.map((mascot, index) => (
              <motion.div
                key={mascot.id}
                layout={!prefersReducedMotion}
                initial={config.animateEntrance ? { opacity: 0, scale: 0.9 } : false}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  duration: prefersReducedMotion ? 0 : 0.2,
                  delay: config.animateEntrance ? index * 0.05 : 0,
                }}
              >
                <MascotCard
                  mascot={mascot}
                  size={config.cardSize}
                  isFavorite={favorites.includes(mascot.id)}
                  onClick={handleMascotClick}
                  onFavoriteToggle={handleMascotFavorite}
                  animated={config.animateEntrance}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-charcoal mb-2">No Mascots Found</h3>
          <p className="text-gray-500 max-w-sm">{emptyStateMessage}</p>
          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="mt-4 px-4 py-2 bg-cyan-500 text-white rounded-lg font-medium hover:bg-cyan-600 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default MascotGallery;
