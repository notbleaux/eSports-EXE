/**
 * Mascot Generator - 3-Option Pipeline
 * 
 * [Ver001.000]
 * 
 * Usage:
 *   npx ts-node scripts/mascot-generator/index.ts
 * 
 * Options:
 *   --fox, --owl, --wolf, --hawk  Generate specific mascot only
 *   --svg                         SVG only
 *   --png                         PNG only (requires canvas)
 *   --css                         CSS only
 *   --tune=preset                 Use fine-tuning preset
 *   --out=dir                     Output directory
 */

export { MascotPipeline, PRESETS, runCLI } from './pipeline';
export { SVGGenerator, generateReactComponent } from './svg-generator';
export { PNGGenerator, optimizePNG } from './png-generator';
export { CSSGenerator } from './css-generator';
export { 
  FOX_MASCOT, 
  OWL_MASCOT, 
  WOLF_MASCOT, 
  HAWK_MASCOT,
  ALL_MASCOTS,
  DEFAULT_OPTIONS,
  ICON_OPTIONS,
  HERO_OPTIONS,
  CSS_ONLY_OPTIONS,
  FINE_TUNING
} from './config';

export type { 
  MascotConfig, 
  GenerationOptions, 
  ColorPalette 
} from './config';

// Default export for programmatic usage
import { MascotPipeline, PRESETS } from './pipeline.js';
export default MascotPipeline;
export { PRESETS };

// Auto-run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const pipeline = PRESETS.web();
  pipeline.run().catch(console.error);
}
