# Critical Fixes Work Plan

[Ver001.000]

**Date**: 2026-03-23  
**Priority**: P0 - BLOCKING  
**ETA**: 13-20 hours  
**Authority**: Foreman / SATUR

---

## Overview

Following comprehensive Phase 1-3 verification, **3 critical issues** have been identified that must be resolved before Phase 4 production deployment.

| Priority | Issue | Effort | Assigned |
|----------|-------|--------|----------|
| P0 | HubRegistry import paths | 1-2 hrs | TBD |
| P0 | Missing heroes components | 4-6 hrs | TBD |
| P0 | TypeScript errors (43) | 2-4 hrs | TBD |
| P1 | Missing accessibility lib | 6-8 hrs | TBD |
| P2 | CRIT-7 documentation | 1 hr | TBD |

---

## Issue #1: HubRegistry Import Path Fix

### Problem
`src/hubs/HubRegistry.ts` imports from non-existent paths:
```typescript
// BROKEN - These components don't exist:
const SATORHub = lazy(() => import('../components/SATOR/SATORHub'))
const ROTASHub = lazy(() => import('../components/ROTAS/ROTASHub'))
const AREPOHub = lazy(() => import('../components/AREPO/AREPOHub'))
const OPERAHub = lazy(() => import('../components/OPERA/OPERAHub'))
```

### Actual Hub Locations
```
src/
├── hub-1-sator/index.jsx        ✅ Exists (40KB)
├── hub-2-rotas/index.jsx        ✅ Exists (34KB)
├── hub-3-arepo/index.jsx        ✅ Exists (30KB)
├── hub-4-opera/index.tsx        ✅ Exists (18KB)
└── hub-5-tenet/index.jsx        ✅ Exists (14KB)
```

### Fix Required
```typescript
// FIXED - Correct paths:
const SATORHub = lazy(() => import('../hub-1-sator/index.jsx'))
const ROTASHub = lazy(() => import('../hub-2-rotas/index.jsx'))
const AREPOHub = lazy(() => import('../hub-3-arepo/index.jsx'))
const OPERAHub = lazy(() => import('../hub-4-opera/index.tsx'))
const TENTHub = lazy(() => import('../hub-5-tenet/index.jsx'))
```

### Tasks
- [ ] Update HubRegistry.ts import paths
- [ ] Verify hub lazy loading works
- [ ] Test hub navigation in browser
- [ ] Run typecheck to verify no errors

---

## Issue #2: Heroes Component Implementation

### Problem
`src/components/heroes/` directory is missing entirely.

### Expected Components
```
src/components/heroes/
├── Hero.tsx              # Main hero component
├── HeroMascot.tsx        # Mascot integration
├── HeroSection.tsx       # Section wrapper
├── index.ts              # Public exports
└── __tests__/
    └── heroes.test.tsx   # Component tests
```

### Component Specifications

#### Hero.tsx
```typescript
interface HeroProps {
  title: string;
  subtitle?: string;
  mascot?: MascotType;
  background?: 'gradient' | 'image' | 'video';
  cta?: {
    primary: { label: string; href: string };
    secondary?: { label: string; href: string };
  };
}
```

#### HeroMascot.tsx
```typescript
interface HeroMascotProps {
  mascot: MascotType;
  animation?: 'idle' | 'wave' | 'celebrate';
  position?: 'left' | 'right' | 'center';
  size?: 'sm' | 'md' | 'lg';
}
```

#### HeroSection.tsx
```typescript
interface HeroSectionProps {
  children: React.ReactNode;
  className?: string;
  fullHeight?: boolean;
}
```

### Implementation Tasks
- [ ] Create `src/components/heroes/` directory
- [ ] Implement Hero.tsx with full feature set
- [ ] Implement HeroMascot.tsx with mascot integration
- [ ] Implement HeroSection.tsx layout wrapper
- [ ] Create index.ts barrel exports
- [ ] Write unit tests (3-5 test cases)
- [ ] Add to component registry
- [ ] Update App.tsx if needed

---

## Issue #3: TypeScript Error Resolution

### Problem
43 TypeScript errors across 16 files prevent clean builds.

### Affected Files

| File | Error Count | Location |
|------|-------------|----------|
| HubRegistry.ts | ~5 | src/hubs/ |
| useCognitiveLoad.ts | ~4 | src/hooks/ |
| useMobileScreenReader.ts | ~3 | src/hooks/ |
| CollapsibleNav.tsx | ~4 | src/components/layout/ |
| ResponsiveContainer.tsx | ~3 | src/components/layout/ |
| MobileAccessible.tsx | ~3 | src/components/mobile/ |
| TouchButton.tsx | ~2 | src/components/mobile/ |
| TouchExplorer.tsx | ~2 | src/components/mobile/ |
| breakpoints.ts | ~3 | src/lib/mobile/ |
| talkback.ts | ~2 | src/lib/mobile/ |
| viewport.ts | ~2 | src/lib/mobile/ |
| voiceover.ts | ~2 | src/lib/mobile/ |
| screenreader.test.ts | ~2 | src/lib/mobile/__tests__/ |
| crossfire-analysis.ts | ~2 | src/lib/lenses/ |
| validation.test.ts | ~2 | src/lib/ingestion/__tests__/ |
| mobileLayout.test.tsx | ~2 | src/components/layout/__tests__/ |

### Common Error Patterns
```
TS1005: ',' expected (JSX parsing)
TS1128: Declaration or statement expected
TS1109: Expression expected
TS1161: Unterminated regular expression literal
TS1160: Unterminated template literal
```

### Resolution Tasks
- [ ] Run `npx tsc --noEmit` to capture all errors
- [ ] Fix syntax errors in HubRegistry.ts (import paths)
- [ ] Fix hook type definitions
- [ ] Fix component JSX syntax
- [ ] Fix lib module exports
- [ ] Verify all tests still pass
- [ ] Run full typecheck

---

## Issue #4: Accessibility Library (P1)

### Problem
`src/lib/accessibility/` directory missing.

### Required Components
```
src/lib/accessibility/
├── index.ts                 # Public exports
├── A11yProvider.tsx         # Context provider
├── useA11y.ts               # Main accessibility hook
├── useScreenReader.ts       # Screen reader integration
├── useKeyboardNav.ts        # Keyboard navigation
├── useFocusTrap.ts          # Focus management
├── useAnnounce.ts           # Live region announcements
├── types.ts                 # TypeScript types
├── utils.ts                 # Utility functions
└── __tests__/
    └── accessibility.test.ts
```

### Implementation Tasks
- [ ] Create directory structure
- [ ] Implement A11yProvider with React Context
- [ ] Implement useA11y hook
- [ ] Implement useScreenReader hook
- [ ] Implement useKeyboardNav hook
- [ ] Implement useFocusTrap hook
- [ ] Implement useAnnounce hook
- [ ] Write comprehensive tests
- [ ] Add to main exports

---

## Execution Timeline

### Wave 1: Critical Fixes (P0) - Day 1
| Time | Task | Agent |
|------|------|-------|
| 0:00-1:30 | Fix HubRegistry.ts | FIX-001 |
| 1:30-2:00 | Verify hub navigation | FIX-001 |
| 2:00-6:00 | Implement heroes/ components | FIX-002 |
| 6:00-7:00 | Heroes component tests | FIX-002 |
| 7:00-10:00 | Fix TypeScript errors | FIX-003 |
| 10:00-11:00 | Full typecheck & verification | FIX-003 |

### Wave 2: Important Fixes (P1) - Day 2
| Time | Task | Agent |
|------|------|-------|
| 0:00-6:00 | Implement accessibility lib | FIX-004 |
| 6:00-8:00 | Accessibility tests | FIX-004 |

### Wave 3: Polish (P2) - Day 2
| Time | Task | Agent |
|------|------|-------|
| 0:00-1:00 | CRIT-7 documentation | FIX-005 |

---

## Verification Checklist

After all fixes, verify:

- [ ] `npm run typecheck` passes with 0 errors
- [ ] `npm run build` completes successfully
- [ ] `npm test -- --run` all tests pass
- [ ] Hub navigation works in browser
- [ ] Heroes components render correctly
- [ ] Accessibility hooks functional
- [ ] No console errors in browser

---

## Success Criteria

All P0 issues resolved when:
1. ✅ HubRegistry imports work correctly
2. ✅ Heroes components exist and render
3. ✅ TypeScript compiles with 0 errors
4. ✅ All existing tests still pass
5. ✅ No new warnings introduced

---

*Work Plan Version: 001.000*  
*Created: 2026-03-23*  
*Status: PENDING EXECUTION*
