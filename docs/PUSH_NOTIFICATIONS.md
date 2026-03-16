[Ver001.000]

# Push Notifications Setup Guide

## Overview
Web Push Protocol for browser notifications.

## Generate VAPID Keys

```bash
cd packages/shared/api
python scripts/generate_vapid_keys.py --output .env
```

## Environment Variables

```bash
VAPID_PUBLIC_KEY=your-public-key
VAPID_PRIVATE_KEY=your-private-key
VAPID_CLAIMS_EMAIL=admin@yoursite.com
```

## Browser Setup

### Chrome/Edge
Notifications work automatically.

### Firefox
May require user gesture for permission.

### Safari
Limited support (macOS only, no iOS).

## Frontend Integration

```typescript
import { requestPermission, subscribe } from '@/components/TENET/services/pushNotifications';

async function enableNotifications() {
  const permission = await requestPermission();
  if (permission === 'granted') {
    await subscribe();
  }
}
```

## Testing

```bash
python scripts/test_push.py test-endpoint
python scripts/test_push.py send --user-id=test-user
```
