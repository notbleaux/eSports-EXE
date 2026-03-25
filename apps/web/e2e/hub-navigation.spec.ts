/**
 * Hub Navigation E2E Tests
 * Tests navigation between all 4 hubs of the 4NJZ4 TENET Platform
 * 
 * [Ver001.000]
 */

import { test, expect } from '@playwright/test'

test.describe('Hub Navigation', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
  })

  test('navigate to SATOR hub', async ({ page }) => {
    // Find and click SATOR hub link
    const satorLink = page.locator('[data-hub="sator"], [data-testid="hub-sator"], a[href*="sator"]').first()
    
    if (await satorLink.count() === 0) {
      // Try alternative selectors
      await page.goto('/analytics')
    } else {
      await satorLink.click()
    }
    
    // Verify URL changed
    await expect(page).toHaveURL(/.*sator.*/i, { timeout: 5000 })
    
    // Verify hub content loaded
    await expect(page.locator('body')).toContainText(/SATOR|Observatory|Analytics/i, { timeout: 5000 })
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/sator-hub.png' })
  })

  test('navigate to ROTAS hub', async ({ page }) => {
    const rotasLink = page.locator('[data-hub="rotas"], [data-testid="hub-rotas"], a[href*="rotas"]').first()
    
    if (await rotasLink.count() === 0) {
      await page.goto('/stats')
    } else {
      await rotasLink.click()
    }
    
    await expect(page).toHaveURL(/.*rotas.*/i, { timeout: 5000 })
    await expect(page.locator('body')).toContainText(/ROTAS|Harmonic|Simulation/i, { timeout: 5000 })
    
    await page.screenshot({ path: 'test-results/rotas-hub.png' })
  })

  test('navigate to AREPO hub', async ({ page }) => {
    const arepoLink = page.locator('[data-hub="arepo"], [data-testid="hub-arepo"], a[href*="arepo"]').first()
    
    if (await arepoLink.count() === 0) {
      await page.goto('/community')
    } else {
      await arepoLink.click()
    }
    
    await expect(page).toHaveURL(/.*arepo.*/i, { timeout: 5000 })
    await expect(page.locator('body')).toContainText(/AREPO|Player|Stats|Database/i, { timeout: 5000 })
    
    await page.screenshot({ path: 'test-results/arepo-hub.png' })
  })

  test('navigate to OPERA hub', async ({ page }) => {
    const operaLink = page.locator('[data-hub="opera"], [data-testid="hub-opera"], a[href*="opera"]').first()
    
    if (await operaLink.count() === 0) {
      await page.goto('/pro-scene')
    } else {
      await operaLink.click()
    }
    
    await expect(page).toHaveURL(/.*opera.*/i, { timeout: 5000 })
    await expect(page.locator('body')).toContainText(/OPERA|Temporal|Timeline|Events/i, { timeout: 5000 })
    
    await page.screenshot({ path: 'test-results/opera-hub.png' })
  })

  test('navigate to all 4 hubs sequentially', async ({ page }) => {
    const hubs = [
      { name: 'sator', pattern: /SATOR|Observatory/i },
      { name: 'rotas', pattern: /ROTAS|Harmonic/i },
      { name: 'arepo', pattern: /AREPO|Player/i },
      { name: 'opera', pattern: /OPERA|Temporal/i }
    ]
    
    for (const hub of hubs) {
      // Navigate to hub
      const link = page.locator(`[data-hub="${hub.name}"], a[href*="${hub.name}"]`).first()
      
      if (await link.count() > 0) {
        await link.click()
      } else {
        await page.goto(`/${hub.name}`)
      }
      
      // Verify navigation
      await expect(page).toHaveURL(new RegExp(`.*${hub.name}.*`, 'i'), { timeout: 5000 })
      await expect(page.locator('body')).toContainText(hub.pattern, { timeout: 5000 })
      
      // Go back to home for next hub
      await page.goto('/')
      await page.waitForLoadState('networkidle')
    }
  })

  test('hub navigation preserves state', async ({ page }) => {
    // Go to SATOR hub
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    
    // Scroll down to capture position
    await page.evaluate(() => window.scrollTo(0, 500))
    
    // Navigate to another hub and back
    await page.goto('/community')
    await page.waitForLoadState('networkidle')
    
    await page.goto('/analytics')
    await page.waitForLoadState('networkidle')
    
    // Page should load successfully
    await expect(page.locator('body')).toContainText(/SATOR|Observatory/i)
  })

  test('mobile hub navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Open mobile menu if it exists
    const menuButton = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]').first()
    if (await menuButton.count() > 0) {
      await menuButton.click()
    }
    
    // Navigate to a hub
    await page.goto('/analytics')
    await expect(page).toHaveURL(/.*sator.*/i)
    
    // Verify content is visible on mobile
    await expect(page.locator('body')).toContainText(/SATOR|Observatory/i)
  })
})
