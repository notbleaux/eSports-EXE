import type { FC, ReactNode } from 'react';

export interface StatBadgeProps {
  value: number;
  label: string;
  className?: string;
}

export declare const StatBadge: FC<StatBadgeProps>;
export default StatBadge;
