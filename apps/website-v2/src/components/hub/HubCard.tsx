/**
 * [Ver001.000]
 * HubCard Component
 * 
 * Bold, asymmetric card design inspired by Boitano's central symbol concept.
 * Features large typography, accent borders, and dynamic hover states.
 * 
 * Design influences:
 * - Kunsthalle Basel: Strong visual hierarchy, geometric precision
 * - Boitano: Central symbolic elements, asymmetric balance
 * - Swiss Editorial: Clean typography, intentional whitespace
 */

import React, { useRef, useEffect, useState } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Gamepad2, 
  Users, 
  BarChart3, 
  Settings,
  ArrowRight,
  TrendingUp,
  Target,
  Zap,
  Layers,
  type LucideIcon
} from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface HubStats {
  value: string;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
  change?: string;
}

export interface HubCardProps {
  /** Unique hub identifier */
  id: string;
  /** Hub number (1-5) for visual indicator */
  number: number;
  /** Hub name */
  name: string;
  /** Short subtitle/tagline */
  subtitle: string;
  /** Description text */
  description: string;
  /** Accent color for borders and highlights */
  color: string;
  /** Icon component */
  icon: LucideIcon;
  /** Statistics to display */
  stats: HubStats;
  /** Route path for navigation */
  href: string;
  /** Whether card is featured (larger) */
  featured?: boolean;
  /** Additional CSS classes */
  className?: string;
  /** Animation delay for staggered reveals */
  delay?: number;
}

// ============================================================================
// Hub Configuration
// ============================================================================

export const HUB_CONFIG: Record<string, Omit<HubCardProps, 'delay'>> = {
  sator: {
    id: 'sator',
    number: 1,
    name: 'SATOR',
    subtitle: 'Analytics Core',
    description: 'Advanced player metrics with SimRating and RAR decomposition. Real-time performance analytics and statistical modeling.',
    color: '#D4A574',
    icon: Activity,
    stats: { value: '2.4M', label: 'Data Points Analyzed', trend: 'up', change: '+12%' },
    href: '/sator',
  },
  rotas: {
    id: 'rotas',
    number: 2,
    name: 'ROTAS',
    subtitle: 'Simulation Engine',
    description: 'Deterministic tactical FPS simulation with 20 TPS precision. Replay analysis and predictive modeling.',
    color: '#A8C686',
    icon: Gamepad2,
    stats: { value: '98.7%', label: 'Simulation Accuracy', trend: 'up', change: '+3%' },
    href: '/rotas',
  },
  arepo: {
    id: 'arepo',
    number: 3,
    name: 'AREPO',
    subtitle: 'Knowledge Base',
    description: 'Community-driven tactics database. Map callouts, lineups, and strategic guides from top players.',
    color: '#E8B4B8',
    icon: Users,
    stats: { value: '15K+', label: 'Community Guides', trend: 'up', change: '+24%' },
    href: '/arepo',
  },
  opera: {
    id: 'opera',
    number: 4,
    name: 'OPERA',
    subtitle: 'Live Operations',
    description: 'Real-time tournament tracking, live odds, and fantasy esports. Circuit standings and match predictions.',
    color: '#8FB8ED',
    icon: BarChart3,
    stats: { value: '89%', label: 'Prediction Accuracy', trend: 'neutral', change: '0%' },
    href: '/opera',
  },
  tenet: {
    id: 'tenet',
    number: 5,
    name: 'TENET',
    subtitle: 'Central Hub',
    description: 'Unified dashboard with SATOR Square visualization. Cross-hub integration and system settings.',
    color: '#E07A5F',
    icon: Settings,
    stats: { value: '5', label: 'Connected Hubs', trend: 'up', change: '+1' },
    href: '/tenet',
  },
};

// ============================================================================
// Trend Indicator Component
// ============================================================================

const TrendIndicator: React.FC<{ trend: HubStats['trend']; change?: string }> = ({ 
  trend, 
  change 
}) => {
  if (!trend || trend === 'neutral') return null;
  
  const isUp = trend === 'up';
  const colorClass = isUp ? 'text-green-600' : 'text-red-500';
  
  return (
    <span className={`flex items-center gap-0.5 text-xs font-medium ${colorClass}`}>
      <TrendingUp 
        size={12} 
        className={isUp ? '' : 'rotate-180'} 
      />
      {change}
    </span>
  );
};

// ============================================================================
// Main HubCard Component
// ============================================================================

export const HubCard: React.FC<HubCardProps> = ({
  id,
  number,
  name,
  subtitle,
  description,
  color,
  icon: Icon,
  stats,
  href,
  featured = false,
  className = '',
  delay = 0,
}) => {
  const navigate = useNavigate();
  const cardRef = useRef<HTMLDivElement>(null);
  
  // 3D tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const mouseXSpring = useSpring(x, { stiffness: 300, damping: 30 });
  const mouseYSpring = useSpring(y, { stiffness: 300, damping: 30 });
  
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ['8deg', '-8deg']);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ['-8deg', '8deg']);
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    
    x.set(xPct);
    y.set(yPct);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  const handleClick = () => {
    navigate(href);
  };

  // Card dimensions based on featured state
  const cardWidth = featured ? 'w-[480px]' : 'w-[400px]';
  const cardHeight = featured ? 'h-[560px]' : 'h-[500px]';
  const numberSize = featured ? 'text-[10rem]' : 'text-[8rem]';
  
  return (
    <motion.div
      ref={cardRef}
      className={`
        relative ${cardWidth} ${cardHeight} flex-shrink-0
        bg-white dark:bg-[#141414]
        border-l-[6px] 
        cursor-pointer
        scroll-snap-center
        select-none
        overflow-hidden
        ${className}
      `}
      style={{
        borderLeftColor: color,
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        perspective: 1000,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.6, 
        delay,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        y: -8,
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        transition: { duration: 0.3 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Background Number Indicator */}
      <motion.span 
        className={`
          absolute top-2 right-4 
          ${numberSize} 
          font-display font-black 
          leading-none 
          pointer-events-none
          transition-colors duration-500
        `}
        style={{ 
          color: `${color}08`,
          WebkitTextStroke: `1px ${color}15`,
        }}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, delay: delay + 0.2 }}
      >
        {number}
      </motion.span>
      
      {/* Geometric Accent Shape */}
      <motion.div
        className="absolute -right-20 -top-20 w-40 h-40 rounded-full opacity-5"
        style={{ backgroundColor: color }}
        animate={{ 
          scale: [1, 1.1, 1],
          rotate: [0, 90, 0],
        }}
        transition={{ 
          duration: 20, 
          repeat: Infinity,
          ease: 'linear'
        }}
      />
      
      {/* Content Container */}
      <div className="relative h-full flex flex-col p-8 z-10">
        
        {/* Header: Icon + Number Badge */}
        <div className="flex items-start justify-between mb-8">
          <motion.div 
            className="w-16 h-16 flex items-center justify-center bg-pure-black dark:bg-white text-white dark:text-pure-black"
            whileHover={{ scale: 1.05, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Icon size={28} strokeWidth={1.5} />
          </motion.div>
          
          <span 
            className="text-xs font-mono tracking-widest uppercase px-3 py-1 border"
            style={{ 
              borderColor: color,
              color: color,
            }}
          >
            Hub {number}
          </span>
        </div>
        
        {/* Main Content */}
        <div className="flex-1">
          <motion.h3 
            className="text-headline font-display font-bold tracking-tight text-pure-black dark:text-off-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay + 0.1 }}
          >
            {name}
          </motion.h3>
          
          <motion.p 
            className="text-small uppercase tracking-widest mt-1 font-medium"
            style={{ color }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.15 }}
          >
            {subtitle}
          </motion.p>
          
          <motion.p 
            className="mt-4 text-body text-dark-gray dark:text-medium-gray leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: delay + 0.2 }}
          >
            {description}
          </motion.p>
        </div>
        
        {/* Stats Section */}
        <motion.div 
          className="pt-6 border-t border-border-light dark:border-border-medium"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: delay + 0.25 }}
        >
          <div className="flex items-baseline gap-2">
            <span 
              className="text-display font-display font-bold tracking-tight"
              style={{ color }}
            >
              {stats.value}
            </span>
            {stats.trend && stats.trend !== 'neutral' && (
              <TrendIndicator trend={stats.trend} change={stats.change} />
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-small uppercase tracking-wide text-medium-gray">
              {stats.label}
            </span>
          </div>
        </motion.div>
        
        {/* CTA Button */}
        <motion.button
          className="
            mt-6 w-full py-4 
            bg-pure-black dark:bg-white 
            text-white dark:text-pure-black 
            uppercase tracking-widest text-sm font-semibold
            flex items-center justify-center gap-2
            transition-colors duration-300
            group
          "
          whileHover={{ 
            backgroundColor: color,
            color: '#FFFFFF',
          }}
          whileTap={{ scale: 0.98 }}
        >
          <span>Explore</span>
          <ArrowRight 
            size={16} 
            className="transition-transform duration-300 group-hover:translate-x-1" 
          />
        </motion.button>
      </div>
      
      {/* Hover Overlay Gradient */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `linear-gradient(135deg, ${color}05 0%, transparent 50%)`,
        }}
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      />
    </motion.div>
  );
};

// ============================================================================
// Compact Hub Card Variant
// ============================================================================

export interface HubCardCompactProps {
  hubId: keyof typeof HUB_CONFIG;
  onClick?: () => void;
  className?: string;
}

export const HubCardCompact: React.FC<HubCardCompactProps> = ({
  hubId,
  onClick,
  className = '',
}) => {
  const config = HUB_CONFIG[hubId];
  if (!config) return null;
  
  const { name, subtitle, color, icon: Icon, href } = config;
  const navigate = useNavigate();
  
  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(href);
    }
  };
  
  return (
    <motion.div
      className={`
        relative flex items-center gap-4 p-4 
        bg-white dark:bg-[#1A1A1A]
        border-l-4 cursor-pointer
        group
        ${className}
      `}
      style={{ borderLeftColor: color }}
      onClick={handleClick}
      whileHover={{ 
        x: 4,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
      }}
      whileTap={{ scale: 0.98 }}
    >
      <div 
        className="w-12 h-12 flex items-center justify-center transition-colors duration-300"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={22} style={{ color }} />
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="font-display font-semibold text-pure-black dark:text-off-white truncate">
          {name}
        </h4>
        <p className="text-xs uppercase tracking-wider text-medium-gray truncate">
          {subtitle}
        </p>
      </div>
      
      <ArrowRight 
        size={16} 
        className="text-medium-gray transition-all duration-300 group-hover:translate-x-1 group-hover:text-pure-black dark:group-hover:text-off-white" 
      />
    </motion.div>
  );
};

// ============================================================================
// Hub Card Grid
// ============================================================================

export interface HubCardGridProps {
  hubs?: (keyof typeof HUB_CONFIG)[];
  featuredHub?: keyof typeof HUB_CONFIG;
  className?: string;
}

export const HubCardGrid: React.FC<HubCardGridProps> = ({
  hubs = ['sator', 'rotas', 'arepo', 'opera', 'tenet'],
  featuredHub,
  className = '',
}) => {
  return (
    <div className={className}>
      {/* Featured Hub (if any) */}
      {featuredHub && (
        <div className="mb-8">
          <HubCard {...HUB_CONFIG[featuredHub]} featured delay={0} />
        </div>
      )}
      
      {/* Horizontal Scroll Container */}
      <div className="scroll-snap-x flex gap-6 overflow-x-auto pb-4 -mx-4 px-4">
        {hubs
          .filter(h => h !== featuredHub)
          .map((hubId, index) => (
            <HubCard 
              key={hubId}
              {...HUB_CONFIG[hubId]}
              delay={index * 0.1}
            />
          ))}
      </div>
    </div>
  );
};

// ============================================================================
// Export Hub Icons for External Use
// ============================================================================

export const HubIcons = {
  Activity,
  Gamepad2,
  Users,
  BarChart3,
  Settings,
  ArrowRight,
  TrendingUp,
  Target,
  Zap,
  Layers,
};

export default HubCard;
