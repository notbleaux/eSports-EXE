[Ver001.000]

# Specification: TD-P3-001 GameNodeIDFrame Component

**Status:** 📋 Ready for Implementation  
**Priority:** P0 - Critical  
**Source:** EX-UI-001 (Phase 3-6 Plan)  
**Estimated Effort:** 8 hours  
**Target Sprint:** S-Extraction-001  

---

## 1. Overview

The GameNodeIDFrame component is the core navigation interface for the TeNET layer. It displays a 2×2 CSS Grid representing the four quarters (SATOR, AREPO, OPERA, ROTAS) and serves as the primary entry point into any game's ecosystem.

### 1.1 Purpose
- Provide intuitive game-world navigation
- Visualize the TENET topology (4 quarters)
- Enable quick access to analytics, community, pro-scene, and stats

### 1.2 Context
```
User Flow:
/ (TeNeT Portal) → /hubs (TeNET Directory) → /{game} (WorldPortPage)
                                            ↓
                                    GameNodeIDFrame renders
                                            ↓
       ┌─────────────┬─────────────┐
       │   SATOR     │   AREPO     │
       │  Analytics  │  Community  │
       ├─────────────┼─────────────┤
       │   OPERA     │   ROTAS     │
       │  Pro Scene  │    Stats    │
       └─────────────┴─────────────┘
```

---

## 2. Interface Definition

### 2.1 Component Props

```typescript
// packages/@njz/types/src/components/GameNodeIDFrame.ts

export interface Quarter {
  id: 'SATOR' | 'AREPO' | 'OPERA' | 'ROTAS';
  name: string;
  description: string;
  route: string;           // e.g., '/analytics', '/community'
  color: QuarterColor;
  icon: IconComponent;
  branchCount: number;     // Number of TeZeT branches
  stats?: QuarterStats;    // Optional live stats
}

export interface QuarterColor {
  bg: string;              // Tailwind class: 'bg-blue-600'
  hover: string;           // Tailwind class: 'hover:bg-blue-700'
  ring: string;            // Tailwind class: 'focus:ring-blue-400'
  gradient: string;        // Tailwind class: 'from-blue-600 to-blue-800'
}

export interface QuarterStats {
  liveEvents?: number;
  activeUsers?: number;
  recentUpdates?: number;
}

export interface GameNodeIDFrameProps {
  gameId: string;          // 'valorant', 'cs2', etc.
  gameName: string;        // Display name
  gameIcon?: React.ReactNode;
  quarters?: Partial<Record<QuarterId, Partial<Quarter>>>; // Overrides
  onQuarterSelect?: (quarter: Quarter) => void;
  className?: string;
}

export type QuarterId = 'SATOR' | 'AREPO' | 'OPERA' | 'ROTAS';
```

### 2.2 Default Configuration

```typescript
// packages/@njz/ui/src/components/GameNodeIDFrame/constants.ts

export const DEFAULT_QUARTERS: Record<QuarterId, Quarter> = {
  SATOR: {
    id: 'SATOR',
    name: 'Analytics',
    description: 'Advanced statistics and insights',
    route: '/analytics',
    color: {
      bg: 'bg-blue-600',
      hover: 'hover:bg-blue-700',
      ring: 'focus:ring-blue-400',
      gradient: 'from-blue-600 to-blue-800',
    },
    icon: AnalyticsIcon,
    branchCount: 3,
  },
  AREPO: {
    id: 'AREPO',
    name: 'Community',
    description: 'Players and fans',
    route: '/community',
    color: {
      bg: 'bg-green-600',
      hover: 'hover:bg-green-700',
      ring: 'focus:ring-green-400',
      gradient: 'from-green-600 to-green-800',
    },
    icon: CommunityIcon,
    branchCount: 4,
  },
  OPERA: {
    id: 'OPERA',
    name: 'Pro Scene',
    description: 'Tournaments and live matches',
    route: '/pro-scene',
    color: {
      bg: 'bg-purple-600',
      hover: 'hover:bg-purple-700',
      ring: 'focus:ring-purple-400',
      gradient: 'from-purple-600 to-purple-800',
    },
    icon: TrophyIcon,
    branchCount: 3,
  },
  ROTAS: {
    id: 'ROTAS',
    name: 'Stats',
    description: 'Leaderboards and history',
    route: '/stats',
    color: {
      bg: 'bg-orange-600',
      hover: 'hover:bg-orange-700',
      ring: 'focus:ring-orange-400',
      gradient: 'from-orange-600 to-orange-800',
    },
    icon: ChartIcon,
    branchCount: 4,
  },
};
```

---

## 3. Component Architecture

### 3.1 File Structure

```
packages/@njz/ui/src/components/GameNodeIDFrame/
├── index.ts                    # Public exports
├── GameNodeIDFrame.tsx         # Main container
├── GameNodeIDFrame.test.tsx    # Unit tests
├── QuarterCard.tsx             # Individual quarter
├── QuarterCard.test.tsx        # Card tests
├── hooks/
│   ├── useQuarterNavigation.ts # Navigation logic
│   └── useQuarterStats.ts      # Live stats fetching
├── styles/
│   └── quarter-animations.css  # Custom animations
└── types.ts                    # Local type definitions
```

### 3.2 Component Hierarchy

```
GameNodeIDFrame (Container)
├── GameHeader (Game icon + name)
├── QuarterGrid (2×2 CSS Grid)
│   ├── QuarterCard (SATOR)
│   ├── QuarterCard (AREPO)
│   ├── QuarterCard (OPERA)
│   └── QuarterCard (ROTAS)
└── StatsSummary (Optional live stats)
```

---

## 4. Implementation Details

### 4.1 Main Component

```typescript
// packages/@njz/ui/src/components/GameNodeIDFrame/GameNodeIDFrame.tsx

import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { GameNodeIDFrameProps, Quarter, QuarterId } from '@njz/types';
import { QuarterCard } from './QuarterCard';
import { DEFAULT_QUARTERS } from './constants';
import { mergeQuarters } from './utils';

export const GameNodeIDFrame: React.FC<GameNodeIDFrameProps> = ({
  gameId,
  gameName,
  gameIcon,
  quarters: quarterOverrides,
  onQuarterSelect,
  className = '',
}) => {
  const navigate = useNavigate();
  
  // Merge defaults with overrides
  const quarters = mergeQuarters(DEFAULT_QUARTERS, quarterOverrides);
  
  // Order matters for 2×2 grid: SATOR, AREPO, OPERA, ROTAS
  const quarterOrder: QuarterId[] = ['SATOR', 'AREPO', 'OPERA', 'ROTAS'];
  
  const handleQuarterClick = useCallback((quarter: Quarter) => {
    const route = `/${gameId}${quarter.route}`;
    
    if (onQuarterSelect) {
      onQuarterSelect(quarter);
    }
    
    navigate(route);
  }, [gameId, navigate, onQuarterSelect]);
  
  return (
    <div 
      className={`game-node-id-frame ${className}`}
      role="navigation"
      aria-label={`${gameName} Game Navigation`}
    >
      {/* Game Header */}
      <header className="flex items-center gap-4 mb-8 px-2">
        {gameIcon && <span className="text-4xl">{gameIcon}</span>}
        <h2 className="text-2xl font-bold text-slate-100">
          {gameName}
        </h2>
      </header>
      
      {/* Quarter Grid */}
      <div 
        className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6"
        role="list"
        aria-label="Game Quarters"
      >
        {quarterOrder.map((quarterId) => (
          <QuarterCard
            key={quarterId}
            quarter={quarters[quarterId]}
            onClick={() => handleQuarterClick(quarters[quarterId])}
            gameId={gameId}
          />
        ))}
      </div>
    </div>
  );
};
```

### 4.2 QuarterCard Component

```typescript
// packages/@njz/ui/src/components/GameNodeIDFrame/QuarterCard.tsx

import React, { useState } from 'react';
import { Quarter } from '@njz/types';

interface QuarterCardProps {
  quarter: Quarter;
  onClick: () => void;
  gameId: string;
}

export const QuarterCard: React.FC<QuarterCardProps> = ({
  quarter,
  onClick,
  gameId,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        relative overflow-hidden rounded-xl p-6 text-left
        ${quarter.color.bg} ${quarter.color.hover}
        transition-all duration-300 ease-out
        hover:scale-105 hover:shadow-2xl
        focus:outline-none focus:ring-4 ${quarter.color.ring}
        focus:ring-offset-2 focus:ring-offset-slate-900
        group
      `}
      aria-label={`${quarter.name}: ${quarter.description}`}
      role="listitem"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Background Gradient Effect */}
      <div 
        className={`
          absolute inset-0 bg-gradient-to-br ${quarter.color.gradient}
          opacity-0 transition-opacity duration-300
          ${isHovered ? 'opacity-100' : ''}
        `}
        aria-hidden="true"
      />
      
      {/* Content */}
      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div className="text-4xl text-white/90 group-hover:scale-110 transition-transform duration-300">
            {quarter.icon}
          </div>
        </div>
        
        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white mb-1">
            {quarter.name}
          </h3>
          <p className="text-sm text-white/80 line-clamp-2">
            {quarter.description}
          </p>
          
          {/* Branch Count */}
          <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/20">
              {quarter.branchCount} branches
            </span>
            {quarter.stats?.liveEvents !== undefined && (
              <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/20 animate-pulse">
                ● {quarter.stats.liveEvents} live
              </span>
            )}
          </div>
        </div>
        
        {/* Arrow Indicator */}
        <div 
          className={`
            flex-shrink-0 text-white/60
            transition-transform duration-300
            ${isHovered ? 'translate-x-1' : ''}
          `}
          aria-hidden="true"
        >
          →
        </div>
      </div>
      
      {/* Focus Ring Animation */}
      <div 
        className={`
          absolute inset-0 rounded-xl border-2 border-white/0
          transition-colors duration-200
          focus-within:border-white/50
        `}
        aria-hidden="true"
      />
    </button>
  );
};
```

---

## 5. Animation Specification

### 5.1 Hover Effects

| Property | Value | Duration | Easing |
|----------|-------|----------|--------|
| Scale | 1.0 → 1.05 | 300ms | ease-out |
| Shadow | sm → 2xl | 300ms | ease-out |
| Gradient Opacity | 0 → 1 | 300ms | ease-out |
| Icon Scale | 1.0 → 1.1 | 300ms | ease-out |
| Arrow Translate | 0 → 4px | 300ms | ease-out |

### 5.2 Focus Effects

| Property | Value | Duration | Easing |
|----------|-------|----------|--------|
| Ring Width | 4px | instant | - |
| Ring Offset | 2px | instant | - |
| Ring Color | quarter-specific | instant | - |

### 5.3 Page Transition (Optional)

```css
/* Stagger animation for grid items */
.quarter-card-enter {
  animation: quarterEnter 0.4s ease-out backwards;
}

.quarter-card-enter:nth-child(1) { animation-delay: 0ms; }
.quarter-card-enter:nth-child(2) { animation-delay: 100ms; }
.quarter-card-enter:nth-child(3) { animation-delay: 200ms; }
.quarter-card-enter:nth-child(4) { animation-delay: 300ms; }

@keyframes quarterEnter {
  from {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}
```

---

## 6. Accessibility Requirements

### 6.1 ARIA Attributes

| Element | Attribute | Value |
|---------|-----------|-------|
| Container | role | navigation |
| Container | aria-label | "{gameName} Game Navigation" |
| Grid | role | list |
| Grid | aria-label | "Game Quarters" |
| Card | role | listitem |
| Card | aria-label | "{name}: {description}" |
| Card | tabIndex | 0 |

### 6.2 Keyboard Navigation

| Key | Action |
|-----|--------|
| Tab | Move focus between quarters |
| Enter | Activate focused quarter |
| Space | Activate focused quarter |
| Shift+Tab | Move focus backwards |

### 6.3 Screen Reader

- Full announcement: "{Quarter Name}: {Description}, {Branch Count} branches, button"
- Live regions for dynamic stats updates
- Skip link: "Skip to quarter navigation"

### 6.4 Visual Requirements

| Requirement | Target |
|-------------|--------|
| Color Contrast | WCAG 2.1 AA (4.5:1 minimum) |
| Focus Indicator | 3px outline, high contrast |
| Reduced Motion | Respect prefers-reduced-motion |
| Text Size | Minimum 16px base |

---

## 7. Responsive Design

### 7.1 Breakpoints

| Breakpoint | Grid Layout | Card Padding | Font Size |
|------------|-------------|--------------|-----------|
| < 640px (mobile) | 1 column | p-4 | text-base |
| 640-1024px (tablet) | 2 columns | p-5 | text-lg |
| > 1024px (desktop) | 2 columns | p-6 | text-xl |

### 7.2 Mobile Optimizations

- Touch targets minimum 44×44px
- Swipe gesture support (optional)
- Bottom sheet for quarter details
- Simplified animations (reduced motion)

---

## 8. Testing Strategy

### 8.1 Unit Tests (Vitest)

```typescript
// GameNodeIDFrame.test.tsx

describe('GameNodeIDFrame', () => {
  it('renders all four quarters', () => {
    render(<GameNodeIDFrame gameId="valorant" gameName="VALORANT" />);
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Game Quarters');
    expect(screen.getAllByRole('listitem')).toHaveLength(4);
  });
  
  it('navigates on quarter click', async () => {
    const navigate = vi.fn();
    render(<GameNodeIDFrame gameId="valorant" gameName="VALORANT" />);
    await userEvent.click(screen.getByLabelText(/Analytics/));
    expect(navigate).toHaveBeenCalledWith('/valorant/analytics');
  });
  
  it('supports keyboard navigation', async () => {
    render(<GameNodeIDFrame gameId="valorant" gameName="VALORANT" />);
    const firstQuarter = screen.getAllByRole('listitem')[0];
    firstQuarter.focus();
    await userEvent.keyboard('{Enter}');
    expect(navigate).toHaveBeenCalled();
  });
  
  it('applies custom className', () => {
    render(<GameNodeIDFrame gameId="valorant" gameName="VALORANT" className="custom-class" />);
    expect(screen.getByRole('navigation')).toHaveClass('custom-class');
  });
});
```

### 8.2 E2E Tests (Playwright)

```typescript
// tests/e2e/gamenodeidframe.spec.ts

test('GameNodeIDFrame renders and navigates', async ({ page }) => {
  await page.goto('/valorant');
  
  // Verify grid renders
  await expect(page.getByRole('navigation')).toBeVisible();
  await expect(page.getByLabel('Game Quarters')).toBeVisible();
  
  // Verify all quarters visible
  await expect(page.getByLabel(/Analytics/)).toBeVisible();
  await expect(page.getByLabel(/Community/)).toBeVisible();
  await expect(page.getByLabel(/Pro Scene/)).toBeVisible();
  await expect(page.getByLabel(/Stats/)).toBeVisible();
  
  // Click navigation
  await page.getByLabel(/Analytics/).click();
  await expect(page).toHaveURL('/valorant/analytics');
});

test('keyboard navigation works', async ({ page }) => {
  await page.goto('/valorant');
  
  // Tab through quarters
  await page.keyboard.press('Tab');
  await expect(page.getByLabel(/Analytics/)).toBeFocused();
  
  await page.keyboard.press('Tab');
  await expect(page.getByLabel(/Community/)).toBeFocused();
  
  // Activate with Enter
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/valorant/community');
});
```

### 8.3 Accessibility Tests

```typescript
// a11y tests
import { axe } from 'jest-axe';

it('has no accessibility violations', async () => {
  const { container } = render(
    <GameNodeIDFrame gameId="valorant" gameName="VALORANT" />
  );
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 9. Acceptance Criteria

### 9.1 Functional Requirements

- [ ] Component renders 2×2 grid on desktop, 1-column on mobile
- [ ] All four quarters (SATOR, AREPO, OPERA, ROTAS) render correctly
- [ ] Clicking a quarter navigates to correct route: `/{gameId}/{route}`
- [ ] Keyboard navigation: Tab through quarters, Enter to select
- [ ] Custom quarters prop merges with defaults correctly
- [ ] onQuarterSelect callback fires before navigation
- [ ] Game header displays icon and name

### 9.2 Visual Requirements

- [ ] Hover scale animation (1.05x) at 300ms ease-out
- [ ] Shadow increases on hover
- [ ] Color-coded per quarter (blue, green, purple, orange)
- [ ] Focus ring visible on keyboard navigation
- [ ] Responsive layout works at all breakpoints
- [ ] Animations respect prefers-reduced-motion

### 9.3 Accessibility Requirements

- [ ] WCAG 2.1 AA compliance
- [ ] All interactive elements have ARIA labels
- [ ] Keyboard navigation fully functional
- [ ] Focus indicators visible
- [ ] Screen reader announces quarter info correctly
- [ ] Lighthouse accessibility score ≥ 95

### 9.4 Performance Requirements

- [ ] Initial render < 100ms
- [ ] Animation runs at 60fps
- [ ] Bundle size impact < 5KB gzipped
- [ ] No layout shift on load

---

## 10. Dependencies

### 10.1 Required Packages

```json
{
  "dependencies": {
    "@njz/types": "workspace:*",
    "react": "^18.0.0",
    "react-router-dom": "^6.0.0"
  },
  "devDependencies": {
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0",
    "vitest": "^1.0.0"
  }
}
```

### 10.2 Peer Dependencies

- React ^18.0.0
- React Router ^6.0.0
- Tailwind CSS ^3.0.0

---

## 11. Implementation Checklist

### Phase 1: Setup (1 hour)
- [ ] Create component directory structure
- [ ] Set up type definitions
- [ ] Add default constants
- [ ] Create utility functions (mergeQuarters)

### Phase 2: Core Component (3 hours)
- [ ] Implement GameNodeIDFrame container
- [ ] Implement QuarterCard component
- [ ] Add hover animations
- [ ] Implement keyboard navigation

### Phase 3: Styling (2 hours)
- [ ] Apply Tailwind classes
- [ ] Implement responsive design
- [ ] Add custom animations
- [ ] Handle prefers-reduced-motion

### Phase 4: Testing (2 hours)
- [ ] Write unit tests
- [ ] Write E2E tests
- [ ] Run accessibility audit
- [ ] Test responsive breakpoints

---

## 12. Related Documents

| Document | Link | Purpose |
|----------|------|---------|
| Source Extraction | [EX-UI-001](../../.agents/PHASE_3-6_FINAL_IMPLEMENTATION_PLAN.md) | Original specification |
| Backlog Item | [TD-P3-001](../../todo/backlog/BACKLOG.md) | Task tracking |
| Design System | [@njz/ui](../../packages/@njz/ui/README.md) | Component library |
| Phase 3 Plan | [PL-P3](../../plans/phase-3-frontend/PLAN.md) | Phase context |

---

## 13. Change Log

| Version | Date | Changes |
|---------|------|---------|
| 1.000 | 2026-04-01 | Initial specification from EX-UI-001 |

---

*Specification Complete - Ready for Implementation*
