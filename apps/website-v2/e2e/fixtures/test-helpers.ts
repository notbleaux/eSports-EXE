/** [Ver001.000]
 * E2E Test Helpers and Fixtures
 * =============================
 * Shared utilities for Playwright E2E tests
 */

import { Page, expect } from '@playwright/test';

/**
 * Test Configuration
 */
export const TEST_CONFIG = {
  baseUrl: process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:5173',
  apiUrl: process.env.VITE_API_URL || 'http://localhost:8000',
  wsUrl: process.env.VITE_WS_URL || 'ws://localhost:8000/ws',
  timeout: {
    short: 5000,
    medium: 10000,
    long: 30000,
  },
} as const;

/**
 * Test User Credentials
 * NOTE: These are test-only credentials for E2E testing
 */
export const TEST_USERS = {
  standard: {
    username: 'testuser',
    password: 'TestPass123!',
    email: 'test@example.com',
  },
  twoFactor: {
    username: '2fauser',
    password: 'TestPass123!',
    totpSecret: 'JBSWY3DPEHPK3PXP', // Test TOTP secret
  },
  admin: {
    username: 'admin',
    password: 'AdminPass123!',
  },
} as const;

/**
 * Create a test user session
 */
export async function createTestUser(page: Page, userType: keyof typeof TEST_USERS = 'standard') {
  const user = TEST_USERS[userType];
  
  // Navigate to login
  await page.goto('/tenet');
  await page.waitForLoadState('networkidle');

  // Fill in login form
  const usernameInput = page.locator('input[name="username"]').or(
    page.locator('input[placeholder*="username"]').first()
  );
  
  const passwordInput = page.locator('input[name="password"]').or(
    page.locator('input[type="password"]').first()
  );
  
  const submitButton = page.locator('button[type="submit"]').first();

  // Check if form elements exist
  if (await usernameInput.isVisible().catch(() => false)) {
    await usernameInput.fill(user.username);
    await passwordInput.fill(user.password);
    await submitButton.click();
    
    // Wait for navigation
    await page.waitForTimeout(2000);
    
    return true;
  }
  
  return false;
}

/**
 * Mock OAuth flow for testing
 */
export async function mockOAuthFlow(page: Page, provider: 'discord' | 'google' | 'github') {
  // Intercept OAuth popup
  const [popup] = await Promise.all([
    page.waitForEvent('popup', { timeout: 5000 }).catch(() => null),
    page.click(`[data-testid="${provider}-oauth-button"]`).catch(() => {}),
  ]);

  if (popup) {
    // Mock OAuth callback
    await popup.evaluate((providerName) => {
      window.opener?.postMessage({
        type: 'OAUTH_CALLBACK',
        provider: providerName,
        tokens: {
          accessToken: 'mock_access_token',
          refreshToken: 'mock_refresh_token',
        },
      }, window.location.origin);
    }, provider);
    
    await popup.close();
  }
}

/**
 * Wait for WebSocket connection
 */
export async function waitForWebSocket(page: Page, timeout: number = 10000) {
  const wsStatus = page.locator('[data-testid="ws-status"]');
  
  try {
    await expect(wsStatus).toHaveText(/connected/i, { timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Generate TOTP code for testing
 * This is a simplified version for testing purposes
 */
export function generateTOTP(secret: string = TEST_USERS.twoFactor.totpSecret): string {
  // For testing, return a fixed 6-digit code
  // In real tests, you would use a proper TOTP library
  return '123456';
}

/**
 * Clear browser storage
 */
export async function clearStorage(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

/**
 * Take screenshot on failure helper
 */
export async function takeScreenshot(page: Page, name: string) {
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
}

/**
 * Check if element exists and is visible
 */
export async function isElementVisible(page: Page, selector: string): Promise<boolean> {
  const element = page.locator(selector).first();
  return await element.isVisible().catch(() => false);
}

/**
 * Safe click with fallback
 */
export async function safeClick(page: Page, selector: string, fallbackSelector?: string) {
  const element = page.locator(selector).first();
  
  if (await element.isVisible().catch(() => false)) {
    await element.click();
    return true;
  }
  
  if (fallbackSelector) {
    const fallback = page.locator(fallbackSelector).first();
    if (await fallback.isVisible().catch(() => false)) {
      await fallback.click();
      return true;
    }
  }
  
  return false;
}

/**
 * Mock API responses for testing
 */
export async function mockApiResponses(page: Page) {
  // Mock matches API
  await page.route('**/api/v1/matches/**', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        id: 'test-match-123',
        team_a: { name: 'Test Team A', odds: 1.85 },
        team_b: { name: 'Test Team B', odds: 2.10 },
        status: 'live',
        start_time: new Date().toISOString(),
      }),
    });
  });

  // Mock auth API
  await page.route('**/api/auth/**', async (route) => {
    const url = route.request().url();
    
    if (url.includes('/2fa/setup')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          secret: 'JBSWY3DPEHPK3PXP',
          qr_code: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        }),
      });
    } else if (url.includes('/2fa/enable')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          backup_codes: [
            'ABCD-EFGH-IJKL',
            'MNOP-QRST-UVWX',
            'YZAB-CDEF-GHIJ',
          ],
        }),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Test data attributes reference
 * ==============================
 * Use these data-testid attributes in components:
 * 
 * Auth:
 * - discord-oauth-button
 * - google-oauth-button
 * - github-oauth-button
 * - setup-2fa-button
 * - 2fa-qr-code
 * - 2fa-secret
 * - totp-input
 * - verify-totp-button
 * - backup-code-input
 * - verify-backup-code-button
 * - use-backup-code-link
 * - login-submit
 * - login-error
 * - logout-button
 * 
 * Betting:
 * - team-a-odds
 * - team-b-odds
 * - odds-team-a
 * - odds-team-b
 * - live-indicator
 * 
 * WebSocket:
 * - ws-status
 * - websocket-status
 * - streaming-status
 * - subscribe-match-channel
 * - channel-status
 * - channel-list
 * - match-list
 * - ws-retry-button
 * - ws-error
 * 
 * General:
 * - toast-success
 * - toast-error
 * - error-boundary
 */
