# Team C - Pass 2 - Phase 2: Code Fixes Report (C5)

**Date:** 2026-03-05  
**Domain:** Code Quality & Bug Resolution  
**Fix Team:** C5  
**Handoff To:** C6 for verification

---

## Summary

This document contains all fixes applied to address the critical and high-severity issues identified in the Phase 1 audit. All fixes have been implemented and are ready for verification.

### Fixes Applied

| Issue ID | Severity | File | Status |
|----------|----------|------|--------|
| CRITICAL-1 | 🔴 Critical | ErrorHandling.js | ✅ Fixed |
| CRITICAL-2 | 🔴 Critical | ErrorBoundary.jsx (new) | ✅ Fixed |
| HIGH-1 | 🟠 High | CrossHubRouter.js | ✅ Fixed |
| HIGH-2 | 🟠 High | useSpatialData.ts | ✅ Fixed |
| HIGH-4 | 🟠 High | CrossHubRouter.js | ✅ Fixed |
| HIGH-5 | 🟠 High | error-recovery.js | ✅ Fixed |
| HIGH-6 | 🟠 High | useSpatialData.ts | ✅ Fixed |
| MEDIUM-3 | 🟡 Medium | AnalyticsIntegration.js | ✅ Fixed |

---

## 1. XSS Fix in ErrorHandling.js (CRITICAL-1)

### Problem
The `buildHTML` and `renderSuggestion` methods used template literals with unsanitized user input, creating XSS vulnerabilities.

### Solution
Added HTML sanitization utility and applied it to all dynamic content:

```javascript
/**
 * Sanitize HTML to prevent XSS attacks
 * Escapes HTML special characters and removes script tags
 */
function sanitizeHTML(str) {
  if (typeof str !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = str;
  let sanitized = div.innerHTML;
  
  // Additional protection: remove script tags and event handlers
  sanitized = sanitized
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  
  return sanitized;
}

/**
 * Validate and sanitize URL to prevent javascript: protocol injection
 */
function sanitizeURL(url) {
  if (typeof url !== 'string') return '/';
  
  const trimmed = url.trim().toLowerCase();
  
  // Block dangerous protocols
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return '/';
    }
  }
  
  // Only allow relative URLs or http/https
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('/')) {
    return url;
  }
  
  // Default to safe fallback
  return '/';
}
```

### Changes in `buildHTML`:
- Sanitized `message`, `title`, `icon`, `statusCode`, `requestId`
- Used DOM API instead of direct innerHTML where possible
- All dynamic content now passes through `sanitizeHTML()`

### Changes in `renderSuggestion`:
- Sanitized `suggestion.title`, `suggestion.description`
- Validated URLs with `sanitizeURL()`
- Sanitized color values

---

## 2. Error Boundaries Implementation (CRITICAL-2)

### Problem
No React Error Boundaries existed in the codebase, meaning any component error would crash the entire application.

### Solution
Created new `ErrorBoundary.jsx` component and integrated it into App.jsx:

**New File: `website/shared/components/ErrorBoundary.jsx`**
```jsx
import React from 'react';
import { errorHandler, ERROR_TYPES } from './ErrorHandling.js';

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so next render shows fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console
    console.error('ErrorBoundary caught error:', error, errorInfo);
    
    this.setState({ errorInfo });
    
    // Log to analytics
    if (typeof window !== 'undefined' && window.satorAnalytics) {
      window.satorAnalytics.trackEvent('error', {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        type: 'react_error_boundary',
      });
    }
    
    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null, 
      errorInfo: null 
    });
    
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      
      // Default fallback UI
      return (
        <div className="error-boundary-fallback" style={{
          padding: '2rem',
          textAlign: 'center',
          background: '#1a1a1a',
          color: '#fff',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>⚠️</div>
          <h2 style={{ marginBottom: '1rem' }}>Something went wrong</h2>
          <p style={{ opacity: 0.8, marginBottom: '2rem' }}>
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={this.handleReset}
              style={{
                padding: '0.75rem 1.5rem',
                background: '#00CED1',
                color: '#000',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              Try Again
            </button>
            <button 
              onClick={() => window.location.href = '/'}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: '#fff',
                border: '2px solid rgba(255,255,255,0.3)',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Go Home
            </button>
          </div>
          {process.env.NODE_ENV === 'development' && this.state.errorInfo && (
            <details style={{ marginTop: '2rem', textAlign: 'left', maxWidth: '800px' }}>
              <summary style={{ cursor: 'pointer', marginBottom: '1rem' }}>Error Details</summary>
              <pre style={{ 
                background: '#0a0a0a', 
                padding: '1rem', 
                borderRadius: '8px',
                overflow: 'auto',
                fontSize: '0.75rem'
              }}>
                {this.state.error?.stack}
                {'\n\nComponent Stack:\n'}
                {this.state.errorInfo.componentStack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
```

**Integration in App.jsx:**
```jsx
import ErrorBoundary from './shared/components/ErrorBoundary';

// Wrap the app
<ErrorBoundary>
  <ProgressiveDisclosureProvider>
    <div className="rotas-app">
      {/* ... app content ... */}
    </div>
  </ProgressiveDisclosureProvider>
</ErrorBoundary>
```

---

## 3. URL Parameter Sanitization (HIGH-1)

### Problem
URL query parameters decoded but not sanitized before being used in analytics, error messages, and navigation.

### Solution
Added comprehensive input validation and sanitization:

**In `parseQueryString`:**
```javascript
/**
 * Whitelist of allowed query parameters
 */
ALLOWED_PARAMS = [
  'dl',      // Deep link
  'hub',     // Hub target
  'state',   // State data
  'expires', // Expiration
  'ref',     // Referrer
  'source',  // Traffic source
];

/**
 * Sanitize query parameter value
 */
sanitizeParamValue(value) {
  if (typeof value !== 'string') return '';
  
  // Limit length to prevent DoS
  const maxLength = 2048;
  let sanitized = value.slice(0, maxLength);
  
  // Remove null bytes and control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Remove HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  
  return sanitized;
}

/**
 * Parse query string to object with validation
 */
parseQueryString(search) {
  const params = {};
  if (!search) return params;
  
  const queryString = search.startsWith('?') ? search.slice(1) : search;
  
  // Limit query string length
  if (queryString.length > 4096) {
    console.warn('[CrossHubRouter] Query string too long, truncating');
  }
  
  const pairs = queryString.slice(0, 4096).split('&');
  
  pairs.forEach(pair => {
    if (!pair) return;
    
    const eqIndex = pair.indexOf('=');
    let key, value;
    
    if (eqIndex === -1) {
      key = pair;
      value = '';
    } else {
      key = pair.slice(0, eqIndex);
      value = pair.slice(eqIndex + 1);
    }
    
    try {
      key = decodeURIComponent(key);
      value = decodeURIComponent(value);
    } catch (e) {
      console.warn('[CrossHubRouter] Failed to decode query param:', key);
      return;
    }
    
    // Validate key against whitelist if strict mode enabled
    if (this.strictQueryParams && !this.ALLOWED_PARAMS.includes(key)) {
      return;
    }
    
    // Sanitize both key and value
    key = this.sanitizeParamValue(key);
    value = this.sanitizeParamValue(value);
    
    if (key) {
      params[key] = value;
    }
  });
  
  return params;
}
```

**In `extractParams`:**
```javascript
/**
 * Validate route parameter
 */
validateRouteParam(key, value) {
  const maxLength = 256;
  
  if (typeof value !== 'string') return '';
  
  // Trim and limit length
  let sanitized = value.trim().slice(0, maxLength);
  
  // Remove control characters and dangerous patterns
  sanitized = sanitized
    .replace(/[\x00-\x1F\x7F]/g, '')
    .replace(/[<>"']/g, '')  // Remove HTML special chars
    .replace(/\.\./g, '');    // Prevent path traversal
  
  // Validate ID format (alphanumeric, hyphens, underscores)
  if (key.toLowerCase().includes('id')) {
    if (!/^[\w-]+$/.test(sanitized)) {
      console.warn(`[CrossHubRouter] Invalid ID format for ${key}:`, value);
      return '';
    }
  }
  
  return sanitized;
}

/**
 * Extract route parameters from path with validation
 */
extractParams(path) {
  if (!path || typeof path !== 'string') {
    console.warn('[CrossHubRouter] Invalid path provided to extractParams');
    return {};
  }
  
  const params = {};
  
  // Match dynamic segments like :id
  const paramPattern = /:([^/]+)/g;
  
  for (const [routePattern] of Object.entries(this.getAllRoutes())) {
    const regex = this.routeToRegex(routePattern);
    const match = path.match(regex);
    
    if (match) {
      const keys = [];
      let paramMatch;
      while ((paramMatch = paramPattern.exec(routePattern)) !== null) {
        keys.push(paramMatch[1]);
      }
      
      keys.forEach((key, index) => {
        const rawValue = match[index + 1];
        params[key] = this.validateRouteParam(key, rawValue);
      });
      
      break;
    }
  }
  
  return params;
}
```

**In `handleDeepLink`:**
```javascript
/**
 * Validate deep link URL
 */
isValidDeepLink(url) {
  if (typeof url !== 'string') return false;
  
  // Check for dangerous protocols
  const lowerUrl = url.toLowerCase().trim();
  const dangerousProtocols = ['javascript:', 'data:', 'vbscript:'];
  for (const protocol of dangerousProtocols) {
    if (lowerUrl.startsWith(protocol)) {
      console.warn('[CrossHubRouter] Blocked dangerous deep link protocol:', protocol);
      return false;
    }
  }
  
  // Check max length
  if (url.length > 2048) {
    console.warn('[CrossHubRouter] Deep link too long');
    return false;
  }
  
  // Validate against internal routes
  return this.isValidInternalLink(url);
}
```

---

## 4. API Response Validation (HIGH-2, HIGH-6)

### Problem
API responses used directly without validation or `response.ok` checks.

### Solution
Added runtime type checking and proper error handling:

```typescript
// Validation schemas
const SatorEventSchema = {
  validate(data: unknown): data is SatorEventData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.playerId === 'string' &&
      typeof d.mapX === 'number' &&
      typeof d.mapY === 'number' &&
      ['plant', 'mvp', 'hotstreak', 'ace'].includes(d.eventType as string) &&
      typeof d.intensity === 'number'
    );
  }
};

const ArepoMarkerSchema = {
  validate(data: unknown): data is ArepoMarkerData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.x === 'number' &&
      typeof d.y === 'number' &&
      ['attack', 'defense'].includes(d.victimTeam as string) &&
      typeof d.isMultikill === 'boolean' &&
      typeof d.multikillCount === 'number' &&
      typeof d.isClutch === 'boolean' &&
      typeof d.roundNumber === 'number' &&
      typeof d.age === 'number'
    );
  }
};

const RotasTrailSchema = {
  validate(data: unknown): data is RotasTrailData {
    if (!data || typeof data !== 'object') return false;
    const d = data as Record<string, unknown>;
    return (
      typeof d.playerId === 'string' &&
      ['attack', 'defense'].includes(d.team as string) &&
      Array.isArray(d.positions) &&
      d.positions.every((p: unknown) => 
        p && typeof p === 'object' &&
        typeof (p as Record<string, unknown>).x === 'number' &&
        typeof (p as Record<string, unknown>).y === 'number' &&
        typeof (p as Record<string, unknown>).tick === 'number'
      ) &&
      [-1, 0, 1].includes(d.directionLR as number)
    );
  }
};

/**
 * Fetch with error handling and response.ok check
 */
async function fetchWithError<T>(
  url: string, 
  validator: { validate: (data: unknown) => data is T }
): Promise<T[]> {
  const response = await fetch(url);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!Array.isArray(data)) {
    throw new Error('Expected array response');
  }
  
  // Validate each item, filter invalid ones
  const validated = data.filter((item: unknown) => {
    const isValid = validator.validate(item);
    if (!isValid) {
      console.warn('[useSpatialData] Invalid data item:', item);
    }
    return isValid;
  });
  
  return validated;
}
```

**Updated `useEffect` with debouncing and cleanup:**
```typescript
useEffect(() => {
  const timer = setTimeout(() => {
    fetchData();
  }, 300); // Debounce 300ms
  
  return () => clearTimeout(timer);
}, [fetchData]);
```

---

## 5. Memory Leak Fixes (HIGH-4, HIGH-5, MEDIUM-3)

### 5.1 CrossHubRouter Event Listener Cleanup (HIGH-4)

**Added to CrossHubRouter:**
```javascript
constructor(options = {}) {
  // ... existing code ...
  
  // Bind methods for cleanup
  this.handlePopState = this.handlePopState.bind(this);
  this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
  this.trackPageView = this.trackPageView.bind(this);
}

init() {
  // Set up popstate listener with bound method
  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', this.handlePopState);
    
    // Handle initial deep link
    if (this.enableDeepLinking) {
      this.handleDeepLink();
    }
  }
}

/**
 * Cleanup method to prevent memory leaks
 */
destroy() {
  if (typeof window !== 'undefined') {
    window.removeEventListener('popstate', this.handlePopState);
    window.removeEventListener('router:pageview', this.trackPageView);
    window.removeEventListener('router:event', this.trackPageView);
    window.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  // Clear hooks
  this.hooks.beforeNavigate = [];
  this.hooks.afterNavigate = [];
  this.hooks.onError = [];
  
  // Clear history
  this.routeHistory = [];
}
```

### 5.2 AbortController Cleanup (HIGH-5)

**Fixed in error-recovery.js:**
```javascript
async function attemptRecovery() {
  const testUrl = '/api/health?' + Date.now();
  
  const controller = new AbortController();
  let timeoutId;
  
  try {
    timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(testUrl, {
      method: 'HEAD',
      cache: 'no-store',
      signal: controller.signal,
    });
    
    return response.ok;
  } catch (fetchError) {
    // Fetch failed - could be offline
    return navigator.onLine;
  } finally {
    // Always clear the timeout
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}
```

### 5.3 Analytics Manager Cleanup (MEDIUM-3)

**Added to AnalyticsIntegration.js:**
```javascript
/**
 * Cleanup all resources
 */
destroy() {
  if (this.flushTimer) {
    clearInterval(this.flushTimer);
    this.flushTimer = null;
  }
  
  // Flush remaining events
  this.flush();
  
  // Remove event listeners
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  }
  
  if (typeof window !== 'undefined') {
    window.removeEventListener('router:pageview', this.handleRouterPageView);
    window.removeEventListener('router:event', this.handleRouterEvent);
  }
  
  // Clear queues
  this.eventQueue = [];
  this.hubTransitions = [];
  this.conversionGoals.clear();
  
  this.log('Analytics manager destroyed');
}

// Bound event handlers for proper cleanup
handleVisibilityChange = () => {
  if (document.visibilityState === 'hidden') {
    this.trackEvent(ANALYTICS_EVENTS.CONTENT_ENGAGEMENT, {
      engagementTime: Date.now() - this.pageStartTime,
    });
    this.flush();
  } else {
    this.pageStartTime = Date.now();
  }
}

handleRouterPageView = (e: Event) => {
  this.trackPageView((e as CustomEvent).detail);
}

handleRouterEvent = (e: Event) => {
  const detail = (e as CustomEvent).detail;
  this.trackEvent(detail.name, detail.properties);
}
```

---

## Testing Recommendations

### Unit Tests Needed

1. **ErrorHandling.js**
   - Test `sanitizeHTML` with various XSS payloads
   - Test `sanitizeURL` with dangerous protocols
   - Test `buildHTML` output doesn't contain unescaped HTML

2. **CrossHubRouter.js**
   - Test `parseQueryString` sanitization
   - Test `extractParams` validation
   - Test `destroy()` properly removes event listeners

3. **useSpatialData.ts**
   - Test `fetchWithError` throws on non-ok responses
   - Test schema validation filters invalid data
   - Test debouncing behavior

4. **ErrorBoundary**
   - Test catches errors in children
   - Test displays fallback UI
   - Test calls analytics on error

### Integration Tests

1. Navigate with malicious URL parameters - verify no XSS
2. Trigger API errors - verify graceful handling
3. Navigate rapidly - verify no memory leaks
4. Unmount components with analytics - verify cleanup

---

## Verification Checklist for C6

- [ ] XSS payloads in URL parameters are sanitized
- [ ] Error boundary catches and displays fallback UI
- [ ] API errors show proper error messages
- [ ] Memory profiler shows no leaking event listeners
- [ ] Response.ok failures are properly handled
- [ ] URL parameter validation rejects invalid input
- [ ] Analytics cleanup prevents multiple intervals
- [ ] All new code has JSDoc comments

---

## Files Modified

1. `website/shared/components/ErrorHandling.js` - Added sanitization utilities
2. `website/shared/components/ErrorBoundary.jsx` - New file
3. `website/shared/router/CrossHubRouter.js` - Added validation and cleanup
4. `shared/axiom-esports-data/visualization/sator-square/hooks/useSpatialData.ts` - Added validation and error handling
5. `website/shared/scripts/error-recovery.js` - Fixed AbortController cleanup
6. `website/shared/analytics/AnalyticsIntegration.js` - Added proper cleanup
7. `website/hub2-rotas/src/App.jsx` - Integrated ErrorBoundary

---

*End of Fixes Report*
