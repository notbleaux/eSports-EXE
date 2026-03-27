[Ver001.000]

# Round 1b Discovery Echo: Structural Analysis

**Date:** 2026-03-16  
**Scope:** apps/website-v2/src codebase organization  
**Status:** READ-ONLY Analysis Complete

---

## 1. Missing index.tsx Files

| Directory | index.tsx | Current Export | Recommendation |
|-----------|-----------|----------------|----------------|
| ui/composite | **No** | Direct file imports from main ui/index.tsx | Create index.tsx |
| ui/layout | **No** | Direct file imports from main ui/index.tsx | Create index.tsx |
| ui/data-display | **No** | Empty directory (no files) | Remove or populate |
| components/auth | **No** | Direct file imports from TENET/index.tsx | Create index.tsx |
| components/settings | **No** | Direct file imports from TENET/index.tsx | Create index.tsx |
| hooks | **No** | Single file (useWebSocket.ts) | Create index.ts when >1 file |
| services | **No** | Direct file imports from TENET/index.tsx | Create index.ts |
| types | **No** | Single file (websocket.ts) | Create index.ts when >1 file |

### Summary
- **Total Missing:** 8 index files
- **Pattern Inconsistency:** `primitives/` and `feedback/` have index files; `composite/` and `layout/` do not
- **Impact:** Consumers must import directly from individual files

---

## 2. Export Patterns

| Module | Pattern | Consistent | Issue |
|--------|---------|------------|-------|
| primitives | index.ts barrel | ✅ Yes | None |
| feedback | index.ts barrel | ✅ Yes | None |
| composite | Direct file import | ❌ No | Should use barrel export |
| layout | Direct file import | ❌ No | Should use barrel export |
| auth | Direct file import | ❌ No | Should use barrel export |
| settings | Direct file import | ❌ No | Should use barrel export |
| store | index.ts barrel | ✅ Yes | None |

### Export Pattern Analysis

**Current ui/index.tsx exports composite/layout as:**
```typescript
// Composite - direct file imports (inconsistent)
export { Card, CardHeader, ... } from './composite/Card';
export { Modal, type ModalProps } from './composite/Modal';
// ... 8 more direct imports

// Layout - direct file imports (inconsistent)
export { Box, type BoxProps } from './layout/Box';
export { Stack, HStack, ... } from './layout/Stack';
// ... missing many layout components
```

**Recommended pattern (matching primitives/feedback):**
```typescript
// Composite - barrel export
export * from './composite';

// Layout - barrel export  
export * from './layout';
```

---

## 3. Import Analysis

| Type | Count | Consistent | Issues |
|------|-------|------------|--------|
| Absolute (@/) | ~75 | ✅ Yes | None identified |
| Relative (../) | ~95 | ✅ Yes | None identified |
| Relative (./) | ~120 | ✅ Yes | None identified |
| Broken | 0 | - | None detected |

### Import Pattern Examples

**Good - Absolute imports:**
```typescript
import { logger } from '@/utils/logger';
import { Button } from '@/components/TENET/ui/primitives';
```

**Good - Relative imports:**
```typescript
import { WebSocketState } from '../types/websocket';
import { useTENETStore } from './store';
```

**Observation:** Import styles are generally consistent. Absolute imports used for cross-module references; relative imports used within modules.

---

## 4. File Organization

### TENET Module Structure

| Directory | Files | Organized | Issues |
|-----------|-------|-----------|--------|
| components/auth | 3 | ✅ Yes | No index.tsx |
| components/settings | 1 | ✅ Yes | No index.tsx |
| ui/primitives | 15 | ✅ Yes | Well organized |
| ui/composite | 10 | ✅ Yes | No index.tsx |
| ui/layout | 10 | ✅ Yes | No index.tsx |
| ui/feedback | 8 | ✅ Yes | Well organized |
| ui/data-display | 0 | ⚠️ N/A | Empty directory |
| hooks | 1 | ✅ Yes | Minimal content |
| services | 2 | ✅ Yes | No index.tsx |
| store | 1 | ✅ Yes | Well organized |
| types | 1 | ✅ Yes | Minimal content |

### UI Component Inventory

**Primitives (15 files):**
- Avatar.tsx, Badge.tsx, Button.tsx, Checkbox.tsx, ColorPicker.tsx
- DatePicker.tsx, FileUpload.tsx, Input.tsx, Radio.tsx, Select.tsx
- Slider.tsx, Spinner.tsx, Switch.tsx, Textarea.tsx

**Composite (10 files):**
- Accordion.tsx, Breadcrumb.tsx, Card.tsx, Drawer.tsx, Dropdown.tsx
- Modal.tsx, Pagination.tsx, Popover.tsx, Tabs.tsx, Tooltip.tsx

**Layout (10 files):**
- AspectRatio.tsx, Box.tsx, Center.tsx, Container.tsx, Divider.tsx
- Flex.tsx, Grid.tsx, SimpleGrid.tsx, Spacer.tsx, Stack.tsx

**Feedback (8 files):**
- Alert.tsx, CircularProgress.tsx, Progress.tsx, Rating.tsx
- Skeleton.tsx, Spinner.tsx, Toast.tsx

---

## 5. Naming Conventions

| Convention | Compliant | Total | Violations |
|------------|-----------|-------|------------|
| PascalCase components | 43/43 | 100% | None |
| camelCase utilities | N/A | - | No utility files found |
| lowercase folders | 10/10 | 100% | None |
| index.tsx for barrels | 2/8 | 25% | Missing in composite, layout, auth, settings, services |

### File Naming Compliance

**✅ All component files use PascalCase:**
- `OAuthButtons.tsx`, `TwoFactorSetup.tsx`, `NotificationPreferences.tsx`
- `Accordion.tsx`, `Breadcrumb.tsx`, `Card.tsx`
- `Grid.tsx`, `Flex.tsx`, `Stack.tsx`

**✅ All folders use lowercase:**
- `components/`, `ui/`, `primitives/`, `composite/`, `layout/`, `feedback/`
- `auth/`, `settings/`, `hooks/`, `services/`, `store/`, `types/`

---

## 6. Layout Components Export Gap

**CRITICAL FINDING:** Main `ui/index.tsx` only exports 2 of 10 layout components:

| Component | Exported | Location |
|-----------|----------|----------|
| Box | ✅ Yes | ui/index.tsx |
| Stack/HStack/VStack | ✅ Yes | ui/index.tsx |
| Grid | ❌ No | Only in layout/ directory |
| Flex | ❌ No | Only in layout/ directory |
| Container | ❌ No | Only in layout/ directory |
| Center | ❌ No | Only in layout/ directory |
| SimpleGrid | ❌ No | Only in layout/ directory |
| AspectRatio | ❌ No | Only in layout/ directory |
| Spacer | ❌ No | Only in layout/ directory |
| Divider | ❌ No | Only in layout/ directory |

**Missing from public API:** 8 layout components are defined but not exported from the main UI library.

---

## 7. Circular Dependencies

| Module A | Module B | Severity | Status |
|----------|----------|----------|--------|
| None detected | - | - | ✅ Clean |

### Cross-Reference Check

- `ui/primitives/index.tsx` → imports from `../feedback/Skeleton` (valid cross-module)
- `store/index.ts` → imports from `../types/websocket`, `../services/pushNotifications` (valid)
- No circular references detected in TENET module

---

## 8. Structural Score

| Category | Score | Target | Notes |
|----------|-------|--------|-------|
| Organization | 85% | 100% | Good structure, missing data-display content |
| Consistency | 65% | 100% | Export patterns inconsistent across modules |
| Completeness | 70% | 100% | 8 layout components not exported; 8 missing index files |
| Naming | 95% | 100% | Excellent naming compliance |
| Imports | 90% | 100% | Clean import patterns, no broken imports |

**Overall Structural Health: 81%**

---

## 9. Recommendations

### High Priority

1. **Create composite/index.tsx**
   ```typescript
   export { Accordion, AccordionItem, ... } from './Accordion';
   export { Breadcrumb, ... } from './Breadcrumb';
   // ... all composite components
   ```

2. **Create layout/index.tsx**
   ```typescript
   export { Grid, GridItem, ... } from './Grid';
   export { Flex, ... } from './Flex';
   export { Container, ... } from './Container';
   // ... all layout components including missing exports
   ```

3. **Update ui/index.tsx** to use barrel exports and add missing layout components:
   ```typescript
   // Change from:
   export { Box, ... } from './layout/Box';
   
   // To:
   export * from './layout';
   export * from './composite';
   ```

### Medium Priority

4. **Create auth/index.tsx** for consistent auth component exports
5. **Create settings/index.tsx** for settings component exports
6. **Create services/index.ts** for service exports
7. **Decide on data-display** - either populate or remove empty directory

### Low Priority

8. Add JSDoc comments to all layout components (some have minimal documentation)
9. Consider consolidating hooks/ and types/ into main src/ level if they remain minimal

---

## 10. Summary

### Strengths
- Clean component organization with logical grouping (primitives/composite/layout/feedback)
- Consistent PascalCase naming for all components
- No circular dependencies detected
- No broken imports found
- Good use of absolute (@/) imports for cross-module references

### Weaknesses
- Inconsistent export patterns (barrel vs direct file imports)
- 8 of 10 layout components not exported from main UI library
- 8 missing index files for barrel exports
- Empty data-display directory

### Risk Assessment
- **Low Risk:** Missing index files (internal organization issue)
- **Medium Risk:** Layout components not exported (limits public API usability)
- **No Critical Risks:** No circular dependencies, no broken imports

---

*Report generated for structural analysis phase. No files modified.*
