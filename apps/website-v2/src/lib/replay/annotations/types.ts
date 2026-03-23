/**
 * Annotation System Types
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-F
 * Team: Replay 2.0 Core (TL-S2)
 */

import type { Position2D } from '../types';

// ============================================================================
// Core Annotation Types
// ============================================================================

export type AnnotationType = 'drawing' | 'text' | 'voice';

export type DrawingTool = 'arrow' | 'circle' | 'zone' | 'freehand' | 'eraser';

export interface AnnotationBase {
  id: string;
  type: AnnotationType;
  timestamp: number;
  duration: number;
  author: string;
  createdAt: number;
  updatedAt: number;
  visible: boolean;
  opacity: number;
}

// ============================================================================
// Drawing Annotations
// ============================================================================

export interface DrawingPoint extends Position2D {
  pressure?: number;
}

export interface DrawingStroke {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
  tool: DrawingTool;
}

export interface DrawingAnnotation extends AnnotationBase {
  type: 'drawing';
  strokes: DrawingStroke[];
  tool: DrawingTool;
  color: string;
  strokeWidth: number;
  canvasBounds: {
    width: number;
    height: number;
  };
}

export interface ArrowDrawing extends DrawingStroke {
  tool: 'arrow';
  start: Position2D;
  end: Position2D;
  headSize: number;
}

export interface CircleDrawing extends DrawingStroke {
  tool: 'circle' | 'zone';
  center: Position2D;
  radius: number;
  filled: boolean;
}

// ============================================================================
// Text Annotations
// ============================================================================

export type TextAlignment = 'left' | 'center' | 'right';

export interface TextStyle {
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold' | 'lighter' | number;
  color: string;
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  padding: number;
  borderRadius: number;
  alignment: TextAlignment;
}

export interface TextAnnotation extends AnnotationBase {
  type: 'text';
  text: string;
  position: Position2D;
  style: TextStyle;
  rotation: number;
  scale: number;
}

// ============================================================================
// Voice Annotations
// ============================================================================

export type VoiceNoteStatus = 'recording' | 'processing' | 'ready' | 'error';

export interface AudioData {
  blob: Blob;
  url: string;
  duration: number;
  sampleRate: number;
  channels: number;
}

export interface WaveformData {
  peaks: number[];
  sampleRate: number;
  duration: number;
}

export interface VoiceAnnotation extends AnnotationBase {
  type: 'voice';
  audioData?: AudioData;
  waveformData?: WaveformData;
  transcript?: string;
  status: VoiceNoteStatus;
  volume: number;
  playbackRate: number;
}

// ============================================================================
// Annotation Collections
// ============================================================================

export type Annotation = DrawingAnnotation | TextAnnotation | VoiceAnnotation;

export interface AnnotationLayer {
  id: string;
  name: string;
  annotations: Annotation[];
  visible: boolean;
  locked: boolean;
  opacity: number;
  createdAt: number;
  updatedAt: number;
}

export interface AnnotationSet {
  id: string;
  replayId: string;
  matchId: string;
  layers: AnnotationLayer[];
  activeLayerId: string | null;
  createdAt: number;
  updatedAt: number;
  author: string;
  version: number;
}

// ============================================================================
// Tool Configuration
// ============================================================================

export interface ToolConfig {
  tool: DrawingTool;
  color: string;
  strokeWidth: number;
  opacity: number;
  filled: boolean;
}

export const DEFAULT_TOOL_CONFIG: ToolConfig = {
  tool: 'arrow',
  color: '#FF4655',
  strokeWidth: 3,
  opacity: 1,
  filled: false,
};

export const DEFAULT_TEXT_STYLE: TextStyle = {
  fontFamily: 'Inter, system-ui, sans-serif',
  fontSize: 16,
  fontWeight: 'bold',
  color: '#FFFFFF',
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  padding: 8,
  borderRadius: 4,
  alignment: 'left',
};

// ============================================================================
// History/Undo Types
// ============================================================================

export interface HistoryState {
  annotations: Annotation[];
  timestamp: number;
  action: string;
}

export interface AnnotationHistory {
  past: HistoryState[];
  present: HistoryState;
  future: HistoryState[];
  maxHistory: number;
}

// ============================================================================
// Export Types
// ============================================================================

export type ExportFormat = 'json' | 'video' | 'image-sequence' | 'overlay';

export interface ExportOptions {
  format: ExportFormat;
  includeAudio: boolean;
  includeAnnotations: boolean;
  quality: 'low' | 'medium' | 'high';
  fps: number;
  resolution: {
    width: number;
    height: number;
  };
  timeRange?: {
    start: number;
    end: number;
  };
  burnAnnotations: boolean;
}

export interface ExportResult {
  success: boolean;
  url?: string;
  blob?: Blob;
  error?: string;
  metadata?: {
    duration: number;
    fileSize: number;
    format: string;
  };
}

// ============================================================================
// Event Types
// ============================================================================

export type AnnotationEventType = 
  | 'annotation:created'
  | 'annotation:updated'
  | 'annotation:deleted'
  | 'annotation:selected'
  | 'layer:created'
  | 'layer:updated'
  | 'layer:deleted'
  | 'drawing:started'
  | 'drawing:ended'
  | 'voice:recording'
  | 'voice:stopped'
  | 'voice:playing'
  | 'voice:paused';

export interface AnnotationEvent {
  type: AnnotationEventType;
  annotationId?: string;
  layerId?: string;
  timestamp: number;
  data?: unknown;
}

// ============================================================================
// Validation Functions
// ============================================================================

export function isDrawingAnnotation(annotation: Annotation): annotation is DrawingAnnotation {
  return annotation.type === 'drawing';
}

export function isTextAnnotation(annotation: Annotation): annotation is TextAnnotation {
  return annotation.type === 'text';
}

export function isVoiceAnnotation(annotation: Annotation): annotation is VoiceAnnotation {
  return annotation.type === 'voice';
}

export function generateAnnotationId(): string {
  return `ann-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateLayerId(): string {
  return `layer-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function generateStrokeId(): string {
  return `stroke-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}
