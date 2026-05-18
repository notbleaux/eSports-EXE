// @ts-nocheck
/**
 * Annotation State Management
 * Zustand-based store for annotation state
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-F
 * Team: Replay 2.0 Core (TL-S2)
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type {
  Annotation,
  AnnotationLayer,
  AnnotationSet,
  DrawingAnnotation,
  TextAnnotation,
  VoiceAnnotation,
  DrawingTool,
  ToolConfig,
  TextStyle,
  HistoryState,
  AnnotationHistory,
} from './types';
import {
  generateAnnotationId,
  generateLayerId,
  DEFAULT_TOOL_CONFIG,
  DEFAULT_TEXT_STYLE,
  isDrawingAnnotation,
  isTextAnnotation,
  isVoiceAnnotation,
} from './types';

// ============================================================================
// State Types
// ============================================================================

export type AnnotationTool = DrawingTool | 'text' | 'voice' | 'select';

export interface AnnotationState {
  // Current annotation set
  annotationSet: AnnotationSet | null;
  
  // Tool state
  activeTool: AnnotationTool;
  toolConfig: ToolConfig;
  textStyle: TextStyle;
  
  // Selection state
  selectedAnnotationId: string | null;
  hoveredAnnotationId: string | null;
  
  // Drawing state
  isDrawing: boolean;
  currentStroke: DrawingAnnotation | null;
  
  // Voice state
  isRecording: boolean;
  recordingStartTime: number;
  currentVoiceNote: VoiceAnnotation | null;
  
  // History for undo/redo
  history: AnnotationHistory;
  
  // UI state
  showAnnotations: boolean;
  annotationOpacity: number;
  snapToGrid: boolean;
  gridSize: number;
}

export interface AnnotationActions {
  // Annotation Set Management
  createAnnotationSet: (replayId: string, matchId: string, author: string) => void;
  loadAnnotationSet: (annotationSet: AnnotationSet) => void;
  clearAnnotationSet: () => void;
  
  // Layer Management
  createLayer: (name?: string) => string;
  deleteLayer: (layerId: string) => void;
  setActiveLayer: (layerId: string) => void;
  toggleLayerVisibility: (layerId: string) => void;
  toggleLayerLock: (layerId: string) => void;
  reorderLayers: (layerIds: string[]) => void;
  renameLayer: (layerId: string, name: string) => void;
  setLayerOpacity: (layerId: string, opacity: number) => void;
  
  // Annotation CRUD
  addAnnotation: (annotation: Omit<Annotation, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  deleteAnnotation: (id: string) => void;
  selectAnnotation: (id: string | null) => void;
  hoverAnnotation: (id: string | null) => void;
  
  // Drawing Operations
  startDrawing: (timestamp: number, canvasBounds: { width: number; height: number }) => void;
  addDrawingPoint: (x: number, y: number, pressure?: number) => void;
  endDrawing: () => void;
  setDrawingTool: (tool: DrawingTool) => void;
  setToolColor: (color: string) => void;
  setStrokeWidth: (width: number) => void;
  
  // Text Operations
  addTextAnnotation: (text: string, x: number, y: number, timestamp: number) => string;
  updateTextStyle: (updates: Partial<TextStyle>) => void;
  updateTextContent: (id: string, text: string) => void;
  moveTextAnnotation: (id: string, x: number, y: number) => void;
  rotateTextAnnotation: (id: string, rotation: number) => void;
  scaleTextAnnotation: (id: string, scale: number) => void;
  
  // Voice Operations
  startRecording: (timestamp: number) => void;
  stopRecording: () => void;
  addVoiceAnnotation: (voiceNote: Omit<VoiceAnnotation, 'id' | 'createdAt' | 'updatedAt'>) => string;
  updateVoiceAnnotation: (id: string, updates: Partial<VoiceAnnotation>) => void;
  deleteVoiceAnnotation: (id: string) => void;
  setVoiceVolume: (id: string, volume: number) => void;
  setVoicePlaybackRate: (id: string, rate: number) => void;
  
  // History Operations
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  snapshot: (action: string) => void;
  
  // Visibility & Display
  toggleAnnotations: () => void;
  setAnnotationOpacity: (opacity: number) => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  
  // Getters
  getActiveLayer: () => AnnotationLayer | null;
  getAnnotationById: (id: string) => Annotation | null;
  getAnnotationsAtTime: (timestamp: number) => Annotation[];
  getVisibleAnnotations: () => Annotation[];
  
  // Import/Export
  exportAnnotations: () => AnnotationSet | null;
  importAnnotations: (data: AnnotationSet) => void;
}

export type AnnotationStore = AnnotationState & AnnotationActions;

// ============================================================================
// Helper Functions
// ============================================================================

const createEmptyHistory = (): AnnotationHistory => ({
  past: [],
  present: { annotations: [], timestamp: Date.now(), action: 'init' },
  future: [],
  maxHistory: 50,
});

const createDefaultAnnotationSet = (replayId: string, matchId: string, author: string): AnnotationSet => ({
  id: `set-${Date.now()}`,
  replayId,
  matchId,
  layers: [
    {
      id: generateLayerId(),
      name: 'Layer 1',
      annotations: [],
      visible: true,
      locked: false,
      opacity: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ],
  activeLayerId: null,
  createdAt: Date.now(),
  updatedAt: Date.now(),
  author,
  version: 1,
});

// ============================================================================
// Store Creation
// ============================================================================

const initialState: AnnotationState = {
  annotationSet: null,
  activeTool: 'select',
  toolConfig: { ...DEFAULT_TOOL_CONFIG },
  textStyle: { ...DEFAULT_TEXT_STYLE },
  selectedAnnotationId: null,
  hoveredAnnotationId: null,
  isDrawing: false,
  currentStroke: null,
  isRecording: false,
  recordingStartTime: 0,
  currentVoiceNote: null,
  history: createEmptyHistory(),
  showAnnotations: true,
  annotationOpacity: 1,
  snapToGrid: false,
  gridSize: 10,
};

export const useAnnotationStore = create<AnnotationStore>()(
  subscribeWithSelector(
    immer((set, get) => ({
      ...initialState,

      // Annotation Set Management
      createAnnotationSet: (replayId: string, matchId: string, author: string) => {
        const annotationSet = createDefaultAnnotationSet(replayId, matchId, author);
        annotationSet.activeLayerId = annotationSet.layers[0].id;
        
        set(draft => {
          draft.annotationSet = annotationSet;
        });
        
        get().snapshot('create annotation set');
      },

      loadAnnotationSet: (annotationSet: AnnotationSet) => {
        set(draft => {
          draft.annotationSet = annotationSet;
          if (annotationSet.layers.length > 0 && !annotationSet.activeLayerId) {
            draft.annotationSet!.activeLayerId = annotationSet.layers[0].id;
          }
        });
        get().snapshot('load annotation set');
      },

      clearAnnotationSet: () => {
        set(draft => {
          draft.annotationSet = null;
          draft.history = createEmptyHistory();
        });
      },

      // Layer Management
      createLayer: (name?: string): string => {
        const id = generateLayerId();
        const layerName = name || `Layer ${(get().annotationSet?.layers.length || 0) + 1}`;
        
        set(draft => {
          if (draft.annotationSet) {
            draft.annotationSet.layers.unshift({
              id,
              name: layerName,
              annotations: [],
              visible: true,
              locked: false,
              opacity: 1,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            });
            draft.annotationSet.activeLayerId = id;
            draft.annotationSet.updatedAt = Date.now();
          }
        });
        
        get().snapshot('create layer');
        return id;
      },

      deleteLayer: (layerId: string) => {
        set(draft => {
          if (draft.annotationSet) {
            draft.annotationSet.layers = draft.annotationSet.layers.filter(l => l.id !== layerId);
            if (draft.annotationSet.activeLayerId === layerId) {
              draft.annotationSet.activeLayerId = draft.annotationSet.layers[0]?.id || null;
            }
            draft.annotationSet.updatedAt = Date.now();
          }
        });
        get().snapshot('delete layer');
      },

      setActiveLayer: (layerId: string) => {
        set(draft => {
          if (draft.annotationSet) {
            draft.annotationSet.activeLayerId = layerId;
          }
        });
      },

      toggleLayerVisibility: (layerId: string) => {
        set(draft => {
          const layer = draft.annotationSet?.layers.find(l => l.id === layerId);
          if (layer) {
            layer.visible = !layer.visible;
            layer.updatedAt = Date.now();
          }
        });
      },

      toggleLayerLock: (layerId: string) => {
        set(draft => {
          const layer = draft.annotationSet?.layers.find(l => l.id === layerId);
          if (layer) {
            layer.locked = !layer.locked;
            layer.updatedAt = Date.now();
          }
        });
      },

      reorderLayers: (layerIds: string[]) => {
        set(draft => {
          if (draft.annotationSet) {
            const layerMap = new Map(draft.annotationSet.layers.map(l => [l.id, l]));
            draft.annotationSet.layers = layerIds
              .map(id => layerMap.get(id))
              .filter((l): l is AnnotationLayer => l !== undefined);
            draft.annotationSet.updatedAt = Date.now();
          }
        });
        get().snapshot('reorder layers');
      },

      renameLayer: (layerId: string, name: string) => {
        set(draft => {
          const layer = draft.annotationSet?.layers.find(l => l.id === layerId);
          if (layer) {
            layer.name = name;
            layer.updatedAt = Date.now();
            if (draft.annotationSet) {
              draft.annotationSet.updatedAt = Date.now();
            }
          }
        });
      },

      setLayerOpacity: (layerId: string, opacity: number) => {
        set(draft => {
          const layer = draft.annotationSet?.layers.find(l => l.id === layerId);
          if (layer) {
            layer.opacity = Math.max(0, Math.min(1, opacity));
            layer.updatedAt = Date.now();
          }
        });
      },

      // Annotation CRUD
      addAnnotation: (annotation): string => {
        const id = generateAnnotationId();
        const now = Date.now();
        const activeLayer = get().getActiveLayer();
        
        if (!activeLayer || activeLayer.locked) {
          return '';
        }
        
        const newAnnotation = {
          ...annotation,
          id,
          createdAt: now,
          updatedAt: now,
        } as Annotation;
        
        set(draft => {
          const layer = draft.annotationSet?.layers.find(l => l.id === activeLayer.id);
          if (layer) {
            layer.annotations.push(newAnnotation);
            layer.updatedAt = now;
            if (draft.annotationSet) {
              draft.annotationSet.updatedAt = now;
            }
          }
        });
        
        get().snapshot('add annotation');
        return id;
      },

      updateAnnotation: (id: string, updates: Partial<Annotation>) => {
        set(draft => {
          for (const layer of draft.annotationSet?.layers || []) {
            const annotation = layer.annotations.find(a => a.id === id);
            if (annotation) {
              Object.assign(annotation, { ...updates, updatedAt: Date.now() });
              layer.updatedAt = Date.now();
              if (draft.annotationSet) {
                draft.annotationSet.updatedAt = Date.now();
              }
              break;
            }
          }
        });
      },

      deleteAnnotation: (id: string) => {
        set(draft => {
          for (const layer of draft.annotationSet?.layers || []) {
            const index = layer.annotations.findIndex(a => a.id === id);
            if (index !== -1) {
              layer.annotations.splice(index, 1);
              layer.updatedAt = Date.now();
              if (draft.annotationSet) {
                draft.annotationSet.updatedAt = Date.now();
              }
              break;
            }
          }
          if (draft.selectedAnnotationId === id) {
            draft.selectedAnnotationId = null;
          }
        });
        get().snapshot('delete annotation');
      },

      selectAnnotation: (id: string | null) => {
        set(draft => {
          draft.selectedAnnotationId = id;
        });
      },

      hoverAnnotation: (id: string | null) => {
        set(draft => {
          draft.hoveredAnnotationId = id;
        });
      },

      // Drawing Operations
      startDrawing: (timestamp: number, canvasBounds: { width: number; height: number }) => {
        const state = get();
        if (state.activeTool === 'select' || state.activeTool === 'text' || state.activeTool === 'voice') {
          return;
        }
        
        set(draft => {
          draft.isDrawing = true;
          draft.currentStroke = {
            id: generateAnnotationId(),
            type: 'drawing',
            timestamp,
            duration: 0,
            author: draft.annotationSet?.author || 'unknown',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            visible: true,
            opacity: draft.toolConfig.opacity,
            strokes: [],
            tool: draft.toolConfig.tool,
            color: draft.toolConfig.color,
            strokeWidth: draft.toolConfig.strokeWidth,
            canvasBounds,
          };
        });
      },

      addDrawingPoint: (x: number, y: number, pressure?: number) => {
        set(draft => {
          if (!draft.isDrawing || !draft.currentStroke) return;
          
          // Apply grid snapping if enabled
          let finalX = x;
          let finalY = y;
          if (draft.snapToGrid && draft.gridSize > 0) {
            finalX = Math.round(x / draft.gridSize) * draft.gridSize;
            finalY = Math.round(y / draft.gridSize) * draft.gridSize;
          }
          
          // Add point to current stroke
          const stroke = draft.currentStroke;
          if (stroke.strokes.length === 0) {
            stroke.strokes.push({
              id: generateAnnotationId(),
              points: [{ x: finalX, y: finalY, pressure }],
              color: draft.toolConfig.color,
              width: draft.toolConfig.strokeWidth,
              tool: draft.toolConfig.tool,
            });
          } else {
            stroke.strokes[0].points.push({ x: finalX, y: finalY, pressure });
          }
        });
      },

      endDrawing: () => {
        const state = get();
        if (!state.isDrawing || !state.currentStroke) return;
        
        const stroke = state.currentStroke;
        if (stroke.strokes.length > 0 && stroke.strokes[0].points.length > 1) {
          get().addAnnotation(stroke);
        }
        
        set(draft => {
          draft.isDrawing = false;
          draft.currentStroke = null;
        });
      },

      setDrawingTool: (tool: DrawingTool) => {
        set(draft => {
          draft.toolConfig.tool = tool;
          draft.activeTool = tool;
        });
      },

      setToolColor: (color: string) => {
        set(draft => {
          draft.toolConfig.color = color;
          draft.textStyle.color = color;
        });
      },

      setStrokeWidth: (width: number) => {
        set(draft => {
          draft.toolConfig.strokeWidth = width;
        });
      },

      // Text Operations
      addTextAnnotation: (text: string, x: number, y: number, timestamp: number): string => {
        return get().addAnnotation({
          type: 'text',
          timestamp,
          duration: 5000, // Default 5 second duration
          author: get().annotationSet?.author || 'unknown',
          visible: true,
          opacity: 1,
          text,
          position: { x, y },
          style: { ...get().textStyle },
          rotation: 0,
          scale: 1,
        } as Omit<TextAnnotation, 'id' | 'createdAt' | 'updatedAt'>);
      },

      updateTextStyle: (updates: Partial<TextStyle>) => {
        set(draft => {
          Object.assign(draft.textStyle, updates);
        });
      },

      updateTextContent: (id: string, text: string) => {
        get().updateAnnotation(id, { text } as Partial<TextAnnotation>);
      },

      moveTextAnnotation: (id: string, x: number, y: number) => {
        const state = get();
        let finalX = x;
        let finalY = y;
        
        if (state.snapToGrid && state.gridSize > 0) {
          finalX = Math.round(x / state.gridSize) * state.gridSize;
          finalY = Math.round(y / state.gridSize) * state.gridSize;
        }
        
        get().updateAnnotation(id, { position: { x: finalX, y: finalY } } as Partial<TextAnnotation>);
      },

      rotateTextAnnotation: (id: string, rotation: number) => {
        get().updateAnnotation(id, { rotation } as Partial<TextAnnotation>);
      },

      scaleTextAnnotation: (id: string, scale: number) => {
        get().updateAnnotation(id, { scale: Math.max(0.1, scale) } as Partial<TextAnnotation>);
      },

      // Voice Operations
      startRecording: (timestamp: number) => {
        set(draft => {
          draft.isRecording = true;
          draft.recordingStartTime = Date.now();
          draft.currentVoiceNote = {
            id: generateAnnotationId(),
            type: 'voice',
            timestamp,
            duration: 0,
            author: draft.annotationSet?.author || 'unknown',
            createdAt: Date.now(),
            updatedAt: Date.now(),
            visible: true,
            opacity: 1,
            status: 'recording',
            volume: 1,
            playbackRate: 1,
          };
        });
      },

      stopRecording: () => {
        set(draft => {
          draft.isRecording = false;
          if (draft.currentVoiceNote) {
            draft.currentVoiceNote.duration = Date.now() - draft.recordingStartTime;
            draft.currentVoiceNote.status = 'processing';
          }
        });
      },

      addVoiceAnnotation: (voiceNote): string => {
        return get().addAnnotation(voiceNote);
      },

      updateVoiceAnnotation: (id: string, updates: Partial<VoiceAnnotation>) => {
        get().updateAnnotation(id, updates);
      },

      deleteVoiceAnnotation: (id: string) => {
        get().deleteAnnotation(id);
      },

      setVoiceVolume: (id: string, volume: number) => {
        get().updateAnnotation(id, { volume: Math.max(0, Math.min(1, volume)) });
      },

      setVoicePlaybackRate: (id: string, rate: number) => {
        get().updateAnnotation(id, { playbackRate: Math.max(0.5, Math.min(2, rate)) });
      },

      // History Operations
      undo: () => {
        set(draft => {
          const { past, present, future } = draft.history;
          if (past.length === 0) return;
          
          const previous = past[past.length - 1];
          draft.history.past = past.slice(0, -1);
          draft.history.future = [present, ...future];
          draft.history.present = previous;
          
          // Restore annotations from history
          if (draft.annotationSet && draft.annotationSet.layers.length > 0) {
            draft.annotationSet.layers[0].annotations = [...previous.annotations];
          }
        });
      },

      redo: () => {
        set(draft => {
          const { past, present, future } = draft.history;
          if (future.length === 0) return;
          
          const next = future[0];
          draft.history.future = future.slice(1);
          draft.history.past = [...past, present];
          draft.history.present = next;
          
          // Restore annotations from history
          if (draft.annotationSet && draft.annotationSet.layers.length > 0) {
            draft.annotationSet.layers[0].annotations = [...next.annotations];
          }
        });
      },

      canUndo: () => {
        return get().history.past.length > 0;
      },

      canRedo: () => {
        return get().history.future.length > 0;
      },

      snapshot: (action: string) => {
        set(draft => {
          const allAnnotations = draft.annotationSet?.layers.flatMap(l => l.annotations) || [];
          const newState: HistoryState = {
            annotations: [...allAnnotations],
            timestamp: Date.now(),
            action,
          };
          
          draft.history.past = [...draft.history.past, draft.history.present].slice(-draft.history.maxHistory);
          draft.history.present = newState;
          draft.history.future = [];
        });
      },

      // Visibility & Display
      toggleAnnotations: () => {
        set(draft => {
          draft.showAnnotations = !draft.showAnnotations;
        });
      },

      setAnnotationOpacity: (opacity: number) => {
        set(draft => {
          draft.annotationOpacity = Math.max(0, Math.min(1, opacity));
        });
      },

      toggleSnapToGrid: () => {
        set(draft => {
          draft.snapToGrid = !draft.snapToGrid;
        });
      },

      setGridSize: (size: number) => {
        set(draft => {
          draft.gridSize = Math.max(1, size);
        });
      },

      // Getters
      getActiveLayer: () => {
        const { annotationSet } = get();
        if (!annotationSet) return null;
        return annotationSet.layers.find(l => l.id === annotationSet.activeLayerId) || null;
      },

      getAnnotationById: (id: string) => {
        const { annotationSet } = get();
        if (!annotationSet) return null;
        
        for (const layer of annotationSet.layers) {
          const annotation = layer.annotations.find(a => a.id === id);
          if (annotation) return annotation;
        }
        return null;
      },

      getAnnotationsAtTime: (timestamp: number) => {
        const { annotationSet } = get();
        if (!annotationSet) return [];
        
        return annotationSet.layers
          .filter(l => l.visible)
          .flatMap(l => l.annotations)
          .filter(a => {
            if (!a.visible) return false;
            return timestamp >= a.timestamp && timestamp <= a.timestamp + a.duration;
          });
      },

      getVisibleAnnotations: () => {
        const { annotationSet } = get();
        if (!annotationSet) return [];
        
        return annotationSet.layers
          .filter(l => l.visible)
          .flatMap(l => l.annotations)
          .filter(a => a.visible);
      },

      // Import/Export
      exportAnnotations: () => {
        return get().annotationSet;
      },

      importAnnotations: (data: AnnotationSet) => {
        set(draft => {
          draft.annotationSet = data;
        });
        get().snapshot('import annotations');
      },
    }))
  )
);

// ============================================================================
// Selectors
// ============================================================================

export const useAnnotationSet = () => useAnnotationStore(state => state.annotationSet);
export const useActiveTool = () => useAnnotationStore(state => state.activeTool);
export const useToolConfig = () => useAnnotationStore(state => state.toolConfig);
export const useTextStyle = () => useAnnotationStore(state => state.textStyle);
export const useSelectedAnnotation = () => useAnnotationStore(state => 
  state.selectedAnnotationId ? state.getAnnotationById(state.selectedAnnotationId) : null
);
export const useIsDrawing = () => useAnnotationStore(state => state.isDrawing);
export const useIsRecording = () => useAnnotationStore(state => state.isRecording);
export const useShowAnnotations = () => useAnnotationStore(state => state.showAnnotations);
export const useAnnotationOpacity = () => useAnnotationStore(state => state.annotationOpacity);
export const useCanUndo = () => useAnnotationStore(state => state.canUndo());
export const useCanRedo = () => useAnnotationStore(state => state.canRedo());

export default useAnnotationStore;
