import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface QuarterConfig {
  id: string;
  name: string;
  subtitle: string;
  description: string;
  icon: LucideIcon;
  color: string;
  glow: string;
  path: string;
  stats?: {
    value: string;
    label: string;
  };
}

interface QuarterCardProps {
  hub: QuarterConfig;
  onClick?: () => void;
  className?: string;
}

export function QuarterCard({ hub, onClick, className }: QuarterCardProps) {
  const Icon = hub.icon;
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={cn("relative group cursor-pointer", className)}
      onClick={onClick}
    >
      <div
        className="
          relative h-full min-h-[280px] p-6 md:p-8 rounded-3xl
          bg-white/[0.02] border border-white/10
          transition-all duration-500 overflow-hidden
          group-hover:border-opacity-50 group-hover:bg-white/[0.04]
        "
      >
        {/* Background glow on hover */}
        <div
          className="
            absolute inset-0 opacity-0 group-hover:opacity-100
            transition-opacity duration-500 -z-10
          "
          style={{
            background: `radial-gradient(circle at center, ${hub.glow} 0%, transparent 70%)`,
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div
              className="
                w-14 h-14 rounded-2xl flex items-center justify-center
                transition-transform duration-300 group-hover:scale-110
              "
              style={{ backgroundColor: `${hub.color}20` }}
            >
              <Icon className="w-7 h-7" style={{ color: hub.color }} />
            </div>

            {hub.stats && (
              <div className="text-right">
                <div className="text-2xl font-bold font-mono" style={{ color: hub.color }}>
                  {hub.stats.value}
                </div>
                <div className="text-xs text-white/40 uppercase tracking-wider">
                  {hub.stats.label}
                </div>
              </div>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="mb-4">
            <h2 className="text-2xl md:text-3xl font-bold text-white mb-1">
              {hub.name}
            </h2>
            <p className="text-sm font-medium" style={{ color: hub.color }}>
              {hub.subtitle}
            </p>
          </div>

          {/* Description */}
          <p className="text-white/50 text-sm mb-6 flex-grow">
            {hub.description}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

interface QuarterGridProps {
  quadrants: QuarterConfig[];
  centerContent?: React.ReactNode;
  className?: string;
}

export function QuarterGrid({ quadrants, centerContent, className }: QuarterGridProps) {
  return (
    <div className={cn("relative", className)}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {quadrants.map((hub) => (
          <QuarterCard key={hub.id} hub={hub} />
        ))}
      </div>

      {centerContent && (
        <div className="absolute inset-0 hidden lg:flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto transform scale-90">
            {centerContent}
          </div>
        </div>
      )}
    </div>
  );
}
