/** [Ver001.000] */
/**
 * TENET Central State Store
 * =========================
 * Zustand-based global state management for cross-hub functionality.
 */

import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

// ============================================================================
// Type Definitions
// ============================================================================

export type HubType = 'sator' | 'rotas' | 'arepo' | 'opera' | 'tenet';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'user' | 'premium' | 'admin';
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  compactMode: boolean;
  defaultHub: HubType;
}

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  hub?: HubType;
}

export interface SearchState {
  query: string;
  results: SearchResult[];
  isLoading: boolean;
  filters: SearchFilters;
  recentSearches: string[];
}

export interface SearchResult {
  id: string;
  type: 'player' | 'team' | 'match' | 'article' | 'video';
  title: string;
  subtitle?: string;
  hub: HubType;
  url: string;
  relevance: number;
}

export interface SearchFilters {
  hubs: HubType[];
  types: string[];
  dateRange?: { start: Date; end: Date };
}

export interface UIState {
  sidebarOpen: boolean;
  activeHub: HubType;
  modalStack: string[];
  toastQueue: Notification[];
  isLoading: boolean;
}

// ============================================================================
// Store State Interface
// ============================================================================

interface TENETState {
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  authToken: string | null;
  
  // UI
  ui: UIState;
  
  // Search
  search: SearchState;
  
  // Notifications
  notifications: Notification[];
  unreadCount: number;
  
  // Hub-specific data (lazy loaded)
  hubData: Record<HubType, Record<string, unknown>>;
}

interface TENETActions {
  // Auth actions
  setUser: (user: User | null) => void;
  setAuthToken: (token: string | null) => void;
  logout: () => void;
  updatePreferences: (prefs: Partial<UserPreferences>) => void;
  
  // UI actions
  setSidebarOpen: (open: boolean) => void;
  setActiveHub: (hub: HubType) => void;
  pushModal: (modalId: string) => void;
  popModal: () => void;
  showToast: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  dismissToast: (id: string) => void;
  setLoading: (loading: boolean) => void;
  
  // Search actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: SearchResult[]) => void;
  setSearchLoading: (loading: boolean) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setSearchFilters: (filters: Partial<SearchFilters>) => void;
  
  // Notification actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  dismissNotification: (id: string) => void;
  
  // Hub data actions
  setHubData: (hub: HubType, key: string, data: unknown) => void;
  getHubData: (hub: HubType, key: string) => unknown;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: TENETState = {
  user: null,
  isAuthenticated: false,
  authToken: null,
  
  ui: {
    sidebarOpen: true,
    activeHub: 'tenet',
    modalStack: [],
    toastQueue: [],
    isLoading: false,
  },
  
  search: {
    query: '',
    results: [],
    isLoading: false,
    filters: {
      hubs: ['sator', 'rotas', 'arepo', 'opera', 'tenet'],
      types: [],
    },
    recentSearches: [],
  },
  
  notifications: [],
  unreadCount: 0,
  
  hubData: {
    sator: {},
    rotas: {},
    arepo: {},
    opera: {},
    tenet: {},
  },
};

// ============================================================================
// Store Creation
// ============================================================================

export const useTENETStore = create<TENETState & TENETActions>()(
  subscribeWithSelector(
    immer(
      persist(
        (set, get) => ({
          ...initialState,
          
          // Auth actions
          setUser: (user) => {
            set((state) => {
              state.user = user;
              state.isAuthenticated = !!user;
            });
          },
          
          setAuthToken: (token) => {
            set((state) => {
              state.authToken = token;
            });
          },
          
          logout: () => {
            set((state) => {
              state.user = null;
              state.isAuthenticated = false;
              state.authToken = null;
            });
          },
          
          updatePreferences: (prefs) => {
            set((state) => {
              if (state.user) {
                state.user.preferences = { ...state.user.preferences, ...prefs };
              }
            });
          },
          
          // UI actions
          setSidebarOpen: (open) => {
            set((state) => {
              state.ui.sidebarOpen = open;
            });
          },
          
          setActiveHub: (hub) => {
            set((state) => {
              state.ui.activeHub = hub;
            });
          },
          
          pushModal: (modalId) => {
            set((state) => {
              state.ui.modalStack.push(modalId);
            });
          },
          
          popModal: () => {
            set((state) => {
              state.ui.modalStack.pop();
            });
          },
          
          showToast: (notification) => {
            const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            set((state) => {
              state.ui.toastQueue.push({
                ...notification,
                id,
                timestamp: Date.now(),
                read: false,
              });
            });
          },
          
          dismissToast: (id) => {
            set((state) => {
              state.ui.toastQueue = state.ui.toastQueue.filter((t) => t.id !== id);
            });
          },
          
          setLoading: (loading) => {
            set((state) => {
              state.ui.isLoading = loading;
            });
          },
          
          // Search actions
          setSearchQuery: (query) => {
            set((state) => {
              state.search.query = query;
            });
          },
          
          setSearchResults: (results) => {
            set((state) => {
              state.search.results = results;
            });
          },
          
          setSearchLoading: (loading) => {
            set((state) => {
              state.search.isLoading = loading;
            });
          },
          
          addRecentSearch: (query) => {
            set((state) => {
              state.search.recentSearches = [
                query,
                ...state.search.recentSearches.filter((s) => s !== query).slice(0, 9),
              ];
            });
          },
          
          clearRecentSearches: () => {
            set((state) => {
              state.search.recentSearches = [];
            });
          },
          
          setSearchFilters: (filters) => {
            set((state) => {
              state.search.filters = { ...state.search.filters, ...filters };
            });
          },
          
          // Notification actions
          addNotification: (notification) => {
            const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            set((state) => {
              state.notifications.unshift({
                ...notification,
                id,
                timestamp: Date.now(),
                read: false,
              });
              state.unreadCount += 1;
            });
          },
          
          markNotificationRead: (id) => {
            set((state) => {
              const notif = state.notifications.find((n) => n.id === id);
              if (notif && !notif.read) {
                notif.read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              }
            });
          },
          
          markAllNotificationsRead: () => {
            set((state) => {
              state.notifications.forEach((n) => {
                n.read = true;
              });
              state.unreadCount = 0;
            });
          },
          
          dismissNotification: (id) => {
            set((state) => {
              const notif = state.notifications.find((n) => n.id === id);
              if (notif && !notif.read) {
                state.unreadCount = Math.max(0, state.unreadCount - 1);
              }
              state.notifications = state.notifications.filter((n) => n.id !== id);
            });
          },
          
          // Hub data actions
          setHubData: (hub, key, data) => {
            set((state) => {
              state.hubData[hub][key] = data;
            });
          },
          
          getHubData: (hub, key) => {
            return get().hubData[hub][key];
          },
        }),
        {
          name: 'tenet-store',
          partialize: (state) => ({
            user: state.user,
            isAuthenticated: state.isAuthenticated,
            ui: {
              sidebarOpen: state.ui.sidebarOpen,
              activeHub: state.ui.activeHub,
            },
            search: {
              recentSearches: state.search.recentSearches,
            },
          }),
        }
      )
    )
  )
);

// ============================================================================
// Selectors (for computed values)
// ============================================================================

export const selectUnreadNotifications = (state: TENETState) =>
  state.notifications.filter((n) => !n.read);

export const selectHubNotifications = (hub: HubType) => (state: TENETState) =>
  state.notifications.filter((n) => n.hub === hub);

export const selectIsModalOpen = (modalId: string) => (state: TENETState) =>
  state.ui.modalStack.includes(modalId);

export const selectSearchResultsByHub = (hub: HubType) => (state: TENETState) =>
  state.search.results.filter((r) => r.hub === hub);

// ============================================================================
// Hooks (convenience)
// ============================================================================

export const useUser = () => useTENETStore((state) => state.user);
export const useIsAuthenticated = () => useTENETStore((state) => state.isAuthenticated);
export const useActiveHub = () => useTENETStore((state) => state.ui.activeHub);
export const useSearchQuery = () => useTENETStore((state) => state.search.query);
export const useSearchResults = () => useTENETStore((state) => state.search.results);
export const useNotifications = () => useTENETStore((state) => state.notifications);
export const useUnreadCount = () => useTENETStore((state) => state.unreadCount);

export default useTENETStore;
