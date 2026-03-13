# Streaming Pipeline Documentation

[Ver001.000]

## Architecture Overview

```
WebSocket Server → data-stream.worker → useStreamingInference → UI
                          ↓
               predictionHistoryStore (ROTAS Hub)
```

The streaming pipeline enables real-time ML predictions via WebSocket:

1. **WebSocket Connection**: Connects to `ws://localhost:8080/stream`
2. **Data Stream Worker**: Manages connection, buffering, reconnection
3. **Streaming Hook**: Debounced predictions (max 10/sec), metrics tracking
4. **UI Panel**: Real-time display with lag indicators
5. **History Store**: Persists predictions for analytics

## Configuration

```typescript
interface StreamingConfig {
  wsUrl: string              // WebSocket endpoint
  maxPredictionsPerSecond: number  // Default: 10
  modelUrl: string           // Model to use for predictions
  bufferSize: number         // Max buffered messages: 100
}
```

### Usage

```typescript
import { useStreamingInference } from './hooks/useStreamingInference'

function MyComponent() {
  const {
    predictions,      // Last 10 predictions
    isStreaming,      // Connection status
    lag,              // Current lag in ms
    throughput,       // Predictions/sec
    error,            // Any error
    start,            // Start streaming
    stop,             // Stop streaming
    pause,            // Pause processing
    resume            // Resume processing
  } = useStreamingInference({
    wsUrl: 'ws://localhost:8080/stream',
    maxPredictionsPerSecond: 10
  })
  
  return <StreamingPredictionPanel ... />
}
```

## Performance Characteristics

| Metric | Target | Typical |
|--------|--------|---------|
| Connection latency | < 50ms | ~20ms |
| Prediction lag | < 100ms | ~50ms |
| Throughput | 10/sec | 10/sec |
| Memory per stream | < 10MB | ~5MB |
| Reconnect time | < 5s | ~2s |

## Troubleshooting

### Connection Issues

**Problem**: WebSocket won't connect
- Check server is running on `ws://localhost:8080/stream`
- Verify no firewall blocking WebSocket port
- Check browser console for CORS errors

**Problem**: Frequent disconnections
- Check network stability
- Verify heartbeat interval (default: 30s)
- Check server timeout settings

### High Lag

**Problem**: Lag indicator shows red (>500ms)
- Reduce `maxPredictionsPerSecond` to lower CPU load
- Check model size (use quantized INT8 models)
- Verify GPU acceleration is enabled
- Check for memory pressure

### Memory Warnings

**Problem**: Memory grows over time
- Ensure `stop()` is called on component unmount
- Check for tensor leaks in ML worker
- Verify prediction history isn't growing unbounded

## Integration Example

```typescript
// Full integration with ROTAS hub
import { useStreamingInference } from '../hooks/useStreamingInference'
import { StreamingPredictionPanel } from '../components/StreamingPredictionPanel'

export function StreamingPage() {
  const streaming = useStreamingInference({
    wsUrl: 'ws://localhost:8080/stream',
    maxPredictionsPerSecond: 10
  })
  
  // Predictions automatically flow to ROTAS hub
  // via predictionHistoryStore
  
  return (
    <div>
      <StreamingPredictionPanel {...streaming} />
    </div>
  )
}
```

## Advanced Features

- **Debouncing**: Configurable rate limiting
- **Reconnection**: Exponential backoff (1s, 2s, 4s... max 30s)
- **Buffering**: Circular buffer prevents memory overflow
- **Metrics**: Real-time lag and throughput tracking

## See Also

- `data-stream.worker.ts` - WebSocket worker implementation
- `useStreamingInference.ts` - React hook
- `StreamingPredictionPanel.tsx` - UI component
