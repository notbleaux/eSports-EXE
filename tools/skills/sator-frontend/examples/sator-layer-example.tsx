import React, { useRef, useEffect, useCallback } from 'react';
import * as d3 from 'd3';
import { LayerProps, SpatialData, SatorEvent } from '../types/spatial';

interface SatorLayerProps extends LayerProps {
  data: SpatialData;
  haloColor?: string;
  pulseDuration?: number;
}

/**
 * SatorLayer - Layer 1: Golden Halo
 * 
 * Visualizes player presence and importance through golden halos.
 * Uses D3.js SVG for smooth animated circles.
 */
export const SatorLayer: React.FC<SatorLayerProps> = ({
  data,
  width,
  height,
  opacity = 1,
  haloColor = '#FFD700',
  pulseDuration = 2000,
  onRenderComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const render = useCallback(() => {
    if (!svgRef.current || !data) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const xScale = d3.scaleLinear()
      .domain([0, data.bounds.maxX])
      .range([0, width]);

    const yScale = d3.scaleLinear()
      .domain([0, data.bounds.maxY])
      .range([height, 0]);

    const g = svg.append('g').attr('class', 'sator-layer');

    // Render player halos
    data.players.forEach((player) => {
      const playerG = g.append('g')
        .attr('class', `player-halo player-${player.id}`)
        .attr('transform', `translate(${xScale(player.x)}, ${yScale(player.y)})`);

      // Outer halo
      playerG.append('circle')
        .attr('r', player.importance * 20)
        .attr('fill', 'none')
        .attr('stroke', haloColor)
        .attr('stroke-width', 2)
        .attr('opacity', 0.6);

      // Inner glow
      playerG.append('circle')
        .attr('r', player.importance * 10)
        .attr('fill', haloColor)
        .attr('opacity', 0.3);

      // Pulsing animation
      playerG.append('circle')
        .attr('r', player.importance * 5)
        .attr('fill', haloColor)
        .attr('opacity', 0.8)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', `${player.importance * 5};${player.importance * 8};${player.importance * 5}`)
        .attr('dur', `${pulseDuration}ms`)
        .attr('repeatCount', 'indefinite');
    });

    onRenderComplete?.();
  }, [data, width, height, haloColor, pulseDuration, onRenderComplete]);

  useEffect(() => {
    render();
  }, [render]);

  return (
    <div 
      ref={containerRef}
      className="layer-container sator-container"
      style={{ 
        width, 
        height, 
        opacity,
        position: 'absolute',
        top: 0,
        left: 0,
        pointerEvents: 'none'
      }}
    >
      <svg
        ref={svgRef}
        width={width}
        height={height}
        className="sator-svg"
      />
    </div>
  );
};

export default SatorLayer;
