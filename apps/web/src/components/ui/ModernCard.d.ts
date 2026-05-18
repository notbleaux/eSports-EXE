import type { FC, ReactNode } from 'react';

export interface ModernCardProps {
  children?: ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'outlined';
}

export declare const ModernCard: FC<ModernCardProps>;
export default ModernCard;
