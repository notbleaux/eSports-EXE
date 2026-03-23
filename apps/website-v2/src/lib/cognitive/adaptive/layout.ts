/** [Ver001.000]
 * Adaptive Layout Engine
 * ======================
 * Dynamic layout adjustments based on cognitive load detection.
 * 
 * Features:
 * - Layout mode switching (simplified vs full)
 * - Progressive disclosure logic
 * - Grid/column adjustments
 * - Spacing and density controls
 * - Section collapse/expand management
 * 
 * Integration:
 * - Uses TL-A3-3-A cognitive load detector
 * - Works with all form components
 * - Applies to all 5 hubs
 */

import type { CognitiveLoadLevel, SimplificationLevel } from '../types';

// ============================================================================
// Layout Mode Types
// ============================================================================

/**
 * Available layout modes
 */
export type LayoutMode = 'full' | 'simplified' | 'minimal' | 'focused';

/**
 * Grid configuration
 */
export interface GridConfig {
  /** Number of columns */
  columns: number;
  /** Gap between items (in rem) */
  gap: number;
  /** Minimum item width */
  minItemWidth?: string;
  /** Maximum container width */
  maxWidth?: string;
}

/**
 * Spacing configuration
 */
export interface SpacingConfig {
  /** Base unit size (in rem) */
  baseUnit: number;
  /** Section padding */
  sectionPadding: number;
  /** Component gap */
  componentGap: number;
  /** Form field spacing */
  fieldSpacing: number;
}

/**
 * Layout configuration for a specific mode
 */
export interface LayoutModeConfig {
  /** Layout mode identifier */
  mode: LayoutMode;
  /** Grid configuration */
  grid: GridConfig;
  /** Spacing configuration */
  spacing: SpacingConfig;
  /** Whether to show sidebars */
  showSidebars: boolean;
  /** Whether to show breadcrumbs */
  showBreadcrumbs: boolean;
  /** Whether to show help panels */
  showHelpPanels: boolean;
  /** Maximum form sections visible */
  maxVisibleSections: number;
  /** Whether fields can be inline */
  allowInlineFields: boolean;
  /** Whether to show field descriptions */
  showFieldDescriptions: boolean;
  /** Whether to show section dividers */
  showSectionDividers: boolean;
  /** Font size scale */
  fontScale: number;
  /** Animation complexity */
  animationLevel: 'full' | 'reduced' | 'none';
}

// ============================================================================
// Progressive Disclosure Types
// ============================================================================

/**
 * Disclosure level for progressive content reveal
 */
export type DisclosureLevel = 'always' | 'low-load' | 'medium-load' | 'high-load' | 'never';

/**
 * Section visibility configuration
 */
export interface SectionVisibility {
  /** Section identifier */
  sectionId: string;
  /** When to show this section */
  showAt: DisclosureLevel;
  /** Whether section can be collapsed */
  collapsible: boolean;
  /** Default collapsed state */
  defaultCollapsed: boolean;
  /** Priority for display order (higher = earlier) */
  priority: number;
}

/**
 * Progressive disclosure configuration
 */
export interface ProgressiveDisclosureConfig {
  /** Section visibility rules */
  sections: SectionVisibility[];
  /** Whether to enable progressive disclosure */
  enabled: boolean;
  /** Default disclosure level */
  defaultLevel: DisclosureLevel;
  /** Allow user to override */
  allowUserOverride: boolean;
}

/**
 * Disclosure decision result
 */
export interface DisclosureDecision {
  /** Whether the element should be visible */
  visible: boolean;
  /** Whether the element should be collapsed */
  collapsed: boolean;
  /** Priority level for ordering */
  priority: number;
  /** Suggested animation style */
  animationStyle: 'fade' | 'slide' | 'none';
}

// ============================================================================
// Layout Presets
// ============================================================================

/**
 * Full layout configuration
 */
export const FULL_LAYOUT: LayoutModeConfig = {
  mode: 'full',
  grid: {
    columns: 3,
    gap: 1.5,
    minItemWidth: '300px',
    maxWidth: '1400px',
  },
  spacing: {
    baseUnit: 1,
    sectionPadding: 2,
    componentGap: 1.5,
    fieldSpacing: 1,
  },
  showSidebars: true,
  showBreadcrumbs: true,
  showHelpPanels: true,
  maxVisibleSections: 10,
  allowInlineFields: true,
  showFieldDescriptions: true,
  showSectionDividers: true,
  fontScale: 1,
  animationLevel: 'full',
};

/**
 * Simplified layout configuration
 */
export const SIMPLIFIED_LAYOUT: LayoutModeConfig = {
  mode: 'simplified',
  grid: {
    columns: 2,
    gap: 1,
    minItemWidth: '250px',
    maxWidth: '1200px',
  },
  spacing: {
    baseUnit: 1,
    sectionPadding: 1.5,
    componentGap: 1,
    fieldSpacing: 0.875,
  },
  showSidebars: true,
  showBreadcrumbs: true,
  showHelpPanels: false,
  maxVisibleSections: 6,
  allowInlineFields: true,
  showFieldDescriptions: false,
  showSectionDividers: true,
  fontScale: 1,
  animationLevel: 'reduced',
};

/**
 * Minimal layout configuration (high load)
 */
export const MINIMAL_LAYOUT: LayoutModeConfig = {
  mode: 'minimal',
  grid: {
    columns: 1,
    gap: 0.75,
    minItemWidth: '100%',
    maxWidth: '800px',
  },
  spacing: {
    baseUnit: 0.875,
    sectionPadding: 1,
    componentGap: 0.75,
    fieldSpacing: 0.75,
  },
  showSidebars: false,
  showBreadcrumbs: false,
  showHelpPanels: false,
  maxVisibleSections: 3,
  allowInlineFields: false,
  showFieldDescriptions: false,
  showSectionDividers: false,
  fontScale: 1.05,
  animationLevel: 'none',
};

/**
 * Focused layout configuration (single task mode)
 */
export const FOCUSED_LAYOUT: LayoutModeConfig = {
  mode: 'focused',
  grid: {
    columns: 1,
    gap: 0.5,
    minItemWidth: '100%',
    maxWidth: '600px',
  },
  spacing: {
    baseUnit: 0.75,
    sectionPadding: 0.75,
    componentGap: 0.5,
    fieldSpacing: 0.5,
  },
  showSidebars: false,
  showBreadcrumbs: false,
  showHelpPanels: false,
  maxVisibleSections: 1,
  allowInlineFields: false,
  showFieldDescriptions: false,
  showSectionDividers: false,
  fontScale: 1.1,
  animationLevel: 'none',
};

/**
 * Layout mode mapping
 */
export const LAYOUT_MODES: Record<LayoutMode, LayoutModeConfig> = {
  full: FULL_LAYOUT,
  simplified: SIMPLIFIED_LAYOUT,
  minimal: MINIMAL_LAYOUT,
  focused: FOCUSED_LAYOUT,
};

// ============================================================================
// Load to Layout Mapping
// ============================================================================

/**
 * Map cognitive load level to layout mode
 */
export const LOAD_TO_LAYOUT_MAP: Record<CognitiveLoadLevel, LayoutMode> = {
  low: 'full',
  medium: 'simplified',
  high: 'minimal',
  critical: 'focused',
};

/**
 * Map simplification level to layout mode
 */
export const SIMPLIFICATION_TO_LAYOUT_MAP: Record<SimplificationLevel, LayoutMode> = {
  none: 'full',
  subtle: 'simplified',
  moderate: 'minimal',
  aggressive: 'focused',
};

// ============================================================================
// Layout Decision Engine
// ============================================================================

/**
 * Get layout mode for cognitive load level
 */
export function getLayoutModeForLoad(loadLevel: CognitiveLoadLevel): LayoutMode {
  return LOAD_TO_LAYOUT_MAP[loadLevel];
}

/**
 * Get layout mode for simplification level
 */
export function getLayoutModeForSimplification(level: SimplificationLevel): LayoutMode {
  return SIMPLIFICATION_TO_LAYOUT_MAP[level];
}

/**
 * Get layout configuration for mode
 */
export function getLayoutConfig(mode: LayoutMode): LayoutModeConfig {
  return LAYOUT_MODES[mode];
}

/**
 * Get layout configuration for cognitive load
 */
export function getLayoutConfigForLoad(loadLevel: CognitiveLoadLevel): LayoutModeConfig {
  return getLayoutConfig(getLayoutModeForLoad(loadLevel));
}

/**
 * Calculate effective layout mode based on load and user preferences
 */
export function calculateEffectiveLayoutMode(
  loadLevel: CognitiveLoadLevel,
  userPreference: LayoutMode | null,
  forceSimple: boolean = false
): LayoutMode {
  if (forceSimple) {
    return 'minimal';
  }

  if (userPreference) {
    // Don't allow full mode if load is critical
    if (loadLevel === 'critical' && userPreference === 'full') {
      return 'simplified';
    }
    return userPreference;
  }

  return getLayoutModeForLoad(loadLevel);
}

// ============================================================================
// Progressive Disclosure Logic
// ============================================================================

/**
 * Default progressive disclosure config
 */
export const DEFAULT_PROGRESSIVE_DISCLOSURE: ProgressiveDisclosureConfig = {
  sections: [],
  enabled: true,
  defaultLevel: 'low-load',
  allowUserOverride: true,
};

/**
 * Convert cognitive load to disclosure level
 */
export function loadToDisclosureLevel(loadLevel: CognitiveLoadLevel): DisclosureLevel {
  const mapping: Record<CognitiveLoadLevel, DisclosureLevel> = {
    low: 'low-load',
    medium: 'medium-load',
    high: 'high-load',
    critical: 'never',
  };
  return mapping[loadLevel];
}

/**
 * Check if an element should be visible at a given disclosure level
 */
export function shouldDisclose(
  elementLevel: DisclosureLevel,
  currentLoad: CognitiveLoadLevel
): boolean {
  if (elementLevel === 'always') return true;
  if (elementLevel === 'never') return false;

  const disclosureOrder: DisclosureLevel[] = ['always', 'low-load', 'medium-load', 'high-load'];
  const elementIndex = disclosureOrder.indexOf(elementLevel);
  const currentLevel = loadToDisclosureLevel(currentLoad);
  const currentIndex = disclosureOrder.indexOf(currentLevel);

  return elementIndex <= currentIndex;
}

/**
 * Get disclosure decision for a section
 */
export function getDisclosureDecision(
  section: SectionVisibility,
  loadLevel: CognitiveLoadLevel,
  userCollapsed: boolean | null = null
): DisclosureDecision {
  const visible = shouldDisclose(section.showAt, loadLevel);
  
  // If user has manually collapsed/expanded, respect that
  const collapsed = userCollapsed !== null 
    ? userCollapsed 
    : (visible ? section.defaultCollapsed : true);

  // Determine animation style based on load
  let animationStyle: 'fade' | 'slide' | 'none' = 'slide';
  if (loadLevel === 'high' || loadLevel === 'critical') {
    animationStyle = 'none';
  } else if (loadLevel === 'medium') {
    animationStyle = 'fade';
  }

  return {
    visible,
    collapsed,
    priority: section.priority,
    animationStyle,
  };
}

/**
 * Sort sections by priority and disclosure
 */
export function sortSectionsByPriority(
  sections: SectionVisibility[],
  loadLevel: CognitiveLoadLevel
): Array<{ section: SectionVisibility; decision: DisclosureDecision }> {
  return sections
    .map(section => ({
      section,
      decision: getDisclosureDecision(section, loadLevel),
    }))
    .sort((a, b) => {
      // First by visibility (visible first)
      if (a.decision.visible !== b.decision.visible) {
        return a.decision.visible ? -1 : 1;
      }
      // Then by priority
      return b.section.priority - a.section.priority;
    });
}

// ============================================================================
// CSS Generation
// ============================================================================

/**
 * Generate CSS custom properties for layout config
 */
export function generateLayoutCSS(config: LayoutModeConfig): Record<string, string> {
  return {
    '--adaptive-columns': String(config.grid.columns),
    '--adaptive-gap': `${config.grid.gap}rem`,
    '--adaptive-min-item-width': config.grid.minItemWidth || 'auto',
    '--adaptive-max-width': config.grid.maxWidth || 'none',
    '--adaptive-base-unit': `${config.spacing.baseUnit}rem`,
    '--adaptive-section-padding': `${config.spacing.sectionPadding}rem`,
    '--adaptive-component-gap': `${config.spacing.componentGap}rem`,
    '--adaptive-field-spacing': `${config.spacing.fieldSpacing}rem`,
    '--adaptive-font-scale': String(config.fontScale),
    '--adaptive-animation-level': config.animationLevel,
  };
}

/**
 * Get CSS class for layout mode
 */
export function getLayoutModeClass(mode: LayoutMode): string {
  return `adaptive-layout-${mode}`;
}

/**
 * Get all layout-related CSS classes
 */
export function getLayoutClasses(config: LayoutModeConfig): string {
  const classes = [
    getLayoutModeClass(config.mode),
    `adaptive-columns-${config.grid.columns}`,
    `adaptive-animation-${config.animationLevel}`,
  ];

  if (!config.showSidebars) classes.push('adaptive-no-sidebars');
  if (!config.showBreadcrumbs) classes.push('adaptive-no-breadcrumbs');
  if (!config.showHelpPanels) classes.push('adaptive-no-help');
  if (!config.allowInlineFields) classes.push('adaptive-stacked-fields');
  if (!config.showFieldDescriptions) classes.push('adaptive-no-descriptions');
  if (!config.showSectionDividers) classes.push('adaptive-no-dividers');

  return classes.join(' ');
}

// ============================================================================
// Responsive Integration
// ============================================================================

/**
 * Breakpoint configuration
 */
export interface BreakpointConfig {
  /** Mobile breakpoint (px) */
  mobile: number;
  /** Tablet breakpoint (px) */
  tablet: number;
  /** Desktop breakpoint (px) */
  desktop: number;
  /** Large desktop breakpoint (px) */
  wide: number;
}

/**
 * Default breakpoints
 */
export const DEFAULT_BREAKPOINTS: BreakpointConfig = {
  mobile: 640,
  tablet: 768,
  desktop: 1024,
  wide: 1440,
};

/**
 * Adjust layout config for viewport size
 */
export function adjustLayoutForViewport(
  config: LayoutModeConfig,
  viewportWidth: number,
  breakpoints: BreakpointConfig = DEFAULT_BREAKPOINTS
): LayoutModeConfig {
  const adjusted = { ...config };

  // Reduce columns on smaller screens
  if (viewportWidth < breakpoints.mobile) {
    adjusted.grid = {
      ...adjusted.grid,
      columns: 1,
      gap: Math.max(0.5, adjusted.grid.gap - 0.5),
    };
    adjusted.spacing = {
      ...adjusted.spacing,
      sectionPadding: Math.max(0.5, adjusted.spacing.sectionPadding - 0.5),
      componentGap: Math.max(0.5, adjusted.spacing.componentGap - 0.5),
    };
  } else if (viewportWidth < breakpoints.tablet) {
    adjusted.grid = {
      ...adjusted.grid,
      columns: Math.min(2, adjusted.grid.columns),
    };
  }

  return adjusted;
}

// ============================================================================
// Layout State Management
// ============================================================================

/**
 * Layout state interface
 */
export interface LayoutState {
  /** Current layout mode */
  currentMode: LayoutMode;
  /** Current configuration */
  config: LayoutModeConfig;
  /** User override (if any) */
  userOverride: LayoutMode | null;
  /** Currently collapsed sections */
  collapsedSections: Set<string>;
  /** Viewport width */
  viewportWidth: number;
}

/**
 * Create initial layout state
 */
export function createLayoutState(
  initialMode: LayoutMode = 'full',
  viewportWidth: number = window?.innerWidth || 1024
): LayoutState {
  return {
    currentMode: initialMode,
    config: adjustLayoutForViewport(
      getLayoutConfig(initialMode),
      viewportWidth
    ),
    userOverride: null,
    collapsedSections: new Set(),
    viewportWidth,
  };
}

/**
 * Update layout state based on cognitive load
 */
export function updateLayoutForLoad(
  state: LayoutState,
  loadLevel: CognitiveLoadLevel
): LayoutState {
  const effectiveMode = calculateEffectiveLayoutMode(
    loadLevel,
    state.userOverride
  );

  return {
    ...state,
    currentMode: effectiveMode,
    config: adjustLayoutForViewport(
      getLayoutConfig(effectiveMode),
      state.viewportWidth
    ),
  };
}

/**
 * Toggle section collapse state
 */
export function toggleSectionCollapse(
  state: LayoutState,
  sectionId: string
): LayoutState {
  const collapsed = new Set(state.collapsedSections);
  
  if (collapsed.has(sectionId)) {
    collapsed.delete(sectionId);
  } else {
    collapsed.add(sectionId);
  }

  return {
    ...state,
    collapsedSections: collapsed,
  };
}

/**
 * Set user layout preference
 */
export function setUserLayoutPreference(
  state: LayoutState,
  mode: LayoutMode | null
): LayoutState {
  return {
    ...state,
    userOverride: mode,
    currentMode: mode || state.currentMode,
    config: mode 
      ? adjustLayoutForViewport(getLayoutConfig(mode), state.viewportWidth)
      : state.config,
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  // Presets
  FULL_LAYOUT,
  SIMPLIFIED_LAYOUT,
  MINIMAL_LAYOUT,
  FOCUSED_LAYOUT,
  LAYOUT_MODES,
  DEFAULT_PROGRESSIVE_DISCLOSURE,
  
  // Mappings
  LOAD_TO_LAYOUT_MAP,
  SIMPLIFICATION_TO_LAYOUT_MAP,
  
  // Layout functions
  getLayoutModeForLoad,
  getLayoutModeForSimplification,
  getLayoutConfig,
  getLayoutConfigForLoad,
  calculateEffectiveLayoutMode,
  
  // Progressive disclosure
  loadToDisclosureLevel,
  shouldDisclose,
  getDisclosureDecision,
  sortSectionsByPriority,
  
  // CSS
  generateLayoutCSS,
  getLayoutModeClass,
  getLayoutClasses,
  
  // Responsive
  DEFAULT_BREAKPOINTS,
  adjustLayoutForViewport,
  
  // State
  createLayoutState,
  updateLayoutForLoad,
  toggleSectionCollapse,
  setUserLayoutPreference,
};
