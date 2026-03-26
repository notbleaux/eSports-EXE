# [Ver001.000] ML Inference Performance Targets

## SimRating TF.js Browser Inference

| Metric | Target | Notes |
|--------|--------|-------|
| Model load time | < 2s | From /models/simrating/model.json |
| Single inference | < 50ms | WASM backend |
| Batch (10 players) | < 100ms | Use inferSimRatingBatch() |
| Dedup savings | ~80% | On rapid re-renders |

## Optimization Techniques Applied
- Batch inference: `inferSimRatingBatch()` — single tensor op for N players
- Request dedup: `inferSimRatingDeduped()` — coalesces concurrent identical requests
- Worker offload: `simrating-worker.ts` — prevents main-thread blocking
- WASM backend preferred over CPU (3-5x faster on typical hardware)

## To Use Web Worker
```ts
const worker = new Worker(new URL('./ml/simrating-worker.ts', import.meta.url), { type: 'module' });
worker.postMessage({ id: 'batch-1', players: [...] });
worker.onmessage = (e) => console.log(e.data.scores);
```
