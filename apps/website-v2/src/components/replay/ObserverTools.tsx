/** [Ver001.000] */
/**
 * Observer Tools Component
 * ========================
 * X-ray mode, trajectory visualization, and player info overlays.
 * 
 * Features: X-ray, trajectory toggle, player info overlay
 * Agent: TL-S2-2-D
 * Team: Replay 2.0 Core (TL-S2)
 */

import React, { useCallback, useState } from 'react';
import {
  Eye,
  EyeOff,
  Target,
  Users,
  Activity,
  ScanEye,
  Crosshair,
  Heart,
  Menu,
  X,
  ChevronRight,
  Layers,
  Zap,
  Settings2,
} from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

import {
  useMultiViewStore,
  useTools,
  useIsToolEnabled,
  type ObserverTools,
  DEFAULT_TOOLS,
} from '@/lib/replay/multiview/state';

// ============================================================================
// Utility Functions
// ============================================================================

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Types
// ============================================================================

export interface ObserverToolsProps {
  /** Additional CSS classes */
  className?: string;
  /** Whether tools are disabled */
  disabled?: boolean;
  /** Compact mode (icon only) */
  compact?: boolean;
  /** Callback when tool changes */
  onToolChange?: (tool: keyof ObserverTools, value: boolean) => void;
  /** Callback when all tools are reset */
  onReset?: () => void;
}

export interface ToolToggleProps {
  tool: keyof ObserverTools;
  icon: React.ReactNode;
  activeIcon?: React.ReactNode;
  label: string;
  description?: string;
  disabled?: boolean;
  compact?: boolean;
}

export interface ToolSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

// ============================================================================
// Tool Toggle Component
// ============================================================================

const ToolToggle: React.FC<ToolToggleProps> = ({
  tool,
  icon,
  activeIcon,
  label,
  description,
  disabled = false,
  compact = false,
}) => {
  const store = useMultiViewStore();
  const isEnabled = useIsToolEnabled(tool);

  const handleToggle = useCallback(() => {
    if (!disabled) {
      store.toggleTool(tool);
    }
  }, [tool, disabled, store]);

  if (compact) {
    return (
      <button
        onClick={handleToggle}
        disabled={disabled}
        className={cn(
          "p-2 rounded-lg transition-all duration-200",
          isEnabled
            ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
            : "bg-gray-800 text-gray-400 hover:bg-gray-700",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        title={label}
      >
        {isEnabled && activeIcon ? activeIcon : icon}
      </button>
    );
  }

  return (
    <button
      onClick={handleToggle}
      disabled={disabled}
      className={cn(
        "flex items-center gap-3 w-full p-3 rounded-lg transition-all duration-200",
        "text-left border",
        isEnabled
          ? "bg-blue-600/20 border-blue-500/50 text-blue-100"
          : "bg-gray-800/50 border-gray-700 text-gray-300 hover:bg-gray-800",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <div className={cn(
        "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
        isEnabled ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"
      )}>
        {isEnabled && activeIcon ? activeIcon : icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium">{label}</div>
        {description && (
          <div className="text-sm text-gray-500 truncate">{description}</div>
        )}
      </div>
      <div className={cn(
        "w-5 h-5 rounded-full border-2 transition-colors",
        isEnabled
          ? "bg-blue-500 border-blue-500"
          : "border-gray-600"
      )}>
        {isEnabled && (
          <svg className="w-full h-full text-white" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        )}
      </div>
    </button>
  );
};

// ============================================================================
// Tool Section Component
// ============================================================================

const ToolSection: React.FC<ToolSectionProps> = ({
  title,
  icon,
  children,
  defaultExpanded = true,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="border-b border-gray-700 last:border-b-0">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full px-4 py-3 text-gray-300 hover:text-white transition-colors"
      >
        <div className="flex items-center gap-2">
          {icon}
          <span className="font-medium">{title}</span>
        </div>
        <ChevronRight className={cn(
          "w-4 h-4 transition-transform duration-200",
          isExpanded && "rotate-90"
        )} />
      </button>
      
      {isExpanded && (
        <div className="px-4 pb-4 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// X-Ray Mode Indicator
// ============================================================================

export const XRayIndicator: React.FC<{
  isActive: boolean;
  className?: string;
}> = ({ isActive, className }) => {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium",
      isActive 
        ? "bg-green-500/20 text-green-400 border border-green-500/30"
        : "bg-gray-800 text-gray-500",
      className
    )}>
      <ScanEye className="w-3 h-3" />
      <span>X-Ray</span>
      {isActive && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
    </div>
  );
};

// ============================================================================
// Trajectory Visualization Toggle
// ============================================================================

export const TrajectoryToggle: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <ToolToggle
      tool="trajectoryVisualization"
      icon={<Target className="w-5 h-5" />}
      activeIcon={<Crosshair className="w-5 h-5" />}
      label="Trajectory Lines"
      description="Show bullet and grenade paths"
      compact
    />
  );
};

// ============================================================================
// Player Info Toggle
// ============================================================================

export const PlayerInfoToggle: React.FC<{
  className?: string;
}> = ({ className }) => {
  return (
    <ToolToggle
      tool="playerInfoOverlay"
      icon={<Users className="w-5 h-5" />}
      label="Player Info"
      description="Show names and stats"
      compact
    />
  );
};

// ============================================================================
// Main ObserverTools Component
// ============================================================================

export const ObserverTools: React.FC<ObserverToolsProps> = ({
  className,
  disabled = false,
  compact = false,
  onToolChange,
  onReset,
}) => {
  const store = useMultiViewStore();
  const tools = useTools();
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const handleReset = useCallback(() => {
    store.resetTools();
    onReset?.();
  }, [store, onReset]);

  // Subscribe to tool changes
  React.useEffect(() => {
    const unsubscribe = useMultiViewStore.subscribe(
      state => state.tools,
      (newTools) => {
        // Notify of any changes
        (Object.keys(newTools) as Array<keyof ObserverTools>).forEach(tool => {
          onToolChange?.(tool, newTools[tool]);
        });
      }
    );
    return unsubscribe;
  }, [onToolChange]);

  // Compact toolbar
  if (compact) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        <ToolToggle
          tool="xrayMode"
          icon={<EyeOff className="w-4 h-4" />}
          activeIcon={<Eye className="w-4 h-4" />}
          label="X-Ray"
          disabled={disabled}
          compact
        />
        <ToolToggle
          tool="trajectoryVisualization"
          icon={<Target className="w-4 h-4" />}
          label="Trajectories"
          disabled={disabled}
          compact
        />
        <ToolToggle
          tool="playerInfoOverlay"
          icon={<Users className="w-4 h-4" />}
          label="Player Info"
          disabled={disabled}
          compact
        />
        <ToolToggle
          tool="outlinePlayers"
          icon={<Layers className="w-4 h-4" />}
          label="Outlines"
          disabled={disabled}
          compact
        />
      </div>
    );
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsPanelOpen(!isPanelOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg transition-colors",
          isPanelOpen
            ? "bg-blue-600 text-white"
            : "bg-gray-800 text-gray-300 hover:bg-gray-700",
          className
        )}
      >
        <Settings2 className="w-4 h-4" />
        <span className="hidden sm:inline">Observer Tools</span>
        {(tools.xrayMode || tools.trajectoryVisualization) && (
          <span className="w-2 h-2 rounded-full bg-green-400" />
        )}
      </button>

      {/* Tools Panel */}
      {isPanelOpen && (
        <div className={cn(
          "fixed right-0 top-16 bottom-0 w-80 z-50",
          "bg-gray-900 border-l border-gray-700 shadow-2xl",
          "flex flex-col"
        )}>
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700">
            <div className="flex items-center gap-2">
              <ScanEye className="w-5 h-5 text-blue-400" />
              <span className="font-semibold text-gray-100">Observer Tools</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={handleReset}
                className="px-2 py-1 text-xs text-gray-400 hover:text-white transition-colors"
                title="Reset to defaults"
              >
                Reset
              </button>
              <button
                onClick={() => setIsPanelOpen(false)}
                className="p-1 rounded hover:bg-gray-800 text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tools List */}
          <div className="flex-1 overflow-y-auto">
            <ToolSection title="Vision" icon={<Eye className="w-4 h-4" />}>
              <ToolToggle
                tool="xrayMode"
                icon={<ScanEye className="w-5 h-5" />}
                activeIcon={<Eye className="w-5 h-5" />}
                label="X-Ray Mode"
                description="See players through walls"
                disabled={disabled}
              />
              <ToolToggle
                tool="showVisionCones"
                icon={<Zap className="w-5 h-5" />}
                label="Vision Cones"
                description="Show player field of view"
                disabled={disabled}
              />
            </ToolSection>

            <ToolSection title="Visualizations" icon={<Target className="w-4 h-4" />}>
              <ToolToggle
                tool="trajectoryVisualization"
                icon={<Target className="w-5 h-5" />}
                activeIcon={<Crosshair className="w-5 h-5" />}
                label="Trajectory Lines"
                description="Bullet and grenade paths"
                disabled={disabled}
              />
              <ToolToggle
                tool="outlinePlayers"
                icon={<Layers className="w-5 h-5" />}
                label="Player Outlines"
                description="Highlight all players"
                disabled={disabled}
              />
            </ToolSection>

            <ToolSection title="Overlays" icon={<Users className="w-4 h-4" />}>
              <ToolToggle
                tool="playerInfoOverlay"
                icon={<Users className="w-5 h-5" />}
                label="Player Info"
                description="Names, health, and stats"
                disabled={disabled}
              />
              <ToolToggle
                tool="showHealthBars"
                icon={<Heart className="w-5 h-5" />}
                label="Health Bars"
                description="Show health above players"
                disabled={disabled}
              />
            </ToolSection>
          </div>

          {/* Status Footer */}
          <div className="px-4 py-3 border-t border-gray-700 bg-gray-800/50">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Active tools:</span>
              <span className="font-medium text-gray-200">
                {Object.values(tools).filter(Boolean).length} / {Object.keys(tools).length}
              </span>
            </div>
            
            {/* Active indicators */}
            <div className="flex flex-wrap gap-1 mt-2">
              {tools.xrayMode && (
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs">
                  X-Ray
                </span>
              )}
              {tools.trajectoryVisualization && (
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs">
                  Trajectories
                </span>
              )}
              {tools.playerInfoOverlay && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 text-xs">
                  Player Info
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isPanelOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsPanelOpen(false)}
        />
      )}
    </>
  );
};

// ============================================================================
// Active Tools Bar
// ============================================================================

export const ActiveToolsBar: React.FC<{
  className?: string;
}> = ({ className }) => {
  const tools = useTools();
  const store = useMultiViewStore();

  const activeTools = [
    { key: 'xrayMode' as const, label: 'X-Ray', icon: <ScanEye className="w-3 h-3" /> },
    { key: 'trajectoryVisualization' as const, label: 'Trajectories', icon: <Target className="w-3 h-3" /> },
    { key: 'playerInfoOverlay' as const, label: 'Player Info', icon: <Users className="w-3 h-3" /> },
    { key: 'outlinePlayers' as const, label: 'Outlines', icon: <Layers className="w-3 h-3" /> },
    { key: 'showVisionCones' as const, label: 'Vision', icon: <Zap className="w-3 h-3" /> },
    { key: 'showHealthBars' as const, label: 'Health', icon: <Heart className="w-3 h-3" /> },
  ];

  const hasActiveTools = activeTools.some(t => tools[t.key]);

  if (!hasActiveTools) return null;

  return (
    <div className={cn(
      "flex items-center gap-1 px-2 py-1 rounded-lg",
      "bg-gray-800/80 backdrop-blur border border-gray-700",
      className
    )}>
      {activeTools.map(({ key, label, icon }) => (
        tools[key] && (
          <button
            key={key}
            onClick={() => store.toggleTool(key)}
            className={cn(
              "flex items-center gap-1 px-2 py-1 rounded",
              "bg-blue-600/30 text-blue-300 text-xs",
              "hover:bg-blue-600/50 transition-colors"
            )}
          >
            {icon}
            <span>{label}</span>
          </button>
        )
      ))}
    </div>
  );
};

// ============================================================================
// Keyboard Shortcuts Help
// ============================================================================

export const ObserverToolsShortcuts: React.FC = () => {
  const shortcuts = [
    { key: 'X', tool: 'X-Ray Mode', description: 'Toggle wallhack view' },
    { key: 'T', tool: 'Trajectories', description: 'Show bullet paths' },
    { key: 'I', tool: 'Player Info', description: 'Toggle info overlay' },
    { key: 'O', tool: 'Outlines', description: 'Toggle player outlines' },
    { key: 'V', tool: 'Vision Cones', description: 'Toggle FOV display' },
    { key: 'H', tool: 'Health Bars', description: 'Toggle health display' },
  ];

  return (
    <div className="p-4 bg-gray-900 rounded-lg border border-gray-700">
      <h3 className="text-sm font-semibold text-gray-200 mb-3">Keyboard Shortcuts</h3>
      <div className="space-y-2">
        {shortcuts.map(({ key, tool, description }) => (
          <div key={key} className="flex items-center gap-3 text-sm">
            <kbd className="px-2 py-0.5 rounded bg-gray-800 text-gray-300 font-mono text-xs border border-gray-700">
              {key}
            </kbd>
            <div>
              <span className="text-gray-300">{tool}</span>
              <span className="text-gray-500 ml-2">— {description}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default ObserverTools;
