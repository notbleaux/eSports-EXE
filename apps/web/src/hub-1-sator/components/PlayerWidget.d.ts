import type { FC, ReactNode } from 'react';

interface PlayerData {
  name?: string;
  team?: string;
  rating?: number;
  acs?: number;
  kda?: string;
  winRate?: number;
  avatar?: string | null;
}

interface PlayerWidgetProps {
  children?: ReactNode;
  player?: PlayerData;
  rank?: number;
  hubColor?: string;
  hubGlow?: string;
  hubMuted?: string;
}

declare const PlayerWidget: FC<PlayerWidgetProps>;
export default PlayerWidget;
