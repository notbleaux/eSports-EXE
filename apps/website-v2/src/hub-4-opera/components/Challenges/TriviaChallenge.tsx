/**
 * TriviaChallenge Component
 * Trivia question challenge with optional timer
 * 
 * [Ver001.000]
 */

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Brain,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  Lightbulb,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { cn } from '@/utils/cn';
import type { TriviaChallengeProps } from './types';

const OPERA_COLOR = colors.hub.opera.base;
const OPERA_GLOW = colors.hub.opera.glow;
const SUCCESS_COLOR = colors.status.success;
const ERROR_COLOR = colors.status.error;

export const TriviaChallenge: React.FC<TriviaChallengeProps> = ({
  challenge,
  onSubmit,
  hasAttempted,
  result,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [timeRemaining, setTimeRemaining] = useState(challenge.timeLimitSeconds || 30);
  const [isTimeUp, setIsTimeUp] = useState(false);

  // Timer logic
  useEffect(() => {
    if (hasAttempted || !challenge.timeLimitSeconds || isTimeUp) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          setIsTimeUp(true);
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [challenge.timeLimitSeconds, hasAttempted, isTimeUp]);

  // Auto-submit when time is up
  useEffect(() => {
    if (isTimeUp && !hasAttempted) {
      onSubmit(selectedAnswer || 'TIMEOUT');
    }
  }, [isTimeUp, hasAttempted, selectedAnswer, onSubmit]);

  const handleOptionSelect = (option: string) => {
    if (hasAttempted || isTimeUp) return;
    setSelectedAnswer(option);
  };

  const handleSubmit = useCallback(() => {
    if (selectedAnswer && !hasAttempted) {
      onSubmit(selectedAnswer);
    }
  }, [selectedAnswer, hasAttempted, onSubmit]);

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Calculate timer progress
  const timerProgress = challenge.timeLimitSeconds
    ? (timeRemaining / challenge.timeLimitSeconds) * 100
    : 100;

  const getTimerColor = () => {
    if (timerProgress > 50) return '#00ff88';
    if (timerProgress > 25) return '#ffaa00';
    return '#ff4655';
  };

  return (
    <GlassCard className="overflow-hidden" hoverGlow={OPERA_GLOW}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${OPERA_COLOR}20` }}
            >
              <Brain className="w-5 h-5" style={{ color: OPERA_COLOR }} />
            </div>
            <div>
              <h3 className="font-semibold text-white">{challenge.title}</h3>
              <p className="text-xs text-white/50">Test your esports knowledge</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-sm" style={{ color: OPERA_COLOR }}>
            <Trophy className="w-4 h-4" />
            <span className="font-medium">{challenge.tokenReward}</span>
          </div>
        </div>

        {/* Timer */}
        {challenge.timeLimitSeconds && !hasAttempted && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-white/50 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Time Remaining
              </span>
              <span
                className="font-mono font-bold"
                style={{ color: getTimerColor() }}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: getTimerColor() }}
                initial={{ width: '100%' }}
                animate={{ width: `${timerProgress}%` }}
                transition={{ duration: 1, ease: 'linear' }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Question */}
      <div className="p-6">
        <div className="mb-6">
          <div className="flex items-start gap-3">
            <Lightbulb className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: OPERA_COLOR }} />
            <p className="text-lg text-white leading-relaxed">
              {challenge.data.question}
            </p>
          </div>
          {challenge.data.category && (
            <span
              className="ml-8 mt-2 inline-block px-2 py-0.5 rounded text-xs"
              style={{ backgroundColor: `${OPERA_COLOR}20`, color: OPERA_COLOR }}
            >
              {challenge.data.category}
            </span>
          )}
        </div>

        {/* Options */}
        <div className="space-y-3">
          {challenge.data.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = hasAttempted && result?.correctAnswer === option;
            const isWrong = hasAttempted && isSelected && !result?.isCorrect;
            const letter = String.fromCharCode(65 + index); // A, B, C, D...

            return (
              <motion.button
                key={index}
                whileHover={!hasAttempted && !isTimeUp ? { x: 4 } : {}}
                whileTap={!hasAttempted && !isTimeUp ? { scale: 0.98 } : {}}
                onClick={() => handleOptionSelect(option)}
                disabled={hasAttempted || isTimeUp}
                className={cn(
                  'w-full p-4 rounded-lg border-2 transition-all duration-200',
                  'flex items-center gap-4 text-left',
                  isSelected && !hasAttempted
                    ? 'border-purple-500 bg-purple-500/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20',
                  isCorrect && 'border-green-500 bg-green-500/10',
                  isWrong && 'border-red-500 bg-red-500/10',
                  isTimeUp && !hasAttempted && 'opacity-50'
                )}
              >
                {/* Letter Badge */}
                <div
                  className={cn(
                    'w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm flex-shrink-0',
                    isSelected && !hasAttempted && 'bg-purple-500 text-white',
                    !isSelected && !hasAttempted && 'bg-white/10 text-white/70',
                    isCorrect && 'bg-green-500 text-white',
                    isWrong && 'bg-red-500 text-white'
                  )}
                >
                  {isCorrect ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isWrong ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    letter
                  )}
                </div>

                {/* Option Text */}
                <span className={cn(
                  'flex-1',
                  isCorrect && 'text-green-400 font-medium',
                  isWrong && 'text-red-400'
                )}>
                  {option}
                </span>

                {/* Selection Indicator */}
                {!hasAttempted && !isTimeUp && (
                  <div
                    className={cn(
                      'w-5 h-5 rounded-full border-2 transition-all',
                      isSelected
                        ? 'border-purple-500 bg-purple-500'
                        : 'border-white/30'
                    )}
                  >
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="w-full h-full flex items-center justify-center"
                      >
                        <div className="w-2 h-2 bg-white rounded-full" />
                      </motion.div>
                    )}
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Time Up Message */}
        <AnimatePresence>
          {isTimeUp && !hasAttempted && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-4 p-4 rounded-lg bg-red-500/10 text-center"
            >
              <p className="text-red-400 font-medium">Time&apos;s up!</p>
              <p className="text-sm text-white/60">You ran out of time</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Result Message */}
        {hasAttempted && result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
              'mt-4 p-4 rounded-lg',
              result.isCorrect ? 'bg-green-500/10' : 'bg-red-500/10'
            )}
          >
            <div className="flex items-center gap-2 mb-2">
              {result.isCorrect ? (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
              <span className={cn(
                'font-medium',
                result.isCorrect ? 'text-green-400' : 'text-red-400'
              )}>
                {result.isCorrect ? 'Correct!' : 'Incorrect'}
              </span>
            </div>
            {!result.isCorrect && result.correctAnswer && (
              <p className="text-sm text-white/60">
                The correct answer was: <span className="text-white font-medium">{result.correctAnswer}</span>
              </p>
            )}
            {result.isCorrect && (
              <p className="text-sm text-white/60">
                +{result.tokensEarned} tokens earned
              </p>
            )}
          </motion.div>
        )}

        {/* Submit Button */}
        {!hasAttempted && !isTimeUp && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className={cn(
              'w-full py-3 rounded-lg font-medium text-white mt-6',
              'flex items-center justify-center gap-2',
              'transition-all duration-200',
              selectedAnswer
                ? 'opacity-100 cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            )}
            style={{ backgroundColor: selectedAnswer ? OPERA_COLOR : '#4a4a5a' }}
          >
            <Brain className="w-4 h-4" />
            Submit Answer
          </motion.button>
        )}
      </div>
    </GlassCard>
  );
};

export default TriviaChallenge;
