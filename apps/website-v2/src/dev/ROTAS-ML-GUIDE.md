# ROTAS Hub ML Analytics Guide

[Ver001.000]

## Overview

The ROTAS Hub ML Analytics provides comprehensive insights into ML predictions:

- **MLAnalyticsPanel**: High-level metrics and model comparison
- **PredictionHistory**: Detailed prediction logs with search/filter
- **ModelPerformanceCharts**: Visual analytics (4 chart types)

## Panel Navigation

```
ROTAS Hub
├── Analytics Tab
│   ├── Metrics Cards (total, accuracy, latency)
│   ├── Model Comparison Table
│   └── Time Range Selector
├── History Tab
│   ├── Prediction List (50/page)
│   ├── Filters & Search
│   └── Export (CSV/JSON)
└── Charts Tab
    ├── Latency Over Time
    ├── Accuracy by Model
    ├── Confidence Distribution
    └── Predictions per Hour
```

## Using the Prediction History Store

### Adding Predictions

```typescript
import { usePredictionHistoryStore } from '../store/predictionHistoryStore'

const store = usePredictionHistoryStore.getState()

// Add a prediction
store.addPrediction({
  id: 'pred-123',
  input: [0.5, 0.3, 0.2],
  output: [0.9],
  confidence: 0.95,
  modelId: 'sator-v1',
  timestamp: new Date(),
  latencyMs: 12
})
```

### Querying Predictions

```typescript
// Get all predictions
const all = store.getPredictions()

// Filter by date range (last 7 days)
const lastWeek = store.getPredictions({
  start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
  end: new Date()
})

// Filter by model
const modelPredictions = store.getPredictionsByModel('sator-v1')

// Filter by confidence
const highConfidence = store.getPredictionsByConfidence(0.9)

// Search by input features
const searchResults = store.searchPredictions('0.5')

// Complex filter
const filtered = store.filterPredictions({
  modelId: 'sator-v1',
  minConfidence: 0.8,
  startDate: new Date(Date.now() - 24 * 60 * 60 * 1000)
})
```

## Exporting Data

### CSV Export

```typescript
const csv = store.exportToCSV()
// Download as file
const blob = new Blob([csv], { type: 'text/csv' })
const url = URL.createObjectURL(blob)
const a = document.createElement('a')
a.href = url
a.download = 'predictions.csv'
a.click()
```

CSV format:
```csv
id,input,output,confidence,modelId,timestamp,latencyMs
pred-123,"[0.5,0.3,0.2]",[0.9],0.95,sator-v1,2026-03-13T18:00:00Z,12
```

### JSON Export

```typescript
const json = store.exportToJSON()
const data = JSON.parse(json)
// Array of PredictionResult objects
```

## Interpreting Charts

### Latency Over Time

- **Line chart**: Shows prediction latency trends
- **X-axis**: Time (last 100 predictions)
- **Y-axis**: Latency in milliseconds
- **Green zone**: < 50ms (excellent)
- **Yellow zone**: 50-100ms (good)
- **Red zone**: > 100ms (needs optimization)

### Accuracy by Model

- **Bar chart**: Compares model accuracy
- **Higher bars**: Better performing models
- **Color coding**: Green (>90%), Yellow (70-90%), Red (<70%)

### Confidence Distribution

- **Pie chart**: Shows confidence buckets
- **Buckets**: 0-50%, 50-80%, 80-95%, 95-100%
- **Goal**: Most predictions in 80-100% range

### Predictions per Hour

- **Area chart**: Shows prediction volume
- **Usage**: Identify peak usage times
- **Trending**: Upward = growing adoption

## Custom Queries

```typescript
// Get statistics
const stats = store.getStats()
console.log(stats.totalPredictions)
console.log(stats.averageLatency)

// Clear old predictions
store.clearHistory()

// Access raw predictions array
const predictions = store.predictions
```

## Performance Tips

1. **Pagination**: History view shows 50 per page for performance
2. **Filtering**: Apply filters before sorting for faster results
3. **Export**: Large exports (>1000) may take a few seconds
4. **Storage**: Predictions persisted to localStorage (max 1000)

## Troubleshooting

### Charts Not Updating

- Check if predictions are being added to store
- Verify component is subscribed to store updates
- Check browser console for errors

### Slow Queries

- Use date range filters to reduce dataset
- Avoid searching without filters on large datasets
- Clear old history if > 1000 predictions

### Export Failures

- Check browser download permissions
- For large datasets, export in chunks
- Verify sufficient memory available
