/**
 * ChallengesContainer Component
 * Main container with tabs for Today, Upcoming, History, and Streak
 * 
 * [Ver001.000]
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Target,
  Calendar,
  History,
  Flame,
  Zap,
  Play,
  Brain,
  BarChart3,
  Trophy,
  ChevronRight,
  Lock,
} from 'lucide-react';
import { GlassCard } from '@/components/ui/GlassCard';
import { colors } from '@/theme/colors';
import { cn } from '@/utils/cn';
import { useChallenges } from './hooks/useChallenges';
import DailyChallengePanel from './DailyChallengePanel';
import VideoChallenge from './VideoChallenge';
import PredictionChallenge from './PredictionChallenge';
import TriviaChallenge from './TriviaChallenge';
import ChallengeResult from './ChallengeResult';
import ChallengeStreak from './ChallengeStreak';
import ChallengeHistory from './ChallengeHistory';
import type { ChallengesContainerProps, ChallengeType } from './types';

const OPERA_COLOR = colors.hub.opera;
const OPERA_GLOW = "rgba(255, 0, 255, 0.4)";

type TabId = 'today' | 'upcoming' | 'history' | 'streak';

interface Tab {
  id: TabId;
  label: string;
  icon: typeof Target;
}

const TABS: Tab[] = [
  { id: 'today', label: 'Today', icon: Target },
  { id: 'upcoming', label: 'Upcoming', icon: Calendar },
  { id: 'history', label: 'History', icon: History },
  { id: 'streak', label: 'Streak', icon: Flame },
];

// Mock upcoming challenges
const UPCOMING_CHALLENGES = [
  { day: 'Tomorrow', type: 'trivia' as ChallengeType, title: 'Agent Ability Quiz', difficulty: 'easy', tokens: 25 },
  { day: 'Tuesday', type: 'video_quiz' as ChallengeType, title: 'Clutch or Bust?', difficulty: 'hard', tokens: 100 },
  { day: 'Wednesday', type: 'prediction' as ChallengeType, title: 'Match Prediction: VIT vs FNC', difficulty: 'medium', tokens: 50 },
  { day: 'Thursday', type: 'stat_guess' as ChallengeType, title: 'Guess the Headshot %', difficulty: 'medium', tokens: 75 },
  { day: 'Friday', type: 'trivia' as ChallengeType, title: 'VCT History Trivia', difficulty: 'hard', tokens: 50 },
  { day: 'Saturday', type: 'video_quiz' as ChallengeType, title: 'Eco Round Win?', difficulty: 'medium', tokens: 50 },
  { day: 'Sunday', type: 'prediction' as ChallengeType, title: 'Grand Finals Prediction', difficulty: 'hard', tokens: 150 },
];

// Type configs for upcoming
const TYPE_CONFIG: Record<ChallengeType, { icon: typeof Play; color: string; bg: string }> = {
  video_quiz: { icon: Play, color: '#ff4655', bg: 'rgba(255, 70, 85, 0.15)' },
  prediction: { icon: Zap, color: '#00d4ff', bg: 'rgba(0, 212, 255, 0.15)' },
  stat_guess: { icon: BarChart3, color: '#00ff88', bg: 'rgba(0, 255, 136, 0.15)' },
  trivia: { icon: Brain, color: '#ffd700', bg: 'rgba(255, 215, 0, 0.15)' },
};

const DIFFICULTY_COLORS = {
  easy: '#00ff88',
  medium: '#ffaa00',
  hard: '#ff4655',
};

export const ChallengesContainer: React.FC<ChallengesContainerProps> = ({
  defaultTab = 'today',
}) => {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [showResult, setShowResult] = useState(false);

  const {
    dailyChallenge,
    streak,
    history,
    result,
    submitAnswer,
    isLoading,
    hasAttempted,
  } = useChallenges();

  const handleSubmitAnswer = async (challengeId: string, answer: string) => {
    await submitAnswer(challengeId, answer);
    setShowResult(true);
  };

  const handleCloseResult = () => {
    setShowResult(false);
  };

  const handleShare = () => {
    // Implement share functionality
    if (navigator.share) {
      navigator.share({
        title: 'Daily Challenge Result',
        text: `I ${result?.isCorrect ? 'completed' : 'attempted'} today's OPERA Daily Challenge!`,
      });
    }
  };

  // Render the appropriate challenge component based on type
  const renderChallenge = () => {
    if (!dailyChallenge) return null;

    const props = {
      challenge: {
        id: dailyChallenge.id,
        title: dailyChallenge.title,
        data: dailyChallenge.data,
        tokenReward: dailyChallenge.tokenReward,
      },
      onSubmit: (answer: string) => handleSubmitAnswer(dailyChallenge.id, answer),
      hasAttempted,
      result: result ? {
        isCorrect: result.isCorrect,
        correctAnswer: result.correctAnswer,
        tokensEarned: result.tokensEarned,
      } : undefined,
    };

    switch (dailyChallenge.type) {
      case 'video_quiz':
        return <VideoChallenge {...props as any} />;
      case 'prediction':
        return <PredictionChallenge {...props as any} />;
      case 'trivia':
        return <TriviaChallenge {...props as any} timeLimitSeconds={dailyChallenge.timeLimitSeconds} />;
      case 'stat_guess':
        // For stat guess, we'll reuse TriviaChallenge with modified props
        return <TriviaChallenge {...props as any} />;
      default:
        return <DailyChallengePanel />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Daily Challenges</h2>
        <p className="text-white/60">
          Test your esports knowledge and earn tokens every day
        </p>
      </div>

      {/* Tab Navigation */}
      <GlassCard className="p-2 mb-6" hoverGlow={OPERA_GLOW}>
        <div className="flex flex-wrap gap-1">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-white/10'
                    : 'hover:bg-white/5 opacity-70'
                )}
                style={{
                  color: isActive ? OPERA_COLOR : undefined,
                  boxShadow: isActive ? `0 0 20px ${OPERA_GLOW}` : undefined,
                }}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </GlassCard>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'today' && (
          <motion.div
            key="today"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* Main Challenge */}
            <div className="lg:col-span-2">
              {isLoading ? (
                <GlassCard className="p-8">
                  <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-white/10 rounded w-3/4" />
                    <div className="h-32 bg-white/5 rounded" />
                    <div className="h-10 bg-white/10 rounded w-full" />
                  </div>
                </GlassCard>
              ) : (
                renderChallenge()
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <DailyChallengePanel />
              
              {/* Quick Stats */}
              {streak && (
                <GlassCard className="p-4" hoverGlow={OPERA_GLOW}>
                  <div className="flex items-center gap-3 mb-3">
                    <Flame className="w-5 h-5 text-orange-500" />
                    <span className="font-medium text-white">Current Streak</span>
                  </div>
                  <p className="text-3xl font-bold text-white">{streak.current} days</p>
                  <p className="text-sm text-white/50">Best: {streak.longest} days</p>
                </GlassCard>
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'upcoming' && (
          <motion.div
            key="upcoming"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-3"
          >
            <p className="text-sm text-white/50 mb-4">
              Preview of upcoming challenges for the next 7 days
            </p>
            
            {UPCOMING_CHALLENGES.map((challenge, index) => {
              const typeConfig = TYPE_CONFIG[challenge.type];
              const TypeIcon = typeConfig.icon;

              return (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <GlassCard className="p-4" hoverGlow={OPERA_GLOW}>
                    <div className="flex items-center gap-4">
                      {/* Day */}
                      <div className="w-20 text-sm font-medium text-white/70">
                        {challenge.day}
                      </div>

                      {/* Type Icon */}
                      <div
                        className="w-10 h-10 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: typeConfig.bg }}
                      >
                        <TypeIcon className="w-5 h-5" style={{ color: typeConfig.color }} />
                      </div>

                      {/* Challenge Info */}
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{challenge.title}</h4>
                        <div className="flex items-center gap-2 text-xs">
                          <span style={{ color: DIFFICULTY_COLORS[challenge.difficulty] }}>
                            {challenge.difficulty.charAt(0).toUpperCase() + challenge.difficulty.slice(1)}
                          </span>
                          <span className="text-white/30">•</span>
                          <span className="text-white/50">{challenge.tokens} tokens</span>
                        </div>
                      </div>

                      {/* Lock Icon */}
                      <Lock className="w-4 h-4 text-white/30" />
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        {activeTab === 'history' && streak && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ChallengeHistory attempts={history} />
          </motion.div>
        )}

        {activeTab === 'streak' && streak && (
          <motion.div
            key="streak"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <ChallengeStreak streak={streak} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Modal */}
      <AnimatePresence>
        {showResult && result && (
          <ChallengeResult
            result={{
              isCorrect: result.isCorrect,
              correctAnswer: result.correctAnswer,
              tokensEarned: result.tokensEarned,
              message: result.message,
              explanation: result.explanation,
              streak: result.streak,
            }}
            onClose={handleCloseResult}
            onShare={handleShare}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChallengesContainer;
