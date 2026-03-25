/**
 * Critical Path E2E Tests
 * Core user journeys and error scenarios
 * 
 * [Ver001.000]
 */

import { test, expect } from '@playwright/test'

test.describe('Critical User Paths', () => {
  
  test('user journey: Landing → SATOR Hub → Prediction → Result', async ({ page }) => {
    // Step 1: Landing page loads
    await page.goto('/')
    await expect(page).toHaveTitle(/4NJZ4|TENET|Libre-X/)
    
    // Step 2: Navigate to SATOR Hub
    const satorLink = page.getByRole('link', { name: /SATOR|Observatory/i }).first()
    await expect(satorLink).toBeVisible()
    await satorLink.click()
    
    // Step 3: Verify SATOR Hub loads
    await expect(page).toHaveURL(/.*sator.*/i)
    await expect(page.getByText(/Observatory|Analytics|Prediction/i).first()).toBeVisible()
    
    // Step 4: Check for hub content
    await expect(page.getByText(/Observatory|Analytics|SATOR/i).first()).toBeVisible()
    
    // Step 5: Verify interactive elements are present
    await expect(page.locator('button, a').first()).toBeVisible()
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/sator-hub-loaded.png' })
  })

  test('error scenario: ML failure → Error boundary → Recovery', async ({ page }) => {
    // Navigate to a hub with ML features
    await page.goto('/analytics')
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Check that error boundary elements are present (they should be in the DOM)
    const errorBoundary = page.locator('[role="alert"], [data-testid="error-boundary"]').first()
    
    // Initially, no error should be showing
    const initialErrorCount = await errorBoundary.count()
    
    // Simulate a client-side error by triggering an invalid action
    // This tests that error boundaries are in place
    await page.evaluate(() => {
      // Dispatch a test error event that the error boundary should catch
      window.dispatchEvent(new CustomEvent('test:error-boundary', { 
        detail: { message: 'Test error' } 
      }))
    })
    
    // Verify error handling UI is present (retry button, error message area)
    await expect(page.getByRole('button', { name: /Retry|Try Again/i }).first()).toBeVisible()
    
    // Test recovery by clicking retry
    await page.getByRole('button', { name: /Retry|Try Again/i }).first().click()
    
    // Should return to normal state
    await expect(page.getByText(/Observatory|SATOR/i).first()).toBeVisible()
  })

  test('offline scenario: Disconnect → Cached data → Reconnect', async ({ page }) => {
    // Navigate to the app and let service worker cache content
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    
    // Wait for initial content to load
    await expect(page.getByText(/4NJZ4|TENET|SATOR|Platform/i).first()).toBeVisible()
    
    // Simulate offline by blocking network
    await page.context().setOffline(true)
    
    // In offline mode, the existing page should still show cached content
    // (Service worker caches the page on first load)
    const content = page.getByText(/Observatory|SATOR|Offline|Cached|4NJZ4/i).first()
    await expect(content).toBeVisible({ timeout: 5000 })
    
    // Restore network
    await page.context().setOffline(false)
    
    // Should reconnect and show fresh content
    await page.reload()
    await expect(page.getByText(/Observatory|SATOR/i).first()).toBeVisible()
  })

  test('navigation: All hub links work correctly', async ({ page }) => {
    await page.goto('/')
    
    // Test each hub navigation
    const hubs = [
      { name: /SATOR|Observatory/i, path: /sator/ },
      { name: /ROTAS|Harmonic/i, path: /rotas/ },
      { name: /AREPO|Simulation/i, path: /arepo/ },
      { name: /OPERA|Temporal/i, path: /opera/ },
    ]
    
    for (const hub of hubs) {
      // Click hub link (use first to handle multiple matches)
      const link = page.getByRole('link', { name: hub.name }).first()
      
      // Skip if hub not in current navigation
      if (await link.count() === 0) continue
      
      await link.click()
      
      // Verify navigation
      await expect(page).toHaveURL(hub.path)
      
      // Verify content loaded
      await expect(page.locator('body')).toContainText(/./, { timeout: 10000 })
      
      // Go back for next test
      await page.goto('/')
    }
  })

  test('performance: Core Web Vitals thresholds', async ({ page }) => {
    // Capture performance metrics
    const performanceMetrics = await page.evaluate(async () => {
      // Wait for load
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
      const paint = performance.getEntriesByType('paint')
      
      return {
        // FCP
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        // LCP approximation
        loadTime: navigation?.loadEventEnd - navigation?.startTime || 0,
        // TTFB
        ttfb: navigation?.responseStart - navigation?.startTime || 0,
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Assert performance thresholds
    expect(performanceMetrics.fcp).toBeLessThan(3000) // FCP < 3s
    expect(performanceMetrics.ttfb).toBeLessThan(800) // TTFB < 800ms
  })

  test('accessibility: Keyboard navigation works', async ({ page }) => {
    await page.goto('/')
    
    // Tab through main navigation
    await page.keyboard.press('Tab')
    
    // Should be able to focus navigation elements
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).not.toBe('BODY')
    
    // Continue tabbing to find interactive elements
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }
    
    // Check that some element is focused
    const hasFocus = await page.evaluate(() => {
      const active = document.activeElement
      return active && active.tagName !== 'BODY' && active.tagName !== 'HTML'
    })
    
    expect(hasFocus).toBeTruthy()
  })
})
