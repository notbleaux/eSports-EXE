[Ver001.000]

# Playbook 5: Testing and Deployment

## Objective
Establish comprehensive testing patterns with Vitest, implement E2E testing with Playwright, set up deployment pipelines for Vercel (frontend) and Render (backend), and configure CI/CD workflows.

## Prerequisites
- [ ] Playbook 4 completed
- [ ] All previous code changes committed
- [ ] Access to Vercel account
- [ ] Access to Render account
- [ ] GitHub repository configured

## Step-by-Step Instructions

### Step 1: Vitest Testing Patterns

**Objective:** Set up Vitest with comprehensive testing patterns.

```bash
# From apps/website-v2
# Verify Vitest is installed
npm list vitest

# Install additional testing utilities
npm install --save-dev @testing-library/react @testing-library/jest-dom jsdom
```

**Create Vitest Configuration:**

```typescript
// apps/website-v2/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@shared': path.resolve(__dirname, './src/shared'),
    },
  },
});
```

**Create Test Setup File:**

```typescript
// apps/website-v2/src/test/setup.ts
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
class MockIntersectionObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: MockIntersectionObserver,
});

// Mock ResizeObserver
class MockResizeObserver {
  observe = vi.fn();
  disconnect = vi.fn();
  unobserve = vi.fn();
}

Object.defineProperty(window, 'ResizeObserver', {
  writable: true,
  value: MockResizeObserver,
});
```

**Create Component Test Example:**

```typescript
// apps/website-v2/src/components/ui/GlassCard.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GlassCard } from './GlassCard';

describe('GlassCard', () => {
  it('renders children correctly', () => {
    render(
      <GlassCard>
        <div data-testid="content">Test Content</div>
      </GlassCard>
    );
    
    expect(screen.getByTestId('content')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <GlassCard className="custom-class">
        Content
      </GlassCard>
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(
      <GlassCard onClick={handleClick}>
        Clickable
      </GlassCard>
    );
    
    fireEvent.click(screen.getByText('Clickable'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('renders different variants', () => {
    const { rerender, container } = render(
      <GlassCard variant="default">Default</GlassCard>
    );
    expect(container.firstChild).toHaveClass('bg-white/5');

    rerender(<GlassCard variant="elevated">Elevated</GlassCard>);
    expect(container.firstChild).toHaveClass('bg-white/10');

    rerender(<GlassCard variant="subtle">Subtle</GlassCard>);
    expect(container.firstChild).toHaveClass('bg-white/[0.02]');
  });
});
```

**Create Hook Test Example:**

```typescript
// apps/website-v2/src/hooks/useViscousMotion.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useViscousMotion } from './useViscousMotion';

// Mock framer-motion
vi.mock('framer-motion', () => ({
  useReducedMotion: () => ({ current: false }),
}));

describe('useViscousMotion', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns transition for different types', () => {
    const { result } = renderHook(() => useViscousMotion());
    
    const viscous = result.current.getTransition('viscous');
    expect(viscous).toHaveProperty('duration');
    expect(viscous).toHaveProperty('ease');
  });

  it('returns hover scale', () => {
    const { result } = renderHook(() => useViscousMotion());
    
    expect(result.current.getHoverScale()).toBe(1.02);
  });

  it('returns tap scale', () => {
    const { result } = renderHook(() => useViscousMotion());
    
    expect(result.current.getTapScale()).toBe(0.98);
  });
});
```

**Verification:**
```bash
# Run Vitest
npm run test

# Run with coverage
npm run test -- --coverage

# Run in watch mode
npm run test -- --watch
```

### Step 2: E2E Testing with Playwright

**Objective:** Set up Playwright for end-to-end testing.

```bash
# Install Playwright if not present
npm install --save-dev @playwright/test

# Install browsers
npx playwright install
```

**Create Playwright Configuration:**

```typescript
// apps/website-v2/playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [
    ['html', { outputFolder: 'playwright-report' }],
    ['junit', { outputFile: 'junit-results.xml' }],
  ],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Create E2E Test Directory:**

```bash
mkdir -p apps/website-v2/e2e
```

**Create E2E Test Examples:**

```typescript
// apps/website-v2/e2e/navigation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/4NJZ4/);
  });

  test('can navigate to SATOR hub', async ({ page }) => {
    await page.goto('/');
    await page.click('text=SATOR');
    await expect(page).toHaveURL(/.*sator/);
  });

  test('responsive navigation works', async ({ page, isMobile }) => {
    await page.goto('/');
    
    if (isMobile) {
      // Mobile menu
      await page.click('[aria-label="Open menu"]');
      await expect(page.locator('nav')).toBeVisible();
    } else {
      // Desktop navigation
      await expect(page.locator('nav')).toBeVisible();
    }
  });
});
```

```typescript
// apps/website-v2/e2e/sator-square.spec.ts
import { test, expect } from '@playwright/test';

test.describe('SATOR Square Visualization', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sator');
  });

  test('SATOR Square renders', async ({ page }) => {
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
  });

  test('layer interaction works', async ({ page }) => {
    const canvas = page.locator('canvas');
    
    // Click on canvas
    await canvas.click();
    
    // Verify some response (customize based on actual behavior)
    await expect(page.locator('[data-testid="layer-info"]')).toBeVisible();
  });

  test('performance metrics are acceptable', async ({ page }) => {
    // Collect performance metrics
    const metrics = await page.evaluate(() => {
      return JSON.parse(JSON.stringify(performance.timing));
    });
    
    // Check load time
    const loadTime = metrics.loadEventEnd - metrics.navigationStart;
    expect(loadTime).toBeLessThan(5000); // 5 seconds
  });
});
```

```typescript
// apps/website-v2/e2e/analytics.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Analytics Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/sator/analytics');
  });

  test('player search works', async ({ page }) => {
    const searchInput = page.locator('[data-testid="player-search"]');
    await searchInput.fill('TenZ');
    await searchInput.press('Enter');
    
    await expect(page.locator('[data-testid="player-card"]')).toBeVisible();
  });

  test('virtual scrolling loads more players', async ({ page }) => {
    const list = page.locator('[data-testid="player-list"]');
    
    // Get initial count
    const initialCount = await list.locator('> div').count();
    
    // Scroll to bottom
    await list.evaluate((el) => el.scrollTo(0, el.scrollHeight));
    
    // Wait for more items to load
    await page.waitForTimeout(500);
    
    // Verify more items loaded
    const newCount = await list.locator('> div').count();
    expect(newCount).toBeGreaterThanOrEqual(initialCount);
  });
});
```

**Verification:**
```bash
# Run Playwright tests
npx playwright test

# Run with UI
npx playwright test --ui

# Run specific test
npx playwright test navigation.spec.ts

# Generate report
npx playwright show-report
```

### Step 3: Python Testing Setup

**Objective:** Configure pytest for Python backend.

```bash
# From packages/shared
# Verify pytest configuration
cat pytest.ini
```

**Create/Update pytest.ini:**

```ini
# pytest.ini
[pytest]
testpaths = tests
python_files = test_*.py
python_classes = Test*
python_functions = test_*
addopts = -v --tb=short
asyncio_mode = auto
asyncio_default_fixture_loop_scope = function
filterwarnings =
    ignore::DeprecationWarning
    ignore::PendingDeprecationWarning
```

**Create Conftest with Fixtures:**

```python
# tests/conftest.py
import pytest
import asyncio
from typing import AsyncGenerator

# Shared event loop fixture
@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

# Mock database fixture
@pytest.fixture
async def mock_db():
    """Provide mock database connection."""
    # Implementation depends on your database setup
    yield {"connection": "mock"}

# Test client fixture
@pytest.fixture
async def test_client():
    """Provide test HTTP client."""
    from httpx import AsyncClient
    from api.main import app
    
    async with AsyncClient(app=app, base_url="http://test") as client:
        yield client

# Authentication fixture
@pytest.fixture
def auth_headers():
    """Provide authentication headers for protected endpoints."""
    return {"Authorization": "Bearer test-token"}
```

**Create API Test:**

```python
# tests/integration/test_api.py
import pytest
from httpx import AsyncClient

pytestmark = pytest.mark.asyncio

async def test_health_endpoint(test_client: AsyncClient):
    """Test health check endpoint."""
    response = await test_client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"

async def test_get_players(test_client: AsyncClient):
    """Test players endpoint."""
    response = await test_client.get("/v1/players")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

async def test_get_player_by_id(test_client: AsyncClient):
    """Test getting specific player."""
    response = await test_client.get("/v1/players/test-id")
    assert response.status_code in [200, 404]  # Depending on test data

async def test_search_players(test_client: AsyncClient):
    """Test player search."""
    response = await test_client.get("/v1/search/players?q=test")
    assert response.status_code == 200
    data = response.json()
    assert "results" in data
```

**Verification:**
```bash
# Run Python tests
pytest tests/unit/ -v

# Run with coverage
pytest --cov=packages/shared/ --cov-report=html

# Run integration tests
pytest tests/integration/ -v
```

### Step 4: Vercel Deployment Setup

**Objective:** Configure deployment to Vercel.

```bash
# Verify vercel.json exists
cat vercel.json
```

**Create/Update vercel.json:**

```json
{
  "version": 2,
  "name": "4njz4-tenet-platform",
  "builds": [
    {
      "src": "apps/website-v2/package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "apps/website-v2/dist"
      }
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "/apps/website-v2/dist/$1"
    },
    {
      "handle": "filesystem"
    },
    {
      "src": "/(.*)",
      "dest": "/apps/website-v2/dist/index.html"
    }
  ],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=()"
        }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ],
  "env": {
    "VITE_API_URL": "@api_url",
    "VITE_WS_URL": "@ws_url"
  }
}
```

**Update Build Scripts:**

```json
// apps/website-v2/package.json
{
  "scripts": {
    "vercel-build": "npm run build"
  }
}
```

**Verification:**
```bash
# Local build test
npm run build

# Test with Vercel CLI (if installed)
# vercel --version
```

### Step 5: Render Deployment Setup

**Objective:** Configure deployment to Render.

```bash
# Verify render.yaml exists
cat infrastructure/render.yaml
```

**Create/Update render.yaml:**

```yaml
# infrastructure/render.yaml
services:
  - type: web
    name: 4njz4-api
    env: python
    plan: free
    buildCommand: |
      pip install -r requirements.txt
    startCommand: |
      uvicorn api.main:app --host 0.0.0.0 --port $PORT
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: DATABASE_URL
        fromDatabase:
          name: 4njz4-db
          property: connectionString
      - key: REDIS_URL
        fromService:
          type: redis
          name: 4njz4-redis
          property: connectionString
      - key: APP_ENVIRONMENT
        value: production
      - key: JWT_SECRET_KEY
        generateValue: true
      - key: TOTP_ENCRYPTION_KEY
        generateValue: true
      - key: PANDASCORE_API_KEY
        sync: false
    healthCheckPath: /health
    autoDeploy: true

databases:
  - name: 4njz4-db
    plan: free
    ipAllowList: []

redis:
  - name: 4njz4-redis
    plan: free
    ipAllowList: []
```

**Create Startup Script:**

```bash
# scripts/render-start.sh
#!/bin/bash
# Render startup script

echo "Starting 4NJZ4 API..."

# Set Python path
export PYTHONPATH="${PYTHONPATH}:$(pwd)/packages/shared"

# Run database migrations if needed
# alembic upgrade head

# Start server
exec uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
EOF

chmod +x scripts/render-start.sh
```

**Verification:**
```bash
# Test startup script locally
./scripts/render-start.sh
```

### Step 6: CI/CD Pipeline Setup

**Objective:** Create GitHub Actions workflows.

```bash
mkdir -p .github/workflows
```

**Create CI Workflow:**

```yaml
# .github/workflows/ci.yml
name: CI

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: apps/website-v2
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Type check
        run: npm run typecheck
      
      - name: Lint
        run: npm run lint
      
      - name: Unit tests
        run: npm run test -- --coverage
      
      - name: Build
        run: npm run build

  backend-test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run tests
        run: |
          pytest tests/unit/ -v --cov=packages/shared/ --cov-report=xml
      
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage.xml

  e2e-test:
    runs-on: ubuntu-latest
    needs: [frontend-test]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd apps/website-v2
          npm ci
      
      - name: Install Playwright
        run: |
          cd apps/website-v2
          npx playwright install --with-deps
      
      - name: Run E2E tests
        run: |
          cd apps/website-v2
          npx playwright test
      
      - name: Upload E2E results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: apps/website-v2/playwright-report/
          retention-days: 30
```

**Create Deploy Workflow:**

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          working-directory: ./apps/website-v2

  deploy-backend:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to Render
        run: |
          curl -X POST \
            -H "Authorization: Bearer ${{ secrets.RENDER_API_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"clearCache": true}' \
            ${{ secrets.RENDER_DEPLOY_HOOK }}
```

**Verification:**
```bash
# Validate workflow files
# Using actionlint if available
# actionlint .github/workflows/*.yml
```

### Step 7: Environment Variable Management

**Objective:** Set up environment variables for all environments.

```bash
# Create environment template
cat > .env.deployment.template << 'EOF'
# Deployment Environment Variables

# Frontend (Vercel)
VITE_API_URL=https://api-4njz4.onrender.com/v1
VITE_WS_URL=wss://api-4njz4.onrender.com/v1/ws

# Backend (Render)
DATABASE_URL=postgresql://...
REDIS_URL=rediss://...
PANDASCORE_API_KEY=pc_live_...
APP_ENVIRONMENT=production
JWT_SECRET_KEY=...
TOTP_ENCRYPTION_KEY=...

# CI/CD
VERCEL_TOKEN=...
VERCEL_ORG_ID=...
VERCEL_PROJECT_ID=...
RENDER_API_KEY=...
RENDER_DEPLOY_HOOK=...
EOF
```

**Create Environment Validation Script:**

```python
# scripts/validate-env.py
#!/usr/bin/env python3
"""Validate environment variables for deployment."""

import os
import sys
from typing import List

REQUIRED_ENV_VARS = {
    "production": [
        "VITE_API_URL",
        "VITE_WS_URL",
        "DATABASE_URL",
        "JWT_SECRET_KEY",
        "TOTP_ENCRYPTION_KEY",
    ],
    "staging": [
        "VITE_API_URL",
        "VITE_WS_URL",
        "DATABASE_URL",
    ],
}


def validate_env(environment: str) -> bool:
    """Validate environment variables."""
    required = REQUIRED_ENV_VARS.get(environment, [])
    missing = []
    
    for var in required:
        if not os.getenv(var):
            missing.append(var)
    
    if missing:
        print(f"Missing required environment variables for {environment}:")
        for var in missing:
            print(f"  - {var}")
        return False
    
    print(f"All required environment variables present for {environment}")
    return True


if __name__ == "__main__":
    env = sys.argv[1] if len(sys.argv) > 1 else "production"
    success = validate_env(env)
    sys.exit(0 if success else 1)
```

**Verification:**
```bash
# Test environment validation
python scripts/validate-env.py production || echo "Expected: missing vars in dev"
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Vitest failing to find tests | Check `testDir` configuration |
| Playwright browsers not found | Run `npx playwright install` |
| Coverage not generating | Verify `v8` provider is installed |
| Vercel build failing | Check `distDir` path in config |
| Render deploy failing | Verify `startCommand` works locally |
| CI failing on type check | Run `npm run typecheck` locally |
| Environment variables missing | Check GitHub secrets configuration |
| E2E tests flaky | Add `retries` to Playwright config |
| Python tests slow | Use pytest-xdist for parallel execution |

## Completion Criteria

- [ ] Vitest configured with coverage
- [ ] Component tests written
- [ ] Hook tests written
- [ ] Playwright E2E tests configured
- [ ] Multiple browser testing enabled
- [ ] Python pytest configured
- [ ] Integration tests written
- [ ] Vercel deployment configured
- [ ] Render deployment configured
- [ ] CI pipeline (GitHub Actions) created
- [ ] CD pipeline for auto-deployment created
- [ ] Environment variable management documented
- [ ] All tests passing
- [ ] Deployment successful

## Testing Checklist

### Unit Tests
- [ ] Components render correctly
- [ ] Hooks behave as expected
- [ ] Utilities functions work
- [ ] Edge cases handled

### Integration Tests
- [ ] API endpoints respond correctly
- [ ] Database operations work
- [ ] Authentication flows function
- [ ] Error handling works

### E2E Tests
- [ ] User flows complete successfully
- [ ] Responsive design works
- [ ] Performance is acceptable
- [ ] Accessibility passes

## Post-Completion

After completing this playbook:
1. Run full test suite and verify 100% pass
2. Perform staging deployment
3. Run smoke tests on staging
4. Document any deployment issues
5. Schedule production deployment
6. Update project documentation

## Maintenance Schedule

### Daily
- Review CI pipeline status
- Address flaky tests

### Weekly
- Review test coverage reports
- Update E2E tests for new features

### Monthly
- Full test suite audit
- Dependency updates
- Performance benchmarking
