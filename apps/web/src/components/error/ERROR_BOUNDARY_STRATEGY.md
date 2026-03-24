# Error Boundary Strategy - 4NJZ4 TENET Platform

**Version:** [Ver001.000]  
**Last Updated:** 2026-03-15

## Overview

This document defines the comprehensive error boundary strategy for the 4NJZ4 TENET Platform. Error boundaries are implemented in a hierarchical pattern to provide graceful degradation and recovery at multiple levels.

## Error Boundary Hierarchy

```
┌─────────────────────────────────────────────────────────────┐
│                    AppErrorBoundary                         │
│              (Top-level - catches everything)               │
└──────────────────────┬──────────────────────────────────────┘
                       │
        ┌──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼
┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│ HubErrorBoundary│ │   SATOR  │ │   ROTAS  │ │   AREPO  │
│  (Hub-level)    │ │          │ │          │ │   OPERA  │
└───────┬─────────┘ └──────────┘ └──────────┘ └──────────┘
        │
        ├──────────────────────────────────────────────┐
        │                                              │
        ▼                                              ▼
┌─────────────────────┐                    ┌─────────────────────┐
│  MLErrorBoundary    │                    │ DataErrorBoundary   │
│  (ML-specific)      │                    │ (API/Data errors)   │
└─────────┬───────────┘                    └─────────┬───────────┘
          │                                          │
          ▼                                          ▼
┌─────────────────────┐                    ┌─────────────────────┐
│ StreamingErrorBoundary│                  │ PanelErrorBoundary  │
│ (WebSocket/Stream)  │                    │ (Component-level)   │
└─────────────────────┘                    └─────────────────────┘
```

## Error Boundary Types

### 1. AppErrorBoundary
**Location:** `AppErrorBoundary.tsx`
- **Level:** Application (Root)
- **Purpose:** Catches all uncaught errors
- **Recovery:** Full page reload, navigation to home
- **UI:** Full-screen error page with hub navigation

### 2. HubErrorBoundary
**Location:** `HubErrorBoundary.tsx`
- **Level:** Hub
- **Purpose:** Hub-specific error handling and recovery
- **Recovery:** Hub reset, navigation to other hubs
- **UI:** Hub-themed error fallback

### 3. MLInferenceErrorBoundary
**Location:** `MLInferenceErrorBoundary.tsx`
- **Level:** Feature
- **Purpose:** ML model and inference errors
- **Handles:**
  - Model loading failures
  - Prediction errors
  - TensorFlow.js errors
  - WebWorker errors
- **Recovery:** Model retry, fallback to cached predictions

### 4. StreamingErrorBoundary
**Location:** `StreamingErrorBoundary.tsx`
- **Level:** Feature
- **Purpose:** WebSocket and streaming errors
- **Handles:**
  - Connection failures
  - Timeout errors
  - Buffer overflow
  - Parse errors
- **Recovery:** Auto-reconnect with backoff

### 5. DataErrorBoundary
**Location:** `DataErrorBoundary.tsx`
- **Level:** Feature
- **Purpose:** API and data fetching errors
- **Handles:**
  - HTTP errors (4xx, 5xx)
  - Network failures
  - Timeout errors
  - Parse errors
- **Recovery:** Retry with exponential backoff

### 6. PanelErrorBoundary
**Location:** `PanelErrorBoundary.jsx`
- **Level:** Component
- **Purpose:** Individual panel/grid item errors
- **Recovery:** Panel reload, close panel
- **UI:** Compact error display within grid

## Hub Error Boundary Configuration

### SATOR (The Observatory)
```tsx
<AppErrorBoundary>
  <HubErrorBoundary hubName="sator">
    <MLInferenceErrorBoundary>
      <PanelErrorBoundary>
        <SatorHubContent />
      </PanelErrorBoundary>
    </MLInferenceErrorBoundary>
  </HubErrorBoundary>
</AppErrorBoundary>
```

### ROTAS (The Harmonic Layer)
```tsx
<AppErrorBoundary>
  <HubErrorBoundary hubName="rotas">
    <MLInferenceErrorBoundary>
      <StreamingErrorBoundary>
        <PanelErrorBoundary>
          <RotasHubContent />
        </PanelErrorBoundary>
      </StreamingErrorBoundary>
    </MLInferenceErrorBoundary>
  </HubErrorBoundary>
</AppErrorBoundary>
```

### AREPO (The Control Layer)
```tsx
<AppErrorBoundary>
  <HubErrorBoundary hubName="arepo">
    <DataErrorBoundary>
      <PanelErrorBoundary>
        <ArepoHubContent />
      </PanelErrorBoundary>
    </DataErrorBoundary>
  </HubErrorBoundary>
</AppErrorBoundary>
```

### OPERA (The Action Layer)
```tsx
<AppErrorBoundary>
  <HubErrorBoundary hubName="opera">
    <DataErrorBoundary>
      <PanelErrorBoundary>
        <OperaHubContent />
      </PanelErrorBoundary>
    </DataErrorBoundary>
  </HubErrorBoundary>
</AppErrorBoundary>
```

## Error Logging

All error boundaries use the centralized logger utility:

```typescript
import { logger } from '@/utils/logger'

// In error boundary
componentDidCatch(error, errorInfo) {
  logger.error('[BoundaryName] Error caught:', {
    error: error.message,
    stack: error.stack,
    componentStack: errorInfo.componentStack,
    hub: this.props.hubName,
    timestamp: new Date().toISOString()
  })
  
  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    sendToAnalytics(error, errorInfo)
  }
}
```

## Error UI Guidelines

### Colors per Hub
- **SATOR:** Gold (#ffd700)
- **ROTAS:** Cyan (#00d4ff)
- **AREPO:** Blue (#0066ff)
- **OPERA:** Purple (#9d4edd)
- **TENET:** White (#ffffff)
- **GLOBAL:** Purple (#9d4edd)

### GlassCard Styling
All error UIs use consistent GlassCard styling:
- Backdrop blur
- Semi-transparent background
- Hub-specific border colors
- Glow effects matching hub theme

### Common Elements
1. **Error Icon:** AlertTriangle with hub color
2. **Title:** Descriptive error type
3. **Message:** User-friendly explanation
4. **Actions:** Retry, Go Back, Go Home
5. **Technical Details:** Collapsible (dev only)
6. **Error ID:** For support reference

## Implementation Checklist

- [x] AppErrorBoundary - Top-level
- [x] MLInferenceErrorBoundary - ML errors
- [x] StreamingErrorBoundary - WebSocket errors
- [x] PanelErrorBoundary - Component errors
- [x] HubErrorFallback - Consistent UI
- [x] HubErrorBoundary - Hub-level handler
- [x] DataErrorBoundary - API/data errors
- [x] Error logging integration
- [x] SATOR hub boundaries
- [x] ROTAS hub boundaries
- [x] AREPO hub boundaries
- [x] OPERA hub boundaries
- [x] App.jsx route boundaries

## Best Practices

1. **Always have at least 2 levels** - Hub-level + Component-level
2. **Use specific boundaries first** - ML, Streaming, Data before generic
3. **Provide recovery options** - Always include retry functionality
4. **Log all errors** - Use centralized logger
5. **Graceful degradation** - Show partial UI when possible
6. **Hub-themed UI** - Consistent with hub colors
7. **Development details** - Show stack traces in dev only
8. **Error boundaries don't catch:**
   - Event handlers (use try/catch)
   - Async code (use error states)
   - Server-side rendering errors
   - Errors in the error boundary itself
