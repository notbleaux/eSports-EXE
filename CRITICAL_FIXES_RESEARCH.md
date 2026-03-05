# CRITICAL FIXES: RESEARCH & RECOMMENDATIONS
## Pre-Agent Context Document

**Date:** March 5, 2026
**Classification:** CRITICAL - Pre-Deployment Security
**Agent Assignment:** Async Fix Team (3 specialized agents)

---

## EXECUTIVE SUMMARY

Three critical issues block production deployment:
1. **XSS Vulnerability** (CRITICAL-1) - DOM injection via unsanitized user input
2. **Missing Error Boundaries** (CRITICAL-2) - React app crashes take down entire UI
3. **API Error Handling** (CRITICAL-3) - No response.ok checks, silent failures

This document provides comprehensive research, solutions, and implementation guidance for async fix agents.

---

## FIX 1: XSS VULNERABILITY IN ERRORHANDLING.JS

### 1.1 Problem Analysis

**Location:** `website/shared/components/ErrorHandling.js`
**Vulnerability Type:** Reflected XSS (DOM-based)
**CWE:** CWE-79: Improper Neutralization of Input During Web Page Generation
**CVSS Score:** 8.8 (HIGH)

**Vulnerable Code Pattern:**
```javascript
// VULNERABLE - Direct template literal interpolation
buildHTML(message, suggestion) {
  return `
    <div class="error-message">
      <p>${message}</p>  <!-- XSS: User input directly in HTML -->
      <div class="suggestion">
        <h3>${suggestion.title}</h3>  <!-- XSS: User input directly in HTML -->
        <p>${suggestion.description}</p>  <!-- XSS: User input directly in HTML -->
      </div>
    </div>
  `;
}
```

**Attack Vector:**
1. Attacker injects `<script>alert('XSS')</script>` into error message
2. ErrorHandling builds HTML with unsanitized input
3. innerHTML injects script into DOM
4. Script executes in user's browser
5. Session hijacking, credential theft, or malware distribution

### 1.2 Solution Research

**Option A: DOMPurify Sanitization (RECOMMENDED)**
```javascript
import DOMPurify from 'dompurify';

buildHTML(message, suggestion) {
  const cleanMessage = DOMPurify.sanitize(message);
  const cleanTitle = DOMPurify.sanitize(suggestion.title);
  const cleanDesc = DOMPurify.sanitize(suggestion.description);
  
  return `
    <div class="error-message">
      <p>${cleanMessage}</p>
      <div class="suggestion">
        <h3>${cleanTitle}</h3>
        <p>${cleanDesc}</p>
      </div>
    </div>
  `;
}
```
- ✅ Allows safe HTML (bold, links)
- ✅ Removes dangerous tags (script, iframe)
- ✅ Industry standard (used by GitHub, Mozilla)
- ⚠️ Requires 3KB dependency

**Option B: Text-Only Escape (ALTERNATIVE)**
```javascript
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

buildHTML(message, suggestion) {
  return `
    <div class="error-message">
      <p>${escapeHtml(message)}</p>
      <div class="suggestion">
        <h3>${escapeHtml(suggestion.title)}</h3>
        <p>${escapeHtml(suggestion.description)}</p>
      </div>
    </div>
  `;
}
```
- ✅ No dependencies
- ✅ Simple and fast
- ❌ No HTML allowed (plain text only)

### 1.3 Recommended Implementation

**Use Option A (DOMPurify)** for flexibility with safe HTML formatting.

**Installation:**
```bash
npm install dompurify
```

**Implementation Steps:**
1. Add DOMPurify import to ErrorHandling.js
2. Wrap all user input in DOMPurify.sanitize()
3. Add Content Security Policy header
4. Test with XSS payload: `<img src=x onerror=alert(1)>`

**Testing Checklist:**
- [ ] `<script>alert(1)</script>` - Should be removed
- [ ] `<img src=x onerror=alert(1)>` - Should be removed
- [ ] `javascript:alert(1)` - Should be removed
- [ ] `<b>Bold text</b>` - Should be preserved
- [ ] Normal error messages - Should display correctly

---

## FIX 2: MISSING REACT ERROR BOUNDARIES

### 2.1 Problem Analysis

**Current State:** No Error Boundaries implemented
**Impact:** Single component crash takes down entire React app
**User Experience:** White screen of death
**Recovery:** Full page reload required

**Missing Pattern:**
```javascript
// CURRENT - No error handling
function App() {
  return (
    <div>
      <Header />
      <SATORHub />  {/* If this crashes, entire app dies */}
      <Footer />
    </div>
  );
}
```

### 2.2 Solution Research

**React Error Boundaries (Class Component):**
```javascript
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    // Send to error tracking service
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-fallback">
          <h2>Something went wrong</h2>
          <p>We're working on fixing it. Please try refreshing.</p>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

**React Error Boundaries (Hook-based with react-error-boundary):**
```javascript
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="error-fallback" role="alert">
      <h2>Something went wrong</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>Try Again</button>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <Header />
      <SATORHub />
      <Footer />
    </ErrorBoundary>
  );
}
```

### 2.3 Recommended Implementation

**Use Class Component approach** (no additional dependencies).

**Implementation Strategy:**
1. Create `ErrorBoundary.jsx` component
2. Wrap each major hub in ErrorBoundary
3. Add graceful fallback UI
4. Include error logging

**Architecture:**
```
App
├── ErrorBoundary (App-level)
│   ├── Header
│   ├── ErrorBoundary (Hub-level)
│   │   └── SATORHub
│   ├── ErrorBoundary (Hub-level)
│   │   └── ROTASHub
│   ├── ErrorBoundary (Hub-level)
│   │   └── InformationHub
│   ├── ErrorBoundary (Hub-level)
│   │   └── GamesHub
│   └── Footer
```

**Implementation Steps:**
1. Create `website/shared/components/ErrorBoundary.jsx`
2. Import and wrap each hub in App.jsx
3. Style fallback component
4. Test by throwing error in child component

---

## FIX 3: API ERROR HANDLING

### 3.1 Problem Analysis

**Location:** `useSpatialData.ts` and other data hooks
**Issue:** No response.ok checks, raw API responses used
**Impact:** Silent failures, undefined behavior, potential crashes

**Vulnerable Code:**
```typescript
// VULNERABLE - No error checking
const useSpatialData = () => {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetch('/api/spatial-data')
      .then(res => res.json())  // No check for res.ok
      .then(data => setData(data));  // Could be error HTML
  }, []);
  
  return data;
};
```

**Problems:**
1. 404/500 responses parsed as JSON (will throw)
2. No retry logic for transient failures
3. No user feedback on errors
4. Loading state not properly managed

### 3.2 Solution Research

**Pattern A: Response.ok Check with Error Throwing**
```typescript
const useSpatialData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    fetch('/api/spatial-data')
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(data => {
        setData(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);
  
  return { data, loading, error };
};
```

**Pattern B: Async/Await with Retry Logic (RECOMMENDED)**
```typescript
const fetchWithRetry = async (url: string, options = {}, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, 1000 * (i + 1))); // Exponential backoff
    }
  }
};

const useSpatialData = () => {
  const [state, setState] = useState({
    data: [],
    loading: true,
    error: null
  });
  
  useEffect(() => {
    fetchWithRetry('/api/spatial-data')
      .then(data => setState({ data, loading: false, error: null }))
      .catch(error => setState({ data: [], loading: false, error: error.message }));
  }, []);
  
  return state;
};
```

### 3.3 Recommended Implementation

**Use Pattern B** with retry logic for resilience.

**Implementation Steps:**
1. Create `fetchWithRetry` utility function
2. Update all data hooks to use response.ok checks
3. Return { data, loading, error } tuple
4. Update components to handle error states

**Files to Update:**
- `useSpatialData.ts`
- `useTeamData.ts`
- `useMatchData.ts`
- `useAnalyticsData.ts`
- Any other fetch hooks

---

## IMPLEMENTATION PRIORITY

| Fix | Priority | Effort | Risk if Not Fixed |
|-----|----------|--------|-------------------|
| XSS (Fix 1) | P0 - CRITICAL | 2 hours | Security breach, data theft |
| Error Boundaries (Fix 2) | P0 - CRITICAL | 3 hours | App crashes, poor UX |
| API Error Handling (Fix 3) | P1 - HIGH | 2 hours | Silent failures, bad data |

**Total Effort:** ~7 hours for complete implementation and testing

---

## TESTING STRATEGY

### XSS Testing
```javascript
// Test cases for Fix 1
const xssPayloads = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  'javascript:alert(1)',
  '<iframe src="evil.com">',
  '<body onload=alert(1)>'
];
```

### Error Boundary Testing
```javascript
// Test component for Fix 2
const CrashTest = () => {
  throw new Error('Intentional test error');
};

// Should show fallback UI, not crash app
```

### API Error Testing
```javascript
// Mock failed responses for Fix 3
fetch.mockReject(new Error('Network failure'));
fetch.mockResponse('', { status: 500 });
fetch.mockResponse('', { status: 404 });
```

---

## AGENT ASSIGNMENT

### Agent CRIT-01: XSS Fix Specialist
**Task:** Implement DOMPurify sanitization in ErrorHandling.js
**Skills:** Security, DOM manipulation, XSS prevention
**Deliverable:** Sanitized ErrorHandling.js with tests

### Agent CRIT-02: Error Boundary Architect
**Task:** Create and implement Error Boundary components
**Skills:** React, error handling, component architecture
**Deliverable:** ErrorBoundary.jsx + integration in all hubs

### Agent CRIT-03: API Reliability Engineer
**Task:** Fix API error handling across all data hooks
**Skills:** Async/await, TypeScript, retry logic
**Deliverable:** fetchWithRetry utility + updated hooks

---

## SUCCESS CRITERIA

Before deployment, ALL must pass:
- [ ] XSS payloads sanitized (no script execution)
- [ ] Error Boundaries catch test errors
- [ ] API errors show user-friendly messages
- [ ] No console errors
- [ ] Lighthouse score maintained (90+)
- [ ] Mobile responsive verified

---

*Document prepared for async agent deployment*
*Classification: CRITICAL - Blocking Production*