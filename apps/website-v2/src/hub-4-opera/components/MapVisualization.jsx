/**
 * MapVisualization Component
 * Interactive map display with tactical overlays
 */
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Map, Crosshair, Navigation, AlertCircle } from 'lucide-react';
import { colors } from '../../theme/colors.js';

// Purple theme colors (exact values)
const PURPLE = {
  base: '#9d4edd',
  glow: 'rgba(157, 78, 221, 0.4)',
  muted: '#7a3aaa',
};

/**
 * MapVisualization - Renders an interactive tactical map
 */
function MapVisualization({
  mapId,
  mapData,
  zoom = 1,
  layers = {},
  viewMode = 'tactical',
  loading = false,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Handle resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { width, height } = containerRef.current.getBoundingClientRect();
        setDimensions({ width, height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Canvas rendering for tactical view
  useEffect(() => {
    if (!canvasRef.current || viewMode !== 'tactical') return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const { width, height } = dimensions;

    if (!width || !height) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Apply zoom transform
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(-width / 2, -height / 2);

    // Draw map grid
    drawGrid(ctx, width, height);

    // Draw map layout based on mapId
    drawMapLayout(ctx, mapId, width, height);

    // Draw layers if enabled
    if (layers.callouts) drawCallouts(ctx, mapId, width, height);
    if (layers.spawns) drawSpawnPoints(ctx, mapId, width, height);
    if (layers.sightlines) drawSightLines(ctx, width, height);
    if (layers.cover) drawCoverZones(ctx, width, height);
    if (layers.rotation) drawRotationPaths(ctx, width, height);

    ctx.restore();
  }, [dimensions, zoom, layers, viewMode, mapId, mapData]);

  // Grid pattern drawing
  const drawGrid = (ctx, width, height) => {
    const gridSize = 40;
    ctx.strokeStyle = 'rgba(157, 78, 221, 0.1)';
    ctx.lineWidth = 1;

    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  };

  // Map layout drawing
  const drawMapLayout = (ctx, mapId, width, height) => {
    const centerX = width / 2;
    const centerY = height / 2;

    // Map-specific layouts
    const layouts = {
      ascent: () => drawAscentLayout(ctx, centerX, centerY),
      bind: () => drawBindLayout(ctx, centerX, centerY),
      haven: () => drawHavenLayout(ctx, centerX, centerY),
      split: () => drawSplitLayout(ctx, centerX, centerY),
      lotus: () => drawLotusLayout(ctx, centerX, centerY),
      sunset: () => drawSunsetLayout(ctx, centerX, centerY),
    };

    if (layouts[mapId]) {
      layouts[mapId]();
    } else {
      drawDefaultLayout(ctx, centerX, centerY);
    }
  };

  // Ascent layout (open, two sites)
  const drawAscentLayout = (ctx, cx, cy) => {
    ctx.strokeStyle = PURPLE.base;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(157, 78, 221, 0.1)';

    // Site A (top)
    ctx.beginPath();
    ctx.rect(cx - 60, cy - 80, 80, 60);
    ctx.fill();
    ctx.stroke();

    // Site B (bottom)
    ctx.beginPath();
    ctx.rect(cx + 20, cy + 20, 80, 60);
    ctx.fill();
    ctx.stroke();

    // Mid
    ctx.beginPath();
    ctx.rect(cx - 20, cy - 20, 40, 40);
    ctx.stroke();

    // Connector
    ctx.beginPath();
    ctx.moveTo(cx - 20, cy);
    ctx.lineTo(cx + 20, cy);
    ctx.stroke();
  };

  // Bind layout (linear, teleporters)
  const drawBindLayout = (ctx, cx, cy) => {
    ctx.strokeStyle = PURPLE.base;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(157, 78, 221, 0.1)';

    // Site A (left)
    ctx.beginPath();
    ctx.rect(cx - 120, cy - 40, 80, 80);
    ctx.fill();
    ctx.stroke();

    // Site B (right)
    ctx.beginPath();
    ctx.rect(cx + 40, cy - 40, 80, 80);
    ctx.fill();
    ctx.stroke();

    // Long hallway
    ctx.beginPath();
    ctx.rect(cx - 40, cy - 20, 80, 40);
    ctx.fill();
    ctx.stroke();

    // Teleporters
    ctx.fillStyle = PURPLE.glow;
    ctx.beginPath();
    ctx.arc(cx - 80, cy + 60, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 80, cy - 60, 10, 0, Math.PI * 2);
    ctx.fill();
  };

  // Haven layout (three sites)
  const drawHavenLayout = (ctx, cx, cy) => {
    ctx.strokeStyle = PURPLE.base;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(157, 78, 221, 0.1)';

    // Site A (top-left)
    ctx.beginPath();
    ctx.rect(cx - 80, cy - 80, 50, 50);
    ctx.fill();
    ctx.stroke();

    // Site B (top-right)
    ctx.beginPath();
    ctx.rect(cx + 30, cy - 80, 50, 50);
    ctx.fill();
    ctx.stroke();

    // Site C (bottom)
    ctx.beginPath();
    ctx.rect(cx - 25, cy + 30, 50, 50);
    ctx.fill();
    ctx.stroke();

    // Center
    ctx.beginPath();
    ctx.rect(cx - 30, cy - 30, 60, 60);
    ctx.stroke();
  };

  // Split layout (vertical)
  const drawSplitLayout = (ctx, cx, cy) => {
    ctx.strokeStyle = PURPLE.base;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(157, 78, 221, 0.1)';

    // Site A (top)
    ctx.beginPath();
    ctx.rect(cx - 40, cy - 100, 80, 60);
    ctx.fill();
    ctx.stroke();

    // Site B (bottom)
    ctx.beginPath();
    ctx.rect(cx - 40, cy + 40, 80, 60);
    ctx.fill();
    ctx.stroke();

    // Mid vertical
    ctx.beginPath();
    ctx.rect(cx - 20, cy - 40, 40, 80);
    ctx.fill();
    ctx.stroke();

    // Ropes
    ctx.strokeStyle = PURPLE.muted;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(cx - 80, cy - 40);
    ctx.lineTo(cx - 20, cy - 40);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + 80, cy + 40);
    ctx.lineTo(cx + 20, cy + 40);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Lotus layout (three sites, rotating doors)
  const drawLotusLayout = (ctx, cx, cy) => {
    ctx.strokeStyle = PURPLE.base;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(157, 78, 221, 0.1)';

    // Site A (left)
    ctx.beginPath();
    ctx.rect(cx - 100, cy - 40, 60, 80);
    ctx.fill();
    ctx.stroke();

    // Site B (top)
    ctx.beginPath();
    ctx.rect(cx - 40, cy - 100, 80, 60);
    ctx.fill();
    ctx.stroke();

    // Site C (right)
    ctx.beginPath();
    ctx.rect(cx + 40, cy - 40, 60, 80);
    ctx.fill();
    ctx.stroke();

    // Rotating door indicators
    ctx.fillStyle = PURPLE.glow;
    for (let i = 0; i < 3; i++) {
      const angle = (i * 120 * Math.PI) / 180;
      const x = cx + 50 * Math.cos(angle);
      const y = cy + 50 * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Sunset layout (standard)
  const drawSunsetLayout = (ctx, cx, cy) => {
    ctx.strokeStyle = PURPLE.base;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(157, 78, 221, 0.1)';

    // Site A (left)
    ctx.beginPath();
    ctx.rect(cx - 100, cy - 40, 70, 80);
    ctx.fill();
    ctx.stroke();

    // Site B (right)
    ctx.beginPath();
    ctx.rect(cx + 30, cy - 40, 70, 80);
    ctx.fill();
    ctx.stroke();

    // Mid connector
    ctx.beginPath();
    ctx.rect(cx - 30, cy - 20, 60, 40);
    ctx.stroke();
  };

  // Default layout
  const drawDefaultLayout = (ctx, cx, cy) => {
    ctx.strokeStyle = PURPLE.base;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(157, 78, 221, 0.1)';

    ctx.beginPath();
    ctx.rect(cx - 80, cy - 60, 160, 120);
    ctx.fill();
    ctx.stroke();
  };

  // Draw callout markers
  const drawCallouts = (ctx, mapId, width, height) => {
    const callouts = getCalloutsForMap(mapId);
    ctx.fillStyle = PURPLE.base;
    ctx.font = '12px monospace';
    ctx.textAlign = 'center';

    callouts.forEach((callout) => {
      const x = width * callout.x;
      const y = height * callout.y;

      // Draw marker
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw label
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.fillText(callout.name, x, y - 10);
      ctx.fillStyle = PURPLE.base;
    });
  };

  // Get callouts for map
  const getCalloutsForMap = (mapId) => {
    const calloutsMap = {
      ascent: [
        { name: 'A Site', x: 0.35, y: 0.3 },
        { name: 'B Site', x: 0.65, y: 0.7 },
        { name: 'Mid', x: 0.5, y: 0.5 },
        { name: 'Tree', x: 0.25, y: 0.4 },
        { name: 'Market', x: 0.75, y: 0.6 },
      ],
      bind: [
        { name: 'A Site', x: 0.25, y: 0.5 },
        { name: 'B Site', x: 0.75, y: 0.5 },
        { name: 'Hookah', x: 0.5, y: 0.7 },
        { name: 'Showers', x: 0.5, y: 0.3 },
      ],
      haven: [
        { name: 'A Site', x: 0.25, y: 0.25 },
        { name: 'B Site', x: 0.75, y: 0.25 },
        { name: 'C Site', x: 0.5, y: 0.75 },
        { name: 'Mid', x: 0.5, y: 0.5 },
      ],
      split: [
        { name: 'A Site', x: 0.5, y: 0.2 },
        { name: 'B Site', x: 0.5, y: 0.8 },
        { name: 'Mid', x: 0.5, y: 0.5 },
        { name: 'Ramps', x: 0.2, y: 0.35 },
        { name: 'Sewer', x: 0.8, y: 0.65 },
      ],
      lotus: [
        { name: 'A Site', x: 0.2, y: 0.5 },
        { name: 'B Site', x: 0.5, y: 0.2 },
        { name: 'C Site', x: 0.8, y: 0.5 },
        { name: 'Main', x: 0.5, y: 0.8 },
      ],
      sunset: [
        { name: 'A Site', x: 0.25, y: 0.5 },
        { name: 'B Site', x: 0.75, y: 0.5 },
        { name: 'Mid', x: 0.5, y: 0.5 },
      ],
    };

    return calloutsMap[mapId] || [];
  };

  // Draw spawn points
  const drawSpawnPoints = (ctx, mapId, width, height) => {
    ctx.fillStyle = 'rgba(0, 255, 136, 0.6)';

    // Attacker spawns (bottom)
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(width * 0.3 + i * 40, height * 0.9, 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Defender spawns (top)
    ctx.fillStyle = 'rgba(255, 70, 85, 0.6)';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(width * 0.3 + i * 40, height * 0.1, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  };

  // Draw sight lines
  const drawSightLines = (ctx, width, height) => {
    ctx.strokeStyle = 'rgba(157, 78, 221, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([8, 4]);

    // Draw diagonal sight lines
    ctx.beginPath();
    ctx.moveTo(width * 0.2, height * 0.2);
    ctx.lineTo(width * 0.8, height * 0.8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(width * 0.8, height * 0.2);
    ctx.lineTo(width * 0.2, height * 0.8);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  // Draw cover zones
  const drawCoverZones = (ctx, width, height) => {
    ctx.fillStyle = 'rgba(157, 78, 221, 0.2)';

    // Corner cover zones
    const zones = [
      { x: 0.15, y: 0.15, w: 0.1, h: 0.1 },
      { x: 0.75, y: 0.15, w: 0.1, h: 0.1 },
      { x: 0.15, y: 0.75, w: 0.1, h: 0.1 },
      { x: 0.75, y: 0.75, w: 0.1, h: 0.1 },
    ];

    zones.forEach((zone) => {
      ctx.fillRect(
        width * zone.x,
        height * zone.y,
        width * zone.w,
        height * zone.h
      );
    });
  };

  // Draw rotation paths
  const drawRotationPaths = (ctx, width, height) => {
    ctx.strokeStyle = 'rgba(0, 212, 255, 0.5)';
    ctx.lineWidth = 3;
    ctx.setLineDash([12, 6]);

    // A to B rotation
    ctx.beginPath();
    ctx.moveTo(width * 0.35, height * 0.3);
    ctx.lineTo(width * 0.5, height * 0.5);
    ctx.lineTo(width * 0.65, height * 0.7);
    ctx.stroke();

    ctx.setLineDash([]);
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-8 h-8 border-2 rounded-full"
          style={{ borderColor: `${PURPLE.base} transparent ${PURPLE.base} transparent` }}
        />
      </div>
    );
  }

  // Grid view mode
  if (viewMode === 'grid') {
    return (
      <div className="h-full flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{ maxWidth: '400px' }}
        >
          {/* Grid lines */}
          {Array.from({ length: 11 }).map((_, i) => (
            <g key={i}>
              <line
                x1={i * 10}
                y1={0}
                x2={i * 10}
                y2={100}
                stroke={PURPLE.base}
                strokeOpacity={0.3}
                strokeWidth={0.5}
              />
              <line
                x1={0}
                y1={i * 10}
                x2={100}
                y2={i * 10}
                stroke={PURPLE.base}
                strokeOpacity={0.3}
                strokeWidth={0.5}
              />
            </g>
          ))}
          {/* Coordinates */}
          <text x="50" y="50" fill={PURPLE.base} fontSize="8" textAnchor="middle">
            {mapId.toUpperCase()}
          </text>
        </svg>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      {/* Canvas for tactical view */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ imageRendering: 'crisp-edges' }}
      />

      {/* Corner markers */}
      <div className="absolute top-2 left-2 w-4 h-4 border-l-2 border-t-2" style={{ borderColor: PURPLE.base }} />
      <div className="absolute top-2 right-2 w-4 h-4 border-r-2 border-t-2" style={{ borderColor: PURPLE.base }} />
      <div className="absolute bottom-2 left-2 w-4 h-4 border-l-2 border-b-2" style={{ borderColor: PURPLE.base }} />
      <div className="absolute bottom-2 right-2 w-4 h-4 border-r-2 border-b-2" style={{ borderColor: PURPLE.base }} />

      {/* Scale indicator */}
      <div className="absolute bottom-4 left-4 px-2 py-1 rounded bg-void-black/80 text-xs font-mono text-slate">
        Scale: 1:{Math.round(100 / zoom)}m
      </div>

      {/* Compass */}
      <div className="absolute top-4 right-4 w-10 h-10 rounded-full border flex items-center justify-center bg-void-black/80"
        style={{ borderColor: PURPLE.base }}
      >
        <Navigation className="w-4 h-4" style={{ color: PURPLE.base }} />
      </div>
    </div>
  );
}

export default MapVisualization;
