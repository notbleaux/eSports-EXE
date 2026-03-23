/**
 * Watermark Generation
 * Creates watermarks for exported screenshots and clips
 * [Ver001.000]
 */

export interface WatermarkOptions {
  /** Watermark text */
  text: string;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** Font size (auto-calculated if not provided) */
  fontSize?: number;
  /** Font family */
  fontFamily?: string;
  /** Text color */
  color?: string;
  /** Background color (transparent by default) */
  backgroundColor?: string;
  /** Padding around text */
  padding?: number;
  /** Corner radius for background */
  borderRadius?: number;
  /** Logo/image URL to include */
  logoUrl?: string;
  /** Logo size */
  logoSize?: number;
}

/** Generate watermark canvas */
export function generateWatermark(options: WatermarkOptions): HTMLCanvasElement {
  const {
    text,
    width,
    height,
    fontFamily = 'Inter, system-ui, sans-serif',
    color = 'rgba(255, 255, 255, 0.8)',
    backgroundColor = 'rgba(0, 0, 0, 0.4)',
    padding = 12,
    borderRadius = 6,
    logoSize = 24,
  } = options;

  // Auto-calculate font size based on canvas width
  const fontSize = options.fontSize || Math.max(12, Math.min(16, width / 80));

  // Create temporary canvas to measure text
  const measureCanvas = document.createElement('canvas');
  const measureCtx = measureCanvas.getContext('2d')!;
  measureCtx.font = `${fontSize}px ${fontFamily}`;
  const textMetrics = measureCtx.measureText(text);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  // Calculate canvas size
  const hasLogo = !!options.logoUrl;
  const canvasWidth = textWidth + (hasLogo ? logoSize + padding : 0) + padding * 3;
  const canvasHeight = Math.max(textHeight + padding * 2, hasLogo ? logoSize + padding * 2 : 0);

  // Create watermark canvas
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(canvasWidth);
  canvas.height = Math.ceil(canvasHeight);

  const ctx = canvas.getContext('2d')!;

  // Draw background
  if (backgroundColor) {
    ctx.fillStyle = backgroundColor;
    roundRect(ctx, 0, 0, canvas.width, canvas.height, borderRadius);
    ctx.fill();
  }

  // Draw text
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'middle';

  let xOffset = padding;

  // Draw logo placeholder if needed (actual logo would be loaded asynchronously)
  if (hasLogo) {
    const logoX = padding;
    const logoY = (canvas.height - logoSize) / 2;
    ctx.fillStyle = color;
    ctx.fillRect(logoX, logoY, logoSize, logoSize);
    xOffset += logoSize + padding;
  }

  ctx.fillText(text, xOffset, canvas.height / 2);

  return canvas;
}

/** Draw rounded rectangle path */
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/** Generate branded watermark with gradient */
export function generateBrandedWatermark(
  brandText: string,
  width: number,
  height: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const watermarkWidth = Math.min(300, width * 0.25);
  const watermarkHeight = Math.min(60, height * 0.08);

  canvas.width = watermarkWidth;
  canvas.height = watermarkHeight;

  const ctx = canvas.getContext('2d')!;

  // Gradient background
  const gradient = ctx.createLinearGradient(0, 0, watermarkWidth, 0);
  gradient.addColorStop(0, 'rgba(99, 102, 241, 0.3)'); // Indigo
  gradient.addColorStop(0.5, 'rgba(168, 85, 247, 0.3)'); // Purple
  gradient.addColorStop(1, 'rgba(236, 72, 153, 0.3)'); // Pink

  roundRect(ctx, 0, 0, watermarkWidth, watermarkHeight, 8);
  ctx.fillStyle = gradient;
  ctx.fill();

  // Border
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1;
  roundRect(ctx, 0, 0, watermarkWidth, watermarkHeight, 8);
  ctx.stroke();

  // Text
  const fontSize = Math.max(10, watermarkHeight * 0.4);
  ctx.font = `600 ${fontSize}px Inter, system-ui, sans-serif`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(brandText, watermarkWidth / 2, watermarkHeight / 2);

  return canvas;
}

/** Generate subtle corner watermark */
export function generateCornerWatermark(
  text: string,
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' = 'bottom-right'
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = 150;
  canvas.height = 40;

  const ctx = canvas.getContext('2d')!;

  // Subtle background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';

  const borderRadius = 6;
  switch (position) {
    case 'top-left':
      roundRect(ctx, 0, 0, canvas.width, canvas.height, borderRadius);
      break;
    case 'top-right':
      ctx.translate(canvas.width, 0);
      ctx.scale(-1, 1);
      roundRect(ctx, 0, 0, canvas.width, canvas.height, borderRadius);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      break;
    case 'bottom-left':
      ctx.translate(0, canvas.height);
      ctx.scale(1, -1);
      roundRect(ctx, 0, 0, canvas.width, canvas.height, borderRadius);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      break;
    case 'bottom-right':
      ctx.translate(canvas.width, canvas.height);
      ctx.scale(-1, -1);
      roundRect(ctx, 0, 0, canvas.width, canvas.height, borderRadius);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      break;
  }
  ctx.fill();

  // Text
  ctx.font = '12px Inter, system-ui, sans-serif';
  ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, canvas.width / 2, canvas.height / 2);

  return canvas;
}
