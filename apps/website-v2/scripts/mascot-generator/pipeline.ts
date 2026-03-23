/**
 * Integrated Mascot Generation Pipeline
 * 
 * [Ver001.000]
 * 
 * Combines 3 options with fine-tuning capabilities:
 * - Option 1: SVG (scalable, immediate)
 * - Option 2: Canvas/PNG (pixel-perfect)
 * - Option 3: CSS (zero-dependency)
 */

import * as fs from 'fs';
import * as path from 'path';
import { 
  MascotConfig, 
  GenerationOptions, 
  ALL_MASCOTS, 
  DEFAULT_OPTIONS,
  FINE_TUNING 
} from './config';
import { SVGGenerator, generateReactComponent } from './svg-generator';
import { PNGGenerator, optimizePNG, generateAllPNGs } from './png-generator';
import { CSSGenerator, generateAllCSS } from './css-generator';

// ============================================
// PIPELINE CONFIGURATION
// ============================================

interface PipelineConfig {
  /** Output directory for assets */
  outputDir: string;
  
  /** Component output directory */
  componentDir: string;
  
  /** Which options to run */
  enabledOptions: ('svg' | 'png' | 'css')[];
  
  /** Fine-tuning preset or custom */
  fineTuning: keyof typeof FINE_TUNING | Partial<GenerationOptions>;
  
  /** Whether to generate React components */
  generateComponents: boolean;
  
  /** Whether to watch for changes */
  watch: boolean;
}

const DEFAULT_PIPELINE_CONFIG: PipelineConfig = {
  outputDir: 'public/mascots',
  componentDir: 'src/components/mascots/generated',
  enabledOptions: ['svg', 'png', 'css'],
  fineTuning: 'pixelPerfect',
  generateComponents: true,
  watch: false
};

// ============================================
// MAIN PIPELINE CLASS
// ============================================

export class MascotPipeline {
  private config: PipelineConfig;
  private options: GenerationOptions;

  constructor(config: Partial<PipelineConfig> = {}) {
    this.config = { ...DEFAULT_PIPELINE_CONFIG, ...config };
    this.options = this.resolveFineTuning(this.config.fineTuning);
  }

  /**
   * Resolve fine-tuning preset to options
   */
  private resolveFineTuning(
    tuning: PipelineConfig['fineTuning']
  ): GenerationOptions {
    if (typeof tuning === 'string') {
      return {
        ...DEFAULT_OPTIONS,
        ...FINE_TUNING[tuning]
      };
    }
    return {
      ...DEFAULT_OPTIONS,
      ...tuning
    };
  }

  /**
   * Run complete pipeline for all mascots
   */
  async run(): Promise<void> {
    console.log('🎨 Mascot Generation Pipeline\n');
    console.log(`Fine-tuning: ${JSON.stringify(this.config.fineTuning)}`);
    console.log(`Options: ${this.config.enabledOptions.join(', ')}\n`);

    this.ensureDirectories();

    for (const mascot of ALL_MASCOTS) {
      console.log(`Processing ${mascot.displayName}...`);
      
      if (this.config.enabledOptions.includes('svg')) {
        await this.generateSVG(mascot);
      }
      
      if (this.config.enabledOptions.includes('png')) {
        await this.generatePNG(mascot);
      }
      
      if (this.config.enabledOptions.includes('css')) {
        await this.generateCSS(mascot);
      }
      
      if (this.config.generateComponents) {
        await this.generateComponents(mascot);
      }
      
      console.log('');
    }

    if (this.config.enabledOptions.includes('css')) {
      await this.generateCSSBundle();
    }

    console.log('✅ Pipeline complete!');
    this.printSummary();
  }

  /**
   * Generate SVG assets
   */
  private async generateSVG(mascot: MascotConfig): Promise<void> {
    const generator = new SVGGenerator(mascot, this.options);
    const outDir = path.join(this.config.outputDir, 'svg');
    fs.mkdirSync(outDir, { recursive: true });

    for (const size of this.options.sizes) {
      const svg = generator.generate(size);
      const filename = `${mascot.name}-${size}x${size}.svg`;
      fs.writeFileSync(path.join(outDir, filename), svg);
      console.log(`  ✓ SVG ${size}x${size}`);
    }
  }

  /**
   * Generate PNG assets
   */
  private async generatePNG(mascot: MascotConfig): Promise<void> {
    const outDir = path.join(this.config.outputDir, 'png');
    fs.mkdirSync(outDir, { recursive: true });

    try {
      const generator = new PNGGenerator(mascot, this.options);
      
      for (const size of this.options.sizes) {
        const buffer = await generator.generate(size);
        const optimized = await optimizePNG(buffer, this.options.optimization);
        const filename = `${mascot.name}-${size}x${size}.png`;
        fs.writeFileSync(path.join(outDir, filename), optimized);
        console.log(`  ✓ PNG ${size}x${size} (${(optimized.length / 1024).toFixed(1)}KB)`);
      }
    } catch (error) {
      console.log(`  ⚠ PNG generation skipped (canvas not installed)`);
      console.log(`    Run: npm install --save-dev canvas`);
    }
  }

  /**
   * Generate CSS assets
   */
  private async generateCSS(mascot: MascotConfig): Promise<void> {
    const generator = new CSSGenerator(mascot, this.options);
    const outDir = path.join(this.config.outputDir, 'css');
    fs.mkdirSync(outDir, { recursive: true });

    const css = generator.generateCSSClass() + generator.generateAnimations();
    const filename = `${mascot.name}.css`;
    fs.writeFileSync(path.join(outDir, filename), css);
    console.log(`  ✓ CSS ${filename}`);
  }

  /**
   * Generate React components
   */
  private async generateComponents(mascot: MascotConfig): Promise<void> {
    fs.mkdirSync(this.config.componentDir, { recursive: true });

    // SVG Component
    const svgComponent = generateReactComponent(mascot);
    fs.writeFileSync(
      path.join(this.config.componentDir, `${mascot.displayName}MascotSVG.tsx`),
      svgComponent
    );

    // CSS Component
    const cssGenerator = new CSSGenerator(mascot, this.options);
    const cssComponent = cssGenerator.generateReactComponent();
    fs.writeFileSync(
      path.join(this.config.componentDir, `${mascot.displayName}CSS.tsx`),
      cssComponent
    );

    console.log(`  ✓ Components generated`);
  }

  /**
   * Generate CSS bundle
   */
  private async generateCSSBundle(): Promise<void> {
    const bundle = generateAllCSS(ALL_MASCOTS, this.options);
    fs.writeFileSync(
      path.join(this.config.outputDir, 'mascots.css'),
      bundle
    );
    console.log('✓ CSS bundle generated');
  }

  /**
   * Ensure output directories exist
   */
  private ensureDirectories(): void {
    [this.config.outputDir, this.config.componentDir].forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  /**
   * Print generation summary
   */
  private printSummary(): void {
    const totalMascots = ALL_MASCOTS.length;
    const totalSizes = this.options.sizes.length;
    const totalFormats = this.config.enabledOptions.length;
    
    console.log('\n📊 Summary:');
    console.log(`  Mascots: ${totalMascots}`);
    console.log(`  Sizes: ${totalSizes} (${this.options.sizes.join(', ')})`);
    console.log(`  Formats: ${totalFormats} (${this.config.enabledOptions.join(', ')})`);
    console.log(`  Total files: ~${totalMascots * totalSizes * totalFormats}`);
    console.log(`\n📁 Output: ${this.config.outputDir}`);
  }

  /**
   * Update fine-tuning and regenerate
   */
  async retune(tuning: PipelineConfig['fineTuning']): Promise<void> {
    this.config.fineTuning = tuning;
    this.options = this.resolveFineTuning(tuning);
    console.log(`\n🔄 Retuning with: ${JSON.stringify(tuning)}\n`);
    await this.run();
  }
}

// ============================================
// CLI INTERFACE
// ============================================

interface CLIOptions {
  mascot?: string;
  sizes?: number[];
  formats?: ('svg' | 'png' | 'css')[];
  tuning?: string;
  outDir?: string;
}

export async function runCLI(options: CLIOptions = {}): Promise<void> {
  const pipeline = new MascotPipeline({
    outputDir: options.outDir || 'public/mascots',
    enabledOptions: options.formats || ['svg', 'png', 'css'],
    fineTuning: (options.tuning as any) || 'pixelPerfect',
    generateComponents: true,
    watch: false
  });

  // Filter mascots if specified
  if (options.mascot) {
    const filtered = ALL_MASCOTS.filter(m => 
      m.name === options.mascot || 
      m.displayName.toLowerCase() === options.mascot?.toLowerCase()
    );
    
    if (filtered.length === 0) {
      console.error(`Unknown mascot: ${options.mascot}`);
      console.log(`Available: ${ALL_MASCOTS.map(m => m.name).join(', ')}`);
      return;
    }
  }

  await pipeline.run();
}

// ============================================
// PRESET PIPELINES
// ============================================

export const PRESETS = {
  /** Quick SVG generation only */
  quick: () => new MascotPipeline({
    enabledOptions: ['svg'],
    fineTuning: 'minimal',
    generateComponents: true
  }),

  /** Pixel-perfect for games */
  pixelArt: () => new MascotPipeline({
    enabledOptions: ['png', 'css'],
    fineTuning: 'pixelPerfect',
    generateComponents: false
  }),

  /** Web-ready with all formats */
  web: () => new MascotPipeline({
    enabledOptions: ['svg', 'png', 'css'],
    fineTuning: 'smooth',
    generateComponents: true
  }),

  /** Maximum compatibility */
  universal: () => new MascotPipeline({
    enabledOptions: ['svg', 'png', 'css'],
    fineTuning: 'compatible',
    generateComponents: true
  }),

  /** Animation-ready */
  animated: () => new MascotPipeline({
    enabledOptions: ['svg', 'css'],
    fineTuning: 'animated',
    generateComponents: true
  })
};

// ============================================
// MAIN EXECUTION
// ============================================

if (require.main === module) {
  // CLI execution
  const args = process.argv.slice(2);
  
  const options: CLIOptions = {
    mascot: args.find(a => !a.startsWith('--')) || undefined,
    formats: args.includes('--svg') ? ['svg'] : 
             args.includes('--png') ? ['png'] :
             args.includes('--css') ? ['css'] :
             ['svg', 'png', 'css'],
    tuning: args.find(a => a.startsWith('--tune='))?.split('=')[1],
    outDir: args.find(a => a.startsWith('--out='))?.split('=')[1]
  };

  runCLI(options).catch(console.error);
}
