/** [Ver001.000]
 * CS2WeaponCard Component
 * 
 * Display weapon stats and comparison for CS2 weapons.
 * Supports side-by-side comparison of two weapons.
 */

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Crosshair, 
  DollarSign, 
  Zap, 
  Target, 
  Move,
  TrendingUp,
  ChevronRight,
  Scale
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import type { CS2Weapon, CS2WeaponCategory } from './types';

interface CS2WeaponCardProps {
  weapon: CS2Weapon;
  compareWeapon?: CS2Weapon;
  onClick?: (weapon: CS2Weapon) => void;
  isSelected?: boolean;
  className?: string;
}

interface CS2WeaponCompareProps {
  weapon1: CS2Weapon;
  weapon2: CS2Weapon;
  className?: string;
}

// Category colors
const CATEGORY_COLORS: Record<CS2WeaponCategory, string> = {
  pistol: '#f59e0b',
  smg: '#10b981',
  rifle: '#3b82f6',
  sniper: '#8b5cf6',
  shotgun: '#ef4444',
  machinegun: '#6b7280',
  grenade: '#f97316',
  equipment: '#6366f1',
};

// Category icons/names
const CATEGORY_NAMES: Record<CS2WeaponCategory, string> = {
  pistol: 'Pistol',
  smg: 'SMG',
  rifle: 'Rifle',
  sniper: 'Sniper',
  shotgun: 'Shotgun',
  machinegun: 'Machine Gun',
  grenade: 'Grenade',
  equipment: 'Equipment',
};

// Side badge component
const SideBadge: React.FC<{ side: CS2Weapon['side'] }> = ({ side }) => {
  if (side === 'both') return null;
  
  return (
    <span 
      className={`
        px-1.5 py-0.5 rounded text-[10px] font-bold
        ${side === 'terrorist' ? 'bg-orange-600 text-white' : 'bg-blue-600 text-white'}
      `}
    >
      {side === 'terrorist' ? 'T' : 'CT'}
    </span>
  );
};

// Stat bar component
const StatBar: React.FC<{
  label: string;
  value: number;
  max: number;
  unit?: string;
  color?: string;
  compareValue?: number;
  icon?: React.ReactNode;
}> = ({ 
  label, 
  value, 
  max, 
  unit = '', 
  color = '#f59e0b',
  compareValue,
  icon 
}) => {
  const percentage = Math.min((value / max) * 100, 100);
  const comparePercentage = compareValue !== undefined 
    ? Math.min((compareValue / max) * 100, 100) 
    : undefined;
  const isBetter = compareValue !== undefined && value > compareValue;
  const isWorse = compareValue !== undefined && value < compareValue;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-white/60">
          {icon}
          <span>{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <span className={`font-mono ${isBetter ? 'text-green-400' : isWorse ? 'text-red-400' : 'text-white/80'}`}>
            {value}{unit}
          </span>
          {compareValue !== undefined && (
            <>
              <ChevronRight className="w-3 h-3 text-white/30" />
              <span className="font-mono text-white/40">{compareValue}{unit}</span>
            </>
          )}
        </div>
      </div>
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ backgroundColor: color }}
        />
        {comparePercentage !== undefined && (
          <div
            className="h-full rounded-full bg-white/20 absolute"
            style={{ 
              width: `${comparePercentage}%`,
              marginTop: '-6px'
            }}
          />
        )}
      </div>
    </div>
  );
};

// Single Weapon Card
export const CS2WeaponCard: React.FC<CS2WeaponCardProps> = ({
  weapon,
  compareWeapon,
  onClick,
  isSelected = false,
  className = '',
}) => {
  const categoryColor = CATEGORY_COLORS[weapon.category];
  
  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={() => onClick?.(weapon)}
      className={onClick ? 'cursor-pointer' : ''}
    >
      <GlassCard 
        className={`p-4 ${isSelected ? 'ring-2' : ''} ${className}`}
        style={{ 
          borderColor: isSelected ? categoryColor : undefined,
          boxShadow: isSelected ? `0 0 20px ${categoryColor}30` : undefined 
        }}
        variant="elevated"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Weapon Icon Placeholder */}
            <div 
              className="w-12 h-12 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${categoryColor}20` }}
            >
              <Crosshair className="w-6 h-6" style={{ color: categoryColor }} />
            </div>
            
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white">{weapon.name}</h3>
                <SideBadge side={weapon.side} />
              </div>
              <span 
                className="text-xs"
                style={{ color: categoryColor }}
              >
                {CATEGORY_NAMES[weapon.category]}
              </span>
            </div>
          </div>
          
          {/* Price */}
          <div className="text-right">
            <div className="flex items-center gap-1 text-green-400">
              <DollarSign className="w-4 h-4" />
              <span className="font-bold font-mono">{weapon.price}</span>
            </div>
            <div className="text-xs text-white/40">
              +${weapon.killReward} kill
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-3">
          <StatBar
            label="Damage"
            value={weapon.stats.damage}
            max={200}
            unit=""
            color="#ef4444"
            compareValue={compareWeapon?.stats.damage}
            icon={<Zap className="w-3 h-3" />}
          />
          
          <StatBar
            label="Fire Rate"
            value={weapon.stats.fireRate}
            max={1000}
            unit=" RPM"
            color="#f59e0b"
            compareValue={compareWeapon?.stats.fireRate}
            icon={<TrendingUp className="w-3 h-3" />}
          />
          
          <StatBar
            label="Recoil Control"
            value={weapon.stats.recoilControl}
            max={100}
            unit="%"
            color="#10b981"
            compareValue={compareWeapon?.stats.recoilControl}
            icon={<Target className="w-3 h-3" />}
          />
          
          <StatBar
            label="Armor Penetration"
            value={weapon.stats.armorPenetration}
            max={200}
            unit="%"
            color="#3b82f6"
            compareValue={compareWeapon?.stats.armorPenetration}
            icon={<Crosshair className="w-3 h-3" />}
          />
          
          <StatBar
            label="Movement Speed"
            value={weapon.stats.movementSpeed}
            max={100}
            unit="%"
            color="#8b5cf6"
            compareValue={compareWeapon?.stats.movementSpeed}
            icon={<Move className="w-3 h-3" />}
          />
        </div>

        {/* Ammo Info */}
        <div className="mt-4 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/40">Magazine</span>
            <span className="font-mono text-white/80">
              {weapon.magazineSize} / {weapon.reserveAmmo}
            </span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-white/40">Fire Modes</span>
            <span className="font-mono text-white/80">
              {weapon.fireModes.map(m => m === 'semi' ? 'Semi' : m === 'burst' ? 'Burst' : 'Auto').join(' / ')}
            </span>
          </div>
        </div>

        {/* Description */}
        {weapon.description && (
          <p className="mt-3 text-xs text-white/50 leading-relaxed">
            {weapon.description}
          </p>
        )}
      </GlassCard>
    </motion.div>
  );
};

// Weapon Comparison Component
export const CS2WeaponCompare: React.FC<CS2WeaponCompareProps> = ({
  weapon1,
  weapon2,
  className = '',
}) => {
  return (
    <GlassCard className={`p-4 ${className}`} variant="elevated">
      {/* Header */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <div className="text-center">
          <h3 className="font-bold text-white">{weapon1.name}</h3>
          <span className="text-xs" style={{ color: CATEGORY_COLORS[weapon1.category] }}>
            {CATEGORY_NAMES[weapon1.category]}
          </span>
        </div>
        
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white/10">
          <Scale className="w-5 h-5 text-white/60" />
        </div>
        
        <div className="text-center">
          <h3 className="font-bold text-white">{weapon2.name}</h3>
          <span className="text-xs" style={{ color: CATEGORY_COLORS[weapon2.category] }}>
            {CATEGORY_NAMES[weapon2.category]}
          </span>
        </div>
      </div>

      {/* Price Comparison */}
      <div className="mb-4 p-3 bg-white/5 rounded-lg">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-white/60">Price</span>
          </div>
          <div className="flex items-center gap-3 font-mono">
            <span className={weapon1.price < weapon2.price ? 'text-green-400' : 'text-white/80'}>
              ${weapon1.price}
            </span>
            <span className="text-white/30">vs</span>
            <span className={weapon2.price < weapon1.price ? 'text-green-400' : 'text-white/80'}>
              ${weapon2.price}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Comparison */}
      <div className="space-y-4">
        {[
          { label: 'Damage', key: 'damage', max: 200, unit: '', icon: <Zap className="w-3 h-3" /> },
          { label: 'Fire Rate', key: 'fireRate', max: 1000, unit: ' RPM', icon: <TrendingUp className="w-3 h-3" /> },
          { label: 'Recoil Control', key: 'recoilControl', max: 100, unit: '%', icon: <Target className="w-3 h-3" /> },
          { label: 'Armor Pen', key: 'armorPenetration', max: 200, unit: '%', icon: <Crosshair className="w-3 h-3" /> },
          { label: 'Movement', key: 'movementSpeed', max: 100, unit: '%', icon: <Move className="w-3 h-3" /> },
        ].map((stat) => {
          const val1 = weapon1.stats[stat.key as keyof typeof weapon1.stats];
          const val2 = weapon2.stats[stat.key as keyof typeof weapon2.stats];
          const max = Math.max(val1, val2);
          
          return (
            <div key={stat.key} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 text-white/60">
                  {stat.icon}
                  <span>{stat.label}</span>
                </div>
              </div>
              
              {/* Comparison Bars */}
              <div className="grid grid-cols-2 gap-4">
                {/* Weapon 1 Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">{weapon1.name}</span>
                    <span className="font-mono text-white/80">{val1}{stat.unit}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(val1 / stat.max) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full bg-blue-500"
                    />
                  </div>
                </div>
                
                {/* Weapon 2 Bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-white/40">{weapon2.name}</span>
                    <span className="font-mono text-white/80">{val2}{stat.unit}</span>
                  </div>
                  <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${(val2 / stat.max) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full rounded-full bg-orange-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
};

export default CS2WeaponCard;
