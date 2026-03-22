[Ver001.000]

# Playbook 3: UI/UX Implementation

## Objective
Implement the 4NJZ4 TENET Platform's visual design system including viscous easing animations, glass morphism components (GlassCard/GlowButton), lensing system for data visualization, and reduced motion support for accessibility.

## Prerequisites
- [ ] Playbook 2 completed
- [ ] Tailwind CSS configured
- [ ] Framer Motion installed
- [ ] Design tokens defined

## Step-by-Step Instructions

### Step 1: Viscous Easing Implementation

**Objective:** Create smooth, heavy easing curves for premium feel.

```bash
# Install Framer Motion if not present
npm install framer-motion
```

**Create Custom Easing Library:**

```typescript
// apps/website-v2/src/lib/animations/easing.ts
import { type Transition } from 'framer-motion';

// Viscous easing curves - heavy, liquid-like motion
export const viscousEasings = {
  // Primary viscous ease - slow start, heavy middle, smooth end
  heavy: [0.22, 1, 0.36, 1] as const,
  
  // Extra viscous - very slow start, pronounced weight
  extra: [0.16, 1, 0.3, 1] as const,
  
  // Liquid - flowing, water-like motion
  liquid: [0.4, 0, 0.2, 1] as const,
  
  // Magnetic - snapping with weight
  magnetic: [0.68, -0.55, 0.265, 1.55] as const,
  
  // Damped - oscillating decay
  damped: [0.34, 1.56, 0.64, 1] as const,
};

// Predefined transition presets
export const transitions = {
  // Standard viscous transition
  viscous: {
    duration: 0.6,
    ease: viscousEasings.heavy,
  } as Transition,
  
  // Quick but weighted
  snappy: {
    duration: 0.3,
    ease: viscousEasings.heavy,
  } as Transition,
  
  // Slow, dramatic
  dramatic: {
    duration: 1.2,
    ease: viscousEasings.extra,
  } as Transition,
  
  // Spring-like physics
  spring: {
    type: 'spring',
    stiffness: 300,
    damping: 30,
    mass: 1.2,
  } as Transition,
  
  // Magnetic snap
  magnetic: {
    type: 'spring',
    stiffness: 500,
    damping: 25,
    mass: 0.8,
  } as Transition,
};

// Stagger configuration for lists
export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

export const staggerItem = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: transitions.viscous,
  },
};
```

**Create Viscous Motion Hook:**

```typescript
// apps/website-v2/src/hooks/useViscousMotion.ts
import { useReducedMotion } from 'framer-motion';
import { transitions } from '../lib/animations/easing';

export function useViscousMotion() {
  const shouldReduceMotion = useReducedMotion();

  const getTransition = (type: keyof typeof transitions = 'viscous') => {
    if (shouldReduceMotion) {
      return { duration: 0 };
    }
    return transitions[type];
  };

  const getHoverScale = () => {
    return shouldReduceMotion ? 1 : 1.02;
  };

  const getTapScale = () => {
    return shouldReduceMotion ? 1 : 0.98;
  };

  return {
    getTransition,
    getHoverScale,
    getTapScale,
    shouldReduceMotion,
  };
}
```

**Verification:**
```bash
npm run typecheck
npm run test -- src/lib/animations/
```

### Step 2: GlassCard Component

**Objective:** Create reusable glass morphism card component.

```typescript
// apps/website-v2/src/components/ui/GlassCard.tsx
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useViscousMotion } from '../../hooks/useViscousMotion';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'elevated' | 'subtle';
  glowColor?: string;
  onClick?: () => void;
  hoverEffect?: boolean;
}

const variants = {
  default: `
    bg-white/5
    backdrop-blur-md
    border border-white/10
    shadow-lg shadow-black/10
  `,
  elevated: `
    bg-white/10
    backdrop-blur-xl
    border border-white/20
    shadow-xl shadow-black/20
  `,
  subtle: `
    bg-white/[0.02]
    backdrop-blur-sm
    border border-white/5
    shadow-md shadow-black/5
  `,
};

export function GlassCard({
  children,
  className,
  variant = 'default',
  glowColor = 'rgba(59, 130, 246, 0.3)',
  onClick,
  hoverEffect = true,
}: GlassCardProps) {
  const { getTransition, getHoverScale } = useViscousMotion();

  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl',
        variants[variant],
        className
      )}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={getTransition('viscous')}
      whileHover={
        hoverEffect
          ? {
              scale: getHoverScale(),
              boxShadow: `0 0 40px ${glowColor}`,
            }
          : undefined
      }
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      style={{
        willChange: 'transform',
      }}
    >
      {/* Glass gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            linear-gradient(
              135deg,
              rgba(255, 255, 255, 0.1) 0%,
              transparent 50%,
              rgba(255, 255, 255, 0.05) 100%
            )
          `,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">{children}</div>
      
      {/* Subtle inner border glow */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          boxShadow: `inset 0 0 20px ${glowColor}`,
        }}
      />
    </motion.div>
  );
}
```

**Verification:**
```bash
# Test component renders
npm run test -- src/components/ui/GlassCard.test.tsx

# Visual check
npm run dev
# Navigate to component and verify glass effect
```

### Step 3: GlowButton Component

**Objective:** Create button with animated glow effect.

```typescript
// apps/website-v2/src/components/ui/GlowButton.tsx
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';
import { useViscousMotion } from '../../hooks/useViscousMotion';

interface GlowButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  glowColor?: string;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
}

const sizeClasses = {
  sm: 'px-4 py-2 text-sm',
  md: 'px-6 py-3 text-base',
  lg: 'px-8 py-4 text-lg',
};

const variantClasses = {
  primary: `
    bg-gradient-to-r from-blue-600 to-purple-600
    text-white
    hover:from-blue-500 hover:to-purple-500
  `,
  secondary: `
    bg-white/10
    text-white
    border border-white/20
    hover:bg-white/20
  `,
  ghost: `
    bg-transparent
    text-white/70
    hover:text-white
    hover:bg-white/5
  `,
};

export function GlowButton({
  children,
  variant = 'primary',
  size = 'md',
  glowColor = 'rgba(59, 130, 246, 0.5)',
  className,
  onClick,
  disabled = false,
  loading = false,
  icon,
}: GlowButtonProps) {
  const { getTransition, getHoverScale } = useViscousMotion();

  return (
    <motion.button
      className={cn(
        'relative overflow-hidden rounded-xl font-medium',
        'transition-colors duration-300',
        'focus:outline-none focus:ring-2 focus:ring-blue-500/50',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      whileHover={
        !disabled && !loading
          ? {
              scale: getHoverScale(),
              boxShadow: `0 0 30px ${glowColor}, 0 0 60px ${glowColor}40`,
            }
          : undefined
      }
      whileTap={!disabled && !loading ? { scale: 0.95 } : undefined}
      transition={getTransition('magnetic')}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {/* Glow background */}
      <motion.div
        className="absolute inset-0 rounded-xl"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        style={{
          background: `radial-gradient(circle at center, ${glowColor} 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
      />
      
      {/* Content */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading && (
          <motion.span
            className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
        )}
        {icon && !loading && icon}
        {children}
      </span>
      
      {/* Ripple effect on click */}
      <motion.span
        className="absolute inset-0 bg-white/20 rounded-xl"
        initial={{ scale: 0, opacity: 0 }}
        whileTap={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.5 }}
      />
    </motion.button>
  );
}
```

**Verification:**
```bash
npm run test -- src/components/ui/GlowButton.test.tsx
```

### Step 4: Lensing System Setup

**Objective:** Implement data lensing/magnification system.

```typescript
// apps/website-v2/src/components/ui/LensingSystem.tsx
import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';

interface LensData {
  id: string;
  x: number;
  y: number;
  content: React.ReactNode;
  size?: number;
}

interface LensingSystemProps {
  children: React.ReactNode;
  className?: string;
  lensSize?: number;
  magnifyScale?: number;
}

export function LensingSystem({
  children,
  className,
  lensSize = 150,
  magnifyScale = 1.5,
}: LensingSystemProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [lensPosition, setLensPosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  const [lenses, setLenses] = useState<LensData[]>([]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      setLensPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      });
    },
    []
  );

  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!containerRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Create new lens
      const newLens: LensData = {
        id: `lens-${Date.now()}`,
        x,
        y,
        content: (
          <div className="text-center">
            <p className="text-xs text-white/60">Position</p>
            <p className="text-sm font-mono">{Math.round(x)}, {Math.round(y)}</p>
          </div>
        ),
        size: lensSize,
      };
      
      setLenses((prev) => [...prev, newLens]);
    },
    [lensSize]
  );

  const removeLens = useCallback((id: string) => {
    setLenses((prev) => prev.filter((lens) => lens.id !== id));
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('relative overflow-hidden', className)}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleClick}
    >
      {/* Base content */}
      <div
        style={{
          transform: isHovering
            ? `scale(${1 / magnifyScale})`
            : 'scale(1)',
          transformOrigin: `${lensPosition.x}px ${lensPosition.y}px`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {children}
      </div>

      {/* Floating cursor lens */}
      <AnimatePresence>
        {isHovering && (
          <motion.div
            className="absolute pointer-events-none rounded-full border-2 border-white/30 overflow-hidden"
            style={{
              width: lensSize,
              height: lensSize,
              left: lensPosition.x - lensSize / 2,
              top: lensPosition.y - lensSize / 2,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            {/* Magnified content */}
            <div
              className="absolute"
              style={{
                width: containerRef.current?.offsetWidth || 0,
                height: containerRef.current?.offsetHeight || 0,
                left: -(lensPosition.x - lensSize / 2) * magnifyScale,
                top: -(lensPosition.y - lensSize / 2) * magnifyScale,
                transform: `scale(${magnifyScale})`,
                transformOrigin: '0 0',
              }}
            >
              {children}
            </div>
            
            {/* Lens overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/20 to-purple-500/20 pointer-events-none" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fixed lenses */}
      <AnimatePresence>
        {lenses.map((lens) => (
          <motion.div
            key={lens.id}
            className="absolute rounded-full border border-white/20 backdrop-blur-sm bg-black/30"
            style={{
              width: lens.size,
              height: lens.size,
              left: lens.x - (lens.size || lensSize) / 2,
              top: lens.y - (lens.size || lensSize) / 2,
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            drag
            dragMomentum={false}
            onClick={(e) => {
              e.stopPropagation();
              removeLens(lens.id);
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center p-2">
              {lens.content}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

**Verification:**
```bash
npm run test -- src/components/ui/LensingSystem.test.tsx
```

### Step 5: Reduced Motion Support

**Objective:** Implement accessibility-friendly motion preferences.

```typescript
// apps/website-v2/src/components/accessibility/ReducedMotionProvider.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { MotionConfig } from 'framer-motion';

interface ReducedMotionContextType {
  prefersReducedMotion: boolean;
  toggleReducedMotion: () => void;
}

const ReducedMotionContext = createContext<ReducedMotionContextType>({
  prefersReducedMotion: false,
  toggleReducedMotion: () => {},
});

export function ReducedMotionProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (event: MediaQueryListEvent) => {
      setPrefersReducedMotion(event.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const toggleReducedMotion = () => {
    setPrefersReducedMotion((prev) => !prev);
  };

  return (
    <ReducedMotionContext.Provider
      value={{ prefersReducedMotion, toggleReducedMotion }}
    >
      <MotionConfig reducedMotion={prefersReducedMotion ? 'always' : 'never'}>
        {children}
      </MotionConfig>
    </ReducedMotionContext.Provider>
  );
}

export function useReducedMotion() {
  return useContext(ReducedMotionContext);
}
```

**Create Accessible Animation Component:**

```typescript
// apps/website-v2/src/components/accessibility/AccessibleMotion.tsx
import { motion, type Variants, type Transition } from 'framer-motion';
import { useReducedMotion } from './ReducedMotionProvider';

interface AccessibleMotionProps {
  children: React.ReactNode;
  variants?: Variants;
  initial?: string | object;
  animate?: string | object;
  exit?: string | object;
  transition?: Transition;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function AccessibleMotion({
  children,
  variants,
  initial = 'hidden',
  animate = 'visible',
  exit = 'hidden',
  transition,
  className,
  as = 'div',
}: AccessibleMotionProps) {
  const { prefersReducedMotion } = useReducedMotion();

  // Simplified variants for reduced motion
  const reducedVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const safeTransition: Transition = prefersReducedMotion
    ? { duration: 0 }
    : transition || { duration: 0.3 };

  const Component = motion[as as keyof typeof motion] as typeof motion.div;

  return (
    <Component
      className={className}
      variants={prefersReducedMotion ? reducedVariants : variants}
      initial={initial}
      animate={animate}
      exit={exit}
      transition={safeTransition}
    >
      {children}
    </Component>
  );
}
```

**Create Reduced Motion Toggle:**

```typescript
// apps/website-v2/src/components/accessibility/ReducedMotionToggle.tsx
import { motion } from 'framer-motion';
import { useReducedMotion } from './ReducedMotionProvider';

export function ReducedMotionToggle() {
  const { prefersReducedMotion, toggleReducedMotion } = useReducedMotion();

  return (
    <button
      onClick={toggleReducedMotion}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      aria-pressed={prefersReducedMotion}
    >
      <motion.div
        className="w-10 h-5 rounded-full relative"
        style={{
          backgroundColor: prefersReducedMotion ? '#ef4444' : '#22c55e',
        }}
        transition={{ duration: 0.2 }}
      >
        <motion.div
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-md"
          animate={{
            left: prefersReducedMotion ? 'calc(100% - 1.125rem)' : '0.125rem',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </motion.div>
      <span className="text-sm text-white/80">
        {prefersReducedMotion ? 'Reduced Motion' : 'Full Animation'}
      </span>
    </button>
  );
}
```

**Verification:**
```bash
# Test accessibility
npm run test -- src/components/accessibility/

# Verify with axe-core
# npm install --save-dev @axe-core/react
```

### Step 6: Design Token Integration

**Objective:** Create consistent design tokens for the UI system.

```typescript
// apps/website-v2/src/lib/tokens/colors.ts
export const colors = {
  // Primary palette
  primary: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  
  // Accent colors
  accent: {
    purple: '#8b5cf6',
    pink: '#ec4899',
    cyan: '#06b6d4',
    emerald: '#10b981',
  },
  
  // Glass morphism
  glass: {
    light: 'rgba(255, 255, 255, 0.1)',
    medium: 'rgba(255, 255, 255, 0.05)',
    dark: 'rgba(0, 0, 0, 0.3)',
    border: 'rgba(255, 255, 255, 0.1)',
  },
  
  // Glow colors
  glow: {
    blue: 'rgba(59, 130, 246, 0.5)',
    purple: 'rgba(139, 92, 246, 0.5)',
    cyan: 'rgba(6, 182, 212, 0.5)',
  },
};

// Tailwind config extension
export const tailwindExtension = {
  colors: {
    glass: colors.glass,
    glow: colors.glow,
  },
  backdropBlur: {
    xs: '2px',
  },
  animation: {
    'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
  },
  keyframes: {
    'glow-pulse': {
      '0%, 100%': { opacity: '0.5' },
      '50%': { opacity: '1' },
    },
  },
};
```

**Update tailwind.config.ts:**

```typescript
// apps/website-v2/tailwind.config.ts
import type { Config } from 'tailwindcss';
import { tailwindExtension } from './src/lib/tokens/colors';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      ...tailwindExtension,
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};

export default config;
```

**Verification:**
```bash
# Verify Tailwind builds
npm run build

# Check for missing classes
npx tailwindcss -i ./src/index.css -o ./dist/test.css --content "./src/**/*.{js,ts,jsx,tsx}"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Animations too fast/slow | Adjust duration in `transitions` object |
| Glass effect not visible | Ensure background has contrast; add `backdrop-blur` |
| Glow not appearing | Check `box-shadow` syntax; verify color opacity |
| Reduced motion not working | Verify `MotionConfig` wraps app |
| Lensing performance issues | Reduce `magnifyScale` or use `transform` only |
| Tailwind classes not found | Run `npm run build` to regenerate |
| Font loading issues | Add Google Fonts link to `index.html` |
| Hover effects not smooth | Ensure `will-change: transform` is set |

## Completion Criteria

- [ ] Viscous easing library created
- [ ] GlassCard component implemented
- [ ] GlowButton component implemented
- [ ] Lensing system functional
- [ ] Reduced motion support complete
- [ ] Design tokens integrated
- [ ] Tailwind config extended
- [ ] All components tested
- [ ] Accessibility audit passed
- [ ] Visual regression tests pass

## Accessibility Checklist

- [ ] `prefers-reduced-motion` respected
- [ ] Focus indicators visible
- [ ] Color contrast WCAG AA compliant
- [ ] Interactive elements keyboard accessible
- [ ] Screen reader labels present
- [ ] Motion alternatives provided
- [ ] No seizure-inducing animations
- [ ] Font sizes scalable

## Post-Completion

After completing this playbook:
1. Run accessibility audit with axe-core
2. Update component library documentation
3. Create Storybook stories for components
4. Proceed to Playbook 4: Agent Coordination
