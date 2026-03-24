/** [Ver002.000] */
/**
 * Bookmark Manager Component
 * ==========================
 * UI for managing replay bookmarks with categories, filtering, and export.
 */

import React, { useCallback, useState, useMemo } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  Bookmark,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Share2,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Tag,
  Clock,
  User,
  Target,
} from 'lucide-react';
import {
  useBookmarkStore,
  useCurrentBookmarkList,
  useFilteredBookmarks,
  useSelectedBookmark,
  useBookmarkFilter,
  useBookmarkSort,
  useVisibleCategories,
  BOOKMARK_CATEGORIES,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_LABELS,
  type Bookmark as BookmarkType,
  type BookmarkCategory,
  type BookmarkFilter,
} from '@/lib/replay/bookmarks';
import { useTimelineStore, formatTime } from '@/lib/replay/timeline/state';

// ============================================================================
// Utility
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Types
// ============================================================================

export interface BookmarkManagerProps {
  className?: string;
  onBookmarkSelect?: (bookmark: BookmarkType) => void;
  onBookmarkJump?: (bookmark: BookmarkType) => void;
}

export interface BookmarkItemProps {
  bookmark: BookmarkType;
  isSelected: boolean;
  isEditing: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onSave: (updates: Partial<BookmarkType>) => void;
}

export interface CategoryFilterProps {
  categories: BookmarkCategory[];
  visibleCategories: Set<BookmarkCategory>;
  onToggle: (category: BookmarkCategory) => void;
  onShowAll: () => void;
  onHideAll: () => void;
}

// ============================================================================
// Category Filter
// ============================================================================

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  categories,
  visibleCategories,
  onToggle,
  onShowAll,
  onHideAll,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-slate-800 rounded-lg p-3">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-sm font-medium text-slate-300"
      >
        <span className="flex items-center gap-2">
          <Filter size={14} />
          Categories
          <span className="px-1.5 py-0.5 bg-slate-700 rounded text-xs">
            {visibleCategories.size}/{categories.length}
          </span>
        </span>
        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>

      {isExpanded && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onShowAll}
              className="text-xs px-2 py-1 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
            >
              Show All
            </button>
            <button
              type="button"
              onClick={onHideAll}
              className="text-xs px-2 py-1 bg-slate-700 rounded hover:bg-slate-600 transition-colors"
            >
              Hide All
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {categories.map((category) => {
              const isVisible = visibleCategories.has(category);
              return (
                <button
                  key={category}
                  type="button"
                  onClick={() => onToggle(category)}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded text-xs transition-all',
                    isVisible
                      ? 'bg-slate-700 text-white'
                      : 'bg-slate-900 text-slate-500 opacity-60'
                  )}
                >
                  <span>{CATEGORY_ICONS[category]}</span>
                  <span>{CATEGORY_LABELS[category]}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Bookmark Item
// ============================================================================

const BookmarkItem: React.FC<BookmarkItemProps> = ({
  bookmark,
  isSelected,
  isEditing,
  onSelect,
  onEdit,
  onDelete,
  onSave,
}) => {
  const [editLabel, setEditLabel] = useState(bookmark.label);
  const [editDescription, setEditDescription] = useState(bookmark.description || '');
  const [editTags, setEditTags] = useState(bookmark.tags.join(', '));

  const handleSave = useCallback(() => {
    onSave({
      label: editLabel,
      description: editDescription,
      tags: editTags.split(',').map(t => t.trim()).filter(Boolean),
    });
  }, [editLabel, editDescription, editTags, onSave]);

  const handleCancel = useCallback(() => {
    setEditLabel(bookmark.label);
    setEditDescription(bookmark.description || '');
    setEditTags(bookmark.tags.join(', '));
    onEdit(); // Toggle off editing
  }, [bookmark, onEdit]);

  if (isEditing) {
    return (
      <div className={cn(
        'bg-slate-800 rounded-lg p-3 border-2 border-cyan-500/50',
        'animate-in fade-in duration-200'
      )}>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Label</label>
            <input
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500"
              autoFocus
            />
          </div>
          
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Description</label>
            <textarea
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>
          
          <div>
            <label className="text-xs text-slate-500 mb-1 block">Tags (comma separated)</label>
            <input
              type="text"
              value={editTags}
              onChange={(e) => setEditTags(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-cyan-500"
              placeholder="clutch, highlight, ..."
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={handleCancel}
              className="px-3 py-1.5 text-xs bg-slate-700 rounded hover:bg-slate-600 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-3 py-1.5 text-xs bg-cyan-500 text-slate-900 rounded hover:bg-cyan-400 transition-colors flex items-center gap-1"
            >
              <Check size={12} />
              Save
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'group relative bg-slate-800 rounded-lg p-3 cursor-pointer',
        'transition-all duration-150 hover:bg-slate-750',
        isSelected && 'ring-2 ring-cyan-500/50 bg-slate-750'
      )}
      onClick={onSelect}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: bookmark.color || CATEGORY_COLORS[bookmark.category] }}
          />
          <span className="text-lg">{CATEGORY_ICONS[bookmark.category]}</span>
          <span className="font-medium text-sm text-white">{bookmark.label}</span>
        </div>
        
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="p-1 text-slate-400 hover:text-white transition-colors"
            title="Edit"
          >
            <Edit2 size={14} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-slate-400 hover:text-red-400 transition-colors"
            title="Delete"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex items-center gap-3 text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatTime(bookmark.timestamp, false)}
        </span>
        {bookmark.roundNumber && (
          <span className="flex items-center gap-1">
            <Target size={12} />
            Round {bookmark.roundNumber}
          </span>
        )}
        {bookmark.playerName && (
          <span className="flex items-center gap-1">
            <User size={12} />
            {bookmark.playerName}
          </span>
        )}
      </div>

      {/* Description */}
      {bookmark.description && (
        <p className="mt-2 text-xs text-slate-400 line-clamp-2">
          {bookmark.description}
        </p>
      )}

      {/* Tags */}
      {bookmark.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {bookmark.tags.map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-slate-900 rounded text-xs text-slate-500 flex items-center gap-1"
            >
              <Tag size={10} />
              {tag}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Add Bookmark Dialog
// ============================================================================

interface AddBookmarkDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (bookmark: Omit<BookmarkType, 'id' | 'createdAt' | 'updatedAt'>) => void;
  currentTime: number;
  currentTick: number;
}

const AddBookmarkDialog: React.FC<AddBookmarkDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
  currentTime,
  currentTick,
}) => {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<BookmarkType['category']>('custom');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAdd({
      label: label || 'Bookmark',
      category,
      description: description || undefined,
      timestamp: currentTime,
      tick: currentTick,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
    });
    onClose();
    // Reset form
    setLabel('');
    setCategory('custom');
    setDescription('');
    setTags('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-slate-800 rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-auto">
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h3 className="text-lg font-semibold text-white">Add Bookmark</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Time</label>
            <div className="px-3 py-2 bg-slate-900 rounded text-sm font-mono text-cyan-400">
              {formatTime(currentTime)}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Label *</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Enter bookmark label..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
              autoFocus
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Category</label>
            <div className="grid grid-cols-3 gap-2">
              {BOOKMARK_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={cn(
                    'px-2 py-2 rounded-lg text-xs flex items-center justify-center gap-1.5 transition-all',
                    category === cat
                      ? 'bg-cyan-500/20 text-cyan-400 ring-1 ring-cyan-500/50'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-700'
                  )}
                >
                  <span>{CATEGORY_ICONS[cat]}</span>
                  <span>{CATEGORY_LABELS[cat]}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Optional description..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 resize-none"
            />
          </div>

          <div>
            <label className="text-sm text-slate-400 mb-1.5 block">Tags</label>
            <input
              type="text"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="comma, separated, tags"
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!label}
              className="px-4 py-2 bg-cyan-500 text-slate-900 rounded-lg text-sm font-medium hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add Bookmark
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// Main Component
// ============================================================================

export const BookmarkManager: React.FC<BookmarkManagerProps> = ({
  className,
  onBookmarkSelect,
  onBookmarkJump,
}) => {
  // Store state
  const store = useBookmarkStore();
  const timelineStore = useTimelineStore();
  const currentList = useCurrentBookmarkList();
  const bookmarks = useFilteredBookmarks();
  const selectedBookmark = useSelectedBookmark();
  const filter = useBookmarkFilter();
  const sort = useBookmarkSort();
  const visibleCategories = useVisibleCategories();

  // Local state
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingBookmarkId, setEditingBookmarkId] = useState<string | null>(null);
  const [showExportNotification, setShowExportNotification] = useState<string | null>(null);

  // Update filter when search changes
  React.useEffect(() => {
    store.setFilter({ searchQuery: searchQuery || undefined });
  }, [searchQuery, store]);

  // Handle add bookmark
  const handleAddBookmark = useCallback((bookmark: Omit<BookmarkType, 'id' | 'createdAt' | 'updatedAt'>) => {
    store.addBookmark(bookmark);
  }, [store]);

  // Handle export
  const handleExport = useCallback(() => {
    const json = store.exportToJSON();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookmarks-${currentList?.matchId || 'export'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setShowExportNotification('Bookmarks exported successfully');
    setTimeout(() => setShowExportNotification(null), 3000);
  }, [store, currentList]);

  // Handle import
  const handleImport = useCallback(() => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const result = store.importFromJSON(event.target?.result as string);
          if (result.success) {
            setShowExportNotification(`Imported ${result.count} bookmarks`);
          } else {
            setShowExportNotification(`Import failed: ${result.error}`);
          }
          setTimeout(() => setShowExportNotification(null), 3000);
        };
        reader.readAsText(file);
      }
    };
    input.click();
  }, [store]);

  // Handle share
  const handleShare = useCallback(() => {
    const url = store.exportToURL();
    navigator.clipboard.writeText(url);
    setShowExportNotification('Share URL copied to clipboard');
    setTimeout(() => setShowExportNotification(null), 3000);
  }, [store]);

  return (
    <div className={cn('flex flex-col h-full bg-slate-900 rounded-xl overflow-hidden', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Bookmark className="text-cyan-400" size={20} />
          <h2 className="text-lg font-semibold text-white">Bookmarks</h2>
          <span className="px-2 py-0.5 bg-slate-800 rounded-full text-xs text-slate-400">
            {bookmarks.length}
          </span>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={handleExport}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Export"
          >
            <Download size={18} />
          </button>
          <button
            type="button"
            onClick={handleImport}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Import"
          >
            <Upload size={18} />
          </button>
          <button
            type="button"
            onClick={handleShare}
            className="p-2 text-slate-400 hover:text-white transition-colors"
            title="Share"
          >
            <Share2 size={18} />
          </button>
        </div>
      </div>

      {/* Search and filters */}
      <div className="p-4 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" size={16} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookmarks..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <CategoryFilter
          categories={BOOKMARK_CATEGORIES}
          visibleCategories={visibleCategories}
          onToggle={store.toggleCategory}
          onShowAll={store.showAllCategories}
          onHideAll={store.hideAllCategories}
        />
      </div>

      {/* Bookmarks list */}
      <div className="flex-1 overflow-y-auto p-4 pt-0 space-y-2">
        {bookmarks.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Bookmark size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No bookmarks yet</p>
            <p className="text-xs mt-1">Add bookmarks to mark important moments</p>
          </div>
        ) : (
          bookmarks.map((bookmark) => (
            <BookmarkItem
              key={bookmark.id}
              bookmark={bookmark}
              isSelected={selectedBookmark?.id === bookmark.id}
              isEditing={editingBookmarkId === bookmark.id}
              onSelect={() => {
                store.selectBookmark(bookmark.id);
                onBookmarkSelect?.(bookmark);
                timelineStore.seek(bookmark.timestamp);
                onBookmarkJump?.(bookmark);
              }}
              onEdit={() => {
                setEditingBookmarkId(editingBookmarkId === bookmark.id ? null : bookmark.id);
              }}
              onDelete={() => store.removeBookmark(bookmark.id)}
              onSave={(updates) => {
                store.updateBookmark(bookmark.id, updates);
                setEditingBookmarkId(null);
              }}
            />
          ))
        )}
      </div>

      {/* Add button */}
      <div className="p-4 border-t border-slate-800">
        <button
          type="button"
          onClick={() => setIsAddDialogOpen(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-cyan-500 text-slate-900 rounded-lg font-medium hover:bg-cyan-400 transition-colors"
        >
          <Plus size={18} />
          Add Bookmark at Current Time
        </button>
      </div>

      {/* Add dialog */}
      <AddBookmarkDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onAdd={handleAddBookmark}
        currentTime={timelineStore.currentTime}
        currentTick={timelineStore.currentTick}
      />

      {/* Notification */}
      {showExportNotification && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
          <span className="text-sm text-white">{showExportNotification}</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Compact Bookmark List (for overlay usage)
// ============================================================================

export interface CompactBookmarkListProps {
  className?: string;
  onBookmarkClick?: (bookmark: BookmarkType) => void;
  maxItems?: number;
}

export const CompactBookmarkList: React.FC<CompactBookmarkListProps> = ({
  className,
  onBookmarkClick,
  maxItems = 5,
}) => {
  const bookmarks = useFilteredBookmarks();
  const visibleBookmarks = bookmarks.slice(0, maxItems);

  return (
    <div className={cn('bg-slate-900/95 backdrop-blur rounded-lg overflow-hidden', className)}>
      {visibleBookmarks.map((bookmark) => (
        <button
          key={bookmark.id}
          type="button"
          onClick={() => onBookmarkClick?.(bookmark)}
          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-800 transition-colors text-left"
        >
          <span className="text-sm">{CATEGORY_ICONS[bookmark.category]}</span>
          <span className="flex-1 text-sm text-white truncate">{bookmark.label}</span>
          <span className="text-xs text-slate-500 font-mono">
            {formatTime(bookmark.timestamp, false)}
          </span>
        </button>
      ))}
      {bookmarks.length > maxItems && (
        <div className="px-3 py-2 text-xs text-slate-500 text-center">
          +{bookmarks.length - maxItems} more
        </div>
      )}
    </div>
  );
};

export default BookmarkManager;
