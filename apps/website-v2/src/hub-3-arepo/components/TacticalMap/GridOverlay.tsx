/** [Ver001.000] */
/**
 * Grid Overlay
 * ============
 * Tactical grid system with multiple coordinate formats.
 * Supports alphabetic, numeric, and chess-style coordinates.
 */

import React from 'react';
import { GridConfig } from './types';

interface GridOverlayProps {
  width: number;
  height: number;
  config: GridConfig;
  zoom: number;
  visible: boolean;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({
  width,
  height,
  config,
  zoom,
  visible,
}) => {
  if (!visible) return null;

  const cols = Math.ceil(width / config.size);
  const rows = Math.ceil(height / config.size);

  // Generate coordinate labels
  const getColLabel = (col: number): string => {
    switch (config.coordinateSystem) {
      case 'alphabetic':
        return String.fromCharCode(65 + col); // A, B, C...
      case 'numeric':
        return (col + 1).toString();
      case 'chess':
        return String.fromCharCode(97 + col); // a, b, c...
      default:
        return col.toString();
    }
  };

  const getRowLabel = (row: number): string => {
    switch (config.coordinateSystem) {
      case 'alphabetic':
        return (row + 1).toString();
      case 'numeric':
        return (row + 1).toString();
      case 'chess':
        return (8 - row).toString(); // Chess notation: 8, 7, 6...
      default:
        return row.toString();
    }
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      width={width}
      height={height}
      style={{
        opacity: config.opacity,
      }}
    >
      <defs>
        <pattern
          id="grid-pattern"
          width={config.size}
          height={config.size}
          patternUnits="userSpaceOnUse"
        >
          <path
            d={`M ${config.size} 0 L 0 0 0 ${config.size}`}
            fill="none"
            stroke={config.color}
            strokeWidth={1 / zoom}
          />
        </pattern>
      </defs>

      {/* Grid Background */}
      <rect width={width} height={height} fill="url(#grid-pattern)" />

      {/* Border */}
      <rect
        x={0}
        y={0}
        width={width}
        height={height}
        fill="none"
        stroke={config.color}
        strokeWidth={2 / zoom}
      />

      {/* Coordinate Labels */}
      {config.showCoordinates && zoom > 0.5 && (
        <>
          {/* Column labels (top) */}
          {Array.from({ length: cols }).map((_, col) => (
            <text
              key={`col-${col}`}
              x={col * config.size + config.size / 2}
              y={15 / zoom}
              textAnchor="middle"
              fill={config.color}
              fontSize={10 / zoom}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {getColLabel(col)}
            </text>
          ))}

          {/* Row labels (left) */}
          {Array.from({ length: rows }).map((_, row) => (
            <text
              key={`row-${row}`}
              x={10 / zoom}
              y={row * config.size + config.size / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={config.color}
              fontSize={10 / zoom}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {getRowLabel(row)}
            </text>
          ))}

          {/* Coordinate labels (bottom) */}
          {Array.from({ length: cols }).map((_, col) => (
            <text
              key={`col-bottom-${col}`}
              x={col * config.size + config.size / 2}
              y={height - 5 / zoom}
              textAnchor="middle"
              fill={config.color}
              fontSize={10 / zoom}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {getColLabel(col)}
            </text>
          ))}

          {/* Coordinate labels (right) */}
          {Array.from({ length: rows }).map((_, row) => (
            <text
              key={`row-right-${row}`}
              x={width - 10 / zoom}
              y={row * config.size + config.size / 2}
              textAnchor="middle"
              dominantBaseline="middle"
              fill={config.color}
              fontSize={10 / zoom}
              fontFamily="monospace"
              fontWeight="bold"
            >
              {getRowLabel(row)}
            </text>
          ))}
        </>
      )}

      {/* Major grid lines (every 5 cells) */}
      {Array.from({ length: Math.floor(cols / 5) }).map((_, i) => (
        <line
          key={`major-col-${i}`}
          x1={(i + 1) * 5 * config.size}
          y1={0}
          x2={(i + 1) * 5 * config.size}
          y2={height}
          stroke={config.color}
          strokeWidth={2 / zoom}
          opacity={0.7}
        />
      ))}

      {Array.from({ length: Math.floor(rows / 5) }).map((_, i) => (
        <line
          key={`major-row-${i}`}
          x1={0}
          y1={(i + 1) * 5 * config.size}
          x2={width}
          y2={(i + 1) * 5 * config.size}
          stroke={config.color}
          strokeWidth={2 / zoom}
          opacity={0.7}
        />
      ))}
    </svg>
  );
};

export default GridOverlay;
