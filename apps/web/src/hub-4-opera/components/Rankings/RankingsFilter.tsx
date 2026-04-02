// @ts-nocheck
/**
 * RankingsFilter Component
 * Filter controls for rankings
 * 
 * [Ver001.000]
 */

import React from 'react';
import { motion } from 'framer-motion';
import { Search, X, Filter, Globe, Award, User } from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { cn } from '@/utils/cn';
import type { RankingsFilterProps } from './types';

const OPERA_COLOR = '#9d4edd';
const OPERA_GLOW = 'rgba(157, 78, 221, 0.4)';

const RankingsFilter: React.FC<RankingsFilterProps> = ({
  regions,
  tiers,
  roles,
  selectedRegion,
  selectedTier,
  selectedRole,
  searchQuery = '',
  onFilterChange,
}) => {
  const hasActiveFilters = selectedRegion || selectedTier || selectedRole || searchQuery;

  const handleClearFilters = () => {
    onFilterChange({
      region: null,
      tier: null,
      role: null,
      search: '',
    });
  };

  return (
    <GlassCard className="p-4" hoverGlow={OPERA_GLOW}>
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Search..."
            className={cn(
              'w-full pl-10 pr-4 py-2 rounded-lg',
              'bg-white/5 border border-white/10',
              'text-sm text-white placeholder-white/40',
              'focus:outline-none focus:border-purple-500 transition-colors'
            )}
            style={{ '--tw-border-opacity': 0.1 } as React.CSSProperties}
          />
          {searchQuery && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-3 h-3 opacity-50" />
            </button>
          )}
        </div>

        {/* Region Filter */}
        <div className="relative">
          <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <select
            value={selectedRegion || ''}
            onChange={(e) => onFilterChange({ region: e.target.value || null })}
            className={cn(
              'pl-10 pr-8 py-2 rounded-lg',
              'bg-white/5 border border-white/10',
              'text-sm text-white',
              'focus:outline-none focus:border-purple-500 transition-colors',
              'appearance-none cursor-pointer'
            )}
            style={{ minWidth: '140px' }}
          >
            <option value="" className="bg-[#12121a]">All Regions</option>
            {regions.map((region) => (
              <option key={region} value={region} className="bg-[#12121a]">
                {region}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none" />
        </div>

        {/* Tier Filter */}
        <div className="relative">
          <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
          <select
            value={selectedTier || ''}
            onChange={(e) => onFilterChange({ tier: e.target.value || null })}
            className={cn(
              'pl-10 pr-8 py-2 rounded-lg',
              'bg-white/5 border border-white/10',
              'text-sm text-white',
              'focus:outline-none focus:border-purple-500 transition-colors',
              'appearance-none cursor-pointer'
            )}
            style={{ minWidth: '120px' }}
          >
            <option value="" className="bg-[#12121a]">All Tiers</option>
            {tiers.map((tier) => (
              <option key={tier} value={tier} className="bg-[#12121a]">
                Tier {tier}
              </option>
            ))}
          </select>
          <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none" />
        </div>

        {/* Role Filter (for players) */}
        {roles && roles.length > 0 && (
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50" />
            <select
              value={selectedRole || ''}
              onChange={(e) => onFilterChange({ role: e.target.value || null })}
              className={cn(
                'pl-10 pr-8 py-2 rounded-lg',
                'bg-white/5 border border-white/10',
                'text-sm text-white',
                'focus:outline-none focus:border-purple-500 transition-colors',
                'appearance-none cursor-pointer'
              )}
              style={{ minWidth: '130px' }}
            >
              <option value="" className="bg-[#12121a]">All Roles</option>
              {roles.map((role) => (
                <option key={role} value={role} className="bg-[#12121a]">
                  {role}
                </option>
              ))}
            </select>
            <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 opacity-50 pointer-events-none" />
          </div>
        )}

        {/* Clear Filters */}
        {hasActiveFilters && (
          <motion.button
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            onClick={handleClearFilters}
            className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-lg',
              'text-sm font-medium transition-colors',
              'hover:bg-white/10 text-white/70'
            )}
          >
            <X className="w-4 h-4" />
            Clear
          </motion.button>
        )}
      </div>
    </GlassCard>
  );
};

// Chevron down icon component
const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    width="16"
    height="16"
  >
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

export default RankingsFilter;
