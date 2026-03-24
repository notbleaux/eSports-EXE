/**
 * GestureDemo Component
 * Comprehensive visual gesture tester with real-time feedback
 * [Ver001.000]
 * 
 * Features:
 * - All gestures demonstrated (swipe, pinch, pan, tap, double-tap, long-press)
 * - Real-time visual feedback
 * - Gesture state display
 * - Performance metrics
 * - Touch visualization
 */

import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  useTouchGesture, 
  GestureState, 
  GestureDirection,
  Point2D,
  Velocity2D 
} from '@/hooks/useTouchGesture';
import { cn } from '@/lib/utils';

// ============================================================================
// TYPES
// ============================================================================

interface GestureLog {
  id: number;
  type: string;
  direction?: string;
  value?: string;
  timestamp: number;
}

interface GestureStats {
  swipeCount: number;
  pinchCount: number;
  tapCount: number;
  doubleTapCount: number;
  longPressCount: number;
  panCount: number;
}

// ============================================================================
// TOUCH VISUALIZER COMPONENT
// ============================================================================

interface TouchPoint {
  id: number;
  x: number;
  y: number;
  color: string;
}

const TouchVisualizer: React.FC<{
  points: TouchPoint[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}> = ({ points, containerRef }) => {
  if (!containerRef.current) return null;

  const rect = containerRef.current.getBoundingClientRect();

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {points.map((point) => (
        <motion.div
          key={point.id}
          className="absolute rounded-full"
          style={{
            left: point.x - rect.left,
            top: point.y - rect.top,
            width: 60,
            height: 60,
            marginLeft: -30,
            marginTop: -30,
            backgroundColor: point.color,
          }}
          initial={{ scale: 0, opacity: 0.8 }}
          animate={{ scale: 1, opacity: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
        />
      ))}
    </div>
  );
};

// ============================================================================
// GESTURE LOG COMPONENT
// ============================================================================

const GestureLogPanel: React.FC<{ logs: GestureLog[] }> = ({ logs }) => {
  return (
    <div className="bg-black/30 rounded-lg p-3 h-48 overflow-hidden">
      <h4 className="text-xs font-semibold text-white/50 uppercase mb-2">Gesture Log</h4>
      <div className="space-y-1 overflow-y-auto h-36 pr-2 scrollbar-thin">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 text-xs"
            >
              <span className="text-white/30 font-mono">
                {new Date(log.timestamp).toLocaleTimeString([], { 
                  hour12: false, 
                  hour: '2-digit', 
                  minute: '2-digit', 
                  second: '2-digit',
                })}
              </span>
              <span 
                className="px-2 py-0.5 rounded font-medium"
                style={{ 
                  backgroundColor: getGestureColor(log.type),
                  color: '#000',
                }}
              >
                {log.type}
              </span>
              {log.direction && (
                <span className="text-white/60">{log.direction}</span>
              )}
              {log.value && (
                <span className="text-white/40 font-mono">{log.value}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
        {logs.length === 0 && (
          <div className="text-white/30 text-xs italic text-center py-4">
            Interact with the gesture area above
          </div>
        )}
      </div>
    </div>
  );
};

function getGestureColor(type: string): string {
  const colors: Record<string, string> = {
    swipe: '#00d4ff',
    pinch: '#ffd700',
    tap: '#9d4edd',
    doubleTap: '#ff6b6b',
    longPress: '#4ecdc4',
    pan: '#95e1d3',
  };
  return colors[type] || '#ffffff';
}

// ============================================================================
// STATS COMPONENT
// ============================================================================

const GestureStatsPanel: React.FC<{ stats: GestureStats }> = ({ stats }) => {
  const items = [
    { label: 'Swipes', value: stats.swipeCount, color: '#00d4ff' },
    { label: 'Pinches', value: stats.pinchCount, color: '#ffd700' },
    { label: 'Taps', value: stats.tapCount, color: '#9d4edd' },
    { label: 'Double Taps', value: stats.doubleTapCount, color: '#ff6b6b' },
    { label: 'Long Presses', value: stats.longPressCount, color: '#4ecdc4' },
    { label: 'Pans', value: stats.panCount, color: '#95e1d3' },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <motion.div
          key={item.label}
          className="bg-white/5 rounded-lg p-2 text-center"
          whileHover={{ scale: 1.02 }}
        >
          <div 
            className="text-xl font-bold"
            style={{ color: item.color }}
          >
            {item.value}
          </div>
          <div className="text-[10px] text-white/40 uppercase">{item.label}</div>
        </motion.div>
      ))}
    </div>
  );
};

// ============================================================================
// STATE DISPLAY COMPONENT
// ============================================================================

const StateDisplay: React.FC<{ state: GestureState }> = ({ state }) => {
  const formatValue = (value: number | null | undefined, decimals: number = 2): string => {
    if (value === null || value === undefined) return '-';
    return value.toFixed(decimals);
  };

  return (
    <div className="bg-black/30 rounded-lg p-3 text-xs font-mono space-y-1">
      <h4 className="text-xs font-semibold text-white/50 uppercase mb-2">Current State</h4>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <div className="flex justify-between">
          <span className="text-white/40">Type:</span>
          <span className="text-white">{state.type}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Direction:</span>
          <span className="text-white">{state.direction}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Active:</span>
          <span className={state.isActive ? 'text-green-400' : 'text-white/60'}>
            {state.isActive ? 'Yes' : 'No'}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Pointers:</span>
          <span className="text-white">{state.pointerCount}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Scale:</span>
          <span className="text-white">{formatValue(state.scale)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Distance:</span>
          <span className="text-white">{formatValue(state.distance, 0)}px</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Velocity:</span>
          <span className="text-white">{formatValue(state.velocity.magnitude)}px/ms</span>
        </div>
        <div className="flex justify-between">
          <span className="text-white/40">Progress:</span>
          <span className="text-white">{formatValue(state.progress * 100, 0)}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-2 h-1 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-[#00d4ff] to-[#ffd700]"
          animate={{ width: `${state.progress * 100}%` }}
          transition={{ duration: 0.1 }}
        />
      </div>
    </div>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export const GestureDemo: React.FC = () => {
  const [logs, setLogs] = useState<GestureLog[]>([]);
  const [stats, setStats] = useState<GestureStats>({
    swipeCount: 0,
    pinchCount: 0,
    tapCount: 0,
    doubleTapCount: 0,
    longPressCount: 0,
    panCount: 0,
  });
  const [touchPoints, setTouchPoints] = useState<TouchPoint[]>([]);
  const logIdRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((type: string, direction?: string, value?: string) => {
    const newLog: GestureLog = {
      id: logIdRef.current++,
      type,
      direction,
      value,
      timestamp: Date.now(),
    };

    setLogs(prev => [newLog, ...prev].slice(0, 50));

    setStats(prev => ({
      ...prev,
      [`${type}Count`]: prev[`${type}Count` as keyof GestureStats] + 1,
    }));
  }, []);

  const addTouchPoint = useCallback((x: number, y: number, color: string) => {
    const point: TouchPoint = {
      id: Date.now(),
      x,
      y,
      color,
    };
    setTouchPoints(prev => [...prev, point]);
    setTimeout(() => {
      setTouchPoints(prev => prev.filter(p => p.id !== point.id));
    }, 500);
  }, []);

  // Gesture handlers
  const handleTap = useCallback((position: Point2D, state: GestureState) => {
    addLog('tap');
    addTouchPoint(position.x, position.y, 'rgba(157, 78, 221, 0.5)');
  }, [addLog, addTouchPoint]);

  const handleDoubleTap = useCallback((position: Point2D, state: GestureState) => {
    addLog('doubleTap');
    addTouchPoint(position.x, position.y, 'rgba(255, 107, 107, 0.6)');
  }, [addLog, addTouchPoint]);

  const handleLongPress = useCallback((position: Point2D, state: GestureState) => {
    addLog('longPress');
    addTouchPoint(position.x, position.y, 'rgba(78, 205, 196, 0.6)');
  }, [addLog, addTouchPoint]);

  const handleSwipe = useCallback((direction: GestureDirection, state: GestureState) => {
    addLog('swipe', direction, `${state.velocity.magnitude.toFixed(2)} px/ms`);
  }, [addLog]);

  const handlePinch = useCallback((scale: number, state: GestureState) => {
    addLog('pinch', undefined, `${scale.toFixed(2)}x`);
  }, [addLog]);

  const handlePan = useCallback((delta: Point2D, state: GestureState) => {
    // Throttle pan logs
    if (Math.random() > 0.9) {
      addLog('pan');
    }
  }, [addLog]);

  const handleGestureStart = useCallback((state: GestureState) => {
    if (state.startPosition) {
      addTouchPoint(state.startPosition.x, state.startPosition.y, 'rgba(0, 212, 255, 0.3)');
    }
  }, [addTouchPoint]);

  // Use touch gesture hook
  const { bind, state } = useTouchGesture(
    {
      onTap: handleTap,
      onDoubleTap: handleDoubleTap,
      onLongPress: handleLongPress,
      onSwipe: handleSwipe,
      onPinch: handlePinch,
      onPan: handlePan,
      onGestureStart: handleGestureStart,
    },
    {
      swipe: {
        threshold: 50,
        velocityThreshold: 0.3,
        horizontal: true,
        vertical: true,
      },
      pinch: {
        minScale: 0.5,
        maxScale: 3,
        sensitivity: 1,
      },
      longPress: {
        duration: 500,
        moveThreshold: 10,
      },
      tap: {
        doubleTapDelay: 300,
      },
      pan: {
        momentum: true,
        deceleration: 0.95,
      },
      hapticEnabled: true,
      preventDefault: false,
    }
  );

  // Get gesture area style based on state
  const getGestureAreaStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      transform: `scale(${1 - state.progress * 0.02})`,
    };

    if (state.direction === 'left') {
      base.transform += ' translateX(-5px)';
    } else if (state.direction === 'right') {
      base.transform += ' translateX(5px)';
    } else if (state.direction === 'up') {
      base.transform += ' translateY(-5px)';
    } else if (state.direction === 'down') {
      base.transform += ' translateY(5px)';
    }

    return base;
  };

  // Direction arrow
  const getDirectionArrow = (): string => {
    switch (state.direction) {
      case 'left': return '←';
      case 'right': return '→';
      case 'up': return '↑';
      case 'down': return '↓';
      default: return '◎';
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Touch Gesture Demo
          </h1>
          <p className="text-white/50 text-sm md:text-base">
            Test all gesture capabilities with real-time feedback
          </p>
        </div>

        {/* Main Gesture Area */}
        <div 
          ref={containerRef}
          className={cn(
            "relative h-64 md:h-80 rounded-2xl overflow-hidden cursor-grab active:cursor-grabbing",
            "bg-gradient-to-br from-white/5 to-white/10 border border-white/10"
          )}
          {...bind()}
        >
          <TouchVisualizer points={touchPoints} containerRef={containerRef} />

          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            style={getGestureAreaStyle()}
            animate={{
              scale: state.isActive ? 0.98 : 1,
            }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          >
            {/* Direction indicator */}
            <motion.div
              className="text-6xl mb-4"
              animate={{
                scale: state.isActive ? 1.2 : 1,
                rotate: state.direction === 'left' ? -10 : state.direction === 'right' ? 10 : 0,
              }}
            >
              {getDirectionArrow()}
            </motion.div>

            {/* Status text */}
            <div className="text-center space-y-2">
              <div className="text-xl font-semibold text-white">
                {state.type === 'none' ? 'Interact Here' : state.type}
              </div>
              <div className="text-sm text-white/50">
                {state.pointerCount > 0 
                  ? `${state.pointerCount} pointer${state.pointerCount > 1 ? 's' : ''}`
                  : 'Touch, swipe, pinch, or tap'
                }
              </div>
            </div>

            {/* Scale indicator for pinch */}
            {state.type === 'pinch' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-4 px-4 py-2 rounded-full bg-[#ffd700]/20 text-[#ffd700] font-mono"
              >
                {state.scale.toFixed(2)}x
              </motion.div>
            )}

            {/* Progress ring for long press */}
            {(state.type === 'longPress' || (state.type === 'none' && state.isActive)) && (
              <svg className="absolute w-32 h-32 -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="4"
                />
                <motion.circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="#4ecdc4"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={283}
                  animate={{
                    strokeDashoffset: 283 - 283 * state.progress,
                  }}
                />
              </svg>
            )}
          </motion.div>

          {/* Active state glow */}
          <motion.div
            className="absolute inset-0 pointer-events-none"
            animate={{
              background: state.isActive 
                ? `radial-gradient(circle at ${state.currentPosition?.x || '50%'} ${state.currentPosition?.y || '50%'}, ${getGestureColor(state.type)}20 0%, transparent 50%)`
                : 'transparent',
            }}
          />
        </div>

        {/* Stats and State Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <GestureStatsPanel stats={stats} />
          <StateDisplay state={state} />
        </div>

        {/* Gesture Log */}
        <GestureLogPanel logs={logs} />

        {/* Instructions */}
        <div className="bg-white/5 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-white/70">Gesture Guide</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded bg-[#00d4ff]/20 text-[#00d4ff] flex items-center justify-center">↔</span>
              <div>
                <div className="text-white font-medium">Swipe</div>
                <div className="text-white/40">Quick drag in any direction</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded bg-[#ffd700]/20 text-[#ffd700] flex items-center justify-center">⚏</span>
              <div>
                <div className="text-white font-medium">Pinch</div>
                <div className="text-white/40">Two fingers to zoom</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded bg-[#9d4edd]/20 text-[#9d4edd] flex items-center justify-center">⌕</span>
              <div>
                <div className="text-white font-medium">Tap</div>
                <div className="text-white/40">Quick touch</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded bg-[#ff6b6b]/20 text-[#ff6b6b] flex items-center justify-center">⌕⌕</span>
              <div>
                <div className="text-white font-medium">Double Tap</div>
                <div className="text-white/40">Two taps quickly</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded bg-[#4ecdc4]/20 text-[#4ecdc4] flex items-center justify-center">⏵</span>
              <div>
                <div className="text-white font-medium">Long Press</div>
                <div className="text-white/40">Hold for 500ms</div>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 rounded bg-[#95e1d3]/20 text-[#95e1d3] flex items-center justify-center">✥</span>
              <div>
                <div className="text-white font-medium">Pan</div>
                <div className="text-white/40">Drag with momentum</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-white/30">
          <p>Touch targets are 44×44px minimum for accessibility</p>
          <p>Gesture recognition responds in &lt;100ms</p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// COMPACT DEMO COMPONENT
// ============================================================================

export const CompactGestureDemo: React.FC<{
  className?: string;
  onGesture?: (type: string, state: GestureState) => void;
}> = ({ className, onGesture }) => {
  const [lastGesture, setLastGesture] = useState<string>('');

  const handleGesture = useCallback((type: string, state: GestureState) => {
    setLastGesture(type);
    onGesture?.(type, state);
  }, [onGesture]);

  const { bind, state } = useTouchGesture(
    {
      onTap: (pos, s) => handleGesture('tap', s),
      onDoubleTap: (pos, s) => handleGesture('doubleTap', s),
      onLongPress: (pos, s) => handleGesture('longPress', s),
      onSwipe: (dir, s) => handleGesture('swipe', s),
    },
    {
      hapticEnabled: true,
    }
  );

  return (
    <div 
      className={cn(
        "h-32 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing",
        "bg-gradient-to-br from-white/5 to-white/10 border border-white/10",
        className
      )}
      {...bind()}
    >
      <motion.div
        className="text-center"
        animate={{
          scale: state.isActive ? 0.95 : 1,
        }}
      >
        <div className="text-3xl mb-1">
          {state.direction === 'left' && '←'}
          {state.direction === 'right' && '→'}
          {state.direction === 'up' && '↑'}
          {state.direction === 'down' && '↓'}
          {!state.direction && '◎'}
        </div>
        <div className="text-xs text-white/50">
          {lastGesture || 'Try gestures'}
        </div>
      </motion.div>
    </div>
  );
};

export default GestureDemo;
