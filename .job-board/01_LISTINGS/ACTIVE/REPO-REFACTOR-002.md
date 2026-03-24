# [JLB-LISTING] Repo Structural Refactoring - Phase 2

**ID:** REPO-REFACTOR-002  
**Priority:** P1 - HIGH  
**Status:** PENDING  
**Created:** 2026-03-24  
**Coordinator:** Main Agent  

## Phase 2: Workspace & Build System

### Task 2.1: Fix Turbo Configuration
**Assignee:** @coder-build  
**File:** `turbo.json`  

**Issues:**
1. Uses old package name `libre-x-4njz4-tenet-platform` instead of new name
2. Missing `website-v2#build` task (or needs update after rename)

**Action:**
Update turbo.json after Phase 1.3 completes:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "env": [
        "VITE_API_URL",
        "VITE_WS_URL", 
        "VITE_APP_ENV",
        "VITE_ANALYTICS_ID",
        "VITE_BASE_PATH"
      ],
      "outputs": ["dist/**", ".vercel/output/**"]
    },
    "web#build": {
      "dependsOn": ["^build"],
      "env": [
        "VITE_API_URL",
        "VITE_WS_URL",
        "VITE_APP_ENV", 
        "VITE_ANALYTICS_ID",
        "VITE_BASE_PATH"
      ],
      "outputs": ["dist/**"]
    },
    "test": { "dependsOn": ["build"] },
    "lint": {},
    "typecheck": { "dependsOn": ["^build"] },
    "dev": { "cache": false, "persistent": true }
  }
}
```

---

### Task 2.2: Fix Vercel Configuration
**Assignee:** @coder-deployment  
**Files:**
- `apps/website-v2/vercel.json` → `apps/web/vercel.json`
- Root `vercel.json`

**Actions:**
1. Update paths after rename
2. Ensure build command uses Turbo correctly
3. Remove conflicting root vercel.json if present

---

### Task 2.3: Update Root Package.json Scripts
**Assignee:** @coder-build  
**File:** `package.json`  

**Action:**
Update all scripts to use new `web` name:
```json
{
  "scripts": {
    "build": "turbo run build",
    "dev:web": "turbo run dev --filter=web",
    "dev:api": "cd packages/shared/api && python -m uvicorn main:app --reload --port 8000 --host 0.0.0.0",
    "test:e2e": "turbo run test:e2e --filter=web",
    "test:unit": "turbo run test --filter=web",
    "mascots:generate": "cd apps/web && npx ts-node scripts/mascot-generator/index.ts"
  }
}
```

---

## Dependencies
- Phase 1.3 (rename) must complete before this phase

## Claim Instructions
1. Wait for Phase 1 completion signal
2. Claim tasks by creating files in `.job-board/02_CLAIMED/{agent-id}/`
3. Use skill: `sator-deployment` for Vercel configs
4. Use skill: `sator-project` for build system changes
