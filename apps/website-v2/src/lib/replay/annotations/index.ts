/**
 * Annotation System Module
 * Main entry point for replay annotation functionality
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-F
 * Team: Replay 2.0 Core (TL-S2)
 */

// Export types
export * from './types';

// Export state management
export {
  useAnnotationStore,
  useAnnotationSet,
  useActiveTool,
  useToolConfig,
  useTextStyle,
  useSelectedAnnotation,
  useIsDrawing,
  useIsRecording,
  useShowAnnotations,
  useAnnotationOpacity,
  useCanUndo,
  useCanRedo,
  type AnnotationStore,
  type AnnotationState,
  type AnnotationActions,
  type AnnotationTool,
} from './state';

// Export drawing system
export {
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
} from './drawing';

// Export text system
export {
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
} from './text';

// Export voice notes system
export {
  RECORDING_CONFIG,
  WAVEFORM_CONFIG,
  initRecording,
  startRecording,
  stopRecording,
  pauseRecording,
  resumeRecording,
  generateWaveformData,
  generateWaveformFromBlob,
  getAudioLevel,
  getRealtimeWaveform,
  renderWaveform,
  renderCircularWaveform,
  createAudioElement,
  playAudio,
  pauseAudio,
  seekAudio,
  setAudioVolume,
  setAudioPlaybackRate,
  createVoiceAnnotation,
  updateWaveformData,
} from './voiceNotes';

// Export system
export {
  EXPORT_PRESETS,
  exportToJSON,
  importFromJSON,
  exportToVideo,
  exportToImageSequence,
  exportOverlay,
  renderAnnotationsToCanvas,
  downloadExport,
  exportAnnotations,
  type VideoExportProgress,
  type VideoExportCallback,
} from './export';

// Re-export utility functions from types
export {
  generateAnnotationId,
  generateLayerId,
  generateStrokeId,
  isDrawingAnnotation,
  isTextAnnotation,
  isVoiceAnnotation,
  DEFAULT_TOOL_CONFIG,
  DEFAULT_TEXT_STYLE,
} from './types';
