import React from 'react';
import { motion } from 'framer-motion';
import { Shield, Users, Activity } from 'lucide-react';
import { cn } from './utils';

export interface WorldPortCardProps {
  id: string;
  displayName: string;
  game: string;
  isActive: boolean;
  nodeCount: number;
  lastUpdated?: string;
  onClick?: () => void;
  className?: string;
}

export function WorldPortCard({
  displayName,
  game,
  isActive,
  nodeCount,
  lastUpdated,
  onClick,
  className
}: WorldPortCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-2xl",
        "border border-white/10 bg-white/[0.03] p-6",
        "transition-all duration-300 hover:border-white/20 hover:bg-white/[0.06]",
        className
      )}
      onClick={onClick}
    >
      {/* Background accent */}
      <div className={cn(
        "absolute -top-10 -right-10 h-32 w-32 rounded-full blur-3xl opacity-10 transition-opacity group-hover:opacity-20",
        isActive ? 'bg-kunst-green' : 'bg-gray-400'
      )} />

      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield className={cn("w-4 h-4", isActive ? 'text-kunst-green' : 'text-gray-400')} />
            <span className="text-xs font-mono uppercase tracking-widest text-white/40">
              {game}
            </span>
          </div>
          <div className={cn(
            "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-tighter",
            isActive ? 'bg-kunst-green/20 text-kunst-green' : 'bg-gray-400/20 text-gray-400'
          )}>
            {isActive ? 'Active' : 'Coming Soon'}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-2xl font-bold text-white mb-2 group-hover:text-boitano-pink transition-colors">
          {displayName}
        </h3>

        {/* Stats */}
        <div className="mt-auto grid grid-cols-2 gap-4">
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase font-mono">GameNodes</span>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3 text-white/50" />
              <span className="text-sm font-bold text-white/80">{nodeCount}</span>
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-white/30 uppercase font-mono">Sync Status</span>
            <div className="flex items-center gap-1">
              <Activity className="w-3 h-3 text-kunst-green/50" />
              <span className="text-sm font-bold text-kunst-green/80">Stable</span>
            </div>
          </div>
        </div>

        {lastUpdated && (
          <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center">
            <span className="text-[10px] text-white/20 italic">Updated {lastUpdated}</span>
            <span className="text-[10px] font-mono text-white/40 group-hover:text-white transition-colors">
              Access Network →
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
