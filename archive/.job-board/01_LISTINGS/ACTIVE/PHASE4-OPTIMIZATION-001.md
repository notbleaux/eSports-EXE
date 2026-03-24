# [JLB-LISTING] Phase 4 Task 1: Simplify Path Aliases (7→3)

**ID:** PHASE4-OPTIMIZATION-001  
**Priority:** P2 - HIGH  
**Phase:** 4  
**Status:** PENDING  
**Assignee:** @coder-frontend  
**Estimated:** 2-3 hours  
**Blocked By:** Phase 3 completion

## Objective
Reduce 7 path aliases to 3, simplifying the codebase and reducing cognitive load.

## Current State (7 aliases)
```json
{
  "@/*": ["./src/*"],
  "@shared/*": ["./src/shared/*"],
  "@hub-1/*": ["./src/hub-1-sator/*"],
  "@hub-2/*": ["./src/hub-2-rotas/*"],
  "@hub-3/*": ["./src/hub-3-arepo/*"],
  "@hub-4/*": ["./src/hub-4-opera/*"],
  "@hub-5/*": ["./src/hub-5-tenet/*"]
}
```

## Target State (3 aliases)
```json
{
  "@/*": ["./src/*"],
  "@hubs/*": ["./src/hubs/*"],
  "@shared/*": ["./src/shared/*"]
}
```

## Migration Plan

### Step 1: Restructure Hub Directories

**Current:**
```
src/
├── hub-1-sator/
├── hub-2-rotas/
├── hub-3-arepo/
├── hub-4-opera/
└── hub-5-tenet/
```

**Target:**
```
src/
└── hubs/
    ├── sator/
    ├── rotas/
    ├── arepo/
    ├── opera/
    └── tenet/
```

### Step 2: Update tsconfig.json

**File:** `apps/web/tsconfig.json`

Remove:
```json
"@hub-1/*": ["./src/hub-1-sator/*"],
"@hub-2/*": ["./src/hub-2-rotas/*"],
"@hub-3/*": ["./src/hub-3-arepo/*"],
"@hub-4/*": ["./src/hub-4-opera/*"],
"@hub-5/*": ["./src/hub-5-tenet/*"]
```

Add:
```json
"@hubs/*": ["./src/hubs/*"]
```

### Step 3: Update vite.config.js

**File:** `apps/web/vite.config.js`

Update resolve.alias:
```javascript
alias: {
  '@': path.resolve(__dirname, './src'),
  '@hubs': path.resolve(__dirname, './src/hubs'),
  '@shared': path.resolve(__dirname, './src/shared'),
  // Remove old hub aliases
}
```

### Step 4: Mass Update Imports

**Find and replace across src/:**

| Old Import | New Import |
|------------|------------|
| `@hub-1/components/X` | `@hubs/sator/components/X` |
| `@hub-2/hooks/Y` | `@hubs/rotas/hooks/Y` |
| `@hub-3/utils/Z` | `@hubs/arepo/utils/Z` |
| `@hub-4/components/A` | `@hubs/opera/components/A` |
| `@hub-5/components/B` | `@hubs/tenet/components/B` |

**Commands:**
```bash
cd apps/web/src

# Hub 1 -> hubs/sator
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -exec sed -i 's/@hub-1\//@hubs\/sator\//g' {} +

# Hub 2 -> hubs/rotas
find . -type f \( -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" \) \
  -exec sed -i 's/@hub-2\//@hubs\/rotas\//g' {} +

# Continue for hubs 3, 4, 5
```

### Step 5: Move Directory Contents

```bash
cd apps/web/src

# Create new structure
mkdir -p hubs/{sator,rotas,arepo,opera,tenet}

# Move contents
mv hub-1-sator/* hubs/sator/
mv hub-2-rotas/* hubs/rotas/
mv hub-3-arepo/* hubs/arepo/
mv hub-4-opera/* hubs/opera/
mv hub-5-tenet/* hubs/tenet/

# Remove old directories
rmdir hub-1-sator hub-2-rotas hub-3-arepo hub-4-opera hub-5-tenet
```

---

## Verification

1. TypeScript compilation:
```bash
cd apps/web
npx tsc --noEmit
```

2. Build test:
```bash
cd apps/web
npm run build
```

3. Search for old aliases:
```bash
grep -r "@hub-[1-5]/" src/
# Should return no results
```

---

## Rollback Plan

If issues arise:
1. Keep git commit history
2. Can revert individual files
3. Staged approach: do one hub at a time

---

## Deliverables

- [ ] Directory restructure complete
- [ ] tsconfig.json updated
- [ ] vite.config.js updated
- [ ] All imports updated
- [ ] TypeScript compiles
- [ ] Build succeeds
- [ ] Tests pass

---

## Coordination

- This is a large change - coordinate with Foreman
- Consider doing one hub at a time
- Merge quickly to avoid conflicts
