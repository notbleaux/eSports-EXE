/**
 * GEN-001: Fox Mascot Asset Generation Script
 * 
 * [Ver001.000]
 * 
 * Generates complete Fox mascot asset package:
 * - 5 SVG files (32x32, 64x64, 128x128, 256x256, 512x512)
 * - 1 CSS file with animations
 * - 2 React components (FoxMascotSVG.tsx, FoxCSS.tsx)
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import mascot generator modules
import { 
  FOX_MASCOT, 
  DEFAULT_OPTIONS,
  type MascotConfig,
  type GenerationOptions 
} from './mascot-generator/config.js';
import { SVGGenerator, generateReactComponent } from './mascot-generator/svg-generator.js';
import { CSSGenerator } from './mascot-generator/css-generator.js';
import { MascotCache } from './mascot-generator/cache.js';

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
  outputDir: path.join(__dirname, '..', 'public', 'mascots'),
  componentDir: path.join(__dirname, '..', 'src', 'components', 'mascots', 'generated'),
  sizes: [32, 64, 128, 256, 512],
  mascot: FOX_MASCOT,
  fineTuning: 'pixelPerfect' as const
};

// ============================================
// GENERATION FUNCTIONS
// ============================================

interface GenerationResult {
  file: string;
  size?: number;
  status: 'created' | 'cached' | 'error';
  error?: string;
}

async function generateSVGs(
  mascot: MascotConfig, 
  sizes: number[],
  outputDir: string,
  cache: MascotCache
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];
  const svgDir = path.join(outputDir, 'svg');
  
  if (!fs.existsSync(svgDir)) {
    fs.mkdirSync(svgDir, { recursive: true });
  }

  const options: GenerationOptions = {
    ...DEFAULT_OPTIONS,
    sizes,
    antiAlias: false,
    pixelScale: 1,
    showGrid: false,
    metadata: true
  };

  const generator = new SVGGenerator(mascot, options);

  for (const size of sizes) {
    const filename = `${mascot.name}-${size}x${size}.svg`;
    const filepath = path.join(svgDir, filename);

    try {
      // Check cache
      if (cache.has(mascot, { ...options, sizes: [size] })) {
        results.push({ file: filename, size, status: 'cached' });
        continue;
      }

      // Generate SVG
      const svg = generator.generate(size);
      fs.writeFileSync(filepath, svg, 'utf-8');
      
      results.push({ file: filename, size, status: 'created' });
      console.log(`  ✓ SVG ${size}x${size}`);
    } catch (error) {
      results.push({ 
        file: filename, 
        size, 
        status: 'error', 
        error: String(error) 
      });
      console.error(`  ✗ SVG ${size}x${size} failed:`, error);
    }
  }

  return results;
}

async function generateCSS(
  mascot: MascotConfig,
  outputDir: string,
  cache: MascotCache
): Promise<GenerationResult> {
  const cssDir = path.join(outputDir, 'css');
  
  if (!fs.existsSync(cssDir)) {
    fs.mkdirSync(cssDir, { recursive: true });
  }

  const filename = `${mascot.name}.css`;
  const filepath = path.join(cssDir, filename);

  const options: GenerationOptions = {
    ...DEFAULT_OPTIONS,
    sizes: [64],
    antiAlias: false,
    pixelScale: 2,
    showGrid: false
  };

  try {
    const generator = new CSSGenerator(mascot, options);
    const css = generator.generateCSSClass() + '\n' + generator.generateAnimations();
    
    fs.writeFileSync(filepath, css, 'utf-8');
    
    console.log(`  ✓ CSS ${filename}`);
    return { file: filename, status: 'created' };
  } catch (error) {
    console.error(`  ✗ CSS generation failed:`, error);
    return { file: filename, status: 'error', error: String(error) };
  }
}

async function generateComponents(
  mascot: MascotConfig,
  componentDir: string
): Promise<GenerationResult[]> {
  const results: GenerationResult[] = [];

  if (!fs.existsSync(componentDir)) {
    fs.mkdirSync(componentDir, { recursive: true });
  }

  // Generate SVG Component
  try {
    const svgComponentPath = path.join(componentDir, `${mascot.displayName}MascotSVG.tsx`);
    const svgComponent = generateReactComponent(mascot);
    fs.writeFileSync(svgComponentPath, svgComponent, 'utf-8');
    
    results.push({ 
      file: `${mascot.displayName}MascotSVG.tsx`, 
      status: 'created' 
    });
    console.log(`  ✓ Component: ${mascot.displayName}MascotSVG.tsx`);
  } catch (error) {
    results.push({ 
      file: `${mascot.displayName}MascotSVG.tsx`, 
      status: 'error',
      error: String(error)
    });
    console.error(`  ✗ SVG Component failed:`, error);
  }

  // Generate CSS Component
  try {
    const options: GenerationOptions = {
      ...DEFAULT_OPTIONS,
      sizes: [64],
      antiAlias: false,
      pixelScale: 2,
      showGrid: false
    };
    
    const cssGenerator = new CSSGenerator(mascot, options);
    const cssComponent = cssGenerator.generateReactComponent();
    const cssComponentPath = path.join(componentDir, `${mascot.displayName}CSS.tsx`);
    
    fs.writeFileSync(cssComponentPath, cssComponent, 'utf-8');
    
    results.push({ 
      file: `${mascot.displayName}CSS.tsx`, 
      status: 'created' 
    });
    console.log(`  ✓ Component: ${mascot.displayName}CSS.tsx`);
  } catch (error) {
    results.push({ 
      file: `${mascot.displayName}CSS.tsx`, 
      status: 'error',
      error: String(error)
    });
    console.error(`  ✗ CSS Component failed:`, error);
  }

  return results;
}

// ============================================
// VALIDATION FUNCTIONS
// ============================================

interface ValidationResult {
  check: string;
  passed: boolean;
  details?: string;
}

async function validateGeneratedFiles(
  mascot: MascotConfig,
  outputDir: string,
  componentDir: string
): Promise<ValidationResult[]> {
  const results: ValidationResult[] = [];

  // Validate SVG files
  for (const size of CONFIG.sizes) {
    const svgPath = path.join(outputDir, 'svg', `${mascot.name}-${size}x${size}.svg`);
    const exists = fs.existsSync(svgPath);
    const nonEmpty = exists && fs.statSync(svgPath).size > 0;
    
    let validViewBox = false;
    if (exists && nonEmpty) {
      const content = fs.readFileSync(svgPath, 'utf-8');
      validViewBox = content.includes(`viewBox="0 0 ${size} ${size}"`);
    }

    results.push({
      check: `SVG ${size}x${size} exists`,
      passed: exists,
      details: exists ? 'File found' : 'File not found'
    });
    results.push({
      check: `SVG ${size}x${size} non-empty`,
      passed: nonEmpty,
      details: nonEmpty ? `${fs.statSync(svgPath).size} bytes` : 'Empty file'
    });
    results.push({
      check: `SVG ${size}x${size} viewBox`,
      passed: validViewBox,
      details: validViewBox ? `Correct viewBox: 0 0 ${size} ${size}` : 'Invalid viewBox'
    });
  }

  // Validate CSS file
  const cssPath = path.join(outputDir, 'css', `${mascot.name}.css`);
  const cssExists = fs.existsSync(cssPath);
  const cssNonEmpty = cssExists && fs.statSync(cssPath).size > 0;
  let hasAnimations = false;
  
  if (cssExists && cssNonEmpty) {
    const content = fs.readFileSync(cssPath, 'utf-8');
    hasAnimations = content.includes('@keyframes');
  }

  results.push({
    check: 'CSS file exists',
    passed: cssExists,
    details: cssExists ? 'File found' : 'File not found'
  });
  results.push({
    check: 'CSS file non-empty',
    passed: cssNonEmpty,
    details: cssNonEmpty ? `${fs.statSync(cssPath).size} bytes` : 'Empty file'
  });
  results.push({
    check: 'CSS has animations',
    passed: hasAnimations,
    details: hasAnimations ? '@keyframes found' : 'No animations'
  });

  // Validate React components
  const svgComponentPath = path.join(componentDir, `${mascot.displayName}MascotSVG.tsx`);
  const cssComponentPath = path.join(componentDir, `${mascot.displayName}CSS.tsx`);

  results.push({
    check: 'FoxMascotSVG.tsx exists',
    passed: fs.existsSync(svgComponentPath),
    details: fs.existsSync(svgComponentPath) ? 'File found' : 'File not found'
  });
  results.push({
    check: 'FoxCSS.tsx exists',
    passed: fs.existsSync(cssComponentPath),
    details: fs.existsSync(cssComponentPath) ? 'File found' : 'File not found'
  });

  // Check if components have valid TypeScript
  if (fs.existsSync(svgComponentPath)) {
    const content = fs.readFileSync(svgComponentPath, 'utf-8');
    results.push({
      check: 'FoxMascotSVG.tsx has valid exports',
      passed: content.includes('export const FoxMascotSVG'),
      details: content.includes('export const FoxMascotSVG') ? 'Export found' : 'Export missing'
    });
  }

  if (fs.existsSync(cssComponentPath)) {
    const content = fs.readFileSync(cssComponentPath, 'utf-8');
    results.push({
      check: 'FoxCSS.tsx has valid exports',
      passed: content.includes('export const FoxCSS'),
      details: content.includes('export const FoxCSS') ? 'Export found' : 'Export missing'
    });
  }

  return results;
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main(): Promise<void> {
  console.log('🦊 GEN-001: Fox Mascot Asset Generation\n');
  console.log(`Fine-tuning: ${CONFIG.fineTuning}`);
  console.log(`Sizes: ${CONFIG.sizes.join(', ')}\n`);

  const cache = new MascotCache('.mascot-cache');
  const allResults: GenerationResult[] = [];

  // Step 1: Generate SVGs
  console.log('📁 Generating SVG files...');
  const svgResults = await generateSVGs(
    CONFIG.mascot, 
    CONFIG.sizes, 
    CONFIG.outputDir,
    cache
  );
  allResults.push(...svgResults);
  console.log('');

  // Step 2: Generate CSS
  console.log('🎨 Generating CSS file...');
  const cssResult = await generateCSS(CONFIG.mascot, CONFIG.outputDir, cache);
  allResults.push(cssResult);
  console.log('');

  // Step 3: Generate React Components
  console.log('⚛️  Generating React components...');
  const componentResults = await generateComponents(CONFIG.mascot, CONFIG.componentDir);
  allResults.push(...componentResults);
  console.log('');

  // Step 4: Validation
  console.log('🔍 Validating generated files...\n');
  const validationResults = await validateGeneratedFiles(
    CONFIG.mascot,
    CONFIG.outputDir,
    CONFIG.componentDir
  );

  // Print validation summary
  console.log('📊 Validation Results:');
  console.log('='.repeat(60));
  
  for (const result of validationResults) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.check}`);
    if (result.details) {
      console.log(`   ${result.details}`);
    }
  }

  // Print file summary
  console.log('\n📁 Files Created:');
  console.log('='.repeat(60));
  
  const createdFiles = allResults.filter(r => r.status === 'created');
  for (const result of createdFiles) {
    if (result.size) {
      const filepath = path.join(CONFIG.outputDir, 'svg', result.file);
      const sizeKB = fs.existsSync(filepath) 
        ? (fs.statSync(filepath).size / 1024).toFixed(2) 
        : '?';
      console.log(`  ${result.file} (${sizeKB} KB)`);
    } else {
      const dir = result.file.endsWith('.css') ? 'css' : '';
      const filepath = dir 
        ? path.join(CONFIG.outputDir, dir, result.file)
        : path.join(CONFIG.componentDir, result.file);
      const sizeKB = fs.existsSync(filepath) 
        ? (fs.statSync(filepath).size / 1024).toFixed(2) 
        : '?';
      console.log(`  ${result.file} (${sizeKB} KB)`);
    }
  }

  // Final status
  const totalChecks = validationResults.length;
  const passedChecks = validationResults.filter(r => r.passed).length;
  const allPassed = passedChecks === totalChecks;

  console.log('\n' + '='.repeat(60));
  console.log(`Status: ${allPassed ? '✅ COMPLETE' : '❌ INCOMPLETE'}`);
  console.log(`Validation: ${passedChecks}/${totalChecks} checks passed`);
  console.log(`Files created: ${createdFiles.length}`);
  console.log('='.repeat(60));

  // Update cache
  const generatedFiles = allResults
    .filter(r => r.status === 'created')
    .map(r => {
      if (r.size) {
        return path.join(CONFIG.outputDir, 'svg', r.file);
      } else if (r.file.endsWith('.css')) {
        return path.join(CONFIG.outputDir, 'css', r.file);
      } else {
        return path.join(CONFIG.componentDir, r.file);
      }
    });

  if (generatedFiles.length > 0) {
    cache.set(CONFIG.mascot, DEFAULT_OPTIONS, generatedFiles);
  }

  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
