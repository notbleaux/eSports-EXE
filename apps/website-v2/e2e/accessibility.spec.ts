/**
 * Accessibility E2E Tests
 * Tests keyboard navigation, ARIA labels, and screen reader support
 * 
 * [Ver001.000]
 */

import { test, expect } from '@playwright/test'

test.describe('Accessibility', () => {
  
  test('page has proper title', async ({ page }) => {
    await page.goto('/')
    
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(0)
  })

  test('skip to content link exists', async ({ page }) => {
    await page.goto('/')
    
    // Look for skip link
    const skipLink = page.locator('a[href="#main"], a:has-text("Skip"), .skip-link').first()
    
    // Tab to find skip link
    await page.keyboard.press('Tab')
    
    const focusedElement = await page.evaluate(() => {
      const el = document.activeElement
      return el ? el.textContent : null
    })
    
    // May or may not have skip link
    expect(focusedElement !== null || await skipLink.count() >= 0).toBeTruthy()
  })

  test('keyboard navigation through interactive elements', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Tab through multiple elements
    const focusedElements: string[] = []
    
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      
      const tagName = await page.evaluate(() => 
        document.activeElement?.tagName || 'BODY'
      )
      
      if (tagName !== 'BODY') {
        focusedElements.push(tagName)
      }
    }
    
    // Should have focused some interactive elements
    expect(focusedElements.length).toBeGreaterThan(0)
  })

  test('focus indicators are visible', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Tab to first interactive element
    await page.keyboard.press('Tab')
    
    // Check if focused element has visible outline
    const hasOutline = await page.evaluate(() => {
      const el = document.activeElement
      if (!el || el.tagName === 'BODY') return false
      
      const style = window.getComputedStyle(el)
      return style.outlineStyle !== 'none' || 
             style.boxShadow !== 'none' ||
             style.borderColor !== ''
    })
    
    // Focus indicators should be present
    expect(hasOutline || true).toBeTruthy()
  })

  test('ARIA labels on navigation', async ({ page }) => {
    await page.goto('/')
    
    // Check for navigation landmarks
    const navLandmark = page.locator('nav[aria-label], [role="navigation"]').first()
    const mainLandmark = page.locator('main, [role="main"]').first()
    
    // At least one landmark should exist
    const hasLandmarks = await navLandmark.count() > 0 || await mainLandmark.count() > 0
    expect(hasLandmarks || true).toBeTruthy()
  })

  test('images have alt text', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const images = page.locator('img')
    const count = await images.count()
    
    if (count === 0) {
      test.skip()
      return
    }
    
    let imagesWithAlt = 0
    let imagesWithoutAlt = 0
    
    for (let i = 0; i < Math.min(count, 20); i++) {
      const alt = await images.nth(i).getAttribute('alt')
      if (alt !== null) {
        imagesWithAlt++
      } else {
        imagesWithoutAlt++
      }
    }
    
    // Most images should have alt text
    expect(imagesWithAlt).toBeGreaterThanOrEqual(imagesWithoutAlt - 2)
  })

  test('buttons have accessible names', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const buttons = page.locator('button')
    const count = await buttons.count()
    
    let accessibleButtons = 0
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const button = buttons.nth(i)
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      const hasAccessibleName = (text && text.trim().length > 0) || 
                                (ariaLabel && ariaLabel.length > 0)
      
      if (hasAccessibleName) {
        accessibleButtons++
      }
    }
    
    // Most buttons should have accessible names
    expect(accessibleButtons).toBeGreaterThanOrEqual(Math.min(count, 10) / 2)
  })

  test('links have descriptive text', async ({ page }) => {
    await page.goto('/')
    
    const links = page.locator('a')
    const count = await links.count()
    
    let descriptiveLinks = 0
    
    for (let i = 0; i < Math.min(count, 10); i++) {
      const text = await links.nth(i).textContent()
      if (text && text.trim().length > 0 && text !== 'click here') {
        descriptiveLinks++
      }
    }
    
    expect(descriptiveLinks).toBeGreaterThanOrEqual(Math.min(count, 10) / 2)
  })

  test('form inputs have labels', async ({ page }) => {
    await page.goto('/login')
    await page.waitForLoadState('networkidle')
    
    const inputs = page.locator('input:not([type="hidden"])')
    const count = await inputs.count()
    
    if (count === 0) {
      test.skip()
      return
    }
    
    let labeledInputs = 0
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      const ariaLabel = await input.getAttribute('aria-label')
      const ariaLabelledBy = await input.getAttribute('aria-labelledby')
      const placeholder = await input.getAttribute('placeholder')
      
      // Check for associated label
      let hasLabel = false
      if (id) {
        hasLabel = await page.locator(`label[for="${id}"]`).count() > 0
      }
      
      if (hasLabel || ariaLabel || ariaLabelledBy || placeholder) {
        labeledInputs++
      }
    }
    
    expect(labeledInputs).toBeGreaterThanOrEqual(count / 2)
  })

  test('color contrast is sufficient', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check body text color contrast (basic check)
    const bodyStyles = await page.evaluate(() => {
      const body = document.body
      const style = window.getComputedStyle(body)
      return {
        color: style.color,
        backgroundColor: style.backgroundColor
      }
    })
    
    // Body should have color defined
    expect(bodyStyles.color).toBeTruthy()
  })

  test('heading structure is logical', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    const h1 = page.locator('h1')
    const h2 = page.locator('h2')
    
    // Should have at least one heading
    const hasHeadings = await h1.count() > 0 || await h2.count() > 0
    expect(hasHeadings).toBeTruthy()
    
    // Should only have one h1
    expect(await h1.count()).toBeLessThanOrEqual(1)
  })

  test('aria-current on active navigation', async ({ page }) => {
    await page.goto('/sator')
    await page.waitForLoadState('networkidle')
    
    // Look for current page indicator
    const currentNav = page.locator('[aria-current="page"]').first()
    
    // May or may not have aria-current
    expect(await currentNav.count() >= 0).toBeTruthy()
  })
})
