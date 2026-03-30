/**
 * GestureDemo Component
 * Demonstrates all gesture capabilities
 * [Ver001.000]
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSwipe } from '@/hooks/gestures/useSwipe';
import { usePinch } from '@/hooks/gestures/usePinch';
import { useLongPress, useDoubleTap } from '@/hooks/gestures/useLongPress';
import { cn } from '@/lib/utils';

/**
 * Demo component showcasing swipe gestures
 */
const SwipeDemo: React.FC = () => {
  const [lastSwipe, setLastSwipe] = useState<string>('');
  const [swipeCount, setSwipeCount] = useState(0);

  const { bind, state } = useSwipe(
    (direction, swipeState) => {
      setLastSwipe(`${direction} (velocity: ${swipeState.velocity.toFixed(2)})`);
      setSwipeCount(c => c + 1);
    },
    {
      threshold: 50,
      velocityThreshold: 0.3,
      horizontal: true,
      vertical: true,
    }
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Swipe Detection</h3>
      
      <motion.div
        {...bind()}
        className={cn(
          "h-48 rounded-xl flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors",
          state.isSwiping ? "bg-white/20" : "bg-white/5"
        )}
        animate={{
          scale: state.isSwiping ? 0.98 : 1,
          rotateY: state.direction === 'left' ? -5 : state.direction === 'right' ? 5 : 0,
        }}
      >
        <div className="text-center">
          <div className="text-4xl mb-2">
            {state.direction === 'left' && '←'}
            {state.direction === 'right' && '→'}
            {state.direction === 'up' && '↑'}
            {state.direction === 'down' && '↓'}
            {!state.direction && '↔'}
          </div>
          <p className="text-white/70">Swipe in any direction</p>
          {state.isSwiping && (
            <p className="text-sm text-white/50 mt-2">
              Progress: {(state.progress * 100).toFixed(0)}%
            </p>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-xs text-white/50 uppercase">Last Swipe</div>
          <div className="text-white font-mono">{lastSwipe || '-'}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-xs text-white/50 uppercase">Swipe Count</div>
          <div className="text-white font-mono">{swipeCount}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Demo component showcasing pinch-to-zoom
 */
const PinchDemo: React.FC = () => {
  const [, setImageScale] = useState(1);

  const { bind, state, reset, scaleTo } = usePinch(
    (pinchState) => {
      setImageScale(pinchState.scale);
    },
    {
      minScale: 0.5,
      maxScale: 3,
      doubleTapReset: true,
    }
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Pinch to Zoom</h3>
      
      <div
        {...bind()}
        className="h-48 rounded-xl overflow-hidden bg-white/5 relative touch-none"
      >
        <motion.div
          className="absolute inset-0 flex items-center justify-center"
          animate={{
            scale: state.scale,
          }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          {/* Demo grid pattern */}
          <div 
            className="w-32 h-32 rounded-lg"
            style={{
              background: `
                linear-gradient(45deg, #00d4ff 25%, transparent 25%),
                linear-gradient(-45deg, #00d4ff 25%, transparent 25%),
                linear-gradient(45deg, transparent 75%, #ffd700 75%),
                linear-gradient(-45deg, transparent 75%, #ffd700 75%)
              `,
              backgroundSize: '20px 20px',
              backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
            }}
          />
        </motion.div>

        {/* Scale indicator */}
        <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/50 text-xs text-white font-mono">
          {Math.round(state.scale * 100)}%
        </div>

        {/* Pinch hint */}
        {!state.isPinching && state.scale === 1 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-white/50 text-sm">Pinch or double-tap</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={() => scaleTo(0.5)}
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors"
        >
          50%
        </button>
        <button
          onClick={() => scaleTo(1)}
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors"
        >
          100%
        </button>
        <button
          onClick={() => scaleTo(2)}
          className="flex-1 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors"
        >
          200%
        </button>
        <button
          onClick={reset}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white text-sm transition-colors"
        >
          Reset
        </button>
      </div>
    </div>
  );
};

/**
 * Demo component showcasing long press
 */
const LongPressDemo: React.FC = () => {
  const [pressCount, setPressCount] = useState(0);
  const [longPressCount, setLongPressCount] = useState(0);

  const { bind, state } = useLongPress(
    () => setLongPressCount(c => c + 1),
    () => {},
    (wasLongPress) => {
      if (!wasLongPress) setPressCount(c => c + 1);
    },
    { duration: 500 }
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Long Press</h3>
      
      <motion.div
        {...bind()}
        className={cn(
          "h-32 rounded-xl flex items-center justify-center cursor-pointer transition-colors relative overflow-hidden",
          state.isPressing ? "bg-white/20" : "bg-white/5"
        )}
        animate={{
          scale: state.isPressing ? 0.98 : 1,
        }}
      >
        {/* Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
          <motion.div
            className="h-full bg-[#00d4ff]"
            animate={{ width: `${state.progress * 100}%` }}
          />
        </div>

        <div className="text-center">
          <div className="text-2xl mb-2">
            {state.isLongPressed ? '✓' : state.isPressing ? '...' : '👆'}
          </div>
          <p className="text-white/70">
            {state.isPressing ? 'Hold...' : 'Press or long press'}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-xs text-white/50 uppercase">Regular Presses</div>
          <div className="text-white font-mono text-xl">{pressCount}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-xs text-white/50 uppercase">Long Presses</div>
          <div className="text-[#00d4ff] font-mono text-xl">{longPressCount}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Demo component showcasing double tap
 */
const DoubleTapDemo: React.FC = () => {
  const [tapCount, setTapCount] = useState(0);
  const [doubleTapCount, setDoubleTapCount] = useState(0);
  const [showPulse, setShowPulse] = useState(false);

  const { bind, isDoubleTap } = useDoubleTap(
    () => {
      setDoubleTapCount(c => c + 1);
      setShowPulse(true);
      setTimeout(() => setShowPulse(false), 300);
    },
    () => setTapCount(c => c + 1),
    { delay: 300 }
  );

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-white">Double Tap</h3>
      
      <div
        {...bind()}
        className="h-32 rounded-xl flex items-center justify-center cursor-pointer bg-white/5 relative overflow-hidden"
      >
        {/* Pulse effect */}
        <AnimatePresence>
          {showPulse && (
            <motion.div
              className="absolute w-20 h-20 rounded-full border-2 border-[#ffd700]"
              initial={{ scale: 0.5, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              exit={{ opacity: 0 }}
            />
          )}
        </AnimatePresence>

        <div className="text-center relative z-10">
          <motion.div
            className="text-2xl mb-2"
            animate={{ scale: isDoubleTap ? [1, 1.3, 1] : 1 }}
            transition={{ duration: 0.2 }}
          >
            {isDoubleTap ? '⚡' : '👆'}
          </motion.div>
          <p className="text-white/70">Tap or double tap</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-xs text-white/50 uppercase">Single Taps</div>
          <div className="text-white font-mono text-xl">{tapCount}</div>
        </div>
        <div className="p-3 rounded-lg bg-white/5">
          <div className="text-xs text-white/50 uppercase">Double Taps</div>
          <div className="text-[#ffd700] font-mono text-xl">{doubleTapCount}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * Main Gesture Demo component
 */
export const GestureDemo: React.FC = () => {
  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Touch Gestures</h2>
        <p className="text-white/50">Interactive gesture demonstrations</p>
      </div>

      <SwipeDemo />
      <PinchDemo />
      <LongPressDemo />
      <DoubleTapDemo />

      {/* Instructions */}
      <div className="p-4 rounded-xl bg-white/5 text-sm text-white/50">
        <h4 className="font-semibold text-white/70 mb-2">Instructions:</h4>
        <ul className="space-y-1 list-disc list-inside">
          <li><strong>Swipe:</strong> Drag in any direction with velocity</li>
          <li><strong>Pinch:</strong> Use two fingers to zoom (or mouse wheel on desktop)</li>
          <li><strong>Long Press:</strong> Hold for 500ms</li>
          <li><strong>Double Tap:</strong> Tap twice within 300ms</li>
        </ul>
      </div>
    </div>
  );
};

export default GestureDemo;
