/**
 * VideoChallenge Component
 * Video quiz challenge ("Who won this round?")
 * 
 * [Ver001.000]
 */

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Youtube,
  Clock,
  Trophy,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { cn } from '@/utils/cn';
import type { VideoChallengeProps } from './types';

const OPERA_COLOR = colors.hub.opera.base;
const OPERA_GLOW = colors.hub.opera.glow;
const SUCCESS_COLOR = colors.status.success;
const ERROR_COLOR = colors.status.error;

export const VideoChallenge: React.FC<VideoChallengeProps> = ({
  challenge,
  onSubmit,
  hasAttempted,
  result,
}) => {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const handleOptionSelect = (option: string) => {
    if (hasAttempted) return;
    setSelectedAnswer(option);
  };

  const handleSubmit = () => {
    if (selectedAnswer && !hasAttempted) {
      onSubmit(selectedAnswer);
    }
  };

  const handleReplay = () => {
    setSelectedAnswer(null);
    setIsPlaying(false);
    // Reload iframe to reset video
    if (iframeRef.current) {
      const src = iframeRef.current.src;
      iframeRef.current.src = src;
    }
  };

  // Build YouTube embed URL with timestamp
  const getEmbedUrl = () => {
    const baseUrl = challenge.data.videoUrl.replace('watch?v=', 'embed/');
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}start=${challenge.data.roundTimestamp}&enablejsapi=1`;
  };

  return (
    <GlassCard className="overflow-hidden" hoverGlow={OPERA_GLOW}>
      {/* Header */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${OPERA_COLOR}20` }}
          >
            <Youtube className="w-5 h-5" style={{ color: OPERA_COLOR }} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-white">{challenge.title}</h3>
            <p className="text-xs text-white/50">
              Round starts at {Math.floor(challenge.data.roundTimestamp / 60)}:
              {(challenge.data.roundTimestamp % 60).toString().padStart(2, '0')}
            </p>
          </div>
          <div className="flex items-center gap-1 text-sm" style={{ color: OPERA_COLOR }}>
            <Trophy className="w-4 h-4" />
            <span className="font-medium">{challenge.tokenReward}</span>
          </div>
        </div>
      </div>

      {/* Video Player */}
      <div className="relative aspect-video bg-black">
        <iframe
          ref={iframeRef}
          src={getEmbedUrl()}
          title="Challenge Video"
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          onLoad={() => setIsPlaying(true)}
        />
        
        {/* Result Overlay */}
        <AnimatePresence>
          {hasAttempted && result && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-center p-6"
              >
                {result.isCorrect ? (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 0.5 }}
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: `${SUCCESS_COLOR}30` }}
                    >
                      <CheckCircle2 className="w-10 h-10" style={{ color: SUCCESS_COLOR }} />
                    </motion.div>
                    <h4 className="text-xl font-bold mb-2" style={{ color: SUCCESS_COLOR }}>
                      Correct!
                    </h4>
                    <p className="text-white/80 text-sm mb-2">
                      +{result.tokensEarned} tokens earned
                    </p>
                  </>
                ) : (
                  <>
                    <motion.div
                      animate={{ x: [-5, 5, -5, 5, 0] }}
                      transition={{ duration: 0.5 }}
                      className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
                      style={{ backgroundColor: `${ERROR_COLOR}30` }}
                    >
                      <XCircle className="w-10 h-10" style={{ color: ERROR_COLOR }} />
                    </motion.div>
                    <h4 className="text-xl font-bold mb-2" style={{ color: ERROR_COLOR }}>
                      Incorrect
                    </h4>
                    <p className="text-white/60 text-sm">
                      Correct answer: <span className="text-white font-medium">{result.correctAnswer}</span>
                    </p>
                  </>
                )}
                
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleReplay}
                  className="mt-4 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 text-sm"
                >
                  <RotateCcw className="w-4 h-4" />
                  Watch Again
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Options */}
      <div className="p-4 space-y-3">
        <p className="text-sm text-white/70 mb-3">
          Which team won this round?
        </p>
        
        <div className="grid grid-cols-2 gap-3">
          {challenge.data.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = hasAttempted && result?.correctAnswer === option;
            const isWrong = hasAttempted && isSelected && !result?.isCorrect;

            return (
              <motion.button
                key={index}
                whileHover={!hasAttempted ? { scale: 1.02 } : {}}
                whileTap={!hasAttempted ? { scale: 0.98 } : {}}
                onClick={() => handleOptionSelect(option)}
                disabled={hasAttempted}
                className={cn(
                  'p-4 rounded-lg border-2 transition-all duration-200 text-left',
                  'flex items-center gap-3',
                  isSelected && !hasAttempted && 'border-purple-500 bg-purple-500/10',
                  !isSelected && !hasAttempted && 'border-white/10 bg-white/5 hover:border-white/20',
                  isCorrect && 'border-green-500 bg-green-500/10',
                  isWrong && 'border-red-500 bg-red-500/10'
                )}
              >
                <div
                  className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                    isSelected ? 'border-purple-500 bg-purple-500' : 'border-white/30',
                    isCorrect && 'border-green-500 bg-green-500',
                    isWrong && 'border-red-500 bg-red-500'
                  )}
                >
                  {(isSelected || isCorrect) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-2 h-2 bg-white rounded-full"
                    />
                  )}
                </div>
                <span className={cn(
                  'text-sm font-medium',
                  isCorrect && 'text-green-400',
                  isWrong && 'text-red-400'
                )}>
                  {option}
                </span>
              </motion.button>
            );
          })}
        </div>

        {/* Submit Button */}
        {!hasAttempted && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={!selectedAnswer}
            className={cn(
              'w-full py-3 rounded-lg font-medium text-white mt-4',
              'flex items-center justify-center gap-2',
              'transition-all duration-200',
              selectedAnswer
                ? 'opacity-100 cursor-pointer'
                : 'opacity-50 cursor-not-allowed'
            )}
            style={{ backgroundColor: selectedAnswer ? OPERA_COLOR : '#4a4a5a' }}
          >
            <Play className="w-4 h-4" />
            Submit Answer
          </motion.button>
        )}
      </div>
    </GlassCard>
  );
};

export default VideoChallenge;
