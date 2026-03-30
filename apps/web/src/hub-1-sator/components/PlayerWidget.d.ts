import type { FC, ReactNode } from 'react';

interface PlayerWidgetProps {
  children?: ReactNode;
  player?: unknown;
  rank?: number;
  hubColor?: string;
  hubGlow?: string;
  hubMuted?: string;
}

declare const PlayerWidget: FC<PlayerWidgetProps>;
export default PlayerWidget;
