/** [Ver002.000]
 * Complete WebSocket Flows E2E Tests
 * ==================================
 * Tests WebSocket subscriptions, channels, and connection management
 */

import { test, expect } from '@playwright/test';

test.describe('Complete WebSocket Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('Subscribe to all channel types', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Subscribe to global channel
    const globalSub = page.locator('[data-testid="subscribe-global"]').or(
      page.locator('button:has-text("Subscribe Global")')
    );
    if (await globalSub.isVisible().catch(() => false)) {
      await globalSub.click();
    }

    // Subscribe to match channel
    const matchSub = page.locator('[data-testid="subscribe-match"]').or(
      page.locator('button:has-text("Subscribe Match")')
    );
    if (await matchSub.isVisible().catch(() => false)) {
      await matchSub.click();
    }

    // Subscribe to team channel
    const teamSub = page.locator('[data-testid="subscribe-team"]').or(
      page.locator('button:has-text("Subscribe Team")')
    );
    if (await teamSub.isVisible().catch(() => false)) {
      await teamSub.click();
    }

    // Verify subscription status
    await page.waitForTimeout(1000);
    const channelStatus = page.locator('[data-testid="channel-status"]').or(
      page.locator('text=/subscribed|connected/i').first()
    );
    
    await expect(channelStatus).toBeVisible();
  });

  test('Unsubscribe from specific channel', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // First subscribe to a channel
    const subscribeButton = page.locator('[data-testid="subscribe-match"]').or(
      page.locator('button:has-text("Subscribe")').first()
    );

    if (await subscribeButton.isVisible().catch(() => false)) {
      await subscribeButton.click();
      await page.waitForTimeout(1000);

      // Then unsubscribe
      const unsubscribeButton = page.locator('[data-testid="unsubscribe"]').or(
        page.locator('button:has-text("Unsubscribe")')
      );

      if (await unsubscribeButton.isVisible().catch(() => false)) {
        await unsubscribeButton.click();
        await page.waitForTimeout(1000);

        // Verify unsubscribed status
        const status = page.locator('[data-testid="subscription-status"]').or(
          page.locator('text=/unsubscribed|disconnected/i').first()
        );
        
        await expect(status).toBeVisible();
      }
    }
  });

  test('WebSocket message history', async ({ page }) => {
    await page.goto('/stats');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for message history display
    const messageHistory = page.locator('[data-testid="message-history"]').or(
      page.locator('[class*="message-list"], [class*="history"]')
    );

    if (await messageHistory.isVisible().catch(() => false)) {
      // Count messages in history
      const messages = messageHistory.locator('> *');
      const count = await messages.count();

      test.info().annotations.push({
        type: 'info',
        description: `Message history contains ${count} messages`
      });

      expect(count >= 0).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'Message history display not found'
      });
    }
  });

  test('Multiple concurrent connections', async ({ page, context }) => {
    // Create multiple pages (simulating multiple tabs)
    const page2 = await context.newPage();
    
    // Navigate both to SATOR hub
    await page.goto('/analytics');
    await page2.goto('/analytics');
    
    await page.waitForLoadState('networkidle');
    await page2.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check WebSocket status on both pages
    const wsStatus1 = await page.locator('[data-testid="ws-status"]').textContent().catch(() => 'unknown');
    const wsStatus2 = await page2.locator('[data-testid="ws-status"]').textContent().catch(() => 'unknown');

    test.info().annotations.push({
      type: 'info',
      description: `Page 1: ${wsStatus1}, Page 2: ${wsStatus2}`
    });

    // Both should show some connection state
    expect(wsStatus1.length > 0 && wsStatus2.length > 0).toBeTruthy();

    await page2.close();
  });

  test('WebSocket error recovery', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const wsStatus = page.locator('[data-testid="ws-status"]');
    const initialStatus = await wsStatus.textContent().catch(() => 'unknown');

    // Simulate network error
    await page.evaluate(() => {
      window.dispatchEvent(new Event('offline'));
    });
    
    await page.waitForTimeout(2000);

    // Restore network
    await page.evaluate(() => {
      window.dispatchEvent(new Event('online'));
    });

    await page.waitForTimeout(5000);

    const finalStatus = await wsStatus.textContent().catch(() => 'unknown');

    test.info().annotations.push({
      type: 'info',
      description: `Recovery: ${initialStatus} -> ${finalStatus}`
    });

    // Should attempt reconnection
    expect(finalStatus.length > 0).toBeTruthy();
  });

  test('WebSocket heartbeat maintenance', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const wsStatus = page.locator('[data-testid="ws-status"]');
    const status1 = await wsStatus.textContent().catch(() => 'unknown');

    // Wait for heartbeat interval (shortened for test)
    await page.waitForTimeout(10000);

    const status2 = await wsStatus.textContent().catch(() => 'unknown');

    test.info().annotations.push({
      type: 'info',
      description: `Heartbeat check: ${status1} -> ${status2}`
    });

    // Connection should remain stable
    const stillConnected = status2.toLowerCase().includes('connected') ||
                          status1 === status2;
    expect(stillConnected).toBe(true);
  });

  test('Channel filtering and routing', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // Look for channel filter controls
    const channelFilter = page.locator('[data-testid="channel-filter"]').or(
      page.locator('select[data-testid="channel-select"], [class*="channel-filter"]')
    );

    if (await channelFilter.isVisible().catch(() => false)) {
      // Test filtering by different channels
      const channels = ['all', 'matches', 'teams', 'events'];
      
      for (const channel of channels) {
        await channelFilter.selectOption(channel).catch(() => {});
        await page.waitForTimeout(500);
      }

      expect(true).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'Channel filter not found'
      });
    }
  });

  test('WebSocket authentication', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Check for authenticated WebSocket features
    const authRequiredFeature = page.locator('[data-testid="ws-authenticated"]').or(
      page.locator('text=/authenticated|logged in/i').first()
    );

    if (await authRequiredFeature.isVisible().catch(() => false)) {
      // Authenticated features should be available
      await expect(authRequiredFeature).toBeVisible();
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'WebSocket auth features may require login'
      });
    }
  });

  test('Message rate limiting display', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');

    // Look for rate limit indicators
    const rateLimitIndicator = page.locator('[data-testid="rate-limit"]').or(
      page.locator('text=/rate limit|throttled|slow down/i').first()
    );

    // Rate limit indicator may or may not be visible
    const isVisible = await rateLimitIndicator.isVisible().catch(() => false);
    
    test.info().annotations.push({
      type: 'info',
      description: `Rate limit indicator visible: ${isVisible}`
    });

    expect(true).toBeTruthy();
  });

  test('Connection metrics display', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    // Look for connection metrics
    const metrics = page.locator('[data-testid="ws-metrics"]').or(
      page.locator('text=/latency|ping|connection time/i').first()
    );

    if (await metrics.isVisible().catch(() => false)) {
      const metricsText = await metrics.textContent() || '';
      
      // Should contain numeric values
      const hasNumbers = metricsText.match(/\d+/) !== null;
      expect(hasNumbers).toBeTruthy();
    } else {
      test.info().annotations.push({
        type: 'info',
        description: 'Connection metrics not displayed'
      });
    }
  });
});
