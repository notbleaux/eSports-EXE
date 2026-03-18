# TypeScript Guide (Strict Mode)

## Branded Types for eSports Data
```ts
type PlayerId = string & { readonly brand: unique symbol };
type MatchId = string & { readonly brand: unique symbol };

interface VCTStats {
  ev: number; // Expected Value from trading sim
  probWin: number; // Probability model
}
```

## Generics for Metrics
```ts
function computeEV<T extends TeamStats>(team: T): number {
  return team.form * odds - 1;
}
```

**Resources**: [Effective TS](https://effectivetypescript.com/)

