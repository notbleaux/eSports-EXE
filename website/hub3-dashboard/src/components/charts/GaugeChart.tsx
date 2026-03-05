import React from 'react';
import {
  PieChart as RechartsPieChart,
  Pie,
  Cell,
} from 'recharts';

interface GaugeChartProps {
  value: number;
  maxValue?: number;
  height?: number;
  title?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({ 
  value, 
  maxValue = 100, 
  height = 200,
  title = 'Score'
}) => {
  const percentage = (value / maxValue) * 100;
  
  // Determine color based on value
  const getColor = (val: number) => {
    if (val >= 90) return '#22c55e'; // Green
    if (val >= 80) return '#3b82f6'; // Blue
    if (val >= 70) return '#eab308'; // Yellow
    if (val >= 60) return '#f97316'; // Orange
    return '#ef4444'; // Red
  };

  const color = getColor(value);
  
  // Create gauge data
  const data = [
    { name: 'Score', value: percentage },
    { name: 'Empty', value: 100 - percentage },
  ];

  return (
    <div className="relative" style={{ height }}>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span 
          className="text-4xl font-bold"
          style={{ color }}
        >
          {value.toFixed(1)}
        </span>
        <span className="text-sm text-gray-400 mt-1">{title}</span>
      </div>
      
      <div className="w-full h-full">
        <RechartsPieChart width={300} height={height}>
          <Pie
            data={data}
            cx="50%"
            cy="70%"
            startAngle={180}
            endAngle={0}
            innerRadius={60}
            outerRadius={80}
            paddingAngle={0}
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="rgba(255,255,255,0.05)" />
          </Pie>
        </RechartsPieChart>
      </div>
      
      {/* Gauge Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between px-8 text-xs text-gray-500">
        <span>0</span>
        <span>25</span>
        <span>50</span>
        <span>75</span>
        <span>100</span>
      </div>
    </div>
  );
};

export default GaugeChart;
