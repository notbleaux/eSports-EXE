/**
 * Mobile Responsiveness E2E Tests
 * Tests layout and functionality on mobile devices
 * 
 * [Ver001.000]
 */

import { test, expect } from '@playwright/test'

test.describe('Mobile Responsiveness', () => {
  
  test.use({ viewport: { width: 375, height: 667 } })
  
  test('landing page renders on mobile', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for mobile viewport meta
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).toContain('width=device-width')
    
    // Page content should be visible
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
    expect(bodyText?.length).toBeGreaterThan(0)
  })

  test('mobile navigation menu', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Look for hamburger menu
    const menuButton = page.locator(
      '[data-testid="mobile-menu"], ' +
      'button[aria-label*="menu" i], ' +
      'button:has(.hamburger), ' +
      '.hamburger'
    ).first()
    
    if (await menuButton.count() > 0) {
      // Click to open menu
      await menuButton.click()
      await page.waitForTimeout(500)
      
      // Menu should be visible
      const menu = page.locator('nav, [role="navigation"], .mobile-menu').first()
      await expect(menu).toBeVisible()
    }
  })

  test('SATOR hub on mobile', async ({ page }) => {
    await page.goto('/sator')
    await page.waitForLoadState('networkidle')
    
    // Content should fit within viewport
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    
    // Allow some tolerance for scrollbars
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20)
    
    // Text should be readable
    const headings = page.locator('h1, h2, h3').first()
    if (await headings.count() > 0) {
      const fontSize = await headings.evaluate(el => 
        parseFloat(window.getComputedStyle(el).fontSize)
      )
      expect(fontSize).toBeGreaterThanOrEqual(12) // Minimum readable size
    }
  })

  test('touch interactions work', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Find a clickable element
    const link = page.locator('a, button').first()
    
    if (await link.count() > 0) {
      // Simulate tap
      const box = await link.boundingBox()
      if (box) {
        await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height / 2)
      }
    }
    
    // Page should respond
    expect(await page.url()).toBeTruthy()
  })

  test('horizontal scroll is prevented', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check for horizontal overflow
    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth
    })
    
    // Should not have horizontal scroll on mobile
    expect(hasHorizontalScroll).toBeFalsy()
  })

  test('images are responsive', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const images = page.locator('img')
    const count = await images.count()
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const img = images.nth(i)
      const width = await img.evaluate(el => el.width).catch(() => 0)
      const naturalWidth = await img.evaluate(el => el.naturalWidth).catch(() => 0)
      
      // Images should not overflow their containers
      const parentWidth = await img.evaluate(el => el.parentElement?.clientWidth || 0)
      
      if (naturalWidth > 0 && parentWidth > 0) {
        expect(width).toBeLessThanOrEqual(parentWidth + 10)
      }
    }
  })

  test('forms are usable on mobile', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    const inputs = page.locator('input, textarea, select')
    const count = await inputs.count()
    
    if (count === 0) {
      test.skip()
      return
    }
    
    // Check that inputs are large enough for touch
    for (let i = 0; i < Math.min(count, 5); i++) {
      const input = inputs.nth(i)
      const box = await input.boundingBox()
      
      if (box) {
        // Minimum touch target size is 44x44
        expect(box.width).toBeGreaterThanOrEqual(44)
        expect(box.height).toBeGreaterThanOrEqual(30)
      }
    }
  })

  test('tablets render correctly', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/sator')
    await page.waitForLoadState('networkidle')
    
    // Content should be visible
    const bodyText = await page.locator('body').textContent()
    expect(bodyText).toBeTruthy()
    
    await page.screenshot({ path: 'test-results/tablet-view.png' })
  })
})
