import React from 'react';
import { Award, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { investmentGrades } from '../../data/mockData';

interface GradeBadgeProps {
  grade: string;
}

const GradeBadge: React.FC<GradeBadgeProps> = ({ grade }) => {
  const getGradeStyles = (g: string) => {
    switch (g) {
      case 'A+':
      case 'A':
        return 'bg-green-500/20 text-green-400 border-green-500/50';
      case 'A-':
      case 'B+':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
      case 'B':
      case 'C+':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
      case 'C':
      case 'D':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/50';
    }
  };

  return (
    <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getGradeStyles(grade)}`}>
      {grade}
    </span>
  );
};

interface RiskIndicatorProps {
  risk: string;
}

const RiskIndicator: React.FC<RiskIndicatorProps> = ({ risk }) => {
  const getRiskIcon = () => {
    if (risk === 'Low') return <TrendingUp className="w-4 h-4 text-green-400" />;
    if (risk === 'High' || risk === 'Very High') return <TrendingDown className="w-4 h-4 text-red-400" />;
    return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <div className="flex items-center gap-1">
      {getRiskIcon()}
      <span className="text-sm text-gray-400">{risk}</span>
    </div>
  );
};

export const InvestmentGrade: React.FC = () => {
  return (
    <div className="glass-panel p-6">
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-6 h-6 text-dash-chart-blue" />
        <h2 className="text-xl font-bold text-white">Investment Grades</h2>
      </div>
      
      <div className="overflow-hidden">
        <div className="grid grid-cols-12 gap-4 text-xs text-gray-500 uppercase tracking-wider mb-3 px-2">
          <div className="col-span-4">Player</div>
          <div className="col-span-2 text-center">Grade</div>
          <div className="col-span-3">Risk Level</div>
          <div className="col-span-3 text-right">Potential</div>
        </div>
        
        <div className="space-y-2">
          {investmentGrades.map((item, index) => (
            <div 
              key={index}
              className="grid grid-cols-12 gap-4 items-center py-3 px-2 rounded-lg hover:bg-white/5 transition-colors"
            >
              <div className="col-span-4">
                <span className="text-sm font-medium text-white">{item.player}</span>
              </div>
              
              <div className="col-span-2 flex justify-center">
                <GradeBadge grade={item.grade} />
              </div>
              
              <div className="col-span-3">
                <RiskIndicator risk={item.risk} />
              </div>
              
              <div className="col-span-3 text-right">
                <span className="text-sm text-gray-300">{item.potential}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t border-dash-border">
        <p className="text-xs text-gray-500 mb-3">Grade Scale:</p>
        <div className="flex flex-wrap gap-2">
          {['A+', 'A', 'A-', 'B+', 'B', 'C+', 'C', 'D'].map((grade) => (
            <GradeBadge key={grade} grade={grade} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default InvestmentGrade;
