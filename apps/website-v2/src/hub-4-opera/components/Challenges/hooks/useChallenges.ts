/**
 * useChallenges Hook
 * Custom hook for managing daily challenges state and API interactions
 * 
 * [Ver001.000]
 */

import { useState, useCallback, useEffect } from 'react';
import type {
  DailyChallenge,
  ChallengeStreak,
  ChallengeAttempt,
  ChallengeResult,
  UseChallengesReturn,
} from '../types';

// Mock data for development
const MOCK_DAILY_CHALLENGE: DailyChallenge = {
  id: 'challenge-001',
  challengeDate: new Date().toISOString().split('T')[0],
  type: 'video_quiz',
  title: 'Who Won This Round?',
  description: 'Watch the clip and predict which team won the round.',
  data: {
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    roundTimestamp: 45,
    options: ['Sentinels', 'Cloud9', 'NRG', '100 Thieves'],
  },
  difficulty: 'medium',
  tokenReward: 50,
  timeLimitSeconds: 60,
};

const MOCK_STREAK: ChallengeStreak = {
  current: 5,
  longest: 12,
  totalCorrect: 47,
  lastCorrectDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
  streakDays: [
    new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    new Date(Date.now() - 86400000).toISOString().split('T')[0],
  ],
};

const MOCK_HISTORY: ChallengeAttempt[] = [
  {
    challengeId: 'challenge-000',
    challengeDate: new Date(Date.now() - 86400000).toISOString().split('T')[0],
    type: 'trivia',
    title: 'VCT Champions 2023 Winner',
    answerGiven: 'Evil Geniuses',
    isCorrect: true,
    tokensEarned: 25,
    attemptedAt: new Date(Date.now() - 86400000 + 3600000).toISOString(),
  },
  {
    challengeId: 'challenge-002',
    challengeDate: new Date(Date.now() - 86400000 * 2).toISOString().split('T')[0],
    type: 'prediction',
    title: 'Match Prediction: Sentinels vs LOUD',
    answerGiven: 'Sentinels',
    isCorrect: false,
    tokensEarned: 0,
    attemptedAt: new Date(Date.now() - 86400000 * 2 + 7200000).toISOString(),
  },
  {
    challengeId: 'challenge-003',
    challengeDate: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    type: 'video_quiz',
    title: 'Who Won This Round?',
    answerGiven: 'Cloud9',
    isCorrect: true,
    tokensEarned: 50,
    attemptedAt: new Date(Date.now() - 86400000 * 3 + 5400000).toISOString(),
  },
  {
    challengeId: 'challenge-004',
    challengeDate: new Date(Date.now() - 86400000 * 4).toISOString().split('T')[0],
    type: 'trivia',
    title: 'Agent Ability Quiz',
    answerGiven: 'Phoenix',
    isCorrect: true,
    tokensEarned: 25,
    attemptedAt: new Date(Date.now() - 86400000 * 4 + 4800000).toISOString(),
  },
  {
    challengeId: 'challenge-005',
    challengeDate: new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0],
    type: 'stat_guess',
    title: 'Guess the ACS',
    answerGiven: '287',
    isCorrect: true,
    tokensEarned: 75,
    attemptedAt: new Date(Date.now() - 86400000 * 5 + 6000000).toISOString(),
  },
];

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const useChallenges = (): UseChallengesReturn => {
  const [dailyChallenge, setDailyChallenge] = useState<DailyChallenge | null>(null);
  const [streak, setStreak] = useState<ChallengeStreak | null>(null);
  const [history, setHistory] = useState<ChallengeAttempt[]>([]);
  const [result, setResult] = useState<ChallengeResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAttempted, setHasAttempted] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDailyChallenge = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In production, this would be an actual API call
      // const response = await fetch(`${API_BASE_URL}/api/challenges/daily`);
      // const data = await response.json();
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 500));
      setDailyChallenge(MOCK_DAILY_CHALLENGE);
      
      // Check if user has already attempted today's challenge
      const today = new Date().toISOString().split('T')[0];
      const attempted = MOCK_HISTORY.some(h => h.challengeDate === today);
      setHasAttempted(attempted);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch daily challenge'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitAnswer = useCallback(async (challengeId: string, answer: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In production, this would be an actual API call
      // const response = await fetch(`${API_BASE_URL}/api/challenges/submit`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ challengeId, answer }),
      // });
      // const data = await response.json();
      
      // Mock implementation
      await new Promise(resolve => setTimeout(resolve, 800));
      
      // Simulate correct answer 70% of the time for demo
      const isCorrect = Math.random() > 0.3;
      const mockResult: ChallengeResult = {
        success: true,
        isCorrect,
        correctAnswer: isCorrect ? answer : 'Cloud9',
        tokensEarned: isCorrect ? MOCK_DAILY_CHALLENGE.tokenReward : 0,
        newBalance: 1250 + (isCorrect ? MOCK_DAILY_CHALLENGE.tokenReward : 0),
        streak: isCorrect ? (streak?.current || 0) + 1 : 0,
        message: isCorrect 
          ? 'Correct! Great job predicting the outcome!' 
          : 'Not quite right this time. Better luck tomorrow!',
        explanation: isCorrect 
          ? 'Cloud9 won this round with a coordinated site execute.' 
          : 'The correct answer was Cloud9. They executed a flawless A site take.',
      };
      
      setResult(mockResult);
      setHasAttempted(true);
      
      if (isCorrect && streak) {
        setStreak({
          ...streak,
          current: streak.current + 1,
          longest: Math.max(streak.longest, streak.current + 1),
          totalCorrect: streak.totalCorrect + 1,
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to submit answer'));
    } finally {
      setIsLoading(false);
    }
  }, [streak]);

  const fetchStreak = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In production: const response = await fetch(`${API_BASE_URL}/api/challenges/streak`);
      await new Promise(resolve => setTimeout(resolve, 400));
      setStreak(MOCK_STREAK);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch streak'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In production: const response = await fetch(`${API_BASE_URL}/api/challenges/history`);
      await new Promise(resolve => setTimeout(resolve, 400));
      setHistory(MOCK_HISTORY);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch history'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Auto-fetch on mount
  useEffect(() => {
    fetchDailyChallenge();
    fetchStreak();
    fetchHistory();
  }, [fetchDailyChallenge, fetchStreak, fetchHistory]);

  return {
    dailyChallenge,
    streak,
    history,
    result,
    submitAnswer,
    fetchDailyChallenge,
    fetchStreak,
    fetchHistory,
    isLoading,
    hasAttempted,
    error,
  };
};

export default useChallenges;
