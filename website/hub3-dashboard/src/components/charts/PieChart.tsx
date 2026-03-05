import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { RoleDistribution } from '../../data/mockData';

interface PieChartProps {
  data: RoleDistribution[];
  height?: number;
}

const COLORS = ['#008080', '#4169E1', '#7B68EE', '#00CED1', '#20B2AA'];

const CustomTooltip = ({ active, payload }: {
  active?: boolean;
  payload?: Array<{ name: string; value: number; payload: RoleDistribution }>;
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="glass-panel p-3 rounded-lg">
        <p className="text-sm font-medium">{data.role}</p>
        <p className="text-sm text-gray-400">Count: {data.count}</p>
        <p className="text-sm text-gray-400">Percentage: {data.percentage}%</p>
      </div>
    );
  }
  return null;
};

export const PieChart: React.FC<PieChartProps> = ({ data, height = 300 }) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ role, percentage }) => `${role} ${percentage}%`}
            outerRadius={100}
            innerRadius={60}
            fill="#8884d8"
            dataKey="count"
            nameKey="role"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PieChart;
