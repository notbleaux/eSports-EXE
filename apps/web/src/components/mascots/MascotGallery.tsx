/** [Ver003.000]
 * MascotGallery Component
 * =======================
 * Grid layout with responsive breakpoints for displaying mascot cards.
 * Includes 6 mascots: Fox, Owl, Wolf, Hawk, Dropout Bear, NJ Bunny.
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
 * - Format toggle (SVG/CSS/PNG)
 * - Size comparison view
 * - Animation showcase
 * 
 * Uses MascotAssetEnhanced for all mascot rendering (INT-004)
 */

import React, { useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Search,
  Filter,
  Grid3X3,
  ArrowUpDown,
  Star,
  X,
  Heart,
  Image,
  MonitorPlay,
  Layers,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';
import type { MascotGalleryProps, GalleryConfig, MascotElement, MascotRarity } from './types';
import { MascotCard } from './MascotCard';
import { useMascotFilter } from './hooks/useMascotFilter';
import { ELEMENT_CONFIG, RARITY_CONFIG } from './mocks/mascots';
import { MascotAsset as MascotAssetEnhanced, AssetFormat, MascotType } from './MascotAssetEnhanced';

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
// View Mode Types
// ============================================================================

type GalleryView = 'gallery' | 'size-comparison' | 'animation-showcase';

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

  // View mode state
  const [view, setView] = useState<GalleryView>('gallery');
  
  // Format toggle state
  const [selectedFormat, setSelectedFormat] = useState<AssetFormat>('auto');
  
  // Animation showcase state
  const [showcaseAnimation, setShowcaseAnimation] = useState<'idle' | 'wave' | 'celebrate'>('idle');
  const [showcaseSize, setShowcaseSize] = useState<32 | 64 | 128 | 256>(128);

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
  const formats: { value: AssetFormat; label: string; icon: React.ReactNode }[] = [
    { value: 'auto', label: 'Auto', icon: <Sparkles className="w-4 h-4" /> },
    { value: 'svg', label: 'SVG', icon: <Image className="w-4 h-4" /> },
    { value: 'png', label: 'PNG', icon: <Layers className="w-4 h-4" /> },
    { value: 'css', label: 'CSS', icon: <MonitorPlay className="w-4 h-4" /> },
  ];
  const sizes: { value: 32 | 64 | 128 | 256; label: string }[] = [
    { value: 32, label: '32px' },
    { value: 64, label: '64px' },
    { value: 128, label: '128px' },
    { value: 256, label: '256px' },
  ];
  const animations: { value: 'idle' | 'wave' | 'celebrate'; label: string }[] = [
    { value: 'idle', label: 'Idle' },
    { value: 'wave', label: 'Wave' },
    { value: 'celebrate', label: 'Celebrate' },
  ];
  
  // Variant selectors for new mascots with multiple styles (reserved for future use)
  const _bearVariants: { value: string; label: string }[] = [
    { value: 'homecoming', label: 'Homecoming' },
    { value: 'graduation', label: 'Graduation' },
    { value: 'late-registration', label: 'Late Registration' },
    { value: 'yeezus', label: 'Yeezus' },
    { value: 'donda', label: 'Donda' },
  ];
  
  const _bunnyVariants: { value: string; label: string }[] = [
    { value: 'classic-blue', label: 'Classic Blue' },
    { value: 'attention', label: 'Attention' },
    { value: 'hype-boy', label: 'Hype Boy' },
    { value: 'cookie', label: 'Cookie' },
    { value: 'ditto', label: 'Ditto' },
  ];

  // Map mascot IDs to mascot types for MascotAssetEnhanced
  const getMascotType = (id: string): MascotType => {
    const typeMap: Record<string, MascotType> = {
      sol: 'fox',
      lun: 'owl',
      bin: 'wolf',
      fat: 'hawk',
      uni: 'fox', // fallback to fox for uni
      bear: 'dropout-bear',
      bunny: 'nj-bunny',
    };
    return typeMap[id] || 'fox';
  };

  // ============================================================================
  // Size Comparison View
  // ============================================================================

  const SizeComparisonView = () => (
    <div className="space-y-8">
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Maximize2 className="w-5 h-5 text-cyan-500" />
          Size Comparison
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Compare all mascot sizes at different resolutions. Format: <strong>{selectedFormat.toUpperCase()}</strong>
        </p>
        
        <div className="space-y-8">
          {sizes.map(({ value: size, label }) => (
            <div key={size} className="border-b border-border last:border-0 pb-6 last:pb-0">
              <h4 className="text-sm font-medium text-gray-500 mb-4">{label}</h4>
              <div className="flex flex-wrap items-end gap-8">
                {filteredMascots.map((mascot) => (
                  <div key={mascot.id} className="text-center">
                    <div className="inline-flex items-center justify-center p-4 bg-gray-50 rounded-xl">
                      <MascotAssetEnhanced
                        mascot={getMascotType(mascot.id)}
                        size={size}
                        format={selectedFormat}
                        animate={true}
                        animation="idle"
                        showLoading={true}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-2">{mascot.displayName}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // ============================================================================
  // Animation Showcase View
  // ============================================================================

  const AnimationShowcaseView = () => (
    <div className="space-y-8">
      <div className="bg-surface rounded-2xl p-6 shadow-sm border border-border">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <MonitorPlay className="w-5 h-5 text-cyan-500" />
          Animation Showcase
        </h3>
        
        {/* Showcase Controls */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Animation</label>
            <select
              value={showcaseAnimation}
              onChange={(e) => setShowcaseAnimation(e.target.value as typeof showcaseAnimation)}
              className="px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              {animations.map((anim) => (
                <option key={anim.value} value={anim.value}>{anim.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Size</label>
            <select
              value={showcaseSize}
              onChange={(e) => setShowcaseSize(Number(e.target.value) as typeof showcaseSize)}
              className="px-3 py-2 bg-white border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
            >
              {sizes.map((size) => (
                <option key={size.value} value={size.value}>{size.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Animation Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredMascots.map((mascot) => (
            <motion.div
              key={mascot.id}
              className="text-center p-4 bg-gray-50 rounded-xl"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="inline-flex items-center justify-center mb-3">
                <MascotAssetEnhanced
                  mascot={getMascotType(mascot.id)}
                  size={showcaseSize}
                  format={selectedFormat}
                  animate={true}
                  animation={showcaseAnimation}
                  showLoading={true}
                />
              </div>
              <p className="font-medium text-sm">{mascot.displayName}</p>
              <p className="text-xs text-gray-500 capitalize">{showcaseAnimation} animation</p>
            </motion.div>
          ))}
        </div>

        {/* Animation Description */}
        <div className="mt-6 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
          <h4 className="font-medium mb-2">Animation Types:</h4>
          <ul className="space-y-1 list-disc list-inside">
            <li><strong>Idle:</strong> Subtle breathing/bouncing animation for default state</li>
            <li><strong>Wave:</strong> Playful waving gesture for interactions</li>
            <li><strong>Celebrate:</strong> Excited celebration animation for achievements</li>
          </ul>
        </div>
      </div>
    </div>
  );

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
              onClick={() => setView('gallery')}
              className={`p-2.5 rounded-xl transition-colors ${
                view === 'gallery' ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              aria-label="Gallery view"
              aria-pressed={view === 'gallery'}
              title="Gallery View"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('size-comparison')}
              className={`p-2.5 rounded-xl transition-colors ${
                view === 'size-comparison' ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              aria-label="Size comparison view"
              aria-pressed={view === 'size-comparison'}
              title="Size Comparison"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setView('animation-showcase')}
              className={`p-2.5 rounded-xl transition-colors ${
                view === 'animation-showcase' ? 'bg-cyan-100 text-cyan-600' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
              aria-label="Animation showcase view"
              aria-pressed={view === 'animation-showcase'}
              title="Animation Showcase"
            >
              <MonitorPlay className="w-4 h-4" />
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

          {/* Format Toggle (INT-004) */}
          <div className="flex items-center gap-2 ml-auto">
            <Image className="w-4 h-4 text-gray-400" />
            <span className="text-sm text-gray-500">Format:</span>
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {formats.map((fmt) => (
                <button
                  key={fmt.value}
                  onClick={() => setSelectedFormat(fmt.value)}
                  className={`
                    px-2 py-1 rounded-md text-xs font-medium transition-all flex items-center gap-1
                    ${selectedFormat === fmt.value
                      ? 'bg-white text-cyan-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-200'
                    }
                  `}
                  aria-pressed={selectedFormat === fmt.value}
                  title={`${fmt.label} format`}
                >
                  {fmt.icon}
                  {fmt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select
              value={`${filterState.sortBy}-${filterState.sortDirection}`}
              onChange={(e) => {
                const [sortBy] = e.target.value.split('-') as [typeof filterState.sortBy];
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

      {/* Content Based on View Mode */}
      {view === 'gallery' && (
        <>
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
        </>
      )}

      {view === 'size-comparison' && <SizeComparisonView />}
      {view === 'animation-showcase' && <AnimationShowcaseView />}
    </div>
  );
};

export default MascotGallery;
