/**
 * OddsDisplay Component
 * =====================
 * Displays betting odds for two teams with data-testid for E2E testing.
 * 
 * [Ver001.000]
 */

import React from 'react';

export type OddsFormat = 'decimal' | 'american' | 'fractional';

interface OddsDisplayProps {
  teamAName: string;
  teamBOdds: number;
  teamBName: string;
  teamAOdds: number;
  format?: OddsFormat;
  className?: string;
  onOddsClick?: (team: 'A' | 'B') => void;
}

export const OddsDisplay: React.FC<OddsDisplayProps> = ({
  teamAName,
  teamAOdds,
  teamBName,
  teamBOdds,
  format = 'decimal',
  className = '',
  onOddsClick,
}) => {
  const formatOdds = (odds: number): string => {
    switch (format) {
      case 'american':
        return odds >= 2.0 
          ? `+${Math.round((odds - 1) * 100)}`
          : `${Math.round(-100 / (odds - 1))}`;
      case 'fractional':
        const decimal = odds - 1;
        if (decimal === 1) return '1/1';
        if (decimal < 1) return `1/${Math.round(1 / decimal)}`;
        return `${Math.round(decimal)}/1`;
      case 'decimal':
      default:
        return odds.toFixed(2);
    }
  };

  return (
    <div className={`flex items-center justify-between gap-4 ${className}`}>
      {/* Team A Odds */}
      <button
        data-testid="team-a-odds"
        onClick={() => onOddsClick?.('A')}
        className="
          flex flex-col items-center p-3 rounded-xl
          bg-blue-500/10 border border-blue-500/30
          hover:bg-blue-500/20 transition-colors
          min-w-[80px]
        "
      >
        <span className="text-xs text-gray-400 mb-1 truncate max-w-[100px]">
          {teamAName}
        </span>
        <span className="text-lg font-bold text-blue-400">
          {formatOdds(teamAOdds)}
        </span>
      </button>

      {/* VS Divider */}
      <div className="text-xs text-gray-500 font-medium">VS</div>

      {/* Team B Odds */}
      <button
        data-testid="team-b-odds"
        onClick={() => onOddsClick?.('B')}
        className="
          flex flex-col items-center p-3 rounded-xl
          bg-purple-500/10 border border-purple-500/30
          hover:bg-purple-500/20 transition-colors
          min-w-[80px]
        "
      >
        <span className="text-xs text-gray-400 mb-1 truncate max-w-[100px]">
          {teamBName}
        </span>
        <span className="text-lg font-bold text-purple-400">
          {formatOdds(teamBOdds)}
        </span>
      </button>
    </div>
  );
};

export default OddsDisplay;
