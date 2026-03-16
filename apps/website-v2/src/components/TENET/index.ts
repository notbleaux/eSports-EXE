/** [Ver001.000] */
/**
 * TENET Ascension Module
 * ======================
 * Central hub framework with 50-component UI library.
 */

// Design System
export { default as tokens } from './design-system/tokens.json';

// Store
export {
  useTENETStore,
  useUser,
  useIsAuthenticated,
  useActiveHub,
  useSearchQuery,
  useSearchResults,
  useNotifications,
  useUnreadCount,
  selectUnreadNotifications,
  selectHubNotifications,
  selectIsModalOpen,
  selectSearchResultsByHub,
  type HubType,
  type User,
  type UserPreferences,
  type Notification,
  type SearchState,
  type SearchResult,
  type SearchFilters,
  type UIState,
} from './store';

// UI Components
export * from './ui';

// Auth (placeholder)
export const AuthProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const useAuth = () => ({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});

// Notifications (placeholder)
export const NotificationProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const usePushNotifications = () => ({
  subscribe: () => Promise.resolve(),
  unsubscribe: () => Promise.resolve(),
});

// Search (placeholder)
export const useCrossHubSearch = () => ({
  query: '',
  results: [],
  isLoading: false,
  search: () => {},
});
