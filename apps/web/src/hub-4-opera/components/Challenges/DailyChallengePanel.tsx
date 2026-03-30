/**
 * DailyChallengePanel Component
 * Main container showing today's challenge with OPERA theme
 * 
 * [Ver001.000]
 */

import React from 'react';
import { motion } from 'framer-motion';
import {
  Calendar,
  Trophy,
  Zap,
  Play,
  HelpCircle,
  BarChart3,
  Brain,
  CheckCircle2,
  Loader2,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { cn } from '@/utils/cn';
import type { DailyChallengePanelProps, ChallengeType, ChallengeDifficulty } from './types';

const OPERA_COLOR = colors.hub.opera;
const OPERA_GLOW = "rgba(255, 0, 255, 0.4)";

// Challenge type configurations
const TYPE_CONFIG: Record<ChallengeType, { label: string; icon: typeof Play; color: string }> = {
  video_quiz: { label: 'Video Quiz', icon: Play, color: '#ff4655' },
  prediction: { label: 'Match Prediction', icon: Zap, color: '#00d4ff' },
  stat_guess: { label: 'Stat Guess', icon: BarChart3, color: '#00ff88' },
  trivia: { label: 'Trivia', icon: Brain, color: '#ffd700' },
};

// Difficulty configurations
const DIFFICULTY_CONFIG: Record<ChallengeDifficulty, { label: string; color: string; bg: string }> = {
  easy: { label: 'Easy', color: '#00ff88', bg: 'rgba(0, 255, 136, 0.15)' },
  medium: { label: 'Medium', color: '#ffaa00', bg: 'rgba(255, 170, 0, 0.15)' },
  hard: { label: 'Hard', color: '#ff4655', bg: 'rgba(255, 70, 85, 0.15)' },
};

// Loading skeleton component
const ChallengeSkeleton: React.FC = () => (
  <div className="animate-pulse space-y-4">
    <div className="h-8 bg-white/10 rounded-lg w-3/4" />
    <div className="h-4 bg-white/5 rounded w-full" />
    <div className="h-4 bg-white/5 rounded w-2/3" />
    <div className="flex gap-3 mt-6">
      <div className="h-10 bg-white/10 rounded-lg w-24" />
      <div className="h-10 bg-white/10 rounded-lg w-32" />
    </div>
  </div>
);

// Already completed state
const CompletedState: React.FC<{ tokenReward: number }> = ({ tokenReward }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    className="flex flex-col items-center justify-center py-12 text-center"
  >
    <motion.div
      animate={{ scale: [1, 1.1, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
      style={{ backgroundColor: 'rgba(0, 255, 136, 0.2)' }}
    >
      <CheckCircle2 className="w-10 h-10" style={{ color: colors.status.success }} />
    </motion.div>
    <h3 className="text-xl font-semibold text-white mb-2">Challenge Completed!</h3>
    <p className="text-white/60 text-sm mb-4">
      You earned <span className="font-bold" style={{ color: OPERA_COLOR }}>{tokenReward} tokens</span> today
    </p>
    <p className="text-white/40 text-xs">Come back tomorrow for a new challenge</p>
  </motion.div>
);

export const DailyChallengePanel: React.FC<DailyChallengePanelProps> = ({
  className,
}) => {
  // In a real implementation, this would use the useChallenges hook
  // const { dailyChallenge, isLoading, hasAttempted, result } = useChallenges();
  
  // Mock state for demonstration
  const isLoading = false;
  const hasAttempted = false;
  const dailyChallenge = {
    id: 'challenge-001',
    type: 'video_quiz' as ChallengeType,
    title: 'Who Won This Round?',
    description: 'Watch the VOD clip and predict which team won this crucial round in the VCT Masters match.',
    difficulty: 'medium' as ChallengeDifficulty,
    tokenReward: 50,
  };

  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const typeConfig = TYPE_CONFIG[dailyChallenge.type];
  const difficultyConfig = DIFFICULTY_CONFIG[dailyChallenge.difficulty];
  const TypeIcon = typeConfig.icon;

  return (
    <GlassCard
      className={cn('overflow-hidden', className)}
      hoverGlow={OPERA_GLOW}
    >
      {/* Header */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${OPERA_COLOR}20` }}
            >
              <Calendar className="w-5 h-5" style={{ color: OPERA_COLOR }} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-white">Today&apos;s Challenge</h2>
              <p className="text-xs text-white/50">{formattedDate}</p>
            </div>
          </div>
          <div
            className="px-3 py-1 rounded-full text-xs font-medium"
            style={{ backgroundColor: difficultyConfig.bg, color: difficultyConfig.color }}
          >
            {difficultyConfig.label}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {isLoading ? (
          <ChallengeSkeleton />
        ) : hasAttempted ? (
          <CompletedState tokenReward={dailyChallenge.tokenReward} />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            {/* Challenge Type Badge */}
            <div className="flex items-center gap-2">
              <div
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium"
                style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
              >
                <TypeIcon className="w-3.5 h-3.5" />
                {typeConfig.label}
              </div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-white">{dailyChallenge.title}</h3>

            {/* Description */}
            <p className="text-sm text-white/60 leading-relaxed">
              {dailyChallenge.description}
            </p>

            {/* Token Reward */}
            <div className="flex items-center gap-2 p-3 rounded-lg bg-white/5">
              <Trophy className="w-5 h-5" style={{ color: OPERA_COLOR }} />
              <span className="text-sm text-white/80">Reward:</span>
              <span className="text-sm font-bold" style={{ color: OPERA_COLOR }}>
                {dailyChallenge.tokenReward} tokens
              </span>
            </div>

            {/* CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-3 rounded-lg font-medium text-white flex items-center justify-center gap-2"
              style={{ backgroundColor: OPERA_COLOR }}
            >
              <Play className="w-4 h-4" />
              Start Challenge
            </motion.button>
          </motion.div>
        )}
      </div>
    </GlassCard>
  );
};

export default DailyChallengePanel;
