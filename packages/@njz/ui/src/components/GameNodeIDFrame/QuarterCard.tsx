/**
 * QuarterCard Component
 * 
 * Individual quarter card for the GameNodeIDFrame 2×2 grid.
 * Features hover animations, keyboard navigation, and accessibility.
 * 
 * @see SPEC-TD-P3-001 for full specification
 */

import { useState, useCallback } from 'react';
import type { QuarterCardProps } from './types';
import { ANIMATION, A11Y } from './constants';
import { prefersReducedMotion } from './utils';

/**
 * QuarterCard - A single quarter button in the 2×2 grid.
 * 
 * Features:
 * - Hover scale animation (1.05x, 300ms)
 * - Gradient background reveal on hover
 * - Keyboard navigation (Tab, Enter, Space)
 * - ARIA labels for accessibility
 * - Live event indicator
 */
export function QuarterCard({ quarter, onClick, gameId }: QuarterCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const reducedMotion = prefersReducedMotion();

  // Handle keyboard activation
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        onClick();
      }
    },
    [onClick]
  );

  // Dynamic classes based on state
  const baseClasses = `
    relative overflow-hidden rounded-xl p-6 text-left
    ${quarter.color.bg} ${quarter.color.hover}
    focus:outline-none focus:ring-4 ${quarter.color.ring}
    focus:ring-offset-2 focus:ring-offset-slate-900
    group cursor-pointer
  `;

  // Animation classes (disabled if reduced motion preferred)
  const animationClasses = reducedMotion
    ? ''
    : 'transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl';

  // Gradient overlay classes
  const gradientClasses = `
    absolute inset-0 bg-gradient-to-br ${quarter.color.gradient}
    ${reducedMotion ? '' : 'transition-opacity duration-300'}
    ${isHovered || isFocused ? 'opacity-100' : 'opacity-0'}
  `;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onKeyDown={handleKeyDown}
      className={`${baseClasses} ${animationClasses}`}
      aria-label={A11Y.QUARTER_LABEL(quarter.name, quarter.description)}
      role="listitem"
      tabIndex={0}
      data-quarter={quarter.id}
      data-game={gameId}
    >
      {/* Gradient Background Effect */}
      <div className={gradientClasses} aria-hidden="true" />

      {/* Content Container */}
      <div className="relative z-10 flex items-start gap-4">
        {/* Icon */}
        <div className="flex-shrink-0">
          <div
            className={`
              text-4xl text-white/90
              ${reducedMotion ? '' : 'transition-transform duration-300'}
              ${isHovered ? 'scale-110' : 'scale-100'}
            `}
          >
            {quarter.icon}
          </div>
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-xl font-bold text-white mb-1">
            {quarter.name}
          </h3>
          <p className="text-sm text-white/80 line-clamp-2">
            {quarter.description}
          </p>

          {/* Branch Count & Live Stats */}
          <div className="mt-3 flex items-center gap-2 text-xs text-white/70">
            <span className="inline-flex items-center px-2 py-1 rounded-full bg-white/20">
              {quarter.branchCount} branches
            </span>
            
            {/* Live Events Indicator */}
            {quarter.stats?.liveEvents ? (
              <span 
                className="inline-flex items-center px-2 py-1 rounded-full bg-white/20"
                aria-live="polite"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 mr-1.5 animate-pulse" />
                {quarter.stats.liveEvents} live
              </span>
            ) : null}
          </div>
        </div>

        {/* Arrow Indicator */}
        <div
          className={`
            flex-shrink-0 text-white/60 text-xl
            ${reducedMotion ? '' : 'transition-transform duration-300'}
            ${isHovered ? 'translate-x-1' : 'translate-x-0'}
          `}
          aria-hidden="true"
        >
          →
        </div>
      </div>

      {/* Focus Ring (visible only on keyboard focus) */}
      <div
        className={`
          absolute inset-0 rounded-xl border-2
          ${isFocused ? 'border-white/50' : 'border-transparent'}
          ${reducedMotion ? '' : 'transition-colors duration-200'}
        `}
        aria-hidden="true"
      />
    </button>
  );
}
