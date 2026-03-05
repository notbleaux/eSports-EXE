/**
 * RadialMenu.jsx
 * 12-section SVG zodiacal menu with hover sub-categories
 * Reference: Gufram grid, Phamily segmentation
 */

import React, { useState, useCallback, useMemo } from 'react';
import { GAME_CATEGORIES } from '../data/categories';
import { describePieSlice, polarToCartesian } from '../utils/helpers';
import { useHover } from '../hooks';
import '../styles/radial-menu.css';

const RadialMenu = ({ onCategorySelect, activeCategory = null }) => {
  const [hoveredCategory, setHoveredCategory] = useState(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  const size = 600;
  const center = size / 2;
  const innerRadius = 80;
  const outerRadius = 240;
  const labelRadius = 180;
  
  const categories = GAME_CATEGORIES;
  const totalCategories = categories.length;
  const anglePerCategory = 360 / totalCategories;
  
  // Calculate slice paths for each category
  const slices = useMemo(() => {
    return categories.map((category, index) => {
      const startAngle = index * anglePerCategory;
      const endAngle = (index + 1) * anglePerCategory;
      const midAngle = startAngle + anglePerCategory / 2;
      
      const path = describePieSlice(center, center, innerRadius, outerRadius, startAngle, endAngle);
      const labelPos = polarToCartesian(center, center, labelRadius, midAngle);
      
      return {
        ...category,
        index,
        path,
        labelPos,
        midAngle,
        startAngle,
        endAngle
      };
    });
  }, [categories, center, innerRadius, outerRadius, labelRadius, anglePerCategory]);
  
  const handleMouseEnter = useCallback((category, e) => {
    setHoveredCategory(category);
    const rect = e.currentTarget.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  }, []);
  
  const handleMouseLeave = useCallback(() => {
    setHoveredCategory(null);
  }, []);
  
  const handleClick = useCallback((category) => {
    onCategorySelect?.(category);
  }, [onCategorySelect]);
  
  return (
    <div className="radial-menu-wrapper">
      <svg 
        viewBox={`0 0 ${size} ${size}`}
        className="radial-menu-svg"
        style={{ width: '100%', height: 'auto', maxWidth: size }}
      >
        <defs>
          {/* Glow filter */}
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Gradient definitions for each category */}
          {slices.map((slice) => (
            <linearGradient 
              key={`grad-${slice.id}`}
              id={`gradient-${slice.id}`}
              x1="0%" y1="0%" x2="100%" y2="100%"
            >
              <stop offset="0%" stopColor={slice.color} stopOpacity="0.8" />
              <stop offset="100%" stopColor={slice.color} stopOpacity="0.3" />
            </linearGradient>
          ))}
        </defs>
        
        {/* Background circle */}
        <circle
          cx={center}
          cy={center}
          r={outerRadius + 10}
          fill="none"
          stroke="rgba(232, 230, 227, 0.05)"
          strokeWidth="1"
        />
        
        {/* Category slices */}
        {slices.map((slice) => {
          const isHovered = hoveredCategory?.id === slice.id;
          const isActive = activeCategory?.id === slice.id;
          const isDimmed = hoveredCategory && !isHovered && !isActive;
          
          return (
            <g 
              key={slice.id}
              className={`radial-slice ${isHovered ? 'hovered' : ''} ${isActive ? 'active' : ''} ${isDimmed ? 'dimmed' : ''}`}
              onMouseEnter={(e) => handleMouseEnter(slice, e)}
              onMouseLeave={handleMouseLeave}
              onClick={() => handleClick(slice)}
              style={{ cursor: 'pointer' }}
            >
              <path
                d={slice.path}
                fill={`url(#gradient-${slice.id})`}
                stroke="rgba(232, 230, 227, 0.1)"
                strokeWidth="1"
                className="slice-path"
              />
              
              {/* Category icon */}
              <text
                x={slice.labelPos.x}
                y={slice.labelPos.y - 8}
                textAnchor="middle"
                dominantBaseline="middle"
                className="slice-icon"
                fontSize="24"
              >
                {slice.icon}
              </text>
              
              {/* Category name */}
              <text
                x={slice.labelPos.x}
                y={slice.labelPos.y + 12}
                textAnchor="middle"
                dominantBaseline="middle"
                className="slice-label"
                fontSize="11"
                fontWeight="600"
                fill="#e8e6e3"
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em'
                }}
              >
                {slice.name}
              </text>
              
              {/* Team count */}
              <text
                x={slice.labelPos.x}
                y={slice.labelPos.y + 28}
                textAnchor="middle"
                dominantBaseline="middle"
                className="slice-count"
                fontSize="10"
                fill="#7a7874"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {slice.totalTeams.toLocaleString()} teams
              </text>
            </g>
          );
        })}
        
        {/* Decorative rings */}
        <circle
          cx={center}
          cy={center}
          r={innerRadius - 5}
          fill="none"
          stroke="rgba(201, 176, 55, 0.3)"
          strokeWidth="1"
          strokeDasharray="4 4"
        />
        <circle
          cx={center}
          cy={center}
          r={outerRadius + 5}
          fill="none"
          stroke="rgba(201, 176, 55, 0.2)"
          strokeWidth="1"
        />
      </svg>
      
      {/* Sub-categories panel */}
      {hoveredCategory && (
        <div className="subcategories-panel">
          <div className="subcategories-header" style={{ borderColor: hoveredCategory.color }}>
            <span className="subcategories-icon">{hoveredCategory.icon}</span>
            <div className="subcategories-title-group">
              <h4 className="subcategories-title">{hoveredCategory.fullName}</h4>
              <p className="subcategories-desc">{hoveredCategory.description}</p>
            </div>
          </div>
          
          <div className="subcategories-list">
            {hoveredCategory.subCategories.map((sub) => (
              <div 
                key={sub.id} 
                className="subcategory-item"
                style={{ 
                  '--subcategory-color': hoveredCategory.color 
                }}
              >
                <span className="subcategory-name">{sub.name}</span>
                <span className="subcategory-count">{sub.count}</span>
              </div>
            ))}
          </div>
          
          <div className="subcategories-trending">
            <span className="trending-label">🔥 Trending:</span>
            <div className="trending-tags">
              {hoveredCategory.trending.map((trend, idx) => (
                <span key={idx} className="trending-tag">{trend}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RadialMenu;
