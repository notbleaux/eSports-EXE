/**
 * User Role Types and Configuration
 * 
 * SECURITY NOTE: All localStorage data is validated against PREFERENCES_SCHEMA
 * to prevent XSS and data corruption from tampered storage.
 */

/**
 * User Preferences Schema for validation
 */
const PREFERENCES_SCHEMA = {
  // Allowed keys and their types
  unlockedFeatures: { type: 'array', itemType: 'string', default: [] },
  tipsSeen: { type: 'array', itemType: 'string', default: [] },
  role: { type: 'string', allowed: ['player', 'organizer', 'spectator'], default: null },
  theme: { type: 'string', allowed: ['light', 'dark', 'auto'], default: 'auto' },
  onboardingComplete: { type: 'boolean', default: false },
  lastVisited: { type: 'number', default: null },
};

/**
 * Validate value against schema
 * @param {*} value - Value to validate
 * @param {Object} schema - Schema definition
 * @returns {*} - Validated value or default
 */
function validateValue(value, schema) {
  if (value === undefined || value === null) {
    return schema.default;
  }

  switch (schema.type) {
    case 'string':
      if (typeof value !== 'string') return schema.default;
      if (schema.allowed && !schema.allowed.includes(value)) return schema.default;
      // Sanitize string - remove control characters
      return value.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 1000);
    
    case 'array':
      if (!Array.isArray(value)) return schema.default;
      // Validate array items
      return value
        .filter(item => typeof item === schema.itemType)
        .map(item => 
          typeof item === 'string' 
            ? item.replace(/[\x00-\x1F\x7F]/g, '').slice(0, 500)
            : item
        )
        .slice(0, 1000); // Limit array size
    
    case 'boolean':
      return typeof value === 'boolean' ? value : schema.default;
    
    case 'number':
      if (typeof value !== 'number' || !isFinite(value)) return schema.default;
      return Math.max(0, Math.min(Number.MAX_SAFE_INTEGER, value));
    
    default:
      return schema.default;
  }
}

/**
 * Validate and sanitize user preferences
 * @param {Object} prefs - Raw preferences object
 * @returns {Object} - Validated preferences
 */
function validatePreferences(prefs) {
  if (!prefs || typeof prefs !== 'object' || Array.isArray(prefs)) {
    return {};
  }

  const validated = {};
  
  // Only allow known keys
  for (const [key, schema] of Object.entries(PREFERENCES_SCHEMA)) {
    if (key in prefs) {
      validated[key] = validateValue(prefs[key], schema);
    }
  }
  
  return validated;
}

export const USER_ROLES = {
  PLAYER: {
    id: 'player',
    label: 'Player',
    description: 'Track stats, analyze performance, and improve your game',
    color: '#22c55e', // Green
    colorClass: 'role-player',
    icon: '🎮',
    hubPriority: ['rotas', 'sator'],
    dashboardFocus: 'stats',
    shortcuts: ['/matches', '/stats', '/progress']
  },
  ORGANIZER: {
    id: 'organizer',
    label: 'Organizer',
    description: 'Create tournaments, manage teams, and run events',
    color: '#f59e0b', // Gold/Amber
    colorClass: 'role-organizer',
    icon: '🏆',
    hubPriority: ['sator', 'rotas'],
    dashboardFocus: 'tournaments',
    shortcuts: ['/tournaments', '/teams', '/schedules']
  },
  SPECTATOR: {
    id: 'spectator',
    label: 'Spectator',
    description: 'Watch live matches, follow teams, and stay updated',
    color: '#3b82f6', // Blue
    colorClass: 'role-spectator',
    icon: '👁️',
    hubPriority: ['rotas', 'sator'],
    dashboardFocus: 'live',
    shortcuts: ['/live', '/schedule', '/highlights']
  }
};

export const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    title: 'Welcome to NJZ Analytics',
    description: 'Choose your path to get started'
  },
  {
    id: 'twin-file',
    title: 'Twin-File Architecture',
    description: 'Understanding SATOR and ROTAS'
  },
  {
    id: 'features',
    title: 'Feature Highlights',
    description: 'Discover what you can do'
  },
  {
    id: 'tier',
    title: 'Choose Your Tier',
    description: 'Select the plan that fits your needs'
  }
];

export const FEATURE_HIGHLIGHTS = {
  player: [
    { icon: '📊', title: 'Performance Analytics', desc: 'Deep dive into your match statistics' },
    { icon: '🎯', title: 'Skill Tracking', desc: 'Monitor your progress over time' },
    { icon: '🔥', title: 'Heat Maps', desc: 'Visualize your positioning patterns' },
    { icon: '⚡', title: 'Live Replay', desc: 'Review your matches with advanced tools' }
  ],
  organizer: [
    { icon: '🏆', title: 'Tournament Creation', desc: 'Set up brackets and manage events' },
    { icon: '👥', title: 'Team Management', desc: 'Organize rosters and track performance' },
    { icon: '📅', title: 'Scheduling', desc: 'Coordinate matches and broadcast times' },
    { icon: '📈', title: 'Analytics Dashboard', desc: 'Track engagement and viewership' }
  ],
  spectator: [
    { icon: '🎥', title: 'Live Matches', desc: 'Watch tournaments in real-time' },
    { icon: '🔔', title: 'Notifications', desc: 'Get alerts for your favorite teams' },
    { icon: '💬', title: 'Live Chat', desc: 'Engage with the community' },
    { icon: '📱', title: 'Mobile App', desc: 'Watch on the go' }
  ]
};

export const TIER_OPTIONS = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    description: 'Get started with basic features',
    features: ['Access to public data', 'Basic analytics', 'Community support']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$9/mo',
    description: 'Unlock advanced features',
    features: ['Advanced analytics', 'Priority support', 'Custom dashboards', 'Export data'],
    recommended: true
  },
  {
    id: 'team',
    name: 'Team',
    price: '$29/mo',
    description: 'For teams and organizations',
    features: ['Everything in Pro', 'Team management', 'API access', 'Dedicated support']
  }
];

/**
 * Get role configuration by ID
 */
export function getRoleConfig(roleId) {
  return USER_ROLES[roleId.toUpperCase()] || USER_ROLES.PLAYER;
}

/**
 * Check if user has completed onboarding
 */
export function hasCompletedOnboarding() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem('njz_onboarding_complete') === 'true';
}

/**
 * Get stored user role
 */
export function getStoredRole() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('njz_user_role');
}

/**
 * Get stored user preferences with validation
 * @returns {Object} - Validated user preferences
 */
export function getUserPreferences() {
  if (typeof window === 'undefined') return {};
  try {
    const prefs = localStorage.getItem('njz_user_preferences');
    if (!prefs) return {};
    
    // Parse and validate
    const parsed = JSON.parse(prefs);
    return validatePreferences(parsed);
  } catch (error) {
    // Invalid JSON or validation error - clear corrupted data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('njz_user_preferences');
    }
    return {};
  }
}
    return prefs ? JSON.parse(prefs) : {};
  } catch {
    return {};
  }
}

/**
 * Save user role
 */
export function saveUserRole(roleId) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('njz_user_role', roleId);
}

/**
 * Save onboarding completion
 */
export function completeOnboarding() {
  if (typeof window === 'undefined') return;
  localStorage.setItem('njz_onboarding_complete', 'true');
}

/**
 * Save user preferences
 */
export function saveUserPreferences(prefs) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('njz_user_preferences', JSON.stringify(prefs));
}

/**
 * Reset onboarding (for testing)
 */
export function resetOnboarding() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('njz_onboarding_complete');
  localStorage.removeItem('njz_user_role');
  localStorage.removeItem('njz_user_preferences');
}

/**
 * Get dashboard config based on role
 */
export function getDashboardConfig(roleId) {
  const role = getRoleConfig(roleId);
  
  const configs = {
    player: {
      title: 'Player Dashboard',
      sections: ['stats-overview', 'recent-matches', 'performance-trends', 'goals'],
      primaryColor: role.color,
      quickActions: [
        { label: 'View Stats', icon: '📊', href: '/stats' },
        { label: 'Upload Replay', icon: '📁', href: '/upload' },
        { label: 'Compare', icon: '⚖️', href: '/compare' }
      ]
    },
    organizer: {
      title: 'Organizer Dashboard',
      sections: ['tournaments', 'teams', 'upcoming-events', 'analytics'],
      primaryColor: role.color,
      quickActions: [
        { label: 'New Tournament', icon: '➕', href: '/tournaments/new' },
        { label: 'Manage Teams', icon: '👥', href: '/teams' },
        { label: 'Schedule', icon: '📅', href: '/schedule' }
      ]
    },
    spectator: {
      title: 'Spectator Dashboard',
      sections: ['live-now', 'upcoming', 'favorites', 'highlights'],
      primaryColor: role.color,
      quickActions: [
        { label: 'Watch Live', icon: '🔴', href: '/live' },
        { label: 'Browse', icon: '🔍', href: '/browse' },
        { label: 'Following', icon: '⭐', href: '/following' }
      ]
    }
  };
  
  return configs[roleId] || configs.player;
}
