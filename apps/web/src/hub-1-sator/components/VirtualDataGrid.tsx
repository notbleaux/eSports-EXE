/** [Ver001.000]
 * VirtualDataGrid Component for SATOR Hub
 * High-performance data grid with Web Worker rendering
 * 
 * Features:
 * - Web Worker offloading for rendering
 * - Worker Pool support for multiple grids
 * - OffscreenCanvas when available
 * - DOM fallback for non-Worker browsers
 * - Virtual scrolling for 1000+ rows
 * - 60fps performance target
 * - Memory usage <150MB for 1000 rows
 */

import React, { 
  useRef, 
  useEffect, 
  useState, 
  useCallback, 
  useMemo,
  forwardRef,
  useImperativeHandle
} from 'react';
import { useGridWorker } from '@/hooks/workers/useGridWorker';
import { WorkerPool, getWorkerPool, isWorkerSupported, isOffscreenCanvasSupported } from '@/lib/worker-utils';
import type { GridColumn, GridRow, GridVisibleRange } from '@/types/worker';
import { colors } from '@/theme/colors';

export interface VirtualDataGridProps {
  data: GridRow[];
  columns: GridColumn[];
  height?: number;
  rowHeight?: number;
  headerHeight?: number;
  className?: string;
  onRowClick?: (row: GridRow, index: number) => void;
  onCellClick?: (row: GridRow, column: GridColumn, value: unknown) => void;
  theme?: {
    backgroundColor?: string;
    headerBackgroundColor?: string;
    rowBackgroundColor?: string;
    alternateRowBackgroundColor?: string;
    borderColor?: string;
    textColor?: string;
    headerTextColor?: string;
    accentColor?: string;
  };
  workerPool?: WorkerPool;
  useWorkerPool?: boolean;
  overscanRows?: number;
}

export interface VirtualDataGridRef {
  scrollToRow: (rowIndex: number) => void;
  scrollToTop: () => void;
  scrollToBottom: () => void;
  getVisibleRange: () => GridVisibleRange | null;
  refresh: () => void;
}

// Worker factory - DISABLED for Vercel build compatibility
const createGridWorker = (): never => {
  throw new Error('Workers disabled for build compatibility');
};

/**
 * DOM Fallback Grid for browsers without Worker/OffscreenCanvas support
 */
const DOMFallbackGrid: React.FC<VirtualDataGridProps> = ({
  data,
  columns,
  height = 400,
  rowHeight = 40,
  headerHeight = 48,
  className,
  onRowClick,
  onCellClick,
  theme: customTheme,
  overscanRows = 3
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const theme = {
    backgroundColor: customTheme?.backgroundColor || '#0a0a0f',
    headerBackgroundColor: customTheme?.headerBackgroundColor || 'rgba(255, 255, 255, 0.05)',
    rowBackgroundColor: customTheme?.rowBackgroundColor || 'rgba(255, 255, 255, 0.03)',
    alternateRowBackgroundColor: customTheme?.alternateRowBackgroundColor || 'rgba(255, 255, 255, 0.05)',
    borderColor: customTheme?.borderColor || 'rgba(255, 255, 255, 0.08)',
    textColor: customTheme?.textColor || colors.text.primary,
    headerTextColor: customTheme?.headerTextColor || colors.hub.sator,
    accentColor: customTheme?.accentColor || colors.hub.sator,
  };

  const totalHeight = data.length * rowHeight;
  const viewportHeight = height - headerHeight;

  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / rowHeight) - overscanRows);
    const visibleCount = Math.ceil(viewportHeight / rowHeight) + overscanRows * 2;
    const endRow = Math.min(data.length, startRow + visibleCount);
    return { startRow, endRow };
  }, [scrollTop, rowHeight, viewportHeight, data.length, overscanRows]);

  const visibleData = useMemo(() => {
    return data.slice(visibleRange.startRow, visibleRange.endRow);
  }, [data, visibleRange]);

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  const formatCellValue = (value: unknown, type?: string): string => {
    if (value === null || value === undefined) return '';
    
    switch (type) {
      case 'number':
        return typeof value === 'number' 
          ? value.toLocaleString('en-US', { maximumFractionDigits: 2 })
          : String(value);
      case 'rating':
        return typeof value === 'number' ? value.toFixed(2) : String(value);
      case 'trend':
        if (typeof value === 'number') {
          const arrow = value > 0 ? '↑' : value < 0 ? '↓' : '→';
          return `${arrow} ${Math.abs(value).toFixed(1)}%`;
        }
        return String(value);
      default:
        return String(value);
    }
  };

  return (
    <div
      ref={containerRef}
      className={`overflow-auto ${className || ''}`}
      style={{ 
        height, 
        backgroundColor: theme.backgroundColor,
        border: `1px solid ${theme.borderColor}`,
        borderRadius: '8px'
      }}
      onScroll={handleScroll}
    >
      {/* Header */}
      <div 
        className="sticky top-0 z-10 flex"
        style={{ 
          height: headerHeight, 
          backgroundColor: theme.headerBackgroundColor,
          borderBottom: `1px solid ${theme.borderColor}`
        }}
      >
        {columns.map((col) => (
          <div
            key={col.key}
            className="flex-shrink-0 px-3 flex items-center font-semibold text-sm"
            style={{ 
              width: col.width,
              color: theme.headerTextColor,
              textAlign: col.align || 'left',
              borderRight: `1px solid ${theme.borderColor}`
            }}
          >
            {col.header}
          </div>
        ))}
      </div>

      {/* Virtualized rows container */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleData.map((row, index) => {
          const actualIndex = visibleRange.startRow + index;
          const isAlternate = actualIndex % 2 === 1;
          
          return (
            <div
              key={row.id || actualIndex}
              className="absolute flex w-full hover:opacity-80 transition-opacity cursor-pointer"
              style={{
                top: actualIndex * rowHeight,
                height: rowHeight,
                backgroundColor: isAlternate ? theme.alternateRowBackgroundColor : theme.rowBackgroundColor,
                borderBottom: `1px solid ${theme.borderColor}`
              }}
              onClick={() => onRowClick?.(row, actualIndex)}
            >
              {columns.map((col) => (
                <div
                  key={col.key}
                  className="flex-shrink-0 px-3 flex items-center text-sm truncate"
                  style={{ 
                    width: col.width,
                    color: theme.textColor,
                    textAlign: col.align || 'left',
                    justifyContent: col.align === 'center' ? 'center' : col.align === 'right' ? 'flex-end' : 'flex-start',
                    borderRight: `1px solid ${theme.borderColor}`
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCellClick?.(row, col, row[col.key]);
                  }}
                >
                  {formatCellValue(row[col.key], col.type)}
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Main VirtualDataGrid Component with Web Worker support
 */
export const VirtualDataGrid = forwardRef<VirtualDataGridRef, VirtualDataGridProps>(({
  data,
  columns,
  height = 400,
  rowHeight = 40,
  headerHeight = 48,
  className,
  onRowClick,
  onCellClick,
  theme: customTheme,
  workerPool: externalPool,
  useWorkerPool = false,
  overscanRows = 3
}, ref) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [renderStats, setRenderStats] = useState({ renderTime: 0, renderedCells: 0 });

  // Get or create worker pool
  const poolRef = useRef<WorkerPool | null>(externalPool || null);
  
  useEffect(() => {
    if (useWorkerPool && !poolRef.current) {
      poolRef.current = getWorkerPool('grid', createGridWorker, {
        maxWorkers: 4,
        idleTimeoutMs: 30000,
        taskTimeoutMs: 30000
      });
    }
  }, [useWorkerPool]);

  // Check browser capabilities
  const workerSupported = useMemo(() => isWorkerSupported(), []);
  const offscreenSupported = useMemo(() => isOffscreenCanvasSupported(), []);

  // Use fallback for non-supported browsers
  const useFallback = !workerSupported || !offscreenSupported;

  // Theme configuration
  const theme = {
    backgroundColor: customTheme?.backgroundColor || '#0a0a0f',
    headerBackgroundColor: customTheme?.headerBackgroundColor || 'rgba(255, 255, 255, 0.05)',
    rowBackgroundColor: customTheme?.rowBackgroundColor || 'rgba(255, 255, 255, 0.03)',
    alternateRowBackgroundColor: customTheme?.alternateRowBackgroundColor || 'rgba(255, 255, 255, 0.05)',
    borderColor: customTheme?.borderColor || 'rgba(255, 255, 255, 0.08)',
    textColor: customTheme?.textColor || colors.text.primary,
    headerTextColor: customTheme?.headerTextColor || colors.hub.sator,
    accentColor: customTheme?.accentColor || colors.hub.sator,
  };

  // Use grid worker hook
  const {
    isReady: workerReady,
    isRendering: _isRendering,
    canvasRef: workerCanvasRef,
    render,
    scroll: scrollWorker,
    resize,
    calculateVisibleRange
  } = useGridWorker({
    columns: columns.length,
    rows: data.length,
    cellWidth: 100,
    cellHeight: rowHeight,
    onError: (error) => {
      console.error('Grid worker error:', error);
    }
  });

  // Sync canvas refs
  useEffect(() => {
    if (workerCanvasRef.current && canvasRef.current) {
      // Canvas is managed by worker
    }
  }, [workerCanvasRef]);

  // Initialize worker with data
  useEffect(() => {
    if (!workerReady || useFallback) return;

    const initWorker = async () => {
      try {
        const result = await render({
          data,
          columns,
          viewport: { 
            x: 0, 
            y: 0, 
            width: canvasRef.current?.width || 800, 
            height: canvasRef.current?.height || height 
          },
          scrollTop,
          scrollLeft,
          rowHeight,
          headerHeight,
          theme
        });

        setRenderStats({
          renderTime: result.renderTime || 0,
          renderedCells: result.renderedCells || 0
        });
        setIsReady(true);
      } catch (error) {
        console.error('Failed to render grid:', error);
      }
    };

    initWorker();
  }, [workerReady, data, columns, render, useFallback, scrollTop, scrollLeft, rowHeight, headerHeight, theme, height]);

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = e.currentTarget.scrollTop;
    const newScrollLeft = e.currentTarget.scrollLeft;
    
    setScrollTop(newScrollTop);
    setScrollLeft(newScrollLeft);

    if (!useFallback) {
      scrollWorker(newScrollTop, newScrollLeft);
    }
  }, [scrollWorker, useFallback]);

  // Handle resize
  useEffect(() => {
    if (useFallback) return;

    const handleResize = () => {
      if (containerRef.current && canvasRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        canvasRef.current.width = rect.width;
        canvasRef.current.height = height;
        resize(rect.width, height);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [resize, height, useFallback]);

  // Expose imperative methods
  useImperativeHandle(ref, () => ({
    scrollToRow: (rowIndex: number) => {
      if (containerRef.current) {
        containerRef.current.scrollTop = rowIndex * rowHeight;
      }
    },
    scrollToTop: () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
    },
    scrollToBottom: () => {
      if (containerRef.current) {
        containerRef.current.scrollTop = data.length * rowHeight;
      }
    },
    getVisibleRange: () => {
      const startRow = Math.floor(scrollTop / rowHeight);
      const viewportHeight = height - headerHeight;
      const visibleCount = Math.ceil(viewportHeight / rowHeight);
      return {
        startRow,
        endRow: Math.min(data.length, startRow + visibleCount),
        startCol: 0,
        endCol: columns.length
      };
    },
    refresh: () => {
      if (!useFallback) {
        render({
          data,
          columns,
          viewport: { 
            x: 0, 
            y: 0, 
            width: canvasRef.current?.width || 800, 
            height: canvasRef.current?.height || height 
          },
          scrollTop,
          scrollLeft,
          rowHeight,
          headerHeight,
          theme
        });
      }
    }
  }), [scrollTop, scrollLeft, rowHeight, data.length, columns.length, height, headerHeight, calculateVisibleRange, render, data, columns, theme, useFallback]);

  // Use DOM fallback for non-supported browsers
  if (useFallback) {
    return (
      <DOMFallbackGrid
        data={data}
        columns={columns}
        height={height}
        rowHeight={rowHeight}
        headerHeight={headerHeight}
        className={className}
        onRowClick={onRowClick}
        onCellClick={onCellClick}
        theme={theme}
        overscanRows={overscanRows}
      />
    );
  }

  const totalHeight = data.length * rowHeight + headerHeight;

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className || ''}`}
      style={{ 
        height, 
        backgroundColor: theme.backgroundColor,
        border: `1px solid ${theme.borderColor}`,
        borderRadius: '8px'
      }}
      onScroll={handleScroll}
    >
      {/* Canvas for Worker rendering */}
      <canvas
        ref={canvasRef}
        className="block"
        style={{
          width: '100%',
          height: totalHeight,
          minHeight: height
        }}
      />
      
      {/* Loading overlay */}
      {!isReady && (
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{ backgroundColor: theme.backgroundColor }}
        >
          <div className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded-full animate-pulse"
              style={{ backgroundColor: theme.accentColor }}
            />
            <span style={{ color: theme.textColor }}>Loading grid...</span>
          </div>
        </div>
      )}

      {/* Render stats (dev mode) */}
      {process.env.NODE_ENV === 'development' && isReady && (
        <div 
          className="absolute bottom-2 right-2 px-2 py-1 text-xs rounded font-mono opacity-50"
          style={{ 
            backgroundColor: theme.headerBackgroundColor,
            color: theme.textColor
          }}
        >
          {renderStats.renderTime.toFixed(1)}ms | {renderStats.renderedCells} cells
        </div>
      )}
    </div>
  );
});

VirtualDataGrid.displayName = 'VirtualDataGrid';

export default VirtualDataGrid;
