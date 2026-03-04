import { useState } from 'react';
import { BarChart3, Target, TrendingUp, Info } from 'lucide-react';
import { usePlayers, useSimRating, useRAR } from '../hooks/useApi';
import { SimRatingChart } from '../components/Analytics/SimRatingChart';

export function AnalyticsPage() {
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  
  const { data: players } = usePlayers({}, 0, 20);
  const { data: simRating, isLoading: simRatingLoading } = useSimRating(selectedPlayerId);
  const { data: rar, isLoading: rarLoading } = useRAR(selectedPlayerId);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <BarChart3 className="w-8 h-8 text-radiant-red" />
          <h1 className="text-3xl font-bold">Analytics</h1>
        </div>
        <p className="text-radiant-gray">
          Advanced metrics and predictive insights powered by SATOR
        </p>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Players"
          value="2,847"
          icon={Target}
          color="cyan"
        />
        <MetricCard
          label="Avg SimRating"
          value="1.05"
          icon={BarChart3}
          color="red"
        />
        <MetricCard
          label="Top Performer"
          value="A+"
          icon={TrendingUp}
          color="gold"
        />
        <MetricCard
          label="Data Points"
          value="12.4M"
          icon={Info}
          color="green"
        />
      </div>

      {/* Player Selector */}
      <div className="stat-card p-6">
        <label className="block text-sm font-medium mb-3">
          Select Player for Analysis
        </label>
        <select
          value={selectedPlayerId}
          onChange={(e) => setSelectedPlayerId(e.target.value)}
          className="input-field w-full max-w-md"
        >
          <option value="">Choose a player...</option>
          {players?.players.map((player) => (
            <option key={player.player_id} value={player.player_id}>
              {player.name} {player.team ? `(${player.team})` : ''}
            </option>
          ))}
        </select>
      </div>

      {/* Analytics Display */}
      {selectedPlayerId && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* SimRating */}
          <div className="stat-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-radiant-red" />
              SimRating Analysis
            </h2>
            {simRatingLoading ? (
              <div className="h-64 skeleton rounded-lg" />
            ) : simRating ? (
              <SimRatingChart data={simRating} />
            ) : (
              <p className="text-radiant-gray text-center py-8">
                Loading SimRating data...
              </p>
            )}
          </div>

          {/* RAR Analysis */}
          <div className="stat-card p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-radiant-cyan" />
              RAR Analysis
            </h2>
            {rarLoading ? (
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
                    <span className="text-radiant-gold font-medium">
                      Investment Grade: {rar.investment_grade}
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-radiant-gray text-center py-8">
                Loading RAR data...
              </p>
            )}
          </div>
        </div>
      )}

      {/* Methodology Info */}
      <div className="stat-card p-6">
        <h2 className="text-xl font-bold mb-4">About SATOR Analytics</h2>
        <div className="prose prose-invert max-w-none">
          <p className="text-radiant-gray">
            SATOR (Simulation Analytics for Tactical Operations Research) is a multi-layered
            analytics engine designed for esports performance evaluation. The system uses
            z-score normalization across key performance indicators to create standardized
            ratings that account for role differences and meta variations.
          </p>
          <div className="grid md:grid-cols-2 gap-6 mt-4">
            <div>
              <h3 className="font-semibold mb-2">SimRating Formula</h3>
              <p className="text-sm text-radiant-gray">
                Weighted composite of normalized kills, deaths, adjusted kill value, ADR, and
                KAST percentage.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">RAR Calculation</h3>
              <p className="text-sm text-radiant-gray">
                Raw SimRating minus role-specific replacement level, accounting for position
                scarcity and baseline performance.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  color: 'cyan' | 'red' | 'gold' | 'green';
}

function MetricCard({ label, value, icon: Icon, color }: MetricCardProps) {
  const colorClasses = {
    cyan: 'text-radiant-cyan bg-radiant-cyan/10 border-radiant-cyan/30',
    red: 'text-radiant-red bg-radiant-red/10 border-radiant-red/30',
    gold: 'text-radiant-gold bg-radiant-gold/10 border-radiant-gold/30',
    green: 'text-radiant-green bg-radiant-green/10 border-radiant-green/30',
  };

  return (
    <div className={`stat-card p-4 border ${colorClasses[color]}`}>
      <div className="flex items-center gap-3 mb-2">
        <Icon className="w-5 h-5" />
        <span className="text-sm opacity-80">{label}</span>
      </div>
      <p className="text-2xl font-mono font-bold">{value}</p>
    </div>
  );
}
