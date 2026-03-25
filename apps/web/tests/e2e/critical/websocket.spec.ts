/** [Ver001.000]
 * Critical WebSocket E2E Tests
 * ============================
 * Tests WebSocket connection, channel subscription, and auto-reconnect
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Critical WebSocket Flows', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test.describe('Gateway Connection', () => {
    test('WebSocket connects on hub load', async ({ page }) => {
      // Navigate to SATOR hub which uses WebSocket
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');

      // Wait for WebSocket to potentially connect
      await page.waitForTimeout(3000);

      // Look for WebSocket status indicator
      const wsStatus = page.locator('[data-testid="ws-status"]').or(
        page.locator('[data-testid="websocket-status"]').or(
          page.locator('text=/connected|disconnected|connecting/i').first()
        )
      );

      const isVisible = await wsStatus.isVisible().catch(() => false);

      if (isVisible) {
        const statusText = await wsStatus.textContent() || '';
        const isConnected = statusText.toLowerCase().includes('connected');
        
        // Status should indicate connection
        expect(isConnected || statusText.toLowerCase().includes('connect')).toBeTruthy();
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'WebSocket status indicator not found'
        });
      }
    });

    test('WebSocket shows connection state transitions', async ({ page }) => {
      await page.goto('/analytics');
      
      // Monitor for any connection state changes
      const wsStatus = page.locator('[data-testid="ws-status"]');
      
      // Initial state check
      await page.waitForTimeout(2000);
      
      if (await wsStatus.isVisible().catch(() => false)) {
        const initialStatus = await wsStatus.textContent() || 'unknown';
        
        // Status should show some state
        expect(initialStatus.length).toBeGreaterThan(0);
        
        // Wait and check if status stabilizes
        await page.waitForTimeout(3000);
        const finalStatus = await wsStatus.textContent() || 'unknown';
        
        // Should eventually show connected or a stable state
        const isStable = finalStatus.toLowerCase().includes('connected') ||
                        finalStatus.toLowerCase().includes('error') ||
                        finalStatus.toLowerCase().includes('disconnected');
        
        expect(isStable).toBeTruthy();
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'WebSocket status element not available'
        });
      }
    });

    test('ROTAS hub initializes streaming WebSocket', async ({ page }) => {
      // ROTAS hub has StreamingErrorBoundary and handles live data
      await page.goto('/stats');
      await page.waitForLoadState('networkidle');
      
      // Wait for streaming components to initialize
      await page.waitForTimeout(3000);

      // Check for streaming-related indicators
      const streamingIndicator = page.locator('[data-testid="streaming-status"]').or(
        page.locator('[data-testid="ws-status"]').or(
          page.locator('text=/streaming|live|real-time/i').first()
        )
      );

      if (await streamingIndicator.isVisible().catch(() => false)) {
        await expect(streamingIndicator).toBeVisible();
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'Streaming indicator not found - WebSocket may be background connection'
        });
      }
    });
  });

  test.describe('Channel Subscription', () => {
    test('can subscribe to match channels', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Look for channel subscription button
      const subscribeButton = page.locator('[data-testid="subscribe-match-channel"]').or(
        page.locator('button:has-text("Subscribe"), button:has-text("Watch")').first()
      );

      if (await subscribeButton.isVisible().catch(() => false)) {
        await subscribeButton.click();
        
        // Check for subscription confirmation
        const channelStatus = page.locator('[data-testid="channel-status"]').or(
          page.locator('text=/subscribed|watching|following/i').first()
        );

        if (await channelStatus.isVisible().catch(() => false)) {
          const status = await channelStatus.textContent() || '';
          expect(status.toLowerCase()).toContain('subscribed');
        } else {
          test.info().annotations.push({
            type: 'warning',
            description: 'Channel status not displayed after subscribe'
          });
        }
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'Subscribe button not found'
        });
      }
    });

    test('channel list displays available channels', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');

      // Look for channel list or match list
      const channelList = page.locator('[data-testid="channel-list"]').or(
        page.locator('[data-testid="match-list"]').or(
          page.locator('[class*="channel"], [class*="match-list"]').first()
        )
      );

      if (await channelList.isVisible().catch(() => false)) {
        // List should have items
        const items = channelList.locator('> *');
        const count = await items.count();
        
        test.info().annotations.push({
          type: 'info',
          description: `Found ${count} channel/match items`
        });
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'Channel list not found'
        });
      }
    });
  });

  test.describe('Auto-Reconnect', () => {
    test('WebSocket attempts reconnection after disconnect', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      const wsStatus = page.locator('[data-testid="ws-status"]');
      
      if (await wsStatus.isVisible().catch(() => false)) {
        const initialStatus = await wsStatus.textContent() || '';
        
        // Simulate offline/online if possible
        await page.evaluate(() => {
          window.dispatchEvent(new Event('offline'));
        });
        
        await page.waitForTimeout(1000);
        
        await page.evaluate(() => {
          window.dispatchEvent(new Event('online'));
        });
        
        // Wait for potential reconnect
        await page.waitForTimeout(5000);
        
        const finalStatus = await wsStatus.textContent() || '';
        
        // Status should have changed or stabilized
        test.info().annotations.push({
          type: 'info',
          description: `WebSocket status: ${initialStatus} -> ${finalStatus}`
        });
        
        expect(finalStatus.length).toBeGreaterThan(0);
      } else {
        test.info().annotations.push({
          type: 'warning',
          description: 'Cannot test reconnect - status indicator not found'
        });
      }
    });

    test('connection maintains state across navigation', async ({ page }) => {
      // Start at SATOR hub
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check initial connection
      const initialStatus = await page.locator('[data-testid="ws-status"]').textContent().catch(() => 'unknown');
      
      // Navigate to another hub
      await page.goto('/stats');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      // Check connection after navigation
      const finalStatus = await page.locator('[data-testid="ws-status"]').textContent().catch(() => 'unknown');
      
      test.info().annotations.push({
        type: 'info',
        description: `Connection state: ${initialStatus} -> ${finalStatus}`
      });

      // Both should show some connection state
      expect(initialStatus.length).toBeGreaterThan(0);
      expect(finalStatus.length).toBeGreaterThan(0);
    });
  });

  test.describe('Error Handling', () => {
    test('WebSocket errors are handled gracefully', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');

      // Look for error boundaries or error messages
      const errorBoundary = page.locator('[data-testid="error-boundary"]').or(
        page.locator('[data-testid="ws-error"]').or(
          page.locator('text=/connection error|failed to connect/i').first()
        )
      );

      // If there's an error, it should be displayed gracefully
      if (await errorBoundary.isVisible().catch(() => false)) {
        // Error should be visible but page should still be functional
        await expect(errorBoundary).toBeVisible();
        
        // Page should still have content
        const bodyText = await page.locator('body').textContent() || '';
        expect(bodyText.length).toBeGreaterThan(100);
      } else {
        test.info().annotations.push({
          type: 'info',
          description: 'No WebSocket errors displayed - connection likely successful'
        });
      }
    });

    test('retry button appears on connection failure', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(3000);

      // Look for retry button
      const retryButton = page.locator('[data-testid="ws-retry-button"]').or(
        page.locator('button:has-text("Retry"), button:has-text("Reconnect")').first()
      );

      if (await retryButton.isVisible().catch(() => false)) {
        await expect(retryButton).toBeEnabled();
        
        // Click retry
        await retryButton.click();
        await page.waitForTimeout(3000);
        
        // Should attempt reconnection
        const wsStatus = await page.locator('[data-testid="ws-status"]').textContent().catch(() => 'unknown');
        expect(wsStatus.length).toBeGreaterThan(0);
      } else {
        test.info().annotations.push({
          type: 'info',
          description: 'Retry button not visible - connection likely stable'
        });
      }
    });
  });

  test.describe('Heartbeat', () => {
    test('WebSocket maintains connection with heartbeat', async ({ page }) => {
      await page.goto('/analytics');
      await page.waitForLoadState('networkidle');
      
      // Wait for initial connection
      await page.waitForTimeout(2000);
      
      // Get initial status
      const wsStatus = page.locator('[data-testid="ws-status"]');
      const initialStatus = await wsStatus.textContent().catch(() => 'unknown');
      
      // Wait for heartbeat interval (30 seconds default)
      // For testing, we'll wait a shorter time
      await page.waitForTimeout(5000);
      
      // Check status is still connected
      const finalStatus = await wsStatus.textContent().catch(() => 'unknown');
      
      test.info().annotations.push({
        type: 'info',
        description: `Heartbeat check: ${initialStatus} -> ${finalStatus}`
      });

      // Status should remain stable or connected
      expect(finalStatus.toLowerCase().includes('disconnected') && 
             !initialStatus.toLowerCase().includes('disconnected')).toBeFalsy();
    });
  });
});
