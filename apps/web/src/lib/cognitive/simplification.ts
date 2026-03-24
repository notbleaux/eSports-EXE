/** [Ver001.000]
 * Cognitive Load Simplification Rules
 * ===================================
 * Rules and configuration for reducing UI complexity based on cognitive load.
 * 
 * Features:
 * - Configurable simplification rules
 * - Progressive disclosure management
 * - Accessibility-focused simplifications
 * - Hub-specific rule sets
 * 
 * Integration:
 * - Used by AdaptiveUI component
 * - Works with cognitive load detector
 * - Applies to all hub components
 * 
 * @module lib/cognitive/simplification
 */

import type {
  SimplificationRule,
  SimplificationConfig,
  SimplificationLevel,
  CognitiveLoadLevel,
} from './types';

// ============================================================================
// Default Rules
// ============================================================================

/**
 * Default simplification rules
 */
export const DEFAULT_SIMPLIFICATION_RULES: SimplificationRule[] = [
  // Low load - subtle improvements
  {
    id: 'highlight-required-fields',
    name: 'Highlight Required Fields',
    description: 'Visually emphasize required form fields',
    triggerLevel: 'low',
    minScore: 20,
    action: 'highlight',
    target: '[data-required="true"]',
    priority: 10,
    enabled: true,
  },
  {
    id: 'show-progress-indicators',
    name: 'Show Progress Indicators',
    description: 'Display progress bars for multi-step processes',
    triggerLevel: 'low',
    minScore: 25,
    action: 'highlight',
    target: '[data-progress-tracker]',
    priority: 20,
    enabled: true,
  },

  // Medium load - moderate simplifications
  {
    id: 'collapse-advanced-sections',
    name: 'Collapse Advanced Sections',
    description: 'Collapse optional advanced configuration sections',
    triggerLevel: 'medium',
    minScore: 40,
    action: 'collapse',
    target: '[data-advanced="true"]',
    priority: 30,
    enabled: true,
  },
  {
    id: 'hide-optional-fields',
    name: 'Hide Optional Fields',
    description: 'Hide optional form fields behind toggle',
    triggerLevel: 'medium',
    minScore: 45,
    action: 'hide',
    target: '[data-optional="true"]',
    priority: 40,
    enabled: true,
  },
  {
    id: 'simplify-navigation',
    name: 'Simplify Navigation',
    description: 'Show only primary navigation items',
    triggerLevel: 'medium',
    minScore: 50,
    action: 'simplify',
    target: '[data-nav-item="secondary"]',
    priority: 50,
    enabled: true,
  },

  // High load - aggressive simplifications
  {
    id: 'reduce-motion',
    name: 'Reduce Motion',
    description: 'Disable non-essential animations',
    triggerLevel: 'high',
    minScore: 65,
    action: 'reduce-motion',
    target: '*',
    priority: 60,
    enabled: true,
  },
  {
    id: 'enlarge-text',
    name: 'Enlarge Text',
    description: 'Increase text size for better readability',
    triggerLevel: 'high',
    minScore: 70,
    action: 'enlarge',
    target: 'text, p, span, label, button',
    priority: 70,
    enabled: true,
  },
  {
    id: 'hide-non-essential',
    name: 'Hide Non-Essential Elements',
    description: 'Hide decorative and non-essential UI elements',
    triggerLevel: 'high',
    minScore: 75,
    action: 'hide',
    target: '[data-essential="false"], .decorative',
    priority: 80,
    enabled: true,
  },
  {
    id: 'simplify-hub-content',
    name: 'Simplify Hub Content',
    description: 'Show simplified view of hub components',
    triggerLevel: 'high',
    minScore: 80,
    action: 'simplify',
    target: '[data-hub-content]',
    priority: 90,
    enabled: true,
  },

  // Critical load - maximum simplification
  {
    id: 'focus-mode',
    name: 'Enable Focus Mode',
    description: 'Show only the current task/element',
    triggerLevel: 'critical',
    minScore: 85,
    action: 'hide',
    target: '[data-focus-only="false"]',
    priority: 100,
    enabled: true,
  },
  {
    id: 'voice-guidance',
    name: 'Enable Voice Guidance',
    description: 'Provide audio guidance for navigation',
    triggerLevel: 'critical',
    minScore: 90,
    action: 'highlight',
    target: '[data-voice-guide]',
    priority: 110,
    enabled: true,
  },
];

// ============================================================================
// Simplification Configurations
// ============================================================================

/**
 * Simplification configs by level
 */
export const SIMPLIFICATION_CONFIGS: Record<SimplificationLevel, SimplificationConfig> = {
  none: {
    level: 'none',
    rules: [],
    automatic: false,
    userOverride: null,
    features: {
      hideOptionalFields: false,
      collapseAdvancedSections: false,
      enlargeText: false,
      reduceMotion: false,
      simplifyNavigation: false,
      highlightRequiredFields: false,
      showProgressIndicators: false,
      enableVoiceGuidance: false,
    },
  },
  subtle: {
    level: 'subtle',
    rules: DEFAULT_SIMPLIFICATION_RULES.filter(r => r.triggerLevel === 'low'),
    automatic: true,
    userOverride: null,
    features: {
      hideOptionalFields: false,
      collapseAdvancedSections: false,
      enlargeText: false,
      reduceMotion: false,
      simplifyNavigation: false,
      highlightRequiredFields: true,
      showProgressIndicators: true,
      enableVoiceGuidance: false,
    },
  },
  moderate: {
    level: 'moderate',
    rules: DEFAULT_SIMPLIFICATION_RULES.filter(r => 
      r.triggerLevel === 'low' || r.triggerLevel === 'medium'
    ),
    automatic: true,
    userOverride: null,
    features: {
      hideOptionalFields: true,
      collapseAdvancedSections: true,
      enlargeText: false,
      reduceMotion: false,
      simplifyNavigation: true,
      highlightRequiredFields: true,
      showProgressIndicators: true,
      enableVoiceGuidance: false,
    },
  },
  aggressive: {
    level: 'aggressive',
    rules: DEFAULT_SIMPLIFICATION_RULES.filter(r => 
      r.triggerLevel === 'low' || 
      r.triggerLevel === 'medium' || 
      r.triggerLevel === 'high'
    ),
    automatic: true,
    userOverride: null,
    features: {
      hideOptionalFields: true,
      collapseAdvancedSections: true,
      enlargeText: true,
      reduceMotion: true,
      simplifyNavigation: true,
      highlightRequiredFields: true,
      showProgressIndicators: true,
      enableVoiceGuidance: true,
    },
  },
};

// ============================================================================
// Load Level Mapping
// ============================================================================

/**
 * Map cognitive load level to simplification level
 */
export const LOAD_TO_SIMPLIFICATION_MAP: Record<CognitiveLoadLevel, SimplificationLevel> = {
  low: 'none',
  medium: 'subtle',
  high: 'moderate',
  critical: 'aggressive',
};

/**
 * Get simplification level for cognitive load
 */
export function getSimplificationLevelForLoad(
  loadLevel: CognitiveLoadLevel
): SimplificationLevel {
  return LOAD_TO_SIMPLIFICATION_MAP[loadLevel];
}

/**
 * Get simplification config for cognitive load
 */
export function getSimplificationConfigForLoad(
  loadLevel: CognitiveLoadLevel
): SimplificationConfig {
  const level = getSimplificationLevelForLoad(loadLevel);
  return SIMPLIFICATION_CONFIGS[level];
}

// ============================================================================
// Rule Management
// ============================================================================

/**
 * Get active rules for a simplification level
 */
export function getActiveRules(
  level: SimplificationLevel,
  customRules?: SimplificationRule[]
): SimplificationRule[] {
  const rules = customRules || DEFAULT_SIMPLIFICATION_RULES;
  
  const levelThreshold: Record<SimplificationLevel, number> = {
    none: 0,
    subtle: 1,
    moderate: 2,
    aggressive: 3,
  };

  const targetThreshold = levelThreshold[level];

  return rules
    .filter(rule => {
      const ruleLevelValue: Record<CognitiveLoadLevel, number> = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
      };
      return rule.enabled && ruleLevelValue[rule.triggerLevel] <= targetThreshold;
    })
    .sort((a, b) => b.priority - a.priority);
}

/**
 * Add custom simplification rule
 */
export function addSimplificationRule(
  config: SimplificationConfig,
  rule: SimplificationRule
): SimplificationConfig {
  return {
    ...config,
    rules: [...config.rules, rule],
  };
}

/**
 * Remove simplification rule
 */
export function removeSimplificationRule(
  config: SimplificationConfig,
  ruleId: string
): SimplificationConfig {
  return {
    ...config,
    rules: config.rules.filter(r => r.id !== ruleId),
  };
}

/**
 * Toggle rule enabled state
 */
export function toggleRuleEnabled(
  config: SimplificationConfig,
  ruleId: string
): SimplificationConfig {
  return {
    ...config,
    rules: config.rules.map(r =>
      r.id === ruleId ? { ...r, enabled: !r.enabled } : r
    ),
  };
}

/**
 * Update rule configuration
 */
export function updateRule(
  config: SimplificationConfig,
  ruleId: string,
  updates: Partial<Omit<SimplificationRule, 'id'>>
): SimplificationConfig {
  return {
    ...config,
    rules: config.rules.map(r =>
      r.id === ruleId ? { ...r, ...updates } as SimplificationRule : r
    ),
  };
}

// ============================================================================
// Feature Flags
// ============================================================================

/**
 * Toggle feature flag
 */
export function toggleFeature(
  config: SimplificationConfig,
  feature: keyof SimplificationConfig['features']
): SimplificationConfig {
  return {
    ...config,
    features: {
      ...config.features,
      [feature]: !config.features[feature],
    },
  };
}

/**
 * Set feature flag
 */
export function setFeature(
  config: SimplificationConfig,
  feature: keyof SimplificationConfig['features'],
  enabled: boolean
): SimplificationConfig {
  return {
    ...config,
    features: {
      ...config.features,
      [feature]: enabled,
    },
  };
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(
  config: SimplificationConfig,
  feature: keyof SimplificationConfig['features']
): boolean {
  return config.features[feature];
}

// ============================================================================
// User Override
// ============================================================================

/**
 * Set user override for simplification
 */
export function setUserOverride(
  config: SimplificationConfig,
  level: SimplificationLevel | null
): SimplificationConfig {
  return {
    ...config,
    userOverride: level,
    automatic: level === null,
  };
}

/**
 * Get effective simplification level (respects user override)
 */
export function getEffectiveLevel(config: SimplificationConfig): SimplificationLevel {
  return config.userOverride || config.level;
}

/**
 * Clear user override
 */
export function clearUserOverride(config: SimplificationConfig): SimplificationConfig {
  return {
    ...config,
    userOverride: null,
    automatic: true,
  };
}

// ============================================================================
// CSS Classes
// ============================================================================

/**
 * CSS classes for simplification levels
 */
export const SIMPLIFICATION_CSS_CLASSES: Record<SimplificationLevel, string[]> = {
  none: [],
  subtle: ['cognitive-subtle'],
  moderate: ['cognitive-subtle', 'cognitive-moderate'],
  aggressive: ['cognitive-subtle', 'cognitive-moderate', 'cognitive-aggressive'],
};

/**
 * Get CSS classes for simplification level
 */
export function getSimplificationClasses(level: SimplificationLevel): string {
  return SIMPLIFICATION_CSS_CLASSES[level].join(' ');
}

/**
 * CSS styles for simplification
 */
export const SIMPLIFICATION_STYLES = `
/* Cognitive Load Simplification Styles */

/* Subtle simplifications */
.cognitive-subtle [data-required="true"] {
  border-left: 3px solid var(--color-accent, #00d4ff);
}

.cognitive-subtle [data-progress-tracker] {
  opacity: 1 !important;
}

/* Moderate simplifications */
.cognitive-moderate [data-advanced="true"]:not([data-expanded="true"]) {
  max-height: 0;
  overflow: hidden;
  opacity: 0;
}

.cognitive-moderate [data-optional="true"] {
  display: none;
}

.cognitive-moderate [data-nav-item="secondary"] {
  display: none;
}

.cognitive-moderate [data-optional-toggle] {
  display: block;
}

/* Aggressive simplifications */
.cognitive-aggressive {
  --text-scale: 1.15;
}

.cognitive-aggressive * {
  animation-duration: 0.01ms !important;
  animation-iteration-count: 1 !important;
  transition-duration: 0.01ms !important;
}

.cognitive-aggressive p,
.cognitive-aggressive span,
.cognitive-aggressive label,
.cognitive-aggressive button,
.cognitive-aggressive input,
.cognitive-aggressive textarea,
.cognitive-aggressive select {
  font-size: calc(1rem * var(--text-scale, 1.15));
}

.cognitive-aggressive [data-essential="false"],
.cognitive-aggressive .decorative {
  display: none !important;
}

.cognitive-aggressive [data-focus-only="false"] {
  opacity: 0.3;
  pointer-events: none;
}

.cognitive-aggressive [data-focus-only="false"]:focus,
.cognitive-aggressive [data-focus-only="false"]:focus-within {
  opacity: 1;
  pointer-events: auto;
}

/* Voice guidance highlights */
.cognitive-aggressive [data-voice-guide] {
  outline: 2px solid var(--color-accent, #00d4ff);
  outline-offset: 2px;
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .cognitive-subtle *,
  .cognitive-moderate *,
  .cognitive-aggressive * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
`;

// ============================================================================
// Hub-Specific Rules
// ============================================================================

/**
 * Hub-specific simplification rules
 */
export const HUB_SPECIFIC_RULES: Record<string, SimplificationRule[]> = {
  'hub-1': [
    // SATOR Analytics hub
    {
      id: 'simplify-charts',
      name: 'Simplify Charts',
      description: 'Show simplified chart views',
      triggerLevel: 'high',
      minScore: 70,
      action: 'simplify',
      target: '[data-chart-complex]',
      priority: 85,
      enabled: true,
    },
  ],
  'hub-2': [
    // ROTAS Simulation hub
    {
      id: 'reduce-simulation-detail',
      name: 'Reduce Simulation Detail',
      description: 'Show less detailed simulation view',
      triggerLevel: 'high',
      minScore: 70,
      action: 'simplify',
      target: '[data-simulation-detail]',
      priority: 85,
      enabled: true,
    },
  ],
  'hub-3': [
    // AREPO hub
    {
      id: 'simplify-map-view',
      name: 'Simplify Map View',
      description: 'Show simplified map with fewer markers',
      triggerLevel: 'high',
      minScore: 70,
      action: 'simplify',
      target: '[data-map-complex]',
      priority: 85,
      enabled: true,
    },
  ],
  'hub-4': [
    // OPERA hub
    {
      id: 'simplify-timeline',
      name: 'Simplify Timeline',
      description: 'Show condensed timeline view',
      triggerLevel: 'high',
      minScore: 70,
      action: 'simplify',
      target: '[data-timeline-complex]',
      priority: 85,
      enabled: true,
    },
  ],
  'hub-5': [
    // TENET Central hub
    {
      id: 'focus-main-content',
      name: 'Focus Main Content',
      description: 'Hide sidebar and focus on main content area',
      triggerLevel: 'high',
      minScore: 70,
      action: 'hide',
      target: '[data-sidebar]',
      priority: 85,
      enabled: true,
    },
  ],
};

/**
 * Get rules for a specific hub
 */
export function getHubRules(hubId: string): SimplificationRule[] {
  return HUB_SPECIFIC_RULES[hubId] || [];
}

/**
 * Merge hub-specific rules with default rules
 */
export function mergeWithHubRules(
  rules: SimplificationRule[],
  hubId: string
): SimplificationRule[] {
  const hubRules = getHubRules(hubId);
  
  // Merge, with hub rules taking precedence for same IDs
  const ruleMap = new Map(rules.map(r => [r.id, r]));
  hubRules.forEach(rule => {
    ruleMap.set(rule.id, rule);
  });
  
  return Array.from(ruleMap.values());
}

// ============================================================================
// Export Default
// ============================================================================

export default {
  DEFAULT_SIMPLIFICATION_RULES,
  SIMPLIFICATION_CONFIGS,
  LOAD_TO_SIMPLIFICATION_MAP,
  SIMPLIFICATION_CSS_CLASSES,
  SIMPLIFICATION_STYLES,
  HUB_SPECIFIC_RULES,
  getSimplificationLevelForLoad,
  getSimplificationConfigForLoad,
  getActiveRules,
  addSimplificationRule,
  removeSimplificationRule,
  toggleRuleEnabled,
  updateRule,
  toggleFeature,
  setFeature,
  isFeatureEnabled,
  setUserOverride,
  getEffectiveLevel,
  clearUserOverride,
  getSimplificationClasses,
  getHubRules,
  mergeWithHubRules,
};
