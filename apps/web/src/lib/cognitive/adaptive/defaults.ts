// @ts-nocheck
/** [Ver001.000]
 * Smart Defaults System
 * =====================
 * Context-aware default values with user preference learning.
 * 
 * Features:
 * - Context-aware default values
 * - User preference learning
 * - Automatic form filling
 * - Smart suggestions
 * - Preference persistence
 * 
 * Integration:
 * - Uses TL-A3-3-A cognitive load detector
 * - Works with all form components
 * - Connects to preference learning system
 */

import type { CognitiveLoadLevel } from '../types';

// ============================================================================
// Default Value Types
// ============================================================================

/**
 * Default value source type
 */
export type DefaultSource = 
  | 'user-preference' 
  | 'context-inference' 
  | 'historical' 
  | 'smart-suggestion' 
  | 'system-default';

/**
 * Default value metadata
 */
export interface DefaultValueMeta {
  /** Source of the default */
  source: DefaultSource;
  /** Confidence level (0-1) */
  confidence: number;
  /** When this default was last used */
  lastUsed: number;
  /** How many times this default has been used */
  useCount: number;
  /** Whether user has explicitly confirmed this default */
  userConfirmed: boolean;
  /** Context keys that influenced this default */
  contextKeys: string[];
}

/**
 * Smart default value with metadata
 */
export interface SmartDefault<T> {
  /** The default value */
  value: T;
  /** Value metadata */
  meta: DefaultValueMeta;
  /** Alternative values with lower confidence */
  alternatives: Array<{ value: T; confidence: number }>;
  /** Suggested label for UI */
  label?: string;
  /** Help text explaining the suggestion */
  helpText?: string;
}

/**
 * Context key-value pairs for inference
 */
export type ContextData = Record<string, string | number | boolean | null>;

/**
 * Field context for default value selection
 */
export interface FieldContext {
  /** Field identifier */
  fieldId: string;
  /** Field type */
  fieldType: string;
  /** Current form/page context */
  pageContext: string;
  /** User role/type */
  userType?: string;
  /** Time of day */
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
  /** Device type */
  deviceType?: 'desktop' | 'tablet' | 'mobile';
  /** Current cognitive load */
  cognitiveLoad?: CognitiveLoadLevel;
  /** Additional context data */
  data: ContextData;
}

// ============================================================================
// Preference Types
// ============================================================================

/**
 * User preference entry
 */
export interface UserPreference<T = unknown> {
  /** Preference key */
  key: string;
  /** Preferred value */
  value: T;
  /** When preference was created */
  createdAt: number;
  /** When preference was last updated */
  updatedAt: number;
  /** Frequency of use */
  frequency: number;
  /** Contexts where this preference applies */
  contexts: string[];
  /** Whether this is a strong preference */
  isStrongPreference: boolean;
}

/**
 * Preference pattern for learning
 */
export interface PreferencePattern {
  /** Field or setting identifier */
  key: string;
  /** Pattern type */
  type: 'temporal' | 'contextual' | 'sequential' | 'cluster';
  /** Detected pattern */
  pattern: unknown;
  /** Pattern confidence (0-1) */
  confidence: number;
  /** Number of observations */
  observations: number;
  /** When pattern was detected */
  detectedAt: number;
}

/**
 * Preference storage interface
 */
export interface PreferenceStorage {
  /** Get preference by key */
  get<T>(key: string): UserPreference<T> | null;
  /** Set preference */
  set<T>(key: string, value: T, context?: string[]): void;
  /** Get all preferences matching prefix */
  getAll(prefix: string): Array<UserPreference<unknown>>;
  /** Remove preference */
  remove(key: string): void;
  /** Clear all preferences */
  clear(): void;
}

// ============================================================================
// Default Provider Types
// ============================================================================

/**
 * Default value provider function
 */
export type DefaultProvider<T> = (
  context: FieldContext,
  preferences: PreferenceStorage
) => SmartDefault<T> | null;

/**
 * Default provider registry entry
 */
export interface DefaultProviderEntry<T> {
  /** Provider identifier */
  id: string;
  /** Field types this provider supports */
  fieldTypes: string[];
  /** Provider function */
  provider: DefaultProvider<T>;
  /** Provider priority (higher = evaluated first) */
  priority: number;
  /** Whether provider is enabled */
  enabled: boolean;
}

// ============================================================================
// Smart Defaults Registry
// ============================================================================

/**
 * Global provider registry
 */
const providerRegistry: DefaultProviderEntry<unknown>[] = [];

/**
 * Register a default value provider
 */
export function registerDefaultProvider<T>(
  entry: Omit<DefaultProviderEntry<T>, 'enabled'>
): void {
  providerRegistry.push({ ...entry, enabled: true });
  // Sort by priority
  providerRegistry.sort((a, b) => b.priority - a.priority);
}

/**
 * Unregister a provider
 */
export function unregisterDefaultProvider(id: string): void {
  const index = providerRegistry.findIndex(p => p.id === id);
  if (index >= 0) {
    providerRegistry.splice(index, 1);
  }
}

/**
 * Enable/disable a provider
 */
export function setProviderEnabled(id: string, enabled: boolean): void {
  const provider = providerRegistry.find(p => p.id === id);
  if (provider) {
    provider.enabled = enabled;
  }
}

/**
 * Get providers for a field type
 */
export function getProvidersForFieldType(fieldType: string): DefaultProviderEntry<unknown>[] {
  return providerRegistry.filter(
    p => p.enabled && p.fieldTypes.includes(fieldType)
  );
}

// ============================================================================
// Context Inference
// ============================================================================

/**
 * Inference rule for context-based defaults
 */
export interface InferenceRule<T> {
  /** Rule identifier */
  id: string;
  /** Context conditions that must match */
  conditions: Array<{
    key: string;
    operator: 'eq' | 'neq' | 'gt' | 'lt' | 'contains' | 'startsWith';
    value: unknown;
  }>;
  /** Default value when conditions match */
  defaultValue: T;
  /** Rule confidence (0-1) */
  confidence: number;
  /** Rule priority */
  priority: number;
}

/**
 * Evaluate an inference rule against context
 */
export function evaluateRule<T>(
  rule: InferenceRule<T>,
  context: ContextData
): { matches: boolean; confidence: number } {
  for (const condition of rule.conditions) {
    const contextValue = context[condition.key];
    let matches = false;

    switch (condition.operator) {
      case 'eq':
        matches = contextValue === condition.value;
        break;
      case 'neq':
        matches = contextValue !== condition.value;
        break;
      case 'gt':
        matches = typeof contextValue === 'number' && 
                  typeof condition.value === 'number' &&
                  contextValue > condition.value;
        break;
      case 'lt':
        matches = typeof contextValue === 'number' && 
                  typeof condition.value === 'number' &&
                  contextValue < condition.value;
        break;
      case 'contains':
        matches = typeof contextValue === 'string' && 
                  typeof condition.value === 'string' &&
                  contextValue.includes(condition.value);
        break;
      case 'startsWith':
        matches = typeof contextValue === 'string' && 
                  typeof condition.value === 'string' &&
                  contextValue.startsWith(condition.value);
        break;
    }

    if (!matches) {
      return { matches: false, confidence: 0 };
    }
  }

  return { matches: true, confidence: rule.confidence };
}

/**
 * Find matching inference rules
 */
export function findMatchingRules<T>(
  rules: InferenceRule<T>[],
  context: ContextData
): Array<{ rule: InferenceRule<T>; confidence: number }> {
  return rules
    .map(rule => ({ rule, ...evaluateRule(rule, context) }))
    .filter(result => result.matches)
    .sort((a, b) => b.confidence - a.confidence);
}

// ============================================================================
// Local Storage Preference Implementation
// ============================================================================

const STORAGE_KEY = 'sator-smart-defaults';

/**
 * Local storage-based preference storage
 */
export class LocalPreferenceStorage implements PreferenceStorage {
  private cache: Map<string, UserPreference<unknown>> = new Map();
  private loaded = false;

  private load(): void {
    if (this.loaded) return;
    
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed = JSON.parse(data);
        this.cache = new Map(Object.entries(parsed));
      }
    } catch {
      // Ignore parse errors
    }
    this.loaded = true;
  }

  private save(): void {
    const data = Object.fromEntries(this.cache);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  get<T>(key: string): UserPreference<T> | null {
    this.load();
    const pref = this.cache.get(key);
    return pref ? (pref as UserPreference<T>) : null;
  }

  set<T>(key: string, value: T, contexts: string[] = []): void {
    this.load();
    const existing = this.cache.get(key);
    const now = Date.now();
    
    const pref: UserPreference<T> = {
      key,
      value,
      createdAt: existing?.createdAt || now,
      updatedAt: now,
      frequency: (existing?.frequency || 0) + 1,
      contexts: contexts.length > 0 
        ? [...new Set([...(existing?.contexts || []), ...contexts])]
        : (existing?.contexts || []),
      isStrongPreference: (existing?.frequency || 0) > 5,
    };

    this.cache.set(key, pref as UserPreference<unknown>);
    this.save();
  }

  getAll(prefix: string): Array<UserPreference<unknown>> {
    this.load();
    return Array.from(this.cache.values())
      .filter(p => p.key.startsWith(prefix));
  }

  remove(key: string): void {
    this.load();
    this.cache.delete(key);
    this.save();
  }

  clear(): void {
    this.cache.clear();
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Global storage instance
let globalStorage: PreferenceStorage = new LocalPreferenceStorage();

/**
 * Set global preference storage
 */
export function setGlobalPreferenceStorage(storage: PreferenceStorage): void {
  globalStorage = storage;
}

/**
 * Get global preference storage
 */
export function getGlobalPreferenceStorage(): PreferenceStorage {
  return globalStorage;
}

// ============================================================================
// Smart Default Resolution
// ============================================================================

/**
 * Options for getting smart defaults
 */
export interface GetSmartDefaultOptions {
  /** Whether to consider user preferences */
  usePreferences: boolean;
  /** Minimum confidence threshold */
  minConfidence: number;
  /** Whether to include alternatives */
  includeAlternatives: boolean;
  /** Maximum number of alternatives */
  maxAlternatives: number;
}

/**
 * Default options
 */
const DEFAULT_OPTIONS: GetSmartDefaultOptions = {
  usePreferences: true,
  minConfidence: 0.3,
  includeAlternatives: true,
  maxAlternatives: 3,
};

/**
 * Get smart default for a field
 */
export function getSmartDefault<T>(
  context: FieldContext,
  options: Partial<GetSmartDefaultOptions> = {}
): SmartDefault<T> | null {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const candidates: Array<{ value: T; confidence: number; source: DefaultSource }> = [];

  // 1. Check user preferences
  if (opts.usePreferences) {
    const pref = globalStorage.get<T>(`field:${context.fieldId}`);
    if (pref) {
      const confidence = pref.isStrongPreference ? 0.9 : 0.6 + (pref.frequency * 0.02);
      candidates.push({
        value: pref.value,
        confidence: Math.min(confidence, 0.95),
        source: 'user-preference',
      });
    }
  }

  // 2. Run provider functions
  const providers = getProvidersForFieldType(context.fieldType);
  for (const providerEntry of providers) {
    try {
      const result = providerEntry.provider(context, globalStorage);
      if (result && result.meta.confidence >= opts.minConfidence) {
        candidates.push({
          value: result.value as T,
          confidence: result.meta.confidence,
          source: result.meta.source,
        });

        // Add alternatives if requested
        if (opts.includeAlternatives && result.alternatives) {
          for (const alt of result.alternatives.slice(0, opts.maxAlternatives)) {
            if (alt.confidence >= opts.minConfidence) {
              candidates.push({
                value: alt.value,
                confidence: alt.confidence * 0.8, // Reduce confidence for alternatives
                source: 'smart-suggestion',
              });
            }
          }
        }
      }
    } catch (error) {
      console.warn(`Provider ${providerEntry.id} failed:`, error);
    }
  }

  if (candidates.length === 0) {
    return null;
  }

  // Sort by confidence
  candidates.sort((a, b) => b.confidence - a.confidence);

  const best = candidates[0];
  const now = Date.now();

  return {
    value: best.value,
    meta: {
      source: best.source,
      confidence: best.confidence,
      lastUsed: now,
      useCount: 0,
      userConfirmed: false,
      contextKeys: Object.keys(context.data),
    },
    alternatives: candidates.slice(1, opts.maxAlternatives + 1).map(c => ({
      value: c.value,
      confidence: c.confidence,
    })),
  };
}

// ============================================================================
// Auto-Fill Functions
// ============================================================================

/**
 * Auto-fill result for a form
 */
export interface AutoFillResult {
  /** Field values that were filled */
  filledFields: Record<string, unknown>;
  /** Fields that couldn't be filled */
  unfilledFields: string[];
  /** Overall confidence score */
  overallConfidence: number;
  /** Sources used for filling */
  sourcesUsed: DefaultSource[];
}

/**
 * Options for auto-fill
 */
export interface AutoFillOptions {
  /** Fields to fill */
  fields: Array<{
    fieldId: string;
    fieldType: string;
  }>;
  /** Form context */
  formContext: string;
  /** Page context */
  pageContext: string;
  /** Minimum confidence to auto-fill */
  minConfidence: number;
  /** Whether to confirm with user before filling */
  requireConfirmation: boolean;
}

/**
 * Auto-fill form fields with smart defaults
 */
export function autoFillForm(options: AutoFillOptions): AutoFillResult {
  const filledFields: Record<string, unknown> = {};
  const unfilledFields: string[] = [];
  const sourcesUsed = new Set<DefaultSource>();
  let totalConfidence = 0;
  let filledCount = 0;

  for (const field of options.fields) {
    const context: FieldContext = {
      fieldId: field.fieldId,
      fieldType: field.fieldType,
      pageContext: options.pageContext,
      data: { formContext: options.formContext },
    };

    const smartDefault = getSmartDefault<unknown>(context, {
      minConfidence: options.minConfidence,
      includeAlternatives: false,
    });

    if (smartDefault && smartDefault.meta.confidence >= options.minConfidence) {
      filledFields[field.fieldId] = smartDefault.value;
      totalConfidence += smartDefault.meta.confidence;
      filledCount++;
      sourcesUsed.add(smartDefault.meta.source);
    } else {
      unfilledFields.push(field.fieldId);
    }
  }

  return {
    filledFields,
    unfilledFields,
    overallConfidence: filledCount > 0 ? totalConfidence / filledCount : 0,
    sourcesUsed: Array.from(sourcesUsed),
  };
}

/**
 * Record that a default value was used
 */
export function recordDefaultUsed(
  fieldId: string,
  value: unknown,
  confirmed: boolean = false
): void {
  const pref = globalStorage.get(`field:${fieldId}`);
  const now = Date.now();

  if (pref) {
    globalStorage.set(fieldId, value);
  }

  // Store usage record
  const usageKey = `usage:${fieldId}:${now}`;
  globalStorage.set(usageKey, {
    value,
    confirmed,
    timestamp: now,
  });
}

// ============================================================================
// Built-in Providers
// ============================================================================

/**
 * Temporal defaults provider (time of day, day of week)
 */
const temporalProvider: DefaultProvider<unknown> = (context) => {
  const hour = new Date().getHours();
  const defaults: Record<string, unknown> = {};

  // Time-based defaults
  if (hour < 12) {
    defaults.timeOfDay = 'morning';
  } else if (hour < 17) {
    defaults.timeOfDay = 'afternoon';
  } else {
    defaults.timeOfDay = 'evening';
  }

  // Suggest simpler options during high cognitive load times
  if (hour < 8 || hour > 22) {
    defaults.simplifyUI = true;
  }

  if (context.fieldId === 'timeOfDay') {
    return {
      value: defaults.timeOfDay,
      meta: {
        source: 'context-inference',
        confidence: 0.95,
        lastUsed: Date.now(),
        useCount: 0,
        userConfirmed: false,
        contextKeys: ['hour'],
      },
      alternatives: [],
      label: 'Current time of day',
    };
  }

  return null;
};

/**
 * Device type provider
 */
const deviceProvider: DefaultProvider<unknown> = (context) => {
  const width = window.innerWidth;
  const deviceType = width < 768 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop';

  if (context.fieldId === 'deviceType' || context.fieldId === 'preferredView') {
    return {
      value: deviceType,
      meta: {
        source: 'context-inference',
        confidence: 0.9,
        lastUsed: Date.now(),
        useCount: 0,
        userConfirmed: false,
        contextKeys: ['viewportWidth'],
      },
      alternatives: [],
      label: 'Device-optimized view',
    };
  }

  return null;
};

// Register built-in providers
registerDefaultProvider({
  id: 'temporal',
  fieldTypes: ['select', 'radio', 'text'],
  provider: temporalProvider,
  priority: 10,
});

registerDefaultProvider({
  id: 'device',
  fieldTypes: ['select', 'hidden'],
  provider: deviceProvider,
  priority: 5,
});

// ============================================================================
// Export
// ============================================================================

export default {
  // Registry
  registerDefaultProvider,
  unregisterDefaultProvider,
  setProviderEnabled,
  getProvidersForFieldType,
  
  // Inference
  evaluateRule,
  findMatchingRules,
  
  // Storage
  LocalPreferenceStorage,
  setGlobalPreferenceStorage,
  getGlobalPreferenceStorage,
  
  // Resolution
  getSmartDefault,
  autoFillForm,
  recordDefaultUsed,
  
  // Built-in providers
  temporalProvider,
  deviceProvider,
};
