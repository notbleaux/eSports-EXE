import type { FC, ReactNode } from 'react';

interface PredictionCardProps {
  children?: ReactNode;
  prediction?: unknown;
  color?: string;
  glow?: string;
  index?: number;
}

declare const PredictionCard: FC<PredictionCardProps>;
export default PredictionCard;
