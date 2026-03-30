/**
 * PredictionChallenge Component
 * Match winner prediction challenge
 * 
 * [Ver001.000]
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Trophy,
  Calendar,
  Zap,
  CheckCircle2,
  Clock,
  Users,
  Swords,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { cn } from '@/utils/cn';
import type { PredictionChallengeProps } from './types';

const OPERA_COLOR = colors.hub.opera;
const OPERA_GLOW = "rgba(255, 0, 255, 0.4)";

export const PredictionChallenge: React.FC<PredictionChallengeProps> = ({
  challenge,
  onSubmit,
  hasAttempted,
  result,
}) => {
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null);

  const handleTeamSelect = (team: string) => {
    if (hasAttempted) return;
    setSelectedTeam(team);
  };

  const handleSubmit = () => {
    if (selectedTeam && !hasAttempted) {
      onSubmit(selectedTeam);
    }
  };

  const { teamA, teamB, teamALogo, teamBLogo, matchDate } = challenge.data;

  // Format match date
  const formattedDate = new Date(matchDate).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <GlassCard className="overflow-hidden" hoverGlow={OPERA_GLOW}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${OPERA_COLOR}20` }}
          >
            <Zap className="w-5 h-5" style={{ color: OPERA_COLOR }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{challenge.title}</h3>
            <div className="flex items-center gap-1 text-xs text-white/50">
              <Calendar className="w-3 h-3" />
              {formattedDate}
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm" style={{ color: OPERA_COLOR }}>
            <Trophy className="w-4 h-4" />
            <span className="font-medium">{challenge.tokenReward}</span>
          </div>
        </div>
      </div>

      {/* Match Display */}
      <div className="p-6">
        <div className="flex items-center justify-center gap-4">
          {/* Team A */}
          <motion.button
            whileHover={!hasAttempted ? { scale: 1.05 } : {}}
            whileTap={!hasAttempted ? { scale: 0.95 } : {}}
            onClick={() => handleTeamSelect(teamA)}
            disabled={hasAttempted}
            className={cn(
              'flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200',
              'border-2 min-w-[140px]',
              selectedTeam === teamA && !hasAttempted
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20',
              hasAttempted && result?.correctAnswer === teamA && 'border-green-500 bg-green-500/10',
              hasAttempted && selectedTeam === teamA && !result?.isCorrect && 'border-red-500 bg-red-500/10'
            )}
          >
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {teamALogo ? (
                <img src={teamALogo} alt={teamA} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-8 h-8 text-white/50" />
              )}
            </div>
            <span className={cn(
              'font-semibold text-sm text-center',
              hasAttempted && result?.correctAnswer === teamA && 'text-green-400',
              hasAttempted && selectedTeam === teamA && !result?.isCorrect && 'text-red-400'
            )}>
              {teamA}
            </span>
            {hasAttempted && result?.correctAnswer === teamA && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
          </motion.button>

          {/* VS */}
          <div className="flex flex-col items-center gap-1">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${OPERA_COLOR}30` }}
            >
              <Swords className="w-5 h-5" style={{ color: OPERA_COLOR }} />
            </div>
            <span className="text-xs font-bold text-white/40">VS</span>
          </div>

          {/* Team B */}
          <motion.button
            whileHover={!hasAttempted ? { scale: 1.05 } : {}}
            whileTap={!hasAttempted ? { scale: 0.95 } : {}}
            onClick={() => handleTeamSelect(teamB)}
            disabled={hasAttempted}
            className={cn(
              'flex flex-col items-center gap-3 p-4 rounded-xl transition-all duration-200',
              'border-2 min-w-[140px]',
              selectedTeam === teamB && !hasAttempted
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-white/10 bg-white/5 hover:border-white/20',
              hasAttempted && result?.correctAnswer === teamB && 'border-green-500 bg-green-500/10',
              hasAttempted && selectedTeam === teamB && !result?.isCorrect && 'border-red-500 bg-red-500/10'
            )}
          >
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
              {teamBLogo ? (
                <img src={teamBLogo} alt={teamB} className="w-full h-full object-cover" />
              ) : (
                <Users className="w-8 h-8 text-white/50" />
              )}
            </div>
            <span className={cn(
              'font-semibold text-sm text-center',
              hasAttempted && result?.correctAnswer === teamB && 'text-green-400',
              hasAttempted && selectedTeam === teamB && !result?.isCorrect && 'text-red-400'
            )}>
              {teamB}
            </span>
            {hasAttempted && result?.correctAnswer === teamB && (
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            )}
          </motion.button>
        </div>

        {/* Result Message */}
        {hasAttempted && result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-6 p-4 rounded-lg text-center',
              result.isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'
            )}
          >
            <p className={cn(
              'font-medium',
              result.isCorrect ? 'text-green-400' : 'text-red-400'
            )}>
              {result.isCorrect 
                ? `Correct! You predicted ${result.correctAnswer} would win.` 
                : `The match hasn't concluded yet. Check back later for results!`}
            </p>
            {result.isCorrect && (
              <p className="text-sm text-white/60 mt-1">
                +{result.tokensEarned} tokens earned
              </p>
            )}
          </motion.div>
        )}

        {/* Pending Message */}
        {hasAttempted && !result?.isCorrect && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-white/50">
            <Clock className="w-4 h-4" />
            <span>Results will be available after the match</span>
          </div>
        )}

        {/* Submit Button */}
        {!hasAttempted && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!selectedTeam}
            className={cn(
              'w-full py-3 rounded-lg font-medium text-white mt-6',
              'flex items-center justify-center gap-2',
              'transition-all duration-200',
              selectedTeam
                ? 'opacity-100 cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            )}
            style={{ backgroundColor: selectedTeam ? OPERA_COLOR : '#4a4a5a' }}
          >
            <Zap className="w-4 h-4" />
            Lock in Prediction
          </motion.button>
        )}
      </div>
    </GlassCard>
  );
};

export default PredictionChallenge;
