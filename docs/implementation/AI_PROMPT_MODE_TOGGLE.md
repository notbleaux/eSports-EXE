[Ver001.000]

# AI IMPLEMENTATION PROMPT: SATOR ↔ ROTAS Mode Toggle
## Dual-State Theme System

**Purpose:** Guide AI agents to implement the global mode toggle system that switches between SATOR (data ingestion) and ROTAS (analytics/prediction) modes.

---

## I. CONCEPT OVERVIEW

The Mode Toggle represents the dual nature of the platform:
- **SATOR Mode**: Data ingestion, raw feeds, real-time monitoring (Cyan accent)
- **ROTAS Mode**: Analytics, predictions, insights (Red accent)

This is NOT just a dark/light toggle - it's a functional mode switch that changes:
- Color scheme
- Dashboard layout
- Data presentation
- Available features

---

## II. STATE MANAGEMENT

### 2.1 Zustand Store

```typescript
// store/modeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AppMode = 'SATOR' | 'ROTAS';

interface ModeState {
  mode: AppMode;
  isTransitioning: boolean;
  toggleMode: () => void;
  setMode: (mode: AppMode) => void;
  startTransition: () => void;
  endTransition: () => void;
}

interface ModeColors {
  accent: string;
  accentGlow: string;
  accentMuted: string;
  gradient: string;
  liveIndicator: string;
}

const MODE_COLORS: Record<AppMode, ModeColors> = {
  SATOR: {
    accent: '#00D4FF',           // Cyan
    accentGlow: 'rgba(0, 212, 255, 0.5)',
    accentMuted: '#00A0C0',
    gradient: 'linear-gradient(135deg, #00D4FF 0%, #0066FF 100%)',
    liveIndicator: '#00D4FF',
  },
  ROTAS: {
    accent: '#FF4655',           // Tactical Red
    accentGlow: 'rgba(255, 70, 85, 0.5)',
    accentMuted: '#CC3A47',
    gradient: 'linear-gradient(135deg, #FF4655 0%, #FF6B00 100%)',
    liveIndicator: '#FF4655',
  },
};

export const useModeStore = create<ModeState>()(
  persist(
    (set) => ({
      mode: 'SATOR',
      isTransitioning: false,
      
      toggleMode: () => set((state) => {
        const newMode = state.mode === 'SATOR' ? 'ROTAS' : 'SATOR';
        return { mode: newMode, isTransitioning: true };
      }),
      
      setMode: (mode) => set({ mode, isTransitioning: true }),
      
      startTransition: () => set({ isTransitioning: true }),
      endTransition: () => set({ isTransitioning: false }),
    }),
    {
      name: 'sator-mode-storage',
      partialize: (state) => ({ mode: state.mode }), // Only persist mode
    }
  )
);

// Hook for getting current mode colors
export function useModeColors(): ModeColors {
  const { mode } = useModeStore();
  return MODE_COLORS[mode];
}
```

### 2.2 Transition Management

```typescript
// hooks/useModeTransition.ts
import { useEffect } from 'react';
import { useModeStore } from '@/store/modeStore';

export function useModeTransition(duration: number = 500) {
  const { isTransitioning, endTransition } = useModeStore();
  
  useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        endTransition();
      }, duration);
      
      return () => clearTimeout(timer);
    }
  }, [isTransitioning, duration, endTransition]);
  
  return isTransitioning;
}
```

---

## III. TOGGLE COMPONENT

### 3.1 Visual Design

```tsx
// components/ModeToggle.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Activity } from 'lucide-react';
import { useModeStore, useModeColors } from '@/store/modeStore';

export function ModeToggle({ className = '' }: { className?: string }) {
  const { mode, toggleMode, isTransitioning } = useModeStore();
  const colors = useModeColors();
  
  return (
    <motion.button
      onClick={toggleMode}
      disabled={isTransitioning}
      className={`
        relative flex items-center gap-3 px-4 py-2 rounded-xl
        border transition-all duration-300
        ${className}
      `}
      style={{
        backgroundColor: mode === 'SATOR' 
          ? 'rgba(0, 212, 255, 0.1)' 
          : 'rgba(255, 70, 85, 0.1)',
        borderColor: mode === 'SATOR'
          ? 'rgba(0, 212, 255, 0.3)'
          : 'rgba(255, 70, 85, 0.3)',
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Mode Icons */}
      <div className="flex items-center gap-2">
        <motion.div
          animate={{
            color: mode === 'SATOR' ? '#00D4FF' : '#FFFFFF',
            opacity: mode === 'SATOR' ? 1 : 0.5,
          }}
          className="flex items-center gap-1.5"
        >
          <Database className="w-4 h-4" />
          <span className="text-sm font-medium">SATOR</span>
        </motion.div>
        
        {/* Toggle Switch */}
        <div 
          className="relative w-12 h-6 rounded-full"
          style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
        >
          <motion.div
            className="absolute top-1 w-4 h-4 rounded-full"
            animate={{
              left: mode === 'SATOR' ? '4px' : '28px',
              backgroundColor: colors.accent,
              boxShadow: `0 0 10px ${colors.accentGlow}`,
            }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        </div>
        
        <motion.div
          animate={{
            color: mode === 'ROTAS' ? '#FF4655' : '#FFFFFF',
            opacity: mode === 'ROTAS' ? 1 : 0.5,
          }}
          className="flex items-center gap-1.5"
        >
          <Activity className="w-4 h-4" />
          <span className="text-sm font-medium">ROTAS</span>
        </motion.div>
      </div>
      
      {/* Transition Indicator */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            className="absolute inset-0 flex items-center justify-center rounded-xl"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}
```

### 3.2 Alternative: Segmented Control Style

```tsx
// components/ModeToggleSegmented.tsx
export function ModeToggleSegmented({ className = '' }: { className?: string }) {
  const { mode, toggleMode } = useModeStore();
  
  return (
    <div className={`relative flex bg-white/5 rounded-lg p-1 ${className}`}>
      {/* Sliding background */}
      <motion.div
        className="absolute inset-y-1 rounded-md"
        style={{
          backgroundColor: mode === 'SATOR' 
            ? 'rgba(0, 212, 255, 0.2)' 
            : 'rgba(255, 70, 85, 0.2)',
        }}
        animate={{
          left: mode === 'SATOR' ? '4px' : '50%',
          right: mode === 'SATOR' ? '50%' : '4px',
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      />
      
      {/* SATOR Button */}
      <button
        onClick={() => mode !== 'SATOR' && toggleMode()}
        className={`
          relative z-10 flex-1 flex items-center justify-center gap-2 py-2 px-4
          text-sm font-medium transition-colors
          ${mode === 'SATOR' ? 'text-[#00D4FF]' : 'text-white/50'}
        `}
      >
        <Database className="w-4 h-4" />
        <span className="hidden sm:inline">SATOR</span>
      </button>
      
      {/* ROTAS Button */}
      <button
        onClick={() => mode !== 'ROTAS' && toggleMode()}
        className={`
          relative z-10 flex-1 flex items-center justify-center gap-2 py-2 px-4
          text-sm font-medium transition-colors
          ${mode === 'ROTAS' ? 'text-[#FF4655]' : 'text-white/50'}
        `}
      >
        <Activity className="w-4 h-4" />
        <span className="hidden sm:inline">ROTAS</span>
      </button>
    </div>
  );
}
```

---

## IV. PAGE TRANSITION EFFECTS

### 4.1 Global Transition Wrapper

```tsx
// components/ModeTransitionWrapper.tsx
import { motion, AnimatePresence } from 'framer-motion';
import { useModeStore } from '@/store/modeStore';

export function ModeTransitionWrapper({ children }: { children: React.ReactNode }) {
  const { mode, isTransitioning } = useModeStore();
  
  return (
    <>
      {children}
      
      {/* Full-screen transition overlay */}
      <AnimatePresence>
        {isTransitioning && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[9999] pointer-events-none"
          >
            {/* Split-screen wipe effect */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: [0, 1, 1, 0] }}
              transition={{ 
                duration: 0.6,
                times: [0, 0.4, 0.6, 1],
                ease: 'easeInOut'
              }}
              style={{
                backgroundColor: mode === 'SATOR' ? '#00D4FF' : '#FF4655',
                originX: mode === 'SATOR' ? 0 : 1,
              }}
              className="absolute inset-0"
            />
            
            {/* Mode text reveal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: [0, 1, 1, 0], scale: [0.8, 1, 1, 0.8] }}
              transition={{ duration: 0.6, times: [0, 0.2, 0.8, 1] }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <span 
                className="text-4xl font-bold tracking-wider"
                style={{ color: mode === 'SATOR' ? '#000' : '#FFF' }}
              >
                {mode}
              </span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
```

---

## V. MODE-SPECIFIC COMPONENTS

### 5.1 Dynamic Styling Hook

```typescript
// hooks/useModeStyles.ts
import { useModeStore, useModeColors } from '@/store/modeStore';

export function useModeStyles() {
  const { mode } = useModeStore();
  const colors = useModeColors();
  
  const getButtonStyles = (isPrimary: boolean = false) => ({
    backgroundColor: isPrimary ? colors.accent : 'transparent',
    color: isPrimary ? '#000' : colors.accent,
    borderColor: colors.accent,
    boxShadow: isPrimary ? `0 0 20px ${colors.accentGlow}` : 'none',
  });
  
  const getCardStyles = () => ({
    borderColor: `${colors.accent}30`, // 30 = 20% opacity
    boxShadow: `0 0 30px ${colors.accentGlow}10`,
  });
  
  const getLiveIndicatorStyles = () => ({
    backgroundColor: colors.liveIndicator,
    boxShadow: `0 0 10px ${colors.accentGlow}`,
  });
  
  return {
    mode,
    colors,
    getButtonStyles,
    getCardStyles,
    getLiveIndicatorStyles,
  };
}
```

### 5.2 Mode-Aware Glass Card

```tsx
// components/ModeGlassCard.tsx
import { GlassCard } from './ui/GlassCard';
import { useModeColors } from '@/store/modeStore';

export function ModeGlassCard({ 
  children, 
  className = '',
  ...props 
}: React.ComponentProps<typeof GlassCard>) {
  const colors = useModeColors();
  
  return (
    <GlassCard
      hoverGlow={colors.accentGlow}
      className={className}
      {...props}
    >
      {children}
    </GlassCard>
  );
}
```

---

## VI. INTEGRATION EXAMPLES

### 6.1 In Navigation Header

```tsx
// components/Navigation.tsx
import { ModeToggle } from './ModeToggle';

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link to="/" className="text-xl font-bold">
          4NJZ4
        </Link>
        
        {/* Mode Toggle - Prominent placement */}
        <ModeToggle />
        
        {/* Other nav items */}
        <div className="flex items-center gap-4">
          {/* ... */}
        </div>
      </div>
    </nav>
  );
}
```

### 6.2 In Hub Pages

```tsx
// hub-1-sator/index.tsx
import { useModeColors } from '@/store/modeStore';

export function SatorHub() {
  const colors = useModeColors();
  
  // Use mode-aware colors throughout
  return (
    <div>
      <h1 style={{ color: colors.accent }}>
        SATOR Observatory
      </h1>
      
      <GlassCard hoverGlow={colors.accentGlow}>
        {/* Content */}
      </GlassCard>
    </div>
  );
}
```

---

## VII. MODE-SPECIFIC FEATURES

### 7.1 Conditional Features

```typescript
// Feature availability by mode
const MODE_FEATURES = {
  SATOR: {
    liveData: true,
    rawFeeds: true,
    predictions: false,
    analytics: 'basic',
  },
  ROTAS: {
    liveData: false,
    rawFeeds: false,
    predictions: true,
    analytics: 'advanced',
  },
};

// Hook for checking feature availability
export function useModeFeature(feature: keyof typeof MODE_FEATURES['SATOR']) {
  const { mode } = useModeStore();
  return MODE_FEATURES[mode][feature];
}
```

---

## VIII. TESTING CHECKLIST

- [ ] Toggle switches mode correctly
- [ ] Color scheme updates immediately
- [ ] Transition animation plays smoothly
- [ ] Mode persists after page refresh
- [ ] All mode-aware components update
- [ ] Keyboard accessible (Enter/Space to toggle)
- [ ] Screen reader announces mode change
- [ ] Reduced motion preference respected
- [ ] No flash of wrong mode on load

---

## IX. COMMON AI PITFALLS TO AVOID

### ❌ DON'T:
1. Use local state for mode (must be global)
2. Forget to persist mode preference
3. Use setTimeout without cleanup
4. Hardcode colors in components
5. Forget transition states (jarring switches)
6. Ignore reduced motion preference

### ✅ DO:
1. Use Zustand for global state
2. Implement smooth transitions
3. Test both modes thoroughly
4. Make all accent colors mode-aware
5. Add visual feedback during transition
6. Consider accessibility (aria-live)

---

*End of Mode Toggle Implementation Prompt*
