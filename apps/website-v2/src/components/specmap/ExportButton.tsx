/**
 * Export Button Component
 * Trigger export with format options
 * [Ver001.000]
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { cn } from '../../lib/utils';
import type {
  ExportFormat,
  ExportResolution,
  ScreenshotOptions,
  ClipOptions,
} from '../../lib/export/types';
import {
  EXPORT_RESOLUTIONS,
  NATIVE_RESOLUTION,
  DEFAULT_SCREENSHOT_OPTIONS,
  DEFAULT_CLIP_OPTIONS,
} from '../../lib/export/types';
import {
  Camera,
  Video,
  Download,
  Settings2,
  X,
  Check,
  Image as ImageIcon,
  FileVideo,
} from 'lucide-react';

export interface ExportButtonProps {
  /** Type of export */
  type: 'screenshot' | 'clip';
  /** Target element to capture */
  targetRef: React.RefObject<HTMLElement>;
  /** Called when export is triggered */
  onExport: (options: Partial<ScreenshotOptions> | Partial<ClipOptions>) => void;
  /** Optional class name */
  className?: string;
  /** Whether export is in progress */
  isExporting?: boolean;
}

interface FormatOption {
  value: ExportFormat;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const SCREENSHOT_FORMATS: FormatOption[] = [
  {
    value: 'png',
    label: 'PNG',
    icon: <ImageIcon className="w-4 h-4" />,
    description: 'Best quality, lossless',
  },
  {
    value: 'webp',
    label: 'WebP',
    icon: <ImageIcon className="w-4 h-4" />,
    description: 'Smaller file size',
  },
  {
    value: 'jpg',
    label: 'JPEG',
    icon: <ImageIcon className="w-4 h-4" />,
    description: 'Smallest file size',
  },
];

const CLIP_FORMATS: FormatOption[] = [
  {
    value: 'mp4',
    label: 'MP4',
    icon: <FileVideo className="w-4 h-4" />,
    description: 'Best compatibility',
  },
  {
    value: 'webp',
    label: 'WebP',
    icon: <FileVideo className="w-4 h-4" />,
    description: 'Animation/WebP video',
  },
];

export function ExportButton({
  type,
  targetRef,
  onExport,
  className,
  isExporting = false,
}: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [format, setFormat] = useState<ExportFormat>(type === 'screenshot' ? 'png' : 'mp4');
  const [resolution, setResolution] = useState<ExportResolution>(NATIVE_RESOLUTION);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [includeMetadata, setIncludeMetadata] = useState(true);
  const [quality, setQuality] = useState(0.95);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = useCallback(() => {
    if (!targetRef.current) return;

    const baseOptions = {
      target: targetRef.current,
      resolution,
      includeWatermark,
      includeMetadata,
    };

    if (type === 'screenshot') {
      onExport({
        ...baseOptions,
        format: format as 'png' | 'webp' | 'jpg',
        quality,
      });
    } else {
      onExport({
        ...baseOptions,
        format: format as 'mp4' | 'webp',
        quality: quality > 0.9 ? 'high' : quality > 0.7 ? 'medium' : 'low',
      });
    }

    setIsOpen(false);
  }, [
    format,
    includeMetadata,
    includeWatermark,
    onExport,
    quality,
    resolution,
    targetRef,
    type,
  ]);

  const formats = type === 'screenshot' ? SCREENSHOT_FORMATS : CLIP_FORMATS;
  const Icon = type === 'screenshot' ? Camera : Video;

  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      {/* Main button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        disabled={isExporting}
        className={cn(
          'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all',
          isExporting
            ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
            : 'bg-indigo-500 hover:bg-indigo-600 text-white'
        )}
      >
        {isExporting ? (
          <>
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Exporting...
          </>
        ) : (
          <>
            <Icon className="w-4 h-4" />
            {type === 'screenshot' ? 'Screenshot' : 'Clip'}
            <Settings2 className="w-3 h-3 ml-1 opacity-60" />
          </>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-xl z-50 p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-white">
              {type === 'screenshot' ? 'Screenshot Options' : 'Clip Options'}
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Format selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase">Format</label>
            <div className="grid grid-cols-3 gap-2">
              {formats.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setFormat(f.value)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg border transition-all',
                    format === f.value
                      ? 'bg-indigo-500/20 border-indigo-500 text-indigo-400'
                      : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600'
                  )}
                >
                  {f.icon}
                  <span className="text-xs font-medium">{f.label}</span>
                </button>
              ))}
            </div>
            <p className="text-xs text-slate-500">{formats.find((f) => f.value === format)?.description}</p>
          </div>

          {/* Resolution selection */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase">Resolution</label>
            <select
              value={resolution.label}
              onChange={(e) => {
                const res =
                  e.target.value === NATIVE_RESOLUTION.label
                    ? NATIVE_RESOLUTION
                    : EXPORT_RESOLUTIONS.find((r) => r.label === e.target.value);
                if (res) setResolution(res);
              }}
              className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-indigo-500"
            >
              <option value={NATIVE_RESOLUTION.label}>{NATIVE_RESOLUTION.label}</option>
              {EXPORT_RESOLUTIONS.map((res) => (
                <option key={res.label} value={res.label}>
                  {res.label}
                </option>
              ))}
            </select>
          </div>

          {/* Quality slider (screenshots only) */}
          {type === 'screenshot' && format !== 'png' && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase">
                Quality: {Math.round(quality * 100)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={quality}
                onChange={(e) => setQuality(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          )}

          {/* Options */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-slate-400 uppercase">Options</label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIncludeWatermark(!includeWatermark)}
                className={cn(
                  'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                  includeWatermark
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'bg-slate-800 border-slate-600'
                )}
              >
                {includeWatermark && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-slate-300">Include watermark</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => setIncludeMetadata(!includeMetadata)}
                className={cn(
                  'w-5 h-5 rounded border flex items-center justify-center transition-colors',
                  includeMetadata
                    ? 'bg-indigo-500 border-indigo-500'
                    : 'bg-slate-800 border-slate-600'
                )}
              >
                {includeMetadata && <Check className="w-3 h-3 text-white" />}
              </div>
              <span className="text-sm text-slate-300">Embed metadata</span>
            </label>
          </div>

          {/* Export button */}
          <button
            onClick={handleExport}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export {type === 'screenshot' ? 'Screenshot' : 'Clip'}
          </button>
        </div>
      )}
    </div>
  );
}

export default ExportButton;
