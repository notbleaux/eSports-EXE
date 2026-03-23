# Visual Regression Testing

[Ver001.000]

## Overview

Visual regression testing for all 14 mascot variants across 2 styles (Dropout and NJ).

## Test Coverage

| Mascot | Style | Variants | States | Total Tests |
|--------|-------|----------|--------|-------------|
| Fox | Dropout | 1 | 3 | 3 |
| Owl | Dropout | 1 | 3 | 3 |
| Wolf | Dropout | 1 | 3 | 3 |
| Hawk | Dropout | 1 | 3 | 3 |
| Dropout Bear | NJ | 5 | 3 | 15 |
| NJ Bunny | NJ | 5 | 3 | 15 |
| **Total** | | **14** | | **42** |

## Directory Structure

```
tests/visual/
├── README.md              # This file
├── baselines/             # Reference screenshots
│   ├── fox-default-idle.png
│   ├── fox-default-wave.png
│   ├── fox-default-celebrate.png
│   └── ...
└── results/               # Test outputs and diffs
    ├── {test-id}/
    │   ├── actual.png
    │   ├── expected.png
    │   └── diff.png
    └── ...
```

## Running Tests

### Run All Visual Tests

```bash
npx playwright test --config=playwright-visual.config.ts
```

### Run Specific Mascot Tests

```bash
# Test only Dropout Bear variants
npx playwright test --config=playwright-visual.config.ts -g "Dropout Bear"

# Test only NJ Bunny variants
npx playwright test --config=playwright-visual.config.ts -g "NJ Bunny"
```

### Run Tests in Specific Browser

```bash
# Chromium only
npx playwright test --config=playwright-visual.config.ts --project=chromium

# Firefox only
npx playwright test --config=playwright-visual.config.ts --project=firefox
```

### Update Baselines

```bash
# Update all baseline images
UPDATE_VISUAL_BASELINES=1 npx playwright test --config=playwright-visual.config.ts -g "Update all baselines"

# Or use the helper script
npm run test:visual:update
```

## Test Configuration

### Screenshot Settings

- **Size**: 128px × 128px
- **Threshold**: 0.1% pixel difference
- **Max Diff Ratio**: 0.001 (0.1%)
- **Format**: PNG

### Animation States

1. **Idle**: Continuous bounce animation
2. **Wave**: 3-cycle rotation animation
3. **Celebrate**: Scale and rotation celebration

### Viewports Tested

- Mobile: 375×667
- Tablet: 768×1024
- Desktop: 1920×1080

## Success Criteria

- ✅ All 14 mascot variants have baseline images
- ✅ All 3 animation states captured
- ✅ 0 visual regressions (>0.1% threshold)
- ✅ Responsive scaling verified
- ✅ No visual artifacts

## Adding New Mascots

1. Add mascot to `MASCOT_TEST_MATRIX` in `visual-regression.test.tsx`
2. Define colors and variants
3. Run `npm run test:visual:update` to create baselines
4. Review and commit new baseline images

## Troubleshooting

### Tests Failing Due to Minor Differences

If tests fail due to acceptable minor differences (e.g., anti-aliasing):

1. Check the diff images in `tests/visual/results/`
2. If acceptable, update baselines with `UPDATE_VISUAL_BASELINES=1`
3. If not, adjust threshold in config

### Baseline Mismatches Across Browsers

Browsers render slightly differently. We primarily test on Chromium for consistency.

### CI Failures

Visual tests may fail in CI due to:
- Different OS/font rendering
- GPU acceleration differences
- Timing variations

Use `retries: 2` in CI to handle flaky tests.

## Related Files

- Test file: `src/components/mascots/__tests__/visual-regression.test.tsx`
- Config: `playwright-visual.config.ts`
- Baselines: `tests/visual/baselines/`
