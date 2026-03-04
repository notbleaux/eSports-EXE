import { Link } from 'react-router-dom';
import { ArrowLeft, TrendingUp, Target, Award, Users } from 'lucide-react';
import type { ExtendedPlayer, SimRatingBreakdown, RARResponse } from '../../types';
import { SimRatingChart } from '../Analytics/SimRatingChart';
import { StatsTable } from '../Analytics/StatsTable';

interface PlayerDetailProps {
  player: ExtendedPlayer;
  simRating?: SimRatingBreakdown;
  rar?: RARResponse;
  isLoadingAnalytics?: boolean;
}

export function PlayerDetail({
  player,
  simRating,
  rar,
  isLoadingAnalytics,
}: PlayerDetailProps) {
  return (
    <div className="space-y-6">
      {/* Back Navigation */}
      <Link
        to="/players"
        className="inline-flex items-center gap-2 text-radiant-gray hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Players
      </Link>

      {/* Player Header */}
      <div className="stat-card p-6">
        <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
          {/* Avatar */}
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-radiant-red/30 to-radiant-orange/30 border-2 border-radiant-red/50 flex items-center justify-center">
            <span className="text-3xl font-bold">
              {player.name.charAt(0).toUpperCase()}
            </span>
          </div>

          {/* Info */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold">{player.name}</h1>
              {player.investment_grade && (
                <span className="badge-gold">
                  Grade {player.investment_grade}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-radiant-gray">
              {player.team && (
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {player.team}
                </span>
              )}
              {player.region && (
                <span className="flex items-center gap-1">
                  <Target className="w-4 h-4" />
                  {player.region}
                </span>
              )}
              {player.role && (
                <span className="flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  {player.role}
                </span>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 gap-4">
            <StatCard
              label="ACS"
              value={player.acs?.toFixed(0) || '-'}
              icon={TrendingUp}
              color="cyan"
            />
            <StatCard
              label="Rating"
              value={player.sim_rating?.toFixed(2) || '-'}
              icon={Target}
              color="gold"
            />
          </div>
        </div>
      </div>

      {/* Analytics Section */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* SimRating Chart */}
        <div className="stat-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-radiant-red" />
            SimRating Breakdown
          </h2>
          {isLoadingAnalytics ? (
            <div className="h-64 skeleton rounded-lg" />
          ) : simRating ? (
            <SimRatingChart data={simRating} />
          ) : (
            <p className="text-radiant-gray text-center py-8">
              No SimRating data available
            </p>
          )}
        </div>

        {/* RAR Score */}
        <div className="stat-card p-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-radiant-cyan" />
            Role-Adjusted Value
          </h2>
          {isLoadingAnalytics ? (
            <div className="h-64 skeleton rounded-lg" />
          ) : rar ? (
            <div className="space-y-6">
              <div className="text-center p-6 bg-radiant-black rounded-lg">
                <p className="text-sm text-radiant-gray mb-1">RAR Score</p>
                <p className="text-5xl font-mono font-bold text-radiant-cyan">
                  {rar.rar_score.toFixed(2)}
                </p>
                <p className="text-sm text-radiant-gray mt-2">
                  Value above replacement level
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-radiant-black rounded-lg text-center">
                  <p className="text-xs text-radiant-gray mb-1">Raw Rating</p>
                  <p className="text-xl font-mono font-semibold">
                    {rar.raw_rating.toFixed(2)}
                  </p>
                </div>
                <div className="p-4 bg-radiant-black rounded-lg text-center">
                  <p className="text-xs text-radiant-gray mb-1">
                    Replacement Level
                  </p>
                  <p className="text-xl font-mono font-semibold">
                    {rar.replacement_level.toFixed(2)}
                  </p>
                </div>
              </div>
              {rar.investment_grade && (
                <div className="flex items-center justify-center gap-2 p-3 bg-radiant-gold/10 border border-radiant-gold/30 rounded-lg">
                  <Award className="w-5 h-5 text-radiant-gold" />
                  <span className="text-radiant-gold font-medium">
                    Investment Grade: {rar.investment_grade}
                  </span>
                </div>
              )}
            </div>
          ) : (
            <p className="text-radiant-gray text-center py-8">
              No RAR data available
            </p>
          )}
        </div>
      </div>

      {/* Detailed Stats Table */}
      <div className="stat-card p-6">
        <h2 className="text-xl font-bold mb-4">Performance Statistics</h2>
        <StatsTable player={player} />
      </div>
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'cyan' | 'red' | 'gold' | 'green';
}

function StatCard({ label, value, icon: Icon, color }: StatCardProps) {
  const colorClasses = {
    cyan: 'text-radiant-cyan bg-radiant-cyan/10',
    red: 'text-radiant-red bg-radiant-red/10',
    gold: 'text-radiant-gold bg-radiant-gold/10',
    green: 'text-radiant-green bg-radiant-green/10',
  };

  return (
    <div className={`p-4 rounded-lg ${colorClasses[color]}`}>
      <Icon className="w-5 h-5 mb-2" />
      <p className="text-xs opacity-80 mb-1">{label}</p>
      <p className="text-2xl font-mono font-bold">{value}</p>
    </div>
  );
}
