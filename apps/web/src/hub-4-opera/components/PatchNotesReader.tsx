// @ts-nocheck
/**
 * PatchNotesReader Component
 * Browse patch changelogs with agent, weapon, and map changes
 * [Ver001.000]
 */
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, 
  Calendar, 
  ChevronRight, 
  ChevronDown,
  Users,
  Target,
  Map,
  ExternalLink,
  Check,
  X,
  Minus
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { Patch, PatchAgentChange, PatchWeaponChange, PatchMapChange } from '../types';

// Purple theme colors
const PURPLE = {
  base: '#9d4edd',
  glow: 'rgba(157, 78, 221, 0.4)',
  muted: '#7a3aaa',
};

// Change type colors
const CHANGE_TYPE_COLORS = {
  buff: { bg: 'bg-green-500/20', text: 'text-green-400', icon: '↑' },
  nerf: { bg: 'bg-red-500/20', text: 'text-red-400', icon: '↓' },
  adjustment: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', icon: '↔' },
  new: { bg: 'bg-purple-500/20', text: 'text-purple-400', icon: '★' },
};

interface PatchNotesReaderProps {
  patches: Patch[];
  selectedPatch: Patch | null;
  onSelectPatch: (patch: Patch) => void;
  loading: boolean;
}

function PatchNotesReader({
  patches,
  selectedPatch,
  onSelectPatch,
  loading,
}: PatchNotesReaderProps): JSX.Element {
  const [expandedPatches, setExpandedPatches] = useState<Set<number>>(new Set());

  const togglePatch = (patchId: number) => {
    setExpandedPatches(prev => {
      const newSet = new Set(prev);
      if (newSet.has(patchId)) {
        newSet.delete(patchId);
      } else {
        newSet.add(patchId);
      }
      return newSet;
    });
    
    const patch = patches.find(p => p.patch_id === patchId);
    if (patch) {
      onSelectPatch(patch);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getPatchTypeBadge = (type: string) => {
    switch (type) {
      case 'major':
        return { bg: 'bg-red-500/20', text: 'text-red-400' };
      case 'minor':
        return { bg: 'bg-blue-500/20', text: 'text-blue-400' };
      case 'hotfix':
        return { bg: 'bg-orange-500/20', text: 'text-orange-400' };
      case 'beta':
        return { bg: 'bg-purple-500/20', text: 'text-purple-400' };
      default:
        return { bg: 'bg-gray-500/20', text: 'text-gray-400' };
    }
  };

  const renderChangeIcon = (changeType: string) => {
    switch (changeType) {
      case 'buff':
        return <span className="text-green-400">↑</span>;
      case 'nerf':
        return <span className="text-red-400">↓</span>;
      case 'adjustment':
        return <span className="text-yellow-400">↔</span>;
      case 'new':
        return <span className="text-purple-400">★</span>;
      case 'added':
        return <Check className="w-4 h-4 text-green-400" />;
      case 'removed':
        return <X className="w-4 h-4 text-red-400" />;
      case 'updated':
        return <Minus className="w-4 h-4 text-yellow-400" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-2 rounded-full"
            style={{ borderColor: `${PURPLE.base} transparent ${PURPLE.base} transparent` }}
          />
        </div>
      ) : patches.length === 0 ? (
        <GlassCard className="p-8 text-center">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" style={{ color: PURPLE.base }} />
          <p className="text-sm opacity-60">No patch notes available</p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {patches.map((patch, index) => {
            const isExpanded = expandedPatches.has(patch.patch_id);
            const isSelected = selectedPatch?.patch_id === patch.patch_id;
            const typeBadge = getPatchTypeBadge(patch.patch_type);

            return (
              <motion.div
                key={patch.patch_id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <GlassCard
                  className={`overflow-hidden transition-all duration-300 ${
                    isSelected ? 'ring-1' : ''
                  }`}
                  style={{
                    borderColor: isSelected ? PURPLE.base : undefined,
                    boxShadow: isSelected ? `0 0 20px ${PURPLE.glow}` : undefined,
                  }}
                >
                  {/* Patch Header */}
                  <button
                    onClick={() => togglePatch(patch.patch_id)}
                    className="w-full p-4 flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5" style={{ color: PURPLE.base }} />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: PURPLE.base }}>
                            Patch {patch.version}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${typeBadge.bg} ${typeBadge.text}`}>
                            {patch.patch_type}
                          </span>
                          {patch.is_active_competitive && (
                            <span className="text-xs px-2 py-0.5 rounded bg-green-500/20 text-green-400">
                              Active
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs opacity-60 mt-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(patch.release_date)}
                        </div>
                      </div>
                    </div>

                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ChevronDown className="w-5 h-5 opacity-60" />
                    </motion.div>
                  </button>

                  {/* Expanded Content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4 border-t border-white/10 pt-4">
                          {/* Summary */}
                          {patch.summary && (
                            <p className="text-sm opacity-80">{patch.summary}</p>
                          )}

                          {/* Agent Changes */}
                          {patch.agent_changes && patch.agent_changes.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4" style={{ color: PURPLE.base }} />
                                <span className="text-sm font-medium">Agent Changes</span>
                              </div>
                              <div className="space-y-2">
                                {patch.agent_changes.map((change, idx) => (
                                  <AgentChangeRow key={idx} change={change} />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Weapon Changes */}
                          {patch.weapon_changes && patch.weapon_changes.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Target className="w-4 h-4" style={{ color: PURPLE.base }} />
                                <span className="text-sm font-medium">Weapon Changes</span>
                              </div>
                              <div className="space-y-2">
                                {patch.weapon_changes.map((change, idx) => (
                                  <WeaponChangeRow key={idx} change={change} />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Map Changes */}
                          {patch.map_changes && patch.map_changes.length > 0 && (
                            <div>
                              <div className="flex items-center gap-2 mb-2">
                                <Map className="w-4 h-4" style={{ color: PURPLE.base }} />
                                <span className="text-sm font-medium">Map Changes</span>
                              </div>
                              <div className="space-y-2">
                                {patch.map_changes.map((change, idx) => (
                                  <MapChangeRow key={idx} change={change} />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* External Link */}
                          {patch.notes_url && (
                            <a
                              href={patch.notes_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center gap-2 w-full py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors text-sm"
                              style={{ color: PURPLE.base }}
                            >
                              <ExternalLink className="w-4 h-4" />
                              View Full Patch Notes
                            </a>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Agent Change Row Component
function AgentChangeRow({ change }: { change: PatchAgentChange }): JSX.Element {
  const [isExpanded, setIsExpanded] = useState(false);
  const colors = CHANGE_TYPE_COLORS[change.change_type];

  return (
    <div className="bg-white/5 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full p-3 flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}>
            {colors.icon} {change.change_type}
          </span>
          <span className="text-sm font-medium">{change.agent_name}</span>
        </div>
        {change.ability_changes && change.ability_changes.length > 0 && (
          <ChevronDown 
            className={`w-4 h-4 opacity-60 transition-transform ${isExpanded ? 'rotate-180' : ''}`} 
          />
        )}
      </button>
      
      <div className="px-3 pb-3">
        <p className="text-xs opacity-70">{change.description}</p>
      </div>

      {/* Ability Changes */}
      {isExpanded && change.ability_changes && change.ability_changes.length > 0 && (
        <div className="px-3 pb-3 space-y-2 border-t border-white/10 pt-2">
          {change.ability_changes.map((ability, idx) => (
            <div key={idx} className="flex items-start gap-2 pl-4">
              <span className={`text-xs px-1.5 py-0.5 rounded ${CHANGE_TYPE_COLORS[ability.change_type].bg} ${CHANGE_TYPE_COLORS[ability.change_type].text}`}>
                {ability.ability_name}
              </span>
              <span className="text-xs opacity-60">{ability.description}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Weapon Change Row Component
function WeaponChangeRow({ change }: { change: PatchWeaponChange }): JSX.Element {
  const colors = CHANGE_TYPE_COLORS[change.change_type];

  return (
    <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
      <span className={`px-2 py-0.5 rounded text-xs ${colors.bg} ${colors.text}`}>
        {colors.icon} {change.change_type}
      </span>
      <span className="text-sm font-medium">{change.weapon_name}</span>
      <span className="text-xs opacity-60 flex-1">{change.description}</span>
    </div>
  );
}

// Map Change Row Component
function MapChangeRow({ change }: { change: PatchMapChange }): JSX.Element {
  return (
    <div className="bg-white/5 rounded-lg p-3 flex items-center gap-3">
      {renderChangeIcon(change.change_type)}
      <span className="text-sm font-medium">{change.map_name}</span>
      <span className="text-xs opacity-60 flex-1">{change.description}</span>
    </div>
  );
}

// Helper function for map change icons
function renderChangeIcon(changeType: string) {
  switch (changeType) {
    case 'added':
      return <Check className="w-4 h-4 text-green-400" />;
    case 'removed':
      return <X className="w-4 h-4 text-red-400" />;
    case 'updated':
      return <Minus className="w-4 h-4 text-yellow-400" />;
    default:
      return null;
  }
}

export default PatchNotesReader;
