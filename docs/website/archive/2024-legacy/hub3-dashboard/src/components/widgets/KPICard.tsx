import React from 'react';
import { TrendingUp, Users, Trophy, Activity } from 'lucide-react';
import { useDashboardStore } from '../../store/dashboardStore';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ReactNode;
  color: string;
}

const KPICardItem: React.FC<KPICardProps> = ({ title, value, change, icon, color }) => {
  return (
    <div className="glass-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 mb-1">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              <TrendingUp className={`w-4 h-4 ${change < 0 ? 'rotate-180' : ''}`} />
              <span>{change > 0 ? '+' : ''}{change}%</span>
            </div>
          )}
        </div>
        
        <div 
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}20` }}
        >
          {React.cloneElement(icon as React.ReactElement, { 
            className: 'w-6 h-6',
            style: { color }
          })}
        </div>
      </div>
    </div>
  );
};

export const KPICard: React.FC = () => {
  const { metrics, lastUpdated } = useDashboardStore();
  
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICardItem
          title="Total Players"
          value={metrics.totalPlayers}
          change={5.2}
          icon={<Users />}
          color="#008080"
        />
        
        <KPICardItem
          title="Avg SimRating™"
          value={metrics.avgSimRating.toFixed(1)}
          change={2.8}
          icon={<Activity />}
          color="#4169E1"
        />
        
        <KPICardItem
          title="Top Performer"
          value={metrics.topPerformer}
          icon={<Trophy />}
          color="#FFD700"
        />
        
        <KPICardItem
          title="Weekly Growth"
          value={`+${metrics.weeklyGrowth}%`}
          change={metrics.weeklyGrowth}
          icon={<TrendingUp />}
          color="#22c55e"
        />
      </div>
      
      <div className="mt-4 text-right">
        <p className="text-xs text-gray-500">
          Last updated: {lastUpdated.toLocaleTimeString()}
        </p>
      </div>
    </>
  );
};

export default KPICard;
