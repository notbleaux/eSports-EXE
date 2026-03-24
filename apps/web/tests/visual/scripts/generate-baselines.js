#!/usr/bin/env node
/**
 * Baseline Image Generator
 * 
 * [Ver001.000]
 * 
 * Script to generate all baseline images for visual regression testing.
 * Run this when adding new mascots or updating existing ones.
 * 
 * Usage:
 *   node scripts/generate-baselines.js
 *   node scripts/generate-baselines.js --mascot=fox
 *   node scripts/generate-baselines.js --update-only
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
const options = {
  mascot: args.find(a => a.startsWith('--mascot='))?.split('=')[1],
  updateOnly: args.includes('--update-only'),
  dryRun: args.includes('--dry-run'),
  help: args.includes('--help') || args.includes('-h'),
};

// Show help
if (options.help) {
  console.log(`
Baseline Image Generator

Usage:
  node scripts/generate-baselines.js [options]

Options:
  --mascot=<name>    Generate only for specific mascot (fox, owl, wolf, hawk, dropout-bear, nj-bunny)
  --update-only      Only update missing baselines
  --dry-run          Show what would be done without executing
  --help, -h         Show this help message

Examples:
  node scripts/generate-baselines.js
  node scripts/generate-baselines.js --mascot=fox
  node scripts/generate-baselines.js --update-only
`);
  process.exit(0);
}

// Mascot test matrix
const MASCOT_MATRIX = [
  { id: 'fox', variants: ['default'] },
  { id: 'owl', variants: ['default'] },
  { id: 'wolf', variants: ['default'] },
  { id: 'hawk', variants: ['default'] },
  { 
    id: 'dropout-bear', 
    variants: ['homecoming', 'graduation', 'late-registration', 'yeezus', 'donda'] 
  },
  { 
    id: 'nj-bunny', 
    variants: ['classic-blue', 'attention', 'hype-boy', 'cookie', 'ditto'] 
  },
];

const ANIMATIONS = ['idle', 'wave', 'celebrate'];
const BASELINE_DIR = path.join(__dirname, '..', 'baselines');

// Filter mascots if specified
const mascotsToProcess = options.mascot 
  ? MASCOT_MATRIX.filter(m => m.id === options.mascot)
  : MASCOT_MATRIX;

if (options.mascot && mascotsToProcess.length === 0) {
  console.error(`Error: Unknown mascot "${options.mascot}"`);
  console.error(`Available: ${MASCOT_MATRIX.map(m => m.id).join(', ')}`);
  process.exit(1);
}

// Generate baseline filenames
function getBaselineFilenames(mascot, variant) {
  return ANIMATIONS.map(animation => {
    const parts = [mascot];
    if (variant !== 'default') parts.push(variant);
    parts.push(animation);
    return `${parts.join('-')}.png`;
  });
}

// Calculate expected baselines
const expectedBaselines = [];
for (const mascot of mascotsToProcess) {
  for (const variant of mascot.variants) {
    expectedBaselines.push(...getBaselineFilenames(mascot.id, variant));
  }
}

// Check existing baselines
const existingBaselines = fs.existsSync(BASELINE_DIR)
  ? fs.readdirSync(BASELINE_DIR).filter(f => f.endsWith('.png'))
  : [];

// Determine which baselines to generate
const baselinesToGenerate = options.updateOnly
  ? expectedBaselines.filter(f => !existingBaselines.includes(f))
  : expectedBaselines;

// Summary
console.log('============================================');
console.log('Visual Regression Baseline Generator');
console.log('============================================');
console.log();
console.log(`Mascots: ${mascotsToProcess.length}`);
console.log(`Expected baselines: ${expectedBaselines.length}`);
console.log(`Existing baselines: ${existingBaselines.length}`);
console.log(`To generate: ${baselinesToGenerate.length}`);
console.log();

if (baselinesToGenerate.length === 0) {
  console.log('✅ All baselines are up to date!');
  process.exit(0);
}

console.log('Baselines to generate:');
for (const file of baselinesToGenerate) {
  const exists = existingBaselines.includes(file);
  console.log(`  ${exists ? '🔄' : '➕'} ${file}`);
}
console.log();

if (options.dryRun) {
  console.log('(Dry run - no changes made)');
  process.exit(0);
}

// Run Playwright to generate baselines
console.log('Running Playwright to generate baselines...');
console.log();

try {
  const command = [
    'npx playwright test',
    '--config=playwright-visual.config.ts',
    '--project=chromium',
    '-g "Update all baselines"',
    'UPDATE_VISUAL_BASELINES=1',
  ].join(' ');

  console.log(`> ${command}`);
  console.log();

  execSync(command, {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..', '..'),
    env: { ...process.env, UPDATE_VISUAL_BASELINES: '1' },
  });

  console.log();
  console.log('============================================');
  console.log('✅ Baseline generation complete!');
  console.log('============================================');
  console.log();
  console.log(`Generated: ${baselinesToGenerate.length} images`);
  console.log(`Location: ${BASELINE_DIR}`);
  console.log();
  console.log('Next steps:');
  console.log('  1. Review the generated baselines');
  console.log('  2. Run: npm run test:visual');
  console.log('  3. Commit the new baselines');

} catch (error) {
  console.error();
  console.error('❌ Baseline generation failed!');
  console.error(error.message);
  process.exit(1);
}
