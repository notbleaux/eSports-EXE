# Visual Regression Testing - Quick Reference

## One-Minute Setup

```bash
# 1. Install dependencies (if not already done)
npm install

# 2. Generate baseline images
npm run test:visual:update

# 3. Run visual tests
npm run test:visual
```

## Common Commands

### Run Tests
```bash
npm run test:visual                    # All tests
npm run test:visual:fox                # Fox only
npm run test:visual:bear               # Dropout Bear only
npm run test:visual:bunny              # NJ Bunny only
```

### Update Baselines
```bash
npm run test:visual:update             # Update all
npm run test:visual:baseline:generate  # Using script
npm run test:visual:baseline:generate -- --mascot=fox  # Update specific
```

### View Results
```bash
npm run test:visual:report             # Open HTML report
```

## Test File Structure

```
src/components/mascots/__tests__/
└── visual-regression.test.tsx    # Main test file

tests/visual/
├── baselines/                    # Reference images (commit these!)
├── results/                      # Test outputs (gitignored)
├── scripts/
│   └── generate-baselines.js   # Helper script
├── README.md                     # Full documentation
├── TEST_SUMMARY.md               # Detailed summary
└── QUICK_REFERENCE.md            # This file
```

## When Tests Fail

### 1. Check if intentional
```bash
# View the diff
open tests/visual/results/*/diff.png
```

### 2. If change is intentional, update baselines
```bash
npm run test:visual:update
```

### 3. If flaky, re-run
```bash
npm run test:visual -- --retries=2
```

## Adding a New Mascot

1. Edit `src/components/mascots/__tests__/visual-regression.test.tsx`
2. Add mascot to `MASCOT_TEST_MATRIX`:

```typescript
{
  id: 'new-mascot',
  name: 'New Mascot',
  style: 'dropout',  // or 'nj'
  variants: ['default'],
  colors: { primary: '#HEXCODE' },
  hasTransparency: true,
}
```

3. Generate baselines:
```bash
npm run test:visual:baseline:generate -- --mascot=new-mascot
```

4. Commit new baselines

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Tests fail on first run | Run `npm run test:visual:update` to create baselines |
| Different results on CI | Use `--retries=2` flag |
| Browser not found | Run `npx playwright install` |
| Permission denied | Use `cross-env` prefix for env vars |
| Baseline not found | Check path in `tests/visual/baselines/` |

## Environment Variables

```bash
UPDATE_VISUAL_BASELINES=1    # Force baseline update
PLAYWRIGHT_BASE_URL=url      # Custom base URL
CI=1                         # CI mode (no dev server reuse)
```

## CI/CD

Tests automatically run on:
- Push to `main` or `develop`
- PRs affecting mascot files
- Manual trigger with "Update baselines" option

## Need Help?

- Full docs: `tests/visual/README.md`
- Test matrix: `tests/visual/TEST_SUMMARY.md`
- Playwright docs: https://playwright.dev
