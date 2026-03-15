/** [Ver001.000] */
/**
 * RAR Card Component
 * ==================
 * Complete player RAR display card with all metrics.
 */

import React from 'react';
import { RARGauge } from './RARGauge';
import { VolatilityIndicator } from './VolatilityIndicator';

export interface RARData {
  player_id: string;
  player_name?: string;
  role?: string;
  team?: string;
  
  sim_rating: number;
  rar_score: number;
  rar_normalized: number;
  
  volatility_score: number;
  consistency_bonus: number;
  confidence_factor: number;
  role_adjustment: number;
  
  investment_grade: string;
  volatility_rating: string;
  consistency_rating: string;
  trend_direction: string;
  trend_strength: number;
  risk_level: string;
  
  sample_size: number;
  calculation_timestamp: string;
  risk_factors: string[];
}

interface RARCardProps {
  data: RARData;
  compact?: boolean;
}

const riskLevelColors: Record<string, string> = {
  'low': '#10B981',
  'medium': '#F59E0B',
  'high': '#EF4444',
};

export const RARCard: React.FC<RARCardProps> = ({ data, compact = false }) => {
  if (compact) {
    return (
      <div
        className="rar-card-compact"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: 12,
          borderRadius: 8,
          backgroundColor: '#F9FAFB',
          border: '1px solid #E5E7EB',
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 600, fontSize: 16 }}>
            {data.player_name || data.player_id}
          </div>
          <div style={{ fontSize: 12, color: '#6B7280' }}>
            {data.role} {data.team && `• ${data.team}`}
          </div>
        </div>
        
        <RARGauge
          value={data.rar_normalized}
          grade={data.investment_grade}
          size="sm"
          showValue={false}
        />
        
        <div
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            color: riskLevelColors[data.risk_level],
          }}
        >
          {data.investment_grade}
        </div>
      </div>
    );
  }
  
  return (
    <div
      className="rar-card"
      style={{
        padding: 24,
        borderRadius: 12,
        backgroundColor: '#FFFFFF',
        border: '1px solid #E5E7EB',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        maxWidth: 400,
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ margin: 0, fontSize: 20, fontWeight: 600 }}>
          {data.player_name || data.player_id}
        </h3>
        <div style={{ fontSize: 14, color: '#6B7280', marginTop: 4 }}>
          {data.role} {data.team && `• ${data.team}`}
        </div>
      </div>
      
      {/* Main Gauge */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <RARGauge
          value={data.rar_normalized}
          grade={data.investment_grade}
          size="lg"
        />
      </div>
      
      {/* Component Breakdown */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#374151' }}>
          Component Breakdown
        </h4>
        
        <div style={{ display: 'grid', gap: 8 }}>
          <ComponentRow label="SimRating" value={data.sim_rating.toFixed(2)} />
          <ComponentRow
            label="Consistency Bonus"
            value={`×${data.consistency_bonus.toFixed(2)}`}
          />
          <ComponentRow
            label="Confidence"
            value={`${(data.confidence_factor * 100).toFixed(0)}%`}
          />
          {data.role_adjustment !== 1.0 && (
            <ComponentRow
              label="Role Adjustment"
              value={`×${data.role_adjustment.toFixed(2)}`}
            />
          )}
        </div>
      </div>
      
      {/* Volatility */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 600, color: '#374151' }}>
          Stability Analysis
        </h4>
        <VolatilityIndicator
          volatilityScore={data.volatility_score}
          consistencyRating={data.consistency_rating}
          trendDirection={data.trend_direction}
          trendStrength={data.trend_strength}
        />
      </div>
      
      {/* Risk Assessment */}
      <div
        style={{
          padding: 12,
          borderRadius: 8,
          backgroundColor: riskLevelColors[data.risk_level] + '10',
          border: `1px solid ${riskLevelColors[data.risk_level]}40`,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontWeight: 600,
            color: riskLevelColors[data.risk_level],
          }}
        >
          <span>Risk Level: {data.risk_level.toUpperCase()}</span>
        </div>
        {data.risk_factors.length > 0 && (
          <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4 }}>
            Factors: {data.risk_factors.join(', ')}
          </div>
        )}
      </div>
      
      {/* Footer */}
      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid #E5E7EB',
          fontSize: 12,
          color: '#9CA3AF',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Sample: {data.sample_size} matches</span>
        <span>
          Updated: {new Date(data.calculation_timestamp).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

const ComponentRow: React.FC<{ label: string; value: string }> = ({
  label,
  value,
}) => (
  <div
    style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      fontSize: 14,
    }}
  >
    <span style={{ color: '#6B7280' }}>{label}</span>
    <span style={{ fontWeight: 500, color: '#111827' }}>{value}</span>
  </div>
);

export default RARCard;
