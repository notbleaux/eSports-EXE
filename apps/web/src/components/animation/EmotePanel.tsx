/** [Ver001.000]
 * Emote Panel Component
 * =====================
 * Interactive emote browser and controller for mascot characters.
 * Provides emote selection, favorites management, quick slots, and preview.
 * 
 * Features:
 * - Emote browser with category filtering
 * - Favorites system with quick toggle
 * - Quick select slots (1-8)
 * - Preview mode with 3D mascot
 * - Search functionality
 * - Unlock status display
 */

import React, { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { MascotId } from '@/components/mascots/types';
import {
  type EmoteDefinition,
  type EmoteCategory,
  type EmoteRarity,
  type PlayerEmoteProgress,
  EMOTE_LIBRARY,
  CATEGORY_CONFIG,
  RARITY_CONFIG,
  getEmotesByCategory,
  getEmotesForMascot,
  getFavoriteEmotes,
  getQuickSlots,
  searchEmotes,
  calculateUnlockCost,
} from '@/lib/animation/emotes/library';

// ============================================================================
// Types
// ============================================================================

export interface EmotePanelProps {
  /** Current mascot ID */
  mascotId: MascotId;
  /** Player's emote progress */
  playerProgress: PlayerEmoteProgress[];
  /** Player level */
  playerLevel: number;
  /** Unlocked achievements */
  achievements: string[];
  /** Called when emote is selected */
  onEmoteSelect?: (emote: EmoteDefinition) => void;
  /** Called when emote is previewed */
  onEmotePreview?: (emote: EmoteDefinition) => void;
  /** Called when favorite is toggled */
  onFavoriteToggle?: (emoteId: string, isFavorite: boolean) => void;
  /** Called when quick slot is assigned */
  onQuickSlotAssign?: (emoteId: string, slot: number | undefined) => void;
  /** Called when emote unlock is requested */
  onUnlockRequest?: (emote: EmoteDefinition) => void;
  /** Whether panel is open */
  isOpen: boolean;
  /** Close handler */
  onClose: () => void;
  /** Panel position */
  position?: 'left' | 'right' | 'bottom';
  /** Show preview panel */
  showPreview?: boolean;
}

interface EmoteCardProps {
  emote: EmoteDefinition;
  isUnlocked: boolean;
  isFavorite: boolean;
  quickSlot?: number;
  isSelected: boolean;
  onClick: () => void;
  onFavoriteClick: (e: React.MouseEvent) => void;
  onQuickSlotClick: (e: React.MouseEvent) => void;
}

// ============================================================================
// Emote Card Component
// ============================================================================

const EmoteCard: React.FC<EmoteCardProps> = ({
  emote,
  isUnlocked,
  isFavorite,
  quickSlot,
  isSelected,
  onClick,
  onFavoriteClick,
  onQuickSlotClick: _onQuickSlotClick,
}) => {
  const rarityConfig = RARITY_CONFIG[emote.rarity];

  return (
    <motion.button
      className={`
        relative p-3 rounded-lg border-2 transition-all duration-200
        ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-blue-500' : ''}
        ${isUnlocked 
          ? `bg-slate-800/80 hover:bg-slate-700/80 ${rarityConfig.borderColor} cursor-pointer` 
          : 'bg-slate-900/50 border-slate-700 cursor-not-allowed opacity-60'
        }
      `}
      style={{
        boxShadow: isUnlocked && isSelected ? `0 0 20px ${rarityConfig.glowColor}` : 'none',
      }}
      onClick={onClick}
      whileHover={isUnlocked ? { scale: 1.05 } : {}}
      whileTap={isUnlocked ? { scale: 0.95 } : {}}
      layout
    >
      {/* Rarity indicator */}
      <div
        className="absolute top-1 right-1 w-2 h-2 rounded-full"
        style={{ backgroundColor: rarityConfig.color }}
      />

      {/* Quick slot badge */}
      {quickSlot && (
        <div className="absolute top-1 left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
          {quickSlot}
        </div>
      )}

      {/* Icon */}
      <div className="text-4xl mb-2">{emote.icon}</div>

      {/* Name */}
      <div className="text-xs font-medium text-slate-200 truncate">{emote.name}</div>

      {/* Category */}
      <div className="text-[10px] text-slate-400">{CATEGORY_CONFIG[emote.category].displayName}</div>

      {/* Favorite button */}
      {isUnlocked && (
        <button
          className={`
            absolute bottom-1 right-1 p-1 rounded transition-colors
            ${isFavorite ? 'text-pink-500' : 'text-slate-600 hover:text-pink-400'}
          `}
          onClick={onFavoriteClick}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      )}

      {/* Lock overlay */}
      {!isUnlocked && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-lg">
          <span className="text-2xl">🔒</span>
        </div>
      )}
    </motion.button>
  );
};

// ============================================================================
// Quick Slots Component
// ============================================================================

interface QuickSlotsProps {
  slots: Map<number, EmoteDefinition>;
  onSlotClick: (slot: number) => void;
  selectedSlot?: number;
}

const QuickSlots: React.FC<QuickSlotsProps> = ({ slots, onSlotClick, selectedSlot }) => {
  return (
    <div className="flex gap-2 p-3 bg-slate-900/80 rounded-lg">
      {[1, 2, 3, 4, 5, 6, 7, 8].map(slot => {
        const emote = slots.get(slot);
        return (
          <button
            key={slot}
            className={`
              w-10 h-10 rounded-lg border-2 flex items-center justify-center text-lg
              transition-all duration-150
              ${selectedSlot === slot 
                ? 'border-blue-500 bg-blue-500/20 ring-2 ring-blue-500' 
                : 'border-slate-600 bg-slate-800 hover:border-slate-500'
              }
            `}
            onClick={() => onSlotClick(slot)}
          >
            {emote ? (
              <span>{emote.icon}</span>
            ) : (
              <span className="text-slate-600 text-xs font-bold">{slot}</span>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ============================================================================
// Preview Panel Component
// ============================================================================

interface PreviewPanelProps {
  emote: EmoteDefinition | null;
  isUnlocked: boolean;
  playerLevel: number;
  onPreview: () => void;
  onUnlock: () => void;
}

const PreviewPanel: React.FC<PreviewPanelProps> = ({
  emote,
  isUnlocked,
  playerLevel,
  onPreview,
  onUnlock,
}) => {
  if (!emote) {
    return (
      <div className="h-full flex items-center justify-center text-slate-500">
        <div className="text-center">
          <div className="text-6xl mb-4">🎭</div>
          <p>Select an emote to preview</p>
        </div>
      </div>
    );
  }

  const rarityConfig = RARITY_CONFIG[emote.rarity];
  const unlockCost = calculateUnlockCost(emote);
  const canUnlock = emote.unlockRequirements?.level !== undefined 
    ? playerLevel >= emote.unlockRequirements.level 
    : true;

  return (
    <div className="h-full flex flex-col p-4">
      {/* Preview area */}
      <div 
        className="flex-1 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden"
        style={{ backgroundColor: `${rarityConfig.color}20` }}
      >
        {/* Glow effect */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at center, ${rarityConfig.color}40, transparent 70%)`,
          }}
        />
        
        {/* Large icon */}
        <motion.div
          className="text-[120px] relative z-10"
          animate={{ 
            scale: [1, 1.1, 1],
            rotate: [0, 5, -5, 0],
          }}
          transition={{ 
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          {emote.icon}
        </motion.div>
      </div>

      {/* Emote info */}
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-bold text-white">{emote.name}</h3>
          <div className="flex items-center gap-2 text-sm">
            <span style={{ color: rarityConfig.color }}>{rarityConfig.displayName}</span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-400">{CATEGORY_CONFIG[emote.category].displayName}</span>
          </div>
        </div>

        <p className="text-sm text-slate-300">{emote.description}</p>

        {/* Duration & Loop */}
        <div className="flex gap-4 text-xs text-slate-400">
          <span>Duration: {emote.duration}s</span>
          <span>{emote.loop ? 'Loops' : 'One-shot'}</span>
        </div>

        {/* Unlock requirements */}
        {!isUnlocked && (
          <div className="p-3 bg-slate-800/80 rounded-lg">
            <h4 className="text-sm font-semibold text-slate-300 mb-2">Unlock Requirements</h4>
            <ul className="text-xs text-slate-400 space-y-1">
              {emote.unlockRequirements?.level && (
                <li className={playerLevel >= emote.unlockRequirements.level ? 'text-green-400' : 'text-red-400'}>
                  Level {emote.unlockRequirements.level} {playerLevel >= emote.unlockRequirements.level ? '✓' : ''}
                </li>
              )}
              {emote.unlockRequirements?.achievement && (
                <li>Complete: {emote.unlockRequirements.achievement}</li>
              )}
              {emote.unlockRequirements?.cost !== undefined && (
                <li>Cost: {unlockCost} credits</li>
              )}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {isUnlocked ? (
            <button
              className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
              onClick={onPreview}
            >
              ▶ Play Emote
            </button>
          ) : (
            <button
              className={`
                flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                ${canUnlock 
                  ? 'bg-amber-600 hover:bg-amber-500 text-white' 
                  : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                }
              `}
              onClick={onUnlock}
              disabled={!canUnlock}
            >
              {canUnlock ? `🔓 Unlock (${unlockCost})` : '🔒 Locked'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Main Emote Panel Component
// ============================================================================

export const EmotePanel: React.FC<EmotePanelProps> = ({
  mascotId,
  playerProgress,
  playerLevel,
  achievements: _achievements,
  onEmoteSelect,
  onEmotePreview,
  onFavoriteToggle,
  onQuickSlotAssign,
  onUnlockRequest,
  isOpen,
  onClose,
  position = 'right',
  showPreview = true,
}) => {
  // State
  const [selectedCategory, setSelectedCategory] = useState<EmoteCategory | 'all' | 'favorites'>('all');
  const [selectedRarity, setSelectedRarity] = useState<EmoteRarity | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmote, setSelectedEmote] = useState<EmoteDefinition | null>(null);
  const [assigningQuickSlot, setAssigningQuickSlot] = useState<number | undefined>();
  const [_viewMode, _setViewMode] = useState<'grid' | 'list'>('grid');

  // Memoized data
  const compatibleEmotes = useMemo(() => getEmotesForMascot(mascotId), [mascotId]);
  
  const filteredEmotes = useMemo(() => {
    let emotes = compatibleEmotes;

    // Category filter
    if (selectedCategory === 'favorites') {
      emotes = getFavoriteEmotes(playerProgress);
    } else if (selectedCategory !== 'all') {
      emotes = getEmotesByCategory(selectedCategory);
    }

    // Rarity filter
    if (selectedRarity !== 'all') {
      emotes = emotes.filter(e => e.rarity === selectedRarity);
    }

    // Search filter
    if (searchQuery) {
      emotes = searchEmotes(searchQuery).filter(e => emotes.some(ce => ce.id === e.id));
    }

    // Filter by compatibility
    return emotes.filter(e => 
      e.compatibleMascots.length === 0 || e.compatibleMascots.includes(mascotId)
    );
  }, [compatibleEmotes, selectedCategory, selectedRarity, searchQuery, playerProgress, mascotId]);

  const quickSlots = useMemo(() => getQuickSlots(playerProgress), [playerProgress]);
  const favorites = useMemo(() => 
    new Set(playerProgress.filter(p => p.favorite).map(p => p.emoteId)),
    [playerProgress]
  );

  const unlockedEmotes = useMemo(() => 
    new Set(playerProgress.filter(p => p.unlocked).map(p => p.emoteId)),
    [playerProgress]
  );

  // Handlers
  const handleEmoteClick = useCallback((emote: EmoteDefinition) => {
    setSelectedEmote(emote);
    
    // If assigning quick slot, assign it
    if (assigningQuickSlot !== undefined) {
      if (unlockedEmotes.has(emote.id)) {
        onQuickSlotAssign?.(emote.id, assigningQuickSlot);
      }
      setAssigningQuickSlot(undefined);
    } else {
      onEmoteSelect?.(emote);
    }
  }, [assigningQuickSlot, unlockedEmotes, onEmoteSelect, onQuickSlotAssign]);

  const handleFavoriteClick = useCallback((emoteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onFavoriteToggle?.(emoteId, !favorites.has(emoteId));
  }, [favorites, onFavoriteToggle]);

  const handleQuickSlotClick = useCallback((emoteId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    // Cycle through quick slots
    const progress = playerProgress.find(p => p.emoteId === emoteId);
    if (progress?.quickSlot) {
      onQuickSlotAssign?.(emoteId, undefined); // Unassign
    } else {
      setAssigningQuickSlot(1); // Will cycle to find empty slot
    }
  }, [playerProgress, onQuickSlotAssign]);

  const handleQuickSlotButtonClick = useCallback((slot: number) => {
    if (assigningQuickSlot === slot) {
      setAssigningQuickSlot(undefined);
    } else {
      setAssigningQuickSlot(slot);
    }
  }, [assigningQuickSlot]);

  const isEmoteSelectedUnlocked = selectedEmote ? unlockedEmotes.has(selectedEmote.id) : false;

  // Panel positioning
  const panelClasses = {
    left: 'left-0 top-0 h-full',
    right: 'right-0 top-0 h-full',
    bottom: 'bottom-0 left-0 w-full h-[60vh]',
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        className={`
          fixed ${panelClasses[position]} z-50 flex
          ${position === 'bottom' ? 'flex-col' : 'flex-row'}
        `}
        initial={{ x: position === 'left' ? '-100%' : position === 'right' ? '100%' : 0, 
                   y: position === 'bottom' ? '100%' : 0 }}
        animate={{ x: 0, y: 0 }}
        exit={{ x: position === 'left' ? '-100%' : position === 'right' ? '100%' : 0,
                y: position === 'bottom' ? '100%' : 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        {/* Main panel */}
        <div className={`
          bg-slate-950/95 backdrop-blur-xl border-slate-800
          ${position === 'bottom' ? 'w-full border-t' : 'w-96 border-l border-r'}
          flex flex-col
        `}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-800">
            <h2 className="text-lg font-bold text-white">Emotes</h2>
            <button
              className="p-2 text-slate-400 hover:text-white transition-colors"
              onClick={onClose}
            >
              ✕
            </button>
          </div>

          {/* Quick slots */}
          <div className="p-3 border-b border-slate-800">
            <QuickSlots
              slots={quickSlots}
              onSlotClick={handleQuickSlotButtonClick}
              selectedSlot={assigningQuickSlot}
            />
            {assigningQuickSlot !== undefined && (
              <p className="text-xs text-blue-400 mt-2 text-center">
                Click an emote to assign to slot {assigningQuickSlot}
              </p>
            )}
          </div>

          {/* Search */}
          <div className="p-3 border-b border-slate-800">
            <input
              type="text"
              placeholder="Search emotes..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Category tabs */}
          <div className="flex gap-1 p-2 border-b border-slate-800 overflow-x-auto">
            {['all', 'favorites', ...Object.keys(CATEGORY_CONFIG)].map((cat) => (
              <button
                key={cat}
                className={`
                  px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                  ${selectedCategory === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }
                `}
                onClick={() => setSelectedCategory(cat as EmoteCategory | 'all' | 'favorites')}
              >
                {cat === 'all' ? 'All' : cat === 'favorites' ? '★ Favorites' : CATEGORY_CONFIG[cat as EmoteCategory]?.displayName || cat}
              </button>
            ))}
          </div>

          {/* Rarity filter */}
          <div className="flex gap-1 p-2 border-b border-slate-800">
            <button
              className={`px-2 py-1 rounded text-xs ${selectedRarity === 'all' ? 'bg-slate-700 text-white' : 'text-slate-400'}`}
              onClick={() => setSelectedRarity('all')}
            >
              All
            </button>
            {(Object.keys(RARITY_CONFIG) as EmoteRarity[]).map(rarity => (
              <button
                key={rarity}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  selectedRarity === rarity
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
                style={{ 
                  backgroundColor: selectedRarity === rarity ? RARITY_CONFIG[rarity].color : 'transparent'
                }}
                onClick={() => setSelectedRarity(rarity === selectedRarity ? 'all' : rarity)}
              >
                {RARITY_CONFIG[rarity].displayName}
              </button>
            ))}
          </div>

          {/* Emote grid */}
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-3 gap-2">
              {filteredEmotes.map(emote => {
                const isUnlocked = unlockedEmotes.has(emote.id);
                const isFavorite = favorites.has(emote.id);
                const quickSlot = playerProgress.find(p => p.emoteId === emote.id)?.quickSlot;

                return (
                  <EmoteCard
                    key={emote.id}
                    emote={emote}
                    isUnlocked={isUnlocked}
                    isFavorite={isFavorite}
                    quickSlot={quickSlot}
                    isSelected={selectedEmote?.id === emote.id}
                    onClick={() => handleEmoteClick(emote)}
                    onFavoriteClick={(e) => handleFavoriteClick(emote.id, e)}
                    onQuickSlotClick={(e) => handleQuickSlotClick(emote.id, e)}
                  />
                );
              })}
            </div>

            {filteredEmotes.length === 0 && (
              <div className="text-center py-8 text-slate-500">
                <div className="text-4xl mb-2">🔍</div>
                <p>No emotes found</p>
              </div>
            )}
          </div>

          {/* Footer stats */}
          <div className="p-3 border-t border-slate-800 text-xs text-slate-400">
            <div className="flex justify-between">
              <span>{unlockedEmotes.size} / {EMOTE_LIBRARY.length} unlocked</span>
              <span>{favorites.size} favorites</span>
            </div>
          </div>
        </div>

        {/* Preview panel */}
        {showPreview && position !== 'bottom' && (
          <div className="w-80 bg-slate-900/95 backdrop-blur-xl border-r border-slate-800">
            <PreviewPanel
              emote={selectedEmote}
              isUnlocked={isEmoteSelectedUnlocked}
              playerLevel={playerLevel}
              onPreview={() => selectedEmote && onEmotePreview?.(selectedEmote)}
              onUnlock={() => selectedEmote && onUnlockRequest?.(selectedEmote)}
            />
          </div>
        )}
      </motion.div>

      {/* Backdrop */}
      <motion.div
        className="fixed inset-0 bg-black/50 z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
    </AnimatePresence>
  );
};

export default EmotePanel;
otePanel;
