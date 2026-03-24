[Ver001.000]
# Comprehensive Testing Strategy
**Platform:** Libre-X-eSport 4NJZ4 TENET  
**Date:** March 15, 2026  
**Status:** Strong foundation, targeted improvements needed

---

## Executive Summary

| Metric | Current | Target | Status |
|--------|---------|--------|--------|
| Unit Tests | 182 passing | 200+ | ✅ Good |
| Test Coverage | 48.1% | 70%+ | ⚠️ Needs improvement |
| E2E Tests | 12 files | 15+ | ✅ Good foundation |
| CI Integration | Partial | Full | ⚠️ In progress |

---

## 1. Current Test Inventory

### 1.1 Unit Tests (182 passing, 23 skipped)

| Category | Files | Tests | Coverage | Priority |
|----------|-------|-------|----------|----------|
| **API Layer** | 4 | 34 | 48% | P1 |
| **Components** | 4 | 41 | 99% | ✅ Excellent |
| **Hooks** | 6 | 32 | N/A | P2 |
| **Stores** | 3 | 71 | 94% | ✅ Excellent |
| **Services** | 2 | 9 | 78% | ✅ Good |
| **Workers** | 2 | 8 | 15% | P1 |
| **Utils** | 1 | 4 | 85% | ✅ Good |

### 1.2 E2E Tests (12 spec files)

| Spec File | Purpose | Status |
|-----------|---------|--------|
| `accessibility.spec.ts` | A11y compliance | ✅ Exists |
| `auth.spec.ts` | Authentication flows | ✅ Exists |
| `critical-path.spec.ts` | Core user journeys | ✅ Exists |
| `errors.spec.ts` | Error handling | ✅ Exists |
| `export.spec.ts` | Data export | ✅ Exists |
| `health.spec.ts` | Health checks | ✅ Exists |
| `hub-navigation.spec.ts` | Hub routing | ✅ Exists |
| `ml-prediction.spec.ts` | ML features | ✅ Exists |
| `mobile.spec.ts` | Responsive design | ✅ Exists |
| `realtime.spec.ts` | WebSocket/real-time | ✅ Exists |
| `search.spec.ts` | Search functionality | ✅ Exists |
| `visualization.spec.ts` | Charts/visuals | ✅ Exists |

### 1.3 Coverage Gaps

| Area | Coverage | Gap |
|------|----------|-----|
| Hub Components (SATOR, ROTAS, AREPO, OPERA, TENET) | 0% | ❌ No tests |
| Token System | 0% | ❌ No tests |
| Forum System | 0% | ❌ No tests |
| Fantasy System | 0% | ❌ No tests |
| Wiki System | 0% | ❌ No tests |
| Workers | 15% | ⚠️ Incomplete |
| Monitoring | 5% | ⚠️ Incomplete |

---

## 2. Testing Architecture

### 2.1 Test Pyramid

```
        /\
       /  \
      / E2E \        <- 12 Playwright specs
     /________\
    /          \
   / Integration \   <- API + Component integration
  /______________\
 /                \
/      Unit        \  <- 182 Vitest tests
/____________________\
```

### 2.2 Test Organization

```
apps/website-v2/
├── src/
│   ├── api/__tests__/           # API client tests
│   ├── components/__tests__/    # Component tests
│   ├── hooks/__tests__/         # Hook tests
│   ├── services/__tests__/      # Service tests
│   ├── store/__tests__/         # State management tests
│   ├── workers/__tests__/       # Web Worker tests
│   └── utils/__tests__/         # Utility tests
├── e2e/                         # Playwright E2E tests
│   ├── accessibility.spec.ts
│   ├── auth.spec.ts
│   ├── critical-path.spec.ts
│   └── ...
├── test/
│   ├── setup.ts                 # Test setup
│   ├── mocks/                   # Mock data
│   └── utils.tsx                # Test utilities
├── vitest.config.js             # Unit test config
└── playwright.config.ts         # E2E test config
```

---

## 3. Immediate Actions Required

### 3.1 Critical (P0) - This Week

#### Fix TypeScript Test Issues
```typescript
// File: src/components/__tests__/ErrorBoundary.test.tsx
// Issue: Missing jest-dom types

// Add to test/setup.ts or vitest.config.js:
import '@testing-library/jest-dom';
```

#### Fix Store Deprecation Warning
```typescript
// File: src/store/__tests__/predictionHistoryStore.test.ts
// Issue: [DEPRECATED] `getStorage`, `serialize` and `deserialize`

// Fix: Update to use `storage` option instead
```

### 3.2 High Priority (P1) - Next 2 Weeks

#### Add Hub Component Tests
```typescript
// Create: src/hub-1-sator/__tests__/SatorHub.test.tsx
// Create: src/hub-2-rotas/__tests__/RotasHub.test.tsx
// Create: src/hub-3-arepo/__tests__/ArepoHub.test.tsx
// Create: src/hub-4-opera/__tests__/OperaHub.test.tsx
// Create: src/hub-5-tenet/__tests__/TenetHub.test.tsx
```

#### Add Feature Tests
```typescript
// Create: src/components/Fantasy/__tests__/FantasyContainer.test.tsx
// Create: src/components/Forum/__tests__/ForumContainer.test.tsx
// Create: src/components/Wiki/__tests__/WikiPage.test.tsx
// Create: src/components/Token/__tests__/TokenWallet.test.tsx
```

#### Improve Worker Coverage (15% → 80%)
```typescript
// Enhance: src/workers/grid.worker.test.ts
// Add: src/workers/ml.worker.test.ts
```

### 3.3 Medium Priority (P2) - Next Month

#### Add Integration Tests
```typescript
// Create: src/__tests__/integration/token-flow.test.ts
// Create: src/__tests__/integration/forum-post.test.ts
// Create: src/__tests__/integration/fantasy-draft.test.ts
```

#### Add Visual Regression Tests
```typescript
// Add to playwright.config.ts:
// screenshot: 'on',
// Compare screenshots for visual changes
```

---

## 4. Test Implementation Templates

### 4.1 Component Test Template

```typescript
// src/components/__tests__/ComponentName.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ComponentName } from '../ComponentName';

describe('ComponentName', () => {
  it('renders correctly', () => {
    render(<ComponentName />);
    expect(screen.getByTestId('component-name')).toBeInTheDocument();
  });

  it('handles user interactions', () => {
    const onClick = vi.fn();
    render(<ComponentName onClick={onClick} />);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalled();
  });

  it('applies correct styles for hub color', () => {
    const { container } = render(<ComponentName hubColor="opera" />);
    expect(container.firstChild).toHaveClass('border-[#9d4edd]');
  });
});
```

### 4.2 Hook Test Template

```typescript
// src/hooks/__tests__/useHookName.test.ts
import { renderHook, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { useHookName } from '../useHookName';

describe('useHookName', () => {
  it('initializes with default state', () => {
    const { result } = renderHook(() => useHookName());
    expect(result.current.value).toBe('default');
  });

  it('updates state on action', () => {
    const { result } = renderHook(() => useHookName());
    act(() => {
      result.current.setValue('new');
    });
    expect(result.current.value).toBe('new');
  });
});
```

### 4.3 E2E Test Template

```typescript
// e2e/feature-name.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('user can complete main flow', async ({ page }) => {
    // Navigate to feature
    await page.click('[data-testid="nav-feature"]');
    await expect(page).toHaveURL('/feature');

    // Interact with feature
    await page.fill('[data-testid="input-name"]', 'Test');
    await page.click('[data-testid="submit"]');

    // Verify result
    await expect(page.locator('[data-testid="success"]')).toBeVisible();
  });

  test('handles errors gracefully', async ({ page }) => {
    // Trigger error condition
    await page.click('[data-testid="trigger-error"]');
    
    // Verify error handling
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
  });
});
```

### 4.4 API Test Template

```typescript
// src/api/__tests__/feature.test.ts
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchFeature } from '../feature';
import { server } from '../../test/mocks/server';
import { http, HttpResponse } from 'msw';

describe('Feature API', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  it('fetches data successfully', async () => {
    server.use(
      http.get('/api/feature', () => {
        return HttpResponse.json({ data: 'test' });
      })
    );

    const result = await fetchFeature();
    expect(result).toEqual({ data: 'test' });
  });

  it('handles errors correctly', async () => {
    server.use(
      http.get('/api/feature', () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    await expect(fetchFeature()).rejects.toThrow();
  });
});
```

---

## 5. E2E Test Strategy

### 5.1 Critical User Paths

```typescript
// e2e/critical-path.spec.ts
const CRITICAL_PATHS = [
  {
    name: 'Hub Navigation',
    steps: [
      'Visit landing page',
      'Click each hub quadrant',
      'Verify hub loads',
      'Navigate back',
    ],
  },
  {
    name: 'Token Claim',
    steps: [
      'Login',
      'Navigate to TENET',
      'Click daily claim',
      'Verify balance update',
    ],
  },
  {
    name: 'Fantasy League',
    steps: [
      'Navigate to OPERA',
      'Create league',
      'Draft players',
      'Set lineup',
    ],
  },
  {
    name: 'Forum Post',
    steps: [
      'Navigate to AREPO',
      'Create thread',
      'Add reply',
      'Verify persistence',
    ],
  },
];
```

### 5.2 Cross-Browser Matrix

| Browser | Desktop | Mobile | Priority |
|---------|---------|--------|----------|
| Chrome | ✅ | ✅ | P0 |
| Firefox | ✅ | - | P1 |
| Safari | ✅ | ✅ | P1 |
| Edge | - | - | P2 |

### 5.3 Device Matrix

| Device | Viewport | Tests |
|--------|----------|-------|
| Desktop | 1920x1080 | All |
| Laptop | 1366x768 | All |
| Tablet | 768x1024 | Core |
| Mobile | 375x667 | Critical |

---

## 6. Test Data Management

### 6.1 Mock Data Structure

```
test/mocks/
├── data/
│   ├── users.ts           # User fixtures
│   ├── tokens.ts          # Token data
│   ├── tournaments.ts     # Tournament fixtures
│   ├── matches.ts         # Match results
│   └── players.ts         # Player stats
├── handlers.ts            # MSW handlers
└── server.ts              # Mock server setup
```

### 6.2 Test Factories

```typescript
// test/factories/user.ts
import { faker } from '@faker-js/faker';

export const createUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  username: faker.internet.userName(),
  email: faker.internet.email(),
  tokens: faker.number.int({ min: 0, max: 10000 }),
  createdAt: faker.date.past(),
  ...overrides,
});

// test/factories/league.ts
export const createLeague = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.lorem.words(2),
  gameType: 'valorant',
  maxTeams: 10,
  ...overrides,
});
```

---

## 7. CI/CD Integration

### 7.1 GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

### 7.2 Quality Gates

| Metric | Threshold | Action |
|--------|-----------|--------|
| Unit Test Coverage | < 60% | ❌ Block merge |
| Unit Test Coverage | 60-70% | ⚠️ Warning |
| Unit Test Coverage | > 70% | ✅ Pass |
| E2E Tests | Any failure | ❌ Block merge |
| TypeScript Errors | > 0 | ❌ Block merge |

---

## 8. Performance Testing

### 8.1 Lighthouse CI

```javascript
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      url: ['http://localhost:5173/'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['warn', { minScore: 0.8 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['warn', { minScore: 0.8 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
      },
    },
  },
};
```

### 8.2 Bundle Size Monitoring

```javascript
// bundlewatch.config.js
module.exports = {
  files: [
    {
      path: 'dist/assets/*.js',
      maxSize: '500kB',
    },
  ],
};
```

---

## 9. Testing Checklist

### Pre-Commit
- [ ] Unit tests pass (`npm test`)
- [ ] No TypeScript errors (`npm run typecheck`)
- [ ] Lint passes (`npm run lint`)

### Pre-PR
- [ ] All unit tests pass
- [ ] Coverage >= 60%
- [ ] E2E critical paths pass
- [ ] Manual testing completed

### Pre-Release
- [ ] All test suites pass
- [ ] Coverage >= 70%
- [ ] Full E2E suite passes
- [ ] Performance benchmarks met
- [ ] Cross-browser verified
- [ ] Mobile responsive verified

---

## 10. Success Metrics

| Metric | Current | 1 Month | 3 Months |
|--------|---------|---------|----------|
| Unit Test Coverage | 48% | 60% | 75% |
| E2E Test Coverage | 60% | 80% | 90% |
| Test Flakiness | 5% | 2% | <1% |
| CI Pass Rate | 85% | 95% | 99% |
| Bug Escape Rate | 15% | 8% | 3% |

---

## Appendix: Quick Commands

```bash
# Run all unit tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run specific E2E test
npx playwright test e2e/critical-path.spec.ts

# Run E2E with UI
npx playwright test --ui

# Debug E2E test
npx playwright test --debug

# Update E2E snapshots
npx playwright test --update-snapshots
```

---

*Testing strategy is a living document. Update as requirements change.*
