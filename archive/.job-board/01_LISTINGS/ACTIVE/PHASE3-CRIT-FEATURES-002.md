# [JLB-LISTING] Phase 3 Task 2: Implement Missing Feature Flag Functions

**ID:** PHASE3-CRIT-FEATURES-002  
**Priority:** P0 - CRITICAL  
**Phase:** 3  
**Status:** ACTIVE  
**Assignee:** @coder-config-specialist  
**Estimated:** 1-2 hours  

## Objective
Implement the 4 missing feature flag configuration functions that are referenced but not defined.

## Missing Functions

Located in: `apps/web/src/config/features.ts`

Functions to implement:
1. `getFeatureFlags()` - Returns current feature flags
2. `setFeatureOverride(key, value)` - Override a feature flag
3. `clearFeatureOverride(key)` - Remove an override
4. `isFeatureEnabled(key)` - Check if feature is enabled

## Implementation Requirements

### Interface Definition
```typescript
// Feature flag schema
export interface FeatureFlags {
  // ML Features
  enableMLPredictions: boolean;
  enableModelRegistry: boolean;
  enableBatchInference: boolean;
  
  // Real-time Features
  enableRealTimeUpdates: boolean;
  enableWebSocketStreaming: boolean;
  enableLiveDashboard: boolean;
  
  // UI Features
  enableNewUI: boolean;
  enableDarkMode: boolean;
  enableAnimations: boolean;
  
  // Experimental
  enableExperimentalHubs: boolean;
  enableBetaFeatures: boolean;
}
```

### Default Values
```typescript
const defaultFlags: FeatureFlags = {
  // From environment variables where available
  enableMLPredictions: import.meta.env.VITE_ENABLE_ML === 'true',
  enableModelRegistry: import.meta.env.VITE_ENABLE_MODEL_REGISTRY === 'true',
  enableBatchInference: false,
  
  enableRealTimeUpdates: true,
  enableWebSocketStreaming: true,
  enableLiveDashboard: true,
  
  enableNewUI: import.meta.env.VITE_ENABLE_NEW_UI === 'true',
  enableDarkMode: false,
  enableAnimations: true,
  
  enableExperimentalHubs: false,
  enableBetaFeatures: import.meta.env.VITE_ENABLE_BETA === 'true',
};
```

### Function Implementations

#### getFeatureFlags()
```typescript
let overrides: Partial<FeatureFlags> = {};

export function getFeatureFlags(): FeatureFlags {
  return { ...defaultFlags, ...overrides };
}
```

#### setFeatureOverride()
```typescript
export function setFeatureOverride<K extends keyof FeatureFlags>(
  key: K,
  value: FeatureFlags[K]
): void {
  overrides[key] = value;
  // Optional: Persist to localStorage for development
  if (import.meta.env.DEV) {
    localStorage.setItem('featureOverrides', JSON.stringify(overrides));
  }
}
```

#### clearFeatureOverride()
```typescript
export function clearFeatureOverride(key: keyof FeatureFlags): void {
  delete overrides[key];
  if (import.meta.env.DEV) {
    localStorage.setItem('featureOverrides', JSON.stringify(overrides));
  }
}
```

#### isFeatureEnabled()
```typescript
export function isFeatureEnabled(key: keyof FeatureFlags): boolean {
  return getFeatureFlags()[key];
}
```

### Optional: Load persisted overrides in dev
```typescript
// Initialize from localStorage in dev mode
if (import.meta.env.DEV) {
  const saved = localStorage.getItem('featureOverrides');
  if (saved) {
    try {
      overrides = JSON.parse(saved);
    } catch {
      // Ignore invalid JSON
    }
  }
}
```

---

## Files to Modify

1. `apps/web/src/config/features.ts` - Main implementation
2. `apps/web/src/config/features/index.ts` - Re-export if exists
3. `apps/web/.env.example` - Document new environment variables

---

## Environment Variables to Add

Add to `.env.example`:
```
# Feature Flags
VITE_ENABLE_ML=false
VITE_ENABLE_MODEL_REGISTRY=false
VITE_ENABLE_NEW_UI=false
VITE_ENABLE_BETA=false
```

---

## Verification

1. TypeScript compilation:
```bash
cd apps/web
npx tsc --noEmit
# Should have no errors related to feature flags
```

2. Function availability:
```bash
grep -r "getFeatureFlags\|setFeatureOverride\|clearFeatureOverride\|isFeatureEnabled" src/
# Should find imports and usage
```

3. Test implementation:
Create simple test in `apps/web/src/config/__tests__/features.test.ts`

---

## Deliverables

- [ ] `features.ts` with all 4 functions implemented
- [ ] Environment variables documented
- [ ] TypeScript compiles without errors
- [ ] Functions exported and importable

---

## Coordination

- Can work in parallel with TypeScript error fixes
- This is a blocking issue - feature flags are used throughout the app
