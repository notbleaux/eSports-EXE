/**
 * CSS Mascot Generator - Option 3
 * 
 * [Ver001.000]
 * 
 * Generates pure CSS pixel art using box-shadow technique.
 * Zero dependencies, works anywhere CSS works.
 */

import { MascotConfig, GenerationOptions, ColorPalette } from './config.js';

interface CSSPixel {
  x: number;
  y: number;
  color: string;
}

export class CSSGenerator {
  private config: MascotConfig;
  private options: GenerationOptions;
  private gridSize = 32;

  constructor(config: MascotConfig, options: GenerationOptions) {
    this.config = config;
    this.options = options;
  }

  /**
   * Generate CSS box-shadow string
   */
  generate(): string {
    const pixels = this.generatePixelData();
    return this.pixelsToBoxShadow(pixels);
  }

  /**
   * Generate complete CSS class
   */
  generateCSSClass(): string {
    const boxShadow = this.generate();
    const size = this.options.sizes[0] || 64;
    const pixelSize = size / this.gridSize;

    return `/**
 * ${this.config.displayName} Mascot - CSS Pixel Art
 * ${this.config.personality}
 * 
 * [Ver001.000] - Auto-generated from mascot-generator
 * Size: ${size}x${size}
 */

.${this.config.name}-mascot {
  width: ${pixelSize}px;
  height: ${pixelSize}px;
  background: transparent;
  box-shadow: ${boxShadow};
  image-rendering: pixelated;
  transform: scale(${this.options.pixelScale});
  transform-origin: top left;
}

/* Hover animation */
.${this.config.name}-mascot:hover {
  animation: ${this.config.name}-bounce 0.5s ease infinite;
}

@keyframes ${this.config.name}-bounce {
  0%, 100% { transform: scale(${this.options.pixelScale}) translateY(0); }
  50% { transform: scale(${this.options.pixelScale}) translateY(-2px); }
}
`;
  }

  /**
   * Generate React component with CSS
   */
  generateReactComponent(): string {
    const css = this.generateCSSClass();
    
    return `import React from 'react';
import './${this.config.name}.css';

interface ${this.config.displayName}CSSProps {
  className?: string;
  animate?: boolean;
}

/**
 * ${this.config.displayName} Mascot - CSS-Only Component
 * Zero dependencies, pure CSS pixel art
 * 
 * [Ver001.000] - Auto-generated from mascot-generator
 */
export const ${this.config.displayName}CSS: React.FC<${this.config.displayName}CSSProps> = ({ 
  className = '',
  animate = false 
}) => {
  return (
    <div 
      className={\`${this.config.name}-mascot-wrapper \${className}\`}
      style={{ 
        width: 64, 
        height: 64,
        display: 'inline-block'
      }}
    >
      <div className={\`${this.config.name}-mascot \${animate ? 'animate' : ''}\`} />
    </div>
  );
};

export default ${this.config.displayName}CSS;
`;
  }

  /**
   * Generate styled-components version
   */
  generateStyledComponent(): string {
    const pixels = this.generatePixelData();
    const boxShadow = this.pixelsToBoxShadow(pixels);
    const c = this.config.colors;

    return `import styled from 'styled-components';

/**
 * ${this.config.displayName} Mascot - Styled Component
 * 
 * [Ver001.000] - Auto-generated from mascot-generator
 */

export const ${this.config.displayName}Styled = styled.div\`
  width: 2px;
  height: 2px;
  background: transparent;
  box-shadow: ${boxShadow};
  image-rendering: pixelated;
  transform: scale(2);
  transform-origin: top left;
  
  &:hover {
    animation: bounce 0.5s ease infinite;
  }
  
  @keyframes bounce {
    0%, 100% { transform: scale(2) translateY(0); }
    50% { transform: scale(2) translateY(-2px); }
  }
\`;

// CSS Custom Properties for theming
export const ${this.config.displayName}Variables = styled.div\`
  --mascot-primary: ${c.primary};
  --mascot-secondary: ${c.secondary};
  --mascot-light: ${c.light};
  --mascot-dark: ${c.dark};
\`;
`;
  }

  /**
   * Generate Tailwind CSS component
   */
  generateTailwindComponent(): string {
    return `import React from 'react';
import { clsx } from 'clsx';

interface ${this.config.displayName}TailwindProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * ${this.config.displayName} Mascot - Tailwind Version
 * Note: Box-shadow pixels require inline styles for colors
 * 
 * [Ver001.000] - Auto-generated from mascot-generator
 */
export const ${this.config.displayName}Tailwind: React.FC<${this.config.displayName}TailwindProps> = ({ 
  className,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-16 h-16',
    lg: 'w-32 h-32'
  };

  return (
    <div 
      className={clsx(
        sizeClasses[size],
        'relative',
        className
      )}
    >
      <div 
        className="absolute inset-0"
        style={{
          // Box-shadow pixel art here
          boxShadow: '/* generated values */',
          imageRendering: 'pixelated'
        }}
      />
    </div>
  );
};
`;
  }

  private generatePixelData(): CSSPixel[] {
    const pixels: CSSPixel[] = [];
    const c = this.config.colors;
    const f = this.config.features;

    // Same logic as SVG/PNG generators
    // Ears
    const earHeight = f.earShape === 'pointed' ? 8 : 6;
    for (let y = 2; y < 2 + earHeight; y++) {
      const progress = (y - 2) / earHeight;
      const width = Math.max(1, 4 * (1 - progress));
      
      for (let x = 12 - width; x <= 12 + width; x++) {
        pixels.push({
          x: Math.round(x),
          y,
          color: y < 4 ? c.dark : y < 6 ? c.primary : c.secondary
        });
      }
      
      for (let x = 20 - width; x <= 20 + width; x++) {
        pixels.push({
          x: Math.round(x),
          y,
          color: y < 4 ? c.dark : y < 6 ? c.primary : c.secondary
        });
      }
    }

    // Head
    const startY = f.earShape === 'pointed' ? 8 : 6;
    for (let y = startY; y < 26; y++) {
      for (let x = 8; x < 24; x++) {
        const isEdge = x === 8 || x === 23 || y === startY || y === 25;
        const isTopCorner = y === startY && (x === 8 || x === 23);
        if (isTopCorner) continue;

        pixels.push({
          x,
          y,
          color: isEdge ? c.outline : this.getGradientColor(x, y, c)
        });
      }
    }

    // Eyes
    const eyeY = 14;
    const eyeSize = f.eyeSize === 'large' ? 3 : f.eyeSize === 'small' ? 1 : 2;
    
    for (let dx = 0; dx < eyeSize; dx++) {
      for (let dy = 0; dy < eyeSize; dy++) {
        pixels.push({ x: 11 + dx, y: eyeY + dy, color: c.black });
        pixels.push({ x: 21 - eyeSize + dx, y: eyeY + dy, color: c.black });
      }
    }
    pixels.push({ x: 11 + eyeSize - 1, y: eyeY, color: c.white });
    pixels.push({ x: 21, y: eyeY, color: c.white });

    // Snout
    const snoutY = f.snoutLength === 'long' ? 18 : f.snoutLength === 'short' ? 20 : 19;
    const snoutHeight = f.snoutLength === 'long' ? 6 : 4;
    for (let y = snoutY; y < snoutY + snoutHeight; y++) {
      for (let x = 12; x < 20; x++) {
        const isNose = y === snoutY + snoutHeight - 1 && x >= 14 && x < 18;
        pixels.push({ x, y, color: isNose ? c.black : c.white });
      }
    }

    // Extras
    if (this.config.name === 'hawk' && 'gold' in c) {
      pixels.push({ x: 15, y: 22, color: c.gold as string });
      pixels.push({ x: 16, y: 22, color: c.gold as string });
    }

    return pixels;
  }

  private getGradientColor(x: number, y: number, c: ColorPalette): string {
    const distFromCenter = Math.abs(x - 16);
    if (distFromCenter < 4) return c.light;
    if (distFromCenter < 8) return c.primary;
    return c.secondary;
  }

  private pixelsToBoxShadow(pixels: CSSPixel[]): string {
    // Sort pixels by y, then x for optimal rendering
    const sorted = [...pixels].sort((a, b) => {
      if (a.y !== b.y) return a.y - b.y;
      return a.x - b.x;
    });

    // Convert to box-shadow format: x y 0 0 color
    return sorted
      .map(p => `${p.x * 2}px ${p.y * 2}px 0 0 ${p.color}`)
      .join(',\n    ');
  }

  /**
   * Generate CSS animations for mascot states
   */
  generateAnimations(): string {
    return `
/* ${this.config.displayName} Animations */

@keyframes ${this.config.name}-idle {
  0%, 100% { transform: scale(2) translateY(0); }
  50% { transform: scale(2) translateY(-1px); }
}

@keyframes ${this.config.name}-wave {
  0%, 100% { transform: scale(2) rotate(0deg); }
  25% { transform: scale(2) rotate(-5deg); }
  75% { transform: scale(2) rotate(5deg); }
}

@keyframes ${this.config.name}-celebrate {
  0%, 100% { transform: scale(2) translateY(0); }
  25% { transform: scale(2) translateY(-4px); }
  50% { transform: scale(2) translateY(0); }
  75% { transform: scale(2) translateY(-2px); }
}

.${this.config.name}-mascot.animate-idle {
  animation: ${this.config.name}-idle 2s ease-in-out infinite;
}

.${this.config.name}-mascot.animate-wave {
  animation: ${this.config.name}-wave 0.5s ease-in-out 3;
}

.${this.config.name}-mascot.animate-celebrate {
  animation: ${this.config.name}-celebrate 0.8s ease-in-out;
}
`;
  }
}

// ============================================
// BATCH GENERATION
// ============================================

export function generateAllCSS(
  configs: MascotConfig[],
  options: GenerationOptions
): string {
  const parts: string[] = [
    '/* Mascot CSS Bundle */',
    '/* Generated: ' + new Date().toISOString() + ' */',
    ''
  ];

  configs.forEach(config => {
    const generator = new CSSGenerator(config, options);
    parts.push(generator.generateCSSClass());
    parts.push(generator.generateAnimations());
    parts.push('');
  });

  return parts.join('\n');
}

export function generateCSSModules(
  configs: MascotConfig[],
  options: GenerationOptions
): Map<string, string> {
  const modules = new Map<string, string>();

  configs.forEach(config => {
    const generator = new CSSGenerator(config, options);
    modules.set(
      `${config.name}.module.css`,
      generator.generateCSSClass() + generator.generateAnimations()
    );
  });

  return modules;
}
