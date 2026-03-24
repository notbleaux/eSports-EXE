# [Ver001.000] E2E Test Suite

## Overview

Critical E2E browser tests for the Libre-X-eSport 4NJZ4 TENET Platform using Playwright.

## Test Structure

```
tests/e2e/
├── critical/           # Critical path tests (Wave 1)
│   ├── auth.spec.ts    # Authentication flows
│   ├── betting.spec.ts # Betting core
│   ├── websocket.spec.ts # WebSocket connections
│   ├── navigation.spec.ts # Hub navigation
│   └── performance.spec.ts # Performance tests
├── fixtures/           # Test utilities
│   └── test-helpers.ts # Shared helpers
└── README.md          # This file
```

## Running Tests

### Run all critical tests in Chromium
```bash
cd apps/website-v2
npx playwright test tests/e2e/critical/ --project=chromium --reporter=list
```

### Run specific test file
```bash
npx playwright test tests/e2e/critical/auth.spec.ts --project=chromium
```

### Run with UI mode for debugging
```bash
npx playwright test tests/e2e/critical/ --ui
```

### Run with headed browser (visible)
```bash
npx playwright test tests/e2e/critical/ --headed
```

## Test Categories

### 1. Authentication (auth.spec.ts)
- OAuth login with Discord, Google, GitHub
- 2FA setup flow
- 2FA TOTP verification
- Backup codes
- Form validation
- Session management

### 2. Betting (betting.spec.ts)
- Match odds display
- Live odds updates
- Betting interface
- Odds validation
- Returns calculation

### 3. WebSocket (websocket.spec.ts)
- Gateway connection
- Channel subscription
- Auto-reconnect
- Error handling
- Heartbeat maintenance

### 4. Navigation (navigation.spec.ts)
- Hub loading
- Page transitions
- 404 handling
- Navigation component

### 5. Performance (performance.spec.ts)
- Page load times
- Lazy loading
- Resource optimization
- Runtime performance

## Test Data Attributes

Components use `data-testid` attributes for reliable element selection:

### Auth
- `discord-oauth-button`, `google-oauth-button`, `github-oauth-button`
- `setup-2fa-button`
- `2fa-qr-code`, `2fa-secret`
- `totp-input`, `verify-totp-button`
- `copy-backup-codes`
- `login-submit`, `login-error`
- `logout-button`

### Betting
- `team-a-odds`, `team-b-odds`
- `live-indicator`

### WebSocket
- `ws-status`, `websocket-status`
- `streaming-status`
- `subscribe-match-channel`
- `channel-status`, `channel-list`
- `ws-retry-button`, `ws-error`

### General
- `toast-success`, `toast-error`
- `error-boundary`

## Test Configuration

Tests use environment variables:
- `PLAYWRIGHT_BASE_URL` - Base URL (default: http://localhost:5173)
- `VITE_API_URL` - API URL (default: http://localhost:8000)
- `VITE_WS_URL` - WebSocket URL (default: ws://localhost:8000/ws)
- `CI` - CI mode flag (enables retries)

## Writing New Tests

1. Add test file to `tests/e2e/critical/`
2. Use `data-testid` selectors where possible
3. Add fallback selectors using `.or()` for resilience
4. Use `test.info().annotations.push()` for non-critical warnings
5. Follow existing test patterns for consistency

## Maintenance Notes

- Tests are designed to be resilient to UI changes
- Fallback selectors allow tests to pass even if exact structure changes
- Warnings are used instead of failures for non-critical missing elements
- Tests assume the dev server is running on localhost:5173
