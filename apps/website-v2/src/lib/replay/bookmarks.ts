/** [Ver001.000] */
/**
 * Bookmark System
 * ===============
 * Bookmark management for replay highlights and key moments.
 * Supports categories, import/export, and UI integration.
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { persist } from 'zustand/middleware';

// ============================================================================
// Types
// ============================================================================

export type BookmarkCategory = 
  | 'kill'
  | 'plant'
  | 'defuse'
  | 'clutch'
  | 'ace'
  | 'multi-kill'
  | 'ability'
  | 'round-start'
  | 'round-end'
  | 'custom';

export interface Bookmark {
  id: string;
  label: string;
  description?: string;
  timestamp: number;
  tick: number;
  category: BookmarkCategory;
  roundNumber?: number;
  playerId?: string;
  playerName?: string;
  teamSide?: 'attacker' | 'defender';
  position?: { x: number; y: number; z?: number };
  thumbnailUrl?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
  color?: string;
}

export interface BookmarkList {
  id: string;
  name: string;
  description?: string;
  matchId: string;
  bookmarks: Bookmark[];
  isDefault: boolean;
  isShared: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface BookmarkFilter {
  categories?: BookmarkCategory[];
  playerIds?: string[];
  roundNumbers?: number[];
  teamSides?: ('attacker' | 'defender')[];
  tags?: string[];
  searchQuery?: string;
  timeRange?: { start: number; end: number };
}

export interface BookmarkSortOptions {
  field: 'timestamp' | 'createdAt' | 'label' | 'category';
  direction: 'asc' | 'desc';
}

export interface BookmarkState {
  // Current match bookmarks
  currentList: BookmarkList | null;
  
  // All bookmark lists for user
  bookmarkLists: BookmarkList[];
  
  // UI State
  selectedBookmarkId: string | null;
  filter: BookmarkFilter;
  sort: BookmarkSortOptions;
  isEditing: boolean;
  
  // Categories visibility
  visibleCategories: Set<BookmarkCategory>;
}

export interface BookmarkActions {
  // Bookmark CRUD
  addBookmark: (bookmark: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>) => string;
  removeBookmark: (id: string) => void;
  updateBookmark: (id: string, updates: Partial<Omit<Bookmark, 'id' | 'createdAt'>>) => void;
  getBookmark: (id: string) => Bookmark | undefined;
  
  // Bulk operations
  addBookmarks: (bookmarks: Array<Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>>) => void;
  clearBookmarks: () => void;
  removeBookmarksByCategory: (category: BookmarkCategory) => void;
  removeBookmarksByRound: (roundNumber: number) => void;
  
  // Navigation
  jumpToBookmark: (id: string) => Bookmark | null;
  nextBookmark: (category?: BookmarkCategory) => Bookmark | null;
  prevBookmark: (category?: BookmarkCategory) => Bookmark | null;
  
  // List management
  createList: (name: string, matchId: string, description?: string) => string;
  loadList: (id: string) => void;
  deleteList: (id: string) => void;
  renameList: (id: string, name: string) => void;
  duplicateList: (id: string, newName: string) => string;
  setDefaultList: (id: string) => void;
  
  // Filter & Sort
  setFilter: (filter: Partial<BookmarkFilter>) => void;
  clearFilter: () => void;
  setSort: (sort: BookmarkSortOptions) => void;
  getFilteredBookmarks: () => Bookmark[];
  
  // Category visibility
  toggleCategory: (category: BookmarkCategory) => void;
  showAllCategories: () => void;
  hideAllCategories: () => void;
  setVisibleCategories: (categories: BookmarkCategory[]) => void;
  isCategoryVisible: (category: BookmarkCategory) => boolean;
  
  // Selection
  selectBookmark: (id: string | null) => void;
  setEditing: (editing: boolean) => void;
  
  // Import/Export
  exportToJSON: () => string;
  exportToURL: () => string;
  importFromJSON: (json: string) => { success: boolean; error?: string; count: number };
  importFromURL: (url: string) => { success: boolean; error?: string; count: number };
  
  // Initialization
  initializeForMatch: (matchId: string, matchDuration: number) => void;
}

export type BookmarkStore = BookmarkState & BookmarkActions;

// ============================================================================
// Constants
// ============================================================================

export const BOOKMARK_CATEGORIES: BookmarkCategory[] = [
  'kill',
  'plant',
  'defuse',
  'clutch',
  'ace',
  'multi-kill',
  'ability',
  'round-start',
  'round-end',
  'custom',
];

export const CATEGORY_COLORS: Record<BookmarkCategory, string> = {
  kill: '#ff4757',
  plant: '#fdcb6e',
  defuse: '#00b894',
  clutch: '#e17055',
  ace: '#a29bfe',
  'multi-kill': '#fd79a8',
  ability: '#74b9ff',
  'round-start': '#0984e3',
  'round-end': '#636e72',
  custom: '#dfe6e9',
};

export const CATEGORY_ICONS: Record<BookmarkCategory, string> = {
  kill: '💀',
  plant: '💣',
  defuse: '🛡️',
  clutch: '🔥',
  ace: '⭐',
  'multi-kill': '💥',
  ability: '✨',
  'round-start': '🚦',
  'round-end': '🏁',
  custom: '📌',
};

export const CATEGORY_LABELS: Record<BookmarkCategory, string> = {
  kill: 'Kill',
  plant: 'Spike Plant',
  defuse: 'Spike Defuse',
  clutch: 'Clutch',
  ace: 'Ace',
  'multi-kill': 'Multi-Kill',
  ability: 'Ability',
  'round-start': 'Round Start',
  'round-end': 'Round End',
  custom: 'Custom',
};

// ============================================================================
// Helper Functions
// ============================================================================

const generateId = (): string => {
  return `bm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const generateListId = (): string => {
  return `list-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

const matchesFilter = (bookmark: Bookmark, filter: BookmarkFilter): boolean => {
  if (filter.categories?.length && !filter.categories.includes(bookmark.category)) {
    return false;
  }
  
  if (filter.playerIds?.length && bookmark.playerId && !filter.playerIds.includes(bookmark.playerId)) {
    return false;
  }
  
  if (filter.roundNumbers?.length && bookmark.roundNumber !== undefined && 
      !filter.roundNumbers.includes(bookmark.roundNumber)) {
    return false;
  }
  
  if (filter.teamSides?.length && bookmark.teamSide && !filter.teamSides.includes(bookmark.teamSide)) {
    return false;
  }
  
  if (filter.tags?.length && !filter.tags.some(tag => bookmark.tags.includes(tag))) {
    return false;
  }
  
  if (filter.searchQuery) {
    const query = filter.searchQuery.toLowerCase();
    const searchable = [
      bookmark.label,
      bookmark.description,
      bookmark.playerName,
      ...bookmark.tags,
    ].filter(Boolean).join(' ').toLowerCase();
    
    if (!searchable.includes(query)) {
      return false;
    }
  }
  
  if (filter.timeRange) {
    if (bookmark.timestamp < filter.timeRange.start || bookmark.timestamp > filter.timeRange.end) {
      return false;
    }
  }
  
  return true;
};

const sortBookmarks = (bookmarks: Bookmark[], sort: BookmarkSortOptions): Bookmark[] => {
  return [...bookmarks].sort((a, b) => {
    let comparison = 0;
    
    switch (sort.field) {
      case 'timestamp':
        comparison = a.timestamp - b.timestamp;
        break;
      case 'createdAt':
        comparison = a.createdAt - b.createdAt;
        break;
      case 'label':
        comparison = a.label.localeCompare(b.label);
        break;
      case 'category':
        comparison = a.category.localeCompare(b.category);
        break;
    }
    
    return sort.direction === 'asc' ? comparison : -comparison;
  });
};

// ============================================================================
// Store Creation
// ============================================================================

const initialFilter: BookmarkFilter = {};
const initialSort: BookmarkSortOptions = { field: 'timestamp', direction: 'asc' };

const initialState: BookmarkState = {
  currentList: null,
  bookmarkLists: [],
  selectedBookmarkId: null,
  filter: initialFilter,
  sort: initialSort,
  isEditing: false,
  visibleCategories: new Set(BOOKMARK_CATEGORIES),
};

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    subscribeWithSelector(
      immer((set, get) => ({
        ...initialState,

        // Bookmark CRUD
        addBookmark: (bookmark): string => {
          const id = generateId();
          const now = Date.now();
          
          set(draft => {
            if (!draft.currentList) {
              draft.currentList = {
                id: generateListId(),
                name: 'Default',
                matchId: 'unknown',
                bookmarks: [],
                isDefault: true,
                isShared: false,
                createdAt: now,
                updatedAt: now,
              };
            }
            
            draft.currentList.bookmarks.push({
              ...bookmark,
              id,
              createdAt: now,
              updatedAt: now,
              color: bookmark.color || CATEGORY_COLORS[bookmark.category],
            });
            draft.currentList.updatedAt = now;
          });
          
          return id;
        },

        removeBookmark: (id) => {
          set(draft => {
            if (draft.currentList) {
              draft.currentList.bookmarks = draft.currentList.bookmarks.filter(bm => bm.id !== id);
              draft.currentList.updatedAt = Date.now();
              
              if (draft.selectedBookmarkId === id) {
                draft.selectedBookmarkId = null;
              }
            }
          });
        },

        updateBookmark: (id, updates) => {
          set(draft => {
            if (!draft.currentList) return;
            
            const bookmark = draft.currentList.bookmarks.find(bm => bm.id === id);
            if (bookmark) {
              Object.assign(bookmark, updates, { updatedAt: Date.now() });
              draft.currentList.updatedAt = Date.now();
            }
          });
        },

        getBookmark: (id) => {
          return get().currentList?.bookmarks.find(bm => bm.id === id);
        },

        // Bulk operations
        addBookmarks: (bookmarks) => {
          const now = Date.now();
          
          set(draft => {
            if (!draft.currentList) return;
            
            bookmarks.forEach(bookmark => {
              draft.currentList!.bookmarks.push({
                ...bookmark,
                id: generateId(),
                createdAt: now,
                updatedAt: now,
                color: bookmark.color || CATEGORY_COLORS[bookmark.category],
              });
            });
            
            draft.currentList.updatedAt = now;
          });
        },

        clearBookmarks: () => {
          set(draft => {
            if (draft.currentList) {
              draft.currentList.bookmarks = [];
              draft.currentList.updatedAt = Date.now();
              draft.selectedBookmarkId = null;
            }
          });
        },

        removeBookmarksByCategory: (category) => {
          set(draft => {
            if (!draft.currentList) return;
            
            draft.currentList.bookmarks = draft.currentList.bookmarks.filter(
              bm => bm.category !== category
            );
            draft.currentList.updatedAt = Date.now();
          });
        },

        removeBookmarksByRound: (roundNumber) => {
          set(draft => {
            if (!draft.currentList) return;
            
            draft.currentList.bookmarks = draft.currentList.bookmarks.filter(
              bm => bm.roundNumber !== roundNumber
            );
            draft.currentList.updatedAt = Date.now();
          });
        },

        // Navigation
        jumpToBookmark: (id) => {
          const bookmark = get().getBookmark(id);
          if (bookmark) {
            set(draft => {
              draft.selectedBookmarkId = id;
            });
          }
          return bookmark || null;
        },

        nextBookmark: (category) => {
          const state = get();
          if (!state.currentList) return null;
          
          const filtered = state.getFilteredBookmarks();
          if (filtered.length === 0) return null;
          
          let currentIndex = -1;
          if (state.selectedBookmarkId) {
            currentIndex = filtered.findIndex(bm => bm.id === state.selectedBookmarkId);
          }
          
          const nextIndex = (currentIndex + 1) % filtered.length;
          const next = filtered[nextIndex];
          
          set(draft => {
            draft.selectedBookmarkId = next.id;
          });
          
          return next;
        },

        prevBookmark: (category) => {
          const state = get();
          if (!state.currentList) return null;
          
          const filtered = state.getFilteredBookmarks();
          if (filtered.length === 0) return null;
          
          let currentIndex = filtered.length;
          if (state.selectedBookmarkId) {
            currentIndex = filtered.findIndex(bm => bm.id === state.selectedBookmarkId);
          }
          
          const prevIndex = currentIndex <= 0 ? filtered.length - 1 : currentIndex - 1;
          const prev = filtered[prevIndex];
          
          set(draft => {
            draft.selectedBookmarkId = prev.id;
          });
          
          return prev;
        },

        // List management
        createList: (name, matchId, description): string => {
          const id = generateListId();
          const now = Date.now();
          
          set(draft => {
            const newList: BookmarkList = {
              id,
              name,
              description,
              matchId,
              bookmarks: [],
              isDefault: draft.bookmarkLists.length === 0,
              isShared: false,
              createdAt: now,
              updatedAt: now,
            };
            
            draft.bookmarkLists.push(newList);
            draft.currentList = newList;
          });
          
          return id;
        },

        loadList: (id) => {
          set(draft => {
            const list = draft.bookmarkLists.find(l => l.id === id);
            if (list) {
              draft.currentList = list;
              draft.selectedBookmarkId = null;
            }
          });
        },

        deleteList: (id) => {
          set(draft => {
            draft.bookmarkLists = draft.bookmarkLists.filter(l => l.id !== id);
            
            if (draft.currentList?.id === id) {
              draft.currentList = draft.bookmarkLists[0] || null;
            }
          });
        },

        renameList: (id, name) => {
          set(draft => {
            const list = draft.bookmarkLists.find(l => l.id === id);
            if (list) {
              list.name = name;
              list.updatedAt = Date.now();
            }
          });
        },

        duplicateList: (id, newName): string => {
          const state = get();
          const list = state.bookmarkLists.find(l => l.id === id);
          if (!list) return '';
          
          const newId = generateListId();
          const now = Date.now();
          
          set(draft => {
            const duplicated: BookmarkList = {
              ...list,
              id: newId,
              name: newName,
              bookmarks: list.bookmarks.map(bm => ({
                ...bm,
                id: generateId(),
                createdAt: now,
                updatedAt: now,
              })),
              isDefault: false,
              createdAt: now,
              updatedAt: now,
            };
            
            draft.bookmarkLists.push(duplicated);
          });
          
          return newId;
        },

        setDefaultList: (id) => {
          set(draft => {
            draft.bookmarkLists.forEach(list => {
              list.isDefault = list.id === id;
            });
          });
        },

        // Filter & Sort
        setFilter: (filter) => {
          set(draft => {
            draft.filter = { ...draft.filter, ...filter };
          });
        },

        clearFilter: () => {
          set(draft => {
            draft.filter = {};
          });
        },

        setSort: (sort) => {
          set(draft => {
            draft.sort = sort;
          });
        },

        getFilteredBookmarks: () => {
          const state = get();
          if (!state.currentList) return [];
          
          let bookmarks = state.currentList.bookmarks.filter(bm => 
            matchesFilter(bm, state.filter) && state.visibleCategories.has(bm.category)
          );
          
          return sortBookmarks(bookmarks, state.sort);
        },

        // Category visibility
        toggleCategory: (category) => {
          set(draft => {
            if (draft.visibleCategories.has(category)) {
              draft.visibleCategories.delete(category);
            } else {
              draft.visibleCategories.add(category);
            }
          });
        },

        showAllCategories: () => {
          set(draft => {
            draft.visibleCategories = new Set(BOOKMARK_CATEGORIES);
          });
        },

        hideAllCategories: () => {
          set(draft => {
            draft.visibleCategories.clear();
          });
        },

        setVisibleCategories: (categories) => {
          set(draft => {
            draft.visibleCategories = new Set(categories);
          });
        },

        isCategoryVisible: (category) => {
          return get().visibleCategories.has(category);
        },

        // Selection
        selectBookmark: (id) => {
          set(draft => {
            draft.selectedBookmarkId = id;
          });
        },

        setEditing: (editing) => {
          set(draft => {
            draft.isEditing = editing;
          });
        },

        // Import/Export
        exportToJSON: (): string => {
          const state = get();
          if (!state.currentList) return '';
          
          const exportData = {
            version: '1.0',
            exportedAt: Date.now(),
            list: state.currentList,
          };
          
          return JSON.stringify(exportData, null, 2);
        },

        exportToURL: (): string => {
          const json = get().exportToJSON();
          if (!json) return '';
          
          const base64 = btoa(json);
          return `${window.location.origin}/replay?bookmarks=${encodeURIComponent(base64)}`;
        },

        importFromJSON: (json): { success: boolean; error?: string; count: number } => {
          try {
            const data = JSON.parse(json);
            
            if (!data.list || !Array.isArray(data.list.bookmarks)) {
              return { success: false, error: 'Invalid bookmark format', count: 0 };
            }
            
            const now = Date.now();
            const listId = generateListId();
            
            const importedList: BookmarkList = {
              ...data.list,
              id: listId,
              name: `${data.list.name} (Imported)`,
              bookmarks: data.list.bookmarks.map((bm: Bookmark) => ({
                ...bm,
                id: generateId(),
                createdAt: now,
                updatedAt: now,
              })),
              isDefault: false,
              createdAt: now,
              updatedAt: now,
            };
            
            set(draft => {
              draft.bookmarkLists.push(importedList);
              draft.currentList = importedList;
            });
            
            return { success: true, count: importedList.bookmarks.length };
          } catch (error) {
            return { 
              success: false, 
              error: error instanceof Error ? error.message : 'Unknown error', 
              count: 0 
            };
          }
        },

        importFromURL: (url): { success: boolean; error?: string; count: number } => {
          try {
            const urlObj = new URL(url);
            const base64 = urlObj.searchParams.get('bookmarks');
            
            if (!base64) {
              return { success: false, error: 'No bookmarks found in URL', count: 0 };
            }
            
            const json = atob(base64);
            return get().importFromJSON(json);
          } catch (error) {
            return { 
              success: false, 
              error: error instanceof Error ? error.message : 'Invalid URL', 
              count: 0 
            };
          }
        },

        // Initialization
        initializeForMatch: (matchId, matchDuration) => {
          set(draft => {
            // Check if we already have a list for this match
            const existingList = draft.bookmarkLists.find(l => l.matchId === matchId);
            
            if (existingList) {
              draft.currentList = existingList;
            } else {
              const now = Date.now();
              const newList: BookmarkList = {
                id: generateListId(),
                name: `Match Bookmarks`,
                matchId,
                bookmarks: [],
                isDefault: true,
                isShared: false,
                createdAt: now,
                updatedAt: now,
              };
              
              draft.bookmarkLists.push(newList);
              draft.currentList = newList;
            }
            
            draft.selectedBookmarkId = null;
            draft.filter = {};
          });
        },
      }))
    ),
    {
      name: 'sator-bookmarks-storage',
      partialize: (state) => ({
        bookmarkLists: state.bookmarkLists,
        visibleCategories: Array.from(state.visibleCategories),
      }),
      onRehydrateStorage: () => (state) => {
        // Restore Set from array
        if (state && Array.isArray(state.visibleCategories)) {
          state.visibleCategories = new Set(state.visibleCategories);
        }
      },
    }
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const useCurrentBookmarkList = () => useBookmarkStore(state => state.currentList);
export const useBookmarkLists = () => useBookmarkStore(state => state.bookmarkLists);
export const useCurrentBookmarks = () => 
  useBookmarkStore(state => state.currentList?.bookmarks || []);
export const useFilteredBookmarks = () => useBookmarkStore(state => state.getFilteredBookmarks());
export const useSelectedBookmark = () => {
  const store = useBookmarkStore();
  return store.selectedBookmarkId ? store.getBookmark(store.selectedBookmarkId) : null;
};
export const useBookmarkFilter = () => useBookmarkStore(state => state.filter);
export const useBookmarkSort = () => useBookmarkStore(state => state.sort);
export const useVisibleCategories = () => useBookmarkStore(state => state.visibleCategories);

// ============================================================================
// Utility Hooks
// ============================================================================

export function useBookmarkAtTime(timestamp: number, toleranceMs = 100): Bookmark | null {
  const bookmarks = useCurrentBookmarks();
  
  return bookmarks.find(bm => 
    Math.abs(bm.timestamp - timestamp) <= toleranceMs
  ) || null;
}

export function useBookmarksInRange(startTime: number, endTime: number): Bookmark[] {
  const bookmarks = useCurrentBookmarks();
  
  return bookmarks.filter(bm => 
    bm.timestamp >= startTime && bm.timestamp <= endTime
  );
}

export default useBookmarkStore;
