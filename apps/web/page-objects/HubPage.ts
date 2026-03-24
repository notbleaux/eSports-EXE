/**
 * Hub Page Object Model
 * Encapsulates hub page interactions for E2E tests
 * 
 * [Ver001.000]
 */

import { Page, Locator, expect } from '@playwright/test'

export class HubPage {
  readonly page: Page
  readonly hubName: string
  
  // Common elements
  readonly heading: Locator
  readonly navigation: Locator
  readonly content: Locator
  readonly loadingIndicator: Locator
  
  constructor(page: Page, hubName: string) {
    this.page = page
    this.hubName = hubName
    
    this.heading = page.locator('h1, h2').first()
    this.navigation = page.locator('nav, [role="navigation"]').first()
    this.content = page.locator('main, [role="main"], .hub-content').first()
    this.loadingIndicator = page.locator('[data-testid="loading"], .loading, .spinner').first()
  }
  
  async goto() {
    await this.page.goto(`/${this.hubName}`)
    await this.page.waitForLoadState('networkidle')
  }
  
  async expectHubLoaded() {
    // Verify URL
    await expect(this.page).toHaveURL(new RegExp(`.*${this.hubName}.*`, 'i'))
    
    // Verify content loaded
    await expect(this.content).toBeVisible()
  }
  
  async getTitle(): Promise<string> {
    return this.page.title()
  }
  
  async navigateToHub(targetHub: string) {
    const link = this.page.locator(`[data-hub="${targetHub}"], a[href="/${targetHub}"]`).first()
    
    if (await link.count() > 0) {
      await link.click()
      await this.page.waitForLoadState('networkidle')
    } else {
      await this.page.goto(`/${targetHub}`)
      await this.page.waitForLoadState('networkidle')
    }
  }
  
  async search(query: string) {
    const searchInput = this.page.locator('[data-testid="search-input"], input[type="search"]').first()
    
    if (await searchInput.count() > 0) {
      await searchInput.fill(query)
      await searchInput.press('Enter')
      await this.page.waitForTimeout(1000)
    }
  }
  
  async openMobileMenu() {
    const menuButton = this.page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]').first()
    
    if (await menuButton.count() > 0) {
      await menuButton.click()
      await this.page.waitForTimeout(500)
    }
  }
  
  async takeScreenshot(name: string) {
    await this.page.screenshot({ 
      path: `test-results/${this.hubName}-${name}.png`,
      fullPage: true 
    })
  }
  
  async isLoading(): Promise<boolean> {
    return await this.loadingIndicator.isVisible().catch(() => false)
  }
  
  async waitForLoadingComplete() {
    await this.loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 }).catch(() => {})
  }
}

export class SatorHubPage extends HubPage {
  readonly predictionPanel: Locator
  readonly analyticsChart: Locator
  readonly statsGrid: Locator
  
  constructor(page: Page) {
    super(page, 'sator')
    
    this.predictionPanel = page.locator('[data-testid="prediction-panel"], .prediction-panel').first()
    this.analyticsChart = page.locator('[data-testid="analytics-chart"], canvas, svg').first()
    this.statsGrid = page.locator('[data-testid="stats-grid"], .stats-grid').first()
  }
  
  async runPrediction() {
    const predictButton = this.page.locator('button:has-text("Predict"), [data-testid="predict"]').first()
    
    if (await predictButton.count() > 0) {
      await predictButton.click()
      await this.page.waitForTimeout(3000)
    }
  }
  
  async getStatsCount(): Promise<number> {
    return this.statsGrid.locator('> *').count()
  }
}

export class ArepoHubPage extends HubPage {
  readonly searchInput: Locator
  readonly playerList: Locator
  readonly filterPanel: Locator
  
  constructor(page: Page) {
    super(page, 'arepo')
    
    this.searchInput = page.locator('[data-testid="search-input"], input[type="search"]').first()
    this.playerList = page.locator('[data-testid="player-list"], .player-list, [role="list"]').first()
    this.filterPanel = page.locator('[data-testid="filters"], .filters').first()
  }
  
  async searchPlayers(query: string) {
    if (await this.searchInput.count() > 0) {
      await this.searchInput.fill(query)
      await this.searchInput.press('Enter')
      await this.page.waitForTimeout(1000)
    }
  }
  
  async applyFilter(filterName: string) {
    const filter = this.page.locator(`[data-filter="${filterName}"], button:has-text("${filterName}")`).first()
    
    if (await filter.count() > 0) {
      await filter.click()
      await this.page.waitForTimeout(500)
    }
  }
  
  async getPlayerCount(): Promise<number> {
    if (await this.playerList.count() > 0) {
      return this.playerList.locator('> *').count()
    }
    return 0
  }
}

export class OperaHubPage extends HubPage {
  readonly timeline: Locator
  readonly eventList: Locator
  
  constructor(page: Page) {
    super(page, 'opera')
    
    this.timeline = page.locator('[data-testid="timeline"], .timeline').first()
    this.eventList = page.locator('[data-testid="event-list"], .event-list').first()
  }
  
  async scrollToEvent(eventIndex: number) {
    const events = this.eventList.locator('> *')
    
    if (await events.count() > eventIndex) {
      await events.nth(eventIndex).scrollIntoViewIfNeeded()
    }
  }
}

export class RotasHubPage extends HubPage {
  readonly simulationPanel: Locator
  readonly controlPanel: Locator
  
  constructor(page: Page) {
    super(page, 'rotas')
    
    this.simulationPanel = page.locator('[data-testid="simulation"], .simulation-panel').first()
    this.controlPanel = page.locator('[data-testid="controls"], .control-panel').first()
  }
  
  async startSimulation() {
    const startButton = this.page.locator('button:has-text("Start"), button:has-text("Run"), [data-testid="start-sim"]').first()
    
    if (await startButton.count() > 0) {
      await startButton.click()
      await this.page.waitForTimeout(2000)
    }
  }
}
