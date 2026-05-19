import type { FC, ReactNode } from 'react';

interface Question {
  id: number;
  question: string;
  answers: number;
  status: 'answered' | 'open';
}

interface HelpHubProps {
  children?: ReactNode;
  questions: Question[];
  selectedQuestion: Question | null;
  onQuestionClick: (question: Question) => void;
  hubColor?: string;
  hubGlow?: string;
}

declare const HelpHub: FC<HelpHubProps>;
export default HelpHub;
