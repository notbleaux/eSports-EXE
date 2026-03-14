/**
 * Test Setup Utilities
 * Shared setup and helpers for E2E tests
 * 
 * [Ver001.000]
 */

import { test as baseTest, Page, expect } from '@playwright/test'
import { MockWebSocketServer } from './mockWebSocket'
import { HubPage, SatorHubPage, ArepoHubPage, OperaHubPage, RotasHubPage } from '../page-objects/HubPage'

// Extend base test with fixtures
type TestFixtures = {
  hubPage: HubPage
  satorHub: SatorHubPage
  arepoHub: ArepoHubPage
  operaHub: OperaHubPage
  rotasHub: RotasHubPage
  mockWebSocket: MockWebSocketServer
}

export const test = baseTest.extend<TestFixtures>({
  // Hub page fixtures
  hubPage: async ({ page }, use) => {
    await use(new HubPage(page, 'sator'))
  },
  
  satorHub: async ({ page }, use) => {
    const hub = new SatorHubPage(page)
    await hub.goto()
    await use(hub)
  },
  
  arepoHub: async ({ page }, use) => {
    const hub = new ArepoHubPage(page)
    await hub.goto()
    await use(hub)
  },
  
  operaHub: async ({ page }, use) => {
    const hub = new OperaHubPage(page)
    await hub.goto()
    await use(hub)
  },
  
  rotasHub: async ({ page }, use) => {
    const hub = new RotasHubPage(page)
    await hub.goto()
    await use(hub)
  },
  
  // Mock WebSocket server
  mockWebSocket: async ({}, use) => {
    const server = new MockWebSocketServer(8765)
    await server.start()
    await use(server)
    await server.stop()
  }
})

export { expect }

// Common test helpers
export async function waitForStableState(page: Page, timeout: number = 5000): Promise<void> {
  // Wait for network to be idle
  await page.waitForLoadState('networkidle', { timeout })
  
  // Wait for any loading indicators to disappear
  const loadingSelectors = [
    '[data-testid="loading"]',
    '.loading',
    '.spinner',
    '[aria-busy="true"]'
  ]
  
  for (const selector of loadingSelectors) {
    const element = page.locator(selector).first()
    if (await element.count() > 0) {
      await element.waitFor({ state: 'hidden', timeout }).catch(() => {})
    }
  }
}

export async function clearStorage(page: Page): Promise<void> {
  await page.context().clearCookies()
  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
}

export async function simulateSlowNetwork(page: Page, delay: number = 500): Promise<void> {
  await page.route('**/*', async route => {
    await new Promise(resolve => setTimeout(resolve, delay))
    await route.continue()
  })
}

export async function restoreNetwork(page: Page): Promise<void> {
  await page.unroute('**/*')
}

// Accessibility helpers
export async function verifyFocusVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const activeElement = document.activeElement
    if (!activeElement || activeElement.tagName === 'BODY') {
      return false
    }
    
    const style = window.getComputedStyle(activeElement)
    return style.outlineStyle !== 'none' || 
           style.boxShadow !== 'none' ||
           style.borderColor !== ''
  })
}

export async function getAllFocusableElements(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const elements = document.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    return Array.from(elements).map(el => el.tagName)
  })
}

// Screenshot helper with metadata
export async function takeScreenshotWithMetadata(
  page: Page, 
  name: string, 
  metadata?: Record<string, unknown>
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `${name}-${timestamp}.png`
  
  await page.screenshot({
    path: `test-results/screenshots/${filename}`,
    fullPage: true
  })
  
  if (metadata) {
    // Save metadata alongside screenshot
    const fs = await import('fs')
    fs.writeFileSync(
      `test-results/screenshots/${name}-${timestamp}.json`,
      JSON.stringify({
        timestamp,
        url: page.url(),
        viewport: page.viewportSize(),
        ...metadata
      }, null, 2)
    )
  }
}

// Retry helper for flaky operations
export async function retry<T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined
  
  for (let i = 0; i < maxAttempts; i++) {
    try {
      return await operation()
    } catch (error) {
      lastError = error as Error
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  throw lastError
}

// Performance measurement helper
export async function measurePerformance(page: Page): Promise<{
  fcp: number
  lcp: number
  ttfb: number
}> {
  return page.evaluate(async () => {
    // Wait for metrics to be available
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    
    return {
      fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
      lcp: (performance as Performance & { getEntriesByType: (type: 'largest-contentful-paint') => PerformanceEntry[] }).getEntriesByType('largest-contentful-paint')[0]?.startTime || 0,
      ttfb: navigation?.responseStart - navigation?.startTime || 0
    }
  })
}

// Hub navigation helper
export async function navigateThroughAllHubs(page: Page): Promise<{
  sator: boolean
  rotas: boolean
  arepo: boolean
  opera: boolean
}> {
  const results = {
    sator: false,
    rotas: false,
    arepo: false,
    opera: false
  }
  
  const hubs = [
    { name: 'sator', key: 'sator' as const },
    { name: 'rotas', key: 'rotas' as const },
    { name: 'arepo', key: 'arepo' as const },
    { name: 'opera', key: 'opera' as const }
  ]
  
  for (const hub of hubs) {
    try {
      await page.goto(`/${hub.name}`)
      await page.waitForLoadState('networkidle')
      const url = page.url()
      results[hub.key] = url.includes(hub.name)
    } catch (e) {
      results[hub.key] = false
    }
  }
  
  return results
}
