import type { FC, ReactNode } from 'react';

interface AnalyticsWidgetProps {
  children?: ReactNode;
  activeLayer?: string;
  color?: string;
  glow?: string;
  muted?: string;
  data?: unknown;
  isLoading?: boolean;
}

declare const AnalyticsWidget: FC<AnalyticsWidgetProps>;
export default AnalyticsWidget;
