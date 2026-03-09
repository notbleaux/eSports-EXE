/**
 * User Preferences Management
 * Handles role selection, onboarding state, and dashboard configuration
 */

// User Roles
export const USER_ROLES = {
  FAN: 'fan',
  ANALYST: 'analyst',
  COACH: 'coach',
  DEVELOPER: 'developer'
};

// Role Configurations
export const ROLE_CONFIGS = {
  [USER_ROLES.FAN]: {
    name: 'Fan',
    description: 'Follow matches and favorite teams',
    features: ['favorites', 'match_tracking', 'basic_analytics'],
    defaultDashboard: 'fan-dashboard'
  },
  [USER_ROLES.ANALYST]: {
    name: 'Analyst',
    description: 'Deep dive into match statistics',
    features: ['advanced_analytics', 'data_export', 'comparison_tools'],
    defaultDashboard: 'analyst-dashboard'
  },
  [USER_ROLES.COACH]: {
    name: 'Coach',
    description: 'Team management and strategy tools',
    features: ['team_management', 'strategy_tools', 'player_stats'],
    defaultDashboard: 'coach-dashboard'
  },
  [USER_ROLES.DEVELOPER]: {
    name: 'Developer',
    description: 'API access and integration tools',
    features: ['api_access', 'webhooks', 'raw_data'],
    defaultDashboard: 'developer-dashboard'
  }
};

// Storage Keys
const STORAGE_KEYS = {
  USER_ROLE: 'njz_user_role',
  ONBOARDING_COMPLETE: 'njz_onboarding_complete',
  DASHBOARD_CONFIG: 'njz_dashboard_config',
  USER_PREFERENCES: 'njz_preferences'
};

/**
 * Get stored user role
 * @returns {string|null}
 */
export function getStoredRole() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(STORAGE_KEYS.USER_ROLE);
}

/**
 * Save user role
 * @param {string} role
 */
export function saveUserRole(role) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
}

/**
 * Get role configuration
 * @param {string} role
 * @returns {object}
 */
export function getRoleConfig(role) {
  return ROLE_CONFIGS[role] || ROLE_CONFIGS[USER_ROLES.FAN];
}

/**
 * Check if user has completed onboarding
 * @returns {boolean}
 */
export function hasCompletedOnboarding() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';
}

/**
 * Mark onboarding as complete
 */
export function completeOnboarding() {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
}

/**
 * Get dashboard configuration
 * @returns {object}
 */
export function getDashboardConfig() {
  if (typeof window === 'undefined') return {};
  const config = localStorage.getItem(STORAGE_KEYS.DASHBOARD_CONFIG);
  return config ? JSON.parse(config) : {};
}

/**
 * Save dashboard configuration
 * @param {object} config
 */
export function saveDashboardConfig(config) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.DASHBOARD_CONFIG, JSON.stringify(config));
}

/**
 * Get user preferences
 * @returns {object}
 */
export function getUserPreferences() {
  if (typeof window === 'undefined') return {};
  const prefs = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
  return prefs ? JSON.parse(prefs) : {};
}

/**
 * Save user preferences
 * @param {object} prefs
 */
export function saveUserPreferences(prefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(prefs));
}

export default {
  USER_ROLES,
  ROLE_CONFIGS,
  getStoredRole,
  saveUserRole,
  getRoleConfig,
  hasCompletedOnboarding,
  completeOnboarding,
  getDashboardConfig,
  saveDashboardConfig,
  getUserPreferences,
  saveUserPreferences
};
