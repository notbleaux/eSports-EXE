import type { FC, ReactNode } from 'react';

interface StatItem {
  value: number;
  label: string;
  trend?: 'up' | 'down' | 'neutral';
}

interface StatsGridProps {
  stats?: StatItem[];
  isLoading?: boolean;
  hubColor?: string;
  hubGlow?: string;
}

declare const StatsGrid: FC<StatsGridProps>;
export default StatsGrid;
