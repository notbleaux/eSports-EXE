# Prototyping Guide

## EV Calculator Prototype
```ts
// src/prototypes/ev-calc.tsx
const EVCalculator = ({teamA, teamB}: {teamA: TeamStats, teamB: TeamStats}) => {
  const evA = computeEV(teamA.form, 1.8);
  return <TradingDashboard ev={evA} />;
};
```

## Betting Sim Steps
1. Mock Reserve Bank (local JSON)
2. Fetch VCT odds (VLR.gg scrape)
3. Run backtest → Output EV metrics
4. Integrate token multiplier

**Test**: `npm run prototype:ev`

