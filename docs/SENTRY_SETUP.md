[Ver001.000]

# Sentry Setup Guide

**Date:** 2026-03-16  
**Status:** Ready for Production Deployment

---

## Overview

Sentry is configured for error tracking and performance monitoring in the 4NJZ4 TENET Platform. This guide covers setup for production deployment.

---

## Quick Start

### 1. Create Sentry Account

1. Go to [sentry.io](https://sentry.io) and sign up
2. Create a new organization (e.g., `libre-x-esport`)
3. Create a new project: `4njz4-tenet-platform`

### 2. Get DSN

In Sentry dashboard:
1. Go to Settings → Projects → 4njz4-tenet-platform
2. Click "Client Keys (DSN)"
3. Copy the DSN URL

### 3. Configure Environment Variables

Create `apps/website-v2/.env.production`:

```bash
# Sentry Configuration
VITE_SENTRY_DSN=https://your-dsn-here@sentry.io/project-id
VITE_APP_ENVIRONMENT=production
VITE_APP_VERSION=2.1.0

# Optional: Enable Sentry Feedback
VITE_SENTRY_FEEDBACK_ENABLED=true
```

### 4. Configure Build Plugin

Copy the template:
```bash
cp apps/website-v2/.env.sentry-build-plugin apps/website-v2/.env.sentry
```

Edit with your values:
```bash
SENTRY_AUTH_TOKEN=your_auth_token_here
SENTRY_ORG=libre-x-esport
SENTRY_PROJECT=4njz4-tenet-platform
SENTRY_UPLOAD_SOURCEMAPS=true
```

**Get Auth Token:**
1. Go to sentry.io/settings/account/api/auth-tokens/
2. Create New Token
3. Scopes needed: `org:read`, `project:releases`, `project:write`

---

## Features Configured

### Error Tracking
- ✅ Automatic error capture
- ✅ Source maps for stack traces
- ✅ User feedback dialog
- ✅ Error filtering (ignores browser extensions, network errors)

### Performance Monitoring
- ✅ Web Vitals tracking
- ✅ API call performance
- ✅ Navigation timing
- ✅ Sample rate: 10% in production

### Release Tracking
- ✅ Automatic release creation
- ✅ Source map uploads
- ✅ Commit integration (GitHub)

### Breadcrumbs
- ✅ User actions logged
- ✅ Navigation events
- ✅ Console logs
- ✅ Network requests

---

## Usage in Code

### Initialize Sentry

```typescript
// main.tsx
import { initSentry } from '@/config/sentry';

// Initialize before React
initSentry();
```

### Error Boundaries

```tsx
import { SentryErrorBoundary } from '@/components/error/SentryErrorBoundary';

function App() {
  return (
    <SentryErrorBoundary>
      <YourApp />
    </SentryErrorBoundary>
  );
}
```

### Manual Error Reporting

```typescript
import { captureException, addBreadcrumb } from '@/config/sentry';

// Add breadcrumb for context
addBreadcrumb('User clicked purchase button', 'user-action');

try {
  await processPayment();
} catch (error) {
  captureException(error, { 
    userId: user.id,
    amount: cart.total 
  });
}
```

### Set User Context

```typescript
import { setSentryUser, clearSentryUser } from '@/config/sentry';

// On login
setSentryUser(user.id, user.email, user.username);

// On logout
clearSentryUser();
```

---

## Vercel Deployment

### Environment Variables

In Vercel dashboard:
1. Go to Project Settings → Environment Variables
2. Add:

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SENTRY_DSN` | Your DSN | Production |
| `SENTRY_AUTH_TOKEN` | Auth token | Production |
| `SENTRY_ORG` | libre-x-esport | Production |
| `SENTRY_PROJECT` | 4njz4-tenet-platform | Production |

### Build Configuration

Sentry is automatically initialized in production builds. The build plugin uploads source maps during the build process.

---

## GitHub Integration

### Set Up Release Automation

1. In Sentry: Settings → Integrations → GitHub
2. Connect your GitHub account
3. Select the `notbleaux/eSports-EXE` repository

### Release Tracking

Releases are automatically created with:
- Version from `package.json`
- Associated commits
- Source maps

---

## Alert Configuration

### Create Alert Rules

1. Go to Alerts → Create Alert Rule
2. Set conditions:

**High Priority:**
- Issue count > 10 in 5 minutes
- Error rate > 1% in 5 minutes

**Medium Priority:**
- New issue introduced
- Issue seen 100+ times

**Notification Channels:**
- Email: team@libre-x-esport.com
- Slack: #alerts channel
- PagerDuty: For critical errors

### Ignore Patterns

These errors are automatically filtered:
- Chrome extension errors
- ResizeObserver loop errors
- Network errors (user connection issues)
- WebSocket errors

---

## Testing

### Verify Setup

```typescript
// In browser console
Sentry.captureMessage('Test message from setup');
```

Check Sentry dashboard for the test message.

### Simulate Error

```typescript
// Add temporary error button
<button onClick={() => { throw new Error('Test error'); }}>
  Test Error
</button>
```

Verify error appears in Sentry with:
- Stack trace
- User context
- Breadcrumbs
- Environment tag

---

## Troubleshooting

### Source Maps Not Working

1. Verify `SENTRY_UPLOAD_SOURCEMAPS=true`
2. Check build output has `.map` files
3. Ensure auth token has correct scopes

### Errors Not Appearing

1. Check DSN is correct
2. Verify `VITE_APP_ENVIRONMENT` is set
3. Check browser console for Sentry initialization logs
4. Ensure error isn't in ignore list

### Performance Data Missing

1. Check `tracesSampleRate` in config
2. Verify BrowserTracing integration is loaded
3. Check network tab for sentry.io requests

---

## Pricing Considerations

### Free Tier Limits
- 5,000 errors/month
- 1M performance units/month
- 1GB attachments/month

### Monitoring Usage

Track in Sentry dashboard:
- Stats → Usage
- Set up usage alerts at 80% of quota

### Optimization Tips

1. Reduce sample rate if exceeding limits:
   ```typescript
   tracesSampleRate: 0.05 // 5% sampling
   ```

2. Filter non-critical errors
3. Use `beforeSend` to drop specific errors

---

## Security

### PII Handling

Sentry is configured to NOT collect:
- Passwords
- Credit card numbers
- API keys (automatic scrubbing)

### Custom Scrubbing

```typescript
Sentry.init({
  beforeSend(event) {
    // Remove custom sensitive data
    if (event.request) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

---

## Next Steps

1. ✅ Create Sentry account and project
2. ✅ Add environment variables to Vercel
3. ✅ Deploy to production
4. ✅ Verify errors are captured
5. ✅ Set up alert rules
6. ✅ Add team members to Sentry
7. ⏳ Configure Slack notifications
8. ⏳ Set up PagerDuty integration (optional)

---

## Support

- **Sentry Docs:** https://docs.sentry.io/
- **React Integration:** https://docs.sentry.io/platforms/javascript/guides/react/
- **Help:** Contact devops@libre-x-esport.com

---

*Last Updated: 2026-03-16*
