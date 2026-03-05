import React from 'react';
import {
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PerformanceData } from '../../data/mockData';

interface LineChartProps {
  data: PerformanceData[];
  height?: number;
}

const CustomTooltip = ({ active, payload, label }: {
  active?: boolean;
  payload?: Array<{ value: number; name: string; color: string }>;
  label?: string;
}) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-3 rounded-lg">
        <p className="text-sm font-medium mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {entry.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const LineChart: React.FC<LineChartProps> = ({ data, height = 300 }) => {
  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
          <XAxis 
            dataKey="date" 
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
          />
          <YAxis 
            stroke="rgba(255,255,255,0.5)"
            tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
            domain={[70, 100]}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <Legend 
            wrapperStyle={{ color: 'rgba(255,255,255,0.7)' }}
          />
          
          <Line 
            type="monotone" 
            dataKey="rating" 
            name="Actual Rating"
            stroke="#008080" 
            strokeWidth={3}
            dot={{ fill: '#008080', strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6, stroke: '#008080', strokeWidth: 2 }}
          />
          
          <Line 
            type="monotone" 
            dataKey="projected" 
            name="Projected"
            stroke="#4169E1" 
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={{ fill: '#4169E1', strokeWidth: 2, r: 3 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default LineChart;
