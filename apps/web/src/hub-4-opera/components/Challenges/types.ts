// @ts-nocheck
/**
 * Daily Challenges Types
 * TypeScript interfaces and types for OPERA Daily Challenges
 * 
 * [Ver001.000]
 */

// ============================================================================
// CHALLENGE DATA TYPES
// ============================================================================

export interface VideoQuizData {
  videoUrl: string;
  roundTimestamp: number;
  options: string[];
}

export interface PredictionData {
  matchId: string;
  teamA: string;
  teamB: string;
  teamALogo?: string;
  teamBLogo?: string;
  matchDate: string;
  options: string[];
}

export interface StatGuessData {
  playerName: string;
  playerId: string;
  statType: 'kills' | 'acs' | 'adr' | 'kast' | 'hs_percent';
  matchId: string;
  options: number[];
}

export interface TriviaData {
  question: string;
  options: string[];
  category?: string;
}

// ============================================================================
// MAIN CHALLENGE TYPES
// ============================================================================

export type ChallengeType = 'video_quiz' | 'prediction' | 'stat_guess' | 'trivia';
export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';

export interface DailyChallenge {
  id: string;
  challengeDate: string;
  type: ChallengeType;
  title: string;
  description?: string;
  data: VideoQuizData | PredictionData | StatGuessData | TriviaData;
  difficulty: ChallengeDifficulty;
  tokenReward: number;
  timeLimitSeconds?: number;
}

export interface ChallengeResult {
  success: boolean;
  isCorrect: boolean;
  correctAnswer?: string;
  tokensEarned: number;
  newBalance?: number;
  streak: number;
  message: string;
  explanation?: string;
}

export interface ChallengeStreak {
  current: number;
  longest: number;
  lastCorrectDate?: string;
  totalCorrect: number;
  streakDays?: string[]; // ISO date strings for calendar display
}

export interface ChallengeAttempt {
  challengeId: string;
  challengeDate: string;
  type: ChallengeType;
  title: string;
  answerGiven: string;
  isCorrect: boolean;
  tokensEarned: number;
  attemptedAt: string;
}

// ============================================================================
// COMPONENT PROPS
// ============================================================================

export interface DailyChallengePanelProps {
  className?: string;
}

export interface VideoChallengeProps {
  challenge: {
    id: string;
    title: string;
    data: VideoQuizData;
    tokenReward: number;
  };
  onSubmit: (answer: string) => void;
  hasAttempted: boolean;
  result?: {
    isCorrect: boolean;
    correctAnswer?: string;
    tokensEarned: number;
  };
}

export interface PredictionChallengeProps {
  challenge: {
    id: string;
    title: string;
    data: PredictionData;
    tokenReward: number;
  };
  onSubmit: (answer: string) => void;
  hasAttempted: boolean;
  result?: {
    isCorrect: boolean;
    correctAnswer?: string;
    tokensEarned: number;
  };
}

export interface TriviaChallengeProps {
  challenge: {
    id: string;
    title: string;
    data: TriviaData;
    tokenReward: number;
    timeLimitSeconds?: number;
  };
  onSubmit: (answer: string) => void;
  hasAttempted: boolean;
  result?: {
    isCorrect: boolean;
    correctAnswer?: string;
    tokensEarned: number;
  };
}

export interface ChallengeResultProps {
  result: {
    isCorrect: boolean;
    correctAnswer?: string;
    tokensEarned: number;
    message: string;
    explanation?: string;
    streak: number;
  };
  onClose: () => void;
  onShare?: () => void;
}

export interface ChallengeStreakProps {
  streak: ChallengeStreak;
}

export interface ChallengeHistoryProps {
  attempts: ChallengeAttempt[];
}

export interface ChallengesContainerProps {
  defaultTab?: 'today' | 'upcoming' | 'history' | 'streak';
}

// ============================================================================
// HOOK RETURN TYPES
// ============================================================================

export interface UseChallengesReturn {
  dailyChallenge: DailyChallenge | null;
  streak: ChallengeStreak | null;
  history: ChallengeAttempt[];
  result: ChallengeResult | null;
  submitAnswer: (challengeId: string, answer: string) => Promise<void>;
  fetchDailyChallenge: () => Promise<void>;
  fetchStreak: () => Promise<void>;
  fetchHistory: () => Promise<void>;
  isLoading: boolean;
  hasAttempted: boolean;
  error: Error | null;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export interface DifficultyConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}

export interface ChallengeTypeConfig {
  label: string;
  icon: string;
  description: string;
  color: string;
}
