/**
 * PNG Mascot Generator - Option 2
 * 
 * [Ver001.000]
 * 
 * Generates pixel-perfect PNG files from SVG or procedural generation.
 * Requires Node.js canvas library (free, npm install canvas)
 */

import { MascotConfig, GenerationOptions } from './config.js';
import { SVGGenerator } from './svg-generator.js';

// Type definitions for canvas (will be dynamically imported)
interface CanvasContext {
  fillStyle: string;
  imageSmoothingEnabled: boolean;
  fillRect(x: number, y: number, w: number, h: number): void;
  drawImage(image: any, dx: number, dy: number, dw: number, dh: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
}

interface Canvas {
  width: number;
  height: number;
  getContext(type: '2d'): CanvasContext | null;
  toBuffer(format: 'image/png'): Buffer;
}

declare function createCanvas(width: number, height: number): Canvas;

export class PNGGenerator {
  private config: MascotConfig;
  private options: GenerationOptions;
  private canvas: typeof import('canvas') | null = null;

  constructor(config: MascotConfig, options: GenerationOptions) {
    this.config = config;
    this.options = options;
  }

  /**
   * Initialize canvas library (lazy load)
   */
  private async initCanvas(): Promise<void> {
    if (!this.canvas) {
      try {
        this.canvas = await import('canvas');
      } catch (error) {
        throw new Error(
          'Canvas library not found. Install with: npm install --save-dev canvas\n' +
          'Or use SVG-only mode by setting formats: ["svg"]'
        );
      }
    }
  }

  /**
   * Generate PNG buffer from mascot config
   */
  async generate(size: number): Promise<Buffer> {
    await this.initCanvas();
    if (!this.canvas) throw new Error('Canvas initialization failed');

    const canvas = this.canvas.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Disable anti-aliasing for pixel art
    ctx.imageSmoothingEnabled = this.options.antiAlias;

    // Clear background
    ctx.clearRect(0, 0, size, size);

    // Generate pixels procedurally
    const pixels = this.generatePixelData();
    const pixelSize = size / 32; // 32x32 grid

    // Draw each pixel
    pixels.forEach(pixel => {
      ctx.fillStyle = pixel.color;
      ctx.fillRect(
        pixel.x * pixelSize,
        pixel.y * pixelSize,
        pixelSize,
        pixelSize
      );
    });

    // Add grid if requested
    if (this.options.showGrid) {
      this.drawGrid(ctx, size, pixelSize);
    }

    return canvas.toBuffer('image/png');
  }

  /**
   * Generate PNG from existing SVG (rasterization)
   */
  async generateFromSVG(svgString: string, size: number): Promise<Buffer> {
    await this.initCanvas();
    if (!this.canvas) throw new Error('Canvas initialization failed');

    const canvas = this.canvas.createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not get canvas context');

    // Parse SVG and draw to canvas
    // This is a simplified version - full implementation would parse SVG elements
    const img = new (this.canvas as any).Image();
    img.src = Buffer.from(svgString);
    
    ctx.imageSmoothingEnabled = this.options.antiAlias;
    ctx.drawImage(img, 0, 0, size, size);

    return canvas.toBuffer('image/png');
  }

  /**
   * Generate pixel data procedurally (same logic as SVG)
   */
  private generatePixelData(): Array<{ x: number; y: number; color: string }> {
    const pixels: Array<{ x: number; y: number; color: string }> = [];
    const c = this.config.colors;
    const f = this.config.features;

    // Helper to add pixel
    const add = (x: number, y: number, color: string) => pixels.push({ x, y, color });

    // Ears
    const earHeight = f.earShape === 'pointed' ? 8 : 6;
    for (let y = 2; y < 2 + earHeight; y++) {
      const progress = (y - 2) / earHeight;
      const width = Math.max(1, 4 * (1 - progress));
      
      // Left ear
      for (let x = 12 - width; x <= 12 + width; x++) {
        add(Math.round(x), y, y < 4 ? c.dark : y < 6 ? c.primary : c.secondary);
      }
      
      // Right ear
      for (let x = 20 - width; x <= 20 + width; x++) {
        add(Math.round(x), y, y < 4 ? c.dark : y < 6 ? c.primary : c.secondary);
      }
    }

    // Head
    const startY = f.earShape === 'pointed' ? 8 : 6;
    for (let y = startY; y < 26; y++) {
      for (let x = 8; x < 24; x++) {
        const isEdge = x === 8 || x === 23 || y === startY || y === 25;
        const isTopCorner = y === startY && (x === 8 || x === 23);
        if (isTopCorner) continue;

        const color = isEdge ? c.outline : this.getGradientColor(x, y, c);
        add(x, y, color);
      }
    }

    // Eyes
    const eyeY = 14;
    const eyeSize = f.eyeSize === 'large' ? 3 : f.eyeSize === 'small' ? 1 : 2;
    
    // Left eye
    for (let dx = 0; dx < eyeSize; dx++) {
      for (let dy = 0; dy < eyeSize; dy++) {
        add(11 + dx, eyeY + dy, c.black);
      }
    }
    add(11 + eyeSize - 1, eyeY, c.white);

    // Right eye
    for (let dx = 0; dx < eyeSize; dx++) {
      for (let dy = 0; dy < eyeSize; dy++) {
        add(21 - eyeSize + dx, eyeY + dy, c.black);
      }
    }
    add(21, eyeY, c.white);

    // Snout
    const snoutY = f.snoutLength === 'long' ? 18 : f.snoutLength === 'short' ? 20 : 19;
    const snoutHeight = f.snoutLength === 'long' ? 6 : 4;
    for (let y = snoutY; y < snoutY + snoutHeight; y++) {
      for (let x = 12; x < 20; x++) {
        const isNose = y === snoutY + snoutHeight - 1 && x >= 14 && x < 18;
        add(x, y, isNose ? c.black : c.white);
      }
    }

    // Extras
    if (this.config.name === 'hawk' && 'gold' in c) {
      add(15, 22, c.gold as string);
      add(16, 22, c.gold as string);
    }

    if (this.config.name === 'wolf') {
      for (let x = 10; x < 22; x++) {
        add(x, 24, c.light);
      }
    }

    return pixels;
  }

  private getGradientColor(x: number, y: number, c: any): string {
    const distFromCenter = Math.abs(x - 16);
    if (distFromCenter < 4) return c.light;
    if (distFromCenter < 8) return c.primary;
    return c.secondary;
  }

  private drawGrid(ctx: CanvasContext, size: number, pixelSize: number): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    
    // Vertical lines
    for (let x = 0; x <= 32; x++) {
      ctx.fillRect(x * pixelSize, 0, 0.5, size);
    }
    
    // Horizontal lines
    for (let y = 0; y <= 32; y++) {
      ctx.fillRect(0, y * pixelSize, size, 0.5);
    }
  }

  /**
   * Generate multiple sizes at once
   */
  async generateAll(): Promise<Map<number, Buffer>> {
    const results = new Map<number, Buffer>();

    for (const size of this.options.sizes) {
      const buffer = await this.generate(size);
      results.set(size, buffer);
    }

    return results;
  }

  /**
   * Get file size estimate
   */
  estimateFileSize(size: number): number {
    // Rough estimate: 1KB base + 0.1KB per 1000 pixels
    const pixels = size * size;
    return 1024 + (pixels * 0.1);
  }
}

// ============================================
// SHARP OPTIMIZATION (OPTIONAL)
// ============================================

export async function optimizePNG(
  buffer: Buffer,
  level: 'none' | 'basic' | 'aggressive'
): Promise<Buffer> {
  if (level === 'none') return buffer;

  try {
    const sharp = await import('sharp');
    
    if (level === 'basic') {
      return sharp(buffer)
        .png({ palette: true, colors: 64 })
        .toBuffer();
    }

    if (level === 'aggressive') {
      return sharp(buffer)
        .png({ 
          palette: true, 
          colors: 16,
          compressionLevel: 9,
          adaptiveFiltering: true
        })
        .toBuffer();
    }
  } catch (error) {
    console.warn('Sharp not available, skipping optimization');
    return buffer;
  }

  return buffer;
}

// ============================================
// BATCH PROCESSING
// ============================================

export async function generateAllPNGs(
  configs: MascotConfig[],
  options: GenerationOptions,
  outputDir: string
): Promise<void> {
  const fs = await import('fs');
  const path = await import('path');

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  for (const config of configs) {
    console.log(`Generating PNGs for ${config.displayName}...`);
    
    const generator = new PNGGenerator(config, options);

    for (const size of options.sizes) {
      try {
        const buffer = await generator.generate(size);
        const optimized = await optimizePNG(buffer, options.optimization);
        
        const filename = `${config.name}-${size}x${size}.png`;
        const filepath = path.join(outputDir, filename);
        
        fs.writeFileSync(filepath, optimized);
        console.log(`  ✓ ${filename} (${(optimized.length / 1024).toFixed(1)}KB)`);
      } catch (error) {
        console.error(`  ✗ Failed to generate ${size}x${size}:`, error);
      }
    }
  }
}
