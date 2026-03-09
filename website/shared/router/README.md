[Ver001.000]

# SATOR Cross-Hub Router

Comprehensive routing system with analytics integration for the SATOR esports platform.

## Overview

The Cross-Hub Router provides a unified navigation system across all SATOR hubs:
- **SATOR** (`/sator`) - RAWS Archive
- **ROTAS** (`/rotas`) - Analytics Engine  
- **INFO** (`/info`) - Knowledge Hub
- **GAMES** (`/games`) - Play & Download

## Features

### Core Routing
- **URL Structure**: Defined routes for all hubs (`/sator/matches/:id`, `/rotas/analytics/:id`, etc.)
- **History Management**: Push/replace state with custom data
- **Deep Linking**: Share links work across all platforms
- **Back Button**: Preserves state and navigation history

### URL Helpers
- **UrlBuilder**: Construct URLs with parameters and query strings
- **HubUrls**: Cross-hub navigation helpers
- **MatchUrls**: Match-specific URL builders
- **AnalyticsUrls**: Analytics dashboard URLs
- **TeamUrls**: Team and tournament URLs
- **DownloadUrls**: Game download URLs

### Route Guards
- **Permission Levels**: Public, Registered, Verified, Premium, Admin
- **Tiered Content**: 4-tier access system
- **Custom Checks**: Add your own access validation
- **Graceful Degradation**: Upgrade prompts instead of hard errors

### Analytics
- **Page View Tracking**: Automatic with context
- **Hub Transition Funnel**: Track user journey across hubs
- **Conversion Tracking**: Define and monitor goals
- **Attribution**: Last-touch attribution model

### Breadcrumbs
- **Auto-Generation**: From URL path
- **Hub Detection**: Automatic icon and styling
- **Parameter Handling**: Smart ID formatting
- **Limit Control**: Collapse long trails

### Error Handling
- **404 Page**: With hub suggestions
- **Offline Page**: Auto-retry when connection returns
- **Error Recovery**: Exponential backoff retry logic
- **Custom Error Types**: NOT_FOUND, OFFLINE, SERVER_ERROR, etc.

## Quick Start

### 1. Include the Router

```html
<script type="module" src="../shared/router/index.js"></script>
```

### 2. Navigate to a Route

```javascript
const { router, MatchUrls } = window.SatorRouter;

// Navigate to match detail
const url = MatchUrls.detail('match-123', { tab: 'highlights' });
router.navigate(url);
```

### 3. Generate Breadcrumbs

```javascript
const { breadcrumbRenderer } = window.SatorRouter;
breadcrumbRenderer.render();
```

### 4. Track Analytics

```javascript
const { analyticsManager } = window.SatorRouter;

// Track custom event
analyticsManager.trackEvent('match_viewed', { matchId: '123' });

// Track conversion
analyticsManager.trackConversion('upgrade', 9.99);
```

## URL Structure

### SATOR Routes
| Route | Pattern | Description |
|-------|---------|-------------|
| BASE | `/sator` | SATOR hub home |
| MATCHES | `/sator/matches` | Match list |
| MATCH_DETAIL | `/sator/matches/:id` | Match details |
| PLAYERS | `/sator/players` | Player list |
| PLAYER_DETAIL | `/sator/players/:id` | Player profile |
| ARCHIVE | `/sator/archive` | Historical data |
| LIVE | `/sator/live` | Live matches |

### ROTAS Routes
| Route | Pattern | Description |
|-------|---------|-------------|
| BASE | `/rotas` | ROTAS hub home |
| ANALYTICS | `/rotas/analytics` | Analytics list |
| ANALYTICS_DETAIL | `/rotas/analytics/:id` | Analytics view |
| PREDICTIONS | `/rotas/predictions` | Predictions |
| PROBABILITY | `/rotas/probability/:id` | Probability calc |
| FORMULAS | `/rotas/formulas` | Formula library |

### INFO Routes
| Route | Pattern | Description |
|-------|---------|-------------|
| BASE | `/info` | INFO hub home |
| TEAMS | `/info/teams` | Team list |
| TEAM_DETAIL | `/info/teams/:id` | Team profile |
| TOURNAMENTS | `/info/tournaments` | Tournament list |
| TOURNAMENT_DETAIL | `/info/tournaments/:id` | Tournament view |
| GUIDES | `/info/guides` | User guides |
| FAQ | `/info/faq` | FAQ section |

### GAMES Routes
| Route | Pattern | Description |
|-------|---------|-------------|
| BASE | `/games` | GAMES hub home |
| DOWNLOAD | `/games/download` | Download client |
| PLAY | `/games/play/:id` | Play game |
| SIMULATOR | `/games/simulator` | Simulator |
| REPLAY | `/games/replay/:id` | Match replay |

## API Reference

### CrossHubRouter

```javascript
// Navigation
router.navigate('/sator/matches/123');
router.navigate({ name: 'MATCH_DETAIL', params: { id: '123' } });
router.back('/sator'); // with fallback

// History
const history = router.getHistory();
const previous = router.getPreviousRoute();

// Hooks
router.on('beforeNavigate', ({ to, from }) => {
  // Return false to cancel
  return validateAccess(to);
});

router.on('afterNavigate', ({ to, from }) => {
  // Post-navigation actions
});

// Share links
const shareUrl = router.generateShareLink('/sator/matches/123', {
  includeState: true,
  expiresIn: 86400000 // 24h
});
```

### Route Guards

```javascript
const { routeGuard, PERMISSIONS } = window.SatorRouter;

// Check access
const result = await routeGuard.checkPermission('/rotas/formulas/custom');

if (!result.allowed) {
  console.log(result.reason); // 'TIER_TOO_LOW'
  console.log(result.message); // 'Tier 3 required...'
  window.location.href = result.redirect;
}

// Guard with automatic redirect
await routeGuard.guard('/premium/content');
```

### URL Helpers

```javascript
const { MatchUrls, TeamUrls, DownloadUrls, HubUrls } = window.SatorRouter;

// Match URLs
MatchUrls.detail('123'); // /sator/matches/123
MatchUrls.detail('123', { tab: 'stats' }); // /sator/matches/123?tab=stats
MatchUrls.list({ status: 'live', page: 2 }); // /sator/matches?status=live&page=2

// Team URLs
TeamUrls.detail('team-456', { tab: 'roster', season: '2024' });
// /info/teams/team-456?tab=roster&season=2024

// Download URLs
DownloadUrls.download({ platform: 'windows', beta: true });
// /games/download?platform=windows&beta=true

// Cross-hub navigation
HubUrls.buildCrossHubUrl('sator', 'rotas', { preserveParams: true });
// ../hub2-rotas/index.html?hub=sator
```

### Analytics

```javascript
const { analyticsManager, hubTransitionFunnel } = window.SatorRouter;

// Track event
analyticsManager.trackEvent('video_play', { 
  videoId: 'v123', 
  duration: 120 
});

// Track conversion
analyticsManager.trackConversion('signup', 0, { 
  source: 'header_button' 
});

// Get funnel stats
const stats = hubTransitionFunnel.getStats();
// {
//   totalTransitions: 1523,
//   uniquePaths: 47,
//   conversionRate: 3.2
// }
```

### Breadcrumbs

```javascript
const { breadcrumbGenerator, breadcrumbRenderer } = window.SatorRouter;

// Generate items
const items = breadcrumbGenerator.generate('/sator/matches/abc123');
// [
//   { label: 'Home', path: '/', icon: '🏠' },
//   { label: 'SATOR', path: '/sator', icon: '◎', hub: 'sator' },
//   { label: 'Matches', path: '/sator/matches' },
//   { label: 'Match abc...123', path: '/sator/matches/abc123', active: true }
// ]

// Render to DOM
breadcrumbRenderer.render('/sator/matches/abc123', containerElement);
```

### Error Handling

```javascript
const { errorHandler, errorPageGenerator } = window.SatorRouter;

// Handle error programmatically
const errorData = await errorHandler.handle({
  type: 'NOT_FOUND',
  route: '/missing-page'
});

// Generate 404 HTML
const html = errorPageGenerator.generate404('/missing-page');
document.body.innerHTML = html;

// Offline manager
const { offlineManager } = window.SatorRouter;
offlineManager.cacheResources(['/app.js', '/styles.css']);
```

## Framework Integration

### React

```jsx
import { useRouter, usePageTracking, useBreadcrumbs } from './router-hooks';

function MatchDetail({ matchId }) {
  const { navigate, generateShareLink } = useRouter();
  usePageTracking('match_detail');
  const breadcrumbs = useBreadcrumbs();
  
  const handleShare = () => {
    const url = generateShareLink({ 
      name: 'MATCH_DETAIL', 
      params: { id: matchId } 
    });
    navigator.clipboard.writeText(url);
  };
  
  return (
    <div>
      <Breadcrumb items={breadcrumbs('/sator/matches/' + matchId)} />
      <button onClick={() => navigate('/sator/matches')}>
        Back to Matches
      </button>
    </div>
  );
}
```

### Vue

```javascript
// main.js
import routerPlugin from './router-plugin';
app.use(routerPlugin);

// Component.vue
export default {
  async mounted() {
    const result = await this.$guard.guard(this.$route.path);
    if (!result.allowed) {
      this.$router.navigate(result.redirect);
    }
  },
  methods: {
    goToAnalytics() {
      const url = this.$urls.MatchUrls.replay(this.matchId);
      this.$router.navigate(url);
    }
  }
}
```

## Configuration

### Router Options

```javascript
const router = new CrossHubRouter({
  basePath: '/app',
  maxHistorySize: 100,
  enableAnalytics: true,
  enableDeepLinking: true,
});
```

### Analytics Options

```javascript
const analytics = new AnalyticsManager({
  endpoint: '/api/analytics',
  apiKey: 'your-key',
  batchSize: 20,
  flushInterval: 10000,
  sampleRate: 1.0,
});
```

### Route Guard Options

```javascript
const guard = new RouteGuard({
  fallbackRoute: '/login',
  upgradeRoute: '/upgrade',
  verificationRoute: '/verify',
  cacheExpiry: 5 * 60 * 1000, // 5 minutes
});
```

## File Structure

```
website/shared/
├── router/
│   ├── index.js              # Main exports
│   ├── CrossHubRouter.js     # Core router class
│   ├── UrlHelpers.js         # URL utilities
│   ├── RouteGuards.js        # Authentication guards
│   └── examples.js           # Usage examples
├── components/
│   ├── Breadcrumbs.js        # Breadcrumb system
│   └── ErrorHandling.js      # Error pages & recovery
├── analytics/
│   └── AnalyticsIntegration.js # Analytics tracking
└── scripts/
    └── error-recovery.js     # Error recovery script

website/
├── 404.html                  # 404 error page
└── offline.html              # Offline fallback page
```

## Browser Support

- Chrome 80+
- Firefox 75+
- Safari 13.1+
- Edge 80+

Requires:
- ES6 Modules
- History API
- URL API
- CustomEvent

## License

MIT - SATOR Esports Platform
