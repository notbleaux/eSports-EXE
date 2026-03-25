/**
 * [Ver001.000]
 * HubGridV2 Component
 *
 * Asymmetric, dynamic hub grid with bold Swiss editorial design.
 * Inspired by Kunsthalle Basel side-scroller + dynamic compositions.
 *
 * Design Features:
 * - 12-column asymmetric grid with varying card sizes
 * - No border-radius (sharp corners throughout)
 * - Bold color blocks (pink/green/black)
 * - Hover scale effect with z-index lift
 * - Staggered typography hierarchy
 * - Minimal decoration - focus on content
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

// ============================================================================
// Types
// ============================================================================

export interface Hub {
  id: string;
  name: string;
  path: string;
  subtitle: string;
  description: string;
  color: string;
  stat: string;
  statLabel: string;
  size: 'large' | 'medium' | 'full';
}

// ============================================================================
// Hub Data
// ============================================================================

export const HUBS: Hub[] = [
  {
    id: 'sator',
    name: 'SATOR',
    path: '/analytics',
    subtitle: 'The Observatory',
    description: 'Raw data ingestion with orbital ring navigation and real-time analytics.',
    color: 'bg-kunst-green',
    stat: '2.4M',
    statLabel: 'Records Processed',
    size: 'large',
  },
  {
    id: 'rotas',
    name: 'ROTAS',
    path: '/stats',
    subtitle: 'The Harmonic Layer',
    description: 'Advanced predictive analytics with ellipse layer blending technology.',
    color: 'bg-boitano-pink',
    stat: '99.9%',
    statLabel: 'Prediction Accuracy',
    size: 'medium',
  },
  {
    id: 'arepo',
    name: 'AREPO',
    path: '/community',
    subtitle: 'The Directory',
    description: 'Comprehensive Q&A, documentation, and knowledge base system.',
    color: 'bg-pure-black text-white',
    stat: '247',
    statLabel: 'Documentation Pages',
    size: 'medium',
  },
  {
    id: 'opera',
    name: 'OPERA',
    path: '/pro-scene',
    subtitle: 'The Nexus',
    description: 'Interactive maps with fog of war and spatial visualization tools.',
    color: 'bg-kunst-green',
    stat: '6',
    statLabel: 'Tactical Maps',
    size: 'large',
  },
  {
    id: 'tenet',
    name: 'TENET',
    path: '/hubs',
    subtitle: 'The Center',
    description: 'Unify all perspectives—the palindromic hubs all connect here.',
    color: 'bg-boitano-pink',
    stat: 'Central',
    statLabel: 'Hub',
    size: 'full',
  },
];

// ============================================================================
// Grid Position Configuration
// ============================================================================

/**
 * Grid span configuration for each hub position
 * Creates asymmetric, dynamic layout with overlapping potential
 */
const GRID_CONFIG: Record<number, { colSpan: string; rowSpan?: string }> = {
  0: { colSpan: 'col-span-12 md:col-span-7' }, // SATOR - takes ~60%
  1: { colSpan: 'col-span-12 md:col-span-5' }, // ROTAS - takes ~40%
  2: { colSpan: 'col-span-12 md:col-span-5' }, // AREPO - takes ~40%
  3: { colSpan: 'col-span-12 md:col-span-7' }, // OPERA - takes ~60%
  4: { colSpan: 'col-span-12' },               // TENET - full width
};

// ============================================================================
// Animation Variants
// ============================================================================

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: {
    opacity: 0,
    y: 40,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1], // out-expo
    },
  },
};

const headerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// ============================================================================
// Hub Card Component
// ============================================================================

export interface HubCardProps {
  hub: Hub;
  index: number;
}

export const HubCard: React.FC<HubCardProps> = ({ hub, index }) => {
  const gridConfig = GRID_CONFIG[index];
  const minHeight = hub.size === 'large' ? 'min-h-[280px] md:min-h-[400px]' :
                    hub.size === 'full' ? 'min-h-[200px] md:min-h-[280px]' : 'min-h-[240px] md:min-h-[320px]';

  // Determine text color based on background
  const isDarkBg = hub.color.includes('pure-black');
  const textColorClass = isDarkBg ? 'text-white' : 'text-pure-black';
  const subtitleOpacity = isDarkBg ? 'opacity-60' : 'opacity-50';
  const descriptionOpacity = isDarkBg ? 'opacity-80' : 'opacity-70';

  return (
    <motion.div
      variants={cardVariants}
      className={`
        ${gridConfig.colSpan}
        ${hub.color}
        ${minHeight}
        group relative overflow-hidden
        transition-all duration-500 ease-out-expo
        hover:scale-[1.02] hover:z-10
      `}
    >
      <Link
        to={hub.path}
        className="block h-full w-full"
      >
        {/* Card Content */}
        <div className="p-8 md:p-10 h-full flex flex-col justify-between relative z-10">
          {/* Top Section */}
          <div>
            {/* Subtitle */}
            <span className={`
              text-xs uppercase tracking-[0.2em] 
              ${subtitleOpacity}
              ${textColorClass}
              font-mono
            `}>
              {hub.subtitle}
            </span>

            {/* Hub Name */}
            <h3 className={`
              text-4xl md:text-5xl font-display font-bold mt-3 
              tracking-tight
              ${textColorClass}
            `}>
              {hub.name}
            </h3>

            {/* Description */}
            <p className={`
              mt-4 text-sm md:text-base leading-relaxed 
              max-w-sm
              ${descriptionOpacity}
              ${textColorClass}
            `}>
              {hub.description}
            </p>
          </div>

          {/* Bottom Section */}
          <div className="flex justify-between items-end mt-8">
            {/* Stat */}
            <div>
              <span className={`
                text-3xl md:text-4xl font-display font-bold 
                tracking-tight
                ${textColorClass}
              `}>
                {hub.stat}
              </span>
              <p className={`
                text-xs uppercase tracking-[0.15em] mt-1
                ${subtitleOpacity}
                ${textColorClass}
                font-mono
              `}>
                {hub.statLabel}
              </p>
            </div>

            {/* Explore Arrow */}
            <span className={`
              text-sm uppercase tracking-[0.15em] 
              flex items-center gap-2 
              group-hover:gap-4 transition-all duration-300
              ${textColorClass}
              font-mono
            `}>
              Explore
              <span className="text-xl transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </span>
          </div>
        </div>

        {/* Hover Overlay Effect */}
        <div className="
          absolute inset-0 bg-white 
          opacity-0 group-hover:opacity-10 
          transition-opacity duration-300
          pointer-events-none
        " />

        {/* Corner Accent (visual interest) */}
        <div className={`
          absolute top-0 right-0 w-24 h-24 
          opacity-0 group-hover:opacity-100
          transition-opacity duration-500
          pointer-events-none
        `}>
          <div className={`
            absolute top-4 right-4 w-8 h-[2px]
            ${isDarkBg ? 'bg-white/30' : 'bg-pure-black/20'}
          `} />
          <div className={`
            absolute top-4 right-4 w-[2px] h-8
            ${isDarkBg ? 'bg-white/30' : 'bg-pure-black/20'}
          `} />
        </div>
      </Link>
    </motion.div>
  );
};

// ============================================================================
// Section Header Component
// ============================================================================

export const HubSectionHeader: React.FC = () => {
  return (
    <motion.div
      variants={headerVariants}
      className="mb-16 md:mb-20"
    >
      {/* Section Label */}
      <span className="
        text-xs uppercase tracking-[0.2em] 
        text-text-muted font-mono
      ">
        Platform Overview
      </span>

      {/* Main Title */}
      <h2 className="
        text-display uppercase font-display font-bold 
        text-pure-black mt-3
        tracking-tight
      ">
        Five Hubs
      </h2>

      {/* Description */}
      <p className="
        text-text-secondary mt-4 max-w-xl 
        text-body leading-relaxed
      ">
        Each quadrant offers unique capabilities. Navigate between them to access 
        the full platform—analytics, simulation, knowledge, visualization, and 
        unified control.
      </p>

      {/* Decorative Line */}
      <div className="mt-8 flex items-center gap-4">
        <div className="w-16 h-[2px] bg-pure-black" />
        <div className="w-2 h-2 bg-boitano-pink" />
        <div className="w-2 h-2 bg-kunst-green" />
      </div>
    </motion.div>
  );
};

// ============================================================================
// Main HubGridV2 Component
// ============================================================================

export interface HubGridV2Props {
  className?: string;
  showHeader?: boolean;
}

export const HubGridV2: React.FC<HubGridV2Props> = ({
  className = '',
  showHeader = true,
}) => {
  return (
    <section className={`py-24 md:py-32 bg-off-white overflow-x-hidden ${className}`}>
      <div className="container mx-auto px-6 md:px-8">
        {/* Section Header */}
        {showHeader && <HubSectionHeader />}

        {/* Asymmetric Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-12 gap-4 md:gap-6"
        >
          {HUBS.map((hub, index) => (
            <HubCard key={hub.id} hub={hub} index={index} />
          ))}
        </motion.div>

        {/* Bottom Note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="mt-12 text-center text-small text-text-muted font-mono tracking-wider"
        >
          SATOR · ROTAS · AREPO · OPERA · TENET
        </motion.p>
      </div>
    </section>
  );
};

// ============================================================================
// Individual Hub Card Export (for flexible use)
// ============================================================================

export const HubCardStandalone: React.FC<{
  hubId: string;
  className?: string;
}> = ({ hubId, className = '' }) => {
  const hub = HUBS.find(h => h.id === hubId);
  if (!hub) return null;

  const index = HUBS.findIndex(h => h.id === hubId);
  return (
    <div className={className}>
      <HubCard hub={hub} index={index} />
    </div>
  );
};

// ============================================================================
// Exports
// ============================================================================

export default HubGridV2;
