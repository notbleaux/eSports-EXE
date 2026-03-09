export const analyticsLayers = [
  {
    id: 'base',
    name: 'BASE Analytics',
    formula: 'P(x) = Σ(wᵢ × fᵢ(x))',
    color: '#00f0ff',
    description: 'Core probability model using weighted feature aggregation'
  },
  {
    id: 'talent',
    name: 'Talent Layer',
    formula: 'T(x) = α·Skill + β·Potential + γ·Experience',
    color: '#c9b037',
    description: 'Talent assessment with weighted skill coefficients'
  },
  {
    id: 'market',
    name: 'Market Layer',
    formula: 'M(t) = M₀·e^(μt + σWₜ)',
    color: '#10b981',
    description: 'Geometric Brownian motion for market predictions'
  },
  {
    id: 'risk',
    name: 'Risk Layer',
    formula: 'R = VaR_α = inf{l: P(L > l) ≤ 1-α}',
    color: '#ef4444',
    description: 'Value at Risk calculation with confidence level α'
  },
  {
    id: 'sentiment',
    name: 'Sentiment Layer',
    formula: 'S = Σ(sᵢ × wᵢ) / Σ|wᵢ|',
    color: '#ff9f1c',
    description: 'Weighted sentiment analysis across data sources'
  }
];
