/**
 * Camera Controls UI Component
 * Mode selector, target selector, and path recording interface
 * [Ver001.000]
 * 
 * Agent: TL-S2-2-C
 * Team: Replay 2.0 Core (TL-S2)
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { CameraMode, CameraState } from '../../lib/replay/camera/modes';
import type { CameraPath } from '../../lib/replay/camera/pathRecording';
import type { DetectedAction } from '../../lib/replay/camera/actionDetection';
import type { ReplayPlayer } from '../../lib/replay/types';
import {
  Video,
  Users,
  Orbit,
  Film,
  MousePointer,
  Circle,
  Square,
  Play,
  Pause,
  RotateCcw,
  Save,
  FolderOpen,
  Trash2,
  Target,
  Zap,
  Settings,
  ChevronDown,
  ChevronUp,
  List,
  Clock,
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface CameraControlsProps {
  /** Current camera mode */
  currentMode: CameraMode;
  /** Current director mode (auto/manual) */
  directorMode: 'auto' | 'manual' | 'cinematic';
  /** Available players to follow */
  players: ReplayPlayer[];
  /** Currently selected player */
  selectedPlayerId?: string;
  /** Currently selected action */
  selectedActionId?: string;
  /** Detected actions list */
  detectedActions: DetectedAction[];
  /** Saved camera paths */
  savedPaths: CameraPath[];
  /** Is currently recording a path */
  isRecording: boolean;
  /** Recording duration in ms */
  recordingDuration: number;
  /** Is path playing */
  isPlaying: boolean;
  /** Path playback progress (0-1) */
  playbackProgress: number;
  /** Drama score for current scene */
  dramaScore?: { total: number; actionScore: number; proximityScore: number; momentumScore: number };
  /** Current scene composition */
  sceneComposition?: {
    primarySubject: string | null;
    secondarySubjects: string[];
    framing: 'close' | 'medium' | 'wide';
    angle: 'low' | 'eye' | 'high';
    movement: 'static' | 'tracking' | 'orbiting';
  };
  /** Callbacks */
  onModeChange: (mode: CameraMode) => void;
  onDirectorModeChange: (mode: 'auto' | 'manual' | 'cinematic') => void;
  onPlayerSelect: (playerId: string | undefined) => void;
  onActionSelect: (actionId: string | undefined) => void;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onSaveRecording: (name: string) => void;
  onDiscardRecording: () => void;
  onPlayPath: (pathId: string) => void;
  onPausePath: () => void;
  onStopPath: () => void;
  onSeekPath: (progress: number) => void;
  onLoadPath: (pathId: string) => void;
  onDeletePath: (pathId: string) => void;
  onExportPath: (pathId: string) => void;
  onImportPath: (json: string) => void;
}

// ============================================================================
// Camera Controls Component
// ============================================================================

export const CameraControls: React.FC<CameraControlsProps> = ({
  currentMode,
  directorMode,
  players,
  selectedPlayerId,
  selectedActionId,
  detectedActions,
  savedPaths,
  isRecording,
  recordingDuration,
  isPlaying,
  playbackProgress,
  dramaScore,
  sceneComposition,
  onModeChange,
  onDirectorModeChange,
  onPlayerSelect,
  onActionSelect,
  onStartRecording,
  onStopRecording,
  onSaveRecording,
  onDiscardRecording,
  onPlayPath,
  onPausePath,
  onStopPath,
  onSeekPath,
  onLoadPath,
  onDeletePath,
  onExportPath,
  onImportPath,
}) => {
  const [expandedSection, setExpandedSection] = useState<string | null>('modes');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [pathName, setPathName] = useState('');
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showActionList, setShowActionList] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleSaveRecording = () => {
    if (pathName.trim()) {
      onSaveRecording(pathName.trim());
      setPathName('');
      setShowSaveDialog(false);
    }
  };

  const handleImport = () => {
    if (importJson.trim()) {
      onImportPath(importJson.trim());
      setImportJson('');
      setShowImportDialog(false);
    }
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        onImportPath(content);
      };
      reader.readAsText(file);
    }
  };

  const formatTime = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const remainingMs = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${remainingMs.toString().padStart(2, '0')}`;
  };

  const getModeIcon = (mode: CameraMode) => {
    switch (mode) {
      case 'free':
        return <MousePointer className="w-4 h-4" />;
      case 'follow':
        return <Users className="w-4 h-4" />;
      case 'orbit':
        return <Orbit className="w-4 h-4" />;
      case 'cinematic':
        return <Film className="w-4 h-4" />;
    }
  };

  return (
    <div className="bg-slate-900/95 border border-slate-700 rounded-lg p-4 w-80 text-slate-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-700">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-cyan-400" />
          <h3 className="font-semibold text-sm">Camera Director</h3>
        </div>
        {dramaScore && (
          <div className="flex items-center gap-1 text-xs">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className={dramaScore.total > 70 ? 'text-red-400' : dramaScore.total > 40 ? 'text-yellow-400' : 'text-slate-400'}>
              {Math.round(dramaScore.total)}
            </span>
          </div>
        )}
      </div>

      {/* Drama Score Bar */}
      {dramaScore && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-slate-400 mb-1">
            <span>Drama Score</span>
            <span>{Math.round(dramaScore.total)}/100</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-yellow-500 to-red-500 transition-all duration-300"
              style={{ width: `${dramaScore.total}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500 mt-1">
            <span>Action: {Math.round(dramaScore.actionScore)}</span>
            <span>Proximity: {Math.round(dramaScore.proximityScore)}</span>
            <span>Momentum: {Math.round(dramaScore.momentumScore)}</span>
          </div>
        </div>
      )}

      {/* Director Mode */}
      <div className="mb-4">
        <div className="flex bg-slate-800 rounded-lg p-1">
          {(['auto', 'manual', 'cinematic'] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => onDirectorModeChange(mode)}
              className={`flex-1 py-1.5 px-2 text-xs font-medium rounded capitalize transition-colors ${
                directorMode === mode
                  ? 'bg-cyan-600 text-white'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </div>

      {/* Camera Modes */}
      <div className="mb-3">
        <button
          onClick={() => toggleSection('modes')}
          className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 mb-2"
        >
          <span>Camera Mode</span>
          {expandedSection === 'modes' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        
        {expandedSection === 'modes' && (
          <div className="grid grid-cols-2 gap-2">
            {(['free', 'follow', 'orbit', 'cinematic'] as CameraMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onModeChange(mode)}
                disabled={directorMode === 'auto' && mode !== 'cinematic'}
                className={`flex items-center gap-2 py-2 px-3 rounded text-xs transition-colors ${
                  currentMode === mode
                    ? 'bg-cyan-600/20 border border-cyan-500/50 text-cyan-400'
                    : 'bg-slate-800 border border-slate-700 text-slate-400 hover:border-slate-600'
                } ${directorMode === 'auto' && mode !== 'cinematic' ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {getModeIcon(mode)}
                <span className="capitalize">{mode}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Target Selection */}
      {currentMode === 'follow' && (
        <div className="mb-3">
          <button
            onClick={() => toggleSection('targets')}
            className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 mb-2"
          >
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              Follow Target
            </span>
            {expandedSection === 'targets' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          
          {expandedSection === 'targets' && (
            <div className="space-y-1 max-h-32 overflow-y-auto">
              <button
                onClick={() => onPlayerSelect(undefined)}
                className={`w-full text-left py-1.5 px-2 rounded text-xs transition-colors ${
                  !selectedPlayerId ? 'bg-cyan-600/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                None
              </button>
              {players.map((player) => (
                <button
                  key={player.id}
                  onClick={() => onPlayerSelect(player.id)}
                  className={`w-full text-left py-1.5 px-2 rounded text-xs transition-colors ${
                    selectedPlayerId === player.id ? 'bg-cyan-600/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-medium">{player.name}</span>
                  <span className="text-slate-600 ml-2">({player.agent || 'Unknown'})</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Actions List */}
      <div className="mb-3">
        <button
          onClick={() => setShowActionList(!showActionList)}
          className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 mb-2"
        >
          <span className="flex items-center gap-1">
            <List className="w-3 h-3" />
            Detected Actions ({detectedActions.length})
          </span>
          {showActionList ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        
        {showActionList && (
          <div className="space-y-1 max-h-32 overflow-y-auto bg-slate-800/50 rounded p-2">
            {detectedActions.slice(0, 10).map((action) => (
              <button
                key={action.id}
                onClick={() => onActionSelect(action.id)}
                className={`w-full text-left py-1 px-2 rounded text-[10px] transition-colors ${
                  selectedActionId === action.id ? 'bg-cyan-600/20 text-cyan-400' : 'text-slate-400 hover:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span className="font-medium capitalize">{action.type.replace('_', ' ')}</span>
                  <span className={`text-[9px] ${
                    action.importance === 'critical' ? 'text-red-400' :
                    action.importance === 'high' ? 'text-yellow-400' :
                    'text-slate-500'
                  }`}>
                    {action.importance}
                  </span>
                </div>
                <div className="text-slate-500 truncate">{action.description}</div>
                <div className="text-slate-600">Score: {Math.round(action.dramaScore)}</div>
              </button>
            ))}
            {detectedActions.length > 10 && (
              <div className="text-[10px] text-slate-600 text-center py-1">
                +{detectedActions.length - 10} more actions
              </div>
            )}
          </div>
        )}
      </div>

      {/* Scene Composition */}
      {sceneComposition && (
        <div className="mb-3 p-2 bg-slate-800/50 rounded">
          <div className="text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Settings className="w-3 h-3" />
            Scene Composition
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            <div className="text-slate-500">Framing:</div>
            <div className="text-slate-300 capitalize">{sceneComposition.framing}</div>
            <div className="text-slate-500">Angle:</div>
            <div className="text-slate-300 capitalize">{sceneComposition.angle}</div>
            <div className="text-slate-500">Movement:</div>
            <div className="text-slate-300 capitalize">{sceneComposition.movement}</div>
          </div>
        </div>
      )}

      {/* Path Recording */}
      <div className="mb-3">
        <button
          onClick={() => toggleSection('recording')}
          className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 mb-2"
        >
          <span className="flex items-center gap-1">
            <Circle className={`w-3 h-3 ${isRecording ? 'text-red-500 animate-pulse' : ''}`} />
            Path Recording
          </span>
          {expandedSection === 'recording' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        
        {expandedSection === 'recording' && (
          <div className="space-y-2">
            {/* Recording Timer */}
            {isRecording && (
              <div className="flex items-center justify-center py-2 bg-red-500/10 rounded">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                  <span className="text-red-400 font-mono text-sm">
                    {formatTime(recordingDuration)}
                  </span>
                </div>
              </div>
            )}

            {/* Recording Controls */}
            <div className="flex gap-2">
              {!isRecording ? (
                <button
                  onClick={onStartRecording}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs transition-colors"
                >
                  <Circle className="w-3 h-3" />
                  Record
                </button>
              ) : (
                <button
                  onClick={onStopRecording}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
                >
                  <Square className="w-3 h-3" />
                  Stop
                </button>
              )}
            </div>

            {/* Save/Discard */}
            {!isRecording && recordingDuration > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowSaveDialog(true)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-xs transition-colors"
                >
                  <Save className="w-3 h-3" />
                  Save
                </button>
                <button
                  onClick={onDiscardRecording}
                  className="flex-1 flex items-center justify-center gap-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
                >
                  <Trash2 className="w-3 h-3" />
                  Discard
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Saved Paths */}
      <div className="mb-3">
        <button
          onClick={() => toggleSection('paths')}
          className="flex items-center justify-between w-full text-xs font-medium text-slate-400 hover:text-slate-200 mb-2"
        >
          <span className="flex items-center gap-1">
            <FolderOpen className="w-3 h-3" />
            Saved Paths ({savedPaths.length})
          </span>
          {expandedSection === 'paths' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        
        {expandedSection === 'paths' && (
          <div className="space-y-2">
            {/* Playback Controls */}
            {isPlaying && (
              <div className="space-y-2 p-2 bg-slate-800 rounded">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onPausePath}
                    className="p-1.5 bg-cyan-600 hover:bg-cyan-700 rounded"
                  >
                    <Pause className="w-3 h-3" />
                  </button>
                  <button
                    onClick={onStopPath}
                    className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded"
                  >
                    <Square className="w-3 h-3" />
                  </button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.01}
                  value={playbackProgress}
                  onChange={(e) => onSeekPath(parseFloat(e.target.value))}
                  className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}

            {/* Path List */}
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {savedPaths.map((path) => (
                <div
                  key={path.id}
                  className="flex items-center justify-between py-1.5 px-2 bg-slate-800 rounded text-xs"
                >
                  <span className="text-slate-300 truncate flex-1">{path.name}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onPlayPath(path.id)}
                      className="p-1 text-cyan-400 hover:bg-cyan-600/20 rounded"
                      title="Play"
                    >
                      <Play className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onLoadPath(path.id)}
                      className="p-1 text-slate-400 hover:bg-slate-700 rounded"
                      title="Load"
                    >
                      <FolderOpen className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onExportPath(path.id)}
                      className="p-1 text-slate-400 hover:bg-slate-700 rounded"
                      title="Export"
                    >
                      <Save className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => onDeletePath(path.id)}
                      className="p-1 text-red-400 hover:bg-red-600/20 rounded"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
              {savedPaths.length === 0 && (
                <div className="text-center py-4 text-slate-500 text-xs">
                  No saved paths
                </div>
              )}
            </div>

            {/* Import Button */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowImportDialog(true)}
                className="flex-1 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded"
              >
                Import JSON
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 py-1.5 text-xs text-slate-400 hover:text-slate-200 border border-slate-700 rounded"
              >
                Import File
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileImport}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* Save Dialog */}
      {showSaveDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 w-72">
            <h4 className="text-sm font-medium mb-3">Save Path</h4>
            <input
              type="text"
              value={pathName}
              onChange={(e) => setPathName(e.target.value)}
              placeholder="Enter path name..."
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-sm text-slate-200 placeholder-slate-500 mb-3 focus:outline-none focus:border-cyan-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveRecording}
                disabled={!pathName.trim()}
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
              >
                Save
              </button>
              <button
                onClick={() => setShowSaveDialog(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 w-96">
            <h4 className="text-sm font-medium mb-3">Import Path</h4>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder="Paste JSON here..."
              className="w-full h-32 bg-slate-800 border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-500 mb-3 focus:outline-none focus:border-cyan-500 font-mono"
            />
            <div className="flex gap-2">
              <button
                onClick={handleImport}
                disabled={!importJson.trim()}
                className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
              >
                Import
              </button>
              <button
                onClick={() => setShowImportDialog(false)}
                className="flex-1 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraControls;
