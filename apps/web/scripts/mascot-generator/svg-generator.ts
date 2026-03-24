/**
 * SVG Mascot Generator - Option 1
 * 
 * [Ver001.000]
 * 
 * Generates scalable vector mascots from configuration.
 * Primary output format - works immediately in browsers.
 */

import { MascotConfig, GenerationOptions, ColorPalette } from './config.js';

interface Pixel {
  x: number;
  y: number;
  color: string;
}

interface MascotParts {
  ears: Pixel[];
  head: Pixel[];
  face: Pixel[];
  eyes: Pixel[];
  snout: Pixel[];
  extras: Pixel[];
}

export class SVGGenerator {
  private config: MascotConfig;
  private options: GenerationOptions;
  private gridSize = 32;

  constructor(config: MascotConfig, options: GenerationOptions) {
    this.config = config;
    this.options = options;
  }

  /**
   * Generate complete SVG string
   */
  generate(size: number = 64): string {
    const parts = this.generateParts();
    const allPixels = [
      ...parts.ears,
      ...parts.head,
      ...parts.face,
      ...parts.eyes,
      ...parts.snout,
      ...parts.extras
    ];

    const pixelSize = size / this.gridSize;
    const svgParts = allPixels.map(p => this.pixelToRect(p, pixelSize));

    const defs = this.generateDefs();
    const metadata = this.options.metadata ? this.generateMetadata() : '';

    return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" 
     viewBox="0 0 ${size} ${size}" 
     width="${size}" 
     height="${size}"
     shape-rendering="${this.options.antiAlias ? 'auto' : 'crispEdges'}"
     style="image-rendering: pixelated">
  <title>${this.config.displayName} Mascot</title>
  <desc>${this.config.personality}</desc>
  ${metadata}
  ${defs}
  <g id="mascot-${this.config.name}">
    ${svgParts.join('\n    ')}
  </g>
  ${this.options.showGrid ? this.generateGrid(size, pixelSize) : ''}
</svg>`;
  }

  /**
   * Generate mascot body parts as pixel arrays
   */
  private generateParts(): MascotParts {
    const c = this.config.colors;
    const f = this.config.features;

    return {
      ears: this.generateEars(c, f),
      head: this.generateHead(c, f),
      face: this.generateFace(c, f),
      eyes: this.generateEyes(c, f),
      snout: this.generateSnout(c, f),
      extras: this.generateExtras(c, f)
    };
  }

  private generateEars(c: ColorPalette, f: MascotConfig['features']): Pixel[] {
    const pixels: Pixel[] = [];
    const earHeight = f.earShape === 'pointed' ? 8 : 6;
    const earWidth = f.earShape === 'rounded' ? 6 : 4;

    // Left ear
    for (let y = 2; y < 2 + earHeight; y++) {
      const progress = (y - 2) / earHeight;
      const width = Math.max(1, earWidth * (1 - progress));
      const centerX = 12;
      
      for (let x = centerX - width; x <= centerX + width; x++) {
        const color = y < 4 ? c.dark : y < 6 ? c.primary : c.secondary;
        pixels.push({ x: Math.round(x), y, color });
      }
    }

    // Right ear
    for (let y = 2; y < 2 + earHeight; y++) {
      const progress = (y - 2) / earHeight;
      const width = Math.max(1, earWidth * (1 - progress));
      const centerX = 20;
      
      for (let x = centerX - width; x <= centerX + width; x++) {
        const color = y < 4 ? c.dark : y < 6 ? c.primary : c.secondary;
        pixels.push({ x: Math.round(x), y, color });
      }
    }

    return pixels;
  }

  private generateHead(c: ColorPalette, f: MascotConfig['features']): Pixel[] {
    const pixels: Pixel[] = [];
    const startY = f.earShape === 'pointed' ? 8 : 6;
    const endY = 26;
    const startX = 8;
    const endX = 24;

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        // Determine if edge (outline)
        const isEdge = x === startX || x === endX - 1 || y === startY || y === endY - 1;
        
        // Slight rounding for top corners
        const isTopCorner = y === startY && (x === startX || x === endX - 1);
        if (isTopCorner) continue;

        const color = isEdge ? c.outline : this.getHeadGradient(x, y, c);
        pixels.push({ x, y, color });
      }
    }

    return pixels;
  }

  private getHeadGradient(x: number, y: number, c: ColorPalette): string {
    // Simple lighting effect
    const centerX = 16;
    const distFromCenter = Math.abs(x - centerX);
    
    if (distFromCenter < 4) return c.light;
    if (distFromCenter < 8) return c.primary;
    return c.secondary;
  }

  private generateEyes(c: ColorPalette, f: MascotConfig['features']): Pixel[] {
    const pixels: Pixel[] = [];
    const eyeY = 14;
    const eyeSize = f.eyeSize === 'large' ? 3 : f.eyeSize === 'small' ? 1 : 2;
    
    // Left eye
    for (let dx = 0; dx < eyeSize; dx++) {
      for (let dy = 0; dy < eyeSize; dy++) {
        pixels.push({ x: 11 + dx, y: eyeY + dy, color: c.black });
      }
    }
    // Highlight
    pixels.push({ x: 11 + eyeSize - 1, y: eyeY, color: c.white });

    // Right eye
    for (let dx = 0; dx < eyeSize; dx++) {
      for (let dy = 0; dy < eyeSize; dy++) {
        pixels.push({ x: 21 - eyeSize + dx, y: eyeY + dy, color: c.black });
      }
    }
    // Highlight
    pixels.push({ x: 21, y: eyeY, color: c.white });

    return pixels;
  }

  private generateSnout(c: ColorPalette, f: MascotConfig['features']): Pixel[] {
    const pixels: Pixel[] = [];
    const snoutY = f.snoutLength === 'long' ? 18 : f.snoutLength === 'short' ? 20 : 19;
    const snoutWidth = 8;
    const snoutHeight = f.snoutLength === 'long' ? 6 : 4;
    const startX = 12;

    for (let y = snoutY; y < snoutY + snoutHeight; y++) {
      for (let x = startX; x < startX + snoutWidth; x++) {
        const isNose = y === snoutY + snoutHeight - 1 && x >= startX + 2 && x < startX + 6;
        const color = isNose ? c.black : c.white;
        pixels.push({ x, y, color });
      }
    }

    return pixels;
  }

  private generateFace(c: ColorPalette, f: MascotConfig['features']): Pixel[] {
    const pixels: Pixel[] = [];
    
    // Cheeks (cute factor)
    pixels.push({ x: 9, y: 20, color: c.light });
    pixels.push({ x: 22, y: 20, color: c.light });

    return pixels;
  }

  private generateExtras(c: ColorPalette, f: MascotConfig['features']): Pixel[] {
    const pixels: Pixel[] = [];

    // Hawk-specific gold accents
    if (this.config.name === 'hawk' && 'gold' in c) {
      const goldColor = c.gold as string;
      // Beak highlight
      pixels.push({ x: 15, y: 22, color: goldColor });
      pixels.push({ x: 16, y: 22, color: goldColor });
    }

    // Wolf-specific chest fur
    if (this.config.name === 'wolf') {
      for (let x = 10; x < 22; x++) {
        pixels.push({ x, y: 24, color: c.light });
      }
    }

    return pixels;
  }

  private pixelToRect(pixel: Pixel, size: number): string {
    return `<rect x="${pixel.x * size}" y="${pixel.y * size}" width="${size}" height="${size}" fill="${pixel.color}"/>`;
  }

  private generateDefs(): string {
    return `<defs>
    <filter id="pixelate">
      <feFlood x="0" y="0" width="2" height="2"/>
      <feComposite width="10" height="10"/>
      <feTile result="a"/>
      <feComposite in="SourceGraphic" in2="a" operator="in"/>
      <feMorphology operator="dilate" radius="5"/>
    </filter>
  </defs>`;
  }

  private generateGrid(size: number, pixelSize: number): string {
    const lines: string[] = [];
    
    // Vertical lines
    for (let x = 0; x <= this.gridSize; x++) {
      lines.push(`<line x1="${x * pixelSize}" y1="0" x2="${x * pixelSize}" y2="${size}" stroke="rgba(0,0,0,0.1)" stroke-width="0.5"/>`);
    }
    
    // Horizontal lines
    for (let y = 0; y <= this.gridSize; y++) {
      lines.push(`<line x1="0" y1="${y * pixelSize}" x2="${size}" y2="${y * pixelSize}" stroke="rgba(0,0,0,0.1)" stroke-width="0.5"/>`);
    }

    return `<g id="grid" opacity="0.3">\n    ${lines.join('\n    ')}\n  </g>`;
  }

  private generateMetadata(): string {
    return `<!-- 
  Mascot: ${this.config.displayName}
  Personality: ${this.config.personality}
  Generated: ${new Date().toISOString()}
  Options: ${JSON.stringify(this.options)}
-->`;
  }
}

// ============================================
// REACT COMPONENT GENERATOR
// ============================================

export function generateReactComponent(config: MascotConfig): string {
  const generator = new SVGGenerator(config, {
    sizes: [64],
    pixelScale: 2,
    showGrid: false,
    antiAlias: false,
    formats: ['svg'],
    optimization: 'basic',
    metadata: false
  });

  const svg64 = generator.generate(64);
  const svg128 = generator.generate(128);
  const svg256 = generator.generate(256);

  const svg64Escaped = svg64.replace(/`/g, '\\`').replace(/\\"/g, '\\\\"');
  const svg128Escaped = svg128.replace(/`/g, '\\`').replace(/\\"/g, '\\\\"');
  const svg256Escaped = svg256.replace(/`/g, '\\`').replace(/\\"/g, '\\\\"');

  return `import React from 'react';

interface ${config.displayName}MascotSVGProps {
  size?: 32 | 64 | 128 | 256;
  className?: string;
  animate?: boolean;
}

/**
 * ${config.displayName} Mascot SVG Component
 * ${config.personality}
 * 
 * [Ver001.000] - Auto-generated from mascot-generator
 */
export const ${config.displayName}MascotSVG: React.FC<${config.displayName}MascotSVGProps> = ({ 
  size = 64, 
  className = '',
  animate = false 
}) => {
  const svgContent = size <= 64 ? \`${svg64Escaped}\` :
                     size <= 128 ? \`${svg128Escaped}\` :
                     \`${svg256Escaped}\`;

  return (
    <div 
      className={\`mascot-${config.name} \${className} \${animate ? 'animate' : ''}\`}
      style={{ 
        width: size, 
        height: size,
        imageRendering: 'pixelated'
      }}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
};

export default ${config.displayName}MascotSVG;
`;
}

// ============================================
// BATCH GENERATOR
// ============================================

export function generateAllMascots(
  configs: MascotConfig[],
  options: GenerationOptions,
  outputDir: string
): { name: string; files: string[] }[] {
  return configs.map(config => {
    const generator = new SVGGenerator(config, options);
    const files: string[] = [];

    options.sizes.forEach(size => {
      if (options.formats.includes('svg')) {
        const svg = generator.generate(size);
        files.push(config.name + '-' + size + 'x' + size + '.svg');
        // Would write to file here
      }
    });

    return { name: config.name, files };
  });
}
