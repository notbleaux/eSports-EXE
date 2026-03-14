/**
 * ChallengeResult Component
 * Result display after attempting a challenge with confetti animation
 * 
 * [Ver001.000]
 */

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2,
  XCircle,
  Coins,
  Flame,
  Share2,
  X,
  Sparkles,
  Trophy,
  Lightbulb,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { cn } from '@/utils/cn';
import type { ChallengeResultProps } from './types';

const OPERA_COLOR = colors.hub.opera.base;
const SUCCESS_COLOR = colors.status.success;
const ERROR_COLOR = colors.status.error;

// Confetti particle component
const Confetti: React.FC = () => {
  const particles = Array.from({ length: 50 });
  const colors_list = ['#9d4edd', '#00ff88', '#ffd700', '#00d4ff', '#ff4655'];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-2 h-2 rounded-full"
          style={{
            backgroundColor: colors_list[i % colors_list.length],
            left: `${Math.random() * 100}%`,
            top: -10,
          }}
          animate={{
            y: [0, 400 + Math.random() * 200],
            x: [(Math.random() - 0.5) * 200, (Math.random() - 0.5) * 300],
            rotate: [0, 360 + Math.random() * 360],
            opacity: [1, 1, 0],
          }}
          transition={{
            duration: 2 + Math.random() * 1,
            ease: 'easeOut',
            delay: Math.random() * 0.5,
          }}
        />
      ))}
    </div>
  );
};

export const ChallengeResult: React.FC<ChallengeResultProps> = ({
  result,
  onClose,
  onShare,
}) => {
  const [showConfetti, setShowConfetti] = useState(result.isCorrect);

  useEffect(() => {
    if (result.isCorrect) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [result.isCorrect]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50"
      onClick={onClose}
    >
      <GlassCard
        className="relative w-full max-w-md overflow-hidden"
        onClick={(e: React.MouseEvent) => e.stopPropagation()}
      >
        {showConfetti && <Confetti />}

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/10 transition-colors z-10"
        >
          <X className="w-5 h-5 text-white/60" />
        </button>

        {/* Content */}
        <div className="p-8 text-center relative z-10">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', damping: 15 }}
            className={cn(
              'w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6',
              result.isCorrect ? 'bg-green-500/20' : 'bg-red-500/20'
            )}
          >
            {result.isCorrect ? (
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 10, -10, 0]
                }}
                transition={{ 
                  duration: 0.5,
                  repeat: result.isCorrect ? Infinity : 0,
                  repeatDelay: 2
                }}
              >
                <CheckCircle2 
                  className="w-12 h-12" 
                  style={{ color: SUCCESS_COLOR }} 
                />
              </motion.div>
            ) : (
              <XCircle 
                className="w-12 h-12" 
                style={{ color: ERROR_COLOR }} 
              />
            )}
          </motion.div>

          {/* Title */}
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={cn(
              'text-2xl font-bold mb-2',
              result.isCorrect ? 'text-green-400' : 'text-red-400'
            )}
          >
            {result.isCorrect ? 'Correct!' : 'Not Quite!'}
          </motion.h2>

          {/* Message */}
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-white/80 mb-6"
          >
            {result.message}
          </motion.p>

          {/* Tokens Earned */}
          {result.isCorrect && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, type: 'spring' }}
              className="mb-6"
            >
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coins className="w-6 h-6" style={{ color: OPERA_COLOR }} />
                <span className="text-3xl font-bold" style={{ color: OPERA_COLOR }}>
                  +{result.tokensEarned}
                </span>
              </div>
              <p className="text-sm text-white/50">tokens earned</p>
            </motion.div>
          )}

          {/* Streak Counter */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-2 mb-6"
          >
            <motion.div
              animate={result.streak > 0 ? {
                scale: [1, 1.2, 1],
                rotate: [0, -5, 5, 0],
              } : {}}
              transition={{
                duration: 0.5,
                repeat: result.streak > 0 ? Infinity : 0,
                repeatDelay: 1,
              }}
            >
              <Flame 
                className="w-6 h-6" 
                style={{ 
                  color: result.streak > 0 ? '#ff9f1c' : '#4a4a5a'
                }} 
              />
            </motion.div>
            <span className="text-lg font-semibold">
              {result.streak > 0 ? `${result.streak} day streak!` : 'Streak reset'}
            </span>
          </motion.div>

          {/* Correct Answer Reveal (if wrong) */}
          {!result.isCorrect && result.correctAnswer && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-4 rounded-lg bg-white/5 mb-6"
            >
              <p className="text-sm text-white/60 mb-1">Correct answer:</p>
              <p className="text-lg font-semibold text-white">{result.correctAnswer}</p>
            </motion.div>
          )}

          {/* Explanation */}
          {result.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-start gap-2 p-4 rounded-lg bg-white/5 mb-6 text-left"
            >
              <Lightbulb className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color: OPERA_COLOR }} />
              <p className="text-sm text-white/70">{result.explanation}</p>
            </motion.div>
          )}

          {/* Share Button */}
          {result.isCorrect && onShare && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onShare}
              className="w-full py-3 rounded-lg font-medium text-white mb-3 flex items-center justify-center gap-2 border border-white/20 hover:bg-white/5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share Result
            </motion.button>
          )}

          {/* Come Back Tomorrow Message */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-sm text-white/40"
          >
            Come back tomorrow for a new challenge!
          </motion.p>
        </div>
      </GlassCard>
    </motion.div>
  );
};

export default ChallengeResult;
