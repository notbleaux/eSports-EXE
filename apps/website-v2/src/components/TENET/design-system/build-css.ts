/** [Ver001.000] */
/**
 * Design System CSS Builder
 * =========================
 * Converts tokens.json to CSS custom properties (variables).
 * 
 * Usage: npx ts-node build-css.ts
 * Output: tokens.css
 */

import * as fs from 'fs';
import * as path from 'path';

// Import tokens
import tokens from './tokens.json';

interface TokenSection {
  [key: string]: string | TokenSection;
}

function flattenTokens(
  obj: TokenSection,
  prefix: string = '',
  result: Record<string, string> = {}
): Record<string, string> {
  for (const [key, value] of Object.entries(obj)) {
    const newKey = prefix ? `${prefix}-${key}` : key;
    
    if (typeof value === 'string') {
      result[newKey] = value;
    } else if (typeof value === 'object' && value !== null) {
      flattenTokens(value as TokenSection, newKey, result);
    }
  }
  return result;
}

function generateCSS(): string {
  const css: string[] = [];
  
  // Header
  css.push('/**');
  css.push(' * TENET Design System - CSS Custom Properties');
  css.push(' * ===========================================');
  css.push(' * Auto-generated from tokens.json');
  css.push(' * DO NOT EDIT DIRECTLY - Run build-css.ts instead');
  css.push(' */');
  css.push('');
  
  // Root variables
  css.push(':root {');
  
  // Colors
  css.push('  /* Colors - Primary */');
  const primaryColors = flattenTokens(tokens.colors.primary as TokenSection, 'color-primary');
  Object.entries(primaryColors).forEach(([key, value]) => {
    css.push(`  --${key}: ${value};`);
  });
  css.push('');
  
  css.push('  /* Colors - Secondary */');
  const secondaryColors = flattenTokens(tokens.colors.secondary as TokenSection, 'color-secondary');
  Object.entries(secondaryColors).forEach(([key, value]) => {
    css.push(`  --${key}: ${value};`);
  });
  css.push('');
  
  css.push('  /* Colors - Neutral */');
  const neutralColors = flattenTokens(tokens.colors.neutral as TokenSection, 'color-neutral');
  Object.entries(neutralColors).forEach(([key, value]) => {
    css.push(`  --${key}: ${value};`);
  });
  css.push('');
  
  css.push('  /* Colors - Semantic */');
  const semanticColors = flattenTokens(tokens.colors.semantic as TokenSection, 'color-semantic');
  Object.entries(semanticColors).forEach(([key, value]) => {
    css.push(`  --${key}: ${value};`);
  });
  css.push('');
  
  css.push('  /* Colors - Hub */');
  const hubColors = flattenTokens(tokens.colors.hub as TokenSection, 'color-hub');
  Object.entries(hubColors).forEach(([key, value]) => {
    css.push(`  --${key}: ${value};`);
  });
  css.push('');
  
  // Typography
  css.push('  /* Typography - Font Family */');
  css.push(`  --font-sans: ${tokens.typography.fontFamily.sans.join(', ')};`);
  css.push(`  --font-mono: ${tokens.typography.fontFamily.mono.join(', ')};`);
  css.push(`  --font-display: ${tokens.typography.fontFamily.display.join(', ')};`);
  css.push('');
  
  css.push('  /* Typography - Font Size */');
  Object.entries(tokens.typography.fontSize).forEach(([key, value]) => {
    css.push(`  --font-size-${key}: ${value};`);
  });
  css.push('');
  
  css.push('  /* Typography - Font Weight */');
  Object.entries(tokens.typography.fontWeight).forEach(([key, value]) => {
    css.push(`  --font-weight-${key}: ${value};`);
  });
  css.push('');
  
  css.push('  /* Typography - Line Height */');
  Object.entries(tokens.typography.lineHeight).forEach(([key, value]) => {
    css.push(`  --line-height-${key}: ${value};`);
  });
  css.push('');
  
  css.push('  /* Typography - Letter Spacing */');
  Object.entries(tokens.typography.letterSpacing).forEach(([key, value]) => {
    css.push(`  --letter-spacing-${key}: ${value};`);
  });
  css.push('');
  
  // Spacing
  css.push('  /* Spacing */');
  Object.entries(tokens.spacing).forEach(([key, value]) => {
    css.push(`  --spacing-${key}: ${value};`);
  });
  css.push('');
  
  // Border Radius
  css.push('  /* Border Radius */');
  Object.entries(tokens.borderRadius).forEach(([key, value]) => {
    const cssKey = key === 'DEFAULT' ? 'DEFAULT' : key;
    css.push(`  --radius-${cssKey}: ${value};`);
  });
  css.push('');
  
  // Shadows
  css.push('  /* Shadows */');
  Object.entries(tokens.shadows).forEach(([key, value]) => {
    const cssKey = key === 'DEFAULT' ? 'DEFAULT' : key;
    css.push(`  --shadow-${cssKey}: ${value};`);
  });
  css.push('');
  
  // Animation
  css.push('  /* Animation - Duration */');
  Object.entries(tokens.animation.duration).forEach(([key, value]) => {
    css.push(`  --duration-${key}: ${value};`);
  });
  css.push('');
  
  css.push('  /* Animation - Easing */');
  Object.entries(tokens.animation.easing).forEach(([key, value]) => {
    css.push(`  --ease-${key}: ${value};`);
  });
  css.push('');
  
  // Breakpoints
  css.push('  /* Breakpoints */');
  Object.entries(tokens.breakpoints).forEach(([key, value]) => {
    css.push(`  --breakpoint-${key}: ${value};`);
  });
  css.push('');
  
  // Z-Index
  css.push('  /* Z-Index */');
  Object.entries(tokens.zIndex).forEach(([key, value]) => {
    css.push(`  --z-${key}: ${value};`);
  });
  
  css.push('}');
  
  return css.join('\n');
}

// Generate and write CSS
const cssOutput = generateCSS();
const outputPath = path.join(__dirname, 'tokens.css');

fs.writeFileSync(outputPath, cssOutput, 'utf-8');
console.log(`✅ CSS tokens generated: ${outputPath}`);
console.log(`📊 Total lines: ${cssOutput.split('\n').length}`);
