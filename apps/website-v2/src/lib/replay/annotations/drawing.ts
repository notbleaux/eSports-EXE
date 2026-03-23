/**
 * Drawing System for Annotations
 * Canvas-based drawing with arrows, circles, zones, and freehand
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-F
 * Team: Replay 2.0 Core (TL-S2)
 */

import type { 
  DrawingAnnotation, 
  DrawingStroke, 
  DrawingPoint, 
  DrawingTool,
  Position2D 
} from './types';
import { generateStrokeId } from './types';

// ============================================================================
// Drawing Configuration
// ============================================================================

export const DRAWING_COLORS = [
  '#FF4655', // Red (Valorant)
  '#00D4AA', // Teal
  '#FFD700', // Gold
  '#FF6B35', // Orange
  '#9B59B6', // Purple
  '#3498DB', // Blue
  '#FFFFFF', // White
  '#000000', // Black
];

export const STROKE_WIDTHS = [2, 3, 5, 8, 12];

export const DEFAULT_DRAWING_CONFIG = {
  strokeWidth: 3,
  color: DRAWING_COLORS[0],
  opacity: 1,
  filled: false,
};

// ============================================================================
// Drawing Functions
// ============================================================================

/**
 * Calculate arrow head points
 */
export function calculateArrowHead(
  start: Position2D,
  end: Position2D,
  headSize: number = 15
): Position2D[] {
  const angle = Math.atan2(end.y - start.y, end.x - start.x);
  const headAngle = Math.PI / 6; // 30 degrees
  
  return [
    {
      x: end.x - headSize * Math.cos(angle - headAngle),
      y: end.y - headSize * Math.sin(angle - headAngle),
    },
    end,
    {
      x: end.x - headSize * Math.cos(angle + headAngle),
      y: end.y - headSize * Math.sin(angle + headAngle),
    },
  ];
}

/**
 * Create an arrow stroke
 */
export function createArrowStroke(
  start: Position2D,
  end: Position2D,
  color: string,
  width: number
): DrawingStroke {
  const headSize = Math.max(10, width * 4);
  const headPoints = calculateArrowHead(start, end, headSize);
  
  return {
    id: generateStrokeId(),
    points: [start, end, ...headPoints],
    color,
    width,
    tool: 'arrow',
  };
}

/**
 * Create a circle stroke
 */
export function createCircleStroke(
  center: Position2D,
  radius: number,
  color: string,
  width: number,
  filled: boolean = false
): DrawingStroke {
  const points: DrawingPoint[] = [];
  const segments = 64;
  
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push({
      x: center.x + Math.cos(angle) * radius,
      y: center.y + Math.sin(angle) * radius,
    });
  }
  
  return {
    id: generateStrokeId(),
    points,
    color,
    width,
    tool: filled ? 'zone' : 'circle',
  };
}

/**
 * Create a rectangle/zone stroke
 */
export function createZoneStroke(
  topLeft: Position2D,
  width: number,
  height: number,
  color: string,
  strokeWidth: number,
  filled: boolean = true
): DrawingStroke {
  const points: DrawingPoint[] = [
    topLeft,
    { x: topLeft.x + width, y: topLeft.y },
    { x: topLeft.x + width, y: topLeft.y + height },
    { x: topLeft.x, y: topLeft.y + height },
    topLeft, // Close the rectangle
  ];
  
  return {
    id: generateStrokeId(),
    points,
    color,
    width: strokeWidth,
    tool: 'zone',
  };
}

/**
 * Create a freehand stroke from points
 */
export function createFreehandStroke(
  points: DrawingPoint[],
  color: string,
  width: number,
  simplify: boolean = true
): DrawingStroke {
  let finalPoints = points;
  
  if (simplify && points.length > 2) {
    finalPoints = simplifyPath(points, 2);
  }
  
  return {
    id: generateStrokeId(),
    points: finalPoints,
    color,
    width,
    tool: 'freehand',
  };
}

/**
 * Simplify a path using Douglas-Peucker algorithm
 */
export function simplifyPath(points: DrawingPoint[], tolerance: number): DrawingPoint[] {
  if (points.length <= 2) return points;
  
  const squaredTolerance = tolerance * tolerance;
  
  function perpendicularDistanceSquared(
    point: Position2D,
    lineStart: Position2D,
    lineEnd: Position2D
  ): number {
    const dx = lineEnd.x - lineStart.x;
    const dy = lineEnd.y - lineStart.y;
    const lenSquared = dx * dx + dy * dy;
    
    if (lenSquared === 0) {
      const dx2 = point.x - lineStart.x;
      const dy2 = point.y - lineStart.y;
      return dx2 * dx2 + dy2 * dy2;
    }
    
    const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSquared));
    const projectionX = lineStart.x + t * dx;
    const projectionY = lineStart.y + t * dy;
    
    const dx2 = point.x - projectionX;
    const dy2 = point.y - projectionY;
    return dx2 * dx2 + dy2 * dy2;
  }
  
  function simplifyRecursive(
    start: number,
    end: number,
    result: DrawingPoint[]
  ): void {
    let maxDist = 0;
    let maxIndex = -1;
    
    for (let i = start + 1; i < end; i++) {
      const dist = perpendicularDistanceSquared(points[i], points[start], points[end]);
      if (dist > maxDist) {
        maxDist = dist;
        maxIndex = i;
      }
    }
    
    if (maxDist > squaredTolerance && maxIndex !== -1) {
      simplifyRecursive(start, maxIndex, result);
      result.push(points[maxIndex]);
      simplifyRecursive(maxIndex, end, result);
    }
  }
  
  const result: DrawingPoint[] = [points[0]];
  simplifyRecursive(0, points.length - 1, result);
  result.push(points[points.length - 1]);
  
  return result;
}

/**
 * Smooth a path using Catmull-Rom spline
 */
export function smoothPath(points: DrawingPoint[], tension: number = 0.5): DrawingPoint[] {
  if (points.length < 2) return points;
  if (points.length === 2) return points;
  
  const smoothed: DrawingPoint[] = [points[0]];
  const segments = 10;
  
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    
    for (let j = 1; j <= segments; j++) {
      const t = j / segments;
      const tt = t * t;
      const ttt = tt * t;
      
      const q0 = -ttt + 2 * tt - t;
      const q1 = 3 * ttt - 5 * tt + 2;
      const q2 = -3 * ttt + 4 * tt + t;
      const q3 = ttt - tt;
      
      const x = 0.5 * (p0.x * q0 + p1.x * q1 + p2.x * q2 + p3.x * q3);
      const y = 0.5 * (p0.y * q0 + p1.y * q1 + p2.y * q2 + p3.y * q3);
      
      smoothed.push({ x, y });
    }
  }
  
  return smoothed;
}

// ============================================================================
// Canvas Rendering Functions
// ============================================================================

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  scale: number;
  offsetX: number;
  offsetY: number;
}

/**
 * Render a drawing stroke to canvas
 */
export function renderStroke(
  ctx: CanvasRenderingContext2D,
  stroke: DrawingStroke,
  opacity: number = 1
): void {
  if (stroke.points.length < 2) return;
  
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.strokeStyle = stroke.color;
  ctx.lineWidth = stroke.width;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  
  if (stroke.tool === 'arrow') {
    renderArrow(ctx, stroke);
  } else if (stroke.tool === 'circle' || stroke.tool === 'zone') {
    renderCircle(ctx, stroke, stroke.tool === 'zone');
  } else {
    renderFreehand(ctx, stroke);
  }
  
  ctx.restore();
}

/**
 * Render an arrow
 */
function renderArrow(ctx: CanvasRenderingContext2D, stroke: DrawingStroke): void {
  if (stroke.points.length < 2) return;
  
  const start = stroke.points[0];
  const end = stroke.points[1];
  
  // Draw line
  ctx.beginPath();
  ctx.moveTo(start.x, start.y);
  ctx.lineTo(end.x, end.y);
  ctx.stroke();
  
  // Draw arrow head
  const headSize = Math.max(10, stroke.width * 4);
  const headPoints = calculateArrowHead(start, end, headSize);
  
  ctx.beginPath();
  ctx.moveTo(headPoints[0].x, headPoints[0].y);
  ctx.lineTo(headPoints[1].x, headPoints[1].y);
  ctx.lineTo(headPoints[2].x, headPoints[2].y);
  ctx.closePath();
  ctx.fillStyle = stroke.color;
  ctx.fill();
}

/**
 * Render a circle/zone
 */
function renderCircle(ctx: CanvasRenderingContext2D, stroke: DrawingStroke, filled: boolean): void {
  if (stroke.points.length < 3) return;
  
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  
  for (let i = 1; i < stroke.points.length; i++) {
    ctx.lineTo(stroke.points[i].x, stroke.points[i].y);
  }
  
  ctx.closePath();
  
  if (filled) {
    ctx.fillStyle = stroke.color + '40'; // 25% opacity hex
    ctx.fill();
  }
  
  ctx.stroke();
}

/**
 * Render freehand drawing
 */
function renderFreehand(ctx: CanvasRenderingContext2D, stroke: DrawingStroke): void {
  ctx.beginPath();
  ctx.moveTo(stroke.points[0].x, stroke.points[0].y);
  
  // Use quadratic curves for smoother lines
  for (let i = 1; i < stroke.points.length - 1; i++) {
    const xc = (stroke.points[i].x + stroke.points[i + 1].x) / 2;
    const yc = (stroke.points[i].y + stroke.points[i + 1].y) / 2;
    ctx.quadraticCurveTo(stroke.points[i].x, stroke.points[i].y, xc, yc);
  }
  
  // Connect last point
  if (stroke.points.length > 1) {
    const last = stroke.points[stroke.points.length - 1];
    ctx.lineTo(last.x, last.y);
  }
  
  ctx.stroke();
}

/**
 * Render a complete drawing annotation
 */
export function renderDrawingAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: DrawingAnnotation,
  timeProgress: number = 1
): void {
  ctx.save();
  ctx.globalAlpha = annotation.opacity;
  
  // Calculate how many strokes to show based on time progress
  const strokesToShow = Math.max(1, Math.floor(annotation.strokes.length * timeProgress));
  
  for (let i = 0; i < strokesToShow; i++) {
    const stroke = annotation.strokes[i];
    const strokeProgress = (i + 1) <= Math.floor(annotation.strokes.length * timeProgress)
      ? 1
      : (annotation.strokes.length * timeProgress) - Math.floor(annotation.strokes.length * timeProgress);
    
    if (strokeProgress > 0) {
      renderStroke(ctx, stroke, strokeProgress);
    }
  }
  
  ctx.restore();
}

// ============================================================================
// Hit Testing
// ============================================================================

/**
 * Check if a point is near a stroke (for selection)
 */
export function isPointNearStroke(
  point: Position2D,
  stroke: DrawingStroke,
  threshold: number = 10
): boolean {
  if (stroke.points.length < 2) return false;
  
  for (let i = 0; i < stroke.points.length - 1; i++) {
    const p1 = stroke.points[i];
    const p2 = stroke.points[i + 1];
    
    if (distanceToLineSegment(point, p1, p2) <= threshold) {
      return true;
    }
  }
  
  return false;
}

/**
 * Calculate distance from point to line segment
 */
function distanceToLineSegment(
  point: Position2D,
  lineStart: Position2D,
  lineEnd: Position2D
): number {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lenSquared = dx * dx + dy * dy;
  
  if (lenSquared === 0) {
    return Math.sqrt(
      Math.pow(point.x - lineStart.x, 2) + Math.pow(point.y - lineStart.y, 2)
    );
  }
  
  const t = Math.max(0, Math.min(1, ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lenSquared));
  const projectionX = lineStart.x + t * dx;
  const projectionY = lineStart.y + t * dy;
  
  return Math.sqrt(
    Math.pow(point.x - projectionX, 2) + Math.pow(point.y - projectionY, 2)
  );
}

// ============================================================================
// Bounding Box Calculations
// ============================================================================

/**
 * Get bounding box of a stroke
 */
export function getStrokeBounds(stroke: DrawingStroke): { min: Position2D; max: Position2D } {
  if (stroke.points.length === 0) {
    return { min: { x: 0, y: 0 }, max: { x: 0, y: 0 } };
  }
  
  let minX = stroke.points[0].x;
  let minY = stroke.points[0].y;
  let maxX = stroke.points[0].x;
  let maxY = stroke.points[0].y;
  
  for (const point of stroke.points) {
    minX = Math.min(minX, point.x);
    minY = Math.min(minY, point.y);
    maxX = Math.max(maxX, point.x);
    maxY = Math.max(maxY, point.y);
  }
  
  // Add padding for stroke width
  const padding = stroke.width / 2;
  return {
    min: { x: minX - padding, y: minY - padding },
    max: { x: maxX + padding, y: maxY + padding },
  };
}

/**
 * Get bounding box of a drawing annotation
 */
export function getDrawingBounds(annotation: DrawingAnnotation): { min: Position2D; max: Position2D } | null {
  if (annotation.strokes.length === 0) return null;
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  for (const stroke of annotation.strokes) {
    const bounds = getStrokeBounds(stroke);
    minX = Math.min(minX, bounds.min.x);
    minY = Math.min(minY, bounds.min.y);
    maxX = Math.max(maxX, bounds.max.x);
    maxY = Math.max(maxY, bounds.max.y);
  }
  
  return { min: { x: minX, y: minY }, max: { x: maxX, y: maxY } };
}

// ============================================================================
// Eraser Tool
// ============================================================================

/**
 * Erase strokes near a point
 */
export function eraseStrokes(
  annotation: DrawingAnnotation,
  erasePoint: Position2D,
  eraseRadius: number = 20
): DrawingAnnotation {
  const filteredStrokes = annotation.strokes.filter(
    stroke => !isPointNearStroke(erasePoint, stroke, eraseRadius)
  );
  
  return {
    ...annotation,
    strokes: filteredStrokes,
    updatedAt: Date.now(),
  };
}

// ============================================================================
// Export
// ============================================================================

export default {
  DRAWING_COLORS,
  STROKE_WIDTHS,
  DEFAULT_DRAWING_CONFIG,
  createArrowStroke,
  createCircleStroke,
  createZoneStroke,
  createFreehandStroke,
  simplifyPath,
  smoothPath,
  renderStroke,
  renderDrawingAnnotation,
  isPointNearStroke,
  getStrokeBounds,
  getDrawingBounds,
  eraseStrokes,
  calculateArrowHead,
};
