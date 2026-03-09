[Ver001.000]

# NJZ Platform Deployment Guide

## Overview

This guide covers deployment of the NJZ Platform to Vercel and GitHub Pages.

---

## Vercel Deployment (Recommended)

### Prerequisites
- Vercel CLI: `npm i -g vercel`
- Git repository pushed to GitHub/GitLab
- Node.js 18+ installed

### Project Structure
```
website/
├── njz-central/          # Main portal (static HTML)
├── hub1-sator/           # SATOR hub (static HTML/CSS/JS)
├── hub2-rotas/           # ROTAS hub (Vite + React)
├── hub3-information/     # Information hub (Vite + React)
├── hub4-games/           # Games hub (Next.js)
├── shared/               # Shared components
└── njz-design-system.css # Core design system
```

### Deployment Steps

#### 1. Configure Build Settings

Create `vercel.json` in project root:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "website/njz-central/**",
      "use": "@vercel/static"
    },
    {
      "src": "website/hub1-sator/**",
      "use": "@vercel/static"
    },
    {
      "src": "website/hub2-rotas/dist/**",
      "use": "@vercel/static"
    },
    {
      "src": "website/hub3-information/dist/**",
      "use": "@vercel/static"
    },
    {
      "src": "website/hub4-games/dist/**",
      "use": "@vercel/static"
    }
  ],
  "routes": [
    { "src": "/", "dest": "/website/njz-central/index.html" },
    { "src": "/hub1-sator", "dest": "/website/hub1-sator/index.html" },
    { "src": "/hub2-rotas", "dest": "/website/hub2-rotas/dist/index.html" },
    { "src": "/hub3-information", "dest": "/website/hub3-information/dist/index.html" },
    { "src": "/hub4-games", "dest": "/website/hub4-games/dist/index.html" }
  ]
}
```

#### 2. Build Each Hub

```bash
# From project root

# ROTAS Hub (Vite)
cd website/hub2-rotas
npm install
npm run build

# Information Hub (Vite)
cd ../hub3-information
npm install
npm run build

# Games Hub (Next.js)
cd ../hub4-games
npm install
npm run build
```

#### 3. Deploy to Vercel

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod
```

Or connect Git repository to Vercel Dashboard for automatic deployments.

---

## GitHub Pages Deployment

### Prerequisites
- GitHub repository
- GitHub Pages enabled in repository settings

### Setup

#### 1. Create GitHub Actions Workflow

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install and Build ROTAS
        run: |
          cd website/hub2-rotas
          npm ci
          npm run build
          
      - name: Install and Build Information Hub
        run: |
          cd website/hub3-information
          npm ci
          npm run build
          
      - name: Install and Build Games Hub
        run: |
          cd website/hub4-games
          npm ci
          npm run build
          
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./website
```

#### 2. Configure Base Paths

Update `vite.config.js` for ROTAS and Information hubs:

```javascript
// hub2-rotas/vite.config.js
export default {
  base: '/hub2-rotas/dist/',
  // ... rest of config
}

// hub3-information/vite.config.js
export default {
  base: '/hub3-information/dist/',
  // ... rest of config
}
```

Update `next.config.js` for Games hub:

```javascript
// hub4-games/next.config.js
module.exports = {
  output: 'export',
  distDir: 'dist',
  assetPrefix: '/hub4-games/dist',
  // ... rest of config
}
```

---

## Environment Variables

### Required Variables

| Variable | Description | Required For |
|----------|-------------|--------------|
| `NJZ_API_URL` | Backend API endpoint | API integration |
| `NJZ_ANALYTICS_ID` | Analytics tracking ID | Analytics |
| `NJZ_SENTRY_DSN` | Error tracking | Monitoring |

### Setting Environment Variables

#### Vercel CLI
```bash
vercel env add NJZ_API_URL
vercel env add NJZ_ANALYTICS_ID
```

#### Vercel Dashboard
1. Go to Project Settings
2. Select "Environment Variables"
3. Add key-value pairs

#### GitHub Secrets (for GitHub Actions)
1. Repository Settings → Secrets and variables
2. Add repository secrets

---

## Post-Deploy Verification

### Automated Checks

Create `scripts/verify-deployment.js`:

```javascript
const https = require('https');

const BASE_URL = process.env.DEPLOY_URL;

const checks = [
  { path: '/', name: 'NJZ Central' },
  { path: '/hub1-sator/', name: 'SATOR Hub' },
  { path: '/hub2-rotas/', name: 'ROTAS Hub' },
  { path: '/hub3-information/', name: 'Information Hub' },
  { path: '/hub4-games/', name: 'Games Hub' },
];

async function verify() {
  for (const check of checks) {
    const url = `${BASE_URL}${check.path}`;
    https.get(url, (res) => {
      const status = res.statusCode === 200 ? '✅' : '❌';
      console.log(`${status} ${check.name}: ${res.statusCode}`);
    }).on('error', (e) => {
      console.log(`❌ ${check.name}: ${e.message}`);
    });
  }
}

verify();
```

### Manual Verification Checklist

- [ ] All hubs load without errors
- [ ] Cross-hub navigation works
- [ ] Mobile responsive design verified
- [ ] PWA manifest loads
- [ ] Icons display correctly
- [ ] Fonts load (Space Grotesk, Inter, JetBrains Mono)
- [ ] Animations work (respect reduced-motion)
- [ ] Console has no errors
- [ ] Lighthouse score ≥ 85

---

## Domain Configuration

### Custom Domain (Vercel)

1. **Add Domain in Vercel Dashboard**
   - Project Settings → Domains
   - Add `njz.io` (or your domain)

2. **Configure DNS**
   ```
   Type: A
   Name: @
   Value: 76.76.21.21
   
   Type: CNAME
   Name: www
   Value: cname.vercel-dns.com
   ```

3. **SSL Certificate**
   - Auto-provisioned by Vercel
   - May take up to 24 hours

### Subdomain Routing

For hub-specific subdomains:

```
sator.njz.io → /hub1-sator
rotas.njz.io → /hub2-rotas
info.njz.io → /hub3-information
games.njz.io → /hub4-games
```

Configure in Vercel:
```json
{
  "rewrites": [
    { "source": "/", "destination": "/website/njz-central/index.html" }
  ],
  "redirects": [
    { "source": "sator.njz.io", "destination": "/hub1-sator/" },
    { "source": "rotas.njz.io", "destination": "/hub2-rotas/" }
  ]
}
```

---

## Monitoring & Analytics

### Recommended Setup

#### 1. Vercel Analytics
```bash
vercel analytics enable
```

#### 2. Google Analytics 4
Add to `njz-central/index.html`:
```html
<script async src="https://www.googletagmanager.com/gtag/js?id=GA_MEASUREMENT_ID"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'GA_MEASUREMENT_ID');
</script>
```

#### 3. Sentry Error Tracking
```bash
npm install @sentry/browser
```

```javascript
import * as Sentry from '@sentry/browser';

Sentry.init({
  dsn: 'YOUR_SENTRY_DSN',
  environment: 'production'
});
```

---

## Troubleshooting

### Common Issues

#### 404 on Hub Routes
- Verify `vercel.json` routes configuration
- Check build output directories exist

#### Assets Not Loading
- Check `base` path in Vite/Next.js configs
- Verify asset paths are relative

#### Fonts Not Loading
- Ensure Google Fonts link is in HTML head
- Check CORS headers

#### CORS Errors
- Add to `vercel.json`:
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" }
      ]
    }
  ]
}
```

---

## Support

### Resources
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Vite Docs: https://vitejs.dev/guide/

### Emergency Contacts
- Tech Lead: [Contact Info]
- DevOps: [Contact Info]
- Product: [Contact Info]

---

*Guide version: 1.0*
*Last updated: 2026-03-05*
