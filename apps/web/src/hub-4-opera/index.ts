/** [Ver002.000] — Entry point for hub-4-opera */
import type { FC, ReactNode } from 'react';

export interface OperaHubProps {
  children?: ReactNode;
}

// Re-export the OperaHub component as the default export
export { default } from './OperaHub';

// Also export named export for flexibility
export { default as OperaHub } from './OperaHub';
