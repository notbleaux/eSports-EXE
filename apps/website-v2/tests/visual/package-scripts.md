# NPM Scripts for Visual Testing

Add these scripts to `package.json`:

```json
{
  "scripts": {
    "test:visual": "playwright test --config=playwright-visual.config.ts",
    "test:visual:update": "UPDATE_VISUAL_BASELINES=1 playwright test --config=playwright-visual.config.ts -g 'Update all baselines'",
    "test:visual:report": "playwright show-report playwright-report/visual",
    "test:visual:fox": "playwright test --config=playwright-visual.config.ts -g 'Fox'",
    "test:visual:bear": "playwright test --config=playwright-visual.config.ts -g 'Dropout Bear'",
    "test:visual:bunny": "playwright test --config=playwright-visual.config.ts -g 'NJ Bunny'",
    "test:visual:ci": "playwright test --config=playwright-visual.config.ts --reporter=list,html"
  }
}
```

## Usage Examples

```bash
# Run all visual tests
npm run test:visual

# Update baseline images after intentional changes
npm run test:visual:update

# View HTML report
npm run test:visual:report

# Test specific mascots
npm run test:visual:fox
npm run test:visual:bear
npm run test:visual:bunny

# CI mode (no dev server reuse)
CI=1 npm run test:visual:ci
```
