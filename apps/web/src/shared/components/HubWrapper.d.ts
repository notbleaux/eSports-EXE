import type { FC, ReactNode } from 'react';

interface HubWrapperProps {
  children?: ReactNode;
}

declare const HubWrapper: FC<HubWrapperProps>;
export default HubWrapper;

// Named exports
export interface HubCardProps {
  children?: ReactNode;
  title?: string;
  className?: string;
  onClick?: () => void;
}

export function HubCard(props: HubCardProps): JSX.Element;

export interface HubStatCardProps {
  label: string;
  value: string | number;
  change?: string | number;
  color?: 'cyan' | 'red' | 'green' | 'yellow';
  onClick?: () => void;
}

export function HubStatCard(props: HubStatCardProps): JSX.Element;
