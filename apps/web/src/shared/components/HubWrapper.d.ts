import type { FC, ReactNode } from 'react';

export interface HubWrapperProps {
  hubId: string;
  children: ReactNode;
  className?: string;
  showHeader?: boolean;
  customHeader?: ReactNode;
}

export interface HubCardProps {
  children: ReactNode;
  className?: string;
  accent?: 'none' | 'cyan' | 'amber' | 'gold' | 'white';
  hover?: boolean;
  onClick?: () => void;
}

export interface HubStatCardProps {
  label: string;
  value: string | number;
  change?: string;
  color?: 'cyan' | 'amber' | 'gold' | 'green' | 'red';
  onClick?: () => void;
}

export declare const HubWrapper: FC<HubWrapperProps>;
export declare const HubCard: FC<HubCardProps>;
export declare const HubStatCard: FC<HubStatCardProps>;

export default HubWrapper;
