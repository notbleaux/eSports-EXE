import React from 'react';
import { ShieldCheck, ShieldAlert, Shield } from 'lucide-react';

export interface GameNodeBadgeProps {
  id: string;
  game: string;
  confidence: number | null;
  status?: 'ACTIVE' | 'ARCHIVED' | 'LOCKED';
  className?: string;
}

export function GameNodeBadge({
  id,
  game,
  confidence,
  status = 'ACTIVE',
  className
}: GameNodeBadgeProps) {
  // Determine color and icon based on confidence
  const getConfidenceLevel = (val: number | null) => {
    if (val === null) return { color: 'text-gray-400', bg: 'bg-gray-400/10', icon: Shield, label: 'Unverified' };
    if (val >= 0.9) return { color: 'text-kunst-green', bg: 'bg-kunst-green/10', icon: ShieldCheck, label: 'High Confidence' };
    if (val >= 0.7) return { color: 'text-yellow-400', bg: 'bg-yellow-400/10', icon: Shield, label: 'Medium Confidence' };
    return { color: 'text-red-400', bg: 'bg-red-400/10', icon: ShieldAlert, label: 'Low Confidence' };
  };

  const level = getConfidenceLevel(confidence);
  const Icon = level.icon;

  return (
    <div className={`inline-flex items-center gap-3 p-1.5 pr-4 rounded-xl border border-white/10 bg-black/40 backdrop-blur-md ${className}`}>
      {/* Confidence Icon */}
      <div className={`w-8 h-8 rounded-lg ${level.bg} flex items-center justify-center`}>
        <Icon className={`w-4 h-4 ${level.color}`} />
      </div>

      {/* Metadata */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-white/40">
            {game}
          </span>
          <span className="w-1 h-1 rounded-full bg-white/20" />
          <span className="text-[10px] font-mono text-white/60">
            Node: {id.substring(0, 8)}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`text-[11px] font-bold ${level.color}`}>
            {level.label}
          </span>
          {confidence !== null && (
            <span className="text-[11px] text-white/30">
              ({(confidence * 100).toFixed(0)}%)
            </span>
          )}
        </div>
      </div>

      {/* Status indicator */}
      <div className="ml-2 pl-4 border-l border-white/5 flex items-center gap-2">
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'ACTIVE' ? 'bg-kunst-green animate-pulse' : 'bg-gray-600'}`} />
        <span className="text-[10px] font-bold text-white/40">{status}</span>
      </div>
    </div>
  );
}
