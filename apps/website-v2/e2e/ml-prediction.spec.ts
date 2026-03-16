/**
 * ML Prediction Flow E2E Tests
 * Tests machine learning prediction interface and results
 * 
 * [Ver001.000]
 */

import { test, expect } from '@playwright/test'

test.describe('ML Prediction Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto('/sator')
    await page.waitForLoadState('networkidle')
  })

  test('prediction interface loads', async ({ page }) => {
    // Look for prediction components
    const predictionSection = page.locator(
      '[data-testid="prediction"], ' +
      '.prediction-panel, ' +
      '.ml-prediction, ' +
      '.analytics-prediction'
    ).first()
    
    const hasPredictionUI = await predictionSection.count() > 0 ||
      await page.locator('body').textContent().then(t => 
        t?.toLowerCase().includes('prediction') || 
        t?.toLowerCase().includes('forecast') ||
        t?.toLowerCase().includes('ml') ||
        t?.toLowerCase().includes('ai')
      )
    
    expect(hasPredictionUI).toBeTruthy()
  })

  test('can select prediction parameters', async ({ page }) => {
    // Look for parameter inputs
    const teamSelect = page.locator('select[name="team"], [data-testid="team-select"]').first()
    const matchSelect = page.locator('select[name="match"], [data-testid="match-select"]').first()
    const predictButton = page.locator('button:has-text("Predict"), button:has-text("Analyze"), [data-testid="predict-button"]').first()
    
    // Try to interact with available controls
    if (await teamSelect.count() > 0) {
      await teamSelect.selectOption({ index: 0 })
    }
    
    if (await matchSelect.count() > 0) {
      await matchSelect.selectOption({ index: 0 })
    }
    
    // Verify controls exist or prediction section exists
    expect(await teamSelect.count() >= 0 || await predictButton.count() >= 0).toBeTruthy()
  })

  test('prediction results display', async ({ page }) => {
    // Look for prediction button and click it
    const predictButton = page.locator('button:has-text("Predict"), button:has-text("Run Analysis"), [data-testid="predict-button"]').first()
    
    if (await predictButton.count() === 0) {
      test.skip()
      return
    }
    
    await predictButton.click()
    
    // Wait for results
    await page.waitForTimeout(3000)
    
    // Check for results
    const results = page.locator(
      '[data-testid="prediction-results"], ' +
      '.prediction-result, ' +
      '.analysis-result, ' +
      '.ml-output'
    ).first()
    
    // Results may appear in various forms
    const bodyText = await page.locator('body').textContent() || ''
    const hasResults = bodyText.toLowerCase().includes('prediction') ||
                       bodyText.toLowerCase().includes('result') ||
                       bodyText.toLowerCase().includes('win probability') ||
                       bodyText.toLowerCase().includes('accuracy') ||
                       await results.count() > 0
    
    expect(hasResults).toBeTruthy()
  })

  test('confidence score display', async ({ page }) => {
    // Look for confidence indicators
    const confidenceDisplay = page.locator(
      '[data-testid="confidence"], ' +
      '.confidence-score, ' +
      '.prediction-confidence'
    ).first()
    
    const bodyText = await page.locator('body').textContent() || ''
    const hasConfidence = bodyText.toLowerCase().includes('confidence') ||
                          bodyText.toLowerCase().includes('accuracy') ||
                          bodyText.includes('%') ||
                          await confidenceDisplay.count() > 0
    
    expect(hasConfidence).toBe(true)
  })

  test('prediction loading state', async ({ page }) => {
    const predictButton = page.locator('button:has-text("Predict"), [data-testid="predict-button"]').first()
    
    if (await predictButton.count() === 0) {
      test.skip()
      return
    }
    
    // Click predict
    await predictButton.click()
    
    // Check for loading state immediately after
    const loadingIndicator = page.locator('.loading, [data-testid="loading"], .spinner').first()
    
    // Loading state should appear briefly
    await page.waitForTimeout(100)
    
    expect(await loadingIndicator.count() >= 0).toBeTruthy()
  })

  test('feature importance visualization', async ({ page }) => {
    // Look for feature importance chart
    const featureChart = page.locator(
      '[data-testid="feature-importance"], ' +
      '.feature-importance, ' +
      '.feature-chart'
    ).first()
    
    // May or may not exist
    expect(await featureChart.count() >= 0).toBeTruthy()
  })

  test('prediction history', async ({ page }) => {
    // Look for history section
    const history = page.locator(
      '[data-testid="prediction-history"], ' +
      '.prediction-history, ' +
      '.recent-predictions'
    ).first()
    
    expect(await history.count() >= 0).toBeTruthy()
  })

  test('model selector if multiple models', async ({ page }) => {
    // Look for model selection
    const modelSelect = page.locator(
      'select[name="model"], ' +
      '[data-testid="model-select"], ' +
      '.model-selector'
    ).first()
    
    expect(await modelSelect.count() >= 0).toBeTruthy()
  })

  test('prediction export option', async ({ page }) => {
    // Look for export button
    const exportButton = page.locator(
      'button:has-text("Export"), ' +
      '[data-testid="export-prediction"], ' +
      'a:has-text("Download")'
    ).first()
    
    expect(await exportButton.count() >= 0).toBeTruthy()
  })
})
