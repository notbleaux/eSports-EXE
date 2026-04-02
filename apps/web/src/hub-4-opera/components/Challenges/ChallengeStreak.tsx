// @ts-nocheck
/**
 * ChallengeStreak Component
 * Streak tracker display with visual calendar
 * 
 * [Ver001.000]
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Flame,
  Trophy,
  Target,
  Calendar,
  TrendingUp,
  Award,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { cn } from '@/utils/cn';
import type { ChallengeStreakProps } from './types';

const OPERA_COLOR = colors.hub.opera;
const OPERA_GLOW = "rgba(255, 0, 255, 0.4)";

// Generate last 30 days for calendar display
const generateCalendarDays = (streakDays: string[] = []) => {
  const days = [];
  const today = new Date();
  
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    days.push({
      date: dateStr,
      day: date.getDate(),
      isToday: i === 0,
      hasChallenge: streakDays.includes(dateStr),
      isPast: i > 0,
    });
  }
  
  return days;
};

// Get streak message based on current streak
const getStreakMessage = (streak: number): string => {
  if (streak === 0) return 'Start your streak today!';
  if (streak < 3) return 'Good start! Keep it going!';
  if (streak < 7) return 'Nice streak! You\'re on fire!';
  if (streak < 14) return 'Impressive dedication!';
  if (streak < 30) return 'Incredible streak! Legendary!';
  return 'Unstoppable! True mastery!';
};

export const ChallengeStreak: React.FC<ChallengeStreakProps> = ({ streak }) => {
  const calendarDays = generateCalendarDays(streak.streakDays);
  const successRate = streak.totalCorrect > 0 
    ? Math.round((streak.totalCorrect / (streak.totalCorrect + Math.max(0, streak.current - streak.totalCorrect))) * 100) 
    : 0;

  return (
    <div className="space-y-4">
      {/* Main Stats Card */}
      <GlassCard className="p-6" hoverGlow={OPERA_GLOW}>
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            animate={streak.current > 0 ? {
              scale: [1, 1.1, 1],
              rotate: [0, -5, 5, 0],
            } : {}}
            transition={{
              duration: 0.5,
              repeat: streak.current > 0 ? Infinity : 0,
              repeatDelay: 2,
            }}
            className="relative"
          >
            <div
              className="w-20 h-20 rounded-2xl flex items-center justify-center"
              style={{ 
                backgroundColor: streak.current > 0 ? 'rgba(255, 159, 28, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                boxShadow: streak.current > 0 ? '0 0 30px rgba(255, 159, 28, 0.3)' : 'none',
              }}
            >
              <Flame 
                className="w-10 h-10" 
                style={{ color: streak.current > 0 ? '#ff9f1c' : '#4a4a5a' }}
              />
            </div>
            {streak.current > 0 && (
              <motion.div
                className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: OPERA_COLOR }}
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              >
                🔥
              </motion.div>
            )}
          </motion.div>
          
          <div className="flex-1">
            <p className="text-sm text-white/50 mb-1">Current Streak</p>
            <h3 className="text-4xl font-bold text-white">
              {streak.current}
              <span className="text-lg text-white/50 ml-1">days</span>
            </h3>
            <p className="text-sm mt-1" style={{ color: streak.current > 0 ? '#ff9f1c' : '#4a4a5a' }}>
              {getStreakMessage(streak.current)}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-white/5 text-center">
            <Trophy className="w-5 h-5 mx-auto mb-2" style={{ color: OPERA_COLOR }} />
            <p className="text-2xl font-bold text-white">{streak.longest}</p>
            <p className="text-xs text-white/50">Longest</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 text-center">
            <Target className="w-5 h-5 mx-auto mb-2" style={{ color: colors.status.success }} />
            <p className="text-2xl font-bold text-white">{streak.totalCorrect}</p>
            <p className="text-xs text-white/50">Total Correct</p>
          </div>
          
          <div className="p-4 rounded-xl bg-white/5 text-center">
            <TrendingUp className="w-5 h-5 mx-auto mb-2" style={{ color: colors.status.info }} />
            <p className="text-2xl font-bold text-white">{successRate}%</p>
            <p className="text-xs text-white/50">Success Rate</p>
          </div>
        </div>
      </GlassCard>

      {/* Calendar Card */}
      <GlassCard className="p-6" hoverGlow={OPERA_GLOW}>
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5" style={{ color: OPERA_COLOR }} />
          <h4 className="font-semibold text-white">Last 30 Days</h4>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
            <div key={i} className="text-center text-xs text-white/30 py-1">
              {day}
            </div>
          ))}
          
          {calendarDays.map((day, index) => (
            <motion.div
              key={day.date}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.01 }}
              className={cn(
                'aspect-square rounded-lg flex items-center justify-center text-xs font-medium',
                day.isToday && 'ring-2',
                day.hasChallenge 
                  ? 'text-white' 
                  : 'text-white/30',
                day.hasChallenge
                  ? 'bg-gradient-to-br from-orange-500/40 to-red-500/40'
                  : day.isToday
                  ? 'bg-white/10'
                  : 'bg-white/5'
              )}
              style={day.isToday ? { ringColor: OPERA_COLOR } : {}}
            >
              {day.day}
            </motion.div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-orange-500/40 to-red-500/40" />
            <span className="text-xs text-white/50">Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/10 ring-1" style={{ ringColor: OPERA_COLOR }} />
            <span className="text-xs text-white/50">Today</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-white/5" />
            <span className="text-xs text-white/50">Missed</span>
          </div>
        </div>
      </GlassCard>

      {/* Achievement Badges */}
      <GlassCard className="p-6" hoverGlow={OPERA_GLOW}>
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5" style={{ color: OPERA_COLOR }} />
          <h4 className="font-semibold text-white">Achievements</h4>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { icon: Flame, label: '3 Day Streak', min: 3, achieved: streak.current >= 3 || streak.longest >= 3 },
            { icon: Trophy, label: '7 Day Streak', min: 7, achieved: streak.current >= 7 || streak.longest >= 7 },
            { icon: Target, label: '30 Correct', min: 30, achieved: streak.totalCorrect >= 30 },
            { icon: Award, label: '50 Correct', min: 50, achieved: streak.totalCorrect >= 50 },
          ].map((badge, index) => {
            const Icon = badge.icon;
            return (
              <motion.div
                key={badge.label}
                whileHover={badge.achieved ? { scale: 1.05 } : {}}
                className={cn(
                  'flex flex-col items-center gap-2 p-3 rounded-xl transition-all',
                  badge.achieved 
                    ? 'bg-white/10' 
                    : 'bg-white/5 opacity-50 grayscale'
                )}
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center',
                    badge.achieved ? 'bg-white/20' : 'bg-white/10'
                  )}
                >
                  <Icon 
                    className="w-5 h-5" 
                    style={{ color: badge.achieved ? OPERA_COLOR : '#4a4a5a' }}
                  />
                </div>
                <span className="text-[10px] text-center text-white/70">{badge.label}</span>
              </motion.div>
            );
          })}
        </div>
      </GlassCard>
    </div>
  );
};

export default ChallengeStreak;
