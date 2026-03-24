# Prediction Accuracy Dashboard

**[Ver001.000]**

ML Prediction accuracy tracking and visualization component for the SATOR hub.

## Components

### PredictionAccuracyDashboard

Main dashboard component featuring:
- Accuracy trend line chart (24h)
- Model comparison bar chart
- Confusion matrix visualization
- Performance metrics table
- Auto-refresh every 30 seconds

```tsx
import { PredictionAccuracyDashboard } from '@/components/analytics';

function MyPage() {
  return <PredictionAccuracyDashboard />;
}
```

### AnalyticsSection (SATOR Hub Integration)

Pre-configured section component for SATOR hub:

```tsx
import { AnalyticsSection, CompactAnalyticsCard } from '@/hub-1-sator/components';

// Full section
<AnalyticsSection />

// Compact card for grid layouts
<CompactAnalyticsCard onExpand={() => {}} />
```

## Hook

### usePredictionAccuracy

```tsx
import { usePredictionAccuracy } from '@/hooks';

function MyComponent() {
  const { 
    data, 
    isLoading, 
    error, 
    refresh, 
    isStale,
    lastUpdated 
  } = usePredictionAccuracy({
    autoRefresh: true,
    refreshInterval: 30000,
  });
  
  // data.metrics.overallAccuracy
  // data.modelComparison[]
  // data.timeSeries[]
  // data.confusionMatrix
}
```

## Mock Data

The dashboard includes mock data generation for demo purposes. When real prediction data is available in the `predictionHistoryStore`, it will be used instead.

## Chart Types

| Chart | Library | Purpose |
|-------|---------|---------|
| Line Chart | recharts | Accuracy trend over time |
| Bar Chart | recharts | Model comparison |
| Confusion Matrix | Custom CSS | Classification performance |

## Responsive Behavior

- **Desktop**: 2-column grid layout
- **Tablet**: 2-column grid (compact)
- **Mobile**: Single column stack

## Colors

Uses SATOR hub theme (cyan #00d4ff) as primary color with:
- Success: #00ff88
- Warning: #ffaa00
- Error: #ff4655

## Integration with SATOR Hub

To add to the SATOR hub navigation:

1. Import the AnalyticsSection
2. Add a new route/tab
3. Include the compact card in overview grids

Example:
```tsx
// In SATOR hub layout
{activeTab === 'analytics' && <AnalyticsSection />}
```
