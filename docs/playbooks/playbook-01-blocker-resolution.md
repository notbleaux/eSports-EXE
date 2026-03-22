[Ver001.000]

# Playbook 1: Blocker Resolution

## Objective
Resolve all Week 0 critical blockers to establish a solid foundation for the 4NJZ4 TENET Platform. This includes setting up the testing framework, configuring ESLint, and performing necessary cleanup procedures.

## Prerequisites
- [ ] Node.js 18+ installed
- [ ] Python 3.11+ installed
- [ ] Git repository cloned
- [ ] npm packages installed (`npm install`)
- [ ] Python dependencies installed (`pip install -r requirements.txt`)
- [ ] Access to project root directory

## Step-by-Step Instructions

### Step 1: Verify Testing Framework Setup

**Objective:** Ensure all testing dependencies are properly installed.

```bash
# Check Node.js version
node --version

# Verify npm packages
cd apps/website-v2
npm list vitest @playwright/test

# Check Python test dependencies
cd ../../packages/shared
python -c "import pytest; print('pytest OK')"
python -c "import pytest_asyncio; print('pytest-asyncio OK')"
python -c "import httpx; print('httpx OK')"
```

**Verification:**
- Node.js version shows v18.x or higher
- vitest and @playwright/test are listed
- Python imports succeed without errors

### Step 2: Run Initial Test Suite

**Objective:** Establish baseline test results.

```bash
# From project root
npm run test:firewall

# Run Python unit tests
pytest tests/unit/ -v

# Run integration tests
pytest tests/integration/ -v --tb=short

# Run website-v2 tests
cd apps/website-v2
npm run test
```

**Verification:**
- All tests run without import errors
- Note any failing tests for later resolution
- Document test coverage baseline

### Step 3: Configure ESLint

**Objective:** Set up ESLint with @typescript-eslint for the project.

```bash
# From project root
cd apps/website-v2

# Install ESLint dependencies if missing
npm install --save-dev eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin

# Verify eslint.config.js exists
test -f eslint.config.js && echo "ESLint config exists" || echo "ESLint config missing"
```

**Create/Update ESLint Configuration:**

```javascript
// apps/website-v2/eslint.config.js
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  }
);
```

**Verification:**
```bash
# Run ESLint
npx eslint src/ --ext .ts,.tsx

# Run lint npm script
npm run lint
```

### Step 4: TypeScript Type Checking

**Objective:** Ensure all TypeScript types are valid.

```bash
# From website-v2 directory
npm run typecheck

# Or from root
npm run typecheck
```

**Verification:**
- No TypeScript errors reported
- tsc completes with exit code 0

### Step 5: Pre-commit Hooks Setup

**Objective:** Install and configure pre-commit hooks.

```bash
# From project root
pre-commit install

# Run pre-commit on all files (optional, may take time)
# pre-commit run --all-files
```

**Verification:**
- `.git/hooks/pre-commit` file exists
- Hooks run automatically on `git commit`

### Step 6: Environment File Cleanup

**Objective:** Clean up and standardize environment files.

```bash
# From project root
# Backup existing .env files
cp .env .env.backup.$(date +%Y%m%d)
cp .env.local .env.local.backup.$(date +%Y%m%d) 2>/dev/null || true

# Verify required env files exist
test -f .env.example && echo ".env.example OK"
test -f .env.production.template && echo ".env.production.template OK"
```

**Required Environment Variables Check:**
```bash
# Check for required variables
grep -q "PANDASCORE_API_KEY" .env.example && echo "PANDASCORE_API_KEY defined"
grep -q "DATABASE_URL" .env.example && echo "DATABASE_URL defined"
grep -q "JWT_SECRET_KEY" .env.example && echo "JWT_SECRET_KEY defined"
```

**Verification:**
- All required env vars are in `.env.example`
- No secrets committed to repository
- `.env` is in `.gitignore`

### Step 7: Docker Compose Verification

**Objective:** Ensure Docker Compose can start services.

```bash
# From project root
# Check docker-compose.yml syntax
docker-compose config > /dev/null && echo "Docker Compose config valid"

# Start database and cache services
docker-compose up -d db redis

# Check service status
docker-compose ps
```

**Verification:**
- `db` service is running
- `redis` service is running (if configured)
- No port conflicts

### Step 8: API Health Check

**Objective:** Verify FastAPI backend is healthy.

```bash
# From packages/shared/api
uvicorn main:app --reload --port 8000 --host 0.0.0.0 &
API_PID=$!
sleep 3

# Check health endpoint
curl -s http://localhost:8000/health | grep -q "ok" && echo "API healthy"

# Cleanup
kill $API_PID 2>/dev/null || true
```

**Verification:**
- Health endpoint returns 200 OK
- Response contains "ok" status
- No import errors in API startup

### Step 9: Frontend Build Test

**Objective:** Verify frontend builds successfully.

```bash
# From apps/website-v2
npm run build
```

**Verification:**
- Build completes without errors
- `dist/` directory is created
- No TypeScript errors during build

### Step 10: Cleanup Procedures

**Objective:** Remove temporary files and caches.

```bash
# From project root
# Clean npm caches
npm cache clean --force 2>/dev/null || true

# Clean Python caches
find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
find . -type f -name "*.pyc" -delete 2>/dev/null || true

# Remove old backup files (keep last 5)
ls -t .env.backup.* 2>/dev/null | tail -n +6 | xargs -r rm

# Clean dist folders
rm -rf apps/website-v2/dist
rm -rf packages/shared/api/__pycache__
```

**Verification:**
- No `__pycache__` directories remain
- No `.pyc` files remain
- Old backups pruned

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `Module not found` errors | Run `npm install` from project root |
| `pytest: command not found` | Install with `pip install pytest pytest-asyncio` |
| ESLint parsing errors | Ensure `@typescript-eslint/parser` is installed |
| Docker port conflicts | Change ports in `docker-compose.yml` or stop conflicting services |
| TypeScript path resolution errors | Check `tsconfig.json` paths configuration |
| Pre-commit hook failures | Run `pre-commit run --all-files` to identify issues |
| Import errors in Python | Ensure `pip install -r requirements.txt` completed |
| Build memory errors | Increase Node.js memory: `NODE_OPTIONS="--max-old-space-size=4096"` |

## Completion Criteria

- [ ] All tests run without import/configuration errors
- [ ] ESLint configuration valid and running
- [ ] TypeScript type checking passes
- [ ] Pre-commit hooks installed
- [ ] Environment files properly configured
- [ ] Docker services start successfully
- [ ] API health check passes
- [ ] Frontend build succeeds
- [ ] Cleanup procedures completed
- [ ] No secrets in repository

## Post-Completion

After completing this playbook:
1. Document any failing tests in `docs/TROUBLESHOOTING_GUIDE.md`
2. Update `docs/CHANGELOG_MASTER.md` with blocker resolutions
3. Proceed to Playbook 2: Performance Optimization
