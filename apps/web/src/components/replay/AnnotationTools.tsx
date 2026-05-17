// @ts-nocheck
/**
 * Annotation Tools Component
 * Toolbar for drawing, text, and voice annotations
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-F
 * Team: Replay 2.0 Core (TL-S2)
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import {
  MousePointer2,
  Pencil,
  Circle,
  Square,
  ArrowRight,
  Type,
  Mic,
  MicOff,
  Undo2,
  Redo2,
  Trash2,
  Download,
  Upload,
  Eye,
  EyeOff,
  Grid3X3,
  Palette,
  Minus,
  Plus,
  X,
  Check,
  ChevronDown,
  Layers,
  Play,
  Pause,
  Volume2,
} from 'lucide-react';
import { useAnnotationStore } from '../../lib/replay/annotations/state';
import {
  DRAWING_COLORS,
  STROKE_WIDTHS,
  FONT_SIZES,
  TEXT_PRESETS,
  type AnnotationTool,
  type DrawingTool,
} from '../../lib/replay/annotations';

// Utility for tailwind class merging
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ============================================================================
// Types
// ============================================================================

interface AnnotationToolsProps {
  className?: string;
  onExport?: () => void;
}

interface ColorPickerProps {
  colors: string[];
  selectedColor: string;
  onSelect: (color: string) => void;
}

interface StrokeWidthPickerProps {
  widths: number[];
  selectedWidth: number;
  onSelect: (width: number) => void;
}

// ============================================================================
// Color Picker Component
// ============================================================================

const ColorPicker: React.FC<ColorPickerProps> = ({ colors, selectedColor, onSelect }) => {
  const [customColor, setCustomColor] = useState(selectedColor);
  const [showCustom, setShowCustom] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {colors.map((color) => (
          <button
            key={color}
            onClick={() => onSelect(color)}
            className={cn(
              'w-6 h-6 rounded-full border-2 transition-all',
              selectedColor === color
                ? 'border-white scale-110 shadow-lg'
                : 'border-transparent hover:scale-105'
            )}
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
        <button
          onClick={() => setShowCustom(!showCustom)}
          className={cn(
            'w-6 h-6 rounded-full border-2 border-dashed border-gray-400 flex items-center justify-center transition-all',
            showCustom && 'border-white bg-gray-700'
          )}
          title="Custom color"
        >
          <Plus className="w-3 h-3 text-gray-400" />
        </button>
      </div>
      {showCustom && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              onSelect(e.target.value);
            }}
            className="w-8 h-8 rounded cursor-pointer"
          />
          <input
            type="text"
            value={customColor}
            onChange={(e) => {
              setCustomColor(e.target.value);
              onSelect(e.target.value);
            }}
            className="flex-1 px-2 py-1 text-xs bg-gray-800 border border-gray-700 rounded text-white"
            placeholder="#FF4655"
          />
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Stroke Width Picker Component
// ============================================================================

const StrokeWidthPicker: React.FC<StrokeWidthPickerProps> = ({ widths, selectedWidth, onSelect }) => {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400">Width:</span>
      <div className="flex items-center gap-1">
        {widths.map((width) => (
          <button
            key={width}
            onClick={() => onSelect(width)}
            className={cn(
              'w-8 h-8 rounded flex items-center justify-center transition-all',
              selectedWidth === width
                ? 'bg-gray-700 ring-1 ring-white'
                : 'hover:bg-gray-800'
            )}
            title={`${width}px`}
          >
            <div
              className="rounded-full bg-current"
              style={{ width: Math.min(width * 2, 20), height: Math.min(width * 2, 20) }}
            />
          </button>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Text Style Panel Component
// ============================================================================

const TextStylePanel: React.FC = () => {
  const textStyle = useAnnotationStore((state) => state.textStyle);
  const updateTextStyle = useAnnotationStore((state) => state.updateTextStyle);

  return (
    <div className="flex flex-col gap-3 p-3 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-300">Font Size</span>
        <select
          value={textStyle.fontSize}
          onChange={(e) => updateTextStyle({ fontSize: parseInt(e.target.value) })}
          className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded text-white"
        >
          {FONT_SIZES.map((size) => (
            <option key={size} value={size}>
              {size}px
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-300">Weight</span>
        <div className="flex gap-1">
          {['normal', 'bold'].map((weight) => (
            <button
              key={weight}
              onClick={() => updateTextStyle({ fontWeight: weight as 'normal' | 'bold' })}
              className={cn(
                'px-2 py-1 text-xs rounded transition-all',
                textStyle.fontWeight === weight
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
            >
              {weight === 'bold' ? 'B' : 'N'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-300">Alignment</span>
        <div className="flex gap-1">
          {['left', 'center', 'right'].map((align) => (
            <button
              key={align}
              onClick={() => updateTextStyle({ alignment: align as 'left' | 'center' | 'right' })}
              className={cn(
                'px-2 py-1 text-xs rounded transition-all capitalize',
                textStyle.alignment === align
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              )}
            >
              {align[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-gray-300">Presets</span>
        <div className="grid grid-cols-2 gap-1">
          {TEXT_PRESETS.slice(0, 4).map((preset) => (
            <button
              key={preset.name}
              onClick={() => updateTextStyle(preset.style)}
              className="px-2 py-1.5 text-xs rounded bg-gray-700 hover:bg-gray-600 transition-colors"
              style={{
                color: preset.style.color,
                backgroundColor: preset.style.backgroundColor,
              }}
            >
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// Voice Recorder Component
// ============================================================================

const VoiceRecorder: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const animationRef = useRef<number | null>(null);

  const startRecording = useAnnotationStore((state) => state.startRecording);
  const stopRecording = useAnnotationStore((state) => state.stopRecording);
  const currentTime = 0; // Would come from timeline store

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  const handleStartRecording = useCallback(() => {
    setIsRecording(true);
    setRecordingTime(0);
    startRecording(currentTime);

    intervalRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);

    // Simulate audio level animation
    const animateLevel = () => {
      setAudioLevel(Math.random() * 0.5 + 0.3);
      animationRef.current = requestAnimationFrame(animateLevel);
    };
    animateLevel();
  }, [currentTime, startRecording]);

  const handleStopRecording = useCallback(() => {
    setIsRecording(false);
    stopRecording();

    if (intervalRef.current) clearInterval(intervalRef.current);
    if (animationRef.current) cancelAnimationFrame(animationRef.current);
    setRecordingTime(0);
    setAudioLevel(0);
  }, [stopRecording]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-gray-800 rounded-lg">
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={isRecording ? handleStopRecording : handleStartRecording}
          className={cn(
            'w-14 h-14 rounded-full flex items-center justify-center transition-all',
            isRecording
              ? 'bg-red-500 hover:bg-red-600 animate-pulse'
              : 'bg-blue-600 hover:bg-blue-700'
          )}
        >
          {isRecording ? (
            <Square className="w-5 h-5 text-white fill-white" />
          ) : (
            <Mic className="w-6 h-6 text-white" />
          )}
        </button>
      </div>

      {isRecording && (
        <div className="flex flex-col items-center gap-2">
          <span className="text-lg font-mono text-red-400">{formatTime(recordingTime)}</span>
          <div className="flex items-center gap-0.5 h-8">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-red-500 rounded-full transition-all duration-75"
                style={{
                  height: `${Math.random() * audioLevel * 100}%`,
                  opacity: 0.3 + (i / 20) * 0.7,
                }}
              />
            ))}
          </div>
          <span className="text-xs text-gray-400">Recording...</span>
        </div>
      )}

      {!isRecording && (
        <p className="text-xs text-center text-gray-400">
          Click the microphone to start recording
        </p>
      )}
    </div>
  );
};

// ============================================================================
// Layer Panel Component
// ============================================================================

const LayerPanel: React.FC = () => {
  const annotationSet = useAnnotationStore((state) => state.annotationSet);
  const activeLayer = useAnnotationStore((state) => state.getActiveLayer());
  const createLayer = useAnnotationStore((state) => state.createLayer);
  const setActiveLayer = useAnnotationStore((state) => state.setActiveLayer);
  const toggleLayerVisibility = useAnnotationStore((state) => state.toggleLayerVisibility);
  const toggleLayerLock = useAnnotationStore((state) => state.toggleLayerLock);
  const deleteLayer = useAnnotationStore((state) => state.deleteLayer);
  const renameLayer = useAnnotationStore((state) => state.renameLayer);
  const [editingLayerId, setEditingLayerId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');

  if (!annotationSet) {
    return (
      <div className="p-3 text-center text-gray-400 text-sm">
        No annotation set loaded
      </div>
    );
  }

  const handleRename = (layerId: string, newName: string) => {
    renameLayer(layerId, newName);
    setEditingLayerId(null);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between px-1">
        <span className="text-xs font-medium text-gray-300 flex items-center gap-1">
          <Layers className="w-3 h-3" />
          Layers ({annotationSet.layers.length})
        </span>
        <button
          onClick={() => createLayer()}
          className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          title="Add layer"
        >
          <Plus className="w-3 h-3" />
        </button>
      </div>

      <div className="flex flex-col gap-1 max-h-40 overflow-y-auto">
        {annotationSet.layers.map((layer, index) => (
          <div
            key={layer.id}
            className={cn(
              'flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-all',
              activeLayer?.id === layer.id
                ? 'bg-blue-600/30 border border-blue-500/50'
                : 'hover:bg-gray-800'
            )}
          >
            <button
              onClick={() => toggleLayerVisibility(layer.id)}
              className={cn(
                'transition-colors',
                layer.visible ? 'text-gray-300' : 'text-gray-600'
              )}
            >
              {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            </button>

            <div className="flex-1 min-w-0">
              {editingLayerId === layer.id ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRename(layer.id, editName)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRename(layer.id, editName);
                    if (e.key === 'Escape') setEditingLayerId(null);
                  }}
                  autoFocus
                  className="w-full px-1 py-0.5 text-xs bg-gray-700 border border-gray-600 rounded text-white"
                />
              ) : (
                <button
                  onClick={() => setActiveLayer(layer.id)}
                  onDoubleClick={() => {
                    setEditingLayerId(layer.id);
                    setEditName(layer.name);
                  }}
                  className="w-full text-left truncate text-gray-200"
                >
                  {layer.name}
                  <span className="ml-1 text-gray-500">({layer.annotations.length})</span>
                </button>
              )}
            </div>

            <button
              onClick={() => toggleLayerLock(layer.id)}
              className={cn(
                'transition-colors',
                layer.locked ? 'text-yellow-500' : 'text-gray-600 hover:text-gray-400'
              )}
              title={layer.locked ? 'Locked' : 'Unlocked'}
            >
              {layer.locked ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                    clipRule="evenodd"
                  />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a5 5 0 00-5 5v2a2 2 0 00-2 2v5a2 2 0 002 2h10a2 2 0 002-2v-5a2 2 0 00-2-2H7V7a3 3 0 015.905-.75 1 1 0 001.937-.5A5.002 5.002 0 0010 2z" />
                </svg>
              )}
            </button>

            {annotationSet.layers.length > 1 && (
              <button
                onClick={() => deleteLayer(layer.id)}
                className="text-gray-600 hover:text-red-400 transition-colors"
                title="Delete layer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// Main AnnotationTools Component
// ============================================================================

export const AnnotationTools: React.FC<AnnotationToolsProps> = ({ className, onExport }) => {
  const [activePanel, setActivePanel] = useState<string | null>('drawing');
  const [showTextInput, setShowTextInput] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState({ x: 100, y: 100 });

  // Store selectors
  const activeTool = useAnnotationStore((state) => state.activeTool);
  const toolConfig = useAnnotationStore((state) => state.toolConfig);
  const showAnnotations = useAnnotationStore((state) => state.showAnnotations);
  const snapToGrid = useAnnotationStore((state) => state.snapToGrid);
  const canUndo = useAnnotationStore((state) => state.canUndo());
  const canRedo = useAnnotationStore((state) => state.canRedo());
  const annotationSet = useAnnotationStore((state) => state.annotationSet);

  // Actions
  const setActiveTool = useAnnotationStore((state) => state.setActiveTool);
  const setDrawingTool = useAnnotationStore((state) => state.setDrawingTool);
  const setToolColor = useAnnotationStore((state) => state.setToolColor);
  const setStrokeWidth = useAnnotationStore((state) => state.setStrokeWidth);
  const toggleAnnotations = useAnnotationStore((state) => state.toggleAnnotations);
  const toggleSnapToGrid = useAnnotationStore((state) => state.toggleSnapToGrid);
  const undo = useAnnotationStore((state) => state.undo);
  const redo = useAnnotationStore((state) => state.redo);
  const addTextAnnotation = useAnnotationStore((state) => state.addTextAnnotation);
  const selectAnnotation = useAnnotationStore((state) => state.selectAnnotation);

  const currentTime = 0; // Would come from timeline store

  const drawingTools: { id: DrawingTool; icon: React.ReactNode; label: string }[] = [
    { id: 'arrow', icon: <ArrowRight className="w-4 h-4" />, label: 'Arrow' },
    { id: 'circle', icon: <Circle className="w-4 h-4" />, label: 'Circle' },
    { id: 'zone', icon: <Square className="w-4 h-4" />, label: 'Zone' },
    { id: 'freehand', icon: <Pencil className="w-4 h-4" />, label: 'Draw' },
  ];

  const handleToolSelect = (tool: AnnotationTool) => {
    setActiveTool(tool);
    selectAnnotation(null);

    if (tool === 'arrow' || tool === 'circle' || tool === 'zone' || tool === 'freehand') {
      setDrawingTool(tool);
      setActivePanel('drawing');
    } else if (tool === 'text') {
      setActivePanel('text');
      setShowTextInput(true);
    } else if (tool === 'voice') {
      setActivePanel('voice');
    } else if (tool === 'select') {
      setActivePanel(null);
    }
  };

  const handleAddText = () => {
    if (textInput.trim()) {
      addTextAnnotation(textInput.trim(), textPosition.x, textPosition.y, currentTime);
      setTextInput('');
      setShowTextInput(false);
    }
  };

  return (
    <div className={cn('flex flex-col gap-3 p-3 bg-gray-900/95 border border-gray-800 rounded-xl shadow-xl', className)}>
      {/* Main Toolbar */}
      <div className="flex items-center gap-1">
        {/* Select Tool */}
        <button
          onClick={() => handleToolSelect('select')}
          className={cn(
            'p-2 rounded-lg transition-all',
            activeTool === 'select'
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-800 text-gray-400 hover:text-white'
          )}
          title="Select (V)"
        >
          <MousePointer2 className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* Drawing Tools */}
        {drawingTools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => handleToolSelect(tool.id)}
            className={cn(
              'p-2 rounded-lg transition-all',
              activeTool === tool.id
                ? 'bg-blue-600 text-white'
                : 'hover:bg-gray-800 text-gray-400 hover:text-white'
            )}
            title={tool.label}
          >
            {tool.icon}
          </button>
        ))}

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* Text Tool */}
        <button
          onClick={() => handleToolSelect('text')}
          className={cn(
            'p-2 rounded-lg transition-all',
            activeTool === 'text'
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-800 text-gray-400 hover:text-white'
          )}
          title="Text (T)"
        >
          <Type className="w-5 h-5" />
        </button>

        {/* Voice Tool */}
        <button
          onClick={() => handleToolSelect('voice')}
          className={cn(
            'p-2 rounded-lg transition-all',
            activeTool === 'voice'
              ? 'bg-blue-600 text-white'
              : 'hover:bg-gray-800 text-gray-400 hover:text-white'
          )}
          title="Voice Note (M)"
        >
          <Mic className="w-5 h-5" />
        </button>

        <div className="w-px h-6 bg-gray-700 mx-1" />

        {/* Undo/Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className={cn(
            'p-2 rounded-lg transition-all',
            canUndo
              ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
              : 'text-gray-700 cursor-not-allowed'
          )}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-5 h-5" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className={cn(
            'p-2 rounded-lg transition-all',
            canRedo
              ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
              : 'text-gray-700 cursor-not-allowed'
          )}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-5 h-5" />
        </button>

        <div className="flex-1" />

        {/* Visibility Toggle */}
        <button
          onClick={toggleAnnotations}
          className={cn(
            'p-2 rounded-lg transition-all',
            showAnnotations
              ? 'hover:bg-gray-800 text-gray-400 hover:text-white'
              : 'text-gray-600'
          )}
          title="Toggle Annotations"
        >
          {showAnnotations ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
        </button>

        {/* Snap to Grid */}
        <button
          onClick={toggleSnapToGrid}
          className={cn(
            'p-2 rounded-lg transition-all',
            snapToGrid
              ? 'bg-blue-600/30 text-blue-400'
              : 'hover:bg-gray-800 text-gray-400 hover:text-white'
          )}
          title="Snap to Grid"
        >
          <Grid3X3 className="w-5 h-5" />
        </button>
      </div>

      {/* Active Panel */}
      {activePanel === 'drawing' && (
        <div className="flex flex-col gap-3 p-3 bg-gray-800/50 rounded-lg">
          <ColorPicker
            colors={DRAWING_COLORS}
            selectedColor={toolConfig.color}
            onSelect={setToolColor}
          />
          <StrokeWidthPicker
            widths={STROKE_WIDTHS}
            selectedWidth={toolConfig.strokeWidth}
            onSelect={setStrokeWidth}
          />
        </div>
      )}

      {activePanel === 'text' && <TextStylePanel />}

      {activePanel === 'voice' && <VoiceRecorder />}

      {/* Layer Panel */}
      <LayerPanel />

      {/* Import/Export */}
      {annotationSet && (
        <div className="flex gap-2">
          <button
            onClick={onExport}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
          <button
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded-lg transition-colors"
          >
            <Upload className="w-4 h-4" />
            Import
          </button>
        </div>
      )}

      {/* Text Input Modal */}
      {showTextInput && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-4 w-80">
            <h3 className="text-sm font-medium text-white mb-3">Add Text Annotation</h3>
            <textarea
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Enter text..."
              className="w-full h-24 px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm resize-none focus:outline-none focus:border-blue-500"
              autoFocus
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setShowTextInput(false)}
                className="flex-1 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddText}
                disabled={!textInput.trim()}
                className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-800 disabled:text-gray-600 text-white text-sm rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AnnotationTools;
