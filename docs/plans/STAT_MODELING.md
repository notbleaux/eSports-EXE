# Statistical Modeling & Probabilities

## EV Formulas (Team/Player/Org)
```ts
// Expected Value for VCT betting
const ev = (probWin: number, odds: number) => probWin * (odds - 1) - (1 - probWin);

// Team form: Weighted moving avg (recent 5 matches 0.4wt)
const teamForm = weightedAvg(recentStats, weights=[0.4,0.3,0.2,0.1,0.0]);
```

**Research**: [Quant Sports Analytics](https://quant-sports.com/)

