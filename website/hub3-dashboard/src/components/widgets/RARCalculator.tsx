import React, { useState, useCallback } from 'react';
import { Calculator, Info } from 'lucide-react';

interface RoleWeights {
  [key: string]: {
    kills: number;
    assists: number;
    cs: number;
    vision: number;
    objectives: number;
  };
}

const roleWeights: RoleWeights = {
  'Carry': { kills: 0.35, assists: 0.15, cs: 0.30, vision: 0.10, objectives: 0.10 },
  'Mid': { kills: 0.30, assists: 0.20, cs: 0.25, vision: 0.15, objectives: 0.10 },
  'Offlane': { kills: 0.20, assists: 0.20, cs: 0.20, vision: 0.20, objectives: 0.20 },
  'Support': { kills: 0.10, assists: 0.30, cs: 0.10, vision: 0.35, objectives: 0.15 },
  'Jungle': { kills: 0.25, assists: 0.25, cs: 0.20, vision: 0.15, objectives: 0.15 },
};

export const RARCalculator: React.FC = () => {
  const [role, setRole] = useState('Carry');
  const [stats, setStats] = useState({
    kills: 5,
    assists: 7,
    cs: 250,
    vision: 15,
    objectives: 3,
  });

  const calculateRAR = useCallback(() => {
    const weights = roleWeights[role];
    
    // Normalize stats (simplified calculation)
    const normalizedStats = {
      kills: Math.min(stats.kills / 10, 1) * 100,
      assists: Math.min(stats.assists / 15, 1) * 100,
      cs: Math.min(stats.cs / 350, 1) * 100,
      vision: Math.min(stats.vision / 30, 1) * 100,
      objectives: Math.min(stats.objectives / 5, 1) * 100,
    };
    
    const rar = (
      normalizedStats.kills * weights.kills +
      normalizedStats.assists * weights.assists +
      normalizedStats.cs * weights.cs +
      normalizedStats.vision * weights.vision +
      normalizedStats.objectives * weights.objectives
    );
    
    return Math.round(rar * 10) / 10;
  }, [role, stats]);

  const rar = calculateRAR();

  const getRarColor = (value: number) => {
    if (value >= 80) return 'text-green-400';
    if (value >= 60) return 'text-blue-400';
    if (value >= 40) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getRarLabel = (value: number) => {
    if (value >= 80) return 'Elite';
    if (value >= 60) return 'Above Average';
    if (value >= 40) return 'Average';
    return 'Below Average';
  };

  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-6">
        <Calculator className="w-6 h-6 text-dash-teal" />
        <h2 className="text-xl font-bold text-white">RAR Calculator</h2>
      </div>
      
      {/* Role Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Select Role
        </label>
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-4 py-2 bg-dash-panel border border-dash-border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-dash-teal"
        >
          {Object.keys(roleWeights).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>
      
      {/* Stats Input */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        {Object.entries(stats).map(([key, value]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-400 mb-1 capitalize">
              {key === 'cs' ? 'CS/min' : key}
            </label>
            <input
              type="number"
              value={value}
              onChange={(e) => setStats({ ...stats, [key]: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 bg-dash-panel border border-dash-border rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-dash-teal"
            />
          </div>
        ))}
      </div>
      
      {/* RAR Result */}
      <div className="bg-dash-panel rounded-xl p-6 text-center">
        <p className="text-sm text-gray-400 mb-2">Role-Adjusted Rating</p>
        <div className={`text-5xl font-bold ${getRarColor(rar)}`}>
          {rar.toFixed(1)}
        </div>
        <p className={`text-sm mt-2 ${getRarColor(rar)}`}>
          {getRarLabel(rar)}
        </p>
      </div>
      
      {/* Info */}
      <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <p>
          RAR adjusts performance metrics based on role expectations. 
          Weights vary by role to ensure fair comparison.
        </p>
      </div>
    </div>
  );
};

export default RARCalculator;
