// @ts-nocheck
/**
 * Text Annotation System
 * Text labels with positioning, styling, and formatting
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-F
 * Team: Replay 2.0 Core (TL-S2)
 */

import type { TextAnnotation, TextStyle, Position2D } from './types';

// ============================================================================
// Font Configuration
// ============================================================================

export const FONT_FAMILIES = [
  'Inter, system-ui, sans-serif',
  'Arial, sans-serif',
  'Helvetica, sans-serif',
  'Georgia, serif',
  'Courier New, monospace',
  'Impact, sans-serif',
];

export const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

export const FONT_WEIGHTS: { label: string; value: TextStyle['fontWeight'] }[] = [
  { label: 'Light', value: 'lighter' },
  { label: 'Normal', value: 'normal' },
  { label: 'Bold', value: 'bold' },
];

export const TEXT_COLORS = [
  '#FFFFFF',
  '#000000',
  '#FF4655',
  '#00D4AA',
  '#FFD700',
  '#FF6B35',
  '#9B59B6',
  '#3498DB',
];

export const BACKGROUND_COLORS = [
  'transparent',
  'rgba(0, 0, 0, 0.7)',
  'rgba(255, 70, 85, 0.8)',
  'rgba(0, 212, 170, 0.8)',
  'rgba(255, 215, 0, 0.8)',
  'rgba(0, 0, 0, 0.9)',
  'rgba(255, 255, 255, 0.9)',
];

// ============================================================================
// Text Measurement
// ============================================================================

export interface TextMetrics {
  width: number;
  height: number;
  actualBoundingBoxAscent: number;
  actualBoundingBoxDescent: number;
}

/**
 * Measure text dimensions with given style
 */
export function measureText(
  text: string,
  style: TextStyle,
  ctx?: CanvasRenderingContext2D
): TextMetrics {
  const canvas = ctx?.canvas || document.createElement('canvas');
  const context = ctx || canvas.getContext('2d')!;
  
  const fontWeight = typeof style.fontWeight === 'number' 
    ? style.fontWeight 
    : style.fontWeight;
  context.font = `${fontWeight} ${style.fontSize}px ${style.fontFamily}`;
  
  const metrics = context.measureText(text);
  const lineHeight = style.fontSize * 1.2;
  const lines = text.split('\n').length;
  
  return {
    width: Math.max(...text.split('\n').map(line => context.measureText(line).width)),
    height: lineHeight * lines + style.padding * 2,
    actualBoundingBoxAscent: metrics.actualBoundingBoxAscent,
    actualBoundingBoxDescent: metrics.actualBoundingBoxDescent,
  };
}

/**
 * Calculate text bounding box
 */
export function getTextBounds(
  annotation: TextAnnotation
): { x: number; y: number; width: number; height: number } {
  const metrics = measureText(annotation.text, annotation.style);
  
  const width = metrics.width + annotation.style.padding * 2;
  const height = metrics.height;
  
  // Adjust position based on alignment
  let x = annotation.position.x;
  if (annotation.style.alignment === 'center') {
    x -= width / 2;
  } else if (annotation.style.alignment === 'right') {
    x -= width;
  }
  
  // Apply scale
  const scaledWidth = width * annotation.scale;
  const scaledHeight = height * annotation.scale;
  
  return {
    x: x - (scaledWidth - width) / 2,
    y: annotation.position.y - (scaledHeight - height) / 2,
    width: scaledWidth,
    height: scaledHeight,
  };
}

// ============================================================================
// Canvas Rendering
// ============================================================================

export interface RenderTextOptions {
  ctx: CanvasRenderingContext2D;
  annotation: TextAnnotation;
  isSelected?: boolean;
  isHovered?: boolean;
  timeProgress?: number;
}

/**
 * Render a text annotation to canvas
 */
export function renderTextAnnotation(options: RenderTextOptions): void {
  const { ctx, annotation, isSelected = false, isHovered = false, timeProgress = 1 } = {
    timeProgress: 1,
    ...options,
  };
  
  const { text, position, style, rotation, scale } = annotation;
  
  ctx.save();
  
  // Apply opacity with time progress
  ctx.globalAlpha = annotation.opacity * timeProgress;
  
  // Move to position and apply rotation/scale
  ctx.translate(position.x, position.y);
  ctx.rotate((rotation * Math.PI) / 180);
  ctx.scale(scale, scale);
  
  // Measure text
  const metrics = measureText(text, style, ctx);
  const width = metrics.width + style.padding * 2;
  const height = metrics.height;
  
  // Calculate text origin based on alignment
  let originX = 0;
  if (style.alignment === 'center') {
    originX = -width / 2;
  } else if (style.alignment === 'right') {
    originX = -width;
  }
  
  // Draw background
  if (style.backgroundColor && style.backgroundColor !== 'transparent') {
    ctx.fillStyle = style.backgroundColor;
    ctx.beginPath();
    ctx.roundRect(originX, -height / 2, width, height, style.borderRadius);
    ctx.fill();
  }
  
  // Draw border
  if (style.borderColor && style.borderWidth && style.borderWidth > 0) {
    ctx.strokeStyle = style.borderColor;
    ctx.lineWidth = style.borderWidth;
    ctx.beginPath();
    ctx.roundRect(originX, -height / 2, width, height, style.borderRadius);
    ctx.stroke();
  }
  
  // Draw selection highlight
  if (isSelected || isHovered) {
    ctx.strokeStyle = isSelected ? '#00D4AA' : '#FFD700';
    ctx.lineWidth = 2;
    ctx.setLineDash(isSelected ? [] : [5, 5]);
    ctx.beginPath();
    ctx.roundRect(originX - 4, -height / 2 - 4, width + 8, height + 8, style.borderRadius + 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  
  // Draw text
  ctx.fillStyle = style.color;
  ctx.font = `${style.fontWeight} ${style.fontSize}px ${style.fontFamily}`;
  ctx.textBaseline = 'middle';
  
  const lines = text.split('\n');
  const lineHeight = style.fontSize * 1.2;
  let textY = -(lines.length - 1) * lineHeight / 2;
  
  for (const line of lines) {
    let textX = originX + style.padding;
    
    if (style.alignment === 'center') {
      const lineMetrics = ctx.measureText(line);
      textX = originX + width / 2 - lineMetrics.width / 2;
    } else if (style.alignment === 'right') {
      const lineMetrics = ctx.measureText(line);
      textX = originX + width - style.padding - lineMetrics.width;
    }
    
    ctx.fillText(line, textX, textY);
    textY += lineHeight;
  }
  
  ctx.restore();
}

// ============================================================================
// Text Editing
// ============================================================================

/**
 * Format text with basic markdown-style syntax
 * Supports: **bold**, *italic*, `code`
 */
export function formatText(text: string): Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }> {
  const segments: Array<{ text: string; bold?: boolean; italic?: boolean; code?: boolean }> = [];
  
  // Simple regex-based parsing
  const regex = /(\*\*.*?\*\*|\*.*?\*|`.*?`)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  
  while ((match = regex.exec(text)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      segments.push({ text: text.slice(lastIndex, match.index) });
    }
    
    const matched = match[0];
    if (matched.startsWith('**') && matched.endsWith('**')) {
      segments.push({ text: matched.slice(2, -2), bold: true });
    } else if (matched.startsWith('*') && matched.endsWith('*')) {
      segments.push({ text: matched.slice(1, -1), italic: true });
    } else if (matched.startsWith('`') && matched.endsWith('`')) {
      segments.push({ text: matched.slice(1, -1), code: true });
    }
    
    lastIndex = regex.lastIndex;
  }
  
  // Add remaining text
  if (lastIndex < text.length) {
    segments.push({ text: text.slice(lastIndex) });
  }
  
  return segments;
}

/**
 * Truncate text to fit within max width
 */
export function truncateText(
  text: string,
  maxWidth: number,
  style: TextStyle,
  ellipsis: string = '...'
): string {
  const metrics = measureText(text, style);
  
  if (metrics.width <= maxWidth) {
    return text;
  }
  
  let truncated = text;
  while (truncated.length > 0) {
    const testText = truncated.slice(0, -1) + ellipsis;
    const testMetrics = measureText(testText, style);
    
    if (testMetrics.width <= maxWidth) {
      return testText;
    }
    
    truncated = truncated.slice(0, -1);
  }
  
  return ellipsis;
}

/**
 * Wrap text to fit within max width
 */
export function wrapText(
  text: string,
  maxWidth: number,
  style: TextStyle
): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';
  
  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = measureText(testLine, style);
    
    if (metrics.width <= maxWidth) {
      currentLine = testLine;
    } else {
      if (currentLine) {
        lines.push(currentLine);
      }
      currentLine = word;
    }
  }
  
  if (currentLine) {
    lines.push(currentLine);
  }
  
  return lines;
}

// ============================================================================
// Hit Testing
// ============================================================================

/**
 * Check if a point is within a text annotation's bounds
 */
export function isPointInTextAnnotation(
  point: Position2D,
  annotation: TextAnnotation
): boolean {
  const bounds = getTextBounds(annotation);
  
  // Transform point to local space
  const dx = point.x - annotation.position.x;
  const dy = point.y - annotation.position.y;
  
  // Apply inverse rotation
  const angle = (-annotation.rotation * Math.PI) / 180;
  const localX = dx * Math.cos(angle) - dy * Math.sin(angle);
  const localY = dx * Math.sin(angle) + dy * Math.cos(angle);
  
  // Apply inverse scale
  const scaledX = localX / annotation.scale;
  const scaledY = localY / annotation.scale;
  
  // Check bounds
  const relativeBounds = {
    x: bounds.x - annotation.position.x,
    y: bounds.y - annotation.position.y,
    width: bounds.width,
    height: bounds.height,
  };
  
  return (
    scaledX >= relativeBounds.x &&
    scaledX <= relativeBounds.x + relativeBounds.width &&
    scaledY >= relativeBounds.y &&
    scaledY <= relativeBounds.y + relativeBounds.height
  );
}

// ============================================================================
// Preset Styles
// ============================================================================

export const TEXT_PRESETS: { name: string; style: Partial<TextStyle> }[] = [
  {
    name: 'Default',
    style: {
      fontSize: 16,
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      padding: 8,
      borderRadius: 4,
    },
  },
  {
    name: 'Highlight',
    style: {
      fontSize: 20,
      fontWeight: 'bold',
      color: '#000000',
      backgroundColor: '#FFD700',
      padding: 10,
      borderRadius: 4,
    },
  },
  {
    name: 'Alert',
    style: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#FFFFFF',
      backgroundColor: '#FF4655',
      padding: 10,
      borderRadius: 4,
    },
  },
  {
    name: 'Info',
    style: {
      fontSize: 14,
      fontWeight: 'normal',
      color: '#FFFFFF',
      backgroundColor: 'rgba(52, 152, 219, 0.8)',
      padding: 8,
      borderRadius: 4,
    },
  },
  {
    name: 'Minimal',
    style: {
      fontSize: 16,
      fontWeight: 'normal',
      color: '#FFFFFF',
      backgroundColor: 'transparent',
      padding: 4,
      borderRadius: 0,
    },
  },
];

// ============================================================================
// Animation Helpers
// ============================================================================

export interface TextAnimation {
  type: 'fade' | 'slide' | 'scale' | 'typewriter';
  duration: number;
  delay?: number;
}

/**
 * Calculate text animation progress
 */
export function calculateTextAnimation(
  progress: number,
  animation: TextAnimation
): number {
  const adjustedProgress = Math.max(0, Math.min(1, (progress - (animation.delay || 0)) / animation.duration));
  
  switch (animation.type) {
    case 'fade':
      return easeInOutQuad(adjustedProgress);
    case 'slide':
      return easeOutCubic(adjustedProgress);
    case 'scale':
      return easeOutBack(adjustedProgress);
    case 'typewriter':
      return adjustedProgress;
    default:
      return adjustedProgress;
  }
}

// Easing functions
function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

// ============================================================================
// Export
// ============================================================================

export default {
  FONT_FAMILIES,
  FONT_SIZES,
  FONT_WEIGHTS,
  TEXT_COLORS,
  BACKGROUND_COLORS,
  TEXT_PRESETS,
  measureText,
  getTextBounds,
  renderTextAnnotation,
  formatText,
  truncateText,
  wrapText,
  isPointInTextAnnotation,
  calculateTextAnimation,
};
