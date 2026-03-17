# Advanced Development

## Web Workers (60fps Grids)
```ts
// grid.worker.ts
self.onmessage = (e) => {
  const canvas = new OffscreenCanvas(1024, 1024);
  // Virtual grid render
};
```

## Dependencies Graph
```
React → TanStack Virtual → Zustand (granular)
FastAPI → Supabase → Redis (cache-aside)
Godot → DB (twin-table export)
```

**Resources**: [Web Workers MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)

