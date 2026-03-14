/**
 * Daily Challenges Components - Index
 * Export all challenge-related components
 * 
 * [Ver001.000]
 */

export { default as DailyChallengePanel } from './DailyChallengePanel';
export { default as VideoChallenge } from './VideoChallenge';
export { default as PredictionChallenge } from './PredictionChallenge';
export { default as TriviaChallenge } from './TriviaChallenge';
export { default as ChallengeResult } from './ChallengeResult';
export { default as ChallengeStreak } from './ChallengeStreak';
export { default as ChallengeHistory } from './ChallengeHistory';
export { default as ChallengesContainer } from './ChallengesContainer';

export { default as useChallenges } from './hooks/useChallenges';

export type {
  DailyChallenge,
  ChallengeStreak,
  ChallengeAttempt,
  ChallengeResult,
  ChallengeType,
  ChallengeDifficulty,
  VideoQuizData,
  PredictionData,
  StatGuessData,
  TriviaData,
  DailyChallengePanelProps,
  VideoChallengeProps,
  PredictionChallengeProps,
  TriviaChallengeProps,
  ChallengeResultProps,
  ChallengeStreakProps,
  ChallengeHistoryProps,
  ChallengesContainerProps,
  UseChallengesReturn,
} from './types';
