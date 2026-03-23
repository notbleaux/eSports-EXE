/** [Ver001.000]
 * CharacterBible Component
 * ========================
 * Detailed mascot view with backstory/lore, ability descriptions,
 * stats radar chart, and related mascots section.
 * 
 * Features:
 * - Modal/drawer presentation
 * - Stats radar chart (Recharts)
 * - Lore/backstory section
 * - Ability cards with descriptions
 * - Related mascots carousel
 * - WCAG 2.1 AA accessible
 */

import React, { useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Star,
  Zap,
  Clock,
  ChevronRight,
  Sparkles,
  BookOpen,
  User,
  Home,
  Quote,
} from 'lucide-react';
import { useReducedMotion } from '@/hooks/animation/useReducedMotion';
import type { CharacterBibleProps } from './types';
import { MascotStatsRadar } from './MascotStatsRadar';
import { MascotCard } from './MascotCard';
import { ELEMENT_CONFIG, RARITY_CONFIG, getRelatedMascots, getTotalPower } from './mocks/mascots';

// ============================================================================
// Component
// ============================================================================

export const CharacterBible: React.FC<CharacterBibleProps> = ({
  mascot,
  isOpen,
  onClose,
  relatedMascots,
  onRelatedMascotClick,
  className = '',
}) => {
  const { prefersReducedMotion } = useReducedMotion();

  // ============================================================================
  // Derived Data
  // ============================================================================

  const elementConfig = useMemo(() => {
    if (!mascot) return null;
    return ELEMENT_CONFIG[mascot.element];
  }, [mascot]);

  const rarityConfig = useMemo(() => {
    if (!mascot) return null;
    return RARITY_CONFIG[mascot.rarity];
  }, [mascot]);

  const totalPower = useMemo(() => {
    if (!mascot) return 0;
    return getTotalPower(mascot);
  }, [mascot]);

  const related = useMemo(() => {
    if (!mascot) return [];
    return relatedMascots || getRelatedMascots(mascot);
  }, [mascot, relatedMascots]);

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleRelatedClick = useCallback((relatedMascot: NonNullable<typeof mascot>) => {
    onRelatedMascotClick?.(relatedMascot);
  }, [onRelatedMascotClick]);

  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  // ============================================================================
  // Element Icon Helper
  // ============================================================================

  const ElementIcon = useMemo(() => {
    switch (mascot?.element) {
      case 'solar': return Zap;
      case 'lunar': return Sparkles;
      case 'binary': return Zap;
      case 'fire': return Zap;
      case 'magic': return Sparkles;
      default: return Sparkles;
    }
  }, [mascot?.element]);

  // ============================================================================
  // Animation Variants
  // ============================================================================

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
  };

  const modalVariants = {
    hidden: { opacity: 0, y: prefersReducedMotion ? 0 : 50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.3,
        ease: [0, 0, 0.2, 1],
      }
    },
    exit: { 
      opacity: 0, 
      y: prefersReducedMotion ? 0 : 20, 
      scale: 0.95,
      transition: {
        duration: prefersReducedMotion ? 0 : 0.2,
      }
    },
  };

  // ============================================================================
  // Render
  // ============================================================================

  if (!mascot) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          onKeyDown={handleKeyDown}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            onClick={handleBackdropClick}
          />

          {/* Modal Content */}
          <motion.article
            className={`
              relative w-full max-w-4xl max-h-[90vh] overflow-y-auto
              bg-surface rounded-3xl shadow-2xl
              ${className}
            `}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mascot-name"
          >
            {/* Header */}
            <header 
              className="relative h-48 sm:h-64 rounded-t-3xl overflow-hidden"
              style={{ 
                background: `linear-gradient(135deg, ${mascot.color}40 0%, ${mascot.color}20 100%)` 
              }}
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors shadow-sm"
                aria-label="Close character bible"
              >
                <X className="w-5 h-5 text-charcoal" />
              </button>

              {/* Avatar */}
              <div className="absolute bottom-0 left-6 sm:left-10 transform translate-y-1/3">
                <div 
                  className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-surface shadow-xl flex items-center justify-center border-4 border-surface"
                  style={{ backgroundColor: `${mascot.color}20` }}
                >
                  <ElementIcon 
                    className="w-16 h-16 sm:w-20 sm:h-20"
                    style={{ color: mascot.color }}
                    aria-hidden="true"
                  />
                </div>
              </div>

              {/* Rarity Stars */}
              <div className="absolute top-4 left-4 flex gap-1">
                {Array.from({ length: rarityConfig?.starCount || 1 }).map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 fill-current"
                    style={{ color: rarityConfig?.color }}
                    aria-hidden="true"
                  />
                ))}
              </div>
            </header>

            {/* Content */}
            <div className="pt-20 sm:pt-24 px-6 sm:px-10 pb-10">
              {/* Title Section */}
              <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                  <h1 
                    id="mascot-name"
                    className="text-3xl sm:text-4xl font-bold text-charcoal"
                  >
                    {mascot.displayName}
                  </h1>
                  <span 
                    className="px-3 py-1 rounded-full text-sm font-medium text-white"
                    style={{ backgroundColor: elementConfig?.color }}
                  >
                    {elementConfig?.label}
                  </span>
                </div>
                <p 
                  className="text-lg font-medium"
                  style={{ color: rarityConfig?.color }}
                >
                  {rarityConfig?.label} Mascot
                </p>
              </div>

              {/* Main Grid */}
              <div className="grid lg:grid-cols-2 gap-8 mb-10">
                {/* Left Column: Stats */}
                <section aria-labelledby="stats-heading">
                  <h2 id="stats-heading" className="sr-only">Statistics</h2>
                  
                  {/* Total Power */}
                  <div className="bg-gray-50 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-gray-500 font-medium">Total Power</span>
                      <span className="text-3xl font-bold" style={{ color: mascot.color }}>
                        {totalPower}
                      </span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-500"
                        style={{ 
                          width: `${totalPower}%`,
                          backgroundColor: mascot.color,
                        }}
                      />
                    </div>
                  </div>

                  {/* Radar Chart */}
                  <div className="bg-gray-50 rounded-2xl p-6 flex flex-col items-center">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">
                      Stat Distribution
                    </h3>
                    <MascotStatsRadar
                      stats={mascot.stats}
                      color={mascot.color}
                      size={250}
                      animated={!prefersReducedMotion}
                    />
                  </div>
                </section>

                {/* Right Column: Lore & Info */}
                <section aria-labelledby="lore-heading">
                  <h2 id="lore-heading" className="sr-only">Character Lore</h2>

                  {/* Lore Sections */}
                  <div className="space-y-6">
                    {/* Backstory */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <BookOpen className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-charcoal">Backstory</h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">
                        {mascot.lore.backstory}
                      </p>
                    </div>

                    {/* Personality & Quote */}
                    <div className="bg-gray-50 rounded-2xl p-6">
                      <div className="flex items-center gap-2 mb-3">
                        <User className="w-5 h-5 text-gray-400" />
                        <h3 className="font-semibold text-charcoal">Personality</h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed mb-4">
                        {mascot.lore.personality}
                      </p>
                      <blockquote className="border-l-4 pl-4 italic text-gray-500" style={{ borderColor: mascot.color }}>
                        "{mascot.lore.quote}"
                      </blockquote>
                    </div>

                    {/* Origin & Habitat */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-gray-400" />
                          <h4 className="font-medium text-charcoal text-sm">Origin</h4>
                        </div>
                        <p className="text-gray-600 text-sm">{mascot.lore.origin}</p>
                      </div>
                      <div className="bg-gray-50 rounded-2xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Home className="w-4 h-4 text-gray-400" />
                          <h4 className="font-medium text-charcoal text-sm">Habitat</h4>
                        </div>
                        <p className="text-gray-600 text-sm">{mascot.lore.habitat}</p>
                      </div>
                    </div>
                  </div>
                </section>
              </div>

              {/* Abilities Section */}
              <section className="mb-10" aria-labelledby="abilities-heading">
                <h2 
                  id="abilities-heading" 
                  className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2"
                >
                  <Zap className="w-5 h-5" style={{ color: mascot.color }} />
                  Abilities
                </h2>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {mascot.abilities.map((ability, index) => (
                    <div 
                      key={ability.id}
                      className="bg-gray-50 rounded-2xl p-5 border-l-4 hover:shadow-md transition-shadow"
                      style={{ borderColor: mascot.color }}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold text-charcoal">{ability.name}</h3>
                        {index === 0 && (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{ability.description}</p>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <Clock className="w-4 h-4" />
                          <span>{ability.cooldown}s</span>
                        </div>
                        <div className="flex items-center gap-1 text-gray-500">
                          <Zap className="w-4 h-4" />
                          <span>Power {ability.power}</span>
                        </div>
                      </div>
                      {ability.unlockLevel > 0 && (
                        <p className="mt-3 text-xs text-gray-400">
                          Unlocks at level {ability.unlockLevel}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </section>

              {/* Related Mascots Section */}
              {related.length > 0 && (
                <section aria-labelledby="related-heading">
                  <h2 
                    id="related-heading" 
                    className="text-xl font-bold text-charcoal mb-6 flex items-center gap-2"
                  >
                    <ChevronRight className="w-5 h-5" style={{ color: mascot.color }} />
                    Related Mascots
                  </h2>
                  <div className="flex gap-4 overflow-x-auto pb-4 -mx-6 px-6">
                    {related.map((relatedMascot) => (
                      <div key={relatedMascot.id} className="flex-shrink-0">
                        <MascotCard
                          mascot={relatedMascot}
                          size="sm"
                          onClick={handleRelatedClick}
                          showStats={false}
                        />
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </motion.article>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CharacterBible;
