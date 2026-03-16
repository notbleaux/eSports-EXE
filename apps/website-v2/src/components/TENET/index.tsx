/** [Ver001.000] */
/**
 * TENET Ascension Module
 * ======================
 * Central hub framework with 50-component UI library.
 * OAuth + 2FA Implementation
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
  usePushEnabled,
  usePushPermission,
  usePushSubscription,
  useNotificationPreferences,
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

// ============================================================================
// Auth Components - OAuth + 2FA
// ============================================================================

export {
  OAuthButtons,
  OAuthButton,
  type OAuthButtonsProps,
  type OAuthButtonProps,
  type OAuthProvider,
  type OAuthTokens,
} from './components/auth/OAuthButtons';

export {
  TwoFactorSetup,
  type TwoFactorSetupProps,
  type SetupState,
} from './components/auth/TwoFactorSetup';

export {
  TwoFactorVerify,
  type TwoFactorVerifyProps,
} from './components/auth/TwoFactorVerify';

// ============================================================================
// Settings Components
// ============================================================================

export { NotificationPreferences } from './components/settings/NotificationPreferences';

// ============================================================================
// Push Notifications
// ============================================================================

export {
  // Services
  isPushSupported,
  getPermissionStatus,
  requestPermission,
  subscribe,
  unsubscribe,
  isSubscribed,
  getCurrentSubscription,
  fetchPreferences,
  updatePreferences,
  sendTestNotification,
  initializePushNotifications,
  onServiceWorkerMessage,
  // Types
  type PushSubscription,
  type PushSubscriptionKeys,
  type NotificationCategory,
  type PermissionStatus,
  type PushServiceState,
} from './services/pushNotifications';

// ============================================================================
// Auth Hooks (placeholder - to be implemented)
// ============================================================================

export const AuthProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>;
export const useAuth = () => ({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
});
