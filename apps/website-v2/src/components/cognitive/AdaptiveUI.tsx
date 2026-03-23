/** [Ver001.000]
 * AdaptiveUI Component
 * ====================
 * React component that adapts UI based on detected cognitive load.
 * 
 * Features:
 * - Reduces UI complexity when load is high
 * - Progressive disclosure of features
 * - Simplified mode toggle
 * - Smart defaults based on load level
 * 
 * Integration:
 * - Uses useCognitiveLoad hook
 * - Works with simplification rules
 * - Applies to all hub components
 * 
 * @module components/cognitive/AdaptiveUI
 */

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  type ReactNode,
  type CSSProperties,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type {
  CognitiveLoadState,
  CognitiveLoadLevel,
  SimplificationConfig,
  SimplificationLevel,
} from '../../lib/cognitive/types';
import {
  getSimplificationConfigForLoad,
  getSimplificationClasses,
  getEffectiveLevel,
  SIMPLIFICATION_STYLES,
} from '../../lib/cognitive/simplification';
import { useCognitiveLoad } from '../../hooks/useCognitiveLoad';

// ============================================================================
// Context
// ============================================================================

/**
 * Adaptive UI context value
 */
interface AdaptiveUIContextValue {
  /** Current cognitive load state */
  cognitiveState: CognitiveLoadState;
  /** Current simplification config */
  simplification: SimplificationConfig;
  /** Current simplification level */
  simplificationLevel: SimplificationLevel;
  /** Whether UI is simplified */
  isSimplified: boolean;
  /** Whether high load is detected */
  isHighLoad: boolean;
  /** Set manual simplification level */
  setManualLevel: (level: SimplificationLevel | null) => void;
  /** Toggle manual simplification */
  toggleSimplification: () => void;
  /** Current hub ID (if any) */
  hubId: string | null;
}

const AdaptiveUIContext = createContext<AdaptiveUIContextValue | null>(null);

/**
 * Hook to access adaptive UI context
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { isSimplified, simplificationLevel } = useAdaptiveUI();
 *   return <div className={isSimplified ? 'simple' : 'full'}>Content</div>;
 * }
 * ```
 */
export function useAdaptiveUI(): AdaptiveUIContextValue {
  const context = useContext(AdaptiveUIContext);
  if (!context) {
    throw new Error('useAdaptiveUI must be used within AdaptiveUIProvider');
  }
  return context;
}

// ============================================================================
// Props
// ============================================================================

interface AdaptiveUIProviderProps {
  /** Child components */
  children: ReactNode;
  /** Hub identifier for hub-specific rules */
  hubId?: string;
  /** Whether to auto-start detection */
  autoStart?: boolean;
  /** Initial simplification level override */
  initialSimplification?: SimplificationLevel;
  /** Custom simplification config */
  customConfig?: Partial<SimplificationConfig>;
  /** Callback when simplification changes */
  onSimplificationChange?: (level: SimplificationLevel) => void;
  /** Callback when high load detected */
  onHighLoad?: (state: CognitiveLoadState) => void;
  /** Whether to inject styles */
  injectStyles?: boolean;
}

interface AdaptiveContainerProps {
  /** Child components */
  children: ReactNode;
  /** Custom className */
  className?: string;
  /** Custom styles */
  style?: CSSProperties;
  /** Minimum simplification level to apply adaptations */
  minSimplification?: SimplificationLevel;
  /** Whether to animate transitions */
  animate?: boolean;
}

interface SimplifiedViewProps {
  /** Content to show when simplified */
  children: ReactNode;
  /** Minimum simplification level to show this view */
  when?: SimplificationLevel;
  /** Animation props */
  animate?: boolean;
}

interface FullViewProps {
  /** Content to show in full mode */
  children: ReactNode;
  /** Maximum simplification level to show this view */
  until?: SimplificationLevel;
  /** Animation props */
  animate?: boolean;
}

// ============================================================================
// Provider Component
// ============================================================================

/**
 * AdaptiveUIProvider - Provides cognitive load adaptation context
 * 
 * @example
 * ```tsx
 * function App() {
 *   return (
 *     <AdaptiveUIProvider hubId="hub-1" autoStart>
 *       <YourApp />
 *     </AdaptiveUIProvider>
 *   );
 * }
 * ```
 */
export const AdaptiveUIProvider: React.FC<AdaptiveUIProviderProps> = ({
  children,
  hubId = null,
  autoStart = true,
  initialSimplification = null,
  customConfig,
  onSimplificationChange,
  onHighLoad,
  injectStyles = true,
}) => {
  // Use cognitive load hook
  const {
    state: cognitiveState,
    isHighLoad,
    setManualLevel: setCognitiveManualLevel,
    clearManualOverride: clearCognitiveOverride,
  } = useCognitiveLoad({
    autoStart,
    onHighLoad,
  });

  // Simplification state
  const [userOverride, setUserOverride] = useState<SimplificationLevel | null>(
    initialSimplification
  );

  // Compute effective simplification config
  const simplification = useMemo(() => {
    const baseConfig = getSimplificationConfigForLoad(cognitiveState.level);
    
    return {
      ...baseConfig,
      ...customConfig,
      level: userOverride || baseConfig.level,
      userOverride,
      automatic: userOverride === null,
    } as SimplificationConfig;
  }, [cognitiveState.level, userOverride, customConfig]);

  // Effective level
  const simplificationLevel = useMemo(
    () => getEffectiveLevel(simplification),
    [simplification]
  );

  // Is simplified check
  const isSimplified = useMemo(
    () => simplificationLevel !== 'none',
    [simplificationLevel]
  );

  // Set manual level
  const setManualLevel = useCallback((level: SimplificationLevel | null) => {
    setUserOverride(level);
    if (level) {
      // Map simplification level to cognitive load level
      const loadMap: Record<SimplificationLevel, CognitiveLoadLevel> = {
        none: 'low',
        subtle: 'low',
        moderate: 'medium',
        aggressive: 'high',
      };
      setCognitiveManualLevel(loadMap[level]);
    } else {
      clearCognitiveOverride();
    }
  }, [setCognitiveManualLevel, clearCognitiveOverride]);

  // Toggle simplification
  const toggleSimplification = useCallback(() => {
    setManualLevel(isSimplified ? null : 'moderate');
  }, [isSimplified, setManualLevel]);

  // Notify of simplification changes
  useEffect(() => {
    onSimplificationChange?.(simplificationLevel);
  }, [simplificationLevel, onSimplificationChange]);

  // Inject styles
  useEffect(() => {
    if (!injectStyles) return;

    const styleId = 'adaptive-ui-styles';
    if (document.getElementById(styleId)) return;

    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = SIMPLIFICATION_STYLES;
    document.head.appendChild(style);

    return () => {
      const existing = document.getElementById(styleId);
      if (existing) {
        existing.remove();
      }
    };
  }, [injectStyles]);

  const contextValue: AdaptiveUIContextValue = {
    cognitiveState,
    simplification,
    simplificationLevel,
    isSimplified,
    isHighLoad,
    setManualLevel,
    toggleSimplification,
    hubId,
  };

  return (
    <AdaptiveUIContext.Provider value={contextValue}>
      <div
        className={`adaptive-ui-root ${getSimplificationClasses(simplificationLevel)}`}
        data-simplification={simplificationLevel}
        data-cognitive-load={cognitiveState.level}
        data-hub={hubId}
      >
        {children}
      </div>
    </AdaptiveUIContext.Provider>
  );
};

// ============================================================================
// Container Component
// ============================================================================

/**
 * AdaptiveContainer - Container that responds to simplification
 * 
 * @example
 * ```tsx
 * <AdaptiveContainer minSimplification="moderate">
 *   <ComplexContent />
 * </AdaptiveContainer>
 * ```
 */
export const AdaptiveContainer: React.FC<AdaptiveContainerProps> = ({
  children,
  className = '',
  style,
  minSimplification = 'none',
  animate = true,
}) => {
  const { simplificationLevel } = useAdaptiveUI();

  const shouldShow = useMemo(() => {
    const levels: SimplificationLevel[] = ['none', 'subtle', 'moderate', 'aggressive'];
    const currentIndex = levels.indexOf(simplificationLevel);
    const minIndex = levels.indexOf(minSimplification);
    return currentIndex >= minIndex;
  }, [simplificationLevel, minSimplification]);

  const content = (
    <div
      className={`adaptive-container ${className}`}
      style={style}
      data-adaptive-visible={shouldShow}
    >
      {children}
    </div>
  );

  if (!animate) {
    return shouldShow ? content : null;
  }

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {content}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// View Components
// ============================================================================

/**
 * SimplifiedView - Content only shown when simplified
 * 
 * @example
 * ```tsx
 * <SimplifiedView when="moderate">
 *   <SimpleHelpText />
 * </SimplifiedView>
 * ```
 */
export const SimplifiedView: React.FC<SimplifiedViewProps> = ({
  children,
  when = 'subtle',
  animate = true,
}) => {
  const { simplificationLevel } = useAdaptiveUI();

  const shouldShow = useMemo(() => {
    const levels: SimplificationLevel[] = ['none', 'subtle', 'moderate', 'aggressive'];
    const currentIndex = levels.indexOf(simplificationLevel);
    const whenIndex = levels.indexOf(when);
    return currentIndex >= whenIndex;
  }, [simplificationLevel, when]);

  if (!animate) {
    return shouldShow ? <>{children}</> : null;
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

/**
 * FullView - Content only shown in full mode
 * 
 * @example
 * ```tsx
 * <FullView until="moderate">
 *   <AdvancedOptions />
 * </FullView>
 * ```
 */
export const FullView: React.FC<FullViewProps> = ({
  children,
  until = 'subtle',
  animate = true,
}) => {
  const { simplificationLevel } = useAdaptiveUI();

  const shouldShow = useMemo(() => {
    const levels: SimplificationLevel[] = ['none', 'subtle', 'moderate', 'aggressive'];
    const currentIndex = levels.indexOf(simplificationLevel);
    const untilIndex = levels.indexOf(until);
    return currentIndex <= untilIndex;
  }, [simplificationLevel, until]);

  if (!animate) {
    return shouldShow ? <>{children}</> : null;
  }

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ============================================================================
// Toggle Component
// ============================================================================

interface SimplificationToggleProps {
  /** Custom className */
  className?: string;
  /** Custom label */
  label?: string;
  /** Position on screen */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  /** Show load indicator */
  showIndicator?: boolean;
}

/**
 * SimplificationToggle - Button to manually toggle simplification
 * 
 * @example
 * ```tsx
 * <SimplificationToggle position="bottom-right" showIndicator />
 * ```
 */
export const SimplificationToggle: React.FC<SimplificationToggleProps> = ({
  className = '',
  label,
  position = 'bottom-right',
  showIndicator = true,
}) => {
  const { 
    isSimplified, 
    simplificationLevel, 
    cognitiveState,
    toggleSimplification 
  } = useAdaptiveUI();

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getLevelColor = () => {
    switch (cognitiveState.level) {
      case 'low': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'high': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <button
      onClick={toggleSimplification}
      className={`
        fixed ${positionClasses[position]} z-50
        flex items-center gap-2 px-3 py-2
        bg-[#0a0a0f]/90 backdrop-blur-sm
        border border-[#00d4ff]/30 rounded-lg
        text-white text-sm font-medium
        hover:bg-[#00d4ff]/10 transition-colors
        focus:outline-none focus:ring-2 focus:ring-[#00d4ff]
        ${className}
      `}
      aria-pressed={isSimplified}
      title={`Cognitive load: ${cognitiveState.level} (${cognitiveState.score})`}
    >
      {showIndicator && (
        <span 
          className={`w-2 h-2 rounded-full ${getLevelColor()} animate-pulse`}
          aria-hidden="true"
        />
      )}
      <span>
        {label || (isSimplified ? 'Simplified Mode' : 'Full Mode')}
      </span>
      <span className="text-xs text-white/60">
        ({simplificationLevel})
      </span>
    </button>
  );
};

// ============================================================================
// Load Indicator Component
// ============================================================================

interface LoadIndicatorProps {
  /** Show detailed metrics */
  detailed?: boolean;
  /** Custom className */
  className?: string;
  /** Position */
  position?: 'inline' | 'fixed';
}

/**
 * LoadIndicator - Visual indicator of current cognitive load
 * 
 * @example
 * ```tsx
 * <LoadIndicator detailed position="fixed" />
 * ```
 */
export const LoadIndicator: React.FC<LoadIndicatorProps> = ({
  detailed = false,
  className = '',
  position = 'inline',
}) => {
  const { cognitiveState, simplificationLevel } = useAdaptiveUI();

  const getLevelColor = () => {
    switch (cognitiveState.level) {
      case 'low': return 'text-green-400 border-green-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      case 'high': return 'text-orange-400 border-orange-400';
      case 'critical': return 'text-red-400 border-red-400';
      default: return 'text-gray-400 border-gray-400';
    }
  };

  const content = (
    <div
      className={`
        ${position === 'fixed' ? 'fixed top-4 right-4 z-50' : ''}
        ${detailed ? 'p-4' : 'px-3 py-1'}
        bg-[#0a0a0f]/90 backdrop-blur-sm
        border rounded-lg ${getLevelColor()}
        ${className}
      `}
    >
      <div className="flex items-center gap-2">
        <span className="font-medium">Load: {cognitiveState.level}</span>
        <span className="text-white/60">({cognitiveState.score})</span>
      </div>
      
      {detailed && (
        <div className="mt-2 space-y-1 text-sm">
          <div className="text-white/70">
            Simplification: {simplificationLevel}
          </div>
          <div className="text-white/70">
            Trend: {cognitiveState.trend}
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
            <div>Mouse: {cognitiveState.metrics.mouseStress}</div>
            <div>Scroll: {cognitiveState.metrics.scrollConfusion}</div>
            <div>Typing: {cognitiveState.metrics.typingStress}</div>
            <div>Nav: {cognitiveState.metrics.navigationConfusion}</div>
          </div>
        </div>
      )}
    </div>
  );

  return content;
};

// ============================================================================
// Progressive Disclosure Component
// ============================================================================

interface ProgressiveDisclosureProps {
  /** Summary content always visible */
  summary: ReactNode;
  /** Detail content revealed on interaction */
  details: ReactNode;
  /** When to show details */
  showDetails?: boolean;
  /** Default expanded state */
  defaultExpanded?: boolean;
}

/**
 * ProgressiveDisclosure - Show more content based on load
 * 
 * @example
 * ```tsx
 * <ProgressiveDisclosure
 *   summary={<SummaryContent />}
 *   details={<DetailedContent />}
 *   showDetails={simplificationLevel === 'none'}
 * />
 * ```
 */
export const ProgressiveDisclosure: React.FC<ProgressiveDisclosureProps> = ({
  summary,
  details,
  showDetails,
  defaultExpanded = false,
}) => {
  const { simplificationLevel } = useAdaptiveUI();
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  const shouldShowDetails = showDetails ?? simplificationLevel === 'none';

  return (
    <div className="progressive-disclosure">
      <div className="summary">{summary}</div>
      
      <AnimatePresence>
        {(shouldShowDetails || isExpanded) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="details overflow-hidden"
          >
            {details}
          </motion.div>
        )}
      </AnimatePresence>

      {!shouldShowDetails && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-[#00d4ff] text-sm hover:underline mt-2"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};

// ============================================================================
// Smart Defaults Component
// ============================================================================

interface SmartDefaultProps<T> {
  /** Full complexity value */
  fullValue: T;
  /** Simplified value */
  simplifiedValue: T;
  /** High load value (optional) */
  highLoadValue?: T;
  /** Render prop */
  children: (value: T) => ReactNode;
}

/**
 * SmartDefault - Automatically select value based on cognitive load
 * 
 * @example
 * ```tsx
 * <SmartDefault
 *   fullValue={complexChartConfig}
 *   simplifiedValue={simpleChartConfig}
 * >
 *   {(config) => <Chart config={config} />}
 * </SmartDefault>
 * ```
 */
export function SmartDefault<T>({
  fullValue,
  simplifiedValue,
  highLoadValue,
  children,
}: SmartDefaultProps<T>): JSX.Element {
  const { simplificationLevel, isHighLoad } = useAdaptiveUI();

  const value = useMemo(() => {
    if (isHighLoad && highLoadValue !== undefined) {
      return highLoadValue;
    }
    if (simplificationLevel === 'none') {
      return fullValue;
    }
    return simplifiedValue;
  }, [simplificationLevel, isHighLoad, fullValue, simplifiedValue, highLoadValue]);

  return <>{children(value)}</>;
}

// ============================================================================
// Export
// ============================================================================

export default {
  Provider: AdaptiveUIProvider,
  Container: AdaptiveContainer,
  SimplifiedView,
  FullView,
  Toggle: SimplificationToggle,
  LoadIndicator,
  ProgressiveDisclosure,
  SmartDefault,
  useAdaptiveUI,
};
